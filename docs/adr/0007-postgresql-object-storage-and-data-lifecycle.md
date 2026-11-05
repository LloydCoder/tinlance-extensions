# ADR 0007: Transactional data, evidence storage and lifecycle

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

Accounts, organizations, entitlements, jobs, audit metadata and product workspace records require transactional consistency. Evidence files, page snapshots and exports may be large and require distinct retention and access controls.

## Proposed decision

Use **PostgreSQL** as the transactional system of record. Store large evidence objects and generated exports in private object storage with tenant-scoped authorization, encryption, checksums and lifecycle policies. Keep object references and integrity metadata in PostgreSQL. Do not store raw prompts, credentials or full browsing histories as telemetry.

Use explicit migrations, tenant isolation, retention schedules, deletion workflows, export paths and backup/restore tests. Choose the concrete database/object-storage vendor only after residency, budget, portability and operational constraints are approved.

## Alternatives considered

- Document database as primary store: weaker fit for relational tenancy, entitlements and audit consistency.
- Store all blobs in relational rows: possible for small payloads but inefficient for large snapshots/exports.
- Vendor-specific database/storage now: premature without residency and cost decisions.

## Acceptance evidence

ERD and data-flow map; tenant isolation and row/object authorization tests; encryption/key ownership; backup/restore; deletion propagation; retention enforcement; object integrity checks; migration rollback plan.
