# GOVERNANCE PROPOSALS — what keeps happening, and seven requests about it

**SESSION 28 · 10 September 2026 · branch `claude/learn-human-decisions-9c5q3m`, cut from
`origin/main` at the SESSION 26 merge (`aaf6691`).**

Every figure below was measured on that branch after `git add`, not before — the boundary scan
reads tracked files, which is the SESSION 23.5 correction `542dfa8` records. **1081 tests
across twenty-two suites, 0 failures, 0 skipped** on the branch; on `main`
`agent/autonomy/selftest.mjs` test 28 skips itself and the figure there is 1080 with one
skipped. Four validators at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline, 106 unverified
records, browser suite 125 pass · 3 fail · 2 undecidable with the same three SESSION 19
defects, `freshness.mjs` still exiting 1 on the pre-existing item.

**The brief:** analyse the historical human decisions; for each approved, rejected or edited
proposal determine the patterns — repeated corrections, repeated rejection reasons, recurring
evidence weaknesses, recurring UX objections, recurring editorial corrections, recurring
implementation failures. Do not automatically rewrite policies. Instead create
`agent/proposals/governance/` with proposals: a new rule, a new validation, a new skill, a new
evaluation, reduced autonomy, increased autonomy. Every governance proposal requires human
approval. **The objective is to convert repeated human intervention into durable system
knowledge.**

Reproduce everything here with:

```
node agent/proposals/governance/cli.mjs corpus
node agent/proposals/governance/cli.mjs patterns
node agent/proposals/governance/cli.mjs list
node agent/proposals/governance/cli.mjs show GP-05
node agent/proposals/governance/cli.mjs check      # exit 0 · 1 if an anchor is refuted
```

---

## 0 · The sentence to read before any other

**There are no approved, rejected or edited proposals to analyse.**
`agent/implement/decisions/decisions.jsonl` is not empty. It is **absent**. Of the seventy-one
proposals AGENTS.md counts across four agents — and the forty-eight SESSION 25 measured in a
single run against the real corpus — not one has been decided. Nobody has ever run the one
command that records a decision, and the file the ledger would live in has never been written.

Those are different facts and this session keeps them apart everywhere, because §0.3 — `null`
is not `unknown`, and unknown is never zero — applies to this system's own governance as much
as to a fine or a date. An empty ledger would mean somebody looked and decided nothing. An
absent one means the mechanism has never been used.

So the corpus analysed below is the one that exists: **the corrections**. What this repository
has instead of a decision record is a person repeatedly stopping the same thing from being
asserted. Twelve commits on `main` say in their own subject that they are putting something
right. **A pattern here is a thing a person had to say more than once.**

## 1 · The decision corpus, measured

`node agent/proposals/governance/cli.mjs corpus`

| store | state | holds | tracked |
|---|---|---|---|
| `agent/implement/decisions/decisions.jsonl` | **ABSENT** | 0 | tracked |
| `agent/policy/governance/grants.jsonl` | holds | 1 | tracked |
| `agent/autonomy/actions/actions.jsonl` | absent | 0 | ignored |
| `agent/records/` | absent | 0 | ignored |
| `.control-room/state/` | holds | 1 | ignored |
| git history | holds | 92 commits | tracked |

Four of the six hold nothing. Three of those four are git-ignored, and **absent here is not
absent everywhere** — a fresh clone has none of them by design, which is a fact about the
clone rather than about what has been done. The one that is tracked and absent is the only one
where absence proves anything, and it is the approval ledger.

**The whole authorization record of this repository is one line**: the SESSION 26 grant, a
named person, a date, an authority quoted from the brief, an expiry of 9 March 2027.

**The correction record is twelve commits of ninety-two.** The classifier matches subject
lines, so it over-counts a commit that merely uses the word and cannot see a correction made
quietly inside a larger one. It is a floor, measured one way, and every pattern below anchors
to named commits rather than to it.

## 2 · How a claim in this report is checked

Nothing here stands on its own words. Every instance of every pattern carries an **anchor** —
a commit and a substring of its subject, a path that must exist or must not, a string that
must appear in a tracked file a stated number of times, or a **live measurement** recomputed on
every run. `agent/proposals/governance/evidence.mjs` resolves all of them, and
`cli.mjs check` exits 1 if any is **refuted**.

**Three states, never two.** `resolved`, `refuted`, and `unresolvable_here` — a commit that a
shallow clone does not contain, a measurement needing a ref this checkout lacks. The third is
recorded, and counted neither for nor against. A checker that reported a CI runner's fetch
depth as a false claim about history would be making exactly the mistake §5's P-02 is about.

**On this tree: 49 anchors · 49 resolved · 0 refuted · 0 unresolvable.**

The strongest anchors are the measurements, because a finding that cannot go away when it is
fixed is not a finding. Five of them:

| measurement | on this tree |
|---|---|
| `contracts_banner_vs_registry` | **drifted** — `agent/schemas/cli.mjs` prints `FOURTEEN CONTRACTS` immediately above a list of **18** |
| `grant_fields_absent` | **6 of 8** — the grant's field allowlist names six fields that appear on no record in `data/sources.json` |
| `decisions_recorded` | **0** |
| `proposals_reachable_for_decision` | **0** — nothing in this clone that a decision could bind to |
| `policy_docs_in_enabled_category` | **8 of 8** — every prose governance document is placed by `categoriseProposal()` in a category the grant enables |

## 3 · The twelve patterns

Two instances or it is not a pattern, and the rule is enforced in code: a pattern that does not
clear it is **reported as refused**, not dropped. Twelve clear it; none was refused.

| | family | pattern | instances |
|---|---|---|---|
| **P-01** | repeated correction | A stale base is read as a fact about the repository | 5/5 |
| **P-02** | repeated correction | A report states more than what was measured | 4/4 |
| **P-03** | implementation failure | A check passes for a reason nobody intended | 3/3 |
| **P-04** | repeated correction | A declared count drifts from the thing it counts | 6/6 |
| **P-05** | implementation failure | Parallel branches build the same thing twice | 5/5 |
| **P-06** | implementation failure | A lesson written on a branch never becomes a rule | 3/3 |
| **P-07** | implementation failure | Nothing is ever decided, and the mechanism explains why | 6/6 |
| **P-08** | repeated rejection reason | Every refusal is the same refusal, and it happens at the first gate | 3/3 |
| **P-09** | evidence weakness | The corpus cannot say when anything was last checked | 4/4 |
| **P-10** | UX objection | An interface defect a reader meets is measured, re-measured, and left | 3/3 |
| **P-11** | editorial correction | The copy a reader actually sees is the one nothing validates | 4/4 |
| **P-12** | implementation failure | The grant was written against a description of the tree, not the tree | 3/3 |

All six families the brief named are covered, and the suite asserts it — a family with nothing
in it would have been reported as empty rather than filled.

### The four that matter most

**P-01 · a stale base, four times, and the rule did not stop it.** SESSION 01's audit reported
three existing documents as absent (`10a97593`). A handover said the trap had missed the
session while local `main` sat 45 commits behind, at the pre-SESSION 00 bulk upload (`aed63a7`).
One session later the same paragraph, this time on the strength of the working *branch* sitting
at `origin/main` — a different question — with local `main` 47 behind (`f85be54`). And four
artifacts of SESSION 23.5 asserting the Orchestrator had never been built while it sat on a
sibling branch (`e6f2715`). **The mitigation already exists and is the first thing AGENTS.md
says.** What the four have in common is not that a rule was missing. It is that nothing
*measured* the base and nothing *failed* when it was stale.

**P-07 · nothing is ever decided, and the mechanism explains part of it.** The backlog is
usually read as attention nobody has spent. It is also a mechanism nobody can use durably:
`deriveApproval()` resolves a decision against `agent/records/`, which is git-ignored, so a
decision recorded today reads `void_unknown_proposal` on any other machine until the producing
agent is re-run over the same corpus. The reading surface is the other half —
`docs/FIRST-END-TO-END-AUDIT.md` H-1: a person approving in the Control Room is not shown the
twelve mandatory conditions their approval stands over, and in the simulated run an approval
was granted while seven of the twelve failed.

**P-12 · the grant reaches further than it reads, and also reaches nothing.** Measured, and
this session's own finding rather than an inherited one. `NEVER_AUTOMATIC_PATHS` names
`agent/policy/` with the reason *"protocol §24: the system must not autonomously rewrite its
own governance policy — including by granting itself the right to."* The grant's path
allowlist names `docs/`. **`docs/AUTONOMY-POLICY.md` is that policy, in the form a person
reads it**, and `categoriseProposal()` places any `ImplementationProposal` whose every path is
under `docs/` into `machine_derived_field`, which the grant enables. All eight prose
governance documents land there. The three lists that guard the executable policy —
`NEVER_AUTOMATIC_PATHS`, `NEVER_WRITABLE`, `LEGAL_RECORD_PATHS` — name `agent/policy/`,
`agent/schemas/`, `tools/`, `data/`, `index.html`, `i18n/` and `js/`. None names a document
in `docs/`.

**This is not a claim that such a change would merge.** Six gates and twelve mandatory
conditions run after the category and path gates, and no autonomous change has ever merged
anything. It is a claim about which gates would not stop it. In the other direction the same
grant allowlists six fields — `last_retrieved`, `retrieved_at`, `checksum`, `content_hash`,
`recheck_interval`, `freshness_window` — that exist on **none** of the 77 records in the file
it names. A permission over nothing writes nothing, which is the safe direction, and it is
still a grant that was written against a description of the tree rather than the tree.

**P-06 · a lesson that never became a rule, which is this session's objective stated as a
defect.** A session found the stale-base failure, wrote the fix as a rule into the git-workflow
skill and into AGENTS.md — *"re-fetch and diff `docs/HANDOVER.md` against `origin/main`
immediately before the session's final write or any merge; if a session number is already
claimed on real main, retitle rather than collide"* — and pushed it to
`claude/foundation-verification-audit-40ozpo`, which was never merged. **The rule is on no
document on `main`.** Neither AGENTS.md nor the skill a session is pointed at contains it, and
`node agent/proposals/governance/cli.mjs check` measures six remote branches currently holding
work that `main` does not.

## 4 · The seven proposals

`node agent/proposals/governance/cli.mjs list` · `show <GP-nn>` for the argument, the cost and
**the case against**, which every one of them states.

| | kind | ask | class | evidence |
|---|---|---|---|---|
| **GP-01** | new validation | Check every declared count against the thing it counts | human_only | P-04, P-02 |
| **GP-02** | new rule | State what was measured, where, and whose conclusion it is | human_only | P-02, P-01 |
| **GP-03** | new skill | `.agents/skills/session-reporting/` | review_required | P-02, P-03 |
| **GP-04** | new evaluation | Measure the decision backlog, and whether a decision would survive a clone | human_only | P-07, P-08, P-10 |
| **GP-05** | reduced autonomy | Take the prose governance documents out of the automatic path | human_only | P-12 |
| **GP-06** | increased autonomy | Let a measured count be written back by the run that measured it | human_only | P-04 |
| **GP-07** | new validation | Report the work that is on a branch and not in `main` | human_only | P-06, P-05, P-01 |

**Every one requires human approval. None is decided. None was implemented by this session**,
including the three that would fix things this session found.

**GP-06 is the only one that makes the system looser, and its own entry says to read the case
against it first.** It would let an agent edit AGENTS.md — the file that tells the next agent
what it may not do — without a person, guarded by a character-level diff, which is exactly the
kind of guard that looks airtight until somebody finds the input that widens it. GP-01 gets
most of the same benefit by making the drift **visible** rather than self-correcting. It is
proposed because the evidence for the pattern behind it is the strongest of the twelve, and it
is proposed alongside the argument for refusing it.

**The classes are derived, not declared.** `classOf()` reads what a proposal would touch
against `NEVER_AUTOMATIC_PATHS` and the eight prose policy documents. GP-03 comes out
`review_required` rather than `human_only` because **`.agents/skills/` is on none of the
never-automatic lists** — a skill tells an agent what to do, and no list in this repository
treats one as governance. That is an observation, not a recommendation; narrowing it would be a
governance change, and this session does not make those.

## 5 · What was built, and the three design decisions worth disagreeing with

`agent/proposals/governance/` — six modules, a README, **45 tests**.

**The records are not on the inter-agent bus, and `contract` is `null`.** The eighteen
contracts in `agent/schemas/` are for records that pass between agents; a governance proposal
passes from this module to a person. Registering a nineteenth to carry it would have put a
governance record on the agent-to-agent bus and changed the gate every other record goes
through — a `schema_change`, a category no policy may ever automate. **The cost is real and
GP-04 names it**: `deriveApproval()` indexes only registered contracts in the git-ignored
record store, so a decision recorded against one of these proposals would read
`void_unknown_proposal` elsewhere until the module is re-run.

**The proposals are derived, not stored.** Computed from `patterns.mjs` on every run with
content-derived ids, so a re-run mints the same ids from the same evidence and no JSON copy
exists to drift from the reasoning that produced it. The suite asserts that the ids do not
depend on the as-of date, because a decision binds to a hash.

**Nothing here writes, and it is proved twice.** No module calls a write API — asserted as a
*call* rather than a mention, so the header that explains the rule does not violate it — and a
full run is asserted to leave the working tree byte-identical. Neither `recordDecision` nor
`recordGrant` is imported anywhere in the directory, and the CLI has no `decide`, `apply`,
`grant` or `record` verb, which the suite checks by reading it. Protocol §24 reserves a change
to this system's governance to a person; a module that both proposes governance changes and
can apply one is that reservation on the honour system.

## 6 · Two live drifts, found and deliberately not fixed

**`agent/schemas/cli.mjs:28` prints `FOURTEEN CONTRACTS` and the registry holds eighteen.** The
banner is printed immediately above the list it disagrees with.

**And the SESSION 26 handover records the boundary scan at 225 files under `agent/` where
every SESSION 26 commit holds 226.** This one was not looked for: it surfaced while re-running
the boundary check for this session, which reported 233 after staging — 226 on `origin/main`
plus this session's seven. `git ls-tree -r --name-only <sha> agent/` returns 226 at `ae556ad`,
`c3b613f` and `aaf6691` alike. A hand-written count, one out, in the paragraph that exists so a
later session can detect drift.

**Both are left standing.** They are the worked examples GP-01 exists for, and a validation
proposed with no live instance is a validation nobody can evaluate. Fixing them is two words;
they are two words a person should decide to spend, in the same review as the check that would
have caught them. If GP-01 is refused, the words should be spent anyway. Both are anchored in
P-04, so if either is fixed the anchor stops holding and the pattern says so.

## 6a · P-01 fired again, on this session, at the merge

Recorded because leaving it out would be the failure P-02 is about. Immediately before merging
this work, `git log main..origin/main` reported **local `main` three commits behind** — at
`4fe1952`, the SESSION 25 correction, with the whole of SESSION 26 missing. Merging into it
would have reverted the limited-autonomy activation.

It was reset to `origin/main` rather than merged into, which is what `aed63a7` did in the same
situation. **This is the fifth time the trap has caught a session, and the first time it caught
the session that was writing the pattern about it.** The check that found it is the one
AGENTS.md tells every session to run, run on `main` itself rather than on the working branch —
which is precisely the distinction `f85be54` was written to record.

It is the strongest argument on this page for GP-01 and GP-07 over GP-02: the rule was read, by
a session whose whole subject was that rule, and the rule is not what caught it. **A measurement
caught it.**

## 7 · What this session did not do, named rather than implied

- **It decided nothing and it changed no policy.** `DEFAULT_POLICY.enabled_categories` is
  still `[]`, the grant ledger is unchanged at one line, `agent/policy/` was not edited, and
  `agent/implement/decisions/decisions.jsonl` is as absent after this session as before it.
- **It added seven proposals to a queue nobody has ever decided from.** That is the honest
  description of the work, and P-07 is the pattern that says so. Seven more pending records do
  not convert repeated intervention into durable knowledge; a person deciding them does.
- **It fixed none of the twelve patterns**, including the three whose fix it wrote out in full
  (GP-01, GP-02, GP-07) and the drift in §6.
- **It did not touch `data/`, `i18n/`, `js/`, `css/`, `index.html` or any page.** No legal
  fact, citation, date, article number or status was written, changed or moved.
- **It did not merge SESSION 27.** `claude/continuous-improvement-loop-vpd2u1` holds
  `agent/improve/`, a repaired autonomy gate ladder and two further findings, and is not in
  `main`. This session read it and cites none of its documents as evidence, because a document
  on an unmerged branch is not something a reader of `main` can check. **It is one of the six
  branches P-06 counts**, and merging it is a decision for the repository author.

## 8 · What none of this proves

- **The grouping is a judgement and no anchor tests a judgement.** Every instance is
  checkable; that twelve instances are four patterns rather than seven is this session's
  reading, and a reader may regroup them.
- **The corrections are the corpus because the decisions do not exist**, which means every
  pattern here is drawn from what went *wrong* and none from what a person approved. There is
  no evidence in this repository about what makes a proposal acceptable, because nothing has
  ever been accepted.
- **A pattern about a `docs/` path is a pattern about a gate, not about a merge.** §3's P-12
  states its own limit: six further gates and twelve conditions run afterwards, and nothing
  autonomous has ever merged anything.
- **`cli.mjs check` cannot see what it cannot reach.** On a shallow CI checkout the commit
  anchors report `unresolvable_here` and the check still exits 0, which is correct and worth
  nothing — which is why the workflow's agents job now checks out with `fetch-depth: 0`.
- **Nothing here was reviewed by anyone.** Seven proposals, forty-nine anchors and twelve
  readings, produced in one session, by the same session that decided what counted as a
  pattern.
