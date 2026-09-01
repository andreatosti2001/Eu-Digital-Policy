# agent/schemas

The inter-agent contracts. Fourteen machine-readable schemas, a validator that
enforces them, and a gate no agent can hand a record through without passing.
Zero dependencies, no build step, nothing wired into the website.

One agent speaks them: the **Scout** (`agent/scout/`), which emits
`SourceCandidate`, `DataGap`, `AgentObservation` and `AgentRun` through
`gateway.mjs` and stores them in `agent/runs/` via `store.mjs`. The other ten
contracts have not yet been exercised by a real agent.

```
node agent/schemas/cli.mjs list                  # the fourteen
node agent/schemas/cli.mjs show DataGap          # one contract, field by field
node agent/schemas/cli.mjs check                 # every contract is satisfiable
node agent/schemas/cli.mjs validate record.json  # gate a record; exits 1 if invalid
node agent/schemas/cli.mjs export ClaimEvidence  # JSON Schema, derived on demand
node --test agent/schemas/selftest.mjs           # the suite
```

The design, the four epistemic states, the autonomy classes and the reasoning
behind every forbidden field are in **`docs/AGENT-CONTRACTS.md`**. Read that
first, and `docs/AI-SAFE-BOUNDARIES.md` before it.
