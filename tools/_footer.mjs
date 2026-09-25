/* The one source of the site footer and the no-JS notice.
   Both are written into the markup of every page rather than rendered by
   js/shell.js, because a statement of non-affiliation that only appears
   when JavaScript runs is not a statement of non-affiliation. The cost of
   that choice is seven copies; tools/design-qa.mjs checks they are
   identical, so they cannot drift.

   Run:  node tools/_footer.mjs        (from the repository root) */

import { readFileSync, writeFileSync } from 'node:fs';

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
export function navFromShell(src = readFileSync('js/shell.js', 'utf8')) {
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
export const NOSCRIPT_NAV = (nav = navFromShell()) => `<nav class="noscript-nav" aria-label="Sections of this project">
<ul>
${nav.map((n) => `<li><a href="${escAttr(n.file)}">${escText(n.long)}</a></li>`).join('\n')}
</ul>
</nav>`;

export const NOSCRIPT = `<noscript>
<div class="noscript-note">
<p><b>JavaScript is off, so parts of this page are not showing.</b> The written analysis is in
the HTML and reads normally without scripting. What will not appear: the site navigation in the
header, the state-of-play ledger, the regulatory status strips, the compliance calendar, the
evidence markers and their drawer, the comparison tables, the interactions view, search and the
glossary panel — all of which are rendered from <code>data/*.json</code> at runtime.</p>
<p>Every figure behind them is in that directory and can be read directly. The destinations the
header would carry are linked here instead:</p>
${NOSCRIPT_NAV()}
</div>
</noscript>`;

const PAGES = [
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
  return place(src, block(begin, body, end));
}

let touched = 0;
for (const file of PAGES) {
  let s = readFileSync(file, 'utf8');
  const before = s;

  /* the notice goes immediately after <body> so a reader without scripting
     meets it before anything that silently failed to render */
  s = upsert(s, NBEGIN, NEND, NOSCRIPT, (t, blk) =>
    t.replace(/(<body[^>]*>)/, `$1\n${blk}`));

  /* the footer goes last inside <body>, after every script tag it does not
     depend on */
  s = upsert(s, BEGIN, END, FOOTER, (t, blk) =>
    t.replace(/<\/body>/, `${blk}\n</body>`));

  if (s !== before) { writeFileSync(file, s); touched++; }
  console.log(`  ${file} ${s !== before ? 'updated' : 'unchanged'}`);
}
console.log(`\n${touched} file(s) written.`);

/* ---------------------------------------------------------- social meta

   Title and description are not retyped here: they are read out of each
   page's existing <title> and meta[name=description], so the social card
   cannot say something different from the page. There is no og:image
   because there is no image; twitter:card is therefore "summary" and not
   "summary_large_image", which would promise a picture that does not
   exist. */

const SITE_NAME = 'The European Legal Framework for the Digital World';
const SBEGIN = '<!-- social-meta:begin — generated by tools/_footer.mjs, do not edit in place -->';
const SEND = '<!-- social-meta:end -->';
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function socialMeta(file, src) {
  const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, file])[1].trim();
  const desc = (src.match(/<meta content="([^"]*)" name="description"\/>/) || [, ''])[1];
  const url = BASE + (file === 'index.html' ? '' : file);
  return [
    `<link href="${url}" rel="canonical"/>`,
    `<meta content="${attr(title)}" property="og:title"/>`,
    `<meta content="${desc}" property="og:description"/>`,
    '<meta content="article" property="og:type"/>',
    `<meta content="${url}" property="og:url"/>`,
    `<meta content="${attr(SITE_NAME)}" property="og:site_name"/>`,
    '<meta content="en" property="og:locale"/>',
    '<meta content="summary" name="twitter:card"/>',
    `<meta content="${attr(title)}" name="twitter:title"/>`,
    `<meta content="${desc}" name="twitter:description"/>`,
  ].join('\n');
}

for (const file of PAGES) {
  let s = readFileSync(file, 'utf8');
  const before = s;
  s = upsert(s, SBEGIN, SEND, socialMeta(file, s), (t, blk) =>
    t.replace('<link href="css/tokens.css" rel="stylesheet"/>',
      `${blk}\n<link href="css/tokens.css" rel="stylesheet"/>`));
  if (s !== before) writeFileSync(file, s);
}
console.log('social meta regenerated from each page\'s own title and description.');
