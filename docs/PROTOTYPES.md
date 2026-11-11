# Post-v2 C — the three prototypes, built and measured

The record of block C (`docs/POST-V2.md` §3 C): three directions built on **the same content, the same four views and the same conditions**,
each measured by the same battery (`docs/FRONTEND-REFERENCES.md` §4, M1–M8, and the grid of its §1). One section per direction, added by the
session that builds it. **Nothing here selects a direction or compares them**: that is PV2-05's, with the author's explicit decision. The current
site stays the baseline. The decisions cited are rows of `docs/ROADMAP-v2.md` §8; they live there and are not copied here.

## 0 · The common perimeter (decided at PV2-03's C.1, 11 Nov 2026)

| View | Content, read in place | Empty / missing state |
|---|---|---|
| Homepage | the brief's opening (`index.html`), the record counted (`data/`), the parts (`data/brief.json`) | figures that carry what they cannot count; a part with no claim |
| Regulation page | the **AI Act** (`data/instruments.json`, `timeline.json`, `claims.json`, `enforcement.json`) | the **Chips Act**: 0 claims, 0 provisions, 0 milestones, 0 relationships, `dna` null |
| Article page | **Part V** of the brief, from `index.html` `#part-5` (an article = one part of the brief until block E defines one) | a claim cited in the prose and absent from `claims.json` |
| Analytical view | the **timeline** (`data/timeline.json`, 101 events) with the relationships between instruments (`relationships`, 40) | a timeline narrowed to an instrument with no event; an instrument with no relationship |

Each prototype lives in an unpublished sibling folder under `prototypes/` (§8, "PV2-03, C.1 question 4"), outside the allowlist of
`tools/pages-artifact.mjs` — and therefore also outside every validator that walks the site's pages, `tools/thirdparty.mjs` included, which is
why each section below measures "no third-party request" in the browser. Conditions: 1280 and 390 px; light and dark; `prefers-reduced-motion`
unset and set. The Editorial shows the relationships as a fixed table; PV2-04 and PV2-05 show them in the Regulatory Network Explorer, whose
accessible alternative is the same table (`docs/POST-V2.md` §3 C, addition of 11 Nov 2026).

## 1 · Direction 1, Editorial — PV2-03, 11 Nov 2026

**Where:** `prototypes/editorial/` (`README.md` there says how to run it). Branch `claude/pv2-03-prototype-editorial`; built in `e782947`,
adjusted after the first measurement in `9331ea2`, **reworked in `249a410` after the author's judgment** (§1.6). The direction is
`docs/FRONTEND-REFERENCES.md` §8.2, 1. **§1.1–§1.5 describe and measure the first layout, which the author judged bad ("layout orribile"); they
stay as the record of it. The prototype as it now stands is §1.6.**

### 1.1 What was built

- **Four pages and one stylesheet:** `index.html`, `regulation.html` (`?id=ai-act`; `?id=chips-act` for the empty state; any id renders through
  the same template), `article.html`, `timeline.html` (`?instrument=` and `?status=`, a plain GET form), `editorial.css`.
- **Modules:** `common.js` (loading through `js/data.js`, the theme, the two absence tokens, short citations), `brief.js` (the one fetch outside
  `js/data.js`: `index.html`, same origin, parsed inert with `DOMParser`), `relations.js` (the table), and one module per view.
- **Imported, not rewritten** (`docs/DATA-GOVERNANCE.md` §1.2): `js/data.js` (`loadAll`, `index`, `label`, `renderError`); `js/format.js`
  (`evidenceStatus` and `EVIDENCE_WORD` from `js/evidence-model.js`, `humanDate`, `readerText`, `eur`, `plural`); `js/pipeline.js`
  (`aggregate`, `actionsOnly`); `js/status.js` (`initStatus`, the AI Act's status strip at the head of the article, as on the site); `js/routes.js`.
- **The Editorial patterns**, as §8.2 lists them: a reading column at 19 px (18 px below 40rem); notes in a margin column from 70rem and inline
  below the passage under it; headings h1 → h2 → h3 with no skip (the brief's h3/h4 are re-levelled under the page's h1); an "On this page"
  list built from the headings actually rendered; a status tag only on a record that has a state.
- **What no reference shows, designed here** (`docs/FRONTEND-REFERENCES.md` §7): "not recorded" (dotted, grey, the words) and "unknown" (dashed,
  violet, the word) drawn differently and never as zero; each claim's **statement, source and evidence status as three things** in the margin;
  totals that carry their count of what they cannot account for (`aggregate()`); a timeline of dated legal events (a filled dot occurred, a ring
  is scheduled, a month-precise date says the day is not established). **The dark theme has no reference among the candidates: it was designed.**
- **The relationships table** (§8, 11 Nov 2026): one row group per instrument, alphabetical, with every relationship that touches it, so each
  relationship appears under both instruments; columns *With · Type · Direction · What the record says · Provisions · Claims and sources ·
  Verification*; type from `kind` with the taxonomy's label; "A → B" only where `symmetric` is false, "Mutual — no direction" where it is true;
  absent or empty fields "not recorded"; `requires_verification: false` with a note shows "Checked", without one "Checked, no note", absent
  "verification not recorded" — never "verified"; an instrument with none keeps its row group with "no relationship recorded". `th scope`,
  explicit ARIA table roles (below 52rem the table is stacked with `display: block`), no sorting, no filtering, no canvas.
- **Look:** a saffron band and heavy sans headings over a warm paper, after the author's visual references (*Open Future*, *Economics
  Observatory / The Pudding*, `docs/FRONTEND-REFERENCES.md` §9), nothing of theirs copied. System font stacks only: no `@font-face`, no font file,
  so no font licence arises (§8.2's open point on Tufte CSS's fonts is avoided rather than resolved).
- **Rules kept:** the site's CSP in every page with `script-src 'self'` (no inline script, no `style` attribute); `noindex`; no dependency, no build step, no third-party code, asset or image.

**Choices made in the build, not decided by the author** (each could be revisited at PV2-05): an event whose `obligation` is null (adoption,
publication, entry into force) shows its type and no "not recorded" line, as `js/status.js` does; a claim's statement sits in a closed
`<details>` in the margin, its source and status always visible; the homepage links Parts other than V to the current site; the prototype is
English only — the site's `it`, `fr`, `es` overlays are not wired.

### 1.2 The measurement — samples and method fixed before measuring

Samples, named before any number was read, on PV2-02's pattern: **E = `article.html`** (the editorial sample), **D = `timeline.html`** (the
data sample); the homepage and the two regulation pages measured too, for information. Method: M1–M8 exactly as `docs/FRONTEND-REFERENCES.md` §4
writes them, re-implemented from that text in a scratch script outside the repository (PV2-02's scripts were not committed), in headless
Chromium (Playwright) against `python3 -m http.server`, 11 Nov 2026. C2 on E alone; C1 and C3 across both samples and the other views; C4 and
C5 the lower of E and D (rule 2, as rewritten by "grid finding G1"). Steps cumulative (M8).

**The method did not change; the prototype did, once.** The first reading (on `e782947`) put E's column at **87 cpl** — inside C2's anchor
(45–90) but outside the direction's own 65–85 — and the record lists of the homepage, the regulation page and the timeline at **15.7–16.3 px**,
below its 17–21 px. The stylesheet was narrowed and raised (`9331ea2`) and everything re-measured. Both readings are kept:

| Sample, 1280 px light | Body (M1) | Share of paragraph text | cpl, first → now | Contrast light / dark (M2) |
|---|---|---|---|---|
| E `article.html` | 19 px | 58% | 87 → **79** | 16.99 / 15.42 |
| D `timeline.html` | 16.32 → **17 px** | 90% | 94 → **80** | 16.99 / 15.42 |
| Homepage | 15.68 → **17 px** | 38% | 49 → 44 (cards) | 16.99 / 15.42 |
| AI Act page | 16.32 → **17 px** | 93–94% | 100 → **82** | 16.99 / 15.42 |
| Chips Act page | 15.2 → **17 px** (the empty-state text) | 36 → 47% | 85 → 65 | 8.26 / 9.07 |

At 390 px: E 18 px and 51 cpl, D 17 px and 49 cpl. Secondary text (`.meta`, notes, captions, kicker): lowest contrast 8.26 light and 9.07 dark
on E, 7.5 and 8.28 on D. Headings: 9 on E and 19 on D, no skip. "On this page": 4 of 4 links resolve on E, 2 of 2 on D. No horizontal scroll at
390 px on any of the five pages in either theme. Focus (M3): visible on 15 of 15 stops on every page. Running animations (M6): 0 with the
preference unset and set (the trivial case; one `prefers-reduced-motion` rule, smooth scrolling). Hosts requested: `localhost` only, on every
page and condition; no framework global. 24 page loads (6 URLs × 2 widths × 2 schemes): 0 console errors, 0 CSP violations.

### 1.3 The steps, with the next one not reached

| C1 | C2 | C3 | C4 | C5 | C6 |
|:-:|:-:|:-:|:-:|:-:|:-:|
| **3** | **4** | **2** | **4** | **4** | not scored |

- **C1 = 3.** P1 (long-form with a citation pattern: the article's margin sources), P2 (status tags: legislative, event and evidence status), P3
  (the timeline) are present, and the "no data" state is visible (the Chips Act page). **Not 4:** P4 — a *filterable table* of records — is
  absent: the relationships table is fixed by the author's decision, and the timeline's keyboard filter acts on a list, not a table. The
  statement / source / status triple that step 4 also asks for **is** shown (the article's margin, the AI Act's claims).
- **C2 = 4** (E). Sequential headings, 19 px, 79 cpl (87 at first: 4 either way), 16.99 : 1; a secondary level at 8.26 : 1 and a lede before the
  detail (step 3); a working contents list (step 4).
- **C3 = 2.** Real HTML tables with `th scope` (46 header cells on D). **Not 3:** no table is sorted or filtered from the keyboard, and no chart's
  values are read without a pointer (the article's risk pyramid is a labelled diagram, not a chart of values). The step-4 feature — a missing
  value shown differently from zero — **is present** in the table and everywhere else, but steps are cumulative (M8).
- **C4 = 4**, after the author's reading of M4 (§8, "PV2-03, grid C4 step 4"; first reported as undecidable under §1.1 rule 9). No horizontal scroll at 390 px, focus visible on 15 of 15, light and dark at 16.99 and
  15.42 : 1 (step 3); no running animation either way and a `main` landmark. Accessible names: D 15 of 15; **E 13 of 15 by M4 as written**
  (`ariaSnapshot`), because the two `<summary>` elements ("What is claimed") come out of it as plain text, while **Chromium's own accessibility
  tree** (`Accessibility.getFullAXTree`) gives both role `DisclosureTriangle` and the name "What is claimed": 15 of 15. The anchor says "in the
  accessibility tree"; M4 says "read from `ariaSnapshot`". The lower sample decides C4: 3 by `ariaSnapshot` alone, 4 by the tree. **The author decided that M4 is read on the full tree** where
  `ariaSnapshot` shows a focusable control with no name, for PV2-04 and PV2-05 too. The native `<details>` was not replaced by a custom widget to
  satisfy the tool.
- **C5 = 4.** Vanilla HTML, CSS and ES modules as shipped; no build step; no runtime dependency; no external font or script; only the page's own
  origin requested.
- **C6 not scored**, as for the baseline row of `docs/FRONTEND-REFERENCES.md` §5: it judges a third party's licence and maintenance, and nothing of
  a third party is in the prototype.

Steps, not a total, are what PV2-05 compares (§8, "grid finding G7").

### 1.4 Planted cases, run in the browser (11 Nov 2026, on `9331ea2`'s tree)

Each altered what the browser received, not the repository. Nine cases, all passed (one further line of the script only checked a route pattern and is not counted):
1. `claims.json` answered 500 → `js/data.js`'s error box in place, no heading, nothing substituted.
2. A claim cited in Part V (`clm-ai-act-product-safety`) removed from `claims.json` → its margin note reads "not found in claims.json".
3. Every `fine_eur` set to null → the homepage shows "—", never "EUR 0", and "13 actions with the amount not established, not counted".
4. A relationship stripped of `claims`, `provisions`, `sources`, `requires_verification`, `verification_note` → each cell "not recorded", no "Checked".
5. All 80 rows of the full table read "Mutual — no direction" or "A → B", none blank.
6. The Chips Act keeps its row group in the full table with "no relationship recorded".
7. `timeline.html?instrument=chips-act` → "No dated event is recorded for Chips Act…", no list.
8. `regulation.html?id=no-such-act` → "Instrument not found", nothing substituted.
9. `index.html` answered 404 to the article → the error box, no prose.

### 1.5 What this measurement does not see

- **Other browsers and other fonts.** Chromium only. The system stacks rendered here as **Caladea** (body, through the `Cambria` alias) and **Inter**
  (headings), read with `CSS.getPlatformFontsForNode`; on macOS, Windows or another Linux they resolve to other faces, and cpl moves with them.
- **A screen reader.** None was run. The stacked table's explicit roles and the `<summary>` name are read from the tree, not heard.
- **Contrast inside the SVG** of the article's risk pyramid (text over fills) and over the saffron band beyond the headings' and links' own colours:
  M2 measures paragraphs. Transitions on hover or focus (M6 does not measure them).
- **Length.** At 390 px the timeline page is about 61,000 px tall, almost all of it the 80 stacked rows of the full table; the method has no measure
  for that, and it is a cost of a fixed table on a phone.
- **Languages.** The prototype is English only; the site's language overlays are not wired, so the comparison is on the English content.
- **Third parties beyond these pages.** `tools/thirdparty.mjs` does not walk `prototypes/`; the absence of third-party requests is the browser's
  request log on these five URLs plus a static search of the folder (the only URL is the SVG namespace string, never requested).
- **Readers.** Nothing here says the direction reads well to a person; that is the author's judgment at PV2-05.

### 1.6 The rework of 11 Nov 2026 — the prototype as it now stands

**Why.** The author saw the first layout in screenshots and judged it bad; asked what to keep, the author chose that **the prototypes keep the
site's portal tree and its column of Roman numerals**, and that the Editorial be reworked now, on this branch (`docs/ROADMAP-v2.md` §8, the three rows
after "Final checkpoint of PV2-03 approved"). The first layout had put every page in one column at the left of a wide screen, leaving half of it
empty, and had set aside everything characteristic of the site.

**What changed (`249a410`), and what did not.**
- **The page uses the whole width.** From 75rem: three columns — a sticky contents list (with, on the timeline, the filter and the counts); the
  reading column at 37rem; and the margin, which holds the claims' notes in the article and a sticky **record card** (status, kind, CELEX, the part of
  the brief, scope, amended by, amends, repeals, last verified) on the regulation page. Below 75rem, one column.
- **The column of Roman numerals** (`renderRail()` in `common.js`), from `data/brief.json`: I–XI, A, B, sticky at the left; V opens the article and is
  marked on it, the others open the current site; below 52rem it becomes a strip under the header.
- **The portal tree** beside the homepage's title, **read in place from `index.html`** (`#portalTree`: each node's position, its Roman numeral and the
  paths between nodes), redrawn by the prototype with each node a real link; V, the article, is filled. Nothing of the tree is copied into the folder.
- **Type:** the site's own font files, used where they are (`../../fonts/`), not copied — Fraunces for display, Literata for text, IBM Plex Mono for
  labels. The licence of these files is not stated in `fonts/` and was not read by this session; they are the files the published site already serves.
  A sober warm paper with an oxblood accent, not the site's parchment and gold (the author did not require those).
- **The timeline** is a list of compact rows (the date in its own column, then the instrument, the type and status, the obligation), years as rules.
- **The margin** shows each claim's evidence status and its sources' titles; the statement and the exact locators sit together under "What is claimed,
  and where", so a long locator no longer stretches the margin. Nothing is shortened.
- **The relationships table** is fixed-width (`table-layout: fixed`, columns by percentage) and its wrapper scrolls on its own if ever needed; at 1280 px
  nothing overflows.
- **Not changed:** the data read, the modules imported, the two absence states, the table's rules, the CSP, `noindex`, the folder's status.

**Re-measured** the same way as §1.2 (samples E and D unchanged; method unchanged), 11 Nov 2026, on `249a410`:

| Sample, 1280 px light | Body (M1) | Share | cpl | Contrast light / dark | Headings, skip | Secondary (min) | Contents links |
|---|---|---|---|---|---|---|---|
| E `article.html` | 19 px | 49% | **68** | 15.59 / 14.88 | 9, none | 6.75 / 8.68 | 4 of 4 |
| D `timeline.html` | 17 px | 90% | 71 | 15.59 / 14.88 | 19, none | 6.75 / 8.68 | 2 of 2 |
| Homepage | 19 px | 44% | 56 | 15.59 / 14.88 | 18, none | 6.75 / 8.68 | 3 of 3 |
| AI Act page | 17 px | 94% | 72 | 15.59 / 14.88 | 10, none | 6.75 / 8.68 | 8 of 8 |
| Chips Act page | 17 px | 47% | 72 | 6.75 / 8.68 (the empty-state text) | 10, none | 6.75 / 8.68 | 8 of 8 |

At 390 px: E 18 px and 45 cpl, D 17 px and 49 cpl. No horizontal scroll on any page, width or theme (24 loads, 0 console errors, 0 CSP violations,
`localhost` only). Focus visible on 15 of 15 stops on every page; **names 15 of 15 by `ariaSnapshot` alone** — the column of Roman numerals now comes first
in the Tab order, so the two `<summary>` elements are no longer among the first 15. No running animation either way; a `main` landmark; no framework
global. Faces actually rendered (`CSS.getPlatformFontsForNode`): Literata, Fraunces, IBM Plex Mono — the same on any system, since they are files.
The nine planted cases of §1.4 were run again on `249a410`: all pass.

**Steps, unchanged:** C1 3 · C2 4 · C3 2 · C4 4 · C5 4 (no external font: the faces are same-origin files) · C6 not scored. The reasons in §1.3 hold.

**What this measurement does not see, beyond §1.5:** whether the site's font files may be reused beyond the published site (their licence was not read);
how the sticky record card and contents list behave on a short laptop screen (measured at 900 px of height only); thirteen Tab stops in the numeral
column before the page's own content, which the grid's first-15 rule now counts and a reader with a keyboard has to pass (a skip link is the first stop).

*Sections 2 (Policy observatory, PV2-04) and 3 (Hybrid, PV2-05) follow when those sessions write them.*
