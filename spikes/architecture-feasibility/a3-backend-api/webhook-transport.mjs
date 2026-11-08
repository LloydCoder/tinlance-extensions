import { createHmac } from "node:crypto";
import { isIP } from "node:net";

const EVENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TENANT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_.-]{0,99}$/;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BODY_BYTES = 1_048_576;

function deliveryError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isLoopbackHostname(hostname) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "localhost" ||
    normalized === "::1" ||
    (isIP(normalized) === 4 && normalized.startsWith("127."));
}

function validateEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new TypeError("outbox event must be an object");
  }
  if (typeof event.id !== "string" || !EVENT_ID_PATTERN.test(event.id)) {
    throw new TypeError("outbox event ID must be a UUID");
  }
  if (typeof event.tenantId !== "string" || !TENANT_ID_PATTERN.test(event.tenantId)) {
    throw new TypeError("outbox tenant ID is invalid");
  }
  if (typeof event.aggregateId !== "string" || !EVENT_ID_PATTERN.test(event.aggregateId)) {
    throw new TypeError("outbox aggregate ID must be a UUID");
  }
  if (typeof event.eventType !== "string" || !EVENT_TYPE_PATTERN.test(event.eventType)) {
    throw new TypeError("outbox event type is invalid");
  }
  if (
    !event.payload ||
    typeof event.payload !== "object" ||
    Array.isArray(event.payload) ||
    (Object.getPrototypeOf(event.payload) !== Object.prototype &&
      Object.getPrototypeOf(event.payload) !== null)
  ) {
    throw new TypeError("outbox payload must be a plain object");
  }
  if (typeof event.createdAt !== "string" || !Number.isFinite(Date.parse(event.createdAt))) {
    throw new TypeError("outbox createdAt must be a valid timestamp");
  }
}

export function createSignedWebhookTransport({
  endpoint,
  allowedHostnames,
  secret,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  allowLoopbackHttp = false,
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof endpoint !== "string" || endpoint.length === 0) {
    throw new TypeError("webhook endpoint is required");
  }
  const target = new URL(endpoint);
  if (target.username || target.password) {
    throw new TypeError("webhook endpoint must not contain credentials");
  }
  if (target.search || target.hash) {
    throw new TypeError("webhook endpoint must not contain query parameters or fragments");
  }
  if (!Array.isArray(allowedHostnames) || allowedHostnames.length === 0) {
    throw new TypeError("webhook hostname allowlist is required");
  }
  const normalizedAllowlist = allowedHostnames.map((hostname) => {
    if (typeof hostname !== "string" || hostname.trim() !== hostname || hostname.length === 0) {
      throw new TypeError("webhook hostname allowlist entries must be exact hostnames");
    }
    return hostname.toLowerCase();
  });
  if (new Set(normalizedAllowlist).size !== normalizedAllowlist.length) {
    throw new TypeError("webhook hostname allowlist must not contain duplicates");
  }
  if (!normalizedAllowlist.includes(target.hostname.replace(/^\[|\]$/g, "").toLowerCase())) {
    throw new TypeError("webhook endpoint hostname is not in the configured allowlist");
  }
  if (target.protocol !== "https:") {
    if (
      target.protocol !== "http:" ||
      allowLoopbackHttp !== true ||
      !isLoopbackHostname(target.hostname)
    ) {
      throw new TypeError("webhook endpoint must use HTTPS; HTTP is allowed only for loopback tests");
    }
  }
  if (typeof secret !== "string" && !Buffer.isBuffer(secret) && !(secret instanceof Uint8Array)) {
    throw new TypeError("webhook signing secret must be bytes or a string");
  }
  const signingKey = Buffer.from(secret);
  if (signingKey.byteLength < 32) {
    throw new TypeError("webhook signing secret must contain at least 32 bytes");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) {
    throw new TypeError("webhook timeout must be an integer between 100 and 30000 milliseconds");
  }
  if (!Number.isInteger(maxBodyBytes) || maxBodyBytes < 1_024 || maxBodyBytes > DEFAULT_MAX_BODY_BYTES) {
    throw new TypeError("webhook maxBodyBytes must be between 1024 and 1048576");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("webhook fetch implementation is required");
  }

  const endpointUrl = target.href;
  return async function deliverOutboxEvent(event, { idempotencyKey, signal } = {}) {
    validateEvent(event);
    if (idempotencyKey !== event.id) {
      throw new TypeError("webhook idempotency key must equal event ID");
    }
    if (signal !== undefined && (
      typeof signal.aborted !== "boolean" ||
      typeof signal.addEventListener !== "function"
    )) {
      throw new TypeError("webhook signal must be an AbortSignal");
    }

    const envelope = {
      id: event.id,
      tenantId: event.tenantId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      createdAt: event.createdAt
    };
    let body;
    try {
      body = Buffer.from(JSON.stringify(envelope), "utf8");
    } catch {
      throw new TypeError("webhook event payload must be JSON serializable");
    }
    if (body.byteLength > maxBodyBytes) {
      throw new RangeError("webhook event payload exceeds configured size limit");
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", signingKey)
      .update(timestamp, "utf8")
      .update(".", "utf8")
      .update(body)
      .digest("hex");
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    let response;
    try {
      response = await fetchImpl(endpointUrl, {
        method: "POST",
        redirect: "error",
        signal: requestSignal,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "idempotency-key": event.id,
          "x-tinlance-event-type": event.eventType,
          "x-tinlance-tenant-id": event.tenantId,
          "x-tinlance-timestamp": timestamp,
          "x-tinlance-signature": `v1=${signature}`
        },
        body
      });
    } catch (error) {
      if (signal?.aborted) throw signal.reason ?? error;
      if (timeoutSignal.aborted) {
        throw deliveryError("webhook delivery timed out", "upstream_timeout");
      }
      throw deliveryError("webhook upstream is unavailable", "upstream_unavailable");
    }

    if (response.redirected || (response.status >= 300 && response.status < 400)) {
      try { await response.body?.cancel(); } catch {}
      throw deliveryError("webhook redirects are not allowed", "upstream_redirect_rejected");
    }
    if (!response.ok) {
      try { await response.body?.cancel(); } catch {}
      const code = response.status === 429
        ? "upstream_rate_limited"
        : response.status >= 500
          ? "upstream_unavailable"
          : "upstream_rejected";
      throw deliveryError(`webhook upstream returned HTTP ${response.status}`, code);
    }
    try { await response.body?.cancel(); } catch {}
    return { statusCode: response.status };
  };
}
