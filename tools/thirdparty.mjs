/* ============================================================
   tools/thirdparty.mjs — the no-third-party-runtime-request
   invariant, checked against the whole published surface

   THE INVARIANT IS STATED IN FOUR PLACES AND WAS ENFORCED IN ONE.
   AGENTS.md says "no third-party requests"; docs/CURRENT-ARCHITECTURE.md
   §12 lists "no third-party resource" among the per-page checks;
   README.md says the typefaces are self-hosted; and
   agent/browser/checks.mjs measures at runtime that every request a
   rendered page made went to the local origin. The static half of that
   — the half that runs without a browser, on every push — was one
   regular expression in tools/design-qa.mjs:

       /(?:href|src)="(https?:\/\/[^"]+)"/g

   over the HTML only. It therefore could not see, and would not have
   reported:

     · `@import url(https://fonts.googleapis.com/…)` in a stylesheet
     · `src: url(https://fonts.gstatic.com/…)` inside an `@font-face`
       — which is the exact path by which a Google Fonts dependency
       would return, and this project removed one once already
       (style.css, where `--display` used to name 'Bodoni Moda')
     · a `background:url(https://…)` anywhere in the CSS
     · `fetch()`, `import()`, `new Worker()`, `new WebSocket()`,
       `sendBeacon()` or an assignment to `.src` against a remote URL
     · `<link rel="preconnect">` / `dns-prefetch` / `preload`
     · any of the above written with SINGLE quotes or none, because the
       regex above requires a double quote

   So the claim was broader than the check. This module is the check
   the claim needs, and tools/selftest.mjs proves it by planting each
   of those defects in a scratch tree and asserting it is caught.

   WHAT IT IS NOT. It is not a ban on the character sequence "http".
   `data/sources.json` holds 74 real URLs, and it is a bibliography —
   the site DISPLAYS them and fetches none of them. Documentation under
   `docs/`, the agent layer and the Control Room are not served to a
   reader by the published pages either. The question this module asks
   is narrower and is the one that matters: **does anything the browser
   loads name an origin that is not ours, in a position from which the
   browser would fetch it?**

   The surface is therefore the runtime surface — the pages, the
   stylesheets and the modules — and the positions are resource
   positions. Comments are stripped first, deliberately: a comment
   cannot issue a request, and style.css carries the note recording why
   Bodoni Moda and its Google Fonts request were removed. A check that
   errored on that note would teach the next session to delete the
   history rather than keep it.
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Origins the published pages may name in a resource position.
 *
 * IT IS EMPTY, AND THE EMPTINESS IS THE POINT. There is no third-party
 * runtime dependency in this repository today — the browser suite
 * measures it on every run, and `network:first-party` has never
 * reported one. If one is ever adopted deliberately, it is added here
 * WITH its reason, which makes it a visible line in a diff and a
 * sentence somebody had to write, rather than a silent regression.
 *
 * An entry is `{ origin, why, who_decided }`. Nothing in this
 * repository may add one automatically: `agent/policy/governance.mjs`
 * puts `tools/` outside the automatic-eligible paths, and a runtime
 * dependency on somebody else's server is a Class D architectural
 * decision under docs/AUTONOMY-POLICY.md.
 */
export const ALLOWED_RUNTIME_ORIGINS = Object.freeze([]);

/**
 * Origins that are never a runtime request no matter where they
 * appear, because they are identifiers rather than addresses. The XML
 * namespace URI is the whole of this list: `createElementNS` and the
 * `xmlns` attribute take a name that happens to be spelled as a URL,
 * and no browser has ever fetched it.
 */
export const NON_FETCHING_URIS = Object.freeze([
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/1999/xlink',
]);

/** Named and shamed on sight, in any resource position: there is no
 *  version of this project that wants one, and naming them makes the
 *  report say WHAT came back rather than only that something did. */
export const TRACKER_HINTS = Object.freeze([
  'google-analytics.com', 'googletagmanager.com', 'analytics.google.com',
  'fonts.googleapis.com', 'fonts.gstatic.com', 'ajax.googleapis.com',
  'connect.facebook.net', 'static.hotjar.com', 'cdn.segment.com',
  'cdn.mxpnl.com', 'plausible.io', 'matomo.cloud', 'browser.sentry-cdn.com',
  'doubleclick.net', 'use.typekit.net', 'fonts.bunny.net',
  'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com', 'esm.sh',
]);

/* ---------------------------------------------------------- helpers */

/** Comments cannot issue a request, and style.css's note about the
 *  Google Fonts dependency this project REMOVED must survive a check
 *  about Google Fonts. */
export const stripCssComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
export const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ');
export const stripJsComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1 ');

/**
 * Is this reference an origin other than ours?
 *
 * Relative references are same-origin by construction and are not the
 * subject here. `data:`, `blob:` and `about:` carry their own bytes.
 * A protocol-relative `//host/x` IS a remote fetch and is the form most
 * likely to be missed by eye, so it is resolved rather than skipped.
 */
export function foreignOrigin(ref, selfOrigins) {
  if (!ref) return null;
  const s = String(ref).trim().replace(/^['"]|['"]$/g, '');
  if (!s) return null;
  if (/^(data:|blob:|about:|mailto:|tel:|javascript:|#|\?)/i.test(s)) return null;
  if (NON_FETCHING_URIS.some((u) => s === u || s.startsWith(`${u}#`))) return null;

  let abs;
  if (/^https?:\/\//i.test(s)) abs = s;
  else if (/^\/\//.test(s)) abs = `https:${s}`;
  else return null; /* relative — our own origin */

  let origin;
  try { origin = new URL(abs).origin; } catch { return abs; }
  if (selfOrigins.has(origin)) return null;
  if (ALLOWED_RUNTIME_ORIGINS.some((a) => a.origin === origin)) return null;
  return abs;
}

const finding = (file, position, ref, extra = {}) => ({
  file,
  position,
  reference: ref,
  tracker: TRACKER_HINTS.find((t) => ref.includes(t)) ?? null,
  ...extra,
});

/* One line per (file, origin-reference). `@import url("https://…")` is
   matched by both the @import rule and the url() rule, and reporting
   the same dependency twice makes the count say something it does not
   mean. The first position wins, which is the more specific one,
   because the rules are ordered specific-first. */
const dedupe = (found) => {
  const seen = new Set();
  return found.filter((f) => {
    const k = `${f.file} | ${f.reference}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/* ---------------------------------------------------------- HTML */

/* Every attribute from which a browser will fetch. `content` is NOT
   here: og:url, og:image and the canonical link name the page's own
   address for a scraper and are fetched by nothing the reader loads —
   tools/design-qa.mjs has exempted them since it was written, and this
   keeps that exemption rather than quietly widening the rule. A meta
   refresh IS a navigation the browser performs, so it is read
   separately below. */
const FETCHING_ATTRS = 'srcset|formaction|data-src|data-href|poster|action|href|src|data';
const ATTR_RE = new RegExp(`\\b(${FETCHING_ATTRS})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s">]+))`, 'gi');

export function scanHtml(text, file, selfOrigins) {
  const out = [];
  const html = stripHtmlComments(text);

  for (const m of html.matchAll(ATTR_RE)) {
    const attr = m[1].toLowerCase();
    const raw = m[2] ?? m[3] ?? m[4] ?? '';
    /* srcset is a comma-separated candidate list, each "url descriptor" */
    const refs = attr === 'srcset' ? raw.split(',').map((c) => c.trim().split(/\s+/)[0]) : [raw];
    for (const r of refs) {
      const hit = foreignOrigin(r, selfOrigins);
      if (hit) out.push(finding(file, `${attr}=`, hit));
    }
  }

  /* <meta http-equiv="refresh" content="0; url=https://…"> */
  for (const m of html.matchAll(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi)) {
    const c = m[0].match(/content\s*=\s*["']([^"']*)["']/i);
    const url = c && c[1].match(/url\s*=\s*(.+)$/i);
    const hit = url ? foreignOrigin(url[1], selfOrigins) : null;
    if (hit) out.push(finding(file, 'meta refresh', hit));
  }

  /* A page-local <style> is already an error in design-qa, but if one
     is ever allowed it must not become a side door for an @import. */
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    out.push(...scanCss(m[1], `${file} (inline <style>)`, selfOrigins));
  }

  return dedupe(out);
}

/* ---------------------------------------------------------- CSS */

export function scanCss(text, file, selfOrigins) {
  const out = [];
  const css = stripCssComments(text);

  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)) {
    const hit = foreignOrigin(m[1], selfOrigins);
    if (hit) out.push(finding(file, '@import', hit));
  }
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const hit = foreignOrigin(m[1], selfOrigins);
    if (hit) out.push(finding(file, 'url()', hit));
  }
  return dedupe(out);
}

/* ---------------------------------------------------------- JS */

/* Each entry is a way a module can reach the network, written as the
   shape it takes in source. A string literal in an ordinary assignment
   is NOT one of them: js/threshold.js and app.js both hold the SVG
   namespace URI in a constant, which is a name and not an address. */
const JS_POSITIONS = Object.freeze([
  ['fetch()', /\bfetch\s*\(\s*["'`]([^"'`]+)/g],
  ['import()', /\bimport\s*\(\s*["'`]([^"'`]+)/g],
  ['import … from', /\bfrom\s+["']([^"']+)["']/g],
  ['new Worker()', /\bnew\s+(?:Shared)?Worker\s*\(\s*["'`]([^"'`]+)/g],
  ['new EventSource()', /\bnew\s+EventSource\s*\(\s*["'`]([^"'`]+)/g],
  ['new WebSocket()', /\bnew\s+WebSocket\s*\(\s*["'`]([^"'`]+)/g],
  ['importScripts()', /\bimportScripts\s*\(\s*["'`]([^"'`]+)/g],
  ['sendBeacon()', /\bsendBeacon\s*\(\s*["'`]([^"'`]+)/g],
  ['XHR open()', /\.open\s*\(\s*["'`][A-Za-z]+["'`]\s*,\s*["'`]([^"'`]+)/g],
  ['.src =', /\.src\s*=\s*["'`]([^"'`]+)/g],
  ['.href =', /\.href\s*=\s*["'`]([^"'`]+)/g],
  ['setAttribute(src|href)', /setAttribute\s*\(\s*["'`](?:src|href)["'`]\s*,\s*["'`]([^"'`]+)/g],
  ['registerServiceWorker', /serviceWorker\s*\.\s*register\s*\(\s*["'`]([^"'`]+)/g],
]);

export function scanJs(text, file, selfOrigins) {
  const out = [];
  const js = stripJsComments(text);
  for (const [position, re] of JS_POSITIONS) {
    for (const m of js.matchAll(new RegExp(re.source, re.flags))) {
      const hit = foreignOrigin(m[1], selfOrigins);
      if (hit) out.push(finding(file, position, hit));
    }
  }
  return dedupe(out);
}

/* ---------------------------------------------------------- the surface */

/**
 * Everything the browser loads when a reader opens this site: the
 * pages, the stylesheets they link, and the modules they import.
 *
 * NOT `data/`, `i18n/`, `docs/`, `agent/` or `.control-room/`. The
 * first two are fetched by js/data.js and rendered as text — a URL in
 * data/sources.json is a citation the page DISPLAYS, and treating one
 * as a runtime dependency would make this check fire on the
 * bibliography. If a renderer ever puts such a value into a `src`, the
 * JS scan above is where that shows up, and agent/browser's
 * `network:first-party` measures the result in a real browser.
 */
export function runtimeSurface(root) {
  const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
  const css = [
    ...(existsSync(join(root, 'style.css')) ? ['style.css'] : []),
    ...(existsSync(join(root, 'css')) ? readdirSync(join(root, 'css')).filter((f) => f.endsWith('.css')).map((f) => `css/${f}`) : []),
  ];
  const js = [
    ...(existsSync(join(root, 'app.js')) ? ['app.js'] : []),
    ...(existsSync(join(root, 'js')) ? readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`) : []),
  ];
  return { pages, css, js };
}

/**
 * The origins this site may call its own, read from the canonical link
 * the pages declare rather than hard-coded. tools/_footer.mjs holds
 * that address in one constant; if the site moves, this follows.
 */
export function selfOriginsOf(root, pages) {
  const origins = new Set();
  for (const p of pages) {
    const m = readFileSync(join(root, p), 'utf8').match(/<link href="(https?:\/\/[^"]+)" rel="canonical"\/>/);
    if (m) { try { origins.add(new URL(m[1]).origin); } catch { /* reported by design-qa */ } }
  }
  return origins;
}

/**
 * Every third-party runtime reference in the published surface.
 *
 * @returns {Array<{file:string, position:string, reference:string, tracker:string|null}>}
 */
export function scanRuntimeSurface(root) {
  const surface = runtimeSurface(root);
  const selfOrigins = selfOriginsOf(root, surface.pages);
  const out = [];
  for (const f of surface.pages) out.push(...scanHtml(readFileSync(join(root, f), 'utf8'), f, selfOrigins));
  for (const f of surface.css) out.push(...scanCss(readFileSync(join(root, f), 'utf8'), f, selfOrigins));
  for (const f of surface.js) out.push(...scanJs(readFileSync(join(root, f), 'utf8'), f, selfOrigins));
  return dedupe(out);
}
