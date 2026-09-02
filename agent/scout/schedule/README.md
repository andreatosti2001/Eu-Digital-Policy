# agent/scout/schedule/

The scheduling layer around **Agent 1, the Source Scout**
(`agent/scout/scout.mjs` and its siblings — `docs/SOURCE-SCOUT.md`).

**This directory never modifies the Scout it wraps.** Nothing here touches
`agent/scout/{scout,transport,authorities,extract,dedupe,fixtures,store,cli}.mjs`,
`agent/schemas/`, or `data/*.json` — `guard.mjs` fails the run if any of them
change. The boundary exists so a future reconciliation never again has to
choose between two Scouts: there is one Scout, and this is a wrapper around
it that a session can delete entirely without touching the agent itself.

## Files

```
run.mjs      what the workflow invokes. Runs the same Scout
             agent/scout/cli.mjs runs, the same way, and adds a
             committed digest plus GitHub Actions step outputs.
digest.mjs   turns a completed run into a human/machine preview —
             a pointer summary, never the record body. Adds two
             report-layer-only duplicate checks (against
             data/sources.json and against every earlier digest)
             that the Scout itself does not perform.
guard.mjs    the write boundary, enforced against the actual
             working tree: only agent/scout/digests/*.{json,md}
             may change.
selftest.mjs tests. Node:test, no network.
```

## Running it

```
node --test agent/scout/schedule/selftest.mjs
node agent/scout/schedule/run.mjs --dry              # mock corpus, writes nothing
node agent/scout/schedule/run.mjs                     # mock corpus, writes a digest
node agent/scout/schedule/run.mjs --live --dry        # the real endpoints, writes nothing
node agent/scout/schedule/guard.mjs                    # confirm it stayed in its lane
```

Full operating documentation: **`docs/AGENT-RUNBOOK.md`**.
