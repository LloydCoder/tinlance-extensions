import { Pool } from "pg";
import { writeSync } from "node:fs";
import { createPostgresOutboxPublisher } from "./outbox-publisher.mjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const tenantId = process.env.PUBLISHER_TENANT_ID;
const mode = process.env.PUBLISHER_MODE ?? "complete";
const leaseSeconds = Number(process.env.PUBLISHER_LEASE_SECONDS ?? "5");
const maxAttempts = Number(process.env.PUBLISHER_MAX_ATTEMPTS ?? "2");

async function recordConsumerEffect(event, idempotencyKey) {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SET LOCAL ROLE tinlance_app_runtime");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const accepted = await client.query(
      "SELECT public.accept_consumer_event($1, $2, $3::jsonb) AS accepted",
      ["test.receiver", idempotencyKey, JSON.stringify(event.payload)]
    );
    if (accepted.rows[0].accepted) {
      await client.query(
        "INSERT INTO public.tenant_records(id, tenant_id, payload) VALUES ($1, $2, $3::jsonb)",
        [`consumer-effect-${event.id}`, tenantId, JSON.stringify({ eventId: event.id, payload: event.payload })]
      );
    }
    await client.query("COMMIT");
    transactionOpen = false;
    return accepted.rows[0].accepted;
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

const publisher = createPostgresOutboxPublisher({
  pool,
  tenantId,
  leaseSeconds,
  batchSize: 1,
  retryDelaySeconds: 0,
  maxAttempts,
  transports: {
    "test.event": async (event, { idempotencyKey }) => {
      if (mode === "fail") {
        throw Object.assign(new Error("simulated upstream failure"), { code: "upstream_unavailable" });
      }
      await recordConsumerEffect(event, idempotencyKey);
      if (mode === "crash-after-delivery") {
        writeSync(1, `DELIVERED:${event.id}\n`);
        process.exit(74);
      }
      if (mode === "slow") await new Promise((resolve) => setTimeout(resolve, 6500));
    }
  }
});

try {
  const result = await publisher.runOnce();
  const outcome = result.outcomes[0];
  process.stdout.write(`RESULT:${outcome?.status ?? result.status}:${outcome?.eventId ?? ""}\n`);
} finally {
  await pool.end();
}
