# Autonomy policy

**Status:** binding. Defines the four autonomy classes, what is prohibited
outright, and the rollback requirement.

**Relationship to `AI-SAFE-BOUNDARIES.md`.** That document (SESSION 00) defines
green / amber / red tiers and eight absolute prohibitions. It remains in force.
These four classes are a **refinement of it, not a replacement**:

| Class | Tier | Difference |
|---|---|---|
| **A** | green | Read-only and `docs/`-only. Narrower than green: A may not add a validator or a derived view — those are B. |
| **B** | green | Green work that a validator can *prove* correct, with a revert obligation if it cannot. |
| **C** | amber | Identical in scope. "Prepare it; a human approves it." |
| **D** | red | Identical in scope, plus: running the two one-shot patch scripts, and pushing to `main`. |

Where the two documents could be read differently, **the stricter reading
governs**. The eight prohibitions in `AI-SAFE-BOUNDARIES.md` §0 are absolute and
are restated in the prohibited-actions list below.

**Default when unsure: the higher class.** An agent that cannot confidently
place a change escalates. Misclassifying downward is the failure this document
exists to prevent.

---

## The four classes

### Class A — fully autonomous

No approval, no PR. Nothing a reader sees changes, and nothing is written to a
canonical file.

- Reading anything in the repository.
- Running any of the four validators; running `git status`, `git diff`,
  `git log`.
- Producing analysis, audits, reports and proposals **as new files under
  `docs/`** or as chat output.
- Serving the site locally (`python3 -m http.server 8000`).
- Searching for a source **without** attaching it.

**Bound:** Class A may not write to `data/`, `i18n/`, `js/`, `app.js`, `css/`,
`*.html`, or `tools/`.

### Class B — autonomous with automated validation

The agent may act without prior approval **only if** a validator can prove the
change correct, all four validators pass afterwards, and the change is fully
reverted if any fails.

- Fixing a dangling reference `validate.mjs` reports, by correcting the
  reference to an existing ID (**not** by creating the missing record).
- Fixing a `design-qa.mjs` error: duplicate id, heading-order jump, broken
  internal link, missing `alt`, a colour literal moved to a token, a page-local
  `<style>` moved to a shared sheet.
- Regenerating the footer / no-JS notice / social meta with
  `node tools/_footer.mjs` **when `design-qa.mjs` reports drift**, and only then.
- Correcting a malformed ID to the namespacing rule (`instrument:provision`).
- Formatting-only changes to `data/*.json` that leave `JSON.parse` output
  identical.

**Bound:** Class B may never change the *meaning* of a record. Adding a missing
`appeal` block is Class C, because choosing its contents is a claim.
**Test: if a human would need to check a source to know whether the change is
right, it is not Class B.**

### Class C — pull request and human approval

The default for substantive work. The agent prepares the change, runs all four
validators, writes a reproducible change description
(`VERIFICATION-POLICY.md` §4), opens a PR, and **stops**.

- Any new or amended value in `data/*.json` — a fact, date, status, amount,
  competence, rule, source, claim, or a `verification_note`.
- Attaching a source to a claim; changing a source's `tier`, `type` or
  `url_status`.
- Clearing `requires_verification`, or any other move from uncertainty toward
  certainty (`SOURCE-POLICY.md` §2).
- Changing a **derivation**: `evidenceGrade`, `pipeline.derive`,
  `authoritiesFor`, `applies.evaluate`, or the tier→grade map.
- Any change to the brief's prose in `index.html`, including the matching
  `superseded` declarations in **every** affected locale.
- Any change to `tools/*.mjs`, including relaxing or tightening a check.
- A new dataset, a new taxonomy term, a new wildcard reference, a new locale.
- Any change to the files in this constitution.

### Class D — explicit human authorization, named and recorded

Irreversible, outward-facing, or foundational. An agent may **propose** these;
it may not execute them on a PR approval alone. Authorization must name the
action and come from the repository author.

- Running `tools/_refsweep.mjs` or `tools/_review10.mjs` (see §3).
- Declaring, changing or removing a licence, or altering the reuse statement.
- Changing the independence disclaimer or the "not legal advice" statement, or
  moving either into JavaScript-rendered chrome.
- Changing `BASE` in `tools/_footer.mjs` (the deployed origin).
- Deleting any record, source, claim or dataset.
- Adding or removing a locale from `i18n/locales.json`.
- Publishing, deploying, or pushing to `main`.
- Any `git push --force`, history rewrite, or bulk delete-and-re-upload.
- Adding a runtime dependency, a build step, a service worker, a third-party
  script, stylesheet, font or analytics of any kind.
- Redesigning the website.

---

## Prohibited automatic actions

Never, under any autonomy class, without explicit human authorization naming the
action:

1. **Inventing a legal fact** — an article number, date, amount, status, case,
   publication or URL that has not been read in the source.
2. **Turning uncertainty into certainty** — clearing `requires_verification`,
   removing `reference_gap`, filling a `null` status, narrowing a
   `date_precision`, or setting `last_verified` on a record not actually read.
3. **Bulk-stamping `last_verified`** across records, on any pretext.
4. **Attaching a loosely related source** to close a reference gap.
5. **Re-typing a claim** (`interpretation` → `fact`) or **re-tiering a source**
   to change a derived grade.
6. **Storing a derived value** — a `grade` field on a claim, a `stage` field on
   an enforcement record, a date or supervisor on an instrument.
7. **Collapsing unknown into zero**, into not-reached, or into an aggregate.
8. **Emitting `outcome:undetermined` from a stored rule**, or converting an
   uncovered combination into "probably not".
9. **Running `_refsweep.mjs` or `_review10.mjs`** (§3).
10. **Deleting or shortening the unverified report** by any means other than
    genuine verification.
11. **Editing English prose carrying a `data-i18n` key** without declaring the
    key `superseded` in every locale holding a translation, in the same change.
12. **Adding a third-party request** — script, stylesheet, font, image or
    analytics. The site makes none, and `design-qa.mjs` errors on one.
13. **Adding a second implementation of a derivation**, or a second copy of a
    fact without both a generator and a drift check
    (`DATA-GOVERNANCE.md` §5).
14. **Adding a build step, generator, dependency or service worker.**
15. **Pushing to `main`, force-pushing, or rewriting history.**
16. **Weakening a validator** — deleting a check, widening an exemption, or
    downgrading an error to a warning — to make a change pass.
17. **Reporting "verified" or "validated" on the strength of a passing
    validator** (`VERIFICATION-POLICY.md` §3).
18. **Declaring a licence** or implying one exists.
19. **Redesigning the website**, or restructuring pages, navigation or the
    visual system.

---

## §3 · The two one-shot patch scripts

`tools/_refsweep.mjs` and `tools/_review10.mjs` are **historical records kept in
executable form**. They are Class D — running either requires explicit
authorization naming the script.

Why (audit F-03):

- `_refsweep.mjs` hardcodes `SWEEP = '2026-08-28'` and `Object.assign`s fixed
  values over live records in `data/sources.json` and `data/claims.json`. It
  unconditionally overwrites `last_verified` and `verification_note`, and
  **deletes** `reference_gap` / `gap_note` where its patch entry has no `gap`.
  Re-running it after any later verification work silently reverts that work and
  re-dates it to August 2026.
- `_review10.mjs` does unguarded `split/join` replacement across the whole of
  `index.html` — including the inlined `__CONTENT__` search index — and appends
  to `superseded` arrays in `i18n/locales.json`. A `NOT FOUND` is logged, not
  raised.

Neither has a dry-run, a state check, a backup, or a confirmation prompt.

An agent that needs their *effects* must reproduce them as a reviewed Class C
change, not by executing the script.

---

## §4 · Rollback

**Every automated change must have a rollback path, identified before the change
is made.** A change whose rollback path cannot be stated is not made.

The path must name: what is reverted, by what command, and how the revert is
confirmed (normally: all four validators return to their pre-change output).

**The constraint that makes this hard here.** The repository's entire history is
GitHub web-UI bulk uploads and deletions — 47 commits, every subject is `Add
files via upload` or `Delete <path>`, all within three days (audit F-06). `git
blame` on any value returns `Add files via upload`. There is therefore **no
per-change history to revert to**.

Until that is fixed, the rollback path for any agent change is the agent's own
branch and its own commits. Which means:

- Work only on the designated feature branch, never `main`.
- One logical change per commit, with a message stating **what changed and
  why** — the first real provenance this repository will have.
- Never bulk-delete and re-upload a directory.
- Record the pre-change validator output in the change description, so "reverted
  cleanly" is checkable.
