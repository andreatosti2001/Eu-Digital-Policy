/* ============================================================
   agent/verifier/decompose.mjs — source material into discrete
   propositions

   SESSION 07's brief: "The verifier must decompose source material
   into discrete propositions." The `legal-source-verification`
   skill says the same thing about a record: "Read the proposition
   as a set of assertions… Split before you check", and gives the
   worked example — one sentence in this repository carrying three
   assertions of which exactly one is sourced.

   A record that checks a conjunction takes the WEAKEST verdict of
   its parts and reports it for the strongest, which is how "90%
   sourced" becomes "sourced". So the unit of verification is one
   proposition, and this module produces them.

   MATERIALITY, AND WHY IMMATERIAL IS COUNTED RATHER THAN DROPPED.
   The brief asks for a record "for every material proposition". A
   document is mostly navigation, boilerplate and throat-clearing;
   verifying "Skip to main content" is noise. But a proposition
   silently discarded is indistinguishable from one nobody noticed,
   so the immaterial ones are counted and their count is reported.
   The rule is stated, not learned: a proposition is material if it
   carries a legal-status signal, a date the act turns on, an
   obligation, a penalty, or a reference to an instrument this
   repository tracks. Everything else is set aside, on the record.

   THIS IS SENTENCE-LEVEL PATTERN MATCHING, AND IT SAYS SO. It does
   not parse legal language, resolve anaphora, or understand a
   sentence whose subject is three sentences back. `docs/SOURCE-SCOUT.md`
   records the same honest limitation about the Scout's relevance
   matching; the same one is recorded here rather than discovered
   later.
   ============================================================ */

import { statusSignals } from './statuses.mjs';

/** Abbreviations whose full stop does not end a sentence. Without
 *  these, "Art. 5 applies." is two propositions and both are wrong. */
const ABBREV = /(?:\b(?:Art|art|Arts|No|no|Nos|para|paras|cf|e\.g|i\.e|pp|p|Reg|Dir|Ch|Sec|vs|approx|ca|al|ff|OJ|EU|EC)\.)$/;

/** Split into sentences, keeping each one's offset in the source so
 *  a locator can be found for it later. */
export function sentences(text) {
  const src = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!src) return [];
  const out = [];
  let start = 0;
  const re = /[.!?]["')\]]?\s+/g;
  for (const m of src.matchAll(re)) {
    const cut = (m.index ?? 0) + m[0].length;
    const piece = src.slice(start, cut);
    /* Do not cut after an abbreviation, and do not cut mid-number:
       "Regulation (EU) 2016/679." ends a sentence, "No. 45" does
       not. */
    if (ABBREV.test(piece.trimEnd())) continue;
    const trimmed = piece.trim();
    if (trimmed) out.push({ text: trimmed, index: start });
    start = cut;
  }
  const tail = src.slice(start).trim();
  if (tail) out.push({ text: tail, index: start });
  return out;
}

const OBLIGATION = /\b(?:shall|must|is\s+required\s+to|are\s+required\s+to|may\s+not|shall\s+not|is\s+prohibited|obliged\s+to)\b/i;
const PENALTY = /\b(?:fine|fines|penalt(?:y|ies)|sanction|administrative\s+fine)\b|\b\d+\s*%\s*of\b|\bEUR\s*[\d.,]/i;
const DATE_MENTION = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/;
const INSTRUMENT_REF = /\b(?:Regulation|Directive|Decision)\s*\((?:EU|EC|EEC)\)\s*(?:No\s*)?\d{1,4}\/\d{2,4}\b|\b3\d{4}[A-Z]\d{4}\b/;

/**
 * Why this sentence is worth checking, or that it is not.
 * @returns {{material:boolean, reasons:string[]}}
 */
export function materiality(sentence, { instrumentTerms = [] } = {}) {
  const reasons = [];
  const t = sentence.text;

  if (statusSignals(t).length) reasons.push('carries a legal-status signal');
  if (DATE_MENTION.test(t)) reasons.push('states a date the act may turn on');
  if (OBLIGATION.test(t)) reasons.push('states an obligation');
  if (PENALTY.test(t)) reasons.push('states a penalty or a sum');
  if (INSTRUMENT_REF.test(t)) reasons.push('cites an instrument by its formal reference');

  const named = instrumentTerms.filter((term) => term.re && new RegExp(term.re.source, term.re.flags.replace('g', '')).test(t));
  if (named.length) reasons.push(`names ${[...new Set(named.map((n) => n.id))].join(', ')}`);

  /* A sentence too short to be a proposition is not one. Headings,
     link text and menu items land here. */
  const tooShort = t.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).filter(Boolean).length < 5;
  if (tooShort) return { material: false, reasons: ['fewer than five words — a heading or a link, not a proposition'] };

  return {
    material: reasons.length > 0,
    reasons: reasons.length ? reasons : ['no legal-status signal, date, obligation, penalty or instrument reference'],
  };
}

/**
 * Decompose a document into propositions.
 *
 * @returns {{propositions:Array, set_aside:Array, total:number}}
 *   `set_aside` carries the immaterial ones with the reason, so the
 *   count in a report is checkable rather than asserted.
 */
export function decompose(text, { instrumentTerms = [] } = {}) {
  const all = sentences(text);
  const propositions = [];
  const set_aside = [];
  for (const s of all) {
    const m = materiality(s, { instrumentTerms });
    (m.material ? propositions : set_aside).push({ ...s, reasons: m.reasons });
  }
  return { propositions, set_aside, total: all.length };
}
