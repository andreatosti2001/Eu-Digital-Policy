/* ============================================================
   agent/autonomy/facts.mjs — the two supplied conditions, supplied
   from something that actually looked

   `agent/policy/conditions.mjs` says it plainly: four of the twelve
   mandatory conditions are MEASUREMENTS and must be supplied, because
   running the validators takes ninety seconds and opening a browser
   takes longer, and "within one process a caller can pass a false
   fact". Two of the four — the validators and the browser suite — are
   measured by the cycle itself, from runs that just happened.

   THE OTHER TWO ARE THIS FILE, AND THEY ARE THE EASY ONES TO FAKE.
   `verification_succeeded` and `no_unresolved_conflict` both accept a
   small object, and both are satisfied by `{ succeeded: true }` and
   `{ found: 0 }`. An autonomy layer that wrote those two literals
   would have switched off two of the twelve conditions while
   appearing to satisfy them — the exact shape of failure SESSION 19
   found and SESSION 23 named: a check that passes for the wrong
   reason.

   SO BOTH ARE DERIVED FROM THE RECORD STORE, AND BOTH RETURN
   `undefined` RATHER THAN A DEFAULT WHERE THERE IS NOTHING TO READ.
   An absent fact is `unknown` in the engine and `unknown` does not
   execute. That is the whole mechanism: this file's failure mode is
   refusing a change that could have been made, not making one that
   should not have been.

   WHAT NEITHER OF THEM PROVES. A VerificationRecord in the store says
   an agent checked a proposition against evidence it retrieved. It
   does not say the proposition is true, and
   `docs/VERIFICATION-POLICY.md` §3 is the standing statement of that.
   The conflict scan sees the six shapes a machine can see in records;
   two records can disagree in prose that nothing in this repository
   reads.
   ============================================================ */

import { VERIFICATION_VERDICTS } from '../schemas/types.mjs';

/** The verdicts that are a verification SUCCEEDING. The other four —
 *  contradicted, conflict, not_determinable, source_unavailable — are
 *  findings, and `agent/policy/conditions.mjs` treats each of them as
 *  a failure rather than as an absence. */
export const CONFIRMING_VERDICTS = ['confirmed', 'partially_confirmed'];

/** Every entity a record is about, as a comparable key. Path first,
 *  because a proposal about a dataset names paths and a verification
 *  about a claim names ids, and a change that cannot be matched to a
 *  verification must read as unmatched rather than as verified. */
export function entityKeys(record) {
  const out = new Set();
  for (const e of record?.affected_entities ?? []) {
    if (e.id) out.add(`id:${e.id}`);
    if (e.path) out.add(`path:${e.path}${e.field ? `#${e.field}` : ''}`);
    if (e.path) out.add(`file:${e.path}`);
  }
  for (const op of record?.proposed_change?.operations ?? []) {
    const t = String(op.target ?? '').trim();
    if (t) out.add(`target:${t}`);
  }
  return out;
}

/**
 * Has anything in this repository verified what this proposal turns
 * on?
 *
 * @param {object} proposal
 * @param {Map<string,object>} byId every contract record in the store
 * @returns {object|undefined} a `facts.verification`, or undefined
 */
export function verificationFact(proposal, byId) {
  const wanted = entityKeys(proposal);
  const relevant = [];
  for (const r of byId?.values?.() ?? []) {
    if (r.contract !== 'VerificationRecord') continue;
    if (r.simulated === true) continue;
    const keys = entityKeys(r);
    if ([...keys].some((k) => wanted.has(k))) relevant.push(r);
  }

  if (!relevant.length) {
    /* NOT `{ succeeded: false }`. "Nobody has verified this" and "the
       verification failed" are different facts, and the engine's
       three verdicts exist so that the first one does not have to be
       written as the second. Returning undefined leaves the condition
       `unknown`, which blocks exactly as a failure does and says the
       true thing on the trace. */
    return undefined;
  }

  /* A superseded verification is not a verification. */
  const superseded = new Set(relevant.map((r) => r.supersedes).filter(Boolean));
  const live = relevant.filter((r) => !superseded.has(r.verification_id));

  const verdicts = live.map((r) => ({
    verdict: r.verdict,
    verification_id: r.verification_id,
    statement: String(r.statement ?? '').slice(0, 200),
    checked_by: r.checked_by ?? null,
    checked_at: r.checked_at ?? null,
  }));

  return {
    verdicts,
    why: `${live.length} live VerificationRecord(s) in the record store bear on this proposal's entities${superseded.size ? `, ${superseded.size} superseded one(s) excluded` : ''}. Verdicts: ${[...new Set(verdicts.map((v) => v.verdict))].join(', ')}.`,
    bound: 'docs/VERIFICATION-POLICY.md §3: a verification says an agent checked a proposition against evidence it retrieved. It does not say the proposition is true.',
  };
}

/**
 * Does anything in the store disagree with this proposal?
 *
 * Four shapes, each read off records rather than judged:
 *   1 · the proposal's own conflicts/contradictions arrays
 *   2 · a VerificationRecord over the same entities whose verdict is
 *       `contradicted` or `conflict`
 *   3 · another live proposal writing the same target
 *   4 · a DataGap over the same entities whose blocking question is
 *       open
 *
 * @returns {object|undefined}
 */
export function conflictFact(proposal, byId) {
  if (!byId || typeof byId.values !== 'function') return undefined;

  const wanted = entityKeys(proposal);
  const selfId = proposal?.proposal_id ?? proposal?.change_id ?? null;
  const items = [];

  for (const c of [...(proposal?.conflicts ?? []), ...(proposal?.contradictions ?? [])]) {
    items.push({ kind: 'declared_by_proposal', what: typeof c === 'string' ? c : JSON.stringify(c).slice(0, 200) });
  }

  for (const r of byId.values()) {
    if (r.simulated === true) continue;
    const keys = entityKeys(r);
    const overlaps = [...keys].some((k) => wanted.has(k));
    if (!overlaps) continue;

    if (r.contract === 'VerificationRecord' && ['contradicted', 'conflict'].includes(r.verdict)) {
      items.push({ kind: 'verification_disagrees', what: `${r.verification_id}: verdict "${r.verdict}" over "${String(r.statement ?? '').slice(0, 120)}"` });
    }
    if (r.contract === 'DataGap' && (r.epistemic?.unresolved ?? []).some((u) => u.blocks)) {
      items.push({ kind: 'open_blocking_gap', what: `${r.gap_id ?? r.data_gap_id ?? 'gap'}: a blocking open question over the same entity` });
    }
    if (r.contract?.endsWith('Proposal')) {
      const otherId = r.proposal_id ?? r.change_id ?? null;
      if (otherId && otherId !== selfId) {
        const sharedTargets = [...entityKeys(r)].filter((k) => k.startsWith('target:') && wanted.has(k));
        if (sharedTargets.length) {
          items.push({ kind: 'competing_proposal', what: `${otherId} (${r.contract}, ${r.agent}) writes the same target(s): ${sharedTargets.map((t) => t.slice(7)).join(', ')}` });
        }
      }
    }
  }

  return {
    found: items.length,
    items,
    why: items.length
      ? `${items.length} disagreement(s) found by scanning the record store for verifications, gaps and competing proposals over the same entities.`
      : 'the record store was scanned for a contradicting verification, an open blocking gap and a competing proposal over the same entities, and none was found.',
    bound: 'Four shapes, all read off records. Two records can disagree in prose, and nothing in this repository reads prose.',
  };
}

/** Both, with the reasoning kept where a reader will find it. */
export function deriveFacts(proposal, byId) {
  const verification = verificationFact(proposal, byId);
  const conflicts = conflictFact(proposal, byId);
  return {
    verification,
    conflicts,
    /* Reported so the trace records that an absence was an absence
       rather than an omission. */
    derivation: {
      verification: verification
        ? verification.why
        : 'no VerificationRecord in the store bears on this proposal\'s entities, so the fact is absent rather than false. The condition evaluates "unknown", and unknown does not execute.',
      conflicts: conflicts?.why ?? 'the record store could not be read.',
      verdict_vocabulary: VERIFICATION_VERDICTS,
    },
  };
}
