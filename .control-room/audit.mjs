/* ============================================================
   .control-room/audit.mjs — who decided what, and when

   SESSION 21 asks the trail to answer four questions:

     Who approved this?
     What exactly did they approve?
     When did they approve it?
     Which evidence and proposal did they review?
     Which implementation resulted from that approval?

   So an entry carries the authenticated actor and their roles AT THE
   MOMENT OF THE DECISION, the proposal, the fingerprint the decision
   was bound to, the state before and the state after, the provenance
   the reviewer was shown, the agent run that produced the proposal,
   the tests the proposal requires, the scope it permits, and the
   trace the Control Room wrote. Nothing is optional in a way that
   would let one of those questions come back empty without saying
   so.

   THE ENTRIES ARE HASH-CHAINED. Each carries the SHA-256 of the one
   before it and its own. That does not make the file immutable —
   nothing on a disk is — and this module does not pretend otherwise:
   `verifyChain()` detects an edited, reordered or removed entry, and
   somebody who rewrites the whole file forward from the edit still
   changes every subsequent hash, so a copy of any later hash is
   enough to catch it. What it buys is that a quiet single-line edit
   is not quiet. Stated plainly because "tamper-proof" is the kind of
   word that gets quoted later.

   WHAT IS NEVER IN AN ENTRY. Passwords, session tokens, CSRF
   secrets, id_tokens, access tokens, cookies, the client secret.
   `redact()` from the shared observability layer runs over every
   entry on the way in as a second line of defence, and
   `selftest.mjs` asserts over a real trail that none of the eight
   credential shapes appears in it.

   WHERE IT LIVES. Under the state directory: git-ignored, and inside
   the dot-prefixed tree the deployment does not publish. An audit
   trail names people and what they decided about EU law; publishing
   it would be a worse failure than not having one.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { redact } from '../agent/observability/redact.mjs';

export const AUDIT_VERSION = 1;

/** Everything the Control Room writes a record for. An action not on
 *  this list cannot be audited, which means it cannot be performed:
 *  `record()` throws, and every privileged handler audits. */
export const AUDIT_ACTIONS = [
  'session.login',
  'session.login_failed',
  'session.logout',
  'session.expired',
  'authz.denied',
  'view.read',
  'proposal.approved',
  'proposal.rejected',
  'proposal.changes_requested',
  'proposal.decision_refused',
  'operators.granted',
  'operators.revoked',
  'operators.provisioned',
  'server.started',
  'server.refused_to_start',
  'server.error',
];

/** The fields SESSION 21 names. `required` here means the entry
 *  carries the key — a null is allowed and is a statement, an
 *  ABSENT key is not. `missing_fields` on the entry says which of
 *  them came back null, so an incomplete trail reports its own
 *  incompleteness rather than looking complete. */
export const REQUIRED_FIELDS = [
  'event_id', 'ts', 'action', 'outcome',
  'actor_id', 'actor_subject', 'actor_roles', 'session_id',
  'proposal_id', 'previous_state', 'resulting_state',
  'provenance', 'agent_run', 'required_tests', 'approved_scope',
  'git_ref', 'trace_id', 'reason',
];

/** Fields whose absence makes the trail unable to answer one of the
 *  five questions, for the actions where the question applies. */
const DECISION_ACTIONS = new Set(['proposal.approved', 'proposal.rejected', 'proposal.changes_requested']);
const ANSWERS_A_QUESTION = ['actor_id', 'proposal_id', 'previous_state', 'resulting_state', 'proposal_sha256', 'agent_run'];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

export class AuditRefused extends Error {}

export class AuditLog {
  constructor(cfg) {
    this.cfg = cfg;
    this.dir = join(cfg.state_dir, 'audit');
  }

  /** One file per month. Rotation by month rather than by size, so
   *  "which file is the decision in" has an answer a person can
   *  work out from the date. */
  file(ts = new Date().toISOString()) { return join(this.dir, `audit-${ts.slice(0, 7)}.jsonl`); }

  files() {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir).filter((f) => /^audit-\d{4}-\d{2}\.jsonl$/.test(f)).sort();
  }

  /** Every entry ever written, oldest first, with the lines that did
   *  not parse REPORTED rather than skipped. A trail that quietly
   *  drops what it cannot read is a trail that can be made to
   *  forget — the same rule `agent/implement/ledger.mjs` applies to
   *  the decision ledger. */
  read() {
    const entries = [];
    const malformed = [];
    for (const f of this.files()) {
      const lines = readFileSync(join(this.dir, f), 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!line.trim()) return;
        try { entries.push(JSON.parse(line)); }
        catch (e) { malformed.push({ file: f, line: i + 1, why: e.message }); }
      });
    }
    return { entries, malformed };
  }

  /** The hash the next entry chains onto. */
  head() {
    const { entries } = this.read();
    return entries.length ? entries[entries.length - 1].sha256 : null;
  }

  /**
   * Write one entry.
   *
   * @param {{action:string, outcome:string, actor?:object|null, session?:object|null,
   *          reason?:string, proposal_id?:string|null, previous_state?:string|null,
   *          resulting_state?:string|null, proposal_sha256?:string|null,
   *          approval_id?:string|null, provenance?:any, agent_run?:any,
   *          required_tests?:any, approved_scope?:any, git_ref?:string|null,
   *          trace_id?:string|null, run_id?:string|null, request?:object|null,
   *          detail?:object|null}} e
   */
  record(e, { now = () => new Date().toISOString() } = {}) {
    if (!AUDIT_ACTIONS.includes(e.action)) {
      throw new AuditRefused(`"${e.action}" is not an audited action. Every privileged act in the Control Room writes a trail entry, so an act with no action name is an act that cannot be performed rather than one that happens unrecorded.`);
    }
    if (!e.outcome || !['allowed', 'denied', 'refused', 'failed', 'ok'].includes(e.outcome)) {
      throw new AuditRefused(`"${e.outcome}" is not an outcome. An entry that does not say whether the thing happened is not a record of it.`);
    }

    const ts = now();
    const entry = {
      audit_version: AUDIT_VERSION,
      event_id: `aud-${sha256(`${ts}${e.action}${Math.random()}`).slice(0, 16)}`,
      ts,
      action: e.action,
      outcome: e.outcome,

      /* WHO. Null only where there genuinely is no actor — a failed
         login, an unauthenticated request. Never null on a decision;
         `record` refuses that below. */
      actor_id: e.actor?.operator_id ?? null,
      actor_subject: e.actor?.subject ?? e.attempted_subject ?? null,
      actor_roles: e.actor?.roles ?? [],
      actor_provider: e.actor?.provider ?? null,
      session_id: e.session?.session_id ?? e.actor?.session_id ?? null,

      /* WHAT, and against which exact version of it. */
      proposal_id: e.proposal_id ?? null,
      proposal_contract: e.proposal_contract ?? null,
      proposal_agent: e.proposal_agent ?? null,
      proposal_sha256: e.proposal_sha256 ?? null,
      approval_id: e.approval_id ?? null,
      previous_state: e.previous_state ?? null,
      resulting_state: e.resulting_state ?? null,

      /* WHICH EVIDENCE they were shown, and where it came from. */
      provenance: e.provenance ?? null,
      agent_run: e.agent_run ?? null,
      required_tests: e.required_tests ?? null,
      approved_scope: e.approved_scope ?? null,

      /* WHAT RESULTED. Null at decision time by design: an approval
         is an authorization, not an implementation, and the git ref
         appears only once something has been implemented under it.
         A non-null value here that arrived at approval time would
         mean approval published something. */
      git_ref: e.git_ref ?? null,

      /* Where in the shared observability layer this is. */
      trace_id: e.trace_id ?? null,
      run_id: e.run_id ?? null,

      reason: e.reason ?? null,
      request: e.request ? { method: e.request.method ?? null, path: e.request.path ?? null, ip: e.request.ip ?? null, user_agent: e.request.user_agent ? String(e.request.user_agent).slice(0, 200) : null } : null,
      detail: e.detail ?? null,
    };

    /* An approval attributable to nobody is the thing §13 forbids.
       It is refused at write time as well as at request time,
       because a check that runs only in the handler protects only
       the handler. */
    if (DECISION_ACTIONS.has(entry.action) && entry.outcome === 'allowed' && !entry.actor_id) {
      throw new AuditRefused(`a ${entry.action} entry with no actor_id would be an anonymous decision. Protocol §13: do not allow anonymous approval, do not allow unattributed approval.`);
    }

    /* Which of the five questions this entry cannot answer. Recorded
       ON the entry: an incomplete trace says so rather than looking
       complete (docs/AGENT-ROLES.md H4). */
    entry.missing_fields = DECISION_ACTIONS.has(entry.action)
      ? ANSWERS_A_QUESTION.filter((k) => entry[k] === null || entry[k] === undefined)
      : [];

    const safe = redact(entry).value;
    safe.prev_sha256 = this.head();
    safe.sha256 = sha256(canonical(safe));

    mkdirSync(this.dir, { recursive: true });
    appendFileSync(this.file(ts), `${JSON.stringify(safe)}\n`, { encoding: 'utf8', mode: 0o600 });
    return safe;
  }

  /**
   * Re-walk the chain. Returns every entry whose stored hash does
   * not match its content, and every break in the chain.
   *
   * What it proves: no entry has been edited in place, none has been
   * removed from the middle, none has been reordered. What it does
   * not prove: that the file has not been rewritten wholesale by
   * somebody with write access, who would produce a self-consistent
   * chain with a different head. Compare the head against a copy
   * kept elsewhere if that matters.
   */
  verifyChain() {
    const { entries, malformed } = this.read();
    const tampered = [];
    const breaks = [];
    let prev = null;
    entries.forEach((entry, i) => {
      const { sha256: stored, ...rest } = entry;
      const recomputed = sha256(canonical(rest));
      if (stored !== recomputed) tampered.push({ index: i, event_id: entry.event_id, stored, recomputed, why: 'the entry\'s content does not hash to the value stored on it: it has been edited since it was written' });
      if (entry.prev_sha256 !== prev) breaks.push({ index: i, event_id: entry.event_id, expected_prev: prev, found_prev: entry.prev_sha256, why: i === 0 ? 'the first entry does not begin the chain' : 'the chain does not link to the entry before it: an entry has been removed, inserted or reordered' });
      prev = stored;
    });
    return {
      ok: tampered.length === 0 && breaks.length === 0 && malformed.length === 0,
      entries: entries.length,
      tampered, breaks, malformed,
      head: prev,
      bound: 'A verified chain shows no entry was edited, removed or reordered in place. It does not show the file was never rewritten wholesale by somebody with write access to it — that produces a self-consistent chain with a different head, and catching it means comparing the head against a copy kept somewhere else.',
    };
  }

  /** The trail, newest first, for the audit view. */
  query({ action = null, actor_id = null, proposal_id = null, limit = 200 } = {}) {
    const { entries, malformed } = this.read();
    const out = entries
      .filter((e) => (!action || e.action === action))
      .filter((e) => (!actor_id || e.actor_id === actor_id))
      .filter((e) => (!proposal_id || e.proposal_id === proposal_id))
      .slice(-Math.max(1, Math.min(1000, limit)))
      .reverse();
    return { entries: out, total: entries.length, malformed };
  }
}

/** Stable key order, so a hash of the same content is the same hash.
 *  The same canonicalisation idea as `agent/schemas/gateway.mjs`
 *  canonicalJson, kept local because this module must not depend on
 *  the contract layer to verify its own file. */
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}
