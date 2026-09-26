/* ============================================================
   agent/scout/extract.mjs — what can honestly be read off a page

   The rule this file exists to keep: **nothing is inferred from a
   URL, a filename, or the shape of a page.** A publication date is
   read from a machine-readable field the document itself carries, or
   it is not read at all. A title comes from the document's own
   <title> or og:title. A publisher comes from the document saying
   who published it — not from the hostname, because "served by
   edpb.europa.eu" is a fact about a server and "published by the
   EDPB" is a fact about a document, and the Scout keeps those apart:
   the host produces an *authority_class*, typed as inference, and
   never a publisher, typed as fact.

   Everything here returns null rather than a good guess. A null
   makes the Scout write an open question; a good guess makes it
   write something a reader might act on.

   The HTML handling is regex over meta tags. That is enough for
   what is read here and honest about its limits: a page that does
   not carry a machine-readable date yields null, which is the
   correct answer, not a parsing failure.
   ============================================================ */

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
  .trim();

const clean = (s) => decode(String(s)).replace(/\s+/g, ' ').trim();

/** Content of the first <meta> whose name or property matches. */
function meta(html, keys) {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property|itemprop)\\s*=\\s*["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
      'i',
    );
    const tag = html.match(re)?.[0];
    if (!tag) continue;
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (content && content.trim()) return { value: clean(content), field: key };
  }
  return null;
}

/** The document's own title, or null. */
export function extractTitle(html) {
  const og = meta(html, ['og:title', 'citation_title', 'DC.title', 'dcterms.title']);
  if (og) return { value: og.value, read_from: `<meta ${og.field}>` };
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (t && clean(t)) return { value: clean(t), read_from: '<title>' };
  return null;
}

/**
 * A publication date only where the document states one in a
 * machine-readable field, returned exactly as printed. Never
 * reformatted, never widened, never taken from a URL — the datasets
 * record how precisely a date is published, and inventing precision
 * is how a month becomes a day.
 */
export function extractPublicationDate(html) {
  const m = meta(html, [
    'article:published_time', 'citation_publication_date', 'citation_date',
    'DC.date', 'DC.Date', 'DC.date.issued', 'dcterms.issued', 'dcterms.created',
    'datePublished', 'date', 'pubdate',
  ]);
  if (m) return { value: m.value, read_from: `<meta ${m.field}>` };
  const t = html.match(/<time[^>]+datetime\s*=\s*["']([^"']+)["']/i)?.[1];
  if (t && t.trim()) return { value: clean(t), read_from: '<time datetime>' };
  return null;
}

/** Who the document says published it. Never the hostname. */
export function extractPublisher(html) {
  const m = meta(html, ['og:site_name', 'citation_publisher', 'DC.publisher', 'dcterms.publisher', 'publisher', 'application-name']);
  return m ? { value: m.value, read_from: `<meta ${m.field}>` } : null;
}

/** Visible text, roughly, for term matching. */
export function textOf(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');
}

/**
 * Same-host links, absolute, deduplicated, in document order. The
 * Scout follows links it was given rather than guessing at paths,
 * which is the difference between discovering a document and
 * inventing an address for one.
 */
export function extractLinks(html, baseUrl, { limit = 40 } = {}) {
  const base = new URL(baseUrl);
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a[^>]+href\s*=\s*["']([^"'#]+)["']/gi)) {
    let u;
    try { u = new URL(decode(m[1]), base); } catch { continue; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
    if (u.hostname.toLowerCase() !== base.hostname.toLowerCase()) continue;
    u.hash = '';
    const s = u.toString();
    if (seen.has(s) || s === baseUrl) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------------------------------------------------------- listing links

   A listing page links to its own navigation before it links to
   anything it lists: language switchers, section menus, pagination.
   Taken in document order, the first four same-host links on a live
   EDPB or Commission page are exactly those, and four navigation
   pages were proposed as candidates in the September 2026 digests
   (AUDIT-2026-09-25, T-39). A candidate has to be a document with
   its own title and date, not a way of getting to one.

   Two steps, both stated as rules rather than a score:
     1. DROP links that are provably not documents — the listing
        itself in another language or with a query string, and the
        navigation paths named below.
     2. ORDER what is left so document-shaped links come first: a
        link under the listing's own path, a link carrying a date in
        its path, or a link whose last segment is a slug of four or
        more words — the first two ahead of the third. The order is
        otherwise the page's own, and nothing else is dropped, so a
        listing with no document-shaped links behaves exactly as
        before.

   Neither step reads a date or a title as a fact. A date in a URL
   orders a link; it is never recorded as a publication date
   (extractPublicationDate reads machine-readable fields only). */

/** Paths that are navigation on the registered hosts. Matched
 *  against the path with any language prefix or `_xx` suffix
 *  removed. Each entry is a page a live digest actually proposed, or
 *  one of the same kind on the same site. */
export const NAVIGATION_PATHS = [
  /^\/(?:home|index|documents|topics|registers|public-consultations|news|latest-news|feed\/news)$/,
  /^\/audience(?:\/|$)/,
  /^\/topics\//,
];

/** A path with its language marker removed: `/en/news` and
 *  `/news_en` both become `/news`. */
export function stripLanguage(pathname) {
  return (pathname.replace(/_[a-z]{2}$/, '').replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/').replace(/(.)\/$/, '$1');
}

/** Why a link on a listing page is not a document, or null if it
 *  may be one. */
export function navigationReason(url, listingUrl) {
  let u, base;
  try { u = new URL(url); base = new URL(listingUrl); } catch { return 'unparseable'; }
  const path = stripLanguage(u.pathname);
  if (path === stripLanguage(base.pathname)) return 'the listing itself, in another language or with a query string';
  const hit = NAVIGATION_PATHS.find((re) => re.test(path));
  return hit ? `navigation path ${hit}` : null;
}

/** How document-shaped a link is, strongest first:
 *    2  under the listing's own path, or a date in its path —
 *       the two shapes live news listings were observed to use;
 *    1  a last segment that is a slug of four or more words — weaker,
 *       because section menus use long slugs too;
 *    0  anything else. */
export function documentShape(url, listingUrl) {
  let u, base;
  try { u = new URL(url); base = new URL(listingUrl); } catch { return 0; }
  const path = stripLanguage(u.pathname);
  const stem = stripLanguage(base.pathname);
  if (stem !== '/' && path.startsWith(`${stem}/`)) return 2;
  if (/\b\d{4}-\d{2}-\d{2}\b/.test(path)) return 2;
  const last = path.split('/').filter(Boolean).pop() ?? '';
  return last.split('-').length >= 4 ? 1 : 0;
}

/** Step 1 and step 2 above, over links already taken from a listing.
 *  A stable sort: within one shape, the page's own order stands. */
export function rankListingLinks(links, listingUrl) {
  const kept = links.filter((l) => navigationReason(l, listingUrl) === null);
  return [2, 1, 0].flatMap((shape) => kept.filter((l) => documentShape(l, listingUrl) === shape));
}

/* ---------------------------------------------------------- relevance */

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build the search terms from the repository's own instrument
 * records. Nothing is invented: every term is a short_name,
 * full_name, alias or CELEX number already in data/instruments.json,
 * so a match can be checked by looking at the record it came from.
 */
export function instrumentTerms(instruments) {
  const terms = [];
  for (const ins of instruments) {
    if (ins.short_name) terms.push({ id: ins.id, term: ins.short_name, kind: 'short_name', re: new RegExp(`\\b${escape(ins.short_name)}\\b`, 'g') });
    if (ins.full_name) terms.push({ id: ins.id, term: ins.full_name, kind: 'full_name', re: new RegExp(escape(ins.full_name), 'gi') });
    if (ins.celex) terms.push({ id: ins.id, term: ins.celex, kind: 'celex', re: new RegExp(`\\b${escape(ins.celex)}\\b`, 'gi') });
    for (const a of ins.aliases ?? []) {
      const phrase = a.replace(/-/g, ' ');
      terms.push({ id: ins.id, term: phrase, kind: 'alias', re: new RegExp(`\\b${escape(phrase)}\\b`, 'gi') });
    }
  }
  return terms;
}

/**
 * Which instruments a document mentions, and on what string. The
 * matched string is carried so the judgment is checkable: "relevant"
 * with no matched term is an opinion, "matched \"Digital Services
 * Act\" 3 times" is a finding somebody can disagree with.
 */
const SPECIFICITY = { celex: 4, full_name: 3, alias: 2, short_name: 1 };

export function matchInstruments(text, terms) {
  const hits = new Map();
  for (const t of terms) {
    const n = (text.match(t.re) ?? []).length;
    if (!n) continue;
    const prev = hits.get(t.id);
    /* Keep the most specific match, not merely the most frequent: a
       CELEX number identifies an instrument, and "DSA" is three
       letters that could be anything. */
    const better = !prev
      || SPECIFICITY[t.kind] > SPECIFICITY[prev.match_kind]
      || (SPECIFICITY[t.kind] === SPECIFICITY[prev.match_kind] && n > prev.count);
    if (better) hits.set(t.id, { instrument_id: t.id, matched_on: t.term, match_kind: t.kind, count: n });
  }
  return [...hits.values()].sort((a, b) => SPECIFICITY[b.match_kind] - SPECIFICITY[a.match_kind] || b.count - a.count);
}
