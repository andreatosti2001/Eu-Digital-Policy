# PHASE 5 SET-UP — "what applies", advanced: the material, an entry condition and an exit that can fail, and the sessions

**Status: APPROVED BY THE AUTHOR ON 4 NOV 2026 (roadmap §8, v2 Session 25, 25.4 questions 1–7; the answers in §7). PHASE 5
IS PLANNED AND NOT OPENED**: it opens on the author's word against E5-1…E5-7 (§3). **Amended on 5 Nov 2026** (roadmap §8,
25.5 questions 1–4): its sessions are placed in `docs/SESSION-ARCHITECTURE.md` — S27 in Stage 2, beside Post-v2's A and B,
and S28–S31 in Stage 3, which opens at G2, after Post-v2's C; §5.1 carries the places instead of dates. Written on 4 Nov 2026 in v2
Session 25 (item 25.4, after the session stopped at 25.0), on `claude/inspiring-meitner-c7s9le`, at the author's request
("generate the set up for phase 5, acknoledging the sessions required in coherence with the previous phases"; roadmap §8,
"v2 Session 25, 25.4: the set-up of Phase 5"). **"Roadmap §8" means that approval record throughout.** It adds no field,
check, rule or command, and is read by no tool. It is `docs/PHASE-4-SETUP.md` and `docs/PHASE-4-PLAN.md` in one file:
Phase 5's material has been assigned to it since 3 Nov 2026, so its set-up and its plan can be proposed together, and each
part is approved separately (§7).

**Why now.** `docs/ROADMAP-v2.md` §4: Phase 5's scope "is written in the session after Phase 4's checkpoint". Roadmap §8,
v2 Session 17.5, 17.5.0 question 5: "against what Phases 3 and 4 measured; the material assigned to it accumulates until
then". Phase 4 was concluded on 4 Nov 2026 (roadmap §8, "Phase 4 concluded"). This is the session after it.

**What governs it.** The brief (`docs/BRIEF-v2.md`), whose sequence puts Phase 5 last («Fase 3 (what applies base) →
Fase 4 (automazione) → Fase 5 (what applies avanzata)»), and in particular:

- «Non pubblicare "what applies to me" prima che i trigger siano verificati con lo stesso rigore delle claim.» Phase 3
  met that standard for 33 rules and three dimensions. **Anything Phase 5 adds — a question, a condition, an evaluated
  exemption — is a new trigger, and meets the same standard before it is published.**
- «La v2.0 non deve essere più grande: deve essere più esplicita.» and «Ogni scelta di espansione deve essere tracciabile a
  un criterio dichiarato.» — the reason §0 recommends depth over breadth.
- «L'incertezza va resa leggibile, non nascosta.» and «Non comprimere problemi eterogenei in un punteggio aggregato.» —
  no applicability score; an unanswered question stays visible as one.
- «Non implementare nulla prima che la sessione precedente sia stata approvata.»

And the standing rules of `AGENTS.md`: **no matching rule ≠ no obligation** (NOT DETERMINED, never "probably not"); **null
≠ unknown, unknown is never zero**; never fabricate a legal fact; one home per fact; the matcher is "deliberately
unintelligent", "there is no decision tree in the JavaScript — the reasoning lives here and is inspectable"
(`data/applicability.json` `$description`).

---

## 0 · Three premises to put to the author before anything else

*Decided on 4 Nov 2026 (§7): P-A depth, P-B design before and changes after, P-C from Session 27. The text below is the
proposal as it was put.*

**P-A · What "advanced" means.** The roadmap names Phase 5 and does not define it. Three readings, measured against the
records of 4 Nov 2026:

| Reading | What it would do | What it costs, measured |
|---|---|---|
| **Depth** (recommended) | Make askable the facts the 33 rules already say they turn on, and no others: the `depends_on` items, the thresholds, the exemptions. No new instrument, no new rule unless a decision about an existing one requires it. | `depends_on`: 38 items on 25 rules. Thresholds: 3 rules, 4 keys (`ap-dsa-02`, `ap-dma-02` ×2, `ap-ai-act-03`). Exemptions: 26 on 20 rules (10 `excludes`, 16 `narrows`), each with a structural basis (T-04), none evaluated: the page prints them. 19 of 33 rules are `likely` or `possible`, which by T-06 means a `depends_on` exists. |
| **Breadth** | More rules, more instruments, more dimensions. | Against «Non inseguire la completezza» and «più esplicita, non più grande»; every new rule is a reading of the law and joins the 90-day cycle. |
| **Findings only** | Decide the material earlier rows assigned (§1, M-1…M-6) and stop. | Small; leaves the questionnaire's gap ("three questions where a lawyer would ask fifty", `$limits`) as it is. |

Depth contains "findings only": M-1…M-4 are questions about conditions and outcomes, which is depth's subject.

**P-B · Where Phase 5 sits against the reading of 3 Feb 2027.** All 33 rules lapse on 3 Feb 2027. Their re-reading is
maintenance, already decided and prompted: v2 Session 25 (14 rules, deferred to 12 Jan–2 Feb 2027, roadmap §8, 25.0
question 1) and v2 Session 26 (19 rules, named in `docs/prompts/v2-session-25.md`). Phase 5 changes rules' conditions and
outcomes. **Recommended: design before the reading, change after it.** Phase 5's design sessions write `docs/` only and may
run now; no rule is changed by Phase 5 until Sessions 25 and 26 have closed their readings, so that every rule Phase 5
changes starts from a reading of this winter and a Phase 5 change never races a maintenance closure on the same rule.

**P-C · How the sessions are numbered.** The numbers 25 and 26 are taken by the reading (25's prompt names 26). A Phase 5
session that runs in November or December 2026 runs *before* Session 25 in time. **Recommended: numbers name the work, not
the calendar** — Phase 5's sessions are v2 Session 27 onward, whatever their date, and each scope row records its date;
the precedent for a session out of the simple order is v2 Session 17.5. Not recommended: renumbering the reading (the
author kept Session 25's prompt as written).

## 1 · The material assigned to Phase 5, measured on 4 Nov 2026

Each item exists because a roadmap §8 row sent it here. Each stays open until its own session closes it.

| # | Item | Sent here by | What it is, today |
|---|---|---|---|
| M-1 | **F-05**, `ap-data-act-02`'s `outcome:likely` | §8, 17.5.0 question 4, group (b) | The outcome turns on "whether the provider offers services to customers in the Union", while the rule's own territory condition is already `territory:non-eu-serving-eu`. Unchanged since S17. |
| M-2 | **F-12 = R-6**, `ap-ai-act-01`'s `actor:gpai-provider` | group (b); re-confirmed §8, 24.2 R-6 | The rule fires for GPAI model providers (`actor:gpai-provider`, `activity:gpai-provision`), whom AI Act Arts 4 and 5 do not address as such. "Not changed" on 29 Oct 2026. |
| M-3 | **F-24**, `ap-pld-01` and deployers | group (b) | The rule fires for `activity:ai-deployment` through the actor dimension only (Art. 8(2)). Activity list unchanged. |
| M-4 | **R-8**, GDPR Art. 2(2)(a) and (b) carried by no rule | §8, 24.2 R-8 | `ap-gdpr-01` carries (c), `ap-gdpr-03` (d); (a) and (b) are carried by none, so the matcher can answer "applies" where the GDPR does not reach. "Adding the exemptions is simple, deciding which answers trigger them is 'what applies, advanced'." |
| M-5 | **V2C-15**, what `stratum` meant | §8, 17.5.0 question 2, destination 4 | `stratum` was dropped (D-8, 25 Oct 2026); "what it meant is to be derived from the actors and the edge kinds", and nothing derives it. |
| M-6 | **R-1**, `agent/integrate/preserve.mjs` and the rules | §8, 24.2 R-1 ("to Phase 5 if 'what applies, advanced' lets an agent propose a change to a rule") | `canonicalOf()` resolves no rule, so a DataProposal naming one is refused; the suite fails if it learns rules. **Closed for Phase 5** (§7, question 4): no agent proposes a rule change; `preserve.mjs` and its tripwire are left. |
| M-7 | **The unasked facts** | `docs/PHASE-3-AUDIT.md` §6 ("that is the gap an 'advanced' phase would address") | §0, P-A's first row: 38 `depends_on` items, 4 threshold keys, 26 exemptions. The page shows them; the matcher evaluates none. |

**Listed in `docs/PHASE-3-AUDIT.md` §6 and not Phase 5's**, so a session does not reopen them by accident:

| Item | Where it is |
|---|---|
| F-23 (`ap-gdpr-04`, the controller role) | **Closed** in v2 Session 21 ("Change rule only"): a `depends_on` names the controller (Arts 4(7), 22(3), 35(1)). |
| F-07 (NIS2 national transposition dates) | **Left** (§8, 17.5.0 question 4, group (f), "as approved in v2 Session 17"). |
| F-18 (DMA Art. 3(10): six months, not "immediately") | Group (d)'s evidence session (§8, 24.2 R-4); `ap-dma-01`'s reading in Session 25 takes it up or that session goes first. |
| R-3, R-5, R-7, R-12; T-12 on `ap-cra-01` | Maintenance, dated (§8, 24.2). |

## 2 · What exists, and whether Phase 5 extends it, uses it or leaves it

| What | Phase 5 | Why |
|---|---|---|
| `data/applicability.json`: 33 rules, three dimensions (actor 44 terms, activity 22, territory 3), `thresholds` on 3, `$outcomes`, `$limits` | **extends** (Class C, each change on the author's word) | Where the reasoning lives. A new dimension or an evaluated exemption is data, not code. |
| `js/applies.js`, the matcher (`evaluate()`: a rule fires when every specified dimension intersects; a threshold downgrades by one step) | **extends, keeping it unintelligent** | A new dimension is one more intersection. An unanswered question is a wildcard, as an omitted dimension is today, never a "no". No decision tree in the JavaScript. |
| `tools/trigger-audit.mjs` T-01…T-12 | **extends** | T-03 (every dimension a provision), T-04 (an exemption's basis), T-05 (a threshold's basis) and T-06 (likely/possible ⇒ `depends_on`) are the Phase 3 standard. A new dimension needs the same: E5-3. |
| The attestation form, A-1…A-8; `docs/RULE-MAINTENANCE.md` steps 1–6 | **uses** | A rule Phase 5 changes is a closure with `outcome: "changed"`, its §8 rows in `decisions`, after a reading of the Articles it rests on. Phase 5 adds no second way to change a rule. |
| `tools/notice-audit.mjs` N-0…N-4; the D-2 notice on `applies.html` | **uses; N-0 changes only with the notice's words** | The notice's text is pinned (N-0). If Phase 5 changes what the page asks, whether the notice changes is the author's (P-07: the wording is authorship). |
| `i18n/locales.json` | **uses** | Every new questionnaire string is registered; the it/fr/es editions stay `pending_translation` until reviewed (V2C-27; a translation review is never an agent's, `docs/AI-SAFE-BOUNDARIES.md` §3). |
| `data/taxonomy.json` | **extends by adding only** | New dimension terms may be added; no ID is renamed. |
| The browser suite (`agent/browser/`) | **extends** | The one check that sees the rendered questionnaire: an unanswered question must render as unanswered (X5-3). |
| `agent/integrate/preserve.mjs` | **leaves** (P-D decided: no agent proposes a rule change, §7 question 4) | The refusal fails closed; its suite is the tripwire. |
| The production dispatcher, the decision ledger, readiness, the adversarial gate, `ALLOWED_RUNTIME_ORIGINS`, any network request by a tool | **leaves** | As Phase 4 left them (X-3). Nothing in "what applies" needs any of them. |
| D-5 (CMS, login) | **leaves** | Deferred past Phase 4 (§8, 24.3); nothing here needs a login. |

## 3 · An entry condition for Phase 5 that can fail (a proposal)

On the model of E-1…E-6. **The decision to open Phase 5 is the author's.**

| # | Criterion | Verified by | Fails today? |
|---|---|---|---|
| E5-1 | Phase 4 is concluded | §8, "Phase 4 concluded" | no |
| E5-2 | P-A, P-B and P-C are decided | three §8 rows | **yes** |
| E5-3 | **The standard a new trigger meets is written down**, as Phase 3's was: every new question or dimension resolves to a provision ID (as T-03); every answer that can change an outcome cites a tier-1 source with `supports` and a locator; an exemption evaluated by the matcher has the basis T-04 already requires; **an unanswered question never narrows an outcome** — it leaves the rule firing, and NOT DETERMINED stays what no rule covers | a section of this document approved in §8, then a machine check (X5-2) | **yes** |
| E5-4 | Every item of §1 has a session or "left, with the reason" | §8 rows | **yes** |
| E5-5 | **No rule is changed by Phase 5 before v2 Sessions 25 and 26 have closed their readings** (if P-B is decided as recommended) | §8, their final checkpoints; `freshness --as-of 2027-02-03` → 0 `RULE_STALE` | **yes**, until February 2027 |
| E5-6 | The baseline is green on a full-history clone, as E-5 | the commands of `AGENTS.md` "Validators"; `git rev-parse --is-shallow-repository` → `false` | re-measured at the opening |
| E5-7 | Phase 5's first item writes nothing outside `docs/` without its own §8 row | the item's scope row | — |

E5-5 gates only changes to rules. The design (S27) can be done under E5-1…E5-4 alone, and is what makes E5-3 and E5-4 true.

## 4 · Exit criteria that can fail (a proposal)

Phase 5 is concluded when each holds. **The decision is the author's** (§8 row), as it was for Phase 4.

| # | Criterion | Verified by |
|---|---|---|
| X5-1 | Every item of §1, and every `depends_on`, threshold and exemption P-A brings in, has a recorded disposition: **askable** (a question, with its provision), **evaluated** (an exemption the matcher applies), **stays a stated dependency** (with the reason, e.g. a fact no questionnaire can establish), or **left** | a table here, one row per item, approved in §8 |
| X5-2 | Every new trigger meets E5-3, checked by a machine check at ERROR, and the 33 rules still pass T-01…T-12 and A-1…A-8 | `tools/trigger-audit.mjs` (extended); `tools/validate.mjs` 0 errors; `tools/selftest.mjs` with a planted failure for each new check |
| X5-3 | **No absence becomes a negative finding**: an unanswered question and a "don't know" leave the rule firing, and render as such; NOT DETERMINED still appears where no rule covers a combination | the browser suite, a check per new question; a `selftest` planted case |
| X5-4 | Every rule Phase 5 changed is a closure in the form (`outcome: "changed"`, its §8 decisions), read against its Articles in that session | A-1…A-8; the §8 rows |
| X5-5 | The page says what the advanced questionnaire still does not ask: `$limits` and, if the author so decides, the notice | §8 rows for the words; `notice-audit` N-0 updated only with them |
| X5-6 | What Phase 5 leaves is unchanged (§2's last three rows) | `git diff <phase-5-start>..HEAD --stat -- agent/orchestrator agent/implement/decisions agent/production agent/policy/verify tools/thirdparty.mjs` empty, or only what §8 approved |
| X5-7 | The baseline is green on a full-history clone, the browser suite included | as E5-6 |

**Concluding Phase 5 does not close the v2.** The closing gate is `docs/V2-CLOSURE.md`, re-measured in its own right, and
the sessions outside the phases (§5.2) are part of what it measures.

## 5 · The sessions

### 5.1 · Phase 5's own, placed in the architecture of sessions

*Amended on 5 Nov 2026 (roadmap §8, v2 Session 25, 25.5 questions 1–4): the sessions are ordered by dependency, not by date, in `docs/SESSION-ARCHITECTURE.md`, which is the one home of their order. The first column gives each session's place there; the scope of each, the entry and exit criteria and the stop rules are unchanged. The column was "When" (Nov–Dec 2026 … before 13 Apr 2027) as approved on 4 Nov 2026 (25.4 question 7).*

Every session ends with the next one's prompt (§8, 4 Nov 2026, the standing rule), and each has a checkpoint per item that
changes anything outside `docs/`.

| Place (`docs/SESSION-ARCHITECTURE.md`) | Session | Scope | Ends with |
|---|---|---|---|
| Stage 2, beside PV2-01 and PV2-02; its output an input to C | **S27 · Design** (docs only; E5-5 does not apply) | **27.1** P-A…P-C and P-D (§7), if not decided before; **27.2** E5-3 written as a standard, with the planted cases a check would need; **27.3** the X5-1 table proposed: each of the 38 `depends_on` items, 4 threshold keys and 26 exemptions classified by what it rests on (the Article it names), measured with a scratch parser as `docs/ATTESTATION-FORM.md` §4 was, nothing in `data/` changed; M-1…M-6 each with a proposed session; **27.4** a paper test: the questionnaire answered for three or four of the 33 rules' typical cases, showing what changes and that no "no" is produced by an unanswered question | `docs/` only; S28's prompt drafted; whether Phase 5 opens is decided at G2, after C's selection (25.5 questions 1 and 3) |
| Track M, before 3 Feb 2027 | **S25, S26 · The reading** (maintenance, already prompted) | The 33 rules re-read in the form; the statuses at their milestones. **Not Phase 5**: they change a rule only as maintenance does. S28's prompt is S27's (27.5). | All 33 rules dated in January 2027; E5-5 met |
| Stage 3, after G2 and E5-5 | **S28 · The standard as a check, and group (b)** | **28.1** E5-3 implemented in `tools/trigger-audit.mjs` (Class C), with `selftest` cases, at ERROR before any new trigger exists; **28.2** M-1, M-2, M-3, M-4, one question each, the Articles read in that session; a rule that changes is a closure in the form | checkpoint after 28.1; final |
| Stage 3, after S28; V2C-21 (Track R) before it | **S29 · The questionnaire** | The askable items of X5-1 as data in `data/applicability.json` and `data/taxonomy.json`, the matcher's intersections, `applies.html` and `js/applies.js`, the i18n register, the browser checks of X5-3, `$limits` and the notice per X5-5 | checkpoint per batch of instruments |
| Stage 3, after S29; V2C-13 (Track R) before its V2C-15 | **S30 · Derivations and exit** | M-5 (V2C-15), kept (§7 question 5), and only if the map sessions' V2C-13 has run — otherwise named residue; the exit audit X5-1…X5-7; the hand-over (§5.3) | Phase 5 concluded on the author's word, or the named residue |
| Stage 3, only if needed | **S31 · Buffer, only if needed** | Whatever S28–S30 could not close, named | |

**Stop rules.** (1) In S27, the paper test (27.4) goes first, then 27.3 moves to S28's opening; 27.1 and 27.2 never move.
(2) In S28–S29, a rule whose cited texts were not all read is not closed and its date does not move (§8, v2 Session 21,
premise 1); a new trigger that fails E5-3 is not published. (3) Whatever is not closed goes, named, into the next prompt.
(4) **No Phase 5 session runs a rule past its lapse**: a session that would is preceded by that rule's reading.

### 5.2 · The sessions outside the phases, and where they sit

Decided in v2 Session 17.5 (§8, questions 2 and 4) and in v2 Session 24 (R-1…R-12). None has a date; none is Phase 5's.
**They sit beside Phase 5, not inside it**, and this plan neither schedules nor absorbs them. They are listed so the
sequence stays coherent:

| Session | Its material | Bearing on Phase 5 |
|---|---|---|
| **An evidence session**, group (d) | F-18 (`ap-dma-01`, `clm-dma-ex-ante`, `part-4.p2` and overlays), F-27 | Before S28 if `ap-dma-01` is touched by Phase 5; otherwise none. Session 25 may take F-18 up first (R-4). |
| **Evidence sessions**, V2C-66 | each backlog flips when its records are read | none |
| **A reader-facing data session** | V2C-12 (the eight v1 relationships), V2C-21 (`eidas2`'s regulated actors) | **V2C-21 bears on S29**: an actor the questionnaire offers should exist for `eidas2`; recommended before S29 |
| **A status-labels session** | V2C-14 (D-3, the six labels), V2C-20 | none: labels describe instruments, not triggers |
| **Map sessions** | V2C-13 (M-08…M-16) first, then V2C-03…05, V2C-16…19, F-29 | **M-5 (V2C-15) reads the edge kinds**; if kept, after V2C-13 |
| **A maintenance session** | V2C-11 (R-01 for P2B) | none |
| **Post-v2** (`docs/POST-V2.md`) | redesign, infographics, animations, blog | not opened; after the v2 |

### 5.3 · The calendar Phase 5 answers to

| Date | What | Where |
|---|---|---|
| 2 Dec 2026 – 12 Jan 2027 | statuses of ai-act, pld, eidas2, dma, data-act meet their milestones | S25 (25.2) |
| **3 Feb 2027** | all 33 rules lapse | S25, S26, before it |
| 9 Mar 2027 | the limited-autonomy grant expires | flagged in S30's hand-over; not renewed by this plan |
| 26 Mar 2027 | T-12 on `ap-cra-01` (EHDS application); ehds's status milestone | a reading, after it |
| **13 Apr – 4 May 2027** | the rules read 12 Jan – 2 Feb 2027 lapse (91 days after each reading; measured) | the next reading round, maintenance; Phase 5 ends before it or yields to it (stop rule 4) |
| 2 Aug 2027 | R-7: AI Act Art. 2(13) delegated acts, ask SPARQL before | maintenance, at `ap-ai-act-04`'s readings |

## 6 · Risks

- **An advanced questionnaire is more ways to say "no".** Every question added is a place where an answer can switch a rule
  off. The brief and `AGENTS.md` rule 6 forbid a negative finding from an absence; X5-3 and E5-3's last clause exist for
  this, and the browser suite is the only check that sees the page do it.
- **Looking like legal advice.** More questions make a result read as an assessment. `$limits` already says "a map of the
  rulebook, not legal advice"; X5-5 keeps the page saying what it still does not ask. The no-legal-advice text is never
  touched (`AGENTS.md` rule 8).
- **`depends_on` items are prose**, written to be read, not answered. Some name a fact no questionnaire can establish
  (whether an organisation is the controller of a given processing). 27.3 must be allowed to say "stays a dependency".
- **An exemption evaluated is an exemption asserted.** Today an exemption is printed; evaluated, it removes or narrows a
  result. Each needs the reading of its basis Article in the session that turns it on.
- **The 90-day cycle.** Each Phase 5 change to a rule is also a reading; the rules lapse again in April–May 2027 (§5.3).
- **Translation.** New strings ship in English with the editions `pending_translation`; an edition that is indexable
  (`docs/SEO-OPERATIONS.md` §6) would show English questions in a translated page.
- **The matcher's simplicity is a property, not an accident.** A dimension that needs ordering, negation or a tree is a
  sign that the item belongs in "stays a dependency", not in code.

## 7 · The questions for the author, one at a time

Each with the recommendation first; each answer recorded in roadmap §8 in the author's words and committed at once.

1. **P-A, what "advanced" means**: depth (recommended) · breadth · findings only.
2. **P-B, against the reading**: design before, changes after (recommended) · Phase 5 changes may run alongside the reading
   · Phase 5 waits entirely until after February 2027.
3. **P-C, the numbering**: Session 27 onward, numbers name the work (recommended) · renumber.
4. **P-D, M-6**: no agent proposes a rule change in Phase 5, `preserve.mjs` left (recommended) · agents may propose, and
   M-6 joins S30.
5. **M-5, V2C-15**: kept in Phase 5, after the map sessions' V2C-13 (recommended) · left, with the reason that nothing
   reads a derived stratum today.
6. **The entry condition E5-1…E5-7 and the exit criteria X5-1…X5-7**, as drafted (recommended) · amended.
7. **The sessions of §5.1**, as drafted (recommended) · amended. Approval of this question approves the plan, as the §8 row
   citing `docs/PHASE-4-PLAN.md` did for Phase 4.

### The author's answers (4 Nov 2026, roadmap §8, v2 Session 25, 25.4 questions 1–7)

1. **P-A:** "Depth (Recommended)".
2. **P-B:** "Design before, changes after (Recommended)".
3. **P-C:** "From 27, numbers name work (Recommended)".
4. **P-D:** "No agent proposals (Recommended)" — M-6 closed for Phase 5.
5. **M-5:** "Keep, after V2C-13 (Recommended)".
6. **E5-1…E5-7, X5-1…X5-7:** "Approve as drafted (Recommended)".
7. **The sessions of §5.1:** "Approve as drafted (Recommended)" — with 1–6, the plan is approved.

After these answers E5-1, E5-2 and E5-4 hold (E5-4: M-1…M-4 to S28, M-5 to S30, M-6 closed, M-7 to S27–S29); E5-3 is
S27's to write, E5-5 waits for Sessions 25 and 26, E5-6 is measured at the opening.

## 8 · What this document does not establish

- **Any fact about any instrument.** Every count here is a measurement of `data/` on 4 Nov 2026; no Article was read for
  this document, and nothing here says what any rule should say.
- **That Phase 5 is open.** It opens on the author's word, on E5-1…E5-7. The approval of this plan does not open it.
- **That depth is right.** It is the recommendation that follows from the brief's words; the author may choose otherwise.
- **That five sessions suffice.** The count assumes S27–S30 each close what they name; S31 exists because it is an estimate.
- **That any `depends_on` item can be asked.** 27.3 measures that; this document only counts them.
- **That the v2 closes when Phase 5 does** (§4).

## 9 · E5-3, the standard a new trigger meets (v2 Session 27, 27.2)

*Written on 13 Nov 2026 in v2 Session 27, on `claude/eager-euler-05ukz9`, from `main` `3627de6`. **Proposed at checkpoint 27.2**;
it becomes E5-3's "section of this document approved in §8" only by a roadmap §8 row. The choices in it are the author's, each a
§8 row of 13 Nov 2026: "v2 Session 27, 27.2 question 1" (it is written here), "question 2" (the citation clause binds new triggers
only), "question 3" (an evaluated `excludes` removes, an evaluated `narrows` shows), "question 4" and "question 4b" (one
mechanism: an unanswered question downgrades one step; a rule whose dependency becomes askable is restated one step up). It adds
no field, check or rule to the repository: **Session 28 implements it** (28.1, at ERROR, before any new trigger exists).*

The standard is Phase 3's, carried to what Phase 5 adds. Phase 3 made a rule publishable when every dimension it uses names the
provision that defines it (T-03), every exemption has a structural basis (T-04) and every threshold a basis (T-05). Phase 5 makes
askable what the rules already say they turn on (P-A); each thing it makes askable is a **new trigger**, and a new trigger meets
the four clauses below before it is published (`docs/BRIEF-v2.md`: «Non pubblicare "what applies to me" prima che i trigger siano
verificati con lo stesso rigore delle claim»).

### 9.1 · What a new trigger is, told apart by field and by name (no list)

| Term | What it is in the records | Today |
|---|---|---|
| **Phase 3 dimension** | `conditions.actor`, `conditions.activity`, `conditions.territory` | 28, 27 and 4 rules; under T-03 as they are (§8, 27.2 question 2) |
| **New dimension** | any other key of `conditions` except `thresholds`; its terms a taxonomy family of the same name (`taxonomy.<d>`); its provisions `condition_provisions.<d>` | none |
| **Threshold** | a key of `conditions.thresholds`, with `threshold_basis` (T-05) | 4 keys on 3 rules; none asked — the matcher downgrades |
| **Evaluated exemption** | an exemption object carrying `when`: `{ <dimension>: [terms] }`, the explicit answers that meet it (the key's name is proposed here; Session 28's check reads it) | none: all 26 are printed |
| **Explicit answer** | a term the reader selected for a question | — |
| **"Don't know"** | a state of the page equal to no answer; **never a taxonomy term, never a condition term, never in a `when`** | — |

### 9.2 · The four clauses

Each clause gives the rule a check applies, the planted case that makes it fail, and what the check cannot see. The planted
cases were run on 13 Nov 2026 against a scratch prototype outside the repository (§9.4).

**(a) Every new question resolves to a provision.** *Rule:* for every rule and every new dimension `d` it uses — `taxonomy.<d>`
exists, every term in `conditions.<d>` is one of its terms, and no condition term is "don't know"; and T-03 as it stands —
`condition_provisions.<d>` non-empty, each id a provision of the rule's instrument or of one an edge connects to it. T-03 already
reads every key of `conditions`, so its half of the clause needs no new code. *Planted:* `role` on `ap-gdpr-04` with no taxonomy
family (fails (a)); with the family and no `condition_provisions.role` (fails T-03); "don't know" written as a condition term
(fails (a)). *Cannot see:* that the provision defines what the question asks — it sees an id that resolves, not a meaning; that
the question's words on the page (`js/applies.js`, `i18n/`) ask what the term means.

**(b) Every answer that can change an outcome cites a tier-1 source, with `supports` and a locator.** *Rule:* for every new
dimension `d`, every provision in `condition_provisions.<d>` is placed in a tier-1 text (`provisionArticle()` of
`tools/attestation-audit.mjs`, the provision's tier-1 `sources`) **and** its Article is among the units of the locator of a
`sources[]` reference that is `for: "scope"`, `supports:direct`, on that tier-1 text, with a structural locator (`parseLocator()`,
`structural()`); a provision that cannot be placed fails. For **every** threshold key, `threshold_basis[k]` holds a reference
that is `supports:direct`, tier-1 and structural (4 of 4 pass today, so the clause reads every threshold and needs no marker of
which are asked). For an evaluated exemption, see (c). The three Phase 3 dimensions are outside this clause (§8, 27.2 question 2;
§9.5). *Planted:* `role` on `ap-gdpr-04` resting on `gdpr:art-22`, which the rule cites only `for: obligation` (fails); the
positive control, `role` resting on `gdpr:art-4`, which its scope reference names (passes); `ap-dsa-02`'s threshold basis reduced
to a tier-2 reference (fails). *Cannot see:* paragraphs and points — Article level only, as A-4 (`docs/ATTESTATION-FORM.md` §5,
item 3); that the Article says what the answer implies; that the text was read (A-4's limit, §6 of that document).

**(c) An evaluated exemption has the basis T-04 requires, on a tier-1 text, and acts only on an explicit answer.** *Rule:* an
exemption with `when` — T-04 holds (a text of at least ten characters; a direct reference with a structural locator); at least
one basis reference is `supports:direct`, **tier-1** and structural; `effect` is `excludes` or `narrows` (`reinstates`, used by no
rule today, is not evaluable until the author decides it); `when` names at least one dimension, each a question the
questionnaire asks (a Phase 3 dimension or a new one with its taxonomy family), each with at least one term of that dimension and
none "don't know". *Planted:* `ap-dma-01`'s `excludes` (SMEs) evaluated — its direct basis is a tier-2 Commission report, the
DMA cited only `partial` (fails); a `reinstates` evaluated (fails); a `when` term outside the vocabulary (fails); an empty `when`
(fails, and (d) also fails: an empty `when` is met by every selection). *Cannot see:* that the `when` terms are the ones the
exemption's text describes; that the basis Article carries the exemption.

**(d) An unanswered question never narrows an outcome; NOT DETERMINED stays what no rule covers.** The matcher, as decided
(§8, 27.2 questions 3, 4, 4b): a question the rule constrains and the reader leaves unanswered, or answers "don't know",
**downgrades the outcome one step and the rule fires** (applies → likely → possible, never to unlikely), as the three Phase 3
questions do today; a threshold is unasked and downgrades, as today; an evaluated `excludes` removes the rule **only** when every
dimension of its `when` is explicitly answered with one of its terms; an evaluated `narrows` **never** changes whether the rule
fires or its outcome — on an explicit answer it is shown as met. *Rule*, a property of the matcher run over the records, for every
rule: (1) it fires on the empty selection, and not as `unlikely` unless stored so; (2) from a selection built from the rule's own
first term per dimension (and, in turn, each evaluated exemption's first `when` term), removing any subset of the answers — or
replacing them with "don't know" — never turns a firing rule into one that does not fire, (3) never yields `unlikely`, (4) never
yields a more confident outcome than with the answers, and (5) never applies an exemption, or shows a `narrows` as met, on an
unanswered question; (6) an evaluated `narrows`, on a selection that meets it, gives the same firing and outcome as the rule
without it. NOT DETERMINED follows: an instrument is listed as not determined when no rule for it fires (`run()`, for core
instruments), and by (2) an absence of answers only makes more rules fire, never fewer. *Planted:* a matcher that drops a rule on
an unanswered question; one that applies an `excludes` whose question is unanswered; a downgrade table that reaches `unlikely`;
"don't know" read as an answer; a matcher more confident when a question is unanswered; a `narrows` shown as met on an unanswered
question; a `narrows` that downgrades on an explicit answer — **each fails**. *Cannot see:* the rendered page — whether "don't
know" is offered, whether an unanswered question reads as unanswered, whether NOT DETERMINED is printed (X5-3's browser checks,
Session 29); selections beyond the ones it builds (one term per dimension, the rule's own); an answered threshold, which no
matcher compares yet; **the real matcher, until Session 28 can call it** (§9.6).

### 9.3 · What the reader sees, under the standard

| Reader's answers to the questions a rule constrains | Result |
|---|---|
| all answered, each meeting the rule | the rule's stored outcome |
| any answered with a term the rule does not list | the rule does not fire for this reader (an explicit answer; the instrument is then NOT DETERMINED if no other rule for it fires) |
| k unanswered or "don't know" | the stored outcome, k steps down, never below `possible`; the rule fires |
| an evaluated `excludes` met by explicit answers | the rule does not fire (the one new way to a smaller result, §8 27.2 question 3) |
| an evaluated `narrows` met by explicit answers | outcome unchanged; the exemption shown as met on the reader's answer |

A rule whose dependency becomes askable is **restated one step up, as a closure in the form** (`docs/ATTESTATION-FORM.md` §7,
`outcome: "changed"`), so that unanswered it reads as today; a rule with k items made askable reads up to k steps lower than
today when none is answered, and a rule stored `applies` reads one step lower (§8, 27.2 question 4b). Which items become askable is
the X5-1 table's (§10).

### 9.4 · The planted cases, run against a scratch prototype (13 Nov 2026, `main` `3627de6`)

*A script in the session's scratchpad, never in the repository, as `docs/ATTESTATION-FORM.md` §4 was measured: (a)–(c) over the
records, (d) over a copy of `js/applies.js` `evaluate()` extended as §9.2 (d) states, and `tools/trigger-audit.mjs` itself for
T-03. Session 28 re-measures with the real check.*

| Case | Result |
|---|---|
| Today's tree, today's matcher | 0 findings |
| Positive controls: `role` on `ap-gdpr-04` resting on Art. 4 (cited for scope) with an evaluated `excludes` on `ap-gdpr-03` [1] (Union institutions); an evaluated `narrows` on `ap-gdpr-03` [2] (courts) | 0 findings each |
| (a) no taxonomy family · no provision · "don't know" as a term | (a) · T-03 · (a) |
| (b) a provision cited only for obligation · a threshold basis on a tier-2 text | (b) · (b) |
| (c) a tier-2 basis evaluated · `reinstates` evaluated · a term outside the vocabulary · an empty `when` | (c) · (c) · (c) · (c) and (d) |
| (d) drops on unanswered · `excludes` on unanswered · downgrade to `unlikely` · "don't know" as an answer · more confident when unanswered · `narrows` met on unanswered · `narrows` that downgrades | (d), each |

**19 of 19 as intended.** The last (d) case was not seen by the first version of the prototype — a `narrows` that downgrades on
an explicit answer passes properties (1)–(5); property (6) was added in this session for it.

### 9.5 · A finding, named for Session 28 (§8, 27.2 question 2)

Measured on 13 Nov 2026: 6 of the 90 provisions of the Phase 3 dimensions, on 5 rules, would fail (b) if it bound them — `ap-gdpr-02`
activity `gdpr:art-4`; `ap-gdpr-03` actor `gdpr:art-37` (cited for obligation only); `ap-dsa-02` activity `dsa:art-30`;
`ap-ai-act-05` actor `ai-act:art-25` (cited for obligation only); `ap-eidas2-01` activity `eidas2:art-2` and `eidas2:art-3`
(Articles of Regulation (EU) No 910/2014, which the parser cannot place; A-8's case). **Recorded, not closed, not a backlog**:
Session 28 decides what, if anything, follows; a change to any of them is a rule change, after the readings (E5-5).

### 9.6 · What Session 28 needs outside `tools/trigger-audit.mjs`

- **(d) needs the real matcher callable from Node.** `js/applies.js` runs its `boot()` against `document` on import, and
  `evaluate()` reads the module-level `IX`; a check that imports it fails, and one that copies it tests a copy (as §9.4 does).
  The matcher's pure part needs a home a check can import, with the taxonomy passed in — a change to `js/`, put to the author in
  Session 28 with its own §8 row.
- **`tools/validate.mjs` refuses what a new trigger writes**: `RULE_DIMENSIONS` admits only actor, activity and territory in
  `condition_provisions`, and `RULE_EXEMPTION_KEYS` has no `when`. Extending them is Session 29's, with the first new trigger;
  Session 28's check must not wait for it (its planted cases mutate a copy of the records).

### 9.7 · What this standard does not establish

- **That any item can be asked.** That is the X5-1 table's (§10), item by item.
- **That a passing trigger is right.** Each clause names what it cannot see; the reading of the Article is the session's, in the
  form (A-1…A-8), and the form is a declaration (`docs/ATTESTATION-FORM.md` §6).
- **The page.** The questionnaire's words, its "don't know", its rendering of an unanswered question and of NOT DETERMINED are
  X5-3's, Session 29's browser checks.
- **Anything about the law.** No Article was read for this section; every count is a measurement of `data/` on 13 Nov 2026.

## 10 · The X5-1 table (v2 Session 27, 27.3)

*Written on 13 Nov 2026 in v2 Session 27 (§8, "v2 Session 27, 27.2 question 1": the table here). **Proposed**: the dispositions
are the author's, one question per instrument, each a roadmap §8 row ("v2 Session 27, 27.3: …"). **Not a reading**: it classifies
what the records say, item by item; no Article was read for it, no rule is closed and no date moves. Measured on `main` `3627de6`
with scratch scripts outside the repository (§9.4's way); **nothing in `data/` changed**. **Decided on 13 Nov 2026, every
instrument as proposed** (§8, "v2 Session 27, 27.3: the X5-1 dispositions for the GDPR" … "for eIDAS 2, and with it the table
decided"); the table is approved with the session's final checkpoint.*

X5-1 asks for a recorded disposition for every `depends_on` item, threshold key and exemption that P-A brings in. There are
**68**: 38 `depends_on` items on 25 rules, 4 threshold keys on 3, 26 exemptions on 20. Numbered 1–68 in the records' order.

### 10.1 · How an item is classified

| Disposition | When it is proposed |
|---|---|
| **askable** | A fact of the reader's own case that the reader can know, defined by a provision the records hold (the rule's `condition_provisions`, its scope reference or its `threshold_basis`), expressible as one question whose terms are alternatives — no ordering, negation or tree in the matcher (§6, last risk). Its E5-3 (b) status is measured against the rule's present scope reference: it passes, or the rule needs one (a change in Session 29, a closure in the form). A threshold is asked as a yes/no on the figure its basis quotes, never as a number the matcher orders. |
| **askable (existing question)** | The fact is already a Phase 3 term; the rule is restated to require it. No new trigger. |
| **evaluated** | An exemption whose record states **one** condition that an explicit answer establishes — no "unless", no negation, no further case fact, and nothing the records call unresolved — with a tier-1 direct basis (E5-3 (c)). |
| **stays a stated dependency** | National law or transposition; an act of an authority not yet taken, or a procedure that can go either way; a question about the law rather than the reader; a legal qualification that holds per relationship (controller, data holder); a condition that needs a conjunction inside one dimension; or no outcome turns on it. The reason is written in each row. |
| **left** | An exemption printed as today, with the reason. |
| **to Session 28** | Decided with M-1 (F-05), whose shape it shares. |

### 10.2 · The proposal, counted

| | askable | askable (existing question) | evaluated | stays a dependency | left | to S28 | Total |
|---|---|---|---|---|---|---|---|
| `depends_on` | 18 | 2 | — | 16 | — | 2 | 38 |
| threshold keys | 4 | — | — | — | — | — | 4 |
| exemptions | — | — | 6 | — | 20 | — | 26 |
| **Total** | **22** | **2** | **6** | **16** | **20** | **2** | **68** |

By instrument: gdpr 10 (askable 2, existing 1, evaluated 4, stays 2, left 1) · dsa 10 (askable 6, left 4) · dma 8 (askable 6,
stays 1, left 1) · ai-act 13 (askable 6, stays 2, left 4, to S28 1) · data-act 8 (stays 2, left 5, to S28 1) · nis2 8 (stays 6,
left 1, evaluated 1) · dora 5 (askable 2, stays 1, left 2) · cra 3 (existing 1, left 2) · pld 2 (stays 1, evaluated 1) · eidas2 1
(stays 1).

### 10.3 · What it would do to the rules (§9.3; §8, 27.2 questions 4 and 4b)

- **Every item askable, so restated one step up** (a closure in the form, Session 29, after the reading): `ap-gdpr-02` (likely),
  `ap-dsa-03`, `ap-dsa-05`, `ap-dma-02`, `ap-ai-act-04`, `ap-ai-act-05`, `ap-dora-02` (possible), `ap-cra-01` (likely, by an existing
  question). Unanswered, each reads as today.
- **Every item askable, already `applies`, so not restated**: `ap-dsa-02`, `ap-dma-01`. Unanswered, each reads one step lower than
  today.
- **Some items askable and some staying, so not restated**: `ap-gdpr-04` (2 of 3), `ap-ai-act-03` (1 of 2). Answered, each reads
  as today; unanswered, one step lower per question; an explicit "no" removes the rule.
- **No item askable**: the other 15 rules with `depends_on` read exactly as today.

### 10.4 · What Session 29 would need (named, not done)

- **Scope references for E5-3 (b)** on the rules of items 8 (`gdpr:art-22`), 36 (`ai-act:art-6` on `ap-ai-act-05`), 37
  (`ai-act:art-25`) and 60 (`dora:art-31`): each a rule change, read and closed in the form.
- **New questions**: 13 to 15 by this proposal — GDPR targeting or monitoring (3) and solely automated decisions (8); DSA
  designation (11, 14), the 45 million figure (12, 13), vetting (17) and the research's object (18); DMA designation (20, 24), the
  core platform service (22) and the Art. 3(2)(b) figures (23, 25, 26); AI Act compute (30, 32), the high-risk route (33, 34, 36) and
  Art. 25 (37); DORA designation (60) and service to financial entities (61). Whether some are one question is Session 29's, after
  reading.
- **New answers for the evaluated exemptions**: purely personal or household activity (1); a competent authority acting for
  law-enforcement purposes (4); a court acting in its judicial capacity (6); a public administration entity in national security,
  public security, defence or law enforcement (56); free and open-source software outside a commercial activity (66); and the
  existing `actor:union-entity` offered on the page (5). Taxonomy terms are added, never renamed.

### 10.5 · Named for Session 28

- **M-1, F-05** (`ap-data-act-02`, item 43), and **item 40** (`ap-ai-act-07`) with it: the same shape — whether the territory answer
  `non-eu-serving-eu` already says what the item asks.
- **M-2, F-12** (`ap-ai-act-01`, `actor:gpai-provider`); **M-3, F-24** (`ap-pld-01` and deployers); **M-4, R-8** (GDPR Art. 2(2)(a)
  and (b) carried by no rule — beside items 1 and 4, which this table proposes evaluated for points (c) and (d)).
- **§9.5's finding** (six provisions of the Phase 3 dimensions on five rules).

### 10.6 · What this table does not establish

- **That any proposed question can be asked as worded here.** The wording, and whether two items are one question, follow the
  reading of the Article in Session 29.
- **That a provision named here says what the item asks.** It is named from the rule's own references; the records hold headings
  and summaries, and no Article was read.
- **That "left" and "stays" are permanent.** They are this proposal's, on today's records; a reading may change them.

### 10.7 · The table

**gdpr** (10 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 1 | `ap-gdpr-01` (applies) | excludes: Purely personal or household activity is outside scope. | Art. 2(2)(c) | **evaluated** | a new answer: purely personal or household activity · gdpr Art. 2(2)(c) |
| 2 | `ap-gdpr-01` (applies) | narrows: Under Article 30(5), an enterprise or organisation employing fewer than 250 persons need not keep records of processing activities, … | Art. 30(5) | **left** | an "unless" of case facts (risk, not occasional, special categories); "met" on a size answer would overstate |
| 3 | `ap-gdpr-02` (likely) | depends_on: Whether the offering is directed at data subjects in the Union, or their behaviour is monitored. | none named | **askable** | gdpr:art-3 · Art. 3(2)(a) and (b) in the scope reference |
| 4 | `ap-gdpr-03` (applies) | excludes: Processing by competent authorities for law-enforcement purposes falls under the Law Enforcement Directive rather than the GDPR — an … | Art. 2(2)(d); recital 19 (Directive (EU) 2016/680) | **evaluated** | a new answer: a competent authority acting for law-enforcement purposes (outside_dataset) · gdpr Art. 2(2)(d) |
| 5 | `ap-gdpr-03` (applies) | excludes: Processing by the Union's own institutions, bodies, offices and agencies is governed by a separate Union regulation rather than the GDPR … | Art. 2(3) | **evaluated** | the existing term actor:union-entity (not offered today) · gdpr Art. 2(3) |
| 6 | `ap-gdpr-03` (applies) | narrows: Courts acting in their judicial capacity are excepted from the obligation to designate a data protection officer that Article 37(1)(a) … | Art. 37(1)(a) | **evaluated** | a new answer: a court acting in its judicial capacity (narrows: shown) · gdpr Art. 37(1)(a) |
| 7 | `ap-gdpr-04` (likely) | depends_on: Whether the system processes personal data at all. | none named | **askable (existing question)** | activity:processing-personal-data, the rule restated to require it · gdpr:art-4 |
| 8 | `ap-gdpr-04` (likely) | depends_on: Whether decisions are based solely on automated processing and produce legal or similarly significant effects. | none named | **askable** | gdpr:art-22 · Art. 22 cited for obligation only: a scope reference needed (S29) |
| 9 | `ap-gdpr-04` (likely) | depends_on: Whether the organisation is the controller of the processing: Articles 22(3) and 35(1) bind the controller, the person or body that … | names Arts 22(3), 35(1) and 4 point (7) | **stays a dependency** | controllership is a qualification per processing operation; the record says an AI provider is one "only for the processing it determines itself" (the plan's own example, §6) |
| 68 | `ap-cross-01` (applies) | depends_on: Whether the recommender system processes personal data (EDPB Guidelines 3/2025, paragraph 88). | none named | **stays a dependency** | needs a conjunction inside the activity dimension, and rests on EDPB guidance, not an Article |

**dsa** (10 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 10 | `ap-dsa-01` (applies) | narrows: Under Article 19, providers of online platforms that are micro or small enterprises — and, for twelve months after losing that status, … | Art. 19(1) and (2) | **left** | "unless designated as a very large online platform": a negation |
| 11 | `ap-dsa-02` (applies) | depends_on: Actual designation by Commission decision. The threshold alone does not create the obligation. | none named | **askable** | dsa:art-33 (designation) · Art. 33(1) and (4) in the scope reference |
| 12 | `ap-dsa-02` (applies) | threshold: `monthly_active_eu_users_gte` | Art. 33(1) ('equal to or higher than 45 million') | **askable** | dsa:art-33 (the 45 million question, shared with item 13) · threshold basis Art. 33(1), tier-1 |
| 13 | `ap-dsa-03` (possible) | depends_on: Whether the service reaches 45 million average monthly active recipients in the Union. | none named | **askable** | dsa:art-33 (the same question as item 12) · Art. 33(1) and (4) in the scope reference |
| 14 | `ap-dsa-03` (possible) | depends_on: Whether the Commission has designated it. | none named | **askable** | dsa:art-33 (the same question as item 11) · in the scope reference |
| 15 | `ap-dsa-03` (possible) | narrows: Below the 45 million threshold and absent designation, Articles 33–43 do not apply. | Art. 33(1) | **left** | two negations ("below … and absent designation"), carried by items 13 and 14 |
| 16 | `ap-dsa-04` (applies) | narrows: Under Article 29, providers of online platforms allowing consumers to conclude distance contracts with traders that are micro or small … | Art. 29(1) and (2) | **left** | "unless designated as a very large online platform": a negation |
| 17 | `ap-dsa-05` (possible) | depends_on: Vetting by a Digital Services Coordinator. | none named | **askable** | dsa:art-40 (vetting) · Art. 40(4), (8), (9) and (12) in the scope reference |
| 18 | `ap-dsa-05` (possible) | depends_on: Whether the research is directed at systemic risks in the Union. | none named | **askable** | dsa:art-40 (whether one question with item 17 is S29's, after reading Art. 40) · in the scope reference |
| 19 | `ap-dsa-05` (possible) | narrows: Article 40 reaches only VLOPs and VLOSEs. Smaller platforms are outside it entirely. | Art. 33(1); Art. 40(4) and (12) | **left** | about the platforms researched, not about the reader |

**dma** (8 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 20 | `ap-dma-01` (applies) | depends_on: Designation by Commission decision for the specific core platform service. | none named | **askable** | dma:art-3 (designation) · Art. 3(1) and (9) in the scope reference |
| 21 | `ap-dma-01` (applies) | excludes: The DMA imposes no direct obligations on SMEs. | Section 5 (Conclusions), page 14; Art. 1(2); Art. 2 point (1) | **left** | cannot be evaluated under E5-3 (c): its direct basis is a tier-2 Commission report (§9.5) |
| 22 | `ap-dma-02` (possible) | depends_on: Whether the service is a core platform service within the Article 2 list. | names Art. 2 | **askable** | dma:art-2 (the core platform service list) · Art. 2 points (1) and (2) in the scope reference |
| 23 | `ap-dma-02` (possible) | depends_on: Whether the thresholds are met over three financial years. | none named | **askable** | dma:art-3 (with items 25 and 26) · Art. 3(1) and (2) in the scope reference |
| 24 | `ap-dma-02` (possible) | depends_on: Designation by Commission decision. | none named | **askable** | dma:art-3 (the same question as item 20) · in the scope reference of ap-dma-02 |
| 25 | `ap-dma-02` (possible) | threshold: `monthly_active_eu_end_users_gte` | Art. 3(2)(b) ('at least 45 million monthly active end users') | **askable** | dma:art-3 (one question or two with item 26: S29, after reading Art. 3(2)(b)) · threshold basis Art. 3(2)(b), tier-1 |
| 26 | `ap-dma-02` (possible) | threshold: `yearly_active_eu_business_users_gte` | Art. 3(2)(b) ('at least 10 000 yearly active business users') | **askable** | dma:art-3 (with item 25) · threshold basis Art. 3(2)(b), tier-1 |
| 27 | `ap-dma-04` (possible) | depends_on: The outcome of the pending cloud designation decisions. | none named | **stays a dependency** | the outcome of decisions not yet taken: no reader can answer it |

**ai-act** (13 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 28 | `ap-ai-act-01` (applies) | excludes: The AI Act does not apply to AI systems used exclusively for military, defence or national security purposes. | Art. 2(3), second subparagraph | **left** | "national security" is in the same condition, and the records say the Act does not resolve its characterisation (item 38) |
| 29 | `ap-ai-act-02` (applies) | narrows: Article 53(2) partially exempts models released under a genuinely free and open-source licence — but the exemption evaporates entirely … | Art. 53(2) | **left** | the exemption lapses for systemic-risk models, which turns on item 31 (stays) |
| 30 | `ap-ai-act-03` (likely) | depends_on: Cumulative training compute, which the questionnaire does not ask for. | none named | **askable** | through threshold item 32 (one question) · threshold basis Art. 51(2), tier-1 |
| 31 | `ap-ai-act-03` (likely) | depends_on: Whether the presumption is rebutted, or systemic risk designated by Commission decision. | none named | **stays a dependency** | a Commission procedure (rebuttal, or designation) that can go either way once the threshold is met |
| 32 | `ap-ai-act-03` (likely) | threshold: `cumulative_training_flop_gt` | Art. 51(2) ('greater than 10^25') | **askable** | ai-act:art-51 (a yes/no on the Art. 51(2) figure) · threshold basis Art. 51(2), tier-1 |
| 33 | `ap-ai-act-04` (possible) | depends_on: Whether the system is a safety component of a product covered by Annex I harmonisation legislation. | none named | **askable** | ai-act:art-6 (one new dimension, the high-risk route: Annex I safety component, or an Annex III area — no provision record for Annex III) · Art. 6(1) and (2) in the scope reference |
| 34 | `ap-ai-act-04` (possible) | depends_on: Whether it falls within an Annex III use case — biometrics, critical infrastructure, education, employment, essential services, law … | none named | **askable** | ai-act:art-6 (the same dimension as item 33) · in the scope reference |
| 35 | `ap-ai-act-04` (possible) | narrows: Under Article 6(3), an Annex III system that does not pose a significant risk of harm to the health, safety or fundamental rights of … | Art. 6(3) and (4) | **left** | several conditions and the provider's own documented assessment (Art. 6(3), (4)) |
| 36 | `ap-ai-act-05` (possible) | depends_on: Whether the system is high-risk at all. | none named | **askable** | ai-act:art-6 (the dimension of items 33 and 34) · Art. 6 not in ap-ai-act-05's scope reference: needed (S29) |
| 37 | `ap-ai-act-05` (possible) | depends_on: Whether the deployer rebrands, substantially modifies, or repurposes it. | none named | **askable** | ai-act:art-25 · Art. 25 cited for obligation only (§9.5): a scope reference needed (S29) |
| 38 | `ap-ai-act-06` (applies) | depends_on: Whether the use is characterised as national security, which the Act does not itself resolve. | none named | **stays a dependency** | the record: "which the Act does not itself resolve" |
| 39 | `ap-ai-act-06` (applies) | excludes: Article 4(2) TEU reserves national security to the Member States, and the AI Act does not apply to systems placed on the market, put … | Art. 2(3); Art. 4(2), third sentence | **left** | turns on item 38 (stays) |
| 40 | `ap-ai-act-07` (likely) | depends_on: Whether the system is placed on the Union market or its output used in the Union. | none named | **to S28 (M-1)** | the same shape as F-05: whether the territory answer non-eu-serving-eu already says it — decided with M-1 in S28 |

**data-act** (8 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 41 | `ap-data-act-01` (applies) | depends_on: Whether Chapter VI reaches contracts concluded before 12 September 2025: Article 50 phases in only Chapter IV for such contracts, and … | names Art. 50 | **stays a dependency** | a question about the law (Art. 50's reach, the FAQ silent), not about the reader |
| 42 | `ap-data-act-01` (applies) | narrows: Under Article 31(2), the obligations of Chapter VI do not apply to data processing services provided as a non-production version for … | Art. 31(1), (2) and (3) | **left** | two alternative conditions per service, with a duty to inform |
| 43 | `ap-data-act-02` (likely) | depends_on: Whether the provider offers services to customers in the Union. | none named | **to S28 (M-1)** | M-1, F-05: Session 28's question |
| 44 | `ap-data-act-02` (likely) | narrows: Under Article 31(2), the obligations of Chapter VI do not apply to data processing services provided as a non-production version for … | Art. 31(1), (2) and (3) | **left** | as item 42 |
| 45 | `ap-data-act-03` (applies) | narrows: Under Article 4(6) to (8), trade secrets are disclosed only where the data holder and the user take the measures necessary to preserve … | Art. 4(6), (7), (8) and (9) | **left** | turns on measures agreed between the parties, case by case |
| 46 | `ap-data-act-03` (applies) | narrows: Under Article 7(1), the obligations of Chapter II, Article 3(1) among them, do not apply to data generated through the use of connected … | Art. 7(1) | **left** | further conditions: partner or linked enterprises, subcontracting, the one-year tails |
| 47 | `ap-data-act-04` (possible) | depends_on: Which role the organisation occupies: data holder, user, or data recipient. | none named | **stays a dependency** | a role per data relationship, the same kind as item 9 |
| 48 | `ap-data-act-04` (possible) | narrows: Under Article 7(1), the obligations of Chapter II, Article 3(1) among them, do not apply to data generated through the use of connected … | Art. 7(1) | **left** | as item 46 |

**nis2** (8 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 49 | `ap-nis2-01` (likely) | depends_on: THE OPERATIVE DATE IS NATIONAL, NOT EUROPEAN. NIS2 is a directive: registration windows and compliance dates are set by each Member … | none named | **stays a dependency** | national transposition: no questionnaire can establish national law |
| 50 | `ap-nis2-01` (likely) | depends_on: Whether the organisation falls within an Annex I or Annex II sector and meets the size criteria. | none named | **stays a dependency** | contains the size criterion (item 52) |
| 51 | `ap-nis2-02` (likely) | depends_on: National transposition in the Member State of establishment. | none named | **stays a dependency** | national transposition |
| 52 | `ap-nis2-02` (likely) | depends_on: Size criteria. | none named | **stays a dependency** | size alone is not decisive: item 53's regardless-of-size cases, so an explicit "small" would wrongly remove the rule |
| 53 | `ap-nis2-02` (likely) | narrows: Under Article 2(1), NIS2 applies to entities of a type referred to in Annex I or II that qualify as medium-sized enterprises or exceed … | Art. 2(1); Art. 2(2), points (b) to (e); Art. 2(3) | **left** | a size rule with regardless-of-size exceptions |
| 54 | `ap-nis2-03` (possible) | depends_on: How the Member State has transposed the public administration sector. | none named | **stays a dependency** | national transposition |
| 55 | `ap-nis2-03` (possible) | depends_on: Whether national security functions are carved out. | none named | **stays a dependency** | national carve-outs beyond Art. 2(7) |
| 56 | `ap-nis2-03` (possible) | excludes: Under Article 2(7), NIS2 does not apply to public administration entities that carry out their activities in the areas of national … | Art. 2(7) | **evaluated** | a new answer: a public administration entity active in national security, public security, defence or law enforcement · nis2 Art. 2(7) |

**dora** (5 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 57 | `ap-dora-01` (applies) | depends_on: Which category of financial entity, which determines the proportionality of the requirements. | none named | **stays a dependency** | changes what applies, not whether: no outcome turns on it |
| 58 | `ap-dora-01` (applies) | excludes: Under Article 2(3), DORA does not apply to managers of alternative investment funds referred to in Article 3(2) of Directive 2011/61/EU; … | Art. 2(3) and (4) | **left** | categories defined by other Directives, and a Member State option (Art. 2(4)) |
| 59 | `ap-dora-01` (applies) | narrows: Under Article 16(1), Articles 5 to 15 do not apply to small and non-interconnected investment firms, payment institutions exempted under … | Art. 16(1); Art. 24(1) | **left** | two conditions bundled; categories defined by other acts |
| 60 | `ap-dora-02` (possible) | depends_on: Whether the provider is designated a critical ICT third-party service provider. | none named | **askable** | dora:art-31 (designation) · Art. 31 not in the scope reference: needed (S29) |
| 61 | `ap-dora-02` (possible) | depends_on: Whether it serves financial entities at all. | none named | **askable** | dora:art-3 (the point is S29's, after reading) · Art. 3 points (19), (21) and (23) in the scope reference |

**cra** (3 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 62 | `ap-cra-01` (likely) | depends_on: Whether the product is a product with digital elements within the Regulation's definition. | none named | **askable (existing question)** | activity:product-with-digital-elements, the rule restated to require it · cra:art-3 |
| 63 | `ap-cra-01` (likely) | excludes: Under Article 2(2) to (4), (6) and (7), the Regulation does not apply to products with digital elements to which Regulation (EU) … | Art. 2(2), (3), (4), (6) and (7) | **left** | each alternative is the scope of another act, or national security and defence |
| 64 | `ap-cra-01` (likely) | narrows: Under Article 69(2), products with digital elements placed on the market before 11 December 2027 are subject to the Regulation's … | Art. 69(2) and (3) | **left** | a date, "unless substantially modified", and Art. 14 still applying |

**pld** (2 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 65 | `ap-pld-01` (likely) | depends_on: National transposition, and the law of the Member State in which a claim is brought. | none named | **stays a dependency** | national law: transposition and the law of the forum |
| 66 | `ap-pld-01` (likely) | excludes: Free and open-source software developed or supplied outside the course of a commercial activity is outside the Directive. | Art. 2(2) | **evaluated** | a new answer: free and open-source software developed or supplied outside a commercial activity · pld Art. 2(2) |

**eidas2** (1 items)

| # | Rule (outcome) | Item | Rests on, per the records | Proposed | Provision · reason · E5-3 (b) |
|---|---|---|---|---|---|
| 67 | `ap-eidas2-01` (possible) | depends_on: Whether the organisation provides or relies on a European Digital Identity Wallet — the obligations on relying parties and trust service … | none named | **stays a dependency** | the record: the obligations on relying parties and trust service providers "are not mapped here" (V2C-21) |

## 11 · The paper test (v2 Session 27, 27.4)

*Written on 13 Nov 2026 in v2 Session 27. The four cases are the author's (§8, "v2 Session 27, 27.4: the cases of the paper test").
**On paper**: no code entered the repository. To keep the trace free of hand errors it was computed in the session's scratchpad
with the scratch matcher of §9.4, on a copy of the 33 rules transformed as the decided table says (§10.7: each askable item a
yes/no question the rule lists as `yes`; an asked threshold such a question in place of its key; the restatements of §10.3; the
six evaluated exemptions with a `when`). The copy was never written to `data/`; the questions' names below are the trace's, not
proposals for the page. **The outcome goes to block D**, not to C (the prompt's note of 13 Nov 2026; §11.4).*

**Reading the tables.** *Today*: the case's three answers on today's records and matcher. Then, under the decided table, every
new question **unanswered** (or "don't know", which is the same state), every new question answered **yes**, every new question
answered **no**. Only the rules that fire in some column are listed. Outcome words are the records' (`applies`, `likely`,
`possible`), not the page's.

### 11.1 · The four cases

**Case 1 · An EU-established AI deployer** — `actor:ai-deployer`; `activity:ai-deployment`, `activity:processing-personal-data`;
`territory:eu-established`.

| Rule | Today | Unanswered | Yes | No | What changes it |
|---|---|---|---|---|---|
| `ap-gdpr-01` | applies | applies | applies | applies | item 1 evaluated: removed only on an explicit "household" answer |
| `ap-gdpr-04` | likely | **possible** | likely | does not fire | item 8 asked; item 7 by the existing activity answer; item 9 stays, so not restated (§10.3) |
| `ap-ai-act-01` | applies | applies | applies | applies | nothing (item 28 left) |
| `ap-ai-act-04` | possible | possible | likely | does not fire | the high-risk route asked; restated one step up |
| `ap-ai-act-05` | possible | possible | likely | does not fire | the high-risk route and Art. 25 asked; restated one step up; two downgrades end at the floor |

NOT DETERMINED, in every column: the same twelve core instruments (dsa, dma, data-act, nis2, cer, dora, cra, ai-omnibus, eidas2,
csa, ehds, iea).

**Case 2 · A non-EU cloud provider serving the EU** — `actor:cloud-provider`; `activity:cloud-services`,
`activity:processing-personal-data`; `territory:non-eu-serving-eu`.

| Rule | Today | Unanswered | Yes | No | What changes it |
|---|---|---|---|---|---|
| `ap-gdpr-02` | likely | likely | **applies** | does not fire | item 3 asked; restated one step up |
| `ap-dma-02` | possible | possible | likely | does not fire | items 22–26 asked (the thresholds become a question); restated |
| `ap-dma-04` | possible | possible | possible | possible | item 27 stays |
| `ap-data-act-01` | applies | applies | applies | applies | item 41 stays, 42 left |
| `ap-data-act-02` | likely | likely | likely | likely | item 43 is M-1, Session 28's |
| `ap-nis2-02` | likely | likely | likely | likely | items 51, 52 stay; 53 left |
| `ap-dora-02` | possible | possible | likely | does not fire | items 60, 61 asked; restated |

NOT DETERMINED: today and unanswered, the same nine (dsa, ai-act, cer, cra, ai-omnibus, eidas2, csa, ehds, iea); **with every new
question answered no, gdpr and dora join them** — the reader's explicit answers removed the only rules that covered them.

**Case 3 · A public authority deploying AI** — `actor:public-authority`; `activity:ai-deployment`,
`activity:processing-personal-data`; `territory:eu-established`.

| Rule | Today | Unanswered | Yes | No | What changes it |
|---|---|---|---|---|---|
| `ap-gdpr-01` | applies | applies | applies | applies | item 1 evaluated |
| `ap-gdpr-03` | applies | applies | applies | applies | items 4, 5 (`excludes`) and 6 (`narrows`) evaluated |
| `ap-ai-act-06` | applies | applies | applies | applies | item 38 stays, 39 left |

The evaluated exemptions on `ap-gdpr-03`, each on an explicit answer: **the Union-entity answer** (`actor:union-entity`, beside
`actor:public-authority`) — the rule does not fire, removed by the Art. 2(3) exemption; **the law-enforcement answer** — does not
fire, removed by Art. 2(2)(d); **the court answer** — fires, `applies`, the Art. 37(1)(a) exemption shown as met; **"don't know"** —
fires, `applies`, no exemption applied or shown. NOT DETERMINED: the same twelve as case 1 in every column. **Not exercised**: item 56
(NIS2 Art. 2(7)) — `ap-nis2-03` needs `activity:critical-infrastructure-operation`, which this case does not answer.

**Case 4 · A VLOP** — `actor:vlop`; `activity:online-platform-activity`, `activity:recommender-systems`;
`territory:eu-established`.

| Rule | Today | Unanswered | Yes | No | What changes it |
|---|---|---|---|---|---|
| `ap-dsa-01` | applies | applies | applies | applies | item 10 left |
| `ap-dsa-02` | likely | **possible** | **applies** | does not fire | designation and the 45 million figure asked; already `applies`, not restated (today's `likely` is the threshold's downgrade) |
| `ap-dsa-03` | possible | possible | likely | does not fire | the same two questions; restated |
| `ap-dma-02` | possible | possible | likely | does not fire | fires through `actor:online-platform`, the VLOP term's parent |
| `ap-cross-01` | applies | applies | applies | applies | item 68 stays |

NOT DETERMINED: today and unanswered, the same eleven (ai-act, data-act, nis2, cer, dora, cra, ai-omnibus, eidas2, csa, ehds, iea);
with every new question answered no, **dma joins them**.

### 11.2 · X5-3 on paper: no unanswered question produces a "no"

- **In every case, with every new question unanswered, the same rules fire as today and NOT DETERMINED is the same list.** No
  rule stops firing, and none reads `unlikely` (the one `unlikely` rule, `ap-dma-03`, fires in none of the four).
- **Exhaustively over the four cases**: from each case with every new question answered yes, every subset of its answers — the
  three Phase 3 answers and the new ones — was removed in turn, for every one of the 33 rules: **17,301,372 evaluations, 0 in which
  a rule that fired stopped firing, 0 in which an absence read `unlikely`.**
- **A smaller result comes only from an explicit answer**: a "no" to an asked question, or an answer that meets an evaluated
  `excludes`. Then the rule does not fire, and an instrument with no other rule is NOT DETERMINED — absence of a rule, never
  "not applicable" (cases 2 and 4).

### 11.3 · What the paper test showed

- **Unanswered reads as today where every item is asked and the rule was restated** (`ap-gdpr-02`, `ap-ai-act-04`, `ap-ai-act-05`,
  `ap-dma-02`, `ap-dora-02`, `ap-dsa-03`), and **one step lower where it was not** (`ap-gdpr-04`, partial; `ap-dsa-02`, already
  `applies`) — as §10.3 and §8 27.2 question 4b said it would.
- **`ap-dsa-02` reads higher than today when answered yes** (`applies`, against today's `likely`): today's `likely` is the
  unasked threshold's downgrade, and the threshold is now asked.
- **An explicit "no" can put an instrument into NOT DETERMINED** (gdpr and dora in case 2, dma in case 4). That is the rule of the
  site — absence of a rule is absence of knowledge — but the page then says the same thing for "no rule covers you" and "the rule
  that would have covered you was excluded by your answer". **Named for Session 29's wording**, not decided here.
- **One evaluated item was not exercised** (item 56): no chosen case reaches `ap-nis2-03`.

### 11.4 · Input to block D (PV2-06…PV2-09)

The questionnaire is designed here and built in Session 29 against the selected direction — the Hybrid (§8, "PV2-05, C.5: the
author's explicit decision"); C's prototypes did not include `applies.html` (`docs/SESSION-ARCHITECTURE.md`, 25.5 question 3).
What D's design system and views (PV2-06, PV2-07) would need to hold for it, from this design and nothing else:

1. **An unanswered question and "don't know" as a visible state of their own**, never styled as "no".
2. **The reason a result is less confident**, per question left unanswered — today's downgrade sentences, more of them.
3. **NOT DETERMINED distinct from "not applicable"**, and able to say whether no rule covers the reader or the reader's own
   answer excluded the rule (§11.3).
4. **An exemption shown as met on the reader's answer** (an evaluated `narrows`), and **a rule removed by the reader's answer**
   (an evaluated `excludes`), each naming the Article it rests on.
5. **Room for 13 to 15 new yes/no questions and six new answers** (§10.4), beside the three existing questions.
6. **Status never by hue alone** (`docs/PROJECT-CONTEXT.md` §3, principle 6), for every state above.

### 11.5 · What the paper test does not establish

- **That the trace is the matcher Session 29 will build.** It is a scratch copy of `evaluate()` extended as §9.2 (d) states.
- **The page**: wording, order, the rendering of each state (X5-3's browser checks).
- **That the restatements are right.** Each is a rule change, read and closed in the form in Session 29, after the readings of
  Sessions 25 and 26 (E5-5).
- **Anything about the law.** No Article was read; the outcomes are the records' own, transformed as the decided table says.
