# FRONTEND REFERENCES — Post-v2 block B (PV2-02)

**Status:** B.1 **approved** (§8, "Checkpoint B.1 of PV2-02 approved", 10 Nov 2026): the scoring grid. The candidate list (§2.1) is written and
is shown to the author before any scoring starts. B.2 (the research and the matrix), B.3 (the gallery, the shortlist and three directions) and B.4 (the
prompt of PV2-03) do not exist yet.
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

---

*B.2, B.3 and B.4 follow the author's approval of this grid.*
