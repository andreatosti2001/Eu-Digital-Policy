# HANDOVER

**Last updated:** SESSION 08 · 2 September 2026
**Branch:** `claude/verification-existing-data-qer8u5`, cut from `origin/main` at `cef6b58`.
**Base commit:** `cef6b58` on `main` ("Merge the Legal Verifier branch (be45ee2)").

---

## Current milestone

**SESSION 08 — integrate verification with the existing data. Complete.**

The Legal Verifier produces a `VerificationRecord`. Nothing in that record
touches `data/`. This session built the layer that gets from one to the other —
`agent/integrate/` — and it carries the same honest caveat every agent here
does: **it has never seen a real `VerificationRecord`**, because the Verifier has
never read a real document. The *corpus* it matches against is real; the
verifications are fixtures.

The reference document is **`docs/VERIFICATION-INTEGRATION.md`**. This file is
the handover only.

## What the session was told, and what was done

> Study the existing data. **Do not replace the current data model.** Create an
> adapter between Verification Records and the current canonical datasets. Find
> an existing claim before creating a new one; find an existing source before
> creating a duplicate; attach evidence to the canonical record; detect
> unsupported claims; detect stale verification; detect conflicting evidence;
> preserve existing IDs; preserve existing provenance. Any proposed factual
> modification must first become a proposal object. Do not automatically merge
> substantive legal changes.

**The data model was not replaced, extended, migrated or shadowed.** No file was
added to `data/`. No field was added to any dataset. Not one byte of `data/`
changed — asserted by hashing the directory around a full non-dry run, by
`git status --porcelain`, and by a test that scans every module in
`agent/integrate/` for a write call.

| | Requirement | Module |
|---|---|---|
| 1 | find an existing claim before creating a new one | `agent/integrate/claims.mjs` |
| 2 | find an existing source before creating a duplicate | `agent/integrate/sources.mjs` |
| 3 | attach evidence to the canonical record | `agent/integrate/evidence.mjs` |
| 4 | detect unsupported claims | `agent/integrate/unsupported.mjs` |
| 5 | detect stale verification | `agent/integrate/stale.mjs` |
| 6 | detect conflicting evidence | `agent/integrate/conflicts.mjs` |
| 7 | preserve existing IDs | `agent/integrate/preserve.mjs` + the contract |
| 8 | preserve existing provenance | `agent/integrate/preserve.mjs` + the contract |

## Files changed

```
agent/integrate/*                                (new — 13 modules + README, 61 tests)
agent/schemas/contracts/data-proposal.mjs        (new — the fifteenth contract)
agent/schemas/registry.mjs                       (DataProposal registered)
agent/schemas/types.mjs                          (DATA_OPERATION_KINDS, PROVENANCE_DISPOSITIONS)
agent/schemas/fixtures.mjs                       (dataProposalFixture)
agent/schemas/selftest.mjs                       (13 new tests; fourteen → fifteen)
agent/schemas/common.mjs, export.mjs             (comment counts only)
agent/schemas/README.md                          (three agents now speak the contracts)
tools/freshness.mjs                              (EXPECTED exported; audit body guarded — see below)
docs/VERIFICATION-INTEGRATION.md                 (new — the reference document)
docs/AGENT-CONTRACTS.md                          (the fifteenth, and a stale count corrected)
AGENTS.md                                        (the agent suites, and the three agent docs)
docs/HANDOVER.md                                 (this file)
```

**Not touched:** every `data/*.json`, every page, every file under `js/`, `css/`
and `i18n/`, `tools/validate.mjs`, `tools/i18n-audit.mjs`, `tools/design-qa.mjs`,
and every file under `agent/scout/`, `agent/verifier/` and
`agent/observability/`.

## The contract change this forced, and it is a Class C one

**`DataProposal` is a fifteenth contract.** Flagged here rather than buried.

The session requires that any proposed factual modification first become a
proposal object. The fourteen had no home for one. `EditorialProposal` is about
prose; `ImplementationProposal` is about code and would have recorded a change
to what the site says about EU law as a change to a script; `ClaimEvidence` is a
link, not a proposal, and cannot express "create a source record" at all; and
doing it outside the contract layer would have put the one operation that
reaches the legal record outside the one gate that checks anything.

So it was added with its tests in the same commit — the course SESSION 05 took
for the Scout and SESSION 07 for the Verifier. The full reasoning, and what was
considered and rejected, is in `docs/VERIFICATION-INTEGRATION.md` §3.

**`CONTRACT_SCHEMA_VERSION` was deliberately NOT bumped**, on both earlier
sessions' precedent. Adding a contract invalidates nothing that already exists —
no record names `DataProposal` unless something wrote one — so the case is
weaker here than it was for either earlier amendment. **The contract layer still
has no per-contract versioning, and this session did not add one.**

## The one validator that was changed, and why

`tools/freshness.mjs` now `export`s its `EXPECTED` interval table, and its audit
body runs only when the file is the entry point.

`agent/integrate/stale.mjs` asks the same question of the same datasets. A
second table of intervals in the agent layer would be a second home for a fact,
and the two would disagree the first time somebody tightened one. Importing the
module previously ran the whole audit and called `process.exit`.

**Its output is byte-identical.** Verified by diffing a run against a fixed date
before and after the change; the diff is empty and the exit code is unchanged.
Under `AI-SAFE-BOUNDARIES` §1 that is a green-tier refactor within one module —
behaviour, output and the four validator results unchanged — and it is named
here so nobody has to discover it in a diff.

## Tests

Run in this session, from the repository root:

| Command | Result |
|---|---|
| `node --test agent/integrate/selftest.mjs` | **61 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | **86 pass · 0 fail** (73 before; 13 new) |
| `node --test agent/verifier/selftest.mjs` | 42 pass · 0 fail — unchanged |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail — unchanged |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | 15/15 satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified records** — matches the §12 baseline exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-02` | "Nothing past its stated interval", exit 0 — byte-identical to the same run before the refactor |

**250 tests across the six suites, all passing** (176 before this session).

**`data/` was verified untouched in both directions**: a full non-dry run
(`node agent/integrate/cli.mjs --mock`) left every `data/*.json` byte-identical
by sha256, and `git status --porcelain` shows no dataset modified.

**The integration tests run against the real `data/`, not a mock corpus.** That
is deliberate and it is the one thing that distinguishes this suite from the
other five: an adapter to the canonical datasets tested only against a corpus
this session invented would prove nothing about the corpus it will meet. The
fixtures' real ids and URLs are looked up from `data/` at load rather than typed
in, so a renamed record fails the fixtures loudly instead of quietly testing
nothing.

## Four defects the tests found

1. **The CELEX pattern matched nothing at all** — it omitted the sector digit,
   so every EUR-Lex address fell through to the weaker URL strategy.
2. **Five identical attach proposals for one reference.** Applied in order they
   would have put one source in one claim's bibliography five times.
3. **A `conflict` verdict was founding a source record.** No verdict outside
   `confirmed` and `partially_confirmed` now produces any proposal at all.
4. **The compilation-date signal was binary, and wrong for the dataset it
   mattered most for.** `data/claims.json` carries two distinct `last_verified`
   values across 84 records; an "are they all identical" test reported it as a
   per-record field, which is the opposite of what `VERIFICATION-POLICY` §5
   records.

Detail in `docs/VERIFICATION-INTEGRATION.md` §13.

## What this layer will not do

Each of these is a test, not a promise:

- resolve a conflict, or rank two authorities
- pick one of two candidates from an ambiguity
- strengthen a `supports` qualifier beyond what the verdict carries
- attach a source a claim already cites, or the same pair twice in one run
- create a source record from anything but a document actually fetched and read
- draft the text of a new claim, or mint an id
- set `last_verified` on anything
- remove a `verification_note`, a `reference_gap` or a `requires_verification`
  flag
- read a clock in a judging path
- write to `data/`, or merge anything

## Known limitations

Stated in full in `docs/VERIFICATION-INTEGRATION.md` §14. The four that matter
most:

1. **It has never seen a real `VerificationRecord`**, because the Verifier has
   never read a real document. Inherited from the egress-policy finding,
   unchanged since SESSION 05.
2. **Matching is English-only and lexical.** A corpus about EU law contains
   documents in twenty-three other languages, and `overlap` would score two
   French sentences on their punctuation.
3. **Only claims and sources are matched.** A verification bearing on a timeline
   event, an enforcement action or a provision resolves to no claim; the
   `against_canonical` conflict check is the only thing that reads those
   datasets.
4. **Nothing applies a proposal.** There is no path from an approved
   `ApprovalRequest` to a `ChangeRecord` to an edit. Deliberate for this session,
   and it means the loop is not closed: a human applies a change by hand and this
   layer does not know they did.

## Unresolved issues, carried forward unchanged

None of these was touched by this session:

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping
   ground at different altitudes, uncross-checked.
4. The five operating-policy documents have not been cross-checked against
   `agent/schemas/`.
5. **106 records carry an unverified or requires-verification note. This session
   did not move that number and was not trying to.** It built the layer that
   could eventually help a human move it, and that layer has read nothing real.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no
   retention policy, concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions.
8. The `conflicting` provenance word is a sixth where
   `.agents/skills/legal-source-verification/references/verification-protocol.md`
   documents five. Carried forward from SESSION 07, still unreconciled.
9. Five of the Verifier's twelve legal statuses map to nothing in
   `data/taxonomy.json`. This session reports them as a coverage gap and
   deliberately did not add them.

## Next session

**A — dispatch the Source Scout workflow on a real runner.** Unchanged from
SESSION 07 and now more valuable still: two agents and an adapter exist, and
none of them has seen a real document. `mode: mock` first, then `mode: live`
with `dry_run: true`. **Everything downstream is blocked on one real retrieval
succeeding**, and the chain is now complete behind it —
`scout → verifier → integrate → a proposal in front of a human`.

**B — close the loop.** `ApprovalRequest → ChangeRecord → an applied edit`. This
session produces the approval and stops. The half that is missing is the one
that writes, and it is the half that needs the most care: it is the only code in
this repository that would ever touch `data/` on an agent's initiative, and
`AUTONOMY-POLICY` reserves that to a human. What is genuinely missing is not the
write — it is the record that a human applied one, so the next run does not
propose it again.

**C — decide whether the five unmapped legal statuses belong in
`data/taxonomy.json`.** Unchanged from SESSION 07. `corrected`, `annulled`,
`under_judicial_review`, `guidance`, `non_binding_commentary`. A deliberate data
change in a session scoped for data work — not something to retrofit from the
agent layer, which is why two sessions have now left it and said so.

### Exact next objective

**A.** Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true`,
confirm the workflow's mechanics on a real GitHub-hosted runner, then decide with
the repository owner whether to proceed to a live dispatch. If a live retrieval
succeeds, the follow-on is now two steps rather than one:
`node agent/verifier/cli.mjs --records <trace-id>` and then
`node agent/integrate/cli.mjs --records <trace-id> --as-of <date>` — the first
time anything in this repository will have taken a real document all the way to
a proposal a human can read.

## Anything the next agent must know

- **`agent/integrate/` never writes anything.** It stores through
  `agent/scout/store.mjs` and its suite fails if any module in the directory
  contains a write call. If a task seems to need one, that is a different change
  with its own review path — see next-session candidate B.
- **Two gates run on every `DataProposal`, and neither can be turned off.** The
  contract in `agent/schemas/validate.mjs`, and `checkPreservation` against the
  corpus. The suite asserts `adapter.mjs` contains exactly one call to the store
  and exactly one to the preservation check.
- **`ambiguous` is a correct answer.** So is a gap, and so is a conflict. A
  future session that "improves" the matcher by making it decide more often has
  damaged it, in exactly the way `VERIFICATION-POLICY` §6 describes for the
  unverified-record count and `docs/LEGAL-VERIFIER.md` describes for the six
  verdicts.
- **The verdict-to-qualifier mapping in `evidence.mjs` only ever weakens.** It is
  the highest-leverage line in the directory: only `supports:direct` raises a
  grade, and the grade is what a reader uses to judge how much to trust a
  sentence.
- **`asOf` is an argument, everywhere.** `Integrator` and `staleVerification`
  throw without it and the CLI refuses to run. A test strips comments from every
  judging module and asserts none contains `new Date()` or `Date.now()`.
- **`js/format.js` imports cleanly in Node**, and this layer uses `familyOf` and
  `evidenceGrade` from it rather than reimplementing either. If a future session
  needs a graded claim in the agent layer, it imports the same function.
- Before declaring anything done: the six `--test` suites, `agent/schemas/cli.mjs
  check`, then the four validators in `tools/`, compared against the
  `docs/CURRENT-ARCHITECTURE.md` §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.
- Do not modify `data/*.json` in a session not scoped for data work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- Do not change the id shapes in `agent/observability/ids.mjs`; do not move
  redaction to the read path.
- Do not commit anything under `agent/records/` or `agent/observability/runs/`.
- Do not add a validation bypass to `agent/schemas/validate.mjs`. No `skip`, no
  `force`, no `strict: false`.
- Do not add a field for a substitute value to `DataGap` or anywhere else.
- Do not resurrect the retired Scouts from their old branches.
- Do not let `agent/scout/schedule/` write to anything but
  `agent/scout/digests/*.{json,md}`.
- Do not write a report-layer annotation back into a `SourceCandidate` or
  `DataGap`.
- Do not gitignore `agent/scout/digests/`.
- Do not store `outcome_class`, `tier`, `grade` or `binding` on a
  `VerificationRecord`.
- Do not merge `entry_into_force_date` and `applicability_date`, and do not let
  either become the other's default.
- Do not teach `dates.mjs` to compute the twentieth-day date.
- Do not add a ranking, a tie-break or a "most recent wins" to
  `agent/verifier/conflict.mjs`.
- Do not raise the Verifier's confidence ceiling above 0.9.
- Do not remove the self-verification refusal at intake, in either agent.

Added by this session:

- **Do not add a write path to `agent/integrate/`**, and do not add a bypass to
  either of its two gates.
- **Do not let the integrator resolve a conflict.** No ranking, no tie-break, no
  "most recent wins", no "the primary source governs". Each is a rule about which
  regulator to believe, and `AGENT-ROLES` H7 reserves it to a human.
- **Do not let a matcher pick a winner from an ambiguity.** The highest score is
  the closest candidate, not the right answer.
- **Do not give the provenance vocabulary a word for removal**, and do not let
  `replaced_human_only` be used outside a substantive, `human_only` proposal.
- **Do not let anything in `agent/integrate/` set `last_verified`.** Attaching
  evidence does not make a record freshly verified, and bulk-stamping the field
  is prohibited outright.
- **Do not reimplement `evidenceGrade`, `familyOf`, `compareValues`,
  `normaliseUrl` or `normaliseTitle`.** All five are imported from the module
  that owns them, and a second copy is the drift this repository exists to
  prevent.
- **Do not re-add the audit body of `tools/freshness.mjs` outside its `isMain`
  guard.** Importing it must define constants and do nothing else.
- **Do not let a `create_claim` proposal draft claim text.** The brief says what
  the brief says; if no sentence carries a proposition, there is no claim to
  write.

---

## What must NOT be rebuilt

Unchanged since SESSION 00: **the architecture is not technical debt, it is the
argument.** Nothing in `js/`, `css/`, `data/`, `i18n/`, the seven pages,
`agent/observability/`, `agent/scout/` or `agent/verifier/` was touched by this
session, and the three validators that were not changed were not changed at all.

The adapter was built to the same standard as everything it wraps: no
dependency, no build step, derived state imported rather than recomputed, `null`
and `unknown` kept apart, an ambiguity left as an ambiguity, and every record —
including one that says two sources disagree and this layer will not choose
between them — able to say exactly what it cannot support.
