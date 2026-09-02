/* ============================================================
   agent/integrate/match.mjs — how two things are decided to be the
   same thing, and what a near miss is called

   Both of the first two requirements SESSION 08 sets — find an
   existing claim before creating a new one, find an existing source
   before creating a duplicate — reduce to one question asked twice:
   is the thing in front of me the thing already in the corpus?

   THREE ANSWERS, NEVER TWO. `matched` · `ambiguous` · `no_match`.
   A matcher that only says yes or no has to turn every close call
   into one of them, and both directions are damaging here: a false
   yes attaches evidence to the wrong claim, and a false no writes a
   second home for a record that already had one. `ambiguous` is a
   finding for a human and it is a correct outcome, in exactly the
   way the Verifier's `not_determinable` is.

   EVERY MATCH CARRIES THE STRATEGY THAT MADE IT. "It matched" is an
   opinion; "the normalised URLs are equal" is something a reviewer
   can disagree with. The strategies are ordered by how much they
   prove, and the first one that fires wins — a CELEX number
   identifies a document and a similar title suggests one.

   THE SCORE IS NOT A PROBABILITY. It is this matcher's own scale,
   and the contract documents it that way. A number that read as
   "0.82 likely the same document" would be a claim about the world
   that nothing here established.

   NORMALISATION IS BORROWED, NOT REWRITTEN. `normaliseUrl` and
   `normaliseTitle` already live in agent/scout/dedupe.mjs, where
   they answer the same question for the Scout. A second copy here
   would drift the first time somebody added a tracking parameter to
   one of them.
   ============================================================ */

import { normaliseUrl, normaliseTitle } from '../scout/dedupe.mjs';

export { normaliseUrl, normaliseTitle };

export const MATCH_OUTCOMES = ['matched', 'ambiguous', 'no_match'];

/**
 * A CELEX number, as EUR-Lex writes it. This identifies a document
 * in the Official Journal and is the strongest thing either side of
 * a comparison can carry.
 *
 * Read from a URL only where EUR-Lex itself put it there — a
 * `CELEX:` parameter or a `/eli/`-style path segment. Anything more
 * speculative would be reading a legal identifier out of an address,
 * which is a fact about the address; the Verifier refuses the same
 * move for `document_id` and this module refuses it for the same
 * reason.
 */
/* Sector digit, four-digit year, one to three descriptor letters,
   four-digit number — 32016R0679 is sector 3, year 2016, type R,
   number 0679. The sector digit is part of the identifier and
   leaving it out of the pattern is why an earlier version of this
   matched nothing at all. */
const CELEX_RE = /\b([1-9]\d{4}[A-Z]{1,3}\d{4}(?:\(\d{2}\))?)\b/;

export function celexOf(value) {
  if (typeof value !== 'string' || !value) return null;
  const fromParam = /celex[:=]\s*([0-9A-Z()]+)/i.exec(value);
  const candidate = fromParam ? fromParam[1] : value;
  const m = CELEX_RE.exec(candidate.toUpperCase());
  return m ? m[1] : null;
}

/**
 * Words, lowercased, with the ones that carry no distinguishing
 * weight dropped. Deliberately small and English-only, and named as
 * a limitation rather than hidden: a corpus about EU law contains
 * documents in twenty-three other languages, and this matcher would
 * score two French sentences on their punctuation.
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from', 'has', 'have',
  'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to',
  'was', 'were', 'which', 'with', 'not', 'no', 'than', 'then', 'they', 'them',
]);

export function tokens(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[‐-―]/g, '-')
    .split(/[^\p{L}\p{N}-]+/u)
    .map((w) => w.replace(/^-+|-+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Jaccard overlap of two token sets — the size of the intersection
 * over the size of the union.
 *
 * Chosen over anything cleverer because it is inspectable: a
 * reviewer handed 0.42 can count the words. A learned similarity
 * would be a number nobody in this repository could check, and the
 * whole point of a match record here is that somebody can disagree
 * with it.
 */
export function overlap(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  const union = A.size + B.size - shared;
  return union === 0 ? 0 : Number((shared / union).toFixed(3));
}

/**
 * The thresholds, in one place, with what each one costs when it is
 * wrong.
 *
 * `accept` is high because the failure above it is attaching a
 * source to the wrong claim, which puts a citation under a sentence
 * it does not support — the shape of a false statement to a reader.
 * `consider` is low because the failure below it is proposing a
 * record the corpus already has, which is a duplicate somebody has
 * to find later. Between them is `ambiguous`, and nothing in this
 * layer resolves an ambiguity by picking the higher number.
 */
export const THRESHOLDS = {
  accept: 0.8,
  consider: 0.45,
};

/**
 * Turn scored candidates into one of the three outcomes.
 *
 * A tie at or above `accept` is `ambiguous`, not a coin toss: two
 * records scoring identically means the corpus cannot tell them
 * apart on this evidence, and neither can this.
 *
 * @param {Array<{id:string, score:number, strategy:string, why:string}>} scored
 */
export function decide(scored, { accept = THRESHOLDS.accept, consider = THRESHOLDS.consider } = {}) {
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const best = ranked[0] ?? null;
  const near = ranked.filter((c) => c.score >= consider);

  if (!best || best.score < consider) {
    return { outcome: 'no_match', match: null, considered: ranked.length, near: [], best: best ?? null };
  }
  const tied = ranked.filter((c) => c.score === best.score);
  if (best.score >= accept && tied.length === 1) {
    return { outcome: 'matched', match: best, considered: ranked.length, near, best };
  }
  return { outcome: 'ambiguous', match: null, considered: ranked.length, near: near.slice(0, 5), best };
}

/**
 * The `existing_search` block a DataProposal requires, built from a
 * decision so the proposal and the search cannot disagree about what
 * was looked for. `why_not_that_one` is required by the contract
 * whenever a candidate was found, and it is written here from the
 * strategy that found it rather than left to a caller to phrase.
 */
export function searchBlock(decision, strategies, { subject, compared }) {
  const best = decision.best;
  return {
    performed: true,
    /* Every record actually compared, not just the ones that scored
       above the threshold. A search reporting "0 considered" because
       nothing came close would read as a search that was not run. */
    strategies: [...strategies],
    candidates_considered: compared,
    best_candidate_id: best?.id ?? null,
    best_score: best ? best.score : null,
    why_not_that_one: best
      ? `The closest existing record is "${best.id}", found by ${best.strategy} at ${best.score} on this matcher's own scale. ${best.why} That is below the ${THRESHOLDS.accept} threshold at which this layer treats two records as the same ${subject}, and treating them as the same one anyway would attach ${subject === 'document' ? 'a document to a record it is not' : 'evidence to a statement it does not carry'}.`
      : null,
  };
}
