---
name: repository-audit
description: Reconnaissance of the Eu-Digital-Policy repository — establish what is actually implemented before planning or changing anything. Use when scoping a session, investigating a discrepancy, or verifying a handover.
---

# repository-audit

## Purpose

Establish what is *actually* in the repository, as opposed to what documentation, a previous
session, or a plausible assumption says is in it. This project has already had one README
that instructed contributors to run three build scripts which did not exist.

## When to invoke

Scoping a new session; verifying a handover; investigating a suspected discrepancy; before
any change whose blast radius is unclear.

## Procedure

**1. Ground truth**
```
git status && git log --oneline -20 && git branch -a
find . -path ./.git -prune -o -type f -print | sort
```

**2. Baseline the four validators** — record exact output, including warning counts.
```
node tools/validate.mjs ; node tools/i18n-audit.mjs
node tools/design-qa.mjs ; node tools/freshness.mjs
```

**3. Trace, do not assume.** For any claim about how the site works, find the call site.
- Which datasets a page loads: grep the `loadAll` / `load` call sites, do not infer from
  the page's subject matter.
- Whether a dataset is consumed at all: grep for the literal name passed to `load()`.
  *(This is how SESSION 00 established that `data/brief.json` is never fetched.)*
- Whether a fact is stored or derived: check `js/format.js`, `js/pipeline.js`, `js/dna.js`.

**4. Look for second homes.** The architecture's core rule is one home per fact, so the
highest-value audit question is always: *is this fact written down anywhere else?* Check
inline `<script>` blobs in HTML, not just `data/`.

**5. Verify against the deployed site** where the environment permits. If outbound access is
blocked, **say so explicitly** rather than describing the live site from the repository.

## Output

An audit reports findings; it does not fix them. For each finding give:
- what was expected, what is actually there, and the file:line evidence;
- whether it is a defect, a drift, or a deliberate exception;
- the blast radius of fixing it — and leave the fix to a session scoped for it.

## Refusal conditions

- Do not state that a check passed unless it was actually run.
- Do not describe the deployed site if it could not be reached.
- Do not fix production code during an audit. Record and hand off.
