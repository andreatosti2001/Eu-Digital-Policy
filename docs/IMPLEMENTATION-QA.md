# Implementation and QA — Agent 9

**SESSION 18.** `agent/implement/`.
**Status:** operational, and it has implemented nothing. That is the correct result and §5
explains why.
**Read with:** `docs/AUTONOMY-POLICY.md` (the four classes), `docs/AGENT-ROLES.md` §8 (the
role), `docs/BROWSER-QA.md` (the gate it enforces).

---

## 1. It is Agent 9, not Agent 8

SESSION 18's brief calls it Agent 8. Agent 8 is the UX/UI Auditor, built in SESSIONS 16 and
17. The brief's numbering predates it, exactly as SESSION 13's and SESSION 16's did.
Recorded rather than resolved by renumbering somebody else — this is now the third session to
make the note, and reconciling the numbering is a governance decision, not an implementation
detail.

---

## 2. What it does

It is the only specialist that may write to the repository. Everything upstream ends in a
proposal behind a pending approval; this is the first agent whose output is a *decision about
whether to act*.

```
node agent/implement/cli.mjs queue [--all] [--why]
node agent/implement/cli.mjs preflight --proposal <id>
node agent/implement/cli.mjs boundary
node agent/implement/cli.mjs check --as-of YYYY-MM-DD
node agent/implement/cli.mjs decide --proposal <id> --grant|--deny --by "<person>" [--note "…"]
node agent/implement/cli.mjs run --as-of YYYY-MM-DD [--proposal <id>] [--apply] [--dry]
node agent/observability/cli.mjs implement [--refusals]
node --test agent/implement/selftest.mjs      # 54 tests
```

**The default is to write nothing.** `run` without `--apply` rehearses: it verifies the ten
gates, computes the edit, runs the checks and produces the reports, and touches no file.
`--apply` is the only thing that writes, and it still refuses everything that is not
approved. An agent whose safe mode is the one nobody selects is not safe.

| File | What it owns |
|---|---|
| `baseline.mjs` | the recorded baseline, **parsed** out of `docs/CURRENT-ARCHITECTURE.md` §12 |
| `ledger.mjs` | where an approval actually lives, and the four forgeries it refuses |
| `preflight.mjs` | the ten gates |
| `scope.mjs` | the permitted set, derived; and enforcement against git afterwards |
| `boundary.mjs` | the public website / private control plane check |
| `checks.mjs` | validators, agent suites, contract check, browser QA, boundary → `QAResult` |
| `apply.mjs` | the change context, the exact edit, the diff, and the verified way back |
| `implementer.mjs` | Agent 9 |

---

## 3. Where an approval lives — the hardest sentence in the brief

> The approval state MUST be treated as governed system state. Do not rely on a prompt
> instruction, filename, comment, frontend state, or manually supplied flag claiming that a
> proposal is approved.

**The problem.** Thirty-five proposals exist in the record store today (seventy-one across
four agents when every producing agent has run), each behind an `ApprovalRequest` whose
`state` is `requested`. Those records live in `agent/records/*.jsonl` — **written by agents**,
and git-ignored. An agent that wanted an approval could append a record with
`state: "granted"` and a `decision` block naming anybody.

**So an `ApprovalRequest` found in the agent record store is read as a REQUEST and never as a
GRANT**, whatever its `state` field says. `deriveApproval()` discards agent-written decisions
explicitly and **reports having done so** — silently ignoring them would look identical to
not having checked.

**A grant lives in `agent/implement/decisions/decisions.jsonl`.** A separate directory,
git-**tracked** rather than ignored, written by exactly one code path — `cli.mjs decide` —
which requires a named human. Four properties follow:

- **One home.** A grant exists in one place or it does not exist.
- **Content binding.** Each decision records the sha256 of the proposal it decided. Edit the
  proposal afterwards and the hash no longer matches: the approval is **void**, not carried
  onto a scope nobody agreed to. This is what stops *approve something small, then widen it*.
  The fingerprint deliberately excludes `trace_ref` and `created_at`, so re-running a
  producing agent over an unchanged corpus does not void a grant it would be impossible to
  keep.
- **No self-approval.** A decision whose `decided_by` names *any* agent in the system is
  refused at write time **and again at read time** — a check that runs only on write protects
  only the file that process wrote.
- **Attribution.** The file is in git. Who added the line, and when, is a commit.

### The seven approval states

`no_request` · `pending` · `granted` · `denied` · `void_scope_changed` ·
`void_self_approved` · `void_unknown_proposal`

**Only `granted` is implementable.** Each of the others is a different fact and none collapses
into another.

### What this is NOT — stated plainly rather than implied

**It is not authentication.** §11 and §13 of the governance protocol require an authenticated
actor and server-side enforcement. This repository is a static site with no server, no
session and no identity provider, and anybody who can write to the working tree can write a
line in the ledger. What the ledger gives is a single, hashed, git-attributable home for a
decision and a refusal of the four forgeries that do not require write access. **The gap is
real** — it is open question 1 in §9 — and closing it needs the Control Room of SESSION 21,
not a comment claiming it is closed.

---

## 4. The ten gates

All ten run, always. Stopping at the first failure would be cheaper and would produce a worse
report: a proposal that fails four gates should be told so once rather than four times a day
apart. **Every gate is mechanical** — each returns pass or fail from something read out of
the record, never from a judgement about it. **None can be passed by argument**: `preflight`
takes a proposal id and a context of stores, and has no `permittedFiles`, no `skip` and no
`assumeApproved`. A permitted set the caller can supply is a permitted set the caller can
widen, and the caller is the thing being constrained.

| Gate | Refuses when |
|---|---|
| `proposal_exists` | no record store holds that id. An id in a prompt is not a proposal. |
| `proposal_valid` | the record no longer satisfies its own contract, **re-checked now**. A simulated record is refused: a fixture is never actionable. |
| `approved` | the derived approval state is anything but `granted` |
| `approval_attributable` | the decision lacks who, when, or what exactly they approved — or the fingerprint no longer matches |
| `scope_defined` | no operations, no summary, or an operation with a null `proposed` value |
| `permitted_files_defined` | no path can be derived, or a path is one this agent may never write |
| `provenance_complete` | no evidence at all, or a blocking open question |
| `required_tests_defined` | a change to data, markup, styles or scripts that does not name all four validators |
| `risk_defined` | `risk` or `autonomy_class` is missing |
| `rollback_available` | the rollback plan has no method, no steps, no verification — or is `not_reversible` |

**Every failure names what would close it.** A refusal that does not is a refusal nobody can
act on.

### The paths no approval can reach

`scope.mjs` `NEVER_WRITABLE` is narrower and stronger than the red tier — red-tier work can
be proposed and then approved. These are things an approval cannot authorise *this agent* to
do, because doing them mechanically is the harm:

- `tools/_refsweep.mjs` and `tools/_review10.mjs` — Class D, destructive on execution
  (`AUTONOMY-POLICY` §3, AUDIT F-03). Editing one is how it gets run.
- `agent/implement/decisions/` — an agent that can write its own approvals is not governed
  by them.
- `agent/schemas/` — an agent that can edit the gate has bypassed it.
- `.git/`, `.github/workflows/` — history, and what runs with a write token.

---

## 5. What it did: 35 refusals and 0 implementations

Run against the real record store on 2026-09-03, with proposals from `agent/ux/`,
`agent/architect/` and `agent/proposals/editorial/`:

```
35 proposal(s) considered · 0 implemented · 0 reverted · 35 refused

approved                35    nothing in the ledger has decided any of them
approval_attributable   35    there is no decision to attribute
scope_defined           35    every operation carries a null "proposed" value
provenance_complete     35    every proposal carries a blocking open question
```

**This is the deliverable, not a degraded mode.** An implementation agent whose first run
implemented something would have found an approval that does not exist. And the second and
third rows are worth reading twice: `agent/ux/` and `agent/proposals/editorial/` *deliberately
draft no value* — they name a problem and leave what the site should say to the repository
owner — and every record they write carries README limitation 7 as a blocking open question.
Those proposals are **not implementable by anyone until a person writes the value and does
the manual pass**, and the gates say so by name rather than failing generically.

The happy path is exercised in `agent/implement/selftest.mjs` against a throwaway git
repository: open a context, apply, diff, roll back, and **verify** the rollback by re-hashing
every permitted path. It is exercised there and not here because granting an approval is a
human act, and this session has no authority to perform one.

---

## 6. The public/private boundary — a standing finding, not a control

SESSION 18 wants an agent that will not let the public website expose Control Room
credentials, privileged endpoints, approval mechanisms or operational traces.

**There is no separation mechanism in this repository.** Deployment is GitHub Pages serving
`main` at the repository root (`CURRENT-ARCHITECTURE` §13). There is no `_config.yml`, no
`.nojekyll`, and no exclude list. Under that configuration the units of publication are files
in the repository, so `agent/`, `docs/`, `tools/` and the approval ledger are part of the same
deployment as `index.html`. **A Control Room page added to this tree in SESSION 21 would be
public the moment it was pushed** — and protocol §10 says so itself: hidden routes, hidden
links, robots.txt, frontend checks and unlisted pages are not security mechanisms.

**Established vs. inferred, kept apart.** That there is no `_config.yml`, no `.nojekyll` and
no exclude list is **read from the tree**. That the live site therefore serves `agent/` is an
**inference** from GitHub Pages' documented default, and it has **not** been confirmed by
fetching the deployed site: outbound access to `andreatosti2001.github.io` is refused by this
environment's network policy, exactly as `CURRENT-ARCHITECTURE` §13 records. Every record the
check produces carries that as an open question.

**The scan, and its two surfaces.**

- **The website surface** — the seven pages, `js/`, `css/`, `data/`, `i18n/`, `fonts/`,
  `app.js`, `style.css`: 60 files a reader's browser loads. A credential here is an **error**,
  unconditionally. There are none.
- **The rest of the published tree.** Eight credential shapes today, all of them **deliberate
  synthetic credentials in the fixtures that prove `agent/observability/redact.mjs` works** —
  a suite that tests redaction has to contain something to redact. They are **classified and
  counted, never suppressed**: deleting them would weaken a test to make a check pass, which
  `AUTONOMY-POLICY` prohibits under every class, and allow-listing the files would hide a
  real key added to one of them next week. A real credential added to a fixture file appears
  here too, and the count rising is the finding.

**The scan is a floor.** It matches known credential *shapes*. A credential it does not match
is a credential it did not find; it reads only text files, so a key inside a font or an image
is invisible to it. "The secret scan passed" is the kind of sentence that gets quoted later as
if it had proved something.

**Every match is redacted in the output.** A boundary check that prints the credential it
found has published it into the run log, the CI artifact and the pull request.

---

## 7. The checks, and the baseline they are measured against

The baseline is **parsed** out of `docs/CURRENT-ARCHITECTURE.md` §12, not retyped. A constant
here would be the second home this project's architecture exists to prevent: two copies of the
numbers, one of which drifts the first time somebody does the verification work. If the
document's fenced block is restructured so it can no longer be read, `readBaseline()` **throws
rather than falling back to a plausible default** — a wrong baseline is inherited by every
later comparison and nothing downstream can tell.

Three verdicts, not two. `at_baseline` · `regression` · **`below_baseline`** — four
`design-qa` warnings where five are recorded means something was fixed **or a check stopped
firing**, and the second is what AUDIT F-10 found once already. It is not treated as a clean
pass until somebody says which.

The QA layer **does not summarise**: `output_excerpt` carries the lines that matter verbatim.
A QA layer that paraphrased a validator would be the single easiest place in this system to
launder a failure.

**Browser QA cannot be silently skipped.** A change touching `js/`, `css/`, `style.css`,
`app.js`, `i18n/` or any `.html` requires it. If it was required and did not run, that is a
**blocking finding** whatever the four validators said — and the `QAResult` contract then
refuses a verdict of `pass` over it. SESSION 18 requirement 7 is implemented at that pair of
places, not asserted.

**It reverts itself.** `AUTONOMY-POLICY` Class B's condition is that a change is fully
reverted if any validator fails. This agent applies it to every class: if the checks come back
worse than the recorded baseline, or the change left its approved scope, it is rolled back
before the run returns, the rollback is **verified by re-hashing**, and the `QAResult` says
so. A failed change that stayed in the working tree would be a change nobody decided to make.

**It never deploys.** `ChangeRecord.state` reaches `applied` and stops.

---

## 8. The eight regression tests SESSION 18 requires

`agent/implement/selftest.mjs`, 54 tests. The eight are labelled `R1`–`R8` in its order.

| | Proves |
|---|---|
| R1 | unapproved proposals cannot be implemented — including against the **live** record store, which refuses everything in it today |
| R2 | approval state cannot be forged: an agent-written grant is discarded and reported; a self-approval is void at read time as well as write time; a decision for a non-existent proposal is void; **editing the proposal after the grant voids it** |
| R3 | implementation cannot exceed approved scope: derived, not supplied; refused at apply time; enforced against git afterwards; the one-shot patch scripts are never in scope; a context refuses to open on `main` or over an already-dirty path |
| R4 | no credential in any file the website loads — **and a planted one is caught**, so the scanner is not vacuous |
| R5 | the check reports that this repository has no public/private separation, keeps established apart from inferred, and asserts that a Control Room page dropped in the tree **would** be published |
| R6 | the baseline is read not retyped and throws rather than guessing; a proposal missing a validator fails the gate; a warning above baseline is a fail; a validator that could not run is exit 127 |
| R7 | browser QA is required for the paths that need it, and a required run that did not happen is a non-zero check that `verdictFor` reads as a fail |
| R8 | provenance cannot be removed: emptied evidence fails the gate, a blocking question blocks, the proposal is re-validated at implementation time, and stripping the "how" from a `QAResult`'s verdict makes the contract refuse it |

---

## 9. Open questions

1. **The ledger is not authentication.** §3. Anybody who can write to the working tree can
   write a grant. Closing this needs the Control Room of SESSION 21 with a real identity
   provider and server-side enforcement, which a static site cannot host. **The strongest
   thing available today is a single hashed home plus git attribution, and that is what is
   built.**
2. **Nothing has confirmed what the deployed site serves.** §6. The network policy refuses
   the live origin.
3. **No proposal in this repository has ever been decided.** Thirty-five refusals is a
   measurement of that, not of a defect in the proposals.
4. **The workflow is not a deploy gate.** `.github/workflows/qa.yml` makes a failure visible.
   A push to `main` still publishes.
5. **`GOVERNANCE_PERMITS` is empty**, so no proposal can be automatically actionable under
   `docs/REGULATORY-IMPACT-MAPPING.md`'s route. This agent reads approval from the ledger and
   would need a second, separate path to honour a permit; it does not have one, and inventing
   one before a permit exists would be building a door into a wall nobody has decided to put
   an opening in.
