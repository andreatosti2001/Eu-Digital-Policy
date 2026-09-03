# GAP PROPOSALS

**Agent 5, built in SESSION 12.** What each identified knowledge gap can honestly become —
and, for most of them, why the answer is not a proposal.

**Read with:** `docs/DATA-DEPTH.md` (the gaps this consumes), `docs/AGENT-CONTRACTS.md` (the
eighteen contracts), `docs/AI-SAFE-BOUNDARIES.md` (the tiers and the two absolute
prohibitions), `docs/AGENT-ROLES.md` §2, §4 and §6 (Verifier, Data Depth, Editorial) and its
handoff rules H2 and H6.

**Code:** `agent/proposals/data/`. **Contracts:** `DataProposal`, `ApprovalRequest`,
`DataGap` — no new one. **Run:** `node agent/proposals/data/cli.mjs --as-of YYYY-MM-DD`.

---

## 1 · The session's instruction, and the thing that makes it hard

> Extend Data Depth so that each identified gap can become a structured proposal. If a new
> taxonomy term appears necessary, create a taxonomy proposal; do not silently create it. If
> a proposed item is interpretive, route it to Editorial. If evidence is inadequate, route it
> to Verifier. **Do not merge any substantive additions automatically.**

`agent/depth/` ends at a finding in front of a human. `docs/DATA-DEPTH.md` §12 records that
as a known limitation — *"Nothing consumes a `KnowledgeGap` yet"* — and the SESSION 11
handover names closing that loop as the next objective. This is the half that consumes one.

The difficulty is not the plumbing. It is that **closing a knowledge gap means writing the
value the corpus lacks**, and for eleven of the thirteen kinds that value is an article
number, a date, a competence, a fine or a status — read from a document, and **no agent in
this repository has ever retrieved one.** An agent that authored those proposals would be
fabricating a legal fact (§0.1) or attaching a plausible substitute (§0.2), which are this
project's two absolute prohibitions.

So the run asks two questions per gap and keeps them apart:

| | |
|---|---|
| **Who can act next** | the route |
| **What can be authored now** | a proposal, or a refusal with its reason |

Conflating them is the failure mode. A proposal whose operation has no proposed value is not
a proposal; one with a value nobody read is a fabrication. There is no third option, and the
run records that on its trace as the alternative it refused.

## 2 · The five routes

| Route | Recipient | Authored here | On this corpus |
|---|---|---|---|
| `data_proposal` | a human, through an `ApprovalRequest` | `DataProposal` (`annotate`) | **13** |
| `taxonomy_proposal` | a human, through an `ApprovalRequest` | `DataProposal` (`create_taxonomy_term`) | **1** |
| `editorial` | Editorial | nothing — a handoff carrying the gap | 21 |
| `verifier` | the Legal Verifier | `DataGap` + a handoff | 21 |
| `owner_decision` | the repository owner | nothing — a stated refusal | 1 |

Three of the five are the brief's own; `data_proposal` is the one that does the session's
work, and `owner_decision` is the one the brief does not name and that has to exist —
`stale_record`'s recommended home is a field no dataset has, across all ten of them, which is
not a taxonomy term, not an interpretation and not a document anybody could read.

**The route comes from a stated table**, one row per gap kind, each with its reason, in
`agent/proposals/data/route.mjs`. A kind with no row throws at module load, for the reason
`agent/detector/classify.mjs` gives for the transition table: a reviewer can read every case
the code claims to know about, and a case it does not know about is a blank rather than a
fall-through to a default.

**Two overrides, and both are one-way.** Neither can promote a gap into a proposal its kind
did not already allow, and the suite asserts it:

- `shape_exists: false` → the home does not exist, so there is no field to write into →
  `owner_decision` (unless the route is already the one that proposes the missing vocabulary).
- no annotatable record → the gap is that a record is *absent*, and creating it means
  authoring a decision → `verifier`.

## 3 · The one edit this repository can author with an empty hand

A note, on a record that already exists, stating something about **this corpus** rather than
about EU law.

That is not a consolation prize. `unsupported_claim` is the sharpest case: seven claims typed
`claim-type:law` rest on the brief citing itself, and *other records are built on them*. The
evidence grade already renders as unresolved, which is honest — what nothing in `data/`
records is that the unresolved grade is **load-bearing**. SESSION 11 established it and had
nowhere to put it. The note is where it goes:

> The tier structure is verified. The Commission's specific position statement is not
> separately sourced. **Load-bearing: 3 record(s) in this corpus rest on this claim
> (ap-ai-act-01, ap-ai-act-04, ai-act:art-6), and no source outside this site directly
> supports it. Recorded from the corpus by the depth analysis of 2026-09-02; nothing here has
> read a document.**

Four things hold this open door to a narrow width.

**The text is composed, not written.** `annotate.mjs#noteFor` is a pure function of ids and
counts read off the gap's own evidence array, plus fixed English. `selftest.mjs` recomputes
every note a run emitted and asserts it is character-identical, so there is no path by which
a sentence an agent composed freely reaches a production page. Every clause is checkable by
opening a file in this repository.

**The container must already use the field, and that is asked of the corpus rather than
declared.** A first draft carried a table of which datasets have a `verification_note`; it
disagreed with `data/` within the hour, because an instrument carries no note and a
relationship in the same file does. So the question is asked of the array the record actually
sits in. Where no sibling uses the field, adding it is a schema change, and structural change
is never Class B.

**An existing note is kept in full and added to.** `PROVENANCE_DISPOSITIONS` has no word for
removing one, because writing over a `verification_note` is red tier (§3). The disposition is
`extended`, or `set_first_time` where the field was null — and the contract refuses
`set_first_time` on a field that already carries something.

**And the note is visible to a reader.** `js/evidence.js`, `js/applies.js`,
`js/enforcement-page.js` and `js/calendar.js` all render `verification_note`. That is why
this is `review_required` and approval-gated rather than green, and why the text is composed
rather than written.

## 4 · A taxonomy term is proposed, never created

The corpus holds `src-eurlex-ai-omnibus` and `src-eli-ai-omnibus-2026-1744` as two records
for one document, and has no way to say so. Before any record can say it, the vocabulary
needs a word for it — and `data/taxonomy.json`'s `relationship_kind` dimension has ten terms,
every one of which characterises how two **acts** relate.

"Do not silently create it" is the easy half; nothing here writes to `data/`. The hard half is
**"appears necessary"**, because an agent that decided a term was needed without looking would
propose a second word for something the vocabulary already says — and a duplicate in the enum
authority does not announce itself, it quietly becomes a second home for a distinction that
already had one.

So the search is the proposal's burden, and it reuses `DataProposal.existing_search`
unchanged — the same field `create_source` fills, checked by the same rules, because "find the
record that is already there" is the same discipline whether the record is a document or a
word. Token overlap over each term's id, label and note ranks the candidates; a **decisive-word
test** settles whether any of them *is* the concept. A ranking alone would eventually score a
near-neighbour high enough to look like a match. **The suite asks the search about a concept
the dimension does carry** (`rel-kind:repeals`) and asserts it finds it: a search that could
never come back empty-handed is not a search.

What is proposed is an id and a label. **The definition is not proposed** — a taxonomy term's
definition is the site's own words about a concept, and writing those is Editorial's. And the
proposal says in its own scope note that it does **not** create the shape that would use the
term: `data/sources.json` has no `relationships[]` array, and that is a separate structural
decision for the repository owner. The term and the shape are deliberately not bundled.

### The nineteenth contract that was not added

`create_taxonomy_term` is a new **kind** in `DATA_OPERATION_KINDS`, not a new contract.
`amend_field` would have been a lie — a term is not a field on an existing record, and filing
it as one would put a change to the enum authority into the same shape as a corrected date. A
nineteenth contract would have been worse: the burden a taxonomy term carries *is*
`DataProposal`'s burden — find the existing one first, keep the id, never merge automatically
— and a second contract would have been a second set of rules about the same thing. Four
rules carry the instruction instead:

- the dataset must be `data/taxonomy.json`, and the record kind `taxonomy_term`;
- the dimension named in the operation's target must be one the file actually carries, read
  from the file rather than listed in the contract;
- `autonomy_class` is **forced** to `human_only` rather than checked against what the agent
  claimed — everywhere else in this contract the agent states a class and a rule refuses one
  that is too low; here the answer does not depend on the proposal at all;
- the find-it-first search applies unchanged, because the kind is in `CREATE_KINDS`.

## 5 · What the other three routes hand on

**Verifier.** The gap is restated as the evidence question the routing established, on
`DataGap` — the contract whose whole purpose is *"what would close it: the publication to
find"*. This is not a conversion of a `KnowledgeGap` into a `DataGap`; the registry keeps
those apart on purpose (representation versus evidence) and they stay apart. It is the
sub-question. Which `DataGap` kind it becomes is a three-row table with no fall-through:
`no_rule_matched` where no rule fires, `missing_source` where the gap points at no document at
all, `coverage_gap` otherwise. **Uncertainty survives the handoff at full strength** (H2): the
gap's own open questions are carried onto the record rather than summarised, and the suite
asserts the receiving record carries *more* of them than the one it came from.

**A `DataGap` with no lead says so.** On this corpus two of them genuinely have nowhere to
look, and the suite asserts that at least one does — a run in which every gap had a lead has
probably invented one.

**Editorial.** Nothing is authored, and that is the finding. An `EditorialProposal`'s
operations would have to carry the sentence, and the sentence is the argument — which is the
author's. `agent/depth/rank.mjs` already says a glossary definition is editorial work; a
characterisation of how two acts meet is a legal reading. The gap is handed on with the reason
and the run counts it as refused. A refusal is a valid deliverable and is passed on intact
(H6).

**The repository owner.** `stale_record` asks what `last_verified` means across ten datasets.
That is a schema decision with the widest reach in the corpus, and `docs/AGENT-ROLES.md` §4 is
explicit that structural change is never Class B. No handoff, because the recipient is not an
agent — which is exactly why that route authors nothing.

## 6 · Nothing is merged, and the run can prove it

- Every proposal is emitted with an `ApprovalRequest` in the `requested` state. Pending is
  never granted, and `ApprovalRequest` refuses a decision whose `decided_by` is the requesting
  agent.
- `DataProposal` forbids `auto_merge`, `apply_automatically`, `merge_on_approval`, `merged`
  and `applied` by name, and the suite asserts no record carries one.
- `substantive: true` forces `human_only` — and no proposal this agent authors is substantive,
  because the only value it writes is a note about the corpus.
- The run emits a `NOTHING MERGED` observation carrying `applied: 0` and
  `data_dir_written: false`, and the read model reports a **gap in the view** where that
  observation is missing.
- The CLI hashes the whole of `data/` before and after and says which.
- `selftest.mjs` scans every module in the directory for a write call.

## 7 · Instrumentation

Every route is a span (`propose.<route>`) carrying `gaps`, `proposals`, `approvals`,
`data_gaps` and `refused`. Every refusal is an observation with the gap it covers and the
reason. Every proposal, approval and data gap is an artifact pointer. Every handoff is an
edge. The routing is a `decision` carrying the alternatives it did not take — including
*"author a DataProposal for every gap, leaving the value blank for a human to fill"*, which is
named on the trace as the thing this agent refuses, so the refusal is checkable rather than a
claim in a comment. The run ends with a census and the nothing-merged observation.

`agent/observability/query.mjs#proposalState` joins them **at read time** and stores nothing
twice. It is exposed three ways:

```
node agent/observability/cli.mjs proposals [--trace t] [--refused]
GET /api/proposals[?trace=…]
the Gap proposals panel in agent/observability/viewer/
```

Four states are reported as gaps in the view rather than smoothed over: a missing census, a
missing routing decision, a missing nothing-merged claim, and — the one that matters most —
**a proposal with no approval request**, which is an unapproved change that looks approved.

## 8 · What this agent does not do

1. **It does not modify canonical data**, and it does not merge. There is no write path in
   `agent/proposals/data/`.
2. **It does not close a gap.** Every proposal's scope note says so explicitly: adding a note
   does not narrow the gap by one word.
3. **It has never read a document**, so it never authors a value. Where a value is needed the
   gap goes to the Verifier, and the Verifier is blocked on the same dependency every agent
   here has carried since SESSION 05.
4. **It does not write the argument.** Interpretive items are handed to Editorial with nothing
   attached.
5. **It cannot tell you whether a gap is worth closing.** It can tell you who could close it
   and what it would take. Demand is not importance — `docs/DATA-DEPTH.md` §10 — and routing
   does not add a judgement the depth analysis could not make.
6. **It does not propose a SHAPE.** `create_taxonomy_term` proposes a *word* into a dimension
   that already exists; a dimension that does not, or a container, or a field, is
   `agent/architect/`'s and comes back as an `ArchitectureProposal`. SESSION 12's unresolved
   issue 13 was exactly that split — `prop-taxonomy-*` proposed the missing word for
   `data/sources.json` and deliberately left the shape open — and SESSION 13 built the agent
   that asks the other half. Neither may do the other's job: the architect routes a finding
   whose answer is a term to here, and this agent proposes no container.

## 9 · Known limitations

1. **Fourteen proposals out of fifty-seven gaps, and thirteen of the fourteen are notes.** The
   honest description of this session's output is that it made two absences visible on
   production pages and proposed one word. Everything else is a handoff. That ratio is the
   retrieval dependency, not a design that could be tuned.
2. **The note is composed from a template, and a template cannot be right about everything.**
   Two gap kinds have a composer. A third that needed one would need a new template reviewed
   as carefully as this pair — adding one is a visible change to `NOTE_FOR_KIND`, not a
   parameter.
3. **The taxonomy search reads strings.** Token overlap and a decisive-word list are weak
   methods over prose somebody wrote, which is why the proposal is `human_only`, why the
   ranking score is stated as being on the matcher's own scale, and why `why_not_that_one` is
   written out rather than left as a number.
4. **The editorial route produces nothing an Editorial agent could execute.** *Half
   superseded by SESSION 14: `agent/proposals/editorial/` (Agent 7) now exists.* The
   limitation stands anyway, and for a reason worth keeping: that agent writes no sentence
   either. It corrects a value inside a sentence that already exists and refuses to author
   one, so an interpretive gap — a missing glossary definition, an uncharacterised
   relationship between two acts — is still handed to a role, and the role is still a human.
   The handoff now has a named recipient that can receive it and will decline it for the same
   reason this route sends it.
5. **Nothing consumes a `DataProposal` yet.** The chain now runs gap → proposal → approval and
   stops there. The half that is still missing is the one that *applies* an approved proposal
   and records that a human did — which is the only code in this repository that would ever
   write to `data/` on an agent's initiative.
6. **A second run proposes the same notes again.** There is no record that a human applied
   one, so nothing here can tell a proposal that was accepted from one that was never looked
   at. The SESSION 11 handover named exactly this as what closing the loop actually needs, and
   this session did not build it.
