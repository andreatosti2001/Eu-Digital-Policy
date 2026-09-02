#!/usr/bin/env node
/* ============================================================
   agent/integrate/cli.mjs

     node agent/integrate/cli.mjs --mock [--as-of YYYY-MM-DD]
     node agent/integrate/cli.mjs --mock --dry
     node agent/integrate/cli.mjs --records <trace-id> --as-of YYYY-MM-DD

   --mock runs the adversarial corpus in agent/integrate/fixtures.mjs
   against the real data/. --records reads the VerificationRecords a
   real Legal Verifier run stored, and is the live path.

   --as-of is REQUIRED on the live path and defaults only in mock,
   where it is the fixtures' own fixed date. Staleness is measured
   against it and nothing in this layer reads a clock for a
   judgement: a report whose as-of date came from whenever it
   happened to run is not reproducible (audit F-15), and
   VERIFICATION-POLICY §4 requires every report to carry its date.

   Everything produced goes to agent/records/<trace_id>.jsonl and the
   trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. NOTHING IS WRITTEN TO data/, and this agent has no
   code path that could. Nothing is merged, applied or approved.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../scout/store.mjs';
import { Integrator, INTEGRATOR_AGENT } from './adapter.mjs';
import { loadCorpus, hashDataDir } from './canonical.mjs';
import { buildFixtures, FIXTURE_AS_OF } from './fixtures.mjs';
import { outcomeClassOf } from '../verifier/outcome.mjs';

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
  out('  --as-of YYYY-MM-DD is required on the live path. Staleness is measured against it, and a report');
  out('  whose as-of date came from whenever it happened to run cannot be reproduced (audit F-15).');
  process.exit(1);
}

const corpus = loadCorpus();
let verifications;

if (live) {
  if (!traceArg) {
    out('  --records needs a trace id: node agent/integrate/cli.mjs --records <trace-id> --as-of YYYY-MM-DD');
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
const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: INTEGRATOR_AGENT } });

out();
out(live
  ? `  LIVE — integrating ${verifications.length} verification(s) from trace ${traceArg}. Read-only.`
  : '  MOCK — the adversarial corpus, run against the real data/. Every record is marked simulated.');
out(`  as of ${asOf} · ${corpus.claims.length} claims · ${corpus.sources.length} sources${dry ? ' · dry run, nothing stored' : ''}`);
out();

const before = hashDataDir();

try {
  const integrator = new Integrator({ tracer, store, corpus, asOf, simulated: !live });
  const r = await integrator.run({ verifications });

  out('  RESOLUTIONS');
  for (const l of r.links) {
    out(`    ${l.link_id}  ${l.claim_id}  ←  ${l.source_id}  (${l.supports}${l.is_citation ? '' : ', NOT a citation'})`);
  }
  for (const n of r.notes) out(`    — ${n.verification_id}: ${n.not_attached}`);
  if (!r.links.length && !r.notes.length) out('    none');

  out();
  out('  PROPOSALS  (none applied, none merged)');
  for (const p of r.proposals) {
    out(`    ${p.proposal_id}  ${p.operation_kind}  ${p.autonomy_class}${p.substantive ? '  SUBSTANTIVE — human authors it' : ''}`);
    out(`      ${p.proposed_change.summary}`);
  }
  if (!r.proposals.length) out('    none');

  out();
  out('  CONFLICTS  (none resolved, and no proposal made for any of them)');
  for (const c of r.conflicts) out(`    ${c.kind}  ${c.instrument_id ?? c.claim_id ?? ''} ${c.attribute ?? ''} — ${c.why}`);
  if (!r.conflicts.length) out('    none');

  if (r.unmappable_statuses.length) {
    out();
    out('  NOT A CONFLICT — a status the site\'s vocabulary does not carry');
    for (const u of r.unmappable_statuses) out(`    ${u.verification_id}: "${u.legal_status}" has no term in data/taxonomy.json`);
  }

  out();
  out(`  STALE VERIFICATION  as of ${asOf}`);
  for (const s of r.stale) out(`    ${s.kind}  ${s.dataset ?? s.verification_id}  — ${s.why}`);
  if (!r.stale.length) out('    nothing past its stated interval');

  out();
  out('  UNSUPPORTED CLAIMS  — unsupported is not false, and this list getting shorter is not a goal');
  const t = r.unsupported_tally;
  out(`    ${t.claims_with_a_finding} claim(s) carry a finding: ${t.of_which_law_or_fact} of law or fact, ${t.of_which_arguments} argument-family (no citation could settle those)`);
  for (const [reason, n] of Object.entries(t.by_reason)) out(`      ${String(n).padStart(3)}  ${reason}`);

  if (r.refused.length) {
    out();
    out('  REFUSED');
    for (const x of r.refused) out(`    ${x.what ?? 'a record'} (${x.stage}): ${x.problems.join(' · ')}`);
  }

  const after = hashDataDir();
  const untouched = JSON.stringify(before) === JSON.stringify(after);

  out();
  out(`  ${r.links.length} evidence link(s) · ${r.proposals.length} proposal(s) · ${r.gaps.length} gap(s) · ${r.refused.length} refused`);
  if (r.approval) out(`  approval ${r.approval.approval_id} — state "${r.approval.state}", ${r.approval.what_to_check.length} things to check, requested of ${r.approval.requested_of}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);
  out();
  out(untouched
    ? '  data/ is byte-identical to before this run. Nothing was applied, nothing was merged, and no canonical fact changed.'
    : '  data/ CHANGED DURING THIS RUN. This layer has no code path that writes there — treat every record it produced as suspect.');
  out('  Every conflict and every gap is a result, not a failure.');
  out();
  process.exitCode = untouched ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}
