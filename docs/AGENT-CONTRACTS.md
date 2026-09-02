# Agent contracts

The interface between the agents this project has not built yet.

Nothing here is wired into the website. `agent/schemas/` is a development
subsystem: it adds no dependency, changes no page, and `tools/design-qa.mjs`
does not see it because that script reads only the root-level HTML, `css/` and
`js/`.

```
node agent/schemas/cli.mjs list
node agent/schemas/cli.mjs show EditorialProposal
node --test agent/schemas/selftest.mjs
```

---

## Where this sits in the governance layer

Read `docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md` and
`docs/AI-SAFE-BOUNDARIES.md` first; this document assumes them, and
`docs/OBSERVABILITY.md` alongside it, because the two layers are halves of one
thing.

**Observability records what happened. Contracts constrain what may be said.**
A trace can tell you that the Scout ran, called four tools and handed something
to the Verifier. It cannot tell you whether what it handed over distinguished a
retrieved fact from a plausible-sounding inference — because a trace records the
shape of an operation, not the epistemic status of its content. That is what
these contracts are for.

This layer is **green tier** under `docs/AI-SAFE-BOUNDARIES.md` §1: new tooling
and test scaffolding, additive, changing nothing the site asserts. It stays
inside the red-tier prohibition on architectural replacement — no framework, no
build step, no bundler, no dependency — which is also why no JSON Schema
validator is installed. See *Why not JSON Schema* below.

---

## Why this exists in this repository specifically

The site's argument is that a legal claim should carry its evidence, that a
grade should be derived rather than stored, and that a record should say what it
cannot support.

An agent handing another agent a record is the moment where that discipline is
easiest to lose. The receiving agent gets a blob. It cannot see which part was
read off a document, which part was concluded, which part is somebody's reading
of a provision, and which part is still open — unless the record was required to
say. And once the distinction is gone, it does not come back: three handoffs
later an interpretation is being rendered as law on a page a reader may act on.

So every contract here separates four states, and the validator makes them
separate rather than trusting an agent to:

| State | What it means | What the contract demands |
|---|---|---|
| **fact** | read from a source | at least one evidence reference that can bear it |
| **inference** | concluded from evidence | what it was concluded from, and by what method |
| **interpretation** | a reading of the material | whose reading it is, what it rests on, whether it is contested |
| **unresolved** | the record cannot support it | what is missing, which kind of absence, whether it blocks |

An empty `unresolved` array is not an omission; it is a claim that there is
nothing open, made explicitly so somebody can disagree with it.

---

## The fifteen

| Contract | Kind | Answers |
|---|---|---|
| `SourceCandidate` | finding | a document an agent found and has not verified |
| `VerificationRecord` | record | one statement, checked against one retrieved document, with a verdict |
| `ClaimEvidence` | link | how one source bears on one claim — the `supports` qualifier |
| `ChangeRecord` | record | a change actually made to this repository |
| `DataGap` | finding | something the corpus cannot support, named rather than filled |
| `ArchitectureProposal` | proposal | a change to how the system is built |
| `EditorialProposal` | proposal | a change to what the brief says |
| `UXProposal` | proposal | a change to how the site presents itself |
| `ImplementationProposal` | proposal | a change to the code |
| `QAResult` | result | what the checks actually said, against their baseline |
| `ApprovalRequest` | request | an agent asking a human to decide |
| `AgentObservation` | observation | a structured claim about the world, in handoff-safe form |
| `AgentRun` | run | an agent's own account of one execution |
| `WebsiteChange` | record | a change that reaches a reader, with its audit chain |
| `DataProposal` | proposal | a proposed factual modification to a record in `data/*.json` |

344 top-level fields — 1,116 counting every nested one — 63 forbidden fields
with their reasons, and 98 contract-specific cross-field rules, on top of the
generic identity, shape, epistemic, evidence and governance checks in
`validate.mjs`. Counted from `CONTRACT_LIST` rather than tallied by hand, so it
is reproducible: sum `Object.keys(c.fields).length` for the first figure and
`walkShape` for the second. *The figure this paragraph carried before SESSION 08
was 306 / 47 / 73, and it had been stale since SESSION 07 added nine fields and
six rules to `VerificationRecord` without updating it.*

**Amended in SESSION 05**, when the first real agent met them. `SourceCandidate`
gained `authority_class`, `duplicate_candidate_ids` and `confidence`; `DataGap`
gained the gap kind `retrieval_blocked`. Each change came with its tests in the
same commit, which is the rule these contracts set for themselves. What forced
each one is in `docs/SOURCE-SCOUT.md`.

**Amended again in SESSION 07**, when the Legal Verifier met them:
`VerificationRecord` gained nine fields, six cross-field rules and four
forbidden entries, and `conflict` was added to the verdict vocabulary. What
forced each one is in `docs/LEGAL-VERIFIER.md`.

**And extended by one in SESSION 08.** `DataProposal` is the fifteenth contract.
The four proposal contracts covered architecture, prose, interface and code; a
proposed change to `data/*.json` — attaching evidence to a claim, creating a
source record for a document that was read — had no home, and filing one as an
`ImplementationProposal` would have recorded a change to what the site says
about EU law as a change to a script. **This is a Class C change to the contract
layer and it is flagged as one.** The reasoning, and what was considered and
rejected, is in `docs/VERIFICATION-INTEGRATION.md`.

`CONTRACT_SCHEMA_VERSION` was **not** bumped, following the precedent SESSION 05
and SESSION 07 both set and recorded: the constant is global across every
contract, and bumping it would invalidate every fixture and every stored record
in the repository. Adding a contract invalidates nothing that already exists —
no record names `DataProposal` unless something wrote one — so the case for
bumping is weaker here than it was for either earlier amendment.

### The envelope

Every record, without exception:

```
contract · contract_version · agent · created_at
affected_entities · evidence · epistemic · trace_ref · simulated
```

`contract` is on the record itself so a record is **self-describing**: whoever
receives it can validate it without being told what it is. That is what makes
"no agent may bypass these contracts" checkable rather than aspirational — an
unrecognised contract name is refused, not skipped.

### The twelve, on every substantive proposal

`proposal_id · agent · created_at · affected_entities · reason · evidence ·
confidence · risk · autonomy_class · proposed_change · validation_requirements ·
rollback_plan`

Four of them come from the envelope; the suite asserts all twelve are present
and required on each of the five `*Proposal` contracts, however they got there.

The four proposals are the substantive ones. A `SourceCandidate` is a finding, a
`QAResult` is a measurement, an `ApprovalRequest` points at proposals rather than
being one — none of them proposes a change, and giving them a `rollback_plan`
would be ceremony rather than governance.

---

## Autonomy is checked, not declared

`autonomy_class` maps one-to-one onto the tiers in `docs/AI-SAFE-BOUNDARIES.md`:

| Class | Tier | Meaning |
|---|---|---|
| `autonomous` | green | the agent may act; the validators must pass afterwards |
| `review_required` | amber | the agent may prepare it; a human approves before it lands |
| `human_only` | red | the agent may propose only; a human authors the change |

The validator does not take the declaration at face value. It reads what the
record actually touches and refuses a class that is too low:

- any affected entity of a **legal-record kind** — instrument, provision, claim,
  source, enforcement action, timeline event, institution, competence,
  applicability rule, taxonomy term, brief part, prose — cannot be `autonomous`,
  because getting one wrong makes the site state something false;
- any affected entity whose path or field hits a **red target** —
  `js/format.js`, `js/pipeline.js`, `tools/_footer.mjs`, `claim_type`, a licence,
  the non-affiliation or no-legal-advice text, the README's known limitations —
  must be `human_only`;
- a **blocking** unresolved question forbids `autonomous` outright;
- an irreversible rollback plan forbids anything but `human_only`;
- a proposal touching `data/`, `js/`, `css/`, `i18n/`, `tools/` or any `.html`
  must name **all four validators** in its `validation_requirements`. AGENTS.md
  states that as a rule for humans; here it is a check.

---

## What the contracts refuse to hold

47 forbidden fields, each answered with the actual objection rather than
"unknown field". Three groups, and each is one of this repository's rules stated
as a schema:

**Derived facts.** `AgentRun` refuses `duration_ms`, `latency_ms`,
`total_tokens`, `total_cost_usd`, `span_count` and `degraded`; `ClaimEvidence`
refuses `grade`, `evidence_grade` and `tier`. All of them are computed at read
time — by `query.mjs` from the trace, by `js/format.js` from the corpus. A stored
copy is the second copy the whole architecture exists to prevent.

**Second homes.** `WebsiteChange` refuses `files`, because the file list lives on
the `ChangeRecord` it references. `ClaimEvidence` refuses `claim_type`, because
it lives in `data/claims.json` and is the highest-leverage field in the
repository. `AgentRun` refuses `trace_id`, which lives in `trace_ref` with the
span it belongs to.

**Substitutes.** `DataGap` refuses `substitute`, `best_guess`, `assumed_value`,
`plausible_value`, `likely_answer` and `default_value`. There is no field for a
plausible stand-in, because closing a gap with one is prohibited outright
(§0.2), and a schema that offers a slot for it is an invitation. An absence has
no default: `null` and `unknown` are states, not fallbacks.

Two more worth naming: `AgentObservation` refuses `message`, `level` and `log` —
an observation is not a log line, and there is no severity ladder here, only risk
and confidence — and `ApprovalRequest` refuses `auto_approve`, `self_approved`
and `assumed_granted`, with a rule that also refuses a decision whose
`decided_by` is the agent that requested it.

---

## `null`, `unknown`, and no rule at all

The distinction the datasets already keep is enforced field by field. A spec may
be `nullable`, `unknownable`, both or neither, and they are not the same
permission:

- a field set to `"unknown"` **must** have an `epistemic.unresolved` entry with
  `absence_kind: unknown_not_determinable`. Researched-and-not-publicly-
  determinable is a finding, and it is recorded as one;
- an unresolved entry claiming `null_not_researched` for a field that carries a
  value is refused — `null` means nobody looked;
- an unresolved entry claiming `unknown_not_determinable` for a field that is not
  `"unknown"` is refused;
- `no_rule_matched` is a third `absence_kind`, and `DataGap` refuses to record a
  `no_rule_matched` gap under any other. Where no applicability rule fires the
  answer is NOT DETERMINED, never "probably not".

---

## Evidence, and what it can carry

Every evidence reference states its `kind`, and `absent` is one of them. A record
that has nothing says so in its own body — the asterisk discipline of the running
text, applied to machine records — and an `absent` entry must be accompanied by
an open question.

The `supports` vocabulary is read from `data/taxonomy.json` rather than copied,
so a provenance judgment an agent makes is reconcilable with the bibliography
instead of needing a translation table. And `supports:context` behaves the way
the data model says it does: **a fact whose every cited source is `context` is
refused**, in `VerificationRecord`, in `ClaimEvidence`, and in the generic check
that applies to all fifteen. Context informs a claim without establishing it,
and is not a citation.

---

## The gate

`agent/schemas/gateway.mjs` is the only sanctioned way to pass a contract record
to anything else. `emit` validates and throws; `receive` validates and throws;
`handoff` validates every record in the set before any of them moves, because a
handoff is exactly where an invalid record would otherwise become somebody
else's problem. Neither has a flag that skips the check.

An agent that writes a record straight to a file has defeated nothing: the
receiving agent calls `receive`, and the record dies at that boundary rather
than three agents later in a website change nobody can explain.

**What reaches the trace is a pointer, not a copy** — the record's id, its
contract name, and a sha256 of its canonical form. Copying the body into the
trace would make the trace a second home for every fact the record carries. The
hash is what makes the pointer checkable: a record edited after it was emitted
no longer matches the trace that says what was handed over.

The single exception is an `ApprovalRequest`, which also emits the observability
layer's own `approval` event carrying the id and the state and nothing else.
That is still a pointer, and it is what puts a pending approval in front of a
human in the viewer. A pending approval nobody can see is the failure the
observability layer was built to prevent.

---

## Why not JSON Schema

The contracts are written as **data** — plain objects in `.mjs` modules, in this
repository's own field vocabulary — and JSON Schema is an **export**, derived on
demand by `node agent/schemas/cli.mjs export`. Three reasons, in order of weight:

1. **Validating JSON Schema needs a validator**, and a dependency is a red-tier
   prohibition. Writing the interpreter instead cost about 150 lines.
2. **JSON Schema cannot express most of what these contracts are for.** That a
   factual field must cite evidence capable of bearing it; that `"unknown"` is
   not `null`; that an autonomy class must match what the record touches; that a
   verdict of `confirmed` needs direct support. The export says so in its own
   `description`: passing it is necessary and not sufficient.
3. **A committed `.schema.json` would be a second home** for every field
   definition, and the first time somebody edited one and not the other, the two
   would disagree about what a contract is. The suite asserts no such file
   exists in the tree.

The `.mjs` modules stay machine-readable — every field carries its own `doc`,
kind, nullability and epistemic class, and `cli.mjs show` and the JSON Schema
export both read the same objects the validator does.

---

## Fixtures

One worked example per contract, in `fixtures.mjs`, used by the suite to assert
that each contract is satisfiable and by an agent author as a model of a
filled-in epistemic block.

**Every fixture is marked `simulated: true`, every URL is on `example.invalid`,
and `validate()` refuses a simulated record unless the caller explicitly asks for
one.** The observability layer took the same position for the same reason: under
§0.1, fixture data that reads as research would be a worse defect than having no
fixtures. The suite asserts the markers rather than trusting them — including
that no fixture cites a resolvable host.

---

## Files

```
agent/schemas/types.mjs         vocabularies; re-exports the trace vocabulary,
                                reads the site's from data/taxonomy.json
agent/schemas/fields.mjs        the field DSL and its interpreter
agent/schemas/common.mjs        the envelope, the evidence ref, the epistemic block,
                                the twelve proposal fields
agent/schemas/define.mjs        defineContract / defineProposal
agent/schemas/contracts/*.mjs   the fifteen, one per file
agent/schemas/registry.mjs      the registry a record's `contract` field resolves against
agent/schemas/validate.mjs      the gate: identity, shape, epistemic, governance
agent/schemas/gateway.mjs       emit / receive / handoff, and the trace pointer
agent/schemas/export.mjs        JSON Schema, derived on demand
agent/schemas/fixtures.mjs      one simulated example per contract
agent/schemas/cli.mjs           list · show · validate · export · fixture · check
agent/schemas/selftest.mjs      the suite
```

## Checks

```
node --test agent/schemas/selftest.mjs     # 86 tests
node agent/schemas/cli.mjs check           # every contract satisfiable by its fixture
node agent/schemas/cli.mjs validate <file> # exits 1 on an invalid record
```

The four validators in `tools/` are untouched by this layer, and their output is
unchanged from the `docs/CURRENT-ARCHITECTURE.md` §12 baseline.

## Known limitations

1. ~~**No agent implements these contracts**, because no agent exists.~~
   **Overtaken by events.** Three agents now do — the Source Scout (SESSION 05),
   the Legal Verifier (SESSION 07) and the verification integrator (SESSION 08)
   — and each one found the shape the contracts were missing, exactly as this
   note predicted. Every amendment above came from a real agent meeting them.
2. **The epistemic requirement is enforced on top-level fields only.** An
   epistemic annotation deeper inside a record — on an evidence reference's own
   title, say — describes that evidence rather than what the record asserts, and
   requiring a block entry for every one would bury the entries that matter. It
   is a judgment about legibility, and it is the check most likely to need
   revisiting.
3. **Only a handful of fields across the fifteen contracts are typed `factual`**, and few more are
   `inference` or `interpretation`; the rest are structural. That is
   correct — most fields are bookkeeping — but it means the epistemic machinery
   is exercised by a small number of fields, and a contract author adding a
   factual field has to remember to type it as one. The suite checks that every
   field declares a class, not that the class is right.
4. **The red-target list is matched as substrings** against an entity's path,
   field or id. It will catch `js/format.js:TIER_GRADE`; it will not catch a
   red-tier change described only in prose in the `reason` field.
5. **Cross-record references are checked only within a batch.** `validateBatch`
   reports what it cannot resolve rather than failing it, because the referenced
   record may legitimately live elsewhere — but nothing yet holds the store that
   would let it resolve.
6. ~~**Nothing stores contract records.**~~ **Closed in SESSION 05.** They live in
   `agent/records/<trace_id>.jsonl` — append-only, git-ignored, written through
   `agent/scout/store.mjs`, which validates on the way in and throws rather than
   accept an invalid one. It is deliberately not `data/`, which is the legal
   record and which nothing reaches without a human.
7. **The governance check keys off `affected_entities`**, which the contracts
   define as "what this record is about". For a record that only *reads* the
   things it names, those are not the same thing, and the check cannot tell them
   apart — so a read-only `AgentRun` records no affected entities in order to
   claim the autonomy it actually has. The distinction between "about" and
   "changes" is not in the contract, and probably should be.
8. **`AgentObservation` and the tracer's `observe()` overlap.** The contract is the
   handoff-safe form and carries the epistemic block the trace record does not;
   an agent emitting both writes the summary twice. Whether the trace record
   should become a pointer too is unresolved.
