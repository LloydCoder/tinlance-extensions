# Tinlance Extensions — Current Execution Audit

**Audit date:** 2026-11-08
**Audited branch:** `main`
**Audited commit after PR #65:** `9715a0c0541b9244124e11228057d60bf7c9e2fa`
**Scope:** Repository tree, consolidated phase plan, Phase 02 evidence ledger, accepted architecture records, PRs #30–#65 and exact-head/post-merge GitHub Actions runs.
**Disposition:** **Programme remains gated. No product implementation phase is authorized by the current evidence.**

## 1. Executive finding

The repository has a substantial governance and architecture baseline, plus isolated A1–A2 and A3 feasibility spikes. PR #30 adds Chromium MV3 popup/runtime and service-worker restart proof plus Safari Xcode packaging; PR #32 adds real Chromium keyboard-shortcut `activeTab`/`scripting` runtime evidence; PR #34 adds equivalent Firefox MV3 keyboard-shortcut runtime evidence using a loopback fixture. PR #36 compiles and inspects the generated Safari macOS app and embedded Web Extension package. PR #38 adds independent headed runtime checks for Microsoft Edge Stable, Brave Stable and Opera Stable using their installed executables and a loopback fixture. PR #40 adds a two-session PostgreSQL runtime-role concurrency test proving distinct job claims under overlapping row locks with `FOR UPDATE SKIP LOCKED`. PR #42 adds tenant-bound outbox claim/acknowledgement functions with lease expiry/reclaim, fresh fencing tokens, stale-token rejection and cross-tenant publish rejection. PR #44 adds a PostgreSQL-backed HTTP repository adapter, transaction-local restricted-role/tenant context, parameterized reads, cross-tenant 404 behavior, pooled-session reset verification and rollback-failure connection disposal. PRs #46–#61 add process-level worker crash recovery and heartbeat, outbox delivery/retry/dead-letter recovery, cancellation, RS256 OIDC/JWKS verification, least-privilege login, API composition, audited cancellation and replay, durable consumer inbox idempotency, and backup/restore evidence. PR #63 adds the receiving side of Agent Platform delegated action-token verification for cancellation and replay. PR #65 fixes the OIDC integer environment parser and adds decimal-value regression coverage. The repository is not yet an implemented browser-extension platform, production backend, MCP service, customer portal, or 26-product suite.

PR #30 merged as `f6e34c242dfc7819a44e0940accb1544d1363148`. PR #32 merged as `f671facca4ea87b25265344e3df00cc73d8ede92` from head `0fef63a72b4418d953f529c9a01010da485fdbe0`; its exact-head Repository Quality and A1–A2 checks passed. PR #34 merged as `3a5fffdd919c86d354614cc077532d88a9f2db3f` from head `a9f7f15d3c711d539b51ba333570e8510cf046db`; exact-head Repository Quality [run 42369746350](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42369746350) and A1–A2 [run 42369746359](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42369746359) both passed. PR #36 merged as `786b10e19984c3669abb548954f50ee4ef88585f` after Safari Xcode app/extension compilation and manifest/bundle inspection. PR #38 merged as `807ac4ff73868422ab40d1db5dadff5dfc815002`; exact-head Repository Quality [run 42373753116](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753116) and A1–A2 [run 42373753119](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753119) passed, including Edge, Brave and Opera runtime jobs. The A1–A2 run exercised the registered Firefox MV3 keyboard shortcut with X11 against a loopback page and verified that the extension's `scripting.executeScript` result reached its popup. These are isolated feasibility checks, not production-readiness evidence.

## 2. Verified repository state

- Default branch: `main`; repository is not archived.
- Audited commit: `0706c8d82f3d6a3130e141f8c567b356906ce629` (PR #44 merge).
- Relevant merged changes include PR #23 (SVG brand assets), PR #24 (original PNG branding exports and popup application), PR #25 (isolated A3 backend/API contract spike), PR #28 (tenant-bound PostgreSQL worker lease/recovery and stale-worker fencing), PR #30 (Chromium MV3 popup/runtime and service-worker restart proof plus Safari Xcode packaging/project validation), PR #32 (Chromium keyboard-shortcut activeTab/scripting runtime proof), and PR #34 (Firefox MV3 keyboard-shortcut activeTab/scripting runtime proof), PR #36 (Safari Xcode compile and bundle inspection), PR #38 (Edge/Brave/Opera headed MV3 permission runtime), PR #40 (two-session PostgreSQL worker-claim contention), PR #42 (tenant-bound outbox publisher lease/acknowledgement), and PR #44 (HTTP-to-PostgreSQL adapter with real PostgreSQL integration). PR #27's tenant isolation/idempotency/outbox evidence remains part of the baseline.
- PR #34 exact-head Repository Quality [run 42369746350](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42369746350) and A1–A2 [run 42369746359](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42369746359) both passed. The A1–A2 workflow included the Chromium and Firefox runtime cases and the macOS Safari Xcode packaging lane. The post-merge `main` A1–A2 workflow [run 42369898982](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42369898982) also completed successfully on merge commit `3a5fffdd919c86d354614cc077532d88a9f2db3f`; post-merge Repository Quality [run 42369898958](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42369898958) passed.
- PR #28 exact-head checks: [Repository Quality](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42020490026), [A3 API contract](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42020490127), and [PostgreSQL tenant/outbox/worker recovery](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42020489917) — all `success`.
- The repository tree contains governance documents and isolated `spikes/architecture-feasibility/a1-a2` and `a3-backend-api` projects. It does not contain the planned production `apps/api`, `apps/worker`, `apps/web`, product extension applications, MCP gateway, or production shared packages.
- The live branch API reports `main.protected: false`; the repository rulesets endpoint returns an empty list. Required branch protection/ruleset enforcement is absent. The connected GitHub integration cannot mutate repository administration settings, so this remains a repository-owner configuration blocker.

## 3. Phase and gate status

| Area | Verified status | Evidence still required |
|---|---|---|
| Phase 0 — repository foundation | Closed for documented repository scope | Does not imply application readiness |
| Phase 1 — forensic baseline | Closed for documented audit scope | Refresh baseline after material repository changes |
| Phase 2 — product requirements and validation | Documentary baseline complete; **open** | Real customer discovery, product-owner sign-offs, product-specific threat models, legal/provider reviews and commercial proof |
| Phase 3 — architecture and feasibility | ADRs accepted; **feasibility partial** | A2 Safari runtime enablement, signing/notarization and store review; A3 production identity/credential model, multi-process worker lifecycle, outbox delivery/idempotency, cancellation and operational recovery; A4 product data/security; A5 executable MCP conformance; A6 actual Agent Platform contract; A7 deployment/residency/budget approval |
| Phases 4–10 | Not started as production implementation | Phase 2 and Phase 3 exit gates must pass |
| Phases 11–19 | Not started as product implementation | Shared platform and product-specific gates |
| Phases 20–25 | Not started as production release work | Verified implementation, independent assurance, operational and release evidence |

The detailed A1–A7 status is maintained in [PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md](PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md). Do not silently upgrade a partial or research-supported item to passed.

## 4. Critical blockers and safe resolution path

### B1 — Phase 2 requires evidence only the business owner and prospective buyers can supply

The repository can prepare interview scripts, decision records, questionnaires and evidence templates. It cannot fabricate customer interviews, purchase intent, product-owner approval, legal advice or provider permission. Phase 2 remains open until genuine records are supplied and reviewed.

### B2 — A2 remains partial despite expanded cross-browser runtime evidence

PR #30 proves the read-only Chromium MV3 popup/runtime, service-worker termination and event-driven restart, and Safari Xcode project packaging/validation. PR #32 proves a user-invoked custom keyboard shortcut grants temporary `activeTab` access in Chromium. PR #34 proves the Firefox MV3 keyboard-shortcut path with a real X11 action and a loopback fixture; `scripting.executeScript` returns the expected page title and origin to the extension popup while the manifest remains limited to `activeTab` and `scripting`. PR #38 now exercises Edge Stable, Brave Stable and Opera Stable in independent headed Playwright jobs with the installed browser executables, exact `activeTab` + `scripting` permissions, a loopback fixture and a real keyboard shortcut. All three jobs passed on the exact PR head. PR #36 compiles and inspects the Safari macOS app and `.appex` bundle and validates the effective Safari manifest. Safari runtime enablement/execution, Developer ID signing, notarization, App Store Connect submission/review and version-specific distribution validation remain open; this is not full Safari certification.

### B3 — A3 is a contract fixture, not a production backend

PR #28 adds PostgreSQL 16 executable evidence for tenant-bound worker claims, lease expiry/reclaim, fresh fencing tokens, stale-worker rejection and bounded terminal retry. PR #44 now wires the isolated HTTP record route to a real PostgreSQL adapter using a transaction-local restricted role and tenant context; PostgreSQL 16 integration drives the HTTP API, verifies cross-tenant 404 behavior, and proves pooled-session context reset. A3 remains partial: the injected bearer verifier is not production OIDC/JWKS, the CI database connection is a superuser that switches to the non-login runtime role, and the spike still lacks production credential provisioning, application worker process lifecycle/crash recovery, external outbox delivery and consumer idempotency, cancellation, backup/restore and operational SLOs.

The bearer verifier remains an injected test fixture and defaults to deny-all; the spike does not provide production OIDC/JWKS validation or token lifecycle. The spike now includes PostgreSQL migrations, forced RLS, tenant-scoped idempotency/outbox and database worker-lease functions, plus the PR #44 HTTP-to-PostgreSQL adapter integration. It still lacks production database credential provisioning, object storage, an application worker or publisher process, external outbox delivery, consumer idempotency, process crash/restart recovery and cancellation. Production authentication, deployment or operational readiness must not be inferred from these feasibility fixtures.

### B4 — A4 needs product-specific data and security evidence

Create per-product data-flow diagrams, D0–D3 data inventory, threat models, permission justifications, retention/deletion controls, telemetry redaction tests and processor reviews. The generic architecture is not a substitute.

### B5 — A5 needs executable MCP conformance

Protocol research is not a server. Pin an official SDK release and protocol fixtures; implement request validation, required headers, OAuth resource/audience checks, tenant isolation, tool contracts, negative tests, and real-client interoperability before calling the MCP gate passed.

### B6 — A6 depends on the real Tinlance Agent Platform contract

Do not invent a substitute authorization or approval authority. Obtain the typed contract, schemas/SDK, error semantics and conformance fixtures from the Agent Platform owner. Until then, keep consequential execution unavailable.

### B7 — A7 requires explicit deployment and spend approval

Provider, region/residency, cost ceiling, backup/restore, incident response and rollback must be approved before provisioning. No paid infrastructure is authorized by this audit.

### B8 — Governance enforcement is incomplete

The live branch API confirmed `main.protected: false` on 2026-11-07, and the repository rulesets endpoint returned no rulesets. Configure a repository ruleset requiring pull requests and the Repository Quality and A1–A2 checks, prohibit force-push/deletion, and define an appropriate bypass policy. The connected GitHub integration is GET-only for repository administration and cannot apply this change; the repository owner must configure it in GitHub Settings. Re-check the branch API and rulesets after configuration; green CI alone does not enforce merge policy.

## 5. Required execution order

1. Complete genuine Phase 2 customer, owner, legal/provider and product-risk evidence.
2. Complete remaining A2 Safari runtime enablement/execution, signing/notarization and store review; Chromium, Firefox, Edge, Brave and Opera user-invoked `activeTab`/`scripting` runtime checks are now merged.
3. Continue A3 beyond PR #44's real PostgreSQL-backed HTTP adapter proof: implement the production identity/credential boundary, application worker lifecycle/crash recovery, external outbox delivery/idempotency, cancellation and operational recovery tests.
4. Close A4 product data/security review and tests.
5. Close A5 with pinned MCP SDK, conformance fixtures, OAuth and client interoperability.
6. Close A6 against the actual Agent Platform contract.
7. Close A7 with written deployment, residency, recovery and budget approval.
8. Reconcile and approve Phase 2/3 closeout; only then start Phase 4 production workspace implementation.
9. Continue phases 4–25 serially, with phase-specific acceptance evidence, forensic audit, green required CI and reviewed merge before advancing.

## 6. External standards checked for this audit

These sources are design inputs, not evidence that the repository implements the requirements:

- [MCP 2026-07-28 Streamable HTTP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/draft/basic/transports/streamable-http.mdx): stateless POST request model, protocol version metadata, and required `Mcp-Method` / `Mcp-Name` headers.
- [MCP 2026-07-28 specification announcement](https://blog.modelcontextprotocol.io/posts/2026-07-28/): release-level context for stateless transport, authorization hardening and Tasks as an extension.
- [MDN — Chrome incompatibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities): browser API and manifest differences remain material; compatibility must be tested, not assumed.
- [MDN — Browser extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions): WebExtensions cross-browser model and references.
- [Microsoft Edge — Manifest V3 migration timeline](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/manifest-v3): Edge's published MV2 deprecation transition reinforces use of MV3 for new work.

## 7. Acceptance rule

A phase is complete only when all of the following are true:

- Deliverables exist in the production repository paths and are not merely described in a plan or isolated spike.
- Tests exercise the actual implementation and relevant negative/security cases.
- Required CI is green on the exact proposed merge commit.
- Security, privacy, accessibility, browser compatibility, operational and legal evidence is attached where relevant.
- A forensic review finds no unresolved release-blocking gap.
- The phase status and evidence links are updated in the authoritative roadmap.
- The change is merged through the repository's enforced review policy.

**No phase is marked complete solely because documentation was written, a spike builds, or a generic repository workflow is green.**


## 8. Post-PR #38 main verification

At the PR #38 historical checkpoint, main was `807ac4ff73868422ab40d1db5dadff5dfc815002`. Post-merge Repository Quality [run 42373989212](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373989212), Architecture Feasibility A1–A2 [run 42373989175](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373989175), and Propose A1–A2 lockfile [run 42374180891](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374180891) all completed successfully. PR #38's exact-head A1–A2 run [42373753119](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753119) passed clean install/build/permission tests, Safari Xcode packaging, Edge Stable, Brave Stable and Opera Stable. These results close those specific runtime/package checks only; they do not close A2 Safari runtime/distribution or any production gate.


## 9. Post-PR #40 A3 verification

PR #40 (`3496b8489561250e3f473f11ca8146ca12d29d97`) adds a PostgreSQL 16 concurrency test with two independent sessions running as `tinlance_app_runtime`. Both transactions remain open after claiming; the assertions require distinct job IDs and no remaining claimable job. Exact-head Repository Quality [42374813474](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813474), A3 API contract [42374813448](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813448), and PostgreSQL integration [42374813492](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813492) passed. The same three post-merge main workflows passed on `3496b8489561250e3f473f11ca8146ca12d29d97`: Repository Quality [42374868455](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868455), A3 API [42374868482](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868482), and PostgreSQL [42374868429](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868429). This closes the specific database-level concurrent-claim evidence gap only; it does not prove a deployed multi-process worker service or production API deployment. PR #44 separately adds isolated HTTP-to-PostgreSQL adapter evidence, not a production service.


## 10. Post-PR #42 A3 outbox verification

PR #42 merged as `39c17f75aa9c533d5752fb6df97d589bad2c5d18`. It adds migration `003_outbox_publisher.sql` with tenant-bound `claim_outbox_events` and `mark_outbox_published` functions, bounded lease/batch inputs, `FOR UPDATE SKIP LOCKED`, lease expiry/reclaim, fencing tokens and tenant checks. PostgreSQL integration tests verify fail-closed tenant context, expiry/reclaim, stale-token rejection, valid acknowledgement and cross-tenant rejection. Exact-head Repository Quality [42375210266](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210266), A3 API [42375210272](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210272), and PostgreSQL [42375210240](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210240) passed. Post-merge main Repository Quality [42375274540](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274540), A3 API [42375274532](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274532), and PostgreSQL [42375274541](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274541) also passed. This proves the database-side outbox claim/acknowledgement contract only; an external delivery adapter/loop, consumer idempotency, dead-letter operations and running publisher process remain open.


## 11. Post-PR #44 PostgreSQL-backed HTTP adapter verification

PR #44 merged as `0706c8d82f3d6a3130e141f8c567b356906ce629`. It adds `postgres-repository.mjs`, which implements the existing A3 tenant repository contract using a pooled PostgreSQL client. Every tenant read runs in a transaction, switches locally to `tinlance_app_runtime`, sets the verified tenant context transaction-locally, and uses a parameterized record lookup. The HTTP integration test runs against PostgreSQL 16 and verifies the authenticated tenant can read its own record, another tenant's record returns the same 404 shape as a missing record, and the pooled session returns to its prior role with no active tenant context. A unit test also proves rollback failure marks the client for disposal rather than returning a potentially poisoned connection to the pool.

Exact-head Repository Quality [42376883210](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883210), A3 API [42376883208](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883208), and PostgreSQL integration [42376883253](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883253) passed. Post-merge main Repository Quality [42376948442](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948442), A3 API [42376948519](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948519), and PostgreSQL integration [42376948399](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948399) passed on `0706c8d82f3d6a3130e141f8c567b356906ce629`. This closes the isolated HTTP-to-PostgreSQL adapter feasibility gap only; A3 remains partial and this does not authorize production implementation.


## 13. Current main checkpoint — PRs #46–#52

**This section supersedes the PR #44 checkpoint and A3 blocker descriptions above where they conflict.**

Current main checkpoint: 301c54b4422e452d87384d612a1f901f2c8c7da2 after PR #52.

A3 feasibility now includes: PR #46 tenant-scoped Node worker runtime with PostgreSQL child-process crash/restart, concurrent-claim and lease-heartbeat tests; PR #47 outbox publisher runtime with bounded retry/dead-letter, heartbeat and crash-after-delivery recovery against a deduplicating test receiver; PR #48 tenant-bound cancellation and worker AbortSignal handling; PR #49 strict RS256 OIDC/JWKS bearer verification; PR #50 dedicated non-superuser tinlance_app_login role used by API, worker and publisher integration tests; PR #51 fail-fast environment-driven OIDC API composition; and PR #52 tenant-scoped POST /v1/jobs/{jobId}/cancel wired through the PostgreSQL adapter.

PR #52 exact-head Repository Quality (42392078298), A3 API (42392078129) and PostgreSQL 16 (42392078261) passed on ab5238eff808dd0f45eb973479967f5a86053af8. Post-merge A3 API (42392194443) and PostgreSQL 16 (42392194429) passed on merge commit 301c54b4422e452d87384d612a1f901f2c8c7da2.

A3 remains partial and is not a production backend. Remaining gaps: approved provider-specific issuer/tenant-claim onboarding and token lifecycle; managed production secret/database credential provisioning and rotation plus TLS/connection management; real external provider transport adapters; durable receiver-side inbox/idempotency and operational dead-letter tooling; actual Tinlance Agent Platform authorization/approval integration (the cancellation callback defaults to deny-all); cancellation audit integration; migration rollback; backup/restore and recovery objectives; production deployment/supervision; observability, alerting and SLO evidence; retention/deletion; legal/privacy review and independent security review.

Phase 02 remains open for genuine customer interviews, product-owner sign-offs, commercial evidence and legal/provider review. A2 remains partial for Safari runtime enablement/execution, signing, notarization and store review. A4–A7 remain open. Phases 4–25 remain gated as production implementation. No production implementation authorization or paid infrastructure approval is inferred.


## 14. PostgreSQL backup/restore evidence — PR #54

This addendum supersedes the PR #52 checkpoint above where it conflicts.

Current main checkpoint: b738cb43dbaec3a65344e0a9376d8ed37703ac83 after PR #54.

PR #54 adds a PostgreSQL 16 custom-format logical backup/restore CI exercise. The verifier seeds a tenant-owned row, creates and inspects a pg_dump custom archive, restores it into a fresh template0 database, verifies restored tenant data, worker/outbox/cancellation functions and forced RLS on tenant tables, then connects through tinlance_app_login and confirms transaction-local tenant context still exposes only the tenant's row. The test cleans up the restored database and source fixture.

Exact-head checks passed on b4a082fb4b814e365a1681d264b9207bf21173ab: Repository Quality 42392579775, A3 API 42392579816 and PostgreSQL 16 42392579765. Post-merge checks passed on b738cb43dbaec3a65344e0a9376d8ed37703ac83: Repository Quality 42392712741, A3 API 42392712726 and PostgreSQL 16 42392712972.

This is single-database logical restore proof within the same ephemeral PostgreSQL cluster. pg_dump does not include cluster-global roles or tablespaces; the test roles already exist in the cluster. The test does not prove cross-region recovery, PITR, backup encryption/key management, retention, production RPO/RTO, managed backup operations or a production restore runbook.

A3 remains partial and is not a production backend. Remaining gaps include approved live identity-provider onboarding and tenant-claim mapping, token lifecycle, managed credential provisioning/rotation and TLS/connection management, provider-specific external delivery, durable consumer inbox/idempotency and dead-letter operations, Agent Platform authorization/approval integration, cancellation audit, migration rollback, production deployment/supervision, observability/SLOs, retention/deletion and legal/privacy/independent security review. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.


## 15. Durable consumer inbox evidence — PR #57

This addendum supersedes earlier A3 statements that the receiver-side idempotency ledger is wholly unimplemented.

Current main checkpoint: 94b43b7a0928d87417ccd651bb62062b6315ad1c after PR #57.

PR #57 adds migration 008, a durable tenant-scoped consumer inbox keyed by (tenant_id, consumer_name, event_id), forced RLS, bounded JSON payloads, and a security-definer acceptance function that derives tenant identity only from transaction-local app.tenant_id. First acceptance returns true; same-key/same-payload redelivery returns false; same-key/different-payload redelivery fails. Concurrent duplicate delivery, rollback, tenant/consumer isolation, missing tenant context, invalid consumer names, payload limits and pooled-session reset are exercised in PostgreSQL 16 integration tests.

The outbox process test receiver now writes the inbox receipt and its local database effect in the same transaction. Crash-after-delivery recovery proves that the publisher can retry after the receiver committed but before the publisher acknowledged, without repeating the local database effect. This is at-most-once local database effect under the shared-transaction condition, not exactly-once delivery across external systems. External provider side effects still require provider idempotency keys or explicit duplicate-side-effect acceptance.

PR #57 exact-head Repository Quality (42393553306), A3 API (42393553255) and PostgreSQL 16 (42393553292) passed on bc5c9110bbda3d469b0a1335b6f672fd214d92b6. Post-merge Repository Quality (42393663373), A3 API (42393663375) and PostgreSQL 16 (42393663463) passed on merge commit 94b43b7a0928d87417ccd651bb62062b6315ad1c.

A3 remains partial and is not a production backend. Remaining gaps include approved live identity-provider onboarding and tenant-claim mapping, token lifecycle, managed credential provisioning/rotation and TLS/connection management, provider-specific external delivery and idempotency, operational dead-letter tooling, Agent Platform authorization/approval integration and cancellation audit, migration rollback, production backup/restore operations and runbook, deployment/supervision, observability/SLOs, retention/deletion and legal/privacy/independent security review. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.


## 16. Audited dead-letter replay evidence — PR #59

This addendum supersedes earlier statements that no dead-letter replay API/database audit contract exists; it does not supersede the remaining production authorization and operator-workflow blockers.

Current main checkpoint: d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1 after PR #59.

PR #59 adds migration 009 with a tenant-scoped dead-letter replay counter and append-only outbox replay audit. The database function locks only a currently dead-lettered, unpublished event belonging to the transaction-local tenant, requeues it, resets attempts/lease/failure state, increments replay_count and records actor subject, request ID, prior attempts, prior error code and prior dead-letter timestamp atomically. The HTTP POST /v1/outbox/dead-letters/{eventId}/replay route is authenticated and its authorization callback defaults to deny-all; it is forwarded through the OIDC composition root. The API rejects request bodies on operational action routes and returns non-enumerating 404 responses for missing, cross-tenant or no-longer-dead-lettered events.

Exact-head checks passed on 30f0b56f1df319d84f71daae904020370b05fe4b: Repository Quality 42394553985, A3 API 42394553843 and PostgreSQL 16 42394553804. Post-merge checks passed on d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1: Repository Quality 42394665035, A3 API 42394665046 and PostgreSQL 16 42394665064.

The replay route and audit contract are not a production operator workflow: the real Tinlance Agent Platform authorization/approval contract is not integrated, the policy remains deny-all unless explicitly injected, and no operator UI is deployed. Provider-specific delivery, managed identity/secret lifecycle, production deployment, operational dead-letter supervision, SLOs, migration rollback, production backup/restore operations, retention/deletion and independent legal/privacy/security review remain open. Phase 02 customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.



## 17. Audited job-cancellation evidence — PR #61

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


## 11. PR #65 OIDC integer configuration regression and current checkpoint

**Current audited main:** `9715a0c0541b9244124e11228057d60bf7c9e2fa` (PR #65).

PR #65 fixed `integerEnvironmentValue` in `spikes/architecture-feasibility/a3-backend-api/api-composition.mjs`. The previous regular expression matched a literal backslash followed by `d`, rejecting valid decimal integer strings. The corrected expression accepts decimal digits and the added regression test exercises the OIDC and Platform OIDC cache TTL, token lifetime, clock tolerance, JWKS timeout and refresh interval settings.

Exact-head PR #65 checks passed:
- Repository Quality [42456413690](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413690).
- A3 API [42456413743](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413743).
- PostgreSQL tenant isolation/outbox/worker recovery [42456413585](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413585).

PR #65 merged as `9715a0c0541b9244124e11228057d60bf7c9e2fa`. Post-merge main checks also passed:
- Repository Quality [42456480565](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480565).
- A3 API [42456480483](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480483).
- PostgreSQL tenant isolation/outbox/worker recovery [42456480506](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480506).

The PostgreSQL workflow covered the full migration chain, restricted application login, real HTTP/database cancellation and replay paths, durable consumer inbox concurrency/idempotency, child-process worker and publisher recovery, retries/dead letters, lease heartbeat, and custom-format logical backup/restore with forced-RLS checks.

**Current limitations remain explicit:** the repository is still a feasibility implementation rather than a deployed production service. The Platform delegated-token receiver exists, but live production issuer/KMS/JWKS and service configuration, Platform-side approval-bound dead-letter replay registration, managed credential rotation, production deployment/supervision, operator tooling, production backup/PITR and restore operations, SLOs/observability, and independent legal/privacy/security reviews remain open. Phase 02 customer discovery, product-owner approvals, legal/provider rights and commercial proof remain open; A2 Safari runtime/distribution remains partial; A4–A7 remain open. No production implementation authorization or infrastructure spend is inferred.

At this checkpoint the live GitHub API reports no open pull requests and no open issues. This is a repository queue observation, not programme completion. The next permitted work is further isolated feasibility/evidence work that does not bypass Phase 02/03 exit gates or the Agent Platform authority boundary.
