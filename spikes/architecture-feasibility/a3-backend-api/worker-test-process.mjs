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
    "test.worker": async (job, { signal }) => {
      if (mode === "crash-after-claim") {
        writeSync(1, `CLAIMED:${job.id}\n`);
        process.exit(73);
      }
      await pool.query(
        "INSERT INTO worker_test_effects(tenant_id, job_id, effect) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, job_id) DO NOTHING",
        [tenantId, job.id, "once"]
      );
      if (mode === "slow") {
        writeSync(1, `HANDLER_STARTED:${job.id}\n`);
        await new Promise((resolve, reject) => {
          if (signal.aborted) {
            reject(Object.assign(new Error("handler cancelled"), { name: "AbortError" }));
            return;
          }
          const timer = setTimeout(resolve, 6500);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(Object.assign(new Error("handler cancelled"), { name: "AbortError" }));
          }, { once: true });
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }
});

try {
  const result = await worker.runOnce();
  process.stdout.write(`RESULT:${result.status}:${result.jobId ?? ""}\n`);
} finally {
  await pool.end();
}
