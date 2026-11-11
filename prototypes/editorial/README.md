# The Editorial prototype (Post-v2 C, PV2-03)

One of three directions for comparison (`docs/POST-V2.md` §3 C; `docs/FRONTEND-REFERENCES.md` §8.2, direction 1). It is **not published**
(`prototypes/` is not in the allowlist of `tools/pages-artifact.mjs`), **not chosen** (the choice is PV2-05's, with the author's explicit
decision), and the current site remains the baseline. The decisions behind it are in `docs/ROADMAP-v2.md` §8, the rows of PV2-03.

## Run it

From the repository root:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/prototypes/editorial/`. It must be served over HTTP, like the site.

## The four views — the same in PV2-04 and PV2-05

| View | File | Content |
|---|---|---|
| Homepage | `index.html` | the brief's opening, the record counted, the parts |
| Regulation page | `regulation.html?id=ai-act` | the AI Act; **the empty state** is `regulation.html?id=chips-act` |
| Article page | `article.html` | Part V of the brief, read from `../../index.html` |
| Analytical view | `timeline.html` | the timeline (`?instrument=` and `?status=` narrow it; `?instrument=chips-act` is its empty state) and the relationships table |

## What it reads, and what it does not do

- Every dataset through `js/data.js` (the site's single fetch point), in place; the brief's prose from `index.html` (`brief.js`). Nothing is
  copied into this folder.
- It imports `js/format.js`, `js/pipeline.js` (`aggregate()`), `js/evidence-model.js` (through `format.js`), `js/status.js` (the status strip in
  the article) and `js/routes.js`; it re-implements no derivation.
- No dependency, no build step, no remote font, no third-party request, no inline script, no `style` attribute; each page carries the site's
  Content-Security-Policy with `script-src 'self'`. The type is the reader's own system faces (`editorial.css`, `--serif` and `--sans`), so no
  font file and no font licence are involved.
- "Not recorded" (`null`, never researched) and "unknown" (researched, not determinable) are drawn differently and never as zero; a total
  carries the count of what it cannot account for (`aggregate()`).
- The relationships are a fixed table, not the Regulatory Network Explorer, which belongs to the other two concepts (§8, 11 Nov 2026).
- The dark theme has no reference among the scored candidates; it was designed here. The look takes *Open Future* and *Economics Observatory /
  The Pudding* as visual references only (`docs/FRONTEND-REFERENCES.md` §9): nothing of theirs is copied.
