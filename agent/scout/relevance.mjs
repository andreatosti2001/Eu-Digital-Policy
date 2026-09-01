/* ============================================================
   agent/scout/relevance.mjs — which candidates deserve a human

   A scheduled agent that reports everything reports nothing. The
   band below is triage: it decides reading ORDER, and it decides
   nothing else.

   DERIVED, NOT STORED. The vocabulary is built at run time from
   data/instruments.json — ids, aliases, short names, CELEX
   numbers, and the distinctive words of the full titles. There is
   no keyword list in this repository to drift out of step with
   the instruments the brief actually covers. Add an instrument to
   the dataset and the Scout starts watching for it; that is the
   same rule the site's evidence grades follow.

   TRANSPARENT. Every score ships with the exact terms that
   produced it and the instruments they belong to. A band a
   reviewer cannot audit is a band a reviewer should ignore.

   IT IS NOT A LEGAL JUDGEMENT. Matching "gdpr" in a headline says
   the headline contains the string "gdpr". It does not say the
   document is about the GDPR, that it is authoritative, or that
   it supports anything. Nothing in the report presents a band as
   evidence, and no band can promote a candidate on its own — a
   human reads the document.

   UNKNOWN IS NOT ZERO. A candidate with no title and no summary
   is not irrelevant; it is unassessable. Its band is 'unknown'
   and its score is null, and the report counts those separately
   rather than sinking them to the bottom of a ranking where they
   would read as judged and dismissed.
   ============================================================ */

/** Words too common to identify an instrument. Matching these
 *  would make every EU press release 'high'. */
const STOPWORDS = new Set([
  'the', 'of', 'on', 'and', 'for', 'with', 'regard', 'to', 'in', 'a', 'an', 'as', 'by', 'or',
  'regulation', 'directive', 'european', 'parliament', 'council', 'union', 'eu', 'act',
  'natural', 'persons', 'free', 'movement', 'such', 'data', 'their', 'that', 'this', 'certain',
  'amending', 'repealing', 'concerning', 'laying', 'down', 'rules', 'harmonised', 'measures',
  'common', 'level', 'across', 'internal', 'market', 'single', 'general',
]);

const WEIGHTS = {
  celex: 5,        /* an exact legal identifier */
  id: 3,           /* 'ai-act', 'nis2' */
  alias: 3,
  short_name: 3,   /* 'GDPR', 'DMA' */
  title_word: 1,   /* a distinctive word from the full title */
};

/** Thresholds. Stated here, printed in the report, and the only
 *  place they exist. */
export const BANDS = [
  { band: 'high', min: 5, note: 'an exact instrument identifier, or several independent signals' },
  { band: 'medium', min: 3, note: 'one named instrument' },
  { band: 'low', min: 1, note: 'a distinctive title word only' },
  { band: 'none', min: 0, note: 'nothing in the brief’s instrument vocabulary matched' },
];

/**
 * Build the matcher from the canonical instruments dataset.
 * @param {object[]} instruments  data/instruments.json → instruments
 */
export function buildVocabulary(instruments = []) {
  /* term (lowercase) → {term, kind, weight, instrument_id} */
  const terms = new Map();
  const put = (raw, kind, instrumentId) => {
    if (typeof raw !== 'string') return;
    const term = raw.trim().toLowerCase();
    if (term.length < 3 || STOPWORDS.has(term)) return;
    const existing = terms.get(term);
    if (existing) { if (!existing.instrument_ids.includes(instrumentId)) existing.instrument_ids.push(instrumentId); return; }
    terms.set(term, { term, kind, weight: WEIGHTS[kind] ?? 1, instrument_ids: [instrumentId] });
  };

  for (const i of instruments) {
    put(i.id, 'id', i.id);
    put(i.short_name, 'short_name', i.id);
    put(i.celex, 'celex', i.id);
    for (const a of i.aliases ?? []) put(a, 'alias', i.id);
    for (const w of String(i.full_name ?? '').toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 6) put(w, 'title_word', i.id);
    }
  }
  return { terms, size: terms.size };
}

/** Word-boundary match that tolerates the hyphens in ids like
 *  'ai-act' and 'nis2' appearing as 'ai act' in prose. */
function matches(haystack, term) {
  const pattern = term.split(/[^a-z0-9]+/).filter(Boolean).map(escapeRe).join('[^a-z0-9]{0,2}');
  if (!pattern) return false;
  return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i').test(haystack);
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Score one candidate.
 * @returns {{band:string, score:number|null, matched:object[], instrument_ids:string[], assessable:boolean}}
 */
export function score(candidate, vocabulary) {
  const parts = [candidate.title, candidate.summary].filter((s) => typeof s === 'string' && s.trim());
  if (!parts.length) {
    /* Researched and not determinable — not a zero. */
    return { band: 'unknown', score: null, matched: [], instrument_ids: [], assessable: false,
      note: 'the publisher supplied neither a title nor a summary, so relevance could not be assessed' };
  }
  const hay = parts.join(' — ');
  const matched = [];
  const instruments = new Set();
  let total = 0;
  for (const t of vocabulary.terms.values()) {
    if (!matches(hay, t.term)) continue;
    matched.push({ term: t.term, kind: t.kind, weight: t.weight, instrument_ids: t.instrument_ids });
    t.instrument_ids.forEach((id) => instruments.add(id));
    total += t.weight;
  }
  matched.sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term));
  const band = BANDS.find((b) => total >= b.min).band;
  return { band, score: total, matched, instrument_ids: [...instruments].sort(), assessable: true, note: null };
}

/** Reading order for the human summary: high first, then by score,
 *  with the unassessable listed separately by the report rather
 *  than buried at the bottom. */
export const BAND_ORDER = { high: 0, medium: 1, low: 2, none: 3, unknown: 4 };
export function byRelevance(a, b) {
  const ba = BAND_ORDER[a.relevance.band] ?? 9;
  const bb = BAND_ORDER[b.relevance.band] ?? 9;
  return ba - bb || (b.relevance.score ?? -1) - (a.relevance.score ?? -1);
}
