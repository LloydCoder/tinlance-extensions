import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.ADMIN_DATABASE_URL;
const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "outbox-test-process.mjs");

function runChild(mode, tenantId, options = {}) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [fixture], {
      cwd: here,
      env: {
        ...process.env,
        PUBLISHER_MODE: mode,
        PUBLISHER_TENANT_ID: tenantId,
        PUBLISHER_LEASE_SECONDS: String(options.leaseSeconds ?? 5),
        PUBLISHER_MAX_ATTEMPTS: String(options.maxAttempts ?? 2)
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

async function insertOutboxEvent(pool, tenantId, suffix) {
  const job = await pool.query(
    "INSERT INTO jobs(tenant_id, idempotency_key, job_type, payload) VALUES ($1, $2, 'test.outbox', '{}'::jsonb) RETURNING id",
    [tenantId, `outbox-job-${suffix}`]
  );
  const event = await pool.query(
    "INSERT INTO outbox_events(tenant_id, aggregate_id, event_type, payload) VALUES ($1, $2, 'test.event', $3::jsonb) RETURNING id",
    [tenantId, job.rows[0].id, JSON.stringify({ event: suffix })]
  );
  return event.rows[0].id;
}

test("outbox publisher delivers at least once with idempotency, retries, dead letters and lease heartbeat", {
  skip: !databaseUrl || !adminDatabaseUrl
}, async (t) => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });
  const suffix = randomUUID().replaceAll("-", "");
  const tenantId = `outbox-process-${suffix}`;

  try {
    await pool.query("CREATE TABLE IF NOT EXISTS outbox_test_receipts (tenant_id text NOT NULL, idempotency_key text NOT NULL, event_id uuid NOT NULL, PRIMARY KEY (tenant_id, idempotency_key))");
    await pool.query("INSERT INTO tenants(id) VALUES ($1)", [tenantId]);

    await t.test("crash after external delivery is retried with the same idempotency key", async () => {
      const eventId = await insertOutboxEvent(pool, tenantId, `crash-${suffix}`);
      const crashed = await runChild("crash-after-delivery", tenantId);
      assert.equal(crashed.code, 74, crashed.stderr);
      assert.match(crashed.stdout, new RegExp(`DELIVERED:${eventId}`));

      const afterCrash = await pool.query("SELECT published_at, attempts, lease_token FROM outbox_events WHERE id = $1", [eventId]);
      assert.equal(afterCrash.rows[0].published_at, null);
      assert.equal(afterCrash.rows[0].attempts, 1);
      assert.ok(afterCrash.rows[0].lease_token);

      await pool.query("UPDATE outbox_events SET lease_expires_at = now() - interval '1 second' WHERE id = $1", [eventId]);
      const restarted = await runChild("complete", tenantId);
      assert.equal(restarted.code, 0, restarted.stderr);
      assert.match(restarted.stdout, new RegExp(`RESULT:published:${eventId}`));

      const event = await pool.query("SELECT published_at, attempts FROM outbox_events WHERE id = $1", [eventId]);
      assert.ok(event.rows[0].published_at);
      assert.equal(event.rows[0].attempts, 2);
      const receipts = await pool.query("SELECT count(*)::int AS count FROM outbox_test_receipts WHERE tenant_id = $1 AND event_id = $2", [tenantId, eventId]);
      assert.equal(receipts.rows[0].count, 1);
    });

    await t.test("failed delivery is retried then dead-lettered at the configured attempt ceiling", async () => {
      const eventId = await insertOutboxEvent(pool, tenantId, `failure-${suffix}`);
      const first = await runChild("fail", tenantId, { maxAttempts: 2 });
      assert.equal(first.code, 0, first.stderr);
      assert.match(first.stdout, new RegExp(`RESULT:retry_scheduled:${eventId}`));
      const retry = await pool.query("SELECT attempts, last_error_code, dead_lettered_at FROM outbox_events WHERE id = $1", [eventId]);
      assert.equal(retry.rows[0].attempts, 1);
      assert.equal(retry.rows[0].last_error_code, "upstream_unavailable");
      assert.equal(retry.rows[0].dead_lettered_at, null);

      const second = await runChild("fail", tenantId, { maxAttempts: 2 });
      assert.equal(second.code, 0, second.stderr);
      assert.match(second.stdout, new RegExp(`RESULT:dead_lettered:${eventId}`));
      const dead = await pool.query("SELECT attempts, dead_lettered_at, published_at FROM outbox_events WHERE id = $1", [eventId]);
      assert.equal(dead.rows[0].attempts, 2);
      assert.ok(dead.rows[0].dead_lettered_at);
      assert.equal(dead.rows[0].published_at, null);
    });

    await t.test("lease heartbeat preserves ownership during a long external delivery", async () => {
      const eventId = await insertOutboxEvent(pool, tenantId, `heartbeat-${suffix}`);
      const result = await runChild("slow", tenantId, { leaseSeconds: 5 });
      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`RESULT:published:${eventId}`));
      const event = await pool.query("SELECT published_at, attempts FROM outbox_events WHERE id = $1", [eventId]);
      assert.ok(event.rows[0].published_at);
      assert.equal(event.rows[0].attempts, 1);
    });
  } finally {
    await pool.query("DELETE FROM outbox_test_receipts WHERE tenant_id = $1", [tenantId]);
    await pool.query("DELETE FROM tenants WHERE id = $1", [tenantId]);
    await pool.end();
  }
});
