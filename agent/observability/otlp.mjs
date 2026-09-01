/* ============================================================
   agent/observability/otlp.mjs — the exit door

   The store is this project's own format because the project's own
   questions (which source, which decision, which file, approved by
   whom) are not questions a generic tracing backend asks. But being
   trapped in a bespoke format is how an observability layer becomes
   a second thing to maintain, so the shapes were chosen to convert:
   W3C ids, RFC3339 timestamps, one span tree.

   This converts a stored trace into OTLP/JSON (the payload
   `POST /v1/traces` takes) with OpenInference semantic conventions
   on the attributes, which is what Phoenix reads natively and what
   Langfuse accepts through its OTel endpoint.

   Nothing here opens a socket. Export is:

       node agent/observability/cli.mjs export <trace-id> > trace.json
       curl -X POST http://localhost:6006/v1/traces \
            -H 'content-type: application/json' -d @trace.json

   so adopting a backend later is a decision about where to POST,
   not a rewrite — and abandoning one costs nothing.
   ============================================================ */

import { readTrace, DEFAULT_RUN_DIR } from './sink.mjs';
import { buildTree, collectEvents } from './query.mjs';
import { unixNanoOf } from './ids.mjs';

/** our kinds → OpenInference span kinds */
const OI_KIND = {
  orchestrator: 'AGENT',
  agent: 'AGENT',
  tool: 'TOOL',
  llm: 'LLM',
  retriever: 'RETRIEVER',
  chain: 'CHAIN',
};

/** our status → OTel status code */
const OTEL_STATUS = { ok: 1, skipped: 1, running: 0, cancelled: 2, failed: 2 };

const str = (k, v) => ({ key: k, value: { stringValue: typeof v === 'string' ? v : JSON.stringify(v) } });
const int = (k, v) => ({ key: k, value: { intValue: String(v) } });
const dbl = (k, v) => ({ key: k, value: { doubleValue: v } });
const bool = (k, v) => ({ key: k, value: { boolValue: v } });

function spanAttributes(s) {
  const a = [
    str('openinference.span.kind', OI_KIND[s.kind] ?? 'CHAIN'),
    str('graph.node.id', s.span_id),
  ];
  if (s.parent_span_id) a.push(str('graph.node.parent_id', s.parent_span_id));
  if (s.run_id) a.push(str('run.id', s.run_id));
  if (s.parent_run_id) a.push(str('run.parent_id', s.parent_run_id));
  if (s.trace_id) a.push(str('session.id', s.trace_id));
  if (s.agent) a.push(str('agent.name', s.agent));
  if (s.task) a.push(str('agent.task', s.task));
  if (s.kind === 'tool') a.push(str('tool.name', s.name));
  if (s.inputs != null) { a.push(str('input.value', s.inputs)); a.push(str('input.mime_type', 'application/json')); }
  if (s.outputs != null) { a.push(str('output.value', s.outputs)); a.push(str('output.mime_type', 'application/json')); }
  if (s.confidence != null) a.push(dbl('agent.confidence', s.confidence));
  if (s.risk) a.push(str('agent.risk', s.risk));
  const u = s.usage;
  if (u) {
    if (u.model) a.push(str('llm.model_name', u.model));
    if (u.provider) a.push(str('llm.provider', u.provider));
    if (u.input_tokens != null) a.push(int('llm.token_count.prompt', u.input_tokens));
    if (u.output_tokens != null) a.push(int('llm.token_count.completion', u.output_tokens));
    if (u.total_tokens != null) a.push(int('llm.token_count.total', u.total_tokens));
    if (u.cost_usd != null) a.push(dbl('llm.cost.total', u.cost_usd));
  }
  /* Counts of the domain events, so a backend that only understands
     spans still shows that a span made three decisions. */
  const c = s.events.reduce((m, e) => (m[e.type] = (m[e.type] ?? 0) + 1, m), {});
  for (const [k, v] of Object.entries(c)) a.push(int(`agent.${k}.count`, v));
  if (s.events.some((e) => e.simulated === true)) a.push(bool('agent.simulated', true));
  return a;
}

/** Our domain events become OTel span events, which every backend
 *  renders. Nothing is lost: the full record is on `payload`. */
function spanEvents(s) {
  return s.events.map((e) => ({
    name: e.type,
    timeUnixNano: unixNanoOf(new Date(e.ts)),
    attributes: [
      str('event.type', e.type),
      str('payload', e),
      ...(e.summary ? [str('event.summary', e.summary)] : []),
      ...(e.decision ? [str('event.summary', e.decision)] : []),
      ...(e.confidence != null ? [dbl('event.confidence', e.confidence)] : []),
      ...(e.risk ? [str('event.risk', e.risk)] : []),
    ],
  }));
}

function flatten(span, out = []) {
  out.push(span);
  span.children.forEach((c) => flatten(c, out));
  return out;
}

/**
 * @returns an OTLP/JSON ExportTraceServiceRequest
 */
export function toOtlp(traceId, dir = DEFAULT_RUN_DIR, { service = 'eu-digital-policy' } = {}) {
  const raw = readTrace(traceId, dir);
  if (!raw) return null;
  const { roots } = buildTree(raw.records);
  const spans = roots.flatMap((r) => flatten(r));

  return {
    resourceSpans: [{
      resource: {
        attributes: [
          str('service.name', spans[0]?.service ?? service),
          str('deployment.environment', spans[0]?.env ?? 'local'),
          str('telemetry.sdk.name', 'eu-digital-policy-observability'),
          str('telemetry.sdk.language', 'nodejs'),
        ],
      },
      scopeSpans: [{
        scope: { name: 'agent/observability', version: '1' },
        spans: spans.map((s) => ({
          traceId: s.trace_id ?? traceId,
          spanId: s.span_id,
          parentSpanId: s.parent_span_id ?? undefined,
          name: s.name,
          kind: s.kind === 'tool' ? 3 : 1,          /* CLIENT : INTERNAL */
          startTimeUnixNano: s.start_time ? unixNanoOf(new Date(s.start_time)) : undefined,
          endTimeUnixNano: s.end_time ? unixNanoOf(new Date(s.end_time)) : undefined,
          attributes: spanAttributes(s),
          events: spanEvents(s),
          status: {
            code: OTEL_STATUS[s.status] ?? 0,
            message: s.errors.length ? String(s.errors[0].message ?? s.errors[0]) : undefined,
          },
        })),
      }],
    }],
  };
}

/** The provenance ledger on its own, for an audit that does not
 *  care about spans. */
export function toProvenanceLedger(traceId, dir = DEFAULT_RUN_DIR) {
  const raw = readTrace(traceId, dir);
  if (!raw) return null;
  const { roots } = buildTree(raw.records);
  return roots.flatMap((r) => collectEvents(r, 'provenance')).map((p) => ({
    trace_id: traceId, span_id: p.span_id, agent: p._span.agent,
    source_id: p.source_id, role: p.role, url: p.url, title: p.title,
    publisher: p.publisher, locator: p.locator, retrieved_at: p.retrieved_at,
    content_sha256: p.content_sha256, verification: p.verification,
    claim_ids: p.claim_ids, instrument_ids: p.instrument_ids, simulated: p.simulated === true,
  }));
}
