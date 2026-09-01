---
name: frontend-implementation
description: Write HTML, CSS and ES modules inside this site's architecture — one fetch gateway, one chrome renderer, tokens first, zero dependencies. Use before touching js/, css/, style.css or any page's markup.
---

# frontend-implementation

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.
The architecture and its reasoning are in `docs/CURRENT-ARCHITECTURE.md`; this skill is how
to work inside it, not a second description of it.

## Purpose

Build and change views without breaking the invariants that make the site's evidence
discipline hold. Most of these are not obvious from the code, and several exist because their
absence already shipped as a bug.

## When to invoke

Adding or changing anything in `js/`, `css/`, `style.css`, `app.js` or a page's markup.

## Scope boundary

| This skill | Not this skill |
|---|---|
| How to build the view | Whether the state reads correctly to a person — `ux-audit` |
| Module and style structure | Whether the data supports it — `data-governance` |
| | Where a fact should live — `knowledge-architecture` |

## The invariants

**No renderer calls `fetch()`.** `js/data.js` is the only module that fetches a dataset. It
owns the cache, the reverse indexes, the taxonomy label lookup, the i18n loaders and
`renderError`. A renderer receives `db` and `ix`; it does not go and get them.

**Failure is contained.** `renderError(mount, err, retry)` shows a clear error, **fabricates
no fallback data**, and leaves surrounding static content alone. Every view on the brief is
individually `try/catch`-wrapped so one failing widget cannot blank the article; `boot.js`
and each page's module are separate entry points so a broken renderer cannot remove the
navigation.

**One chrome renderer.** `js/shell.js` renders header, breadcrumbs, theme, skip target and
search on every page from one `NAV` model. **A page must not add its own header.** Five
hand-copied headers is how one destination came to have two names and a skip link came to
point at an id that existed on one page out of six.

**One evidence renderer.** `js/evidence-view.js` takes a density (`full` / `compact`), not a
caller. It exists because the same source attached to the same claim was drawn in two places
and the two renderings disagreed. Do not add a second.

**Derive, never store.** Grade, pipeline stage, competent authority and key dates come from
`js/format.js`, `js/pipeline.js` and `js/dna.js`. Import the function; do not copy the rule
and do not cache the result into data.

**Tokens, in order.** `css/tokens.css` loads first on all seven pages, then `style.css`,
`css/evidence.css`, `css/tools.css`. A size, gap, surface or status colour comes from tokens.
No colour literal outside `style.css` and `css/tokens.css`; no page-local `<style>`; **a
theme-dependent token is declared on `body`, never `:root`** — at `:root` it resolves against
the night values in day mode, which is invisible in whichever theme you are working in.

**Status is never carried by hue alone.** Every state gets a glyph and a border style too.

**Zero dependencies, zero build, zero third-party requests.** No framework, no bundler, no
service worker, no CDN font or script. `design-qa.mjs` fails the build on an external
stylesheet or script, and this is **RED** under `docs/AI-SAFE-BOUNDARIES.md` §3.

**`localStorage` is always wrapped in `try`** — it throws in private mode, and `design-qa.mjs`
checks for the bare call.

**No i18n path is assembled by string concatenation.** `i18n-audit.mjs` checks this; the
register in `i18n/locales.json` is the only place a locale file is named.

## Procedure

1. Serve over HTTP (`python3 -m http.server 8000`). `file://` blocks modules and fetches.
2. Read the reference implementation for what you are building: `js/instrument-page.js` is
   the model detail page; `js/data.js` for loading; `js/evidence-view.js` for evidence.
3. Add the smallest thing that works, inside the existing module. A new module is justified
   when a second caller exists, not before.
4. Any new `data-i18n` key must be reflected in `i18n/locales.json`, and any gap declared
   `superseded` or `pending_translation`.
5. Run all four validators and compare to the session baseline. **A new warning is a
   finding.** The five pre-existing `design-qa` warnings are listed in
   `docs/CURRENT-ARCHITECTURE.md` §12 so new can be told from old.
6. Check the failure and empty states, not just the happy path, then hand to `ux-audit`.

## Done when

- `design-qa.mjs` 0 errors and no warning beyond the five recorded.
- `i18n-audit.mjs` 0 errors, 0 warnings.
- `validate.mjs` 0 errors.
- No renderer gained a `fetch`, no page gained a header, no fact became stored.

## Refusal conditions

- Do not add a dependency, a build step, a bundler, a framework, a service worker or any
  third-party request. **RED**.
- Do not add a second fetch point, a second chrome renderer or a second evidence renderer.
- Do not change `TIER_GRADE` in `js/format.js` or the derivation rules in `js/pipeline.js` —
  they decide what the whole corpus is said to prove. **RED**.
- Do not render fallback data on failure.
- Do not put a colour literal outside the two files allowed to declare one, or a theme token
  on `:root`.
