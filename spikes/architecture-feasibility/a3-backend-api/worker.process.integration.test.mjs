import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "worker-test-process.mjs");

function runChild(mode, tenantId, leaseSeconds = 5) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [fixture], {
      cwd: here,
      env: {
        ...process.env,
        WORKER_MODE: mode,
        WORKER_TENANT_ID: tenantId,
        WORKER_LEASE_SECONDS: String(leaseSeconds)
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 30000);
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      resolveResult({ code, signal, stdout, stderr });
    });
  });
}

async function insertJob(pool, tenantId, key) {
  const result = await pool.query(
    "INSERT INTO jobs(tenant_id, idempotency_key, job_type, payload) VALUES ($1, $2, 'test.worker', '{}'::jsonb) RETURNING id",
    [tenantId, key]
  );
  return result.rows[0].id;
}

test("worker processes recover crashed leases, claim concurrently and renew long-running leases", {
  skip: !databaseUrl
}, async (t) => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantId = `worker-process-${suffix}`;

  try {
    await pool.query("CREATE TABLE IF NOT EXISTS worker_test_effects (tenant_id text NOT NULL, job_id uuid NOT NULL, effect text NOT NULL, PRIMARY KEY (tenant_id, job_id))");
    await pool.query("INSERT INTO tenants(id) VALUES ($1)", [tenantId]);

    await t.test("a new process reclaims a lease after the prior process dies", async () => {
      const jobId = await insertJob(pool, tenantId, `crash-${suffix}`);
      const crashed = await runChild("crash-after-claim", tenantId);
      assert.equal(crashed.code, 73, crashed.stderr);
      assert.match(crashed.stdout, new RegExp(`CLAIMED:${jobId}`));

      const afterCrash = await pool.query("SELECT status, attempts, lease_token FROM jobs WHERE id = $1", [jobId]);
      assert.equal(afterCrash.rows[0].status, "running");
      assert.equal(afterCrash.rows[0].attempts, 1);
      assert.ok(afterCrash.rows[0].lease_token);

      await pool.query("UPDATE jobs SET lease_expires_at = now() - interval '1 second' WHERE id = $1", [jobId]);
      const restarted = await runChild("complete", tenantId);
      assert.equal(restarted.code, 0, restarted.stderr);
      assert.match(restarted.stdout, new RegExp(`RESULT:succeeded:${jobId}`));

      const recovered = await pool.query("SELECT status, attempts FROM jobs WHERE id = $1", [jobId]);
      assert.deepEqual(recovered.rows[0], { status: "succeeded", attempts: 2 });
      const effects = await pool.query("SELECT count(*)::int AS count FROM worker_test_effects WHERE tenant_id = $1 AND job_id = $2", [tenantId, jobId]);
      assert.equal(effects.rows[0].count, 1);
    });

    await t.test("two independent worker processes claim different jobs", async () => {
      const jobA = await insertJob(pool, tenantId, `parallel-a-${suffix}`);
      const jobB = await insertJob(pool, tenantId, `parallel-b-${suffix}`);
      const results = await Promise.all([
        runChild("complete", tenantId),
        runChild("complete", tenantId)
      ]);
      for (const result of results) {
        assert.equal(result.code, 0, result.stderr);
        assert.match(result.stdout, /RESULT:succeeded:/);
      }
      const claimed = results.map((result) => result.stdout.match(/RESULT:succeeded:([0-9a-f-]{36})/)?.[1]);
      assert.equal(new Set(claimed).size, 2);
      assert.deepEqual(new Set(claimed), new Set([jobA, jobB]));
      const rows = await pool.query("SELECT status FROM jobs WHERE id = ANY($1::uuid[]) ORDER BY id", [[jobA, jobB]]);
      assert.deepEqual(rows.rows.map((row) => row.status), ["succeeded", "succeeded"]);
    });

    await t.test("lease heartbeat keeps a long-running handler from losing ownership", async () => {
      const jobId = await insertJob(pool, tenantId, `heartbeat-${suffix}`);
      const result = await runChild("slow", tenantId, 5);
      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`RESULT:succeeded:${jobId}`));
      const row = await pool.query("SELECT status, attempts FROM jobs WHERE id = $1", [jobId]);
      assert.deepEqual(row.rows[0], { status: "succeeded", attempts: 1 });
    });
  } finally {
    await pool.query("DELETE FROM worker_test_effects WHERE tenant_id = $1", [tenantId]);
    await pool.query("DELETE FROM tenants WHERE id = $1", [tenantId]);
    await pool.end();
  }
});
