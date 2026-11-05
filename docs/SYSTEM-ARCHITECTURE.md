# Tinlance Extensions — Master System Architecture

**Document status:** Architecture baseline — proposed, not yet implemented or verified  
**Owner:** Tinlance Limited  
**Repository:** https://github.com/LloydCoder/tinlance-extensions  
**Product identity:** Tinlance Extensions  
**Tagline:** Intelligence. Security. Automation. Everywhere.  
**Last updated:** 2026-11-04

> This document is the normative architecture proposal for the Tinlance Extensions ecosystem. A statement in this document is a design requirement, not evidence that the corresponding software, integration, control, listing, or deployment already exists. Implementation status must be established through repository evidence, automated tests, release records, and operational verification.

## 1. Executive architecture decision

Tinlance Extensions is a modular, cross-browser extension ecosystem and distribution platform. It will provide independently installable and releasable browser extensions, a common platform layer, product-specific integrations, and a governed AI integration surface.

The platform has two independent distribution surfaces:

1. **Browser distribution:** Chrome, Firefox, Edge, Brave, Opera, and a separately packaged Safari release lane.
2. **AI and developer distribution:** a shared remote MCP platform, initially distributed through ChatGPT, Claude, Grok, the official MCP Registry, and compatible developer clients where supported.

The platform will initially expose one umbrella **Tinlance Extensions** integration. Product capabilities will be separately discoverable, permissioned, entitled, metered, versioned, and auditable. Specialist connectors may be published later where product-level discovery, customer segmentation, or platform submission requirements justify them. Do not create one directory listing for every proposed extension.

The MCP server is an integration boundary. It is not a replacement for product APIs, product services, identity systems, or the Tinlance Agent Platform's execution authority.

## 2. Product goals and non-goals

### 2.1 Goals

- Deliver independently installable browser extensions from a coherent shared platform.
- Reuse common browser adapters, UI primitives, authentication clients, security controls, telemetry, and release automation.
- Keep each extension's purpose narrow and understandable.
- Expose eligible product capabilities to AI clients through a standards-based remote MCP interface.
- Support user, team, and enterprise governance, including explicit scopes and approval for consequential actions.
- Preserve product ownership boundaries across Tinlyt, Aithyrex, ThreatFade, FadeReach, and the Tinlance Agent Platform.
- Support both self-service and enterprise distribution.
- Make security, privacy, accessibility, reliability, and compatibility measurable release requirements.

### 2.2 Non-goals

- One giant extension that bundles every product and permission.
- Treating MCP as an alternative to normal product APIs.
- Allowing the MCP gateway to become an independent authority for browser actions.
- Treating prompt-injection detection as an authorization or execution boundary.
- Shipping unreleased capabilities as available products.
- Claiming universal browser or AI-client compatibility without a tested compatibility record.
- Executing remote code in browser extensions.
- Collecting or transmitting page contents, credentials, or user data without a documented purpose and appropriate user authorization.

## 3. Product and ownership boundaries

| Domain | Owns | Must not own |
|---|---|---|
| Tinlance Extensions | Browser packaging, extension lifecycle, browser adapters, permissions UX, extension registry, distribution, account-facing platform UX, MCP integration gateway and product adapters | Product-specific authoritative intelligence, security decisions, or Agent Platform execution authority |
| Tinlyt / Tinlance Web Intelligence | Search, fetch, browser intelligence, extraction, verification, evidence, monitoring and research services | Browser extension lifecycle or global agent execution authority |
| Aithyrex | AI-interaction threat detection and associated risk analysis | Authorization to execute actions or a general-purpose browser firewall |
| ThreatFade | Web threat, URL, privacy and website-protection services | Agent execution authority |
| FadeReach | Company, prospect and sales intelligence workflows | Browser identity or global platform authorization |
| Tinlance Agent Platform | Identity-bound authorization, policy evaluation, approvals, capability grants, execution authority, secrets boundaries, sandboxing and authoritative audit | Product-specific research, prospecting or detection logic |
| Agent OS | Agent orchestration, lifecycle and coordination | Granting authority outside Platform policy |
| TADL | Agent declarations and developer-plane descriptions | Runtime authorization |
| SDKs | Typed contracts, transport clients and developer ergonomics | Independent authority or permission escalation |

**Boundary rule:** The browser bridge and MCP adapter submit typed, scoped requests to authoritative services. They do not invent their own approval, policy, secret-handling, or execution system.

## 4. Logical system architecture

### 4.1 Platform layers

1. **Distribution and client layer**
   - Browser stores and managed enterprise browser deployment.
   - ChatGPT, Claude, Grok, Codex, IDE clients, and other MCP-compatible clients.
   - Tinlance web catalogue, account portal, developer portal and documentation.

2. **Experience layer**
   - Individually installable extension UIs.
   - Shared settings, onboarding, permissions explanation and account linking.
   - Optional MCP Apps for interactive client experiences where supported.
   - Skills and documented workflows where the target client supports them.

3. **Integration edge**
   - Public HTTPS MCP endpoint.
   - Streamable HTTP transport as the primary remote transport, subject to the pinned protocol baseline.
   - Protocol negotiation, client compatibility, request validation, routing, timeouts and bounded response handling.
   - No business authorization decisions based solely on client-provided metadata.

4. **Identity and governance**
   - OAuth authorization and resource-server validation.
   - User, organization and service identity.
   - Tenant context, roles, scopes, capability grants and policy checks.
   - Consent, approvals, revocation and account disconnect.
   - Entitlement and usage enforcement.

5. **Capability and product integration**
   - Tool, resource, prompt and capability registry.
   - Product adapters for Tinlyt, Aithyrex, ThreatFade, FadeReach and Developer Tools.
   - Agent Platform adapter for approved governed actions.
   - Versioned typed contracts and product API clients.

6. **Authoritative product services**
   - Each product's own service and data ownership.
   - Agent Platform as the authority for consequential execution.
   - Asynchronous job services for long-running work.

7. **Platform operations**
   - Audit, observability, security monitoring, metering, billing, incident response, release automation, backups and recovery.

### 4.2 Conceptual request flow

`AI client → MCP gateway → authentication → tenant resolution → entitlement check → tool policy check → product adapter → authoritative service → output validation/redaction → audit and metering → AI client`

For consequential actions, the flow must additionally include Agent Platform policy evaluation and any required user or administrator approval. A successful MCP tool invocation is not itself proof that an action was authorized by the Agent Platform.

### 4.3 API and MCP relationship

- Product APIs remain the canonical service interfaces.
- MCP adapters translate between MCP contracts and versioned internal API/SDK contracts.
- Do not put business logic in MCP handlers.
- Do not let MCP tools call databases directly where an authoritative service API exists.
- MCP and browser extension clients use the same entitlement and authorization policies where their risk model is equivalent.
- A product capability must not be exposed through MCP until its service contract, data classification, permissions, failure behaviour and support owner are defined.

## 5. Repository and deployment topology

The monorepo should use pnpm workspaces and Turborepo, subject to an initial toolchain spike and measured build performance.

```text
apps/
  web/                    # Marketing, catalogue, account and developer portal
  api/                    # Modular platform API and control plane
  worker/                 # Asynchronous jobs and scheduled work
  docs-site/              # Public documentation
  extensions/
    <extension-name>/     # Independently buildable WXT browser extension apps
packages/
  contracts/              # Shared runtime schemas and typed contracts
  extension-sdk/
  browser-adapters/
  messaging/
  permission-engine/
  secure-storage/
  auth-client/
  api-client/
  mcp-client/
  agent-platform-client/
  ui/
  design-tokens/
  security-core/
  telemetry/
  evidence/
  test-utils/
integrations/
  tinlyt/
  aithyrex/
  threatfade/
  fadereach/
  agent-platform/
platform/
  extension-registry/
  capability-registry/
  browser-compatibility/
  release-management/
  distribution/
  mcp/
    gateway/
    registry/
    adapters/
    conformance/
schemas/
security/
  threat-models/
  policies/
  sbom/
tests/
  contract/
  integration/
  e2e/
  security/
  compatibility/
infra/
scripts/
store-assets/
docs/
  architecture/
  adr/
  security/
  operations/
  distribution/
.changeset/
```

The exact folder layout may evolve after the repository baseline audit. Keep one authoritative implementation for each domain. In particular, backend business logic belongs in the relevant `apps/api/modules/*` service module or its explicitly owned service package, not in duplicate service trees.

### 5.1 Runtime separation

- Browser extension bundles contain packaged code only; no remotely downloaded executable logic.
- Public web and API workloads are deployed independently where their scaling, security or release requirements differ.
- MCP edge is stateless where possible; session state and long-running job state belong in explicitly designed stores/services.
- Workers handle scheduled monitoring and long-running work; they do not depend on a live MCP connection.
- Safari has a separately tested packaging and signing/release lane.
- Secrets are held in a managed secret store and are never embedded in extension bundles, source maps, client configuration or logs.

## 6. Browser extension architecture

### 6.1 Framework and compatibility

- Proposed framework: WXT with TypeScript, subject to ADR 0005 approval and a reproducible compatibility spike.
- WXT does not automate Safari publishing; Safari requires a separate native wrapper/packaging and signing lane. Do not infer Safari support from Chromium or Firefox builds.
- Use TypeScript with strict compiler settings.
- Use a shared browser adapter layer for browser API differences.
- Keep browser-specific capabilities behind explicit adapters and capability checks.
- Use Manifest V3 where required by target browser policy; document Firefox and Safari-specific differences.
- Maintain a per-extension, per-browser compatibility matrix.
- Safari packaging, signing and review are a separate release lane, not an assumed consequence of Chromium support.

### 6.2 Extension security

- Least-privilege permissions; request optional permissions at point of use.
- Explicit host permissions and narrow origin scope.
- Isolate content scripts from page execution contexts.
- Treat all page content, DOM text, links, metadata and downloaded content as untrusted.
- Use extension messaging schemas and validate sender, origin, tab and frame context.
- Do not expose cookies, passwords, session tokens or private browser storage to AI agents.
- Redact secrets and sensitive data from logs and telemetry.
- Provide clear controls for local processing, cloud processing, retention and deletion.
- No remote executable code or remotely loaded scripts.
- Document permission rationale for every store submission.

## 7. MCP platform architecture

### 7.1 Product decision

Build one shared remote MCP platform with product-specific capability groups. The umbrella listing is **Tinlance Extensions**. Individual products can be separately listed later if there is a concrete distribution or commercial reason.

Proposed endpoint: `https://api.extensions.tinlance.com/mcp`  
Proposed documentation: `https://extensions.tinlance.com/developers/mcp`

These are reserved design targets only. Do not publish them or describe them as live until DNS, TLS, routing, authentication, monitoring and external connectivity have been verified.

### 7.2 MCP protocol baseline

Before implementation, record the exact stable MCP specification revision and supported capability matrix in an ADR. Pin SDK versions and protocol fixtures. The implementation must support protocol version negotiation and must not assume every client supports every optional capability.

Baseline design requirements:

- Streamable HTTP for remote transport.
- Correct initialization and capability negotiation.
- OAuth-based authorization for protected HTTP resources, using current MCP authorization requirements.
- Protected Resource Metadata and authorization-server discovery as applicable.
- Client ID Metadata Documents where supported by the pinned specification; document interoperability fallback for clients with older registration behaviour.
- Explicit handling of origin/host validation and DNS rebinding protections.
- Bounded request sizes, timeouts, concurrency, output sizes and pagination.
- Graceful handling of unsupported optional features.
- Protocol conformance tests against pinned fixtures and representative real clients.

Do not implement draft or experimental protocol features as mandatory dependencies. Tasks, elicitation, sampling, MCP Apps, or other optional capabilities must be capability-negotiated and have safe fallbacks.

### 7.3 MCP primitives

- **Tools:** typed operations with explicit permission, risk and side-effect semantics.
- **Resources:** user-authorized read-only references to reports, evidence, monitoring results and other supported records.
- **Prompts:** reusable, versioned task templates; never treated as security policy.
- **Skills:** optional client-side workflow instructions for supported platforms.
- **MCP Apps:** optional interactive views for supported clients, with strict origin, CSP, message validation and data-minimization controls.
- **Tasks / asynchronous operations:** optional protocol support where available, backed by a platform job API and polling/status fallback.

### 7.4 Tool registry

The registry is the source of truth for exposed capabilities. Each tool definition must include:

- Stable namespaced identifier and version.
- Product and service owner.
- Human-readable title and concise, accurate description.
- Input schema and output schema.
- Permission scopes and tenant requirements.
- Risk classification and side-effect classification.
- Read-only, open-world and destructive annotations where supported.
- Approval requirement and policy reference.
- Timeout, rate and budget class.
- Idempotency behaviour for writes.
- Data classification, retention and logging rules.
- Availability state: planned, internal, beta, production, deprecated or disabled.
- Compatibility and deprecation policy.
- Definition fingerprint and review record.

A change to a tool's description, schema, annotations, permission requirements or side-effect behaviour is a security-relevant change. Fingerprint definitions, review material changes and retain version history. Do not silently broaden a tool's authority.

### 7.5 Initial capability catalogue

These are candidate tool families, not claims of implementation or immediate publication.

| Product group | Candidate capabilities |
|---|---|
| Tinlyt | `search_web`, `fetch_page`, `extract_content`, `research_sources`, `verify_claim`, `save_evidence`, `create_monitor` |
| Aithyrex | `inspect_ai_content`, `analyze_prompt_risk`, `check_sensitive_data` |
| ThreatFade | `check_url_risk`, `inspect_site_security`, `analyze_privacy_signals` |
| FadeReach | `research_company`, `capture_prospect`, `enrich_company`, `draft_outreach` |
| Developer Tools | `inspect_api_response`, `analyze_json`, `detect_technology_stack`, `check_accessibility` |
| Agent Platform | `list_available_capabilities`, `request_browser_action`, `get_execution_status`, `get_audit_record` |

Expose only capabilities that are backed by production-quality services and have a reviewed permission model. Tool names and schemas may change during contract design.

### 7.6 Product adapters

- Each adapter maps MCP requests to typed product API/SDK calls.
- Adapters perform schema validation, output validation, error translation and safe redaction.
- Adapters do not own product business rules or duplicate product data.
- Each adapter declares health, version, owner, dependencies and failure behaviour.
- Product outages must fail closed for writes and return bounded, non-sensitive diagnostic errors.
- No adapter may bypass entitlements or tenant context.

### 7.7 Identity, authorization and consent

Implement:

- OAuth 2.1 security practices and PKCE where applicable.
- Correct issuer, audience, resource and signature validation.
- Authorization-server and protected-resource discovery.
- Short-lived access tokens and secure refresh-token rotation/revocation where supported.
- User and organization identity propagation.
- Tenant isolation on every request and background job.
- Fine-grained product and tool scopes.
- Separate read, write, destructive and execution scopes.
- Explicit consent for data sharing and connection.
- Approval gates for consequential actions.
- Disconnect, revoke, delete and organization offboarding flows.
- Service accounts only for explicitly supported enterprise/developer scenarios.

Never trust client-supplied tenant IDs, user IDs, role claims or approval flags without server-side verification.

### 7.8 Agent Platform and Browser Bridge boundary

The MCP server can discover capabilities and submit a typed request to the Agent Platform. The Agent Platform remains the sole authority for:

- Identity-bound authorization.
- Capability grants and scope validation.
- Policy evaluation.
- Approval requirements and approval records.
- Execution lifecycle and sandbox selection.
- Secret access and credential boundaries.
- Authoritative audit records.

The browser extension is a paired, user-controlled execution surface. It must enforce tab, origin, frame, session and action constraints supplied by the authoritative platform. No AI client or MCP tool can directly obtain browser cookies or credentials. Prompt-injection detection is advisory; the enforcement boundary is policy and execution authorization.

### 7.9 Long-running jobs

For research, monitoring, batch enrichment and audits:

- Submit a job with an idempotency key where applicable.
- Return a job identifier and bounded initial status.
- Support status, progress, cancellation and result retrieval.
- Enforce tenant-level concurrency and budget limits.
- Persist job ownership and authorization context.
- Revalidate entitlements and policy before consequential stages.
- Define expiry, retry, dead-letter and recovery behaviour.
- Avoid reliance on an open MCP connection for job completion.
- Support optional MCP Tasks only when the client negotiates it; retain a conventional job-status fallback.

### 7.10 Usage, billing and entitlements

Tinlance owns the authoritative commercial record. AI directories are distribution channels, not the source of truth for customer billing.

Required controls:

- Product, plan, organization, seat and tool entitlements.
- Per-tool usage events and cost attribution.
- Quotas, concurrency limits, rate limits and budget ceilings.
- Trial, upgrade, downgrade, cancellation and grace-period handling.
- Usage estimates or confirmation for expensive operations.
- Overage policy and hard-stop behaviour.
- Invoice/payment integration and auditable billing adjustments.
- Enterprise contract entitlements and service-account controls.

Metering must be idempotent and reconcile against execution/audit records. Do not charge for failed operations without a documented policy.

## 8. Distribution and developer ecosystem

### 8.1 AI distribution

Maintain independent readiness tracks for:

- ChatGPT app directory and custom MCP connection.
- Claude remote MCP and Connectors Directory.
- Grok custom connectors and enterprise provisioning.
- Official MCP Registry.
- Codex, Claude Code, Cursor, VS Code/GitHub Copilot and other compatible clients.

A custom connector connection is not the same as public marketplace approval. A registry record is not the same as a vendor directory listing. Track each separately.

For every target, maintain a distribution dossier with:
- Eligibility and account requirements.
- Submission workflow and reviewer requirements.
- Verified company/domain identity.
- Listing name, tagline, description, category and icon.
- Privacy policy, terms, support and security URLs.
- Public HTTPS endpoint and OAuth test account where needed.
- Tool annotations, positive and negative test cases.
- Starter prompts and supported-use documentation.
- Country availability and policy attestations.
- Screenshots and MCP App assets where required.
- Submission status, review feedback, release version and re-review triggers.

### 8.2 Official MCP Registry

- Verify control of the Tinlance namespace/domain.
- Maintain accurate server metadata and package identity.
- Publish only after production endpoint and ownership are verified.
- Automate metadata validation and release publication.
- Preserve version history and deprecation records.
- Treat registry metadata as a discovery record, not a security certification or guarantee of client support.

### 8.3 Browser distribution

Maintain separate store/release workflows for Chrome Web Store, Firefox Add-ons, Microsoft Edge Add-ons, Opera Add-ons and Safari through Apple's packaging and distribution process. Each extension has its own permissions rationale, listing assets, privacy disclosures, support link, version, review status and compatibility matrix.

### 8.4 Developer experience

- Versioned API and MCP documentation.
- Quick-start guides per AI client.
- Local development and MCP Inspector workflow.
- Test credentials and sandbox environment.
- Tool reference with schemas, examples, side effects and scopes.
- Error catalogue and troubleshooting.
- SDKs only where they reduce integration friction.
- Changelog, deprecation notices and migration guides.
- Status page and support escalation path.

## 9. Security, privacy and compliance architecture

Security is a continuous engineering and release gate.

### 9.1 Threat model coverage

Threat models must cover:
- Malicious or compromised MCP clients and servers.
- Tool poisoning, tool shadowing and tool definition changes.
- Prompt injection and untrusted tool output.
- Confused deputy and cross-tenant access.
- OAuth token theft, replay, audience confusion and revocation failures.
- SSRF, DNS rebinding, redirect abuse and unsafe URL fetching.
- Browser extension content-script and message-channel compromise.
- Supply-chain compromise, dependency confusion and malicious updates.
- Data exfiltration, secret leakage and unsafe logging.
- Abuse, denial of service, cost exhaustion and quota evasion.
- Unauthorized browser actions and approval bypass.

### 9.2 Required controls

- Default-deny authorization and least privilege.
- Server-side tenant resolution and isolation.
- Strict input/output schemas and output size limits.
- SSRF-resistant URL fetch architecture, egress controls and redirect validation.
- Secret redaction and data minimization.
- Per-tool rate, concurrency and budget controls.
- Replay protection and idempotent writes.
- Immutable or tamper-evident audit events for consequential operations.
- Token rotation, revocation and incident kill switches.
- Dependency pinning, SBOM, provenance and vulnerability scanning.
- Security review for tool schema and permission changes.
- Penetration testing and MCP-specific red-team exercises.
- Retention, export and deletion controls with evidence.
- Incident response, notification and recovery runbooks.

### 9.3 Privacy and data governance

For each data category, document purpose, source, legal basis where applicable, processing location, retention, subprocessors, user controls, deletion behaviour and whether data is sent to third-party AI providers. Do not promise that data is never retained or shared unless contracts and implementation prove it.

### 9.4 Assurance references

Use current applicable versions of OWASP ASVS, OWASP guidance for MCP/LLM applications, NIST SSDF, SLSA and relevant browser-store policies. Record the exact versions and control mappings in the security plan; do not claim certification or compliance solely because a checklist exists.

## 10. Reliability and operations

- Service-level objectives defined per public API and product capability.
- Health, readiness and dependency checks.
- Structured logs, metrics and distributed traces with sensitive-data redaction.
- Correlation IDs spanning MCP request, product call, job and audit event.
- Per-client and per-tool latency/error dashboards.
- Circuit breakers, bounded retries and backoff.
- Queue depth and worker health monitoring.
- Backup, restore and disaster-recovery objectives.
- Rollback and feature-flag procedures.
- Incident severity, on-call ownership and escalation.
- Status page and customer communications.
- Capacity and cost budgets, including abuse simulations.

## 11. Quality engineering and release gates

Required test layers:

1. Static analysis, lint, typecheck and dependency policy.
2. Unit tests for policy, schema, adapters and entitlement decisions.
3. Contract tests for every product adapter and MCP tool.
4. MCP protocol conformance tests against pinned versions.
5. OAuth and tenant-isolation tests.
6. Browser compatibility and permission tests.
7. End-to-end tests in representative AI clients.
8. Security tests for SSRF, injection, replay, cross-tenant access and approval bypass.
9. Load, soak, fault-injection and cost-exhaustion tests.
10. Accessibility and usability tests for extension and portal UI.
11. Migration, backup and restore tests.
12. Store packaging and release validation.

A release is blocked by unresolved critical/high security findings, tenant isolation failures, authorization bypass, unreviewed destructive tools, broken revocation, data-loss risk, or an unverified production endpoint.

## 12. Architecture decision records required

The current review package proposes ADRs 0003–0014 under `docs/adr/`. They remain proposed until the decision owner records acceptance or rejection. See [Phase 02 Closeout and Phase 03 Architecture Review](PHASE-02-CLOSEOUT-AND-PHASE-03-ARCHITECTURE-REVIEW.md) for the decision matrix and evidence gates.

Create and maintain ADRs for at least:

- Monorepo and workspace tooling.
- WebExtensions framework and browser compatibility.
- Extension permission and isolation model.
- API modularity and service ownership.
- MCP protocol baseline and transport.
- OAuth/resource-server architecture.
- Tool registry and schema fingerprinting.
- Entitlement and usage metering.
- Async job model and optional MCP Tasks.
- MCP Apps and Skills adoption.
- Agent Platform/Browser Bridge authority boundary.
- Registry and marketplace distribution.
- Data retention and observability.
- Release, rollback and supply-chain security.

## 13. Architecture acceptance criteria

The architecture is ready for implementation only when:

- Product/service ownership and boundaries are approved.
- Repository baseline and current implementation state are audited.
- MCP specification revision and client capability matrix are pinned.
- API/MCP boundary and tool contract conventions are approved.
- OAuth, tenant isolation, scopes and revocation design are reviewed.
- Tool registry and schema-change governance are specified.
- Agent Platform authority boundary is explicit and testable.
- Data classification, retention and logging policy are documented.
- Commercial entitlements and metering model are approved.
- Threat models and security requirements are reviewed.
- Browser and AI distribution tracks are separately defined.
- Build, test, deployment and operational ownership are documented.

**Current status:** This file records the proposed architecture. No implementation, external listing, endpoint, security review, compatibility result or production readiness is implied.
