# DATA READINESS — Post-v2 block A (PV2-01)

**Status:** approved (§8, 9 Nov 2026: A.2, then the final checkpoint). **Extended the same day** (§8, "PV2-01, extended"):
three more cards, the contract amended and widened to MC-1…MC-15, in §8 below — awaiting the extension's checkpoint. A.3 (§5, the one metric card) and A.4 (§6, the proposed metric contract)
written on the author's decisions of §8. **The contract is proposed, not
implemented**: no check exists, and D (PV2-08) writes it.
**What this is:** the audit that `docs/POST-V2.md` §3 A asks for before any dashboard or infographic: an inventory of the
datasets, and (in later sections) one metric card and a proposed metric contract. **It is a gate, not a design.** Nothing
here is drawn, and no value is estimated or generated to fill a gap.
**Authority:** §8, "Post-v2 A may open before G1, under three limits" (9 Nov 2026) and "The scope of PV2-01" (9 Nov 2026).
No "G1" row exists in §8, so this work runs under the anticipation row and **B, C, S27 and Phase 5 stay closed**. It does
not decide, assume or announce G1.
**The author's choices (A.1):** §8, "PV2-01, A.1 question 1" (**enforcement outcomes only**) and "A.1 question 2" (**one
card: fines announced, collected and unknown**). Instruments by status, deadlines ahead, the evidence behind the claims,
actions by pipeline stage, by status axis and by instrument and authority were offered and **not chosen**. They are named
here so that their absence is a decision, not an omission.

**What this document is not.** Not a second home for any fact in `data/`: every count below is a measurement *of* the
datasets on a stated commit, kept to show what was measured, and it goes stale as soon as `data/` moves. Not a second home
for a derivation either: where `js/` already derives something, this document names the function and does not restate its
rule. Not a second home for the health register (`agent/health/model.mjs`, 44 metrics): where a dataset touches one of its
metrics, the metric is named and not redefined.

---

## 1. How it was measured

- **Tree:** `main` `06d5640` (after #83), measured on 9 Nov 2026 on the branch `claude/pensive-bell-665v9z` before any
  file outside `docs/` could differ from it. No file in `data/`, `js/`, `tools/`, `i18n/`, `agent/` or a page has changed
  on this branch.
- **Parsers:** three short scripts in the session's scratchpad, **outside the repository and not committed** (the scope
  row forbids a new tool). They read `data/*.json` and import, read-only, the repository's own derivations
  (`js/pipeline.js`, `js/format.js`, `js/evidence-model.js`, `js/data.js` `index()`), so every derived figure below is
  the site's derivation, not a reimplementation. A fourth script ran the planted cases of §4 against a **copy** of the
  tree in the scratchpad; the working tree was never edited.
- **Cross-check:** the record counts agree with `node tools/validate.mjs`'s `RECORDS` line on the same tree
  (instruments 39, provisions 113, relationships 40, institutions 21, competences 55, sources 226, claims 182,
  enforcement 21, timeline 101, glossary 15, parts 13, rules 33, taxonomy terms 312), and the claim distributions agree
  with the prompt's table of 9 Nov 2026 (measured on `ba8ddcf`): no figure moved between the two commits.
- **Battery on this tree, 9 Nov 2026:** `validate` 0 errors, 5 warnings (the five `ATTESTATION_NOT_CHECKABLE` on
  `ap-eidas2-01` pinned in v2 Session 24), 45 unverified or requires-verification records; `i18n-audit` 0/0;
  `design-qa` 0/0; `evidence-audit --as-of 2026-11-09` 0 errors; `freshness --as-of 2026-11-09` exit 0, 0 defects, 4
  staleness prompts; `seo-audit` 0/0; `tools/selftest.mjs` 141 of 141; `commit-evidence 06d5640 HEAD` 0 without
  evidence.

**To reproduce by hand** (no script needed): `node -e "const j=require('./data/enforcement.json');console.log(j.enforcement.length)"`
and the same for each file and collection named in §2; for a derived figure, import the named function from `js/` the
way §1 says and pass it the loaded datasets.

## 2. The inventory, one dataset at a time

**Who writes `data/`, for every file.** A person, through a commit on the author's decision, which `tools/commit-evidence.mjs`
holds to an `Evidence:` trailer (`node agent/production/cli.mjs trace`, path `human_commit`). Two machine paths exist and
**neither has ever written a record**: Agent 9 through the release dispatcher, on a decided proposal
(`agent/implement/apply.mjs`; no proposal touching `data/` has been decided), and the limited-autonomy runner, over eight
bookkeeping fields of `data/sources.json` only (grant `gov-5c5d9d87d8ca4478`, expiring 9 Mar 2027; no autonomous change
has merged). Agents 1–8 *propose*; they write `agent/records/`, never `data/`. Below, "writers" names only what is
specific to a file.

**The five states the prompt asks about**, and the words used for them below:

| State | Meaning in this repository | Where it is ruled |
|---|---|---|
| `null` | the question has not been researched | `data/enforcement.json` `$note`; `docs/DATA-GOVERNANCE.md` §2 |
| `unknown` | researched, and not publicly determinable — a taxonomy term (`payment:unknown`, `remedy:unknown`, `appeal:unknown`, `transposition:unknown`, `finality:unknown`, `state:unknown`) or the string `"unknown"` (`behavioural_outcome`) | same; **never counted as zero, never summed** |
| absent | the key is not on the record. For an optional key (`premises`, `derivation`, `threshold_basis`, …) it means "does not apply to this record"; it is **not** a fourth value of a required field | `tools/validate.mjs`, `tools/source-contract.mjs` |
| not applicable | a taxonomy term asserting that the question does not arise (`payment:not-applicable`, `state:na`, `appeal:none`, `remedy:none`) — a *known* negative, not an unknown | `js/pipeline.js` `derive()` |
| unverified | the record says its own evidence is incomplete: `requires_verification: true`, or a claim whose only source is `src-brief-original` (`evidence:unverified`) | `tools/validate.mjs` (the 45), `js/evidence-model.js` `evidenceStatus()` |

### 2.1 `data/enforcement.json` — the dataset the chosen metric reads

| | |
|---|---|
| Records | **21**: 20 enforcement actions and 1 recorded inaction (`enf-hungary-commission-none`, `record_type: record-type:inaction`). `js/pipeline.js` `actionsOnly()` excludes the inaction from every count, total and funnel; that rule has one home |
| Fields | `id`, `entity`, `entity_type`, `instrument`, `legal_basis`, `authority`, `opened`, `decision_date`, `action`, `fine_eur`, `action_status`, `payment_status`, `remedy_status`, `behavioural_outcome`, `judicial`, `appeal`, `timeline_events`, `claims`, `sources`, `requires_verification`, `verification_note`, `last_verified` on all 21; `record_type` on 1 |
| Readers | `js/enforcement-page.js` (`enforcement.html`), `js/masthead.js` (the brief's masthead), `js/instrument-view.js` (each instrument page), `js/search.js`, `js/glossary-graph.js`, `js/bibliography.js`, `js/evidence-model.js` (risk class), `js/datasets-page.js`; `tools/validate.mjs`, `tools/evidence-audit.mjs`, `tools/freshness.mjs`; Agents 3, 4, 5 and the health monitor |
| Writers | the common path above. Agent 5's 11 `annotate` proposals of 6 Nov 2026 targeted this file and are outside the grant |
| `null` | `opened` 11 (not published by most authorities — `derive()` makes the investigation stage *unknown*); `decision_date` 1 (the inaction); `fine_eur` **8** (see the two meanings below); `action_status` 1 (the inaction, deliberately); `behavioural_outcome` **14** (nobody has looked); `judicial` 16 |
| `unknown` | `payment_status: payment:unknown` **10**; `remedy_status: remedy:unknown` 4; `behavioural_outcome: "unknown"` 2; `appeal.status: appeal:unknown` on 4 |
| not applicable | `payment_status: payment:not-applicable` 8 (no monetary penalty), `payment:not-payable` 3 (annulled or under appeal); `remedy_status: remedy:none` 4 |
| unverified | `requires_verification: true` on **4**: `enf-meta-dpc-2023-transfers`, `enf-openai-garante-2024`, `enf-apple-ec-2025` (all three carry a fine) and the inaction |
| Freshness | `last_verified` 2026-08-27 … 2026-10-23. `freshness --as-of 2026-11-09`: the set is **74 days old against a 45-day interval**; 5 of 19 provisional records not re-verified within 30 days; the newest action recorded is 80 days old |
| Derived at render time, never stored | the eight pipeline stages (`js/pipeline.js` `derive()`), the procedural posture and finality (`procedure()`), the contradictions (`contradictions()`, which `tools/evidence-audit.mjs` fails on), the aggregates with their unknowns (`aggregate()`), the risk class (`js/evidence-model.js` `riskClass()`) |
| Nearest health metrics | `knowledge.unresolved_claims` (**not_a_score**; it counts these 4 among the 45), `knowledge.verification_gaps` (**not_a_score**), `knowledge.stale_sources`, `knowledge.incomplete_entities`. **No metric of the register measures fines or enforcement outcomes**: the card of A.3 does not duplicate the register, and it touches it only where it reports the 4 unverified records, which it cites and does not optimise |

**`fine_eur` has two meanings of `null`, told apart only by another field.** On a record with `payment_status:
payment:not-applicable` (8 today: the 4 preliminary findings, the commitments, the General Court's designation judgment,
the annulled supervisory-fee decision, the inaction) `null` means *no monetary penalty*. On any other record it would mean
*an amount exists and is not recorded*, which `aggregate()` counts as `announcedUnknownAmount` — **0 today**. There is no
value for "the amount was researched and is not publicly determinable". A.4 has to say which of these a metric may
assume.

### 2.2 `data/claims.json`

| | |
|---|---|
| Records | **182**. Type: law 67 · fact 64 · interpretation 22 · critique 13 · attributed 11 · derived 5. Evidence status (`evidenceStatus()`): direct 139 · partial 21 · unverified 15 · derived 5 · disputed 1 · context-only 1. Grade (`evidenceGrade()`): primary 68 · official 46 · interpretation 35 · secondary 13 · attributed 10 · derived 5 · unresolved 5. Freshness as of 9 Nov 2026: fresh 151 · aging 21 · review-due 9 · stale 1 (risk low 35 · medium 128 · high 19) |
| Fields | on all: `id`, `type`, `statement`, `instruments`, `provisions`, `institutions`, `enforcement`, `sources` (each `{source_id, supports, locator}`), `legal_basis`, `brief_part`, `published`, `last_verified`, `verification_note`; optional: `attributed_to` 11, `premises` 7, `reference_gap` and `gap_note` 5, `derivation` 5, `requires_verification` 2, `ranking` 2, `contested` 1 |
| Readers | nearly every page module (`js/main.js`, `instrument-view.js`, `enforcement-page.js`, `bibliography.js`, `applies.js`, `search.js`, `interactions.js`, `datasets-page.js`); `tools/evidence-audit.mjs` (prose coverage, derivations, rankings); Agents 2, 4, 7 |
| `null` | `published` 39; `last_verified` 1; `verification_note` 11 |
| unverified | 15 claims typed to owe verification rest only on `src-brief-original`; `tools/validate.mjs` reports 37 claims among its 45 |
| Derived | evidence status and grade (`js/evidence-model.js`, `js/format.js` — a `grade` field must never exist), grade tallies (`gradeTally()`), risk and freshness, the arithmetic of the 5 `derived` claims (`checkDerivation()`) |
| Nearest health metrics | `knowledge.evidence_coverage`, `knowledge.unresolved_claims` (**not_a_score**), `knowledge.provenance_gaps` (**not_a_score**), `knowledge.unsupported_factual_statements` |
| Bearing on the chosen metric | the prose's statement about announced and collected fines is `clm-announced-vs-collected`, typed **interpretation** and resting on `src-brief-original` alone; the per-action amounts are facts in claims such as `clm-x-fine`, `clm-temu-fine`, `clm-google-dma-fine-2026` — but not every fined record has one (§3, F-A3) |

### 2.3 `data/instruments.json`

| | |
|---|---|
| Records | **39 instruments** (regulation 20 · directive 10 · proposal 6 · treaty provision 3; scope core 16 · referenced 12 · out-of-scope 6 · adjacent 5; `legislative_status` in-force 15 · applicable 10 · partly-applicable 3 · proposal 3 · political-agreement 2 · transposition-overdue 2 · amended, repealed, withdrawn, transposition-pending 1 each), **113 provisions**, **40 relationships** (defers-to 11 · amends 7 · enables 6 · complement 5 · overlap 3 · repeals 3 · conflict 2 · lex-specialis, legal-basis, carve-out 1 each) |
| Fields | instruments carry **no dates** (`milestones` → timeline) and **no supervisor** (an edge in `institutions.json`); `status_as_of` on all; `status_note` 35; `scope_decision` and `status_basis` 16; `proposes_to_amend` 2 |
| Readers | every page; `tools/_footer.mjs` generates `instruments/<id>/` from it; `tools/seo-audit.mjs` |
| `null` | `celex` 7; `brief_part` 24; `transposition` 36 (regulations, where it does not arise); `dna` 22; `legal_basis` 10 (and 10 empty) |
| unverified | relationships carry `requires_verification` on 31, true on none today |
| Derived | key dates (milestones → timeline), when a provision applies (`js/regulatory-model.js`), competent authority (`js/dna.js` `authoritiesFor()`); a scalar status that contradicts the milestones is an error |
| Nearest health metrics | `knowledge.incomplete_entities`, `knowledge.missing_relationships`, `knowledge.contradictory_records` |
| Bearing on the chosen metric | the pipeline's first stage ("law") reads this file's milestones; the card groups no fine by instrument (not chosen) |

### 2.4 `data/timeline.json`

| | |
|---|---|
| Records | **101 events** (application 30 · entry into force 24 · adoption 11 · publication 11 · compliance deadline 7 · proposal 6 · transposition 3 · designation, enforcement 2 each · guidance, delegated act, review, judicial, market investigation 1 each); `date_precision` day 97 · month 4 |
| Readers | `js/main.js`, `masthead.js` ("what falls due next"), `instrument-page.js`, `instruments-page.js`, `applies.js`, `enforcement-page.js`, `evidence-model.js`, `search.js`; `tools/freshness.mjs` |
| `null` | `obligation` 51; `required_action` 80; `supersedes` 99; `verification_note` 11. A month-precision date is stored as the first of the month (`$note`): **a month-only event is not a day-1 event** |
| Derived | everything "applicable since/from" on any page; the event risk class (scheduled within 60 days is critical) |
| Nearest health metrics | `knowledge.stale_sources` (via `freshness.mjs`'s overdue scheduled events: one today, the DMA designation target of 1 Nov 2026) |
| Bearing on the chosen metric | `timeline_events` is empty on 20 of the 21 enforcement records, so a fine's date comes from `decision_date`, not from this file |

### 2.5 `data/sources.json`

| | |
|---|---|
| Records | **226** (tier 2 109 · tier 4 58 · tier 1 52 · tier 3 7; `url_status` live 221 · paywalled 3 · none 2; press release 48 · regulation 36 · commentary 32 · legislative document 22 · journalism 21 · report 16 · guidance 14 · court record 12 · judgment 9 · court press release 5 · regulator statement 4 · research 4 · opinion 2 · decision 1) |
| Fields | the contract of `tools/source-contract.mjs` (12 required, 2 optional); six grant-allowlisted fields are `ABSENT_BY_DESIGN` |
| Writers | the only file in the governance grant (eight bookkeeping fields) |
| `null` | `publisher` 80; `published` 31; `note` 9; `url` 2 (each with a `resolution`) |
| unverified | no per-record `last_verified` exists on this file (by design); "url:live" means seen, **not fetched** — no URL here has ever been fetched (AUDIT F-12) |
| Nearest health metrics | `knowledge.stale_sources`, `knowledge.incomplete_entities` |
| Bearing on the chosen metric | an enforcement record's `sources` are **bare IDs**, with no `supports` qualifier and no locator, unlike a claim's (§3, F-A3) |

### 2.6 `data/institutions.json`

| | |
|---|---|
| Records | **21 institutions**, **55 competence edges** (`validate.mjs`); wildcard IDs (`dpa-*`, `nca-*`, `dsc-*`) denote classes of national bodies and carry no referential guarantee (AUDIT F-11) |
| Readers | `js/main.js`, `institutions-page.js`, `instrument-page.js`, `instruments-page.js`, `enforcement-page.js`, `applies.js`, `dna.js` via the index, `search.js`, `glossary-graph.js` |
| `null` | `member_state` 16 (EU-level bodies); `parent` 11 |
| Derived | competent authority per instrument (`authoritiesFor()`) |
| Nearest health metrics | `knowledge.incomplete_entities`, `knowledge.verification_gaps` |
| Bearing on the chosen metric | an enforcement record's `authority` resolves here; the card does not group by authority (not chosen) |

### 2.7 `data/applicability.json`

| | |
|---|---|
| Records | **33 rules** (stored outcome applies 13 · possible 10 · likely 9 · unlikely 1), all `last_verified` 2026-11-04; `attestation` on 25; `threshold_basis` 3; `requires_verification` key on 4 |
| Readers | `js/applies.js` (`applies.html`), `instrument-view.js`, `bibliography.js`, `json-graph.js`; `tools/attestation-audit.mjs`, `tools/trigger-audit.mjs` |
| Writers | closures on the author's word under `docs/RULE-MAINTENANCE.md` and the attestation form; Track M re-reads all 33 before 3 Feb 2027 |
| Meaning of absence | **no rule that fires is not "no obligation"**: `evaluate()` returns *Not determined*; `outcome:undetermined` may never be stored |
| Bearing on the chosen metric | none |

### 2.8 `data/glossary.json`, `data/brief.json`, `data/taxonomy.json`

| File | Records | What matters for a metric |
|---|---|---|
| `glossary.json` | **15 terms** (`enforcement` empty on 10) | none for the chosen card |
| `brief.json` | **13 parts**, **20** `reading_graph` edges; `dek` null on 2 | part titles and deks are **the one known second home** of the brief's text (`docs/DATA-GOVERNANCE.md` §5). **Measured:** `js/datasets-page.js` loads it through `js/json-graph.js` `DATASETS`, so DATA-GOVERNANCE §5's "no module fetches it" is no longer true (F-A6) |
| `taxonomy.json` | **35 vocabularies, 312 terms** | the enum authority. It holds every `unknown` and `not-applicable` term listed in the table of §2; **a metric's states must be taxonomy terms or the derived `state:` terms, never new strings** |

## 3. What the inventory found (recorded, not fixed)

None of these is repaired here: each is in `js/`, `tools/` or `data/`, which this session may not touch. Each is a fact a
metric contract has to answer, and is carried into A.4.

- **F-A1 · The announced-fines sum has three implementations.** `js/pipeline.js` `aggregate()` (used by
  `enforcement.html`), `js/masthead.js` `enforcementLine()` (the brief's masthead) and `js/instrument-view.js`
  `enforcementSection()` (each instrument page) each compute the sum and the count of unknown payments themselves.
  `docs/DATA-GOVERNANCE.md` §1.2: *a derivation may not be duplicated into a second implementation*. **Today they
  agree** — measured: €9,015,990,000 across 13 of 20 actions, payment unknown on 10 — **but their rules for "payment
  unknown" differ**: `aggregate()` counts any value outside its known list, the masthead `!p || p === 'payment:unknown'`,
  the instrument page `endsWith('unknown')`. Planted case P1 below makes them disagree.
- **F-A2 · "Announced" includes the annulled and the appealed.** Of the €9,015,990,000: **€761,000,000 on 2 annulled
  decisions** (`enf-amazon-cnpd-2021`, annulled and remitted; `enf-openai-garante-2024`, annulled); **€6,614,990,000 on 8
  decisions under appeal**; **€1,640,000,000 on 3 imposed decisions whose finality is unknown** (`procedure()`), and
  **€0 on a decision recorded final**. The word is literally true and the prose says so ("fines announced, not fines
  upheld or collected"), but the masthead shows no split. Not a defect of a record: an **unstated inclusion criterion**.
- **F-A3 · The amount is not always a sourced fact.** An enforcement record's `sources` are bare IDs, with no `supports`
  and no locator, so which source states `fine_eur` is not recorded on the record. Measured by searching the statement
  of each linked claim that is not an argument for the amount (written in millions, in billions or in full): **9 of the
  13** fined records link a claim that states it; **4 do not**, carrying €2,430,000,000 between them —
  `enf-meta-dpc-2023-transfers` (€1.2bn) and `enf-tiktok-dpc-2025-transfers` (€530M), whose only linked claim is the
  derived `clm-dpc-share-of-fines`; `enf-apple-ec-2025` (€500M), whose linked claims are two interpretations; and
  `enf-meta-ec-2025` (€200M), whose linked fact claim does not state the amount. **The evidence level of each input
  value is therefore not derivable from the record alone.** The search is a string match and can miss an amount written
  another way; it was not checked claim by claim.
- **F-A4 · The set is behind the calendar.** 74 days old against its 45-day interval; under `riskClass()`, of the 13
  fined records 2 are **stale** (the two DPC transfers decisions) and 7 **review-due** as of 9 Nov 2026. Any figure
  drawn from it is a figure *as of the records' verification dates*, not as of today.
- **F-A5 · A non-number passes both data checks.** `fine_eur: "unknown"` — the natural slip in a repository whose
  vocabulary says "unknown" everywhere — passes `validate.mjs` and `evidence-audit.mjs` on **9 of the 13** fined records
  (P2), and all three sums turn into string concatenation. It is caught on 4 only because the prose prints or ranks that
  amount. A negative amount passes the same way (P5).
- **F-A6 · A statement in DATA-GOVERNANCE §5 has drifted:** `brief.json` *is* fetched, by `datasets.html`. A `docs/`
  correction, which needs its own §8 row; not made here.

## 4. Planted cases, run (not only described)

Each case was planted in a **copy** of the tree in the scratchpad (`data/`, `js/`, `tools/`, `docs/`, `i18n/`,
`index.html`), and the two data checks and the three sums were run on it. P0 is the control.

| Case | What was planted | `validate.mjs` | `evidence-audit.mjs` | `aggregate()` · masthead · instrument page |
|---|---|---|---|---|
| P0 | nothing | 0 errors | 0 errors | 9,015,990,000 / unknown 10 · same · same |
| P1 | `payment_status: null` on `enf-temu-ec-2026` (fined, imposed) | **passes** | **passes** | unknown **10** · **10** · **9** — the three implementations disagree |
| P2 | `fine_eur: "unknown"` on `enf-temu-ec-2026` | **passes** | fails, but only on the prose row that prints "EUR 200 million"; on 9 of the 13 fined records **passes** | all three return the string `"3725990000unknown550000000…"` |
| P3 | `fine_eur: 1000000` on the inaction | fails (`a recorded inaction … carries fine_eur`) | fails (contradiction) | 9,015,990,000 — `actionsOnly()` excludes it |
| P4 | `payment:paid` on the annulled `enf-openai-garante-2024` | **passes** | fails (`annulled, yet recorded as paid`) | `aggregate()` paid **€15,000,000** |
| P5 | `fine_eur: -200000000` on `enf-temu-ec-2026` | **passes** | fails only on the same prose row | all three subtract 400 million |

What the cases show for A.4: the existing checks guard the **record's internal consistency** (P3, P4) well, and the
**shape of a value that enters a sum** (P2, P5) not at all; and a metric computed in three places can disagree with
itself without any check noticing (P1).

---

## 5. A.3 — the card: fines announced, collected and unknown

The one metric the author chose (§8, "A.1 question 2"), written with the three decisions of §8 "A.3 questions 1–3". **It is
a definition, not a display**: nothing below says how the figure looks, where it sits or what it is drawn with — that is
C and D. The figures in §5.2 are a measurement of the definition on one commit, kept to show that it computes, and they
go stale with `data/`.

### 5.1 The card

| Property (`docs/POST-V2.md` §3 A) | The card |
|---|---|
| **Question** | Of the enforcement actions this site records, how much money has been announced in fines, what has become of those decisions, and how much is shown to have been collected? |
| **Operational definition** | Three figures, never shown apart: **announced** — the sum of `fine_eur` over the inputs; **its partition by posture** — the same inputs split by what became of the decision; **collected** — the sum of `fine_eur` over inputs whose payment is demonstrated, or *not determinable* (§5.1, the meaning of the states) |
| **Records and fields** | `data/enforcement.json`, taken through `js/pipeline.js` `actionsOnly()` (which excludes the recorded inaction, one home). Fields: `fine_eur`, `action_status`, `appeal.status`, `judicial`, `payment_status`, `requires_verification`, `last_verified`, `claims`, `sources`. **Link to the source:** each input's `sources` (tier 1–4, `data/sources.json`) and the claim that states its amount, where one exists (F-A3) |
| **Formula, denominator, unit** | announced = Σ `fine_eur` over the inputs; each part = Σ over its inputs, and **the parts add back to the total in euros and in records** (§8, A.3 q. 1); collected = Σ over inputs whose payment state is *known*, only if no input's state is *unknown* or *not researched*. Unit: EUR, integer, as recorded. **No denominator**: the card is a sum, not a share. "13 of 20 actions carry a fine" is a count shown beside it, not a rate of anything |
| **Partition** | by the posture `js/pipeline.js` `procedure()` derives, in this order, each input in exactly one part: **annulled** (`action:annulled`, remitted or not) · **under appeal** (`procedure:appeal`) · **final** (`finality:final`) · **standing, finality not established** (every other input). An empty part is shown as empty (0 records, €0) — a count of records in a known state, not an unknown read as zero, because unknown finality is its own part |
| **Period and "as of"** | no period: every recorded action, whatever its date. **As of** the inputs' own `last_verified` — the oldest and the newest — never the reader's or the build's date (§8, A.3 q. 3) |
| **Inclusion / exclusion** | *Included:* every action record with `fine_eur` not null, including annulled and appealed decisions (§8, A.3 q. 1) and unverified records (§8, A.3 q. 2). *Excluded:* the recorded inaction (`actionsOnly()`); records with `fine_eur` null — today all 7 carry `payment:not-applicable`, i.e. no monetary penalty (§2.1); were one ever to carry `null` without it, `aggregate()`'s `announcedUnknownAmount` counts it and the card states it beside the figure |
| **Zero** | €0 *announced* or in a part means *no input in that part*, a count over known states. **Collected is never €0 by default**: it is a number only when every input's payment state is known |
| **`null`** | on `fine_eur`: no monetary penalty, when `payment:not-applicable` licenses it, otherwise an amount not recorded (§2.1). On `payment_status` (none today): **not researched** — counted beside, like unknown, never as unpaid (the masthead's rule; the instrument page's differs, F-A1) |
| **`unknown`** | `payment:unknown` (10 inputs today): collected becomes *not determinable*, and the count is shown. `finality:unknown`: the "standing, finality not established" part |
| **Not applicable** | `payment:not-payable` (3 inputs today: the 2 annulled decisions and `enf-tiktok-dpc-2025-transfers`) — nothing is payable, so these inputs neither count as collected nor as unknown; they are counted as not payable. `payment:not-applicable` cannot occur on an input: `contradictions()` makes a fine with that state an error unless the decision is annulled |
| **Unverified** | included, and **counted beside with their names and their amount** (§8, A.3 q. 2): inputs with `requires_verification: true`, and inputs whose linked claims state no amount (F-A3) |
| **Coverage** | **a selection, not a census**: 20 actions chosen by the brief's argument, not every fine any EU or national authority has imposed. GDPR fines by national DPAs are represented by 6 records; the DLA Piper survey of January 2026 puts the reported GDPR aggregate at €7.1bn (`clm-gdpr-total-fines`), a figure from a different population that is **not comparable** with this sum |
| **Comparability** | not comparable over time (records are added and re-verified, never snapshotted), nor with trackers that count differently (the prose says so), nor across instruments without the partition (an appeal under the DMA and an appeal under the GDPR are different procedures) |
| **Updating** | moves only when a record moves. Today the set is 74 days old against its 45-day interval; under `riskClass()` 2 inputs are stale and 7 review-due; the card names them (§8, A.3 q. 3). Only verification work against primary sources clears the notice |
| **Evidence level and status** | per input, not per figure: the tier of each input's sources, `requires_verification`, and whether a claim states the amount. **The card has no grade of its own**: a grade belongs to a claim (`evidenceGrade()`), and inventing one for a sum would be a second derivation of the evidence model. If the prose ever states the total, it is a `derived` claim with a `derivation` block that `tools/evidence-audit.mjs` re-runs — which is what "a figure the site computes" already means here (`docs/EVIDENCE-MODEL.md` §4) |
| **Planted cases** | §6, K1–K13, each run on a copy of the tree; K2 is today's tree |
| **What the card cannot say** | that any money reached a treasury; what a court will decide on the 8 appeals or what the CNPD will decide on remittal; whether the 3 standing decisions will become final; anything about enforcement the site does not record; that a decision is right; that a larger sum means stronger enforcement |

### 5.2 What the definition yields on `06d5640` (a measurement, 9 Nov 2026)

| | |
|---|---|
| Announced | **€9,015,990,000** across 13 of 20 recorded actions |
| — annulled | €761,000,000 · 2 (`enf-amazon-cnpd-2021`, remitted; `enf-openai-garante-2024`) |
| — under appeal | €6,614,990,000 · 8 |
| — final | €0 · 0 |
| — standing, finality not established | €1,640,000,000 · 3 (`enf-temu-ec-2026`, `enf-aliexpress-ec-2026`, `enf-google-ec-2026-dma`) |
| Collected | **not determinable**: 0 inputs demonstrate payment; 10 cannot settle it (`payment:unknown`); 3 not payable |
| Resting on an unverified record or on no claim stating the amount | 5 inputs, €2,445,000,000: `enf-meta-dpc-2023-transfers`, `enf-openai-garante-2024`, `enf-apple-ec-2025` (unverified); `enf-meta-dpc-2023-transfers`, `enf-tiktok-dpc-2025-transfers`, `enf-apple-ec-2025`, `enf-meta-ec-2025` (no claim states the amount) |
| As of | 2026-09-27 … 2026-10-23 |
| Past their interval (as of 9 Nov 2026) | 9: stale `enf-meta-dpc-2023-transfers`, `enf-tiktok-dpc-2025-transfers`; review-due `enf-uber-ap-2026`, `enf-uber-ap-2024`, `enf-x-ec-2025`, `enf-apple-ec-2025`, `enf-meta-ec-2025`, `enf-google-ec-2025-adtech`, `enf-google-ec-2026-dma` |

**Consequence the author should see now:** the masthead and every instrument page already show "announced" **without its
partition**, which the decision of A.3 question 1 excludes, and each computes it itself (F-A1). Under the contract below
the card **cannot be shown on today's tree** (K2). That is not a reason to change `js/` here; it is the first thing D has
to do before any figure of this card is drawn (§7).

## 6. A.4 — the metric contract, proposed

**A proposal.** Nothing here is implemented, and no check exists. The home of a declaration, once D implements it, is a
module under `tools/`, enforced by `tools/validate.mjs`, on the precedent of `tools/source-contract.mjs` (§8, "A.4
question 1"); the module, its name and its wiring are D's (PV2-08). A declaration that fails any property is proposed
as an **ERROR**, and its figure is not rendered; *not determinable* is not an error, it is one of the figure's states.

**What the contract was tested against.** One card, on one dataset. The contract is written for any metric, but the three
families the author did not choose (instruments, deadlines, evidence) were not paper-tested, and a property that only one
family exercises may be missing. That is a stated limit, not a claim of generality. *Extended on 9 Nov 2026:* the three
other families were then given cards and paper-tested (§8 below); they found two properties the fines card could not show
(MC-14, MC-15), one rule too strict (MC-9, amended on the author's decision) and one that does not apply to a count (MC-4).
The rows below are the contract as amended.

**How it was tested.** A scratch prototype of the thirteen checks (two scripts in the session's scratchpad, sha256
prefixes `5d00ea7e139e4579` and `fbd49dba4f2102e9`, **not committed**), run on copies of the tree. K0 is the control: the
tree with the two second implementations of F-A1 neutralised *in the copy* — what D would do — and it passes all thirteen.
Each other case was planted in a fresh copy, and **each fails as intended, on the property it targets and on no other**.

| | Property | Exact rule a check applies | Planted case, run | What the check cannot see |
|---|---|---|---|---|
| MC-1 | **Question** | a non-empty question that names its population as "the records this site holds" (no metric may read as a census) | K1: "How much has the EU fined?" → ERROR | whether the question is worth asking |
| MC-2 | **One computing function** | the declaration names one exported function in `js/`; no other module under `js/` computes over the same value field (for a sum: no second `reduce` over it) | **K2: today's tree → ERROR**, `js/masthead.js` and `js/instrument-view.js` | a second implementation that does not name the field (a renamed variable, a generic sum helper) |
| MC-3 | **Inputs resolve** | the dataset, the collection, the filter that admits inputs (through the dataset's own exclusion function where one exists, e.g. `actionsOnly()`) and every field the declaration reads exist on every record | K3: `payment_status` deleted from one record → ERROR | whether the filter selects the right population |
| MC-4 | **Value type** | every value entering the formula has the declared type and domain (here: an integer ≥ 0, in EUR); any other value makes the figure *not determinable* and is an ERROR naming the record — **never coerced**. A `count` has no value field: the category each input is counted under is MC-5's | K4: `fine_eur: "unknown"` (which passes `validate.mjs` and `evidence-audit.mjs`, A.2 P2) → ERROR | a well-formed wrong number (200 typed as 2,000) |
| MC-5 | **Every state mapped** | the declaration maps every value each state field can take — every taxonomy term of its vocabulary, and `null` — to exactly one of *known · known negative · not applicable · unknown · not researched*; a value with no mapping is an ERROR, **never a silent default** | K5: `payment:partially-paid` → ERROR | whether a mapping is semantically right |
| MC-6 | **Unknown is never zero** | a figure that any input in state *unknown* or *not researched* could change is *not determinable*, and is returned with the count of those inputs; the computing function returns that state itself, not a 0 that a view must reinterpret | K6: collected rendered as €0 with 10 unknown → ERROR | a view that drops the count the function returned |
| MC-7 | **No escape by "not applicable"** | no property of the contract may be declared not applicable; a *state* may be not applicable only through a taxonomy term the declaration maps, and only where `contradictions()` (or the dataset's equivalent) admits it | K7: `partition: "not_applicable"` → ERROR | a term used wrongly *in a record* — that is the record's check (`contradictions()`), not the contract's |
| MC-8 | **The partition is total** | where a figure is partitioned, every input is in exactly one part, assigned by one ordered derivation; Σ parts = total in value and in records, exactly | K8: parts computed by independent filters, with an annulled decision also under appeal (a real combination: `enf-supervisory-fee-gc-2025`) → parts add to 14 records and €9,030,990,000 → ERROR | whether the parts are the meaningful ones |
| MC-9 | **"As of" from the inputs** | the figure carries the oldest and newest `last_verified` of its dated inputs; the computing function reads no clock; **undated inputs are counted and named beside the figure** (amended on the author's decision, §8 "evidence card question 2"); hiding one is an ERROR | K9 (as first written: `last_verified: null` → ERROR); I5, E3: an undated input hidden → ERROR; D3: a function that reads the clock → ERROR | whether a recorded date is truthful |
| MC-10 | **Inputs past their interval are named** | the notice lists exactly the inputs that `riskClass()` and `freshnessState()` put at review-due or stale as of an explicit, displayed date — never the reader's clock (F-15) | K10: a notice computed from the dataset's newest date only (the option the author did not choose) → ERROR, 9 inputs omitted | whether the intervals are right (`js/evidence-model.js` `RISK_TTL_DAYS` is their one home) |
| MC-11 | **Weak evidence counted beside** | the figure is never returned without the number, the names and the value of the inputs that rest on an unverified record (`requires_verification: true`) or that no non-argument claim states | K11: counted from `requires_verification` alone → ERROR, 2 inputs omitted | a claim that states the amount *wrongly* — the string match only finds that it states one (F-A3) |
| MC-12 | **What it cannot say** | a non-empty list of what the figure does not establish, carried with it | K12: an empty list → ERROR | whether the list is complete |
| MC-13 | **No composite score** | the formula is one of `sum`, `count`, `share`; a `share` is *not determinable* unless both numerator and denominator are; no weights, and no combination with another metric (BRIEF v2, "Non comprimere problemi eterogenei in un punteggio aggregato") | K13: a weighted score of fines and `knowledge.unresolved_claims` → ERROR; E1 | a composite assembled in a view from two compliant figures |
| MC-14 | **Precision against the window** *(found by the deadlines card)* | an input whose date is coarser than a day is never placed on a day: where a figure has a date window, an input whose period overlaps a window edge — including the as-of month itself — is named as "may fall either side", never counted as passed or as ahead | D4: the month-precision `tl-dma-2026-11-01-designation`, in the as-of month, not named → ERROR | a precision recorded wrongly in the record |
| MC-15 | **The dataset's caveats travel with the figure** *(found by the instruments card)* | for each field the metric reads, a caveat the dataset's `$note` states about that field is carried into the figure's `cannot_say`, tagged with the field | I4: `legislative_status`'s "deliberately NOT sufficient on its own" left out → ERROR; D5: `date_precision`'s first-of-the-month rule left out → ERROR | a caveat written somewhere other than the `$note`, or one the `$note` states without naming the field |

**Rules that are not checks, and bind any metric:**

- **The register is not rewritten.** A metric of this contract is a figure *about the law and its enforcement*, for a
  reader; the 44 metrics of `agent/health/` are about the *system*, for its operator. Where one counts records the other
  also counts (here, the 4 unverified enforcement records among `knowledge.unresolved_claims`' 45), the card cites the
  register's metric and does not redefine it.
- **No metric targets a `not_a_score` metric.** A card may show that inputs are unverified; it may never present their
  number as something to reduce, and nothing may be proposed that lowers it by clearing `requires_verification`, attaching
  a plausible source or stamping `last_verified` in bulk.
- **A computing function imports the site's derivations** (`procedure()`, `actionsOnly()`, `riskClass()`,
  `freshnessState()`, `evidenceGrade()`); it never re-implements one (`docs/DATA-GOVERNANCE.md` §1.2). MC-2 is that rule
  for the metric itself.
- **No value is generated to complete a figure.** A gap is a state the figure carries, never an interpolation.

## 7. What D inherits (named, not decided)

Each item needs its own row in §8 before anyone acts on it, and none is in this session's scope.

1. **F-A1 → MC-2.** One computing function for the fines figure; the masthead and the instrument page import it. Until
   then the card cannot be shown, and the masthead's unpartitioned figure is out of step with §8 A.3 q. 1.
2. **F-A5 → MC-4.** A type and domain check on `fine_eur` in `tools/validate.mjs` (a `tools/` change), independent of
   the metric contract.
3. **F-A3 → MC-11.** A way for an enforcement record to say which claim or source states its amount (a `data/` schema
   change, under `docs/DATA-GOVERNANCE.md` §4 and §7), or the string match stays the contract's limit.
4. **F-A4.** Verification work on the 9 inputs past their interval — the only thing that clears MC-10's notice.
5. **F-A6.** The correction of `docs/DATA-GOVERNANCE.md` §5's sentence about `brief.json`.
6. **F-A7 → MC-2.** One computing function for instruments by status; the masthead adopts the card's 21 core and adjacent
   instruments and its comment is corrected (§8, "instruments card question 2"). Until then that card cannot be shown either.
7. **F-A9 → MC-14.** `tools/freshness.mjs` reads a month-precision event's stored first day as its date; a `tools/` change.
8. **F-A10.** The masthead's "what falls due next" and its ticker read the reader's clock (F-15); the deadlines card may
   not, so D computes both from one stated date.
9. **Verification work** on the inputs each new card names as past their interval (§8.1–§8.3), and on the undated claim.

The three enforcement metrics not chosen (stage, status axes, instrument and authority) can be added later as cards under
the same contract; each would be its own decision, and its own paper test.

## 8. The extension: instruments, deadlines, evidence (9 Nov 2026)

On the author's request after the final checkpoint ("instruments, deadlines, evidence — can we do dat as well?"), recorded
in §8 as "PV2-01, extended". Same limits: `docs/` only, nothing estimated, generated or drawn, G1 not decided. Each card was
computed and its planted cases run with a second scratch prototype outside the repository (sha256 prefixes
`64937eb480d6f5cd` and `bf2d91c448fc7414`, **not committed**), against the contract as amended in §6. **All three controls
pass and all fourteen planted cases fail on the property they target.** On today's tree the deadlines and evidence cards
pass every property; the instruments card fails MC-2 (F-A7). The first version of the scan for MC-2 matched two modules
that name the field without counting by it (`js/applies.js`, `js/routes.js`) — two false positives — and was narrowed to
the counting forms before the results above; **a static scan can be wrong in both directions**, which is MC-2's stated
limit. One planted case (I3) first passed because the prototype's own partition loop did not iterate a multi-part
assignment; it was the prototype's bug, fixed, and I3 then failed as intended.

### 8.1 Instruments by legislative status

| Property | The card |
|---|---|
| **Question** | Of the core and adjacent instruments this site records, how many stand at each legislative status? |
| **Records and fields** | `data/instruments.json`, `scope_class` ∈ {core, adjacent} (§8, q. 1); `legislative_status`, `status_as_of`, `status_basis`, `milestones`, `last_verified`. Link to the source: `status_basis` (with `supports` and a locator) where present, otherwise the milestones' timeline events and their sources |
| **Formula, partition** | count; partition by `legislative_status`, each instrument in exactly one taxonomy term; parts add back to 21. No denominator, no share |
| **As of** | the range of the inputs' `status_as_of` (MC-9). The milestones decide what applies; the card reads the scalar and says so (MC-15) |
| **Inclusion / exclusion** | the 16 core and 5 adjacent instruments; the 12 referenced and 6 out-of-scope are **named as excluded**, not dropped (§8, q. 1). The masthead's population (core only) gives way in D (§8, q. 2) |
| **Zero, null, unknown, n/a** | a status with no instrument is an empty part, a count. `legislative_status` is required and taxonomy-checked, so no null or unknown occurs; a term outside the vocabulary is an ERROR (MC-5). Not applicable does not arise |
| **Unverified, counted beside** | an instrument whose status rests on neither a `status_basis` nor a milestone: **1**, `eprivacy` (in force) |
| **Updating** | under `riskClass('instrument')`, 3 inputs are review-due or stale as of 9 Nov 2026: `data-act`, `pld`, `cloud-ai-development-act` |
| **Cannot say** | what applies on a given date (the scalar is "deliberately NOT sufficient on its own" — the `$note`, carried by MC-15); which tranche of a partly applicable instrument applies; what a national transposition has done; anything about the 18 excluded instruments |
| **Measured on `06d5640`** | 21: applicable 6 (`gdpr`, `dsa`, `dma`, `dora`, `dga`, `iea`) · in force 6 (`ai-omnibus`, `gdpr-procedural`, `eprivacy`, `eidas2`, `csa`, `ehds`) · partly applicable 3 (`ai-act`, `data-act`, `cra`) · proposal 3 (`data-omnibus`, `digital-networks-act`, `cloud-ai-development-act`) · transposition overdue 2 (`nis2`, `cer`) · transposition pending 1 (`pld`); `status_as_of` 2026-08-27 … 2026-11-04 |
| **Planted** | I0 control passes; I1 today's tree → MC-2 (`js/masthead.js`); I2 a status that is no taxonomy term → MC-5; I3 partly applicable also counted as applicable → MC-8 (24 over 21); I4 the `$note`'s caveat left out → MC-15; I5 an undated input hidden → MC-9 |

### 8.2 Deadlines in the 12 months after a stated date

| Property | The card |
|---|---|
| **Question** | Of the dated events this site records, how many fall in the 12 months after a stated date, by event type? |
| **Records and fields** | `data/timeline.json`: `date`, `date_precision`, `event_type`, `status`, `instrument`, `last_verified`, `requires_verification`, `sources` |
| **Formula, partition** | count of events with stated date < `date` ≤ stated date + 365 days; partition: month-precision events in a part of their own, every other event by `event_type` (§8, q. 1); parts add back |
| **As of** | two dates, both displayed: the **stated date** that bounds the window (never the reader's clock, MC-9) and the range of the inputs' `last_verified` |
| **Inclusion / exclusion** | every event in the window, whatever its instrument's scope. An event past its date and still `scheduled` is named as "passed, outcome not recorded", never as met — **unless its precision puts it in the as-of month, when MC-14 names it "may fall either side"** |
| **Zero, null, unknown, n/a** | an event type with no event in the window is an empty part, a count of records, **not a statement that nothing falls due**: the timeline records the events the brief tracks, not every deadline in EU law |
| **Unverified, counted beside** | `requires_verification` on 0 inputs today |
| **Updating** | under `riskClass('event')` (critical within 60 days), 7 of the 12 are review-due or stale as of 9 Nov 2026 |
| **Cannot say** | the day of a month-precision event (the `$note`'s first-of-the-month rule, carried by MC-15); whether a passed event happened; whether an obligation applies to a particular reader (that is `applies.html`, and *no rule that fires is not "no obligation"*); deadlines the timeline does not record |
| **Measured on `06d5640`, stated date 9 Nov 2026** | window 2026-11-09 … 2027-11-09: **12** — application 6 · compliance deadline 2 · transposition 1 · month precision 3 (`tl-dma-2027-01-01-compliance-deadline`, `tl-dma-2027-05-01-market-investigation`, `tl-dma-2027-07-01-compliance-deadline`); inputs' `last_verified` 2026-09-26 … 2026-11-04; in the as-of month, may fall either side: `tl-dma-2026-11-01-designation` |
| **Planted** | D0 control passes; D1 month-precision events also counted under their type → MC-8 (15 over 12); D2 a passed `scheduled` event counted as met → MC-5; D3 a computing function that reads the clock → MC-9; D4 the as-of-month event not named → MC-14; D5 the `$note`'s caveat left out → MC-15 |

**A correction to an earlier measurement, not a rewrite of it.** §8's row "deadlines card question 1" counts
`tl-dma-2026-11-01-designation` as "past its date and still `scheduled`", and `tools/freshness.mjs --as-of 2026-11-09`
prints it as having "fell due after the last verification". Both read its stored day, 1 November. Its precision is the
month, and its own note dates it to "within 12 months of 18 November 2025": on 9 November 2026 it may still fall in the
future. Under MC-14 the card names it as "may fall either side"; the row stays as written and is read with this note
(F-A9).

### 8.3 Evidence: claims by grade, by claim family

| Property | The card |
|---|---|
| **Question** | Of the claims this site records, how many carry each evidence grade, with arguments kept apart from law and fact? |
| **Records and fields** | `data/claims.json` with `data/sources.json` (the tier of each direct source); the grade is `js/format.js` `evidenceGrade()`, its one home |
| **Computing function** | `gradeTally()` (MC-2): the card's grade counts must equal it, and they do; no other module tallies grades |
| **Formula, partition** | count; partition by family — law and fact · derived · attributed · argument — then by grade; parts add back to 182. An argument is always "interpretation" (`docs/DATA-GOVERNANCE.md` §3) and **is never shown on the same scale as law and fact** (§8, q. 1) |
| **As of** | range of the dated claims' `last_verified`; **1 undated claim counted and named beside**, `clm-ep-privacy-defender` (MC-9 as amended, §8 q. 2) |
| **Zero, null, unknown, n/a** | an empty grade is a count. "Unresolved" is a grade, not an unknown: no directly supporting external source has been located. A claim's `null` `last_verified` is MC-9's case above |
| **Unverified, counted beside** | met by the partition itself: the 5 unresolved claims are named (`clm-dpc-top-ten-fines`, `clm-alliance-risk-contested-share`, `clm-data-act-non-personal`, `clm-nis2-enforcement-despite-transposition`, `clm-hungary-no-infringement`); all 5 carry partial support only |
| **Updating** | 10 claims review-due or stale as of 9 Nov 2026 |
| **Touches the register** | `knowledge.evidence_coverage`, `knowledge.unresolved_claims` and `knowledge.provenance_gaps` (the last two **not_a_score**) count related things; the card cites them and redefines none (§8, q. 1 named why the coverage share was not offered) |
| **Cannot say** | whether a statement is true; that a source says what the claim says (`supports` is a stored qualifier); anything about an argument's strength |
| **Measured on `06d5640`** | law and fact 131: primary 68 · official 46 · secondary 13 · unresolved 4; derived 5: derived 5; attributed 11: attributed 10 · unresolved 1; argument 35: interpretation 35. `gradeTally()`: primary 68 · official 46 · interpretation 35 · secondary 13 · attributed 10 · derived 5 · unresolved 5 — equal; `last_verified` 2026-08-27 … 2026-11-04 |
| **Planted** | E0 control passes; E1 an "evidence strength index" → MC-13; E2 attributed claims also counted with law and fact → MC-8 (193 over 182); E3 the undated claim hidden → MC-9; E4 a second grade tally planted in a module → MC-2 |

### 8.4 Findings of the extension (recorded, not fixed)

- **F-A7 · The masthead counts instruments by status itself, over a different population.** `js/masthead.js`
  `statusLedger()` and `ticker()` count the 16 core instruments; the card counts 21 (§8, q. 2: the masthead follows in D).
- **F-A8 · README limitation 1 carries the grade counts of 27 September 2026** ("20 are graded *Unresolved*"; 5 today).
  It is the unguarded second home `docs/DATA-GOVERNANCE.md` §5 already lists, and the README itself says "the
  bibliography's live count is the one to trust". The README is not touched by any session; recorded only.
- **F-A9 · A month-precision event is read on its stored day** by `tools/freshness.mjs` and, in this session, by a §8 row
  (§8.2 above).
- **F-A10 · The masthead's deadline views read the reader's clock** (`new Date()` in `ticker()` and the due list), the
  known F-15; the deadlines card may not.

