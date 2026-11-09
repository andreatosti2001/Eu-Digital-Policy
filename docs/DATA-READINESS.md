# DATA READINESS — Post-v2 block A (PV2-01)

**Status:** A.2 written, awaiting the author's approval in `docs/ROADMAP-v2.md` §8. A.3 (the metric card) and A.4 (the
metric contract) are not yet written.
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

*A.3 (the card "fines announced, collected and unknown") and A.4 (the proposed metric contract) follow the approval of
this section. A.5 is the prompt of PV2-02.*
