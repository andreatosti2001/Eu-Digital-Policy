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
   which tier it belongs in — is inference. Why it matters to the
   brief is interpretation. The contract refuses to let the three
   arrive as one undifferentiated blob.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { CANDIDATE_STATES, taxonomyIds } from '../types.mjs';

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
    relevance: F.text('Why this bears on the brief. The agent\'s reading, not the document\'s claim about itself.', { epistemic: 'interpretation' }),
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
    (r) => (r.url === null && r.url_status !== 'url:none' && r.locator === null
      ? ['no url and no locator: a candidate nobody can retrieve is a lead, not a candidate — record it as a DataGap instead']
      : []),
  ],
});
