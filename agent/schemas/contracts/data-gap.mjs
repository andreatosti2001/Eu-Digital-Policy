/* ============================================================
   DataGap — something the corpus cannot support, named

   This is the contract that carries the project's second absolute
   prohibition into machine form: a gap is closed by finding the
   publication the brief was pointing at and confirming it says what
   the brief says it says — never by attaching something related. A
   loose substitute is worse than an admitted gap because it looks
   resolved.

   So this contract has no field for a substitute. Not a
   `best_guess`, not an `assumed_value`, not a `plausible_value`;
   the shapes are closed and those names are listed as forbidden
   with the reason, so an agent that tries gets told why rather than
   "unknown field". `candidate_leads` exists and is explicitly not
   evidence: a lead is somewhere to look, and writing one down does
   not narrow the gap by one word.

   `absence_kind` is the field that keeps three states apart which
   every other system collapses: nobody looked · somebody looked and
   it is not publicly determinable · no rule covers the case, so the
   answer is NOT DETERMINED and never "probably not".
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { ABSENCE_KINDS, GAP_KINDS, GAP_STATES } from '../types.mjs';

export const DataGap = defineContract({
  name: 'DataGap',
  kind: 'finding',
  id_field: 'gap_id',
  doc: 'A named absence in the corpus: what is missing, which kind of absence it is, and exactly what would close it. Never a placeholder for a value.',
  fields: {
    gap_id: F.id('This gap\'s id.'),
    gap_kind: F.enum(GAP_KINDS, 'What sort of absence this is.'),
    absence_kind: F.enum(ABSENCE_KINDS, 'Not researched · researched and not publicly determinable · no rule matched. Three different states that must never render alike.'),
    what_is_missing: F.text('Exactly what is absent, in terms specific enough that finding it would be recognisable.'),
    why_open: F.text('Why it cannot be closed now — not looked yet, not published, sources disagree, outside the corpus.'),
    closes_with: F.text('What would close it: the publication to find, the confirmation to obtain, the decision to be taken. "More research" is not an answer.'),
    candidate_leads: F.array(F.string('Somewhere to look. Not evidence, and not a value.'), 'Places to look. Deliberately not evidence: a lead has established nothing.'),
    blocking: F.bool('True when work downstream must stop until this is closed.'),
    first_seen_at: F.iso('When the gap was first recorded.'),
    last_reviewed_at: F.iso('When it was last looked at again.', { nullable: true }),
    state: F.enum(GAP_STATES, 'Open · closed by a verification · declared unknown · withdrawn.'),
    closed_by: F.id('The VerificationRecord that closed it. Required when the state says it is closed.', { nullable: true }),
  },
  forbidden: {
    substitute: 'There is no field for a substitute. A gap is closed by finding the source, never by attaching a plausible stand-in (AI-SAFE-BOUNDARIES §0.2).',
    best_guess: 'Same. A guess in a gap record is the substitute under another name.',
    assumed_value: 'Same.',
    plausible_value: 'Same.',
    likely_answer: 'Same.',
    default_value: 'An absence has no default. null and unknown are states, not fallbacks.',
  },
  rules: [
    (r) => ((r.epistemic?.unresolved ?? []).length === 0
      ? ['epistemic.unresolved is empty: a gap with no open question is not a gap']
      : []),
    (r) => (r.gap_kind === 'no_rule_matched' && r.absence_kind !== 'no_rule_matched'
      ? ['gap_kind is "no_rule_matched" but absence_kind is not: where no rule fires the answer is NOT DETERMINED, never a negative finding']
      : []),
    (r) => (r.gap_kind === 'not_publicly_determinable' && r.absence_kind !== 'unknown_not_determinable'
      ? ['gap_kind is "not_publicly_determinable" but absence_kind is not "unknown_not_determinable": researched-and-unavailable is not the same as not researched']
      : []),
    (r) => (r.state === 'closed_by_verification' && !r.closed_by
      ? ['state is "closed_by_verification" but closed_by is null: name the verification that closed it']
      : []),
    (r) => (r.state === 'declared_unknown' && r.absence_kind !== 'unknown_not_determinable'
      ? ['state is "declared_unknown" but absence_kind is not "unknown_not_determinable": only a researched absence may be declared unknown']
      : []),
    (r) => (r.state !== 'open' && r.blocking === true
      ? [`state is "${r.state}" but blocking is still true: a closed gap does not block`]
      : []),
  ],
});
