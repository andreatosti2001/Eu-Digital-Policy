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
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { redact } from './redact.mjs';
import { validateRecord } from './schema.mjs';
import { Tracer } from './tracer.mjs';
import { MemorySink, JsonlSink } from './sink.mjs';
import { deterministicIds, deterministicClock } from './ids.mjs';
import { buildTree, loadTrace, traceChain, deriveStatus, collectRuns, summarise, impactState } from './query.mjs';
import { toOtlp, toProvenanceLedger } from './otlp.mjs';
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
