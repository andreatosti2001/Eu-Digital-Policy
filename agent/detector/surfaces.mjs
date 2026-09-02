/* ============================================================
   agent/detector/surfaces.mjs — which datasets a change touches, and
   which pages would render it

   The brief requires every detected change to name its affected
   datasets and its affected pages. The datasets follow from the
   entity: a timeline event lives in data/timeline.json and nowhere
   else, and `agent/integrate/canonical.mjs` already owns that map.

   THE PAGES ARE THE INTERESTING HALF, AND THEY ARE DERIVED.
   docs/CURRENT-ARCHITECTURE.md §5 carries a table of which page
   loads which dataset, and it says in its own header that it was
   "read from the loadAll / load call sites, not assumed". Copying
   that table into this module would create the second home the
   whole architecture exists to prevent — and it would go stale the
   first time a page loaded one more dataset, silently, because
   nothing compares the two.

   So this module reads the same call sites the document did:

     1. each *.html at the repository root names its entry modules
        in <script src="js/….js">
     2. each module's static imports are followed, transitively, so a
        page inherits every dataset anything it loads needs
     3. every `loadAll([...])` and `load('…')` literal in a reachable
        module is collected, including the one-hop constant
        indirection `js/main.js` uses

   THE CHROME IS COUNTED SEPARATELY, AND THAT DISTINCTION IS THE
   WHOLE VALUE OF THE FIELD. `js/boot.js` starts `initShell` and
   `initPalette` on every page but the brief, and the palette pulls
   in `js/search.js`, which loads seven datasets. Walked naively,
   every page therefore "loads" almost everything and
   `affected_pages` degenerates into a list of all seven pages every
   time — true, and useless.

   So the walk stops at the chrome modules, and what they reach is
   reported apart. A page's `affected_pages` entry means **a view on
   that page renders the changed value**, which is what §5's table
   means and what a reviewer needs. That the command palette also
   indexes several datasets site-wide — so a stale value is
   *discoverable* on every page even where no view renders it — is
   real and is carried as a caveat rather than folded into the
   number.

   The result is checked against §5 by the suite, so a drift between
   the code and the document is a test failure rather than a silent
   disagreement. That is the only shape this repository permits a
   duplicate to take: one generator, and a check that fails on
   divergence (DATA-GOVERNANCE §5).

   WHAT THIS DELIBERATELY DOES NOT DO. It does not follow dynamic
   imports, and it does not know that `index.html` renders part of
   its content from the inlined `window.__CONTENT__` blob rather
   than from `data/brief.json`. Both are named as limitations in
   docs/CHANGE-DETECTOR.md rather than papered over; the second is
   the known `__CONTENT__` bypass, and a detector that claimed to
   know what `index.html` renders would be claiming to have resolved
   it.
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../schemas/types.mjs';
import { HOME_OF } from '../integrate/canonical.mjs';

export { HOME_OF };

const JS_DIR = join(REPO_ROOT, 'js');

/**
 * The chrome: rendered on every page from one nav model, and not
 * part of what any particular page's views show. The walk stops
 * here.
 *
 * `search.js` is in the list because it is reached only through the
 * palette. If a page ever imports it directly, that page's own
 * datasets will include it — the list names modules, not a promise
 * about who imports them.
 */
export const CHROME_MODULES = ['boot.js', 'shell.js', 'palette.js', 'search.js'];

/** `<script … src="js/foo.js">` — the entry modules a page loads.
 *  `app.js` sits at the root rather than in js/ and loads no
 *  dataset; it is picked up and simply contributes nothing. */
function entryModulesOf(html) {
  return [...String(html).matchAll(/<script[^>]*\ssrc="([^"]+\.js)"/g)].map((m) => m[1]);
}

/** Static `import … from './x.js'` only. A dynamic import would not
 *  be found, and that is recorded as a limitation rather than
 *  guessed at. */
function importsOf(src) {
  return [...src.matchAll(/^\s*import\s+[^;]*?from\s+'\.\/([A-Za-z0-9_-]+\.js)'/gm)].map((m) => m[1]);
}

/**
 * Dataset names a module asks `js/data.js` for.
 *
 * Two shapes, both literal: `loadAll(['a', 'b'])` — possibly across
 * several lines — and `load('a')`. Plus exactly one indirection:
 * `loadAll(NAME)` where `NAME` is a `const NAME = [...]` in the same
 * file, which is what `js/main.js` does. The indirection is resolved
 * ONE hop and no further: a chain this module followed silently
 * would be a chain nobody reviewing it could see the end of.
 */
function datasetsIn(src) {
  const found = new Set();
  const literal = (body) => {
    for (const m of body.matchAll(/'([a-z]+)'/g)) found.add(m[1]);
  };

  for (const m of src.matchAll(/loadAll\(\s*\[([\s\S]*?)\]\s*\)/g)) literal(m[1]);
  for (const m of src.matchAll(/\bload\(\s*'([a-z]+)'\s*\)/g)) found.add(m[1]);

  for (const m of src.matchAll(/loadAll\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g)) {
    const decl = new RegExp(`const\\s+${m[1]}\\s*=\\s*\\[([\\s\\S]*?)\\]`).exec(src);
    if (decl) literal(decl[1]);
  }
  return found;
}

/**
 * Build the map by reading the code.
 *
 * @returns {{pageToDatasets: Map<string, Set<string>>,
 *            datasetToPages: Map<string, string[]>,
 *            moduleDatasets: Map<string, Set<string>>,
 *            unresolved: string[]}}
 *   `unresolved` names any module a page loads that could not be
 *   read — an entry point this map does not cover, reported rather
 *   than dropped.
 */
export function buildPageMap({ root = REPO_ROOT } = {}) {
  const pages = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  const moduleDatasets = new Map();
  const unresolved = [];

  const readModule = (name) => {
    const p = join(JS_DIR, name);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  };

  /** Datasets a module needs, including everything it imports.
   *  `stopAtChrome` is what keeps the palette out of every page's
   *  answer; passing false walks the same graph without it, which is
   *  how the chrome's own reach is measured. */
  const datasetsFor = (name, { stopAtChrome = true, seen = new Set() } = {}) => {
    if (seen.has(name)) return new Set();
    seen.add(name);

    const src = readModule(name);
    if (src === null) return new Set();

    const out = datasetsIn(src);
    for (const dep of importsOf(src)) {
      if (stopAtChrome && CHROME_MODULES.includes(dep)) continue;
      for (const d of datasetsFor(dep, { stopAtChrome, seen })) out.add(d);
    }
    moduleDatasets.set(name, out);
    return out;
  };

  /* What the shared chrome reaches, measured once. Every page gets
     it, so it distinguishes nothing between pages — which is
     precisely why it is not part of any page's answer. */
  const chromeDatasets = new Set();
  for (const name of CHROME_MODULES) {
    if (readModule(name) === null) continue;
    for (const d of datasetsFor(name, { stopAtChrome: false, seen: new Set() })) chromeDatasets.add(d);
  }

  const pageToDatasets = new Map();
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    const set = new Set();
    for (const src of entryModulesOf(html)) {
      if (!src.startsWith('js/')) continue;            // app.js: no dataset gateway
      const name = src.slice(3);
      if (readModule(name) === null) { unresolved.push(`${page} → ${src}`); continue; }
      if (CHROME_MODULES.includes(name)) continue;     // counted apart, see above
      for (const d of datasetsFor(name, { seen: new Set() })) set.add(d);
    }
    pageToDatasets.set(page, set);
  }

  const datasetToPages = new Map();
  for (const [page, sets] of pageToDatasets) {
    for (const d of sets) {
      if (!datasetToPages.has(d)) datasetToPages.set(d, []);
      datasetToPages.get(d).push(page);
    }
  }
  for (const [, list] of datasetToPages) list.sort();

  return { pageToDatasets, datasetToPages, moduleDatasets, chromeDatasets, unresolved };
}

/* One read per process. The map is a property of the code on disk,
   and the code does not change under a running detector. */
let _map = null;
export const pageMap = ({ root = REPO_ROOT } = {}) => (_map ??= buildPageMap({ root }));

/** Reset, for the suite. */
export const forgetPageMap = () => { _map = null; };

/**
 * Every dataset a change to these entities would touch.
 *
 * Read from the entity kinds rather than from the change kind: what
 * file a fact lives in is a property of the fact, and
 * `agent/integrate/canonical.mjs` is its one home.
 */
export function affectedDatasets(entities) {
  const out = new Set();
  for (const e of entities ?? []) {
    const home = HOME_OF[e?.kind];
    if (home) out.add(home);
  }
  return [...out].sort();
}

/**
 * Every page that would render a change to these datasets.
 *
 * `data/brief.json` is deliberately excluded even though
 * `index.html` renders the brief: nothing fetches `brief.json` at
 * runtime, and the page reads an inlined copy instead
 * (CURRENT-ARCHITECTURE §8, the `__CONTENT__` bypass). Claiming
 * `index.html` renders it would be claiming the bypass is resolved.
 * The exclusion is returned as a caveat rather than being silent.
 */
export function affectedPages(datasets, { root = REPO_ROOT } = {}) {
  const { datasetToPages, chromeDatasets } = pageMap({ root });
  const out = new Set();
  const caveats = [];

  const inChrome = (datasets ?? [])
    .map((p) => String(p).replace(/^data\//, '').replace(/\.json$/, ''))
    .filter((n) => chromeDatasets.has(n));
  if (inChrome.length) {
    caveats.push(`${inChrome.join(', ')} ${inChrome.length === 1 ? 'is' : 'are'} also indexed by the command palette, which js/boot.js starts on every page. A stale value there is DISCOVERABLE site-wide through search even on pages whose own views do not render it. That is not the same as a page rendering it, and it is recorded here rather than folded into the page list, which would otherwise name all seven pages every time and distinguish nothing.`);
  }
  for (const path of datasets ?? []) {
    const name = String(path).replace(/^data\//, '').replace(/\.json$/, '');
    const pages = datasetToPages.get(name);
    if (pages) { for (const p of pages) out.add(p); continue; }
    caveats.push(name === 'brief'
      ? 'data/brief.json is loaded by no module. index.html renders the brief from the inlined window.__CONTENT__ blob instead, which has already drifted from the canonical file (CURRENT-ARCHITECTURE §8). Which pages a change to brief.json reaches is therefore not answerable from the load call sites, and this detector does not guess.'
      : `No module loads data/${name}.json, so no page was found for it. That is either a dataset nothing renders or a gap in this map — it is reported rather than resolved.`);
  }
  return { pages: [...out].sort(), caveats };
}
