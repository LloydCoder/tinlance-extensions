import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { createApiServerFromEnvironment } from "./api-composition.mjs";

const issuer = "https://identity.example.test";
const audience = "tinlance-extensions-api";
const jwksUri = "https://identity.example.test/.well-known/jwks.json";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = {
  ...publicKey.export({ format: "jwk" }),
  kid: "api-composition-key",
  alg: "RS256",
  use: "sig",
  key_ops: ["verify"]
};

function makeToken(claims = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({
    alg: "RS256",
    typ: "JWT",
    kid: jwk.kid
  })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: issuer,
    aud: audience,
    sub: "oidc-user-42",
    tenant_id: "tenant-a",
    iat: now - 10,
    exp: now + 240,
    ...claims
  })).toString("base64url");
  const content = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(content, "ascii"), privateKey).toString("base64url");
  return `${content}.${signature}`;
}

const env = {
  OIDC_ISSUER: issuer,
  OIDC_AUDIENCE: audience,
  OIDC_JWKS_URI: jwksUri
};

const repository = {
  async isReady() { return true; },
  async cancelJobForTenant(jobId, tenantId) {
    return jobId === "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678" && tenantId === "tenant-a";
  },
  async replayDeadLetterForTenant(eventId, tenantId, actorId, requestId) {
    return eventId === "c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679" && tenantId === "tenant-a" && actorId === "oidc-user-42" && typeof requestId === "string";
  },
  async findRecordForTenant(id, tenantId) {
    const records = [
      { id: "record-a", tenantId: "tenant-a", value: "alpha" },
      { id: "record-b", tenantId: "tenant-b", value: "beta" }
    ];
    return records.find((record) => record.id === id && record.tenantId === tenantId) ?? null;
  }
};

async function withOidcServer(fn, authorizeJobCancellation, authorizeOutboxReplay) {
  let fetchCount = 0;
  const fetchImpl = async (url) => {
    fetchCount += 1;
    assert.equal(url, jwksUri);
    return new Response(JSON.stringify({ keys: [jwk] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const server = createApiServerFromEnvironment({ repository, env, fetchImpl, authorizeJobCancellation, authorizeOutboxReplay });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await fn(`http://127.0.0.1:${address.port}`, () => fetchCount);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("production composition requires explicit issuer, audience and JWKS configuration", () => {
  assert.throws(() => createApiServerFromEnvironment({ repository, env: {} }), /OIDC_ISSUER/);
  assert.throws(() => createApiServerFromEnvironment({
    repository,
    env: { ...env, OIDC_JWKS_CACHE_TTL_SECONDS: "3minutes" }
  }), /must be an integer/);
  assert.throws(() => createApiServerFromEnvironment({
    repository,
    env: { ...env, OIDC_JWKS_URI: "http://127.0.0.1/jwks" }
  }), /HTTPS URL/);
});

test("HTTP API uses the configured OIDC verifier and verified tenant claim", async () => {
  await withOidcServer(async (base, fetchCount) => {
    const token = makeToken();
    const me = await fetch(`${base}/v1/me`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), { subject: "oidc-user-42", tenantId: "tenant-a" });

    const ownRecord = await fetch(`${base}/v1/records/record-a`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(ownRecord.status, 200);

    const crossTenant = await fetch(`${base}/v1/records/record-b`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(crossTenant.status, 404);
    assert.equal((await crossTenant.json()).error, "not_found");

    const invalid = await fetch(`${base}/v1/me`, {
      headers: { authorization: "Bearer invalid-token-000000000000" }
    });
    assert.equal(invalid.status, 401);
    assert.equal(fetchCount(), 1);
  });
});

test("invalid signed tenant claims are rejected by the composed HTTP API", async () => {
  await withOidcServer(async (base) => {
    const token = makeToken({ tenant_id: "tenant id" });
    const response = await fetch(`${base}/v1/me`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(response.status, 401);
  });
});

test("OIDC composition forwards the explicit cancellation authorization policy", async () => {
  await withOidcServer(async (base) => {
    const response = await fetch(`${base}/v1/jobs/a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678/cancel`, {
      method: "POST",
      headers: { authorization: `Bearer ${makeToken()}` }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "cancelled" });
  }, async ({ principal }) => principal.subject === "oidc-user-42");
});

test("OIDC composition forwards the explicit dead-letter replay authorization policy", async () => {
  await withOidcServer(async (base) => {
    const response = await fetch(`${base}/v1/outbox/dead-letters/c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679/replay`, {
      method: "POST",
      headers: { authorization: `Bearer ${makeToken()}` }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "requeued" });
  }, undefined, async ({ principal }) => principal.subject === "oidc-user-42");
});

const platformIssuer = "https://platform.identity.example.test/";
const platformAudience = "tinlance-extensions-api";
const platformJwksUri = "https://platform.identity.example.test/.well-known/jwks.json";
const platformClientId = "tinlance-extensions-platform";
const platformKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const platformJwk = {
  ...platformKeys.publicKey.export({ format: "jwk" }),
  kid: "platform-service-key",
  alg: "RS256",
  use: "sig",
  key_ops: ["verify"]
};

function makePlatformToken(scope, requestId = "platform-request-0001", claims = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({
    alg: "RS256",
    typ: "at+jwt",
    kid: platformJwk.kid
  })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: platformIssuer,
    aud: platformAudience,
    sub: "oidc-user-42",
    tenant_id: "tenant-a",
    client_id: platformClientId,
    principal_type: "user",
    scope,
    request_id: requestId,
    iat: now - 10,
    exp: now + 120,
    ...claims
  })).toString("base64url");
  const content = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(content, "ascii"), platformKeys.privateKey).toString("base64url");
  return `${content}.${signature}`;
}

function platformActionPurpose(toolName, resourceId, idempotencyKey = null) {
  const canonical = JSON.stringify([
    "tenant-a",
    "oidc-user-42",
    toolName,
    resourceId,
    idempotencyKey
  ]);
  return "extensions-action-v1:" + createHash("sha256").update(canonical, "utf8").digest("hex");
}

async function withPlatformOidcServer(fn) {
  const fetchImpl = async (url) => {
    const keys = url === jwksUri ? [jwk] : url === platformJwksUri ? [platformJwk] : null;
    if (!keys) throw new Error("unexpected JWKS URL");
    return new Response(JSON.stringify({ keys }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const platformEnv = {
    ...env,
    PLATFORM_OIDC_ISSUER: platformIssuer,
    PLATFORM_OIDC_AUDIENCE: platformAudience,
    PLATFORM_OIDC_JWKS_URI: platformJwksUri,
    PLATFORM_OIDC_CLIENT_ID: platformClientId
  };
  const server = createApiServerFromEnvironment({ repository, env: platformEnv, fetchImpl });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("Platform delegated cancellation requires the trusted issuer, client and exact scope", async () => {
  await withPlatformOidcServer(async (base) => {
    const requestId = "platform-cancel-request-0001";
    const token = makePlatformToken("extensions:jobs:cancel", requestId, {
      purpose: platformActionPurpose("extensions_job_cancel", "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678")
    });
    const allowed = await fetch(`${base}/v1/jobs/a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678/cancel`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get("x-request-id"), requestId);

    const replayedResource = await fetch(`${base}/v1/jobs/b4f6d9e2-1c3b-4a5d-8e7f-9012bc345679/cancel`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(replayedResource.status, 403);

    const wrongScope = await fetch(`${base}/v1/jobs/a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678/cancel`, {
      method: "POST",
      headers: { authorization: `Bearer ${makePlatformToken("extensions:outbox:replay")}` }
    });
    assert.equal(wrongScope.status, 403);

    const userTokenWithForgedScope = makeToken({ scope: "extensions:jobs:cancel" });
    const userTokenResponse = await fetch(`${base}/v1/jobs/a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678/cancel`, {
      method: "POST",
      headers: { authorization: `Bearer ${userTokenWithForgedScope}` }
    });
    assert.equal(userTokenResponse.status, 403);
  });
});

test("Platform delegated dead-letter replay requires the separate replay scope", async () => {
  await withPlatformOidcServer(async (base) => {
    const requestId = "platform-replay-request-0001";
    const token = makePlatformToken("extensions:outbox:replay", requestId, {
      purpose: platformActionPurpose(
        "extensions_dead_letter_replay",
        "c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679",
        "replay-idempotency-0001"
      )
    });
    const response = await fetch(`${base}/v1/outbox/dead-letters/c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679/replay`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Idempotency-Key": "replay-idempotency-0001"
      }
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-request-id"), requestId);
    assert.deepEqual(await response.json(), { status: "requeued" });

    const otherEvent = await fetch(`${base}/v1/outbox/dead-letters/d4f6d9e2-1c3b-4a5d-8e7f-9012bc345670/replay`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "Idempotency-Key": "replay-idempotency-0001" }
    });
    assert.equal(otherEvent.status, 403);

    const otherIdempotencyKey = await fetch(`${base}/v1/outbox/dead-letters/c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679/replay`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "Idempotency-Key": "replay-idempotency-0002" }
    });
    assert.equal(otherIdempotencyKey.status, 403);

    const missingIdempotencyKey = await fetch(`${base}/v1/outbox/dead-letters/c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679/replay`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(missingIdempotencyKey.status, 403);
  });
});

test("partial Platform OIDC configuration is rejected instead of silently disabling delegation", () => {
  assert.throws(() => createApiServerFromEnvironment({
    repository,
    env: { ...env, PLATFORM_OIDC_ISSUER: platformIssuer }
  }), /must provide issuer, audience, JWKS URI and client ID together/);
});


test("OIDC and Platform OIDC integer environment settings accept valid decimal integers", () => {
  const configured = {
    ...env,
    OIDC_JWKS_CACHE_TTL_SECONDS: "240",
    OIDC_MAX_TOKEN_LIFETIME_SECONDS: "1800",
    OIDC_CLOCK_TOLERANCE_SECONDS: "45",
    OIDC_JWKS_TIMEOUT_MS: "4000",
    OIDC_JWKS_MIN_REFRESH_INTERVAL_MS: "750",
    PLATFORM_OIDC_ISSUER: platformIssuer,
    PLATFORM_OIDC_AUDIENCE: platformAudience,
    PLATFORM_OIDC_JWKS_URI: platformJwksUri,
    PLATFORM_OIDC_CLIENT_ID: platformClientId,
    PLATFORM_OIDC_JWKS_CACHE_TTL_SECONDS: "45",
    PLATFORM_OIDC_MAX_TOKEN_LIFETIME_SECONDS: "240",
    PLATFORM_OIDC_CLOCK_TOLERANCE_SECONDS: "20",
    PLATFORM_OIDC_JWKS_TIMEOUT_MS: "3500",
    PLATFORM_OIDC_JWKS_MIN_REFRESH_INTERVAL_MS: "900"
  };

  assert.doesNotThrow(() => createApiServerFromEnvironment({
    repository,
    env: configured,
    fetchImpl: async () => new Response(JSON.stringify({ keys: [] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  }));
});
