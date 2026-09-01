/* ============================================================
   EditorialProposal — a change to what the brief says

   Editing the argument is the author's work. An agent may correct a
   fact it has verified, and the moment it does, two traps open.

   The first is the __CONTENT__ bypass: index.html inlines a blob
   duplicating data/brief.json, nothing loads brief.json at runtime,
   no validator compares the two, and meta.standfirst has already
   drifted. Any operation on index.html must therefore declare that
   both homes were checked.

   The second is superseded translations: correcting an English
   string without declaring its key superseded leaves the it/fr/es
   editions asserting the thing that was just corrected. That has
   already happened once. So every affected i18n key needs a stated
   disposition — not a promise that someone will look.

   And `changes_what_a_claim_asserts` is the red-tier flag: altering
   what a claim is said to prove is not an editorial change, whatever
   it looks like in a diff.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';

export const I18N_DISPOSITIONS = ['added', 'removed', 'superseded', 'meaning_unchanged', 'pending_translation'];

export const EditorialProposal = defineProposal({
  name: 'EditorialProposal',
  doc: 'A proposed change to the brief\'s prose, its part metadata, or anything a reader reads as the argument.',
  fields: {
    prose_locations: F.array(F.object({
      file: F.string('Which file — index.html, data/brief.json, one of the other six pages.'),
      anchor: F.string('Where inside it: a heading id, a node id, a part id, a line reference.'),
      part_id: F.string('The data/brief.json part, where the location sits inside one.', { nullable: true }),
    }, 'One place the prose changes.'), 'Every place this touches.', { min: 1 }),
    claim_ids_affected: F.array(F.string('A data/claims.json id.'), 'Claims whose supporting sentence this changes. Every consequential statement in the prose has a claim record; changing the sentence changes what the record is attached to.'),
    changes_what_a_claim_asserts: F.bool('True if any claim would afterwards assert something different. Red tier — this is the highest-leverage change in the repository.'),
    content_blob_checked: F.bool('True when both homes of the prose were checked: index.html\'s inline __CONTENT__ blob and data/brief.json. Required for any operation on index.html.'),
    content_blob_divergence: F.text('What differs between the two homes at the point being edited, where anything does. Do not silently reconcile them — the drift is the author\'s decision.', { nullable: true }),
    i18n_dispositions: F.array(F.object({
      key: F.string('The data-i18n key.'),
      disposition: F.enum(I18N_DISPOSITIONS, 'What happens to it in the locale register.'),
      note: F.string('Why, where the disposition is not obvious.', { nullable: true }),
    }, 'What becomes of one locale key.'), 'Every data-i18n key this touches, and what becomes of it. An undeclared key leaves three locale editions asserting the superseded English.'),
    register_note: F.text('How this sits with the brief\'s register: an analytical brief, not marketing copy, and not softened.', { nullable: true, epistemic: 'interpretation' }),
  },
  forbidden: {
    tone: 'The brief\'s register is the author\'s. There is no field for adjusting it.',
    softens_limitation: 'A stated limitation is changed by doing the verification work, never by rewording. There is no field for it here because it is not a permitted operation.',
  },
  rules: [
    (r) => (r.changes_what_a_claim_asserts === true && r.autonomy_class !== 'human_only'
      ? [`changes_what_a_claim_asserts is true with autonomy_class "${r.autonomy_class}": altering what a claim is said to prove is red tier`]
      : []),
    (r) => {
      const touchesIndex = (r.prose_locations ?? []).some((p) => p.file === 'index.html')
        || (r.proposed_change?.operations ?? []).some((o) => String(o.target).startsWith('index.html'));
      return touchesIndex && r.content_blob_checked !== true
        ? ['this touches index.html but content_blob_checked is false: the prose has two homes there — the inline __CONTENT__ blob and data/brief.json — and no validator compares them']
        : [];
    },
    (r) => ((r.claim_ids_affected ?? []).length > 0 && r.autonomy_class === 'autonomous'
      ? ['claim_ids_affected is not empty but autonomy_class is "autonomous": a change to a sentence a claim record is attached to is at least amber']
      : []),
    (r) => {
      const undeclared = (r.i18n_dispositions ?? []).filter((d) => !d.disposition);
      return undeclared.length ? ['an i18n key was listed with no disposition'] : [];
    },
  ],
});
