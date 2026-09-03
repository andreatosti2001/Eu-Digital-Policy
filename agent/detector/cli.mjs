#!/usr/bin/env node
/* ============================================================
   agent/detector/cli.mjs

     node agent/detector/cli.mjs --mock [--as-of YYYY-MM-DD] [--depth N]
     node agent/detector/cli.mjs --mock --dry
     node agent/detector/cli.mjs --records <trace-id> --as-of YYYY-MM-DD

   --mock runs the adversarial corpus in agent/detector/fixtures.mjs
   against the real data/. --records reads the VerificationRecords a
   real Legal Verifier run stored, which is the live path.

   --as-of is REQUIRED on the live path. A change report without the
   date its corpus position was read as true at cannot be told from a
   stale change report, and "nothing has decayed" and "nobody has
   looked" are different findings that only a stated date separates.

   Everything produced goes to agent/records/<trace_id>.jsonl and the
   trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. NOTHING IS WRITTEN TO data/. Nothing is proposed,
   merged or applied: a detection is a question, and the answer is a
   DataProposal behind an ApprovalRequest, which this agent does not
   write.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { upstreamOf, recordHandoff } from '../observability/chain.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../scout/store.mjs';
import { Detector, DETECTOR_AGENT } from './detector.mjs';
import { loadCorpus, hashDataDir } from '../integrate/canonical.mjs';
import { buildFixtures, FIXTURE_AS_OF } from './fixtures.mjs';
import { MATERIALITY_RANK } from './materiality.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const dry = has('--dry');
/* How far the impact map walks out from a changed record. Two hops
   already reaches most of this corpus; further is available and is
   never the default, because a map that names most of the corpus
   every time distinguishes nothing. */
const depth = Number(valueOf('--depth') ?? 2);
const traceArg = valueOf('--records');
const live = has('--records') || Boolean(traceArg);
const out = (s = '') => process.stdout.write(`${s}\n`);

const asOf = valueOf('--as-of') ?? (live ? null : FIXTURE_AS_OF);
if (!asOf) {
  out('  --as-of YYYY-MM-DD is required on the live path. A change report without the date its corpus');
  out('  position was read as true at cannot be told from a stale one, and "nothing has decayed" and');
  out('  "nobody has looked" are different findings that only a stated date separates.');
  process.exit(1);
}

const corpus = loadCorpus();
let verifications;

if (live) {
  if (!traceArg) {
    out('  --records needs a trace id: node agent/detector/cli.mjs --records <trace-id> --as-of YYYY-MM-DD');
    process.exit(1);
  }
  verifications = readRecords(traceArg).filter((r) => r.contract === 'VerificationRecord');
  if (!verifications.length) {
    out(`  no VerificationRecord records in agent/records/${traceArg}.jsonl`);
    process.exit(1);
  }
} else {
  verifications = buildFixtures(corpus).all;
}

const store = dry ? new MemoryRecordStore({ allowSimulated: !live }) : new RecordStore({ allowSimulated: !live });
/* The run that produced these verifications, read off the records
   themselves, so this run's spans and its AgentRun carry the edge
   back to it from one place. */
const upstream = live ? upstreamOf(verifications) : null;
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: new JsonlSink(),
  attributes: { agent: DETECTOR_AGENT },
  parent_run_id: upstream && !upstream.ambiguous ? upstream.run_id : null,
});

out();
out(live
  ? `  LIVE — detecting changes from ${verifications.length} verification(s) in trace ${traceArg}. Read-only.`
  : '  MOCK — the adversarial corpus, run against the real data/. Every record is marked simulated.');
out(`  as of ${asOf} · ${corpus.instruments.length} instruments · ${corpus.events.length} timeline events${dry ? ' · dry run, nothing stored' : ''}`);
out();

const before = hashDataDir();

try {
  const detector = new Detector({ tracer, store, corpus, asOf, simulated: !live, impactDepth: depth });
  const r = await detector.run({ verifications });

  out('  CHANGES');
  for (const c of r.changes) {
    const bang = MATERIALITY_RANK[c.materiality] >= MATERIALITY_RANK.reader_acts_on_it ? ' ←  a reader acts on this' : '';
    out(`    ${c.change_id}  ${c.change_kind.padEnd(20)} ${c.materiality.padEnd(18)} conf ${c.confidence}${bang}`);
    out(`      ${c.attribute ?? '(the record itself)'}:  "${String(c.old_value ?? 'nothing').slice(0, 60)}"  →  "${String(c.new_value ?? 'nothing').slice(0, 60)}"`);
    out(`      datasets ${c.affected_datasets.join(', ') || 'none'}   pages ${c.affected_pages.join(', ') || 'none'}   ${c.autonomy_class}`);
  }
  if (!r.changes.length) out('    none');

  if (r.assessments.length) {
    out();
    out('  IMPACT ON THIS WEBSITE  — what each confirmed change reaches, and which half a machine may act on');
    for (const a of r.assessments) {
      const c = a.counts;
      out(`    ${a.assessment_id}  for ${a.change_id}  ·  ${c.reached_records} record(s) reached at depth ${a.depth}  ·  ${a.autonomy_class}`);
      out(`      FACTUAL   ${String(c.factual_impacts).padStart(3)}  of which ${c.automatically_actionable} need no edit anywhere (the site derives them at render time)`);
      out(`      EDITORIAL ${String(c.editorial_impacts).padStart(3)}  ${c.editorial_impacts ? '←  prose that states the value that moved; nothing here reads prose' : ''}`);
      out(`      OPEN      ${String(c.open_questions).padStart(3)}  prose that may be stale and cannot be shown to be`);
      for (const s of a.surfaces) {
        out(`        ${(s.label ?? s.surface).padEnd(20)} ${s.records.length ? `${s.records.length} record(s)` : ''} ${s.modules.join(' ')} ${s.pages.join(' ')}`.replace(/\s+$/, ''));
      }
      for (const e of a.editorial) {
        out(`        ⚑ ${e.node_id}.${e.field}  →  ${e.route}`);
        out(`          "${String(e.quote).slice(0, 120)}"`);
      }
    }
  }

  if (r.unchanged.length) {
    out();
    out(`  UNCHANGED  as at ${asOf}  — a finding, not silence`);
    for (const u of r.unchanged) out(`    ${u.verification_id} against ${u.previous_verification_id}: ${u.why}`);
  }

  if (r.gaps.length) {
    out();
    out('  UNCLASSIFIED  — a transition the table has no kind for, reported rather than filed under the nearest');
    for (const g of r.gaps) out(`    ${g.gap_id}: ${g.what_is_missing}`);
  }

  if (r.conflicts.length) {
    out();
    out('  NOT A CHANGE — two authorities disagreeing');
    for (const c of r.conflicts) out(`    ${c.verification_id}: ${c.why}`);
  }

  if (r.not_compared.length) {
    out();
    out('  NOT COMPARED — named rather than dropped');
    for (const n of r.not_compared) out(`    ${n.verification_id}: ${n.reason}`);
  }

  if (r.refused.length) {
    out();
    out('  REFUSED AT INTAKE');
    for (const x of r.refused) out(`    ${x.what}: ${x.reason}`);
  }

  if (upstream) {
    const edge = recordHandoff({
      upstream,
      to_agent: DETECTOR_AGENT,
      records: verifications,
      downstream_trace_id: r.trace_id,
      reason: `Comparing ${verifications.length} verification(s) against what the corpus currently holds.`,
    });
    out();
    out(edge.emitted
      ? `  CHAIN  ${upstream.trace_id} → ${r.trace_id}. parent_run_id ${upstream.run_id}; handoff ${edge.handoff_id} recorded on the upstream trace.`
      : `  CHAIN  no handoff recorded on the upstream trace — ${edge.why}`);
  }

  const after = hashDataDir();
  const untouched = JSON.stringify(before) === JSON.stringify(after);

  out();
  out(`  ${r.changes.length} change(s) · ${r.assessments.length} impact assessment(s) · ${r.gaps.length} unclassified · ${r.unchanged.length} unchanged · ${r.not_compared.length} not compared · ${r.conflicts.length} conflict(s) set aside`);
  out(`  by kind:        ${Object.entries(r.by_kind).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  out(`  by materiality: ${Object.entries(r.by_materiality).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);
  out();
  out(untouched
    ? '  data/ is byte-identical to before this run. Nothing was edited, proposed or applied.'
    : '  data/ CHANGED DURING THIS RUN. This agent has no code path that writes there — treat every record it produced as suspect.');
  out('  Every unclassified transition and every "not compared" is a result, not a failure.');

  /* TOTAL INTAKE REFUSAL IS NOT A SUCCESSFUL RUN. An unclassified
     transition and a "not compared" are results and still exit 0;
     every input refused at intake is a run that produced nothing
     from what it was given. */
  const refusedAtIntake = r.refused.filter((x) => x.stage === 'intake').length;
  const totalRefusal = verifications.length > 0 && refusedAtIntake === verifications.length;
  if (totalRefusal) {
    out();
    out(`  ALL ${verifications.length} verification(s) were refused at intake and nothing was compared. Exit 2.`);
    out('  This is the intake gate working, and it is not a run that succeeded.');
  }
  out();
  process.exitCode = untouched ? (totalRefusal ? 2 : 0) : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}
