import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
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
