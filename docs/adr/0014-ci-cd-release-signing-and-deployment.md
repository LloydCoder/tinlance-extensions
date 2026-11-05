# ADR 0014: CI/CD, release signing and deployment

- **Status:** Accepted — approved by the decision owner on 2026-11-05
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited
- **Approval record:** Explicit owner confirmation in the Tinlance Extensions project conversation on 2026-11-05.

## Context

The portfolio contains many independently released extensions plus web/API/MCP services. A compromised build pipeline or unreviewed release can compromise all customers.

## Proposed decision

Use GitHub Actions with least-privilege workflow permissions, immutable action references where practical, protected release approvals and separate environments. Require reproducible lockfile-based builds, lint/typecheck/unit/contract/security checks, secret and dependency scanning, license review, SBOM and provenance for release artifacts.

Release each extension independently with source commit, version, browser target, artifact checksum, test evidence, permission manifest, review record and rollback path. Web/API/MCP releases use staged deployment, health checks, feature flags, migration compatibility and rollback. Secrets are injected from an approved secret manager at runtime and never stored in source or extension bundles.

## Deferred decisions

Cloud provider, CI runner hosting, signing-key custody service, artifact registry, deployment orchestrator and environment topology require a separate cost/security decision. No infrastructure spend is approved by this ADR.

## Acceptance evidence

Least-privilege workflow audit; secret/dependency/license scans; SBOM/provenance; signed artifact verification; environment protection; staged release and rollback exercise; browser-store package validation; backup/restore and incident runbooks.
