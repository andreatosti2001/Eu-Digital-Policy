# EU Digital Policy

An interactive reading of the EU digital rulebook — GDPR, DSA, DMA, AI Act, Data Act and the
cyber layer — in which **the argument is prose and everything the argument rests on is data**:
every legal proposition, figure, date, status, competence and enforcement record is a record
with its sources, its locator and a grade derived from what those sources can actually carry.

**Live site:** https://andreatosti2001.github.io/Eu-Digital-Policy/

**One page per regulation**, each generated from the same records: the
[GDPR](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/gdpr/),
[Digital Services Act](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/dsa/),
[Digital Markets Act](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/dma/),
[AI Act](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/ai-act/),
[Data Act](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/data-act/),
[NIS2](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/nis2/),
[DORA](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/dora/),
[Cyber Resilience Act](https://andreatosti2001.github.io/Eu-Digital-Policy/instruments/cra/)
and four more — what each does, where it stands, its dates, provisions, competent authorities,
enforcement, its interactions with the others, and the graded evidence behind every statement.

## What this project demonstrates

- **Regulatory data modelling.** Instruments, provisions, dated events, institutions and their
  competences, enforcement records and applicability rules as ten linked JSON datasets under one
  controlled vocabulary (`data/taxonomy.json`). A regulation's status is not one field: each
  provision's application date is derived from the timeline, with adoption, Official Journal
  publication, entry into force, staggered application, transitional deadlines and the
  amending act that inserted a rule (`js/regulatory-model.js`).
- **Claim-level provenance.** Every substantive passage of the brief is either linked to the
  claims or records it states, or classified as the author's synthesis, critique,
  recommendation, signpost or method note — 100% of them, checked on every push. Each claim
  carries its sources, what each source does for it (states it / part of it / context only) and
  a locator precise enough to reach the evidence without reading the whole document.
- **Evidence classification that keeps kinds of statement apart.** Seven claim types — law,
  fact, *derived* (the site's own arithmetic, recorded and re-run), *attributed* (what a named
  actor says, reported not adopted), interpretation, critique, forecast — and a separate,
  derived evidence status (direct, partial, derived, context-only, unverified, disputed). "Not
  yet verified" is never confused with "not the kind of statement a source could settle".
- **Enforcement intelligence.** Fines are not totals: each record has independent action,
  payment, remedy and appeal axes, an eight-stage pipeline and a procedural posture with
  finality (`final`, `not final`, `unknown` — and unknown is never counted as either), all
  derived at render time.
- **Automated QA with teeth.** Zero-dependency validators, an evidence audit, a browser
  regression suite that drives a real Chromium over the DevTools protocol (keyboard, dialogs,
  reflow at 320px, WCAG contrast in both themes, reduced motion, localisation), and over
  1,200 tests on Node's built-in test runner — all in CI.
- **Freshness monitoring.** Per-record review intervals by risk (a pending appeal is re-read
  sooner than a 2018 application date), reported as fresh / aging / review due / stale.
- **Governed source discovery.** A scheduled Source Scout proposes candidate sources through
  pull requests; nothing an agent finds reaches the site without a person (`docs/SOURCE-SCOUT.md`).
- **A security boundary that does not rely on obscurity.** A Content-Security-Policy with no
  `'unsafe-inline'` scripts or styles, no inline handlers, no third-party requests, and a deploy artifact
  built from an allowlist so private material cannot be published by accident
  (`docs/DEPLOYMENT.md`).

What it does **not** demonstrate is stated too: see **Known limitations** at the end.

## For a policy researcher

- **The source hierarchy.** Tier 1 is the legal text and the courts; tier 2 regulators and EU
  institutions; tier 3 research; tier 4 press and advocacy. A privately published reproduction
  of a legal text is marked as such (`reproduces`) and never counts as the text. Legal texts are
  read from the Official Journal via the Publications Office (`docs/SOURCE-POLICY.md`).
- **The method.** Composite statements are split into atomic claims, each with its own source;
  a figure the site computes (the Irish DPC's share of GDPR fine value, 4.04 / 7.1) is a
  *derived* claim whose inputs, formula and rounding are shown; where two sources disagree the
  claim says so. `docs/EVIDENCE-MODEL.md` is the full account.
- **The honesty rules.** An asterisk means a reference is missing, not that the statement is
  doubted; a gap is never closed with a plausible substitute; absence of an applicability rule
  is "not determined", never "probably not".

## For an engineer

Static HTML, vanilla ES modules and JSON — no build step, no package.json, no framework, no
runtime dependency, no third-party request. `js/data.js` is the only module that fetches;
derived facts (grades, evidence status, pipeline stages, competent authority, key dates,
provision application) are computed in pure modules shared by the pages and the validators,
so the report and the page cannot disagree. `docs/CURRENT-ARCHITECTURE.md` is the map;
`AGENTS.md` is the entry point for AI agents working here; `docs/DEPLOYMENT.md` covers CI,
the deploy gate and security.

No third-party requests: the typefaces are self-hosted in `fonts/`, and `design-qa.mjs` fails
the build on a reference to any origin but this one, anywhere the browser would fetch from —
a stylesheet or script in a page, an `@import` or an `@font-face src` in the CSS, a `fetch`,
`import()`, worker or beacon in a module (`tools/thirdparty.mjs`, proved by
`tools/selftest.mjs`).

```
python3 -m http.server 8000     # then open http://localhost:8000
```

It must be served over HTTP, not opened with `file://` — the ES modules and
the `fetch` calls that load `data/*.json` are both blocked by the file
protocol.

---

## How this is actually built

**There is no build step.** An earlier version of this README told you to run
`build.py`, `assemble.py` and to edit `content_data.py`. Those files do not
exist in this repository and have not for several phases; the instruction was
left behind when the project stopped being a rendering of a PDF and became a
data-driven application. Following it would have wasted your time, and for a
document that asks to be audited that is a defect rather than an untidiness.

The prose of the brief lives in `index.html` and is edited there directly.
Everything else — every number, date, status, competence, source and
enforcement record on the site — is read at runtime from `data/*.json`.

**One exception, and it is checked.** Since 27 September 2026 each substantive
instrument also has a page of its own at `instruments/<id>/`, so that a search
engine — or anyone reading the HTML without running scripts — finds the
substance rather than a loading message. Those pages are written by
`tools/_footer.mjs`, which calls the same renderer the browser runs
(`js/instrument-view.js`) and commits the result. They are a *projection* of the
data, not a second home for it: CI regenerates them on every push and fails if
the committed file differs, so a data change that was not regenerated cannot
ship. After changing `data/`, run `node tools/_footer.mjs`.

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
node tools/design-qa.mjs       # the markup, the stylesheets and the CSP
node tools/evidence-audit.mjs  # claims, evidence, prose coverage, contradictions
node tools/seo-audit.mjs       # canonical, sitemap, titles, structured data, crawl graph
```

All six are zero-dependency Node scripts and must be run from this
directory. Each exits non-zero on an error, so each can gate a commit.

Two further scripts in `tools/` are generators rather than checks, and are
run when the thing they own changes rather than on every commit:

```
node tools/_footer.mjs         # rewrites the legal footer, the no-JS
                               # notice, the titles and social metadata, the
                               # JSON-LD, the Content-Security-Policy, the
                               # site index and the sitemap in every page, and
                               # generates the instrument pages — from the
                               # route model in tools/seo.mjs and the data
node tools/og-image.mjs        # renders the social preview cards (img/og/)
                               # in a local Chromium
node tools/_refsweep.mjs       # the reference sweep of 28 Aug 2026,
                               # kept so the edits are auditable
```

`_footer.mjs` holds the deployed origin in a single `BASE` constant. If the
site moves, change that line, re-run it, and `design-qa.mjs` and
`seo-audit.mjs` will confirm every canonical URL agrees. `node tools/_footer.mjs
--check` writes nothing and exits 1 if any generated file is out of date.

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
| `instruments/<id>/` | One instrument end to end: status, dates, applicability, provisions, enforcement, evidence, how it interacts with other instruments, related entities. Pre-rendered from the data for the twelve instruments whose records pass the indexability gate in `js/routes.js`; the browser re-renders the same view with today's date. |
| `instrument.html?id=…` | The address every instrument had until 27 Sep 2026. It forwards to `instruments/<id>/`; a record too thin for a page of its own is rendered here and marked `noindex`. |
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
| `taxonomy.json` | Every controlled vocabulary; nothing elsewhere invents a label. |
| `instruments.json` | Instruments, their nested provisions, relationships, and the Regulatory DNA slots. Instruments carry no dates — only references to timeline events. The cross-instrument relationships each carry a direction, a type, the provisions that carry them and their own sources; they render in Part IX of the brief and on every instrument page. |
| `institutions.json` | Bodies and their competence edges, each with exclusivity, scope and legal basis. |
| `timeline.json` | Dated events, each with a mandatory event type and date precision. |
| `enforcement.json` | Enforcement records on three orthogonal axes (action, payment, remedy) plus an appeal block. |
| `claims.json` | Every assertion the brief makes, with its type, its sources, what each source does for it and where in the source; derived claims carry their arithmetic, attributed ones whose view they report. |
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
- **Derived by this site** — a figure computed here from other claims, each with its own
  source. The drawer shows the inputs, the formula and the rounding; it is only as strong as
  its weakest input.
- **Attributed view** — what a named actor says, checked against that actor's own
  publication. Reported, not adopted.
- **Interpretation** — the author's reading or argument. Sources can support
  the premises; they cannot settle the conclusion. Where an argument is built on registered
  claims, the drawer lists them.
- **Unresolved** — no directly supporting external source has been located.

The live tally is on the bibliography page. It is not flattering, and it is
not meant to be.

Separately from the grade, each claim has an **evidence status** — direct, partial, derived,
context only, unverified or disputed — shown in the drawer, and passages of the brief that
are the author's synthesis, critique or recommendation carry a small ◇ mark so they are
never read as a sourced finding. `node tools/evidence-audit.mjs` reports all of it, and the
remediation backlog by cause (missing primary source, missing locator, secondary sources only,
unofficial reproduction only, possibly composite, review due, named reference gap).

**An asterisk in the running text means the reference is missing, not that
the statement is doubted.** It appears on a claim graded *Unresolved*, and
also on a claim that is partly sourced and has a named hole — the drawer says
which part is missing. The mark exists so a gap can be found and closed by
hand rather than being argued away; it is never removed by attaching a
loosely related substitute.

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

**Search engines are offered English only, for now.** A translation is applied
by JavaScript over the English HTML and has not been reviewed by a native
speaker, so `?lang=it|fr|es` keeps working for readers but is not advertised
with `hreflang` and is not in the sitemap. `docs/SEO-OPERATIONS.md` §6 says what
would change that.

---

## Testing

**No external test framework and no dependency: Node's built-in test runner is used.** The
four validators and the evidence audit above are the data and markup checks; each has its own
suite (`node --test tools/selftest.mjs`), which plants every defect a check exists to catch and
asserts it is caught. The agent layer has twenty-four more suites (`AGENTS.md` lists them).

The browser regression suite is in this repository too (`agent/browser/`). It installs nothing:
it drives a Chromium already on the machine over the DevTools protocol and checks page loads,
navigation, links, search, the evidence drawer, dialogs and focus, keyboard order, the rendered
heading outline, landmarks, reflow at 320px and four other widths, WCAG 2.x contrast in both
themes, reduced motion, localisation, that no request leaves the site — and that every page says
the same thing to a crawler before and after its scripts run (title, canonical, `<h1>`,
sections, structured data), and that the old `instrument.html?id=…` addresses still arrive.

```
node agent/browser/cli.mjs --require-browser
```

`design-qa.mjs` is the one that catches interface regressions statically —
heading order, duplicate ids, skip-link targets, internal links that point at
files which do not exist, missing `alt`, page-local styles, third-party
resources, inline event handlers, an inline script the Content-Security-Policy
would block, and the two CSS mistakes described under **To change the
interface**.

**CI and deployment.** `.github/workflows/qa.yml` runs everything on every push; its job
summary carries the evidence audit's measurements. `.github/workflows/pages.yml` deploys the
site only after the site checks pass — once the repository's Pages source is set to "GitHub
Actions". Until then a push to `main` publishes directly. `docs/DEPLOYMENT.md` says exactly
which settings a person has to change.

**Stale content is a warning, not a failure.** On every push, CI runs
`freshness.mjs`, and each staleness prompt it prints appears on the run as a
warning titled "Content stale". A prompt is raised when a dated event has
passed without being re-verified, when a provisional enforcement record has not
been re-read within its window, or when a dataset is past its interval. The
build stays green, because the tree is not wrong, only older. A green build is
therefore not evidence that the content is current. The rule, the thresholds'
home, and what closes a prompt (re-reading the source, and nothing else) are in
`docs/CONTENT-FRESHNESS-POLICY.md`.

---

## Search and discoverability

Every address the site answers is in one route model (`tools/seo.mjs`): which
pages are indexable and why the others are not, each page's title and
description, its canonical URL, its social card, its structured data and its
sitemap entry — the last with a `lastmod` that is the newest verification date
among the records the page shows, never the day the generator ran. Structured
data names no author, date, licence or legal force, because no page states one.
`tools/seo-audit.mjs` reads the HTML as a crawler does and fails on any
disagreement. What only the owner can do — Search Console, the Pages setting, a
custom domain — is in `docs/SEO-OPERATIONS.md`; the reasoning about audiences,
entry pages and citation is in `docs/DISCOVERABILITY-STRATEGY.md`.

---

## The footer, and why it is duplicated

Every page carries the same footer: a statement that this is an independent
project with no affiliation to any EU institution, a statement that nothing
here is legal advice, and the reuse position. Every page also carries the same
`<noscript>` notice saying what will not render without scripting — and, since
the browser suite measured that a reader with scripting off could reach none of
the six top-level pages from any page, the six destinations themselves. The
notice names the navigation among what will not appear and then supplies it.
The list is read out of the nav model in `js/shell.js` rather than retyped, so
there is still one home for it.

Both are written into the markup of every page — the seven hand-written ones
and each generated instrument page — rather than rendered by
`js/shell.js`, which is the opposite of the rule the chrome follows. The
reason is that a statement of non-affiliation which only appears when
JavaScript runs is not a statement of non-affiliation, and the no-JS notice
exists precisely for the case where no script has run. The cost is one copy
per page; `design-qa.mjs` fails the build if they stop being identical, and
`tools/_footer.mjs` regenerates them from one source.

**No licence has been declared.** The footer says so rather than implying one.
Until the author chooses, ordinary copyright applies to the analysis and the
datasets by default. Quotations from and links to EU legal texts carry those
documents' own reuse terms, which this site neither extends nor restricts.

## Known limitations

Stated plainly, because the site's own argument is that a record should say
what it cannot support:

1. **A substantial share of claims are not externally corroborated.** The
   bibliography computes and states the current count on every load, so this
   README cannot drift from it. After the sweep of 28 August 2026 the figure
   moved from 45 to 40 claims resting on nothing but the brief itself, with 9
   more carrying no directly supporting source; 22 claims were graded
   *Unresolved*, down from 27. As of 26 September 2026, after the
   AUDIT-2026-09-25 remediation, of 108 claims: 39 rest on nothing but the
   brief itself, 12 carry no directly supporting source (up from 9: the three
   claims added in September carry only partial support), and 19
   are graded *Unresolved*. The bibliography's live count is the one to
   trust over these.
   *Update, 27 September 2026:* after passages that no claim recorded were
   registered (143 claims), 39 rest on nothing but the brief itself, 14 carry
   no directly supporting source, and 20 are graded *Unresolved* — one more
   than before, because splitting a composite claim exposed a ranking ("nine
   of the ten largest fines") that no source states.
2. **Verification dates are a compilation date.** The field is per-record;
   the practice is not yet. `tools/freshness.mjs` says so explicitly.
3. **Three sources carry no URL** — down from twelve after the reference
   sweep of 28 August 2026. Two of the three are cases where the brief refers
   to an organisation's work without naming a publication, so there is nothing
   to link to; the third is the brief's own self-reference, which is not a
   source at all. They are listed by `tools/freshness.mjs` under the reason
   each link is missing.
4. **Enforcement figures are indicative of magnitude, not audited**, and the
   trackers behind the cumulative GDPR totals disagree with each other.
5. **Translations lag the English.** Declared in the register, marked in the
   interface. *Update, 27 September 2026:* all 427 strings of the brief are
   now translated into Italian, French and Spanish, and the register marks
   nothing pending or superseded. The 75 added that day were written in an
   AI-assisted editing session from the current English and have **not yet
   been reviewed by a native speaker** — the legal terminology follows each
   file's existing usage, but a reviewer should read them. When the English
   changes again, the lag returns, and the register is where it shows.
6. This is not legal advice, and the applicability engine asks three questions
   where a lawyer would ask fifty.
7. **No screen reader has been run against this.** Dialog semantics, focus
   management, landmarks and headings were verified programmatically, which
   is not the same thing. Chromium only; no real-device testing.
   *Update, 27 September 2026:* the browser suite now computes WCAG contrast
   for text over solid colours in both themes (it found and fixed one
   failure) and checks reduced motion and 320px reflow. It also reads
   Chromium's **accessibility tree** — the structure a screen reader is
   handed — and checks that every operable control has an accessible name
   at desktop and phone width (it found one that did not: the Contents
   button on phones, now fixed) and that the landmarks are there. That
   narrows this limitation; it does not close it — no screen reader was
   run, no pixels, one browser.
8. **The interface is English.** The entity overlay translates instrument
   names, statuses and event types on every page, so a reader who chose
   Italian on the brief sees those labels in Italian elsewhere too — but the
   chrome and the tool pages' own text are not translated, and the chrome says
   so rather than pretending otherwise.
