# A5 MCP SDK v2 conformance spike

This directory contains an isolated, non-production conformance fixture for the accepted MCP protocol revision `2026-07-28`.

## Reproduce

Requirements: Node.js 24.22.2 and npm 11.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm sbom --sbom-format cyclonedx
```

The dependency graph is pinned by `package.json` and `package-lock.json`. CI verifies a clean `npm ci`, produces a CycloneDX SBOM, and runs the test suite.

## What is exercised

- Official TypeScript SDK v2.4.0 `Client`, `StreamableHTTPClientTransport`, `createMcpHandler`, and `requireBearerAuth`.
- Modern protocol negotiation pinned to `2026-07-28`; legacy protocol handling is rejected.
- In-process handler and real loopback HTTP discovery/tool-call paths.
- EdDSA-signed JWT access-token verification with `jose`: algorithm, `typ=at+jwt`, issuer, audience/resource, expiry, subject, client ID, tenant claim presence, and scope.
- Configurable remote JWKS verification through `jose` `createRemoteJWKSet`, exercised against a loopback JWKS endpoint with positive signature, unknown-`kid`, and invalid-signature cases.
- SDK-native Bearer challenges for missing/invalid tokens and insufficient scopes.
- SDK-served RFC 9728 Protected Resource Metadata and RFC 8414 Authorization Server Metadata discovery documents, including issuer and S256/CIMD capability declarations.
- SDK Host/Origin validation helpers.
- Bounded streaming request-body enforcement, including chunked bodies without Content-Length, with a configurable total read deadline and abort handling.
- Negative tests for invalid issuer, audience, expiry, token type, missing tenant claim, missing scope, untrusted Host/Origin, oversized bodies, slow-body timeout, and client abort.

## Security and readiness boundary

This is a test fixture only. The signing key is generated ephemerally for tests and is not a deployed issuer key. The RFC 9728 and RFC 8414 documents are synthetic conformance metadata only: their authorization/token endpoint URLs are not hosted. The remote JWKS URL is a fixture input backed by an ephemeral loopback server; there is no production JWKS hosting, signing-key rotation policy, token revocation/introspection, client registration, PKCE flow, or live trust configuration. Metadata publication proves document shape and discovery routing, not a working OAuth authorization-code flow.

The tenant claim is required and parsed as part of token verification, but it is not yet bound to tenant-scoped data or a Platform authorization decision. Host/Origin allowlists are fixture inputs and must be replaced with reviewed production host/proxy policy.

No product adapters, database access, customer data, browser actions, write tools, cancellation, replay, or consequential execution are exposed. This fixture does not authorize a production MCP endpoint or deployment.

## Gate 0 still requires

- Production issuer integration, JWKS/key rotation, revocation/introspection, metadata publication, and a reviewed OAuth client flow.
- Production trusted Host/Origin and reverse-proxy topology tests.
- Tenant/action-bound authorization integration with the Tinlance Agent Platform, including deny-by-default tests and approval requirements.
- Full stateless HTTP wire fixtures: malformed JSON-RPC, protocol mismatch, content negotiation, method handling, body/time limits, cancellation, session lifecycle and abuse cases.
- Real-client interoperability evidence for the approved support matrix.
- Tool catalogue, risk/approval matrix, security/privacy review, and formal architecture approval.

Passing this spike is one layer of evidence; it does not close A5.
