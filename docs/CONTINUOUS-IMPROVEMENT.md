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

## 4 · FINDING 1 — the permitting half of limited autonomy is not reachable

**This is the session's headline, it was found by building the triage rather than by reading
the code, and it is NOT fixed.**

`docs/LIMITED-AUTONOMY.md` §7.1 says no autonomous change has ever merged anything, and gives
the reason as a fact about producers: *"nothing in this repository currently produces a
proposal in one of the five enabled categories"*. That is true. It is also not the binding
constraint.

Take a proposal that has nothing wrong with it: an `ImplementationProposal` writing one file
under `docs/`, which is a path the grant names and a category — `machine_derived_field` — the
grant enables; real evidence, no interpretation, no blocking question, `low` risk, a rollback
plan, a scope note. Run the real gate ladder over it under the real policy in force:

```
PASS   governance_grant          gov-5c5d9d87d8ca4478 in force
PASS   preflight_less_approval   8 of 10; the only failures are the two a grant stands in for
FAIL   policy_route_pre          rollback_mechanical (failed) — 4 of six elements are not present
PASS   fields_permitted          every field named is on the allowlist, none on the never list
PASS   no_human_review_trigger   none present
PASS   legal_record_named        no path in scope is the legal record
```

Five of six gates pass. The sixth fails on one condition, and **no proposal can satisfy that
condition at that point in the cycle.**

`rollback_mechanical` reads a **change context** — the branch, the base commit, and the
per-file pre-change hashes that `agent/implement/apply.mjs openContext()` records. That context
is produced in **step 2** of the seven steps. `agent/autonomy/cycle.mjs` evaluates gate 3
**before step 1**. So four of the six rollback elements —`previous_known_good_state`,
`branch_or_commit`, `execution_mechanism`, `post_rollback_validation` — are `unknown` for every
proposal that has ever been written, the condition fails, and gate 3 refuses. It is not one of
the four `MEASURED_CONDITIONS` that gate 3 exempts, so the exemption the other measurements
have does not cover it.

**On this evidence, no proposal can pass the autonomy gate ladder, however well formed.** The
permitting half is not merely unexercised — it is unreachable.

**How to reproduce it**, in this order:

1. `node --test agent/improve/selftest.mjs` — test 17 pins the case under the real policy in
   force and fails the day the gate changes.
2. Test 17b supplies the change context as a measured fact, which is what a real run has at
   step 6, and the **same proposal then refers**. That is the pairing that separates "correctly
   refused" from "broken".
3. `assessRollback({ proposal, context: null })` returns `mechanical: false` with those four
   elements `unknown`; with a context it returns `mechanical: true` and nothing missing.

**Is this consistent with what SESSION 26 reported?** Yes, and that is the point. Its §6 shows
gate 3 refusing a real proposal with, among five reasons, *"4 of six rollback elements
absent"*. What was not established is that the reason is **structural** rather than a property
of those fourteen proposals. Four other gates refused each of them too, so the fifth reason was
never the one that mattered and nothing was in a position to notice.

**Why this session did not fix it.** Three reasons, and the first is sufficient.

- Changing what a gate proves is **Class C** work on the governance layer, in front of a
  person. `agent/policy/` is on the never-automatic path list on purpose, and
  `docs/AUTONOMY-POLICY.md` §4 reserves this kind of decision.
- The two obvious repairs are not equivalent and choosing between them is a judgement about
  how much a rollback must be established before a change is made, not a bug fix. Adding
  `rollback_mechanical` to `MEASURED_CONDITIONS` makes it an `unknown` that gate 3 tolerates
  and step 6 re-checks on the measured facts. Evaluating gate 3 after `isolate` instead would
  keep the condition binding but move the gate behind the branch cut, which changes what
  "before anything is written" means. A third reading is that the refusal is correct and the
  system is meant to be unable to act automatically until somebody decides otherwise.
- Protocol §25's instruction to observe rather than silently repair is the standing posture for
  a finding of this kind here, and `docs/SECURITY-VERIFICATION-2026-09-08.md` and
  `docs/FIRST-END-TO-END-AUDIT.md` both left theirs for the author for the same reason.

**What the loop does instead of working around it.** It reports it. `triage()` separates the
case where the *only* refusal is this condition, names it per item, and emits
`triage.blocked_only_by_prerun_condition` as a signal on every cycle. A structural blocker
becomes a measurement somebody can act on rather than a silence. The triage does **not** refer
such a proposal to the runner: referring what the runner would refuse would make the loop's
answer disagree with the answer that governs, which is the drift the whole arrangement is
against.

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
| `triage.blocked_only_by_prerun_condition` | 0 | **and this zero is the interesting one — see below** |
| `boundary.blocking` · `boundary.warnings` | *withheld* | classified private; the ledger is tracked and the tree is published |

**Why `triage.blocked_only_by_prerun_condition` is 0 while §4 says the gate is unpassable.**
Because nothing in the real corpus gets far enough to meet the condition. All 66 are refused at
the category gate, several steps earlier. The structural blocker in §4 was found with a
well-formed fixture, not against the corpus, and the signal exists so that the first time a
real proposal does reach it, the number moves and somebody sees it. A zero here means "no
proposal got that far", not "the blocker is gone", and `movement.mjs` marks the signal
`not_a_score` so it is never read as progress.

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

---

## 8 · What SESSION 28 inherits

**The decision in §4 is the whole of the next objective**, and it is a person's. Until it is
taken, the honest statement about limited autonomy is stronger than SESSION 26's: not "nothing
produces a proposal in an enabled category", but "no proposal can pass gate 3, and the two ways
to change that are different judgements about how much a rollback must be established before a
change is made".

Second, the loop now has one recorded cycle. The second one is where it starts being worth
something — the first comparison this repository has ever been able to make from a measurement
rather than from a recollection. Run it with `--record` and the movement is real.

Third, `agent/policy/` remains on the never-automatic path list on purpose, so widening the
grant, adding a field to `data/sources.json`, or changing what gate 3 proves are all Class C
work in front of a person, not something the system can do to itself.
