# agent/schemas

The inter-agent contracts. Fifteen machine-readable schemas, a validator that
enforces them, and a gate no agent can hand a record through without passing.
Zero dependencies, no build step, nothing wired into the website.

Three agents speak them. The **Source Scout** (`agent/scout/`) emits
`SourceCandidate`, `DataGap`, `AgentObservation` and `AgentRun`; the **Legal
Verifier** (`agent/verifier/`) emits `VerificationRecord`; the **verification
integrator** (`agent/integrate/`) emits `ClaimEvidence`, `DataProposal`,
`DataGap` and `ApprovalRequest`. All of them go through `gateway.mjs` and are
stored in `agent/records/` via `agent/scout/store.mjs`. The remaining contracts
have not yet been exercised by a real agent. See `docs/SOURCE-SCOUT.md`,
`docs/LEGAL-VERIFIER.md` and `docs/VERIFICATION-INTEGRATION.md`.

`DataProposal` is the fifteenth, added in SESSION 08. Why the fourteen had no
home for a proposed change to `data/*.json`, and what was considered and
rejected instead, is in `docs/VERIFICATION-INTEGRATION.md`.

```
node agent/schemas/cli.mjs list                  # the fifteen
node agent/schemas/cli.mjs show DataGap          # one contract, field by field
node agent/schemas/cli.mjs check                 # every contract is satisfiable
node agent/schemas/cli.mjs validate record.json  # gate a record; exits 1 if invalid
node agent/schemas/cli.mjs export ClaimEvidence  # JSON Schema, derived on demand
node --test agent/schemas/selftest.mjs           # the suite
```

The design, the four epistemic states, the autonomy classes and the reasoning
behind every forbidden field are in **`docs/AGENT-CONTRACTS.md`**. Read that
first, and `docs/AI-SAFE-BOUNDARIES.md` before it.
