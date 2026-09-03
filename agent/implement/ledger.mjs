/* ============================================================
   agent/implement/ledger.mjs — where an approval actually lives

   SESSION 18's hardest sentence: "The approval state MUST be treated
   as governed system state. Do not rely on a prompt instruction,
   filename, comment, frontend state, or manually supplied flag
   claiming that a proposal is approved."

   THE PROBLEM THIS FILE EXISTS FOR. Seventy-one proposals exist
   across four agents, each behind an `ApprovalRequest` whose `state`
   is `requested`. Those records live in `agent/records/*.jsonl`,
   which is written by AGENTS and git-ignored. An agent that wanted
   an approval could append a record with `state: "granted"` and a
   `decision` block naming anybody. The contract's own rule refuses a
   decision whose `decided_by` equals the requesting agent — and an
   agent writing a forgery would simply put a different name in it.

   So an ApprovalRequest found in the agent record store is READ AS A
   REQUEST AND NEVER AS A GRANT, whatever its `state` field says.
   `deriveApproval()` below discards agent-written decisions
   explicitly and reports having done so, because silently ignoring
   them would look identical to not having checked.

   WHERE A GRANT COMES FROM INSTEAD. `agent/implement/decisions/*.jsonl`
   — a separate directory, git-TRACKED rather than ignored, written by
   exactly one code path (`cli.mjs decide`), which requires a named
   human and refuses to name an agent. Four properties follow:

     · ONE HOME. A grant exists in one place or it does not exist.
     · CONTENT BINDING. Each decision records the sha256 of the
       proposal it decided. If the proposal is edited afterwards, the
       hash no longer matches and the approval is VOID rather than
       carried over onto a changed scope. This is what stops "approve
       something small, then widen it".
     · NO SELF-APPROVAL. A decision whose `decided_by` matches the
       proposing agent is refused at write time and again at read
       time, because a check that only runs on write protects only
       the file this process wrote.
     · ATTRIBUTION. The file is in git. Who added the line, and when,
       is a commit.

   WHAT THIS IS NOT, STATED PLAINLY RATHER THAN IMPLIED. It is not
   authentication. §11 and §13 of the governance protocol require an
   authenticated actor and server-side enforcement; this repository is
   a static site with no server, no session and no identity provider,
   and anybody who can write to the working tree can write a line in
   this file. What the ledger gives is a single, hashed,
   git-attributable home for a decision and a refusal of the four
   forgeries that do not require write access to the repository. The
   gap is real, it is `docs/IMPLEMENTATION-QA.md` §9 open question 1,
   and closing it needs the Control Room of SESSION 21 — not a
   comment here claiming it is closed.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { canonicalJson } from '../schemas/gateway.mjs';
import { readRecords, listRecordFiles, DEFAULT_RECORD_DIR } from '../scout/store.mjs';
import { getContract } from '../schemas/registry.mjs';

export const IMPLEMENT_ROOT = dirname(fileURLToPath(import.meta.url));
export const DECISION_DIR = join(IMPLEMENT_ROOT, 'decisions');
export const DECISION_LEDGER = 'decisions.jsonl';
export const LEDGER_VERSION = 1;

/** The states `deriveApproval` can return. Each one is a different
 *  fact and none of them collapses into another. */
export const APPROVAL_STATES = [
  'no_request',            // nothing ever asked
  'pending',               // asked, nobody has decided
  'granted',               // a human decided, and the binding still holds
  'denied',                // a human decided against it
  'void_scope_changed',    // decided, but the proposal has been edited since
  'void_self_approved',    // the decision names the proposing agent
  'void_unknown_proposal', // a decision exists for a proposal nobody can produce
];

/** A grant, and only a grant, authorises implementation. */
export const IMPLEMENTABLE = ['granted'];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

/** The hash a decision binds to. The whole record minus the fields
 *  that are about the RUN rather than the PROPOSAL: re-running the
 *  producing agent mints the same content-derived id (see
 *  agent/schemas/identity.mjs) but a fresh trace_ref and created_at,
 *  and an approval that went void because the proposal was
 *  regenerated unchanged would be an approval nobody could ever
 *  keep. */
export function proposalFingerprint(proposal) {
  const { trace_ref, created_at, ...substance } = proposal ?? {};
  return sha256(canonicalJson(substance));
}

/* ---------------------------------------------------------- reading */

export function ledgerPath(dir = DECISION_DIR) { return join(dir, DECISION_LEDGER); }

/** Every decision ever recorded, oldest first. A malformed line is
 *  REPORTED, not skipped: a ledger that quietly drops what it cannot
 *  parse is a ledger that can be made to forget. */
export function readLedger({ dir = DECISION_DIR } = {}) {
  const file = ledgerPath(dir);
  if (!existsSync(file)) return { decisions: [], malformed: [], path: file };
  const decisions = [];
  const malformed = [];
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const d = JSON.parse(line);
      if (!d.approval_id || !d.proposal_id || !d.outcome || !d.decided_by || !d.decided_at) {
        malformed.push({ line: i + 1, why: 'a decision must carry approval_id, proposal_id, outcome, decided_by and decided_at', raw: line.slice(0, 200) });
        return;
      }
      decisions.push(d);
    } catch (e) {
      malformed.push({ line: i + 1, why: `not JSON: ${e.message}`, raw: line.slice(0, 200) });
    }
  });
  return { decisions, malformed, path: file };
}

/** Every contract record any agent has written, indexed by id. This
 *  is the PROPOSAL corpus; it is not the approval corpus. */
export function readAgentRecords({ dir = DEFAULT_RECORD_DIR } = {}) {
  const byId = new Map();
  const approvalRequests = [];
  const traces = [];
  for (const file of listRecordFiles(dir)) {
    const traceId = file.replace(/\.jsonl$/, '');
    traces.push(traceId);
    for (const r of readRecords(traceId, dir)) {
      let idField;
      try { idField = getContract(r.contract).id_field; } catch { continue; }
      byId.set(r[idField], r);
      if (r.contract === 'ApprovalRequest') approvalRequests.push(r);
    }
  }
  return { byId, approvalRequests, traces };
}

/* ---------------------------------------------------------- deriving */

/**
 * The one function that decides whether a proposal may be
 * implemented.
 *
 * @param {string} proposalId
 * @param {{records?:object, ledger?:object}} ctx
 * @returns {{state:string, why:string, approval_id:string|null,
 *            decision:object|null, discarded:object[], proposal:object|null}}
 */
export function deriveApproval(proposalId, { records, ledger } = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const proposal = rec.byId.get(proposalId) ?? null;

  const requests = rec.approvalRequests.filter((r) => (r.proposal_ids ?? []).includes(proposalId));

  /* Every agent-written decision, named rather than dropped. An
     approval the agent layer wrote for itself is exactly the forgery
     this module is arranged against, and reporting it is how a
     reviewer finds out somebody tried. */
  const discarded = requests
    .filter((r) => r.decision || r.state === 'granted' || r.state === 'denied')
    .map((r) => ({
      approval_id: r.approval_id,
      claimed_state: r.state,
      claimed_by: r.decision?.decided_by ?? null,
      written_by_agent: r.agent,
      why: 'found in agent/records/, which agents write. An ApprovalRequest read from the agent record store is a REQUEST. A grant lives only in agent/implement/decisions/, and this claim was discarded.',
    }));

  const request = requests[0] ?? null;
  const decisions = led.decisions.filter((d) => d.proposal_id === proposalId);
  const decision = decisions.length ? decisions[decisions.length - 1] : null;

  if (!decision) {
    if (!request) {
      return { state: 'no_request', why: `no ApprovalRequest anywhere names proposal "${proposalId}", and no decision has been recorded for it. An agent may not implement a proposal nobody asked about.`, approval_id: null, decision: null, discarded, proposal };
    }
    return {
      state: 'pending',
      why: `ApprovalRequest ${request.approval_id} is on the record and nothing in agent/implement/decisions/ has decided it. Pending is never granted (agent/schemas/contracts/approval-request.mjs forbids "assumed_granted").`,
      approval_id: request.approval_id,
      decision: null, discarded, proposal,
    };
  }

  if (!proposal) {
    return { state: 'void_unknown_proposal', why: `a decision exists for "${proposalId}" but no agent record store holds that proposal. A decision about something nobody can produce authorises nothing.`, approval_id: decision.approval_id, decision, discarded, proposal: null };
  }

  if (decision.outcome === 'denied') {
    return { state: 'denied', why: `denied by ${decision.decided_by} on ${decision.decided_at}${decision.note ? `: ${decision.note}` : ''}`, approval_id: decision.approval_id, decision, discarded, proposal };
  }

  if (proposal.agent && decision.decided_by === proposal.agent) {
    return { state: 'void_self_approved', why: `the decision names "${decision.decided_by}", which is the agent that produced the proposal. An agent may not approve its own proposal — the same rule agent/schemas/contracts/approval-request.mjs applies to the request, applied again here, because a check that runs only at write time protects only the file that process wrote.`, approval_id: decision.approval_id, decision, discarded, proposal };
  }

  const now = proposalFingerprint(proposal);
  if (decision.proposal_sha256 && decision.proposal_sha256 !== now) {
    return {
      state: 'void_scope_changed',
      why: `the decision was taken against proposal fingerprint ${decision.proposal_sha256.slice(0, 12)} and the proposal now fingerprints ${now.slice(0, 12)}. An approval authorises the exact scope it was given (SESSION 18, APPROVAL BOUNDARY); it does not follow a proposal that has been edited since.`,
      approval_id: decision.approval_id, decision, discarded, proposal,
    };
  }

  return {
    state: 'granted',
    why: `granted by ${decision.decided_by} on ${decision.decided_at}, bound to proposal fingerprint ${now.slice(0, 12)}${decision.note ? `. ${decision.note}` : ''}`,
    approval_id: decision.approval_id,
    decision, discarded, proposal,
  };
}

/* ---------------------------------------------------------- writing */

export class SelfApprovalRefused extends Error {}
export class UnknownProposal extends Error {}

/**
 * Record a human decision. The ONLY code path that writes a grant.
 *
 * Note what it does not take: no `force`, no `skip_checks`, no
 * `assume`. A function with an override argument is a function whose
 * checks are advisory.
 */
export function recordDecision({ proposalId, outcome, decidedBy, note = null, records, dir = DECISION_DIR, now = () => new Date().toISOString() }) {
  if (!['granted', 'denied'].includes(outcome)) throw new Error(`outcome must be "granted" or "denied", not "${outcome}"`);
  if (!decidedBy || !String(decidedBy).trim()) throw new Error('a decision with no decided_by is a record of nobody having decided');

  const rec = records ?? readAgentRecords();
  const proposal = rec.byId.get(proposalId);
  if (!proposal) throw new UnknownProposal(`no agent record store holds a proposal with id "${proposalId}". Run the producing agent first; a decision about a proposal nobody can produce authorises nothing.`);

  if (proposal.agent === decidedBy) {
    throw new SelfApprovalRefused(`"${decidedBy}" is the agent that produced ${proposalId}. An agent may not approve its own proposal.`);
  }
  /* Any agent name at all, not just this proposal's. The point of the
     rule is that a HUMAN decides; a decision attributed to any agent
     in the system defeats it just as thoroughly. */
  const agents = new Set([...rec.byId.values()].map((r) => r.agent).filter(Boolean));
  if (agents.has(decidedBy)) {
    throw new SelfApprovalRefused(`"${decidedBy}" is an agent in this system. A decision must be attributable to a person; docs/AGENT-ROLES.md H3 is that no agent verifies its own output, and an approval signed by an agent is that failure with a longer name.`);
  }

  const requests = rec.approvalRequests.filter((r) => (r.proposal_ids ?? []).includes(proposalId));
  const approvalId = requests[0]?.approval_id ?? null;
  if (!approvalId) {
    throw new Error(`no ApprovalRequest names proposal "${proposalId}". A decision is a decision ON a request; without one there is no record of what the human was asked to check.`);
  }

  const entry = {
    ledger_version: LEDGER_VERSION,
    approval_id: approvalId,
    proposal_id: proposalId,
    proposal_contract: proposal.contract,
    proposal_agent: proposal.agent,
    proposal_sha256: proposalFingerprint(proposal),
    outcome,
    decided_at: now(),
    decided_by: decidedBy,
    note,
    /* What the human was asked to check, copied in so the ledger
       stands on its own if agent/records/ is regenerated — this is a
       deliberate second copy and it is a QUOTE of the request, not a
       second home for a fact that can drift: the request it quotes is
       identified by hash above. */
    what_was_asked: requests[0].what_to_check ?? [],
    risk_if_wrong: requests[0].risk_if_wrong ?? null,
  };

  mkdirSync(dir, { recursive: true });
  appendFileSync(ledgerPath(dir), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

/** Every proposal in the record store, with its derived approval
 *  state. This is what the CLI's `queue` command prints, and it is
 *  the honest answer to "what may be implemented right now". */
export function surveyProposals({ records, ledger } = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const proposals = [...rec.byId.values()].filter((r) => {
    try { return getContract(r.contract).kind === 'proposal'; } catch { return false; }
  });
  return proposals.map((p) => {
    const idField = getContract(p.contract).id_field;
    const a = deriveApproval(p[idField], { records: rec, ledger: led });
    return { proposal: p, proposal_id: p[idField], contract: p.contract, agent: p.agent, approval: a };
  });
}
