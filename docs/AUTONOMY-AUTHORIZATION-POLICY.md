# The autonomy and authorization policy

**Status:** binding, and **executable**. `agent/policy/` is the policy; this document
describes it. Where the two disagree, the code governs and the disagreement is a defect in
this file.

**Session:** 23. **Relationship to what was already here:** `docs/AUTONOMY-POLICY.md`
(SESSION 01) defines the four autonomy classes A/B/C/D and the nineteen prohibited automatic
actions, and remains in force unchanged. This document does not restate it. What SESSION 23
adds is the part that was only ever prose: **a mechanism that answers, for one specific act,
whether it may happen without a person — and refuses when it may not.**

---

## 1 · What was missing, said plainly

Before this session the repository could say what was forbidden and could not *enforce* it at
the point of action. `docs/AUTONOMY-POLICY.md` is a document; `agent/implement/preflight.mjs`
checks ten things about a proposal's paperwork; `.control-room/authz.mjs` decides whether a
person may press approve. None of the three answers "may this act execute automatically",
and the protocol's §18 list of twelve mandatory conditions had no home at all.

`agent/policy/` is that home. It is five modules and a CLI:

| File | What it owns |
|---|---|
| `categories.mjs` | The action categories, the policy object, and the derivation of a category from a proposal. **The one home**: `agent/orchestrator/policy.mjs` re-exports from here rather than keeping its own list |
| `actors.mjs` | The capability matrix: actor × action × resource × environment × path × risk |
| `conditions.mjs` | The twelve mandatory conditions, and the mandatory human-review triggers |
| `rollback.mjs` | "Rollback available" as six elements a machine could execute, not a boolean |
| `engine.mjs` | `evaluate()` → a route; `mayExecute()` → whether it may happen now |
| `cli.mjs` | `policy` · `matrix` · `categories` · `evaluate --proposal <id>` |

```
node agent/policy/cli.mjs policy       # what is switched on. Nothing is.
node agent/policy/cli.mjs matrix       # 84 rows: every actor against every action
node agent/policy/cli.mjs categories   # 18 categories, 4 eligible for autonomy
node agent/policy/cli.mjs evaluate --proposal <id>
node --test agent/policy/selftest.mjs  # 34 tests, including SESSION 23's twenty
```

---

## 2 · Nothing is switched on, and that is the deliverable

`DEFAULT_POLICY.enabled_categories` is `[]`. `DEFAULT_POLICY.automatic_path_allowlist` is
`[]`. **No act in this repository can currently reach the automatic route**, and
`agent/policy/selftest.mjs` test 1b and test 29 both assert that it stays that way.

SESSION 23's own instruction is the reason: *"Do NOT enable automatic production merge in this
session. The objective is to establish and verify the policy, not to activate unrestricted
autonomy."* Filling either list is a **governance change**, and protocol §24 says the system
may not make one to itself: it needs a governance proposal and a human decision.

So the suite proves the permitting half against `SIMULATION_POLICY` — a fixture marked
`simulated: true`, enabling one category over `docs/` — and then proves the identical act is
refused under the policy the repository ships. A suite that could only ever observe a refusal
could not tell "correctly refused" from "broken", which is the failure
`.control-room/selftest.mjs` was arranged against and the reason test 1 exists.

---

## 3 · The three routes

`evaluate()` returns one of three, and the third is not a softer second.

| Route | Meaning |
|---|---|
| `automatic` | Every mandatory condition is satisfied, the category is enabled, and the actor holds the capability. Unreachable today. |
| `human_review` | The act may proceed **through a governed human decision**. A legal interpretation, an editorial change, a schema change and a deletion all land here. They are not forbidden; they are a person's to authorise. |
| `blocked` | The act may not proceed, **and an approval would not change that.** |

`blocked` is protocol §8 as code: human approval "does not override provenance requirements;
validation requirements; security requirements; scope restrictions; mandatory policy
conditions." `NOT_WAIVABLE_BY_APPROVAL` in `conditions.mjs` is that sentence as a list. A
proposal with missing provenance is not waiting for a reviewer — it is waiting for the agent
that owns it.

One condition reports both kinds of failure and marks which: `scope_permitted` returns a hard
refusal for a **boundary** violation (a never-writable path; a change git says left the
approved scope) and a soft one for "this path is not on the *automatic* allowlist", which is
the ordinary state of every path here and says only that a person decides. Without that
distinction every proposal in the repository would read as blocked-beyond-approval for the
sole reason that autonomy is off — which is false, and the opposite of what an empty
allowlist means.

---

## 4 · The twelve mandatory conditions

Failure of **one** blocks automatic execution (§18). They are evaluated **all twelve, always**
— it is cheaper to stop at the first and it produces a worse report, the same reasoning
`agent/implement/preflight.mjs` records about its ten gates.

| # | Condition | Derived or supplied |
|---|---|---|
| 1 | `authoritative_evidence` | derived — role `primary`/`official`, or a `tier:1`/`tier:2` source record |
| 2 | `verification_succeeded` | **supplied** |
| 3 | `no_unresolved_conflict` | **supplied**, and also read off the proposal |
| 4 | `provenance_complete` | derived |
| 5 | `schema_validation` | derived — re-run now, never trusted from when the record was written |
| 6 | `validators_pass` | **supplied** |
| 7 | `browser_qa` | requirement derived from the paths; result **supplied** |
| 8 | `risk_within_threshold` | derived, against the policy ceiling |
| 9 | `rollback_mechanical` | derived — §6 below |
| 10 | `scope_permitted` | derived, plus the post-change git enforcement |
| 11 | `category_allowed` | derived |
| 12 | `no_mandatory_human_review` | derived |

### Three verdicts, and the third is the point

`satisfied` · `failed` · `unknown`. **An `unknown` blocks exactly as a failure does.** This is
the project's own rule — `null` is not `unknown`, unknown is never zero, and nothing travels
from not-looked-at to fine — applied where getting it wrong would let a machine write to a
website about EU law. A caller that simply omits a fact gets `unknown`, and `unknown` does
not execute. `browser_qa` additionally has `not_applicable`, which is what it is when nothing
in scope renders.

### What can and cannot be supplied

**Eight of the twelve cannot be supplied at all.** They are read out of the proposal record on
every evaluation. There is no `skip`, no `assume`, and no `permittedFiles` parameter: the
thing being constrained does not get to supply the constraint.

**Four are measurements and must be supplied**, because running the validators takes ninety
seconds and opening a browser takes longer, and an evaluator that ran them on every call is
an evaluator nobody calls.

**So: within one process, a caller can pass a false fact.** That is not closed, and pretending
otherwise would be worse than the gap. What *is* closed is the default — absent means unknown
means blocked — and at the real enforcement point, `agent/implement/implementer.mjs`, the
facts are the return values of runs that just happened rather than arguments from anywhere.
Anything arriving over HTTP is authorized server-side by the Control Room before it gets
near this.

---

## 5 · The categories

Nineteen, of which **five are eligible for autonomy** — the five protocol §20 names — and
**fourteen may never be automated by any policy**. Eligible is not enabled.

**Eligible (the five protocol §20 names):** `source_metadata_maintenance` · `retrieval_metadata` ·
`source_url_correction` · `machine_derived_field` · `governed_metadata_maintenance`.

**Never:** `legal_interpretation` · `legal_conclusion` · `critique` ·
`substantive_analytical_change` · `substantive_editorial_change` · `schema_change` ·
`taxonomy_change` · `deletion` · `major_rewrite` · `architecture_change` ·
`ambiguous_legal_status` · `unresolved_contradiction` · `substantive_data_change` ·
`uncategorised`.

`uncategorised` is the residue and it is deliberately not a safe default: an act this policy
cannot place does not execute, because "default when unsure: the higher class".

**The category is DERIVED, never declared.** `autonomy_class` is a field the *proposing agent*
sets, and an agent that wanted its change automated would set it to `autonomous`.
`categoriseProposal()` computes the category from the operation kinds, the datasets, the
paths and the epistemic block, strictest branch first — a removal is a deletion whatever else
the change does; a proposal whose own epistemic block records an interpretation is an
interpretation whatever its summary says. Where the derived category and the declared class
disagree, **the stricter governs** (`effectiveClass()`).

A policy that tried to enable a never-automatable category cannot: `categoryAllowed()` reads
`automatable` before it reads the enabled list, and test 9 plants exactly that.

---

## 6 · Rollback: six elements, not a boolean

SESSION 23: *"'Rollback available' MUST be mechanically meaningful… A boolean field alone is
insufficient."*

`assessRollback()` asks for six things and answers `unknown` rather than `false` where it
cannot see one — and `mechanical` is true only when all six are present:

1. **previous known-good state** — a commit, plus the per-file hashes `openContext()` records
2. **change identifier** — the proposal, and the path set
3. **branch and commit** — and never `main`, because a rollback on `main` is a rollback of the published site
4. **procedure** — executable steps, not an intention
5. **execution mechanism** — a named function; "somebody reverts it" is not one
6. **post-rollback validation** — how anybody knows it worked

The distinction from `preflight.mjs` gate 10 matters: that gate proves the proposal *says* how
it would be undone. This proves **there is a state to go back to**. In this repository that is
not academic — `docs/AUTONOMY-POLICY.md` §4 records that the pre-SESSION-00 history is 47 bulk
uploads with no message explaining a change, so "revert the commit that introduced it" names a
commit that does not describe a change.

---

## 7 · The authorization model

`agent/policy/actors.mjs` — six actor kinds, fourteen actions, thirteen resource kinds, five
environments. **84 rows**, and `matrix()` proves every actor has exactly one verdict for every
action: `permitted`, `never`, or `denied_by_default`.

| Actor | Holds | Never |
|---|---|---|
| `human` | read; approve/reject/request-changes (through the Control Room's own matrix); governance; publish; rollback | — |
| `specialist_agent` | read, write records, propose, run validators | implement · approve · write the ledger · publish · change governance · route |
| `orchestrator` | read, route, enforce policy, write records | propose · approve · write the ledger · implement · publish · change governance |
| `implementation_qa` | read, validate, **apply inside an approved scope** (requires a grant), rollback | approve · write the ledger · propose · publish · change governance · route |
| `deployment_system` | read the deployment, run validators in CI | **publish** · implement · approve · write the ledger · change governance |
| `public_client` | **nothing** | everything |

Two properties worth naming.

**This is not a copy of `.control-room/authz.mjs`.** That module answers a question about a
*person at an HTTP request*: may this operator approve this proposal. This one answers a
question about a *component inside the pipeline*. The only actor kind common to both is
`human`, and for a human this module **imports** the Control Room's matrix rather than
restating it. One home per fact holds across a security boundary as well as across a dataset.

**`deployment_system` exists so that the permission is defined and refused rather than
undefined and available.** There is no deployment system in this repository: GitHub Pages
serves `main`, a push publishes, and `.github/workflows/qa.yml` is not a deploy gate.

### No privilege travels through a parameter

`authorizeActor()` reads the actor's own identity and the matrix. It has no `on_behalf_of`, no
`delegated_by`, no `as`. Seven such names are listed in `ESCALATION_PARAMETERS`, and if one is
supplied it is **not honoured — it is reported**, as an attempted escalation, because a
request carrying one expected it to work. That is the mechanical answer to "no component may
escalate its privileges through another component": there is no parameter through which a
privilege could travel.

---

## 8 · How it is enforced

SESSION 23: *"Do not implement the policy solely as documentation, prompts, comments or agent
instructions."*

`agent/implement/implementer.mjs` calls it **twice** per proposal:

1. **Before a line is written**, from the proposal, the actor and the policy in force, with the
   measured facts still `unknown` — which is what they are. A `blocked` route is a refusal
   recorded on the trace with its reason; the run never opens a change context.
2. **After the checks**, with the validators, the browser suite and the git scope enforcement
   as measurements. A `blocked` route here joins a failed check and a scope breach as a reason
   to **revert**.

`agent/policy/selftest.mjs` test 30 asserts both call sites exist and test 31 asserts the suite
is registered in `AGENT_SUITES` and in CI — a suite nothing runs is a suite that gates nothing.

---

## 9 · The hidden Control Room entry

SESSION 23 permits the public site "a deliberately subtle and aesthetically integrated
discovery mechanism": search bar → a phrase → a transition → the Control Room login.
`js/threshold.js` is it, and the whole of it.

**What it is.** A reader who types `thirty-two paths` into the palette gets one extra result.
Choosing it draws a wheel — three concentric bands divided 3 · 7 · 12, twenty-two Hebrew
letters set around them, fine lines in the site's own ink — and then offers a link to a login
page.

**What it is not.** It does not authenticate, authorize, approve, execute, or read anything
privileged. `js/threshold.js` contains no `fetch`, no `XMLHttpRequest`, no `localStorage`, no
`sessionStorage`, no `document.cookie`, no `Authorization`, no `Bearer`, no `password` and no
`csrf` — asserted, string by string, by test 18. **The phrase is not a credential**: it is
written in a file served to every reader, and anybody who finds it arrives at the same login
page as anybody who typed the URL. Protocol §10 says a hidden route, a hidden link,
`robots.txt`, a frontend check and an unlisted page are *not* security mechanisms; a discovery
affordance that had to stay secret to be safe would be one of them, and this one does not.

**Where it leads is usually nowhere.** The Control Room is `.control-room/`, which this site's
deployment does not serve. The module reads an address from
`<meta name="eu-control-room">` and **never invents one**; no published page declares it (test
18 walks every `.html` file and asserts so), so on the live site the passage ends at a
statement rather than a navigation.

**Why the wheel is not decoration.** The Sefer Yetzirah tradition's twenty-two letters are an
*enum authority* — a closed vocabulary from which everything else is said to be composed —
which is what `data/taxonomy.json` is to every other dataset on this site. The transition says:
a closed vocabulary, recognised, and a door behind it. No terminal green, no neon, no
arbitrary symbols; it is the palette's aesthetic one layer quieter.

**It is interruptible and it degrades.** Escape or a click ends it; `prefers-reduced-motion`
skips to the end state; a browser without inline SVG gets the panel and the link. No state
anywhere depends on the animation completing, and with no `document` at all `passage()`
returns `null` rather than throwing.

**Measured in a real browser**, not reasoned about: `agent/browser/checks.mjs checkThreshold`
adds nine checks — the phrase produces exactly one result and a near miss produces none, the
panel's rendered text carries no privileged word, its links carry no query string, **opening
it issues no network request at all**, Escape leaves the reader where they were, and the pages
add no `window` global whose name suggests a credential (compared against a blank document in
the same browser, because `sessionStorage` and `credentialless` are Chromium's own and the
naive form of that check reported the browser as a defect in the site).

---

## 10 · What this policy does not prove

Every one of these is a real limit, and the reason it is here rather than in a footnote is
that the document's own subject is not overstating what a mechanism establishes.

1. **It is not a boundary between processes.** Four of the twelve conditions are supplied
   facts, and anything running in this process can supply them. §4 above says how that is
   mitigated and does not claim it is closed.
2. **No act has ever taken the automatic route**, here or anywhere, because no category is
   enabled. Everything the suite proves about that route is proved against a fixture policy.
3. **The Orchestrator is here, and it enforces this policy — but nothing dispatches yet.**
   SESSION 22's `agent/orchestrator/` was merged in, `autonomyPermits()` calls `evaluate()`,
   and `permitted` requires both to agree, so SESSION 23's "the implementation layer **and**
   Orchestrator" is satisfied on both halves. What is still true: **no dispatcher is wired**,
   so a workflow run reports `not_dispatched` and ends `unresolved`. The enforcement path has
   been exercised by tests and by the verification gate, and by no real run.

4. **`categoriseProposal()` reads records, not prose.** It cannot tell that a proposal
   described as a metadata correction in fact changes what a claim asserts, beyond what the
   record's own fields say. The four validators cannot read prose either
   (`docs/AUDIT-2026-09-01.md`), and this does not close that.
5. **Risk is a field the proposing agent sets.** `risk_within_threshold` compares it against a
   ceiling; nothing here independently assesses whether the number is right.
6. **The 84-row matrix has been exercised by a test suite and by nothing else.** No component
   other than `agent/implement/` calls `evaluate()` today.
