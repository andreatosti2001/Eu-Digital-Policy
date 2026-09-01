/* ============================================================
   AgentRun — one agent execution, in contract form

   The observability layer already holds the execution tree, and
   this contract does not rebuild it. `run_id` IS the `span_id` of
   the agent or orchestrator span — that is the rule ids.mjs states
   and the rule enforced below, so a run cannot acquire a second
   identity by being described twice.

   For the same reason, everything the read model derives is
   forbidden here: duration, token totals, cost, span counts, the
   `degraded` status. query.mjs computes those from the log at read
   time. A stored copy is a copy that can disagree with the log it
   was computed from, and the log is what actually happened.

   What this contract adds over the trace is the agent's own account
   of the run: what it was asked to do, what it produced, under
   which autonomy class, and what it is still standing on.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { AUTONOMY_CLASSES, RISKS, RUN_STATUSES } from '../types.mjs';

export const AgentRun = defineContract({
  name: 'AgentRun',
  kind: 'run',
  id_field: 'run_id',
  doc: 'An agent\'s own account of one execution: task, inputs, outputs, status, what it produced, and the autonomy it acted under.',
  fields: {
    run_id: F.hex(16, 'The span_id of this run\'s agent or orchestrator span. Not a second identifier — the same one.'),
    parent_run_id: F.hex(16, 'The run that called this one. Null for a root.', { nullable: true }),
    task: F.string('What this run was asked to do.'),
    started_at: F.iso('When the run began. Distinct from created_at, which is when this record was written — they differ whenever the record is written at the end.'),
    ended_at: F.iso('When it finished. Null while running, and a run with a start and no end reads as running rather than as a hole.', { nullable: true }),
    status: F.enum(RUN_STATUSES, 'running · ok · failed · skipped · cancelled. "degraded" is absent on purpose: it is derived per trace, never stored.'),
    inputs: F.data('What it was given.', { nullable: true }),
    outputs: F.data('What it returned.', { nullable: true }),
    produced: F.array(F.object({
      contract: F.string('Which contract the produced record satisfies.'),
      id: F.string('Its id.'),
    }, 'One record this run produced.'), 'The contract records this run wrote. This is how a run is joined to its output without either holding a copy of the other.'),
    autonomy_class: F.enum(AUTONOMY_CLASSES, 'The autonomy this run actually acted under — not what it was permitted, what it used.'),
    confidence: F.ratio('0..1 in the run\'s own result.', { nullable: true }),
    risk: F.enum(RISKS, 'What it costs if this run\'s output is wrong.', { nullable: true }),
    handed_off_to: F.array(F.string('An agent name.'), 'Which agents this run handed work to. An open handoff is a queue entry.'),
  },
  forbidden: {
    duration_ms: 'Derived from start_time and end_time in query.mjs at read time. Storing it creates the second copy the architecture exists to prevent.',
    latency_ms: 'Same.',
    total_tokens: 'Derived by rolling up the usage records in the trace.',
    total_cost_usd: 'Same.',
    span_count: 'Same — counted from the log.',
    degraded: 'Derived per trace: a root that finished ok over a failed child. Never stored, because the stored copy would not know about a child that failed later.',
    trace_id: 'trace_id lives in trace_ref, with the span it belongs to. One home.',
  },
  rules: [
    (r) => (!r.trace_ref
      ? ['trace_ref is null: a run that is not in a trace has no execution tree to belong to']
      : []),
    (r) => (r.trace_ref && r.run_id !== r.trace_ref.span_id
      ? [`run_id ${r.run_id} is not trace_ref.span_id ${r.trace_ref.span_id}: a run IS a span, and an id that exists twice can disagree`]
      : []),
    (r) => (r.trace_ref && r.trace_ref.run_id !== r.run_id
      ? [`trace_ref.run_id ${r.trace_ref.run_id} is not this run's run_id ${r.run_id}`]
      : []),
    (r) => (r.status === 'running' && r.ended_at
      ? ['status is "running" but ended_at is set']
      : []),
    (r) => (r.status !== 'running' && !r.ended_at
      ? [`status is "${r.status}" but ended_at is null: a terminated run has an end time`]
      : []),
    (r) => (r.status === 'failed' && (r.epistemic?.unresolved ?? []).length === 0
      ? ['status is "failed" but epistemic.unresolved is empty: a failed run leaves something open by definition']
      : []),
  ],
});
