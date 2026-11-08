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
export const MAX_BODY_DURATION_MS = 15_000;

class BodyReadTimeoutError extends Error {}
class BodyReadAbortedError extends Error {}

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
  publicKey,
  jwksUrl,
  allowedAlgorithms,
  issuer,
  resourceUrl,
  allowedHostnames,
  allowedOriginHostnames = [],
  oauthMetadata,
  maxBodyBytes = MAX_BODY_BYTES,
  maxBodyDurationMs = MAX_BODY_DURATION_MS,
  onToolStart = () => {},
  onToolAbort = () => {},
  isTokenRevoked
}) {
  if ((!publicKey && !jwksUrl) || typeof issuer !== "string" || typeof resourceUrl !== "string") {
    throw new TypeError("publicKey or jwksUrl, issuer, and resourceUrl are required");
  }

  const supportedAlgorithms = new Set(["EdDSA", "RS256"]);
  if (!Array.isArray(allowedAlgorithms) || allowedAlgorithms.length < 1 ||
      allowedAlgorithms.length > supportedAlgorithms.size ||
      new Set(allowedAlgorithms).size !== allowedAlgorithms.length ||
      allowedAlgorithms.some((algorithm) => !supportedAlgorithms.has(algorithm))) {
    throw new TypeError("allowedAlgorithms must be a non-empty unique subset of EdDSA and RS256");
  }

  const verificationAlgorithms = Object.freeze([...allowedAlgorithms]);

  if (isTokenRevoked !== undefined && typeof isTokenRevoked !== "function") {
    throw new TypeError("isTokenRevoked must be a function when configured");
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
          algorithms: verificationAlgorithms,
          issuer,
          audience: resourceUrl
        });

        const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/;
        const scopePattern = /^[A-Za-z0-9][A-Za-z0-9:._/-]{0,127}$/;
        const principalTypes = new Set(["user", "service", "agent", "workload"]);
        if (
          protectedHeader.typ !== "at+jwt" ||
          typeof payload.sub !== "string" ||
          !identifierPattern.test(payload.sub) ||
          typeof payload.client_id !== "string" ||
          !identifierPattern.test(payload.client_id) ||
          typeof payload.tenant_id !== "string" ||
          !identifierPattern.test(payload.tenant_id) ||
          typeof payload.principal_type !== "string" ||
          !principalTypes.has(payload.principal_type) ||
          typeof payload.request_id !== "string" ||
          !identifierPattern.test(payload.request_id) ||
          typeof payload.jti !== "string" ||
          !/^[a-f0-9]{32}$/.test(payload.jti) ||
          typeof payload.scope !== "string" ||
          payload.scope.length < 1 ||
          payload.scope.length > 1024 ||
          payload.scope !== payload.scope.trim() ||
          payload.scope.includes("  ") ||
          typeof payload.purpose !== "string" ||
          !/^extensions-action-v1:[a-f0-9]{64}$/.test(payload.purpose) ||
          !Number.isFinite(payload.iat) ||
          !Number.isFinite(payload.exp) ||
          payload.exp <= payload.iat ||
          payload.exp - payload.iat > 300
        ) {
          throw new Error("required access-token claims are missing or invalid");
        }

        const scopes = payload.scope.split(" ");
        if (
          scopes.length < 1 ||
          scopes.length > 32 ||
          scopes.some((scope) => !scopePattern.test(scope)) ||
          new Set(scopes).size !== scopes.length
        ) {
          throw new Error("access token scopes are invalid");
        }

        if (isTokenRevoked) {
          if (typeof payload.jti !== "string" || payload.jti.trim().length === 0) {
            throw new Error("revocation-aware access tokens require a non-empty jti");
          }
          const revoked = await isTokenRevoked({
            issuer: payload.iss,
            jti: payload.jti,
            subject: payload.sub,
            clientId: payload.client_id,
            tenantId: payload.tenant_id,
            expiresAt: payload.exp
          });
          if (revoked) throw new Error("access token has been revoked");
        }

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
      "extensions_cancel_probe",
      {
        description: "Synthetic long-running read-only tool used only to verify request cancellation.",
        inputSchema: z.object({
          delayMs: z.number().int().min(1).max(5000)
        }),
        outputSchema: z.object({ status: z.literal("completed") }),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async ({ delayMs }, ctx) => {
        onToolStart();
        await new Promise((resolve, reject) => {
          const signal = ctx.mcpReq.signal;
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", abortHandler);
            resolve();
          }, delayMs);
          const abortHandler = () => {
            clearTimeout(timer);
            onToolAbort();
            reject(new DOMException("Tool request aborted", "AbortError"));
          };
          if (signal.aborted) abortHandler();
          else signal.addEventListener("abort", abortHandler, { once: true });
        });
        return {
          content: [{ type: "text", text: "completed" }],
          structuredContent: { status: "completed" }
        };
      }
    );

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
