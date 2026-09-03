/* ============================================================
   agent/proposals/editorial/intake.mjs — the Editorial Agent may
   receive only verified inputs

   SESSION 14 states it as a constraint on the agent. It is
   implemented as a gate, for the same reason `agent/schemas/
   gateway.mjs` is a module rather than a policy sentence: a rule an
   agent is trusted to honour is a rule that will eventually be
   honoured by an agent in a hurry.

   THREE CONTRACTS ARE ADMISSIBLE, AND WHAT EACH ONE BUYS DIFFERS.
   This is the part worth reading, because it is where the honesty
   of the whole agent sits.

     RegulatoryChange   names an old value AND a new one, both
                        carried from a verification of a retrieved
                        document. It is the only input from which a
                        CORRECTION can be composed, because a
                        correction needs the two sides.

     ImpactAssessment   names what one confirmed change reaches
                        inside this site. It carries no values, so
                        it can bound a search and inherit caveats
                        and it can never produce an edit.

     VerificationRecord a check of one proposition. Where the verdict
                        is `contradicted` it establishes that the
                        corpus is wrong and NOT what is right — so it
                        can produce a recommendation and never a
                        correction. Where the verdict is `confirmed`
                        it establishes that a value stands, which is
                        what a NO-CHANGE EXPLANATION is made of.

   FOUR REFUSALS, EACH A DELIVERABLE (docs/AGENT-ROLES.md H6).

     · anything that is not one of the three. A DataProposal is not a
       verified input; it is somebody's suggestion.
     · anything the contract gateway rejects. `receive()` is called
       on every record, including ones this process believes it
       produced itself, because "I wrote it" is not a property the
       receiver can check.
     · a verdict of `not_determinable`, `source_unavailable` or
       `conflict`. None of the three settled anything, and the last
       one is two authoritative sources disagreeing — docs/AGENT-
       ROLES.md H7 is that contradictions stop the chain and go to a
       human. Turning one into prose would be an agent picking a
       winner between two regulators.
     · a change of materiality `none`. Nothing moved that a reader
       could act on, and the editorial half of this site is about
       what a reader acts on.

   SIMULATED RECORDS ARE ADMITTED AND ARE NEVER ACTIONABLE. A mock
   run must be able to exercise the whole path — that is what the
   fixtures are for — and the marking travels: every record produced
   from a simulated input is itself simulated, and the store refuses
   to treat one as real unless it was opened in mock mode.
   ============================================================ */

import { receive } from '../../schemas/gateway.mjs';
import { MATERIALITY_RANK } from '../../schemas/types.mjs';

/** The contracts this agent will read. Anything else is refused by
 *  name rather than ignored. */
export const ADMISSIBLE = ['RegulatoryChange', 'ImpactAssessment', 'VerificationRecord'];

/** Verdicts that settled something. The three that did not are
 *  named in the refusal, with the reason each is not a defect. */
export const SETTLING_VERDICTS = ['confirmed', 'partially_confirmed', 'contradicted'];

export const UNSETTLED_WHY = {
  not_determinable: 'the source was read and cannot settle the proposition. That is an absence of knowledge, and presenting one as a finding is the single most damaging thing this tool could do (AI-SAFE-BOUNDARIES §0.5)',
  source_unavailable: 'nothing was read, so nothing was verified. A sentence cannot be corrected against a document nobody could fetch',
  conflict: 'two authoritative sources disagree and neither displaces the other. docs/AGENT-ROLES.md H7: contradictions stop the chain and go to a human. Editing prose here would be an agent picking a winner between two regulators',
};

/** What each admissible contract entitles this agent to do. Stated
 *  as data so a reviewer can read the whole permission surface in
 *  one place, and so a contract added later is a blank rather than
 *  a fall-through to a default. */
export const ENTITLEMENT = {
  RegulatoryChange: {
    may_correct: true,
    why: 'It carries both sides of the move — what the corpus asserts and what the document states — so a substitution is well defined and a reviewer can check it against the record.',
  },
  ImpactAssessment: {
    may_correct: false,
    why: 'It names what a change reaches and carries no values. It bounds the search and supplies the caveats; a correction composed from it would have nothing to substitute.',
  },
  VerificationRecord: {
    may_correct: false,
    why: 'A verdict of "contradicted" establishes that the corpus is wrong and not what is right. Composing the replacement from it would be authoring the legal fact the verification did not carry.',
  },
};

for (const c of ADMISSIBLE) {
  if (!ENTITLEMENT[c]) throw new Error(`intake.mjs: no entitlement row for admissible contract "${c}"`);
}

/**
 * Sort a set of records into what may be acted on and what may not,
 * with a reason on every refusal.
 *
 * @param {object[]} records
 * @param {{allowSimulated?:boolean}} opts
 * @returns {{accepted:object[], refused:Array<{record_id, contract, why}>,
 *            changes:object[], assessments:object[], verifications:object[],
 *            by_contract:object, simulated:boolean}}
 */
export function intake(records, { allowSimulated = false } = {}) {
  const accepted = [];
  const refused = [];

  for (const r of Array.isArray(records) ? records : []) {
    const contract = r?.contract ?? '(no contract field)';
    const id = idOf(r);

    if (!ADMISSIBLE.includes(contract)) {
      refused.push({
        record_id: id, contract,
        why: `"${contract}" is not a verified input. The Editorial Agent reads ${ADMISSIBLE.join(', ')} and nothing else: a proposal, a gap or a candidate is somebody's suggestion, and prose on a production site about EU law is not changed on a suggestion.`,
      });
      continue;
    }

    /* The gate, on every record, including one this process
       believes it produced itself. */
    const errs = safeReceive(r, { allowSimulated });
    if (errs) {
      refused.push({ record_id: id, contract, why: `the contract gateway rejected it: ${errs}` });
      continue;
    }

    if (contract === 'VerificationRecord' && !SETTLING_VERDICTS.includes(r.verdict)) {
      refused.push({
        record_id: id, contract,
        why: `verdict "${r.verdict}" — ${UNSETTLED_WHY[r.verdict] ?? 'the check settled nothing'}. A refusal is a deliverable and is passed on intact (docs/AGENT-ROLES.md H6); it is not converted into a softer statement here.`,
      });
      continue;
    }

    if (contract === 'RegulatoryChange' && MATERIALITY_RANK[r.materiality] <= MATERIALITY_RANK.none) {
      refused.push({
        record_id: id, contract,
        why: 'materiality "none": nothing moved that a reader could act on. The editorial half of this site is what a reader acts on, and a proposal over a change of no materiality would spend a reviewer on nothing.',
      });
      continue;
    }

    accepted.push(r);
  }

  const of = (name) => accepted.filter((r) => r.contract === name);
  const by_contract = {};
  for (const c of ADMISSIBLE) by_contract[c] = of(c).length;

  return {
    accepted,
    refused,
    changes: of('RegulatoryChange'),
    assessments: of('ImpactAssessment'),
    verifications: of('VerificationRecord'),
    by_contract,
    /* True where ANY accepted record is a fixture. It travels: every
       record this agent produces from a simulated input is itself
       marked simulated, and the contract gateway refuses to treat
       one as actionable. */
    simulated: accepted.some((r) => r.simulated === true),
  };
}

/**
 * Which changes this agent may compose a correction from, and which
 * it may only report.
 *
 * A change with no `old_value` names nothing to look for in a
 * sentence — a NEW record, most often — and a change with no
 * `new_value` names nothing to put in its place. Both are real
 * detections and neither can produce a substitution, so both are
 * reportable and neither is correctable. `"unknown"` is not a value
 * either: it is the corpus saying it looked and could not determine,
 * and substituting the word into a sentence would put an internal
 * sentinel in front of a reader.
 */
export function correctable(change) {
  if (!ENTITLEMENT[change?.contract]?.may_correct) {
    return { ok: false, why: ENTITLEMENT[change?.contract]?.why ?? 'not an admissible input' };
  }
  const bad = (v) => v === null || v === undefined || v === 'unknown' || String(v).trim() === '';
  if (bad(change.old_value)) {
    return { ok: false, why: `old_value is ${change.old_value === 'unknown' ? '"unknown" — the corpus looked and could not determine it' : 'absent'}, so there is nothing to look for in a sentence and nothing a substitution could replace.` };
  }
  if (bad(change.new_value)) {
    return { ok: false, why: `new_value is ${change.new_value === 'unknown' ? '"unknown" — researched and not publicly determinable, which is a state and not a value' : 'absent'}, so there is nothing to put in a sentence's place. The change is reported; no correction is composed.` };
  }
  return { ok: true, why: 'The change carries both sides, each read from a document by the verification behind it.' };
}

function idOf(r) {
  for (const k of ['change_id', 'assessment_id', 'verification_id', 'proposal_id', 'gap_id', 'observation_id']) {
    if (r && typeof r[k] === 'string') return r[k];
  }
  return '(unidentified record)';
}

function safeReceive(record, opts) {
  try { receive(record, opts); return null; } catch (err) { return err.message.replace(/\s+/g, ' ').slice(0, 400); }
}
