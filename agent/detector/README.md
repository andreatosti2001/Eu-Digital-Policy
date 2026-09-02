# agent/detector

Agent 3 — the Regulatory Change Detector. Finds where what the canonical
datasets assert and what a retrieved document says have diverged, classifies
each divergence into one of fourteen kinds, and stops.

**It outputs a `RegulatoryChange`, not a `ChangeRecord`.** SESSION 09's brief
said "ChangeRecord"; that contract already means *a change made to this
repository* — a file list, a branch, a commit — and a regulation entering into
force is none of those. The conflict is set out in full at the top of
`agent/schemas/contracts/regulatory-change.mjs` and in §1 of
`docs/CHANGE-DETECTOR.md`, which is the reference document. This file is the map.

**It never edits production.** `data/` is read and never written; there is no
write path here; the suite hashes `data/` around a full run and scans every
module for a write call. A detection is a question. The answer is a
`DataProposal` behind an `ApprovalRequest`, and neither is this agent's to write.

```
node agent/detector/cli.mjs --mock --dry               # the adversarial corpus, storing nothing
node agent/detector/cli.mjs --mock --as-of 2026-09-02
node agent/detector/cli.mjs --records <trace-id> --as-of YYYY-MM-DD
node --test agent/detector/selftest.mjs                # 38 tests, against the real data/
```

`--as-of` is required on the live path and has **no default**. "Nothing has
decayed" and "nobody has looked" are different findings, and only a stated date
tells them apart.

## The modules

| File | What it owns |
|---|---|
| `classify.mjs` | the transition table, the ordered rules, and the holes it reports rather than fills |
| `materiality.mjs` | what a change costs a reader, the confidence formula, the autonomy class |
| `snapshots.mjs` | what a "previous source snapshot" is here, and what it cannot support |
| `surfaces.mjs` | affected datasets, and affected pages derived from the load call sites |
| `detector.mjs` | intake, the three comparisons, the records |
| `cli.mjs` | `--mock` / `--records`, and the report |
| `fixtures.mjs` | the seven cases the session named, plus four that break the classifier |
| `selftest.mjs` | the suite |

## The fourteen kinds

Six are a legal status arriving and come from a **table** —
`AMENDED`, `CORRECTED`, `ENTERED_INTO_FORCE`, `APPLICABLE`, `REPEALED`,
`ANNULLED`. Eight are about the document or the record and come from an
**ordered list** — `NEW`, `UPDATED`, `DELAYED`, `GUIDANCE_UPDATED`,
`ENFORCEMENT_UPDATED`, `COURT_OUTCOME`, `RELATIONSHIP_CHANGED`,
`SOURCE_REPLACED`.

`UPDATED` is tested **last**: it asserts that nothing substantive moved, so
everything that could have been a real change runs first.

## What it will not do

- report two authorities disagreeing as a change
- default a transition it has no word for to the nearest kind
- call a court being *seised* a court *deciding*
- call a date that moved *earlier* `DELAYED`
- compare a staged act against one of its stages
- report `bytes_changed: false` where there was nothing to compare
- report a status the vocabulary cannot name as "the corpus has no record"
- multiply materiality by confidence
- read a clock
- write to `data/`, propose anything, or apply anything

Each of those is a test, not a promise.
