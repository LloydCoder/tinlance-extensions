# ADR 0002: Remote MCP protocol baseline

- **Status:** Proposed baseline for Gate 0 review; not an implementation authorization
- **Date:** 2026-11-04
- **Decision owners:** Tinlance Limited
- **Scope:** Future Tinlance Extensions remote MCP integration

## Context

The MCP specification evolves. The architecture requires a remote integration that can be tested across clients without allowing the gateway to become a product authority or a second execution-authority system.

The official specification published 2026-07-28 updates Streamable HTTP materially: per-request POST semantics, request-scoped response streams, protocol-version metadata, and removal of the former standalone GET stream and protocol-level session model. Older 2025 revisions have different transport behavior.

## Proposed decision

1. Use the official MCP protocol revision **2026-07-28** as the initial implementation target, subject to a Gate 0 compatibility spike and explicit ADR approval before gateway code is written.
2. Prefer Streamable HTTP for remote MCP. Implement the exact selected revision rather than mixing message semantics from 2025-03-26 through 2025-11-25 with 2026-07-28.
3. Validate \`Origin\` on network-exposed endpoints and reject invalid origins. Require HTTPS and authentication for protected capabilities.
4. If HTTP authorization is implemented, follow the selected MCP authorization profile: protected-resource metadata discovery, authorization-server metadata, PKCE, exact redirect URI validation, resource/audience-bound tokens, short-lived access tokens, and secure refresh-token handling.
5. Never forward inbound client tokens to product APIs as token passthrough. Exchange or obtain appropriately scoped downstream credentials through the authoritative identity integration.
6. Keep read-only and consequential capabilities distinct. A tool's schema annotation is descriptive; server-side policy and product authorization remain mandatory.
7. Treat MCP client support as a compatibility matrix, not a universal guarantee. Maintain tests for each supported client and selected protocol revision.
8. Re-evaluate the protocol baseline when the official specification changes; update compatibility tests and migration notes before changing the pinned revision.

## Explicit non-decisions

- This ADR does not implement an MCP endpoint, OAuth server, tool registry, product adapter, browser bridge, or client listing.
- This ADR does not grant MCP authority to execute browser actions.
- This ADR does not claim OpenAI, Anthropic, xAI, or official registry approval.

## Gate 0 evidence required

- Compatibility spike against official protocol examples and a maintained SDK.
- Review of transport version negotiation and error handling.
- OAuth/resource-server threat model and negative tests.
- Tool contract catalogue with side-effect and risk annotations.
- Agent Platform no-bypass integration contract and approval lifecycle.
