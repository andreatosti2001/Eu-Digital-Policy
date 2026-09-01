---
name: data-completeness
description: Measure what the corpus does not yet establish — evidence grades, unsourced assertions, reference gaps, null vs unknown, structural coverage — and report gaps without closing them. Use when scoping verification work or reporting the evidence position.
---

# data-completeness

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

Say precisely what is missing, in numbers that cannot drift from the data. The project's
honesty rests on its stated gaps being *measured*, not remembered — the bibliography computes
its tally live on every page load for exactly this reason.

## When to invoke

Scoping a verification session. Reporting the evidence position in a handover or to the
author. Checking whether a change moved the corpus's completeness. Auditing the `null` /
`unknown` distinction.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Counting and characterising gaps | Closing one — `legal-source-verification` |
| Where the corpus is thin | Whether a *record* may be edited — `data-governance` |
| What is missing now | Whether the world has moved — `regulatory-change-detection` |
| The evidence census | Whether the *code* does what the docs say — `repository-audit` |

## The tools, and what each owns

Each number has one home. Do not recompute another tool's number.

```
node tools/validate.mjs                                   # the unverified / requires-verification list
node tools/freshness.mjs                                  # verification-date age, passed events, link health
node .agents/skills/data-completeness/scripts/gaps.mjs    # the census below
node .agents/skills/data-completeness/scripts/gaps.mjs --json
```

`gaps.mjs` reports what nothing else prints: the evidence-grade tally, grade by claim type,
what each claim actually rests on, the `supports` distribution, the reference gaps with their
notes, a `null` / `unknown` / value census per enforcement axis, and structural coverage
(instruments with no provisions, milestones, instrument-specific competence edge or
applicability rule; rules with no obligations; sources never cited).

It **imports `evidenceGrade` from `js/format.js`** rather than reimplementing it, so the
census cannot disagree with the page. It hardcodes no threshold and no expected count, and
always exits 0 — a gap is a finding, not a failure.

## How to read the census

- **`unresolved` is the number that matters.** A claim grades unresolved when no *external*
  direct source supports it. `src-brief-original` is excluded by the grading function by
  design; attaching it never moves a grade.
- **`direct, but only the brief itself`** is the backlog. These are claims the prose asserts
  and nothing outside the site supports yet.
- **Every `interpretation` and `critique` grades `interpretation`** whatever its sources —
  that is correct, not a gap. Sources support the premises of an argument; they do not settle
  its conclusion. Do not "improve" that number.
- **Reference gaps are asterisks in the prose.** Each names the publication the brief was
  pointing at, or records that none was named. The second kind cannot be closed by searching
  harder, and saying so is the point.
- **`null`, `unknown` and a value are three columns and stay three columns.** Summing any two
  of them produces a false statement about what has been researched.
- **Structural coverage gaps are questions.** An instrument with no provisions may be
  correctly recorded for scope-mapping only; four instruments carry an explicit "recorded for
  scope-mapping, status not established" note.

## Reporting

State the as-at date, the numbers, and the source of each number. Compare against the
previous session's figures rather than against an impression. Where a number moved, say which
records moved it. A completeness report that cannot be reproduced from the repository by the
next session is not a measurement.

## Done when

- Every number in the report names the tool that produced it.
- The as-at date is stated.
- No gap was closed, softened, or described as smaller than it is.

## Refusal conditions

- Do not close a gap from this skill. Measuring and fixing are separate acts.
- Do not restate a number from memory or from a document; recompute it.
- Do not present `unknown` as zero, or a percentage that treats it as zero.
- Do not soften the unverified count, the eight README limitations, or a reference gap.
  **RED** under `docs/AI-SAFE-BOUNDARIES.md` §0.7 and §3.
