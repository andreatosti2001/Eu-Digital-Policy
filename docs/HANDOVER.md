# HANDOVER

**Last updated:** SESSIONS 14 and 15 · 3 September 2026
**Branch:** `claude/eu-digital-policy-protocol-qaipyg`, cut from `main` at `936aa2d`.
**Base commit:** `936aa2d` on `main` ("Record in the handover that SESSION 13 is merged").
**Merged into `main`** — the session prompt instructed it explicitly, in both halves
("At the end of the session, merge everything into branch main"). That is the
authorisation `AGENTS.md` requires for a push to `main`, because `main` publishes
to the live site and there is no deploy gate. All eleven suites, the contract
check and all four validators were re-run **on the merged tree** before the push,
not only on the branch.

**The stale-`main` trap did not catch this session, and the check is still
worth running.** `git log origin/main..main` and `main..origin/main` were both
run before merging. Local `main` was at `936aa2d`, identical to `origin/main`.
Two earlier sessions found it 32 and 40 commits behind; run
`git fetch --all && git branch -a` before concluding anything.

**This session had TWO objectives, and they landed in ONE commit.** SESSION 14
built the Editorial Agent; SESSION 15 extended it to detect stale editorial prose.
They are reported separately below, and `docs/EDITORIAL-AGENT.md` says which half
is which — but they are **not** two commits, and claiming they were would be a
fabricated history. SESSION 15's triage is what SESSION 14's three proposal types
exist *for*: a SESSION-14-only tree would have had `editorial.mjs` importing a
`staleness.mjs` that did not exist, and splitting it would have meant writing a
version of the agent nobody ran. The previous two sessions did split, because
their two halves were genuinely independent; these two are not.

**The live site is byte-for-byte unchanged**, and this was checked rather than
asserted: nothing in the diff is under `data/`, no `*.html`, and nothing under
`js/`, `css/`, `i18n/`, `fonts/` or `tools/`. The only exception to "nothing
under `js/`" is `agent/observability/viewer/viewer.js`, which is the development
viewer and is not served by any page.

**No discrepancy between the handover and the code.** `docs/HANDOVER.md` at
`936aa2d` described `main` accurately, and every number in it was re-measured
rather than trusted: **549 tests across ten suites, 18/18 contracts satisfiable,
0 errors and 106 unverified records across the four validators, the same five
`design-qa` warnings by file and line.**

---

## Current milestone

**SESSIONS 14 and 15 — complete, in two parts.**

**SESSION 14 — Agent 7, the Editorial Agent** (`agent/proposals/editorial/`).
**SESSION 15 — stale editorial prose**, in the same directory.

The reference document is **`docs/EDITORIAL-AGENT.md`**; this file is the
handover only.

---

# SESSION 14 — the Editorial Agent

## What was built

The seventh agent, and the first thing in this repository that reads a sentence.
`docs/AGENT-ROLES.md` §6 has described the Editorial role since SESSION 01 and
nothing had filled it.

**No nineteenth contract.** `EditorialProposal` has existed since SESSION 03 and
had been produced by nothing. It gained three fields — `proposal_kind`,
`editorial_state`, `staleness` — plus `caveats_preserved` and a `home` on each
prose location, and seven rules that make the session's discipline checkable
rather than conventional. Each is a field rather than a convention because a rule
cannot be written against a convention.

## The four distinctions, and where they already lived

The site draws them in three places and this agent invented no fourth:
`data/claims.json`'s `type`, `js/format.js`'s `familyOf`/`evidenceGrade` (imported,
never reimplemented — the grading rules are red tier), and the markup's own
`data-tone="crit"` / `CRITIQUE` box labels. What is new is the **subject**: a
claim record describes a proposition, and nothing in `data/` describes a block of
prose.

Hence five words rather than four. `not_attributed` is what the agent says about a
block carrying no claim record, and the contract refuses a `factual_update` over
one. Measured on the real site:

```
387 authored blocks  ·  markup 324 · __CONTENT__ blob 34 · data/brief.json 29
fact 18 · interpretation 9 · critique 24 · unresolved 19 · not_attributed 317
59 blocks carry a claim record — every data-claim attribution in the markup
0 close tags unmatched by the scanner
```

## What "drafted automatically" was allowed to mean

**Substitution, and nothing else.** One occurrence of the value a verification
read from a document, replaced by the value the same verification read from the
same document, with no other byte moved:

```
current.split(matched).join(replacement) === proposed,  matched occurs exactly once
```

The suite asserts it over every draft a full run produces, together with the
load-bearing attribute fingerprint and every caveat the sentence carried. Five
named refusals: split by inline markup · more than one occurrence · an attribute
would move · a caveat would be lost · the replacement is `null` or `"unknown"`.
A refused substitution becomes a recommendation naming the reason rather than
vanishing.

## The intake gate

Three admissible contracts, and **what each entitles the agent to do differs** —
only `RegulatoryChange` carries both sides of a move, so only it can produce a
correction. Four refusals, each a deliverable: not one of the three · rejected by
the contract gateway · a verdict that settled nothing (`conflict` explicitly:
H7 says contradictions go to a human) · materiality `none`.

## What it found with no input at all

22 editorial recommendations, nothing drafted, every one `human_only` behind a
pending approval:

1. **`meta.standfirst` differs between its two homes.** Reported, never
   reconciled — the drift is the author's decision. This is the editorial half;
   `agent/architect/` raised the shape half in SESSION 13, and each proposal says
   so about the other.
2. **Two CRITIQUE boxes whose every claim is typed law or fact** —
   `index.html` `part-2.div2` and `part-3.div1`. The markup and `data/claims.json`
   disagree about what a passage is, and nothing in this repository checks for it.
3. **Nineteen sentences reading as settled over claims graded Unresolved.** The
   `legal-editorial` skill's one rule that outranks style. Marked
   `contested: true`, because a sentence can be appropriately confident with none
   of the register's markers in it.

And one result that is a result: **every `data-claim` in the markup resolves to a
record in `data/claims.json`. Zero dangling**, recorded as looked-and-found-nothing.

---

# SESSION 15 — stale editorial prose

## The distinction the session asked for

> distinguish certain contradiction from possible staleness

`contradicted` — the value is **in** the sentence, quoted, so a reviewer checks
the finding rather than taking it. `possibly_stale` — the sentence depends on the
record and does not state the value; nothing here can show it is wrong and nothing
may edit it. The contract refuses a quote on a `possibly_stale` finding and
refuses a correction on anything but a `contradicted` one.

Three derived dependency mechanisms: the sentence contains the value · a claim
attached to the block references the changed record · the sentence names the
record under a name a string match can distinguish. **The third is tested for
ambiguity against the site's own prose**, the same discipline `labelAmbiguity`
applies to taxonomy labels; an ambiguous match becomes an open question with its
sentence attached, never a finding.

**The reading rules were imported, not rewritten.** `proseMentions`, `datesIn`,
`monthNames` and `labelAmbiguity` come from `agent/detector/impact.mjs`.

## The triage table, and the three deliverables

Ten rows, one per state × strength, throwing at module load if any row ever routes
an argument to a correction.

| deliverable | record | when |
|---|---|---|
| factual correction proposal | `EditorialProposal` `factual_update` | FACT × contradicted, and only there |
| analytical review proposal | `EditorialProposal` `analytical_update` | any argument, either strength — never drafted |
| no-change explanation | **`AgentObservation`** | the sentence does not state the value that moved |

**The no-change explanation is not a proposal**, and that is a contract fact: a
proposal with no operations is a suggestion, and `proposed_change.operations` has
a minimum of one. It carries the sentence and the value the sentence does *not*
contain, so both halves are checkable.

**Why FACT × not-quoted is *no change* rather than a review item:** this site
derives at render time, so correcting the record corrects everything the reader
sees there. Same finding SESSION 10 made about the factual half of its impact map.

## Regression tests for all three cases

All three run the whole agent over the **real** `index.html` and the **real**
`data/`, not a mock page:

| case | fixture | asserts |
|---|---|---|
| factual correction | a change to `tl-dsa-2025-10-29-delegated-act`, whose date `index.html` `part-3.p7` states as "29 October 2025" | the substitution arithmetic, the attribute fingerprint, every caveat, three locale keys declared, `review_required`, an amber approval |
| analytical review | a change to `gdpr.legislative_status` | every proposal over an argument carries `proposed: null` and `human_only`, behind a red approval |
| no-change | the same change | every explanation is an `AgentObservation`, carries the sentence, and states the open question that a paraphrase is invisible |

---

## Files changed

```
SESSION 14
agent/schemas/types.mjs                          (EDITORIAL_STATES, EDITORIAL_PROPOSAL_KINDS,
                                                  EDITORIAL_STALENESS_KINDS, PROSE_HOMES)
agent/schemas/contracts/editorial-proposal.mjs   (three fields, seven rules)
agent/schemas/fixtures.mjs                       (the EditorialProposal fixture)
agent/proposals/editorial/prose.mjs              (new — the site's prose, read as a structure)
agent/proposals/editorial/register.mjs           (new — the four distinctions, for a sentence)
agent/proposals/editorial/intake.mjs             (new — only verified inputs)
agent/proposals/editorial/drafts.mjs             (new — the one edit it may compose)
agent/proposals/editorial/drafts-dir.mjs         (new — where a draft lives)
agent/proposals/editorial/editorial.mjs          (new — Agent 7)
agent/proposals/editorial/cli.mjs                (new)
agent/proposals/editorial/README.md              (new)
.gitignore                                       (the drafts directory)

SESSION 15
agent/proposals/editorial/staleness.mjs          (new — contradiction vs staleness, the triage table)
agent/proposals/editorial/selftest.mjs           (new — 61 tests, against the real pages and data/)

BOTH
agent/observability/query.mjs        (editorialState, into loadTrace and overview)
agent/observability/cli.mjs          (the `editorial` command, and --no-change)
agent/observability/server.mjs       (GET /api/editorial)
agent/observability/viewer/viewer.js (the Editorial panel and two tiles)
docs/EDITORIAL-AGENT.md              (new — the reference document)
docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md · docs/SKILL-MAP.md
docs/GAP-PROPOSALS.md · docs/DATA-DEPTH.md       (two now-false statements, corrected in place)
AGENTS.md · agent/schemas/README.md
.agents/skills/legal-editorial/SKILL.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`,
`i18n/` and `fonts/`, all four validators in `tools/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/proposals/editorial/selftest.mjs` | **61 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | 139 — unchanged |
| `node --test agent/observability/selftest.mjs` | 40 — unchanged |
| `node --test agent/detector/selftest.mjs` | 66 — unchanged |
| `node --test agent/integrate/selftest.mjs` | 64 — unchanged |
| `node --test agent/architect/selftest.mjs` | 52 — unchanged |
| `node --test agent/proposals/data/selftest.mjs` | 50 — unchanged |
| `node --test agent/verifier/selftest.mjs` | 45 — unchanged |
| `node --test agent/depth/selftest.mjs` | 43 — unchanged |
| `node --test agent/scout/selftest.mjs` | 32 — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 577 records from this session's real runs, 0 invalid |

**610 tests across eleven suites, all passing** (549 before this session).

Also run as live verification, outside the standing suites: `editorial` with no
input (22 recommendations), `editorial --mock` (12 inputs admitted, 92 proposals,
74 no-change explanations, 57 open questions), and the chain
`detector --mock` → `editorial --changes <trace>` (chained, `parent_run_id`
populated, handoff recorded on the upstream trace).

## Architecture decisions

1. **No nineteenth contract; three fields instead.** `EditorialProposal` already
   carried the burden a change to the brief carries. Each new field exists because
   a rule had to be written against it — `proposal_kind` so "only a factual update
   may be drafted" is enforceable, `editorial_state` so "an argument is never
   corrected" is, `staleness` so "a correction quotes what it corrects" is.
2. **`editorial_state` is about a SENTENCE, which is why it is not a second home
   for `claims.json`'s `type`.** Nothing in `data/` describes a block of prose, and
   `not_attributed` is a state no claim record could express.
3. **"Drafted" means substitution, and the guarantee is arithmetic.** The one
   place an agent here composes text a reader will see, and the only defensible
   form for it. Everything else carries a null replacement, as
   `agent/architect/` already does for schemas.
4. **The no-change explanation is an `AgentObservation`, not a proposal.** A
   proposal with no operations is a suggestion; the contract already said so.
5. **The drafts go to `agent/proposals/editorial/drafts/`**, which is the record
   store pointed somewhere else. There is no patch file: writing the replacement
   out a second time would be a second home for the sentence being proposed.
6. **The site-level findings need no verified input**, and they are separated on
   the trace from the change-driven ones. Without them SESSION 14 would have
   delivered a framework that produced nothing on the real corpus.

## Observability

Five span kinds (`editorial.intake`, `.prose`, `.site`, `.change.*`,
`.verification.*`); an observation per intake refusal with its reason; an
observation per no-change explanation carrying the sentence and the value it does
not contain; an observation per open question; the triage as a decision with four
alternatives; a census; and `NOTHING APPLIED` with `sentences_authored: 0`.
`editorialState()` derives the view at read time and stores nothing twice —
`cli.mjs editorial [--no-change]`, `GET /api/editorial`, the **Editorial** panel,
and two overview tiles (*prose corrections drafted* beside *prose examined, no
change*, because a tile showing only the first would report "examined and clear"
as "not looked at").

The view reports gaps rather than filling them: a run that drafted over an
analytical passage, proposed without an approval, refused without a reason, or
claims to have authored a sentence is a gap.

## Known limitations

Full list in `docs/EDITORIAL-AGENT.md` §10. The four that matter most:

1. **No agent here has read a real document.** Unchanged since SESSION 05, and it
   bounds this agent more tightly than most: the value a correction substitutes IN
   is only ever as good as the verification that carried it, and every approval
   says so.
2. **A paraphrase of a value is invisible.** Every no-change explanation carries
   that as an open question — it says the value is *not present*, never that the
   sentence is unaffected.
3. **A `factual_update` never fired on the detector's own fixtures.** The
   adversarial corpus does not happen to produce a fact-state sentence quoting a
   moved value. The path is exercised against the real `index.html` by the suite's
   first regression test, over a real timeline event and a real sentence.
4. **The word threshold and the caveat list are judgements**, each in one place
   with a reason. The caveat list is used only to REFUSE a substitution — it never
   adds a hedge and never decides what a sentence means.

## Unresolved issues, carried forward

SESSION 13's 1–18 stand unless noted.

1. `data/brief.json` is canonical and fetched by nothing. **Now also an editorial
   finding**: `meta.standfirst` differs between its two homes, and that is a
   sentence a reader sees rather than only a shape. Still not to be fixed on an
   agent's initiative.
2. No deploy gate; the validators do not run in CI.
5. **106 records carry an unverified note.** No session since SESSION 07 has moved
   it; this one does not either.
7. The Source Scout workflow has still never executed on GitHub Actions.
12. `GOVERNANCE_PERMITS` is empty and nothing in `docs/` opens it. **This agent
    depends on that**: an editorial impact becomes a review proposal absent a named
    permit, and none exists.
15. Fourteen gap-router proposals exist and nothing decides them.
16. Twenty architecture proposals exist and nothing decides them.
18. `rel-kind:complement` is stored as both symmetric and asymmetric. Still the
    cheapest real decision on this list, and still nobody's but the owner's.
19. **New: twenty-two editorial recommendations exist and nothing decides them**,
    from a run with no input at all. Each is behind a pending approval.
20. **New: the markup and `data/claims.json` disagree about what two passages
    are.** `index.html` `part-2.div2` is in a box the author labelled CRITIQUE and
    its only claim, `clm-cjeu-pseudonymised-data`, is typed `claim-type:law`;
    `part-3.div1` is the same shape over `clm-x-data-access-staffing`. One of the
    two homes is wrong about each, `claim_type` is the highest-leverage field in
    the repository, and no agent may decide it.
21. **New: nineteen sentences read as settled over claims graded Unresolved.**
    The two available fixes are verification (the Verifier's) and rewording (the
    author's). Neither is an agent's.
22. **New: `docs/OBSERVABILITY.md`'s first stated limitation was false and was
    corrected in place.** It read *"No agent is instrumented, because no agent
    exists"* — stale since SESSION 05, with eight agents now instrumented through
    that layer. The real limitation underneath it was preserved verbatim: nothing
    here has retrieved a real document. **This is the one edit in this session
    that touched a stated limitation**, it corrected a falsehood rather than
    softening a finding, and it is flagged here so the next session can disagree
    with it.

## Next session

**A — decide something.** There are now **fifty-six** proposals outstanding across
three agents (14 gap-router, 20 architecture, 22 editorial) and not one has ever
been decided. The chain runs finding → proposal → `ApprovalRequest` and stops.
Issue 18 remains the cheapest: one field, five records, one word's meaning.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and now the blocking dependency for everything built since, this agent
included: it is why not one `factual_update` in this session stands on a document
anybody read.

**C — the applied half, and the record that a human applied it.** Still missing:
the `ChangeRecord` saying a human applied a proposal, so the next run does not
propose it again. Stable ids make it possible; nothing has built it.

### Exact next objective

**B**, then **C**. A is one decision by the repository owner and needs no code.
B is:

```
gh workflow run source-scout.yml -f mode=mock -f dry_run=true
```

then, once a live retrieval succeeds, the full chain — every step of which carries
`parent_run_id` and records its handoff:

```
node agent/verifier/cli.mjs             --records <trace-id>
node agent/integrate/cli.mjs            --records <trace-id> --as-of <date>
node agent/detector/cli.mjs             --records <trace-id> --as-of <date>
node agent/depth/cli.mjs                --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs       --as-of <date> --gaps <depth-trace-id> --refusals
node agent/architect/cli.mjs            --as-of <date> --gaps <depth-trace-id> --aside
node agent/proposals/editorial/cli.mjs  --as-of <date> --changes <detector-trace-id> --no-change
node agent/observability/cli.mjs        editorial --no-change
```

## Anything the next agent must know

- **`agent/proposals/editorial/` writes no sentence, and the guarantee is
  arithmetic rather than editorial.** If you are tempted to let it compose one —
  to add a hedge, to reword a paragraph whose premise moved, to fill in a null
  `proposed` — you are deciding what a production site about EU law says. The
  suite asserts the substitution identity over every draft; loosening it is the
  one change in this directory that cannot be made safely.
- **Contradiction and staleness are different claims, and the contract enforces
  it.** A finding that cannot quote what it corrects is not a correction.
- **A no-change explanation is a deliverable.** Deleting one to shorten a report
  turns "examined and clear" into "not looked at".
- **`not_attributed` is an answer.** 317 of 387 blocks carry no claim record.
  Assigning them one of the four would be an absence of knowledge presented as a
  finding.
- **The reading rules live in `agent/detector/impact.mjs`.** Do not write a second
  prose reader.
- **`asOf` is an argument, everywhere.** Unchanged.
- Before declaring anything done: the eleven `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding, plus this session's:

- Do not rebuild the site. No framework, no bundler, no build step, no dependency,
  no service worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative. It is
  now a measured *architecture* finding AND a measured *editorial* finding behind
  two pending approvals, which makes it twice reported and no more a work order
  than before.
- Do not modify `data/*.json` or any page in a session not scoped for that work.
  **The 56 proposals now outstanding are proposals, not a work order.**
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- **Do not reimplement `evidenceGrade` or `familyOf` in the agent layer.** They are
  imported from `js/format.js` and the suite fails if any module in
  `agent/proposals/editorial/` so much as names `TIER_GRADE`.
- **Do not add `retrieved_document` to `MINTABLE_EVIDENCE`.** A citation reaches a
  record in that directory only by being carried across from the verification that
  read the document.
- **Do not let a triage row route an argument to a correction.** `staleness.mjs`
  throws at module load, and the contract refuses one independently. Both checks
  exist because either alone could be edited away.
- **Do not turn a no-change explanation into a proposal.** It has no operation by
  definition, and a proposal with no operations is a suggestion.
- Do not add an id store, and do not change the id shapes in
  `agent/observability/ids.mjs`.
- Do not relax the contract gateway's rejection of anything malformed or
  `simulated`.
- Do not move `degraded` into a stored field. Do not move redaction to the read
  path, and do not raise `MAX_STRING`.
- **Do not add an entry to `GOVERNANCE_PERMITS`** without the repository owner
  naming the document that grants it.
- Do not relax the rule that `create_taxonomy_term` is `human_only`, and do not let
  `agent/architect/` propose a taxonomy term.
