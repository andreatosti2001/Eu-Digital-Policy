/* ============================================================
   agent/observability/query.mjs — the read model

   The store is a flat event log; every shape a reader wants is
   derived here, never stored. That is the same rule the site's own
   data follows — derivation over storage, because two copies of a
   fact can disagree and a derived one cannot.

   Derived here:
     · the execution tree (spans nested, events attached)
     · per-run status, latency, token and cost rollups
     · the open handoffs and the pending approvals across all runs
     · the audit chain behind a website change:
       source → verification → decision → implementation → deployment
   ============================================================ */

import { listTraceFiles, readTrace, DEFAULT_RUN_DIR } from './sink.mjs';
import { EVENT_TYPES } from './schema.mjs';

const EVENTS = new Set(EVENT_TYPES);

/** Flat log → one node per span, with its events and children. */
export function buildTree(records) {
  const spans = new Map();
  const order = [];
  const orphanEvents = [];

  const ensure = (id) => {
    if (!spans.has(id)) {
      spans.set(id, {
        span_id: id, parent_span_id: null, kind: 'unknown', name: '(unknown span)',
        agent: null, task: null, status: 'running', start_time: null, end_time: null,
        latency_ms: null, inputs: null, outputs: null, confidence: null, risk: null,
        usage: null, model: null, run_id: null, parent_run_id: null, trace_id: null,
        events: [], children: [], errors: [], synthetic: true,
      });
      order.push(id);
    }
    return spans.get(id);
  };

  for (const r of records) {
    if (r.type === 'span.start') {
      const s = ensure(r.span_id);
      Object.assign(s, {
        synthetic: false,
        trace_id: r.trace_id, parent_span_id: r.parent_span_id ?? null,
        run_id: r.run_id ?? null, parent_run_id: r.parent_run_id ?? null,
        kind: r.kind, name: r.name, agent: r.agent, task: r.task,
        start_time: r.start_time ?? r.ts, inputs: r.inputs ?? null,
        attributes: r.attributes ?? null, model: r.model ?? null,
        service: r.service ?? null, env: r.env ?? null,
        status: 'running',
      });
    } else if (r.type === 'span.end') {
      const s = ensure(r.span_id);
      Object.assign(s, {
        status: r.status, end_time: r.end_time ?? r.ts,
        latency_ms: r.latency_ms ?? (s.start_time ? Date.parse(r.end_time ?? r.ts) - Date.parse(s.start_time) : null),
        outputs: r.outputs ?? null, confidence: r.confidence ?? null, risk: r.risk ?? null,
        counts: r.counts ?? null,
      });
      if (r.usage) s.usage = mergeUsage(s.usage, r.usage);
      if (r.error) s.errors.push(r.error);
    } else if (EVENTS.has(r.type)) {
      const s = spans.get(r.span_id);
      if (!s) { orphanEvents.push(r); continue; }
      s.events.push(r);
      if (r.type === 'error') s.errors.push(r);
      if (r.type === 'usage') s.usage = mergeUsage(s.usage, r);
    }
  }

  const roots = [];
  for (const id of order) {
    const s = spans.get(id);
    const parent = s.parent_span_id ? spans.get(s.parent_span_id) : null;
    if (parent) parent.children.push(s); else roots.push(s);
  }
  return { roots, spans, orphanEvents };
}

function mergeUsage(a, b) {
  const add = (x, y) => (x == null && y == null ? null : (x ?? 0) + (y ?? 0));
  return {
    model: b.model ?? a?.model ?? null,
    provider: b.provider ?? a?.provider ?? null,
    input_tokens: add(a?.input_tokens, b.input_tokens),
    output_tokens: add(a?.output_tokens, b.output_tokens),
    total_tokens: add(a?.total_tokens, b.total_tokens),
    cost_usd: add(a?.cost_usd, b.cost_usd),
    latency_ms: b.latency_ms ?? a?.latency_ms ?? null,
  };
}

/** Rolls a subtree up into totals, so an orchestrator shows the
 *  cost of everything it caused rather than of itself. */
export function rollup(span) {
  const acc = { input_tokens: 0, output_tokens: 0, total_tokens: 0, cost_usd: 0, spans: 0, tools: 0, errors: 0, has_usage: false };
  const visit = (s) => {
    acc.spans++;
    if (s.kind === 'tool') acc.tools++;
    acc.errors += s.errors.length;
    if (s.usage) {
      acc.has_usage = true;
      acc.input_tokens += s.usage.input_tokens ?? 0;
      acc.output_tokens += s.usage.output_tokens ?? 0;
      acc.total_tokens += s.usage.total_tokens ?? ((s.usage.input_tokens ?? 0) + (s.usage.output_tokens ?? 0));
      acc.cost_usd += s.usage.cost_usd ?? 0;
    }
    s.children.forEach(visit);
  };
  visit(span);
  return acc;
}

export function collectEvents(span, type = null) {
  const out = [];
  const visit = (s) => {
    for (const e of s.events) if (!type || e.type === type) out.push({ ...e, _span: { span_id: s.span_id, name: s.name, kind: s.kind, agent: s.agent } });
    s.children.forEach(visit);
  };
  visit(span);
  return out;
}

/** Every agent/orchestrator span in a trace, flattened. */
export function collectRuns(span, out = []) {
  if (span.kind === 'orchestrator' || span.kind === 'agent') out.push(span);
  span.children.forEach((c) => collectRuns(c, out));
  return out;
}

/** One trace, fully derived. */
export function loadTrace(traceId, dir = DEFAULT_RUN_DIR) {
  const raw = readTrace(traceId, dir);
  if (!raw) return null;
  const tree = buildTree(raw.records);
  const root = tree.roots[0] ?? null;
  return {
    trace_id: traceId,
    broken_lines: raw.broken,
    invalid: raw.records.filter((r) => r._invalid).map((r) => ({ type: r.type, span_id: r.span_id, errors: r._invalid })),
    roots: tree.roots,
    orphan_events: tree.orphanEvents,
    summary: root ? summarise(root, traceId) : null,
    agents: root ? collectRuns(root).map(runRow) : [],
    decisions: root ? collectEvents(root, 'decision') : [],
    artifacts: root ? collectEvents(root, 'artifact') : [],
    handoffs: root ? handoffState(root) : [],
    approvals: root ? approvalState(root) : [],
    provenance: root ? collectEvents(root, 'provenance') : [],
    observations: root ? collectEvents(root, 'observation') : [],
    errors: root ? collectEvents(root, 'error') : [],
    website_changes: root ? collectEvents(root, 'website_change') : [],
  };
}

/** running > failed(root) > degraded > root's own status */
export function deriveStatus(root, runs) {
  if (root.status === 'running' || runs.some((r) => r.status === 'running')) return 'running';
  if (root.status === 'failed') return 'failed';
  if (runs.some((r) => r.status === 'failed')) return 'degraded';
  return root.status;
}

function runRow(s) {
  return {
    run_id: s.run_id, parent_run_id: s.parent_run_id, span_id: s.span_id,
    agent: s.agent, task: s.task, kind: s.kind, status: s.status,
    start_time: s.start_time, end_time: s.end_time, latency_ms: s.latency_ms,
    confidence: s.confidence, risk: s.risk, errors: s.errors.length,
  };
}

export function summarise(root, traceId) {
  const runs = collectRuns(root);
  const acc = rollup(root);
  const statuses = runs.reduce((m, r) => (m[r.status] = (m[r.status] ?? 0) + 1, m), {});
  const ends = runs.map((r) => r.end_time).filter(Boolean).sort();
  return {
    trace_id: traceId,
    root_span_id: root.span_id,
    run_id: root.run_id,
    agent: root.agent,
    task: root.task,
    service: root.service ?? null,
    env: root.env ?? null,
    /* Derived, and deliberately a wider vocabulary than a span's
       own status. A root that reported ok over a failed child would
       be the kind of green that hides a defect; a whole trace
       reported failed because one retryable poller died would be
       the kind of red nobody reads twice. `degraded` is the honest
       third answer, and it is derived here — never stored, so it
       cannot drift from the spans it describes. */
    status: deriveStatus(root, runs),
    start_time: root.start_time,
    end_time: root.end_time ?? ends[ends.length - 1] ?? null,
    latency_ms: root.latency_ms,
    runs: runs.length,
    statuses,
    spans: acc.spans,
    tools: acc.tools,
    errors: acc.errors,
    usage: acc.has_usage ? { input_tokens: acc.input_tokens, output_tokens: acc.output_tokens, total_tokens: acc.total_tokens, cost_usd: +acc.cost_usd.toFixed(6) } : null,
    counts: {
      observation: collectEvents(root, 'observation').length,
      decision: collectEvents(root, 'decision').length,
      artifact: collectEvents(root, 'artifact').length,
      handoff: collectEvents(root, 'handoff').length,
      approval: collectEvents(root, 'approval').length,
      provenance: collectEvents(root, 'provenance').length,
      website_change: collectEvents(root, 'website_change').length,
    },
    simulated: collectEvents(root).some((e) => e.simulated === true),
  };
}

/** A handoff is open until the agent it names has actually started. */
export function handoffState(root) {
  const started = new Set(collectRuns(root).map((r) => r.agent));
  const startedAfter = (agent, ts) => collectRuns(root).some((r) => r.agent === agent && r.start_time && Date.parse(r.start_time) >= Date.parse(ts));
  return collectEvents(root, 'handoff').map((h) => ({
    ...h,
    accepted: startedAfter(h.to_agent, h.ts),
    known_agent: started.has(h.to_agent),
  }));
}

/** An approval is pending until a later record resolves its id. */
export function approvalState(root) {
  const all = collectEvents(root, 'approval');
  const byId = new Map();
  for (const a of all) {
    const cur = byId.get(a.approval_id) ?? { approval_id: a.approval_id, history: [] };
    cur.history.push(a);
    cur.state = a.state;
    cur.subject = a.subject ?? cur.subject;
    cur.requested_of = a.requested_of ?? cur.requested_of;
    cur.actor = a.actor ?? cur.actor;
    cur.note = a.note ?? cur.note;
    cur.risk = a.risk ?? cur.risk;
    cur.artifact_ids = a.artifact_ids?.length ? a.artifact_ids : cur.artifact_ids;
    cur.span_id = a._span.span_id;
    cur.agent = a._span.agent;
    cur.ts = a.ts;
    byId.set(a.approval_id, cur);
  }
  return [...byId.values()].map((a) => ({ ...a, pending: a.state === 'requested' }));
}

/* ---------------------------------------------------------- index */

export function listRuns(dir = DEFAULT_RUN_DIR, { limit = 200 } = {}) {
  const out = [];
  for (const f of listTraceFiles(dir)) {
    const traceId = f.replace(/\.jsonl$/, '');
    const t = loadTrace(traceId, dir);
    if (t?.summary) out.push(t.summary);
    else out.push({ trace_id: traceId, status: 'unreadable', agent: null, task: null, start_time: null });
  }
  out.sort((a, b) => String(b.start_time ?? '').localeCompare(String(a.start_time ?? '')));
  return out.slice(0, limit);
}

/** Everything a dashboard needs about the whole store at once. */
export function overview(dir = DEFAULT_RUN_DIR) {
  const runs = listRuns(dir);
  const openHandoffs = [];
  const pendingApprovals = [];
  const websiteChanges = [];
  for (const r of runs) {
    const t = loadTrace(r.trace_id, dir);
    if (!t) continue;
    for (const h of t.handoffs) if (!h.accepted) openHandoffs.push({ trace_id: r.trace_id, ...h });
    for (const a of t.approvals) if (a.pending) pendingApprovals.push({ trace_id: r.trace_id, ...a });
    for (const c of t.website_changes) websiteChanges.push({ trace_id: r.trace_id, ...c });
  }
  return {
    generated_at: new Date().toISOString(),
    run_dir: dir,
    traces: runs.length,
    running: runs.filter((r) => r.status === 'running').length,
    completed: runs.filter((r) => r.status === 'ok').length,
    failed: runs.filter((r) => r.status === 'failed').length,
    degraded: runs.filter((r) => r.status === 'degraded').length,
    other: runs.filter((r) => !['running', 'ok', 'failed', 'degraded'].includes(r.status)).length,
    open_handoffs: openHandoffs,
    pending_approvals: pendingApprovals,
    website_changes: websiteChanges,
    runs,
  };
}

/* ---------------------------------------------------------- audit chain */

/**
 * Requirement 7, answered as a query rather than as a promise.
 * Given a changed file (or a change_id, or a trace id) return the
 * chain that produced it:
 *
 *   source → verification → decision → implementation → deployment
 *
 * Anything the trace does not contain comes back as an explicit
 * gap. A chain that quietly omits its missing link is worse than no
 * chain, because it reads as an audit.
 */
export function traceChain({ file = null, change_id = null, trace_id = null }, dir = DEFAULT_RUN_DIR) {
  const traces = trace_id ? [trace_id] : listTraceFiles(dir).map((f) => f.replace(/\.jsonl$/, ''));
  const chains = [];

  for (const id of traces) {
    const t = loadTrace(id, dir);
    if (!t) continue;
    for (const c of t.website_changes) {
      if (file && !c.files?.some((f) => f === file || f.endsWith(file))) continue;
      if (change_id && c.change_id !== change_id) continue;

      const pick = (list, ids, key) => ids.length ? list.filter((x) => ids.includes(x[key])) : [];
      const decisions = c.decision_ids?.length ? pick(t.decisions, c.decision_ids, 'decision_id') : t.decisions;
      const artifacts = c.artifact_ids?.length ? pick(t.artifacts, c.artifact_ids, 'artifact_id') : t.artifacts;
      const provenance = c.provenance_ids?.length ? t.provenance.filter((p) => c.provenance_ids.includes(p.source_id)) : t.provenance;
      const approvals = c.approval_ids?.length ? t.approvals.filter((a) => c.approval_ids.includes(a.approval_id)) : t.approvals;
      const verification = provenance.filter((p) => p.verification);

      const gaps = [];
      if (!provenance.length) gaps.push('no source recorded');
      if (!verification.length) gaps.push('no verification recorded against any source');
      if (!decisions.length) gaps.push('no decision recorded');
      if (!artifacts.length) gaps.push('no artifact recorded');
      if (!approvals.some((a) => a.state === 'granted')) gaps.push('no granted human approval');
      if (!c.commit) gaps.push('no commit recorded');
      if (!c.deployment) gaps.push('no deployment recorded');

      chains.push({
        trace_id: id,
        change_id: c.change_id,
        status: c.status,
        files: c.files,
        summary: c.summary,
        simulated: t.summary?.simulated ?? false,
        chain: {
          source: provenance.map((p) => ({ source_id: p.source_id, role: p.role, url: p.url, title: p.title, retrieved_at: p.retrieved_at, simulated: p.simulated === true })),
          verification: verification.map((p) => ({ source_id: p.source_id, verification: p.verification, agent: p._span.agent })),
          decision: decisions.map((d) => ({ decision_id: d.decision_id, decision: d.decision, rationale: d.rationale, confidence: d.confidence, risk: d.risk, agent: d._span.agent })),
          implementation: artifacts.map((a) => ({ artifact_id: a.artifact_id, artifact_type: a.artifact_type, path: a.path, sha256: a.sha256, agent: a._span.agent })),
          approval: approvals.map((a) => ({ approval_id: a.approval_id, state: a.state, actor: a.actor, requested_of: a.requested_of })),
          deployment: c.deployment ? [{ ...c.deployment, commit: c.commit }] : [],
        },
        gaps,
      });
    }
  }
  return chains;
}
