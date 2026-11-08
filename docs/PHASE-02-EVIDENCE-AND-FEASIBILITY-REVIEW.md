# Phase 02 Evidence and Architecture Feasibility Milestone Review

**Review date:** 2026-11-07
**Repository baseline:** `main` after PR #59, commit `d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1`
**Review branch:** `phase-02-evidence-feasibility-review`
**Decision owner:** Tinlance Limited
**Disposition:** Evidence inventory, standards/competitive research and isolated A1–A2 feasibility spikes completed. PR #30 adds Chromium MV3 popup/runtime and service-worker restart evidence plus Safari Xcode packaging. PR #32 proves Chromium keyboard-shortcut user-invoked `activeTab` access. PR #34 (`3a5fffdd919c86d354614cc077532d88a9f2db3f`) adds Firefox MV3 keyboard-shortcut runtime evidence against a loopback fixture; PR #36 compiles and inspects the Safari macOS app and `.appex`; PR #38 (`807ac4ff73868422ab40d1db5dadff5dfc815002`) adds independent Edge Stable, Brave Stable and Opera Stable runtime checks. PR #40 (`3496b8489561250e3f473f11ca8146ca12d29d97`) adds a two-session PostgreSQL 16 concurrent worker-claim test running as `tinlance_app_runtime`. PR #42 (`39c17f75aa9c533d5752fb6df97d589bad2c5d18`) adds tenant-bound outbox publisher claim/acknowledgement functions with expiry/reclaim, fencing and cross-tenant negative tests. PR #44 (`0706c8d82f3d6a3130e141f8c567b356906ce629`) adds a PostgreSQL-backed HTTP repository adapter and real PostgreSQL 16 API integration proof. PR #38 exact-head Repository Quality and A1–A2 workflows passed, including all three derived-browser jobs and Safari Xcode compile/package inspection. Post-merge main Repository Quality, A1–A2 and lockfile proposal workflows passed on the PR #38 merge commit. Phase 02 remains open; A1 passed, A2 remains partial (Safari runtime enablement/execution, signing/notarization and store validation remain open), and A3 remains partial pending production OIDC/credential provisioning, application multi-process worker execution, process crash/restart, external outbox delivery/consumer idempotency, cancellation and operational recovery evidence. Database-level overlapping claim contention is now verified by PR #40. A4–A7 remain open. This document is a feasibility and evidence review, not implementation authorization.

## 1. Executive result

This milestone reconciles the accepted architecture decisions against the actual repository, checks the current public technical standards that materially affect the design, and records exactly which evidence exists and which does not.

**The architecture baseline is accepted. The architecture is not yet proven feasible by executable spikes. Phase 02 is not closed. No application implementation or paid infrastructure work is authorized by this review.**

At the initial review baseline the repository contained governance/documentation, a Python repository validator, one Python test module and a read-only quality workflow. Follow-up PR #20 added a strictly isolated spike under `spikes/architecture-feasibility/a1-a2/`, with its own pnpm workspace, lockfile, Turbo config, minimal Next.js App Router build and two WXT extension build cases. It did not add a production workspace or product implementation. The original Python workflow still validates repository contracts only; the dedicated A1–A2 workflow supplies separate executable evidence.

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

### 3.1 Competitive and platform-policy desk research (2026-11-05)

This is public-source desk research, not customer validation, a legal opinion, a vendor approval or a performance benchmark. Vendor capability statements are attributed to the vendor and must be independently tested before they become product claims.

| Priority product | Public alternatives / evidence | Competitive implication | Phase 02 consequence |
|---|---|---|---|
| EXT-01 Site Security Auditor | MDN HTTP Observatory and SecurityHeaders provide public security-header checks and grades. MDN explicitly warns that a high grade does not establish that a site is secure and lists major vulnerability classes it does not test. | Basic header/TLS posture scanning is already commoditized. A scorecard alone is not differentiation. | Focus on reproducible evidence, confidence, scope limits, safe passive checks and remediation context; distinguish observable configuration from exploitability. Do not claim a comprehensive security audit. |
| EXT-09 Tinlyt Page Extractor | Firecrawl offers scrape, crawl, map, search, interactive browser actions and monitoring; its public pricing is credit-based and varies by operation and browser time. | Generic URL-to-Markdown extraction is a crowded API category with usage-based cost. A provider dependency could dominate unit economics. | Differentiate through user-selected extraction, source provenance, stable structured output, evidence preservation and integration with Tinlyt Verify/Research. Benchmark extraction quality and per-successful-result cost; keep provider choice open pending terms and cost review. |
| EXT-02 Aithyrex Guard | Nightfall markets browser/endpoint/SaaS AI data-loss controls, prompt/upload inspection, policy and agent/MCP coverage. Harmonic markets browser-based GenAI controls, identity/account context, embedded AI discovery and managed deployment. | Enterprise AI DLP is an established, well-funded category. A browser-only extension cannot credibly claim broad enterprise DLP or endpoint coverage. | Position the initial scope as a transparent, local-first guard for explicitly supported browser AI paths. Validate browser-managed deployment, false-positive burden, local detector quality and buyer demand. Preserve explicit unsupported-path disclosures; do not claim universal AI coverage or EDR/DLP replacement. |
| EXT-10 Tinlyt Verify | ClaimBuster exposes claim-worthiness scoring and fact-check matching APIs; Factiverse markets claim detection and evidence assessment against customer-selected trusted sources across multiple languages. | Claim spotting and evidence retrieval already exist as specialist products and research systems. Automated verdicts remain difficult and domain-dependent. | Differentiate with claim decomposition, source lineage, supporting and conflicting evidence, freshness, uncertainty and analyst workflow integration. Never convert model score or absence of a fact-check into a true/false verdict. |
| EXT-11 Tinlyt Monitor | Visualping supports visual/text/code and selected-element monitoring; Distill provides local browser/app and cloud monitors; Hexowatch markets content, visual, technology, price and WHOIS monitoring. | General page-change alerting is highly commoditized; consumer pricing and feature overlap are extensive. | Validate a higher-value segment where provenance, structured field changes, audit history, source reliability, alert precision and cross-product evidence matter. Measure false-alert rate and total cost per monitored source. |
| EXT-13 FadeReach Prospect Capture | Apollo and Clay offer established sales intelligence/enrichment workflows. Apollo publishes seat/credit plans; Clay separates workflow actions from data credits and aggregates data providers. Apollo's terms restrict automated scraping, API resale/third-party access and use of its API with LinkedIn automation. LinkedIn's User Agreement and help pages prohibit unauthorized scraping, copying and third-party automation/extensions. | Prospect capture is not a defensible standalone moat; data access, quality, freshness, rights, CRM workflow and provider economics are the hard parts. Platform policy is a first-order constraint. | Start with user-provided records, company-owned/public sources where permitted, CRM-authorized data and licensed provider APIs. Do not scrape LinkedIn profiles, automate LinkedIn activity, bypass controls, resell provider API access or expose Apollo API access to third parties. Require source-specific rights, regional lawful-basis, suppression/deletion and contract review before EXT-15 ContactIntel. |
| EXT-17 Agent Browser Bridge | Browserbase markets managed browser sessions, search/fetch and observability for agents. Its own material emphasizes isolation, browser infrastructure and session operations. | Managed remote browser infrastructure is a direct adjacent category; browser automation alone is not differentiation. | Differentiate around the user-controlled paired browser, origin/tab/frame scoping, explicit approvals, cancellation/revocation and Tinlance Agent Platform authority. No anti-bot evasion, CAPTCHA bypass, credential-wall circumvention or hidden automation. Validate the actual Agent Platform contract before consequential actions. |

#### Platform-policy implications

1. **Chrome Web Store single-purpose and data-use rules:** each extension needs a narrow, clearly disclosed primary purpose. Permissions must be the narrowest needed; user data must be limited to the disclosed purpose, with accurate privacy policy and affirmative informed consent where required. The Store prohibits duplicate experiences across a developer's related extensions and requires user confirmation for messages sent on the user's behalf. This reinforces the 26-product single-purpose architecture; it is not a guarantee of store acceptance.
2. **Manifest V3:** executable logic must be packaged and reviewable. Remote data/configuration may be fetched within policy, but remote executable JavaScript or complex remote command interpreters are not a viable extension update mechanism.
3. **LinkedIn:** current User Agreement and automated-activity guidance prohibit scraping/copying profiles and data, unauthorized bots, and browser extensions that scrape, modify or automate the LinkedIn site. FadeReach requirements must explicitly exclude those behaviours.
4. **Apollo:** current terms grant a restricted internal-business-use licence, prohibit automated scraping except where expressly included or approved, prohibit API use with LinkedIn automations, prohibit API resale/sublicensing/third-party access and restrict third-party use of Apollo data for AI/ML training. The terms also place legal-use responsibility on the customer and disclaim accuracy/completeness/currency guarantees. Do not treat a paid Apollo account as a blanket data redistribution licence.
5. **Vendor pricing is not a Tinlance cost model:** observed public plans are dynamic and use materially different units (seat, credit, action, page, browser-minute, check). Do not use a competitor's entry price as Tinlance's gross-margin assumption. Model cost per successful, usable output and include retries, failed fetches, enrichment no-matches, browser time, data licensing, storage, support and payment fees.

#### Desk-research conclusions

- The first-seven order is still a programme constraint, not a validated market ranking. Desk research does not justify reordering it.
- EXT-01, EXT-09 and EXT-11 have strong commodity pressure; their MVPs need a narrower buyer/job and an evidence-based workflow advantage.
- EXT-02 has credible enterprise competition and must be validated as a constrained browser control rather than universal enterprise DLP.
- EXT-10 should sell analyst efficiency and evidence traceability, not a claim that an LLM can determine truth reliably.
- EXT-13 is gated primarily by lawful source supply, data quality and provider economics; LinkedIn scraping/automation is explicitly excluded.
- EXT-17 requires a trust/authority differentiation and a real Agent Platform contract; general browser automation is already supplied by specialist vendors.

This research closes only part of the competitive desk-research gap. It does not replace buyer interviews, provider contracting, counsel review or paid-pilot evidence.

### Phase 02 evidence packet requirements

For each interview, record a participant code (not identity), segment, role, consent, recent workflow, frequency, impact, current workaround/spend, buyer/budget path, disconfirming evidence, constraints, evidence strength and next action. Do not store customer secrets, raw private prompts, unnecessary personal data or confidential source records in the repository.

For each product approval, record product ID, version of brief, owner, reviewer, decision (accept/change/reject), permission/data review, acceptance-test owner, date, unresolved exceptions and evidence link. Silence is not approval.

## 4. Architecture feasibility gate results

| Gate | Required proof | Result | Finding / blocker |
|---|---|---|---|
| A0 — Owner acceptance | Owner decision for ADRs 0003–0014 | **Pass — documentary** | Explicit approval recorded in all twelve ADRs and merged by PR #17 |
| A1 — Toolchain spike | Fresh checkout, frozen lockfile install, lint/typecheck/test/build, Next.js App Router build and representative extension builds | **Pass — isolated feasibility spike** | CI on PR #20 and main completed clean install, lint, typecheck, Next.js build, Chrome/Firefox WXT builds and manifest tests; exact pnpm lockfile is committed with this follow-up. This is not a production workspace |
| A2 — Browser spike | WXT builds, least-privilege manifest tests and runtime compatibility for Chromium/Firefox; Safari packaging proof | **Partial — Chromium and Firefox runtime evidence plus Safari packaging validation added** | Chrome MV3 popup/runtime, service-worker termination/restart and user-invoked `activeTab`/`scripting` keyboard action are tested. PR #34 installs the Firefox MV3 extension into a temporary profile, reads its profile UUID, opens its popup through privileged browser-chrome setup, invokes the registered keyboard shortcut with X11 against a loopback fixture, and verifies the returned title/origin. The macOS lane generates an Xcode project and validates its targets/schemes with `xcodebuild -list`. PR #38 adds successful Edge Stable, Brave Stable and Opera Stable runtime jobs using their installed executables, Playwright headed sessions and the same least-privilege loopback fixture. PR #36 compiles and inspects the Safari macOS app and embedded `.appex`, validates Info.plists and the effective MV2 manifest, and retains the Xcode project artifact. Still open: Safari runtime enablement/execution, Developer ID signing, notarization, App Store Connect submission/review and version-specific distribution validation |
| A3 — Backend/API spike | OpenAPI/API schema, auth seam, tenant isolation, migration and worker recovery proof | **Partial — API contract, PostgreSQL tenancy/outbox/worker lease evidence and HTTP-to-PostgreSQL adapter merged** | `spikes/architecture-feasibility/a3-backend-api/` provides deny-by-default injected bearer verification, server-resolved tenant context, OpenAPI 3.1 fixture, HTTP negative tests, a PostgreSQL-backed repository adapter using transaction-local `tinlance_app_runtime` and tenant context, parameterized reads, and a PostgreSQL 16 HTTP integration test proving tenant isolation and pooled-session reset. PostgreSQL 16 forced-RLS, tenant-scoped idempotency, transactional-outbox rollback, worker lease recovery/fencing and two-session concurrent claims remain covered by CI. PR #44 exact-head and post-merge Repository Quality, A3 API and PostgreSQL workflows all passed. The adapter remains an isolated feasibility component: production OIDC/JWKS and token lifecycle, dedicated least-privilege login-role provisioning, application multi-process worker lifecycle/crash recovery, external outbox delivery/consumer idempotency, cancellation, per-tenant budgets/concurrency, backup/restore, retention/deletion and operational SLOs remain absent |
| A4 — Data/security review | Data-flow diagrams, D0–D3 inventory, product threat models, retention/deletion and audit/secret boundaries | **Partial** | Classification and generic controls exist; product-level flows, reviewed threat models, deletion tests, telemetry redaction tests and processor reviews do not |
| A5 — MCP Gate 0 | Exact protocol fixtures, required headers, auth, tool contracts, negative tests and client matrix | **Research-supported; executable proof blocked** | 2026-07-28 protocol details were checked against current MCP materials; no pinned SDK, fixture suite, server, OAuth integration, tool schemas or real-client matrix exists |
| A6 — Agent Platform contract | Typed authorization/approval/audit contract and negative no-bypass tests | **Blocked — external contract absent** | No Agent Platform schema/SDK/API contract or test fixture is present in this repository; approval authority cannot be simulated or reimplemented here |
| A7 — Cost/deployment approval | Provider, region/residency, cost ceiling, backup/restore and rollback plan | **Blocked — decision not made** | ADRs deliberately defer vendor selection; no deployment/provider/budget approval exists. No paid resource is authorized |

**A1 passed; A2 remains partial; A3 is partial; A4–A7 remain open.** PR #30 adds Chromium MV3 popup/runtime, service-worker restart and Safari Xcode packaging/project-validation evidence. PR #32 proves Chromium `activeTab`/`scripting` access after a real keyboard-shortcut invocation. PR #34 proves the corresponding Firefox MV3 keyboard-shortcut runtime path; its exact-head Repository Quality and A1–A2 workflows passed, including the macOS Safari Xcode packaging lane. PR #38 now supplies successful Edge Stable, Brave Stable and Opera Stable runtime evidence, and PR #36 supplies Safari Xcode app/extension compile and package inspection. Safari runtime enablement/execution, signing/notarization/distribution and store review remain unproved. PR #28 closes the specific isolated PostgreSQL worker lease/recovery and stale-worker fencing test gap; it does not close A3 as a whole or establish production readiness. A5 research reduces uncertainty but does not satisfy executable conformance criteria. The A3 spike is deliberately isolated and is not production implementation.

## 5. Current technical findings and required design constraints

### 5.1 Toolchain and frontend

The accepted ADR baseline is TypeScript, pnpm workspaces and Turborepo; Next.js App Router is the web application choice. These remain approved choices subject to a fresh-checkout spike. No version pins should be invented in this report. A1 must pin compatible Node.js, pnpm, Next.js, WXT, TypeScript and task-runner versions in a lockfile and prove the full graph from a clean checkout.

For Next.js self-hosting, current official guidance recommends a reverse proxy in front of the Node.js server to handle malformed/slow requests, payload limits and rate limiting. Streaming also requires the complete proxy/load-balancer path to preserve streaming and avoid buffering. This is an architecture constraint, not a hosting decision.

### 5.2 Browser framework and security

WXT's current publishing guide lists Chrome, Firefox and Edge workflows. It explicitly states Safari publishing is not automated; Safari requires a macOS/iOS native app wrapper and Xcode packaging. Safari must therefore remain a separately tested and signed lane. Brave and Opera must be separately verified rather than inferred from Chromium lineage.

Chrome Manifest V3 guidance requires packaged executable code rather than remotely hosted executable JavaScript, and its extension service workers are event-driven/lifecycle-bounded. State must be persisted; listeners registered synchronously; timers and DOM-dependent work must use supported extension mechanisms. PR #30 now proves termination and event-driven restart for the isolated read-only Chromium MV3 fixture. PR #32 tests permission-sensitive user invocation in Chromium; PR #34 adds the equivalent Firefox MV3 keyboard-shortcut runtime proof. The remaining A2 work must test Safari runtime enablement/execution, signing/notarization and browser-version coverage, while preserving least-privilege manifests and package inspection.

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
| A1 — toolchain | Passed by isolated reproducible spike; not production workspace |
| A2 — browser | Partial: Chrome/Firefox MV3 builds and least-privilege manifests pass; Chromium popup, service-worker lifecycle and keyboard-shortcut `activeTab`/`scripting` runtime pass; Firefox keyboard-shortcut `activeTab`/`scripting` runtime, Edge/Brave/Opera headed runtime and Safari Xcode packaging/project validation pass; Safari runtime enablement/execution, signing/notarization and store validation remain open |
| A3 — backend/API | Partial; API contract, PostgreSQL 16 migration/RLS/idempotency/outbox/worker checks and HTTP-to-PostgreSQL adapter proof merged; production identity/credentials, application worker lifecycle and external outbox delivery remain open |
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
| 5 | Preserve A1 as a pinned isolated feasibility fixture; do not promote it into production without Phase 02 go/no-go | Engineering owner | Committed lockfile, frozen-install workflow and passing CI |
| 6 | Complete Safari runtime enablement/execution, signing/notarization/store validation; preserve Chromium/Firefox permission-sensitive runtime proofs (#32/#34), Edge/Brave/Opera runtime matrix (#38), and Safari Xcode compile/package inspection (#36) | Engineering owner | Safari runtime test record, signing/notarization/distribution plan and browser/version matrix |
| 7 | Run A3 API/tenant/migration/worker spike only after the identity and data contracts are reviewed | Backend owner | OpenAPI/schema, PostgreSQL RLS and transactional-outbox evidence, plus worker recovery evidence still outstanding |
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
10. MDN HTTP Observatory FAQ and scope limitations: https://developer.mozilla.org/en-US/observatory/docs/faq
11. SecurityHeaders FAQ and grade meaning: https://api.securityheaders.com/faq
12. Firecrawl product and pricing: https://www.firecrawl.dev/scrape and https://www.firecrawl.dev/pricing
13. Nightfall AI data security platform: https://www.nightfall.ai/platform
14. Harmonic browser-based GenAI security: https://www.harmonic.security/solutions/browser-based-genai-security
15. ClaimBuster project and API: https://claimbuster.org/ and https://idir.claimbuster.org/api/
16. Factiverse text verification solution: https://www.factiverse.ai/solutions/text
17. Visualping monitoring capabilities: https://help.visualping.io/en/articles/4438913
18. Distill monitoring and pricing: https://distill.io/docs/web-monitor/what-is-distill/ and https://distill.io/pricing/
19. Hexowatch monitoring and pricing: https://hexowatch.com/ and https://hexowatch.com/pricing
20. Apollo pricing and current Terms of Service: https://www.apollo.io/pricing and https://www.apollo.io/terms
21. Clay pricing and usage model: https://www.clay.com/pricing and https://university.clay.com/docs/actions-data-credits
22. LinkedIn User Agreement: https://www.linkedin.com/legal/user-agreement
23. LinkedIn automated activity policy: https://www.linkedin.com/help/linkedin/answer/a1340567/automated-activity-on-linkedin
24. Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies/
25. Chrome Web Store Manifest V3 requirements: https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
26. Browserbase browser infrastructure overview: https://dev.browserbase.com/
27. Node.js official release schedule: https://github.com/nodejs/Release
28. pnpm installation and platform support: https://pnpm.io/installation
29. Turborepo release history: https://github.com/vercel/turborepo/releases
30. Next.js support policy: https://nextjs.org/support-policy
31. WXT browser targeting guide: https://wxt.dev/guide/essentials/target-different-browsers
32. WXT publishing and Safari packaging guide: https://wxt.dev/guide/essentials/publishing

## 9. Approval and non-authorization

This report records research findings and repository evidence. It does not approve customer assumptions, legal interpretations, a provider, data residency, deployment spend, Agent Platform contracts, product implementation or public release. A gate may be changed to Pass only by attaching the required evidence and recording its reviewer. The implementation gate remains closed.


## 9. Post-PR #38 verification record

- Current main at this review baseline: `0706c8d82f3d6a3130e141f8c567b356906ce629`.
- PR #38 exact-head Repository Quality: [42373753116](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753116) — success.
- PR #38 exact-head A1–A2: [42373753119](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373753119) — success; Chromium, Firefox, Edge Stable, Brave Stable, Opera Stable and Safari Xcode compile/package jobs passed.
- Post-merge main Repository Quality: [42373989212](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373989212) — success.
- Post-merge main A1–A2: [42373989175](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42373989175) — success.
- Lockfile proposal workflow: [42374180891](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374180891) — success.

These checks validate isolated feasibility fixtures, not the 26 production products or Safari runtime distribution.


## 10. PR #40 concurrent-claim evidence

PR #40 adds a two-session PostgreSQL integration test. Each independent `psql` session assumes `tinlance_app_runtime`, binds transaction-local tenant context, claims a job and holds its transaction open. The test asserts that the sessions receive different job IDs and that no queued job remains claimable. Exact-head Repository Quality [42374813474](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813474), A3 API [42374813448](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813448), and PostgreSQL [42374813492](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374813492) passed; post-merge main runs [42374868455](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868455), [42374868482](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868482), and [42374868429](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42374868429) passed. This is database concurrency proof only. It does not demonstrate an independently running worker process, worker shutdown/restart or publisher delivery. PR #44 separately proves the isolated HTTP API can read through a PostgreSQL adapter; it does not demonstrate a deployed production API or worker service.


## 11. PR #42 outbox publisher evidence

PR #42 adds a database-side transactional outbox publisher contract. The migration adds bounded tenant-scoped claims using `FOR UPDATE SKIP LOCKED`, lease expiry/reclaim and fencing tokens, plus an acknowledgement function that requires the current tenant, current lease token and unexpired lease. PostgreSQL tests prove missing tenant context fails closed, expired leases are reclaimed with a new token, stale tokens cannot publish, valid tokens can acknowledge, and a tenant cannot acknowledge another tenant's event even with its correct ID/token. Exact-head Repository Quality [42375210266](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210266), A3 API [42375210272](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210272), and PostgreSQL [42375210240](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375210240) passed; post-merge main Repository Quality [42375274540](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274540), A3 API [42375274532](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274532), and PostgreSQL [42375274541](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42375274541) passed. This is not an external publisher/delivery loop, consumer idempotency or production worker service.


## 12. PR #44 PostgreSQL-backed HTTP adapter evidence

PR #44 merged as `0706c8d82f3d6a3130e141f8c567b356906ce629`. The new repository adapter runs tenant-owned reads in an explicit transaction, applies `SET LOCAL ROLE tinlance_app_runtime`, sets the verified tenant ID with transaction-local `set_config`, performs parameterized SQL, and commits or rolls back before releasing the pooled client. If rollback itself fails, the adapter passes that error to the PostgreSQL pool's release method so the connection is discarded. The PostgreSQL 16 integration test drives the actual HTTP server through this adapter, checks own-tenant success, cross-tenant 404, readiness, and session-context reset on a single-connection pool. Unit tests cover invalid tenant identifiers and connection disposal after rollback failure.

Exact-head Repository Quality [42376883210](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883210), A3 API [42376883208](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883208), and PostgreSQL [42376883253](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376883253) passed. Post-merge main Repository Quality [42376948442](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948442), A3 API [42376948519](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948519), and PostgreSQL [42376948399](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42376948399) passed. This is feasibility evidence, not a production deployment or authorization approval.


## 13. Updated A3 evidence checkpoint — PRs #46–#52

**This section supersedes earlier A3 descriptions in this review where they list worker process lifecycle, publisher delivery runtime, cancellation, OIDC/JWKS verification or least-privilege login as wholly unimplemented.**

Current main checkpoint: 301c54b4422e452d87384d612a1f901f2c8c7da2 after PR #52.

A3 feasibility now includes: PR #46 tenant-scoped Node worker runtime with PostgreSQL child-process crash/restart, concurrent-claim and lease-heartbeat tests; PR #47 outbox publisher runtime with bounded retry/dead-letter, heartbeat and crash-after-delivery recovery against a deduplicating test receiver; PR #48 tenant-bound cancellation and worker AbortSignal handling; PR #49 strict RS256 OIDC/JWKS bearer verification; PR #50 dedicated non-superuser tinlance_app_login role used by API, worker and publisher integration tests; PR #51 fail-fast environment-driven OIDC API composition; and PR #52 tenant-scoped POST /v1/jobs/{jobId}/cancel wired through the PostgreSQL adapter.

PR #52 exact-head Repository Quality (42392078298), A3 API (42392078129) and PostgreSQL 16 (42392078261) passed on ab5238eff808dd0f45eb973479967f5a86053af8. Post-merge A3 API (42392194443) and PostgreSQL 16 (42392194429) passed on merge commit 301c54b4422e452d87384d612a1f901f2c8c7da2.

A3 remains partial and is not a production backend. Remaining gaps: approved provider-specific issuer/tenant-claim onboarding and token lifecycle; managed production secret/database credential provisioning and rotation plus TLS/connection management; real external provider transport adapters; durable receiver-side inbox/idempotency and operational dead-letter tooling; actual Tinlance Agent Platform authorization/approval integration (the cancellation callback defaults to deny-all); cancellation audit integration; migration rollback; backup/restore and recovery objectives; production deployment/supervision; observability, alerting and SLO evidence; retention/deletion; legal/privacy review and independent security review.

Phase 02 remains open for genuine customer interviews, product-owner sign-offs, commercial evidence and legal/provider review. A2 remains partial for Safari runtime enablement/execution, signing, notarization and store review. A4–A7 remain open. Phases 4–25 remain gated as production implementation. No production implementation authorization or paid infrastructure approval is inferred.


## 14. A3 backup/restore evidence — PR #54

Current main checkpoint: b738cb43dbaec3a65344e0a9376d8ed37703ac83 after PR #54.

PR #54 adds a PostgreSQL 16 custom-format logical backup/restore CI exercise. The verifier seeds a tenant-owned row, creates and inspects a pg_dump custom archive, restores it into a fresh template0 database, verifies restored tenant data, worker/outbox/cancellation functions and forced RLS on tenant tables, then connects through tinlance_app_login and confirms transaction-local tenant context still exposes only the tenant's row. The test cleans up the restored database and source fixture.

Exact-head checks passed on b4a082fb4b814e365a1681d264b9207bf21173ab: Repository Quality 42392579775, A3 API 42392579816 and PostgreSQL 16 42392579765. Post-merge checks passed on b738cb43dbaec3a65344e0a9376d8ed37703ac83: Repository Quality 42392712741, A3 API 42392712726 and PostgreSQL 16 42392712972.

This is single-database logical restore proof within the same ephemeral PostgreSQL cluster. pg_dump does not include cluster-global roles or tablespaces; the test roles already exist in the cluster. The test does not prove cross-region recovery, PITR, backup encryption/key management, retention, production RPO/RTO, managed backup operations or a production restore runbook.

A3 remains partial and is not a production backend. Remaining gaps include approved live identity-provider onboarding and tenant-claim mapping, token lifecycle, managed credential provisioning/rotation and TLS/connection management, provider-specific external delivery, durable consumer inbox/idempotency and dead-letter operations, Agent Platform authorization/approval integration, cancellation audit, migration rollback, production deployment/supervision, observability/SLOs, retention/deletion and legal/privacy/independent security review. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.


## 15. Durable consumer inbox evidence — PR #57

Current main checkpoint: 94b43b7a0928d87417ccd651bb62062b6315ad1c after PR #57.

PR #57 adds migration 008, a durable tenant-scoped consumer inbox keyed by (tenant_id, consumer_name, event_id), forced RLS, bounded JSON payloads, and a security-definer acceptance function that derives tenant identity only from transaction-local app.tenant_id. First acceptance returns true; same-key/same-payload redelivery returns false; same-key/different-payload redelivery fails. Concurrent duplicate delivery, rollback, tenant/consumer isolation, missing tenant context, invalid consumer names, payload limits and pooled-session reset are exercised in PostgreSQL 16 integration tests.

The outbox process test receiver now writes the inbox receipt and its local database effect in the same transaction. Crash-after-delivery recovery proves that the publisher can retry after the receiver committed but before the publisher acknowledged, without repeating the local database effect. This is at-most-once local database effect under the shared-transaction condition, not exactly-once delivery across external systems. External provider side effects still require provider idempotency keys or explicit duplicate-side-effect acceptance.

PR #57 exact-head Repository Quality (42393553306), A3 API (42393553255) and PostgreSQL 16 (42393553292) passed on bc5c9110bbda3d469b0a1335b6f672fd214d92b6. Post-merge Repository Quality (42393663373), A3 API (42393663375) and PostgreSQL 16 (42393663463) passed on merge commit 94b43b7a0928d87417ccd651bb62062b6315ad1c.

A3 remains partial and is not a production backend. Remaining gaps include approved live identity-provider onboarding and tenant-claim mapping, token lifecycle, managed credential provisioning/rotation and TLS/connection management, provider-specific external delivery and idempotency, operational dead-letter tooling, Agent Platform authorization/approval integration and cancellation audit, migration rollback, production backup/restore operations and runbook, deployment/supervision, observability/SLOs, retention/deletion and legal/privacy/independent security review. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.


## 16. Dead-letter replay feasibility evidence — PR #59

Current main checkpoint: d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1 after PR #59.

PR #59 adds migration 009 with a tenant-scoped dead-letter replay counter and append-only outbox replay audit. The database function locks only a currently dead-lettered, unpublished event belonging to the transaction-local tenant, requeues it, resets attempts/lease/failure state, increments replay_count and records actor subject, request ID, prior attempts, prior error code and prior dead-letter timestamp atomically. The HTTP POST /v1/outbox/dead-letters/{eventId}/replay route is authenticated and its authorization callback defaults to deny-all; it is forwarded through the OIDC composition root. The API rejects request bodies on operational action routes and returns non-enumerating 404 responses for missing, cross-tenant or no-longer-dead-lettered events.

Exact-head checks passed on 30f0b56f1df319d84f71daae904020370b05fe4b: Repository Quality 42394553985, A3 API 42394553843 and PostgreSQL 16 42394553804. Post-merge checks passed on d3c3cc37aee68c4f6bfcb6c9329a19e8a249b9c1: Repository Quality 42394665035, A3 API 42394665046 and PostgreSQL 16 42394665064.

The replay route and audit contract are not a production operator workflow: the real Tinlance Agent Platform authorization/approval contract is not integrated, the policy remains deny-all unless explicitly injected, and no operator UI is deployed. Provider-specific delivery, managed identity/secret lifecycle, production deployment, operational dead-letter supervision, SLOs, migration rollback, production backup/restore operations, retention/deletion and independent legal/privacy/security review remain open. Phase 02 customer/owner/commercial/legal evidence remains open; A2 Safari runtime/distribution remains partial; A4–A7 remain open; production implementation remains gated.



## 17. Job-cancellation audit feasibility — PR #61

Current main checkpoint: d79e4a25a9b29ed02766e3081c187aa72f2c6e3b after PR #61.

PR #61 adds migration 010: a forced-RLS tenant-scoped `job_cancellation_audit` table and `cancel_job_audited` database function. A successful first cancellation atomically transitions the job, clears its worker lease, and records the verified actor subject, server-generated request ID, prior status and timestamp. Repeated cancellation remains idempotent without duplicate audit rows. The legacy unaudited `cancel_job` function is revoked from the runtime role. The HTTP API forwards the verified principal subject and request ID through the PostgreSQL adapter. PostgreSQL integration tests verify tenant isolation, audit contents, RLS visibility, worker cancellation behavior, and backup/restore coverage.

The PR also updates worker-process integration tests to exercise the audited cancellation contract instead of calling the now-revoked legacy function. This preserves least-privilege behavior while proving queued and running-job cancellation and audit persistence.

Exact-head checks passed on `65a39c4d4e34e93bc23f75c43744038eca7495df`: Repository Quality [run 42434981883](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42434981883), A3 API [run 42434981862](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42434981862), and PostgreSQL 16 [run 42434981863](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42434981863). PR #61 merged as `d79e4a25a9b29ed02766e3081c187aa72f2c6e3b`. Post-merge main checks passed: Repository Quality [run 42435066745](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435066745), A3 API [run 42435066688](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435066688), and PostgreSQL 16 [run 42435066651](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435066651).

This closes the **database/API cancellation audit feasibility slice**, not the production cancellation workflow. Both cancellation and dead-letter replay authorization callbacks still default to deny-all; the real Tinlance Agent Platform authorization/approval contract and audit integration are not wired. Production identity-provider onboarding and claim mapping, token lifecycle, managed secret/credential rotation, provider-specific external delivery and idempotency, operator UI, migration rollback, production backup/PITR and restore runbook, deployment/supervision, observability/SLOs, retention/deletion, and independent legal/privacy/security review remain open. Phase 02 customer/product-owner/commercial/legal evidence remains outstanding; A2 Safari runtime/distribution remains partial; A4–A7 remain open. No production implementation authorization or infrastructure spend is inferred.


## Agent Platform cancellation integration — PR #63 and Platform PR #193

Current Extensions main checkpoint: `7f74412399fedda54da9da2e60a883f50994b3a0`.

The A6 job-cancellation path now has both the receiving and issuing sides implemented:

- Extensions PR #63 adds a separate Platform issuer/audience/JWKS/client trust configuration. The API accepts delegated action authority only when the signed token has the configured Platform issuer, exact client ID, validated service-token claims, and the action-specific scope. Cancellation requires `extensions:jobs:cancel`; dead-letter replay requires the separate `extensions:outbox:replay` scope. Ordinary user tokens cannot self-assign these authorities. Signed Platform request IDs are used for audit correlation. PR #63 merged as `f9c156e51d5ee69400dd34b7df8aea60497e555c`.
- Agent Platform PR #193 adds the `extensions.jobs.cancel` capability, MCP gateway registration, tenant/subject/request/trace-bound transport, short-lived KMS-signed token issuance for audience `tinlance-extensions-api`, and a Platform API operation handler. It never forwards the inbound bearer token. Platform main merged as `351848b3241ec6768a3fd07ee32d3d44cec41ac3`.

Extensions PR #63 exact-head checks passed: Repository Quality [42435748336](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435748336), A3 API [42435748308](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435748308), PostgreSQL [42435748164](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435748164). Post-merge main checks passed: Repository Quality [42435821841](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435821841), A3 API [42435821888](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435821888), PostgreSQL [42435821869](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42435821869).

Platform PR #193 exact-head CI, R10 certification, reference-agent, CodeQL and secret-scan checks passed on `023b0e06a4e3716be97c16b0f79020e8d0eb1859`; post-merge CI, R10, reference-agent, CodeQL, secret-scan and supply-chain attestation passed on `351848b3241ec6768a3fd07ee32d3d44cec41ac3`.

**This is a code-level integration, not a live production connection.** Deployment still needs a real Platform KMS asymmetric signing key, issuer/client ID, published HTTPS JWKS endpoint, Extensions API base URL, and matching `PLATFORM_OIDC_ISSUER`, `PLATFORM_OIDC_AUDIENCE`, `PLATFORM_OIDC_JWKS_URI`, and `PLATFORM_OIDC_CLIENT_ID` configuration. At that earlier checkpoint, Platform-side registration covered job cancellation only; this limitation is superseded by Agent Platform PR #195, recorded below. Production deployment, provider identity mapping, secret rotation, and live end-to-end proof remain open.

The earlier A3 database-side cancellation audit evidence remains valid. This update does not close A3, Phase 02, A2 Safari runtime/distribution, A4–A7, or any customer/product-owner/legal/commercial approval gate.


## OIDC integer environment validation regression — PR #65

PR #65 merged to `main` as `9715a0c0541b9244124e11228057d60bf7c9e2fa`. A test-first regression check demonstrated that valid decimal integer values for OIDC and Platform OIDC cache TTL, token lifetime, clock tolerance, JWKS timeout and refresh interval were rejected by the environment parser. The defect was an over-escaped digit matcher that matched a literal backslash-plus-`d`, rather than decimal digits. The parser now accepts decimal integer strings while preserving rejection of malformed values.

The regression test was committed first and the A3 API workflow failed as expected on the test-only head `faa35d9dbe3cb7a2bea3e1f0fd09544c0c6fa85a` (A3 API run 42456390501). After the implementation fix, exact-head checks passed on `4b3ec256e2980b08806786430ab21a8e7976b939`: Repository Quality [42456413690](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413690), A3 API [42456413743](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413743), and PostgreSQL 16 [42456413585](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456413585). Post-merge checks passed on `9715a0c0541b9244124e11228057d60bf7c9e2fa`: Repository Quality [42456480565](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480565), A3 API [42456480483](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480483), and PostgreSQL 16 [42456480506](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456480506).

This closes the environment integer parsing regression only. It does not close A3 production readiness, production identity-provider onboarding, live KMS/JWKS deployment, secret rotation, provider delivery, operator workflows, migration rollback, production recovery objectives, observability/SLOs, retention/deletion or legal/security review. Phase 02 external evidence gates, A2 Safari runtime/distribution, and A4–A7 remain open as previously recorded.


## Platform approval-bound dead-letter replay — Agent Platform PR #195

The historical A6 integration note above is superseded: Agent Platform PR #195 now adds the issuing-side, high-risk dead-letter replay operation. PR #195 merged to Agent Platform `main` as `a2cd923b7d187de2f0b983a169ea0f03ff96aa94` (PR head `f4ba45893cf0261deff58629ba964a24e28e953d`).

The merged Platform implementation adds:

- MCP tool `extensions_dead_letter_replay`, capability `extensions.outbox.dead_letter.replay`, HIGH risk, explicit approval requirement, and an idempotency argument.
- A tenant-, subject-, request-, run-, event- and idempotency-bound approval fingerprint. The gateway consumes the approved intent before invoking the downstream transport; absent approval verification fails closed.
- MCP tool schema publication and request-ID derivation compatible with the stateless MCP protocol adapter, including reconstruction of the idempotency key that the adapter moves into request metadata.
- A short-lived, audience-bound Platform service token for `tinlance-extensions-api` carrying only `extensions:outbox:replay`. The inbound user bearer token is not forwarded.
- Platform API idempotency guarding for the replay operation. Tests cover approved replay, missing verifier, altered event intent, one-time approval consumption, same-key retry without a second downstream side effect, and MCP request-ID derivation.

Exact-head PR #195 workflows passed on `f4ba45893cf0261deff58629ba964a24e28e953d`: CI [42457556036](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457556036), R10 Certification [42457556104](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457556104), Reference Agents [42457556084](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457556084), CodeQL [42457556048](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457556048), and Secret Scan [42457556050](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457556050). Post-merge Agent Platform `main` checks passed on `a2cd923b7d187de2f0b983a169ea0f03ff96aa94`: CI [42457671532](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671532), R10 [42457671536](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671536), Reference Agents [42457671509](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671509), CodeQL [42457671552](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671552), Secret Scan [42457671510](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671510), and Supply Chain Attestation [42457671530](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42457671530).

**Readiness boundary:** this closes the missing Platform-side replay registration and reference integration tests; it does not prove a live production deployment. The approval verifier is injected and defaults to fail-closed; production must supply a durable, tenant-scoped approval implementation and durable idempotency/permit semantics across replicas. Real KMS key provisioning, issuer/client configuration, HTTPS JWKS publication, matching Extensions OIDC environment configuration, secret rotation, deployment, and live cross-service replay proof remain outstanding. A3 production operations, Phase 02 external evidence gates, A2 Safari runtime/distribution, A4–A7, and customer/legal/commercial approvals remain open.

Current Tinlance Extensions repository checkpoint: `7f74412399fedda54da9da2e60a883f50994b3a0` (PR #66). Repository Quality passed on that exact main commit [42456582929](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42456582929). No open pull requests or issues were present at this checkpoint.


## Current repository checkpoint — 2026-11-08 (PR #69)

This addendum supersedes earlier repository-checkpoint statements in this document where they identify an older `main` commit or describe the state before Agent Platform PR #195 was reconciled.

- **Current Extensions main:** `da3cb0c1e2b5440782082de59e1d260690cf101d` (PR #69 merge).
- **PR #69:** [docs: record Platform-approved dead-letter replay integration](https://github.com/LloydCoder/tinlance-extensions/pull/69), merged 2026-11-08. PR head: `ed006970a035eaeacc8b43145b02293b4c99b740`; merge commit: `da3cb0c1e2b5440782082de59e1d260690cf101d`.
- **Exact-head Repository Quality:** [run 42457864689](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42457864689) passed on PR head `ed006970a035eaeacc8b43145b02293b4c99b740`.
- **Post-merge Repository Quality:** [run 42457905966](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42457905966) passed on `main` commit `da3cb0c1e2b5440782082de59e1d260690cf101d`. PR #69 was documentation-only; A3 API and PostgreSQL workflows were not triggered by that documentation change.
- **Current issue/PR queue:** the GitHub repository search returned zero open pull requests and zero open issues at this audit.
- **Repository governance:** `main` reports `protected: false`; the repository rulesets endpoint returns an empty list. Required-check enforcement is therefore not configured. The connected GitHub integration can read these settings but does not expose the repository-administration mutation needed to create/enforce branch protection.
- **A6 integration evidence:** Agent Platform PR #195 is merged and its exact-head and post-merge checks are recorded in the preceding addendum. This is code-level integration evidence, not live production connectivity. Production KMS/JWKS provisioning, durable approval/idempotency implementations, Extensions OIDC configuration, secret rotation, deployment and live cross-service proof remain open.
- **Programme disposition:** no phase is promoted to complete by this checkpoint. Phase 02 external customer/owner/commercial/legal evidence remains open; A2 Safari runtime/signing/notarization/store review remains partial; A3 remains a feasibility spike rather than a production backend; A4–A7 and production implementation phases remain gated. Customer interviews, owner decisions, legal/provider approvals, production credentials, live infrastructure and budget approval must be supplied or explicitly approved by the accountable human owner; they cannot be inferred from repository CI.

The next engineering work must continue against the accepted 25-phase plan, with the next bounded deliverable selected from the still-open A2/A3/A4–A7 evidence gates. Do not treat this checkpoint or a green documentation workflow as authorization to deploy, incur spend, or release products.


## Current cross-repository checkpoint — 2026-11-08 (PRs #71/#72 and Platform #213)

This addendum supersedes earlier status statements in this document where they describe the pre-integration A3 authorization state or an older `main` commit.

### Verified merged changes

- **Tinlance Extensions main:** `30957ee2e124567bc6a25cb54a67459f6f169fb9`.
- **Extensions PR #71:** [align PostgreSQL audit IDs with Platform MCP](https://github.com/LloydCoder/tinlance-extensions/pull/71), merged as `42d1ce4cfa5295d306ea9bc27645d49c322a146a`. It fixes the cross-service contract mismatch where Platform `mcp-...` request IDs were rejected by UUID-only PostgreSQL audit fields and adapters. It adds migration 011, bounded request-ID validation and real PostgreSQL integration tests for cancellation and replay.
- **Agent Platform main:** `a8ca3730223879d3e08a213930ccd378fc320495`.
- **Agent Platform PR #213:** [bind delegated tokens to exact action resources](https://github.com/LloydCoder/tinlance-agent-platform/pull/213), merged as `a8ca3730223879d3e08a213930ccd378fc320495`. It signs a deterministic `purpose` fingerprint bound to tenant, subject, tool, resource ID and (for replay) idempotency key.
- **Extensions PR #72:** [bind Platform tokens to exact Extensions actions](https://github.com/LloydCoder/tinlance-extensions/pull/72), merged as `30957ee2e124567bc6a25cb54a67459f6f169fb9`. The receiver verifies the signed purpose against the requested job/event and replay idempotency key. Shared Python/JavaScript test vectors prevent canonicalization drift.

### CI evidence

**Extensions PR #71 exact-head checks:** Repository Quality [42505355178](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42505355178), A3 API [42505355149](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42505355149), PostgreSQL [42505354971](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42505354971) — all passed. Post-merge checks on `42d1ce4`: [A3 API 42505465530](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42505465530), [Repository Quality 42505465517](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42505465517), [PostgreSQL 42505465486](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42505465486) — all passed.

**Agent Platform PR #213 exact-head checks:** CI [42506502066](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506502066), CodeQL [42506502065](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506502065), Reference Agents [42506502059](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506502059), Secret Scan [42506502008](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506502008), R10 Certification [42506501975](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506501975) — all passed.

**Extensions PR #72 exact-head checks:** Repository Quality [42506517333](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42506517333), A3 API [42506517392](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42506517392), PostgreSQL [42506517324](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42506517324) — all passed.

**Post-merge checks:** Agent Platform CI [42506677783](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506677783), CodeQL [42506677770](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506677770), Reference Agents [42506677789](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506677789), Supply Chain Attestation [42506677786](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506677786), R10 [42506677773](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506677773), Secret Scan [42506677762](https://github.com/LloydCoder/tinlance-agent-platform/actions/runs/42506677762) — all passed. Extensions post-merge Repository Quality [42506704459](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42506704459), A3 API [42506704472](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42506704472), PostgreSQL [42506704481](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42506704481) — all passed.

### Current queue and remaining gates

- Live GitHub searches returned **zero open PRs and zero open issues** in both `LloydCoder/tinlance-extensions` and `LloydCoder/tinlance-agent-platform`.
- Extensions `main` is still **unprotected** and the repository rulesets endpoint is empty. The connected GitHub integration exposes read-only settings access, not the repository-administration mutation needed to enforce required checks. This remains an operational governance blocker; green CI alone does not protect `main`.
- The A3 Platform token contract is now action-bound at code level. This does **not** prove live KMS/JWKS provisioning, production issuer onboarding, durable approval verification, production API deployment, real provider delivery, operator workflows or live cross-service connectivity.
- A3 remains a feasibility spike. External provider adapters, provider idempotency/duplicate-side-effect guarantees, production retry/backoff/dead-letter operations, durable consumer processing, production secrets/rotation, deployment, and cross-region backup/restore evidence remain open.
- A2 Safari runtime verification, signing/notarization and store/distribution review remain partial.
- Phase 02 still requires accountable owner/customer interviews, product decisions, legal/provider review and commercial validation. A4–A7 and subsequent production implementation/release phases remain gated.
- No phase is promoted to complete by this checkpoint. Do not infer production readiness, deployment approval, budget approval or customer validation from repository CI.

The next work must continue against the accepted 25-phase plan, starting with the remaining A3 production-boundary and A4 privacy/threat-model gates while preserving the distinction between feasibility evidence and deployable product capability.


## A4 data-flow and threat-model baseline — 2026-11-08

The new [Security Data-Flow Inventory and Threat Model](SECURITY-DATA-FLOW-AND-THREAT-MODEL.md) records current A1–A3 data flows, trust boundaries, data classifications, the first-seven product input categories, a STRIDE-oriented threat register, privacy/data-lifecycle controls and explicit A4 acceptance gates.

**Disposition: A4 remains open.** The document is an evidence-backed baseline and gap register, not product-owner approval or a completed privacy assessment. The first-seven product local/cloud paths, lawful bases, processors/transfers, retention periods, export/deletion behaviour, telemetry policy and product-specific residual-risk decisions still require accountable owner and legal/security review. Executable retention/deletion/redaction tests and production data-lifecycle controls are not yet evidenced.


## A5 SDK selection research checkpoint — 2026-11-08

The new [A5 MCP Conformance Plan](A5-MCP-CONFORMANCE-PLAN.md) and updated [ADR 0002](adr/0002-mcp-protocol-baseline.md) select the official TypeScript SDK v2 package line for the accepted 2026-07-28 protocol: `@modelcontextprotocol/server@2.4.0`, `@modelcontextprotocol/client@2.4.0`, `@modelcontextprotocol/core@2.4.0` and `zod@4.2.0`, with exact pins and a committed lockfile required. The legacy monolithic `@modelcontextprotocol/sdk` v1 line is explicitly rejected for this protocol revision.

**Disposition: A5 Gate 0 remains open.** This is SDK selection and conformance planning, not an executable MCP server, OAuth/resource-server implementation, network Host/Origin test, committed dependency lockfile, real-client compatibility result or production gateway authorization. The next A5 deliverable is the isolated SDK v2 conformance spike with negative tests and real-client evidence, followed by explicit Gate 0 architecture approval.
