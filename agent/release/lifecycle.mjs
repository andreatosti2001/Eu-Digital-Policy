/* ============================================================
   agent/release/lifecycle.mjs — where a proposal is, derived

   The seven states a change passes through are not stored. A stored state is
   a second home for facts that already have one — the proposal, the ledger,
   git — and it drifts the first time someone edits one and not the other.
   They are DERIVED, on demand, from those three, and every state names the
   fact it was derived from.

     proposed                 the proposal exists; it has not passed Agent 9's
                              technical gates, or nobody has asked for approval
     technically_validated    every gate that is not about approval passes; no
                              request for human review has been filed
     awaiting_human_review    technically valid, a request is on the record,
                              and nobody has decided
     approved                 a human granted it and the content binding holds
                              (`dispatched` says whether a commit exists)
     rejected                 a human denied it
     published                a commit carrying its Dispatch-Key is an ancestor
                              of main. THIS IS "MERGED TO MAIN", the last
                              fact the tree can show: whether pages.yml then
                              deployed it is GitHub's record, not git's
     superseded_or_withdrawn  superseded: the proposal changed after the
                              decision (the binding broke); withdrawn: a grant
                              was followed by a denial

   Two more answers exist because pretending otherwise would hide them:
     invalid                  a decision exists and is void — a fixture, a
                              self-approval, a proposal nobody can produce
     unknown                  the proposal is not in the record store

   `approved` is a statement about a decision, not about the change being in
   the site. The distance between `approved` and `published` is the point of
   the dispatcher, the pull request and the gate.
   ============================================================ */

import { deriveApproval, readAgentRecords, readLedger } from '../implement/ledger.mjs';
import { preflight } from '../implement/preflight.mjs';
import { dispatchKey, findDispatches } from './dispatch.mjs';

export const STATES = ['proposed', 'technically_validated', 'awaiting_human_review', 'approved', 'rejected', 'published', 'superseded_or_withdrawn'];
export const APPROVAL_GATES = ['approved', 'approval_attributable'];

export function lifecycleOf(proposalId, { records = null, ledger = null, cwd, mainRef = null, allowSimulated = false } = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const approval = deriveApproval(proposalId, { records: rec, ledger: led, allowSimulated });
  const base = { proposal_id: proposalId, approval_state: approval.state, derived_from: [] };

  if (!approval.proposal) return { ...base, state: 'unknown', why: approval.why, derived_from: ['agent record store', 'decision ledger'] };

  const history = led.decisions.filter((d) => d.proposal_id === proposalId);
  const last = history[history.length - 1] ?? null;

  if (approval.state === 'denied') {
    const wasGranted = history.slice(0, -1).some((d) => d.outcome === 'granted');
    return wasGranted
      ? { ...base, state: 'superseded_or_withdrawn', kind: 'withdrawn', why: `granted, then denied by ${last.decided_by} on ${last.decided_at}`, derived_from: ['decision ledger (sequence)'] }
      : { ...base, state: 'rejected', why: approval.why, derived_from: ['decision ledger'] };
  }
  if (approval.state === 'void_scope_changed') {
    return { ...base, state: 'superseded_or_withdrawn', kind: 'superseded', why: approval.why, derived_from: ['decision ledger (proposal_sha256)', 'proposal'] };
  }
  if (['void_self_approved', 'void_unknown_proposal', 'void_simulated'].includes(approval.state)) {
    return { ...base, state: 'invalid', why: approval.why, derived_from: ['decision ledger'] };
  }
  if (approval.state === 'granted') {
    const key = dispatchKey({ approvalId: approval.decision.approval_id, proposalSha256: approval.decision.proposal_sha256 });
    const commits = findDispatches(key, { cwd, mainRef });
    const onMain = commits.find((c) => c.on_main);
    if (onMain) return { ...base, state: 'published', why: `commit ${onMain.sha.slice(0, 12)} is an ancestor of ${onMain.main_ref}. Merged to main; the deployment itself is GitHub's record, not git's.`, commit: onMain.sha, derived_from: ['decision ledger', 'git (Dispatch-Key)'] };
    return { ...base, state: 'approved', dispatched: commits.length > 0, commit: commits[0]?.sha ?? null, why: approval.why, derived_from: ['decision ledger', 'git (Dispatch-Key)'] };
  }

  /* no decision: technically valid or not, and has a human been asked? */
  const pre = preflight(proposalId, { records: rec, ledger: led });
  const technical = pre.gates.filter((g) => !APPROVAL_GATES.includes(g.gate));
  const technicallyOk = technical.every((g) => g.ok);
  if (!technicallyOk) return { ...base, state: 'proposed', why: `${technical.filter((g) => !g.ok).map((g) => g.gate).join(', ')} not satisfied`, derived_from: ['preflight gates'] };
  if (approval.state === 'pending') return { ...base, state: 'awaiting_human_review', why: approval.why, derived_from: ['preflight gates', 'ApprovalRequest'] };
  return { ...base, state: 'technically_validated', why: 'every technical gate passes and no request for human review is on the record', derived_from: ['preflight gates'] };
}
