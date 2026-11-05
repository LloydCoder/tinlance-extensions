# ADR 0012: MCP gateway, registry and product adapters

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

The ecosystem needs one remote MCP integration surface for supported clients. MCP is a protocol adapter, not a product database, business-logic layer or execution authority.

## Proposed decision

Use the official **MCP 2026-07-28** specification as the initial compatibility target, with stateless Streamable HTTP semantics. Implement the exact pinned revision, including its per-request metadata/header rules; do not mix older session-based transport behavior into the server. Keep protocol state separate from durable application jobs.

Expose one umbrella Tinlance Extensions server with namespaced, versioned tool definitions. Each tool records owner, input/output schema, data class, permission scopes, side effects, risk, approval requirements, idempotency, timeout, rate/budget class and lifecycle status. Adapters call typed product APIs; they do not access product databases directly or duplicate product business rules.

## Security requirements

- Validate request version and required headers exactly as the pinned specification requires.
- Validate Origin/host and apply DNS rebinding protections.
- OAuth/resource-server validation, audience-bound tokens and tenant resolution on every request.
- Bounded request/response sizes, timeouts, concurrency and pagination.
- Tool annotations are descriptive only; server policy remains authoritative.
- No write or execution capability before negative authorization and approval-bypass tests pass.
- Do not claim client compatibility or marketplace approval without test/submission evidence.

## Acceptance evidence

Pinned spec and SDK; conformance fixtures; protocol negotiation/error tests; auth and tenant isolation tests; deterministic tool listing; schema fingerprinting; client matrix; load and abuse tests; Agent Platform no-bypass tests.

## References

- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
