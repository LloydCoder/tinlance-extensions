import assert from "node:assert/strict";
import http from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { generateKeyPair, SignJWT } from "jose";
import { createConformanceApp, REQUIRED_SCOPE } from "./server.mjs";

const ISSUER = "https://issuer.test";
const RESOURCE = "https://extensions.test/mcp";
const RESOURCE_METADATA = "https://extensions.test/.well-known/oauth-protected-resource/mcp";
const { publicKey, privateKey } = await generateKeyPair("EdDSA");

async function signedToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    client_id: "a5-conformance-client",
    tenant_id: "tenant-test-001",
    scope: REQUIRED_SCOPE,
    ...overrides.claims
  };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "EdDSA", typ: overrides.typ ?? "at+jwt" })
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? RESOURCE)
    .setSubject("synthetic-user-001")
    .setIssuedAt(now)
    .setExpirationTime(overrides.expiresAt ?? now + 300)
    .sign(privateKey);
}

function createApp(overrides = {}) {
  return createConformanceApp({
    publicKey,
    issuer: ISSUER,
    resourceUrl: RESOURCE,
    allowedHostnames: ["test.local"],
    allowedOriginHostnames: ["test.local", "trusted.test"],
    ...overrides
  });
}

function inProcessTransport(app, token) {
  return new StreamableHTTPClientTransport(new URL("http://test.local/mcp"), {
    fetch: (url, init) => {
      const headers = new Headers(init?.headers);
      headers.set("host", new URL(url).host);
      if (token) headers.set("authorization", `Bearer ${token}`);
      return app.fetch(new Request(url, { ...init, headers }));
    }
  });
}

async function startHttpServer(overrides = {}) {
  let app;
  const receivedHeaders = [];
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      receivedHeaders.push({ ...incoming.headers });
      const body = ["GET", "HEAD"].includes(incoming.method) ? undefined : Readable.toWeb(incoming);
      const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
        method: incoming.method,
        headers: incoming.headers,
        body,
        ...(body ? { duplex: "half" } : {})
      });
      const response = await app.fetch(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) {
        for await (const chunk of response.body) outgoing.write(chunk);
      }
      outgoing.end();
    } catch {
      outgoing.writeHead(500);
      outgoing.end();
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  app = createApp({ allowedHostnames: ["127.0.0.1"], allowedOriginHostnames: ["127.0.0.1"], ...overrides });
  const address = server.address();
  const host = `127.0.0.1:${address.port}`;
  return {
    url: `http://${host}/mcp`,
    receivedHeaders,
    close: async () => {
      await app.close();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  };
}

function modernClient(name) {
  return new Client(
    { name, version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } }
  );
}

async function rawRequest(app, { token, host = "test.local", origin, body = "{}" } = {}) {
  const headers = { host, "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (origin) headers.origin = origin;
  return app.fetch(new Request(`http://${host}/mcp`, {
    method: "POST",
    headers,
    body
  }));
}

test("signed EdDSA access token passes the official SDK bearer gate and modern MCP client call", async () => {
  const app = createApp();
  const token = await signedToken();
  const client = modernClient("a5-signed-token-client");
  try {
    await client.connect(inProcessTransport(app, token));
    assert.equal(client.getProtocolEra(), "modern");
    const result = await client.callTool({
      name: "extensions_health_read",
      arguments: {}
    });
    assert.deepEqual(result.structuredContent, {
      status: "ok",
      protocol: "2026-07-28"
    });
    assert.equal(result.isError, undefined);
  } finally {
    await client.close();
    await app.close();
  }
});

test("signed token completes discovery and read-only call over real loopback HTTP", async () => {
  const network = await startHttpServer();
  const token = await signedToken();
  const client = modernClient("a5-network-signed-token-client");
  const transport = new StreamableHTTPClientTransport(new URL(network.url), {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    }
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: "extensions_health_read",
      arguments: {}
    });
    assert.equal(client.getProtocolEra(), "modern");
    assert.deepEqual(result.structuredContent, {
      status: "ok",
      protocol: "2026-07-28"
    });
    assert.ok(network.receivedHeaders.length >= 2);
    for (const headers of network.receivedHeaders) {
      assert.equal(headers["mcp-protocol-version"], "2026-07-28");
      assert.ok(headers["mcp-method"], "every stateless request carries Mcp-Method");
      if (["tools/call", "prompts/get", "resources/read"].includes(headers["mcp-method"])) {
        assert.ok(headers["mcp-name"], "named MCP operations carry Mcp-Name");
      }
      assert.equal(headers["mcp-session-id"], undefined, "modern requests must not use protocol sessions");
    }
    assert.ok(network.receivedHeaders.some((headers) =>
      headers["mcp-method"] === "tools/call" &&
      headers["mcp-name"] === "extensions_health_read"
    ));
  } finally {
    await client.close();
    await network.close();
  }
});

test("missing and malformed bearer credentials return SDK OAuth 401 challenges", async () => {
  const app = createApp();
  try {
    const missing = await rawRequest(app);
    assert.equal(missing.status, 401);
    assert.match(missing.headers.get("www-authenticate"), /Bearer/);
    assert.match(missing.headers.get("www-authenticate"), new RegExp(RESOURCE_METADATA.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const malformed = await rawRequest(app, { token: "not-a-jwt" });
    assert.equal(malformed.status, 401);
    assert.match(await malformed.text(), /invalid_token/);
  } finally {
    await app.close();
  }
});

test("JWT issuer, audience, expiry and access-token type are validated fail-closed", async () => {
  const app = createApp();
  try {
    const invalidTokens = [
      await signedToken({ issuer: "https://attacker.test" }),
      await signedToken({ audience: "https://other-resource.test/mcp" }),
      await signedToken({ expiresAt: Math.floor(Date.now() / 1000) - 60 }),
      await signedToken({ typ: "JWT" }),
      await signedToken({ claims: { tenant_id: undefined } })
    ];
    for (const token of invalidTokens) {
      const response = await rawRequest(app, { token });
      assert.equal(response.status, 401);
      assert.match(await response.text(), /invalid_token/);
    }
  } finally {
    await app.close();
  }
});

test("valid token without the required scope receives 403 insufficient_scope", async () => {
  const app = createApp();
  try {
    const token = await signedToken({ claims: { scope: "profile:read" } });
    const response = await rawRequest(app, { token });
    assert.equal(response.status, 403);
    assert.match(response.headers.get("www-authenticate"), /insufficient_scope/);
  } finally {
    await app.close();
  }
});

test("SDK Host and Origin guards reject untrusted authorities", async () => {
  const app = createApp();
  try {
    const hostResponse = await rawRequest(app, {
      token: await signedToken(),
      host: "attacker.test"
    });
    assert.equal(hostResponse.status, 403);

    const originResponse = await rawRequest(app, {
      token: await signedToken(),
      origin: "https://attacker.test"
    });
    assert.equal(originResponse.status, 403);
  } finally {
    await app.close();
  }
});

test("oversized streamed bodies are rejected after authentication with a bounded read", async () => {
  const app = createApp({ maxBodyBytes: 8 });
  try {
    const token = await signedToken();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("123456"));
        controller.enqueue(new TextEncoder().encode("7890"));
        controller.close();
      }
    });
    const response = await app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: {
        host: "test.local",
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: stream,
      duplex: "half"
    }));
    assert.equal(response.status, 413);
  } finally {
    await app.close();
  }
});
