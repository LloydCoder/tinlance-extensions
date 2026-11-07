import { Pool } from "pg";
import { writeSync } from "node:fs";
import { createPostgresWorker } from "./worker.mjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const tenantId = process.env.WORKER_TENANT_ID;
const mode = process.env.WORKER_MODE ?? "complete";
const leaseSeconds = Number(process.env.WORKER_LEASE_SECONDS ?? "5");

const worker = createPostgresWorker({
  pool,
  tenantId,
  leaseSeconds,
  retryDelaySeconds: 0,
  maxAttempts: 4,
  handlers: {
    "test.worker": async (job) => {
      if (mode === "crash-after-claim") {
        writeSync(1, `CLAIMED:${job.id}\n`);
        process.exit(73);
      }
      await pool.query(
        "INSERT INTO worker_test_effects(tenant_id, job_id, effect) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, job_id) DO NOTHING",
        [tenantId, job.id, "once"]
      );
      const duration = mode === "slow" ? 6500 : 200;
      await new Promise((resolve) => setTimeout(resolve, duration));
    }
  }
});

try {
  const result = await worker.runOnce();
  process.stdout.write(`RESULT:${result.status}:${result.jobId ?? ""}\n`);
} finally {
  await pool.end();
}
