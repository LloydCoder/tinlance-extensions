# ADR 0003: Monorepo and workspace toolchain

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

The portfolio contains independent browser packages, a shared web platform, APIs, workers, contracts, adapters, security tooling and MCP integrations. Duplication across 26 extensions would create drift, while a monolithic runtime would create permission and release coupling.

## Proposed decision

Adopt a TypeScript-first monorepo using **pnpm workspaces** for package management and **Turborepo** for task orchestration/caching, subject to a fresh-checkout feasibility spike. Pin Node.js and pnpm versions, commit the lockfile, use strict TypeScript, and define explicit package boundaries. Keep each extension independently buildable and releasable.

## Alternatives considered

- Separate repositories: stronger isolation but high duplication and coordination cost for shared SDK/security fixes.
- npm workspaces without task orchestration: viable simpler baseline, but less explicit task graph/caching as the portfolio grows.
- Nx: capable alternative; no current evidence requires its additional conventions.

## Consequences and controls

- Shared packages must not create runtime permission coupling between extensions.
- Enforce dependency direction and prohibit circular imports.
- CI must support affected-package checks and full release validation.
- Do not add a workspace toolchain until a reproducible spike proves install/build/test from a clean checkout.
- Reassess if repository scale or independent team ownership makes the task graph costly.

## Acceptance evidence

Clean install from lockfile; deterministic lint/typecheck/unit/build; independent packaging of two representative extensions; CI cache correctness; documented upgrade and rollback procedure.
