/* ============================================================
   .control-room/decide.mjs — the one place a human decision enters
   the system through HTTP

   WHAT AN APPROVAL IS HERE, SAID FIRST BECAUSE EVERYTHING ELSE
   FOLLOWS FROM IT. Approving a proposal writes ONE line, to
   `agent/implement/decisions/decisions.jsonl`, through
   `agent/implement/ledger.mjs recordDecision` — the same function
   `node agent/implement/cli.mjs decide` calls, and the only code
   path in this repository that writes a grant. It changes no
   dataset, no page, no stylesheet and no locale. It runs no
   validator, no build and no deployment. It does not touch git.
   Nothing is published.

   That is not an omission to be fixed later. Protocol §13: "Approval
   MUST NOT directly publish to production." An approval is an
   AUTHORIZATION FOR A SCOPE; the Implementation Agent then re-derives
   that authorization from the ledger, independently, through its own
   ten gates, and refuses if any of them says no. `selftest.mjs`
   asserts the negative directly: after an approval, every file in the
   working tree is byte-identical except the ledger.

   THE SEVEN GATES, IN ORDER, ALL SERVER-SIDE.

     1 · the action is one of the three                    400
     2 · the proposal exists in the record store           404
     3 · the actor holds the permission FOR THIS PROPOSAL'S
         AUTONOMY CLASS                                    403
     4 · the request is bound to the exact proposal the
         reviewer saw                                      409
     5 · the proposal is in a governed state to decide     409
     6 · every governance gate that does not depend on the
         approval itself passes                            409
     7 · the ledger accepts it — content-bound, no
         self-approval, an ApprovalRequest exists          409

   Gate 4 is the answer to "proposal scope cannot be expanded through
   request manipulation". The request carries a FINGERPRINT and
   nothing else about scope: the scope is read from the stored
   proposal, never from the body. A body naming extra files is
   rejected outright by the strict field check in `server.mjs`, and
   even if it were not, nothing here would read it. And because
   `recordDecision` binds the decision to the proposal's hash,
   editing the proposal after approval voids the approval rather than
   carrying it onto a widened scope.

   REQUEST CHANGES IS NOT AN APPROVAL STATE. It writes no ledger
   line, because the ledger holds grants and denials and a request
   for changes is neither. It is a review annotation: audited, traced,
   shown in the queue, and it leaves `deriveApproval()` reporting
   `pending`, which is what is true. Giving it a ledger state would
   put a second home under the fact of a decision.
   ============================================================ */

import { appendFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { deriveApproval, recordDecision, proposalFingerprint, readAgentRecords, readLedger, surveyProposals, SelfApprovalRefused, UnknownProposal, DECISION_DIR } from '../agent/implement/ledger.mjs';
import { preflight } from '../agent/implement/preflight.mjs';
import { getContract } from '../agent/schemas/registry.mjs';
import { authorize, approvalPermissionFor } from './authz.mjs';

export const REVIEW_ACTIONS = ['approve', 'reject', 'request_changes'];

/** Gates 6 checks every preflight gate EXCEPT these two. They are
 *  excluded because they are about the approval, and the approval is
 *  what is being decided — requiring them before the decision would
 *  make every first decision impossible. Named rather than filtered
 *  by index so a gate added to preflight later is checked by
 *  default. */
export const GATES_ABOUT_THE_APPROVAL_ITSELF = new Set(['approved', 'approval_attributable']);

/** States a proposal may be decided from. Everything else is a
 *  refusal with its own reason. */
export const DECIDABLE_STATES = ['pending'];

export class DecisionRefused extends Error {
  constructor(message, { status = 409, code = 'refused', detail = null, fix = null } = {}) {
    super(message); this.name = 'DecisionRefused'; this.status = status; this.code = code; this.detail = detail; this.fix = fix;
  }
}


/* ---------------------------------------------------------- reading */

/**
 * The review queue: every proposal any agent has produced, with its
 * derived approval state and the trace a reviewer needs.
 *
 * Note what travels with each item. Not just the proposal — the
 * evidence it stands on, the open questions it could not settle, the
 * agent run that produced it, the tests it requires, the files its
 * approval would permit, and the gates that currently refuse it.
 * Protocol §9 asks for the whole chain, and a queue that showed a
 * title and two buttons would be asking somebody to approve a
 * sentence.
 */
export function reviewQueue(cfg, { records, ledger, reviews } = {}) {
  const rec = records ?? readAgentRecords({ dir: cfg.records_dir });
  const led = ledger ?? readLedger({ dir: cfg.decision_dir });
  const notes = reviews ?? readAllReviewNotes(cfg);
  const survey = surveyProposals({ records: rec, ledger: led });

  return survey.map((item) => {
    const p = item.proposal;
    const pf = preflight(item.proposal_id, { records: rec, ledger: led });
    const gates = pf.gates.filter((g) => !GATES_ABOUT_THE_APPROVAL_ITSELF.has(g.gate));
    return {
      proposal_id: item.proposal_id,
      contract: item.contract,
      agent: item.agent,
      created_at: p.created_at,
      summary: p.proposed_change?.summary ?? null,
      reason: p.reason ?? null,
      risk: p.risk ?? null,
      autonomy_class: p.autonomy_class ?? null,
      confidence: p.confidence ?? null,
      approval: { state: item.approval.state, why: item.approval.why, approval_id: item.approval.approval_id, decision: item.approval.decision, discarded: item.approval.discarded },
      /* The exact version this queue is showing. A decision must
         quote it back, and a proposal edited in between will not
         match. */
      fingerprint: proposalFingerprint(p),
      permission_required: approvalPermissionFor(p),
      trace: {
        source_to_evidence: (p.evidence ?? []).map((e) => ({ kind: e.kind, locator: e.locator ?? null, source_id: e.source_id ?? null, quote: e.quote ?? null })),
        epistemic: p.epistemic ?? null,
        affected_entities: p.affected_entities ?? [],
        agent_run: p.trace_ref ?? null,
        operations: p.proposed_change?.operations ?? [],
        required_tests: p.validation_requirements ?? [],
        rollback: p.rollback_plan ?? null,
        permitted_files: pf.scope?.permitted ?? [],
        touches_legal_record: pf.scope?.touches_legal_record ?? null,
        requires_browser_qa: pf.scope?.requires_browser_qa ?? null,
      },
      /* Gates that would refuse implementation even after approval.
         Shown BEFORE the decision, because approving something that
         cannot be implemented wastes the only scarce thing in this
         system, which is human attention. */
      blocking_gates: gates.filter((g) => !g.ok).map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })),
      review_notes: notes[item.proposal_id] ?? [],
      /* Said on every item, because the button is the place somebody
         would assume otherwise. */
      approval_effect: 'Recording a grant in agent/implement/decisions/decisions.jsonl. It publishes nothing: the Implementation Agent re-derives the authorization and runs its own gates before anything is written to the site.',
    };
  });
}

export function proposalDetail(cfg, proposalId, ctx = {}) {
  return reviewQueue(cfg, ctx).find((i) => i.proposal_id === proposalId) ?? null;
}

/* ------------------------------------------------- review notes */

const reviewsDir = (cfg) => join(cfg.state_dir, 'reviews');

export function readAllReviewNotes(cfg) {
  const dir = reviewsDir(cfg);
  if (!existsSync(dir)) return {};
  const out = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.jsonl')) continue;
    const id = f.replace(/\.jsonl$/, '');
    /* A line that does not parse is dropped rather than thrown on:
       these are annotations, and one corrupt note must not make a
       whole queue unreadable. The decision ledger and the audit
       trail — the two records that carry authority — report their
       malformed lines instead, because there a silent drop would be
       a record that can be made to forget. */
    out[id] = readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  }
  return out;
}

function appendReviewNote(cfg, proposalId, note) {
  const dir = reviewsDir(cfg);
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, `${proposalId}.jsonl`), `${JSON.stringify(note)}\n`, { encoding: 'utf8', mode: 0o600 });
  return note;
}

/* ---------------------------------------------------------- deciding */

/**
 * Approve, reject, or request changes on one proposal.
 *
 * @param {object} cfg
 * @param {{actor:object, action:string, proposalId:string, fingerprint:string,
 *          note?:string|null, session?:object|null, request?:object|null,
 *          audit:object, tracer?:object|null,
 *          records?:object, ledger?:object, decisionDir?:string}} args
 */
export function decide(cfg, {
  actor, action, proposalId, fingerprint, note = null,
  session = null, request = null, audit, tracer = null,
  records, ledger, decisionDir = null, now = () => new Date().toISOString(),
}) {
  const dir = decisionDir ?? cfg.decision_dir ?? DECISION_DIR;
  const rec = records ?? readAgentRecords({ dir: cfg.records_dir });
  const led = ledger ?? readLedger({ dir });

  const refuse = (err, extra = {}) => {
    audit.record({
      action: 'proposal.decision_refused', outcome: 'refused',
      actor, session, request, proposal_id: proposalId,
      reason: err.message, detail: { requested_action: action, code: err.code, ...err.detail, ...extra },
    });
    throw err;
  };

  /* 1 ------------------------------------------------ known action */
  if (!REVIEW_ACTIONS.includes(action)) {
    refuse(new DecisionRefused(`"${action}" is not a review action`, { status: 400, code: 'unknown_action', fix: `one of: ${REVIEW_ACTIONS.join(', ')}.` }));
  }

  /* 2 ---------------------------------------------- proposal exists */
  const proposal = rec.byId.get(proposalId) ?? null;
  if (!proposal) {
    refuse(new DecisionRefused(`no agent record store holds a proposal with id "${proposalId}"`, {
      status: 404, code: 'unknown_proposal',
      fix: 'run the producing agent so the proposal exists as a record. An id in a request body is not a proposal, and a decision about one nobody can produce authorises nothing.',
    }));
  }
  let contract = null;
  try { contract = getContract(proposal.contract); } catch { /* reported next */ }
  if (!contract || contract.kind !== 'proposal') {
    refuse(new DecisionRefused(`"${proposalId}" is a ${proposal.contract}, whose contract kind is "${contract?.kind ?? 'unknown'}", not "proposal"`, {
      status: 409, code: 'not_a_proposal',
      fix: 'a finding, a record or an observation is not something to decide.',
    }));
  }

  /* 3 ------------------------------------------------- permission
     Which permission depends on the PROPOSAL, not on the request. A
     human_only proposal needs the administrator-only permission, and
     an unrecognised autonomy class takes the strictest one, because
     docs/AUTONOMY-POLICY.md says the default when unsure is the
     higher class. */
  const required = action === 'approve'
    ? approvalPermissionFor(proposal)
    : action === 'reject' ? 'proposal:reject' : 'proposal:request_changes';
  const decision = authorize({ actor, action: required, resource: { kind: 'proposal', id: proposalId } });
  if (!decision.allow) {
    audit.record({
      action: 'authz.denied', outcome: 'denied', actor, session, request,
      proposal_id: proposalId, reason: decision.reason,
      detail: { required, requested_action: action, autonomy_class: proposal.autonomy_class ?? null },
    });
    throw new DecisionRefused(decision.reason, {
      status: 403, code: 'forbidden',
      fix: required === 'proposal:approve:human_only'
        ? 'this proposal is human_only (red tier). Only an administrator may approve one — docs/AUTONOMY-POLICY.md Class D requires authorization named and recorded from the repository author.'
        : 'ask an administrator for the role this action needs.',
    });
  }

  /* 4 ------------------------------- bound to the exact proposal
     The reviewer decided about a version. This is the check that
     stops "approve something small, then widen it" from working
     through a stale screen or a replayed request. */
  const current = proposalFingerprint(proposal);
  if (!fingerprint) {
    refuse(new DecisionRefused('the request does not say which version of the proposal was reviewed', {
      status: 400, code: 'no_fingerprint',
      fix: 'send the `fingerprint` the queue showed you. A decision that does not name the version it decided cannot be bound to a scope.',
    }));
  }
  if (fingerprint !== current) {
    refuse(new DecisionRefused(`the proposal has changed since it was displayed: reviewed ${String(fingerprint).slice(0, 12)}, current ${current.slice(0, 12)}`, {
      status: 409, code: 'scope_changed',
      detail: { reviewed: String(fingerprint).slice(0, 12), current: current.slice(0, 12) },
      fix: 'reload the proposal and read it again. An approval authorises the exact scope it was given; it does not follow a proposal that has been edited since.',
    }));
  }

  /* 5 --------------------------------------- a governed state to
     decide from. A denied proposal is NOT re-approvable by sending
     the request again: reopening it means the producing agent
     raising a fresh ApprovalRequest, which is a governed state
     transition rather than a second opinion. */
  const before = deriveApproval(proposalId, { records: rec, ledger: led });
  if (!DECIDABLE_STATES.includes(before.state)) {
    refuse(new DecisionRefused(`the proposal's approval state is "${before.state}", which is not a state a decision may be taken from: ${before.why}`, {
      status: 409, code: `state_${before.state}`,
      detail: { state: before.state, previous_decision: before.decision ?? null },
      fix: before.state === 'denied'
        ? 'a denied proposal is reopened by the producing agent raising a fresh ApprovalRequest, not by deciding it again. Approving over a denial through the same endpoint would make the denial advisory.'
        : before.state === 'granted'
          ? 'it has already been decided. The grant is in agent/implement/decisions/decisions.jsonl.'
          : before.state === 'no_request'
            ? 'no ApprovalRequest names this proposal. A decision is a decision ON a request; without one there is no record of what the human was asked to check.'
            : 'the proposal has to come back through its producing agent before anybody decides it.',
    }));
  }

  /* 6 --------------------------- the governance gates that do not
     depend on the approval. Approving something that cannot be
     implemented is not harmless: it spends the scarcest thing in
     this system, which is a person having read the evidence. */
  const pf = preflight(proposalId, { records: rec, ledger: led });
  const blocking = pf.failed.filter((g) => !GATES_ABOUT_THE_APPROVAL_ITSELF.has(g.gate));
  if (action === 'approve' && blocking.length) {
    refuse(new DecisionRefused(`${blocking.length} governance gate(s) refuse this proposal independently of the approval: ${[...new Set(blocking.map((g) => g.gate))].join(', ')}`, {
      status: 409, code: 'gates_refuse',
      detail: { gates: blocking.map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })) },
      fix: 'these are the Implementation Agent\'s own gates, checked here so an approval is not granted for something that would then be refused. Every one of them is closed by the producing agent, not by approving harder.',
    }), { gates: blocking.map((g) => g.gate) });
  }

  /* ----------------------------------- request changes: no ledger */
  if (action === 'request_changes') {
    if (!note || !String(note).trim()) {
      refuse(new DecisionRefused('a request for changes with no note asks for nothing', { status: 400, code: 'no_note', fix: 'say what has to change. "Please revise" delegates the thinking back to whoever can least reconstruct what the agent was standing on.' }));
    }
    const entry = appendReviewNote(cfg, proposalId, {
      kind: 'changes_requested',
      at: now(),
      by: actor.subject,
      actor_id: actor.operator_id,
      roles: actor.roles,
      note: String(note).slice(0, 4000),
      proposal_sha256: current,
      /* Said on the record: this is a review annotation. */
      effect: 'a review annotation. It writes no line in the decision ledger and does not change deriveApproval(), which still reports "pending" — because that is what is true.',
    });
    const trace = emitTrace(tracer, { action, actor, proposal, proposalId, before: before.state, after: 'pending', note, fingerprint: current });
    const audited = audit.record({
      action: 'proposal.changes_requested', outcome: 'allowed',
      actor, session, request,
      proposal_id: proposalId, proposal_contract: proposal.contract, proposal_agent: proposal.agent,
      proposal_sha256: current, approval_id: before.approval_id,
      previous_state: before.state, resulting_state: 'pending',
      provenance: (proposal.evidence ?? []).map((e) => ({ kind: e.kind, locator: e.locator ?? null })),
      agent_run: proposal.trace_ref ?? null,
      required_tests: (proposal.validation_requirements ?? []).map((r) => r.command ?? r.name ?? null),
      approved_scope: null,
      trace_id: trace?.trace_id ?? null, run_id: trace?.run_id ?? null,
      reason: String(note).slice(0, 500),
    });
    return { ok: true, action, outcome: 'changes_requested', ledger_entry: null, review_note: entry, audit: audited, state_before: before.state, state_after: 'pending', published: false, publication_note: PUBLICATION_NOTE };
  }

  /* 7 ------------------------------------------------- the ledger */
  let entry;
  try {
    entry = recordDecision({
      proposalId,
      outcome: action === 'approve' ? 'granted' : 'denied',
      /* The AUTHENTICATED subject. Not a name from the request body:
         §13 requires every approval to be attributable to an
         authenticated actor, and a body-supplied name is a claim. */
      decidedBy: actor.subject,
      note: note ? String(note).slice(0, 2000) : null,
      records: rec,
      dir,
      now,
    });
  } catch (e) {
    const code = e instanceof SelfApprovalRefused ? 'self_approval' : e instanceof UnknownProposal ? 'unknown_proposal' : 'ledger_refused';
    refuse(new DecisionRefused(e.message, {
      status: code === 'unknown_proposal' ? 404 : 409, code,
      fix: code === 'self_approval'
        ? 'a decision must be attributable to a person. An operator whose subject is one of this system\'s agent names is refused at write time and again at read time.'
        : 'the decision ledger refused this. Its reasons are governance rules, not validation quibbles.',
    }));
  }

  const after = deriveApproval(proposalId, { records: rec, ledger: readLedger({ dir }) });
  const trace = emitTrace(tracer, { action, actor, proposal, proposalId, before: before.state, after: after.state, note, fingerprint: current, approvalId: entry.approval_id });

  const audited = audit.record({
    action: action === 'approve' ? 'proposal.approved' : 'proposal.rejected',
    outcome: 'allowed',
    actor, session, request,
    proposal_id: proposalId,
    proposal_contract: proposal.contract,
    proposal_agent: proposal.agent,
    proposal_sha256: entry.proposal_sha256,
    approval_id: entry.approval_id,
    previous_state: before.state,
    resulting_state: after.state,
    provenance: (proposal.evidence ?? []).map((e) => ({ kind: e.kind, locator: e.locator ?? null, source_id: e.source_id ?? null })),
    agent_run: proposal.trace_ref ?? null,
    required_tests: (proposal.validation_requirements ?? []).map((r) => r.command ?? r.name ?? null),
    approved_scope: { permitted_files: pf.scope?.permitted ?? [], operations: (proposal.proposed_change?.operations ?? []).map((o) => ({ op: o.op, target: o.target })) },
    /* Null, and it stays null until something is implemented under
       this approval. A git ref here at decision time would mean the
       approval published something. */
    git_ref: null,
    trace_id: trace?.trace_id ?? null,
    run_id: trace?.run_id ?? null,
    reason: entry.note,
    detail: { what_was_asked: entry.what_was_asked, risk_if_wrong: entry.risk_if_wrong },
  });

  return {
    ok: true, action,
    outcome: action === 'approve' ? 'granted' : 'denied',
    ledger_entry: entry, review_note: null, audit: audited,
    state_before: before.state, state_after: after.state,
    published: false, publication_note: PUBLICATION_NOTE,
  };
}

export const PUBLICATION_NOTE = 'Nothing was published. This wrote one line to agent/implement/decisions/decisions.jsonl and touched nothing else: no dataset, no page, no stylesheet, no locale, no git operation, no deployment. The Implementation Agent re-derives this authorization from the ledger and runs its own ten gates before anything reaches the site.';

/**
 * Put the decision on the shared trace, and on the ORIGINATING run
 * as well where the proposal names one.
 *
 * The second half is the point: without it, "what happened to the
 * thing agent 7 proposed" is answerable only by knowing to look in a
 * different trace. `attachToRun` appends to the span that already
 * exists rather than opening a second one, so the proposal's own run
 * carries the downstream effect.
 */
function emitTrace(tracer, { action, actor, proposal, proposalId, before, after, note, fingerprint, approvalId = null }) {
  if (!tracer) return null;
  try {
    const run = tracer.startRun({ kind: 'agent', agent: 'control-room', task: `human review: ${action} ${proposalId}` });
    run.approval({
      approval_id: approvalId ?? `cr-${proposalId}`,
      state: action === 'approve' ? 'granted' : action === 'reject' ? 'denied' : 'requested',
      subject: proposalId,
      requested_of: 'control-room reviewer',
      /* The authenticated operator id, not a display name. */
      actor: actor.operator_id,
      note: note ? String(note).slice(0, 500) : null,
      artifact_ids: [proposalId],
      risk: proposal.risk ?? null,
    });
    run.decide({
      decision: `${action} ${proposalId}`,
      rationale: `authenticated operator ${actor.operator_id} (${actor.roles.join(', ')}) decided ${action} against proposal fingerprint ${fingerprint.slice(0, 12)}; approval state ${before} → ${after}`,
      alternatives: REVIEW_ACTIONS.filter((a) => a !== action).map((a) => ({ option: a, why_not: 'not chosen by the reviewer' })),
      risk: proposal.risk ?? null,
    });
    run.observe({
      summary: `${action} recorded. Nothing published: an approval is an authorization for a scope, and the Implementation Agent re-derives it independently.`,
      subject: proposalId,
      data: { published: false, autonomy_class: proposal.autonomy_class ?? null, contract: proposal.contract },
    });
    /* The edge back to the run that produced the proposal. */
    const ref = proposal.trace_ref;
    if (ref?.trace_id && ref?.run_id) {
      const upstream = tracer.attachToRun({ trace_id: ref.trace_id, run_id: ref.run_id, agent: proposal.agent, name: proposal.agent });
      upstream.observe({
        summary: `a human decided ${proposalId}: ${action}`,
        subject: proposalId,
        data: { decided_by_operator: actor.operator_id, state_before: before, state_after: after, control_room_trace: run.trace_id },
      });
    }
    run.end({ status: 'ok', outputs: { action, proposal_id: proposalId, state_after: after, published: false } });
    return { trace_id: run.trace_id, run_id: run.run_id };
  } catch {
    /* A trace that cannot be written must not swallow a decision
       that was made. The audit entry below records trace_id: null,
       which reads as what it is. */
    return null;
  }
}
