/* ============================================================
   WebsiteChange — a change that reaches a reader

   This is the record that has to answer, six months later: which
   source, retrieved when, verified how, decided by which agent on
   what reasoning, approved by whom, implemented as which change,
   deployed in which commit.

   Two design rules follow from that.

   It carries no file list. The files live on the ChangeRecord this
   references. A second copy of the file list is a second copy that
   can disagree with the first.

   And a missing link in the chain is REPORTED, never omitted.
   Every empty link array must be named in `chain_gaps` with a
   reason — the same discipline as the asterisk in the running text,
   and the same one `cli.mjs chain` already applies in the
   observability layer. A chain that silently omits its weak link
   looks complete, which is the failure mode worth designing
   against.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { DEPLOYMENT_STATES } from '../types.mjs';

export const CHAIN_LINKS = ['source', 'verification', 'proposal', 'approval', 'qa', 'implementation', 'deployment'];

export const WebsiteChange = defineContract({
  name: 'WebsiteChange',
  kind: 'record',
  id_field: 'website_change_id',
  doc: 'A change that alters what the public site serves, with the audit chain from source to deployment and every gap in that chain named.',
  fields: {
    website_change_id: F.id('This record\'s id.'),
    change_record_id: F.id('The ChangeRecord that holds the files. Required — this contract deliberately does not repeat them.'),
    pages: F.array(F.string('A page filename.'), 'Which of the seven pages a reader would see differently.', { min: 1 }),
    reader_visible: F.bool('True if a reader would notice. False for a change that is real but invisible — a comment, a reordering with no rendered effect.'),
    legal_fact_touched: F.bool('True if this changed a citation, date, CELEX number, article number, fine, status, competence or claim. The highest-consequence flag in the agent layer.'),
    summary: F.text('What a reader would now see that they did not before.'),
    source_candidate_ids: F.array(F.id('A SourceCandidate id.'), 'Where the material came from.'),
    verification_ids: F.array(F.id('A VerificationRecord id.'), 'What was checked, and by which record.'),
    proposal_ids: F.array(F.id('A proposal_id.'), 'What was proposed.'),
    approval_ids: F.array(F.id('An approval_id.'), 'Who authorised it.'),
    qa_result_ids: F.array(F.id('A QAResult id.'), 'What the checks said.'),
    chain_gaps: F.array(F.object({
      link: F.enum(CHAIN_LINKS, 'Which link is missing.'),
      why_missing: F.string('Why there is nothing there. "Not applicable" is an answer; silence is not.'),
    }, 'One missing link, named.'), 'Every link of the chain this record cannot supply. An empty link array with no gap entry is refused.'),
    deployment: F.enum(DEPLOYMENT_STATES, 'undeployed · pushed · published · rolled_back · unknown. There is no deploy gate here, so "pushed" and "published" are close together and still not the same fact.'),
    commit: F.string('The commit that carries it.', { nullable: true }),
    deployed_at: F.iso('When it went out.', { nullable: true }),
  },
  forbidden: {
    files: 'The file list lives on the ChangeRecord this references. Two copies of a file list can disagree.',
    diff: 'Same. Reference the change record.',
    approved: 'An approval is a record with an author and a date, not a boolean here.',
  },
  rules: [
    (r) => (r.legal_fact_touched === true && (r.verification_ids ?? []).length === 0
      ? ['legal_fact_touched is true but no verification is referenced: a legal fact reaches a reader only after something checked it']
      : []),
    (r) => (r.legal_fact_touched === true && (r.approval_ids ?? []).length === 0
      ? ['legal_fact_touched is true but no approval is referenced: authoring or altering a legal fact is red tier']
      : []),
    (r) => {
      const map = {
        source: 'source_candidate_ids',
        verification: 'verification_ids',
        proposal: 'proposal_ids',
        approval: 'approval_ids',
        qa: 'qa_result_ids',
      };
      const named = new Set((r.chain_gaps ?? []).map((g) => g.link));
      return Object.entries(map)
        .filter(([link, field]) => (r[field] ?? []).length === 0 && !named.has(link))
        .map(([link, field]) => `${field} is empty and "${link}" is not named in chain_gaps: a missing link is reported, never omitted`);
    },
    (r) => (['pushed', 'published'].includes(r.deployment) && !r.commit
      ? [`deployment is "${r.deployment}" but no commit is named`]
      : []),
    (r) => (r.deployment === 'published' && !r.deployed_at
      ? ['deployment is "published" but deployed_at is null']
      : []),
    (r) => (r.reader_visible === false && (r.epistemic?.inference ?? []).length === 0
      ? ['reader_visible is false but nothing in the epistemic block says how that was concluded: invisibility is an inference, not an observation']
      : []),
  ],
});
