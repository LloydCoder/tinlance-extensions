# Tinlance Extensions — Canonical Product Catalogue

**Decision status:** Approved portfolio baseline — 2026-11-04  
**Owner:** Tinlance Limited  
**Repository:** https://github.com/LloydCoder/tinlance-extensions  
**Decision scope:** Product identity, boundaries, canonical count, overlap disposition and portfolio-level release grouping.

> Approval in this document means the concepts below are the canonical portfolio baseline for requirements and sequencing. It does not mean every product is funded, implemented, security-reviewed, commercially validated, browser-compatible, or approved for release. Each product still requires its own brief, acceptance criteria, threat model, dependencies and release gate.

## 1. Portfolio decision

The canonical portfolio contains **26 distinct extension products**.

The previous roadmap stated 32 concepts, but its enumerated product groups total **31 named concepts**, not 32. The 29-item conversational list was also incomplete: it omitted Tinlyt Evidence, Aithyrex Prompt Injection Detector and authorized bug-bounty tooling. This catalogue reconciles those inconsistencies, consolidates overlapping concepts and adds Auctaryn Guard as a first-class proposed product.

The catalogue is intentionally a portfolio of focused, independently releasable extensions. Shared services, integrations, detectors and feature modules are not counted as separate extensions unless they have a distinct user job, permission boundary, installable experience and release lifecycle.

## 2. Canonical catalogue

### A. Security, privacy and assurance

| ID | Product | Canonical responsibility | Boundary / notes |
|---|---|---|---|
| EXT-01 | Site Security Auditor | Passive website security posture checks, evidence and remediation guidance | Website configuration assessment; not a malware scanner or general compliance certification |
| EXT-02 | Aithyrex Guard | Prevent sensitive information from being disclosed through supported AI interactions | AI data-loss prevention: PII, credentials, confidential text, source code and policy controls |
| EXT-03 | Auctaryn Guard | Browser-facing visibility and controls for Auctaryn agent runtime security | Agent context integrity, runtime risk, tool/MCP risk, containment signals and ThreatFade intelligence; must not become the authorization authority |
| EXT-04 | ThreatFade LinkShield | Assess URLs and navigation destinations for malicious-link risk | URL reputation and navigation-time warnings |
| EXT-05 | ThreatFade PrivacyGuard | Explain and control website tracking, privacy-invasive behaviour and unnecessary permissions | Privacy posture and user controls; not a general security auditor |
| EXT-06 | ThreatFade DownloadGuard | Assess downloads and warn about potentially dangerous files | Download risk and provenance; no claim of definitive malware detection without supported scanning evidence |
| EXT-07 | Compliance Assistant | Help inspect digital experiences against explicitly selected compliance requirements | Evidence assistance only; never imply legal advice, certification or guaranteed compliance |
| EXT-08 | Authorized Security Testing Companion | Assist security professionals with explicitly authorized testing workflows and evidence capture | Strict target allowlists, scope validation, safe defaults and no unauthorized exploitation |

### B. Tinlyt — web intelligence and evidence

| ID | Product | Canonical responsibility | Boundary / notes |
|---|---|---|---|
| EXT-09 | Tinlyt Page Extractor | Extract structured content from the current user-selected page | Extraction and provenance; does not claim source verification |
| EXT-10 | Tinlyt Verify | Evaluate claims against supporting, conflicting and contextual evidence | Claim verification and uncertainty representation |
| EXT-11 | Tinlyt Monitor | Track selected pages and sources for meaningful changes | Scheduled monitoring, change history and notification |
| EXT-12 | Tinlyt Research | Guided web research, source inspection and evidence organization | Combines the previously separate Tinlyt Research, Tinlyt Evidence and Tinlyt Source Inspector concepts into one coherent research workflow |

### C. FadeReach — sales intelligence

| ID | Product | Canonical responsibility | Boundary / notes |
|---|---|---|---|
| EXT-13 | FadeReach Prospect Capture | Capture user-selected prospect details from supported business pages | User-directed capture, normalization and lawful-use safeguards |
| EXT-14 | FadeReach CompanyIntel | Build structured company profiles and business intelligence | Company-level enrichment |
| EXT-15 | FadeReach ContactIntel | Organize professional contact intelligence from permitted sources | Contact-level enrichment; source and lawful-use controls required |
| EXT-16 | FadeReach Outreach Assistant | Prepare contextual, prospect-specific outreach | Drafting and workflow assistance; no autonomous sending by default |

### D. Governed automation and memory

| ID | Product | Canonical responsibility | Boundary / notes |
|---|---|---|---|
| EXT-17 | Agent Browser Bridge | Provide a paired, user-controlled browser execution surface for governed agents | Agent Platform remains authoritative for identity, authorization, policy, approvals, execution and audit |
| EXT-18 | Tinlance Workflow | Automate user-approved, repeatable browser workflows | General workflow product; FormPilot is a focused form-automation capability within this product, not a separate extension |
| EXT-19 | Memory Vault Clipper | Capture and organize user-selected web information for Memory Vault workflows | Capture/export surface; Memory Vault remains the system of record |

### E. Developer and web-quality utilities

| ID | Product | Canonical responsibility | Boundary / notes |
|---|---|---|---|
| EXT-20 | WebDebugger | Browser-based diagnostics for web applications, including network/API inspection | Absorbs API Inspector as a dedicated diagnostics panel/module |
| EXT-21 | JSON Explorer | Format, validate, inspect and navigate JSON data | Focused data utility |
| EXT-22 | StackDetect | Identify technologies and frameworks used by a website | Technology fingerprinting with confidence and evidence |
| EXT-23 | AccessibilityCheck | Identify accessibility issues and provide actionable guidance | Automated findings must disclose limitations and encourage manual testing |

### F. Search, commerce and market intelligence

| ID | Product | Canonical responsibility | Boundary / notes |
|---|---|---|---|
| EXT-24 | SEO Inspector | Inspect on-page and technical SEO signals for a selected website | Site-level SEO diagnostics |
| EXT-25 | SERP Intelligence | Analyze search-result composition, visibility and competitive search signals | Search-results intelligence; distinct from on-page SEO inspection |
| EXT-26 | ShopIntel | Organize product, merchant and e-commerce intelligence | Commerce research; respect source terms and data-use constraints |

## 3. Overlap and disposition register

| Previous concept | Decision | Reason |
|---|---|---|
| Tinlyt Research | Merge into Tinlyt Research | Becomes the umbrella research workflow |
| Tinlyt Evidence | Merge into Tinlyt Research | Evidence capture and organization are core research capabilities, not a separate installable job |
| Tinlyt Source Inspector | Merge into Tinlyt Research | Source inspection is a research capability; a separate product would duplicate the same workflow |
| Aithyrex Prompt Injection Detector | Do not retain as a separate extension | Prompt-injection and hostile-context signals for autonomous agents belong in Auctaryn Guard; Aithyrex Guard focuses on sensitive-data disclosure prevention |
| FadeReach CRM Bridge | Reclassify as an integration | CRM connectivity is an integration/capability shared by FadeReach products, not a distinct user-facing extension |
| FormPilot | Merge into Tinlance Workflow | Form completion is a specialized workflow capability, not a separate platform-level product |
| API Inspector | Merge into WebDebugger | API/network inspection is a core WebDebugger panel |
| Auctaryn Guard | Add as EXT-03 | A distinct agent-runtime security job, separate from AI data-loss prevention and browser execution governance |
| Authorized bug-bounty tooling | Retain as Authorized Security Testing Companion | Distinct authorized-testing workflow with strict scope and safety controls |

### Explicit product boundaries

- **Aithyrex Guard vs Auctaryn Guard:** Aithyrex protects information users submit to AI interfaces. Auctaryn protects autonomous agents and their runtime context, tools and execution paths. Do not duplicate ownership of detection or enforcement.
- **Auctaryn Guard vs Agent Browser Bridge:** Auctaryn provides runtime threat signals and containment integration. Agent Browser Bridge is the browser execution surface. The Tinlance Agent Platform is the authority for authorization and approvals.
- **Site Security Auditor vs ThreatFade extensions:** Site Security Auditor performs broader passive website posture assessment. LinkShield focuses on destination risk, PrivacyGuard on tracking/privacy, and DownloadGuard on file-download risk.
- **Tinlyt products:** Page Extractor extracts; Research organizes multi-source investigations; Verify evaluates claims; Monitor detects changes over time.
- **FadeReach products:** Prospect Capture collects user-selected records; CompanyIntel and ContactIntel enrich separate entity types; Outreach Assistant prepares communications. CRM support is an integration, not a fifth standalone extension.
- **SEO Inspector vs SERP Intelligence:** the former evaluates a site; the latter evaluates search-result visibility and competitive signals.

## 4. Product status vocabulary

Every product must use one of these states in project tracking:

- **Portfolio-approved:** included in this canonical catalogue.
- **Requirements approved:** product brief, user job, scope, permissions, non-goals and acceptance criteria approved.
- **Architecture-ready:** dependencies, data flows, API contracts and threat model reviewed.
- **In development:** implementation is underway on a traceable branch/PR.
- **Implemented:** required code is present.
- **Verified:** relevant automated and manual acceptance evidence passed.
- **Released:** a version is published and distribution status is confirmed.
- **Paused / deprecated:** decision and migration or retirement path recorded.

No portfolio-approved product may be advertised as available. A green repository-validation workflow does not establish product implementation or readiness.

## 5. Sequencing baseline

The existing 25-phase roadmap remains the programme structure. This catalogue does not silently reorder or bypass its gates.

### Initial commercial beta candidates — retain current phase order

1. EXT-01 Site Security Auditor — Phase 11.
2. EXT-09 Tinlyt Page Extractor — Phase 12.
3. EXT-02 Aithyrex Guard — Phase 13.
4. EXT-10 Tinlyt Verify — Phase 14.
5. EXT-11 Tinlyt Monitor — Phase 15.
6. EXT-13 FadeReach Prospect Capture — Phase 16.
7. EXT-17 Agent Browser Bridge — Phase 17, only after Agent Platform authorization and approval integration is testable.

### Later portfolio candidates

- EXT-03 Auctaryn Guard: add a dedicated product requirements and integration work package after Auctaryn API/security-contract review. Do not claim it is part of the current Phase 17 Agent Browser Bridge deliverable.
- EXT-04 through EXT-08: ThreatFade, compliance and authorized-testing products, each with its own threat model and release constraints.
- EXT-12: Tinlyt Research, including Evidence and Source Inspector capabilities.
- EXT-14 through EXT-16: FadeReach intelligence and outreach products.
- EXT-18 and EXT-19: workflow and Memory Vault integration products.
- EXT-20 through EXT-23: developer and accessibility utilities.
- EXT-24 through EXT-26: SEO, SERP and commerce intelligence.

Phase 02 must now produce the full product briefs and validate commercial priority. Phase 03 must approve the shared architecture and product boundaries. Product-specific implementation phases may be added or adjusted only through a roadmap change with dependencies and acceptance criteria.

## 6. Cross-product platform rules

1. Every extension has a distinct user job, product owner, permission rationale, privacy disclosure, support path and release lifecycle.
2. Shared SDK, identity, policy, telemetry, billing, update and design-system capabilities are platform services, not separately counted extensions.
3. Page content, URLs, metadata, downloads and tool outputs are untrusted input.
4. Browser permissions are least-privilege; optional permissions are requested at point of use.
5. No remote executable code or remotely loaded scripts in browser extensions.
6. Sensitive prompt and page content is not sent to cloud services or telemetry by default; each product must document processing and retention.
7. Consequential agent actions remain subject to the Tinlance Agent Platform's authoritative authorization and approval controls.
8. MCP exposes only production-backed, reviewed capabilities; an extension's presence in this catalogue does not authorize an MCP tool.
9. Every product must define supported browsers and versions based on actual test evidence.
10. Security, privacy, accessibility, supply-chain and operational requirements are release gates.

## 7. Required Phase 02 outputs

- Product brief and target user/job for each of the 26 products.
- Explicit in-scope/out-of-scope features and measurable acceptance criteria.
- Permission and data-classification matrix per product.
- Product dependency graph and shared-service requirements.
- Threat model and abuse cases for security-sensitive products.
- Browser/client compatibility requirements.
- Pricing hypotheses and validation plan; no unvalidated price is represented as established.
- Prioritization score using customer value, strategic fit, feasibility, risk, differentiation and revenue potential.
- Release sequencing recommendation with named dependencies and evidence gates.
- Decision record for Auctaryn Guard integration with the Auctaryn product/API and Agent Platform.

**Current implementation status:** This is a portfolio decision and requirements baseline. It does not assert that any of the 26 extensions has been implemented or released.
