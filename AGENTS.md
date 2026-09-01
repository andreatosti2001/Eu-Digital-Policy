# AGENTS.md

Operating instructions for any AI agent working in this repository.
**This is the canonical agent entry point.** `CLAUDE.md` points here; it holds no rules of
its own, because this project's first principle is one home per fact.

---

## What this is

**The European Legal Framework for the Digital World** — an analytical brief on the EU
digital acquis, published as a static site at
https://andreatosti2001.github.io/Eu-Digital-Policy/

It is a **production website with real readers who may act on what it says about EU law.**
It is not a prototype and not a scaffold.

The prose is the argument; everything the argument rests on is data. Every consequential
statement exists as a record in `data/claims.json`, typed, sourced, and graded by what those
sources can actually carry — with the grade *derived at render time* so it cannot drift from
the evidence it describes.

## Read these first, in this order

| Document | What it gives you |
|---|---|
| `docs/PROJECT-CONTEXT.md` | What the project is; the seven governing principles |
| `docs/CURRENT-ARCHITECTURE.md` | Rendering model, module topology, dependency map, tooling baseline |
| `docs/AI-SAFE-BOUNDARIES.md` | Green / amber / red tiers; the absolute prohibitions |
| `docs/HANDOVER.md` | Previous session's state and the current objective |
| `README.md` | The author's own account, including eight stated limitations |

Skills live in `.agents/skills/` — sixteen of them, listed with their scope and their
intended agent role in **`docs/SKILL-MAP.md`**. Invoke `project-context` at the start of every
session, then load the skills the task actually needs; each one names the sibling that owns
what it does not.

**The repository is the source of truth.** If `docs/HANDOVER.md` conflicts with the code,
**stop and report the discrepancy** rather than reconciling it silently.

## The rules that matter most

1. **Never fabricate a legal fact.** No citation, URL, date, CELEX number, article number,
   fine, publisher, court or regulatory status from model knowledge. If it was not read from
   a retrieved source, it does not go in the data. A fabricated fact here is not a code
   defect — it is a harm to a reader.
2. **Never close an evidence gap with a plausible substitute.** An asterisk means the
   reference is missing, not that the statement is doubted. A loose substitute is worse than
   an admitted gap because it looks resolved.
3. **One home per fact.** Instruments carry no dates (they reference timeline event IDs) and
   no supervisor field (competence is an edge in `institutions.json`). If you are about to
   write a fact that already exists elsewhere, stop.
4. **Derivation over storage.** Evidence grades, the eight-stage enforcement pipeline,
   competent authority and key dates are computed at render time. Never store one.
5. **`null` ≠ `unknown`**, and **unknown is never zero.** Not researched vs. researched and
   not publicly determinable. Never render them alike, never sum unknown into a total.
6. **No matching rule ≠ no obligation.** Where no applicability rule fires, the answer is
   NOT DETERMINED — never "probably not".
7. **Never soften a stated limitation.** The 106 unverified records and the README's eight
   limitations are the project's honesty. They change by doing the verification work.
8. **Never declare a licence**, and never alter the non-affiliation or no-legal-advice text.

Full detail, including the green/amber/red tiers, is in `docs/AI-SAFE-BOUNDARIES.md`.

## Architecture — do not rebuild it

Static HTML, vanilla ES modules, JSON. **No build step, no dependencies, no framework, no
bundler, no service worker, no third-party requests.** All of this is deliberate:
`tools/design-qa.mjs` actively fails the build on an external stylesheet or script.

- `js/data.js` is the **only** module that fetches a dataset. No renderer calls `fetch()`.
- `js/shell.js` renders the chrome on every page from one nav model. A page must not add its
  own header.
- `data/taxonomy.json` is the enum authority for every other dataset. **IDs are never
  renamed.**
- Read a dataset's `$description` and `$note` before editing it — the non-obvious invariant
  lives in the `$note`.

`docs/CURRENT-ARCHITECTURE.md` §9 has the full dependency map, and its closing section lists
exactly what must not be rebuilt and why.

## Running it

```
python3 -m http.server 8000     # then http://localhost:8000
```

Must be served over HTTP. `file://` blocks both ES modules and the `fetch` calls that load
`data/*.json`.

## Validators — this project's test suite

Run all four before and after any change to data, markup, styles or scripts:

```
node tools/validate.mjs        # data integrity — must be 0 errors
node tools/i18n-audit.mjs      # locale register vs live DOM — must be 0 errors, 0 warnings
node tools/design-qa.mjs       # markup and stylesheets — must be 0 errors
node tools/freshness.mjs       # how stale the datasets are — read the report
```

Zero-dependency Node scripts; run from the repository root.

**Baseline** (`docs/CURRENT-ARCHITECTURE.md` §12 records this in full): 0 errors across all
four, 106 unverified records, and 5 pre-existing `design-qa` warnings listed by file and
line. **A new warning is a finding, not noise.**

`tools/_footer.mjs`, `_refsweep.mjs` and `_review10.mjs` are generators and applied one-shot
patches, not checks. **Do not re-run** the latter two.

## Known hazards

- **The `__CONTENT__` bypass.** `index.html:361` inlines a ~59.8 KB blob duplicating
  `data/brief.json`. Nothing loads `brief.json` at runtime, no validator compares the two,
  and `meta.standfirst` has **already drifted**. Editing brief prose or part metadata means
  checking both homes. See `docs/CURRENT-ARCHITECTURE.md` §8.
- **Superseded translations.** Correcting an English string without declaring its key
  `superseded` in `i18n/locales.json` leaves the it/fr/es editions asserting the thing you
  just corrected. This has already happened once.
- **No deploy gate.** A push to `main` publishes to the live site. There is no CI. Run the
  validators by hand.
- **The validators do not read prose.** A false statement in `index.html` passes every check
  in this repository.

## Git

Develop on the session's designated branch; **never push to `main` without explicit
permission.** Read the full `git diff` before committing — a one-character `null` → `"unknown"`
edit changes what a record asserts. Do not open a pull request unless asked. Do not include a
model identifier in any commit message or pushed artifact. See
`.agents/skills/git-workflow/SKILL.md`.

## When to stop and ask

A fact cannot be verified against a retrievable source · two sources disagree and the schema
cannot hold it · the change would store something the architecture derives · the change would
alter what a claim is said to prove · the handover conflicts with the code.

**Report honestly.** Never state a validator passed if it was not run. The site's own
argument is that a record should say what it cannot support; sessions are held to the same
standard.
