# Tinlance Extensions — Current Execution Audit

**Audit date:** 2026-11-07
**Audited branch:** `main`
**Audited commit after PR #32:** `f671facca4ea87b25265344e3df00cc73d8ede92`
**Scope:** Repository tree, consolidated phase plan, Phase 02 evidence ledger, accepted architecture records, PRs #30–#32 and exact-head GitHub Actions runs.
**Disposition:** **Programme remains gated. No product implementation phase is authorized by the current evidence.**

## 1. Executive finding

The repository has a substantial governance and architecture baseline, plus isolated A1–A2 and A3 feasibility spikes. PR #30 adds Chromium MV3 popup/runtime and service-worker restart proof plus Safari Xcode packaging; PR #32 adds a real Chromium keyboard-shortcut `activeTab`/`scripting` runtime test using a loopback fixture. The repository is not yet an implemented browser-extension platform, production backend, MCP service, customer portal, or 26-product suite.

PR #30 merged as `f6e34c242dfc7819a44e0940accb1544d1363148`. PR #32 merged as `f671facca4ea87b25265344e3df00cc73d8ede92` from head `0fef63a72b4418d953f529c9a01010da485fdbe0`; its exact-head Repository Quality [run 42368720120](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42368720120) and A1–A2 [run 42368720112](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42368720112) both passed. The A1–A2 job invoked the extension's registered keyboard shortcut with X11 against a loopback page and verified the injected script returned its title and origin. These are repository/spike checks only; they do not demonstrate production readiness.

## 2. Verified repository state

- Default branch: `main`; repository is not archived.
- Audited commit: `f671facca4ea87b25265344e3df00cc73d8ede92`.
- Relevant merged changes include PR #23 (SVG brand assets), PR #24 (original PNG branding exports and popup application), PR #25 (isolated A3 backend/API contract spike), PR #28 (tenant-bound PostgreSQL worker lease/recovery and stale-worker fencing), PR #30 (Chromium MV3 popup/runtime and service-worker restart proof plus Safari Xcode packaging/project validation), and PR #32 (Chromium keyboard-shortcut activeTab/scripting runtime proof). PR #27's tenant isolation/idempotency/outbox evidence remains part of the baseline.
- PR #32 exact-head Repository Quality [run 42368720120](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42368720120) and A1–A2 [run 42368720112](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42368720112) both passed. The available workflow-run connector does not expose push-triggered runs for the PR #32 merge commit; no post-merge push-run claim is made.
- PR #28 exact-head checks: [Repository Quality](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42020490026), [A3 API contract](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42020490127), and [PostgreSQL tenant/outbox/worker recovery](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42020489917) — all `success`.
- The repository tree contains governance documents and isolated `spikes/architecture-feasibility/a1-a2` and `a3-backend-api` projects. It does not contain the planned production `apps/api`, `apps/worker`, `apps/web`, product extension applications, MCP gateway, or production shared packages.
- The live branch API reports `main.protected: false`; the repository rulesets endpoint returns an empty list. Required branch protection/ruleset enforcement is absent. The connected GitHub integration cannot mutate repository administration settings, so this remains a repository-owner configuration blocker.

## 3. Phase and gate status

| Area | Verified status | Evidence still required |
|---|---|---|
| Phase 0 — repository foundation | Closed for documented repository scope | Does not imply application readiness |
| Phase 1 — forensic baseline | Closed for documented audit scope | Refresh baseline after material repository changes |
| Phase 2 — product requirements and validation | Documentary baseline complete; **open** | Real customer discovery, product-owner sign-offs, product-specific threat models, legal/provider reviews and commercial proof |
| Phase 3 — architecture and feasibility | ADRs accepted; **feasibility partial** | A2 Firefox runtime and Safari runtime/signing; A3 production API/database wiring and operational recovery; A4 product data/security; A5 executable MCP conformance; A6 actual Agent Platform contract; A7 deployment/residency/budget approval |
| Phases 4–10 | Not started as production implementation | Phase 2 and Phase 3 exit gates must pass |
| Phases 11–19 | Not started as product implementation | Shared platform and product-specific gates |
| Phases 20–25 | Not started as production release work | Verified implementation, independent assurance, operational and release evidence |

The detailed A1–A7 status is maintained in [PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md](PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md). Do not silently upgrade a partial or research-supported item to passed.

## 4. Critical blockers and safe resolution path

### B1 — Phase 2 requires evidence only the business owner and prospective buyers can supply

The repository can prepare interview scripts, decision records, questionnaires and evidence templates. It cannot fabricate customer interviews, purchase intent, product-owner approval, legal advice or provider permission. Phase 2 remains open until genuine records are supplied and reviewed.

### B2 — A2 is not a cross-browser runtime certification

PR #30 proves the read-only Chromium MV3 popup/runtime, service-worker termination and event-driven restart, and Safari Xcode project packaging/validation. PR #32 proves a user-invoked custom keyboard shortcut grants temporary `activeTab` access in Chromium and that `scripting.executeScript` returns metadata from a loopback fixture with only `activeTab` and `scripting` permissions. Firefox runtime behavior, Safari runtime/signing/notarization, store review and the complete Edge/Brave/Opera version matrix remain open.

### B3 — A3 is a contract fixture, not a production backend

PR #28 adds PostgreSQL 16 executable evidence for tenant-bound worker claims, lease expiry/reclaim, fresh fencing tokens, stale-worker rejection and bounded terminal retry. The spike still has no production PostgreSQL adapter/API wiring, multi-process contention proof, process crash/restart test, outbox publisher delivery, cancellation checkpoints, tenant concurrency/budget enforcement, backup/restore or operational SLOs. A3 remains partial.

The bearer verifier and repository are injected test fixtures; the default verifier denies access. The spike does not provide OIDC, PostgreSQL, migrations, row-level security, object storage, queue/outbox, durable workers, retry/idempotency semantics, or crash recovery. Production authentication or persistence must not be inferred from it.

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
2. Complete remaining A2 permission-sensitive action and Firefox runtime tests, then close Safari runtime/signing and browser-version evidence.
3. Close A3 using real PostgreSQL/RLS and durable worker integration tests in CI.
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
