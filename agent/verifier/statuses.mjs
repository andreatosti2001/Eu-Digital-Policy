/* ============================================================
   agent/verifier/statuses.mjs — which of the twelve states an act
   is in, and how sure the reading is

   The brief requires the Verifier to tell apart proposed, adopted,
   published, entered into force, applicable, amended, corrected,
   repealed, annulled, under judicial review, guidance and
   non-binding commentary. Two of those distinctions do most of the
   damage when they are lost:

   IN FORCE IS NOT APPLICABLE. An act can be in force for two years
   before anyone owes anything under it. A reader told an act
   "applies" when it has only entered into force may build a
   compliance programme two years early — or, worse, read the
   reverse and be two years late. So the tense is load-bearing here:
   "shall apply from 2 August 2026" SCHEDULES applicability and does
   not assert it; "has applied since 25 May 2018" asserts it. Only
   the second yields `applicable`. The first yields
   `entered_into_force` at most, and an applicability DATE, and an
   open question about whether that date has arrived — which this
   module refuses to answer, because `new Date()` makes the answer
   depend on when the page is read (AUDIT-2026-09-01 F-15).

   ANNULLED IS NOT FINAL WHILE IT IS UNDER APPEAL. A General Court
   annulment with an appeal pending before the Court of Justice is
   `under_judicial_review`, not `annulled`: the annulment is
   recorded and its finality is not.

   HOW A SIGNAL IS USED. Every signal carries the exact phrase it
   matched, so the conclusion is checkable — "repealed" with no
   matched phrase is an opinion; `matched "is repealed with effect
   from"` is a finding somebody can disagree with on the evidence.
   Nothing is concluded from a URL, a filename, a hostname or a
   document's general reputation.

   WHERE A SIGNAL IS LOOKED FOR MATTERS. A document that repeals
   Directive 95/46/EC while amending something else carries two
   statuses about two acts. Signals are therefore read from the
   PROPOSITION first and from the document at large only as a
   labelled fallback — and the fallback is refused outright when the
   document discusses more than one instrument, because attaching
   one act's repeal to another is the error this ordering exists to
   prevent.
   ============================================================ */

import { LEGAL_STATUS_KIND, LEGAL_STATUSES } from '../schemas/types.mjs';

/**
 * The one legislative lifecycle, in order. Reaching a later stage
 * implies the earlier ones, which is why co-occurring signals from
 * this list are not an ambiguity: they are one act described at
 * several points in its life. Everything OUTSIDE this list —
 * amended, corrected, repealed, annulled, under judicial review,
 * guidance, commentary — is a statement about what happened TO an
 * act rather than how far along it is, and two of THOSE together is
 * a real ambiguity.
 */
export const PROGRESSION = ['proposed', 'adopted', 'published', 'entered_into_force', 'applicable'];

/** Statuses that qualify a document as a whole rather than one
 *  sentence in it. An appeal pending against a judgment does not
 *  qualify only the sentence that mentions it — it qualifies every
 *  finding the judgment makes, so the caller carries these down
 *  from the document even when a proposition has status wording of
 *  its own. */
export const FINALITY_QUALIFIERS = ['under_judicial_review'];

/**
 * One signal: a status, a pattern, and a plain-language account of
 * what the pattern is evidence OF. The account is carried into the
 * record's `method`, so a reviewer never has to read this file to
 * know why a status was chosen.
 */
const SIGNALS = [
  /* --- legislative progress ------------------------------------ */
  { status: 'proposed', re: /\bproposal for a\s+(?:regulation|directive|decision)\b/i, means: 'the document describes itself as a proposal for an act' },
  { status: 'proposed', re: /\bCOM\(\d{4}\)\s*\d+\s*final\b/, means: 'the document carries a COM(YYYY) NNN final reference, which is a Commission proposal document' },
  { status: 'adopted', re: /\b(?:was|were|has been|have been)\s+adopted\b/i, means: 'the document states the act was adopted' },
  { status: 'adopted', re: /\badopted\s+on\s+\d/i, means: 'the document states an adoption date' },
  { status: 'published', re: /\bpublished\s+in\s+the\s+Official\s+Journal\b/i, means: 'the document states publication in the Official Journal' },

  /* --- in effect ------------------------------------------------
     Perfect and present forms only. "shall enter into force" is a
     scheduled event, not a state, and is deliberately absent. */
  { status: 'entered_into_force', re: /\b(?:entered|came)\s+into\s+force\s+on\b/i, means: 'the document states the act entered into force on a stated date' },
  { status: 'entered_into_force', re: /\bhas\s+(?:entered|been\s+in)\s+(?:into\s+)?force\b/i, means: 'the document states the act is in force' },
  { status: 'entered_into_force', re: /\bin\s+force\s+since\b/i, means: 'the document states the act has been in force since a stated date' },

  { status: 'applicable', re: /\bhas\s+applied\s+since\b/i, means: 'the document states the act has applied since a stated date — a perfect form, which asserts applicability rather than scheduling it' },
  { status: 'applicable', re: /\bhas\s+been\s+applicable\s+since\b/i, means: 'the document states the act has been applicable since a stated date' },
  { status: 'applicable', re: /\b(?:is|are)\s+(?:now\s+)?applicable\b/i, means: 'the document states the act is applicable' },
  { status: 'applicable', re: /\bapplies\s+since\b/i, means: 'the document states the act applies since a stated date' },

  /* --- modified -------------------------------------------------- */
  { status: 'amended', re: /\bas\s+amended\s+by\b/i, means: 'the document refers to the act as amended by another' },
  { status: 'amended', re: /\b(?:is|was|has\s+been)\s+amended\b/i, means: 'the document states the act was amended' },
  { status: 'corrected', re: /\bcorrigendum\b/i, means: 'the document is or refers to a corrigendum, which alters the published text' },
  { status: 'corrected', re: /\bcorrected\s+version\b/i, means: 'the document describes itself as a corrected version' },

  /* --- terminated ------------------------------------------------ */
  { status: 'repealed', re: /\b(?:is|are|was|were|shall\s+be)\s+repealed\b/i, means: 'the document states the act is repealed' },
  { status: 'repealed', re: /\brepealed\s+with\s+effect\s+from\b/i, means: 'the document states a repeal taking effect on a stated date' },
  { status: 'annulled', re: /\bannull(?:ed|ing|ment)\b/i, means: 'the document records an annulment' },
  { status: 'annulled', re: /\bdeclare[sd]?\s+(?:the\s+\w+\s+)?void\b/i, means: 'the document records a declaration of voidness' },

  /* --- contested -------------------------------------------------- */
  { status: 'under_judicial_review', re: /\bappeal\b[^.]{0,80}\bpending\b/i, means: 'the document records a pending appeal' },
  { status: 'under_judicial_review', re: /\ban?\s+appeal\s+(?:has\s+been\s+)?(?:lodged|brought)\b/i, means: 'the document records an appeal having been brought' },
  { status: 'under_judicial_review', re: /\bpending\s+before\s+the\s+(?:Court|General\s+Court)\b/i, means: 'the document states a matter is pending before a court' },
  { status: 'under_judicial_review', re: /\baction\s+for\s+annulment\b[^.]{0,80}\b(?:brought|lodged)\b/i, means: 'the document records an action for annulment having been brought' },

  /* --- non-binding ------------------------------------------------ */
  { status: 'guidance', re: /\b(?:these|this)\s+guidelines?\b/i, means: 'the document describes itself as guidelines' },
  { status: 'guidance', re: /\bnot\s+legally\s+binding\b/i, means: 'the document states it is not legally binding' },
  { status: 'guidance', re: /\bnon-binding\b/i, means: 'the document describes itself as non-binding' },
  { status: 'non_binding_commentary', re: /\bthe\s+views\s+expressed\b/i, means: 'the document disclaims that its content is an official position' },
  { status: 'non_binding_commentary', re: /\bdoes\s+not\s+(?:necessarily\s+)?(?:represent|reflect)\b[^.]{0,60}\bposition\b/i, means: 'the document disclaims representing an official position' },
];

/* Fail at load if a signal names a status the vocabulary lost. */
for (const s of SIGNALS) {
  if (!LEGAL_STATUSES.includes(s.status)) throw new Error(`statuses.mjs signals an unknown legal status "${s.status}"`);
}

/**
 * Every signal present in a piece of text, with the exact phrase
 * each one matched.
 * @returns {Array<{status:string, kind:string, matched:string, means:string, index:number}>}
 */
export function statusSignals(text) {
  const src = String(text ?? '');
  const out = [];
  for (const s of SIGNALS) {
    const m = src.match(s.re);
    if (!m) continue;
    out.push({
      status: s.status,
      kind: LEGAL_STATUS_KIND[s.status],
      matched: m[0].replace(/\s+/g, ' ').trim(),
      means: s.means,
      index: m.index ?? 0,
    });
  }
  return out.sort((a, b) => a.index - b.index);
}

/**
 * Resolve a set of signals into one status, or refuse to.
 *
 * @returns {{status:string|null, ambiguous:boolean, signals:Array, competing:Array, method:string}}
 *   `status: null` means the signals do not settle it. That is an
 *   answer. The caller records it as an open question and never as
 *   the nearest plausible status.
 */
export function resolveStatus(signals) {
  if (signals.length === 0) {
    return {
      status: null,
      ambiguous: false,
      signals: [],
      competing: [],
      method: 'No phrase in the text places the act in any of the twelve states. Nothing is concluded from the document\'s address, its host or its title.',
    };
  }

  const kinds = [...new Set(signals.map((s) => s.kind))];
  const statuses = [...new Set(signals.map((s) => s.status))];
  const quote = (s) => `matched "${s.matched}" (${s.means})`;

  /* --- the two compositions that are NOT ambiguity ------------- */

  /* An annulment under appeal is not a final annulment. */
  if (statuses.includes('annulled') && statuses.includes('under_judicial_review')) {
    return {
      status: 'under_judicial_review',
      ambiguous: false,
      signals,
      competing: [],
      method: `The text records both an annulment and a pending challenge to it — ${signals.filter((s) => ['annulled', 'under_judicial_review'].includes(s.status)).map(quote).join('; ')}. An annulment under appeal is not final, so the status is that it is under judicial review, and the annulment itself is recorded as stated rather than as settled.`,
    };
  }

  /* --- one status --------------------------------------------- */

  if (statuses.length === 1) {
    return {
      status: statuses[0],
      ambiguous: false,
      signals,
      competing: [],
      method: `The text places the act in "${statuses[0]}": ${signals.map(quote).join('; ')}.`,
    };
  }

  /* --- several statuses on the one lifecycle -------------------- */

  const onTrack = statuses.filter((s) => PROGRESSION.includes(s));
  const offTrack = statuses.filter((s) => !PROGRESSION.includes(s));

  if (offTrack.length === 0) {
    /* These are CUMULATIVE, not competing: an act that has applied
       since a date was also published, and was adopted before that.
       So the furthest along is the answer, and it is the only one of
       the twelve that is not also implied by the others.

       This is safe precisely because of the tense rule above:
       `applicable` is only ever signalled by a perfect or present
       form. "Shall apply from" produces no applicability signal at
       all, so an act scheduled to apply later cannot reach
       `applicable` down this path. */
    const furthest = onTrack.reduce((a, b) => (PROGRESSION.indexOf(b) > PROGRESSION.indexOf(a) ? b : a));
    return {
      status: furthest,
      ambiguous: false,
      signals,
      competing: onTrack.filter((s) => s !== furthest),
      method: `The text carries wording for ${onTrack.length} stages of the one legislative lifecycle (${onTrack.join(' → ')}), which are cumulative rather than competing: an act that has reached the later stage has passed the earlier ones. The furthest along is taken — ${signals.filter((s) => s.status === furthest).map(quote).join('; ')} — and each earlier stage is recorded as also stated.`,
    };
  }

  /* --- one status off the lifecycle, qualifying it -------------- */

  if (offTrack.length === 1) {
    const chosen = offTrack[0];
    return {
      status: chosen,
      ambiguous: false,
      signals,
      competing: onTrack,
      method: `The text places the act at "${chosen}" — ${signals.filter((s) => s.status === chosen).map(quote).join('; ')} — which is a statement about what has happened TO the act and governs over the lifecycle wording also present (${onTrack.join(', ') || 'none'}). An act does not stop having been published because it was later repealed; what a reader needs to know is the repeal.`,
    };
  }

  /* --- genuinely ambiguous -------------------------------------- */
  return {
    status: null,
    ambiguous: true,
    signals,
    competing: statuses,
    method: `The text carries ${offTrack.length} statuses that are not stages of one lifecycle (${offTrack.join(', ')}) alongside ${onTrack.length ? onTrack.join(', ') : 'none on it'}, spanning ${kinds.length} kinds (${kinds.join(', ')}): ${signals.map(quote).join('; ')}. These are statements about different things — a document can repeal one act while amending another — and this verifier does not choose between them.`,
  };
}
