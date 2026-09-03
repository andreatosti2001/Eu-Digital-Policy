# Agent contracts

**Status:** binding. Defines ten roles, what each owns, what each may never do,
and the rules for passing work between them.

A "role" is a contract, not a process requirement. One agent may hold several in
one session; it must then satisfy each contract separately and must not use one
role's authority to discharge another's obligation. **In particular: an agent
may not verify its own scouting.**

Every role is bound by `AUTONOMY-POLICY.md` and by the eight absolute
prohibitions in `AI-SAFE-BOUNDARIES.md` §0. Nothing below grants authority
either withholds.

**Existing skills that already implement parts of these contracts** (SESSION 00,
`.agents/skills/`): `project-context` (the mandatory session-start read),
`repository-audit` (Scout and Change Detector procedure), `data-governance`
(Verifier and Data Depth), `git-workflow` (Implementation/QA and Orchestrator).
Invoke them rather than re-deriving their steps.

---

## 1 · Scout — finds candidate sources and changes

**Owns:** locating publications, decisions, judgments and regulator output that
bear on existing records; identifying what has moved in the world.

**Produces:** candidates, each with URL, publisher, publication date, proposed
tier, the exact passage relied on, and which record it bears on.

**Never:** attaches a source to a claim; edits any file in `data/`; assigns a
final tier; describes a candidate as confirming anything. **A Scout's output is
a lead, not a finding** — its default autonomy is Class A, and it becomes Class C
only once a Verifier has taken it.

**Failure mode to avoid:** returning something plausible and topical because
nothing exact was found. An empty result is a correct result — and so is
"absent", provided the absence was established on a fetched, current base
(`AUDIT-2026-09-01.md` F-01).

## 2 · Verifier — turns a candidate into a fact, or refuses to

**Owns:** opening the source, reading the passage, and deciding whether it
carries what the record says. Sets `last_verified` and writes
`verification_note`.

**Produces:** for each candidate — **confirmed** (with the passage and the
grade it can support), **insufficient** (with what is still missing), or
**contradicted** (with what the source actually says).

**Never:** verifies a candidate it scouted itself; infers content from a title,
abstract or search snippet; upgrades a tier to reach a desired grade; clears
`requires_verification` without having read the source; bulk-stamps
`last_verified`.

**Authority:** Class C. A Verifier's confirmation is a *proposal* for human
approval, never a merge.

**The Verifier is the only role that may move a record from uncertain to
certain**, and even then only through Class C.

## 3 · Change Detector — notices when the world has moved past the record

**Owns:** watching for events that invalidate stored values — a decision
adopted, an appeal resolved, a fine collected, a transposition deadline passed,
a status changed, a URL rotted.

**Produces:** a list of records that *may* be stale, each with what changed and
the evidence that it changed. Runs `freshness.mjs` and reports it **with its
as-of date**.

**Never:** updates a record; treats `url:live` as evidence a link works
(nothing in this repository has ever fetched a URL — audit F-12); treats a
`freshness.mjs` exit code 0 as evidence of currency, when it currently reports
"nothing past its stated interval" while the newest enforcement decision is 38
days old against a 45-day interval.

**Hands to:** Scout (find the source) → Verifier (confirm) → Data Depth (write).

## 4 · Data Depth — owns the shape of the datasets

**Owns:** `data/*.json` structure — schemas, ID discipline, taxonomy,
referential integrity, the placement of a fact in its one home.

**Produces:** structural changes, and the corresponding updates to
`tools/validate.mjs` — **a new dataset or field that no validator checks is
incomplete work.** `validate.mjs` parses every `data/*.json` but only checks
shapes it knows by name; an unrecognised file passes silently.

**Never:** changes the *value* of a fact under cover of a structural change;
stores a derived value (`DATA-GOVERNANCE.md` §1.2); adds a second home for a
fact without both a generator and a drift check; adds a wildcard reference
without flagging that it carries no referential guarantee.

**Authority:** Class C. Structural change is never Class B.

## 5 · Knowledge Architect — owns the model, and the boundary between fact and argument

**Owns:** the claim-type vocabulary, the tier→grade map, the pipeline stages and
their derivation rules, the applicability outcome ladder, the three-state
discipline (reached / not-reached / unknown).

**Produces:** changes to derivation logic, each with the before/after tallies
across the whole corpus, so the blast radius is visible.

**Never:** changes a derivation to alter how specific records come out — that is
falsification wearing a refactor's clothes; introduces a fourth state; permits
a stored value to shadow a derived one; allows an `argument`-family claim to be
gradeable by sourcing.

**Authority:** Class C, always, with the full tally diff in the change
description. This role's changes have the widest reach in the project.

## 6 · Editorial — owns the prose of the brief

**Owns:** the written analysis in `index.html`, the argument, and the
distinction in the text between what the law says and what the author thinks.

**Produces:** prose changes, each carrying: the claim IDs affected, the
`superseded` declaration for **every** locale holding a translation of the old
English, and confirmation that `__CONTENT__.search[].text` no longer disagrees
with the visible text.

**Never:** states as fact something no claim supports; softens a stated
limitation to make the project look better; edits a `data-i18n` string without
handling all three locales — this is the failure phase 5 caught with the Annex A
captions, and the locales are **already** asymmetric on
`annex-a.figcaption1` (audit F-05); silently changes a number that appears in
both prose and data.

**Must know:** the ~60 KB `__CONTENT__` object in `index.html` holds a second
copy of the prose and of all 14 part titles, and **no validator checks it**
(audit F-04). Editing prose means editing both copies.

## 7 · UX/UI — owns the interface, within the existing design

**Owns:** `css/tokens.css` and the sheets that consume it, the shared chrome in
`js/shell.js`, accessibility, the visual separation of law / fact / argument.

**Produces:** interface changes that pass `design-qa.mjs` with no new errors.

**Never:** **redesigns the website** — explicitly out of scope; adds a
page-local `<style>` block; adds a third-party stylesheet, script or font;
declares a theme-dependent token at `:root` (the day palette is an attribute on
`<body>`; this has shipped as a bug twice); carries status by hue alone — every
`.badge` state needs a glyph and a border so it survives greyscale, a printer
and a colour deficiency; renders an `argument`-family claim like binding law;
removes the footer or `<noscript>` notice, or moves either into JS-rendered
chrome.

**Must know:** `design-qa.mjs` harvests custom-property declarations out of
JavaScript by regex, so its "undeclared property" error can be silenced by a
stray `--foo:` in any JS string or comment (audit F-10). A clean run is weaker
evidence than it looks.

**Since SESSION 19 there is a browser.** `agent/browser/` opens every page,
drives the search palette, the glossary, the comparison, the applicability tool
and the language switch, and reads the RENDERED DOM. It closes some of Agent 8's
twelve open questions by measurement and it found three defects the four
validators cannot see (`docs/BROWSER-QA.md` §4). It still computes no contrast,
runs no screen reader and compares no pixels, and it is Chromium only — README
limitation 7 is unchanged.

**Filled by `agent/ux/` since SESSIONS 16 and 17 — for the OBSERVING half only.**
Agent 8 audits the interface and produces `UXProposal` findings and testable
proposals, each behind a pending approval. It restyles nothing, drafts no value
and adds no design token, and it opens no page: every record it writes carries
README limitation 7 as a blocking open question. The *never* list above is
unchanged and still binds whoever acts on one of its proposals — this agent
cannot act on them. `docs/UX-AUDIT.md`.

## 8 · Implementation/QA — writes the code and proves it

**Owns:** `js/*.js`, `app.js`, `tools/*.mjs`; running the validators; the
evidence that a change does what it claims.

**Produces:** the diff, the verbatim commands run, their output before and
after, and the rollback path.

**Never:** weakens a validator to make a change pass — deleting a check,
widening an exemption, downgrading an error to a warning is prohibited under
every autonomy class; runs `_refsweep.mjs` or `_review10.mjs` (Class D, audit
F-03); adds a dependency, build step or service worker; reports "verified" on
the strength of exit code 0; leaves a new module unwired from `boot.js` while
describing it as shipped.

**Must know:** there is no `package.json` and no git hook, and until SESSION 18
there was no CI either. `.github/workflows/qa.yml` now runs all four validators
against the recorded baseline, every agent suite, the contract check, the
public/private boundary check and the browser suite on every push — **which makes
a failure visible, not blocking.** A push to `main` still publishes.

**Filled by `agent/implement/` since SESSION 18 — as Agent 9, not the brief's
Agent 8** (Agent 8 is the UX/UI Auditor; the brief's numbering predates it, as
SESSION 13's and SESSION 16's did). It verifies ten mechanical gates before
writing anything, derives the permitted file set from the proposal rather than
taking it as an argument, enforces scope against git afterwards, runs the four
validators against the baseline parsed out of `CURRENT-ARCHITECTURE.md` §12, makes
browser QA a blocking requirement where the validators cannot see what changed,
and reverts itself if anything comes back worse — verifying the revert by
re-hashing rather than asserting it.

**Approval is governed system state.** An `ApprovalRequest` in `agent/records/` is
a REQUEST whatever its `state` says, because agents write that directory. A grant
lives only in `agent/implement/decisions/`, requires a named human who is not an
agent, and is bound to the proposal's hash — so editing the proposal afterwards
voids the approval rather than carrying it onto a wider scope. Run against the
real store it implements nothing and refuses everything, which is the correct
result: not one proposal in this repository has ever been decided.
`docs/IMPLEMENTATION-QA.md`.

**The *never* list above is unchanged and binds this agent too.** In particular it
may never write `tools/_refsweep.mjs` or `tools/_review10.mjs`, `agent/schemas/`,
or its own approval ledger — no approval can authorise any of them, because doing
them mechanically is the harm.

## 9 · Orchestrator — sequences the work and holds the line on autonomy

**Owns:** decomposing a task into roles, ordering handoffs, classifying each
change under `AUTONOMY-POLICY.md`, and deciding when to stop and ask.

**Produces:** the plan, the classification of every change with its reason, and
the consolidated change description.

**Never:** lets one agent both scout and verify the same fact; downgrades a
change's class to avoid an approval — **when unsure, escalate**; merges a Class
C change on its own authority; proceeds past a contradiction between two roles
by picking the more convenient answer; presents partial completion as
completion.

**Must:** state explicitly, in every handoff, which facts are established and
which are assumed. The most common failure in this repository's history is an
assumption inherited as a fact — see audit F-01, where three named input
documents did not exist at all.

## 10 · Observability — owns what is knowable after the fact

**Owns:** the validators' output over time, the freshness signal, the unverified
report, and the honest statement of what the project cannot currently see.

**Produces:** periodic reports of the four validators' output **with dates**;
the grade tally recomputed from the data; movement in the unverified count and
*why* it moved.

**Never:** presents a metric as measured when it is asserted — `url:live` is a
stored field, not a probe; reports a count without the date and command that
produced it; celebrates a shrinking unverified report without establishing that
it shrank through genuine verification.

**Standing blind spots this role must keep visible** (audit F-02, F-05, F-08,
F-12, F-14): nothing runs automatically; no URL has ever been tested; a stale
*present* translation key is undetectable; the README's four derived counts are
typed by hand and checked by nothing; failures after deployment are
`console.error` only and reach no one; a 404 on a locale file is swallowed to
`{}` by design.

---

## Inter-agent handoff rules

**H1 · A handoff carries evidence, not conclusions.** Pass the source, the
passage and the date. "Confirmed" without the passage is not a handoff.

**H2 · Uncertainty survives the handoff.** Every handoff separates *established*
from *assumed*. A receiving agent inherits the uncertainty at full strength.
Certainty is never created by transfer.

**H3 · No agent verifies its own output.** Scout→Verifier, Editorial→Verifier
for any factual assertion, Implementation→QA evidence, Knowledge
Architect→corpus-wide tally diff. Where one agent holds both roles, it must
state that and hold the second contract to the same standard.

**H4 · The chain of custody is recorded.** Every value that reaches `data/`
carries: who scouted it, who verified it, on what date, from what source. Where
a link is missing, the record says so rather than implying a complete chain.

**H5 · Class is set at the handoff, by the Orchestrator, and only rises.** A
downstream agent may escalate a change's class; it may never lower one.

**H6 · A refusal is a valid deliverable and is passed on intact.** "No source
was found", "the source contradicts the record", "this cannot be established
from a primary source in this build" are results. A downstream agent may not
convert a refusal into a softer statement.

**H7 · Contradictions stop the chain.** Where two roles disagree on a fact, work
halts and goes to a human. It is never resolved by seniority, recency or
convenience.

**H8 · Derivation changes are announced upstream and downstream.** A Knowledge
Architect change touches every record; Observability recomputes the tallies and
Editorial checks whether any prose now misdescribes them.

**H9 · Every handoff names the rollback path** for whatever it is asking the
next agent to do (`AUTONOMY-POLICY.md` §4).

**H10 · The last agent reports what was not done.** Scope left incomplete,
blocked, or deliberately declined is stated explicitly. Silence reads as
completion, and in this repository that has already cost a phase record
(audit F-07).
