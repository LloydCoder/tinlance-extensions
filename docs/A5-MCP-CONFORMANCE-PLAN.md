# A5 — MCP 2026-07-28 SDK and Conformance Plan

**Status:** SDK selection researched; executable Gate 0 conformance spike and real-client matrix remain open.  
**Date:** 2026-11-08  
**Decision owner:** Tinlance Limited  
**Related ADR:** [ADR 0002 — Remote MCP protocol baseline](adr/0002-mcp-protocol-baseline.md)

> This document selects a maintained SDK line and defines a reproducible test plan. It does not authorize a production MCP endpoint, OAuth deployment, tool registry, product adapter or client listing.

## 1. Protocol and SDK decision

The accepted protocol target remains **MCP specification 2026-07-28** with stateless Streamable HTTP. Use the official TypeScript SDK v2 packages:

| Package | Pin | Purpose |
|---|---:|---|
| `@modelcontextprotocol/server` | `2.4.0` | Official server implementation and Streamable HTTP handler |
| `@modelcontextprotocol/client` | `2.4.0` | Official client and Streamable HTTP client transport |
| `@modelcontextprotocol/core` | `2.4.0` | Transitive protocol/schema package; pin in lockfile |
| `zod` | `4.2.0` | Runtime input/output schema validation used by SDK v2 |
| Node.js | `24.x` in CI; SDK engine floor `>=20` | Reproducible runtime baseline |

The package versions must be exact, not ranges. Commit the package-manager lockfile with integrity hashes and include the SDK packages in the SBOM. Do not use floating tags or install-time version resolution in a release build.

### Explicitly rejected package line

Do **not** use the legacy monolithic `@modelcontextprotocol/sdk` v1 package for this target. Its current v1 maintenance line (1.32.2 at the time of this review) implements through the 2025-11-25 specification; the official SDK documentation states that 2026-07-28 support is in v2's split `@modelcontextprotocol/server` and `@modelcontextprotocol/client` packages. The v1 line is not an interchangeable substitute.

## 2. SDK serving model and security boundary

The official v2 server exposes `createMcpHandler(factory)`, which creates a fresh `McpServer` per HTTP request and returns a web-standard `fetch` handler. This matches the stateless design target and avoids carrying per-client state in a shared server instance.

The SDK handler is **not** the authorization boundary:

- It does not validate bearer tokens or derive identity from an Authorization header.
- A trusted authentication layer must validate the bearer token before invoking the handler and pass verified `authInfo` to `handler.fetch(request, { authInfo })`.
- The per-request server factory may use that verified context, but must not accept tenant or subject identity from tool arguments.
- Host and Origin validation must be mounted before the handler. Localhost DNS-rebinding protections are required for local development; production must use an explicit trusted-host/origin policy.
- Tool annotations are descriptive metadata, not authorization. Consequential operations remain subject to server-side policy, tenant checks, action-bound delegated tokens and explicit approval.

The SDK's in-process test pattern uses a real `Client` with `StreamableHTTPClientTransport` and passes `handler.fetch` as the transport's fetch function. This is the first protocol integration layer; it does not replace real network middleware tests or the external-client compatibility matrix.

## 3. Required Gate 0 conformance layers

| Layer | Required tests | Evidence |
|---|---|---|
| Protocol revision | Server and client negotiate/serve only the selected 2026-07-28 revision; reject unsupported versions; no mixed legacy semantics | Wire fixtures and version-negotiation tests |
| Stateless HTTP | Per-request POST semantics, request-scoped responses, required version/method metadata, no legacy session ID or old GET event stream | Raw HTTP request/response fixtures |
| JSON-RPC | Valid request/response/notification, invalid envelope, malformed JSON, unknown method, invalid params, error codes and content negotiation | Positive and negative fixture suite |
| Tool schemas | Namespaced stable names, strict Zod input schemas, output schemas, size bounds, no unknown keys, typed error result | Client-driven list/call tests |
| Authentication | Missing/invalid/expired/revoked token, wrong issuer/audience/client, missing scope, invalid tenant, invalid signature | Resource-server tests using signed test keys |
| Authorization | Read-only vs consequential tool separation, tenant isolation, approval-required actions, action-bound purpose and no-bypass checks | Negative tests and Platform contract tests |
| Host/origin | Invalid Host, absent/invalid Origin where required, DNS-rebinding attempts, untrusted origin | Network middleware integration tests |
| Lifecycle | Handler shutdown, in-flight cancellation, no cross-request state leakage, bounded request bodies and timeouts | Lifecycle and abuse tests |
| Data handling | Redacted logs, no bearer token forwarding, output minimization, no raw page/prompt content by default | Privacy and security regression tests |
| Interoperability | Real clients listed in the support matrix below, using the exact pinned protocol revision | Per-client evidence records |

### Minimum negative test cases

1. No Authorization header → reject before tool discovery or execution.
2. Invalid signature, expired token, wrong issuer, audience or client → reject.
3. Valid identity but missing capability scope → deny.
4. Tenant A token with Tenant B resource ID → deny without disclosing resource existence.
5. Delegated token for one job/event used against another resource → deny.
6. Replay token used with a different or missing idempotency key → deny.
7. Tool annotation claims read-only while handler attempts a side effect → server-side policy still denies.
8. Invalid/oversized JSON-RPC body, invalid content type or unsupported protocol revision → reject safely.
9. Invalid Host/Origin and localhost DNS-rebinding attempt → reject before handler execution.
10. A client retries after disconnect → no duplicate side effect; durable job/idempotency semantics are verified outside the protocol SDK.

## 4. Tool contract requirements

Each tool must have:

- Stable namespaced name and versioned schema.
- Input and output schemas with explicit bounds and validation.
- Documented side-effect, risk, idempotency and approval requirements.
- Explicit data classification and output-redaction rules.
- Tenant and subject derived only from verified auth context.
- A typed adapter to an approved production service; no direct database access from the MCP handler.
- Contract tests for success, validation failure, authorization denial, timeout, retry and partial failure.

Initial safe conformance fixtures should be synthetic and side-effect-free. Production cancellation, replay, browser actions or external provider delivery must not be wired into the Gate 0 spike until their own A3/A4/A6 gates pass.

## 5. Client compatibility matrix

No client compatibility is claimed by SDK conformance alone.

| Client | Target status | Evidence required |
|---|---|---|
| Official TypeScript SDK v2.4.0 client | First automated client | In-process client/server test plus network transport test |
| OpenAI ChatGPT connector | Candidate target; not tested | Auth, tool discovery/call, schema and error behaviour against a real configured connector |
| Anthropic Claude Desktop | Candidate target; not tested | Remote Streamable HTTP connection, OAuth and tool behaviour |
| VS Code MCP client | Candidate target; not tested | Remote server registration, auth and tool behaviour |
| Cursor | Candidate target; not tested | Remote server registration, auth and tool behaviour |
| Codex CLI/IDE | Candidate target; not tested | Client configuration, auth and tool behaviour |
| MCP Inspector | Diagnostic tool only; not a substitute for a host | Manual protocol inspection and negative-case reproduction |

A client may be listed as supported only after its exact version, platform, protocol revision, authentication method, test date, tested tool set and known limitations are recorded. “MCP compatible” must not be used as a universal claim.

## 6. Implementation sequence

1. Pin exact v2 SDK package versions and commit a lockfile/SBOM.
2. Build an isolated, stateless `createMcpHandler` fixture with synthetic read-only tools.
3. Drive it using the official v2 `Client` and `StreamableHTTPClientTransport`.
4. Add the trusted auth wrapper and test-key resource server; verify `authInfo` is request-scoped.
5. Add raw HTTP, Host/Origin, protocol-version, body-limit and lifecycle tests.
6. Add cross-tenant and action-bound token negative tests using the Platform/Extensions purpose contract.
7. Run the first external-client compatibility tests and publish only evidence-backed support claims.
8. Submit Gate 0 evidence and obtain explicit architecture approval before production gateway or tool adapters are implemented.

## 7. Gate 0 exit criteria

Gate 0 remains **open** until:

- The pinned v2 SDK and lockfile are committed and reviewed.
- All protocol and security negative tests pass.
- Host/Origin and real network middleware are tested, not just the in-process handler.
- The OAuth/resource-server and tenant-isolation design is reviewed.
- The tool catalogue, schemas, annotations, side-effect and approval matrix are approved.
- At least the agreed real-client matrix has evidence.
- Agent Platform no-bypass and action-bound approval integration tests pass.
- Residual risks, operational limits and support claims are approved by the owner.

## 8. Sources

- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [Official TypeScript SDK v2 documentation](https://ts.sdk.modelcontextprotocol.io/v2/)
- [Official SDK HTTP serving guide](https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html)
- [Official SDK authorization guide](https://ts.sdk.modelcontextprotocol.io/v2/serving/authorization.html)
- [Official SDK server testing guide](https://ts.sdk.modelcontextprotocol.io/v2/testing.html)
- [Official `@modelcontextprotocol/server` package](https://www.npmjs.com/package/@modelcontextprotocol/server)
- [Official `@modelcontextprotocol/client` package](https://www.npmjs.com/package/@modelcontextprotocol/client)
- [Legacy v1 package compatibility note](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
