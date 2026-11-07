import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresWorker } from "./worker.mjs";

test("worker validates tenant, pool, handler registry and bounded lease policy", async () => {
  const pool = { connect: async () => { throw new Error("unexpected connection"); }, query: async () => ({ rows: [] }) };
  assert.throws(() => createPostgresWorker({ pool, tenantId: "tenant id", handlers: {} }), /tenant identifier/);
  assert.throws(() => createPostgresWorker({ pool, tenantId: "tenant-a", handlers: {}, leaseSeconds: 4 }), /leaseSeconds/);
  assert.throws(() => createPostgresWorker({ pool, tenantId: "tenant-a", handlers: null }), /handler registry/);
});

test("worker returns idle when the tenant has no claimable jobs", async () => {
  const statements = [];
  const client = {
    async query(statement) {
      statements.push(statement);
      if (statement === "SELECT * FROM public.claim_next_job($1)") return { rows: [] };
      return { rows: [] };
    },
    release() {}
  };
  const pool = {
    async connect() { return client; },
    async query() { return { rows: [] }; }
  };
  const worker = createPostgresWorker({ pool, tenantId: "tenant-a", handlers: {} });
  assert.deepEqual(await worker.runOnce(), { status: "idle" });
  assert.deepEqual(statements, [
    "BEGIN",
    "SET LOCAL ROLE tinlance_app_runtime",
    "SELECT set_config('app.tenant_id', $1, true)",
    "SELECT * FROM public.claim_next_job($1)",
    "COMMIT"
  ]);
});

test("worker service requires an AbortSignal for graceful shutdown", async () => {
  const pool = { connect: async () => { throw new Error("unexpected connection"); }, query: async () => ({ rows: [] }) };
  const worker = createPostgresWorker({ pool, tenantId: "tenant-a", handlers: {} });
  await assert.rejects(worker.run(), /AbortSignal/);
});
