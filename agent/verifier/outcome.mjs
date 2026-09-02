/* ============================================================
   agent/verifier/outcome.mjs — what a verdict means, derived

   SESSION 07's brief names three outcomes: resolved, **unresolved**
   where the evidence is insufficient, and **conflict** where
   authoritative evidence disagrees. The contract records a sixth-
   place-precise `verdict`; the three outcome classes are DERIVED
   from it here and stored nowhere, which is why
   VerificationRecord forbids an `outcome_class` field. A stored
   copy is a second thing to be wrong, and the two would disagree
   the first time somebody edited one.

   The mapping is total by construction — a verdict this module
   does not know throws rather than defaulting to "resolved", which
   is the direction a silent default would fail in.
   ============================================================ */

import { VERIFICATION_VERDICTS, VERIFICATION_OUTCOME_CLASSES, NON_BINDING_STATUSES } from '../schemas/types.mjs';

/** verdict → the brief's three words. */
const OUTCOME_BY_VERDICT = {
  confirmed: 'resolved',
  partially_confirmed: 'resolved',
  contradicted: 'resolved',          // the check settled it: the source says otherwise
  not_determinable: 'unresolved',
  source_unavailable: 'unresolved',
  conflict: 'conflict',
};

/* Fail at load rather than at the first record: a verdict with no
   outcome would otherwise surface as `undefined` in a report a
   human reads as "fine". */
for (const v of VERIFICATION_VERDICTS) {
  if (!VERIFICATION_OUTCOME_CLASSES.includes(OUTCOME_BY_VERDICT[v])) {
    throw new Error(`agent/verifier/outcome.mjs has no outcome class for the verdict "${v}"`);
  }
}

export function outcomeClassOf(verdict) {
  const o = OUTCOME_BY_VERDICT[verdict];
  if (!o) throw new Error(`unknown verdict "${verdict}"`);
  return o;
}

export const isUnresolved = (verdict) => outcomeClassOf(verdict) === 'unresolved';
export const isConflict = (verdict) => outcomeClassOf(verdict) === 'conflict';

/**
 * The words the verification protocol
 * (`.agents/skills/legal-source-verification/references/verification-protocol.md`)
 * uses inside a trace's provenance block, so the ledger and a
 * `verification_note` in `data/` say the same thing.
 *
 * THE PROTOCOL HAS FIVE WORDS AND THIS HAS SIX. `conflicting` is
 * new, because `conflict` is a verdict the contract did not carry
 * before SESSION 07 and no existing word means it: "not
 * established" would file a disagreement between two regulators as
 * an absence of evidence, which is the collapse the whole verdict
 * vocabulary exists to prevent. Flagged in `docs/LEGAL-VERIFIER.md`
 * as a documentation change a later session owns — the reference
 * file is skill-layer material and was not edited from here.
 */
const PROTOCOL_WORD = {
  confirmed: 'established',
  partially_confirmed: 'partly established',
  contradicted: 'contradicted',
  not_determinable: 'not established',
  source_unavailable: 'unreachable',
  conflict: 'conflicting',
};

export function provenanceVerdictOf(verdict) {
  const w = PROTOCOL_WORD[verdict];
  if (!w) throw new Error(`unknown verdict "${verdict}"`);
  return w;
}

/**
 * How much the Verifier is standing on THIS VERDICT — not on the
 * proposition being true. Stated as a formula, like the Scout's, so
 * two checks with the same evidence get the same number and a
 * reviewer can see why one is lower.
 *
 * It starts low and is earned. The ceiling is 0.9: a rule-based
 * verifier reading signal phrases has not read the document the way
 * a lawyer would, and a number that reached 1.0 would say it had.
 */
export function confidenceOf({
  verdict,
  located,              // the proposition was found at a stateable location
  quoted,               // the exact words were carried into the record
  statusFromSentence,   // the status signal was in the proposition itself, not the document at large
  authoritative,        // the source is tier:1 or tier:2
  documentIdentified,   // the document names itself
  ambiguousStatus,      // signals for more than one kind of status were present
}) {
  if (verdict === 'source_unavailable') {
    /* Nothing was read. The verdict is nonetheless certain: the
       document did not arrive, and that is not a judgement call. */
    return 0.9;
  }
  let c = 0.25;                          // a document was read, and that is all
  if (quoted) c += 0.15;                 // the record carries the words it turns on
  if (located) c += 0.15;                // and where they are
  if (documentIdentified) c += 0.1;      // and which document that is
  if (authoritative) c += 0.15;          // published by an authority the taxonomy ranks
  if (statusFromSentence) c += 0.1;      // the status was read where the proposition is
  if (ambiguousStatus) c -= 0.15;        // competing signals: less, not more
  if (verdict === 'conflict') c -= 0.1;  // a conflict is a report of confusion, not a finding
  return Math.max(0.05, Math.min(0.9, Number(c.toFixed(2))));
}

/** A proposition drawn from a non-binding source is confirmed as
 *  what the SOURCE SAYS, never as what the law requires. The
 *  Verifier attaches an interpretation entry saying so, and this is
 *  the test for when. */
export const isNonBinding = (legal_status) => NON_BINDING_STATUSES.includes(legal_status);
