# agent/orchestrator/ — the Master Orchestrator

SESSION 22. The twelfth thing in `agent/`, and the first whose subject is the other
eleven. The reference document is **`docs/ORCHESTRATOR.md`**; this is the directory note.

```
node agent/orchestrator/cli.mjs workflows      # the ten types and their stages
node agent/orchestrator/cli.mjs capabilities   # who may produce what
node agent/orchestrator/cli.mjs policy         # ten triggers, twelve conditions, eight checks
node agent/orchestrator/cli.mjs survey         # the real record store, and what would happen to it
node agent/orchestrator/cli.mjs state [<id>]   # the workflow journal
node agent/orchestrator/cli.mjs run --type NEW_SOURCE --subject SourceCandidate:cand-1
node --test agent/orchestrator/selftest.mjs
```

The first three run nothing. `survey` reads and writes nothing. `run` opens a workflow and
writes one append-only journal file under `state/`, which is git-ignored.

## The files

| File | What it owns |
|---|---|
| `capabilities.mjs` | the capability register, and `grantFor()` — the intersection of what an agent holds and what a stage asks for |
| `workflows.mjs` | the ten workflow types as data, the five end states, and `classify()` |
| `state.mjs` | the workflow state machine and the append-only journal it is replayed from |
| `events.mjs` | intake: the whitelist, and the fields stripped and named at the door |
| `approval.mjs` | the eight routing checks, re-derived from the decision ledger |
| `conflict.mjs` | six conflict shapes, and no resolver |
| `policy.mjs` | the ten human-review triggers, protocol §18's twelve conditions, the provenance and rollback gates |
| `orchestrator.mjs` | the Orchestrator |
| `cli.mjs` · `selftest.mjs` | |

## What it does not do

**It does not replace specialist reasoning.** No legal reasoning, no editorial judgement, no
evidence assessment, no verdict. Every gate it runs is mechanical, and it refuses a record
rather than repairing one.

**It publishes nothing.** All ten workflow types end at a human stage, `workflows.mjs`
refuses to load one that does not, and no code path here writes to `data/`, `i18n/`, `js/`,
`css/` or any page.

**No dispatcher is wired.** A dispatcher is the function that actually runs a specialist.
This session wires none: every dispatch stage comes back `not_dispatched` and the workflow
ends `unresolved` or `human_review_required`, which is the true answer when nothing ran.
Protocol §25 puts the first end-to-end execution in simulation at SESSION 24. The seam is
the deliverable.

**It is not a sandbox.** Nothing here stops a module calling `writeFileSync`. What it does is
state, in a record a reviewer can read afterwards, exactly what each agent was permitted to
produce, and refuse the output that exceeds it *at the handoff*. That is the boundary this
architecture can hold, and saying which one it is beats implying a stronger one.
