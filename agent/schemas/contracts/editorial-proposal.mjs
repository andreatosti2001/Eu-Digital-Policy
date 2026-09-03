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

   ------------------------------------------------------------
   SESSION 14 added three fields, and they exist to make the
   session's own discipline CHECKABLE rather than conventional.

   `proposal_kind` — factual update · analytical update · editorial
   recommendation. The first may be drafted automatically; the other
   two require a human. Without the field that distinction lives in
   an agent's head, and a rule cannot be written against it.

   `editorial_state` — which of FACT · INTERPRETATION · CRITIQUE ·
   UNRESOLVED the prose being changed is, or `not_attributed` where
   the block carries no claim record and the question cannot be
   answered. It is NOT a second home for `claims.json`'s `type`: it
   is a statement about a SENTENCE, and no record in data/ describes
   a sentence. Where a claim is attached the state is derived from
   it and from the grade js/format.js computes; where none is, the
   honest answer is the fifth word.

   `staleness` — SESSION 15. Whether the value that moved is IN the
   sentence, quoted, or whether the sentence merely depends on the
   record that changed. Those are different claims and the rules
   below refuse to let the weaker one produce an edit.

   THE RULES ARE THE POINT. Together they say: nothing but a factual
   update may carry a drafted replacement; a factual update must be
   able to quote what it is correcting; a factual update must keep
   the claim record the sentence hangs on; and an analytical passage
   is never rewritten because a factual input moved.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';
import {
  EDITORIAL_STATES, EDITORIAL_PROPOSAL_KINDS, EDITORIAL_STALENESS_KINDS,
  DRAFTABLE_EDITORIAL_KIND, PROSE_HOMES,
} from '../types.mjs';

export const I18N_DISPOSITIONS = ['added', 'removed', 'superseded', 'meaning_unchanged', 'pending_translation'];

/** The states that are the author's argument rather than a report of
 *  the world. A proposal over one of these may never carry a draft. */
const ANALYTICAL_STATES = ['interpretation', 'critique'];

export const EditorialProposal = defineProposal({
  name: 'EditorialProposal',
  doc: 'A proposed change to the brief\'s prose, its part metadata, or anything a reader reads as the argument. Typed by what it is — a factual update, an analytical update or an editorial recommendation — and only the first may carry a drafted replacement.',
  fields: {
    proposal_kind: F.enum(EDITORIAL_PROPOSAL_KINDS, 'What sort of change this is. A factual update corrects a value inside a sentence and may be drafted; an analytical update flags an argument whose factual premise moved and is never drafted; an editorial recommendation is everything the agent could establish and could not correct.'),
    editorial_state: F.enum(EDITORIAL_STATES, 'What the prose being changed IS: a directly supported proposition, a reasoned understanding of implications, an analytical judgement, something the evidence cannot settle — or not_attributed, where the block carries no claim record and the question is genuinely open. Derived at read time from the claim behind the sentence and the grade js/format.js computes for it; never copied from claims.json.', { epistemic: 'inference' }),
    staleness: F.object({
      kind: F.enum(EDITORIAL_STALENESS_KINDS, 'contradicted — the value that moved appears in the sentence, quoted below. possibly_stale — the sentence depends on the record that changed and does not state the value.'),
      quoted: F.text('The sentence, with the old value in it, so a reviewer can check the finding rather than take it. Required when the kind is contradicted; null when it is possibly_stale, because there is nothing to quote and pretending otherwise is the whole failure this field exists to prevent.', { nullable: true }),
      changed_entity: F.string('The canonical record whose change reached this sentence.', { nullable: true }),
      changed_value: F.object({
        old: F.string('What the corpus asserted, as the verified input states it.', { nullable: true }),
        new: F.string('What the verified input establishes instead, exactly as the document prints it. Never normalised.', { nullable: true }),
      }, 'The two sides of the change, carried from the verified input rather than restated. Null where the input names no value — a record\'s existence changing, for instance.', { nullable: true }),
      how: F.string('How the dependency was established: the claim attached to the block names the record, the sentence names the entity, or the sentence contains the value.'),
      why: F.text('Why this is reported at this strength and not the other. A finding that cannot say why it is not the stronger claim is the stronger claim wearing a hedge.'),
    }, 'Why this sentence is being reported, and at what strength.', { nullable: true }),
    prose_locations: F.array(F.object({
      file: F.string('Which file — index.html, data/brief.json, one of the other six pages.'),
      anchor: F.string('Where inside it: a heading id, a node id, a part id, a line reference.'),
      part_id: F.string('The data/brief.json part, where the location sits inside one.', { nullable: true }),
      home: F.enum(PROSE_HOMES, 'Which of the three homes of an English string this location is: the markup a reader sees, the inline __CONTENT__ blob, or data/brief.json.', { nullable: true }),
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
    caveats_preserved: F.array(F.string('One caveat, hedge, asterisk or stated uncertainty carried through unchanged.'), 'What the sentence hedges, and that the change keeps. A correction that removes a hedge the evidence requires is not a correction (AI-SAFE-BOUNDARIES §0.7); an empty array on a drafted update asserts the sentence carried none.'),
    register_note: F.text('How this sits with the brief\'s register: an analytical brief, not marketing copy, and not softened.', { nullable: true, epistemic: 'interpretation' }),
  },
  forbidden: {
    tone: 'The brief\'s register is the author\'s. There is no field for adjusting it.',
    softens_limitation: 'A stated limitation is changed by doing the verification work, never by rewording. There is no field for it here because it is not a permitted operation.',
    rewritten_argument: 'There is no field for a rewritten argument, because an agent does not write one. An analytical passage whose premise moved is flagged for a human; the replacement is theirs.',
    evidence_grade: 'A claim\'s grade is derived at render time by js/format.js. editorial_state is computed from it and never stores it.',
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

    /* ---- SESSION 14: only one kind of proposal may carry a draft ---- */

    (r) => {
      const withDraft = (r.proposed_change?.operations ?? []).filter((o) => o.proposed !== null && o.proposed !== undefined);
      return (r.proposal_kind && r.proposal_kind !== DRAFTABLE_EDITORIAL_KIND && withDraft.length)
        ? [`proposal_kind is "${r.proposal_kind}" but ${withDraft.length} operation(s) carry a drafted replacement: only a ${DRAFTABLE_EDITORIAL_KIND} may be drafted, because everything else here is the author's argument and an agent does not write one`]
        : [];
    },
    (r) => (r.proposal_kind && r.proposal_kind !== DRAFTABLE_EDITORIAL_KIND && r.autonomy_class !== 'human_only'
      ? [`proposal_kind is "${r.proposal_kind}" with autonomy_class "${r.autonomy_class}": an analytical update and an editorial recommendation are both human_only, and nothing about them may be prepared for automatic application`]
      : []),
    (r) => (r.proposal_kind === DRAFTABLE_EDITORIAL_KIND && ANALYTICAL_STATES.includes(r.editorial_state)
      ? [`proposal_kind is "${DRAFTABLE_EDITORIAL_KIND}" over prose whose editorial_state is "${r.editorial_state}": an argument is never corrected because a factual input moved — flag it as an analytical_update and leave the wording to a human`]
      : []),
    (r) => (r.proposal_kind === DRAFTABLE_EDITORIAL_KIND && r.editorial_state === 'unresolved'
      ? ['a factual_update over prose whose editorial_state is "unresolved": the evidence behind that sentence is insufficient or conflicting, so there is no established value to substitute. It is a recommendation, not a correction']
      : []),
    (r) => (r.proposal_kind === DRAFTABLE_EDITORIAL_KIND && r.editorial_state === 'not_attributed'
      ? ['a factual_update over prose carrying no claim record: every material factual sentence retains its provenance, and a sentence with none is not one an agent may silently correct. Report it as a recommendation naming the missing attribution']
      : []),
    (r) => (r.proposal_kind === DRAFTABLE_EDITORIAL_KIND && (r.claim_ids_affected ?? []).length === 0
      ? ['a factual_update naming no affected claim: the sentence and its claim record are two views of one assertion, and a correction that cannot name the record has orphaned it']
      : []),

    /* ---- SESSION 15: a correction quotes what it corrects ---- */

    (r) => (r.proposal_kind === DRAFTABLE_EDITORIAL_KIND && r.staleness?.kind !== 'contradicted'
      ? [`a factual_update whose staleness.kind is "${r.staleness?.kind ?? 'null'}": a correction is drafted only where the value that moved is IN the sentence. A sentence that might be stale is flagged, never edited`]
      : []),
    (r) => (r.staleness?.kind === 'contradicted' && !r.staleness?.quoted
      ? ['staleness.kind is "contradicted" with nothing quoted: the claim that a sentence states the old value is checkable only if the sentence is attached']
      : []),
    (r) => (r.staleness?.kind === 'possibly_stale' && (r.proposed_change?.operations ?? []).some((o) => o.proposed !== null && o.proposed !== undefined)
      ? ['staleness.kind is "possibly_stale" and an operation carries a drafted replacement: nothing here established that the sentence is wrong, and an edit asserts that it is']
      : []),
    (r) => (r.staleness?.kind === 'possibly_stale' && r.staleness?.quoted
      ? ['staleness.kind is "possibly_stale" but a quote is attached: a quote showing the old value would make this contradicted. If the quote does not show it, it is padding on a finding that cannot support one']
      : []),

    /* ---- the caveats survive the edit ---- */

    (r) => {
      const draft = (r.proposed_change?.operations ?? []).filter((o) => o.proposed);
      const lost = draft.filter((o) => (r.caveats_preserved ?? []).some((c) => String(o.current ?? '').includes(c) && !String(o.proposed).includes(c)));
      return lost.length
        ? [`${lost.length} operation(s) drop a caveat the record itself lists as preserved: a hedge the evidence requires is not removed by a correction (AI-SAFE-BOUNDARIES §0.7)`]
        : [];
    },
  ],
});
