/* ============================================================
   agent/scout/dedupe.mjs — is this already known?

   Duplicate detection exists so a scheduled agent does not
   re-propose, every week, the same seventy-seven documents the
   bibliography already holds. It answers one question per
   candidate — "has this repository already seen this?" — and it
   answers with a REASON, because a candidate marked duplicate is
   a candidate a human will not look at, and a wrong one is a
   source silently lost.

   Three keys, strongest first:

     CELEX      two EUR-Lex URLs for one instrument are one
                document however the query string is spelled.
                This is the only identifier here that is a legal
                fact, and it is read out of the URL, never
                inferred from a title.
     URL        normalised: scheme and host lowercased, 'www.'
                dropped, tracking parameters dropped, fragment
                dropped, trailing slash dropped.
     TITLE      normalised to lowercase alphanumerics. The
                weakest key, and reported as such: two documents
                may honestly share a title.

   WHAT THIS IS NOT. It is not similarity scoring, and there is
   no threshold to tune. A near-match is not a duplicate — it is
   a new candidate that happens to look like an old one, and the
   report says so by naming the key that matched. Guessing here
   would delete evidence to save a reviewer thirty seconds.
   ============================================================ */

/** Query parameters that never identify a document. */
const TRACKING = /^(utm_[a-z_]+|gclid|fbclid|mc_[a-z]+|_ga|ref|referrer|source|src|at_[a-z_]+|cn-reloaded)$/i;

/** EUR-Lex CELEX numbers: sector digit, year, descriptor, number. */
const CELEX_RE = /\b([1-9]\d{4}[A-Z]{1,2}\d{4}(?:\(\d+\))?)\b/;

/** Read a CELEX identifier out of a URL if the URL states one.
 *  Never derived from a title: a CELEX number is a legal fact. */
export function celexOf(url) {
  if (typeof url !== 'string') return null;
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* use it as written */ }
  const m = decoded.toUpperCase().match(CELEX_RE);
  return m ? m[1] : null;
}

export function normaliseUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let p;
  try { p = new URL(url); } catch { return url.trim().toLowerCase() || null; }
  p.hash = '';
  p.protocol = p.protocol.toLowerCase();
  p.hostname = p.hostname.toLowerCase().replace(/^www\./, '');
  const keep = [...p.searchParams.entries()].filter(([k]) => !TRACKING.test(k));
  keep.sort(([a], [b]) => a.localeCompare(b));
  p.search = '';
  for (const [k, v] of keep) p.searchParams.append(k, v);
  let out = p.toString();
  out = out.replace(/\/$/, '');
  return out;
}

export function normaliseTitle(title) {
  if (typeof title !== 'string') return null;
  const t = title.toLowerCase().normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return t.length >= 12 ? t : null;   /* a very short title is not a key */
}

/**
 * Build the index of everything this repository already knows.
 *
 * @param {object[]} sources   data/sources.json → sources
 * @param {object[]} priorCandidates  candidates from earlier reports
 */
export function buildIndex(sources = [], priorCandidates = []) {
  const byCelex = new Map();
  const byUrl = new Map();
  const byTitle = new Map();

  const add = (map, key, ref) => { if (key && !map.has(key)) map.set(key, ref); };

  for (const s of sources) {
    const ref = { origin: 'data/sources.json', id: s.id, title: s.title ?? null, url: s.url ?? null };
    add(byCelex, celexOf(s.url), ref);
    add(byUrl, normaliseUrl(s.url), ref);
    add(byTitle, normaliseTitle(s.title), ref);
  }
  for (const c of priorCandidates) {
    const ref = { origin: c.report_id ? `report ${c.report_id}` : 'a previous scout report', id: c.candidate_id ?? null, title: c.title ?? null, url: c.url ?? null };
    add(byCelex, c.celex ?? celexOf(c.url), ref);
    add(byUrl, normaliseUrl(c.url), ref);
    add(byTitle, normaliseTitle(c.title), ref);
  }
  return { byCelex, byUrl, byTitle, sizes: { celex: byCelex.size, url: byUrl.size, title: byTitle.size } };
}

/**
 * Classify one candidate against the index.
 * @returns {{duplicate:boolean, matched_on:string|null, matched:object|null, confidence:string}}
 */
export function classify(candidate, index) {
  const celex = candidate.celex ?? celexOf(candidate.url);
  const byCelex = celex ? index.byCelex.get(celex) : undefined;
  if (byCelex) return { duplicate: true, matched_on: 'celex', matched: byCelex, key: celex, confidence: 'exact' };

  const url = normaliseUrl(candidate.url);
  const byUrl = url ? index.byUrl.get(url) : undefined;
  if (byUrl) return { duplicate: true, matched_on: 'url', matched: byUrl, key: url, confidence: 'exact' };

  const title = normaliseTitle(candidate.title);
  const byTitle = title ? index.byTitle.get(title) : undefined;
  if (byTitle) return { duplicate: true, matched_on: 'title', matched: byTitle, key: title, confidence: 'weak' };

  return { duplicate: false, matched_on: null, matched: null, key: null, confidence: 'exact' };
}

/** Dedupe within a single run: two watchlist entries may carry the
 *  same document, and reporting it twice is the same noise. */
export function dedupeWithinRun(candidates) {
  const seen = new Map();
  const unique = [];
  const collisions = [];
  for (const c of candidates) {
    const key = (c.celex ? `celex:${c.celex}` : null) ?? (normaliseUrl(c.url) ? `url:${normaliseUrl(c.url)}` : null) ?? (normaliseTitle(c.title) ? `title:${normaliseTitle(c.title)}` : null);
    if (!key) { unique.push(c); continue; }
    if (seen.has(key)) {
      collisions.push({ candidate_id: c.candidate_id, duplicate_of: seen.get(key).candidate_id, key });
      seen.get(key).also_seen_in ??= [];
      seen.get(key).also_seen_in.push(c.watch_id);
      continue;
    }
    seen.set(key, c);
    unique.push(c);
  }
  return { unique, collisions };
}
