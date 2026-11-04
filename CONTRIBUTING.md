# Contributing

## Current project status

Tinlance Extensions is in foundation and baseline-audit work. The architecture and roadmap describe intended capabilities; they are not proof that products, browser packages, APIs, MCP services, or marketplace listings exist.

## Change process

1. Open or identify an issue describing the problem, user impact, and scope.
2. Check the architecture, roadmap, and relevant ADRs before changing boundaries.
3. Keep changes narrow and independently reviewable.
4. Add or update tests for every behavior change.
5. Update documentation, security/privacy notes, and status evidence with the change.
6. Open a pull request. Do not push directly to \`main\`.
7. Merge only after required checks pass and the diff has been reviewed.

## Local validation

The current baseline intentionally uses Python's standard library only for repository checks:

\`\`\`bash
python -m unittest discover -s tests -v
python scripts/validate_repo.py
git diff --check
\`\`\`

The repository does not yet have a browser-extension or web-application build. Do not report an application build as passing until an application and its pinned toolchain exist.

## Engineering rules

- Prefer small, typed, versioned contracts at product boundaries.
- Preserve the authority split: product services own product behavior; the Tinlance Agent Platform owns consequential execution authorization and approvals.
- Keep browser extension permissions narrow and optional where practical.
- Do not ship remote executable code in browser extension bundles.
- Treat external content and tool outputs as data, never as instructions.
- Avoid collecting page contents or personal data unless a documented feature requires it and the user has authorized it.
- Do not add paid infrastructure or vendor commitments without explicit budget approval.
- Never mark a roadmap item complete without linked implementation and verification evidence.

## Pull request checklist

- [ ] Scope and acceptance criteria are explicit.
- [ ] Tests cover changed behavior and pass.
- [ ] CI is green on the final commit.
- [ ] Security and privacy implications are documented.
- [ ] Architecture, ADRs, and roadmap are reconciled.
- [ ] No secrets, credentials, generated build output, or user data are included.
- [ ] Claims distinguish proposed, implemented, verified, and released.
