/* ============================================================
   agent/detector/fields.mjs — which fields carry a fact and which
   carry an argument

   SESSION 10's brief requires FACTUAL IMPACT and EDITORIAL IMPACT to
   be separated, and it attaches a consequence to the separation: a
   factual impact **may** become automatically actionable, an
   editorial impact **must** become a review proposal unless
   governance explicitly permits otherwise. So the split is not a
   label. It decides what an agent is allowed to do.

   THE LINE, IN ONE SENTENCE. A field is FACTUAL where something in
   this repository can prove it wrong, and EDITORIAL where nothing
   can.

   That is not a metaphor about writing style. It is the literal
   division of labour in this repository, and AGENTS.md states the
   second half of it outright:

       "The validators do not read prose. A false statement in
        index.html passes every check in this repository."

   `tools/validate.mjs` resolves every reference, checks every enum
   against `data/taxonomy.json`, and refuses a claim whose evidence
   cannot carry it. It has never read a sentence. So when a date
   moves:

     · `timeline.events[].date`         a validator sees the value.
                                        FACTUAL.
     · `timeline.events[].obligation`   "The full GDPR obligation set
                                        becomes applicable." — a
                                        sentence that may now be
                                        false, and every check in the
                                        repository passes either way.
                                        EDITORIAL.

   THE THREE BUCKETS.

     reference   the value is the id of another record. A validator
                 proves it resolves. Changing what is at the other
                 end does not make this field wrong — the pointer
                 still points.
     value       a date, a number, a boolean, a URL, a closed
                 vocabulary, a proper name, a locator. Machine
                 comparable, so a check can be written against it
                 even where none exists yet.
     prose       authored natural language that ASSERTS something.
                 Nothing in this repository reads it.

   `reference` and `value` are the factual half; `prose` is the
   editorial half.

   WHEN IN DOUBT, PROSE. `docs/AUTONOMY-POLICY.md` says the default
   when unsure is the higher class, and here the higher class is
   editorial: calling prose a value means a sentence that has gone
   false gets no human review, which is the exact failure this split
   exists to prevent. Calling a value prose costs a reviewer a
   minute. The two errors are not symmetrical and this register is
   built to fail in the cheap direction.

   THE REGISTER IS EXHAUSTIVE AGAINST THE LIVE DATA, AND THE SUITE
   ENFORCES THAT. Every field path that appears on any record in
   `data/` must be classified here. A dataset that grows a field
   nobody classified fails `agent/detector/selftest.mjs` rather than
   being silently treated as factual — which is the direction that
   would let a new prose field become automatically actionable.

   PROVENANCE IS ORTHOGONAL AND IS NOT RE-LISTED. `last_verified`,
   `requires_verification`, `verification_note`, `reference_gap` and
   their siblings are the fields a proposal must leave standing;
   `PROVENANCE_FIELDS` in `agent/integrate/canonical.mjs` is their
   one home. They appear in the buckets below because they are also
   values or prose, and `provenanceOf()` reads the existing constant
   rather than copying it.
   ============================================================ */

import { PROVENANCE_FIELDS } from '../integrate/canonical.mjs';

export const FIELD_CLASSES = ['reference', 'value', 'prose'];

/** The factual half. Stated as a derivation of the list above rather
 *  than as a second list, so the two cannot disagree. */
export const FACTUAL_CLASSES = FIELD_CLASSES.filter((c) => c !== 'prose');

/**
 * Field paths, per node kind, that carry authored natural language.
 *
 * Each entry says what the sentence asserts, because "this is prose"
 * is not a reason — the reason is what a reader would be told wrongly
 * if the thing underneath it moved.
 */
export const PROSE_FIELDS = {
  instrument: {
    status_note: 'Explains, in a sentence, what the act\'s legislative status actually means for a reader. A status that moves leaves it describing the previous state.',
    'transposition.state_note': 'Says which Member States are recorded and why the others are not. A transposition state that moves leaves it counting the wrong ones.',
    'dna.sanction_ceiling.note': 'Qualifies the sanction ceiling in words — what the percentage is of, which is the part a fine is actually calculated from.',
    'dna.objective': 'What the act is FOR, in the author\'s words. Four of the eleven DNA dimensions are written as sentences rather than as taxonomy terms, and the comparison grid on instruments.html renders them side by side as though they were comparable categories.',
    'dna.risk_logic': 'What the act treats as the risk, in a sentence. Same dimension grid, same absence of any check.',
    'dna.enforcement_mechanism': 'Who enforces it and how, in a sentence. An enforcement architecture that changes leaves this describing the previous one.',
    'dna.implementation_model': 'How the act reaches a reader — directly applicable, transposed, and so on. Written as prose rather than as a taxonomy term, so nothing reconciles it with the transposition block that answers the same question structurally.',
  },
  relationship: {
    summary: 'States how two acts interact. It is the whole content of the relationship record; the from/to ids only say that they interact at all.',
    verification_note: 'What is still open about this relationship, in words.',
  },
  claim: {
    statement: 'THE assertion. Every consequential sentence on the site exists as one of these, and it is the field a reader is most directly told something by. Nothing in this repository checks whether it is still true.',
    verification_note: 'What has and has not been established about the claim, in words.',
    gap_note: 'What reference is missing and why it matters. The asterisk\'s explanation.',
  },
  source: {
    note: 'What this source is and what it can be used for.',
    resolution_note: 'Why a source could not be resolved, in words.',
  },
  timeline_event: {
    obligation: 'What becomes required on this date, in a sentence. The date is checked by a validator; this is not.',
    required_action: 'What somebody has to DO. The most directly actionable prose in the corpus, and the compliance calendar renders it verbatim.',
    supersedes: 'Despite the name, this field holds a SENTENCE — "Originally 2 August 2027; deferred by the AI Omnibus." — and not the id of the event it replaces. So the one field in data/timeline.json that records that a date MOVED is prose that nothing checks, which is precisely what a DELAYED change has to leave correct. Named here rather than assumed to be a reference.',
    verification_note: 'What is still open about the event, in words.',
  },
  enforcement_action: {
    action: 'What the authority did. A short authored phrase rather than a term from the taxonomy, so nothing checks it against the decision.',
    behavioural_outcome: 'What the entity actually changed afterwards — an assertion about conduct, not a status.',
    'judicial.outcome': 'What the court held, in words. A COURT_OUTCOME change lands here and nothing checks that the sentence still describes the judgment.',
    'appeal.note': 'The state of an appeal in words, including the parts the status vocabulary cannot express.',
    verification_note: 'What is still open about the action, in words.',
  },
  glossary_term: {
    definition: 'What the term means. A definition that tracks a legal threshold goes false when the threshold moves, and the glossary graph renders it unchanged.',
    note: 'A qualification on the definition.',
    verification_note: 'What is still open about the term, in words.',
  },
  applicability_rule: {
    rationale: 'Why the rule fires — the reasoning a reader is shown when the applicability engine answers them. `js/applies.js` renders it verbatim beneath the outcome.',
    exemptions: 'The carve-outs, each a sentence. They narrow an obligation, so a stale one tells a reader they are exempt when they are not.',
    verification_note: 'What is still open about the rule, in words.',
    depends_on: 'Despite the name, this field holds a SENTENCE describing what the rule\'s outcome turns on — not an id. Nothing in the corpus points at it and nothing checks it, so a condition that moves leaves the rule\'s stated dependency describing the previous one. Named here because a field called depends_on reads like a reference and is not.',
  },
  institution: {
    'competences.scope': 'What this body\'s competence actually covers, in words. The competence edge itself is checkable; its scope is not.',
    'competences.note': 'A qualification on the competence.',
  },
  brief_part: {
    title: 'The part\'s headline. An argument in one line.',
    dek: 'The part\'s standfirst — the four or five things it argues, in a sentence.',
  },
  provision: {
    summary: 'What the article requires, in the author\'s words rather than the act\'s. An amendment to the article leaves it describing the previous text.',
    verification_note: 'What is still open about the provision, in words.',
  },
  taxonomy_term: {
    note: 'The disambiguating sentence — what this term means as against the one next to it. `data/taxonomy.json` is the enum authority for every other dataset, so a note that has gone wrong is wrong everywhere the term is used.',
  },
};

/**
 * Field paths that are neither references nor prose: dates, numbers,
 * booleans, URLs, closed vocabularies that are not taxonomy ids,
 * proper names and locators.
 *
 * Listed rather than inferred because the alternative is a
 * heuristic — "a string with spaces is prose" — and a heuristic here
 * decides whether a human sees a change. A list is a decision
 * somebody made and can be argued with.
 */
export const VALUE_FIELDS = {
  instrument: ['id', 'aliases', 'celex', 'short_name', 'full_name', 'status_as_of', 'last_verified',
    'dna', 'transposition', 'dna.sanction_ceiling.fixed_eur', 'dna.sanction_ceiling.pct_global_turnover',
    'transposition.last_verified', 'transposition.requires_verification'],
  relationship: ['id', 'symmetric', 'last_verified', 'requires_verification'],
  claim: ['id', 'published', 'last_verified', 'reference_gap', 'requires_verification', 'sources.locator'],
  source: ['id', 'title', 'publisher_name', 'url', 'language', 'published', 'accessed', 'resolution'],
  timeline_event: ['id', 'date', 'status', 'last_verified', 'requires_verification'],
  enforcement_action: ['id', 'entity', 'opened', 'decision_date', 'fine_eur', 'last_verified', 'requires_verification',
    'judicial', 'judicial.forum', 'judicial.date', 'judicial.case_ref',
    'appeal.lodged_by', 'appeal.forum', 'appeal.lodged_date', 'appeal.case_ref', 'appeal.requires_verification'],
  glossary_term: ['id', 'term', 'legacy_dom_id', 'new_in_this_build', 'last_verified', 'requires_verification'],
  applicability_rule: ['id', 'last_verified', 'requires_verification',
    'conditions.thresholds.cumulative_training_flop_gte',
    'conditions.thresholds.monthly_active_eu_end_users_gte',
    'conditions.thresholds.monthly_active_eu_users_gte',
    'conditions.thresholds.yearly_active_eu_business_users_gte'],
  institution: ['id', 'short_name', 'full_name', 'member_state', 'last_verified', 'competences.exclusive'],
  brief_part: ['id', 'roman', 'kind', 'reading_minutes'],
  provision: ['id', 'number', 'heading', 'requires_verification'],
  taxonomy_term: ['id', 'label'],
};

/**
 * How one field path is classified.
 *
 * `reference` is decided by the graph rather than by a list: a field
 * that produced an edge from this record IS a reference, and asking
 * the graph means the two can never disagree about which fields
 * point at records. Only the remaining two need a register.
 *
 * @param {{kind:string, field:string, isReference:boolean}} q
 * @returns {{class:string, why:string|null, registered:boolean}}
 *   `registered: false` means nothing in this module has an opinion.
 *   It is returned as `prose` — the safer half — and the suite fails
 *   on it, so an unclassified field is caught at development time
 *   rather than becoming an automatically actionable unknown.
 */
export function classifyField({ kind, field, isReference }) {
  if (isReference) {
    return { class: 'reference', why: null, registered: true };
  }
  const prose = PROSE_FIELDS[kind]?.[field];
  if (prose) return { class: 'prose', why: prose, registered: true };
  if ((VALUE_FIELDS[kind] ?? []).includes(field)) {
    return { class: 'value', why: null, registered: true };
  }
  return {
    class: 'prose',
    why: `Nothing in agent/detector/fields.mjs classifies "${kind}.${field}". It is reported as editorial because that is the half that goes to a human: an unclassified field treated as factual could be changed by an agent unattended, and an unclassified field treated as editorial costs a reviewer a minute. agent/detector/selftest.mjs fails on this, so it is a development-time defect rather than a silent one.`,
    registered: false,
  };
}

/** Whether a field is one of the provenance fields a proposal must
 *  leave standing. Reads `PROVENANCE_FIELDS`; this module keeps no
 *  copy of that list. */
export function isProvenanceField(dataset, field) {
  const base = String(field).split('.').pop();
  return (PROVENANCE_FIELDS[dataset] ?? []).includes(base);
}

/**
 * Every distinct field path on a record, with its class.
 *
 * The walk mirrors `graph.mjs`'s: it stops at a nested object that is
 * itself a node, because that object's fields belong to that node.
 *
 * AN ARRAY KEEPS EVERY ONE OF ITS VALUES. `applicability.rules[].
 * exemptions` is a list of sentences, and each of them narrows an
 * obligation independently — reporting only the first would mean a
 * stale carve-out in position two is invisible. `value` is the first
 * for the callers that want one; `values` is all of them, and the
 * prose scan reads `values`.
 *
 * @returns {Array<{field:string, class:string, why:string|null,
 *                  registered:boolean, value:*, values:*[]}>}
 */
export function fieldsOf(record, { kind, isNode = () => false, referenceFields = new Set(), rootId = null } = {}) {
  const out = [];
  const byField = new Map();
  const walk = (v, path) => {
    if (Array.isArray(v)) { v.forEach((x) => walk(x, path)); return; }
    if (v !== null && typeof v === 'object') {
      if (path && typeof v.id === 'string' && v.id !== rootId && isNode(v.id)) {
        push(`${path}.id`, v.id);
        return;
      }
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
      return;
    }
    if (path) push(path, v);
  };
  const push = (field, value) => {
    const existing = byField.get(field);
    if (existing) { existing.values.push(value); return; }
    const entry = { field, value, values: [value], ...classifyField({ kind, field, isReference: referenceFields.has(field) }) };
    byField.set(field, entry);
    out.push(entry);
  };
  walk(record ?? {}, '');
  return out;
}
