# HANDOVER

**Last updated:** SESSIONS 16 and 17 · 3 September 2026
**Branch:** `claude/ux-ui-auditor-agent-sy99b6`, cut from `main` at `bcc0426`.
**Base commit:** `bcc0426` on `main` ("Record in the handover that SESSIONS 14
and 15 are merged").
**Merged into `main`** at `18a2cbb` — the session prompt instructed it explicitly,
in both halves ("At the end of the session, merge everything into branch main").
That is the authorisation `AGENTS.md` requires for a push to `main`, because
`main` publishes to the live site and there is no deploy gate. All twelve suites,
the contract check and all four validators were re-run **on the merged tree**
before the push, not only on the branch: 683 pass, 18/18 satisfiable, 0 errors,
106 unverified, the same five `design-qa` warnings. `git diff bcc0426..HEAD` over
`data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`, every `*.html`, `style.css`,
`app.js`, `README.md` and `CLAUDE.md` is **empty** — checked on the merged tree,
not asserted. The branch is left in place rather than deleted.

**The stale-`main` trap caught this session too, for the fourth session running.**
The local `main` in this container was **44 commits behind** `origin/main` (45 in
SESSIONS 14/15, 40 in 13, 32 in 12), sitting at `4bd1f0d` — the observability
foundation, before the whole agent layer. Merging into it would have silently
reverted every session of work since. It was reset to `origin/main` rather than
merged into, and `git log main..origin/main` and `origin/main..main` were both
run before the merge. The number is not growing because the container is getting
staler; it is growing because `main` is. **Run `git fetch --all && git branch -a`
and check BOTH directions before merging into a local branch you did not just
create.**

**This session had TWO objectives, and they landed in ONE commit.** SESSION 16
built the UX/UI Audit Agent; SESSION 17 extended it to turn the high-priority
findings into testable proposals. They are reported separately below and
`docs/UX-AUDIT.md` says which half is which — but they are **not** two commits,
and claiming they were would be a fabricated history. The reason is the one
SESSIONS 14 and 15 gave: a SESSION-16-only tree would have had `auditor.mjs`
importing a `proposals.mjs` that did not exist, and splitting it would have meant
writing a version of the agent nobody ran. SESSION 17 is also what SESSION 16's
severity model exists *for*: without a derived backlog there is no "high-priority
finding" to write a proposal about.

**The live site is byte-for-byte unchanged**, and this was checked rather than
asserted: `git diff --stat` over `data/`, `js/`, `css/`, `i18n/`, `fonts/`,
`tools/`, every `*.html`, `style.css`, `app.js`, `README.md` and `CLAUDE.md` is
**empty**. The only file under `js/` in the diff is none: this session touched
`agent/observability/viewer/viewer.js`, which is the development viewer and is
not served by any page.

**No discrepancy between the handover and the code.** `docs/HANDOVER.md` at
`bcc0426` described `main` accurately, and every number in it was re-measured
rather than trusted: **610 tests across eleven suites, 18/18 contracts
satisfiable, 0 errors and 106 unverified records across the four validators, the
same five `design-qa` warnings by file and line.**

---

## Current milestone

**SESSIONS 16 and 17 — complete, in two parts.**

**SESSION 16 — Agent 8, the UX/UI Auditor** (`agent/ux/`).
**SESSION 17 — testable proposals**, in the same directory.

The reference document is **`docs/UX-AUDIT.md`**; this file is the handover only.

---

# SESSION 16 — the UX/UI Audit Agent

## What was built

The eighth agent, and the first thing here that asks what the INTERFACE does to a
reader. `docs/AGENT-ROLES.md` §7 has described the UX role since SESSION 01, the
`ux-audit` skill has carried its 31-item checklist since then, and nothing had
filled it.

**It is Agent 8, not Agent 7.** The brief calls it Agent 7; Agent 7 is the
Editorial Agent (SESSION 14). The brief's numbering predates it, exactly as
SESSION 13's did. Recorded rather than resolved by renumbering somebody else.

**No nineteenth contract.** `UXProposal` has existed since SESSION 03 and had
been produced by nothing — precisely where `EditorialProposal` stood before
SESSION 14. It gained five fields (`proposal_kind`, `finding_class`, `severity`,
`affected_journey`, `success_criterion`), six more for SESSION 17, and **two
forbidden fields**: `priority`, because the backlog position is derived and a
stored one is a second home for an ordering; and `users_affected`, because this
project has no analytics and a number there could only be invented.

## The ten questions, and what they found

Measured on the real site, as at 2026-09-03:

```
10 findings · 12 open questions · 1 lens answering no · 5 testable proposals
7 pages · 4 stylesheets · 26 modules · 1,613 CSS rules · 10 journeys

critical 1 · high 4 · medium 5
information_architecture 2 · usability 2 · interaction 2 · accessibility 1
discoverability 1 · enhancement 2
```

The three that matter:

1. **The status rule is stated once, implemented once, and bypassed by 26
   components.** `css/tokens.css` says in its own header that status is never
   carried by hue alone; `.badge` keeps it with eight glyph rules and four border
   styles; 26 other components draw a multi-state status varying `color` and
   nothing else. For **nine** of them this agent could not establish from the
   source that a sibling element carries the state's word — and that count IS the
   finding: the rule holds where somebody remembered it and nothing catches a
   lapse.
2. **Five of the seven pages are linked from no markup anywhere.** `js/shell.js`
   consolidated five drifted headers, which was right, and moved every link
   between pages into a module. The `<noscript>` notice on every page lists eight
   things that will not appear without scripting; navigation is not one of them.
3. **One dialog contract, two implementations, diverged on two behaviours.** Only
   `js/dialog.js` inerts every top-level element rather than a named list, and
   only it decides focusability by `getClientRects`. Separately, the theme
   control exists in both and only `js/shell.js`'s exposes `aria-pressed` and an
   `aria-label` — the brief's own toggle has neither.

**Question 3 found nothing, and that is a result.** Every class the stylesheets
declare pressable lands on an operable element.

## The three false positives that shaped the checks

Recorded because they are why the lenses are shaped as they are, and the next
session should not "simplify" them back:

- A word boundary treats `chrome-btn-word` as carrying `chrome-btn`. The first
  draft of question 3 reported the chrome's own buttons as unreachable `<span>`s.
  Class attributes are TOKENISED now.
- The markup writes `role="button"` and the `el()` helper writes `role: 'button'`.
  The second draft reported the compliance dial's dots — which carry a role, a
  tabindex and an `aria-label` — as unreachable `<circle>`s. Both syntaxes are
  read now.
- A container that renders `list.length` and then `esc(b.short)` renders both a
  number and the state's own word. A check that stopped at the first `.length`
  reported the status band as carrying its meaning in hue. Mixed is UNDECIDABLE
  now, and becomes an open question rather than a finding.

## Two evidence kinds produced for the first time

`repository_file` and `measurement` have been in `EVIDENCE_KINDS` since SESSION
03 and neither had ever been emitted. The distinction is load-bearing: "no page
links to this one" is not a string in any file, and filing it as a quoted extract
behind a real `file:line` would be a fabricated quote with a checkable-looking
locator. **The suite's byte-check — every quote read back out of the file it
names — is what found two lenses doing exactly that.**

---

# SESSION 17 — testable proposals

## Where the judgement lives

Everything SESSION 16 produced was derived: a lens read a file and the finding
quoted it. **A hypothesis cannot be.** It is a belief about a reader, and this
repository has no analytics, no telemetry and no user research.

So the judgement is recorded once, as a **recipe per lens**, and each recipe is
filled from the finding's own evidence — the files, the counts and the tokens are
read off the extracts, and only the reader problem and the hypothesis are the
agent's. The hypothesis is typed as a **contested interpretation** whose basis
says nothing measured it.

**A high-priority finding whose lens has no recipe is refused by name, on the
trace.** It does not become a proposal with a plausible hypothesis, which is the
failure that file is arranged against.

## The four things every proposal survives

1. All four validators, `tools/design-qa.mjs` among them, as SESSION 17 requires
   — with this agent's reasons rather than the data agent's, because for an
   interface change `i18n-audit` is the check most likely to fail rather than the
   one proving no prose moved.
2. `agent/ux/tokens.mjs`, which refuses a proposal naming a custom property no
   stylesheet declares. The contract independently refuses one that ADDS a token
   without an open question saying what the existing system could not hold. In
   practice this agent adds none.
3. The contract, which refuses a `testable_proposal` missing a metric, a
   regression risk, an accessibility check, a browser test or a hypothesis.
4. The honesty rule: every browser test carries a null `harness` and says a
   person runs it, because there is no browser harness here.

`autonomy_class` is `review_required` only where **no reader would meet the
change** — a judgement recorded per recipe, because it cannot be read off an
operation's target. The first draft derived amber from "the target starts with
`tools/`" and made a change that regenerates all seven published pages reviewable
rather than the author's.

---

## Files changed

```
SESSION 16
agent/schemas/types.mjs                      (UX_FINDING_CLASSES, UX_SEVERITIES,
                                              UX_SEVERITY_RANK, UX_PROPOSAL_KINDS,
                                              UX_NON_DEFECT_CLASS, UX_DRAFTABLE_KIND)
agent/schemas/contracts/ux-proposal.mjs      (eleven fields, ten rules, two forbidden)
agent/schemas/fixtures.mjs                   (the UXProposal fixture)
agent/ux/surface.mjs                         (new — the interface, read as a structure)
agent/ux/journeys.mjs                        (new — the reader journeys, parsed from js/shell.js)
agent/ux/lenses.mjs                          (new — the ten questions)
agent/ux/boundary.mjs                        (new — whose finding is it)
agent/ux/severity.mjs                        (new — derived severity, the backlog)
agent/ux/auditor.mjs                         (new — Agent 8)
agent/ux/cli.mjs                             (new)
agent/ux/README.md                           (new)

SESSION 17
agent/ux/tokens.mjs                          (new — the design system, and the refusal)
agent/ux/proposals.mjs                       (new — seven recipes)
agent/ux/selftest.mjs                        (new — 73 tests, against the real site)

BOTH
agent/observability/query.mjs                (uxState, into loadTrace and overview)
agent/observability/cli.mjs                  (the `ux` command, --backlog and --open)
agent/observability/server.mjs               (GET /api/ux)
agent/observability/viewer/viewer.js         (the UX audit panel and two tiles)
docs/UX-AUDIT.md                             (new — the reference document)
docs/AGENT-CONTRACTS.md · docs/OBSERVABILITY.md · docs/SKILL-MAP.md · docs/AGENT-ROLES.md
AGENTS.md · agent/schemas/README.md
.agents/skills/ux-audit/SKILL.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`,
`i18n/` and `fonts/`, all four validators in `tools/`, `style.css`, `app.js`,
`README.md`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/ux/selftest.mjs` | **73 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | 139 — unchanged |
| `node --test agent/observability/selftest.mjs` | 40 — unchanged |
| `node --test agent/detector/selftest.mjs` | 66 — unchanged |
| `node --test agent/integrate/selftest.mjs` | 64 — unchanged |
| `node --test agent/proposals/editorial/selftest.mjs` | 61 — unchanged |
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
| `node agent/observability/cli.mjs validate` | 0 invalid records from this session's real runs |

**683 tests across twelve suites, all passing** (610 before this session).

Also run as live verification, outside the standing suites:
`node agent/ux/cli.mjs --as-of 2026-09-03` (10 findings, 12 open questions),
`--propose` (5 testable proposals, 15 pending approvals), `--open`, `--backlog`,
and `node agent/observability/cli.mjs ux --backlog --open`.

## Architecture decisions

1. **No nineteenth contract; five fields, six more, and two forbidden.**
   `UXProposal` already carried the burden an interface change carries. Each new
   field exists because a rule had to be written against it — the reasoning is in
   `docs/AGENT-CONTRACTS.md`'s closing section.
2. **Severity is DERIVED and `critical` is reserved for one thing.** An absence
   of knowledge a reader can take for a negative finding. Without the reserved
   ceiling, three ordinary escalations also reach it and the word means "several
   things at once". `enhancement` is capped at `medium` by the model AND by the
   contract, because either check alone could be edited away.
3. **A finding that reaches every page is filed against the site**, not the
   highest-stake journey it touches. Otherwise every shared-stylesheet finding is
   filed against the applicability tool and the field says "this matters" rather
   than "this is where the reader meets it".
4. **A count is a `measurement`, not a quote.** See above; the suite's byte-check
   is what enforces it.
5. **An open question is a deliverable.** This agent produces more of them than
   findings, and both the view and the CLI put them beside the findings. Deleting
   one to shorten a report turns "could not be settled without opening a page"
   into "nothing there".
6. **`js/shell.js` is parsed, not imported.** It touches `document` at load and a
   DOM here would be a dependency. The suite asserts the parsed nav model matches
   the literal in the file.

## Observability

Ten lens spans (`ux.<lens>`) plus `ux.proposals`; an observation per lens with
what it examined, found and set aside; an observation per open question with the
bytes and what would close it; a handoff per routed finding; the ordering as a
decision with four alternatives; a census; the BACKLOG as an observation; and
`NOTHING RESTYLED` with five zeros. `uxState()` derives the view at read time —
`cli.mjs ux [--backlog] [--open]`, `GET /api/ux`, the **UX audit** panel, and two
overview tiles (*UX defects at critical* beside *UX questions unanswerable from
source*).

The view reports gaps: a run with no census, no backlog, no ordering decision or
no "nothing restyled" claim — or one claiming to have opened a page, written a
stylesheet or invented a token. The suite forges a trace making all three claims
and asserts the view catches every one.

## Known limitations

Full list in `docs/UX-AUDIT.md` §10. The four that matter most:

1. **Nothing has been rendered.** Every finding is about a source file. The
   twelve open questions are where that bites hardest, and every record carries
   README limitation 7 as a blocking open question, quoted whole.
2. **No contrast was computed.** `css/tokens.css` carries ratios its author
   measured; quoting one as this run's measurement would be a fabricated
   measurement.
3. **Question 2 scopes a behaviour by proximity to a marker**, at a span recorded
   per contract. It understates rather than overstates.
4. **Question 10's classification of which manual checks are automatable is a
   judgement**, in one place with a reason per section; an unclassified section
   becomes an open question rather than a guess.

## Unresolved issues, carried forward

SESSION 15's 1–22 stand unless noted.

2. No deploy gate; the validators do not run in CI.
5. **106 records carry an unverified note.** No session since SESSION 07 has
   moved it; this one does not either.
7. The Source Scout workflow has still never executed on GitHub Actions.
12. `GOVERNANCE_PERMITS` is empty and nothing in `docs/` opens it.
15. Fourteen gap-router proposals exist and nothing decides them.
16. Twenty architecture proposals exist and nothing decides them.
18. `rel-kind:complement` is stored as both symmetric and asymmetric. Still the
    cheapest real decision on the list.
19. Twenty-two editorial recommendations exist and nothing decides them.
20. The markup and `data/claims.json` disagree about what two passages are.
21. Nineteen sentences read as settled over claims graded Unresolved.
23. **New: ten UX findings and five testable proposals exist and nothing decides
    them.** Each is behind a pending approval. **They are proposals, not a work
    order**, and five of them are `human_only` because they change what a reader
    sees on a site with no deploy gate.
24. **New: nine components draw a status this agent could not establish is
    legible without colour.** Not a defect and not a clearance — an open
    question, and the only thing that closes it is somebody opening the page.
    `node agent/ux/cli.mjs --as-of <date> --open` lists them with the bytes.
25. **New: the site has no navigation in its markup, and the `<noscript>` notice
    does not say so.** Finding 3. This is the one on the list a reader can meet
    today with scripting off.
26. **New: `index.html` has no pre-paint theme bootstrap.** The six tool pages
    carry one inline; the brief consults `prefers-color-scheme` in `app.js`
    instead. Noticed while narrowing question 2's false positive and NOT filed
    as a finding — no lens establishes what it costs a reader, and filing it
    would have been an observation dressed as a measurement. Recorded here so the
    next session can decide whether it is one.

## Next session

**A — decide something.** There are now **seventy-one** proposals outstanding
across four agents (14 gap-router, 20 architecture, 22 editorial, 15 UX) and not
one has ever been decided. The chain runs finding → proposal → `ApprovalRequest`
and stops. Issue 18 remains the cheapest: one field, five records, one word.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and still the blocking dependency for everything built since.

**C — the applied half, and the record that a human applied it.** Still missing:
the `ChangeRecord` saying a human applied a proposal, so the next run does not
propose it again.

**D — new: do the manual pass.** `agent/ux/` decided what a static read can
decide and produced twelve open questions saying what it could not. Somebody
running `.agents/skills/ux-audit/references/manual-checks.md` against
`python3 -m http.server 8000` would close most of them, and it needs no code.

### Exact next objective

**B**, then **C**. A and D are decisions and a pass, and neither needs code.
B is:

```
gh workflow run source-scout.yml -f mode=mock -f dry_run=true
```

then, once a live retrieval succeeds, the full chain, every step carrying
`parent_run_id`:

```
node agent/verifier/cli.mjs             --records <trace-id>
node agent/integrate/cli.mjs            --records <trace-id> --as-of <date>
node agent/detector/cli.mjs             --records <trace-id> --as-of <date>
node agent/depth/cli.mjs                --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs       --as-of <date> --gaps <depth-trace-id> --refusals
node agent/architect/cli.mjs            --as-of <date> --gaps <depth-trace-id> --aside
node agent/proposals/editorial/cli.mjs  --as-of <date> --changes <detector-trace-id> --no-change
node agent/ux/cli.mjs                   --as-of <date> --propose --open
node agent/observability/cli.mjs        ux --backlog --open
```

## Anything the next agent must know

- **`agent/ux/` opens no page, and every record says so in a blocking open
  question.** If you are tempted to soften that — to write "screen readers
  announce this as…", to fill in a contrast ratio from a comment in
  `css/tokens.css`, to describe how something looks — you are making this
  project's own honesty worse than whatever you found. `boundary.mjs` refuses
  the phrasing and the suite proves the refusal fires.
- **An open question is a deliverable, and there are more of them than
  findings.** Deleting one to shorten a report turns "could not be settled
  without opening a page" into "nothing there".
- **A count is not a quote.** Two lenses filed a composed sentence behind a real
  `file:line` and the suite's byte-check caught both. `measurement` is the kind
  for a count, and the locator says what was counted over.
- **The three false positives above are why the checks are shaped as they are.**
  Tokenised class matching, both attribute syntaxes, and "mixed is undecidable"
  each exist because a draft without them reported a defect that was not there.
- **The hypothesis is the one thing in this directory that is not derived**, and
  it is typed as a contested interpretation for that reason. A recipe per lens is
  where it lives; a finding whose lens has no recipe is refused rather than
  improvised.
- **`asOf` is an argument, everywhere.** Unchanged.
- Before declaring anything done: the twelve `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline.

## Anything the next agent must NOT change

Carried forward, still binding, plus this session's:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not act on a UX proposal because it exists.** Fifteen records are
  outstanding, five of them `human_only` changes to what a reader sees, on a site
  where a push to `main` publishes and there is no deploy gate. They are
  proposals, not a work order.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative. It
  now has THREE reports — an architecture finding, an editorial finding, and this
  session's measurement of what it costs — and three reports are no more a work
  order than one.
- Do not modify `data/*.json` or any page in a session not scoped for that work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- **Do not let a UX finding carry a drafted value.** The contract refuses it, the
  suite asserts it over every record, and SESSION 16's brief says the agent does
  not redesign the site. Loosening it is the one change in `agent/ux/` that
  cannot be made safely.
- **Do not let a proposal invent a design token.** Two checks exist because
  either alone could be edited away: `agent/ux/tokens.mjs` reads the stylesheets,
  and the contract requires an open question for any token added.
- **Do not remove the `measurement` evidence kind from this agent's output** by
  making every extract a `repository_file`. A count filed as a quote is a
  fabrication with a checkable-looking locator.
- **Do not turn an open question into a finding** to make the audit look more
  decisive, and do not turn one into a clearance. Nine components are neither
  legible nor illegible on this evidence, and saying either would be inventing a
  result.
- Do not reimplement `evidenceGrade` or `familyOf` in the agent layer.
- Do not add `retrieved_document` to `MINTABLE_EVIDENCE`.
- Do not add an id store, and do not change the id shapes in
  `agent/observability/ids.mjs`.
- Do not relax the contract gateway's rejection of anything malformed or
  `simulated`.
- Do not move `degraded` into a stored field. Do not move redaction to the read
  path, and do not raise `MAX_STRING`.
- Do not add an entry to `GOVERNANCE_PERMITS` without the repository owner naming
  the document that grants it.
- Do not relax the rule that `create_taxonomy_term` is `human_only`, and do not
  let `agent/architect/` propose a taxonomy term.
