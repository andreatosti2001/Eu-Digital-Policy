#!/usr/bin/env node
/* ============================================================
   agent/observability/cli.mjs

     node agent/observability/cli.mjs list
     node agent/observability/cli.mjs show <trace-id>
     node agent/observability/cli.mjs chain [--file f] [--change c] [--trace t]
     node agent/observability/cli.mjs impact [--trace t] [--change c] [--graph]
     node agent/observability/cli.mjs validate
     node agent/observability/cli.mjs export <trace-id> [--provenance]
     node agent/observability/cli.mjs serve [--port 7801] [--open]

   Zero dependencies, like the four validators in tools/. `validate`
   exits 1 on a malformed store, so it can gate a commit the same
   way design-qa.mjs does.
   ============================================================ */

import { listTraceFiles, readTrace, DEFAULT_RUN_DIR } from './sink.mjs';
import { loadTrace, listRuns, overview, traceChain } from './query.mjs';
import { toOtlp, toProvenanceLedger } from './otlp.mjs';
import { validateRecord } from './schema.mjs';
import { serve } from './server.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0] ?? 'list';
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1]?.startsWith('--') ? true : argv[i + 1] ?? true);
};
const DIR = flag('dir', DEFAULT_RUN_DIR);

const GLYPH = { ok: '✓', failed: '✗', degraded: '!', running: '·', cancelled: '—', skipped: '–', unreadable: '?' };
const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
const dur = (ms) => (ms == null ? '     —' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s`.padStart(6) : `${ms}ms`.padStart(6));

function cmdList() {
  const runs = listRuns(DIR);
  if (!runs.length) {
    console.log(`no traces in ${DIR}\n  node agent/observability/demo/workflow.mjs   # writes one`);
    return;
  }
  console.log(`${runs.length} trace(s) in ${DIR}\n`);
  console.log(`  ${pad('status', 9)}${pad('trace id', 34)}${pad('agent', 14)}${pad('runs', 6)}${pad('dur', 8)}task`);
  for (const r of runs) {
    console.log(`  ${GLYPH[r.status] ?? '?'} ${pad(r.status, 9)}${pad(r.trace_id, 34)}${pad(r.agent, 14)}${pad(r.runs, 6)}${dur(r.latency_ms)}  ${r.simulated ? 'SIMULATED · ' : ''}${r.task ?? ''}`);
  }
}

function line(span, depth) {
  const ind = '  '.repeat(depth);
  const g = GLYPH[span.status] ?? '?';
  const conf = span.confidence == null ? '' : ` conf ${span.confidence}`;
  const risk = span.risk && span.risk !== 'none' ? ` risk ${span.risk}` : '';
  console.log(`  ${g} ${dur(span.latency_ms)}  ${ind}${span.kind === 'tool' ? '⌁' : span.kind === 'llm' ? '◇' : '▸'} ${span.name}${conf}${risk}`);
  for (const e of span.events) {
    const label = { observation: '·obs', decision: '·dec', artifact: '·art', handoff: '·→', approval: '·appr', provenance: '·src', error: '·err', usage: '·use', website_change: '·web' }[e.type] ?? e.type;
    const text = e.summary ?? e.decision ?? e.subject ?? e.artifact_id ?? e.source_id ?? e.message ?? (e.to_agent ? `${e.from_agent} → ${e.to_agent}` : '') ?? '';
    const extra = e.type === 'approval' ? ` [${e.state}]` : e.type === 'usage' ? ` ${e.total_tokens ?? '?'} tok $${e.cost_usd ?? 0}` : '';
    console.log(`           ${ind}  ${label}${extra} ${String(text).slice(0, 96)}`);
  }
  span.children.forEach((c) => line(c, depth + 1));
}

function cmdShow(id) {
  const t = loadTrace(id, DIR);
  if (!t) { console.error(`no such trace: ${id}`); process.exit(1); }
  const s = t.summary;
  console.log(`trace ${id}`);
  if (s?.simulated) console.log('SIMULATED — this trace contains fixture data and asserts no legal fact.');
  console.log(`  status ${s.status} · ${s.runs} runs · ${s.spans} spans · ${s.tools} tool calls · ${s.errors} errors`);
  if (s.usage) console.log(`  tokens ${s.usage.total_tokens} · cost $${s.usage.cost_usd}`);
  console.log(`  ${JSON.stringify(s.counts)}\n`);
  t.roots.forEach((r) => line(r, 0));

  const pending = t.approvals.filter((a) => a.pending);
  if (pending.length) {
    console.log(`\n  PENDING APPROVALS`);
    for (const a of pending) console.log(`    ⚑ ${a.approval_id} — ${a.subject} (of ${a.requested_of ?? '?'}, risk ${a.risk ?? '?'})`);
  }
  const open = t.handoffs.filter((h) => !h.accepted);
  if (open.length) {
    console.log(`\n  OPEN HANDOFFS`);
    for (const h of open) console.log(`    → ${h.from_agent} → ${h.to_agent}: ${h.reason ?? ''}`);
  }
  if (t.broken_lines.length) console.log(`\n  ${t.broken_lines.length} unparseable line(s)`);
}

function cmdChain() {
  const chains = traceChain({ file: flag('file'), change_id: flag('change'), trace_id: flag('trace') }, DIR);
  if (!chains.length) { console.log('no website change matches'); return; }
  for (const c of chains) {
    console.log(`\n${c.change_id} — ${c.status}${c.simulated ? ' — SIMULATED' : ''}`);
    console.log(`  files: ${c.files.join(', ')}`);
    console.log(`  trace: ${c.trace_id}`);
    for (const [stage, rows] of Object.entries(c.chain)) {
      console.log(`  ${pad(stage, 16)}${rows.length ? '' : '(none)'}`);
      for (const r of rows) console.log(`      ${JSON.stringify(r)}`);
    }
    console.log(c.gaps.length ? `  GAPS: ${c.gaps.join('; ')}` : '  no gaps: the chain is complete');
  }
}

/**
 * The regulatory impact maps in the store.
 *
 * SESSION 10's brief asks for the dependency/impact graph to be
 * exposed through observability. This is the terminal half of that;
 * `/api/impact` and the Impact panel in the viewer are the other
 * half.
 *
 * It prints the routing before the graph, deliberately. The graph is
 * the interesting object and the routing is the one somebody has to
 * act on — and an editorial impact is a sentence on a production
 * site about EU law that may now be false, which nothing in this
 * repository will catch.
 */
function cmdImpact() {
  const wantTrace = flag('trace');
  const wantChange = flag('change');
  const traces = typeof wantTrace === 'string' ? [wantTrace] : listRuns(DIR).map((r) => r.trace_id);
  let found = 0;

  for (const id of traces) {
    const t = loadTrace(id, DIR);
    if (!t) continue;
    for (const i of t.impact) {
      if (typeof wantChange === 'string' && i.change_id !== wantChange) continue;
      found++;
      const shown = i.dropped.nodes || i.dropped.edges ? `, ${i.shown.nodes}/${i.shown.edges} on this trace` : '';
      console.log(`\n${i.change_id} — ${i.nodes} node(s), ${i.edges} edge(s)${shown}${i.simulated ? ' — SIMULATED' : ''}`);
      console.log(`  trace: ${i.trace_id}   agent: ${i.agent ?? '?'}`);
      if (i.routing) {
        console.log(`  routing  ${Object.entries(i.routing).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
      }
      if (i.surfaces) {
        const hit = Object.entries(i.surfaces).filter(([, n]) => n > 0);
        console.log(`  surfaces ${hit.length ? hit.map(([k, n]) => `${k} ${n}`).join(' · ') : '(none carrying a record)'}`);
      }
      for (const d of i.decision) console.log(`  decision ${d.decision}`);
      for (const e of i.editorial) console.log(`  ⚑ ${e.summary}`);
      if (flag('graph') && i.graph) {
        console.log(`  GRAPH  ${i.dropped.nodes || i.dropped.edges ? `(nearest first; ${i.dropped.nodes} node(s) and ${i.dropped.edges} edge(s) not carried on the trace)` : '(complete)'}`);
        for (const n of i.graph.nodes) console.log(`      ${n.depth === 0 ? '●' : '·'} ${pad(n.id, 44)} ${pad(n.kind, 20)} ${n.dataset}`);
        for (const e of i.graph.edges) console.log(`      ${e.from} → ${e.to}  (${e.field}${e.via_wildcard ? ', via wildcard' : ''})`);
      }
      console.log(i.gaps.length ? `  GAPS: ${i.gaps.join('; ')}` : '  no gaps: the graph, the routing and the summary are all on this trace');
    }
  }
  if (!found) console.log('no impact map matches. `node agent/detector/cli.mjs --mock` writes some.');
}

function cmdValidate() {
  let records = 0, bad = 0, broken = 0;
  for (const f of listTraceFiles(DIR)) {
    const id = f.replace(/\.jsonl$/, '');
    const raw = readTrace(id, DIR);
    broken += raw.broken.length;
    for (const b of raw.broken) console.log(`  BROKEN ${id}:${b.line} ${b.message}`);
    for (const r of raw.records) {
      records++;
      const errs = validateRecord(r);
      if (errs.length) { bad++; errs.forEach((e) => console.log(`  INVALID ${id}: ${e}`)); }
    }
    /* a span that started and never ended is legitimate while a run
       is live, and a defect once the run is over */
    const t = loadTrace(id, DIR);
    if (t?.summary && t.summary.status !== 'running') {
      const stray = [];
      const walk = (s) => { if (s.status === 'running') stray.push(s.name); s.children.forEach(walk); };
      t.roots.forEach(walk);
      if (stray.length) console.log(`  UNCLOSED ${id}: ${stray.length} span(s) never ended: ${stray.join(', ')}`);
    }
  }
  console.log(`\n${records} record(s), ${bad} invalid, ${broken} unparseable line(s) in ${DIR}`);
  process.exit(bad || broken ? 1 : 0);
}

function cmdExport(id) {
  if (!id) { console.error('export needs a trace id'); process.exit(1); }
  const out = flag('provenance') ? toProvenanceLedger(id, DIR) : toOtlp(id, DIR);
  if (!out) { console.error(`no such trace: ${id}`); process.exit(1); }
  console.log(JSON.stringify(out, null, 2));
}

switch (cmd) {
  case 'list': cmdList(); break;
  case 'show': cmdShow(argv[1]); break;
  case 'chain': cmdChain(); break;
  case 'impact': cmdImpact(); break;
  case 'validate': cmdValidate(); break;
  case 'export': cmdExport(argv[1]); break;
  case 'summary': console.log(JSON.stringify(overview(DIR), null, 2)); break;
  case 'serve': serve({ port: Number(flag('port', 7801)), dir: DIR }); break;
  default:
    console.error(`unknown command "${cmd}"\n  list | show <id> | chain | impact | validate | export <id> | summary | serve`);
    process.exit(1);
}
