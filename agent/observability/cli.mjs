#!/usr/bin/env node
/* ============================================================
   agent/observability/cli.mjs

     node agent/observability/cli.mjs list [--fail-on ok|degraded|failed|never]
     node agent/observability/cli.mjs show <trace-id>
     node agent/observability/cli.mjs chain [--file f] [--change c] [--trace t]
     node agent/observability/cli.mjs impact [--trace t] [--change c] [--graph]
     node agent/observability/cli.mjs depth  [--trace t] [--aside]
     node agent/observability/cli.mjs proposals [--trace t] [--refused]
     node agent/observability/cli.mjs architecture [--trace t] [--aside]
     node agent/observability/cli.mjs editorial [--trace t] [--no-change]
     node agent/observability/cli.mjs ux [--trace t] [--open] [--backlog]
     node agent/observability/cli.mjs validate
     node agent/observability/cli.mjs export <trace-id> [--provenance]
     node agent/observability/cli.mjs serve [--port 7801] [--open]

   Zero dependencies, like the four validators in tools/. `validate`
   exits 1 on a malformed store, so it can gate a commit the same
   way design-qa.mjs does.

   EXIT CODES, and why they differ between `show` and `list`
   (SESSION 13). `degraded` is derived by query.mjs for a root that
   closed `ok` over a failed child; until SESSION 13 it reached
   neither the summary nor the exit code, and a run whose entire
   input was refused reported `✓ ok` and exited 0.

     show <trace-id>   asks about ONE run, so it answers with that
                       run: 0 ok · 2 degraded · 1 failed or running.
     list              is the history of the store, which accumulates
                       every run ever made. A failed run from March
                       is not a statement about today, so it exits 0
                       by default and prints the census. `--fail-on
                       degraded` (exit 2) or `--fail-on failed`
                       (exit 1) is an operator's decision, spelled
                       the same way agent/scout/schedule/run.mjs
                       already spells it.
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

const FAIL_ON = new Set(['ok', 'degraded', 'failed', 'never']);
/** Rank, so `--fail-on degraded` catches `failed` too. */
const SEVERITY = { ok: 0, skipped: 0, cancelled: 0, running: 1, degraded: 2, failed: 3, unreadable: 3 };

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

  /* THE SUMMARY LINE. A count of what the statuses above add up to,
     with `degraded` named rather than folded into `ok` — a run that
     closed ok over a failed child is not a run that succeeded, and
     a reader scanning fifteen rows should not have to work that out
     one row at a time. */
  const census = {};
  for (const r of runs) census[r.status] = (census[r.status] ?? 0) + 1;
  const order = ['failed', 'degraded', 'running', 'ok', 'skipped', 'cancelled', 'unreadable'];
  const parts = order.filter((k) => census[k]).map((k) => `${census[k]} ${k}`);
  for (const k of Object.keys(census)) if (!order.includes(k)) parts.push(`${census[k]} ${k}`);
  console.log(`\n  ${runs.length} trace(s): ${parts.join(' · ')}`);

  const failOn = String(flag('fail-on', 'never'));
  if (!FAIL_ON.has(failOn)) {
    console.error(`  unknown --fail-on "${failOn}". One of: ${[...FAIL_ON].join(', ')}`);
    process.exitCode = 1;
    return;
  }
  if (failOn === 'never') {
    if (census.degraded || census.failed) {
      console.log(`  This history is not a health check — a run that failed in March is not a statement about today.`);
      console.log(`  "--fail-on degraded" exits 2 and "--fail-on failed" exits 1, where a caller wants one.`);
    }
    return;
  }
  const worst = runs.reduce((m, r) => Math.max(m, SEVERITY[r.status] ?? 0), 0);
  if (worst >= (SEVERITY[failOn] ?? 99)) {
    console.error(`\n  --fail-on ${failOn} is set and the store is worse than that.`);
    process.exitCode = worst >= SEVERITY.failed ? 1 : 2;
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
  /* The chained runs: an edge whose payload names the trace that
     took the records. This is the answer to "can this execution be
     correlated with another agent's?" in the downstream direction;
     `parent_run_id` on the receiving run is the same edge read the
     other way. */
  const chained = t.handoffs.filter((h) => h.downstream_trace_id);
  if (chained.length) {
    console.log(`\n  HANDED ON`);
    for (const h of chained) {
      console.log(`    → ${h.from_agent} → ${h.to_agent}: trace ${h.downstream_trace_id}${h.payload?.simulated ? ' — SIMULATED chain' : ''} (${h.artifact_ids?.length ?? 0} record(s))`);
    }
  }
  if (t.broken_lines.length) console.log(`\n  ${t.broken_lines.length} unparseable line(s)`);

  /* ONE run, so the exit code is that run's answer. */
  if (s.status === 'degraded') {
    console.log(`\n  degraded — this run closed "ok" over at least one failed child span. Exit 2.`);
    process.exitCode = 2;
  } else if (s.status === 'failed' || s.status === 'running') {
    process.exitCode = 1;
  }
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

/**
 * The depth analyses in the store.
 *
 * SESSION 11's brief asks for the analysis to be instrumented. This
 * is the terminal half; `/api/depth` and the Data depth panel in the
 * viewer are the other.
 *
 * IT PRINTS WHAT THE RUN SET ASIDE, NOT ONLY WHAT IT REPORTED, and
 * `--aside` names each one. That is the whole discipline of this
 * agent made visible: a run that found eighty-eight absences and
 * reported fifty-seven has made a judgement thirty-one times, and a
 * view that showed only the fifty-seven would present that judgement
 * as if it were the corpus.
 */
function cmdDepth() {
  const wantTrace = flag('trace');
  const traces = typeof wantTrace === 'string' ? [wantTrace] : listRuns(DIR).map((r) => r.trace_id);
  let found = 0;

  for (const id of traces) {
    const t = loadTrace(id, DIR);
    if (!t?.depth) continue;
    const d = t.depth;
    found++;
    console.log(`\n${d.trace_id} — ${d.reported} gap(s) reported, ${d.set_aside} set aside, of ${d.examined} examined${d.simulated ? ' — SIMULATED' : ''}`);
    console.log(`  as of ${d.as_of ?? '?'}${d.corpus ? `   corpus ${d.corpus.records} record(s), ${d.corpus.edges} edge(s)` : ''}`);
    if (d.by_impact) console.log(`  impact   ${Object.entries(d.by_impact).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    if (d.by_autonomy) console.log(`  autonomy ${Object.entries(d.by_autonomy).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    console.log(`  found nothing: ${d.kinds_with_no_finding.length ? d.kinds_with_no_finding.join(', ') : 'every kind found something'}`);
    if (d.ordering) console.log(`  ordered by ${d.ordering.decision}`);
    for (const det of d.detectors) {
      console.log(`    ${pad(det.kind, 34)} ${String(det.reported).padStart(2)} reported  ${String(det.set_aside).padStart(2)} set aside`);
      if (flag('aside')) for (const a of det.set_aside_detail) console.log(`        − ${pad(a.subject, 40)} ${a.why}`);
    }
    console.log(d.gaps.length ? `  GAPS: ${d.gaps.join('; ')}` : '  no gaps: the census, the ordering decision and every suppression reason are all on this trace');
  }
  if (!found) console.log('no depth analysis in the store. `node agent/depth/cli.mjs --as-of <date>` writes one.');
}

/**
 * The gap-routing runs in the store.
 *
 * SESSION 12's brief asks that each gap can become a structured
 * proposal. IT PRINTS THE REFUSALS BESIDE THE PROPOSALS, because on
 * this corpus most gaps cannot become one: closing them means writing
 * a legal fact read from a document, and nothing in this repository
 * has ever retrieved one. A view that showed only the proposals would
 * report the session as more complete than it is.
 */
function cmdProposals() {
  const wantTrace = flag('trace');
  const traces = typeof wantTrace === 'string' ? [wantTrace] : listRuns(DIR).map((r) => r.trace_id);
  let found = 0;

  for (const id of traces) {
    const t = loadTrace(id, DIR);
    if (!t?.proposals) continue;
    const p = t.proposals;
    found++;
    console.log(`\n${p.trace_id} — ${p.proposed} proposal(s) authored, ${p.evidence_questions} evidence question(s) handed on, ${p.refused} not proposable here, of ${p.routed} gap(s) routed${p.simulated ? ' — SIMULATED' : ''}`);
    console.log(`  as of ${p.as_of ?? '?'}   ${p.pending_approvals} approval(s) pending · ${p.merged ?? '?'} merged · ${p.applied ?? '?'} applied`);
    if (p.by_route) console.log(`  routes   ${Object.entries(p.by_route).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    console.log(`  no gap took: ${p.routes_with_no_gap.length ? p.routes_with_no_gap.join(', ') : 'every route took at least one'}`);
    if (p.routing) console.log(`  routed by ${p.routing.decision}`);
    for (const r of p.routes) {
      console.log(`    ${pad(r.route, 20)} ${String(r.gaps).padStart(2)} gap(s)  ${String(r.proposals).padStart(2)} proposal(s)  ${String(r.data_gaps).padStart(2)} evidence question(s)  ${String(r.refused).padStart(2)} refused`);
      for (const h of r.handoffs) console.log(`        → ${pad(h.to_agent, 20)} ${(h.artifact_ids ?? []).join(', ')}`);
      if (flag('refused')) for (const x of r.refused_detail) console.log(`        − ${pad(x.gap_id, 40)} ${x.why}`);
    }
    console.log(p.gaps.length ? `  GAPS: ${p.gaps.join('; ')}` : '  no gaps: the census, the routing decision, every refusal reason and the "nothing merged" claim are all on this trace');
  }
  if (!found) console.log('no gap routing in the store. `node agent/proposals/data/cli.mjs --as-of <date>` writes one.');
}

/**
 * What a Knowledge Architect run concluded about the information
 * model.
 *
 * SESSION 13's brief asks for the agent's reasoning to be exposed
 * here. IT PRINTS THE EIGHT ANSWERS FIRST, before the proposals,
 * because a question answered "no" is the model working and a view
 * that led with the defect count would report the model as nothing
 * but its defects. What each lens EXAMINED travels with its answer,
 * so "looked and found nothing" is never confusable with "did not
 * look".
 */
function cmdArchitecture() {
  const wantTrace = flag('trace');
  const traces = typeof wantTrace === 'string' ? [wantTrace] : listRuns(DIR).map((r) => r.trace_id);
  let found = 0;

  for (const id of traces) {
    const t = loadTrace(id, DIR);
    if (!t?.architecture) continue;
    const a = t.architecture;
    found++;
    console.log(`\n${a.trace_id} — ${a.answered_yes.length} of ${a.questions} question(s) answered yes, ${a.proposed} proposal(s), ${a.set_aside} set aside${a.simulated ? ' — SIMULATED' : ''}`);
    console.log(`  as of ${a.as_of ?? '?'}   ${a.pending_approvals} approval(s) pending · ${a.merged ?? '?'} merged · ${a.applied ?? '?'} applied · ${a.schemas_changed ?? '?'} schema(s) changed · ${a.values_proposed ?? '?'} value(s) proposed`);
    if (a.model) console.log(`  model    ${a.model.containers ?? '?'} container(s) · ${a.model.vocabularies ?? '?'} vocabular${a.model.vocabularies === 1 ? 'y' : 'ies'} · ${a.model.pages ?? '?'} page(s)`);
    console.log(`  answered no: ${a.answered_no.length ? a.answered_no.map((q) => `q${q}`).join(', ') : 'every question found something'}`);
    if (a.ordering) console.log(`  ranked by ${a.ordering.decision}`);
    for (const l of a.lenses) {
      console.log(`    q${l.question} ${pad(l.lens, 22)} ${String(l.answer ?? '?').toUpperCase().padEnd(4)} ${String(l.examined).padStart(4)} examined  ${String(l.reported).padStart(2)} reported  ${String(l.set_aside).padStart(2)} set aside`);
      for (const s of l.subjects) console.log(`          + ${s}`);
      for (const h of l.handoffs) console.log(`          → ${pad(h.to_agent, 20)} ${String(h.reason ?? '').slice(0, 90)}`);
      if (flag('aside')) for (const x of l.not_reported) console.log(`          − ${pad(x.subject, 46)} ${String(x.why).slice(0, 90)}`);
    }
    console.log(a.gaps.length ? `  GAPS: ${a.gaps.join('; ')}` : '  no gaps: the census, the ordering decision, all eight answers, every set-aside reason and the "nothing merged" claim are on this trace');
  }
  if (!found) console.log('no architecture analysis in the store. `node agent/architect/cli.mjs --as-of <date>` writes one.');
}

/**
 * What an Editorial Agent run did to the site's prose, and — the
 * half that matters more — what it did not.
 *
 * IT PRINTS THE THREE KINDS SEPARATELY AND THE DRAFTED COUNT FIRST,
 * because they are not the same risk. A drafted substitution is the
 * only text this agent composes; an analytical flag and a
 * recommendation are a reviewer's queue. Collapsing them into one
 * "proposals" number would hide the only one a reader should look at
 * before anything else.
 *
 * The no-change explanations are printed too, for the reason the
 * depth view names its suppressions: "looked and found nothing" and
 * "did not look" are different findings, and a view showing only the
 * proposals reports the first as the second.
 */
function cmdEditorial() {
  const wantTrace = flag('trace');
  const traces = typeof wantTrace === 'string' ? [wantTrace] : listRuns(DIR).map((r) => r.trace_id);
  let found = 0;

  for (const id of traces) {
    const t = loadTrace(id, DIR);
    if (!t?.editorial) continue;
    const e = t.editorial;
    found++;
    console.log(`\n${e.trace_id} — ${e.proposals} proposal(s), of which ${e.drafted ?? '?'} drafted; ${e.no_change} needing no change${e.simulated ? ' — SIMULATED' : ''}`);
    console.log(`  as of ${e.as_of ?? '?'}   ${e.pending_approvals} approval(s) pending · ${e.merged ?? '?'} merged · ${e.applied ?? '?'} applied · ${e.sentences_authored ?? '?'} sentence(s) authored`);
    console.log(`  inputs   ${e.inputs_admitted ?? '?'} admitted · ${e.inputs_refused ?? '?'} refused at intake`);
    console.log(`  prose    ${e.attributed ?? '?'} block(s) carry a claim record, ${e.unattributed ?? '?'} carry none${e.by_home ? ` · homes ${Object.entries(e.by_home).map(([k, n]) => `${k} ${n}`).join(' · ')}` : ''}`);
    if (e.by_state) console.log(`  states   ${Object.entries(e.by_state).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    if (e.by_kind) console.log(`  by kind  ${Object.entries(e.by_kind).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    console.log(`  reached  ${e.blocks_reached ?? '?'} block(s) · ${e.open_questions} open question(s) — a sentence containing the word, and a reading no agent here makes`);
    if (e.triage) console.log(`  triaged by ${e.triage.decision}`);
    for (const s of e.stages) {
      console.log(`    ${pad(s.stage, 34)} ${String(s.examined ?? '').padStart(4)} examined  ${String(s.reached ?? '').padStart(3)} reached  ${String(s.proposed ?? '').padStart(2)} proposed  ${String(s.no_change ?? '').padStart(2)} no change`);
      for (const r of s.refused) console.log(`          − ${pad(r.subject, 30)} ${String(r.why).slice(0, 96)}`);
    }
    if (flag('no-change')) for (const x of e.explanations) console.log(`    = ${pad(x.subject, 52)} ${String(x.state)} · ${String(x.how).slice(0, 70)}`);
    console.log(e.gaps.length ? `  GAPS: ${e.gaps.join('; ')}` : '  no gaps: the census, the triage decision, every intake refusal, every no-change explanation and the "nothing applied" claim are on this trace');
  }
  if (!found) console.log('no editorial analysis in the store. `node agent/proposals/editorial/cli.mjs --as-of <date>` writes one.');
}

/**
 * What each UX audit run found, what it could not settle, and what
 * it declined to report as somebody else's.
 *
 * The three are printed side by side on purpose. An audit that
 * reported ten findings and could not settle twelve of its own
 * questions has told you something about the site AND something
 * about how much of the site is answerable without opening it, and a
 * view that showed only the first would read as coverage.
 */
function cmdUx() {
  const wantTrace = flag('trace');
  const traces = typeof wantTrace === 'string' ? [wantTrace] : listRuns(DIR).map((r) => r.trace_id);
  let found = 0;

  for (const id of traces) {
    const t = loadTrace(id, DIR);
    if (!t?.ux) continue;
    const u = t.ux;
    found++;
    console.log(`\n${u.trace_id} — ${u.findings} finding(s), ${u.open_questions} open question(s), ${u.testable_proposals} testable proposal(s)${u.simulated ? ' — SIMULATED' : ''}`);
    console.log(`  as of ${u.as_of ?? '?'}   ${u.pending_approvals} approval(s) pending · ${u.applied ?? '?'} applied · ${u.stylesheets_written ?? '?'} stylesheet(s) written · ${u.pages_opened ?? '?'} page(s) opened · ${u.tokens_invented ?? '?'} token(s) invented`);
    if (u.surface) console.log(`  surface  ${u.surface.pages} pages · ${u.surface.stylesheets} stylesheets · ${u.surface.modules} modules · ${u.surface.css_rules} CSS rules · ${u.surface.journeys} journeys`);
    if (u.by_severity) console.log(`  severity ${Object.entries(u.by_severity).map(([k, n]) => `${k} ${n}`).join(' · ')}   (${u.high_priority} at critical or high)`);
    if (u.by_class) console.log(`  class    ${Object.entries(u.by_class).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    if (u.by_journey) console.log(`  journey  ${Object.entries(u.by_journey).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    console.log(`  answered no: ${u.questions_answered_no.length ? u.questions_answered_no.map((q) => `q${q}`).join(' · ') : 'every question found something'}`);
    if (u.ordering) console.log(`  ranked by ${u.ordering.decision}`);
    for (const l of u.lenses) {
      console.log(`    ${pad(`q${l.question ?? '?'} ${l.lens}`, 34)} ${String(l.examined ?? '').padStart(4)} examined  ${String(l.reported ?? '').padStart(2)} found  ${String(l.open_questions ?? '').padStart(2)} open  ${String(l.set_aside ?? '').padStart(2)} aside`);
      for (const r of l.routed) console.log(`          → ${pad(r.subject, 30)} ${r.route ?? 'no owner named'}`);
    }
    if (flag('backlog')) for (const e of u.backlog) console.log(`    ${String(e.rank).padStart(3)}. [${e.severity}] ${pad(e.finding_class, 26)} ${String(e.subject).slice(0, 72)}`);
    if (flag('open')) for (const q of u.open_questions_named) console.log(`    ? ${pad(q.subject, 40)} ${String(q.missing).slice(0, 80)}`);
    for (const n of u.no_proposal) console.log(`    − no proposal: ${pad(n.subject, 44)} ${String(n.why).slice(0, 70)}`);
    console.log(u.gaps.length ? `  GAPS: ${u.gaps.join('; ')}` : '  no gaps: the census, the backlog, the ordering decision, every open question and the "nothing restyled" claim are on this trace');
  }
  if (!found) console.log('no UX audit in the store. `node agent/ux/cli.mjs --as-of <date>` writes one.');
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
  case 'depth': cmdDepth(); break;
  case 'proposals': cmdProposals(); break;
  case 'architecture': cmdArchitecture(); break;
  case 'editorial': cmdEditorial(); break;
  case 'ux': cmdUx(); break;
  case 'validate': cmdValidate(); break;
  case 'export': cmdExport(argv[1]); break;
  case 'summary': console.log(JSON.stringify(overview(DIR), null, 2)); break;
  case 'serve': serve({ port: Number(flag('port', 7801)), dir: DIR }); break;
  default:
    console.error(`unknown command "${cmd}"\n  list | show <id> | chain | impact | depth | proposals | architecture | editorial | ux | validate | export <id> | summary | serve`);
    process.exit(1);
}
