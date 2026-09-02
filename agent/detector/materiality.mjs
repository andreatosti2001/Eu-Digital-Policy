/* ============================================================
   agent/detector/materiality.mjs — what a change costs a reader

   NOT A LOOKUP ON THE CHANGE KIND. The obvious implementation is a
   table from the fourteen kinds to the four levels, and it is wrong:
   the same kind of change is material at one attribute and cosmetic
   at another. An AMENDED that moves an application date is something
   a person schedules their compliance around; an AMENDED that
   renumbers a recital is not. A table on the kind would have been a
   judgement disguised as a lookup, and the RegulatoryChange contract
   types materiality as an inference precisely so it has to state its
   method.

   THE RULE, IN ONE SENTENCE. Materiality is decided by **which
   attribute moved**, then raised where the change removes an
   obligation's basis or reverses a decision, and lowered only where
   nothing the corpus asserts moved at all.

   THE ATTRIBUTES A READER ACTS ON. This is the list that matters and
   it is short on purpose:

     · a date an obligation begins — a person schedules around it
     · whether an act binds them at all
     · whether an act still exists
     · whether a fine stands, and whether it is owed

   Everything else is `substantive` if the corpus would afterwards
   say something different, and `metadata_only` if it would not.
   `none` is reserved for a document that moved without moving.

   WHY THIS IS NOT A SEVERITY LADDER. `docs/AGENT-CONTRACTS.md`
   records that AgentObservation refuses `level` and `log`: there is
   no severity here, there is risk and confidence. Materiality is a
   fourth thing again — a statement about somebody outside this
   repository, not about how much the agent minds. The levels are
   ordered by harm to a reader and by nothing else, and a change that
   is enormous internally and invisible to a reader ranks low.

   AND WHY IT IS NEVER LOWERED BY UNCERTAINTY. A change this detector
   is unsure about is a change with a low CONFIDENCE. Its materiality
   is what it would cost if it is real, and the two must not be
   multiplied together into one number — that is how a high-harm,
   low-certainty finding disappears into a middling score nobody
   acts on.
   ============================================================ */

import { MATERIALITY_LEVELS, MATERIALITY_RANK } from '../schemas/types.mjs';

export { MATERIALITY_LEVELS, MATERIALITY_RANK };

/**
 * The attributes a person changes their behaviour because of, keyed
 * by what they answer. Named individually rather than pattern-matched
 * so that adding one is a decision somebody made.
 */
export const READER_ACTS_ON = {
  /* When an obligation begins. data/timeline.json's whole reason for
     existing, and the field an act-in-force-but-not-yet-applicable
     reader is most often told wrong. */
  date: 'the date an obligation begins or falls due',
  applicability_date: 'the date from which an act applies',
  entry_into_force_date: 'the date an act entered into force',

  /* Whether an act binds them, and whether it still exists. */
  legislative_status: 'whether the act binds the reader, and from when',
  legal_status: 'whether the act binds the reader, and from when',

  /* Whether a fine stands and whether it is owed. */
  action_status: 'whether an enforcement decision stands',
  payment_status: 'whether a fine is owed or has been paid',
  judicial: 'whether a court has upheld, reduced or annulled a decision',
  appeal: 'whether a decision is still open to challenge',

  /* Whether an obligation exists at all. */
  transposition: 'whether a directive has been transposed where the reader is',
  obligation: 'what the obligation itself requires',
};

/** Kinds that remove or reverse rather than move. A repeal, an
 *  annulment and a court outcome each change whether something is
 *  law, and they reach the top of the ladder whatever attribute
 *  carried them. */
const REMOVES_OR_REVERSES = ['REPEALED', 'ANNULLED', 'COURT_OUTCOME'];

/**
 * @param {{change_kind:string, attribute:string|null,
 *          old_value:*, new_value:*, values_equal:boolean,
 *          bytes_changed:boolean|null, entity_kind:string|null}} c
 * @returns {{level:string, why:string, considered:string[]}}
 *   `why` is written into the record's epistemic.inference entry as
 *   the method, because the contract requires materiality to state
 *   how it was reached.
 */
export function materialityOf(c) {
  const considered = [];

  /* --- nothing the corpus asserts moved ------------------------- */
  if (c.values_equal === true) {
    if (c.bytes_changed === true) {
      return {
        level: 'metadata_only',
        why: `The document's bytes changed and every value the corpus asserts is unchanged. A regulator re-publishing a page with a new footer costs a reader nothing, and reporting it at the weight of a moved date would train whoever reads this list to stop reading it. What this does NOT establish is that the document's meaning is unchanged: this repository stores no document bodies, so a checksum says that the bytes moved and never where.`,
        considered,
      };
    }
    return {
      level: 'none',
      why: 'Neither the values the corpus asserts nor the document\'s bytes moved. Nothing has changed and the record says so, which is a finding — "nothing has decayed" is a result and must be stated with its as-of date rather than left as silence.',
      considered,
    };
  }
  considered.push('nothing the corpus asserts moved');

  /* --- the change removes or reverses --------------------------- */
  if (REMOVES_OR_REVERSES.includes(c.change_kind)) {
    return {
      level: 'reader_acts_on_it',
      why: `A ${c.change_kind} does not move a value, it removes or reverses one: whether the act is still law, or whether a decision against somebody still stands. A reader relying on the corpus's position would be relying on something that no longer exists. That is the top of the ladder whatever attribute carried it.`,
      considered,
    };
  }
  considered.push('the change removes or reverses rather than moves');

  /* --- the attribute is one a reader acts on -------------------- */
  const answers = READER_ACTS_ON[c.attribute];
  if (answers) {
    return {
      level: 'reader_acts_on_it',
      why: `The attribute that moved is "${c.attribute}", which answers ${answers}. A person schedules their compliance around it, so the corpus being wrong about it changes what somebody does — not merely what the site says. Listed in READER_ACTS_ON in agent/detector/materiality.mjs, which is short on purpose: everything not on it is substantive at most.`,
      considered,
    };
  }
  considered.push(`the attribute "${c.attribute ?? 'none'}" is one a reader acts on`);

  /* --- a value moved, and the site would say something different - */
  return {
    level: 'substantive',
    why: `A value the corpus asserts moved — "${String(c.old_value).slice(0, 80)}" to "${String(c.new_value).slice(0, 80)}" — so the site would afterwards state something different from the source. The attribute "${c.attribute ?? 'none'}" is not one of the few a reader schedules their own conduct around, so this is substantive rather than the top of the ladder. Everything above was tested and did not apply: ${considered.join('; ')}.`,
    considered,
  };
}

/**
 * How much the detector is standing on the classification being
 * right — never a probability that the new value is correct.
 *
 * A formula, like the Scout's and the Verifier's, so two candidates
 * with the same evidence get the same number and a reviewer can see
 * why one is lower. The ceiling is 0.85: this detector compares
 * printed values and status words, it has not read either document
 * the way a lawyer would, and a number approaching 1.0 would say it
 * had.
 */
export function confidenceOf({
  via,                  // 'table' | 'rule' | null — how the kind was reached
  hasDocument,          // a retrieved_document stands behind the new value
  hasSnapshot,          // an earlier reading of the same document to compare against
  bothValuesRead,       // both sides carry an actual value
  datesComparable,      // where a date moved, it could be ordered at day precision
  statusFromDocument,   // the status came from the document, not from the corpus at large
}) {
  let c = 0.25;                       // a divergence was noticed, and that is all
  if (hasDocument) c += 0.2;          // something was actually read
  if (bothValuesRead) c += 0.15;      // and there are two sides to compare
  if (hasSnapshot) c += 0.1;          // and an earlier reading of the same document
  if (via === 'table') c += 0.1;      // an enumerated transition, not an ordered guess
  if (statusFromDocument) c += 0.1;
  if (datesComparable === false) c -= 0.15;  // a date that could not be ordered: less, not more
  return Math.max(0.05, Math.min(0.85, Number(c.toFixed(2))));
}

/**
 * The autonomy class a change of this materiality may be handled at.
 *
 * Derived from the harm and then checked, rather than declared:
 * `agent/schemas/validate.mjs` reads what the record actually
 * touches and refuses a class that is too low, so this function
 * proposing something too permissive fails the gate rather than
 * passing quietly. It is written to be no more permissive than that
 * check would allow.
 */
export function autonomyFor(level, { touchesClaimAssertion = false } = {}) {
  if (touchesClaimAssertion) return 'human_only';
  if (MATERIALITY_RANK[level] >= MATERIALITY_RANK.reader_acts_on_it) return 'human_only';
  if (MATERIALITY_RANK[level] >= MATERIALITY_RANK.substantive) return 'review_required';
  /* Even a metadata-only change is about a legal record, and
     validate.mjs refuses `autonomous` for any legal entity kind. A
     detection is never green tier: it is a finding about what the
     site tells a reader about EU law. */
  return 'review_required';
}
