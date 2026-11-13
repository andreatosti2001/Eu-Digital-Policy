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
| Analytical view, network | `timeline.html?mode=network` | **the Hybrid's own** Regulatory Network Explorer, `explorer.js` (`&focus=<id>` opens it on an instrument) |
| — | `index.html` | a landing page for the folder; it is not a homepage view and reads no data |

**Why whole modules.** Direction 3 *is* the Editorial's article and the observatory's tool pages under one set of tokens (§8.2, 3), and the
three prototypes share layout A (§8, "PV2-04, C.5 questions 1–3"). Rewriting those modules here would have made a second home of each; the
Hybrid loads them instead, so **what is the Hybrid's own** is: the one stylesheet (`hybrid.css`), the explorer (`explorer.js`), the
analytical view's switch between the two (`timeline.js`), and `hybrid.js`, which only renames "Editorial prototype" / "Observatory
prototype" to "Hybrid prototype" in the document title.

## The explorer — flat, and led by the table

As decided (§8, "PV2-05, C.1 question 1"):
- **The relationships table leads.** It is `../editorial/relations.js`, imported unchanged (one set of rules for the three directions), and it
  is the reading surface: on a wide screen the selection panel and the table fill the left column, and the map sits beside them, kept in
  view. Each row group carries its instrument's number and a "Show on the map" button; each relationship row, in its summary cell, a button
  that selects it on the map. The table follows the type filter and the selection.
- **The map is 2D SVG**: the instruments on **concentric rings by `coverage()`** of `js/routes.js` — covered inside, then mapped, watched,
  excluded — placed on each ring by the order of the brief's parts (`brief_part`; those with none after) and then by id. Nothing about a node's
  place comes from the relationships; **nothing moves and nothing turns**. Each node carries **the number of its row group in the table**
  (alphabetical); **names** are drawn for the selection and its direct neighbours, and on hover or focus. *Why numbers:* at the width a
  table-led layout leaves the map (about 470 px at 1280), the 39 names cannot be drawn on four rings without covering each other.
- **The same core as the observatory's:** nodes are the 39 instruments and edges the 40 records of `relationships`, nothing else; the
  counts come from **`explorerCounts()` of `../observatory/explorer.js`, imported** — one counting function for both concepts; type by
  colour, stroke pattern and a two-letter code; an arrow **only** where `symmetric` is false; two relationships between one pair drawn apart;
  a tabbed panel (Properties, Relations), a field the record lacks reading "not recorded"; the legend always visible, and it is the type
  filter; focus on a node's or an edge's direct connections; an instrument with no relationship keeps its place and says so.
- **Keyboard:** Tab reaches the picker, the panel, the table's buttons and the map; on the map ← and → move along a ring, ↑ outward and ↓
  inward to the nearest instrument, Home and End to the first and last by number, Enter selects, Esc clears, Tab leaves.
- **On a phone** (below 52rem) the map gives way to an **ego view** — the chosen instrument and its direct relationships, named — followed
  by the legend, the panel and the table for that instrument: not the map made small.
- **Shrunk under the stopping rule** (§8, "PV2-04, C.5 questions 1–3"): **zoom and pan** and **re-layout** are not built (a ring layout
  fixed by the records has nothing to re-lay out, and the map fits its box); **search** is the instrument picker, by number and name, not a
  free-text field; the **grouping** is the rings themselves, not a selectable "Group by".

## What it reads, imports and does not do

- Every dataset through `js/data.js`, in place; the brief's prose from `index.html` through `../editorial/brief.js`. Nothing is copied.
- It **depends on both other prototype folders** (their view modules, `common.js`, `relations.js`, `explorer.js`'s `explorerCounts`) and changes
  neither. Removing either breaks this one.
- No dependency, no graph library, no build step, no remote font, no third-party request, no inline script, no `style` attribute; each page
  carries the site's Content-Security-Policy with `script-src 'self'`. The type is the site's own font files, used where they are
  (`../../fonts/`), not copied; their licence is not stated in `fonts/` and was not read by this session.
- **The theme choice is kept per module:** the article page stores it under the Editorial's key, the other pages under the observatory's,
  because each runs that prototype's own module. With the button left on "system", all pages follow the system preference.
