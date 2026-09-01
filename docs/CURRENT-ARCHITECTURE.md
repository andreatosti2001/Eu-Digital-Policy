# CURRENT ARCHITECTURE

**Status:** written in SESSION 00 (reconnaissance). Describes commit `7248290` on `main`.
**Method:** read from the repository, not from the previous README's description of it.
Where the two disagree, this document says so.

---

## 1. Rendering model

**Static HTML, rendered client-side from JSON at runtime. There is no build step, no
generator, no bundler, no dependency and no server.**

Each page ships as hand-authored HTML containing the chrome mount points and (on the brief)
the prose. Everything else — every number, date, status, competence, source and enforcement
record — is fetched from `data/*.json` by ES modules after load and written into the DOM.
The HTML contains no copy of any of it.

Consequences an agent must respect:

- The site **must be served over HTTP**. `file://` blocks both ES modules and the `fetch`
  calls that load the datasets. `python3 -m http.server 8000` is the documented way to run it.
- There is no `package.json`, no lockfile, no `node_modules`. Node is used only to run the
  scripts in `tools/`, which are themselves zero-dependency.
- Nothing is precompiled, so a change to `data/*.json` is live on the next page load with
  no build to re-run.
- **There is no offline support.** No service worker, nothing precached.

## 2. Inventory

| Layer | Count | Location |
|---|---|---|
| Pages | 7 | repository root (`*.html`) |
| ES modules | 25 | `js/` |
| Classic script | 1 | `app.js` (62 KB, `index.html` only, not a module) |
| Stylesheets | 4 | `style.css`, `css/tokens.css`, `css/evidence.css`, `css/tools.css` |
| Canonical datasets | 10 | `data/*.json` |
| Locales | 3 + register | `i18n/` |
| Self-hosted fonts | 6 | `fonts/*.woff2` |
| Dev scripts | 7 | `tools/*.mjs` |

## 3. The pages

| Page | Role |
|---|---|
| `index.html` | The brief. Fourteen parts, evidence apparatus, reading tools. 210 KB. |
| `instruments.html` | Regulatory DNA comparison across any set of instruments. |
| `instrument.html?id=…` | One instrument end to end. The reference implementation for a detail page. |
| `institutions.html` | Bodies and competences. |
| `enforcement.html` | Enforcement observatory with the derived pipeline per record. |
| `applies.html` | The applicability engine. |
| `bibliography.html` | Every source, tiered, with the live grade tally. |

The chrome — navigation, breadcrumbs, theme, skip target, search — is rendered by
`js/shell.js` on every page from **one nav model** (`NAV`, `js/shell.js:34`). It is not
written into the markup and a page must not add its own header. The README records why:
five hand-copied headers is how one destination came to have two names, and how a skip link
came to point at an id that existed on one page out of six. `instrument` is not a top-level
destination — it is declared a child of `instruments` via `CHILD_OF`.

## 4. Module topology

### The single data gateway

`js/data.js` is the only module that calls `fetch()` for a dataset. It owns the cache
(`name → Promise<parsed>`, so repeated calls share one request), the reverse indexes, the
taxonomy label lookup, the dataset-failure renderer, and the i18n overlay/register loaders.

**No renderer ever calls `fetch()` itself.** This is an invariant, not a convention.

`index(db)` builds the reverse indexes every view needs — `instrument`, `provision`,
`institution`, `source`, `claim`, `event`, `term`, `taxonomy`, `relationship`,
`claimsByPart`, `eventsByInstrument`, `provisionOwner`. It is pure: same input, same output.

`renderError(mount, err, retry)` implements the failure contract: show a clear error, **do
not fabricate fallback data**, leave the surrounding static content alone.

### Two entry points

- **`js/boot.js`** — every page *except* the brief. Starts `initShell()` and `initPalette()`
  and nothing else. Deliberately separate from each page's own module *so that a failure in
  one cannot take out the other*: a broken enforcement renderer must not remove the
  navigation from the page. Note the asymmetry — `initShell()` is wrapped in `try/catch`,
  the palette catches its own rejection.
- **`js/main.js`** — the brief only. Loads the six datasets the article needs, builds the
  indexes, then hands them to each view. Every view is individually `try/catch`-wrapped, so
  one failing widget cannot blank the article. The chrome goes first because it owns the
  skip-link target and should not wait on a dataset. Non-critical views (masthead, palette,
  glossary graph, pyramid, interactions) start after the article renders and block nothing.

### `app.js` — the brief's interaction layer

A 62 KB classic (non-module) script loaded before `js/main.js` on `index.html` only. It owns
scroll/progress, the reading lens, the theme toggle, the Tree-of-Life contents overlay, the
glossary popovers, the prose search provider, resume positions, the pager, the shortcuts
overlay, the portal/rota set pieces, and the in-place i18n string swap.

It reads `window.__CONTENT__`, a JSON blob inlined at `index.html:361`. **See §8 — this is
the one place the data architecture is bypassed.**

`js/main.js` runs after `app.js` deliberately, so the English snapshot the i18n layer takes
is clean of anything the modules add.

## 5. Dataset dependency map

Which page loads which dataset — read from the `loadAll` / `load` call sites, not assumed:

| Page → module | Datasets loaded |
|---|---|
| `index.html` → `js/main.js` | taxonomy, instruments, institutions, sources, claims, timeline |
| ↳ `js/masthead.js` | taxonomy, instruments, timeline, enforcement |
| ↳ `js/glossary-graph.js` | taxonomy, instruments, institutions, enforcement, glossary |
| ↳ `js/pyramid.js` | taxonomy, instruments |
| ↳ `js/interactions.js` | taxonomy, instruments, sources, claims |
| ↳ `js/search.js` (via palette) | taxonomy, instruments, institutions, claims, enforcement, timeline, glossary |
| `instruments.html` → `js/instruments-page.js` | taxonomy, instruments, institutions, timeline, sources |
| `instrument.html` → `js/instrument-page.js` | taxonomy, instruments, institutions, sources, claims, timeline, enforcement, applicability, glossary |
| `institutions.html` → `js/institutions-page.js` | taxonomy, instruments, institutions, sources |
| `enforcement.html` → `js/enforcement-page.js` | taxonomy, instruments, institutions, sources, claims, timeline, enforcement |
| `applies.html` → `js/applies.js` | taxonomy, instruments, institutions, sources, claims, timeline, applicability |
| `bibliography.html` → `js/bibliography.js` | taxonomy, instruments, institutions, sources, claims |

`taxonomy` and `instruments` are loaded by every view. **`brief` is loaded by nothing —
see §8.**

## 6. The derivation layer

This is the load-bearing architectural commitment. Four facts are **computed at render
time and never stored**, so two copies cannot disagree:

| Derived fact | Computed by | From |
|---|---|---|
| Evidence grade (5 levels) | `js/format.js` (`TIER_GRADE`, ~L256) | claim type + the tier of its strongest **direct** source |
| Enforcement pipeline (8 stages) | `js/pipeline.js` | the three orthogonal status axes + appeal block |
| Competent authority | `js/dna.js` | competence edges in `institutions.json` |
| Key dates | `js/dna.js` | `timeline.json`, via `instrument.milestones` |

Two rules inside this layer carry the site's integrity and must never be relaxed:

1. **The grade is derived, never stored**, so it cannot drift from the evidence it
   describes. A claim whose only source is `src-brief-original` is by definition unverified.
2. **Unknown is never zero.** `js/pipeline.js` distinguishes `reached` / `not-reached` /
   `unknown` / `na`. Unknown is not counted as reached, not counted as not-reached, and
   never summed into a total. A pipeline that stops at "decision" with everything after it
   unknown is the normal case in this dataset, and saying so is the point.

`js/evidence-view.js` exists because a source attached to a claim was being drawn in two
places and the two renderings disagreed about how to describe self-citation. There is now
one function taking a density (`full` / `compact`), not a caller. Do not add a second.

## 7. The data model

Ten datasets in `data/`. Each is self-documenting: `$schema_version`, `$description`,
`$last_verified` and usually a `$note` stating the rule the file exists to enforce. **Read
the `$note` before editing any dataset** — it is where the non-obvious invariant lives.

| File | Holds | Key invariant |
|---|---|---|
| `taxonomy.json` | 28 controlled vocabularies, 243 terms | Every enum-valued field in every other dataset resolves here. IDs are `<dimension>:<slug>` and are **never renamed**. |
| `instruments.json` | 23 instruments, 60 provisions, 17 relationships | Instruments carry **no dates** (only `milestones` → timeline IDs) and **no supervisor** field. Treaty articles are modelled as provisions of `tfeu`/`teu`, so a legal basis is always a provision ID. |
| `institutions.json` | 20 bodies, 52 competence edges | Competence edges live here **and nowhere else**. `-*` suffix = the whole class of national bodies. |
| `timeline.json` | 42 dated events | Mandatory event type and date precision. Entry into force and application are **never merged**. |
| `enforcement.json` | 16 records | Three orthogonal axes (action / payment / remedy) + appeal. **No aggregate totals are stored.** `null` ≠ `unknown`. |
| `claims.json` | 91 claims | The `supports` qualifier (`direct` / `partial` / `context`) is load-bearing. `context` is **not** a citation. |
| `sources.json` | 77 sources | One record per document. A source is never described twice. `url_status` distinguishes live / unchecked / none. |
| `applicability.json` | 33 rules | Declarative; the matcher in `js/applies.js` is deliberately unintelligent. The reasoning lives in the data and is inspectable. |
| `glossary.json` | 15 terms | Terms carry edges outward, so a definition is an entry point rather than a dead end. |
| `brief.json` | 14 parts + 20 reading-graph edges | Canonical for part identity, ordering, titles, deks, reading times. **Not consumed at runtime — see §8.** |

## 8. FINDING: the `__CONTENT__` bypass

This is the one place the architecture described above does not hold, and it is recorded
here because it is a trap for any agent editing the brief.

**`data/brief.json` is validated but never fetched.** No module loads it. The only four
occurrences of `'brief'` in `js/` are nav-model IDs in `js/shell.js` (lines 35, 215, 230,
247). Instead, the brief's structural data ships as an inline blob at `index.html:361`:

```
window.__CONTENT__ = { meta{6}, nodes[6], nav[14], search[13] }    ~59.8 KB
```

So the same facts have two homes, which is exactly what `validate.mjs` §4 exists to prevent —
but the check cannot see inside `index.html`, so nothing compares them.

**They have already drifted.** `meta.standfirst` differs between the two:

- `brief.json` — "Six regulations, one directive family and a live reform package now govern…"
- `__CONTENT__` — "Six regulatory regimes — regulations, a family of directives and a live reform package — now govern…"

All 14 `nav` entries still agree with `brief.parts` on `id`, `roman`, `title` and reading
minutes. The duplication was already known: `tools/_review10.mjs:103` notes that an edited
string "also appears inside the inlined `__CONTENT__` search index".

**Not fixed in this session** — deciding which standfirst is correct is the author's call,
and the fix is canonical-data work outside a reconnaissance boundary. Recorded as an
unresolved issue in `docs/HANDOVER.md`.

## 9. Dependency map — canonical record to reader

```
  data/*.json ──────────────┐
  (10 canonical datasets;    │   ONE gateway. No renderer calls fetch().
   taxonomy is the enum      │
   authority for all others) │
                             ▼
                    ┌──────────────────┐
                    │   js/data.js     │  fetch → cache → index()
                    │  load / loadAll  │  + renderError (no fallback data)
                    └────────┬─────────┘
                             │  db + reverse indexes (ix)
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
     ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
     │ DERIVATION   │ │  SHARED     │ │   i18n       │
     │ format.js    │ │  format.js  │ │ locales.json │
     │  → grade     │ │  evidence-  │ │  → overlay   │
     │ pipeline.js  │ │  view.js    │ │  (entity-    │
     │  → 8 stages  │ │  filters.js │ │   keyed)     │
     │ dna.js       │ │  dialog.js  │ └──────┬───────┘
     │  → authority │ └──────┬──────┘        │
     │  → key dates │        │               │
     └───────┬──────┘        │               │
             └───────────────┼───────────────┘
                             ▼
                    PER-PAGE RENDERERS
   main.js · instruments-page · instrument-page · institutions-page
   enforcement-page · applies · bibliography · glossary-graph
   masthead · pyramid · interactions · calendar · status · evidence
                             │
                             ▼
                    shell.js (chrome, one NAV model)
                    palette.js → search.js (one search surface)
                             │
                             ▼
                      7 static HTML pages
                             │
                             ▼
                    GitHub Pages  →  reader


  ══ THE ONE BYPASS ══════════════════════════════════════════
  index.html:361  window.__CONTENT__  ──► app.js
      (meta, nodes, nav, search — inlined, ~59.8 KB)
      duplicates data/brief.json, which nothing loads.
      No validator compares them. meta.standfirst has drifted.
  ════════════════════════════════════════════════════════════
```

## 10. Presentation layer

Load order is fixed and checked: **`css/tokens.css` first**, then `style.css`,
`css/evidence.css`, `css/tools.css`. All 7 pages carry exactly this order.

`css/tokens.css` holds the type scale, spacing scale, layout widths, surfaces and the
semantic status system. A component that needs a size, gap or status colour takes it from
there rather than inventing one.

Two rules exist because both have already shipped as bugs, and `design-qa.mjs` enforces both:

1. **A theme-dependent token is declared on `body`, never on `:root`.** The day palette is
   an attribute on `<body>`, so a token at `:root` resolves against the night values in day
   mode — invisible in whichever theme you happen to be working in.
2. **Status is never carried by hue alone.** Every `.badge` state has a glyph and a border
   style as well as a colour, so it survives greyscale, a printer and a colour deficiency.

Also forbidden: colour literals as property values outside the two files allowed to declare
them, page-local `<style>` blocks, and any third-party stylesheet or script.

## 11. Localisation

`i18n/locales.json` is the **single source of truth**. The language menu is built from it at
runtime, so a language cannot be offered unless the register declares a file for it, and a
declared file that 404s demotes the locale rather than breaking the page. **No module may
assemble an i18n path by string concatenation** — `i18n-audit.mjs` checks this.

Each locale has two files:
- `i18n/<code>.json` — positional strings keyed to `data-i18n` attributes.
- `i18n/<code>/data.json` — the entity-keyed overlay, whose keys are canonical entity IDs,
  so a translation survives the DOM being rebuilt.

English is the source language, snapshotted from the DOM and never fetched.

Any key a locale lacks **must** be declared in the register as either `superseded` (a
translation withdrawn because the English it rendered no longer describes the site) or
`pending_translation` (new, not yet translated). Undeclared gaps are an error. Missing
strings fall back to English, are marked `data-i18n-fallback`, and show as **EN** in the
interface.

Current state: 416 declared English keys; 394 present per locale; 22 declared absent (10
superseded, 12 pending); 60 canonical entity keys, identical across `it`, `fr`, `es`.

## 12. Tooling

**Four validators — run these; they are the project's test suite.**

| Script | Checks | Exit |
|---|---|---|
| `tools/validate.mjs` | 6 sections: files parse · duplicate IDs · referential integrity · **duplicate canonical facts** · status-model discipline · unverified-data report | 1 on error |
| `tools/design-qa.mjs` | Per page: title/description/viewport, exactly one `<h1>`, no skipped heading level, no duplicate id, skip link resolves, internal hrefs resolve to real files, `<img>` alt, token layer loaded first, no page-local `<style>`, no third-party resource, footer + noscript identical across all 7 pages. Across CSS: no colour literals, no `:root` theme tokens | non-zero on error |
| `tools/i18n-audit.mjs` | Register vs disk vs live DOM; declared key counts; no orphan keys; every gap declared and correctly categorised; identical entity IDs across locales; no concatenated paths | non-zero on error |
| `tools/freshness.mjs` | Verification-date age; per-record vs compilation dates; events that have passed; records whose own text says they are provisional | 0 unless past a stated interval |

**Two generators / one-shot patches — run only when the thing they own changes:**

- `tools/_footer.mjs` — rewrites the legal footer, the no-JS notice and the social metadata
  in all seven pages from one source. Holds the deployed origin in a single `BASE` constant.
  If the site moves, change that line, re-run, and `design-qa.mjs` confirms all seven
  canonical URLs agree.
- `tools/_refsweep.mjs` — the reference sweep of 28 Aug 2026, kept so the edits are auditable.
- `tools/_review10.mjs` — the substantiated half of the external review of 28 Aug 2026.
  Already applied; retained as the audit record.

**Baseline at commit `7248290`** (all four run in this session):

```
validate.mjs     0 errors · 0 warnings · 106 unverified/requires-verification · exit 0
design-qa.mjs    0 errors · 5 warnings · exit 0
i18n-audit.mjs   0 errors · 0 warnings
freshness.mjs    reports only · exit 0
```

The five `design-qa` warnings, recorded so a later session can tell new from pre-existing:
3 inline event handlers in `index.html` (lines 42, 112, 119); a `#000` literal in
`css/evidence.css`; a `#000` literal in `css/tools.css`; `--tx` and `--ty` never set in
`style.css`.

**There is no test runner.** The Playwright suites used during development live outside this
repository. What ships here are the four validators, which a contributor can run without
installing anything.

## 13. Build and deployment

- **No build step.** Nothing is compiled, bundled, minified or generated at deploy time.
- **No CI.** There is no `.github/` directory, no workflow, no `_config.yml`, no `.nojekyll`.
- **Deployment is GitHub Pages serving `main` at the repository root.** This is inferred
  from the canonical URLs written into all seven pages
  (`https://andreatosti2001.github.io/Eu-Digital-Policy/…`) and from the absence of any
  workflow. The Pages source setting is repository configuration outside the tree and was
  **not** readable with the tools available in this session.
- The remote carries a single branch, `main`, at `7248290`.
- Publication is therefore a push to `main`. There is no gate between a commit and the
  public site — **the validators are advisory, not enforced.** Any session that changes data
  or markup must run them by hand.

**FINDING — the deployed site was not inspected.** Outbound access to
`andreatosti2001.github.io` is refused by this environment's network policy (HTTP 403 on
CONNECT, 5 of 5 attempts). Everything in this document is read from the repository. No claim
is made here about what the live site currently serves.
