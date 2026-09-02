# HANDOVER

**Last updated:** SESSION 12 · 2 September 2026
**Branch:** `claude/data-gaps-proposals-4pjepp`, cut from `main` at `45dcc57`.
**Base commit:** `45dcc57` on `main` ("Record in the handover that SESSION 11 is merged").
**Not merged into `main`.** A push to `main` publishes to the live site and there
is no deploy gate, so AGENTS.md requires the repository owner's explicit
instruction. This branch is waiting for it.

**The trap that has caught three sessions running:** the local `main` in a fresh
container can be dozens of commits behind `origin/main`. Run
`git fetch --all && git branch -a` before concluding anything, and check
`git log origin/main..main` **and** `main..origin/main` before merging into a
local branch you did not just create.

**The live site is byte-for-byte unchanged by this work**, and this was checked
rather than asserted: the diff contains nothing under `data/`, no `*.html`, and
nothing under `js/`, `css/`, `i18n/`, `fonts/` or `tools/`; the new agent's suite
hashes the whole of `data/` before and after a full run against the real corpus
and asserts it is byte-identical; and all four validators produce output matching
the `docs/CURRENT-ARCHITECTURE.md` §12 baseline exactly.

**Everything worked before the session started, and it was checked first:** 397
tests across eight suites, 18/18 contracts satisfiable, all four validators at
the §12 baseline.

---

## Current milestone

**SESSION 12 — Agent 5, the gap router. Complete.** `agent/proposals/data/`
consumes the `KnowledgeGap` records `agent/depth/` produces and turns each one
into either a structured proposal or a routed handoff with its reason.

The reference document is **`docs/GAP-PROPOSALS.md`**. This file is the handover
only.

## What the session was told, and what was done

> Extend Data Depth so that each identified gap can become a structured proposal.
> Respect one home per fact, derivation over storage, existing IDs and existing
> vocabularies. If a new taxonomy term appears necessary, create a taxonomy
> proposal; do not silently create it. If a proposed item is interpretive, route
> it to Editorial. If evidence is inadequate, route it to Verifier. Create
> `agent/proposals/data/`. Add schema validation and tests. **Do not merge any
> substantive additions automatically.**

All of it, with one thing the brief did not name and that had to exist: a fifth
route for the gap whose recommended home is a field no dataset has. Nothing was
merged and nothing was applied.

**Against the real corpus: 57 gaps routed → 14 proposals, 21 evidence questions
handed to the Verifier, 21 handed to Editorial, 1 to the repository owner.**

## Files changed

```
agent/schemas/types.mjs                     (create_taxonomy_term + TAXONOMY_OPERATION_KIND;
                                             GAP_ROUTES, GAP_ROUTE_RECIPIENT, PROPOSING_ROUTES)
agent/schemas/contracts/data-proposal.mjs   (create_taxonomy_term in CREATE_KINDS, four new rules)
agent/schemas/selftest.mjs                  (9 new tests)
agent/schemas/README.md

agent/proposals/data/route.mjs      (new — the routing table and the two one-way overrides)
agent/proposals/data/annotate.mjs   (new — the one edit authorable with an empty hand)
agent/proposals/data/taxonomy.mjs   (new — establishing a term is needed before proposing one)
agent/proposals/data/proposals.mjs  (new — Agent 5)
agent/proposals/data/cli.mjs        (new)
agent/proposals/data/selftest.mjs   (new — 47 tests, against the real data/)
agent/proposals/data/README.md      (new)

agent/observability/query.mjs        (proposalState, wired into loadTrace and overview)
agent/observability/cli.mjs          (the `proposals` command, and --refused)
agent/observability/server.mjs       (GET /api/proposals)
agent/observability/viewer/viewer.js (the Gap proposals panel and the overview tile)
agent/observability/selftest.mjs     (6 new tests)

docs/GAP-PROPOSALS.md   (new — the reference document)
docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md · docs/SKILL-MAP.md · docs/DATA-DEPTH.md
AGENTS.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`,
`i18n/` and `fonts/`, all four validators in `tools/`, and every file under
`agent/scout/`, `agent/verifier/`, `agent/integrate/`, `agent/detector/` and
`agent/depth/` (except two paragraphs of `docs/DATA-DEPTH.md` that had become
false).

## The four things worth knowing

**1 · "Each gap can become a proposal" is mostly false, and saying so is the
work.** Closing a knowledge gap means writing the value the corpus lacks, and for
eleven of the thirteen kinds that value is an article number, a date, a
competence, a fine or a status — read from a document, and nothing here has
retrieved one. So the run asks two questions and keeps them apart: **who can act
next** (the route) and **what can be authored now** (a proposal, or a refusal
with its reason). Conflating them produces either a proposal with no value, which
is not a proposal, or one with a value nobody read, which is a fabrication. The
run records that on its trace as the alternative it refused, so the refusal is
checkable rather than a claim in a comment.

**2 · The one edit this repository can author is a note about itself.** A
sentence on a record that already exists, stating something about *this corpus*
rather than about EU law. Thirteen of the fourteen proposals are that. The
sharpest is `unsupported_claim`: seven claims typed `claim-type:law` rest on the
brief citing itself and *other records are built on them* — SESSION 11
established it and had nowhere to put it. **The text is composed, not written**:
`annotate.mjs#noteFor` is a pure function of ids and counts read off the gap's
evidence, and the suite recomputes every note a run emitted and asserts it is
character-identical. `verification_note` is rendered by four modules in `js/`,
which is why this is amber and approval-gated rather than green.

**3 · The taxonomy term was proposed with the search that could have stopped
it.** `relationship_kind` has ten terms and none of them means "these two records
are one document". Establishing that is the whole burden — an agent that decided
a term was needed without looking would give an existing distinction a second
home in the enum authority every dataset resolves against. The search reuses
`DataProposal.existing_search` unchanged, and **the suite asks it about a concept
the dimension does carry** and asserts it finds it: a search that could never
come back empty-handed is not a search. What is proposed is an id and a label;
the definition is not, because that is the site's own words.

**4 · No nineteenth contract.** `create_taxonomy_term` is a sixth
`DATA_OPERATION_KINDS` value with four rules, because the burden a term carries
*is* `DataProposal`'s burden. The class is **forced** to `human_only` rather than
checked against what the proposing agent claimed — the only rule in that contract
that works that way, and it does because `data/taxonomy.json` is what every other
dataset resolves against.

## Nothing merged, and the run can prove it

Six independent things, not one:

- every proposal carries an `ApprovalRequest` in the `requested` state, and
  `ApprovalRequest` refuses a decision whose `decided_by` is the requesting agent;
- `DataProposal` forbids `auto_merge`, `apply_automatically`, `merge_on_approval`,
  `merged` and `applied` by name, and the suite asserts no record carries one;
- no proposal is `substantive`, because the only value written is a note about the
  corpus — and `substantive: true` would force `human_only` anyway;
- the run emits a `NOTHING MERGED` observation with `applied: 0` and
  `data_dir_written: false`, and the read model reports a **gap in the view**
  where it is missing;
- the CLI hashes the whole of `data/` before and after and prints which;
- `selftest.mjs` scans every module in the directory for a write call.

## Tests

| Command | Result |
|---|---|
| `node --test agent/proposals/data/selftest.mjs` | **47 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | **130 pass · 0 fail** (121 before) |
| `node --test agent/observability/selftest.mjs` | **28 pass · 0 fail** (22 before) |
| `node --test agent/depth/selftest.mjs` | 40 pass · 0 fail — unchanged |
| `node --test agent/detector/selftest.mjs` | 63 pass · 0 fail — unchanged |
| `node --test agent/integrate/selftest.mjs` | 61 pass · 0 fail — unchanged |
| `node --test agent/verifier/selftest.mjs` | 42 pass · 0 fail — unchanged |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-02` | "Nothing past its stated interval", exit 0 |

**459 tests across the nine suites, all passing** (397 before this session).

## Observability

Every route is a span (`propose.<route>`) with its own counts; every refusal an
observation with the gap and the reason; every proposal, approval and data gap an
artifact pointer; every handoff an edge; the routing a decision with its
alternatives; and two closing observations — the census, and that nothing was
merged. `proposalState()` in `query.mjs` derives the view at read time and stores
nothing twice, exposed as `cli.mjs proposals [--refused]`, `GET /api/proposals`
and the **Gap proposals** panel in the viewer. The overview tile counts the gaps
that could **not** become a proposal, not the ones that could.

## Known limitations

Full list in `docs/GAP-PROPOSALS.md` §9. The four that matter most:

1. **No agent here has read a real document.** Unchanged since SESSION 05, and now
   the blocking dependency for eight sessions of work. It is why 43 of 57 gaps are
   a handoff rather than a proposal.
2. **Fourteen proposals, thirteen of them notes.** The honest description of this
   session's output is that it made two absences visible on production pages and
   proposed one word. That ratio is the retrieval dependency, not something to tune.
3. **A second run proposes the same notes again.** There is no record that a human
   applied one, so nothing can tell a proposal that was accepted from one nobody
   looked at. The SESSION 11 handover named exactly this as what closing the loop
   needs, and this session did not build it.
4. **Nothing consumes a `DataProposal` yet.** The chain now runs
   gap → proposal → approval and stops. The half still missing is the one that
   applies an approved proposal and records that a human did — the only code here
   that would ever write to `data/` on an agent's initiative.

## Unresolved issues, carried forward

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping ground
   at different altitudes, uncross-checked. **Partly addressed twice:**
   `docs/DATA-DEPTH.md` §11 for the Data Depth role, and now `docs/SKILL-MAP.md`,
   which gains a **Gap router** row rather than stretching an existing one.
4. The five operating-policy documents have not been cross-checked against
   `agent/schemas/`.
5. **106 records carry an unverified or requires-verification note.** No session
   since SESSION 07 has moved that number. SESSION 12 does not move it either — it
   proposes notes recording which of them are load-bearing, and a note is not a
   verification.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no
   retention policy, concurrent writers untested.
7. The Source Scout workflow has still never executed on GitHub Actions.
8. The `conflicting` provenance word is a sixth where the verification-protocol
   reference documents five. Carried from SESSION 07, still unreconciled.
9. **The agent-layer status vocabulary and `data/taxonomy.json` disagree in both
   directions.** Five agent statuses have no taxonomy term (SESSION 07);
   `status:partly-applicable` has no agent status (SESSION 09). Six sessions have
   now left this and said so.
10. **`RegulatoryChange` versus `ChangeRecord` is settled in code and open as a
    decision.** See `docs/CHANGE-DETECTOR.md` §1.
11. **Two fields in `data/` whose name says reference and whose value is prose** —
    `timeline.events[].supersedes` and `applicability.rules[].depends_on`.
12. **`GOVERNANCE_PERMITS` is empty**, and nothing in `docs/` opens it.
13. **`data/sources.json` has no way to say two records are one document.** Now
    backed by a concrete proposal — `prop-taxonomy-*` proposes the missing word —
    but the **shape** is still missing and is deliberately not bundled with it.
    Adding a `relationships[]` array to `data/sources.json` is a decision for the
    repository owner.
14. **The taxonomy declares four `instrument_kind` terms no record uses** —
    `kind:delegated-regulation`, `kind:implementing-decision`,
    `kind:code-of-practice` and `kind:report` — and two `event_type` terms,
    `event:compliance-deadline` and `event:implementing-act`. A data decision.
15. **New: fourteen proposals now exist and nothing decides them.** Each is behind
    a pending `ApprovalRequest` addressed to "the repository owner", and pending is
    never granted. Until somebody decides, every re-run regenerates them.

## Next session

**A — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and now the blocking dependency for everything built since. Seven
sessions of agent work exist and none has read a real document. `mode: mock`
first, then `mode: live` with `dry_run: true`.

**B — the applied half, and the record that a human applied it.** The chain now
runs `KnowledgeGap` → `DataProposal` → `ApprovalRequest` and stops. What is
missing is not the write: it is the `ChangeRecord` that says a human applied one,
so the next run does not propose it again. That record is what makes the loop a
loop rather than a generator.

**C — decide the fourteen proposals this session produced.** Thirteen notes and
one word. They are the first proposals in this repository's history that a human
could actually accept or reject, and until somebody does, issue 15 above grows on
every run.

### Exact next objective

**A.** Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true`,
confirm the workflow's mechanics on a real GitHub-hosted runner, then decide with
the repository owner whether to proceed to a live dispatch. The full chain, once
a live retrieval succeeds:

```
node agent/verifier/cli.mjs        --records <trace-id>
node agent/integrate/cli.mjs       --records <trace-id> --as-of <date>
node agent/detector/cli.mjs        --records <trace-id> --as-of <date>
node agent/depth/cli.mjs           --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs  --as-of <date> --gaps <depth-trace-id> --refusals
node agent/observability/cli.mjs   proposals --refused
```

## Anything the next agent must know

- **`agent/proposals/data/` never writes anything and never merges**, and the
  suite scans every module in it for a write call as well as hashing `data/`
  around a full run.
- **`asOf` is an argument, everywhere.** Unchanged.
- **A refusal is a deliverable.** A gap that produced nothing is counted, reasoned,
  on the trace and in the read model. The suite asserts that every gap either
  authored a record or was recorded as a refusal — a gap that did neither has
  vanished.
- **The note is composed, never written.** If you find yourself editing a sentence
  in `NOTE_FOR_KIND` to read better, you are writing prose that will appear on a
  production page. Add a template deliberately or not at all.
- **Both routing overrides are one-way**, and the suite asserts neither can promote
  a gap into a proposal its kind did not allow.
- **The taxonomy search must be able to fail.** The test that asks it about
  `rel-kind:repeals` is the one that proves the decisive-word test does anything.
- Before declaring anything done: the nine `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no dependency,
  no service worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.
- Do not modify `data/*.json` in a session not scoped for data work. **The 14
  proposals this session produced are proposals, not a work order** — each is
  behind a pending approval, and applying one without a decision is exactly the
  failure the whole chain exists to prevent.
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
- **Do not relax the rule that `create_taxonomy_term` is `human_only`**, and do not
  make the class depend on what the proposing agent claims. Do not add a
  `definition` to what a taxonomy proposal proposes — a definition is the site's
  own words.
- **Do not add a note composer for a gap kind whose note would state anything about
  EU law.** The test that every clause is checkable in this repository is the whole
  of what keeps this route from being a back door.
