# Regulatory impact mapping

**Status:** built in SESSION 10, on top of Agent 3 (`docs/CHANGE-DETECTOR.md`).
**Nothing in production changed.** `data/`, every page, `js/`, `css/`, `i18n/` and `fonts/`
are byte-identical, and the whole of `tools/` is untouched.

```
node agent/detector/cli.mjs --mock --dry [--depth N]     # map the fixtures onto the real site
node agent/observability/cli.mjs impact [--graph]        # what reached what, from the trace
node agent/observability/cli.mjs serve                   # → the Regulatory impact panel
```

---

## 1. What the session asked for, and what it means here

> Extend the Change Detector so that it understands the existing website. For every
> confirmed change identify: affected JSON dataset · affected instrument · affected timeline ·
> affected compliance calendar · affected comparison views · affected applicability logic ·
> affected evidence displays · affected glossary relationships · potentially stale analytical
> pages. Separate FACTUAL IMPACT from EDITORIAL IMPACT. A factual impact may become
> automatically actionable. An editorial impact must become a review proposal unless
> governance explicitly permits otherwise. Generate a dependency/impact graph and expose it
> through observability. Do not modify production.

All nine surfaces are computed and all nine are reachable, with a test that asserts it against
the real corpus. The split is a shape the contract polices rather than a label. The graph is
derived from the corpus rather than declared. And the site's surfaces that are **none** of the
nine — the enforcement table, the institutional map, the masthead, the status strips — are
reported under their own name rather than folded into the nearest, because an impact on the
enforcement page reported as an impact on the compliance calendar is worse than one not
reported at all.

## 2. Five modules, and what each refuses

| Module | Does | Refuses |
|---|---|---|
| `agent/detector/graph.mjs` | Builds the dependency graph of the corpus: 651 records, 3070 references, derived | To declare an edge. Every edge is a string in a record that **is** the id of another record |
| `agent/detector/fields.mjs` | Says which fields carry a fact and which carry an argument | To guess. Unclassified is treated as prose and **fails the suite** |
| `agent/detector/impact.mjs` | The nine surfaces, the factual/editorial split, the governance gate | To assert staleness it cannot quote |
| `agent/schemas/contracts/impact-assessment.mjs` | The seventeenth contract | To restate anything the detection already says |
| `agent/observability/query.mjs` → `impactState` | Reads the map back off the trace | To report a bounded preview as the whole graph |

## 3. The graph is derived, and that is the whole point

The obvious implementation is a table — *a claim references instruments, provisions,
institutions, enforcement and sources* — and it is the second home this architecture exists to
prevent. It goes stale the first time a dataset grows a field, silently, and a silently
incomplete impact map is worse than none because it reads as coverage.

The rule instead is one sentence:

> **A string that is the id of a record is an edge to that record; everything else is a value.**

The ids in this corpus are namespaced and mutually un-confusable — `clm-…`, `src-…`, `tl-…`,
`enf-…`, `gl-…`, `ap-…`, `rel-…`, `gdpr`, `gdpr:art-5`, `status:applicable`, `part-7` — so
whole-string equality against the node index is a test, not a guess. A prose sentence never
equals an id. A field nobody has thought about is followed anyway.

**A nested record is not walked twice.** Provisions live inside their instrument and are nodes
in their own right; descending into them would give `gdpr` every source its articles cite and
inflate every count in the graph. The walk stops at any nested object whose `id` is a node and
emits the containment edge instead. A test asserts it.

**Wildcards are expanded and said to be wildcards.** `tools/validate.mjs` treats every wildcard
reference as resolving (`docs/AUDIT-2026-09-01.md` F-12), which makes a wildcard exactly the
kind of edge nobody has ever checked. `"dpa-*"` turns out to be a real record id in
`data/institutions.json`, so it resolves directly. `"*"` — five competences on `ec`, `cjeu`,
`ep` and `council` — matches every record there is, and an edge to everything orders nothing,
so it is recorded against the corpus rather than expanded.

**Reference-ness is a property of the KIND, not of the row.** `instruments[].brief_part` holds
an id on twenty-two acts and `null` on one. Asking whether *that record* produced an edge would
classify the same field as a reference on one act and an unclassified value on the next.

## 4. Factual and editorial: the line, and why it is where it is

> **A field is FACTUAL where something in this repository can prove it wrong, and
> EDITORIAL where nothing can.**

That is not a metaphor about writing style. `AGENTS.md` states the second half outright:
*"The validators do not read prose. A false statement in `index.html` passes every check in
this repository."* `tools/validate.mjs` resolves every reference and checks every enum against
`data/taxonomy.json`. It has never read a sentence.

So when a date moves:

| | |
|---|---|
| `timeline.events[].date` | a validator sees the value. **FACTUAL** |
| `timeline.events[].obligation` | "The full GDPR obligation set becomes applicable." — a sentence that may now be false, and every check in the repository passes either way. **EDITORIAL** |

Three buckets, and the first two are the factual half:

- **reference** — the value is another record's id. A validator proves it resolves.
- **value** — a date, number, boolean, URL, closed vocabulary, proper name or locator.
- **prose** — authored natural language that asserts something. Nothing here reads it.

**When in doubt, prose.** `docs/AUTONOMY-POLICY.md` says the default when unsure is the higher
class, and here the higher class is editorial. Calling prose a value means a sentence that has
gone false gets no review; calling a value prose costs a reviewer a minute. The register fails
in the cheap direction on purpose, and an unclassified field defaults to prose **and fails the
suite** — a development-time defect rather than a silent one.

### Two fields whose name says reference and whose value is prose

Both are findings about the corpus, not about the code, and both are now registered as prose:

- **`timeline.events[].supersedes`** holds *"Originally 2 August 2027; deferred by the AI
  Omnibus."* — a sentence, not an id. So the one field in `data/timeline.json` that records
  that a date **moved** is prose that nothing checks, which is precisely what a `DELAYED`
  change has to leave correct.
- **`applicability.rules[].depends_on`** holds a sentence describing what the rule's outcome
  turns on. Nothing points at it and nothing checks it.

Four of the eleven DNA dimensions (`objective`, `risk_logic`, `enforcement_mechanism`,
`implementation_model`) are also sentences rather than taxonomy terms, and the comparison grid
on `instruments.html` renders them side by side as though they were comparable categories.

## 5. The editorial half is evidenced, not asserted

A prose field is reported as stale only where the **old value can be found in the sentence** —
quoted, so a reviewer can check the finding rather than take it. Three ways a value can appear:

| the value is | what is searched for |
|---|---|
| a date | any rendering of the same calendar day: `25 May 2018`, `May 25, 2018`, `May 2018`, `2018-05-25`. A **reader** of prose, not a second renderer — deliberately wider than what `humanDate` produces, because the prose in `data/` was typed by hand. The month names are read out of `js/format.js` so the vocabulary has one home |
| a taxonomy id | the term's **label** from `data/taxonomy.json`. Prose says "Applicable", never `status:applicable` |
| anything else | the literal string, on a token boundary |

**Prose at a coarser precision still refers to the value.** "May 2018" is a sentence about
2018-05-25. The reverse is not assumed.

### The false positive that shaped this, and the test it left behind

`status:applicable` is labelled **"Applicable"**. Searching prose for that label finds *"The
DMA becomes applicable."* and *"Directly applicable"* — sentences about a different act in
which the word is doing ordinary work. Reported as editorial findings they are false, and a
review list with false entries in it is a review list nobody finishes.

The test is derived rather than guessed: **does the label appear in prose on records that do
not carry the term?** If it does, a string match cannot tell the term from the word.
`labelAmbiguity()` answers it against the live corpus, and an ambiguous match does not vanish —
it moves to `open_questions` **with its sentence attached**, which is the honest shape: here is
a sentence containing the word, and whether it is about the status is a reading this agent does
not make.

### Where prose cannot be quoted

A record's prose may depend on the change and say nothing quotable. That is an **open
question**, in the record's own words, not a finding — and not a clearance either. Reported to
depth 1 only; further out, "this sentence might depend on it" is true of most of the corpus and
would drown the findings that are quotable.

**"This paragraph might be wrong" and "this paragraph says 25 May 2018" are different claims,
and nothing here lets the second stand in for the first.**

## 6. Routing: what may be done without a human

| route | when | automatically actionable |
|---|---|---|
| `propagates_by_derivation` | the field points at the changed record rather than restating it | **yes — and the action is none** |
| `review_proposal` | a stored copy of the value that moved, or any prose | no, absent a named permit |
| `human_only` | the field is one `PROVENANCE_FIELDS` protects | never |

**The interesting factual case is the one where there is nothing to do.** This site derives at
render time rather than storing: evidence grades, the enforcement pipeline, competent authority
and key dates are computed whenever a page is opened. So when a timeline date is corrected, the
compliance calendar, the status strips and the pipeline stages are already right — no edit,
nowhere. Saying so is worth more than a list of files, because the alternative is a reviewer
hand-checking seven views that cannot be wrong. On the fixture run, **225 of 260 factual
impacts need no edit at all.**

The factual impact that is not free is the **second home**: a stored value elsewhere restating
the one that moved. One home per fact is the rule this corpus is built on; where it is broken,
the second copy has to be edited alongside the first, which is Class C.

### `GOVERNANCE_PERMITS` is empty, and that is the finding

The brief says an editorial impact becomes a review proposal *"unless governance explicitly
permits otherwise"*, so the mechanism has to exist and has to be read from somewhere. It is
read from `GOVERNANCE_PERMITS` in `agent/detector/impact.mjs`. Nothing in `docs/` puts anything
in it:

- `AUTONOMY-POLICY` Class C names *"any change to the brief's prose in `index.html`, including
  the matching `superseded` declarations in **every** affected locale"* — pull request and
  human approval.
- Class B's own test is *"if a human would need to check a source to know whether the change is
  right, it is not Class B"*, and every editorial impact here is downstream of a document
  somebody has to read.
- `AI-SAFE-BOUNDARIES` §3 makes a provenance field red tier whatever else is true.

The gate has **no special case for the list being empty**, and a test proves a permit added
later takes effect without the gate being rewritten. That is the only way "unless governance
permits" can be implemented honestly: as a mechanism that is currently closed, not as a refusal
wearing a clause.

## 7. The nine surfaces, and how each is derived

| Surface | Records from | View from |
|---|---|---|
| dataset | `HOME_OF` of every reached node | — |
| instrument | instruments, provisions, relationships reached | `js/instrument-page.js` |
| timeline | timeline events reached | — |
| compliance calendar | the same events | `js/calendar.js` |
| comparison | — | `js/dna.js` · `js/pyramid.js` · `js/interactions.js` · `js/instruments-page.js` |
| applicability | applicability rules reached | `js/applies.js` |
| evidence | claims and sources reached | `js/evidence.js` · `js/evidence-view.js` · `js/bibliography.js` |
| glossary | terms reached, **plus the `related_terms` edges between them** | `js/glossary-graph.js` |
| analytical page | brief parts reached through `claims[].brief_part`, plus pages whose markup names a reached id | — |
| *other* | — | `js/enforcement-page.js` · `js/institutions-page.js` · `js/masthead.js` · `js/status.js` |

**Which module renders which entity kind is read from the code.** Views are handed the index
`js/data.js` builds, so the index keys a module touches (`IX.event`, `ix.claim`) are the
evidence of what it renders; a few read a dataset straight off `db` because `index()` builds no
map for it, and both are read. The key vocabulary itself is parsed out of `index()` so it has
one home, and a test fails if the gateway grows a key nothing maps.

**Which page runs which module** comes from `surfaces.mjs` — the same `<script src>` entry
points and static imports `docs/CURRENT-ARCHITECTURE.md` §5 says its table was read from, with
the shared chrome excluded for the reason that document already gives.

**`MODULE_SURFACE` is a judgement, in one place, with a reason per entry**, and the suite
asserts it names every module in `js/` exactly once. `not_a_view` is a separate answer from
`other`: the gateway, the derivation modules and the chrome render nothing of their own, and
counting them would put `js/format.js` in the impact map of every change ever detected.

### Two things the surface answers deliberately do not claim

- **The compliance calendar filters against the reader's own clock.** `js/calendar.js` compares
  event dates to `new Date()` to decide upcoming from past (`docs/AUDIT-2026-09-01.md` F-15).
  The events are named; which side of the horizon each falls on is not, because that would be
  this map asserting something about the reader's browser.
- **A markup mention is not staleness.** That `index.html` names an id establishes that the
  author wrote it down, never that the sentence around it is now wrong. And `index.html`
  renders part of its content from the inlined `window.__CONTENT__` blob rather than from
  `data/brief.json` (`CURRENT-ARCHITECTURE` §8), so *which* of the two homes a stale sentence
  lives in is a question this map does not answer.

## 8. Exposed through observability

Three records go onto the span that mapped a change, and `impactState()` in
`agent/observability/query.mjs` joins them at read time — derived, never stored twice:

| record | carries |
|---|---|
| `artifact` `impact-graph-<change_id>` | the subgraph: roots, per-depth counts, direct dependencies, `sha256` of the whole |
| `decision` | where the impacts routed, **with the alternatives not taken** |
| `observation` at `risk: high` | one per editorial finding, with the sentence |

Reachable three ways:

```
node agent/observability/cli.mjs impact [--trace t] [--change c] [--graph]
GET /api/impact?trace=&change=
the Regulatory impact panel in the viewer, plus an Editorial impacts rail
```

**The rail is deliberate.** An editorial impact sits beside pending approvals and open handoffs
for the same reason those do: it is a sentence on a production site about EU law that may now
be false, and nothing in this repository will catch it. The state that matters most is the one
nobody has looked at.

**An impact map missing its routing decision reports the gap**, exactly as `traceChain` reports
a missing approval. A view that quietly fills in the gap reads as an audit.

### The cap that produced a confident zero

`agent/observability/redact.mjs` caps a stored string at 8000 characters — *"a trace field is
evidence, not a payload dump"*. The first version of this work inlined the whole subgraph, the
store truncated it mid-JSON, and the viewer showed **a graph of zero nodes for a change that
reached a hundred and seventy-five records.** A cap silently producing a confident zero is
exactly the failure this repository exists to refuse.

The cap is right, and the fix was to respect it. The trace now carries the **shape and the
identity** — roots, per-depth counts, the direct dependencies in full, `dropped_nodes`,
`dropped_edges`, and a `sha256` over the complete subgraph. Nearest first, so a cap can never
eat the direct dependencies. The counts describe the whole graph, never the preview. The
complete graph is the `ImpactAssessment` record's `factual` array — every reached node with the
field and hop that reached it, which is the edge list in the contract's own terms and needs no
second copy. Four tests hold this down, one of them named for the failure.

## 9. The seventeenth contract

`ImpactAssessment` is about the **site** where `RegulatoryChange` is about the **world**. It was
added rather than folded into the detection for three reasons, and the third decided it:

1. **Different subject.** One is a regulator moving a date; the other is what renders that value
   and what prose restates it.
2. **Different lifetime.** `RegulatoryChange` says detections are never edited. But the impact of
   a change moves whenever the *site* moves — add a view on Tuesday and Monday's change reaches
   one more page, with nothing about the change itself having altered. Folding the reach in
   would make an immutable record's content depend on code still being written.
3. **Different authority.** This is the record that says what may be done without a human. That
   has to be arguable, supersedable and auditable on its own terms.

It references the detection by `change_id` and restates none of it: `change_kind`, `old_value`,
`new_value`, `materiality` and `affected_pages` are `forbidden` by name with the reason, and a
test asserts the two contracts share no field outside the envelope except `change_id` (the
reference) and `autonomy_class` (which each computes about a different question).

`affected_datasets` and `datasets_reached` are named differently on purpose. The first is
*where the changed fact lives*; the second is *what depends on it*, which is strictly wider — a
date in `data/timeline.json` is depended on by rules in `data/applicability.json` that a
correction never touches.

## 10. Known limitations

1. **It has never seen a real `VerificationRecord`.** Inherited from every agent here, unchanged
   since SESSION 05. The corpus side of every comparison is real; the document side is a fixture.
2. **Depth 2 by default, and the bound is the answer's shape.** Two hops from a timeline event
   reaches most of this corpus. `--depth` raises it; nothing further out is in the map, and the
   record says so.
3. **A markup mention is evidence about the author, not about the sentence.** §7.
4. **Editorial findings are the ones that could be QUOTED, never the ones that exist.** A
   sentence that paraphrases the value that moved without stating it is invisible here, and
   every assessment carries that as an open question rather than implying coverage.
5. **`MODULE_SURFACE` is a judgement.** A different assignment gives different surfaces on the
   same corpus. It is in one place, every entry has a reason, and the suite asserts it is
   exhaustive — which is the most that can be said for it.
6. **Static imports only, and no dynamic import is followed.** Inherited from `surfaces.mjs`.
7. **The `__CONTENT__` bypass is not resolved and is not pretended away.** §7.
8. **Nothing downstream consumes an `ImpactAssessment` yet.** The chain still ends at a finding
   in front of a human: `RegulatoryChange → ImpactAssessment → (a DataProposal nobody writes) →
   ApprovalRequest → ChangeRecord`. The two middle arrows are SESSION 11's.

## 11. Where this sits

```
scout → verifier → integrate → a proposal in front of a human
                 → detector  → a change in front of a human
                             → impact map → what it reaches, and which half a machine may act on
```

**Autonomy class.** An assessment is never `autonomous` — it is about what a production site
tells a reader about EU law. It is never lower than the detection it assesses, and a test
asserts that: an assessment that relaxed the class would be a way round the gate. An editorial
impact anywhere in a run stops the whole run reporting as autonomous.

## 12. Test counts, after this session

| Command | Result |
|---|---|
| `node --test agent/detector/selftest.mjs` | **63 pass** (38 before; 25 new) |
| `node --test agent/schemas/selftest.mjs` | **108 pass** (101 before; 7 new) |
| `node --test agent/observability/selftest.mjs` | **17 pass** (13 before; 4 new) |
| the other four suites | 151 pass, unchanged |
| `node agent/schemas/cli.mjs check` | 17/17 satisfiable, exit 0 |
| all four validators in `tools/` | identical to the `CURRENT-ARCHITECTURE` §12 baseline |

**339 tests across the seven suites, all passing** (303 before).
