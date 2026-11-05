# ADR 0010: Agent Platform and Browser Bridge contract

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

EXT-17 Agent Browser Bridge and any browser-facing governed workflow create a high-risk boundary between untrusted web content, an AI agent, a user-controlled browser and the Agent Platform.

## Proposed decision

Use a typed, versioned request/response contract between the Browser Bridge and the Tinlance Agent Platform. Bind every request to authenticated user and tenant identity, a capability grant, origin/tab/frame scope, action class, expiry, correlation ID and idempotency key. The Agent Platform is authoritative for authorization, policy, approvals, execution, secrets and audit.

The extension must not expose cookies, passwords, session tokens or browser credential stores to the agent. Treat page text, DOM, tool output and model-generated instructions as untrusted data. Separate read-only observation from writes. Require explicit user confirmation for messages, submissions, purchases, configuration changes and other consequential writes unless a separately approved policy authorizes a narrowly scoped workflow.

## Mandatory safety controls

- Origin and frame binding; no wildcard origin authority.
- User-visible action preview and confirmation.
- Interrupt, cancel and revoke path.
- Bounded action count, time, memory and network access.
- No arbitrary remote JavaScript or unrestricted code execution.
- Replay protection and stale-state detection.
- Complete correlation from request to Platform decision, execution and audit event.
- Safe failure on disconnect, policy outage or uncertain tab state.

## Acceptance evidence

Threat model; typed contract; origin-confusion and prompt-injection tests; cookie/token exfiltration tests; approval bypass tests; cancellation/revocation tests; audit correlation; service-worker lifecycle recovery.
