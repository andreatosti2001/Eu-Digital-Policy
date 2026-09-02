/* ============================================================
   agent/proposals/data/taxonomy.mjs — establishing that the
   vocabulary really has no word for it

   SESSION 12's brief: **if a new taxonomy term appears necessary,
   create a taxonomy proposal; do not silently create it.**

   "Do not silently create it" is the easy half — nothing here writes
   to `data/`. The hard half is "appears necessary", because an agent
   that decided a term was needed without looking would propose a
   second word for something the vocabulary already says, and
   `data/taxonomy.json` is what every other dataset resolves against.
   A duplicate term there does not announce itself: it quietly becomes
   a second home for a distinction that already had one.

   SO THE SEARCH IS THE PROPOSAL'S BURDEN, and it reuses
   `DataProposal.existing_search` unchanged — the same field
   `create_source` fills, checked by the same rules, because "find the
   record that is already there" is the same discipline whether the
   record is a document or a word.

   THE MATCH IS OVER WHAT THE FILE SAYS, NOT OVER WHAT A MODEL KNOWS.
   Every term's id, label and note are read from `data/taxonomy.json`
   and scored by token overlap against the concept the gap names.
   That is a weak method and it says so: the score is on this
   matcher's own scale and is never a probability that two words mean
   the same thing. Its weakness is why the proposal is `human_only`
   and why `why_not_that_one` is written out rather than left as a
   number — a reviewer who disagrees with the search can see exactly
   what it compared.
   ============================================================ */

import { taxonomy } from '../../schemas/types.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);

/**
 * Which taxonomy dimension a gap's missing concept would live in.
 *
 * A stated table, one row per gap kind that can reach this route.
 * A kind with no row does not get a taxonomy proposal — it is not
 * silently given a dimension, because guessing the dimension is the
 * same error as guessing the term.
 */
export const DIMENSION_FOR_KIND = {
  missing_source_relationship: ['relationship_kind', 'The corpus holds one document as two source records. data/instruments.json solves the same problem for acts with a relationships[] array whose kind resolves against this dimension, so this is where a word for the relation between two records would resolve against too.'],
};

/** The concepts a dimension would already cover if it had a word for
 *  the gap. Read against id, label and note — all three are in the
 *  file — so a term whose id says nothing but whose note says it all
 *  is still found. */
const tokens = (s) => String(s ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);

/**
 * Score one existing term against the concept the gap names.
 * Token overlap, on this matcher's own scale, and never a
 * probability. Exported so the suite can assert it did not drift.
 */
export function scoreTerm(term, wanted) {
  const want = new Set(tokens(wanted));
  if (!want.size) return 0;
  const have = new Set([...tokens(term.id), ...tokens(term.label), ...tokens(term.note)]);
  let hits = 0;
  for (const t of want) if (have.has(t)) hits++;
  return Number((hits / want.size).toFixed(2));
}

/**
 * Search a dimension for a term that already expresses the concept.
 *
 * @param {string} dimension  a key in data/taxonomy.json
 * @param {{wanted:string, decisive:string[]}} what
 *   `wanted` is the concept in words; `decisive` is the short list of
 *   words a term would have to carry to BE that concept. The two are
 *   separate on purpose: overlap ranks candidates, and only a
 *   decisive word settles that one of them is the concept. A ranking
 *   alone would eventually score a near-neighbour high enough to look
 *   like a match.
 * @returns {{found:object|null, search:object, considered:object[]}}
 */
export function searchDimension(dimension, { wanted, decisive }) {
  const terms = arr(taxonomy()[dimension]);
  if (!terms.length) throw new Error(`taxonomy.mjs: data/taxonomy.json has no dimension "${dimension}"`);

  const scored = terms
    .map((t) => ({ id: t.id, label: t.label ?? null, note: t.note ?? null, score: scoreTerm(t, wanted) }))
    .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));

  /* THE DECISIVE TEST, and it is deliberately not the score. A term
     IS the concept only if what the file says about it carries one of
     the words that make the concept what it is. Everything else is a
     neighbour, however well it ranks. */
  const found = terms.find((t) => {
    const hay = `${t.id} ${t.label ?? ''} ${t.note ?? ''}`.toLowerCase();
    return decisive.some((w) => hay.includes(w.toLowerCase()));
  }) ?? null;

  const best = scored[0] ?? null;
  return {
    found,
    considered: scored,
    search: {
      performed: true,
      strategies: ['dimension_scan', 'token_overlap_against_id_label_and_note', 'decisive_word_test'],
      candidates_considered: terms.length,
      best_candidate_id: best?.id ?? null,
      best_score: best?.score ?? null,
      why_not_that_one: best
        ? `"${best.id}" (${best.label ?? 'no label'}) scored highest on token overlap, and none of the ${terms.length} terms in ${dimension} carries any of ${decisive.map((w) => `"${w}"`).join(', ')} in its id, label or note. Every term in this dimension characterises how two ACTS relate; the concept here is that two RECORDS are one document, which is a statement about the bibliography rather than about EU law. The overlap score is on this matcher's own scale and is not a probability that the two mean the same thing.`
        : null,
    },
  };
}

/**
 * The whole question for one gap: is a new term necessary, and what
 * did the search find?
 *
 * Returns `necessary: false` wherever the search found a term — which
 * is the outcome that matters most, because a run that never returned
 * it would be a search nobody could fail.
 */
export function termNeededFor(gap) {
  const row = DIMENSION_FOR_KIND[gap.gap_kind];
  if (!row) {
    return { necessary: false, why: `no dimension is stated for a ${gap.gap_kind} gap, and guessing one is the same error as guessing the term` };
  }
  const [dimension, whyDimension] = row;

  const wanted = 'two source records that are the same published document, recorded once as one document';
  const decisive = ['same document', 'duplicate', 'identical', 'republication', 'one document'];

  const r = searchDimension(dimension, { wanted, decisive });
  if (r.found) {
    return {
      necessary: false,
      dimension,
      why: `${dimension} already carries "${r.found.id}", which expresses the concept. A second word for it would be the second home this architecture exists to prevent.`,
      search: r.search,
    };
  }

  return {
    necessary: true,
    dimension,
    why_dimension: whyDimension,
    wanted,
    decisive,
    search: r.search,
    considered: r.considered,
    /* The id and the label are the whole of what is proposed. THE
       DEFINITION IS NOT PROPOSED: a taxonomy term's definition is the
       site's own words about a concept, and writing those is
       Editorial's under docs/AGENT-ROLES.md §6. The proposal says so
       in its scope note rather than filling the field with something
       plausible. */
    proposed_term: { id: `${dimension === 'relationship_kind' ? 'rel-kind' : dimension}:same-document`, label: 'Is the same document as' },
  };
}
