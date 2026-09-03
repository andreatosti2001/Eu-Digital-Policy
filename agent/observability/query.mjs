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
    impact: root ? impactState(root, traceId) : [],
    depth: root ? depthState(root, traceId) : null,
    proposals: root ? proposalState(root, traceId) : null,
    architecture: root ? architectureState(root, traceId) : null,
    editorial: root ? editorialState(root, traceId) : null,
  };
}

/* ------------------------------------------------- regulatory impact */

/**
 * The impact maps a trace carries, one per confirmed regulatory
 * change.
 *
 * SESSION 10 asked for the dependency/impact graph to be exposed
 * through observability. It is exposed the way everything else here
 * is — DERIVED AT READ TIME from what the run actually emitted,
 * never stored a second time. The Change Detector writes three
 * things onto the span that mapped a change:
 *
 *   an `artifact` of type `impact-graph`  the subgraph that carried
 *                                         the change, as JSON
 *   a `decision`                          where the impacts routed,
 *                                         with the alternatives it
 *                                         did not take
 *   `observation`s at risk: high          one per editorial finding
 *
 * This function joins them by the change id the artifact is named
 * for. Nothing is recomputed and nothing is second-guessed: a trace
 * that emitted an impact graph and no routing decision reports the
 * decision as missing, in the same way `traceChain` reports a
 * missing approval, because a view that quietly fills in the gap
 * reads as an audit.
 */
export function impactState(root, traceId = null) {
  const artifacts = collectEvents(root, 'artifact').filter((a) => a.artifact_type === 'impact-graph');
  const decisions = collectEvents(root, 'decision');
  const observations = collectEvents(root, 'observation');

  return artifacts.map((a) => {
    const change_id = String(a.artifact_id).replace(/^impact-graph-/, '');
    let graph = null;
    let parse_error = null;
    try { graph = a.preview ? JSON.parse(a.preview) : null; }
    catch (err) { parse_error = err.message; }

    const inSpan = (e) => e.span_id === a.span_id;
    const routing = decisions.filter(inSpan);
    const editorial = observations.filter((o) => inSpan(o) && String(o.summary).startsWith('EDITORIAL —'));
    const summary = observations.find((o) => inSpan(o) && o.subject === change_id && !String(o.summary).startsWith('EDITORIAL —'));

    const gaps = [];
    if (!graph) gaps.push(parse_error ? `the impact graph did not parse: ${parse_error}` : 'no impact graph recorded');
    if (!routing.length) gaps.push('no routing decision recorded — what may be done about these impacts without a human is not on this trace');
    if (!summary) gaps.push('no summary observation recorded');
    if (graph && (graph.dropped_nodes || graph.dropped_edges)) {
      gaps.push(`the graph on this trace is a bounded preview: ${graph.dropped_nodes} node(s) and ${graph.dropped_edges} edge(s) are not on it. The complete graph is the ImpactAssessment record's factual array; sha256 ${graph.sha256} is over the whole subgraph`);
    }

    return {
      trace_id: traceId,
      change_id,
      span_id: a.span_id,
      agent: a._span?.agent ?? null,
      simulated: a.simulated === true,
      /* The COUNTS, from the graph's own header — never the length
         of the preview's node list. The preview is bounded to fit
         the trace store's string cap, so counting what it happens to
         carry would report a change reaching twenty-nine records
         when it reached a hundred and seventy-five. */
      nodes: graph?.counts?.nodes ?? 0,
      edges: graph?.counts?.edges ?? 0,
      by_depth: graph?.counts?.by_depth ?? null,
      shown: { nodes: graph?.nodes?.length ?? 0, edges: graph?.edges?.length ?? 0 },
      dropped: { nodes: graph?.dropped_nodes ?? 0, edges: graph?.dropped_edges ?? 0 },
      graph_sha256: graph?.sha256 ?? null,
      bytes: a.bytes ?? null,
      roots: graph?.roots ?? [],
      graph,
      surfaces: summary?.data?.surfaces ?? null,
      routing: summary?.data?.routing ?? null,
      decision: routing.map((d) => ({ decision: d.decision, rationale: d.rationale, alternatives: d.alternatives, risk: d.risk })),
      editorial: editorial.map((o) => ({ subject: o.subject, summary: o.summary, data: o.data, risk: o.risk })),
      gaps,
    };
  });
}

/** Every span under `root`, itself included. */
function allSpans(span, out = []) {
  out.push(span);
  span.children.forEach((c) => allSpans(c, out));
  return out;
}

/**
 * running > failed(root) > degraded > root's own status
 *
 * SESSION 13: the walk is over EVERY span, not only the runs.
 * Until then this looked at `collectRuns()` alone, and the case the
 * audit found slipped straight through it: a Verifier run whose six
 * candidates were all refused closed six `verifier.intake` spans
 * `failed`, wrote six `error` records — and reported `ok`, because
 * an intake span is a TOOL span and no run span had failed. A root
 * that reported ok over a failed child of any kind is the sort of
 * green that hides a defect, which is the thing `degraded` was
 * defined for.
 *
 * `runs` stays in the signature: it is what answers "is anything
 * still running", and callers already have it.
 */
export function deriveStatus(root, runs) {
  if (root.status === 'running' || runs.some((r) => r.status === 'running')) return 'running';
  if (root.status === 'failed') return 'failed';
  if (allSpans(root).some((s) => s.status === 'failed')) return 'degraded';
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
      impact_graph: collectEvents(root, 'artifact').filter((a) => a.artifact_type === 'impact-graph').length,
      editorial_impact: collectEvents(root, 'observation').filter((o) => String(o.summary).startsWith('EDITORIAL —')).length,
    },
    simulated: collectEvents(root).some((e) => e.simulated === true),
  };
}

/**
 * A handoff is open until the agent it names has actually started.
 *
 * SESSION 13 adds the cross-trace case. A handoff recorded by
 * `agent/observability/chain.mjs` names the downstream trace the
 * receiving run opened, and that run is by definition NOT in this
 * trace — so "did an agent of that name start here?" answers no for
 * a handoff that was in fact taken. A payload naming a downstream
 * trace is the receipt, and it closes the edge; without one the
 * old question is still the right one.
 */
export function handoffState(root) {
  const started = new Set(collectRuns(root).map((r) => r.agent));
  const startedAfter = (agent, ts) => collectRuns(root).some((r) => r.agent === agent && r.start_time && Date.parse(r.start_time) >= Date.parse(ts));
  return collectEvents(root, 'handoff').map((h) => {
    const downstream_trace_id = h.payload?.downstream_trace_id ?? null;
    return {
      ...h,
      downstream_trace_id,
      accepted: Boolean(downstream_trace_id) || startedAfter(h.to_agent, h.ts),
      known_agent: Boolean(downstream_trace_id) || started.has(h.to_agent),
    };
  });
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
  const impact = [];
  const editorialImpacts = [];
  const depth = [];
  const proposals = [];
  const architecture = [];
  const editorial = [];
  for (const r of runs) {
    const t = loadTrace(r.trace_id, dir);
    if (!t) continue;
    for (const h of t.handoffs) if (!h.accepted) openHandoffs.push({ trace_id: r.trace_id, ...h });
    for (const a of t.approvals) if (a.pending) pendingApprovals.push({ trace_id: r.trace_id, ...a });
    for (const c of t.website_changes) websiteChanges.push({ trace_id: r.trace_id, ...c });
    /* An editorial impact is a sentence on a production site about
       EU law that may now be false, and nothing in this repository
       reads prose. It belongs on the same rail as a pending approval
       — the state that matters most is the one nobody has looked
       at. */
    for (const i of t.impact) {
      impact.push({ trace_id: r.trace_id, change_id: i.change_id, nodes: i.nodes, edges: i.edges, routing: i.routing, surfaces: i.surfaces, simulated: i.simulated, gaps: i.gaps });
      for (const e of i.editorial) editorialImpacts.push({ trace_id: r.trace_id, change_id: i.change_id, ...e });
    }
    /* A depth analysis belongs on the overview for the same reason
       an editorial impact does: what it reports is a hole in what the
       site can say about EU law, and the state that matters most is
       the one nobody has looked at. The SET-ASIDE count travels with
       it, because a summary that carried only the reported number
       would let the agent's judgement disappear into a total. */
    if (t.depth) {
      depth.push({
        trace_id: r.trace_id, as_of: t.depth.as_of,
        reported: t.depth.reported, set_aside: t.depth.set_aside, examined: t.depth.examined,
        by_impact: t.depth.by_impact, by_autonomy: t.depth.by_autonomy,
        kinds_with_no_finding: t.depth.kinds_with_no_finding,
        simulated: t.depth.simulated, gaps: t.depth.gaps,
      });
    }
    /* A routing run belongs on the overview because of what it
       CANNOT do: most gaps cannot become a proposal here, and the
       refusal count is the honest headline. The pending-approval
       count travels with it — a proposal nobody has looked at is the
       state this layer exists to surface. */
    if (t.proposals) {
      proposals.push({
        trace_id: r.trace_id, as_of: t.proposals.as_of,
        routed: t.proposals.routed, proposed: t.proposals.proposed,
        evidence_questions: t.proposals.evidence_questions, refused: t.proposals.refused,
        pending_approvals: t.proposals.pending_approvals,
        merged: t.proposals.merged, applied: t.proposals.applied,
        by_route: t.proposals.by_route, simulated: t.proposals.simulated, gaps: t.proposals.gaps,
      });
    }
    /* An architecture run belongs on the overview for what its
       ANSWERS say, not for its proposal count: the questions it
       answered "no" to are the model working, and a tile that
       carried only the proposals would report the model as nothing
       but its defects. */
    if (t.architecture) {
      architecture.push({
        trace_id: r.trace_id, as_of: t.architecture.as_of,
        questions: t.architecture.questions,
        answered_yes: t.architecture.answered_yes, answered_no: t.architecture.answered_no,
        examined: t.architecture.examined, reported: t.architecture.reported,
        set_aside: t.architecture.set_aside, proposed: t.architecture.proposed,
        pending_approvals: t.architecture.pending_approvals,
        merged: t.architecture.merged, applied: t.architecture.applied,
        schemas_changed: t.architecture.schemas_changed,
        simulated: t.architecture.simulated, gaps: t.architecture.gaps,
      });
    }
    /* An editorial run belongs on the overview for the number no
       other tile carries: how many sentences on a production site
       about EU law this repository now believes may be wrong, and
       how many of those a machine was willing to correct. The
       no-change count travels with it, because a tile showing only
       the proposals would report "examined and clear" as "not
       looked at". */
    if (t.editorial) {
      editorial.push({
        trace_id: r.trace_id, as_of: t.editorial.as_of,
        proposals: t.editorial.proposals, by_kind: t.editorial.by_kind,
        drafted: t.editorial.drafted, no_change: t.editorial.no_change,
        open_questions: t.editorial.open_questions,
        blocks_examined: t.editorial.blocks_examined, blocks_reached: t.editorial.blocks_reached,
        by_state: t.editorial.by_state, attributed: t.editorial.attributed,
        inputs_admitted: t.editorial.inputs_admitted, inputs_refused: t.editorial.inputs_refused,
        pending_approvals: t.editorial.pending_approvals,
        merged: t.editorial.merged, applied: t.editorial.applied,
        sentences_authored: t.editorial.sentences_authored,
        simulated: t.editorial.simulated, gaps: t.editorial.gaps,
      });
    }
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
    impact,
    editorial_impacts: editorialImpacts,
    depth,
    proposals,
    architecture,
    editorial,
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

/* ---------------------------------------------------- data depth */

/**
 * The depth analysis a trace carries, if it ran one.
 *
 * SESSION 11's brief asks for the analysis to be instrumented. It is
 * exposed the way everything else here is — DERIVED AT READ TIME
 * from what the run actually emitted, never stored a second time.
 * The Data Depth Agent writes four kinds of thing onto its spans:
 *
 *   one span per detector          named depth.<kind>, whose outputs
 *                                  carry reported / set_aside /
 *                                  examined
 *   an `observation` per detector  the findings it SET ASIDE, with
 *     that set anything aside      the reason for each
 *   `artifact`s of type            one per KnowledgeGap emitted
 *     contract:KnowledgeGap
 *   one census `observation`       the run's totals, by kind, by
 *     and one `decision`           impact, by autonomy — and the
 *                                  ordering decision with the
 *                                  alternatives it did not take
 *
 * This function joins them. Nothing is recomputed and nothing is
 * second-guessed: what the run did not emit comes back as a named
 * gap in the view, in the same way traceChain reports a missing
 * approval, because a view that quietly fills in the hole reads as
 * an audit.
 *
 * THE SET-ASIDE COUNT IS THE POINT OF THIS VIEW. A depth run that
 * reported nine gaps and dropped thirty-one told its reader
 * something false about its own coverage unless the thirty-one are
 * visible. They are visible here, with the reason, and the census
 * carries both numbers.
 */
export function depthState(root, traceId = null) {
  const runs = collectRuns(root);
  const detectorSpans = [];
  (function walk(s) {
    if (String(s.name ?? '').startsWith('depth.')) detectorSpans.push(s);
    for (const c of s.children ?? []) walk(c);
  })(root);
  if (!detectorSpans.length) return null;

  const observations = collectEvents(root, 'observation');
  const decisions = collectEvents(root, 'decision');
  const artifacts = collectEvents(root, 'artifact').filter((a) => a.artifact_type === 'contract:KnowledgeGap');

  const census = observations.find((o) => String(o.summary).startsWith('DEPTH CENSUS'));
  const setAside = observations.filter((o) => String(o.summary).startsWith('SET ASIDE'));
  const ordering = decisions.find((d) => String(d.decision).toLowerCase().includes('ordered by'));

  const detectors = detectorSpans.map((s) => {
    const kind = String(s.name).replace(/^depth\./, '');
    const aside = setAside.find((o) => o.subject === kind);
    return {
      kind,
      status: s.status,
      reported: s.outputs?.reported ?? null,
      set_aside: s.outputs?.set_aside ?? null,
      examined: s.outputs?.examined ?? null,
      risk: s.risk ?? null,
      /* Named rather than counted. "Eleven set aside" is a number;
         "these eleven, because nothing in the corpus leans on them"
         is a finding a reviewer can disagree with. */
      set_aside_detail: aside?.data?.suppressed ?? [],
    };
  }).sort((a, b) => a.kind.localeCompare(b.kind));

  const gaps = [];
  if (!census) gaps.push('no depth census observation recorded — the run\'s own totals are not on this trace');
  if (!ordering) gaps.push('no ordering decision recorded — what this run ranked by, and what it refused to rank by, is not on this trace');
  if (!artifacts.length) gaps.push('no KnowledgeGap artifacts recorded');
  for (const d of detectors) {
    if (d.set_aside && !d.set_aside_detail.length) {
      gaps.push(`${d.kind} set ${d.set_aside} finding(s) aside and recorded no reasons: a suppression nobody can see is a suppression nobody can check`);
    }
  }

  const reported = detectors.reduce((n, d) => n + (d.reported ?? 0), 0);
  const aside = detectors.reduce((n, d) => n + (d.set_aside ?? 0), 0);

  return {
    trace_id: traceId,
    as_of: census?.data?.as_of ?? null,
    agent: runs.find((r) => r.agent === 'data-depth')?.agent ?? null,
    simulated: artifacts.some((a) => a.simulated === true),
    /* The COUNTS come from the detector spans' own outputs, never
       from the length of the artifact list — the artifact list is
       what the trace store happened to keep, and the counts describe
       what the run actually did. */
    reported,
    set_aside: aside,
    examined: detectors.reduce((n, d) => n + (d.examined ?? 0), 0),
    by_kind: census?.data?.by_kind ?? null,
    by_impact: census?.data?.by_impact ?? null,
    by_autonomy: census?.data?.by_autonomy ?? null,
    /* A detector that found nothing is a result. Carrying it means a
       reader can tell "looked and found nothing" from "did not
       look", which is the same distinction the datasets draw between
       unknown and null. */
    kinds_with_no_finding: census?.data?.kinds_with_no_finding ?? [],
    corpus: census?.data?.corpus ?? null,
    detectors,
    gap_ids: artifacts.map((a) => a.artifact_id),
    ordering: ordering ? { decision: ordering.decision, rationale: ordering.rationale, alternatives: ordering.alternatives } : null,
    gaps,
  };
}


/* ------------------------------------------------------- gap proposals */

/**
 * What a routing run made of the gaps it was handed.
 *
 * SESSION 12's brief asks that each identified gap can become a
 * structured proposal, and the honest answer is that most cannot
 * become one here — nothing in this repository has ever retrieved a
 * document, and the value that would close a gap is usually a legal
 * fact. So the interesting number in this view is not the proposals.
 * **It is the refusals**, and they are derived beside the proposals
 * rather than left to a summary line: a run that authored fourteen
 * proposals and said nothing about the forty-three gaps it could not
 * touch would have told its reader something false about its own
 * coverage.
 *
 * Derived at read time from what the run emitted, like everything
 * else here. The router writes onto each route span:
 *
 *   a span `propose.<route>`   with gaps, proposals, data_gaps, refused
 *   `observation`s NO PROPOSAL one per gap it refused, with the reason
 *   `artifact`s                every DataProposal, ApprovalRequest, DataGap
 *   `handoff`s                 the edges to editorial and legal-verifier
 *   a `decision`               the routing table, with what it refused to do
 *   two `observation`s         the census, and that nothing was merged
 *
 * Nothing is recomputed and nothing is second-guessed. A run that
 * authored a proposal and no approval for it is reported as a gap in
 * the view, in the same way traceChain reports a missing approval,
 * because a proposal nobody has to look at is exactly the state this
 * whole layer exists to make impossible to miss.
 */
export function proposalState(root, traceId = null) {
  const routeSpans = [];
  (function walk(s) {
    if (String(s.name ?? '').startsWith('propose.')) routeSpans.push(s);
    for (const c of s.children ?? []) walk(c);
  })(root);
  if (!routeSpans.length) return null;

  const observations = collectEvents(root, 'observation');
  const decisions = collectEvents(root, 'decision');
  const artifacts = collectEvents(root, 'artifact');
  const approvals = approvalState(root);
  const handoffs = handoffState(root);

  const census = observations.find((o) => String(o.summary).startsWith('PROPOSAL CENSUS'));
  const merged = observations.find((o) => String(o.summary).startsWith('NOTHING MERGED'));
  const routing = decisions.find((d) => String(d.decision).toLowerCase().includes('routed by its kind'));
  const refusalObs = observations.filter((o) => String(o.summary).startsWith('NO PROPOSAL'));

  const routes = routeSpans.map((s) => {
    const route = String(s.name).replace(/^propose\./, '');
    return {
      route,
      status: s.status,
      gaps: s.outputs?.gaps ?? null,
      proposals: s.outputs?.proposals ?? null,
      approvals: s.outputs?.approvals ?? null,
      data_gaps: s.outputs?.data_gaps ?? null,
      refused: s.outputs?.refused ?? null,
      risk: s.risk ?? null,
      /* Named rather than counted, for the reason the depth view
         names its suppressions: "twenty-one refused" is a number;
         "these twenty-one, because a reading is the author's" is a
         finding a reviewer can disagree with. */
      refused_detail: refusalObs.filter((o) => o.span_id === s.span_id).map((o) => ({ gap_id: o.subject, why: o.data?.why ?? null })),
      handoffs: handoffs.filter((h) => h.span_id === s.span_id).map((h) => ({ to_agent: h.to_agent, artifact_ids: h.artifact_ids, reason: h.reason })),
    };
  }).sort((a, b) => a.route.localeCompare(b.route));

  const byType = (t) => artifacts.filter((a) => a.artifact_type === `contract:${t}`).map((a) => a.artifact_id);
  const proposals = byType('DataProposal');
  const requests = byType('ApprovalRequest');
  const dataGaps = byType('DataGap');

  const gaps = [];
  if (!census) gaps.push('no proposal census observation recorded — the run\'s own totals are not on this trace');
  if (!routing) gaps.push('no routing decision recorded — what this run routed by, and what it refused to do, is not on this trace');
  if (!merged) gaps.push('no "nothing merged" observation recorded — that no proposal was applied is the claim this run most needs to be able to prove');
  if (proposals.length > requests.length) {
    gaps.push(`${proposals.length} proposal(s) and only ${requests.length} approval request(s): a proposal nobody has to look at is an unapproved change that looks approved`);
  }
  for (const a of approvals) {
    if (!a.pending) gaps.push(`approval ${a.approval_id} is "${a.state}" inside the run that requested it: an agent may not approve its own proposal`);
  }
  for (const r of routes) {
    if (r.refused && !r.refused_detail.length && r.route !== 'editorial') {
      gaps.push(`${r.route} refused ${r.refused} gap(s) and recorded no reasons: a refusal nobody can see is a refusal nobody can check`);
    }
  }

  return {
    trace_id: traceId,
    as_of: census?.data?.as_of ?? null,
    simulated: artifacts.some((a) => a.simulated === true),
    /* The COUNTS come from the route spans' own outputs, never from
       the length of the artifact list — the artifact list is what the
       trace store happened to keep, and the counts describe what the
       run actually did. */
    routed: routes.reduce((n, r) => n + (r.gaps ?? 0), 0),
    proposed: routes.reduce((n, r) => n + (r.proposals ?? 0), 0),
    evidence_questions: routes.reduce((n, r) => n + (r.data_gaps ?? 0), 0),
    refused: routes.reduce((n, r) => n + (r.refused ?? 0), 0),
    by_route: census?.data?.by_route ?? null,
    by_kind_route: census?.data?.by_kind_route ?? null,
    routes_with_no_gap: census?.data?.routes_with_no_gap ?? [],
    /* Two zeros that are the point of the session rather than an
       absence of activity. */
    merged: census?.data?.merged ?? null,
    applied: census?.data?.applied ?? null,
    pending_approvals: approvals.filter((a) => a.pending).length,
    routes,
    proposal_ids: proposals,
    approval_ids: requests,
    data_gap_ids: dataGaps,
    routing: routing ? { decision: routing.decision, rationale: routing.rationale, alternatives: routing.alternatives } : null,
    gaps,
  };
}

/* --------------------------------------------- knowledge architecture */

/**
 * What a Knowledge Architect run concluded about the information
 * model.
 *
 * SESSION 13's brief asks that the agent's REASONING be instrumented
 * and its conclusions exposed here. So the interesting object in this
 * view is not the proposals: it is **the eight answers**. A run that
 * emitted twenty proposals and could not tell its reader which of the
 * eight questions it answered "no" to would have hidden its own
 * coverage behind its own output — and "looked and found nothing" is
 * a result this project keeps carefully apart from "did not look".
 *
 * Derived at read time from what the run emitted, like everything
 * else here. The architect writes onto each lens span:
 *
 *   a span `architect.<lens>`  with examined, found, reported, set_aside
 *   an `observation` Q<n> —    the answer to that question, with what
 *                              was examined and what was reported
 *   `observation`s NOT REPORTED  one per finding set aside, with the
 *                              reason and the agent it belongs to
 *   `handoff`s                 the edges to the agents that own them
 *   `artifact`s                every ArchitectureProposal and ApprovalRequest
 *   a `decision`               the ordering, with what it did not choose
 *   two `observation`s         the census, and that nothing was merged
 *
 * Nothing is recomputed and nothing is second-guessed. A run that
 * authored a proposal and no approval for it, or whose proposal
 * carries a drafted schema, is reported as a gap in the view.
 */
export function architectureState(root, traceId = null) {
  const lensSpans = [];
  (function walk(s) {
    if (String(s.name ?? '').startsWith('architect.')) lensSpans.push(s);
    for (const c of s.children ?? []) walk(c);
  })(root);
  if (!lensSpans.length) return null;

  const observations = collectEvents(root, 'observation');
  const decisions = collectEvents(root, 'decision');
  const artifacts = collectEvents(root, 'artifact');
  const approvals = approvalState(root);
  const handoffs = handoffState(root);

  const census = observations.find((o) => String(o.summary).startsWith('ARCHITECTURE CENSUS'));
  const merged = observations.find((o) => String(o.summary).startsWith('NOTHING MERGED'));
  const ordering = decisions.find((d) => String(d.decision).toLowerCase().includes('leaning on the missing shape'));
  const notReported = observations.filter((o) => String(o.summary).startsWith('NOT REPORTED'));
  const answers = observations.filter((o) => /^Q\d+ — /.test(String(o.summary)));

  const lenses = lensSpans.map((s) => {
    const id = String(s.name).replace(/^architect\./, '');
    const answer = answers.find((o) => o.subject === id);
    return {
      lens: id,
      question: answer?.data?.question ?? s.inputs?.question ?? null,
      asks: answer?.data?.asks ?? s.inputs?.asks ?? null,
      /* THE ANSWER, and it is a word rather than a count, because
         "no" is the result that a count of zero hides. */
      answer: answer?.data?.answer ?? null,
      status: s.status,
      examined: s.outputs?.examined ?? null,
      found: s.outputs?.found ?? null,
      reported: s.outputs?.reported ?? null,
      set_aside: s.outputs?.set_aside ?? null,
      proposals: s.outputs?.proposals ?? null,
      risk: s.risk ?? null,
      subjects: answer?.data?.subjects ?? [],
      /* Named rather than counted. "Nine set aside" is a number;
         "these nine, and this one is agent/depth/'s" is a finding a
         reviewer can disagree with. */
      not_reported: notReported.filter((o) => o.span_id === s.span_id).map((o) => ({ subject: o.subject, why: o.data?.why ?? null, route: o.data?.route ?? null })),
      handoffs: handoffs.filter((h) => h.span_id === s.span_id).map((h) => ({ to_agent: h.to_agent, reason: h.reason })),
    };
  }).sort((a, b) => (a.question ?? 99) - (b.question ?? 99));

  const byType = (t) => artifacts.filter((a) => a.artifact_type === `contract:${t}`).map((a) => a.artifact_id);
  const proposals = byType('ArchitectureProposal');
  const requests = byType('ApprovalRequest');

  const gaps = [];
  if (!census) gaps.push('no architecture census observation recorded — the run\'s own totals are not on this trace');
  if (!ordering) gaps.push('no ordering decision recorded — what this run ranked by, and what it refused to rank by, is not on this trace');
  if (!merged) gaps.push('no "nothing merged" observation recorded — that no schema was changed is the claim this run most needs to be able to prove');
  if (merged && merged.data?.values_proposed) {
    gaps.push(`the run reports ${merged.data.values_proposed} proposed value(s): this agent proposes shapes and never values, and a drafted schema is the thing it exists not to write`);
  }
  if (proposals.length > requests.length) {
    gaps.push(`${proposals.length} proposal(s) and only ${requests.length} approval request(s): a model change nobody has to look at is an unapproved change that looks approved`);
  }
  for (const a of approvals) {
    if (!a.pending) gaps.push(`approval ${a.approval_id} is "${a.state}" inside the run that requested it: an agent may not approve its own proposal`);
  }
  for (const l of lenses) {
    if (l.set_aside && !l.not_reported.length) {
      gaps.push(`${l.lens} set ${l.set_aside} finding(s) aside and recorded no reasons: a finding that vanished without a reason is a finding nobody can check`);
    }
    if (l.answer === null) gaps.push(`${l.lens} recorded no answer to its question: a lens that ran and did not say what it concluded has told its reader nothing`);
  }

  return {
    trace_id: traceId,
    as_of: census?.data?.as_of ?? null,
    simulated: artifacts.some((a) => a.simulated === true),
    /* The COUNTS come from the lens spans' own outputs, never from
       the length of the artifact list — the artifact list is what the
       trace store happened to keep, and the counts describe what the
       run actually did. */
    examined: lenses.reduce((n, l) => n + (l.examined ?? 0), 0),
    reported: lenses.reduce((n, l) => n + (l.reported ?? 0), 0),
    set_aside: lenses.reduce((n, l) => n + (l.set_aside ?? 0), 0),
    proposed: lenses.reduce((n, l) => n + (l.proposals ?? 0), 0),
    /* The headline of this view. A question answered "no" is a
       result — the model CAN represent that — and it is carried
       beside the yeses rather than left to be inferred from a zero. */
    questions: lenses.length,
    answered_yes: lenses.filter((l) => l.answer === 'yes').map((l) => l.question),
    answered_no: lenses.filter((l) => l.answer === 'no').map((l) => l.question),
    by_question: census?.data?.by_question ?? null,
    model: census?.data ? { containers: census.data.containers ?? null, vocabularies: census.data.vocabularies ?? null, pages: census.data.pages ?? null } : null,
    /* Three zeros that are the point of the session rather than an
       absence of activity. */
    merged: merged?.data?.merged ?? null,
    applied: merged?.data?.applied ?? null,
    schemas_changed: merged?.data?.schemas_changed ?? null,
    values_proposed: merged?.data?.values_proposed ?? null,
    pending_approvals: approvals.filter((a) => a.pending).length,
    lenses,
    proposal_ids: proposals,
    approval_ids: requests,
    ordering: ordering ? { decision: ordering.decision, rationale: ordering.rationale, alternatives: ordering.alternatives } : null,
    gaps,
  };
}

/* --------------------------------------------------- editorial */

/**
 * What an Editorial Agent run concluded about the site's prose.
 *
 * SESSIONS 14 and 15 ask for two things this view has to be able to
 * answer separately, because collapsing them is the failure the
 * whole agent is built against:
 *
 *   WHAT IT PROPOSED   and of the three kinds, how many were
 *                      DRAFTED. A drafted replacement is the only
 *                      text this agent composes, and the number of
 *                      them is the number a reader should look at
 *                      first.
 *   WHAT IT DID NOT    the no-change explanations, and the open
 *                      questions. "Looked and found nothing" and
 *                      "did not look" are different findings, and a
 *                      view that showed only the proposals would
 *                      report the first as the second.
 *
 * Derived at read time from what the run emitted, like everything
 * else here. Nothing is recomputed and nothing is second-guessed: a
 * run that drafted a replacement over an analytical passage, or
 * proposed without an approval, or refused an input without saying
 * why, is reported as a gap in the view rather than quietly shown.
 */
export function editorialState(root, traceId = null) {
  const spans = [];
  (function walk(s) {
    if (String(s.name ?? '').startsWith('editorial.')) spans.push(s);
    for (const c of s.children ?? []) walk(c);
  })(root);
  if (!spans.length) return null;

  const observations = collectEvents(root, 'observation');
  const decisions = collectEvents(root, 'decision');
  const artifacts = collectEvents(root, 'artifact');
  const approvals = approvalState(root);

  const census = observations.find((o) => String(o.summary).startsWith('EDITORIAL CENSUS'));
  const applied = observations.find((o) => String(o.summary).startsWith('NOTHING APPLIED'));
  const triage = decisions.find((d) => String(d.decision).toLowerCase().includes('triaged by what the sentence'));
  const refusals = observations.filter((o) => String(o.summary).startsWith('REFUSED AT INTAKE'));
  const noChange = observations.filter((o) => String(o.summary).startsWith('NO CHANGE NEEDED'));
  const openQ = observations.filter((o) => String(o.summary).startsWith('OPEN QUESTION'));
  const prose = observations.find((o) => String(o.summary).startsWith('PROSE READ'));

  const stages = spans.map((s) => {
    const id = String(s.name).replace(/^editorial\./, '');
    return {
      stage: id,
      status: s.status,
      examined: s.outputs?.examined ?? s.outputs?.blocks ?? null,
      reached: s.outputs?.reached ?? null,
      proposed: s.outputs?.proposed ?? s.outputs?.recommendations ?? null,
      no_change: s.outputs?.no_change ?? null,
      open_questions: s.outputs?.open_questions ?? null,
      risk: s.risk ?? null,
      /* Named rather than counted. "Two refused" is a number; "these
         two, and one because two regulators disagree" is a finding a
         reviewer can check. */
      refused: refusals.filter((o) => o.span_id === s.span_id).map((o) => ({ subject: o.subject, why: o.data?.why ?? null })),
    };
  }).sort((a, b) => a.stage.localeCompare(b.stage));

  const byType = (t) => artifacts.filter((a) => a.artifact_type === `contract:${t}`).map((a) => a.artifact_id);
  const proposals = byType('EditorialProposal');
  const requests = byType('ApprovalRequest');
  const explanations = byType('AgentObservation');

  const gaps = [];
  if (!census) gaps.push('no editorial census observation recorded — the run\'s own totals are not on this trace');
  if (!triage) gaps.push('no triage decision recorded — what this run corrected, what it only flagged, and why, is not on this trace');
  if (!applied) gaps.push('no "nothing applied" observation recorded — that no sentence was edited is the claim this run most needs to be able to prove');
  if (applied && applied.data?.sentences_authored) {
    gaps.push(`the run reports ${applied.data.sentences_authored} authored sentence(s): this agent composes substitutions and never sentences, and a written sentence is the thing it exists not to write`);
  }
  if (proposals.length > requests.length) {
    gaps.push(`${proposals.length} proposal(s) and only ${requests.length} approval request(s): a change to prose nobody has to look at is an unapproved change that looks approved`);
  }
  for (const a of approvals) {
    if (!a.pending) gaps.push(`approval ${a.approval_id} is "${a.state}" inside the run that requested it: an agent may not approve its own proposal`);
  }
  if (!prose) gaps.push('no prose observation recorded — how much of the site was read, and how much of it carries provenance, is not on this trace');

  return {
    trace_id: traceId,
    as_of: census?.data?.as_of ?? null,
    simulated: artifacts.some((a) => a.simulated === true),
    /* THE HEADLINE, and it is deliberately three numbers rather than
       one: what was corrected, what was only flagged, and what was
       examined and found not to need correcting. */
    by_kind: census?.data?.by_kind ?? null,
    drafted: applied?.data?.substitutions_drafted ?? null,
    proposals: proposals.length,
    no_change: explanations.length,
    open_questions: census?.data?.open_questions ?? openQ.length,
    blocks_examined: census?.data?.blocks_examined ?? prose?.data?.by_home ?? null,
    blocks_reached: census?.data?.blocks_reached ?? null,
    by_state: census?.data?.by_state ?? prose?.data?.by_state ?? null,
    by_home: prose?.data?.by_home ?? null,
    attributed: prose?.data?.attributed ?? null,
    unattributed: prose?.data?.unattributed ?? null,
    inputs_admitted: census?.data?.inputs_admitted ?? null,
    inputs_refused: census?.data?.inputs_refused ?? null,
    site_findings: census?.data?.site_findings ?? null,
    /* Three zeros that are the point of the session rather than an
       absence of activity. */
    merged: applied?.data?.merged ?? null,
    applied: applied?.data?.applied ?? null,
    sentences_authored: applied?.data?.sentences_authored ?? null,
    pending_approvals: approvals.filter((a) => a.pending).length,
    stages,
    proposal_ids: proposals,
    approval_ids: requests,
    no_change_ids: explanations,
    /* The explanations, named. A count of them reads as a silence;
       the list is the deliverable. */
    explanations: noChange.map((o) => ({ subject: o.subject, summary: o.summary, state: o.data?.editorial_state ?? null, how: o.data?.how_reached ?? null })),
    triage: triage ? { decision: triage.decision, rationale: triage.rationale, alternatives: triage.alternatives } : null,
    gaps,
  };
}
