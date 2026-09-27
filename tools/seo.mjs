/* ============================================================
   tools/seo.mjs — THE ROUTE MODEL. One home for what a search
   engine is told about every address on the site.

   docs/SEO-AUDIT-2026-09-27.md measured what that used to be: seven
   titles for thirty sitemap URLs, a canonical that JavaScript
   rewrote after load, a sitemap of addresses whose own HTML named a
   different canonical, and structured data that described
   "Instrument" on twenty-one different instruments. Each of those
   facts had a home in a different file, or in none.

   Here each has exactly one:

     · WHICH addresses exist, which are indexable, and why — the
       top-level page registry below, plus js/routes.js's gate for
       instruments (derived from the data, never listed);
     · WHAT each is called — the page registry's titles and
       descriptions; an instrument's are DERIVED from its record, with
       one curated phrase each (INSTRUMENT_TITLE) that
       tools/seo-audit.mjs checks against the page's visible text;
     · WHEN it last changed in substance — derived from the
       verification dates of the records the page renders;
     · HOW it is described to machines — canonical, Open Graph,
       Twitter, JSON-LD and the sitemap, all built from the route,
       so none can say something another does not.

   tools/_footer.mjs writes it all into the pages; tools/seo-audit.mjs
   reads the pages back the way a crawler does and fails on any
   disagreement. Nothing here fetches anything and nothing reads the
   clock: the same tree always generates the same bytes, which is what
   lets CI fail a page that was not regenerated after its data moved.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { index, label as taxLabel } from '../js/data.js';
import * as R from '../js/routes.js';
import { datesFor, authoritiesFor } from '../js/dna.js';
import { renderInstrument, instrumentListItem } from '../js/instrument-view.js';
import * as F from '../js/format.js';
import { BASE } from './_footer.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export { BASE };

/* ---------------------------------------------------------- identity

   "EU Digital Policy" is what the chrome, the README and the repository
   already call the project, and it is short enough to survive a
   truncated result. The editorial title is kept, as the brief's own
   <h1> and as the site's alternate name. Neither is invented here: both
   are strings the site already publishes. */
export const SITE = Object.freeze({
  name: 'EU Digital Policy',
  alternateName: 'The European Legal Framework for the Digital World',
  locale: 'en',
  ogLocale: 'en_GB',
  image: { path: 'img/og/site.png', width: 1200, height: 630,
    alt: 'EU Digital Policy — the European legal framework for the digital world' },
});

const BRAND = ' | ' + SITE.name;

/* ---------------------------------------------------------- the pages

   The seven hand-written pages. `records` names the datasets whose
   verification dates stand for "this page's substance last changed"
   (lastmod); `schema` is the schema.org type of the page as a whole. */
export const TOP_PAGES = Object.freeze([
  {
    file: 'index.html', path: '', schema: 'WebPage',
    title: 'EU Digital Policy — The European Legal Framework for the Digital World',
    description: 'An evidence-graded analysis of the EU digital rulebook — GDPR, DSA, DMA, AI Act, Data Act and the cyber layer: structure, key provisions, compliance consequences and the case against each.',
    records: ['claims', 'instruments', 'timeline', 'enforcement'],
  },
  {
    file: 'instruments.html', path: 'instruments.html', schema: 'CollectionPage',
    title: 'Regulatory DNA: EU digital regulations compared' + BRAND,
    description: 'Compare the EU digital instruments — GDPR, DSA, DMA, AI Act, Data Act, NIS2, DORA, CRA and more — across eleven dimensions, from regulated actor and obligations to competent authority, sanctions and key dates, with one page per instrument.',
    records: ['instruments', 'timeline'],
  },
  {
    file: 'institutions.html', path: 'institutions.html', schema: 'CollectionPage',
    title: 'Institutional map: who supervises and enforces EU digital law' + BRAND,
    description: 'Who legislates, supervises, investigates, fines, issues guidance, transposes, hears appeals and interprets across the EU digital rulebook — with exclusivity, scope and legal basis for every competence.',
    records: ['institutions'],
  },
  {
    file: 'enforcement.html', path: 'enforcement.html', schema: 'CollectionPage',
    title: 'Enforcement observatory: fines and decisions under EU digital law' + BRAND,
    description: 'Every recorded enforcement action under the EU digital rulebook with its full pipeline — law on paper, investigation, action, decision, final decision, payment, remedy, behavioural change — and aggregates that carry their own unknowns.',
    records: ['enforcement'],
  },
  {
    file: 'applies.html', path: 'applies.html', schema: 'WebPage',
    title: 'What applies to me? Which EU digital rules reach your organisation' + BRAND,
    description: 'Say what kind of organisation you are, what you do and where you are established, and see which parts of the EU digital rulebook may reach you — with the rationale, obligations, authority, dates and sources behind every answer.',
    records: ['applicability'],
  },
  {
    file: 'bibliography.html', path: 'bibliography.html', schema: 'CollectionPage',
    title: 'Evidence and sources: bibliography, method and data quality' + BRAND,
    description: 'Every source the analysis relies on, ranked by the source hierarchy — primary law and courts, regulators, research, then press and advocacy — with the evidence method and data-quality panels computed from the records.',
    records: ['sources', 'claims', 'instruments', 'timeline', 'enforcement', 'institutions', 'applicability', 'glossary'],
  },
  {
    /* The address every instrument had until 27 Sep 2026. It forwards to
       the instrument's own page, or renders a record too thin for one and
       marks it noindex — so it carries no canonical of its own and is not
       in the sitemap. js/instrument-page.js. */
    file: 'instrument.html', path: 'instrument.html', schema: null, compat: true,
    title: 'Instrument record' + BRAND,
    description: 'One instrument, read end to end: what it does, where it stands, when it lands, who it binds, which provisions carry it, what enforcement it has produced, and what every one of those statements rests on.',
    records: [],
  },
]);

/* ---------------------------------------------------------- instruments

   The one curated phrase per instrument: what the page is FOR, in the
   words a searcher uses. Everything else in the title and all of the
   description is derived from the record. Each phrase is a list of
   facets, and tools/seo-audit.mjs fails a title whose facet does not
   occur in the page's visible text (`must`, a case-insensitive pattern) —
   so a title cannot promise a section the page does not have. An
   instrument that passes the gate without an entry here still gets a
   page, with a title built from the sections its record fills. */
export const INSTRUMENT_TITLE = Object.freeze({
  gdpr: { lead: 'GDPR', facets: [['key provisions', 'provision'], ['enforcement', 'enforcement'], ['fines', 'fine']] },
  dsa: { lead: 'Digital Services Act (DSA)', facets: [['obligations', 'obligation'], ['VLOPs', 'VLOP'], ['enforcement', 'enforcement']] },
  dma: { lead: 'Digital Markets Act (DMA)', facets: [['gatekeepers', 'gatekeeper'], ['obligations', 'obligation'], ['enforcement', 'enforcement']] },
  'ai-act': { lead: 'EU AI Act', facets: [['risk tiers', 'risk'], ['obligations', 'obligation'], ['timeline', 'application'], ['enforcement', 'enforcement']] },
  'data-act': { lead: 'EU Data Act', facets: [['data access', 'access to'], ['cloud switching', 'switching'], ['key dates', 'Key dates']] },
  nis2: { lead: 'NIS2 Directive', facets: [['cybersecurity obligations', 'cybersecurity'], ['transposition', 'transposition']] },
  cer: { lead: 'CER Directive', facets: [['resilience of critical entities', 'critical entities'], ['transposition', 'transposition']] },
  dora: { lead: 'DORA', facets: [['digital operational resilience for the financial sector', 'digital operational resilience']] },
  cra: { lead: 'Cyber Resilience Act (CRA)', facets: [['product cybersecurity requirements', 'products with digital elements'], ['key dates', 'Key dates']] },
  'ai-omnibus': { lead: 'Digital Omnibus on AI', facets: [['what it changes in the AI Act', 'AI Act'], ['key dates', 'Key dates']] },
  'data-omnibus': { lead: 'Digital Omnibus proposal', facets: [['GDPR amendments', 'GDPR'], ['status', 'Status']] },
  pld: { lead: 'Product Liability Directive', facets: [['software', 'software'], ['AI', '\\bAI\\b'], ['transposition', 'transposition']] },
});

const joinFacets = (xs) => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];

/** The instrument number as the record's own full name writes it. */
export function actNumber(inst) {
  const m = String(inst.full_name || '').match(/(Regulation|Directive) \(EU\) \d{4}\/\d+|COM\(\d{4}\) \d+/);
  return m ? m[0] : null;
}

/** A name for links: the alias-backed common name with the short name,
 *  or the short name alone. */
export function displayName(inst) {
  const aka = R.knownAs(inst);
  return aka && !aka.includes(inst.short_name) ? `${aka} (${inst.short_name})` : inst.short_name;
}

function instrumentTitle(inst, ix, db) {
  const cur = INSTRUMENT_TITLE[inst.id];
  if (cur) return `${cur.lead} — ${joinFacets(cur.facets.map((f) => f[0]))}${BRAND}`;
  /* derived: the sections the record actually fills */
  const facets = [];
  if ((inst.provisions || []).length) facets.push('key provisions');
  if (datesFor(inst, ix).length) facets.push('key dates');
  if ((db.enforcement.enforcement || []).some((r) => r.instrument === inst.id)) facets.push('enforcement');
  if (!facets.length) facets.push('status and sources');
  return `${inst.short_name} — ${joinFacets(facets)}${BRAND}`;
}

const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

function instrumentDescription(inst, ix, db) {
  const num = actNumber(inst);
  const lead = displayName(inst) + (num && !displayName(inst).includes(num) ? `, ${num}` : '');
  /* the objective as the record writes it, run on after a colon: lower-case
     its first letter unless it opens an acronym ("ICT risk management") */
  let obj = String(inst.dna.objective).trim().replace(/\.?$/, '.');
  if (/^[A-Z](?![A-Z0-9])/.test(obj)) obj = obj[0].toLowerCase() + obj.slice(1);
  const status = `${taxLabel(ix, inst.legislative_status)} as of ${F.humanDate(inst.status_as_of)}.`;
  const bits = [];
  const provs = (inst.provisions || []).length;
  const dates = datesFor(inst, ix).length;
  const enf = (db.enforcement.enforcement || []).filter((r) => r.instrument === inst.id).length;
  const claims = (db.claims.claims || []).filter((c) => (c.instruments || []).includes(inst.id)).length;
  if (provs) bits.push(plural(provs, 'provision'));
  if (dates) bits.push(plural(dates, 'dated milestone'));
  if (enf) bits.push(plural(enf, 'enforcement record'));
  if (claims) bits.push(plural(claims, 'graded claim'));
  const tail = bits.length ? ` ${joinFacets(bits)[0].toUpperCase() + joinFacets(bits).slice(1)}, each with its sources.` : '';
  return `${lead}: ${obj} ${status}${tail}`;
}

/* ---------------------------------------------------------- lastmod

   The newest verification date among the records a page renders. A
   record's last_verified moves when someone re-reads it against its
   source, and the page shows that date, so the page changed that day.
   It is never the day the generator ran: that would tell a crawler
   nothing true (docs/DEPLOYMENT.md §6 refused exactly that). A layout
   change moves no lastmod; that is a stated limit, not an oversight. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function datesIn(x, out = []) {
  if (Array.isArray(x)) { for (const v of x) datesIn(v, out); return out; }
  if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if ((k === 'last_verified' || k === 'status_as_of' || k === '$last_verified') && typeof v === 'string' && DATE.test(v)) out.push(v);
      else if (typeof v === 'object') datesIn(v, out);
    }
  }
  return out;
}
const newest = (xs) => xs.filter((d) => DATE.test(d)).sort().pop() || null;

function entityRecords(inst, ix, db) {
  const id = inst.id;
  return [
    inst,
    datesFor(inst, ix),
    (db.claims.claims || []).filter((c) => (c.instruments || []).includes(id)),
    (db.enforcement.enforcement || []).filter((r) => r.instrument === id),
    (db.applicability.rules || []).filter((r) => r.instrument === id),
    (ix.relationship || []).filter((r) => r.from === id || r.to === id),
  ];
}

/* ---------------------------------------------------------- data */

export const DATASETS = ['taxonomy', 'instruments', 'institutions', 'sources', 'claims',
  'timeline', 'enforcement', 'applicability', 'glossary'];

export function loadDb(root = ROOT) {
  const db = {};
  for (const n of DATASETS) db[n] = JSON.parse(readFileSync(join(root, 'data', n + '.json'), 'utf8'));
  return db;
}

/* ---------------------------------------------------------- routes */

const crumbOf = (root, file) => {
  const p = join(root, file);
  if (!existsSync(p)) return null;
  return (readFileSync(p, 'utf8').match(/<body[^>]*data-crumb="([^"]+)"/) || [])[1] || null;
};

/**
 * Every address the site answers, with everything a crawler is told about
 * it. Indexable routes are the sitemap; the others are recorded with the
 * reason they are not, so the audit can hold them to it.
 */
export function buildRoutes(db, root = ROOT) {
  const ix = index(db);
  const routes = [];
  const home = { name: 'Digital Policy', url: BASE };

  for (const p of TOP_PAGES) {
    const url = BASE + p.path;
    const crumb = crumbOf(root, p.file);
    routes.push({
      kind: p.compat ? 'compat' : (p.file === 'index.html' ? 'home' : 'directory'),
      file: p.file, root: '', url,
      canonical: p.compat ? null : url,
      indexable: !p.compat,
      reason: p.compat ? 'compatibility route: forwards to an instrument page, or renders a thin record with noindex' : null,
      title: p.title, description: p.description, schema: p.schema,
      h1: null,
      breadcrumb: p.file === 'index.html' ? [] : [home, { name: crumb || p.title, url }],
      lastmod: p.records.length ? newest(p.records.flatMap((n) => datesIn(db[n]))) : null,
      image: SITE.image,
    });
  }

  for (const inst of R.entityInstruments(ix)) {
    const path = R.entityPath(inst.id);
    const url = BASE + path;
    routes.push({
      kind: 'instrument', id: inst.id, file: path + 'index.html', root: '../../', url,
      canonical: url, indexable: true, reason: null,
      title: instrumentTitle(inst, ix, db),
      description: instrumentDescription(inst, ix, db),
      schema: 'WebPage',
      h1: inst.short_name,
      breadcrumb: [home, { name: 'Instruments', url: BASE + 'instruments.html' }, { name: inst.short_name, url }],
      lastmod: newest(datesIn(entityRecords(inst, ix, db))),
      image: { path: `img/og/${inst.id}.png`, width: 1200, height: 630,
        alt: `${displayName(inst)} — ${inst.full_name}` },
    });
  }

  /* not pages of their own, recorded so the audit can hold them to it */
  for (const inst of [...new Set(ix.instrument.values())]) {
    if (R.hasEntityPage(inst, ix)) continue;
    routes.push({
      kind: 'app-state', id: inst.id, file: null, url: BASE + 'instrument.html?id=' + inst.id,
      canonical: null, indexable: false,
      reason: 'below the indexability gate: ' + R.gateReport(inst, ix).filter((g) => !g.met).map((g) => g.id).join(', '),
    });
  }
  const shipped = JSON.parse(readFileSync(join(root, 'i18n', 'locales.json'), 'utf8')).locales
    .filter((l) => l.file && l.code !== 'en');
  for (const l of shipped) {
    routes.push({
      kind: 'language', lang: l.code, file: null, url: BASE + '?lang=' + l.code, canonical: BASE, indexable: false,
      reason: 'the translation is applied by JavaScript over English HTML and has not been reviewed by a native speaker; ' +
        'advertised as an alternate only once a pre-rendered, reviewed page exists (docs/SEO-OPERATIONS.md §6)',
    });
  }
  return { routes, ix };
}

/* ---------------------------------------------------------- tags */

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const SBEGIN = '<!-- social-meta:begin — generated by tools/_footer.mjs, do not edit in place -->';
export const SEND = '<!-- social-meta:end -->';

/** Canonical, Open Graph, Twitter and JSON-LD for one route. */
export function socialMeta(route, ctx) {
  const img = route.image ? BASE + route.image.path : null;
  const lines = [];
  if (route.canonical) lines.push(`<link href="${route.canonical}" rel="canonical"/>`);
  lines.push(
    `<meta content="${attr(route.title)}" property="og:title"/>`,
    `<meta content="${attr(route.description)}" property="og:description"/>`,
    '<meta content="website" property="og:type"/>',
  );
  if (route.canonical) lines.push(`<meta content="${route.canonical}" property="og:url"/>`);
  lines.push(
    `<meta content="${attr(SITE.name)}" property="og:site_name"/>`,
    `<meta content="${SITE.ogLocale}" property="og:locale"/>`,
  );
  if (img) {
    lines.push(
      `<meta content="${img}" property="og:image"/>`,
      '<meta content="image/png" property="og:image:type"/>',
      `<meta content="${route.image.width}" property="og:image:width"/>`,
      `<meta content="${route.image.height}" property="og:image:height"/>`,
      `<meta content="${attr(route.image.alt)}" property="og:image:alt"/>`,
    );
  }
  lines.push(
    `<meta content="${img ? 'summary_large_image' : 'summary'}" name="twitter:card"/>`,
    `<meta content="${attr(route.title)}" name="twitter:title"/>`,
    `<meta content="${attr(route.description)}" name="twitter:description"/>`,
  );
  if (img) lines.push(`<meta content="${img}" name="twitter:image"/>`, `<meta content="${attr(route.image.alt)}" name="twitter:image:alt"/>`);
  if (route.indexable) lines.push(jsonLd(route, ctx));
  return lines.join('\n');
}

/* Structured data describes the page it is on and nothing else. It names
   no author, no publisher, no date of publication and no licence, because
   no page names any of them (AGENTS.md rule 8); adding one is the author's
   decision, not a generator's. An instrument page is `about` a
   schema.org Legislation node built from the record — identifier, type,
   names and the official text's URL — and asserts no legal force: the
   site's own model says one scalar cannot carry that, and
   legislationLegalForce would be exactly that scalar. */
export function jsonLd(route, { ix, routes } = {}) {
  const site = { '@type': 'WebSite', '@id': BASE + '#site', name: SITE.name, alternateName: SITE.alternateName,
    url: BASE, inLanguage: SITE.locale };
  const page = {
    '@type': route.schema || 'WebPage', '@id': route.url + '#page', url: route.url,
    name: route.title, description: route.description, inLanguage: SITE.locale,
    isPartOf: { '@id': BASE + '#site' },
  };
  if (route.image) {
    page.primaryImageOfPage = { '@type': 'ImageObject', url: BASE + route.image.path,
      width: route.image.width, height: route.image.height };
  }
  const graph = [site, page];
  if (route.breadcrumb && route.breadcrumb.length) {
    page.breadcrumb = { '@id': route.url + '#breadcrumb' };
    graph.push({ '@type': 'BreadcrumbList', '@id': route.url + '#breadcrumb',
      itemListElement: route.breadcrumb.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })) });
  }
  if (route.kind === 'instrument' && ix) {
    const inst = ix.instrument.get(route.id);
    const text = R.legalTextSource(inst, ix);
    const aka = R.knownAs(inst);
    const leg = {
      '@type': 'Legislation', '@id': route.url + '#legislation',
      name: inst.full_name,
      alternateName: [inst.short_name, ...(aka ? [aka] : [])],
      legislationIdentifier: 'CELEX:' + inst.celex,
      legislationType: taxLabel(ix, inst.kind),
    };
    if (text) leg.url = text.url;
    page.about = { '@id': leg['@id'] };
    graph.push(leg);
  }
  if (route.file === 'instruments.html' && routes) {
    const list = routes.filter((r) => r.kind === 'instrument');
    page.mainEntity = { '@type': 'ItemList', name: 'Instrument pages', numberOfItems: list.length,
      itemListElement: list.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: r.url, name: r.h1 })) };
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/* ---------------------------------------------------------- sitemap */

export function sitemapXml(routes) {
  const urls = routes.filter((r) => r.indexable && r.canonical);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((r) => `  <url><loc>${text(r.canonical)}</loc>${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';
}

/* ---------------------------------------------------------- static blocks */

export const IBEGIN = '<!-- site-index:begin — generated by tools/_footer.mjs, do not edit in place -->';
export const IEND = '<!-- site-index:end -->';

/** The site index before the footer on every page: the six destinations
 *  and every instrument page, as plain links a crawler can follow and a
 *  reader without the header can use. */
export function siteIndex(routes, ix, nav, root) {
  const insts = routes.filter((r) => r.kind === 'instrument').map((r) => ix.instrument.get(r.id));
  return `<nav class="site-index" aria-label="Site index">
<div class="si-inner">
<div class="si-col"><p class="si-label">Sections</p>
<ul>
${nav.map((n) => `<li><a href="${attr(root + n.file)}">${text(n.long)}</a></li>`).join('\n')}
</ul></div>
<div class="si-col si-wide"><p class="si-label">Instrument pages</p>
<ul>
${insts.map((i) => `<li><a href="${attr(root + R.entityPath(i.id))}">${text(displayName(i))}</a></li>`).join('\n')}
</ul></div>
</div>
</nav>`;
}

export const LBEGIN = '<!-- instrument-index:begin — generated by tools/_footer.mjs, do not edit in place -->';
export const LEND = '<!-- instrument-index:end -->';

/** The list on instruments.html: every instrument page, then the records
 *  too thin for a page of their own, named and linked rather than hidden. */
export function instrumentIndex(routes, ix) {
  const pages = routes.filter((r) => r.kind === 'instrument').map((r) => ix.instrument.get(r.id));
  const thin = [...new Set(ix.instrument.values())]
    .filter((i) => !R.hasEntityPage(i, ix) && !String(i.kind || '').includes('treaty'))
    .sort((a, b) => a.short_name.localeCompare(b.short_name));
  return `<section class="section inst-index" id="instrument-records" aria-labelledby="instrument-records-h">
<h2 id="instrument-records-h">One page per instrument</h2>
<p>Each of these instruments has a page of its own: what it does, where it stands, its key dates and
provisions, who supervises it, what enforcement it has produced, how it interacts with the others, and
the graded evidence behind every statement — read from the same records as the table above.</p>
<ul class="inst-list">
${pages.map((i) => instrumentListItem(i, ix, '')).join('\n')}
</ul>
<p class="inst-thin">The dataset also holds thinner records for ${plural(thin.length, 'other instrument')}, which the pages
above refer to but which do not yet carry enough — an objective, dates, evidence — to stand on their own:
${thin.map((i) => `<a href="${attr(R.instrumentHref(i, ix, ''))}">${text(i.short_name)}</a>`).join(', ')}.</p>
</section>`;
}

/* ---------------------------------------------------------- an instrument page */

/** The static crumbs on an instrument page, in the markup js/shell.js
 *  would otherwise build — it finds them and does not add its own. */
function crumbsHtml(route) {
  const items = route.breadcrumb.map((b, i, all) => i === all.length - 1
    ? `<li><span aria-current="page">${text(b.name)}</span></li>`
    : `<li><a href="${attr(route.root + (b.url === BASE ? 'index.html' : b.url.slice(BASE.length)))}">${text(b.name)}</a></li>`);
  return `<ol class="crumbs">${items.join('')}</ol>`;
}

/**
 * The HTML of instruments/<id>/index.html, before the generated blocks
 * (security meta, social meta, notice, index, footer) are applied by
 * tools/_footer.mjs exactly as on every other page.
 * @param shell  { favicon, bootstrap } — copied from instrument.html so the
 *               favicon and the inline theme script (and so its CSP hash)
 *               have one home
 */
export function instrumentPage(route, { ix, db }, shell) {
  const inst = ix.instrument.get(route.id);
  const body = renderInstrument(inst, { ix, db, overlay: {}, today: null, root: route.root });
  const r = route.root;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1" name="viewport"/>
<title>${text(route.title)}</title>
<meta content="${attr(route.description)}" name="description"/>
${shell.favicon}
<link href="${r}css/tokens.css" rel="stylesheet"/>
<link href="${r}style.css" rel="stylesheet"/>
<link href="${r}css/evidence.css" rel="stylesheet"/>
<link href="${r}css/tools.css" rel="stylesheet"/>
</head>
<body data-page="instrument" data-crumb="${attr(inst.short_name)}" data-root="${r}" data-instrument="${attr(inst.id)}">
${shell.bootstrap}
<a class="skip-link" href="#instrumentPage">Skip to content</a>
<div class="page-shell">
${crumbsHtml(route)}
<main id="instrumentPage">
${body}
</main>
</div>

<script src="${r}js/boot.js" type="module"></script>
<script src="${r}js/instrument-page.js" type="module"></script>
</body>
</html>
`;
}
