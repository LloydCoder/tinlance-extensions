# ADR 0009: Authorization, policy, approvals and entitlements

- **Status:** Accepted — approved by the decision owner on 2026-11-05
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited
- **Approval record:** Explicit owner confirmation in the Tinlance Extensions project conversation on 2026-11-05.

## Context

The platform exposes read, write, destructive and agent-execution capabilities to browser extensions, web users and MCP clients. Authentication alone does not authorize a capability. Product entitlements and security policy are related but distinct concerns.

## Proposed decision

Use server-enforced **RBAC plus scoped policy attributes** (tenant, resource, purpose, risk, capability and context) for platform authorization. Resolve entitlements separately from authorization: a subscription may make a capability available but never grants permission to perform an action. Enforce deny-by-default and least privilege.

The Tinlance Agent Platform remains the sole authority for identity-bound authorization, policy evaluation, approval lifecycle, execution grants, secrets access and authoritative audit for governed agent actions. The Extensions API and MCP gateway may validate local product access and submit typed requests; they must not reimplement or bypass Platform authority.

## Required semantics

- Distinguish read, write, destructive and execution scopes.
- Bind approval to user, tenant, capability, target, parameters, expiry and idempotency key.
- Make approvals single-purpose, expiring, revocable and auditable.
- Revalidate policy and authorization immediately before consequential execution.
- Fail closed on missing, stale or unverifiable authorization.
- Separate emergency break-glass from normal policy; require reason and post-event review.

## Acceptance evidence

Authorization matrix; policy decision tests; tenant/object ownership tests; stale/replayed approval rejection; entitlement-vs-permission negative tests; revocation tests; Agent Platform contract tests.
