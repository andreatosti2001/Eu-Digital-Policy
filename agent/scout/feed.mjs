/* ============================================================
   agent/scout/feed.mjs — turning a response body into candidates

   Zero dependencies, because that is this repository's rule and
   not a preference. A feed parser is one of the places it is
   tempting to reach for a library; the shapes below are RSS 2.0
   and Atom, both small, and the cost of getting them slightly
   wrong is a candidate a human declines to promote — not a false
   statement on the site.

   WHAT THIS DELIBERATELY DOES NOT DO

   It does not interpret. A candidate carries the title, link,
   date and summary the publisher wrote, marked as the
   publisher's words, and nothing inferred from them. The Scout's
   whole contract is that a human decides what a document is.

   It does not guess a date it did not read. `published` is null
   when the entry carried none — never today's date, never the
   run date. `null` is "not stated by the publisher"; that is the
   same distinction the datasets already keep, applied here.

   It does not silently drop what it could not parse. A body that
   yielded nothing returns `entries: []` WITH a `problems` array
   saying why, so a feed that changed shape shows up in the report
   as an unresolved retrieval problem rather than as a quiet zero.
   ============================================================ */

/* ---------------------------------------------------------- text */

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#039': "'", '#34': '"',
};

export function decodeEntities(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    const key = name.toLowerCase();
    if (ENTITIES[key] !== undefined) return ENTITIES[key];
    if (key.startsWith('#x')) {
      const cp = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole;
    }
    if (key.startsWith('#')) {
      const cp = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole;
    }
    return whole;
  });
}

/** CDATA out, tags out, entities decoded, whitespace collapsed. */
export function plainText(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = s.replace(/<[^>]*>/g, ' ');
  s = decodeEntities(s);
  s = s.replace(/\s+/g, ' ').trim();
  return s.length ? s : null;
}

const tagBody = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1] : null;
};

const attr = (openTag, name) => {
  const m = openTag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? decodeEntities(m[2] ?? m[3] ?? '') : null;
};

/** An ISO date if the string parses as one, else null. Never a
 *  substitute date: a publisher that stated nothing stated nothing. */
export function normaliseDate(raw) {
  const s = plainText(raw);
  if (!s) return null;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/* ---------------------------------------------------------- feeds */

function atomLink(entryXml) {
  /* Atom: prefer rel="alternate" (or no rel, which means alternate)
     over rel="self"/"enclosure". */
  const links = [...entryXml.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  let fallback = null;
  for (const a of links) {
    const href = attr(a, 'href');
    if (!href) continue;
    const rel = (attr(a, 'rel') ?? 'alternate').toLowerCase();
    if (rel === 'alternate') return href;
    fallback ??= href;
  }
  return fallback;
}

/**
 * Parse an RSS 2.0 or Atom body into candidate entries.
 * @returns {{format:string|null, entries:object[], problems:string[]}}
 */
export function parseFeed(body, { baseUrl = null } = {}) {
  const problems = [];
  if (typeof body !== 'string' || !body.trim()) {
    return { format: null, entries: [], problems: ['empty response body'] };
  }

  const looksRss = /<rss[\s>]|<channel[\s>]/i.test(body);
  const looksAtom = /<feed[\s>][^>]*xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2005\/Atom|<feed[\s>]/i.test(body);
  const blocks = [...body.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];

  if (!blocks.length) {
    if (!looksRss && !looksAtom) {
      problems.push('body is not RSS or Atom — no <item> or <entry> elements, and no feed root element');
    } else {
      problems.push('feed root recognised but it contains no <item> or <entry> elements');
    }
    return { format: looksAtom ? 'atom' : looksRss ? 'rss' : null, entries: [], problems };
  }

  const format = blocks[0][1].toLowerCase() === 'entry' ? 'atom' : 'rss';
  const entries = [];

  for (const [, , inner] of blocks) {
    const title = plainText(tagBody(inner, 'title'));

    let link = format === 'atom' ? atomLink(inner) : plainText(tagBody(inner, 'link'));
    if (!link) link = plainText(tagBody(inner, 'guid'));      /* many RSS feeds put the URL there */
    if (link && baseUrl) {
      try { link = new URL(link, baseUrl).toString(); } catch { /* keep it as written */ }
    }

    const published =
      normaliseDate(tagBody(inner, 'pubDate')) ??
      normaliseDate(tagBody(inner, 'published')) ??
      normaliseDate(tagBody(inner, 'updated')) ??
      normaliseDate(tagBody(inner, 'dc:date'));

    const summary = plainText(
      tagBody(inner, 'description') ?? tagBody(inner, 'summary') ?? tagBody(inner, 'content'),
    );

    const guid = plainText(tagBody(inner, 'guid')) ?? plainText(tagBody(inner, 'id')) ?? null;

    if (!title && !link) { problems.push('an entry carried neither a title nor a link and was not usable'); continue; }
    entries.push({
      title,
      link: link ?? null,
      published,                                  /* null = the publisher stated none */
      summary: summary ? summary.slice(0, 600) : null,
      guid,
    });
  }

  if (!entries.length) problems.push(`${blocks.length} entry element(s) found, none carried a title or a link`);
  return { format, entries, problems };
}

/* ---------------------------------------------------------- pages */

/** Links on a watched HTML page. Same contract: the publisher's
 *  own anchor text, no date invented, no relevance judged here. */
export function parseLinks(body, { baseUrl = null, limit = 200 } = {}) {
  const problems = [];
  if (typeof body !== 'string' || !body.trim()) {
    return { format: null, entries: [], problems: ['empty response body'] };
  }
  const seen = new Set();
  const entries = [];
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(m[1], 'href');
    if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) continue;
    let url = href;
    if (baseUrl) { try { url = new URL(href, baseUrl).toString(); } catch { continue; } }
    if (!/^https?:/i.test(url) || seen.has(url)) continue;
    const title = plainText(m[2]);
    if (!title) continue;
    seen.add(url);
    entries.push({ title, link: url, published: null, summary: null, guid: null });
    if (entries.length >= limit) { problems.push(`link extraction stopped at the ${limit}-link cap`); break; }
  }
  if (!entries.length) problems.push('no usable <a href> links with visible text were found in the response');
  return { format: 'html-links', entries, problems };
}

/** Dispatch on the watchlist entry's declared kind. */
export function extractCandidates(kind, body, opts) {
  return kind === 'page' ? parseLinks(body, opts) : parseFeed(body, opts);
}
