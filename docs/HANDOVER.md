# HANDOVER

**Last updated:** SESSION 20 · 3 September 2026
**Branch:** `claude/agent-8-implementation-qa-4l2tam`, cut from `main` at `2736ae6`.
**Base commit:** `2736ae6` on `main` ("Merge SESSIONS 18 and 19: Agent 9 and the
browser suite").
**Merged into `main`** — the session prompt instructed it ("Merge to main only
after existing validators and relevant tests pass"). That is the authorisation
`AGENTS.md` requires for a push to `main`. All fifteen suites, the contract check
and all four validators were re-run **on the merged tree**: 812 pass, 18/18
satisfiable, 0 errors, 106 unverified, the same five `design-qa` warnings by file
and line.

**The stale-`main` check was run on `main` itself this time.** SESSION 18/19's
first draft claimed the trap had not fired, on the strength of the working branch
being current — a different question — and local `main` turned out to be 47
commits behind. This session ran `git log main..origin/main` and
`git log origin/main..main` before touching anything, and both were empty.

**THE LIVE SITE IS BYTE-FOR-BYTE UNCHANGED**, checked rather than asserted:
`git diff 2736ae6..HEAD` over `data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`,
every `*.html`, `style.css`, `app.js`, `README.md` and `CLAUDE.md` is **empty**.
The monitor hashes the whole tree around every run and reports whether it changed;
it did not.

**Nothing was fixed that the monitor found.** Three defects from SESSION 19 stand,
the security finding in §6 stands, and the fifteen duplicated facts stand. A
measured defect is not an authorisation, and a session that built the instrument
and then acted on its first readings would have skipped the decision the whole
governance chain exists to require.

---

## Current milestone

**SESSION 20 — complete.** The Website Health Monitor, `agent/health/`, Agent 10.
The reference document is **`docs/HEALTH-MONITOR.md`**; this file is the handover only.

---

# SESSION 20 — the Website Health Monitor

## What was built

The eleventh agent, and the first whose subject is the SYSTEM rather than any part of it:
the site a reader loads, the corpus that site argues from, and the machinery that produced
both. `docs/AGENT-ROLES.md` §10 has described the Observability role since SESSION 01;
`agent/observability/` gave it a trace model, and this gives it the numbers.

**Forty-four metrics across three domains that are never summed.** 10 public website, 10
knowledge, 24 control plane — the last including the seven security-boundary checks, filed
there because that is what they protect.

## The three refusals this session is built around

**1 · THERE IS NO OVERALL SCORE.** `agent/health/model.mjs` exports `overallScore()`, and it
**throws**, with the reasoning, at the exact place somebody would reach for one. The three
domains fail differently: a broken link costs a reader a click, a false statement about EU
law costs them a decision they cannot take back, and an unaudited approval costs the system
its provenance and is invisible to every reader. A mean says none of that and invites raising
the number by improving the cheapest domain. The refusal is also recorded as a decision on
every run's trace, with the three alternatives that were not taken, so it can be seen to have
held rather than taken on trust.

**2 · `unmeasurable` IS NEVER ZERO.** Three states — `measured`, `unmeasurable`,
`not_applicable` — and an unmeasurable carries a **null** value, a `why`, and what would be
needed. Two metrics can never be measured here and reporting either as 0 would be the exact
substitution `AI-SAFE-BOUNDARIES` §0.3 and §0.4 prohibit:

- **Deployment failures.** No telemetry, and nothing has ever fetched the deployed origin —
  the network policy refuses it.
- **Authentication failures.** A 0 would read as "no failed logins" when the truth is "there
  is no login". The metric points at the MISSING CONTROL instead, which is where a missing
  control belongs.
- **Control Room availability** is `not_applicable`: SESSION 21 builds it, and neither 0% nor
  100% would be true. `agent/observability/server.mjs` is a development viewer, and calling
  it a Control Room would overstate both what exists and what is protected.

Six more public-website metrics report unmeasurable whenever the browser suite did not run. A
report saying "0 console errors" because nobody opened a page would be the worst line this
monitor could produce.

**3 · A LOWER NUMBER IS NOT AUTOMATICALLY HEALTHIER.** Five metrics carry
`direction: 'not_a_score'`, and `defineMetric` **throws** if one is re-labelled — the
unverified count, the provenance gaps, the verification gaps, the blocking open questions and
the rejected proposals. Every cheap route down is a prohibited action under
`AUTONOMY-POLICY.md`: clearing `requires_verification`, attaching a plausible substitute,
bulk-stamping `last_verified`, removing a `blocks` flag. **A rise in the first four is usually
good news** — it normally means somebody examined a record nobody had examined. The CLI marks
them `=` rather than `!`, `summarise()` counts them apart from findings, and `movement()`
reports them in a list that never says "improved".

## Every metric declares eight things, and the model refuses one that does not

Name, definition, source, calculation, update frequency, interpretation, limitations, and
public-or-private — all mandatory, all checked at definition time, so SESSION 20's
requirement is a gate rather than a convention. `limitations` is never empty and the suite
asserts it is longer than a fragment: a metric that cannot say what it fails to see is a
number somebody will quote out of context.

`node agent/health/cli.mjs --metrics` prints the whole register and runs nothing.

## What it found

**PUBLIC WEBSITE** — 9 measured, 1 unmeasurable. Three findings, all already known: 3 browser
regressions, 2 accessibility failures, 1 navigation failure — issues 25, 27 and 28.

**KNOWLEDGE** — 10 measured. Evidence coverage 76.9% of 91 claims. 106 unresolved records,
matching §12 exactly. **15 facts stored in two places with no drift check, one already
drifted** — the `__CONTENT__` hazard AGENTS.md has recorded since SESSION 00, now MEASURED
rather than recalled. 1 contradictory record: issue 18, `rel-kind:complement`. 6 fact-typed
claims whose evidence cannot carry a fact.

**CONTROL PLANE** — 0 agent failures, 0 policy violations, 0 self-approved decisions, 0
misclassified proposals, **0 changes ever applied to the legal record by an agent.**

## The security finding

`agent/observability/server.mjs` serves **eleven `/api/` endpoints** over the whole trace
store — agent inputs and outputs, decisions, approvals, provenance — and performs **no
authentication and no authorization on any of them**. Its only control is that `host`
DEFAULTS to `127.0.0.1`.

**A default is not a control.** `serve({ host })` accepts any value; a caller passing
`0.0.0.0` exposes the entire store with nothing in the request path to object. The monitor
does not infer this: it starts the server on an ephemeral loopback port and asks each route
with no `Authorization` header and no cookie. **Nine of the eleven return data**, two of them
tens of kilobytes. Nothing returns 401, because nothing asks.

That is defensible for a local development viewer, which is what its own header says it is.
It is recorded because **SESSION 21 builds a Control Room**, and one that reused this server
would inherit a privileged API whose only protection is a default somebody can override.

### The false positive that shaped the check

The first draft of `AUTHZ_SIGNALS` counted a bare `403` and reported the server as HAVING
server-side authorization — on the strength of `json(res, { error: 'forbidden' }, 403)` for a
path resolving outside the viewer directory. **That is a path check.** It refuses a traversal
and makes no decision about who the caller is, and counting it turned the largest finding in
the file into a pass. A status code is not a control. The suite now plants exactly that
server and asserts `has_authz` is false.

## A correction to SESSION 18

`publicSurface()` walked the filesystem. Publication is **GitHub Pages serving `main`**, and
`main` carries **tracked files only** — a git-ignored run artifact has never been in a commit
and is not published. The walk reported `agent/records/`, `agent/observability/runs/` and this
session's own health history as PUBLISHED, which is a false alarm, and a security check that
cries wolf about three directories on every run is one people learn to ignore.

It now reads `git ls-files`, reports untracked files separately, distinguishes "excluded by
the deployment" from "absent because nobody committed it", and falls back to the walk **saying
so** when git cannot be consulted — overstating the surface is the safe direction.

**`agent/health/selftest.mjs` found this** by asserting the health record was not in the
published surface, and finding it there.

## Public and private

`publicSubset()` is a **whitelist**. Three deliberate acts are needed before anything
operational reaches a public view: set `visibility`, write a `public_justification`, and pass
the definition gate — which refuses a control-plane metric marked public without one. The
rejected alternative was a `redact()` stripping known-sensitive fields; its failure mode is a
new private metric nobody adds to the deny list, public by default. The whitelist's failure
mode is a public metric left private: a report nobody sees rather than a leak.

**22 publishable, 22 withheld, 0 leaked.** Only two control-plane metrics are public —
proposals awaiting a human, and changes an agent has applied to the site (0, and a reader of a
site about EU law is entitled to know it). `publicReading()` drops `detail` and `evidence`
WHOLESALE rather than filtering named keys, and the suite checks for leaks over the SERIALISED
view rather than the structure, because a structural check verifies the shape somebody wrote.

## The historical record

`agent/health/history/health.jsonl`, append-only, **git-ignored** — and that is a boundary
decision, not a convention: it holds private control-plane data, and this repository publishes
its whole tree. A `.gitignore` entry is not a security boundary and `agent/health/` says so
rather than pretending otherwise.

`movement()` compares against the previous entry with one rule doing most of the work: **a
metric is compared only where both entries measured it.** Comparing a run that had a browser
against one that did not would report six improvements or six regressions depending on which
way round they fell, and both would be fabrications.

## Files changed

```
agent/health/model.mjs            (new — the metric contract, three states, the score refusal)
agent/health/gather.mjs           (new — the evidence once, and the loopback probe)
agent/health/public.mjs           (new — 10 metrics)
agent/health/knowledge.mjs        (new — 10 metrics)
agent/health/control.mjs          (new — 17 metrics)
agent/health/security.mjs         (new — 7 checks, and the route/auth analysis)
agent/health/metrics.mjs          (new — the registry and the public subset)
agent/health/history.mjs          (new — the historical record and movement)
agent/health/monitor.mjs          (new — Agent 10)
agent/health/cli.mjs              (new)
agent/health/selftest.mjs         (new — 55 tests)
agent/health/README.md · agent/health/history/README.md   (new)
docs/HEALTH-MONITOR.md            (new — the reference document)

agent/implement/boundary.mjs      (publicSurface reads git ls-files — the correction above)
agent/implement/checks.mjs        (the health suite joins AGENT_SUITES)
agent/implement/selftest.mjs      (R5 sharpened for the new surface model)
agent/observability/server.mjs    (a `quiet` option, for the probe)
agent/observability/query.mjs     (healthState, into loadTrace)
agent/observability/cli.mjs       (the `health` command)
.github/workflows/qa.yml          (the health job)
.gitignore                        (agent/health/history/, with the reason)
AGENTS.md · docs/AGENT-ROLES.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`, `i18n/` and
`fonts/`, all four validators in `tools/`, `style.css`, `app.js`, `README.md`, `CLAUDE.md`,
and every contract in `agent/schemas/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/health/selftest.mjs` | **55 pass · 0 fail** (new) |
| `node --test agent/implement/selftest.mjs` | **55 pass · 0 fail** (54 before; R5 gained a test for the corrected surface model) |
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
| `node --test agent/browser/selftest.mjs` | 19 — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 0 invalid records from this session's real runs |

**812 tests across fifteen suites, all passing** (756 before this session).

The extra test beyond 756 + 55 is in `agent/implement/selftest.mjs`: R5 gained a check that
the published surface is what git tracks rather than what is on the machine, which is the
correction described under "A correction to SESSION 18" above.

Also run as live verification: `node agent/health/cli.mjs --as-of 2026-09-03` (44 metrics),
`--metrics`, `--public`, `--history`, `--no-browser`, and
`node agent/observability/cli.mjs health --readings`.

## Known limitations

1. **The monitor measures what this repository can see, which is less than what matters.**
   Nothing has fetched the deployed site, no URL has been retrieved, no source document
   opened, no screen reader run, no contrast computed.
2. **Nine metrics report `unmeasurable` in a typical run.** That is the honest state, not a
   gap in the work — but a reader skimming the numbers must read the coverage line, and the
   history stores it for exactly that reason.
3. **The knowledge metrics check the SHAPE of evidence, not what a source says.** A claim
   typed as a fact with a tier:1 source that does not support it passes every check here.
4. **The security checks read source and match signals.** A mechanism they do not recognise
   reads as absent — a false positive, the safe direction, and one the suite tests for by
   planting a server that DOES authenticate.
5. **`PRIVILEGED_INTERFACES` is an allowlist.** A new server nobody registers is not checked.
6. **`incomplete_entities` overstates and `duplicate_facts` understates**, each for a reason
   stated in its own `limitations`.

## Unresolved issues, carried forward

SESSION 19's 1–31 stand unless noted.

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

32. **New: the privileged API has no authentication and no authorization.**
    `agent/observability/server.mjs` serves eleven `/api/` endpoints over the
    whole trace store and checks nothing; its only control is a bind host that
    DEFAULTS to loopback, and a default is not a control. Measured, not inferred:
    the health monitor starts it on an ephemeral loopback port and finds **nine of
    the eleven return data to a request with no credential**. Defensible for a
    development viewer; **SESSION 21's Control Room must not inherit it.**
    `node agent/health/cli.mjs --as-of <date> --detail`, `docs/HEALTH-MONITOR.md` §6.

33. **New: 15 facts are stored in two places with no drift check, and one has
    already drifted.** The fourteen part titles and the standfirst exist in both
    `data/brief.json` and the `__CONTENT__` blob inlined at `index.html:361`, and
    `meta.standfirst` disagrees between them. AGENTS.md has carried this as a
    hazard since SESSION 00; it is now MEASURED rather than recalled, by
    `knowledge.duplicate_facts`. Still not fixed, and still not a work order.

34. **New: 6 fact-typed claims have evidence that cannot carry a fact** — no
    source, `supports:context` only, or the self-reference placeholder. A claim
    typed as a fact renders as law on the site.
    `knowledge.unsupported_factual_statements`.

35. **New: `.gitignore` is doing the work of a publication boundary for three
    directories.** `agent/records/`, `agent/observability/runs/` and
    `agent/health/history/` all hold control-plane data and are absent from the
    deployment only because nobody committed them. One `git add -f` undoes it and
    nothing in this repository would object. Distinct from issue 29, which is
    about there being no exclusion mechanism at all.

31. **Two UX proposals now assert something that is no longer true.**
    `agent/ux/proposals.mjs` writes "this repository has no browser harness and
    no dependency budget for one" into the open question on every browser test it
    proposes. SESSION 19 built one, with no dependency budget spent. The sentence
    was accurate when written and is not now. **Not edited here** — rewriting
    another agent's recipe to change what its records assert is exactly the
    scope-widening Agent 9 exists to refuse, and it is Agent 8's own file. It
    needs a one-line change in `agent/ux/proposals.mjs` and a re-run.

## Next session

**A — decide something.** Unchanged and now four sessions old. Seventy-one proposals across
four agents, not one decided. SESSION 18 built somewhere for a decision to land:

```
node agent/implement/cli.mjs queue --why
node agent/observability/cli.mjs implement --refusals
node agent/implement/cli.mjs decide --proposal <id> --grant --by "<your name>"
node agent/implement/cli.mjs run --as-of <date> --proposal <id>            # rehearse
node agent/implement/cli.mjs run --as-of <date> --proposal <id> --apply
```

Most proposals fail three gates besides `approved`, and two of those cannot be closed by a
decision at all. Issue 18 remains the cheapest real decision: one field, five records, one
word — and `knowledge.contradictory_records` now reports it on every health run.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since SESSION 06.

**C — the applied half.** Half-closed since SESSION 18: `ChangeRecord` is produced whenever
something is applied, and nothing has been applied because nothing has been approved.
`WebsiteChange` is still produced by nothing.

**D — do the manual pass.** The perceptual open questions — contrast, screen readers, what a
layout looks like — need a person. `.agents/skills/ux-audit/references/manual-checks.md`.

**E — fix the three defects the browser found**, or decide not to. Issues 25, 27, 28.

**F — new, and it is SESSION 21's problem before it is anybody's: do not let the Control Room
inherit the unauthenticated API.** Issue 32. `agent/observability/server.mjs` has eleven
privileged routes, no authentication, no authorization, and a bind host that is a parameter
with a loopback default. Nine of them answer an unauthenticated request today. A Control Room
built on it would be the failure protocol §11–§13 describes, and the health monitor would
report it on every run — which is not the same as preventing it.

### Exact next objective

**F**, then **A**.

F is SESSION 21's own subject and the monitor has already written the acceptance criteria: a
Control Room is done when `control_plane.privileged_routes_without_auth` and
`control_plane.privileged_routes_without_authz` reach 0, when
`control_plane.privileged_responses_without_authorization` reaches 0, and when
`control_plane.control_room_availability` stops being `not_applicable` **without**
`control_plane.control_room_assets_published` rising above 0. Run

```
node agent/health/cli.mjs --as-of <date> --detail
node agent/health/cli.mjs --as-of <date> --series control_plane.privileged_routes_without_auth
```

before and after. The second command is why the history exists.

A is unchanged and needs no code. Start with the cheapest decision on the list and watch the
whole chain run.

The full chain, every step carrying `parent_run_id`:

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
node agent/health/cli.mjs               --as-of <date>
node agent/observability/cli.mjs        health --readings
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
- **A number is not a verdict, and five of them must never be optimised.** The unverified
  count, the provenance gaps, the verification gaps, the blocking open questions and the
  rejected proposals are marked `not_a_score`. If you find yourself trying to move one of
  them, read `docs/HEALTH-MONITOR.md` §4 first: every cheap route down is a prohibited
  action, and a RISE in the first four usually means somebody did real work.
- **`unmeasurable` is not zero, and the monitor will not let you write it as one.** Nine
  metrics report it in a typical run. If you are tempted to make one return 0 so the report
  looks cleaner, you are proposing to report an absence of instrumentation as an absence of
  problems.
- **There is no overall health score and there must not be one.**
  `agent/health/model.mjs overallScore()` throws on purpose. The three domains fail
  differently and a mean says none of it.
- Before declaring anything done: the fifteen `--test` suites,
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
- **Do not delete an `unmeasurable`, a `not_a_score` label, or the `overallScore()` throw.**
  Each is load-bearing, each makes a report longer and less satisfying, and each exists
  because the shorter version would be a lie.
- **Do not commit `agent/health/history/`.** It holds private control-plane data and this
  repository publishes its whole tree.
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
