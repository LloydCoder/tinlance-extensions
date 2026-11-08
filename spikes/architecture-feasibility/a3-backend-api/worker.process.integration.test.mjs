import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.ADMIN_DATABASE_URL;
const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "worker-test-process.mjs");

function startChild(mode, tenantId, leaseSeconds = 5) {
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
  const waiters = [];
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    stdout += chunk;
    for (const waiter of [...waiters]) {
      if (stdout.includes(waiter.fragment)) {
        clearTimeout(waiter.timer);
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve();
      }
    }
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  const closed = new Promise((resolveResult, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      for (const waiter of waiters.splice(0)) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error(`child closed before output ${waiter.fragment}; stderr=${stderr}`));
      }
      resolveResult({ code, signal, stdout, stderr });
    });
  });
  return {
    child,
    get stdout() { return stdout; },
    waitForOutput(fragment, timeoutMs = 10000) {
      if (stdout.includes(fragment)) return Promise.resolve();
      return new Promise((resolveWait, rejectWait) => {
        const waiter = {
          fragment,
          resolve: resolveWait,
          reject: rejectWait,
          timer: setTimeout(() => {
            waiters.splice(waiters.indexOf(waiter), 1);
            rejectWait(new Error(`timed out waiting for ${fragment}; stdout=${stdout}; stderr=${stderr}`));
          }, timeoutMs)
        };
        waiters.push(waiter);
      });
    },
    closed
  };
}

async function runChild(mode, tenantId, leaseSeconds = 5) {
  const running = startChild(mode, tenantId, leaseSeconds);
  const timeout = setTimeout(() => running.child.kill("SIGKILL"), 30000);
  try { return await running.closed; }
  finally { clearTimeout(timeout); }
}

async function insertJob(pool, tenantId, key) {
  const result = await pool.query(
    "INSERT INTO jobs(tenant_id, idempotency_key, job_type, payload) VALUES ($1, $2, 'test.worker', '{}'::jsonb) RETURNING id",
    [tenantId, key]
  );
  return result.rows[0].id;
}

async function asTenant(pool, tenantId, statement, params) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE tinlance_app_runtime");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await client.query(statement, params);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

test("worker processes recover crashed leases, claim concurrently, renew leases and honor tenant cancellation", {
  skip: !databaseUrl || !adminDatabaseUrl
}, async (t) => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: adminDatabaseUrl, max: 3 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantId = `worker-process-${suffix}`;
  const otherTenantId = `other-worker-${suffix}`;

  try {
    await pool.query("CREATE TABLE IF NOT EXISTS worker_test_effects (tenant_id text NOT NULL, job_id uuid NOT NULL, effect text NOT NULL, PRIMARY KEY (tenant_id, job_id))");
    await pool.query("INSERT INTO tenants(id) VALUES ($1), ($2)", [tenantId, otherTenantId]);

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

    await t.test("queued cancellation is idempotent and cannot cross tenant boundaries", async () => {
      const ownJob = await insertJob(pool, tenantId, `queued-cancel-${suffix}`);
      const otherJob = await insertJob(pool, otherTenantId, `other-cancel-${suffix}`);
      const requestId = randomUUID();
      const auditActor = "worker-test-operator";
      const cancellationSql = "SELECT public.cancel_job_audited($1, $2, $3) AS cancelled";
      assert.equal((await asTenant(pool, tenantId, cancellationSql, [ownJob, auditActor, requestId])).cancelled, true);
      assert.equal((await asTenant(pool, tenantId, cancellationSql, [ownJob, auditActor, requestId])).cancelled, true);
      assert.equal((await asTenant(pool, tenantId, cancellationSql, [otherJob, auditActor, randomUUID()])).cancelled, false);
      const row = await pool.query("SELECT status, cancelled_at, lease_token FROM jobs WHERE id = $1", [ownJob]);
      assert.equal(row.rows[0].status, "cancelled");
      assert.ok(row.rows[0].cancelled_at);
      assert.equal(row.rows[0].lease_token, null);
      const audit = await pool.query(
        "SELECT actor_id, request_id, previous_status FROM job_cancellation_audit WHERE tenant_id = $1 AND job_id = $2",
        [tenantId, ownJob]
      );
      assert.deepEqual(audit.rows, [{ actor_id: auditActor, request_id: requestId, previous_status: "queued" }]);
    });

    await t.test("running handler receives cancellation and cannot finish after its lease is revoked", async () => {
      const jobId = await insertJob(pool, tenantId, `running-cancel-${suffix}`);
      const child = startChild("slow", tenantId);
      await child.waitForOutput(`HANDLER_STARTED:${jobId}`);
      const requestId = randomUUID();
      const auditActor = "worker-test-operator";
      const cancellation = await asTenant(
        pool,
        tenantId,
        "SELECT public.cancel_job_audited($1, $2, $3) AS cancelled",
        [jobId, auditActor, requestId]
      );
      assert.equal(cancellation.cancelled, true);

      const result = await child.closed;
      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`RESULT:cancelled:${jobId}`));
      const row = await pool.query("SELECT status, cancelled_at, lease_token FROM jobs WHERE id = $1", [jobId]);
      assert.equal(row.rows[0].status, "cancelled");
      assert.ok(row.rows[0].cancelled_at);
      assert.equal(row.rows[0].lease_token, null);
      const audit = await pool.query(
        "SELECT actor_id, request_id, previous_status FROM job_cancellation_audit WHERE tenant_id = $1 AND job_id = $2",
        [tenantId, jobId]
      );
      assert.deepEqual(audit.rows, [{ actor_id: auditActor, request_id: requestId, previous_status: "running" }]);
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
    await pool.query("DELETE FROM worker_test_effects WHERE tenant_id = ANY($1::text[])", [[tenantId, otherTenantId]]);
    await pool.query("DELETE FROM tenants WHERE id = ANY($1::text[])", [[tenantId, otherTenantId]]);
    await pool.end();
  }
});
