import assert from "node:assert/strict";
import http from "node:http";
import { Readable } from "node:stream";
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

async function startHttpServer() {
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
  const address = server.address();
  const host = `127.0.0.1:${address.port}`;
  app = createApp({ allowedHosts: [host] });
  return {
    url: `http://${host}/mcp`,
    app,
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

test("official v2 client discovers and calls a synthetic read-only tool on the modern protocol", async () => {
  const app = createApp();
  const client = modernClient("a5-test-client");
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

test("the same SDK client completes discovery and a tool call over real HTTP", async () => {
  const network = await startHttpServer();
  const client = modernClient("a5-network-test-client");
  const transport = new StreamableHTTPClientTransport(new URL(network.url), {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("authorization", `Bearer ${validToken}`);
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

test("oversized streamed request bodies are rejected with a bounded read", async () => {
  const app = createApp({ maxBodyBytes: 8 });
  try {
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
        authorization: `Bearer ${validToken}`,
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

test("authenticated clients without the required tool scope cannot call the tool", async () => {
  const app = createApp({
    verifyBearerToken: async () => ({
      token: "scope-limited",
      clientId: "scope-limited-client",
      scopes: []
    })
  });
  const client = modernClient("a5-scope-test-client");
  try {
    await client.connect(inProcessTransport(app, "scope-limited"));
    const result = await client.callTool({
      name: "extensions_health_read",
      arguments: {}
    });
    assert.equal(result.isError, true);
  } finally {
    await client.close();
    await app.close();
  }
});
