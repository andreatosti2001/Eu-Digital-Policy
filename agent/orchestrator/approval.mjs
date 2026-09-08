/* ============================================================
   agent/orchestrator/approval.mjs — approval as governed system
   state, re-derived here and believed from nowhere

   SESSION 22, APPROVAL STATE: "The Orchestrator MUST treat approval
   as governed system state. It MUST NOT trust: UI state; frontend
   flags; user-supplied approval parameters; filenames; comments;
   agent claims that something was approved."

   NONE OF THOSE SIX REACHES THIS FILE, and that is arranged rather
   than promised. `events.mjs` strips every approval-shaped field at
   intake and names what it stripped. What is left is a proposal id,
   and this module reads everything else out of the two stores that
   own it: `agent/records/` for the proposal, and
   `agent/implement/decisions/decisions.jsonl` for the grant.

   IT DOES NOT REIMPLEMENT `deriveApproval`. There is one home for
   the fact of a decision and one function that derives its state,
   and a second implementation here would be a second answer to the
   same question — which is the failure this repository's whole data
   architecture is arranged against. What this module adds is the
   part `deriveApproval` does not do: the eight checks SESSION 22
   requires BEFORE an approved proposal is routed to implementation,
   including the one nothing else performs.

   THE ONE NOTHING ELSE PERFORMS: implementation scope must match
   approved scope. `agent/implement/preflight.mjs` derives the
   permitted set from the proposal, and `agent/implement/apply.mjs`
   enforces it afterwards against git. Neither compares the set
   against WHAT WAS ASKED FOR, because nothing was previously in a
   position to ask. A routing request that names a file the proposal
   does not is a scope expansion attempt, and it is refused with the
   difference named — never intersected down to the permitted set
   and run anyway, which would let a caller discover the permitted
   set by asking for everything.

   ATTRIBUTION, AND WHAT THIS CAN AND CANNOT ESTABLISH. The ledger
   proves a decision exists, is bound to the proposal's hash, and is
   not signed by any agent in this system. It does not prove the
   decider was AUTHENTICATED: `node agent/implement/cli.mjs decide`
   writes a grant from a machine with no login, and the ledger's own
   header says so. Where a Control Room audit trail is present on
   this machine, this module corroborates the grant against it and
   says whether it found the entry. Where there is none, it reports
   `no_trail_here` — not `false`, which would be a finding about the
   decision, and not `true`, which would be a fabrication. A fresh
   clone and a CI runner have no trail, and reporting that as an
   unauthenticated approval would be exactly the substitution
   `docs/AI-SAFE-BOUNDARIES.md` §0.4 prohibits.
   ============================================================ */

import { deriveApproval, IMPLEMENTABLE, proposalFingerprint, readAgentRecords, readLedger } from '../implement/ledger.mjs';
import { preflight } from '../implement/preflight.mjs';
import { permittedFiles } from '../implement/scope.mjs';
import { readControlRoomAudit } from '../health/gather.mjs';
import { AUTONOMY_CLASSES } from '../schemas/types.mjs';

/** The eight SESSION 22 names, in the order it names them. */
export const ROUTING_CHECKS = Object.freeze([
  'proposal_exists',
  'proposal_approvable',
  'approval_attributable',
  'scope_defined',
  'provenance_complete',
  'required_tests_satisfied',
  'risk_satisfied',
  'implementation_scope_matches',
]);

/** How a preflight gate answers each of the first seven. Mapped
 *  rather than reimplemented, so a gate tightened in
 *  `preflight.mjs` tightens this too. */
const FROM_PREFLIGHT = Object.freeze({
  proposal_exists: 'proposal_exists',
  scope_defined: 'scope_defined',
  provenance_complete: 'provenance_complete',
  required_tests_satisfied: 'required_tests_defined',
  risk_satisfied: 'risk_defined',
});

const ok = (check, why, data = {}) => ({ check, ok: true, why, ...data });
const no = (check, why, closes, data = {}) => ({ check, ok: false, why, closes, ...data });

/**
 * Everything that must be true before an approved proposal is
 * routed to implementation.
 *
 * @param {string} proposalId
 * @param {{records?:object, ledger?:object, requestedScope?:string[]|null,
 *          root?:string, audit?:object}} ctx
 */
export function verifyForImplementation(proposalId, { records, ledger, requestedScope = null, root, audit } = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const approval = deriveApproval(proposalId, { records: rec, ledger: led });
  const pf = preflight(proposalId, { records: rec, ledger: led });
  const proposal = approval.proposal;
  const checks = [];

  /* The five that preflight already answers, lifted rather than
     re-derived. A gate named twice in preflight fails here if
     either instance failed. */
  for (const [check, gate] of Object.entries(FROM_PREFLIGHT)) {
    const instances = pf.gates.filter((g) => g.gate === gate);
    const failed = instances.filter((g) => !g.ok);
    checks.push(failed.length
      ? no(check, failed.map((g) => g.why).join(' · '), failed.map((g) => g.closes).join(' · '), { gate })
      : ok(check, instances.map((g) => g.why).join(' · ') || `${gate} passed`, { gate }));
  }

  /* ------------------------------------------ approvable state */
  checks.push(IMPLEMENTABLE.includes(approval.state)
    ? ok('proposal_approvable', approval.why, { state: approval.state })
    : no('proposal_approvable', `approval state is "${approval.state}": ${approval.why}`,
      approval.state === 'pending'
        ? 'a person decides it, through the Control Room or node agent/implement/cli.mjs decide. Nothing an agent writes into agent/records/ substitutes, and nothing on the event that opened this workflow was read.'
        : 'the grant has to exist, in agent/implement/decisions/decisions.jsonl, bound to this proposal as it now stands.',
      { state: approval.state, discarded_agent_claims: approval.discarded }));

  /* -------------------------------- attributable, and to whom */
  checks.push(attribution(approval, proposal, { root, audit }));

  /* ------------------------ implementation scope vs approved scope */
  checks.push(scopeMatch(proposal, requestedScope));

  const failed = checks.filter((c) => !c.ok);
  return {
    proposal_id: proposalId,
    ok: failed.length === 0,
    checks,
    failed,
    approval,
    preflight: { ok: pf.ok, summary: pf.summary, failed: pf.failed.map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })) },
    scope: pf.scope,
    requested_scope: requestedScope,
    summary: failed.length === 0
      ? `all ${ROUTING_CHECKS.length} routing checks pass for "${proposalId}". It may be ROUTED to the Implementation Agent, which then re-derives the same authorization through its own ten gates. Routing is not implementing and neither is publishing.`
      : `${failed.length} routing check(s) refuse "${proposalId}": ${failed.map((f) => f.check).join(', ')}`,
  };
}

/* ---------------------------------------------------------- attribution */

function attribution(approval, proposal, { root, audit } = {}) {
  const d = approval.decision;
  if (!d) {
    return no('approval_attributable', 'there is no decision to attribute.',
      'a grant is a line in agent/implement/decisions/decisions.jsonl naming who, when, and the proposal fingerprint they decided against.');
  }

  const complete = Boolean(d.decided_by && d.decided_at && d.proposal_sha256);
  const binds = Boolean(proposal) && d.proposal_sha256 === proposalFingerprint(proposal);

  const trail = audit ?? readControlRoomAudit({ root: root ?? undefined });
  const corroboration = corroborate(trail, d);

  if (!complete || !binds) {
    return no('approval_attributable',
      complete
        ? `the decision was taken against fingerprint ${String(d.proposal_sha256).slice(0, 12)} and the proposal now fingerprints ${proposal ? proposalFingerprint(proposal).slice(0, 12) : 'nothing — it is not in the record store'}.`
        : `the decision is incomplete: decided_by=${d.decided_by ?? 'null'}, decided_at=${d.decided_at ?? 'null'}, fingerprint=${d.proposal_sha256 ? 'present' : 'null'}.`,
      binds
        ? 'an approval carries who, when, and exactly what they were approving.'
        : 'an approval authorises the exact scope it was given. A proposal edited after it was decided goes back for a fresh decision against the scope it now has.',
      { authenticated: corroboration.state, corroboration });
  }

  return ok('approval_attributable',
    `decided by ${d.decided_by} at ${d.decided_at}, bound to fingerprint ${d.proposal_sha256.slice(0, 12)}. Authentication: ${corroboration.why}`,
    { decided_by: d.decided_by, authenticated: corroboration.state, corroboration });
}

/**
 * Was this grant taken through the authenticated path?
 *
 * Three answers, and the third is the one that matters:
 *   authenticated   an audit entry on this machine matches the
 *                   proposal AND the fingerprint, and names an
 *                   authenticated operator.
 *   unauthenticated a trail exists here and holds no entry for this
 *                   decision — so it was written by the CLI path,
 *                   which has no login.
 *   no_trail_here   there is no trail on this machine. Nothing can
 *                   be said. NOT false, and not true.
 */
function corroborate(trail, decision) {
  if (!trail || !trail.present) {
    return {
      state: 'no_trail_here',
      why: 'no Control Room audit trail exists on this machine, so whether this grant was taken through an authenticated session cannot be established here. A fresh clone and a CI runner have none — the trail is git-ignored private state. Reporting that as "unauthenticated" would be a finding about the decision; reporting it as "authenticated" would be a fabrication.',
      entries_searched: 0,
    };
  }
  const match = (trail.entries ?? []).find((e) =>
    ['proposal.approved', 'proposal.rejected'].includes(e.action)
    && e.proposal_id === decision.proposal_id
    && e.proposal_sha256 === decision.proposal_sha256);

  if (match) {
    return {
      state: 'authenticated',
      why: `an audit entry on this machine records ${match.action} for this proposal at the same fingerprint, by operator ${match.actor_id ?? match.actor_subject ?? 'unnamed'} — the Control Room authenticates and then authorizes before it writes one.`,
      entries_searched: trail.entries.length,
      audit_entry: { ts: match.ts ?? null, action: match.action, actor: match.actor_subject ?? null },
    };
  }
  return {
    state: 'unauthenticated',
    why: `a Control Room audit trail exists on this machine and holds no entry for this decision at this fingerprint. That is what a grant written by "node agent/implement/cli.mjs decide" looks like: attributable to a named person, bound to the proposal, and taken from a machine with no login. agent/implement/ledger.mjs says so in its own header, and this is the check that makes it visible rather than remembered.`,
    entries_searched: trail.entries.length,
  };
}

/* ---------------------------------------------------------- scope */

/**
 * Implementation scope against approved scope.
 *
 * The permitted set is derived from the STORED PROPOSAL. A request
 * that names nothing is fine — the permitted set governs. A request
 * that names a subset is fine, and is recorded. A request that
 * names anything outside the permitted set is REFUSED, with the
 * difference, and is not quietly narrowed: narrowing would let a
 * caller learn the permitted set by asking for the whole tree and
 * reading what came back.
 */
export function scopeMatch(proposal, requestedScope) {
  if (!proposal) {
    return no('implementation_scope_matches', 'there is no proposal, so there is no approved scope to match.',
      'the proposal has to exist in the record store before anything can be routed against it.');
  }
  const derived = permittedFiles(proposal);
  const permitted = derived.permitted ?? [];

  if (derived.refusals?.length) {
    return no('implementation_scope_matches',
      `the proposal itself names ${derived.refusals.length} path(s) no agent may write: ${derived.refusals.map((r) => r.path).join(', ')}`,
      derived.refusals.map((r) => `${r.path}: ${r.why}`).join(' · '),
      { permitted, refusals: derived.refusals });
  }

  if (!requestedScope || !requestedScope.length) {
    return ok('implementation_scope_matches',
      `no scope was requested, so the ${permitted.length} path(s) derived from the proposal govern. Scope is read from the stored proposal and never from the request.`,
      { permitted, requested: null });
  }

  const outside = requestedScope.filter((p) => !permitted.includes(p));
  if (outside.length) {
    return no('implementation_scope_matches',
      `the request names ${outside.length} path(s) the approved proposal does not: ${outside.join(', ')}`,
      'an approval authorises the scope it was given. The request is refused rather than narrowed to the permitted set — narrowing would let a caller discover the permitted set by asking for everything and reading what came back. If those paths belong in the change, they belong in the proposal, and the proposal then needs a fresh decision.',
      { permitted, requested: requestedScope, outside });
  }

  return ok('implementation_scope_matches',
    `every one of the ${requestedScope.length} requested path(s) is inside the ${permitted.length} the approved proposal derives.`,
    { permitted, requested: requestedScope });
}

/**
 * The honest one-line answer to "what may be implemented right
 * now", over the real stores. Used by the CLI and by the Control
 * Room's workflow view.
 */
export function routableProposals({ records, ledger, root } = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const trail = readControlRoomAudit({ root: root ?? undefined });
  const out = [];
  for (const [id, r] of rec.byId) {
    let kind = null;
    try { kind = r.autonomy_class && r.proposed_change ? 'proposal' : null; } catch { kind = null; }
    if (!kind) continue;
    if (!AUTONOMY_CLASSES.includes(r.autonomy_class)) continue;
    const v = verifyForImplementation(id, { records: rec, ledger: led, root, audit: trail });
    out.push({ proposal_id: id, contract: r.contract, agent: r.agent, autonomy_class: r.autonomy_class, state: v.approval.state, routable: v.ok, refused_by: v.failed.map((f) => f.check) });
  }
  return out;
}
