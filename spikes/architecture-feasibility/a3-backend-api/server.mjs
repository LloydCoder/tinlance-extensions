import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const json = (res, status, body, requestId) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId
  });
  res.end(JSON.stringify(body));
};

export function createApiServer({ verifyBearer = async () => null, repository }) {
  if (!repository || typeof repository.findRecordForTenant !== "function") {
    throw new TypeError("repository.findRecordForTenant is required");
  }

  return createServer(async (req, res) => {
    const requestId = randomUUID();
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method === "GET" && url.pathname === "/health/live") {
        return json(res, 200, { status: "ok" }, requestId);
      }
      if (req.method === "GET" && url.pathname === "/health/ready") {
        const ready = typeof repository.isReady === "function" ? await repository.isReady() : true;
        return json(res, ready ? 200 : 503, { status: ready ? "ready" : "not_ready" }, requestId);
      }
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
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
