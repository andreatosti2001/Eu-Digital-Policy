#!/usr/bin/env node
/* ============================================================
   agent/detector/cli.mjs

     node agent/detector/cli.mjs --mock [--as-of YYYY-MM-DD]
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
const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: DETECTOR_AGENT } });

out();
out(live
  ? `  LIVE — detecting changes from ${verifications.length} verification(s) in trace ${traceArg}. Read-only.`
  : '  MOCK — the adversarial corpus, run against the real data/. Every record is marked simulated.');
out(`  as of ${asOf} · ${corpus.instruments.length} instruments · ${corpus.events.length} timeline events${dry ? ' · dry run, nothing stored' : ''}`);
out();

const before = hashDataDir();

try {
  const detector = new Detector({ tracer, store, corpus, asOf, simulated: !live });
  const r = await detector.run({ verifications });

  out('  CHANGES');
  for (const c of r.changes) {
    const bang = MATERIALITY_RANK[c.materiality] >= MATERIALITY_RANK.reader_acts_on_it ? ' ←  a reader acts on this' : '';
    out(`    ${c.change_id}  ${c.change_kind.padEnd(20)} ${c.materiality.padEnd(18)} conf ${c.confidence}${bang}`);
    out(`      ${c.attribute ?? '(the record itself)'}:  "${String(c.old_value ?? 'nothing').slice(0, 60)}"  →  "${String(c.new_value ?? 'nothing').slice(0, 60)}"`);
    out(`      datasets ${c.affected_datasets.join(', ') || 'none'}   pages ${c.affected_pages.join(', ') || 'none'}   ${c.autonomy_class}`);
  }
  if (!r.changes.length) out('    none');

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

  const after = hashDataDir();
  const untouched = JSON.stringify(before) === JSON.stringify(after);

  out();
  out(`  ${r.changes.length} change(s) · ${r.gaps.length} unclassified · ${r.unchanged.length} unchanged · ${r.not_compared.length} not compared · ${r.conflicts.length} conflict(s) set aside`);
  out(`  by kind:        ${Object.entries(r.by_kind).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  out(`  by materiality: ${Object.entries(r.by_materiality).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);
  out();
  out(untouched
    ? '  data/ is byte-identical to before this run. Nothing was edited, proposed or applied.'
    : '  data/ CHANGED DURING THIS RUN. This agent has no code path that writes there — treat every record it produced as suspect.');
  out('  Every unclassified transition and every "not compared" is a result, not a failure.');
  out();
  process.exitCode = untouched ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}
