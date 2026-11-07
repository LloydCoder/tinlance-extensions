import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.ADMIN_DATABASE_URL;

async function beginTenantTransaction(client, tenantId) {
  await client.query("BEGIN");
  await client.query("SET LOCAL ROLE tinlance_app_runtime");
  await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
}

async function acceptEvent(client, consumerName, eventId, payload = { kind: "test.event" }) {
  const result = await client.query(
    "SELECT public.accept_consumer_event($1, $2, $3::jsonb) AS accepted",
    [consumerName, eventId, JSON.stringify(payload)]
  );
  return result.rows[0].accepted;
}

test("durable consumer inbox deduplicates concurrent deliveries within tenant transactions", {
  skip: !databaseUrl || !adminDatabaseUrl
}, async (t) => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 1 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantA = `inbox-a-${suffix}`;
  const tenantB = `inbox-b-${suffix}`;
  const eventId = randomUUID();
  const rollbackEventId = randomUUID();
  const concurrentEventId = randomUUID();

  try {
    await adminPool.query("INSERT INTO tenants(id) VALUES ($1), ($2)", [tenantA, tenantB]);

    await t.test("first delivery is accepted and duplicate delivery is rejected durably", async () => {
      const first = await pool.connect();
      try {
        await beginTenantTransaction(first, tenantA);
        assert.equal(await acceptEvent(first, "test.receiver", eventId), true);
        await first.query("COMMIT");
      } finally {
        first.release();
      }

      const duplicate = await pool.connect();
      try {
        await beginTenantTransaction(duplicate, tenantA);
        assert.equal(await acceptEvent(duplicate, "test.receiver", eventId), false);
        await duplicate.query("COMMIT");
      } finally {
        duplicate.release();
      }

      const stored = await adminPool.query(
        "SELECT count(*)::int AS count FROM consumer_inbox WHERE tenant_id = $1 AND consumer_name = $2 AND event_id = $3",
        [tenantA, "test.receiver", eventId]
      );
      assert.equal(stored.rows[0].count, 1);
    });

    await t.test("event identity is isolated by tenant and consumer", async () => {
      const tenantBClient = await pool.connect();
      try {
        await beginTenantTransaction(tenantBClient, tenantB);
        assert.equal(await acceptEvent(tenantBClient, "test.receiver", eventId), true);
        await tenantBClient.query("COMMIT");
      } finally {
        tenantBClient.release();
      }

      const secondConsumer = await pool.connect();
      try {
        await beginTenantTransaction(secondConsumer, tenantA);
        assert.equal(await acceptEvent(secondConsumer, "audit.consumer", eventId), true);
        await secondConsumer.query("COMMIT");
      } finally {
        secondConsumer.release();
      }
    });

    await t.test("rolled-back acceptance can be retried because inbox and effect share a transaction", async () => {
      const rolledBack = await pool.connect();
      try {
        await beginTenantTransaction(rolledBack, tenantA);
        assert.equal(await acceptEvent(rolledBack, "rollback.consumer", rollbackEventId), true);
        await rolledBack.query(
          "INSERT INTO public.tenant_records(id, tenant_id, payload) VALUES ($1, $2, $3::jsonb)",
          [`consumer-effect-${rollbackEventId}`, tenantA, JSON.stringify({ eventId: rollbackEventId })]
        );
        await rolledBack.query("ROLLBACK");
      } finally {
        rolledBack.release();
      }

      const retry = await pool.connect();
      try {
        await beginTenantTransaction(retry, tenantA);
        assert.equal(await acceptEvent(retry, "rollback.consumer", rollbackEventId), true);
        await retry.query(
          "INSERT INTO public.tenant_records(id, tenant_id, payload) VALUES ($1, $2, $3::jsonb)",
          [`consumer-effect-${rollbackEventId}`, tenantA, JSON.stringify({ eventId: rollbackEventId })]
        );
        await retry.query("COMMIT");
      } finally {
        retry.release();
      }
    });

    await t.test("same idempotency key with a different payload is rejected", async () => {
      const client = await pool.connect();
      try {
        await beginTenantTransaction(client, tenantA);
        await assert.rejects(
          acceptEvent(client, "test.receiver", eventId, { kind: "tampered.event" }),
          /idempotency key payload mismatch/
        );
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    });

    await t.test("concurrent duplicate deliveries have exactly one accepted winner", async () => {
      const first = await pool.connect();
      const second = await pool.connect();
      try {
        await beginTenantTransaction(first, tenantA);
        assert.equal(await acceptEvent(first, "concurrent.consumer", concurrentEventId), true);

        await beginTenantTransaction(second, tenantA);
        const secondAcceptance = acceptEvent(second, "concurrent.consumer", concurrentEventId);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await first.query("COMMIT");
        assert.equal(await secondAcceptance, false);
        await second.query("COMMIT");
      } finally {
        first.release();
        second.release();
      }
    });

    await t.test("missing tenant context and oversized or malformed payloads fail closed", async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SET LOCAL ROLE tinlance_app_runtime");
        await assert.rejects(
          acceptEvent(client, "test.receiver", randomUUID()),
          /tenant context is required/
        );
        await client.query("ROLLBACK");

        await beginTenantTransaction(client, tenantA);
        await assert.rejects(
          acceptEvent(client, "Invalid Consumer", randomUUID()),
          /consumer name is invalid/
        );
        await client.query("ROLLBACK");

        await beginTenantTransaction(client, tenantA);
        await assert.rejects(
          acceptEvent(client, "test.receiver", randomUUID(), { data: "x".repeat(1_048_577) }),
          /payload must be a JSON object no larger than 1 MiB/
        );
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    });

    await t.test("RLS hides another tenant inbox rows and pooled session context is reset", async () => {
      const client = await pool.connect();
      try {
        await beginTenantTransaction(client, tenantA);
        const hidden = await client.query(
          "SELECT count(*)::int AS count FROM consumer_inbox WHERE tenant_id = $1",
          [tenantB]
        );
        assert.equal(hidden.rows[0].count, 0);
        await client.query("COMMIT");
      } finally {
        client.release();
      }

      const session = await pool.query(
        "SELECT current_user AS role_name, nullif(current_setting('app.tenant_id', true), '') AS tenant_context"
      );
      assert.equal(session.rows[0].role_name, "tinlance_app_login");
      assert.equal(session.rows[0].tenant_context, null);
    });
  } finally {
    await adminPool.query("DELETE FROM tenants WHERE id = ANY($1::text[])", [[tenantA, tenantB]]);
    await pool.end();
    await adminPool.end();
  }
});
