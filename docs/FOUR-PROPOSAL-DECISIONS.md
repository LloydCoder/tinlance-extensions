# Four Proposal Decisions — Portfolio, Dependencies and Validation Gates

**Decision status:** Approved portfolio direction; validation and implementation gates remain open
**Decision date:** 2026-11-04
**Owner:** Tinlance Limited
**Repository:** `LloydCoder/tinlance-extensions`
**Scope:** Four external proposals assessed for Tinlance Extensions
**Related records:** [Canonical Product Catalogue](PRODUCT-CATALOGUE.md), [Master System Architecture](SYSTEM-ARCHITECTURE.md), [Master Delivery Roadmap](MASTER-ROADMAP.md), [Phase 02 Product Requirements](PHASE-02-PRODUCT-REQUIREMENTS.md)

> This record approves the portfolio disposition and the order in which the opportunities should be validated. It does not authorize product implementation, establish customer demand, approve a production architecture, or claim that any capability exists. No product status changes from this record alone.

## 1. Executive decision

The four proposals do **not** create four new standalone extensions. They are assigned to existing products, shared platform capabilities, or a separately gated discovery track.

| Proposal | Decision | Portfolio treatment | Priority |
|---|---|---|---|
| B2B Sales / Outreach | Incorporate into FadeReach | Unified FadeReach Professional Workspace across EXT-13–EXT-16; no new extension | 1 — first commercial validation |
| Aithyrex Enterprise Guard & Compliance | Elevate existing Aithyrex direction | Enterprise direction for EXT-02 Aithyrex Guard; EXT-03 Auctaryn Guard remains separate | 2 — enterprise validation |
| Browser-Native Sovereign AI & Workflow Orchestrator | Treat as shared infrastructure | Proposed Tinlance Local Execution Runtime (TLER), supporting EXT-17, EXT-18 and eligible product adapters; not a new extension or approved implementation name | 3 — architecture validation |
| Checkout Sentry | Keep separate and discovery-only | Potential future consumer product; no catalogue number and no implementation commitment | 4 — discovery only |

**Portfolio invariant:** the canonical catalogue remains at 26 products. Do not add a product ID, reorder the approved release phases, or imply implementation based on these decisions.

## 2. Decision records

### D-01 — B2B Sales / Outreach becomes the FadeReach Professional Workspace

**Decision.** Consolidate the proposed prospecting, enrichment, personalization and CRM workflow into the existing FadeReach product family. The coherent user journey is:

1. Select a target account or prospect.
2. Capture permitted business-page information with source and timestamp.
3. Resolve and enrich company context.
4. Enrich professional contact information only from permitted, documented sources.
5. Produce an explainable opportunity/context summary.
6. Draft source-grounded outreach for user review.
7. Sync approved records and tasks to an authorized CRM.
8. Track workflow outcomes, time saved and attributable pipeline contribution.

**Product ownership.**
- EXT-13 FadeReach Prospect Capture — user-directed capture and normalization.
- EXT-14 FadeReach CompanyIntel — sourced company profiles and company-level enrichment.
- EXT-15 FadeReach ContactIntel — permitted professional contact intelligence, gated on data rights.
- EXT-16 FadeReach Outreach Assistant — editable, source-aware drafts and follow-up workflow.
- CRM connectivity remains an integration, not a fifth extension.

**Boundaries and non-goals.**
- Start with one ICP: small B2B sales agencies and founder-led B2B companies. Recruiter workflows are a later, separately validated segment.
- Do not build an indiscriminate LinkedIn scraper, automate LinkedIn activity, bypass access controls, or assume browser-visible data is licensed for reuse.
- Use user-provided records, company websites, CRM data, and authorized/licensed providers. LinkedIn-related collection or automation requires specific contractual and policy clearance.
- No autonomous outbound sending by default. A human must approve messages; suppression, opt-out and deletion requirements apply.
- Do not claim revenue, conversion, retention or market statistics from the proposal as validated facts.

**Dependencies.**
- Phase 02 approved briefs and acceptance criteria for EXT-13–EXT-16.
- EXT-13 capture/provenance contract before downstream enrichment.
- EXT-14 company identity resolution and source freshness before opportunity scoring.
- EXT-15 documented provider/source rights, lawful basis, regional privacy review, suppression/deletion and positive unit economics before contact reveal.
- EXT-16 source-grounded draft workflow and user approval before any outbound action.
- CRM integration contract, tenant isolation, identity/entitlements, audit and data lifecycle controls.
- Shared browser SDK/permission model and Agent Platform authority wherever a consequential agent action is involved.

**Validation gates.**
- **F1 — Problem/ICP:** at least 12–15 qualified interviews across the selected initial ICP; repeated evidence of the same workflow pain, existing workaround/spend and named buyer. Record negative evidence.
- **F2 — Workflow usability:** prototype tests demonstrate a complete capture-to-reviewed-draft workflow using synthetic or properly authorized data; users understand provenance and confidence.
- **F3 — Data legality and quality:** written provider terms and source-rights review; documented lawful basis, retention, suppression and deletion; measured match accuracy, freshness and cost per usable record. EXT-15 remains blocked without this.
- **F4 — Commercial proof:** at least two design partners commit to a scoped pilot, and at least one paid pilot or equivalent documented purchasing commitment before broad build-out. Pricing remains a hypothesis until tested.
- **F5 — Release:** security/privacy review, permission review, CRM contract tests, human-approval tests, suppression/deletion tests, browser compatibility and support/runbook evidence pass.

**Go/no-go rule.** Prioritize EXT-13 and EXT-14 workflow validation. Do not make ContactIntel a critical-path dependency until F3 passes. Do not enable autonomous sending.

### D-02 — Aithyrex Enterprise Guard extends EXT-02, not EXT-03

**Decision.** Elevate the existing EXT-02 Aithyrex Guard direction toward an enterprise-managed AI interaction protection product. This is not a new extension.

**Canonical boundary.**
- **EXT-02 Aithyrex Guard:** inspect supported browser-based AI interactions for sensitive-data disclosure; local-first detection, explainable matches, redact/warn/block/cancel controls according to policy.
- **EXT-03 Auctaryn Guard:** browser-facing operator view of Auctaryn agent runtime risk, context integrity, tool/MCP exposure and containment state.
- **Tinlance Agent Platform:** authoritative identity, authorization, policy, approvals, execution and audit authority. Aithyrex detection is a risk/control signal, not an authorization authority.

**Enterprise direction.**
- Central policy administration, groups/roles, policy versions, effective dates, exceptions, expiry and revocation.
- Signed/authenticated policy delivery and visible stale-policy state.
- Managed Chrome/Edge deployment as the first enterprise operating mode; BYOD is a distinct, weaker assurance mode with explicit limitations.
- Local inspection by default; no raw prompt telemetry and no cloud detection without explicit opt-in.
- Privacy-preserving structured evidence for policy outcomes. Raw prompts, sensitive values and screenshots are not collected by default.
- Evidence export and SIEM integration may be evaluated after the event schema and integrity model are approved.

**Explicit limitations.**
- Browser DLP does not cover native applications, all browsers, all upload paths, network exfiltration or compromised endpoints.
- Extension inventory cannot establish the internal behaviour of every installed extension or replace endpoint monitoring.
- Control evidence can support selected SOC 2 activities; it cannot certify compliance or establish that an organization is SOC 2 compliant.
- Offscreen Documents are not an air-gap or endpoint-encryption architecture.
- Aithyrex is not a replacement for EDR, MDM, endpoint DLP or secure access controls.

**Dependencies.**
- EXT-02 baseline requirements and supported AI-site adapter contracts.
- Enterprise identity/tenancy, role model and centralized policy service.
- Browser-managed deployment and policy configuration model.
- Local detector architecture, benchmark corpus and supported-path compatibility harness.
- Shared evidence schema, integrity, tenant isolation, retention and access controls.
- Security/privacy/legal review of telemetry, admin visibility, retention and enterprise deployment.
- Agent Platform integration only where agent actions or shared authorization are involved; do not couple ordinary AI text inspection to an unnecessary remote execution path.

**Validation gates.**
- **A1 — Buyer/problem validation:** 15–18 structured interviews across security leaders, browser/IT administrators, privacy/compliance and developer/AI leaders. Confirm current controls, incidents/workarounds, deployment model, budget and buying process.
- **A2 — Detection benchmark:** agreed synthetic benchmark covering PII, credentials, confidential customer data, source code, configured terms, obfuscation and benign controls. Report precision, recall, false positives, false negatives and latency by category; no accuracy claim before results.
- **A3 — Supported-path enforcement:** tests for typing, paste, submit, redaction, policy outage, stale policy, detector crash, DOM changes, user override, org block and revocation on each declared AI site/browser combination.
- **A4 — Enterprise policy/evidence:** demonstrate authenticated policy delivery, versioning, expiry/revocation and tamper detection; prove metadata-only evidence is tenant-bound and does not expose raw prompt content by default.
- **A5 — Paid pilot:** 2–3 design partners, 30–60 days, with scoped supported sites and a written purchase decision. Proposed pilot targets (not current performance claims): at least 95% recall on the agreed benchmark, no more than 2% false-positive rate, at least 99% enforcement success on supported paths, median inspection under 100 ms, zero raw prompt telemetry by default, and demonstrated policy update/revocation. Targets must be agreed with pilot partners and measured transparently.
- **A6 — Release:** managed-browser deployment guide, BYOD limitations, security/privacy review, incident handling, admin controls, support and browser compatibility evidence pass.

**Go/no-go rule.** Preserve EXT-02 and EXT-03 identities. Enterprise console, policy administration and evidence services are shared platform capabilities unless a distinct installable user job is separately approved. Defer broad shadow-SaaS claims, universal upload DLP, internal extension-behaviour inspection and SOC 2 compliance claims.

### D-03 — Browser-native orchestration is shared infrastructure, not a new extension

**Decision.** Validate a shared local execution capability, provisionally named **Tinlance Local Execution Runtime (TLER)**. The name is a working label only. It is not a catalogue entry, approved product brand or implementation commitment.

**Architectural placement.**
- Tinlance Agent Platform remains authoritative for identity, authorization, policy, approvals, execution governance, secrets and audit.
- TLER, if approved, is a constrained local execution substrate that validates tasks, exposes a capability registry, applies resource limits, executes reviewed workflow definitions and returns evidence.
- EXT-17 Agent Browser Bridge provides the paired, user-controlled browser execution surface.
- EXT-18 Tinlance Workflow provides the user-facing repeatable workflow product.
- FadeReach and other products may consume approved capabilities through typed adapters.
- Auctaryn provides runtime risk signals and containment integration; it does not become the authorization authority.

**Technical/security constraints.**
- Local execution does not bypass bot detection, website terms, rate limits or access controls.
- Browser extension service workers are event-driven and lifecycle-constrained; do not promise always-on unattended scheduling from MV3.
- `chrome.debugger` is highly privileged and may trigger broad permission warnings or enterprise restrictions; it is not a default dependency. Prefer least-privilege browser APIs and make exceptional capabilities optional and justified.
- Manifest V3 does not permit remotely hosted executable code. Remote workflow definitions may be data interpreted by a packaged, reviewed, constrained engine; do not download and execute arbitrary JavaScript.
- Local execution does not eliminate costs for inference, identity/policy, APIs, sync, evidence, observability, support, compliance, maintenance or device compatibility.
- Never collect or transmit cookies, passwords, session tokens or authentication secrets. Treat page content and tool output as untrusted instructions.
- Separate read-only operations from writes. Require explicit user approval for messages, submissions, purchases, configuration changes and infrastructure mutations. Actions must be interruptible, scoped, revocable and resource-limited.

**Dependencies.**
- Approved Phase 03 architecture and ADRs for authority boundaries, task contracts, local trust model and evidence.
- EXT-17 browser pairing, origin binding, action scopes, approval lifecycle and isolation design.
- EXT-18 workflow definition, versioning, deterministic execution, secrets and human-confirmation model.
- Agent Platform typed authorization/approval APIs and audit correlation.
- Browser SDK compatibility, permission broker, secure update/signing and packaged-code supply-chain controls.
- Threat model covering malicious pages, prompt injection, confused deputy, extension compromise, cross-origin messaging, data exfiltration, replay and resource exhaustion.

**Validation gates.**
- **R1 — Use-case selection:** validate three candidate use cases independently (FadeReach sales operations, permitted research/extraction, security/cloud audit). Select one narrow use case with repeated user pain and measurable value; do not bundle all three.
- **R2 — Architecture/security review:** approve trust boundaries, typed workflow schema, packaged interpreter, permission model, origin binding, resource limits, secrets handling, interrupt/revoke, audit and failure modes.
- **R3 — Browser feasibility:** prove service-worker lifecycle recovery, content-script isolation, supported browser API behaviour, permission prompts and enterprise policy compatibility without relying on always-on execution.
- **R4 — Safety tests:** adversarial tests for hostile page instructions, prompt injection, unauthorized writes, cross-tenant leakage, token/cookie exfiltration, replay, origin confusion, resource exhaustion and cancellation. Zero critical/high unresolved findings for pilot.
- **R5 — Value/economics:** show task success, human intervention rate, execution latency, reliability, support burden and cost-to-serve for the chosen use case. Compare against server-side/browser automation alternatives.
- **R6 — Integration gate:** Agent Platform approval and audit tests pass; EXT-17/18 contracts are stable; any consuming product has its own data-source/legal and acceptance gates.
- **R7 — Pilot authorization:** a limited, explicitly scoped design-partner pilot is approved only after R1–R6; no unattended or broad production rollout by default.

**Go/no-go rule.** FadeReach has the faster path to commercial validation. TLER is an architectural leverage investment and must not delay FadeReach discovery or be implemented as a generic automation engine before a narrow use case and security model pass.

### D-04 — Checkout Sentry remains a separate discovery candidate

**Decision.** Keep Checkout Sentry outside the current 26-product catalogue and current implementation roadmap. Do not merge it into EXT-26 ShopIntel.

**Product distinction.**
- **ShopIntel (EXT-26):** product, merchant and e-commerce market intelligence.
- **Checkout Sentry concept:** an individual's own purchase recovery workflow—receipt capture, return/warranty reminders, price-drop checks and claim preparation.

**Discovery-only MVP hypothesis.**
- User-selected receipt forwarding/upload/manual entry rather than broad mailbox access.
- Purchase record with merchant, order date, product, price and source.
- Return/warranty reminders and price-drop checks for a small set of supported merchants.
- Policy evidence with source URL, captured version, effective date, last-verified timestamp, jurisdiction, channel/product constraints, exclusions and confidence.
- Claim preparation and links to official merchant/issuer/settlement administrators; user reviews and submits.
- No guarantee of eligibility, recovery or payout.

**Boundaries and risks.**
- A retailer's price-drop policy is not a universal entitlement; policies vary by merchant, product, region, channel and time.
- Do not represent an unverified “40,000+ policy database” or projected recovery rate as a defensible asset.
- Do not sell identifiable purchase histories or use purchase data for unrelated monetization. Any separate aggregate research requires an independent legal basis, meaningful transparency and appropriate consent.
- Gmail/Outlook mailbox-wide access is not an MVP dependency. Restricted OAuth scopes can trigger provider verification and security-assessment obligations; minimize scope and retention.
- Subscription cancellation, disputes, legal claims and financial actions require explicit user confirmation and must not imply legal/financial representation.
- Settlement discovery should point to official administrators and avoid promising qualification or payment.

**Dependencies.**
- Independent consumer problem and willingness-to-pay research.
- Receipt ingestion and data minimization/privacy design.
- Merchant/issuer policy source rights, freshness and verification operations.
- Supported merchant price monitoring and reliable price history.
- Legal review of consumer claims, success fees, financial/settlement referrals and applicable regional rules.
- Unit economics for monitoring, policy maintenance, support, notifications and any recovery workflow.

**Validation gates.**
- **C1 — Problem validation:** at least 20 target-consumer interviews plus a documented survey or observed workflow study; identify frequency, actual money/time recovered, current alternatives and trust concerns.
- **C2 — Concierge test:** manually support a small, consented cohort using user-supplied receipts; measure eligible cases, successful outcomes, time per case, policy ambiguity and user effort.
- **C3 — Policy/data reliability:** validate a bounded merchant set with dated, sourced policy records and repeat verification; measure stale/conflicting policy rate and maintenance cost.
- **C4 — Economics and willingness to pay:** test subscription and/or success-fee hypotheses with real purchasing behaviour. The proposal's 20–30% fee and $150 annual recovery/user are unvalidated assumptions, not forecasts.
- **C5 — Privacy/legal:** approve receipt/mailbox scope, retention/deletion, data sharing, consumer-protection disclosures and any success-fee model before product build.
- **C6 — Portfolio decision:** only after C1–C5, decide whether to add a new catalogue entry with its own user job, permission boundary, product brief, threat model, owner and roadmap slot.

**Go/no-go rule.** Discovery may proceed as a separate research track. No engineering implementation, product number, mailbox-wide OAuth integration or purchase-data monetization until C1–C6 pass.

## 3. Cross-decision dependencies and sequencing

The decisions share foundational controls but are not a single implementation programme.

| Shared dependency | FadeReach | Aithyrex | TLER | Checkout Sentry |
|---|---|---|---|---|
| Identity, tenancy and entitlements | Required for workspace/CRM | Required for enterprise administration | Required for governed tasks | Required only if a later account product is justified |
| Policy/approval authority | User approval for outbound actions | Enterprise policy governs supported AI interactions; Agent Platform governs agent actions | Agent Platform is authoritative | User confirms claims/cancellations/disputes |
| Evidence/provenance | Source and freshness per prospect/company/contact | Metadata-only policy outcome evidence | Action/evidence correlation and audit | Receipt and merchant-policy provenance |
| Data rights/privacy | Critical for contact providers and prospect records | Critical for prompt handling and admin visibility | Critical for page data, secrets and task outputs | Critical for receipts, mailbox scopes and purchase history |
| Browser SDK/compatibility | Capture and CRM handoff | Supported AI-site interception | Local runtime and browser pairing | Optional later; not assumed for discovery |
| Commercial validation | Paid design partner/pilot | Paid enterprise pilot | Value/economics for one narrow use case | Concierge proof and real willingness to pay |

**Recommended validation order:**

1. Start FadeReach ICP and workflow discovery; validate EXT-13/14 first and keep EXT-15 provider-gated.
2. In parallel, recruit Aithyrex enterprise interviewees and define the benchmark/policy/evidence design; do not claim enterprise readiness.
3. Run TLER architecture and threat-model work only to the point needed to decide feasibility; do not build a generic runtime before a selected use case passes.
4. Run Checkout Sentry consumer discovery separately with no catalogue or engineering commitment.

**Shared foundations that must precede consequential implementation:** approved identity/tenant model; policy and approval authority; product-specific data classification and retention; evidence/audit contracts; threat models; least-privilege browser permission model; secure update and supply-chain controls; and observable, revocable failure handling.

## 4. Programme-level validation and implementation gates

No implementation work package arising from these decisions may begin until all applicable preconditions below are recorded:

| Gate | Required evidence | Applies to |
|---|---|---|
| G0 — Portfolio and scope | Product identity/boundary, non-goals, owner, target user and approved scope | All |
| G1 — Customer evidence | Interview notes, repeated pain, current alternatives, buyer and negative evidence | All; depth varies by decision |
| G2 — Architecture/dependencies | Approved contracts, dependency map, authority boundary, data flows and failure model | All |
| G3 — Security/privacy/legal | Threat model, data classification, permission rationale, retention/deletion, provider/terms/legal review | All |
| G4 — Technical feasibility | Reproducible spike and compatibility/quality results for the declared scope | FadeReach, Aithyrex, TLER; Checkout only if discovery justifies |
| G5 — Commercial proof | Design-partner commitment, paid pilot or documented purchase evidence and cost-to-serve | Commercial build-out |
| G6 — Release readiness | Automated/manual acceptance, browser matrix, operational runbooks, support, rollback and truthful product status | Any release |

A gate is **open** until evidence is linked in the relevant product brief, ADR, test report or pilot record and reviewed by the accountable owner. A plan, estimate, vendor claim or passing repository-baseline test is not gate evidence.

## 5. Status register

| Decision | Portfolio disposition | Validation status | Implementation status |
|---|---|---|---|
| D-01 FadeReach Professional Workspace | Approved direction; existing EXT-13–16 | Not yet validated by this record | Not authorized by this record |
| D-02 Aithyrex Enterprise | Approved direction for EXT-02 only | Not yet validated by this record | Not authorized by this record |
| D-03 TLER | Shared-capability concept; working name only | Architecture/use-case gates open | Not approved or implemented |
| D-04 Checkout Sentry | Separate discovery candidate, outside catalogue | Discovery gates open | Not approved or implemented |

## 6. Required follow-on records

Before implementation authorization, create or update the following controlled records:

1. FadeReach Professional Workspace requirements supplement, covering EXT-13–EXT-16 contracts and the selected ICP.
2. EXT-02 Aithyrex enterprise requirements, threat model and benchmark/validation plan.
3. ADR(s) for local execution authority boundaries, packaged workflow execution, permission model and evidence.
4. Checkout Sentry discovery brief only if consumer discovery is actively funded; do not assign an extension ID yet.
5. Update the master roadmap only after validation changes phase order, scope, dependencies or owners. Do not silently reorder the existing first seven product phases.

## 7. Change control

Any change to product identity, catalogue count, phase order, authority boundaries, permission model, data-source strategy or implementation priority requires an evidence-backed decision update. The canonical product catalogue remains the source of truth for extension IDs. This document records portfolio dispositions and validation gates; it does not override product briefs, security policies, architecture ADRs or the Agent Platform's authority model.

**Final decision:** FadeReach is the first commercial validation priority; Aithyrex EXT-02 is the enterprise validation priority; TLER is a shared infrastructure concept subject to architecture/security gates; Checkout Sentry remains a separate discovery track. None is represented as implemented or validated by this decision record.
