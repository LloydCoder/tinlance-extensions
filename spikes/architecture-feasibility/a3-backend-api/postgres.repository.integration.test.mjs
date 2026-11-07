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

    const repository = createPostgresRepository({ pool });
    server = createApiServer({
      repository,
      verifyBearer: async (token) => token === "postgres-api-test-token-0001"
        ? { subject: "api-test-user", tenantId: tenantA }
        : null,
      authorizeJobCancellation: async ({ principal }) => principal.subject === "api-test-user"
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
