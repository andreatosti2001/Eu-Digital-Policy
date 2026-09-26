# Verification policy

**Status:** binding. Governs what counts as verification, what the validators
do and do not prove, and what reproducibility means here.

---

## 1. What verification is

Verification is: **a named human or agent opened the primary or official source
on a stated date and confirmed it says what the record says it says.**

It is not: a validator exiting 0. It is not a model's confidence. It is not
three secondary sources agreeing. It is not a URL resolving.

Verification produces four things, together, or it has not happened:

1. the value;
2. the source that carries it, at its true tier;
3. `last_verified` — the date it was actually read;
4. a `verification_note` saying what was checked and what remains open.

## 2. The validators, and exactly what each one proves

Four zero-dependency scripts, run from the repository root:

```
node tools/validate.mjs      # data integrity
node tools/i18n-audit.mjs    # locale register against the live DOM
node tools/freshness.mjs     # how stale the time-sensitive datasets are
node tools/design-qa.mjs     # markup and stylesheets
```

| Script | Proves | Does **not** prove |
|---|---|---|
| `validate.mjs` | IDs unique; references resolve; no stored dates on instruments; status-model rules hold; every claim has ≥1 source | that any value is **true**; that a source says what the record claims; anything about `index.html` or `__CONTENT__` |
| `i18n-audit.mjs` | key sets match the register; absent keys are declared; entity IDs align across locales | that any translation is **accurate**; that a `superseded` declaration is correct; that a *present* key is not stale |
| `freshness.mjs` | how old the stated dates are, against asserted intervals | that any URL is reachable (**it performs no network I/O**); that a record is correct |
| `design-qa.mjs` | heading order, duplicate ids, skip-link targets, dead internal links, missing `alt`, token discipline, footer/notice drift, no third-party resources | that a page **looks** right, or is usable with a screen reader |

**Exit codes.** `validate.mjs` and `design-qa.mjs` exit 1 on an error. Warnings
and the unverified-data report do **not** fail: *unverified data is an honest
state, not a defect.* `freshness.mjs` exits 0 unless something is past its
stated interval.

## 3. Where the validators are weak — do not treat a green run as proof

Established by the audit of 1 September 2026, with evidence in
`AUDIT-2026-09-01.md`:

- **Nothing runs automatically.** No CI, no `package.json`, no git hooks. Every
  gate the README describes is opt-in (F-02). A green run is a green run
  *somebody chose to do*.
- **`validate.mjs` never sees `index.html`.** The ~60 KB `__CONTENT__` object,
  which duplicates part titles and instrument names, is entirely outside data
  validation (F-04).
- **A wildcard reference can never dangle.** Bare `"*"` and `foo*` refs always
  resolve; that path carries no referential guarantee (F-11).
- **One competence check is dead code** — `checkOne(…, 'institution', null)`
  passes a literal `null` and can never fire (F-11).
- **`i18n-audit.mjs` cannot see a stale *present* key.** It checks only that
  *absent* keys are declared (F-05).
- **`freshness.mjs` measures no reachability** despite the heading (F-12).
- **`design-qa.mjs` harvests CSS token declarations out of JavaScript by
  regex**, so a `--foo:` inside any JS string or comment suppresses a real error
  (F-10).

**Rule: a passing validator is a necessary condition, never a sufficient one.**
An agent may not report "validated" or "verified" on the strength of exit code 0.
It may report "the four validators pass", which is a different and smaller
claim.

## 3a. Verify your base before you verify anything else

```
git fetch --all && git branch -a
```

A feature branch shows no signal that its base is stale: no CI, no branch
protection, and `git log` shows only its own ancestry. The first version of
`AUDIT-2026-09-01.md` opened with a P0 finding that four existing documents did
not exist, because `ls docs` was run on a tree cut before they landed. An
absence observed on an unfetched branch is not a fact about the repository.

Then compare the four validators against the recorded baseline in
`docs/CURRENT-ARCHITECTURE.md` §12 — 0 errors, five named `design-qa` warnings,
106 unverified records — so a new warning is distinguishable from an inherited
one.

## 4. Reproducibility

**Every substantive AI change must be reproducible**: another agent, given the
change description, must be able to arrive at the same result.

A change description must record:

1. **Inputs** — every source consulted, by ID and URL, and what each said.
2. **Derivation** — which rule or function produces the visible output, by file
   and function name.
3. **Commands run**, verbatim, with their outcomes.
4. **As-of date** — `freshness.mjs` defaults its as-of to *today* from
   `process.argv[2]`; a report without its date is not reproducible (F-15).
5. **What was considered and rejected**, and why. This is not optional. The
   repository has already lost this once: `_review10.mjs` defers to a "phase
   record" that does not exist (F-07), so the reasoning for what was
   deliberately *not* changed is unrecoverable.

**Clock dependence.** `js/pipeline.js` and `js/format.js` compute `isPast`
against `new Date().toISOString()` (UTC). The `stage:law` pipeline state, the
compliance calendar and the status strips therefore change with when and where
the page is opened. Any report about derived output must state the date it was
produced.

## 5. Verification dates are currently compilation dates

Every dataset carries one `$last_verified` (`2026-08-27` or `2026-08-28`), and
per-record `last_verified` values were written **in bulk** by the sweep scripts
to that same constant. The field is per-record; the practice is not
(README limitation 2; audit F-13).

Consequences:

- An agent must not read `last_verified` as evidence that *that record* was
  individually checked.
- An agent setting `last_verified` on a record it actually verified **must** say
  so in the `verification_note`, so the individually-checked records become
  distinguishable from the batch-stamped ones over time.
- Bulk-stamping `last_verified` across records is **prohibited** (see
  `AUTONOMY-POLICY.md` §4).

## 6. The unverified report is a feature

`validate.mjs` prints every record that is unverified, requires verification,
lacks a URL, or rests only on the brief. It does not fail the run.

That list is the project's honest statement of what it cannot support. **Making
it shorter is not a goal in itself.** It shortens when a source is genuinely
found and read. An agent that shortens it any other way — by attaching a
plausible substitute, by clearing a flag, by deleting a record — has damaged the
thing the project exists to do.

## 7. Before proposing any change

```
node tools/validate.mjs && node tools/i18n-audit.mjs && \
node tools/freshness.mjs && node tools/design-qa.mjs
```

Run all four. Report each outcome, including warnings. If a warning count
changed, say which warning and why. If a validator was not run, say so
explicitly — silence is not a pass.
