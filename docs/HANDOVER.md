# HANDOVER

**Last updated:** SESSION 04 · 1 September 2026
**Branch:** `claude/inter-agent-contract-schemas-o6dfc7`
**Base commit:** `4bd1f0d` on `main` (merge of the SESSION 02 observability work)

---

## Current milestone

**SESSION 04 — Define the inter-agent contracts. Complete.**

The reference document is **`docs/AGENT-CONTRACTS.md`**. This file is the handover
only.

**No agent was built, and none should be until the next session.** The brief was
explicit about that and it was kept: nothing in `agent/schemas/` runs an agent,
retrieves a source, or touches `data/`.

### Discrepancy with the previous handover — reported, not reconciled

SESSION 02's handover recommends **SESSION 03 — instrument one real read-only
agent (the Scout)** as the next objective. This session's brief was **SESSION 04
— define the inter-agent contracts**, and the Scout was not built.

This is a divergence in ordering, not a conflict between the handover and the
code: the repository contains no Scout and claims none. The contracts were
defined first, which is the safer order — an agent built before its interface
exists has to be retrofitted to it, and the retrofit is where a distinction like
fact-versus-inference gets lost. The Scout is still the next objective and is
carried forward below, now with an interface to speak.

**A second, smaller discrepancy, not fixed:**
`.agents/skills/git-workflow/SKILL.md` hard-codes
`claude/eu-digital-policy-protocol-ntyhqc` as "the session's designated branch".
That branch is neither SESSION 02's (`…kye69t`) nor this session's
(`…o6dfc7`). The skill is stale by construction — it names a per-session value in
a durable document. It was left alone rather than updated to this session's
branch, which would only make it stale again next session. **Recommendation for
the author:** replace the hard-coded name with "the session's designated branch".
That is a one-line change to a skill and is the author's call, not an agent's.

## Implementation

`agent/schemas/` — fourteen machine-readable contracts, a validator that enforces
them, and a gate no agent can hand a record through without passing. Zero
dependencies, no build step, nothing wired into the site.

- **The fourteen**, in the order the brief named them: `SourceCandidate`,
  `VerificationRecord`, `ClaimEvidence`, `ChangeRecord`, `DataGap`,
  `ArchitectureProposal`, `EditorialProposal`, `UXProposal`,
  `ImplementationProposal`, `QAResult`, `ApprovalRequest`, `AgentObservation`,
  `AgentRun`, `WebsiteChange`. 303 fields, 47 forbidden fields with their
  reasons, 69 contract-specific cross-field rules.
- **A contract is data, not code** — a plain object per contract, in a field
  vocabulary with an interpreter of about 150 lines. Every field carries its own
  documentation, kind, nullability, and what it is *capable of asserting*.
- **The envelope, on every record:** `contract`, `contract_version`, `agent`,
  `created_at`, `affected_entities`, `evidence`, `epistemic`, `trace_ref`,
  `simulated`. A record names its own contract, so whoever receives it can
  validate it without being told what it is.
- **The twelve, on every substantive proposal:** `proposal_id`, `agent`,
  `created_at`, `affected_entities`, `reason`, `evidence`, `confidence`, `risk`,
  `autonomy_class`, `proposed_change`, `validation_requirements`,
  `rollback_plan`. The suite asserts all twelve are present and required on each
  of the four `*Proposal` contracts.
- **The four epistemic states are separated and enforced:** a factual field must
  cite evidence capable of bearing it; an inference must say what it was
  concluded from and by what method; an interpretation must say whose it is;
  `unresolved` must say what is missing and which kind of absence it is. A
  statement filed under two states at once is refused.
- **`null`, `"unknown"` and `no_rule_matched` are three states**, checked field by
  field against the `epistemic.unresolved` entry that names them.
- **Autonomy is checked, not declared.** `autonomous` / `review_required` /
  `human_only` map onto the green / amber / red tiers, and the validator reads
  what a record actually touches: a legal-record entity cannot be `autonomous`; a
  red target (`js/format.js`, `js/pipeline.js`, `tools/_footer.mjs`,
  `claim_type`, a licence, the non-affiliation or no-legal-advice text, the
  README's known limitations) forces `human_only`; a blocking open question or an
  irreversible rollback plan forbids autonomous action; a proposal touching
  `data/`, `js/`, `css/`, `i18n/`, `tools/` or any `.html` must name all four
  validators.
- **The gate** (`gateway.mjs`) — `emit`, `receive`, `handoff`. None has a flag
  that skips validation. What reaches the trace is a pointer and a sha256, never
  a copy of the record body.
- **JSON Schema is an export**, derived on demand by `cli.mjs export`, never
  committed.

## Files changed

All new and additive except `docs/HANDOVER.md`. **No file the website ships was
modified, and no file of the observability layer was modified.** Confirmed by
`git status --porcelain`.

```
docs/AGENT-CONTRACTS.md                 (new — the reference document)
docs/HANDOVER.md                        (rewritten for this session)
agent/schemas/README.md
agent/schemas/types.mjs
agent/schemas/fields.mjs
agent/schemas/common.mjs
agent/schemas/define.mjs
agent/schemas/registry.mjs
agent/schemas/validate.mjs
agent/schemas/gateway.mjs
agent/schemas/export.mjs
agent/schemas/fixtures.mjs
agent/schemas/cli.mjs
agent/schemas/selftest.mjs
agent/schemas/contracts/source-candidate.mjs
agent/schemas/contracts/verification-record.mjs
agent/schemas/contracts/claim-evidence.mjs
agent/schemas/contracts/change-record.mjs
agent/schemas/contracts/data-gap.mjs
agent/schemas/contracts/architecture-proposal.mjs
agent/schemas/contracts/editorial-proposal.mjs
agent/schemas/contracts/ux-proposal.mjs
agent/schemas/contracts/implementation-proposal.mjs
agent/schemas/contracts/qa-result.mjs
agent/schemas/contracts/approval-request.mjs
agent/schemas/contracts/agent-observation.mjs
agent/schemas/contracts/agent-run.mjs
agent/schemas/contracts/website-change.mjs
```

## Architecture decisions

1. **Contracts are data with a hand-written interpreter, not JSON Schema.**
   Validating JSON Schema needs a validator, and a dependency is a RED-tier
   prohibition. JSON Schema also cannot express what these contracts are for —
   that a fact must cite evidence, that `"unknown"` is not `null`, that an
   autonomy class must match what a record touches. JSON Schema is an export, and
   the suite asserts no `.schema.json` is committed, because a committed copy
   would be a second home for every field definition.
2. **A record is self-describing.** `contract` and `contract_version` are on the
   record, so validation needs no out-of-band knowledge. An unrecognised contract
   name is refused rather than skipped — that is what makes "no agent may bypass
   these contracts" a function rather than a policy sentence.
3. **Shapes are closed, and forbidden fields answer with the objection.** A
   field the contract does not declare is refused; a field it explicitly forbids
   is refused *with the reason*, which is almost always that the value is derived
   or already has a home.
4. **Vocabularies are borrowed, never copied.** `supports`, `source_type`,
   `source_tier`, `url_status` are read from `data/taxonomy.json` at load;
   `RISKS`, `APPROVAL_STATES`, `PROVENANCE_ROLES` are re-exported from
   `agent/observability/schema.mjs`. The suite asserts object identity, not
   equality, so a copy would fail.
5. **Entity kinds and autonomy classes were NOT added to `data/taxonomy.json`.**
   That file is the site's legal vocabulary, which a reader's page resolves
   against; the agent layer's own bookkeeping has no business in it.
6. **The epistemic requirement applies to top-level fields only.** An annotation
   deeper inside a record describes that sub-object rather than what the record
   asserts. This is a judgment about legibility and is the check most likely to
   need revisiting.
7. **The trace gets a pointer, not a copy.** `emit` writes the record's id, its
   contract name and a sha256 of its canonical form. The hash makes the pointer
   checkable: a record edited after emission no longer matches the trace.
   `ApprovalRequest` additionally emits the observability `approval` event — id
   and state only — so a pending approval appears in the viewer, which is the
   failure that layer exists to prevent.
8. **`WebsiteChange` carries no file list.** The files live on the `ChangeRecord`
   it references. One home per fact, applied to the agent layer's own records.
9. **A missing link in an audit chain must be named.** `WebsiteChange` refuses an
   empty link array unless `chain_gaps` says why it is empty — the asterisk
   discipline, and the same rule the observability layer's `chain` command
   already follows.
10. **Fixtures are aggressively marked simulated** — `example.invalid` hosts,
    `simulated: true` on every record and every evidence entry, and `validate()`
    refuses a simulated record unless the caller explicitly asks. The suite
    asserts the markers rather than trusting them.

## Tests

Run in this session, from the repository root, on the tree at `4bd1f0d`:

| Command | Result |
|---|---|
| `node --test agent/schemas/selftest.mjs` | **61 pass · 0 fail** |
| `node agent/schemas/cli.mjs check` | 14 contracts · 14 satisfiable by their fixture · exit 0 |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail — unchanged |
| `node agent/observability/cli.mjs validate` | 0 records · 0 invalid · exit 0 |
| `node tools/validate.mjs` | 0 errors · exit 0 |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings |
| `node tools/design-qa.mjs` | 0 errors · **5 warnings** · exit 0 — the same five in §12 |
| `node tools/freshness.mjs` | reports only · exit 0 |

**The four validators' output is byte-identical to the run taken before any file
was added** (compared with `diff`, not by eye). No new warning.

The 61 tests cover: the fourteen contracts exist, are documented and carry the
envelope · all twelve proposal fields on all four proposals · vocabularies are
the site's and the trace's rather than copies · every contract is satisfiable by
its fixture · every fixture is unmistakably simulated · identity, closed shapes
and forbidden fields · each of the four epistemic states and the rules that keep
them apart · `null` vs `"unknown"` in both directions · evidence that cannot bear
what cites it · every governance rule · at least one rule per contract · the gate
refusing an invalid record, hashing rather than copying, and refusing a handoff ·
the JSON Schema export.

**Not run:** no agent has used these contracts, because none exists. No record
has been produced by anything other than a fixture.

## Observability

**No file in `agent/observability/` was modified.** The contract layer is a
consumer of it: `gateway.mjs` writes through `tracer.mjs`'s existing `artifact`,
`approval` and `handoff` events, and the suite asserts that every record the gate
emits satisfies `agent/observability/schema.mjs` unchanged. The record vocabulary
did not need extending, which was the intended outcome — a contract record is an
artifact with an id and a hash, not a new kind of trace event.

## Known limitations

1. No agent implements these contracts, because none exists. The first real agent
   will almost certainly find a field that is the wrong shape.
2. The epistemic requirement is enforced on top-level fields only (decision 6).
3. Only 4 fields across the fourteen contracts are typed `factual`, 5
   `inference`, 2 `interpretation`; the other 292 are structural. That is
   correct — most fields are bookkeeping — but the epistemic machinery is
   exercised by a small number of fields, and the suite checks that every field
   declares a class, not that the class is right.
4. The red-target list is matched as substrings against an entity's path, field
   or id. It catches `js/format.js:TIER_GRADE`; it will not catch a red-tier
   change described only in prose in a `reason` field.
5. Cross-record references are checked only within a batch, and reported rather
   than failed, because the referenced record may legitimately live elsewhere.
6. **Nothing stores contract records.** The gate hashes them into the trace;
   where the records themselves live is undecided, and it must not be `data/`.
7. `AgentObservation` and the tracer's `observe()` overlap: an agent emitting
   both writes the summary twice. Whether the trace record should become a
   pointer too is unresolved.

## Unresolved issues

Carried forward and still open — none was in this session's scope:

1. **`data/brief.json` is canonical but never consumed**; its content ships as
   the inline `window.__CONTENT__` blob at `index.html:361`. Two homes for one
   set of facts. `EditorialProposal.content_blob_checked` now forces an agent to
   *declare* it checked both — it does not fix the drift, and must not be taken
   to have fixed it.
2. **The two copies have already drifted** — `meta.standfirst` differs. Which is
   correct is the author's decision; an agent must not pick one.
3. **No deploy gate.** A push to `main` publishes; the validators do not run in
   CI.
4. **106 records carry an unverified or requires-verification note.** The
   project's largest open body of work.
5. **No decision on excluding `agent/` from the Pages deployment.** This session
   adds a second directory under it. Nothing here is reachable as a page — the
   `.mjs` files are not HTML and nothing links to them — but the directory is
   served, and the decision is still not taken.

New, from this session:

6. **Neither `docs/OBSERVABILITY.md` nor `docs/AGENT-CONTRACTS.md` is referenced
   from `AGENTS.md`.** `AGENTS.md` is the canonical entry point and its "Read
   these first" table does not mention either. An agent that reads only the
   entry point will not learn that the contracts exist, which undercuts "no agent
   may bypass these contracts". **This session deliberately did not edit
   `AGENTS.md`** — SESSION 02 set the precedent of not touching it, and what
   belongs in the author's entry point is the author's decision. It is a real
   gap and it is recorded here rather than closed unilaterally.
7. **`.agents/skills/git-workflow/SKILL.md` names a stale branch.** See the
   discrepancy note above.
8. **Where contract records are stored is undecided** (limitation 6).

## Next session

**SESSION 05 — instrument one real read-only agent against these contracts.**

This is SESSION 02's recommended next objective, unchanged and now with an
interface to speak. Build **one** agent: the Scout, **read-only**, against real
sources, emitting through `agent/observability/tracer.mjs` and
`agent/schemas/gateway.mjs`, producing real `SourceCandidate` and `DataGap`
records, appearing in the viewer with real provenance.

Do not build the Verifier or the Change Detector in the same session, and do not
let any agent write to `data/*.json`.

## Exact next objective

A Scout that, given a statement already present in the brief, retrieves candidate
sources, and emits — through the gate, so nothing unvalidated leaves it —
`SourceCandidate` records for what it found and `DataGap` records for what it
could not find, with `AgentRun` and `AgentObservation` records for the run
itself. It verifies nothing, proposes nothing, and writes to no dataset. Its
first real output will show which of these contracts is the wrong shape; fix the
contract and its tests in the same commit.

## Next-session instructions

- Read `AGENTS.md` first — it is the canonical entry point — then invoke
  `project-context` and read `docs/PROJECT-CONTEXT.md`,
  `docs/CURRENT-ARCHITECTURE.md`, `docs/AI-SAFE-BOUNDARIES.md` and this file,
  then `docs/OBSERVABILITY.md` and `docs/AGENT-CONTRACTS.md` before writing any
  agent.
- Re-run the four validators and confirm the §12 baseline before changing
  anything.
- **Every record an agent produces goes through `agent/schemas/gateway.mjs`.** Do
  not construct a record and pass it on directly; do not add a second path that
  skips validation. If a contract refuses something an agent legitimately needs
  to say, that is a finding about the contract — change the contract and its
  tests, do not route around it.
- **Nothing outside the fixtures may be marked `simulated`.** A real Scout's
  records are real records or they are not written.
- A real provenance record must carry a `url` or a `locator`; both the trace
  schema and these contracts refuse it otherwise.
- Extending the contract vocabulary means extending the contract **and its
  tests** in the same commit, exactly as the observability layer already
  requires.
- Before declaring done: `node --test agent/schemas/selftest.mjs`,
  `node agent/schemas/cli.mjs check`,
  `node --test agent/observability/selftest.mjs`,
  `node agent/observability/cli.mjs validate`, and the four validators in
  `tools/`.

## Do not

Carried forward from SESSION 00 and SESSION 02, unchanged and still binding:

- **Do not rebuild the site.** No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.**
- **Do not modify `data/*.json`** in a session not scoped for data work.
- **Do not touch** the footer's non-affiliation or no-legal-advice text,
  `TIER_GRADE` in `js/format.js`, the derivation rules in `js/pipeline.js`, or
  the `BASE` constant in `tools/_footer.mjs`.
- **Do not declare a licence.**
- **Do not soften** the README's known limitations or the unverified-record
  count.
- **Do not re-run** `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- **Do not change the id shapes in `agent/observability/ids.mjs`.** They are the
  OTLP export contract.
- **Do not move redaction to the read path.**
- **Do not remove the demonstrator's simulation markers**, and do not point it at
  a real source.
- **Do not commit anything under `agent/observability/runs/`.**
- **Do not install Langfuse or Phoenix without re-reading the evaluation** in
  `docs/OBSERVABILITY.md`.

Added by this session:

- **Do not add a validation bypass.** No `skip`, no `force`, no `strict: false`
  on `validate`. The single flag that exists, `allowSimulated`, admits a fixture
  and nothing else.
- **Do not commit a `.schema.json`.** JSON Schema is derived on demand; a
  committed copy is a second home for every field definition, and the suite
  fails if one appears.
- **Do not copy a contract record's body into the trace.** The trace gets an id
  and a hash. Copying the body makes the trace a second home for every fact the
  record carries.
- **Do not add a field for a substitute value** to `DataGap` or anywhere else,
  under any name. A gap is closed by finding the source.
- **Do not relax `supports:context`.** A fact resting only on context evidence is
  refused in three places, deliberately.
- **Do not copy a vocabulary** out of `data/taxonomy.json` or
  `agent/observability/schema.mjs` into `agent/schemas/`. They are imported, and
  the suite asserts identity.
- **Do not mark anything outside `fixtures.mjs` as `simulated`.**

---

## What must NOT be rebuilt

SESSION 00's closing statement stands unchanged: **the architecture is not
technical debt, it is the argument.** The zero-build, zero-dependency,
client-rendered model; `js/data.js` as the sole fetch point; the derivation
layer; the one-home-per-fact data model; the taxonomy as universal enum
authority; the `null` / `unknown` distinction; `js/shell.js` and
`js/evidence-view.js` as single renderers; the seven duplicated footers; and the
four validators — none of these was touched, and none should be. The full
statement is in `git show c2e62c7:docs/HANDOVER.md`.

The contract layer was built to the same standard, and to the observability
layer's: no dependency, no build step, derived state never stored, vocabularies
borrowed rather than copied, and every record able to say what it cannot support.
