# ADR 0008: Identity, OAuth and tenant context

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

Browser extensions, web workspaces and remote MCP clients need user and organization identity. Token theft, confused-deputy paths and client-supplied tenant identifiers are high-impact risks.

## Proposed decision

Integrate a standards-based **OpenID Connect/OAuth** identity provider rather than building a custom identity provider or authorization server. Validate issuer, audience/resource, signature, expiry, scopes and authorized client on the server. Resolve tenant membership from trusted server-side identity/organization records; never trust a tenant ID, role or approval flag supplied only by a client.

Keep browser extension tokens short-lived and narrowly scoped; avoid storing refresh tokens in page-accessible storage. Use PKCE and exact redirect URI validation where applicable. Provider selection, data residency and enterprise SSO features remain a separate decision.

## Consequences and controls

- Define user, organization, service identity and membership lifecycle.
- Support disconnect, revocation, account deletion and organization offboarding.
- Separate browser account linking from privileged service credentials.
- Never embed client secrets or server credentials in extension bundles.
- Test token replay, audience confusion, tenant switching and revocation.

## Acceptance evidence

OIDC/OAuth threat model; token lifecycle diagram; negative issuer/audience/signature/scope tests; tenant isolation tests; revocation and offboarding tests; provider exit strategy.
