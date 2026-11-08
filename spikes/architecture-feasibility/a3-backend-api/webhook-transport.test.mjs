import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import http from "node:http";
import test from "node:test";
import { createSignedWebhookTransport } from "./webhook-transport.mjs";

const SECRET = "test-webhook-secret-material-32-bytes";
const EVENT = {
  id: "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678",
  tenantId: "tenant-a",
  aggregateId: "b4f6d9e2-1c3b-4a5d-8e7f-9012bc345678",
  eventType: "job.completed",
  payload: { status: "succeeded", count: 1 },
  createdAt: "2026-11-08T20:00:00.000Z"
};

async function startReceiver(handler) {
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => handler(request, response, Buffer.concat(chunks)));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/events`,
    close: async () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    )
  };
}

test("signed webhook sends bounded event envelope, HMAC signature and stable idempotency key", async () => {
  let captured;
  const receiver = await startReceiver((request, response, body) => {
    captured = { headers: request.headers, body: body.toString("utf8") };
    response.writeHead(202, { "content-type": "application/json" });
    response.end(JSON.stringify({ accepted: true }));
  });
  try {
    const transport = createSignedWebhookTransport({
      endpoint: receiver.url,
      allowedHostnames: ["127.0.0.1"],
      secret: SECRET,
      allowLoopbackHttp: true
    });
    await transport(EVENT, { idempotencyKey: EVENT.id });
    const timestamp = captured.headers["x-tinlance-timestamp"];
    assert.match(timestamp, /^\d{10}$/);
    assert.equal(captured.headers["idempotency-key"], EVENT.id);
    assert.equal(captured.headers["x-tinlance-event-type"], EVENT.eventType);
    assert.equal(captured.headers["x-tinlance-tenant-id"], EVENT.tenantId);
    assert.equal(captured.headers["content-type"], "application/json");
    const expected = createHmac("sha256", SECRET)
      .update(`${timestamp}.${captured.body}`, "utf8")
      .digest("hex");
    assert.equal(captured.headers["x-tinlance-signature"], `v1=${expected}`);
    assert.deepEqual(JSON.parse(captured.body), EVENT);
  } finally {
    await receiver.close();
  }
});

test("signed webhook rejects untrusted endpoints, weak secrets and invalid configuration", () => {
  assert.throws(() => createSignedWebhookTransport({
    endpoint: "https://attacker.example/events",
    allowedHostnames: ["hooks.example"],
    secret: SECRET
  }), /allowlist/);
  assert.throws(() => createSignedWebhookTransport({
    endpoint: "http://10.0.0.8/events",
    allowedHostnames: ["10.0.0.8"],
    secret: SECRET,
    allowLoopbackHttp: true
  }), /loopback/);
  assert.throws(() => createSignedWebhookTransport({
    endpoint: "https://hooks.example/events",
    allowedHostnames: ["hooks.example"],
    secret: "too-short"
  }), /32 bytes/);
  assert.throws(() => createSignedWebhookTransport({
    endpoint: "https://user:pass@hooks.example/events",
    allowedHostnames: ["hooks.example"],
    secret: SECRET
  }), /credentials/);
});

test("signed webhook rejects mismatched idempotency keys and oversized payloads before network I/O", async () => {
  let calls = 0;
  const transport = createSignedWebhookTransport({
    endpoint: "https://hooks.example/events",
    allowedHostnames: ["hooks.example"],
    secret: SECRET,
    fetchImpl: async () => {
      calls += 1;
      return new Response(null, { status: 202 });
    },
    maxBodyBytes: 1024
  });
  await assert.rejects(transport(EVENT, { idempotencyKey: "different-event-id" }), /must equal event ID/);
  const oversized = { ...EVENT, payload: { text: "x".repeat(2048) } };
  await assert.rejects(transport(oversized, { idempotencyKey: EVENT.id }), /payload exceeds/);
  assert.equal(calls, 0);
});

test("signed webhook propagates cancellation and rejects redirects and non-success responses", async () => {
  const controller = new AbortController();
  const pending = createSignedWebhookTransport({
    endpoint: "https://hooks.example/events",
    allowedHostnames: ["hooks.example"],
    secret: SECRET,
    fetchImpl: (_url, options) => new Promise((_, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    })
  })(EVENT, { idempotencyKey: EVENT.id, signal: controller.signal });
  controller.abort();
  await assert.rejects(pending);

  const redirecting = createSignedWebhookTransport({
    endpoint: "https://hooks.example/events",
    allowedHostnames: ["hooks.example"],
    secret: SECRET,
    fetchImpl: async () => new Response(null, {
      status: 302,
      headers: { location: "https://attacker.example/collect" }
    })
  });
  await assert.rejects(redirecting(EVENT, { idempotencyKey: EVENT.id }), /redirect/);

  const unavailable = createSignedWebhookTransport({
    endpoint: "https://hooks.example/events",
    allowedHostnames: ["hooks.example"],
    secret: SECRET,
    fetchImpl: async () => new Response(null, { status: 503 })
  });
  await assert.rejects(unavailable(EVENT, { idempotencyKey: EVENT.id }), /unavailable/);
});
