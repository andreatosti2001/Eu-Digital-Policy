# Discovery reports

Two files per Source Scout run:

- `scout-<instant>.json` — the machine-readable report
- `scout-<instant>.md` — the human summary, and the body of the pull request that proposes it

**These are committed on purpose.** They are the Scout's cross-run memory: duplicate detection
reads every earlier report, so a candidate proposed last week is recognised rather than
re-proposed as new. Gitignoring this directory would make every run propose everything again.

**A report is a proposal, not a dataset.** Nothing here is a `data/sources.json` record.
Promoting a candidate means opening the document and reading it — `docs/AI-SAFE-BOUNDARIES.md`
§3, and `docs/AGENT-RUNBOOK.md` §4 for the procedure.

Reports are never edited after the fact. A run said what it said; correcting it in place would
destroy the only record of what the Scout actually saw.
