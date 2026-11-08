import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import http from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import {
  Client,
  IssuerMismatchError,
  StreamableHTTPClientTransport,
  UnauthorizedError
} from "@modelcontextprotocol/client";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import {
  createConformanceApp,
  REQUIRED_SCOPE,
  ACTION_SCOPE,
  ACTION_TOOL_NAME,
  ACTION_RESOURCE_ID,
  platformActionPurpose
} from "./server.mjs";

const REDIRECT_URI = "http://127.0.0.1:49152/oauth/callback";
const { publicKey, privateKey } = await generateKeyPair("EdDSA");

class TestOAuthProvider {
  constructor() {
    this.redirectUrl = REDIRECT_URI;
    this.clientMetadata = {
      client_name: "Tinlance A5 PKCE test client",
      redirect_uris: [REDIRECT_URI],
      application_type: "native"
    };
    this.clients = new Map();
    this.lastState = undefined;
    this.verifier = undefined;
    this.discovery = undefined;
    this.authorizationUrl = undefined;
    this.storedTokens = undefined;
  }

  clientInformation(context) {
    return context ? this.clients.get(context.issuer) : undefined;
  }

  saveClientInformation(info, context) {
    if (context) this.clients.set(context.issuer, info);
  }

  tokens() {
    return this.storedTokens;
  }

  saveTokens(tokens) {
    this.storedTokens = tokens;
  }

  state() {
    this.lastState = randomUUID();
    return this.lastState;
  }

  saveDiscoveryState(state) {
    this.discovery = state;
  }

  discoveryState() {
    return this.discovery;
  }

  redirectToAuthorization(url) {
    this.authorizationUrl = url;
  }

  saveCodeVerifier(verifier) {
    this.verifier = verifier;
  }

  codeVerifier() {
    if (!this.verifier) throw new Error("missing PKCE verifier");
    return this.verifier;
  }
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function startAuthorizationCodeFixture() {
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "a5-pkce-key";
  publicJwk.alg = "EdDSA";
  publicJwk.use = "sig";
  const registeredClients = new Map();
  const authorizationCodes = new Map();
  const tokenRequests = [];
  let app;

  const server = http.createServer(async (incoming, outgoing) => {
    try {
      const origin = `http://${incoming.headers.host}`;
      const url = new URL(incoming.url, origin);

      if (url.pathname === "/.well-known/jwks.json") {
        outgoing.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=60" });
        outgoing.end(JSON.stringify({ keys: [publicJwk] }));
        return;
      }

      if (url.pathname === "/register" && incoming.method === "POST") {
        const registration = JSON.parse(await readBody(incoming));
        const clientId = "a5-pkce-client";
        registeredClients.set(clientId, registration);
        outgoing.writeHead(201, { "content-type": "application/json", "cache-control": "no-store" });
        outgoing.end(JSON.stringify({
          client_id: clientId,
          client_id_issued_at: Math.floor(Date.now() / 1000),
          redirect_uris: registration.redirect_uris,
          grant_types: registration.grant_types ?? ["authorization_code", "refresh_token"],
          response_types: registration.response_types ?? ["code"],
          token_endpoint_auth_method: "none",
          application_type: registration.application_type ?? "native"
        }));
        return;
      }

      if (url.pathname === "/authorize" && incoming.method === "GET") {
        const clientId = url.searchParams.get("client_id");
        const redirectUri = url.searchParams.get("redirect_uri");
        const state = url.searchParams.get("state");
        const challenge = url.searchParams.get("code_challenge");
        const resource = url.searchParams.get("resource");
        if (
          !registeredClients.has(clientId) ||
          redirectUri !== REDIRECT_URI ||
          !state ||
          !challenge ||
          url.searchParams.get("code_challenge_method") !== "S256" ||
          resource !== `${origin}/mcp` ||
          !url.searchParams.get("scope")?.split(" ").includes(REQUIRED_SCOPE)
        ) {
          outgoing.writeHead(400);
          outgoing.end("invalid authorization request");
          return;
        }
        const code = randomUUID();
        authorizationCodes.set(code, { clientId, redirectUri, challenge, resource, scope: url.searchParams.get("scope") });
        outgoing.writeHead(302, {
          location: `${redirectUri}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&iss=${encodeURIComponent(origin)}`,
          "cache-control": "no-store"
        });
        outgoing.end();
        return;
      }

      if (url.pathname === "/token" && incoming.method === "POST") {
        const form = new URLSearchParams(await readBody(incoming));
        const record = authorizationCodes.get(form.get("code"));
        const verifier = form.get("code_verifier") ?? "";
        const challenge = createHash("sha256").update(verifier).digest("base64url");
        const valid = Boolean(
          record &&
          form.get("grant_type") === "authorization_code" &&
          form.get("client_id") === record.clientId &&
          form.get("redirect_uri") === record.redirectUri &&
          form.get("resource") === record.resource &&
          challenge === record.challenge
        );
        tokenRequests.push({
          grantType: form.get("grant_type"),
          clientId: form.get("client_id"),
          resource: form.get("resource"),
          pkceValid: Boolean(record && challenge === record.challenge)
        });
        if (!valid) {
          outgoing.writeHead(400, { "content-type": "application/json", "cache-control": "no-store" });
          outgoing.end(JSON.stringify({ error: "invalid_grant" }));
          return;
        }
        authorizationCodes.delete(form.get("code"));
        const now = Math.floor(Date.now() / 1000);
        const token = await new SignJWT({
          jti: "0123456789abcdef0123456789abcdef",
          client_id: record.clientId,
          tenant_id: "tenant-test-001",
          principal_type: "user",
          request_id: "a5-pkce-request-001",
          scope: record.scope,
          purpose: platformActionPurpose(
            "tenant-test-001",
            "a5-pkce-subject",
            ACTION_TOOL_NAME,
            ACTION_RESOURCE_ID
          )
        })
          .setProtectedHeader({ alg: "EdDSA", typ: "at+jwt", kid: "a5-pkce-key" })
          .setIssuer(origin)
          .setAudience(record.resource)
          .setSubject("a5-pkce-subject")
          .setIssuedAt(now)
          .setExpirationTime(now + 300)
          .sign(privateKey);
        outgoing.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        outgoing.end(JSON.stringify({
          access_token: token,
          token_type: "Bearer",
          expires_in: 300,
          scope: record.scope
        }));
        return;
      }

      if (url.pathname === "/mcp" || url.pathname.startsWith("/.well-known/")) {
        const controller = new AbortController();
        incoming.once("aborted", () => controller.abort());
        outgoing.once("close", () => {
          if (!outgoing.writableEnded) controller.abort();
        });
        const body = ["GET", "HEAD"].includes(incoming.method) ? undefined : Readable.toWeb(incoming);
        const request = new Request(`${origin}${incoming.url}`, {
          method: incoming.method,
          headers: incoming.headers,
          body,
          signal: controller.signal,
          ...(body ? { duplex: "half" } : {})
        });
        const response = await app.fetch(request);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        if (response.body) {
          for await (const chunk of response.body) {
            if (outgoing.destroyed) break;
            outgoing.write(chunk);
          }
        }
        if (!outgoing.destroyed) outgoing.end();
        return;
      }

      outgoing.writeHead(404);
      outgoing.end();
    } catch {
      if (!outgoing.destroyed) {
        outgoing.writeHead(500);
        outgoing.end();
      }
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const resourceUrl = `${origin}/mcp`;
  app = createConformanceApp({
    jwksUrl: `${origin}/.well-known/jwks.json`,
    issuer: origin,
    resourceUrl,
    oauthMetadata: {
      issuer: origin,
      authorization_endpoint: `${origin}/authorize`,
      token_endpoint: `${origin}/token`,
      registration_endpoint: `${origin}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
      authorization_response_iss_parameter_supported: true,
      client_id_metadata_document_supported: false
    },
    allowedHostnames: ["127.0.0.1"],
    allowedOriginHostnames: ["127.0.0.1"]
  });
  return {
    origin,
    resourceUrl,
    tokenRequests,
    close: async () => {
      await app.close();
      server.closeAllConnections();
      await new Promise((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve())
      );
    }
  };
}

function assertCallbackState(params, expectedState) {
  if (params.get("state") !== expectedState) throw new Error("OAuth state mismatch");
}

test("official SDK authorization-code flow enforces PKCE S256, state, issuer and resource binding", async () => {
  const fixture = await startAuthorizationCodeFixture();
  const provider = new TestOAuthProvider();
  const client = new Client(
    { name: "a5-pkce-integration-client", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } }
  );
  let initialTransport;
  try {
    initialTransport = new StreamableHTTPClientTransport(new URL(fixture.resourceUrl), {
      authProvider: provider
    });
    await assert.rejects(client.connect(initialTransport), (error) => error instanceof UnauthorizedError);
    assert.ok(provider.authorizationUrl instanceof URL);
    assert.equal(provider.authorizationUrl.searchParams.get("code_challenge_method"), "S256");
    assert.ok(provider.authorizationUrl.searchParams.get("code_challenge"));
    assert.equal(provider.authorizationUrl.searchParams.get("resource"), fixture.resourceUrl);
    assert.equal(provider.authorizationUrl.searchParams.get("state"), provider.lastState);

    const authorizationResponse = await fetch(provider.authorizationUrl, { redirect: "manual" });
    assert.equal(authorizationResponse.status, 302);
    const callback = new URL(authorizationResponse.headers.get("location"));
    const params = callback.searchParams;
    const wrongState = new URLSearchParams(params);
    wrongState.set("state", "attacker-controlled-state");
    assert.throws(() => assertCallbackState(wrongState, provider.lastState), /OAuth state mismatch/);
    assertCallbackState(params, provider.lastState);
    assert.equal(params.get("iss"), fixture.origin);

    const wrongIssuer = new URLSearchParams(params);
    wrongIssuer.set("iss", "https://attacker.invalid");
    await assert.rejects(initialTransport.finishAuth(wrongIssuer), (error) => error instanceof IssuerMismatchError);
    assert.equal(fixture.tokenRequests.length, 0, "issuer mismatch must be rejected before token exchange");

    const validVerifier = provider.verifier;
    provider.verifier = "incorrect-pkce-verifier";
    await assert.rejects(initialTransport.finishAuth(params));
    assert.equal(fixture.tokenRequests.length, 2, "the SDK retries an invalid_grant exchange once");
    assert.ok(fixture.tokenRequests.every((request) => !request.pkceValid), "incorrect PKCE verifier must be rejected on every retry");

    provider.verifier = validVerifier;
    await initialTransport.finishAuth(params);
    assert.equal(fixture.tokenRequests.length, 3);
    assert.equal(fixture.tokenRequests[2].grantType, "authorization_code");
    assert.equal(fixture.tokenRequests[2].clientId, "a5-pkce-client");
    assert.equal(fixture.tokenRequests[2].resource, fixture.resourceUrl);
    assert.equal(fixture.tokenRequests[2].pkceValid, true);

    await initialTransport.close().catch(() => {});
    const authenticatedTransport = new StreamableHTTPClientTransport(new URL(fixture.resourceUrl), {
      authProvider: provider
    });
    await client.connect(authenticatedTransport);
    const result = await client.callTool({
      name: "extensions_cancel_probe",
      arguments: { delayMs: 1 }
    });
    assert.equal(result.isError, undefined);
    assert.deepEqual(result.structuredContent, { status: "completed" });
    await authenticatedTransport.close();
  } finally {
    await client.close().catch(() => {});
    await fixture.close();
  }
});
