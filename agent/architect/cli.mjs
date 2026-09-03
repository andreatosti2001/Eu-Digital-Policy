#!/usr/bin/env node
/* ============================================================
   agent/architect/cli.mjs — Agent 6, the Knowledge Architect

     node agent/architect/cli.mjs --as-of YYYY-MM-DD
     node agent/architect/cli.mjs --as-of YYYY-MM-DD --dry
     node agent/architect/cli.mjs --as-of YYYY-MM-DD --question 5
     node agent/architect/cli.mjs --as-of YYYY-MM-DD --all
     node agent/architect/cli.mjs --as-of YYYY-MM-DD --aside
     node agent/architect/cli.mjs --as-of YYYY-MM-DD --gaps <depth-trace-id>

   --as-of is REQUIRED. "The model has not changed" and "nobody has
   looked" are different findings, and only a stated date separates
   them (docs/AUDIT-2026-09-01.md F-15).

   --gaps chains a Data Depth run in. The KnowledgeGap records are
   used for exactly one thing — noting that a shape finding and a
   record finding sit on the same part of the corpus — and never to
   create a finding. Chaining also populates parent_run_id and
   records the handoff on the upstream trace, which is what SESSION
   13's Phase 0 existed to make possible.

   The default report prints the findings and summarises the rest.
   `--all` prints every one, `--aside` prints what was not reported
   and why. That is not the tool hiding anything: the counts are
   always complete, and every set-aside carries its reason and the
   agent it belongs to.

   Everything produced goes to agent/records/<trace_id>.jsonl and the
   trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. NOTHING IS WRITTEN TO data/, NO SCHEMA IS CHANGED,
   and no proposal carries a drafted shape: every operation's
   `proposed` is null on purpose.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { upstreamOf, recordHandoff } from '../observability/chain.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../scout/store.mjs';
import { hashDataDir } from '../integrate/canonical.mjs';
import { readModel } from './model.mjs';
import { LENSES } from './lenses.mjs';
import { KnowledgeArchitect, ARCHITECT_AGENT } from './architect.mjs';

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
const showAll = has('--all');
const showAside = has('--aside');
const onlyQuestion = valueOf('--question');
const gapsTrace = valueOf('--gaps');
const asOf = valueOf('--as-of');

if (!asOf) {
  out('  --as-of YYYY-MM-DD is required. A report on the information model without the date it was read');
  out('  as true at cannot be told from a stale one, and "the model has not changed" and "nobody has');
  out('  looked" are different findings that only a stated date separates (docs/AUDIT-2026-09-01.md F-15).');
  process.exit(1);
}
if (onlyQuestion && !LENSES.some((l) => String(l.question) === String(onlyQuestion))) {
  out(`  unknown question "${onlyQuestion}". The eight are:`);
  for (const l of LENSES) out(`    ${l.question}  ${l.asks}`);
  process.exit(1);
}

/* The gaps are read BEFORE the tracer is built, because the Depth
   run that produced them is this run's parent and a tracer cannot be
   told that after its first span is open. */
let gaps = [];
if (gapsTrace) {
  gaps = readRecords(gapsTrace).filter((r) => r.contract === 'KnowledgeGap');
  if (!gaps.length) {
    out(`  no KnowledgeGap records in agent/records/${gapsTrace}.jsonl`);
    out('  `node agent/depth/cli.mjs --as-of <date>` writes some.');
    process.exit(1);
  }
}
const upstream = gapsTrace ? upstreamOf(gaps) : null;

const store = dry ? new MemoryRecordStore({ allowSimulated: false }) : new RecordStore({ allowSimulated: false });
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: new JsonlSink(),
  attributes: { agent: ARCHITECT_AGENT },
  parent_run_id: upstream && !upstream.ambiguous ? upstream.run_id : null,
});

const before = hashDataDir();

out();
out('  KNOWLEDGE ARCHITECTURE — can the information model represent what this corpus is already saying?');
const model = readModel();
out(`  as of ${asOf} · ${model.containers.length} containers · ${model.vocabularies.length} vocabularies · ${model.pages.length} pages${gaps.length ? ` · ${gaps.length} knowledge gap(s) from ${gapsTrace}` : ''}${dry ? ' · dry run, nothing stored' : ''}`);
out('  Read-only. No schema is changed, no shape is drafted, and nothing is written to data/.');
out();

try {
  const agent = new KnowledgeArchitect({ tracer, store, model, asOf, gaps });
  const r = await agent.run();

  out('  THE EIGHT QUESTIONS');
  out();
  for (const l of r.by_lens) {
    const answer = l.reported ? `YES — ${l.reported} finding(s)` : 'NO — not on the evidence in this repository';
    out(`  ${l.question}  ${l.asks}`);
    out(`     ${answer}   ${l.examined} examined · ${l.set_aside} set aside`);
    out(`     ${l.why}`);
    out();
  }

  const shown = onlyQuestion
    ? r.reported.filter((f) => String(f.question) === String(onlyQuestion))
    : (showAll ? r.reported : r.reported.slice(0, 8));

  out(`  FINDINGS  ${shown.length} shown of ${r.reported.length}${!showAll && !onlyQuestion && r.reported.length > shown.length ? '  — --all prints them all, --question <n> one question' : ''}`);
  out();
  for (const f of shown) {
    const proposal = r.proposals.find((p) => p.proposal_id === f.proposal_id);
    out(`  Q${f.question}  ${f.subject}`);
    out(`    MISSING    ${wrap(f.missing_shape, 4)}`);
    out(`    MATTERS    ${wrap(f.why_it_matters, 4)}`);
    out(`    LEANS ON   ${f.demand_count} record(s)${f.demand.length ? `: ${f.demand.slice(0, 3).map((d) => d.record_id ?? d.field ?? d.dataset).join(', ')}${f.demand_count > 3 ? ` … +${f.demand_count - 3}` : ''}` : ''}`);
    out(`    TOUCHES    ${(f.invariants ?? []).join(', ') || 'no named invariant'}   in ${[...new Set(f.modules)].join(', ')}`);
    out(`    DECISION   ${wrap(f.operations[0]?.rationale ?? '—', 4)}`);
    out(`    NOT THIS   ${wrap(f.scope_note, 4)}`);
    if (proposal) out(`    proposal ${proposal.proposal_id} · ${proposal.autonomy_class} · risk ${proposal.risk} · confidence ${proposal.confidence} · approval ${f.approval_id} (requested)`);
    out();
  }
  if (!shown.length) out('    none at this question.');

  if (showAside || r.aside.length) {
    out(`  NOT REPORTED  ${r.aside.length} finding(s) — named rather than dropped, with the agent each belongs to`);
    if (showAside) {
      for (const a of r.aside) {
        out(`    ${a.subject}`);
        out(`      ${wrap(a.why, 6)}`);
      }
    } else {
      const byWhy = new Map();
      for (const a of r.aside) {
        const key = a.route ?? 'below the demand floor';
        if (!byWhy.has(key)) byWhy.set(key, []);
        byWhy.get(key).push(a.subject);
      }
      for (const [key, subjects] of byWhy) out(`    ${subjects.length} → ${key}: ${subjects.slice(0, 4).join(', ')}${subjects.length > 4 ? ` … +${subjects.length - 4}` : ''}`);
      out('    --aside prints each one with its reason.');
    }
    out();
  }

  if (r.refused.length) {
    out('  REFUSED');
    for (const x of r.refused) out(`    ${x.what} (${x.stage}): ${x.reason}`);
    out();
  }

  out(`  ${r.proposals.length} architecture proposal(s) · ${r.approvals.length} approval(s), all pending · ${r.reported.length} finding(s) · ${r.aside.length} set aside · as at ${r.as_of}`);
  out(`  answered yes:  ${r.by_lens.filter((l) => l.reported).map((l) => `q${l.question}`).join(' · ') || 'none'}`);
  out(`  answered no:   ${r.questions_answered_no.map((q) => `q${q}`).join(' · ') || 'every question found something'}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);

  if (upstream) {
    const edge = recordHandoff({
      upstream,
      to_agent: ARCHITECT_AGENT,
      records: gaps,
      downstream_trace_id: r.trace_id,
      reason: `Noting which architecture findings sit on the part of the corpus ${gaps.length} knowledge gap(s) also name. A missing record is not a missing shape.`,
    });
    out();
    out(edge.emitted
      ? `  CHAIN  ${upstream.trace_id} → ${r.trace_id}. parent_run_id ${upstream.run_id}; handoff ${edge.handoff_id} recorded on the upstream trace.`
      : `  CHAIN  no handoff recorded on the upstream trace — ${edge.why}`);
  }

  const after = hashDataDir();
  const untouched = JSON.stringify(before) === JSON.stringify(after);
  out();
  out(untouched
    ? '  data/ is byte-identical to before this run. No schema was changed, nothing was merged and nothing was applied.'
    : '  data/ CHANGED DURING THIS RUN. This agent has no code path that writes there — treat every record it produced as suspect.');
  out('  Every proposal names a shape and drafts none. What the corpus should be able to say about EU law is the repository owner\'s decision.');
  out();
  process.exitCode = untouched ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}

/** Soft-wrap a paragraph under a hanging indent. */
function wrap(text, indent, width = 92) {
  const pad = ' '.repeat(indent + 11);
  const words = String(text ?? '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join(`\n${pad}`);
}
