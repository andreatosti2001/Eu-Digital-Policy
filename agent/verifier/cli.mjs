#!/usr/bin/env node
/* ============================================================
   agent/verifier/cli.mjs

     node agent/verifier/cli.mjs --mock         # the adversarial corpus (default)
     node agent/verifier/cli.mjs --mock --dry   # mock, storing nothing
     node agent/verifier/cli.mjs --records <trace-id>
                                                # verify the candidates a
                                                # real Scout run produced

   --mock is the default for the same reason it is the Scout's: a
   run that reaches out to five regulators should be something you
   asked for in as many words. There is no `--live` flag that
   invents candidates; live verification takes real SourceCandidates
   from a Scout run's record file, which is what `--records` reads.

   Everything the run produces goes to agent/records/<trace_id>.jsonl
   and the trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. Nothing is written to data/, and this agent has no
   code path that could.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { upstreamOf, recordHandoff } from '../observability/chain.mjs';
import { Verifier, VERIFIER_AGENT } from './verifier.mjs';
import { HttpTransport, MockTransport } from '../scout/transport.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../scout/store.mjs';
import { MOCK_DOCUMENTS, ALL_CANDIDATES } from './fixtures.mjs';
import { outcomeClassOf } from './outcome.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const dry = has('--dry');
const traceArg = argv.find((a) => a.startsWith('--records='))?.split('=')[1]
  ?? (argv[argv.indexOf('--records') + 1] && !argv[argv.indexOf('--records') + 1].startsWith('--') ? argv[argv.indexOf('--records') + 1] : null);
const live = has('--records') || Boolean(traceArg);
const out = (s = '') => process.stdout.write(`${s}\n`);

let candidates;
let transport;

if (live) {
  if (!traceArg) {
    out('  --records needs a trace id: node agent/verifier/cli.mjs --records <trace-id>');
    process.exit(1);
  }
  candidates = readRecords(traceArg).filter((r) => r.contract === 'SourceCandidate');
  if (!candidates.length) {
    out(`  no SourceCandidate records in agent/records/${traceArg}.jsonl`);
    process.exit(1);
  }
  transport = new HttpTransport();
} else {
  candidates = ALL_CANDIDATES;
  transport = new MockTransport(MOCK_DOCUMENTS);
}

const store = dry
  ? new MemoryRecordStore({ allowSimulated: !live })
  : new RecordStore({ allowSimulated: !live });

/* The run that produced these candidates, read off the candidates
   themselves. Passed to the tracer so every span this run opens
   carries it and the AgentRun's parent_run_id is populated from one
   place rather than copied into a second. */
const upstream = live ? upstreamOf(candidates) : null;
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: new JsonlSink(),
  attributes: { agent: VERIFIER_AGENT },
  parent_run_id: upstream && !upstream.ambiguous ? upstream.run_id : null,
});

out();
out(live
  ? `  LIVE — verifying ${candidates.length} candidate(s) from trace ${traceArg}. Read-only.`
  : '  MOCK — the adversarial corpus. Every host is .invalid and every record is marked simulated.');
out(`  ${candidates.length} candidate(s)${dry ? ' · dry run, nothing stored' : ''}`);
out();

const verifier = new Verifier({ tracer, transport, store });

try {
  const r = await verifier.run({ candidates });

  out('  VERIFICATIONS');
  for (const v of r.records) {
    out(`    ${v.verification_id}  ${v.verdict}  →  ${outcomeClassOf(v.verdict)}   conf ${v.confidence}`);
    out(`      status: ${v.legal_status ?? 'not placed'}   tier: ${v.source_tier ?? 'not placed'}   at: ${v.supporting_location?.raw ?? 'nowhere locatable'}`);
    out(`      "${v.statement.length > 96 ? `${v.statement.slice(0, 96)}…` : v.statement}"`);
    out(`      dates — published ${v.publication_date ?? 'null'} · in force ${v.entry_into_force_date ?? 'null'} · applies ${v.applicability_date ?? 'null'}`);
    if (v.residual_gap) out(`      open: ${v.residual_gap.length > 150 ? `${v.residual_gap.slice(0, 150)}…` : v.residual_gap}`);
  }

  if (r.refused.length) {
    out();
    out('  REFUSED AT INTAKE');
    for (const x of r.refused) out(`    ${x.candidate_id}: ${x.reason}`);
  }

  if (r.outranked.length || r.precision_differences.length) {
    out();
    out('  DISAGREEMENTS THAT ARE NOT CONFLICTS');
    for (const o of r.outranked) out(`    ${o.instrument_id} ${o.attribute}: ${o.note}`);
    for (const p of r.precision_differences) out(`    ${p.a.instrument_id} ${p.attribute}: "${p.a.value}" vs "${p.b.value}" — a difference of precision, not of substance`);
  }

  /* THE EDGE, on the upstream trace. Recording it here rather than
     before the run means it names the trace this run actually
     produced, so the two runs are navigable in both directions. */
  if (upstream) {
    const edge = recordHandoff({
      upstream,
      to_agent: VERIFIER_AGENT,
      records: candidates,
      downstream_trace_id: r.trace_id,
      reason: `Checking what ${candidates.length} candidate document(s) actually establish.`,
    });
    out();
    out(edge.emitted
      ? `  CHAIN  ${upstream.trace_id} → ${r.trace_id}. parent_run_id ${upstream.run_id}; handoff ${edge.handoff_id} recorded on the upstream trace.`
      : `  CHAIN  no handoff recorded on the upstream trace — ${edge.why}`);
  }

  out();
  out(`  ${r.records.length} verification(s) · ${r.propositions_checked} proposition(s) checked · ${r.set_aside} sentence(s) set aside as immaterial`);
  out(`  by verdict:  ${Object.entries(r.by_verdict).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  out(`  by outcome:  ${Object.entries(r.by_outcome).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);
  out();
  out('  Nothing was published, no canonical fact was changed, and data/ was not written to.');
  out('  Every unresolved and conflict outcome is a result, not a failure.');

  /* TOTAL INTAKE REFUSAL IS NOT A SUCCESSFUL RUN. Every candidate
     refused and nothing checked is a run that produced nothing from
     its input, and it exited 0 until SESSION 13. An unresolved
     verdict is a result and still exits 0; this is the different
     case where there was no verdict to reach. */
  if (candidates.length && r.refused.length === candidates.length) {
    out();
    out(`  ALL ${candidates.length} candidate(s) were refused at intake and nothing was checked. Exit 2.`);
    out('  The refusals above are the reason. This is the intake gate working, and it is not a run that succeeded.');
    process.exitCode = 2;
  }
  out();
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}
