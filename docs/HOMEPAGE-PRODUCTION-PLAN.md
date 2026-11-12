# HOMEPAGE PRODUCTION PLAN

**A proposal.** It is approved only by the row of `docs/ROADMAP-v2.md` §8 that cites it; until then it changes nothing and
authorizes nothing. Written by HP-03 on 12 Nov 2026 (prompt `docs/prompts/v2-hp-03-homepage-production-plan.md`), on branch
`claude/quirky-goldberg-fpoxdz`, from `main` `02f9a4e`. **Every number below was read from that tree on that day**; the
implementing session reads them again before it relies on one.

**What it plans:** how `prototypes/homepage/` (HP-01, HP-02, HP-02b; its `README.md` is the record of what it is and what was
measured) would become part of the published homepage. **What it is not:** an implementation. No file of the published site
or of its gates was changed to write it.

**Decisions it rests on, all in §8, none restated here as a fact of its own:** the direction and the opening ("HP-01: …"); the
author's raster serpent, framed as drawn ("HP-02: C.1 approved"); the rings in `--paper-faint`, *Digital Networks Act* left as it
is, the opening's timing accepted at 6 × and to be revisited on a real phone ("HP-02: the measures"); the figure English in the
editions, declared ("HP-02: the languages"); the layers kept in the prototype at 8 units ("HP-02b: …"); and HP-03's own rows —
the scope, "HP-03: C.1 approved" and the answers to §7.

---

## 0 · Status, baseline and what this plan does not establish

**Baseline on `main` `02f9a4e`, 12 Nov 2026** (run in this session): `validate` 0 errors · 5 warnings; `i18n-audit` 0 · 0;
`design-qa` 0 · 0; `freshness` exit 0 (3 staleness prompts); `evidence-audit` 0 errors · 11 warnings; `seo-audit` 0 · 0;
`tools/selftest.mjs` 189 / 189; the browser suite: see `docs/HANDOVER.md`, HP-03's entry. Each step of §8 is held to this
baseline: **a new warning is a finding**.

**The sizes the plan moves** (bytes, `wc -c`): `prototypes/homepage/homepage.js` 40 306 (683 lines), `homepage.css` 9 999
(156 lines), `index.html` of the prototype 4 012; `assets/serpent-mark.png` 113 740, `serpent-body-day.png` 90 439,
`serpent-body-night.png` 186 930 (the three images a reader would download: **391 109**), `serpent-beads.json` 1 881,
`serpent-original.png` 127 482, `derive-serpent.py` 8 147. The published `index.html` is 179 277 bytes (457 lines),
`it/index.html` 200 692.

**Not established by this plan:** that the figure works on a real phone (§6 is the step that would say); that a screen reader
reads it well (§5); that any setting outside the tree is in place (`docs/DEPLOYMENT.md` §3a — every one of them is the author's
word, and this plan treats each as a question, never as a fact); that the opening is liked by readers; anything about EU law —
the figure draws records that already exist and adds none.

---

## 1 · What changes, file by file

**The rule of C.1, decision (2):** the figure **enhances** the published tree and does not replace its markup. `#portalTree`
(`index.html:141`, one line of 9 208 bytes), its caption (`index.html:143`, keys `portal.p2`, `portal.span2`) and the button
"Open the contents" (`index.html:144`) stay **byte for byte**. A reader without JavaScript, a crawler, `tools/seo-audit.mjs`,
`tools/editions.mjs`, `tools/i18n-audit.mjs` and the search palette see exactly today's page.

| File | Change | From where |
|---|---|---|
| `js/home-figure.js` (new) | The figure: drawing, opening, two lenses, the list, hover/focus captions, keyboard, `settleLabels()`. Exports `initHomeFigure(ix)`. | `prototypes/homepage/homepage.js`, with the removals and changes listed below |
| `js/home-serpent.js` (new) | One exported constant: the 22 beads' geometry, `hole_centre`, `hole_radius`, `size`. **Generated**, not typed: `derive-serpent.py` gains an output that writes it (see "the images"). | `assets/serpent-beads.json` |
| `css/home.css` (new) | The figure's styles and the portal's new layout, **in the site's tokens only** (no literal colour: `grep` of `homepage.css` for `#hex` and `rgb(` finds none today). | `prototypes/homepage/homepage.css`, lines 39–156 less the prototype chrome |
| `img/home/serpent-mark.png`, `serpent-body-day.png`, `serpent-body-night.png` (new) | The three derived images, byte-identical to the prototype's. | `prototypes/homepage/assets/` |
| `js/masthead.js` | One small export, so the figure and the ticker cannot disagree about "the next dated event" (§2). The masthead's output must be unchanged. | — |
| `js/main.js` | One import and one call: `initHomeFigure(ix)` after `initMasthead()` (`js/main.js:59`), guarded like its neighbours (`try … catch`, `console.error('[home] failed')`). | — |
| `index.html` | **Two additions, no edit:** `<link href="css/home.css" rel="stylesheet"/>` after `css/tools.css` (`index.html:46`), and an empty mount `<div class="home-stage" data-mount="home-figure" hidden></div>` inside `.portal-inner` after `.portal-figure` (`index.html:146`). The lens buttons, the legend heading, the list's `<summary>` and the figure's description are **built by the module**, not written in the markup (§3 says why). | — |
| `it/index.html`, `fr/index.html`, `es/index.html` | Regenerated by `node tools/_footer.mjs`, never edited: the two additions, one directory down (`../css/home.css`). | `index.html` |

**What does not ship.** From `homepage.js`: `initTheme()` and the prototype's Day/Night button (lines 115–131: the site's own
toggle, `app.js:245`, owns the theme); `initNav()` (133–144: `js/shell.js` renders the chrome); `readBrief()` and the import of
`prototypes/editorial/brief.js` (line 29, used at 235 and 249–252: **the dependency that cannot stay** — in production the
figure is *on* `index.html` and reads `#portalTree` and the part sections from its own `document`, with no fetch); the fetch of
`serpent-beads.json` (236–238, a second fetch outside `js/data.js`); the title and standfirst copy (249–252: the published
masthead stays where it is); the Replay button (655) and `?intro=1` (652: a fresh visit, or a private window, plays the opening
for a measurement); **the three review hooks** `window.__hpFrame` (656), `window.__hpLabels` (606) and `window.__hpParallax` (632);
**the depth by layers** (C.1 decision (4): `DEPTH_MAX`, `planes`, `planeOf` and the depth term of `hit()` at 553–558 and 574,
and the pointer block 611–632 — `settleLabels()` returns to the flat 3-unit clearance HP-02 measured, which is the state HP-02's
corner checks were taken on). From `homepage.css`: `.hp-proto`, `.hp-replay`, `.hp-top`, `.hp-brand`, `.hp-nav`, `.hp-btn`
(11–29) and the masthead overrides `.hp-portal …` (32–38). From the prototype's `index.html`: the band, the header and the footer.
`serpent-original.png` and `derive-serpent.py` stay in `prototypes/homepage/assets/`, which is not published: the source and its
generator are working material.

**What changes in what the module reads.**
- **The tree's parts in reading order** come from the part sections of the document (`section.part[id]`, today `part-1` …
  `part-11`, `annex-a`, `annex-b`), not from `data/brief.json`; titles, numerals and minutes from the node's own `data-title`,
  `data-roman`, `data-mins` (`index.html:141`). So **the homepage does not start loading `brief.json`** (nothing on it loads it
  today), and the figure reads the one home of the part titles the reader sees — the markup (`AGENTS.md`, known hazards).
- **The theme**: the prototype listens to its own `hp:theme` event (384). The site's toggle (`app.js:245–260`) sets
  `body.dataset.theme` and dispatches nothing, so the module watches that attribute with a `MutationObserver` — **no change to
  `app.js`**.
- **The images load only when the opening plays.** The prototype sets both `href`s at build time (380–383), so a returning
  reader, who never sees the opening, still downloads 391 109 bytes. In production the `<image>` elements are created by
  `play()` and never by `finish()`.
- **Today's tree behaviours** (`app.js:866–960`; §7, the author's answer): **the parts already read are lit on the figure** —
  the module reads `eupolicy:progress` once and follows the `progress:changed` event (dispatched at `app.js:119` and `:152`,
  listened to at `:957`), **without a change to `app.js`**; **a part opens by a plain jump**, without the veil; the figure keeps
  its own caption.
- **The status marks on the masthead** (§7, the author's answer: in the first release): after `initMasthead()` has rendered, the
  module prepends the same shape to each `.tk-item[data-s]` of the ticker and each `.sop-band[data-s] .sb-n`
  (`homepage.js:660–671`), `aria-hidden`; `js/masthead.js` renders the same text as today. If the module fails, the masthead is
  today's.

**The layout.** The prototype puts the figure in a three-column stage between the masthead and the buttons
(`homepage.css:39`), where the published portal places the tree beside the masthead and makes it sticky (`style.css:534`,
`:862`, `:894`, `:902`, `:606–613`). Once the figure is built, the module removes `hidden` from the mount and sets one class
on `.portal` (`has-figure`); `css/home.css` hides `.portal-figure` **only under that class** and lays the stage out. Without
JavaScript, or if the module fails, the class is never set and the published layout is unchanged.

**How search, `seo-audit` and a crawler read it.** With decision (2) the static markup is today's: the same `<h1>`, the same
tree, the same links; **the crawl graph `seo-audit.mjs` builds from static links (`tools/seo-audit.mjs:303–324`) does not
change**, nor do the 26 URLs of `sitemap.xml`, the canonical, the JSON-LD (`index.html:41`) or `og:image`. The figure's links
to the instrument pages exist only after script, so a crawler that does not run JavaScript gains none of them — the cost of
decision (2), named; the instrument pages keep their present inbound links. The search palette indexes the brief's prose
(`AGENTS.md`, known hazards) and is untouched; the figure holds no prose of the brief.

---

## 2 · The contract with what exists

- **`js/regulatory-model.js` stays the one home of the counted set and the status order** (MC-2). The module imports
  `STATUS_ORDER`, `statusPart` and `coveredInstruments` as the prototype does (line 25) and counts nothing by status itself.
  Measured: `countSites()` of `tools/metric-contract.mjs` over `homepage.js` finds **no count by `legislative_status`** (nor by
  `scope_class`); it finds two groupings by `brief_part` (186, 535), a field no declared metric partitions by. Because MC-2 scans
  every `js/*.js` (`tools/metric-contract.mjs:261`), the new module is held to it from its first commit. **The figure shows five
  counts that are not declared metrics** — "CORE · n", "MAPPED · n", "WATCHED · n", "EXCLUDED · n" and the adjacent count in the
  default caption (`homepage.js:300`, `:376`, `:446`) — counts by scope and by `coverage()`, not by status: they are not in
  `METRICS` (`tools/metric-contract.mjs:126`) and nothing holds them. The plan does not declare them; §5 lists it.
- **`js/data.js` stays the only module that fetches a dataset.** The module loads `taxonomy`, `instruments` and `timeline`
  through `loadAll()`, which shares one request per file (`js/data.js:14–25`) — all three are already in `js/main.js`'s
  `NEEDED` (line 19), so **the homepage makes no new data request**. After the two removals of §1, `grep -n "fetch(" js/home-*.js`
  must be empty.
- **The next dated event has one computing function.** It is computed four times today: `js/masthead.js:141` (`nextDue`),
  `:222` (the ticker), and in the prototype at `homepage.js:213` (`dueWithin`) and `:270` (`nextEvent`), each taking "today" its
  own way. The figure's gold mark is drawn under *the ticker's* next deadline, so the two must not disagree. `js/masthead.js`
  exports `upcomingEvents(ix, asOf)` (the filter and sort its two views share) and `statedDay()` (`js/masthead.js:82`); the
  masthead's two views and the figure all call them. **The masthead's rendered output must be identical before and after**
  (checked as in §5).
- **Date precision.** `data/timeline.json` holds four events dated to the month; one of them,
  `tl-dma-2027-01-01-compliance-deadline` (DMA, `precision:month`), is 50 days from 12 Nov 2026, inside the "Falls due next"
  lens. The masthead marks such a count "≈" (`js/masthead.js:155–160`); the prototype prints "DMA · 50 d" and "next dated event
  in 50 days" as if the day were known (`homepage.js:226`, `:313`, `:364`, `:469`). **In production the figure marks a
  month-precision count "≈" as the masthead does.** Not a design choice: printing a day count for a date known only to the month
  narrows its precision on the page.
- **The CSP does not change.** Every page's policy is written by `tools/csp.mjs` through `tools/_footer.mjs`; the brief's is
  `script-src 'self'` with no hash because it has no inline script (`index.html:7`). The figure is a module file; it writes no
  `style` attribute and no `<style>` (the prototype sets `p.style.opacity` through the CSSOM, `homepage.js:438`, which the
  policy allows and `design-qa.mjs` accepts; a `transform` is an SVG attribute); its images are same-origin (`img-src 'self'`).
  **`ALLOWED_RUNTIME_ORIGINS` stays empty**: nothing third-party.
- **`node tools/_footer.mjs`** regenerates what it owns. With §1's two additions to `index.html`, it should rewrite **exactly
  `it/index.html`, `fr/index.html` and `es/index.html`** (`tools/_footer.mjs:272–289`: each edition is a projection of the finished
  `index.html`). `instruments/<id>/` are built from `instrument.html`'s shell (`:267`) and **must not change**; nor `sitemap.xml`,
  `robots.txt` or the security meta. The step's check is `git status --porcelain` after the run: any other path is a finding.
- **What is published** is decided only by `tools/pages-artifact.mjs`: `js/`, `css/` and `img/` are on `PUBLIC_DIRS` (line 60),
  `prototypes/` is on neither list, so **the allowlist does not change**. The images move to `img/home/` for that reason.

---

## 3 · The languages ("English figure, declared")

**Why the figure is English in every edition, by construction.** The editions translate markup carrying `data-i18n`
(`tools/editions.mjs:1–31`); the figure's strings are built by the module (the 20 rows of the prototype README, "Languages: the
plan") and read the part titles from the tree's English `data-title` attributes. So `editions.mjs` never sees a figure string,
and `i18n-audit.mjs` counts no key for it (it reads `data-i18n="…"` in the pages, `tools/i18n-audit.mjs:52–56`). **That is
also why §1 builds the lens buttons, the legend heading, the list's summary and the description in the module rather than in
`index.html`:** static English text in `index.html` without a key would be projected into `it/`, `fr/` and `es/` with nothing
declaring it; with a key it would enter the register as `pending_translation` (route 2, not chosen). Nothing enters `i18n/`.

**How it says so** (§7, the author's answer: "One English line + README"):
- the mount carries `lang="en"`, so a screen reader in an Italian, French or Spanish edition reads the figure with English rules;
- in an edition (`document.documentElement.lang !== 'en'`), **one line under the figure, in English: "This figure is in English."**
  — the way the chrome's note says "UI EN" on the tool pages (`js/shell.js:100–123`; the browser suite's `lang:chrome-note`).
  **The line is English and is not a translation**; it is not a `data-i18n` key and needs no review. It is not shown on the
  English page;
- **README limitation 8** ("The interface is English") is the author's text and a red-tier section
  (`docs/AI-SAFE-BOUNDARIES.md` §3). The implementing session **proposes** the words that add the figure to it (it may only add,
  never soften) and writes them only after the author approves them in §8; this plan writes nothing there.

**What could misread it, and why it does not:** `editions.mjs` only reads `data-i18n` elements of the source markup — the mount is
empty; `i18n-audit.mjs` check 3 compares locale keys to live keys — none added, none removed; `tools/seo.mjs` derives an edition's
indexability from the review ledgers (0 approved strings each on 12 Nov 2026), which nothing here touches.

---

## 4 · The gates, the class and who signs, step by step

**The class of the whole change is D.** `docs/AUTONOMY-POLICY.md` Class D lists "Redesigning the website" and "Publishing,
deploying, or pushing to `main`": explicit authorization naming the action, from the repository author. Where the tiers could
be read differently, the stricter reading governs (`AGENTS.md`). **`js/` is not tiered** by the table of
`docs/AI-SAFE-BOUNDARIES.md` §2; the documents place it as follows, measured: `docs/AUTONOMY-POLICY.md` Class A's bound names
`js/` (an unattended agent may not write there); Class C names "changing a derivation" (`evidenceGrade`, `pipeline.derive`, …),
which this change does not do; `docs/AI-SAFE-BOUNDARIES.md` §1 makes "new derived views … using the existing derivation
modules" green. **No document places a new homepage module more precisely than that; the plan takes Class D from the redesign
row, and C for every step taken alone.**

**The authorization (C.1, decision (3)):** a §8 row in the author's words naming the action ("publish the homepage figure as
`docs/HOMEPAGE-PRODUCTION-PLAN.md` describes"), written **before** the implementation begins; the implementing session works on
its own branch, one pull request, merged by the author with a merge commit. **The merge is the approval** (`docs/DEPLOYMENT.md`
§2a); the decision ledger keeps its one entry of 6 Nov 2026 and is not used; the dispatcher is not used.

| Step (§8) | What it changes | Stopped by | Class | Signs |
|---|---|---|---|---|
| 0 | the §8 row authorizing the action | — | D (the authorization itself) | the author, in §8 |
| 1 | `img/home/` (3 images), `js/home-serpent.js`, the generator's new output | `pages-artifact.mjs verify` (an unreferenced file is allowed; a dot path or a path off the list is not); `design-qa` (the new module) | C | the author, at the merge |
| 2 | `js/masthead.js`: `upcomingEvents`, `statedDay` exported, used by its own two views | `design-qa`; the browser suite (`load:index.html:*`, the masthead mounts); the identical-output check of §5 | C (a refactor across a module's consumers, not within one) | the author, at the merge |
| 3 | `js/home-figure.js`, `css/home.css` (not yet loaded by any page) | `design-qa` (sees both for the first time: tokens, body-not-root, no style attribute, `tools/prose-homes.mjs`, `tools/thirdparty.mjs`); MC-2 (`validate.mjs`) | C; CSS amber "only within the tokens" | the author, at the merge |
| 4 | `index.html` (two additions), `js/main.js` (one call), then `node tools/_footer.mjs` → `it/`, `fr/`, `es/` | all six validators; `selftest.mjs`; the browser suite; `git status` after `_footer` (§2) | **D**: this is the commit that changes what a reader sees | the author: the §8 row of step 0, then the merge |
| 5 | the new checks of §5 under `agent/browser/` | `node --test agent/browser/selftest.mjs` and the 25 suites (`AGENT_SUITES` run for a change under `agent/`); `agent/implement/selftest.mjs` R6 if the suite list changes | green ("more checking is always safe"); in the same pull request, so C | the author, at the merge |
| 6 | the real-phone timing (§6), recorded | the threshold of §6 | — (a measurement, writes only `docs/`) | the author's measurement, recorded in §8 |
| 7 | `docs/`: `CURRENT-ARCHITECTURE.md` §9 (the module map), `BROWSER-QA.md`, `PROTOTYPES.md` §H, the README of the prototype (what shipped), `HANDOVER.md`, §8 | none (docs) | A | the author, at the merge |
| merge | `main` | `qa.yml` (if the ruleset requires it — a §3a-2 setting, the author's word, unmeasurable here); then `pages.yml`: the four gate jobs, `build`, the release gate C1–C10 | D | the author |

**What the release gate says about it** (`agent/release/README.md`, `docs/DEPLOYMENT.md` §2a): C1–C4, C9 and C10 judge the
workflow and the artifact as for every deploy; C5–C7 judge the ledger, which this change does not touch and whose commits
cite no `Proposal`; **C8 reports the implementing session's commits as agent-attributed changes to the published site citing
no Proposal, and does not block** (`--strict-unledgered` off, the author's decision of 11 Nov 2026). That report is expected,
and is the trace of the route chosen in C.1 — not a failure.

**Assumed, not measured** (the author's word, `docs/DEPLOYMENT.md` §3a): that Pages publishes from Actions only (row 1), that the
ruleset on `main` requires the `qa.yml` checks (row 2), that `github-pages` deploys from `main` only (row 4), that the registry
pin is set (row 5). The plan depends on rows 1 and 2; if either is not in place, a push to `main` publishes without the gates
having had to pass first.

---

## 5 · What today's tests do not see, and the checks that would

Today nothing in the repository checks the prototype: `design-qa.mjs` reads `css/` and `js/` (`tools/design-qa.mjs:171`,
`:185`, `:305`), the browser suite's `PAGES` (`agent/browser/checks.mjs:45–56`) has no `prototypes/` path, and HP-02's measures
were scratch scripts, described in the prototype README and not committed. Once the module is in `js/` and the page is
`index.html`, these see it **without any new check**: `design-qa` (tokens, CSP shapes, prose homes, third-party), MC-2, and the
browser suite's generic checks on `index.html` (it loads, no console error, no CSP refusal, first-party requests only, the
keyboard reaches the focusables, every focusable has a name).

**Proposed new checks** (step 5), each with what it would **not** prove:

| Check (in `agent/browser/checks.mjs`) | What it asserts | What it would not prove |
|---|---|---|
| `home:figure` | after load, the figure exists, `.portal.has-figure` is set, 13 tree nodes, as many core marks as `scope:core` instruments, every mark has an accessible name naming a status label from the taxonomy | that the drawing is legible or right; that a status is current |
| `home:no-script` | with JavaScript off, `#portalTree` is visible and the mount is hidden | anything about a crawler's ranking |
| `home:reduced-motion` | under `prefers-reduced-motion: reduce` the final state is drawn at once, no `<image>` is in the figure, and no frame is requested after load | that motion elsewhere on the page respects it |
| `home:opening-once` | the opening plays on a first visit (images requested), not on the second (no image request) | anything about timing |
| `home:next-matches-ticker` | the instrument under the gold mark is the ticker's next deadline (`.tk-next`) | that the date is right (that is `data/`'s business) |
| `home:approx` | a count for a month-precision event carries "≈" | — |
| `home:visited` | with `eupolicy:progress` holding a part, that part's node is marked read on the figure, and a `progress:changed` event updates it | that the reading progress itself is right (`app.js`'s) |
| `home:edition-note` | on `/it/` the figure has `lang="en"` and the line "This figure is in English."; on `/` the line is absent | what a screen reader does with `lang` |
| `home:masthead-marks` | every ticker item and band carries one shape, and the masthead's text is the same as without the module | that the shapes are read as statuses by a person |
| `home:no-hooks` | `window.__hpFrame`, `__hpLabels`, `__hpParallax` are undefined | — |
| `home:labels` | no two label boxes overlap and no label covers a mark, except those involving *Digital Networks Act* (§8, "Leave it, say so"), at 1440 × 900, both lenses | legibility at other widths |
| `home:svg-contrast` | HP-02's method (resolved `fill`/`stroke` × ancestor opacity against the pixels behind each element, the element hidden), Day and Night, both lenses: text ≥ 4.5 : 1, graphics ≥ 3 : 1 | hover and focus states unless added; any browser but Chromium; a high-contrast mode. **It is not M2** (`docs/FRONTEND-REFERENCES.md` §4) and says so |

**Timing** stays **a declared measure, not a gate**: a headless Chromium without a GPU, throttled, measures something
(`prototypes/homepage/README.md`, "Timing of the opening") but not a phone; a threshold on it would pass or fail for reasons that
are not the reader's. The measure is §6, recorded by a person.

**A screen reader** is a declared manual protocol, not a check: VoiceOver (iOS or macOS) and, if available, NVDA or TalkBack —
the figure is one Tab stop; the arrow keys walk the parts and then the ring; each part and mark is announced with its name; the
lens group is a radio group; the list under the figure reads the same content; in an edition, the figure is read with English
rules. Recorded in the implementing session's entry with the reader, its version and the device, or **declared not done**. No
check can show what a person hears.

---

## 6 · Timing on a real phone

**What was measured:** headless Chromium, software rendering, CPU throttled: 4.0 s everywhere; 0 dropped frames at 1 ×; 10–30 %
at 6 ×; the cost in rendering, not in script (prototype README, "Timing of the opening"). **What the author decided:** accepted
as measured, to be revisited on a real phone (§8, "HP-02: the measures").

**The step** (before the merge, on the implementing branch):
1. The author serves the branch on a computer on the same network (`python3 -m http.server 8000 --bind 0.0.0.0`) and opens
   `http://<computer address>:8000/` **on an iPhone** (§7, the author's answer), in Safari, **in a private window**, so the
   opening plays.
2. Records three openings with **Safari Web Inspector** (Develop menu on a Mac, the iPhone connected; Timelines → Rendering
   Frames and JavaScript & Events) and reads, for each: the duration from the mark's first frame to the figure's last change
   (expected 4.0 s), the share of frames longer than 25 ms, and any task longer than 50 ms. The iPhone's model, its iOS and
   Safari versions are recorded with the numbers.
3. **Threshold** (§7, the author's answer): **at most 10 % of frames over 25 ms and no task over 50 ms, in each of the three
   runs**. Below that, the step passes; the 6 × figures of HP-02 (10–30 %) are not the threshold.
4. **If a run fails, the sequence does not change; the drawing is simplified**, in this order, re-measuring after each:
   (a) the two raster images drawn at their displayed size instead of scaled from 1000 px (`homepage.js:394–399`); (b) the 22 beads
   as one path instead of 22 transformed ellipses (`:405–412`); (c) the serpent's body faded without rotation after the turn
   (`:397`); (d) the outer rings drawn once, not every frame (`:422–427`). If none suffices, the opening is withheld and the
   figure ships in its final state — the reduced-motion path, which exists — **and the author is asked**.
5. The result goes into the implementing session's §8 row, with the device and the browser version.

---

## 7 · The open questions of the design

Each is a question to the author; the answer is the §8 row named.

| Question | Answer, and where |
|---|---|
| The serpent is a raster (1920 × 1080; the serpent about 650 × 715 px): ship it, or wait for a vector? | **Ship the raster**; no vector is awaited (§8, "HP-02: C.1 approved", "This is the best (Recommended)"). A vector, if one ever exists, replaces three files in `img/home/` and nothing else. |
| Its framing in the disc (about 65 % of the width) differs from the site icon's (about 74 %): the opening's first frame is not the header's mark. | **Accepted as drawn** (§8, "HP-02: C.1 approved", "Accept as drawn (Recommended)"). |
| The *Digital Networks Act* label touches its neighbours. | **Left, and said** (§8, "HP-02: the measures", "Leave it, say so (Recommended)"); `home:labels` (§5) excepts it by name. |
| The review hooks `__hpFrame`, `__hpLabels`, `__hpParallax`. | **Not in production** (the prompt; §1); `home:no-hooks` (§5) holds it. |
| The depth by layers (HP-02b). | **Not in the first release** (§8, "HP-03: C.1 approved", decision (4)). If it comes later, it is its own pull request, with the depth term of `settleLabels()` back, the corners re-measured on a real pointer and a trackpad, and the same behaviour as in the prototype for touch (none), keyboard (none) and screen readers (none). |
| Today's tree behaviours on the figure (`app.js:866–960`). | **The parts already read are lit; no veil; the figure keeps its own caption**, with no change to `app.js` (§8, "HP-03: the open questions", "Read parts lit; no veil (Recommended)"); §1. |
| Where and in which words the figure declares itself English, and whether README limitation 8 names it. | **`lang="en"` on the figure and, in an edition only, the English line "This figure is in English."; the implementing session proposes words adding the figure to limitation 8, written only on the author's approval** (§8, "HP-03: the open questions", "One English line + README (Recommended)"); §3. |
| The real phone: which device, and the threshold. | **An iPhone, Safari Web Inspector; at most 10 % of frames over 25 ms and no task over 50 ms in each of three runs** (§8, "HP-03: the open questions", "iPhone, ≤10 % slow frames (Recommended)"); §6. |
| The status marks the prototype adds to the masthead's ticker and bands (`homepage.js:660–671`). | **In the first release, with the figure** — the one rule joining the figure to the bands (HP-01) (§8, "HP-03: the open questions", "Yes, with the figure (Recommended)"); §1. |

---

## 8 · The release and the way back

**One branch, one pull request, seven commits in the order of §4** (0 is the §8 row, which may be on the same branch or
before it): images and bead geometry → `masthead.js`'s export → the module and the stylesheet, not loaded → **the wiring and the
regenerated editions** → the checks → the phone measure → `docs/`. Each commit leaves the validators at the baseline; only the
fourth changes what a reader sees. The branch is the one the environment assigns; the pull request is opened when the author
says so and merged by the author **with a merge commit** (not squashed: the release gate's C7/C8 judge a merge by its own
content, and a revert of a merge is one command).

**The way back.** `git revert -m 1 <merge commit>` on a branch, pull request, merge. **How it is verified:** after the revert,
`git diff 02f9a4e..HEAD -- index.html it/ fr/ es/ js/main.js js/masthead.js` must be empty if nothing else touched those paths
in between (otherwise, the diff must hold only the other changes, named); `js/home-*.js`, `css/home.css` and `img/home/` must
be absent; the six validators and `selftest.mjs` back at the baseline; the browser suite's `home:*` checks fail by absence (they
leave with the revert, which is how they are removed); the published page's `index.html` equals `main`'s. **Faster, partial:**
reverting the fourth commit alone takes the figure off the page and leaves unused files; acceptable only as an emergency,
followed by the full revert.

**After the deploy** (`docs/DEPLOYMENT.md`, `docs/SEO-OPERATIONS.md` §4):
- the `pages.yml` run for the merge commit: the four gate jobs, `build`, the release gate and `deploy` green, and C8's report
  naming the session's commits (expected);
- the live `/`: the figure, in Day and Night, on a desktop and on the author's phone; with JavaScript off, today's tree;
  `/it/`: the figure with its English line; the console clean;
- **unchanged, and checked as unchanged:** the canonical (`https://eudigitalpolicy.eu/`), `noindex` absent on `/`, present on
  `/it/`, `/fr/`, `/es/` (no edition is reviewed); `sitemap.xml` 26 URLs; `robots.txt`; the JSON-LD;
- Search Console (owner only): **URL Inspection of `/` → Test live URL → View tested page**: the `<h1>`, the tree's markup and
  the canonical present; "User-declared" and "Google-selected canonical" the same; **Request indexing** for `/` only, because the
  rendered content changed;
- one week later: the Pages report for `/` (no new exclusion), and any reader report.

---

## What this plan does not decide

The implementation; PV2-05 (its other three views, `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`); a vector serpent;
translations of the figure (route 3 of the prototype README is where a later decision would start); the declaration of the
figure's counts as metrics; any setting outside the tree.
