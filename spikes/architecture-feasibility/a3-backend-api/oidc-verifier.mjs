import { createPublicKey, verify as verifySignature } from "node:crypto";

const TENANT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;
const KID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
const PRIVATE_JWK_FIELDS = ["d", "p", "q", "dp", "dq", "qi", "oth"];

function assertHttpsUrl(value, name) {
  if (typeof value !== "string") throw new TypeError(`${name} must be a string URL`);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${name} must be a valid HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) {
    throw new TypeError(`${name} must be an HTTPS URL without credentials, query or fragment`);
  }
  // OIDC issuer comparison is exact; do not normalize trailing slashes.
  return value;
}

function decodeJsonSegment(segment) {
  if (typeof segment !== "string" || segment.length === 0 || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new TypeError("malformed JWT segment");
  }
  const parsed = JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("JWT segment must be a JSON object");
  }
  return parsed;
}

async function readLimitedBody(response, maxBytes) {
  const declaredLength = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("JWKS response exceeds size limit");
  }
  if (!response.body?.getReader) {
    const text = await response.text();
    if (Buffer.byteLength(text) > maxBytes) throw new Error("JWKS response exceeds size limit");
    return text;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("JWKS response exceeds size limit");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total).toString("utf8");
}

function importRsaJwk(jwk) {
  if (!jwk || typeof jwk !== "object" || Array.isArray(jwk)) return null;
  if (PRIVATE_JWK_FIELDS.some((field) => Object.hasOwn(jwk, field))) {
    throw new Error("JWKS must not expose private key material");
  }
  if (jwk.kty !== "RSA" || (jwk.alg && jwk.alg !== "RS256") || (jwk.use && jwk.use !== "sig")) {
    return null;
  }
  if (jwk.key_ops && (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes("verify"))) return null;
  if (typeof jwk.kid !== "string" || !KID_PATTERN.test(jwk.kid)) return null;
  if (typeof jwk.n !== "string" || typeof jwk.e !== "string" || jwk.e !== "AQAB") return null;
  if (Buffer.from(jwk.n, "base64url").byteLength < 256) return null;

  const publicJwk = {
    kty: "RSA",
    n: jwk.n,
    e: jwk.e,
    alg: "RS256",
    use: "sig",
    key_ops: ["verify"],
    kid: jwk.kid
  };
  return { kid: jwk.kid, key: createPublicKey({ key: publicJwk, format: "jwk" }) };
}

export function createOidcBearerVerifier({
  issuer,
  audience,
  jwksUri,
  tenantClaim = "tenant_id",
  jwksCacheTtlSeconds = 300,
  maxTokenLifetimeSeconds = 3600,
  clockToleranceSeconds = 60,
  timeoutMs = 5000,
  minRefreshIntervalMs = 1000,
  maxJwksBytes = 65536,
  fetchImpl = globalThis.fetch,
  nowSeconds = () => Math.floor(Date.now() / 1000)
}) {
  const issuerUrl = assertHttpsUrl(issuer, "issuer");
  const jwksUrl = assertHttpsUrl(jwksUri, "jwksUri");
  if (typeof audience !== "string" || audience.length < 1 || audience.length > 255) {
    throw new TypeError("audience must be a non-empty string of at most 255 characters");
  }
  if (typeof tenantClaim !== "string" || !/^[A-Za-z0-9_.-]{1,64}$/.test(tenantClaim)) {
    throw new TypeError("tenantClaim must be a valid claim name");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function");
  if (!Number.isInteger(jwksCacheTtlSeconds) || jwksCacheTtlSeconds < 1 || jwksCacheTtlSeconds > 86400) {
    throw new RangeError("jwksCacheTtlSeconds must be between 1 and 86400");
  }
  if (!Number.isInteger(maxTokenLifetimeSeconds) || maxTokenLifetimeSeconds < 30 || maxTokenLifetimeSeconds > 86400) {
    throw new RangeError("maxTokenLifetimeSeconds must be between 30 and 86400");
  }
  if (!Number.isInteger(clockToleranceSeconds) || clockToleranceSeconds < 0 || clockToleranceSeconds > 300) {
    throw new RangeError("clockToleranceSeconds must be between 0 and 300");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) {
    throw new RangeError("timeoutMs must be between 100 and 30000");
  }
  if (!Number.isInteger(minRefreshIntervalMs) || minRefreshIntervalMs < 0 || minRefreshIntervalMs > 60000) {
    throw new RangeError("minRefreshIntervalMs must be between 0 and 60000");
  }
  if (!Number.isInteger(maxJwksBytes) || maxJwksBytes < 1024 || maxJwksBytes > 1048576) {
    throw new RangeError("maxJwksBytes must be between 1024 and 1048576");
  }

  let cachedKeys = null;
  let fetchedAt = 0;
  let lastFetchAttemptAt = 0;
  let inFlightFetch = null;

  async function loadJwks({ force = false } = {}) {
    const now = Date.now();
    const cacheFresh = cachedKeys && now - fetchedAt < jwksCacheTtlSeconds * 1000;
    if (!force && cacheFresh) return cachedKeys;
    if (force && cacheFresh && now - lastFetchAttemptAt < minRefreshIntervalMs) return cachedKeys;
    if (inFlightFetch) return inFlightFetch;

    lastFetchAttemptAt = now;
    inFlightFetch = (async () => {
      const response = await fetchImpl(jwksUrl, {
        method: "GET",
        headers: { accept: "application/json, application/jwk-set+json" },
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response?.ok || response.redirected) throw new Error("JWKS endpoint request failed");
      const contentType = response.headers?.get?.("content-type") ?? "";
      if (!/^application\/(?:jwk-set\+)?json(?:\s*;|$)/i.test(contentType)) {
        throw new Error("JWKS endpoint returned an unsupported content type");
      }
      const body = await readLimitedBody(response, maxJwksBytes);
      const document = JSON.parse(body);
      if (!document || !Array.isArray(document.keys) || document.keys.length < 1 || document.keys.length > 20) {
        throw new Error("JWKS document has an invalid key set");
      }

      const keys = new Map();
      for (const jwk of document.keys) {
        const imported = importRsaJwk(jwk);
        if (!imported) continue;
        if (keys.has(imported.kid)) throw new Error("JWKS contains duplicate key identifiers");
        keys.set(imported.kid, imported.key);
      }
      if (keys.size === 0) throw new Error("JWKS contains no supported verification keys");
      cachedKeys = keys;
      fetchedAt = Date.now();
      return cachedKeys;
    })();

    try {
      return await inFlightFetch;
    } finally {
      inFlightFetch = null;
    }
  }

  return async function verifyBearer(token) {
    if (typeof token !== "string" || token.length < 32 || token.length > 8192) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    let header;
    let claims;
    let signature;
    try {
      header = decodeJsonSegment(parts[0]);
      claims = decodeJsonSegment(parts[1]);
      if (!/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
      signature = Buffer.from(parts[2], "base64url");
    } catch {
      return null;
    }

    if (header.alg !== "RS256" || typeof header.kid !== "string" || !KID_PATTERN.test(header.kid)) return null;
    if (header.typ !== undefined && header.typ !== "JWT" && header.typ !== "at+jwt") return null;
    if (header.crit !== undefined || header.b64 === false) return null;

    let keys = await loadJwks();
    let key = keys.get(header.kid);
    if (!key) {
      keys = await loadJwks({ force: true });
      key = keys.get(header.kid);
    }
    if (!key) return null;

    const signedContent = Buffer.from(`${parts[0]}.${parts[1]}`, "ascii");
    if (!verifySignature("RSA-SHA256", signedContent, key, signature)) return null;

    const now = nowSeconds();
    const tolerance = clockToleranceSeconds;
    if (claims.iss !== issuerUrl) return null;
    const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
    if (!Array.isArray(audiences) || !audiences.includes(audience)) return null;
    if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat)) return null;
    if (claims.exp <= now - tolerance || claims.iat > now + tolerance || claims.exp <= claims.iat) return null;
    if (claims.exp - claims.iat > maxTokenLifetimeSeconds) return null;
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + tolerance)) return null;
    if (typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 255) return null;

    const tenantId = claims[tenantClaim];
    if (typeof tenantId !== "string" || !TENANT_ID_PATTERN.test(tenantId)) return null;
    return Object.freeze({ subject: claims.sub, tenantId });
  };
}
