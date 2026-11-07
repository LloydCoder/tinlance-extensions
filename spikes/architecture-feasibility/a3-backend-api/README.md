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
- The HTTP server receives its bearer verifier and repository as injected dependencies. `api-composition.mjs` now provides an environment-driven composition root that requires explicit OIDC issuer, audience and JWKS URI, then injects the RS256 verifier. It is not a production deployment: provider-specific claim mapping, approved issuer onboarding, token lifecycle, secret/config management, deployment hardening and security review remain open.
- The PostgreSQL adapter and worker/publisher runtimes use a dedicated `tinlance_app_login` role (`LOGIN NOINHERIT`, non-superuser) that is granted membership in `tinlance_app_runtime`; each tenant transaction explicitly switches role. CI connects through this login role for API, worker and publisher process tests, while a separate admin connection is used only to provision fixtures. Migration 007 creates the role but does not set a password. Production secret provisioning/rotation, migration ownership and connection-pool sizing/timeouts remain unimplemented.
- The runtime role is a non-login database role for RLS policy enforcement. The integration workflow's application connections use the dedicated non-superuser login role and explicitly switch to the restricted runtime role inside each tenant transaction. The separate superuser connection is restricted to CI fixture setup and cleanup.
- A separate two-session PostgreSQL 16 CI test holds concurrent transactions open while two runtime-role workers claim jobs, asserting `FOR UPDATE SKIP LOCKED` yields distinct jobs exactly once. The child-process worker suite independently proves concurrent process claims, process crash/restart recovery, lease heartbeat and cancellation.
- The outbox publisher process now has isolated at-least-once delivery, retry/dead-letter, heartbeat and crash-after-delivery recovery evidence. The test receiver deduplicates on the stable event ID; production transports must provide equivalent idempotency or explicitly accept duplicate side effects. No production external provider adapter, durable consumer inbox implementation, operational dead-letter tooling or deployed publisher service is included.
- Job cancellation is implemented in the database feasibility contract and worker runtime, but no production HTTP cancellation endpoint, operator authorization workflow or cancellation audit integration is deployed.
- The RS256 OIDC/JWKS verifier and least-privilege login-role contract are implemented as feasibility components, but no production identity deployment/configuration, secret rotation, rate limiting, deployment, secrets manager, backup/restore, object storage, retention/deletion, or legal/privacy review is included.

Run locally against PostgreSQL 16+ after applying migrations 001–007. Install the pinned test driver with `npm install --no-save --package-lock=false --ignore-scripts pg@8.16.3`, then run:

```sh
# Apply migrations with an administrative/migration connection.
for migration in migrations/001_platform_core.sql migrations/002_worker_leases.sql migrations/003_outbox_publisher.sql migrations/004_worker_lease_renewal.sql migrations/005_outbox_delivery_runtime.sql migrations/006_job_cancellation.sql migrations/007_app_login_role.sql; do
  psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

# Provision the application login password out of band (e.g. from a secret manager).
# The migration deliberately creates no password and stores no credential.
psql "$ADMIN_DATABASE_URL" -v app_password="$APP_DB_PASSWORD" <<'SQL'
ALTER ROLE tinlance_app_login WITH PASSWORD :'app_password';
SQL

# DATABASE_URL must authenticate as tinlance_app_login; ADMIN_DATABASE_URL is
# only for fixture setup, migration and administrative operations.
psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres.integration.sql
DATABASE_URL="$DATABASE_URL" ADMIN_DATABASE_URL="$ADMIN_DATABASE_URL" node --test postgres.repository.integration.test.mjs
DATABASE_URL="$DATABASE_URL" ADMIN_DATABASE_URL="$ADMIN_DATABASE_URL" node --test worker.process.integration.test.mjs
DATABASE_URL="$DATABASE_URL" ADMIN_DATABASE_URL="$ADMIN_DATABASE_URL" node --test outbox.process.integration.test.mjs
```

A3 remains **partial** until approved production issuer/audience/JWKS configuration and provider-specific claim mapping, managed credential provisioning/rotation, production worker/publisher supervision, provider-specific delivery adapters and durable receiver idempotency, an authorized HTTP cancellation surface, migration rollback, backup/restore, observability/SLOs and legal/security review are implemented and tested.
