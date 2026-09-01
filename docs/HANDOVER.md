# HANDOVER

**Last updated:** SESSION 01 · 1 September 2026
**Branch:** `claude/repo-architectural-audit-v45psd`
**Base commit:** `c2e62c7` on `main` (SESSION 00)

---

## Current milestone

**SESSION 01 — Independent architectural audit, and the AI operating
constitution. Complete.**

No production code, data, markup, styles or tooling was modified.
`git status --porcelain` shows additions and `docs/` edits only.

## Concurrent sessions — three branches were live at once

This session did not run alone, and the record should say so rather than imply a
clean sequence. As of 1 September 2026 11:00 UTC:

| Branch | Commit | What it did |
|---|---|---|
| `main` | `064469c` | SESSION 00, plus `AGENTS.md` / `CLAUDE.md` added at 10:57 |
| `claude/eu-digital-policy-protocol-kye69t` | `63a22ac` | **SESSION 02 — the observability layer.** Built at 10:24. Branched from `c2e62c7`; **not merged.** |
| `claude/repo-architectural-audit-v45psd` | this branch | SESSION 01 — the audit and the operating policies |

**On the objective.** SESSION 00's handover set the next objective as the
observability layer. The instruction that opened this session set it as an
independent architectural audit plus the AI operating constitution. The
instruction governed. SESSION 02 has since built the observability layer on its
own branch, so the objective is met — by a different session, not by this one.
This session instrumented nothing and does not claim to have.

**On `AGENTS.md` and `CLAUDE.md`.** Both this session and the session that
produced `064469c` wrote them, independently and within an hour of each other.
`064469c` reached `main` first and is canonical. Its design decision is the
better one and is adopted here in full: **`AGENTS.md` holds the rules and
`CLAUDE.md` points to it**, because duplicating them would create the second
home for a fact that this project's first principle forbids. This session's
versions are discarded, not merged in parallel; what survives from them is
folded into the canonical files as *links* to the five operating policies and as
five hazard lines carrying audit findings the canonical file did not yet have.

## Implementation

**An independent adversarial audit** — `docs/AUDIT-2026-09-01.md`. Sixteen
findings in three priority bands, each with the command or `file:line` that
produced it. Read from code and data first; `README.md` and the SESSION 00
documents treated as claims to be tested.

**The constitution** — `AGENTS.md`, `CLAUDE.md` and five policies in `docs/`:
`DATA-GOVERNANCE.md`, `SOURCE-POLICY.md`, `VERIFICATION-POLICY.md`,
`AUTONOMY-POLICY.md`, `AGENT-CONTRACTS.md`. Four autonomy classes (A/B/C/D),
nineteen prohibited automatic actions, ten agent roles, ten handoff rules.

The constitution **builds on the SESSION 00 layer and does not replace it**.
A/B/C/D refine green/amber/red rather than substituting for them
(`AUTONOMY-POLICY.md` opening table); the eight absolute prohibitions in
`AI-SAFE-BOUNDARIES.md` §0 are restated, not rewritten; where two documents
could be read differently, the stricter reading governs.

## Files changed

**Added (6):** `docs/AUDIT-2026-09-01.md`, `docs/DATA-GOVERNANCE.md`,
`docs/SOURCE-POLICY.md`, `docs/VERIFICATION-POLICY.md`,
`docs/AUTONOMY-POLICY.md`, `docs/AGENT-CONTRACTS.md`.

**Modified (3):** `AGENTS.md` and `CLAUDE.md` — the canonical versions from
`064469c`, extended with links to the five policies above and with five hazard
lines from the audit (F-01, F-06, F-10, F-11, F-12, F-15). No rule from those
files was restated. `docs/HANDOVER.md` — this record; SESSION 00's entry is
preserved below in full.

**Untouched:** all HTML, JS, CSS, `data/`, `i18n/`, `tools/`, `README.md`, and
the three SESSION 00 documents.

## A correction this session had to make about itself

This branch was cut from `7248290`, **before** SESSION 00 landed at `c2e62c7`.
The first version of the audit therefore opened with a P0 finding that
`docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md` and
`docs/AI-SAFE-BOUNDARIES.md` did not exist. They did. `ls docs` was run on a
stale tree and the result reported as a property of the repository, without
`git fetch`.

F-01 is retracted in place and replaced with the finding that survives: **a
feature branch gives an agent no signal that its base is stale.** No CI, no
branch protection, and `git log` shows only the branch's own ancestry. The
mitigation is now the first step of `AGENTS.md` and of
`VERIFICATION-POLICY.md` §3a.

SESSION 00's own `repository-audit` skill opens with `git branch -a`. Following
it would have prevented this.

## Tests

All four validators, before and after. Identical to the SESSION 00 baseline at
`docs/CURRENT-ARCHITECTURE.md` §12:

| Validator | Result |
|---|---|
| `node tools/validate.mjs` | 0 errors · 0 warnings · 106 unverified · exit 0 |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings |
| `node tools/design-qa.mjs` | 0 errors · 5 warnings · exit 0 |
| `node tools/freshness.mjs` | reports only · exit 0 |

The five `design-qa` warnings are the pre-existing ones, unchanged. This session
added only Markdown, which no validator reads, so an unchanged baseline is the
expected result rather than evidence of care.

**No browser or accessibility test was run** — no markup changed, and there is
no test runner in this repository.

## Observability

**This session instrumented nothing.** Stating that plainly. It produced
documents, and documents are not instrumentation.

What it added to the observability *baseline* is a written account of what the
existing signals do not cover — `AUDIT-2026-09-01.md` F-12 and F-14, and
`docs/AGENT-CONTRACTS.md` §10: no URL has ever been fetched despite a
`SOURCE REACHABILITY` heading; a stale *present* translation key is undetectable;
the README's four derived counts are checked by nothing; post-deployment failures
reach `console.error` and no one; a 404 on a locale file is swallowed by design.

## Known limitations

1. **The deployed site was not inspected.** Unchanged from SESSION 00.
2. **The audit is a static read.** No page was opened in a browser; no
   derivation was exercised against a rendered DOM. Findings about runtime
   behaviour are read from source.
3. **Grade tallies were recomputed by re-implementing `evidenceGrade` in a
   throwaway script**, not by running the site. The counts matched the README
   exactly, which is corroboration rather than proof.
4. **The constitution is untested by use.** No session has yet worked under it.
   Its autonomy classes are a judgement about this repository's risks, and the
   first session to hit an awkward boundary should report it rather than
   route around it.

## Unresolved issues

SESSION 00's four remain open and unchanged. This session adds provenance to
the second and evidence to the third:

**1. `data/brief.json` is canonical but never consumed.** Open. Unchanged.

**2. The two copies have drifted — the cause is now established.**
`tools/_review10.mjs:54` rewrote that sentence in `index.html` on 28 Aug 2026 to
correct the miscount the external review raised as P2.1 ("the six subjects are
not six regulations"), and the script opens only `index.html` and
`i18n/locales.json` — never `data/brief.json`. `brief.json`'s standfirst begins
with the script's `from` string, not its `to` string. So the canonical file
holds the text the review already ruled wrong.
**Still the author's decision, and deliberately not made here.** The evidence is
in `AUDIT-2026-09-01.md` F-04.

**3. No deploy gate.** Open, and now the audit's top remediation item (F-02).

**4. 106 records carry an unverified note.** Open. `SOURCE-POLICY.md` and
`VERIFICATION-POLICY.md` §6 govern how that number may and may not move.

**5. NEW — the one-shot patch scripts have already corrupted canonical data
once.** Issue 2 is the demonstration. `_refsweep.mjs` and `_review10.mjs` remain
runnable, hardcoded to `2026-08-28`, with no dry-run or backup. Classed D.
See F-03.

## Next session

**First: merge the three live branches.** SESSION 02's observability layer
(`63a22ac`) branched from `c2e62c7` and does not include `064469c` or this
branch. Three sessions have now written governance documents in parallel, and
the repository has no mechanism that made any of them aware of the others. That
is itself the finding — see F-01 and the concurrent-sessions table above.

**Then: the CI gate (audit F-02).** It is green-tier, it closes SESSION 00's
unresolved issue 3, and it is the thing that makes every other check in this
repository mean something. A run-record layer that nothing triggers
automatically has exactly the problem the four validators have today: it is
opt-in, and nothing notices when it is skipped. Wiring the validators — and
SESSION 02's run-record writer — into a workflow is the single highest-value
change available.

**Then: audit F-04.** Extend `validate.mjs` to parse `__CONTENT__` out of
`index.html` and diff it against `brief.json` and `instruments.json`. Highest-
value new check in the repository; closes SESSION 00's unresolved issues 1 and 2.

## Next-session instructions

- `git fetch --all && git branch -a` **first**. Then invoke `project-context`.
- Read `AGENTS.md`, then the four SESSION 00 documents, then
  `docs/AUDIT-2026-09-01.md`.
- Re-run the four validators and confirm the §12 baseline before changing
  anything.
- Run records are build artifacts. **They do not belong in `data/`** — that
  directory is reserved for the legal record.
- Classify every change under `docs/AUTONOMY-POLICY.md` and say which class, and
  why, in the commit.

## Do not

SESSION 00's "Do not" list stands in full and is reproduced in the archived
record below. Added by this session:

- **Do not treat a passing validator as verification.** Say "the four
  validators pass", which is smaller and true.
- **Do not conclude a file is absent without having fetched.**
- **Do not fix the `brief.json` / `__CONTENT__` standfirst drift**, even though
  this session established which copy is stale. Knowing which is wrong is not
  authority to choose what ships.

---

# SESSION 00 — archived record

## Current milestone

**SESSION 00 — Establish project context. Complete.**

Reconnaissance of the repository and creation of the agent-facing governance layer. No
production code was modified.

## Implementation

Ten new documents. Nothing else.

- `AGENTS.md` — the canonical agent entry point: what the project is, the reading order, the
  rules that matter most, the architecture that must not be rebuilt, the validators and
  their baseline, the known hazards, git discipline, and when to stop and ask.
- `CLAUDE.md` — a pointer to `AGENTS.md`. Deliberately holds no rules of its own, so the
  entry point does not become the second home for a fact.
- `docs/PROJECT-CONTEXT.md` — what the project is, its provenance, the seven governing
  principles enforced by `tools/`, the factual-vs-analytical split, the measured evidence
  position, audience and stakes, licence position.
- `docs/CURRENT-ARCHITECTURE.md` — rendering model, inventory, module topology, the per-page
  dataset dependency table, the derivation layer, the data model, the `__CONTENT__` bypass,
  an ASCII dependency map from canonical record to reader, presentation layer, localisation,
  tooling with recorded baseline, build and deployment.
- `docs/AI-SAFE-BOUNDARIES.md` — eight absolute prohibitions, green/amber/red tiers with
  file-level scope, known hazards, the required before/after procedure, stop-and-ask
  conditions.
- `.agents/skills/project-context/SKILL.md`
- `.agents/skills/repository-audit/SKILL.md`
- `.agents/skills/data-governance/SKILL.md`
- `.agents/skills/git-workflow/SKILL.md`

## Files changed

**Added (10):**
```
AGENTS.md
CLAUDE.md
docs/PROJECT-CONTEXT.md
docs/CURRENT-ARCHITECTURE.md
docs/AI-SAFE-BOUNDARIES.md
docs/HANDOVER.md
.agents/skills/project-context/SKILL.md
.agents/skills/repository-audit/SKILL.md
.agents/skills/data-governance/SKILL.md
.agents/skills/git-workflow/SKILL.md
```

**Modified: none.** No HTML, JS, CSS, `data/`, `i18n/`, `tools/` or `README.md` file was
touched. Verified by `git status --porcelain`.

## Architecture decisions

1. **Preserve, do not rebuild.** The zero-build, zero-dependency, client-rendered
   architecture is a deliberate design with enforcement scripts behind it, not an accident
   to be migrated away from. Recorded as the closing statement of this handover.
2. **Documentation only.** Reconnaissance found two real defects (below). Both were recorded
   with evidence and left unfixed, because fixing them is canonical-data work requiring the
   author's decision and is outside a reconnaissance boundary.
3. **Skills placed at `.agents/skills/<name>/SKILL.md`**, matching the path the session
   protocol instructs agents to read.
3a. **`AGENTS.md` is canonical and `CLAUDE.md` points to it.** Duplicating the instructions
   across both would create exactly the second home for a fact that this project's first
   principle forbids, in the file that teaches the principle.
4. **The validator baseline is written into the architecture document**, including the five
   pre-existing `design-qa` warnings by file and line, so a later session can distinguish a
   new warning from an inherited one.

## Tests

All four validators were run against the tree with the new documents present. Results are
identical to the pre-change baseline at `7248290`:

| Validator | Result |
|---|---|
| `node tools/validate.mjs` | 0 errors · 0 warnings · 106 unverified/requires-verification · exit 0 |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings |
| `node tools/design-qa.mjs` | 0 errors · 5 warnings · exit 0 |
| `node tools/freshness.mjs` | reports only · exit 0 |

The five `design-qa` warnings are pre-existing and unchanged: 3 inline event handlers in
`index.html` (lines 42, 112, 119); `#000` literal in `css/evidence.css`; `#000` literal in
`css/tools.css`; `--tx` and `--ty` never set in `style.css`.

**No browser or accessibility test was run.** There is no test runner in this repository and
this session changed no markup, so there was nothing to exercise. The Playwright suites used
during development live outside this repository.

## Observability

**This session implemented no agent and no workflow, so nothing runtime was instrumented.**
Stating that plainly rather than claiming instrumentation that does not exist.

What it did establish is the **observability baseline**: the four validators and their exact
output at `7248290`, recorded in `docs/CURRENT-ARCHITECTURE.md` §12 and in this handover, so
a later session can detect drift rather than guess at it.

The project currently has **no run-record layer** — no run IDs, no agent/task records, no
tool-call or decision logs, no confidence or risk fields, no artifact register, no handoff
records. The validators write to stdout only. Designing that layer is the next objective.

## Known limitations

1. **The deployed public site was not inspected.** Outbound access to
   `andreatosti2001.github.io` is refused by this environment's network policy (HTTP 403 on
   CONNECT, 5 of 5 attempts). Every statement in these documents is read from the
   repository. No claim is made about what the live site currently serves.
2. **The GitHub Pages source setting could not be read.** Deployment from `main` at root is
   inferred from the canonical URLs in all seven pages and the absence of any workflow. The
   setting itself is repository configuration outside the tree.
3. **The documents describe `7248290`.** They will drift as the code changes and must be
   maintained alongside it.
4. The eight limitations the README states about the site itself are unchanged by this
   session and remain accurate.

## Unresolved issues

**1. `data/brief.json` is canonical but never consumed.** No module fetches it. The only
four `'brief'` occurrences in `js/` are nav-model IDs in `js/shell.js` (lines 35, 215, 230,
247). The brief's structural data instead ships as an inline `window.__CONTENT__` blob
(~59.8 KB) at `index.html:361`. Two homes for one set of facts — the exact condition
`validate.mjs` §4 exists to prevent, in the one place it cannot see.

**2. The two copies have already drifted.** `meta.standfirst` differs:
- `brief.json` — "Six regulations, one directive family and a live reform package now govern…"
- `__CONTENT__` — "Six regulatory regimes — regulations, a family of directives and a live reform package — now govern…"

All 14 `nav` entries still agree with `brief.parts` on id, roman, title and reading minutes,
so the drift is currently confined to that one field. **Which standfirst is correct is the
author's decision** — an agent must not pick one. `tools/_review10.mjs:103` shows the
duplication was already known during an earlier prose edit.

**3. No deploy gate.** A push to `main` publishes. The validators do not run in CI because
there is no CI. Adding a workflow that runs all four is a green-tier change and would close
this.

**4. 106 records carry an unverified or requires-verification note.** A declared, honest
state rather than a defect, but it is the project's largest open body of work.

## Next session

**SESSION 01 — Design and implement the agent observability layer.**

The protocol requires every agent and workflow to expose run ID, agent, task, inputs,
outputs, tool calls, decisions, confidence, risk, artifacts, errors and downstream handoffs,
and explicitly forbids relying on console output as the mechanism. No such layer exists. It
must exist before any agent is built on top of it, or every later session will invent its
own.

Recommended scope: a schema for the run record; a zero-dependency writer the `tools/`
scripts and any future agent can call; a location and retention rule for run artifacts; and
retrofitting the four existing validators to emit a structured record alongside their
human-readable output — without changing what they print or their exit codes.

## Next-session instructions

- Invoke `project-context` first. Read all four `docs/` files and `README.md` before code.
- Re-run the four validators and confirm the baseline still matches §12 of
  `docs/CURRENT-ARCHITECTURE.md` before changing anything.
- The observability layer is **additive**. It must not alter what the validators print, their
  exit codes, or any page's runtime behaviour. Zero dependencies and zero build step are
  hard constraints, not preferences.
- Run records are build artifacts, not canonical data. **They do not belong in `data/`** —
  that directory is reserved for the legal record.
- If a document here conflicts with the code, the code wins. Report the discrepancy.

## Do not

- **Do not rebuild the site.** No framework, no bundler, no build step, no dependency, no
  service worker, no server-side rendering. All are absent by explicit design and two of
  them are actively failed by `design-qa.mjs`.
- **Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.** It needs the
  author's decision on which standfirst is correct.
- **Do not modify `data/*.json`** in a session not scoped for data work.
- **Do not touch** the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or the `BASE` constant in
  `tools/_footer.mjs`.
- **Do not declare a licence.**
- **Do not soften** the README's known limitations or the unverified-record count.
- **Do not re-run** `tools/_refsweep.mjs` or `tools/_review10.mjs`. They are applied one-shot
  patches retained as an audit record.

---

## What must NOT be rebuilt

The closing statement of the reconnaissance.

**The architecture is not technical debt. It is the argument.**

A site whose thesis is that a record should say exactly what it can and cannot support is
built as static HTML, vanilla ES modules and JSON precisely so that every fact it shows can
be traced, by hand, from a canonical record to the pixel that renders it. There is no build
step to obscure that path, no dependency that could change it, and no third-party request
that could observe the reader following it.

Specifically, do not rebuild:

- **The zero-build, zero-dependency, client-rendered model.** A framework would add a
  compilation step between the data and the reader, which is the one thing this design
  refuses.
- **`js/data.js` as the sole fetch point.** No renderer calls `fetch()`. That is what makes
  the dependency map in `docs/CURRENT-ARCHITECTURE.md` §9 true rather than aspirational.
- **The derivation layer.** Grades, pipeline stages, competent authority and key dates are
  computed, never stored. Caching any of them into the data would recreate the drift the
  whole model prevents.
- **The one-home-per-fact data model.** Instruments carry no dates; competence is an edge.
  Denormalising for convenience is how the two copies come to disagree.
- **The taxonomy as universal enum authority.** 243 terms, IDs never renamed.
- **The `null` / `unknown` distinction and unknown-is-never-zero.** These are the site's
  epistemics expressed as a schema.
- **`js/shell.js` as the single chrome renderer**, and `js/evidence-view.js` as the single
  source renderer. Both exist because the duplicated versions had already disagreed with
  each other in production.
- **The seven duplicated footers.** The duplication is deliberate: a statement of
  non-affiliation that only appears when JavaScript runs is not a statement of
  non-affiliation. `design-qa.mjs` keeps the copies identical; `tools/_footer.mjs`
  regenerates them.
- **The four validators.** They encode defects that have already shipped. Extend them; do
  not replace them.

What *should* be built is what is genuinely missing: the observability layer, a CI gate that
runs the four validators, and the verification work that closes the 106 open records.
