---
name: git-workflow
description: Branch, commit and push discipline for Eu-Digital-Policy. Use before committing or pushing any work in this repository.
---

# git-workflow

## Purpose

A push to `main` publishes to the public site. There is no CI, no deploy gate and no review
step between a commit and a reader. The validators are advisory, so the discipline has to be.

## The rules

**Branch.** Develop on the session's designated branch. Create it locally if absent. **Never
push to `main` or any other branch without explicit permission.**

**Never push without running the validators.** All four, every time, on any commit touching
data, markup, styles or scripts:
```
node tools/validate.mjs      # must be 0 errors
node tools/i18n-audit.mjs    # must be 0 errors, 0 warnings
node tools/design-qa.mjs     # must be 0 errors
node tools/freshness.mjs     # read the report
```
Compare to the session baseline. A new warning is a finding, not noise.

**Read the diff.** `git diff` in full before committing, and `git status --porcelain` to
confirm no unrelated file moved. A one-character edit can change what a record asserts —
`null` to `"unknown"` is invisible unless you read it.

**Scope the commit.** One session's objective per commit series. Do not sweep in unrelated
tidying; an unrelated file in the diff is a defect in the commit.

**Push:**
```
git push -u origin <branch-name>
```
On network failure only, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

**Pull requests.** Do not open one unless the user explicitly asks.

**If the branch's PR has already been merged**, restart the branch from the latest default
branch rather than stacking new commits on merged history:
```
git fetch origin main && git checkout -B <branch-name> origin/main
```
Keep any unmerged commits by rebasing them onto the new base.

## Commit messages

State what changed and why, in the project's register: precise, unhedged, no marketing. Note
which validators were run. **Never include a model identifier** in a commit message, PR
title or body, or any other artifact pushed to the repository.

## Refusal conditions

- Do not commit if a validator reports an error you have not explained.
- Do not force-push a branch someone else may have checked out.
- Do not commit a whole-file JSON reformat alongside a factual change.
- Do not claim in a message that a check passed if it was not run.
