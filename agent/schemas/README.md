# agent/schemas

The inter-agent contracts. Eighteen machine-readable schemas, a validator that
enforces them, and a gate no agent can hand a record through without passing.
Zero dependencies, no build step, nothing wired into the website.

Six agents speak them. The **Source Scout** (`agent/scout/`) emits
`SourceCandidate`, `DataGap`, `AgentObservation` and `AgentRun`; the **Legal
Verifier** (`agent/verifier/`) emits `VerificationRecord`; the **verification
integrator** (`agent/integrate/`) emits `ClaimEvidence`, `DataProposal`,
`DataGap` and `ApprovalRequest`; the **Regulatory Change Detector**
(`agent/detector/`) emits `RegulatoryChange`, `ImpactAssessment` and `DataGap`;
the **Data Depth Agent** (`agent/depth/`) emits `KnowledgeGap`; the **gap
router** (`agent/proposals/data/`) emits `DataProposal`, `ApprovalRequest` and
`DataGap`; the **Knowledge Architect** (`agent/architect/`) emits
`ArchitectureProposal` and `ApprovalRequest`; and the **Editorial Agent**
(`agent/proposals/editorial/`) emits `EditorialProposal`, `ApprovalRequest` and
`AgentObservation`. All of them go through `gateway.mjs` and are stored via
`agent/scout/store.mjs` — in `agent/records/`, except the Editorial Agent's,
which go to `agent/proposals/editorial/drafts/` because SESSION 14 said to draft
there. The remaining contracts have not yet been exercised by
a real agent. See `docs/SOURCE-SCOUT.md`, `docs/LEGAL-VERIFIER.md`,
`docs/VERIFICATION-INTEGRATION.md`, `docs/CHANGE-DETECTOR.md`,
`docs/REGULATORY-IMPACT-MAPPING.md`, `docs/DATA-DEPTH.md`,
`docs/GAP-PROPOSALS.md` and `docs/KNOWLEDGE-ARCHITECTURE.md`.

`DataProposal` is the fifteenth, added in SESSION 08. Why the fourteen had no
home for a proposed change to `data/*.json`, and what was considered and
rejected instead, is in `docs/VERIFICATION-INTEGRATION.md`.

`RegulatoryChange` is the sixteenth, added in SESSION 09 — and it is **not**
`ChangeRecord`, which means a change made to this repository rather than one in
the world. The two refuse each other's fields by name. `docs/CHANGE-DETECTOR.md`
§1 sets out the collision and what it would take to resolve it differently.

`ImpactAssessment` is the seventeenth, added in SESSION 10. It says what a
confirmed `RegulatoryChange` reaches inside this website, and it is a record of
its own rather than fields on the detection because the two are about different
subjects, go stale on different clocks, and only one of them decides what may be
done without a human. `docs/REGULATORY-IMPACT-MAPPING.md` §9 has the reasoning.

`KnowledgeGap` is the eighteenth, added in SESSION 11 — and it is **not**
`DataGap`. `DataGap` is about evidence: a value that exists and is unsupported.
`KnowledgeGap` is about representation: a concept the model has no place for. It
refuses `what_is_missing` by name and points at the other contract, and it
carries `recommended_data_location`, which is the field that makes the
difference. `docs/DATA-DEPTH.md` §7 has the reasoning.

**SESSION 12 added no nineteenth.** It needed a way to say "this taxonomy term
appears necessary, and I am proposing it rather than creating it", and that
burden is `DataProposal`'s burden already — find the existing one first, keep
the id, never merge automatically. So it is a sixth `DATA_OPERATION_KINDS`
value, `create_taxonomy_term`, with four rules of its own: the dataset must be
`data/taxonomy.json`, the record kind `taxonomy_term`, the dimension must be one
the file actually carries, and the class is **forced** to `human_only` rather
than checked. `docs/GAP-PROPOSALS.md` §4 has the reasoning.

**SESSION 13 added no nineteenth either**, twice over. Agent 6, the Knowledge
Architect, emits `ArchitectureProposal` — which has existed since SESSION 04 and
whose burden (modules affected, invariants touched, dependency impact, the three
red-tier booleans, a migration, a rollback plan) is exactly the burden a change
to the information model carries. `docs/KNOWLEDGE-ARCHITECTURE.md` §3 has the
reasoning.

**SESSIONS 14 and 15 added no nineteenth either, and added three FIELDS
instead.** Agent 7, the Editorial Agent (`agent/proposals/editorial/`), emits
`EditorialProposal` — which has existed since SESSION 03 and had been produced
by nothing. What it gained is `proposal_kind`, `editorial_state` and
`staleness`, plus `caveats_preserved` and a `home` on each prose location, and
each is a field rather than a convention because a rule cannot be written
against a convention: only a `factual_update` may carry a drafted replacement,
only a `contradicted` finding may be corrected, and a `factual_update` that
cannot name the claim record its sentence hangs on has orphaned it.
`docs/AGENT-CONTRACTS.md`'s closing section and `docs/EDITORIAL-AGENT.md` §6
have the reasoning.

It also added `identity.mjs`, which is
not a contract: it derives a record's `id_field` value from the record's own
content — kind, the full sorted entity set, subject — replacing the per-run
counter every agent used. There is deliberately **no id store**; the id is
recomputable by anyone holding the record, with nothing to load.
`docs/AGENT-CONTRACTS.md` "The id, and why it is derived rather than counted"
has the measurement that made it a prerequisite.

```
node agent/schemas/cli.mjs list                  # the eighteen
node agent/schemas/cli.mjs show DataGap          # one contract, field by field
node agent/schemas/cli.mjs check                 # every contract is satisfiable
node agent/schemas/cli.mjs validate record.json  # gate a record; exits 1 if invalid
node agent/schemas/cli.mjs export ClaimEvidence  # JSON Schema, derived on demand
node --test agent/schemas/selftest.mjs           # the suite
```

The design, the four epistemic states, the autonomy classes and the reasoning
behind every forbidden field are in **`docs/AGENT-CONTRACTS.md`**. Read that
first, and `docs/AI-SAFE-BOUNDARIES.md` before it.
