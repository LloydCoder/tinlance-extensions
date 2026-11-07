import { setTimeout as delay } from "node:timers/promises";

const TENANT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

async function inTenantTransaction(pool, tenantId, operation) {
  const client = await pool.connect();
  let transactionOpen = false;
  let releaseError;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SET LOCAL ROLE tinlance_app_runtime");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await operation(client);
    await client.query("COMMIT");
    transactionOpen = false;
    return result;
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        releaseError = rollbackError;
      }
    }
    throw error;
  } finally {
    client.release(releaseError);
  }
}

function validateOptions({ pool, tenantId, handlers, leaseSeconds, retryDelaySeconds, maxAttempts, pollIntervalMs }) {
  if (!pool || typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL pool with connect() and query() is required");
  }
  if (typeof tenantId !== "string" || !TENANT_ID_PATTERN.test(tenantId)) {
    throw new TypeError("A valid worker tenant identifier is required");
  }
  if (!handlers || typeof handlers !== "object") {
    throw new TypeError("A job handler registry is required");
  }
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 5 || leaseSeconds > 3600) {
    throw new RangeError("leaseSeconds must be between 5 and 3600");
  }
  if (!Number.isInteger(retryDelaySeconds) || retryDelaySeconds < 0 || retryDelaySeconds > 86400) {
    throw new RangeError("retryDelaySeconds must be between 0 and 86400");
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) {
    throw new RangeError("maxAttempts must be between 1 and 100");
  }
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 50 || pollIntervalMs > 60000) {
    throw new RangeError("pollIntervalMs must be between 50 and 60000");
  }
}

export function createPostgresWorker({
  pool,
  tenantId,
  handlers,
  leaseSeconds = 30,
  retryDelaySeconds = 30,
  maxAttempts = 5,
  pollIntervalMs = 1000,
  onResult = () => {},
  onError = () => {}
}) {
  validateOptions({ pool, tenantId, handlers, leaseSeconds, retryDelaySeconds, maxAttempts, pollIntervalMs });
  const getHandler = handlers instanceof Map
    ? (jobType) => handlers.get(jobType)
    : (jobType) => Object.hasOwn(handlers, jobType) ? handlers[jobType] : undefined;

  async function currentJobState(jobId) {
    return inTenantTransaction(pool, tenantId, async (client) => {
      const result = await client.query("SELECT status FROM public.jobs WHERE id = $1", [jobId]);
      return result.rows[0]?.status ?? null;
    });
  }

  async function runOnce({ signal } = {}) {
    if (signal?.aborted) return { status: "stopped" };

    const claim = await inTenantTransaction(pool, tenantId, (client) =>
      client.query("SELECT * FROM public.claim_next_job($1)", [leaseSeconds])
    );
    const job = claim.rows[0];
    if (!job) return { status: "idle" };

    const jobId = job.id;
    const handler = getHandler(job.job_type);
    const heartbeatController = new AbortController();
    const handlerSignal = signal
      ? AbortSignal.any([signal, heartbeatController.signal])
      : heartbeatController.signal;
    let leaseLost = false;
    let cancellationRequested = false;

    const heartbeat = (async () => {
      const intervalMs = Math.max(1000, Math.floor((leaseSeconds * 1000) / 3));
      while (!heartbeatController.signal.aborted) {
        try {
          await delay(intervalMs, undefined, { signal: heartbeatController.signal });
        } catch {
          return;
        }
        if (heartbeatController.signal.aborted) return;
        try {
          const leaseState = await inTenantTransaction(pool, tenantId, async (client) => {
            const renewed = await client.query(
              "SELECT public.renew_job_lease($1, $2, $3) AS renewed",
              [job.id, job.lease_token, leaseSeconds]
            );
            if (renewed.rows[0]?.renewed === true) return "renewed";
            const current = await client.query("SELECT status FROM public.jobs WHERE id = $1", [job.id]);
            return current.rows[0]?.status === "cancelled" ? "cancelled" : "lease_lost";
          });
          if (leaseState === "cancelled") {
            cancellationRequested = true;
            heartbeatController.abort();
            return;
          }
          if (leaseState === "lease_lost") {
            leaseLost = true;
            heartbeatController.abort();
            return;
          }
        } catch {
          leaseLost = true;
          heartbeatController.abort();
          return;
        }
      }
    })();

    try {
      if (signal?.aborted) throw new Error("worker shutdown requested");
      if (typeof handler !== "function") throw new Error("unsupported job type");
      await handler(Object.freeze({
        id: job.id,
        tenantId: job.tenant_id,
        jobType: job.job_type,
        payload: job.payload,
        attempts: job.attempts,
        leaseToken: job.lease_token
      }), { signal: handlerSignal });

      if (cancellationRequested) return { status: "cancelled", jobId };
      if (signal?.aborted) throw new Error("worker shutdown requested");
      if (leaseLost) return { status: "lease_lost", jobId };

      const finished = await inTenantTransaction(pool, tenantId, async (client) => {
        const result = await client.query(
          "SELECT public.finish_job($1, $2) AS finished",
          [job.id, job.lease_token]
        );
        if (result.rows[0]?.finished === true) return "succeeded";
        const current = await client.query("SELECT status FROM public.jobs WHERE id = $1", [job.id]);
        return current.rows[0]?.status === "cancelled" ? "cancelled" : "lease_lost";
      });
      return { status: finished, jobId };
    } catch (error) {
      if (cancellationRequested) return { status: "cancelled", jobId };
      if (leaseLost) return { status: "lease_lost", jobId };
      const failedStatus = await inTenantTransaction(pool, tenantId, async (client) => {
        const result = await client.query(
          "SELECT public.fail_job($1, $2, $3, $4) AS status",
          [job.id, job.lease_token, retryDelaySeconds, maxAttempts]
        );
        return result.rows[0]?.status ?? null;
      });
      if (failedStatus === null) {
        const current = await currentJobState(job.id);
        return { status: current === "cancelled" ? "cancelled" : "lease_lost", jobId };
      }
      return {
        status: failedStatus === "failed" ? "failed" : "retry_scheduled",
        jobId,
        errorName: error instanceof Error ? error.name : "Error"
      };
    } finally {
      heartbeatController.abort();
      await heartbeat;
    }
  }

  async function run({ signal } = {}) {
    if (!signal || typeof signal.addEventListener !== "function") {
      throw new TypeError("run() requires an AbortSignal for graceful shutdown");
    }
    while (!signal.aborted) {
      try {
        const result = await runOnce({ signal });
        await onResult(result);
        if (result.status === "idle" || result.status === "lease_lost") {
          try {
            await delay(pollIntervalMs, undefined, { signal });
          } catch {
            break;
          }
        }
      } catch (error) {
        await onError(error);
        try {
          await delay(pollIntervalMs, undefined, { signal });
        } catch {
          break;
        }
      }
    }
    return { status: "stopped" };
  }

  return Object.freeze({ runOnce, run });
}
