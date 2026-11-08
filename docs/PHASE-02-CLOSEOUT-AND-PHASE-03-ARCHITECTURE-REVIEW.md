# Phase 02 Closeout Audit and Phase 03 Architecture Review

**Review date:** 2026-11-07
**Repository baseline:** `main` after PR #59 merge, commit `d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1`
**Status:** Phase 02 documentary audit completed; Phase 02 exit criteria remain open; ADRs 0003–0014 accepted and merged by PR #17; feasibility A1 passed, A2 partial (Chromium/Firefox/Edge/Brave/Opera MV3 permission-sensitive runtime checks passed in PRs #30/#32/#34/#38; Safari Xcode app/extension compile and package inspection passed in PR #36; Safari runtime/signing/notarization/store review remain open), A3 partial after PR #44 PostgreSQL-backed HTTP adapter proof, A4–A7 open
**Decision owner:** Tinlance Limited
**Authority:** This record is a review and recommendation package. It does not authorize application, infrastructure, paid-vendor or production MCP implementation.

## 1. Executive disposition

The repository now has a consolidated 26-product requirements baseline, a six-family canonical catalogue, a 25-phase roadmap, a competitive desk-research snapshot, a customer-discovery protocol, four portfolio proposal decisions and an accepted architecture baseline.

The audit does **not** find sufficient evidence to close Phase 02. In particular, no completed customer interviews, design-partner commitments, paid pilots, signed product-owner approvals, completed provider/data-rights reviews or approved product-specific threat models are recorded. These are evidence gates, not documentation tasks that can be marked complete by drafting more plans.

Phase 03 architecture decisions are accepted: the decision owner explicitly approved ADRs 0003–0014 on 2026-11-05 and PR #17 merged the approval record. This accepts the architecture baseline; it does not authorize product implementation. Isolated A1–A2 feasibility spikes and A3 API plus PostgreSQL 16 RLS/idempotency/outbox evidence exist (PRs #20, #22, #25, #27 and #28). PR #30 adds Chromium MV3 popup/runtime and service-worker restart evidence plus Safari Xcode packaging/project validation. PR #32 adds Chromium user-invoked keyboard-shortcut `activeTab`/`scripting` runtime proof; PR #34 adds equivalent Firefox MV3 keyboard-shortcut runtime proof; PR #36 compiles and inspects the Safari macOS app and embedded extension; PR #38 adds successful independent Edge Stable, Brave Stable and Opera Stable runtime jobs. PR #40 adds a PostgreSQL 16 two-session concurrent claim test running under `tinlance_app_runtime` and asserting distinct job IDs under overlapping transactions. PR #42 adds tenant-bound outbox publisher leases and fenced publish acknowledgement with PostgreSQL negative and recovery tests. PR #44 adds a PostgreSQL-backed HTTP repository adapter and PostgreSQL 16 HTTP integration proof. Exact-head Repository Quality and A1–A2 workflows passed for PR #38, including the complete available Chromium/Firefox/Edge/Brave/Opera runtime matrix and Safari Xcode compile/package job. A1 passed, A2 remains partial because Safari runtime enablement, signing/notarization and store validation are unproved, A3 remains partial because production API/database wiring and operational recovery are unproved, and A4–A7 remain open.

### Current gate result

| Gate | Result | Evidence / blocker |
|---|---|---|
| Catalogue identity and 26-product scope | Pass — documentary | Canonical catalogue and all 26 requirement headings reconcile |
| First-seven order preserved | Pass — documentary | Existing sequence retained; no reordering proposed |
| Product job, MVP and non-goals | Pass with review required | Product briefs exist; accountable product owners have not signed them |
| Permission and data classification | Partial | Product-level boundaries exist; final per-product privacy/security review remains open |
| Acceptance criteria | Partial | Brief-level acceptance statements exist; measurable test cases and owners still need approval |
| Product owners and RACI | Fail / open | Company owner is named; accountable product/workstream owners are not assigned |
| Customer discovery | Fail / open | Playbook exists; no completed interviews or evidence records are claimed |
| Competitive research | Partial | Public-source desk research exists; customer differentiation and current vendor terms need validation |
| Legal, privacy and provider rights | Fail / open | Contact data, AI-site DOM paths, downloads, monitoring, SERP and commerce dependencies require scoped reviews |
| Product-specific threat models | Fail / open | Baseline risks are described; reviewed and approved threat models are not evidenced |
| Commercial proof | Fail / open | No paid pilots, purchase commitments or validated willingness-to-pay evidence |
| Phase 03 architecture | Accepted baseline; feasibility partial | ADRs 0003–0014 accepted; A1 passed, A2 partial, A3 partial after PR #44 PostgreSQL-backed HTTP adapter proof, A4–A7 open |

**Phase 02 is not closed.** The only completed closeout activity in this change is the documentary reconciliation and gap assessment above.

## 2. Forensic document reconciliation

| Source of truth | Audit finding | Required treatment |
|---|---|---|
| `PRODUCT-CATALOGUE.md` | 26 IDs across six families | Keep canonical; no new product IDs |
| `PHASE-02-PRODUCT-REQUIREMENTS.md` | 26 briefs present; three truncated product names in headings corrected in this review | Product owner review and testable acceptance criteria still required |
| `PHASE-02-COMPETITIVE-VALIDATION.md` | Directional public-source snapshot | Revalidate competitors, feature claims, prices and terms during discovery |
| `PHASE-02-CUSTOMER-DISCOVERY-PLAYBOOK.md` | Interview protocol and evidence rubric present | Execute interviews; record anonymized evidence and negative findings |
| `FOUR-PROPOSAL-DECISIONS.md` | Four dispositions explicit | Preserve boundaries and validation gates |
| `SYSTEM-ARCHITECTURE.md` | Accepted architecture baseline; feasibility open | Execute A1–A7 and preserve the approved authority boundaries |
| `MASTER-ROADMAP.md` / `FINAL-PHASE-PLAN.md` | 25 phases and 18 MCP work packages | Reconcile statuses after approvals; preserve first seven |

### Portfolio invariants retained

- Exactly 26 canonical products across the six existing families.
- Existing first seven delivery slots remain unchanged: EXT-01, EXT-09, EXT-02, EXT-10, EXT-11, EXT-13, EXT-17.
- FadeReach Professional Workspace remains a validation direction over existing products, not a new product.
- Aithyrex Enterprise Guard remains an enterprise direction for EXT-02, not a new extension.
- TLER remains a shared-capability concept, not a catalogue entry or implementation commitment.
- Checkout Sentry remains outside the catalogue and implementation roadmap; discovery only.
- Tinlance Agent Platform remains the authority for identity-bound authorization, policy, approvals, execution, secrets and authoritative audit.
- MCP remains an integration boundary; it is not a second authorization or execution authority.

## 3. Phase 02 closeout work required

### P0 — required before Phase 02 can pass

1. Assign an accountable owner and reviewer for each product brief and shared workstream.
2. Review all 26 briefs with those owners; record accept/reject/change and dated evidence.
3. Turn brief acceptance statements into observable, testable acceptance criteria with test owner and evidence location.
4. Complete the first discovery wave using the existing playbook. The 30–40 interview target is a planning recommendation, not a completed sample or statistical claim.
5. Prioritize the two or three strongest opportunities from observed pain, buyer access, lawful data supply, technical feasibility and commitment strength. Do not average away critical legal/security blockers.
6. Complete product-specific threat-model reviews for the first seven and all high-risk data/authority paths.
7. Complete source/provider, privacy, terms and legal reviews for the selected MVPs.
8. Record final Phase 02 go/no-go and approve the Phase 03 inputs.

### Evidence record minimum

Each interview or pilot record must include participant code, segment, user/buyer role, consent status, recent workflow, frequency/impact, current alternative/spend, disconfirming evidence, buying authority, constraints, evidence strength E0–E5, and a concrete next step. Do not store secrets, private prompts, customer PII or confidential business records in research notes.

Phase 02 may pass only when every mandatory row in the gate table has linked evidence and a named reviewer. A target count alone is not a pass criterion.

## 4. Phase 03 accepted architecture decisions

The following decisions were approved by the decision owner and recorded in ADRs 0003–0014. They are deliberately conservative for a small engineering team: modular boundaries first, independently releasable extensions, no premature microservices, no custom identity provider, no broad permissions, and no infrastructure spend before an approved deployment/cost plan.

| ADR | Topic | Recommendation | Status |
|---|---|---|---|
| 0003 | Repository/toolchain | TypeScript monorepo, pnpm workspaces, Turborepo; strict checks and reproducible lockfile | Accepted — PR #17 |
| 0004 | Web frontend | Next.js App Router for public site, workspace, admin and developer portal; shared design system and route-group boundaries | Accepted — PR #17 |
| 0005 | Browser framework | WXT + TypeScript; separate extension packages and per-browser build/test lanes; Safari is a distinct packaging/signing lane | Accepted — PR #17 |
| 0006 | Backend | TypeScript modular monolith with versioned APIs and explicit domain modules; split deployable workers only where operationally justified | Accepted — PR #17 |
| 0007 | Data | PostgreSQL as transactional system of record; object storage for evidence/blobs; explicit lifecycle, tenant keys and deletion | Accepted — PR #17 |
| 0008 | Identity | Standards-based OIDC/OAuth integration; do not build a custom identity provider; server-side tenant binding | Accepted — PR #17 |
| 0009 | Authorization | Server-side RBAC + scoped policy/ABAC checks; Agent Platform authoritative for governed execution; entitlements are separate | Accepted — PR #17 |
| 0010 | Browser/Agent Platform | Typed, origin-bound, scoped request contract; explicit approvals; interrupt/revoke; no cookie/token exposure | Accepted — PR #17 |
| 0011 | Async jobs | Durable job API with idempotency, cancellation, retries, outbox and bounded workers; protocol Tasks optional | Accepted — PR #17 |
| 0012 | MCP | Stateless Streamable HTTP targeting MCP 2026-07-28; strict per-request validation; no protocol session assumptions | Accepted — PR #17 |
| 0013 | Data/security/observability | Data minimization, local-first sensitive processing, metadata-only telemetry by default, auditable lifecycle | Accepted — PR #17 |
| 0014 | Delivery/supply chain | CI quality gates, pinned actions, provenance/SBOM, signed release artifacts, staged rollout and rollback | Accepted — PR #17 |

### Explicitly deferred technology choices

Do not select a cloud provider, hosting vendor, paid database tier, managed identity vendor, billing processor, queue vendor, object-storage provider or observability vendor in this review. Those decisions require deployment constraints, data residency, budget, expected load, vendor terms and exit strategy. The architecture should remain portable until those facts are known.

Do not adopt microservices, Kubernetes, a service mesh, a mandatory Redis cluster, a generic workflow runtime or a custom OAuth authorization server at this stage.

## 5. Architecture review gates

| Gate | Required evidence | Blocks |
|---|---|---|
| A0 — Owner acceptance | Explicit dated approval for ADRs 0003–0014, recorded in each ADR and merged by PR #17 | **Pass — documentary** |
| A1 — Toolchain spike | Fresh-checkout frozen install, lint/typecheck/test, Next.js build and representative extension builds | **Pass — isolated spike PR #20; lockfile pinned in this PR** |
| A2 — Browser spike | WXT Chrome/Firefox MV3 builds and manifest permission tests; Chromium and Firefox permission-sensitive runtime plus Safari packaging proof | **Partial — Chromium, Firefox, Edge, Brave and Opera runtime; Safari Xcode compile/package verified** |
| A3 — Backend/API spike | API schema, auth middleware, tenant isolation test, migration and worker proof | **Partial — PR #25/#27/#28/#40/#42/#44 merged; PostgreSQL 16 RLS, idempotency, outbox, concurrent worker claim, tenant-bound lease/fencing and HTTP-to-PostgreSQL adapter tests green.** Production identity/credential provisioning, application worker lifecycle, external outbox delivery and operational recovery remain open. |
| A4 — Data/security review | Data-flow diagrams, threat models, retention/deletion, secret and audit boundaries | Sensitive-data processing |
| A5 — MCP Gate 0 | Exact 2026-07-28 protocol fixtures, headers, auth, tool contracts, negative tests and client matrix | MCP gateway implementation |
| A6 — Agent Platform contract | Typed authorization/approval/audit contract and negative no-bypass tests | Any consequential browser/agent action |
| A7 — Cost/deployment approval | Provider choice, data location, cost ceiling, backup/restore and rollback plan | Paid infrastructure or production deployment |

A green documentation workflow does not satisfy architecture gates. A1 is passed by the separate executable spike. A2 remains partial: PR #30 proves the read-only Chromium popup and MV3 service-worker restart path; PR #32 proves Chromium keyboard-shortcut `activeTab`/`scripting` runtime; PR #34 proves Firefox keyboard-shortcut `activeTab`/`scripting` runtime; PR #36 compiles and inspects the Safari Xcode app and `.appex`; PR #38 proves Edge Stable, Brave Stable and Opera Stable keyboard-shortcut runtime using their installed executables. Exact-head checks passed for PR #38. Safari runtime enablement/execution, Developer ID signing, notarization and App Store Connect/store review remain open. A3 has merged API and PostgreSQL feasibility evidence (forced RLS, tenant isolation, idempotency, transactional outbox, tenant-bound worker claims, lease recovery, stale-worker fencing and concurrent claim proof; PRs #28/#40/#42), plus a PostgreSQL-backed HTTP repository adapter and real PostgreSQL 16 HTTP integration proof (PR #44, all exact-head and post-merge checks green). A3 remains partial pending production OIDC/JWKS and token lifecycle, dedicated least-privilege database credentials, application multi-process worker execution/crash recovery, external outbox delivery/consumer idempotency, cancellation and operational recovery; Database-level concurrent claim contention is now verified by PR #40; A4–A7 remain open.

## 6. MCP protocol correction required in implementation planning

The official MCP 2026-07-28 revision is stateless at the protocol core: it removes the former initialization handshake and protocol-level sessions. Streamable HTTP uses per-request POST semantics, with required `Mcp-Method` and `Mcp-Name` header/body consistency validation. Do not implement a 2025 session-based transport by accident. Keep long-running state in explicit application job records/handles. Tasks are an optional protocol extension, not a prerequisite for durable jobs. A5 remains blocked pending executable fixtures and tests.

References:
- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 2026-07-28 announcement](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

## 7. Browser distribution correction

WXT is a reasonable shared WebExtensions framework, but Safari must not be represented as an automatic WXT publishing target. The WXT publishing guide states Safari requires a separate native wrapper/packaging flow. Initial automated compatibility should prioritize Chromium (Chrome/Edge) and Firefox; Safari remains a separately tested and signed release lane. Brave/Opera compatibility must be established through explicit tests rather than inferred from Chromium lineage.

References:
- [WXT introduction](https://wxt.dev/guide/introduction.html)
- [WXT publishing guide](https://wxt.dev/guide/essentials/publishing.html)

## 8. Architecture approval and feasibility record

**Requested decision:** accept, reject or amend each ADR 0003–0014.
**Decision owner:** Tinlance Limited.
**Current status:** ADRs 0003–0014 accepted by the decision owner and merged through PR #17 on 2026-11-05. A1 passed; A2 remains partial after PR #30's Chromium MV3 runtime/lifecycle, PR #32's Chromium keyboard-shortcut runtime, PR #34's Firefox keyboard-shortcut runtime, PR #36's Safari Xcode compile/package inspection, and PR #38's Edge/Brave/Opera keyboard-shortcut runtime evidence (exact-head checks green); Safari runtime enablement, signing/notarization and store review remain open. A3 is partial (PRs #28/#40/#42/#44 add PostgreSQL tenant isolation, worker lease/concurrency/outbox and HTTP adapter evidence); A4–A7 remain open. See [Phase 02 Evidence and Architecture Feasibility Review](PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md).
**Implementation authorization:** Not granted.
**Phase 02 status:** Open; customer, product-owner, legal/provider, commercial and product-security evidence gates remain outstanding.

The approval record is complete. The remaining work is executable feasibility proof and actual Phase 02 evidence, not another architecture approval round.

## 9. Definition of done for this review package

- [x] PR #15 audited and merged.
- [x] README documentation-link defect resolved.
- [x] 26 product requirement headings reconciled against the canonical catalogue.
- [x] First-seven sequence and four proposal dispositions checked for preservation.
- [x] Phase 02 evidence gaps recorded without claiming customer validation.
- [x] Architecture recommendations and ADR review set prepared.
- [x] MCP 2026-07-28 stateless transport implications recorded.
- [x] WXT Safari packaging limitation recorded.
- [ ] Product owners assigned and briefs accepted.
- [ ] Customer discovery completed and evidence linked.
- [ ] Product-specific threat models and legal/provider reviews approved.
- [x] Owner accepts ADRs 0003–0014 as written on 2026-11-05.
- [x] A1 toolchain spike passed in isolated CI with a committed lockfile.
- [ ] A2 browser gate fully passed (Safari runtime enablement/execution, signing/notarization, store review and Edge/Brave/Opera browser-version evidence still required; Chromium and Firefox permission-sensitive action behavior is evidenced by PRs #32 and #34).
- [ ] A3–A7 feasibility gates passed.

**Final disposition:** This PR is a governance/architecture review submission. It does not close Phase 02, approve production architecture, start implementation, authorize infrastructure spend or claim product readiness.


## 9. Post-PR #38 evidence reconciliation

PR #38 merged to `main` as `807ac4ff73868422ab40d1db5dadff5dfc815002`. Its exact-head Repository Quality [run 42373753116](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753116) and Architecture Feasibility A1–A2 [run 42373753119](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753119) passed. The A1–A2 workflow passed the clean install/build/permission tests, Safari Xcode packaging/compile, and independent Microsoft Edge Stable, Brave Stable and Opera Stable runtime jobs. Post-merge main Repository Quality [run 42373989212](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373989212) and A1–A2 [run 42373989175](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373989175) also passed. A2 remains partial solely for Safari runtime/distribution gates not covered by these CI jobs; these results do not constitute production product compatibility or store approval.


## 10. PR #40 A3 concurrency evidence

PR #40 merged as `3496b8489561250e3f473f11ca8146ca12d29d97`. Two independent PostgreSQL sessions run under the non-login `tinlance_app_runtime` role, overlap their transactions, and assert `FOR UPDATE SKIP LOCKED` yields distinct job IDs exactly once. Exact-head Repository Quality [42374813474](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813474), A3 API [42374813448](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813448), and PostgreSQL [42374813492](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813492) passed. Post-merge main Repository Quality [42374868455](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868455), A3 API [42374868482](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868482), and PostgreSQL [42374868429](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868429) also passed. This does not close A3: production API/database adapter wiring, application worker process recovery, outbox publisher delivery, cancellation and operations evidence remain open.


## 11. PR #42 outbox publisher feasibility

PR #42 merged as `39c17f75aa9c533d5752fb6df97d589bad2c5d18`. The database contract now supports tenant-scoped outbox claims with bounded lease/batch limits, `FOR UPDATE SKIP LOCKED`, lease expiry/reclaim and fencing-token acknowledgement. Tests cover fail-closed tenant context, stale token rejection, valid publish acknowledgement and cross-tenant rejection. Exact-head Repository Quality [42375210266](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210266), A3 API [42375210272](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210272), and PostgreSQL [42375210240](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210240) passed; post-merge main Repository Quality [42375274540](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274540), A3 API [42375274532](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274532), and PostgreSQL [42375274541](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274541) passed. A3 remains partial: this is not a live external publisher, delivery/retry loop, consumer idempotency implementation, production API/database wiring or worker process recovery.


## 12. PR #44 A3 API/database adapter closeout evidence

PR #44 merged as `0706c8d82f3d6a3130e141f8c567b356906ce629` and adds a real PostgreSQL-backed repository adapter to the isolated HTTP API fixture. Tenant reads execute in transactions using a restricted runtime role and transaction-local tenant context; parameterized SQL and non-enumerating 404 responses preserve the tenant boundary. The PostgreSQL 16 integration test verifies the HTTP route against the actual database, including pooled connection context reset. A rollback-failure unit test verifies potentially poisoned clients are discarded.

Exact-head Repository Quality [42376883210](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883210), A3 API [42376883208](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883208), and PostgreSQL [42376883253](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883253) passed. Post-merge main Repository Quality [42376948442](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948442), A3 API [42376948519](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948519), and PostgreSQL [42376948399](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948399) passed. A3 is still a feasibility spike, not a production backend; Phase 02 remains open and production implementation remains gated.


## 13. Post-PR #46–#52 feasibility reconciliation

Current main checkpoint: 301c54b4422e452d87384d612a1f901f2c8c7da2 after PR #52.

A3 feasibility now includes: PR #46 tenant-scoped Node worker runtime with PostgreSQL child-process crash/restart, concurrent-claim and lease-heartbeat tests; PR #47 outbox publisher runtime with bounded retry/dead-letter, heartbeat and crash-after-delivery recovery against a deduplicating test receiver; PR #48 tenant-bound cancellation and worker AbortSignal handling; PR #49 strict RS256 OIDC/JWKS bearer verification; PR #50 dedicated non-superuser tinlance_app_login role used by API, worker and publisher integration tests; PR #51 fail-fast environment-driven OIDC API composition; and PR #52 tenant-scoped POST /v1/jobs/{jobId}/cancel wired through the PostgreSQL adapter.

PR #52 exact-head Repository Quality (42392078298), A3 API (42392078129) and PostgreSQL 16 (42392078261) passed on ab5238eff808dd0f45eb973479967f5a86053af8. Post-merge A3 API (42392194443) and PostgreSQL 16 (42392194429) passed on merge commit 301c54b4422e452d87384d612a1f901f2c8c7da2.

A3 remains partial and is not a production backend. Remaining gaps: approved provider-specific issuer/tenant-claim onboarding and token lifecycle; managed production secret/database credential provisioning and rotation plus TLS/connection management; real external provider transport adapters; durable receiver-side inbox/idempotency and operational dead-letter tooling; actual Tinlance Agent Platform authorization/approval integration (the cancellation callback defaults to deny-all); cancellation audit integration; migration rollback; backup/restore and recovery objectives; production deployment/supervision; observability, alerting and SLO evidence; retention/deletion; legal/privacy review and independent security review.

Phase 02 remains open for genuine customer interviews, product-owner sign-offs, commercial evidence and legal/provider review. A2 remains partial for Safari runtime enablement/execution, signing, notarization and store review. A4–A7 remain open. Phases 4–25 remain gated as production implementation. No production implementation authorization or paid infrastructure approval is inferred.


## 14. Backup/restore feasibility checkpoint — PR #54

Current main checkpoint: b738cb43dbaec3a65344e0a9376d8ed37703ac83 after PR #54.

PR #54 adds a PostgreSQL 16 custom-format logical backup/restore CI exercise. The verifier seeds a tenant-owned row, creates and inspects a pg_dump custom archive, restores it into a fresh template0 database, verifies restored tenant data, worker/outbox/cancellation functions and forced RLS on tenant tables, then connects through tinlance_app_login and confirms transaction-local tenant context still exposes only the tenant's row. The test cleans up the restored database and source fixture.

Exact-head checks passed on b4a082fb4b814e365a1681d264b9207bf21173ab: Repository Quality 42392579775, A3 API 42392579816 and PostgreSQL 16 42392579765. Post-merge checks passed on b738cb43dbaec3a65344e0a9376d8ed37703ac83: Repository Quality 42392712741, A3 API 42392712726 and PostgreSQL 16 42392712972.

This is single-database logical restore proof within the same ephemeral PostgreSQL cluster. pg_dump does not include cluster-global roles or tablespaces; the test roles already exist in the cluster. The test does not prove cross-region recovery, PITR, backup encryption/key management, retention, production RPO/RTO, managed backup operations or a production restore runbook.

A3 remains partial and is not a production backend. Remaining gaps include approved live identity-provider onboarding and tenant-claim mapping, token lifecycle, managed credential provisioning/rotation and TLS/connection management, provider-specific external delivery, durable consumer inbox/idempotency and dead-letter operations, Agent Platform authorization/approval integration, cancellation audit, migration rollback, production deployment/supervision, observability/SLOs, retention/deletion and legal/privacy/independent security review. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.


## 15. Consumer inbox and outbox recovery evidence — PR #57

Current main checkpoint: 94b43b7a0928d87417ccd651bb62062b6315ad1c after PR #57.

PR #57 adds migration 008, a durable tenant-scoped consumer inbox keyed by (tenant_id, consumer_name, event_id), forced RLS, bounded JSON payloads, and a security-definer acceptance function that derives tenant identity only from transaction-local app.tenant_id. First acceptance returns true; same-key/same-payload redelivery returns false; same-key/different-payload redelivery fails. Concurrent duplicate delivery, rollback, tenant/consumer isolation, missing tenant context, invalid consumer names, payload limits and pooled-session reset are exercised in PostgreSQL 16 integration tests.

The outbox process test receiver now writes the inbox receipt and its local database effect in the same transaction. Crash-after-delivery recovery proves that the publisher can retry after the receiver committed but before the publisher acknowledged, without repeating the local database effect. This is at-most-once local database effect under the shared-transaction condition, not exactly-once delivery across external systems. External provider side effects still require provider idempotency keys or explicit duplicate-side-effect acceptance.

PR #57 exact-head Repository Quality (42393553306), A3 API (42393553255) and PostgreSQL 16 (42393553292) passed on bc5c9110bbda3d469b0a1335b6f672fd214d92b6. Post-merge Repository Quality (42393663373), A3 API (42393663375) and PostgreSQL 16 (42393663463) passed on merge commit 94b43b7a0928d87417ccd651bb62062b6315ad1c.

A3 remains partial and is not a production backend. Remaining gaps include approved live identity-provider onboarding and tenant-claim mapping, token lifecycle, managed credential provisioning/rotation and TLS/connection management, provider-specific external delivery and idempotency, operational dead-letter tooling, Agent Platform authorization/approval integration and cancellation audit, migration rollback, production backup/restore operations and runbook, deployment/supervision, observability/SLOs, retention/deletion and legal/privacy/independent security review. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.


## 16. Audited dead-letter replay checkpoint — PR #59

Current main checkpoint: d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1 after PR #59.

PR #59 adds migration 009 with a tenant-scoped dead-letter replay counter and append-only outbox replay audit. The database function locks only a currently dead-lettered, unpublished event belonging to the transaction-local tenant, requeues it, resets attempts/lease/failure state, increments replay_count and records actor subject, request ID, prior attempts, prior error code and prior dead-letter timestamp atomically. The HTTP POST /v1/outbox/dead-letters/{eventId}/replay route is authenticated and its authorization callback defaults to deny-all; it is forwarded through the OIDC composition root. The API rejects request bodies on operational action routes and returns non-enumerating 404 responses for missing, cross-tenant or no-longer-dead-lettered events.

Exact-head checks passed on 30f0b56f1df319d84f71daae904020370b05fe4b: Repository Quality 42394553985, A3 API 42394553843 and PostgreSQL 16 42394553804. Post-merge checks passed on d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1: Repository Quality 42394665035, A3 API 42394665046 and PostgreSQL 16 42394665064.

The replay route and audit contract are not a production operator workflow: the real Tinlance Agent Platform authorization/approval contract is not integrated, the policy remains deny-all unless explicitly injected, and no operator UI is deployed. Provider-specific delivery, managed identity/secret lifecycle, production deployment, operational dead-letter supervision, SLOs, migration rollback, production backup/restore operations, retention/deletion and independent legal/privacy/security review remain open. Phase 02 customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.



## 17. Job-cancellation audit checkpoint — PR #61

Current main checkpoint: d79e4a25a9b29ed02766e3081c187aa72f2c6e3b after PR #61.

PR #61 adds migration 010: a forced-RLS tenant-scoped `job_cancellation_audit` table and `cancel_job_audited` database function. A successful first cancellation atomically transitions the job, clears its worker lease, and records the verified actor subject, server-generated request ID, prior status and timestamp. Repeated cancellation remains idempotent without duplicate audit rows. The legacy unaudited `cancel_job` function is revoked from the runtime role. The HTTP API forwards the verified principal subject and request ID through the PostgreSQL adapter. PostgreSQL integration tests verify tenant isolation, audit contents, RLS visibility, worker cancellation behavior, and backup/restore coverage.

The PR also updates worker-process integration tests to exercise the audited cancellation contract instead of calling the now-revoked legacy function. This preserves least-privilege behavior while proving queued and running-job cancellation and audit persistence.

Exact-head checks passed on `65a39c4d4e34e93bc23f75c43744038eca7495df`: Repository Quality [run 42434981883](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42434981883), A3 API [run 42434981862](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42434981862), and PostgreSQL 16 [run 42434981863](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42434981863). PR #61 merged as `d79e4a25a9b29ed02766e3081c187aa72f2c6e3b`. Post-merge main checks passed: Repository Quality [run 42435066745](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435066745), A3 API [run 42435066688](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435066688), and PostgreSQL 16 [run 42435066651](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435066651).

This closes the **database/API cancellation audit feasibility slice**, not the production cancellation workflow. Both cancellation and dead-letter replay authorization callbacks still default to deny-all; the real Tinlance Agent Platform authorization/approval contract and audit integration are not wired. Production identity-provider onboarding and claim mapping, token lifecycle, managed secret/credential rotation, provider-specific external delivery and idempotency, operator UI, migration rollback, production backup/PITR and restore runbook, deployment/supervision, observability/SLOs, retention/deletion, and independent legal/privacy/security review remain open. Phase 02 customer/product-owner/commercial/legal evidence remains outstanding; A2 Safari runtime/distribution remains partial; A4–A7 remain open. No production implementation authorization or infrastructure spend is inferred.


## Agent Platform cancellation integration — PR #63 and Platform PR #193

Current Extensions main checkpoint: `f9c156e51d5ee69400dd34b7df8aea60497e555c`.

The A6 job-cancellation path now has both the receiving and issuing sides implemented:

- Extensions PR #63 adds a separate Platform issuer/audience/JWKS/client trust configuration. The API accepts delegated action authority only when the signed token has the configured Platform issuer, exact client ID, validated service-token claims, and the action-specific scope. Cancellation requires `extensions:jobs:cancel`; dead-letter replay requires the separate `extensions:outbox:replay` scope. Ordinary user tokens cannot self-assign these authorities. Signed Platform request IDs are used for audit correlation. PR #63 merged as `f9c156e51d5ee69400dd34b7df8aea60497e555c`.
- Agent Platform PR #193 adds the `extensions.jobs.cancel` capability, MCP gateway registration, tenant/subject/request/trace-bound transport, short-lived KMS-signed token issuance for audience `tinlance-extensions-api`, and a Platform API operation handler. It never forwards the inbound bearer token. Platform main merged as `351848b3241ec6768a3fd07ee32d3d44cec41ac3`.

Extensions PR #63 exact-head checks passed: Repository Quality [42435748336](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435748336), A3 API [42435748308](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435748308), PostgreSQL [42435748164](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435748164). Post-merge main checks passed: Repository Quality [42435821841](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435821841), A3 API [42435821888](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435821888), PostgreSQL [42435821869](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435821869).

Platform PR #193 exact-head CI, R10 certification, reference-agent, CodeQL and secret-scan checks passed on `023b0e06a4e3716be97c16b0f79020e8d0eb1859`; post-merge CI, R10, reference-agent, CodeQL, secret-scan and supply-chain attestation passed on `351848b3241ec6768a3fd07ee32d3d44cec41ac3`.

**This is a code-level integration, not a live production connection.** Deployment still needs a real Platform KMS asymmetric signing key, issuer/client ID, published HTTPS JWKS endpoint, Extensions API base URL, and matching `PLATFORM_OIDC_ISSUER`, `PLATFORM_OIDC_AUDIENCE`, `PLATFORM_OIDC_JWKS_URI`, and `PLATFORM_OIDC_CLIENT_ID` configuration. The Platform-side tool registration currently covers job cancellation only; the Extensions receiver has a separate replay scope, but the Platform-side high-risk, approval-bound dead-letter replay tool is not yet registered. Production deployment, provider identity mapping, secret rotation, and live end-to-end proof remain open.

The earlier A3 database-side cancellation audit evidence remains valid. This update does not close A3, Phase 02, A2 Safari runtime/distribution, A4–A7, or any customer/product-owner/legal/commercial approval gate.


## OIDC integer environment validation regression — PR #65

PR #65 merged to `main` as `9715a0c0541b9244124e11228057d60bf7c9e2fa`. A test-first regression check demonstrated that valid decimal integer values for OIDC and Platform OIDC cache TTL, token lifetime, clock tolerance, JWKS timeout and refresh interval were rejected by the environment parser. The defect was an over-escaped digit matcher that matched a literal backslash-plus-`d`, rather than decimal digits. The parser now accepts decimal integer strings while preserving rejection of malformed values.

The regression test was committed first and the A3 API workflow failed as expected on the test-only head `faa35d9dbe3cb7a2bea3e1f0fd09544c0c6fa85a` (A3 API run 42456390501). After the implementation fix, exact-head checks passed on `4b3ec256e2980b08806786430ab21a8e7976b939`: Repository Quality [42456413690](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413690), A3 API [42456413743](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413743), and PostgreSQL 16 [42456413585](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413585). Post-merge checks passed on `9715a0c0541b9244124e11228057d60bf7c9e2fa`: Repository Quality [42456480565](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480565), A3 API [42456480483](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480483), and PostgreSQL 16 [42456480506](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480506).

This closes the environment integer parsing regression only. It does not close A3 production readiness, production identity-provider onboarding, live KMS/JWKS deployment, secret rotation, provider delivery, operator workflows, migration rollback, production recovery objectives, observability/SLOs, retention/deletion or legal/security review. Phase 02 external evidence gates, A2 Safari runtime/distribution, and A4–A7 remain open as previously recorded.


## Platform-governed dead-letter replay integration — Platform PR #195

The companion repository `LloydCoder/tinlance-agent-platform` merged PR #195 as `a2cd923b7d187de2f0b983a169ea0f03ff96aa94`. It adds an executable Platform tool registration for `extensions_dead_letter_replay` / `extensions.outbox.dead_letter.replay`, capability `extensions.outbox.dead_letter.replay`, and resource pattern `extensions://outbox/dead-letters/{event_id}`. The operation is HIGH risk, explicitly approval-gated, and requires a normalized idempotency key.

The Platform binds tenant, subject, deterministic MCP request/run identity, event ID and idempotency key into an intent fingerprint. An injected approval verifier must consume the matching approval; missing verifier fails closed. The Platform mints a 60-second Extensions-audience service token with only `extensions:outbox:replay`, does not forward the inbound bearer token or approval metadata, and sends a bodyless POST with request ID, trace context and idempotency key. Same-key retries are served by the Platform API idempotency boundary without a second downstream side effect. The Extensions database remains responsible for tenant-scoped replay state and append-only replay audit.

Exact-head checks passed on Platform commit `f4ba45893cf0261deff58629ba964a24e28e953d`: CI [42457552670](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457552670), CodeQL [42457552627](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457552627), Secret Scan [42457552644](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457552644), Reference Agents [42457552676](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457552676), and R10 Certification [42457552736](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457552736). Post-merge checks passed on `a2cd923b7d187de2f0b983a169ea0f03ff96aa94`: CI [42457671532](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671532), CodeQL [42457671552](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671552), Secret Scan [42457671510](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671510), Reference Agents [42457671509](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671509), R10 Certification [42457671536](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671536), and Supply Chain Attestation [42457671530](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671530).

This advances A6 from an unimplemented integration contract to merged, tested Platform-side feasibility evidence. It does not prove a live production deployment, durable production approval provider, production identity-provider onboarding, real KMS/key rotation, or production endpoint configuration. The approval verifier must be backed by the production tenant-aware approval service before enabling this action. This does not close A6 or Phase 02. A3 remains partial; A2 Safari runtime/distribution and A4–A7 remain open as previously qualified. External provider delivery remains at-least-once, not exactly-once.
