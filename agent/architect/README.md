# agent/architect — Agent 6, the Knowledge Architect

Asks whether the information model can represent what this corpus is already
trying to say. Eight questions of the taxonomy, the entities, the relationships,
the datasets, the derivation logic, the comparison dimensions and the page
architecture. Output: `ArchitectureProposal` records, each behind a pending
`ApprovalRequest`.

```
node agent/architect/cli.mjs --as-of 2026-09-03
node agent/architect/cli.mjs --as-of 2026-09-03 --all --aside
node agent/architect/cli.mjs --as-of 2026-09-03 --question 7
node agent/architect/cli.mjs --as-of 2026-09-03 --gaps <depth-trace-id>
node --test agent/architect/selftest.mjs
node agent/observability/cli.mjs architecture --aside
```

**It changes no schema and drafts no shape.** Every operation on every proposal
carries a null `proposed`: it names what a shape cannot hold and the decision
that follows, and stops. It writes nothing to `data/`, and the suite scans every
module here for a write call and hashes the whole of `data/` around a full run.

**It is not `agent/depth/`.** That agent asks what knowledge is missing and
answers with a `KnowledgeGap`; this one asks whether the shape exists at all.
One test separates them — *would writing a record close this?* — and
`boundary.mjs` is that test rather than an intention. A finding a record would
close is set aside and handed to the agent that owns it.

**It knows nothing about EU law.** Every finding is derived from the files in
this repository and stands on `dataset_record` evidence quoted from a named
file. A `retrieved_document` entry is refused: no agent here has ever retrieved
one.

The design, the eight lenses and what they found are in
**`docs/KNOWLEDGE-ARCHITECTURE.md`**. Read that first, and
`docs/AGENT-CONTRACTS.md` and `docs/AI-SAFE-BOUNDARIES.md` before it.
