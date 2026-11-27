# DOCUMENTATION CATALOGUE — every document, its domain, kind, lifecycle and authority, and what a task reads

**Lifecycle:** active · **Authority:** canonical · **Home of:** the classification of every document, and the reading lists by domain · **Catalogue:** `docs/README.md`

**Written in documentation session D2** (26 Nov 2026; `docs/ROADMAP-v2.md` §8, «The scope of the documentation session D2»; the prompt
`docs/prompts/v2-docs-authority-catalogue.md`, D2.2), on `claude/friendly-brahmagupta-lxuqd7`, from `main` `f6834f5`, by the rules of
`docs/DOCUMENTATION-ARCHITECTURE.md` (approved, §8, «Checkpoint D2.1 of the documentation session D2: the rules of classification»).
Every row is a classification proposed by D2 and approved, or not, with D2's work at its final checkpoint; the rows the author decided one
by one cite their §8 row. Where a value is not decided, it says `uncertain` and why (§3).

**What this file is the home of:** each document's classification, and which documents a task of each domain reads. **What it is not the
home of:** the rules that classify (`docs/DOCUMENTATION-ARCHITECTURE.md`); the state of the project (`main`, §8, the commands); who reads
a document's text (`docs/DOCS-DEPENDENCY-MAP.md`, a snapshot). **It holds no state and no count that has another home** (§8, «D1, D.3
question 3»): a prompt's lifecycle is the §8 row cited beside it, and the totals in §4 are derived from the table in §1.

**A new document is added here in the same commit that adds it**, with its header (`docs/DOCUMENTATION-ARCHITECTURE.md` §5).

---

## 1 · The catalogue

The perimeter is `docs/DOCUMENTATION-ARCHITECTURE.md` §0: every tracked `.md` under `docs/`, and `AGENTS.md`, `CLAUDE.md`, `README.md`.
Columns, fixed for a tool (D3, `tools/docs-check.mjs`): **document**; **domain**, **kind**, **lifecycle**, **authority** (the vocabulary of
`docs/DOCUMENTATION-ARCHITECTURE.md` §1–§3 and §7); **home of / points to**; **§8 or reason** — for a closed record the row that closes it
(«scope … → closed by …» for a prompt), for an undecided value the reason, otherwise a note.

| Document | Domain | Kind | Lifecycle | Authority | Home of / points to | §8 or reason |
|---|---|---|---|---|---|---|
| `AGENTS.md` | docs | entry | active | normative | the agents' entry point and its rules | reduced to an entry point in D4 (§8, «D1, D.3 question 1…») |
| `CLAUDE.md` | docs | entry | active | normative | points to `AGENTS.md` |  |
| `docs/AGENTS-ENTRY-MOVES.md` | docs | design | closed | canonical | the moves out of `AGENTS.md` in D4 (D4.1), as of 26 Nov 2026 | Final checkpoint of the documentation session D4 |
| `docs/RECORDS-MAP.md` | docs | design | closed | canonical | the map of the closed records and their references in D6 (D6.1), a snapshot of `e3b7e28` | Final checkpoint of the documentation session D6 |
| `docs/AGENT-CONTRACTS.md` | agents | policy | active | normative | the eighteen contracts |  |
| `docs/AGENT-ROLES.md` | agents | policy | active | normative | the ten agent roles |  |
| `docs/AGENT-RUNBOOK.md` | agents | spec | active | reference | how the Scout is scheduled and run |  |
| `docs/AI-SAFE-BOUNDARIES.md` | evidence | policy | active | normative | the tiers and the absolute prohibitions | §0 and §3 are read always |
| `docs/archive/HANDOVER-headers.md` | decisions | archive | historical | canonical | the superseded headers of `docs/HANDOVER.md` | moved byte for byte on 26 Nov 2026 («D7, D7.2 question 1: what the header of `docs/HANDOVER.md` keeps»); receives each superseded header under `docs/DOCUMENTATION-ARCHITECTURE.md` §7; carries no header |
| `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md` | decisions | archive | historical | canonical | the handover entries of 13–26 Nov 2026, before D4's | moved byte for byte on 26 Nov 2026 («D5, D5.1 question 3: the new archive file's name»); carries no header |
| `docs/archive/HANDOVER-to-2026-11-13.md` | decisions | archive | historical | canonical | the handover entries to 13 Nov 2026 | moved byte for byte on 22 Nov 2026; carries no header |
| `docs/ATTESTATION-FORM.md` | decisions | design | closed | canonical | the attestation's design (22.1), as of 4 Nov 2026 | The final checkpoint of v2 Session 22 = 22.3, 22.4 and 22.5, with the prompt of v2 Session 23 |
| `docs/AUDIT-2026-09-01.md` | docs | audit | closed | canonical | where the architecture is not enforced, 1 Sep 2026 | on `main` `fe404e8` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-09-03.md` | docs | audit | closed | canonical | foundation verification, 3 Sep 2026 | on `main` `179c975` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-10-14.md` | evidence | audit | closed | canonical | the evidence update of 14 Oct 2026 | on `main` `6a2357f` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-10-21.md` | evidence | audit | closed | canonical | the external audit of 21 Oct 2026 | on `main` `29f92c9` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-10-23.md` | evidence | audit | closed | canonical | the audit snapshot of 23 Oct 2026 | on `main` `9891958` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-10-24.md` | control-room | audit | closed | canonical | the author's Control Room audit, checked | The Phase 1 checkpoint = the audit of 24 Oct 2026 closed |
| `docs/AUDIT-2026-10-28.md` | evidence | audit | closed | canonical | the P0 data-integrity audit of 28 Oct 2026 | on `main` `a53c2c2` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-11-04.md` | decisions | audit | closed | canonical | the Phase 4 operational-closure audit of 4 Nov 2026 | on `main` `d4f860e` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-11-11-P1.md` | decisions | audit | closed | canonical | the P1 checkpoint, 11–12 Nov 2026 | on `main` `89c0305` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/AUDIT-2026-11-11.md` | decisions | audit | closed | canonical | P0.1 and P0.4, 11 Nov 2026 | Checkpoint of the session "P0.1 + P0.4" approved |
| `docs/AUTONOMY-AUTHORIZATION-POLICY.md` | agents | policy | active | normative | the executable policy (`agent/policy/` governs) |  |
| `docs/AUTONOMY-POLICY.md` | agents | policy | active | normative | the four autonomy classes |  |
| `docs/BRIEF-v2.md` | decisions | policy | active | normative | the BRIEF v2.0, binding on every v2 session | its header sits above the provenance comment, outside the verbatim text («After D2: the standard header on `docs/BRIEF-v2.md`») |
| `docs/BROWSER-QA.md` | frontend | spec | active | reference | points to `agent/browser/` |  |
| `docs/CHANGE-DETECTOR.md` | agents | spec | active | reference | points to the code of Agent 3 |  |
| `docs/CONTENT-FRESHNESS-POLICY.md` | evidence | policy | active | normative | when content is stale |  |
| `docs/CONTINUOUS-IMPROVEMENT.md` | agents | spec | active | reference | points to `agent/improve/`: the improvement loop and its first run | declares itself binding and says the code governs; reference by «D2, D2.2 question 2: the authority of `docs/CONTINUOUS-IMPROVEMENT.md`» |
| `docs/CONTROL-ROOM.md` | control-room | spec | active | normative | what `.control-room/` is; §12, what it may never do | declares itself binding; §5 is read by `.control-room/selftest.mjs` |
| `docs/CURRENT-ARCHITECTURE.md` | docs | spec | active | canonical | the architecture; §12 the validator baseline | §5 and §12 are read by code |
| `docs/DATA-DEPTH.md` | agents | spec | active | reference | points to the code of Agent 4 |  |
| `docs/DATA-GOVERNANCE.md` | evidence | policy | active | normative | one home per fact; derivation over storage |  |
| `docs/DATA-READINESS.md` | evidence | spec | active | canonical | the dataset inventory and the metric contract MC-1…MC-15 | PV2-01 is closed by «Final checkpoint of PV2-01 approved: A.3–A.5 and the prompt of PV2-02»; the document stays active as the contract's home, by «D2, D2.2 question 3: the lifecycle of `docs/DATA-READINESS.md`» |
| `docs/DEPLOYMENT.md` | publishing | spec | active | reference | the deploy gate and the owner's settings (`agent/release/` governs) |  |
| `docs/DISCOVERABILITY-STRATEGY.md` | publishing | plan | active | canonical | who the site is for and which questions it answers |  |
| `docs/DOCS-DEPENDENCY-MAP.md` | docs | catalogue | active | reference | who reads each document; the anchored sentences (snapshot of `5232941`) | a snapshot: code governs; D3's check keeps it current |
| `docs/DOCS-SIMPLIFICATION-PLAN.md` | docs | plan | active | canonical | the documentation programme D1…D6 |  |
| `docs/DOCUMENTATION-ARCHITECTURE.md` | docs | policy | active | normative | the rules of classification | Checkpoint D2.1 of the documentation session D2: the rules of classification |
| `docs/EDITORIAL-AGENT.md` | agents | spec | active | reference | points to the code of Agent 7 |  |
| `docs/EDITORIAL-AUDIT-PATH.md` | control-room | spec | active | reference | how an editorial audit is run, recorded and read |  |
| `docs/EVIDENCE-MODEL.md` | evidence | spec | active | reference | points to `js/evidence-model.js` and the evidence audit |  |
| `docs/F-18-READING.md` | rules | reading | closed | canonical | F-18 against DMA Art. 3(10), 17 Nov 2026 | Final checkpoint of the F-18 session |
| `docs/FIRST-END-TO-END-AUDIT.md` | agents | run | closed | canonical | the simulated end-to-end cycle (SESSION 24) | on `main` `341ff39` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/FRONTEND-REFERENCES.md` | frontend | reading | closed | canonical | PV2-02: the frontend references, 10 Nov 2026 | Final checkpoint of PV2-02 approved: B.2–B.4 and the prompt of PV2-03 |
| `docs/GAP-PROPOSALS.md` | agents | spec | active | reference | points to the code of Agent 5 |  |
| `docs/GOVERNANCE-PROPOSALS.md` | agents | audit | closed | canonical | the decision corpus measured; seven proposals (SESSION 28) | on `main` `1f47b85` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/HANDOVER.md` | decisions | handover | active | canonical | the previous sessions' state and the branch register | its header is read always |
| `docs/HEALTH-MONITOR.md` | agents | spec | active | reference | points to the code of Agent 10 |  |
| `docs/HOMEPAGE-PRODUCTION-PLAN.md` | frontend | plan | closed | canonical | the homepage plan, as of 12 Nov 2026 | HP-04: the next session |
| `docs/i18n-review/es.md` | i18n | generated | active | reference | points to `i18n/`: the review sheet of the es edition | `node tools/i18n-review.mjs sheet es`; carries no header |
| `docs/i18n-review/fr.md` | i18n | generated | active | reference | points to `i18n/`: the review sheet of the fr edition | `node tools/i18n-review.mjs sheet fr`; carries no header |
| `docs/i18n-review/it.md` | i18n | generated | active | reference | points to `i18n/`: the review sheet of the it edition | `node tools/i18n-review.mjs sheet it`; carries no header |
| `docs/IMPLEMENTATION-QA.md` | agents | spec | active | reference | points to the code of Agent 9 |  |
| `docs/KNOWLEDGE-ARCHITECTURE.md` | agents | spec | active | reference | points to the code of Agent 6 |  |
| `docs/LEGAL-VERIFIER.md` | agents | spec | active | reference | points to the code of Agent 2 |  |
| `docs/LIMITED-AUTONOMY.md` | agents | policy | active | normative | the grant ledger, allowlists and gates (the code governs) |  |
| `docs/METHODOLOGY-NOTE-v2.md` | frontend | design | uncertain | canonical | the methodology section for the map, register and watchlist | written to ship with the map; `network.html` shipped on 23 Nov 2026 and `methodology.html` does not carry it: whether it still ships, and where, is an editorial decision for a later visible session («D2, D2.2 question 4: the lifecycle of `docs/METHODOLOGY-NOTE-v2.md`») |
| `docs/OBSERVABILITY.md` | agents | spec | active | reference | points to the code of the trace model |  |
| `docs/ORCHESTRATOR.md` | agents | spec | active | reference | points to the code of the Orchestrator |  |
| `docs/PHASE-3-AUDIT.md` | decisions | audit | closed | canonical | Phase 3 measured, 3 Nov 2026 | The checkpoint of v2 Session 17.5 = items 17.5.1, 17.5.2 and 17.5.0 |
| `docs/PHASE-4-PLAN.md` | decisions | plan | closed | canonical | Phase 4's exit criteria, as of 4 Nov 2026 | Phase 4 concluded |
| `docs/PHASE-4-SETUP.md` | decisions | plan | closed | canonical | Phase 4's set-up, as of 3 Nov 2026 | Phase 4 concluded |
| `docs/PHASE-5-SETUP.md` | decisions | plan | active | canonical | Phase 5: entry, exit, sessions | Phase 5 opened with G2; no row concludes it |
| `docs/POST-V2.md` | decisions | plan | active | canonical | the plan after the v2 (Stages 2 and 4) |  |
| `docs/PRODUCTION-OPERATING-MODE.md` | agents | spec | active | reference | points to `agent/production/`: the daily cycle and the readiness checklist |  |
| `docs/PROJECT-CONTEXT.md` | docs | spec | active | reference | what the project is; the seven principles (snapshot of `7248290`) | a snapshot (the plan §2): the principles hold, the figures are of `7248290` |
| `docs/prompts/v2-docs-agents-entry.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D4» → closed by «Final checkpoint of the documentation session D4» |
| `docs/prompts/v2-docs-handover.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D5» → closed by «Final checkpoint of the documentation session D5» |
| `docs/prompts/v2-docs-records.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D6» → closed by «Final checkpoint of the documentation session D6» |
| `docs/prompts/v2-docs-buffer.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D7» → closed by «Final checkpoint of the documentation session D7» |
| `docs/prompts/v2-docs-authority-catalogue.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D2» → closed by «Final checkpoint of the documentation session D2» |
| `docs/prompts/v2-docs-check.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D3» → closed by «Final checkpoint of the documentation session D3» |
| `docs/prompts/v2-docs-coherence.md` | docs | prompt | closed | canonical | the session's instructions | scope «The scope of the documentation session D1» → closed by «Final checkpoint of the documentation session D1» |
| `docs/prompts/v2-f-18-dma-immediately.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of the F-18 session» → closed by «Final checkpoint of the F-18 session» |
| `docs/prompts/v2-hp-02-homepage-follow-up.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of HP-02 (the homepage follow-up)» → closed by «HP-02: the next session» |
| `docs/prompts/v2-hp-03-homepage-production-plan.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of HP-03 (the homepage production plan)» → closed by «Final checkpoint of HP-03 approved: the homepage production plan and the prompt of HP-04» |
| `docs/prompts/v2-hp-04-homepage-production.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of HP-04 (the homepage in production: the plan executed)» → closed by «HP-04: the next session» |
| `docs/prompts/v2-pv2-01-data-readiness.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of PV2-01 (Post-v2 A, data readiness)» → closed by «Final checkpoint of PV2-01 approved: A.3–A.5 and the prompt of PV2-02» |
| `docs/prompts/v2-pv2-02-frontend-references.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of PV2-02 (Post-v2 B, frontend references)» → closed by «Final checkpoint of PV2-02 approved: B.2–B.4 and the prompt of PV2-03» |
| `docs/prompts/v2-pv2-03-prototype-editorial.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of PV2-03 (Post-v2 C, the Editorial prototype)» → closed by «Final checkpoint of PV2-03 approved: C.2–C.5 and the prompt of PV2-04» |
| `docs/prompts/v2-pv2-04-prototype-observatory.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of PV2-04 (Post-v2 C, the Policy observatory prototype)» → closed by «Final checkpoint of PV2-04 approved: C.2–C.5 and the prompt of PV2-05» |
| `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of PV2-05 (Post-v2 C, the Hybrid prototype and the selection)» → closed by «Final checkpoint of PV2-05 approved: C.2–C.6, the decision and the prompt of S27» |
| `docs/prompts/v2-rules-maintenance-group-a.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of the rules-maintenance session (group (a))» → closed by «Final checkpoint of the rules-maintenance session, group (a)» |
| `docs/prompts/v2-rules-maintenance-group-b.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of the rules-maintenance session (group (b))» → closed by «Final checkpoint of the rules-maintenance session, group (b)» |
| `docs/prompts/v2-session-10.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 10» → closed by «The checkpoint of v2 Session 10 = items 10.1 and 10.2» |
| `docs/prompts/v2-session-11.md` | decisions | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 11» → closed by «The checkpoint of v2 Session 11 = the closing gate of v2» |
| `docs/prompts/v2-session-12.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 12» → closed by «The checkpoint of v2 Session 12 = items 12.1 and 12.2» |
| `docs/prompts/v2-session-13.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 13» → closed by «The checkpoint of v2 Session 13 = items 13.1, 13.2 and 13.3» |
| `docs/prompts/v2-session-14.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 14» → closed by «The checkpoint of v2 Session 14 = item 14.1» |
| `docs/prompts/v2-session-15.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 15» → closed by «The checkpoint of v2 Session 15 = item 15.1» |
| `docs/prompts/v2-session-16.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 16» → closed by «The checkpoint of v2 Session 16 = item 16.1» |
| `docs/prompts/v2-session-17-5.md` | decisions | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 17.5» → closed by «The checkpoint of v2 Session 17.5 = items 17.5.1, 17.5.2 and 17.5.0» |
| `docs/prompts/v2-session-17.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 17» → closed by «The checkpoint of v2 Session 17 = items 17.1, 17.2 and 17.3» |
| `docs/prompts/v2-session-18.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 18» → closed by «The final checkpoint of v2 Session 18 = item 18.2» |
| `docs/prompts/v2-session-19.md` | publishing | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 19» → closed by «The checkpoint of v2 Session 19 = item 19.1, the site name» |
| `docs/prompts/v2-session-20.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 20» → closed by «The final checkpoint of v2 Session 20 = item 20.2, the rule-maintenance process (item 4.1)» |
| `docs/prompts/v2-session-21.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 21» → closed by «The final checkpoint of v2 Session 21 = 21.3 and 21.4, with the prompt of v2 Session 22» |
| `docs/prompts/v2-session-22.md` | decisions | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 22» → closed by «The final checkpoint of v2 Session 22 = 22.3, 22.4 and 22.5, with the prompt of v2 Session 23» |
| `docs/prompts/v2-session-23.md` | decisions | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 23» → closed by «The final checkpoint of v2 Session 23 = 23.4, with the prompt of v2 Session 24» |
| `docs/prompts/v2-session-24.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 24» → closed by «The final checkpoint of v2 Session 24 = 24.2–24.4, with the prompt of v2 Session 25» |
| `docs/prompts/v2-session-25.md` | rules | prompt | active | canonical | the session's instructions | scope «The scope of v2 Session 25»; opened, stopped at 25.0; its reading is still to come (the milestones of Dec 2026, 25.2) |
| `docs/prompts/v2-session-27.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 27 (Phase 5, the design)» → closed by «Final checkpoint of v2 Session 27 approved: the X5-1 table, the paper test and the prompt of Session 28» |
| `docs/prompts/v2-session-28.md` | rules | prompt | active | canonical | the session's instructions | no scope row: not yet run (it starts after G2 and E5-5) |
| `docs/prompts/v2-session-5.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 5» → closed by «The Part B checkpoint of v2 Session 5» |
| `docs/prompts/v2-session-6.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 6» → closed by «The checkpoint of v2 Session 6 = item 2.3» |
| `docs/prompts/v2-session-7.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 7» → closed by «The checkpoint of v2 Session 7 = item 2.4» |
| `docs/prompts/v2-session-8.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 8» → closed by «The checkpoint of v2 Session 8, part 2: the open findings resolved on the author's request» |
| `docs/prompts/v2-session-9.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of v2 Session 9» → closed by «The checkpoint of v2 Session 9 = item 2.6» |
| `docs/prompts/v2-stage-1-operational-closure.md` | decisions | prompt | closed | canonical | the session's instructions | scope «The scope of Stage 1 (Phase 4's operational closure)» → closed by «Stage 1 concluded: the release gate judged a change that cites a signed human decision, in Actions, and passed» |
| `docs/prompts/v2-track-m-eidas2-milestone.md` | rules | prompt | closed | canonical | the session's instructions | scope «The scope of the Track M session (eidas2 milestone)» → closed by «Final checkpoint of the Track M session (eidas2 milestone)» |
| `docs/prompts/v2-track-m-rules-round-2027-02.md` | rules | prompt | active | canonical | the session's instructions | no scope row: not yet run (before 16–17 Feb 2027) |
| `docs/prompts/v2-trials-network-map-phone.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of the network-map trials session» → closed by «Final checkpoint of the network-map trials session» |
| `docs/prompts/v2-v2c-03-05-arrays.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of the V2C-03…05 session» → closed by «Final checkpoint of the V2C-03…05 session» |
| `docs/prompts/v2-v2c-12-v1-relationships.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of the V2C-12 session» → closed by «Final checkpoint of the V2C-12 session» |
| `docs/prompts/v2-v2c-13-map-checks.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of the V2C-13 session» → closed by «V2C-13, W.4: the next session» |
| `docs/prompts/v2-v2c-17-19-map-nodes.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of the V2C-17…19 session» → closed by «Final checkpoint of the V2C-17…19 session» |
| `docs/prompts/v2-v2c-21-eidas2-actors.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of the V2C-21 session» → closed by «Final checkpoint of the V2C-21 session approved: `eidas2`'s regulated actors and the prompt of V2C-21b» |
| `docs/prompts/v2-v2c-21b-eidas2-provisions.md` | evidence | prompt | closed | canonical | the session's instructions | scope «The scope of the V2C-21b session» → closed by «Final checkpoint of the V2C-21b session approved: `eidas2`'s provisions and the prompt of V2C-12» |
| `docs/prompts/v2-visible-coverage-reading.md` | evidence | prompt | active | canonical | the session's instructions | no scope row: not yet run (where Cellar answers) |
| `docs/prompts/v2-visible-coverage.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of the coverage session» → closed by «Final checkpoint of the coverage session» |
| `docs/prompts/v2-visible-network-map.md` | frontend | prompt | closed | canonical | the session's instructions | scope «The scope of the network-map session» → closed by «Final checkpoint of the network-map session» |
| `docs/PROTOTYPES.md` | frontend | run | closed | canonical | Post-v2 C: the three prototypes measured | Final checkpoint of PV2-05 approved: C.2–C.6, the decision and the prompt of S27 |
| `docs/README.md` | docs | catalogue | active | canonical | the classification of every document, and the reading lists by domain |  |
| `docs/REGULATORY-IMPACT-MAPPING.md` | agents | spec | active | reference | points to the code of Agent 3's impact map |  |
| `docs/ROADMAP-v2.md` | decisions | plan | active | canonical | the v2 plan; §8 every decision |  |
| `docs/RULE-MAINTENANCE.md` | rules | spec | active | canonical | the manual process of rule maintenance |  |
| `docs/RULES-MAINTENANCE-A-READING.md` | rules | reading | closed | canonical | rules maintenance group (a), 17 Nov 2026 | Final checkpoint of the rules-maintenance session, group (a) |
| `docs/RULES-MAINTENANCE-B-READING.md` | rules | reading | closed | canonical | rules maintenance group (b), 18 Nov 2026 | Final checkpoint of the rules-maintenance session, group (b) |
| `docs/SECURITY-VERIFICATION-2026-09-08.md` | control-room | audit | closed | canonical | the adversarial gate of 8 Sep 2026 | on `main` `8f1b411` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/SEO-AUDIT-2026-09-27.md` | publishing | audit | closed | canonical | what a crawler saw, 27 Sep 2026 | on `main` `cc1f7d0` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/SEO-OPERATIONS.md` | publishing | spec | active | reference | what the repository controls in search, and the owner's steps |  |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | agents | run | closed | canonical | the first real-world run (SESSION 25) | on `main` `cdfe375` (no §8 row closes its session; closed by the rule of «D2, D2.2 question 1: the dated records whose session no row of this section closes») |
| `docs/SESSION-ARCHITECTURE.md` | decisions | plan | active | canonical | the order of the work |  |
| `docs/SKILL-MAP.md` | agents | spec | active | reference | the skills in `.agents/skills/` |  |
| `docs/SOURCE-POLICY.md` | evidence | policy | active | normative | what may be cited |  |
| `docs/SOURCE-SCOUT.md` | agents | spec | active | reference | points to the code of Agent 1 |  |
| `docs/TRACK-M-EIDAS2-READING.md` | rules | reading | closed | canonical | Track M, `eidas2`, 23 Nov 2026 | Final checkpoint of the Track M session (eidas2 milestone) |
| `docs/UX-AUDIT.md` | agents | spec | active | reference | points to the code of Agent 8 |  |
| `docs/V2-CLOSURE.md` | decisions | audit | closed | canonical | the v2 measured against the brief, 28 Oct 2026 | The checkpoint of v2 Session 11 = the closing gate of v2 |
| `docs/V2-DATA-DESIGN.md` | evidence | design | active | canonical | the v2 data design (map, triggers, labels, registers) | §1, §2 and §4 built, §3 (status labels) open for the status-labels session; measured, with a dated note, by «After D2: the lifecycle of `docs/V2-DATA-DESIGN.md`, measured» |
| `docs/v2-design/session-10-before-after.md` | evidence | run | closed | canonical | v2 Session 10, 10.2: every note before and after, 28 Oct 2026 | The checkpoint of v2 Session 10 = items 10.1 and 10.2 |
| `docs/V2C-03-05-READING.md` | evidence | reading | closed | canonical | V2C-03…05, 16 Nov 2026 | Final checkpoint of the V2C-03…05 session |
| `docs/V2C-12-READING.md` | evidence | reading | closed | canonical | V2C-12, 15 Nov 2026 | Final checkpoint of the V2C-12 session |
| `docs/V2C-13-MAP-CHECKS.md` | evidence | run | closed | canonical | V2C-13, the map checks, 16 Nov 2026 | V2C-13, W.4: the next session |
| `docs/V2C-17-19-READING.md` | evidence | reading | closed | canonical | V2C-17…19, 17 Nov 2026 | Final checkpoint of the V2C-17…19 session |
| `docs/V2C-21-READING.md` | evidence | reading | closed | canonical | V2C-21, 14 Nov 2026 | Final checkpoint of the V2C-21 session approved: `eidas2`'s regulated actors and the prompt of V2C-21b |
| `docs/V2C-21b-READING.md` | evidence | reading | closed | canonical | V2C-21b, 14 Nov 2026 | Final checkpoint of the V2C-21b session approved: `eidas2`'s provisions and the prompt of V2C-12 |
| `docs/VERIFICATION-INTEGRATION.md` | agents | spec | active | reference | points to the code of the integration adapter |  |
| `docs/VERIFICATION-POLICY.md` | evidence | policy | active | normative | what each validator proves and does not |  |
| `README.md` | docs | account | active | canonical | the author's account; «Known limitations» (red tier) |  |

## 2 · What a task reads, by domain

The **by domain** level of `docs/DOCUMENTATION-ARCHITECTURE.md` §7, which the skill `project-context` will read from here (D4; §8, «D1, D.3
question 2»). **Always**, before these: `docs/AI-SAFE-BOUNDARIES.md` §0 and §3, the header of `docs/HANDOVER.md`, the rules of `AGENTS.md`.
**On request**, after them: any record, the archive, a generated sheet or a snapshot that the task, its prompt or a §8 row cites. A list
names documents, not what is true in them: where a reference document disagrees with its home, the home governs.

| Domain | A task here reads | And, when the task touches it |
|---|---|---|
| `evidence` | `docs/DATA-GOVERNANCE.md`, `docs/SOURCE-POLICY.md`, `docs/VERIFICATION-POLICY.md`, `docs/EVIDENCE-MODEL.md` | `docs/CONTENT-FRESHNESS-POLICY.md` (staleness); `docs/DATA-READINESS.md` (a metric or a dataset card); `docs/V2-DATA-DESIGN.md` (the map, the registers, triggers, status labels); `docs/CURRENT-ARCHITECTURE.md` §5 (which page reads which dataset) |
| `i18n` | `docs/DATA-GOVERNANCE.md` §6, `docs/SEO-OPERATIONS.md` §6 | `docs/i18n-review/<code>.md` (generate, never record: `docs/AI-SAFE-BOUNDARIES.md` §3) |
| `publishing` | `docs/DEPLOYMENT.md`, `docs/SEO-OPERATIONS.md`, `docs/CURRENT-ARCHITECTURE.md` | `docs/DISCOVERABILITY-STRATEGY.md` (what a page is for); `agent/release/README.md` (the release dispatcher, outside the perimeter) |
| `decisions` | `docs/ROADMAP-v2.md` §8 (the rows the task cites), `docs/SESSION-ARCHITECTURE.md`, `docs/BRIEF-v2.md` | `docs/POST-V2.md`, `docs/PHASE-5-SETUP.md` (the plan ahead); `docs/DEPLOYMENT.md` §2a–§3b and `docs/AUTONOMY-POLICY.md` (a release or a decision in the ledger); `docs/HANDOVER.md` beyond its header (an earlier session's entry) |
| `agents` | `docs/AGENT-ROLES.md`, `docs/AGENT-CONTRACTS.md`, `docs/AUTONOMY-POLICY.md`, and the agent's own document (the `spec` rows of `agents` in §1) | `docs/AUTONOMY-AUTHORIZATION-POLICY.md`, `docs/LIMITED-AUTONOMY.md` (anything that writes without a person); `docs/ORCHESTRATOR.md`, `docs/OBSERVABILITY.md` (routing, traces); `docs/SKILL-MAP.md` (a skill) |
| `control-room` | `docs/CONTROL-ROOM.md` | `docs/EDITORIAL-AUDIT-PATH.md` (the editorial audit view); `docs/HEALTH-MONITOR.md` (Website health); `docs/AUTONOMY-AUTHORIZATION-POLICY.md` (the hidden entry) |
| `frontend` | `docs/CURRENT-ARCHITECTURE.md`, `docs/BROWSER-QA.md`, `docs/PROJECT-CONTEXT.md` §3 (principles 6 and 7) | `docs/UX-AUDIT.md` (Agent 8's findings); `docs/PROTOTYPES.md`, `docs/FRONTEND-REFERENCES.md`, `docs/HOMEPAGE-PRODUCTION-PLAN.md` (records of the prototypes and the homepage) |
| `rules` | `docs/RULE-MAINTENANCE.md`, `docs/SOURCE-POLICY.md`, `docs/VERIFICATION-POLICY.md`, `docs/SESSION-ARCHITECTURE.md` §3 (Track M) | `docs/CONTENT-FRESHNESS-POLICY.md` (a rule's interval); the latest reading of the instrument (the `reading` rows of `rules` and `evidence` in §1) |
| `docs` | `docs/DOCUMENTATION-ARCHITECTURE.md`, this file, `docs/DOCS-SIMPLIFICATION-PLAN.md` | `docs/DOCS-DEPENDENCY-MAP.md` (before changing a sentence code or an anchor depends on); `docs/DATA-GOVERNANCE.md` §1 (one home per fact) |

## 3 · Uncertain

| Document | What is uncertain | Why, and who decides |
|---|---|---|
| `docs/METHODOLOGY-NOTE-v2.md` | lifecycle | written to ship with the dependency map; `network.html` shipped on 23 Nov 2026 and `methodology.html` does not carry it. Left uncertain by the author (§8, «D2, D2.2 question 4: the lifecycle of `docs/METHODOLOGY-NOTE-v2.md`»): an editorial decision for a later visible session. |

## 4 · Totals, derived from §1

Recounted from the table, not written to be believed; D3's check derives them again and fails if they differ.

- **documents:** 151
- **domain:** agents 26 · control-room 4 · decisions 22 · docs 20 · evidence 40 · frontend 15 · i18n 3 · publishing 5 · rules 16
- **kind:** account 1 · archive 3 · audit 15 · catalogue 2 · design 5 · entry 2 · generated 3 · handover 1 · plan 9 · policy 12 · prompt 55 · reading 10 · run 5 · spec 28
- **lifecycle:** active 60 · closed 87 · historical 3 · uncertain 1
- **authority:** canonical 108 · normative 15 · reference 28

## 5 · What this catalogue does not establish

That a document is true, or current beyond what its lifecycle says: a classification is not a verification (`docs/DOCS-SIMPLIFICATION-PLAN.md`
§0). That a `closed` record's findings are resolved: a record is closed when its session is, and a finding it names stays open until the
document that is its home says otherwise (`docs/HANDOVER.md`, §8). Who reads a document's text, or which sentences code depends on:
`docs/DOCS-DEPENDENCY-MAP.md`. Whether a link in a document resolves: D3's check.
