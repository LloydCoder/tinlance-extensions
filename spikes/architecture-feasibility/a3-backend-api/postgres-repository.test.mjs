import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresRepository } from "./postgres-repository.mjs";

test("a failed tenant query rolls back before releasing the connection", async () => {
  const statements = [];
  const releaseErrors = [];
  const queryError = new Error("record query failed");
  const rollbackError = new Error("rollback failed");
  const client = {
    async query(statement) {
      statements.push(statement);
      if (statement.startsWith("SELECT id, tenant_id, payload")) throw queryError;
      if (statement === "ROLLBACK") throw rollbackError;
      return { rows: [] };
    },
    release(error) { releaseErrors.push(error); }
  };
  const pool = {
    async connect() { return client; },
    async query() { return { rows: [{ "?column?": 1 }] }; }
  };
  const repository = createPostgresRepository({ pool });

  await assert.rejects(
    repository.findRecordForTenant("record-1", "tenant-a"),
    (error) => error === queryError
  );
  assert.deepEqual(statements, [
    "BEGIN",
    "SET LOCAL ROLE tinlance_app_runtime",
    "SELECT set_config('app.tenant_id', $1, true)",
    "SELECT id, tenant_id, payload FROM public.tenant_records WHERE id = $1 LIMIT 1",
    "ROLLBACK"
  ]);
  assert.deepEqual(releaseErrors, [rollbackError]);
});

test("invalid tenant context is rejected before acquiring a pooled connection", async () => {
  let connectionAttempts = 0;
  const pool = {
    async connect() { connectionAttempts += 1; throw new Error("must not connect"); },
    async query() { return { rows: [] }; }
  };
  const repository = createPostgresRepository({ pool });

  await assert.rejects(repository.findRecordForTenant("record-1", "tenant id"), /valid tenant identifier/);
  assert.equal(connectionAttempts, 0);
});
