import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApiServer } from "./server.mjs";
import { createPostgresRepository } from "./postgres-repository.mjs";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.ADMIN_DATABASE_URL;

test("PostgreSQL API adapter enforces tenant isolation and resets pooled session context", {
  skip: !databaseUrl || !adminDatabaseUrl
}, async () => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 1 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantA = `api-tenant-a-${suffix}`;
  const tenantB = `api-tenant-b-${suffix}`;
  const recordA = `api-record-a-${suffix}`;
  const recordB = `api-record-b-${suffix}`;
  let jobA;
  let jobB;
  let eventA;
  let eventB;
  let server;

  try {
    await adminPool.query("INSERT INTO tenants(id) VALUES ($1), ($2)", [tenantA, tenantB]);
    await adminPool.query(
      "INSERT INTO tenant_records(id, tenant_id, payload) VALUES ($1, $2, $3::jsonb), ($4, $5, $6::jsonb)",
      [recordA, tenantA, JSON.stringify({ value: "alpha" }), recordB, tenantB, JSON.stringify({ value: "beta" })]
    );
    const jobAResult = await adminPool.query(
      "INSERT INTO jobs(tenant_id, idempotency_key, job_type) VALUES ($1, $2, $3) RETURNING id",
      [tenantA, `cancel-a-${suffix}`, "test.cancel"]
    );
    const jobBResult = await adminPool.query(
      "INSERT INTO jobs(tenant_id, idempotency_key, job_type) VALUES ($1, $2, $3) RETURNING id",
      [tenantB, `cancel-b-${suffix}`, "test.cancel"]
    );
    jobA = jobAResult.rows[0].id;
    jobB = jobBResult.rows[0].id;
    const outboxEvents = await adminPool.query(
      "INSERT INTO outbox_events(tenant_id, aggregate_id, event_type, payload) VALUES ($1, $2, 'test.dead-letter', '{}'::jsonb), ($3, $4, 'test.dead-letter', '{}'::jsonb) RETURNING id, tenant_id",
      [tenantA, jobA, tenantB, jobB]
    );
    eventA = outboxEvents.rows.find((row) => row.tenant_id === tenantA).id;
    eventB = outboxEvents.rows.find((row) => row.tenant_id === tenantB).id;
    await adminPool.query(
      "UPDATE outbox_events SET attempts = 3, last_error_code = 'upstream_unavailable', dead_lettered_at = now() WHERE id = ANY($1::uuid[])",
      [[eventA, eventB]]
    );

    const repository = createPostgresRepository({ pool });
    server = createApiServer({
      repository,
      verifyBearer: async (token) => token === "postgres-api-test-token-0001"
        ? { subject: "api-test-user", tenantId: tenantA, requestId: "mcp-0123456789abcdef0123456789abcdef" }
        : null,
      authorizeJobCancellation: async ({ principal }) => principal.subject === "api-test-user",
      authorizeOutboxReplay: async ({ principal }) => principal.subject === "api-test-user"
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const headers = { authorization: "Bearer postgres-api-test-token-0001" };

    assert.equal((await fetch(`${baseUrl}/health/ready`)).status, 200);

    const ownRecord = await fetch(`${baseUrl}/v1/records/${recordA}`, { headers });
    assert.equal(ownRecord.status, 200);
    assert.deepEqual(await ownRecord.json(), {
      record: { value: "alpha", id: recordA, tenantId: tenantA }
    });

    const otherTenantRecord = await fetch(`${baseUrl}/v1/records/${recordB}`, { headers });
    assert.equal(otherTenantRecord.status, 404);
    assert.equal((await otherTenantRecord.json()).error, "not_found");

    const cancelled = await fetch(`${baseUrl}/v1/jobs/${jobA}/cancel`, { method: "POST", headers });
    assert.equal(cancelled.status, 200);
    assert.deepEqual(await cancelled.json(), { status: "cancelled" });
    const cancellationRequestId = cancelled.headers.get("x-request-id");
    const repeatedCancellation = await fetch(`${baseUrl}/v1/jobs/${jobA}/cancel`, { method: "POST", headers });
    assert.equal(repeatedCancellation.status, 200);
    assert.deepEqual(await repeatedCancellation.json(), { status: "cancelled" });

    const crossTenantCancellation = await fetch(`${baseUrl}/v1/jobs/${jobB}/cancel`, { method: "POST", headers });
    assert.equal(crossTenantCancellation.status, 404);
    assert.equal((await crossTenantCancellation.json()).error, "not_found");
    const jobStates = await adminPool.query(
      "SELECT id, status FROM jobs WHERE id = ANY($1::uuid[]) ORDER BY id",
      [[jobA, jobB]]
    );
    assert.deepEqual(jobStates.rows.map((row) => row.status).sort(), ["cancelled", "queued"]);
    const cancellationAudit = await adminPool.query(
      "SELECT actor_id, request_id, previous_status, cancelled_at FROM job_cancellation_audit WHERE tenant_id = $1 AND job_id = $2",
      [tenantA, jobA]
    );
    assert.equal(cancellationAudit.rows.length, 1);
    assert.equal(cancellationAudit.rows[0].actor_id, "api-test-user");
    assert.equal(cancellationAudit.rows[0].request_id, cancellationRequestId);
    assert.equal(cancellationAudit.rows[0].previous_status, "queued");
    assert.ok(cancellationAudit.rows[0].cancelled_at);
    const crossTenantCancellationAudit = await adminPool.query(
      "SELECT count(*)::int AS count FROM job_cancellation_audit WHERE tenant_id = $1 AND job_id = $2",
      [tenantB, jobB]
    );
    assert.equal(crossTenantCancellationAudit.rows[0].count, 0);
    const cancellationRlsClient = await pool.connect();
    try {
      await cancellationRlsClient.query("BEGIN");
      await cancellationRlsClient.query("SET LOCAL ROLE tinlance_app_runtime");
      await cancellationRlsClient.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA]);
      const visibleCancellationAudit = await cancellationRlsClient.query("SELECT count(*)::int AS count FROM job_cancellation_audit");
      assert.equal(visibleCancellationAudit.rows[0].count, 1);
      await cancellationRlsClient.query("COMMIT");
    } finally {
      cancellationRlsClient.release();
    }

    const replayed = await fetch(`${baseUrl}/v1/outbox/dead-letters/${eventA}/replay`, { method: "POST", headers });
    assert.equal(replayed.status, 200);
    assert.deepEqual(await replayed.json(), { status: "requeued" });
    const replayRequestId = replayed.headers.get("x-request-id");
    assert.equal(replayRequestId, "mcp-0123456789abcdef0123456789abcdef");
    const crossTenantReplay = await fetch(`${baseUrl}/v1/outbox/dead-letters/${eventB}/replay`, { method: "POST", headers });
    assert.equal(crossTenantReplay.status, 404);
    assert.equal((await crossTenantReplay.json()).error, "not_found");
    const repeatedReplay = await fetch(`${baseUrl}/v1/outbox/dead-letters/${eventA}/replay`, { method: "POST", headers });
    assert.equal(repeatedReplay.status, 404);

    const replayState = await adminPool.query(
      "SELECT dead_lettered_at, attempts, replay_count, last_error_code, lease_token FROM outbox_events WHERE id = $1",
      [eventA]
    );
    assert.equal(replayState.rows[0].dead_lettered_at, null);
    assert.equal(replayState.rows[0].attempts, 0);
    assert.equal(replayState.rows[0].replay_count, 1);
    assert.equal(replayState.rows[0].last_error_code, null);
    assert.equal(replayState.rows[0].lease_token, null);
    const replayAudit = await adminPool.query(
      "SELECT actor_id, request_id, replay_number, previous_attempts, previous_error_code, previous_dead_lettered_at FROM outbox_replay_audit WHERE tenant_id = $1 AND event_id = $2",
      [tenantA, eventA]
    );
    assert.equal(replayAudit.rows.length, 1);
    assert.equal(replayAudit.rows[0].actor_id, "api-test-user");
    assert.equal(replayAudit.rows[0].request_id, replayRequestId);
    assert.equal(replayAudit.rows[0].replay_number, 1);
    assert.equal(replayAudit.rows[0].previous_attempts, 3);
    assert.equal(replayAudit.rows[0].previous_error_code, "upstream_unavailable");
    assert.ok(replayAudit.rows[0].previous_dead_lettered_at);
    const crossTenantAudit = await adminPool.query(
      "SELECT count(*)::int AS count FROM outbox_replay_audit WHERE tenant_id = $1 AND event_id = $2",
      [tenantB, eventB]
    );
    assert.equal(crossTenantAudit.rows[0].count, 0);

    // PostgreSQL restores a custom GUC to an empty string after SET LOCAL
    // when it was previously unset. Normalize that state to NULL so the
    // assertion checks the security property rather than GUC representation.
    const session = await pool.query(
      "SELECT current_user AS role_name, nullif(current_setting('app.tenant_id', true), '') AS tenant_context"
    );
    assert.equal(session.rows[0].role_name, "tinlance_app_login");
    assert.equal(session.rows[0].tenant_context, null);
  } finally {
    if (server?.listening) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await adminPool.query("DELETE FROM tenants WHERE id = ANY($1::text[])", [[tenantA, tenantB]]);
    await pool.end();
    await adminPool.end();
  }
});
