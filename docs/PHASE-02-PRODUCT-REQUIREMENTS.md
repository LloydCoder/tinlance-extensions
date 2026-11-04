# Tinlance Extensions — Phase 02 Product Requirements and Prioritization

**Status:** Requirements baseline drafted; review and customer validation outstanding  
**Date:** 2026-11-04  
**Owner:** Tinlance Limited  
**Catalogue:** [26-product canonical catalogue](PRODUCT-CATALOGUE.md)  
**Architecture:** [System architecture](SYSTEM-ARCHITECTURE.md)  
**Roadmap:** [Master roadmap](MASTER-ROADMAP.md)

> This document defines proposed product requirements. It is not proof of implementation, customer validation, browser compatibility, security certification, or release readiness. Scores, revenue models and commercial assumptions are hypotheses to test.

## 1. Phase 02 decisions

1. Retain the 26 canonical product identities and overlap dispositions in PRODUCT-CATALOGUE.md.
2. Preserve the existing first seven delivery slots and their phase order.
3. Keep each extension focused on one user job, with distinct permissions, privacy disclosure, onboarding and release lifecycle.
4. Treat SDK, identity, policy, telemetry, billing, update, design-system and storage abstractions as shared platform capabilities—not extra products.
5. Product-specific detection and intelligence remain in their authoritative services. Extensions are clients/adapters, not substitute backends.
6. Tinlance Agent Platform remains the sole authority for identity-bound authorization, policy, approvals and consequential execution. Auctaryn supplies agent-runtime security signals/containment integration; Agent Browser Bridge supplies a browser execution surface.
7. All pricing, demand and scoring below are planning hypotheses pending customer discovery, competitor analysis and paid-pilot evidence.

**Phase 02 exit criteria:** all 26 briefs reviewed; owners and acceptance criteria assigned; permissions/data handling reviewed; security-sensitive threat models approved; dependencies mapped; browser/client support deferred until tested; priority segments interviewed; commercial evidence and unresolved decisions recorded; Phase 03 inputs approved.

## 2. Common product contract

Each brief defines the first user, core job, MVP, permission/data boundary, security controls, acceptance evidence, dependencies and commercial hypothesis.

Data classes:
- **D0 Public:** public web content/metadata.
- **D1 User content:** selected page text, notes, preferences and user-provided material.
- **D2 Business confidential:** internal records, prospect data, unpublished research and organization policies.
- **D3 Sensitive:** credentials, secrets, personal, financial, health, legal or regulated data.

Default data rule: collect the minimum; process locally where practical; raw D1–D3 content is not telemetry and is not sent to cloud services by default. Cloud processing requires a documented purpose, explicit disclosure, transport protection, access controls, retention/deletion rules and any required user/administrator consent.

## 3. Product briefs

### Security, privacy and assurance

#### EXT-01 — Site Security Auditor
- **User/job:** site owners, developers, agencies and security consultants need a safe view of observable website posture.
- **MVP:** user-triggered passive checks for HTTPS/TLS indicators available to the client, security headers, mixed content, cookie flags where observable and selected exposure signals; evidence, confidence, severity rationale and remediation guidance.
- **Permissions/data:** activeTab by default; optional selected-host permission only if necessary. D0 and limited D1 URL/metadata. No credential collection, form submission or intrusive testing.
- **Controls/acceptance:** treat responses as untrusted; defend backend fetches against SSRF, redirects and oversized responses; every finding has reproducible evidence and confidence; no finding is described as verified exploitability without proof.
- **Dependencies/commercial:** browser SDK, safe fetch if remote checks are used, findings schema. Freemium single-site checks; paid history, scheduled monitoring, multi-site and team reports.

#### EXT-02 — Aithyrex Guard
- **User/job:** AI users and security teams need to prevent accidental sensitive-data disclosure through supported browser AI interfaces.
- **MVP:** supported-site adapters; local inspection of composed text before submit; detect common PII, credential patterns and configured terms; explain matches; redact, cancel or proceed when policy permits; visible compatibility status.
- **Permissions/data:** narrow host permissions for supported AI sites; content scripts only on relevant compose/submit surfaces; local settings/policy cache. Inspected text can contain D3 and remains local by default.
- **Controls/acceptance:** no raw prompt telemetry; no cloud detection without opt-in; organization blocks cannot be bypassed by ordinary users; exceptions are scoped/time-limited; tests cover typing, paste, submit, redaction, DOM changes and unsupported paths. No claim of native-app, mobile, API, voice or universal upload coverage.
- **Dependencies/commercial:** local detector, adapter framework, policy contract, secure settings. Free individual protection; paid personal rules/history; team policy/admin and enterprise integrations. Pricing unvalidated.

#### EXT-03 — Auctaryn Guard
- **User/job:** agent operators and security teams need browser-facing visibility into Auctaryn runtime risk, context integrity, tool/MCP exposure and containment state.
- **MVP:** authenticate to documented Auctaryn APIs; display agent/session identity, runtime risk signals, context-integrity alerts, tool/MCP findings and authoritative containment state; link alerts to evidence; send only documented response requests through Auctaryn/Agent Platform APIs.
- **Permissions/data:** extension UI and scoped authenticated API only; no broad access to unrelated browsing. D2 operational metadata and potentially D3 event details; redact secrets.
- **Controls/acceptance:** extension is not an authorization authority; server validates identity, tenant and scope; protect against spoofed/replayed/stale events; fail closed for consequential actions; every action has audit correlation. Every UI state maps to a documented API/event.
- **Dependencies/commercial:** Auctaryn API/event/auth/tenant contract review, ThreatFade signal contract and Agent Platform approval integration. **Implementation is gated until these contracts are reviewed.** Organization/agent-seat security subscription is a hypothesis.

#### EXT-04 — ThreatFade LinkShield
- **User/job:** consumers and organizations want risk context before following suspicious links.
- **MVP:** user-initiated URL inspection and optional navigation-time warning; canonicalize URL; check available reputation/intelligence; show reason, confidence and next step.
- **Permissions/data:** activeTab/context menu by default; optional host/navigation permission only for real-time mode. URLs are D1 because query strings may contain tokens or personal data.
- **Controls/acceptance:** redact sensitive URL components before cloud lookup; test IDNs, punycode, redirects, shorteners and deceptive subdomains; unknown is distinct from safe; absence of a threat hit never proves safety.
- **Dependencies/commercial:** ThreatFade reputation API and normalization. Free checks; paid real-time/org protection is a hypothesis.

#### EXT-05 — ThreatFade PrivacyGuard
- **User/job:** privacy-conscious users and privacy teams want to understand tracking and privacy-invasive behaviour.
- **MVP:** user-triggered report of observable third-party requests, tracker indicators, cookie/storage categories where accessible and permission explanations; reversible site-level preferences where supported.
- **Permissions/data:** activeTab and narrowly scoped optional request/host visibility; no blanket browsing history. Browsing destinations are D1 and not uploaded by default.
- **Controls/acceptance:** no promise of complete tracker detection; explain evidence and browser limitations; reversible controls; no third-party sharing of browsing history.
- **Dependencies/commercial:** privacy signal catalogue and browser capability matrix. Free reports; paid monitoring and managed policy hypothesis.

#### EXT-06 — ThreatFade DownloadGuard
- **User/job:** users and IT teams want risk context for chosen downloads.
- **MVP:** inspect download metadata/source where APIs permit; locally hash when useful; query available reputation; show provenance/risk; user-controlled pause/cancel only where supported.
- **Permissions/data:** downloads permission only if justified; optional source host access. File names, URLs and hashes are D1/D2. No file-content upload by default.
- **Controls/acceptance:** no automatic opening/execution; unknown reputation is not “clean”; test large files, redirects, duplicate names and offline state; explicit consent and retention terms before any file upload.
- **Dependencies/commercial:** ThreatFade file reputation and download adapter. Paid organization policy/enrichment hypothesis; scanning capability and economics must be verified first.

#### EXT-07 — Compliance Assistant
- **User/job:** SMB compliance leads, agencies and auditors need structured evidence against a selected control framework.
- **MVP:** choose framework/version and target; map observable website evidence to controls; record source, timestamp, confidence, gap and reviewer note; export draft evidence pack.
- **Permissions/data:** activeTab and explicit scope; D1/D2 evidence, potentially D3 if user enters regulated material.
- **Controls/acceptance:** unknown/not-assessed is distinct from compliant; no legal advice, certification or guarantee; every status has evidence; human review and framework version are explicit.
- **Dependencies/commercial:** versioned control catalogue, evidence schema and legal review. Paid workspaces, reports and consultant multi-client workflow hypothesis.

#### EXT-08 — Authorized Security Testing Companion
- **User/job:** authorized testers and internal security teams need scope-aware testing notes and evidence.
- **MVP:** define/import approved target allowlist and expiry; show scope; capture user-initiated passive observations/notes; validate target before any supported helper; export evidence log.
- **Permissions/data:** activeTab and explicitly scoped hosts; D1/D2 findings; no broad background scan.
- **Controls/acceptance:** default-deny outside scope; expiry blocks work; redirect/subdomain boundaries tested; no stealth, persistence, credential theft, evasion or destructive automation; all actions user-initiated and auditable.
- **Dependencies/commercial:** scope validation, authorization record and evidence store. Paid professional/team workspace hypothesis.

### Tinlyt — web intelligence and evidence

#### EXT-09 — Tinlyt Page Extractor
- **User/job:** researchers, analysts and developers need structured content from a user-selected page.
- **MVP:** select page/region; extract title, canonical URL, text and supported fields; preview/edit; export or send to authorized Tinlyt destination.
- **Permissions/data:** activeTab and scripting only on user action; D1 page content.
- **Controls/acceptance:** page DOM is untrusted; sanitize HTML, bound size, exclude password/hidden fields; preview exactly what will be extracted; preserve URL/time provenance; no persistent all-site access by default.
- **Dependencies/commercial:** browser SDK and extraction schema. Free limited extraction; paid batch/templates/workspace/API hypothesis.

#### EXT-10 — Tinlyt Verify
- **User/job:** journalists, analysts, educators and decision-makers need to assess a claim against sources.
- **MVP:** select claim/text; retrieve candidate sources through authorized Tinlyt service; show supporting, conflicting and contextual evidence with uncertainty.
- **Permissions/data:** activeTab and user selection; D1 claim/source content; cloud retrieval under disclosed terms.
- **Controls/acceptance:** source content is untrusted and may contain prompt injection; isolate evidence from instructions; cite every conclusion; conflicting evidence visible; insufficient evidence is a valid result.
- **Dependencies/commercial:** Tinlyt retrieval, extraction and provenance. Free limited checks; paid research volume, cases, teams/API hypothesis.

#### EXT-11 — Tinlyt Monitor
- **User/job:** researchers, compliance, sales and operations teams need to detect meaningful changes to selected sources.
- **MVP:** add URL/scope; capture baseline; schedule snapshots; detect meaningful changes; show diffs/notifications; pause/delete.
- **Permissions/data:** activeTab to create; cloud scheduler/fetch for ongoing checks; URLs/snapshots D1/D2. No browser cookies/private sessions by default.
- **Controls/acceptance:** SSRF/redirect allowlists, rate limits, terms/robots review, secret stripping, tenant isolation and retention; deduplicate changes; show failures; deletion follows retention policy.
- **Dependencies/commercial:** Tinlyt fetch/worker/scheduler, diff, notification and retention services. Freemium limits; paid volume, alerts, teams and retention hypothesis.

#### EXT-12 — Tinlyt Research
- **User/job:** researchers, consultants and analysts need a multi-source investigation workspace.
- **MVP:** create case/question; save user-selected pages/evidence; tag/annotate; preserve provenance and evidence relationships; export research brief.
- **Permissions/data:** activeTab on action; D1/D2 research; optional authenticated workspace sync.
- **Controls/acceptance:** every item retains source/time; exports distinguish quotation, paraphrase and analyst note; duplicate sources identified; user can delete case/content.
- **Dependencies/commercial:** Page Extractor, Verify, evidence schema and workspace identity. Paid workspaces, collaboration and exports hypothesis.

### FadeReach — sales intelligence

#### EXT-13 — FadeReach Prospect Capture
- **User/job:** B2B founders and SDRs need user-selected prospect details captured into clean records.
- **MVP:** detect supported business pages; select fields; normalize company/contact/role/source/time; preview and export.
- **Permissions/data:** activeTab and optional supported hosts; D2 professional/business data.
- **Controls/acceptance:** user confirms capture; source retained; duplicates handled; no hidden bulk scraping; honor source terms and privacy laws.
- **Dependencies/commercial:** capture schema, lawful-use review, CRM integration framework. Free quota; paid enrichment, workspace and CRM sync hypothesis.

#### EXT-14 — FadeReach CompanyIntel
- **User/job:** account executives and founders need sourced company profiles for qualification.
- **MVP:** company identity resolution; permitted public attributes; source/freshness per field; correction and export.
- **Permissions/data:** activeTab for capture context; D0/D2; provider terms disclosed.
- **Controls/acceptance:** distinguish verified/inferred; ambiguous matches require confirmation; tenant isolation; every nontrivial field has provenance.
- **Dependencies/commercial:** company resolution and licensed/public providers. Paid enrichment, lists, teams/API hypothesis.

#### EXT-15 — FadeReach ContactIntel
- **User/job:** B2B sales and recruiting teams need professional contact records with source and lawful-use context.
- **MVP:** capture supported permitted profile fields; link contacts to companies; deduplicate; source/freshness; correction/export.
- **Permissions/data:** activeTab and optional source-specific host access; D2 personal data.
- **Controls/acceptance:** no credential harvesting, private-profile bypass or indiscriminate bulk scraping; data minimization, deletion/suppression, provider compliance and lawful basis.
- **Dependencies/commercial:** contact schema, data providers and privacy review. Paid enrichment/team lists hypothesis; high legal/provider gate.

#### EXT-16 — FadeReach Outreach Assistant
- **User/job:** founders and sales reps need relevant, source-aware outreach drafts.
- **MVP:** select prospect; draft editable message using approved context; show sources/uncertainty; copy/save draft.
- **Permissions/data:** no mailbox permission required for MVP; D2 prospect/draft data.
- **Controls/acceptance:** no autonomous sending; user approves every outbound message; factual claims trace to sources; opt-out/suppression visible; protect prospect data in prompts/logs.
- **Dependencies/commercial:** CompanyIntel, ContactIntel, prospect schema and generation service. Paid usage/team templates hypothesis.

### Governed automation and memory

#### EXT-17 — Agent Browser Bridge
- **User/job:** governed agent developers/operators need a bounded browser action surface.
- **MVP:** pair browser to authenticated agent session; start with typed read-only actions; show intent/scope; route consequential actions through Agent Platform authorization/approval; correlate audit.
- **Permissions/data:** activeTab and minimal optional host permissions; D1/D2 page data. No debugger/all-sites permission without separate justification.
- **Controls/acceptance:** identity/tenant/session/capability/expiry bound to each request; replay/out-of-scope requests fail closed; write scopes separated; approvals by Agent Platform; sandbox and output bounds.
- **Dependencies/commercial:** Agent Platform, browser SDK, identity, policy, approval, audit and isolation. Platform/agent-seat commercial hypothesis.

#### EXT-18 — Tinlance Workflow
- **User/job:** operations teams and power users need repeatable, transparent browser workflows.
- **MVP:** compose/record deterministic steps; inspect preview; explicit user start; pause/stop; step results and recovery. FormPilot is a capability within this product.
- **Permissions/data:** activeTab and optional per-site host permissions; D1/D2 workflow/form data; secrets never stored in plaintext.
- **Controls/acceptance:** no silent background actions; origin change halts run; sensitive fields masked; irreversible writes require confirmation/governed approval; malicious page content cannot silently change workflow intent.
- **Dependencies/commercial:** browser SDK, workflow schema/runtime, approved secret boundary and optional Agent Platform. Paid runs/templates/teams hypothesis.

#### EXT-19 — Memory Vault Clipper
- **User/job:** knowledge workers need deliberate capture of web information into Memory Vault with provenance.
- **MVP:** capture selected text/page metadata; preview/edit/tag; send to authenticated Memory Vault API; show result.
- **Permissions/data:** activeTab and user-selected content; D1/D2; no browsing-history collection.
- **Controls/acceptance:** explicit capture only; redact secrets; preserve URL/time; respect workspace ACL; inspect/delete saved material; no silent queue of sensitive text while unauthenticated.
- **Dependencies/commercial:** Memory Vault API, identity and secure token storage. Included or paid knowledge-workspace add-on hypothesis.

### Developer and web-quality utilities

#### EXT-20 — WebDebugger
- **User/job:** frontend developers and QA need to diagnose visible runtime/network/API behaviour.
- **MVP:** developer-invoked panel for supported request/response metadata and errors; default secret redaction; preview/export diagnostic bundle.
- **Permissions/data:** DevTools or narrowly scoped APIs only after browser spike; request bodies may contain D3.
- **Controls/acceptance:** redact Authorization/cookies/tokens by default; local-first; no automatic upload; capture scope visible; no unrelated browsing sessions.
- **Dependencies/commercial:** compatibility harness and redaction engine. Free core; paid team diagnostics hypothesis.

#### EXT-21 — JSON Explorer
- **User/job:** developers/analysts need to inspect JSON locally.
- **MVP:** paste/open selected JSON; format/minify; tree view/path lookup; optional supplied-schema validation; copy/export.
- **Permissions/data:** no host permissions for standalone mode; D1/D2/D3 user input remains local.
- **Controls/acceptance:** safe rendering/no HTML execution; input depth/size limits; malicious-string tests; no payload network transmission.
- **Dependencies/commercial:** shared UI and local validator. Free utility; paid bundle only if demand validates.

#### EXT-22 — StackDetect
- **User/job:** developers, agencies and technical sales need evidence-based technology identification.
- **MVP:** user-triggered inspection of headers, HTML/resource markers and public metadata; group detections; show evidence/confidence.
- **Permissions/data:** activeTab and optional host access; D0/D1.
- **Controls/acceptance:** passive only; no exploit probes; each detection has evidence/confidence; unknown is valid; false-positive fixtures included.
- **Dependencies/commercial:** versioned fingerprint rules. Free basic scan; paid history/agency reports hypothesis.

#### EXT-23 — AccessibilityCheck
- **User/job:** frontend teams, designers and agencies need to find common accessibility barriers.
- **MVP:** user-triggered bounded automated checks; group findings by severity/element; explain rule and remediation; export.
- **Permissions/data:** activeTab and scripting on action; D1 DOM.
- **Controls/acceptance:** sanitize selectors/snippets; fixtures for pass/fail/needs-review; findings link to rule/element; disclose that automated checks do not establish full WCAG conformance.
- **Dependencies/commercial:** rule engine, design system and report export. Free page audit; paid history/team/agency reports hypothesis.

### Search, commerce and market intelligence

#### EXT-24 — SEO Inspector
- **User/job:** SEO specialists and site owners need on-page/technical diagnostics.
- **MVP:** inspect title, description, canonical, headings, robots, structured data, links, image alt and available performance metadata; evidence-backed recommendations.
- **Permissions/data:** activeTab and optional host access; D0/D1.
- **Controls/acceptance:** parse untrusted markup safely; every finding has affected element/evidence; unavailable checks are explicit; no invented rankings or traffic.
- **Dependencies/commercial:** SEO rules catalogue and report schema. Free single-page audit; paid history/projects/agency reports hypothesis.

#### EXT-25 — SERP Intelligence
- **User/job:** SEO consultants and marketers need search-result composition and competitor visibility analysis.
- **MVP:** user-initiated analysis of supported SERP pages; parse organic results/features; group domains/titles; save query/locale/provider/time snapshot.
- **Permissions/data:** activeTab and supported search-provider hosts; query/locale may be D1/D2.
- **Controls/acceptance:** honor terms/rate limits; no CAPTCHA/access-control bypass; disclose personalization and locale limits; provider parser tests and graceful degradation.
- **Dependencies/commercial:** SERP adapters, terms/data-source review and snapshot store. Paid project tracking/competitive analysis hypothesis; provider costs must be validated.

#### EXT-26 — ShopIntel
- **User/job:** e-commerce operators and product researchers need structured product/merchant comparisons.
- **MVP:** extract visible title, merchant, displayed price/currency, availability and selected attributes; compare user-selected products; preserve source/time.
- **Permissions/data:** activeTab and optional supported merchant hosts; D0/D1. No checkout/payment access.
- **Controls/acceptance:** variant/currency explicit; unknown fields stay unknown; prices are time/location dependent; no purchase automation; honor terms/rate limits.
- **Dependencies/commercial:** product schema, merchant adapters, normalization/provenance. Paid watchlists/merchant analytics hypothesis; legal/provider cost review required.

## 4. Permission and data-handling matrix

This is a planning baseline, not a final manifest. Phase 07 must verify exact API support separately for Chrome, Firefox, Edge, Brave, Opera and Safari.

| Capability | Default | Likely use | Mandatory review |
|---|---|---|---|
| activeTab/user gesture | Preferred | Most page inspection/capture products | Ensure action-gated access; no background collection |
| scripting/content scripts | Narrow, product-specific | EXT-02, 09, 17–18, 20, 23–26 | Host scope, isolated world, message validation, CSP |
| optional host permissions | Request only at point of use | EXT-02, 04–06, 11, 13–16, 18, 24–26 | Purpose explanation and revoke path |
| downloads | Not default | EXT-06 only if required | No upload/open by default; browser API validation |
| DevTools/network inspection | Separate developer lane | EXT-20 | Request body sensitivity and default secret redaction |
| storage | Local settings/cache only | Most products | Separate local/cloud data; deletion lifecycle |
| authenticated API | Scoped product-specific | EXT-03, 10–12, 14–19 | Server-side tenant authorization, token lifecycle/revocation |

Data rules:
1. Raw prompts, page content, contacts, diagnostics and security evidence are not telemetry.
2. D3 stays local by default; exceptions require explicit purpose/consent, encryption, access policy and retention controls.
3. Send only normalized fields needed for the selected service.
4. Redact secrets before logs, exports and model/service requests unless a reviewed secure contract requires them.
5. Disclose local/remote processing, retention, sharing and deletion.
6. Derive tenant and authorization from authenticated server identity, never client-supplied metadata.
7. Revoke permissions and disconnect accounts cleanly.

## 5. Threat-model baseline

Every product-specific threat model must address:
- malicious page DOM, hostile instructions, malformed metadata and oversized inputs;
- overbroad permissions, content-script compromise, spoofed messages and unsafe postMessage;
- prompt/page/contact/diagnostic exfiltration, telemetry leakage, insecure exports and cross-tenant access;
- token theft, replay, stale sessions, confused deputy, tenant switching and privilege escalation;
- SSRF, redirect abuse, injection, resource exhaustion, IDOR/BOLA, rate-limit bypass and unsafe file handling where applicable;
- compromised dependencies, mutable CI actions, remote executable code, build provenance and update compromise;
- warning fatigue, false confidence, silent actions, unclear failures and misleading consent.

Required controls: least privilege, origin validation, typed messages, strict schemas, bounded input/output, safe rendering, secure token storage, server-side authorization, rate limits, auditability, redaction, dependency pinning, reproducible tests and explicit failure states. Apply OWASP guidance appropriate to extensions, web applications and agentic systems. Phase 03/10 must map controls to specific requirements; do not claim blanket ASVS or OWASP compliance from this document.

## 6. Shared dependency map

| Shared capability | Contract required | Consumers |
|---|---|---|
| Browser SDK/compatibility | Typed messaging, permissions, storage, lifecycle and test harness | All |
| Design system/accessibility | Consistent warnings, evidence, settings, keyboard and screen-reader patterns | All |
| Identity/tenancy | Authentication, organization, tenant isolation, token lifecycle/revocation | Cloud/team products |
| Product API adapters | Typed schemas, timeout/retry/error semantics | Cloud-backed products |
| Policy/approval | Authoritative decision, approval and capability grants | EXT-03, 17, 18 |
| Evidence/provenance | Source, time, confidence, transformation and export metadata | EXT-01, 07–10, 12, 20, 22–26 |
| Security intelligence | Versioned URL/file/privacy/agent signals | EXT-03–06 |
| Local detection/redaction | Rules, explainability, redaction and fixtures | EXT-02, 04–06, 20 |
| Scheduler/notifications | Jobs, deduplication, retries, retention, delivery prefs | EXT-11 |
| Billing/entitlements/metering | Server-enforced plans, limits and usage | Paid/team products |
| Audit/observability | Correlated, redacted, access-controlled events | Cloud/governed products |

**Authority boundary:** Auctaryn risk/containment signals inform security decisions but do not grant permission. Agent Browser Bridge transports scoped requests/results but cannot approve them. Consequential agent actions require Tinlance Agent Platform authorization and approval.

## 7. Portfolio prioritization

### Scoring method

Initial 1–5 planning estimates, weighted as follows: user value/urgency 25%; strategic fit/ecosystem leverage 20%; revenue hypothesis 15%; delivery feasibility 15%; differentiation 10%; risk manageability 15%. Higher risk score means more manageable risk. This is not market research or customer evidence; revise after interviews, technical spikes and paid pilots.

| ID | Product | Value | Fit | Revenue | Feasibility | Difference | Risk | Weighted / 5 | Band |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| EXT-01 | Site Security Auditor | 4 | 5 | 4 | 4 | 3 | 3 | 3.95 | Initial beta |
| EXT-02 | Aithyrex Guard | 5 | 5 | 5 | 3 | 4 | 3 | 4.25 | Initial beta |
| EXT-03 | Auctaryn Guard | 5 | 5 | 4 | 2 | 5 | 2 | 3.95 | Strategic gated |
| EXT-04 | ThreatFade LinkShield | 4 | 5 | 4 | 3 | 3 | 3 | 3.85 | Near-term |
| EXT-05 | ThreatFade PrivacyGuard | 4 | 4 | 3 | 3 | 3 | 3 | 3.50 | Near-term |
| EXT-06 | ThreatFade DownloadGuard | 4 | 5 | 4 | 2 | 3 | 2 | 3.50 | Gated |
| EXT-07 | Compliance Assistant | 4 | 4 | 4 | 3 | 3 | 2 | 3.50 | Gated |
| EXT-08 | Authorized Security Testing Companion | 4 | 5 | 4 | 3 | 4 | 2 | 3.80 | Specialist |
| EXT-09 | Tinlyt Page Extractor | 4 | 5 | 4 | 4 | 3 | 4 | 4.05 | Initial beta |
| EXT-10 | Tinlyt Verify | 5 | 5 | 4 | 3 | 4 | 3 | 4.15 | Initial beta |
| EXT-11 | Tinlyt Monitor | 4 | 5 | 5 | 3 | 4 | 3 | 4.05 | Initial beta |
| EXT-12 | Tinlyt Research | 5 | 5 | 4 | 3 | 4 | 3 | 4.15 | Near-term |
| EXT-13 | FadeReach Prospect Capture | 4 | 5 | 5 | 4 | 3 | 3 | 4.10 | Initial beta |
| EXT-14 | FadeReach CompanyIntel | 4 | 5 | 4 | 3 | 3 | 3 | 3.85 | Near-term |
| EXT-15 | FadeReach ContactIntel | 4 | 4 | 4 | 2 | 3 | 2 | 3.30 | Gated |
| EXT-16 | FadeReach Outreach Assistant | 4 | 5 | 4 | 3 | 3 | 3 | 3.85 | Near-term |
| EXT-17 | Agent Browser Bridge | 5 | 5 | 5 | 2 | 5 | 2 | 4.10 | Platform-gated |
| EXT-18 | Tinlance Workflow | 4 | 4 | 4 | 2 | 3 | 2 | 3.30 | Platform-gated |
| EXT-19 | Memory Vault Clipper | 3 | 5 | 3 | 4 | 3 | 4 | 3.75 | Near-term |
| EXT-20 | WebDebugger | 4 | 3 | 3 | 4 | 2 | 4 | 3.40 | Utility |
| EXT-21 | JSON Explorer | 3 | 2 | 2 | 5 | 2 | 5 | 3.10 | Utility |
| EXT-22 | StackDetect | 3 | 3 | 3 | 4 | 2 | 4 | 3.15 | Utility |
| EXT-23 | AccessibilityCheck | 4 | 4 | 3 | 4 | 3 | 4 | 3.75 | Near-term |
| EXT-24 | SEO Inspector | 4 | 3 | 4 | 4 | 2 | 4 | 3.60 | Near-term |
| EXT-25 | SERP Intelligence | 4 | 3 | 4 | 2 | 3 | 2 | 3.15 | Data-source gated |
| EXT-26 | ShopIntel | 4 | 3 | 4 | 3 | 3 | 3 | 3.45 | Data-source gated |

### Sequencing interpretation

- Keep the existing first seven slots: Site Security Auditor; Tinlyt Page Extractor; Aithyrex Guard; Tinlyt Verify; Tinlyt Monitor; FadeReach Prospect Capture; Agent Browser Bridge.
- First candidates after those slots: Tinlyt Research, Memory Vault Clipper, AccessibilityCheck, ThreatFade LinkShield, FadeReach CompanyIntel and FadeReach Outreach Assistant. Candidate order only; not yet implementation commitments.
- Auctaryn Guard is strategically important but gated on API/event/auth/tenant contract review and Agent Platform integration design. Do not fold it into Phase 17.
- DownloadGuard, Compliance Assistant, ContactIntel, Workflow, SERP Intelligence and ShopIntel need their specific security, legal, provider or authority dependencies resolved before sequencing.
- JSON Explorer, StackDetect and WebDebugger are potentially lower-cost utilities, but standalone willingness to pay and differentiation must be tested.
- Do not implement all 26 concurrently. Limit active product workstreams and complete each product's release gate before expanding.

## 8. Commercial validation plan

No public price is approved by this document.

### Priority segments and discovery questions

| Segment | Products | Question to validate |
|---|---|---|
| SMB IT/security and web agencies | EXT-01, 04–08, 23 | Which recurring security/reporting workflow is painful enough to fund? |
| Developers/technical teams | EXT-09, 20–22, 23–24 | Which task saves measurable time or prevents expensive defects? |
| AI users/security leaders | EXT-02, 03, 17 | Is the budget owner buying AI data protection, agent runtime governance, or both? |
| Researchers/consultants | EXT-10–12, 19 | Which evidence workflow repeats often and has measurable cost? |
| B2B sales/founders | EXT-13–16 | Which lawful, reliable data improves prospect conversion? |
| SEO/e-commerce operators | EXT-24–26 | Which insight is actionable and sufficiently accurate to replace current tools? |

### Method and evidence threshold

1. Conduct 5–8 structured interviews per priority segment before choosing paid MVPs. Record role, workflow, frequency, current workaround, failure cost and budget owner.
2. Interview on past behaviour and current spend before showing a prototype.
3. Seek behavioural evidence: existing spend, repeated manual work, active workaround, pilot commitment, data-access willingness and security review requirements.
4. Run a limited design-partner pilot with explicit success metrics and no unsupported production claims.
5. Test price ranges through paid-pilot intent or actual purchasing behaviour; hypothetical survey interest is not conversion evidence.
6. Record negative evidence and segment-specific objections; do not generalize small samples.

Pilot metrics: activation to first useful result; time-to-value; repeat usage; task quality/precision/recall where appropriate; false-positive/negative rate; permission comprehension; privacy/safety incidents; four-week retention; paid-pilot conversion; seat expansion; API/data cost and support burden.

## 9. Open decisions and gates

| Decision | Evidence required | Gate |
|---|---|---|
| Auctaryn Guard | Auctaryn API/event/auth/tenant semantics and Agent Platform integration | Auctaryn + Platform architecture review |
| Aithyrex supported AI sites | Typing, paste, submit, upload and DOM compatibility tests | Product spike |
| ThreatFade signals | Reputation contract, freshness, confidence and fallback | ThreatFade service review |
| Download scanning | Hash/metadata/file upload capability, provider terms, retention and economics | Security/privacy review |
| Compliance frameworks | Exact framework/version, control mapping, disclaimers | Legal/product review |
| Authorized testing | Authorization evidence, target/expiry enforcement and permitted actions | Security review |
| Tinlyt Monitor | SSRF, redirects, terms/robots, authenticated pages, rate and retention | Tinlyt architecture review |
| ContactIntel | Data-source rights, lawful basis, suppression/deletion and regional requirements | FadeReach privacy/commercial |
| Agent Browser Bridge | Initial read-only actions, approvals, isolation and audit correlation | Agent Platform review |
| Workflow | Secret manager and human confirmation model | Platform/security review |
| SERP/ShopIntel | Terms, rate limits, licensing, data quality and unit economics | Data-source/commercial review |
| Cross-browser support | Browser/API feature matrix and CI test evidence | Phase 07 |

## 10. Phase 03 architecture inputs

Phase 03 must decide:
1. independent extension packaging vs shared shell, including permission/store implications;
2. browser API common denominator vs browser-specific adapters;
3. content-script isolated-world and messaging trust model;
4. Aithyrex local detection/redaction execution model;
5. API authentication, token storage and tenant binding;
6. Agent Platform authorization/approval contract for Auctaryn Guard and Agent Browser Bridge;
7. evidence/provenance and audit event schemas;
8. privacy-preserving telemetry and retention defaults;
9. secure update/signing/release provenance and rollback;
10. data-provider/licensing boundaries for sales, SERP and commerce.

Also resolve package boundaries, browser SDK, identity/tenancy, product adapters, permission broker, data lifecycle, policy/approval, audit, compatibility, design system and supply-chain controls before product implementation phases depend on them.

## 11. Status and handoff

**Status:** Product requirement baseline drafted for all 26 products; commercial and technical hypotheses documented. Customer interviews, legal review, product-specific threat-model approval and Phase 03 architecture decisions remain outstanding.

**Not complete until:** product owners review briefs; priority-segment discovery is conducted and recorded; Auctaryn/Agent Platform contracts are reviewed; legal/privacy/provider questions are resolved; final ranking is approved.

**Implementation prohibition:** this document alone does not authorize a product to be described as implemented, secure, compatible, production-ready or commercially validated.

**Handoff:** use this as Phase 03 requirements input. Changes to the first seven product phases require a separate evidence-backed roadmap decision.
