/* ============================================================
   agent/verifier/conflict.mjs — when two authorities disagree

   The brief: "If authoritative evidence conflicts: return conflict.
   Never force a yes/no conclusion where the evidence does not
   support one."

   `.agents/skills/legal-source-verification/SKILL.md` puts the same
   rule as a refusal condition: **do not resolve a contradiction
   between sources by choosing one.** Recording one and dropping the
   other is a decision about the law, and it is not an agent's to
   take. This module therefore finds disagreements and stops. It has
   no ranking function, no tie-break, and no "most recent wins" —
   deliberately, because each of those is a rule about which
   regulator to believe.

   WHAT IS NOT A CONFLICT, and this matters as much as what is:

   A LOWER TIER DISAGREEING WITH A HIGHER ONE. A law firm's briefing
   contradicting the Official Journal is not two authorities
   disagreeing; it is one authority and one commentary, and the
   evidence hierarchy in data/taxonomy.json already settles it. It
   is reported as a note on the higher-tier finding, never as a
   conflict, because calling it one would suggest the law is
   unsettled when it is not.

   DIFFERENT PRECISIONS OF THE SAME DATE. "July 2024" and "12 July
   2024" are not in conflict; the second is narrower. They are not
   equal either — `sameDate` refuses to widen — so this is reported
   as a precision difference, which is a third thing.

   THE SAME DOCUMENT TWICE. Two candidates that are the same
   document at two addresses disagree with nothing. Findings are
   compared across DOCUMENTS, matched on the candidate they came
   from.
   ============================================================ */

import { sameDate } from './dates.mjs';

/** The tiers at which a source is treated as authoritative for the
 *  purpose of conflicting with another. Read off the taxonomy's own
 *  tier definitions: 1 is primary law and the courts, 2 is the
 *  regulators. 3 and 4 are research and commentary, and neither
 *  contradicts a regulator — it disagrees with one. */
const AUTHORITATIVE = ['tier:1', 'tier:2'];

export const isAuthoritative = (tier) => AUTHORITATIVE.includes(tier);

/** Attributes two documents can disagree about. Each is a single
 *  value about a single act, which is what makes disagreement
 *  meaningful; two documents saying different things about
 *  different acts are simply two documents. */
export const COMPARABLE_ATTRIBUTES = [
  'legal_status', 'publication_date', 'entry_into_force_date', 'applicability_date',
];

const DATE_ATTRIBUTES = new Set(['publication_date', 'entry_into_force_date', 'applicability_date']);

/** Do two stated values disagree, agree, or merely differ in
 *  precision? Three answers, because collapsing the third into the
 *  first would manufacture conflicts out of a month and a day. */
export function compareValues(attribute, a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return 'incomparable';
  if (a === b) return 'agree';
  if (DATE_ATTRIBUTES.has(attribute)) {
    if (sameDate(a, b)) return 'agree';
    const narrower = (x, y) => x.length > y.length && x.toLowerCase().includes(y.toLowerCase().replace(/^\w+\s/, ''));
    if (narrower(a, b) || narrower(b, a)) return 'precision';
  }
  return 'disagree';
}

/**
 * @param {Array<{finding_id:string, instrument_id:string|null, attribute:string,
 *                value:string|null, candidate_id:string, tier:string|null,
 *                quote:string|null, url:string|null}>} findings
 *
 * @returns {{conflicts:Array, outranked:Array, precision_differences:Array}}
 *   `conflicts` are between authoritative sources and are returned
 *   unresolved. `outranked` is a lower tier disagreeing with a
 *   higher one — a note, not a conflict. Both are returned; neither
 *   is silently dropped.
 */
export function findConflicts(findings) {
  const conflicts = [];
  const outranked = [];
  const precision_differences = [];

  const relevant = findings.filter((f) => COMPARABLE_ATTRIBUTES.includes(f.attribute) && f.value !== null && f.instrument_id);

  /* One document states the same date in several of its own
     propositions, so the same two documents disagree once per pair
     of propositions. That is one disagreement, not four: a reviewer
     handed four identical records has been given three copies.
     Deduplicated on the instrument, the attribute and the two
     documents — never on the values, because two documents that
     disagree twice about the same attribute have disagreed twice. */
  const seen = new Set();
  const once = (kind, a, b, attribute, instrument) => {
    const key = [kind, instrument, attribute, ...[a.candidate_id, b.candidate_id].sort(), a.value, b.value].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };

  for (let i = 0; i < relevant.length; i++) {
    for (let j = i + 1; j < relevant.length; j++) {
      const a = relevant[i];
      const b = relevant[j];
      if (a.attribute !== b.attribute) continue;
      if (a.instrument_id !== b.instrument_id) continue;
      /* The same document cannot conflict with itself. */
      if (a.candidate_id === b.candidate_id) continue;

      const verdict = compareValues(a.attribute, a.value, b.value);
      if (verdict === 'agree' || verdict === 'incomparable') continue;

      if (verdict === 'precision') {
        if (once('precision', a, b, a.attribute, a.instrument_id)) precision_differences.push({ a, b, attribute: a.attribute });
        continue;
      }

      const aAuth = isAuthoritative(a.tier);
      const bAuth = isAuthoritative(b.tier);

      if (aAuth && bAuth) {
        if (!once('conflict', a, b, a.attribute, a.instrument_id)) continue;
        conflicts.push({
          attribute: a.attribute,
          instrument_id: a.instrument_id,
          sides: [a, b],
          unreconciled_because: a.tier === b.tier
            ? `Both sources sit in ${a.tier}, so neither displaces the other on the evidence hierarchy in data/taxonomy.json.`
            : `${a.tier} and ${b.tier} are both authoritative for this purpose; the hierarchy orders them but does not make the lower one wrong about a date it states outright. Which governs is a decision about the law, and this verifier does not take it.`,
        });
        continue;
      }

      if (aAuth !== bAuth) {
        const higher = aAuth ? a : b;
        const lower = aAuth ? b : a;
        if (!once('outranked', a, b, a.attribute, a.instrument_id)) continue;
        outranked.push({
          attribute: a.attribute,
          instrument_id: a.instrument_id,
          higher,
          lower,
          note: `${lower.tier ?? 'an unplaced source'} disagrees with ${higher.tier}. That is not a conflict between authorities: the evidence hierarchy settles it, and the lower-tier statement is recorded as disagreeing rather than as unsettling the higher one.`,
        });
        continue;
      }

      /* Neither is authoritative. Two commentaries disagreeing is
         not a finding about the law at all, and it is recorded as
         outranked-by-nothing rather than promoted to a conflict. */
      if (!once('outranked', a, b, a.attribute, a.instrument_id)) continue;
      outranked.push({
        attribute: a.attribute,
        instrument_id: a.instrument_id,
        higher: a,
        lower: b,
        note: 'Neither source is at tier 1 or tier 2. Two non-authoritative sources disagreeing says nothing about what the law is, and it is not reported as a conflict.',
      });
    }
  }

  return { conflicts, outranked, precision_differences };
}
