/* ============================================================
   agent/observability/chain.mjs — the edge between two agent runs

   `Span.handoff()` and `gateway.handoff()` have existed and been
   correct since SESSION 02. Until SESSION 13 the only caller outside
   the test suites was the demonstrator: chaining a real Scout trace
   into a real Verifier run produced an `AgentRun` with
   `parent_run_id: null`, `handed_off_to: []`, and not one reference
   to the trace whose records it had just read. The question
   docs/OBSERVABILITY.md asks — "can this execution be correlated
   with another agent's?" — was unanswerable in every real code path.

   This module is what the `--records` / `--changes` / `--gaps` CLIs
   call. It does two things, and they are two because they are two
   different facts with two different homes:

     DOWNSTREAM  `upstreamOf()` reads the run that produced the
                 records off the records themselves, and the CLI
                 passes it to `new Tracer({ parent_run_id })`. Every
                 span the run opens then carries it, and the
                 `AgentRun` contract field is populated from the same
                 place rather than from a second copy.

     UPSTREAM    `recordHandoff()` appends ONE `handoff` event to the
                 upstream run — on the upstream trace, where a reader
                 looking at the Scout's run can see where its output
                 went. The payload names the downstream trace, so the
                 edge is navigable in both directions.

   WHY NOT `gateway.handoff()`. That function re-emits an `artifact`
   event for every record it hands on, which is right when the
   records are new to the trace. Here they are not: the upstream run
   already emitted an artifact pointer for each one. Calling it would
   put a second copy of every pointer on the trace that already
   carries it. So this module uses the gateway's OTHER half —
   `receive()`, the function whose whole job is "an agent handed a
   record calls this before acting on it" — and then `Span.handoff()`
   for the edge. Both primitives, used for what each is.

   WHAT THIS DOES NOT DO. It does not make a record actionable.
   A `simulated` record stays never-actionable: the downstream
   agent's own intake refuses it, unchanged, and the suite asserts
   that a mock chain still refuses all six candidates. The handoff
   edge records that the records were READ, and carries
   `simulated: true` when they were fixtures, so a chain of
   fixtures cannot be mistaken on the trace for a chain of
   documents.
   ============================================================ */

import { Tracer } from './tracer.mjs';
import { JsonlSink, readTrace, DEFAULT_RUN_DIR } from './sink.mjs';
import { receive, idOf as contractIdOf } from '../schemas/gateway.mjs';
import { contentId } from '../schemas/identity.mjs';

/** The record's own id, or null where the contract is unknown here —
 *  an unrecognised contract is reported by `receive` below, not
 *  swallowed by an id lookup that throws first. */
const idOf = (record) => {
  try { return contractIdOf(record) ?? null; } catch { return null; }
};

/**
 * The run that produced a set of stored contract records, read off
 * the records rather than guessed.
 *
 * Returns null where the records carry no trace reference, and
 * `{ ambiguous: true }` where they came from more than one run —
 * which is a real condition to report, not one to resolve by
 * picking the first.
 *
 * @param {object[]} records
 */
export function upstreamOf(records = []) {
  const refs = records.filter((r) => r?.trace_ref?.trace_id && r?.trace_ref?.run_id);
  if (!refs.length) return null;

  const runs = [...new Set(refs.map((r) => `${r.trace_ref.trace_id} ${r.trace_ref.run_id}`))];
  if (runs.length > 1) {
    return { ambiguous: true, runs, why: `the ${records.length} record(s) read come from ${runs.length} different runs, and which of them handed them on is not something this can decide` };
  }

  const [trace_id, run_id] = runs[0].split(' ');
  const agents = [...new Set(refs.map((r) => r.agent).filter(Boolean))];
  return {
    ambiguous: false,
    trace_id,
    run_id,
    agent: agents.length === 1 ? agents[0] : null,
    record_ids: refs.map(idOf).filter(Boolean),
    /* True when EVERY record read is a fixture. Anything less is not
       a simulated chain, and is not recorded as one. */
    simulated: refs.every((r) => r.simulated === true),
  };
}

/**
 * Append the handoff edge to the upstream run's span, on the
 * upstream trace.
 *
 * Returns what happened rather than throwing, so a CLI can say why
 * no edge was recorded — a missing trace file is information about
 * the store, not a reason to fail a read-only analysis run.
 *
 * @param {{upstream:object, to_agent:string, records:object[],
 *          downstream_trace_id:string, reason?:string,
 *          service?:string, dir?:string}} opts
 */
export function recordHandoff({ upstream, to_agent, records, downstream_trace_id, reason = null, service = 'eu-digital-policy', dir = DEFAULT_RUN_DIR }) {
  if (!upstream) return { emitted: false, why: 'the records read carry no trace reference, so there is no upstream run to record an edge on' };
  if (upstream.ambiguous) return { emitted: false, why: upstream.why };

  const raw = readTrace(upstream.trace_id, dir);
  if (!raw) {
    return { emitted: false, why: `no trace file for ${upstream.trace_id} in ${dir}: the records outlived their trace, and an edge written onto a trace that does not exist would be an orphan nobody can read` };
  }

  /* The upstream span's own start record, so nothing about it is
     invented — its agent and its place in the tree are read from
     the trace, not assumed from the records. */
  const start = raw.records.find((r) => r.type === 'span.start' && r.span_id === upstream.run_id);
  if (!start) {
    return { emitted: false, why: `trace ${upstream.trace_id} carries no span ${upstream.run_id}: the run the records name is not in the trace they name` };
  }

  /* The receiving half of the gate. Every record is validated
     before an edge says somebody took it — the same check the
     downstream agent's intake makes, made again here, because
     "it was valid when it was written" is not a property this
     process can assume. */
  const bad = [];
  for (const r of records) {
    try { receive(r, { allowSimulated: upstream.simulated }); }
    catch (err) { bad.push(`${idOf(r) ?? r?.contract ?? 'record'}: ${err.message}`); }
  }
  if (bad.length) {
    return { emitted: false, why: `refusing to record a handoff of ${bad.length} record(s) that do not satisfy their contract: ${bad.join(' | ')}` };
  }

  const tracer = new Tracer({ service, sink: new JsonlSink({ dir }) });
  const span = tracer.attachToRun({
    trace_id: upstream.trace_id,
    run_id: upstream.run_id,
    parent_span_id: start.parent_span_id ?? null,
    agent: start.agent ?? upstream.agent,
    name: start.name ?? null,
  });

  const event = span.handoff({
    to_agent,
    from_agent: start.agent ?? upstream.agent ?? 'unknown',
    reason,
    artifact_ids: records.map(idOf).filter(Boolean),
    payload: {
      downstream_trace_id,
      records: records.length,
      simulated: upstream.simulated,
    },
    /* Content-derived, for the same reason every record id here is.
       `Span.handoff()`'s default is `ho-<span_id>-<n>` off a counter
       the span holds — which is right within one run and wrong
       across processes: two downstream agents reading the same
       upstream trace each attach with a fresh counter and both mint
       `ho-<same span>-1`, so one trace carries two different edges
       under one id. Derived from where the records went, it cannot. */
    handoff_id: contentId('ho', {
      kind: 'handoff',
      entities: [{ kind: 'run', id: upstream.run_id, path: upstream.trace_id }],
      subject: to_agent,
      discriminator: downstream_trace_id,
    }),
  });

  return { emitted: true, handoff_id: event.handoff_id, trace_id: upstream.trace_id, records: records.length };
}
