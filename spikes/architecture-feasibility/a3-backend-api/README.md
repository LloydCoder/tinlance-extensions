# A3 backend/API feasibility spike

This isolated spike is evidence, not a production API or service.

## Evidence present
- Injected bearer verification defaults to deny-all; a configurable RS256 OIDC/JWKS bearer verifier validates issuer, audience, time claims, tenant claim, key use and signature, with bounded JWKS caching and key-rotation refresh. Tenant identity comes only from the verified principal.
- Tenant-scoped HTTP repository contract and cross-tenant negative HTTP tests.
- PostgreSQL-backed repository adapter using a pooled PostgreSQL client, a restricted runtime role, parameterized record lookup and transaction-local tenant context.
- A real PostgreSQL 16 API integration test that exercises the HTTP server through the PostgreSQL adapter, proves cross-tenant records are indistinguishable from missing records, and verifies role/tenant context is reset before a pooled connection is reused.
- PostgreSQL migration for tenant records, durable job rows, idempotency keys and transactional outbox.
- PostgreSQL row-level security (RLS) forced on tenant-owned tables; missing tenant context returns no rows.
- Integration assertions for tenant isolation, idempotent enqueue/outbox and transaction rollback.
- Durable worker lease functions with bounded lease duration, `FOR UPDATE SKIP LOCKED` claims, lease-expiry reclaim, per-claim fencing tokens, stale-worker rejection, bounded retries and terminal failure.
- A Node worker runtime with tenant-scoped claim/finish/fail/renew transactions, bounded retry policy, handler cancellation signal and periodic lease heartbeat.
- Real child-process PostgreSQL integration proving worker process death after claim, lease-expiry recovery by a new process, two concurrent worker processes claiming distinct jobs, idempotent test effects and heartbeat renewal for a long-running handler.
- PostgreSQL integration assertions for worker lease-expiry recovery and fencing-token safety.
- Tenant-bound transactional outbox publisher leases with bounded batch/lease inputs, `FOR UPDATE SKIP LOCKED` claims, expiry/reclaim, fresh fencing tokens, stale-token rejection and tenant-scoped publish acknowledgement.
- A Node outbox publisher runtime with tenant-scoped claim/renew/ack/fail transactions, configured event-type transport registry, idempotency-key propagation, bounded retries and dead-letter transition.
- Real child-process PostgreSQL integration proving crash-after-delivery recovery with receiver-side idempotency, retry/dead-letter behavior and heartbeat renewal during long external delivery.
- OpenAPI 3.1 fixture and liveness/readiness separation.

## Important limitations
- The HTTP server still receives its bearer verifier and repository as injected dependencies. The RS256 OIDC/JWKS verifier is an isolated implementation, not yet wired into a production deployment: issuer/audience/JWKS configuration, provider-specific claim mapping, token lifecycle, deployment composition root, secret/config management and security review remain open.
- The PostgreSQL adapter expects a pool whose login role is allowed to `SET ROLE tinlance_app_runtime`. Production credential provisioning, migration ownership, connection-pool sizing/timeouts and secret rotation remain unimplemented.
- The runtime role is a non-login database role for proving RLS policy behavior. The integration workflow connects as the PostgreSQL superuser and explicitly switches to the restricted runtime role inside each transaction; production must use a dedicated least-privilege login role with only the required membership.
- A separate two-session PostgreSQL 16 CI test holds concurrent transactions open while two runtime-role workers claim jobs, asserting `FOR UPDATE SKIP LOCKED` yields distinct jobs exactly once. This is database-level concurrency evidence, not a multi-process application worker service or process crash/restart test.
- The outbox publisher process now has isolated at-least-once delivery, retry/dead-letter, heartbeat and crash-after-delivery recovery evidence. The test receiver deduplicates on the stable event ID; production transports must provide equivalent idempotency or explicitly accept duplicate side effects. No production external provider adapter, durable consumer inbox implementation, operational dead-letter tooling or deployed publisher service is included.
- Job cancellation is implemented in the database feasibility contract and worker runtime, but no production HTTP cancellation endpoint, operator authorization workflow or cancellation audit integration is deployed.
- No production OIDC/JWKS validation, production credential provisioning, rate limiting, deployment, secrets manager, backup/restore, object storage, retention/deletion, or legal/privacy review is included.

Run locally against PostgreSQL 16+ after applying migrations 001–006. Install the pinned test driver with `npm install --no-save --package-lock=false --ignore-scripts pg@8.16.3`, then run:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_platform_core.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/002_worker_leases.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/003_outbox_publisher.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/004_worker_lease_renewal.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/005_outbox_delivery_runtime.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres.integration.sql
node --test postgres.repository.integration.test.mjs
node --test worker.process.integration.test.mjs
node --test outbox.process.integration.test.mjs
```

A3 remains **partial** until the production identity/token boundary and credential model, production worker composition/deployment, external outbox delivery and consumer idempotency, cancellation semantics, migration rollback, backup/restore and security review are implemented and tested.
