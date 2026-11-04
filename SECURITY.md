# Security Policy

## Scope

This repository contains the Tinlance Extensions platform and its planned browser-extension, web, integration, and MCP components. A roadmap item is not a deployed service or supported security control.

## Reporting a vulnerability

Do not publish exploitable details in a public issue or pull request. Report suspected vulnerabilities privately to the repository owner through GitHub's private vulnerability reporting feature when available. Include:

- affected component, version, commit, and deployment (if applicable);
- impact and realistic attack prerequisites;
- reproducible steps or a minimal proof of concept;
- logs or artifacts with credentials and personal data removed.

Do not access, modify, or retain data that is not yours. Do not perform denial-of-service, social engineering, or destructive testing.

## Response expectations

Reports will be triaged for validity, severity, affected versions, and exploitability. Acknowledgement and remediation timelines are not guaranteed until a supported security response process is staffed and published.

## Secure development requirements

- Never commit secrets, tokens, private keys, session cookies, or production data.
- Use least-privilege permissions and request optional browser host permissions only when needed.
- Treat webpage content, extension messages, imported files, and MCP tool output as untrusted input.
- Do not execute remotely hosted code in browser extension packages.
- Do not treat prompt-injection detection as an authorization boundary.
- Bind authorization to authenticated identity, tenant, capability, and resource; do not trust client-supplied tenant identifiers.
- Keep browser credentials and cookies outside agent-visible payloads.
- Validate origins for network-exposed MCP transports and authenticate protected endpoints.
- Redact secrets and personal data from logs, traces, telemetry, and test fixtures.
- Record security-relevant changes and maintain regression tests for fixed vulnerabilities.

## Current status

This policy describes intended repository handling. It does not imply that a staffed security operations function, production endpoint, or vulnerability-response SLA is currently active.
