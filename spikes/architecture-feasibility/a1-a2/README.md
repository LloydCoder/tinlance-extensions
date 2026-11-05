# A1–A2 isolated feasibility spike

**Purpose:** prove that the accepted toolchain can install from a clean checkout, build a minimal Next.js App Router surface, and produce two narrowly permissioned WXT extension packages for Chromium and Firefox.

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

The manifest test asserts exact permissions for both Chrome MV3 and Firefox MV3 output and rejects broad host access and unrelated sensitive permissions.

## Explicit limits

- No browser runtime E2E has been executed by this spike.
- Safari requires a separate macOS/Xcode packaging and signing lane; WXT does not automate Safari publishing.
- This does not prove the first-seven products' compatibility, performance, privacy or store acceptance.
- Do not copy this spike into production without a separate reviewed implementation plan.
