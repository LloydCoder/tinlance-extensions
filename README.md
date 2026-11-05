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
- [Phase 02 competitive landscape and validation](docs/PHASE-02-COMPETITIVE-VALIDATION.md)
- [Phase 02 customer discovery playbook](docs/PHASE-02-CUSTOMER-DISCOVERY-PLAYBOOK.md)
- [Phase 0–1 forensic baseline and closeout evidence](docs/PHASE-0-1-BASELINE.md)
- [Security policy](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)

## Project status

The architecture and roadmap documents describe the intended system and delivery plan. They are not evidence that the listed applications, services, MCP endpoint, integrations, browser packages, or marketplace listings have been implemented or released. Phase 0 (repository foundation) and Phase 01 (repository forensic baseline) are closed for their documented repository scope, with CI passing on the merged main commit. Owner-controlled GitHub security settings remain an administrative verification gate; application runtime and product readiness remain unimplemented. The Phase 02 documentary audit is complete but its customer, ownership, legal/provider and product-security exit gates remain open. Phase 03 ADRs 0003–0014 are proposed for owner review; architecture approval and implementation authorization remain pending.

The four-proposal decision record approves portfolio disposition and validation sequencing only. It does not authorize implementation or establish commercial, technical, legal or security validation.

## Product principle

Each extension should have a clear, narrow purpose and be independently installable and releasable. Shared platform services provide common identity, permissions, security, telemetry, distribution and integration capabilities.

Tinlance Extensions will also provide a shared remote MCP integration for supported AI clients. The MCP gateway is an integration boundary; product services remain authoritative for product behaviour, and the Tinlance Agent Platform remains authoritative for governed execution and approvals.
