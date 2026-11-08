import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import {
  createConformanceApp,
  REQUIRED_SCOPE,
  ACTION_TOOL_NAME,
  ACTION_RESOURCE_ID,
  platformActionPurpose
} from "./server.mjs";

const ISSUER = "https://platform.issuer.test";
const RESOURCE = "https://extensions.test/mcp";
const { publicKey, privateKey } = await generateKeyPair("RS256");
const { privateKey: edPrivateKey } = await generateKeyPair("EdDSA");

function createApp(allowedAlgorithms = ["RS256"]) {
  return createConformanceApp({
    publicKey,
    allowedAlgorithms,
    issuer: ISSUER,
    resourceUrl: RESOURCE,
    oauthMetadata: {
      issuer: ISSUER,
      authorization_endpoint: "https://platform.issuer.test/authorize",
      token_endpoint: "https://platform.issuer.test/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    },
    allowedHostnames: ["extensions.test"],
    allowedOriginHostnames: ["extensions.test"]
  });
}

test("resource server refuses to start without an explicit JWT algorithm allowlist", () => {
  assert.throws(() => createConformanceApp({
    publicKey,
    issuer: ISSUER,
    resourceUrl: RESOURCE,
    oauthMetadata: {
      issuer: ISSUER,
      authorization_endpoint: "https://platform.issuer.test/authorize",
      token_endpoint: "https://platform.issuer.test/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    },
    allowedHostnames: ["extensions.test"],
    allowedOriginHostnames: ["extensions.test"]
  }), /allowedAlgorithms/);
});

async function signedPlatformToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const tenantId = overrides.claims?.tenant_id ?? "tenant-test-001";
  const claims = {
    jti: "0123456789abcdef0123456789abcdef",
    client_id: "tinlance-agent-platform",
    tenant_id: tenantId,
    principal_type: "service",
    request_id: "mcp-0123456789abcdef0123456789abcdef",
    scope: REQUIRED_SCOPE,
    purpose: platformActionPurpose(
      tenantId,
      "platform-service-subject",
      ACTION_TOOL_NAME,
      ACTION_RESOURCE_ID
    ),
    ...overrides.claims
  };
  const key = overrides.signingKey ?? privateKey;
  const alg = overrides.alg ?? "RS256";
  return new SignJWT(claims)
    .setProtectedHeader({ alg, typ: "at+jwt", ...(overrides.kid ? { kid: overrides.kid } : {}) })
    .setIssuer(ISSUER)
    .setAudience(RESOURCE)
    .setSubject("platform-service-subject")
    .setIssuedAt(now)
    .setExpirationTime(overrides.expiresAt ?? now + 300)
    .sign(key);
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

test("JWT algorithm allowlist is copied and cannot be widened by caller mutation", async () => {
  const configuredAlgorithms = ["RS256"];
  const app = createApp(configuredAlgorithms);
  try {
    configuredAlgorithms.push("EdDSA");
    const token = await signedPlatformToken({ alg: "EdDSA", signingKey: edPrivateKey });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});

test("Platform RS256 token is verified through a remote JWKS with kid selection", async () => {
  const jwk = await exportJWK(publicKey);
  jwk.kid = "platform-kms-key-1";
  jwk.alg = "RS256";
  jwk.use = "sig";
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "public, max-age=60"
    });
    response.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const app = createConformanceApp({
    jwksUrl: `http://127.0.0.1:${address.port}/.well-known/jwks.json`,
    allowedAlgorithms: ["RS256"],
    issuer: ISSUER,
    resourceUrl: RESOURCE,
    oauthMetadata: {
      issuer: ISSUER,
      authorization_endpoint: "https://platform.issuer.test/authorize",
      token_endpoint: "https://platform.issuer.test/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    },
    allowedHostnames: ["extensions.test"],
    allowedOriginHostnames: ["extensions.test"]
  });
  try {
    const valid = await signedPlatformToken({ kid: "platform-kms-key-1" });
    assert.notEqual((await requestWithToken(app, valid)).status, 401);
    const unknownKid = await signedPlatformToken({ kid: "unpublished-kms-key" });
    assert.equal((await requestWithToken(app, unknownKid)).status, 401);
  } finally {
    await app.close();
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
});

test("Platform RS256 service token with complete delegated claims is accepted", async () => {
  const app = createApp();
  try {
    const response = await requestWithToken(app, await signedPlatformToken());
    assert.notEqual(response.status, 401);
  } finally {
    await app.close();
  }
});

test("Platform tenant identifiers outside the A3 tenant schema are rejected", async () => {
  const app = createApp();
  try {
    const token = await signedPlatformToken({ claims: { tenant_id: "Tenant.A" } });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});

test("Platform RS256 token without principal_type is rejected", async () => {
  const app = createApp();
  try {
    const token = await signedPlatformToken({ claims: { principal_type: undefined } });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});

test("Platform RS256 token without request_id is rejected", async () => {
  const app = createApp();
  try {
    const token = await signedPlatformToken({ claims: { request_id: undefined } });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});

test("Platform RS256 token without jti is rejected", async () => {
  const app = createApp();
  try {
    const token = await signedPlatformToken({ claims: { jti: undefined } });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});

test("Platform RS256 token lifetime above five minutes is rejected", async () => {
  const app = createApp();
  try {
    const now = Math.floor(Date.now() / 1000);
    const token = await signedPlatformToken({ expiresAt: now + 600 });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});

test("EdDSA tokens are rejected when the resource server is pinned to RS256", async () => {
  const app = createApp();
  try {
    const token = await signedPlatformToken({ alg: "EdDSA", signingKey: edPrivateKey });
    assert.equal((await requestWithToken(app, token)).status, 401);
  } finally {
    await app.close();
  }
});
