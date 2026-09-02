# HANDOVER

**Last updated:** SESSION 09 · 2 September 2026
**Branch:** `claude/verification-existing-data-qer8u5`, carrying SESSION 08 and
SESSION 09. Cut from `origin/main` at `cef6b58`.
**Base commit:** `cef6b58` on `main` ("Merge the Legal Verifier branch (be45ee2)").
**Merged into `main` at `0ae2cda`** — with the repository owner's explicit
instruction, which is what AGENTS.md requires for any push to `main`, because a
push to `main` publishes to the live site and there is no deploy gate.
**The live site is byte-for-byte unchanged by that merge:** the diff was checked
by path first and contains no `data/*.json`, no page, and nothing under `js/`,
`css/`, `i18n/` or `fonts/`. All four validators produce output identical to
what they produced on `cef6b58`, compared file by file rather than by eye.

---

## Current milestone

**SESSION 09 — Agent 3, the Regulatory Change Detector. Complete**, with the
caveat every agent here carries: **it has never seen a real
`VerificationRecord`**, because the Verifier has never read a real document. The
*corpus* side of every comparison it makes is real; the document side is a
fixture.

The reference document is **`docs/CHANGE-DETECTOR.md`**. This file is the
handover only.

## ⚠ The brief said "Output: ChangeRecord". This agent outputs a `RegulatoryChange`.

**Read this before anything else in this file.**

`ChangeRecord` already exists in this repository and means **a change actually
made to this repository**: `files` (minimum one entry), `diff_summary`,
`branch`, `commit`, `applied_at`, `rollback_ref`. A regulation entering into
force changes no file, sits on no branch and has no commit. Holding one would
have required gutting the contract and would have made its existing rules
nonsense.

So SESSION 09 added `RegulatoryChange` as a sixteenth contract and **flagged the
conflict rather than reconciling it silently**, which is what AGENTS.md requires
where a brief and the code disagree. The two are now mutually un-confusable —
each names the other's distinguishing fields in its `forbidden` block with the
reason, and a test asserts they share no field outside the envelope.

**If "ChangeRecord" was meant literally, the rename is mechanical**: one
contract file, one registry line, one fixture, and the tests that name it. What
is not mechanical is making one contract mean both things. The full reasoning,
and the chain the two sit in, is `docs/CHANGE-DETECTOR.md` §1.

## What the session was told, and what was done

> Build the Regulatory Change Detector. Inputs: current canonical data,
> Verification Records, previous source snapshots where available. Output:
> ChangeRecord. Classify NEW · UPDATED · AMENDED · CORRECTED · DELAYED ·
> ENTERED_INTO_FORCE · APPLICABLE · REPEALED · ANNULLED · GUIDANCE_UPDATED ·
> ENFORCEMENT_UPDATED · COURT_OUTCOME · RELATIONSHIP_CHANGED · SOURCE_REPLACED.
> For every change calculate old value, new value, evidence, materiality,
> confidence, affected entities, affected datasets, affected pages, autonomy
> class. Never edit production directly. Add tests for unchanged source,
> metadata-only update, substantive date change, amendment, correction,
> contradictory source, court reversal.

All fourteen kinds are in the vocabulary and reachable from the classifier. All
nine computed values are on the contract — `evidence` and `affected entities`
through the envelope every record already carries, the other seven as declared
fields. All seven tests exist and are marked ▸ in the suite.

**Production was never edited.** `data/` is byte-identical after a full non-dry
run, asserted by sha256 over every file, by `git status --porcelain`, and by a
test that scans every module in `agent/detector/` for a write call.

## Files changed

```
agent/detector/*                                  (new — 6 modules + README, 38 tests)
agent/schemas/contracts/regulatory-change.mjs     (new — the sixteenth contract)
agent/schemas/contracts/change-record.mjs         (forbids the four fields that would confuse it)
agent/schemas/registry.mjs                        (RegulatoryChange registered)
agent/schemas/types.mjs                           (REGULATORY_CHANGE_KINDS, MATERIALITY_LEVELS)
agent/schemas/fixtures.mjs                        (regulatoryChangeFixture)
agent/schemas/selftest.mjs                        (15 new tests; fifteen → sixteen)
agent/schemas/common.mjs, export.mjs, README.md   (counts and the fourth agent)
docs/CHANGE-DETECTOR.md                           (new — the reference document)
docs/AGENT-CONTRACTS.md                           (the sixteenth, and the counts recomputed)
AGENTS.md                                         (the seventh suite, the fourth agent doc)
docs/HANDOVER.md                                  (this file)
```

**Not touched:** every `data/*.json`, every page, every file under `js/`, `css/`
and `i18n/`, all four validators in `tools/`, and every file under
`agent/scout/`, `agent/verifier/`, `agent/integrate/` and
`agent/observability/`.

## How it classifies

**A table for the six kinds that are a legal status arriving.** The status
vocabulary is closed, so the transitions are enumerable — and enumerating them
means a reviewer can read every one the detector claims to know.

**An ordered list for the eight that are about the document or the record.**
Order is the order of harm. `UPDATED` is tested **last**, because it asserts
that nothing substantive moved and filing a real change there makes it
invisible. A test asserts it is last.

**The table has holes, and a hole is the answer.** An unrecognised transition
returns no kind, and the contract requires one — so it cannot become a
`RegulatoryChange`. It becomes a `DataGap` with `absence_kind: no_rule_matched`.
Three cases are deliberately left there:

- **a court being *seised* is not a court deciding** — there is no kind among
  the fourteen for "a challenge was lodged";
- **a date that moved *earlier* is not `DELAYED`** — the word would be false;
- **a staged act is not compared against one of its stages** — choosing which
  stage a document meant is a reading of the act.

And a **deliberate non-change** is reported apart from a hole: an `applicable`
act is not un-applied by a later document restating that it entered into force.
Burying settled cases among the real holes is how the real holes stop being
read.

## The defect the fixtures caught, and it is a finding about this corpus

**`status:partly-applicable` is a taxonomy term the agent layer cannot name.**
`LEGAL_STATUS_TAXONOMY` maps seven of the twelve agent statuses onto
`data/taxonomy.json` terms; the reverse direction has holes of its own, and this
is one — and it is the state several of this corpus's most-read acts are in.

The first version fell through to the table's "no status" row and reported
`NEW`, which would have asserted the corpus had said nothing about an act it
says a great deal about. The two are now distinct inputs. **SESSION 07 found the
same gap from the other direction** — five agent statuses with no taxonomy term
— and this is its mirror. Both point at the same unresolved decision, carried
forward below.

## Tests

| Command | Result |
|---|---|
| `node --test agent/detector/selftest.mjs` | **38 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | **101 pass · 0 fail** (86 before; 15 new) |
| `node --test agent/integrate/selftest.mjs` | 61 pass · 0 fail — unchanged |
| `node --test agent/verifier/selftest.mjs` | 42 pass · 0 fail — unchanged |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail — unchanged |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | 16/16 satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches the §12 baseline exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-02` | "Nothing past its stated interval", exit 0 |

**303 tests across the seven suites, all passing** (250 before this session).

**Two cross-checks were verified to bite**, by deliberately breaking the derived
page map two ways and confirming the suite failed each time. A test that has
never been seen to fail is a test nobody knows the strength of.

## Affected pages are derived, and the derivation is checked against the docs

`docs/CURRENT-ARCHITECTURE.md` §5 tabulates which page loads which dataset.
Copying that table into the detector would have been a second home for it, so
`agent/detector/surfaces.mjs` reads the same `loadAll` / `load` call sites the
document says its table was read from — and **the suite parses §5's own table
and asserts the two agree**. A drift is a test failure rather than a silent
disagreement. One generator, and a check that fails on divergence, which is the
only shape `DATA-GOVERNANCE` §5 permits a duplicate to take.

**The shared chrome is counted apart.** `js/boot.js` starts the command palette
on every page and the palette loads seven datasets, so a naive walk makes every
page render everything and the field says nothing. The site-wide
discoverability is carried as a caveat instead.

## Known limitations

Full list in `docs/CHANGE-DETECTOR.md` §9. The four that matter most:

1. **It has never seen a real `VerificationRecord`.** Inherited from the
   egress-policy finding, unchanged since SESSION 05.
2. **A checksum says a document changed, never where.** This repository stores
   no document bodies, so a metadata-only finding cannot rule out a substantive
   change inside a document whose stated values happen to match. Every such
   record carries that as an open question.
3. **Four of the fourteen kinds are not reachable end to end.**
   `ENFORCEMENT_UPDATED`, `RELATIONSHIP_CHANGED`, `SOURCE_REPLACED` and `NEW`
   have their rules written and unit-tested, but the detector builds no
   candidates that reach them: a `VerificationRecord` carries no attribute that
   maps onto `data/enforcement.json`, `instruments.relationships` or
   `data/sources.json`, and `NEW` needs a verification about an instrument the
   Verifier could not have attached in the first place. Named rather than
   papered over.
4. **The transition table is a judgement.** A different table gives different
   kinds on the same corpus. It is in one place and every entry is readable,
   which is the most that can be said for it.

## Unresolved issues, carried forward unchanged

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping
   ground at different altitudes, uncross-checked.
4. The five operating-policy documents have not been cross-checked against
   `agent/schemas/`.
5. **106 records carry an unverified or requires-verification note. Neither this
   session nor the last moved that number, and neither was trying to.**
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no
   retention policy, concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions.
8. The `conflicting` provenance word is a sixth where the verification-protocol
   reference documents five. Carried from SESSION 07, still unreconciled.
9. **The agent-layer status vocabulary and `data/taxonomy.json` disagree in both
   directions.** Five agent statuses have no taxonomy term (SESSION 07); at
   least one taxonomy term — `status:partly-applicable` — has no agent status
   (SESSION 09). Three sessions have now left this and said so; it is a data
   decision for a session scoped for data work.
10. ~~**SESSION 08 and SESSION 09 are both unmerged.**~~ **Closed.** Merged into
    `main` at `0ae2cda` on the owner's instruction. The branch is left in place
    rather than deleted.
11. **`RegulatoryChange` versus `ChangeRecord` is settled in code and open as a
    decision.** SESSION 09's brief named `ChangeRecord` for the detector's
    output; that contract means a change made to this repository, so a
    sixteenth contract was added instead and the two now refuse each other's
    fields by name. Merging did not resolve the question — if the brief meant
    the word literally, the rename is mechanical and is described in
    `docs/CHANGE-DETECTOR.md` §1.

## Next session

**A — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and now the single blocking dependency for everything built since.
Four agents exist and none has seen a real document. `mode: mock` first, then
`mode: live` with `dry_run: true`. The chain behind it is now complete:

```
scout → verifier → integrate → a proposal in front of a human
                 → detector  → a change in front of a human
```

**B — close the loop.** `ApprovalRequest → ChangeRecord → an applied edit`. The
half that is missing is the one that writes, and it is the only code in this
repository that would ever touch `data/` on an agent's initiative. What is
genuinely needed is not the write — it is the record that a human applied one,
so the next run does not propose it again.

**C — the status vocabulary decision** (unresolved issue 9). It now has evidence
from both directions and two agents blocked on it.

### Exact next objective

**A.** Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true`,
confirm the workflow's mechanics on a real GitHub-hosted runner, then decide
with the repository owner whether to proceed to a live dispatch. If a live
retrieval succeeds, the follow-on is now three steps:

```
node agent/verifier/cli.mjs  --records <trace-id>
node agent/integrate/cli.mjs --records <trace-id> --as-of <date>
node agent/detector/cli.mjs  --records <trace-id> --as-of <date>
```

## Anything the next agent must know

- **`agent/detector/` never writes anything**, and neither does
  `agent/integrate/`. Both suites fail if any module in their directory contains
  a write call.
- **`asOf` is an argument, everywhere.** The Detector and the Integrator both
  throw without it, and both CLIs refuse the live path without `--as-of`. A test
  strips comments from every judging module and asserts none reads a clock.
- **An unclassified transition is a correct answer**, as are an ambiguity, a gap
  and a conflict. A future session that "improves" the detector by making it
  decide more often has damaged it, in the way `VERIFICATION-POLICY` §6
  describes for the unverified-record count.
- **`UPDATED` is tested last on purpose.** Moving it earlier would let a
  substantive change fall into the kind that says nothing substantive moved.
- **Materiality is a judgement, not a lookup on the change kind**, and it is
  never multiplied by confidence. They answer different questions, and one
  number hides the high-harm, low-certainty findings.
- **The page map is derived and cross-checked against
  `docs/CURRENT-ARCHITECTURE.md` §5.** If you change which datasets a page
  loads, update §5 in the same commit or the suite will tell you.
- Before declaring anything done: the seven `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline.

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
- Do not add a validation bypass to `agent/schemas/validate.mjs`.
- Do not add a field for a substitute value to `DataGap` or anywhere else.
- Do not resurrect the retired Scouts from their old branches.
- Do not let `agent/scout/schedule/` write to anything but
  `agent/scout/digests/*.{json,md}`.
- Do not store `outcome_class`, `tier`, `grade` or `binding` on a
  `VerificationRecord`; do not merge `entry_into_force_date` and
  `applicability_date`; do not teach `dates.mjs` the twentieth-day formula; do
  not add a ranking or tie-break to `agent/verifier/conflict.mjs`; do not raise
  the Verifier's confidence ceiling above 0.9.
- Do not add a write path to `agent/integrate/` or a bypass to either of its
  gates; do not let it resolve a conflict, pick a winner from an ambiguity,
  strengthen a `supports` qualifier, set `last_verified`, or draft claim text.
- Do not reimplement `evidenceGrade`, `familyOf`, `compareValues`,
  `normaliseUrl`, `normaliseTitle` or `sameDate`. All are imported from the
  module that owns them.
- Do not re-add the audit body of `tools/freshness.mjs` outside its `isMain`
  guard.

Added by this session:

- **Do not make `RegulatoryChange` and `ChangeRecord` interchangeable.** One is a
  change in the world, the other a change to this repository. They refuse each
  other's fields by name and a test asserts they share none outside the
  envelope.
- **Do not give `classify` a default.** An unrecognised transition is a gap. A
  fallback to the nearest kind would report a state change nobody established,
  in a corpus about what EU law requires of people.
- **Do not move `UPDATED` earlier in the ordered rules.**
- **Do not add `→ under_judicial_review` to the transition table as
  `COURT_OUTCOME`.** A court being asked is not a court deciding.
- **Do not widen `DELAYED` to cover a date that moved earlier.**
- **Do not let `dayOrdinal` parse a month-precision date.** Ordering one against
  a day-precision date means widening one of them, and `date_precision` exists
  because that distinction is load-bearing.
- **Do not make materiality a lookup on `change_kind`**, and do not multiply it
  by confidence.
- **Do not let `bytes_changed` be `false` where there was nothing to compare.**
  An absence of comparison is not a finding of no change.
- **Do not hand-write the page map**, and do not fold the chrome's datasets into
  a page's own.
- **Do not report a status the vocabulary cannot name as "the corpus has no
  record".**

---

## What must NOT be rebuilt

Unchanged since SESSION 00: **the architecture is not technical debt, it is the
argument.** Nothing in `js/`, `css/`, `data/`, `i18n/`, `tools/`, the seven
pages, or any previously built agent was touched by this session.

Agent 3 was built to the same standard as everything it wraps: no dependency, no
build step, derived state imported rather than recomputed, `null` and `unknown`
kept apart, a table that reports its own holes, and every record — including one
that says two regulators disagree and this agent will not treat that as a
change — able to say exactly what it cannot support.
