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
import { createOidcBearerVerifier } from "../a3-backend-api/oidc-verifier.mjs";
import * as z from "zod/v4";

export const REQUIRED_SCOPE = "extensions:conformance.read";
export const ACTION_SCOPE = "extensions:health:read";
export const ACTION_TOOL_NAME = "extensions_health_read";
export const ACTION_RESOURCE_ID = "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678";
export const EXPECTED_TENANT_ID = "tenant-test-001";
export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_BODY_DURATION_MS = 15_000;

class BodyReadTimeoutError extends Error {}
class BodyReadAbortedError extends Error {}

export function platformActionPurpose(tenantId, subject, toolName, resourceId, idempotencyKey = null) {
  if (typeof tenantId !== "string" || typeof subject !== "string") return null;
  const canonical = JSON.stringify([tenantId, subject, toolName, resourceId, idempotencyKey]);
  return "extensions-action-v1:" + createHash("sha256").update(canonical, "utf8").digest("hex");
}

function hasPlatformActionPurpose(authInfo, { issuer, clientId }) {
  const expected = platformActionPurpose(
    EXPECTED_TENANT_ID,
    authInfo?.subject,
    ACTION_TOOL_NAME,
    ACTION_RESOURCE_ID
  );
  return Boolean(
    authInfo &&
    authInfo.issuer === issuer &&
    authInfo.clientId === clientId &&
    authInfo.tenantId === EXPECTED_TENANT_ID &&
    ["user", "service", "agent", "workload"].includes(authInfo.principalType) &&
    typeof authInfo.requestId === "string" &&
    authInfo.scopes?.includes(ACTION_SCOPE) &&
    typeof expected === "string" &&
    authInfo.purpose === expected
  );
}

async function readBoundedBody(request, limit, timeoutMs) {
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  let timer;
  let abortHandler;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new BodyReadTimeoutError("request body deadline exceeded")), timeoutMs);
  });
  const aborted = new Promise((_, reject) => {
    abortHandler = () => reject(new BodyReadAbortedError("request body was aborted"));
    if (request.signal.aborted) abortHandler();
    else request.signal.addEventListener("abort", abortHandler, { once: true });
  });

  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout, aborted]);
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", abortHandler);
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
  issuer,
  resourceUrl,
  jwksUrl,
  platformClientId,
  jwksFetchImpl,
  allowedHostnames,
  allowedOriginHostnames = [],
  oauthMetadata,
  maxBodyBytes = MAX_BODY_BYTES,
  maxBodyDurationMs = MAX_BODY_DURATION_MS
}) {
  if (
    typeof issuer !== "string" ||
    typeof resourceUrl !== "string" ||
    typeof jwksUrl !== "string" ||
    typeof platformClientId !== "string" ||
    typeof jwksFetchImpl !== "function"
  ) {
    throw new TypeError("issuer, resourceUrl, jwksUrl, platformClientId and jwksFetchImpl are required");
  }

  const resource = new URL(resourceUrl);
  if (!oauthMetadata || oauthMetadata.issuer !== issuer) {
    throw new TypeError("oauthMetadata with the configured issuer is required");
  }
  const resourceMetadataUrl = new URL(
    "/.well-known/oauth-protected-resource/mcp",
    resource.origin
  ).toString();

  const platformVerifier = createOidcBearerVerifier({
    issuer,
    audience: resourceUrl,
    jwksUri: jwksUrl,
    tenantClaim: "tenant_id",
    jwksCacheTtlSeconds: 60,
    maxTokenLifetimeSeconds: 300,
    clockToleranceSeconds: 30,
    timeoutMs: 5_000,
    minRefreshIntervalMs: 0,
    maxJwksBytes: 65_536,
    fetchImpl: jwksFetchImpl
  });

  const verifier = {
    async verifyAccessToken(token) {
      try {
        const principal = await platformVerifier(token);
        if (
          !principal ||
          typeof principal.clientId !== "string" ||
          typeof principal.issuer !== "string" ||
          typeof principal.principalType !== "string" ||
          typeof principal.requestId !== "string" ||
          typeof principal.purpose !== "string" ||
          !Array.isArray(principal.scopes)
        ) {
          throw new Error("token is not a complete Platform delegation principal");
        }

        // The A3 verifier has already verified the signature and all JWT claims.
        // Read exp only after that verification so the MCP SDK can enforce expiry.
        const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
        if (!Number.isFinite(claims.exp)) throw new Error("verified token has no expiry");

        return {
          token,
          clientId: principal.clientId,
          scopes: principal.scopes,
          expiresAt: claims.exp,
          resource,
          tenantId: principal.tenantId,
          subject: principal.subject,
          issuer: principal.issuer,
          principalType: principal.principalType,
          requestId: principal.requestId,
          purpose: principal.purpose
        };
      } catch {
        throw new OAuthError(OAuthErrorCode.InvalidToken, "Invalid Platform access token");
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
      version: "0.3.0"
    });

    server.registerTool(
      ACTION_TOOL_NAME,
      {
        description: "Return a synthetic, read-only conformance health result.",
        inputSchema: z.object({}).strict(),
        outputSchema: z.object({
          status: z.literal("ok"),
          protocol: z.literal("2026-07-28")
        }),
        scopeChallenge: ({ authInfo }) => hasPlatformActionPurpose(authInfo, {
          issuer,
          clientId: platformClientId
        })
          ? undefined
          : {
              scopes: [ACTION_SCOPE],
              errorDescription: "A matching tenant, client, action, and resource authorization is required"
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
        scopesSupported: [REQUIRED_SCOPE, ACTION_SCOPE],
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

        let body;
        try {
          body = await readBoundedBody(request, maxBodyBytes, maxBodyDurationMs);
        } catch (error) {
          const timedOut = error instanceof BodyReadTimeoutError;
          const aborted = error instanceof BodyReadAbortedError;
          return new Response(JSON.stringify({
            error: timedOut ? "request_timeout" : aborted ? "request_aborted" : "request_body_read_failed"
          }), {
            status: timedOut || aborted ? 408 : 400,
            headers: { "content-type": "application/json", "cache-control": "no-store" }
          });
        }
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
