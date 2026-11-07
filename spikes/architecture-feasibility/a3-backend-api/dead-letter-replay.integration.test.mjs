import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApiServer } from "./server.mjs";
import { createPostgresRepository } from "./postgres-repository.mjs";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.ADMIN_DATABASE_URL;

test("dead-letter replay is tenant-scoped, authorized and durably audited", {
  skip: !databaseUrl || !adminDatabaseUrl
}, async () => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 1 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantA = `replay-a-${suffix}`;
  const tenantB = `replay-b-${suffix}`;
  let server;

  try {
    await adminPool.query("INSERT INTO tenants(id) VALUES ($1), ($2)", [tenantA, tenantB]);
    const jobs = await adminPool.query(
      "INSERT INTO jobs(tenant_id, idempotency_key, job_type) VALUES ($1, $2, 'test.replay'), ($3, $4, 'test.replay') RETURNING id, tenant_id",
      [tenantA, `replay-a-${suffix}`, tenantB, `replay-b-${suffix}`]
    );
    const jobA = jobs.rows.find((row) => row.tenant_id === tenantA).id;
    const jobB = jobs.rows.find((row) => row.tenant_id === tenantB).id;
    const events = await adminPool.query(
      "INSERT INTO outbox_events(tenant_id, aggregate_id, event_type, payload) VALUES ($1, $2, 'test.replay', '{}'::jsonb), ($3, $4, 'test.replay', '{}'::jsonb) RETURNING id, tenant_id",
      [tenantA, jobA, tenantB, jobB]
    );
    const eventA = events.rows.find((row) => row.tenant_id === tenantA).id;
    const eventB = events.rows.find((row) => row.tenant_id === tenantB).id;
    await adminPool.query(
      "UPDATE outbox_events SET attempts = 3, last_error_code = 'upstream_unavailable', dead_lettered_at = now() WHERE id = ANY($1::uuid[])",
      [[eventA, eventB]]
    );
    await adminPool.query(
      "INSERT INTO outbox_replay_audit(tenant_id, event_id, replay_number, actor_id, request_id) VALUES ($1, $2, 1, 'tenant-b-operator', $3)",
      [tenantB, eventB, randomUUID()]
    );

    const repository = createPostgresRepository({ pool });
    server = createApiServer({
      repository,
      verifyBearer: async (token) => token === "postgres-replay-test-token-0001"
        ? { subject: "operator-42", tenantId: tenantA }
        : null,
      authorizeOutboxReplay: async ({ principal }) => principal.subject === "operator-42"
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = { authorization: "Bearer postgres-replay-test-token-0001" };

    const replayed = await fetch(`${base}/v1/outbox/dead-letters/${eventA}/replay`, { method: "POST", headers });
    assert.equal(replayed.status, 200);
    assert.deepEqual(await replayed.json(), { status: "requeued" });
    const requestId = replayed.headers.get("x-request-id");
    assert.match(requestId, /^[0-9a-f-]{36}$/);

    const crossTenant = await fetch(`${base}/v1/outbox/dead-letters/${eventB}/replay`, { method: "POST", headers });
    assert.equal(crossTenant.status, 404);
    assert.equal((await crossTenant.json()).error, "not_found");

    const repeated = await fetch(`${base}/v1/outbox/dead-letters/${eventA}/replay`, { method: "POST", headers });
    assert.equal(repeated.status, 404);

    const state = await adminPool.query(
      "SELECT dead_lettered_at, attempts, replay_count, last_error_code, lease_token FROM outbox_events WHERE id = $1",
      [eventA]
    );
    assert.equal(state.rows[0].dead_lettered_at, null);
    assert.equal(state.rows[0].attempts, 0);
    assert.equal(state.rows[0].replay_count, 1);
    assert.equal(state.rows[0].last_error_code, null);
    assert.equal(state.rows[0].lease_token, null);

    const audit = await adminPool.query(
      "SELECT actor_id, request_id, replay_number FROM outbox_replay_audit WHERE tenant_id = $1 AND event_id = $2",
      [tenantA, eventA]
    );
    assert.equal(audit.rows.length, 1);
    assert.equal(audit.rows[0].actor_id, "operator-42");
    assert.equal(audit.rows[0].request_id, requestId);
    assert.equal(audit.rows[0].replay_number, 1);

    const crossTenantAudit = await adminPool.query(
      "SELECT count(*)::int AS count FROM outbox_replay_audit WHERE tenant_id = $1 AND event_id = $2",
      [tenantB, eventB]
    );
    assert.equal(crossTenantAudit.rows[0].count, 1);

    const rlsClient = await pool.connect();
    try {
      await rlsClient.query("BEGIN");
      await rlsClient.query("SET LOCAL ROLE tinlance_app_runtime");
      await rlsClient.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA]);
      const visibleAudit = await rlsClient.query("SELECT count(*)::int AS count FROM outbox_replay_audit");
      assert.equal(visibleAudit.rows[0].count, 1);
      await rlsClient.query("COMMIT");
    } finally {
      rlsClient.release();
    }

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
