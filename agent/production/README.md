# `agent/production/` — production operating mode

SESSION 29. The fifteenth thing in `agent/`, and the third whose subject is the other
fourteen. `agent/orchestrator/` routes one event; `agent/improve/` observes the whole system
on a cadence; this one asks whether the system may be switched on at all, and answers no.

```
node agent/production/cli.mjs readiness [--as-of YYYY-MM-DD] [--quick] [--browser-json f]
node agent/production/cli.mjs schedule       the daily cycle and the fourteen reviews
node agent/production/cli.mjs visual         the ten conditions of the final visual standard
node agent/production/cli.mjs separations    discovery ≠ authentication ≠ authorization
node agent/production/cli.mjs trace          every way the website can change, and what it leaves
```

**Every verb writes nothing, and there is no verb that could.** No `--record`, no
`--execute`, no `--force`, no `--activate`. The suite proves it twice: no module here calls a
write API — asserted as a *call*, so this paragraph does not violate it — and a full run of
all four read-only verbs leaves the working tree byte-identical.

**`readiness` exits 1 while any mandatory condition is not passed.** SESSION 29's brief says
to stop if a mandatory condition fails, and an exit code is the form of "stop" a pipeline can
read.

## The four things it holds

1. **`schedule.mjs`** — the daily cycle's eight stages, the seven weekly reviews and the seven
   monthly reviews, as data. Each names the command that runs it and **what it cannot
   establish**. The loader refuses a cycle whose terminal stage is not a human stage, which is
   the same refusal `agent/orchestrator/workflows.mjs` applies to its ten workflow types.

2. **`visual.mjs`** — the ten conditions the brief sets on the hidden-entry animation,
   measured against `js/threshold.js` and the `.thr-*` rules in `style.css`. Two of the ten
   are settled only in their mechanical half and say so in a `bound`.

3. **`separations.mjs`** — the three things the hidden search combination MAY do and the six
   it must NEVER do, plus every occurrence of the trigger phrase outside its home, classified
   on two independent halves: where the occurrence sits, and whether the file holding it can
   grant anything at all.

4. **`traceability.mjs`** — every path by which a file in the published surface can change,
   and whether each leaves a durable record naming the evidence. One of three does.

`readiness.mjs` turns all of that, plus the validators, the suites, the boundary scans, the
adversarial gate and the browser, into twenty-one conditions in ten domains. **The domains are
never summed.** There is no readiness score and `assessActivation()` returns `overall_score:
null` on purpose — the same refusal `agent/health/model.mjs` makes by throwing.

## An unmeasured mandatory condition blocks

A condition whose evidence could not be gathered is `unmeasurable`, and a mandatory
`unmeasurable` refuses activation exactly as a failure does. That is the rule this repository
already applies to a skipped browser run: exit 2 is not exit 0, because in production there is
nobody reading "skipped". It is also why `--quick` is useless for a real report and says so in
its own output.

## What it will not do

**It does not activate anything.** If every mandatory condition passed, what this module would
say is that a person MAY now take the decision. Switching a production mode on is a governance
decision, protocol §24 reserves it to a person, and the one writer of such a decision is
`agent/implement/ledger.mjs recordDecision`, which this directory neither imports nor calls.

**It does not edit the adversarial gate.** `agent/policy/verify/` HE-04 is CRITICAL and has
reported SUCCEEDED since SESSION 24, on the trigger phrase appearing in
`agent/simulation/threshold.mjs`. The attack's own finding states the condition it could not
check — *if any of those reads it as an input, it is a credential* — and `separations.mjs`
checks it, independently, and finds that file cleared on both halves. **HE-04 is left red.**
Reclassifying a CRITICAL by editing the thing that reports it is the move this architecture is
arranged against, and a stale exclusion list is the specific shape SESSION 23.5 already had to
correct once. A person decides; the readiness report carries both facts.

**It asserts none of the conditions' real-world verdicts.** The suite drives the refusal with
synthetic facts. Pinning "the adversarial gate is red" or "no dispatcher is wired" would make a
defect a requirement and its repair a test failure.

## Three false positives, found in this module and kept as tests

Each is the HE-01 shape — a scan that read a module's own denial as a finding — and each has a
test pinned to the exact input that fooled it.

- **A capability scan that counted its own vocabulary.** The first draft reported
  `separations.mjs` as calling all thirteen granting primitives, on the strength of the array
  declaring their names. Strings, comments and **regex literals** are masked now: a capability
  is a call, never a quoted or matched word. This is the *opposite* of HE-01's rule two
  directories away, which keeps string literals because a credential is one.
- **A deploy check that fired on a sentence.** `!/deploy|publish|push|build/` failed on the
  panel text *"This deployment does not publish its address"*. Somebody would have deleted the
  sentence to clear it. The check is a capability check now: a process, a request, or a
  navigation the module initiates itself.
- **A stylesheet line scan that missed a declaration.** `.thr-go,.thr-back{ … }` spans five
  lines and only the first carries `thr-`, so the minimum hit target was reported absent when
  it is declared. The scan reads whole rules.

## What none of this proves

- **A path not found is not a path proven absent.** The occurrence classifier is lexical, and
  a file with a capability and no comparison is reported `no_path_found` rather than
  `cleared` — a third state exists precisely so that neither overstatement is available.
- **Nothing here opened a page.** The two visual criteria a browser settles come from
  `agent/browser/` and the rest are a static read. No contrast was computed, no screen reader
  was run and no pixels were compared: README limitation 7 stands.
- **Nothing here reached a source, ran a workflow, or dispatched an agent.** The readiness
  report says the system is not ready. It is not itself a run of the system.
- **The schedule fires on nothing.** There is no timer, no cron and no daemon in this
  directory. It declares the order and the ownership, which is the half that did not exist.
