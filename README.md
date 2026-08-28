# EU Digital Policy

An interactive reading of the EU digital rulebook, with the evidence, the
regulatory status, the institutional competences and the enforcement record
held as data rather than as prose.

No build step. No dependencies. No runtime. No third-party requests: the
typefaces are self-hosted in `fonts/`, and `design-qa.mjs` fails the build if
a page adds an external stylesheet or script. Static HTML, CSS, vanilla ES
modules and JSON, deployable to GitHub Pages or any static host as-is.

```
python3 -m http.server 8000     # then open http://localhost:8000
```

It must be served over HTTP, not opened with `file://` — the ES modules and
the `fetch` calls that load `data/*.json` are both blocked by the file
protocol.

---

## How this is actually built

**There is no generator.** An earlier version of this README told you to run
`build.py`, `assemble.py` and to edit `content_data.py`. Those files do not
exist in this repository and have not for several phases; the instruction was
left behind when the project stopped being a rendering of a PDF and became a
data-driven application. Following it would have wasted your time, and for a
document that asks to be audited that is a defect rather than an untidiness.

The prose of the brief lives in `index.html` and is edited there directly.
Everything else — every number, date, status, competence, source and
enforcement record on the site — is read at runtime from `data/*.json`. The
HTML contains no copy of any of it.

### To change the prose

Edit `index.html`. Each translatable element carries a `data-i18n` key; if you
add or remove one, see **Localisation** below, because the key set is checked.

### To change a fact

Edit the relevant file in `data/`, then run the validators. Nothing else needs
to be touched: the pages render from the data.

```
node tools/validate.mjs        # integrity: IDs, references, status discipline
node tools/i18n-audit.mjs      # the locale register against the live DOM
node tools/freshness.mjs       # how stale the time-sensitive datasets are
node tools/design-qa.mjs       # the markup and the stylesheets
```

All four are zero-dependency Node scripts and must be run from this
directory. `design-qa.mjs` exits non-zero on an error, so it can gate a
commit.

### To change the interface

Read `css/tokens.css` first. It holds the type scale, the spacing scale, the
layout widths, the surfaces and the semantic status system, and it is loaded
before every other stylesheet. A component that needs a size, a gap or a
status colour takes it from there rather than inventing one; `design-qa.mjs`
fails the build on a colour literal used as a property value, on a stylesheet
loaded before the tokens, and on a `<style>` block inside a page.

Two rules in that file exist because both have already shipped as bugs:

- **A theme-dependent token is declared on `body`, never on `:root`.** The day
  palette is an attribute on `<body>`, so a token at `:root` resolves against
  the night values in day mode — invisible in whichever theme you happen to be
  working in. `design-qa.mjs` checks this.
- **Status is never carried by hue alone.** Every `.badge` state has a glyph
  and a border style as well as a colour, so it survives greyscale, a printer
  and a colour deficiency.

---

## The pages

| Page | What it is |
|---|---|
| `index.html` | The brief. Fourteen parts, the evidence apparatus, the reading tools. |
| `instruments.html` | The Regulatory DNA comparison — any set of instruments, any dimensions. |
| `instrument.html?id=…` | One instrument end to end: status, dates, applicability, provisions, enforcement, evidence, related entities. The reference implementation for a detail page. |
| `institutions.html` | Who does what, by body and by competence. |
| `enforcement.html` | The enforcement observatory, with the derived pipeline per record. |
| `applies.html` | The applicability engine. |
| `bibliography.html` | Every source, tiered, with the live grade tally. |

The chrome — navigation, breadcrumbs, theme, search — is rendered by
`js/shell.js` on every page from one nav model. It is not written into the
markup, and a page should not add its own header: five hand-copied headers is
how the same destination came to be called two different things, and how a
skip link came to point at an id that existed on one page out of six.

`js/palette.js` is the one search surface. On the brief it also renders prose
results, which `app.js` supplies as a provider rather than by keeping a second
palette.

---

## The data model

| File | Holds |
|---|---|
| `taxonomy.json` | Every controlled vocabulary. 243 terms; nothing elsewhere invents a label. |
| `instruments.json` | Instruments, their nested provisions, relationships, and the Regulatory DNA slots. Instruments carry no dates — only references to timeline events. |
| `institutions.json` | Bodies and their competence edges, each with exclusivity, scope and legal basis. |
| `timeline.json` | Dated events, each with a mandatory event type and date precision. |
| `enforcement.json` | Enforcement records on three orthogonal axes (action, payment, remedy) plus an appeal block. |
| `claims.json` | Every assertion the brief makes, with its sources and what each source does for it. |
| `sources.json` | The bibliography, tiered. |
| `applicability.json` | The rules behind "What applies to me?". |
| `glossary.json` | Terms, with edges to instruments, provisions, institutions and enforcement. |
| `brief.json` | The parts, and the reading order between them. |

Two principles the data enforces, and the validator checks:

- **One home per fact.** If a date appears in two files, one of them is wrong.
  Instruments reference timeline events; they do not restate dates.
- **Derivation over storage.** Competent authority, key dates and the
  enforcement pipeline stages are all computed from the records at render
  time, so two copies cannot disagree.

---

## Reading the evidence

Every claim is graded, and the grade is derived on load from the claim's type
and its sources — never stored, so it cannot drift from what it describes:

- **Primary law** — carried by the legal text or by a court.
- **Official source** — carried by a regulator or an EU institution.
- **Secondary only** — carried by research, press or advocacy alone.
- **Interpretation** — the author's reading or argument. Sources can support
  the premises; they cannot settle the conclusion.
- **Unresolved** — no directly supporting external source has been located.

The live tally is on the bibliography page. It is not flattering, and it is
not meant to be.

---

## Localisation

`i18n/locales.json` is the single source of truth. The language menu is built
from it at runtime, so a language cannot be offered unless the register
declares a file for it.

Each locale has two files: `i18n/<code>.json` for the positional strings keyed
to `data-i18n` attributes, and `i18n/<code>/data.json` for the entity-keyed
overlay, whose keys are canonical entity IDs so they survive the DOM being
rebuilt.

Any key a locale lacks must be declared in the register as either
`superseded` (a translation withdrawn because the English it rendered no
longer describes the site) or `pending_translation` (new, not yet translated).
Undeclared gaps fail `tools/i18n-audit.mjs`. Missing strings fall back to
English and are marked **EN** in the interface.

**There is no offline support.** No service worker, nothing precached. The
first switch to a language fetches its file.

---

## Testing

There is no test runner in this repository. The suites used during
development drive a headless Chromium through Playwright and live outside it;
what ships here are the four validators above, which are the checks a
contributor needs and can run without installing anything.

`design-qa.mjs` is the one that catches interface regressions statically —
heading order, duplicate ids, skip-link targets, internal links that point at
files which do not exist, missing `alt`, page-local styles, third-party
resources, and the two CSS mistakes described under **To change the
interface**. It does not replace opening the pages, but it catches the class
of defect that survives a visual review because nothing about it looks
wrong.

---

## Known limitations

Stated plainly, because the site's own argument is that a record should say
what it cannot support:

1. **A substantial share of claims are not externally corroborated.** The
   bibliography states the current count on every load.
2. **Verification dates are a compilation date.** The field is per-record;
   the practice is not yet. `tools/freshness.mjs` says so explicitly.
3. **Twelve sources carry no URL**, so the claims resting on them are not
   reproducible by a reader. They are listed by `tools/freshness.mjs`.
4. **Enforcement figures are indicative of magnitude, not audited**, and the
   trackers behind the cumulative GDPR totals disagree with each other.
5. **Translations lag the English.** Declared in the register, marked in the
   interface.
6. This is not legal advice, and the applicability engine asks three questions
   where a lawyer would ask fifty.
7. **No screen reader has been run against this.** Dialog semantics, focus
   management, landmarks and headings were verified programmatically, which
   is not the same thing. Chromium only; no real-device testing.
8. **The interface is English.** The entity overlay translates instrument
   names, statuses and event types on every page, so a reader who chose
   Italian on the brief sees those labels in Italian elsewhere too — but the
   chrome and the tool pages' own text are not translated, and the chrome says
   so rather than pretending otherwise.
