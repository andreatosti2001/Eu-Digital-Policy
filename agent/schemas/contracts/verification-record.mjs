/* ============================================================
   VerificationRecord — one act of checking one proposition

   A verification is not an opinion that something looks right. It
   is: this proposition, checked against this retrieved document, by
   this method, at this location in it, with this verdict, leaving
   this residual gap.

   ONE RECORD, ONE PROPOSITION. `statement` is singular on purpose.
   "The Regulation entered into force on 1 August 2024 and applies
   from 2 August 2026" is two propositions with two different
   answers, and a record that holds both takes the weaker verdict
   for the stronger half. The Legal Verifier decomposes before it
   checks; this contract is the shape of one piece of that.

   The verdict vocabulary keeps apart the failures that get
   collapsed everywhere else. `contradicted` means the source says
   otherwise. `not_determinable` means the source cannot settle it.
   `conflict` means two authoritative sources say different things
   and neither displaces the other. Rendering the second as the
   first turns an absence of knowledge into a negative finding,
   which AI-SAFE-BOUNDARIES §0.5 names as the single most damaging
   thing this project could do; rendering the third as either one
   silently picks a winner between two regulators, which is a
   decision about the law and not an agent's to take.

   `confirmed` is gated: it requires evidence that directly supports
   the statement. A verdict resting only on `supports:context`
   evidence is refused, because context is not a citation.

   WHY THE LEGAL-STATUS AND DATE FIELDS ARE HERE, AND FLAT.
   SESSION 07 requires a verification to record what state the act
   is in and the three dates that state turns on. They are top-level
   rather than nested in one `legal_position` object because
   validate.mjs enforces the epistemic burden — a factual field must
   cite evidence, an inference must state its method, "unknown" must
   be declared — on TOP-LEVEL fields only. Nested, they would be
   documented and unenforced, which is the shape of a field nothing
   can be held to.

   WHAT IS NOT HERE. The outcome class the brief names — resolved,
   unresolved, conflict — is DERIVED from the verdict and is
   forbidden as a field, on the same reasoning as an evidence grade:
   a second copy is a second thing to be wrong. `supporting_location`
   is the proposition-level pointer (which article, which paragraph,
   which page carries THIS statement); `evidence[].locator` stays the
   document-level pointer (what was read). They answer different
   questions and neither is a copy of the other.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { LEGAL_STATUSES, VERIFICATION_VERDICTS, taxonomyIds } from '../types.mjs';

const direct = (e) => e.supports === 'supports:direct';
const partial = (e) => e.supports === 'supports:partial';

/** Verdicts that assert nothing was settled. Each one owes the
 *  reader a residual_gap and an open question. */
const UNSETTLED = ['not_determinable', 'source_unavailable', 'conflict'];

export const VerificationRecord = defineContract({
  name: 'VerificationRecord',
  kind: 'record',
  id_field: 'verification_id',
  doc: 'The record of checking one proposition against retrieved evidence, with the legal status and dates it turns on, its verdict, and whatever it left open.',
  fields: {
    verification_id: F.id('This verification\'s id.'),
    statement: F.text('The proposition checked, quoted or stated exactly as the record under check puts it. Not a paraphrase — a paraphrase verifies something else. One proposition, not a conjunction of several.'),
    method: F.string('How it was checked: which document, which part of it, what was compared.'),
    verdict: F.enum(VERIFICATION_VERDICTS, 'The outcome. "not_determinable" is not "contradicted", "conflict" is neither, and none of the three is a defect.', { epistemic: 'inference' }),
    confidence: F.ratio('0..1, in the verifying agent\'s own terms: how much it is standing on that this verdict is the right one. Never a probability that the proposition is true.'),
    checked_at: F.iso('When the check was performed.'),
    checked_by_kind: F.enum(['agent', 'human'], 'Whether a human or an agent performed it.'),
    checked_by: F.string('Which agent, or which person.'),

    /* ---- what the proposition is about, as read from the source ---- */

    document_id: F.string('The identifier the document gives itself — a CELEX number, an ELI, a case number, an OJ reference — exactly as printed. Never constructed from a URL.', { nullable: true, unknownable: true, epistemic: 'factual' }),
    source_tier: F.enum(taxonomyIds('source_tier'), 'Which evidence tier the verifier is treating the cited source as carrying. An estimate, typed as inference for that reason, and never the settled tier: that lives on the source record in data/sources.json.', { nullable: true, epistemic: 'inference' }),
    supporting_location: F.object({
      raw: F.string('The location exactly as the document expresses it — "Article 99(2)", "recital 14", "p. 7".'),
      article: F.string('The article number alone, where the document gives one.', { nullable: true }),
      paragraph: F.string('The paragraph or point, where the document gives one.', { nullable: true }),
      page: F.string('The page, where the document is paginated.', { nullable: true }),
    }, 'Where in the document this particular proposition is carried. Null when the document was read and no locatable place carries it — which is a finding, not a formatting problem.', { nullable: true, epistemic: 'factual' }),

    legal_status: F.enum(LEGAL_STATUSES, 'What state the act this proposition concerns is in. A classification the verifier makes from signals in the text, typed as inference for that reason. Null where nothing in the document places it — never a default, and never the next status along.', { nullable: true, unknownable: true, epistemic: 'inference' }),
    publication_date: F.string('The publication date as the document states it, in the precision the document itself gives.', { nullable: true, unknownable: true, epistemic: 'factual' }),
    entry_into_force_date: F.string('The entry-into-force date as stated. NOT computed from a "twentieth day following publication" formula: that arithmetic needs a publication date at day precision and an Official Journal issue, and a computed date presented as a read one is a fabricated legal fact.', { nullable: true, unknownable: true, epistemic: 'factual' }),
    applicability_date: F.string('The date from which the act applies, as stated. Kept apart from entry into force under all circumstances: an act in force is not yet an act that applies, and a reader told otherwise may act years early.', { nullable: true, unknownable: true, epistemic: 'factual' }),

    /* ---- what did not reconcile ---- */

    conflicting_evidence: F.array(F.object({
      evidence_refs: F.array(F.id('An evidence_id in this record\'s evidence array.'), 'The entries that disagree. At least two — a conflict needs two sides.', { min: 2 }),
      disagreement: F.text('What each of them says, in their own words. Never a summary that smooths the difference away.'),
      unreconciled_because: F.text('Why one does not simply displace the other — equal tier, both authoritative, different aspects of the same question.'),
    }, 'One disagreement this verification could not resolve.'), 'Disagreements between authoritative sources that this check left standing. Empty asserts there were none, which is itself worth asserting. A lower-tier source disagreeing with a higher-tier one is not a conflict and does not go here — say so in the method instead.'),

    residual_gap: F.text('What the check did NOT settle. Null only when nothing is left open.', { nullable: true }),
    supersedes: F.id('An earlier VerificationRecord this replaces. Verifications are never edited; a later one supersedes.', { nullable: true }),
    recheck_after: F.iso('When this should be checked again, where the underlying fact can move.', { nullable: true }),
  },
  forbidden: {
    confidence_override: 'A verdict is not adjusted after the fact. Write a superseding VerificationRecord.',
    verified: 'A boolean cannot hold six verdicts. Use verdict.',
    last_verified: 'last_verified belongs to the dataset record this verification is about, written when a human applies the change.',
    outcome_class: 'resolved / unresolved / conflict is derived from the verdict, and deriving it twice is how two copies come to disagree. Derive it where it is read.',
    tier: 'The evidence tier of a source is settled in data/sources.json, not here. This contract carries source_tier, typed as inference and named as an estimate.',
    grade: 'Evidence grades are derived at render time and never stored.',
    binding: 'Whether an act binds anybody is not a boolean an agent sets. It follows from legal_status, and a guidance document does not become law because a field said true.',
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
    (r) => (UNSETTLED.includes(r.verdict) && !r.residual_gap
      ? [`verdict is "${r.verdict}" but residual_gap is null: say what could not be settled`]
      : []),
    (r) => (UNSETTLED.includes(r.verdict) && (r.epistemic?.unresolved ?? []).length === 0
      ? [`verdict is "${r.verdict}" but epistemic.unresolved is empty: an unsettled check has an open question by definition`]
      : []),
    (r) => (r.verdict === 'confirmed' && (r.epistemic?.fact ?? []).length === 0
      ? ['verdict is "confirmed" but epistemic.fact is empty: name what was established and cite the evidence for it']
      : []),

    /* ---- the conflict verdict, and what it owes ---- */

    (r) => (r.verdict === 'conflict' && (r.conflicting_evidence ?? []).length === 0
      ? ['verdict is "conflict" but conflicting_evidence is empty: name the entries that disagree and what each says']
      : []),
    (r) => {
      const ids = new Set((r.evidence ?? []).map((e) => e?.evidence_id));
      return (r.conflicting_evidence ?? []).flatMap((c, i) => (c?.evidence_refs ?? [])
        .filter((ref) => !ids.has(ref))
        .map((ref) => `conflicting_evidence[${i}]: evidence_ref "${ref}" resolves to nothing in this record's evidence array`));
    },
    (r) => (r.verdict === 'confirmed' && (r.conflicting_evidence ?? []).length > 0
      ? ['verdict is "confirmed" while conflicting_evidence names a disagreement this check left standing: a proposition sitting on unreconciled authority is not confirmed']
      : []),
    (r) => ((r.conflicting_evidence ?? []).length > 0
      && !(r.epistemic?.inference ?? []).some((e) => e?.field === 'conflicting_evidence')
      ? ['conflicting_evidence is populated with no epistemic.inference entry naming it: concluding that two sources disagree is a judgement, and it states its method']
      : []),

    /* ---- location, status and the date that must not be assumed ---- */

    (r) => (r.supporting_location && !(r.evidence ?? []).some((e) => e?.kind === 'retrieved_document')
      ? ['supporting_location names a place in a document, but no evidence entry is a retrieved_document: nothing can be located inside a document nobody fetched']
      : []),
    (r) => (r.legal_status === 'applicable'
      && r.applicability_date === null
      && !(r.epistemic?.unresolved ?? []).some((u) => u?.field === 'applicability_date')
      ? ['legal_status is "applicable" with no applicability_date and no open question naming one: saying an act applies without saying from when is the half of the statement a reader acts on']
      : []),
  ],
});
