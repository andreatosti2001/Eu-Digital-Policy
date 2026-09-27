/* The one source of the site footer and the no-JS notice.
   Both are written into the markup of every page rather than rendered by
   js/shell.js, because a statement of non-affiliation that only appears
   when JavaScript runs is not a statement of non-affiliation. The cost of
   that choice is seven copies; tools/design-qa.mjs checks they are
   identical, so they cannot drift.

   Since 27 Sep 2026 it also writes everything tools/seo.mjs (the route
   model) says about each address — title, description, canonical, social
   tags, structured data, the site index, the sitemap — and generates one
   page per substantive instrument under instruments/<id>/. It is the only
   writer of any of it, and it is deterministic: the same tree always
   produces the same bytes, so --check can fail a page that was not
   regenerated after its data or its markup moved.

   Run:    node tools/_footer.mjs            (from the repository root)
   Check:  node tools/_footer.mjs --check    writes nothing; exit 1 if any
                                             generated file is stale */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* The deployed origin. Canonical, og:url and the social tags are all built
   from this, so it is changed here and nowhere else. If the site moves,
   change this line and re-run. */
export const BASE = 'https://andreatosti2001.github.io/Eu-Digital-Policy/';

export const FOOTER = `<footer class="site-foot">
<div class="sf-inner">
<p class="sf-disclaimer"><b>Independent project.</b> This is an independent, non-commercial
analysis. It is not affiliated with, endorsed by or sponsored by the European Commission, the
Council, the Parliament or any other institution, body, office or agency of the European Union.
All views expressed are the author's own.</p>
<p class="sf-advice">Nothing here is legal advice. Primary legal texts should be consulted in
their consolidated versions on EUR-Lex, and any live matter should be taken to a qualified
adviser in the relevant jurisdiction.</p>
<p class="sf-reuse"><b>Reuse.</b> No licence has yet been declared for this site, so ordinary
copyright applies to the analysis and the datasets by default. Quotations from and links to EU
legal texts and Commission documents are governed by those documents' own reuse terms, which
this site neither extends nor restricts.</p>
<p class="sf-meta"><span>&copy; 2026</span><span class="sf-sep"></span><span>Facts and dates are
held in <code>data/*.json</code>; every claim carries its own evidence grade.</span></p>
</div>
</footer>`;

/* THE SIX DESTINATIONS, READ FROM js/shell.js RATHER THAN RETYPED.

   The nav model has one home — `export const NAV` in js/shell.js — and a
   second copy here would drift the first time a destination was renamed,
   which is the failure this project's first principle exists to prevent
   (docs/DATA-GOVERNANCE.md). So it is parsed, exactly as
   agent/implement/baseline.mjs parses the recorded baseline out of
   docs/CURRENT-ARCHITECTURE.md §12 rather than restating it.

   If that array is restructured so this can no longer read it, this
   THROWS rather than emitting a plausible list: a silently wrong
   navigation for the readers who have no other navigation is worse than
   a generator that refuses to run. */
export function navFromShell(src = readFileSync(join(HERE_ROOT, 'js/shell.js'), 'utf8')) {
  const block = src.match(/export const NAV = \[([\s\S]*?)\n\];/);
  if (!block) {
    throw new Error('tools/_footer.mjs: js/shell.js no longer carries `export const NAV = [ … ];`. '
      + 'Refusing to guess the destinations — the no-JS notice is the only navigation a reader without scripting has.');
  }
  const rows = [...block[1].matchAll(/\{[^{}]*?\bid:\s*'([^']+)'[^{}]*?\bfile:\s*'([^']+)'[^{}]*?\blabel:\s*'([^']*)'[^{}]*?\blong:\s*'([^']*)'[^{}]*?\}/g)]
    .map(([, id, file, label, long]) => ({ id, file, label, long }));
  if (!rows.length) {
    throw new Error('tools/_footer.mjs: js/shell.js declares NAV but no { id, file, label, long } row could be read from it.');
  }
  return rows;
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* THE NO-JS NOTICE, AND THE NAVIGATION IT USED TO OMIT.

   SESSION 19's browser suite measured what a reader with scripting off
   actually gets and found a dead end: js/shell.js renders the header, so
   with scripting off NONE of the six top-level pages was reachable from
   any page — and the notice did not say so either, so the reader was
   stranded without being told. agent/browser/checks.mjs reported it as
   `nav:noscript`.

   Both halves are answered here. The notice now names the navigation
   among what will not render, and the destinations themselves are listed
   — so the fallback is a working route through the site, not only an
   admission. <noscript> content is inert when scripting is on, so this
   adds no element, no id and no focusable control to the rendered page a
   reader with JavaScript sees. */
/* `root` is the path from the page to the site root: "" on the seven
   top-level pages, "../../" on an instrument page. design-qa compares the
   notices with the prefix removed, so they are still one text. */
export const NOSCRIPT_NAV = (nav = navFromShell(), root = '') => `<nav class="noscript-nav" aria-label="Sections of this project">
<ul>
${nav.map((n) => `<li><a href="${escAttr(root + n.file)}">${escText(n.long)}</a></li>`).join('\n')}
</ul>
</nav>`;

export const noscriptFor = (root = '') => `<noscript>
<div class="noscript-note">
<p><b>JavaScript is off, so parts of this page are not showing.</b> The written analysis is in
the HTML and reads normally without scripting. What will not appear: the site navigation in the
header, the state-of-play ledger, the regulatory status strips, the compliance calendar, the
evidence markers and their drawer, the comparison tables, the interactions view, search and the
glossary panel — all of which are rendered from <code>data/*.json</code> at runtime.</p>
<p>Every figure behind them is in that directory and can be read directly. The destinations the
header would carry are linked here instead:</p>
${NOSCRIPT_NAV(navFromShell(), root)}
</div>
</noscript>`;
export const NOSCRIPT = noscriptFor('');

/* The seven hand-written pages. Everything else this writes is generated
   whole. */
export const PAGES = [
  'index.html', 'instruments.html', 'instrument.html', 'institutions.html',
  'enforcement.html', 'applies.html', 'bibliography.html',
];

const BEGIN = '<!-- site-footer:begin — generated by tools/_footer.mjs, do not edit in place -->';
const END = '<!-- site-footer:end -->';
const NBEGIN = '<!-- noscript:begin — generated by tools/_footer.mjs, do not edit in place -->';
const NEND = '<!-- noscript:end -->';

const block = (b, body, e) => `${b}\n${body}\n${e}`;

function upsert(src, begin, end, body, place) {
  const b = src.indexOf(begin);
  if (b !== -1) {
    const e = src.indexOf(end, b);
    return src.slice(0, b) + block(begin, body, end) + src.slice(e + end.length);
  }
  const out = place(src, block(begin, body, end));
  if (out === src) throw new Error(`tools/_footer.mjs: nowhere to place ${begin.slice(5, 30)}… in a page`);
  return out;
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escQ = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* The favicon and the pre-paint theme bootstrap, read out of instrument.html
   so an instrument page carries the same bytes — and therefore the same CSP
   hash — without a second copy to keep in step. */
function shellFrom(html) {
  const favicon = (html.match(/<link rel="icon" href="[^"]*"\/>/) || [])[0];
  const bootstrap = (html.match(/<script>\n\/\* Pre-paint theme bootstrap[\s\S]*?<\/script>/) || [])[0];
  if (!favicon || !bootstrap) throw new Error('tools/_footer.mjs: instrument.html no longer carries the favicon link and the theme bootstrap this reads.');
  return { favicon, bootstrap };
}

/**
 * Every file this generator owns, as it should be on disk.
 * @returns {{ files: Map<string,string>, remove: string[], routes: object[] }}
 */
export async function generate(root = HERE_ROOT) {
  const SEO = await import('./seo.mjs');
  const { securityMeta, SBEGIN: CBEGIN, SEND: CEND } = await import('./csp.mjs');
  const db = SEO.loadDb(root);
  const { routes, ix } = SEO.buildRoutes(db, root);
  const nav = navFromShell(readFileSync(join(root, 'js/shell.js'), 'utf8'));
  const files = new Map();
  const ctx = { ix, db, routes };

  /* every page, hand-written or generated, gets the same treatment in the
     same order: notice, index, footer, title, social meta, and the CSP
     LAST, because it hashes the inline scripts as they then stand */
  const finish = (route, html) => {
    const r = route.root || '';
    let s = html;
    s = upsert(s, NBEGIN, NEND, noscriptFor(r), (t, blk) => t.replace(/(<body[^>]*>)/, `$1\n${blk}`));
    /* the index sits immediately before the footer */
    s = upsert(s, SEO.IBEGIN, SEO.IEND, SEO.siteIndex(routes, ix, nav, r), (t, blk) =>
      t.includes(BEGIN) ? t.replace(BEGIN, `${blk}\n${BEGIN}`) : t.replace(/<\/body>/, `${blk}\n</body>`));
    s = upsert(s, BEGIN, END, FOOTER, (t, blk) => t.replace(/<\/body>/, `${blk}\n</body>`));
    s = s.replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(route.title)}</title>`);
    s = s.replace(/<meta content="[^"]*" name="description"\/>/, `<meta content="${escQ(route.description)}" name="description"/>`);
    s = upsert(s, SEO.SBEGIN, SEO.SEND, SEO.socialMeta(route, ctx), (t, blk) =>
      t.replace(new RegExp(`(<link href="${r.replace(/\./g, '\\.')}css/tokens\\.css" rel="stylesheet"/>)`), `${blk}\n$1`));
    s = upsert(s, CBEGIN, CEND, securityMeta(s), (t, blk) => t.replace('<meta charset="utf-8"/>', `<meta charset="utf-8"/>\n${blk}`));
    return s;
  };

  for (const file of PAGES) {
    const route = routes.find((x) => x.file === file);
    let s = readFileSync(join(root, file), 'utf8');
    if (file === 'instruments.html') {
      /* inside the page shell, after the reading notes */
      s = upsert(s, SEO.LBEGIN, SEO.LEND, SEO.instrumentIndex(routes, ix), (t, blk) =>
        t.replace(/(<\/section>\n)(<\/div>\n\n<script src="js\/boot\.js")/, `$1\n${blk}\n$2`));
    }
    files.set(file, finish(route, s));
  }

  const shell = shellFrom(readFileSync(join(root, 'instrument.html'), 'utf8'));
  for (const route of routes.filter((x) => x.kind === 'instrument')) {
    files.set(route.file, finish(route, SEO.instrumentPage(route, ctx, shell)));
  }

  files.set('sitemap.xml', SEO.sitemapXml(routes));

  /* an instrument that fell below the gate loses its page */
  const remove = [];
  const dir = join(root, 'instruments');
  if (existsSync(dir)) {
    for (const d of readdirSync(dir)) {
      const f = `instruments/${d}/index.html`;
      if (statSync(join(dir, d)).isDirectory() && !files.has(f)) remove.push(`instruments/${d}`);
    }
  }
  return { files, remove, routes };
}

/** Which generated files differ from what is on disk. Empty means current. */
export async function stale(root = HERE_ROOT) {
  const { files, remove } = await generate(root);
  const out = [];
  for (const [f, want] of files) {
    const p = join(root, f);
    if (!existsSync(p)) out.push(`${f} is missing`);
    else if (readFileSync(p, 'utf8') !== want) out.push(`${f} is stale`);
  }
  for (const d of remove) out.push(`${d}/ is no longer an instrument page (below the gate) and should be removed`);
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
/* Not a top-level await: tools/seo.mjs imports BASE from this module, so
   this module has to finish evaluating before generate()'s import of it
   can resolve. */
async function main() {
  const check = process.argv.includes('--check');
  if (check) {
    const problems = await stale();
    for (const p of problems) console.log('  STALE  ' + p);
    console.log(problems.length
      ? `\n${problems.length} generated file(s) out of date — run node tools/_footer.mjs`
      : 'every generated file is current');
    process.exit(problems.length ? 1 : 0);
  }
  const { files, remove, routes } = await generate();
  let touched = 0;
  for (const [f, want] of files) {
    const p = join(HERE_ROOT, f);
    const have = existsSync(p) ? readFileSync(p, 'utf8') : null;
    if (have === want) continue;
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, want);
    touched++;
    console.log(`  ${f} ${have === null ? 'created' : 'updated'}`);
  }
  for (const d of remove) { rmSync(join(HERE_ROOT, d), { recursive: true, force: true }); console.log(`  ${d}/ removed`); }
  const idx = routes.filter((r) => r.indexable).length;
  console.log(`\n${touched} file(s) written · ${idx} indexable route(s) · ${routes.filter((r) => r.kind === 'instrument').length} instrument page(s).`);
}
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
