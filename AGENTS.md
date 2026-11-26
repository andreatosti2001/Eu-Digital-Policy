# AGENTS.md

Operating instructions for any AI agent working in this repository.
**This is the canonical agent entry point.** `CLAUDE.md` points here; it holds no rules of
its own, because this project's first principle is one home per fact.

---

## What this is

**The European Legal Framework for the Digital World** — an analytical brief on the EU
digital acquis, published as a static site at
https://eudigitalpolicy.eu/

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
| `docs/CONTROL-ROOM.md` | The private control plane: the two security domains, authentication, authorization, the inventory of every view, the eight approval gates, the audit trail — and §11, what none of it proves |
| `docs/ORCHESTRATOR.md` | The Master Orchestrator: the ten workflow types, the five end states, the capability register, the eight routing checks, the six conflict shapes — and §13, what none of it proves |
| `docs/FIRST-END-TO-END-AUDIT.md` | SESSION 24's simulated end-to-end cycle: what ran, what was simulated, the Control Room discovery path, the intended visual sequence — and **twenty-three findings, none fixed** |
| `docs/LIMITED-AUTONOMY.md` | SESSION 26: the governance grant that switched five low-risk categories on, what a grant may never say, the six gates and the seven steps — and §7, what none of it proves |
| `docs/CONTINUOUS-IMPROVEMENT.md` | SESSION 27: the loop — eight observers, one as-of date, the tracked cycle ledger, and the rule that an observer which did not run resolves nothing. **§4: the autonomy gate ladder was unpassable and is repaired, with the warrant in §4a. §4b: the adversarial gate has been red since SESSION 24** |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | SESSION 25's first non-simulated run — `--live` against the five registered real endpoints, all five refused by this environment's network policy, and what ran for real against the actual corpus and pages once that boundary was hit — with a prioritized human review queue, none of it decided |
| `docs/PRODUCTION-OPERATING-MODE.md` | SESSION 29: the daily cycle, the fourteen reviews, the final visual standard, the discovery boundary — and the readiness checklist that **REFUSED**. SESSION 29 measured twelve of twenty mandatory conditions passing and eight blocking; on SESSION 30's tree it is **fourteen and six**, and it still refuses |
| `docs/GOVERNANCE-PROPOSALS.md` | SESSION 28: the decision corpus, measured — the approval ledger is ABSENT, not empty — the twelve patterns in what a person has had to correct, and seven governance proposals, none decided |
| `docs/EVIDENCE-MODEL.md` | 27 Sep 2026: claim types vs evidence status, prose coverage, derived and attributed claims, locators, the remediation taxonomy, freshness by risk, provision dates, enforcement posture |
| `docs/SEO-AUDIT-2026-09-27.md` · `docs/SEO-OPERATIONS.md` · `docs/DISCOVERABILITY-STRATEGY.md` | 27 Sep 2026: what a crawler saw before, the canonical model and route model now, the indexability gate, what only the owner can do in Search Console, and why |
| `docs/DEPLOYMENT.md` | 27 Sep 2026: the deploy gate, the settings only the owner can change, the CSP and what Pages cannot send, the Control Room model, measured against the live site. **4 Nov 2026: §2a the release gate, §3a the external settings it depends on, §3b how a person makes the approval it checks for** |
| `docs/AUDIT-2026-11-04.md` | The Phase 4 operational-closure audit of 4 Nov 2026: the dispatcher, the decision ledger and the deploy gate measured against the code, what was built, what was tested, what is still a person's or a repository setting, and a 20-point readiness assessment that awards nothing for documentation alone |
| `agent/release/README.md` | The release dispatcher (`agent/release/dispatch.mjs`) and the deploy gate (`gate.mjs`): the stages in the order they refuse (ten since 11 Nov 2026, with the verified rollback), the ten gate conditions, and what neither is |
| `docs/AUDIT-2026-11-11.md` | P0.1 and P0.4 (11 Nov 2026): why `11313f6` held 9 files while the scope stage said 1, reproduced and repaired with thirteen tests; the release governance measured — one person is requester, signer, merger and administrator; `--strict-unledgered` simulated (on today it would block every deploy forever); the two decisions put to the author |
| `docs/AUDIT-2026-11-11-P1.md` | The P1 checkpoint (11–12 Nov 2026): CI and Pages verified on the published commit; F-A4's nine records scanned and **not** re-verified (the register refuses automated reading here); F-A7 closed — one computing function for instruments by status, the instruments card declared; a merge commit's own content made visible to C6/C7/C8; V-1 repaired; automation readiness by level; the decisions left to the author; **§8, F-A4 made lighter to close** — a pending appeal is `high`, the register reading is a sheet |
| `docs/REGULATORY-IMPACT-MAPPING.md` | What a confirmed change reaches inside this website, and which half of it a machine may act on |
| `docs/HANDOVER.md` | Previous session's state and the current objective |
| `docs/AUDIT-2026-09-01.md` | Where the architecture above is **not enforced**, with evidence |
| `docs/AUDIT-2026-09-03.md` | Foundation verification before SESSION 13, and the concurrent-merge collision that produced the re-fetch rule under **Git** |
| `docs/AUDIT-2026-10-14.md` | The October 2026 evidence update: what was checked against primary sources on 14 Oct 2026, what changed, what stays unresolved, and two temporal errors in the derived provision dates (CRA, Data Act) found and fixed |
| `docs/AUDIT-2026-10-21.md` | The external audit of 21 Oct 2026, implemented: what was checked against which primary source, what changed per item, and the five places where the audit asserted something no retrieved source established |
| `docs/AUDIT-2026-10-23.md` | The audit snapshot of 23 Oct 2026, rechecked: the QA browser job's root cause (the snap), eight enforcement records against primary sources and the two proposals left for the author, both publishers deploying every push, the viewer's enforced loopback bind, the dialogs, and what this environment could not measure (HSTS) |
| `docs/AUDIT-2026-10-28.md` | The P0 data-integrity audit of 28 Oct 2026: the Data Omnibus Council mandate (ST 14756/26, Coreper 21 Oct) found missing and corrected; the bibliography's 206/208 shown to be two snapshots, not a defect; the institutional-status review interval aligned with its policy; `status:council-position` left open because no status display can show it. **Not deployed** |
| `docs/AUDIT-2026-10-24.md` | The Control Room content audit of 24 Oct 2026 (the author's, verbatim) — the BRIEF v2.0's "P0/P1 audit" — each finding checked against the code, and where its remedies collide with `docs/CONTROL-ROOM.md` §12 |
| `docs/EDITORIAL-AUDIT-PATH.md` | v2 Session 3: the editorial-audit path — run `tools/evidence-audit.mjs` and `tools/freshness.mjs`, record a run with `--record`, read it in the Control Room's Editorial audit view; nothing in the Control Room runs it |
| `docs/BRIEF-v2.md` | The BRIEF v2.0, "Contratto tra sessioni" — the author's, verbatim, in Italian: binding on every v2 session. Committed on the author's decision of 27 Oct 2026 (D-1); session prompts cite it rather than carry a copy |
| `docs/ROADMAP-v2.md` | v2 Session 1: the v2.0 plan — phases 0–5, ten decisions for the author, exit criteria a session can fail. **Approved on 25 Oct 2026** (§8), with item 2.0 brought forward. **Phases 0–4 executed (Phase 4 concluded on 4 Nov 2026); Phase 5 opened on 13 Nov 2026 with G2, E5-5 failing and stated; the v2 open** (§8, «Phase 4 concluded», «G2: Stage 3 is opened, and with it Phase 5») |
| `docs/V2-CLOSURE.md` | v2 Session 11: the v2 measured against the brief and the roadmap, and every open finding with the class the author decided. **The v2 is not closed** |
| `docs/PHASE-3-AUDIT.md` | v2 Session 17.5: Phase 3 measured on 3 Nov 2026 — the entry condition, the 33 rules, the fifteen open rows and the thirty findings, each with the destination the author decided. **Phase 3 is closed** (§8, 3 Nov 2026) |
| `docs/PHASE-4-SETUP.md` | v2 Session 17.5: the thirteen manual processes and their three levels (D-4, decided), D-5's two facts (deferred), Phase 4's entry condition E-1…E-6 and first item 4.1. **Phase 4 was opened on 3 Nov 2026 (§8, v2 Session 20); this document is its set-up** |
| `docs/PHASE-4-PLAN.md` | 4 Nov 2026: a proposal — Phase 4's exit criteria X-1…X-5 (that can fail), what stays out, and the sessions 22–25 that reach them, attestation first. Approved only by the roadmap §8 row that cites it. |
| `docs/V2-DATA-DESIGN.md` | v2 Session 2: roadmap item 2.0 — the map, trigger and status-label schemas (`docs/v2-design/`), the `evidence-audit.mjs` extension plan, the proposed inclusion criterion, the exclusion register and watchlist as proposed records. **Design; item 2.1 (the register and the watchlist) implemented on 27 Oct 2026, the rest not yet** |
| `docs/SECURITY-VERIFICATION-2026-09-08.md` | SESSION 23.5's adversarial gate: 65 attacks, what held, the two findings, and the two boundaries this environment cannot test |
| `README.md` | The author's own account, including nine stated limitations (the ninth accepted as written on 27 Oct 2026) |

**The operating policies** (SESSION 01) sit under the boundaries document and refine it.
Read the one you need; do not re-derive its contents here.

| Policy | Governs |
|---|---|
| `docs/AUTONOMY-POLICY.md` | The four autonomy classes A/B/C/D, the prohibited automatic actions, the rollback requirement |
| `docs/AGENT-ROLES.md` | Ten agent roles, what each may never do, and the handoff rules |
| `docs/DATA-GOVERNANCE.md` | One home per fact, derivation over storage, the three states, the known second homes |
| `docs/SOURCE-POLICY.md` | What may be cited, what a citation can support, self-citation, the asterisk |
| `docs/VERIFICATION-POLICY.md` | What each validator does and does **not** prove; reproducibility |
| `docs/CONTENT-FRESHNESS-POLICY.md` | When the content is called stale, the "Content stale" CI warning, and what alone closes one |
| `docs/AUTONOMY-AUTHORIZATION-POLICY.md` | SESSION 23: the **executable** policy — the twelve mandatory conditions, the eighteen action categories, the 84-row capability matrix, the six rollback elements, and the hidden Control Room entry |
| `docs/LIMITED-AUTONOMY.md` | SESSION 26: the **activation** — the grant ledger, the three allowlists, the six gates and the seven steps |

**A/B/C/D refine the green/amber/red tiers in `docs/AI-SAFE-BOUNDARIES.md`; they do not
replace them.** A and B split green, C is amber, D is red. Where the two could be read
differently, the stricter reading governs.

Skills live in `.agents/skills/` — sixteen of them, listed with their scope and their
intended agent role in **`docs/SKILL-MAP.md`**. Invoke `project-context` at the start of every
session, then load the skills the task actually needs; each one names the sibling that owns
what it does not.

**A RELEASE CHAIN EXISTS FROM 4 NOV 2026, AND A PERSON HAS USED IT ONCE.** Every other proposal here is still undecided, and **nothing in a test or a tool may put a line in that ledger to make it look otherwise**; the one entry there was made by a person. → `docs/DEPLOYMENT.md` §2a.

**The Orchestrator does not replace a specialist.** → `docs/ORCHESTRATOR.md`.

**SESSION 24 ran the first end-to-end cycle, in simulation, and fixed nothing it found.** → `docs/ORCHESTRATOR.md`.

**NOTHING HAD EVER BEEN DECIDED WHEN SESSION 28 RAN, AND IT MEASURED WHY THAT IS TWO PROBLEMS RATHER THAN ONE.** → `docs/GOVERNANCE-PROPOSALS.md`.

**PRODUCTION OPERATION IS NOT ACTIVATED, AND THE REFUSAL IS MEASURED.** → `docs/PRODUCTION-OPERATING-MODE.md`.

**THE HIDDEN ENTRY PASSES ALL TEN VISUAL CONDITIONS AND ALL SIX SEPARATIONS, AND WAS NOT TOUCHED.** → `docs/PRODUCTION-OPERATING-MODE.md` §4a.

**LIMITED AUTONOMY IS SWITCHED ON, AND WHAT THAT MEANS IS NARROW.** **Ask that, never `DEFAULT_POLICY`, when the question is "what may happen now".** → `docs/LIMITED-AUTONOMY.md`.

**SESSION 27 FOUND THE GATE LADDER UNPASSABLE, AND REPAIRED IT UNDER AN EXPLICIT WARRANT.** → `docs/CONTINUOUS-IMPROVEMENT.md` §4.

**THE ADVERSARIAL GATE WAS RED FROM SESSION 24 TO 27 SEP 2026** → `docs/CONTINUOUS-IMPROVEMENT.md` §4b.

**THE LOOP IS `agent/improve/`, AND IT CHANGES NOTHING.** → `docs/CONTINUOUS-IMPROVEMENT.md`.

**`agent/autonomy/` is the runner, and a grant replaces exactly two gates.** → `docs/LIMITED-AUTONOMY.md` §6, §7.

**The autonomy policy has ONE home, and it is `agent/policy/`.** Do not re-implement a condition or a trigger there. → `docs/ORCHESTRATOR.md`.

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
7. **Never soften a stated limitation.** The unverified records (104 on 27 Sep 2026; §12 holds the live figure) and the README's nine
   limitations are the project's honesty. They change by doing the verification work.
8. **Never change the licence** — CC BY 4.0, declared by the author on 21 Oct 2026 — and never alter
   the non-affiliation or no-legal-advice text.

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
node tools/freshness.mjs       # how stale the datasets are — 0 unless the RECORD is defective
node tools/evidence-audit.mjs  # claims, evidence, prose coverage, contradictions (27 Sep 2026)
node tools/seo-audit.mjs       # canonical, sitemap, metadata, crawl graph, structured data (27 Sep 2026)
node --test tools/selftest.mjs # the validators' own suite (SESSION 30)
```

Zero-dependency Node scripts; run from the repository root.

**Baseline** (`docs/CURRENT-ARCHITECTURE.md` §12 records this in full): 0 errors across all
four, 104 unverified records, and 0 `design-qa` warnings (five until 27 Sep 2026; §12 names
them and how each was closed). `tools/evidence-audit.mjs` must report 0 errors: every
substantive passage of the brief registered or classified. **A new warning is a finding, not
noise.**

**`freshness.mjs`'s exit code changed in SESSION 30 and its report did not.** The prompts are still printed by name and counted; they are closed by verification work against primary sources and by nothing else, and **exit 0 is not evidence of currency**. → `docs/CURRENT-ARCHITECTURE.md` §12.

**The four validators now have a suite of their own** → `docs/CURRENT-ARCHITECTURE.md` §12.

**`tools/thirdparty.mjs` is what makes "no third-party requests" true of the repository rather than of the README.** `ALLOWED_RUNTIME_ORIGINS` is **empty**; an external runtime dependency is a Class D decision and goes there with its reason and who decided it. → `docs/CURRENT-ARCHITECTURE.md` §12.

**`tools/source-contract.mjs` is the one contract a source record satisfies** — 12 required
fields, 2 optional, each with its shape, why it exists, who writes it and who reads it —
and `validate.mjs` enforces it. Before SESSION 30 the validator asked whether four values
RESOLVED and never whether a record had the other eight at all, which is how the governance
grant could allowlist eight fields of which six exist on none of the 77 records.
**Those six are `ABSENT_BY_DESIGN` and are not a TODO**: every one asserts a document was
FETCHED, and no URL here has ever been fetched (AUDIT F-12), so writing one would be a
fabricated fact about evidence. A record carrying one is refused by name.

**`tools/metric-contract.mjs` is the metric contract MC-1…MC-15, and `tools/fine-basis.mjs` the provenance of an enforcement
amount** (11 Nov 2026, P0.2 and P0.3; `docs/DATA-READINESS.md` §9). `validate.mjs` runs both: a fine with no `fine_eur_basis`,
a `fine_eur` that is not an integer ≥ 0, or a declared metric that fails any property is an ERROR, and its figure is not
publishable. The fines figure has one computing function, `js/pipeline.js finesFigure()`; **do not sum `fine_eur` or count
payment states anywhere else in `js/`** — MC-2 finds a second sum by line, and every view must import the function.
**A pending appeal is `high` (30 days), not `critical`, since 12 Nov 2026** (the author's decision; only an announced action is `critical`) —
and **a claim about such a record keeps its `high` interval**: `enforcementVolatile()` in `js/evidence-model.js` is the test, and the decision
was about records only (`docs/AUDIT-2026-11-11-P1.md` §8). **A court-register reading is a sheet and a declaration**: `node
tools/register-reading.mjs sheet`, then `check <answers.json>`; no verb writes, and an `attestation` on an enforcement record is audited by
`validate.mjs`.
**The same holds for instruments by legislative status since 11 Nov 2026** (F-A7): `js/regulatory-model.js
instrumentsByStatus()` is the one function and the masthead imports it; MC-2 finds a second COUNT by the field too.

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
node --test agent/production/selftest.mjs      # SESSION 29's production operating mode, incl. the refusal driven with synthetic facts
node --test agent/release/selftest.mjs         # 4 Nov 2026: the dispatcher, the ledger's integrity and the deploy gate — positive and negative paths, on temporary repositories and keys
node --test .control-room/selftest.mjs         # the Control Room, incl. SESSION 21's sixteen security tests (its "proofs"), on a local server — never a deployed one
node --test tools/selftest.mjs                 # SESSION 30, the four validators' own suite, incl. a planted Google Fonts import
node agent/schemas/cli.mjs check               # every contract satisfiable by its fixture
```

**On 4 Nov 2026 the same 26 suites (the 25 `AGENT_SUITES` and `.control-room/`) pass 1394 tests** → `docs/CURRENT-ARCHITECTURE.md` §12.

**`agent/implement/selftest.mjs` R6 has now caught the suite list growing seven times** → `docs/CURRENT-ARCHITECTURE.md` §12.

**There is CI, and a deploy gate whose setting was switched on 24 Oct 2026.** → `docs/DEPLOYMENT.md` §1b, §3.

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

Whether production operation may be switched on, and the answer:

```
node agent/production/cli.mjs readiness        twenty-one conditions, ten domains; exits 1 while any mandatory one is unpassed
node agent/production/cli.mjs schedule         the daily cycle and the fourteen reviews, runs nothing
node agent/production/cli.mjs visual           the ten conditions of the final visual standard
node agent/production/cli.mjs separations      discovery ≠ authentication ≠ authorization
node agent/production/cli.mjs trace            every way the website can change, and what it leaves
```

The last four run on every push. **None of them writes, and there is no verb there that could**
— no `--execute`, no `--record`, no `--force`, no `--activate`.

What a person has had to correct more than once, and what SESSION 28 asks about it:

```
node agent/proposals/governance/cli.mjs corpus     every place a decision could be recorded
node agent/proposals/governance/cli.mjs patterns   the twelve, with every anchor resolved
node agent/proposals/governance/cli.mjs list       the seven proposals · show <GP-nn> for the case against
node agent/proposals/governance/cli.mjs check      exit 1 only on an anchor this tree REFUTES
```

`check` and `corpus` run on every push. Neither writes anything, and there is no verb here
that decides.

**`node agent/orchestrator/cli.mjs workflows`, `capabilities` and `policy` exited 1 from the SESSION 26 merge until SESSION 29** → `docs/PRODUCTION-OPERATING-MODE.md` §6 · `docs/GOVERNANCE-PROPOSALS.md` §6b.

**There is no overall health score.** `agent/health/model.mjs overallScore()` throws, with the
reasoning. Five metrics are marked `not_a_score` because the only legitimate way to move them
is verification work the monitor cannot see, and every cheap route down is a prohibited
action. `docs/HEALTH-MONITOR.md`.

`tools/_footer.mjs`, `_refsweep.mjs` and `_review10.mjs` are generators and applied one-shot
patches, not checks. **Do not re-run** the latter two.

## Known hazards

- **The brief's text has one home: the markup of `index.html`.** **Do not bring a copy back under any name** — `design-qa.mjs` fails a script that holds a page's text (`tools/prose-homes.mjs`), `validate.mjs` fails a `brief.json` key other than `parts`/`reading_graph`, and the browser suite's `search:brief-*` checks fail a stale index. → `docs/CURRENT-ARCHITECTURE.md` §8.
- **Superseded translations.** Correcting an English string without declaring its key
  `superseded` in `i18n/locales.json` leaves the it/fr/es editions asserting the thing you
  just corrected. This has already happened once.
- **The deploy gate exists and was switched on 24 Oct 2026, unconfirmed.** → `docs/DEPLOYMENT.md` §3.
- **A data change needs a regeneration.** Since 27 Sep 2026 each substantive instrument has a
  pre-rendered page at `instruments/<id>/`, generated from `data/` by `node tools/_footer.mjs`
  (`docs/SEO-OPERATIONS.md`). After editing `data/`, re-run it and commit what it writes, or
  `seo-audit.mjs` and CI fail on the stale page. Never edit a file under `instruments/` by hand,
  and never store in `data/` anything to make a page read better: titles live in `tools/seo.mjs`.
- **An edited inline script is a blocked script.** Inline event handlers are an error. → `docs/DEPLOYMENT.md`.
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
  tenth focusable element in the rendered page because `js/shell.js` inserted the chrome
  ahead of it; and `enforcement.html` jumps h2 → h5 in its rendered outline. **All three are
  fixed in SESSION 30, under an explicit instruction to repair them at root cause**, and each
  was a defect in the WEBSITE rather than in the check: the `<noscript>` notice now names the
  navigation among what will not render and carries the six destinations, read out of
  `js/shell.js`'s `NAV` by `tools/_footer.mjs` so the nav model keeps one home; `initShell()`
  inserts the chrome AFTER the skip link instead of at `document.body.firstChild`; and the
  pipeline stage panels are `h3`, which is their real level under the record's `h2`, with
  `css/tools.css` unchanged in appearance because it sized that heading itself. A fourth was a
  defect in the CHECK: `keyboard:focus-visible` reported `undecidable` on every run because it
  read its "before" style off the element its own preceding `Tab` had already focused, so it
  compared a focus ring with itself. It now blurs, tabs, and measures — and passes.
  `docs/BROWSER-QA.md` §4. Still not closed: contrast, screen readers, pixels, any browser
  but Chromium — `a11y:bound` says so on every run and is the one remaining `undecidable`,
  deliberately: it is a statement of what the suite did not establish, and a green tick in its
  place would be the thing this repository is arranged against.
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
  fact of a decision — do not add a third writer. **One
  proposal in this repository has been decided, on 6 Nov 2026** (`prop-docs-ea57404dc452`; the ledger holds that one entry). Of
  the seventy-one across four agents by `docs/HANDOVER.md`'s earlier count, thirty-five were measured in SESSION 18's own run,
  before it, and every other one is still undecided: Agent 9 refuses those by name, and reports which gate refused each.
  `docs/IMPLEMENTATION-QA.md` §3.
- **The privileged API has no authentication and no authorization — and it is still there.**
  `agent/observability/server.mjs` serves eleven `/api/` endpoints over the whole trace
  store — agent inputs and outputs, decisions, approvals, provenance — and checks nothing.
  Until 23 Oct 2026 its only control was that `host` DEFAULTED to `127.0.0.1`, and
  `serve({ host })` accepted any value. **Since then the bind is enforced**: any address but
  `127.0.0.1` or `::1` throws, and a request whose `Host` header is not loopback (DNS
  rebinding) gets 403 — `agent/observability/selftest.mjs` "VIEWER". It still checks no
  credential, so measured rather than inferred — the health monitor starts it on an ephemeral
  loopback port and finds **nine of the eleven routes return data to a request with no
  credential** — to any process on the machine. Defensible for a local development viewer,
  which is what it is. **SESSION 21's Control Room did not inherit it**: `.control-room/server.mjs` is
  a separate server that authenticates and then authorizes every privileged request, and the
  finding above stands unchanged against the viewer. Do not point a Control Room at the
  viewer's routes, and do not "fix" the viewer by bolting a token onto it — they exist for
  different purposes, and merging them would give a development tool a security model nobody
  tests. `docs/HEALTH-MONITOR.md` §6 · `docs/CONTROL-ROOM.md` §1.

- **A lower number is not automatically healthier, and five metrics say so in their own
  definition.** The 111 unverified records, the provenance gaps, the verification gaps, the
  blocking open questions and the rejected proposals are marked `not_a_score`:
  `agent/health/model.mjs` refuses to let any of them be re-labelled as a defect count,
  because every cheap route down — clearing `requires_verification`, attaching a plausible
  substitute, bulk-stamping `last_verified`, removing a `blocks` flag — is a prohibited
  action rather than an improvement. **A rise in the first four is usually good news.**

- **There are two public surfaces, and only one is the website.** **Do not read that as "the Control Room is safe because nobody can find it."** → `docs/DEPLOYMENT.md` §1b, §2.
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

- **Every run store here is git-ignored EXCEPT one, and the exception is deliberate.** → `docs/CONTINUOUS-IMPROVEMENT.md`.

- **The autonomy layer's action ledger is git-ignored, and the COMMIT is the durable record.** → `docs/LIMITED-AUTONOMY.md`.

- **Your base may be stale.** Run `git fetch --all && git branch -a` before concluding
  anything about what this repository contains. An earlier session reported four existing
  documents as missing by running `ls docs` on an unfetched branch (F-01).

## Git

Develop on the session's designated branch; **never push to `main` without explicit
permission.**

**Branch hygiene (AUDIT-2026-09-25 T-40).**
- **At the start of every session**, after `git fetch --all`, run
  `git branch -r --no-merged origin/main`. Report to the author every branch that is
  neither your own nor recorded in the branch register in `docs/HANDOVER.md`, before you
  start the work.
- **At the end of every session**, ask the author whether to open a pull request to `main`,
  and record the branch's disposition in that register. A session whose work is neither
  merged nor closed is a finding for the next session, not background.
  **Before the final checkpoint, a v2 session writes the next session's prompt** — the rule and
  its terms are `docs/ROADMAP-v2.md` §8, "A standing rule: the next session's prompt" (4 Nov 2026).

This is the audit's rule ("every session ends with a PR to main") adapted to the standing
instruction below: a pull request is opened when the author says so, so the obligation is to
ask. Twenty-three of the thirty-three remote branches besides `main` on 26 September 2026 were already in
`main` and had never been deleted. Read the full `git diff` before committing — a one-character `null` → `"unknown"`
edit changes what a record asserts. Do not open a pull request unless asked. Do not include a
model identifier in any commit message or pushed artifact. **`origin/main` can move while a
session runs — re-fetch and diff against it again immediately before the session's final
write to `docs/HANDOVER.md` or any merge, not only at session start.** This has happened, not
hypothetically: `docs/AUDIT-2026-09-03.md`'s opening correction records a session that skipped
this and would have silently erased a concurrently-merged session's handover. See
`.agents/skills/git-workflow/SKILL.md`.

## When to stop and ask

A fact cannot be verified against a retrievable source · two sources disagree and the schema
cannot hold it · the change would store something the architecture derives · the change would
alter what a claim is said to prove · the handover conflicts with the code.

**Report honestly.** Never state a validator passed if it was not run. The site's own
argument is that a record should say what it cannot support; sessions are held to the same
standard.
