import {
  createMcpHandler,
  McpServer,
  OAuthError,
  OAuthErrorCode,
  hostHeaderValidationResponse,
  originValidationResponse,
  requireBearerAuth,
  oauthMetadataResponse
} from "@modelcontextprotocol/server";
import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as z from "zod/v4";

export const REQUIRED_SCOPE = "extensions:conformance.read";
export const ACTION_SCOPE = "extensions:health:read";
export const ACTION_TOOL_NAME = "extensions_health_read";
export const ACTION_RESOURCE_ID = "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678";
export const EXPECTED_TENANT_ID = "tenant-test-001";
export const MAX_BODY_BYTES = 64 * 1024;

export function platformActionPurpose(tenantId, subject, toolName, resourceId, idempotencyKey = null) {
  if (typeof tenantId !== "string" || typeof subject !== "string") return null;
  const canonical = JSON.stringify([tenantId, subject, toolName, resourceId, idempotencyKey]);
  return "extensions-action-v1:" + createHash("sha256").update(canonical, "utf8").digest("hex");
}

function hasPlatformActionPurpose(authInfo) {
  const expected = platformActionPurpose(
    EXPECTED_TENANT_ID,
    authInfo?.subject,
    ACTION_TOOL_NAME,
    ACTION_RESOURCE_ID
  );
  return Boolean(
    authInfo &&
    authInfo.tenantId === EXPECTED_TENANT_ID &&
    authInfo.scopes?.includes(ACTION_SCOPE) &&
    typeof expected === "string" &&
    authInfo.purpose === expected
  );
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
  publicKey,
  jwksUrl,
  issuer,
  resourceUrl,
  allowedHostnames,
  allowedOriginHostnames = [],
  oauthMetadata,
  maxBodyBytes = MAX_BODY_BYTES
}) {
  if ((!publicKey && !jwksUrl) || typeof issuer !== "string" || typeof resourceUrl !== "string") {
    throw new TypeError("publicKey or jwksUrl, issuer, and resourceUrl are required");
  }

  const resource = new URL(resourceUrl);
  const jwksEndpoint = jwksUrl ? new URL(jwksUrl) : undefined;
  if (jwksEndpoint && jwksEndpoint.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(jwksEndpoint.hostname)) {
    throw new TypeError("JWKS endpoint must use HTTPS outside loopback tests");
  }
  const verificationKey = jwksEndpoint ? createRemoteJWKSet(jwksEndpoint) : publicKey;
  if (!oauthMetadata || oauthMetadata.issuer !== issuer) {
    throw new TypeError("oauthMetadata with the configured issuer is required");
  }
  const resourceMetadataUrl = new URL(
    "/.well-known/oauth-protected-resource/mcp",
    resource.origin
  ).toString();

  const verifier = {
    async verifyAccessToken(token) {
      try {
        const { payload, protectedHeader } = await jwtVerify(token, verificationKey, {
          algorithms: ["EdDSA"],
          issuer,
          audience: resourceUrl
        });

        if (
          protectedHeader.typ !== "at+jwt" ||
          typeof payload.sub !== "string" ||
          typeof payload.client_id !== "string" ||
          typeof payload.tenant_id !== "string" ||
          typeof payload.scope !== "string" ||
          typeof payload.purpose !== "string" ||
          !/^extensions-action-v1:[a-f0-9]{64}$/.test(payload.purpose) ||
          typeof payload.exp !== "number"
        ) {
          throw new Error("required access-token claims are missing");
        }

        const scopes = payload.scope.split(" ").filter(Boolean);
        if (scopes.length === 0) throw new Error("access token has no scopes");

        return {
          token,
          clientId: payload.client_id,
          scopes,
          expiresAt: payload.exp,
          resource,
          tenantId: payload.tenant_id,
          subject: payload.sub,
          purpose: payload.purpose
        };
      } catch {
        throw new OAuthError(OAuthErrorCode.InvalidToken, "Invalid access token");
      }
    }
  };

  const authGate = requireBearerAuth({
    verifier,
    requiredScopes: [REQUIRED_SCOPE],
    expectedResource: resource,
    resourceMetadataUrl
  });

  const handler = createMcpHandler(({ era }) => {
    const server = new McpServer({
      name: "tinlance-extensions-a5-conformance",
      version: "0.2.0"
    });

    server.registerTool(
      "extensions_health_read",
      {
        description: "Return a synthetic, read-only conformance health result.",
        inputSchema: z.object({}).strict(),
        outputSchema: z.object({
          status: z.literal("ok"),
          protocol: z.literal("2026-07-28")
        }),
        scopeChallenge: ({ authInfo }) => hasPlatformActionPurpose(authInfo)
          ? undefined
          : {
              scopes: [ACTION_SCOPE],
              errorDescription: "A matching tenant, action, and resource authorization is required"
            }
      },
      async () => ({
        content: [{ type: "text", text: "ok" }],
        structuredContent: { status: "ok", protocol: era === "modern" ? "2026-07-28" : "legacy" }
      })
    );

    return server;
  }, { legacy: "reject" });

  return {
    async fetch(request) {
      const hostRejected = hostHeaderValidationResponse(request, allowedHostnames);
      if (hostRejected) return hostRejected;

      const originRejected = originValidationResponse(request, allowedOriginHostnames);
      if (originRejected) return originRejected;

      const metadataResponse = oauthMetadataResponse(request, {
        oauthMetadata,
        resourceServerUrl: resource,
        scopesSupported: [REQUIRED_SCOPE],
        resourceName: "Tinlance Extensions A5 conformance fixture"
      });
      if (metadataResponse) return metadataResponse;

      const authInfo = await authGate(request);
      if (authInfo instanceof Response) return authInfo;

      if (request.body) {
        const declared = request.headers.get("content-length");
        if (declared !== null) {
          const declaredLength = Number(declared);
          if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
            return new Response(JSON.stringify({ error: "invalid_content_length" }), {
              status: 400,
              headers: { "content-type": "application/json", "cache-control": "no-store" }
            });
          }
          if (declaredLength > maxBodyBytes) {
            return new Response(JSON.stringify({ error: "request_too_large" }), {
              status: 413,
              headers: { "content-type": "application/json", "cache-control": "no-store" }
            });
          }
        }

        const body = await readBoundedBody(request, maxBodyBytes);
        if (body === null) {
          return new Response(JSON.stringify({ error: "request_too_large" }), {
            status: 413,
            headers: { "content-type": "application/json", "cache-control": "no-store" }
          });
        }
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
