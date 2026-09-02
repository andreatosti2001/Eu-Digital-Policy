/* ============================================================
   agent/integrate/unsupported.mjs — requirement 4: detect
   unsupported claims

   UNSUPPORTED IS NOT FALSE, AND THIS MODULE SAYS SO IN EVERY RECORD
   IT PRODUCES. A claim nothing external carries is a claim whose
   evidence has not been located. Rendering that as a negative
   finding is what AI-SAFE-BOUNDARIES §0.5 names as the single most
   damaging thing this project could do, and it is the failure a
   detector like this one is positioned to cause: a list headed
   "unsupported claims" reads as a list of things that are wrong.
   Every gap this module emits carries `why_open` saying which of
   the two it is.

   AND SHORTENING THE LIST IS NOT THE GOAL. VERIFICATION-POLICY §6:
   the unverified report is the project's honest statement of what
   it cannot support, and it shortens when a source is genuinely
   found and read — never by attaching a plausible substitute, by
   clearing a flag, or by deleting a record. This module finds; it
   proposes nothing that would close a gap by any other route.

   THE DERIVATION IS THE SITE'S OWN. `familyOf` and `evidenceGrade`
   are imported from js/format.js rather than reimplemented.
   DATA-GOVERNANCE §1.2 is explicit that a derivation may not be
   duplicated into a second implementation, and a second grading
   rule in the agent layer would be the exact defect js/evidence-view.js
   was written to end: the drawer and the instrument page once
   described the same source differently.

   SIX REASONS, KEPT APART. They are different states needing
   different work, and a single "unsupported" bucket would hide
   which. In particular an `argument`-family claim — interpretation,
   critique, forecast — is graded `interpretation` however well
   sourced it is, because sources support the premises of a reading
   and cannot settle its conclusion. Calling that claim
   "unsupported" alongside a missing citation would be a category
   error the site's own interface refuses to make.
   ============================================================ */

import { familyOf, evidenceGrade, isUnverified } from '../../js/format.js';
import { SELF_SOURCE_ID } from './canonical.mjs';

export const UNSUPPORTED_REASONS = [
  'self_cited_only',            // every source is the brief citing itself
  'no_external_direct',         // sources exist; none directly supports it from outside the brief
  'context_only',               // every external source is supports:context, which is not a citation
  'declared_reference_gap',     // the record names its own hole — reference_gap + gap_note
  'dangling_source',            // a source_id that resolves to nothing
  'verification_unsettled',     // a verification bearing on it came back contradicted or not determinable
];

/** The index js/format.js's derivations expect: `ix.source` maps a
 *  source id to its record. Built from the corpus rather than
 *  restated, so the grade computed here is the grade the page shows. */
const indexOf = (corpus) => ({ source: corpus.sourceById });

/**
 * Every claim the corpus cannot show an external source for, with
 * the reason, the family, and the grade the site itself derives.
 *
 * @param {object} corpus
 * @param {{verifications?:object[], resolutions?:Map<string,string[]>}} [opts]
 *   `resolutions` maps a claim id to the verification ids that were
 *   matched to it in this run, so a verification that came back
 *   unsettled is attached to the claim it was about rather than to
 *   the corpus at large.
 */
export function unsupportedClaims(corpus, { verifications = [], resolutions = new Map() } = {}) {
  const ix = indexOf(corpus);
  const byId = new Map(verifications.map((v) => [v.verification_id, v]));
  const out = [];

  for (const claim of corpus.claims) {
    const reasons = [];
    const sources = claim.sources ?? [];
    const external = sources.filter((s) => s.source_id !== SELF_SOURCE_ID);

    const dangling = sources.filter((s) => !corpus.sourceById.has(s.source_id));
    if (dangling.length) {
      reasons.push({
        reason: 'dangling_source',
        detail: `${dangling.map((s) => `"${s.source_id}"`).join(', ')} resolve${dangling.length === 1 ? 's' : ''} to no record in data/sources.json.`,
      });
    }

    if (sources.length && external.length === 0) {
      reasons.push({
        reason: 'self_cited_only',
        detail: `Every source on this claim is ${SELF_SOURCE_ID}, which is the brief citing itself. SOURCE-POLICY §5: it is not a source, and the code treats it as one everywhere — evidenceGrade() filters it before grading and this claim therefore grades Unresolved.`,
      });
    } else if (external.length && !external.some((s) => s.supports === 'supports:direct')) {
      reasons.push({
        reason: 'no_external_direct',
        detail: `${external.length} external source(s), none of them supports:direct. Only a direct support can raise a grade; partial support establishes part of the proposition or a narrower case.`,
      });
    }

    if (external.length && external.every((s) => s.supports === 'supports:context')) {
      reasons.push({
        reason: 'context_only',
        detail: 'Every external source on this claim is supports:context. Context informs a claim without establishing it and is NOT a citation (data/claims.json\'s own $note).',
      });
    }

    if (claim.reference_gap) {
      reasons.push({
        reason: 'declared_reference_gap',
        detail: `The record names its own hole: ${String(claim.gap_note ?? claim.reference_gap).replace(/\s+/g, ' ')}`,
      });
    }

    for (const vid of resolutions.get(claim.id) ?? []) {
      const v = byId.get(vid);
      if (!v) continue;
      if (['contradicted', 'not_determinable', 'conflict', 'source_unavailable'].includes(v.verdict)) {
        reasons.push({
          reason: 'verification_unsettled',
          detail: `${vid} came back "${v.verdict}" on a proposition matched to this claim. ${v.residual_gap ? String(v.residual_gap).replace(/\s+/g, ' ') : 'No residual gap was recorded.'}`,
          verification_id: vid,
        });
      }
    }

    if (!reasons.length) continue;

    const family = familyOf(claim);
    const grade = evidenceGrade(claim, ix).id;

    out.push({
      claim_id: claim.id,
      family,
      grade,
      claim_type: claim.type,
      reasons,
      /* The site's own unverified test, so this list and
         validate.mjs's unverified report cannot disagree about what
         "unverified" means. */
      unverified_by_site_rule: isUnverified(claim),
      /* An argument is not short of a citation; it is a reading. The
         distinction is carried on every row rather than left to
         whoever reads the list. */
      is_argument: family === 'argument',
      what_this_is_not: family === 'argument'
        ? 'This is an interpretation, a critique or a forecast. It grades "interpretation" however well sourced it is, because a source can support the premises of a reading and cannot settle its conclusion (DATA-GOVERNANCE §3). It is not a claim missing a citation, and it must not be counted alongside one.'
        : 'This says the evidence for the claim has not been located. It does not say the claim is false, and nothing here may be rendered as a negative finding (AI-SAFE-BOUNDARIES §0.5).',
    });
  }

  return out;
}

/**
 * The counts, with the argument-family claims separated rather than
 * summed in.
 *
 * Deliberately returns both figures and never a single total: an
 * aggregate that folded a reading in with a missing citation would
 * be the collapse DATA-GOVERNANCE §2 prohibits, applied to the one
 * number a reader would quote.
 */
export function tallyUnsupported(rows) {
  const byReason = {};
  for (const r of rows) {
    for (const x of r.reasons) byReason[x.reason] = (byReason[x.reason] ?? 0) + 1;
  }
  return {
    claims_with_a_finding: rows.length,
    of_which_arguments: rows.filter((r) => r.is_argument).length,
    of_which_law_or_fact: rows.filter((r) => !r.is_argument).length,
    by_reason: byReason,
  };
}
