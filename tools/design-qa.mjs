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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const PAGES = readdirSync(ROOT).filter((f) => f.endsWith('.html'));

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
    if (!existsSync(join(ROOT, file))) err(at, `link to a file that does not exist: ${file}`);
  }

  /* images */
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) err(at, 'an <img> has no alt attribute');
  }

  /* the token layer loads before the sheets that consume it */
  const sheets = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]);
  if (sheets.length) {
    const t = sheets.indexOf('css/tokens.css');
    if (t === -1) err(at, 'does not load css/tokens.css');
    else if (t !== 0) err(at, 'css/tokens.css is not the first stylesheet');
  }

  /* page-local styling */
  if (/<style[\s>]/.test(html)) {
    err(at, 'has a page-local <style> block — move it to a shared sheet');
  }

  /* third-party resources. A canonical URL and the og:/twitter: tags name
     the page's own address; nothing is fetched from them, so they are not
     third-party requests and are exempt. Everything else still is. */
  const declaredSelf = html.match(/<link href="(https?:\/\/[^"]+)" rel="canonical"\/>/);
  const selfOrigin = declaredSelf ? new URL(declaredSelf[1]).origin : null;
  for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
    if (selfOrigin && m[1].startsWith(selfOrigin)) continue;
    err(at, `third-party resource: ${m[1]}`);
  }

  /* inline event handlers are not a design defect but they are a place
     where behaviour hides from every module that owns it */
  const inline = (html.match(/\son(?:click|change|input|submit)="/g) || []).length;
  if (inline) warn(at, `${inline} inline event handler(s)`);
}

/* ---------------------------------------------------------- CSS */

const cssFiles = ['style.css', ...readdirSync(join(ROOT, 'css')).map((f) => 'css/' + f)]
  .filter((f) => f.endsWith('.css'));

const declared = new Set();
const used = new Map();

/* Custom properties are also set from the markup — the tree animation passes
   its index and the rota its geometry as inline style attributes. Those are
   declarations too, and a checker that does not know it will report the whole
   animation layer as undeclared. */
for (const page of PAGES) {
  const html = readFileSync(join(ROOT, page), 'utf8');
  for (const m of html.matchAll(/style="[^"]*?(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);
}
const JS_SOURCES = [...readdirSync(join(ROOT, 'js')).filter((x) => x.endsWith('.js')).map((x) => 'js/' + x),
  ...(existsSync(join(ROOT, 'app.js')) ? ['app.js'] : [])];
for (const f of JS_SOURCES) {
  const js = readFileSync(join(ROOT, f), 'utf8');
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
  if (!foot) err(f, 'no site footer — the independence disclaimer must be on every page');
  else footers.set(f, foot.replace(/^[^>]*-->/, '').trim());
  if (!nos) err(f, 'no <noscript> notice — a JS-rendered page must say so when JS is off');
  else notices.set(f, nos.replace(/^[^>]*-->/, '').trim());

  if (foot && !/not affiliated with/i.test(foot)) {
    err(f, 'the footer does not carry the non-affiliation statement');
  }
  if (!/property="og:title"/.test(html)) warn(f, 'no Open Graph title');
  const canon = (html.match(/<link href="([^"]+)" rel="canonical"\/>/) || [])[1];
  if (!canon) warn(f, 'no canonical URL');
  else if (!canon.endsWith(f === 'index.html' ? '/' : f)) {
    err(f, `canonical URL points at ${canon}`);
  }
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
