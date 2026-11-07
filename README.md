# Tinlance Extensions

A unified cross-browser extension ecosystem by Tinlance, delivering intelligence, cybersecurity, research, automation, and governed AI-agent capabilities across Chrome, Firefox, Edge, Brave, Opera, and Safari.

**Tagline:** Intelligence. Security. Automation. Everywhere.

## Project documentation

- [Master system architecture](docs/SYSTEM-ARCHITECTURE.md)
- [Final consolidated phase plan](docs/FINAL-PHASE-PLAN.md) — controlling programme index for review
- [Master delivery roadmap](docs/MASTER-ROADMAP.md)
- [Canonical product catalogue — 26 products](docs/PRODUCT-CATALOGUE.md)
- [Four proposal decisions, dependencies and validation gates](docs/FOUR-PROPOSAL-DECISIONS.md)
- [Phase 02 product requirements and prioritization](docs/PHASE-02-PRODUCT-REQUIREMENTS.md)
- [Phase 02 closeout audit and Phase 03 architecture review](docs/PHASE-02-CLOSEOUT-AND-PHASE-03-ARCHITECTURE-REVIEW.md)
- [Phase 02 evidence and A1–A7 feasibility review](docs/PHASE-02-EVIDENCE-AND-FEASIBILITY-REVIEW.md)
- [Phase 02 competitive landscape and validation](docs/PHASE-02-COMPETITIVE-VALIDATION.md)
- [Phase 02 customer discovery playbook](docs/PHASE-02-CUSTOMER-DISCOVERY-PLAYBOOK.md)
- [Phase 0–1 forensic baseline and closeout evidence](docs/PHASE-0-1-BASELINE.md)
- [Security policy](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)

## Project status

The architecture and roadmap documents describe the intended system and delivery plan. They are not evidence that the listed products or production services have been released. Phase 0 and Phase 01 are closed for their documented repository scope. Phase 02 has a reconciled documentary baseline, but customer discovery, product-owner sign-offs, product-specific threat models, legal/provider reviews and commercial proof remain open. ADRs 0003–0014 were accepted and merged through PR #17. A1 passed through the isolated reproducible toolchain spike. A2 remains partial: Chrome/Firefox MV3 builds and least-privilege manifest checks pass; PR #30 adds a real Chromium MV3 popup/runtime check, service-worker termination and event-driven restart proof, and successful Safari Xcode packaging/project validation. PR #32 adds a real Chromium keyboard-shortcut `activeTab`/`scripting` runtime test using a loopback fixture, with exact-head Repository Quality and A1–A2 workflows green. Firefox runtime, Safari runtime/signing and store validation remain open. A5 is research-supported but not executable; A3 is partial, A4 is partial, and A6/A7 are blocked. The isolated spike is not a production product workspace. No production product extension, backend API/worker, MCP service or deployment is implemented. No infrastructure spend is authorized.

The four-proposal decision record approves portfolio disposition and validation sequencing only. It does not authorize implementation or establish commercial, technical, legal or security validation.

## Product principle

Each extension should have a clear, narrow purpose and be independently installable and releasable. Shared platform services provide common identity, permissions, security, telemetry, distribution and integration capabilities.

Tinlance Extensions will also provide a shared remote MCP integration for supported AI clients. The MCP gateway is an integration boundary; product services remain authoritative for product behaviour, and the Tinlance Agent Platform remains authoritative for governed execution and approvals.
