# Homepage prototype — the tree and its constellation

A prototype of the **homepage only**, built for the author's review on 12 Nov 2026. It is **not published** (`prototypes/` is not in the
allowlist of `tools/pages-artifact.mjs`), carries `noindex`, and is **not chosen**: the published `index.html` stays the reference and
nothing in it, in `style.css`, in `js/` or in `data/` was changed to build this.

## Run it

From the repository root: `python3 -m http.server 8000`, then open `http://localhost:8000/prototypes/homepage/`. It must be served over
HTTP, like the site.

- The opening plays **once**; the page remembers it (`localStorage` key `eupolicy:home-intro-seen`). To see it again: the **Replay the
  opening** button in the prototype band, or `?intro=1`.
- A click or a key press skips it. With `prefers-reduced-motion: reduce` the figure appears in its final state, with no motion at all.
- The **Day / Night** button uses the site's own key (`eupolicy:theme`), so it also switches the published site's theme on the same origin.

## What the page is

1. **The masthead, as on the site**: the title and standfirst read in place from `index.html` (one home for the prose), and the one-line
   state-of-play ticker rendered by the site's `js/masthead.js`.
2. **The figure** (`homepage.js`):
   - **at the centre, the brief's tree**: the thirteen nodes and their paths read in place from `#portalTree` in `index.html`, titles and
     reading times from `data/brief.json`; each node links to its part;
   - **on the core ring, the core instruments** (`scope_class` `scope:core`), each placed beside the part that reads it (`brief_part` in
     `data/instruments.json`), the ones with no part recorded along the bottom; **status by shape** (filled, half, heavy ring, ring with a
     dot, dashed …), labelled from `data/taxonomy.json`, never by hue alone;
   - **three outer rings**: the other instruments by `coverage()` (`js/routes.js`) — mapped, watched, excluded;
   - **one rule joins the figure to the bands below**: every instrument the bands count — core and adjacent, `coveredInstruments()` in
     `js/regulatory-model.js`, the one home of that set and of the status order since MC-2 (#102) — carries its status mark wherever its
     ring puts it (the five adjacent ones on the mapped and watched rings); a plain dot is an instrument the bands do not count;
   - **two lenses**: *Status* and *Falls due next* (dated events in the next 90 days, from `data/timeline.json`, counted in UTC days);
   - **depth by layers** (HP-02b): the tree at the back, then the core ring, then the mapped, watched and excluded rings, each on its own plane; a mouse moving over
     the figure slides the planes over one another, up to 8 units from the back plane to the front one. **Translations of eight groups only** — nothing rotates, no node
     is reprojected, no library (`planes` in `homepage.js`, one constant `DEPTH_MAX`). Still while the opening plays, under `prefers-reduced-motion`, on a touch or
     pen pointer and on a device without a fine pointer; focus, names and the keyboard are untouched;
   - hover or focus names a part or an instrument and draws the link between them; **one Tab stop**, the arrow keys walk the parts in
     reading order and then the ring clockwise; the same content as a **list** under the figure (open by default on a phone).
3. **The buttons, the five doors and the state of play**, unchanged: the doors rendered by `js/shell.js`, the bands, the next deadlines,
   the fines and the last-checked line by `js/masthead.js`. The prototype only adds the status marks to the ticker and the bands.

## The opening (about 3 s on a first visit)

| Time | What happens |
|---|---|
| 0–0.3 s | The mark — the author's drawing, the serpent in its gold disc (`assets/serpent-mark.png`) — appears at the centre, upside down. |
| 0.3–1.0 s | It grows and turns 180° counter-clockwise, head first; its gold disc fades. |
| 0.85–1.25 s | The serpent's body fades as the turn settles; its 22 beads remain and warm to gold. |
| 0.95–1.9 s | The tree draws itself in reading order inside the ring of beads. |
| 1.1–2.35 s | The beads close in, slowly, onto the core ring and fade as the core instruments appear under them. |
| 2.16–2.8 s | The mapped, watched and excluded rings follow, each opening by a few units. |
| 2.75–3.35 s | One gold mark under the ticker's next deadline and on that instrument, once. Then nothing moves. |

## The author's decisions behind it (12 Nov 2026, in chat)

Direction C of the homepage exploration, revised to stay compatible with the published homepage: the tree stays at the centre, the record
around it in rings by coverage; the sections below the figure keep their content; the site icon opens the figure, sober; the serpent's body
fades before its beads; the beads become the core instruments by one contraction (not split across two orbits); the turn is
counter-clockwise; in Night the serpent keeps a fine light contour. These decisions are recorded in `docs/ROADMAP-v2.md` §8 ("HP-01: …"), with the author's words, and this prototype **supersedes PV2-05's homepage view only**
(`docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`, its note of 12 Nov 2026). HP-02's decisions are there too ("HP-02: …").

## Files

| File | What it is |
|---|---|
| `index.html` | The page: the site's CSP (`script-src 'self'`, no inline script, no `style` attribute), `noindex`, the site's four stylesheets in the site's order. |
| `homepage.js` | The figure, its opening, the lenses, the list, the marks on the ticker and bands. Imports `js/data.js`, `js/routes.js`, `js/regulatory-model.js` (`STATUS_ORDER`, `statusPart`, `coveredInstruments`), `js/shell.js`, `js/masthead.js`, `js/palette.js` and `prototypes/editorial/brief.js` unchanged; it counts nothing by status itself. |
| `homepage.css` | Layout and the figure's styles, in the site's tokens only. |
| `assets/serpent-original.png` | **The author's own drawing of the serpent** (1920 × 1080 raster, transparent outside the gold disc), supplied on 12 Nov 2026 for HP-02. The source of everything below; not edited. |
| `assets/serpent-mark.png` · `assets/serpent-body-day.png` · `assets/serpent-body-night.png` · `assets/serpent-beads.json` | **Derived from that drawing by `assets/derive-serpent.py`**, by colour and connectivity only, nothing traced or redrawn: the disc's 1000 × 1000 square as drawn (the opening's first frames); the serpent without the gold ground, its beads painted over with its own ink (Day); the same with the body lifted to `--ink-2` and a fine `--paper-dim` contour, computed at 4× (Night); and the geometry of the 22 beads, measured as ellipses from the connected cream components. The three files HP-01 derived from `img/icons/icon-512.png` are replaced; **`img/icons/` is untouched** and the page no longer reads it. Artwork, not records. |

## Languages: the plan and the author's answer (HP-02, 12 Nov 2026) — **no translation is written here**

**How the site translates today** (`i18n/locales.json`, `app.js`, `tools/i18n-audit.mjs`): an element carries `data-i18n="key"`; each locale file maps key → string;
a key a locale lacks falls back to the English held in the DOM and is marked `data-i18n-fallback`; the register declares each gap `pending_translation` or
`superseded` (`AGENTS.md`: correcting an English string without declaring its key `superseded` leaves the it / fr / es editions asserting the old one). An
**entity overlay** (`i18n/<code>/data.json`) translates instrument names, statuses and event types. Whether an edition is indexable is derived from
`i18n/review/<code>.json`, which a person alone writes: **on 12 Nov 2026 all three ledgers hold zero approved strings**, so no edition is indexable today and
new keys change nothing for search until a person approves them. README limitation 8 already says the chrome and the tool pages are English; the published masthead
(`js/masthead.js`) carries no `data-i18n`.

**What the figure adds** — every string a reader sees or a screen reader hears, from `index.html` and `homepage.js`:

| # | String (English) | Where | Kind |
|---|---|---|---|
| 1 | "Show on the map" | lens group label | static |
| 2 | "Status" · "where the core rulebook stands" | lens 1 and its sub-label | static |
| 3 | "Falls due next" · "the next 90 days" | lens 2 and its sub-label | static |
| 4 | "The marks" | legend heading (its entries are status labels from `data/taxonomy.json`: the entity overlay) | static |
| 5 | the figure's description (one sentence, the `aria-describedby` text) | figure | static |
| 6 | "The figure, as a list" | `<summary>` | static |
| 7 | "Mapped" · "Watched" · "Excluded" | ring labels (upper-cased by script) and list headings | generated |
| 8 | "CORE · n" | core ring label | generated, number |
| 9 | "along the bottom of the core: instruments with no part of the brief recorded" | in-figure caption | generated |
| 10 | "Core instruments with no part of the brief recorded" | list heading | generated |
| 11 | the default caption: "n parts and n annexes of the brief at the centre; around them the n core instruments, …; further out, n mapped, n watched and n excluded. The n adjacent instruments the bands below also count …" | caption panel | generated, five numbers |
| 12 | "n min read" · "reading time not recorded" | part caption | generated, number |
| 13 | "n core instrument(s): …" · "no core instrument …" | part caption | generated, number, **plural** |
| 14 | "Analysed in Part …" · "No part of the brief recorded" · "Status not recorded" | instrument caption | generated |
| 15 | "next dated event in n day(s)" | instrument caption | generated, number, **plural** |
| 16 | "Falls due next · 90 days" · "No dated event recorded in the next 90 days." | lens caption | generated |
| 17 | "n days" in the lens list; "n d" on a due label | lens caption, figure | generated, number, **plural**, abbreviation |
| 18 | the mark's accessible name: "<instrument> — <status> — analysed in <part> / no part of the brief recorded" | every core mark | generated (aria) |
| 19 | the part node's accessible name: "<part>: <title> — n min read" | every tree node | generated (aria) |
| 20 | the ring dot's `<title>`: "<instrument> — mapped · adjacent · core · <status>" | every outer dot | generated (title) |

Not counted: the prototype's own band ("Replay the opening", the build note), which would not ship; the Day / Night button and the doors, which the site's `js/shell.js`
already renders; the part titles and reading times, read from `data/brief.json`.

**Why this is more than adding keys.** Rows 7–20 are built in script, with numbers and plurals, and the site's mechanism translates *markup carrying `data-i18n`*: it
has no function a script can call for a string with a number in it, and nothing in `tools/i18n-audit.mjs` would see an English string inside a template literal. Left
alone, the it / fr / es homepage would show an **English figure under an Italian, French or Spanish masthead**, and no check would report it. Three honest routes:

1. **English figure, declared.** Nothing enters the register; the figure says so as the chrome does (limitation 8). Cheapest, no new debt, and the first thing a reader
   of an it / fr / es edition sees is English.
2. **Static strings only (rows 1–6).** Six keys with `data-i18n`, declared `pending_translation`; rows 7–20 stay English. A figure half in one language: worse than 1.
3. **Everything.** A small `t(key, params)` helper in a module under `js/` for the generated strings (with a plural rule per language), keys for rows 1–20, declared
   `pending_translation` until a person writes and approves them. About twenty strings × three languages, **written and approved by a person** (`tools/i18n-review.mjs`);
   an agent writes none. A change under `i18n/` is amber (`docs/AI-SAFE-BOUNDARIES.md` §2); that table does not tier `js/`, and the helper is a new mechanism, so it needs the author's decision.

**The author chose route 1 on 12 Nov 2026** (§8, "HP-02: the languages"): English figure, declared. **Nothing here is a translation and none is wired.**

## Depth by layers (HP-02b, 12 Nov 2026) — an experiment, kept

**What was asked and what was chosen.** The author asked whether the tree could be in 3D. Three kinds were put: depth only; a rotatable tree; the whole constellation in 3D. **Depth
only** was recommended and chosen (§8, "The scope of HP-02b"): the tree is a flat graph, so turning it shows nothing new, rotation would make the 8 px labels illegible and take the
contrast with it, and tilted rings would break the label placement and the status marks, which are read by shape. The depth is the order the figure already has.

**How.** `planes` in `homepage.js`: the tree at depth 0, the tie lines at 1, the core ring (its disc, marks and labels) at 2, the mapped ring at 4, the watched at 6, the excluded at 8
(units of the 720-unit drawing; the pointer's offset is at most 1, so the spread is at most 8). A `pointermove` on the stage (a mouse only, on a device with `(hover: hover) and
(pointer: fine)`, not under reduced motion, not while the opening plays) sets a target and the planes ease to it at 0.16 per frame; `pointerleave` returns them. Each plane is one
`transform="translate(…)"` attribute on a group (a `style` attribute would be refused by the CSP). `window.__hpParallax(x, y)` exists for the review recordings only. **One approximation:**
the tie lines (shown on hover) sit at depth 1 between the tree at 0 and the core at 2, so at the extremes their ends are off their node and their mark by up to 1 unit.

**Measured (same machine, same method as HP-02; `main` `fa7b4cd` is the baseline).**

- **At rest it is the same figure:** a screenshot of `#hpFig` is identical to `main`'s in both themes (three runs each, one hash each).
- **Labels.** Two things slide over one another on different planes, so the clearance `settleLabels()` demands now grows by the difference of their depths (it was a flat 3 units), and
  the core ring's own label "CORE · n", which it had not been moving, is now moved. Checked at the centre and the four corners of the parallax, both lens states, with 3 px of
  clearance: **every contact left involves *Digital Networks Act*** (with the marks beside it or with *EHDS*) — the label the author chose to leave; no other label touches
  anything at any extreme. Before the depth-aware clearance the corners showed contacts of CRA, *Interoperable Europe Act*, "CORE · 16" and eIDAS2 as well.
- **Contrast** unchanged: 528 readings, 0 failing, lowest text 4.82 : 1 and lowest graphic 3.27 : 1 at the centre and at two opposite corners (no colour changed and nothing rotates).
- **Cost of the movement:** 3 s of continuous mouse movement over the figure, three runs, `Emulation.setCPUThrottlingRate`. At 1 ×: **0 dropped frames** of about 180 (main: 0, 1, 0). At 6 ×:
  1–5 dropped of about 176 (main: 0, 0, 1), worst frame 33 ms, mean 17 ms. No long task.
- **The opening** is not slower: at 6 × on desktop 13 / 13 / 15 dropped frames against `main`'s 13 / 7 / 12, on mobile 11 / 9 / 9 against 25 / 9 / 8, 0 at 1 ×, 4.0 s in every run.
- **Pointer, reduced motion, touch** (Playwright): a real mouse moves the planes symmetrically (lower-right is the exact opposite of upper-left); with `prefers-reduced-motion` and on an iPhone
  profile nothing moves; the planes are back at zero when the pointer leaves the stage.

**The author's decision:** "Tienila così (Recommended)" — kept at 8 units (§8). A stronger depth (14) was put and not chosen; it would grow the planes' relative slide and the label clearance with it,
and needs another measure of the corners.

**Not measured:** a real device or pointer, a trackpad's finer sampling, the focus ring while a plane moves (it moves with its element), a high-contrast mode.

## What was checked, 12 Nov 2026

**HP-01 (the build).** In headless Chromium (Playwright) against `python3 -m http.server`: 1440 × 900 and 390 × 844, Day and Night — no console error, no CSP
violation, only `localhost` requested, no horizontal scroll; 13 tree nodes, 16 core instruments, 23 outer instruments (5 of them adjacent,
with their status mark) and 6 status bands, as the data gives them on `main` `33ee004` (after MC-2). The opening plays on a first visit and not on the next; it ends with the mark removed from the drawing; with reduced
motion the final state is drawn at once and no animation runs. Keyboard: the figure is one Tab stop, Tab reaches Part I, the arrow keys move
and the caption follows the focus. The site's validators were run with the prototype in place: `validate`, `i18n-audit`, `design-qa`,
`freshness`, `evidence-audit`, `seo-audit` all exit 0 with 0 errors, and the warnings (5 and 11) are those of the same commit without the
prototype.

**HP-02 (the measures; scripts were scratch work and are not committed — the method is described here so it can be repeated).**

- **Contrast inside the figure.** `docs/FRONTEND-REFERENCES.md` §4 M2 reads a computed `color` over the nearest opaque ancestor background, and an SVG's text and marks are
  painted with `fill` and `stroke`, so **M2 does not apply to the figure** and was not used. Instead, for each text, shape and mark in the figure and the panels around it:
  its resolved paint (`fill` or `stroke`, times every ancestor's opacity) against the pixels it covers, sampled with that element hidden (so the body's gradient is
  measured). 528 element readings across four states (Day / Night × the default and the "Falls due next" lens), at 1440 × 900. Thresholds: 4.5 : 1 for text, 3 : 1 for
  a graphic. **Before:** the default state passed for text (minimum 4.82), dots, marks and node outlines, and failed for the three rings (1.41 Night / 1.59 Day) and the tree's
  lines (1.31 / 1.38); the lens failed widely — an opacity of .25–.45 took labels, marks and rings to 1.4–2.6 : 1 — and the Day caption heading in `--live` was 3.84. **Corrected,
  with the site's tokens only** (`homepage.css`): rings and tree lines to `--paper-faint`; what is not due in the lens is set back by tone (`--paper-faint`) instead of by
  opacity; Day text that was in `--live` takes `--paper` / `--paper-dim`. A real defect surfaced on the way: a due label on an outer ring (`lb due-only`) was dimmed to 30 %
  by the rule meant for the labels of instruments not due, in the lens built to show it. **After:** every group passes, the lowest graphic being the Day due ring at 3.27 : 1 (3 needed)
  and the lowest text the panel headings at 4.82 : 1 (4.5 needed); 528 readings, 0 failing, re-run on the committed tree. **Cost, visible:** the rings and the tree's lines are now clearly present, where they were a quiet tint — **the author kept it** (§8, "Keep, they pass (Recommended)"). **The Night contour** (the serpent's body is `--ink-2` on `--ink-0`, 1.05 : 1, so the contour is its only edge) was 0.58 screen px wide: its painted pixels
  averaged 2.59 : 1 at 1 × and 3.07 : 1 at 2 × (peak 3.74 / 4.29). Widened to 1.5 source px (about 1 screen px): **4.61 : 1 at 1 × and 5.35 : 1 at 2 ×**.
  *Not measured:* hover and focus states (the caption heading was measured in the lens only), the opening's transient frames other than the contour, a high-contrast mode.
- **Timing of the opening.** Chromium (the pre-installed headless build, software rendering, no GPU) with `Emulation.setCPUThrottlingRate` at 1 ×, 4 × and 6 ×, three runs each, 1440 × 900 and
  390 × 844 at 2 ×; every `requestAnimationFrame` interval from the first frame of the mark to the mark being hidden; a frame counts as dropped above 25 ms. **The timeline holds:**
  4.0 s (END 3.4 + 0.6) in every condition, because the animation is driven by the clock, not by frames. **At 1 ×: 0 dropped frames of about 240, worst 16.8 ms, both
  widths.** At 4 ×: 0–8 dropped on desktop, 2–22 on mobile, worst 33 ms. At 6 ×: 15–37 on desktop, 22–60 on mobile (about 10–30 % of frames), worst 33–67 ms, p95 33 ms —
  it stutters at about 30 fps. **No long task (> 50 ms) was seen in any run.** The version before HP-02 gave the same counts within the spread (three runs do not resolve
  differences smaller than that). The cost of a frame's script, measured separately at 6 ×: median **4.3 ms → 2.5 ms**, max 11.6 → 8.3, after `set()` was made to write only
  what changed (and two per-frame DOM lookups were cached); a frame is 16.7 ms, so script is inside the budget at every speed measured and **the stutter at 6 × is rendering**
  (two large rotated images and 326 SVG elements in the figure, 165 of them shapes and 35 text, counted on 12 Nov 2026), which the throttle slows and this machine cannot separate. **The author accepted the timing as measured** (§8); a real phone is the step the production plan keeps. The sequence was not changed; the pixel output
  of the lighter writes was compared against a fresh render at six moments in both themes: identical. *Not measured:* a real phone, a GPU, any browser but Chromium, the page's load time.
- **Labels that touch.** Boxes of every label and every mark, in both lens states, with 3 px of clearance. Found at the bottom of the core and on the right: the DMA label on a
  mapped dot, the WATCHED ring label on a dot, the eIDAS2 and Revised PLD due labels on dots and on other labels, and *Digital Networks Act* on *EHDS* and on the Revised PLD mark.
  `settleLabels()` (new, `homepage.js`) tries nearby positions for core, ring and due labels and keeps the first that clears everything — **capped at 26 units (34 for a due label beside
  its own dot)**, because a label moved further reads as the name of the next mark along, which an earlier uncapped version did to *EHDS*. **Cleared: DMA, WATCHED, eIDAS2, Revised PLD.
  Not cleared: *Digital Networks Act*,** which is about 126 units wide at the height of the mapped ring, where two mapped dots leave about 84; the gap between the core marks and
  the mapped dots is 13 units, less than one line of text, and no phase of the mapped ring changes that, so *Digital Networks Act* still crosses the mark of Revised PLD and touches
  *EHDS*. **The author chose to leave it and say so** (§8, "HP-02: the measures"); the alternatives put were a leader line with the label below the mapped ring, and a second line.
  What it moved and what it could not resolve is in `window.__hpLabels`.
- **Validators** on the tree after these changes: `validate`, `i18n-audit`, `design-qa`, `freshness`, `evidence-audit`, `seo-audit` exit 0; `tools/selftest.mjs` 189 / 189, as on `main`.

## What was not checked

- **No screen reader** was run; names and roles are read from the markup, not heard.
- **Other browsers**: Chromium only; **no real device**; **no GPU**.
- **Hover and focus states** for contrast; the opening's transient frames except the Night contour.
- **Sharpness of the serpent**: HP-02 replaced the 512 px icon with the author's drawing, which is a **raster** (the serpent spans about 650 × 715 px, against about 380 px in the icon), so it is about 1.7× sharper but is still enlarged on screen, and on a 2× display more than on a 1× one. A vector drawing would make it exact and would make the Night contour a stroke. The author's drawing frames the serpent smaller in its disc than the site icon does (about 65 % of the disc's width, against about 74 %), so the opening's first frame is not pixel-identical to the header's mark. The author accepted both (§8, "HP-02: C.1 approved").
- **Languages**: English only, by the author's decision of 12 Nov 2026 (§8): the figure is declared English in the it / fr / es editions, as the chrome is; the plan above is what a later decision would start from.
- **Not built**: the *Enforcement* and *Relationships* lenses of the earlier design.
