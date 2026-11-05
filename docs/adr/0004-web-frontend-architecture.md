# ADR 0004: Web frontend architecture

- **Status:** Proposed — owner approval required
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited

## Context

The ecosystem requires a public marketing/catalogue site, authenticated customer workspace, enterprise administration and developer/MCP portal. These experiences share identity, design tokens, accessibility and navigation but have different authorization boundaries.

## Proposed decision

Use **Next.js App Router with TypeScript** for the owned web experience. Start with one web application and explicit route groups/layout boundaries for public, authenticated workspace, organization administration and developer experiences. Extract separately deployable apps only when isolation, release cadence or scaling justifies it. Establish a shared design-token/component package; enforce WCAG 2.2 AA as the target for owned web surfaces.

## Alternatives considered

- Separate applications from day one: stronger deployment isolation but premature duplication and operational overhead.
- Vite SPA: simpler client application, but requires additional decisions for public content, server rendering and authenticated server boundaries.
- Static-only site: insufficient for the authenticated workspace and administration needs.

## Consequences and controls

- Server-side authorization is mandatory; route hiding is not access control.
- Keep privileged admin APIs separate by authorization policy even if UI shares one deployment.
- Use progressive enhancement and accessible forms/navigation.
- Do not select a hosting vendor in this ADR. Next.js supports Node.js and Docker deployment; deployment topology remains a separate cost/security decision.
- Avoid client bundles containing secrets or privileged service credentials.

## Acceptance evidence

Route/role matrix; server-side authorization tests; keyboard and screen-reader review; responsive tests; build and bundle budgets; authenticated-session and CSRF/origin controls; deploy/rollback proof.
