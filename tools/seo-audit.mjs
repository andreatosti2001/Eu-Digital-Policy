#!/usr/bin/env node
/* ============================================================
   tools/seo-audit.mjs — what a crawler is told, checked against
   what the page says

   docs/SEO-AUDIT-2026-09-27.md found every one of its defects by
   reading the site the way a crawler reads it: the HTML as served,
   before any script runs. This does the same, on every push, against
   the route model (tools/seo.mjs) that is supposed to have produced
   it. It reads files; it fetches nothing, runs no browser and reads
   no clock, so the same tree always gets the same verdict. What only
   a browser can see — the rendered page agreeing with the static one,
   the forwarding of instrument.html?id=… — is agent/browser's `seo`
   checks.

   Sections:
     1  generated files are current      (_footer.mjs --check, og-image --check)
     2  metadata per page                title, description, canonical, robots, OG, Twitter
     3  HTML per page                    <h1>, headings, crawlable text, title facets
     4  canonical and sitemap            one canonical per entity, sitemap = indexable routes
     5  crawl graph                      every indexable page reachable by static <a href>
     6  structured data                  parses, allowed types, agrees with the page
     7  languages                        no alternate that is not a real, crawlable page
     8  the route model itself           names backed by aliases, curated titles in use

   Exit 1 on any ERROR. A WARNING is a finding, as everywhere else here.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stale } from './_footer.mjs';
import { staleCards } from './og-image.mjs';
import { BASE, SITE, TOP_PAGES, INSTRUMENT_TITLE, loadDb, buildRoutes, sitemapXml } from './seo.mjs';
import { sitePages } from './thirdparty.mjs';
import * as R from '../js/routes.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------------------------------------------------------- reading HTML
   Deliberately crawler-shaped: scripts, styles and <noscript> removed
   before text or links are counted, because a crawler that runs no script
   sees the first two as nothing and treats the third as a fallback, not
   as the page. */
export function read(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, ''])[1];
  const visible = body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = visible.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim();
  const meta = (key, name) => {
    const re = new RegExp(`<meta content="([^"]*)" ${key}="${name}"/>`, 'g');
    return [...html.matchAll(re)].map((m) => m[1]);
  };
  return {
    title: [...html.matchAll(/<title>([\s\S]*?)<\/title>/g)].map((m) => unesc(m[1].trim())),
    description: meta('name', 'description').map(unesc),
    canonical: [...html.matchAll(/<link href="([^"]+)" rel="canonical"\/>/g)].map((m) => m[1]),
    robots: meta('name', 'robots'),
    og: (p) => meta('property', 'og:' + p).map(unesc),
    tw: (p) => meta('name', 'twitter:' + p).map(unesc),
    hreflang: [...html.matchAll(/<link href="([^"]+)" hreflang="([^"]+)" rel="alternate"\/>/g)].map((m) => ({ href: m[1], lang: m[2] })),
    h1: [...visible.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()),
    h2: (visible.match(/<h2[\s>]/g) || []).length,
    links: [...visible.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]),
    jsonld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    crumbs: [...(visible.match(/<ol class="crumbs">([\s\S]*?)<\/ol>/) || [, ''])[1].matchAll(/<li>([\s\S]*?)<\/li>/g)]
      .map((m) => unesc(m[1].replace(/<[^>]+>/g, '').trim())),
    dataCrumb: (html.match(/<body[^>]*data-crumb="([^"]+)"/) || [])[1] || null,
    text,
  };
}
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** The site path a URL on this site names, or null for another origin. */
const pathOf = (url) => (url.startsWith(BASE) ? url.slice(BASE.length) : null);
/** The file a site path is served from. */
const fileOf = (path) => (path === '' || path.endsWith('/') ? path + 'index.html' : path);
/** Resolve an href on page `from` to a site path, or null if it leaves the site. */
function resolveHref(from, href) {
  if (/^(mailto:|data:|javascript:|#)/i.test(href)) return null;
  let u;
  try { u = new URL(href, BASE + from); } catch { return null; }
  if (!u.href.startsWith(BASE)) return null;
  return u.pathname.slice(new URL(BASE).pathname.length) + u.search;
}

/* Titles that name a kind of page rather than a page. */
const GENERIC_TITLE = /^(home|index|instrument|instruments|page|untitled|compare|bibliography|search|results?)(\s*[|—-].*)?$/i;
const MIN_TEXT = 1500;          /* characters of crawlable text on an indexable page */
const MIN_DESC = 70;
const MAX_DESC = 420;
const MAX_TITLE = 110;

/* Structured-data types this site may declare, and properties it may not:
   every one of the second list would assert something no page states —
   who wrote it, when it was published, what it is licensed under, how it
   is rated, or a legal force the site's own model says one scalar cannot
   carry. Adding either is a decision, not a fix. */
export const LD_TYPES = new Set(['WebSite', 'WebPage', 'CollectionPage', 'BreadcrumbList', 'ListItem',
  'ItemList', 'Legislation', 'ImageObject']);
export const LD_FORBIDDEN = ['author', 'creator', 'publisher', 'datePublished', 'dateCreated', 'dateModified',
  'license', 'aggregateRating', 'review', 'legislationLegalForce', 'legislationDate'];

export function audit(root = ROOT) {
  const errors = [];
  const warnings = [];
  const err = (w, m) => errors.push(`${w}: ${m}`);
  const warn = (w, m) => warnings.push(`${w}: ${m}`);

  const db = loadDb(root);
  const { routes, ix } = buildRoutes(db, root);
  const byFile = new Map(routes.filter((r) => r.file).map((r) => [r.file, r]));
  const pages = sitePages(root);
  const parsed = new Map(pages.map((f) => [f, read(readFileSync(join(root, f), 'utf8'))]));

  /* ---------------------------------------------------- 2 · metadata */
  const titles = new Map();
  const descs = new Map();
  for (const [f, p] of parsed) {
    const route = byFile.get(f);
    if (!route) { err(f, 'a page the route model (tools/seo.mjs) does not know — every page needs a route'); continue; }
    const one = (xs, what) => { if (xs.length !== 1) err(f, `${xs.length} ${what}`); return xs[0]; };
    const title = one(p.title, '<title> elements');
    const desc = one(p.description, 'meta descriptions');
    if (title !== route.title) err(f, `<title> is not the route model's: "${title}" ≠ "${route.title}" — run node tools/_footer.mjs`);
    if (desc !== route.description) err(f, 'the meta description is not the route model\'s — run node tools/_footer.mjs');
    if (!title || GENERIC_TITLE.test(title.split(' | ')[0])) err(f, `generic title "${title}"`);
    if (title && title.length > MAX_TITLE) warn(f, `title is ${title.length} characters`);
    if (!desc || desc.length < MIN_DESC) err(f, `description is ${desc ? desc.length : 0} characters — too short to say what the page is`);
    else if (desc.length > MAX_DESC) warn(f, `description is ${desc.length} characters`);

    const ogt = p.og('title'); const ogd = p.og('description');
    if (ogt[0] !== title) err(f, 'og:title differs from <title>');
    if (ogd[0] !== desc) err(f, 'og:description differs from the meta description');
    if (p.tw('title')[0] !== title) err(f, 'twitter:title differs from <title>');
    if (p.tw('description')[0] !== desc) err(f, 'twitter:description differs from the meta description');
    if (p.og('site_name')[0] !== SITE.name) err(f, `og:site_name is not "${SITE.name}"`);

    if (route.indexable) {
      if (title) titles.set(title, [...(titles.get(title) || []), f]);
      if (desc) descs.set(desc, [...(descs.get(desc) || []), f]);
      const canon = one(p.canonical, 'canonical links');
      if (canon !== route.canonical) err(f, `canonical ${canon} ≠ route ${route.canonical}`);
      if (canon && (/[?#]/.test(canon) || !canon.startsWith(BASE))) err(f, `malformed canonical ${canon}`);
      if (p.og('url')[0] !== canon) err(f, 'og:url differs from the canonical');
      if (p.robots.some((x) => /noindex/i.test(x))) err(f, 'an indexable page carries noindex');
    } else if (p.canonical.length) {
      err(f, `a non-indexable route (${route.reason}) declares a canonical`);
    }

    const img = p.og('image')[0];
    if (route.image) {
      if (!img) err(f, 'no og:image');
      else {
        const path = pathOf(img);
        if (path === null) err(f, `og:image on another origin: ${img}`);
        else if (!existsSync(join(root, path))) err(f, `og:image ${path} does not exist`);
        else {
          const png = readFileSync(join(root, path));
          if (png.toString('ascii', 1, 4) !== 'PNG') err(f, `og:image ${path} is not a PNG`);
          else if (String(png.readUInt32BE(16)) !== p.og('image:width')[0] || String(png.readUInt32BE(20)) !== p.og('image:height')[0]) {
            err(f, `og:image:width/height do not match ${path}`);
          }
        }
        if (!p.og('image:alt')[0]) err(f, 'og:image has no alt text');
        if (p.tw('card')[0] !== 'summary_large_image') err(f, 'twitter:card is not summary_large_image although there is an image');
        if (p.tw('image')[0] !== img) err(f, 'twitter:image differs from og:image');
      }
    }
  }
  for (const [t, fs] of titles) if (fs.length > 1) err('titles', `"${t}" is used by ${fs.join(', ')}`);
  for (const [d, fs] of descs) if (fs.length > 1) err('descriptions', `one description is used by ${fs.join(', ')}: "${d.slice(0, 60)}…"`);

  /* ---------------------------------------------------- 3 · HTML */
  for (const [f, p] of parsed) {
    const route = byFile.get(f);
    if (!route || !route.indexable) continue;
    if (p.h1.length !== 1) err(f, `${p.h1.length} <h1> in the HTML as served — a crawler that runs no script sees ${p.h1.length ? 'more than one' : 'no'} page heading`);
    if (route.h1 && p.h1[0] !== route.h1) err(f, `<h1> "${p.h1[0]}" is not the instrument's name "${route.h1}"`);
    if (!p.h2) err(f, 'no <h2>: the page has no sections a crawler can see');
    if (p.text.length < MIN_TEXT) err(f, `${p.text.length} characters of crawlable text (minimum ${MIN_TEXT}) — the substance exists only after JavaScript`);

    if (route.kind === 'instrument') {
      const inst = ix.instrument.get(route.id);
      const cur = INSTRUMENT_TITLE[route.id];
      /* the title may promise only what the page visibly carries */
      for (const [facet, must] of (cur ? cur.facets : [])) {
        if (!new RegExp(must, 'i').test(p.text)) err(f, `title facet "${facet}" is not supported by the page text (looked for /${must}/i)`);
      }
      if (cur) {
        for (const w of cur.lead.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean)) {
          if (!new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p.text)) err(f, `title word "${w}" does not appear on the page`);
        }
      }
      if (!p.description[0].includes(inst.short_name)) err(f, 'the description does not name the instrument');
      if (!p.text.includes(inst.full_name)) err(f, 'the full name of the act is not in the page text');
      const crumbs = p.crumbs;
      const want = route.breadcrumb.map((b) => b.name);
      if (crumbs.join(' › ') !== want.join(' › ')) err(f, `static breadcrumb "${crumbs.join(' › ')}" ≠ route "${want.join(' › ')}"`);
    }
  }

  /* the record index inside each JavaScript-rendered register names every
     record the register holds, by the id the full view gives it */
  for (const [f, list] of [['enforcement.html', db.enforcement.enforcement], ['institutions.html', db.institutions.institutions],
    ['bibliography.html', db.sources.sources]]) {
    const html = existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : '';
    const missing = (list || []).filter((r) => !html.includes(`<li id="${r.id}">`));
    if (missing.length) err(f, `the static record index omits ${missing.length} record(s), e.g. ${missing[0].id} — run node tools/_footer.mjs`);
  }

  /* ---------------------------------------------------- 4 · canonical and sitemap */
  const smPath = join(root, 'sitemap.xml');
  const sm = existsSync(smPath) ? readFileSync(smPath, 'utf8') : '';
  if (!sm) err('sitemap.xml', 'missing');
  if (sm !== sitemapXml(routes)) err('sitemap.xml', 'not what the route model generates — run node tools/_footer.mjs');
  const entries = [...sm.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)].map((m) => ({ loc: m[1].replace(/&amp;/g, '&'), lastmod: m[2] || null }));
  const seen = new Set();
  const indexable = routes.filter((r) => r.indexable);
  for (const e of entries) {
    if (seen.has(e.loc)) err('sitemap.xml', `${e.loc} listed twice`);
    seen.add(e.loc);
    const route = indexable.find((r) => r.canonical === e.loc);
    if (!route) { err('sitemap.xml', `${e.loc} is not the canonical URL of any indexable route`); continue; }
    if (/[?#]/.test(e.loc)) err('sitemap.xml', `${e.loc} carries a query or fragment`);
    const path = pathOf(e.loc);
    const file = path === null ? null : fileOf(path);
    if (!file || !existsSync(join(root, file))) { err('sitemap.xml', `${e.loc} resolves to no file`); continue; }
    const page = parsed.get(file);
    if (!page || page.canonical[0] !== e.loc) err('sitemap.xml', `${e.loc}: the page at that address names ${page && page.canonical[0]} as canonical`);
    if (page && page.robots.some((x) => /noindex/i.test(x))) err('sitemap.xml', `${e.loc} is noindex`);
    if (e.lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod)) err('sitemap.xml', `${e.loc}: lastmod ${e.lastmod} is not a date`);
    if (e.lastmod !== route.lastmod) err('sitemap.xml', `${e.loc}: lastmod ${e.lastmod} ≠ the newest verification date the page renders (${route.lastmod})`);
  }
  for (const r of indexable) if (!seen.has(r.canonical)) err('sitemap.xml', `indexable route ${r.canonical} is missing`);
  const canons = new Map();
  for (const [f, p] of parsed) for (const c of p.canonical) canons.set(c, [...(canons.get(c) || []), f]);
  for (const [c, fs] of canons) if (fs.length > 1) err('canonical', `${c} is claimed by ${fs.join(', ')}`);
  /* the query form must not compete: every instrument with a page is
     reached at instruments/<id>/, and instrument.html names no canonical */
  for (const r of routes.filter((x) => x.kind === 'app-state')) {
    if (seen.has(r.url)) err('sitemap.xml', `${r.url} is below the gate (${r.reason}) and must not be listed`);
  }
  const page = readFileSync(join(root, 'js', 'instrument-page.js'), 'utf8');
  if (!/hasEntityPage\(/.test(page) || !/location\.replace\(/.test(page)) {
    err('js/instrument-page.js', 'instrument.html?id=… no longer forwards to the instrument\'s own page — two URLs would compete for one entity');
  }
  if (!/noindex/.test(page)) err('js/instrument-page.js', 'a thin record rendered at instrument.html?id=… is no longer marked noindex');

  /* ---------------------------------------------------- 5 · crawl graph */
  const reach = new Set(['index.html']);
  const queue = ['index.html'];
  const inbound = new Map();
  while (queue.length) {
    const f = queue.shift();
    const p = parsed.get(f);
    if (!p) continue;
    for (const href of p.links) {
      const path = resolveHref(f, href);
      if (path === null || path.includes('?')) continue;
      const target = fileOf(path.split('#')[0]);
      if (target !== f) inbound.set(target, (inbound.get(target) || 0) + 1);
      if (!parsed.has(target)) {
        if (!existsSync(join(root, target))) err(f, `links to ${href}, which does not exist`);
        continue;
      }
      if (!reach.has(target)) { reach.add(target); queue.push(target); }
    }
  }
  for (const r of indexable) {
    if (!reach.has(r.file)) err(r.file, 'not reachable from the home page by any static <a href> — only JavaScript leads here');
    else if (r.file !== 'index.html' && (inbound.get(r.file) || 0) < 2) warn(r.file, `only ${inbound.get(r.file) || 0} static inbound link(s)`);
  }

  /* ---------------------------------------------------- 6 · structured data */
  const walk = (x, fn) => { if (Array.isArray(x)) x.forEach((v) => walk(v, fn)); else if (x && typeof x === 'object') { fn(x); Object.values(x).forEach((v) => walk(v, fn)); } };
  for (const [f, p] of parsed) {
    const route = byFile.get(f);
    if (!route) continue;
    if (!route.indexable) { if (p.jsonld.length) err(f, 'structured data on a page that is not indexed'); continue; }
    if (p.jsonld.length !== 1) { err(f, `${p.jsonld.length} JSON-LD blocks`); continue; }
    let doc;
    try { doc = JSON.parse(p.jsonld[0]); } catch (e) { err(f, `JSON-LD does not parse: ${e.message}`); continue; }
    if (doc['@context'] !== 'https://schema.org') err(f, 'JSON-LD @context is not https://schema.org');
    const graph = doc['@graph'] || [];
    walk(graph, (o) => {
      if (o['@type'] && !LD_TYPES.has(o['@type'])) err(f, `JSON-LD type ${o['@type']} is not one this site declares`);
      for (const k of LD_FORBIDDEN) if (k in o) err(f, `JSON-LD asserts "${k}", which no page states`);
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string' && /^https?:\/\//.test(v) && v.startsWith(new URL(BASE).origin) && !v.startsWith(BASE)) err(f, `JSON-LD ${k} ${v} is outside the site`);
      }
    });
    const site = graph.find((x) => x['@type'] === 'WebSite');
    if (!site || site.name !== SITE.name || site.url !== BASE) err(f, 'WebSite node missing or not the site identity');
    const pg = graph.find((x) => x['@id'] === route.url + '#page');
    if (!pg) { err(f, 'no page node for this URL'); continue; }
    if (pg['@type'] !== route.schema) err(f, `page type ${pg['@type']} ≠ route ${route.schema}`);
    if (pg.url !== p.canonical[0]) err(f, 'JSON-LD page url differs from the canonical');
    if (pg.name !== p.title[0]) err(f, 'JSON-LD page name differs from <title>');
    if (pg.description !== p.description[0]) err(f, 'JSON-LD description differs from the meta description');
    if (pg.primaryImageOfPage && pg.primaryImageOfPage.url !== p.og('image')[0]) err(f, 'JSON-LD image differs from og:image');
    const bc = graph.find((x) => x['@type'] === 'BreadcrumbList');
    if (route.breadcrumb.length) {
      if (!bc) err(f, 'no BreadcrumbList');
      else {
        const items = bc.itemListElement || [];
        items.forEach((it, i) => { if (it.position !== i + 1) err(f, 'breadcrumb positions are not 1..n'); });
        if (items[0] && items[0].item !== BASE) err(f, 'breadcrumb does not start at the home page');
        if (items.length && items[items.length - 1].item !== p.canonical[0]) err(f, 'breadcrumb does not end at this page');
        const visible = p.crumbs.length ? p.crumbs : ['Digital Policy', p.dataCrumb];
        if (items.map((x) => x.name).join(' › ') !== visible.join(' › ')) err(f, `breadcrumb names "${items.map((x) => x.name).join(' › ')}" ≠ the page's "${visible.join(' › ')}"`);
      }
    } else if (bc) err(f, 'a BreadcrumbList on the home page');
    if (route.kind === 'instrument') {
      const inst = ix.instrument.get(route.id);
      const leg = graph.find((x) => x['@type'] === 'Legislation');
      if (!leg) err(f, 'no Legislation node for the instrument');
      else {
        if (leg.legislationIdentifier !== 'CELEX:' + inst.celex) err(f, 'Legislation identifier is not the record\'s CELEX');
        if (leg.name !== inst.full_name) err(f, 'Legislation name is not the record\'s full name');
        const text = R.legalTextSource(inst, ix);
        if ((leg.url || null) !== (text ? text.url : null)) err(f, 'Legislation url is not the official text the records hold');
        if (!pg.about || pg.about['@id'] !== leg['@id']) err(f, 'the page is not declared to be about the instrument');
      }
    }
  }

  /* ---------------------------------------------------- 7 · languages */
  const langRoutes = routes.filter((r) => r.kind === 'language');
  for (const [f, p] of parsed) {
    for (const h of p.hreflang) {
      const path = pathOf(h.href);
      const alt = path === null ? null : routes.find((r) => r.url === h.href);
      if (!alt || !alt.indexable) { err(f, `hreflang ${h.lang} → ${h.href}, which is not an indexable, self-canonical page`); continue; }
      const back = parsed.get(alt.file);
      if (!back || !back.hreflang.some((x) => x.href === byFile.get(f).canonical)) err(f, `hreflang ${h.lang} → ${h.href} is not reciprocated`);
    }
  }
  for (const r of langRoutes) if (seen.has(r.url)) err('sitemap.xml', `${r.url} (a JavaScript-only translation) is listed`);

  /* ---------------------------------------------------- 8 · the route model */
  for (const [id, name] of Object.entries(R.KNOWN_AS)) {
    const inst = ix.instrument.get(id);
    if (!inst) err('js/routes.js', `KNOWN_AS names ${id}, which is not an instrument`);
    else if (!R.knownAs(inst)) err('js/routes.js', `KNOWN_AS "${name}" matches no alias of ${id} — the data does not hold that name`);
  }
  for (const id of Object.keys(INSTRUMENT_TITLE)) {
    if (!routes.some((r) => r.kind === 'instrument' && r.id === id)) warn('tools/seo.mjs', `INSTRUMENT_TITLE.${id} has no page (below the gate) and is unused`);
  }
  for (const p of TOP_PAGES) if (!existsSync(join(root, p.file))) err('tools/seo.mjs', `${p.file} is registered but does not exist`);

  /* ---------------------------------------------------- 1 · generated files current */
  return { errors, warnings, routes, pages: pages.length };
}

export async function auditAll(root = ROOT) {
  const r = audit(root);
  for (const s of await stale(root)) r.errors.unshift(`generated: ${s} — run node tools/_footer.mjs`);
  for (const s of staleCards(root)) r.errors.unshift(`social card: ${s}`);
  return r;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await auditAll();
  const line = (s) => process.stdout.write(s + '\n');
  const idx = r.routes.filter((x) => x.indexable);
  line(`seo-audit · ${r.pages} pages · ${r.routes.length} routes · ${idx.length} indexable · ${idx.filter((x) => x.kind === 'instrument').length} instrument pages`);
  line('');
  line('  NOT INDEXED, AND WHY');
  for (const x of r.routes.filter((y) => !y.indexable)) line(`    ${x.url.replace(BASE, '/')}  — ${x.reason}`);
  line('');
  for (const e of r.errors) line('  ERROR   ' + e);
  for (const w of r.warnings) line('  warning ' + w);
  line('');
  line(`ERRORS ${r.errors.length}   WARNINGS ${r.warnings.length}`);
  process.exit(r.errors.length ? 1 : 0);
}
