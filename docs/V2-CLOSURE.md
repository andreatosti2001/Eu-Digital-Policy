# V2 CLOSURE — the closing gate of v2.0, measured

**Status: MEASURED, AND DECIDED BY THE AUTHOR ON 28 OCT 2026** (`docs/ROADMAP-v2.md` §8, "The closing
gate of v2"): **the v2 stays open, and Phase 3 is next**; every class proposed in §2 is decided as
proposed; V2C-01 stays class A and is fixed first in Phase 3. Written in v2 Session 11, 28 Oct 2026, on
`claude/v2-session-11-closing-gate`, cut from `main` at `17768c1`, on the author's scope
(`docs/ROADMAP-v2.md` §8, "The scope of v2 Session 11"). **This document does not declare the v2
closed, concluded or complete.** That is the author's decision, and until a row in §8 records it, no
document here may say it. A green check does not close a phase that was not executed.

It answers the author's roadmap (`docs/prompts/v2-session-6.md` §5): before v2 is called concluded,
compare the definition of done with `docs/ROADMAP-v2.md`, the later phases and their entry
conditions included, and do not mark as complete a phase that was not executed.

**How it was measured.** Every "today" cell below is a command or a test **re-run in this session**
on `17768c1` (plus the §8 scope row, `5fec457`, which changes no published file). None was copied
from the report of the session that closed the item. The outputs are kept with the session's
report (`docs/HANDOVER.md`, v2 Session 11). The reference date for every date-dependent check is
**2026-10-28**.

**Vocabulary.** The *Status* column uses five values: **executed**, **not executed**, **not
started**, **decision open**, **superseded**. For a "do not" rule of the brief it says
**respected** or **departure decided by the author**, with the row that decided it.

---

## 1 · The comparison (11.1)

### 1.1 The brief's five principles, as `docs/ROADMAP-v2.md` §1 makes them checkable

| # | Principle (brief) | Roadmap §1's check | Status | Evidence | Today |
|---|---|---|---|---|---|
| P1 | More explicit, not bigger | Phases 0 and 1 add no instrument, page or dataset; Phase 2 opens only after the Phase 1 checkpoint | **executed** | §8, Phase 1 checkpoint row (`2650cf4`) | `git log 5f3859e..2650cf4 -- data/ instruments/ '*.html'` lists 3 commits, none adding a record or a page: `7a2346e` and `76e24f8` touch `.control-room/ui/`, `d12b6ce` is the `applies.html` notice. The first commit to `data/` (`d25a2a8`, item 2.1) has `2650cf4` as its ancestor |
| P2 | Every expansion traceable to a declared criterion | 2.0 writes the criterion first; each addition cites it | **executed** | criterion approved 27 Oct 2026 (D-7); every Phase 2 record carries `scope_decision.criterion` | `evidence-audit --as-of 2026-10-28`: REGISTER "covered 16 · mapped 12 · watched 5 · excluded 6", 0 errors; M-04 holds for each Phase 2 record (W11, W13–W15, W17, below) |
| P3 | Uncertainty legible, not hidden | every new field or view states its `null` / `unknown` / absent states apart | **executed, with findings** | the Phase 2 records leave their analytical fields `null`, declared (§8 rows of items 2.2–2.6) | `validate` 0/0, 45 unverified. Findings V2C-01 and V2C-12 are places where the interface states less uncertainty than the data holds |
| P4 | Partiality allowed if declared | the register and the watchlist are data; unverified map edges shown as unverified or not shown | **executed for the register; the map half not executed** | item 2.1 (`d25a2a8`); the map view unpublished (§8, 27 Oct 2026, A.0) | register and watchlist derived and clean (W1). 8 of 40 relationships are still v1 (V2C-12) and `evidence-audit.mjs` does not read the relationships at all (V2C-13) |
| P5 | What was checked, on which evidence, at what date, with what limits | every Phase 0–1 change answers the four questions on screen | **executed** | 0.1, 0.2, 1.1 (below) | `.control-room/selftest.mjs` SNAPSHOT 0.1 and EDITORIAL 1.1 pass (§1.4) |

### 1.2 The brief's "Cosa NON fare", rule by rule

| # | Rule | Status | Evidence | Today |
|---|---|---|---|---|
| N1 | No Tier A/B/C as the first intervention | **respected** | Phase 4 not started; D-4 open | no "Tier A", "Tier B" or `tier-a` in `js/`, `.control-room/`, `tools/`, `agent/` |
| N2 | No custom serverless backend until a git-based CMS is shown insufficient | **respected** | D-5 open | no `functions/`, `netlify/`, `api/` or `serverless/` in the tree |
| N3 | Do not publish "what applies to me" before the triggers meet the claims' rigour | **departure decided by the author** | D-2, §8 27 Oct 2026: `applies.html` stays, with a notice (item 1.5, `d12b6ce`) | `applies.html` line 82 carries the approved notice; `tools/selftest.mjs` N1 passes. The triggers do **not** yet meet the claims' rigour (V2C-02) |
| N4 | Do not chase completeness (ViDA, AVMSD, copyright, GPSR, EAA, P2B, political advertising) | **respected** | item 2.1: six in the register, P2B on the watchlist | `ls instruments/`: 17 pages, none for those seven; W5 (M-05) passes |
| N5 | The dependency map is not an illustration: an unverifiable node or edge is removed or downgraded | **respected for the map view; not executed for the edges** | the map view is unpublished (§8 A.0); the brief-only edges print "Unverified · the brief itself" (`js/format.js` `tierWord()`) | 8 v1 edges are rendered in the interaction boxes without the "requires verification" flag, 3 of them on EUR-Lex with no locator and no claim (V2C-12) |
| N6 | No other dashboard before the audit's P0/P1 | **respected** | the one new view, Editorial audit (1.1, `76e24f8`), is the audit's own P1 item and came after the Phase 0 checkpoint (`9d51dc8` is its ancestor) | `git merge-base --is-ancestor 9d51dc8 76e24f8`: yes |
| N7 | No aggregated score over heterogeneous problems | **respected** | `agent/health/model.mjs overallScore()` throws | readiness: "There is no readiness score, and this report does not compute one" |
| N8 | Do not claim "operational security demonstrated" | **respected** | item 1.4 sweep (`721a26b`, `docs/AUDIT-2026-10-24.md` §5); README limitation 9 (`c886fdb`) | a re-sweep of every line added since `721a26b` to `README.md`, `AGENTS.md`, `docs/` (historical records excepted), the pages and `.control-room/` for the item 1.4 terms finds only legal text ("Secure electronic identification", `oeil.secure.europarl…` URLs) |
| N9 | Nothing implemented before the previous session is approved | **respected** | §8, one checkpoint row per session | each session's first write has the previous checkpoint commit as ancestor: `2650cf4`→`7f82f62`, `0595f75`→`8aa90fe`, `ae0bc00`→`f75c0f4`, `b985c4b`→`96d9b19`, `874fde2`→`11236e5`, `a981f62`→`89311c1`, `480a83c`→`3e0e869`, `8cdeec5`→`5fec457`; inside Session 3, `9d51dc8`→`76e24f8`. Observation: from Session 5 to Session 9 several decision rows were committed **in the same commit** as the change they authorise (`061c226`, `f75c0f4`, `fb015c6`, `19f63c1`, `98c9ade`), so git attests the decision and the change together; the order rests on the author's quoted words |

### 1.3 The brief's "Decisioni già prese", and D-1…D-10

| # | Decision | Status | Evidence | Today |
|---|---|---|---|---|
| B1 | Phase 2 priority inclusions: eIDAS 2.0, CSA, EHDS, IEA, DNA (as a regime in formation) | **executed** | items 2.2–2.6 | `eidas2`, `csa`, `ehds`, `iea` covered; `digital-networks-act` covered as `kind:proposal`, `status:proposal`; 5 of the 17 pages |
| B2 | Phase 3 conditional inclusions MiCA, PSD3/PSR, DGA in transition: only if the finance chapter is opened | **respected; not started** | watched on the finance-chapter condition (item 2.1; §8 27 Oct 2026, Q-6 for the DGA) | watchlist: dga, p2b, mica, psd3, psr. The finance chapter has not been opened |
| B3 | Uniform status labels (six) | **decision taken (D-3); not executed on the site** | designed in `docs/v2-design/status-labels.json`; `docs/V2-DATA-DESIGN.md` says Phase 3 implements it | no `label:` term in `data/taxonomy.json`; no renderer groups the 16 states (V2C-14) |
| B4 | The dependency map: a verifiable data artefact, subject to `evidence-audit.mjs` | **design executed (2.0); the audit half not executed** | D-6; `docs/V2-DATA-DESIGN.md` §1, §4 | `tools/evidence-audit.mjs` hashes `data/instruments.json` but checks no relationship; `validate.mjs` checks that references resolve and the v2 reference shape; `tools/selftest.mjs` W12 pins the v1 list so it only shrinks (V2C-13) |
| B5 | Control Room Tier A/B/C; login preferably a git-based CMS with OAuth; serverless only if necessary | **decision open (D-4, D-5); Phase 4 not started** | §3 | — |
| B6 | Sequence Phase 0 → 1 → 2 → 3 → 4 → 5 | **executed to Phase 2; one change decided by the author** | item 2.0 (design, documents only) brought forward to Session 2 (§8, 25 Oct 2026); items 2.1–2.6, which write data, waited for the Phase 1 checkpoint | P1 above |
| B7 | `stratum` is a heuristic; review it in Session 2 | **executed (D-8): dropped**; its replacement derivation **not executed** | §8 25 Oct 2026, option (c) | `stratum` appears nowhere in `js/`, `tools/`, `agent/`, `.control-room/` or `data/`; nothing derives "what it meant" from the actors and edge kinds (V2C-15) |
| D-1 | Where the brief lives | **executed** | `b5cd88e` | `docs/BRIEF-v2.md` exists; `AGENTS.md` points to it once |
| D-2 | `applies.html` and the rigour of the triggers | **executed (notice)** | `d12b6ce` | N1 passes; `applies.notice` is `pending_translation` in it, fr and es (V2C-27) |
| D-3 | Six labels as a derived grouping over 16 states | **decision taken; not executed** | `docs/v2-design/status-labels.json` | as B3 |
| D-4 | The names of the three levels | **decision open** | §3 | — |
| D-5 | Git-based CMS with OAuth | **decision open** | §3 | — |
| D-6 | The map extends the relationships; a derived view | **executed in the data (v2 references on 32 of 40); the view not published** | `f90212f`, Phase 2 edges | 40 relationships, 8 v1-shaped |
| D-7 | The inclusion criterion | **executed** | `docs/V2-DATA-DESIGN.md` §5; `inclusion_criterion` terms | M-03, M-04 hold (W1–W4) |
| D-8 | `stratum` | as B7 | | |
| D-9 | The attestation recorded in the trail | **executed** | `cd3cd22` | ATTEST · 0.2 tests pass (§1.4) |
| D-10 | Item 0.3 in Phase 0 | **executed** | `2606f3e` | D1–D4 pass (§1.4) |

### 1.4 Every item of §4, from 0.1 to 2.6, with its exit criterion re-run today

The tests named are in the 25-suite run of this session (`docs/HANDOVER.md`, v2 Session 11), each
reported `ok`.

| Item | Exit criterion (§4) | Status | Commit | Today |
|---|---|---|---|---|
| 0.1 | every view payload carries an ISO assembly time; the health payload's three fields distinct, no label presents `as_of` as a run date; no "Live system" label | **executed** | `7a2346e` | `.control-room/selftest.mjs` "SNAPSHOT · 0.1 · every view payload carries the ISO time…", "…three fields", "'Live system' is no label…": ok |
| 0.2 | a decision without an attestation refused naming the field; an unknown field still refused; the attestation in the trail entry and the chain verifies; the tree byte-identical but the ledger | **executed** | `cd3cd22` | "ATTEST · 0.2" ×4 ok; "10 · an approval changes exactly one file, and it is the decision ledger" ok; "11b · the audit chain detects an edited entry" ok |
| 0.3 | an invalid date makes each tool exit 2; the audit's own command gives the positional report | **executed** | `2606f3e` | `tools/selftest.mjs` D1, D2, D3, D4 ok |
| 0.4 | `docs/CONTROL-ROOM.md` §5–§6 true about 0.1–0.2 | **executed** | `31db1a4` | no test; the INVENTORY · 1.3 assertion (below) now holds the whole document to the interface |
| 1.1 | "no recorded run" with the command on a fresh clone; a recorded run with all four answers; no route that executes | **executed** | `76e24f8` | "EDITORIAL · 1.1" ×3 ok |
| 1.2 | every reading row carries name and definition; one term | **executed** | `8962210` | "METRICS · 1.2" ×2 ok |
| 1.3 | the inventory assertion exists, passes, and fails on a planted tab | **executed** | `f9d9f26` | "INVENTORY · 1.3" ×3 ok |
| 1.4 | every occurrence examined listed, with what was done | **executed** | `721a26b` | no test; `docs/AUDIT-2026-10-24.md` §5 lists 26 rows; the re-sweep (N8) finds nothing new |
| 1.5 | the notice, in the author's words, only if D-2 is so decided | **executed** | `d12b6ce` | `tools/selftest.mjs` N1 ok |
| Phase 1 checkpoint | every P0/P1 row of `docs/AUDIT-2026-10-24.md` §1.5 marked done with its commit | **executed** | `e6eb186`, `2650cf4` | §1.5: five rows, each "Done" with its commit |
| 2.0 | the criterion, the label grouping, the map model, the `stratum` review, the audit plan, the register schema — in documents | **executed** | `89eb912`, `e57dd83` | the six deliverables exist in `docs/V2-DATA-DESIGN.md` and `docs/v2-design/`; no test (documents) |
| 2.1 | the seven regimes as records with their reason; none a page; a status no source was read for is `null`; the checks arrive with the records | **executed**; the `edge-v1-sources` flip **deferred by the author** | `d25a2a8`, `76fa900` | W1–W10 ok; `evidence-audit` REGISTER as above |
| 2.2 | eIDAS 2.0 promoted: facts from retrieved primary sources; prose approved; `_footer` re-run; locale keys declared; M-04/M-05/M-07 held | **executed** | `061c226` | W11 ok; `seo-audit` 0/0 (it fails a stale generated page); `i18n-audit` 0/0 |
| 2.3 | the CSA, the same criteria | **executed** | `f75c0f4` | W13 ok |
| 2.4 | the EHDS, the same criteria | **executed** | `fb015c6`, `601fe44` | W14 ok |
| 2.5 | the IEA, the same criteria | **executed** | `0047586` | W15 ok |
| 2.6 | the DNA as a regime in formation; the status what the sources establish on the date checked | **executed** | `53f51e6` | W17 ok. Whether a fact was read from a retrieved source is not something a test can re-establish: the §8 rows and the source records are the evidence, and no source was re-read in this session |
| Phase 2 checkpoint | — | **executed** | §8, 28 Oct 2026, Session 9 checkpoint ("Phase 2 (items 2.0–2.6) is closed") | — |
| Session 10 (10.1, 10.2) | outside the phase numbering; maintenance from the author's roadmap | **executed** | `d7d737b`, `8876649`, `947803f`, `90c7f92`, `77b9058` | W18 ok |

**No exit criterion of 0.1–2.6 fails today.** What does not hold are things §4 left open by design
or by the author's decision, and they are findings below: the deferred `edge-v1-sources` flip
(V2C-12), and the map audit and status labels that Phase 3 implements (V2C-13, V2C-14).

### 1.5 Phases 3, 4 and 5, and the finance chapter — entry conditions measured today

| Phase | Entry condition | Status | Today |
|---|---|---|---|
| **3** — "what applies", base | every rule's source reference carries `supports` and a locator; every condition resolves to a provision ID; `evidence-audit.mjs` reads `applicability.json` and reports its rules as it reports claims | **not started; entry condition not met** | `data/applicability.json`: **33 rules**; **0** of 33 carry a source reference with `supports` and a locator (every reference is a bare id); **0** of the 101 condition values resolve to a provision ID (the conditions are taxonomy terms: `activity`, `actor`, `territory`, `thresholds`); the 77 `obligations` do resolve (77 of 77). `tools/evidence-audit.mjs` loads and hashes the file but checks no rule; `tools/evidence-audit-record.mjs` LIMITS says "It reports nothing about data/applicability.json". Phase 3 also holds, by §8: R-01 and the eight findings of `docs/V2-DATA-DESIGN.md` §7 (Q-5) |
| **4** — automation | D-4 and D-5 decided; automates only what Phases 0–1 made visible | **not started; decisions open** | D-4, D-5 open (§3) |
| **5** — "what applies", advanced | written only after Phase 3's checkpoint | **not started; not planned by definition** | — |
| Finance chapter (MiCA, PSD3/PSR, DGA) | the author opens it explicitly | **not started** | the four are on the watchlist on that condition |

### 1.6 The validators, suites and gates, against Session 10's closing baseline

| Measure | Session 10 close | Today (`17768c1`, as of 2026-10-28) | Moved? |
|---|---|---|---|
| `validate` | 0 / 0 / 45 unverified | 0 / 0 / 45 | no |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | no |
| `evidence-audit --as-of 2026-10-28` | 0 errors · 11 warnings · covered 16 · mapped 12 · watched 5 · excluded 6 | the same | no |
| `freshness --as-of 2026-10-28` | 0 defects · 3 prompts | 0 defects · 3 prompts | no (same date) |
| 25 suites | 1314 pass + 1 skipped (`::1`) | 1314 pass + 1 skipped (`::1`, EAFNOSUPPORT), 0 failures | no |
| browser suite (`--require-browser`) | 343 · 0 · 1 (`a11y:bound`) | 343 · 0 · 1 (`a11y:bound`), exit 0. A first run exited 1 because this document was written while it ran (the suite treats a changed tree as suspect); the re-run on a still tree is the figure | no |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 (PP-08 partial/high; HE-04, OB-05 partial/medium; PP-09 undecidable) | no |
| `agent/schemas/cli.mjs check`; `.control-room/cli.mjs boundary`, `routes`; `og-image --check` | exit 0 | exit 0 | no |
| `agent/production/cli.mjs readiness` | refuses | **refuses: 17 of 20 mandatory pass**; blocking `production_dispatcher_wired`, `decision_ledger_present`; unmeasurable `deploy_gate_exists`; advisory `agents_instrumented` | — |
| records | 39 / 40 / 225 / 181 / 101 / 312 | the same | no |
| instrument pages · indexable routes | 17 · 26 | 17 · 26 | no |
| `tools/commit-evidence.mjs origin/main HEAD` | 0 without evidence | 0 without evidence (`5fec457` changes no published file) | — |

---

## 2 · The open findings (11.2)

**Sources read:** `docs/HANDOVER.md`, every "Found, for the author" and "Still open" of v2 Sessions
1–10; `docs/AUDIT-2026-10-24.md` §5; `docs/V2-DATA-DESIGN.md` §7; the author's roadmap §3
(`docs/prompts/v2-session-6.md`); and §1 above. **Each was re-checked against today's tree**; a
finding closed by a commit is listed in §2.2, not as open.

**Law?** answers one question: does the finding touch what the site tells a reader about EU law (a
status, a date, an obligation, a relationship between acts, a source) — **yes** — or only the
presentation, the internal tools or the environment — **no**. "Data only" means the value is in
`data/` and reaches a reader only as raw JSON in the datasets explorer.

**Proposed class** — proposed by this session and **decided as proposed by the author on 28 Oct
2026** (§8):
- **A** — blocks the closure: the site states something false, or a v2 exit criterion fails today;
- **B** — assigned to a named later phase or session, with the reason;
- **C** — to be verified outside this environment (network, an IPv6 runner, another browser, a
  device), with where and how;
- **D** — a declared limitation, proposed for the README's "Known limitations" (the wording is
  proposed, never written here);
- **E** — closed or superseded, with the commit or §8 row.

### 2.1 Open

| ID | Origin | What, in one line | Law? | Measured today | Proposed class |
|---|---|---|---|---|---|
| V2C-01 | S9 found 1 | An edge from a proposal is labelled in the present tense. The interaction card reads "Digital Networks Act Amends ePrivacy" and "Data Omnibus Repeals P2B Regulation". The "Related" list of the DNA page reads "ePrivacy / Amends" with no qualifier at all; only the card's summary says "Proposed:" | **yes** | Chromium, `/instruments/digital-networks-act/` and `/instruments/data-omnibus/`: 3 + 4 card heads in the present tense. 8 edges have a proposal as `from`: 7 summaries start "Proposed"/"PROPOSED"; `rel-data-act-cloud-ai-act` (a conflict) does not | **A**: read on its own, the "Related" list states as law what is only proposed. The status badge and the summary on the same page mitigate it; the author may judge that enough and reclassify (B, Phase 3, where the map's modality is derived) — **Closed, `580621c`**: the derived modality (`js/map-model.js`), approved by the author at the checkpoint of v2 Session 12 (28 Oct 2026, `docs/ROADMAP-v2.md` §8) |
| V2C-02 | roadmap §4 Phase 3; §1.5 above | The Phase 3 entry condition is not met: 0 of 33 rules with `supports` + locator; 0 of 101 condition values resolving to a provision ID; `evidence-audit.mjs` checks no rule | **yes** (`applies.html` is published, with the D-2 notice) | §1.5 | **B — Phase 3**: it *is* Phase 3's opening work ("starts by extending the check") |
| V2C-03 | design §7 F-1 | Edges have a second home in the instrument arrays: `data-omnibus.proposes_to_amend` lists `eprivacy` and `nis2` with no relationship | data only | 2 of the 4 counted on 27 Oct now have an edge (`data-act` amends, `dga` repeals) | **B — Phase 3** (§8, 27 Oct 2026, Q-5) |
| V2C-04 | design §7 F-2 | `proposes_to_amend` lists `dga`, which COM(2025) 837 would repeal | data only (the repeal edge `rel-data-omnibus-dga-repeals` is what the pages show) | still in the array | **B — Phase 3** (Q-5) |
| V2C-05 | design §7 F-3 | `proposes_to_amend` omits `cer`, which COM(2025) 837 amends (Art. 9) | data only | still omitted | **B — Phase 3** (Q-5) |
| V2C-06 | design §7 F-4 | `ap-ai-act-03`'s threshold key `cumulative_training_flop_gte` reads "≥ 10^25"; AI Act Art. 51(2) says "greater than" | **yes** (`applies.html` prints the key's words) | `{"cumulative_training_flop_gte": 1e+25}` | **B — Phase 3** (Q-5). **It meets the A criterion** (a published statement that differs from the cited Article); the §8 decision placed it in Phase 3. To be confirmed or revisited by the author |
| V2C-07 | design §7 F-5 | `ap-gdpr-03` omits the GDPR Art. 37(1)(a) exception for courts acting in their judicial capacity | **yes** (`applies.html` prints the exemptions) | the one exemption listed is the Law Enforcement Directive | **B — Phase 3** (Q-5); an omission, not a false statement |
| V2C-08 | design §7 F-6 | `ap-dsa-04`'s exemption names "the online-platform section" (Section 3, Art. 19); the marketplace exclusion is Section 4, Art. 29 | **yes** | unchanged | **B — Phase 3** (Q-5). **It meets the A criterion** (it names the wrong Section); as V2C-06 |
| V2C-09 | design §7 F-7 | `ap-dsa-01`'s exemption omits the Art. 24(3) exception and the twelve-month tail | **yes** | unchanged | **B — Phase 3** (Q-5); an omission |
| V2C-10 | design §7 F-8 | 11 of 33 rules' `dates` omit an application event of their own obligations, among them the Omnibus's 2 Dec 2026 Art. 5 tranche (`ap-ai-act-01`, `-06`, `-07`) | **yes** | the three AI Act rules still list only `tl-ai-act-2025-02-02-application`; the count of 11 was not re-derived here | **B — Phase 3** (Q-5) |
| V2C-11 | S4 A found 1; §8 Part A checkpoint | R-01 cannot fire for P2B: its trigger would be a milestone of `data-omnibus` | no (the watchlist's own alarm) | unchanged; W8 tests R-01 on the record's own milestones | **B — Phase 3** (§8, "Rinvia alla Fase 3") |
| V2C-12 | S4 A.0; S5 B.3; roadmap of the author §3 item 3 | 8 relationships stay v1, and the `edge-v1-sources` / `edge-analytical-no-claim` flip stays deferred. 4 rest only on the brief (shown "Unverified · the brief itself"); `rel-dsa-dma-scope`, `rel-nis2-cer` and `rel-cra-nis2` cite EUR-Lex with no locator and no claim; `rel-data-omnibus-gdpr` is v1. None carries the "requires verification" flag | **yes** (the interaction boxes on the instrument pages) | 40 relationships, 8 v1 (listed); W12 holds the list to shrinking | **B — Phase 3** (the map: §8 27 Oct 2026, A.0) |
| V2C-13 | §1.3 B4 (this session) | The brief's decided "map subject to `evidence-audit.mjs`" is not implemented: the audit checks no relationship | no (a check that is missing) | `grep` of `tools/evidence-audit.mjs` and `tools/register-audit.mjs`: no relationship rule beyond the M-04 sector-instance edge test | **B — Phase 3** (`docs/V2-DATA-DESIGN.md` §4, "Phase 3 implements") |
| V2C-14 | §1.3 B3 (this session) | The six uniform status labels (D-3) are not on the site | **yes** (how a status reads) | no `label:` term in `data/taxonomy.json`; no renderer | **B — Phase 3** |
| V2C-15 | §1.3 B7 (this session) | What `stratum` meant is to be derived from the actors and the edge kinds (D-8); nothing derives it | no | nothing in the tree | **B — Phase 3** |
| V2C-16 | S9 found 2 | The design derives an edge's modality from its `from` node (`docs/V2-DATA-DESIGN.md` §1.4), which would read an `enables` edge into a proposal as law; the four `enables` candidates (from `eidas`, `nis2`, `gdpr`, `iea`) are not added | no today (nothing derives modality) | unchanged | **B — Phase 3** (the map's derivation) |
| V2C-17 | S9 found 3 | The acts the DNA would repeal or amend (Directive (EU) 2018/1972, Regulation (EU) 2018/1971, Decision No 243/2012/EU, Regulation (EU) 2015/2120, Decision No 676/2002/EC) are not nodes | partly (named only in the title) | unchanged | **B — Phase 3** (the map) |
| V2C-18 | S8 found 4 | `nis2 → eidas` (NIS2 amends Regulation (EU) No 910/2014, per the metadata) not modelled; the NIS2 Article was not read | no false statement (an absent edge) | unchanged | **B — Phase 3** (the map) |
| V2C-19 | S4 A found 3 | Political Advertising Regulation Art. 2(3)(f) and (h) name the AVMSD and P2B: two `defers-to` edges not added (§8: "No, non ora") | no | unchanged | **B — Phase 3** (the map) |
| V2C-20 | S9 found 7 | No event type for a procedural step (referral, draft report, EESC opinion); the status note carries them | no (the note carries them) | unchanged | **B — Phase 3** (status labels and transitions, D-3) |
| V2C-21 | S5 A found 2 | `eidas2.regulated_actor` mixes the addressees of the wallet duties with trust service providers from the scope article; not exhaustive | **yes** ("who it binds") | unchanged | **B — Phase 3** (who a rule binds is the actor model Phase 3 audits) |
| V2C-22 | S8 found 3 | `data-omnibus`'s status note ("as at 21 October 2026") says the Coreper outcome of 21 Oct 2026 had not been published; to be re-read against a Council source | **yes** (a status) | `status_as_of` 2026-10-21; unchanged. In Session 8 the Council site answered 403 from this environment | **C** — re-read the Council's record of the 21 Oct 2026 Coreper meeting from a network that reaches consilium.europa.eu, then a session writes it |
| V2C-23 | S5 B found 3; roadmap of the author §3 item 5 | `src-ec-ai-omnibus-in-force` answered 403 on 27 Oct 2026 and has not been re-read since 27 Aug 2026; it supports `clm-ai-act-delay-scope` | **yes** | not re-fetched in this session | **C** — fetch the Commission page from another network; if it still fails, the claim's support is re-assessed |
| V2C-24 | `freshness`, this session | 3 staleness prompts: the enforcement set is 62 days old (interval 45); 5 provisional enforcement records not re-verified in 30 days; the newest enforcement action recorded is 68 days old | **yes** (enforcement) | `freshness --as-of 2026-10-28`, exit 0, 0 defects | **B — an evidence session** (enforcement update), outside v2's phases; closed only by verification work |
| V2C-25 | `evidence-audit`, standing | 11 warnings: 9 `POSSIBLY_COMPOSITE_CLAIM`, 2 `DIRECT_CLAIM_WITHOUT_LOCATOR` (`clm-art-34-open-concept`, `clm-data-omnibus-stalled`) | **yes** (claims) | 11, as at the close of Sessions 5–10 | **B — an evidence session**, outside v2's phases |
| V2C-26 | S7 found 5 | `agent/depth` reports `missing_competence` for `ehds` (as for `eidas2` and `pld`): no institution named; the pages say "not established" | yes, declared ("not established") | not re-run (an agent CLI; `agent/records/` stays empty) | **B — a data-depth session** (competences read from the acts) |
| V2C-27 | §8 item 1.5; i18n register | `applies.notice` — the statement that the rules are not verified to the claims' standard — is `pending_translation` in it, fr and es; fr and es also hold `annex-b.p10` pending and 8 keys superseded | **yes** (the notice) | `i18n/locales.json` | **B — a translation pass reviewed by a speaker** (README limitation 5 already declares the lag; an approval is a person's, `docs/AI-SAFE-BOUNDARIES.md` §3) |
| V2C-28 | S8 found 1 | The "not covered" notice's "Read it at the source" link is the browser's default blue (`rgb(0, 0, 238)`) in **both** themes; on the dark background (`rgb(20, 17, 27)`) that computes to about 2.0:1 | no (presentation; accessibility) | Chromium, `instrument.html?id=p2b`, both themes | **B — a maintenance session**; the same rule as `77b9058` would apply |
| V2C-29 | S8 found 2 | The EHDS page `<title>` reads "EHDS — key provisions and key dates" | no | `instruments/ehds/index.html` | **B — a maintenance session** |
| V2C-30 | S9 found 4 | "member State" in the generated meta, og, twitter and JSON-LD descriptions — on **5** pages (CSA, DNA, EHDS, eIDAS2, IEA), not the 3 recorded in Session 9 | no | `grep` of `instruments/*/index.html` | **B — a maintenance session** (`tools/seo.mjs` `lowerLead()`) |
| V2C-31 | S9 found 5 | An undated source's bibliography entry ends `.”.` — **31** entries in the rendered bibliography, not only the OEIL procedure files | no | Chromium, `bibliography.html` | **B — a maintenance session** |
| V2C-32 | S9 found 6 | "The instrument record itself was last verified on / 28 October 2026 / ; …": the date breaks onto its own line because the `<b>` inside `.fresh` renders `display: block` | no | measured on the DNA, IEA **and GDPR** pages: so not new to Phase 2 | **B — a maintenance session** |
| V2C-33 | S5 A found 3 | "1 rule in the dataset turn on this instrument" (CRA, eIDAS2, PLD pages); "1 days ago" (`js/evidence-view.js:132`) | no | CRA page in Chromium; the code path | **B — a maintenance session** |
| V2C-34 | S10 found 1 | Leftovers in claim notes outside the rule: a provision id ("No tfeu:art-16 provision is modelled"), bare instrument ids | no (approved as leftovers) | unchanged | **B — a maintenance session** |
| V2C-35 | S10 found 3 | Some approved outputs read stiffly ("The verification date 21 Oct 2026: …"); "this environment" in source notes tells a reader nothing | no | unchanged | **B — a maintenance session**, each text to the author |
| V2C-36 | S10 found 4 | The dead `.tool-top` / `.bib-top` block in `css/tools.css` keeps its fade and layout rules; `js/shell.js` still queries those headers | no (code) | unchanged | **B — a maintenance session** |
| V2C-37 | S10 found 5 | The spine's thin bar narrows the rail by 10px when it shows | no | not re-measured | **B — post-v2 D** (the redesign) |
| V2C-38 | S10 "not verified"; S8–S9 | Firefox, Safari/WebKit, touch devices, screen readers, Windows forced colours and pixels never checked for the v2 work | no | — | **C** — a session on a machine with those browsers and a screen reader. README limitation 7 already declares Chromium-only and no screen reader |
| V2C-39 | S4 B.3, S5 B.2; roadmap of the author §3 item 6 | The `::1` test ("ORIGIN · B.2 · bound to ::1 …") has never run: this container has no IPv6 loopback. A skip is not a pass | no (Control Room) | skipped again in this session's run | **C** — run `node --test .control-room/selftest.mjs` on a runner with IPv6 loopback (a GitHub-hosted runner or a local machine) |
| V2C-40 | readiness, this session | `production_dispatcher_wired` blocks: no production dispatcher exists | no | readiness | **B — Phase 4** (an activation decision, protocol §24) |
| V2C-41 | readiness, this session | `decision_ledger_present` blocks: `agent/implement/decisions/decisions.jsonl` is ABSENT; no agent proposal has ever been decided. (The author's §8 decisions are a different record) | no | readiness | **B — Phase 4** (a person's first decision through the Control Room or `cli.mjs decide`) |
| V2C-42 | readiness, this session | `deploy_gate_exists` is unmeasurable from the tree. **Measured outside the tree today**: GitHub Actions shows the legacy "pages build and deployment" workflow's last run on 24 Oct 2026 (for #14), and `pages.yml` deploying every push to `main` since, the latest for #34 (`17768c1`), success | no | `actions_list` on the repository | **C** — the readiness check reads only the tree; the Actions history is the "deployment record" its BOUND asks for. The repository setting itself remains the author's to confirm |
| V2C-43 | adversarial gate, standing | 3 partial (PP-08 high; HE-04, OB-05 medium) and 1 undecidable (PP-09: the deployed site was not fetched) | no (control plane) | `node agent/policy/verify/cli.mjs` | **B — Phase 4** (the Control Room and its deployment), PP-09 **C** (needs network to the live site) |
| V2C-44 | `docs/DEPLOYMENT.md` §3, `AGENTS.md` Known hazards | "Done by the author on 24 Oct 2026; to be confirmed on the next push" still reads as unconfirmed, though about twenty pushes to `main` followed and V2C-42's record exists | no | `docs/DEPLOYMENT.md` line 119 | **B — this session, on the author's answer to question 7**, or a later documentation pass |
| V2C-45 | 11.0 question 7 | The documents that state the v2's status are stale: `docs/ROADMAP-v2.md` header "Nothing in it is implemented"; `docs/V2-DATA-DESIGN.md` "Status: PROPOSED"; the `AGENTS.md` row on the roadmap; the "Last updated" of `docs/HANDOVER.md` | no | the headers as they read today | **B — this session, only with the text the author approves** (question 7) |
| V2C-66 | S12 (12.0 question 6) | The flip of `scope-decision-missing` and `status-basis-missing` from BACKLOG to ERROR, set by `docs/V2-DATA-DESIGN.md` §4.3 for "the end of item 2.6", did not happen: item 2.6 closed with both backlogs open, and this inventory did not list it | no (a check's strictness) | `evidence-audit --as-of 2026-10-28`: BACKLOG 11 and 23; flipping them would be 34 ERRORs | **B — Phase 3**, decided by the author on 28 Oct 2026 (§8, v2 Session 12, question 6): re-dated to after the verification work; each list flips when its records have been read against primary sources |
| V2C-67 | S12 (reconnaissance) | `index.html` Part IX, `part-9.p8`, and its it/fr/es overlays say "the Council has yet to agree a mandate on the Commission's own GDPR reforms"; the `data-omnibus` record (COM(2025) 837, which amends the GDPR) records the Council's negotiating mandate agreed by Coreper on 21 Oct 2026 (ST 14756/26). The audit of 28 Oct 2026 corrected Part VIII, not this sentence; test P1's patterns do not match it | **yes** | the sentence as it reads on `bca554e`, in all four languages | **A**, decided by the author on 28 Oct 2026 (§8, v2 Session 12): logged here and fixed in the next session, its rewording put to the author word by word |

### 2.2 Closed or superseded (class E), each with its proof

| ID | Origin | What it was | Closed by |
|---|---|---|---|
| V2C-46 | S10 found 2 | Un-numbered "(audit, …)" references in notes | the 10.2 rule (§8, 28 Oct 2026): they name no code, so the rule leaves them. Proposed **E**; the author may reopen it as editorial |
| V2C-47 | S10 found 6 | No hover state on a scrollbar | §8 item 10.1, "Not styled: a hover state (`scrollbar-color` has none)" |
| V2C-48 | AUDIT §5 row 25 | `AGENTS.md`'s stale publication model | `1d0d897` (the text no longer appears) |
| V2C-49 | AUDIT §5 row 26 | The checks modelling Jekyll publication | `1d0d897` (§8 Part B (c)) |
| V2C-50 | AUDIT §5, proposed limitation | The ninth README limitation | `c886fdb`, accepted as written |
| V2C-51 | S4 B | PP-09's stale text | `bd2c318` (its outcome stays undecidable: V2C-43) |
| V2C-52 | S4 B.3 | The OIDC redirect URI and the unbracketed `::1` origin | `dd3c1fe` (the test that binds `::1` is V2C-39) |
| V2C-53 | S3 | The port-0 Origin defect | `dc3a030` |
| V2C-54 | S4 A found 2 | Internal references in MiCA's, P2B's and the DGA's scope texts | `76fa900` |
| V2C-55 | S5 A found 1; S6 found 1; S7 found 3; S8 found 3 (g) | Internal identifiers shown to a reader (`eidas2.status_note`, the `defers-to`/`enables` notes) | `90c7f92` (item 10.2; W18) |
| V2C-56 | S6 found 2; S8 found 1 | The sanction ceiling worded two ways | `4558712` (W16) |
| V2C-57 | S6 found 3 | `obligation_on_institution` not displayed | `4558712` |
| V2C-58 | S7 found 1; S8 found 2 | Tranche dates without their qualifier | `4558712` |
| V2C-59 | S7 found 4 | The DGA's notice showing no relationships | `4558712`, `1d8a305` |
| V2C-60 | S8 found 4 | The status badge touching "as of" | `4558712`; today the gap is 8px (GDPR page, Chromium) |
| V2C-61 | S7 | The EHDS's common name not in `KNOWN_AS` | `bb2176e` |
| V2C-62 | S7 found 2 | Regulation (EU) No 910/2014 not modelled | `98c9ade` |
| V2C-63 | S5 B found 1; roadmap of the author §3 item 1 | `rel-dsa-gdpr-transparency-minimisation` against EDPB Guidelines 3/2025 v2 | `19f63c1` |
| V2C-64 | roadmap of the author §3 item 2 | "stalled in Council" in `rel-data-omnibus-gdpr` | `19f63c1` |
| V2C-65 | S5 B found 2; roadmap of the author §3 item 4 | The article attribution in `src-ec-apple-meta-dma-2025`'s note | `19f63c1` |

### 2.3 Counts

| Proposed class | Count | IDs |
|---|---|---|
| **A** | 1 | V2C-01 |
| **B** | 39 | V2C-02–V2C-21 (Phase 3: 20, of which V2C-06 and V2C-08 also meet the A criterion); V2C-24–V2C-27 (evidence, data depth, translation: 4); V2C-28–V2C-36 (maintenance: 9); V2C-37 (post-v2 D); V2C-40, V2C-41, V2C-43 (Phase 4: 3); V2C-44, V2C-45 (status documents: 2) |
| **C** | 5 | V2C-22, V2C-23, V2C-38, V2C-39, V2C-42 (and PP-09 within V2C-43) |
| **D** | 0 | — |
| **E** | 20 | V2C-46–V2C-65 |

*28 Oct 2026, v2 Session 12:* two rows added with the class the author decided — **V2C-66** (B, Phase 3) and **V2C-67** (A). The counts above are v2 Session 11's and are left as they were; with the two rows they are A 2, B 40, C 5, D 0, E 20.

**No class D is proposed.** The open findings that a reader would need to know are either already
declared (README limitations 5, 7 and 9 cover V2C-27, V2C-38, V2C-39 in substance) or assigned to a
phase that corrects them. Proposing a README line for a finding that a named phase will fix would
turn a backlog item into a permanent disclaimer.

**Findings that touch what the site says about law, and are not in A:** V2C-02, V2C-06–V2C-10,
V2C-12, V2C-14, V2C-21 (Phase 3); V2C-22, V2C-23 (C); V2C-24, V2C-25, V2C-26, V2C-27 (evidence and
translation). None is proposed for D.

---

## 3 · The questions for the author (11.0)

Asked one at a time after this document is written, each with the recommendation first; every
answer is recorded in `docs/ROADMAP-v2.md` §8 in the author's words, and nothing unapproved is
written.

1. **The perimeter of the v2.** Close on Phases 0–2 and Session 10, with Phases 3–5 planned as the
   next chapter and their entry conditions unchanged; or keep the v2 open and open Phase 3 next; or
   another delimitation. The brief's sequence ("Fase 0 → … → Fase 5") is a binding decision: a
   closure on Phases 0–2 reads that sequence as continuing after the v2's label, and the question
   says so in the brief's words.
2. **The classification of the findings**, by group.
3. **The class A finding** (V2C-01), and whether V2C-06 and V2C-08 stay in Phase 3.
4. **Class D**: none proposed; the author may move any finding there and word it.
5. **D-4 and D-5**: open and tied to Phase 4, or decided now.
6. **Post-v2**: whether and when it opens. Opening it does not start it.
7. **The status documents** (V2C-45, V2C-44): whether and how to update them after the decision,
   with the exact before and after (§3.1).

### 3.1 Question 7: the exact before and after, drafted on the answers to questions 1–6

Drafts only. Nothing below is written into those files unless the author approves it.

**S1 — `docs/ROADMAP-v2.md`, the status paragraph (lines 3–6).**

Before:
> **Status: APPROVED by the author on 25 Oct 2026 (§8)**, with item 2.0 brought forward to v2 Session 2. Written in v2 Session 1, 25 Oct 2026, on `claude/roadmap-v2-2026-10-25`, cut from `main` at `5f3859e`. Nothing in it is implemented, and nothing in it may be implemented until the author approves it. The approval is recorded in §8, by the author's word, and nowhere else.

After:
> **Status: APPROVED by the author on 25 Oct 2026 (§8)**, with item 2.0 brought forward to v2 Session 2. Written in v2 Session 1, 25 Oct 2026, on `claude/roadmap-v2-2026-10-25`, cut from `main` at `5f3859e`. **As of 28 Oct 2026: Phases 0, 1 and 2 are executed, each closed at a checkpoint in §8; Phases 3, 4 and 5 are not started. The v2 is open, and Phase 3 is next** (§8, v2 Session 11; the measured comparison is `docs/V2-CLOSURE.md`). Nothing is implemented without the author's approval, recorded in §8, by the author's word, and nowhere else.

**S2 — `AGENTS.md`, the reading table's row for the roadmap (line 55), and one new row after it.**

Before:
> | `docs/ROADMAP-v2.md` | v2 Session 1: the v2.0 plan — phases 0–5, ten decisions for the author, exit criteria a session can fail. **Approved on 25 Oct 2026** (§8), with item 2.0 brought forward |

After:
> | `docs/ROADMAP-v2.md` | v2 Session 1: the v2.0 plan — phases 0–5, ten decisions for the author, exit criteria a session can fail. **Approved on 25 Oct 2026** (§8), with item 2.0 brought forward. **Phases 0–2 executed; 3–5 not started; the v2 open, with Phase 3 next** (§8, 28 Oct 2026) |
> | `docs/V2-CLOSURE.md` | v2 Session 11: the v2 measured against the brief and the roadmap, and every open finding with the class the author decided. **The v2 is not closed** |

**S3 — `docs/V2-DATA-DESIGN.md`, the status line (line 3).**

Before:
> **Status: PROPOSED.** Written in v2 Session 2, 25–27 Oct 2026, …

After:
> **Status: APPROVED (`docs/ROADMAP-v2.md` §8: D-3, D-6, D-7, D-8 and the trigger model, 25–27 Oct 2026), implemented in part** — item 2.1, below; the map audit (§4), the status labels (§3) and the triggers (§2) are Phase 3's and are not implemented. Written in v2 Session 2, 25–27 Oct 2026, …

**S4 — `docs/HANDOVER.md`, "Last updated".** Rewritten by this session's report in any case, as every
session's is; it will say the v2 is open with Phase 3 next.

**Not drafted here: V2C-44** (the deploy gate "to be confirmed" in `AGENTS.md` lines 451 and 556 and
`docs/DEPLOYMENT.md` §3 item 1). Correcting it touches the readiness check's own statement of what
settles `deploy_gate_exists`, so it is proposed for a later documentation pass rather than folded
into this one.

---

## 4 · What this document does not establish

- **That any legal fact is true.** No source was re-read in this session and no fact was written.
  The rows about facts (V2C-22, V2C-23, V2C-24) say what is due, not what is now true.
- **That a phase is complete because its tests pass.** The tests hold what the items built; they do
  not show that Phase 3's entry condition, which no test asserts, is met — it is measured above and
  it is not.
- **Anything about browsers other than Chromium**, real devices, or screen readers (V2C-38).
- **The repository's Pages setting.** V2C-42 reads the Actions history, which records what ran, not
  the setting.
- **That the inventory is exhaustive.** It is every finding the named records hold, re-checked, and
  the few this comparison added (V2C-13, V2C-14, V2C-15, V2C-24, V2C-25, V2C-40–V2C-45). A finding
  nobody recorded is not here.
