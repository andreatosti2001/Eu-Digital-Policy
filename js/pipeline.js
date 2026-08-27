/* ============================================================
   The enforcement pipeline.

     law → investigation → enforcement action → decision →
     final decision → payment/collection → remedy → behavioural change

   Every stage is DERIVED from the enforcement record by the rules
   below. Nothing is stored, so no stage can be asserted that the
   record does not support, and the derivation is inspectable rather
   than being an act of faith.

   Three states carry the integrity of the whole view:

     reached      the record supports this stage having happened
     not-reached  the record supports it NOT having happened
     unknown      the record cannot settle it

   UNKNOWN IS NEVER ZERO. It is not counted as reached, not counted
   as not-reached, and never summed into a total. A pipeline that
   stops at "decision" with everything after it unknown is the
   normal case in this dataset, and saying so is the point.
   ============================================================ */

export const STAGES = [
  { id: 'stage:law', short: 'Law' },
  { id: 'stage:investigation', short: 'Investigation' },
  { id: 'stage:action', short: 'Action' },
  { id: 'stage:decision', short: 'Decision' },
  { id: 'stage:final', short: 'Final' },
  { id: 'stage:payment', short: 'Payment' },
  { id: 'stage:remedy', short: 'Remedy' },
  { id: 'stage:behaviour', short: 'Behaviour' },
];

const R = 'state:reached';
const N = 'state:not-reached';
const U = 'state:unknown';
const NA = 'state:na';

/** Human-readable statement of each derivation, shown in the interface. */
export const DERIVATION = {
  'stage:law': 'Reached where the instrument has an application milestone already in the past. This asks whether the obligation existed, not whether anyone enforced it.',
  'stage:investigation': 'Reached where the record carries an opening date. Unknown where it does not — most authorities do not publish one.',
  'stage:action': 'Reached wherever the authority has acted at all, including preliminary findings.',
  'stage:decision': 'Reached only where a decision has been adopted. Preliminary findings are NOT a decision and are shown as not reached.',
  'stage:final': 'Reached only where the action is recorded as final. An action under appeal, annulled or reduced has not reached it; anything else is unknown.',
  'stage:payment': 'Taken from the payment status. "Not payable" — typically because the decision is annulled or under appeal — is not reached. Anything unresearched stays unknown.',
  'stage:remedy': 'Taken from the remedy status. Ordered and implemented both count as reached; the interface distinguishes them.',
  'stage:behaviour': 'Reached only where a behavioural outcome is actually documented. A null field means nobody has looked; the string "unknown" means somebody looked and it is not knowable.',
};

const isPast = (iso) => !!iso && String(iso).slice(0, 10) <= new Date().toISOString().slice(0, 10);

/**
 * Derive the eight-stage pipeline for one enforcement record.
 * @param {object} rec  an enforcement record
 * @param {object} ix   the built index (for the instrument's milestones)
 * @returns {Array<{id,state,note}>}
 */
export function derive(rec, ix) {
  const out = [];
  const push = (id, state, note) => out.push({ id, state, note: note || null });

  /* --- law on paper ------------------------------------------------ */
  const inst = ix.instrument.get(rec.instrument);
  const applied = (inst && inst.milestones ? inst.milestones : [])
    .map((m) => ix.event.get(m))
    .filter(Boolean)
    .filter((e) => e.event_type === 'event:application' || e.event_type === 'event:transposition')
    .filter((e) => isPast(e.date));
  if (!inst) push('stage:law', U, 'The instrument is not in this dataset.');
  else if (applied.length) push('stage:law', R, 'Applicable since ' + applied[0].date + '.');
  else push('stage:law', U, 'No past application or transposition milestone is recorded for this instrument.');

  /* --- investigation ----------------------------------------------- */
  if (rec.opened) push('stage:investigation', R, 'Opened ' + rec.opened + '.');
  else push('stage:investigation', U, 'No opening date recorded. Most authorities do not publish one.');

  /* --- enforcement action ------------------------------------------ */
  const a = rec.action_status;
  if (a) push('stage:action', R, rec.action || null);
  else push('stage:action', N, 'No enforcement action has been taken. This record asserts an absence.');

  /* --- decision ----------------------------------------------------- */
  const DECIDED = ['action:imposed', 'action:final', 'action:appealed', 'action:reduced',
    'action:annulled', 'action:commitments', 'action:withdrawn'];
  if (a === 'action:announced') {
    push('stage:decision', N, 'Preliminary findings only. A preliminary finding is not a decision.');
  } else if (DECIDED.includes(a)) {
    push('stage:decision', R, rec.decision_date ? 'Adopted ' + rec.decision_date + '.' : null);
  } else {
    push('stage:decision', a ? U : N, a ? null : 'No decision, because no action was taken.');
  }

  /* --- final decision ------------------------------------------------ */
  if (a === 'action:final') push('stage:final', R, 'No longer subject to appeal.');
  else if (a === 'action:annulled') push('stage:final', N, 'Annulled. The decision does not stand.');
  else if (a === 'action:appealed' || rec.appeal?.status === 'appeal:pending')
    push('stage:final', N, 'Under appeal.');
  else if (a === 'action:announced') push('stage:final', NA, 'No decision has been adopted yet.');
  else if (a === 'action:commitments') push('stage:final', R, 'Closed by binding commitments.');
  else if (!a) push('stage:final', N, 'No action was taken.');
  else push('stage:final', U, 'Whether the decision has become final is not established.');

  /* --- payment / collection ------------------------------------------ */
  const p = rec.payment_status;
  if (p === 'payment:collected') push('stage:payment', R, 'Collected.');
  else if (p === 'payment:paid') push('stage:payment', R, 'Paid. Whether the authority has collected is a separate question.');
  else if (p === 'payment:unpaid') push('stage:payment', N, 'Imposed and unpaid.');
  else if (p === 'payment:not-payable') push('stage:payment', N, 'Not payable — typically because the decision is annulled or under appeal.');
  else if (p === 'payment:not-applicable') push('stage:payment', NA, 'No monetary penalty was imposed.');
  else push('stage:payment', U, 'Whether money has moved is not publicly determinable.');

  /* --- remedy --------------------------------------------------------- */
  const rm = rec.remedy_status;
  if (rm === 'remedy:implemented') push('stage:remedy', R, 'Remedy implemented.');
  else if (rm === 'remedy:ordered') push('stage:remedy', R, 'Remedy ordered. Whether it was implemented is a further question.');
  else if (rm === 'remedy:none') push('stage:remedy', N, 'No remedy ordered.');
  else push('stage:remedy', U, 'Not established.');

  /* --- behavioural change --------------------------------------------- */
  const b = rec.behavioural_outcome;
  if (b === null || b === undefined) push('stage:behaviour', U, 'Not researched. A null field means nobody has looked.');
  else if (String(b).toLowerCase() === 'unknown') push('stage:behaviour', U, 'Researched. Not publicly determinable.');
  else push('stage:behaviour', R, String(b));

  return out;
}

/** How far the pipeline demonstrably got, for sorting and for the summary. */
export function depth(stages) {
  let d = 0;
  for (let i = 0; i < stages.length; i++) if (stages[i].state === R) d = i + 1;
  return d;
}

/**
 * Aggregate a set of records WITHOUT turning unknown into zero.
 *
 * Every figure comes back with the number of records it could not account
 * for. A total that silently omits eleven unknown payment statuses is a
 * false total, and the brief's whole argument is about exactly that gap.
 */
export function aggregate(records, ix) {
  const out = {
    count: records.length,
    fined: 0,
    announcedEur: 0,
    announcedUnknownAmount: 0,
    paidEur: 0,
    paymentKnown: 0,
    paymentUnknown: 0,
    byStage: {},
  };
  for (const s of STAGES) out.byStage[s.id] = { reached: 0, notReached: 0, unknown: 0, na: 0 };

  for (const rec of records) {
    if (rec.fine_eur != null) { out.fined++; out.announcedEur += rec.fine_eur; }
    else if (rec.action_status && rec.payment_status !== 'payment:not-applicable') out.announcedUnknownAmount++;

    const p = rec.payment_status;
    if (p === 'payment:collected' || p === 'payment:paid') {
      out.paymentKnown++;
      if (rec.fine_eur != null) out.paidEur += rec.fine_eur;
    } else if (p === 'payment:unpaid' || p === 'payment:not-payable' || p === 'payment:not-applicable') {
      out.paymentKnown++;
    } else {
      out.paymentUnknown++;
    }

    for (const st of derive(rec, ix)) {
      const b = out.byStage[st.id];
      if (st.state === R) b.reached++;
      else if (st.state === N) b.notReached++;
      else if (st.state === NA) b.na++;
      else b.unknown++;
    }
  }
  return out;
}
