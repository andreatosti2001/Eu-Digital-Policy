# The first end-to-end run — SESSION 24

**Status:** the observation record for the first complete cycle this system has
ever run. SESSION 24.
**Date of the run:** 2026-09-09. Every derived figure below is dated because
derived output in this repository depends on the reader's clock
(`docs/AUDIT-2026-09-01.md` F-15).
**Reference for:** what was run, what ran for real, what was simulated, the
complete trace, the Control Room discovery path, the intended visual sequence,
and **twenty-three findings, none of which were fixed.**

`docs/HANDOVER.md` is the session record; this is the description of what the
run found. `agent/simulation/README.md` describes the harness.

---

## 0 · The sentence to read before any other

**Nothing in this run is evidence about EU law, and nothing in it is evidence
that this system works.**

Every record is marked `simulated`, every URL is on `example.invalid`, and the
entity the whole scenario is about — `simulated:instrument` — does not exist in
`data/instruments.json` or anywhere else. What ran for real is the *wiring*: the
Orchestrator, the gates, the grants, the handoffs, the conflict detectors, the
autonomy policy, the journal, the tracer, and a real Control Room process with a
real login and a real ledger write. What was simulated is the eleven
specialists' **domain reasoning**. No source was read. No page was opened by a
specialist. No dataset was examined. No sentence was judged.

So a green leg in the trace below means *the machinery routed a fixture without
objecting*. It does not mean the Scout would have found that document, that the
Verifier would have confirmed it, or that the Editorial agent would have quoted
that sentence.

**Nothing was published and nothing in the repository was changed.** That is a
measurement, not an assurance: `agent/simulation/world.mjs` fingerprints every
file in the working tree before and after the run, and
`agent/simulation/selftest.mjs` test 1 asserts the difference is empty.

---

## 1 · How to reproduce it

```
node agent/simulation/cli.mjs graph        # the graph, declared. Runs nothing.
node agent/simulation/cli.mjs run          # one complete cycle, eight legs
node agent/simulation/cli.mjs threshold    # the Control Room discovery path
node agent/simulation/cli.mjs all          # both
node --test agent/simulation/selftest.mjs  # twenty assertions about the discipline
```

`run` writes its observability trace into a `mkdtemp` directory and deletes it.
`--trace <dir>` keeps it. `--json` emits the whole trace object; `--verbose`
prints every stage's reasoning rather than only its status.

**This document quotes the harness rather than restating it.** The six-phase
visual specification is declared as data in `agent/simulation/threshold.mjs`;
the legs are declared as data in `agent/simulation/cycle.mjs`. One home per
fact, and this document is not the home of either.

---

## 2 · What ran for real, and what did not

| Ran for real | Simulated |
|---|---|
| `agent/orchestrator/events.mjs` — intake, field stripping, unknown-field refusal | the Source Scout's search |
| `agent/orchestrator/workflows.mjs` — classification against the subject's contract | the Legal Verifier's reading |
| `agent/orchestrator/capabilities.mjs` — every grant, as an intersection | the Change Detector's snapshot and checksum |
| `agent/orchestrator/orchestrator.mjs` — handoffs, H3, stage records | Data Depth's profiling |
| `agent/schemas/gateway.mjs` — contract validation at every boundary | the Knowledge Architect's corpus tally |
| `agent/orchestrator/conflict.mjs` — all six detectors | the Editorial agent's reading of a sentence |
| `agent/orchestrator/policy.mjs` — provenance gate, rollback gate, ten human-review triggers, twelve autonomy conditions | the UX auditor's read of markup and stylesheets |
| `agent/orchestrator/approval.mjs` + `agent/implement/preflight.mjs` — two independent derivations of one authorization | **the browser suite** |
| `agent/implement/ledger.mjs` — a real grant, bound to a hash | the Implementation Agent's validators and file writes |
| `.control-room/server.mjs` — a real process, real login, real authorization, real audit chain | the health monitor's 44 metrics |
| `agent/observability/tracer.mjs` — the whole trace | |

**The browser suite is the one to distrust most.** It is the only thing in this
repository that can see what the four validators cannot, and a simulated
`QAResult` is indistinguishable from a measured one to everything downstream.
The real suite was run separately for the discovery path (§5) and its nine
threshold checks passed in a real Chromium; every other `QAResult` in the trace
is a fixture.

---

## 3 · The agent graph, and every handoff

Eight legs, walking the lifecycle in `docs/ORCHESTRATOR.md` §2 once. Leg 6 runs
twice, for the reason in §4.

| Leg | Lifecycle | Workflow type | Agents, in order | End state |
|---|---|---|---|---|
| 1 | DISCOVER → VERIFY | `VERIFICATION_REQUIRED` | source-scout → legal-verifier → verification-integrator → *provenance gate* | `human_review_required` |
| 2 | OBSERVE → CLASSIFY → PROPOSE | `LEGAL_CHANGE` | regulatory-change-detector → legal-verifier → regulatory-change-detector → editorial → *conflict gate* | `human_review_required` |
| 3 | PROPOSE (evidence) | `DATA_GAP` | data-depth → proposal-router → *provenance gate* | `human_review_required` |
| 4 | PROPOSE (representation) | `ARCHITECTURE_GAP` | knowledge-architect → *conflict gate* | `human_review_required` |
| 5 | PROPOSE (interface) | `UX_FINDING` | ux-auditor → browser-qa *(optional)* | `human_review_required` |
| 6 | HUMAN DECISION → AUTHORIZE | `IMPLEMENTATION_REQUEST` | *approval · scope · autonomy · rollback gates* → implementation-qa → browser-qa | `human_review_required` (both variants) |
| 7 | VALIDATE | `QA_FAILURE` | implementation-qa → *rollback gate* | `human_review_required` |
| 8 | DEPLOY → OBSERVE → LEARN | `POST_DEPLOYMENT_EVENT` | health-monitor → browser-qa *(optional)* | `human_review_required` |

**All nine workflow runs ended at a person, and none reached `completed`.**
Every one produced at least one proposal, and everything that proposes something
goes to a person — which is what the ten types declare and what the module
refuses to load a violation of.

**Two workflow types were not walked**, and the harness declares which rather
than leaving the gap silent: `NEW_SOURCE` (covered by leg 1's longer chain) and
`EDITORIAL_IMPACT` (reached through leg 2's `editorial_impact` stage, which is
the route a real regulatory update takes). `agent/simulation/selftest.mjs`
test 4 asserts every one of the ten types is either walked or named.

### The handoffs

Every dispatch stage received a grant that is the **intersection** of the
agent's registered capability and the stage's declared need, carrying the
workflow id, and every record was checked against that grant at the handoff.
Two handoffs are worth naming.

- **Leg 7 · `implementation-qa` produced a record outside its grant, and the
  handoff refused it.** The `assess` stage of `QA_FAILURE` declares a need for
  `QAResult` only; the agent returned a `ChangeRecord` as well; the grant did not
  cover it, and it was refused as `outside_grant` with the difference named. The
  stage still reports `ok` for the one record that was admitted — see finding
  **M-3**.
- **Leg 1 · nothing verified its own output.** `source-scout` produced a
  `SourceCandidate`; `legal-verifier` consumed it; H3's second half — a record
  handed back to the agent that wrote it — never fired, because the workflow
  assigns the two stages to different specialists, which is the design working.

---

## 4 · Why leg 6 runs twice — the first finding, and the largest

`agent/implement/preflight.mjs` gate 2 validates a proposal with
`allowSimulated: false`. **A simulated proposal can therefore never reach gates 3
to 10, and can never be approved through the Control Room.** Run against the
honestly marked proposal, the leg ends like this:

- preflight refuses at `proposal_valid`, `approved`, `approval_attributable`;
- the Control Room refuses the approval **409 `gates_refuse`** — at gate 6, the
  governance gates, not at gate 3, the permission check;
- the Orchestrator's approval gate refuses with `proposal_approvable` and
  `approval_attributable`, and every stage behind it records `not_reached`.

That is correct behaviour and it is also a wall: **the authorization half of this
system cannot be exercised by a simulation that is honest about being one.** So
the leg is run a second time against `unmarkedControlFixture()` — the identical
record with `simulated` cleared, written only into a `mkdtemp` record store — and
the second run is what produced the trace of the eight approval checks, the scope
gate, the autonomy gate, the rollback gate, the implement stage and the real
ledger line.

**This is a finding, not a fix.** It is recorded here as **V-1**, and nothing in
`agent/` was changed to accommodate it.

---

## 5 · The Control Room discovery flow — a separate UX/security path

`node agent/simulation/cli.mjs threshold` walks it: **search trigger →
recognition → animation → login boundary.** It is deliberately not a leg of the
cycle. The cycle is the governed path — events, workflows, grants, gates, a
person. A reader typing a phrase into a search box is a UX event on a static
page, and the whole question is whether it is only that.

### The six separations, measured

`agent/simulation/threshold.mjs separations()` measures each one and states what
its measurement cannot see. **All six hold.**

| Separation | How it was measured | Result |
|---|---|---|
| **authentication** | `js/threshold.js` contains none of eleven credential/session/network primitives, and **imports nothing at all** — so it can reach no module in `js/`. `passage()` with no document returns `null`. | separate |
| **authorization** | 0 of 21 Control Room routes name the mechanism; no `.control-room/*.mjs` contains the phrase; the permission a review needs is computed from the **proposal's** autonomy class inside `decide()`. | separate |
| **approval** | The one function that writes a grant is called from `agent/implement/cli.mjs` and `.control-room/decide.mjs`. Neither is under `js/`, and `js/threshold.js` imports nothing. | separate |
| **orchestration** | 0 of 10 workflow types and 0 of 14 registered actors name it. The Control Room has no route that starts, retries, dispatches or resumes a workflow — and the animation is not authenticated anyway. | separate |
| **execution** | No `child_process`, `exec`, `spawn`, `eval` or `Function` constructor **in the code** (comments stripped — see **U-4**). It runs in a browser on a static page with no server behind it. | separate |
| **deployment** | 0 published pages declare `<meta name="eu-control-room">`, so the passage ends at a statement and navigates nowhere. `.control-room/` is behind the dot prefix and is not served. | separate |

**The animation is a presentation layer only.** It draws an SVG and adds a CSS
class. Each of the six above is a measurement with named evidence, not a claim.

### What the real browser measured

`node agent/browser/cli.mjs --only threshold` was run in a real Chromium on
2026-09-09. **Nine checks, all passing:**

- a near miss (`thirty-two path`, singular) produces **zero** results — the
  trigger is the exact phrase, not a prefix;
- the phrase produces exactly **one** result;
- choosing it draws **3 rings and 22 letters**;
- the panel's rendered text carries none of the words a credential or a
  privileged record would bring with it;
- **0 links** in the panel on these pages, none carrying a query string or a
  `javascript:` target;
- opening the passage issues **no network request of any kind**;
- Escape ends it and leaves the reader on the page they were on;
- the page adds no window global whose name suggests a credential, a session or
  an approval;
- 30 requests over the whole check, all of them the page's own assets.

---

## 6 · The intended visual sequence, and what the code actually does

The specification is declared as data in `agent/simulation/threshold.mjs`
(`VISUAL_SEQUENCE`), so the comparison between intended and actual is something
a machine performs. **Three of the six phases do not match**, and
`selftest.mjs` test 6 asserts the count of three — so a future session that
implements one has to come and say so.

| Phase | Intended | Actual | Verdict |
|---|---|---|---|
| **1 · Recognition** | The search bar recognises the designated query. Nothing else reacts, and the result is one item that says what it is. | `isThreshold()` normalises case and whitespace and compares three exact triggers; `js/palette.js:129` returns the threshold provider **alone**. Measured in a browser: a near miss gives zero results. | **matches** |
| **2 · Transition** | The normal search interface becomes quiet and the surrounding interface **begins to recede**. | The page is **covered**, not receded. `.thr-scrim` is painted over it in one move; nothing quiets the palette or withdraws the page behind. | **mismatch** |
| **3 · Geometric emergence** | Concentric circular organisation, radial divisions, 22 Hebrew letters, precise geometric lines, restrained manuscript composition. | Three bands at r=148/104/62 divided 12 · 7 · 3, 22 letters, `stroke-width:.75` with `vector-effect:non-scaling-stroke`. Measured: 3 rings, 22 letters. | **matches** |
| **4 · Activation** | Progressively more complete, as if a hidden diagram were revealed rather than generated. | `@keyframes thr-draw` animates `stroke-dashoffset` 1000 → 0 — the ring arrives along its own length. Rings staggered 0/160/320 ms, letters and spokes at 620 ms, the centre gate at 1000 ms. `prefers-reduced-motion` goes straight to the end state. | **matches** |
| **5 · Passage** | The completed structure **contracts or transforms into the entry point**. The wheel becomes the door. | It does not. `.thr-run .thr-wheel>g` animates `thr-turn 24s linear infinite` — the wheel rotates indefinitely beside a text panel that rises at 900 ms. There is no contraction and no transform. | **mismatch — not implemented** |
| **6 · Authentication** | `CONTROL ROOM` is revealed, followed by the normal authentication interface. | The panel reads "Threshold / A private control plane"; the string `CONTROL ROOM` does not appear. **No authentication interface is rendered, and none must be.** | **mismatch — half cosmetic, half deliberate** |

### Phase 6 is two different things, and they must not be fixed together

**(a) Cosmetic.** The reveal does not show the intended name. Changing the
kicker and the title is a Class C interface change: a proposal, then a human
decision.

**(b) Deliberate, and it must stay.** *The "normal authentication interface"
must never be rendered on the public page.* A login form served from the
published static site would be a credential prompt in the public tree — a
phishing surface, and a second home for a login that `.control-room/` already
serves behind its own origin, its own session store and its own CSRF token. The
public page may only hand the reader to that origin. **This is recorded as
`must_not` on phase 6 of the specification itself**, so a future session
implementing the sequence cannot read the brief's phase 6 literally without
meeting the refusal.

`selftest.mjs` test 6 asserts, over every `.html` file in the repository, that
none declares a control-plane address and **none carries a `type="password"`
field**.

### The one thing the animation already gets exactly right

The brief says the animation must never imply that the special query itself
grants access. The panel's own copy says: *"Finding this page grants no access to
it: it is behind an account, and every privileged request there is authorised on
its own server."* That sentence is the mechanism's honesty, and it should not be
softened when phases 2, 5 and 6 are implemented.

---

## 7 · Findings

**Twenty-three, none fixed.** Protocol §25 asks this session to "observe and
document defects rather than silently repairing them", and
`agent/simulation/selftest.mjs` deliberately asserts the *discipline* of the
simulation rather than its findings — a suite that pinned a defect would turn it
into a requirement.

Severity is `high` where the finding could let something wrong through,
`medium` where it degrades what a reviewer can see, `low` where it is untidy.
Every one names where it was observed.

### Missing observations

- **M-1 · `high` · Nothing carries confidence out of a workflow.** `confidence`
  appears **zero times** in `agent/orchestrator/orchestrator.mjs` and
  `agent/orchestrator/state.mjs`, and only in prose in `policy.mjs`. The records
  carry it — the scenario's `SourceCandidate` is 0.3, its `VerificationRecord`
  0.8, its `RegulatoryChange` 0.6, its `EditorialProposal` 0.4 — and none of it
  reaches the workflow snapshot, the journal or the Control Room's workflow
  view. That `confidence` is not read for a *decision* is correct and deliberate
  (§19: no amount of model confidence overrides a human-review trigger). That it
  is not *reported* is a separate thing and is undocumented.
- **M-2 · `medium` · Nothing carries risk out of a workflow either.** Same
  shape. `EditorialProposal` is `risk: medium`, `UXProposal` and
  `ArchitectureProposal` are `low`, the `ApprovalRequest` is `risk_if_wrong:
  high`; the snapshot surfaces none of them, so a reviewer reading a workflow
  cannot sort by risk without opening every record.
- **M-3 · `high` · A partly refused stage reports `ok` and adds no human-review
  reason.** Leg 7: `implementation-qa` offered two records, one was refused as
  `outside_grant`, and the stage's status is `ok`. The refusal is recorded on
  the stage and on the span at `risk: high` — and it changes nothing about
  routing. Only a stage where *every* record was refused becomes `refused`.
- **M-4 · `medium` · A simulated record is not marked as such anywhere in the
  routing.** The workflow snapshot's record list carries `{id, contract, agent,
  stage}`. Whether a record was simulated is on the record, not on the trace the
  Orchestrator hands a reviewer.
- **M-5 · `low` · No stage carries a duration.** The trace spans do; the
  workflow snapshot does not, so "which stage was slow" cannot be answered from
  the journal.
- **M-6 · `medium` · There is no observation that a discovery happened.** The
  threshold issues no network request by design, so the site cannot know it is
  being probed and nothing anywhere records that somebody reached the passage.
  That is a deliberate trade-off — telemetry would make the page phone home —
  and it means the mechanism is unobservable by construction. Recorded so it is
  a choice rather than an oversight.

### Ambiguous agent responsibilities

- **A-1 · `medium` · Four actors may produce a `DataGap`,** and nothing says
  which one owns a given gap: `source-scout`, `verification-integrator`,
  `regulatory-change-detector` and `data-depth` all declare it. Leg 1 admitted
  **two `DataGap` records with the same id** from two different agents.
- **A-2 · `medium` · `verification-integrator` and `proposal-router` produce the
  same pair of contracts** (`DataProposal` + `ApprovalRequest`) and are
  distinguished only by what they consume. The register calls them "Verifier →
  Data Depth adapter" and "Data Depth → proposal". Whether that is two roles or
  one is a question this run cannot settle.
- **A-3 · `medium` · One agent holds two stages of `LEGAL_CHANGE`.**
  `regulatory-change-detector` runs both `detect` and `assess_impact`, so the
  agent that establishes a change also assesses its reach. H3 forbids the
  `scout`/`verify` pairing and says nothing about this one. It may be right —
  they are different questions on the same evidence — and it is not stated
  either way.
- **A-4 · `low` · `browser-qa` and `implementation-qa` both produce `QAResult`,**
  and leg 6b admitted two `QAResult` records with the same id from the two
  agents. Downstream, a measured result and an asserted one are the same shape.

### Redundant agents and redundant work

- **R-1 · `high` · `idOf` is implemented twice, byte-identically, in
  `agent/orchestrator/conflict.mjs:245` and `agent/orchestrator/policy.mjs:425`
  — and `agent/schemas/gateway.mjs` already exports a correct one** that reads
  `contract.id_field`. Both hand-rolled copies fall through to
  `'(unidentified record)'` for **6 of the 18 contracts**: `ClaimEvidence`,
  `QAResult`, `ApprovalRequest`, `AgentObservation`, `AgentRun` and
  `WebsiteChange`. Leg 3's provenance refusal reads *"(unidentified record): a
  BLOCKING open question is unclosed"* — the reviewer is told a record is
  blocking and not which one. This is the second-home-for-a-fact this project's
  first principle forbids, and it is already wrong in both copies.
- **R-2 · `medium` · `detectConflicts()` runs twice per workflow** that declares
  a conflict gate — once inside the gate (`orchestrator.mjs:376`) and once for
  the whole run (`:240`) — over the same stages, producing the same findings.
- **R-3 · `medium` · `requiresHumanReview()` runs three times and
  `autonomyPermits()` twice** per `IMPLEMENTATION_REQUEST` (`:248`, `:253`,
  `:383` and `:249`, `:384`). Two of the human-review calls are deliberate — the
  second is re-run *with* the autonomy result — and the third, inside the gate,
  duplicates them.
- **R-4 · `low` · The simulation harness starts a Control Room twice** and
  re-provisions four operators on the second start, all four refused and caught.
  A defect in `agent/simulation/run.mjs`, reported here rather than tidied, on
  the same terms as everything else.

### Unnecessary tool calls

- **U-1 · none in the run.** The simulated dispatchers make no filesystem,
  network or subprocess call, and `selftest.mjs` test 1 asserts the absence by
  reading the source. The only I/O in a full run is the temporary stores, the
  Control Room's loopback HTTP, and reading the repository twice to fingerprint
  it.
- **U-2 · `low` · The fingerprint walks the whole tree twice per run**
  (362 files, measured). Cheap, and worth naming because it is the run's largest single
  cost.
- **U-3 · `low` · `readAgentRecords()` re-reads the whole temporary record store
  on every construction** — four times in leg 6.
- **U-4 · `low` · A check that read a comment instead of the code.** The first
  draft of the `execution` separation scanned `js/threshold.js` for `exec` and
  reported the module as failing, because its own header says the module does
  not "approve, execute, or read anything privileged". Comments are now stripped
  before the scan. Recorded because `agent/browser/checks.mjs` has the same note
  about the same class of mistake, and it has now happened twice.

### Missing validation

- **V-1 · `high` · The Orchestrator admits simulated records unconditionally.**
  `orchestrator.mjs:495` calls `receive(record, { allowSimulated: true })`, hard
  coded, with no flag, no configuration and no comment. Every workflow in this
  system will accept a record marked `simulated: true` and route it the whole
  way to a person. The only thing that stops one is `preflight` gate 2, which
  runs on `IMPLEMENTATION_REQUEST` alone. §4 above is what that costs.
- **V-2 · `high` · The scope gate runs before the dispatch and nothing re-checks
  the output.** In leg 6b the approved `EditorialProposal` is scoped to
  `index.html`. `implementation-qa` returned a `ChangeRecord` declaring a change
  to **`tools/simulated-check.mjs`**, and it was admitted with no refusal:
  `checkOutput()` checks the contract, the workflow id and the author, and not
  the files. The site is still protected — `agent/implement/apply.mjs` enforces
  the permitted set against git — but the Orchestrator's own record of what
  happened says a file outside the approved scope was changed and no gate
  objected.
- **V-3 · `high` · The rollback gate has never examined a record.** Two workflow
  types declare it. On `IMPLEMENTATION_REQUEST` every stage before it is a gate,
  so the records handed to it are `[]` and `rollbackGate([])` returns
  `{ok: true, plans: []}` — the trace reads *"0 rollback plan(s), each naming a
  method, steps and a verification"*. On `QA_FAILURE` it receives a `QAResult`,
  which has no `proposed_change` and is skipped. **Protocol §17's rollback
  requirement is, in this workflow, a gate that passes over nothing.** The same
  property is checked for real by `preflight` gate 10 (`rollback_available`),
  which is why the run is not more dangerous than it looks — and it means the
  Orchestrator's gate is doing no work under a name that says it is.
- **V-4 · `medium` · The provenance gate has the same empty-set shape.** It is
  not reached on an empty set by any of the ten types today; a type written later
  that put it after only gates would pass it vacuously.
- **V-5 · `medium` · No id uniqueness check anywhere.** Leg 1 admitted two
  records with id `gap-simulated-001`; leg 6b admitted two with `qa-simulated-001`;
  and across legs, a `RegulatoryChange` and a `ChangeRecord` both carry
  `chg-simulated-001`. `readAgentRecords()` keys `byId` **flat**, so two
  contracts sharing an id value silently overwrite one another in the record
  store.
- **V-6 · `medium` · `scope` is stripped at the top level and read from
  `payload`.** `events.mjs` discards a top-level `scope` as authority arriving
  with the request; `orchestrator.mjs` then reads `event.payload?.scope` for the
  eighth approval check. The word travels one level down. It is *safe today* —
  the eighth check refuses a request naming a file the proposal does not, with
  the difference named — and the asymmetry is undocumented.

### Incorrect routing

- **I-1 · `high` · Two conflict detectors have no ordering constraint, and
  reported a relationship backwards.** `refusalSoftened()` and
  `epistemicUpgraded()` iterate every stage against every stage and exclude only
  the same record by id. Leg 1's trace says *"verification-integrator held
  simulated:claim as unresolved, and legal-verifier states it as FACT"* — but
  `legal-verifier` ran at stage `verify`, **before** `verification-integrator`
  ran at `integrate`. The detector's own rule is about something getting easier
  *downstream*; here it named the upstream agent as the downstream one.
  `epistemicUpgraded()` also stores its prior in a `Map` keyed
  `entity::field`, so which record counts as "prior" depends on iteration order.
- **I-2 · `high` · Sibling records from one dispatch conflict with each other.**
  Leg 2: `editorial` returned an `EditorialProposal` and its `ApprovalRequest`
  in one call, and the conflict gate refused the workflow with `refusal_softened`
  and `epistemic_upgraded` **between the two of them** — *"editorial left a
  BLOCKING open question … and editorial proposes a change to the same thing"*.
  An agent cannot soften its own refusal in the same breath; the pairing needs a
  stage or a producer exclusion, and has neither.
- **I-3 · `medium` · `classLowered()` compares across unrelated targets.** It
  keeps one running `highest` for the whole workflow regardless of what each
  record is about. Leg 3 refused on it: `data-depth`'s `KnowledgeGap` is
  `human_only` (a question about the *model*) and `proposal-router`'s
  `DataProposal` is `review_required` (a question about a *value*). H5 is about
  class rising along one piece of work; the detector reads it as rising across a
  workflow.
- **I-4 · `low` · An event refused at intake produces a result with no `state`.**
  `handle()` returns `{ok:false, workflow:null, refused:{…}}`, and every other
  path returns a `state`. A caller that reads `.state` sees `undefined` rather
  than a refusal.

### Where human intervention should occur, and does not

- **H-1 · `high` · A person approving in the Control Room is not shown the twelve
  mandatory autonomy conditions.** The review queue shows the ten preflight
  gates as `blocking_gates` and the proposal's `autonomy_class`; the twelve
  conditions appear only in the *workflows* view, as a **global register**, never
  evaluated for the proposal in front of the reviewer. In leg 6b the approval was
  granted while **7 of 12 conditions fail** — `verification_succeeded`,
  `validators_pass`, `risk_within_threshold`, `rollback_mechanical`,
  `scope_permitted`, `category_allowed`, `no_mandatory_human_review`. The
  approval is still correct, because approving authorises a scope and publishes
  nothing. The reviewer simply could not see which conditions their approval was
  standing over.
- **H-2 · `medium` · The autonomy gate never blocks, and the trace says
  `passed`.** That is deliberate and documented (`docs/ORCHESTRATOR.md` §9: it
  establishes whether anything *could* have run without a person, and routes
  rather than stops). It reads as a pass in every rendering of the trace,
  including this session's own report, and a reader skimming stage statuses will
  read seven failed conditions as a green gate.
- **H-3 · `medium` · A conflict is refused by a gate and never reaches a named
  person.** Legs 1, 2 and 3 all ended `human_review_required` with the reasons
  recorded — and there is no queue anywhere that lists a *workflow* awaiting a
  person. `GET /api/workflows` shows state; the review queue shows proposals.
  A workflow blocked at a gate is in neither list as work.
- **H-4 · `low` · The phrase "human_review_required" is the end state for all
  nine runs**, so the state carries no information about which of them a person
  should look at first. Combined with M-1 and M-2, there is nothing to triage on.

### Security weaknesses introduced by the hidden-entry UX

- **S-1 · `medium` · Implementing the brief's phase 6 literally would create a
  phishing surface.** "Reveal CONTROL ROOM followed by the normal authentication
  interface" reads, on a static published site, as *render a login form in
  `index.html`*. It must not be done. Recorded as the `must_not` clause of phase
  6 in `VISUAL_SEQUENCE`, and guarded by `selftest.mjs` test 6, which asserts no
  page in the repository carries a `type="password"` field.
- **S-2 · `medium` · The `<meta name="eu-control-room">` mechanism publishes the
  control plane's address the moment it is used.** One line in one page puts the
  address of a private system into the HTML of the public site. Protocol §10
  means that is not *by itself* a vulnerability — obscurity is not a control —
  but it is a decision with site-wide reach that no validator would object to.
  `agent/policy/selftest.mjs` test 18 does assert no page declares it, so the
  check exists; it is named here because the check is the only thing standing
  between a one-line edit and a published address.
- **S-3 · `low` · The continue link sets `rel="nofollow"` and not
  `rel="noreferrer"`.** On a deployment that declares an address, following it
  would send a `Referer` — the origin under a modern default policy — telling the
  Control Room's access log where the visitor came from. Small, and it is the
  private system learning about the public one rather than the reverse.
- **S-4 · `low` · The passage is a modal with no focus trap and no `inert` on the
  document behind it.** `.thr-scrim` carries `role="dialog"` and
  `aria-modal="true"`, focus is moved to the close button, and Escape closes —
  and Tab can still walk into the page behind, which a screen reader can also
  still reach. An accessibility defect that the `aria-modal` attribute makes into
  a *claim* that is not true.
- **S-5 · `low` · The mechanism is unobservable, on purpose.** See M-6. Nothing
  can rate-limit, log or notice repeated discovery, because noticing would
  require the page to make a request.

**None of these is a way in.** The six separations in §5 hold, measured; the
login boundary refuses an anonymous request on every private route; and the
phrase is in a file served to every reader, which is exactly why it is not a
credential.

### Mismatches between intended and actual visual behaviour

Three, in §6: phase 2 (the page is covered rather than receding), phase 5 (no
contraction into the entry point — the wheel rotates forever), phase 6 (the name
is not revealed; the authentication interface is deliberately absent and must
stay absent).

---

## 8 · What this audit does not prove

1. **No specialist reasoned about anything.** Every domain judgement in the run
   is a fixture. §2.
2. **No source was read and no URL was fetched.** No URL in this repository ever
   has been (`docs/AUDIT-2026-09-01.md` F-12), and the simulation did not change
   that.
3. **The browser suite was simulated inside the cycle.** It was run for real only
   against the discovery path. Every other `QAResult` in the trace is a fixture,
   and downstream nothing can tell the difference — which is A-4 and M-4.
4. **The approval that was granted was granted to a synthetic operator** at
   `sim-approver@example.invalid`, in a temporary ledger that no longer exists.
   It is evidence that the machinery accepts a decision, and it is not evidence
   that anybody decided anything. **Not one proposal in this repository has ever
   been decided**, and this run did not change that either —
   `selftest.mjs` test 1 asserts the real ledger still holds zero lines.
5. **The conflict detectors see six shapes.** An empty conflict list is a finding
   about the detectors. Two records can disagree in prose that nothing here
   reads.
6. **Nothing was penetration-tested.** The capability register is a boundary at
   the handoff, not process isolation, and this run did not attack it —
   `agent/policy/verify/` is where the adversarial work lives.
7. **The visual sequence was compared against source, not against pixels.** The
   browser measured nine properties of the threshold; it computed no contrast
   ratio, ran no screen reader and compared no pixels. README limitation 7
   stands.
8. **Two of the ten workflow types were not walked.** §3.
9. **One complete cycle is one cycle.** Nothing here says what the system does on
   the second one, on a workflow that resumes, or under concurrency — the
   Orchestrator has no concurrency model and this run exercised none.

---

## 9 · What SESSION 24 changed

`agent/simulation/` — new, nine files, twenty tests. The suite is registered in
`agent/implement/checks.mjs` `AGENT_SUITES`, which took the assertion in
`agent/implement/selftest.mjs` R6 from 18 to 19. **That assertion has now caught
the suite list growing five times**, and this is the fifth: without it the
harness would have landed without ever gating a change under `agent/`.

`.gitignore` gained `agent/simulation/runs/*`, with the README negated back in —
the same shape `agent/health/history/`, `.control-room/state/` and
`agent/orchestrator/state/` use, and for the same reason.

**Nothing else.** No dataset, no page, no stylesheet, no locale, no module in
`js/`, no existing agent, no validator, no threshold behaviour, and none of the
twenty-three findings above.
