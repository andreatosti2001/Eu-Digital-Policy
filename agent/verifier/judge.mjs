/* ============================================================
   agent/verifier/judge.mjs — the verdict, and the reason it is not
   a stronger one

   "Never force a yes/no conclusion where the evidence does not
   support one" is this module. Every path returns a verdict AND the
   reason it stopped there, and the reasons are ordered so that the
   most damaging error to make is checked first.

   THE ORDER IS THE ARGUMENT:

   1. an internal contradiction, because a document that says two
      different things about the same date is not partially right;
   2. an ambiguous status, because collapsing two kinds of status
      into one is how "repealed" gets attached to the wrong act;
   3. applicability asserted where the text only schedules it — the
      single most consequential collapse in this corpus;
   4. a register/text disagreement, because the text governs and the
      disagreement is still a finding;
   5. a date the document states more than once, differently, because
      an act that applies in stages does not have one date;
   6. an obligation drawn from a non-binding source, because
      guidance saying "must" does not make it law;
   7. an entry-into-force formula, because the rule is stated and the
      date is not;
   8. nothing locatable, because an unlocatable support is
      unfalsifiable;
   9. and only then, confirmed.

   Nothing here reads a clock. Whether a stated application date has
   arrived depends on when the question is asked, and
   AUDIT-2026-09-01 F-15 records what happens to derived output that
   depends on the reader's clock. The date is recorded; the arrival
   is not asserted.
   ============================================================ */

import { readDates } from './dates.mjs';
import { isNonBinding } from './outcome.mjs';

const ASSERTS_APPLICABILITY = /\b(?:has\s+applied\s+since|has\s+been\s+applicable\s+since|is\s+applicable|applies\s+since)\b/i;
const SCHEDULES_APPLICABILITY = /\bshall\s+apply\s+(?:as\s+)?from\b/i;
const ASSERTS_OBLIGATION = /\b(?:shall|must|is\s+required\s+to|are\s+required\s+to|may\s+not|shall\s+not|is\s+prohibited)\b/i;
const CONCERNS_ENTRY_INTO_FORCE = /\benter(?:ed|s|ing)?\s+into\s+force\b/i;

/**
 * @param {{proposition:{text:string}, status:object, dates:object,
 *          location:object|null, legal_status:string|null}} input
 * @returns {{verdict:string, residual_gap:string|null, because:string,
 *            aspects:object}}
 */
export function judge({ proposition, status, dates, location, legal_status }) {
  const text = proposition.text;
  const own = readDates(text);
  const aspects = {
    asserts_applicability: ASSERTS_APPLICABILITY.test(text),
    schedules_applicability: SCHEDULES_APPLICABILITY.test(text),
    asserts_obligation: ASSERTS_OBLIGATION.test(text),
    concerns_entry_into_force: CONCERNS_ENTRY_INTO_FORCE.test(text),
    states_dates: Object.fromEntries(['publication', 'entry_into_force', 'applicability'].map((k) => [k, own[k].value])),
  };

  /* 1 · the document contradicts itself about a date this
        proposition states */
  for (const kind of ['publication', 'entry_into_force', 'applicability']) {
    const mine = own[kind].value;
    const theirs = dates[kind]?.value;
    if (mine && theirs && mine !== theirs && !dates[kind].alternatives.length) {
      return {
        verdict: 'contradicted',
        because: `The proposition states ${kind.replace(/_/g, ' ')} "${mine}" while the same document states "${theirs}" elsewhere.`,
        residual_gap: `The document states two different ${kind.replace(/_/g, ' ')} values — "${mine}" and "${theirs}" — and this check does not decide which is the operative one. Reading the act's own final provisions, rather than any summary of them, is what would settle it.`,
        aspects,
      };
    }
  }

  /* 2 · signals from different kinds of status */
  if (status.ambiguous) {
    return {
      verdict: 'not_determinable',
      because: 'The document carries status signals of more than one kind, which are statements about different things.',
      residual_gap: `The document places the act in more than one kind of state at once (${status.competing.join(', ')}). ${status.method} Establishing which of these the proposition concerns needs the act's own text, read against the instrument the proposition names.`,
      aspects,
    };
  }

  /* 3 · applicability asserted where the text only schedules it */
  if (aspects.asserts_applicability && legal_status === 'entered_into_force') {
    return {
      verdict: 'partially_confirmed',
      because: 'The document establishes that the act is in force; the proposition asserts that it applies, which is a further step the text does not take.',
      residual_gap: 'The document places the act in force and states a date from which it is to apply. It does not state that the act applies now, and this check does not compute whether that date has arrived: the answer would change with when the page is read. An act in force is not thereby an act that applies.',
      aspects,
    };
  }

  /* 4 · the register and the text disagree */
  const relevant = (dates.disagreements ?? []).filter((d) => own[d.kind]?.value || aspects.states_dates[d.kind]);
  if (relevant.length) {
    const d = relevant[0];
    return {
      verdict: 'partially_confirmed',
      because: 'The document\'s metadata and its operative text give different dates.',
      residual_gap: `The document's machine-readable metadata gives ${d.kind.replace(/_/g, ' ')} as "${d.metadata_value}" while its text states "${d.text_value}". ${d.resolution} The metadata has not been reconciled and may describe a different act of publication.`,
      aspects,
    };
  }

  /* 5 · one date stated more than once, differently */
  for (const kind of ['applicability', 'entry_into_force', 'publication']) {
    const alts = dates[kind]?.alternatives ?? [];
    if (alts.length > 1 && (aspects.states_dates[kind] || kind === 'applicability')) {
      return {
        verdict: 'not_determinable',
        because: `The document states ${alts.length} different ${kind.replace(/_/g, ' ')} dates.`,
        residual_gap: `The document gives ${alts.length} ${kind.replace(/_/g, ' ')} dates — ${alts.map((a) => `"${a.value}"`).join(' and ')} — which is how an act that applies in stages is written. Which stage this proposition concerns is not established, and taking either date would be false about the other part of the act.`,
        aspects,
      };
    }
  }

  /* 6 · an obligation read out of something that does not bind */
  if (aspects.asserts_obligation && isNonBinding(legal_status)) {
    return {
      verdict: 'partially_confirmed',
      because: `The source is ${legal_status.replace(/_/g, ' ')}, which establishes what it says and not that anybody is bound by it.`,
      residual_gap: `The document states this, and the document is ${legal_status.replace(/_/g, ' ')}. What binds is the instrument the guidance is about, and this check has not read it. Presenting this as an obligation would give a reader an interpretation in the voice of the law.`,
      aspects,
    };
  }

  /* 7 · the entry-into-force formula */
  if (aspects.concerns_entry_into_force && dates.entry_into_force?.formula && !dates.entry_into_force.value) {
    return {
      verdict: 'partially_confirmed',
      because: 'The document states the rule for entry into force and no date.',
      residual_gap: `The document states entry into force as "${dates.entry_into_force.formula}" and gives no date. Computing one needs the Official Journal publication date at day precision, from the Journal itself; this verifier does not perform that arithmetic, because a computed date presented as a read one is a fabricated legal fact.`,
      aspects,
    };
  }

  /* 8 · nothing to point at */
  if (!location) {
    return {
      verdict: 'partially_confirmed',
      because: 'The passage was read but no structural marker governs it.',
      residual_gap: 'The document carries this wording, but no article, recital, chapter or page number governs the passage, so the support cannot be cited to a location. A citation nobody can look up cannot be re-checked.',
      aspects,
    };
  }

  /* 9 · and only now */
  return {
    verdict: 'confirmed',
    because: `The document states the proposition at ${location.raw}, and nothing in it qualifies or contradicts the statement.`,
    residual_gap: null,
    aspects,
  };
}

/**
 * How the retrieved document bears on the proposition, in
 * data/claims.json's own vocabulary. Derived from the verdict so
 * the two cannot disagree: a record whose verdict says "partly" and
 * whose evidence says "directly" is telling a reviewer two things.
 *
 * `supports:context` never appears, and that is not an oversight.
 * Context means a source informs a claim without establishing it —
 * the case where the document is ABOUT the subject and says nothing
 * that bears on the proposition. A proposition here is quoted from
 * the document being checked, so the document always bears on it at
 * least partially; a check that came back unsettled did so because
 * the document QUALIFIES what it says (it applies in stages, it
 * schedules rather than asserts), not because it is silent. Emitting
 * `supports:context` would say the opposite, and the validator would
 * be right to refuse the facts resting on it.
 */
export function supportsFor(verdict) {
  switch (verdict) {
    case 'confirmed': return 'supports:direct';
    case 'contradicted': return 'supports:direct';
    case 'conflict': return 'supports:direct';
    case 'partially_confirmed': return 'supports:partial';
    case 'not_determinable': return 'supports:partial';
    default: return null;   // source_unavailable cites an absence, which supports nothing
  }
}
