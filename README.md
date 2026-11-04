# Tinlance Extensions

A unified cross-browser extension ecosystem by Tinlance, delivering intelligence, cybersecurity, research, automation, and governed AI-agent capabilities across Chrome, Firefox, Edge, Brave, Opera, and Safari.

**Tagline:** Intelligence. Security. Automation. Everywhere.

## Project documentation

- [Master system architecture](docs/SYSTEM-ARCHITECTURE.md)
- [Master delivery roadmap](docs/MASTER-ROADMAP.md)
- [Phase 0–1 forensic baseline and closeout evidence](docs/PHASE-0-1-BASELINE.md)
- [Security policy](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)

## Project status

The architecture and roadmap documents describe the intended system and delivery plan. They are not evidence that the listed applications, services, MCP endpoint, integrations, browser packages, or marketplace listings have been implemented or released. The Phase 0–1 report records the original repository baseline and the foundation controls added in the current change set; application runtime and product readiness remain unimplemented.

## Product principle

Each extension should have a clear, narrow purpose and be independently installable and releasable. Shared platform services provide common identity, permissions, security, telemetry, distribution and integration capabilities.

Tinlance Extensions will also provide a shared remote MCP integration for supported AI clients. The MCP gateway is an integration boundary; product services remain authoritative for product behaviour, and the Tinlance Agent Platform remains authoritative for governed execution and approvals.
