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

test("job cancellation uses the restricted role and transaction-local tenant context", async () => {
  const statements = [];
  const client = {
    async query(statement, values) {
      statements.push({ statement, values });
      if (statement === "SELECT public.cancel_job_audited($1, $2, $3) AS cancelled") {
        return { rows: [{ cancelled: true }] };
      }
      return { rows: [] };
    },
    release() {}
  };
  const pool = {
    async connect() { return client; },
    async query() { return { rows: [] }; }
  };
  const repository = createPostgresRepository({ pool });
  const jobId = "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678";
  const requestId = "mcp-0123456789abcdef0123456789abcdef";

  assert.equal(await repository.cancelJobForTenant(jobId, "tenant-a", "operator-42", requestId), true);
  assert.deepEqual(statements, [
    { statement: "BEGIN", values: undefined },
    { statement: "SET LOCAL ROLE tinlance_app_runtime", values: undefined },
    { statement: "SELECT set_config('app.tenant_id', $1, true)", values: ["tenant-a"] },
    { statement: "SELECT public.cancel_job_audited($1, $2, $3) AS cancelled", values: [jobId, "operator-42", requestId] },
    { statement: "COMMIT", values: undefined }
  ]);
});

test("invalid job identifiers are rejected before acquiring a database connection", async () => {
  let connectionAttempts = 0;
  const pool = {
    async connect() { connectionAttempts += 1; throw new Error("must not connect"); },
    async query() { return { rows: [] }; }
  };
  const repository = createPostgresRepository({ pool });

  const requestId = "mcp-0123456789abcdef0123456789abcdef";
  assert.equal(await repository.cancelJobForTenant("not-a-uuid", "tenant-a", "operator-42", requestId), false);
  assert.equal(await repository.cancelJobForTenant("a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678", "tenant-a", "operator\nforged", requestId), false);
  assert.equal(connectionAttempts, 0);
});

test("dead-letter replay passes verified tenant, actor and request identity to PostgreSQL", async () => {
  const statements = [];
  const client = {
    async query(statement, values) {
      statements.push({ statement, values });
      if (statement === "SELECT public.replay_dead_letter_event($1, $2, $3) AS replayed") {
        return { rows: [{ replayed: true }] };
      }
      return { rows: [] };
    },
    release() {}
  };
  const pool = {
    async connect() { return client; },
    async query() { return { rows: [] }; }
  };
  const repository = createPostgresRepository({ pool });
  const eventId = "c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679";
  const requestId = "mcp-0123456789abcdef0123456789abcdef";

  assert.equal(await repository.replayDeadLetterForTenant(eventId, "tenant-a", "operator-42", requestId), true);
  assert.deepEqual(statements, [
    { statement: "BEGIN", values: undefined },
    { statement: "SET LOCAL ROLE tinlance_app_runtime", values: undefined },
    { statement: "SELECT set_config('app.tenant_id', $1, true)", values: ["tenant-a"] },
    { statement: "SELECT public.replay_dead_letter_event($1, $2, $3) AS replayed", values: [eventId, "operator-42", requestId] },
    { statement: "COMMIT", values: undefined }
  ]);
});

test("invalid replay audit identities are rejected before acquiring a connection", async () => {
  let connectionAttempts = 0;
  const pool = {
    async connect() { connectionAttempts += 1; throw new Error("must not connect"); },
    async query() { return { rows: [] }; }
  };
  const repository = createPostgresRepository({ pool });
  const eventId = "c4f6d9e2-1c3b-4a5d-8e7f-9012bc345679";
  const requestId = "mcp-0123456789abcdef0123456789abcdef";

  assert.equal(await repository.replayDeadLetterForTenant(eventId, "tenant-a", "operator-42", "invalid request id"), false);
  assert.equal(await repository.replayDeadLetterForTenant(eventId, "tenant-a", "operator-42", "mcp-bad request id"), false);
  assert.equal(await repository.replayDeadLetterForTenant(eventId, "tenant-a", "", requestId), false);
  assert.equal(await repository.replayDeadLetterForTenant(eventId, "tenant-a", "operator\nforged", requestId), false);
  assert.equal(connectionAttempts, 0);
});
