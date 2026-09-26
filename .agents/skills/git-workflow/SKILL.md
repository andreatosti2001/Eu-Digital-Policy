---
name: git-workflow
description: Branch, commit and push discipline for Eu-Digital-Policy. Use before committing or pushing any work in this repository.
---

# git-workflow

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Scope boundary

Branch, diff, commit and push discipline. Whether a change may be made at all is
`autonomy-governance`; whether the checks passed is `legal-site-qa`.

## Purpose

A push to `main` publishes to the public site. There is no CI, no deploy gate and no review
step between a commit and a reader. The validators are advisory, so the discipline has to be.

## The rules

**Branch.** Develop on the branch the session brief designates. Create it locally if absent,
and confirm it with `git branch --show-current` before the first commit — the branch is a
session fact, so it is named in the brief and in `docs/HANDOVER.md`, and never a second time
in this file. **Never push to `main` or any other branch without explicit permission.**

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

**Re-fetch immediately before the final write, not only at session start.** `origin/main`
can move while a session is running — another session merging is not hypothetical, it has
happened (`docs/AUDIT-2026-09-03.md`'s opening correction is the record). The fetch-before-
concluding rule in `AGENTS.md` covers what a session *reads*; this covers what it *writes*.
Specifically, right before writing `docs/HANDOVER.md` for the last time and before any merge:

```
git fetch --all
git log origin/main..HEAD --oneline     # what this branch adds
git log HEAD..origin/main --oneline     # what this branch is missing
git diff origin/main -- docs/HANDOVER.md
```

If `origin/main` has moved, **merge it into the session branch before writing**
(`git reset --hard` is destructive and typically blocked — use `git merge origin/main`, or
rebase if the branch has no reviewer yet). Resolve a `docs/HANDOVER.md` conflict by taking
the incoming version whole and layering this session's changes on top as an edit, never by
overwriting the whole file from the session's original, now-stale base — `HANDOVER.md` is
rewritten narrative, not an append-only log, so a stale full-file rewrite silently deletes
whatever a concurrent session recorded. If a concurrent session has already claimed the
session number this session intended to use, do not reuse it — retitle this session's own
record (a dated `docs/AUDIT-*.md`-style document, or the next free number) rather than
colliding.

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
- Do not write the session's final `docs/HANDOVER.md` or merge to `main` without re-fetching
  and diffing against the current `origin/main` first — a base read at session start is not
  current by session end.
- Do not overwrite `docs/HANDOVER.md` wholesale when `origin/main` has moved since the
  branch point. Merge forward and take the incoming version as the base instead.
