# A3 backend/API feasibility spike

This isolated spike is evidence, not a production API or service.

## Evidence present
- Injected bearer verification defaults to deny-all; tenant identity comes from the verified principal.
- Tenant-scoped repository contract and cross-tenant negative HTTP tests.
- PostgreSQL migration for tenant records, durable job rows, idempotency keys and transactional outbox.
- PostgreSQL row-level security (RLS) forced on tenant-owned tables; missing tenant context returns no rows.
- Integration assertions for tenant isolation, idempotent enqueue/outbox and transaction rollback.
- Durable worker lease functions with bounded lease duration, `FOR UPDATE SKIP LOCKED` claims, lease-expiry reclaim, per-claim fencing tokens, stale-worker rejection, bounded retries and terminal failure.
- PostgreSQL integration assertions for worker crash/lease-expiry recovery and fencing-token safety.
- OpenAPI 3.1 fixture and liveness/readiness separation.

## Important limitations
- The HTTP fixture still uses an in-memory repository. It is not wired to this PostgreSQL schema.
- The runtime role is a non-login database role for proving RLS policy behavior; production credential provisioning, connection-pool tenant-context reset and migration ownership remain unimplemented.
- The SQL integration tests do not yet prove concurrent worker claims, lease expiry/recovery, cancellation, retries, dead-letter handling, outbox publisher delivery, or process crash/restart.
- No OIDC issuer/JWKS validation, production token lifecycle, rate limiting, deployment, secrets manager, backup/restore, object storage, retention/deletion, or legal/privacy review is included.

Run locally against PostgreSQL 16+:
```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_platform_core.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres.integration.sql
```

A3 remains **partial** until API/database wiring, worker recovery tests, migration rollback, backup/restore and security review are complete.
