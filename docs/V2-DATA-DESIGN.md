# V2 DATA DESIGN — schemas and technical structure

**Status: PROPOSED.** Written in v2 Session 2, 25–27 Oct 2026, on `claude/v2-session-2-schemas`, cut
from `main` at `933515a`. It is design only:
- no data, code, page, locale or validator was changed;
- `docs/CONTROL-ROOM.md` was not touched.

It is roadmap item 2.0, brought forward by the author's decision of 25 Oct 2026 (`docs/ROADMAP-v2.md` §8).
Phase 3 implements what is approved here.

**The files.** This document holds the reasons, the validation rules and the coherence matrix. The
schemas and the records live beside it, in `docs/v2-design/`:

| Deliverable | File |
|---|---|
| D1 — dependency map schema | `docs/v2-design/map.schema.json` |
| D1 — examples: every regime, every relation | `docs/v2-design/map-examples.json` |
| D2 — applicability trigger schema | `docs/v2-design/applicability-rule.schema.json` |
| D2 — examples: GDPR, DSA, AI Act | `docs/v2-design/applicability-examples.json` |
| D3 — status labels, transitions, verification | `docs/v2-design/status-labels.json` |
| D4 — `evidence-audit.mjs` extension plan | §4 below |
| D5 — methodological note | `docs/METHODOLOGY-NOTE-v2.md` |
| D6 — exclusion register and watchlist | `docs/v2-design/register-watchlist.proposed.json` |
| — inclusion criterion (D-7), coherence matrix, findings | §5, §6, §7 below |

---

## 0 · What governs this, and what was missing

**The brief arrived after the first draft.** The session prompt asks for `docs/BRIEF-v2.md`, which
exists on no branch (decision D-1 is open). The design was first written from the roadmap's paraphrase,
with every brief-dependent point listed as an assumption. On 27 Oct 2026 the author pasted the brief.
This document was then checked against it, and corrected where the brief, being binding, required it.
§0.1 lists what the check found.

The author also attached the Control Room audit of 24 Oct 2026. It is word for word the text already
recorded in `docs/AUDIT-2026-10-24.md` §1; only the layout differs. Nothing in it changes this design.

**Decided by the author on 25 Oct 2026**, in answer to four questions in this session (recorded in
`docs/ROADMAP-v2.md` §8):

| | Decision |
|---|---|
| Sequence | The roadmap is approved. Item 2.0 (design, documents only) is brought forward to v2 Session 2. Phase 0 moves to Session 3 and Phase 1 to Session 4. **Read conservatively:** items 2.1–2.6, which write data, still wait for the Phase 1 checkpoint. |
| D-3 | The six labels are a derived display grouping over the sixteen states. |
| D-6 | The map extends the 17 existing relationships. New edge kinds go in the taxonomy; the map is a derived view. |
| D2 model | The "trigger" is the existing applicability rule, raised to a v2 standard. It is not a new entity. |
| D-8 | `stratum` is dropped: option (c). What it tried to say is derived from data that already exists (§1.2). |

**Assumptions**, checked against the brief on 27 Oct 2026:
- **A-1 — corrected.** The draft read the seven regimes (ViDA, AVMSD, copyright, GPSR, EAA, P2B,
  political advertising) as all excluded. The brief says they go "nel registro delle esclusioni **o**
  nella watchlist": which list each one joins is left to the criterion. The seven names are confirmed.
- **A-2 — still an assumption.** "Copyright" means Directive (EU) 2019/790; the brief says only
  "copyright".
- **A-3 — confirmed, with one correction.** MiCA, PSD3/PSR and the DGA in transition are the brief's
  "inclusioni condizionate Fase 3 … solo se si apre esplicitamente il capitolo finanza". The draft let
  PSD3 and PSR reopen on their adoption, "whichever comes first"; the brief's "solo se" rules that out.
  All four now watch for the finance chapter alone.
- **A-4 — still an assumption.** "AVMSD" means Directive 2010/13/EU, as amended.
- **A-5 — confirmed.** The six labels are the brief's, word for word.
- **A-6 — not settled by the brief.** It names no relations; the prompt's five stand.

**Open questions for the author:**
- **Q-1** P2B: the criterion would include it. The brief allows register or watchlist; recommended:
  watchlist (§5).
- **Q-2** The inclusion criterion itself (D-7).
- **Q-3** Six states have no label, although the brief calls the labels "uniformi" (§0.1, and
  `status-labels.json` `x-unlabelled`).
- **Q-4** Whether `docs/BRIEF-v2.md` should be committed (D-1).
- **Q-5** The data corrections in §7, which are amber.
- **Q-6** The DGA is conditioned on the finance chapter, as the brief lists it. Is that intended (§0.1)?

### 0.1 · The design against the brief

| Brief | Design | Result |
|---|---|---|
| Principle 4: partiality is allowed if declared, and the map is how it is declared | Coverage classes, register and watchlist as derived lists (§1.3) | consistent |
| "A node or edge that cannot be verified is removed or downgraded. An unverified map is worse than no map" | Edges: derived `verification_state`; unverified edges never drawn as verified (§1.4). **Nodes were not covered by the draft.** | **corrected**: nodes now derive a `verification_state` too (§1.3), and the map view is **not published** while any edge is still v1 (§4.3) |
| The seven regimes go in the register **or** the watchlist, never as full pages | Six excluded, P2B excluded pending Q-1; M-05 forbids a page for either list | consistent; Q-1 reworded (A-1) |
| Phase 3 conditional inclusions: MiCA, PSD3/PSR, DGA in transition, "only if the finance chapter is explicitly opened" | Watchlist, `watch_for` the finance chapter | **corrected** for PSD3/PSR (A-3); DGA aligned, and flagged as Q-6 |
| The six uniform labels | `label:*`, with *in transizione* shown beside another label | wording consistent (A-5). Two readings need the author's confirmation (Q-3): six states stay unlabelled — NIS2 and CER among them — although the brief says "uniformi"; and *in transizione / possibile abrogazione* is a second label beside the first rather than a replacement |
| "Do not publish 'what applies to me' before the triggers meet the claims' rigour" | `publishable` derived; T-01…T-05 | consistent. `applies.html` is already published, which is D-2, still open |
| No aggregate score | Counts by code, coverage and state; never combined | consistent |
| No other dashboard before the P0/P1 fixes | The extensions are report sections of a CLI; the map is a view of the brief's data, not a monitoring dashboard | consistent; the map ships after Phase 1 in any case |
| Sequence: Phase 0 → 1 → 2 | Item 2.0 brought forward, documents only | **a departure from the brief**, proposed in this session and approved by the author on 25 Oct 2026 (ROADMAP-v2 §8), as the brief's own preamble requires |
| `stratum`: if it is to be dropped, the proposal is motivated and approved first | Motivated in §1.2; approved on 25 Oct 2026 | consistent |

**Q-6.** The brief puts the DGA's inclusion behind the finance chapter, with MiCA and PSD3/PSR. The DGA
is data governance, not finance, so the grouping may be a matter of phasing rather than of subject.
D6 follows the brief literally: its `watch_for` is the finance chapter. The proposed repeal by
COM(2025) 837 is still shown, as a derived transition, which needs no trigger. If the author meant the
condition for the three finance acts only, the DGA's trigger becomes the outcome of COM(2025) 837.
That is a one-field change.

**Evidence.** Every legal fact in these files was read on **25 Oct 2026** from a document retrieved that
day. EUR-Lex returns an empty page to this environment, so the channels were:
- the Official Journal texts, through the Publications Office's Cellar, by CELEX number;
- the Publications Office's metadata, through its SPARQL endpoint;
- the Commission proposals, through Cellar;
- the European Parliament's Legislative Observatory.

A web search was used **once**, to find the Digital Networks Act's number. The number was then read on
Cellar, and Cellar is what is cited. Facts that were not read are `null`, and their notes say so.

---

## 1 · D1 — the dependency map

### 1.1 The model

The map has **no file of its own**:
- Its nodes are instrument records (`data/instruments.json` `instruments[]`).
- Its edges are relationship records (`relationships[]`).
- Everything the view shows beyond those records is derived on every render, by one module shared by
  the page and `tools/evidence-audit.mjs`. This follows the pattern of `js/regulatory-model.js`.

Phase 3 names that module `js/map-model.js`.

Why: the 17 relationships already carry provisions, claims, sources and `last_verified`. A separate map
file would be a second home for every one of them (D-6).

Four things are new. Each is optional on a record that existed on 25 Oct 2026 and required on every
record added after it:
- **`scope_decision`** on an instrument: why it is covered, excluded or watched, measured against the
  inclusion criterion.
- **`status_basis`** on an instrument: the references, with locators, that establish its
  `legislative_status` on its `status_as_of` date.
- **Reference objects** in a relationship's `sources`: `{source_id, supports, locator}`, the shape claims
  already use. They replace bare IDs.
- **Two taxonomy terms**, `rel-kind:enables` and `rel-kind:defers-to`, and a `basis` property
  (`textual` | `analytical`) on every `relationship_kind` term. No existing ID is renamed.

The prompt's `verified_at` is the existing `last_verified`. A second date field would be a second home.

### 1.2 `stratum`: the decision and its replacement

**Dropped (c), on the author's decision of 25 Oct 2026.** The reasons:
- **It is a legal characterisation without a source.** Calling the GDPR a "system" regime and the CRA a
  "product" regime is a reading of a whole act. No provision states it, so it could only be stored as the
  site's assertion. Every enum field here is meant to be a fact or a typed argument; this would be
  neither.
- **Option (b) only renames the problem.** `regulatory_object: operators | infrastructure |
  public_governance | mixed` is still one label per act, and still unsourced. The acts that matter most
  (GDPR, Data Act, AI Act, DSA) would mostly come out `mixed`, which says nothing.
- **What a reader would learn from it is already in the data, at a finer grain.** The view shows two
  derived facts instead:
  - **Addressees**: the union of `conditions.actor` over the instrument's applicability rules (e.g. the
    AI Act addresses `actor:ai-provider`, `actor:ai-deployer`, `actor:gpai-provider`,
    `actor:public-authority` …). An instrument with no rule shows *addressees not recorded*, never
    *none*.
  - **Enables**: the instruments its `rel-kind:enables` edges reach. An act that others build on, such as
    NIS2 for the Cyber Solidarity Act, is infrastructure in the only sense the record can carry: other
    acts' texts say they rely on it.

**What changes in the roadmap:**
- D-8 is closed as "dropped, derived instead".
- Item 2.0's `stratum` bullet is done.
- `stratum` and `regulatory_object` join the list of fields that may never be stored (rule M-02). This
  makes it an error to bring the property back under either name.

**What is lost, stated:** the view no longer offers a one-word grouping of the map. A reader who wants
"the infrastructure layer" has to read it off the *enables* edges. That is slower, and true.

### 1.3 Nodes and coverage

**Coverage is derived** from the record and never stored. `coverage` is already in
`tools/evidence-audit.mjs` `DERIVED_FIELDS`, so storing it is an error today.

| Coverage | Rule | Today | Page (`js/routes.js` `hasEntityPage`) |
|---|---|---|---|
| `covered` | `scope:core` | the 11 core records (+5 by items 2.2–2.6) | **required** (M-05) |
| `excluded` | `scope_decision.disposition = excluded`, which requires `scope:out-of-scope` | none (+7 by item 2.1) | **forbidden** (M-05) |
| `watched` | `disposition = watched`, any scope except core | none (+3 new, +dga, by item 2.1) | **forbidden** (M-05) |
| `mapped` | anything else: adjacent or referenced, with no decision | 13 | allowed (`pld` has one) |

Whether a page exists is not coverage. It is the seven-criterion gate in `js/routes.js`, and M-05
checks the two against each other. The check matters because the gate's `context` criterion passes any
record with a relationship. The moment the D6 edges exist, an excluded regime with an objective, a date
and a claim **would earn a page** unless something stops it.

**Nodes are verified too.** The brief says a node that cannot be verified is removed or downgraded, so
each node derives a `verification_state`:
- **verified**: `status_basis` holds a direct reference with a structural locator, of the tier its state
  requires (M-07, S-03);
- **unverified** otherwise.

An unverified node is drawn as unverified: its status label is shown as *not verified*, never as a
label. Today all 24 records are unverified on this rule, because none has a `status_basis` yet; their
statuses are verified only in prose notes. Item 2.1 writes `status_basis` for the records the map
shows first.

The **exclusion register** and the **watchlist** are not files. They are the lists of records whose
decision says `excluded` or `watched`, derived by the view. Their schema is `scope_decision`
(`map.schema.json`). Their entries are in D6.

### 1.4 Edges and the relation vocabulary

The prompt names five relations. Three are existing kinds, two are new kinds, and one of the prompt's
relations is not stored at all:

| Prompt | Stored as | Basis | Locator lives in | Notes |
|---|---|---|---|---|
| *abilitante per* | `rel-kind:enables` **(new)** | textual | the **dependent** act's text | from = the enabler. Example: NIS2 → CSA (CSA Art. 2) |
| *complementare* | `rel-kind:complement` | analytical | either act | needs a claim to be drawn as verified |
| *rinvio esterno* | `rel-kind:defers-to` **(new)**, with **derived** `external` | textual | the **deferring** act's text | labelled "external referral" when the other end is not covered. Example: DSA → AVMSD (DSA Art. 2(4)(a)) |
| *sostituisce* | `rel-kind:repeals` | textual | the repealing act | a repeal by a proposal is `proposed` (derived modality) |
| *in transizione verso* | **not stored — derived** | — | the proposal's own edges | see below |

**Why "in transition" is derived.** "The DGA is in transition toward the Data Act" is a forecast about
a legislative outcome. Stored, it would need a forecast claim and someone to remember to delete it.
Derived, it is a function of records that already state facts. The Digital Omnibus proposal:
- would repeal the DGA (`rel-data-omnibus-dga-repeals`, COM(2025) 837 Art. 10(3)(a));
- would amend the Data Act (`rel-data-omnibus-data-act-amends`, Art. 1);
- and its status is `proposal`.

The day it is adopted, withdrawn or amended, the derivation changes on its own. The same rule shows P2B
as "proposed for repeal" with **no destination**, because no record names one (Art. 10(1)).

**Analytical and textual.** The `basis` property records what kind of evidence an edge needs:
- A **textual** edge (amends, repeals, defers-to, enables …) is stated by the law. A direct reference
  with a structural locator is enough.
- An **analytical** edge (overlap, complement, conflict, sequence) is the site's reading. It is drawn as
  verified only with a claim that carries the reading.

Today `rel-dsa-dma-scope`, `rel-nis2-cer` and `rel-cra-nis2` have no claim (measured 27 Oct 2026).

**Derived on every edge, never stored:**
- `verification_state` (verified / partial / unverified);
- `modality` (law / proposed, from the `from` node's status);
- `external`.

The rule for `verification_state` is in `map.schema.json` `x-derived`. **Measured consequence: all 17
existing edges are `unverified` today**, because their sources are bare IDs; four of them rest only on
the brief itself. The roadmap's rule decides how they are drawn: unverified or not at all, never as
verified. That is not a regression. It makes visible what the data already says: no edge has a locator.

**A second home found.** Edges also live in the `amends` / `repeals` / `amended_by` /
`proposes_to_amend` arrays on instrument records. They disagree with the relationships in four places
(§7 F-1). Recommended for Phase 3: derive the arrays from the relationships and delete them. Until then,
rule M-15 reports every disagreement.

### 1.5 Validation rules — the map

Severity: **ERROR** fails the run (exit 1), as today. **WARNING** is printed, and a new one is a
finding. **BACKLOG** is counted and named, like the remediation backlog. It never fails the run, and it
becomes ERROR at the checkpoint named in §4.3.

| Rule | What it checks | Severity | On 27 Oct 2026 |
|---|---|---|---|
| M-01 | every edge end and every referenced id resolves | ERROR — **already** `validate.mjs` (DANGLING); not duplicated | 0 |
| M-02 | no record stores a derived field: `DERIVED_FIELDS` gains `stratum`, `regulatory_object`, `status_label`, `transition_label`, `in_transition`, `verification_state`, `verified`, `modality`, `external`, `asks`, `publishable`, `certainty`; the scan extends to `relationships[]` and applicability `rules[]` | ERROR | 0 |
| M-03 | `scope_decision.disposition` agrees with `scope_class` (included ⇔ core; excluded ⇔ out-of-scope; watched ⇒ not core) | ERROR | 0 |
| M-04 | `scope_decision` present where required, and complete: `approved_on` not null in `data/`; every `criterion` term resolves; `watch_for` present iff watched; `sources` are objects with ≥1 direct structural reference; `last_verified` ≤ as-of | ERROR for out-of-scope, watched and core records added after 25 Oct 2026. BACKLOG for the 11 core records (frozen list in the check, like `PAGE_PUBLISHED`) | 11 backlog |
| M-05 | covered ⇒ has a page; excluded or watched ⇒ no page | ERROR | 0 |
| M-06 | excluded and watched records have a non-empty `refer_to`, and each id is a source with a non-null `url`: the external referral must lead somewhere | ERROR | 0 |
| M-07 | `status_basis` present, with ≥1 direct reference carrying a structural locator, of the tier its state requires (S-03) | ERROR for records added after 25 Oct 2026; BACKLOG for the 24 existing | 24 backlog |
| M-08 | edge references: objects resolve, `supports` is valid, and a direct reference to a tier-1 legal text has a structural locator (the claims rule); bare IDs are the v1 form | ERROR for objects; BACKLOG for bare IDs | 17 backlog |
| M-09 | every edge has a non-empty `summary` and a `last_verified` ≤ as-of | ERROR | 0 |
| M-10 | an analytical edge has ≥1 claim | BACKLOG (the edge is `partial`) | 3 |
| M-11 | a textual edge has ≥1 direct structural reference | ERROR for `enables` and `defers-to` (no legacy); BACKLOG for the others | covered by M-08 |
| M-12 | an edge from a withdrawn proposal | WARNING: a dead edge, drawn as such | 0 |
| M-13 | `enables`: a direct reference whose source is among the **to** node's sources; `defers-to`: among the **from** node's | ERROR | 0 (no such edge yet) |
| M-14 | `symmetric: true` only on analytical kinds | ERROR | 0 |
| M-15 | instrument arrays (`amends`, `repeals`, `amended_by`, `proposes_to_amend`) agree with the relationships | BACKLOG, until the arrays are derived | 4 entries + F-2 |
| M-16 | every `relationship_kind` term carries `basis` | ERROR (in `validate.mjs`, with the taxonomy) | n/a until added |

---

## 2 · D2 — applicability triggers

**Model.** A trigger is an applicability rule. The schema (`applicability-rule.schema.json`) keeps the
matcher's input (`conditions`, `outcome`) byte-for-byte, so `js/applies.js` does not change. It adds
evidence about each rule:
- `sources` as reference objects, each saying what it is `for` (scope, obligation, date, rationale);
- `condition_provisions`: for each questionnaire dimension the rule uses, the provision that defines it.
  This is the roadmap's "every condition resolves to a provision ID";
- `exemptions` as objects with an `effect` (excludes / narrows / reinstates) and a `basis`;
- `threshold_basis`: one basis per threshold key, whose suffix must be the text's comparator;
- `verification_note`.

How the prompt's properties map:

| Prompt | Field |
|---|---|
| question | derived `asks`: the dimensions of `conditions`. The wording keeps its one home in `applies.html` |
| rule | `conditions` + `outcome` + `rationale` |
| degree of certainty | `outcome`, plus `depends_on` |
| exceptions / thresholds | `exemptions`, `conditions.thresholds` + `threshold_basis` |
| reference with locator | `sources`, `condition_provisions` |
| `verified_at` | `last_verified` |

**"A trigger without a source cannot be published"** becomes the derived property `publishable`
(T-01…T-05). It is never stored: a rule becomes publishable by being read. What the page does with an
unpublishable rule, whether it hides it or marks it, is decision **D-2**. That decision is still the
author's and is not taken here. **Measured: none of the 33 rules is publishable today.** All carry v1
bare IDs, which is the gap the roadmap already measured.

**Dates.** A rule's `dates` are a hand-kept second home of the provision→event link: 11 of 33 rules omit
an application event of one of their own obligations (§7 F-8). In v2 a rule's application dates are
**derived** from its obligations through `js/regulatory-model.js`. The stored `dates` keep only events
that cannot be derived, such as guidance and delegated acts.

| Rule | What it checks | Severity | On 27 Oct 2026 |
|---|---|---|---|
| T-01 | `sources` are reference objects | BACKLOG for bare IDs | 33 |
| T-02 | ≥1 `for: scope` reference, `supports:direct`, to a tier-1 legal text, with a structural locator | ERROR on a rule with any object reference; BACKLOG otherwise | 33 backlog |
| T-03 | `condition_provisions` covers every dimension `conditions` uses; each id is a provision of the rule's instrument, or of an instrument an edge connects to it | ERROR on v2 rules | n/a |
| T-04 | each exemption is an object with a structural basis | ERROR on objects; BACKLOG for strings | 13 rules backlog |
| T-05 | each threshold key has a `threshold_basis`; its suffix is `_gt`/`_gte`/`_lt`/`_lte` | suffix ERROR now; basis BACKLOG | suffix 0; 3 backlog |
| T-06 | `outcome:likely` or `outcome:possible` ⇒ `depends_on` non-empty | ERROR | 0 |
| T-07 | `last_verified` present, ISO, ≤ as-of | ERROR | 0 |
| T-08 | an instrument whose label is proposal, political agreement or withdrawn, or whose state is repealed, adopted or published, has no rule with `applies` or `likely`. A proposal binds nobody | ERROR | 0 |
| T-09 | a rule's instrument is not `excluded` (ERROR) or `watched` (WARNING) | as stated | 0 |
| T-10 | stored application dates equal the derived ones | BACKLOG until `dates` is derived | 11 |
| T-11 | `outcome:applies` with every date after as-of | ERROR | 0 |

Examples: nine rules, three per instrument, in `applicability-examples.json`. Reading them found three
corrections for the author (F-4, F-5, F-6), and F-8.

---

## 3 · D3 — status labels

`status-labels.json` holds the enum, the mapping, the transitions and how each state is established.

| Label | Italian (the brief's) | States | Kind |
|---|---|---|---|
| `label:in-force` | in vigore | in-force, applicable | primary |
| `label:staggered` | in applicazione scaglionata | partly-applicable, **or** in-force/applicable whose milestones straddle as-of | primary |
| `label:proposal` | proposta legislativa in corso | proposal, parliament-position, council-position, trilogue, stalled | primary |
| `label:political-agreement` | accordo politico raggiunto, adozione formale attesa | political-agreement | primary |
| `label:withdrawn` | ritirato | withdrawn | primary |
| `label:in-transition` | in transizione / possibile abrogazione | **none**: derived from the map (a proposed repeal edge) | secondary, shown beside the primary |
| *(none)* | — | transposition-pending, transposition-overdue, amended, repealed, adopted, published | the state shown on its own (Q-3) |

Two choices here were not settled by roadmap §5. Both are recommendations:
- **"In transition" needs no new taxonomy state and no forecast claim.** It is a secondary label derived
  from the map (§1.4).
- **Six states get no label** rather than a misleading one. A directive with overdue transposition is in
  force at Union level, and "in vigore" would tell a reader its obligations bind them.

**Transitions** (`x-transitions`): the moves a state may make between two verifications. Skipping a
stage is allowed when the note names what was skipped, because records are read less often than
procedures move. PSD3 and PSR went from proposal to agreement between two readings.

**How a state is verified** (`x-verification`):
- **For a person or an agent with network access:** the act's final provisions and the Publications
  Office's in-force metadata must agree. The procedure file is needed for a procedural stage. This
  session ran that query for every act in D6; every date matched the act's own text.
- **For `evidence-audit.mjs`, which stays offline (AUDIT F-12):** it checks that the records are
  consistent with each other and with the references a person recorded.

| Rule | What it checks | Severity | On 27 Oct 2026 |
|---|---|---|---|
| S-01 | `legislative_status` resolves | ERROR — already `validate.mjs` | 0 |
| S-02 | scalar vs milestones (`statusContradictions`) | ERROR — already `evidence-audit.mjs` §6, unchanged | 0 |
| S-03 | `status_basis` tier fits the state: an adopted state needs tier 1; a procedural stage accepts a tier-2 procedure file | ERROR where `status_basis` exists | n/a |
| S-04 | with `--base <ref>` (CI on a pull request): every status change is an allowed transition, or the record's `status_note` changed in the same diff | ERROR; runs only with `--base` | n/a |
| S-05 | every `status:*` term maps to a label or to the unlabelled list. A 17th state added to the taxonomy without a mapping is caught | ERROR | 0 (16 of 16) |
| S-06 | the latest `accessed` among `status_basis` sources is ≥ `status_as_of`: a status re-dated without a re-read | WARNING | n/a |
| S-07 | `kind:proposal` ⇒ pre-adoption state | ERROR — already `validate.mjs` §5 and `statusContradictions` | 0 |
| R-01 | a watched record whose `watch_for.event_type` has occurred: a milestone of that type on the record, dated ≤ as-of | WARNING `WATCH_TRIGGERED`: the decision must be reopened | 0 |

---

## 4 · D4 — extending `tools/evidence-audit.mjs`

Not implemented. This is the plan Phase 3 executes.

### 4.1 Architecture

- **One derivation module, two readers.** `js/map-model.js` (new) exports pure functions:
  - `coverage(i)`, `statusLabel(i, ix, asOf)`, `transitionLabel(i, ix)`;
  - `edgeState(r, ix)`, `modality(r, ix)`, `addressees(id, rules)`, `enables(id, ix)`;
  - `ruleDates(r, ix)`, `publishable(r, ix)`.
  The map view and the audit both call it, as `js/regulatory-model.js` is called today, so the report
  and the page cannot disagree. It takes `asOf` as an argument and never reads the clock (AUDIT F-15).
- **Three new report sections**, after REGULATORY:
  - `MAP`: nodes by coverage, edges by state and modality, the register and the watchlist by name;
  - `TRIGGERS`: rules by publishable state, with a backlog by code;
  - `STATUS`: labels by count, and the unlabelled states by name.
  The same in `--json` and `--markdown`; `--graph` gains `instrument -[kind, state]-> instrument` edges.
- **A third severity, BACKLOG**, beside ERROR and WARNING. It works like the existing `remediation`
  block: counted, named, never failing the run. It exists so that a check can be introduced at its final
  strictness for new records without turning the current tree red. Each BACKLOG code has a flip
  checkpoint (§4.3).
- **Where each check lives:**
  - resolution (does an id exist?) stays in `validate.mjs`;
  - what a record can *carry* goes in `evidence-audit.mjs`, as its header comment divides them;
  - M-16 and S-01 belong to `validate.mjs`.

### 4.2 The checks

| Check | Input | Output | Failure | Deliverable |
|---|---|---|---|---|
| M-02 derived fields | every record in `data/` incl. `relationships[]`, `rules[]` | `ERROR <file>/<id> stores "<field>"` | ERROR | D1 |
| M-03, M-04 scope decision | instruments, taxonomy `inclusion_criterion`, sources | `ERROR instruments/<id>: …` / `BACKLOG scope-decision-missing` | ERROR / BACKLOG | D1, D6 |
| M-05 coverage vs page | instruments, `js/routes.js hasEntityPage` | `ERROR instruments/<id>: covered without a page` / `excluded with a page` | ERROR | D1 |
| M-06 external referral | `refer_to`, sources | `ERROR … refers to <src> with no url` | ERROR | D1, D6 |
| M-07, S-03, S-06 status basis | instruments, sources, `status-labels.json` table | `ERROR` / `BACKLOG status-basis-missing` / `WARNING STATUS_REDATED` | ERROR / BACKLOG / WARNING | D1, D3, D6 |
| M-08, M-09, M-11, M-13 edge evidence | relationships, sources, instruments | `ERROR relationships/<id>: …` / `BACKLOG edge-v1-sources` | ERROR / BACKLOG | D1 |
| M-10 analytical without claim | relationships, taxonomy `basis` | `BACKLOG edge-analytical-no-claim` | BACKLOG | D1 |
| M-12 dead edge | relationships, instrument status | `WARNING DEAD_EDGE` | WARNING | D1 |
| M-14 symmetry | relationships, taxonomy `basis` | `ERROR` | ERROR | D1 |
| M-15 arrays vs edges | instruments, relationships | `BACKLOG edge-second-home` | BACKLOG | D1 |
| T-01…T-11 | applicability rules, provisions, sources, timeline, instruments | `ERROR applicability/<id>: …` / `BACKLOG rule-*` | per §2 | D2 |
| S-04 transitions | `--base <ref>`: `git show <ref>:data/instruments.json` against the tree | `ERROR instruments/<id>: <from> → <to> is not an allowed transition` | ERROR, only with `--base` | D3 |
| S-05 label coverage | taxonomy `status`, `js/map-model.js` table | `ERROR status:<x> has no label and is not declared unlabelled` | ERROR | D3 |
| R-01 watch triggered | watched records, timeline | `WARNING WATCH_TRIGGERED` | WARNING | D6 |

### 4.3 Integration without breaking what exists

- **No existing check changes.** Sections 1–7 of the report and their numbers are untouched.
  `statusContradictions` and `statusAge` are reused, not re-implemented.
- **Exit code meaning unchanged:** exit 1 on an ERROR, a defect in the tree true on every date. BACKLOG
  never sets it. Measured on 27 Oct 2026, every ERROR-severity rule above reports **0** on `main`, so
  adding them leaves the run green. Every warning-severity rule also reports 0, so no new warning
  appears.
- **Depends on Phase 0 item 0.3.** The new date comparisons (T-07, T-11, M-09, R-01) read `--as-of`.
  Until 0.3 lands, `--as-of banana` makes everything stale, so 0.3 must come first.
- **`tools/selftest.mjs` gains one planted failure per ERROR rule.** For example, a stored `stratum`, an
  excluded record that passes the gate, a `defers-to` edge whose locator is in the wrong act, a
  `_gte`-less threshold key, and a 17th status with no label. A check that cannot be shown to fire is a
  check on nothing (the SESSION 30 lesson).
- **Flip checkpoints** — when each BACKLOG becomes an ERROR:
  - `edge-v1-sources`, `edge-analytical-no-claim`: at the end of item 2.1. The register's edges are v2
    from the start; the 17 old ones are migrated in the same item.
  - `scope-decision-missing`, `status-basis-missing`: at the end of item 2.6.
  - `rule-*`: at the Phase 3 entry gate, which is the roadmap's own condition: "adding rules waits until
    the existing 33 pass it".
  - `edge-second-home`: when the arrays are derived (F-1).
  Each flip is a one-line change to the check, made in the session that closes the backlog.
- **The map view is not published while the `edge-v1-sources` backlog is open.** The brief: "an
  unverified map is worse than no map". Today that backlog holds all 17 edges. Hiding them and showing a
  map of the new edges only would be a map that looks complete and is not. The view therefore ships with
  item 2.1's checkpoint, or later, when every edge it draws has locators. The same holds for a node
  without `status_basis`, which is drawn as unverified (§1.3).
- **CI.** `qa.yml` already runs `evidence-audit.mjs`. S-04 is added to the pull-request job only, with
  `--base origin/main`.

---

## 5 · The inclusion criterion (D-7) — proposed

The roadmap requires the criterion to be written down before any instrument is added. D6's reasons need
it to be measured against. **Proposed, not approved.** Each clause is a taxonomy term
(`inclusion_criterion`), so a decision cites clauses rather than prose.

| Clause | Meaning (tested against the act's own subject-matter article) |
|---|---|
| `crit:object-data` | rules on personal data, or on access to, sharing or governance of data |
| `crit:object-services` | rules on digital services and online platforms |
| `crit:object-ai` | rules on artificial intelligence |
| `crit:object-security` | rules on the security and resilience of network and information systems |
| `crit:object-infrastructure` | rules on the digital infrastructure the other four run on: electronic identity and trust services, interoperability of public digital services, electronic communications networks |
| `crit:horizontal` | the rules apply across sectors |
| `crit:sector-instance` | a sector's instance of one object layer, built on a covered instrument, and shown by an edge to it (DORA → NIS2; EHDS → eIDAS, CRA) |
| `crit:other-field` | the act's organising principle belongs to a field the brief does not analyse: tax, intellectual property, media content, product safety, accessibility, electoral law, financial markets and payments |
| `crit:readable` | law in force, or a proposal whose procedure has begun, with a primary text readable on the date of decision |

**Included** when (≥1 object clause) ∧ (horizontal ∨ sector-instance) ∧ ¬other-field ∧ readable.
**Excluded** when other-field holds, or no object clause does. **Watched** when the decision is deferred
to a named event.

Tested against every regime the prompt names:

| Regime | Clauses | Outcome | The brief (A-1, A-3) | Agree? |
|---|---|---|---|---|
| 11 existing core | object-* and horizontal (DORA: sector-instance) | included | covered | yes |
| eIDAS 2.0 | object-infrastructure, horizontal | included | priority | yes |
| Cyber Solidarity Act | object-security, horizontal | included | priority | yes |
| EHDS | object-data, sector-instance | included | priority | yes |
| Interoperable Europe Act | object-infrastructure, horizontal | included | priority | yes |
| Digital Networks Act | object-infrastructure, horizontal, readable (proposal) | included | priority | yes |
| ViDA | other-field (tax) | excluded | excluded | yes |
| AVMSD | other-field (media content) | excluded | excluded | yes |
| Copyright DSM | other-field (IP) | excluded | excluded | yes |
| GPSR | other-field (product safety) | excluded | excluded | yes |
| EAA | other-field (accessibility) | excluded | excluded | yes |
| Political advertising | other-field (electoral) | excluded | excluded | yes |
| **P2B** | object-services, horizontal | **included** | register **or** watchlist, not a page | **only as watched — Q-1** |
| MiCA | other-field (financial markets) | excluded → watched (finance chapter) | conditional, finance chapter | yes |
| PSD3, PSR | other-field (payments) | excluded → watched (finance chapter) | conditional, finance chapter | yes |
| DGA | object-data, horizontal | included → watched (finance chapter, as the brief lists it; Q-6) | conditional, finance chapter | yes |

**Q-1, P2B.** The criterion would include P2B, and the brief rules out a full page for it. The two meet
only in the watchlist. D6 still records P2B as excluded, because that is how the first draft read the
brief. The only ground it can give is that P2B's repeal is proposed (COM(2025) 837 Art. 10(1)) and that
its addressees are reached by the DMA and the DSA. That ground needs a clause, `crit:covered-elsewhere`,
written for this one entry, and a clause that fits one case is a smell.

**Recommended:** P2B becomes `watched`, watching the adoption of COM(2025) 837. The brief permits this
("registro … o watchlist"), so it reverses nothing. It still assigns a regime to a list, which is the
author's call; D6 changes only on the author's word.

---

## 6 · Coherence matrix

### 6.1 Every map node → register, watchlist or coverage

| Node | Coverage | Register / watchlist entry | Criterion | Label (27 Oct) | Edges in D1/D6 |
|---|---|---|---|---|---|
| gdpr, dsa, dma, dora | covered | — (backlog M-04) | §5 | in-force | dsa: 3 defers-to out, 2 in; dora: enables in; gdpr: defers-to in |
| ai-act, data-act, cra | covered | — (backlog M-04) | §5 | staggered | data-act: amends in (proposed); cra: amends in |
| nis2, cer | covered | — (backlog M-04) | §5 | *(none)*: transposition-overdue | nis2: enables out; cer: F-3 |
| ai-omnibus | covered | — (backlog M-04) | §5 | in-force | — |
| data-omnibus | covered | — (backlog M-04) | §5 | proposal | 3 out (2 repeals, 1 amends), all proposed |
| eidas2 | covered (2.2) | included | object-infrastructure, horizontal | in-force | enables → ehds (partial) |
| ehds | covered (2.4) | included | object-data, sector-instance | in-force | enables in; amends → cra |
| csa | covered (2.3) | included | object-security, horizontal | in-force | enables in |
| iea | covered (2.5) | included | object-infrastructure, horizontal | in-force | defers-to → gdpr |
| dna | covered (2.6) | included | object-infrastructure, horizontal | proposal | amends → eprivacy (proposed, partial) |
| vida, avmsd, copyright-dsm, gpsr, eaa, ttpa | excluded | **register** | other-field | in-force | avmsd, copyright-dsm: defers-to in; gpsr, ttpa: defers-to → dsa |
| p2b | excluded | **register** (Q-1) | covered-elsewhere (proposed) | in-force + in-transition | defers-to in; repeals in (proposed) |
| mica | watched | **watchlist** | other-field | in-force | enables → dora |
| psd3, psr | watched | **watchlist** | other-field | political-agreement | — |
| dga | watched | **watchlist** (record exists) | object-data, horizontal | in-force + in-transition | repeals in (proposed) |
| pld, gdpr-procedural, eprivacy, cloud-ai-development-act, ecommerce-directive, nis1, chips-act, ai-liability-directive, charter, tfeu, teu | mapped | — (no decision needed) | — | per state | existing v1 edges |

Every node is in exactly one of the four coverage classes. Every excluded or watched node has an entry
in D6. No node in the register or watchlist has a page today, and none is eligible for one (M-05).

### 6.2 Every trigger → regime → status label

| Rules | Instrument | Coverage | Label (27 Oct) | T-08 | T-09 |
|---|---|---|---|---|---|
| ap-gdpr-01…04 (ex. 01, 02, 03) | gdpr | covered | in-force | ok | ok |
| ap-dsa-01…05 (ex. 01, 02, 04) | dsa | covered | in-force | ok | ok |
| ap-dma-01…04 | dma | covered | in-force | ok | ok |
| ap-ai-act-01…07 (ex. 01, 03, 04) | ai-act | covered | staggered | ok | ok |
| ap-data-act-01…04 | data-act | covered | staggered | ok | ok |
| ap-nis2-01…03 | nis2 | covered | *(none)*: transposition-overdue | ok (not a pre-adoption state) | ok |
| ap-dora-01…02 | dora | covered | in-force | ok | ok |
| ap-cra-01 | cra | covered | staggered | ok | ok |
| ap-pld-01 | pld | mapped | *(none)*: transposition-pending | ok | ok |
| ap-eidas2-01 | eidas2 | mapped → covered (2.2) | in-force | ok | ok |
| ap-cross-01 | gdpr | covered | in-force | ok | ok |

No rule points at a register or watchlist instrument, and none at a proposal. The nine examples cover all
three instruments the prompt asks for.

### 6.3 Every new check → deliverable

| Deliverable | Checks |
|---|---|
| D1 map | M-01…M-16 |
| D2 triggers | T-01…T-11 |
| D3 labels | S-01…S-07 (S-01, S-02, S-07 exist already) |
| D6 register / watchlist | M-03, M-04, M-05, M-06, M-07, R-01 |
| D5 note | none. It is prose; the facts it states are the ones above. |

No check lacks a deliverable, and no deliverable that states facts lacks a check.

### 6.4 Incoherences the matrix found, and what was done

| # | Incoherence | Resolution |
|---|---|---|
| I-1 | The map examples used ad hoc label names before D3 fixed the enum | **Fixed**: aligned to `label:*` |
| I-2 | D6 entries carried an approval date the author had not given | **Fixed**: `approved_on: null`; schema allows null only under `docs/` (M-04) |
| I-3 | D6's repeal edges contradict `data-omnibus.proposes_to_amend` (dga), which also omits cer | **Fixed in the proposal**: D6 `instrument_updates` carries the correction. The data change itself is the author's (F-2, F-3) |
| I-4 | Labels: transposition states fell in no group, which would have dropped two core instruments silently | **Fixed**: an explicit unlabelled list, plus S-05 (Q-3 for the wording) |
| I-5 | P2B: the criterion includes it; the draft had it excluded | **Not fixable without the author**: Q-1. The brief allows the watchlist, so the recommended fix contradicts nothing |
| I-7 | PSD3/PSR reopened on adoption, against the brief's "solo se … capitolo finanza" | **Fixed**: `watch_for` is the finance chapter for all four conditional inclusions |
| I-8 | The brief requires an unverifiable node to be removed or downgraded; the draft verified edges only | **Fixed**: derived node `verification_state` (§1.3); the map is not published while an edge is v1 (§4.3) |
| I-6 | eidas2 promoted to core would fail M-05 (no `dna.objective`, so no page) | **Sequencing, not design**: item 2.2 writes the objective in the same commit that changes the scope |

---

## 7 · Findings in the existing data (reported, not fixed)

All are amber or red, and the author decides each one. None was changed.

| # | Finding | Evidence |
|---|---|---|
| F-1 | Edges have a second home: the instrument arrays. Four `data-omnibus.proposes_to_amend` entries (eprivacy, data-act, dga, nis2) have no relationship | measured 27 Oct 2026 |
| F-2 | `data-omnibus.proposes_to_amend` lists **dga**, but COM(2025) 837 proposes to **repeal** it | Art. 10(3)(a); title "repealing … (EU) 2022/868" |
| F-3 | …and omits **cer**, which it amends | Art. 9 "Amendments to Directive (EU) 2022/2557"; title |
| F-4 | `ap-ai-act-03`'s key `cumulative_training_flop_gte` reads "≥ 10^25", but the AI Act says "greater than" | AI Act Art. 51(2) |
| F-5 | `ap-gdpr-03` omits that courts acting in their judicial capacity need not designate a DPO | GDPR Art. 37(1)(a) |
| F-6 | `ap-dsa-04`'s exemption names "the online-platform section" (Section 3, Art. 19); the marketplace exclusion is Section 4, Art. 29 | DSA Arts 19, 29 |
| F-7 | `ap-dsa-01`'s exemption omits the Art. 24(3) exception and the twelve-month tail | DSA Art. 19(1) |
| F-8 | 11 of 33 rules' `dates` omit an application event of one of their own obligations, including the Omnibus's 2 Dec 2026 Art. 5 tranche (`ap-ai-act-01`, `-06`, `-07`) | measured against `data/timeline.json` |

---

## 8 · What this does not establish, and where it departs from the prompt

- **It changes nothing in the site.** Every record is a proposal under `docs/`, so the published pages
  are exactly as before.
- **Departures from the prompt, each decided by the author on 25 Oct 2026:**
  - no separate map file (D-6);
  - no separate trigger entity (D2 model);
  - `last_verified` rather than `verified_at`;
  - no `stratum` (D-8).
- **One addition the prompt did not ask for:** the inclusion criterion (§5). Without it, D6's reasons
  would have nothing to be measured against, which the roadmap forbids (D-7). It is proposed, not decided.
- **The brief arrived after the first draft.** The design was checked against it on 27 Oct 2026 (§0.1).
  A-2, A-4 and A-6 remain assumptions, because the brief does not settle them.
- **What the sources were read for.** They were read for the facts the records state: identity, status,
  dates and the cited articles. Nothing else in them was read. Amendments to the excluded acts beyond
  those named, and transposition in the Member States, were not researched; both are `null`.
- **Procedure files are living pages.** The PSD3, PSR and DNA stages are true as of 25 Oct 2026. A
  status is re-read on the date it is written into `data/`, not copied from here.
