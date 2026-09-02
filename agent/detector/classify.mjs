/* ============================================================
   agent/detector/classify.mjs — which of the fourteen kinds this is

   TWO MECHANISMS, AND THE SPLIT IS DELIBERATE.

   A TABLE for the six kinds that are a legal status arriving. The
   status vocabulary is closed — twelve values in
   agent/schemas/types.mjs — so the transitions are enumerable, and
   enumerating them means a reviewer can read every one this
   detector claims to know. `TRANSITIONS[from][to]`, and nothing
   else. A cascade of `if` conditions would have reached the same
   answers and hidden which cases it had actually thought about.

   AN ORDERED LIST for the eight that are about the document or the
   record rather than about the act. Order matters and it is the
   same principle as agent/verifier/judge.mjs: the most damaging
   mistake is tested first. Filing a substantive change as UPDATED
   makes it invisible, so UPDATED is tested LAST, after everything
   that could have been a real change has failed to match.

   THE TABLE HAS HOLES, AND A HOLE IS THE ANSWER.

   `classify` returns `{ kind: null, why }` for a transition it does
   not know — and `null` is not a failure mode to be smoothed away.
   A detector that defaulted an unrecognised transition to its
   nearest neighbour would report a state change the table's author
   never considered, in a corpus about what EU law requires of
   people. The RegulatoryChange contract requires a kind, so an
   unclassified transition CANNOT become one: the detector emits it
   as a DataGap naming the transition it could not place. That is
   the same move `agent/verifier/statuses.mjs` makes when two
   statuses off the lifecycle both signal, and the same one
   `js/applies.js` makes when no rule fires.

   THE ONE TRANSITION THIS MODULE REFUSES TO CALL AN OUTCOME.
   `under_judicial_review` ARRIVING is a court being seised, not a
   court deciding, and there is no kind among the fourteen for "a
   challenge was lodged". It is left unclassified rather than filed
   as COURT_OUTCOME, because a reader told a court had ruled when it
   had only been asked would have been told something false.
   ============================================================ */

import { LEGAL_STATUSES, LEGAL_STATUS_TAXONOMY, LEGAL_STATUS_KIND } from '../schemas/types.mjs';
import { sameDate } from '../verifier/dates.mjs';

/** taxonomy id → the bare status the agent layer uses. Built by
 *  inverting the one mapping rather than writing a second one. */
export const STATUS_FROM_TAXONOMY = Object.fromEntries(
  Object.entries(LEGAL_STATUS_TAXONOMY).filter(([, id]) => id).map(([status, id]) => [id, status]),
);

/**
 * The transitions this detector knows, `from` → `to` → kind.
 *
 * `null` on the left is the corpus recording no status at all.
 * A pair absent from the table is a pair this module does not
 * claim to understand, and `classify` says so.
 */
export const TRANSITIONS = {
  proposed: {
    adopted: 'UPDATED',
    published: 'UPDATED',
    entered_into_force: 'ENTERED_INTO_FORCE',
    applicable: 'APPLICABLE',
    repealed: 'REPEALED',
    /* A proposal withdrawn or struck down before it ever bound
       anybody. ANNULLED is the right word and the corpus's
       `kind:proposal` guard means nothing was ever presented as
       binding. */
    annulled: 'ANNULLED',
  },
  adopted: {
    published: 'UPDATED',
    entered_into_force: 'ENTERED_INTO_FORCE',
    applicable: 'APPLICABLE',
    amended: 'AMENDED',
    corrected: 'CORRECTED',
    repealed: 'REPEALED',
    annulled: 'ANNULLED',
  },
  published: {
    entered_into_force: 'ENTERED_INTO_FORCE',
    applicable: 'APPLICABLE',
    amended: 'AMENDED',
    corrected: 'CORRECTED',
    repealed: 'REPEALED',
    annulled: 'ANNULLED',
  },
  entered_into_force: {
    applicable: 'APPLICABLE',
    amended: 'AMENDED',
    corrected: 'CORRECTED',
    repealed: 'REPEALED',
    annulled: 'ANNULLED',
  },
  applicable: {
    amended: 'AMENDED',
    corrected: 'CORRECTED',
    repealed: 'REPEALED',
    annulled: 'ANNULLED',
    /* An applicable act is not un-applied by a later document
       merely restating that it entered into force. That is the
       document repeating history, and the detector must not report
       it as the act going backwards. */
    entered_into_force: null,
  },
  amended: {
    applicable: 'APPLICABLE',
    corrected: 'CORRECTED',
    amended: 'AMENDED',       // a further amending act
    repealed: 'REPEALED',
    annulled: 'ANNULLED',
  },
  corrected: {
    applicable: 'APPLICABLE',
    amended: 'AMENDED',
    repealed: 'REPEALED',
    annulled: 'ANNULLED',
  },
  under_judicial_review: {
    /* The court decided. Where it annulled, ANNULLED is the more
       specific and truer word; where the act stands, the outcome is
       that the challenge failed and COURT_OUTCOME is all this
       detector can say without reading the judgment. */
    annulled: 'ANNULLED',
    applicable: 'COURT_OUTCOME',
    entered_into_force: 'COURT_OUTCOME',
    amended: 'COURT_OUTCOME',
    repealed: 'REPEALED',
  },
  guidance: {
    guidance: 'GUIDANCE_UPDATED',
    non_binding_commentary: 'GUIDANCE_UPDATED',
  },
  non_binding_commentary: {
    guidance: 'GUIDANCE_UPDATED',
    non_binding_commentary: 'GUIDANCE_UPDATED',
  },
  /* Nothing on the corpus side: the act is not in the corpus at all,
     or is there carrying no legislative_status. What the document
     establishes is new information, and NEW is the honest kind —
     never the status's own kind, which would assert that the corpus
     had previously said something else.

     THIS ROW IS NOT FOR A STATUS THE AGENT LAYER CANNOT NAME. A
     corpus record carrying `status:partly-applicable` — which
     data/taxonomy.json has and LEGAL_STATUS_TAXONOMY does not map —
     says something; it says something this vocabulary cannot
     express. Reporting that as NEW would assert the corpus had said
     nothing, and `classify` refuses it before reaching this row. */
  null: Object.fromEntries(LEGAL_STATUSES.map((s) => [s, 'NEW'])),
};

/* Fail at load rather than at the first record: a transition naming
   a status the vocabulary does not carry would surface as
   `undefined` in a report a human reads as "no change". */
for (const [from, tos] of Object.entries(TRANSITIONS)) {
  if (from !== 'null' && !LEGAL_STATUSES.includes(from)) {
    throw new Error(`agent/detector/classify.mjs: TRANSITIONS has a "from" status "${from}" that is not in LEGAL_STATUSES`);
  }
  for (const to of Object.keys(tos)) {
    if (!LEGAL_STATUSES.includes(to)) {
      throw new Error(`agent/detector/classify.mjs: TRANSITIONS["${from}"] has a "to" status "${to}" that is not in LEGAL_STATUSES`);
    }
  }
}

/**
 * Day-precision ordinal, for the one question DELAYED needs
 * answering: is the new date later than the old one?
 *
 * Parses only the two shapes `agent/verifier/dates.mjs` already
 * treats as comparable — ISO, and "12 July 2024" — and returns null
 * for everything else. **The refusal is the feature.** A
 * month-precision date cannot be ordered against a day-precision
 * one without widening one of them, and `data/timeline.json` carries
 * `date_precision` because that distinction is load-bearing here.
 */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

export function dayOrdinal(value) {
  const t = String(value ?? '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) return Number(`${iso[1]}${iso[2]}${iso[3]}`);
  const dmy = new RegExp(`^(\\d{1,2})\\s+(${MONTHS.join('|')})\\s+(\\d{4})$`, 'i').exec(t);
  if (dmy) {
    const mm = String(MONTHS.indexOf(dmy[2].toLowerCase()) + 1).padStart(2, '0');
    return Number(`${dmy[3]}${mm}${String(dmy[1]).padStart(2, '0')}`);
  }
  return null;
}

/** Later, earlier, the same day, or not comparable at day
 *  precision. Four answers, and the fourth is not "no". */
export function compareDates(oldValue, newValue) {
  if (sameDate(String(oldValue ?? ''), String(newValue ?? ''))) return 'same';
  const a = dayOrdinal(oldValue);
  const b = dayOrdinal(newValue);
  if (a === null || b === null) return 'incomparable';
  if (b > a) return 'later';
  if (b < a) return 'earlier';
  return 'same';
}

/**
 * The eight kinds that are about the record or the document rather
 * than about the act, in the order they are tested.
 *
 * Each rule gets the whole candidate and returns a kind or null. The
 * order is the order of harm: the kinds that would be lost if
 * something else matched first come first, and UPDATED — which
 * asserts that nothing substantive moved — comes last, after
 * everything that could have been substantive has failed.
 */
const RULES = [
  {
    name: 'the corpus has no record of this at all',
    kind: 'NEW',
    test: (c) => c.corpus_has_no_record === true,
  },
  {
    name: 'an edge between two instruments changed',
    kind: 'RELATIONSHIP_CHANGED',
    test: (c) => c.entity_kind === 'relationship',
  },
  {
    name: 'the corpus cites one document and the authority now publishes another',
    kind: 'SOURCE_REPLACED',
    test: (c) => c.entity_kind === 'source' && c.attribute === 'url'
      && c.old_value !== null && c.new_value !== null && c.old_value !== c.new_value,
  },
  {
    name: 'a court decided something the corpus records as open',
    kind: 'COURT_OUTCOME',
    test: (c) => c.entity_kind === 'enforcement_action'
      && (c.attribute === 'judicial' || c.attribute === 'appeal'),
  },
  {
    name: 'an enforcement axis moved',
    kind: 'ENFORCEMENT_UPDATED',
    test: (c) => c.entity_kind === 'enforcement_action',
  },
  {
    name: 'a date the corpus records has moved later',
    kind: 'DELAYED',
    /* Only later. A date moving EARLIER is equally a change and is
       equally material, and it is deliberately not DELAYED: the
       word would be false. It falls through to the status table or
       to the unclassified answer, which is where a change this
       module has no word for belongs. */
    test: (c) => c.entity_kind === 'timeline_event'
      && compareDates(c.old_value, c.new_value) === 'later',
  },
  {
    name: 'a non-binding document the corpus cites has changed',
    kind: 'GUIDANCE_UPDATED',
    test: (c) => ['guidance', 'non_binding_commentary'].includes(c.new_status)
      && c.bytes_changed === true,
  },
  {
    name: 'the document moved and nothing it asserts did',
    kind: 'UPDATED',
    test: (c) => c.bytes_changed === true && c.values_equal === true,
  },
];

export const RULE_NAMES = RULES.map((r) => r.name);

/**
 * Classify one candidate change.
 *
 * @param {object} c
 *   corpus_has_no_record · corpus_status_unmappable · entity_kind ·
 *   attribute · old_value · new_value · old_status · new_status ·
 *   bytes_changed · values_equal
 *
 * @returns {{kind:string|null, not_a_change:boolean, why:string,
 *            via:'rule'|'table'|null, considered:string[]}}
 *   `not_a_change` is true only for a pair the table holds and
 *   deliberately does not treat as a movement. A `kind` of null with
 *   `not_a_change` false is a HOLE — something nobody has decided —
 *   and the two must not be reported alike.
 *   `considered` names what was tested and did not match, so a
 *   classification can be argued with rather than only read.
 */
export function classify(c) {
  const considered = [];

  for (const rule of RULES) {
    let matched = false;
    try { matched = rule.test(c) === true; } catch { matched = false; }
    if (matched) {
      return {
        kind: rule.kind,
        via: 'rule',
        not_a_change: false,
        why: `Matched the ordered test "${rule.name}" in agent/detector/classify.mjs. The rules before it did not match: ${considered.length ? considered.join('; ') : 'it is the first'}.`,
        considered,
      };
    }
    considered.push(rule.name);
  }

  /* The status table. Reached only when nothing about the record or
     the document explained the change. */

  /* A corpus status this vocabulary cannot name is not the same as
     no corpus status. LEGAL_STATUS_TAXONOMY maps seven of the twelve
     agent-layer statuses onto data/taxonomy.json terms; the reverse
     direction has holes of its own — `status:partly-applicable` is
     one, and it is the state several of this corpus's most-read acts
     are actually in. Falling through to the `null` row would report
     the corpus as having said nothing about an act it says a great
     deal about. */
  if (c.corpus_status_unmappable === true) {
    return {
      kind: null,
      via: null,
      not_a_change: false,
      why: `The corpus records a status this vocabulary cannot name${c.old_value ? ` — "${c.old_value}"` : ''}, so there is no row to look up and no honest transition to report. It is NOT the "corpus has no record" case: the corpus says something, and reporting NEW would assert it had said nothing. Closing this means deciding whether the agent layer's twelve statuses should carry the term, which is a change to a vocabulary and has its own review path.`,
      considered,
    };
  }

  const from = c.old_status ?? 'null';
  const to = c.new_status ?? null;

  if (to === null) {
    return {
      kind: null,
      via: null,
      not_a_change: false,
      why: `Nothing matched the ${RULES.length} ordered rules, and the document places the act in no legal status, so the transition table has nothing to look up. This is an unclassified change and is reported as one: the alternative is filing it under the nearest kind, which would assert a state change nobody established.`,
      considered,
    };
  }

  if (from === 'null' && c.corpus_has_no_record !== true) {
    return {
      kind: null,
      via: null,
      not_a_change: false,
      why: 'The corpus record exists and carries no legislative_status at all, so there is nothing to transition FROM. NEW would assert the corpus has no record of the act, which is false. Unclassified rather than approximated.',
      considered,
    };
  }

  const row = TRANSITIONS[from];
  if (!row) {
    return {
      kind: null,
      via: null,
      not_a_change: false,
      why: `The corpus records the status "${from}", which the transition table has no row for. Unclassified rather than guessed: a table with a hole reports the hole.`,
      considered,
    };
  }

  const kind = row[to];
  if (kind === undefined) {
    return {
      kind: null,
      via: null,
      not_a_change: false,
      why: `The transition "${from}" → "${to}" is not in the table in agent/detector/classify.mjs. That is a hole, not a defect, and it is reported rather than defaulted to a neighbouring kind${to === 'under_judicial_review' ? ' — a court being seised is not a court deciding, and there is no kind among the fourteen for "a challenge was lodged"' : ''}.`,
      considered,
    };
  }
  if (kind === null) {
    /* IN the table, and deliberately not a change. Distinct from a
       hole, and the distinction matters: a hole is something nobody
       has decided, and this is something somebody decided. Reporting
       both as "unclassified" would bury the real holes among the
       cases that were thought about and settled. */
    return {
      kind: null,
      via: 'table',
      not_a_change: true,
      why: `The transition "${from}" → "${to}" is in the table and is deliberately not a change: ${from === 'applicable' && to === 'entered_into_force' ? 'an applicable act is not un-applied by a later document restating that it entered into force, and reporting it would be the act appearing to go backwards' : 'the table records it as a restatement rather than a movement'}.`,
      considered,
    };
  }

  return {
    kind,
    via: 'table',
    not_a_change: false,
    why: `The transition table maps "${from}" → "${to}" to ${kind}. None of the ${RULES.length} ordered rules matched first: ${considered.join('; ')}.`,
    considered,
  };
}

/** Whether two statuses are refinements of one another or different
 *  things about the act — the Verifier's own distinction, reused
 *  rather than restated. */
export const sameStatusKind = (a, b) => Boolean(a && b && LEGAL_STATUS_KIND[a] === LEGAL_STATUS_KIND[b]);
