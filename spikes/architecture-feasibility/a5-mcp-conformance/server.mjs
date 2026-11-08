import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export const REQUIRED_SCOPE = "extensions:conformance.read";
export const MAX_BODY_BYTES = 64 * 1024;

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "www-authenticate": 'Bearer realm="tinlance-extensions-mcp"'
    }
  });
}

function forbidden() {
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

function tooLarge() {
  return new Response(JSON.stringify({ error: "request_too_large" }), {
    status: 413,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
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
      const host = request.headers.get("host")?.toLowerCase();
      if (!host || !hosts.has(host)) return forbidden();

      const origin = request.headers.get("origin");
      if (origin !== null && !origins.has(origin)) return forbidden();

      const declaredLength = Number(request.headers.get("content-length") ?? 0);
      if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
        return tooLarge();
      }

      if (request.body) {
        const body = await request.clone().arrayBuffer();
        if (body.byteLength > maxBodyBytes) return tooLarge();
      }

      const authorization = request.headers.get("authorization") ?? "";
      const match = /^Bearer ([^\s]+)$/.exec(authorization);
      if (!match) return unauthorized();

      let authInfo;
      try {
        authInfo = await verifyBearerToken(match[1]);
      } catch {
        return unauthorized();
      }
      if (!authInfo || !Array.isArray(authInfo.scopes)) return unauthorized();

      return handler.fetch(request, { authInfo });
    },
    close: () => handler.close()
  };
}
