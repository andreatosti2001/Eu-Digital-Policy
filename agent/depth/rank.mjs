/* ============================================================
   agent/depth/rank.mjs — what may be done about a gap, and how much
   the finding is standing on

   Two fields the contract requires and no detector should be
   deciding for itself: `autonomy_class` and `confidence`. Both are
   TABLES here rather than conditions inside a detector, for the
   reason `agent/detector/classify.mjs` gives for the transition
   table: a reviewer can read every case the code claims to know
   about, and the cases it does not know about are visible as blanks
   rather than falling through to a default.

   AUTONOMY IS ABOUT WHAT CLOSING THE GAP WOULD TAKE, not about how
   confident the detector is. Writing an article number, a date, a
   competence, a status or a fine into `data/` is authoring a legal
   fact — red tier under AI-SAFE-BOUNDARIES §3, and human_only
   whatever an agent thinks of its own evidence. Adding a
   relationship between two acts the corpus already models, or a
   glossary term explaining a record that already exists, is amber:
   an agent may prepare the proposal and a human approves it. Nothing
   here is ever green, and the contract refuses `autonomous` outright
   rather than trusting this table to be complete.

   THE ESCALATION IS ONE-WAY. Where the recommended home does not yet
   exist in the schema, closing the gap is structural work, and
   `docs/AGENT-ROLES.md` §4 is explicit that structural change is
   never Class B. So a `review_required` finding whose home needs a
   schema change is escalated to `human_only` here, and the contract
   asserts the same thing independently — belt and braces, because
   this is the field that decides whether a human ever sees it.

   CONFIDENCE IS NOT A PROBABILITY THAT THE MISSING FACT EXISTS. It
   is how much the FINDING is standing on: whether the absence was
   established by a lookup that cannot be wrong about the corpus, or
   by matching a pattern against a string somebody wrote. The second
   is worth less and says so. Neither is affected by how much the gap
   matters — that is `impact`, argued in words, and the two are kept
   apart deliberately: a certain finding about a trivial absence and
   a shaky finding about a grave one are different things, and a
   single number would blend them into something that is neither.
   ============================================================ */

import { AUTONOMY_RANK, DEPTH_GAP_KINDS } from '../schemas/types.mjs';

/**
 * What closing a gap of this kind would take, and therefore who may
 * do it. One row per kind, each with the reason on it.
 */
export const AUTONOMY_FOR_KIND = {
  missing_instrument: ['human_only', 'Creating an instrument record means authoring a CELEX number, a kind, a legislative status and a scope class — every one of them a legal fact under AI-SAFE-BOUNDARIES §3.'],
  missing_provision: ['human_only', 'An article number and heading are legal facts. §3 names them explicitly, and four provision records already in the corpus carry a note saying they were recorded from general knowledge and must be confirmed before display.'],
  incomplete_timeline: ['human_only', 'A date on which an obligation begins is the value a reader is most likely to act on, and §3 names dates among the facts an agent may not author.'],
  incomplete_applicability: ['human_only', 'An applicability rule states the conditions under which an act binds a reader. Writing one is stating what the law requires of them.'],
  missing_institution: ['human_only', 'Naming the authority that took a decision is a legal fact about who exercised a power.'],
  missing_competence: ['human_only', 'Competence is named by §3 among the facts an agent may not author, and the four competence edges already in the corpus that carry a requires-verification note are why.'],
  incomplete_enforcement: ['human_only', 'A fine, an action status, a payment status and an appeal state are all legal facts under §3.'],
  unsupported_claim: ['human_only', 'Closing this means attaching a source to a statement of law, which §3 permits only from a document actually retrieved and read — and no agent in this repository has ever retrieved one.'],
  missing_source_relationship: ['review_required', 'Recording that two source records are one document is a statement about the bibliography rather than about EU law. It is still amber: it changes what the site is said to have corroborated, and evidence grades are computed from source references.'],
  missing_instrument_relationship: ['review_required', 'Both acts are already modelled and both are already cited by the claims that would justify the record. Characterising HOW they meet — overlap, conflict, carve-out — is a legal reading, which is why a human approves it rather than an agent committing it.'],
  missing_glossary_concept: ['review_required', 'A glossary term explains a record that already exists. Writing the definition is editorial work on the site\'s own words, which §2 permits an agent to prepare and a human to approve.'],
  missing_subordinate_instrument: ['human_only', 'A delegated or implementing act arrives with a CELEX, a parent, a kind and dates — legal facts, every one.'],
  stale_record: ['human_only', 'This is a decision about what last_verified means across every dataset, which is a schema decision with the widest reach in the corpus. It is not an agent\'s to take.'],
};

/**
 * How much a finding of this kind is standing on, and why.
 *
 * The split is between an absence established by LOOKING SOMETHING
 * UP — a Map that has no entry, an array that is empty — and one
 * established by MATCHING A PATTERN against a string somebody wrote.
 * The first cannot be wrong about the corpus. The second can: a
 * title is prose, and two documents can share one.
 */
export const CONFIDENCE_FOR_KIND = {
  missing_instrument: [0.7, 'The absence of an instrument record is a lookup and cannot be wrong. What is inferred is that the cited document is the text of an act nothing models, and that rests on the source\'s recorded type rather than on reading the document.'],
  missing_provision: [0.9, 'An empty provisions[] is read directly off the record. Nothing is inferred except that the records reaching for an article are reaching for one.'],
  incomplete_timeline: [0.9, 'Both halves are lookups: the status the instrument records, and the event types its own timeline events carry.'],
  incomplete_applicability: [0.9, 'An empty obligations[], or no rule naming the instrument, is read directly off the dataset.'],
  missing_institution: [0.9, 'A wildcard authority id is read directly off the enforcement record, against the suffix convention the institutions dataset\'s own $note defines.'],
  missing_competence: [0.9, 'Competence edges are indexed from the one dataset that holds them, and the absence is a lookup. The sanction ceiling is read off the instrument\'s own DNA.'],
  incomplete_enforcement: [0.9, 'Both an empty result for an instrument and an unknown payment axis are read directly off the dataset.'],
  unsupported_claim: [0.9, 'The claim type and the sources array are read off the record, using the same self-citation exclusion js/format.js applies before grading.'],
  missing_source_relationship: [0.6, 'Two records sharing a recorded title is evidence they are one document and is not proof: titles are prose, two publications can carry one title, and no URL in this repository has ever been fetched to check.'],
  missing_instrument_relationship: [0.8, 'Co-citation is counted off the claims\' own instruments[]. What is inferred is that repeated co-citation means the corpus has a relationship in mind, which is a reading of why the claims name both.'],
  missing_glossary_concept: [0.8, 'Reference counts and glossary coverage are both lookups. What is inferred is that the glossary\'s own lowest-covered concept sets a standard, which is an argument rather than a measurement.'],
  missing_subordinate_instrument: [0.7, 'The absence of an instrument record is a lookup. That the document is a delegated or implementing act rests on matching a pattern against the title the corpus recorded, narrowed to records the corpus itself typed as legislation.'],
  stale_record: [0.9, 'The compilation-date reading is computed by agent/integrate/canonical.mjs from the spread of dates below each $last_verified and is borrowed rather than repeated. That the field cannot answer a per-record question follows from it directly.'],
};

/* Fail at load rather than at run time: a kind with no row would get
   an undefined class, and an undefined autonomy class on a finding
   about a production site is the one default that must not exist. */
for (const k of DEPTH_GAP_KINDS) {
  if (!AUTONOMY_FOR_KIND[k]) throw new Error(`rank.mjs: no autonomy row for depth gap kind "${k}"`);
  if (!CONFIDENCE_FOR_KIND[k]) throw new Error(`rank.mjs: no confidence row for depth gap kind "${k}"`);
}
for (const k of Object.keys(AUTONOMY_FOR_KIND)) {
  if (!DEPTH_GAP_KINDS.includes(k)) throw new Error(`rank.mjs: autonomy row for unknown kind "${k}"`);
}

/**
 * The class for one finding, with the escalation applied.
 *
 * @returns {{autonomy_class:string, why:string, escalated:boolean}}
 */
export function autonomyFor(finding) {
  const [base, why] = AUTONOMY_FOR_KIND[finding.gap_kind];
  if (finding.location?.shape_exists === false && AUTONOMY_RANK[base] < AUTONOMY_RANK.human_only) {
    return {
      autonomy_class: 'human_only',
      escalated: true,
      why: `${why} Escalated from ${base}: the recommended home does not exist in the schema yet, and structural change is never Class B (docs/AGENT-ROLES.md §4).`,
    };
  }
  return { autonomy_class: base, escalated: false, why };
}

/**
 * The confidence for one finding, with its basis.
 *
 * @returns {{confidence:number, basis:string}}
 */
export function confidenceFor(finding) {
  const [confidence, basis] = CONFIDENCE_FOR_KIND[finding.gap_kind];
  return { confidence, basis };
}

/**
 * Order a whole run's findings for presentation.
 *
 * Impact first, then how much of the corpus leans on it, then the
 * subject so an unchanged corpus produces an unchanged order. Impact
 * leads because a reviewer with time for five findings should meet
 * the five that could mislead a reader, not the five with the most
 * references.
 */
export function order(gaps, rankOf) {
  return [...gaps].sort((a, b) => (
    (rankOf(b.impact) - rankOf(a.impact))
    || ((b.weight ?? 0) - (a.weight ?? 0))
    || String(a.subject).localeCompare(String(b.subject))
  ));
}
