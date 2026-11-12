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
   - **on the core ring, the core instruments** — the same set the masthead counts (`scope_class` `scope:core`) — each placed beside the
     part that reads it (`brief_part` in `data/instruments.json`), the ones with no part recorded along the bottom; **status by shape**
     (filled, half, heavy ring, ring with a dot, dashed …), labelled from `data/taxonomy.json`, never by hue alone;
   - **three outer rings**: the other instruments by `coverage()` (`js/routes.js`) — mapped, watched, excluded;
   - **two lenses**: *Status* and *Falls due next* (dated events in the next 90 days, from `data/timeline.json`, counted in UTC days);
   - hover or focus names a part or an instrument and draws the link between them; **one Tab stop**, the arrow keys walk the parts in
     reading order and then the ring clockwise; the same content as a **list** under the figure (open by default on a phone).
3. **The buttons, the five doors and the state of play**, unchanged: the doors rendered by `js/shell.js`, the bands, the next deadlines,
   the fines and the last-checked line by `js/masthead.js`. The prototype only adds the status marks to the ticker and the bands.

## The opening (about 3 s on a first visit)

| Time | What happens |
|---|---|
| 0–0.3 s | The site icon appears at the centre, upside down. |
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
counter-clockwise; in Night the serpent keeps a fine light contour. **These decisions are not yet recorded in `docs/ROADMAP-v2.md` §8**,
and how this prototype relates to PV2-05 (`docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`) is not decided.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: the site's CSP (`script-src 'self'`, no inline script, no `style` attribute), `noindex`, the site's four stylesheets in the site's order. |
| `homepage.js` | The figure, its opening, the lenses, the list, the marks on the ticker and bands. Imports `js/data.js`, `js/routes.js`, `js/shell.js`, `js/masthead.js`, `js/palette.js` and `prototypes/editorial/brief.js` unchanged. |
| `homepage.css` | Layout and the figure's styles, in the site's tokens only. |
| `assets/serpent-body-day.png` · `assets/serpent-body-night.png` · `assets/serpent-beads.json` | **Derived from `img/icons/icon-512.png`** for the opening: the serpent without its gold disc, its beads painted over (Day); the same with the body lifted to `--ink-2` and a fine `--paper-dim` contour, computed at 4096 px and saved at 1024 px (Night); and the geometry of the 22 beads, measured once from the icon. Artwork, not records. |

## What was checked, 12 Nov 2026

In headless Chromium (Playwright) against `python3 -m http.server`: 1440 × 900 and 390 × 844, Day and Night — no console error, no CSP
violation, only `localhost` requested, no horizontal scroll; 13 tree nodes, 16 core instruments, 23 outer instruments and 5 status bands,
as the data gives them. The opening plays on a first visit and not on the next; it ends with the mark removed from the drawing; with reduced
motion the final state is drawn at once and no animation runs. Keyboard: the figure is one Tab stop, Tab reaches Part I, the arrow keys move
and the caption follows the focus. The site's validators were run with the prototype in place: `validate`, `i18n-audit`, `design-qa`,
`freshness`, `evidence-audit`, `seo-audit` all exit 0 with 0 errors, and the warnings (5 and 11) are those of the same commit without the
prototype.

## What was not checked

- **Contrast was not measured** inside the figure (ring labels in `--paper-faint`, dashed dots, the Night contour); it was judged by eye.
- **No screen reader** was run; names and roles are read from the markup, not heard.
- **Other browsers and low-density screens**: Chromium only. The Night contour is about 0.7 px on screen and may break up on a
  non-retina display.
- **Performance** of the opening on a slow device was not timed.
- **Languages**: English only; the site's it / fr / es editions are not wired.
- **Sharpness of the serpent**: it is enlarged from the 512 px icon. A vector drawing of the serpent would make it sharp and would make the
  Night contour an exact stroke instead of a raster file.
- **Not built**: the *Enforcement* and *Relationships* lenses of the earlier design.
