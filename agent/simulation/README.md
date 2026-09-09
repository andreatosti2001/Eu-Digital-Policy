# `agent/simulation/` — SESSION 24

The seam `docs/ORCHESTRATOR.md` §12 left open, filled with a simulation rather
than with production wiring.

```
node agent/simulation/cli.mjs graph        the agent graph, declared — runs nothing
node agent/simulation/cli.mjs run          one complete cycle, eight legs
node agent/simulation/cli.mjs threshold    the Control Room discovery path
node agent/simulation/cli.mjs all          both
node --test agent/simulation/selftest.mjs  twenty assertions about the discipline
```

## What it is

`docs/ORCHESTRATOR.md` §12: *"A dispatcher is the function that actually runs a
specialist. This session wires none."* Protocol §25 puts the first complete
end-to-end cycle in **simulation**, at SESSION 24, and asks that it "observe and
document defects rather than silently repairing them".

So this directory wires twelve **simulated** specialists into the real
Orchestrator and walks the lifecycle once. What runs is real: the event intake
and its stripping, classification, the capability register and every grant,
every handoff check, H3, the contract gateway, all six conflict detectors, the
provenance and rollback gates, the autonomy policy's twelve conditions, the
journal, the tracer, and a real Control Room process with a real login and a
real ledger write. What is simulated is the eleven specialists' **domain
reasoning** — no source is read, no page is opened, no dataset is examined, no
sentence is judged.

**So a run proves the wiring and nothing about the world.** A simulated pass is
not evidence, and a simulated `QAResult` looks exactly like a measured one to
everything downstream — which is the single most misleading record the run
produces, and is said again in `dispatchers.mjs` where it is produced.

## What it never touches

`data/`, `i18n/`, `js/`, `css/`, any page, `agent/records/`,
`agent/observability/runs/`, `agent/orchestrator/state/`,
`agent/implement/decisions/`, `.control-room/state/`, and git. Every store a run
writes is a `mkdtemp` directory, deleted at the end. The run reports a
before/after content fingerprint of the whole working tree, so **"nothing was
changed" is a measurement**, and `selftest.mjs` test 1 asserts it.

## What it found

`docs/FIRST-END-TO-END-AUDIT.md`. Nothing found was fixed here — SESSION 24's
brief says so in those words, and a suite that pinned a defect would turn it
into a requirement.

## The files

| File | What it owns |
|---|---|
| `cycle.mjs` | the agent graph as data: eight legs, and the two workflow types this cycle does not walk |
| `fixture.mjs` | the controlled scenario, built on `agent/schemas/fixtures.mjs`; every record marked simulated |
| `dispatchers.mjs` | twelve simulated specialists. Pure, synchronous, and they write nothing |
| `world.mjs` | the temporary record store, ledger, trace store, journal and Control Room state — and the tree fingerprint |
| `run.mjs` | the cycle, including the authorization leg against a real Control Room |
| `threshold.mjs` | the discovery path: the six-phase visual specification, what the code actually does, and the six separations |
| `report.mjs` | the trace, rendered. Adds no fact and hides no refusal |
| `cli.mjs` | `graph` · `run` · `threshold` · `all` |
| `selftest.mjs` | twenty assertions about the discipline, not about the findings |
