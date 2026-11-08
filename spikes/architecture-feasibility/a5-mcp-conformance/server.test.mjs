import assert from "node:assert/strict";
import test from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createConformanceApp, REQUIRED_SCOPE } from "./server.mjs";

const validToken = "synthetic-test-token";
const authInfo = {
  token: validToken,
  clientId: "a5-conformance-test-client",
  scopes: [REQUIRED_SCOPE]
};

function createApp(overrides = {}) {
  return createConformanceApp({
    verifyBearerToken: async (token) => token === validToken ? authInfo : null,
    allowedHosts: ["test.local"],
    allowedOrigins: ["https://trusted.test", "http://test.local"],
    ...overrides
  });
}

function inProcessTransport(app, token = validToken) {
  return new StreamableHTTPClientTransport(new URL("http://test.local/mcp"), {
    fetch: (url, init) => {
      const headers = new Headers(init?.headers);
      headers.set("authorization", `Bearer ${token}`);
      return app.fetch(new Request(url, { ...init, headers }));
    }
  });
}

test("official v2 client discovers and calls a synthetic read-only tool on the modern protocol", async () => {
  const app = createApp();
  const client = new Client(
    { name: "a5-test-client", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } }
  );
  try {
    await client.connect(inProcessTransport(app));
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

test("requests without bearer credentials are rejected before MCP dispatch", async () => {
  const app = createApp();
  try {
    const response = await app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: { host: "test.local", "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server/discover" })
    }));
    assert.equal(response.status, 401);
    assert.match(response.headers.get("www-authenticate"), /^Bearer /);
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    await app.close();
  }
});

test("invalid bearer credentials fail closed", async () => {
  const app = createApp();
  try {
    const response = await app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: {
        host: "test.local",
        authorization: "Bearer invalid",
        "content-type": "application/json"
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server/discover" })
    }));
    assert.equal(response.status, 401);
  } finally {
    await app.close();
  }
});

test("untrusted Host and Origin values are rejected before MCP dispatch", async () => {
  const app = createApp();
  try {
    const hostResponse = await app.fetch(new Request("http://attacker.test/mcp", {
      method: "POST",
      headers: { host: "attacker.test", authorization: `Bearer ${validToken}` },
      body: "{}"
    }));
    assert.equal(hostResponse.status, 403);

    const originResponse = await app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: {
        host: "test.local",
        origin: "https://attacker.test",
        authorization: `Bearer ${validToken}`
      },
      body: "{}"
    }));
    assert.equal(originResponse.status, 403);
  } finally {
    await app.close();
  }
});

test("oversized request bodies are rejected before MCP dispatch", async () => {
  const app = createApp({ maxBodyBytes: 8 });
  try {
    const response = await app.fetch(new Request("http://test.local/mcp", {
      method: "POST",
      headers: {
        host: "test.local",
        authorization: `Bearer ${validToken}`,
        "content-type": "application/json"
      },
      body: "0123456789"
    }));
    assert.equal(response.status, 413);
  } finally {
    await app.close();
  }
});
