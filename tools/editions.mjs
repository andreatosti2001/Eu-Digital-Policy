/* ============================================================
   editions.mjs — the language editions of the brief, and the review
   that decides whether search engines may be told about them.

   Since 22 Oct 2026 (audit of 21 Oct 2026, items 20 and 22). Until then
   a translation existed only after app.js swapped it into the English
   page, so no translated HTML existed at any address, and nothing
   recorded whether a person had read a translation.

   THE STRINGS. Every translatable string is the inner HTML of an element
   in index.html carrying data-i18n="key", read here from the SOURCE
   markup (never from a browser's re-serialisation), plus two edition
   strings per locale held in i18n/locales.json: the page's title and
   description.

   THE REVIEW. i18n/review/<code>.json records, per key, the fingerprint
   of the English and the translation a named person approved. Whether a
   key is reviewed is DERIVED on every run by recomputing the fingerprint
   from the files as they stand: change either side and the approval no
   longer matches, so a superseded translation can never pass as a
   reviewed one (the hazard AGENTS.md names). A locale is reviewed only
   when every key is translated and every key's approval matches.

   THE RULE FOR AGENTS. Only a person records a review, through
   `node tools/i18n-review.mjs record`. An agent may generate the sheets,
   report the state and build the pages; it never writes an approval,
   because an approval is an attestation that a speaker of the language
   read the text (docs/AI-SAFE-BOUNDARIES.md §3).

   Pure functions; zero dependencies.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/**
 * Every element carrying data-i18n, as { key, open: [start, end) of its
 * open tag, inner: [start, end) of its inner HTML }, in document order.
 * A small tag scanner: it matches the element's own close tag by counting
 * same-named opens, skips void and self-closed elements, and throws on a
 * key whose element it cannot close rather than guessing.
 */
export function i18nElements(html) {
  const out = [];
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) {
    const start = html.lastIndexOf('<', m.index);
    const tag = (html.slice(start + 1).match(/^([a-zA-Z][a-zA-Z0-9-]*)/) || [])[1];
    if (!tag) throw new Error(`editions: no tag for data-i18n="${m[1]}"`);
    const openEnd = html.indexOf('>', m.index) + 1;
    const re = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*?(/?)>`, 'gi');
    re.lastIndex = openEnd;
    let depth = 0, close = -1, x;
    while ((x = re.exec(html))) {
      if (x[1]) { if (depth === 0) { close = x.index; break; } depth--; }
      else if (!x[2] && !VOID.has(tag.toLowerCase())) depth++;
    }
    if (close < 0) throw new Error(`editions: data-i18n="${m[1]}" <${tag}> is never closed`);
    out.push({ key: m[1], tag, open: [start, openEnd], inner: [openEnd, close] });
  }
  return out;
}

/** key -> the English inner HTML, as authored. */
export function englishStrings(html) {
  const m = new Map();
  for (const e of i18nElements(html)) if (!m.has(e.key)) m.set(e.key, html.slice(e.inner[0], e.inner[1]));
  return m;
}

/**
 * The brief with a locale's strings in place of the English, the way
 * app.js swapped them: each element's inner HTML is replaced whole, so a
 * parent's translation, which carries its children, wins over theirs; a
 * key the locale lacks keeps the English and is marked
 * data-i18n-fallback="en", so the gap stays visible.
 * Returns { html, missing }.
 */
export function applyLocale(html, map) {
  let out = '', pos = 0, missing = 0;
  for (const e of i18nElements(html)) {
    if (e.open[0] < pos) continue;            /* inside an element already replaced */
    const v = map[e.key];
    let open = html.slice(e.open[0], e.open[1]);
    if (v === undefined) { missing++; open = open.replace(/(\/?>)$/, ' data-i18n-fallback="en"$1'); }
    out += html.slice(pos, e.open[0]) + open + (v === undefined ? html.slice(e.inner[0], e.inner[1]) : v);
    pos = e.inner[1];
  }
  return { html: out + html.slice(pos), missing };
}

/* ---------------------------------------------------------- the review */

export const EDITION_KEYS = Object.freeze(['edition.title', 'edition.description']);

export const fingerprint = (key, en, tr) =>
  createHash('sha256').update(`${key}\u0000${en}\u0000${tr}`, 'utf8').digest('hex');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** The register's locales that have an edition. */
export function editionLocales(root = ROOT) {
  return (readJson(join(root, 'i18n/locales.json')).locales || []).filter((l) => l.code !== 'en' && l.edition);
}

/** Every reviewable string of one locale: key, English, translation. */
export function strings(code, { root = ROOT, englishTitle, englishDescription } = {}) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const en = englishStrings(html);
  const rec = (readJson(join(root, 'i18n/locales.json')).locales || []).find((l) => l.code === code);
  if (!rec || !rec.file) throw new Error(`editions: no locale ${code} in i18n/locales.json`);
  const loc = readJson(join(root, rec.file));
  const rows = [...en].map(([key, english]) => ({ key, en: english, tr: loc[key] }));
  const ed = rec.edition || {};
  if (englishTitle != null) rows.push({ key: 'edition.title', en: englishTitle, tr: ed.title });
  if (englishDescription != null) rows.push({ key: 'edition.description', en: englishDescription, tr: ed.description });
  return rows;
}

export const ledgerPath = (code, root = ROOT) => join(root, 'i18n', 'review', `${code}.json`);

export function readLedger(code, root = ROOT) {
  const p = ledgerPath(code, root);
  return existsSync(p) ? readJson(p) : { locale: code, entries: {} };
}

/**
 * The review state of one locale, derived on every call:
 *   reviewed      a person approved exactly this English and this translation
 *   stale         a person approved an earlier version of one or the other
 *   unreviewed    never approved
 *   untranslated  the locale has no string for the key (it falls back to English)
 */
export function reviewState(code, opts = {}) {
  const rows = strings(code, opts);
  const ledger = readLedger(code, opts.root);
  const counts = { reviewed: 0, stale: 0, unreviewed: 0, untranslated: 0 };
  const keys = rows.map((r) => {
    let state;
    if (r.tr == null) state = 'untranslated';
    else {
      const fp = fingerprint(r.key, r.en, r.tr);
      const e = (ledger.entries || {})[r.key];
      state = !e ? 'unreviewed' : e.fingerprint === fp ? 'reviewed' : 'stale';
      r.fp = fp;
    }
    counts[state]++;
    return { ...r, state };
  });
  return { code, keys, counts, total: rows.length, complete: counts.reviewed === rows.length };
}
