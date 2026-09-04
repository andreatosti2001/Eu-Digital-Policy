# AGENTS.md

Operating instructions for any AI agent working in this repository.
**This is the canonical agent entry point.** `CLAUDE.md` points here; it holds no rules of
its own, because this project's first principle is one home per fact.

---

## What this is

**The European Legal Framework for the Digital World** — an analytical brief on the EU
digital acquis, published as a static site at
https://andreatosti2001.github.io/Eu-Digital-Policy/

It is a **production website with real readers who may act on what it says about EU law.**
It is not a prototype and not a scaffold.

The prose is the argument; everything the argument rests on is data. Every consequential
statement exists as a record in `data/claims.json`, typed, sourced, and graded by what those
sources can actually carry — with the grade *derived at render time* so it cannot drift from
the evidence it describes.

## Read these first, in this order

| Document | What it gives you |
|---|---|
| `docs/PROJECT-CONTEXT.md` | What the project is; the seven governing principles |
| `docs/CURRENT-ARCHITECTURE.md` | Rendering model, module topology, dependency map, tooling baseline |
| `docs/AI-SAFE-BOUNDARIES.md` | Green / amber / red tiers; the absolute prohibitions |
| `docs/AGENT-CONTRACTS.md` | The eighteen inter-agent contracts and the gate no record bypasses |
| `docs/OBSERVABILITY.md` | The trace model every agent run is instrumented through |
| `docs/SOURCE-SCOUT.md` · `docs/LEGAL-VERIFIER.md` · `docs/VERIFICATION-INTEGRATION.md` · `docs/CHANGE-DETECTOR.md` · `docs/DATA-DEPTH.md` · `docs/GAP-PROPOSALS.md` · `docs/KNOWLEDGE-ARCHITECTURE.md` · `docs/EDITORIAL-AGENT.md` · `docs/UX-AUDIT.md` · `docs/IMPLEMENTATION-QA.md` · `docs/HEALTH-MONITOR.md` | The eleven agents that exist, what each refuses, and what none of them may do |
| `docs/BROWSER-QA.md` · `docs/HEALTH-MONITOR.md` | The browser regression suite and the three health domains — what each measures, and what neither can see |
| `docs/CONTROL-ROOM.md` | The private control plane: the two security domains, authentication, authorization, the seven approval gates, the audit trail — and §11, what none of it proves |
| `docs/REGULATORY-IMPACT-MAPPING.md` | What a confirmed change reaches inside this website, and which half of it a machine may act on |
| `docs/HANDOVER.md` | Previous session's state and the current objective |
| `docs/AUDIT-2026-09-01.md` | Where the architecture above is **not enforced**, with evidence |
| `README.md` | The author's own account, including eight stated limitations |

**The operating policies** (SESSION 01) sit under the boundaries document and refine it.
Read the one you need; do not re-derive its contents here.

| Policy | Governs |
|---|---|
| `docs/AUTONOMY-POLICY.md` | The four autonomy classes A/B/C/D, the prohibited automatic actions, the rollback requirement |
| `docs/AGENT-ROLES.md` | Ten agent roles, what each may never do, and the handoff rules |
| `docs/DATA-GOVERNANCE.md` | One home per fact, derivation over storage, the three states, the known second homes |
| `docs/SOURCE-POLICY.md` | What may be cited, what a citation can support, self-citation, the asterisk |
| `docs/VERIFICATION-POLICY.md` | What each validator does and does **not** prove; reproducibility |

**A/B/C/D refine the green/amber/red tiers in `docs/AI-SAFE-BOUNDARIES.md`; they do not
replace them.** A and B split green, C is amber, D is red. Where the two could be read
differently, the stricter reading governs.

Skills live in `.agents/skills/` — sixteen of them, listed with their scope and their
intended agent role in **`docs/SKILL-MAP.md`**. Invoke `project-context` at the start of every
session, then load the skills the task actually needs; each one names the sibling that owns
what it does not.

**The Control Room is not an agent.** `.control-room/` is the private administrative interface
a PERSON uses — observe, review, decide. It is behind a dot prefix because that is the one
publication boundary this repository has, and behind server-side authentication and
authorization because that boundary is **not** a security control. `docs/CONTROL-ROOM.md`.

**The repository is the source of truth.** If `docs/HANDOVER.md` conflicts with the code,
**stop and report the discrepancy** rather than reconciling it silently.

## The rules that matter most

1. **Never fabricate a legal fact.** No citation, URL, date, CELEX number, article number,
   fine, publisher, court or regulatory status from model knowledge. If it was not read from
   a retrieved source, it does not go in the data. A fabricated fact here is not a code
   defect — it is a harm to a reader.
2. **Never close an evidence gap with a plausible substitute.** An asterisk means the
   reference is missing, not that the statement is doubted. A loose substitute is worse than
   an admitted gap because it looks resolved.
3. **One home per fact.** Instruments carry no dates (they reference timeline event IDs) and
   no supervisor field (competence is an edge in `institutions.json`). If you are about to
   write a fact that already exists elsewhere, stop.
4. **Derivation over storage.** Evidence grades, the eight-stage enforcement pipeline,
   competent authority and key dates are computed at render time. Never store one.
5. **`null` ≠ `unknown`**, and **unknown is never zero.** Not researched vs. researched and
   not publicly determinable. Never render them alike, never sum unknown into a total.
6. **No matching rule ≠ no obligation.** Where no applicability rule fires, the answer is
   NOT DETERMINED — never "probably not".
7. **Never soften a stated limitation.** The 106 unverified records and the README's eight
   limitations are the project's honesty. They change by doing the verification work.
8. **Never declare a licence**, and never alter the non-affiliation or no-legal-advice text.

Full detail, including the green/amber/red tiers, is in `docs/AI-SAFE-BOUNDARIES.md`.

## Architecture — do not rebuild it

Static HTML, vanilla ES modules, JSON. **No build step, no dependencies, no framework, no
bundler, no service worker, no third-party requests.** All of this is deliberate:
`tools/design-qa.mjs` actively fails the build on an external stylesheet or script.

- `js/data.js` is the **only** module that fetches a dataset. No renderer calls `fetch()`.
- `js/shell.js` renders the chrome on every page from one nav model. A page must not add its
  own header.
- `data/taxonomy.json` is the enum authority for every other dataset. **IDs are never
  renamed.**
- Read a dataset's `$description` and `$note` before editing it — the non-obvious invariant
  lives in the `$note`.

`docs/CURRENT-ARCHITECTURE.md` §9 has the full dependency map, and its closing section lists
exactly what must not be rebuilt and why.

## Running it

```
python3 -m http.server 8000     # then http://localhost:8000
```

Must be served over HTTP. `file://` blocks both ES modules and the `fetch` calls that load
`data/*.json`.

## Validators — this project's test suite

Run all four before and after any change to data, markup, styles or scripts:

```
node tools/validate.mjs        # data integrity — must be 0 errors
node tools/i18n-audit.mjs      # locale register vs live DOM — must be 0 errors, 0 warnings
node tools/design-qa.mjs       # markup and stylesheets — must be 0 errors
node tools/freshness.mjs       # how stale the datasets are — read the report
```

Zero-dependency Node scripts; run from the repository root.

**Baseline** (`docs/CURRENT-ARCHITECTURE.md` §12 records this in full): 0 errors across all
four, 106 unverified records, and 5 pre-existing `design-qa` warnings listed by file and
line. **A new warning is a finding, not noise.**

The agent layer has its own suites, and a change to `agent/` runs these as well:

```
node --test agent/schemas/selftest.mjs         # the contracts
node --test agent/scout/selftest.mjs           # Agent 1
node --test agent/scout/schedule/selftest.mjs
node --test agent/verifier/selftest.mjs        # Agent 2
node --test agent/integrate/selftest.mjs       # the adapter, against the real data/
node --test agent/detector/selftest.mjs        # Agent 3, against the real data/
node --test agent/depth/selftest.mjs           # Agent 4, against the real data/
node --test agent/proposals/data/selftest.mjs  # Agent 5, against the real data/
node --test agent/architect/selftest.mjs       # Agent 6, against the real data/ and js/
node --test agent/proposals/editorial/selftest.mjs   # Agent 7, against the real pages and data/
node --test agent/ux/selftest.mjs              # Agent 8, against the real pages, sheets and modules
node --test agent/browser/selftest.mjs         # the browser suite's own suite
node --test agent/implement/selftest.mjs       # Agent 9, incl. SESSION 18's eight required proofs
node --test agent/health/selftest.mjs          # Agent 10, incl. planted security-boundary failures
node --test agent/observability/selftest.mjs
node --test .control-room/selftest.mjs         # the Control Room, incl. SESSION 21's sixteen security proofs
node agent/schemas/cli.mjs check               # every contract satisfiable by its fixture
```

**867 tests across the sixteen suites**, all passing as of SESSION 21 (812 after SESSION 20;
756 after SESSIONS 18 and 19; 683 before them). SESSION 21 added 55 and **changed two existing
assertions** in `agent/health/selftest.mjs` — both because the world changed rather than
because they were inconvenient: a Control Room now exists, so the metric that said there was
none, and the one that said there was no login, were asserting something false.
`docs/HANDOVER.md` names both.

**There is now CI.** `.github/workflows/qa.yml` runs all four validators against the recorded
baseline, every agent suite, the contract check, the public/private boundary check and the
browser suite, on every push. **It is not a deploy gate** — a push to `main` still publishes,
and making the workflow blocking needs a branch protection rule, which is repository
configuration outside this tree.

The browser suite opens the site in a real browser and is the first thing here that ever has:

```
node agent/browser/cli.mjs                     # exit 0 pass · 1 fail · 2 NO BROWSER, did not run
node agent/browser/cli.mjs --require-browser   # a missing browser is a hard failure
```

It installs nothing — no `package.json`, no Playwright — and drives a browser already on the
machine over the DevTools protocol. `docs/BROWSER-QA.md`.

The health monitor reports the state of the whole system in three domains that are **never
summed**:

```
node agent/health/cli.mjs --as-of YYYY-MM-DD    # 44 metrics, three domains
node agent/health/cli.mjs --metrics             # the register, runs nothing
node agent/observability/cli.mjs health
```

**There is no overall health score.** `agent/health/model.mjs overallScore()` throws, with the
reasoning. Five metrics are marked `not_a_score` because the only legitimate way to move them
is verification work the monitor cannot see, and every cheap route down is a prohibited
action. `docs/HEALTH-MONITOR.md`.

`tools/_footer.mjs`, `_refsweep.mjs` and `_review10.mjs` are generators and applied one-shot
patches, not checks. **Do not re-run** the latter two.

## Known hazards

- **The `__CONTENT__` bypass.** `index.html:361` inlines a ~59.8 KB blob duplicating
  `data/brief.json`. Nothing loads `brief.json` at runtime, no validator compares the two,
  and `meta.standfirst` has **already drifted**. Editing brief prose or part metadata means
  checking both homes. See `docs/CURRENT-ARCHITECTURE.md` §8.
- **Superseded translations.** Correcting an English string without declaring its key
  `superseded` in `i18n/locales.json` leaves the it/fr/es editions asserting the thing you
  just corrected. This has already happened once.
- **No deploy gate.** A push to `main` publishes to the live site. `.github/workflows/qa.yml`
  now runs the checks on every push, so a failure is **visible** — it is not **blocking**, and
  nothing sits between a commit and the public site. Run the validators by hand as well.
- **The validators do not read prose.** A false statement in `index.html` passes every check
  in this repository. `agent/proposals/editorial/` is the first thing here that reads a
  sentence at all, and it is **not a check**: it runs only when somebody runs it, it produces
  proposals in front of a human, and it can only find what it can quote.
- **`agent/ux/` has never opened a page, and `agent/browser/` now does.** Agent 8 reads the
  markup, the stylesheets and the modules and audits the interface from them; every record it
  writes says so as a blocking open question quoting README limitation 7, and that has not
  changed. SESSION 19's browser suite closes some of its twelve open questions by measurement
  and **found three defects none of the four validators can see**: with scripting off the
  site has no navigation and the `<noscript>` notice does not say so; the skip link is the
  tenth focusable element in the rendered page because `js/shell.js:258` inserts the chrome
  ahead of it; and `enforcement.html` jumps h2 → h5 in its rendered outline. **None is
  fixed** — each is Class C interface work needing a proposal and a human decision.
  `docs/BROWSER-QA.md` §4. Still not closed: contrast, screen readers, pixels, any browser
  but Chromium.
- **A passing validator proves less than it looks.** `design-qa.mjs` harvests CSS token
  declarations out of JavaScript by regex, so a `--foo:` in any JS string or comment
  silences a real error. `freshness.mjs` prints a `SOURCE REACHABILITY` heading but performs
  no network I/O — **no URL here has ever been fetched**. `validate.mjs` carries one check
  that can never fire and treats every wildcard reference as resolving. Detail and evidence:
  `docs/AUDIT-2026-09-01.md` F-10, F-11, F-12.
- **Derived output depends on the reader's clock.** `isPast` compares against
  `new Date().toISOString()` in UTC, so pipeline stages, the calendar and the status strips
  change with when and where a page is opened. Date every report (F-15).
- **`git blame` answers nothing.** The pre-SESSION 00 history is 47 bulk uploads and
  deletions with no message that explains a change, so the rollback path a destructive script
  assumes does not exist. Your commits are the first real provenance this repository has
  (F-06).
- **An `ApprovalRequest` in `agent/records/` is a request, not a grant.** Agents write that
  directory, and it is git-ignored. A grant exists only in
  `agent/implement/decisions/decisions.jsonl`, through `agent/implement/ledger.mjs
  recordDecision`, which requires a named human and binds the decision to the proposal's
  hash. **Two things call it**, and only two: `agent/implement/cli.mjs decide`, and the
  Control Room's `POST /api/review`, which authenticates the caller, authorizes them against
  the proposal's own autonomy class and audits the result before it does. One home for the
  fact of a decision — do not add a third writer. **Not one
  proposal in this repository has ever been decided** — seventy-one across four agents by
  `docs/HANDOVER.md`'s count, thirty-five of them measured in SESSION 18's own run. Agent 9
  refuses every one by name, and reports which gate refused it.
  `docs/IMPLEMENTATION-QA.md` §3.
- **The privileged API has no authentication and no authorization — and it is still there.**
  `agent/observability/server.mjs` serves eleven `/api/` endpoints over the whole trace
  store — agent inputs and outputs, decisions, approvals, provenance — and checks nothing.
  Its only control is that `host` DEFAULTS to `127.0.0.1`, and a default is not a control:
  `serve({ host })` accepts any value. Measured rather than inferred — the health monitor
  starts it on an ephemeral loopback port and finds **nine of the eleven routes return data
  to a request with no credential**. Defensible for a local development viewer, which is
  what it is. **SESSION 21's Control Room did not inherit it**: `.control-room/server.mjs` is
  a separate server that authenticates and then authorizes every privileged request, and the
  finding above stands unchanged against the viewer. Do not point a Control Room at the
  viewer's routes, and do not "fix" the viewer by bolting a token onto it — they exist for
  different purposes, and merging them would give a development tool a security model nobody
  tests. `docs/HEALTH-MONITOR.md` §6 · `docs/CONTROL-ROOM.md` §1.

- **A lower number is not automatically healthier, and five metrics say so in their own
  definition.** The 106 unverified records, the provenance gaps, the verification gaps, the
  blocking open questions and the rejected proposals are marked `not_a_score`:
  `agent/health/model.mjs` refuses to let any of them be re-labelled as a defect count,
  because every cheap route down — clearing `requires_verification`, attaching a plausible
  substitute, bulk-stamping `last_verified`, removing a `blocks` flag — is a prohibited
  action rather than an improvement. **A rise in the first four is usually good news.**

- **Almost the whole repository is inside the public deployment.** GitHub Pages serves `main`
  at the repository root, with no `_config.yml`, no `.nojekyll` and no exclude list, so
  `agent/`, `docs/` and the approval ledger are published alongside `index.html`. A Control
  Room page dropped in *that* part of the tree would be public the moment it was pushed.
  `node agent/implement/cli.mjs boundary` reports it on demand;
  `docs/IMPLEMENTATION-QA.md` §6 carries it as the standing finding it is.

  **The one real exclusion is the dot prefix.** A path whose segments begin with `.` or `_`
  is not served by a Pages deployment with no `_config.yml` — which is why `.agents/` has
  never been in the published surface and `agent/` always has. SESSION 21 put
  `.control-room/` behind it deliberately, and `node .control-room/cli.mjs boundary` checks
  on every push that it is still true. **Do not read that as "the Control Room is safe
  because nobody can find it."** Protocol §10 and `docs/CONTROL-ROOM.md` §1 both say the
  opposite, and every privileged request there is authenticated and authorized regardless.

  What is merely UNTRACKED is weaker still: `agent/records/`, `agent/observability/runs/`,
  `agent/health/history/` and `.control-room/state/` have never been in a commit, and that is
  an **ignore rule, not a boundary** — one `git add -f` undoes it and nothing here would
  object.
- **Your base may be stale.** Run `git fetch --all && git branch -a` before concluding
  anything about what this repository contains. An earlier session reported four existing
  documents as missing by running `ls docs` on an unfetched branch (F-01).

## Git

Develop on the session's designated branch; **never push to `main` without explicit
permission.** Read the full `git diff` before committing — a one-character `null` → `"unknown"`
edit changes what a record asserts. Do not open a pull request unless asked. Do not include a
model identifier in any commit message or pushed artifact. See
`.agents/skills/git-workflow/SKILL.md`.

## When to stop and ask

A fact cannot be verified against a retrievable source · two sources disagree and the schema
cannot hold it · the change would store something the architecture derives · the change would
alter what a claim is said to prove · the handover conflicts with the code.

**Report honestly.** Never state a validator passed if it was not run. The site's own
argument is that a record should say what it cannot support; sessions are held to the same
standard.
