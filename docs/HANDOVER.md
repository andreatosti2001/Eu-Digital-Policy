# HANDOVER

**Last updated:** SESSION 10 · 2 September 2026
**Branch:** `claude/regulatory-impact-mapping-ydbg4a`, cut from `main` at `aca6d46`.
**Base commit:** `aca6d46` on `main` ("Record in the handover that SESSIONS 08 and 09 are
merged").
**Merged into `main` at `e4672d9`** — with the repository owner's explicit
instruction, which is what AGENTS.md requires for any push to `main`, because a
push to `main` publishes to the live site and there is no deploy gate. The branch
is left in place rather than deleted.

**The live site is byte-for-byte unchanged by that merge**, and this was checked
three ways rather than asserted: the incoming diff was listed by path and
contains nothing under `data/`, no `*.html`, and nothing under `js/`, `css/`,
`i18n/`, `fonts/` or `tools/`; every published file was sha256'd at `aca6d46`
and again at the merge commit and every hash matches; and the Detector was run in
full against the real corpus with `data/` hashed identically before and after.
All four validators produce output identical to what they produced on `aca6d46`.

**A note for the next session, because it nearly bit here.** The local `main` in
this container was 27 commits behind `origin/main` — it sat at `4bd1f0d`, a
merge from before SESSION 03. Merging into it would have silently reverted six
sessions of work. `git fetch --all && git branch -a` before concluding anything,
as AGENTS.md says, and check `git log origin/main..main` **and** `main..origin/main`
before merging into a local branch you did not just create.

---

## Current milestone

**SESSION 10 — regulatory impact mapping. Complete**, with the caveat every agent
here still carries: **none of them has ever seen a real `VerificationRecord`**,
because the Verifier has never read a real document. The *corpus* side of every
comparison is real; the document side is a fixture.

The reference document is **`docs/REGULATORY-IMPACT-MAPPING.md`**. This file is
the handover only.

## What the session was told, and what was done

> Extend the Change Detector so that it understands the existing website. For
> every confirmed change identify: affected JSON dataset · affected instrument ·
> affected timeline · affected compliance calendar · affected comparison views ·
> affected applicability logic · affected evidence displays · affected glossary
> relationships · potentially stale analytical pages. Separate FACTUAL IMPACT
> from EDITORIAL IMPACT. A factual impact may become automatically actionable.
> An editorial impact must become a review proposal unless governance explicitly
> permits otherwise. Generate a dependency/impact graph and expose it through
> observability. Do not modify production.

All nine surfaces are computed, and a test asserts all nine are reachable against
the real corpus. The split is a shape the contract polices, not a label. The
graph is derived from the corpus. Production was not touched.

**Everything worked before the session started, and it was checked first:** 303
tests across seven suites, 16/16 contracts satisfiable, and all four validators
matching the `docs/CURRENT-ARCHITECTURE.md` §12 baseline exactly — 0 errors, 106
unverified, the same five `design-qa` warnings by file and line.

## Files changed

```
agent/detector/graph.mjs                        (new — the corpus dependency graph)
agent/detector/fields.mjs                       (new — factual vs editorial, per field)
agent/detector/impact.mjs                       (new — the nine surfaces, the split, the gate)
agent/schemas/contracts/impact-assessment.mjs   (new — the seventeenth contract)
agent/detector/detector.mjs                     (a detector.impact span per confirmed change)
agent/detector/surfaces.mjs                     (pageToModules added; nothing existing changed)
agent/detector/fixtures.mjs                     (one case whose old value the corpus restates in prose)
agent/detector/cli.mjs                          (--depth, and the IMPACT section of the report)
agent/detector/selftest.mjs                     (25 new tests)
agent/observability/query.mjs                   (impactState, and the overview rail)
agent/observability/server.mjs                  (GET /api/impact)
agent/observability/cli.mjs                     (the `impact` command)
agent/observability/viewer/viewer.js            (the Regulatory impact panel and rail)
agent/observability/selftest.mjs                (4 new tests)
agent/schemas/{registry,fixtures,common,export}.mjs, selftest.mjs, README.md
docs/REGULATORY-IMPACT-MAPPING.md               (new — the reference document)
docs/CHANGE-DETECTOR.md · docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md
AGENTS.md · agent/detector/README.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`,
`i18n/` and `fonts/`, all four validators in `tools/`, and every file under
`agent/scout/`, `agent/verifier/` and `agent/integrate/`.

## The three things worth knowing

**1 · The graph is derived, and that is the whole point.** A table of "which
field references what" is the second home this architecture exists to prevent —
it goes stale the first time a dataset grows a field, silently, and a silently
incomplete impact map is worse than none because it reads as coverage. The rule
instead is: *a string that is the id of a record is an edge to that record;
everything else is a value.* 651 records, 3070 references, 0 id collisions.

**2 · The factual/editorial line is about what can be proved wrong.**
`AGENTS.md` already states the second half: *"The validators do not read prose.
A false statement in `index.html` passes every check in this repository."* So a
date is factual and the sentence beside it is editorial, and the consequence the
brief attaches to the split — one may be actionable, the other must go to a
human — is a rule on the contract rather than a note.

**3 · The most useful factual answer is usually "there is nothing to do."** This
site derives at render time. Correct a timeline date and the calendar, the status
strips and the pipeline stages are already right. On the fixture run **225 of 260
factual impacts need no edit anywhere**, and saying so is worth more than a list
of files: the alternative is a reviewer hand-checking views that cannot be wrong.

## The two defects the real corpus caught, and both are findings about the data

**`timeline.events[].supersedes` holds a sentence, not an id.** *"Originally 2
August 2027; deferred by the AI Omnibus."* So the one field in
`data/timeline.json` that records that a date **moved** is prose nothing checks —
which is exactly what a `DELAYED` change has to leave correct. Registered as
prose, with the finding written into the register.

**`applicability.rules[].depends_on` holds a sentence too**, despite a name that
reads like a reference. Same treatment.

Also worth a later session's attention: four of the eleven DNA dimensions
(`objective`, `risk_logic`, `enforcement_mechanism`, `implementation_model`) are
sentences rather than taxonomy terms, and `instruments.html` renders them side by
side as though they were comparable categories.

## The false positive that shaped the editorial half

`status:applicable` is labelled **"Applicable"**. Searching prose for that label
found *"The DMA becomes applicable."* and *"Directly applicable"* — sentences
about a different act, in which the word is doing ordinary work. Reported as
findings they are false, and a review list with false entries in it is a review
list nobody finishes.

The test is derived rather than guessed: **does the label appear in prose on
records that do not carry the term?** If it does, a string match cannot tell the
term from the word. Such matches do not vanish — they move to `open_questions`
**with the sentence attached**, which is the honest shape.

## The cap that produced a confident zero

`agent/observability/redact.mjs` caps a stored string at 8000 characters — *"a
trace field is evidence, not a payload dump"*. The first version of this work
inlined the whole subgraph, the store truncated it mid-JSON, and the viewer showed
**a graph of zero nodes for a change that reached 175 records.**

The cap is right and was respected rather than routed around. The trace now
carries the shape and the identity — roots, per-depth counts, direct dependencies
in full, `dropped_nodes`, `dropped_edges`, and a `sha256` over the whole subgraph
— and the counts describe the whole graph, never the preview. There is a test
named for the failure.

## Tests

| Command | Result |
|---|---|
| `node --test agent/detector/selftest.mjs` | **63 pass · 0 fail** (38 before) |
| `node --test agent/schemas/selftest.mjs` | **108 pass · 0 fail** (101 before) |
| `node --test agent/observability/selftest.mjs` | **17 pass · 0 fail** (13 before) |
| `node --test agent/integrate/selftest.mjs` | 61 pass · 0 fail — unchanged |
| `node --test agent/verifier/selftest.mjs` | 42 pass · 0 fail — unchanged |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | **17/17** satisfiable, exit 0 |
| `node agent/observability/cli.mjs validate` | 0 invalid, 0 unparseable, over the traces this session's runs wrote |
| `node tools/validate.mjs` | **0 errors, 106 unverified** — matches the §12 baseline exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-02` | "Nothing past its stated interval", exit 0 |

**339 tests across the seven suites, all passing** (303 before this session).

## Known limitations

Full list in `docs/REGULATORY-IMPACT-MAPPING.md` §10. The four that matter most:

1. **No agent here has seen a real `VerificationRecord`.** Unchanged since
   SESSION 05, and now the blocking dependency for six sessions of work.
2. **Editorial findings are the ones that could be QUOTED, never the ones that
   exist.** A sentence that paraphrases the value that moved without stating it is
   invisible, and every assessment carries that as an open question rather than
   implying coverage.
3. **`MODULE_SURFACE` is a judgement.** A different assignment gives different
   surfaces on the same corpus. It is in one place, every entry has a reason, and
   the suite asserts it names every module in `js/` exactly once.
4. **Nothing consumes an `ImpactAssessment` yet.** The chain still ends at a
   finding in front of a human.

## Unresolved issues, carried forward

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it. The impact map reports
   this as a caveat on every analytical-page finding rather than pretending to
   know which of the two homes a stale sentence lives in.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping
   ground at different altitudes, uncross-checked.
4. The five operating-policy documents have not been cross-checked against
   `agent/schemas/`.
5. **106 records carry an unverified or requires-verification note.** No session
   since SESSION 07 has moved that number, and none was trying to.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no
   retention policy, concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions.
8. The `conflicting` provenance word is a sixth where the verification-protocol
   reference documents five. Carried from SESSION 07, still unreconciled.
9. **The agent-layer status vocabulary and `data/taxonomy.json` disagree in both
   directions.** Five agent statuses have no taxonomy term (SESSION 07);
   `status:partly-applicable` has no agent status (SESSION 09). Four sessions
   have now left this and said so; it is a data decision for a session scoped for
   data work.
10. **`RegulatoryChange` versus `ChangeRecord` is settled in code and open as a
    decision.** See `docs/CHANGE-DETECTOR.md` §1. SESSION 10 did not reopen it.
11. **New: two fields in `data/` whose name says reference and whose value is
    prose** — `timeline.events[].supersedes` and
    `applicability.rules[].depends_on`. Both are registered as prose and both are
    a data decision, not an agent-layer one.
12. **New: `GOVERNANCE_PERMITS` is empty.** The brief's "unless governance
    explicitly permits otherwise" is implemented as a mechanism that is currently
    closed, and nothing in `docs/` opens it. Whether anything ever should is a
    decision for the repository owner, not for an agent.

## Next session

**A — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and now the single blocking dependency for everything built since.
Five sessions of agent work exist and none has read a real document. `mode: mock`
first, then `mode: live` with `dry_run: true`.

**B — close the loop.** `ImpactAssessment → DataProposal → ApprovalRequest → an
applied edit`. The half that is missing is the one that writes, and it is the only
code in this repository that would ever touch `data/` on an agent's initiative.
What is genuinely needed is not the write — it is the record that a human applied
one, so the next run does not propose it again. The impact map now makes the
*shape* of that proposal derivable: it says which impacts need a human at all
(35 of 260 on the largest fixture change, all of them provenance fields) and
which fields they are.

**C — the status vocabulary decision** (unresolved issue 9). It now has evidence
from three directions.

### Exact next objective

**A.** Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true`,
confirm the workflow's mechanics on a real GitHub-hosted runner, then decide with
the repository owner whether to proceed to a live dispatch. If a live retrieval
succeeds, the follow-on is:

```
node agent/verifier/cli.mjs  --records <trace-id>
node agent/integrate/cli.mjs --records <trace-id> --as-of <date>
node agent/detector/cli.mjs  --records <trace-id> --as-of <date>
node agent/observability/cli.mjs impact --trace <trace-id> --graph
```

## Anything the next agent must know

- **`agent/detector/` never writes anything**, and the suite now scans
  `graph.mjs`, `fields.mjs` and `impact.mjs` for a write call as well.
- **`asOf` is an argument, everywhere.** Unchanged.
- **An unclassified transition is a correct answer**, and so is an unquotable
  sentence. A future session that "improves" the impact map by asserting staleness
  it cannot quote has damaged it.
- **An unclassified FIELD is a test failure, not a default.** If a dataset grows a
  field, `agent/detector/fields.mjs` must classify it or
  `agent/detector/selftest.mjs` fails. It defaults to editorial — the safe half —
  but the default is not the answer.
- **The counts on an impact graph describe the whole graph, never the preview.**
  If you change how the preview is bounded, keep that true.
- **`MODULE_SURFACE` must name every module in `js/` exactly once.** Add a view
  and the suite will tell you.
- **The page map is derived and cross-checked against
  `docs/CURRENT-ARCHITECTURE.md` §5.** Unchanged; `pageToModules` was added
  alongside it without touching the §5 cross-check.
- Before declaring anything done: the seven `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the §12 baseline.

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
  redaction to the read path, and do not raise `MAX_STRING` to fit a payload.
- **Do not add an entry to `GOVERNANCE_PERMITS`** without the repository owner
  naming the document that grants it. It is the one switch in this layer that
  turns a human review into an automatic edit.
