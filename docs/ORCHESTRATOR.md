# The Master Orchestrator

**Status:** the reference document for `agent/orchestrator/`. SESSION 22.
**Reference for:** the ten workflow types, the five end states, the capability register,
the eight routing checks, conflict detection, human-review routing, and the boundary
between this and the Control Room.

`docs/HANDOVER.md` is the session record; this is the description of the thing.

---

## 1 · What it is, and the sentence it is built around

The twelfth thing in `agent/`, and the first whose subject is the other eleven. It
receives events, identifies the workflow, selects the specialists, preserves the state,
enforces the handoffs and the autonomy boundary, collects the observations, detects the
conflicts, routes to a person, keeps the provenance, and exposes the whole of it to the
private Control Room.

> **The Master Orchestrator coordinates specialist agents. It MUST NOT replace their
> domain reasoning.** — the governance protocol, §14

So there is no legal reasoning here, no editorial judgement, no evidence assessment and no
verdict. It never reads a source, never grades evidence, never decides whether a claim is
supported, and never edits a record a specialist handed it. What it reasons about is
**routing** — which is why every gate it runs is mechanical, and why it *refuses* a record
rather than repairing one. A coordinator that repaired its specialists' output would be a
thirteenth specialist, unaccountable to any of the contracts the other twelve are bound by.

**`docs/AGENT-ROLES.md` §9 has described the Orchestrator role since SESSION 01.** This
fills the enforcing half of it. The *never* list there is unchanged and binds this agent:
it may not let one agent both scout and verify the same fact, may not downgrade a change's
class to avoid an approval, may not merge a Class C change on its own authority, may not
proceed past a contradiction by picking the more convenient answer, and may not present
partial completion as completion.

---

## 2 · The lifecycle, and where this sits in it

```
OBSERVE → DISCOVER → VERIFY → CLASSIFY → PROPOSE → PRIORITIZE
        → HUMAN DECISION → AUTHORIZE → IMPLEMENT → VALIDATE
        → DEPLOY → OBSERVE → LEARN
```

The Orchestrator owns the arrows, not the boxes. Every box is a specialist's, and the
protocol's rule that "no stage may silently perform the responsibilities of another stage"
is enforced here by the stage kinds: a `dispatch` is a specialist's own work, a `gate` is
the Orchestrator's, and a `human` stage is neither.

---

## 3 · The ten workflow types

Declared as **data** in `agent/orchestrator/workflows.mjs`, for the same reason
`.control-room/server.mjs` declares its route table as data: a table can be asserted
against, and a workflow implemented as a function is a workflow whose shape nobody can
check.

| Type | What opens it | The shape |
|---|---|---|
| `NEW_SOURCE` | a candidate nobody has read against the record it bears on | verify → integrate → provenance → conflict → **person** |
| `VERIFICATION_REQUIRED` | a record asserting something no source has been read for | scout → verify → integrate → provenance → **person** |
| `LEGAL_CHANGE` | the world moved past the record | detect → verify → assess impact → editorial impact → conflict → **person** |
| `DATA_GAP` | a value exists and is unsupported, or is missing | assess → route → provenance → **person** |
| `ARCHITECTURE_GAP` | the model has no place for a concept | model → conflict → **person** |
| `EDITORIAL_IMPACT` | the prose may now say what the data no longer supports | read → provenance → **person** |
| `UX_FINDING` | the interface fails somebody | audit → measure *(optional)* → **person** |
| `IMPLEMENTATION_REQUEST` | a proposal is to be implemented | approval → scope → autonomy → rollback → implement → browser QA *(by scope)* → **person** |
| `QA_FAILURE` | a check came back worse than the baseline | assess → rollback → **person** |
| `POST_DEPLOYMENT_EVENT` | something was observed after a change reached the tree | measure → browser check *(optional)* → **person** |

**Every one ends at a human stage, and the module refuses to load one that does not.**
Protocol §26 puts the first real-world cycle in OBSERVE + PROPOSE ONLY, and §20 restricts
autonomous production action to explicitly approved low-risk categories — of which this
repository approves none (§7 below).

**Five types can reach `completed`** without a person: `VERIFICATION_REQUIRED`, `DATA_GAP`,
`EDITORIAL_IMPACT`, `UX_FINDING` and `POST_DEPLOYMENT_EVENT` declare
`completes_without_human: 'only_if_nothing_proposed'`. A measurement that found nothing is
finished, and putting an empty item in front of a reviewer teaches them to stop reading the
queue. Everything that produced a proposal goes to a person.

### What POST_DEPLOYMENT_EVENT cannot see, said in its own declaration

**The deployed origin has never been fetched.** Nothing in this repository performs network
I/O against the live site: `tools/freshness.mjs` prints a `SOURCE REACHABILITY` heading and
makes no request (`docs/AUDIT-2026-09-01.md` F-12), and no Control Room instance has ever
been reached (`docs/CONTROL-ROOM.md` §11). A `POST_DEPLOYMENT_EVENT` here is an observation
about the **repository** and about a locally served render. The type carries that as a
`cannot_see` field so that a future session wiring real telemetry adds a capability rather
than discovering the type was lying.

## 4 · The five end states

| State | What it means |
|---|---|
| `completed` | the workflow did everything it was for. It does **not** mean anything was published: no workflow here publishes. |
| `rejected` | a person decided against it. Not a failure, and not unresolved. |
| `unresolved` | the work ran and could not settle the question. A valid deliverable (H6), never softened into `completed`. |
| `human_review_required` | it reached the point where a person has to decide, and stopped. Waiting, not finished. |
| `failed` | the machinery broke — a dispatch threw, a record would not validate. A defect in the system, not a finding about the world. |

**Terminal means terminal.** `transition()` refuses to leave any of the five, and that has
a consequence worth stating: a workflow parked for a person is *finished*, and the decision
that follows opens a **new** workflow — an `IMPLEMENTATION_REQUEST`, carried by a governed
event, re-deriving the approval from the ledger. Resuming a parked workflow when a decision
arrives would make the workflow the home of the approval, and the approval already has one.

---

## 5 · Classification, and the refusal to guess

`classify()` matches on the two things an event actually carries: an explicit
`workflow_type`, and the contract of the record it is about. **An explicit type is checked
against the record rather than believed** — an event that declares `LEGAL_CHANGE` and
carries a `UXProposal` is a contradiction, and a contradiction is not resolved by preferring
whichever field is easier to read.

An event that matches nothing comes back `unclassified`, with what was looked at, and the
Orchestrator routes it to a person. The alternative — picking the nearest type — produces a
workflow that runs the wrong specialists and reports a result about the wrong question, and
does it silently.

A `SourceCandidate` is an entry contract for two types, so an event carrying one and
declaring nothing is **unclassified by design**. That is not a rough edge; it is the
architecture refusing to decide by convenience what a person can decide by knowing.

---

## 6 · The capability register, and why a grant is an intersection

SESSION 22: *"An agent must not gain broader permissions merely because another agent
requested an action; the Orchestrator routed a task; a Control Room user clicked a
button."* Three ways a permission system leaks, all with the same shape — authority
arriving with the **request** rather than being held by the **actor**.

`agent/orchestrator/capabilities.mjs` registers all fourteen actors (the eleven specialists,
the browser suite, `human`, and the Orchestrator itself) with what each may produce, what it
may consume, its autonomy ceiling, what it may write, and what it may never do — the last
quoted from `docs/AGENT-ROLES.md`.

**`grantFor()` returns the intersection of what the agent holds and what the stage asks
for.** A stage declaring a need the agent does not hold produces an **empty grant** and a
refusal naming the difference; it does not produce a grant covering the stage's need. A
union would mean any workflow author could widen any agent by writing a more ambitious
stage.

Three further properties:

- **Nothing in the module reads an argument about permission.** `grantFor` takes an agent
  name and a stage; there is no `extra`, no `also`, no `permissions`. `checkOutput` takes a
  grant and a record; there is no `force`.
- **A grant is for one stage of one workflow and dies with it.** It carries the workflow id,
  and a record presented under a grant issued elsewhere is refused as `grant_replayed`.
- **The register is frozen all the way down.** A shallow freeze would leave `produces` a
  mutable array, and `CAPABILITIES['legal-verifier'].produces.push('UXProposal')` would
  widen an agent at runtime. The suite plants that push and asserts it throws.

**No agent may decide.** `may_decide` is false on every dispatchable entry, `MAY_DECIDE` is
frozen empty, and the load check throws if a dispatchable actor ever claims otherwise. A
grant lives in `agent/implement/decisions/decisions.jsonl` and reaches it through one
function, which refuses any name belonging to an agent in this system.

### What this is not

**It is not a sandbox.** Nothing here prevents a module calling `writeFileSync`; this
repository has no process isolation and this file does not pretend to add any. What it does
is state, in a record a reviewer can read afterwards, exactly what each agent was permitted
to produce — and refuse the output that exceeds it **at the handoff**. A boundary at the
handoff is the boundary this architecture can hold, and saying which one it is beats
implying a stronger one.

---

## 7 · Approval, and the eight checks

**Nothing an event says about approval reaches this layer.** `events.mjs` strips
`approved`, `authorized`, `granted`, `decided_by`, `outcome`, `approval_id`,
`permitted_files`, `roles`, `force`, `skip_checks`, `deploy`, `git_ref` and the rest at
intake, and **names every one it stripped** on the event and on the trace. Silently
ignoring them would look identical to not having checked — the reasoning
`agent/implement/ledger.mjs` already established about agent-written approval claims,
applied one layer up. An **unknown** field is refused outright with its name.

What is left is a proposal id. `approval.mjs` reads everything else out of the two stores
that own it, and performs the eight checks SESSION 22 requires before an approved proposal
is routed to implementation:

1. `proposal_exists` · 2. `proposal_approvable` · 3. `approval_attributable` ·
4. `scope_defined` · 5. `provenance_complete` · 6. `required_tests_satisfied` ·
7. `risk_satisfied` · 8. `implementation_scope_matches`

Five of them are **lifted from `agent/implement/preflight.mjs` rather than re-derived**, so
a gate tightened there tightens this too. It does not reimplement `deriveApproval()`: there
is one home for the fact of a decision and one function that derives its state.

**The eighth is the one nothing else performs.** `preflight` derives the permitted set from
the proposal and `apply.mjs` enforces it afterwards against git; neither compares the set
against *what was asked for*, because nothing was previously in a position to ask. A routing
request naming a file the proposal does not is **refused with the difference named** — never
intersected down to the permitted set and run anyway, which would let a caller discover the
permitted set by asking for everything and reading what came back.

### Attribution: three answers, and the third is the point

The ledger proves a decision exists, is bound to the proposal's hash, and is not signed by
any agent. It does **not** prove the decider was authenticated: `node
agent/implement/cli.mjs decide` writes a grant from a machine with no login, and the
ledger's own header says so. So `approval_attributable` reports:

| | |
|---|---|
| `authenticated` | a Control Room audit entry on this machine records the decision at the same fingerprint |
| `unauthenticated` | a trail exists here and holds no entry — what the CLI path looks like |
| `no_trail_here` | there is no trail on this machine. **Nothing can be said.** |

Not `false`, which would be a finding about the decision, and not `true`, which would be a
fabrication. A fresh clone and a CI runner have no trail.

---

## 8 · Conflicts, and the absence of a resolver

`docs/AGENT-ROLES.md` H7: *"Contradictions stop the chain. Where two roles disagree on a
fact, work halts and goes to a human. It is never resolved by seniority, recency or
convenience."*

**So `conflict.mjs` has no resolver.** No `resolve()`, no `preferMostRecent()`, no
confidence comparison, no tie-break — and the suite asserts those exports do not exist. The
temptation is specific: a verifier's `contradicted` beside a proposal that asserts the value
anyway has an obvious answer, and taking it would be an agent deciding a question about EU
law by rule of thumb.

Six detectors, each for a disagreement with a known shape:

| Kind | What it catches |
|---|---|
| `verdict_contradicted` | a verifier said otherwise, and a proposal asserts it anyway |
| `value_disagreement` | two records propose different values for one target |
| `class_lowered` | a downstream record carries a lower autonomy class (H5 — class only rises) |
| `refusal_softened` | an upstream **blocking** question is settled downstream (H6) |
| `epistemic_upgraded` | interpretation or unresolved becomes fact (protocol §4) |
| `role_collision` | one agent held two stages a workflow forbids pairing (H3) |

Most share an asymmetry: each asks whether something got **easier** downstream. Work getting
harder is normal and is not reported.

**An empty conflict list is a finding about the detectors, not about the work.** `bound` says
so on every result: two records can disagree in prose that nothing here reads.

### The pairs name stages, not agents — and that cost a test

`same_agent_forbidden` was written first as pairs of agent *names*, and the rule then fired
exactly when the design was **honoured**: "the detector ran, and now the verifier is
running" is the intended sequence. Written as **stage** names it says what H3 actually says
— whoever runs `detect` may not also run `verify` — and the Orchestrator carries a second
check that fires on the real case: **an agent handed a record it produced itself** is
refused before any reasoning happens.

---

## 9 · Human review, and the autonomy boundary

Two questions, kept apart in `policy.mjs` because they fail differently.

**`requiresHumanReview()`** — is this the *kind* of thing a person decides? The ten triggers
SESSION 22 names: interpretation, critique, legal conclusions, schema or taxonomy change,
deletion, major rewrite, architecture change, ambiguous legal status, unresolved conflict,
and the autonomy policy refusing. Any one routes the workflow to a person. **No amount of
model confidence overrides one** — protocol §19 says that in those words, and `confidence`
is not read anywhere in the file. The suite asserts that by reading the source.

`major_rewrite` is the one term the protocol names and defines nowhere. Two mechanical
thresholds, declared as constants so they can be argued with: **400 characters** replaced in
one operation, or **10 operations** against prose. Both deliberately low — misclassifying
downward is the failure the autonomy policy exists to prevent, and a threshold that catches
an ordinary edit costs a review.

**`autonomyPermits()`** — are all twelve of protocol §18's mandatory conditions satisfied?
Failure of one blocks automatic execution, and **all twelve are evaluated and reported**
either way. That could have been a single early `return false`, and deliberately is not: the
interesting fact is not "autonomy is off", it is *which* conditions a given piece of work
would have failed. A system that only ever prints "not permitted" teaches nobody anything,
and the first session that enables a category would be enabling it blind.

### The answer today is always no, and saying so plainly is the point

§20 restricts autonomous production action to "explicitly approved low-risk categories".
The five the protocol names are written down in `LOW_RISK_CATEGORIES`.
`APPROVED_AUTONOMOUS_CATEGORIES` is **empty**, because no governance decision in this
repository has approved any — and §24 forbids the system from adding one: *"The system MUST
NOT autonomously rewrite its own governance policy."* An agent appending to that array would
be taking the decision the protocol reserves to a person.

---

## 10 · State: a journal, not a field

Every transition is one immutable line in `agent/orchestrator/state/<workflow_id>.jsonl`;
the current state is `replay()` of those lines. Same shape as the trace store and the
decision ledger, and chosen for the same reason: a mutable status field can be set, and a
journal can only be appended to. A workflow that died mid-stage reads as what happened up to
the moment it died, rather than as a status somebody forgot to update.

**One home per fact.** The journal carries record **ids and contracts**, never bodies. The
records live in `agent/records/`, the trace in `agent/observability/runs/`, the decision in
`agent/implement/decisions/`. This file holds the routing, which is the only fact it owns.

**A stage that did not run says so.** `not_dispatched`, `refused`, `not_reached` and `failed`
are four different facts and none collapses into another — an absent stage is
indistinguishable from one that never existed.

### What the journal is not

**Not tamper-evident.** `readJournal()` reports a sequence gap; it cannot prevent one, and
anybody who can write the working tree can write these files. **Not a security boundary
either** — it is git-ignored, and one `git add -f` undoes that. It is the strongest control
available in a repository whose deployment unit is the whole tree. The record that carries
authority is the decision ledger; the record that carries a hash chain is the Control Room's
audit trail.

---

## 11 · The Control Room boundary

> The Control Room is an interface to the orchestration system, not an authority above it. A
> UI action must generate a governed event. The Orchestrator independently validates whether
> that event is permitted. — SESSION 22

`GET /api/workflows`, behind `workflows:read`, is the whole of the exposure. **There is no
route that starts a workflow, retries a stage, dispatches an agent or reopens a terminal
one, and the absence is the control** — not a check inside a route, because a check can be
moved. The Control Room does not import the `Orchestrator` class or the event intake, and
the suite asserts both: a server that could construct one could run one.

Every role that can read the live system can read the workflow state, and no role can change
it, because there is no permission to hold.

---

## 12 · No dispatcher is wired, and what SESSION 24 attached to the seam

A **dispatcher** is the function that actually runs a specialist. **SESSION 22 wired none,
and none is wired in production now.** `new Orchestrator({...})` with no `dispatchers`
reaches every dispatch stage, refuses it as `not_dispatched`, and ends the workflow
`unresolved` — which is the true answer to "what did the specialists find" when nothing ran
them.

Protocol §25 puts the first complete end-to-end cycle in **simulation**, at SESSION 24, and
asks that it "observe and document defects rather than silently repairing them". A session
that wired the eleven agents into automatic execution here would be running that simulation
early, against the real record store, without the observation discipline §25 requires. The
seam was the deliverable.

**SESSION 24 attached a simulation to it, and nothing else.** `agent/simulation/` wires
twelve SIMULATED specialists — pure functions returning fixtures, which cannot write, spawn
or fetch — and walks the lifecycle once across eight of the ten workflow types. Everything
in this module ran for real; the specialists' domain reasoning did not. The run changed
nothing: every store it writes is a `mkdtemp` directory, and the harness fingerprints the
whole working tree before and after so "nothing changed" is a measurement.
**It found twenty-three things, and repaired none of them.**
`docs/FIRST-END-TO-END-AUDIT.md`.

The suite drives the Orchestrator with **fixture specialists** — dispatchers that return
records from `agent/schemas/fixtures.mjs` — so every path through it is exercised without
anything real running.

---

## 13 · What this does not prove

1. **No REAL specialist has ever been dispatched by it.** §12. Every end-to-end path in the
   suite, and every leg of SESSION 24's simulation, is driven by a fixture dispatcher. The
   eleven agents in `agent/` have never been called from here.
2. **No workflow has ever been run against the real record store with dispatchers attached.**
   `node agent/orchestrator/cli.mjs survey` reads that store and reports; it dispatches
   nothing. SESSION 24's run used a temporary record store and a temporary ledger, both
   deleted at the end.
2b. **Four properties SESSION 24 measured and this document previously implied.** The
   rollback gate has never examined a record on either type that declares it; two conflict
   detectors have no ordering constraint and reported one relationship backwards; sibling
   records from a single dispatch conflict with each other; and `receive()` is called with
   `allowSimulated: true`, hard coded, so every workflow admits a simulated record.
   `docs/FIRST-END-TO-END-AUDIT.md` §7, findings V-3, I-1, I-2 and V-1. **None is fixed.**
3. **The conflict detector sees six shapes.** Two records can disagree in prose that nothing
   in this repository reads — the validators do not read prose either.
4. **The provenance gate checks that provenance is internally complete**, not that the
   evidence says what the record says it says. No URL here has ever been fetched (F-12), and
   the Legal Verifier is the role that reads a source.
5. **A stated rollback path is not a demonstrated one.** `git blame` answers nothing in this
   repository (F-06), so the only real path back is the agent's own branch and its own
   commits.
6. **The journal is neither tamper-evident nor private.** §10.
7. **Nothing here has been penetration-tested**, and the capability register is a boundary at
   the handoff rather than process isolation. §6.
8. **No governance decision has enabled any autonomous action category**, so the autonomy
   path has never returned `permitted` for anything real. §9.
