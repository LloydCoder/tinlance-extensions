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
  if (typeof raw !== "string" || !/^\\d+$/.test(raw)) {
    throw new Error(`OIDC configuration ${name} must be an integer`);
  }
  return Number(raw);
}

function untrustedIssuer(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof claims?.iss === "string" ? claims.iss : null;
  } catch {
    return null;
  }
}

function createCompositeVerifier({ oidcConfig, platformOidcConfig, fetchImpl }) {
  const userVerifier = createOidcBearerVerifier({ ...oidcConfig, fetchImpl });
  if (!platformOidcConfig) return userVerifier;
  const platformVerifier = createOidcBearerVerifier({
    issuer: platformOidcConfig.issuer,
    audience: platformOidcConfig.audience,
    jwksUri: platformOidcConfig.jwksUri,
    tenantClaim: platformOidcConfig.tenantClaim ?? "tenant_id",
    jwksCacheTtlSeconds: platformOidcConfig.jwksCacheTtlSeconds ?? 300,
    maxTokenLifetimeSeconds: platformOidcConfig.maxTokenLifetimeSeconds ?? 300,
    clockToleranceSeconds: platformOidcConfig.clockToleranceSeconds ?? 60,
    timeoutMs: platformOidcConfig.timeoutMs ?? 5000,
    minRefreshIntervalMs: platformOidcConfig.minRefreshIntervalMs ?? 1000,
    fetchImpl
  });
  return async (token) => {
    // The unverified issuer is only a routing hint. The selected verifier still
    // performs signature, issuer, audience, time, tenant and key validation.
    if (untrustedIssuer(token) === platformOidcConfig.issuer) {
      return platformVerifier(token);
    }
    return userVerifier(token);
  };
}

function hasPlatformScope(principal, platformOidcConfig, requiredScope) {
  return Boolean(
    principal &&
    principal.issuer === platformOidcConfig.issuer &&
    principal.clientId === platformOidcConfig.clientId &&
    Array.isArray(principal.scopes) &&
    principal.scopes.includes(requiredScope)
  );
}

export function createOidcApiServer({
  repository,
  oidcConfig,
  platformOidcConfig,
  fetchImpl,
  authorizeJobCancellation,
  authorizeOutboxReplay
}) {
  if (!oidcConfig || typeof oidcConfig !== "object") {
    throw new TypeError("oidcConfig is required");
  }
  if (platformOidcConfig !== undefined) {
    if (!platformOidcConfig || typeof platformOidcConfig !== "object") {
      throw new TypeError("platformOidcConfig must be an object when supplied");
    }
    for (const name of ["issuer", "audience", "jwksUri", "clientId"]) {
      if (typeof platformOidcConfig[name] !== "string" || !platformOidcConfig[name]) {
        throw new TypeError(`platformOidcConfig.${name} is required`);
      }
    }
  }
  const verifyBearer = createCompositeVerifier({ oidcConfig, platformOidcConfig, fetchImpl });
  const platformAuthorize = platformOidcConfig
    ? (scope) => async (input) => hasPlatformScope(input?.principal, platformOidcConfig, scope)
    : null;

  const effectiveCancelAuthorization = platformAuthorize
    ? async (input) =>
        hasPlatformScope(input?.principal, platformOidcConfig, "extensions:jobs:cancel") &&
        (authorizeJobCancellation ? await authorizeJobCancellation(input) : true)
    : authorizeJobCancellation;
  const effectiveReplayAuthorization = platformAuthorize
    ? async (input) =>
        hasPlatformScope(input?.principal, platformOidcConfig, "extensions:outbox:replay") &&
        (authorizeOutboxReplay ? await authorizeOutboxReplay(input) : true)
    : authorizeOutboxReplay;

  return createApiServer({
    repository,
    verifyBearer,
    authorizeJobCancellation: effectiveCancelAuthorization,
    authorizeOutboxReplay: effectiveReplayAuthorization
  });
}

export function createApiServerFromEnvironment({
  repository,
  env = process.env,
  fetchImpl,
  authorizeJobCancellation,
  authorizeOutboxReplay
} = {}) {
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

  const platformNames = [
    "PLATFORM_OIDC_ISSUER",
    "PLATFORM_OIDC_AUDIENCE",
    "PLATFORM_OIDC_JWKS_URI",
    "PLATFORM_OIDC_CLIENT_ID"
  ];
  const configuredPlatformNames = platformNames.filter((name) => env[name] !== undefined && env[name] !== "");
  if (configuredPlatformNames.length !== 0 && configuredPlatformNames.length !== platformNames.length) {
    throw new Error("Platform OIDC configuration must provide issuer, audience, JWKS URI and client ID together");
  }
  const platformOidcConfig = configuredPlatformNames.length === platformNames.length
    ? {
        issuer: requiredEnvironmentValue(env, "PLATFORM_OIDC_ISSUER"),
        audience: requiredEnvironmentValue(env, "PLATFORM_OIDC_AUDIENCE"),
        jwksUri: requiredEnvironmentValue(env, "PLATFORM_OIDC_JWKS_URI"),
        clientId: requiredEnvironmentValue(env, "PLATFORM_OIDC_CLIENT_ID"),
        tenantClaim: env.PLATFORM_OIDC_TENANT_CLAIM || "tenant_id",
        jwksCacheTtlSeconds: integerEnvironmentValue(env, "PLATFORM_OIDC_JWKS_CACHE_TTL_SECONDS", 60),
        maxTokenLifetimeSeconds: integerEnvironmentValue(env, "PLATFORM_OIDC_MAX_TOKEN_LIFETIME_SECONDS", 300),
        clockToleranceSeconds: integerEnvironmentValue(env, "PLATFORM_OIDC_CLOCK_TOLERANCE_SECONDS", 30),
        timeoutMs: integerEnvironmentValue(env, "PLATFORM_OIDC_JWKS_TIMEOUT_MS", 5000),
        minRefreshIntervalMs: integerEnvironmentValue(env, "PLATFORM_OIDC_JWKS_MIN_REFRESH_INTERVAL_MS", 1000)
      }
    : undefined;

  return createOidcApiServer({
    repository,
    oidcConfig,
    platformOidcConfig,
    fetchImpl,
    authorizeJobCancellation,
    authorizeOutboxReplay
  });
}
