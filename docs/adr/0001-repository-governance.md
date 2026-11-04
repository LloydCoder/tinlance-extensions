# ADR 0001: Repository foundation and governance

- **Status:** Accepted for foundation implementation
- **Date:** 2026-11-04
- **Decision owners:** Tinlance Limited
- **Scope:** This repository only

## Context

The repository baseline was a public GitHub repository containing a README and an Apache License 2.0 file. It had no checked-in application source, package manifest, test suite, CI workflow, security policy, contribution guide, or documented phase closeout evidence. The ecosystem roadmap must not imply those capabilities already exist.

## Decision

1. Keep the existing repository license unchanged during foundation work. It is Apache License 2.0. Any change to licensing or proprietary distribution requires a separate explicit legal/IP decision; this ADR does not change or reinterpret the existing grant.
2. Establish least-privilege GitHub Actions validation with read-only repository permissions and immutable action commit pins.
3. Use dependency-free Python standard-library checks for the initial repository/documentation contract. Do not introduce an application framework or dependency graph before the product requirements and toolchain spike phases.
4. Require pull requests, green required checks, and reconciled documentation before merge.
5. Track implementation status separately from proposed architecture and roadmap intent.
6. Do not provision paid infrastructure as part of this phase.
7. Keep product-specific authority in the relevant product services and consequential execution authority in the Tinlance Agent Platform.

## Consequences

- The repository has a reproducible, low-dependency quality baseline.
- The first CI workflow validates repository contracts and documentation, not a browser extension or web application build.
- Browser framework, workspace/package manager, application runtime, API, database, and deployment decisions remain future ADRs after product requirements and technical spikes.
- The existing Apache-2.0 license remains in force unless changed through a separate reviewed decision.

## Rejected alternatives

- Claiming a monorepo or application exists when no application source is present.
- Adding a large dependency stack before requirements and ownership boundaries are approved.
- Silently replacing the existing public license.
