# HANDOVER

**Last updated:** SESSION 26 · 9 September 2026
**Branch:** `claude/limited-autonomy-activation-ovbrf7`, cut from `origin/main` at the
SESSION 25 merge.

---

## SESSION 26 — limited autonomy, activated

**What was asked:** enable automatic implementation for explicitly approved low-risk
categories only; for every automatic change create an isolated branch, implement, run the
validators, run browser tests where applicable, record a full observation trace, merge only if
all policy conditions pass, and retain rollback information; do not let substantive legal
content auto-merge; report every autonomous action in the Control Room. Full report:
**`docs/LIMITED-AUTONOMY.md`**.

**The governance decision has a home, and it is not the policy object.** SESSION 23 left every
category off because filling `DEFAULT_POLICY.enabled_categories` is a governance change
protocol §24 forbids the system making to itself. SESSION 26 is that decision arriving from
the repository author, and it is recorded as a **grant** in
`agent/policy/governance/grants.jsonl` — git-tracked like the decision ledger, because an
authorization has to be attributable — naming a person, a date, an authority quoted from the
brief, and an expiry of 9 March 2027. **`DEFAULT_POLICY.enabled_categories` is still `[]`, and
four suites still assert it at their original strength.** That is the BASE; the policy in
force is derived from the ledger by `policyInForce()`. Appending five strings to a frozen
array would have been a fact with no author and a second home for one fact.

**What the grant enables, and it is narrower than the brief allowed.** The five protocol §20
categories, over exactly two paths — `data/sources.json` and `docs/` — and, on the first,
exactly eight bookkeeping fields. The path allowlist is the real narrowing and the FIELD
allowlist is what keeps substantive legal content out of an enabled category: `tier`, `role`,
`supports`, `last_verified`, `verification_note`, `requires_verification`, `reference_gap`,
`gap_note`, `title`, `publisher`, `type` and `celex` are on a never-automatic list no grant
may name. Risk ceiling `low`, environments `local` and `ci`, **never `production`**. Every one
of those refusals runs again on every READ, and `agent/autonomy/selftest.mjs` test 7 writes a
forged line straight into a ledger file and asserts nothing it names is honoured.

**What a grant bought: exactly two of `preflight`'s ten gates.** `approved` and
`approval_attributable`, and nothing else — SESSION 18's own header already said "an
authorized human OR an explicitly permitted autonomy policy" and left the second half unbuilt.
`preflight` is not modified and not weakened. `agent/autonomy/` adds six gates in front of it,
all evaluated always, and the seven steps behind it.

**THE FIRST REAL RUN REFUSED ALL FOURTEEN PROPOSALS, EACH BY FOUR INDEPENDENT GATES.** Data
Depth and the Gap Proposals router ran against the real corpus (57 gaps, 14 `DataProposal`s);
`node agent/autonomy/cli.mjs run --as-of 2026-09-09` reports **0 merged · 0 reverted · 14
refused**, real trace `44b4813604b011a1a490761191704ad8`. Thirteen derived
`substantive_data_change` and one `taxonomy_change` — none is one of the five enabled. The
field gate fired on a real proposal whose operation target named `verification_note`, which is
the record of what was and was not established. Nothing in `data/`, `i18n/`, `js/`, `css/` or
any page was changed, and all fourteen ledger lines record `wrote_files: false`.

**What it did NOT do, and this is the limitation to carry.** **No autonomous change has ever
merged anything.** The gate ladder and the rehearsal path run against real proposals, and the
git mechanics of steps 1 and 6 are driven against a real temporary repository created with
`git init` (`agent/autonomy/selftest.mjs` tests 34–37: main is refused, an unrelated dirty
file is not swept into an autonomous commit, the merge is `--no-ff` with two parents and
`main` does not move, and `abandon` is idempotent and does not discard work it never touched).
The full seven steps have never run end to end with `--execute` against a proposal that
passed, because **nothing in this repository currently produces a proposal in one of the five
enabled categories** — and manufacturing one to demonstrate the mechanism would be a fixture
dressed as work.

**Three existing assertions changed, all because the world changed, and each is named here so
a reader can disagree.**

| | |
|---|---|
| `agent/orchestrator/selftest.mjs` R6 | Read "no action category is approved for automatic execution" and asserted `category_allowed` refused `source_metadata_maintenance`. A person has since granted that category. The replacement keeps all three original claims and adds two: a category no policy may EVER automate is refused **even under a hand-made policy object whose enabled list names it**, and the granted category satisfies that one condition while the act as a whole is still refused. The second of those caught a real weakness — the condition was a plain `includes()` and would have passed such a policy, leaving the engine as the only thing between a forged policy object and a legal interpretation. `agent/orchestrator/policy.mjs` now reads `automatable` first. |
| `agent/policy/selftest.mjs` 33 | Asserted the Orchestrator asks the engine about `DEFAULT_POLICY`. It now asks about the policy IN FORCE, because an Orchestrator enforcing a weaker policy than the implementation layer is exactly the drift that test exists to prevent. The replacement asserts the in-force id **and** that it begins with the base id, so a grant extends the base rather than replacing it. |
| `agent/implement/selftest.mjs` R6 | `AGENT_SUITES.length` 19 → 20. Sixth catch. |

**`agent/orchestrator/policy.mjs`'s `AUTONOMY_NOTE` became a false statement and is now
derived.** It said "No action category is approved for automatic execution in this
repository", which was true when written. `autonomyNote()` reads the ledger;
`AUTONOMY_BASE_NOTE` keeps the base statement.

**A fourth assertion changed, and it is the SESSION 19 shape — a check that passed for the
wrong reason.** `agent/simulation/selftest.mjs` test 1b's own comment said "the assertion is
that THIS run added nothing", and its code asserted that `agent/records/`,
`agent/observability/runs/`, `agent/orchestrator/state/` and `.control-room/state/` were
EMPTY. Those are different claims. `agent/records/` is git-ignored run state that any agent
run populates, so the test passed in a fresh clone and in CI and failed the moment this
session ran Data Depth first to give the autonomy layer something to refuse. It now
snapshots, runs, and compares — which is **stricter**: the old form could not have caught a
simulation writing into a directory that already held a file. This is a change to a check,
which is Class C, and it is recorded here so a reader can disagree with it.

**Two CI omissions were fixed rather than only reported**, and the fix is named because it is
a change to a gate: `.github/workflows/qa.yml` ran seventeen suites while `AGENT_SUITES`
listed nineteen — `agent/simulation/selftest.mjs` had never been in CI. Both it and
`agent/autonomy/selftest.mjs` are in now, plus a register step printing what limited autonomy
is switched on to do on every push.

**Everything was re-run after `git add`, not before.** **1036 tests across twenty-one suites,
0 failures** (998 across twenty before; the autonomy suite adds 38, and three earlier tests
gained assertions rather than counts — the orchestrator's R6 split into three claims). 18/18 contracts
satisfiable. The four validators at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors
on `validate.mjs` and `i18n-audit.mjs`, 0 errors and the same five `design-qa` warnings by
file and line, 106 unverified records. `agent/implement/cli.mjs boundary` at **0 blocking / 13
warnings**, unchanged, with `agent/ is inside the public surface` at 225 files where SESSION
23.5 recorded 204 — this session's files being counted. `.control-room/cli.mjs boundary` at 0
errors, **22 routes** (21 before, the new one being `GET /api/autonomy`), 8 public, 0
production controls. The browser suite in a real Chromium: **125 pass · 3 fail · 2
undecidable**, the same three SESSION 19 defects, untouched.

**`freshness.mjs` still exits 1** on the same "1 item(s) need attention" SESSIONS 24 and 25
both recorded, so `agent/implement/cli.mjs check` reports verdict `fail` for that reason and
that reason alone. It is not this session's regression and it is not fixed.

**What SESSION 27 inherits.** Limited autonomy is on and has merged nothing. The gap between
those two facts is the whole of the next objective: either an agent that produces a proposal
in one of the five enabled categories, or a person handing one to `--execute` by hand. Until
then the honest statement is that the permitting half is proved against fixtures and the
refusing half against the real corpus. Also inherited: `agent/policy/` is on the
never-automatic path list on purpose, so widening the grant is Class C work in front of a
person, not something the system can do to itself.

---

## SESSION 25 — the first controlled real-world run

**What was asked:** run the whole pipeline OBSERVE + PROPOSE ONLY against the small, already
-registered set of real EU sources (`agent/scout/authorities.mjs`), through discovery,
verification, change detection, gap identification, affected-page and editorial/UX implications,
Control Room discovery impact, QA simulation and the full trace, ending in a prioritized human
review queue. Full report: **`docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`**.

**What happened at the network boundary, and it is the headline finding.** `agent/scout/cli.mjs
--live` attempted all five registered endpoints (EUR-Lex, the Commission's digital-strategy
site, EDPB, EDPS, ENISA) for the first time this project has ever asked it to. **All five were
refused by this environment's own egress policy** — confirmed independently with `curl` and
`WebFetch` against the same hostnames, neither of which is part of this repository. The Scout
recorded five `retrieval_blocked` gaps, real trace `3431281084fa9129b4689b82cb7043e8`, and
invented nothing. **This turns U-23.5-01 and AUDIT F-12 — "the deployed origin has never been
fetched, the network policy refuses it" — from an inference into a measurement**, for the first
time. Verification, integration and live-path change detection chained off that trace and
correctly found nothing to do (§3 of the report) rather than falling back to the mock corpus.

**What ran against the real corpus and real pages, and found real findings.** Data Depth (57
gaps), the Knowledge Architect (20 findings, all eight questions answered yes), the Gap
Proposals router (14 `DataProposal`s + 22 refused-and-named), Editorial (22
`editorial_recommendation`s over 387 real prose blocks), UX/UI (10 findings, 1 critical), and a
real-Chromium Browser QA run (125 pass · 3 fail · 2 undecidable — the same three SESSION 19
defects, unchanged). **48 proposals now sit in the record store, 0 decided, 0 routable to
implementation** — `agent/orchestrator/cli.mjs survey` refuses every one by the same four
`preflight` gates, which is those gates working as designed on records nobody has approved.

**The hidden Control Room entry was evaluated as instructed and found one relevant finding.**
`js/threshold.js` implements the modal/dialog contract independently of `js/dialog.js` and
`app.js` — an accessibility-consistency finding (`prop-ux-two-implementations-a364f0ff9dd6`),
explicitly **not** a security finding. Nothing else in this run's records touches search
behavior, hidden-entry detection, animation, Control Room login routing, the public/private
boundary, or a privileged interface. `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` §6.

**What it changed:** nothing in `data/`, `i18n/`, `js/`, `css/` or any page.
`git status --porcelain` was empty throughout, checked before this document was written. The
four validators are at the recorded baseline (0 errors, 106 unverified, 5 `design-qa`
warnings), both boundary checks are unchanged (0 blocking / 13 and 0 / 0), and
`agent/implement/decisions/decisions.jsonl` remains empty. A curated, prioritized review queue —
not all 48, by instruction — is in the report's closing section, ready for a human decision.

**CI on this push (`cdfe375`) reports `failure`, and that is not this session's regression.**
Checked against the actual GitHub Actions run rather than left to local exit codes: two of six
jobs fail — `freshness.mjs` exiting 1 on the same "1 item(s) need attention" reported above, and
the browser suite failing on the same three pre-existing defects already named. The immediately
preceding push, SESSION 24's `341ff39`, fails CI in the identical two jobs at the identical
steps. `AGENTS.md` already says this workflow "is not a deploy gate." Report:
`docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` §7.

**The one thing SESSION 26 inherits that is new:** the network boundary in §2 of the report is
now a measured fact about *this* environment rather than a documented default. It will
reproduce identically on a rerun here. Advancing step 1 needs either a different network policy
or a person retrieving one document by hand and handing its text to the Verifier via
`--records`.

---

## SESSION 24 — the first end-to-end run, in simulation

**What was asked:** run one complete simulated cycle across the whole agent graph, produce
an end-to-end trace, simulate the hidden Control Room discovery flow as a separate
UX/security path, define the intended visual sequence without implementing it, and then
identify what is missing, ambiguous, redundant, unvalidated, misrouted or insecure —
**without fixing any of it.**

**What was built:** `agent/simulation/`, nine files, twenty tests. It wires twelve
**simulated** specialists into the real Orchestrator and walks eight of the ten workflow
types once, with a real `.control-room/` process on the authorization leg — a real login, a
real authorization refusal for the wrong role, a real fingerprint check, a real CSRF
refusal, and one real ledger line written into a temporary decision directory.

**What ran for real:** the event intake and its stripping, classification, the capability
register and every grant, every handoff check, H3, the contract gateway, all six conflict
detectors, the provenance and rollback gates, the twelve autonomy conditions, the journal,
the tracer, `preflight`'s ten gates, the ledger, and the Control Room's seven decision gates.

**What was simulated:** the eleven specialists' domain reasoning. **No source was read, no
page was opened by a specialist, no dataset was examined, no sentence was judged.** A green
leg means the machinery routed a fixture.

**What it changed:** nothing, measured. `agent/simulation/world.mjs` fingerprints all 362
files in the working tree before and after; test 1 asserts the difference is empty and that
the real decision ledger still holds zero lines. **Not one proposal in this repository has
ever been decided, and this run did not change that.**

**What it found: twenty-three findings, none fixed.** `docs/FIRST-END-TO-END-AUDIT.md`. The
four to carry:

| | |
|---|---|
| **V-1** | `orchestrator.mjs:495` calls `receive(record, { allowSimulated: true })`, hard coded. **Every workflow admits a simulated record** and routes it to a person. Only `preflight` gate 2 stops one, and that runs on `IMPLEMENTATION_REQUEST` alone. |
| **V-3** | **The rollback gate has never examined a record.** On `IMPLEMENTATION_REQUEST` every stage before it is a gate, so it receives `[]` and passes; on `QA_FAILURE` it receives a `QAResult`, which has no `proposed_change` and is skipped. The trace reads *"0 rollback plan(s), each naming a method, steps and a verification"*. |
| **V-2** | **Nothing re-checks a `ChangeRecord`'s files against the approved scope after the dispatch.** Leg 6 approved a proposal scoped to `index.html` and admitted a `ChangeRecord` declaring a change to `tools/simulated-check.mjs`. `apply.mjs` still enforces the permitted set against git, so the site is protected — the Orchestrator's own record of what happened is not. |
| **I-1 / I-2** | Two conflict detectors have **no ordering constraint and no sibling exclusion**. Leg 1's trace names the upstream agent as the downstream one; leg 2 refused a workflow because one agent's proposal "softened" the blocking question in the `ApprovalRequest` it returned in the same call. |

**The discovery flow.** All six separations were measured and hold: the animation is separate
from authentication, authorization, approval, orchestration, execution and deployment.
`js/threshold.js` imports nothing at all. The real browser suite ran the nine threshold
checks in a real Chromium and all nine pass — including that opening the passage issues **no
network request of any kind**, and that the wheel draws 3 rings and 22 letters.

**The visual sequence** is declared as data in `agent/simulation/threshold.mjs`
(`VISUAL_SEQUENCE`), so intended-versus-actual is a comparison a machine performs. Three of
six phases do not match, and **one of the three must stay unmatched**: the brief's phase 6
("reveal CONTROL ROOM followed by the normal authentication interface") must never be
implemented as a login form on the published page. That would be a credential prompt in the
public tree. The refusal is written into the specification's own `must_not`, and
`selftest.mjs` test 6 asserts no page in the repository carries a `type="password"` field.

**The suite list grew to nineteen**, which `agent/implement/selftest.mjs` R6 caught for the
fifth time. **998 tests across twenty suites**, all passing. The four validators are at the
`docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors, 106 unverified, 5 design-qa warnings.
The browser suite is at its recorded state: the same three known failures (issues 25, 27 and
28) and two undecidable, none of them touched.

**Nothing in `data/`, `i18n/`, `js/`, `css/` or any page was changed, and no finding was
repaired.** Protocol §25 asks this session to observe and document rather than silently
repair, and a suite that pinned a defect would turn it into a requirement.

---

## SESSIONS 22, 23 and 23.5 — carried forward

**Branch:** `claude/agent-governance-protocol-gfbgfb`, cut from `origin/main` at `c43b7a9`,
with `claude/agent-governance-protocol-tx6mu1` (SESSION 22) merged into it. **Merged into
`main` at `8f1b411`.**

**WHAT THIS BRANCH NOW CARRIES.** Three sessions, on one tree:

- **SESSION 22** — the Master Orchestrator, `agent/orchestrator/`. It was written on a
  sibling branch cut from the same base and had never been merged. **An earlier version of
  this handover said it had never been built. That was wrong**, and the correction is kept
  below rather than edited away.
- **SESSION 23** — the executable autonomy and authorization policy, `agent/policy/`.
- **SESSION 23.5** — the adversarial verification gate, `agent/policy/verify/`.

**THE AUTONOMY POLICY NOW HAS ONE HOME, AND IT IS `agent/policy/`.** The two branches had
each implemented protocol §18's twelve mandatory conditions, §19's triggers, the §20 low-risk
categories and an empty approved-category list. That is a second home for one fact. The merge
resolved it in the direction protocol §14 states — the Orchestrator's responsibilities are
workflow state, routing, handoffs, conflict detection and **policy enforcement**, not policy
definition — so `agent/orchestrator/policy.mjs` now re-exports:

| Was a literal in the Orchestrator | Is now a view onto |
|---|---|
| `MANDATORY_AUTONOMY_CONDITIONS` | `agent/policy/conditions.mjs` `CONDITIONS` |
| `LOW_RISK_CATEGORIES` | `agent/policy/categories.mjs` `AUTOMATABLE_CATEGORIES` |
| `APPROVED_AUTONOMOUS_CATEGORIES` | `DEFAULT_POLICY.enabled_categories` — still empty |

**The two lists had already drifted, which makes the argument without anyone having to
make it.** SESSION 22 had all five of protocol §20's low-risk categories; SESSION 23 had four,
because `governed_metadata_maintenance` had been missed. The fifth is now in
`ACTION_CATEGORIES`, and the test that asserted "protocol §20 names four" — which was simply
wrong — asserts five and says why. Seven of the twelve conditions were spelled differently on
the two sides; `agent/policy/`'s spellings win because they are what `evaluate()` returns and
what the verification gate attacks. Four test names in SESSION 22's suite were renamed with
them, and **every assertion keeps exactly the strength it had.**
`agent/policy/selftest.mjs` test 32 is the drift check `docs/DATA-GOVERNANCE.md` §5 requires,
and gate attack AB-10 is the same check from the outside.

**SESSION 23's OTHER HALF IS NOW DONE.** Its brief says "the implementation layer **and
Orchestrator** must enforce it mechanically". Only the implementation layer did, because the
Orchestrator was not in the tree. `autonomyPermits()` now calls `agent/policy/engine.mjs` as
well and `permitted` requires both to agree. **The first version of that wiring was wrong in
an instructive way**: it asked the engine about the Orchestrator's own act of *enforcing* the
policy, which is a read, so `evaluate()` routed straight to `automatic` having checked nothing
and came back permitted. Policy test 33 now asserts the engine reported *which* conditions it
refused on, because a refusal with an empty verdict is a refusal that did not look.

**A CORRECTION TO THIS SESSION'S OWN REPORTING, AND IT MATTERS.** SESSION 23.5's commit said
"909 tests across eighteen suites, 0 failures". **`agent/implement/selftest.mjs` R4 was RED on
this branch as pushed, and on SESSION 22's branch as pushed, independently.** The suites were
run before staging, and `publicSurface()` reads *tracked* files — so the credential scan could
not see files that were not yet committed, and R4 went green for the wrong reason. Verified
after the fact in clean worktrees at `e6f2715` and `74e9a4a`: both report `54 pass · 1 fail`.
**Run the suites after `git add`, not before.**

Both blocking hits are fixed at source, and none of them by touching a pattern:

- `docs/HANDOVER.md` no longer reproduces the test passphrase literal. `docs/` is inside the
  published surface, and R4 caught SESSION 21's draft handover for exactly this.
- `agent/policy/verify/harness.mjs` is classified as the test fixture it is —
  `TEST_FIXTURE_PATHS` gains it. Classification is not suppression: the hit is still found,
  reported and counted, at warning severity beside the other ten. **This is a change to a
  check, which is Class C**, and it is recorded here so a reader can disagree with it.
- `agent/orchestrator/approval.mjs` had two call sites writing object syntax whose key and
  value were the same privileged account name, which the `default-credentials` pattern reads
  as a credential pair. The call sites changed; **the pattern did not.** Narrowing it to
  exclude a same-word pair would blind it to the exact pair protocol §11 names as forbidden.
  The over-firing is recorded as a finding in
  `docs/SECURITY-VERIFICATION-2026-09-08.md` instead.

**Everything was re-run on the merged tree, after staging this time.** Nineteen suites
(**978 pass, 0 fail**), the contract check (18/18 satisfiable), the four validators at the
`docs/CURRENT-ARCHITECTURE.md` §12 baseline (0 errors, 106 unverified, the same five
`design-qa` warnings), the browser suite (125 pass, the same three pre-existing defects), both
boundary checks, and the verification gate.

**The boundary check reports 0 blocking / 13 warnings**, where SESSION 21 recorded 11. Two
were added: this session's test passphrase in `agent/policy/selftest.mjs`, and the same
constant in `agent/policy/verify/harness.mjs`. `agent/ is inside the public surface` moved
from 180 files to 204, which is SESSIONS 22, 23 and 23.5 being counted.

**THE ONE-OFF TEST FAILURE WAS FOUND, IDENTIFIED AND FIXED — AND IT WAS NOT A FLAKE.**
An earlier version of this handover recorded a `.control-room/selftest.mjs` failure that had
been seen once and never reproduced, with its name uncaptured. It reappeared while merging to
`main`, and this is what it was:

```
15 · a session is a server-side record; nothing a client can write becomes one
    a forged cookie was accepted: cr_session=...   200 !== 401
```

That message reads as a session-forgery breach. **It was not one.** The test builds six
client-side forgeries, and the third is the real session token with its last character
replaced by `A`:

```js
`cr_session=${real.cookie.split('=')[1].slice(0, -1)}A`   // "one character changed"
```

**Whenever the real token already ends in `A`, that is not a forgery — it is the real
cookie**, and the server returned 200 because it was correctly accepting its own valid
session. Measured rather than assumed: 3 of 40 logins produced a token ending in `A`.
`.control-room/selftest.mjs` now replaces the final character with one that differs from it,
so the assertion is meaningful on every run instead of on most of them.

**The evidence that it is fixed is the construction, not the runs.** Eighteen consecutive
runs pass, and eighteen runs would not settle it on their own: at a 7.5% failure rate, an
unfixed test survives eighteen runs about a quarter of the time. What settles it is that
`mutateLastChar()` returns `'B'` when the last character is `'A'` and `'A'` otherwise, so the
mutated token can no longer equal the original for any input.

Two things worth carrying forward. **The Control Room was never wrong here** — no session
forgery was ever possible, and the other five forgeries and the four spoofed identity headers
were refused on every run including the failing ones. And **the earlier handover's refusal to
call it a flake was right**: it was a real defect with a probabilistic trigger, and calling it
noise would have left a security assertion silently passing for the wrong reason about once in
every thirteen runs.

---

## Current milestone

**SESSION 22 — complete and merged into this branch.** The Master Orchestrator,
`agent/orchestrator/`. The reference document is **`docs/ORCHESTRATOR.md`**.

**SESSION 23 — complete.** The executable autonomy and authorization policy,
`agent/policy/`, which is now the **one home** for the policy vocabulary. The reference
document is **`docs/AUTONOMY-AUTHORIZATION-POLICY.md`**.

**SESSION 23.5 — complete.** The adversarial verification gate, `agent/policy/verify/`:
**69 attacks, 66 failed safely, 0 succeeded, 2 partial, 1 undecidable.** The report is
**`docs/SECURITY-VERIFICATION-2026-09-08.md`**. **Two findings stand and neither was
fixed.**

---

# SESSION 23 — the policy, executable

## What was built

Five modules and a CLI under `agent/policy/`, answering the question none of the three
existing layers could: *may this specific act happen without a person?*
`docs/AUTONOMY-POLICY.md` is a document, `agent/implement/preflight.mjs` checks a
proposal's paperwork, `.control-room/authz.mjs` decides whether a person may press
approve — and protocol §18's twelve mandatory conditions had no home at all.

| File | What it owns |
|---|---|
| `categories.mjs` | 18 action categories, the policy object, the derivation of a category from a proposal |
| `actors.mjs` | 84 rows: actor × action × resource × environment × path × risk |
| `conditions.mjs` | the twelve mandatory conditions and the human-review triggers |
| `rollback.mjs` | six elements, not a boolean |
| `engine.mjs` | `evaluate()` → a route; `mayExecute()` → whether it may happen now |
| `cli.mjs` | `policy` · `matrix` · `categories` · `evaluate --proposal <id>` |

## The four things this session is arranged around

**1 · NOTHING IS SWITCHED ON, AND THAT IS THE DELIVERABLE.**
`DEFAULT_POLICY.enabled_categories` is `[]` and so is the path allowlist. No act in this
repository can reach the automatic route, and tests 1b and 29 assert it stays that way.
The prompt is explicit — "Do NOT enable automatic production merge in this session" — and
filling either list is a governance change protocol §24 forbids the system making to
itself. The suite proves the permitting half against `SIMULATION_POLICY`, a fixture
marked `simulated: true` enabling one category over `docs/`, and then proves the
identical act refused under the shipped policy. **A suite that could only ever see a
refusal cannot tell "correctly refused" from "broken"** — the failure
`.control-room/selftest.mjs` was arranged against, and the reason test 1 exists.

**2 · THREE ROUTES, AND `blocked` IS NOT A SOFTER `human_review`.** `blocked` means an
approval would not help, which is protocol §8 as code: approval "does not override
provenance requirements; validation requirements; security requirements; scope
restrictions; mandatory policy conditions". A proposal with missing provenance is not
waiting for a reviewer; it is waiting for the agent that owns it.

**3 · UNKNOWN BLOCKS.** Three verdicts, not two. Eight of the twelve conditions are read
off the proposal and **cannot be supplied**; four are measurements that default to
`unknown`, and `unknown` refuses exactly as a failure does. The project's own §0.3 rule,
applied where getting it wrong would let a machine write to a website about EU law. What
is NOT closed, and is said in the module header rather than discovered later: within one
process a caller can supply a false fact.

**4 · IT IS ENFORCED, NOT DESCRIBED.** `agent/implement/implementer.mjs` calls the engine
twice per proposal — before a line is written, and again on the measured validators,
browser suite and git scope enforcement. A `blocked` route is a refusal in the first
case and a reason to revert in the second. Tests 30 and 31 assert both call sites exist
and that the suite runs in CI.

## The hidden Control Room entry

`js/threshold.js`. Typing `thirty-two paths` into the search palette offers one extra
result; choosing it draws a wheel — three concentric bands divided 3 · 7 · 12,
twenty-two Hebrew letters, fine lines in the site's own ink — and offers a link to a
login page.

It authenticates nothing, authorizes nothing, and holds no credential, no endpoint and
no privileged state. **The phrase is not a credential**: it is in a file served to every
reader, protocol §10 says obscurity is not a control, and anybody who finds it meets the
same login. It reads its target from `<meta name="eu-control-room">` and **never invents
one**; no published page declares that tag, so on the live site the passage ends at a
statement rather than a navigation. **Do not add the meta tag, or a server route that
reads the phrase, without deciding to.**

The wheel is not decoration: the Sefer Yetzirah tradition's twenty-two letters are an
**enum authority**, a closed vocabulary from which everything else is composed, which is
what `data/taxonomy.json` is to every other dataset here.

Nine new browser checks measure it in a real Chromium, including that opening it issues
**no network request at all**. One of them, `threshold:no-globals`, is measured against
a blank document in the same browser — the naive form reported `sessionStorage` and
`credentialless`, which are Chromium's own, as defects in the site.

## Two existing assertions changed, and why

Both because the world changed, not because they were inconvenient:

- `agent/implement/selftest.mjs` R6 asserted `AGENT_SUITES.length === 15`. There are
  seventeen now — the policy suite and the verification gate. The assertion is kept and
  updated, because a suite silently dropped from that list stops gating changes and
  nothing else would notice.
- `agent/detector/impact.mjs` `MODULE_SURFACE` must name every module in `js/` and did
  not name `threshold.js`. It does now, classified `surface: null` — chrome, reached only
  through the palette, rendering no record.

## A defect the suite found in the policy itself

`agent/policy/selftest.mjs` test 5 caught it, and it is the kind of thing this whole
layer exists to catch. A condition's `data` object carrying a key named `verdict`
**overwrote the condition's own verdict**, turning `failed` into a word the engine
matched as neither satisfied nor unmet — so an act that should have been blocked
evaluated as **`automatic`**. It is fixed, the validator run's own verdict is now
reported under `run_verdict`, and `evaluateConditions()` throws on any verdict outside
the four it defines so it cannot recur elsewhere.

---

# SESSION 23.5 — the verification gate

## What was built

`agent/policy/verify/` — a catalogue of **65 attacks across seven areas**, each carried
out against something real: a Control Room running on an ephemeral loopback port, the
tracked tree as git reports it, or the policy and ledger modules themselves.

```
node agent/policy/verify/cli.mjs                the report
node agent/policy/verify/cli.mjs --json         the whole record
node --test agent/policy/verify/selftest.mjs    is the gate reproducible
```

**Result: 61 failed safely · 0 succeeded · 2 partial · 2 undecidable.** The repository
was byte-identical afterwards, measured by hashing the tree around the run.

## Four outcomes, not two

`failed_safely` · `succeeded` · `partial` · `undecidable`. **An `undecidable` is not a
pass.** Two of the boundaries the prompt names cannot be tested here at all, and a gate
with only pass and fail would have had to call them passed.

## The two findings, NEITHER FIXED

**F-23.5-01 (HIGH) — the control-plane directories are inside the published surface.**
188 files under `agent/` are published. No operational record is published today, but two
tracked placeholder READMEs prove the directories are in the deployment, and the only
thing keeping the records out is a `.gitignore` rule. **An ignore rule is not a
boundary**: one `git add -f agent/implement/decisions/decisions.jsonl` publishes the
approval ledger. Pre-existing — `docs/IMPLEMENTATION-QA.md` §6 — and re-measured rather
than quoted.

**F-23.5-02 (HIGH) — `agent/observability/server.mjs` authenticates nothing.** Eleven
`/api/` routes over the whole trace store, protected only by a `host` **default**. The
gate confirmed the module is unchanged and **did not re-run the measurement**, and says
so rather than reporting a number it did not take.

## The two undecidables

**U-23.5-01 — the deployed origin has never been fetched.** The network policy refuses
it. So the publication boundary, F-23.5-01 included, is **inferred** from Jekyll's
documented default and from reading the tree.

**U-23.5-02 — the Master Orchestrator is not in this working tree.** It exists on
`claude/agent-governance-protocol-tx6mu1`; this branch does not carry it, so the gate had
nothing to attack. The report records the correction rather than editing it away.

## Two defects in the gate itself, found and corrected before the report

Recorded in `docs/SECURITY-VERIFICATION-2026-09-08.md` §7 because a verification whose
own errors are invisible is not a verification. Both are the SESSION 19 shape — a check
that fails for the wrong reason:

1. **HE-01 cried CRITICAL over a sentence.** It substring-matched forbidden words over
   the whole of `js/threshold.js`, whose own header says *"It holds no token, no session,
   no credential"* — so `token` matched. It now strips comments and keeps string
   literals, because a credential would be one.
2. **PP-08 reported two READMEs as leaked decisions.** It now separates *is a record
   published* (no) from *is the directory inside the published surface* (yes), and the
   second is the real finding.

## What the gate does not establish

Fully in `docs/SECURITY-VERIFICATION-2026-09-08.md` §8. The one to carry: **this is an
automated gate written by the same session that built what it attacks.** It is
independent of the implementation — separate module, separate vocabulary, attacks rather
than assertions — and it is **not** independent of the author. Nothing here has been
penetration-tested by a person.

## Files changed, SESSIONS 23 and 23.5

**New:** `agent/policy/` (`categories.mjs`, `actors.mjs`, `conditions.mjs`,
`rollback.mjs`, `engine.mjs`, `cli.mjs`, `selftest.mjs`, `README.md`),
`agent/policy/verify/` (`harness.mjs`, `attacks.mjs`, `cli.mjs`, `selftest.mjs`),
`js/threshold.js`, `docs/AUTONOMY-AUTHORIZATION-POLICY.md`,
`docs/SECURITY-VERIFICATION-2026-09-08.md`.

**Modified:** `agent/implement/implementer.mjs` (the two policy call sites),
`agent/implement/checks.mjs` and `.github/workflows/qa.yml` (the two new suites),
`agent/implement/selftest.mjs` (the suite count), `agent/detector/impact.mjs`
(`threshold.js` classified), `agent/browser/checks.mjs` and `agent/browser/runner.mjs`
(the nine threshold checks), `js/palette.js` (nine lines), `style.css` (the threshold
block, appended), `AGENTS.md`.

**Not modified:** `data/`, `i18n/`, `css/`, `fonts/`, `tools/`, every `.html` page,
`app.js`, `README.md`, `CLAUDE.md`, `.control-room/`.

## Next session

**SESSION 24 — the end-to-end simulation.** Protocol §25 puts it next, and this branch is the
first tree on which it could run: the Orchestrator, the policy it enforces, the implementation
layer and the Control Room are all present together for the first time.

Four things it inherits.

- **No dispatcher is wired.** A workflow run today reports `not_dispatched` and ends
  `unresolved`. That is SESSION 22's own statement of where it stopped, and §25 says the first
  complete cycle runs in simulation and **must not modify production**.
- **`agent/policy/` is the home for the autonomy policy.** Do not re-implement a condition, a
  trigger or a category inside the Orchestrator, the simulation, or anywhere else.
  `agent/policy/selftest.mjs` test 32 and gate attack AB-10 will both notice.
- **SESSION 23.5's two findings must not be silently repaired.** The prompt says so and so
  does `docs/SECURITY-VERIFICATION-2026-09-08.md`. They are decisions for the repository
  author.
- **Run the suites after `git add`, not before.** This session reported a green R4 that was
  red, because the credential scan reads tracked files and its own were not yet staged.

### Exact next objective

Run the simulation of protocol §25 — Scout → Verifier → Detector → Data Depth → Knowledge
Architect → Editorial → UX → Implementation/QA → Orchestrator → Observability — in simulation
mode, modifying nothing, and **document the defects it exposes rather than repairing them**.

---


**SESSION 22 — complete.** The Master Orchestrator, `agent/orchestrator/`. The
reference document is **`docs/ORCHESTRATOR.md`**; this file is the handover only.

---

# SESSION 22 — the Master Orchestrator

## What was built

The twelfth thing in `agent/`, and the first whose subject is the other eleven. Nine
modules, a CLI, a suite, and one read-only view in the Control Room.

Zero dependencies, no build step, no `package.json` — `node:fs`, `node:crypto`,
`node:path`, the same constraints as the rest of the repository.

| File | What it owns |
|---|---|
| `capabilities.mjs` | the capability register for all fourteen actors, and `grantFor()` |
| `workflows.mjs` | the ten workflow types as data, the five end states, `classify()` |
| `state.mjs` | the workflow state machine and the append-only journal it is replayed from |
| `events.mjs` | intake: the whitelist, and the fields stripped and named at the door |
| `approval.mjs` | the eight routing checks, re-derived from the decision ledger |
| `conflict.mjs` | six conflict shapes, and no resolver |
| `policy.mjs` | the ten human-review triggers, protocol §18's twelve conditions, the provenance and rollback gates |
| `orchestrator.mjs` | the Orchestrator |
| `cli.mjs` · `selftest.mjs` · `README.md` · `state/README.md` | |

## The five things this session is arranged around

**1 · A GRANT IS AN INTERSECTION, NEVER A UNION.** SESSION 22 names three ways an
agent must not gain permission: because another agent asked, because the
Orchestrator routed a task, or because somebody clicked a button. All three have the
same shape — authority arriving with the REQUEST rather than being held by the
ACTOR. So `grantFor()` returns what is in BOTH the agent's registered capability and
the stage's declared need. A stage asking for more produces an **empty grant** and a
refusal naming the difference, not a grant covering the stage's need. Nothing in the
module reads an argument about permission: there is no `extra`, no `also`, no
`permissions`, and `checkOutput` has no `force`.

The register is **frozen all the way down**. A shallow freeze left `produces` a
mutable array, and `CAPABILITIES['legal-verifier'].produces.push('UXProposal')`
widened an agent at runtime — the suite planted that push, it succeeded, and the
fix was a deep freeze. That is the suite finding a real defect rather than
confirming a design.

**2 · APPROVAL IS RE-DERIVED, AND THE FORGERY IS NAMED RATHER THAN IGNORED.**
`events.mjs` strips every approval-shaped field at intake — `approved`,
`authorized`, `granted`, `decided_by`, `outcome`, `approval_id`, `permitted_files`,
`roles`, `force`, `skip_checks`, `deploy`, `git_ref` and twenty more — and reports
each one on the event AND on the trace. Silently ignoring them would look identical
to not having checked, which is the reasoning `agent/implement/ledger.mjs` already
established about agent-written approval claims, applied one layer up. An **unknown**
field is refused outright with its name.

`approval.mjs` then performs the eight checks the session names, five of them
**lifted from `agent/implement/preflight.mjs` rather than re-derived** so a gate
tightened there tightens this too. It does not reimplement `deriveApproval()`.

**3 · THE EIGHTH CHECK IS THE ONE NOTHING ELSE PERFORMS.** Implementation scope must
match approved scope. `preflight` derives the permitted set from the proposal and
`apply.mjs` enforces it afterwards against git; neither compares the set against
WHAT WAS ASKED FOR, because nothing was previously in a position to ask. A routing
request naming a file the proposal does not is **refused with the difference named**
— never intersected down to the permitted set and run anyway, which would let a
caller learn the permitted set by asking for the whole tree and reading what came
back.

**4 · THE CONFLICT DETECTOR HAS NO RESOLVER.** H7: a contradiction is never resolved
by seniority, recency or convenience. So there is no `resolve()`, no
`preferMostRecent()`, no confidence comparison and no tie-break, and the suite
asserts those exports do not exist. The temptation is specific: a verifier's
`contradicted` beside a proposal that asserts the value anyway has an obvious
answer, and taking it would be an agent deciding a question about EU law by rule of
thumb.

**5 · THE AUTONOMY ANSWER IS ALWAYS NO, AND ALL TWELVE CONDITIONS ARE STILL
EVALUATED.** `APPROVED_AUTONOMOUS_CATEGORIES` is empty, because no governance
decision in this repository has approved one and §24 forbids the system from taking
that decision itself. That could have been a single early `return false`, and
deliberately is not: the interesting fact is not "autonomy is off", it is WHICH
conditions a given piece of work would have failed. A system that only ever prints
"not permitted" teaches nobody anything, and the first session that enables a
category would be enabling it blind.

## Two things the suite corrected in the design

Both were wrong in code and right in the suite, and both are named here so a reader
can disagree.

**`same_agent_forbidden` named AGENTS, and the rule fired when the design was
HONOURED.** Written as agent-name pairs — `['regulatory-change-detector',
'legal-verifier']` — the H3 check refused the verifier stage precisely because the
detector had just run, which is the intended sequence, not a collision. The pairs
now name **STAGES** (`['detect', 'verify']`), which is what H3 actually says:
whoever runs `detect` may not also run `verify`. The load check refuses a pair
naming a stage the workflow does not have, and the suite asserts the two stages in
every pair are assigned to different agents today. A **second** check now carries
the real case: an agent handed a record it produced itself is refused before any
reasoning happens.

**`legal-verifier` could not consume a `RegulatoryChange`, which made `LEGAL_CHANGE`
unroutable.** The capability register said the verifier consumes `SourceCandidate`
only, so the handoff from `detect` to `verify` was refused as broken on every run of
that workflow type. `RegulatoryChange` was added to its `consumes`. That is the
register being corrected by the thing that uses it, rather than the workflow being
bent around the register.

## What is genuinely proved, and how

**65 tests in a new suite**, arranged as the six regressions the session names —
R1 incorrect routing, R2 forged approval, R3 scope expansion, R4 missing provenance,
R5 failed handoff, R6 unauthorized execution — plus the state machine, the
conflicts, the human-review triggers and the registers.

Two shapes it is arranged to avoid:

- **A test that passes because nothing happened.** Every refusal is paired with a
  positive proving the same path works when it should. Three of these failed in
  draft for exactly that reason: the R4 provenance test wired only the verifier, so
  the gate it was named for never ran.
- **A test asserting the shape somebody wrote.** The end-state assertions read the
  JOURNAL, because that is what the Control Room and a later session read, and an
  in-memory field can be right while the persisted record is wrong.

**Every fixture is about a file called `tools/example.mjs` that exists only in the
suite.** Nothing in it asserts anything about EU law. The records that must not be
`simulated` — because `preflight` refuses a simulated record as unactionable — are
safe to write only because their subject is a fixture path.

**Three fixtures the suite got wrong, and the contracts said so.** A hand-built
`VerificationRecord` did not satisfy its contract, so every test using it was
passing for the wrong reason — the gate refused it as *invalid* and the test read
that as the refusal it was looking for. They are now built from
`agent/schemas/fixtures.mjs`. A `RegulatoryChange` about a `tool` was refused
because a regulatory change is about the legal record. And the positive half of the
provenance test tried to use a `DataGap` with its blocking question deleted, which
is asserting that a record stops being a gap when you remove the part that makes it
one; it uses a `ClaimEvidence` now.

## The Control Room exposure

One route: `GET /api/workflows`, behind a new `workflows:read` permission that every
role holding `live:read` also holds. **There is no route that starts a workflow,
retries a stage, dispatches an agent or reopens a terminal one, and the absence is
the control** — not a check inside a route, because a check can be moved. The
Control Room does not import the `Orchestrator` class or the event intake, and two
new tests assert both: a server that could construct one could run one.

## Files changed

**New — `agent/orchestrator/`, 12 files:** `capabilities.mjs`, `workflows.mjs`,
`state.mjs`, `events.mjs`, `approval.mjs`, `conflict.mjs`, `policy.mjs`,
`orchestrator.mjs`, `cli.mjs`, `selftest.mjs`, `README.md`, `state/README.md`.

**New — `docs/ORCHESTRATOR.md`**, the reference document.

| File | What |
|---|---|
| `.control-room/authz.mjs` | `workflows:read`, granted to every role that holds `live:read`; `visibleActions().workflows` |
| `.control-room/views.mjs` | `workflowsView()` — the journal, the three registers, and `no_console` |
| `.control-room/server.mjs` | one route, `GET /api/workflows` |
| `.control-room/ui/app.html` · `ui/app.js` | the Workflows tab and its renderer |
| `.control-room/selftest.mjs` | tests 10c and 10d — the window-not-console assertions |
| `agent/implement/checks.mjs` | the orchestrator suite joins `AGENT_SUITES` |
| `agent/implement/selftest.mjs` | **one existing assertion changed** — see below |
| `.github/workflows/qa.yml` | the suite, the three register commands, and one more line in "what this workflow does not prove" |
| `.gitignore` | `agent/orchestrator/state/*`, README negated back in |
| `AGENTS.md` | the read list, the suite list, the test count, the Orchestrator paragraph, and the untracked-directories hazard |
| `docs/AGENT-ROLES.md` | §9 — the role is now filled, and three of its *never* items are mechanical rather than remembered |

**Not modified:** `data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`, every page,
`style.css`, `app.js`, `README.md`, `CLAUDE.md`.

## The one existing assertion that changed

`agent/implement/selftest.mjs` R6 asserts `AGENT_SUITES.length`. It was 15 and is
now 16, because the orchestrator suite joined the list. **The assertion caught the
change**, which is what it is for — its own comment says it had already caught the
list growing once, in SESSION 20, and this is the second time. Nothing was weakened:
the membership check was extended to name `agent/orchestrator/selftest.mjs`
explicitly as well.

No other existing assertion was touched, and no test was deleted, skipped or
relaxed.

## Tests and validators — run, not asserted

**934 across seventeen suites, 0 failures** (867 across sixteen before; SESSION 22
adds 65 in the new suite and 2 to `.control-room/selftest.mjs` — 867 + 67 = 934). No
existing suite's test COUNT changed; one existing ASSERTION did, and it is named
above. 18/18 contracts satisfiable by their fixture.

The four validators are at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: **0
errors, 0 warnings on `validate.mjs` and `i18n-audit.mjs`, 0 errors and the same
five `design-qa` warnings by file and line, 106 unverified records.**
`node agent/implement/cli.mjs check` reports `at_baseline` on all four.

Both boundary checks: `agent/implement/cli.mjs boundary` at **0 blocking / 11
warnings**, and `.control-room/cli.mjs boundary` at **0 errors**, 21 routes, 8
public, 0 production controls.

The browser suite ran against a real Chromium: **116 pass · 3 fail · 2 undecidable
across 121 checks**. The three failures are the ones SESSION 19 found and nobody has
fixed — issues 25, 27 and 28 — and this session did not touch the interface.

The health monitor ran: 44 metrics, three domains, no overall score, repository
byte-identical afterwards.

The orchestrator suite writes nothing to the repository: it uses a memory journal
throughout, and one test checks `git status --porcelain` from outside for anything
under `agent/orchestrator/state/`.

## What was run against the real stores, and what it found

`node agent/orchestrator/cli.mjs survey` reads the real record store and the real
decision ledger. On this machine it reports **no proposal in the record store** —
`agent/records/` is git-ignored run state, so a fresh clone and a CI runner have
none. The CLI says that in those words rather than printing "0 proposals", because
those are different facts.

One demonstration workflow was opened, with a memory journal, against a proposal id
that does not exist. It ended `human_review_required` with **ten of the twelve
mandatory autonomy conditions failing** and the three routing checks that do not
depend on later stages refusing by name. Nothing was published and nothing was
written.

## Known limitations

Every one is in `docs/ORCHESTRATOR.md` §13 in full. The four worth carrying at the
front:

1. **No specialist has ever been dispatched by the Orchestrator.** Every end-to-end
   path in the suite is driven by a fixture dispatcher. §12.
2. **The capability register is a boundary at the handoff, not process isolation.**
   Nothing stops a module calling `writeFileSync`; this repository has no sandbox
   and the module says so rather than implying a stronger control.
3. **The journal is neither tamper-evident nor private.** `readJournal()` reports a
   sequence gap and cannot prevent one; the directory is git-ignored, and one
   `git add -f` undoes that.
4. **The conflict detector sees six shapes.** Two records can disagree in prose that
   nothing in this repository reads.

## Next session

**SESSION 23 — the autonomy and authorization policy**, then 23.5, the security and
control-plane verification that gates the end-to-end simulation. Three things it
inherits:

- **`APPROVED_AUTONOMOUS_CATEGORIES` is empty and must stay empty until a person
  fills it.** Protocol §24 reserves the decision; an agent appending to that array
  would be taking it. The five categories §20 names are already written down beside
  it, so the decision has somewhere to land.
- **The twelve mandatory conditions are already evaluated and reported on every
  run.** Turning a category on means deciding which of the twelve a given category
  can satisfy, not building the check.
- **The dispatch seam is where SESSION 24's simulation attaches.** A dispatcher
  receives the grant, the event and the records handed to it — never the workflow,
  the journal or the ledger — and its output is validated against its contract and
  then against its grant before it travels.

---

# SESSION 21 — the Control Room

*(the previous milestone, kept for its findings and its refusals. The reference
document is `docs/CONTROL-ROOM.md`.)*

## What was built

A **server**, not a page, at `.control-room/`: 20 routes, 8 of them public and all 8
part of the login surface, every other one authenticating and then authorizing
server-side before it answers. Three views — live system, review queue, website
health — plus an audit trail view and a read-only access view. One state-changing
action in the whole system: approve, reject, request changes.

Zero dependencies, no build step, no `package.json`. `node:http`, `node:crypto`
and the global `fetch`, the same constraints as the rest of the repository.

## The four things this session is arranged around

**1 · THE ONE PUBLICATION BOUNDARY THIS REPOSITORY HAS.** SESSION 18 established
that there is no public/private separation here: GitHub Pages serves `main` at the
repository root with no `_config.yml`, no `.nojekyll` and no exclude list, so
`agent/`, `docs/` and the approval ledger are published beside `index.html`, and
`agent/implement/boundary.mjs` says in its own header that a Control Room page
added to this tree "would be public the moment it was pushed."

The exception, which that module already models and already calls "a real
boundary, and it is the only one this repository has", is Jekyll's documented
default: a path whose segments begin with `.` or `_` is not served. It is why
`.agents/` has never appeared in the published surface and `agent/` always has.
So the Control Room is `.control-room/`, and `node .control-room/cli.mjs boundary`
checks on every push — over the real tree, not by assertion — that it is still
outside.

**No `_config.yml` was added.** Adding one would change how the live site is
processed, on a production website with no deploy gate, to solve a problem the
existing exclusion already solves. That is a Class D change to the deployment and
it is not this session's to make.

**2 · THE DOT PREFIX IS NOT A SECURITY CONTROL, AND NOTHING RELIES ON IT BEING
ONE.** Protocol §10 is explicit that a hidden route, a hidden link, `robots.txt`,
a frontend check and an unlisted page are not security mechanisms. Every
privileged request is authenticated and then authorized whether or not anybody
finds the server; `.control-room/state/` is git-ignored as well; and the suite
proves the request boundary against a **running server over real HTTP**, not by
calling functions. The publication boundary is why a mistake in the request
boundary would not already have published an audit trail — it is the second line,
not the first.

**3 · A DEFAULT IS NOT A CONTROL — SESSION 20's FINDING, TURNED INTO REFUSALS.**
The health monitor measured `agent/observability/server.mjs` and found nine of
eleven privileged routes answering an unauthenticated request, its only protection
being that `host` DEFAULTS to loopback. So every dangerous configuration here is a
**refusal to start**, not a default somebody can override: the development
provider in production; the development provider off loopback in any environment
(two independent refusals, so changing one variable does not get round it); any
non-loopback bind outside production; production without an https origin; OIDC
without an issuer or client id; an insecure issuer in production; an idle timeout
that could never fire; and **an empty operator registry**.

**4 · APPROVAL IS AN AUTHORIZATION, NOT AN IMPLEMENTATION.** Approving writes one
line, to `agent/implement/decisions/decisions.jsonl`, through the same
`recordDecision` the CLI calls — one home for the fact of a decision. It changes
no dataset, no page, no stylesheet, no locale; it runs no validator, no build, no
deployment; it touches no git. `git_ref` on the audit entry is `null` at decision
time **by design**: a value there would mean the approval published something.
Test 10 hashes the whole repository before and after a real approval and asserts
nothing changed.

## What is genuinely proved, and how

Sixteen numbered proofs, each against a running server where the claim is about a
request. Two shapes the suite is arranged to avoid:

- **A test that passes for the wrong reason.** Every negative asserts the status
  AND the reason, and each is paired with a positive proving the same path works
  for somebody who is allowed. An authorization test that only ever sees 403
  cannot tell "correctly refused" from "broken", and three of these tests failed
  in draft for exactly that reason — `fetch` follows redirects by default, so
  `GET /` "answered 200" while actually serving the login page.
- **A test weakened to make a check pass.** The eight synthetic credentials in the
  suite exist to prove the secret scan fires; `boundary.mjs` names the file as one
  of its **two** exemptions — named files, not a directory, so a real key added
  beside them is still found.

**One of the eight was reshaped, and it is worth knowing why.** The planted Slack
token was written in the exact `digits-digits-alnum24` shape a real one has, and
**GitHub's push protection refused the push** — which is a scanner above this
repository's own doing its job, on a value that was synthetic but indistinguishable
from a live one at a glance. It now carries an obviously-not-a-token string after the
`xoxb-` prefix — still matched by `SECRET_PATTERNS`' `slack-token` pattern, which is
what the test is for, and the assertion fails if that ever stops being true. The
literal is deliberately **not** reproduced here: `docs/` IS in the published surface,
and `agent/implement/selftest.mjs` R4 caught the first draft of this paragraph for
exactly that reason — a credential shape in a published file is an error whether or
not it is synthetic. The other seven were not touched, and none of them may be deleted
to make a check clean.

The OIDC provider is exercised against a local stub with a **real RSA key pair**:
a genuine login succeeds, and a forged signature, `alg: none`, HS256, a wrong
issuer, a wrong audience, an expired token and a wrong nonce are each refused by
name. That is a real test of the verification path. It is **not** a test against a
real identity provider, and `docs/CONTROL-ROOM.md` §11 says so first rather than
in a footnote.

## Two existing assertions were changed, and why

Both in `agent/health/selftest.mjs`, and both because **the world changed**, not
because they were inconvenient. Named here so a reader can disagree:

- `control_plane.control_room_availability` asserted `not_applicable` with the
  reason "there is no Control Room. SESSION 21 builds it." There is one now, so
  that reading became a metric asserting the absence of a thing this session
  built. It is `unmeasurable` — nothing here measures whether an instance is
  running — and the new assertion is **stricter**: it requires the metric to say
  that 100% would read as "checked and up", and that a bare reachability probe
  would be worse than none, because a Control Room that is up and answering
  everybody is worse than one that is down.
- `control_plane.authn_authz_failures` asserted `unmeasurable` because "there is
  no login". There is one now, and it logs its decisions, so the metric counts
  refusals from the Control Room audit trail — split into failed logins and
  authorization denials, because **a denial is the authorization layer working**
  and a total invites reading that as a problem. What did **not** change is the
  refusal to report an absent trail as zero: the trail is git-ignored per-machine
  state, so a CI runner and a fresh clone have none, and the new test asserts both
  halves.

One metric's IMPLEMENTATION was also brought into line with its own definition.
`control_plane.privileged_endpoints_exposed` is defined as routes "whose only
protection against public reachability is a default that a caller can override",
and it was counting every interface whose bind host is a parameter. Until this
session nothing in the repository had authentication, so the two could not come
apart. They can now: an interface that authenticates and authorizes is not
protected BY the default. The signal lists were not touched, the planted-failure
tests still fire, and the observability viewer is still counted — the finding
against it is unchanged.

## Files changed

**New — `.control-room/`, 20 files:** `config.mjs`, `identity.mjs`, `authn.mjs`,
`authz.mjs`, `audit.mjs`, `decide.mjs`, `views.mjs`, `server.mjs`, `boundary.mjs`,
`cli.mjs`, `selftest.mjs`, `README.md`, `config.example.env`, `state/README.md`,
and `ui/` (login and app: two pages, two stylesheets, two scripts).

**New — `docs/CONTROL-ROOM.md`**, the reference document.

**Modified, all of it control-plane:**

| File | What |
|---|---|
| `agent/health/security.mjs` | `.control-room/server.mjs` registered in `PRIVILEGED_INTERFACES`; `privileged_endpoints_exposed` brought into line with its definition; `why_zero` on the approval-action metric now names both callers of `recordDecision` |
| `agent/health/control.mjs` | the two metrics above |
| `agent/health/gather.mjs` | `readControlRoomAudit()` — reads the trail **by path, not by import**, so the monitor cannot be prevented from running by the thing it measures |
| `agent/health/selftest.mjs` | the two changed assertions, and `control_room_audit` in `fakeCtx` |
| `agent/implement/boundary.mjs` | `.control-room/` added to `CONTROL_PLANE_DIRS` — it reports as excluded by the deployment, which is the first control-plane directory that has ever done so |
| `.github/workflows/qa.yml` | the suite, the Control Room boundary check, the route table, and two more lines in "what this workflow does not prove" |
| `.gitignore` | `.control-room/state/*`, README negated back in |
| `AGENTS.md` | the read list, the suite list, and three hazards that were no longer accurate |

**Not modified:** `data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`, every page,
`style.css`, `app.js`, `README.md`, `CLAUDE.md`.

## Tests

**867 across sixteen suites, 0 failures** (812 across fifteen before). 55 are new;
no existing test count changed. 18/18 contracts satisfiable by their fixture. The
four validators are at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors,
106 unverified, the same five `design-qa` warnings by file and line, and the
boundary check at 0 blocking / 11 warnings.

The Control Room suite writes nothing to the repository: temporary state, record
and ledger directories per test, verified from outside by `git status` afterwards.

## A discrepancy found and NOT reconciled

`docs/CURRENT-ARCHITECTURE.md` §13 still says "**No CI.** There is no `.github/`
directory, no workflow". `.github/workflows/qa.yml` has existed since SESSION 19,
and `AGENTS.md` says "There is now CI." The two disagree. It is reported here
rather than edited, because AGENTS.md's rule is to stop and report a conflict
between the documentation and the code rather than reconciling it silently, and
because §13 is not this session's section. The same paragraph's other claims —
Pages serving `main` from the root, no `_config.yml`, no `.nojekyll` — were
re-read against the tree and are **still true**, which matters because the
Control Room's placement depends on them.

## Known limitations

Every one of these is in `docs/CONTROL-ROOM.md` §11 in full. The four worth
carrying at the front:

1. **No real identity provider has ever been contacted**, and this environment's
   network policy means none could. Refresh tokens, back-channel logout, token
   revocation and `end_session` are not implemented.
2. **No deployed Control Room has ever been reached.** The suite starts one on an
   ephemeral loopback port. `control_plane.control_room_availability` reports
   `unmeasurable` for exactly this reason.
3. **The publication boundary is inferred, not confirmed.** It follows from Pages'
   documented default and from reading the tree; the deployed origin has never
   been fetched (the same limitation as AUDIT F-12, one layer down).
4. **Nothing here has been penetration-tested**, there is no rate limiting and no
   account lockout. Under OIDC both belong to the identity provider; under the
   local provider they are absent, which is one more reason it may not serve
   production.

## Next session

SESSION 22 — the Master Orchestrator. Two things it inherits:

- **The Control Room is not a command console, and §14 of the protocol says the
  Orchestrator must not treat a UI action as unconditional authority.** What the
  Control Room produces is a governed event: a line in the decision ledger, bound
  to a proposal hash, attributable to an authenticated actor. The Orchestrator
  re-derives it — `deriveApproval()` already does, and already discards
  agent-written approval claims by name.
- **`decide.mjs` runs the Implementation Agent's own gates before granting**, so a
  proposal that cannot be implemented cannot be approved. If the Orchestrator
  grows a path that bypasses `preflight()`, that property is gone.

---

# SESSION 20 — the Website Health Monitor

*(the previous milestone, kept for its findings and its refusals. The reference
document is `docs/HEALTH-MONITOR.md`.)*

## What was built

The eleventh agent, and the first whose subject is the SYSTEM rather than any part of it:
the site a reader loads, the corpus that site argues from, and the machinery that produced
both. `docs/AGENT-ROLES.md` §10 has described the Observability role since SESSION 01;
`agent/observability/` gave it a trace model, and this gives it the numbers.

**Forty-four metrics across three domains that are never summed.** 10 public website, 10
knowledge, 24 control plane — the last including the seven security-boundary checks, filed
there because that is what they protect.

## The three refusals this session is built around

**1 · THERE IS NO OVERALL SCORE.** `agent/health/model.mjs` exports `overallScore()`, and it
**throws**, with the reasoning, at the exact place somebody would reach for one. The three
domains fail differently: a broken link costs a reader a click, a false statement about EU
law costs them a decision they cannot take back, and an unaudited approval costs the system
its provenance and is invisible to every reader. A mean says none of that and invites raising
the number by improving the cheapest domain. The refusal is also recorded as a decision on
every run's trace, with the three alternatives that were not taken, so it can be seen to have
held rather than taken on trust.

**2 · `unmeasurable` IS NEVER ZERO.** Three states — `measured`, `unmeasurable`,
`not_applicable` — and an unmeasurable carries a **null** value, a `why`, and what would be
needed. Two metrics can never be measured here and reporting either as 0 would be the exact
substitution `AI-SAFE-BOUNDARIES` §0.3 and §0.4 prohibit:

- **Deployment failures.** No telemetry, and nothing has ever fetched the deployed origin —
  the network policy refuses it.
- **Authentication failures.** A 0 would read as "no failed logins" when the truth is "there
  is no login". The metric points at the MISSING CONTROL instead, which is where a missing
  control belongs.
- **Control Room availability** is `not_applicable`: SESSION 21 builds it, and neither 0% nor
  100% would be true. `agent/observability/server.mjs` is a development viewer, and calling
  it a Control Room would overstate both what exists and what is protected.

Six more public-website metrics report unmeasurable whenever the browser suite did not run. A
report saying "0 console errors" because nobody opened a page would be the worst line this
monitor could produce.

**3 · A LOWER NUMBER IS NOT AUTOMATICALLY HEALTHIER.** Five metrics carry
`direction: 'not_a_score'`, and `defineMetric` **throws** if one is re-labelled — the
unverified count, the provenance gaps, the verification gaps, the blocking open questions and
the rejected proposals. Every cheap route down is a prohibited action under
`AUTONOMY-POLICY.md`: clearing `requires_verification`, attaching a plausible substitute,
bulk-stamping `last_verified`, removing a `blocks` flag. **A rise in the first four is usually
good news** — it normally means somebody examined a record nobody had examined. The CLI marks
them `=` rather than `!`, `summarise()` counts them apart from findings, and `movement()`
reports them in a list that never says "improved".

## Every metric declares eight things, and the model refuses one that does not

Name, definition, source, calculation, update frequency, interpretation, limitations, and
public-or-private — all mandatory, all checked at definition time, so SESSION 20's
requirement is a gate rather than a convention. `limitations` is never empty and the suite
asserts it is longer than a fragment: a metric that cannot say what it fails to see is a
number somebody will quote out of context.

`node agent/health/cli.mjs --metrics` prints the whole register and runs nothing.

## What it found

**PUBLIC WEBSITE** — 9 measured, 1 unmeasurable. Three findings, all already known: 3 browser
regressions, 2 accessibility failures, 1 navigation failure — issues 25, 27 and 28.

**KNOWLEDGE** — 10 measured. Evidence coverage 76.9% of 91 claims. 106 unresolved records,
matching §12 exactly. **15 facts stored in two places with no drift check, one already
drifted** — the `__CONTENT__` hazard AGENTS.md has recorded since SESSION 00, now MEASURED
rather than recalled. 1 contradictory record: issue 18, `rel-kind:complement`. 6 fact-typed
claims whose evidence cannot carry a fact.

**CONTROL PLANE** — 0 agent failures, 0 policy violations, 0 self-approved decisions, 0
misclassified proposals, **0 changes ever applied to the legal record by an agent.**

## The security finding

`agent/observability/server.mjs` serves **eleven `/api/` endpoints** over the whole trace
store — agent inputs and outputs, decisions, approvals, provenance — and performs **no
authentication and no authorization on any of them**. Its only control is that `host`
DEFAULTS to `127.0.0.1`.

**A default is not a control.** `serve({ host })` accepts any value; a caller passing
`0.0.0.0` exposes the entire store with nothing in the request path to object. The monitor
does not infer this: it starts the server on an ephemeral loopback port and asks each route
with no `Authorization` header and no cookie. **Nine of the eleven return data**, two of them
tens of kilobytes. Nothing returns 401, because nothing asks.

That is defensible for a local development viewer, which is what its own header says it is.
It is recorded because **SESSION 21 builds a Control Room**, and one that reused this server
would inherit a privileged API whose only protection is a default somebody can override.

### The false positive that shaped the check

The first draft of `AUTHZ_SIGNALS` counted a bare `403` and reported the server as HAVING
server-side authorization — on the strength of `json(res, { error: 'forbidden' }, 403)` for a
path resolving outside the viewer directory. **That is a path check.** It refuses a traversal
and makes no decision about who the caller is, and counting it turned the largest finding in
the file into a pass. A status code is not a control. The suite now plants exactly that
server and asserts `has_authz` is false.

## A correction to SESSION 18

`publicSurface()` walked the filesystem. Publication is **GitHub Pages serving `main`**, and
`main` carries **tracked files only** — a git-ignored run artifact has never been in a commit
and is not published. The walk reported `agent/records/`, `agent/observability/runs/` and this
session's own health history as PUBLISHED, which is a false alarm, and a security check that
cries wolf about three directories on every run is one people learn to ignore.

It now reads `git ls-files`, reports untracked files separately, distinguishes "excluded by
the deployment" from "absent because nobody committed it", and falls back to the walk **saying
so** when git cannot be consulted — overstating the surface is the safe direction.

**`agent/health/selftest.mjs` found this** by asserting the health record was not in the
published surface, and finding it there.

## Public and private

`publicSubset()` is a **whitelist**. Three deliberate acts are needed before anything
operational reaches a public view: set `visibility`, write a `public_justification`, and pass
the definition gate — which refuses a control-plane metric marked public without one. The
rejected alternative was a `redact()` stripping known-sensitive fields; its failure mode is a
new private metric nobody adds to the deny list, public by default. The whitelist's failure
mode is a public metric left private: a report nobody sees rather than a leak.

**22 publishable, 22 withheld, 0 leaked.** Only two control-plane metrics are public —
proposals awaiting a human, and changes an agent has applied to the site (0, and a reader of a
site about EU law is entitled to know it). `publicReading()` drops `detail` and `evidence`
WHOLESALE rather than filtering named keys, and the suite checks for leaks over the SERIALISED
view rather than the structure, because a structural check verifies the shape somebody wrote.

## The historical record

`agent/health/history/health.jsonl`, append-only, **git-ignored** — and that is a boundary
decision, not a convention: it holds private control-plane data, and this repository publishes
its whole tree. A `.gitignore` entry is not a security boundary and `agent/health/` says so
rather than pretending otherwise.

`movement()` compares against the previous entry with one rule doing most of the work: **a
metric is compared only where both entries measured it.** Comparing a run that had a browser
against one that did not would report six improvements or six regressions depending on which
way round they fell, and both would be fabrications.

## Files changed

```
agent/health/model.mjs            (new — the metric contract, three states, the score refusal)
agent/health/gather.mjs           (new — the evidence once, and the loopback probe)
agent/health/public.mjs           (new — 10 metrics)
agent/health/knowledge.mjs        (new — 10 metrics)
agent/health/control.mjs          (new — 17 metrics)
agent/health/security.mjs         (new — 7 checks, and the route/auth analysis)
agent/health/metrics.mjs          (new — the registry and the public subset)
agent/health/history.mjs          (new — the historical record and movement)
agent/health/monitor.mjs          (new — Agent 10)
agent/health/cli.mjs              (new)
agent/health/selftest.mjs         (new — 55 tests)
agent/health/README.md · agent/health/history/README.md   (new)
docs/HEALTH-MONITOR.md            (new — the reference document)

agent/implement/boundary.mjs      (publicSurface reads git ls-files — the correction above)
agent/implement/checks.mjs        (the health suite joins AGENT_SUITES)
agent/implement/selftest.mjs      (R5 sharpened for the new surface model)
agent/observability/server.mjs    (a `quiet` option, for the probe)
agent/observability/query.mjs     (healthState, into loadTrace)
agent/observability/cli.mjs       (the `health` command)
.github/workflows/qa.yml          (the health job)
.gitignore                        (agent/health/history/, with the reason)
AGENTS.md · docs/AGENT-ROLES.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`, `i18n/` and
`fonts/`, all four validators in `tools/`, `style.css`, `app.js`, `README.md`, `CLAUDE.md`,
and every contract in `agent/schemas/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/health/selftest.mjs` | **55 pass · 0 fail** (new) |
| `node --test agent/implement/selftest.mjs` | **55 pass · 0 fail** (54 before; R5 gained a test for the corrected surface model) |
| `node --test agent/schemas/selftest.mjs` | 139 — unchanged |
| `node --test agent/ux/selftest.mjs` | 73 — unchanged |
| `node --test agent/detector/selftest.mjs` | 66 — unchanged |
| `node --test agent/integrate/selftest.mjs` | 64 — unchanged |
| `node --test agent/proposals/editorial/selftest.mjs` | 61 — unchanged |
| `node --test agent/architect/selftest.mjs` | 52 — unchanged |
| `node --test agent/proposals/data/selftest.mjs` | 50 — unchanged |
| `node --test agent/verifier/selftest.mjs` | 45 — unchanged |
| `node --test agent/depth/selftest.mjs` | 43 — unchanged |
| `node --test agent/observability/selftest.mjs` | 40 — unchanged |
| `node --test agent/scout/selftest.mjs` | 32 — unchanged |
| `node --test agent/browser/selftest.mjs` | 19 — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 0 invalid records from this session's real runs |

**812 tests across fifteen suites, all passing** (756 before this session).

The extra test beyond 756 + 55 is in `agent/implement/selftest.mjs`: R5 gained a check that
the published surface is what git tracks rather than what is on the machine, which is the
correction described under "A correction to SESSION 18" above.

Also run as live verification: `node agent/health/cli.mjs --as-of 2026-09-03` (44 metrics),
`--metrics`, `--public`, `--history`, `--no-browser`, and
`node agent/observability/cli.mjs health --readings`.

## Known limitations

1. **The monitor measures what this repository can see, which is less than what matters.**
   Nothing has fetched the deployed site, no URL has been retrieved, no source document
   opened, no screen reader run, no contrast computed.
2. **Nine metrics report `unmeasurable` in a typical run.** That is the honest state, not a
   gap in the work — but a reader skimming the numbers must read the coverage line, and the
   history stores it for exactly that reason.
3. **The knowledge metrics check the SHAPE of evidence, not what a source says.** A claim
   typed as a fact with a tier:1 source that does not support it passes every check here.
4. **The security checks read source and match signals.** A mechanism they do not recognise
   reads as absent — a false positive, the safe direction, and one the suite tests for by
   planting a server that DOES authenticate.
5. **`PRIVILEGED_INTERFACES` is an allowlist.** A new server nobody registers is not checked.
6. **`incomplete_entities` overstates and `duplicate_facts` understates**, each for a reason
   stated in its own `limitations`.

## Unresolved issues, carried forward

SESSION 19's 1–31 stand unless noted.

2. **No deploy gate — PARTIALLY MOVED.** The validators now run in CI on every
   push (`.github/workflows/qa.yml`, SESSION 18), so a failure is **visible**.
   There is still nothing between a push to `main` and the live site: making the
   workflow blocking needs a branch protection rule, which is repository
   configuration outside this tree and outside any agent's reach.
5. **106 records carry an unverified note.** No session since SESSION 07 has
   moved it; this one does not either.
7. The Source Scout workflow has still never executed on GitHub Actions.
12. `GOVERNANCE_PERMITS` is empty and nothing in `docs/` opens it.
15. Fourteen gap-router proposals exist and nothing decides them.
16. Twenty architecture proposals exist and nothing decides them.
18. `rel-kind:complement` is stored as both symmetric and asymmetric. Still the
    cheapest real decision on the list.
19. Twenty-two editorial recommendations exist and nothing decides them.
20. The markup and `data/claims.json` disagree about what two passages are.
21. Nineteen sentences read as settled over claims graded Unresolved.
23. **New: ten UX findings and five testable proposals exist and nothing decides
    them.** Each is behind a pending approval. **They are proposals, not a work
    order**, and five of them are `human_only` because they change what a reader
    sees on a site with no deploy gate.
24. **New: nine components draw a status this agent could not establish is
    legible without colour.** Not a defect and not a clearance — an open
    question, and the only thing that closes it is somebody opening the page.
    `node agent/ux/cli.mjs --as-of <date> --open` lists them with the bytes.
25. **The site has no navigation in its markup, and the `<noscript>` notice does
    not say so — NOW MEASURED.** SESSION 17 established it by reading the source;
    SESSION 19 loaded `instruments.html` with scripting disabled and confirmed it
    links to none of the six top-level pages. Still not fixed: Class C interface
    work needing a proposal and a decision.
26. **New: `index.html` has no pre-paint theme bootstrap.** The six tool pages
    carry one inline; the brief consults `prefers-color-scheme` in `app.js`
    instead. Noticed while narrowing question 2's false positive and NOT filed
    as a finding — no lens establishes what it costs a reader, and filing it
    would have been an observation dressed as a measurement. Recorded here so the
    next session can decide whether it is one.

27. **New: the skip link is the tenth focusable element in the RENDERED page.**
    Every page carries `<a class="skip-link">` as the first element in `<body>`
    and `design-qa.mjs` confirms it resolves — but `js/shell.js:258` inserts the
    chrome at `document.body.firstChild`, ahead of it. A keyboard reader must tab
    through the whole navigation to reach the link that skips the navigation.
    Invisible to every validator here, because the markup is correct.
    `node agent/browser/cli.mjs --only keyboard`.

28. **New: `enforcement.html` jumps h2 → h5 in its rendered outline.** Each
    pipeline stage renders as an `<h5>` directly under the `<h2>` naming the
    company. `design-qa.mjs` checks heading order in the markup, where those
    headings do not exist — `js/enforcement-page.js` creates them.

29. **New: the whole repository is inside the public deployment.** GitHub Pages
    serves `main` at the repository root with no `_config.yml`, no `.nojekyll`
    and no exclude list, so `agent/`, `docs/` and the approval ledger are
    published alongside `index.html`. **A Control Room page added in SESSION 21
    would be public the moment it was pushed.** This is an INFERENCE from GitHub
    Pages' documented default — nothing here has ever fetched the deployed site,
    and the network policy refuses that origin.
    `node agent/implement/cli.mjs boundary`.

30. **New: the approval ledger is not authentication.** Anybody who can write to
    the working tree can write a grant. It gives one hashed home, git
    attribution, and a refusal of the four forgeries that do not need write
    access — and no more than that. Protocol §11 and §13 want an authenticated
    actor and server-side enforcement, which a static site cannot host.
    `docs/IMPLEMENTATION-QA.md` §9.

32. **New: the privileged API has no authentication and no authorization.**
    `agent/observability/server.mjs` serves eleven `/api/` endpoints over the
    whole trace store and checks nothing; its only control is a bind host that
    DEFAULTS to loopback, and a default is not a control. Measured, not inferred:
    the health monitor starts it on an ephemeral loopback port and finds **nine of
    the eleven return data to a request with no credential**. Defensible for a
    development viewer; **SESSION 21's Control Room must not inherit it.**
    `node agent/health/cli.mjs --as-of <date> --detail`, `docs/HEALTH-MONITOR.md` §6.

33. **New: 15 facts are stored in two places with no drift check, and one has
    already drifted.** The fourteen part titles and the standfirst exist in both
    `data/brief.json` and the `__CONTENT__` blob inlined at `index.html:361`, and
    `meta.standfirst` disagrees between them. AGENTS.md has carried this as a
    hazard since SESSION 00; it is now MEASURED rather than recalled, by
    `knowledge.duplicate_facts`. Still not fixed, and still not a work order.

34. **New: 6 fact-typed claims have evidence that cannot carry a fact** — no
    source, `supports:context` only, or the self-reference placeholder. A claim
    typed as a fact renders as law on the site.
    `knowledge.unsupported_factual_statements`.

35. **New: `.gitignore` is doing the work of a publication boundary for three
    directories.** `agent/records/`, `agent/observability/runs/` and
    `agent/health/history/` all hold control-plane data and are absent from the
    deployment only because nobody committed them. One `git add -f` undoes it and
    nothing in this repository would object. Distinct from issue 29, which is
    about there being no exclusion mechanism at all.

31. **Two UX proposals now assert something that is no longer true.**
    `agent/ux/proposals.mjs` writes "this repository has no browser harness and
    no dependency budget for one" into the open question on every browser test it
    proposes. SESSION 19 built one, with no dependency budget spent. The sentence
    was accurate when written and is not now. **Not edited here** — rewriting
    another agent's recipe to change what its records assert is exactly the
    scope-widening Agent 9 exists to refuse, and it is Agent 8's own file. It
    needs a one-line change in `agent/ux/proposals.mjs` and a re-run.

## Next session

**A — decide something.** Unchanged and now four sessions old. Seventy-one proposals across
four agents, not one decided. SESSION 18 built somewhere for a decision to land:

```
node agent/implement/cli.mjs queue --why
node agent/observability/cli.mjs implement --refusals
node agent/implement/cli.mjs decide --proposal <id> --grant --by "<your name>"
node agent/implement/cli.mjs run --as-of <date> --proposal <id>            # rehearse
node agent/implement/cli.mjs run --as-of <date> --proposal <id> --apply
```

Most proposals fail three gates besides `approved`, and two of those cannot be closed by a
decision at all. Issue 18 remains the cheapest real decision: one field, five records, one
word — and `knowledge.contradictory_records` now reports it on every health run.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since SESSION 06.

**C — the applied half.** Half-closed since SESSION 18: `ChangeRecord` is produced whenever
something is applied, and nothing has been applied because nothing has been approved.
`WebsiteChange` is still produced by nothing.

**D — do the manual pass.** The perceptual open questions — contrast, screen readers, what a
layout looks like — need a person. `.agents/skills/ux-audit/references/manual-checks.md`.

**E — fix the three defects the browser found**, or decide not to. Issues 25, 27, 28.

**F — new, and it is SESSION 21's problem before it is anybody's: do not let the Control Room
inherit the unauthenticated API.** Issue 32. `agent/observability/server.mjs` has eleven
privileged routes, no authentication, no authorization, and a bind host that is a parameter
with a loopback default. Nine of them answer an unauthenticated request today. A Control Room
built on it would be the failure protocol §11–§13 describes, and the health monitor would
report it on every run — which is not the same as preventing it.

### Exact next objective

**F**, then **A**.

F is SESSION 21's own subject and the monitor has already written the acceptance criteria: a
Control Room is done when `control_plane.privileged_routes_without_auth` and
`control_plane.privileged_routes_without_authz` reach 0, when
`control_plane.privileged_responses_without_authorization` reaches 0, and when
`control_plane.control_room_availability` stops being `not_applicable` **without**
`control_plane.control_room_assets_published` rising above 0. Run

```
node agent/health/cli.mjs --as-of <date> --detail
node agent/health/cli.mjs --as-of <date> --series control_plane.privileged_routes_without_auth
```

before and after. The second command is why the history exists.

A is unchanged and needs no code. Start with the cheapest decision on the list and watch the
whole chain run.

The full chain, every step carrying `parent_run_id`:

```
node agent/verifier/cli.mjs             --records <trace-id>
node agent/integrate/cli.mjs            --records <trace-id> --as-of <date>
node agent/detector/cli.mjs             --records <trace-id> --as-of <date>
node agent/depth/cli.mjs                --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs       --as-of <date> --gaps <depth-trace-id> --refusals
node agent/architect/cli.mjs            --as-of <date> --gaps <depth-trace-id> --aside
node agent/proposals/editorial/cli.mjs  --as-of <date> --changes <detector-trace-id> --no-change
node agent/ux/cli.mjs                   --as-of <date> --propose --open
node agent/browser/cli.mjs
node agent/implement/cli.mjs            run --as-of <date>
node agent/health/cli.mjs               --as-of <date>
node agent/observability/cli.mjs        health --readings
```

## Anything the next agent must know

**SESSION 24's, first:**

- **A simulated pass is not evidence.** Every leg of `agent/simulation/` is driven by a
  fixture dispatcher. If you find yourself citing a green leg as proof that the Scout
  works, the Verifier works, or the site is correct, you are citing the machinery having
  routed a fixture.
- **A simulated `QAResult` is indistinguishable from a measured one downstream.** That is
  finding A-4 and M-4, and it is the reason the browser dispatcher is the one to distrust
  most. The real browser suite was run for the discovery path only.
- **The twenty-three findings are not a work order.** Protocol §25 asked SESSION 24 to
  observe rather than repair, and every one of them is a change to `agent/` that needs its
  own reasoning. Several are load-bearing in ways a quick fix would break: `allowSimulated:
  true` (V-1) is what lets every existing suite drive the Orchestrator with fixtures, so
  removing it breaks nineteen suites before it fixes anything.
- **`agent/simulation/selftest.mjs` asserts the DISCIPLINE, not the findings.** It asserts
  that the tree is byte-identical, that no dispatcher can write, that every fixture is
  marked, that nothing was published, and that three visual phases do not match. It does
  **not** assert V-1, V-2, V-3, I-1 or I-2 — pinning a defect turns it into a requirement.
- **The count of three mismatched visual phases IS asserted.** If you implement phase 2 or
  phase 5, `selftest.mjs` test 6 fails and you come here and say so. That is the assertion
  doing its job, the same way R6 does.
- **The one unmarked record in the whole harness is `unmarkedControlFixture()`**, and it
  exists because `preflight` gate 2 refuses a simulated proposal. It lives in a `mkdtemp`
  record store, it is never offered to `data/`, and its reason is finding V-1 in the audit
  rather than a convenience in the code.

**SESSION 21's:**

- **`git fetch --all` before comparing anything, and compare against
  `origin/main`.** Local `main` on this machine is 52 commits behind. The trap in
  AGENTS.md has now caught something in three separate sessions.
- **An approval is an authorization for a scope, and nothing else happens.** If
  you find yourself expecting the site to change because somebody clicked
  Approve, read `docs/CONTROL-ROOM.md` §6: the Implementation Agent re-derives the
  authorization from the ledger through its own ten gates, and no proposal in this
  repository has ever been decided.
- **A decision is bound to the proposal's fingerprint.** Editing a proposal after
  it was approved VOIDS the approval — deliberately, because it is what stops
  approving something small and then widening it. The fix is a fresh decision
  against the scope the proposal now has, never a re-hash.
- **Roles are re-read from the registry on every request**, not taken from the
  session. `roles_at_login` exists for the audit trail and is never used for a
  decision. If you cache the actor, you have removed that property.
- **The Control Room audit trail is private per-machine state.** It is git-ignored
  and does not travel with a checkout, which is why
  `control_plane.authn_authz_failures` reports `unmeasurable` in CI rather than 0.
  A 0 there would read as "nobody was turned away".
- **The suite proves the boundary behaves as specified.** It proves nothing about
  whether a proposal a human approved through it was a good idea — which is the
  whole reason the human is there. `docs/CONTROL-ROOM.md` §11 has the rest.

Carried forward:

- **`agent/ux/` opens no page, and every record says so in a blocking open
  question.** If you are tempted to soften that — to write "screen readers
  announce this as…", to fill in a contrast ratio from a comment in
  `css/tokens.css`, to describe how something looks — you are making this
  project's own honesty worse than whatever you found. `boundary.mjs` refuses
  the phrasing and the suite proves the refusal fires.
- **An open question is a deliverable, and there are more of them than
  findings.** Deleting one to shorten a report turns "could not be settled
  without opening a page" into "nothing there".
- **A count is not a quote.** Two lenses filed a composed sentence behind a real
  `file:line` and the suite's byte-check caught both. `measurement` is the kind
  for a count, and the locator says what was counted over.
- **The three false positives above are why the checks are shaped as they are.**
  Tokenised class matching, both attribute syntaxes, and "mixed is undecidable"
  each exist because a draft without them reported a defect that was not there.
- **The hypothesis is the one thing in this directory that is not derived**, and
  it is typed as a contested interpretation for that reason. A recipe per lens is
  where it lives; a finding whose lens has no recipe is refused rather than
  improvised.
- **`asOf` is an argument, everywhere.** Unchanged.
- **An `ApprovalRequest` you find in `agent/records/` is a REQUEST.** Agents write
  that directory. If you are tempted to read one whose `state` says `granted` and
  act on it, that state was written by an agent, and `agent/implement/ledger.mjs`
  discards it and says so. A grant lives in `agent/implement/decisions/` and
  requires a named human.
- **A grant is bound to the proposal's hash.** Editing a proposal after it was
  approved VOIDS the approval. That is deliberate — it is what stops approving
  something small and then widening it — and the fix is a fresh decision against
  the scope the proposal now has, never a re-hash.
- **A skipped browser run is never a pass.** `agent/browser/cli.mjs` exits 2 when
  it found no browser, and `agent/implement/` treats a required-but-skipped run as
  a blocking finding. If you find yourself making either of those exit 0 to get a
  green pipeline, you are building the thing the exit code exists to prevent.
- **The eight synthetic credentials in the redaction fixtures are load-bearing.**
  A suite that proves redaction works has to contain something to redact. Do not
  delete them to make `boundary` clean — that is weakening a test to make a check
  pass — and do not allow-list the files, which would hide a real key added to one
  of them later. They are classified and counted.
- **The baseline in `agent/implement/baseline.mjs` is PARSED out of
  `docs/CURRENT-ARCHITECTURE.md` §12.** If you change the numbers there, this
  follows automatically. If you restructure the fenced block so it cannot be read,
  `readBaseline()` throws — on purpose. Do not add a fallback default.
- **A number is not a verdict, and five of them must never be optimised.** The unverified
  count, the provenance gaps, the verification gaps, the blocking open questions and the
  rejected proposals are marked `not_a_score`. If you find yourself trying to move one of
  them, read `docs/HEALTH-MONITOR.md` §4 first: every cheap route down is a prohibited
  action, and a RISE in the first four usually means somebody did real work.
- **`unmeasurable` is not zero, and the monitor will not let you write it as one.** Nine
  metrics report it in a typical run. If you are tempted to make one return 0 so the report
  looks cleaner, you are proposing to report an absence of instrumentation as an absence of
  problems.
- **There is no overall health score and there must not be one.**
  `agent/health/model.mjs overallScore()` throws on purpose. The three domains fail
  differently and a mean says none of it.
- Before declaring anything done: the fifteen `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline — and
  `node agent/browser/cli.mjs` if you touched a page, a stylesheet, a module or a
  locale.

## Anything the next agent must NOT change

Carried forward, still binding. **SESSION 24's, first:**

- **Do not implement the brief's phase 6 literally.** "Reveal CONTROL ROOM followed by the
  normal authentication interface" must never become a login form on a published page. A
  credential prompt in the public tree is a phishing surface and a second home for a login
  that `.control-room/` already serves behind its own origin. The refusal is written into
  `VISUAL_SEQUENCE` phase 6's `must_not`, and `agent/simulation/selftest.mjs` test 6
  asserts no `.html` file here carries a `type="password"` field. Do not delete either.
- **Do not give a simulation dispatcher the ability to write, spawn or fetch.** Test 1
  reads `dispatchers.mjs` and refuses the eight primitives by name. A dispatcher that could
  write is a simulation that could change production.
- **Do not delete the tree fingerprint.** "This run changed nothing" is the only claim the
  harness makes about production, and it is a measurement. An assurance in its place would
  be worth nothing.
- **Do not turn a finding into an assertion.** `agent/simulation/selftest.mjs` deliberately
  asserts none of the twenty-three. Pinning one makes the defect a requirement and the fix
  a test failure.
- **Do not clear the `simulated` mark on anything but the one control fixture**, and do not
  move that fixture out of `mkdtemp`. It is the one place in this repository where a record
  claims not to be simulated when it is, it is in the open with its reason, and it never
  touches the tree.
- **Do not describe SESSION 24's run as an end-to-end execution of the agents.** It is an
  end-to-end execution of the ROUTING. `docs/ORCHESTRATOR.md` §13 now says so in the same
  words, and softening it would make the strongest claim in that document false.

**SESSION 21's:**

- **Do not put a Control Room page in the published tree.** Not under `docs/`, not
  at the root, not as an `admin.html`. The dot prefix is the only publication
  boundary this repository has, and a page outside it is public the moment it is
  pushed — linked or not. If a future session needs a broader boundary, that is a
  `_config.yml` exclude list, which changes how the live site is processed and is
  a Class D deployment change, not a convenience.
- **Do not add a default account, a seeded administrator, or a "first run"
  bootstrap that creates one.** The refusal to start with an empty registry is the
  feature. Protocol §11 forbids `"admin"` / `"admin"` or any equivalent from
  existing at all, so none may be created either.
- **Do not let the interface become the authority.** `visibleActions()` is
  cosmetic and says so in its own header. Every privileged request is authorized
  server-side, and test 5 sends the request a hidden button would have prevented.
- **Do not add a route that can deploy, delete, apply, publish or execute.**
  `PROHIBITED_ROUTE_WORDS` and test 10b make that a failing check rather than a
  discussion, and `server.mjs` deliberately imports nothing that could write to
  the tree — no `child_process`, no `writeFileSync`, not the applier.
- **Do not add a second writer of a grant.** `recordDecision` has exactly two
  callers and one home. A third would put the fact of a decision in two places.
- **Do not make `request_changes` a ledger state.** It is a review annotation, it
  leaves `deriveApproval()` reporting `pending`, and that is what is true.
- **Do not relax `DECIDABLE_STATES`.** Approving over a denial through the same
  endpoint makes the denial advisory.
- **Do not remove the strict unknown-field check on the review body.** Silently
  ignoring an unexpected field is safe today and stops being safe the first time
  somebody adds a field with that name. It is what makes "scope cannot be expanded
  through request manipulation" a refusal rather than a hope.
- **Do not let the local development provider out of loopback development.** Both
  refusals are load-bearing; removing either leaves the other looking sufficient.
- **Do not delete the eight planted credentials in `.control-room/selftest.mjs`,**
  and do not allow-list a directory in `.control-room/boundary.mjs` — the two
  exemptions are named FILES, so a real key added beside them is still found.
- **Do not commit `.control-room/state/`.**
- **Do not "fix" `agent/observability/server.mjs` by bolting a token onto it.** It
  is a local development viewer and its own header says so; the finding against it
  stands, unchanged, and merging it with the Control Room would give a development
  tool a security model nobody tests.

Everything from before, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not act on a UX proposal because it exists.** Fifteen records are
  outstanding, five of them `human_only` changes to what a reader sees, on a site
  where a push to `main` publishes and there is no deploy gate. They are
  proposals, not a work order.
- **Do not fix the three defects the browser found on your own initiative.**
  Issues 25, 27 and 28 are real, reproducible and reader-facing, and every one of
  them is Class C interface work: a proposal, then a human decision. A measured
  defect is not an authorisation.
- **Do not make `.github/workflows/qa.yml` a deploy gate by editing the workflow.**
  It cannot be one from inside this tree — blocking needs a branch protection
  rule, which is repository configuration. A workflow that CLAIMED to gate
  deployment would be worse than one that says plainly it does not.
- **Do not delete an `unmeasurable`, a `not_a_score` label, or the `overallScore()` throw.**
  Each is load-bearing, each makes a report longer and less satisfying, and each exists
  because the shorter version would be a lie.
- **Do not commit `agent/health/history/`.** It holds private control-plane data and this
  repository publishes its whole tree.
- **Do not add a `package.json`.** `agent/browser/` exists to prove the browser
  suite did not need one. Adding it later to "simplify" that code would spend the
  Class D budget the whole design avoided.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative. It
  now has THREE reports — an architecture finding, an editorial finding, and this
  session's measurement of what it costs — and three reports are no more a work
  order than one.
- **Do not add an entry to `APPROVED_AUTONOMOUS_CATEGORIES`.** It is empty because no
  governance decision in this repository has approved an autonomous action category,
  and protocol §24 reserves that decision to a person. An agent appending to it would
  be taking the decision the protocol exists to withhold — not implementing one.
- **Do not give `agent/orchestrator/conflict.mjs` a resolver.** H7: a contradiction is
  never resolved by seniority, recency or convenience. The suite asserts that
  `resolve`, `preferMostRecent` and `tieBreak` are not exported, and the reason it
  can is that none of them exists.
- **Do not make a grant a union.** `grantFor()` returns the intersection of what the
  agent holds and what the stage asks for. A union lets any workflow author widen any
  agent by writing a more ambitious stage, which is one of the three leaks SESSION 22
  names by hand.
- **Do not add a Control Room route that starts, retries, dispatches or resumes a
  workflow.** The absence of the route is the control; a check inside one can be
  moved. §14 is explicit that a Control Room action creates a governed event and the
  Orchestrator decides independently whether it is permitted.
- **Do not let a workflow type end anywhere but a human stage**, and do not remove the
  load check in `workflows.mjs` that refuses one which does. Five types may complete
  without a person ONLY when they proposed nothing at all.
- **Do not narrow a scope request down to the permitted set.** A request naming a path
  the proposal does not is refused with the difference named. Narrowing it would let a
  caller discover the permitted set by asking for the whole tree and reading what came
  back.
- Do not modify `data/*.json` or any page in a session not scoped for that work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- **Do not let a UX finding carry a drafted value.** The contract refuses it, the
  suite asserts it over every record, and SESSION 16's brief says the agent does
  not redesign the site. Loosening it is the one change in `agent/ux/` that
  cannot be made safely.
- **Do not let a proposal invent a design token.** Two checks exist because
  either alone could be edited away: `agent/ux/tokens.mjs` reads the stylesheets,
  and the contract requires an open question for any token added.
- **Do not remove the `measurement` evidence kind from this agent's output** by
  making every extract a `repository_file`. A count filed as a quote is a
  fabrication with a checkable-looking locator.
- **Do not turn an open question into a finding** to make the audit look more
  decisive, and do not turn one into a clearance. Nine components are neither
  legible nor illegible on this evidence, and saying either would be inventing a
  result.
- Do not reimplement `evidenceGrade` or `familyOf` in the agent layer.
- Do not add `retrieved_document` to `MINTABLE_EVIDENCE`.
- Do not add an id store, and do not change the id shapes in
  `agent/observability/ids.mjs`.
- Do not relax the contract gateway's rejection of anything malformed or
  `simulated`.
- Do not move `degraded` into a stored field. Do not move redaction to the read
  path, and do not raise `MAX_STRING`.
- Do not add an entry to `GOVERNANCE_PERMITS` without the repository owner naming
  the document that grants it.
- Do not relax the rule that `create_taxonomy_term` is `human_only`, and do not
  let `agent/architect/` propose a taxonomy term.
