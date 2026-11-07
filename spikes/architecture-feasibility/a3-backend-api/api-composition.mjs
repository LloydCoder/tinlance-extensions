import { createApiServer } from "./server.mjs";
import { createOidcBearerVerifier } from "./oidc-verifier.mjs";

function requiredEnvironmentValue(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`required OIDC configuration ${name} is missing`);
  }
  return value;
}

function integerEnvironmentValue(env, name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new Error(`OIDC configuration ${name} must be an integer`);
  }
  return Number(raw);
}

export function createOidcApiServer({ repository, oidcConfig, fetchImpl }) {
  if (!oidcConfig || typeof oidcConfig !== "object") {
    throw new TypeError("oidcConfig is required");
  }
  const verifyBearer = createOidcBearerVerifier({
    ...oidcConfig,
    fetchImpl
  });
  return createApiServer({ repository, verifyBearer });
}

export function createApiServerFromEnvironment({ repository, env = process.env, fetchImpl } = {}) {
  if (!env || typeof env !== "object") throw new TypeError("env must be an environment object");
  const oidcConfig = {
    issuer: requiredEnvironmentValue(env, "OIDC_ISSUER"),
    audience: requiredEnvironmentValue(env, "OIDC_AUDIENCE"),
    jwksUri: requiredEnvironmentValue(env, "OIDC_JWKS_URI"),
    tenantClaim: env.OIDC_TENANT_CLAIM || "tenant_id",
    jwksCacheTtlSeconds: integerEnvironmentValue(env, "OIDC_JWKS_CACHE_TTL_SECONDS", 300),
    maxTokenLifetimeSeconds: integerEnvironmentValue(env, "OIDC_MAX_TOKEN_LIFETIME_SECONDS", 3600),
    clockToleranceSeconds: integerEnvironmentValue(env, "OIDC_CLOCK_TOLERANCE_SECONDS", 60),
    timeoutMs: integerEnvironmentValue(env, "OIDC_JWKS_TIMEOUT_MS", 5000),
    minRefreshIntervalMs: integerEnvironmentValue(env, "OIDC_JWKS_MIN_REFRESH_INTERVAL_MS", 1000)
  };
  return createOidcApiServer({ repository, oidcConfig, fetchImpl });
}
