# Limited autonomy, activated

**Session:** 26 · 9 September 2026
**Status:** binding. `agent/policy/governance.mjs` and `agent/autonomy/` are the mechanism;
this document describes it. Where the two disagree, the code governs and the disagreement is
a defect in this file.

**Relationship to what was already here.** `docs/AUTONOMY-POLICY.md` (SESSION 01) defines the
four classes and the nineteen prohibited automatic actions, unchanged.
`docs/AUTONOMY-AUTHORIZATION-POLICY.md` (SESSION 23) defines the twelve mandatory conditions,
the eighteen action categories and the 84-row capability matrix, unchanged. This document
adds the one thing both of them named and neither could do: **a governance decision that
switches a category on, and a runner that acts on it.**

---

## 1 · What changed, in one paragraph

SESSION 23 built the policy and left every category switched off, because filling
`DEFAULT_POLICY.enabled_categories` is a governance change and protocol §24 says the system
must not make one to itself. SESSION 26 is that decision arriving from the repository author.
It is recorded as a **grant** in `agent/policy/governance/grants.jsonl` — git-tracked, named,
dated, expiring — and the policy in force is **derived** from it. `DEFAULT_POLICY` is still
empty and still asserted empty by four suites: it is the base case, not a second home.

**One governance grant is in force:**

| | |
|---|---|
| Grant | `gov-5c5d9d87d8ca4478` |
| Decided by | `andreatosti2001 (repository author)`, 9 September 2026 |
| Expires | 9 March 2027 |
| Categories | the five protocol §20 names, and no others |
| Paths | `data/sources.json` and `docs/` |
| Fields | `data/sources.json`: `url_status`, `last_retrieved`, `retrieved_at`, `checksum`, `content_hash`, `recheck_interval`, `freshness_window`, `url` |
| Risk ceiling | `low` · environments `local`, `ci` · **never `production`** |

---

## 2 · Why the grant is not an edit to the policy object

Appending five strings to a frozen array in `agent/policy/categories.mjs` would have been
three characters of work, and it would have been the wrong shape twice over.

**It is a fact with no author.** A category switched on in a literal is switched on by
whoever last edited the file, and `git blame` in this repository answers "Add files via
upload" for anything older than SESSION 00 (`docs/AUTONOMY-POLICY.md` §4, AUDIT F-06). An
authorization has to name a person, a date and an authority, the way
`agent/implement/decisions/` does for a proposal.

**It would make `DEFAULT_POLICY` a second home.** What is switched on is one fact; it lives
in the grant ledger and the policy in force is derived from it — `docs/DATA-GOVERNANCE.md`'s
own two rules, one home per fact and derivation over storage.

The consequence is worth stating because it looks like a contradiction and is not:
`agent/policy/selftest.mjs` tests 1b, 29 and 32 still assert `enabled_categories` is `[]`,
word for word and at their original strength, **and five categories are switched on.** The
first is a statement about the base; the second about the policy in force. Ask
`policyInForce()`, never `DEFAULT_POLICY`, when the question is "what may happen now".

---

## 3 · What a grant cannot say

Checked when it is written **and again on every read**. A check that runs only at write time
protects only the file that process wrote — the reasoning `agent/implement/ledger.mjs`
records about self-approval, applied here. `agent/autonomy/selftest.mjs` test 7 writes a
forged line straight into a ledger file, exactly as anybody with write access to the tree
could, and asserts that nothing it names is honoured.

| Refusal | |
|---|---|
| **Category** | Only the five §20 names. The fourteen §19 categories may never be granted by any policy — `categoryAllowed()` reads `automatable` before it reads any enabled list, and the grant is refused a layer earlier so the list never contains one. |
| **Path** | Only at or under `AUTOMATIC_ELIGIBLE_PATHS`, which is two entries and each carries its reason. `NEVER_AUTOMATIC_PATHS` is an independent second refusal over fifteen paths, and `governanceSelfCheck()` asserts no eligible path reaches one. |
| **Field** | `data/sources.json` carries both bookkeeping and what a source is said to support. A grant names fields; `tier`, `role`, `supports`, `last_verified`, `verification_note`, `requires_verification`, `reference_gap`, `gap_note`, `title`, `publisher`, `type` and `celex` may never be named. A dataset in the path allowlist that names no field is refused too — silence would read as all of them, and all of them includes `tier`. |
| **Risk** | `low` is the ceiling and no grant may raise it. |
| **Environment** | `production` is not grantable. Nothing here deploys, Pages publishes `main` on push, and that is Class D. |
| **Expiry** | Required, and an expired grant enables nothing — it does not decay into a narrower grant. |
| **Author** | Refused where the name belongs to an agent in this system. |

`agent/policy/` is itself on the never-automatic path list, so **no grant can widen the rules
that admitted it.**

---

## 4 · What autonomy actually bought

A governance grant stands in for **exactly two** of `agent/implement/preflight.mjs`'s ten
gates — `approved` and `approval_attributable` — and only when the policy in force
independently routes the act `automatic`. Every other gate must pass, unchanged and
unweakened. `agent/autonomy/selftest.mjs` test 13 asserts the replaced list is those two and
names the eight that stay.

That substitution is what SESSION 18's preflight header anticipated and left unbuilt: *"the
approval is attributable to an authorized human **or an explicitly permitted autonomy
policy**"*. There was no such policy until a person wrote a grant.

### The six gates before anything is written

All six are evaluated, always.

1. **`governance_grant`** — a grant is in force, and the module's two path lists still agree.
2. **`preflight_less_approval`** — every preflight gate except the two above.
3. **`policy_route_pre`** — no mandatory condition *fails*, and the only `unknown`s are the
   four that are measurements.
4. **`fields_permitted`** — reads the operation **targets**. A target naming a never-automatic
   field is refused however the proposal categorised itself.
5. **`no_human_review_trigger`** — none of the conditions §19 reserves to a person.
6. **`legal_record_named`** — every legal-record path in scope is named **exactly** by a
   grant, never reached by a prefix that happens to cover it.

Gate 4 is the one that keeps substantive legal content out of an enabled category.
`categoriseProposal()` reads records, not prose (`docs/AUTONOMY-AUTHORIZATION-POLICY.md`
§10.4), so a proposal that declares itself a non-substantive annotation of
`data/sources.json` and in fact re-tiers a source would reach `source_metadata_maintenance`.
Reading the target closes that specific hole. **It does not close the general one**, and §7
below says so.

### The seven steps

| | | |
|---|---|---|
| 1 | `isolate` | A real branch, `autonomy/<action-id>`, cut from the working branch, plus the pre-change commit and a per-file sha256 of every permitted path. |
| 2 | `implement` | `agent/implement/apply.mjs`, called. Each operation applies only where its quoted `current` occurs **exactly once**. |
| 3 | `validators` | The four validators against `docs/CURRENT-ARCHITECTURE.md` §12, plus the agent suites and the contract check where the change touches `agent/` or `tools/`. |
| 4 | `browser` | The browser suite where the change touches a page, stylesheet, module or locale. A required run that did not happen is a blocking finding. |
| 5 | `trace` | Every stage on the observability trace. |
| 6 | `merge` | Into the **working branch**, `--no-ff`, and only if every mandatory condition is satisfied on the **measured** facts, git says the scope held, and the checks are at baseline. Otherwise: revert, re-hash, delete the branch. |
| 7 | `rollback` | Retained: the base commit, the branch, the per-file hashes, the executable procedure, and how a revert is confirmed. |

**Merge means into the session branch.** Not `main`, not a push, not deployment.
`mergeBack()` has no `target` parameter, so there is no argument through which a caller could
name `main`, and it refuses one anyway.

---

## 5 · The two supplied facts are derived, not asserted

Four of the twelve conditions are measurements a caller supplies, and
`agent/policy/conditions.mjs` says plainly that within one process a caller can pass a false
fact. Two of the four — the validators and the browser suite — are measured by runs that just
happened. The other two are the easy ones to fake, and `agent/autonomy/facts.mjs` derives
both from the record store:

- **`verification_succeeded`** — live `VerificationRecord`s over the same entities, superseded
  ones excluded, simulated ones excluded.
- **`no_unresolved_conflict`** — a scan for a contradicting verification, an open blocking
  gap, or a competing proposal writing the same target.

**Both return `undefined` where there is nothing to read**, never a default. An absent fact
is `unknown` in the engine and `unknown` does not execute. This module's failure mode is
refusing a change that could have been made.

---

## 6 · The first real run: fourteen proposals, fourteen refusals

Run on 9 September 2026 against the real corpus, after Data Depth and the Gap Proposals
router produced 57 gaps and 14 `DataProposal`s from `data/`.

```
node agent/autonomy/cli.mjs run --as-of 2026-09-09
  0 merged · 0 reverted · 14 refused · 0 rehearsed
  trace 44b4813604b011a1a490761191704ad8
```

Every one of the fourteen was refused, and **not by one gate but by four independent ones**.
The derived categories were `substantive_data_change` (13) and `taxonomy_change` (1) — none
is one of the five the grant enables. One refusal in full, `prop-annotate-ae6b2d48872f` over
`data/enforcement.json`:

| Gate | |
|---|---|
| `governance_grant` | **pass** — `gov-5c5d9d87d8ca4478` in force |
| `preflight_less_approval` | **pass** — 8 of 10, the two failures being the ones a grant stands in for |
| `policy_route_pre` | **fail** — 5 conditions fail, among them declared risk `medium` above the ceiling `low`, and 4 of six rollback elements absent |
| `fields_permitted` | **fail** — the operation target names `verification_note` |
| `no_human_review_trigger` | **fail** — `substantive_data_change` |
| `legal_record_named` | **fail** — `data/enforcement.json` is not named by any grant |

The field gate firing on `verification_note` against a real proposal, rather than a fixture,
is the part worth carrying: that is the record of what was and was not established, and a
machine writing it is prohibition 2.

**Nothing was written.** `git status --porcelain` was empty of any `data/`, `i18n/`, `js/`,
`css/` or page change throughout, and all fourteen ledger lines record `wrote_files: false`.

---

## 7 · What this does not prove

Every one of these is a real limit, and it is here rather than in a footnote because the
site's own argument is that a record should say what it cannot support.

1. **No autonomous change has ever merged anything.** The gate ladder, the rehearsal path and
   the git mechanics of steps 1 and 6 are each exercised — the last against a real temporary
   repository created with `git init` (`agent/autonomy/selftest.mjs` tests 34–37) — but the
   full seven steps have never run end to end with `--execute` against a proposal that
   passed. Nothing in this repository currently produces a proposal in one of the five
   enabled categories, and manufacturing one to demonstrate the mechanism would be a fixture
   dressed as work.
2. **It is not process isolation.** Anything running in this process can call the engine with
   whatever facts it likes. What the design gives instead: an absent fact is `unknown`, eight
   of the twelve conditions cannot be supplied at all, and here the four that can are return
   values of runs that just happened.
3. **The grant ledger is not authentication.** Anybody who can write to the working tree can
   append a line, exactly as `agent/implement/ledger.mjs` says about the decision ledger. The
   refusals a forged line must still pass are real and are tested; the write access is not
   controlled.
4. **`categoriseProposal()` reads records, not prose.** Gate 4 closes the case where the
   *field* gives away a substantive change. A proposal that edits an allowed field with a
   substantively wrong value is still a proposal this system would categorise as bookkeeping,
   and the four validators cannot read prose either.
5. **The six-month expiry is this session's judgement**, not something the brief stated.
6. **`data/sources.json` is inside the legal record.** It is eligible because §20's first
   three categories are about it and nothing else, and the field allowlist is the whole of
   what separates its bookkeeping from what a source is said to support. That separation is a
   list somebody wrote; a field added to `data/sources.json` later is refused by absence,
   which is the safe direction, but the list needs revisiting when the schema moves.

---

## 7b · One finding in an existing check, corrected

`agent/simulation/selftest.mjs` test 1b's own comment said *"the assertion is that THIS run
added nothing"*, and its code asserted four run-state directories were **empty**. Those are
different claims, and the second is about the machine rather than about the simulation:
`agent/records/` is git-ignored run state that any agent run populates, so the test passed in
a fresh clone and in CI and failed the moment this session ran Data Depth first. It now
snapshots, runs and compares, which is stricter — the old form could not have caught a
simulation writing into a directory that already held a file. A change to a check is Class C
and it is named here and in `docs/HANDOVER.md` so a reader can disagree with it.

`.github/workflows/qa.yml` also ran seventeen suites while `AGENT_SUITES` listed nineteen:
`agent/simulation/selftest.mjs` had never been in CI. Both it and
`agent/autonomy/selftest.mjs` are now.

---

## 7c · A note on the test count

**1036 tests across twenty-one suites, 0 failures**, measured on this session's branch. On
`main` it is 1035 with one skipped: `agent/autonomy/selftest.mjs` test 28 rehearses the real
cycle, and the cycle refuses to run on `main` because a push there publishes to the live site
and there is no deploy gate. The test skips itself rather than passing for the wrong reason.

---

## 8 · Commands

```
node agent/policy/cli.mjs governance          what is switched on, by whom, until when
node agent/policy/cli.mjs policy              the policy in force, and the base beside it
node agent/policy/cli.mjs grant  --by "<person>" --authority "<why>" --until <date> \
        --categories a,b --paths p,q --fields data/x.json:f1|f2
node agent/policy/cli.mjs revoke --grant <id> --by "<person>" --authority "<why>" --until <date>

node agent/autonomy/cli.mjs status            what is on, and what it has done
node agent/autonomy/cli.mjs survey [--all]    what could run automatically right now
node agent/autonomy/cli.mjs run --as-of YYYY-MM-DD [--proposal <id>] [--execute]
node agent/autonomy/cli.mjs actions [--json]  every attempt, merged, reverted and refused
node agent/autonomy/cli.mjs rollback --action <id>
```

`run` without `--execute` writes nothing. `rollback` prints; undoing a merged change is a
person's decision.

**In the Control Room:** the Autonomy tab, `GET /api/autonomy`, behind `autonomy:read` — held
by every role that holds `live:read`. There is no route that records a grant, revokes one,
triggers a run or rolls one back, and **the absence is the control**: an interface that could
switch autonomy on is an interface a bug in that server could switch autonomy on through.
