/* ============================================================
   VerificationRecord — one act of checking one statement

   A verification is not an opinion that something looks right. It
   is: this statement, checked against this retrieved document, by
   this method, with this verdict, leaving this residual gap.

   The verdict vocabulary keeps apart the two failures that get
   collapsed everywhere else. `contradicted` means the source says
   otherwise. `not_determinable` means the source cannot settle it.
   Rendering the second as the first turns an absence of knowledge
   into a negative finding, which AI-SAFE-BOUNDARIES §0.5 names as
   the single most damaging thing this project could do.

   `confirmed` is gated: it requires evidence that directly supports
   the statement. A verdict resting only on `supports:context`
   evidence is refused, because context is not a citation.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { VERIFICATION_VERDICTS } from '../types.mjs';

const direct = (e) => e.supports === 'supports:direct';
const partial = (e) => e.supports === 'supports:partial';

export const VerificationRecord = defineContract({
  name: 'VerificationRecord',
  kind: 'record',
  id_field: 'verification_id',
  doc: 'The record of checking one statement against retrieved evidence, with its verdict and whatever it left open.',
  fields: {
    verification_id: F.id('This verification\'s id.'),
    statement: F.text('The statement checked, quoted or stated exactly as the record under check puts it. Not a paraphrase — a paraphrase verifies something else.'),
    method: F.string('How it was checked: which document, which part of it, what was compared.'),
    verdict: F.enum(VERIFICATION_VERDICTS, 'The outcome. "not_determinable" is not "contradicted", and neither is a defect.', { epistemic: 'inference' }),
    checked_at: F.iso('When the check was performed.'),
    checked_by_kind: F.enum(['agent', 'human'], 'Whether a human or an agent performed it.'),
    checked_by: F.string('Which agent, or which person.'),
    residual_gap: F.text('What the check did NOT settle. Null only when nothing is left open.', { nullable: true }),
    supersedes: F.id('An earlier VerificationRecord this replaces. Verifications are never edited; a later one supersedes.', { nullable: true }),
    recheck_after: F.iso('When this should be checked again, where the underlying fact can move.', { nullable: true }),
  },
  forbidden: {
    confidence_override: 'A verdict is not adjusted after the fact. Write a superseding VerificationRecord.',
    verified: 'A boolean cannot hold five verdicts. Use verdict.',
    last_verified: 'last_verified belongs to the dataset record this verification is about, written when a human applies the change.',
  },
  rules: [
    (r) => (r.verdict === 'confirmed' && !(r.evidence ?? []).some(direct)
      ? ['verdict is "confirmed" but no evidence directly supports the statement: "supports:context" is not a citation']
      : []),
    (r) => (r.verdict === 'partially_confirmed' && !(r.evidence ?? []).some((e) => direct(e) || partial(e))
      ? ['verdict is "partially_confirmed" but no evidence directly or partially supports the statement']
      : []),
    (r) => (r.verdict === 'contradicted' && !(r.evidence ?? []).some((e) => direct(e) || partial(e))
      ? ['verdict is "contradicted" but no evidence directly or partially bears on the statement']
      : []),
    (r) => (['not_determinable', 'source_unavailable'].includes(r.verdict) && !r.residual_gap
      ? [`verdict is "${r.verdict}" but residual_gap is null: say what could not be settled`]
      : []),
    (r) => (['not_determinable', 'source_unavailable'].includes(r.verdict) && (r.epistemic?.unresolved ?? []).length === 0
      ? [`verdict is "${r.verdict}" but epistemic.unresolved is empty: an unsettled check has an open question by definition`]
      : []),
    (r) => (r.verdict === 'confirmed' && (r.epistemic?.fact ?? []).length === 0
      ? ['verdict is "confirmed" but epistemic.fact is empty: name what was established and cite the evidence for it']
      : []),
  ],
});
