/* ============================================================
   agent/ux/surface.mjs — the interface, read as a structure

   `agent/architect/model.mjs` reads `data/` for what it CAN say.
   This reads the pages, the stylesheets and the modules for what a
   reader can DO with them: which controls exist and how they are
   built, which states are drawn and by which channels, where a
   destination is reachable from, what happens at each breakpoint,
   and which page carries a translated string.

   Everything here is READ. There is no write path in this
   directory, the suite scans every module for one, and the CLI
   hashes `data/` around a full run the way `agent/architect/` and
   `agent/depth/` are held. This agent additionally hashes every
   `*.html`, `style.css` and `css/*.css`, because it is the first
   agent whose subject IS those files.

   ------------------------------------------------------------
   FOUR THINGS THIS DELIBERATELY DOES NOT DO

   IT DOES NOT OPEN A BROWSER. There is none here, there is no
   dependency budget for one (`docs/AI-SAFE-BOUNDARIES.md` §3), and
   a headless run would not be a screen-reader pass anyway. So every
   record this agent emits carries the same open question, and
   `README` limitation 7 is quoted rather than paraphrased: no
   screen reader has ever been run against this site, and
   programmatic verification is not the same thing. A finding here
   is a finding ABOUT THE SOURCE, and it says so.

   IT DOES NOT COMPUTE CONTRAST. `css/tokens.css` carries measured
   contrast ratios in its comments, taken by whoever wrote them.
   Reading a number out of a comment and presenting it as a
   measurement this run made would be the most persuasive kind of
   fabrication available here, so a comment is quoted as a comment
   and `accessibility.contrast_checked` is false on every record.

   IT DOES NOT READ THE PROSE. What the brief argues is
   `agent/proposals/editorial/`'s, and the boundary module says so.
   The pages are read as MARKUP.

   IT DOES NOT RE-RUN design-qa. `tools/design-qa.mjs` checks
   structure and its result has one home. This looks at what that
   check cannot see, and lens 10 measures the distance between the
   two rather than restating either.
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The stylesheets, in the order every page loads them. `tokens.css`
 *  is first by design — `design-qa.mjs` errors when it is not — and
 *  a later sheet may override a component deliberately. */
export const SHEETS = ['css/tokens.css', 'style.css', 'css/evidence.css', 'css/tools.css'];

/** Where a colour may be declared. Same two files `design-qa.mjs`
 *  names, imported as a fact about the repository rather than a
 *  second opinion about it. */
export const COLOUR_HOMES = new Set(['style.css', 'css/tokens.css']);

/** The non-colour channels a state may also be carried by. A state
 *  that varies one of these survives greyscale, a monochrome print
 *  and a red-green deficiency; a state that varies only `color`
 *  does not. `opacity` is on the list and it is the weakest member:
 *  it survives greyscale and it does not survive a low-contrast
 *  display, so a state carried by opacity alone is reported as
 *  weaker rather than as clear. */
export const NON_COLOUR_CHANNELS = [
  'content', 'border-style', 'font-style', 'font-weight', 'text-decoration',
  'text-decoration-line', 'opacity', 'background-image', 'outline-style', 'filter',
];

const read = (rel) => readFileSync(join(REPO_ROOT, rel), 'utf8');
const exists = (rel) => existsSync(join(REPO_ROOT, rel));

/** Strip comments, keeping byte offsets stable so a line number
 *  computed against the stripped text still points at the source. */
const decomment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

/** 1-based line number of an offset. Every finding this agent makes
 *  cites a file AND a line, because "somewhere in tools.css" is not
 *  a locator a reviewer can check. */
export function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

/* ============================================================
   1 · the pages
   ============================================================ */

/**
 * Every page, read as markup: what it loads, what it declares, what
 * it says when JavaScript is off, and how much of it is inline.
 *
 * `data-page` is the page's own id in the nav model. A page that
 * does not declare one is not a defect — `index.html` does not, and
 * `js/shell.js` derives it from the filename — but it is a fact the
 * lenses ask about.
 */
export function pagesOf({ root = REPO_ROOT } = {}) {
  const files = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  return files.map((page) => {
    const src = readFileSync(join(root, page), 'utf8');
    const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    return {
      page,
      src,
      bytes: Buffer.byteLength(src, 'utf8'),
      data_page: (src.match(/<body[^>]*data-page="([^"]+)"/) ?? [])[1] ?? null,
      modules: [...src.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]).sort(),
      stylesheets: [...src.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]),
      ids,
      /* Outbound internal links, for the reachability graph. A page
         nothing links to is reachable only by typing its address. */
      /* RELATIVE links only. The canonical URL and the og: tags name
         this page's own absolute address and are not navigation; a
         graph that counted them would report every page as linking
         to itself and find the site well connected. */
      links: [...new Set([...src.matchAll(/href="(?!https?:|\/\/|mailto:|data:|#)([^"?#]*?\.html)(?:[?#][^"]*)?"/g)].map((m) => m[1]))].sort(),
      i18n_keys: [...src.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]),
      has_skip_link: /class="skip-link"/.test(src),
      /* The one inlined blob, measured. What it SAYS is
         data/brief.json's business and agent/proposals/editorial/'s
         finding; that it is 59.8 KB of duplicated content in the
         page a reader downloads first is this agent's. */
      inline_content_bytes: inlineContentBytes(src),
      noscript: (src.match(/<noscript>([\s\S]*?)<\/noscript>/) ?? [])[1]?.trim() ?? null,
      /* Every element that carries a title attribute and no
         aria-label. The accessible-name computation only falls back
         to `title` when there is no content, and a title never
         reaches a touch reader at all. */
      title_only: [...src.matchAll(/<([a-z]+)\b([^>]*\btitle="([^"]*)"[^>]*)>/g)]
        .filter((m) => !/aria-label=/.test(m[2]))
        .map((m) => ({ tag: m[1], title: m[3], line: lineAt(src, m.index) })),
    };
  });
}

function inlineContentBytes(src) {
  const at = src.indexOf('window.__CONTENT__');
  if (at === -1) return 0;
  const end = src.indexOf('</script>', at);
  return end === -1 ? 0 : Buffer.byteLength(src.slice(at, end), 'utf8');
}

/* ============================================================
   2 · the stylesheets
   ============================================================ */

/**
 * Every rule, flattened: its selector, its declarations, the file
 * and the line. Nested at-rules keep the condition they sit under,
 * because "hidden at 820px" and "hidden" are different facts.
 *
 * A hand-written brace walker rather than a regex, because a media
 * query's body contains braces and a regex over 120 KB of CSS that
 * gets that wrong reports rules that do not exist. Zero dependency,
 * as everything in this repository is.
 */
export function rulesOf(file, css) {
  const src = decomment(css);
  const out = [];
  const stack = [];
  let i = 0;
  let start = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const head = src.slice(start, i).trim();
      if (head.startsWith('@')) {
        stack.push(head.replace(/\s+/g, ' '));
        i++; start = i; continue;
      }
      let depth = 1;
      let j = i + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
        j++;
      }
      const body = src.slice(i + 1, j - 1);
      out.push({
        file,
        line: lineAt(src, start),
        selector: head.replace(/\s+/g, ' '),
        at: [...stack],
        declarations: declarationsOf(body),
        body: body.trim(),
      });
      i = j; start = i; continue;
    }
    if (ch === '}') { stack.pop(); i++; start = i; continue; }
    i++;
  }
  return out;
}

export function declarationsOf(body) {
  const out = [];
  for (const chunk of body.split(';')) {
    const at = chunk.indexOf(':');
    if (at === -1) continue;
    const prop = chunk.slice(0, at).trim();
    if (!prop || /[{}]/.test(prop) || /\s/.test(prop)) continue;
    out.push({ prop, value: chunk.slice(at + 1).trim() });
  }
  return out;
}

/** Every stylesheet, parsed once. */
export function stylesheetsOf({ root = REPO_ROOT } = {}) {
  return SHEETS.filter((f) => existsSync(join(root, f))).map((file) => {
    const css = readFileSync(join(root, file), 'utf8');
    return { file, css, bytes: Buffer.byteLength(css, 'utf8'), rules: rulesOf(file, css) };
  });
}

/* ============================================================
   3 · the state selectors — how a state is drawn
   ============================================================ */

/** `[data-thing="value"]` inside a selector: the site's own way of
 *  saying "this element is in this state". */
const STATE_ATTR = /\[data-([a-z-]+)=("|')([^"']+)\2\]/g;

/**
 * Every rule that styles a STATE, with the channels it varies.
 *
 * The question a lens asks of this is not "does it set a colour" but
 * "is colour the only thing that changes between one state and its
 * siblings" — which is why the channels are collected per
 * (component, attribute, value) rather than per rule. A component
 * whose glyph is set once on the base class and whose hue varies per
 * state is carrying the state by hue alone; a component whose glyph
 * varies per state is not. Only the second reads in greyscale.
 */
export function stateSelectorsOf(sheets) {
  const rows = [];
  for (const sheet of sheets) {
    for (const rule of sheet.rules) {
      const matches = [...rule.selector.matchAll(STATE_ATTR)];
      if (!matches.length) continue;
      /* A theme attribute is not a state of a component; it is the
         palette the whole document is in. Excluded by name rather
         than by heuristic. */
      const states = matches.filter((m) => m[1] !== 'theme');
      if (!states.length) continue;
      const props = rule.declarations.map((d) => d.prop);
      rows.push({
        file: rule.file,
        line: rule.line,
        selector: rule.selector,
        at: rule.at,
        attr: states[0][1],
        value: states[0][3],
        /* Everything before the state attribute, which is the
           component the state belongs to. */
        component: componentOf(rule.selector, states[0][0]),
        /* Whether the styled element IS the one carrying the state,
           or a descendant of it. A descendant's own text is not the
           state word, which is what makes the distinction matter. */
        styles_descendant: /\]\s*[.#a-z:]/i.test(rule.selector.slice(rule.selector.indexOf(states[0][0]))),
        props,
        colour_only: props.length > 0 && props.every((p) => p === 'color'),
        non_colour: props.filter((p) => NON_COLOUR_CHANNELS.includes(p)),
        declarations: rule.declarations,
      });
    }
  }
  return rows;
}

/** The class the state hangs off — `.badge` from
 *  `.badge[data-st="verified"]::before`. */
export function componentOf(selector, attrText) {
  const head = selector.slice(0, selector.indexOf(attrText));
  const last = head.split(/[\s>+~,]/).filter(Boolean).pop() ?? head;
  const cls = last.match(/\.[A-Za-z][\w-]*/g);
  return cls ? cls[cls.length - 1] : (last || null);
}

/* ============================================================
   4 · the modules
   ============================================================ */

/** Every script in the interface: the ES modules under `js/` and
 *  the one classic script, `app.js`. Both are read, because the
 *  split between them is itself a finding this agent can make. */
export function modulesOf({ root = REPO_ROOT } = {}) {
  const out = [];
  const dir = join(root, 'js');
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
      out.push({ path: `js/${f}`, kind: 'module', src: readFileSync(join(dir, f), 'utf8') });
    }
  }
  if (existsSync(join(root, 'app.js'))) {
    out.push({ path: 'app.js', kind: 'classic_script', src: readFileSync(join(root, 'app.js'), 'utf8') });
  }
  return out.map((m) => ({
    ...m,
    bytes: Buffer.byteLength(m.src, 'utf8'),
    imports: [...m.src.matchAll(/from\s+'([^']+)'/g)].map((x) => x[1]),
    /* The classes this module emits into the DOM, so a state rule in
       a stylesheet can be traced back to the code that draws it. */
    classes: new Set([...m.src.matchAll(/class="([^"'+]*)"/g)].flatMap((x) => x[1].trim().split(/\s+/)).filter(Boolean)),
    aria: [...new Set([...m.src.matchAll(/'(aria-[a-z]+)'|"(aria-[a-z]+)"/g)].map((x) => x[1] ?? x[2]))],
  }));
}

/**
 * Where a class is emitted, with the template that surrounds it.
 *
 * Used to answer one question and only one: when a state is drawn by
 * colour, does the element's own TEXT name the state? The answer
 * decides whether a colour-only rule is a defect or a decoration,
 * and getting it wrong in either direction would be a fabricated
 * finding or a missed one.
 */
export function emissionsOf(modules, className) {
  const bare = String(className).replace(/^\./, '');
  const hits = [];
  const needle = new RegExp(`class=("|')([^"'+]*\\b${bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^"'+]*)`, 'g');
  for (const m of modules) {
    for (const found of m.src.matchAll(needle)) {
      /* The template from the class attribute to the next closing
         tag: everything the element will contain. Bounded, because a
         run-away match would carry half a module into a record. */
      const after = m.src.slice(found.index, found.index + 700);
      const close = after.indexOf('</');
      hits.push({
        module: m.path,
        line: lineAt(m.src, found.index),
        template: (close === -1 ? after.slice(0, 240) : after.slice(0, close)).replace(/\s+/g, ' ').trim(),
      });
    }
  }
  return hits;
}

/**
 * Which modules each page actually ends up running.
 *
 * A page names two scripts and gets twenty: `js/main.js` imports
 * eleven modules and they import more. Every lens that asks "does
 * this page have a dialog / a palette / an evidence drawer" needs
 * the transitive set, and a lens that used the two names in the
 * markup would answer no for every page.
 *
 * Unresolvable imports are RETURNED rather than dropped. An import
 * this walker could not follow is a hole in every answer derived
 * from it, and a graph that hid its holes would let a lens report
 * "no page loads this" about a module every page loads.
 */
export function moduleGraphOf(pages, modules) {
  const by = new Map(modules.map((m) => [m.path, m]));
  const unresolved = [];
  const resolve = (from, spec) => {
    if (!spec.startsWith('.')) return null;
    const base = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
    const parts = `${base}/${spec}`.split('/');
    const out = [];
    for (const seg of parts) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') out.pop();
      else out.push(seg);
    }
    return out.join('/');
  };
  const closure = (entries) => {
    const seen = new Set();
    const queue = [...entries];
    while (queue.length) {
      const path = queue.shift();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const mod = by.get(path);
      if (!mod) continue;
      for (const spec of mod.imports) {
        const target = resolve(path, spec);
        if (target === null) continue;
        if (!by.has(target)) { unresolved.push({ from: path, spec }); continue; }
        queue.push(target);
      }
    }
    return [...seen].sort();
  };
  const byPage = new Map();
  for (const p of pages) byPage.set(p.page, closure(p.modules.filter((m) => by.has(m))));
  return { byPage, unresolved, pagesLoading: (path) => [...byPage.entries()].filter(([, set]) => set.includes(path)).map(([page]) => page).sort() };
}

/* ============================================================
   5 · the breakpoints
   ============================================================ */

/**
 * Every viewport condition any stylesheet actually uses, with what
 * it does at that width.
 *
 * The site declares no breakpoint vocabulary — there is no
 * `--bp-md` — so the set of widths is whatever the sheets happen to
 * contain, and that is exactly the fact a lens wants: three widths
 * used once each are three magic numbers, and a component that
 * changes at 720 while its sibling changes at 820 changes at
 * different times on the same screen.
 */
export function breakpointsOf(sheets) {
  const by = new Map();
  for (const sheet of sheets) {
    for (const rule of sheet.rules) {
      for (const cond of rule.at) {
        for (const m of cond.matchAll(/\((max|min)-width\s*:\s*(\d+)px\)/g)) {
          const key = `${m[1]}-width:${m[2]}px`;
          if (!by.has(key)) by.set(key, { key, dir: m[1], px: Number(m[2]), rules: [], files: new Set() });
          const e = by.get(key);
          e.rules.push({ file: rule.file, line: rule.line, selector: rule.selector, at: rule.at, declarations: rule.declarations });
          e.files.add(rule.file);
        }
      }
    }
  }
  return [...by.values()]
    .map((e) => ({ ...e, files: [...e.files].sort() }))
    .sort((a, b) => a.px - b.px || a.dir.localeCompare(b.dir));
}

/* ============================================================
   6 · the reachability graph
   ============================================================ */

/**
 * How many places link to each page, and from where.
 *
 * A link that only exists because a module BUILDS it is counted
 * separately from one written into the markup, because the two fail
 * differently: the second survives a JavaScript error and the first
 * does not, and `<noscript>` on every page already concedes that the
 * tools do not work without scripting.
 */
export function reachabilityOf(pages, modules) {
  const inbound = new Map(pages.map((p) => [p.page, { page: p.page, from_markup: [], from_module: [] }]));
  for (const p of pages) {
    for (const href of p.links) {
      if (!inbound.has(href) || href === p.page) continue;
      inbound.get(href).from_markup.push(p.page);
    }
  }
  for (const m of modules) {
    /* A module builds a link by concatenation more often than it
       writes one whole — `'instrument.html?id=' + id` is the only way
       the instrument page is ever reached — so the query string is
       matched and discarded rather than required to be absent. */
    for (const found of m.src.matchAll(/['"]([a-z][a-z0-9-]*\.html)(?:[?#][^'"]*)?['"]/g)) {
      if (inbound.has(found[1])) inbound.get(found[1]).from_module.push(m.path);
    }
  }
  for (const e of inbound.values()) {
    e.from_markup = [...new Set(e.from_markup)].sort();
    e.from_module = [...new Set(e.from_module)].sort();
    e.total = e.from_markup.length + e.from_module.length;
  }
  return [...inbound.values()].sort((a, b) => a.total - b.total || a.page.localeCompare(b.page));
}

/* ============================================================
   7 · localisation
   ============================================================ */

/** The locale register, and what each page carries of it. The
 *  register is canonical (`i18n/locales.json` says so in its own
 *  `$description`); nothing here recomputes a key count that file
 *  already holds. */
export function localisationOf(pages, { root = REPO_ROOT } = {}) {
  const registerPath = 'i18n/locales.json';
  const register = existsSync(join(root, registerPath))
    ? JSON.parse(readFileSync(join(root, registerPath), 'utf8'))
    : null;
  const locales = (register?.locales ?? []).map((l) => ({
    code: l.code,
    label: l.label,
    file: l.file ?? null,
    keys: l.keys ?? null,
    complete: l.complete === true,
    superseded: (l.superseded ?? []).length,
    pending: (l.pending_translation ?? []).length,
    note: l.note ?? null,
  }));
  return {
    register_path: registerPath,
    locales,
    shipped: locales.filter((l) => l.file).map((l) => l.code),
    by_page: pages.map((p) => ({ page: p.page, keys: p.i18n_keys.length })),
    translated_pages: pages.filter((p) => p.i18n_keys.length).map((p) => p.page),
    untranslated_pages: pages.filter((p) => !p.i18n_keys.length).map((p) => p.page),
  };
}

/* ============================================================
   8 · the design system
   ============================================================ */

/**
 * Every custom property, where it is declared and what it is
 * declared ON.
 *
 * `body` versus `:root` is not a style question here: the day
 * palette is an attribute on `<body>`, so a theme-dependent token at
 * `:root` resolves against the night values in day mode. That has
 * shipped twice, `design-qa.mjs` errors on it, and this records the
 * scope so a proposal can be held to it before it is written rather
 * than after.
 */
export function tokensOf(sheets, pages, modules) {
  const declared = new Map();
  const record = (name, where) => {
    if (!declared.has(name)) declared.set(name, { token: name, declarations: [] });
    declared.get(name).declarations.push(where);
  };
  for (const sheet of sheets) {
    for (const rule of sheet.rules) {
      for (const d of rule.declarations) {
        if (d.prop.startsWith('--')) {
          record(d.prop, { file: rule.file, line: rule.line, scope: rule.selector, at: rule.at, value: d.value });
        }
      }
    }
  }
  /* Set from the markup and from JavaScript too — the tree
     animation passes its index and the rota its geometry as inline
     custom properties, and a checker that does not know that reports
     the whole animation layer as undeclared. Same allowance
     design-qa.mjs makes, for the same reason. */
  for (const p of pages) {
    for (const m of p.src.matchAll(/style="[^"]*?(--[a-z0-9-]+)\s*:/gi)) record(m[1], { file: p.page, line: lineAt(p.src, m.index), scope: 'inline style attribute', at: [], value: null });
  }
  for (const mod of modules) {
    for (const m of mod.src.matchAll(/setProperty\(\s*['"](--[a-z0-9-]+)/gi)) record(m[1], { file: mod.path, line: lineAt(mod.src, m.index), scope: 'setProperty', at: [], value: null });
  }

  const used = new Map();
  for (const sheet of sheets) {
    for (const m of sheet.css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/gi)) {
      if (!used.has(m[1])) used.set(m[1], { token: m[1], uses: 0, fallback: !!m[2], first: { file: sheet.file, line: lineAt(sheet.css, m.index) } });
      used.get(m[1]).uses++;
    }
  }

  const themed = new Set();
  for (const [name, e] of declared) {
    if (e.declarations.some((d) => /^body/.test(String(d.scope)) || /body\[data-theme/.test(String(d.scope)))) themed.add(name);
  }

  return {
    declared,
    used,
    /* A token whose value differs between the two theme scopes: the
       design system's own answer to "what changes with the theme". */
    theme_dependent: [...themed].sort(),
    scale: [...declared.keys()].filter((n) => (declared.get(n).declarations ?? []).some((d) => String(d.scope).trim() === ':root')).sort(),
  };
}

/* ============================================================
   8b · the three absences, as the datasets actually keep them
   ============================================================ */

/**
 * Which canonical fields carry `null`, which carry `"unknown"`, and
 * which carry both.
 *
 * This is the only thing this agent reads `data/` for, and it reads
 * it for one question: WHICH DISTINCTIONS DOES THE INTERFACE HAVE TO
 * PRESERVE. A renderer that flattens `null` and `"unknown"` for a
 * field the data keeps in both states has lost something real; a
 * renderer that supplies a fallback for a field that is never absent
 * has lost nothing, and reporting the second would be reporting a
 * template.
 *
 * It is not a finding about the data. Whether a field SHOULD be null
 * is `agent/depth/`'s question, and `boundary.mjs` routes it there.
 */
export function absenceFieldsOf({ root = REPO_ROOT } = {}) {
  const dir = join(root, 'data');
  if (!existsSync(dir)) return { nullable: new Set(), unknownable: new Set(), both: new Set(), counts: new Map() };
  const nullable = new Set();
  const unknownable = new Set();
  const counts = new Map();
  const bump = (field, kind) => {
    if (!counts.has(field)) counts.set(field, { field, null: 0, unknown: 0, value: 0 });
    counts.get(field)[kind]++;
  };
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (v === null) { nullable.add(k); bump(k, 'null'); }
      else if (v === 'unknown') { unknownable.add(k); bump(k, 'unknown'); }
      else { bump(k, 'value'); walk(v); }
    }
  };
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    try { walk(JSON.parse(readFileSync(join(dir, f), 'utf8'))); } catch { /* a dataset this agent cannot parse is tools/validate.mjs's finding, not this one's */ }
  }
  const both = new Set([...nullable].filter((f) => unknownable.has(f)));
  return { nullable, unknownable, both, counts };
}

/* ============================================================
   9 · what the checks already cover
   ============================================================ */

/**
 * The manual checklist the `ux-audit` skill already carries, read as
 * a list of items rather than restated.
 *
 * `.agents/skills/ux-audit/references/manual-checks.md` is the
 * canonical list of what `design-qa.mjs` cannot see. Copying its
 * items into a lens would be the second home this repository refuses;
 * lens 10 reads them from the file and asks which of them anything
 * in `tools/` actually covers.
 */
export function manualChecksOf({ root = REPO_ROOT } = {}) {
  const path = '.agents/skills/ux-audit/references/manual-checks.md';
  if (!existsSync(join(root, path))) return { path, sections: [], items: [] };
  const md = readFileSync(join(root, path), 'utf8');
  const sections = [];
  let current = null;
  const items = [];
  for (const [n, raw] of md.split('\n').entries()) {
    const h = raw.match(/^##\s+(.+)$/);
    if (h) { current = { heading: h[1].trim(), items: [] }; sections.push(current); continue; }
    const box = raw.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
    if (!box || !current) continue;
    const item = { section: current.heading, text: box[1].trim(), line: n + 1, path };
    current.items.push(item);
    items.push(item);
  }
  /* A checkbox item wraps onto a following line; join the wrap so an
     item is quoted whole rather than truncated mid-sentence. */
  const lines = md.split('\n');
  for (const it of items) {
    let k = it.line;
    while (lines[k] && /^\s{6,}\S/.test(lines[k]) && !/^\s*-\s*\[/.test(lines[k])) {
      it.text += ` ${lines[k].trim()}`;
      k++;
    }
  }
  return { path, sections, items };
}

/** What `tools/design-qa.mjs` says about itself, read from its own
 *  header rather than described here. One home per fact. */
export function designQaCoverage({ root = REPO_ROOT } = {}) {
  const path = 'tools/design-qa.mjs';
  if (!existsSync(join(root, path))) return { path, checks: [], source: null };
  const src = readFileSync(join(root, path), 'utf8');
  const header = (src.match(/What it checks, per page:([\s\S]*?)\*\//) ?? [])[1] ?? '';
  const checks = header.split('\n')
    .map((l) => l.replace(/^\s*[·]\s*/, '').trim())
    .filter((l) => l && !/^(And across the CSS|Exit code)/.test(l) && !l.startsWith('*'));
  return { path, checks, source: src };
}

/* ============================================================
   one read of everything
   ============================================================ */

/**
 * @param {{root?:string}} [opts]
 */
export function readSurface({ root = REPO_ROOT } = {}) {
  const pages = pagesOf({ root });
  const sheets = stylesheetsOf({ root });
  const modules = modulesOf({ root });
  const graph = moduleGraphOf(pages, modules);
  return {
    root,
    pages,
    sheets,
    modules,
    graph,
    states: stateSelectorsOf(sheets),
    breakpoints: breakpointsOf(sheets),
    reachability: reachabilityOf(pages, modules),
    localisation: localisationOf(pages, { root }),
    tokens: tokensOf(sheets, pages, modules),
    absence_fields: absenceFieldsOf({ root }),
    manual_checks: manualChecksOf({ root }),
    design_qa: designQaCoverage({ root }),
    /* The one file every finding's honesty rests on, quoted rather
       than paraphrased. */
    readme_limitation: readmeLimitation({ root }),
  };
}

/** README limitation 7, verbatim. Every record this agent emits
 *  carries it as an open question, and a paraphrase would be exactly
 *  the softening `AGENTS.md` rule 7 prohibits. */
export function readmeLimitation({ root = REPO_ROOT } = {}) {
  if (!existsSync(join(root, 'README.md'))) return null;
  const md = readFileSync(join(root, 'README.md'), 'utf8');
  const lines = md.split('\n');
  const at = lines.findIndex((l) => /screen reader/i.test(l) && /^\s*\d+\.\s/.test(l));
  if (at === -1) return null;
  /* The whole numbered item, not its first line. A limitation quoted
     to the line break is a limitation quoted in half, and half of
     this one reads as a smaller admission than the author made. */
  const out = [lines[at].trim()];
  for (let k = at + 1; k < lines.length && lines[k].trim() && !/^\s*\d+\.\s/.test(lines[k]); k++) out.push(lines[k].trim());
  return { path: 'README.md', line: at + 1, quote: out.join(' ') };
}

export { read, exists, decomment };
