import { Pool } from "pg";
import { writeSync } from "node:fs";
import { createPostgresOutboxPublisher } from "./outbox-publisher.mjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL, max: 1 });
const tenantId = process.env.PUBLISHER_TENANT_ID;
const mode = process.env.PUBLISHER_MODE ?? "complete";
const leaseSeconds = Number(process.env.PUBLISHER_LEASE_SECONDS ?? "5");
const maxAttempts = Number(process.env.PUBLISHER_MAX_ATTEMPTS ?? "2");

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
      await adminPool.query(
        "INSERT INTO outbox_test_receipts(tenant_id, idempotency_key, event_id) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, idempotency_key) DO NOTHING",
        [tenantId, idempotencyKey, event.id]
      );
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
  await Promise.all([pool.end(), adminPool.end()]);
}
