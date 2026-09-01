/* ============================================================
   ClaimEvidence — the edge between one claim and one source

   The site's whole evidence position turns on the `supports`
   qualifier: direct means the source states the proposition,
   partial means it establishes part of it or a narrower case, and
   context means it informs the claim without establishing it and is
   NOT a citation. This contract exists so an agent proposing such
   an edge has to say which, and to say how it decided.

   `supports` is typed as inference, not fact: it is a judgment
   about a relationship between two documents, and the epistemic
   block therefore has to carry the method by which it was judged.

   Two things live elsewhere and are refused here. The claim's type
   lives in data/claims.json — reclassifying it is the highest-
   leverage field in the repository and red tier. The claim's grade
   is derived at render time from its type and the tier of its
   strongest direct source, and is never stored anywhere.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { PROVENANCE_ROLES, taxonomyIds } from '../types.mjs';

export const ClaimEvidence = defineContract({
  name: 'ClaimEvidence',
  kind: 'link',
  id_field: 'link_id',
  doc: 'A proposed or recorded link between a claim in data/claims.json and a source in data/sources.json, qualified by how the source bears on it.',
  fields: {
    link_id: F.id('This link\'s id.'),
    claim_id: F.string('The data/claims.json id.'),
    source_id: F.string('The data/sources.json id.'),
    supports: F.enum(taxonomyIds('supports'), 'How the source bears on the claim. A judgment about two documents, and typed as inference for that reason.', { epistemic: 'inference' }),
    role: F.enum(PROVENANCE_ROLES, 'What kind of authority the source carries here.'),
    locator: F.string('Where in the source — article, paragraph, page, section.', { nullable: true }),
    quote: F.text('The words the link rests on. A direct support with neither quote nor locator is unfalsifiable.', { nullable: true }),
    is_citation: F.bool('Whether this counts as a citation for grading. False whenever supports is "supports:context".'),
    established_by: F.id('The VerificationRecord that checked this link. Null means nobody has.', { nullable: true }),
  },
  forbidden: {
    claim_type: 'The claim\'s type lives in data/claims.json. Copying it here would be a second home for the highest-leverage field in the repository, and changing it is red tier.',
    grade: 'A claim\'s grade is derived at render time from its type and the tier of its strongest direct source. Storing one creates the copy that can drift.',
    evidence_grade: 'Derived at render time. Never stored.',
    tier: 'The source\'s tier lives on the source record in data/sources.json.',
    strength: 'There is one vocabulary for how a source bears on a claim, and it is `supports`.',
  },
  rules: [
    (r) => (r.is_citation === true && r.supports === 'supports:context'
      ? ['is_citation is true with supports "supports:context": context informs a claim without establishing it, and is not a citation']
      : []),
    (r) => (r.supports !== 'supports:context' && r.is_citation === false
      ? [`is_citation is false with supports "${r.supports}": say why this direct or partial support does not count, or set it true`]
      : []),
    (r) => (r.supports === 'supports:direct' && !r.quote && !r.locator
      ? ['supports is "supports:direct" with neither quote nor locator: a direct support nobody can look up cannot be checked']
      : []),
    (r) => (!r.established_by && (r.epistemic?.unresolved ?? []).length === 0
      ? ['established_by is null and epistemic.unresolved is empty: an unverified link has an open question — that it is unverified']
      : []),
  ],
});
