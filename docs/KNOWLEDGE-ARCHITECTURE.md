# Knowledge architecture — Agent 6

**What it is.** `agent/architect/` asks whether the information model can
represent what this corpus is already trying to say. It answers eight questions
of the taxonomy, the entities, the relationships, the canonical datasets, the
derivation logic, the comparison dimensions, the applicability model, the
institutional model, the timeline, the enforcement model and the page
architecture — and its output is `ArchitectureProposal` records, each behind a
pending `ApprovalRequest`. It changes no schema, drafts no shape, and writes
nothing to `data/`.

**It is the sixth agent, not the fifth.** SESSION 12 built `agent/proposals/data/`
— the gap router — and the brief's numbering predates it.

---

## 1 · The question, and the one it is not

`agent/depth/` asks **what knowledge is missing from the corpus** and answers
with a `KnowledgeGap`: a competence nobody has recorded, an act with no
provisions, a status nobody has dated. Every one of those closes when a person
writes the value into a shape that already exists.

This agent asks **whether the shape exists at all**. The two questions are easy
to answer by accident with each other, and doing so would produce a second Data
Depth Agent under a new name — the second home this architecture exists to
prevent, arriving as an agent rather than as a field.

**One test separates them, and it is a mechanism rather than an intention:**

> Would writing a record close this?

Yes → it is Data Depth's, and this agent sets it aside and hands it on.
No → the shape itself is missing or cannot hold what the corpus is saying, and
that is an architecture finding.

`agent/architect/boundary.mjs` is that test. Every finding a lens produces must
declare `closes_by: 'record' | 'shape'`; one that declares neither is refused
rather than guessed at, because an unstated boundary is how one agent's job
quietly becomes another's. On the real corpus the boundary fires: **2 of the 29
findings are handed to `agent/depth/` rather than reported here.**

## 2 · What it may stand on

**Nothing this agent reports may rest on anything anybody knows about EU law.**
That is the constraint the whole design turns on, and it is enforced three ways:

- Every structure in `model.mjs` is **read from the files in this repository** —
  the containers are the arrays that are actually there, the vocabularies are
  the ones `data/taxonomy.json` actually declares, the modules are the ones in
  `js/`. Nothing is declared in the abstract.
- Every finding carries `demand`: **the records that are, today, saying
  something the missing shape would hold.** An empty demand is set aside as a
  design opinion, because "the model could also represent X" is an opinion about
  EU law and nothing here has read a document that would support one.
- Every proposal's evidence is `dataset_record`, quoted, from a named file.
  `boundary.mjs#evidenceProblems` refuses a `retrieved_document` entry rather
  than trusting the lens, and the suite asserts no proposal carries one — no
  agent in this repository has ever retrieved a document, and a proposal citing
  one would be a fabrication with a URL on it.

`index.html` is read as **markup** — which pages exist, which modules they load,
how large the inlined blob is — and never as sentences. What the brief argues is
the author's.

## 3 · The central refusal: it names a shape and drafts none

**Every operation on every proposal carries a null `proposed`.** The agent says
a shape cannot hold what the corpus is saying, names the decision that follows,
and stops. Drafting the replacement would be an agent deciding what a production
site about EU law is able to express — and the suite asserts the null on every
operation of every proposal.

Two things follow from it. Every proposal is `human_only`: structural change is
never Class B (`docs/AGENT-ROLES.md` §4), and `boundary.mjs` only ever reports
what no record can close. And where a finding's answer is a **taxonomy term**
rather than a shape, it is routed to `agent/proposals/data/` — proposing a term
is `DataProposal`'s `create_taxonomy_term`, with the search that could have
stopped it, and SESSION 12 already owns that burden.

**No nineteenth contract.** `ArchitectureProposal` has existed since SESSION 04
and its burden — `modules_affected`, `invariants_touched`, `dependency_impact`,
the three red-tier booleans, a migration, validation requirements, a rollback
plan — is exactly the burden a change to the information model carries. Adding a
contract because a new agent exists would be the second home this architecture
is built to prevent.

## 4 · The eight lenses

One per question the brief asks, in the brief's order. Each reports what it
**examined** as well as what it found, so "looked and found nothing" is never
confusable with "did not look".

| # | Question | The rule, derived from the corpus |
|---|---|---|
| 1 | Are entity types missing? | An object-valued field with no `id`, ≥3 sub-fields, on ≥2 records, carrying a **date-named** sub-field. The date test is what keeps `instruments[].dna` out: a comparison slot has no date because it is not a thing that happened. |
| 2 | Are relationship types missing? | A `relationship_kind` term whose bare word — or its passive inverse — is also a populated field on a container that already has an edge container. Also: a declared kind no edge uses (routed, not reported). |
| 3 | Are datasets duplicating concepts? | An **array literal** in `js/` whose members are a taxonomy dimension's terms; and a dataset no module asks `js/data.js` to load. |
| 4 | Is the data model too coarse? | One concept stored as a scalar in one place and as an object in another, using a **nested** field census so a field inside an object is visible. |
| 5 | Are facts forced into prose? | A prose field naming a record the corpus holds, **on a record that does not reference it anywhere else**. That exclusion is what took the lens from 32 findings to 10. |
| 6 | Are comparison dimensions missing? | The `dna_dimension` vocabulary compared against the keys the `dna` object actually stores. |
| 7 | Are regulatory relationships under-modelled? | A **structural** field (present on every edge) whose value is constant per `kind` — a property of the word, stored once per edge. |
| 8 | Is versioning sufficient? | Whether any container anywhere holds a prior value, against how many records carry a verification date. |

Two rules in that table are exclusions rather than detections, and each removed
a class of false finding. **A dispatch is not a copy** (lens 3): `js/format.js`
branches on three of the four `date_precision` terms and falls through on the
fourth, and a renderer has to handle each value of an enum individually whatever
the vocabulary lives in. Only a *list*, which decides what is enumerated, is a
second home. **An annotation is not a shape** (lens 7): `requires_verification`
sits on 1 of the 17 edges and is a per-record provenance flag; `symmetric` sits
on all 17. The count decides, not a list of exceptions.

## 5 · What it found, against the real corpus

**8 of 8 questions answered yes · 20 proposals · 9 findings set aside · 960
things examined**, as at 3 September 2026. The four that carry the most:

1. **`data/instruments.json` `relationships[].symmetric` — and it has already
   diverged.** Whether a relationship kind reads the same way in both directions
   is a fact about the *word*, and it is stored 17 times for 8 kinds.
   `rel-kind:complement` is stored as **both `true` and `false`**; nothing in
   `tools/validate.mjs` checks it; and `js/interactions.js` draws the arrow from
   the per-edge value — so the same relationship kind renders one way on one
   pair and another way on another, from data alone. The only high-risk finding
   whose copies have already disagreed on a production page.
2. **`data/taxonomy.json` `dna_dimension` and the `dna` object disagree in both
   directions.** The taxonomy declares 11 dimensions; the records store 9 keys;
   4 declared terms are stored by nothing (`obligations`, `authority`,
   `sanction`, `key_dates`) and 2 stored keys are declared by nothing
   (`obligation_anchor`, `sanction_ceiling`). The vocabulary is stored as object
   *keys*, and no validator compares a key against the enum authority. Two of
   the four unused terms are derived at render time, which is correct — and the
   model cannot currently tell that case from the other two.
3. **`js/dna.js` holds a complete second copy of that vocabulary.**
   `DIMENSIONS` lists all eleven terms as bare strings and decides what rows the
   comparison table has, so adding a term to the enum authority adds no row.
4. **`data/sources.json` has no way to say which instrument a source is about.**
   21 source records name one in `note`, in prose, and the container carries no
   reference field for it — so the reference is invisible to `validate.mjs`, to
   the dependency walk, and to a reader filtering by instrument.

And one that is not new but is now measured rather than restated:
`data/brief.json` is fetched by **nothing** — no module names it to
`js/data.js`; `js/shell.js`'s `id: 'brief'` is a nav id — while `index.html`
inlines 60,156 bytes of the same content. The proposal states the shape of the
problem and explicitly does not reconcile it: which text is right is an
editorial decision, and the handover has said "do not fix this on your own
initiative" since SESSION 08.

## 6 · Observability

The reasoning is the deliverable, and it is on the trace. Every lens is a span
(`architect.<lens>`) carrying what it examined, found, reported and set aside;
each of the **eight answers is its own observation**, with the answer as a word
rather than as a count; every set-aside is an observation with its reason and
the agent it belongs to, and the ones with an owner are handed on so a finding
this agent cannot act on is a queue entry rather than a sentence in a log; every
proposal and approval is an artifact pointer; the ordering is a decision with
three recorded alternatives; and the run closes with a census and a
`NOTHING MERGED` observation carrying `schemas_changed: 0` and
`values_proposed: 0`.

`architectureState()` in `agent/observability/query.mjs` derives the view at read
time and stores nothing twice, exposed as `cli.mjs architecture [--aside]`,
`GET /api/architecture`, and the **Knowledge architecture** panel in the viewer.
The panel leads with the eight answers rather than the proposal count, and the
overview tile counts **the questions the model handles** — a tile counting only
the defects would report the information model as nothing but them.

The view reports a **gap in itself** where the run failed to say something: no
census, no ordering decision, no "nothing merged" claim, a lens that recorded no
answer, findings set aside with no reasons, or more proposals than approvals.
The suite proves that check does something by stripping the `NOT REPORTED`
observations from a real run's trace and asserting the view notices.

**Cross-agent linkage is populated, not optional.** `--gaps <depth-trace>` chains
a Data Depth run in: the CLI reads the upstream run off the records' own
`trace_ref`, passes it to the tracer as `parent_run_id`, and records the handoff
on the upstream trace. That is SESSION 13's Phase 0 working, in the session that
depended on it. The gaps are used for exactly one thing — noting that a shape
finding and a record finding sit on the same part of the corpus — and never to
create a finding: **a missing record is not a missing shape**, and the suite
asserts that chaining a gap in changes no finding.

## 7 · Nothing is merged, and the run can prove it

Six independent things, not one:

- every proposal carries an `ApprovalRequest` in the `requested` state at tier
  `red`, and `ApprovalRequest` refuses a decision whose `decided_by` is the
  requesting agent;
- every operation's `proposed` is `null`, so there is no shape to apply;
- every proposal is `human_only`, and the contract independently forces that for
  anything touching a named invariant;
- the run emits `NOTHING MERGED` with `applied: 0`, `merged: 0`,
  `schemas_changed: 0`, `values_proposed: 0` and `data_dir_written: false`, and
  the read model reports a gap in the view where it is missing;
- the CLI hashes the whole of `data/` before and after and prints which;
- `selftest.mjs` scans every module in the directory for a write call.

## 8 · Files

```
agent/architect/model.mjs      the information model, read as a structure
agent/architect/lenses.mjs     the eight questions, as code
agent/architect/boundary.mjs   what makes a finding this agent's
agent/architect/architect.mjs  Agent 6
agent/architect/cli.mjs        the terminal report
agent/architect/selftest.mjs   52 tests, against the real data/
```

## 9 · Known limitations

1. **Every finding is about the SHAPE, and this agent cannot tell a defect from
   a deliberate simplification.** It establishes that the corpus is doing
   something a shape cannot hold; whether that is worth resolving is a design
   judgement about a production site, and every proposal says so as an
   attributed interpretation rather than as a finding.
2. **Question 5 is the loosest of the eight.** It matches names whole-word
   against prose, and a citation inside a sentence ("an Article 102 TFEU
   decision") counts as a name with no reference. The demand floor of two keeps
   a single occurrence out; it does not make the lens precise.
3. **The concept table for question 4 is stated, not derived.** Whether
   `fine_eur` and `sanction_ceiling` are the same concept is a judgement, and it
   lives in one visible table (`CONCEPT_OF_FIELD`) rather than being inferred
   from field names. A concept nobody has added to that table is invisible to
   the lens.
4. **No lens answered "no" on this corpus**, so the "looked and found nothing"
   path is exercised by the suite rather than by the data. The distinction is
   real and carried through the whole view; it has simply not been needed yet.
5. **A proposal is not a plan.** The migration section states the *order* a
   change would have to run in, because the intermediate state is where this
   kind of change breaks — it does not state the change.
6. **Nothing decides these twenty.** They join the fourteen from SESSION 12
   behind pending approvals, and every re-run regenerates them. Stable ids
   (Phase 0) make it possible to tell a re-proposed finding from a new one; the
   `ChangeRecord` that would say a human decided one is still missing.
