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

- Official TypeScript SDK v2.4.0 `Client` and `StreamableHTTPClientTransport`.
- Official server v2.4.0 `createMcpHandler`, configured to reject legacy protocol traffic.
- Modern protocol negotiation pinned to `2026-07-28`.
- In-process handler and real loopback HTTP discovery/tool-call paths.
- Synthetic bearer-token verification, required tool scope, Host/Origin allowlists, and bounded streaming request bodies.
- Negative cases for absent/invalid credentials, missing tool scope, untrusted Host/Origin, and oversized chunked bodies.

## Security and readiness boundary

This is a test fixture only. The verifier accepts synthetic test tokens and is not an OAuth resource server. It does not validate JWT signatures, issuer, audience, expiry, revocation, client metadata, PKCE, JWKS, or production trust configuration. Host/Origin handling is a fixture for the conformance tests and is not a reverse-proxy or production network policy.

No product adapters, database access, customer data, browser actions, write tools, cancellation, replay, or consequential execution are exposed. The fixture does not authorize a production MCP endpoint or deployment.

## Gate 0 still requires

- Reviewed production OAuth/resource-server design and signed-token negative tests.
- Production-grade trusted Host/Origin middleware and proxy topology tests.
- Full stateless HTTP wire fixtures, malformed JSON-RPC, protocol mismatch, content negotiation, body/time limits, cancellation and lifecycle abuse cases.
- Tenant/action-bound authorization integration with the Tinlance Agent Platform.
- Real-client interoperability evidence for the approved support matrix.
- Tool catalogue and risk/approval matrix review.
- Security/privacy review and explicit architecture approval.

Passing this spike is one layer of evidence; it does not close A5.
