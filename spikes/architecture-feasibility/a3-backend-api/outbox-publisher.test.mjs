import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresOutboxPublisher } from "./outbox-publisher.mjs";

test("outbox publisher validates tenant, transport registry and bounded policy", () => {
  const pool = { connect: async () => { throw new Error("unexpected connection"); }, query: async () => ({ rows: [] }) };
  assert.throws(() => createPostgresOutboxPublisher({ pool, tenantId: "tenant id", transports: {} }), /tenant identifier/);
  assert.throws(() => createPostgresOutboxPublisher({ pool, tenantId: "tenant-a", transports: {}, batchSize: 0 }), /batchSize/);
  assert.throws(() => createPostgresOutboxPublisher({ pool, tenantId: "tenant-a", transports: null }), /transport registry/);
});

test("outbox publisher returns idle when there are no claimable events", async () => {
  const statements = [];
  const client = {
    async query(statement) {
      statements.push(statement);
      if (statement === "SELECT * FROM public.claim_outbox_events($1, $2)") return { rows: [] };
      return { rows: [] };
    },
    release() {}
  };
  const pool = {
    async connect() { return client; },
    async query() { return { rows: [] }; }
  };
  const publisher = createPostgresOutboxPublisher({ pool, tenantId: "tenant-a", transports: {} });
  assert.deepEqual(await publisher.runOnce(), { status: "idle", outcomes: [] });
  assert.deepEqual(statements, [
    "BEGIN",
    "SET LOCAL ROLE tinlance_app_runtime",
    "SELECT set_config('app.tenant_id', $1, true)",
    "SELECT * FROM public.claim_outbox_events($1, $2)",
    "COMMIT"
  ]);
});

test("outbox publisher run loop requires an AbortSignal", async () => {
  const pool = { connect: async () => { throw new Error("unexpected connection"); }, query: async () => ({ rows: [] }) };
  const publisher = createPostgresOutboxPublisher({ pool, tenantId: "tenant-a", transports: {} });
  await assert.rejects(publisher.run(), /AbortSignal/);
});
