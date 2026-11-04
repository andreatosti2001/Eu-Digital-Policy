# PHASE 5 SET-UP — "what applies", advanced: the material, an entry condition and an exit that can fail, and the sessions

**Status: APPROVED BY THE AUTHOR ON 4 NOV 2026 (roadmap §8, v2 Session 25, 25.4 questions 1–7; the answers in §7). PHASE 5
IS PLANNED AND NOT OPENED**: it opens on the author's word against E5-1…E5-7 (§3). Written on 4 Nov 2026 in v2
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

### 5.1 · Phase 5's own, placed against the calendar

Every session ends with the next one's prompt (§8, 4 Nov 2026, the standing rule), and each has a checkpoint per item that
changes anything outside `docs/`.

| When | Session | Scope | Ends with |
|---|---|---|---|
| Nov–Dec 2026 | **S27 · Design** (docs only; E5-5 does not apply) | **27.1** P-A…P-C and P-D (§7), if not decided before; **27.2** E5-3 written as a standard, with the planted cases a check would need; **27.3** the X5-1 table proposed: each of the 38 `depends_on` items, 4 threshold keys and 26 exemptions classified by what it rests on (the Article it names), measured with a scratch parser as `docs/ATTESTATION-FORM.md` §4 was, nothing in `data/` changed; M-1…M-6 each with a proposed session; **27.4** a paper test: the questionnaire answered for three or four of the 33 rules' typical cases, showing what changes and that no "no" is produced by an unanswered question | `docs/` only; Phase 5 opened on E5-1…E5-4, or not; the prompt of S25 confirmed unchanged and S28's drafted |
| 12 Jan–2 Feb 2027 | **S25, S26 · The reading** (maintenance, already prompted) | The 33 rules re-read in the form; the statuses at their milestones. **Not Phase 5**: they change a rule only as maintenance does. S26 writes the prompt of S28, carrying S27's design. | All 33 rules dated in January 2027; E5-5 met |
| Feb 2027 | **S28 · The standard as a check, and group (b)** | **28.1** E5-3 implemented in `tools/trigger-audit.mjs` (Class C), with `selftest` cases, at ERROR before any new trigger exists; **28.2** M-1, M-2, M-3, M-4, one question each, the Articles read in that session; a rule that changes is a closure in the form | checkpoint after 28.1; final |
| Feb–Mar 2027 | **S29 · The questionnaire** | The askable items of X5-1 as data in `data/applicability.json` and `data/taxonomy.json`, the matcher's intersections, `applies.html` and `js/applies.js`, the i18n register, the browser checks of X5-3, `$limits` and the notice per X5-5 | checkpoint per batch of instruments |
| Mar 2027 | **S30 · Derivations and exit** | M-5 (V2C-15), kept (§7 question 5), and only if the map sessions' V2C-13 has run — otherwise named residue; the exit audit X5-1…X5-7; the hand-over (§5.3) | Phase 5 concluded on the author's word, or the named residue |
| before 13 Apr 2027 | **S31 · Buffer, only if needed** | Whatever S28–S30 could not close, named | |

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
