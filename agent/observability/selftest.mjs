/* ============================================================
   agent/observability/selftest.mjs

       node --test agent/observability/selftest.mjs

   node:test, so this needs nothing installed — the same
   constraint the four validators in tools/ work under.

   What it holds down, in the order the layer would fail:
     · a credential must never reach the store
     · every record the tracer emits must satisfy the schema
     · run lineage must be reconstructible from the log alone
     · a run that never closed must read as running, not as ok
     · the audit chain must report its own gaps
     · the OTLP export must keep W3C id shapes
     · an impact map must report its own gaps, and must never
       report a bounded preview as the whole graph (SESSION 10)
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { redact } from './redact.mjs';
import { validateRecord } from './schema.mjs';
import { Tracer } from './tracer.mjs';
import { MemorySink, JsonlSink } from './sink.mjs';
import { deterministicIds, deterministicClock } from './ids.mjs';
import { buildTree, loadTrace, traceChain, deriveStatus, collectRuns, summarise, impactState, depthState, proposalState, handoffState } from './query.mjs';
import { toOtlp, toProvenanceLedger } from './otlp.mjs';
import { upstreamOf, recordHandoff } from './chain.mjs';
import { readTrace } from './sink.mjs';
import { receive } from '../schemas/gateway.mjs';
import { FIXTURES } from '../schemas/fixtures.mjs';
import { runDemo } from './demo/workflow.mjs';

const fixture = () => new Tracer({
  sink: new MemorySink({ strict: true }),
  ids: deterministicIds(3),
  clock: deterministicClock('2026-01-01T00:00:00.000Z', 100),
});

/* ---------------------------------------------------------- redaction */

test('redaction removes a secret by key and by value, and counts it', () => {
  const r = redact({
    api_key: 'live-key',
    nested: { Authorization: 'Bearer abcdefghijklmnopq' },
    prose: 'the key is sk-ant-api03-AAAAAAAAAAAAAAAAAAAA and the token is ghp_AAAAAAAAAAAAAAAAAAAAAA',
    url: 'https://user:pw@example.invalid/x?access_token=SECRETVALUE1',
    fine: 'no secret here',
  });
  const text = JSON.stringify(r.value);
  for (const leaked of ['live-key', 'abcdefghijklmnopq', 'sk-ant-api03', 'ghp_AAAA', 'user:pw', 'SECRETVALUE1']) {
    assert.ok(!text.includes(leaked), `${leaked} survived redaction`);
  }
  assert.equal(r.value.fine, 'no secret here');
  assert.ok(r.redactions >= 5);
});

test('redaction survives cycles-free deep objects and truncates a huge string', () => {
  const r = redact({ big: 'x'.repeat(20000) });
  assert.ok(r.value.big.length < 20000);
  assert.equal(r.truncations, 1);
});

/* ---------------------------------------------------------- schema */

test('every record the tracer emits satisfies the schema', () => {
  const tr = fixture();
  const run = tr.startRun({ agent: 'orchestrator', task: 't', inputs: { a: 1 } });
  const a = run.startAgent({ agent: 'scout', task: 'find' });
  const tool = a.startTool({ name: 'x.y', inputs: { q: 1 } });
  tool.end({ status: 'ok', outputs: { n: 1 } });
  a.observe({ summary: 's', confidence: 0.5, risk: 'low' });
  a.decide({ decision: 'd', rationale: 'r', alternatives: [] });
  a.artifact({ artifact_id: 'art', artifact_type: 'set' });
  a.handoff({ to_agent: 'verifier' });
  a.approval({ approval_id: 'ap', state: 'requested' });
  a.provenance({ source_id: 'src', role: 'official', url: 'https://example.invalid/a' });
  a.usage({ model: 'm', input_tokens: 5, output_tokens: 5, cost_usd: 0.1 });
  a.error(new Error('boom'));
  a.websiteChange({ files: ['x.json'] });
  a.end({ status: 'ok', confidence: 0.9, risk: 'low' });
  run.end({ status: 'ok' });

  for (const rec of tr.sink.records) assert.deepEqual(validateRecord(rec), [], JSON.stringify(rec));
  assert.equal(tr.sink.invalid.length, 0);
});

test('the schema rejects what it says it rejects', () => {
  const base = { v: 1, trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16), ts: '2026-01-01T00:00:00.000Z' };
  assert.ok(validateRecord({ ...base, type: 'observation' }).length, 'observation with no summary');
  assert.ok(validateRecord({ ...base, type: 'span.end', status: 'running', end_time: base.ts }).length, 'running is not terminal');
  assert.ok(validateRecord({ ...base, type: 'span.end', status: 'ok', end_time: base.ts, confidence: 2 }).length, 'confidence out of range');
  assert.ok(validateRecord({ ...base, type: 'provenance', source_id: 's', role: 'official', retrieved_at: base.ts }).length, 'real provenance needs a url or locator');
  assert.deepEqual(validateRecord({ ...base, type: 'provenance', source_id: 's', role: 'official', retrieved_at: base.ts, simulated: true }), []);
});

/* ---------------------------------------------------------- lineage */

test('run lineage is reconstructible from the log alone', () => {
  const tr = fixture();
  const run = tr.startRun({ agent: 'orchestrator', task: 't' });
  const a = run.startAgent({ agent: 'scout', task: 'find' });
  const tool = a.startTool({ name: 'deep' });
  const nested = tool.startTool({ name: 'deeper' });
  nested.end({ status: 'ok' }); tool.end({ status: 'ok' });
  a.end({ status: 'ok' }); run.end({ status: 'ok' });

  const { roots } = buildTree(tr.sink.records);
  const orch = roots[0];
  const scout = orch.children[0];
  assert.equal(orch.run_id, orch.span_id);
  assert.equal(orch.parent_run_id, null);
  assert.equal(scout.run_id, scout.span_id);
  assert.equal(scout.parent_run_id, orch.run_id);
  /* a tool belongs to the run that called it, however deep */
  assert.equal(scout.children[0].run_id, scout.run_id);
  assert.equal(scout.children[0].children[0].run_id, scout.run_id);
  assert.equal(scout.children[0].children[0].agent, 'scout', 'a tool inherits the agent that called it');
  assert.deepEqual(collectRuns(orch).map((r) => r.agent), ['orchestrator', 'scout']);
});

test('an unclosed span reads as running, and drags the trace with it', () => {
  const tr = fixture();
  const run = tr.startRun({ agent: 'orchestrator', task: 't' });
  const a = run.startAgent({ agent: 'scout', task: 'find' });   /* never ended */
  run.end({ status: 'ok' });
  const { roots } = buildTree(tr.sink.records);
  assert.equal(roots[0].children[0].status, 'running');
  assert.equal(summarise(roots[0], 'a'.repeat(32)).status, 'running');
});

test('a failed child under an ok root reads as degraded, not as ok', () => {
  const tr = fixture();
  const run = tr.startRun({ agent: 'orchestrator', task: 't' });
  const a = run.startAgent({ agent: 'poller', task: 'poll' });
  a.error(new Error('nope')); a.end({ status: 'failed' });
  run.end({ status: 'ok' });
  const { roots } = buildTree(tr.sink.records);
  assert.equal(deriveStatus(roots[0], collectRuns(roots[0])), 'degraded');
});

test('step() records a thrown error and closes the span as failed', async () => {
  const tr = fixture();
  const run = tr.startRun({ agent: 'orchestrator', task: 't' });
  await assert.rejects(() => run.step({ name: 'explodes' }, async () => { throw new Error('kaboom'); }));
  run.end({ status: 'ok' });
  const { roots } = buildTree(tr.sink.records);
  const child = roots[0].children[0];
  assert.equal(child.status, 'failed');
  assert.equal(child.events.filter((e) => e.type === 'error')[0].message, 'kaboom');
});

test('usage recorded mid-span survives the closing record and rolls up', () => {
  const tr = fixture();
  const run = tr.startRun({ agent: 'orchestrator', task: 't' });
  const llm = run.startLlm({ name: 'call', model: 'm' });
  llm.usage({ model: 'm', input_tokens: 100, output_tokens: 20, cost_usd: 0.5 });
  llm.end({ status: 'ok' });
  run.end({ status: 'ok' });
  const { roots } = buildTree(tr.sink.records);
  assert.equal(summarise(roots[0], 'a'.repeat(32)).usage.total_tokens, 120);
  assert.equal(summarise(roots[0], 'a'.repeat(32)).usage.cost_usd, 0.5);
});

/* ---------------------------------------------------------- the demo, end to end */

test('the demonstrator writes a valid, fully simulated, secret-free trace', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'obs-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const { trace_id } = await runDemo({
    sink: new JsonlSink({ dir, strict: true }),
    ids: deterministicIds(11),
    clock: deterministicClock('2026-02-02T00:00:00.000Z', 120),
    runDir: dir,
  });

  const text = readFileSync(join(dir, `${trace_id}.jsonl`), 'utf8');
  for (const leaked of ['sk-ant-demo', 'hunter2', 'abcdefghijklmnop']) {
    assert.ok(!text.includes(leaked), `${leaked} reached the store`);
  }

  const trace = loadTrace(trace_id, dir);
  assert.deepEqual(trace.broken_lines, []);
  assert.deepEqual(trace.invalid, []);
  assert.equal(trace.summary.status, 'degraded', 'the failing poller must be visible in the trace status');
  assert.equal(trace.summary.simulated, true);
  assert.deepEqual(trace.agents.map((a) => a.agent),
    ['orchestrator', 'scout', 'scout.poller', 'verifier', 'change-detector']);
  assert.equal(trace.agents.find((a) => a.agent === 'scout.poller').status, 'failed');

  /* the execution tree the session specified, present in one trace */
  assert.ok(trace.observations.length >= 5);
  assert.ok(trace.decisions.length === 3);
  assert.ok(trace.artifacts.length === 2);
  assert.ok(trace.handoffs.length === 2);
  assert.ok(trace.provenance.length >= 4);
  assert.ok(trace.website_changes.length === 2);
  assert.ok(trace.summary.usage.total_tokens > 0, 'token/cost/latency recorded where available');

  /* one approval granted, one deliberately left pending */
  const pending = trace.approvals.filter((a) => a.pending);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].approval_id, 'demo-appr-2');
  assert.equal(trace.approvals.find((a) => a.approval_id === 'demo-appr-1').state, 'granted');

  /* nothing in the demonstrator may look like real legal research */
  for (const p of trace.provenance) {
    assert.equal(p.simulated, true, `${p.source_id} is not marked simulated`);
    assert.ok(!p.url || p.url.includes('example.invalid'), `${p.source_id} points at a real host`);
  }
});

test('the audit chain closes for a deployed change and reports gaps for a proposed one', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'obs-chain-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { trace_id } = await runDemo({
    sink: new JsonlSink({ dir, strict: true }),
    ids: deterministicIds(21), clock: deterministicClock('2026-03-03T00:00:00.000Z', 120), runDir: dir,
  });

  const chains = traceChain({ file: 'data/__demo__/simulated-change.json' }, dir);
  assert.equal(chains.length, 2, 'one proposed, one deployed');

  const deployed = chains.find((c) => c.status === 'deployed');
  assert.deepEqual(deployed.gaps, [], 'a deployed change must have a complete chain');
  for (const stage of ['source', 'verification', 'decision', 'implementation', 'approval', 'deployment']) {
    assert.ok(deployed.chain[stage].length > 0, `stage ${stage} is empty`);
  }
  assert.equal(deployed.trace_id, trace_id, 'the trace id is preserved end to end');

  const proposed = chains.find((c) => c.status === 'proposed');
  assert.ok(proposed.gaps.includes('no commit recorded'));
  assert.ok(proposed.gaps.includes('no deployment recorded'));
});

/* ---------------------------------------------------------- export */

test('the OTLP export keeps W3C id shapes and OpenInference kinds', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'obs-otlp-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { trace_id } = await runDemo({
    sink: new JsonlSink({ dir, strict: true }),
    ids: deterministicIds(31), clock: deterministicClock('2026-04-04T00:00:00.000Z', 120), runDir: dir,
  });

  const otlp = toOtlp(trace_id, dir);
  const spans = otlp.resourceSpans[0].scopeSpans[0].spans;
  assert.ok(spans.length >= 14);
  for (const s of spans) {
    assert.match(s.traceId, /^[0-9a-f]{32}$/);
    assert.match(s.spanId, /^[0-9a-f]{16}$/);
    if (s.parentSpanId) assert.match(s.parentSpanId, /^[0-9a-f]{16}$/);
    assert.match(String(s.startTimeUnixNano), /^\d+$/);
    const kind = s.attributes.find((a) => a.key === 'openinference.span.kind');
    assert.ok(['AGENT', 'TOOL', 'LLM', 'RETRIEVER', 'CHAIN'].includes(kind.value.stringValue));
  }
  /* the domain events must survive as OTel span events */
  const names = spans.flatMap((s) => s.events.map((e) => e.name));
  for (const want of ['observation', 'decision', 'artifact', 'handoff', 'approval', 'provenance', 'website_change']) {
    assert.ok(names.includes(want), `${want} did not survive the export`);
  }
  const ledger = toProvenanceLedger(trace_id, dir);
  assert.ok(ledger.length >= 4);
  assert.ok(ledger.every((p) => p.simulated === true));
});

test('a deterministic run is byte-identical to itself', async (t) => {
  const runs = [];
  for (const i of [0, 1]) {
    const dir = mkdtempSync(join(tmpdir(), `obs-det-${i}-`));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const { trace_id } = await runDemo({
      sink: new JsonlSink({ dir, strict: true }),
      ids: deterministicIds(41), clock: deterministicClock('2026-05-05T00:00:00.000Z', 100), runDir: dir,
    });
    runs.push(readFileSync(join(dir, `${trace_id}.jsonl`), 'utf8'));
  }
  /* the deployment record stamps a wall-clock time; everything else must match */
  const strip = (s) => s.replace(/"at":"[^"]+"/g, '"at":"—"');
  assert.equal(strip(runs[0]), strip(runs[1]));
});

/* ------------------------------------------- regulatory impact (SESSION 10) */

/** A trace shaped the way the Change Detector shapes one: an
 *  impact-graph artifact, a routing decision, a summary observation
 *  and an editorial finding, all on one tool span. */
function impactTrace({ withDecision = true, dropped = 0 } = {}) {
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'regulatory-change-detector', task: 'detect' });
  const tool = run.startTool({ name: 'detector.impact', inputs: { change_id: 'rchg-001' } });
  tool.artifact({
    artifact_id: 'impact-graph-rchg-001',
    artifact_type: 'impact-graph',
    sha256: 'a'.repeat(64),
    bytes: 40000,
    preview: JSON.stringify({
      roots: ['tl-x'],
      counts: { nodes: 175, edges: 900, by_depth: { 0: 1, 1: 40, 2: 134 } },
      nodes: [{ id: 'tl-x', kind: 'timeline_event', dataset: 'data/timeline.json', depth: 0 }],
      edges: [],
      dropped_nodes: dropped, dropped_edges: dropped,
      sha256: 'a'.repeat(64),
      note: 'Shape and identity only. The complete graph is the ImpactAssessment record.',
    }),
  });
  tool.observe({
    summary: 'rchg-001 reaches 175 record(s).',
    subject: 'rchg-001',
    data: { surfaces: { timeline: 1 }, routing: { propagates_by_derivation: 40, review_proposal: 1, human_only: 0, automatically_actionable: 40 } },
  });
  tool.observe({ summary: 'EDITORIAL — tl-x.supersedes states the value that moved: "Originally 2 August 2027"', subject: 'tl-x', risk: 'high', data: { dataset: 'data/timeline.json', route: 'review_proposal' } });
  if (withDecision) {
    tool.decide({
      decision: '1 impact becomes a review proposal',
      rationale: 'nothing here reads prose',
      alternatives: [{ option: 'action it automatically', why_not: 'no governance permit' }],
    });
  }
  tool.end({ status: 'ok' });
  run.end({ status: 'ok' });
  return buildTree(t.sink.records).roots[0];
}

test('an impact map is read off the trace with its routing, its decision and its editorial findings', () => {
  const [i] = impactState(impactTrace(), 'trace-under-test');
  assert.equal(i.change_id, 'rchg-001');
  assert.equal(i.nodes, 175, 'the count must come from the graph\'s own header');
  assert.equal(i.edges, 900);
  assert.equal(i.shown.nodes, 1, 'and the preview must be reported separately from the count');
  assert.equal(i.routing.review_proposal, 1);
  assert.equal(i.editorial.length, 1);
  assert.equal(i.decision.length, 1);
  assert.deepEqual(i.gaps, [], 'the graph, the routing and the summary are all here');
});

test('an impact map missing its routing decision reports the gap rather than omitting it', () => {
  const [i] = impactState(impactTrace({ withDecision: false }));
  assert.ok(i.gaps.some((g) => /no routing decision/.test(g)),
    'what may be done about an impact without a human is the point of the record; its absence is a gap, not a blank');
});

test('a bounded graph preview is never reported as the whole graph', () => {
  const [i] = impactState(impactTrace({ dropped: 20 }));
  assert.equal(i.nodes, 175);
  assert.equal(i.dropped.nodes, 20);
  assert.ok(i.gaps.some((g) => /bounded preview/.test(g) && /sha256/.test(g)),
    'a preview that dropped nodes must say so and must carry the hash of the whole graph, or a viewer reads it as complete');
});

test('a truncated impact graph is a gap, never a graph of zero nodes', () => {
  /* The failure this test exists for actually happened: the first
     version inlined a two-hop subgraph, redact.mjs truncated the
     string at 8000 characters, and the viewer showed 0 nodes for a
     change that reached 175 records. A cap that silently produces a
     confident zero is the one failure this layer must not have. */
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'regulatory-change-detector', task: 'detect' });
  const tool = run.startTool({ name: 'detector.impact', inputs: {} });
  tool.artifact({ artifact_id: 'impact-graph-rchg-002', artifact_type: 'impact-graph', preview: '{"nodes":[{"id":"tl-' });
  tool.end({ status: 'ok' });
  run.end({ status: 'ok' });

  const [i] = impactState(buildTree(t.sink.records).roots[0]);
  assert.equal(i.nodes, 0);
  assert.ok(i.gaps.some((g) => /did not parse/.test(g)),
    'a graph that did not parse must say so; zero nodes with no gap reads as a change that reached nothing');
});

/* ------------------------------------------------ data depth (SESSION 11) */

/** A trace shaped the way the Data Depth Agent shapes one: a span
 *  per detector carrying its own counts, a SET ASIDE observation
 *  wherever a detector suppressed something, a census observation
 *  and an ordering decision. */
function depthTrace({ withCensus = true, withOrdering = true, withAsideDetail = true } = {}) {
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'data-depth', task: 'depth analysis' });

  const a = run.startTool({ name: 'depth.missing_competence', inputs: { kind: 'missing_competence' } });
  a.artifact({ artifact_id: 'kg-missing-competence-001', artifact_type: 'contract:KnowledgeGap', sha256: 'b'.repeat(64) });
  if (withAsideDetail) {
    a.observe({
      summary: 'SET ASIDE — 2 missing competences finding(s) not reported',
      subject: 'missing_competence',
      data: { suppressed: [
        { subject: 'chips-act', why: 'nothing in the corpus leans on the missing concept. The absence is real and is in the census.' },
        { subject: 'charter', why: 'the corpus records this act as scope:referenced, which the taxonomy defines as outside this brief\'s analytical scope.' },
      ] },
    });
  }
  a.end({ status: 'ok', outputs: { reported: 1, set_aside: 2, examined: 3 } });

  const b = run.startTool({ name: 'depth.missing_instrument', inputs: { kind: 'missing_instrument' } });
  b.end({ status: 'ok', outputs: { reported: 0, set_aside: 0, examined: 0 } });

  if (withCensus) {
    run.observe({
      summary: 'DEPTH CENSUS — 1 gap(s) reported, 2 set aside, as at 2026-09-02',
      subject: 'data/',
      data: {
        as_of: '2026-09-02',
        by_kind: { missing_competence: 1, missing_instrument: 0 },
        by_impact: { reader_could_be_misled: 1 },
        by_autonomy: { human_only: 1 },
        kinds_with_no_finding: ['missing_instrument'],
        corpus: { records: 651, edges: 3070 },
      },
    });
  }
  if (withOrdering) {
    run.decide({
      decision: 'Findings are ordered by what the absence costs a reader.',
      rationale: 'the brief refuses quantity',
      alternatives: ['Order by the number of records affected — rejected: that IS the quantity ranking.'],
    });
  }
  run.end({ status: 'ok' });
  return buildTree(t.sink.records).roots[0];
}

test('a depth analysis is read off the trace, with what it set aside as well as what it reported', () => {
  const d = depthState(depthTrace(), 'trace-under-test');
  assert.equal(d.reported, 1);
  assert.equal(d.set_aside, 2, 'a run that reported one gap and dropped two has told its reader something false unless both numbers travel');
  assert.equal(d.examined, 3);
  assert.equal(d.as_of, '2026-09-02');
  assert.equal(d.gap_ids.length, 1);
  assert.deepEqual(d.kinds_with_no_finding, ['missing_instrument']);
  assert.ok(d.ordering);
  assert.deepEqual(d.gaps, [], `expected no gaps in the view, got: ${d.gaps.join('; ')}`);
});

test('a detector that found nothing is carried, so "looked" can be told from "did not look"', () => {
  const d = depthState(depthTrace(), 'trace-under-test');
  const nothing = d.detectors.find((x) => x.kind === 'missing_instrument');
  assert.ok(nothing, 'a detector that found nothing must still appear');
  assert.equal(nothing.reported, 0);
  assert.equal(nothing.examined, 0);
});

test('a suppression with no reason on the trace is reported as a gap in the view', () => {
  const d = depthState(depthTrace({ withAsideDetail: false }), 'trace-under-test');
  assert.ok(d.gaps.some((g) => /set 2 finding\(s\) aside and recorded no reasons/.test(g)),
    'a suppression nobody can see is a suppression nobody can check, and the view must say so rather than showing a bare count');
});

test('a depth view missing its census or its ordering decision reports the gap rather than omitting it', () => {
  const noCensus = depthState(depthTrace({ withCensus: false }), 'trace-under-test');
  assert.ok(noCensus.gaps.some((g) => /census/.test(g)));
  assert.equal(noCensus.as_of, null, 'the as-of date is not invented when the run did not record one');

  const noOrdering = depthState(depthTrace({ withOrdering: false }), 'trace-under-test');
  assert.ok(noOrdering.gaps.some((g) => /ordering decision/.test(g)));
  assert.equal(noOrdering.ordering, null);
});

test('a trace with no depth analysis reports nothing rather than an empty analysis', () => {
  assert.equal(depthState(impactTrace(), 'trace-under-test'), null);
});

/* ------------------------------------------- gap proposals (SESSION 12) */

/** A trace shaped the way the gap router shapes one: a span per
 *  route carrying its own counts, a NO PROPOSAL observation wherever
 *  a gap was refused, handoffs to the agents that can do what it
 *  cannot, a census, a routing decision, and the claim that nothing
 *  was merged. */
function proposalTrace({ withCensus = true, withRouting = true, withMerged = true, withApproval = true, withReasons = true } = {}) {
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'proposal-router', task: 'route knowledge gaps' });

  const a = run.startTool({ name: 'propose.data_proposal', inputs: { route: 'data_proposal' } });
  a.artifact({ artifact_id: 'prop-annotate-001', artifact_type: 'contract:DataProposal', sha256: 'c'.repeat(64) });
  if (withApproval) {
    a.artifact({ artifact_id: 'appr-001', artifact_type: 'contract:ApprovalRequest', sha256: 'd'.repeat(64) });
    a.approval({ approval_id: 'appr-001', state: 'requested', subject: 'a note on a claim', requested_of: 'the repository owner', artifact_ids: ['prop-annotate-001'], risk: 'medium' });
  }
  a.end({ status: 'ok', outputs: { gaps: 1, proposals: 1, approvals: withApproval ? 1 : 0, data_gaps: 0, refused: 0 } });

  const b = run.startTool({ name: 'propose.owner_decision', inputs: { route: 'owner_decision' } });
  if (withReasons) {
    b.observe({
      summary: 'NO PROPOSAL — kg-stale-record-057 is a decision for the repository owner',
      subject: 'kg-stale-record-057',
      data: { route: 'owner_decision', why: 'What last_verified means across ten datasets is a schema decision with the widest reach in the corpus.' },
    });
  }
  b.end({ status: 'ok', outputs: { gaps: 1, proposals: 0, approvals: 0, data_gaps: 0, refused: 1 } });

  const c = run.startTool({ name: 'propose.verifier', inputs: { route: 'verifier' } });
  c.artifact({ artifact_id: 'dg-from-depth-001', artifact_type: 'contract:DataGap', sha256: 'e'.repeat(64) });
  c.handoff({ to_agent: 'legal-verifier', reason: 'a document has to be read first', artifact_ids: ['dg-from-depth-001'] });
  c.end({ status: 'ok', outputs: { gaps: 1, proposals: 0, approvals: 0, data_gaps: 1, refused: 0 } });

  if (withCensus) {
    run.observe({
      summary: 'PROPOSAL CENSUS — 1 proposal(s) authored, 1 gap(s) not proposable here, 3 routed, as at 2026-09-02',
      subject: 'data/',
      data: {
        as_of: '2026-09-02',
        by_route: { data_proposal: 1, taxonomy_proposal: 0, editorial: 0, verifier: 1, owner_decision: 1 },
        routes_with_no_gap: ['taxonomy_proposal', 'editorial'],
        merged: 0, applied: 0,
      },
    });
  }
  if (withRouting) {
    run.decide({
      decision: 'Each gap is routed by its kind, from a stated table.',
      rationale: 'nothing here has ever retrieved a document',
      alternatives: ['Author a DataProposal for every gap, leaving the value blank — rejected.'],
    });
  }
  if (withMerged) {
    run.observe({ summary: 'NOTHING MERGED — 1 approval(s) emitted in the "requested" state', subject: 'governance', data: { applied: 0, data_dir_written: false } });
  }
  run.end({ status: 'ok' });
  return buildTree(t.sink.records).roots[0];
}

test('a routing run is read off the trace, with what it refused as well as what it proposed', () => {
  const p = proposalState(proposalTrace(), 'trace-under-test');
  assert.equal(p.routed, 3);
  assert.equal(p.proposed, 1);
  assert.equal(p.evidence_questions, 1);
  assert.equal(p.refused, 1, 'a run that authored one proposal and refused one gap has told its reader something false unless both numbers travel');
  assert.equal(p.as_of, '2026-09-02');
  assert.equal(p.merged, 0);
  assert.equal(p.applied, 0);
  assert.equal(p.pending_approvals, 1);
  assert.deepEqual(p.routes_with_no_gap, ['taxonomy_proposal', 'editorial']);
  assert.deepEqual(p.gaps, [], `expected no gaps in the view, got: ${p.gaps.join('; ')}`);
});

test('a refusal reaches the view with its reason, not as a bare count', () => {
  const p = proposalState(proposalTrace(), 'trace-under-test');
  const owner = p.routes.find((r) => r.route === 'owner_decision');
  assert.equal(owner.refused, 1);
  assert.equal(owner.refused_detail.length, 1);
  assert.equal(owner.refused_detail[0].gap_id, 'kg-stale-record-057');
  assert.ok(owner.refused_detail[0].why.length > 40);

  const silent = proposalState(proposalTrace({ withReasons: false }), 'trace-under-test');
  assert.ok(silent.gaps.some((g) => /recorded no reasons/.test(g)),
    'a refusal nobody can see is a refusal nobody can check, and the view must say so rather than showing a bare count');
});

test('a proposal with no approval request is reported as a gap in the view', () => {
  const p = proposalState(proposalTrace({ withApproval: false }), 'trace-under-test');
  assert.ok(p.gaps.some((g) => /unapproved change that looks approved/.test(g)));
});

test('a routing view missing its census, its decision or its "nothing merged" claim says so', () => {
  assert.ok(proposalState(proposalTrace({ withCensus: false }), 't').gaps.some((g) => /census/.test(g)));
  assert.ok(proposalState(proposalTrace({ withRouting: false }), 't').gaps.some((g) => /routing decision/.test(g)));
  assert.ok(proposalState(proposalTrace({ withMerged: false }), 't').gaps.some((g) => /nothing merged/.test(g)));
});

test('the handoffs to other agents are carried, so a refusal is not a dead end', () => {
  const p = proposalState(proposalTrace(), 'trace-under-test');
  const verifier = p.routes.find((r) => r.route === 'verifier');
  assert.equal(verifier.handoffs.length, 1);
  assert.equal(verifier.handoffs[0].to_agent, 'legal-verifier');
  assert.deepEqual(verifier.handoffs[0].artifact_ids, ['dg-from-depth-001']);
});

test('a trace with no routing reports nothing rather than an empty routing', () => {
  assert.equal(proposalState(depthTrace(), 'trace-under-test'), null);
});

/* ------------------- honest run status and cross-agent linkage (SESSION 13) */

test('a root that closed ok over a failed TOOL span reads as degraded', () => {
  /* The exact shape the audit found and the read model missed: a
     Verifier run whose six candidates were all refused closed six
     `verifier.intake` spans failed, wrote six error records — and
     reported ok, because deriveStatus only looked at run spans and
     an intake span is a tool span. */
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'legal-verifier', task: 'check six candidates' });
  for (let i = 0; i < 6; i++) {
    const intake = run.startTool({ name: 'verifier.intake' });
    intake.error(new Error('this record is marked simulated: it is a fixture and is never actionable'));
    intake.end({ status: 'failed' });
  }
  run.end({ status: 'ok' });

  const root = buildTree(t.sink.records).roots[0];
  assert.equal(deriveStatus(root, collectRuns(root)), 'degraded');
  assert.equal(summarise(root, 'trace-under-test').status, 'degraded');
});

test('a clean run is still ok — degraded is not a synonym for "had a tool call"', () => {
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'data-depth', task: 'thirteen detectors' });
  const tool = run.startTool({ name: 'depth.missing_provision' });
  tool.end({ status: 'ok' });
  run.end({ status: 'ok' });
  const root = buildTree(t.sink.records).roots[0];
  assert.equal(deriveStatus(root, collectRuns(root)), 'ok');
});

test('a failed root is failed, not degraded — the ladder keeps its order', () => {
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'source-scout', task: 'poll' });
  const tool = run.startTool({ name: 'scout.fetch' });
  tool.end({ status: 'failed' });
  run.end({ status: 'failed' });
  const root = buildTree(t.sink.records).roots[0];
  assert.equal(deriveStatus(root, collectRuns(root)), 'failed');
});

test('attaching to a stored run appends an event and opens no second span', () => {
  /* `attachToRun` is how a later process records, on the UPSTREAM
     trace, that a downstream agent took its records. A second
     span.start for a span that already exists would be a second
     home for the same fact. */
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'source-scout', task: 'discover' });
  run.end({ status: 'ok' });
  const startsBefore = t.sink.records.filter((r) => r.type === 'span.start').length;

  const attached = t.attachToRun({ trace_id: run.trace_id, run_id: run.span_id, agent: 'source-scout' });
  attached.handoff({ to_agent: 'legal-verifier', artifact_ids: ['cand-abc'], payload: { downstream_trace_id: 'f'.repeat(32) } });
  attached.end({ status: 'failed' });

  assert.equal(t.sink.records.filter((r) => r.type === 'span.start').length, startsBefore, 'attaching opened a second span');
  assert.equal(t.sink.records.filter((r) => r.type === 'span.end').length, 1, 'attaching closed somebody else\'s span');
  const ho = t.sink.records.filter((r) => r.type === 'handoff');
  assert.equal(ho.length, 1);
  assert.equal(ho[0].span_id, run.span_id, 'the event did not land on the run it names');
});

test('a cross-trace handoff is accepted, not left forever open', () => {
  /* `accepted` used to ask "did an agent of that name start in THIS
     trace?", which answers no for a run that started in another
     one — so every chained run would show a permanently open
     handoff, and a panel that is always warning is a panel nobody
     reads. The payload naming the downstream trace is the receipt. */
  const t = fixture();
  const run = t.startRun({ kind: 'agent', agent: 'source-scout', task: 'discover' });
  run.handoff({ to_agent: 'legal-verifier', artifact_ids: ['cand-abc'], payload: { downstream_trace_id: 'a'.repeat(32) } });
  run.handoff({ to_agent: 'nobody-yet', artifact_ids: ['cand-def'] });
  run.end({ status: 'ok' });

  const trace = { handoffs: handoffState(buildTree(t.sink.records).roots[0]) };
  const chained = trace.handoffs.find((h) => h.to_agent === 'legal-verifier');
  assert.equal(chained.accepted, true, 'a handoff whose receipt names the downstream trace is not open');
  assert.equal(chained.downstream_trace_id, 'a'.repeat(32));
  const queued = trace.handoffs.find((h) => h.to_agent === 'nobody-yet');
  assert.equal(queued.accepted, false, 'a handoff nobody took must still read as a queue entry');
  assert.equal(queued.downstream_trace_id, null);
});

/* ------------------------------------------- the chain (SESSION 13) */

/** A stored upstream trace, in a throwaway directory, plus the
 *  contract records it produced. Real records from the schema
 *  fixtures, not a hand-shaped imitation of one. */
let upstreamSeed = 7;
function storedUpstream() {
  const dir = mkdtempSync(join(tmpdir(), 'eudp-chain-'));
  /* A fresh seed per call: two runs that shared a trace id would
     not be two runs. */
  const t = new Tracer({ sink: new JsonlSink({ dir }), ids: deterministicIds(++upstreamSeed), clock: deterministicClock('2026-01-01T00:00:00.000Z', 100) });
  const run = t.startRun({ kind: 'agent', agent: 'source-scout', task: 'discover' });
  const records = [FIXTURES.SourceCandidate(), FIXTURES.DataGap()].map((r) => ({
    ...r,
    trace_ref: { trace_id: run.trace_id, span_id: run.span_id, run_id: run.span_id },
    agent: 'source-scout',
  }));
  run.end({ status: 'ok' });
  return { dir, trace_id: run.trace_id, run_id: run.span_id, records };
}

test('the upstream run is read off the records, not guessed', () => {
  const { trace_id, run_id, records } = storedUpstream();
  const up = upstreamOf(records);
  assert.equal(up.trace_id, trace_id);
  assert.equal(up.run_id, run_id);
  assert.equal(up.agent, 'source-scout');
  assert.equal(up.simulated, true, 'every fixture is simulated, and a chain of fixtures is recorded as one');
  assert.equal(upstreamOf([]), null, 'records with no trace reference name no upstream run');
});

test('records from two different runs are reported as ambiguous rather than resolved by picking one', () => {
  const a = storedUpstream();
  const b = storedUpstream();
  const up = upstreamOf([...a.records, ...b.records]);
  assert.equal(up.ambiguous, true);
  assert.match(up.why, /different runs/);
});

test('the handoff lands on the upstream trace and names the downstream one', () => {
  const { dir, trace_id, run_id, records } = storedUpstream();
  const downstream = 'd'.repeat(32);
  const edge = recordHandoff({ upstream: upstreamOf(records), to_agent: 'legal-verifier', records, downstream_trace_id: downstream, reason: 'checking what they establish', dir });

  assert.equal(edge.emitted, true, edge.why);
  const stored = readTrace(trace_id, dir).records.filter((r) => r.type === 'handoff');
  assert.equal(stored.length, 1);
  assert.equal(stored[0].span_id, run_id, 'the edge did not land on the upstream run');
  assert.equal(stored[0].from_agent, 'source-scout');
  assert.equal(stored[0].to_agent, 'legal-verifier');
  assert.equal(stored[0].payload.downstream_trace_id, downstream);
  assert.equal(stored[0].payload.simulated, true);

  /* And no second copy of what the upstream run already emitted. */
  assert.equal(readTrace(trace_id, dir).records.filter((r) => r.type === 'artifact').length, 0,
    'the edge re-emitted artifact pointers onto a trace that already carries them');
});

test('a missing upstream trace is reported, not thrown, and writes no orphan', () => {
  const { records } = storedUpstream();
  const empty = mkdtempSync(join(tmpdir(), 'eudp-chain-empty-'));
  const edge = recordHandoff({ upstream: upstreamOf(records), to_agent: 'legal-verifier', records, downstream_trace_id: 'e'.repeat(32), dir: empty });
  assert.equal(edge.emitted, false);
  assert.match(edge.why, /no trace file/);
  assert.equal(readdirSync(empty).length, 0, 'an edge was written onto a trace that does not exist');
});

test('the chain does not weaken the refusal that makes a fixture never-actionable', () => {
  /* Recording that records were READ is not a statement that they
     may be ACTED ON. The intake gate is unchanged and still refuses
     every one of them. */
  const { dir, records } = storedUpstream();
  const edge = recordHandoff({ upstream: upstreamOf(records), to_agent: 'legal-verifier', records, downstream_trace_id: 'f'.repeat(32), dir });
  assert.equal(edge.emitted, true);
  for (const r of records) {
    assert.throws(() => receive(r, { allowSimulated: false }), /simulated/,
      'a record became actionable because a handoff edge was recorded for it');
  }
});

test('a record that does not satisfy its contract is not handed on', () => {
  const { dir, records } = storedUpstream();
  const broken = [...records.slice(0, 1), { ...records[1], state: 'nope' }];
  const edge = recordHandoff({ upstream: upstreamOf(records), to_agent: 'legal-verifier', records: broken, downstream_trace_id: 'a'.repeat(32), dir });
  assert.equal(edge.emitted, false);
  assert.match(edge.why, /do not satisfy their contract/);
});

test('two downstream runs reading the same upstream trace do not share a handoff id', () => {
  /* `Span.handoff()` defaults to `ho-<span_id>-<n>` off a counter
     the span holds. That is right within one run and wrong across
     processes: an attached span starts its counter at zero, so the
     Integrator and the Detector both reading one Verifier trace
     each minted `ho-<same span>-1` and the trace carried two
     different edges under one id. */
  const { dir, trace_id, records } = storedUpstream();
  const up = upstreamOf(records);
  const a = recordHandoff({ upstream: up, to_agent: 'verification-integrator', records, downstream_trace_id: 'a'.repeat(32), dir });
  const b = recordHandoff({ upstream: up, to_agent: 'regulatory-change-detector', records, downstream_trace_id: 'b'.repeat(32), dir });
  assert.equal(a.emitted && b.emitted, true);
  assert.notEqual(a.handoff_id, b.handoff_id);

  const stored = readTrace(trace_id, dir).records.filter((r) => r.type === 'handoff');
  assert.equal(new Set(stored.map((h) => h.handoff_id)).size, stored.length, 'two edges on one trace share an id');

  /* And the same downstream run recorded twice is the same edge. */
  const again = recordHandoff({ upstream: up, to_agent: 'verification-integrator', records, downstream_trace_id: 'a'.repeat(32), dir });
  assert.equal(again.handoff_id, a.handoff_id);
});
