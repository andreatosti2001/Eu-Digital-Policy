/* ============================================================
   agent/observability/schema.mjs — what a trace is made of

   The store is an append-only event log. Every line of a run file
   is one immutable record; nothing is ever rewritten, so a run
   that crashed halfway still reads as exactly what happened up to
   the crash rather than as a truncated summary of what was meant
   to happen.

   Two record families:

   SPANS      the execution tree — orchestrator, agent, tool, and
              the LLM/retriever calls underneath them. A span is
              written twice: `span.start` when it opens and
              `span.end` when it closes. A span with a start and no
              end is running (or died); that is a readable state,
              not a hole.

   EVENTS     what happened INSIDE a span, each attached to its
              span_id: observation, decision, artifact, handoff,
              approval, provenance, error, usage, website_change.

   That gives the tree the session asked for:

     orchestrator → agent → tool → observation → decision
                                 → artifact → handoff

   An observation is not a log line. A log line is prose addressed
   to whoever happens to be reading the terminal; an observation is
   a structured claim about the world with a subject, a summary,
   data, a confidence and a risk, and it can be queried, counted,
   graded and disagreed with later. Anything worth writing down is
   worth writing down as one.
   ============================================================ */

export const SCHEMA_VERSION = 1;

/** Span kinds. The first three are the execution tree the session
 *  specified; the rest exist so an LLM or retrieval call is not
 *  mislabelled as a generic tool when it is exported. */
export const SPAN_KINDS = ['orchestrator', 'agent', 'tool', 'llm', 'retriever', 'chain'];

/** A run is a span of one of these kinds. */
export const RUN_KINDS = ['orchestrator', 'agent'];

export const STATUSES = ['running', 'ok', 'failed', 'skipped', 'cancelled'];

/** Risk of the operation being wrong, in the terms this project
 *  already uses about itself: a wrong legal claim is not the same
 *  class of defect as a slow fetch. */
export const RISKS = ['none', 'low', 'medium', 'high', 'critical'];

export const EVENT_TYPES = [
  'observation', 'decision', 'artifact', 'handoff',
  'approval', 'provenance', 'error', 'usage', 'website_change',
];

export const RECORD_TYPES = ['span.start', 'span.end', ...EVENT_TYPES];

/** Approval states. `requested` with no later record is pending,
 *  and pending is the state the viewer must make impossible to
 *  miss: an unapproved change that looks approved is the failure
 *  this whole layer exists to prevent. */
export const APPROVAL_STATES = ['requested', 'granted', 'denied', 'expired'];

/** How a source bears on a claim. Deliberately the same vocabulary
 *  the site already uses in data/claims.json, so a provenance
 *  record produced by an agent can be reconciled with the
 *  bibliography rather than needing a translation table. */
export const PROVENANCE_ROLES = ['primary', 'official', 'secondary', 'interpretation', 'unresolved'];

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isHex = (v, n) => typeof v === 'string' && v.length === n && /^[0-9a-f]+$/.test(v);
const isIso = (v) => isStr(v) && !Number.isNaN(Date.parse(v));

/**
 * Validate one stored record. Returns an array of human-readable
 * problems; empty means valid. Used by the sink (write path) and
 * by `cli.mjs validate` (read path), so a store cannot silently
 * accumulate records that the viewer will later fail to render.
 */
export function validateRecord(r) {
  const e = [];
  const at = `${r?.type ?? '?'} ${r?.span_id ?? '?'}`;

  if (!r || typeof r !== 'object') return ['record is not an object'];
  if (r.v !== SCHEMA_VERSION) e.push(`${at}: unknown schema version ${r.v}`);
  if (!RECORD_TYPES.includes(r.type)) e.push(`${at}: unknown record type "${r.type}"`);
  if (!isHex(r.trace_id, 32)) e.push(`${at}: trace_id is not 32 hex`);
  if (!isHex(r.span_id, 16)) e.push(`${at}: span_id is not 16 hex`);
  if (r.parent_span_id !== null && r.parent_span_id !== undefined && !isHex(r.parent_span_id, 16)) {
    e.push(`${at}: parent_span_id is not 16 hex`);
  }
  if (!isIso(r.ts)) e.push(`${at}: ts is not an ISO timestamp`);

  if (r.type === 'span.start') {
    if (!SPAN_KINDS.includes(r.kind)) e.push(`${at}: unknown span kind "${r.kind}"`);
    if (!isStr(r.name)) e.push(`${at}: no name`);
    if (RUN_KINDS.includes(r.kind)) {
      if (!isHex(r.run_id, 16)) e.push(`${at}: a ${r.kind} span carries no run_id`);
      if (r.run_id !== r.span_id) e.push(`${at}: run_id must equal the span_id of the run`);
      if (!isStr(r.agent)) e.push(`${at}: a ${r.kind} span carries no agent`);
      if (!isStr(r.task)) e.push(`${at}: a ${r.kind} span carries no task`);
    }
    if (!isIso(r.start_time)) e.push(`${at}: no start_time`);
  }

  if (r.type === 'span.end') {
    if (!STATUSES.includes(r.status) || r.status === 'running') {
      e.push(`${at}: end status "${r.status}" is not a terminal status`);
    }
    if (!isIso(r.end_time)) e.push(`${at}: no end_time`);
    if (r.confidence !== null && r.confidence !== undefined) {
      if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) {
        e.push(`${at}: confidence must be a number in 0..1`);
      }
    }
    if (r.risk !== null && r.risk !== undefined && !RISKS.includes(r.risk)) {
      e.push(`${at}: unknown risk "${r.risk}"`);
    }
  }

  if (r.type === 'observation') {
    if (!isStr(r.summary)) e.push(`${at}: an observation with no summary is a log line`);
  }
  if (r.type === 'decision') {
    if (!isStr(r.decision)) e.push(`${at}: decision has no statement`);
    if (!isStr(r.rationale)) e.push(`${at}: decision has no rationale`);
    if (!Array.isArray(r.alternatives)) e.push(`${at}: decision has no alternatives array (may be empty)`);
  }
  if (r.type === 'artifact') {
    if (!isStr(r.artifact_id)) e.push(`${at}: artifact has no artifact_id`);
    if (!isStr(r.artifact_type)) e.push(`${at}: artifact has no artifact_type`);
  }
  if (r.type === 'handoff') {
    if (!isStr(r.from_agent) || !isStr(r.to_agent)) e.push(`${at}: handoff needs from_agent and to_agent`);
  }
  if (r.type === 'approval') {
    if (!APPROVAL_STATES.includes(r.state)) e.push(`${at}: unknown approval state "${r.state}"`);
    if (!isStr(r.approval_id)) e.push(`${at}: approval has no approval_id`);
  }
  if (r.type === 'provenance') {
    if (!isStr(r.source_id)) e.push(`${at}: provenance has no source_id`);
    if (!PROVENANCE_ROLES.includes(r.role)) e.push(`${at}: unknown provenance role "${r.role}"`);
    if (!isIso(r.retrieved_at)) e.push(`${at}: provenance has no retrieved_at`);
    if (r.simulated !== true && !isStr(r.url) && !isStr(r.locator)) {
      e.push(`${at}: a real provenance record needs a url or a locator`);
    }
  }
  if (r.type === 'website_change') {
    if (!Array.isArray(r.files) || r.files.length === 0) e.push(`${at}: website_change names no files`);
  }
  if (r.type === 'error') {
    if (!isStr(r.message)) e.push(`${at}: error has no message`);
  }
  return e;
}
