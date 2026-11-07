import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "./server.mjs";

const records = [
  { id: "r1", tenantId: "tenant-a", value: "alpha" },
  { id: "r2", tenantId: "tenant-b", value: "beta" }
];

async function withServer(fn, ready = true) {
  const repository = {
    async isReady() { return ready; },
    async findRecordForTenant(id, tenantId) {
      return records.find((item) => item.id === id && item.tenantId === tenantId) ?? null;
    }
  };
  const server = createApiServer({
    repository,
    verifyBearer: async (token) => token === "valid-test-token-0001"
      ? { subject: "user-a", tenantId: "tenant-a" }
      : null
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await fn(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("liveness and readiness are separate from authenticated application routes", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/health/live`)).status, 200);
    assert.equal((await fetch(`${base}/health/ready`)).status, 200);
  });
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/health/ready`)).status, 503);
  }, false);
});

test("missing and invalid bearer credentials fail closed", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/v1/me`)).status, 401);
    assert.equal((await fetch(`${base}/v1/me`, { headers: { authorization: "Bearer invalid-token-0000" } })).status, 401);
  });
});

test("tenant identity comes from verified principal, not caller-controlled headers", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/me`, {
      headers: { authorization: "Bearer valid-test-token-0001", "x-tenant-id": "tenant-b" }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { subject: "user-a", tenantId: "tenant-a" });
  });
});

test("cross-tenant record identifiers are indistinguishable from missing records", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/records/r2`, {
      headers: { authorization: "Bearer valid-test-token-0001" }
    });
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, "not_found");
  });
});

test("tenant-owned records are readable and responses are not cacheable", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/records/r1`, {
      headers: { authorization: "Bearer valid-test-token-0001" }
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
    assert.deepEqual(await response.json(), { record: records[0] });
  });
});

test("unsupported methods are rejected with an explicit allow header", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/me`, { method: "POST" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET");
  });
});

const cancellationJobId = "a4f6d9e2-1c3b-4a5d-8e7f-9012bc345678";

async function withCancellationServer(fn, cancellationResult = true) {
  const calls = [];
  const repository = {
    async isReady() { return true; },
    async findRecordForTenant() { return null; },
    async cancelJobForTenant(jobId, tenantId) {
      calls.push({ jobId, tenantId });
      return cancellationResult;
    }
  };
  const server = createApiServer({
    repository,
    verifyBearer: async (token) => token === "valid-test-token-0001"
      ? { subject: "user-a", tenantId: "tenant-a" }
      : null
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await fn(`http://127.0.0.1:${address.port}`, calls); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("authenticated tenant can cancel its own job through the API", async () => {
  await withCancellationServer(async (base, calls) => {
    const response = await fetch(`${base}/v1/jobs/${cancellationJobId}/cancel`, {
      method: "POST",
      headers: { authorization: "Bearer valid-test-token-0001" }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "cancelled" });
    assert.deepEqual(calls, [{ jobId: cancellationJobId, tenantId: "tenant-a" }]);
  });
});

test("missing and cross-tenant jobs have the same cancellation response", async () => {
  await withCancellationServer(async (base, calls) => {
    const response = await fetch(`${base}/v1/jobs/${cancellationJobId}/cancel`, {
      method: "POST",
      headers: { authorization: "Bearer valid-test-token-0001" }
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found", requestId: response.headers.get("x-request-id") });
    assert.equal(calls.length, 1);
  }, false);
});

test("job cancellation requires authentication and rejects unsupported methods", async () => {
  await withCancellationServer(async (base, calls) => {
    const path = `${base}/v1/jobs/${cancellationJobId}/cancel`;
    const unauthenticated = await fetch(path, { method: "POST" });
    assert.equal(unauthenticated.status, 401);
    const unsupported = await fetch(path, {
      method: "DELETE",
      headers: { authorization: "Bearer valid-test-token-0001" }
    });
    assert.equal(unsupported.status, 405);
    assert.equal(unsupported.headers.get("allow"), "POST");
    assert.equal(calls.length, 0);
  });
});
