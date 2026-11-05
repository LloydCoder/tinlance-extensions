# A3 backend/API feasibility spike

This isolated, dependency-free Node.js HTTP spike tests the backend boundary accepted in ADRs 0006, 0008 and 0009. It is not a production API, identity provider, database, queue or MCP server.

## Proved in this spike
- Explicit bearer-token verification is injected; the default verifier denies every request.
- Tenant identity is derived only from the verified principal, never from request headers or query parameters.
- Repository reads are tenant-scoped and return 404 for cross-tenant identifiers.
- Liveness/readiness endpoints, request correlation, JSON response headers and bounded routing behaviour.
- Executable negative tests for missing/invalid credentials, tenant spoofing and cross-tenant reads.

## Deliberately not proved
- OIDC/OAuth issuer, audience, JWKS, PKCE, refresh/revocation or production session lifecycle.
- PostgreSQL schema/migrations, row-level security, object storage or backup/restore.
- Durable queue/outbox, worker crash recovery, retries, cancellation or idempotency.
- Rate limiting, reverse proxy, deployment, observability backend, legal/privacy review or provider selection.

The test verifier and in-memory repository are fixtures only. They must never be reused as production authentication or persistence. A3 remains **partial** until PostgreSQL migration/tenant tests and durable worker recovery tests run against real services in CI.
