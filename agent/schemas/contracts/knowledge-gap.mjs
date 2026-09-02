/* ============================================================
   KnowledgeGap — something the MODEL cannot express, named

   SESSION 11's brief asks what important legal knowledge is missing
   from the current structured representation. That is a different
   question from the one `DataGap` answers, and the two are easy to
   confuse:

     DataGap        a value on a record that exists is unsupported,
                    unresearched or contested. Closed by finding the
                    publication and confirming it says what the
                    record says it says.

     KnowledgeGap   a CONCEPT the corpus needs and does not have a
                    place for — an act nothing models, a competence
                    nobody holds, a relationship two records imply
                    and no record states. Closed by a decision about
                    WHERE the fact would live, and then by the
                    verification work that fills it.

   So this contract carries `recommended_data_location` and DataGap
   does not: naming the home is half the answer, and a gap that
   cannot say where the fact would go has not established that the
   fact is missing rather than filed somewhere else. `what_is_missing`
   is listed as forbidden, pointing at DataGap, because an agent that
   reaches for that word usually wanted the other contract.

   THE LOAD-BEARING RULE IS THE POINT OF THE WHOLE CONTRACT. The
   brief says: do not reward quantity; prioritise meaningful semantic
   gaps. Counting absences is trivial and produces a list nobody
   finishes — this repository already has a census for that, in
   `.agents/skills/data-completeness/scripts/gaps.mjs`, and a second
   copy of its numbers would be the second home the architecture
   exists to prevent. What is NOT trivial is establishing that
   something in the corpus LEANS on the missing thing. So a rule
   here refuses any record whose evidence array carries no
   `dataset_record`: a gap with no corpus record leaning on it is a
   wish, not a finding.

   `candidate_evidence` IS NOT EVIDENCE, and the name is the one
   risk this contract runs. The brief names the field; DataGap
   deliberately calls its own version `candidate_leads` to keep the
   word "evidence" away from it. Both readings are honoured here: the
   field keeps the brief's name, every entry is a structured POINTER
   with a `retrieved` flag, and a rule refuses `retrieved: true` —
   because a document that was actually fetched and read produces a
   VerificationRecord, and a gap standing on one is either closed or
   misfiled. A lead has established nothing, and writing one down
   does not narrow the gap by one word.

   THERE IS NO FIELD FOR THE MISSING VALUE, under any name. The
   forbidden block lists six, with the reason. An agent that has
   worked out what the missing article number probably is has
   fabricated a legal fact (§0.1), and a gap record is the last place
   that should be able to carry one.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import {
  ABSENCE_KINDS, AUTONOMY_CLASSES, CANDIDATE_EVIDENCE_KINDS,
  DEPTH_GAP_KINDS, DEPTH_IMPACT_LEVELS,
} from '../types.mjs';

/** Where a fact could be recommended to live. A repository path, so
 *  the recommendation is checkable by opening the file — and closed,
 *  so a gap cannot recommend a home outside `data/`, which is the
 *  only place a canonical fact goes. */
const DATA_HOMES = [
  'data/instruments.json',
  'data/timeline.json',
  'data/applicability.json',
  'data/institutions.json',
  'data/enforcement.json',
  'data/claims.json',
  'data/sources.json',
  'data/glossary.json',
  'data/taxonomy.json',
  'data/brief.json',
];

const CandidateEvidence = F.object({
  kind: F.enum(CANDIDATE_EVIDENCE_KINDS, 'What sort of pointer this is. "none_identified" is the honest entry where the corpus offers nowhere to look.'),
  where: F.string('Where to look — a record id, a source id, a named register. Null only where the kind is "none_identified".', { nullable: true }),
  what_it_would_establish: F.string('What finding it would settle. A pointer that cannot say what it would establish is not a lead, it is a gesture.'),
  retrieved: F.bool('Always false. A document that was retrieved and read produces a VerificationRecord; a gap standing on one is either closed or misfiled.'),
}, 'Somewhere to look. Not evidence, not a value, and it has established nothing.');

export const KnowledgeGap = defineContract({
  name: 'KnowledgeGap',
  kind: 'finding',
  id_field: 'gap_id',
  doc: 'A concept the structured representation cannot express, with what in the corpus leans on it, where the fact would live, and what it would take to close it. Never a placeholder for the missing value.',
  fields: {
    gap_id: F.id('This gap\'s id.'),
    gap_kind: F.enum(DEPTH_GAP_KINDS, 'Which of the thirteen kinds of depth gap this is. Every kind has a detector, and agent/depth/selftest.mjs fails if one does not.'),
    absence_kind: F.enum(ABSENCE_KINDS, 'Not researched · researched and not publicly determinable · no rule matched. Three states that must never render alike, and never sum together.'),

    missing_concept: F.text('The concept the model cannot express, stated specifically enough that a reader would recognise it if it arrived. Never the value it would carry.'),
    why_it_matters: F.text('What the absence costs, argued from what the corpus itself does with the missing thing — never from how large the count is.'),

    candidate_evidence: F.array(CandidateEvidence, 'Places to look. Deliberately not evidence: nothing here has been retrieved, and nothing here narrows the gap.', { min: 1 }),

    confidence: F.ratio('0..1, in the detecting agent\'s own terms. How much the finding is standing on — never a probability that the missing fact exists.'),

    recommended_data_location: F.object({
      dataset: F.enum(DATA_HOMES, 'Which dataset would hold it. Closed to data/: a canonical fact has no other home.'),
      container: F.string('The array or record inside it — instruments, rules, competences, events.'),
      field: F.string('The field, where the gap is narrower than a whole record. Null where a whole record is missing.', { nullable: true }),
      shape_exists: F.bool('True when the dataset already has this place and the gap is only that it is empty. False when closing the gap needs a schema change, which is structural work and never Class B.'),
      why_here: F.string('Why this home and not another. One home per fact: a recommendation that would create a second copy is not a recommendation.'),
    }, 'Where the missing fact would live. Naming the home is half the answer; a gap that cannot name one has not shown the fact is missing rather than filed elsewhere.'),

    impact: F.enum(DEPTH_IMPACT_LEVELS, 'What the absence costs a reader, on the ladder in types.mjs. Not a severity score, and never derived from how many records share the finding.'),

    autonomy_class: F.enum(AUTONOMY_CLASSES, 'What may be done about it. Never "autonomous": closing a knowledge gap means writing a legal fact.'),

    as_of: F.iso('The date the corpus was read as true at. A depth report without one cannot be told from a stale depth report (docs/AUDIT-2026-09-01.md F-15).'),
  },
  forbidden: {
    what_is_missing: 'This contract\'s word is missing_concept. And if what is missing is the SOURCE for a value that already exists on a record, the contract you want is DataGap, which is about evidence where this one is about representation.',
    missing_value: 'There is no field for the missing value. Working out what the absent article number, date or figure probably is fabricates a legal fact (AI-SAFE-BOUNDARIES §0.1), and a gap record is the last place that should be able to carry one.',
    substitute: 'A gap is closed by finding the fact, never by attaching a plausible stand-in (§0.2).',
    best_guess: 'Same. A guess in a gap record is the substitute under another name.',
    assumed_value: 'Same.',
    plausible_value: 'Same.',
    likely_answer: 'Same.',
    default_value: 'An absence has no default. null and unknown are states, not fallbacks.',
    proposed_change: 'A gap is a question, not a proposal. The answer is a DataProposal behind an ApprovalRequest, and the Data Depth Agent writes neither.',
    severity_score: 'The impact ladder is the whole of the weighing. A number invites ranking one instrument\'s missing competence above another\'s by arithmetic nobody can check.',
    occurrences: 'A count of how many records share a finding is exactly the quantity this contract refuses to reward. Where several records share a gap, the run reports the suppression; the record states the one gap.',
  },
  rules: [
    /* The load-bearing rule. Do not reward quantity: a gap is
       reported because something in the corpus leans on the missing
       thing, and the thing leaning on it is a record. */
    (r) => ((r.evidence ?? []).some((e) => e.kind === 'dataset_record')
      ? []
      : ['evidence carries no dataset_record: a knowledge gap with no corpus record leaning on the missing concept is a wish, not a finding. Name what depends on it.']),

    (r) => ((r.epistemic?.unresolved ?? []).length === 0
      ? ['epistemic.unresolved is empty: a gap with no open question is not a gap']
      : []),

    /* Closing one of these means writing a legal fact into data/,
       which is amber at best (§2) and red wherever it is a status, a
       date, an article number, a competence or a figure (§3). There
       is no reading on which it is green. */
    (r) => (r.autonomy_class === 'autonomous'
      ? ['autonomy_class is "autonomous": closing a knowledge gap means writing a legal fact into data/, which is never green (AI-SAFE-BOUNDARIES §2 and §3)']
      : []),

    /* A schema change is structural work, and docs/AGENT-ROLES.md §4
       is explicit that structural change is never Class B. */
    (r) => (r.recommended_data_location?.shape_exists === false && r.autonomy_class !== 'human_only'
      ? ['recommended_data_location.shape_exists is false but autonomy_class is not "human_only": closing this needs a schema change, and structural change is never Class B (docs/AGENT-ROLES.md §4)']
      : []),

    (r) => (r.gap_kind === 'stale_record' && r.absence_kind === 'no_rule_matched'
      ? ['gap_kind is "stale_record" but absence_kind is "no_rule_matched": staleness is a question about when somebody looked, not about whether a rule fired']
      : []),

    /* §0.5, in the one place it could be got wrong: a detector that
       found no rule covering a case must not file it as researched. */
    (r) => (r.absence_kind === 'no_rule_matched' && r.impact !== 'reader_could_be_misled'
      ? ['absence_kind is "no_rule_matched" but impact is not "reader_could_be_misled": where no rule fires the answer is NOT DETERMINED, and a reader who meets that as a negative finding is the failure this project names as its most damaging (AI-SAFE-BOUNDARIES §0.5)']
      : []),

    (r) => ((r.candidate_evidence ?? []).some((c) => c.retrieved === true)
      ? ['candidate_evidence carries an entry marked retrieved: a document that was fetched and read produces a VerificationRecord, and a gap standing on one is either closed or misfiled']
      : []),

    (r) => (r.candidate_evidence ?? []).flatMap((c, i) => (
      c.kind !== 'none_identified' && (c.where === null || c.where === undefined)
        ? [`candidate_evidence[${i}]: kind is "${c.kind}" but there is nowhere to look. Use "none_identified" rather than an empty pointer — an empty lead reads as coverage.`]
        : []
    )),

    (r) => ((r.candidate_evidence ?? []).length > 1 && (r.candidate_evidence ?? []).some((c) => c.kind === 'none_identified')
      ? ['candidate_evidence mixes "none_identified" with real leads: either there is somewhere to look or there is not, and a list that says both cannot be acted on']
      : []),
  ],
});
