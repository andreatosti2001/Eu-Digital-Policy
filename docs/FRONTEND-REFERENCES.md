# FRONTEND REFERENCES — Post-v2 block B (PV2-02)

**Status:** B.1 **approved** (§8, "Checkpoint B.1 of PV2-02 approved", 10 Nov 2026): the scoring grid; the six candidates were approved the same
day. **B.2 and B.3 are written** (§3b–§8: the sampled pages, the method, the matrix with the evidence behind every score, seven findings about
the grid, the gallery, a proposed shortlist and three directions) and were **approved** with the prompt of PV2-03 (§8, "Final checkpoint of PV2-02 approved", 10 Nov 2026) — as the record of what was found; the
shortlist (§8.1) and the findings of §6 are still proposals.
**What this is:** the documented search for open-source frontend projects that `docs/POST-V2.md` §3 B asks for, **to study patterns, not to
adopt a template**. The plan: no framework, library, remote font, third-party script or proprietary image in production; a project is
used to study a pattern and, only where its licence allows, for small reuses with attribution.
**Authority:** §8, "Post-v2 A may open before G1" and "PV2-02 (Post-v2 B) may be run before G1, under A's three limits" (10 Nov 2026), "The
scope of PV2-02" (10 Nov 2026), and the author's answers of B.1 questions 1–3 (10 Nov 2026), plus "PV2-01, A.5 questions 2 and 3" (9 Nov
2026). G1 is not open and is not decided here. **`docs/` only; nothing of a third party enters the repository.**

---

## 1. The grid

The weights are the plan's (`docs/POST-V2.md` §3 B) and the author did not change them. The scale is **0–4 with every step anchored**
(§8, "B.1 question 1"): a score is the step the evidence reaches; there are no half steps and no "about 3".

| # | Criterion | Weight |
|---|---|---:|
| C1 | Fit for a legal and editorial observatory | 20% |
| C2 | Information hierarchy and readability | 20% |
| C3 | Quality of dashboards, tables and visualisations | 20% |
| C4 | Responsive, accessibility and themes | 15% |
| C5 | Concrete possibility of a vanilla HTML/CSS/JS rebuild | 15% |
| C6 | Licence and maintenance documented | 10% |

**Total** = Σ over the six criteria of (step ÷ 4 × weight), out of 100. *Arithmetic example, not a candidate:* steps 3, 2, 4, 3, 2, 4 give
15 + 10 + 20 + 11.25 + 7.5 + 10 = **73.75**. A total is shown with its six steps beside it, never alone; the session breaks no tie — a tie
is reported as a tie.

### 1.1 The rules that apply to every score

1. **Evidence, and only this:** a project's own repository files (LICENSE, manifests, commit and release history), its live demo or
   documentation site **loaded in a real browser on the research date**, and its own documentation. Not a screenshot, not a star count or
   download count, not an article about the project, not memory. (`docs/POST-V2.md` §3 B: "non si sceglie un template dal solo screenshot o
   dal numero di stelle".)
2. **Two sampled pages per candidate**, named in the matrix **before** the criteria are scored: the page most representative of editorial
   reading, and the page carrying the most data (a table, a chart, a dashboard). For a component library, the two component pages that
   best match. **A criterion's step is the lower of the two samples** (so a candidate cannot be scored on its best page).
3. **Browser measurements are taken at 1280 px and 390 px wide, in the light and the dark colour scheme where both exist,** in headless
   Chromium, with `prefers-reduced-motion` both unset and set. The matrix records the URL, the date, the viewport and the scheme beside each
   score.
4. **Every score cites its evidence and says in one sentence why that step and not the next.** A score without the next step shown as not
   reached is not a score.
5. **A criterion that needs a live look that could not be made is not scored: the candidate is marked "not verified on <date>", with what
   could not be reached, and is not shortlisted** (§8, "PV2-01, A.5 question 3"). Nothing is completed from memory or from the plan's
   shortlist, and no total is computed for it.
6. **"Not applicable" is not a step.** A candidate with no chart is not excused from C3: it reaches the step its tables reach, and that is
   its score. (`docs/DATA-READINESS.md` §6, MC-7: a check that a declaration of "not applicable" can satisfy is a hole.)
7. **The current site is scored on the same grid, as an unselectable baseline row** (§8, "B.1 question 1"). It is a measurement of where the
   site stands, not a candidate.
8. **Kabarza is not scored** (§8, "B.1 question 2"): it has no licence to read and no code to rebuild. It is described in the gallery's
   microinteractions category.
9. **A step found undecidable on a real page is reported, not interpreted.** The session says which anchor, on which page, and what it
   could not tell; changing an anchor after this grid is approved needs a new §8 row with the author's words.

### 1.2 C1 · Fit for a legal and editorial observatory (20%)

What the site publishes is long-form argument with citations, records carrying a status and a date, timelines, and tables of records whose
fields may be unknown. The criterion asks whether the project's design already carries that, **in its demo**, as opposed to a marketing or
product-admin job. Four patterns are looked for; each counts only if seen in the live demo or in a documentation example that renders:

- **P1** long-form reading with a citation or footnote pattern;
- **P2** status labels on records (a visible state, not decoration);
- **P3** a dated list or timeline;
- **P4** a filterable table of records.

| Step | What is seen |
|---|---|
| 0 | Built for another job (a landing page, a generic admin shell); none of P1–P4 is present. |
| 1 | Exactly one of P1–P4 is present, and the page is organised around something else. |
| 2 | Two of P1–P4 are present. |
| 3 | Three or four of P1–P4 are present, **and** a state for "no data" or "not applicable" is visible somewhere in the demo. |
| 4 | All four are present **and** the demo shows a statement, its source and its status as three distinct things (provenance displayed, not only stated). |

### 1.3 C2 · Information hierarchy and readability (20%)

Measured on the sampled editorial page at 1280 px. Body text size and colour are read from the computed style; line length is the
characters per line of the body column, measured on a full line of a paragraph; contrast is computed from the computed colours, and
**text over an image or gradient other than the page background is counted as not measured, not as passing**.

| Step | What is measured |
|---|---|
| 0 | The heading outline is absent, or skips a level, **and** body text is below 14 px or the line length exceeds 100 characters. |
| 1 | A hierarchy exists but at least one of: body below 16 px; line length below 35 or above 90 characters; body contrast below 4.5 : 1. |
| 2 | Heading levels are sequential with no skip; body 16 px or larger; line length 45–90 characters; body contrast 4.5 : 1 or more. |
| 3 | Step 2, **and** a secondary level (captions, metadata, notes) distinguished by size, weight or colour with contrast of 4.5 : 1 or more, **and** a lede or summary before the detail. |
| 4 | Step 3, **and** in-page navigation for a long page (a contents list or anchors) whose links work. |

### 1.4 C3 · Quality of dashboards, tables and visualisations (20%)

Tables and charts are judged on what they let a reader do and on what they do with a missing value — the site's own rule being that an
unknown is never shown as zero (`docs/DATA-READINESS.md` §6, MC-6; not redefined here).

| Step | What is seen |
|---|---|
| 0 | No table, chart or dashboard component in the demo or its documentation. |
| 1 | Tables or charts exist only as images, or with no text alternative. |
| 2 | At least one real HTML table (header cells with scope) **or** one chart with a text alternative. |
| 3 | **Both:** a table that can be sorted or filtered from the keyboard, **and** a chart whose values can be read without a pointer (tooltips reachable by keyboard, or a data table beside it), with its series distinguishable by more than colour. |
| 4 | Step 3, **and** a missing value is shown differently from zero in at least one table or chart (a dash, "n/a", a pattern, a stated "unknown"), seen in the demo or in a documentation example that renders. |

### 1.5 C4 · Responsive, accessibility and themes (15%)

Measured in headless Chromium on the sampled pages. The browser suite of this repository (`agent/browser/`, `docs/BROWSER-QA.md`) is the
model for what is and is not established; **nothing here is a conformance claim** (no screen reader is run, and no contrast over an image
is computed).

| Step | What is measured |
|---|---|
| 0 | The page scrolls horizontally at 390 px **and** there is one theme only. |
| 1 | No horizontal scroll at 390 px; one theme; or keyboard focus is invisible on at least one of the first 15 focusable controls. |
| 2 | No horizontal scroll at 390 px **and** a visible focus indicator on each of the first 15 focusable controls; one theme. |
| 3 | Step 2, **and** a light and a dark theme (by `prefers-color-scheme` or a toggle) with body contrast of 4.5 : 1 or more in both. |
| 4 | Step 3, **and** animation is off when `prefers-reduced-motion: reduce` is set, **and** every one of the first 15 controls has an accessible name in the accessibility tree and a main landmark exists. |

### 1.6 C5 · Concrete possibility of a vanilla HTML/CSS/JS rebuild (15%)

The site's own constraint: static HTML, vanilla ES modules, JSON; no build step, no dependency, no framework, no third-party request
(`AGENTS.md`, "Architecture — do not rebuild it"). The criterion asks how far a pattern can be rebuilt under that constraint, judged from
what the project ships.

| Step | What is seen |
|---|---|
| 0 | The demo renders nothing useful without a framework runtime or a build step, and the look depends on it. |
| 1 | The pattern is visible, but its appearance comes from a CSS framework or a JS component library; a rebuild means reimplementing most of it. |
| 2 | HTML and CSS are readable as shipped and the pattern is rebuildable, but its behaviour depends on a runtime library (jQuery or similar). |
| 3 | Plain HTML and CSS; any script is vanilla ES; but the output is produced by a build step or preprocessor, and the compiled output is readable. |
| 4 | Vanilla HTML, CSS and ES modules readable as shipped; no build step, no runtime dependency, no external font or script — the same constraints as this site. |

### 1.7 C6 · Licence and maintenance documented (10%)

A licence is **read in the project's own file**, with the file named and the date, and so are the licences of its assets. "MIT", as the
plan says of some candidates, is not a verification.

| Step | What is seen |
|---|---|
| 0 | No LICENSE file, or a licence that forbids reuse or derivation. |
| 1 | A licence stated only in prose or in the README, with no LICENSE file; or an asset needed to study the pattern sits behind a paid tier. |
| 2 | A LICENSE file read; an OSI-approved permissive licence or a Creative Commons licence; the licences of fonts, icons and images not separately stated or unclear; a commit within the 12 months before the research date. |
| 3 | Step 2, **and** the licences of the assets are stated in the repository, **and** a maintainer has acted (a commit, a release or an issue reply) within the 6 months before the research date. |
| 4 | Step 3, **and** attribution obligations are written out (a NOTICE, CREDITS or README section), **and** release notes or a changelog cover the last three releases. |

## 2. Candidates and the rule for adding one

The plan's five open-source projects are researched: *PureDashboard*, *Tabler*, *GOV.UK Design System / GOV.UK Frontend*, *Simple.css*,
*HTML5 UP Editorial*. **Up to five more may be added by the session** (§8, "B.1 question 3"), each of which must be **public, carry a
LICENSE file, show a commit within the 12 months before the research date, and have a live demo or a documentation site**. The search
terms and the date are recorded in the matrix so that the selection can be repeated. An added candidate is marked "added by the session",
and **the author sees the list of candidates before any scoring starts.** *Kabarza* is not a candidate (§1.1, rule 8).

### 2.1 The list, as read on 10 Nov 2026 — **shown to the author before any scoring starts**

**How this was checked, and its limits.** `github.com` and `api.github.com` are refused (HTTP 403) in the environment this was written in, so
no repository page, issue or release page was read. What was read instead is each project's **own files**: a shallow, blob-less `git clone`
of its public repository through the session's git proxy, from which the **date of the last commit** and the **LICENSE file** were read
(`git log -1`, `git show HEAD:<file>`; nothing was installed, built or run), the repository address taken from the project's own npm
manifest (not from a search result), and each demo or documentation site requested over HTTPS. **What this cannot show:** that the last
commit is the last *maintainer action* (an issue reply or a release is not read here, so C6 step 3 may need another source), and that a
site which answered HTTP 200 shows the pattern a criterion needs (that is B.2's job). Search results were used only to find names.

| Candidate | In the list as | Repository | LICENSE file read | Last commit | Site answering on 10 Nov 2026 | Tests of §2 |
|---|---|---|---|---|---|---|
| *Tabler* | plan | `tabler/tabler` | `LICENSE`: "The MIT License (MIT)", © 2018–2026 The Tabler Authors | 2026-11-10 | `tabler.io` 200 | not required (plan) |
| *GOV.UK Design System / GOV.UK Frontend* | plan | `alphagov/govuk-frontend` | `LICENSE.txt`: "The MIT License (MIT)", © 2017 Crown Copyright (Government Digital Service) | 2026-11-10 | `design-system.service.gov.uk` 200 | not required (plan) |
| *Simple.css* | plan | `kevquirk/simple.css` | `LICENSE`: "MIT License", © 2020 Simple.css (Kev Quirk) | 2026-05-09 | `simplecss.org` 200 | not required (plan) |
| *HTML5 UP — Editorial* | plan | none: a downloadable template | `LICENSE.txt` in the download: "Creative Commons Attribution 3.0 Unported"; its `README.txt` credits jQuery, Font Awesome, Responsive Tools and Unsplash images (not included) | not applicable (no repository) | `html5up.net/editorial` 200 | not required (plan) |
| *Tufte CSS* | **added by the session** | `edwardtufte/tufte-css` | `LICENSE`: "The MIT License (MIT)", © 2014 Dave Liepmann | 2026-06-25 | `edwardtufte.github.io/tufte-css/` 200 | public ✓ · LICENSE ✓ · commit within 12 months ✓ · demo ✓ |
| *U.S. Web Design System (USWDS)* | **added by the session** | `uswds/uswds` | `LICENSE.md`, which opens "A few parts of this project are not in the public domain" and then names parts under other licences; **to be read in full in B.2, C6 depends on it** | 2026-10-09 | `designsystem.digital.gov` 200 | public ✓ · LICENSE ✓ · commit within 12 months ✓ · demo ✓ |

**Found, and not in the list:**

- *PureDashboard* (the plan's first candidate) — **not located.** Two web searches under the name returned no project of that name, and no
  repository address for it is known to this session; none is guessed. It stays in the matrix as "not verified on 10 Nov 2026: the name
  resolves to no project I could find", and is not scored, unless the author gives its address. Search results offered other projects
  (*pure-admin*, *dashio-template*, *data-dashboard*): they are **not substituted for it**, because a substitute for a named candidate would
  be a different project under the plan's name.
- *Charts.css* (CSS-only charts built from HTML tables; MIT, `LICENSE` read) — **fails the added-candidate rule:** its last commit is
  2025-07-21, about 16 months before the research date, not within 12. Not added. It is named here because it fits C3 and C5 well and
  the author may want it anyway; that would be a decision, recorded in §8.
- *Observable Framework* (`observablehq/framework`; ISC, `LICENSE` read; last commit 2026-05-15) — **not admitted today:** the fourth test, a live
  demo or documentation site, is not verified: `observablehq.com/framework/` answered HTTP 429 (rate-limited) on two requests by two routes.
  It is a build-step tool, so C5 would score it low; it is a reference for data-app layout. It may be admitted when the site answers.

**Slots.** Two of the five added places are used (*Tufte CSS*, *USWDS*), one candidate is pending (*Observable Framework*), and one was refused
by the rule (*Charts.css*).

**Search log** (10 Nov 2026, web search, standard mode; results are leads and not evidence):

1. `PureDashboard vanilla JavaScript dashboard no build step GitHub`
2. `"PureDashboard" github MIT license HTML ES modules dashboard`
3. `open source CSS-only charts built from HTML tables accessible MIT license` → Charts.css
4. `open source CSS for long-form editorial articles with sidenotes footnotes citations` → Tufte CSS
5. `open source design system government data tables status tags timeline accessible open licence` → USWDS
6. `open source observatory data journalism template static site dashboard filterable tables no framework` → Observable Framework

## 3. What the grid cannot do

- **It scores what a demo shows on one day.** A demo changes, a repository gains a commit; every score carries its date and is a reading,
  not a property of the project.
- **It does not establish accessibility.** C4 is a handful of measurements in one browser; README limitation 7 stands for it as for the
  rest of the site.
- **It does not judge fit with the site's argument.** C1 asks whether a pattern for records, status and sources exists; it cannot say
  whether the pattern would carry this site's claims or its three states (reached, not reached, unknown) well. That is C's to try, on the
  site's own content.
- **A high total is not a recommendation to adopt.** The projects serve to study patterns; the direction is the author's, after C
  (`docs/POST-V2.md` §5).
- **It was not tested on a real candidate.** The grid is approved before any research by the author's decision, so its anchors have
  only been checked for being decidable *in principle*; rule 9 says what happens when one is not.

## 3b. The sampled pages, named on 10 Nov 2026 **before any criterion was scored** (§1.1, rule 2)

Every URL below answered HTTP 200 on 10 Nov 2026. **E** is the page taken to be the most representative of editorial reading, **D** the one
carrying the most data. The current site is the baseline and is served locally from `main` (`b705f15`) for measurement.

| Candidate | E (editorial) | D (data) |
|---|---|---|
| *Tabler* | `https://tabler.io/docs` | `https://preview.tabler.io/` (the dashboard demo) |
| *GOV.UK Design System* | `https://design-system.service.gov.uk/get-started/` | `https://design-system.service.gov.uk/components/table/` |
| *Simple.css* | `https://simplecss.org/` | `https://simplecss.org/demo` |
| *HTML5 UP — Editorial* | `https://html5up.net/uploads/demos/editorial/` | `https://html5up.net/uploads/demos/editorial/elements.html` |
| *Tufte CSS* | `https://edwardtufte.github.io/tufte-css/` — the body text | the **same page**, its tables and figures |
| *USWDS* | `https://designsystem.digital.gov/design-principles/` | `https://designsystem.digital.gov/components/table/` |
| Baseline: this site | `/index.html` (the brief) | `/enforcement.html` |

*Tufte CSS*'s demonstration is a single page, so its two samples are two regions of it. That is a reading of rule 2 for a one-page demo,
not a change to it, and the matrix says so where it matters.

## 4. How the measurements were made, and where the method changed

All measurements are from headless Chromium (Playwright) on 10 Nov 2026, against the live pages of §3b, with scripts in the session's
scratchpad, **outside the repository and not committed**. Nothing of a third party was installed, built or run; screenshots were taken
for the session's own review and are not committed.

- **M1 · Body text** is the font-size tier carrying the most characters among the visible `p` elements of 60 characters or more; the cpl and
  contrast are read on the longest paragraph of that tier. Where a page has no such paragraph, the computed font size of `body` stands in.
  **This changed twice before any score was written.** The first version took the longest paragraph, which on the baseline was a small-print
  note; the second took the tier with the most text, which on the baseline was the numbered reference list (about 96,000 characters at
  12.5 px, against the argument at 17 px). Both gave the baseline a body size the reader does not read. The third, above, is applied to every
  candidate alike.
- **M2 · Contrast** is computed from the computed text colour over the nearest opaque ancestor background. A gradient or image **on `<body>`**
  is the page background and is measured (the baseline has one, at 9% opacity); text over an image or gradient on any other element is
  counted as not measured.
- **M3 · Focus** is the first 15 Tab stops from the top of the page, a stop counting as visible if its outline, shadow or any of its colours
  differ from the blurred state. A stop inside a cross-origin iframe cannot be measured.
- **M4 · Accessible names** are read from the accessibility tree (`ariaSnapshot`) for the first 15 interactive nodes.
- **M5 · A theme** exists where `prefers-color-scheme: dark` changes the page background, or a toggle for it is present.
- **M6 · Reduced motion** is the number of running animations with the preference unset and set; a page that animates nothing in either state
  satisfies "animation is off" trivially, and **transitions on hover or focus are not measured**.
- **M7 · Evidence for C1 and C3** is read across **both samples and the component or example pages of the same site** that a design system
  documents (§1.2, "in a documentation example that renders"); GOV.UK serves each example as its own page, which was read directly.
- **M8 · Steps are cumulative**, as the grid's anchors say ("Step 3, and …"): a page that has step 4's feature but not step 3's is at step 2.

## 5. The matrix

**Steps (0–4) per criterion and the total out of 100.** `*` marks a score that rests on an anchor gap or an unmeasurable item (§6); its
note is in the candidate's evidence below. *Not scored:* *PureDashboard* (not located, §2.1), *Charts.css* (refused, §2.1), *Observable
Framework* (not admitted, §2.1), *Kabarza* (§1.1 rule 8).

| Candidate | C1 fit 20% | C2 hierarchy 20% | C3 data 20% | C4 resp./a11y/themes 15% | C5 rebuild 15% | C6 licence 10% | **Total** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---:|
| *Simple.css* | 1 | 2 | 2 | 3 | 4 | 2 | **56.25** |
| *USWDS* | 1 | 2 | 3 | 2 | 2 | 3 | **52.50** |
| *Tufte CSS* | 1 | 2 | 1 | 3\* | 4 | 2 | **51.25** |
| *GOV.UK Design System* | 1 | 2 | 2 | 2 | 3 | 2 | **48.75** |
| *Tabler* | 1 | 2 | 2 | 0\* | 1 | 2 | **33.75\*** (37.50 if C4 reached step 1) |
| *HTML5 UP — Editorial* | 0 | 1 | 2 | 2 | 2 | 0\* | **30.00\*** (35.00 if C6 reached step 2) |
| Baseline: this site (unselectable) | not scored | 4 | not scored | 4 | 4 | not scored | **50 of the 50 available** on the three measured |

**The totals do not rank the candidates for this site's job, and they are not a recommendation.** No candidate exceeds step 1 on C1, the
criterion the plan weights first; the order above is largely C4 and C5 (rebuildability and responsiveness, 30% together), which a minimal
stylesheet reaches and a richer system does not (§6, G7). Read the steps, not the order.

### 5.1 The evidence behind each score

Each line gives the evidence, and **why the next step was not reached**. Dates are 10 Nov 2026 unless stated.

**Simple.css** (`simplecss.org`, `/demo`; `kevquirk/simple.css`)
- **C1 = 1.** P1 in its weakest form: the demo has one `blockquote` with a `cite`; P2, P3, P4 absent (two tables, no filter, no sort). Step 2 needs two patterns.
- **C2 = 2** (E: `/`). 18.4 px body, 74 characters per line, contrast 16.1:1 (11.74:1 dark), 5 headings with no skip. Not 3: the first paragraph after the `h1` is the same size as the body, no secondary level distinct from it, no in-page navigation.
- **C3 = 2.** The demo has 2 real tables with header cells (no `scope` attribute; read as header cells, §6 G3), one with 7 columns; no sorting, no filter, no chart. Not 3: needs both a keyboard-sortable table and a chart.
- **C4 = 3.** No horizontal scroll at 390 px; the first 14 and 15 Tab stops on the two pages show a focus indicator; light and dark by `prefers-color-scheme`, both above 4.5:1. Not 4: 4 of the first 15 controls on the demo page have no accessible name.
- **C5 = 4.** `simple.css` has no `@font-face`, `@import` or `url()`; `package.json` has no dependencies and no build script; the pages run no script. The demo loads the stylesheet from the project's own CDN host.
- **C6 = 2.** `LICENSE` read: MIT. Last commit 2026-05-09, which is 185 days before the research date, **one day outside** the 6 months step 3 asks for (the window opens 2026-05-10). No changelog.

**USWDS** (`designsystem.digital.gov`, `/design-principles/`, `/components/table/`; `uswds/uswds`)
- **C1 = 1.** P2 present: tag examples ("Info", "Big"). P3 absent (the step indicator and the process list are sequences, not dated); P4 absent (a sortable table, but nothing that filters one; the search component is a site search); P1 absent.
- **C2 = 2** (E: `/design-principles/`). 18.08 px, 72 cpl, 20.47:1, 38 headings, no increment above one (the first visible heading at 1280 px is an `h4`). An "On this page" list of 27 working anchors is present, which is step 4's feature; **step 3's is not** (no lede or distinct secondary level found), so by M8 it is 2.
- **C3 = 3.** The table page has 18 tables with `scope` headers and 15 captions, and sortable rows (header buttons). The data-visualisation page renders **two charts, each with a captioned screen-reader data table**. *Not examined:* whether the series are distinguishable by more than colour. Not 4: no missing value shown differently from zero.
- **C4 = 2.** No horizontal scroll; focus indicator on 15 of 15; no unnamed control; a main landmark; **one theme** (no dark scheme, no toggle).
- **C5 = 2.** `package.json` lists `lit` among its dependencies (web components; **whether the classic components use it was not established**) and builds with gulp and Vite. Scored on the dependency as listed. Not 3.
- **C6 = 3.** `LICENSE.md` read: it opens "A few parts of this project are not in the public domain" and then names, **by path**, the files under the SIL Open Font License 1.1, the Apache 2.0 License, MIT and CC0. Last commit 2026-10-09; release 3.14.0 published 2026-08-18. Not 4: release notes for the last three releases were not read.

**Tufte CSS** (`edwardtufte.github.io/tufte-css/`; `edwardtufte/tufte-css`)
- **C1 = 1.** P1 present, in full: 10 sidenote, margin-note or footnote elements, 3 `cite`, 4 `blockquote`. P2, P3, P4 absent.
- **C2 = 2.** 21 px, 84 cpl, 18.8:1 (13.44:1 dark), 11 headings with no skip; 10 secondary elements. Not 3: no distinguished lede; no in-page navigation.
- **C3 = 1.** No table on the page. Its 5 figures are **raster images with a one-line `alt`** (for example "Exports and Imports to and from Denmark & Norway from 1700 to 1780"): a description of the chart, not its values. Read as "only as images" (step 1), not as "a chart with a text alternative" (step 2), because the values cannot be read (G3).
- **C4 = 3\*.** No horizontal scroll; light and dark by `prefers-color-scheme`, both above 4.5:1; the first 12 Tab stops are links with a visible outline. **The next 3 are inside a YouTube embed**, whose focus indicator this method cannot see (G6). Not 4: no `<main>` landmark.
- **C5 = 4.** `tufte.css` is the readable source (the `build` script only minifies it); its fonts are in `et-book/`; no script, no external request from the stylesheet. The demo page embeds a third-party video, which is content, not the stylesheet.
- **C6 = 2.** `LICENSE` read: MIT, © 2014 Dave Liepmann. Last commit 2026-06-25. The licence of the ET Book font files is **not stated in the repository** (no licence file in `et-book/`; the README credits the font's author). No changelog.

**GOV.UK Design System** (`design-system.service.gov.uk`, `/get-started/`, `/components/table/`; `alphagov/govuk-frontend`)
- **C1 = 1.** P2 present: the tag example renders one `govuk-tag`. P1, P3, P4 absent (the table has scoped headers and a caption, no filter or sort; the dated tables on component pages are the system's own change log, not a pattern it offers).
- **C2 = 2** (E: `/get-started/`). 19 px, 73 cpl, 19.59:1, 8 headings with no skip (the first is an `h2`). Not 3: no lede or distinct secondary level found, and no in-page list.
- **C3 = 2.** One table with 5 scoped headers and a caption; no sortable header; no chart on the pages read. Not 3.
- **C4 = 2.** No horizontal scroll; focus indicator on 15 of 15; every control named; a main landmark; **one theme**.
- **C5 = 3.** `govuk-frontend` has no dependencies and builds with a Sass and script pipeline; the compiled output is readable; the pages request nothing external. Not 4: a build step produces the shipped files.
- **C6 = 2.** `LICENSE.txt` read: MIT, © 2017 Crown Copyright (Government Digital Service). Last commit 2026-11-10; `CHANGELOG.md` lists v6.6.0, v6.5.1, v6.5.0. The licences of assets were **not stated in the files read**. Not 3.

**Tabler** (`tabler.io/docs`, `preview.tabler.io`; `tabler/tabler`)
- **C1 = 1.** P3 present: the preview's table "User | Commit | Date" carries dated rows ("28 Nov 2025"). P1 absent; P2 absent (its labels are metric names, not record states); P4 absent (no sort, no filter).
- **C2 = 2** (E: `/docs`). 16 px, 88 cpl, 10.37:1, one heading. **The sample is weak:** a docs landing page with 4 paragraphs and 414 characters; the page's base font is 14 px. Not 3: no lede, no secondary level.
- **C3 = 2.** 5 tables (4 with header cells), and **8 large SVG charts of which 5 carry a role, label or title**. Not 3: no sortable or filterable table, and no data table beside the charts.
- **C4 = 0\*.** On the data sample the page **scrolls horizontally at 390 px while offering two themes**, which fits neither step 0 (overflow *and* one theme) nor step 1 (no overflow): an anchor gap (G4), scored at the floor. The editorial sample alone would reach step 4 (both themes, 15 of 15 focus, every control named, a main landmark, animation off under reduced motion).
- **C5 = 1.** Ships compiled `tabler*.css` (a CSS framework), runtime JavaScript with `@popperjs/core` as a dependency, and an `ApexCharts` global for charts; built with `build` and `build:assets`. The docs site also loads analytics-style scripts (autocapture, surveys); not part of the pattern.
- **C6 = 2.** `LICENSE` read: MIT, © 2018–2026 The Tabler Authors. Last commit 2026-11-10; release 1.7.4 published 2026-11-08; `core/CHANGELOG.md` lists 1.7.4, 1.7.3, 1.7.2, 1.7.1. The licences of the flags, payment logos and icons the package ships were **not read in the repository**. Not 3.

**HTML5 UP — Editorial** (`html5up.net/uploads/demos/editorial/`; the download, no repository)
- **C1 = 0.** None of P1–P4 seen: the elements page has a `blockquote` and a superscript as typography samples, not a citation pattern; the only labelled item is a social link; no timeline; two tables without sort or filter. The clause "built for another job" was **not applied**: the template is a magazine layout (G2).
- **C2 = 1.** 13.33 px body (78% of paragraph text), contrast **3.61:1**, 80 cpl. Not 2: body below 16 px and contrast below 4.5:1.
- **C3 = 2.** Two tables with header cells on the elements page; no sort, filter or chart.
- **C4 = 2.** No horizontal scroll; focus indicator on 15 of 15; **one theme**; no `<main>` landmark, and 4 of the first 15 controls on the editorial page have no accessible name.
- **C5 = 2.** HTML and CSS readable; behaviour needs **jQuery** (`jquery.min.js`), plus `browser.min.js`, `breakpoints.min.js` and a Font Awesome icon font; the README credits them. The demo page also loads a Cloudflare analytics script (the demo's host, not the template).
- **C6 = 0\*.** `LICENSE.txt` in the download read: Creative Commons Attribution 3.0 Unported; the `README.txt` names jQuery, Font Awesome, Responsive Tools and Unsplash images (not included). **There is no repository**, so no commit, release or issue can be read: step 2 cannot be reached or refused (G5). Scored at the floor.

**Baseline: this site** (`/index.html`, `/enforcement.html`, served from `main` `b705f15`) — **measured on three criteria only**; C1, C3 and C6 are not scored because the evidence for them on the author's own site was not gathered by this method.
- **C2 = 4** (E). 17 px (62% of paragraph text), 88 cpl, 12.75:1 over a page background with a faint gradient on `<body>`, 77 headings with no skip, a standfirst before the detail, and 13 working anchors in the part navigation.
- **C4 = 4.** No horizontal scroll on either sample; focus indicator on 15 of 15; every control named; a main landmark; light and dark (597 of colour distance between the two page backgrounds, and a day or night toggle); 12.75:1 light and 13.78:1 dark; no animation running with the preference unset or set, and 11 reduced-motion rules.
- **C5 = 4.** No external host, no framework global, local scripts and stylesheets only.
- *An observation outside the grid, since C2 is measured on the editorial page:* on the data page `/enforcement.html` the paragraph tier is **12.5 px at about 150 characters per line** (the contrast is 5.54:1), and the long reference list on `/index.html` is also set at 12.5 px. Measured by M1; the author may want to look at it.

## 6. What the grid did when it was tried on real candidates (for the author's decision; **nothing here is applied**)

Rule 9 says an anchor found undecidable on a real page is reported and not interpreted, and that changing one needs a new §8 row. These are the seven the application found. The readings used so far are stated, so that the scores above can be re-derived under another.

- **G1 · Rule 2 ("the lower of the two samples") conflicts with the grid's own text and cannot apply to two criteria.** §1.3 says C2 is "measured on the sampled editorial page", and C1 and C3 find their evidence on one of the two pages (a citation pattern on the editorial page, a table on the data page), so "the lower" would score every candidate 0 on them. *Applied:* C2 on E; C1 and C3 across both samples and the documented examples (M7); C4 and C5 the lower of the two. *Proposed:* write that into rule 2.
- **G2 · C1 steps 0 and 1 each carry a second clause ("built for another job"; "organised around something else").** A template built for editorial reading with no pattern (HTML5 UP) and an editorial stylesheet with exactly one (Tufte) fit neither clause. *Applied:* the number of patterns decides; the clause is ignored. *Proposed:* drop the second clauses.
- **G3 · C3 step 3 needs both a table and a chart.** A system with an excellent table and no chart tops at step 2 (GOV.UK); USWDS reached 3 only because its guidance renders two charts with data tables. Two clauses are also ambiguous: the plan's "header cells with scope" was read as header cells, since no candidate's simple tables use the `scope` attribute apart from GOV.UK and USWDS; and an image with an `alt` meets both step 1 ("only as images") and step 2 ("a chart with a text alternative"), so it was read as step 1 unless the alternative gives the values (Tufte). *Proposed:* let step 3 be met by a table alone *or* a chart alone, each with the keyboard and no-pointer conditions, and say what "with scope" means.
- **G4 · C4 has no step for "scrolls sideways at 390 px but has two themes".** Step 0 needs overflow *and* one theme; step 1 needs no overflow. *Applied:* the floor, 0 (Tabler). *Proposed:* step 0 is "scrolls horizontally at 390 px".
- **G5 · C6 has no step for a licensed template with no repository** (HTML5 UP): step 2 needs "a commit within the 12 months". *Applied:* the floor, 0. *Proposed:* say what stands in for a commit where there is no repository, or that such a candidate is not scored on maintenance.
- **G6 · C4's "first 15 controls" meets controls inside a cross-origin embed** (Tufte's YouTube video): their focus indicator cannot be seen. *Applied:* scored on the 12 measurable stops, flagged. *Proposed:* exclude embeds from the 15, or say they fail.
- **G7 · The totals reward rebuildability and responsiveness over fit.** C4 and C5 (30%) are reachable by a minimal stylesheet; C1 and C3 (40%) are not reachable by any candidate above step 1 and 3. *Not a change to propose, a reading to take:* use the steps and the evidence, not the order of the totals.

*Method limits that are not anchors.* M5 and M6: a page with no animation satisfies C4's step 4 trivially, and hover or focus transitions are not measured. M7 extends C1 and C3 to a design system's documented examples, which favours systems that document examples over templates that ship one page.

## 7. The gallery (B.3), in words

Each entry is what was seen on 10 Nov 2026 at 1280 px, light scheme, from the URL given; **nothing is drawn and no image of a third party is
kept in the repository**. A category with no candidate says so.

| Category | What was seen |
|---|---|
| **Editorial homepage** | *Tufte CSS*, `edwardtufte.github.io/tufte-css/`: a single text column about 620 px wide on a cream page; a large serif title and an italic author line; no navigation chrome; the right side empty at the top (the sidenotes sit in that margin further down). *HTML5 UP — Editorial*, `html5up.net/uploads/demos/editorial/`: an image-led magazine layout, a small header with the site name and social icons, a thick coloured rule, a hero headline beside a large photograph, a menu toggle in the top corner, 13 px grey body text. *Baseline (for comparison)*: a tall masthead title, a standfirst, a one-line status strip with counts and the next date, then a diagram of the parts and a left rail of part numerals. |
| **Reference or tool page** | *USWDS*, `designsystem.digital.gov/components/table/`: a section label, the page title, a one-line description and a "Passed WCAG 2.1 AA" badge; a left list of components; a right "On this page" list of nine anchors; each variant under its own heading. *GOV.UK*, `design-system.service.gov.uk/components/table/`: a cookie notice above a blue header with a search field; a primary navigation of six items, breadcrumbs, a left list of components; the live example in a frame with an "Open this example in a new tab" link. |
| **Dashboard** | *Tabler*, `preview.tabler.io`: a grid of cards, each an upper-case label, a large value and a coloured change with an arrow; sparklines, mini bar charts and a gauge; a promotional banner across the top, a stock illustration and a person's photograph (not ours, and not part of the pattern). |
| **Timeline** | **No candidate shows a timeline pattern.** The nearest is *Tabler*'s table "User | Commit | Date" with dated rows; *USWDS*'s step indicator and process list are sequences with no dates. |
| **Comparative table** | *USWDS*, the table page: standard, striped, borderless, scrollable, responsive stacked, sortable rows and sticky headers, as its own list names them. *GOV.UK*: a captioned table, "Dates and amounts", with a header row and amounts per week. *Simple.css*, `/demo`: a short two-column table and a seven-column one that is wider than its column. |
| **Article or blog** | *Tufte CSS*: sidenotes and margin notes, `cite`, `blockquote`, full-width figures. *Simple.css*, `/demo`: a showcase page with a boxed introduction, plain headings and a code block under each element. |
| **Navigation** | *USWDS*: a dark top bar with a search field and two buttons, a primary navigation of seven items, a left side navigation and a right "On this page" list. *GOV.UK*: the blue header, six-item navigation and breadcrumbs above. *Baseline*: a left rail of part numerals, a Contents button, a language switch, a day or night toggle, a glossary and a search with a keyboard shortcut. |
| **Microinteractions** | **Not described.** *Kabarza* is a visual reference only (§1.1, rule 8), and the only result found was a showcase listing for an animated rebuild of its site: its own live address is not known to this session, no page of it was opened, and nothing is said about its timing. Measured instead (M6): under the preference unset, only *Tabler* ran animations on load (two), and they stop when reduced motion is set; **no other sample animated anything**, and hover and focus transitions were not measured. |

**What none of the six candidates shows**, and which the site needs: a missing value shown differently from zero (C3 step 4, reached by none);
a statement, its source and its status shown as three things (C1 step 4, reached by none); the site's three states (reached, not reached,
unknown); a timeline of dated legal events. These are to be designed on the site's own content, in C, not found in a reference.

## 8. The shortlist and three directions (B.3), described and not drawn

### 8.1 The shortlist — **a proposal; the grid defines no threshold, so the author decides it**

Proposed: **Simple.css, USWDS, Tufte CSS and GOV.UK Design System** — the four highest totals, none resting on a floor-scored anchor gap, all
verified live with licence read. Proposed out: *Tabler* (a CSS framework with a runtime dependency, C1 at 1, C4 at the floor on an anchor gap;
kept in the gallery for the card anatomy of its dashboard only) and *HTML5 UP — Editorial* (contrast 3.61:1, a jQuery dependency, no repository,
C1 at 0). *PureDashboard* is not shortlisted (not verified); *Observable Framework* is not admitted.

### 8.2 The three directions (`docs/POST-V2.md` §3 C)

Each says what it takes, from where, and **what cannot be rebuilt on the site's rules without a dependency** (static HTML, vanilla ES modules,
no remote font, no third-party request). None is a layout, a mock-up or a choice; the direction is the author's, after C.

**1 · Editorial.** One reading column of 65–85 characters at 17–21 px; notes in the margin on a wide screen and inline on a narrow one
(*Tufte CSS*); headings strictly sequential; an "On this page" list for long parts (*USWDS*); a status tag only where a record has a state
(*GOV.UK*'s tag); and a stylesheet small enough to read in an evening (*Simple.css*, no `@font-face`, no dependency, no build). *Cannot be
rebuilt without a dependency:* nothing in these patterns. **One open item:** Tufte CSS's fonts are local files whose licence the repository does not
state (§5.1, C6), so a typeface would have to be chosen and its licence read before any reuse.

**2 · Policy observatory.** Data in front: a left section list and a right in-page list (*USWDS*); tables with sortable headers, sticky headers and
a stacked layout at narrow widths (*USWDS*'s named variants), each with a caption (*GOV.UK*); every chart paired with its data table
(*USWDS*'s data-visualisation guidance); cards that carry a label, a value and a change (*Tabler*'s anatomy only, rebuilt). *Cannot be rebuilt without a
dependency:* *Tabler*'s chart rendering (an `ApexCharts` library) and its framework CSS — the site would draw its own SVG with the table beside it.
**Open items:** *USWDS* and *GOV.UK* offer **no dark theme**, so the site's day and night modes have no reference here; and the display of an unknown value
distinct from zero is in no candidate.

**3 · Hybrid.** The editorial opening and the article pages in direction 1's column; the tool pages (applicability, enforcement, the instruments)
in direction 2's table-first layout; one set of colour and type tokens for both schemes; the in-page list and the tag from the design systems;
and *Simple.css*'s discipline (one readable stylesheet) as the constraint for the whole. *Cannot be rebuilt without a dependency:* the same as 1 and 2.

## 9. Addendum (10 Nov 2026): visual references, **unscored**

The author saw the six scored candidates and judged them "tutti bruttini" (§8, "PV2-02 addendum"). The grid has no aesthetic criterion, so nothing
here is scored and nothing changes in §1–§8. These are **visual references only**, on the footing of Kabarza (§1.1, rule 8): described in words
from a page opened on 10 Nov 2026 at 1280 px in the light scheme, with the URL; **nothing is copied** (no code, asset, image, font or animation),
and **no licence was read, because nothing is to be reused** — they say what a strong look *is*, not what may be taken. Screenshots were kept in
the scratchpad, shown to the author in the session, and are not in the repository. Cookie notices were dismissed by choosing the refusal where
one was offered. Search results were used only to find names.

| Reference | What was seen | What it is useful as evidence of |
|---|---|---|
| *Our World in Data* — `ourworldindata.org`, and a chart page `ourworldindata.org/grapher/life-expectancy` | Home: a deep-navy band with a gold serif headline, a wide search field, rounded topic chips, then a grid of cards that mix a chart thumbnail, an update note and a newsletter box. Chart page: the serif title and a one-line definition above the chart; tabs **Table · Map · Line · Bar** on the same data; a right-hand list of countries with checkboxes, current values and a sort control; a play control under a year slider; a source line with "CC BY", and Download, Share and full-screen buttons. | A serious, data-first identity with an authoritative serif; **a table tab beside the chart** (values readable without a pointer, the thing C3 step 3 asks for); the source and the licence under every figure. |
| *Open Future — Policy Observatory* — `openfuture.eu/observatory/ai-continent-action-plan/` | A yellow navigation bar, a black wide geometric display face for headings and a text face for reading, an isometric illustration. Each tracked file has a page with **Status: In development** and **Type: Strategy**, an RSS link, a short text, and a **Timeline** of dated developments (the first entry "November 3, 2026"). | The only reference found with **a timeline of dated policy events and a record's status and type shown as labelled facts** — the content of this site, in a strong visual identity. Heavy in colour and display type. |
| *AI Act Explorer* — `artificialintelligenceact.eu/article/5/` | A white page with a left tree of chapters ("Chapter II, Art. 5, Prohibited AI Practices"), a breadcrumb, the article text with numbered paragraphs and lettered sub-points, **defined terms dotted-underlined**, a line "Comes into force 2 February 2025, according to Article 113(a)", and "Related recitals" as small numbered chips. A cookie control, a feedback card and an "Ask about the EU AI Act" box overlay the page. | The nearest thing to *this site's job* — **reading a legal text with navigation, definitions, dates and cross-references**. Visually plain, not strong; useful for structure, not for look. |
| *Economics Observatory* — `economicsobservatory.com` | A centred wordmark, a large feature card with a photograph and a coloured edge, smaller cards whose left edge and topic label carry a colour per subject, a teal "Data Hub" tile with Explore, Create and Share, and a chart card with a title and a two-series legend. | A friendly, colour-coded editorial layout with charts inside the card grid; photography-led, which the site does not use. |
| *The Pudding* — `pudding.cool` | A white page with a hand-lettered wordmark, sticker-like buttons, and a grid of tall cards each on a flat saturated colour (red, ochre, magenta) with a bold display title and a one-line description, numbered and dated. | **A confident, unmistakable identity and an authored feel.** The tone (playful) does not fit a legal brief; kept as evidence that a distinct look is possible, not as a direction. |

**Looked at and not kept:** *OECD.AI Policy Observatory* (`oecd.ai`: a dark band and stock photography, a corporate look) and *DSA Observatory*
(`dsa-observatory.eu`: a stock-photo hero and a dated layout) — neither is strong. *Reuters Graphics* (`reuters.com/graphics/`) returned a blank
page in this browser and was **not seen**; it is neither kept nor judged.

**The author's choice (§8, "PV2-02 addendum: the author's visual preferences", 10 Nov 2026):** *Open Future (osservatorio)* and *Economics Observatory / The
Pudding* — as visual references only. *Our World in Data* and *AI Act Explorer* were not chosen; they stay described here.

**What this adds to §7.** The "Timeline" row of the gallery (§7: "no candidate shows a timeline pattern") has a reference *outside* the six: the Open
Future observatory page above. **What none of these shows either:** a missing value shown differently from zero, and a statement, its source and its
status as three things (the OWID source line comes nearest); those are still to be designed on the site's own content, in C.

---

*B.4, the prompt of PV2-03, is the last item; the final checkpoint approves the work and that prompt together.*
