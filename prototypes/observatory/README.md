# The Policy observatory prototype (Post-v2 C, PV2-04)

The second of three directions for comparison (`docs/POST-V2.md` §3 C; `docs/FRONTEND-REFERENCES.md` §8.2, direction 2), on the same
four views, content and conditions as `prototypes/editorial/` (`docs/PROTOTYPES.md` §0). It is **not published** (`prototypes/` is not in the
allowlist of `tools/pages-artifact.mjs`), **not chosen** (the choice is PV2-05's, with the author's explicit decision), and the current site
remains the baseline. The decisions behind it are rows of `docs/ROADMAP-v2.md` §8 (PV2-04's, and PV2-03's that it repeats); the record of the
build and its measurement is `docs/PROTOTYPES.md` §2.

## Run it

From the repository root: `python3 -m http.server 8000`, then open `http://localhost:8000/prototypes/observatory/`. It must be served over
HTTP, like the site.

## The four views

| View | File | Content |
|---|---|---|
| Homepage | `index.html` | the brief's opening beside the portal tree (a star chart), the record counted in cards, two charts each beside its table, the parts as a sortable table |
| Regulation page | `regulation.html?id=ai-act` | the AI Act as cards and captioned sortable tables; **the empty state** is `regulation.html?id=chips-act` |
| Article page | `article.html` | Part V of the brief, read from `../../index.html`, with a numbered evidence ledger beside the text |
| Analytical view | `timeline.html` | two modes: the timeline (cards, events by year beside its table, every event in a sortable and filterable table; `?instrument=chips-act` is its empty state) and `?mode=network`, **the Regulatory Network Explorer**, with the relationships table as its accessible alternative (`&focus=<id>` opens it on an instrument) |

## What it reads, imports and does not do

- Every dataset through `js/data.js`, in place; the brief's prose from `index.html` through `../editorial/brief.js`. Nothing is copied.
- It imports `js/format.js`, `js/pipeline.js` (`finesFigure()`, the site's one computing function for fines), `js/routes.js` (`coverage()`,
  `instrumentHref()`), `js/status.js`, and, from the Editorial, `common.js` (the two absence tokens, tags, dates, sources, the column of Roman
  numerals) and **`relations.js`, the relationships table, unchanged** — so the table's rules have one home in both directions.
- **The Explorer** (`explorer.js`): nodes are the instruments, edges the `relationships` array and nothing else; type by colour, stroke
  pattern and a two-letter code; an arrow only where `symmetric` is false; a deterministic layout (no randomness), grouped on request by
  `coverage()` or `brief_part` — never by community detection; a tabbed side panel (Properties, Relations); a legend always visible, which is
  also the type filter; search, zoom and pan, focus on a node's connections, re-layout; keyboard navigation by position; on a phone an
  "ego" view of one instrument and its direct relationships instead of the canvas made small.
- No dependency, no graph library, no build step, no remote font, no third-party request, no inline script, no `style` attribute; each page
  carries the site's Content-Security-Policy with `script-src 'self'`. The type is the site's own font files, used where they are
  (`../../fonts/`), not copied; their licence is not stated in `fonts/` and was not read by this session.
- Kept from the site (`docs/ROADMAP-v2.md` §8, 11 Nov 2026): the portal tree of the parts, read from `index.html`'s `#portalTree` and
  redrawn as a star chart, and the column of Roman numerals from `data/brief.json`. Not required and replaced: the parchment ground (a cool
  chart paper and a night-navy band instead; a brass accent in place of the site's gold). Kept by choice: the ◆ mark, the mono labels, the
  site's three faces, a Day / Night theme switch.
- "Not recorded" and "unknown" are drawn differently and never as zero; a count of nothing recorded is written as such, not as 0; a card's
  change line appears only where dated records give one, with its window.
- **The dark theme ("Night") has no reference**: USWDS and GOV.UK offer none. It was designed here.
- It depends on `prototypes/editorial/` (`common.js`, `brief.js`, `relations.js`): removing that folder breaks this one.
