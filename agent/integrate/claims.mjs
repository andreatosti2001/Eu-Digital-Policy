/* ============================================================
   agent/integrate/claims.mjs — requirement 1: find an existing
   claim before creating a new one

   A VerificationRecord carries a `statement`: one proposition, read
   from a document, quoted or stated as that document puts it. A
   claim in data/claims.json carries a `statement` too: one
   consequential assertion the brief makes. They are not the same
   kind of sentence and they will rarely be the same words, which is
   exactly why this is a matcher and not an equality test.

   FOUR STRATEGIES, ORDERED BY WHAT THEY PROVE.

     declared_entity  the verification's own affected_entities names
                      a claim id that exists. This is not a match,
                      it is a statement of identity by the record
                      that made the check, and it wins outright.
     statement_exact  the normalised statements are the same words.
     statement_overlap + shared instrument
                      the propositions share enough distinguishing
                      vocabulary AND the claim is about at least one
                      instrument the verification is about. The
                      second half is load-bearing: "the Regulation
                      applies from that date" overlaps heavily with
                      itself across five different regulations, and
                      a matcher without the instrument test would
                      attach the AI Act's date to the DSA's claim.
     statement_overlap alone
                      scored, and capped below the accept threshold.
                      Wording alone never settles which claim a
                      proposition belongs to.

   WHY A MISS IS NOT AN INVITATION. `no_match` produces a proposal
   to CREATE a claim, and that proposal is blocked: data/claims.json
   says in its own $description that no new claims were written —
   every record corresponds to a statement already present in the
   prose. This layer cannot see the prose, so it cannot supply the
   anchor, and it says so as a blocking open question rather than
   writing a claim the brief does not make. AI-SAFE-BOUNDARIES §2
   requires the anchor; the DataProposal contract enforces it.
   ============================================================ */

import { tokens, overlap, decide, searchBlock, THRESHOLDS } from './match.mjs';

export const CLAIM_STRATEGIES = ['declared_entity', 'statement_exact', 'statement_overlap'];

/** Words compared after this. Punctuation and case differ between a
 *  quoted passage and a brief's sentence and mean nothing. */
const normaliseStatement = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[‐-―]/g, '-')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

/** Which instruments a verification is about, taken from the
 *  entities the Verifier attached — never re-derived from the
 *  statement text here. The Verifier already did that work against
 *  data/instruments.json and recorded what it matched on; doing it
 *  again with a different rule would give two answers to one
 *  question. */
export function instrumentsOf(verification) {
  return (verification.affected_entities ?? [])
    .filter((e) => e?.kind === 'instrument' && typeof e.id === 'string')
    .map((e) => e.id);
}

/**
 * Resolve one VerificationRecord to a claim in data/claims.json.
 *
 * @returns {{outcome:'matched'|'ambiguous'|'no_match', claim_id:string|null,
 *            search:object, decision:object, instruments:string[]}}
 */
export function resolveClaim(verification, corpus) {
  const instruments = instrumentsOf(verification);

  /* --- declared identity, which is not a guess ------------------- */
  const declared = (verification.affected_entities ?? [])
    .filter((e) => e?.kind === 'claim' && typeof e.id === 'string')
    .map((e) => e.id)
    .filter((id) => corpus.claimById.has(id));

  if (declared.length === 1) {
    const decision = {
      outcome: 'matched',
      match: { id: declared[0], score: 1, strategy: 'declared_entity', why: 'The verification names this claim as what it was checking.' },
      considered: 1,
      near: [],
      best: { id: declared[0], score: 1, strategy: 'declared_entity', why: 'The verification names this claim as what it was checking.' },
    };
    return {
      outcome: 'matched',
      claim_id: declared[0],
      instruments,
      compared: corpus.claims.length,
      decision,
      search: searchBlock(decision, ['declared_entity'], { subject: 'claim', compared: corpus.claims.length }),
    };
  }
  if (declared.length > 1) {
    /* Two declared claims is the record telling us it is about two
       things. Attaching evidence to both would assert that one
       passage carries both propositions; picking one would be this
       layer deciding which. Neither is ours. */
    const near = declared.map((id) => ({ id, score: 1, strategy: 'declared_entity', why: 'The verification names this claim alongside another.' }));
    const decision = { outcome: 'ambiguous', match: null, considered: declared.length, near, best: near[0] };
    return {
      outcome: 'ambiguous',
      claim_id: null,
      instruments,
      compared: corpus.claims.length,
      decision,
      search: searchBlock(decision, ['declared_entity'], { subject: 'claim', compared: corpus.claims.length }),
    };
  }

  /* --- the text, with the instrument test ------------------------ */
  const target = normaliseStatement(verification.statement);
  const targetTokens = tokens(verification.statement);
  const scored = [];

  for (const claim of corpus.claims) {
    const claimText = normaliseStatement(claim.statement);
    if (claimText && claimText === target) {
      scored.push({ id: claim.id, score: 1, strategy: 'statement_exact', why: 'The two statements are the same words once punctuation and case are set aside.' });
      continue;
    }
    const score = overlap(targetTokens, tokens(claim.statement));
    if (score < THRESHOLDS.consider) continue;

    const shared = (claim.instruments ?? []).filter((i) => instruments.includes(i));
    if (shared.length) {
      scored.push({
        id: claim.id,
        score,
        strategy: 'statement_overlap',
        why: `The propositions share ${score} of their distinguishing vocabulary and both concern ${shared.join(', ')}.`,
      });
    } else {
      /* Capped below the accept threshold on purpose. Two sentences
         about EU law share a great deal of vocabulary without being
         about the same act, and this is the failure that would put a
         citation under a sentence it does not support. */
      scored.push({
        id: claim.id,
        score: Math.min(score, THRESHOLDS.accept - 0.01),
        strategy: 'statement_overlap',
        why: `The propositions share ${score} of their distinguishing vocabulary, and no instrument is common to both — ${instruments.length ? `the verification is about ${instruments.join(', ')}` : 'the verification names no instrument'}, and the claim is about ${(claim.instruments ?? []).join(', ') || 'none'}. Wording alone does not settle which act a proposition belongs to.`,
      });
    }
  }

  const decision = decide(scored);
  return {
    outcome: decision.outcome,
    claim_id: decision.match?.id ?? null,
    instruments,
    compared: corpus.claims.length,
    decision,
    search: searchBlock(decision, ['declared_entity', 'statement_exact', 'statement_overlap'], { subject: 'claim', compared: corpus.claims.length }),
  };
}

/**
 * Does this claim already cite this source? Requirement 3 needs the
 * answer before it attaches anything, and it is asked here rather
 * than at the attaching end so that a second attachment of the same
 * pair is impossible by construction rather than by remembering.
 *
 * Compared on source_id ALONE, not on the locator: the same document
 * cited twice at two locations is still the same document in the
 * claim's bibliography, and the site's evidence grading reads the
 * source, not the page number.
 */
export function alreadyCites(claim, source_id) {
  return (claim?.sources ?? []).some((s) => s?.source_id === source_id);
}

/** The existing reference, where there is one — so a proposal that
 *  would change a `supports` qualifier can carry what is there now
 *  verbatim rather than overwriting it blind. */
export function existingRef(claim, source_id) {
  return (claim?.sources ?? []).find((s) => s?.source_id === source_id) ?? null;
}
