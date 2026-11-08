import assert from "node:assert/strict";
import http from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { generateKeyPair, SignJWT } from "jose";
import {
  createConformanceApp,
  REQUIRED_SCOPE,
  ACTION_SCOPE,
  ACTION_TOOL_NAME,
  ACTION_RESOURCE_ID,
  platformActionPurpose
} from "./server.mjs";

const ISSUER = "https://issuer.test";
const { publicKey, privateKey } = await generateKeyPair("EdDSA");

async function signedToken(resourceUrl) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    client_id: "a5-network-cancellation-client",
    tenant_id: "tenant-test-001",
    scope: REQUIRED_SCOPE + " " + ACTION_SCOPE,
    purpose: platformActionPurpose(
      "tenant-test-001",
      "network-cancellation-subject",
      ACTION_TOOL_NAME,
      ACTION_RESOURCE_ID
    )
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "at+jwt" })
    .setIssuer(ISSUER)
    .setAudience(resourceUrl)
    .setSubject("network-cancellation-subject")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);
}

async function startNetworkFixture({ onToolStart, onToolAbort }) {
  let app;
  const server = http.createServer(async (incoming, outgoing) => {
    const controller = new AbortController();
    incoming.once("aborted", () => controller.abort());
    outgoing.once("close", () => {
      if (!outgoing.writableEnded) controller.abort();
    });
    try {
      const body = ["GET", "HEAD"].includes(incoming.method)
        ? undefined
        : Readable.toWeb(incoming);
      const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
        method: incoming.method,
        headers: incoming.headers,
        body,
        signal: controller.signal,
        ...(body ? { duplex: "half" } : {})
      });
      const response = await app.fetch(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) {
        for await (const chunk of response.body) {
          if (outgoing.destroyed) break;
          outgoing.write(chunk);
        }
      }
      if (!outgoing.destroyed) outgoing.end();
    } catch {
      if (!outgoing.destroyed) {
        outgoing.writeHead(500);
        outgoing.end();
      }
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const resourceUrl = `${origin}/mcp`;
  app = createConformanceApp({
    publicKey,
    issuer: ISSUER,
    resourceUrl,
    oauthMetadata: {
      issuer: ISSUER,
      authorization_endpoint: "https://issuer.test/authorize",
      token_endpoint: "https://issuer.test/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    },
    allowedHostnames: ["127.0.0.1"],
    allowedOriginHostnames: ["127.0.0.1"],
    onToolStart,
    onToolAbort
  });
  return {
    url: resourceUrl,
    close: async () => {
      await app.close();
      server.closeAllConnections();
      await new Promise((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve())
      );
    }
  };
}

test("loopback HTTP disconnect propagates cancellation into in-flight MCP tool work", async () => {
  let markStarted;
  let markAborted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  const aborted = new Promise((resolve) => { markAborted = resolve; });
  const network = await startNetworkFixture({
    onToolStart: markStarted,
    onToolAbort: markAborted
  });
  const token = await signedToken(network.url);
  const client = new Client(
    { name: "a5-network-cancellation-client", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } }
  );
  try {
    const transport = new StreamableHTTPClientTransport(new URL(network.url), {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      }
    });
    await client.connect(transport);
    const controller = new AbortController();
    const pending = client.callTool(
      { name: "extensions_cancel_probe", arguments: { delayMs: 5000 } },
      { signal: controller.signal }
    );
    await started;
    controller.abort();
    await assert.rejects(pending, (error) =>
      error?.name === "AbortError" || /abort/i.test(String(error?.message))
    );
    await Promise.race([
      aborted,
      new Promise((_, reject) => setTimeout(
        () => reject(new Error("server did not observe network disconnect within 1500ms")),
        1500
      ))
    ]);
  } finally {
    await client.close();
    await network.close();
  }
});
