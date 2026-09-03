# HANDOVER

**Last updated:** SESSIONS 18 and 19 · 3 September 2026
**Branch:** `claude/agent-8-implementation-qa-4l2tam`, cut from `main` at `8eaf398`.
**Base commit:** `8eaf398` on `main` ("Record in the handover that SESSIONS 16 and 17
are merged").
**Merged into `main`** — the session prompt instructed it explicitly ("At the end of
the session, merge everything into branch main"). That is the authorisation
`AGENTS.md` requires for a push to `main`, because `main` publishes to the live
site and, until this session, there was no CI at all. All fourteen suites, the
contract check and all four validators were re-run **on the merged tree** before the
push: 756 pass, 18/18 satisfiable, 0 errors, 106 unverified, the same five
`design-qa` warnings by file and line.

**The stale-`main` trap: checked, and it did not fire this time.** `git fetch --all`
was run first, both `main..origin/main` and `origin/main..main` were checked, and
the working branch was already at `origin/main` (`8eaf398`). Four consecutive
sessions found local `main` between 32 and 45 commits behind. **Keep running the
check** — the reason it did not fire is that this container was fresh, not that the
trap is gone.

**This session had TWO objectives and they landed in ONE commit**, for the reason
SESSIONS 14/15 and 16/17 both gave. SESSION 18 built the Implementation and QA
agent; SESSION 19 built the browser regression suite. They are not separable: a
SESSION-18-only tree would have had `agent/implement/checks.mjs` importing a
`agent/browser/runner.mjs` that did not exist, because SESSION 18's own requirement
7 — "browser QA cannot be silently skipped when required" — has nothing to enforce
until SESSION 19's suite exists. Splitting it would have meant writing a version of
the agent nobody ran.

**THE LIVE SITE IS BYTE-FOR-BYTE UNCHANGED**, and this was checked rather than
asserted: `git status --porcelain` over `data/`, `js/`, `css/`, `i18n/`, `fonts/`,
`tools/`, every `*.html`, `style.css`, `app.js`, `README.md` and `CLAUDE.md` is
**empty**. The browser suite hashes the whole tree around every run and reports
whether it changed; it did not.

**Three real defects were found and NONE was fixed.** See "What the browser found"
below. Each is Class C interface work needing a proposal and a human decision —
which is precisely what SESSION 18's agent refuses to act without. Fixing them
inside the session that built the gate would have been the first thing the gate
exists to prevent.

**No discrepancy between the handover and the code.** Every number in
`docs/HANDOVER.md` at `8eaf398` was re-measured rather than trusted: 683 tests
across twelve suites, 18/18 contracts satisfiable, 0 errors and 106 unverified
across the four validators, the same five `design-qa` warnings.

---

## Current milestone

**SESSIONS 18 and 19 — complete, in two parts.**

**SESSION 18 — Agent 9, Implementation and QA** (`agent/implement/`).
**SESSION 19 — the browser regression suite** (`agent/browser/`).

The reference documents are **`docs/IMPLEMENTATION-QA.md`** and **`docs/BROWSER-QA.md`**;
this file is the handover only.

---

# SESSION 18 — the Implementation and QA Agent

## What was built

The tenth agent, and the only one that may write to this repository. `docs/AGENT-ROLES.md`
§8 has described the Implementation/QA role since SESSION 01 and nothing had filled it.
Everything upstream ends in a proposal behind a pending approval; **this is the first agent
whose output is a decision about whether to act.**

**It is Agent 9, not Agent 8.** The brief calls it Agent 8; Agent 8 is the UX/UI Auditor
(SESSIONS 16/17). The brief's numbering predates it, exactly as SESSION 13's and SESSION
16's did. This is the third session to make the note. Recorded rather than resolved by
renumbering somebody else.

**No nineteenth contract.** `ImplementationProposal`, `QAResult`, `ChangeRecord`,
`WebsiteChange` and `ApprovalRequest` have all existed since SESSION 04 and three of them
had been produced by nothing. Two contract rules found real bugs in the agent during
construction and are worth naming: `QAResult` refuses an evidence entry with a null
`supports`, and it refuses a `verdict` with no `epistemic.inference` entry saying how it was
reached. Both were defects in `implementer.mjs`, caught by the gate rather than by a test
somebody remembered to write.

## Where an approval actually lives — the hard part

The brief's sentence is *"the approval state MUST be treated as governed system state. Do
not rely on a prompt instruction, filename, comment, frontend state, or manually supplied
flag."*

The problem is concrete. Every `ApprovalRequest` in this system lives in
`agent/records/*.jsonl`, which is **written by agents** and git-ignored. An agent that
wanted an approval could append a record with `state: "granted"` naming anybody.

So **an `ApprovalRequest` in the agent record store is read as a REQUEST and never as a
GRANT**, whatever its `state` says — and every agent-written approval claim is **reported**
rather than silently ignored, because silently ignoring one looks identical to not having
checked. A grant lives only in `agent/implement/decisions/decisions.jsonl`: git-**tracked**,
written by one command, requiring a named human who is not an agent, and **bound to the
sha256 of the proposal**. Edit the proposal afterwards and the approval is void, not carried
onto a wider scope.

**The fingerprint deliberately excludes `trace_ref` and `created_at`.** Ids here are
content-derived (SESSION 13), so re-running a producing agent over an unchanged corpus mints
the same proposal with a fresh trace. An approval that went void for that would be an
approval nobody could ever keep — and the suite asserts both halves.

**This is not authentication, and the document says so rather than implying otherwise.**
Protocol §11 and §13 want an authenticated actor and server-side enforcement. This is a
static site with no server. Anybody who can write to the working tree can write a grant.
What the ledger gives is a single hashed home, git attribution, and a refusal of the four
forgeries that do **not** require write access. The gap is open question 1 in
`docs/IMPLEMENTATION-QA.md` §9 and it needs SESSION 21's Control Room.

## What it did: 35 refusals, 0 implementations

Run against the real record store after `agent/ux/`, `agent/architect/` and
`agent/proposals/editorial/`:

```
35 proposal(s) considered · 0 implemented · 0 reverted · 35 refused

approved                35   nothing in the ledger has decided any of them
approval_attributable   35   there is no decision to attribute
scope_defined           35   every operation carries a null "proposed" value
provenance_complete     35   every proposal carries a blocking open question
```

**That is the deliverable.** An implementation agent whose first run implemented something
would have found an approval that does not exist. The third and fourth rows matter as much
as the first: `agent/ux/` and `agent/proposals/editorial/` deliberately draft no value and
carry README limitation 7 as a blocking question, so **those proposals are not implementable
by anybody** until a person writes the value and does the manual pass. The gates say that by
name rather than failing generically.

The happy path — open a context, apply, diff, roll back, **verify the rollback by
re-hashing** — is exercised in `agent/implement/selftest.mjs` against a throwaway git
repository. It is exercised there because granting an approval is a human act and this
session had no authority to perform one.

## The four design decisions

1. **The baseline is PARSED out of `docs/CURRENT-ARCHITECTURE.md` §12, not retyped.** A
   constant would be the second home the whole architecture exists to prevent. If §12 stops
   being parseable, `readBaseline()` **throws rather than guessing** — a wrong baseline is
   inherited by every later comparison and nothing downstream can tell.
2. **Three verdicts, not two.** `at_baseline` · `regression` · **`below_baseline`**. Four
   `design-qa` warnings where five are recorded means something was fixed **or a check
   stopped firing**, and the second is what AUDIT F-10 found once already.
3. **The permitted set is DERIVED from the proposal and is not an argument.** `preflight`
   takes an id and a context of stores; it has no `permittedFiles`, no `skip`, no
   `assumeApproved`, and the suite asserts that by reading its signature. A permitted set the
   caller can supply is one the caller can widen, and the caller is the thing being
   constrained.
4. **It reverts itself, on every autonomy class.** Class B's condition is a full revert if a
   validator fails; this applies it to everything. The revert is **verified by re-hashing**,
   never asserted from a command not throwing.

## The paths no approval can reach

Narrower and stronger than the red tier, because red-tier work can be proposed and then
approved: `tools/_refsweep.mjs` and `tools/_review10.mjs` (editing one is how it gets run),
`agent/implement/decisions/` (an agent that can write its own approvals is not governed by
them), `agent/schemas/` (an agent that can edit the gate has bypassed it), `.git/` and
`.github/workflows/`.

## The public/private boundary — a standing finding, not a control

**There is no separation mechanism in this repository.** GitHub Pages serves `main` at the
repository root; there is no `_config.yml`, no `.nojekyll` and no exclude list. `agent/`,
`docs/` and the approval ledger are in the same deployment as `index.html`, and **a Control
Room page added in SESSION 21 would be public the moment it was pushed.** Protocol §10 says
so itself: hidden routes and unlisted pages are not security mechanisms.

**Established and inferred are kept apart.** That there is no config and no exclude list is
read from the tree. That the live site therefore serves `agent/` is an inference from GitHub
Pages' documented default and has **not** been confirmed by fetching the deployed site — the
network policy refuses that origin, exactly as `CURRENT-ARCHITECTURE` §13 records.

The secret scan runs over two surfaces. **The 60 files a reader's browser loads carry no
credential** — a credential there is an error, unconditionally, and the suite plants one to
prove the scanner is not vacuous. The other eight hits are **deliberate synthetic credentials
in the fixtures that prove `agent/observability/redact.mjs` works**. They are classified and
counted, **never suppressed**: deleting them would be weakening a test to make a check pass,
and allow-listing the files would hide a real key added to one of them next week. Every match
is redacted in the output — a boundary check that prints what it found has published it.

---

# SESSION 19 — the browser regression suite

## What was built

The first thing in this repository that opens a page. `CURRENT-ARCHITECTURE` §12 ended with
*"There is no test runner. The Playwright suites used during development live outside this
repository."* This is the answer, and it had to be one that **installs nothing**: no
`package.json`, no lockfile, no Playwright. It drives a browser already on the machine over
the Chrome DevTools Protocol using Node 22's global `WebSocket`.

That is not minimalism for its own sake. Adding a dependency is Class D, and
`implementation-proposal.mjs` refuses one by contract. **A suite that had to violate the
architecture to test it would be testing a different repository.**

```
121 checks · 116 pass · 3 fail · 2 undecidable · 17 areas
Chromium 141.0.7390.37 · 1,397 requests, every one to the local origin
```

**Three results, not two.** `pass` · `fail` · **`undecidable`** — established neither a
defect nor its absence, and reported as neither. The runner counts undecidables separately
and never folds them into the pass count.

**Exit 2 means no browser was found and the suite did not run.** Not 0. A suite that exits 0
when it could not open a browser teaches a pipeline that green means checked, and that is the
substitution `AI-SAFE-BOUNDARIES` §0.5 prohibits. `--require-browser` makes it a hard failure
for CI, where nobody reads "skipped".

## What the browser found — three defects no validator here can see

**1 · With scripting off, the site has no navigation, and the `<noscript>` notice does not
say so.** `docs/UX-AUDIT.md` finding 3 established from the source that five of seven pages
are linked from no markup anywhere. This is the measurement: `instruments.html` with script
execution disabled links to **none** of the six top-level pages, and the `<noscript>` notice
— which lists eight things that will not appear — does not list navigation.

**2 · The skip link is the tenth focusable element in the rendered page.** Every page carries
`<a class="skip-link">` as the first element in `<body>` and `design-qa.mjs` confirms it
resolves. But **`js/shell.js:258` inserts the chrome at `document.body.firstChild`, ahead of
it.** A keyboard reader must tab through the entire navigation to reach the link that skips
the navigation. Nothing that reads markup can see this: the markup is correct.

**3 · `enforcement.html` jumps h2 → h5 in its rendered outline.** Each pipeline stage renders
as an `<h5>` directly under the `<h2>` naming the company. `design-qa.mjs` checks heading
order in the markup, where those headings do not exist — `js/enforcement-page.js` creates
them.

**None is fixed.** Each is Class C interface work needing a proposal and a human decision.
Fixing them inside the session that built the gate would have been the first thing the gate
exists to prevent.

## The two false positives that shaped the harness

Recorded because they are why `cdp.mjs` is shaped as it is, and the next session should not
simplify them back.

- **A `keyDown` carrying `text` types the character as well as firing the binding.** The
  first draft opened the search palette with `key('/', { text: '/' })`, which fired
  `js/palette.js`'s binding **and** typed a slash into the input it had just focused. The
  palette searched for `/gdpr` and the check reported a working search as broken.
- **`localStorage` survives a reload and the language check writes to it.** Running it on the
  shared page left every later check reading an Italian DOM — observed as a heading-order
  finding reported against a page whose `lang` said `it`. The language check now runs in its
  own browser context.

Both were caught because a finding was checked against the site rather than filed.

---

## Files changed

```
SESSION 19
agent/browser/find.mjs        (new — locate a browser, or refuse and name every path)
agent/browser/serve.mjs       (new — the site over HTTP, ephemeral port, request log)
agent/browser/cdp.mjs         (new — the protocol client, on Node 22's global WebSocket)
agent/browser/checks.mjs      (new — the fifteen areas)
agent/browser/runner.mjs      (new — one run, and asQACheck())
agent/browser/cli.mjs         (new)
agent/browser/selftest.mjs    (new — 19 tests)
agent/browser/README.md       (new)
docs/BROWSER-QA.md            (new — the reference document)

SESSION 18
agent/implement/baseline.mjs      (new — §12, parsed)
agent/implement/ledger.mjs        (new — where an approval lives)
agent/implement/preflight.mjs     (new — the ten gates)
agent/implement/scope.mjs         (new — derived, then enforced against git)
agent/implement/boundary.mjs      (new — public website / private control plane)
agent/implement/checks.mjs        (new — validators, suites, browser QA, boundary)
agent/implement/apply.mjs         (new — context, exact edit, verified rollback)
agent/implement/implementer.mjs   (new — Agent 9)
agent/implement/cli.mjs           (new)
agent/implement/selftest.mjs      (new — 54 tests, incl. R1–R8)
agent/implement/README.md         (new)
agent/implement/decisions/README.md (new — and the ledger's home)
docs/IMPLEMENTATION-QA.md         (new — the reference document)

BOTH
.github/workflows/qa.yml          (new — the first CI this repository has had)
agent/observability/query.mjs     (implementState, into loadTrace and overview)
agent/observability/cli.mjs       (the `implement` command, --refusals)
AGENTS.md · docs/AGENT-ROLES.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`, `i18n/`
and `fonts/`, all four validators in `tools/`, `style.css`, `app.js`, `README.md`,
`CLAUDE.md`, and every contract in `agent/schemas/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/implement/selftest.mjs` | **54 pass · 0 fail** (new) |
| `node --test agent/browser/selftest.mjs` | **19 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | 139 — unchanged |
| `node --test agent/ux/selftest.mjs` | 73 — unchanged |
| `node --test agent/detector/selftest.mjs` | 66 — unchanged |
| `node --test agent/integrate/selftest.mjs` | 64 — unchanged |
| `node --test agent/proposals/editorial/selftest.mjs` | 61 — unchanged |
| `node --test agent/architect/selftest.mjs` | 52 — unchanged |
| `node --test agent/proposals/data/selftest.mjs` | 50 — unchanged |
| `node --test agent/verifier/selftest.mjs` | 45 — unchanged |
| `node --test agent/depth/selftest.mjs` | 43 — unchanged |
| `node --test agent/observability/selftest.mjs` | 40 — unchanged |
| `node --test agent/scout/selftest.mjs` | 32 — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 0 invalid records from this session's real runs |

**756 tests across fourteen suites, all passing** (683 before this session).

Also run as live verification, outside the standing suites:
`node agent/browser/cli.mjs` (121 checks, 3 fail),
`node agent/implement/cli.mjs queue --why` (35 pending),
`run --as-of 2026-09-03` (35 refused, 0 implemented),
`check --as-of 2026-09-03` (all four at baseline),
`boundary` (0 blocking, 9 warnings), and
`node agent/observability/cli.mjs implement --refusals`.

## Observability

`implementState()` derives the view at read time — `cli.mjs implement [--refusals]` and
`loadTrace`. It is built around the REFUSALS rather than the implementations, because that is
what this agent produces. It reports **which gate refuses most often**, which is the cheapest
thing to fix and nothing else in the system reports it.

The gaps it reports are the ones that matter in this layer: a run that implemented something
without a `QAResult`; a run claiming more implementations than it has `ChangeRecord`s for; a
run that found an approval claim in `agent/records/` and did not say so; a rollback that did
not verify; and a working tree dirtier than the run accounts for. Each is an implementation
agent quietly becoming an unaudited one.

## Known limitations

1. **The ledger is not authentication.** Anybody who can write to the working tree can write
   a grant. `docs/IMPLEMENTATION-QA.md` §9 open question 1; it needs SESSION 21.
2. **CI is not a deploy gate.** `.github/workflows/qa.yml` makes a failure visible. A push to
   `main` still publishes. Making it blocking needs a branch protection rule — repository
   configuration outside this tree.
3. **One browser, no screen reader, no contrast, no pixels.** README limitation 7 is
   unchanged. `docs/BROWSER-QA.md` §6.
4. **No visual regression.** Nothing is screenshotted or compared. A layout that renders
   without overflow and looks wrong passes every check.
5. **Nothing has confirmed what the deployed site serves.** The network policy refuses the
   live origin, so the public-surface finding is an inference, labelled as one.
6. **The `--apply` path has never run outside a sandbox**, because no proposal has ever been
   approved. The cycle is fully exercised in the suite against a throwaway git repository;
   it has not been exercised against this one, and it should not have been.

## Unresolved issues, carried forward

SESSION 17's 1–26 stand unless noted.

2. **No deploy gate — PARTIALLY MOVED.** The validators now run in CI on every
   push (`.github/workflows/qa.yml`, SESSION 18), so a failure is **visible**.
   There is still nothing between a push to `main` and the live site: making the
   workflow blocking needs a branch protection rule, which is repository
   configuration outside this tree and outside any agent's reach.
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
25. **The site has no navigation in its markup, and the `<noscript>` notice does
    not say so — NOW MEASURED.** SESSION 17 established it by reading the source;
    SESSION 19 loaded `instruments.html` with scripting disabled and confirmed it
    links to none of the six top-level pages. Still not fixed: Class C interface
    work needing a proposal and a decision.
26. **New: `index.html` has no pre-paint theme bootstrap.** The six tool pages
    carry one inline; the brief consults `prefers-color-scheme` in `app.js`
    instead. Noticed while narrowing question 2's false positive and NOT filed
    as a finding — no lens establishes what it costs a reader, and filing it
    would have been an observation dressed as a measurement. Recorded here so the
    next session can decide whether it is one.

27. **New: the skip link is the tenth focusable element in the RENDERED page.**
    Every page carries `<a class="skip-link">` as the first element in `<body>`
    and `design-qa.mjs` confirms it resolves — but `js/shell.js:258` inserts the
    chrome at `document.body.firstChild`, ahead of it. A keyboard reader must tab
    through the whole navigation to reach the link that skips the navigation.
    Invisible to every validator here, because the markup is correct.
    `node agent/browser/cli.mjs --only keyboard`.

28. **New: `enforcement.html` jumps h2 → h5 in its rendered outline.** Each
    pipeline stage renders as an `<h5>` directly under the `<h2>` naming the
    company. `design-qa.mjs` checks heading order in the markup, where those
    headings do not exist — `js/enforcement-page.js` creates them.

29. **New: the whole repository is inside the public deployment.** GitHub Pages
    serves `main` at the repository root with no `_config.yml`, no `.nojekyll`
    and no exclude list, so `agent/`, `docs/` and the approval ledger are
    published alongside `index.html`. **A Control Room page added in SESSION 21
    would be public the moment it was pushed.** This is an INFERENCE from GitHub
    Pages' documented default — nothing here has ever fetched the deployed site,
    and the network policy refuses that origin.
    `node agent/implement/cli.mjs boundary`.

30. **New: the approval ledger is not authentication.** Anybody who can write to
    the working tree can write a grant. It gives one hashed home, git
    attribution, and a refusal of the four forgeries that do not need write
    access — and no more than that. Protocol §11 and §13 want an authenticated
    actor and server-side enforcement, which a static site cannot host.
    `docs/IMPLEMENTATION-QA.md` §9.

31. **New: two UX proposals now assert something that is no longer true.**
    `agent/ux/proposals.mjs` writes "this repository has no browser harness and
    no dependency budget for one" into the open question on every browser test it
    proposes. SESSION 19 built one, with no dependency budget spent. The sentence
    was accurate when written and is not now. **Not edited here** — rewriting
    another agent's recipe to change what its records assert is exactly the
    scope-widening Agent 9 exists to refuse, and it is Agent 8's own file. It
    needs a one-line change in `agent/ux/proposals.mjs` and a re-run.

## Next session

**A — decide something, and it is now a one-line command.** Seventy-one proposals
across four agents and not one decided. Until SESSION 18 there was nowhere to
record a decision; there is now:

```
node agent/implement/cli.mjs queue --why
node agent/implement/cli.mjs preflight --proposal <id>
node agent/implement/cli.mjs decide --proposal <id> --grant --by "<your name>"
node agent/implement/cli.mjs run --as-of <date> --proposal <id>          # rehearse
node agent/implement/cli.mjs run --as-of <date> --proposal <id> --apply  # write it
```

**Read the refusals first.** `node agent/observability/cli.mjs implement --refusals`
says which gate refuses each proposal. Most of them fail three gates besides
`approved`, and two of those cannot be closed by a decision at all: an operation
with a null `proposed` needs somebody to write the value, and a blocking open
question about screen readers needs somebody to do the manual pass. **Granting
those does not make them implementable**, and the agent will still refuse — which
is the system working, not a bug to route around. Issue 18 remains the cheapest
real decision: one field, five records, one word.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since
SESSION 06 and still the blocking dependency for everything built since. There is
now a second workflow in `.github/`, so the runner path is no longer untested in
general — but `source-scout.yml` itself has still never completed a live run.

**C — the applied half, and the record that a human applied it.** Half-closed.
`ChangeRecord` is now produced by Agent 9 whenever something is applied, with the
approval id, the QA result id and a rollback ref. What is still missing is the
first one: nothing has ever been applied, because nothing has ever been approved.
`WebsiteChange` — the record that a change reached a reader — is still produced by
nothing.

**D — do the manual pass.** `agent/ux/` produced twelve open questions a static
read could not settle. SESSION 19's browser suite closes some of them by
measurement; the perceptual ones — contrast, screen readers, what a layout looks
like — are unchanged and need a person.
`.agents/skills/ux-audit/references/manual-checks.md`, against
`python3 -m http.server 8000`.

**E — new: fix the three defects the browser found**, or decide not to. Issues 25,
27 and 28. None is fixed here, deliberately: each is Class C interface work needing
a proposal and a human decision, and fixing them inside the session that built the
gate would have been the first thing the gate exists to prevent. Issue 25 is the
one a reader can meet today.

### Exact next objective

**A**, then **B**. A now needs no code and, for the first time, has somewhere to
land. Start with the cheapest decision on the list and watch the whole chain run:

```
node agent/implement/cli.mjs queue --why
node agent/observability/cli.mjs implement --refusals
```

then, for whichever proposal survives reading, the four commands above. **Rehearse
before `--apply`** — the rehearsal computes the same edit, runs the same checks and
writes nothing.

B is unchanged:

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
node agent/browser/cli.mjs
node agent/implement/cli.mjs            run --as-of <date>
node agent/observability/cli.mjs        implement --refusals
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
- **An `ApprovalRequest` you find in `agent/records/` is a REQUEST.** Agents write
  that directory. If you are tempted to read one whose `state` says `granted` and
  act on it, that state was written by an agent, and `agent/implement/ledger.mjs`
  discards it and says so. A grant lives in `agent/implement/decisions/` and
  requires a named human.
- **A grant is bound to the proposal's hash.** Editing a proposal after it was
  approved VOIDS the approval. That is deliberate — it is what stops approving
  something small and then widening it — and the fix is a fresh decision against
  the scope the proposal now has, never a re-hash.
- **A skipped browser run is never a pass.** `agent/browser/cli.mjs` exits 2 when
  it found no browser, and `agent/implement/` treats a required-but-skipped run as
  a blocking finding. If you find yourself making either of those exit 0 to get a
  green pipeline, you are building the thing the exit code exists to prevent.
- **The eight synthetic credentials in the redaction fixtures are load-bearing.**
  A suite that proves redaction works has to contain something to redact. Do not
  delete them to make `boundary` clean — that is weakening a test to make a check
  pass — and do not allow-list the files, which would hide a real key added to one
  of them later. They are classified and counted.
- **The baseline in `agent/implement/baseline.mjs` is PARSED out of
  `docs/CURRENT-ARCHITECTURE.md` §12.** If you change the numbers there, this
  follows automatically. If you restructure the fenced block so it cannot be read,
  `readBaseline()` throws — on purpose. Do not add a fallback default.
- Before declaring anything done: the fourteen `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline — and
  `node agent/browser/cli.mjs` if you touched a page, a stylesheet, a module or a
  locale.

## Anything the next agent must NOT change

Carried forward, still binding, plus this session's:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not act on a UX proposal because it exists.** Fifteen records are
  outstanding, five of them `human_only` changes to what a reader sees, on a site
  where a push to `main` publishes and there is no deploy gate. They are
  proposals, not a work order.
- **Do not fix the three defects the browser found on your own initiative.**
  Issues 25, 27 and 28 are real, reproducible and reader-facing, and every one of
  them is Class C interface work: a proposal, then a human decision. A measured
  defect is not an authorisation.
- **Do not make `.github/workflows/qa.yml` a deploy gate by editing the workflow.**
  It cannot be one from inside this tree — blocking needs a branch protection
  rule, which is repository configuration. A workflow that CLAIMED to gate
  deployment would be worse than one that says plainly it does not.
- **Do not add a `package.json`.** `agent/browser/` exists to prove the browser
  suite did not need one. Adding it later to "simplify" that code would spend the
  Class D budget the whole design avoided.
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
