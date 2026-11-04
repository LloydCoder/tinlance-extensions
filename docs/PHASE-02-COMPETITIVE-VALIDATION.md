# Phase 02 — Competitive Landscape and Commercial Validation Snapshot

**Research date:** 2026-11-04  
**Status:** Public-source desk research; not customer validation  
**Scope:** Selected competitors and adjacent products for the 26-product portfolio  
**Parent:** [Phase 02 Product Requirements](PHASE-02-PRODUCT-REQUIREMENTS.md)

> This is a directional market scan, not an exhaustive competitor census or market-size report. Vendor pages describe vendor claims. Feature availability, pricing and terms change. Validate in product demos and customer interviews before making comparative or marketing claims.

## 1. Executive findings

1. **Aithyrex Guard is in a crowded and fast-moving category.** Publicly visible products already offer local prompt scanning, redaction, policy controls and browser extensions. Aithyrex cannot win on “detect sensitive text before sending to ChatGPT” alone.
2. **Auctaryn Guard faces an even broader agent-security field.** The Agent Security Index lists 94 tools across six categories and 17 in runtime security/posture alone. Check Point AI Agent Security and Salt Security publicly describe agent discovery, risk assessment, runtime prompt/tool protection and action controls. Auctaryn Guard must be a differentiated operator interface to Auctaryn's own runtime and containment capabilities, not a generic guardrail product.
3. **Tinlyt Monitor, FadeReach, SEO/SERP and browser automation all have established incumbents.** Distill/Visualping, Lusha, Serpstat/SEOquake and Axiom/Ui.Vision/Bardeen already solve adjacent jobs.
4. **The portfolio's strongest strategic advantage is integration across Tinlance's own products and governed platform—not feature parity with incumbents.** Evidence provenance (Tinlyt), security signals (ThreatFade), Auctaryn runtime signals, Agent Platform governance and FadeReach workflows can form a coherent system if contracts and user value are proven.
5. **The 26-product portfolio should not be launched as 26 independent go-to-market motions.** Prioritize the first seven existing beta products, then validate a small number of cross-portfolio adjacencies. Commodity utilities should remain low-cost options or capabilities until a differentiated use case is demonstrated.

## 2. Competitor evidence by product family

### AI interaction protection — EXT-02 Aithyrex Guard

Public examples:
- [Vero](https://veroextension.com/) describes local prompt scanning and placeholder redaction in supported AI tools.
- [Hushbridge](https://hushbridge.com/) describes on-device sensitive-value replacement, a browser extension and SDK/local-proxy options.
- [Penaxtra AI Guardrail](https://penaxtra.com/browser-extension) describes local prompt and attachment inspection, rules and warn/block/redact modes.
- [PromptSentry](https://chromewebstore.google.com/detail/promptsentry/nkekhijhmjlmbmfdbmejcnelgpmdgipi?hl=en) describes local detection, blocking and organization features.
- [Blacksight DLP](https://dlp.blacksight.io/) describes browser extension plus endpoint coverage.
- [Tracehold](https://tracehold.com/) describes allow/observe/redact/block policies.
- [CipherPrompt DLP](https://addons.mozilla.org/en-US/firefox/addon/cipherprompt-dlp/) describes local prompt/file inspection and secret redaction.

**Implication:** local-first detection and redaction are table stakes, not differentiation. Aithyrex needs a measured advantage in low false-positive detection, transparent explanations, reliable adapter coverage, organization policy governance, privacy-preserving admin reporting and clear coverage limits. File/upload protection must be proven per format and AI site; do not claim it from text interception alone.

**Decision:** keep Aithyrex Guard in the first seven because it is strategically important, but require a compatibility matrix, benchmark corpus and false-positive/false-negative targets before public beta. Compete on trustworthy policy UX and quality, not an unsupported “protects every AI tool” claim.

### Agent runtime security — EXT-03 Auctaryn Guard

Public examples:
- [Agent Security Index](https://agentsecurityindex.com/) reports 94 tools across six agent-security categories, including 17 runtime-security/posture tools, with data last updated 2026-11-03.
- [Check Point AI Agent Security documentation](https://docs.lakera.ai/docs/agent-security) describes agent discovery, posture/risk assessment and runtime screening of prompts, outputs, tool calls, tool responses and tool descriptions.
- [Check Point AI Agent Security](https://www.checkpoint.com/ai-security/ai-agent-security/) describes agent discovery, MCP/tool risk, runtime action controls, prompt attacks and data protection.
- [Salt Agentic Security Platform](https://salt.security/platform) describes visibility across agents, MCP/toolkits, APIs, configuration and runtime behaviour.
- [Salt AI Detection and Response announcement](https://salt.security/press-releases/salt-security-extends-its-agentic-security-platform-with-native-ai-detection-and-response) dated 2026-09-22 describes runtime protection spanning prompt injection and downstream MCP/API attacks.

**Implication:** generic agent security dashboards and prompt-injection alerts are not enough. Auctaryn Guard's differentiation must be its deep, verifiable connection to Auctaryn runtime events, context-integrity semantics, containment state and ThreatFade signals, while delegating authorization/approval to the Tinlance Agent Platform.

**Decision:** do not position it as a standalone general-purpose agent-security platform until Auctaryn API/event contracts, customer use cases and measurable runtime outcomes are proven. Start as a first-party operator console and incident workflow for Auctaryn deployments.

### Website security, URL and privacy — EXT-01, EXT-04, EXT-05, EXT-06

Public examples:
- [Malwarebytes Browser Guard](https://chromewebstore.google.com/publisher/malwarebytes/ue8c7c1af2376df2393eb88e6465649c4) advertises malware/scam/phishing and tracker blocking.
- [Privacy Badger](https://chromewebstore.google.com/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp) provides tracker blocking and privacy signals.
- [Extension Auditor](https://extensionauditor.com/) is an adjacent but distinct product for browser-extension inventory, monitoring and enterprise policies.

**Implication:** LinkShield and PrivacyGuard face mature free and paid browser protection incumbents. Site Security Auditor must differentiate with evidence-rich, explainable website configuration checks and practical remediation rather than broad “all-in-one security” promises. DownloadGuard needs a trustworthy reputation source and clear treatment of unknown files; hash lookup alone is not malware scanning.

**Decision:** retain these as distinct product scopes, but validate whether the user wants a separate extension or whether some capabilities belong in a single ThreatFade suite. Do not collapse them until permission and user-job research confirms the packaging decision.

### Website monitoring and research — EXT-10, EXT-11, EXT-12

Public examples:
- [Visualping](https://help.visualping.io/en/articles/4438913) describes scheduled visual, text and code change monitoring with highlighted comparisons and alerts.
- [Distill](https://distill.io/docs/web-monitor/what-is-distill/) describes local and cloud monitoring, with different device-availability requirements.
  
**Implication:** monitoring itself is established. Tinlyt Monitor must differentiate through evidence provenance, structured extraction, change significance, verification and integration with Tinlyt Research—not merely another page-diff alert. Tinlyt Research should connect extraction, source provenance and claim verification into a coherent investigation workflow.

**Decision:** preserve Monitor as its own recurring monitoring job. Test willingness to pay for evidence-quality workflows, alert relevance and team review—not raw check frequency alone.

### Prospecting and contact intelligence — EXT-13, EXT-14, EXT-15, EXT-16

Public examples:
- [Lusha extension](https://www.lusha.com/lusha-extension/) offers in-browser contact/company data and CRM handoff.
- [Lusha pricing FAQ](https://www.lusha.com/faq/) describes credit-based data reveal, including different credit costs for emails and phone numbers.
- [Bardeen pricing/product](https://www.bardeen.ai/pricing) positions workflow automation around GTM tasks including lead generation, CRM updates and outreach.

**Implication:** contact reveal and enrichment are mature categories with data-network advantages, credit economics and compliance expectations. FadeReach should not attempt to outcompete large data vendors on raw email/phone coverage without a defensible data source. It can differentiate on user-directed capture, provenance, company research, workflow context and integration with Tinlance sales operations.

**Decision:** Prospect Capture remains in the first seven. CompanyIntel is a more defensible next adjacency if it can enrich company-level signals with reliable sources. ContactIntel is gated on lawful data supply, provider rights, suppression/deletion and unit economics. Outreach Assistant should remain draft-only and source-grounded.

### SEO, SERP and developer tools — EXT-20 to EXT-25

Public examples:
- [Serpstat Website SEO Checker extension](https://help.serpstat.com/en/articles/14938418-browser-extension) offers SEO parameters, page analysis, domain metrics and API-credit-backed account integration.
- [SEOquake](https://chromewebstore.google.com/detail/seoquake-on-page-seo-chec/akdgnmcogleenhbclghghlkkdndkjdjc) offers free on-page SEO audits and SERP overlays.
  
**Implication:** basic SEO inspection and SERP overlays are commoditized. SEO Inspector should focus on high-quality technical diagnostics and actionable evidence. SERP Intelligence needs a compliant, costed data source and a distinct workflow; parsing the visible search page alone may not support a premium product. WebDebugger/JSON Explorer/StackDetect are useful utilities but face high free-tool expectations.

**Decision:** retain these as portfolio options; do not put them ahead of the initial beta or high-leverage Tinlyt/ThreatFade/FadeReach products without usage and willingness-to-pay evidence.

### Browser workflow automation — EXT-17, EXT-18

Public examples:
- [Axiom.ai pricing](https://axiom.ai/pricing/) lists paid automation tiers and runtime quotas, including published Starter and Pro plans.
- [Ui.Vision](https://ui.vision/) offers browser/desktop automation, reusable macros and MCP integration; [its pricing page](https://ui.vision/rpa/x/pricing) describes a free/open-source edition and paid support/update tiers.

**Implication:** browser automation is a mature category. Tinlance Workflow must distinguish itself through governed, permissioned execution and integration with the Agent Platform rather than a generic macro recorder. Agent Browser Bridge must remain a secure transport/execution surface with server-side authorization and audit.

**Decision:** keep Agent Browser Bridge platform-gated. Treat Workflow as later-stage until secret handling, deterministic execution, human confirmation, origin binding and recovery are designed and tested.

## 3. Commercial priority adjustments

The public-source scan supports these adjustments to the Phase 02 planning model:

1. Lower differentiation assumptions for generic AI prompt DLP, URL/privacy blocking, basic SEO/SERP, contact reveal and generic workflow automation.
2. Preserve high strategic fit for Aithyrex and Auctaryn, but require measurable quality and deep ecosystem integration rather than feature-count comparisons.
3. Prioritize Tinlyt Research as a coherent evidence workflow, not a generic research chatbot.
4. Prioritize CompanyIntel ahead of ContactIntel unless FadeReach secures lawful, reliable contact data supply and positive per-record economics.
5. Keep low-cost developer utilities as optional acquisition/retention tools, not presumed standalone revenue engines.
6. Before pricing any product, calculate gross margin after data-provider, AI inference, scanning, notification, support and infrastructure costs.

The weighted scores in the parent requirements document are **internal hypotheses**. This desk research does not by itself validate demand, pricing, market size or purchase intent. Adjust numerical scores only after the team records the specific evidence and decision rationale.

## 4. Evidence gaps requiring primary research

- No customer interviews or paid pilots have been conducted as part of this desk research.
- Competitor features were reviewed from public pages, not hands-on product testing.
- Public claims about detection accuracy, coverage and compliance were not independently verified.
- Pricing comparisons are incomplete and often not like-for-like.
- No TAM/SAM/SOM estimate is included; a credible estimate requires defined buyer, geography, segment and reachable channel.
- No legal opinion on scraping, personal-data processing, browser-store policy or data-provider licensing is provided.

## 5. Required next actions

1. Interview target users in the six segments listed in Phase 02 requirements.
2. Build a hands-on competitor test matrix for Aithyrex, Auctaryn, Tinlyt Monitor, FadeReach and workflow products.
3. Run technical spikes for Aithyrex AI-site interception, Auctaryn API/event integration, Monitor safe fetching and browser compatibility.
4. Obtain written data-source/provider terms before ContactIntel, SERP Intelligence or ShopIntel implementation.
5. Define pilot success thresholds and cost-to-serve before public pricing.
6. Record each decision in the product backlog and update Phase 02 scores only when supported by evidence.

## 6. Source register

All sources below were accessed on 2026-11-04:
- Vero — https://veroextension.com/
- Hushbridge — https://hushbridge.com/
- Penaxtra — https://penaxtra.com/browser-extension
- PromptSentry — https://chromewebstore.google.com/detail/promptsentry/nkekhijhmjlmbmfdbmejcnelgpmdgipi?hl=en
- Blacksight — https://dlp.blacksight.io/
- Tracehold — https://tracehold.com/
- CipherPrompt — https://addons.mozilla.org/en-US/firefox/addon/cipherprompt-dlp/
- Agent Security Index — https://agentsecurityindex.com/
- Check Point AI Agent Security — https://docs.lakera.ai/docs/agent-security and https://www.checkpoint.com/ai-security/ai-agent-security/
- Salt Security — https://salt.security/platform and https://salt.security/press-releases/salt-security-extends-its-agentic-security-platform-with-native-ai-detection-and-response
- Malwarebytes Browser Guard — https://chromewebstore.google.com/publisher/malwarebytes/ue8c7c1af2376df2393eb88e6465649c4
- Privacy Badger — https://chromewebstore.google.com/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp
- Visualping — https://help.visualping.io/en/articles/4438913
- Distill — https://distill.io/docs/web-monitor/what-is-distill/
- Lusha — https://www.lusha.com/lusha-extension/ and https://www.lusha.com/faq/
- Bardeen — https://www.bardeen.ai/pricing
- Serpstat — https://help.serpstat.com/en/articles/14938418-browser-extension
- SEOquake — https://chromewebstore.google.com/detail/seoquake-on-page-seo-chec/akdgnmcogleenhbclghghlkkdndkjdjc
- Axiom — https://axiom.ai/pricing/
- Ui.Vision — https://ui.vision/ and https://ui.vision/rpa/x/pricing
- Extension Auditor — https://extensionauditor.com/
