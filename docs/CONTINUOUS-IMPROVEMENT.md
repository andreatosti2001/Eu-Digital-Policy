# The continuous improvement loop

**Session:** 27 · 9 September 2026
**Status:** binding. `agent/improve/` is the mechanism; this document describes it and reports
what its first run found. Where the two disagree, the code governs and the disagreement is a
defect in this file.

**Relationship to what was already here.** `agent/orchestrator/` (SESSION 22) routes one event
at a time through ten workflow types. `agent/health/` (SESSION 20) measures 44 metrics in three
domains and keeps their movement. `agent/autonomy/` (SESSION 26) is the runner that can write a
file without a person. This adds the thing all three implied and none of them did: **a pass
over the whole system on a cadence, a record of it that survives a clone, and a comparison with
the pass before.**

---

## 1 · What it is, in one paragraph

Eight observers run in one process against one corpus position with one as-of date. Five of
them produce identified findings — Data Depth, the Gap Proposals router, the Knowledge
Architect, the Editorial agent and the UX auditor — and three produce counts: the four
validators, the public/private boundary check, and a new report on what limited autonomy can
actually reach. Every finding carries the id the specialist minted from the finding's own
content, so the same finding in two cycles is the same finding and movement is a set
difference. The cycle is compared with the last recorded one, every record is routed to a desk,
and the whole thing ends at a person.

```
node agent/improve/cli.mjs cycle --as-of YYYY-MM-DD [--record] [--store]
node agent/improve/cli.mjs observers      the register, runs nothing
node agent/improve/cli.mjs reach          what limited autonomy can actually reach
node agent/improve/cli.mjs history        every recorded cycle, and the movement between them
```

**`cycle` without `--record` writes nothing**, and there is no flag anywhere in the module that
can touch `data/`, `i18n/`, `js/`, `css/` or a page.

---

## 2 · The rule the whole thing turns on

**An observer that did not run is not an observer that found nothing.**

A finding present last cycle and absent this cycle has two possible explanations, and only one
of them is progress: somebody fixed it, or the observer that reports it did not run. They are
not distinguishable from the finding lists alone. A loop that assumed the first would report
improvement on exactly the days it was broken — which is the defect `docs/HANDOVER.md` already
records twice under another name, a check that passed for the wrong reason.

So movement is computed **per observer**, and an observer that did not run in *both* cycles
yields `undetermined` for everything it owns. Never `resolved`, and never counted as an
improvement. It is this repository's own §0.3 rule — unknown is never zero — applied at the one
place where getting it wrong would let a machine tell a person the system got better.

`agent/improve/selftest.mjs` tests 5 to 8 are that case from four directions, including the
mirror image: an observer that did not run in the PREVIOUS cycle makes nothing new.

**A first cycle reports nothing new.** "New" is a claim about a comparison and there is nothing
to compare against, so every finding on a first run is `undetermined` rather than new.

---

## 3 · Why the cycle ledger is git-tracked, and it is the only run store here that is

Every other run store in this repository is ignored, and each argues for it in `.gitignore` at
length: the trace store, the record store, the editorial drafts, the health history, the
Control Room state, the Orchestrator journals, the simulation traces, the autonomous-action
ledger. The argument is the same each time and it is a good one — this repository publishes its
whole tree, so a tracked operational trace is an operational trace on the public web.

**This one is different because a loop whose memory does not survive a clone is not a loop.**
Every ignored store is per-machine; a fresh clone and a CI runner have none. Applied to a cycle
record that means every session re-measures from scratch and compares against the previous
session's **prose** in `docs/HANDOVER.md`. That is a second home for those facts, which this
project's first principle forbids, and it has already drifted once — `docs/LIMITED-AUTONOMY.md`
§7c exists because a test count was stated two ways.

The precedent is therefore not the health history. It is `agent/policy/governance/grants.jsonl`
and `agent/implement/decisions/decisions.jsonl`, both tracked, for the same reason: a fact a
later session has to be able to check has to survive the clone.

**What pays for it is a rule, not a promise.** `agent/improve/ledger.mjs` enforces three things
before it appends, and **refuses rather than redacting** — a ledger that quietly dropped what
it could not publish would be a ledger whose absences mean nothing:

| | |
|---|---|
| **Visibility** | Every signal declares `public` or `private` using `agent/health/model.mjs`'s own classification. A `private` reading is withheld and its id and the reason are recorded in its place. The boundary check is private for exactly the reason `control_plane.secrets_in_public_assets` is. |
| **Leak scan** | `collectLeaks()` — the health monitor's own detector, not a second copy — runs over the **serialised** entry against the real private metric register. A private id arriving through a field nobody thought about is the only way this leak would actually happen, and a structural check would miss it. |
| **Forbidden paths** | A path under `.control-room/` or `.git/` anywhere in the entry is a refusal to write. |

**Nothing records by default.** `--record` is opt-in, the same reasoning
`agent/health/history.mjs writePublic()` gives: an agent that appended a tracked line on every
run would have taken a commit decision once, for everybody, without anyone deciding.

**The entry holds finding ids and not summaries**, which is the health history's rule for the
same reason. The current view holds the detail; the ledger holds the movement.

---

## 4 · FINDING 1 — the autonomy gate ladder was unpassable, and it has been repaired

**Found by building the triage rather than by reading the code. Reported first, repaired
second, under an explicit warrant from the repository author quoted in §4a.**

### 4.1 · What was wrong

Take a proposal that has nothing wrong with it: an `ImplementationProposal` writing one file
under `docs/`, which is a path the grant names and a category — `machine_derived_field` — the
grant enables; real evidence, no interpretation, no blocking question, `low` risk, a rollback
plan, a scope note. Run the real gate ladder over it under the real policy in force, and
**five of the six gates pass while the sixth refuses.**

`policy_route_pre` — gate 3 — had **two independent locks on the same door**, and the second
was invisible until the first was picked.

**Lock 1 · a condition reported `failed` about something nobody had looked at.**
`rollback_mechanical` reads a **change context**: the branch, the base commit and the per-file
pre-change hashes that `agent/implement/apply.mjs openContext()` records. That context is
produced in **step 2** of the seven steps; gate 3 runs **before step 1**. So four of the six
rollback elements — `previous_known_good_state`, `branch_or_commit`, `execution_mechanism`,
`post_rollback_validation` — were `unknown` for every proposal that has ever been written.
`assessRollback()` distinguishes `unknown` (not established) from `absent` (established
missing) and always has; `rollbackMechanical()` collapsed both into `failed`. That is this
repository's own §0.3 error — saying "I have looked and it is not there" about something
nobody had looked at.

**Lock 2 · a clause that asked the measurement question before the measurements existed.**
Gate 3's third clause read `decision.route !== 'blocked'`. There are exactly two ways
`agent/policy/engine.mjs` returns `blocked`: an unauthorized actor, or an unmet condition on
`NOT_WAIVABLE_BY_APPROVAL`. **Every measured condition is on that list**, and before a run
every measurement is unknown — so the second way is always taken and the clause was
unsatisfiable for every proposal, *independently of lock 1*. Repairing only the rollback
condition moved the refusal from clause 1 to clause 3 and changed nothing a caller could see.
This was measured, not reasoned: the gate then reported "0 condition(s) fail and 0
non-measurement condition(s) are unknown" **and failed anyway**.

**So the permitting half of limited autonomy was not merely unexercised, as
`docs/LIMITED-AUTONOMY.md` §7.1 says — it was unreachable.** That §7.1 statement is about
producers and is true; it was not the binding constraint.

**Is this consistent with what SESSION 26 reported?** Yes, and that is the point. Its §6 shows
gate 3 refusing a real proposal with, among five reasons, *"4 of six rollback elements
absent"*. What was not established is that the reason was **structural**. Four other gates
refused each of those fourteen proposals too, so the fifth reason was never the one that
mattered and nothing was in a position to notice.

### 4.2 · What was changed, and what was deliberately not

Two changes, both narrow, neither weakening a check.

**Change 1 — `agent/policy/conditions.mjs rollbackMechanical()`: three verdicts, not two.**
Any element **established missing** still fails, and that check runs first. Only when nothing
is established missing and something is merely not established does the condition return
`unknown`. `unknown` is not a pass: `agent/policy/engine.mjs` blocks on it exactly as on a
failure.

**Change 2 — `agent/autonomy/cycle.mjs`: `rollback_mechanical` joins `MEASURED_CONDITIONS`,
and gate 3's third clause checks authorization instead of the route.** The clause's only
content that was not a measurement was "is this actor authorized at all", and that case is
otherwise **invisible** at this gate — the engine returns `conditions: []` for an unauthorized
actor, so clauses 1 and 2 both count zero and both pass. It is now checked explicitly.

**The binding check did not move. It stopped being asked before it could be answered.** Step 6
re-evaluates every condition with `facts.context` supplied by the real run, and `mayMerge`
requires route `automatic`, which requires every mandatory condition **satisfied**. An unknown
there refuses.

**Not changed:** `preflight`'s ten gates, the other five autonomy gates, the twelve conditions,
`NOT_WAIVABLE_BY_APPROVAL`, the grant ledger, and the `agent/orchestrator/policy.mjs` copy of
`rollback_mechanical` — that one reads only the proposal's plan, never a context, so it was
never affected. It is a weaker check than `agent/policy/`'s and that difference is noted here
rather than repaired, because it is a separate question about the Orchestrator.

### 4.3 · What it now does, measured

`runCycle` in rehearsal against the clean fixture, under the real policy in force:

```
PASS   governance_grant · preflight_less_approval · policy_route_pre
PASS   fields_permitted · no_human_review_trigger · legal_record_named
outcome      rehearsed          (was: refused)
would_merge  false
why          verification_succeeded (unknown), validators_pass (failed)
```

**It still does not merge, and that is correct.** The refusal has moved from a structural
impossibility to two real measurements: nothing has verified the fixture, and the checks come
back `fail` because `freshness.mjs` exits 1 on the pre-existing item SESSIONS 24 to 26 all
recorded. That is the system doing its job.

**No autonomous change has merged anything, and this session did not make one.** What changed
is that a proposal can now be refused for a reason rather than by an impossibility.

### 4.4 · Five assertions changed, each named

| | |
|---|---|
| `agent/policy/selftest.mjs` 7 | the pre-run verdict `failed` → `unknown`. The route is still asserted `blocked` **first**, and the three cases the test is named for — `not_reversible`, a context on `main`, nothing supplied — all still FAIL because each carries an element that is established missing. Element-level assertions added so it cannot regress into "everything is unknown". |
| `agent/autonomy/selftest.mjs` 17 | `MEASURED_CONDITIONS` four → five, asserted exactly. |
| `agent/autonomy/selftest.mjs` 17b | **new** — gate 3 tolerates an unmeasured rollback, and the measured evaluation still refuses a plan that is genuinely not mechanical, and one on `main`. This is the half that stops the change being a loosening. |
| `agent/autonomy/selftest.mjs` 17c | **new** — an unauthorized actor is still refused at gate 3, with the empty condition list that made clauses 1 and 2 blind to it planted explicitly. |
| `agent/autonomy/selftest.mjs` 28 | ran `docsProposal()`, whose simulated evidence is refused at gate 2, and accepted `refused` OR `rehearsed` — so it could never tell "correctly refused" from "the ladder cannot be passed". It now runs a clean fixture and asserts every gate passes. |

`agent/improve/` also lost code: the triage carried a special case for the pre-run condition
and emitted a signal counting it. The case no longer arises, so both are deleted and replaced
by an assertion — `agent/improve/selftest.mjs` test 17 fails if that condition ever reads
`failed` before a run again.

### 4a · The warrant

This is a governance-layer change and `docs/AUTONOMY-POLICY.md` reserves it to a person.
The repository author gave it on **9 September 2026**, in these words:

> Changing what a gate proves is Class C work
>
> I give u the warrant

**It is not recorded as a governance grant, and the difference is deliberate.** A grant is read
at runtime by `policyInForce()` and therefore needs a ledger with a named person, a date and an
expiry. This is a change to code, which `git blame` attributes — SESSION 00 onward is the first
real provenance this repository has (AUDIT F-06). A second ledger that nothing reads would be
ceremony rather than accountability.

**What the warrant did not cover, and what was therefore not done:** nothing was enabled, no
grant was written or widened, no category was switched on, `DEFAULT_POLICY.enabled_categories`
is still `[]`, and no proposal was merged. The warrant was to repair a gate that refused
everything for a reason that was not true, and that is all that was done with it.

---

## 4b · FINDING 3 — the adversarial gate has reported a CRITICAL success since SESSION 24

**Not this session's, not repaired, and it is here because nobody had run the gate.**

`node agent/policy/verify/cli.mjs` reports **65 failed safely · 1 SUCCEEDED · 2 partial · 1
undecidable**. `AGENTS.md` and `docs/SECURITY-VERIFICATION-2026-09-08.md` both still say **0
succeeded**, which was true when SESSION 23.5 wrote it.

**HE-04 (CRITICAL)** — *"find the trigger phrase anywhere in the control plane, where it would
function as a credential"*. It walks `agent/` for `.mjs` files containing the phrase, excluding
`agent/policy/verify/`, any `selftest.mjs`, and `agent/browser/`. The single hit is
**`agent/simulation/threshold.mjs`**, which SESSION 24 added.

**Measured, so the report is not speculation.** The commit before this session's first push
(`aaf6691`, the SESSION 26 merge) reports the identical result, run in a clean worktree. It is
not a regression from the improvement loop and not a regression from the warrant change.

**What the module actually does with the phrase.** It uses it as a **probe**, not as an input:
the line the attack hits is the separation check itself, which searches Control Room source for
the phrase in order to prove the phrase is *absent* from the control plane. The attack's own
wording is conditional — *"if any of those reads it as an input, it is a credential"* — and on
reading the module, none of them does.

**So this is very probably the HE-01 shape, which SESSION 23.5 already found once**: an attack
that cries CRITICAL over a module whose only use of the phrase is to test it. There the fix was
to the attack. Here the exclusion list names the three places that legitimately probe the
phrase and went stale when SESSION 24 added a fourth.

**It is not repaired here.** Two reasons: the warrant in §4a is about the autonomy gate, not
about a security gate's classification; and the verification gate's own stated posture is that
*"findings are recorded with a recommended remediation and the remediation is a later session's
to decide"*. The recommended remediation is to add `agent/simulation/` to HE-04's exclusion
list **only if** a reader confirms the module reads the phrase as data and never as an input —
and to leave it red otherwise, because a CRITICAL suppressed is worse than a CRITICAL
explained.

**The standing lesson is separate and larger: the adversarial gate is not in CI.** Nothing ran
it between SESSION 23.5 and now, which is how a CRITICAL stayed red across three sessions while
three documents said otherwise.

---

## 5 · FINDING 2 — six of the eight granted fields have never existed

`node agent/improve/cli.mjs reach`, measured against the real tree rather than inferred:

| Field named by `gov-5c5d9d87d8ca4478` | In `data/sources.json`? |
|---|---|
| `url_status` | **yes** — 77 records carry it |
| `url` | **yes** — 77 records carry it |
| `last_retrieved` · `retrieved_at` · `checksum` · `content_hash` · `recheck_interval` · `freshness_window` | **no** — no record carries them and the names occur nowhere in the file, not in `$description` and not in `$note` |

The 77 records carry fourteen fields: `accessed`, `id`, `language`, `note`, `published`,
`publisher`, `publisher_name`, `resolution`, `resolution_note`, `tier`, `title`, `type`, `url`,
`url_status`.

The consequence is mechanical. `retrieval_metadata` is reached only through a target naming
`last_retrieved` or `checksum` (`agent/policy/categories.mjs` §6), so **that enabled category
has no surface to write to at all**. `source_metadata_maintenance` and `source_url_correction`
have two fields between them, and both of those describe a document's retrieval status, which
this environment cannot establish: SESSION 25 measured all five registered endpoints refused by
the network policy.

**This is not a defect and it is not a hazard.** A permission over nothing is inert, and
`docs/LIMITED-AUTONOMY.md` §7.6 already says absence is the safe direction for the opposite
case. What was never established is this case — a field **named by the grant** that the dataset
does not have — and it is the mechanical half of §7.1's explanation. A session that read §7.1
and set out to build a producer would otherwise have built one for fields that are not there.

**It is not repaired, and repairing it would be the failure it looks like a fix for.** Adding
`checksum` to `data/sources.json` would be a schema decision about the legal record, taken to
make an autonomy demonstration possible. That is the fixture dressed as work that §7.1 refuses.
`agent/improve/selftest.mjs` test 4c asserts `reach.mjs` contains no write at all, and test 4b
asserts the exact set of absent names so that adding one of them fails loudly and arrives in
front of a person.

`node agent/improve/cli.mjs reach` runs on every push (`.github/workflows/qa.yml`), so the day
the schema moves, the change is visible in CI.

---

## 6 · The first recorded cycle

`node agent/improve/cli.mjs cycle --as-of 2026-09-09 --record --session "SESSION 27"`
trace `dbd43f16b2f34bf1fa0d2e7e3183f522` · cycle `cycle-9f20d795beea`

**8 of 8 observers ran. 210 findings.**

| Observer | Findings | |
|---|---|---|
| `depth` | 57 | Data Depth, thirteen detectors over the real corpus |
| `data-proposals` | 49 | the router over those 57 gaps |
| `editorial` | 44 | the real prose, running only the half that needs no verified input |
| `architect` | 40 | the eight questions over the information model |
| `ux` | 20 | markup, stylesheets and modules — no page was opened |

**Triage: 0 referable to the autonomy runner · 66 to a person · 144 propose no act.**

The 144 are gaps, questions and findings: a record that names something to look at and proposes
no change has no category, because it proposes no act. It is work, not a decision.

The 66 that do propose an act are refused by category, every one of them by a category **no
policy may ever automate**:

| Derived category | | |
|---|---|---|
| `legal_interpretation` | 30 | the proposal records an interpretation of its own |
| `architecture_change` | 16 | `ArchitectureProposal` by its own declaration |
| `substantive_data_change` | 13 | writes a canonical dataset, matches no maintenance category |
| `taxonomy_change` | 5 | touches the enum authority |
| `schema_change` | 2 | touches `agent/schemas/` or `tools/` |

**Signals**

| | | |
|---|---|---|
| `validators.errors` | 1 | `freshness.mjs` — the same "1 item(s) need attention" SESSIONS 24, 25 and 26 all recorded. Not this session's, and not fixed. |
| `validators.at_baseline` | false | for that reason alone; the other three are exactly at the §12 baseline |
| `reach.absent_granted_fields` | 6 | §5 above |
| `reach.categories_without_surface` | 1 | `retrieval_metadata` |
| `boundary.blocking` · `boundary.warnings` | *withheld* | classified private; the ledger is tracked and the tree is published |

**This cycle was recorded BEFORE the repair in §4**, and it is kept rather than re-recorded,
because a ledger whose entries are rewritten when the world changes is not a ledger. It carried
one further signal, `triage.blocked_only_by_prerun_condition`, which counted proposals refused
solely by the pre-run condition and read **0** — not because the blocker was absent but because
nothing in the real corpus gets far enough to meet it: all 66 are refused at the category gate,
several steps earlier. That signal is retired now that the condition no longer behaves that
way, so the recorded entry names a signal the loop no longer emits. Reading it back is
unaffected; `movement.mjs` treats an unknown signal id as `not_a_score` with no interpretation,
which is the right answer for a reading whose definition has been withdrawn.

## 6b · The second cycle — the first comparison this repository has ever made

`node agent/improve/cli.mjs cycle --as-of 2026-09-09 --record` · cycle `cycle-df155e5eac10`,
recorded after the §4 repair, at commit `fa67b3ab`.

```
MOVEMENT  against cycle-9f20d795beea
0 new · 210 persisting · 0 resolved · 0 undetermined
```

**All eight observers ran in both cycles, so all eight are comparable and nothing is
`undetermined`.** Two passes taken an hour apart at different commits, over an unchanged
corpus, produced the same 210 findings under the same 210 ids.

That is a small number and it is the point twice over. It is the **reproducibility** the
content-derived ids buy: if any agent minted an id from a counter, this would read as 210 new
and 210 resolved, and nothing but this comparison would notice. And it is the loop doing the
one thing eleven separate CLIs could not — answering "what changed since last time" from a
measurement rather than from a recollection.

The second entry carries **four** signals where the first carried five: the retired
`triage.blocked_only_by_prerun_condition` is gone, and the ledger tolerates that rather than
being rewritten.

---

**Nothing was changed.** `git status --porcelain` shows no path under `data/`, `i18n/`, `js/`,
`css/` or any page throughout, and `agent/improve/selftest.mjs` test 20 runs two real cycles and
asserts it from outside.

---

## 7 · What this does not prove

Every one of these is a real limit, and it is here rather than in a footnote because the site's
own argument is that a record should say what it cannot support.

1. **An `eligible` referral is not a permission.** The triage answers a strictly weaker
   question than the gate ladder and says so in its own return value. `agent/autonomy/` decides.
2. **The loop reads no page, no document and no sentence.** No observer opens a rendered page —
   `agent/browser/` is what does. Nothing in this environment retrieves a document; SESSION 25
   measured that refusal. Nothing here reads a sentence for truth.
3. **A count is not a score.** Most of what the loop counts rises when the system looks harder.
   `movement.mjs` marks which signals have no better direction and refuses to rank them, the
   same discipline `agent/health/model.mjs` applies to its five `not_a_score` metrics.
4. **Movement is only as good as the ids.** The whole comparison rests on
   `agent/schemas/identity.mjs` having made finding ids content-derived in SESSION 13. If an
   agent ever mints an id from a counter again, every number here becomes noise, and nothing
   but `agent/improve/selftest.mjs` test 20 — two real passes over an unchanged corpus, every
   finding required to persist — would notice.
5. **The ledger is not tamper-evident.** Anybody who can write to the tree can append or edit a
   line, exactly as `agent/implement/ledger.mjs` says about the decision ledger. What it is, is
   *visible*: it is tracked, so a change to it appears in a diff under review.
6. **One recorded cycle is a position, not a trend.** Everything in §6 is a first reading and
   the loop says so in those words rather than reporting 210 new findings.
7. **The repair in §4 has not been exercised by a merge.** The ladder is now passable and
   nothing has passed it: the rehearsal reaches the measured evaluation and refuses there, on
   real measurements. What is proved is that a proposal can be refused for a reason rather than
   by an impossibility. **No autonomous change has merged anything**, and every claim in
   `docs/LIMITED-AUTONOMY.md` §7 about that still stands.
8. **`agent/orchestrator/policy.mjs` has its own weaker `rollback_mechanical`**, reading only
   the proposal's plan and never a context. It was unaffected by the repair and is not a second
   home this session resolved.

---

## 8 · What SESSION 28 inherits

**The gate ladder is passable and nothing has passed it.** The next honest step is a proposal
that reaches step 6 and is refused there on measurements, or merged — and neither has happened.
`freshness.mjs` exiting 1 makes `validators_pass` fail for every run in this tree, so nothing
can merge here until that pre-existing item is dealt with. That is now the binding constraint,
and it is a small, concrete one, where the previous binding constraint was a structural
impossibility.

**HE-04 is red and three documents say otherwise** (§4b). The remediation is a decision, and the
larger lesson is that the adversarial gate is not in CI — which is how a CRITICAL stayed red
across three sessions.

**The loop has one recorded cycle**, taken before the repair. The second one is where it starts
being worth something: the first comparison this repository can make from a measurement rather
than from a recollection.

**`agent/policy/` remains on the never-automatic path list on purpose.** Widening the grant,
adding a field to `data/sources.json`, and changing what a gate proves are all Class C work in
front of a person — this session did the third only because the author gave the warrant in §4a,
and did none of the others.
