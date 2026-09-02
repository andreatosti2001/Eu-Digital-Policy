# Discovery digests

One `.json` and one `.md` file per scheduled Source Scout run, written by
`agent/scout/schedule/run.mjs`.

**A digest is a preview, not a record.** It is a rendering of the run for a
human to triage — ids, URLs, titles, confidence, the fields needed to decide
whether to open something — never the full `SourceCandidate` or `DataGap`
body. The same rule `agent/schemas/gateway.mjs` already applies to the trace
("copying the body into the trace would make the trace a second home for
every fact the record carries") applies here one level up. The full records a
run produced live only in `agent/records/<trace_id>.jsonl` — regenerable,
git-ignored, and attached to that run's workflow artifact.

**Why this directory is committed and `agent/records/` is not.** A digest is
this scheduling layer's only memory between runs — duplicate detection against
an earlier proposal reads every file here (`docs/AGENT-RUNBOOK.md` §3). The
contract records themselves need no such memory: they are validated,
self-contained, and regenerable from the same retrieval at any time.

**Nothing here is a `data/sources.json` record.** Promoting a candidate means
opening the document and reading it — `docs/AI-SAFE-BOUNDARIES.md` §3, and
`docs/AGENT-RUNBOOK.md` §4 for the procedure.

Digests are never edited after the fact. A run said what it said.
