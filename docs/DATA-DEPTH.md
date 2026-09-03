# DATA DEPTH

**Agent 4, built in SESSION 11.** What important legal and regulatory knowledge is missing
from the current structured representation.

**Read with:** `docs/AGENT-CONTRACTS.md` (the eighteen contracts), `docs/AI-SAFE-BOUNDARIES.md`
(the tiers), `docs/DATA-GOVERNANCE.md` (one home per fact), `docs/AGENT-ROLES.md` §4 (the Data
Depth role, and why structural change is never Class B).

**Code:** `agent/depth/`. **Contract:** `agent/schemas/contracts/knowledge-gap.mjs`.
**Run:** `node agent/depth/cli.mjs --as-of YYYY-MM-DD`.

---

## 1 · The question, and the question it is not

The corpus is 651 records and 3070 references across ten datasets. Asking what is *missing*
from it has an easy answer and a hard one.

The easy answer is a census: fifteen instruments carry no provisions, thirteen have no
applicability rule, seven sources are never cited, 106 records carry an unverified note.
**Every one of those numbers already has a home** — `.agents/skills/data-completeness/scripts/gaps.mjs`
computes the census, `tools/validate.mjs` owns the unverified tally, `tools/freshness.mjs`
owns staleness. Recomputing any of them here would be the second copy this architecture
exists to prevent, and it would produce a hundred findings a reviewer stops reading at the
tenth.

The hard answer is the one the brief asks for: **which absences the corpus itself cannot
work around.** Not "the DORA record has no provisions" but "two applicability rules tell a
reader DORA applies to them and neither can name an article, because the act has no article
records to name". The second is a semantic gap. The first is arithmetic.

This agent answers the second question and refuses the first, and the refusal is a
mechanism rather than an intention.

## 2 · The load-bearing test

**A gap is reported only where something in the corpus leans on the missing concept.**

That is not a judgement about importance. It is an edge: `agent/detector/graph.mjs` already
derives every reference in the corpus from the rule that *a string equal to a record's id is
an edge to that record*, and "what leans on this?" is `graph.inbound.get(id)`. The graph is
borrowed rather than rebuilt — a second reference table would go stale the first time a
dataset grows a field.

Demand takes three shapes, and the detectors distinguish them:

| Shape | Example |
|---|---|
| A record **reaches for the missing thing and gets nothing** | an applicability rule with `outcome:applies` and an empty `obligations[]` |
| A record **asserts something the missing thing would complete** | `ai-act.dna.sanction_ceiling` records 7% / EUR 35 000 000, and no institution holds `role:fines` over it |
| A record **argues from** it | six claims treat the AI Act and the DSA together, and no relationship record connects them |

A mention is not a demand. The brief names several acts a paragraph, and counting every
claim that mentions an act as demand for one of its articles would find demand everywhere
and discriminate nothing. So `missing_provision` counts rules, competences and glossary
terms and *not* bare claims — and says so on every record it emits.

**On the current corpus the test examines 88 absences and reports 57.** The other 31 are set
aside for two stated reasons, and both are printed:

- **18** because nothing in the corpus leans on them. The absence is real, it is in the
  census, and reporting it here would be quantity.
- **13** because the corpus has declared the act outside its own analytical scope.

## 3 · The corpus's own declaration is the sharpest filter

`data/taxonomy.json` defines `scope:referenced` as *"Named and placed, but outside this
brief's analytical scope"*. An act the site has said it is not analysing, modelled thinly,
is the site doing what it said it would do — not a gap.

This is the best discriminator in the whole analysis and **none of it is this agent's
taste**: the corpus states its own intent in its own enum authority, and the agent reads it.
It is checked *before* demand, deliberately: a `scope:referenced` act like the Charter still
accumulates references from claims that name it in passing, so a demand-only test would
report it.

It is **not** applied to `scope:adjacent`, which the taxonomy defines as *"mapped and
profiled here"* — a reader is entitled to find the profile.

## 4 · The thirteen detectors

One per kind in `DEPTH_GAP_KINDS`, in the brief's order. A kind with no detector, or a
detector claiming a kind outside the vocabulary, throws at module load and fails the suite:
naming a kind of gap and never looking for it would be a claim of coverage the code does not
have.

| # | Kind | What it looks for | On this corpus |
|---|---|---|---|
| 1 | `missing_instrument` | An act the site cites as primary law and does not model | **0** |
| 2 | `missing_provision` | An act with no articles for anything to cite | 5 |
| 3 | `incomplete_timeline` | A status the timeline does not date | **0** |
| 4 | `incomplete_applicability` | A reader told an act reaches them and not what it requires — or not reached at all | 6 |
| 5 | `missing_institution` | A decision the corpus cannot attribute to a body | 1 |
| 6 | `missing_competence` | An act nobody in the model enforces | 4 |
| 7 | `incomplete_enforcement` | A zero that may be an absence of looking; an unknown a standing argument rests on | 10 |
| 8 | `unsupported_claim` | The site stating what the law *is*, on nothing but itself, with records built on it | 7 |
| 9 | `missing_source_relationship` | One document held as two records, with no way to say so | 1 |
| 10 | `missing_instrument_relationship` | A pair the brief argues about and the model does not connect | 4 |
| 11 | `missing_glossary_concept` | A concept leaned on harder than things the glossary already defines | 17 |
| 12 | `missing_subordinate_instrument` | The act that says what the parent act actually requires | 1 |
| 13 | `stale_record` | Whether anything can be said about staleness at all | 1 |

**Two zeros, and both are results rather than untested branches.** `missing_instrument`
subtracts documents whose citing claims are already about an act the corpus models — which
is what stopped it reporting an Official Journal *withdrawal notice* as an unmodelled act.
`incomplete_timeline`'s only candidates on this corpus are the three treaty provisions, and
the corpus has declared those outside its analytical scope.

A detector that found nothing is carried through the run result, the trace, the CLI and the
viewer, because a reader who cannot tell *looked and found nothing* from *did not look* has
been told nothing — the same distinction the datasets draw between `unknown` and `null`.

## 5 · The four findings worth reading first

**`ai-act` and `nis2` state a maximum fine that nobody in the model may impose.** The AI Act's
DNA records 7% of global turnover / EUR 35 000 000; the NIS 2 Directive's records 2% /
EUR 10 000 000. Both are supervised in the corpus — `ai-office` and `nca-*` for the first,
`nca-*` for the second — and **no institution holds `role:fines` over either.** Competent
authority is derived at render time from competence edges, so the site presents an enforceable
maximum next to an unanswerable question about who enforces it. This is the sharpest thing
the analysis found, and it is only visible because the detector checks the fines role
*independently* of whether the act has any enforcement role at all: collapsing the two would
have hidden it behind a supervisor.

**Five applicability rules tell a reader an act reaches them and name no obligation.**
`ap-dora-01` reaches `outcome:applies`; `ap-cra-01` and `ap-pld-01` reach `outcome:likely`.
The questionnaire on `applies.html` exists to answer *"does this reach me, and what then"*.
These answer the first half and withhold the part a reader would act on.

**`ai-omnibus` is `status:in-force` and no applicability rule covers it.** For every
combination a reader can enter, the engine returns NOT DETERMINED for an act that binds
somebody today. Absence of a rule is absence of knowledge and never evidence of
non-applicability — `AI-SAFE-BOUNDARIES` §0.5 names presenting it as a negative finding as
the single most damaging thing this tool could do, and this is where that misreading is
available.

**`src-eurlex-ai-omnibus` and `src-eli-ai-omnibus-2026-1744` are one document held twice.**
Same recorded title, two source records, and no field in either says so. Evidence grades are
derived per source reference, so one publication can be counted twice behind a claim and read
as two independent corroborations. Nothing in the repository compares source records to each
other, so no validator reports it — and `data/sources.json` has no equivalent of the
`relationships` array that `data/instruments.json` uses for exactly this problem, which is
why this gap is recorded as needing a shape that does not exist.

## 6 · The answer that is "the question cannot be asked"

`stale_record` is the detector whose result is worth more than its finding.

The obvious implementation walks the graph for a record whose `last_verified` predates that
of something it depends on. On this corpus that produces **nineteen** findings — and every
one is an artefact. `agent/integrate/canonical.mjs` already works out that every dataset's
dates are *compilation* dates: 39 instrument records carrying one date, 84 claims carrying
two. `VERIFICATION-POLICY` §5 records the same thing — the field is per-record and the
practice is not.

Nineteen findings resting on a one-day gap between two bulk stamps would be quantity, and
would assert a decay the corpus cannot support. So the detector reports **one** gap, about
the field rather than about the records, and names the nineteen as the cases where the
question *would* have been askable and cannot be answered.

That is what "do not reward quantity" looks like when the quantity is available and wrong.

## 7 · The contract: `KnowledgeGap`, the eighteenth

`KnowledgeGap` is **not** `DataGap`, and they are the pair most easily confused in this
repository:

| | About | Closed by |
|---|---|---|
| `DataGap` | **Evidence.** A value on a record that exists is unsupported, unresearched or contested. | Finding the publication and confirming it says what the record says it says. |
| `KnowledgeGap` | **Representation.** A concept the model has no place for. | A decision about *where* the fact would live, then the verification work that fills it. |

`KnowledgeGap` forbids `what_is_missing` by name, with a pointer to `DataGap`, so an agent
reaching for the wrong one is told which it wanted. It carries `recommended_data_location`
and `DataGap` does not: naming the home is half the answer, and a gap that cannot say where
the fact would go has not established that it is missing rather than filed somewhere else.

Adding an eighteenth contract rather than widening `DataGap` is the course SESSION 08 took
with `DataProposal` and SESSION 10 with `ImpactAssessment`, for the same reason: `DataGap`'s
shape is closed on purpose, and six optional fields would weaken the contract whose whole
design is that a field nothing validates is a field nothing can be held to.

### The brief's nine fields, and where each one is

| Brief's field | On the record |
|---|---|
| `gap_id` | `gap_id` |
| `affected_entity` | **the envelope's `affected_entities`** — see below |
| `missing_concept` | `missing_concept` |
| `why_it_matters` | `why_it_matters` |
| `candidate_evidence` | `candidate_evidence` |
| `confidence` | `confidence` |
| `recommended_data_location` | `recommended_data_location` |
| `impact` | `impact` |
| `autonomy_class` | `autonomy_class` |

`affected_entity` is the one that is not a new field, and deliberately. `AffectedEntity` is
already defined once in `agent/schemas/common.mjs` and carried by all eighteen contracts, so
that *"everything that touched `gdpr:art-3`"* is one query rather than eighteen. Adding a
singular field beside the array would be the second home this architecture exists to prevent.
Every gap carries at least one entry.

### The rules that carry the brief's two hardest instructions

- **A record whose evidence carries no `dataset_record` is refused.** "Do not reward
  quantity", enforced on the record rather than trusted to the agent that writes it.
- **`autonomy_class` may never be `autonomous`.** Closing a knowledge gap means writing a
  legal fact into `data/`, which is amber at best and red wherever it is a status, a date, an
  article number, a competence or a figure. There is no reading on which it is green.
- **`shape_exists: false` forces `human_only`.** Closing it needs a schema change, and
  `AGENT-ROLES.md` §4 is explicit that structural change is never Class B.
- **`absence_kind: no_rule_matched` forces `impact: reader_could_be_misled`.** §0.5, in the
  one place it could be got wrong.
- **`candidate_evidence[].retrieved` may never be true.** A document that was fetched and
  read produces a `VerificationRecord`; a gap standing on one is either closed or misfiled.
- **No field for the missing value, under any of six names.** An agent that has worked out
  what the absent article number probably is has fabricated a legal fact, and a gap record is
  the last place that should be able to carry one.

### `candidate_evidence` — the one risk in the contract

The brief names the field. `DataGap` deliberately calls its own version `candidate_leads`,
to keep the word *evidence* away from something that has established nothing. Both readings
are honoured: the field keeps the brief's name, every entry is a structured pointer carrying
`what_it_would_establish` and a `retrieved` flag the rules pin to false, and
`kind: 'none_identified'` exists so a gap with nowhere to look can say so rather than being
pushed into inventing a lead. **On this corpus some gaps genuinely have nowhere to look, and
the suite asserts that at least one says so** — a run in which every gap has a lead has
probably invented one.

## 8 · Impact, autonomy and confidence — three separate questions

**`impact` is about the absence, and is deliberately not `MATERIALITY_LEVELS`.** A change has
a before and an after and can be weighed by how far the value moved; an absence has neither.
What can be weighed is how a reader meets it:

| Level | Meaning |
|---|---|
| `representation_only` | The model is thinner than the corpus; nothing a reader sees changes. |
| `analysis_incomplete` | A view renders less than the corpus knows. |
| `reader_finds_nothing` | A reader looking for this finds nothing where the site's own structure implied something. |
| `reader_could_be_misled` | The absence is available to be read as a negative finding — the §0.5 failure. |

**`autonomy_class` is about what closing the gap would take.** A table in `agent/depth/rank.mjs`,
one row per kind, each with its reason, plus a one-way escalation where the recommended home
does not exist yet. Eleven kinds are `human_only`; two — `missing_instrument_relationship`
and `missing_glossary_concept` — are `review_required` because both acts, or the record being
explained, are already modelled and already cited. Neither is a licence: an agent may prepare
a `DataProposal`; a human approves it.

**`confidence` is how much the finding is standing on**, and never how much it matters. An
absence established by a lookup against the corpus cannot be wrong about the corpus (0.9). An
absence established by matching a pattern against a recorded title can be (0.6–0.7) — titles
are prose, two publications can share one, and no URL in this repository has ever been
fetched. The suite asserts the pattern-matched kinds score lower than the lookups, and that
impact and confidence have not collapsed into one number.

## 9 · Instrumentation

Every detector is a span (`depth.<kind>`) carrying `reported`, `set_aside` and `examined`.
Every suppression is an observation with the reason for each finding it covers. Every gap is
an artifact pointer. The ordering is a `decision` carrying the alternatives it did not take —
including *"order by the number of records affected"*, which is named on the trace as the
thing this agent refuses, so the refusal is checkable rather than a claim in a comment. The
run ends with a census observation.

`agent/observability/query.mjs#depthState` joins them **at read time**, and stores nothing
twice. It is exposed three ways:

```
node agent/observability/cli.mjs depth [--trace t] [--aside]
GET /api/depth[?trace=…]
the Data depth panel in agent/observability/viewer/
```

A run that set findings aside and recorded no reasons is reported as a **gap in the view**,
in the same way `traceChain` reports a missing approval: a suppression nobody can see is a
suppression nobody can check.

## 10 · What this agent does not do

1. **It does not modify canonical data.** There is no write path in `agent/depth/`; the suite
   scans every module for one and hashes `data/` around a full run.
2. **It does not propose.** A gap is a question. The answer is a `DataProposal` behind an
   `ApprovalRequest` — written by `agent/proposals/data/` since SESSION 12, never here — and
   the contract forbids the fields that would let a gap carry an edit.
3. **It has never read a document.** Every `candidate_evidence` entry is somewhere to look.
   This is the same blocking dependency every agent here has carried since SESSION 05.
4. **It does not read prose.** Two detectors read a *recorded string* — a source's title, an
   instrument's `sanction_ceiling` — and in both cases what is established is that the corpus
   wrote it down, never a fact about EU law. `AGENTS.md` is explicit that a false statement in
   `index.html` passes every check here, and this agent adds none.
5. **It cannot tell you what it did not look for.** Demand is not importance. An act nothing
   points at may be the most important omission in the corpus; the model cannot tell, which
   is why every run prints what it set aside rather than only what it found.

## 11 · One reconciliation, stated rather than resolved

`docs/AGENT-ROLES.md` §4 defines the **Data Depth role** as owning the *structure* of
`data/*.json` — schemas, ID discipline, referential integrity — producing structural changes
at Class C, together with the `tools/validate.mjs` checks that would police them.

**The agent built here is read-only, and does none of that.** It asks where a fact *would*
live and never puts one there; it emits no proposal; there is no write path in the directory.
That is what SESSION 11's brief required — *"do not directly modify canonical data"* — and it
is narrower than the role.

The two are not in conflict, but they are not the same thing, and the honest description is
that this agent occupies the **analysis half** of the role and leaves the **authoring half**
unbuilt. A future session that builds the authoring half should read §4 first, and should
note that it would be the first code in this repository that writes to `data/` on an agent's
initiative — which the whole approval chain exists to gate.

**SESSION 13 took the other half of the structural question, and it is a different agent.**
`agent/architect/` asks whether the *shape* can hold what the corpus is saying, and this
agent asks what *record* the corpus lacks. The boundary is one test —
**would writing a record close this?** — and it is a mechanism rather than an agreement:
every finding the architect's lenses produce declares `closes_by`, and one a record would
close is set aside and handed here rather than reported there. On the real corpus that
handoff fires. `docs/KNOWLEDGE-ARCHITECTURE.md` §1 states it from the other side; neither
agent may report the other's finding.

## 12 · Known limitations

1. **`missing_glossary_concept` produces the longest list — 17 of the 57.** The threshold is
   derived per kind from the glossary's own lowest-covered concept, which is the corpus's own
   standard rather than a chosen number, and the list is ranked. It is still the detector most
   likely to read as bulk, and the honest position is to say so rather than to tune the
   threshold until the number looks right.
2. **Demand is counted, not weighed by kind of harm.** A rule with an empty `obligations[]`
   is weighted above a glossary term, but those weights are for presentation order only. The
   contract forbids a numeric severity score for exactly this reason: the argument is in
   `why_it_matters`, where a reviewer can disagree with it.
3. **Two detectors depend on a title pattern.** `SUBORDINATE_RE` and the duplicate-title
   index both read prose somebody wrote. Both are narrowed by the source *type* the corpus
   recorded — which is what stopped a press release announcing a delegated act being reported
   as one — and both carry lower confidence with the reason stated.
4. **Superseded by SESSION 12.** This limitation read *"nothing consumes a `KnowledgeGap`
   yet"*. `agent/proposals/data/` now does — see `docs/GAP-PROPOSALS.md`. What it consumes
   them into is mostly a handoff rather than a proposal, and for the reason this whole
   document names: closing most of these gaps means writing a value read from a document, and
   nothing here has retrieved one. Of the 57 gaps, 14 become a proposal and 43 are routed to
   the Verifier, to Editorial or to the repository owner, each with its reason. *SESSION 14
   note: Editorial is now an agent (`agent/proposals/editorial/`, Agent 7) rather than only a
   role — and it authors no definition either, for the reason `docs/GAP-PROPOSALS.md` §4
   gives.*
5. **The scope filter is only as good as `scope_class`.** An act mis-classified as
   `scope:referenced` disappears from four detectors silently. The suppression is printed, so
   it is visible, but nothing here checks that a scope class is correct.
6. **The corpus can grow a dataset this agent will not look at.** The lens indexes ten
   datasets by name. A new one is invisible until somebody adds it — unlike the graph, which
   follows any field that holds an id. This is the one place the agent is less derived than
   the machinery it is built on.
