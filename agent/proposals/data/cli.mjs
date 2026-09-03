#!/usr/bin/env node
/* ============================================================
   agent/proposals/data/cli.mjs

     node agent/proposals/data/cli.mjs --as-of YYYY-MM-DD
     node agent/proposals/data/cli.mjs --as-of YYYY-MM-DD --gaps <trace-id>
     node agent/proposals/data/cli.mjs --as-of YYYY-MM-DD --dry
     node agent/proposals/data/cli.mjs --as-of YYYY-MM-DD --route verifier
     node agent/proposals/data/cli.mjs --as-of YYYY-MM-DD --refusals

   --as-of is REQUIRED. A proposal quotes a record verbatim, and only
   a stated as-of date says which version of that record it quoted.

   With --gaps it reads the KnowledgeGap records a depth run stored in
   agent/records/<trace-id>.jsonl. Without it, it runs the Data Depth
   Agent inline over the current corpus — which is read-only, so the
   convenience costs nothing.

   NOTHING IS WRITTEN TO data/, AND NOTHING IS MERGED. Every proposal
   is emitted with an ApprovalRequest in the "requested" state, and
   pending is never granted. The run hashes the whole of data/ before
   and after and says which.
   ============================================================ */

import { Tracer } from '../../observability/tracer.mjs';
import { JsonlSink } from '../../observability/sink.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../../scout/store.mjs';
import { loadCorpus, hashDataDir } from '../../integrate/canonical.mjs';
import { GAP_ROUTES } from '../../schemas/types.mjs';
import { DepthAgent } from '../../depth/depth.mjs';
import { ProposalRouter, PROPOSER_AGENT } from './proposals.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const out = (s = '') => process.stdout.write(`${s}\n`);
const dry = has('--dry');
const showRefusals = has('--refusals');
const onlyRoute = valueOf('--route');
const gapsTrace = valueOf('--gaps');
const asOf = valueOf('--as-of');

if (!asOf) {
  out('  --as-of YYYY-MM-DD is required. A proposal quotes a canonical record verbatim, and only a');
  out('  stated as-of date says which version of that record it quoted (docs/AUDIT-2026-09-01.md F-15).');
  process.exit(1);
}
if (onlyRoute && !GAP_ROUTES.includes(onlyRoute)) {
  out(`  unknown route "${onlyRoute}". The five are: ${GAP_ROUTES.join(', ')}`);
  process.exit(1);
}

const corpus = loadCorpus();
const store = dry ? new MemoryRecordStore({ allowSimulated: false }) : new RecordStore({ allowSimulated: false });
const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: PROPOSER_AGENT } });

const before = hashDataDir();

out();
out('  GAP PROPOSALS — what each knowledge gap can honestly become. Read-only.');

try {
  let gaps;
  if (gapsTrace) {
    gaps = readRecords(gapsTrace).filter((r) => r.contract === 'KnowledgeGap');
    if (!gaps.length) {
      out(`  no KnowledgeGap records in agent/records/${gapsTrace}.jsonl`);
      out('  `node agent/depth/cli.mjs --as-of <date>` writes some.');
      process.exit(1);
    }
    out(`  as of ${asOf} · ${gaps.length} gap(s) from ${gapsTrace}${dry ? ' · dry run, nothing stored' : ''}`);
  } else {
    const depth = await new DepthAgent({ tracer, store, corpus, asOf }).run();
    gaps = depth.gaps;
    out(`  as of ${asOf} · ${gaps.length} gap(s) from an inline depth run (trace ${depth.trace_id})${dry ? ' · dry run, nothing stored' : ''}`);
  }
  out();

  const r = await new ProposalRouter({ tracer, store, corpus, gaps, asOf }).run();

  const shown = onlyRoute ? r.routed.filter((x) => x.route === onlyRoute) : r.routed;

  out(`  PROPOSALS  ${r.proposals.length} authored, each behind a pending approval`);
  out();
  for (const p of r.proposals) {
    if (onlyRoute && !shown.some((x) => (x.authored ?? []).includes(p.proposal_id))) continue;
    const op = p.proposed_change.operations[0];
    out(`  ${p.proposal_id}   ${p.operation_kind}   ${p.autonomy_class}   confidence ${p.confidence}`);
    out(`    ${p.dataset} · ${p.record_id ?? '(new record)'}`);
    out(`    WHY        ${wrap(p.reason, 4)}`);
    out(`    WOULD DO   ${wrap(op.target, 4)}`);
    out(`    CURRENT    ${wrap(op.current === null ? '(null — nobody had recorded anything)' : op.current, 4)}`);
    out(`    PROPOSED   ${wrap(op.proposed, 4)}`);
    out(`    NOT THIS   ${wrap(p.proposed_change.scope_note, 4)}`);
    out();
  }
  if (!r.proposals.length) out('    none.');

  out(`  HANDED ON  ${r.data_gaps.length} evidence question(s) to the Legal Verifier`);
  for (const g of r.data_gaps) {
    if (onlyRoute && onlyRoute !== 'verifier') break;
    out(`    ${g.gap_id.padEnd(22)} ${g.gap_kind.padEnd(16)} ${g.blocking ? 'BLOCKING  ' : '          '}${g.candidate_leads.length ? g.candidate_leads[0].split(' — ')[0] : 'nowhere to look, and it says so'}`);
  }
  if (!r.data_gaps.length) out('    none.');

  out();
  out('  BY ROUTE  — a route nothing took is a result, not silence');
  for (const d of r.by_route_detail) {
    out(`    ${d.route.padEnd(20)} ${String(d.gaps).padStart(2)} gap(s)  ${String(d.proposals).padStart(2)} proposal(s)  ${String(d.data_gaps).padStart(2)} evidence question(s)  ${String(d.refused).padStart(2)} not proposable here`);
    if (d.gaps) out(`      ${d.why_kinds.join(', ')}`);
  }

  out();
  out('  NOT PROPOSABLE HERE  — named rather than dropped. This is what refusing to fabricate costs.');
  const byWhy = new Map();
  for (const x of r.refusals) {
    if (!byWhy.has(x.why)) byWhy.set(x.why, []);
    byWhy.get(x.why).push(x.gap_id);
  }
  for (const [why, ids] of byWhy) {
    out(`    ${ids.length} gap(s) — ${wrap(why, 4)}`);
    if (showRefusals) out(`      ${ids.join(', ')}`);
  }
  if (!r.refusals.length) out('    none.');
  if (!showRefusals && r.refusals.length) out('    --refusals names each one.');

  out();
  out(`  ${r.routed.length} gap(s) routed · ${r.proposals.length} proposal(s) · ${r.approvals.length} approval(s), all pending · ${r.data_gaps.length} evidence question(s) · ${r.refusals.length} refused`);
  out(`  by route:     ${Object.entries(r.by_route).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  out(`  no gap took:  ${r.routes_with_no_gap.join(', ') || 'every route took at least one'}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);

  const after = hashDataDir();
  const untouched = JSON.stringify(before) === JSON.stringify(after);
  out();
  out(untouched
    ? '  data/ is byte-identical to before this run. Nothing was edited, merged or applied.'
    : '  data/ CHANGED DURING THIS RUN. This agent has no code path that writes there — treat every record it produced as suspect.');
  out('  Every approval is in the "requested" state. Pending is never granted, and nothing here applies a proposal.');
  out();
  process.exitCode = untouched ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}

/** Soft-wrap a paragraph under a hanging indent. */
function wrap(text, indent, width = 92) {
  const pad = ' '.repeat(indent + 11);
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join(`\n${pad}`);
}
