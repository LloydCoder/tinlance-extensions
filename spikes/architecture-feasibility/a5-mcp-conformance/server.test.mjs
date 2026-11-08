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
const OAUTH_METADATA = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/authorize`,
  token_endpoint: `${ISSUER}/token`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  token_endpoint_auth_methods_supported: ["none"],
  code_challenge_methods_supported: ["S256"],
  scopes_supported: [REQUIRED_SCOPE],
  authorization_response_iss_parameter_supported: true,
  client_id_metadata_document_supported: true
};
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
    oauthMetadata: OAUTH_METADATA,
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


async function rawModernToolRequest(app, token, {
  methodHeader = "tools/call",
  nameHeader = "extensions_health_read",
  protocolHeader = "2026-07-28",
  bodyMethod = "tools/call",
  bodyName = "extensions_health_read",
  bodyProtocol = "2026-07-28"
} = {}) {
  const headers = {
    host: "test.local",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": protocolHeader
  };
  if (methodHeader !== null) headers["mcp-method"] = methodHeader;
  if (nameHeader !== null) headers["mcp-name"] = nameHeader;
  return app.fetch(new Request("http://test.local/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 91,
      method: bodyMethod,
      params: {
        name: bodyName,
        arguments: {},
        _meta: {
          "io.modelcontextprotocol/protocolVersion": bodyProtocol,
          "io.modelcontextprotocol/clientCapabilities": {},
          "io.modelcontextprotocol/clientInfo": {
            name: "a5-raw-wire-test",
            version: "1.0.0"
          }
        }
      }
    })
  }));
}

async function assertHeaderMismatch(response) {
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error?.code, -32020);
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

test("oversized chunked bodies are bounded across the actual HTTP adapter", async () => {
  const network = await startHttpServer({ maxBodyBytes: 8 });
  try {
    const token = await signedToken();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("123456"));
        controller.enqueue(new TextEncoder().encode("7890"));
        controller.close();
      }
    });
    const response = await fetch(network.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: stream,
      duplex: "half"
    });
    assert.equal(response.status, 413);
  } finally {
    await network.close();
  }
});


test("raw modern HTTP rejects a missing Mcp-Method header", async () => {
  const app = createApp();
  try {
    await assertHeaderMismatch(await rawModernToolRequest(app, await signedToken(), { methodHeader: null }));
  } finally {
    await app.close();
  }
});

test("raw modern HTTP rejects a missing Mcp-Name header for tools/call", async () => {
  const app = createApp();
  try {
    await assertHeaderMismatch(await rawModernToolRequest(app, await signedToken(), { nameHeader: null }));
  } finally {
    await app.close();
  }
});

test("raw modern HTTP rejects Mcp-Method that disagrees with the JSON-RPC method", async () => {
  const app = createApp();
  try {
    await assertHeaderMismatch(await rawModernToolRequest(app, await signedToken(), { methodHeader: "tools/list" }));
  } finally {
    await app.close();
  }
});

test("raw modern HTTP rejects Mcp-Name that disagrees with params.name", async () => {
  const app = createApp();
  try {
    await assertHeaderMismatch(await rawModernToolRequest(app, await signedToken(), { nameHeader: "other_tool" }));
  } finally {
    await app.close();
  }
});

test("raw modern HTTP rejects protocol-version header that disagrees with request metadata", async () => {
  const app = createApp();
  try {
    await assertHeaderMismatch(await rawModernToolRequest(app, await signedToken(), { protocolHeader: "2025-11-25" }));
  } finally {
    await app.close();
  }
});


test("raw modern HTTP returns the supported-version list for an unsupported protocol revision", async () => {
  const app = createApp();
  try {
    const response = await rawModernToolRequest(app, await signedToken(), {
      protocolHeader: "1900-01-01",
      bodyProtocol: "1900-01-01"
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error?.code, -32022);
    assert.equal(payload.error?.data?.requested, "1900-01-01");
    assert.ok(payload.error?.data?.supported?.includes("2026-07-28"));
  } finally {
    await app.close();
  }
});

test("raw modern HTTP returns a JSON-RPC parse error for malformed JSON", async () => {
  const app = createApp();
  try {
    const token = await signedToken();
    const response = await app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: {
        host: "test.local",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2026-07-28",
        "mcp-method": "tools/call",
        "mcp-name": "extensions_health_read"
      },
      body: '{"jsonrpc":'
    }));
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error?.code, -32700);
  } finally {
    await app.close();
  }
});


test("RFC 9728 protected-resource metadata is publicly served and points to the configured issuer", async () => {
  const app = createApp();
  try {
    const response = await app.fetch(new Request("http://test.local/.well-known/oauth-protected-resource/mcp", {
      headers: { host: "test.local" }
    }));
    assert.equal(response.status, 200);
    const metadata = await response.json();
    assert.equal(metadata.resource, RESOURCE);
    assert.deepEqual(metadata.authorization_servers, [ISSUER]);
    assert.ok(metadata.bearer_methods_supported.includes("header"));
  } finally {
    await app.close();
  }
});

test("RFC 8414 authorization-server metadata mirror preserves issuer and advertises hardened client discovery", async () => {
  const app = createApp();
  try {
    const response = await app.fetch(new Request("http://test.local/.well-known/oauth-authorization-server", {
      headers: { host: "test.local" }
    }));
    assert.equal(response.status, 200);
    const metadata = await response.json();
    assert.equal(metadata.issuer, ISSUER);
    assert.equal(metadata.authorization_response_iss_parameter_supported, true);
    assert.equal(metadata.client_id_metadata_document_supported, true);
    assert.ok(metadata.code_challenge_methods_supported.includes("S256"));
    assert.ok(metadata.scopes_supported.includes(REQUIRED_SCOPE));
  } finally {
    await app.close();
  }
});
