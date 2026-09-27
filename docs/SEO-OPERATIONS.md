# SEO OPERATIONS

**Written:** 27 September 2026. **Read with:** `docs/SEO-AUDIT-2026-09-27.md` (the state before),
`docs/DISCOVERABILITY-STRATEGY.md` (why), `docs/DEPLOYMENT.md` (how the site is published).

This document says what the repository controls about how the site is found, what it cannot
control, and exactly what the owner has to do by hand. **Nothing in this repository can perform
an authenticated Search Console operation, and nothing here claims that a URL is indexed.**
Whether Google has indexed a page is established in Search Console or not at all.

---

## 1. The canonical model

One address per thing, decided in one place (`tools/seo.mjs`, the route model; the gate in
`js/routes.js`).

| Class | Address | Indexed | Canonical | In sitemap |
|---|---|---|---|---|
| The brief | `/` | yes | itself | yes |
| Five directory pages | `instruments.html`, `institutions.html`, `enforcement.html`, `applies.html`, `bibliography.html` | yes | itself | yes |
| Instrument pages (12) | `instruments/<id>/` | yes | itself | yes |
| Compatibility route | `instrument.html?id=<id>` | **no** — forwards to `instruments/<id>/` (keeping `#fragment`) | none | no |
| Thin records (12) | `instrument.html?id=<id>` | **no** — rendered, `noindex, follow` added on load | none | no |
| No id / unknown id | `instrument.html`, `…?id=<unknown>` | **no** — forwards to the list / `noindex` | none | no |
| Translations | `/?lang=it|fr|es` | **no** (§6) | `/` | no |
| Application states | `applies.html?instrument=…`, `#…` fragments, search, filters | not separate pages | the page's own | no |

`node tools/seo-audit.mjs` prints the live version of this table under **NOT INDEXED, AND WHY**,
with the gate criterion each thin record fails. It is computed from the data every run.

### The indexability gate

An instrument gets a page of its own only when its record can answer what a searcher would ask
(`js/routes.js` `GATE`): it is secondary law or a proposal, not a Treaty text; it has a short
name, a full name and a CELEX number; a recorded objective; a status with the date it was
assessed; at least one dated milestone; at least one claim or sourced provision; and a Part of
the brief or a recorded relationship. **All seven must hold.** Nothing is listed by hand, so a
record that gains an objective and dates gains a page at the next `node tools/_footer.mjs`, and
one that loses them loses it (the generator deletes the directory). This is the guard against
thin, scaled pages: twelve records pass, twelve do not, and the twelve that do not stay fully
usable in the application.

### Why static pages, and why they cannot drift

The instrument view is one renderer (`js/instrument-view.js`). `tools/_footer.mjs` calls it in
Node with no clock and writes the result into `instruments/<id>/index.html`; the browser calls it
again on load with today's date. The two outputs differ only in fragments that depend on the
date (the next date, "applies since" vs "applies from", record age, the enforcement pipeline) —
the static page states nothing that would become false on its own. CI regenerates every page and
fails if a committed file differs (`seo-audit.mjs` §1, selftest S1/S5).

**After any change to `data/`, run `node tools/_footer.mjs` and commit what it writes.** After a
change that alters an instrument's name, CELEX number or kind, also run `node tools/og-image.mjs`
(needs a local Chromium; CI does not render images, it only detects a stale one).

## 2. What GitHub Pages lets this repository control — measured, not assumed

| Signal | Controllable here? | How |
|---|---|---|
| `<link rel=canonical>`, `meta robots`, titles, descriptions, JSON-LD | yes | written into the HTML by `tools/_footer.mjs` |
| `sitemap.xml` | yes | generated; served at `/Eu-Digital-Policy/sitemap.xml` |
| `robots.txt` | **not from this repository.** Crawlers read it only at the host root, `https://andreatosti2001.github.io/robots.txt` (404 on 27 Sep 2026). A file here would be ignored. | The host root is served by a *user-site* repository named `andreatosti2001.github.io`. Creating one would let the owner publish a root `robots.txt` (e.g. only a `Sitemap:` line). It is optional: nothing on this site needs to be blocked. |
| Server redirects (301) | **no** — Pages cannot send them | `instrument.html?id=` forwards with `location.replace`; Google follows JavaScript redirects when it renders |
| Response headers (`X-Robots-Tag`, CSP header, HSTS) | no (HSTS is sent by Pages) | `docs/DEPLOYMENT.md` §4 |
| Custom 404 | possible (a root `404.html`) | not done; a 404 is never indexed, so it is UX only |
| Site name in results | **no, at this address.** Google's documentation (read 27 Sep 2026): "Google Search does not support site names at the subdirectory level." | `WebSite.name` = "EU Digital Policy" is declared anyway, so it applies unchanged on a custom domain (§8) |
| `/instruments` without a slash | served by Pages | now resolves to the `instruments/` directory, which has no index page; nothing links there |

## 3. Search Console: first-time setup (owner only)

1. Go to <https://search.google.com/search-console> → **Add property** → **URL prefix**, and
   enter exactly `https://andreatosti2001.github.io/Eu-Digital-Policy/`. A *Domain* property is
   impossible: it needs DNS control of `github.io`.
2. Verify. Two methods work on this hosting:
   - **HTML tag** (recommended). Copy the `<meta name="google-site-verification" content="…">`
     tag and paste it into `index.html`'s `<head>`, directly after the viewport meta. The
     generator leaves tags outside its marked blocks alone, and a `meta` tag is not a script, so
     the CSP is unaffected. Commit with an `Evidence:` trailer (e.g. `Evidence: Search Console
     verification token issued to the owner`), push, wait for the deploy, then click **Verify**.
     Leave the tag in place; removing it un-verifies the property.
   - **HTML file.** Put the downloaded `google…html` file at the repository root **and add its
     name to `PUBLIC_FILES` in `tools/pages-artifact.mjs`** — once the Pages source is "GitHub
     Actions", only allowlisted files are published, and the file would otherwise 404.
3. **Sitemaps** → enter `sitemap.xml` → **Submit**. Expect 18 URLs discovered.
4. Optionally repeat 1–3 in **Bing Webmaster Tools** (it can import the Search Console property).

## 4. After each deployment that changes URLs or content

1. **URL Inspection** on a representative set — the home page, `instruments.html`,
   `instruments/ai-act/`, `instruments/gdpr/`, `instruments/dsa/`, `instruments/dma/`,
   `enforcement.html`, `bibliography.html`:
   - **Test live URL** → **View tested page**: check the rendered HTML contains the `<h1>`, the
     "What it does" and "Key dates" sections, and the canonical naming the same URL.
   - "User-declared canonical" and "Google-selected canonical" should be the same URL.
   - For a new or substantially changed page, **Request indexing** (there is a daily quota; use
     it for the pages that changed, not for all of them).
2. Inspect one old address, e.g. `instrument.html?id=gdpr`. Expected over time: *Page with
   redirect* (Google has rendered it and followed the forward) or *Alternate page with proper
   canonical tag*. Do not request indexing for it.
3. Inspect one thin record, e.g. `instrument.html?id=eprivacy`. Expected: *Excluded by
   'noindex' tag*. That is the intended state.

## 5. Monitoring (monthly is enough for a site of this size)

**Indexing → Pages.** Read each "why pages aren't indexed" reason against §1:

| Status | For which URLs it is expected | Action if it appears elsewhere |
|---|---|---|
| Excluded by 'noindex' tag | `instrument.html?id=` thin records | an instrument page here means `noindex` leaked into its HTML — `seo-audit.mjs` should already have failed |
| Page with redirect | `instrument.html?id=` of instruments with a page | none |
| Alternate page with proper canonical tag | `?lang=`, `?instrument=` | none |
| Duplicate, Google chose different canonical than user | nowhere | inspect both URLs; usually two pages saying too nearly the same thing |
| Crawled – currently not indexed | nowhere, ideally | a quality judgement: the page is not yet seen as worth a result. Improve the record (verification, provisions, dates) — never pad the page |
| Discovered – currently not indexed | new pages, for a while | wait; check the page is linked (it is, from every page's site index) |

**Performance → Search results.** Search type *Web*. Use **Queries** and **Pages** together:

- Which pages earn impressions, and for which queries. Map each query to a cluster in
  `docs/DISCOVERABILITY-STRATEGY.md` §2. A cluster with impressions and a low CTR usually means
  the title or description does not answer the query — change the route model, not the prose.
- A query with impressions for which no page is a good answer is a **content gap**. Close it only
  if the data can: a verified record, provision or relationship that belongs in the dataset
  anyway. Never write a page for the query.
- **AI features.** Google's documentation (read 27 Sep 2026) states that appearances in AI
  Overviews and AI Mode "are included in the overall search traffic in Search Console" and are
  "reported on in the Performance report, within the 'Web' search type". They cannot be isolated
  there. Watch the Web totals for the instrument pages; check the answers themselves by searching
  the questions in §2 of the strategy document and noting whether and how the site is cited.
- **Multimodal / images.** Use search type *Image* for the social cards and any image traffic.
  Google Lens and other multimodal entry points are not broken out separately; do not infer them.
- Record a monthly snapshot (clicks, impressions, CTR, average position per page) outside the
  repository or in a document of its own; this repository has no analytics and adds none.

**Enhancements / structured data.** The site declares no type Google shows as a rich result
(`Legislation` is descriptive schema.org vocabulary; `BreadcrumbList` is the only one Google
uses, for the breadcrumb trail). A structured-data *error* reported there is a real defect —
`seo-audit.mjs` §6 should have caught it; add the missing check.

## 6. Languages: what is and is not indexed, and what would change it

Indexed: English only. Not indexed: `/?lang=it|fr|es`, which stay working, shareable addresses
for readers. Until 27 Sep 2026 they were advertised with `hreflang` and listed in the sitemap;
they were withdrawn because (a) the HTML at every `?lang=` address is English — the translation
is applied by `app.js` after load; (b) that HTML named the English page as canonical, so the
alternates were not self-canonical; and (c) the translations have not been reviewed by a native
speaker (README limitation 5). A search engine offered those URLs would see either a duplicate
of the English page or unreviewed machine-assisted text presented as a localized edition.

To index a language, all of these must be true, and `seo-audit.mjs` §7 enforces the last two:

1. A native speaker has reviewed that locale (record it in `i18n/locales.json`).
2. The translated brief exists as HTML at a stable path — `/it/`, generated by `tools/_footer.mjs`
   exactly as the instrument pages are, by applying `i18n/it.json` to the brief's `data-i18n`
   nodes, with a self-referencing canonical and `<html lang="it">`.
3. The route model gains a `language` route with `indexable: true` for it; `hreflang`
   alternates are then emitted reciprocally from the register, `x-default` naming English.

The tool pages are not translated and must never carry alternates.

## 7. Changing a title, a description or a page

- **A top-level page's title or description:** edit `TOP_PAGES` in `tools/seo.mjs`, run
  `node tools/_footer.mjs`. Keep the page's own `<h1>` and visible text in step: the title may
  not promise what the page does not carry.
- **An instrument's title:** edit its entry in `INSTRUMENT_TITLE` (`tools/seo.mjs`). Each facet
  carries a pattern that must match the page's visible text, or `seo-audit.mjs` fails. The
  description is derived from the record and is not edited by hand.
- **A common name** ("Digital Services Act"): `KNOWN_AS` in `js/routes.js`. It is used only while
  the record carries the matching alias, so a name cannot appear that the data does not hold.
- **A new instrument page:** complete the record in `data/` (objective, status, dates, evidence),
  run `node tools/_footer.mjs` and `node tools/og-image.mjs`. No route is added by hand.

## 8. Limits that code cannot remove

- `lastmod` is the newest verification date among the records a page renders. A layout or
  template change moves no `lastmod`, by design; a record re-read without change does move it,
  because the page shows that date.
- The enforcement, institutions and bibliography pages render their full, filterable views with
  JavaScript. Since the second pass of 27 Sep 2026 each ships a generated **record index** in its
  HTML — every enforcement record (entity, instrument, authority, date, announced fine, status,
  appeal), every body with its competences, every source by tier with its citation — linked to the
  instrument pages and replaced by the full view on load (`tools/seo.mjs` `enforcementIndex`,
  `institutionsIndex`, `bibliographyIndex`; `seo-audit.mjs` fails if one omits a record). What the
  index does not carry is what depends on the date or on interaction: the derived pipeline, the
  aggregates, the filters, the uses of each source.
- A subdirectory on `github.io` cannot hold a site name, a root `robots.txt` or a Domain
  property, and its links accrue to a shared host. A custom domain removes all three
  (`docs/DISCOVERABILITY-STRATEGY.md` §7). Moving is one line (`BASE` in `tools/_footer.mjs`)
  plus the Pages custom-domain setting, after which GitHub Pages redirects the `github.io`
  address to the domain.
- No validator here can see how a search engine *ranks* or *summarises* a page. `seo-audit.mjs`
  proves consistency of what the site declares; nothing else.
