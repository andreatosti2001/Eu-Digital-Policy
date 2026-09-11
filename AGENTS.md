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
| `docs/ORCHESTRATOR.md` | The Master Orchestrator: the ten workflow types, the five end states, the capability register, the eight routing checks, the six conflict shapes — and §13, what none of it proves |
| `docs/FIRST-END-TO-END-AUDIT.md` | SESSION 24's simulated end-to-end cycle: what ran, what was simulated, the Control Room discovery path, the intended visual sequence — and **twenty-three findings, none fixed** |
| `docs/LIMITED-AUTONOMY.md` | SESSION 26: the governance grant that switched five low-risk categories on, what a grant may never say, the six gates and the seven steps — and §7, what none of it proves |
| `docs/CONTINUOUS-IMPROVEMENT.md` | SESSION 27: the loop — eight observers, one as-of date, the tracked cycle ledger, and the rule that an observer which did not run resolves nothing. **§4: the autonomy gate ladder was unpassable and is repaired, with the warrant in §4a. §4b: the adversarial gate has been red since SESSION 24** |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | SESSION 25's first non-simulated run — `--live` against the five registered real endpoints, all five refused by this environment's network policy, and what ran for real against the actual corpus and pages once that boundary was hit — with a prioritized human review queue, none of it decided |
| `docs/GOVERNANCE-PROPOSALS.md` | SESSION 28: the decision corpus, measured — the approval ledger is ABSENT, not empty — the twelve patterns in what a person has had to correct, and seven governance proposals, none decided |
| `docs/REGULATORY-IMPACT-MAPPING.md` | What a confirmed change reaches inside this website, and which half of it a machine may act on |
| `docs/HANDOVER.md` | Previous session's state and the current objective |
| `docs/AUDIT-2026-09-01.md` | Where the architecture above is **not enforced**, with evidence |
| `docs/SECURITY-VERIFICATION-2026-09-08.md` | SESSION 23.5's adversarial gate: 65 attacks, what held, the two findings, and the two boundaries this environment cannot test |
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
| `docs/AUTONOMY-AUTHORIZATION-POLICY.md` | SESSION 23: the **executable** policy — the twelve mandatory conditions, the eighteen action categories, the 84-row capability matrix, the six rollback elements, and the hidden Control Room entry |
| `docs/LIMITED-AUTONOMY.md` | SESSION 26: the **activation** — the grant ledger, the three allowlists, the six gates and the seven steps |

**A/B/C/D refine the green/amber/red tiers in `docs/AI-SAFE-BOUNDARIES.md`; they do not
replace them.** A and B split green, C is amber, D is red. Where the two could be read
differently, the stricter reading governs.

Skills live in `.agents/skills/` — sixteen of them, listed with their scope and their
intended agent role in **`docs/SKILL-MAP.md`**. Invoke `project-context` at the start of every
session, then load the skills the task actually needs; each one names the sibling that owns
what it does not.

**The Orchestrator does not replace a specialist.** `agent/orchestrator/` receives events,
routes them through the ten workflow types, enforces the handoffs and the autonomy boundary,
and stops at a person — every one of the ten types ends at a human stage and the module
refuses to load one that does not. It performs no legal, editorial or evidential reasoning:
every gate it runs is mechanical, and it refuses a record rather than repairing one. **No
production dispatcher is wired**, so a run outside the simulation reports `not_dispatched`
and ends `unresolved`.

**SESSION 24 ran the first end-to-end cycle, in simulation, and fixed nothing it found.**
`agent/simulation/` wires twelve SIMULATED specialists into the real Orchestrator and walks
eight of the ten workflow types once, with a real Control Room process on the authorization
leg. Everything in `agent/orchestrator/`, `agent/policy/`, `agent/schemas/` and
`.control-room/` ran for real; **the eleven specialists' domain reasoning did not**, so a
green leg means the machinery routed a fixture — not that anything about EU law is true. The
run changed nothing, and that is a measurement: it fingerprints the working tree before and
after, and the suite asserts the difference is empty. It produced **twenty-three findings**,
and protocol §25's instruction to observe rather than repair is why none is fixed:
`docs/FIRST-END-TO-END-AUDIT.md`. Four are worth carrying in your head, because they are
places this system is weaker than its own documents read: the Orchestrator admits a
`simulated` record into every workflow (`allowSimulated: true`, hard coded at
`orchestrator.mjs:495`); **the rollback gate has never examined a record** on either type
that declares it; nothing re-checks a `ChangeRecord`'s files against the approved scope
after the dispatch; and two conflict detectors have no ordering constraint and reported one
relationship backwards. `docs/ORCHESTRATOR.md`.

**NOTHING HAS EVER BEEN DECIDED, AND SESSION 28 MEASURED WHY THAT IS TWO PROBLEMS RATHER THAN
ONE.** `agent/proposals/governance/` reads the history and reports what a person has had to
correct more than once: twelve patterns over forty-nine anchors, each anchored to a commit, a
path, a string in a tracked file or a live measurement, all re-resolved on every push. The
first finding is about the corpus — **the approval ledger is not empty, it is ABSENT**, so
there are no approved, rejected or edited proposals to analyse and the corpus is the
corrections instead. The second is mechanical: `deriveApproval()` binds a decision to a
proposal held in the git-ignored record store, so a decision recorded today reads
`void_unknown_proposal` on any other machine until the producing agent is re-run. **Two
findings are this session's own and are measured rather than inherited**: the grant's `docs/`
allowlist and `categoriseProposal()`'s docs-only rule place all eight prose governance
documents inside an ENABLED category — `NEVER_AUTOMATIC_PATHS` guards `agent/policy/`, and
nothing guards `docs/AUTONOMY-POLICY.md`, which is the same policy in the form a person reads
— and six of the eight fields the grant allowlists exist on none of the 77 records in
`data/sources.json`. Both are claims about which gates would NOT stop a change, not claims
that one would merge. **Seven governance proposals exist and none is decided**; the module has
no write path, no decision home and no `automatic` class, and its suite proves the first by
hashing the tree around a full run. `docs/GOVERNANCE-PROPOSALS.md`.

**LIMITED AUTONOMY IS SWITCHED ON, AND WHAT THAT MEANS IS NARROW.** SESSION 26 recorded the
first governance grant this repository has ever had: `agent/policy/governance/grants.jsonl`,
git-tracked, naming the repository author, dated, expiring 9 March 2027, enabling the five
protocol §20 low-risk categories over exactly two paths — `data/sources.json` and `docs/` —
and, on the first of those, exactly eight bookkeeping fields.
**`DEFAULT_POLICY.enabled_categories` is still `[]` and four suites still assert it.** That is
not a contradiction: it is the BASE — what the policy permits when nobody has decided
anything — and the policy in force is DERIVED from the grant ledger by
`agent/policy/governance.mjs policyInForce()`. **Ask that, never `DEFAULT_POLICY`, when the
question is "what may happen now".** A grant may never name a §19 category, a path outside
the two eligible ones, a never-automatic field (`tier`, `role`, `supports`, `last_verified`,
`verification_note`, `requires_verification`, `reference_gap` and five more), a risk above
`low`, `production`, or no expiry — and every one of those refusals runs again on every READ,
so a line written around `recordGrant` is not honoured either. `agent/policy/` is itself on
the never-automatic path list, so **no grant can widen the rules that admitted it**.
`docs/LIMITED-AUTONOMY.md`.

**SESSION 27 FOUND THE GATE LADDER UNPASSABLE, AND REPAIRED IT UNDER AN EXPLICIT WARRANT.**
Take a proposal with nothing wrong with it, in a category the grant enables over a path the
grant names: five of the six autonomy gates passed and `policy_route_pre` refused, for **two**
structural reasons. `rollback_mechanical` reported `failed` about a change context that
`agent/implement/apply.mjs openContext()` only produces in **step 2**, while gate 3 runs
**before step 1**; and the gate's third clause asked `route !== 'blocked'`, which is
unsatisfiable before a run because **every measured condition is on
`NOT_WAIVABLE_BY_APPROVAL`**. So `docs/LIMITED-AUTONOMY.md` §7.1's "nothing produces a proposal
in an enabled category" was true and was **not the binding constraint**: the permitting half
was unreachable.

Both are fixed, and **no check was weakened**: an element `assessRollback()` reports as
`absent` — established missing — still fails, an unauthorized actor is still refused (the case
clauses 1 and 2 were blind to, because the engine returns an empty condition list for it), and
step 6 still re-evaluates every condition on the measured facts and merges only on route
`automatic`. **The ladder is now passable and nothing has passed it**: a clean fixture reaches
the measured evaluation and is refused there on `verification_succeeded (unknown)` and
`validators_pass (failed)`, the latter being `freshness.mjs`'s pre-existing exit 1. **No
autonomous change has merged anything.** `docs/CONTINUOUS-IMPROVEMENT.md` §4, with the warrant
quoted in §4a and the five changed assertions named in §4.4.

**THE ADVERSARIAL GATE HAS BEEN RED SINCE SESSION 24 AND THREE DOCUMENTS SAY OTHERWISE.**
`node agent/policy/verify/cli.mjs` reports **1 SUCCEEDED** — HE-04, CRITICAL, the trigger phrase
found in `agent/simulation/threshold.mjs`. Measured at `aaf6691` in a clean worktree, so it is
not this session's. The module uses the phrase as a **probe** — the line the attack hits is the
separation check that searches Control Room source to prove the phrase is absent from it — so
this is very probably the HE-01 shape SESSION 23.5 already corrected once, with a stale
exclusion list. **It is not repaired here**, and the standing lesson is that the gate is **not
in CI**, which is how a CRITICAL stayed red across three sessions.
`docs/CONTINUOUS-IMPROVEMENT.md` §4b.

**THE LOOP IS `agent/improve/`, AND IT CHANGES NOTHING.** Eight observers in one process
against one corpus position with one as-of date; five produce identified findings and three
produce counts, and the two are never mixed because a count has no identity to follow. Its one
governing rule is that **an observer that did not run is not an observer that found nothing** —
movement is computed per observer, and anything owned by an observer that did not run in BOTH
cycles is `undetermined`, never `resolved`. Its triage is **not** the gate ladder: it answers a
weaker question, and `eligible` means only "worth handing to the runner". Its cycle ledger,
`agent/improve/cycles/cycles.jsonl`, is **the one run store here that is git-tracked**, because
a loop whose memory does not survive a clone is not a loop — and it carries only public
readings, enforced by a refusal to write rather than by a convention. First recorded cycle: 210
findings, 0 referable, 66 to a person, 144 proposing no act.
`docs/CONTINUOUS-IMPROVEMENT.md`.

**`agent/autonomy/` is the runner, and a grant replaces exactly two gates.**
`agent/implement/preflight.mjs`'s `approved` and `approval_attributable`, and nothing else;
the other eight must pass unchanged. The cycle is seven steps — a real isolated branch, the
exact-match apply, the four validators, the browser suite where it is required, the full
trace, a `--no-ff` merge into the WORKING branch only if every mandatory condition holds on
the MEASURED facts, and retained rollback information. The default writes nothing: `run`
without `--execute` rehearses. **Its first real run refused all fourteen proposals in the
store, each by four independent gates**, and no autonomous change has ever merged anything.
`docs/LIMITED-AUTONOMY.md` §6 and §7.

**The autonomy policy has ONE home, and it is `agent/policy/`.** SESSIONS 22 and 23 were
written on sibling branches from the same base and each implemented protocol §18's mandatory
conditions and §19's human-review triggers. That was a second home for one fact, which this
project's first principle forbids. The merge resolved it in the direction protocol §14 states:
the Orchestrator's responsibilities are workflow state, routing, handoffs, conflict detection
and **policy enforcement** — not policy definition. So `agent/orchestrator/policy.mjs` now
delegates to `agent/policy/engine.mjs` and keeps only what is genuinely the Orchestrator's.
Do not re-implement a condition or a trigger there.

**The verification gate is not a test suite.** 
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
node --test agent/proposals/governance/selftest.mjs   # SESSION 28, against the real history and the real policy
node --test agent/ux/selftest.mjs              # Agent 8, against the real pages, sheets and modules
node --test agent/browser/selftest.mjs         # the browser suite's own suite
node --test agent/implement/selftest.mjs       # Agent 9, incl. SESSION 18's eight required proofs
node --test agent/health/selftest.mjs          # Agent 10, incl. planted security-boundary failures
node --test agent/orchestrator/selftest.mjs    # the Master Orchestrator, incl. SESSION 22's six regressions
node --test agent/observability/selftest.mjs
node --test agent/policy/selftest.mjs           # the autonomy policy, incl. SESSION 23's twenty required proofs
node --test agent/policy/verify/selftest.mjs   # SESSION 23.5's gate, run twice, asserting it is reproducible
node --test agent/simulation/selftest.mjs      # SESSION 24's simulation, incl. the byte-identical-tree assertion
node --test agent/autonomy/selftest.mjs       # SESSION 26's limited-autonomy runner, incl. the git half against a real temporary repository
node --test agent/improve/selftest.mjs         # SESSION 27's improvement loop, incl. two real cycles over the real corpus
node --test .control-room/selftest.mjs         # the Control Room, incl. SESSION 21's sixteen security proofs
node agent/schemas/cli.mjs check               # every contract satisfiable by its fixture
```

**__MERGED_TOTAL__ tests across the twenty-two suites**, all passing on the merged tree of
SESSIONS 27 and 28 — __MERGED_MAIN__ with one skipped when the working tree is on `main`, because
`agent/autonomy/selftest.mjs` test 28 rehearses the real cycle and the cycle refuses to run
there. **Neither session's own figure is the total**: SESSION 27 measured 1069 and SESSION 28
measured 1081, on sibling branches cut from the same base, and each was right about its own
tree (1036 across twenty-one after SESSION 26; 998 across twenty after SESSION 24; 978 across
nineteen after SESSION 23.5; 934 after SESSION 22 on its own branch; 909 after SESSION 23.5 on
its own; 867 after SESSION 21; 812 after SESSION 20; 756 after SESSIONS 18 and 19; 683 before
them). SESSIONS 22, 23 and 23.5 were merged, so none of those middle figures is a total on its
own either.

**`agent/implement/selftest.mjs` R6 has now caught the suite list growing seven times** —
SESSION 20, SESSION 22, SESSION 23, the merge where the two branches had each updated the
same assertion to a different number, SESSION 24, whose simulation harness would otherwise
have landed without ever gating a change under `agent/`, and SESSION 26, where it mattered
most: the autonomy runner is the first thing here that can write a file without a person, and
a suite for it that nothing ran would have been a gate on nothing; and SESSIONS 27 and 28,
which are **one occasion rather than two** — sibling branches from one base, each setting the
number to 21, neither right about the merged tree. That is the second time this assertion has
caught exactly that shape, and it is the case it is most worth having for. That is the
assertion doing its job. It asserts twenty-two suites. SESSION 23 also changed `agent/detector/impact.mjs`'s
`MODULE_SURFACE`, which must name every module in `js/` and did not yet name `threshold.js`;
SESSION 21 changed two in `agent/health/selftest.mjs`. Every one of them is the world having
changed rather than a test being inconvenient, and `docs/HANDOVER.md` names them all.

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

What limited autonomy is switched on to do, and everything it has attempted:

```
node agent/policy/cli.mjs governance            the grants in force, and what none may say
node agent/autonomy/cli.mjs status              what is on, and what it has done
node agent/autonomy/cli.mjs survey --all        what could run automatically right now
node agent/autonomy/cli.mjs run --as-of YYYY-MM-DD [--execute]
node agent/autonomy/cli.mjs actions             every attempt: merged, reverted, refused
```

Both register commands run on every push. Neither writes anything.

One pass over the whole system, and the comparison with the pass before:

```
node agent/improve/cli.mjs cycle --as-of YYYY-MM-DD [--record] [--store]
node agent/improve/cli.mjs observers        the register, runs nothing
node agent/improve/cli.mjs reach            what the grant can actually reach, measured
node agent/improve/cli.mjs history          every recorded cycle, and the movement between them
```

`cycle` **without `--record` writes nothing**, and no flag in the module can touch `data/`,
`i18n/`, `js/`, `css/` or a page. `reach` runs on every push.

What a person has had to correct more than once, and what SESSION 28 asks about it:

```
node agent/proposals/governance/cli.mjs corpus     every place a decision could be recorded
node agent/proposals/governance/cli.mjs patterns   the twelve, with every anchor resolved
node agent/proposals/governance/cli.mjs list       the seven proposals · show <GP-nn> for the case against
node agent/proposals/governance/cli.mjs check      exit 1 only on an anchor this tree REFUTES
```

`check` and `corpus` run on every push. Neither writes anything, and there is no verb here
that decides.

**`node agent/orchestrator/cli.mjs workflows` and `capabilities` currently EXIT 1 on `main`**,
and have since the SESSION 26 merge: `agent/orchestrator/cli.mjs:50` imports `AUTONOMY_NOTE`,
which `policy.mjs` stopped exporting when the note became derived. No suite runs these CLIs, so
only CI sees it — and a failing step skips every step after it in the same job, which is why
the governance step above is registered ahead of the registers. Not repaired:
`docs/GOVERNANCE-PROPOSALS.md` §6b.

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
  `agent/health/history/`, `agent/orchestrator/state/` and `.control-room/state/` have never
  been in a commit, and that is an **ignore rule, not a boundary** — one `git add -f` undoes it and nothing here would
  object.
- **The public site now has one affordance that is not about EU law.** Typing
  `thirty-two paths` into the search palette offers a passage to a private control plane:
  `js/threshold.js`, styled at the end of `style.css`, drawn as an original Sefer
  Yetzirah-style wheel. It authenticates nothing, authorizes nothing and holds no credential,
  no endpoint and no privileged state — `agent/policy/selftest.mjs` tests 18–20 assert that
  string by string, and `agent/browser/checks.mjs checkThreshold` measures nine properties of
  it in a real browser, including that opening it issues **no network request at all**. The
  phrase is **not a credential**: it is in a file served to every reader, protocol §10 says
  obscurity is not a control, and anyone who finds it meets the same login. It reads its
  target from `<meta name="eu-control-room">` and **never invents one**; no page here declares
  it, so on the published site the passage ends at a statement. Do not add the meta tag, or a
  server route that reads the phrase, without deciding to.

  **SESSION 24 simulated the discovery flow as a separate UX/security path and measured all
  six separations**: the animation is separate from authentication, authorization, approval,
  orchestration, execution and deployment, and `js/threshold.js` imports nothing at all, so
  it can reach no other module. It also compared the code against an intended six-phase
  visual sequence and found **three phases that do not match**. One of the three is
  deliberate and must stay: "reveal CONTROL ROOM followed by the normal authentication
  interface" must NOT be implemented as a login form on the published page, because that
  would be a credential prompt in the public tree. `docs/FIRST-END-TO-END-AUDIT.md` §6.

- **Every run store here is git-ignored EXCEPT one, and the exception is deliberate.**
  `agent/improve/cycles/cycles.jsonl` is tracked, because a loop whose memory does not survive
  a clone is not a loop: every other store is per-machine, so cross-session movement would
  otherwise be a comparison against the previous session's PROSE in `docs/HANDOVER.md` — a
  second home for those facts, which has already drifted once (`docs/LIMITED-AUTONOMY.md` §7c).
  The precedent is the grant ledger and the decision ledger, not the health history. What pays
  for it is a rule rather than a promise: a signal classified `private` by
  `agent/health/model.mjs` is withheld and the withholding is recorded, the health monitor's
  own `collectLeaks()` runs over the serialised entry against the real private metric register,
  and a path under `.control-room/` anywhere in an entry is a **refusal to write**, not a
  redaction. Nothing records without `--record`.

- **The autonomy layer's action ledger is git-ignored, and the COMMIT is the durable record.**
  `agent/autonomy/actions/actions.jsonl` holds one line per attempt — merged, reverted and
  refused alike — with the branch, the base commit and the per-file pre-change hashes. It is
  per-machine run state, so a fresh clone and a CI runner have none, and that is not the same
  fact as no autonomous action having been taken. What survives a clone is the commit an
  autonomous change made, whose message names the grant, the person who wrote it, the base
  commit and the exact restore command. **The grant ledger is the opposite and is TRACKED**:
  an authorization has to be attributable.

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
