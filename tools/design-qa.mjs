#!/usr/bin/env node
/* ============================================================
   tools/design-qa.mjs — the checks that catch a design defect
   before it ships, run without a browser and without a dependency.

   The three validators that already existed check the data
   (validate.mjs), the locale register (i18n-audit.mjs) and how
   stale the records are (freshness.mjs). None of them looks at the
   markup, and the markup is where this project's most embarrassing
   defect lived for five phases: every page shipped a skip link
   pointing at #maincontent, and that id existed on one page out of
   six. A four-line static check would have caught it, so here is
   the four-line static check, plus the others of its kind.

   What it checks, per page:
     · a title, a description, a viewport, exactly one <h1>
     · no heading level skipped in the source order
     · no duplicate element id
     · the skip link resolves to an id that exists on that page
     · every internal href resolves to a file that exists
     · every <img> carries alt (empty alt is fine and explicit)
     · every page loads the token layer before the sheets that use it
     · no page-local <style> block — those are how two versions of
       one component come to exist
     · no third-party stylesheet or script

   And across the CSS:
     · no colour literal outside the two files allowed to declare
       them, so a component cannot invent a hue that no theme knows
       how to invert
     · every custom property used is declared somewhere

   Exit code is 1 if anything ERRORs, 0 if only warnings.
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { cspProblems } from './csp.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanRuntimeSurface, sitePages } from './thirdparty.mjs';
import { TOP_PAGES, BASE } from './seo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

/* The hand-written pages at the root and the instrument pages
   tools/_footer.mjs generates under instruments/<id>/ — the same list the
   runtime-surface scan reads. */
const PAGES = sitePages(ROOT);

/* A page below the root reaches everything through "../". Links and
   stylesheet paths are compared as site paths, so a page two levels down
   is held to exactly the rules the root pages are. */
const sitePath = (page, href) => join(dirname(page), href).split('\\').join('/');

/* Files allowed to declare raw colour. Everything else must go through a
   custom property, or a component will look right in one theme only — the
   failure mode that shipped twice here already. */
const COLOUR_HOMES = new Set(['style.css', 'css/tokens.css']);

/* ---------------------------------------------------------- HTML */

for (const page of PAGES) {
  const html = readFileSync(join(ROOT, page), 'utf8');
  const at = page;

  if (!/<title>[^<]{5,}<\/title>/.test(html)) err(at, 'no usable <title>');
  if (!/name="description"/.test(html)) warn(at, 'no meta description');
  if (!/name="viewport"/.test(html)) err(at, 'no viewport meta');
  if (!/<html[^>]+lang=/.test(html)) err(at, 'no lang on <html>');

  /* one h1 — counting the ones in the markup; pages that build their h1 in
     JavaScript declare it with data-h1-rendered so this does not misfire */
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s > 1) err(at, `${h1s} <h1> elements`);
  if (h1s === 0 && !/id="instrumentPage"|data-h1-rendered/.test(html)) {
    warn(at, 'no <h1> in the markup (check it is rendered)');
  }

  /* heading order, in source order */
  let prev = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = +m[1];
    if (prev && lvl > prev + 1) err(at, `heading jumps h${prev} to h${lvl}`);
    prev = lvl;
  }

  /* duplicate ids */
  const ids = new Map();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
    ids.set(m[1], (ids.get(m[1]) || 0) + 1);
  }
  for (const [id, n] of ids) if (n > 1) err(at, `duplicate id "${id}" (${n}×)`);

  /* the skip link must resolve on THIS page */
  const skip = html.match(/class="skip-link"[^>]*href="#([^"]+)"/) ||
               html.match(/href="#([^"]+)"[^>]*class="skip-link"/);
  if (skip && !ids.has(skip[1]) && !/js\/shell\.js|js\/boot\.js/.test(html)) {
    err(at, `skip link targets #${skip[1]}, which does not exist on this page`);
  }

  /* internal links resolve to real files */
  for (const m of html.matchAll(/href="([^"#?][^"]*?)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:|\/\/)/.test(href)) continue;
    const file = href.split(/[?#]/)[0];
    if (!file) continue;
    const target = sitePath(page, file);
    const isDir = file.endsWith('/');
    if (!existsSync(join(ROOT, target, isDir ? 'index.html' : ''))) err(at, `link to a file that does not exist: ${file}`);
  }

  /* images */
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) err(at, 'an <img> has no alt attribute');
  }

  /* the token layer loads before the sheets that consume it */
  const sheets = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => sitePath(page, m[1]));
  if (sheets.length) {
    const t = sheets.indexOf('css/tokens.css');
    if (t === -1) err(at, 'does not load css/tokens.css');
    else if (t !== 0) err(at, 'css/tokens.css is not the first stylesheet');
  }

  /* page-local styling */
  if (/<style[\s>]/.test(html)) {
    err(at, 'has a page-local <style> block — move it to a shared sheet');
  }

  /* Third-party resources in this page's markup. The whole runtime
     surface — these pages, the stylesheets and the modules — is scanned
     below by tools/thirdparty.mjs; this per-page pass stays because it
     names the page in the error, which is what a reader of the report
     needs first. A canonical URL and the og:/twitter: tags name the
     page's own address; nothing is fetched from them, so they are not
     third-party requests and are exempt. Everything else still is. */
  const selfOrigin = new URL(BASE).origin;
  for (const m of html.matchAll(/<(\w+)\b[^>]*?\b(?:href|src)="(https?:\/\/[^"]+)"/g)) {
    if (m[2].startsWith(selfOrigin)) continue;
    /* an <a href> is a link the reader may follow, not a resource the page
       loads: an instrument page links to its Official Journal text */
    if (/^(a|area)$/i.test(m[1])) continue;
    err(at, `third-party resource: ${m[2]}`);
  }

  /* the Content-Security-Policy (tools/csp.mjs): present, placed where it
     governs, no unsafe script sources, and every inline script hashed —
     an unhashed one is a script the browser silently refuses to run */
  for (const p of cspProblems(html)) err(at, `CSP: ${p}`);

  /* inline event handlers are a place where behaviour hides from every
     module that owns it, and a Content-Security-Policy without
     'unsafe-inline' refuses to run them. The three that existed were moved
     into app.js on 27 Sep 2026, so this is an ERROR now rather than a
     warning: the next one would be a regression, not a baseline. Any
     on<event> attribute, in either quote style. */
  const inline = (html.match(/\son[a-z]+\s*=\s*["']/gi) || []).length;
  if (inline) err(at, `${inline} inline event handler(s) — move the behaviour into a module (see app.js data-action)`);
}

/* ---------------------------------------------------------- CSS */

const cssFiles = ['style.css', ...readdirSync(join(ROOT, 'css')).map((f) => 'css/' + f)]
  .filter((f) => f.endsWith('.css'));

const declared = new Set();
const used = new Map();

/* Custom properties could once be set from the markup through inline style
   attributes (the tree animation's index). Since 27 Sep 2026 the CSP refuses
   those and the index is a class (css/tools.css), so this scan should find
   nothing; it stays so that a checker never reports a declaration it missed. */
for (const page of PAGES) {
  const html = readFileSync(join(ROOT, page), 'utf8');
  for (const m of html.matchAll(/style="[^"]*?(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);
}
const JS_SOURCES = [...readdirSync(join(ROOT, 'js')).filter((x) => x.endsWith('.js')).map((x) => 'js/' + x),
  ...(existsSync(join(ROOT, 'app.js')) ? ['app.js'] : [])];
for (const f of JS_SOURCES) {
  const js = readFileSync(join(ROOT, f), 'utf8');
  /* A module that writes style="…" into markup writes something the CSP
     (style-src 'self', no 'unsafe-inline') makes the browser refuse: the
     element renders without it and nothing says so. Computed values go
     through js/format.js applyGeometry instead. Comments are skipped. */
  const code = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const styled = (code.match(/\sstyle\s*=\s*\\?["']/g) || []).length;
  if (styled) err(f, `${styled} style attribute(s) written into markup — the CSP refuses them; use a class, or data-w / data-flex with applyGeometry`);
  if (/<style\b/i.test(code)) err(f, 'a <style> element written into markup — the CSP refuses it');
  for (const m of js.matchAll(/setProperty\(\s*['"](--[a-z0-9-]+)/gi)) declared.add(m[1]);
  for (const m of js.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);
}
for (const f of cssFiles) {
  const css = readFileSync(join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);
  /* A var() with a fallback is a declared contract — an optional knob the
     component works without. One without a fallback is a dependency, and a
     dependency on a property nothing declares is a silent empty value. */
  for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/gi)) {
    if (!used.has(m[1])) used.set(m[1], { file: f, fallback: !!m[2] });
  }
  if (!COLOUR_HOMES.has(f)) {
    /* Declaring a token from a literal is how a palette is written and is
       fine anywhere: `--role-fines:#8E2F19` is a named colour with a theme
       block behind it. What is not fine is a literal as the value of a real
       property — `color:#8E2F19` — because that value cannot be inverted
       when the theme changes, and nothing will tell you it did not. */
    for (const m of css.matchAll(/(^|[;{])\s*([a-z-]+)\s*:\s*([^;{}]*#[0-9a-f]{3,8}\b[^;{}]*)/gi)) {
      const prop = m[2];
      if (prop.startsWith('--')) continue;
      /* a mask's black is an alpha channel, not a colour, and has no theme */
      if (/mask/.test(prop)) continue;
      warn(f, `${prop} uses a colour literal (${m[3].trim()}) — should be a token`);
    }
  }
  /* a theme-dependent token declared at :root resolves against the night
     palette in day mode, because the day palette is an attribute on <body>.
     This has shipped twice. */
  for (const m of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const d of m[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/gi)) {
      if (/var\(--(ink|paper|mech|crit|live|line)/.test(d[2])) {
        err(f, `${d[1]} is declared at :root but resolves against a theme token ` +
               `(${d[2].trim()}) — declare it on body`);
      }
    }
  }
}
for (const [name, u] of used) {
  if (declared.has(name)) continue;
  if (u.fallback) warn(u.file, `${name} is never set anywhere — the fallback is the only value it will ever have`);
  else err(u.file, `uses undeclared custom property ${name}`);
}

/* -------------------------------------------- footer, notice, social meta

   The legal notice and the no-JS notice are duplicated into all seven
   pages on purpose: neither may depend on js/shell.js having run. The
   cost of that decision is that they can drift, so this checks they have
   not. tools/_footer.mjs regenerates them all from one source.        */

const between = (html, a, b) => {
  const i = html.indexOf(a); if (i === -1) return null;
  const j = html.indexOf(b, i); if (j === -1) return null;
  return html.slice(i + a.length, j).trim();
};

const FOOT_A = '<!-- site-footer:begin';
const FOOT_B = '<!-- site-footer:end -->';
const NOS_A = '<!-- noscript:begin';
const NOS_B = '<!-- noscript:end -->';

const footers = new Map();
const notices = new Map();
for (const f of PAGES) {
  const html = readFileSync(join(ROOT, f), 'utf8');
  const foot = between(html, FOOT_A, FOOT_B);
  const nos = between(html, NOS_A, NOS_B);
  /* a page below the root prefixes its links with "../"; compared without
     it, every notice must still be one text */
  const unroot = (x) => x.replace(/(href=")(?:\.\.\/)+/g, '$1');
  if (!foot) err(f, 'no site footer — the independence disclaimer must be on every page');
  else footers.set(f, foot.replace(/^[^>]*-->/, '').trim());
  if (!nos) err(f, 'no <noscript> notice — a JS-rendered page must say so when JS is off');
  else notices.set(f, unroot(nos.replace(/^[^>]*-->/, '').trim()));

  if (foot && !/not affiliated with/i.test(foot)) {
    err(f, 'the footer does not carry the non-affiliation statement');
  }
  if (!/property="og:title"/.test(html)) warn(f, 'no Open Graph title');
  /* every page names itself as canonical — the address it is served at,
     with index.html as its directory — except a compatibility route the
     route model (tools/seo.mjs) declares, which must name none */
  const canon = (html.match(/<link href="([^"]+)" rel="canonical"\/>/) || [])[1];
  const compat = TOP_PAGES.some((p) => p.file === f && p.compat);
  const expected = BASE + f.replace(/(^|\/)index\.html$/, '$1');
  if (compat) { if (canon) err(f, `a compatibility route declares a canonical (${canon}); it should name none`); }
  else if (!canon) warn(f, 'no canonical URL');
  else if (canon !== expected) err(f, `canonical URL points at ${canon}, not ${expected}`);
}
const distinct = (m) => new Set([...m.values()]).size;
if (distinct(footers) > 1) {
  err('site footer', `${distinct(footers)} different versions across ${footers.size} pages — run tools/_footer.mjs`);
}
if (distinct(notices) > 1) {
  err('noscript notice', `${distinct(notices)} different versions across ${notices.size} pages — run tools/_footer.mjs`);
}
const origins = new Set([...PAGES].map((f) =>
  (readFileSync(join(ROOT, f), 'utf8').match(/<link href="(https?:\/\/[^/"]+)/) || [])[1]).filter(Boolean));
if (origins.size > 1) err('canonical', `pages declare ${origins.size} different origins`);

/* ---------------------------------------------------------- JS */

const jsFiles = readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js'));
for (const f of jsFiles) {
  const js = readFileSync(join(ROOT, 'js', f), 'utf8');
  if (/localStorage\.(get|set)Item/.test(js) && !/try\s*\{/.test(js)) {
    err('js/' + f, 'touches localStorage without a try block (throws in private mode)');
  }
}

/* -------------------------------------------- third-party runtime surface

   The per-page pass above reads `href="…"` and `src="…"` in the HTML and
   nothing else, so the claim it was taken to support — "no third-party
   requests", stated in AGENTS.md, §12 and the README — was broader than
   the check by some distance. A Google Fonts dependency returns through
   `@import` or an `@font-face src` in a stylesheet, and this project
   removed exactly one of those once (style.css, where `--display` used
   to name 'Bodoni Moda'). Nothing would have reported it coming back.

   tools/thirdparty.mjs scans the pages, the stylesheets and the modules
   for a foreign origin in any position a browser fetches from, and
   tools/selftest.mjs plants each of those defects in a scratch tree and
   asserts it is caught. `data/` and `i18n/` are deliberately not in the
   surface: a URL in data/sources.json is a citation the page displays,
   not a resource it loads.                                             */

for (const f of scanRuntimeSurface(ROOT)) {
  err(f.file, `third-party runtime resource in ${f.position} — ${f.reference}`
    + (f.tracker ? ` (${f.tracker}: a known font/CDN/analytics host)` : '')
    + '. The site makes no third-party request; if one is ever adopted deliberately it goes in'
    + ' ALLOWED_RUNTIME_ORIGINS in tools/thirdparty.mjs with its reason and who decided it.');
}

/* ---------------------------------------------------------- report */

const line = (s) => process.stdout.write(s + '\n');
line('design-qa · ' + PAGES.length + ' pages, ' + cssFiles.length + ' stylesheets, ' +
     jsFiles.length + ' modules');
line('');
for (const e of errors) line('  ERROR   ' + e);
for (const w of warnings) line('  warning ' + w);
line('');
line(errors.length + ' error' + (errors.length === 1 ? '' : 's') + ', ' +
     warnings.length + ' warning' + (warnings.length === 1 ? '' : 's'));
process.exit(errors.length ? 1 : 0);
