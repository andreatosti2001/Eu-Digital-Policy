# SESSION ARCHITECTURE — the stages, what each depends on, and the gates between them

**Status: DECIDED BY THE AUTHOR ON 5 NOV 2026** (`docs/ROADMAP-v2.md` §8, v2 Session 25, 25.5, the scope row and questions
1–4). Written on 5 Nov 2026 in v2 Session 25 (item 25.5), on `claude/inspiring-meitner-c7s9le`, from `main` `6060bd2`, at
the author's request: "the roadmap not in terms of timeline but of architecture of sessions", with Post-v2's blocks A, B
and C before Phase 5. **"Roadmap §8" means that approval record throughout.**

**What this file is the home of: the order of the work, and nothing else** — which stage comes before which, what each
session depends on, and the gate that opens the next stage. It carries **no dates and no durations**: a session starts
when what it depends on is approved, not on a day. What each session *does* stays in its own home, and is not copied here:

| Sessions | Their content lives in |
|---|---|
| Phase 5: S27…S31 | `docs/PHASE-5-SETUP.md` §5.1; `docs/prompts/v2-session-27.md` |
| Post-v2: PV2-01…PV2-12 | `docs/POST-V2.md` §3 (the blocks, the author's text) and §4.1 (the sessions) |
| The reading: S25, S26 | `docs/prompts/v2-session-25.md`; `docs/RULE-MAINTENANCE.md` |
| Stage 1 | `docs/AUDIT-2026-11-04.md` (what #68 did and did not do); roadmap §8, 25.5 question 2 |

The one place dates still matter is **Track M** (§3): the law's calendar, which no architecture can move.

---

## 1 · The architecture

```
                       ┌──────────────────────────────────────────────────────────────────────┐
  TRACK M              │ S25 ─ S26 (the reading, before 3 Feb 2027) · T-12 ap-cra-01 · statuses │  by the law's calendar;
  (maintenance)        │ at milestones · R-7 · each next reading round · the grant (9 Mar 2027) │  pre-empts any stage
                       └──────────────────────────────────────────────────────────────────────┘
                                         │ S25 + S26 closed  ══►  E5-5 (Stage 3's rule changes)

  STAGE 1              Phase 4 operational closure — one session, finishing #68
  consolidation        │
  of governance        ▼  G1 · the author's approval (§8)
                       │
  STAGE 2              PV2-01 (A, data readiness) ──► PV2-02 (B, frontend references) ──► PV2-03 ─► PV2-04 ─► PV2-05
  preparation                                                                                  (C, three prototypes, selection)
                       S27 (Phase 5 design, docs only) ─────────── its output is an input to C ──────┘
                       │
                       ▼  G2 · C selected and S27 approved (§8) · Phase 5 opened on E5-1…E5-7 (author)
                       │
  STAGE 3              S28 (E5-3 as a check; F-05, F-12, F-24, R-8) ──► S29 (the questionnaire) ──► S30 (V2C-15; exit audit)
  Phase 5              ──► S31 (buffer, only if needed)
                       │
                       ▼  G3 · X5-1…X5-7 · "Phase 5 concluded" (§8)
                       │
                       ▼  G4 · the v2 closed: docs/V2-CLOSURE.md re-measured, Track R done, the author's row (§8)
                       │
  STAGE 4              PV2-06 ─► PV2-07 ─► PV2-08 ─► PV2-09 (D) ──► PV2-10 (E) ──► PV2-11 (final QA) ──► PV2-12 (buffer)
  consolidation
  of the product       ┌──────────────────────────────────────────────────────────────────────┐
  TRACK R              │ the v2's sessions outside the phases: evidence (F-18, F-27, V2C-66) ·  │  beside Stages 2–3;
  (v2 residue)         │ reader-facing data (V2C-12, V2C-21) · status labels (V2C-14, V2C-20) · │  all done before G4
                       │ map (V2C-13 first, then V2C-03…05, V2C-16…19, F-29) · V2C-11           │
                       └──────────────────────────────────────────────────────────────────────┘
```

**Read it this way.** An arrow is a dependency: the session at its head starts only once the one at its tail is approved
at its checkpoint (the brief: «Non implementare nulla prima che la sessione precedente sia stata approvata»). A gate opens a
stage, and only the author opens one, by a row in roadmap §8. Sessions on no arrow between them — S27 and PV2-01, PV2-02 —
may run in either order. The two tracks are not stages: they run when their own conditions say so, and the arrows from them
are the only places they hold a stage back.

## 2 · The gates

| Gate | Opens | Holds when | Decided by |
|---|---|---|---|
| **G1** | Stage 2 | Stage 1's session is approved: a reviewer registered and a first signed human decision in the ledger, the deploy gate verified running in GitHub Actions, the owner-only settings of `docs/DEPLOYMENT.md` §3a listed | roadmap §8, 25.5 question 2 |
| **G2** | Stage 3 | PV2-05 has the author's selection among C's three prototypes; S27 is approved (E5-3 written, the X5-1 table decided); Phase 5 is opened on E5-1…E5-7 | roadmap §8, 25.5 questions 1 and 3; `docs/PHASE-5-SETUP.md` §3 |
| **G3** | the v2's closing gate | X5-1…X5-7 hold and the author records "Phase 5 concluded" | `docs/PHASE-5-SETUP.md` §4 |
| **G4** | Stage 4 | the v2 is closed: `docs/V2-CLOSURE.md` re-measured, Track R done, the author's row; `docs/POST-V2.md` §2 for D and E | roadmap §8, 25.5 question 4 |

**E5-5 is the one gate inside a stage.** No rule is changed by Phase 5 before S25 and S26 have closed their readings
(`docs/PHASE-5-SETUP.md` §3). In this architecture S28 is the first session that can change a rule, so it waits for both
G2 and E5-5.

## 3 · The stages and the tracks

### Stage 1 · Consolidation of governance — Phase 4's operational closure

One session. #68 built the release dispatcher, the hash-chained ledger with signed entries and the deploy gate, at the
author's request, after "Phase 4 concluded"; roadmap §8 (25.5 question 2) records it and amends X-3 by name. **What the
session finishes** is what #68's report says it did not do: a reviewer registered and a first signed human decision, the
gate verified running in GitHub Actions, the owner-only settings listed. **What it does not do:** reopen Phase 4, or wire the
production dispatcher (`agent/orchestrator/dispatchers.mjs`), whose activation is a governance decision
(`docs/PRODUCTION-OPERATING-MODE.md`). Its number is set by its scope row; #68 and #69 ran unnumbered.

### Stage 2 · Preparation — Post-v2 A, B, C, and Phase 5's design

**PV2-01 → PV2-02 → PV2-03 → PV2-04 → PV2-05**, in `docs/POST-V2.md` §3's order, each on the previous one's approval;
**S27** beside them, `docs/` only. Opened by G1 and by roadmap §8, 25.5 question 1, which amends `docs/POST-V2.md` §2 for
A–C only: they open without the v2 being closed. What this stage keeps from its homes: A produces an audit and a metric
contract, **no value estimated or generated to fill a gap**; B publishes its grid before the research and adopts nothing;
C's prototypes use the canonical JSON, keep the current frontend as the baseline and keep the CSP and the gates, and
**nothing in Stage 2 reaches the published site**. S27 changes no rule; its answer to "what will the questionnaire ask" is
an input to C (25.5 question 3).

### Stage 3 · Phase 5 — "what applies", advanced

**S28 → S29 → S30 → (S31)**, as `docs/PHASE-5-SETUP.md` §5.1 describes them. Opened by G2, with E5-5 holding S28 until
the reading is closed. Inputs from outside the stage: **V2C-21** (Track R, reader-facing data) before S29, so that the
questionnaire offers `eidas2`'s actors; **V2C-13** (Track R, map) before S30's V2C-15, or V2C-15 goes to the residue
(roadmap §8, 25.4 question 5); **F-18** (Track R, evidence) before any Phase 5 change to `ap-dma-01`.

### Stage 4 · Consolidation of the product — Post-v2 D, E

**PV2-06 → PV2-07 → PV2-08 → PV2-09 → PV2-10 → PV2-11 → (PV2-12)**, as `docs/POST-V2.md` §4.1 describes them. Opened by
G4: after Phase 5 and after the v2 is closed, so that nothing is redesigned while the content is still moving (25.5
question 4). D builds on C's selection (G2) and on A's metric contract.

### Track M · Maintenance — by the law's calendar

Not a stage, because the law does not wait for one. **S25 and S26** before 3 Feb 2027, when all 33 rules lapse (prompt of
S25 kept as written; S26's named there); **T-12 on `ap-cra-01`** after 26 Mar 2027; the **statuses** at their milestones;
**R-7** before 2 Aug 2027; **each next reading round**, 90 days after each rule's reading (`tools/freshness.mjs`
`RULE_INTERVAL`); the **autonomy grant**, which expires on 9 Mar 2027 and is the author's to renew or not. **A Track M session
that is due pre-empts whatever stage is running**, as `docs/prompts/v2-session-27.md` already says for S25. Its one arrow
into the stages is E5-5.

### Track R · The v2's residue — the sessions outside the phases

Decided in v2 Session 17.5 (roadmap §8, questions 2 and 4) and v2 Session 24 (R-1…R-12), none yet run: evidence sessions
(group (d): F-18, F-27; V2C-66), a reader-facing data session (V2C-12, V2C-21), a status-labels session (V2C-14, V2C-20,
D-3), map sessions (V2C-13 first, then V2C-03…05, V2C-16…19, F-29), a maintenance session (V2C-11). They run beside Stages
2 and 3, wherever they fit; three of them feed Stage 3 (above); **all are done before G4**, because the v2 cannot be
closed with them open (`docs/V2-CLOSURE.md`).

## 4 · What this changes against the plans of 4 Nov 2026

- **Phase 5's sessions (`docs/PHASE-5-SETUP.md` §5.1) lose their dates.** The plan's "When" column is replaced by its place
  here: S27 in Stage 2, S28–S31 in Stage 3 after G2. Their content, the entry and exit criteria and the stop rules are
  unchanged (roadmap §8, 25.4 questions 6 and 7).
- **Phase 5 opens later than the plan said**: at G2, after C, not after S27 alone. E5-1…E5-7 are unchanged; G2 adds C's
  selection, by 25.5 question 1.
- **Post-v2 is split.** A–C (PV2-01…05) open before the v2 closes; D, E and the QA (PV2-06…12) keep `docs/POST-V2.md` §2.
  Its §3, the author's text, is unchanged.
- **#68 has a place**: Stage 1, recorded in roadmap §8 (25.5 question 2).

## 5 · Risks the architecture carries

- **Stage 2 is long before Phase 5 builds anything** (six sessions, by `docs/POST-V2.md` §4.2's forecast). Meanwhile the
  rules read in S25–S26 lapse again 90 days later, so Stage 3 will meet a second reading round of Track M; stop rule 4 of
  `docs/PHASE-5-SETUP.md` §5.1 (no Phase 5 session runs a rule past its lapse) is what keeps the two apart.
- **B studies frontend projects that this repository may not adopt as they are.** No framework, no runtime dependency, no
  third-party origin (`AGENTS.md`, "Architecture — do not rebuild it"; `ALLOWED_RUNTIME_ORIGINS` is empty and a change to
  it is Class D). B's own constraints say the same; a reference matrix is not an adoption.
- **C's prototypes do not include `applies.html`** (25.5 question 3, "C's four views are unchanged"): Phase 5's
  questionnaire is designed in S27 and built in S29 against C's selected direction, not prototyped in C.
- **Track R has no owner and no order of its own.** It gates G4, and three of its items gate Stage 3. If it is not
  scheduled, Stage 3 and G4 wait on it.

## 6 · What this document does not establish

- **Any date or duration.** Track M's dates are the law's; everything else is ordered, not scheduled.
- **That any stage is open.** Each opens by its gate, by the author's row in roadmap §8.
- **The content of any session** — its home says it (the table at the top).
- **That the v2 closes**, or when: G4 is the author's, on `docs/V2-CLOSURE.md` re-measured.
