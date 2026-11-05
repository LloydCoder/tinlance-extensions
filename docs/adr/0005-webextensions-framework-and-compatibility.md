# ADR 0005: WebExtensions framework and compatibility

- **Status:** Accepted — approved by the decision owner on 2026-11-05
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited
- **Approval record:** Explicit owner confirmation in the Tinlance Extensions project conversation on 2026-11-05.

## Context

The product catalogue needs independently installable extensions across Chromium and Firefox, with Safari as a separate packaging target. Browser API differences and permission prompts are security and release concerns.

## Proposed decision

Use **WXT with TypeScript** as the shared WebExtensions build framework, behind a project-owned browser adapter/capability layer. Keep one independently buildable package per extension and shared packages for UI/contracts/security primitives. Prioritize tested Chrome/Edge and Firefox lanes. Treat Brave and Opera as separately verified Chromium-derived targets. Treat Safari as a distinct Xcode/native-wrapper packaging, signing and review lane; do not promise automatic WXT Safari publishing.

## Security constraints

- Least-privilege permissions; optional host permissions at point of use.
- Isolated content scripts and schema-validated extension messaging.
- Packaged executable code only; no remotely hosted executable JavaScript.
- No default access to cookies, passwords, session tokens or all-site browsing history.
- Explicit origin/tab/frame validation and safe handling of hostile DOM content.

## Alternatives considered

- Hand-maintained browser build system: maximum control but more duplicated packaging logic.
- Plasmo or custom Vite-based tooling: viable alternatives; WXT's browser targets and module model make it the preferred spike candidate.

## Acceptance evidence

Build at least one read-only and one permission-sensitive representative extension for Chrome/Edge and Firefox; test API differences, service-worker lifecycle, optional permission UX, CSP, store packaging and upgrade behaviour. Document Safari packaging and signing separately before claiming support.
