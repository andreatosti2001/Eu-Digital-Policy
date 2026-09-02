/* ============================================================
   RegulatoryChange — the world moved, and the corpus has not

   ---------------------------------------------------------------
   THIS IS NOT `ChangeRecord`, AND THE DIFFERENCE IS THE POINT.

   SESSION 09's brief says "Output: ChangeRecord". This repository
   already has a contract by that name and it means something else:
   **a change actually made to this repository** — a file list, a
   diff summary, a branch, a commit, an applied_at, a rollback ref.
   Its `files` array requires at least one entry. A regulation
   entering into force changes no file, sits on no branch, and has no
   commit; and a `ChangeRecord` that could hold one would have to
   stop meaning what it means.

   So this contract was added rather than the existing one bent, and
   the conflict is recorded here rather than resolved silently —
   AGENTS.md requires exactly that where a brief and the code
   disagree. `files`, `diff_summary`, `branch`, `commit` and
   `applied_at` are `forbidden` below, each answered with "that is
   ChangeRecord's field", so an agent that reaches for the wrong one
   is told which contract it wanted.

   THE CHAIN THE TWO SIT IN:

       RegulatoryChange   the world moved            (this contract)
             ↓
       DataProposal       what the corpus might do about it
             ↓
       ApprovalRequest    a human decides
             ↓
       ChangeRecord       a change made to this repository

   Each arrow crosses a gate. A `RegulatoryChange` is a FINDING and
   carries no edit: `proposed_change`, `operations` and `proposed`
   are forbidden. Detection and amendment are separate acts, and the
   separation is what keeps an unverified "update" out of the corpus
   — the regulatory-change-detection skill states it as a refusal
   condition and this contract states it as a shape.
   ---------------------------------------------------------------

   WHY `old_value` AND `new_value` ARE STRINGS. They hold values
   from two different vocabularies — a taxonomy id on one side, a
   date as a document prints it on the other — and typing them
   would mean choosing one. Both are carried exactly as their side
   states them, and `attribute` says which field they belong to. A
   detector that normalised them into a common type would be
   deciding that "1 August 2024" and "2024-08-01" are the same
   thing, which is a reading, not a fact.

   WHY `materiality` IS AN INFERENCE. It is a judgement about what a
   change costs somebody outside this repository, and the epistemic
   block therefore has to carry the method by which it was judged.
   It is not derived from `change_kind` alone: the same kind of
   change is material at one attribute and cosmetic at another, and
   a `MATERIALITY_LEVELS[change_kind]` table would have been a
   second copy of a judgement pretending to be a lookup.

   AND WHY THERE IS NO `resolved` OR `actioned` FIELD. A detection
   does not close itself. What became of it lives on the records
   downstream — the proposal that cites it, the approval that
   decided it — and a status flag here would be a second home for
   that, drifting the first time somebody forgot to set it.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import {
  REGULATORY_CHANGE_KINDS, MATERIALITY_LEVELS, MATERIALITY_RANK,
  AUTONOMY_CLASSES, AUTONOMY_RANK, LEGAL_ENTITY_KINDS,
} from '../types.mjs';

/** Kinds that assert an act reached a state. Each one says something
 *  a reader may act on, and each owes a status on both sides. */
const STATUS_ARRIVING = ['ENTERED_INTO_FORCE', 'APPLICABLE', 'REPEALED', 'ANNULLED', 'AMENDED', 'CORRECTED'];

/** Kinds for which there is, by construction, nothing on the old
 *  side. `NEW` is the corpus having no record at all. */
const NO_OLD_SIDE = ['NEW'];

export const RegulatoryChange = defineContract({
  name: 'RegulatoryChange',
  kind: 'finding',
  id_field: 'change_id',
  doc: 'One detected divergence between what the canonical datasets assert and what a retrieved document says — classified, with both values in their own terms, what it costs a reader, and everything it touches. A finding about the world, never an edit to the corpus.',
  fields: {
    change_id: F.id('This detection\'s id.'),
    change_kind: F.enum(REGULATORY_CHANGE_KINDS, 'Which of the fourteen kinds this is. Reached from a table in agent/detector/classify.mjs rather than a cascade of conditions, so the transitions the detector claims to know are readable and the ones it does not are blanks rather than a default.', { epistemic: 'inference' }),
    attribute: F.string('The field that moved, in the canonical record\'s own terms — "legislative_status", "date", "action_status", "url". Null where the change is about the record\'s existence rather than one of its fields.', { nullable: true }),

    /* ---- the two sides, each in its own words ---- */

    old_value: F.string('What the corpus currently asserts, verbatim from the canonical record. Null only where there is nothing on that side — a NEW record, or a field the corpus does not carry.', { nullable: true, unknownable: true, epistemic: 'factual' }),
    new_value: F.string('What the retrieved document states, exactly as it prints it. Never normalised to match the old side: deciding that "1 August 2024" and "2024-08-01" are the same thing is a reading, not a fact.', { nullable: true, unknownable: true, epistemic: 'factual' }),

    /* ---- where the previous position came from ---- */

    source_snapshot: F.object({
      previous_verification_id: F.id('The earlier VerificationRecord this is compared against, where there is one.', { nullable: true }),
      previous_checksum: F.string('The sha256 the earlier retrieval recorded for the document\'s bytes.', { nullable: true }),
      current_checksum: F.string('The sha256 of the bytes read this time.', { nullable: true }),
      bytes_changed: F.bool('Whether the document itself changed. Null where there is no earlier checksum to compare against — which is an absence, and is never reported as "unchanged".', { nullable: true }),
      note: F.string('What the comparison could and could not establish. This repository stores no document bodies, so a byte difference says THAT a document changed and never WHERE.', { nullable: true }),
    }, 'The previous snapshot of the source, where one exists. Null where this detection compares a document against the corpus rather than against an earlier reading of itself.', { nullable: true, epistemic: 'factual' }),

    /* ---- what it costs, and how sure ---- */

    materiality: F.enum(MATERIALITY_LEVELS, 'What this costs a reader, which is not how large its diff is. A judgement about somebody outside this repository, typed as an inference for that reason.', { epistemic: 'inference' }),
    confidence: F.ratio('0..1, in the detecting agent\'s own terms: how much it is standing on that a change has occurred and is this one. Never a probability that the new value is correct.'),

    /* ---- everything it reaches ---- */

    affected_datasets: F.array(F.string('A repository path — "data/timeline.json".'), 'Every canonical dataset a correction would touch. Empty asserts none, which is itself worth asserting.'),
    affected_pages: F.array(F.string('A page filename — "enforcement.html".'), 'Every page that would render the changed value. DERIVED from the modules each page loads, never listed by hand: a hand-kept list is a second home for the dependency map, and it goes stale the first time a page loads one more dataset.', { epistemic: 'inference' }),
    autonomy_class: F.enum(AUTONOMY_CLASSES, 'What may be done about this without a human. Checked against what the detection actually touches rather than taken at face value — every legal-record entity forces at least review_required, and a red target forces human_only.'),

    detected_at: F.iso('When the detection ran.'),
    as_of: F.string('The date the corpus position was read as being true at. A change report without one cannot be told from a stale change report.'),
    supersedes: F.id('An earlier RegulatoryChange this replaces. Detections are never edited; a later one supersedes.', { nullable: true }),
  },
  forbidden: {
    /* the four that would make this ChangeRecord */
    files: 'That is ChangeRecord\'s field. A regulation entering into force changes no file in this repository, and a contract that held both would stop meaning either.',
    diff_summary: 'Same. This describes a change in the world, not a diff.',
    branch: 'Same. A regulatory change sits on no branch.',
    commit: 'Same.',
    applied_at: 'Same — and nothing here is applied. A detection is a finding; what became of it lives on the proposal that cites it.',

    /* the ones that would make this a proposal */
    proposed_change: 'A detection carries no edit. Detection and amendment are separate acts, and the separation is what keeps an unverified update out of the corpus. Write a DataProposal.',
    operations: 'A detection carries no edit. An operation list here would be a change to the corpus written by whatever noticed the change in the world, with nothing in between. Write a DataProposal.',
    proposed: 'A detection carries no edit. What the corpus should do about a change is a separate judgement on a separate record, behind an approval.',

    /* the ones that would be a second copy */
    resolved: 'A detection does not close itself. What became of it lives on the records downstream, and a status flag here would drift the first time somebody forgot to set it.',
    actioned: 'Same.',
    grade: 'Evidence grades are derived at render time by js/format.js and never stored.',
    tier: 'A source\'s tier is settled on its record in data/sources.json.',
    last_verified: 'last_verified belongs to the dataset record, written when a human applies a change. A detector noticing that something moved is not a re-verification of it.',
    severity: 'There is no severity ladder here. There is materiality — what it costs a reader — and confidence.',
  },
  rules: [
    /* ---- both sides, and what each kind owes ---- */

    (r) => (!NO_OLD_SIDE.includes(r.change_kind) && r.old_value === null && r.new_value === null
      ? [`change_kind is "${r.change_kind}" with neither an old nor a new value: a change with no side to it is not a change`]
      : []),
    (r) => (NO_OLD_SIDE.includes(r.change_kind) && r.old_value !== null
      ? [`change_kind is "NEW" but old_value carries ${JSON.stringify(r.old_value)}: a record the corpus does not have has nothing on the old side`]
      : []),
    (r) => (r.old_value !== null && r.new_value !== null && r.old_value === r.new_value && r.change_kind !== 'UPDATED'
      ? [`old_value and new_value are the same string and change_kind is "${r.change_kind}": if nothing the corpus asserts moved, the kind is UPDATED and the materiality is metadata_only`]
      : []),
    (r) => (STATUS_ARRIVING.includes(r.change_kind) && !r.attribute
      ? [`change_kind is "${r.change_kind}" with a null attribute: say which field of the canonical record this state arrives in`]
      : []),

    /* ---- UPDATED is the kind that must not swallow a real change ---- */

    (r) => (r.change_kind === 'UPDATED' && r.materiality !== 'metadata_only' && r.materiality !== 'none'
      ? [`change_kind is "UPDATED" with materiality "${r.materiality}": UPDATED means the document moved and nothing it asserts did. A document whose assertions changed is one of the other thirteen kinds, and filing it here is how a substantive change becomes invisible`]
      : []),
    (r) => (r.change_kind === 'UPDATED' && r.source_snapshot?.bytes_changed !== true
      ? ['change_kind is "UPDATED" but source_snapshot does not record that the bytes changed: without an earlier checksum to compare against, "the document was updated" is not something this detection established']
      : []),

    /* ---- an absent comparison is never reported as agreement ---- */

    (r) => (r.source_snapshot && r.source_snapshot.bytes_changed === false
      && (!r.source_snapshot.previous_checksum || !r.source_snapshot.current_checksum)
      ? ['source_snapshot says bytes_changed is false with a checksum missing on one side: nothing was compared, and an absence of comparison is not a finding of no change']
      : []),

    /* ---- materiality, and the two things it turns on ---- */

    (r) => (r.materiality === 'none' && r.change_kind !== 'UPDATED'
      ? [`materiality is "none" on a "${r.change_kind}": a change that costs a reader nothing at all is a document moving without moving, which is UPDATED`]
      : []),
    (r) => ((r.epistemic?.inference ?? []).every((e) => e?.field !== 'materiality')
      ? ['materiality is a judgement about what this costs somebody outside this repository, and no epistemic.inference entry states the method it was reached by']
      : []),
    (r) => (MATERIALITY_RANK[r.materiality] >= MATERIALITY_RANK.substantive
      && AUTONOMY_RANK[r.autonomy_class] < AUTONOMY_RANK.review_required
      ? [`materiality is "${r.materiality}" with autonomy_class "${r.autonomy_class}": a change the site would afterwards state differently is not something an agent acts on unattended`]
      : []),

    /* ---- what it touches must actually be named ---- */

    (r) => (MATERIALITY_RANK[r.materiality] >= MATERIALITY_RANK.substantive
      && (r.affected_datasets ?? []).length === 0
      ? [`materiality is "${r.materiality}" but affected_datasets is empty: name the file a correction would touch, or say why a substantive change touches none`]
      : []),
    (r) => (r.affected_datasets ?? [])
      .filter((d) => !/^data\/[a-z-]+\.json$/.test(String(d)))
      .map((d) => `affected_datasets contains "${d}": a canonical dataset is a path under data/ ending in .json`),
    (r) => (r.affected_pages ?? [])
      .filter((p) => !/^[a-z-]+\.html$/.test(String(p)))
      .map((p) => `affected_pages contains "${p}": a page is an .html file at the repository root`),
    (r) => ((r.affected_pages ?? []).length > 0 && (r.affected_datasets ?? []).length === 0
      ? ['affected_pages names pages with no affected_datasets: a page renders a dataset, so a change reaching a page reaches the dataset it renders']
      : []),
    (r) => ((r.affected_entities ?? []).length === 0
      ? ['affected_entities is empty: a detection that is about nothing has detected nothing']
      : []),

    /* ---- a detection stands on a document, or says it does not ---- */

    (r) => ((r.evidence ?? []).length === 0
      ? ['a detection with no evidence: cite the document that shows the change, or an "absent" entry naming what is missing']
      : []),
    (r) => (MATERIALITY_RANK[r.materiality] >= MATERIALITY_RANK.substantive
      && !(r.evidence ?? []).some((e) => e?.kind === 'retrieved_document')
      && (r.epistemic?.unresolved ?? []).length === 0
      ? [`materiality is "${r.materiality}" with no retrieved_document behind it and no open question: "the world has probably moved by now" is not a detection — the candidate is that nobody has looked since a stated date, and that is what the record must say`]
      : []),

    /* ---- the court kinds ---- */

    (r) => (r.change_kind === 'COURT_OUTCOME'
      && !(r.evidence ?? []).some((e) => e?.role === 'primary' || e?.role === 'official')
      && (r.epistemic?.unresolved ?? []).length === 0
      ? ['change_kind is "COURT_OUTCOME" with no primary or official evidence and no open question: a court\'s own record settles what a court decided, and a report of one is not the one']
      : []),

    /* ---- the entity kinds a detection can be about ---- */

    (r) => (r.affected_entities ?? [])
      .filter((e) => e?.kind && !LEGAL_ENTITY_KINDS.includes(e.kind))
      .map((e) => `affected_entities names a "${e.kind}", which is not a legal-record kind: a regulatory change is about the legal record, and a change to a module or a page is a different contract`),
  ],
});
