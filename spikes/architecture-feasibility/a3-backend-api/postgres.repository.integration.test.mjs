import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { createApiServer } from "./server.mjs";
import { createPostgresRepository } from "./postgres-repository.mjs";

const databaseUrl = process.env.DATABASE_URL;

test("PostgreSQL API adapter enforces tenant isolation and resets pooled session context", {
  skip: !databaseUrl
}, async () => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantA = `api-tenant-a-${suffix}`;
  const tenantB = `api-tenant-b-${suffix}`;
  const recordA = `api-record-a-${suffix}`;
  const recordB = `api-record-b-${suffix}`;
  let server;

  try {
    await pool.query("INSERT INTO tenants(id) VALUES ($1), ($2)", [tenantA, tenantB]);
    await pool.query(
      "INSERT INTO tenant_records(id, tenant_id, payload) VALUES ($1, $2, $3::jsonb), ($4, $5, $6::jsonb)",
      [recordA, tenantA, JSON.stringify({ value: "alpha" }), recordB, tenantB, JSON.stringify({ value: "beta" })]
    );

    const repository = createPostgresRepository({ pool });
    server = createApiServer({
      repository,
      verifyBearer: async (token) => token === "postgres-api-test-token-0001"
        ? { subject: "api-test-user", tenantId: tenantA }
        : null
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

    // max: 1 forces the health check to reuse the same physical connection.
    // SET LOCAL ROLE and transaction-local tenant context must not leak.
    const session = await pool.query(
      "SELECT current_user AS role_name, current_setting('app.tenant_id', true) AS tenant_context"
    );
    assert.equal(session.rows[0].role_name, "postgres");
    assert.equal(session.rows[0].tenant_context, null);
  } finally {
    if (server?.listening) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await pool.query("DELETE FROM tenants WHERE id = ANY($1::text[])", [[tenantA, tenantB]]);
    await pool.end();
  }
});
