/* ============================================================
   agent/integrate/evidence.mjs — requirement 3: attach evidence to
   the canonical record

   "Attach" is doing a lot of work in that sentence, and this module
   is where it gets pinned down. Nothing is attached to data/. What
   is produced is a ClaimEvidence link — the contract that already
   exists for exactly this edge — and a DataProposal to add one
   entry to one claim's `sources` array. A human applies it or does
   not.

   THE `supports` QUALIFIER IS THE WHOLE THING. data/claims.json's
   own $note: direct means the source states the proposition, partial
   means it establishes part of it or a narrower case, and context
   means it informs the claim without establishing it and is NOT a
   citation. Only a direct support can raise a grade (SOURCE-POLICY
   §4). So the mapping from a verdict to a qualifier is the single
   highest-leverage line in this directory, and it is written to fail
   downward:

     confirmed            → whatever the evidence itself claimed,
                            and never stronger. A confirmed verdict
                            on context evidence stays context.
     partially_confirmed  → partial. Never direct, whatever the
                            evidence entry said: the Verifier
                            reached that verdict because something
                            about the passage did not fully carry
                            the proposition.
     everything else      → nothing is attached at all.

   A CONTRADICTION IS NOT EVIDENCE FOR. `contradicted` produces no
   link. It is a conflict, and it goes to conflicts.mjs — attaching
   a contradicting source to a claim as though it supported it is
   the shape of a citation that says the opposite of the sentence
   above it.

   AND A SOURCE IS NEVER ATTACHED TWICE. `alreadyCites` is checked
   before anything is built, so a second attachment of the same pair
   is impossible by construction rather than by remembering.
   ============================================================ */

import { alreadyCites, existingRef } from './claims.mjs';
import { outcomeClassOf } from '../verifier/outcome.mjs';

/** Verdicts that can attach anything at all. The other four are
 *  results, not supports. */
export const ATTACHING_VERDICTS = ['confirmed', 'partially_confirmed'];

/**
 * What the link may claim, given the verdict and what the evidence
 * entry itself said it did.
 *
 * Returns null where nothing may be attached, with the reason, so a
 * caller cannot mistake "no link" for "not looked at".
 */
export function supportsFor(verification, evidenceRef) {
  const claimed = evidenceRef?.supports ?? null;

  if (!ATTACHING_VERDICTS.includes(verification.verdict)) {
    return {
      supports: null,
      why_not: `The verdict is "${verification.verdict}" (outcome class: ${outcomeClassOf(verification.verdict)}). Nothing is attached: ${
        verification.verdict === 'contradicted'
          ? 'a source that says otherwise is not a source that supports, and attaching it would put a citation under a sentence it contradicts'
          : 'the check did not settle the proposition, and an unsettled check attaches no citation'
      }.`,
    };
  }
  if (claimed === null) {
    return { supports: null, why_not: 'The evidence entry does not say how it bears on the statement, and this layer will not decide that for it.' };
  }
  if (verification.verdict === 'partially_confirmed' && claimed === 'supports:direct') {
    return {
      supports: 'supports:partial',
      why_not: null,
      downgraded_from: 'supports:direct',
      why_downgraded: 'The verdict is "partially_confirmed": the Verifier reached it because the passage establishes part of the proposition or a narrower case. Carrying the evidence entry\'s "direct" across would raise the claim\'s grade on a verdict that did not support it.',
    };
  }
  return { supports: claimed, why_not: null };
}

/**
 * Build the ClaimEvidence link between a matched claim and a matched
 * source.
 *
 * `is_citation` is false whenever the support is context — the
 * contract refuses the other combination, and the site's grading
 * refuses to count it. `established_by` names the verification, so
 * an unverified link is distinguishable from a verified one without
 * asking anybody.
 *
 * @returns {object|null} the link fields, or null with the reason on
 *   `skipped`
 */
export function buildLink({ verification, claim, source_id, evidenceRef }) {
  if (alreadyCites(claim, source_id)) {
    const existing = existingRef(claim, source_id);
    return {
      link: null,
      skipped: `${claim.id} already cites ${source_id} as "${existing?.supports ?? 'an unqualified reference'}"${existing?.locator ? ` at ${existing.locator}` : ''}. A source is never described twice and a claim never cites one twice; changing the qualifier on the existing reference would be an amend_field proposal, not an attachment.`,
    };
  }

  const decided = supportsFor(verification, evidenceRef);
  if (!decided.supports) return { link: null, skipped: decided.why_not };

  const isContext = decided.supports === 'supports:context';
  return {
    link: {
      claim_id: claim.id,
      source_id,
      supports: decided.supports,
      role: evidenceRef.role,
      locator: verification.supporting_location?.raw ?? evidenceRef.locator ?? null,
      quote: evidenceRef.quote ?? null,
      is_citation: !isContext,
      established_by: verification.verification_id,
    },
    downgraded_from: decided.downgraded_from ?? null,
    why_downgraded: decided.why_downgraded ?? null,
    skipped: null,
  };
}

/**
 * The one operation an attachment proposes: adding an entry to a
 * claim's `sources` array.
 *
 * `current` is null because nothing is being replaced — the array
 * gains an entry and every existing entry stays exactly as it is.
 * That is what makes an attachment non-substantive: the claim
 * afterwards asserts the same proposition, and what changed is what
 * it can be shown to rest on. The DataProposal contract requires
 * that judgement to state its method, and the adapter writes one.
 */
export function attachOperation(link) {
  const entry = { source_id: link.source_id, supports: link.supports, locator: link.locator };
  return {
    op: 'add',
    target: `data/claims.json claims[${link.claim_id}].sources[]`,
    current: null,
    proposed: JSON.stringify(entry),
    rationale: link.is_citation
      ? `The verification ${link.established_by} read the passage${link.locator ? ` at ${link.locator}` : ''} and it ${link.supports === 'supports:direct' ? 'states the claim\'s proposition' : 'establishes part of the claim\'s proposition or a narrower case'}.`
      : `The verification ${link.established_by} read the passage and it informs the claim without establishing it. Recorded as supports:context, which is not a citation and does not raise the claim's grade — its true relation, recorded rather than upgraded.`,
  };
}
