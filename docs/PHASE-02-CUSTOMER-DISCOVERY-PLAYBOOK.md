# Phase 02 — Customer Discovery and Commercial Validation Playbook

**Status:** Research protocol; no interviews are represented as completed  
**Date:** 2026-11-04  
**Parent:** [Product requirements](PHASE-02-PRODUCT-REQUIREMENTS.md)  
**Desk research:** [Competitive landscape](PHASE-02-COMPETITIVE-VALIDATION.md)

## 1. Purpose

Turn the Phase 02 product hypotheses into evidence about user pain, current alternatives, buying authority, willingness to adopt and willingness to pay. This playbook is a research instrument. It does not claim that participants have been recruited or interviewed.

## 2. Research principles

- Interview about past behaviour, not hypothetical enthusiasm.
- Ask what happened the last time the problem occurred, what it cost and what workaround was used.
- Do not pitch Tinlance products before understanding the current workflow.
- Do not ask participants to disclose secrets, customer records, private prompts or regulated data.
- Record exact participant role and segment, but obtain consent before storing names, contact details or quotations.
- Separate observed evidence, participant opinion, interviewer interpretation and assumptions.
- Record disconfirming evidence and reasons not to build.
- Do not treat free beta sign-ups, compliments or survey interest as proof of willingness to pay.

## 3. Interview plan

**Recommended first wave:** 30–40 interviews across the priority segments, then narrow to the two or three strongest product opportunities. The target is a planning recommendation, not a statistical sample.

| Segment | First-wave target | Products | Buyer/user distinction |
|---|---:|---|---|
| SMB IT/security and web agencies | 6–8 | EXT-01, 04–08, 23 | User may be developer/consultant; buyer may be owner or security lead |
| AI users and security leaders | 6–8 | EXT-02, 03, 17 | Individual user vs CISO/IT/security budget owner |
| Researchers, analysts and consultants | 5–6 | EXT-09–12, 19 | Daily user vs team/department buyer |
| B2B sales and founders | 5–6 | EXT-13–16 | SDR/AE user vs revenue leader/founder |
| Developers and technical teams | 4–6 | EXT-20–23 | Developer/QA user vs engineering manager |
| SEO and e-commerce operators | 4–6 | EXT-24–26 | Practitioner user vs agency/merchant owner |

Recruit participants who currently experience the workflow. Avoid recruiting only friends, existing supporters or people already committed to Tinlance.

## 4. 30-minute interview structure

1. **Context (3 min):** role, team, workflow and decision authority.
2. **Recent incident/workflow (8 min):** last real occurrence, steps, frequency, consequence and workaround.
3. **Existing alternatives (5 min):** tools, manual work, internal scripts, vendor spend and reasons for dissatisfaction.
4. **Impact (5 min):** time, money, risk, missed revenue, errors or compliance burden.
5. **Buying process (4 min):** budget owner, approval, security/legal review, procurement and switching cost.
6. **Prototype reaction (3 min, optional):** only after the problem interview; test comprehension and workflow fit.
7. **Close (2 min):** ask what was missed and whether they would consider a concrete follow-up/pilot.

## 5. Core non-leading questions

Use these across segments:
- Walk me through the last time you did this.
- What triggered it?
- What steps did you take, in order?
- Which part took the most time or caused the most uncertainty?
- What happened when it went wrong?
- How often has this happened in the last 30 or 90 days?
- What do you use today? What do you pay for it?
- What have you tried and stopped using? Why?
- Who else is involved or affected?
- Who would approve a purchase?
- What evidence would your security, legal or procurement team require?
- What would make you reject a tool in this category?
- Have you allocated budget to solve this already? If yes, how much and when?
- What would a successful pilot need to demonstrate?

Avoid: “Would you use this?”, “Do you like this idea?”, “Would you pay $X?” as the primary evidence. If discussing price, anchor it to current spend, quantified impact and an actual pilot offer.

## 6. Segment-specific probes

### AI interaction security — Aithyrex Guard
- Which AI websites or assistants are approved or used informally?
- What sensitive information has policy prohibited users from submitting?
- How is AI use governed today: training, DLP, endpoint controls, browser controls or policy?
- Have accidental disclosures occurred? How were they detected and handled?
- Which actions are acceptable: warn, redact, block, allow with reason, or administrator approval?
- What false-positive rate would make users disable the tool?
- Which interaction paths matter: typing, paste, file upload, generated output, or internal AI sites?
- Who owns budget: security, IT, privacy, legal or business unit?

### Agent runtime security — Auctaryn Guard
- Which agents are deployed, where do they run and what tools/MCP servers can they call?
- How are runtime events, context integrity and tool risks observed today?
- What incidents or near misses have occurred?
- What is the required evidence for containment or intervention?
- Which console/workflow do operators use today?
- Which Auctaryn signals are actionable and which are noisy?
- Who authorizes a block, pause or containment action?
- What must remain in the Agent Platform rather than in a browser extension?

### Web security/privacy — Site Security Auditor and ThreatFade
- Which websites are assessed and how often?
- Which checks are performed manually or by current scanners?
- How are findings verified and prioritized?
- What false positives are most costly?
- Which controls are already provided by endpoint/browser security products?
- Would evidence-rich remediation reports change a purchase or agency workflow?
- Is a separate extension preferred over a unified ThreatFade interface?

### Tinlyt research and monitoring
- How do users collect sources and preserve provenance?
- How are claims checked and contradictory sources handled?
- What changes are monitored and how often?
- What makes an alert actionable rather than noise?
- How are source snapshots retained, shared and deleted?
- What is the cost of a missed change or an unsupported claim?

### FadeReach sales intelligence
- How are target accounts and contacts found today?
- Which data fields are essential and how is accuracy checked?
- Which sources are permitted by company policy and provider contracts?
- What does current enrichment cost per usable record?
- What happens when records are stale, wrong or suppressed?
- Which CRM is used and what permissions are acceptable?
- Does company intelligence create more value than raw contact reveal?

### Developer, SEO and commerce utilities
- Which browser tools are used weekly and why?
- What is already free in browser DevTools or existing extensions?
- Which task remains painful despite current tools?
- What data source/API is needed and what does it cost?
- Would this be a standalone paid product, a free acquisition tool or a feature inside a suite?
- What accuracy, compatibility and report quality are expected?

## 7. Evidence capture template

For every interview, create one record with:
- Participant code (not name by default), role, company size band, industry and geography.
- User/buyer/champion/blocker classification.
- Product hypotheses discussed.
- Last real occurrence and workflow summary.
- Frequency and impact (quantified where possible).
- Current workaround/tools and spend.
- Evidence quote (only with consent) and source/notes.
- Security, privacy, legal, procurement and integration constraints.
- Buying trigger, budget owner and purchasing horizon.
- Pilot interest and concrete next step.
- Strongest disconfirming evidence.
- Interviewer confidence and unresolved assumptions.

Do not store secrets, full prompts, customer PII or confidential records in the research log.

## 8. Opportunity scorecard

Score each product/segment pair 0–5 on:
1. Problem frequency.
2. Severity/cost of the problem.
3. Current workaround spend or effort.
4. Identified budget owner.
5. Adoption urgency.
6. Access to users and distribution.
7. Technical feasibility.
8. Legal/data-source feasibility.
9. Differentiation versus existing alternatives.
10. Pilot commitment strength.

Keep raw scores and interview evidence. Do not average away major blockers: a product with strong pain but no lawful data supply or no safe enforcement boundary remains gated.

### Evidence strength

- **E0 — Assumption:** internal belief or desk research only.
- **E1 — Anecdote:** one participant reports a problem, not yet repeated.
- **E2 — Pattern:** repeated problem across multiple independent target users.
- **E3 — Behaviour:** users demonstrate current spend, repeated workaround or measurable cost.
- **E4 — Commitment:** design partner provides access, time, data under agreement or a pilot commitment.
- **E5 — Commercial proof:** paid pilot, purchase or renewal.

A product should not be described as commercially validated below E4; pricing and willingness to pay require E5 evidence.

## 9. Pilot entry criteria

A product can enter a design-partner pilot only when:
- one clear target segment and primary workflow are selected;
- MVP boundaries and unsupported cases are documented;
- security/privacy threat model and data processing are reviewed;
- data/provider rights and API costs are known;
- success and failure metrics are defined before the pilot;
- support, incident escalation and deletion procedures exist;
- participant consent, terms and pilot agreement are in place.

## 10. Decision record template

After each research wave, record:
- Decision: proceed / narrow / merge / defer / stop.
- Product and segment.
- Evidence level (E0–E5).
- Number and type of participants.
- Repeated pains and quantified impacts.
- Current alternatives and competitive gaps.
- Buyer, budget and buying process.
- Pilot commitments and objections.
- Security/legal/data-source blockers.
- Updated priority score and rationale.
- Owner, next experiment and decision date.

## 11. Current execution status

No interviews, customer commitments, paid pilots or purchase validation are claimed in this document. The next operational task is participant recruitment and execution of the first interview wave. Update this file with dated evidence only after interviews actually occur.
