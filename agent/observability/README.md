# agent/observability

The instrumentation layer for this project's (not yet built) agents.
Zero dependencies, no build step, nothing wired into the website.

```
node agent/observability/demo/workflow.mjs --live   # write a simulated trace
node agent/observability/cli.mjs serve              # → http://127.0.0.1:7801
node --test agent/observability/selftest.mjs        # the suite
node agent/observability/cli.mjs validate           # gate a commit on the store
```

The design, the record vocabulary, and the reasoning behind using neither
Langfuse nor Phoenix yet, are in **`docs/OBSERVABILITY.md`**. Read that first.
