/* ============================================================
   agent/orchestrator/state.mjs — workflow state, and why it is a
   journal rather than a field

   SESSION 22: the Orchestrator must "preserve workflow state" and
   "expose workflow state to the private Control Room". Protocol §7
   adds that transitions must be explicit and that a component must
   not skip a state because doing so is convenient.

   THE STATE IS DERIVED FROM AN APPEND-ONLY JOURNAL, NOT STORED.
   Every transition is one immutable line in
   `agent/orchestrator/state/<workflow_id>.jsonl`; the current state
   is `replay()` of those lines. That is the same shape as the trace
   store and the decision ledger, and it is chosen for the same
   reason: a mutable status field can be set, and a journal can only
   be appended to. A workflow that died mid-stage reads as what
   happened up to the moment it died, rather than as a status
   somebody forgot to update.

   ONE HOME PER FACT, APPLIED HERE. The journal does not copy the
   records a stage produced; it carries their ids and their
   contracts. The records live in `agent/records/`, the trace lives
   in `agent/observability/runs/`, the decision lives in
   `agent/implement/decisions/`. This file holds the ROUTING, which
   is the only fact it owns.

   TERMINAL MEANS TERMINAL. `transition()` refuses to leave one of
   the five end states, including `human_review_required`. That is
   deliberate and it has a consequence worth stating: a workflow
   parked for a person is FINISHED, and the human decision that
   follows opens a NEW workflow — an IMPLEMENTATION_REQUEST, carried
   by a governed event, re-deriving the approval from the ledger.
   The alternative, resuming a parked workflow when a decision
   arrives, would make the workflow the home of the approval, and
   the approval already has one.

   WHAT THIS IS NOT. It is not tamper-evident and it does not
   pretend to be. The journal is git-ignored per-machine run state,
   and anybody who can write the working tree can write these files.
   `readJournal()` reports a sequence gap rather than repairing it,
   which is the most an append-only file on a shared filesystem can
   honestly offer. The record that carries authority is the decision
   ledger, and the record that carries a hash chain is the Control
   Room's audit trail; neither is this.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { END_STATES } from './workflows.mjs';

export const ORCHESTRATOR_ROOT = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_STATE_DIR = join(ORCHESTRATOR_ROOT, 'state');
export const JOURNAL_VERSION = 1;

/** Working states, then the five end states. Nothing else exists. */
export const WORKING_STATES = Object.freeze(['received', 'classified', 'planned', 'in_progress', 'blocked']);
export const WORKFLOW_STATES = Object.freeze([...WORKING_STATES, ...END_STATES]);
export const TERMINAL = Object.freeze(new Set(END_STATES));

/**
 * Every transition this system permits. Written out in full rather
 * than derived from a rule, so that "can a planned workflow go
 * straight to completed?" is a question with a written answer.
 *
 * Two absences are the point of the table:
 *   · nothing leads out of an end state;
 *   · `planned` cannot reach `completed`. A workflow that ran no
 *     stage completed nothing, and letting it say otherwise is
 *     exactly protocol §7's "a component MUST NOT skip states
 *     merely because doing so is convenient".
 */
export const TRANSITIONS = Object.freeze({
  received: ['classified', 'human_review_required', 'unresolved', 'failed'],
  classified: ['planned', 'human_review_required', 'failed'],
  planned: ['in_progress', 'human_review_required', 'failed'],
  in_progress: ['in_progress', 'blocked', 'completed', 'rejected', 'unresolved', 'human_review_required', 'failed'],
  blocked: ['in_progress', 'human_review_required', 'unresolved', 'failed'],
  completed: [], rejected: [], unresolved: [], human_review_required: [], failed: [],
});

export class IllegalTransition extends Error {
  constructor(from, to, why) {
    super(`a workflow may not go from "${from}" to "${to}": ${why}`);
    this.name = 'IllegalTransition';
    this.from = from; this.to = to;
  }
}

export function assertTransition(from, to) {
  if (!WORKFLOW_STATES.includes(to)) {
    throw new IllegalTransition(from, to, `"${to}" is not a workflow state. The states are ${WORKFLOW_STATES.join(', ')}.`);
  }
  if (TERMINAL.has(from)) {
    throw new IllegalTransition(from, to, `"${from}" is an end state. A finished workflow is not reopened — the next thing that happens is a new workflow, carried by a new governed event, re-deriving everything it needs rather than inheriting it.`);
  }
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new IllegalTransition(from, to, `the permitted transitions from "${from}" are ${allowed.join(', ') || 'none'}. Protocol §7: transitions are explicit, and a stage may not silently perform another stage's responsibilities.`);
  }
  return true;
}

/* ============================================================
   The journal
   ============================================================ */

export class WorkflowJournal {
  /** @param {{dir?:string, memory?:boolean}} opts */
  constructor({ dir = DEFAULT_STATE_DIR, memory = false } = {}) {
    this.dir = dir;
    this.memory = memory;
    this.entries = [];
    if (!memory) mkdirSync(dir, { recursive: true });
  }

  path(workflowId) { return join(this.dir, `${workflowId}.jsonl`); }

  append(entry) {
    const line = { v: JOURNAL_VERSION, ...entry };
    this.entries.push(line);
    if (!this.memory) appendFileSync(this.path(entry.workflow_id), `${JSON.stringify(line)}\n`, { encoding: 'utf8', mode: 0o600 });
    return line;
  }

  /** This journal's own entries for one workflow, plus whatever is
   *  on disk. In memory mode the disk half is empty. */
  read(workflowId) {
    const mine = this.entries.filter((e) => e.workflow_id === workflowId);
    if (this.memory) return { entries: mine, malformed: [], gaps: gapsIn(mine), path: '(memory)' };
    return readJournal(workflowId, { dir: this.dir });
  }

  list() { return this.memory ? [...new Set(this.entries.map((e) => e.workflow_id))] : listWorkflows({ dir: this.dir }); }
}

/** A malformed line is REPORTED, never skipped silently: a journal
 *  that quietly drops what it cannot parse is a journal that can be
 *  made to forget which stage refused. */
export function readJournal(workflowId, { dir = DEFAULT_STATE_DIR } = {}) {
  const file = join(dir, `${workflowId}.jsonl`);
  if (!existsSync(file)) return { entries: [], malformed: [], gaps: [], path: file, exists: false };
  const entries = [];
  const malformed = [];
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const e = JSON.parse(line);
      if (!e.workflow_id || !e.to || typeof e.seq !== 'number') {
        malformed.push({ line: i + 1, why: 'a journal entry carries workflow_id, seq and to', raw: line.slice(0, 200) });
        return;
      }
      entries.push(e);
    } catch (err) {
      malformed.push({ line: i + 1, why: `not JSON: ${err.message}`, raw: line.slice(0, 200) });
    }
  });
  return { entries, malformed, gaps: gapsIn(entries), path: file, exists: true };
}

/** Missing sequence numbers, reported and not repaired. */
function gapsIn(entries) {
  const gaps = [];
  entries.forEach((e, i) => { if (e.seq !== i) gaps.push({ at: i, seq: e.seq, why: 'the entry sequence is not contiguous. A line was removed, reordered, or written by a second process.' }); });
  return gaps;
}

export function listWorkflows({ dir = DEFAULT_STATE_DIR } = {}) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => f.replace(/\.jsonl$/, '')).sort();
}

/* ============================================================
   The state of one workflow
   ============================================================ */

export class WorkflowState {
  /**
   * @param {{workflow_id:string, type:string|null, event:object,
   *          journal:WorkflowJournal, now?:function}} opts
   */
  constructor({ workflow_id, type = null, event = null, journal, now = () => new Date().toISOString() }) {
    this.workflow_id = workflow_id;
    this.type = type;
    this.event = event;
    this.journal = journal;
    this.now = now;
    this.state = 'received';
    this.seq = 0;
    this.stages = [];
    this.records = [];
    this.conflicts = [];
    this.human_review_reasons = [];
    this.refusals = [];
    this.trace = null;
    this.created_at = now();
    this.updated_at = this.created_at;

    this.journal.append({
      workflow_id, seq: this.seq++, at: this.created_at,
      from: null, to: 'received', stage: null, actor: 'orchestrator',
      why: 'a governed event was accepted. Accepting is not classifying and is not acting.',
      detail: { event_id: event?.event_id ?? null, source: event?.source ?? null, declared_type: event?.workflow_type ?? null },
    });
  }

  /** The one way the state changes. Refuses an undeclared
   *  transition rather than recording it. */
  transition(to, { stage = null, why, actor = 'orchestrator', detail = null } = {}) {
    assertTransition(this.state, to);
    if (!why) throw new Error('a transition with no reason is a state change nobody can audit');
    const from = this.state;
    this.state = to;
    this.updated_at = this.now();
    return this.journal.append({
      workflow_id: this.workflow_id, seq: this.seq++, at: this.updated_at,
      from, to, stage, actor, why, detail,
    });
  }

  /** A stage outcome, recorded whether it succeeded or not. A stage
   *  that was skipped says so and says why; a skipped stage recorded
   *  as absent is a stage nobody can tell from one that never
   *  existed. */
  recordStage(entry) {
    this.stages.push(entry);
    this.journal.append({
      workflow_id: this.workflow_id, seq: this.seq++, at: this.now(),
      from: this.state, to: this.state, stage: entry.stage, actor: entry.agent ?? 'orchestrator',
      why: entry.why ?? entry.status,
      detail: {
        kind: entry.kind, status: entry.status,
        /* Pointers, never bodies. The records live in
           agent/records/ and copying them here would make this file
           a second home for every fact they carry. */
        records: (entry.records ?? []).map((r) => ({ id: r.id, contract: r.contract })),
        refusals: entry.refusals ?? [],
        grant: entry.grant ? { may_produce: entry.grant.may_produce, autonomy_ceiling: entry.grant.autonomy_ceiling, stage: entry.grant.stage } : null,
      },
    });
    return entry;
  }

  addHumanReviewReason(reason) {
    if (!this.human_review_reasons.some((r) => r.code === reason.code && r.why === reason.why)) this.human_review_reasons.push(reason);
    return reason;
  }

  /** What the Control Room and the CLI read. */
  snapshot() {
    return {
      workflow_id: this.workflow_id,
      type: this.type,
      state: this.state,
      terminal: TERMINAL.has(this.state),
      created_at: this.created_at,
      updated_at: this.updated_at,
      event: this.event ? { event_id: this.event.event_id, source: this.event.source, kind: this.event.kind, subject: this.event.subject ?? null, received_at: this.event.received_at ?? null, discarded: this.event.discarded ?? [] } : null,
      stages: this.stages,
      records: this.records,
      conflicts: this.conflicts,
      human_review_reasons: this.human_review_reasons,
      refusals: this.refusals,
      trace: this.trace,
    };
  }
}

/**
 * Reconstruct a workflow from its journal.
 *
 * The reconstruction is deliberately incomplete in one way, and it
 * says so: it reports the STATE and the ROUTING, and it does not
 * reproduce the records, because the journal never held them. A
 * reader that wants those follows the ids into `agent/records/`.
 */
export function replay(workflowId, { dir = DEFAULT_STATE_DIR, journal = null } = {}) {
  const j = journal ? journal.read(workflowId) : readJournal(workflowId, { dir });
  if (!j.entries.length) {
    return { workflow_id: workflowId, state: null, exists: false, why: 'no journal holds this workflow. It was never opened here, or it was opened against a different state directory.', entries: [], malformed: j.malformed, gaps: j.gaps };
  }
  const transitions = j.entries.filter((e) => e.from !== e.to);
  const last = transitions.length ? transitions[transitions.length - 1] : j.entries[j.entries.length - 1];
  const first = j.entries[0];
  const stages = j.entries.filter((e) => e.stage && e.from === e.to).map((e) => ({ stage: e.stage, at: e.at, actor: e.actor, why: e.why, ...(e.detail ?? {}) }));

  return {
    workflow_id: workflowId,
    exists: true,
    state: last.to,
    terminal: TERMINAL.has(last.to),
    opened_at: first.at,
    last_at: last.at,
    declared_type: first.detail?.declared_type ?? null,
    event_id: first.detail?.event_id ?? null,
    source: first.detail?.source ?? null,
    transitions: transitions.map((e) => ({ at: e.at, from: e.from, to: e.to, stage: e.stage, actor: e.actor, why: e.why })),
    stages,
    entries: j.entries.length,
    malformed: j.malformed,
    gaps: j.gaps,
    bound: 'The journal holds routing: states, stages, and pointers. It does not hold the records a stage produced — those live in agent/records/, and a reconstruction that reprinted them would be a second home for every fact they carry.',
  };
}

/** Every workflow this state directory knows about, newest last. */
export function survey({ dir = DEFAULT_STATE_DIR } = {}) {
  return listWorkflows({ dir }).map((id) => replay(id, { dir })).sort((a, b) => String(a.opened_at ?? '').localeCompare(String(b.opened_at ?? '')));
}
