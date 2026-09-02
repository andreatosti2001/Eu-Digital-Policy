# agent/depth — Agent 4, the Data Depth Agent

What important legal and regulatory knowledge is missing from the current structured
representation.

The reference document is **`docs/DATA-DEPTH.md`**. This file is the directory's own map.

```
node agent/depth/cli.mjs --as-of 2026-09-02
node agent/depth/cli.mjs --as-of 2026-09-02 --dry            # nothing stored
node agent/depth/cli.mjs --as-of 2026-09-02 --all            # every gap, not just the top of the ladder
node agent/depth/cli.mjs --as-of 2026-09-02 --kind missing_competence
node agent/depth/cli.mjs --as-of 2026-09-02 --changes <trace-id>

node --test agent/depth/selftest.mjs                         # 40 tests, against the real data/
node agent/observability/cli.mjs depth --aside               # the analysis, off the trace
```

`--as-of` is required. "The corpus has not grown" and "nobody has looked" are different
findings, and only a stated date separates them (`docs/AUDIT-2026-09-01.md` F-15).

## The modules

| File | What it owns |
|---|---|
| `lens.mjs` | The corpus, indexed for the questions a depth analysis asks. Borrows the graph from `agent/detector/graph.mjs`; derives nothing the site derives at render time. |
| `demand.mjs` | The load-bearing test. Decides which findings survive, and keeps the reason for every one it sets aside. |
| `detectors.mjs` | The thirteen questions, one per kind in `DEPTH_GAP_KINDS`. |
| `rank.mjs` | What may be done about a gap, and how much the finding is standing on. Two tables, one row per kind, each with its reason. |
| `depth.mjs` | The agent: the traced run that turns surviving findings into `KnowledgeGap` records. |
| `cli.mjs` | The terminal report. |
| `selftest.mjs` | The suite, run against the real `data/`. |

## The three things to know before changing anything here

**1 · It never writes.** There is no write call in this directory, `selftest.mjs` scans every
module for one, and a full run hashes `data/` before and after. A gap is a question; the
answer is a `DataProposal` behind an `ApprovalRequest`, and neither is this agent's to write.

**2 · A finding with no demand is not a finding.** Counting absences is trivial and already
done — `.agents/skills/data-completeness/scripts/gaps.mjs` is the census, and restating its
numbers here would be the second home the architecture exists to prevent. A gap is reported
only where a record in the corpus *leans on* the missing concept. The `KnowledgeGap` contract
enforces the same thing independently, by refusing any record whose evidence carries no
`dataset_record`.

**3 · What was set aside is never dropped silently.** Every suppression carries its reason,
into the run result, onto the trace, into `agent/observability/cli.mjs depth --aside`, and
into the viewer's Data depth panel. A run that reported 57 gaps and dropped 31 has made a
judgement 31 times; a report showing only the 57 would present that judgement as though it
were the corpus.

## What must not change

- **Do not add a detector without adding its kind to `DEPTH_GAP_KINDS`**, or the reverse.
  `detectors.mjs` throws at load, and the suite fails.
- **Do not add a row to `rank.mjs` mapping a kind to `autonomous`.** The contract refuses it
  anyway; the table would be lying first.
- **Do not remove the `!d.length` suppression by giving a detector its own demand.** If a
  finding needs demand invented for it, it is a census entry.
- **Do not tune `CO_CITATION_FLOOR` without saying so.** It is the one tuned number in
  `detectors.mjs`, it is exported, and the suite asserts it.
- **Do not derive the glossary threshold from anything but the glossary.** It is per kind of
  record and it is the corpus's own standard; a chosen number would be this agent's taste.
- **Do not let a change record create a gap.** A change is not an absence. The suite asserts
  that passing change records alters no count and raises no impact.
