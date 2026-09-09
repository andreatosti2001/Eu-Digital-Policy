# agent/simulation/runs/

Empty on purpose, and git-ignored except for this file.

`node agent/simulation/cli.mjs run` writes its observability trace into a
`mkdtemp` directory and deletes it when the run ends. Passing `--trace <dir>`
keeps the trace instead, and this is the conventional place to put one.

**A trace here is a run artifact, not a record.** Every record it points at is
marked `simulated`, every URL in it is on `example.invalid`, and none of it
asserts anything about EU law. It is still not committed: this repository
publishes its whole tree, and a trace holds agent inputs, outputs, refusals and
routing.

The same shape as `agent/health/history/`, `.control-room/state/` and
`agent/orchestrator/state/` — and for the same reason. A `.gitignore` entry is
not a security boundary; it is the strongest control available in a repository
whose deployment unit is the whole tree.
