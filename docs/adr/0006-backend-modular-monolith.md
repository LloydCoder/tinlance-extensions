# ADR 0006: Backend service boundaries

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

The platform needs APIs, product adapters, identity/tenant enforcement, policy/entitlements, evidence, billing/metering and asynchronous jobs. A solo/small team must avoid premature distributed-system complexity while preserving domain ownership.

## Proposed decision

Start with a **TypeScript modular monolith** exposing versioned HTTP APIs and explicit domain modules. Keep product-specific authoritative services external behind typed adapters where they already exist. Run long-lived/background workers as separate processes from the API when workload isolation requires it, but share contracts and release provenance. Do not create microservices merely to mirror folder names.

## Module boundaries

Platform identity/tenancy; authorization/policy/approval integration; entitlements/metering; product registry/adapters; evidence/provenance; jobs/notifications; audit/observability; billing integration. Each module owns its data access and public contract.

## Consequences and controls

- No MCP handler may call databases directly where an authoritative API exists.
- Cross-module writes require explicit application service contracts and transaction/outbox rules.
- Product services retain product-specific business logic and data authority.
- Split a module into a separately deployed service only after measured scaling, isolation, ownership or availability needs.
- Keep the API and worker deployment topology portable; no cloud provider is selected here.

## Acceptance evidence

Domain dependency diagram; API schema; module boundary tests; tenant-isolation tests; migrations; worker failure/retry tests; operational health and graceful shutdown.
