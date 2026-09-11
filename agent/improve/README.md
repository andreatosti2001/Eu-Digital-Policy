# `agent/improve/` — the continuous improvement loop

SESSION 27. The thirteenth thing in `agent/`, and the second whose subject is the other
twelve. `agent/orchestrator/` routes one event at a time; this observes the whole system on a
cadence and says what moved.

```
node agent/improve/cli.mjs cycle --as-of YYYY-MM-DD [--record] [--store]
node agent/improve/cli.mjs observers      the register, runs nothing
node agent/improve/cli.mjs reach          what limited autonomy can actually reach
node agent/improve/cli.mjs history        every recorded cycle, and the movement between them
```

**`cycle` without `--record` writes nothing.** The cycle ledger is git-tracked, so appending to
it changes the repository, and a run that did that by default would have taken a commit
decision once for everybody. `--store` is the second opt-in write and it goes to
`agent/records/`, which is git-ignored run state. Neither touches `data/`, `i18n/`, `js/`,
`css/` or any page, and **there is no flag here that can**.

## What it adds, and it is only three things

Everything the loop observes already had a CLI. Running all eight on one afternoon produces
eight reports and no comparison, and the comparison is the whole of what *continuous* means.

1. **One pass, one as-of date, one corpus position**, so the eight readings are of the same
   system at the same instant.
2. **A record of that pass that survives a clone** — `cycles/cycles.jsonl`, tracked, so the
   next session compares against a measurement rather than against the previous session's
   prose. `cycles/README.md` is the argument for that, and it is the only run store here that
   is tracked.
3. **A triage** that says which desk each finding belongs at, using the policy modules and
   deciding nothing itself.

It re-implements nothing. Every finding is a record a specialist minted, carrying the id that
agent derived from the finding's own content. This module mints no id, assigns no severity,
decides no priority, and reads no page, dataset or sentence.

## The rule the whole thing turns on

**An observer that did not run is not an observer that found nothing.** A finding present last
cycle and absent this cycle has two possible explanations and only one is progress. They are
not distinguishable from the finding lists alone, so movement is computed **per observer**, and
an observer that did not run in *both* cycles yields `undetermined` for everything it owns —
never `resolved`, and never counted as an improvement. That is this repository's own rule that
unknown is never zero, applied where getting it wrong would let a machine tell a person the
system got better. `selftest.mjs` tests 5 to 8 are that case from four directions.

## Findings and signals, never mixed

A **finding** is an identified thing with a stable id, so movement over it is a set difference.
A **signal** is a number with no identity, so movement over it says which number changed and
never which item did. Reporting a signal as a finding would invent an identity; reporting a
finding as a count would throw away the one property that makes the loop possible.

`agent/health/` already owns the 44-metric register and the movement over metric readings. This
module does not duplicate it: it tracks **individual findings**, which nothing did, and reads
the small set of signals it routes on from the same `agent/implement/checks.mjs` the
implementation layer uses.

## The triage is not the gate ladder

`agent/autonomy/cycle.mjs autonomyGates()` runs six gates over a proposal in the record store,
on top of eight of `preflight`'s ten. This module runs none of them. It answers a strictly
weaker question — is the derived category one a grant enables, do the operation targets name
only permitted fields, does any mandatory condition fail — and `eligible` means only "worth
handing to the runner". The runner can and does refuse further.

Three destinations and no fourth: `autonomy_runner`, `human_queue`, `no_act_proposed`. There is
no "handled automatically" bucket, and `selftest.mjs` test 19c asserts this module never calls
into the executing path. Executing is `agent/autonomy/`'s, behind its own gates; a second
entrance would be a second home for the most consequential decision here.

## Two things it measured that were not known

**Six of the eight fields the governance grant allowlists have never existed in
`data/sources.json`.** `last_retrieved`, `retrieved_at`, `checksum`, `content_hash`,
`recheck_interval` and `freshness_window` appear nowhere in the file — not on a record, not in
its `$description`, not in its `$note`. Only `url` and `url_status` are there. So
`retrieval_metadata` has no surface to write to at all. `reach.mjs` measures this against the
real tree on every run and on every push, and **does not repair it**: adding a field to
`data/sources.json` would be a schema decision about the legal record taken to make an autonomy
demonstration possible, which is the fixture-dressed-as-work `docs/LIMITED-AUTONOMY.md` §7.1
refuses.

**A flawless proposal in an enabled category is still refused, by one condition no proposal can
satisfy.** `rollback_mechanical` reads the branch, base commit and per-file pre-change hashes
that `agent/implement/apply.mjs openContext()` records in **step 2** of the seven; the autonomy
runner evaluates it in **gate 3**, which runs before step 1. Four of its six elements are
therefore `unknown` for every proposal at that point, and it is not one of the four
`MEASURED_CONDITIONS` allowed to be. On this evidence the permitting half of limited autonomy is
not merely unexercised — it is unreachable. The loop reports it per item and as a signal on
every cycle, and **does not fix it**: changing what a gate proves is Class C work on the
governance layer, and `agent/policy/` is on the never-automatic path list on purpose.
`docs/CONTINUOUS-IMPROVEMENT.md` §4.

## Files

| File | What it owns |
|---|---|
| `observe.mjs` | the observer register, one pass, and the normalisation of a shipped record |
| `reach.mjs` | what the grant's paths and fields land on in the real tree |
| `movement.mjs` | new / persisting / resolved / **undetermined**, per observer, and signal direction |
| `ledger.mjs` | the tracked cycle record and the publication rule it enforces |
| `cycle.mjs` | the loop, and the triage |
| `cli.mjs` · `selftest.mjs` · `cycles/README.md` | |

## What a green cycle does not prove

- An `eligible` referral is not a permission.
- A finding is only `resolved` where the observer that owns it ran in both cycles.
- No observer here opens a rendered page (`agent/browser/` does), retrieves a document
  (nothing in this environment can — SESSION 25 measured the refusal), or reads a sentence for
  truth (nothing here does).
- A rise in most of these counts is usually the system looking harder. `movement.mjs` marks
  which signals have no better direction and refuses to rank them.
