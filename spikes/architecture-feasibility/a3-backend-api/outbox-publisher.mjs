import { setTimeout as delay } from "node:timers/promises";

const TENANT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;
const ERROR_CODE_PATTERN = /^[a-z0-9_.-]{1,64}$/;

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

function validateOptions({ pool, tenantId, transports, leaseSeconds, batchSize, retryDelaySeconds, maxAttempts, pollIntervalMs }) {
  if (!pool || typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL pool with connect() and query() is required");
  }
  if (typeof tenantId !== "string" || !TENANT_ID_PATTERN.test(tenantId)) {
    throw new TypeError("A valid publisher tenant identifier is required");
  }
  if (!transports || typeof transports !== "object") {
    throw new TypeError("An event transport registry is required");
  }
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 5 || leaseSeconds > 3600) {
    throw new RangeError("leaseSeconds must be between 5 and 3600");
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
    throw new RangeError("batchSize must be between 1 and 100");
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

export function createPostgresOutboxPublisher({
  pool,
  tenantId,
  transports,
  leaseSeconds = 60,
  batchSize = 10,
  retryDelaySeconds = 30,
  maxAttempts = 8,
  pollIntervalMs = 1000,
  onResult = () => {},
  onError = () => {}
}) {
  validateOptions({ pool, tenantId, transports, leaseSeconds, batchSize, retryDelaySeconds, maxAttempts, pollIntervalMs });
  const getTransport = transports instanceof Map
    ? (eventType) => transports.get(eventType)
    : (eventType) => Object.hasOwn(transports, eventType) ? transports[eventType] : undefined;

  async function deliver(event, signal) {
    const transport = getTransport(event.event_type);
    const heartbeatController = new AbortController();
    const handlerSignal = signal
      ? AbortSignal.any([signal, heartbeatController.signal])
      : heartbeatController.signal;
    let leaseLost = false;

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
          const renewed = await inTenantTransaction(pool, tenantId, async (client) => {
            const result = await client.query(
              "SELECT public.renew_outbox_lease($1, $2, $3) AS renewed",
              [event.id, event.lease_token, leaseSeconds]
            );
            return result.rows[0]?.renewed === true;
          });
          if (!renewed) {
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
      if (signal?.aborted) throw new Error("publisher shutdown requested");
      if (typeof transport !== "function") {
        throw Object.assign(new Error("unsupported event type"), { code: "unsupported_event_type" });
      }

      await transport(Object.freeze({
        id: event.id,
        tenantId: event.tenant_id,
        aggregateId: event.aggregate_id,
        eventType: event.event_type,
        payload: event.payload,
        createdAt: event.created_at
      }), {
        idempotencyKey: event.id,
        signal: handlerSignal
      });

      if (signal?.aborted) throw new Error("publisher shutdown requested");
      if (leaseLost) return { status: "lease_lost", eventId: event.id };

      const published = await inTenantTransaction(pool, tenantId, async (client) => {
        const result = await client.query(
          "SELECT public.mark_outbox_published($1, $2) AS published",
          [event.id, event.lease_token]
        );
        return result.rows[0]?.published === true;
      });
      return published
        ? { status: "published", eventId: event.id }
        : { status: "lease_lost", eventId: event.id };
    } catch (error) {
      if (leaseLost) return { status: "lease_lost", eventId: event.id };
      const rawCode = error && typeof error === "object" ? error.code : undefined;
      const errorCode = typeof rawCode === "string" && ERROR_CODE_PATTERN.test(rawCode)
        ? rawCode
        : "delivery_failed";
      const failedStatus = await inTenantTransaction(pool, tenantId, async (client) => {
        const result = await client.query(
          "SELECT public.fail_outbox_event($1, $2, $3, $4, $5) AS status",
          [event.id, event.lease_token, errorCode, retryDelaySeconds, maxAttempts]
        );
        return result.rows[0]?.status ?? null;
      });
      if (failedStatus === null) return { status: "lease_lost", eventId: event.id };
      return { status: failedStatus, eventId: event.id, errorCode };
    } finally {
      heartbeatController.abort();
      await heartbeat;
    }
  }

  async function runOnce({ signal } = {}) {
    if (signal?.aborted) return { status: "stopped", outcomes: [] };
    const claimed = await inTenantTransaction(pool, tenantId, (client) =>
      client.query("SELECT * FROM public.claim_outbox_events($1, $2)", [leaseSeconds, batchSize])
    );
    if (claimed.rows.length === 0) return { status: "idle", outcomes: [] };
    const outcomes = await Promise.all(claimed.rows.map((event) => deliver(event, signal)));
    return { status: "processed", outcomes };
  }

  async function run({ signal } = {}) {
    if (!signal || typeof signal.addEventListener !== "function") {
      throw new TypeError("run() requires an AbortSignal for graceful shutdown");
    }
    while (!signal.aborted) {
      try {
        const result = await runOnce({ signal });
        await onResult(result);
        if (result.status === "idle" || result.outcomes.some((item) => item.status === "lease_lost")) {
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
