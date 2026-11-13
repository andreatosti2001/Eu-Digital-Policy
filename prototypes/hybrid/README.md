# The Hybrid prototype (Post-v2 C, PV2-05)

The third of three directions for comparison (`docs/POST-V2.md` §3 C; `docs/FRONTEND-REFERENCES.md` §8.2, direction 3), on the views,
content and conditions of `prototypes/editorial/` and `prototypes/observatory/` (`docs/PROTOTYPES.md` §0) — **without the homepage view**,
which is in production since HP-04 and outside the comparison (`docs/ROADMAP-v2.md` §8, "HP-04: the next session"). It is **not published**
(`prototypes/` is not in the allowlist of `tools/pages-artifact.mjs`), **not chosen** (the choice is the author's, at PV2-05's C.5), and the
current site remains the baseline. The decisions behind it are rows of `docs/ROADMAP-v2.md` §8 ("The scope of PV2-05", "PV2-05, C.1
question 1", and PV2-04's "C.5 questions 1–3" that set its folder, its layout and its stopping rule); the record of its measurement is
`docs/PROTOTYPES.md` §3.

## Run it

From the repository root: `python3 -m http.server 8000`, then open `http://localhost:8000/prototypes/hybrid/`. It must be served over
HTTP, like the site.

## The views

| View | File | What it is |
|---|---|---|
| Regulation page | `regulation.html?id=ai-act` | **the observatory's** view module, `../observatory/regulation.js`, loaded whole: cards and captioned sortable tables (direction 2's table-first layout). **Empty state:** `regulation.html?id=chips-act` |
| Article page | `article.html` | **the Editorial's** view module, `../editorial/article.js`, loaded whole: Part V read from `../../index.html` in one reading column, each passage's claims in the margin (direction 1's column) |
| Analytical view | `timeline.html` | the timeline: **the observatory's** timeline mode, `../observatory/timeline.js`, imported whole; `?instrument=chips-act` is its empty state |
| Analytical view, network | `timeline.html?mode=network` | the Regulatory Network Explorer: the Hybrid's table-led layout around **the observatory's 3D network** (`explorer.js`; `&focus=<id>` opens it on an instrument) |
| — | `index.html` | a landing page for the folder; it is not a homepage view and reads no data |

**Why whole modules.** Direction 3 *is* the Editorial's article and the observatory's tool pages under one set of tokens (§8.2, 3), and the
three prototypes share layout A (§8, "PV2-04, C.5 questions 1–3"). Rewriting those modules here would have made a second home of each; the
Hybrid loads them instead, so **what is the Hybrid's own** is: the one stylesheet (`hybrid.css`), the explorer's layout (`explorer.js`), the
analytical view's switch between the two (`timeline.js`), and `hybrid.js`, which only renames "Editorial prototype" / "Observatory
prototype" to "Hybrid prototype" in the document title.

## The explorer — the table leads, the observatory's 3D network beside it

**As it now stands** (§8, "PV2-05, C.5: the author's answer" and "the combination built now"): the author kept the Hybrid's layout and asked
for the observatory's 3D network in its map box, with an option to enlarge it.
- **The network is the observatory's**, `mountExplorer()` of `../observatory/explorer.js`, imported and run **unchanged**: its records,
  counting function, 3D layout, controls, legend, tabbed panel, keyboard, phone ego view and table. `explorer.js` here only **arranges** what it
  renders, inside the same root: the selection panel and the relationships table in the left column (the table leads), the 3D stage in the
  right-hand box — its controls as a bar above the canvas, its legend below it.
- **Enlarge:** "Enlarge the network" turns the box into a full-width stage with the panel back inside it — the observatory's arrangement — and
  the table below; the same button, or Esc outside the canvas, shrinks it back.
- **The box shows the middle of the drawing.** The observatory's drawing keeps room on its left and right for its floating controls and panel;
  in the box those sit outside the canvas, so the stylesheet crops that room away (CSS only). At the starting view the box shows 39 of 39
  instruments, the label "GDPR Procedural Regulation" running past its edge; grouped by part, 38 of 39 — "Fit", zoom out or "Enlarge" show the rest.
- **The table is keyed to the network:** each row group carries "Show in the network", each relationship row "Select in the network", matched
  to the records in `relations.js`'s own order and left unkeyed rather than keyed wrongly when a count does not match. The observatory's module
  re-renders the table on every selection and filter; each rendering is keyed again.
- **A type the legend hides is not drawn.** `observatory.css` has no rule for the class its filter sets, so in the observatory a hidden type stays
  drawn; `hybrid.css` carries the rule (`docs/PROTOTYPES.md` §3.6).

**The flat explorer it replaced** — rings by `coverage()`, numbered nodes keyed to the table, nothing turning — is what `docs/PROTOTYPES.md` §3.1–§3.5
measured, at `a5eca14`; it stays in the branch's history.

## What it reads, imports and does not do

- Every dataset through `js/data.js`, in place; the brief's prose from `index.html` through `../editorial/brief.js`. Nothing is copied.
- It **depends on both other prototype folders** (their view modules, `common.js`, `relations.js`, the observatory's `explorer.js`) and changes
  neither. Removing either breaks this one.
- No dependency, no graph library, no build step, no remote font, no third-party request, no inline script, no `style` attribute; each page
  carries the site's Content-Security-Policy with `script-src 'self'`. The type is the site's own font files, used where they are
  (`../../fonts/`), not copied; their licence is not stated in `fonts/` and was not read by this session.
- **The theme choice is kept per module:** the article page stores it under the Editorial's key, the other pages under the observatory's,
  because each runs that prototype's own module. With the button left on "system", all pages follow the system preference.
