# ADR 0013: Security, privacy, data governance and observability

- **Status:** Accepted — approved by the decision owner on 2026-11-05
- **Date:** 2026-11-05
- **Decision owner:** Tinlance Limited
- **Approval record:** Explicit owner confirmation in the Tinlance Extensions project conversation on 2026-11-05.

## Context

The extensions process public pages, URLs, business records, AI prompts, evidence and potentially sensitive user or enterprise data. Telemetry and administrative visibility can themselves become data-exfiltration paths.

## Proposed decision

Adopt data minimization and purpose limitation as platform defaults. Classify data D0–D3 as defined in Phase 02 requirements. Process sensitive prompt/page content locally where practical. Do not emit raw prompts, page bodies, credentials, cookies, full URLs with sensitive query strings, screenshots or file contents into telemetry by default.

Use structured, tenant-bound security events and audit metadata with correlation IDs, integrity protection, restricted access and explicit retention. Store content/evidence only for a documented user purpose with disclosure, access control, retention, export and deletion paths. Treat web content and tool outputs as untrusted; isolate instructions from evidence.

## Security baseline

Apply secure development and review practices aligned to OWASP ASVS and relevant OWASP Top 10 risks. Threat models must cover extension compromise, malicious pages, prompt injection, SSRF, XSS, CSRF, OAuth token theft, cross-tenant access, supply-chain compromise, replay, approval bypass and resource exhaustion.

## Acceptance evidence

Data-flow maps; D0–D3 inventory; telemetry redaction tests; tenant-scoped audit tests; retention/deletion/export tests; threat models; incident and vulnerability-response procedures; privacy review of every external processor.
