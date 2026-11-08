import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID_PATTERN = JOB_ID_PATTERN;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/;

const json = (res, status, body, requestId) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId
  });
  res.end(JSON.stringify(body));
};

export function createApiServer({
  verifyBearer = async () => null,
  authorizeJobCancellation = async () => false,
  authorizeOutboxReplay = async () => false,
  repository
}) {
  if (!repository || typeof repository.findRecordForTenant !== "function") {
    throw new TypeError("repository.findRecordForTenant is required");
  }
  if (typeof authorizeJobCancellation !== "function") {
    throw new TypeError("authorizeJobCancellation must be a function");
  }
  if (typeof authorizeOutboxReplay !== "function") {
    throw new TypeError("authorizeOutboxReplay must be a function");
  }

  return createServer(async (req, res) => {
    let requestId = randomUUID();
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method === "GET" && url.pathname === "/health/live") {
        return json(res, 200, { status: "ok" }, requestId);
      }
      if (req.method === "GET" && url.pathname === "/health/ready") {
        const ready = typeof repository.isReady === "function" ? await repository.isReady() : true;
        return json(res, ready ? 200 : 503, { status: ready ? "ready" : "not_ready" }, requestId);
      }

      const cancellationMatch = url.pathname.match(/^\/v1\/jobs\/([0-9a-f-]{36})\/cancel$/i);
      const isCancellationRoute = Boolean(cancellationMatch && JOB_ID_PATTERN.test(cancellationMatch[1]));
      const replayMatch = url.pathname.match(/^\/v1\/outbox\/dead-letters\/([0-9a-f-]{36})\/replay$/i);
      const isReplayRoute = Boolean(replayMatch && EVENT_ID_PATTERN.test(replayMatch[1]));
      const isPostActionRoute = isCancellationRoute || isReplayRoute;
      if (req.method === "POST" && isPostActionRoute) {
        const contentLength = req.headers["content-length"];
        if (req.headers["transfer-encoding"] !== undefined || (contentLength !== undefined && contentLength !== "0")) {
          req.resume();
          return json(res, 400, { error: "body_not_allowed", requestId }, requestId);
        }
      }
      if (req.method !== "GET" && !(req.method === "POST" && isPostActionRoute)) {
        req.resume();
        res.setHeader("allow", isPostActionRoute ? "POST" : "GET");
        return json(res, 405, { error: "method_not_allowed", requestId }, requestId);
      }

      const authorization = req.headers.authorization;
      if (typeof authorization !== "string" || !/^Bearer [A-Za-z0-9._~-]{16,4096}$/.test(authorization)) {
        return json(res, 401, { error: "unauthorized", requestId }, requestId);
      }
      const principal = await verifyBearer(authorization.slice(7));
      if (!principal || typeof principal.subject !== "string" || typeof principal.tenantId !== "string") {
        return json(res, 401, { error: "unauthorized", requestId }, requestId);
      }
      // A verified Platform service token carries the original trusted request ID.
      // End-user tokens do not expose this field and retain the server-generated ID.
      if (principal.requestId !== undefined) {
        if (typeof principal.requestId !== "string" || !REQUEST_ID_PATTERN.test(principal.requestId)) {
          return json(res, 401, { error: "unauthorized", requestId }, requestId);
        }
        requestId = principal.requestId;
      }

      if (req.method === "POST" && isCancellationRoute) {
        const jobId = cancellationMatch[1].toLowerCase();
        const authorized = await authorizeJobCancellation({ principal, jobId, requestId });
        if (authorized !== true) {
          return json(res, 403, { error: "forbidden", requestId }, requestId);
        }
        if (typeof repository.cancelJobForTenant !== "function") {
          return json(res, 503, { error: "not_ready", requestId }, requestId);
        }
        const cancelled = await repository.cancelJobForTenant(jobId, principal.tenantId, principal.subject, requestId);
        if (!cancelled) return json(res, 404, { error: "not_found", requestId }, requestId);
        return json(res, 200, { status: "cancelled" }, requestId);
      }

      if (req.method === "POST" && isReplayRoute) {
        const eventId = replayMatch[1].toLowerCase();
        const idempotencyKey = req.headers["idempotency-key"];
        const authorized = await authorizeOutboxReplay({ principal, eventId, requestId, idempotencyKey });
        if (authorized !== true) {
          return json(res, 403, { error: "forbidden", requestId }, requestId);
        }
        if (typeof repository.replayDeadLetterForTenant !== "function") {
          return json(res, 503, { error: "not_ready", requestId }, requestId);
        }
        const replayed = await repository.replayDeadLetterForTenant(
          eventId,
          principal.tenantId,
          principal.subject,
          requestId
        );
        if (!replayed) return json(res, 404, { error: "not_found", requestId }, requestId);
        return json(res, 200, { status: "requeued" }, requestId);
      }

      if (url.pathname === "/v1/me") {
        return json(res, 200, { subject: principal.subject, tenantId: principal.tenantId }, requestId);
      }

      const match = url.pathname.match(/^\/v1\/records\/([A-Za-z0-9_-]{1,128})$/);
      if (match) {
        const record = await repository.findRecordForTenant(match[1], principal.tenantId);
        if (!record) return json(res, 404, { error: "not_found", requestId }, requestId);
        return json(res, 200, { record }, requestId);
      }
      return json(res, 404, { error: "not_found", requestId }, requestId);
    } catch {
      return json(res, 500, { error: "internal_error", requestId }, requestId);
    }
  });
}
