# AGENTS.md AS AN ENTRY POINT — the map of the moves (D4.1)

**Lifecycle:** active · **Authority:** canonical · **Home of:** the moves out of `AGENTS.md` in D4, and what each leaves behind · **Catalogue:** `docs/README.md`

**Status: A MEASUREMENT AND A PROPOSAL. IT MOVES NOTHING.** Written in documentation session D4 (26 Nov 2026,
`docs/DOCS-SIMPLIFICATION-PLAN.md` §2; scope: `docs/ROADMAP-v2.md` §8, «The scope of the documentation session D4»), on
`claude/vibrant-hypatia-7b2y7w`, measured on `main` `064488c`. It applies the author's decision «D1, D.3 question 1» (§8) and is put to the
author at checkpoint D4.1; nothing in `AGENTS.md` changes before the author's row for it is in §8. Line numbers are `AGENTS.md` at
`064488c` (797 lines, 66 073 bytes).

## 0 · What was measured, and how

- **Verbatim coverage.** Each paragraph leaving `AGENTS.md` was split into sentences, and each sentence searched (whitespace and emphasis
  normalised) in every tracked `.md` under `docs/` outside `docs/prompts/`, in `README.md` and in `agent/release/README.md`. **Of the 84 sentences
  of the eighteen paragraphs in lines 83–294, 3 occur anywhere verbatim**: the narratives summarise their homes in other words, so "the home
  already has it" cannot be read off a text match.
- **Fact coverage.** For each unit, its distinctive tokens (backticked identifiers, dated days, counted nouns) were searched in the home
  named below and in every `active` document of the catalogue. **No narrative paragraph and no hazard bullet has all its tokens in its
  home**, except the four marked *home has it* below, which were then read sentence by sentence.
- **Consequence (the prompt's rule, D4.1):** where the home does not already hold every fact, the unit moves **verbatim**; where it does,
  `AGENTS.md` loses the unit and keeps the pointer. The script was kept outside the repository; the figures above are its output.

## 1 · What stays, as it is

| Lines | Unit | Why it stays |
|---|---|---|
| 1–21 | title, entry-point line, «What this is» | the decision: what the project is |
| 23–66 | «Read these first, in this order» and its table (41 rows) | the decision: the reading table. **Its heading is question 3 in §6** |
| 68–85 | the operating policies table; the A/B/C/D paragraph | part of the reading table; the paragraph is a precedence rule («the stricter reading governs») |
| 87–90 | «Skills live in `.agents/skills/`…» | it tells an agent to invoke `project-context` |
| 288–291 | «The Control Room is not an agent.» | a definition, not a narrative |
| 293–294 | «The repository is the source of truth.» | a rule |
| 296–319 | **the eight rules** | **byte for byte** |
| 321–336 | «Architecture — do not rebuild it» | the decision |
| 338–345 | «Running it» | the decision |
| 347–367 | the four validators' commands; «Zero-dependency…»; the **Baseline** paragraph | the decision (commands); the baseline is a rule («A new warning is a finding») |
| 420–450 | the agent suites' commands | the decision |
| 496–562 | the browser, health, autonomy, improvement, production and governance commands, with the one or two lines under each that say what writes and what runs on every push | the decision (commands); those lines are operating rules |
| 579–580 | `tools/_footer.mjs`, `_refsweep.mjs`, `_review10.mjs`: «**Do not re-run** the latter two.» | a rule |
| 757–760 | «**Your base may be stale.**» (hazard 18) | already one rule, four lines, and an anchor; it stays whole |
| 761–787 | «Git» | the decision |
| 789–797 | «When to stop and ask», «**Report honestly.**» | **byte for byte** |

## 2 · What moves — the narrative paragraphs and the validator histories

Each unit lands **verbatim** in its home, under one dated section at the end of that document (§5 below), and `AGENTS.md` keeps one
pointer (§4). The home is the document the paragraph itself cites as its home; where that is a `closed` record, an `active` document the
paragraph also cites, except S28 (see the row).

| # | Lines | Unit (lead) | Home | Home has it? | Anchors that move |
|---|---|---|---|---|---|
| N1 | 92–104 | «A RELEASE CHAIN EXISTS FROM 4 NOV 2026…» | `docs/DEPLOYMENT.md` | no (14 of 21 tokens) | — |
| N2 | 106–112 | «The Orchestrator does not replace a specialist.» | `docs/ORCHESTRATOR.md` | no (6 of 7) | — |
| N3 | 114–130 | «SESSION 24 ran the first end-to-end cycle…» | `docs/ORCHESTRATOR.md` (it names it) | no (14 of 19) | «the rollback gate has never examined a record» |
| N4 | 132–149 | «NOTHING HAD EVER BEEN DECIDED WHEN SESSION 28 RAN…» | `docs/GOVERNANCE-PROPOSALS.md`, **a `closed` record**, as a dated note (`docs/DOCUMENTATION-ARCHITECTURE.md` §1 allows exactly that): the paragraph names it and calls itself «the measurement as it stood» | no (0 of 20 in it) | — |
| N5 | 151–175 | «PRODUCTION OPERATION IS NOT ACTIVATED…» | `docs/PRODUCTION-OPERATING-MODE.md` | no (21 of 34) | — |
| N6 | 177–191 | «THE HIDDEN ENTRY PASSES ALL TEN VISUAL CONDITIONS…» | `docs/PRODUCTION-OPERATING-MODE.md` (§4a) | no (14 of 18) | — |
| N7 | 193–208 | «LIMITED AUTONOMY IS SWITCHED ON…» | `docs/LIMITED-AUTONOMY.md` | no (15 of 27) | — |
| N8 | 210–236 | «SESSION 27 FOUND THE GATE LADDER UNPASSABLE…» (two paragraphs) | `docs/CONTINUOUS-IMPROVEMENT.md` (§4) | no (19 of 28) | — |
| N9 | 238–253 | «THE ADVERSARIAL GATE WAS RED FROM SESSION 24 TO 27 SEP 2026» | `docs/CONTINUOUS-IMPROVEMENT.md` (§4b) | no (12 of 14) | — |
| N10 | 255–266 | «THE LOOP IS `agent/improve/`…» | `docs/CONTINUOUS-IMPROVEMENT.md` | no (9 of 15) | — |
| N11 | 268–276 | «`agent/autonomy/` is the runner…» | `docs/LIMITED-AUTONOMY.md` (§6, §7) | no (11 of 15) | — |
| N12 | 278–285 | «The autonomy policy has ONE home…» | `docs/ORCHESTRATOR.md` | no (0 of 7) | — |
| N13 | 287 | «The verification gate is not a test suite.» — **a lead with no body** (§3, finding 1) | `docs/SECURITY-VERIFICATION-2026-09-08.md` §2 | **yes**: the lost body's facts are its §2 and line 22 | — |
| V1 | 369–381 | «`freshness.mjs`'s exit code changed in SESSION 30…» | `docs/CURRENT-ARCHITECTURE.md` (§12) | no (8 of 10) | — |
| V2 | 383–387 | «The four validators now have a suite of their own…» | `docs/CURRENT-ARCHITECTURE.md` (§12) | no (8 of 9) | — |
| V3 | 389–396 | «`tools/thirdparty.mjs` is what makes "no third-party requests" true…» | `docs/CURRENT-ARCHITECTURE.md` (§12) | no (7 of 10) | — |
| V4 | 398–405 | «`tools/source-contract.mjs` is the one contract…» | `docs/SOURCE-POLICY.md` | no (12 of 16) | (a second occurrence of «no URL here has ever been fetched»; the anchor follows H08) |
| V5 | 407–418 | «`tools/metric-contract.mjs` is the metric contract MC-1…MC-15…» | `docs/DATA-READINESS.md` (§9) | no (15 of 24) | — |
| V6 | 452–467 | «On 4 Nov 2026 the same 26 suites…» and the count history | `docs/CURRENT-ARCHITECTURE.md` (§12) | no (8 of 41) | — |
| V7 | 469–486 | «`agent/implement/selftest.mjs` R6 has now caught the suite list growing…» | `docs/CURRENT-ARCHITECTURE.md` (§12) | no (5 of 26) | «caught the suite list growing» (×2), «MODULE_SURFACE» |
| V8 | 488–494 | «There is CI, and a deploy gate…» | `docs/DEPLOYMENT.md` (§1b, §3) | no (4 of 6) | — |
| V9 | 564–572 | «`node agent/orchestrator/cli.mjs workflows`… exited 1…» | `docs/PRODUCTION-OPERATING-MODE.md` §6 with `docs/GOVERNANCE-PROPOSALS.md` §6b | **yes**: read sentence by sentence, every fact is in one of the two | — |
| V10 | 574–577 | «There is no overall health score.» | `docs/HEALTH-MONITOR.md` | no (1 of 3) | — |

## 3 · What moves — «Known hazards», one line each

The section stays `## Known hazards` with `- ` points, so `.control-room/views.mjs` `repositoryCaveats()` and its `docs-check` pin keep
working. Each bullet's whole text moves verbatim to its home (§5) and leaves one line (§4).

| # | Lines | Lead | Home | Home has it? | Anchors that move |
|---|---|---|---|---|---|
| H01 | 584–593 | «The brief's text has one home: the markup of `index.html`.» | `docs/CURRENT-ARCHITECTURE.md` §8 | no (16 of 17) | «\_\_CONTENT\_\_» |
| H02 | 594–596 | «Superseded translations.» | `docs/DATA-GOVERNANCE.md` §6 | **yes**: §6 item 2, with `docs/AI-SAFE-BOUNDARIES.md` §4 | — |
| H03 | 597–605 | «The deploy gate exists and was switched on 24 Oct 2026, unconfirmed.» | `docs/DEPLOYMENT.md` §3 | no (6 of 9) | — |
| H04 | 606–610 | «A data change needs a regeneration.» | `docs/SEO-OPERATIONS.md` | no (8 of 9) | — |
| H05 | 611–614 | «An edited inline script is a blocked script.» | `docs/DEPLOYMENT.md` (the CSP) | no (2 of 4) | — |
| H06 | 615–618 | «The validators do not read prose.» | `docs/VERIFICATION-POLICY.md` | no (1 of 2) | — |
| H07 | 619–640 | «`agent/ux/` has never opened a page, and `agent/browser/` now does.» | `docs/BROWSER-QA.md` §4 | no (16 of 25) | — |
| H08 | 641–646 | «A passing validator proves less than it looks.» | `docs/VERIFICATION-POLICY.md` | no (4 of 7) | «no URL here has ever been fetched» |
| H09 | 647–649 | «Derived output depends on the reader's clock.» | `docs/VERIFICATION-POLICY.md` §4 | **yes**: item 4 and «Clock dependence», sentence by sentence | — |
| H10 | 650–653 | «`git blame` answers nothing.» | `docs/VERIFICATION-POLICY.md` (reproducibility) | no (0 of 3) | — |
| H11 | 654–665 | «An `ApprovalRequest` in `agent/records/` is a request, not a grant.» | `docs/IMPLEMENTATION-QA.md` §3 | no (10 of 16) | — |
| H12 | 666–682 | «The privileged API has no authentication and no authorization — and it is still there.» | `docs/HEALTH-MONITOR.md` §6 | no (11 of 15) | — |
| H13 | 683–690 | «A lower number is not automatically healthier…» | `docs/HEALTH-MONITOR.md` | no (6 of 8) | — |
| H14 | 691–713 | «There are two public surfaces, and only one is the website.» | `docs/DEPLOYMENT.md` §1b, §2 | no (10 of 27) | — |
| H15 | 714–735 | «The public site now has one affordance that is not about EU law.» | `docs/AUTONOMY-AUTHORIZATION-POLICY.md` (the hidden entry; catalogue §2, `control-room`) | no (6 of 15) | — |
| H16 | 736–747 | «Every run store here is git-ignored EXCEPT one…» | `docs/CONTINUOUS-IMPROVEMENT.md` | no (7 of 8) | — |
| H17 | 748–756 | «The autonomy layer's action ledger is git-ignored…» | `docs/LIMITED-AUTONOMY.md` | no (0 of 2) | — |
| H18 | 757–760 | «Your base may be stale.» | stays (§1) | — | stays |

**What the Control Room shows after.** `repositoryCaveats()` would return 18 points, each the one line of §4 instead of the first 400
characters of the bullet. **But no code calls it** (§3 below, finding 2): the Control Room shows none of the 18 today and will show none
after. The pin protects a reader that has no caller.

## 3a · Findings (measured; none fixed here)

1. **A rule lost its body in a merge.** `AGENTS.md:287` is a bold lead with nothing after it. Merge `daba25a` (8 Sep 2026, «Merge
   SESSION 22, and give the autonomy policy one home») kept the lead of SESSION 23.5's paragraph (`a8c29a0`) and dropped its five
   sentences (`git show daba25a^2:AGENTS.md` has them; `daba25a:AGENTS.md` does not). Their facts survive in the home:
   `docs/SECURITY-VERIFICATION-2026-09-08.md` §2 (the four outcomes; `undecidable`, never a pass) and line 22 (not silently repaired).
   N13 makes the lead a pointer to them; it restores no sentence.
2. **`repositoryCaveats()` has no caller, and never had one.** It is exported by `.control-room/views.mjs:622`; `git grep` finds no call
   in the tree, and `git log -S'repositoryCaveats('` shows only its creation in SESSION 21 (`408945e`, 4 Sep 2026). D4's prompt and
   `docs/DOCS-DEPENDENCY-MAP.md` §0 describe it as what the Control Room shows. Wiring it into a view is not D4's work.
3. **Two hazards disagree about the deploy gate.** H03 says it was switched on 24 Oct 2026 «unconfirmed» and that until then a push still
   publishes directly; H14 says that since 24 Oct 2026 the site is published only by `pages.yml`. Both move verbatim; which is true today
   is `docs/DEPLOYMENT.md`'s to say, not this map's.
4. **A second home of four hazards inside a red-tier text.** `docs/AI-SAFE-BOUNDARIES.md` §4 «Known hazards» carries H01, H02, H03 and H06
   in other words. D4 does not touch that document.
5. **One moving anchor's `what` names the entry point**: «\_\_CONTENT\_\_», «the hazard, in the canonical entry point». The prompt allows
   only the `path` to change, so that `what` stays and becomes inexact.

## 4 · The pointer left in `AGENTS.md` (question 2 in §6)

Two forms; the hazards and the narratives use the same one.

- **(a) Lead and home:** `- **<the lead, verbatim>** \`<home>\` <§>.`
- **(b) Lead, the unit's own imperative sentences verbatim, and home** — so that no «do not» leaves the entry point. The sentences (b)
  keeps, verbatim:

| Unit | Kept under (b) |
|---|---|
| N1 | «Every other proposal here is still undecided, and **nothing in a test or a tool may put a line in that ledger to make it look otherwise**; the one entry there was made by a person.» |
| N7 | «**Ask that, never `DEFAULT_POLICY`, when the question is "what may happen now".**» |
| N12 | «Do not re-implement a condition or a trigger there.» |
| V1 | the clause «**exit 0 is not evidence of currency**», as its sentence |
| V3 | «`ALLOWED_RUNTIME_ORIGINS` is **empty**; an external runtime dependency is a Class D decision and goes there with its reason and who decided it.» |
| V4 | «**Those six are `ABSENT_BY_DESIGN` and are not a TODO**: every one asserts a document was FETCHED, and no URL here has ever been fetched (AUDIT F-12), so writing one would be a fabricated fact about evidence.» |
| V5 | «The fines figure has one computing function, `js/pipeline.js finesFigure()`; **do not sum `fine_eur` or count payment states anywhere else in `js/`** — MC-2 finds a second sum by line, and every view must import the function.» |
| H01 | «**Do not bring a copy back under any name**» as its sentence |
| H04 | «Never edit a file under `instruments/` by hand, and never store in `data/` anything to make a page read better: titles live in `tools/seo.mjs`.» |
| H05 | «Inline event handlers are an error.» |
| H11 | «One home for the fact of a decision — do not add a third writer.» |
| H12 | «Do not point a Control Room at the viewer's routes, and do not "fix" the viewer by bolting a token onto it …» as its sentence |
| H14 | «**Do not read that as "the Control Room is safe because nobody can find it."**» |
| H15 | «Do not add the meta tag, or a server route that reads the phrase, without deciding to.» |

The other units hold no imperative sentence; under either form they leave the lead and the home.

## 5 · Where the text lands, and the commits (D4.2)

In each home, one section at the end: `## Moved from \`AGENTS.md\` (26 Nov 2026, D4)`, a one-line dated note («Moved verbatim from
`AGENTS.md` at `064488c`, lines …, by documentation session D4 on the author's row «Checkpoint D4.1…» in §8. "Above" and "below" in it
refer to `AGENTS.md` as it stood.»), then the units in `AGENTS.md`'s order, unchanged. At the end, so that no parser reading a heading or a
fixed line is disturbed (`readBaseline()` takes the first `**Baseline at commit` in `docs/CURRENT-ARCHITECTURE.md`; the detector reads §5
to `## 6.`; `.control-room/selftest.mjs` reads `docs/CONTROL-ROOM.md` §5). A home's header changes only if what it is the home of
changes; none does.

**Five homes are `normative`** (`docs/LIMITED-AUTONOMY.md`, `docs/SOURCE-POLICY.md`, `docs/VERIFICATION-POLICY.md`,
`docs/DATA-GOVERNANCE.md` — pointer only, nothing lands — and `docs/AUTONOMY-AUTHORIZATION-POLICY.md`): the moved text becomes part of a
normative document under a dated note, which is why the author's row approves it. **One home is a `closed` record**
(`docs/GOVERNANCE-PROPOSALS.md`, N4), under the dated-note rule of `docs/DOCUMENTATION-ARCHITECTURE.md` §1.

**One commit per home**, each with `AGENTS.md`'s pointers and, where an anchor moves, its `path` in
`agent/proposals/governance/patterns.mjs`:

| Commit | Home | Units | Anchor `path`s changed |
|---|---|---|---|
| G1 | `docs/DEPLOYMENT.md` | N1, V8, H03, H05, H14 | — |
| G2 | `docs/ORCHESTRATOR.md` | N2, N3, N12 | 1 |
| G3 | `docs/GOVERNANCE-PROPOSALS.md` | N4 | — |
| G4 | `docs/PRODUCTION-OPERATING-MODE.md` | N5, N6; V9 (pointer only) | — |
| G5 | `docs/LIMITED-AUTONOMY.md` | N7, N11, H17 | — |
| G6 | `docs/CONTINUOUS-IMPROVEMENT.md` | N8, N9, N10, H16 | — |
| G7 | `docs/CURRENT-ARCHITECTURE.md` | V1, V2, V3, V6, V7, H01 | 4 |
| G8 | `docs/SOURCE-POLICY.md` | V4 | — |
| G9 | `docs/DATA-READINESS.md` | V5 | — |
| G10 | `docs/VERIFICATION-POLICY.md` | H06, H08, H10 | 1 |
| G11 | `docs/HEALTH-MONITOR.md` | V10, H12, H13 | — |
| G12 | `docs/BROWSER-QA.md` | H07 | — |
| G13 | `docs/SEO-OPERATIONS.md` | H04 | — |
| G14 | `docs/IMPLEMENTATION-QA.md` | H11 | — |
| G15 | `docs/AUTONOMY-AUTHORIZATION-POLICY.md` | H15 | — |
| G16 | pointers only | N13, H02, H09 | — |

Six anchor `path`s change in all (of the 9 in `AGENTS.md`); 3 stay: «Your base may be stale», «re-fetch and diff against it again»,
«Never state a validator passed if it was not run». After each commit: `node tools/docs-check.mjs` (0 errors),
`node agent/proposals/governance/cli.mjs check` (exit 0), and the suites of D4's prompt. **Estimated result:** about 330 lines from 797.

## 6 · The questions for the author at checkpoint D4.1

1. **The map** (§2, §3, §5): approve it as it stands, or change a home.
2. **The pointer's form** (§4): (a) lead and home, or (b) lead, the unit's own imperative sentences and home.
3. **The reading order's homes.** With the skill reading by levels, `CLAUDE.md`'s six-document list and the heading «Read these first, in
   this order» over `AGENTS.md`'s 41-row table both become second homes of a reading order. Options: `CLAUDE.md` keeps only «read
   `AGENTS.md`, then invoke `project-context`» and the table's heading line says it is an index, the skill deciding what to read; or
   `CLAUDE.md` changes and the table's heading stays as written; or both stay.
4. **Where the skill's tests live.** A new check in `tools/docs-check.mjs` (its planted case in `tools/docs-check-selftest.mjs`, its
   severity decided now; no suite count changes), or a test file of its own (added to `AGENT_SUITES`, so R6 goes from 26 to 27).

## 7 · What this map does not establish

That a moved paragraph is true: it moves as it stood, with its dated claims (finding 3). That a token found in a home carries the same
claim: the token measure counts words, and was used only to show that no home holds a whole unit. That `AGENTS.md`'s remaining text is
consistent with the documents it points to: D4 moves, it does not correct.
