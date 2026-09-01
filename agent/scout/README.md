# Source Scout

A read-only discovery agent. It reads public feeds published by EU institutions, records what
it retrieved, and proposes candidate sources a human might want to add to the bibliography.

**Operating mode: DISCOVER → OBSERVE → REPORT → PR.**
Never DISCOVER → DIRECT PRODUCTION EDIT.

Operation, scheduling and what to do with a report: **[`docs/AGENT-RUNBOOK.md`](../../docs/AGENT-RUNBOOK.md)**.
This file is the module map.

---

## What it cannot do

Not by convention — by construction, and each one is asserted in the test suite:

| | |
|---|---|
| Write `data/*.json` | It imports nothing that can. `guard.mjs` fails the run if any path outside `agent/scout/reports/` changed. |
| Write anywhere in the site | Same guard, same allowlist. It is an allowlist and not a denylist, so a path nobody thought of is refused by default. |
| Commit or open a pull request | The job that touches the network holds `contents: read` and no token. A separate job with no network beyond GitHub does the proposing. |
| Approve its own findings | It emits an `approval` record in state `requested`, addressed to the maintainer, and there is a test that no run ever emits `granted`. |
| Mark anything `simulated` | That flag belongs to the observability demonstrator alone. A Scout record that could pass as fixture data — or fixture data that could pass as research — is the failure mode `docs/AI-SAFE-BOUNDARIES.md` §0.1 exists to prevent. |
| Invent a field | No date the publisher did not state, no publisher id not already in the datasets, no CELEX number read from anything but a URL. |

## Files

```
registry.json     the watchlist — one record per endpoint polled.
                  Agent configuration, NOT a dataset. Every entry
                  ships url_status 'url:unchecked' and stays that way.
http.mjs          GET, and the retrieval metadata that makes a
                  candidate auditable. A failure is a result here,
                  never an exception.
feed.mjs          RSS / Atom / page-link extraction. Zero dependency.
                  Reports why a body yielded nothing rather than
                  returning a quiet zero.
dedupe.mjs        Has this repository already seen it? CELEX, then
                  normalised URL, then normalised title — strongest
                  key first, and the key that matched is reported.
relevance.mjs     Reading order, derived at run time from
                  data/instruments.json. Not evidence, not a legal
                  judgement, and auditable: every band ships the
                  terms that produced it.
report.mjs        The two artefacts — machine-readable JSON and the
                  human summary. Five mandatory sections, written
                  even when empty.
scout.mjs         The orchestrator, instrumented through
                  agent/observability/tracer.mjs.
cli.mjs           What the workflow runs. Exit codes are the
                  failure signal.
guard.mjs         The operating mode, enforced against the working
                  tree rather than promised in a comment.
selftest.mjs      41 tests. Nothing here touches the network.
reports/          Discovery reports. Committed — they are the
                  cross-run duplicate-detection memory.
```

## Running it

```
node --test agent/scout/selftest.mjs          # 41 tests, no network
node agent/scout/cli.mjs run --dry-run        # a full pass, writes nothing
node agent/scout/cli.mjs run                  # writes a report
node agent/scout/guard.mjs                    # confirm it stayed in its lane
node agent/observability/cli.mjs list         # the run it emitted
node agent/observability/cli.mjs show <trace>
```

Zero dependencies and no build step, like everything else here. Node 18+ for global `fetch`;
the workflow pins 22.

## Reading a report

Two files per run, in `reports/`:

- `scout-<instant>.json` — the machine-readable report. What the next run diffs against, so a
  candidate proposed last week is not proposed again as new.
- `scout-<instant>.md` — the human summary. What appears in the pull request.

**A report is a proposal, not a dataset.** Nothing in it is a `sources.json` record, and
promoting a candidate means opening the document and reading it — `docs/AI-SAFE-BOUNDARIES.md`
§3 lists creating a source record from anything else as RED tier.

## The conventions it inherits

- **`null` ≠ `unknown`, and unknown is never zero.** A publisher that stated no date leaves
  `published: null`. A candidate with neither title nor summary is band `unknown` with a
  `null` score, counted separately — not sunk to the bottom of a ranking as though judged.
- **Derivation over storage.** The relevance vocabulary is built from `data/instruments.json`
  on every run. Add an instrument to the dataset and the Scout starts watching for it.
- **One home per fact.** The registry is not rewritten from a run: which entries resolved is a
  fact about a run, and it lives in that run's report.
- **Redaction on the write path.** Reports go through `agent/observability/redact.mjs`, and
  the count it removed is printed in the report.
