/* ============================================================
   ImpactAssessment — what one confirmed change reaches inside this
   website, and which half of it a machine may act on

   ---------------------------------------------------------------
   WHY THIS IS NOT MORE FIELDS ON `RegulatoryChange`.

   Three reasons, and the third is the one that decided it.

   1 · DIFFERENT SUBJECT. A `RegulatoryChange` is a finding about the
       WORLD — a regulator moved a date, a court annulled a decision.
       An `ImpactAssessment` is a finding about THIS REPOSITORY: what
       renders that value, what prose restates it, what nobody has to
       touch. They answer to different evidence and they go stale on
       different clocks.

   2 · DIFFERENT LIFETIME. `RegulatoryChange` says detections are
       never edited and a later one supersedes. But the impact of a
       change moves whenever the SITE moves: add a view on Tuesday
       and Monday's change reaches one more page, with nothing about
       the change itself having altered. Folding the reach into the
       detection would make an immutable record's content depend on
       code that is still being written.

   3 · DIFFERENT AUTHORITY. This record is the one that says what may
       be done without a human. That decision has to be a record of
       its own so it can be argued with, superseded and audited on
       its own terms — not a field on a finding that is about
       something else.

   IT REFERENCES THE CHANGE RATHER THAN RESTATING IT. `change_id` and
   nothing more: no `change_kind`, no `old_value`, no `materiality`,
   no `affected_pages`. Those are the detection's, and a second copy
   here would be the drift this architecture exists to prevent. The
   four are `forbidden` below by name.

   `affected_datasets` IS ON BOTH, AND MEANS DIFFERENT THINGS. On
   `RegulatoryChange` it is "the file a correction would touch" —
   where the fact lives, derived from the entity's kind. Here
   `datasets_reached` is "the files that carry something depending on
   it", which is a strictly wider and separately derived answer: a
   date in `data/timeline.json` is depended on by rules in
   `data/applicability.json` that a correction never touches. The two
   are named differently for that reason, and the field doc says so.

   ---------------------------------------------------------------
   THE SPLIT THE BRIEF REQUIRES, AND THE CONSEQUENCE IT CARRIES.

       A factual impact MAY become automatically actionable.
       An editorial impact MUST become a review proposal unless
       governance explicitly permits otherwise.

   So `automatically_actionable` is a field a contract rule polices
   rather than a note. An editorial impact carrying it must name the
   `governance_permit` that allows it, and a provenance field may
   never carry it at all — `AI-SAFE-BOUNDARIES` §3 makes that red
   tier whatever else is true.

   AND WHAT "AUTOMATICALLY ACTIONABLE" MEANS HERE IS USUALLY "THERE
   IS NOTHING TO DO". This site derives at render time, so most
   factual reach needs no edit anywhere once the changed record is
   corrected. That is a real answer and the most useful one this
   record produces: it is the difference between a reviewer checking
   seven views and a reviewer checking one sentence.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { AUTONOMY_CLASSES } from '../types.mjs';

/** The nine surfaces SESSION 10's brief names, plus `other` for the
 *  site's surfaces that are none of the nine. `other` exists so that
 *  the enforcement table is never reported as the compliance
 *  calendar because the calendar was the nearest of the nine. */
export const IMPACT_SURFACES = [
  'dataset', 'instrument', 'timeline', 'compliance_calendar', 'comparison',
  'applicability', 'evidence', 'glossary', 'analytical_page', 'other',
];

/** Where an impact goes. `propagates_by_derivation` is not a weaker
 *  `review_proposal` — it is the finding that nothing needs doing,
 *  and it is only available where the site recomputes the value. */
export const IMPACT_ROUTES = ['propagates_by_derivation', 'review_proposal', 'human_only'];

/** How a field can carry a dependency. The first two are the factual
 *  half, the third the editorial half. `fields.mjs` owns the line;
 *  this is its vocabulary. */
export const FIELD_CLASSES = ['reference', 'value', 'prose'];

const Impact = F.object({
  node_id: F.string('The canonical record this impact is on.'),
  kind: F.string('Its entity kind, in the vocabulary of LEGAL_ENTITY_KINDS.'),
  dataset: F.string('The file it lives in.'),
  field: F.string('The field that carries the dependency.'),
  field_class: F.enum(FIELD_CLASSES, 'reference and value are factual — something in this repository can prove them wrong. prose is editorial: nothing here reads it.'),
  depth: F.int('Hops from the changed record. 0 is the changed record itself, whose own prose is the likeliest place a stale sentence is.'),
  route: F.enum(IMPACT_ROUTES, 'Where this goes.'),
  automatically_actionable: F.bool('Whether an agent may act on this without a human. False is the answer for every editorial impact absent a named governance permit.'),
  why: F.string('Why it routes there. A route without a reason is a permission nobody can argue with.'),
  quote: F.text('For an editorial impact: the sentence, with the old value in it, so a reviewer can check the finding rather than take it. Null where the impact is factual or where nothing quotable was found.', { nullable: true }),
  governance_permit: F.string('The document and scope permitting an editorial impact to be actioned. Null, which is what every entry carries today.', { nullable: true }),
}, 'One field of one record that depends on the change.');

export const ImpactAssessment = defineContract({
  name: 'ImpactAssessment',
  kind: 'finding',
  id_field: 'assessment_id',
  doc: 'What one confirmed RegulatoryChange reaches inside this website — dataset, instrument, timeline, compliance calendar, comparison views, applicability logic, evidence displays, glossary relationships and potentially stale analytical pages — with the factual half separated from the editorial half and each routed. A finding about the site, never an edit to it.',
  fields: {
    assessment_id: F.id('This assessment\'s id.'),
    change_id: F.id('The RegulatoryChange this assesses. The detection\'s own fields are not restated here; read them there.'),

    /* ---- how far it looked, and what it could not see ---- */

    depth: F.int('How many hops out from the changed record the graph was walked. Stated because it bounds the answer: everything further away is outside this map by construction, not absent from the site.'),
    roots: F.array(F.string('A canonical record id.'), 'The changed records the walk started from.'),
    unresolved_roots: F.array(F.string('A record id.'), 'Entities the change names that are not records in data/ — a NEW instrument is the expected case. Nothing downstream of them could be walked, and this map is silent about them rather than empty about them.'),

    /* ---- the reach ---- */

    datasets_reached: F.array(F.string('A repository path.'), 'Every dataset carrying a record that depends on the change. WIDER than the detection\'s affected_datasets, which names where the changed fact LIVES: a date in data/timeline.json is depended on by rules in data/applicability.json that a correction never touches.', { epistemic: 'inference' }),
    surfaces: F.array(F.object({
      surface: F.enum(IMPACT_SURFACES, 'Which of the nine, or "other".'),
      label: F.string('The site\'s own name for it, where "other" needs one.', { nullable: true }),
      records: F.array(F.string('A record id.'), 'Canonical records on this surface that the change reaches.'),
      modules: F.array(F.string('A module path — "js/calendar.js".'), 'The view modules that render them.'),
      pages: F.array(F.string('A page filename.'), 'The pages those modules run on.'),
      note: F.string('What this surface is and what reaching it does and does not establish.', { nullable: true }),
    }, 'One surface of the site.'), 'The nine surfaces the brief names, and the site\'s others under their own name. DERIVED: which module renders which entity kind is read from the index keys and db reads in js/, never from a list kept by hand.', { epistemic: 'inference' }),

    /* ---- the split, and what it permits ---- */

    factual: F.array(Impact, 'Impacts on fields something in this repository can prove wrong: references and typed values. These MAY be automatically actionable — and usually the action is none, because the site derives at render time.'),
    editorial: F.array(Impact, 'Impacts on authored prose, each EVIDENCED by the old value appearing in the sentence. Nothing in this repository reads prose, so every one of these becomes a review proposal absent a named governance permit.'),
    open_questions: F.array(F.object({
      node_id: F.string('The record.'),
      field: F.string('The prose field.'),
      question: F.string('What is not known about it.'),
      missing: F.string('What would answer it.'),
    }, 'A prose field that may be stale and cannot be shown to be.'), 'Prose on or beside the changed record where the old value does NOT appear. Reported apart from the editorial findings, because "not quotable" is not "checked and clear" — and folding the two together is how a real finding stops being read.'),

    counts: F.object({
      reached_records: F.int('Records the walk reached.'),
      factual_impacts: F.int('Entries in factual.'),
      editorial_impacts: F.int('Entries in editorial.'),
      open_questions: F.int('Entries in open_questions.'),
      automatically_actionable: F.int('How many of both may be acted on without a human.'),
      review_proposals_required: F.int('How many must go to a human as a proposal.'),
    }, 'The tallies, so a reviewer can see the shape before reading the entries.'),

    autonomy_class: F.enum(AUTONOMY_CLASSES, 'The class this assessment as a whole sits at — the highest any single impact requires. Never lower than the change it assesses.'),
    assessed_at: F.iso('When the assessment ran.'),
    caveats: F.array(F.string('One caveat.'), 'What this map does not cover, in its own words: unresolved entry modules, wildcard-only edges, the depth bound, the __CONTENT__ bypass. A map that omits its blind spots reads as coverage.'),
  },
  forbidden: {
    /* the detection's own fields — reference it, do not restate it */
    change_kind: 'That is RegulatoryChange\'s field. This record references the detection by change_id; a second copy of what kind of change it was would drift from the first.',
    old_value: 'Same. The value that moved belongs to the detection. Where a quote here contains it, it is quoted from the site\'s prose, not restated as a field.',
    new_value: 'Same. The value the document states belongs to the detection, and a copy here would be a second home for the thing the detection exists to record.',
    materiality: 'Same — and materiality is what a change costs a READER. This record is about what it costs the SITE, which is a different question with a different answer.',
    affected_pages: 'That is RegulatoryChange\'s field, and it means "pages that render the changed value". The pages here are per surface and mean "pages whose view of this surface is reached", which is wider. Two fields with one name would be read as one fact.',

    /* the ones that would make this a proposal or an edit */
    proposed_change: 'An assessment carries no edit. It says what a change reaches and what may be done about it; the doing is a DataProposal behind an ApprovalRequest.',
    operations: 'Same. An operation list here would let whatever mapped the impact also write the fix, with nothing in between.',
    applied_at: 'Nothing here is applied.',
    resolved: 'An assessment does not close itself. What became of it lives on the records downstream.',
  },
  rules: [
    /* ---- the split's consequence, as a shape ---- */

    (r) => (r.editorial ?? [])
      .filter((i) => i.automatically_actionable === true && !i.governance_permit)
      .map((i) => `editorial impact on ${i.node_id}.${i.field} is marked automatically_actionable with no governance_permit: the brief is that an editorial impact becomes a review proposal UNLESS governance explicitly permits otherwise, so the permit has to be named. Nothing in docs/ names one`),

    (r) => (r.editorial ?? [])
      .filter((i) => i.field_class !== 'prose')
      .map((i) => `${i.node_id}.${i.field} is in editorial with field_class "${i.field_class}": editorial means prose — a field nothing in this repository can read. A reference or a value belongs in factual`),

    (r) => (r.factual ?? [])
      .filter((i) => i.field_class === 'prose')
      .map((i) => `${i.node_id}.${i.field} is in factual with field_class "prose": nothing here reads prose, so nothing here can prove a change to it right`),

    (r) => [...(r.factual ?? []), ...(r.editorial ?? [])]
      .filter((i) => i.route === 'human_only' && i.automatically_actionable === true)
      .map((i) => `${i.node_id}.${i.field} routes human_only and is marked automatically_actionable: human_only is the class for a target an agent may not touch at all`),

    (r) => (r.editorial ?? [])
      .filter((i) => i.route === 'propagates_by_derivation')
      .map((i) => `editorial impact on ${i.node_id}.${i.field} routes propagates_by_derivation: a sentence is not recomputed when a page is opened. That route is for a value the site derives, and prose is the half it does not`),

    /* ---- an evidenced editorial finding, or an open question ---- */

    (r) => (r.editorial ?? [])
      .filter((i) => !i.quote)
      .map((i) => `editorial impact on ${i.node_id}.${i.field} carries no quote: a prose field is reported as stale only where the old value can be found in the sentence. Without one it is an open question, and open_questions is where it goes`),

    /* ---- the tallies must match what is actually here ---- */

    (r) => (r.counts?.factual_impacts !== (r.factual ?? []).length
      ? [`counts.factual_impacts is ${r.counts?.factual_impacts} and factual holds ${(r.factual ?? []).length}`] : []),
    (r) => (r.counts?.editorial_impacts !== (r.editorial ?? []).length
      ? [`counts.editorial_impacts is ${r.counts?.editorial_impacts} and editorial holds ${(r.editorial ?? []).length}`] : []),
    (r) => (r.counts?.open_questions !== (r.open_questions ?? []).length
      ? [`counts.open_questions is ${r.counts?.open_questions} and open_questions holds ${(r.open_questions ?? []).length}`] : []),
    (r) => {
      const actual = [...(r.factual ?? []), ...(r.editorial ?? [])].filter((i) => i.automatically_actionable === true).length;
      return r.counts?.automatically_actionable !== actual
        ? [`counts.automatically_actionable is ${r.counts?.automatically_actionable} and ${actual} impact(s) carry the flag: this is the number that says what an agent may do unattended, and it is not one to let drift`]
        : [];
    },

    /* ---- the reach must be named where it is claimed ---- */

    (r) => ((r.surfaces ?? []).length === 0 && (r.roots ?? []).length > 0
      ? ['roots names records that were walked and surfaces is empty: a change that reaches no surface of the site is a finding worth stating explicitly, and an empty array states nothing']
      : []),
    (r) => (r.datasets_reached ?? [])
      .filter((d) => !/^data\/[a-z-]+\.json$/.test(String(d)))
      .map((d) => `datasets_reached contains "${d}": a canonical dataset is a path under data/ ending in .json`),
    (r) => (r.surfaces ?? [])
      .flatMap((s) => (s.pages ?? []).filter((p) => !/^[a-z-]+\.html$/.test(String(p)))
        .map((p) => `surface "${s.surface}" names page "${p}": a page is an .html file at the repository root`)),
    (r) => (r.surfaces ?? [])
      .flatMap((s) => (s.modules ?? []).filter((m) => !/^js\/[a-z-]+\.js$/.test(String(m)))
        .map((m) => `surface "${s.surface}" names module "${m}": a view module is a path under js/ ending in .js`)),

    /* ---- what it could not see must be said ---- */

    (r) => ((r.caveats ?? []).length === 0
      ? ['caveats is empty: this map is bounded by a walk depth, by static imports only, and by the __CONTENT__ bypass at minimum. A map that omits its blind spots reads as coverage']
      : []),
    (r) => ((r.unresolved_roots ?? []).length > 0
      && !(r.caveats ?? []).some((c) => (r.unresolved_roots ?? []).some((u) => String(c).includes(u)))
      ? ['unresolved_roots names entities the walk could not start from and no caveat mentions them: an entity that could not be walked is a silence in this map, not an absence of impact']
      : []),

    /* ---- it stands on the detection ---- */

    (r) => ((r.evidence ?? []).length === 0
      ? ['an assessment with no evidence: cite the detection and the corpus it was mapped against']
      : []),
    (r) => ((r.affected_entities ?? []).length === 0
      ? ['affected_entities is empty: an assessment that is about nothing has assessed nothing']
      : []),
  ],
});
