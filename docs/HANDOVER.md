# HANDOVER

**Last updated:** SESSION 13 · 3 September 2026
**Branch:** `claude/eu-digital-policy-remediation-juj86j`, cut from `main` at `16ec83a`.
**Base commit:** `16ec83a` on `main` ("Record in the handover that SESSION 12 is merged").
**Merged into `main`** at `09c6e49`, with the repository owner's explicit
instruction given at the time — which is what `AGENTS.md` requires for any push
to `main`, because `main` publishes to the live site and there is no deploy
gate. The session stopped and asked rather than merging because the SESSION 13
prompt's closing line said to; that line is superseded, and the instruction was
obtained, not assumed. The branch is left in place rather than deleted. All ten
suites, the contract check and all four validators were re-run **on the merged
tree** before the push, not only on the branch.

**The trap caught this session too, and the warning is still needed — the number
is growing.** The local `main` in this container was **40 commits behind**
`origin/main` (32 in SESSION 12), sitting at a pre-SESSION 08 commit; merging
into it would have silently reverted six sessions of work. It was reset to
`origin/main` rather than merged into. Run `git fetch --all && git branch -a`
before concluding anything, and check `git log origin/main..main` **and**
`main..origin/main` before merging into a local branch you did not just create.
It also caught one verification command in this session — a `git diff main..HEAD`
run against the stale local `main` reported `tools/freshness.mjs` as changed by
this work, which it is not.

**This session had TWO objectives, and they are two.** Phase 0 was remediation
of three findings a SESSION 12 audit named as prerequisites; Phase 1 was
SESSION 13 proper, Agent 6. They are separate commits and are reported
separately below. Phase 0 is not part of the Knowledge Architect narrative.

**The live site is byte-for-byte unchanged**, and this was checked rather than
asserted: nothing in the diff is under `data/`, no `*.html`, and nothing under
`js/`, `css/`, `i18n/`, `fonts/` or `tools/`. The only exception to "nothing
under `js/`" is `agent/observability/viewer/viewer.js`, which is the development
viewer and is not served by any page.

---

## A discrepancy the next session needs, and it is not blocking

**There are two parallel SESSION 12s, and the SESSION 13 prompt quotes the one
that is not merged.**

- `main` carries **SESSION 12 — the gap router** (`agent/proposals/data/`,
  Agent 5, merged at `c0667d0`).
- The **foundation verification audit** the Phase 0 brief quotes lives unmerged
  on `origin/claude/foundation-verification-audit-40ozpo`, cut from `45dcc57` —
  *before* the gap router. Its recorded baseline ("eight suites, 397 tests") was
  therefore already stale when the prompt was written.

`docs/HANDOVER.md` did **not** conflict with the code — it described `main`
accurately. The conflict was between the session prompt and the merged handover.
This session verified all three of the audit's findings against `main`'s code
before acting on any of them, and proceeded. **The audit's file list was also
one file short**: it named five agents; `agent/proposals/data/proposals.mjs`
postdates it and had the same defect.

The measured baseline on `main` at the start of this session — run, not trusted:
**459 tests across nine suites, 18/18 contracts satisfiable, 0 errors and 106
unverified records across the four validators, the same five `design-qa`
warnings by file and line.**

---

## Current milestone

**SESSION 13 — complete, in two parts.**

**Phase 0 (`015446a`) — stable record ids, cross-agent trace linkage, honest run
status.** Additive; no schema change; nothing under `data/`.

**Phase 1 (`61d034b`) — Agent 6, the Knowledge Architect** (`agent/architect/`).
The reference document is **`docs/KNOWLEDGE-ARCHITECTURE.md`**; this file is the
handover only.

---

# PHASE 0 — remediation

Each finding was reproduced against this tree before being fixed, and each
reproduction is now a test.

### 1 · Record ids had no identity beyond a queue position

**The audit's phrasing is imprecise and the correction matters.** Two runs over
an *unchanged* corpus did reproduce the same 57 `gap_id`s — the counter is
deterministic, which is why this survived seven sessions. The defect is that the
number is an **ordinal**. Measured: removing one unrelated instrument (`dora`)
from the corpus renumbered **37 of the 55 findings that survived the removal
untouched**, because every id after the deleted one shifted.

Also corrected: with the **full sorted** affected-entity set, all 57 natural
keys are distinct. Only the first-entity shorthand collides, on
`missing_instrument_relationship|ai-act`. So the key the brief prescribed is
sufficient, and using the first entity alone would have merged two nodes.

`agent/schemas/identity.mjs` derives an id from the record's own content — kind,
the full sorted entity set, subject, and a named discriminator where those three
are genuinely not enough. `field` and `note` are excluded: rewording a note must
not mint a new node. **There is no id store.** `IdMinter` never supplies an id
and is never consulted before minting one; it refuses a collision between two
*different* findings and nothing else, and deleting it changes no id — a test
asserts exactly that.

Wired into all six agents (the audit named five). Found while validating: two
downstream runs reading one upstream trace both minted `ho-<span>-1`, because an
attached span starts its handoff counter at zero — cross-trace `handoff_id` is
content-derived for the same reason.

### 2 · No CLI populated cross-agent linkage

`Span.handoff()` and `gateway.handoff()` were correct and uncalled. Reproduced:
`scout --mock` → `verifier --records` gave `parent_run_id: null`,
`handed_off_to: []` and zero references to the upstream trace.

`agent/observability/chain.mjs` reads the producing run off the records' own
`trace_ref`; the CLI passes it to `new Tracer({ parent_run_id })` so every span
carries it from one place; and one `handoff` event is appended to the **upstream**
run, its payload naming the downstream trace. `Tracer#attachToRun` emits no
second `span.start`, because that span was opened and closed by another process.

Wired into five CLIs — `verifier`, `integrate`, `detector`, `depth` and
`proposals/data` (the last two take `--changes` and `--gaps`).

**`gateway.handoff()` is deliberately not the call**, and the reason is
checkable: it re-emits an artifact pointer per record, and the upstream trace
already carries every one. The gateway's other half, `receive()`, does the
validation instead. Nothing is made actionable — a `simulated` record is still
refused at intake, and a test asserts a mock chain still refuses all six
candidates.

`handoffState()` now reads a cross-trace edge as **accepted**: its old question
("did an agent of that name start in this trace?") answers no for a run that
started in another one, and every chained run would have shown a permanently
open handoff.

**`AgentRun.handed_off_to` is still empty on a chained run, and that is not an
unfixed bug.** A run closes before anything downstream exists. Back-filling the
stored field would mean rewriting a closed record; the durable answer is the
handoff event, derived by `handoffState()` at read time.

### 3 · A run whose whole input was refused reported `ok`

Reproduced: 6 candidates refused, 6 `failed` spans, 6 `error` records, `✓ ok`,
exit 0. **The mechanism is narrower than the audit states.** `deriveStatus()`
*was* wired into `list` — it only inspected **run** spans, and the failed
`verifier.intake` spans are **tool** spans. It now walks every span under the
root.

Where it reaches a process:

| | |
|---|---|
| `cli.mjs show <trace>` | one run, so its own answer: 0 ok · 2 degraded · 1 failed/running |
| `cli.mjs list` | a census line naming `degraded`, exit 0 by default — the store is history, and a run that failed in March is not a statement about today. `--fail-on degraded` (exit 2) / `--fail-on failed` (exit 1) is an operator's decision, spelled as `agent/scout/schedule/run.mjs` already spells it |
| the agent CLIs | total intake refusal exits 2 |

`degraded` is still derived and never stored.

### Phase 0 validation, as the brief specified it

| | |
|---|---|
| The `--test` suites and `agent/schemas/cli.mjs check` | **496 pass · 0 fail** (459 before), 18/18 satisfiable |
| The four `tools/` validators | 0 errors · 106 unverified · 0/0 · **the same five `design-qa` warnings by file and line** · "Nothing past its stated interval" |
| Scout → Verifier chain re-run | Verifier's `AgentRun` carries `parent_run_id: e51be640335a92a5`; `ho-…` on the upstream trace naming the downstream one; exit 2 |
| Two ids for the same finding, twice over the same `data/` | 57 gaps, 57 distinct ids, **identical across the two runs**; and 0 of 55 move when an unrelated instrument is removed (37 before) |

---

# PHASE 1 — Agent 6, the Knowledge Architect

**Sixth, not fifth**: the brief's numbering predates SESSION 12's gap router.

Eight lenses, one per question the brief asks, in its order. Against the real
corpus: **8 of 8 answered yes · 960 things examined · 20 proposals · 9 findings
set aside with reasons.**

### The three refusals it is built on

1. **It names a shape and drafts none.** Every operation's `proposed` is `null`.
   Drafting the replacement would be an agent deciding what a production site
   about EU law is able to express. Every proposal is `human_only`.
2. **It is not a second Data Depth Agent**, and the separation is a mechanism.
   Every finding declares `closes_by`; one a written record would close is
   `agent/depth/`'s, is set aside and is handed to it; one declaring neither is
   refused rather than guessed at. The boundary fires on the real corpus — 2 of
   29 findings are routed.
3. **It knows nothing about EU law.** Structures read from the files; every
   finding carries the records already saying what the shape would hold, and one
   with no such demand is set aside as a design opinion; every proposal stands
   on `dataset_record` evidence quoted from a named file, and a
   `retrieved_document` entry is refused rather than trusted.

### The first pass was wrong, and fixing it was the work

It reported **49 findings, several plainly false** — a "dataset nothing fetches"
firing on all ten datasets because the fetch detector was broken, and a
prose-reference lens firing on a record's own title. Tightening each rule
against the data took it to 20:

| Rule | What it removed |
|---|---|
| a **date-named** sub-field | `instruments[].dna` — a comparison slot is not a thing that happened |
| an **array literal**, not any string match | `js/format.js` — a dispatch is not a vocabulary copy |
| present on **every** record | `requires_verification` — an annotation is not a shape |
| a name the record **does not already reference** outside prose | 22 of the 32 prose findings |
| only `load()`/`loadAll()` argument lists | `js/shell.js`'s `id: 'brief'` nav id |

Every one of the 20 was then verified by hand against the data.

### The four findings that carry the most

1. **`relationships[].symmetric` has already diverged.** Whether a kind reads
   the same way in both directions is a fact about the *word*, stored 17 times
   for 8 kinds. `rel-kind:complement` is stored as **both `true` and `false`**;
   `tools/validate.mjs` does not check it; `js/interactions.js` draws the arrow
   from the per-edge value. The only finding whose copies already disagree on a
   production page.
2. **`dna_dimension` and the `dna` object disagree in both directions** — 11
   declared, 9 stored, 4 declared-and-unstored, 2 stored-and-undeclared. The
   vocabulary is stored as object *keys* and no validator compares a key against
   the enum authority. Two of the four unused terms are correctly derived at
   render time, and the model cannot tell that case from the other two.
3. **`js/dna.js` holds a complete second copy of that vocabulary** — a list that
   decides what rows the table has, so adding a term to the authority adds no
   row.
4. **`data/sources.json` has no way to say which instrument a source is about.**
   21 records name one in `note`, in prose.

Measured rather than restated: `data/brief.json` is fetched by nothing while
`index.html` inlines 60,156 bytes of the same content. The proposal states the
shape and explicitly does not reconcile it.

### Files changed

```
PHASE 0
agent/schemas/identity.mjs        (new — content-derived ids. No store.)
agent/observability/chain.mjs     (new — the edge between two runs)
agent/observability/tracer.mjs    (Tracer parent_run_id; Span attach; attachToRun)
agent/observability/query.mjs     (deriveStatus walks every span; handoffState
                                   accepts a cross-trace edge)
agent/observability/cli.mjs       (degraded in list's census and show's exit code;
                                   --fail-on; HANDED ON)
agent/observability/viewer/viewer.js  (downstream-trace column)
agent/{scout,verifier,integrate,detector,depth,proposals/data}   ids + CLI linkage
                                                                 + intake-refusal exit
agent/{schemas,scout,verifier,integrate,detector,depth,proposals/data,observability}/selftest.mjs
docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md · agent/schemas/README.md · AGENTS.md

PHASE 1
agent/architect/model.mjs      (new — the information model, read as a structure)
agent/architect/lenses.mjs     (new — the eight questions, as code)
agent/architect/boundary.mjs   (new — what makes a finding this agent's)
agent/architect/architect.mjs  (new — Agent 6)
agent/architect/cli.mjs        (new)
agent/architect/selftest.mjs   (new — 52 tests, against the real data/ and js/)
agent/architect/README.md      (new)
agent/observability/query.mjs        (architectureState, into loadTrace and overview)
agent/observability/cli.mjs          (the `architecture` command, and --aside)
agent/observability/server.mjs       (GET /api/architecture)
agent/observability/viewer/viewer.js (the Knowledge architecture panel and two tiles)
docs/KNOWLEDGE-ARCHITECTURE.md  (new — the reference document)
docs/DATA-DEPTH.md · docs/GAP-PROPOSALS.md · docs/SKILL-MAP.md
docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md · AGENTS.md
.agents/skills/knowledge-architecture/SKILL.md
agent/schemas/README.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`,
`i18n/` and `fonts/`, all four validators in `tools/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/architect/selftest.mjs` | **52 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | **139** (130 before) |
| `node --test agent/observability/selftest.mjs` | **40** (28 before) |
| `node --test agent/detector/selftest.mjs` | **66** (63 before) |
| `node --test agent/integrate/selftest.mjs` | **64** (61 before) |
| `node --test agent/proposals/data/selftest.mjs` | **50** (47 before) |
| `node --test agent/verifier/selftest.mjs` | **45** (42 before) |
| `node --test agent/depth/selftest.mjs` | **43** (40 before) |
| `node --test agent/scout/selftest.mjs` | **32** (30 before) |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 197 records from this session's real runs, 0 invalid |

**549 tests across ten suites, all passing** (459 before this session).

Also run as live verification, outside the standing suites: the full chain
`scout --mock` → `verifier --records` (exit 2, chained), `verifier --mock` →
`integrate --records` and `detector --records` (both exit 2, chained, distinct
handoff ids), `detector --mock` → `depth --changes` → `proposals/data --gaps`,
and `depth` → `architect --gaps`.

## Architecture decisions

1. **No nineteenth contract, twice.** `ArchitectureProposal` already carries the
   burden a model change carries. Adding one because a new agent exists would be
   the second home this architecture prevents.
2. **The id is derived, never looked up.** A lookup table mapping an old id to a
   new one is exactly the second home the rule forbids. `IdMinter` is a
   run-scoped contradiction check, not a store.
3. **`degraded` reaches `show`'s exit code and not `list`'s by default.** A
   store of every run ever made is history, not a health check.
4. **The Architect / Data Depth boundary is `closes_by`, checked in code.** An
   agreement between two documents would have drifted; a declared field that is
   refused when absent cannot.
5. **A dispatch is not a vocabulary copy, and an annotation is not a shape.**
   Both exclusions are derived (an array literal; presence on every record)
   rather than being lists of exceptions.

## Observability

Phase 0: `parent_run_id` on every span of a chained run and on its `AgentRun`; a
`handoff` on the upstream trace naming the downstream one; `degraded` derived
over every span and surfaced in `list`'s census, `show`'s exit code and the
viewer.

Phase 1: eight answers as eight observations, each carrying what its lens
examined; every set-aside as an observation with its reason and its owner, and a
handoff to that owner; the ordering as a decision with three alternatives; a
census and a `NOTHING MERGED` claim with `schemas_changed: 0` and
`values_proposed: 0`. `architectureState()` derives the view at read time and
stores nothing twice — `cli.mjs architecture [--aside]`, `GET /api/architecture`,
and the **Knowledge architecture** panel. The overview tile counts the questions
the model **handles**.

## Known limitations

Full list in `docs/KNOWLEDGE-ARCHITECTURE.md` §9. The four that matter most:

1. **No agent here has read a real document.** Unchanged since SESSION 05, and
   now the blocking dependency for nine sessions of work.
2. **The Architect cannot tell a defect from a deliberate simplification.** It
   establishes that the corpus is doing something a shape cannot hold; every
   proposal says the rest is a design judgement, as an attributed interpretation.
3. **Question 5 is the loosest of the eight.** It matches names whole-word
   against prose; a citation inside a sentence counts. The demand floor of two
   keeps single occurrences out; it does not make the lens precise.
4. **No lens answered "no" on this corpus**, so that path is exercised by the
   suite rather than by the data.

## Unresolved issues, carried forward

SESSION 12's 1–15 stand unless noted.

1. `data/brief.json` is canonical and fetched by nothing. **Now measured rather
   than restated** — and still not to be fixed on an agent's initiative.
2. No deploy gate; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` overlap, uncross-checked.
   **Partly addressed again**: `docs/DATA-DEPTH.md` §11 now states the boundary
   with the Architect from both sides, and `docs/SKILL-MAP.md` gains a
   **Knowledge architect** row.
4. The five operating policies have not been cross-checked against
   `agent/schemas/`.
5. **106 records carry an unverified note.** No session since SESSION 07 has
   moved it; this one does not either.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no
   retention policy, concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions.
8. The `conflicting` provenance word is a sixth where the protocol documents five.
9. The agent-status vocabulary and `data/taxonomy.json` disagree in both directions.
10. `RegulatoryChange` vs `ChangeRecord` is settled in code and open as a decision.
11. **`timeline.events[].supersedes` and `applicability.rules[].depends_on`** —
    now a *measured* Phase 1 finding rather than a note: `supersedes` names
    `ai-omnibus` in prose on two events, and `depends_on` is prose on 24 of 33
    rules.
12. `GOVERNANCE_PERMITS` is empty and nothing in `docs/` opens it.
13. `data/sources.json` has no way to say two records are one document — and now
    also no way to say which instrument a source is about (21 records name one
    in prose). SESSION 12 proposed the word; SESSION 13 measured the shape;
    neither proposed a container's contents.
14. The taxonomy declares four `instrument_kind` and two `event_type` terms no
    record uses.
15. Fourteen gap-router proposals exist and nothing decides them.
16. **New: twenty architecture proposals exist and nothing decides them.** Each
    is behind a pending approval. Stable ids now make a re-proposed finding
    distinguishable from a new one; the `ChangeRecord` saying a human decided
    one is still missing.
17. **New: `AgentRun.handed_off_to` is empty on every chained run.** A run closes
    before anything downstream exists. The trace answers it; the stored field
    cannot, and back-filling it would rewrite a closed record.
18. **New: `rel-kind:complement` is stored as both symmetric and asymmetric**,
    and `js/interactions.js` renders from that value. This is the one Phase 1
    finding that is visible to a reader today. It is a data decision — which
    value is right for the word — and no agent may make it.

## Next session

**A — decide the eighteenth finding, at least.** Issue 18 is a live inconsistency
on a production page, it is one field on five records, and the decision is one
word's meaning. It is the cheapest real thing on this list.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and now the blocking dependency for everything built since. `mode:
mock` first, then `mode: live` with `dry_run: true`.

**C — the applied half, and the record that a human applied it.** The chain now
runs `KnowledgeGap` → `DataProposal`/`ArchitectureProposal` → `ApprovalRequest`
and stops. What is missing is the `ChangeRecord` saying a human applied one, so
the next run does not propose it again. Phase 0 made this possible — a stable id
is what lets a decision be matched to a re-proposal — and did not build it.

### Exact next objective

**A**, then **B**. A is one decision by the repository owner and needs no code.
B is:

```
gh workflow run source-scout.yml -f mode=mock -f dry_run=true
```

then, once a live retrieval succeeds, the full chain — every step of which now
carries `parent_run_id` and records its handoff:

```
node agent/verifier/cli.mjs        --records <trace-id>
node agent/integrate/cli.mjs       --records <trace-id> --as-of <date>
node agent/detector/cli.mjs        --records <trace-id> --as-of <date>
node agent/depth/cli.mjs           --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs  --as-of <date> --gaps <depth-trace-id> --refusals
node agent/architect/cli.mjs       --as-of <date> --gaps <depth-trace-id> --aside
node agent/observability/cli.mjs   architecture --aside
```

## Anything the next agent must know

- **The id is content, not a counter, and there is no store.** If you find
  yourself adding a table that maps an id to anything, stop:
  `agent/schemas/identity.mjs`'s header says why, and `IdMinter` is not that
  table — deleting it changes no id.
- **`agent/architect/` never writes and never drafts.** Every operation's
  `proposed` is `null` deliberately. If you are tempted to fill one in, you are
  deciding what a production site about EU law may say.
- **`closes_by` is the boundary between Agent 4 and Agent 6**, and it is a
  refusal rather than a convention. A finding that declares neither is refused.
- **A dispatch is not a vocabulary copy; an annotation is not a shape.** Both
  exclusions are derived. Loosening either turns a lens back into a generator —
  the first pass produced 49 findings that way.
- **The counts always describe the whole demand**; the itemised evidence is a
  bounded preview. Do not make a count describe the preview.
- **`asOf` is an argument, everywhere.** Unchanged.
- **A refusal is a deliverable.** Every set-aside carries its reason and, where
  it has one, the agent it belongs to.
- Before declaring anything done: the ten `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding, plus this session's:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative. It is
  now a *measured* finding behind a pending approval, which does not make it a
  work order.
- Do not modify `data/*.json` in a session not scoped for data work. **The 34
  proposals now outstanding — 14 from SESSION 12, 20 from SESSION 13 — are
  proposals, not a work order.**
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- **Do not add an id store**, and do not change the id shapes in
  `agent/observability/ids.mjs` — trace and span ids are a separate,
  already-correct W3C-shaped system and are not what Phase 0 touched.
- Do not relax the contract gateway's rejection of anything malformed or
  `simulated`. The chain records that records were **read**; the intake gate
  still refuses to act on them, and a test asserts a mock chain refuses all six.
- Do not move `degraded` into a stored field. `AgentRun.forbidden` bans it by
  name, and a stored copy could not know about a child that failed later.
- Do not move redaction to the read path, and do not raise `MAX_STRING`.
- **Do not add an entry to `GOVERNANCE_PERMITS`** without the repository owner
  naming the document that grants it.
- **Do not relax the rule that `create_taxonomy_term` is `human_only`**, and do
  not add a `definition` to what a taxonomy proposal proposes.
- **Do not let `agent/architect/` propose a taxonomy term.** A word is
  `agent/proposals/data/`'s, with the search that could have stopped it. The
  architect proposes shapes and routes words.
