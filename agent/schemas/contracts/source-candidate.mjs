/* ============================================================
   SourceCandidate — a document an agent found and has not verified

   The point of this contract is the gap between "found" and "is a
   source". data/sources.json holds canonical source records, and
   creating one from anything other than a document actually
   retrieved and read is red tier (AI-SAFE-BOUNDARIES §3). A
   candidate is the record of the finding, and it cannot promote
   itself: `state: "accepted"` requires a VerificationRecord id.

   What an agent read off the document — title, publisher, date — is
   factual and must cite the retrieval. What the agent concluded —
   which tier it belongs in, which authority class it came from — is
   inference. Why it matters to the brief is interpretation. The
   contract refuses to let the three arrive as one undifferentiated
   blob.

   TWO FIELDS THAT ARE NOT HERE, DELIBERATELY. The retrieval date and
   the content fingerprint live on the evidence entry that records
   the retrieval — `evidence[].retrieved_at` and
   `evidence[].checksum` — because they are properties of the act of
   fetching, not of the document. Repeating them at the top level
   would be a second home, and the two copies would disagree the
   first time a candidate was re-fetched. A reader of this record
   still has both; they are one level down, on the thing they
   describe.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { AUTHORITY_CLASSES, CANDIDATE_STATES, SECONDARY_AUTHORITY, taxonomyIds } from '../types.mjs';

export const SourceCandidate = defineContract({
  name: 'SourceCandidate',
  kind: 'finding',
  id_field: 'candidate_id',
  doc: 'A document an agent has located and proposes as a source. Not a source record, and never written into data/sources.json by the agent that found it.',
  fields: {
    candidate_id: F.id('This candidate\'s id.'),
    url: F.url('Where it was found. Null where the document exists but has no citable URL.', { nullable: true }),
    locator: F.string('Where inside it, when the candidate is one part of a larger document.', { nullable: true }),
    title: F.string('The document\'s title, as published — not as summarised.', { nullable: true, epistemic: 'factual' }),
    publisher: F.string('Who published it.', { nullable: true, epistemic: 'factual' }),
    publication_date: F.string('The publication date as printed, in the precision the document itself gives. Never inferred from a URL.', { nullable: true, unknownable: true, epistemic: 'factual' }),
    source_type: F.enum(taxonomyIds('source_type'), 'What sort of document it is, in data/taxonomy.json\'s vocabulary.', { nullable: true, epistemic: 'factual' }),
    url_status: F.enum(taxonomyIds('url_status'), 'Whether the URL was actually fetched, merely recorded, or does not exist.'),
    tier_estimate: F.enum(taxonomyIds('source_tier'), 'Which evidence tier the agent believes this belongs in. An estimate, and typed as inference for that reason.', { nullable: true, epistemic: 'inference' }),
    authority_class: F.enum(AUTHORITY_CLASSES, 'Which issuing authority published it, in the Scout\'s priority hierarchy. A classification the agent makes, and typed as inference for that reason. Null where the agent cannot place it — which is a finding, not a default to "secondary".', { nullable: true, epistemic: 'inference' }),
    relevance: F.text('Why this bears on the brief. The agent\'s reading, not the document\'s claim about itself.', { epistemic: 'interpretation' }),
    confidence: F.ratio('0..1, in the finding agent\'s own terms: how much it is standing on that this document is what it says it is and bears on what it says it bears on.', { nullable: true }),
    duplicate_candidate_ids: F.array(F.id('Another candidate_id from the same search.'), 'Other candidates that appear to be the same document. The Scout names them and never picks a winner: deciding which of two records is canonical is not a read-only agent\'s decision.'),
    matches_existing_source_id: F.string('The data/sources.json id this duplicates, where it does. A source is never described twice.', { nullable: true }),
    verification_ref: F.id('The VerificationRecord that checked this document. Required before the candidate may be accepted.', { nullable: true }),
    state: F.enum(CANDIDATE_STATES, 'Where the candidate stands. "accepted" is a claim about verification, not about enthusiasm.'),
  },
  forbidden: {
    source_id: 'A candidate has no data/sources.json id. It gets one when a human creates the source record — creating one from anything but a retrieved document is red tier.',
    tier: 'The evidence tier of a source is settled in data/sources.json, not estimated here. This contract carries tier_estimate, typed as inference.',
    grade: 'Evidence grades are derived at render time and never stored.',
  },
  rules: [
    (r) => (r.state === 'accepted' && !r.verification_ref
      ? ['state is "accepted" but no verification_ref: a candidate cannot verify itself']
      : []),
    (r) => (r.state === 'duplicate' && !r.matches_existing_source_id
      ? ['state is "duplicate" but matches_existing_source_id is null: name the record it duplicates']
      : []),
    (r) => (r.url_status === 'url:live' && !(r.evidence ?? []).some((e) => e.retrieved_at)
      ? ['url_status is "url:live" but no evidence carries a retrieved_at: "live" means fetched or seen on a stated date']
      : []),
    (r) => (r.authority_class === SECONDARY_AUTHORITY && ['tier:1', 'tier:2'].includes(r.tier_estimate)
      ? [`authority_class is "${SECONDARY_AUTHORITY}" but tier_estimate is "${r.tier_estimate}": a secondary source is never presented as equivalent to primary law or a regulator`]
      : []),
    (r) => (r.authority_class === null && !(r.epistemic?.unresolved ?? []).some((u) => u?.field === 'authority_class')
      ? ['authority_class is null with no epistemic.unresolved entry naming it: an unplaceable source is a finding, and it is never quietly filed as secondary']
      : []),
    (r) => ((r.duplicate_candidate_ids ?? []).includes(r.candidate_id)
      ? ['duplicate_candidate_ids names this candidate itself']
      : []),
    (r) => (r.url === null && r.url_status !== 'url:none' && r.locator === null
      ? ['no url and no locator: a candidate nobody can retrieve is a lead, not a candidate — record it as a DataGap instead']
      : []),
  ],
});
