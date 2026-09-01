/* ============================================================
   ChangeRecord — a change actually made to the repository

   The distinction from WebsiteChange matters and is the reason
   there are two contracts rather than one. A ChangeRecord covers
   ANY change an agent makes here, including the green-tier ones
   that never reach a reader: a new validator, a document, a skill.
   A WebsiteChange covers the subset that changes what the site
   serves, and it is the anchor of the audit chain.

   The file list lives here and only here. WebsiteChange references
   this record by id and is forbidden from repeating it — one home
   per fact, applied to the agent layer's own records.

   `touched_legal_record` is the field that decides how much
   ceremony a change needs: a change to data/*.json, to the prose,
   or to the derivation rules is a change to what the site tells a
   reader about EU law, and it does not land on an agent's own
   authority.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { CHANGE_STATES, ROLLBACK_METHODS } from '../types.mjs';

const FileChange = F.object({
  path: F.string('Repository path.'),
  operation: F.enum(['add', 'modify', 'remove', 'rename'], 'What happened to it.'),
  lines_added: F.int('Lines added.', { min: 0, nullable: true }),
  lines_removed: F.int('Lines removed.', { min: 0, nullable: true }),
  sha256_before: F.string('Hash before, where the file existed.', { nullable: true }),
  sha256_after: F.string('Hash after, where the file still exists.', { nullable: true }),
}, 'One file, and what happened to it.');

export const ChangeRecord = defineContract({
  name: 'ChangeRecord',
  kind: 'record',
  id_field: 'change_id',
  doc: 'A change made to this repository by an agent: which files, under which proposal, checked by which QA result, approved by whom, and how it would be undone.',
  fields: {
    change_id: F.id('This change\'s id.'),
    proposal_id: F.id('The proposal this implements. Null only for a change that needed none, and a change to the legal record always needs one.', { nullable: true }),
    approval_id: F.id('The approval that authorised it. Required whenever the legal record was touched.', { nullable: true }),
    qa_result_id: F.id('The QAResult for this change. Required before it may be applied.', { nullable: true }),
    files: F.array(FileChange, 'Every file touched. This is the only home for the file list; WebsiteChange references this record rather than repeating it.', { min: 1 }),
    diff_summary: F.text('What the diff does, in words a reviewer can hold it to.'),
    touched_legal_record: F.bool('True if this changed data/*.json, the brief\'s prose, or the derivation rules — anything that changes what the site tells a reader about EU law.'),
    state: F.enum(CHANGE_STATES, 'proposed · applied · reverted · abandoned.'),
    branch: F.string('Which branch it was made on. Never main without explicit permission — a push to main publishes.'),
    commit: F.string('The commit sha, once there is one.', { nullable: true }),
    applied_at: F.iso('When it was applied to the working tree.', { nullable: true }),
    applied_by: F.string('Which agent or person applied it.', { nullable: true }),
    reversible: F.bool('Whether this can be undone mechanically.'),
    rollback_method: F.enum(ROLLBACK_METHODS, 'How it would be undone.'),
    rollback_ref: F.string('The revert commit or the restored state, once it has been undone.', { nullable: true }),
  },
  forbidden: {
    deployed: 'Deployment is a separate fact with its own record. A change in the working tree has not reached a reader.',
    published: 'Same. See WebsiteChange.',
    verified: 'A change is not verified; the statements it carries are. See VerificationRecord.',
  },
  rules: [
    (r) => (r.state === 'applied' && !r.applied_at
      ? ['state is "applied" but applied_at is null']
      : []),
    (r) => (r.state === 'applied' && !r.qa_result_id
      ? ['state is "applied" but no qa_result_id: the four validators are this project\'s test suite and a change lands after them, not before']
      : []),
    (r) => (r.touched_legal_record === true && !r.approval_id
      ? ['touched_legal_record is true but approval_id is null: a change to what the site says about EU law does not land on an agent\'s own authority']
      : []),
    (r) => (r.touched_legal_record === true && !r.proposal_id
      ? ['touched_legal_record is true but proposal_id is null: name the proposal this implements']
      : []),
    (r) => (r.state === 'reverted' && !r.rollback_ref
      ? ['state is "reverted" but rollback_ref is null: name what undid it']
      : []),
    (r) => (r.reversible === false && r.rollback_method !== 'not_reversible'
      ? [`reversible is false but rollback_method is "${r.rollback_method}"`]
      : []),
    (r) => (r.branch === 'main' && !(r.epistemic?.fact ?? []).some((f) => /permission/i.test(f.statement))
      ? ['branch is "main" and nothing in the epistemic block records the explicit permission: a push to main publishes to the live site, and there is no deploy gate']
      : []),
  ],
});
