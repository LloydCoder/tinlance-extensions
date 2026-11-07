# Tinlance Extensions — Current Execution Audit

**Audit date:** 2026-11-07
**Audited branch:** `main`
**Audited commit after PR #52:** `301c54b4422e452d87384d612a1f901f2c8c7da2`
**Scope:** Repository tree, consolidated phase plan, Phase 02 evidence ledger, accepted architecture records, PRs #30–#52 and exact-head/post-merge GitHub Actions runs.
**Disposition:** **Programme remains gated. No product implementation phase is authorized by the current evidence.**

## 1. Executive finding

The repository has a substantial governance and architecture baseline, plus isolated A1–A2 and A3 feasibility spikes. PR #30 adds Chromium MV3 popup/runtime and service-worker restart proof plus Safari Xcode packaging; PR #32 adds real Chromium keyboard-shortcut `activeTab`/`scripting` runtime evidence; PR #34 adds equivalent Firefox MV3 keyboard-shortcut runtime evidence using a loopback fixture. PR #36 compiles and inspects the generated Safari macOS app and embedded Web Extension package. PR #38 adds independent headed runtime checks for Microsoft Edge Stable, Brave Stable and Opera Stable using their installed executables and a loopback fixture. PR #40 adds a two-session PostgreSQL runtime-role concurrency test proving distinct job claims under overlapping row locks with `FOR UPDATE SKIP LOCKED`. PR #42 adds tenant-bound outbox claim/acknowledgement functions with lease expiry/reclaim, fresh fencing tokens, stale-token rejection and cross-tenant publish rejection. PR #44 adds a PostgreSQL-backed HTTP repository adapter, transaction-local restricted-role/tenant context, parameterized reads, cross-tenant 404 behavior, pooled-session reset verification and rollback-failure connection disposal. The repository is not yet an implemented browser-extension platform, production backend, MCP service, customer portal, or 26-product suite.

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
