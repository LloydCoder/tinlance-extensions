# Tinlance Extensions — Final Consolidated Phase Plan

**Document status:** Accepted programme baseline; implementation authorization remains gated
**Date:** 2026-11-05
**Owner:** Tinlance Limited
**Repository:** https://github.com/LloydCoder/tinlance-extensions
**Canonical catalogue:** [26 products](PRODUCT-CATALOGUE.md)
**Source records:** [Master roadmap](MASTER-ROADMAP.md), [system architecture](SYSTEM-ARCHITECTURE.md), [Phase 02 requirements](PHASE-02-PRODUCT-REQUIREMENTS.md), [four proposal decisions](FOUR-PROPOSAL-DECISIONS.md), [MCP ADR 0002](adr/0002-mcp-protocol-baseline.md)

> This document consolidates programme sequencing and workstream boundaries. It does not claim that product applications, browser packages, APIs, workers, data stores, MCP services, integrations, customer validation, security assurance, or releases exist. A phase becomes complete only when its acceptance evidence is linked, reviewed, and recorded. This accepted programme baseline does not authorize application implementation.

## 1. Authority, precedence and change control

This document is the consolidated programme view. It does not silently replace the detailed source records:

1. `PRODUCT-CATALOGUE.md` remains authoritative for product IDs, names, family membership and catalogue scope.
2. `PHASE-02-PRODUCT-REQUIREMENTS.md` remains authoritative for product-level user jobs, MVP boundaries, permissions, data classes and acceptance criteria.
3. `SYSTEM-ARCHITECTURE.md` and approved ADRs govern technical boundaries and architecture decisions.
4. `FOUR-PROPOSAL-DECISIONS.md` governs the four proposal dispositions and their validation gates.
5. `MASTER-ROADMAP.md` remains the detailed phase and MCP work-package register; this document reconciles and adds the cross-functional delivery view.
6. The Agent Platform remains the sole authority for identity-bound authorization, policy, approvals, consequential execution, secrets governance and authoritative audit.

If records conflict, do not infer a new decision. Raise a documented discrepancy, preserve the narrower security boundary, and update the owning source record through review. Product IDs, the first seven delivery slots, authority boundaries, data-source strategy and implementation order require evidence-backed change control.

## 2. Verified baseline and explicit non-claims

The repository baseline at the time this plan was prepared:

- Repository: `LloydCoder/tinlance-extensions`; default branch: `main`.
- Baseline for this programme reconciliation: `main` after PR #30, commit `f6e34c242dfc7819a44e0940accb1544d1363148`. The isolated A1–A2 and A3 feasibility spikes remain separate from production application implementation.
- The four proposal decisions were incorporated through PR #13.
- The canonical catalogue contains 26 products in six families.
- Phase 0 repository foundation and Phase 01 repository forensic baseline are closed for their documented repository scope.
- Phase 02 documentary baseline is reconciled; customer discovery, product-owner sign-offs, product-specific threat models, legal/provider reviews and commercial proof remain outstanding.
- ADRs 0003–0014 were explicitly accepted by the decision owner and merged through PR #17. A1 passed. A2 remains partial: PR #30 proves Chromium MV3 popup/runtime and service-worker termination/event-driven restart, and the macOS CI lane generates and validates a Safari Xcode project; permission-sensitive activeTab/scripting behavior, Firefox runtime, Safari runtime/signing and store validation remain open. A3 has merged API and PostgreSQL 16 RLS/idempotency/transactional-outbox plus tenant-bound worker lease/recovery and stale-worker fencing evidence (PR #28; all three exact-head checks green), but remains partial pending production API/database wiring, multi-process contention, process crash/restart and outbox publisher delivery; A4–A7 remain open. See [Phase 02 evidence and feasibility review](PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md).
- The repository remains a documentation/governance foundation, not an implemented application suite. An isolated A1–A2 spike now exists under `spikes/architecture-feasibility/a1-a2/`; no production product runtime, extension, backend API, worker, database, OAuth service or MCP gateway is implemented.
- A passing repository CI workflow validates repository checks only. It is not product build, runtime, security, privacy, customer or release evidence.

Do not convert a proposed endpoint, stack, deployment topology, price, revenue target, browser target or commercial hypothesis into a verified fact. No paid infrastructure or vendor commitment is authorized by this plan. Apache-2.0 remains the repository license pending a separate legal/IP decision. Tinlance Extensions remains the chosen project identity, subject to separate trademark clearance.

## 3. Portfolio baseline — all 26 products

The six families and 26 IDs remain unchanged.

### A. Security, privacy and assurance (8)

| ID | Product | Primary responsibility |
|---|---|---|
| EXT-01 | Site Security Auditor | Passive website posture observations, evidence and remediation guidance |
| EXT-02 | Aithyrex Guard | Local-first inspection of supported browser AI interactions and sensitive-data policy |
| EXT-03 | Auctaryn Guard | Agent runtime risk, context integrity, tool/MCP exposure and containment signals |
| EXT-04 | ThreatFade LinkShield | URL reputation and link-risk context |
| EXT-05 | ThreatFade PrivacyGuard | Observable tracking/privacy signals and user controls |
| EXT-06 | ThreatFade DownloadGuard | Download provenance and reputation context |
| EXT-07 | Compliance Assistant | Evidence mapping to selected control frameworks |
| EXT-08 | Authorized Security Testing Companion | Scope-bound, authorized testing notes and evidence |

### B. Tinlyt — web intelligence and evidence (4)

| ID | Product | Primary responsibility |
|---|---|---|
| EXT-09 | Tinlyt Page Extractor | User-selected page extraction and structured output |
| EXT-10 | Tinlyt Verify | Claims, supporting/conflicting sources and uncertainty |
| EXT-11 | Tinlyt Monitor | Scheduled source monitoring, snapshots, diffs and alerts |
| EXT-12 | Tinlyt Research | Investigations, provenance, annotations and evidence graph |

### C. FadeReach — sales intelligence (4)

| ID | Product | Primary responsibility |
|---|---|---|
| EXT-13 | FadeReach Prospect Capture | User-selected prospect capture, normalization and export |
| EXT-14 | FadeReach CompanyIntel | Sourced company identity, profile and permitted enrichment |
| EXT-15 | FadeReach ContactIntel | Professional contact intelligence subject to source rights/legal basis |
| EXT-16 | FadeReach Outreach Assistant | Source-grounded, editable outreach drafts and follow-up support |

### D. Governed automation and memory (3)

| ID | Product | Primary responsibility |
|---|---|---|
| EXT-17 | Agent Browser Bridge | Paired, user-controlled browser execution surface |
| EXT-18 | Tinlance Workflow | Approved, repeatable user workflows |
| EXT-19 | Memory Vault Clipper | User-selected content capture into authenticated Memory Vault |

### E. Developer and web-quality utilities (4)

| ID | Product | Primary responsibility |
|---|---|---|
| EXT-20 | WebDebugger | Browser diagnostics and redacted network/API inspection |
| EXT-21 | JSON Explorer | JSON formatting, tree navigation and schema utilities |
| EXT-22 | StackDetect | Evidence-backed website technology detection |
| EXT-23 | AccessibilityCheck | Bounded accessibility checks and remediation guidance |

### F. Search, commerce and market intelligence (3)

| ID | Product | Primary responsibility |
|---|---|---|
| EXT-24 | SEO Inspector | Technical and on-page SEO inspection |
| EXT-25 | SERP Intelligence | Search visibility and competitive intelligence |
| EXT-26 | ShopIntel | Product, merchant and e-commerce market intelligence |

Checkout Sentry remains a separate discovery candidate outside the 26-product catalogue. It is not EXT-27 and is not merged into ShopIntel. No catalogue expansion is approved.

## 4. Delivery principles and programme gates

- Independently installable and releasable product experiences; shared platform services, not one monolithic extension with every permission.
- Product services remain authoritative for product behaviour; browser extensions are clients/adapters.
- MCP is an integration boundary, not a second product or authorization authority.
- Agent Platform authorization and approval are mandatory for consequential governed execution.
- Least privilege, user-selected data, explicit consent, safe defaults, revocation and deletion are designed in from the start.
- No browser/client support claim without a tested version matrix.
- No security, compliance, detection accuracy, privacy or performance claim without measured evidence.
- No paid infrastructure/vendor commitment without explicit budget approval.
- Every phase has named ownership, dependencies, acceptance evidence, status and rollback/exception handling.

### Programme-wide gates

| Gate | Evidence required | Blocks |
|---|---|---|
| G0 — Scope | User/job, product boundary, non-goals, owner, catalogue identity | Scope and build authorization |
| G1 — Customer evidence | Interview records, repeated pain, alternatives, buyer, negative evidence | Commercial prioritization |
| G2 — Architecture | Approved ADRs, contracts, dependency/data-flow and failure model | Shared platform and product implementation |
| G3 — Security/privacy/legal | Threat model, data classification, permissions, retention/deletion, provider/terms review | Sensitive-data and external integration work |
| G4 — Technical feasibility | Reproducible spike, browser/API compatibility, quality results | Technical commitment |
| G5 — Commercial proof | Design-partner commitment, paid pilot or documented purchase evidence, cost-to-serve | Commercial scale-up |
| G6 — Release readiness | Automated/manual acceptance, browser matrix, operations, support, rollback and truthful status | Any public release |

A gate remains open until evidence is linked in the owning brief, ADR, test report or pilot record and reviewed. A plan, estimate, vendor statement or green repository CI is not gate evidence.

## 5. Consolidated 25-phase roadmap

The original 25-phase numbering and first-seven product order are retained. This section is the integrated programme sequence; the Master Roadmap remains the detailed register.

### Milestone A — Governed foundation

| Phase | Workstream | Principal outputs | Exit evidence / status |
|---:|---|---|---|
| 0 | Repository foundation | Governance files, CI baseline, contribution/security policies, repository conventions | **Closed** for repository scope; not application readiness |
| 1 | Forensic baseline | Commit-specific inventory, risks, gaps, implementation-status distinction | **Closed** for documented audit scope |
| 2 | Product requirements and validation | Reviewed briefs for 26 products, discovery, permissions/data reviews, prioritization | **Documentary baseline complete / open**; substantive evidence gates outstanding |
| 3 | Architecture and ADR approval | Target architecture, product/service boundaries, threat model, dependency graph, approved ADR set | **ADRs accepted; A1 pass, A2 partial, A3 partial, A4–A7 open**; implementation blocker |
| 4 | Monorepo and developer platform | Reproducible workspace, pinned toolchain, local setup, scripts, clean checkout build | Not started |
| 5 | CI/CD and repository governance | Required checks, branch rules, dependency automation, provenance, release permissions | Repository Quality and A1–A2 workflows exist; `main` is currently unprotected with no repository rulesets; application pipeline not implemented |
| 6 | Design system and UX foundation | Tokens, components, accessibility baseline, extension patterns, web portal UX | Not started |
| 7 | Browser SDK and compatibility foundation | Browser adapters, messaging, storage, permissions, compatibility harness | Not started |
| 8 | Identity, authentication and tenancy | Accounts, sessions, organizations, tenant isolation, scopes and authorization primitives | Not started |
| 9 | Backend and data architecture | Service ownership, schemas, migrations, API contracts, queues, evidence and data lifecycle | Not started |
| 10 | Security and privacy control plane | Threat models, policy, consent, audit, secrets, retention/deletion and security gates | Not started |

**Milestone A exit:** ADRs 0003–0014 are accepted; A1 passes, A2 remains partial and A3 is partial. PR #30 adds Chromium MV3 popup/runtime, service-worker restart and Safari Xcode packaging/project-validation evidence; activeTab/scripting action behavior, Firefox runtime, Safari runtime/signing and store validation remain open. PR #28 adds green PostgreSQL tenant-bound worker lease/recovery and stale-worker fencing evidence, but production API/database wiring, multi-process contention, process crash/restart and outbox publisher delivery remain open. A4–A7, Phase 02 customer/owner/legal/security evidence and MCP Gate 0 executable conformance remain outstanding. Do not begin product implementation or production MCP gateway work before these gates pass.

### Milestone B — Commercial beta

| Phase | Product/workstream | Principal outputs | Exit evidence |
|---:|---|---|---|
| 11 | EXT-01 Site Security Auditor | Passive checks, findings, confidence, evidence, remediation | Safe URL handling, reproducible findings and tests |
| 12 | EXT-09 Tinlyt Page Extractor | User-selected extraction, preview/edit/export, provenance | Extraction quality, hostile-content and source tests |
| 13 | EXT-02 Aithyrex Guard | Local-first supported AI interaction inspection and policy UX | Synthetic benchmark, supported-path enforcement and privacy tests |
| 14 | EXT-10 Tinlyt Verify | Claim/evidence workflow, conflicts and uncertainty | Source provenance and claim-evidence traceability |
| 15 | EXT-11 Tinlyt Monitor | Scheduling, snapshots, diffs, notifications and lifecycle | Idempotency, cancellation, retention and alert tests |
| 16 | EXT-13 FadeReach Prospect Capture | Selected capture, normalization and export | Source provenance, lawful-use controls and user validation |
| 17 | EXT-17 Agent Browser Bridge | Paired browser, scoped actions and governed execution requests | Agent Platform authorization, approval, audit and isolation; no authority bypass |
| 18 | Commercial platform | Plans, entitlements, billing integration, usage, org and account controls | Server-enforced entitlements and reconciled usage |
| 19 | Integrations and interoperability | Product adapters, external integrations, MCP beta, developer docs | Production-backed tools, OAuth/tenant tests and client conformance |

**Milestone B exit:** controlled beta works end-to-end; each capability is backed by a production-quality service; authorization, entitlement, metering and audit are enforced server-side; no unapproved write action is exposed.

### Milestone C — Enterprise production

| Phase | Workstream | Principal outputs | Exit evidence |
|---:|---|---|---|
| 20 | Cross-browser and release engineering | Browser-specific packages, compatibility matrix, signing, store metadata and rollback | Verified browser/version evidence and distribution approvals |
| 21 | Functional and regression verification | Unit, contract, integration, E2E, accessibility, performance and resilience suites | Reproducible results and defect closure |
| 22 | Security and supply-chain assurance | Threat-model closure, security tests, SBOM/provenance, independent assessment | No unresolved critical/high release blockers; remediation evidence |
| 23 | Reliability and production operations | SLOs, alerts, backups, restore, DR, incident and capacity procedures | Tested operational runbooks and recovery evidence |
| 24 | Documentation, legal and compliance readiness | Privacy/terms, disclosures, support, admin/developer docs and store materials | Legal review and accurate operational documentation |
| 25 | Production release and enterprise acceptance | Release approvals, staged rollout, customer acceptance and handover | Signed release record, verified store/client status and operational ownership |

## 6. Frontend programme

The frontend is five related surfaces sharing a design system and typed contracts, not a single oversized browser extension.

### 6.1 Public marketing and product website

- Portfolio landing page and six family pages.
- Individual product pages for all 26 IDs, with truthful status, supported capabilities, limitations, permissions and data practices.
- Pricing/plan hypotheses only when approved; product comparisons, trust/security, privacy, terms, support and install guides.
- SEO and structured content built around real product capabilities and verifiable evidence.
- Proposed host: `extensions.tinlance.com`; DNS/deployment is not verified by this plan.

### 6.2 Customer workspace

- Registration/login, account recovery, organization/workspace creation and invitations.
- Connected extensions and AI clients; consent, connection status and revocation.
- Product-specific evidence, investigations, monitors and jobs where supported.
- Subscription, invoice, usage and entitlement views.
- Data export, deletion and privacy controls.

### 6.3 Enterprise administration

- Organization, seats, roles, policies and browser deployment controls.
- Aithyrex policy management, supported-site scope, exceptions, expiry and revocation.
- Metadata-only evidence and audit views with tenant-scoped access.
- Security events, support and administrative workflows.

### 6.4 Developer and MCP portal

- API/MCP documentation, tool catalogue and schemas.
- OAuth/connection setup, SDK examples, versioning, changelog and diagnostics.
- Compatibility matrix, capability limitations and support lifecycle.
- No tool is documented as available until its service, auth and support owner exist.

### 6.5 Extension experiences

- Shared shell, onboarding, settings, account linking, permissions explanation and accessible components.
- Product-specific popup, side panel, DevTools panel or contextual UI only where the user job warrants it.
- Permission prompts at point of use; clear offline, unsupported, error, revoke and data-state UX.
- Independent install/update/release lifecycle for each product.

### Frontend work packages

| ID | Package | Depends on |
|---|---|---|
| FE-01 | UX research, information architecture and design system | Phase 2 and 3 |
| FE-02 | Shared tokens, components and accessibility primitives | FE-01 |
| FE-03 | Public website and product catalogue | FE-01/02, approved product copy |
| FE-04 | Authentication and customer workspace | Identity/API contracts |
| FE-05 | Enterprise administration | Tenant, policy and audit contracts |
| FE-06 | Developer/MCP portal | Approved tool contracts and client matrix |
| FE-07 | Browser shell and SDK-driven extension UI | Browser SDK and permission broker |
| FE-08 | First seven product experiences | Product phase acceptance criteria |
| FE-09 | Remaining product experiences | Product-specific gates and prioritization |
| FE-10 | Optional MCP Apps | MCP protocol/client/security compatibility |

**Frontend quality bar:** WCAG 2.2 AA target; keyboard and screen-reader operation; safe rendering/sanitization; strict typing; server-side authorization; no secrets in client bundles; automated component, visual and E2E tests.

## 7. Backend, data and platform programme

### 7.1 Service architecture

Prefer a modular platform API with separately deployable workers and MCP edge rather than premature microservices. Boundaries must be explicit and testable.

Core modules:
- Identity, sessions, organizations, memberships and tenant context.
- Authorization, scopes, policy, approvals and entitlements.
- Product and integration registry.
- Versioned API/contracts and product adapters.
- Evidence, provenance, snapshots and object references.
- Audit events and security event records.
- Jobs, scheduler, workers, retries, cancellation and dead-letter handling.
- Notifications, usage metering and billing integration.
- Browser pairing/session broker and Agent Platform adapter.
- MCP gateway, OAuth/resource-server integration and tool registry.
- Operations, health, diagnostics and support.

### 7.2 Data architecture

Accepted logical baseline (concrete vendor selection remains deferred):
- PostgreSQL for relational platform state.
- Object storage for evidence snapshots, exports and artifacts.
- Queue/job infrastructure for monitoring, research and enrichment.
- Cache only where measured workload justifies it.
- Managed secret storage for provider and service credentials.
- Redacted telemetry with explicit retention and access controls.

Do not provision Redis, a managed database, cloud services or other paid infrastructure solely because it appears in a target diagram. Select the smallest viable deployment after cost, security, recovery and operational review.

### 7.3 Data classification and lifecycle

- **D0:** public content and metadata.
- **D1:** user-selected content, URLs, notes and preferences.
- **D2:** business-confidential records, prospect data, unpublished research and organization policy.
- **D3:** credentials, secrets, personal, financial, health, legal or regulated information.

For every product and data flow document source, purpose, local/cloud processing, authorization/consent, retention, deletion, export, processors/transfers and logging/redaction. Raw prompts and sensitive content are not telemetry by default. Tenant identity must be derived and verified server-side, never trusted from a client-supplied tenant ID.

### 7.4 Backend acceptance

- Versioned schemas and API contracts with compatibility tests.
- Tenant isolation and server-side authorization on every protected operation.
- Safe migrations, backups, restore tests and recovery procedures.
- Idempotent, cancellable, bounded jobs with retries and dead-letter handling.
- SSRF, redirect, DNS rebinding, content-size and timeout controls for fetch services.
- Verifiable export/deletion and retention enforcement.
- Reconciled usage, entitlements and billing events.
- Audit correlation for consequential actions and administrative changes.

## 8. Browser SDK and extension platform

Shared packages should cover:
- Browser capability adapters and cross-browser feature detection.
- Least-privilege permission broker and optional-host permission flows.
- Secure extension messaging with sender, origin, tab and frame validation.
- Runtime schema validation and typed API/SDK clients.
- Secure local storage and credential isolation.
- Shared UI, design tokens, product configuration and feature flags.
- Redacted telemetry/error reporting and evidence utilities.
- Browser compatibility, packaging, signing and release automation.

WXT with TypeScript, pnpm workspaces and Turborepo are accepted architecture choices under ADRs 0003 and 0005. The isolated A1 toolchain spike passes. A2 now has Chromium MV3 popup/runtime and service-worker lifecycle evidence plus Safari Xcode packaging/project validation; the remaining permission-sensitive action, Firefox runtime and Safari runtime/signing gates keep A2 partial.

Security constraints:
- No remotely hosted executable code in extension packages.
- Treat page content, DOM text and tool outputs as untrusted instructions.
- Isolate content scripts and validate all messages.
- No cookies, passwords, session tokens or authentication secrets in agent payloads or telemetry.
- Manifest V3 service workers are event-driven; do not promise always-on execution.
- `chrome.debugger` is exceptional/high privilege, not a default dependency.
- Consequential writes require explicit approval and must be scoped, interruptible, revocable and auditable.
- Chrome MV3, Edge, Brave and Opera compatibility must be tested; Firefox and Safari need their own packaging and compatibility evidence.

## 9. MCP programme — 18 work packages and four gates

MCP is a shared remote integration with product-specific capability groups. It is not an independent backend or authority. Proposed endpoint: `https://api.extensions.tinlance.com/mcp`; proposed docs: `https://extensions.tinlance.com/developers/mcp`. Neither endpoint is verified deployed.

The accepted MCP target is specification revision 2026-07-28 with stateless Streamable HTTP (ADRs 0002 and 0012). A5 still requires pinned SDK/fixtures, authentication, negative tests and a real-client compatibility matrix. Do not implement a mixed-version protocol.

### Gate 0 — Strategy, contracts and authority (design only)

| WP | Work package | Required evidence |
|---|---|---|
| MCP-01 | Product strategy and distribution | Umbrella/specialist listing model, target clients, capability scope, owner and non-goals |
| MCP-02 | Protocol baseline and compatibility | Pinned revision, transport semantics, maintained SDK spike and client matrix |
| MCP-06 | Tool contracts and annotations | Namespaced schemas, outputs, side-effect/risk annotations, versioning and deprecation |
| MCP-07 | Security and authorization design | OAuth/resource-server model, tenant isolation, scopes, approval matrix and threat model |
| MCP-09 | Agent Platform/Browser Bridge boundary | Typed request, approval lifecycle, authority mapping and no-bypass tests |

**Gate 0 exit:** all five design packages reviewed and approved. No production gateway implementation before this gate.

### Gate 1 — Secure core

| WP | Work package | Required evidence |
|---|---|---|
| MCP-03 | Gateway and transport | HTTPS, 2026-07-28 stateless per-request POST, required header/body validation, Origin validation, bounded requests and conformance |
| MCP-04 | OAuth and tenant isolation | Consent, token/audience validation, tenant binding, scopes, revocation and negative tests |
| MCP-05 | Tool/capability registry | Ownership, lifecycle state, schema fingerprints and reviewed change workflow |
| MCP-08 | Product adapters | Typed adapters to production-backed services, output validation, redaction and contract tests |

**Gate 1 exit:** a test client can use a narrowly scoped, production-backed read-only capability with tenant isolation, audit and conformance evidence.

### Gate 2 — Commercial and extended capabilities

| WP | Work package | Required evidence |
|---|---|---|
| MCP-10 | Long-running jobs | Submit/status/cancel/result, idempotency, quotas, retries, expiry and recovery |
| MCP-11 | Metering and entitlements | Server-side plan checks, usage records, reconciliation and limit tests |
| MCP-12 | Skills distribution | Versioned skills, safe instructions, examples and supported-client matrix |
| MCP-13 | MCP Apps | Optional UI, CSP/origin/message validation, accessibility and safe fallback |
| MCP-14 | Observability and audit | Correlated traces, redacted logs, per-tool health, audit and alert/runbook evidence |

### Gate 3 — Client compatibility and distribution

| WP | Work package | Required evidence |
|---|---|---|
| MCP-15 | OpenAI compatibility/submission | Real-client tests, listing dossier and separately tracked submission/approval |
| MCP-16 | Anthropic compatibility/submission | Claude client tests, tool annotations, test instructions and listing status |
| MCP-17 | Grok and wider clients | Grok connector plus representative Codex/IDE/CLI compatibility records |
| MCP-18 | Registry and release automation | Verified namespace, metadata, reproducible publish/rollback and version history |

Initial capability groups, only when backed by services:
- Tinlyt: search, fetch, extract, verify, evidence, monitor and research.
- Aithyrex: AI content/prompt-risk and sensitive-data checks.
- ThreatFade: URL/site/privacy signals.
- FadeReach: company/prospect/permitted contact intelligence and outreach drafts.
- Developer utilities: API/JSON/stack/accessibility checks.
- Agent Platform: capability discovery, browser-action request, execution status and audit retrieval.

Required flow: AI client → gateway → token validation → tenant resolution → entitlement → policy → typed adapter → authoritative product service → output validation/redaction → audit/metering → client. Consequential operations additionally require Agent Platform authorization and approval. Tool annotations are descriptive, not authorization. Never forward inbound client tokens as downstream credentials.

## 10. Product delivery specifications and sequencing

### First seven — preserve exact order

1. EXT-01 Site Security Auditor
2. EXT-09 Tinlyt Page Extractor
3. EXT-02 Aithyrex Guard
4. EXT-10 Tinlyt Verify
5. EXT-11 Tinlyt Monitor
6. EXT-13 FadeReach Prospect Capture
7. EXT-17 Agent Browser Bridge

EXT-17 must not ship consequential execution until Agent Platform authorization, approval, audit and isolation are demonstrated.

### Product-specific release constraints

- **EXT-01:** passive checks and reproducible evidence; distinguish observable configuration from exploitability.
- **EXT-02:** local-first supported AI interfaces; no raw prompt telemetry by default; disclose unsupported paths and detector limitations.
- **EXT-03:** depends on Auctaryn API/event/auth/tenant contracts and Agent Platform integration; no independent authorization.
- **EXT-04:** unknown reputation is not safe; redact sensitive URL components before cloud lookup.
- **EXT-05:** report observable signals only; no promise of complete tracker detection.
- **EXT-06:** reputation is not malware scanning unless a supported scanner is proven; unknown is not clean.
- **EXT-07:** evidence mapping is not certification or legal advice.
- **EXT-08:** authorized scope/allowlist/expiry; default-deny outside scope; no stealth or destructive automation.
- **EXT-09:** user-selected page/region, preview/edit/export, safe fetching and provenance.
- **EXT-10:** supporting and conflicting evidence with uncertainty, not unsupported verdicts.
- **EXT-11:** bounded scheduled jobs, snapshots/diffs, deduped alerts, cancellation and retention.
- **EXT-12:** investigations, source provenance, annotations and evidence graph.
- **EXT-13:** selected capture, normalization, export and user control.
- **EXT-14:** sourced company identity/profile/enrichment with freshness and confidence.
- **EXT-15:** gated on source rights, lawful basis, accuracy, freshness and provider economics.
- **EXT-16:** source-grounded editable outreach; review before sending; no autonomous sending by default.
- **EXT-17:** paired browser execution, origin/tab/frame/session scope, approval, interrupt/revoke and audit.
- **EXT-18:** deterministic workflow definitions, preview, user start, pause/stop and recovery; FormPilot is a capability, not a new product.
- **EXT-19:** selected-page capture into authenticated Memory Vault; explicit source and destination consent.
- **EXT-20:** diagnostics/network/API inspection with redacted exports.
- **EXT-21:** JSON tree/schema utilities with safe handling of large/malformed inputs.
- **EXT-22:** evidence-backed technology detection with confidence and source limitations.
- **EXT-23:** bounded accessibility checks; manual assessment remains necessary.
- **EXT-24:** technical/on-page SEO checks with reproducible evidence.
- **EXT-25:** source rights, permitted use, coverage, refresh and unit economics before build.
- **EXT-26:** product/merchant intelligence subject to source rights, freshness and cost-to-serve.

### Post-first-seven expansion order

1. EXT-14 and EXT-16 to complete the FadeReach workflow.
2. EXT-12 Tinlyt Research.
3. EXT-19 Memory Vault Clipper.
4. EXT-04 and EXT-05 ThreatFade.
5. EXT-23 and remaining developer utilities.
6. EXT-03 after Auctaryn/Agent Platform contracts are approved.
7. EXT-06, EXT-07 and EXT-08 after specialist gates.
8. EXT-18 after TLER/use-case validation.
9. EXT-24, EXT-25 and EXT-26 based on source economics and demand.
10. EXT-15 only after provider and legal gates pass.

This is a proposed expansion sequence, not an authorization to reorder the initial seven.

## 11. Shared infrastructure concepts and proposal decisions

### FadeReach Professional Workspace — D-01

Unify the sales/outreach proposal within EXT-13–16; do not create another extension. Initial ICP: founder-led B2B and small sales agencies, not recruiters as the initial segment. Workflow: find company → capture → company intelligence → permitted contact intelligence → draft outreach → review/approve → copy/export or approved integration → outcome/follow-up. CRM is an integration, not a fifth product.

Validation threshold: 12–15 qualified interviews, provider/source rights review, at least two design-partner commitments and one paid pilot or equivalent documented purchasing commitment. Do not assume LinkedIn scraping/activity automation is permitted; visible data is not automatically reusable. EXT-15 remains separately gated.

### Aithyrex Enterprise Guard — D-02

Enterprise direction belongs to EXT-02 Aithyrex Guard; EXT-03 remains Auctaryn Guard. Validate centralized policy, managed-browser deployment, local detection, metadata-only evidence, privacy controls, benchmark and revocation. No universal DLP, EDR replacement, air-gap or SOC 2 certification claim.

Validation threshold: 15–18 buyer/user interviews, synthetic detection benchmark, supported-site enforcement tests and enterprise privacy/security review. Measure precision, recall, false positives/negatives, latency and enforcement success; do not claim accuracy before results.

### Tinlance Local Execution Runtime (TLER) — D-03

TLER is a working name for a shared infrastructure concept, not a new extension or approved implementation. Agent Platform remains authoritative. EXT-17 is the browser surface; EXT-18 is the workflow product. Local execution does not bypass website terms, rate limits or access controls. No remote executable code, arbitrary JavaScript download, always-on MV3 promise or default `chrome.debugger`. Never expose cookies, credentials or session tokens to agents.

Validate one narrow use case, threat model, packaged constrained interpreter, permission model, browser lifecycle recovery, adversarial tests, measurable value/economics and Agent Platform approval before a pilot.

### Checkout Sentry — D-04

Separate consumer discovery candidate outside the 26-product catalogue and outside ShopIntel. Discovery may test user-selected receipts, reminders and bounded price/policy checks. No mailbox-wide OAuth by default, purchase-data monetization, unverified policy database claims or promise of eligibility/recovery. Require at least 20 consumer interviews, concierge test, bounded reliable policy sources, privacy/legal approval and willingness-to-pay evidence before any catalogue proposal.

## 12. Security, privacy and assurance baseline

Apply relevant OWASP guidance to browser extensions, web/API services and agentic workflows; use ASVS and secure development controls as applicable. Threat-model and test:
- Cross-tenant access, authorization bypass and client-trusted tenant context.
- Prompt injection, malicious page content, confused deputy and tool/MCP exposure.
- Token theft/replay, revocation failure and downstream credential misuse.
- SSRF, redirects, DNS rebinding, oversized responses and unsafe content handling.
- Forged extension messages, origin/tab/frame confusion and cross-origin leakage.
- Secrets/cookie/session exfiltration, sensitive telemetry and retention/deletion failure.
- Approval bypass, unauthorized writes, resource exhaustion and unsafe retries.
- Supply-chain compromise, unpinned dependencies, build provenance and signing.

Release rule: no unresolved critical/high security findings, tenant-isolation failure, authorization bypass or approval bypass. Privacy review must document purpose, lawful basis where applicable, data minimization, consent, retention/deletion, processors/transfers and user rights. No certification/compliance claim without independent evidence and actual status.

## 13. Quality engineering and release operations

Test layers:
1. Unit and property tests for core logic.
2. Schema/API/MCP contract tests.
3. Database, queue and product integration tests.
4. End-to-end user journeys and negative authorization tests.
5. Browser/version compatibility tests per claimed target.
6. Security, privacy, abuse and adversarial tests.
7. Accessibility, visual regression and usability tests.
8. Performance, reliability, retry, cancellation and recovery tests.

CI should include formatting, lint, type checks, unit/contracts, builds, dependency and secret scans, security checks, browser package checks, docs validation, license review and supply-chain provenance. Releases must identify source commit, version, artifact, test evidence, SBOM/provenance, approvals and rollback path.

Infrastructure work packages: local development, development, staging, production; IaC and access controls; secret storage; migration/backups; monitoring/alerting; release/rollback; incident response; disaster recovery. Do not provision or alter paid services without explicit budget approval.

## 14. Commercial, marketing and distribution workstreams

Portfolio marketing is one coherent Tinlance Extensions brand with six family narratives and product-specific positioning. Channels:
- Search-led product pages, technical guides, comparison content and evidence-backed SEO.
- Product-led onboarding, activation and lifecycle education.
- Founder-led B2B discovery, demos and design-partner pilots.
- Partner distribution through agencies, consultants, MSPs, CRM and platform ecosystems.
- Browser stores, AI client directories, developer registries and GitHub where supported.
- Email lifecycle and customer education with consent and deliverability controls.

Family go-to-market:
- FadeReach: founders, small sales teams/agencies and permitted CRM partners.
- Aithyrex: security leaders, IT/admin, AI governance and consultants.
- Tinlyt: researchers, analysts, intelligence teams, consultants and technical SEO users.
- ThreatFade: security communities, MSPs and web agencies.
- Governed automation: developers and agent builders after safety/authority proof.
- Developer utilities: search-led discovery, GitHub, tutorials and engineering communities.

Track activation, time-to-first-value, install-to-active conversion, free-to-paid, CAC, MRR/ARR by family, gross margin/cost-to-serve, churn, NRR, enterprise pipeline/win rate and partner-sourced revenue. Revenue targets are ambitions, not validated forecasts. Do not market unsupported coverage, accuracy, compliance or customer claims.

## 15. Legal, privacy and product-specific review

Required before relevant launch: privacy notice, terms, data-processing disclosures, permissions, retention/deletion, subprocessors/transfers, security disclosure, store listing, support and incident contact. Specialist gates:
- FadeReach contact/prospect source rights and lawful-use review.
- Aithyrex prompt privacy, managed deployment and policy evidence review.
- Auctaryn API, tenant, event and containment contract.
- Tinlyt safe fetching, source terms, evidence retention and deletion.
- EXT-08 authorization scope and testing restrictions.
- SERP/ShopIntel data-source rights and usage restrictions.
- Trademark clearance and separate Apache-2.0/IP decision.

## 16. Immediate execution backlog

### P0 — complete before application implementation

1. Assign accountable owners/reviewers and obtain dated review decisions for all 26 product briefs.
2. Conduct real first-wave customer interviews under the discovery playbook; record positive and disconfirming evidence.
3. Validate FadeReach ICP, source rights, design-partner pipeline and paid-pilot criteria.
4. Validate Aithyrex buyers, supported-site scope, benchmark and privacy design.
5. Complete product-specific threat models, data-flow reviews and scoped legal/provider assessments for the first-seven candidates.
6. Obtain the actual Agent Platform contract and resolve identity, tenant, authorization, approval and audit interfaces.
7. Record a Phase 02 owner go/no-go based on linked evidence; do not infer approval from this plan.

### P1 — platform feasibility and design

8. A1 clean-checkout toolchain and representative Next.js/WXT builds passed in isolated spike PR #20; retain as a feasibility fixture.
9. Complete A2 permission-sensitive activeTab/scripting runtime, Firefox runtime, and Safari runtime/signing and store validation.
10. PR #28 completed the isolated A3 PostgreSQL tenant-bound lease/recovery and fencing spike with all checks green; continue A3 with production API/database wiring, multi-process contention, crash/restart, outbox publisher delivery and operational recovery proof.
11. Pass A4 product data-flow, threat-model, retention/deletion and telemetry review.
12. Pass A5 MCP 2026-07-28 conformance, OAuth and client-matrix proof.
13. Pass A6 typed Agent Platform contract and negative no-bypass tests.
14. Obtain explicit A7 provider, residency, cost ceiling, backup/restore and rollback approval before any spend.

### Accepted architecture decisions

ADRs 0003–0014 are accepted and merged through PR #17. Their acceptance records are in `docs/adr/`. This is an architecture decision record, not proof of implementation. A1 passed through the isolated reproducible toolchain spike. A2 remains partial after PR #30's Chromium MV3 popup/runtime, service-worker restart and Safari Xcode packaging/project-validation evidence; activeTab/scripting, Firefox runtime and Safari runtime/signing remain open. A3 has merged PostgreSQL 16 RLS/idempotency/transactional-outbox and tenant-bound worker lease/recovery/fencing evidence (PR #28; all exact-head checks green), but remains partial pending production API/database wiring and operational recovery proof; A4–A7 remain open. See [Phase 02 Evidence and Architecture Feasibility Review](PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md).

## 17. Programme definition of done

The programme is complete only when:
- All 26 products have approved briefs, owners, boundaries and release criteria.
- Shared frontend/design system and independent product experiences are implemented and tested.
- Identity, tenancy, authorization and entitlements are production-ready and server-enforced.
- Evidence, audit, retention, export and deletion controls work and are tested.
- Agent Platform approval and audit are enforced for consequential execution.
- MCP is production-backed, OAuth-protected, tenant-isolated and tested against each claimed client.
- Billing, metering and entitlements reconcile.
- Browser support is evidenced separately for every claimed browser/version.
- Security and supply-chain assurance have independent, reviewable evidence.
- Monitoring, backups, restore, incident response, recovery and rollback are tested.
- Legal, privacy, store/directory and support readiness are approved.
- Adoption, customer value and unit economics are supported by actual evidence.

## 18. Status and review record

| Area | Status at plan creation |
|---|---|
| Repository foundation / Phase 0 | Closed for repository scope |
| Forensic baseline / Phase 01 | Closed for documented audit scope |
| Phase 02 product requirements | Documentary baseline complete; customer, ownership, legal/provider, security and commercial evidence open |
| Phase 03 architecture/ADRs | Accepted; A1 pass, A2 partial, A3 partial (PostgreSQL RLS/idempotency/outbox and tenant-bound worker lease/recovery/fencing evidence merged in PR #28), A4–A7 feasibility open |
| Frontend implementation | Not started / not evidenced |
| Backend and data services | Not started / not evidenced |
| Browser SDK/extensions | Not started / not evidenced |
| MCP gateway and adapters | Not started / not evidenced |
| Customer validation | Not evidenced as completed |
| Product security/privacy/legal approvals | Open by product |
| Commercial beta / production release | Not started / not evidenced |

**Programme status:** this consolidated plan is the accepted programme baseline. The first-seven order and catalogue remain unchanged. Phase 02 substantive evidence remains open; A1 passed; A2 remains partial after PR #30's Chromium MV3 popup/runtime, service-worker restart and Safari Xcode packaging evidence, with activeTab/scripting, Firefox runtime and Safari runtime/signing still open; A3 is partial (PR #28 adds green PostgreSQL tenant-bound worker lease/recovery and fencing evidence, but production wiring and operational recovery remain unproved); A4–A7 remain open. Application implementation begins only after the applicable evidence, security, architecture and owner go/no-go gates are accepted.
