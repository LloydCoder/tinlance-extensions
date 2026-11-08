import assert from "node:assert/strict";
import http from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { createConformanceApp, REQUIRED_SCOPE, ACTION_SCOPE, ACTION_TOOL_NAME, ACTION_RESOURCE_ID, platformActionPurpose } from "./server.mjs";

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
  const subject = overrides.subject ?? "synthetic-user-001";
  const claims = {
    client_id: "a5-conformance-client",
    tenant_id: "tenant-test-001",
    scope: REQUIRED_SCOPE + " " + ACTION_SCOPE,
    ...overrides.claims
  };
  if (claims.purpose === undefined && typeof claims.tenant_id === "string") {
    claims.purpose = platformActionPurpose(
      claims.tenant_id,
      subject,
      ACTION_TOOL_NAME,
      ACTION_RESOURCE_ID
    );
  }
  return new SignJWT(claims)
    .setProtectedHeader({
      alg: "EdDSA",
      typ: overrides.typ ?? "at+jwt",
      ...(overrides.kid ? { kid: overrides.kid } : {})
    })
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? RESOURCE)
    .setSubject(subject)
    .setIssuedAt(now)
    .setExpirationTime(overrides.expiresAt ?? now + 300)
    .sign(overrides.signingKey ?? privateKey);
}


async function startJwksServer(initialKeys) {
  let keys = initialKeys;
  const server = http.createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/.well-known/jwks.json") {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "public, max-age=60"
    });
    response.end(JSON.stringify({ keys }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/.well-known/jwks.json`,
    setKeys(nextKeys) { keys = nextKeys; },
    close: async () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    )
  };
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
  bodyProtocol = "2026-07-28",
  argumentsValue = {}
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
        arguments: argumentsValue,
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
      await signedToken({ claims: { tenant_id: undefined } }),
      await signedToken({ subject: "" }),
      await signedToken({ claims: { client_id: "" } }),
      await signedToken({ claims: { tenant_id: "" } })
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


test("Platform action-purpose canonicalization matches the shared A3 contract vectors", () => {
  assert.equal(
    platformActionPurpose(
      "tenant-a",
      "oidc-user-42",
      "extensions_job_cancel",
      "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678"
    ),
    "extensions-action-v1:6fb56c1543260cac3fb1c1285c1e71ccf79482d1dbe0a0c46f9a7a997e479d77"
  );
  assert.equal(
    platformActionPurpose(
      "tenant-a",
      "oidc-user-42",
      "extensions_dead_letter_replay",
      "c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679",
      "replay-idempotency-0001"
    ),
    "extensions-action-v1:441761504df27dcdab9d9c0af40923a9bb402e7d0f5c32faea700b90a806d2b8"
  );
});

test("MCP tool action requires exact Platform purpose, tenant, resource, and action scope", async () => {
  const app = createApp();
  try {
    const noActionScope = await signedToken({ claims: { scope: REQUIRED_SCOPE } });
    const scopeDenied = await rawModernToolRequest(app, noActionScope);
    assert.equal(scopeDenied.status, 403);
    assert.match(scopeDenied.headers.get("www-authenticate"), /insufficient_scope/);
    assert.match(scopeDenied.headers.get("www-authenticate"), /extensions:health:read/);

    const wrongAction = await signedToken({
      claims: {
        purpose: platformActionPurpose(
          "tenant-test-001",
          "synthetic-user-001",
          "extensions_health_write",
          ACTION_RESOURCE_ID
        )
      }
    });
    const actionDenied = await rawModernToolRequest(app, wrongAction);
    assert.equal(actionDenied.status, 403);
    assert.match(actionDenied.headers.get("www-authenticate"), /insufficient_scope/);

    const wrongResource = await signedToken({
      claims: {
        purpose: platformActionPurpose(
          "tenant-test-001",
          "synthetic-user-001",
          ACTION_TOOL_NAME,
          "another-resource"
        )
      }
    });
    const resourceDenied = await rawModernToolRequest(app, wrongResource);
    assert.equal(resourceDenied.status, 403);

    const otherTenant = await signedToken({
      claims: { tenant_id: "tenant-other-002" }
    });
    const tenantDenied = await rawModernToolRequest(app, otherTenant);
    assert.equal(tenantDenied.status, 403);
  } finally {
    await app.close();
  }
});

test("strict tool input schema prevents caller-supplied tenant or resource override", async () => {
  const app = createApp();
  try {
    const token = await signedToken();
    const response = await rawModernToolRequest(app, token, {
      argumentsValue: { tenant_id: "tenant-other-002", resource_id: "another-resource" }
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.notEqual(payload.result?.structuredContent?.status, "ok");
    assert.ok(payload.error);
  } finally {
    await app.close();
  }
});


test("remote JWKS verifies signed access tokens and rejects unknown kids or invalid signatures", async () => {
  const { publicKey: remotePublicKey, privateKey: remotePrivateKey } = await generateKeyPair("EdDSA");
  const jwk = await exportJWK(remotePublicKey);
  jwk.kid = "a5-jwks-key-1";
  jwk.alg = "EdDSA";
  jwk.use = "sig";
  const jwks = await startJwksServer([jwk]);
  const app = createApp({ jwksUrl: jwks.url });
  const client = modernClient("a5-remote-jwks-client");
  try {
    const token = await signedToken({ signingKey: remotePrivateKey, kid: jwk.kid });
    await client.connect(inProcessTransport(app, token));
    const result = await client.callTool({
      name: "extensions_health_read",
      arguments: {}
    });
    assert.deepEqual(result.structuredContent, {
      status: "ok",
      protocol: "2026-07-28"
    });
    await client.close();

    const unknownKidToken = await signedToken({
      signingKey: remotePrivateKey,
      kid: "unknown-key"
    });
    const unknownKidResponse = await rawRequest(app, { token: unknownKidToken });
    assert.equal(unknownKidResponse.status, 401);

    const { privateKey: wrongPrivateKey } = await generateKeyPair("EdDSA");
    const invalidSignatureToken = await signedToken({
      signingKey: wrongPrivateKey,
      kid: jwk.kid
    });
    const invalidSignatureResponse = await rawRequest(app, { token: invalidSignatureToken });
    assert.equal(invalidSignatureResponse.status, 401);
  } finally {
    await client.close().catch(() => {});
    await app.close();
    await jwks.close();
  }
});

test("remote JWKS endpoints require HTTPS except for loopback test hosts", () => {
  assert.throws(
    () => createApp({ jwksUrl: "http://jwks.attacker.test/.well-known/jwks.json" }),
    /JWKS endpoint must use HTTPS/
  );
});


test("slow request bodies are rejected at the configured read deadline", async () => {
  const app = createApp({ maxBodyDurationMs: 25 });
  try {
    const token = await signedToken();
    const stream = new ReadableStream({
      pull() {
        return new Promise(() => {});
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
    assert.equal(response.status, 408);
    assert.deepEqual(await response.json(), { error: "request_timeout" });
  } finally {
    await app.close();
  }
});

test("aborted request bodies stop reading and fail closed", async () => {
  const app = createApp({ maxBodyDurationMs: 5_000 });
  const controller = new AbortController();
  try {
    const token = await signedToken();
    const stream = new ReadableStream({
      pull() {
        return new Promise(() => {});
      }
    });
    const pending = app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: {
        host: "test.local",
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: stream,
      signal: controller.signal,
      duplex: "half"
    }));
    setTimeout(() => controller.abort(), 20);
    const response = await pending;
    assert.equal(response.status, 408);
    assert.deepEqual(await response.json(), { error: "request_aborted" });
  } finally {
    await app.close();
  }
});
