# A5 — MCP 2026-07-28 SDK and Conformance Plan

**Status:** SDK selection and isolated SDK v2 conformance spike implemented; Gate 0 and real-client matrix remain open.
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


## 9. Executed Gate 0 evidence — 2026-11-08

The isolated conformance spike is now committed under `spikes/architecture-feasibility/a5-mcp-conformance/`.

- **PR #77** introduced the pinned official SDK v2.4.0 server/client fixture, synthetic bearer verification, strict read-only tool schema, in-process protocol negotiation, and negative checks for absent/invalid credentials, untrusted Host/Origin and oversized bodies. It merged to `main` as `e30bdc9a4af08f27bd0095ab95e89ee1af474213`.
- **PR #78** added a committed npm lockfile with integrity hashes, clean `npm ci`, CycloneDX SBOM generation/upload, a real loopback HTTP SDK client test, required tool-scope denial, and bounded streaming body reads. It merged as `d1ca2f39b23c3efab6a7a61cdbd988c32fa0c64e`. Exact-head Repository Quality and A5 checks passed on `b6035be2d445cd76f4a69c3d4394ac2ca28aa7a0`; post-merge Repository Quality [run 42509494533](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42509494533) and A5 [run 42509494411](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42509494411) passed on the merge commit.
- **PR #79** added assertions over the actual loopback HTTP requests: modern protocol version and method metadata are present; `Mcp-Name` is asserted for named operations (`tools/call`, `prompts/get`, `resources/read`); no `Mcp-Session-Id` is used; and the test HTTP adapter streams the incoming body rather than buffering it. It merged as `7e0e4d132d4fa3ed0191dd7ff650cb30fccea594`. Exact-head checks passed on `7fc2d0ad675cb8af0ff8cd122cadfdd81c886bae`; post-merge Repository Quality [run 42509656601](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42509656601) and A5 [run 42509656452](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42509656452) passed on the merge commit.

**Evidence boundary:** this proves the official TypeScript SDK v2.4.0 fixture's in-process and loopback HTTP discovery/tool-call path, synthetic bearer gate, required scope denial, host/origin allowlist behavior, body-size rejection, lockfile reproducibility and SBOM generation. It does not prove production OAuth/JWT/JWKS validation, proxy/DNS-rebinding topology, raw malformed-wire matrix, cancellation/lifecycle abuse coverage, tenant/action-bound Platform authorization in a live deployment, or interoperability with ChatGPT, Claude Desktop, VS Code, Cursor or Codex.

**Gate 0 disposition: PARTIAL / OPEN.** The fixture now covers raw HTTP header/body mismatch and protocol-version negatives, signed test-key resource-server validation, remote JWKS, synthetic Platform purpose contracts, body deadlines/abort, and official client-credentials interoperability. Continue with production issuer/JWKS/revocation, authorization-code PKCE, live Platform no-bypass, lifecycle/cancellation, production proxy topology and external-client matrix. Do not authorize a production MCP endpoint or product adapters from this spike alone.


## 10. Post-PR #79 A5 security and OAuth evidence — 2026-11-08

The current merged checkpoint is `main` commit `da99b5e85e2f83cbbdda2ff028810a259db896d7`.

- **PR #87** published the SDK v2 RFC 9728 path-aware Protected Resource Metadata and RFC 8414 Authorization Server Metadata fixtures, including issuer, PKCE S256 and RFC 9207/CIMD capability declarations. It merged as `633a9691dc52e18aa6d7b8737396d243e2222ba9`. Exact-head and post-merge Repository Quality/A5 checks passed; post-merge runs: [Repository Quality 42510321696](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42510321696), [A5 MCP 42510321697](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42510321697).
- **PR #88** added configurable `jose.createRemoteJWKSet` verification with loopback JWKS positive, unknown-`kid` and invalid-signature cases, plus HTTPS enforcement outside loopback. It merged as `07c6599bdad39e139f9abed7ae62fdaa3de82e17`. Post-merge [Repository Quality 42510466919](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42510466919) and [A5 MCP 42510466893](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42510466893) passed.
- **PR #90** added total body-read deadlines, abort-signal handling, bounded reader cancellation and explicit timeout/abort responses alongside the existing byte limit. It merged as `bad12b34dcd2fb21fb52289fe4219c4258b13949`. Post-merge [Repository Quality 42510603667](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42510603667) and [A5 MCP 42510603625](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42510603625) passed.
- **PR #93** bound the synthetic MCP tool to the shared A3 `extensions-action-v1:` canonical purpose tuple, with exact tenant, subject, tool and resource checks, action scope, cross-service hash vectors, and negative tests. It also rejects empty identity claims. It merged as `62b3806672e00fef493590bc3e07816c185f4e54`. Post-merge [Repository Quality 42511060777](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42511060777) and [A5 MCP 42511060772](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42511060772) passed. This is fixture contract evidence, not a live Platform authorization decision.
- **PR #94** exercised the official SDK `ClientCredentialsProvider` against a synthetic loopback AS: RFC 9728/8414 discovery, `client_secret_basic`, client-credentials grant, RFC 8707 resource binding, remote JWKS validation, MCP tool invocation and per-tool scope step-up. Invalid client secrets are rejected. It merged as `da99b5e85e2f83cbbdda2ff028810a259db896d7`. Exact-head and post-merge checks passed; post-merge [Repository Quality 42511377873](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42511377873) and [A5 MCP 42511377760](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42511377760).

**Evidence boundary:** the fixture now proves official SDK client-credentials interoperability against a synthetic authorization server, including resource discovery, issuer discovery, Basic authentication, resource-bound token issuance, remote JWKS validation and action-scope step-up. It does not provide a production authorization server, production issuer/JWKS trust, key custody/rotation, token revocation/introspection, dynamic client registration, authorization-code PKCE, or real user sign-in.

**Gate 0 remains PARTIAL / OPEN.** Outstanding gates include production OAuth issuer integration and operational key lifecycle, live Agent Platform token/purpose enforcement and resource ownership, production reverse-proxy/Host/Origin/DNS-rebinding controls, in-flight cancellation and replay/idempotency, rate/connection limits, external-client interoperability, and formal tool-risk/security/privacy/architecture approval.

## A5 in-flight cancellation evidence — PRs #96 and #97 (2026-11-08)

- **PR #96** added an official SDK v2 client test proving that an in-flight synthetic read-only tool observes `ctx.mcpReq.signal` and terminates after the client aborts. It merged as `db44fed54d6dc6748f1455205d7976da1c7c7cd0`; exact-head and post-merge A5 MCP / Repository Quality workflows passed. Post-merge runs: [A5 MCP 42526495114](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42526495114) and [Repository Quality 42526495113](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42526495113).
- **PR #97** added a separate real loopback HTTP test. The test adapter maps an aborted incoming request and premature outgoing response close to the web-standard `Request.signal`; the official SDK client's abort cancels the HTTP request, reaches the server handler and terminates the long-running synthetic tool. It merged as `eafb6c23b8dd3e80b649ee4e0ff532ec0d1be7a3`; exact-head and post-merge A5 MCP / Repository Quality workflows passed. Post-merge runs: [A5 MCP 42526665926](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42526665926) and [Repository Quality 42526665980](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42526665980).

**Evidence boundary:** the suite now proves SDK cancellation in-process and through a real loopback HTTP connection plus the explicit Node HTTP test-adapter signal bridge. It does not prove cancellation through a production reverse proxy, ingress/load balancer, serverless runtime, or durable job worker. Production proxy disconnect semantics and worker cancellation remain open; this evidence does not authorize deployment or close A5 Gate 0.
## A5 authorization-code PKCE evidence — PR #99 (2026-11-08)

**PR #99** adds an official MCP SDK v2 `OAuthClientProvider` authorization-code integration fixture. It exercises dynamic client registration, authorization redirect, PKCE S256 challenge/verifier validation, explicit callback state comparison, RFC 9207 authorization-response issuer validation, RFC 8707 resource binding, remote JWKS access-token verification, and an authenticated synthetic MCP tool call. A mismatched callback issuer is rejected before the token endpoint is called.

PR #99 merged as `2cf2056af18f228b2e7dea17fca29e43df7f8b6f`. Exact-head A5 MCP and Repository Quality checks passed; the A5 test suite reported 28 tests passed and 0 failed. Post-merge checks passed: [A5 MCP 42526980970](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42526980970) and [Repository Quality 42526980930](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42526980930).

**Evidence boundary:** the authorization server, registered client, signing keys and user approval are synthetic and ephemeral. This proves the official SDK client-side authorization-code/PKCE interoperability contract against the fixture; it does not prove a production identity provider, real user authentication, secure token persistence, KMS/key custody and rotation, revocation/introspection, production tenant/approval policy or live Platform integration. A5 Gate 0 remains open.
## A5 OAuth negative-case evidence — PR #101 (2026-11-08)

PR #101 strengthens the authorization-code fixture with an explicit callback state guard, a mismatched-state rejection assertion, an invalid PKCE verifier rejection, and a successful retry with the correct verifier. The official SDK's `invalid_grant` retry behavior is recorded and both invalid attempts are verified as rejected. It merged as `36d0a94bd6074b481c3723bbfd22180e3b781967`; exact-head and post-merge A5 MCP / Repository Quality checks passed. Post-merge runs: [A5 MCP 42527262821](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42527262821) and [Repository Quality 42527262823](https://github.com/LloydCoder/tinlance-extensions/actions/runs/42527262823). The suite remains 28 passing tests.

**Boundary:** these are synthetic OAuth protocol tests. Production issuer, secure token storage, revocation, KMS/key lifecycle, live Platform integration and external client certification remain open.