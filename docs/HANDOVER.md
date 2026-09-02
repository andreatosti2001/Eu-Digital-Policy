# HANDOVER

**Last updated:** SESSION 11 · 2 September 2026
**Branch:** `claude/build-data-depth-agent-sjjfcr`, cut from `main` at `d1044a7`.
**Base commit:** `d1044a7` on `main` ("Record in the handover that SESSION 10 is merged").
**Merged into `main` at `95173b4`** — with the repository owner's explicit
instruction, which is what AGENTS.md requires for any push to `main`, because a
push to `main` publishes to the live site and there is no deploy gate. The branch
is left in place rather than deleted.

**A note for the next session, because the same trap caught this one too.** The
local `main` in this container was **34 commits behind** `origin/main` — it sat at
`7248290`, a bulk upload from before SESSION 00. Merging into it would have
silently reverted seven sessions of work. SESSION 10 left this warning and it was
still needed. `git fetch --all && git branch -a` before concluding anything, and
check `git log origin/main..main` **and** `main..origin/main` before merging into
a local branch you did not just create.

**The live site is byte-for-byte unchanged by this work**, and this was checked
rather than asserted: the incoming diff contains nothing under `data/`, no
`*.html`, and nothing under `js/`, `css/`, `i18n/`, `fonts/` or `tools/`; the
Data Depth Agent's own suite hashes the whole of `data/` before and after a full
run against the real corpus and asserts it is byte-identical; and all four
validators produce output matching the `docs/CURRENT-ARCHITECTURE.md` §12
baseline exactly — 0 errors, 106 unverified, the same five `design-qa` warnings
by file and line.

**Everything worked before the session started, and it was checked first:** 339
tests across seven suites, 17/17 contracts satisfiable, and all four validators
at the §12 baseline.

---

## Current milestone

**SESSION 11 — Agent 4, the Data Depth Agent. Complete**, with the caveat every
agent here still carries: **none of them has ever seen a real document.** This
agent is the first whose *entire* input is the real corpus rather than a fixture,
so that caveat bites it less than the others — but every `candidate_evidence`
entry it emits is still somewhere to look rather than something read.

The reference document is **`docs/DATA-DEPTH.md`**. This file is the handover only.

## What the session was told, and what was done

> Build the Data Depth Agent. Determine what important legal/regulatory knowledge
> is missing from the current structured representation. Look for thirteen kinds
> of gap. **Do not reward quantity. Prioritise meaningful semantic gaps.** Every
> gap must carry nine named fields. Do not directly modify canonical data.
> Instrument the analysis.

All thirteen kinds have a detector; a kind with no detector, or a detector
claiming a kind outside the vocabulary, throws at module load. All nine fields
are on the contract — eight as fields, and `affected_entity` as the envelope's
existing `affected_entities`, because a singular field beside it would be the
second home this architecture exists to prevent. `data/` was read and never
written. The analysis is instrumented end to end.

**Against the real corpus: 88 absences examined, 57 reported, 31 set aside** —
and the 31 are printed with their reasons in the CLI, on the trace, in
`agent/observability/cli.mjs depth --aside`, and in the viewer.

## Files changed

```
agent/schemas/contracts/knowledge-gap.mjs   (new — the eighteenth contract)
agent/schemas/types.mjs                     (DEPTH_GAP_KINDS, DEPTH_IMPACT_LEVELS,
                                             DEPTH_IMPACT_RANK, CANDIDATE_EVIDENCE_KINDS)
agent/schemas/{registry,fixtures}.mjs       (KnowledgeGap registered and given a fixture)
agent/schemas/{common,export}.mjs           (seventeen → eighteen, in the prose only)
agent/schemas/selftest.mjs                  (13 new tests)
agent/schemas/README.md

agent/depth/lens.mjs        (new — the corpus, indexed; the graph borrowed not rebuilt)
agent/depth/demand.mjs      (new — the load-bearing test, and what it sets aside)
agent/depth/detectors.mjs   (new — the thirteen)
agent/depth/rank.mjs        (new — autonomy and confidence, two stated tables)
agent/depth/depth.mjs       (new — Agent 4)
agent/depth/cli.mjs         (new)
agent/depth/selftest.mjs    (new — 40 tests, against the real data/)
agent/depth/README.md       (new)

agent/observability/query.mjs      (depthState, wired into loadTrace and overview)
agent/observability/cli.mjs        (the `depth` command, and --aside)
agent/observability/server.mjs     (GET /api/depth)
agent/observability/viewer/viewer.js (the Data depth panel and the overview rail)
agent/observability/selftest.mjs   (5 new tests)

docs/DATA-DEPTH.md          (new — the reference document)
docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md · docs/SKILL-MAP.md
AGENTS.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`,
`i18n/` and `fonts/`, all four validators in `tools/`, and every file under
`agent/scout/`, `agent/verifier/`, `agent/integrate/` and `agent/detector/`.

## The three things worth knowing

**1 · "Do not reward quantity" is a mechanism, not an intention.** Counting
absences is trivial and already done — `.agents/skills/data-completeness/scripts/gaps.mjs`
is the census. So a finding is reported only where a record in the corpus *leans
on* the missing concept, derived from the dependency graph
`agent/detector/graph.mjs` already builds. The contract enforces the same thing
independently, by refusing any `KnowledgeGap` whose evidence carries no
`dataset_record`. **And what is set aside is never dropped silently:** every
suppression carries its reason into the run result, the trace, the CLI and the
viewer. A run that reported 57 and dropped 31 made a judgement 31 times.

**2 · The sharpest filter is the corpus's own declaration.**
`data/taxonomy.json` defines `scope:referenced` as *"named and placed, but
outside this brief's analytical scope"*. An act the site has said it is not
analysing, modelled thinly, is the site doing what it said. Thirteen of the
thirty-one suppressions are that, and none of it is this agent's taste — the
corpus states its intent in its own enum authority and the agent reads it. It is
checked *before* demand, because such an act still accumulates references from
claims that name it in passing.

**3 · The most valuable finding is a pairing nothing else could have seen.**
`ai-act` records a maximum fine of **7% of global turnover / EUR 35 000 000** and
**no institution in the corpus holds `role:fines` over it**; `nis2` records 2% /
EUR 10 000 000 with the same hole. Both acts *are* supervised, so a detector that
asked only "does anything enforce this" would have found nothing. The fines role
is checked independently of the general case for exactly that reason, and the
finding survives because the DNA's own ceiling is the record leaning on it.

## The finding that is "the question cannot be asked"

`stale_record` is worth reading in full (`docs/DATA-DEPTH.md` §6). The obvious
detector walks the graph for a record verified earlier than something it depends
on, and produces **nineteen** findings on this corpus. Every one is an artefact:
`agent/integrate/canonical.mjs` already establishes that every dataset's
`last_verified` is a *compilation* date — 39 instrument records on one date, 84
claims on two — and `VERIFICATION-POLICY` §5 records that the field is per-record
and the practice is not.

So the detector reports **one** gap, about the field rather than about the
records, and names the nineteen as the cases where the question would have been
askable and cannot be answered. That is what refusing quantity looks like when
the quantity is available and wrong.

## The two zeros, and why they are results

`missing_instrument` and `incomplete_timeline` report nothing on this corpus, and
both are answers rather than untested branches:

- **`missing_instrument`** initially reported `src-oj-aild-withdrawal-2025` — an
  Official Journal notice *withdrawing* the AI Liability Directive, filed as an
  unmodelled act. The fix is derived rather than a title heuristic: a primary
  document is not evidence of an unmodelled act if the claims citing it are
  already about an act the corpus models. With that, the detector reports zero,
  which is correct.
- **`incomplete_timeline`**'s only candidates are the three treaty provisions,
  and the corpus has declared those `scope:referenced`.

Both are carried through the run result, the trace and the viewer, because a
reader who cannot tell *looked and found nothing* from *did not look* has been
told nothing.

## Tests

| Command | Result |
|---|---|
| `node --test agent/depth/selftest.mjs` | **40 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | **121 pass · 0 fail** (108 before) |
| `node --test agent/observability/selftest.mjs` | **22 pass · 0 fail** (17 before) |
| `node --test agent/detector/selftest.mjs` | 63 pass · 0 fail — unchanged |
| `node --test agent/integrate/selftest.mjs` | 61 pass · 0 fail — unchanged |
| `node --test agent/verifier/selftest.mjs` | 42 pass · 0 fail — unchanged |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node agent/observability/cli.mjs validate` | 0 invalid, 0 unparseable, over this session's traces |
| `node tools/validate.mjs` | **0 errors, 106 unverified** — matches the §12 baseline exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-02` | "Nothing past its stated interval", exit 0 |

**397 tests across the eight suites, all passing** (339 before this session).

## Known limitations

Full list in `docs/DATA-DEPTH.md` §12. The four that matter most:

1. **No agent here has read a real document.** Unchanged since SESSION 05, and now
   the blocking dependency for seven sessions of work. Every
   `candidate_evidence` entry this agent emits is somewhere to look.
2. **`missing_glossary_concept` produces 17 of the 57 findings** — the longest
   list, and the one most likely to read as bulk. Its threshold is derived per
   kind of record from the glossary's own lowest-covered concept, which is the
   corpus's own standard rather than a chosen number. Saying so is better than
   tuning it until the count looks right.
3. **Demand is not importance.** An act nothing points at may be the most
   important omission in the corpus; the model cannot tell. That is why every run
   prints what it set aside rather than only what it found.
4. **Nothing consumes a `KnowledgeGap` yet.** The chain still ends at a finding in
   front of a human, exactly as `ImpactAssessment` does.

## Unresolved issues, carried forward

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping
   ground at different altitudes, uncross-checked. **Partly addressed:**
   `docs/DATA-DEPTH.md` §11 reconciles the Data Depth role in §4 against the
   agent actually built — the agent occupies the analysis half of the role and
   leaves the authoring half unbuilt, and says so rather than diverging silently.
4. The five operating-policy documents have not been cross-checked against
   `agent/schemas/`.
5. **106 records carry an unverified or requires-verification note.** No session
   since SESSION 07 has moved that number, and none was trying to. SESSION 11 now
   says which of them are load-bearing: seven `claim-type:law` records rest on
   nothing external and other records are built on them.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no
   retention policy, concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions.
8. The `conflicting` provenance word is a sixth where the verification-protocol
   reference documents five. Carried from SESSION 07, still unreconciled.
9. **The agent-layer status vocabulary and `data/taxonomy.json` disagree in both
   directions.** Five agent statuses have no taxonomy term (SESSION 07);
   `status:partly-applicable` has no agent status (SESSION 09). Five sessions
   have now left this and said so.
10. **`RegulatoryChange` versus `ChangeRecord` is settled in code and open as a
    decision.** See `docs/CHANGE-DETECTOR.md` §1.
11. **Two fields in `data/` whose name says reference and whose value is prose** —
    `timeline.events[].supersedes` and `applicability.rules[].depends_on`.
12. **`GOVERNANCE_PERMITS` is empty**, and nothing in `docs/` opens it.
13. **New: `data/sources.json` has no way to say two records are one document.**
    `data/instruments.json` has a `relationships` array for exactly this problem;
    sources have nothing equivalent, and the corpus currently holds
    `src-eurlex-ai-omnibus` and `src-eli-ai-omnibus-2026-1744` as two records for
    one act. Reported as the one gap on this corpus whose recommended home does
    not exist in the schema. A data decision, not an agent-layer one.
14. **New: the taxonomy declares four `instrument_kind` terms no record uses** —
    `kind:delegated-regulation`, `kind:implementing-decision`,
    `kind:code-of-practice` and `kind:report` — and two `event_type` terms,
    `event:compliance-deadline` and `event:implementing-act`. The model has a
    place for subordinate acts and nothing occupies it, while
    `src-eurlex-dsa-da-2050` records one as a source. A data decision.

## Next session

**A — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and now the blocking dependency for everything built since. Six
sessions of agent work exist and none has read a real document. `mode: mock`
first, then `mode: live` with `dry_run: true`.

**B — close the loop.** `ImpactAssessment`/`KnowledgeGap` → `DataProposal` →
`ApprovalRequest` → an applied edit. The half that is missing is the one that
writes, and it is the only code in this repository that would ever touch `data/`
on an agent's initiative. What is genuinely needed is not the write — it is the
record that a human applied one, so the next run does not propose it again.

**C — the data decisions this session surfaced.** Issues 13 and 14 above, plus
issue 9. All three are now backed by evidence from more than one direction, and
all three are decisions for the repository owner rather than for an agent.

### Exact next objective

**A.** Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true`,
confirm the workflow's mechanics on a real GitHub-hosted runner, then decide with
the repository owner whether to proceed to a live dispatch. If a live retrieval
succeeds, the follow-on is:

```
node agent/verifier/cli.mjs  --records <trace-id>
node agent/integrate/cli.mjs --records <trace-id> --as-of <date>
node agent/detector/cli.mjs  --records <trace-id> --as-of <date>
node agent/depth/cli.mjs     --as-of <date> --changes <trace-id>
node agent/observability/cli.mjs impact --trace <trace-id> --graph
node agent/observability/cli.mjs depth  --trace <trace-id> --aside
```

## Anything the next agent must know

- **`agent/depth/` never writes anything**, and the suite scans every module in it
  for a write call as well as hashing `data/` around a full run.
- **`asOf` is an argument, everywhere.** Unchanged.
- **A finding with no demand is not censored — it is a census entry.** If you find
  yourself inventing demand for a finding so that it will be reported, the finding
  belongs in `gaps.mjs`, not here.
- **A suppression without a reason is a test failure**, both in
  `agent/depth/selftest.mjs` and as a reported gap in the observability view.
- **A detector that finds nothing must still appear** in the run result, the trace
  and the viewer. Removing it because it reports zero destroys the distinction
  between *looked and found nothing* and *did not look*.
- **A change record may never create a gap or raise one's impact.** A change is
  not an absence, and the suite asserts it.
- **`CO_CITATION_FLOOR` is the only tuned number in `detectors.mjs`.** It is
  exported and the suite asserts it, so changing it is a visible decision.
- **The glossary threshold is per kind of record and derived from the glossary.**
  A single floor across kinds would report every mid-sized instrument against a
  standard set for articles.
- Before declaring anything done: the eight `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.
- Do not modify `data/*.json` in a session not scoped for data work. **The 57
  gaps this session reported are questions, not a work order** — closing any of
  them means writing a legal fact, and 36 of the 57 are `human_only`.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- Do not change the id shapes in `agent/observability/ids.mjs`; do not move
  redaction to the read path, and do not raise `MAX_STRING` to fit a payload.
- **Do not add an entry to `GOVERNANCE_PERMITS`** without the repository owner
  naming the document that grants it.
- **Do not add a `KnowledgeGap` field for the missing value**, under any of the
  six names the contract forbids, and do not relax the rule that a gap is never
  `autonomous`. Closing a knowledge gap writes a legal fact.
