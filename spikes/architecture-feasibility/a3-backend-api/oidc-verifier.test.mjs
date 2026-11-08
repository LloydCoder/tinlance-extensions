import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { createOidcBearerVerifier } from "./oidc-verifier.mjs";

const issuer = "https://identity.example.test/";
const audience = "tinlance-extensions-api";
const jwksUri = "https://identity.example.test/.well-known/jwks.json";
const now = Math.floor(Date.now() / 1000);

function createKey(kid) {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = {
    ...pair.publicKey.export({ format: "jwk" }),
    kid,
    alg: "RS256",
    use: "sig",
    key_ops: ["verify"]
  };
  return { ...pair, jwk };
}

function tokenFor(key, claims = {}, header = {}, tokenIssuer = issuer) {
  const protectedHeader = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: key.jwk.kid, ...header })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: tokenIssuer,
    aud: audience,
    sub: "user-123",
    tenant_id: "tenant-a",
    iat: now - 30,
    exp: now + 300,
    ...claims
  })).toString("base64url");
  const signingInput = `${protectedHeader}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput, "ascii"), key.privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

function fetchJwks(keys) {
  return async (url, options) => {
    assert.equal(url, jwksUri);
    assert.equal(options.method, "GET");
    return new Response(JSON.stringify({ keys }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
}

test("valid RS256 access token returns only the verified subject and tenant", async () => {
  const key = createKey("key-1");
  const verifyBearer = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl: fetchJwks([key.jwk])
  });
  assert.deepEqual(await verifyBearer(tokenFor(key)), {
    subject: "user-123",
    tenantId: "tenant-a"
  });
});

test("issuer, audience, time claims and tenant claim are validated after signature verification", async () => {
  const key = createKey("key-claims");
  const verifyBearer = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl: fetchJwks([key.jwk])
  });
  const invalidClaims = [
    { iss: "https://attacker.example/" },
    { aud: "another-api" },
    { exp: now - 120 },
    { iat: now + 600 },
    { exp: now + 7200 },
    { tenant_id: "tenant id" },
    { tenant_id: null },
    { sub: "" }
  ];
  for (const claims of invalidClaims) {
    assert.equal(await verifyBearer(tokenFor(key, claims)), null);
  }
});

test("algorithm substitution, malformed tokens and invalid signatures fail closed", async () => {
  const key = createKey("key-signature");
  const other = createKey("other-key");
  const verifyBearer = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl: fetchJwks([key.jwk])
  });
  assert.equal(await verifyBearer("not-a-jwt"), null);
  assert.equal(await verifyBearer(tokenFor(key, {}, { alg: "none" })), null);
  assert.equal(await verifyBearer(tokenFor(key, {}, { crit: "unsupported" })), null);
  assert.equal(await verifyBearer(tokenFor(key, {}, { crit: [] })), null);
  assert.equal(await verifyBearer(tokenFor(other)), null);
});

test("issuer comparison preserves the configured issuer string exactly", async () => {
  const bareIssuer = "https://identity.example.test";
  const key = createKey("bare-issuer");
  const verifyBearer = createOidcBearerVerifier({
    issuer: bareIssuer, audience, jwksUri, fetchImpl: fetchJwks([key.jwk])
  });
  assert.deepEqual(await verifyBearer(tokenFor(key, {}, {}, bareIssuer)), {
    subject: "user-123",
    tenantId: "tenant-a"
  });
});

test("unknown key identifier refreshes JWKS once to support key rotation", async () => {
  const oldKey = createKey("old-key");
  const newKey = createKey("new-key");
  let fetchCount = 0;
  const fetchImpl = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({ keys: fetchCount === 1 ? [oldKey.jwk] : [newKey.jwk] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const verifyBearer = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl, minRefreshIntervalMs: 0
  });
  assert.deepEqual(await verifyBearer(tokenFor(oldKey)), { subject: "user-123", tenantId: "tenant-a" });
  assert.deepEqual(await verifyBearer(tokenFor(newKey)), { subject: "user-123", tenantId: "tenant-a" });
  assert.equal(fetchCount, 2);
});

test("unsafe issuer and JWKS endpoints are rejected at configuration time", () => {
  const key = createKey("config-key");
  const common = { audience, fetchImpl: fetchJwks([key.jwk]) };
  assert.throws(() => createOidcBearerVerifier({ ...common, issuer: "http://identity.example.test/", jwksUri }), /HTTPS URL/);
  assert.throws(() => createOidcBearerVerifier({ ...common, issuer, jwksUri: "http://127.0.0.1/jwks" }), /HTTPS URL/);
  assert.throws(() => createOidcBearerVerifier({ ...common, issuer, jwksUri, audience: "" }), /audience/);
});

test("JWKS response failures and private key material are rejected", async () => {
  const key = createKey("private-key");
  const failed = createOidcBearerVerifier({
    issuer, audience, jwksUri,
    fetchImpl: async () => new Response("unavailable", { status: 503, headers: { "content-type": "application/json" } })
  });
  await assert.rejects(failed(tokenFor(key)), /JWKS endpoint request failed/);

  const leakedKey = { ...key.jwk, d: "private-material" };
  const leaked = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl: fetchJwks([leakedKey])
  });
  await assert.rejects(leaked(tokenFor(key)), /private key material/);
});


test("Platform-issued service tokens expose only validated delegation claims", async () => {
  const key = createKey("platform-service-token");
  const verifyBearer = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl: fetchJwks([key.jwk])
  });
  const delegated = tokenFor(key, {
    jti: "0123456789abcdef0123456789abcdef",
    client_id: "tinlance-extensions-platform",
    principal_type: "user",
    scope: "extensions:jobs:cancel extensions:outbox:replay",
    request_id: "platform-request-0001"
  });
  assert.deepEqual(await verifyBearer(delegated), {
    subject: "user-123",
    tenantId: "tenant-a",
    issuer,
    clientId: "tinlance-extensions-platform",
    principalType: "user",
    scopes: ["extensions:jobs:cancel", "extensions:outbox:replay"],
    requestId: "platform-request-0001"
  });
});

test("incomplete or malformed Platform delegation claims fail closed", async () => {
  const key = createKey("platform-invalid-claims");
  const verifyBearer = createOidcBearerVerifier({
    issuer, audience, jwksUri, fetchImpl: fetchJwks([key.jwk])
  });
  const invalid = [
    { client_id: "tinlance-extensions-platform" },
    { client_id: "tinlance-extensions-platform", principal_type: "user", scope: "extensions:jobs:cancel" },
    { client_id: "tinlance-extensions-platform", principal_type: "user", scope: "extensions:jobs:cancel", request_id: "bad request" },
    { client_id: "tinlance-extensions-platform", principal_type: "root", scope: "extensions:jobs:cancel", request_id: "platform-request-0002" },
    { client_id: "tinlance-extensions-platform", principal_type: "user", scope: "extensions:jobs:cancel\nadmin", request_id: "platform-request-0002" }
  ];
  for (const claims of invalid) {
    assert.equal(await verifyBearer(tokenFor(key, claims)), null);
  }
});
