# ADR 0011: Asynchronous jobs and worker model

- **Status:** Accepted — approved by the decision owner on 2026-11-05
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited
- **Approval record:** Explicit owner confirmation in the Tinlance Extensions project conversation on 2026-11-05.

## Context

Monitoring, research, batch enrichment and security analysis may outlive an HTTP/MCP request. Protocol connections must not be used as durable job state.

## Proposed decision

Expose a durable application-level job resource with explicit owner, tenant, capability, status, progress, expiry, cancellation and result references. Use idempotency keys for submissions and an outbox/transactional handoff where database state and job dispatch must remain consistent. Run bounded workers as separate processes from the API when required.

Use retry budgets, exponential backoff with jitter, dead-letter handling, per-tenant concurrency and cost quotas, cancellation checkpoints and policy revalidation before consequential stages. Start with the simplest queue implementation that meets durability and throughput needs; do not require Redis or a hosted queue until a measured spike justifies it.

MCP Tasks may be added as an optional negotiated protocol extension. The job API remains authoritative and has a polling/status fallback.

## Acceptance evidence

Duplicate submission tests; crash/restart recovery; cancellation; retry/dead-letter; tenant isolation; budget exhaustion; policy revalidation; job expiry and deletion.
