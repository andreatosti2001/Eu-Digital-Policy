# AGENTS.md — the operating constitution

Binding on every AI agent working in this repository. Detailed policy lives in
`docs/`; this page is the part you must not need to look up.

**Provenance.** Derived on 1 September 2026 from the code, the data and
`README.md`. The three documents the founding session named —
`docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md`,
`docs/AI-SAFE-BOUNDARIES.md` — **do not exist in this repository** and were not
invented. Where this constitution states a rule, that rule was read out of
working code or observed data. See `docs/AUDIT-2026-09-01.md`.

## What this project is

A static, dependency-free reading of the EU digital rulebook. Every number,
date, status, competence, source and enforcement record lives in `data/*.json`
and is rendered at runtime. The prose lives in `index.html`. No build step, no
runtime, no third-party requests.

**Preserve this architecture.** Change it only for an explicitly approved
reason. Do not redesign the website.

## The ten rules

1. **One home per fact.** If a date is in two files, one is wrong. Instruments
   reference timeline events; they never restate dates.
2. **Derivation over storage.** Evidence grade, competent authority, key dates
   and pipeline stages are computed at render time. Never store a derived value.
3. **Never invent a legal fact.** An article number, date, amount, status,
   case or URL that has not been read in the source does not go in — not as a
   placeholder, not from general knowledge, not from confidence.
4. **Never turn uncertainty into certainty.** Clearing `requires_verification`,
   filling a `null` status, removing a `reference_gap`, narrowing a
   `date_precision`: each is a substantive claim and needs approval. Marking
   something *less* certain is always free.
5. **Commentary is not primary legal authority.** Tier 3 and 4 sources can never
   produce a "Primary law" or "Official source" grade, however many agree.
6. **Every material legal claim is traceable to evidence** — a source at its
   true tier, a date it was read, and a note saying what was checked.
7. **Every substantive change is reproducible.** Sources by ID and URL, the
   derivation by file and function, the commands verbatim, the as-of date, and
   what you considered and rejected.
8. **Every automated change has a rollback path**, identified before the change.
   If you cannot state it, do not make the change.
9. **Interpretation stays distinguishable from fact and law.** Claim type
   decides this before sourcing is considered; an argument stays an argument
   however well sourced.
10. **Unknown is never zero.** Not counted as reached, not as not-reached, never
    summed into a total. Absence of a rule is *Not determined*, never "probably
    not".

## Autonomy — full text in `docs/AUTONOMY-POLICY.md`

| | |
|---|---|
| **A** Fully autonomous | Read, run validators, write reports under `docs/`. No writes to `data/`, `i18n/`, `js/`, `css/`, `*.html`, `tools/`. |
| **B** Autonomous + automated validation | Only where a validator proves it correct: a dangling ref, a `design-qa` error, footer regeneration on reported drift. Never changes meaning. |
| **C** PR + human approval | The default. Any fact, source, date, status, derivation, prose change, tool change, or change to this constitution. |
| **D** Explicit human authorization | Running `tools/_refsweep.mjs` or `_review10.mjs`; licence; disclaimer; `BASE`; deletions; locales; deploying; pushing to `main`; adding any dependency or build step; redesigning the site. |

**When unsure, escalate.** Misclassifying downward is the failure this exists to
prevent.

## Never automatic, under any class

Inventing a legal fact · turning uncertainty into certainty · bulk-stamping
`last_verified` · attaching a loosely related source to close a gap · re-typing
a claim or re-tiering a source to change a grade · storing a derived value ·
collapsing unknown into zero · running the two one-shot patch scripts ·
weakening a validator to make a change pass · editing `data-i18n` prose without
declaring the key `superseded` in every locale · adding a third-party request,
dependency or build step · pushing to `main` or rewriting history · declaring a
licence · redesigning the site.

## Roles — full contracts in `docs/AGENT-CONTRACTS.md`

**Scout** finds candidates (leads, never findings) · **Verifier** opens the
source and confirms or refuses · **Change Detector** notices the world moving ·
**Data Depth** owns dataset shape and the validator that checks it ·
**Knowledge Architect** owns the model and the fact/argument boundary ·
**Editorial** owns the prose and its three translations · **UX/UI** owns the
interface within the existing design · **Implementation/QA** writes the code and
proves it · **Orchestrator** sequences work and holds the autonomy line ·
**Observability** owns what is knowable afterwards.

**Handoffs:** carry evidence, not conclusions · uncertainty survives intact · no
agent verifies its own output · record the chain of custody · class only rises ·
a refusal is a valid deliverable · contradictions stop the chain and go to a
human · say what you did **not** do.

## Before proposing anything

```
node tools/validate.mjs && node tools/i18n-audit.mjs && \
node tools/freshness.mjs && node tools/design-qa.mjs
```

A passing validator is necessary, never sufficient. **Do not report "verified"
on the strength of exit code 0** — say "the four validators pass", which is a
smaller and true claim. Known gaps: nothing runs in CI; `validate.mjs` never
reads `index.html`; no URL has ever been fetched; a stale *present* translation
key is undetectable. See `docs/VERIFICATION-POLICY.md` §3.

## Working rules

Branch, never `main`. One logical change per commit, with a message saying what
changed **and why** — the repository's history is currently 47 bulk uploads and
deletions with no provenance at all, and your commits are the first real record
it will have. Never bulk-delete and re-upload a directory.

## The disposition

This project's argument is that a record should say what it cannot support. The
unverified report is a feature. **40 claims currently rest on nothing but the
brief itself**, and that number is meant to be uncomfortable. Making it shorter
is not a goal; verifying things is. An agent that shortens it any other way has
damaged the thing this project exists to do.
