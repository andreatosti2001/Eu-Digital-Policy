# PHASE 3 AUDIT — what Phase 3 produced, measured on 3 November 2026

**Status: MEASURED; NOTHING IN IT IS DECIDED.** Written in v2 Session 17.5, 3 Nov 2026, on
`claude/nifty-ride-kc0p4x`, cut from `main` at `4ab13a6`, on the author's scope (`docs/ROADMAP-v2.md` §8, "The
scope of v2 Session 17.5"). The name of this file is the prompt's proposal; the author may change it.

**This document does not declare Phase 3 closed, concluded or complete, and does not declare Phase 4 open.** A met
entry condition does not close the phase it opens (the lesson of v2 Session 11). Phase 3's state is the author's
decision, asked in 17.5.0 question 1, and until a row in §8 records it no document here may say otherwise.

**How it was measured.** Every "today" cell is a command or a test **re-run in this session** on `4ab13a6` plus the
§8 scope row (`5678935`, which changes no published file), and none was copied from the report of the session that
closed the item. The reference date for every date-dependent check is **2026-11-03** unless a row names another.
The full outputs are kept with the session's report (`docs/HANDOVER.md`, v2 Session 17.5).

**Vocabulary.** *Status* takes one of five values: **executed**, **not executed**, **open**, **closed** (with the
commit), **superseded** (with what superseded it). *Law?* is `docs/V2-CLOSURE.md` §2's column: **yes** when the
finding touches what the site tells a reader about EU law, **no** when it touches only the presentation, a tool or
the environment.

**Before anything else: `main` moved while the prompt was in review.** The prompt's question 0 was a red gate on
`main` (`d65e713`: three stale editions, two `og:site_name`). Re-measured at the start of this session it is gone:
`fa4beda` (#49, merged by the author on 3 Nov 2026) removed the hand-added tag and regenerated the it, fr and es
editions, and `node tools/seo-audit.mjs` reports `ERRORS 0 WARNINGS 0`. Two facts remain, both reported and
neither this session's to change:
- `node tools/commit-evidence.mjs 9cc7aa5 HEAD` still reports `✗ d65e713 changes 1 published file(s) (index.html)
  and carries no "Evidence:" trailer`. A merged commit cannot be given one without rewriting `main`.
- **The deploy gate held.** GitHub Actions, `pages.yml` on `main`: run 55 (`d65e713`, 2 Nov 2026) **failure**;
  run 56 (`39630cd`, #50) **failure**; run 57 (`e216414`, #49) and run 58 (`4ab13a6`, #48) **success**. So the
  double tag was never deployed by the gated path. `1c94363` (#50) also changed a check —
  `agent/browser`'s `search:brief-prose` now skips the date-dependent compliance dial — outside the sessions.

---

## 1 · The entry condition, re-measured criterion by criterion

`docs/ROADMAP-v2.md` §4, Phase 3: "the triggers meet the claims' standard", with three criteria written so that
they can fail. §4 records "Met on 29 Oct 2026 (v2 Session 17)".

| # | Criterion (§4, verbatim) | Measured today | Command | Status |
|---|---|---|---|---|
| 1 | every rule's source reference carries `supports` and a locator | **120 of 120** references (rule `sources` and exemption `basis`) are objects with `supports` and a `locator`; 0 bare ids | a `node -e` over `data/applicability.json` (kept in the session's outputs); `tools/trigger-audit.mjs` T-01, T-02, T-04 | **executed** |
| 2 | every condition resolves to a provision ID | **59 of 59** non-threshold dimensions used by the 33 rules name provisions in `condition_provisions`; **90 of 90** ids resolve to one of the 113 provisions. The 3 rules with `thresholds` (`ap-dsa-02`, `ap-dma-02`, `ap-ai-act-03`, 4 keys) resolve each key through `threshold_basis` instead, as decided in v2 Session 15 (§8, "T-03 and thresholds") | the same `node -e`; T-03, T-05 | **executed**, read as §8 decided it for thresholds |
| 3 | `tools/evidence-audit.mjs` reads `applicability.json` and reports its rules the way it reports claims | `node tools/evidence-audit.mjs --as-of 2026-11-03`: `TRIGGERS 33 rules · applies 13 · likely 9 · possible 10 · unlikely 1`, `publishable 33 of 33`, **no** `BACKLOG rule-` line, `ERRORS 0`, exit 0 | as stated | **executed** |

**The flip holds.** In a copy of the tree (`git archive HEAD`, extracted to a scratch directory), `ap-dora-01`'s
first source reference was replaced by its bare id `src-eurlex-dora`. `node tools/evidence-audit.mjs --as-of
2026-11-03` then exits **1** with `ERRORS 2`: `✗ T-01 applicability/ap-dora-01: a bare source id` and `✗ T-02
applicability/ap-dora-01: no for:scope, supports:direct reference to a tier-1 text with a structural locator`,
and `publishable 32 of 33`. No list exists through which the rule could return to a backlog.

**What the criteria do not establish.** That each rule reads its Articles correctly is not a property any of the
three can measure: it rests on the reading done in Sessions 13–17 and on the author's approval of each table, and
this session does not re-read a rule against an Article (the prompt forbids it). The audit's `publishable` means
"no T-01…T-05 finding", nothing more (`tools/trigger-audit.mjs`'s header).

---

## 2 · The 33 rules, session by session

The §8 rows are named by title, because a row number moves when a row is added.

| Session | Rules | §8 rows that decided (from scope to checkpoint) | Commits | Assertions re-run today (`node --test tools/selftest.mjs`) | Status |
|---|---|---|---|---|---|
| 12 | none: V2C-01 (the derived modality) and the check, T-01…T-11 | "The scope of v2 Session 12" … "The checkpoint of v2 Session 12" (8 answer rows) | `580621c`, `f0c88d7`, `9894cf9`, `b7bb914` | X1 ok 114, X2 ok 115, X3 ok 116, X4 ok 117 | **executed** |
| 13 | `ap-eidas2-01`, `ap-pld-01` (the pilot) + V2C-67 + `validate.mjs` on the v2 shape | "The scope of v2 Session 13" … checkpoint (10) | `ff5b066`, `296b7e3`, `a4ba2f3`, `92ffe80` | Y1 ok 118, Y2 ok 119 | **executed** |
| 14 | the GDPR's five (`ap-gdpr-01`…`-04`, `ap-cross-01`) | scope … checkpoint (7) | `14af4b7`, `7df6524` | Y3 ok 120 | **executed** |
| 15 | the DSA's five and the DMA's four | scope … checkpoint (19) | `c49e110`, `ef4a86b` (T-03 and thresholds), `7f346d3` | Y4 ok 121 | **executed** |
| 16 | the AI Act's seven | scope … checkpoint (18) | `cd85da8`, `414a374` | Y5 ok 122 | **executed** |
| 17 | the Data Act's four, NIS2's three, DORA's two, the CRA's one; the flip; T-12 and RULE_STALE | scope … checkpoint (23) | `bfb4b4e`, `3f88d73`, `42feb8f` | Y6 ok 123, F10 ok 23; X1–X3 above | **executed** |

`tools/selftest.mjs`: **123 tests, 123 pass, 0 fail, 0 skipped**, exit 0 — the figure Session 17 reported.
Every rule carries `last_verified` **2026-10-29** (33 of 33): all were read on one day.

---

## 3 · What was assigned to Phase 3 and is still open

**The count.** The prompt says `docs/V2-CLOSURE.md` gives Phase 3 *twenty* rows of class B. Counted today it is
**twenty-one**: V2C-02…V2C-21 (twenty, classed in Session 11) and **V2C-66** (added by v2 Session 12, question 6).
Of the twenty-one, **six are closed** and **fifteen are open**. V2C-01 (class A, the first item of Phase 3) is closed
by `580621c` and is not counted among them.

### 3.1 Closed (re-checked today)

| ID | Closed by | Today |
|---|---|---|
| V2C-02 | `bfb4b4e`, `3f88d73` | §1 above |
| V2C-06 | `cd85da8` | `ap-ai-act-03` holds `cumulative_training_flop_gt` with its `threshold_basis` "Art. 51(2) ('greater than 10^25')" |
| V2C-07 | `14af4b7` | Y3 passes |
| V2C-08, V2C-09 | `c49e110` | Y4 passes |
| V2C-10 | `cd85da8`, `bfb4b4e` | T-10 is an ERROR for every rule; `ERRORS 0` |

### 3.2 Open

*What would close it* is a description, not a plan. *Reader* answers whether the open row changes what a reader is
told today.

| ID | Group | What, in one line | Law? | Measured today | What would close it | Reader |
|---|---|---|---|---|---|---|
| V2C-03 | arrays and edges | `data-omnibus.proposes_to_amend` lists `eprivacy` and `nis2` with no relationship | data only | the array reads `["gdpr","eprivacy","data-act","dga","nis2"]`; edges from `data-omnibus`: `gdpr` amends, `p2b` repeals, `dga` repeals, `data-act` amends | the array derived from the edges, or removed (one home), with any edge it implies read in COM(2025) 837 | no (raw JSON in the explorer) |
| V2C-04 | arrays and edges | the array lists `dga`, which COM(2025) 837 would repeal | data only | `dga` still in the array; `rel-data-omnibus-dga-repeals` exists | as V2C-03 | no |
| V2C-05 | arrays and edges | the array omits `cer`, which COM(2025) 837 amends (Art. 9) | data only | `cer` absent from the array and from the edges | as V2C-03, the edge read in Art. 9 | no |
| V2C-11 | watchlist | R-01 cannot fire for P2B: its trigger is a milestone of `data-omnibus` | no | `tools/register-audit.mjs` R-01 reads only the watched record's own `milestones`; `p2b.scope_decision.watch_for.event_type` is `event:adoption` | R-01 reading the milestones of the act the watch names | no |
| V2C-12 | the map | 8 relationships still carry bare source ids (v1); the `edge-v1-sources` flip is deferred | **yes** | **8**: `rel-ai-act-gdpr-impact-assessments`, `rel-dsa-dma-scope`, `rel-data-omnibus-gdpr`, `rel-nis2-cer`, `rel-cra-nis2`, `rel-data-act-cloud-ai-act`, `rel-tfeu-114-acquis`, `rel-ai-act-teu-4-2`; 0 carry `requires_verification`; W12 passes | each edge read against its source and migrated, then the flip | **yes**: the interaction boxes on the instrument pages |
| V2C-13 | the map | the brief's "map subject to `evidence-audit.mjs`" is not implemented | no (a missing check) | `tools/evidence-audit.mjs` has no rule over relationships; `tools/register-audit.mjs` only the M-04 sector-instance test; M-08…M-16 not written | the map checks (`docs/V2-DATA-DESIGN.md` §4), then their flip | no today; it is what would hold V2C-12 |
| V2C-14 | labels and transitions | the six status labels (D-3) are not on the site | **yes** | 0 `label:` terms in `data/taxonomy.json`; no renderer | the derived grouping of §5 implemented, with what it loses shown | **yes**: how a status reads |
| V2C-15 | `stratum` | what `stratum` meant is to be derived (D-8); nothing derives it | no | the word occurs in no dataset | a derivation from the rules' actors and the edge kinds, approved | no |
| V2C-16 | the map | the four `enables` candidates into the DNA (from `eidas`, `nis2`, `gdpr`, `iea`) are not added; the design read an `enables` edge's modality from its `from` node | no today | **the premise has moved**: since `580621c` `js/map-model.js` `HOLDER['rel-kind:enables']` is `'to'`, so an `enables` edge into a proposal would derive `proposed`. The edges are still not added; 6 `enables` edges exist, none into a proposal | the author deciding whether the derivation half is superseded, and whether the four edges are read and added | no |
| V2C-17 | the map | the five acts the DNA would repeal or amend are not nodes | partly (named only in the title) | none is an instrument (39 instruments); DNA edges: `eprivacy` amends, `gdpr` and `nis2` defers-to | nodes for them, or a recorded decision not to | partly |
| V2C-18 | the map | `nis2 → eidas` (NIS2 amends Regulation (EU) No 910/2014) not modelled | no false statement | no edge from `nis2` to `eidas` or `eidas2` | the NIS2 Article read, the edge added | no |
| V2C-19 | the map | the Political Advertising Regulation's two `defers-to` edges (AVMSD, P2B) not added (§8: "No, non ora") | no | `ttpa`'s only edge is `rel-ttpa-dsa-defers` | the author's "not now" revisited | no |
| V2C-20 | labels and transitions | no event type for a procedural step | no (the status note carries them) | 16 `event_type` terms, none procedural; `procedural_stage` is the enforcement vocabulary | a term added (adding is permitted), with the events | no |
| V2C-21 | actors | `eidas2`'s regulated actors mix the wallet duties' addressees with trust service providers | **yes** ("who it binds") | `eidas2.dna.regulated_actor` = member-state, public-authority, large-company, vlop, trust-service-provider | the actors read against the Articles, as the rules' were | **yes** |
| V2C-66 | the flip of the register backlogs | `scope-decision-missing` and `status-basis-missing` not flipped to ERROR | no (a check's strictness) | `BACKLOG scope-decision-missing 11`, `status-basis-missing 23` (unchanged since 28 Oct) | each record's scope decision and status basis read against primary sources, then each list flips (§8, Session 12, question 6) | no |

**Grouped as the prompt's question 2 groups them:** the arrays and the edges (V2C-03, -04, -05); the map (V2C-12, -13,
-16, -17, -18, -19); the labels and transitions (V2C-14, -20); `stratum` (V2C-15); the actors (V2C-21); the watchlist
(V2C-11); the backlog flip (V2C-66). **What touches a reader:** V2C-12, V2C-14, V2C-21, and V2C-17 in part. None of the
fifteen meets class A's criterion as `docs/V2-CLOSURE.md` defines it (a published statement that differs from its
source); that judgement is a proposal.

---

## 4 · The findings of Sessions 12–17 still open

Each re-measured on today's data. *Law?* as above. **None is corrected here.**

| # | Origin | Finding | Law? | Today |
|---|---|---|---|---|
| F-01 | S15 (5), S16 (7), S17 (1) | **The D-2 notice on `applies.html` is false in its first paragraph** (§4.1 below) | **yes** | unchanged; `applies.notice` `pending_translation` in it, fr, es (V2C-27) |
| F-02 | S17 (2) | `ap-nis2-01`'s `depends_on`: "materially incomplete" against the press release's "While most complied" | **yes** | still in `depends_on` |
| F-03 | S17 (3) | `ap-cra-01`'s rationale: "serious incidents"; Art. 14(3): "severe incident" | **yes** | still "serious incident" |
| F-04 | S17 (4) | `ap-nis2-02`'s rationale: a sector "which NIS2 treats as essential"; Annex I is "sectors of high criticality" | **yes** | still |
| F-05 | S17 (5) | `ap-data-act-02` is `likely`, depending on whether the provider serves the Union, while its territory condition is already "Outside the EU, serving EU users" | **yes** | `outcome:likely`; `depends_on` and territory unchanged |
| F-06 | S17 (6) | taxonomy notes: `actor:essential-entity` "NIS2 Annex I.", `actor:important-entity` "NIS2 Annex II." — Art. 3 classes by size too | **yes** | unchanged |
| F-07 | S17 (7) | Art. 41(1) is a dated reference on `ap-nis2-01` only; `-02` and `-03` cite it in text | no (as approved) | unchanged |
| F-08 | S17 (8) | as of 31 Dec 2027 `data-act` and `cra` are "partly applicable" with no future application date | **yes**, on a future date | `--as-of 2027-12-31`: both ERRORs present (the status will need re-reading when the last tranche passes) |
| F-09 | S17 (9) | all 33 rules turn stale on one day | no | §5 below |
| F-10 | S17 (10) | `data/applicability.json` `$last_verified` still 2026-08-27; nothing reads it | no | unchanged; `freshness` says "file date 2026-08-27 not used" |
| F-11 | S14 (4), S15 (7), S16 (8), S17 (11) | `docs/v2-design/applicability-examples.json` holds the 25 Oct drafts | no (a design record) | unchanged |
| F-12 | S16 (1) | `ap-ai-act-01` fires for GPAI model providers (`actor:gpai-provider`, `activity:gpai-provision`), whom Arts 4 and 5 do not address as such | **yes** | conditions unchanged |
| F-13 | S16 (2) | Art. 111(3) (GPAI models placed before 2 Aug 2025: until 2 Aug 2027) held by no event; `ap-ai-act-02`'s rationale says "owes Article 53 since 2 August 2025" | **yes** | rationale unchanged; Art. 111(3) appears only in the rule's `verification_note` |
| F-14 | S16 (3) | `ap-ai-act-06`'s exemption ends with the brief's argument ("The brief argues …"); the same words on `rel-ai-act-teu-4-2` and `teu:art-4-2` | **yes** (an argument where an exemption is read) | still |
| F-15 | S16 (4) | `ai-act:art-50` heading "Transparency obligations"; the Official Journal prints a longer heading | no rule cites it; **yes** on the AI Act page | unchanged |
| F-16 | S16 (6) | "1 days ago" (`js/evidence-view.js:132`) | no | `days + ' days ago'` unchanged |
| F-17 | S16 (9) | `ap-gdpr-04`'s note says the AI Act's provisions "belong to Session 16" | no (a dated note) | still |
| F-18 | S15 (2) | DMA Art. 3(10) gives six months; `ap-dma-01`'s rationale, `clm-dma-ex-ante` and `part-4.p2` (and its it/fr/es overlays) say "immediately" | **yes** | `ap-dma-01` and `clm-dma-ex-ante` still say it; the brief's paragraph not re-read here |
| F-19 | S15 (3) | `ap-dsa-03`'s rationale: recommender-parameter transparency, which Art. 19 lifts for micro and small platforms | **yes** | rationale unchanged |
| F-20 | S15 (4) | `ap-dma-04`: cloud designation decisions "due in November 2026", a Commission target | **yes** | unchanged; and since 1 Nov 2026 `STATUS_PREDATES_MILESTONE instruments/dma` is a warning |
| F-21 | S15 (6) | definition Articles print "Applies from … — the instrument's general date" (the derivation's fallback) | no (a derivation's wording) | not re-measured in a browser |
| F-22 | S14 (1) | `ap-cross-01`: EDPB ¶88 and the advertisement repository | — | **superseded** by `c49e110`: `depends_on` names ¶88, and `src-eurlex-dsa` "Art. 27(1); Art. 39(1)" is cited |
| F-23 | S14 (2), (3) | actors' definitions resolve through GDPR Art. 4; `ap-gdpr-04` and the controller role | **yes** | unchanged |
| F-24 | S13 (1) | `ap-pld-01` fires for `activity:ai-deployment` through the actor dimension only (Art. 8(2)) | **yes** | activity list unchanged |
| F-25 | S13 (2) | `eidas2:art-2`/`-3` are Articles of Regulation (EU) No 910/2014 filed under `eidas2` | no today (the `number` field disambiguates) | unchanged |
| F-26 | S12 (3) | `evidence-audit.mjs`'s exit turns on `--as-of` (status contradictions as ERRORs on a past date) | no | `--as-of 2024-06-01`: `ERRORS 13`, exit 1 |
| F-27 | S12 (4) | a proposal's claim (`clm-omnibus-four-gdpr-reforms`) graded "Primary law" on the Data Omnibus card | **yes** (a grade) | its only source is still `src-eurlex-data-omnibus-837`, direct; the card not re-rendered here |
| F-28 | S12 (5) | the pre-adoption set has two homes | no | `js/regulatory-model.js:26` `PRE_ADOPTION` and `tools/register-audit.mjs:56` `PROCEDURAL_STATES` |
| F-29 | S12 (6) | M-11 and M-13 would fire on `rel-dsa-copyright-dsm-defers`; M-16 has no `basis` field | no | not implemented (V2C-13) |
| F-30 | S12 (7) | `js/interactions.js` header: "Seventeen edges are recorded" (there are 40) | no (a comment) | `js/interactions.js:18` unchanged |

**Grouped for question 4:** the rules' wording (F-02, F-03, F-04, F-12, F-13, F-14, F-17, F-19, F-20, F-23, F-24);
the rules' outcomes and conditions (F-05, F-12, F-24 — these are also Phase 5's material, §6); the vocabulary
(F-06, F-15, F-25); the brief and its claims (F-18, F-27); presentation and code (F-16, F-21, F-28, F-30); the
checks (F-26, F-29, F-10); design records (F-11); on a future date (F-08). F-01 is its own question (question 3).

### 4.1 The D-2 notice, word for word

`applies.html:82`, `data-i18n="applies.notice"`, today:

> **These rules are not yet verified to the standard the site's claims are.** Each rule cites its sources by
> identifier only: unlike a claim, it does not say what each source supports or where in it the rule is found, and
> the evidence audit that checks every claim does not yet check these rules. Read a result as a pointer to the law,
> not as a verified reading of it.

Measured against today: the first sentence is false by §4's own definition (§1 above); "by identifier only" is false
for 120 of 120 references; "does not yet check these rules" is false (`TRIGGERS … publishable 33 of 33`). The
string is printed only there (`grep` of `js/`, the pages and the editions); the it, fr and es editions show the
English, because the key is `pending_translation` in all three (V2C-27). The page already prints, per rule, each
reference's locator, its `supports` word where it is not direct, and the rule's last-verified date
(`js/applies.js:203`, `:235`).

**A proposal, not a decision** (the wording is the author's, D-2; writing it changes a published page, so not in
this session):

> **These rules are checked to the standard the site's claims are.** Each rule says, for every source it cites,
> what that source supports and where in it the rule is found; each condition names the provision that defines it;
> and the evidence audit that checks every claim checks these rules too. Each rule shows the date it was last read
> against its Articles, and a change in the law after that date reaches a rule only when a person reads it again.
> Read a result as a pointer to the law, not as a verified reading of it.

Why each clause: the first three state what §1 measures and nothing more; the fourth points at the date the page
already shows rather than typing one (a typed date would be a second home of 33 `last_verified` values, and would go
stale on 28 Jan 2027, §5); it also says what T-12 and RULE_STALE do not do. The last sentence is kept as it stands;
the author may judge that it now sits uneasily with the first, and the alternative "not as a reading of your own
case" is offered for that reason. Whatever text is approved goes to it, fr and es as `pending_translation` again.

---

## 5 · The two maintenance checks, on the calendar

Both derived from the records, with no network and no new field (§8, the plan row of 28 Oct 2026; 17.3).

| `--as-of` | `evidence-audit` exit · warnings · T-12 (`LAW_CHANGED_SINCE_VERIFIED`) | `freshness` exit · `RULE_STALE` |
|---|---|---|
| 2026-11-03 (today) | 0 · 12 · **0** | 0 · **0** |
| 2027-01-27 | 0 · 16 · 0 | 0 · 0 |
| 2027-01-28 | 0 · 16 · 0 | 0 · **33** |
| 2027-03-25 | 0 · 16 · 0 | 0 · 33 |
| 2027-03-26 | 0 · 18 · **1**: `ap-cra-01: cites cra, amended by ehds (rel-ehds-cra-amends), whose tl-ehds-2027-03-26-application (2027-03-26) is after last_verified 2026-10-29` | 0 · 33 |

Scanned on the first of each month to 1 Jan 2028 (and on 3 Dec 2026, the day after the AI Act's 2 Dec tranche):
**`ap-cra-01` is the only rule T-12 reports.** The four warnings that appear between today and 27 Jan 2027 are
`STATUS_PREDATES_MILESTONE` for `ai-act`, `data-act`, `pld` and `eidas2` (milestones passing their status date),
and `dma`'s grows a second milestone; none is a rule. A number that moves with the date is the calendar, not a
defect, and none of them is "fixed" by editing a check or a date.

**What their answer asks of a person.** Both checks say *where to look*; neither changes a rule. On 28 Jan 2027 a
person re-reads 33 rules against their Articles (they were read on one day, so they lapse on one day: F-09), and on
26 Mar 2027 a person reads the CRA as the EHDS amends it and decides whether `ap-cra-01` changes. Noticing that the
law changed, and deciding what a rule should then say, is a person's act until Phase 4 decides otherwise (the plan
row of 28 Oct 2026; D-4 and D-5 open). That is the first entry of the inventory in `docs/PHASE-4-SETUP.md` §1.

---

## 6 · Phase 5: what Phase 3 leaves as a base

`docs/ROADMAP-v2.md` §4: Phase 5's "scope is written only after Phase 3's checkpoint, against what Phase 3 measured".
**This session does not write it.** It measures only what is there to be built on:

- **33 rules**, one instrument each but `ap-cross-01`: GDPR 4 + 1 cross, DSA 5, DMA 4, AI Act 7, Data Act 4, NIS2 3,
  DORA 2, CRA 1, PLD 1, eIDAS 2 1. Outcomes: applies 13, likely 9, possible 10, unlikely 1.
- **The questionnaire's three dimensions** — actor, activity, territory — plus thresholds on 3 rules, which resolve
  through `threshold_basis` and are not asked of the reader as a dimension. Applicability in real cases "usually
  turns on the facts it does not ask for" (the page's own caveat): that is the gap an "advanced" phase would address.
- **The findings on conditions and outcomes**, which are the material such a scope would start from: F-05
  (`ap-data-act-02`'s `likely`), F-12 (`ap-ai-act-01` and GPAI model providers), F-23 (`ap-gdpr-04` and the controller
  role), F-24 (`ap-pld-01` and deployers), F-07 (national transposition dates for NIS2 not held).
- **The maintenance cadence**: 33 rules lapsing on 28 Jan 2027, one T-12 on 26 Mar 2027 (§5).

When Phase 5's scope is written is question 5 of 17.5.0.

---

## 7 · What this document does not establish

- **That any rule reads its Articles correctly.** No rule, claim or paragraph was re-read against a source here.
- **That the site a reader sees is the tree measured.** The deploy record above shows `pages.yml` succeeded on
  `4ab13a6`; the live site was not fetched.
- **That the proposed notice is right.** It is drafted against measured facts; whether it says enough, or too much,
  is the author's.
- **That Phase 3 is closed.** That is question 1.
