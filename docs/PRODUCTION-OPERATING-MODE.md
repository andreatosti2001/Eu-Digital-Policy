# PRODUCTION OPERATING MODE

**SESSION 29.** Activate production operation under the existing autonomy policy; define the
daily cycle, the weekly reviews and the monthly reviews; keep the system observable
end-to-end; verify the Control Room discovery boundary and the final visual standard; **output
a final readiness checklist and stop if any mandatory condition fails.**

**It stopped.** `node agent/production/cli.mjs readiness` reports **`refused`**: twelve of the
twenty mandatory conditions pass and **eight block**. Production operation is **not
activated**, and this document is the account of why, what was built, and what was found on
the way.

> **SESSION 30 · 12 September 2026 — the count moved and the refusal did not.** On that
> session's tree the same checklist reports **fourteen of twenty passing and six blocking**,
> and it still exits 1. Two of the eight are closed. `validators_at_baseline` passes because
> `tools/freshness.mjs`'s exit code now reports defects in the tree rather than the passage of
> time — the disagreement §4 records as undecided is settled, and the reasoning is in
> `docs/CURRENT-ARCHITECTURE.md` §12 and the head of `tools/freshness.mjs`.
> `browser_suite_pass` passes because the three SESSION 19 defects are fixed **in the
> website**: `docs/BROWSER-QA.md` §4a. **The remaining six are unchanged**, HE-04 included, and
> none of them is closable by editing a check: the adversarial CRITICAL is left red on purpose
> (§4a below), and the other five need a governance decision or network access this
> environment does not have. Nothing in `agent/production/` was edited to move the count.

**Module:** `agent/production/` · **Suite:** `agent/production/selftest.mjs`, 52 tests
**Measured at:** 11 September 2026, on `claude/production-operating-mode-0ti3hu` cut from
`origin/main` at `a25f0ed`.

---

## 1 · What was built

Four things, and a gate that reads all of them.

| File | What it holds |
|---|---|
| `schedule.mjs` | The daily cycle's eight stages, the seven weekly reviews, the seven monthly reviews — as data, each naming the command that runs it and **what it cannot establish** |
| `visual.mjs` | The ten conditions the brief sets on the hidden-entry animation, measured against `js/threshold.js` and the `.thr-*` rules in `style.css` |
| `separations.mjs` | The three things the hidden search combination MAY do, the six it must NEVER do, and every occurrence of the trigger phrase outside its home |
| `traceability.mjs` | Every path by which a published file can change, and whether each leaves a durable record naming the evidence |
| `readiness.mjs` | Twenty-one conditions in ten domains, and `assessActivation()` — the stop |

**Nothing in the directory writes, and the suite proves it twice**: no module calls a write
API — asserted as a *call*, so a header explaining the rule does not violate it — and a full
run of all four read-only verbs leaves the working tree byte-identical. There is no
`--execute`, no `--record`, no `--force` and no `--activate`.

**The report does not restate the checklist.** `node agent/production/cli.mjs readiness` is
the one home for those twenty-one verdicts; quoting them here would be the second copy this
project's first principle forbids. What is below is the reasoning and the findings that are
this session's own.

## 2 · The daily cycle, and the two stages that cannot run

The eight stages are the brief's, in the brief's order: Scout → Verify → Detect Change →
Assess Data Depth → Route impact → QA → Governance → Publish or Request Approval.

**The loader refuses a cycle whose terminal stage is not a human stage** — the same refusal
`agent/orchestrator/workflows.mjs` applies to its ten workflow types, and for the same reason.
The eighth stage is a person's in **both** directions: there is no deploy gate, so publishing
is a person pushing, and the autonomy runner's merge reaches the working branch and stops.

Two stages are declared and **cannot do what their names say**, which is why every stage
carries a `cannot`:

- **Scout** reaches no registered endpoint *from a development container*. SESSION 25 ran
  `--live` against the five real endpoints and that environment's network policy refused all
  five; SESSION 30 confirmed the same refusal, including for the deployed site itself.
  `freshness.mjs` prints a `SOURCE REACHABILITY` heading and performs no network I/O at all,
  and **no URL in `data/sources.json` has ever been fetched** (AUDIT F-12).

  > **SESSION 30 correction.** *"Scout reaches no registered endpoint"* was stated as a
  > property of the Scout and it is a property of the **container the check ran in**. The
  > scheduled workflow runs on a GitHub Actions runner with ordinary egress, and it has
  > worked: the run of **7 September 2026** fetched **17 documents** with **0 refused by
  > egress policy**, producing candidates from `www.edpb.europa.eu` and
  > `www.enisa.europa.eu`, while EUR-Lex answered 202 and the EDPS answered 403 — the
  > origins' own answers, not a policy denial. The digest recording it is committed on
  > `scout/digest-digest-2026-09-07T06-38-26Z`, which is **unmerged**.
  >
  > `readiness.mjs` reported `0 of 5 reachable` because `facts.network` was a **hard-coded
  > constant**, not a measurement, whose own comment claimed SESSION 25's run was "the only
  > measurement this repository has ever taken". It was not. The fact is now derived from
  > the Scout's committed digests — `agent/scout/digests/` is git-tracked precisely so a live
  > run leaves durable evidence — and a tree with no digest reports **`unmeasurable`**, which
  > blocks activation exactly as a failure does. **The verdict did not move: 14 of 20 pass
  > and 6 block, as before.** What moved is that the reason is now true.

  A daily Scout that cannot retrieve a document cannot detect a change in the law, and every
  stage downstream of it inherits that — so the question is which environment the daily cycle
  runs in, and that is a decision, not a defect.
- **Route impact** dispatches nothing. There is no `agent/orchestrator/dispatchers.mjs`; the
  only dispatcher here is `agent/simulation/dispatchers.mjs`, whose own suite refuses it eight
  primitives by name so that it cannot write, spawn or fetch. A run outside the simulation
  reports `not_dispatched` at every dispatch stage and ends `unresolved`.

The fourteen reviews all name a command that exists in this tree, and all fourteen are checked
on every push. **None of them produces a decision**, and each says in its own `human_step`
what a person still has to do with what it produced.

## 3 · The final visual standard: ten of ten

`node agent/production/cli.mjs visual`. With a browser result supplied, **all ten pass**.

The five worth stating, because they are the ones the brief is most specific about:

- **The geometry is read out of the module, not restated.** Three concentric bands at
  r = 148, 104, 62, divided 12 · 7 · 3, carrying 3 + 7 + 12 = 22 letters, drawn as SVG circles,
  lines and text. No image, no font file and no third-party asset is loaded for it.
- **The borrowing is argued rather than taken.** The module's own header states why the
  division is there: the tradition's twenty-two letters are an **enum authority** — a closed
  vocabulary from which everything else is composed — which is what `data/taxonomy.json` is to
  every other dataset here. The check requires that argument to be present, so deleting it
  fails the criterion.
- **No arbitrary symbol.** Every non-Latin glyph in the module's executable code is a member of
  the declared 22-letter enum. No star, no cross, no crescent, no tetragrammaton, no sigil.
  The mark on the search result is the first member of the enum, not a separate emblem.
- **No genre aesthetic.** None of twenty genre signatures appears in the module or in the
  threshold style rules, and no full-saturation terminal green is declared. Strokes are
  hairlines at 0.75 and 1; there is no glow, no fill and no flicker; the one continuous motion
  is a 24-second rotation.
- **Reduced motion holds three ways**: the module reads `prefers-reduced-motion`, a reader who
  asked for none gets `.thr-still` which is the finished state, and the stylesheet's
  `@media (prefers-reduced-motion:reduce)` block sets `animation:none` on every animated
  selector — so the preference holds even if the module's own read were bypassed.

**Two of the ten are settled only in their mechanical half and say so.** Whether the drawing
*looks* like the rest of the site, and whether a practitioner of the source tradition would
accept the construction, are judgements by people. No contrast was computed, no screen reader
was run and no pixels were compared: **README limitation 7 stands over this affordance exactly
as it stands over the rest of the site.**

## 4 · DISCOVERY ≠ AUTHENTICATION ≠ AUTHORIZATION

`node agent/production/cli.mjs separations`. **All six prohibitions hold and all three
permissions are available.** The phrase is absent from all eleven Control Room source files,
and no published page carries a `type="password"` field.

This does not duplicate `agent/policy/verify/`. That module **attacks** a running Control Room
with forged claims; this one reads the tree and asks whether the mechanism has the
**capability** to do any of the six things at all. An attack that fails proves the door held
today; a capability that is absent proves there is no door.

### 4a · HE-04, measured — and deliberately left red

`agent/policy/verify/attacks.mjs` HE-04 is **CRITICAL** and has reported **SUCCEEDED since
SESSION 24**, on the trigger phrase appearing in `agent/simulation/threshold.mjs`. AGENTS.md
records the suspicion that this is a false positive of the HE-01 shape. **It was a suspicion,
and nothing had checked it.**

The attack's own finding text names the condition it could not check: *"if any of those reads
it as an input, it is a credential"*. `separations.mjs` checks it, on two independent halves:

- **Position.** All eight occurrences in that file are placed, and none is `undetermined`:
  three are probe paths in a fixture table, two are arguments handed to the client module's own
  matcher, one is a needle in a regex searching source text, one is prose, one is quoted code.
  **None sits on either side of an equality test**, which is the shape a credential check has.
- **Capability.** The file calls **none** of the twelve granting primitives. It cannot honour
  the phrase as a credential because it cannot honour anything.

`agent/simulation/threshold.mjs` is therefore **cleared on both halves** — and the line HE-04
hits is the separation check that searches Control Room source **to prove the phrase is absent
from it**.

**HE-04 is left red, and this is a decision rather than an oversight.** Reclassifying a
CRITICAL by editing the thing that reports it is the move this architecture is arranged
against, and a **stale exclusion list** is the specific shape SESSION 23.5 already had to
correct once — HE-04's three path exclusions are that list. A person decides whether the
attack is rewritten; the readiness report carries both facts, and `adversarial_gate_clean`
stays a blocking failure until somebody does.

### 4b · Three states, never two

A binary verdict here would have to call a file that **can** grant but never compares the
phrase either "cleared", which overstates what was established, or "uncleared", which reports
the policy suite and the adversarial gate as suspected credential stores for doing the job
they exist to do. Neither is what was measured, so there are three:

| verdict | meaning |
|---|---|
| `cleared` | no granting capability, and no occurrence where a credential check would sit |
| `no_path_found` | the file **can** grant, and no path was found from the phrase to that capability. **A path not found is not a path proven absent** |
| `read_it` | an occurrence is compared, or could not be placed |

Today: four cleared, two `no_path_found` (`agent/policy/selftest.mjs` and
`agent/policy/verify/attacks.mjs`, which both drive real authorization code because that is
their purpose), none needing a read.

### 4c · What this session did NOT do to the hidden entry

Nothing. `js/threshold.js`, `style.css`, `index.html` and every other page are **byte-identical
to `a25f0ed`**. The visual standard was verified, not adjusted. SESSION 24's three
intended-sequence mismatches stand unrepaired, including the one that **must** stand: phase 6's
"reveal CONTROL ROOM followed by the normal authentication interface" must never become a login
form on a published page.

## 5 · Traceability: one of three

**Every website modification must remain traceable to its originating evidence and execution
trace.** Measured as: enumerate every path by which a file in the published surface can change,
and ask of each whether it leaves a record that survives a fresh clone and names what justified
it.

| path | traceable | why |
|---|---|---|
| the autonomy runner | **yes** | its commit message names the proposal, the agent, the category, the policy, every grant with who wrote it, the files, the check verdict, the base commit and an executable restore command |
| a person edits a page and pushes | **no** | nothing requires a commit message here to name evidence and nothing checks one |
| a decision through the Control Room | **no** | the decision ledger is **absent** |

**The widest untraced path is the most likely one**, and it is not an agent defect. Requiring
evidence in a human commit message is a governance decision about how the repository author
works, and an agent may not take it.

**A tracked README is not a record.** The first draft of `traceability.mjs` counted
`agent/implement/decisions/README.md` and reported the decision ledger as durable. It is
absent, which is the SESSION 28 finding arrived at independently: of six decision stores, that
is the one where absence proves something, because it is git-tracked. Placeholders are now
counted separately from records — and those same placeholders are what `agent/policy/verify/`
PP-08 reports at HIGH, for a different reason.

**Observability is not a mood, and one number of it is weaker than it reads.** Fourteen of
twenty-one agent CLIs open a run on the tracer. The seven that do not are registers and
checkers that run nothing and write nothing, so an untraced run of one changes no state. It is
recorded as **advisory** rather than mandatory, and recorded at all so that the day one of them
gains a write path, the line is already here.

## 6 · What this session repaired, and what it did not

**Repaired — the Orchestrator's register commands, dead since the SESSION 26 merge.**
`agent/orchestrator/cli.mjs:50` imported `AUTONOMY_NOTE`, which `policy.mjs` stopped exporting
when the note became derived, so **every verb of that CLI exited 1** — `workflows`,
`capabilities` and `policy` alike. It now calls `autonomyNote()`. That is not only a repair to
a broken command: the constant said *"No action category is approved for automatic execution in
this repository"*, which **stopped being true in SESSION 26**, and the derived note reports the
five categories the grant actually enables. `docs/GOVERNANCE-PROPOSALS.md` §6b described this;
it is now fixed rather than described.

**Repaired — the adversarial gate is in CI, in a job of its own.** AGENTS.md's standing lesson
was that the gate is *not* in CI, "which is how a CRITICAL stayed red across three sessions" —
five, by now. The workflow ran the gate's own **suite**, which proves it is reproducible and
says nothing about what it **found**. It gets a job to itself because a failing step skips every
step after it in the same job, and a step expected to be red must hide nothing.

**Not repaired, deliberately:** HE-04 (§4a) · the three SESSION 19 browser defects, which are
Class C interface work and which the handover says explicitly not to fix on an agent's own
initiative · the `__CONTENT__` drift · OB-05 and PP-08 · the `freshness.mjs` baseline
disagreement, which is either a tooling defect or a wrong number in
`docs/CURRENT-ARCHITECTURE.md` §12 and is nobody's decision yet.

## 7 · Three false positives, found in this module

Every one is the HE-01 shape — a scan reading a module's own denial as a finding — and every
one has a test pinned to the exact input that fooled it. They are recorded because the module's
whole subject is a check that has been wrong in this way for five sessions, and a session that
wrote three of its own while fixing it should say so.

1. **A capability scan that counted its own vocabulary.** The first draft reported
   `separations.mjs` as calling all thirteen granting primitives, on the strength of the array
   declaring their names — and then, after strings were masked, as calling five of them, on the
   strength of the regex that *searches* for them. Strings, comments and regex literals are all
   masked now. This is the **opposite** of HE-01's rule two directories away, which keeps string
   literals because a credential is one; this looks for a capability, and a capability is a call.
2. **A deploy check that fired on a sentence.** `!/deploy|publish|push|build/` failed on the
   panel text *"This deployment does not publish its address"*. Somebody would eventually have
   deleted the sentence to clear the check. It asks about capability now: a process, a request,
   or a navigation the module initiates itself.
3. **A stylesheet line scan that missed a declaration.** `.thr-go,.thr-back{ … }` spans five
   lines and only the first carries `thr-`, so the minimum hit target was reported absent when
   it is declared. The scan reads whole rules.

A fourth was worse and is worth naming separately: **the browser fact read the wrong key.**
`gatherFacts()` read `browserJson.checks`, and the browser suite's JSON calls that array
`results`. Every run therefore came back with zero failures, and the **mandatory**
`browser_suite_pass` condition **passed while the suite was exiting 1 on three real
reader-facing defects**. It now reads the suite's own `qa_check.exit_code` and `failed`. A
checklist that reports green because it read the wrong field is worse than no checklist, and
this one did, briefly, in exactly the way the whole module exists to prevent.

## 8 · What none of this proves

- **The readiness report is not a run of the system.** Nothing here reached a source, opened a
  workflow, dispatched an agent or decided anything. It measures whether those things could
  happen safely, and answers no.
- **There is no readiness score.** Ten domains that fail differently do not have a mean.
  `assessActivation()` returns `overall_score: null`, which is the refusal
  `agent/health/model.mjs` makes by throwing.
- **The occurrence classifier is lexical**, and it defaults to `undetermined` rather than to
  safe. `no_path_found` exists so that "we did not find a path" is never written down as "there
  is no path".
- **A passing readiness condition proves what it measured and not its name.** `visual_standard`
  passing does not establish that the animation is beautiful; `separations_hold` passing does
  not establish that a Control Room deployed somewhere else is safe.
- **The schedule fires on nothing.** No timer, no cron, no daemon. It declares the order and
  the ownership, which is the half that did not exist. Nothing in this session made anything
  run on a cadence, and describing it as "production operation, activated" would be false.
- **Nothing here was reviewed by anyone.** Twenty-one conditions, ten domains and a refusal,
  produced in one session by the session that decided what counted as a condition.
