# HANDOVER

**Last updated:** SESSION 12 · 3 September 2026
**Branch:** `claude/foundation-verification-audit-40ozpo`, cut from `main` at `45dcc57`.
**Base commit:** `45dcc57` on `main` ("Record in the handover that SESSION 11 is merged").
**Not merged into `main`, and there is nothing to merge.** This session changed no
tracked file except this document — it was a read-only verification audit, not a
build session. `git status` was clean before the audit and is clean now.

**A note for the next session, because the same trap has now caught four in a
row.** `git fetch --all && git branch -a` before concluding anything about what
this repository contains, and check `git log origin/main..main` **and**
`main..origin/main` before merging into a local branch you did not just create.

---

## Current milestone

**SESSION 12 — Foundation verification & pre-Knowledge-Architect audit. Complete.**

The repository owner asked for a rigorous read-only verification of everything
built in Sessions 02–12 — observability, the four agents (Scout, Verifier, Change
Detector, Data Depth), the 18-contract gateway, CI/CD, the data model, security —
before authorizing **SESSION 13 (Agent 5, the Knowledge Architect)**. Fifteen
phases were run against the actual repository rather than trusted from
documentation: all eight test suites, all four `tools/` validators, the contract
gateway tested adversarially, a live Scout run against the real EU endpoints, a
chained Scout → Verifier run, and independent re-derivation of three validator
defects `docs/AUDIT-2026-09-01.md` already claimed — all three reproduced, not
merely re-quoted.

**Verdict: B — READY WITH TARGETED REMEDIATION.** The foundation is coherent and
its safety properties are enforced by code, not merely documented — see "What was
verified as genuinely sound" below. Three findings specifically block what
SESSION 13 needs (durable node identity and cross-run linkage, for a knowledge
*graph*) without requiring any restructuring. **SESSION 13 should not start until
these three are fixed.** They are additive, not architectural.

## What was verified as genuinely sound (do not re-litigate)

- **The contract gateway rejects malformed input.** Tested adversarially: raw
  JSON with no `contract` field, an unknown contract name, a known contract with
  an empty body, a known contract with an extra unrecognised field, `null`, a
  bare string, an array — **7/7 correctly rejected** by
  `agent/schemas/gateway.mjs`. No skip flag exists.
- **A failed retrieval becomes a `DataGap`, never a candidate.** Verified against
  the real network, not a fixture: `agent/scout/cli.mjs --live --dry` against all
  five registered EU endpoints, blocked by the session's egress policy, produced
  **5 gaps, 0 candidates, 0 false positives.**
- **`simulated` records are correctly refused as never-actionable.** Chaining a
  real mock Scout run into the Verifier (`--records <trace-id>`) had all 6
  candidates refused at intake for exactly this reason — the refusal is the
  feature working, not a bug to route around.
- **The CI write boundary holds.** Two-job split (network access with no write
  token / write token with no network beyond github.com), `guard.mjs` as an
  allowlist enforced on both sides of the artifact boundary, attacker-controlled
  inputs bound to `env:` and never interpolated into shell.
- **No agent writes to `data/`.** Every suite hashes the directory before and
  after a full run against the real corpus and asserts byte-identity; this
  session's own runs (Scout mock + live, Verifier, Integrator, Detector, Depth,
  all against real `data/` where applicable) left it untouched.
- **`data/brief.json` vs. `index.html`'s inline `__CONTENT__` drift is real and
  already documented (F-04).** Independently re-measured this session:
  `meta.standfirst` differs between the two homes; nothing loads `brief.json` at
  runtime. Not a new finding — confirmed, not touched.

## The three findings that gate SESSION 13

**1 · Record ids have no identity beyond one run.** All five agents mint ids from
a per-run counter — `#id(prefix) → prefix-NNN` in `agent/depth/depth.mjs:109`,
and the same pattern in `agent/detector/detector.mjs`,
`agent/integrate/adapter.mjs`, `agent/scout/scout.mjs`,
`agent/verifier/verifier.mjs`. Run the same analysis twice and every `gap_id`
changes. Measured against the real corpus: 57 `KnowledgeGap` records, 57 distinct
`gap_id`, but only **56 distinct** `(gap_kind, entity)` natural keys —
`missing_instrument_relationship|ai-act` collides, so even the obvious fallback
key is not quite sufficient. A knowledge graph is a structure of stable nodes;
this is the specific prerequisite it is missing.

**2 · No agent CLI populates cross-agent trace linkage.** `Span.handoff()` and
`gateway.handoff()` exist and are implemented correctly, but the only callers
outside tests are in `agent/observability/demo/workflow.mjs`. Verified by
chaining a real Scout trace into a real Verifier run: the Verifier's `AgentRun`
record came back `parent_run_id: null`, `handed_off_to: []`, and its trace
contains **zero** references to the Scout trace it consumed. "Can this execution
be correlated with another agent's?" is unanswerable in every real code path
today.

**3 · A run whose entire input was refused at intake still reports `ok`.** In the
chained run above, all 6 candidates were correctly refused; six child spans
closed `failed`; six `error` records were written — and the root span still
closed `status: ok`, and `agent/observability/cli.mjs list` still renders
`✓ ok`. The per-record epistemics are honest (`epistemic.unresolved` names all
six); the aggregate signal is not. `degraded` is already defined in the schema
and computed at read time for exactly this shape — it just doesn't reach the
summary line or the exit code.

Two more, worth doing soon but not gating: no trace carries a commit sha (question
"which code ran" is unanswerable); the Scout → Verifier boundary has never been
exercised with a real, non-simulated record, only within each agent's own
fixtures.

## Files changed

None, except this document. No agent module, contract, dataset, workflow, or page
was edited. Two git-ignored directories (`agent/records/`,
`agent/observability/runs/`) gained real run output from verification — not
committed, per `.gitignore`, and not the repository's concern.

## Tests

Every existing suite and validator was re-run, not trusted from documentation.
All matched the SESSION 11 baseline exactly:

| Command | Result |
|---|---|
| `node --test agent/observability/selftest.mjs` | 22 pass · 0 fail |
| `node --test agent/schemas/selftest.mjs` | 121 pass · 0 fail |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail |
| `node --test agent/verifier/selftest.mjs` | 42 pass · 0 fail |
| `node --test agent/integrate/selftest.mjs` | 61 pass · 0 fail |
| `node --test agent/detector/selftest.mjs` | 63 pass · 0 fail |
| `node --test agent/depth/selftest.mjs` | 40 pass · 0 fail |
| `node agent/schemas/cli.mjs check` | 18/18 satisfiable |
| `node tools/validate.mjs` | 0 errors, 106 unverified — matches §12 baseline |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings |
| `node tools/design-qa.mjs` | 0 errors, 5 warnings — same five, by file and line |
| `node tools/freshness.mjs` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 735 records (this session's real runs), 0 invalid |

**397 tests, unchanged from SESSION 11 — the baseline held.**

Additionally executed as live verification, outside the standing suite:
`agent/scout/cli.mjs --mock`, `agent/scout/cli.mjs --live --dry` (real EU
endpoints), `agent/verifier/cli.mjs --records <scout-trace-id>`,
`agent/integrate/cli.mjs --mock`, `agent/detector/cli.mjs --mock`,
`agent/depth/cli.mjs --as-of 2026-09-02` (run twice — deterministic, modulo the
trace id).

## Observability

Nothing was instrumented this session — no agent was built. What was verified is
that the existing instrumentation is real, not decorative: redaction was tested
by running `agent/observability/demo/workflow.mjs`, which deliberately embeds a
fake API key, and confirming the string reached no trace file on disk; the trace
store was schema-validated after six real runs (735 records, 0 invalid, 0
unparseable).

## Known limitations

SESSION 11's own limitations list (`docs/DATA-DEPTH.md` §12) is unchanged — Depth
was not touched. This session's own limitations are findings 1–3 above and issues
15–19 below.

## Unresolved issues, carried forward

Items 1–14 are SESSION 11's and stand unchanged. New from this session's
independent, code-level verification:

15. **No trace carries a commit sha or code version.** "Which code state ran" is
    unanswerable from any trace today. `Tracer` already accepts free-form
    `attributes`; no CLI populates one.
16. **No CLI populates `parent_run_id` or calls `handoff()` across agents**,
    despite both existing correctly in `agent/schemas/gateway.mjs` and
    `agent/observability/tracer.mjs`. Confirmed by a real chained Scout →
    Verifier run. **Gates SESSION 13 — see Next session.**
17. **A root run can close `status: ok` over 100% failed children.** `degraded`
    is defined in the schema and computed at read time for exactly this shape,
    but does not reach `agent/observability/cli.mjs list`'s summary line or drive
    the process exit code.
18. **Record ids have no identity across runs** — a per-run counter, not
    content-derived. Confirmed against the real corpus: 57 `KnowledgeGap`
    records, only 56 distinct natural keys. **Gates SESSION 13 — see Next
    session.**
19. **The Scout → Verifier boundary has never been exercised with a real,
    non-simulated record**, only within each agent's own fixtures. The gateway
    correctly refuses `simulated` records as never-actionable — which is exactly
    what blocked the live chain this session ran — and there is no path that
    keeps a real record's `simulated` flag propagating end to end without either
    laundering a fixture or reaching a live document.

## Next session

**This is not SESSION 13, even though the repository owner has that prompt ready
(Agent 5, the Knowledge Architect).** A knowledge graph is a structure of stable
nodes and durable edges; issues 16 and 18 above are the specific prerequisites of
that deliverable, not general technical debt to defer. Do SESSION 13 on top of
them, not before them.

### Exact next objective — remediation, before SESSION 13 starts

1. **Content-derived stable ids.** Replace the per-run `#id(prefix)` counter in
   `agent/depth/depth.mjs`, `agent/detector/detector.mjs`,
   `agent/integrate/adapter.mjs`, `agent/scout/scout.mjs` and
   `agent/verifier/verifier.mjs` with an id derived from content (the finding's
   kind/type + the full sorted affected-entity set + subject, hashed or encoded),
   so the same finding gets the same id across runs. **Do not add an id store** —
   a lookup table mapping old ids to new would be the second home this
   architecture exists to prevent; the id itself must be reproducible from the
   finding's own content.
2. **Populate cross-agent trace linkage in the four `--records` CLIs**
   (`agent/verifier/cli.mjs`, `agent/integrate/cli.mjs`,
   `agent/detector/cli.mjs`, `agent/depth/cli.mjs`): pass the upstream trace's
   run id through as `parent_run_id`, and call the `handoff()` the gateway
   already provides when accepting records from it. The contract fields
   (`parent_run_id`, `trace_ref`, `handed_off_to`) already model this correctly —
   only the CLIs fail to populate them.
3. **Surface `degraded` in the run summary** (`agent/observability/query.mjs`,
   read by `cli.mjs list`) when a root closes `ok` over one or more failed
   children, and give total-intake-refusal a non-zero exit in the affected CLIs.

Each item is additive: no schema change, no new dependency, nothing under
`data/`. Validate with the same eight suites plus a re-run of the Scout →
Verifier chain, confirming `parent_run_id` and a `handoff` record now appear on
the downstream trace.

**Then, and only then, proceed to SESSION 13** as the repository owner has
scoped it.

**One instruction in the SESSION 13 prompt needs a standing correction before
it is used:** it ends "At the end of the session, merge the new implementations
into branch `main`." `AGENTS.md`'s Git section requires the repository owner's
**explicit instruction, given at the time**, for any push to `main` — because
`main` publishes to the live site and there is no deploy gate. SESSION 10 and
SESSION 11 both record that this instruction was obtained when it happened, not
assumed from a prompt template. The session that runs SESSION 13 should develop
on its own branch as every prior session has, and stop to ask for that
instruction before merging — not merge because the prompt said to.

## Anything the next agent must know

- **The three remediation items above are additive.** None requires a schema
  change, a new dependency, or touching `data/`. `AgentRun.forbidden` already
  bans storing anything `query.mjs` can derive — `degraded` is one of those, so
  item 3 is a read-model fix, not a new stored field.
- **Do not weaken the `simulated` refusal to make issue 19 easier to test.** A
  fixture must stay never-actionable under any circumstance; a real fix keeps a
  real record's `simulated` flag propagating rather than adding a way to bypass
  the check.
- Before declaring remediation complete: the eight `--test` suites,
  `agent/schemas/cli.mjs check`, the four validators — compared against this
  document's Tests section — plus the Scout → Verifier chain re-run to confirm
  `parent_run_id` and the handoff now appear on the downstream trace.
- SESSION 11's own device-specific notes for `agent/depth/` — never writes
  anything and the suite scans for it; `asOf` is an argument everywhere; a
  finding with no demand is a census entry, not a censored one; a suppression
  without a reason is a test failure; a detector that finds nothing must still
  appear in the run result; a change record may never create or raise a gap;
  `CO_CITATION_FLOOR` is the one tuned number and the suite asserts it; the
  glossary threshold is per kind of record and derived from the glossary itself
  — all still apply unchanged; Depth was not touched this session.

## Anything the next agent must NOT change

- **Do not add an id store or any second home for a record's identity.** Ids
  must stay derivable from content, not looked up.
- **Do not relax the contract gateway's rejection of anything malformed or
  `simulated`.** Tested adversarially this session — arbitrary JSON, an unknown
  contract name, an empty body, an extra field, `null`, a string, an array, 7/7
  correctly rejected — it is the single most load-bearing safety property this
  audit verified.
- **Do not merge to `main` without the repository owner's explicit instruction
  given at the time**, regardless of what a session prompt's closing line says.
- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative — it
  is a data/editorial decision, not a code defect.
- Do not modify `data/*.json` in a session not scoped for data work. The 57
  `KnowledgeGap` findings from SESSION 11 are questions, not a work order.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- Do not change the id *shapes* in `agent/observability/ids.mjs` (trace/span hex
  widths) while fixing remediation item 1 above — that is about
  contract-record ids (`gap_id`, `cand_id`, etc.), not observability ids, which
  are a separate, already-correct W3C-Trace-Context-shaped system.
- Do not move redaction to the read path, and do not raise `MAX_STRING` to fit a
  payload.
- **Do not add an entry to `GOVERNANCE_PERMITS`** without the repository owner
  naming the document that grants it.
- **Do not add a `KnowledgeGap` field for a missing value**, under any of the
  six names the contract forbids, and do not relax the rule that a gap is never
  `autonomous`. Closing a knowledge gap writes a legal fact.
