# A1–A2 isolated feasibility spike

**Purpose:** prove that the accepted toolchain can install from a clean checkout, build a minimal Next.js App Router surface, and produce narrowly permissioned WXT extension packages for Chromium, Firefox and a Safari packaging input, with independent runtime checks for Edge, Brave and Opera.

This is a disposable architecture spike, not a product implementation, production workspace, public extension, or authorization to begin product development.

## Pinned baseline

- Node.js 24.22.2 (LTS line)
- pnpm 12.16.1
- Turborepo 2.11.10
- Next.js 16.4.5 / React 19.3.1
- WXT 0.21.5
- TypeScript 5.9.3

All direct dependencies are exact-pinned. The generated `pnpm-lock.yaml` must be committed and the CI path must use `pnpm install --frozen-lockfile`.

## Local reproduction

From this directory:

```bash
npm install --global pnpm@12.16.1
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Permission cases

- Read-only: `activeTab` only; reads the active tab title after the user opens the extension action.
- Permission-sensitive: `activeTab` + `scripting`; injects a fixed, packaged function only after the user presses a visible button. It reads only page title and origin. No persistent host permission is requested.

The manifest test asserts exact permissions for Chrome MV3, Firefox MV3 and Safari MV2 output, verifies the official 16/32/48 px PNG files are copied byte-for-byte from the brand asset directory, and rejects broad host access and unrelated sensitive permissions. Both popup surfaces use the supplied Ink/Lime/Paper/Mute palette, original mark artwork, a system-font stack, and visible keyboard focus; no remote font or runtime asset fetch is required.

## Explicit limits

- Browser runtime E2E evidence is limited to the explicit fixture tests: Chromium/Firefox keyboard-shortcut `activeTab`/`scripting`, Edge Stable, Brave Stable and Opera Stable. These tests use loopback-only pages and real user-triggered keyboard actions; they are not product-level compatibility certification.
- The read-only Safari MV2 output is packaged, compiled and inspected in a macOS Xcode CI lane, including app/`.appex` bundle and effective-manifest checks. Signing, notarization, App Store Connect submission/review and Safari runtime testing remain unperformed; WXT does not automate Safari publishing.
- This does not prove the first-seven products' compatibility, performance, privacy or store acceptance.
- Do not copy this spike into production without a separate reviewed implementation plan.
