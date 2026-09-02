# HANDOVER

**Last updated:** SESSION 07 · 2 September 2026
**Branch:** `claude/eu-digital-policy-audit-y0n89z`, cut from `origin/main` at `2752c78`.
**Base commit:** `2752c78` on `main` ("Fix the digest artifact glob catching README.md").

> **The branch name says "audit" and this session did not perform one.** The session prompt
> carried a large read-only audit brief above a SESSION 07 build brief, and the two are
> incompatible. The build brief was taken as the live instruction: `git log` shows SESSION 06
> (the Source Scout and its schedule) already merged into `main`, so "SESSION 07 — Build Agent
> 2: Legal Verifier" is the next objective in sequence and the audit text is boilerplate
> carried down from an earlier session. **This is a judgement call and it is flagged here
> rather than buried.** If an audit was actually wanted, nothing in this branch is in the way:
> it adds `agent/verifier/` and extends one contract, and touches no page, dataset, style or
> validator.

---

## Current milestone

**SESSION 07 — Agent 2, the Legal Verifier. Complete**, with the same honest caveat every
agent in this repository carries: **it has never read a real document.** Every registered
endpoint is refused by this environment's egress policy, so the Verifier has only ever run
against the adversarial corpus this session wrote for it.

The reference document is **`docs/LEGAL-VERIFIER.md`**. This file is the handover only.

## Work performed

Built `agent/verifier/` — Agent 2. Input `SourceCandidate`, output `VerificationRecord`.

1. **`decompose.mjs`** — source material into discrete propositions, with materiality stated
   as a rule and immaterial sentences counted with their reason rather than dropped.
2. **`statuses.mjs`** — the twelve legal statuses from signal phrases, each carrying the exact
   phrase it matched. The lifecycle stages are treated as cumulative; two statuses off that
   lifecycle are a real ambiguity and yield null.
3. **`dates.mjs`** — publication, entry into force and application, read separately and
   returned exactly as printed. Refuses to compute a date from the twentieth-day formula, and
   refuses to pick one of two staged application dates.
4. **`locate.mjs`** — article, paragraph and page, or the recorded admission that nothing
   governs the passage.
5. **`judge.mjs`** — the ordered verdict test, most damaging error checked first.
6. **`conflict.mjs`** — disagreement between two authoritative sources, found and never
   resolved. Keeps apart a genuine conflict, a lower tier outranked by a higher, and two
   precisions of one date.
7. **`doctype.mjs`** — the document's own self-description to a `source_type`, or null.
8. **`outcome.mjs`** — the three outcome classes, the protocol word, and the confidence
   formula. All derived; none stored.
9. **`build.mjs`** — a record builder whose fields and epistemic block cannot drift apart.
10. **`verifier.mjs`**, **`cli.mjs`**, **`fixtures.mjs`** (eleven adversarial cases),
    **`selftest.mjs`** (42 tests), **`README.md`**.

And extended one contract, with its tests — see "Contract changes" below.

## Files changed

```
agent/verifier/*                                 (new — 11 modules + README, 42 tests)
agent/schemas/types.mjs                          (LEGAL_STATUSES + mapping; "conflict" verdict)
agent/schemas/contracts/verification-record.mjs  (9 new fields, 6 new rules, 3 new forbidden)
agent/schemas/fixtures.mjs                       (VerificationRecord fixture updated; simEvidence exported)
agent/schemas/selftest.mjs                       (6 new tests; one existing case adjusted — see below)
docs/LEGAL-VERIFIER.md                           (new — the reference document)
docs/AGENT-RUNBOOK.md                            (one addendum to §7)
docs/HANDOVER.md                                 (this file)
```

**Not touched:** every file under `agent/scout/`, every file under `agent/observability/`,
every `data/*.json`, every page, style, `js/` module, `i18n/` file and `tools/` validator.
Confirmed by `git status --porcelain` and, structurally, by the Verifier's own suite hashing
the whole of `data/` around a full run.

## Contract changes this agent forced

The brief requires fifteen things recorded per proposition. Six had a home on
`VerificationRecord`; **nine did not**, and each was added to the contract with its tests
rather than routed around — the course SESSION 05 took for the Scout, recorded the same way in
`docs/SOURCE-SCOUT.md`.

Added: `legal_status`, `publication_date`, `entry_into_force_date`, `applicability_date`,
`document_id`, `source_tier`, `supporting_location`, `conflicting_evidence`, `confidence`.
Plus `conflict` in `VERIFICATION_VERDICTS`, six new cross-field rules, two existing rules
extended to cover the new verdict, and four new `forbidden` entries (`outcome_class`, `tier`,
`grade`, `binding`).

**This is a Class C change to the contract layer and it is flagged as one.** The full
reasoning, including why the fields are flat rather than nested and which one was deliberately
*not* added, is in `docs/LEGAL-VERIFIER.md`, "Contract changes this agent forced".

**`CONTRACT_SCHEMA_VERSION` was deliberately NOT bumped**, following SESSION 05's precedent —
the constant is global across all fourteen contracts and bumping it would invalidate every
fixture and every stored record in the repository. The consequence is real and worth naming: a
`VerificationRecord` written before this session would now fail validation. Nothing in the
repository is broken by that, because contract records live in git-ignored `agent/records/`
and are regenerable run artifacts. **The contract layer has no per-contract versioning, and
this session did not add one.**

**One existing test was adjusted, not weakened.** `agent/schemas/selftest.mjs`, case `c` of
"VerificationRecord: a verdict is gated on what the evidence can carry": the enriched fixture
now carries an open question of its own, so the case clears `epistemic.unresolved` to still
exercise the rule it was written for — an unsettled verdict with *no* open question. The
rule and the assertion are unchanged.

## Tests

Run in this session, from the repository root:

| Command | Result |
|---|---|
| `node --test agent/verifier/selftest.mjs` | **42 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | **73 pass · 0 fail** (67 before; 6 new) |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged, confirms Agent 1 was not touched |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail — unchanged |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | 14/14 satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 106 unverified records** — matches the §12 baseline exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs` | reports only, "nothing past its stated interval", exit 0 |

**176 tests across the five suites, all passing** (128 before this session).

**`data/` was verified untouched in both directions:** a full non-dry run
(`node agent/verifier/cli.mjs --mock`) left every `data/*.json` byte-identical by sha256, and
`git status --porcelain` shows no dataset modified. A test asserts the same thing by hashing
the directory around a run, and a second scans every module in `agent/verifier/` for
`writeFileSync`, `appendFileSync`, `createWriteStream`, `rmSync`, `unlinkSync` and `mkdirSync`.

**The adversarial corpus was exercised end to end.** A `--mock` run produces 23 verifications
over 21 propositions from 11 documents: 8 confirmed, 11 partially confirmed, 2 not
determinable, 1 source unavailable, 1 conflict — and one candidate refused at intake for
being this agent's own.

## Four defects the tests found, and what they were

Recorded because the next session should know the suite earns its keep:

1. **A repeal attached to the wrong act.** A proposition stating a status but naming no
   instrument was being related to whatever instrument the document mentioned elsewhere, so a
   regulation repealing a predecessor *while amending the DSA* reported the DSA repealed. Now
   no instrument is attached and the unresolved subject is recorded.
2. **Silent truncation.** `max_candidates` dropped the thirteenth fixture without a word — and
   that fixture was the self-verification refusal case, so the refusal never fired and nothing
   said so. Dropped candidates are now counted, named, and carried into the run record's open
   questions.
3. **Four identical conflict records** for one disagreement, because each document states its
   date in several propositions. Deduplicated on the instrument, the attribute and the two
   documents — never on the values.
4. **Nulls set without being declared** on the unreachable-document and conflict records,
   which the contract permits but the project's own discipline does not.

## Observability

Every step is a span — `verifier.intake`, `verifier.retrieve`, `verifier.decompose`,
`verifier.proposition`, `verifier.crosscheck`. Every verdict is a `decision` event carrying
the verdicts *not* chosen and why. Every document read leaves a `provenance` event with the
verification block. `agent/observability/cli.mjs show <trace-id>` renders a Verifier run
exactly as it does a Scout run; no second logging path was added.

## Known limitations

Stated in full in `docs/LEGAL-VERIFIER.md`, "Known limitations". The four that matter most:

1. **It has never read a real document.** Everything below the contract layer is verified
   against a corpus this session wrote. Inherited from the egress-policy finding, unchanged.
2. **Decomposition is sentence-level pattern matching, and status detection is English-only
   signal phrases.** Neither parses legal language. A document in French or German yields no
   status and an open question — correct behaviour, and a large coverage gap for a corpus
   about EU law.
3. **The verdict ordering is a judgement about which error is worst**, not a derivation from
   anything. It is in one place and testable; a different ordering would give different
   verdicts on the same document.
4. **No `ApprovalRequest` is emitted.** A verification is Class C and a human gate belongs in
   front of it. This session built the checking half of `AGENT-ROLES.md` §2, not the gate.

## Unresolved issues, carried forward unchanged

None of these was touched by this session:

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline `window.__CONTENT__`
   blob has already drifted from it.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping ground at different
   altitudes, uncross-checked.
4. The five operating-policy documents have not been cross-checked against `agent/schemas/`.
5. 106 records carry an unverified or requires-verification note. **This session did not move
   that number and was not trying to** — it built the agent that could eventually help, and
   that agent has read nothing real.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no retention policy,
   concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions (SESSION 06's
   objective A, not attempted here).

## Next session

Three candidates, in the order that unblocks the most:

**A — dispatch the Source Scout workflow on a real runner** (SESSION 06's unfinished objective
A, unchanged and now more valuable): `mode: mock` first, then `mode: live` with
`dry_run: true`. **Everything downstream is still blocked on a real retrieval ever
succeeding** — including this session's Verifier, which now exists and has nothing real to
read. This remains the single highest-leverage next step.

**B — decide whether the five unmapped legal statuses belong in `data/taxonomy.json`.**
`corrected`, `annulled`, `under_judicial_review`, `guidance` and `non_binding_commentary` are
distinctions the Verifier draws and the site's vocabulary does not carry. That is a deliberate,
reviewed data change under `docs/DATA-GOVERNANCE.md` in a session scoped for data work — not
something to retrofit from the agent layer, which is why this session left the mapping null
and said so.

**C — the human approval gate.** `ApprovalRequest` in front of anything that would act on a
`VerificationRecord`. The observability layer already renders a pending approval; nothing
currently requests one.

### Exact next objective

**A.** Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true`, confirm the
workflow's mechanics on a real GitHub-hosted runner, then decide with the repository owner
whether to proceed to a live dispatch. If a live retrieval succeeds, the immediate follow-on
is `node agent/verifier/cli.mjs --records <trace-id>` — the first time either agent will have
seen a real document.

## Anything the next agent must know

- **`agent/verifier/` never writes anything.** It stores through `agent/scout/store.mjs` and
  its own suite fails if any module in the directory contains a write call. If a task seems to
  need one, that is a different change with its own review path.
- **The six verdicts are not a quality scale.** `not_determinable` and `conflict` are correct
  answers. A future session that "improves" the Verifier by reducing how often it returns them
  has damaged it, in exactly the way `docs/VERIFICATION-POLICY.md` §6 describes for the
  unverified-record count.
- **The tense rule in `statuses.mjs` is load-bearing.** "Shall apply from" deliberately
  produces no applicability signal. Adding one would make the Verifier report acts as
  applicable years before they are, which is the most consequential error available here.
- **Nothing in the judging path may read a clock.** A test asserts it, with comments stripped
  so the files can go on discussing clocks at length.
- **The `conflicting` provenance word is a sixth**, where
  `.agents/skills/legal-source-verification/references/verification-protocol.md` documents
  five. That reference is skill-layer material and was deliberately not edited from a session
  scoped to build an agent. A later session owns reconciling it.
- Before declaring anything done: the five `--test` suites above, then the four validators in
  `tools/`, compared against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no dependency, no service
  worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.
- Do not modify `data/*.json` in a session not scoped for data work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- Do not change the id shapes in `agent/observability/ids.mjs`; do not move redaction to the
  read path.
- Do not commit anything under `agent/records/` or `agent/observability/runs/`.
- Do not add a validation bypass to `agent/schemas/validate.mjs`. No `skip`, no `force`, no
  `strict: false`.
- Do not add a field for a substitute value to `DataGap` or anywhere else.
- Do not resurrect the retired Scouts from their old branches.
- Do not let `agent/scout/schedule/` write to anything but `agent/scout/digests/*.{json,md}`.
- Do not write a report-layer annotation back into a `SourceCandidate` or `DataGap`.
- Do not gitignore `agent/scout/digests/`.

Added by this session:

- **Do not store `outcome_class`, `tier`, `grade` or `binding` on a `VerificationRecord`.**
  All four are `forbidden` with the reason on the contract. The first three are derived; the
  fourth is not a boolean an agent sets — a guidance document does not become law because a
  field said `true`.
- **Do not merge `entry_into_force_date` and `applicability_date`**, and do not let either
  become the other's default. The protocol reference records a field in this repository that
  has already made exactly that mistake.
- **Do not teach `dates.mjs` to compute the twentieth-day date.** The refusal is the feature.
  A computed date presented as a read one is a fabricated legal fact.
- **Do not add a ranking, a tie-break or a "most recent wins" to `conflict.mjs`.** Each of
  those is a rule about which regulator to believe, and `AGENT-ROLES.md` reserves it to a
  human.
- **Do not raise the confidence ceiling above 0.9.** A rule-based verifier reading signal
  phrases has not read the document the way a lawyer would.
- **Do not remove the self-verification refusal at intake**, and do not let the Verifier write
  `state: "accepted"` onto a `SourceCandidate`.

---

## What must NOT be rebuilt

Unchanged since SESSION 00: **the architecture is not technical debt, it is the argument.**
Nothing in `js/`, `css/`, `data/`, `i18n/`, `tools/`, the seven pages,
`agent/observability/`, or Agent 1's own files was touched by this session.

Agent 2 was built to the same standard as everything it wraps: no dependency, no build step,
derived state never stored twice, `null` and `unknown` kept apart, and every record — including
one that says two regulators disagree and this agent will not choose between them — able to
say exactly what it cannot support.
