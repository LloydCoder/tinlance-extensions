import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export const REQUIRED_SCOPE = "extensions:conformance.read";
export const MAX_BODY_BYTES = 64 * 1024;

function jsonError(status, code, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

async function readBoundedBody(request, limit) {
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function createConformanceApp({
  verifyBearerToken,
  allowedHosts,
  allowedOrigins = [],
  maxBodyBytes = MAX_BODY_BYTES
}) {
  if (typeof verifyBearerToken !== "function") {
    throw new TypeError("verifyBearerToken must be supplied");
  }

  const hosts = new Set(allowedHosts.map((host) => host.toLowerCase()));
  const origins = new Set(allowedOrigins);

  const handler = createMcpHandler(({ era }) => {
    const server = new McpServer({
      name: "tinlance-extensions-a5-conformance",
      version: "0.1.0"
    });

    server.registerTool(
      "extensions_health_read",
      {
        description: "Return a synthetic, read-only conformance health result.",
        inputSchema: z.object({}).strict(),
        outputSchema: z.object({
          status: z.literal("ok"),
          protocol: z.literal("2026-07-28")
        })
      },
      async (_input, context) => {
        const authInfo = context.http?.authInfo;
        if (!authInfo?.scopes?.includes(REQUIRED_SCOPE)) {
          return {
            content: [{ type: "text", text: "insufficient scope" }],
            isError: true
          };
        }
        if (era !== "modern") {
          return {
            content: [{ type: "text", text: "unsupported protocol era" }],
            isError: true
          };
        }
        return {
          content: [{ type: "text", text: "ok" }],
          structuredContent: { status: "ok", protocol: "2026-07-28" }
        };
      }
    );

    return server;
  }, { legacy: "reject" });

  return {
    async fetch(request) {
      const requestUrl = new URL(request.url);
      const requestHost = requestUrl.host.toLowerCase();
      const suppliedHost = request.headers.get("host")?.toLowerCase();
      // Fetch Request objects may omit the forbidden Host header. The URL
      // authority is then the normalized host supplied by the HTTP adapter.
      if (suppliedHost && suppliedHost !== requestHost) return jsonError(403, "forbidden");
      if (!hosts.has(requestHost)) return jsonError(403, "forbidden");

      const origin = request.headers.get("origin");
      if (origin !== null && !origins.has(origin)) return jsonError(403, "forbidden");

      const authorization = request.headers.get("authorization") ?? "";
      const match = /^Bearer (\S+)$/.exec(authorization);
      if (!match) {
        return jsonError(401, "unauthorized", {
          "www-authenticate": 'Bearer realm="tinlance-extensions-mcp"'
        });
      }

      let authInfo;
      try {
        authInfo = await verifyBearerToken(match[1]);
      } catch {
        return jsonError(401, "unauthorized", {
          "www-authenticate": 'Bearer realm="tinlance-extensions-mcp"'
        });
      }
      if (!authInfo || !Array.isArray(authInfo.scopes)) {
        return jsonError(401, "unauthorized", {
          "www-authenticate": 'Bearer realm="tinlance-extensions-mcp"'
        });
      }

      if (request.body) {
        const declared = request.headers.get("content-length");
        if (declared !== null) {
          const declaredLength = Number(declared);
          if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
            return jsonError(400, "invalid_content_length");
          }
          if (declaredLength > maxBodyBytes) return jsonError(413, "request_too_large");
        }

        const body = await readBoundedBody(request, maxBodyBytes);
        if (body === null) return jsonError(413, "request_too_large");
        const forwarded = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body,
          signal: request.signal
        });
        return handler.fetch(forwarded, { authInfo });
      }

      return handler.fetch(request, { authInfo });
    },
    close: () => handler.close()
  };
}
