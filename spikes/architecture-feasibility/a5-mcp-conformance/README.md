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

- Official TypeScript SDK v2.4.0 `Client`, `ClientCredentialsProvider`, `StreamableHTTPClientTransport`, `createMcpHandler`, and `requireBearerAuth`.
- Modern protocol negotiation pinned to `2026-07-28`; legacy protocol handling is rejected.
- In-process handler and real loopback HTTP discovery/tool-call paths.
- Stateless wire metadata: protocol-version and method headers, operation-specific `Mcp-Name`, no `Mcp-Session-Id`, and header/body mismatch rejection.
- Raw protocol negatives: missing/mismatched routing headers, unsupported protocol revision, and malformed JSON-RPC.
- EdDSA JWT access-token validation: algorithm, `typ=at+jwt`, issuer, audience/resource, expiry, non-empty subject/client/tenant identity, tenant claim, scope and action-purpose claim.
- Configurable remote JWKS verification through `jose.createRemoteJWKSet`, tested against a loopback JWKS endpoint with valid signatures, unknown `kid`, and invalid-signature rejection.
- SDK-native Bearer challenges for missing/invalid tokens and insufficient scopes.
- SDK-served RFC 9728 Protected Resource Metadata and RFC 8414 Authorization Server Metadata discovery documents.
- A synthetic loopback authorization server that exercises the official `ClientCredentialsProvider` through resource/issuer discovery, `client_secret_basic` token exchange, resource indicator binding, remote JWKS validation, and a real MCP tool call.
- Per-tool `insufficient_scope` step-up from the conformance scope to the combined conformance/action scopes; invalid client secrets are rejected.
- SDK Host/Origin validation helpers.
- Platform action-purpose binding using the shared `extensions-action-v1:` SHA-256 canonical tuple contract, with exact tenant, subject, tool and resource checks plus action-specific scope challenges.
- Cross-service hash vectors shared with the A3 Platform delegation fixture.
- Bounded streaming request-body enforcement for declared and chunked bodies, with byte limits, a configurable total read deadline and request-abort handling.
- In-flight tool cancellation propagation from the official SDK client's `AbortSignal` to the server handler's `ctx.mcpReq.signal`, verified with a synthetic long-running read-only tool.
- Negative tests for invalid issuer, audience, expiry, token type, missing/empty identity claims, missing scope, untrusted Host/Origin, oversized bodies, slow-body timeout, client abort, unknown JWKS key ID, invalid signature, wrong action/resource and cross-tenant purpose.

## Security and readiness boundary

This is a test fixture only. Signing keys are generated ephemerally and are not deployed issuer keys. The remote JWKS URL is a loopback fixture; HTTPS is required for non-loopback endpoints, but no production JWKS hosting, key custody or rotation policy is implemented. The RFC 9728 and RFC 8414 documents are synthetic metadata; their authorization/token endpoint URLs are not hosted. There is no production authorization server, token revocation/introspection, client registration, PKCE exchange, or live trust configuration. The client-credentials flow is a fixed-credential synthetic integration test only; metadata publication proves document shape and discovery routing, not a production OAuth authorization-code flow.

The tenant, subject, action and resource claims are bound in a synthetic fixture using the same action-purpose canonicalization contract as the A3 Platform delegation tests. The fixture pins one expected tenant/resource and proves mismatched tenant/action/resource purposes are denied. It does not call the live Agent Platform, validate Platform-issued tokens, resolve real resource ownership, or authorize real tenant-scoped data. Host/Origin allowlists are fixture inputs and must be replaced with reviewed production host/proxy policy.

No product adapters, database access, customer data, browser actions, write tools, replay protection, or consequential execution are exposed. Cancellation is tested only for the synthetic in-process handler; network-proxy cancellation and durable job cancellation remain separate production concerns. This fixture does not authorize a production MCP endpoint or deployment.

## Gate 0 still requires

- Production issuer integration, JWKS/key custody and rotation, revocation/introspection, and a reviewed production OAuth client flow (the synthetic client-credentials interoperability test is not production issuer evidence).
- Production trusted Host/Origin and reverse-proxy topology tests, including DNS-rebinding and forwarded-header trust.
- Live tenant/action-bound authorization integration with the Tinlance Agent Platform, including real delegated-token verification, resource ownership resolution, deny-by-default tests and approval requirements.
- Full lifecycle/abuse coverage: network-level cancellation propagation through production proxies, replay/idempotency, session lifecycle, connection limits, rate limits and production ingress timeouts.
- Real-client interoperability evidence for the approved support matrix.
- Tool catalogue, risk/approval matrix, security/privacy review and formal architecture approval.

Passing this spike is one layer of evidence; it does not close A5.
