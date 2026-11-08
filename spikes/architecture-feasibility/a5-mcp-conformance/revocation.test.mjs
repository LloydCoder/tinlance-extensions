import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPair, SignJWT } from "jose";
import {
  createConformanceApp,
  REQUIRED_SCOPE,
  ACTION_TOOL_NAME,
  ACTION_RESOURCE_ID,
  platformActionPurpose
} from "./server.mjs";

const ISSUER = "https://issuer.test";
const RESOURCE = "https://extensions.test/mcp";
const { publicKey, privateKey } = await generateKeyPair("EdDSA");

async function signedToken() {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    jti: "0123456789abcdef0123456789abcdef",
    client_id: "a5-revocation-client",
    tenant_id: "tenant-test-001",
    principal_type: "service",
    request_id: "a5-revocation-request-001",
    scope: REQUIRED_SCOPE,
    purpose: platformActionPurpose(
      "tenant-test-001",
      "a5-revocation-subject",
      ACTION_TOOL_NAME,
      ACTION_RESOURCE_ID
    )
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "at+jwt" })
    .setIssuer(ISSUER)
    .setAudience(RESOURCE)
    .setSubject("a5-revocation-subject")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);
}

function createApp(isTokenRevoked) {
  return createConformanceApp({
    publicKey,
    allowedAlgorithms: ["EdDSA"],
    issuer: ISSUER,
    resourceUrl: RESOURCE,
    oauthMetadata: {
      issuer: ISSUER,
      authorization_endpoint: "https://issuer.test/authorize",
      token_endpoint: "https://issuer.test/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    },
    allowedHostnames: ["extensions.test"],
    allowedOriginHostnames: ["extensions.test"],
    ...(isTokenRevoked ? { isTokenRevoked } : {})
  });
}

async function requestWithToken(app, token) {
  return app.fetch(new Request(RESOURCE, {
    method: "POST",
    headers: {
      host: "extensions.test",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2026-07-28"
    },
    body: "{}"
  }));
}

test("revoked access tokens are rejected using the verified issuer and jti", async () => {
  let observed;
  const app = createApp(async (claims) => {
    observed = claims;
    return true;
  });
  try {
    const response = await requestWithToken(app, await signedToken());
    assert.equal(response.status, 401);
    assert.equal(observed.issuer, ISSUER);
    assert.equal(observed.jti, "0123456789abcdef0123456789abcdef");
    assert.equal(observed.subject, "a5-revocation-subject");
    assert.equal(observed.clientId, "a5-revocation-client");
    assert.equal(observed.tenantId, "tenant-test-001");
    assert.equal(typeof observed.expiresAt, "number");
  } finally {
    await app.close();
  }
});

test("revocation lookup failures fail closed", async () => {
  const app = createApp(async () => {
    throw new Error("revocation store unavailable");
  });
  try {
    const response = await requestWithToken(app, await signedToken());
    assert.equal(response.status, 401);
  } finally {
    await app.close();
  }
});

test("a non-revoked token proceeds past the revocation check", async () => {
  let calls = 0;
  const app = createApp(async () => {
    calls += 1;
    return false;
  });
  try {
    const response = await requestWithToken(app, await signedToken());
    assert.notEqual(response.status, 401);
    assert.equal(calls, 1);
  } finally {
    await app.close();
  }
});
