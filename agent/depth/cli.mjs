#!/usr/bin/env node
/* ============================================================
   agent/depth/cli.mjs

     node agent/depth/cli.mjs --as-of YYYY-MM-DD
     node agent/depth/cli.mjs --as-of YYYY-MM-DD --dry
     node agent/depth/cli.mjs --as-of YYYY-MM-DD --kind missing_competence
     node agent/depth/cli.mjs --as-of YYYY-MM-DD --all
     node agent/depth/cli.mjs --as-of YYYY-MM-DD --changes <trace-id>

   --as-of is REQUIRED. A depth report without the date its corpus
   position was read as true at cannot be told from a stale one, and
   "the corpus has not grown" and "nobody has looked" are different
   findings that only a stated date separates.

   The default report shows the findings a reader could be misled by
   or would meet as a hole, and summarises the rest. `--all` prints
   every one. That is not the tool hiding anything: the counts are
   always complete, what was set aside is always printed with its
   reason, and a report a reviewer stops reading at the tenth line is
   the failure this whole agent is designed against.

   Everything produced goes to agent/records/<trace_id>.jsonl and the
   trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. NOTHING IS WRITTEN TO data/. Nothing is proposed,
   merged or applied: a gap is a question, and the answer is a
   DataProposal behind an ApprovalRequest, which this agent does not
   write.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { upstreamOf, recordHandoff } from '../observability/chain.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../scout/store.mjs';
import { loadCorpus, hashDataDir } from '../integrate/canonical.mjs';
import { DEPTH_IMPACT_RANK } from '../schemas/types.mjs';
import { DepthAgent, DEPTH_AGENT } from './depth.mjs';
import { DETECTORS } from './detectors.mjs';

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
const onlyKind = valueOf('--kind');
const changesTrace = valueOf('--changes');
const asOf = valueOf('--as-of');

if (!asOf) {
  out('  --as-of YYYY-MM-DD is required. A depth report without the date its corpus position was read as');
  out('  true at cannot be told from a stale one, and "the corpus has not grown" and "nobody has looked"');
  out('  are different findings that only a stated date separates (docs/AUDIT-2026-09-01.md F-15).');
  process.exit(1);
}
if (onlyKind && !DETECTORS.some((d) => d.kind === onlyKind)) {
  out(`  unknown kind "${onlyKind}". The thirteen are:`);
  for (const d of DETECTORS) out(`    ${d.kind}`);
  process.exit(1);
}

const corpus = loadCorpus();
let changes = [];
if (changesTrace) {
  changes = readRecords(changesTrace).filter((r) => r.contract === 'RegulatoryChange');
  if (!changes.length) {
    out(`  no RegulatoryChange records in agent/records/${changesTrace}.jsonl`);
    process.exit(1);
  }
}

const store = dry ? new MemoryRecordStore({ allowSimulated: false }) : new RecordStore({ allowSimulated: false });
/* The Detector run whose change records this one consumed, where
   one was given. A depth run without --changes is a root and this
   is null, which is the ordinary case. */
const upstream = changesTrace ? upstreamOf(changes) : null;
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: new JsonlSink(),
  attributes: { agent: DEPTH_AGENT },
  parent_run_id: upstream && !upstream.ambiguous ? upstream.run_id : null,
});

const before = hashDataDir();

out();
out('  DATA DEPTH — what the structured representation cannot express. Read-only.');
out(`  as of ${asOf} · ${corpus.instruments.length} instruments · ${corpus.claims.length} claims · ${corpus.sources.length} sources${changes.length ? ` · ${changes.length} change record(s) from ${changesTrace}` : ''}${dry ? ' · dry run, nothing stored' : ''}`);
out();

try {
  const agent = new DepthAgent({ tracer, store, corpus, asOf, changes });
  const r = await agent.run();

  const shownGaps = onlyKind ? r.ranked.filter((g) => g.gap_kind === onlyKind) : r.ranked;
  const threshold = showAll || onlyKind ? 0 : DEPTH_IMPACT_RANK.reader_finds_nothing;
  const printed = shownGaps.filter((g) => DEPTH_IMPACT_RANK[g.impact] >= threshold);

  out(`  GAPS  ${printed.length} shown of ${shownGaps.length}${threshold ? '  — the rest are analysis_incomplete; --all prints them' : ''}`);
  out();
  for (const g of printed) {
    const subject = g.affected_entities.map((e) => e.id ?? e.path).filter(Boolean).join(' + ') || '(the corpus)';
    out(`  ${g.gap_id}   ${g.impact}   ${g.autonomy_class}   confidence ${g.confidence}`);
    out(`    ${g.gap_kind} · ${subject}`);
    out(`    MISSING    ${wrap(g.missing_concept, 4)}`);
    out(`    MATTERS    ${wrap(g.why_it_matters, 4)}`);
    out(`    HOME       ${g.recommended_data_location.dataset} → ${g.recommended_data_location.container}${g.recommended_data_location.field ? `.${g.recommended_data_location.field}` : ''}${g.recommended_data_location.shape_exists ? '' : '   ← the shape does not exist yet: a schema decision before a data one'}`);
    out(`    LEANS ON   ${g.evidence.length} record(s)${g.evidence.length ? `: ${g.evidence.slice(0, 4).map((e) => e.locator).join(', ')}${g.evidence.length > 4 ? ` … +${g.evidence.length - 4}` : ''}` : ''}`);
    const lead = g.candidate_evidence[0];
    out(`    LOOK AT    ${lead.kind === 'none_identified' ? 'nowhere — and the record says so rather than inventing a lead' : lead.where}`);
    out();
  }
  if (!printed.length) out('    none at this level.');

  out('  BY DETECTOR  — a detector that found nothing is a result, not silence');
  for (const d of r.by_detector) {
    out(`    ${d.kind.padEnd(34)} ${String(d.reported).padStart(2)} reported  ${String(d.set_aside).padStart(2)} set aside   ${d.why}`);
  }

  out();
  out('  SET ASIDE  — named rather than dropped. This is what "do not reward quantity" cost.');
  const bySubject = new Map();
  for (const s of r.suppressed) {
    if (!bySubject.has(s.why)) bySubject.set(s.why, []);
    bySubject.get(s.why).push(`${s.gap_kind}:${s.subject}`);
  }
  for (const [why, subjects] of bySubject) {
    out(`    ${subjects.length} finding(s) — ${wrap(why, 4)}`);
    out(`      ${subjects.join(', ')}`);
  }
  if (!r.suppressed.length) out('    nothing was set aside.');

  out();
  out(`  ${r.gaps.length} gap(s) reported · ${r.suppressed.length} set aside · as at ${r.as_of}`);
  out(`  by impact:    ${Object.entries(r.by_impact).sort((a, b) => DEPTH_IMPACT_RANK[b[0]] - DEPTH_IMPACT_RANK[a[0]]).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  out(`  by autonomy:  ${Object.entries(r.by_autonomy).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  out(`  no finding:   ${r.kinds_with_no_finding.join(', ') || 'every kind found something'}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);

  if (upstream) {
    const edge = recordHandoff({
      upstream,
      to_agent: DEPTH_AGENT,
      records: changes,
      downstream_trace_id: r.trace_id,
      reason: `Noting which depth findings sit on records ${changes.length} regulatory change(s) have recently moved. A change is not an absence.`,
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
    ? '  data/ is byte-identical to before this run. Nothing was edited, proposed or applied.'
    : '  data/ CHANGED DURING THIS RUN. This agent has no code path that writes there — treat every record it produced as suspect.');
  out('  Every gap is a question. Not one of them carries the value that would answer it, and nothing here has retrieved a document.');
  out();
  process.exitCode = untouched ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}

/** Soft-wrap a paragraph under a hanging indent, so a long
 *  `why_it_matters` stays readable in a terminal. */
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
