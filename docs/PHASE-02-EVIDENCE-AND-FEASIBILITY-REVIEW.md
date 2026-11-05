# Phase 02 Evidence and Architecture Feasibility Milestone Review

**Review date:** 2026-11-05
**Repository baseline:** `main` at `74318596f066e8d8728e0fb3f32d2d62c8d2b089` (PR #17 merge)
**Review branch:** `phase-02-evidence-feasibility-review`
**Decision owner:** Tinlance Limited
**Disposition:** Evidence inventory and standards research completed; Phase 02 remains open; A1–A7 are not passed. This document is a feasibility and evidence review, not implementation authorization.

## 1. Executive result

This milestone reconciles the accepted architecture decisions against the actual repository, checks the current public technical standards that materially affect the design, and records exactly which evidence exists and which does not.

**The architecture baseline is accepted. The architecture is not yet proven feasible by executable spikes. Phase 02 is not closed. No application implementation or paid infrastructure work is authorized by this review.**

Repository inspection at the baseline commit shows a governance/documentation repository: policy and architecture documents, one Python repository validator, one Python test module and a read-only GitHub Actions quality workflow. It contains no `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, Next.js application, WXT extension package, API, worker, database migration, MCP server, Agent Platform contract package or deployment configuration. The existing green repository workflow therefore cannot prove A1–A6.

The repository has no open pull requests at the time of this review. PR #17 is merged; its twelve ADRs are accepted. The README, master architecture, final phase plan and closeout report had not all been reconciled to that accepted state; this milestone corrects those status contradictions and links this report.

## 2. Evidence rules

Use the following labels throughout this report:

- **Verified:** directly observed in the repository or a cited authoritative technical source.
- **Research-supported:** public documentation supports feasibility or a design constraint, but no Tinlance implementation has been exercised.
- **Partial:** a baseline or design exists, but required review/test evidence is missing.
- **Blocked:** required external contract, participant, decision, executable artifact or approval is unavailable.
- **Not applicable yet:** a gate depends on an earlier gate or a later implementation stage.

A green documentation workflow, accepted ADR, vendor marketing page, interview target, architecture diagram or proposed cost is not a substitute for runtime evidence.

## 3. Phase 02 exit-gate ledger

| Phase 02 requirement | Result | Evidence currently available | What is still required |
|---|---|---|---|
| Canonical catalogue and scope | **Verified — documentary** | 26 product IDs across six families; first-seven order preserved; four proposal dispositions recorded | No catalogue change; keep change control |
| Product briefs | **Partial** | All 26 product briefs exist and headings reconcile to the catalogue | Dated owner/reviewer disposition for each brief; resolve changes and non-goals |
| Product/workstream ownership | **Blocked** | Tinlance Limited is named programme owner | Assign accountable product and specialist reviewers; record RACI and acceptance |
| Testable acceptance criteria | **Partial** | Brief-level acceptance statements and dependencies exist | Convert each priority MVP criterion into observable test cases, thresholds, fixtures and named test owner |
| Customer discovery | **Blocked** | Discovery playbook, segments, interview guide and evidence rubric exist | Real interviews with consent and anonymized evidence; record negative evidence, current alternatives, buyer and purchase process |
| Commercial proof | **Blocked** | Pricing and prioritization hypotheses are documented | Design-partner commitments, willingness-to-pay evidence and scoped paid-pilot/purchase evidence |
| Permissions and data classification | **Partial** | D0–D3 baseline and product permission assumptions are documented | Per-product data-flow maps, exact permissions, purposes, lawful basis where applicable, retention/deletion and reviewer sign-off |
| Product-specific threat models | **Blocked** | Common threat categories and security controls are described in architecture/ADRs | Reviewed threat models for first-seven products and all D2/D3, external-provider and consequential-action paths |
| Legal/provider/ToS review | **Blocked** | Known risk areas are identified in the requirements and proposal records | Written scoped review for contact data, AI-site DOM paths, downloads, monitoring, SERP/commerce sources, external processors, provider terms and target jurisdictions |
| Ranked portfolio decision | **Partial** | Initial seven sequence and four portfolio directions are preserved | Re-rank only using observed pain, buyer access, lawful data supply, technical feasibility, cost-to-serve and commitment strength; owner sign-off |
| Phase 02 go/no-go | **Blocked** | Closeout criteria are documented | Evidence links, named reviewers, residual-risk acceptance and explicit owner go/no-go |

**No customer interviews, design-partner commitments, paid pilots, legal opinions, provider approvals or product-specific threat-model approvals are claimed in this milestone.** They require actual participants, counterparties and accountable human review.

### Phase 02 evidence packet requirements

For each interview, record a participant code (not identity), segment, role, consent, recent workflow, frequency, impact, current workaround/spend, buyer/budget path, disconfirming evidence, constraints, evidence strength and next action. Do not store customer secrets, raw private prompts, unnecessary personal data or confidential source records in the repository.

For each product approval, record product ID, version of brief, owner, reviewer, decision (accept/change/reject), permission/data review, acceptance-test owner, date, unresolved exceptions and evidence link. Silence is not approval.

## 4. Architecture feasibility gate results

| Gate | Required proof | Result | Finding / blocker |
|---|---|---|---|
| A0 — Owner acceptance | Owner decision for ADRs 0003–0014 | **Pass — documentary** | Explicit approval recorded in all twelve ADRs and merged by PR #17 |
| A1 — Toolchain spike | Fresh checkout, pinned Node/pnpm, lockfile install, lint/typecheck/test/build, independent extension package build | **Blocked — not executed** | No Node workspace/package manifests, lockfile, Turbo config or extension packages exist in the repository |
| A2 — Browser spike | WXT builds and permission review for Chromium and Firefox; Safari packaging proof | **Research-supported; executable proof blocked** | WXT documents Chrome/Firefox/Edge packaging; Safari requires a separate Xcode/native wrapper path and is not automatically published by WXT. No Tinlance extension package exists to build or test |
| A3 — Backend/API spike | OpenAPI/API schema, auth middleware, tenant isolation, migration and worker recovery proof | **Blocked — not executed** | No API, schemas, auth middleware, database migrations, queue/worker or integration tests exist |
| A4 — Data/security review | Data-flow diagrams, D0–D3 inventory, product threat models, retention/deletion and audit/secret boundaries | **Partial** | Classification and generic controls exist; product-level flows, reviewed threat models, deletion tests, telemetry redaction tests and processor reviews do not |
| A5 — MCP Gate 0 | Exact protocol fixtures, required headers, auth, tool contracts, negative tests and client matrix | **Research-supported; executable proof blocked** | 2026-07-28 protocol details were checked against current MCP materials; no pinned SDK, fixture suite, server, OAuth integration, tool schemas or real-client matrix exists |
| A6 — Agent Platform contract | Typed authorization/approval/audit contract and negative no-bypass tests | **Blocked — external contract absent** | No Agent Platform schema/SDK/API contract or test fixture is present in this repository; approval authority cannot be simulated or reimplemented here |
| A7 — Cost/deployment approval | Provider, region/residency, cost ceiling, backup/restore and rollback plan | **Blocked — decision not made** | ADRs deliberately defer vendor selection; no deployment/provider/budget approval exists. No paid resource is authorized |

**A1–A7 are not passed.** Research-supported findings in A2 and A5 reduce uncertainty but do not satisfy their executable acceptance criteria.

## 5. Current technical findings and required design constraints

### 5.1 Toolchain and frontend

The accepted ADR baseline is TypeScript, pnpm workspaces and Turborepo; Next.js App Router is the web application choice. These remain approved choices subject to a fresh-checkout spike. No version pins should be invented in this report. A1 must pin compatible Node.js, pnpm, Next.js, WXT, TypeScript and task-runner versions in a lockfile and prove the full graph from a clean checkout.

For Next.js self-hosting, current official guidance recommends a reverse proxy in front of the Node.js server to handle malformed/slow requests, payload limits and rate limiting. Streaming also requires the complete proxy/load-balancer path to preserve streaming and avoid buffering. This is an architecture constraint, not a hosting decision.

### 5.2 Browser framework and security

WXT's current publishing guide lists Chrome, Firefox and Edge workflows. It explicitly states Safari publishing is not automated; Safari requires a macOS/iOS native app wrapper and Xcode packaging. Safari must therefore remain a separately tested and signed lane. Brave and Opera must be separately verified rather than inferred from Chromium lineage.

Chrome Manifest V3 guidance requires packaged executable code rather than remotely hosted executable JavaScript, and its extension service workers are event-driven/lifecycle-bounded. State must be persisted; listeners registered synchronously; timers and DOM-dependent work must use supported extension mechanisms. A future spike must include service-worker restart/recovery, permission minimization and package inspection.

### 5.3 MCP protocol baseline correction

The accepted target remains MCP specification **2026-07-28**, stateless Streamable HTTP. The current protocol release notes describe:
- no legacy `initialize`/`initialized` handshake or protocol-level `Mcp-Session-Id` in the stateless 2026-07-28 core;
- per-request POST handling;
- `Mcp-Method` and `Mcp-Name` request headers that mirror the JSON-RPC body and must be validated for mismatch;
- request metadata and capability discovery semantics for the selected revision;
- long-running Tasks as an optional protocol extension, not the durable application job system.

Implementation must pin the exact specification and SDK revision and test request/header/body mismatch, Origin/host and DNS-rebinding protections, auth/resource binding, tenant isolation, tool-list cache scope, size/time/concurrency limits, retries and unsupported optional capabilities. Do not mix older session-oriented Streamable HTTP behavior into the 2026-07-28 target. Update the master architecture's older initialization/negotiation text before any MCP code is written.

### 5.4 Identity and authorization

The IETF OAuth 2.0 Security Best Current Practice (RFC 9700, January 2025) requires exact redirect URI matching (with its defined native-loopback exception), PKCE for public clients and discourages implicit access-token responses. A newer IETF Best Current Practice for browser-based applications, RFC 10017 (August 2026), further addresses browser-client threats and requires PKCE for public browser clients. The implementation design must evaluate a backend-for-frontend/session-cookie model for the web workspace and secure, short-lived, narrowly scoped extension tokens; never embed client secrets in extension bundles or trust client-supplied tenant/role/approval claims.

These standards do not select an identity vendor. Provider selection remains blocked on residency, terms, enterprise requirements, portability and budget.

### 5.5 Data and storage

PostgreSQL and private object storage remain the accepted logical pattern, not a selected vendor or deployment. A4 must define tenant-bound authorization for both relational rows and object references, encryption/key ownership, checksum/integrity, retention/deletion propagation, export, backup/restore and migration rollback. PostgreSQL row-level security may be a defence-in-depth layer but must not replace application authorization or tests; policies must be designed so table owners, privileged roles and connection-pool context do not accidentally bypass tenant isolation.

### 5.6 Agent Platform boundary

EXT-17 and any consequential action remain blocked until the actual Agent Platform contract is supplied and reviewed. Required contract fields include authenticated principal/tenant, capability, origin/tab/frame scope, action class, target/parameters, expiry, correlation ID, idempotency key, policy decision, approval lifecycle, execution result and audit reference. The extension/MCP gateway may submit typed requests; it must never mint grants, decide approvals, access secrets or create a shadow authoritative audit.

## 6. Corrected programme status

| Workstream | Status after this review |
|---|---|
| Phase 0 — repository foundation | Closed for documented repository scope |
| Phase 01 — forensic baseline | Closed for documented repository scope |
| Phase 02 — product requirements and validation | Open; documentary baseline exists, substantive evidence gates remain |
| Phase 03 — architecture decisions 0003–0014 | Accepted and merged |
| A1 — toolchain | Blocked; no executable workspace |
| A2 — browser | Research-supported; no executable extension package |
| A3 — backend/API | Blocked; no backend artifacts |
| A4 — data/security | Partial; product-specific review and test evidence missing |
| A5 — MCP | Protocol research complete; implementation conformance evidence missing |
| A6 — Agent Platform | Blocked on external typed contract |
| A7 — deployment/cost | Blocked on explicit owner decision; no spend approved |
| Frontend/backend/extensions/MCP implementation | Not started |

## 7. Next execution sequence and owners

| Sequence | Action | Accountable owner | Required evidence |
|---:|---|---|---|
| 1 | Assign product owners/reviewers and sign off 26 briefs; prioritize the first seven | Tinlance programme owner | Dated approval matrix |
| 2 | Recruit and conduct first discovery wave; include negative findings | Tinlance programme owner / interview lead | Anonymized interview records and synthesis |
| 3 | Select two or three MVP opportunities using evidence, legal/data supply and cost-to-serve | Decision owner | Signed prioritization and go/no-go |
| 4 | Produce first-seven threat models and product data-flow maps; complete provider/legal reviews for selected MVPs | Security/privacy and legal reviewers | Reviewed threat models and written review records |
| 5 | Run A1 clean-checkout toolchain spike in a dedicated review PR | Engineering owner | Reproducible install/build/test logs and artifacts |
| 6 | Run A2 representative read-only and permission-sensitive WXT builds for Chromium/Firefox; document Safari packaging | Engineering owner | Build artifacts, permission matrix, lifecycle and compatibility tests |
| 7 | Run A3 API/tenant/migration/worker spike only after the identity and data contracts are reviewed | Backend owner | OpenAPI/schema, negative tenant tests, migration and worker recovery evidence |
| 8 | Close A4 with data maps, retention/deletion and security tests | Security/privacy owner | Threat-model approvals and automated/manual evidence |
| 9 | Close A5 with pinned MCP SDK/fixtures, auth and negative conformance tests | MCP owner | Protocol conformance report and client matrix |
| 10 | Obtain actual Agent Platform schema and execute A6 no-bypass contract tests | Agent Platform owner | Versioned contract and negative test results |
| 11 | Decide A7 provider, region, residency, budget ceiling and rollback only after requirements/cost model exist | Decision owner | Explicit written deployment/spend approval |

No owner is fabricated for specialist roles that have not been assigned. The programme owner is accountable for assigning them. Do not begin product implementation until Phase 02 and all applicable feasibility gates are accepted.

## 8. Source register

Authoritative/current technical references checked on 2026-11-05:

1. MCP 2026-07-28 release and protocol changes: https://blog.modelcontextprotocol.io/posts/2026-07-28/
2. MCP 2026-07-28 Streamable HTTP specification: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
3. MCP TypeScript SDK support/migration for 2026-07-28: https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28
4. WXT publishing guide (including Safari packaging limitation): https://wxt.dev/guide/essentials/publishing
5. Chrome Manifest V3 migration checklist: https://developer.chrome.com/docs/extensions/develop/migrate/checklist
6. Chrome extension service-worker lifecycle: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle/
7. Next.js self-hosting guide, last updated 2026-03-25: https://nextjs.org/docs/app/guides/self-hosting
8. IETF RFC 9700 — OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/rfc/rfc9700.html
9. IETF RFC 10017 — OAuth 2.0 for Browser-Based Applications (August 2026): https://www.rfc-editor.org/rfc/rfc10017.html

## 9. Approval and non-authorization

This report records research findings and repository evidence. It does not approve customer assumptions, legal interpretations, a provider, data residency, deployment spend, Agent Platform contracts, product implementation or public release. A gate may be changed to Pass only by attaching the required evidence and recording its reviewer. The implementation gate remains closed.
