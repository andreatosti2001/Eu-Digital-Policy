---
name: legal-site-qa
description: Run this repository's checks and report the result honestly — the four validators, the observability store, and a session baseline to compare against. Use before and after any change, and before any commit.
---

# legal-site-qa

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

This project has no CI and no deploy gate: a push to `main` publishes. The four validators are
the test suite, they are advisory, and they only work if a person actually runs them and
reports what they said.

## When to invoke

Before changing anything, to take the baseline. After changing anything. Before every commit
that touches data, markup, styles or scripts. Whenever a session report needs to state a
check result.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Running the checks, comparing, reporting | Judging what a person would see — `ux-audit` |
| The mechanical result | What is missing from the corpus — `data-completeness` |
| | Whether the repository matches its docs — `repository-audit` |

## The checks

```
node tools/validate.mjs        # data integrity — must be 0 errors
node tools/i18n-audit.mjs      # register vs disk vs live DOM — must be 0 errors, 0 warnings
node tools/design-qa.mjs       # markup and stylesheets — must be 0 errors
node tools/freshness.mjs       # staleness — read the report, it does not fail
node agent/observability/cli.mjs validate   # trace store, when a run exists
```

Zero-dependency Node scripts, run from the repository root. What each one checks is listed in
`docs/CURRENT-ARCHITECTURE.md` §12; do not restate it.

`tools/_footer.mjs`, `_refsweep.mjs` and `_review10.mjs` are **generators and applied one-shot
patches, not checks.** Do not run the latter two.

## Taking and comparing a baseline

```
node .agents/skills/legal-site-qa/scripts/baseline.mjs --save    # at session start
…                                                                # do the work
node .agents/skills/legal-site-qa/scripts/baseline.mjs --check   # exit 1 on any difference
```

The script runs all five checks in one pass and records exit codes, error and warning counts,
the unverified tally, and a digest of the output of the three checks whose text is stable.
It **asserts nothing of its own**: it holds no expected counts, and the recorded project
baseline keeps its single home in `docs/CURRENT-ARCHITECTURE.md` §12. The snapshot is a
session artifact, written to a git-ignored path.

A digest change with unchanged counts is still a finding: the same number of errors can be a
different set of errors.

## What the checks cannot do

State this in any report that could be read as coverage.

- **The validators do not read prose.** A false statement in `index.html` passes every check
  in this repository.
- **Nothing compares `data/brief.json` with the inline `window.__CONTENT__` blob**, and they
  have already drifted.
- **`design-qa.mjs` reads structure, not legibility.** No screen reader has been run against
  this site; verification is programmatic and Chromium-only.
- **`freshness.mjs` reports, it does not fail.** Its silence means nothing is past a *stated*
  interval, not that the data is current.

## Reporting

Give the command, the exit code, and the counts, per check. Compare to the session baseline
and to the five recorded `design-qa` warnings — **a new warning is a finding, not noise.**
Name anything you did not run and why.

**Never state that a check passed if it was not run.** The site's own argument is that a
record should say what it cannot support; a session report is held to the same standard.

## Done when

- All five checks have been run in the current tree and their output recorded.
- `--check` reports no unexplained difference from the session baseline.
- The report names what was not tested.

## Refusal conditions

- Do not report a result you did not obtain, or infer one from a previous run.
- Do not re-run `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- Do not commit with an unexplained validator error, or describe an error as noise.
- Do not silence a check, relax a rule, or exclude a file to make a run pass.
