# CLAUDE.md

**Read `AGENTS.md` first — it is the operating constitution and it binds you.**
This file adds only what is specific to working here with Claude Code.

## Orientation

Static site, no build step, no dependencies, no runtime, no third-party
requests. Serve it, don't open it:

```
python3 -m http.server 8000     # http://localhost:8000
```

`file://` breaks it — ES modules and the `fetch` of `data/*.json` are both
blocked by the protocol.

- **Facts** → `data/*.json`. **Prose** → `index.html`. **Chrome** →
  `js/shell.js`. **Tokens** → `css/tokens.css`, loaded first, always.
- `app.js` (root, 1,455 lines, IIFE, `var`) is a *second, older* architecture
  that owns the brief's own top bar, portal, rota and prose search, coupled to
  `js/` by DOM id and the `window.__CONTENT__` global. Treat it as known debt,
  not as a pattern.

## Read the code before trusting the documentation

`README.md` is unusually honest and mostly accurate — I re-derived its four
headline counts and all four reproduce. It is still not authoritative:

- It says *"There is no generator."* `app.js:588` carries a runtime workaround
  for that generator's output. Both cannot be true.
- It says `design-qa.mjs` *"can gate a commit."* Nothing gates anything —
  there is no CI, no `package.json`, no git hook.
- Its four derived counts are typed into Markdown and checked by nothing,
  under a sentence claiming they cannot drift.

`docs/AUDIT-2026-09-01.md` has the evidence for each. When code and prose
disagree, **the code is what ships.**

## Before you change anything

```
node tools/validate.mjs && node tools/i18n-audit.mjs && \
node tools/freshness.mjs && node tools/design-qa.mjs
```

Run all four before *and* after. Report both, warnings included. If a warning
count moved, say which and why.

## Traps specific to this repository

- **`index.html` holds a second copy of the facts.** ~60 KB of
  `window.__CONTENT__` at line 361: all 14 part titles (byte-identical to
  `brief.json`), instrument names, and a full copy of the prose. **No validator
  reads it.** Change prose and you must change both.
- **It uses different IDs.** `aiact` / `dataact` there; `ai-act` / `data-act`
  canonically, and neither short form is a declared alias.
- **`tools/_refsweep.mjs` and `tools/_review10.mjs` are loaded guns.** One-shot
  patches, still runnable, hardcoded to `2026-08-28`, overwriting
  `last_verified` and deleting `reference_gap` with no dry-run and no backup.
  Class D. Do not run them.
- **Editing a `data-i18n` string invalidates three translations.** Declare the
  key `superseded` in *every* locale holding the old text. The locales are
  already asymmetric on `annex-a.figcaption1` and `i18n-audit.mjs` cannot see
  it.
- **`--foo:` anywhere in a JS string or comment silences a real
  `design-qa.mjs` error.** Its clean run is weaker evidence than it reads.
- **`freshness.mjs` fetches nothing.** Its `SOURCE REACHABILITY` section counts
  a stored field. No URL here has ever been tested.
- **Derived output depends on the clock.** `isPast` compares against
  `new Date().toISOString()` in UTC, so pipeline stages, the calendar and the
  status strips change with when and where a page is opened. Date your reports.
- **Theme tokens go on `body`, never `:root`** — the day palette is a `<body>`
  attribute. This has shipped as a bug twice.

## Git

Work on the designated feature branch. Never `main`, never force-push, never
bulk-delete-and-re-upload. One logical change per commit with a real message —
the existing 47 commits say only "Add files via upload" and "Delete …", so
`git blame` currently answers nothing, and your commits are the rollback path
that `docs/AUTONOMY-POLICY.md` §4 requires.

## Tone

Match the repository. It states its own limits plainly, corrects itself in
public, and does not flatter its own numbers. Do the same: say what you checked,
say what you did not, and leave the gaps visible rather than arguing them away.
