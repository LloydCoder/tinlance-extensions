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
9. For the 2026-07-28 Gate 0 spike, use the official TypeScript SDK v2 packages `@modelcontextprotocol/server@2.4.0` and `@modelcontextprotocol/client@2.4.0`, with `@modelcontextprotocol/core@2.4.0` and `zod@4.2.0` pinned in the lockfile. The legacy monolithic `@modelcontextprotocol/sdk` v1 line is not compatible with the selected revision.

## Required 2026-07-28 transport semantics

For the pinned 2026-07-28 target, implementation must follow the stateless core rather than legacy session-based examples: do not implement the former initialization/initialized handshake or `Mcp-Session-Id` protocol session model. Use the request-scoped Streamable HTTP flow and the mandatory version/metadata and method/name header requirements defined by the pinned revision. Keep cross-request application state in explicit, server-minted application handles and durable job records. Treat the Tasks capability as an optional extension, not a required core dependency.

## SDK selection evidence

The official TypeScript SDK v2.4.0 is the stable line implementing the 2026-07-28 specification. Its server package exposes a per-request `createMcpHandler` factory and Streamable HTTP handler; its client package provides `Client` and `StreamableHTTPClientTransport`. The official SDK documentation states that the handler does not authenticate tokens or validate Host/Origin itself: a trusted middleware layer must perform those checks and pass verified `authInfo` to the handler. The official in-process test pattern uses the real v2 client against `handler.fetch`; network middleware and real-client tests remain separate Gate 0 requirements.

The legacy `@modelcontextprotocol/sdk` v1 line implements through 2025-11-25 and is not a valid substitute for the selected 2026-07-28 protocol. See [A5-MCP-CONFORMANCE-PLAN.md](../A5-MCP-CONFORMANCE-PLAN.md) for package pins, test layers, client matrix and Gate 0 exit criteria.

## Explicit non-decisions

- This ADR does not implement an MCP endpoint, OAuth server, tool registry, product adapter, browser bridge, or client listing.
- This ADR does not grant MCP authority to execute browser actions.
- This ADR does not claim OpenAI, Anthropic, xAI, or official registry approval.

## Gate 0 evidence required

- Compatibility spike against the official 2026-07-28 specification, including stateless request semantics, mandatory headers, version handling and the exact pinned v2 SDK packages plus committed lockfile.
- Review of transport version negotiation and error handling.
- OAuth/resource-server threat model and negative tests.
- Tool contract catalogue with side-effect and risk annotations.
- Agent Platform no-bypass integration contract and approval lifecycle.
