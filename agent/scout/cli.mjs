#!/usr/bin/env node
/* ============================================================
   agent/scout/cli.mjs

     node agent/scout/cli.mjs --mock          # the fixture corpus (default)
     node agent/scout/cli.mjs --live          # the registered real endpoints
     node agent/scout/cli.mjs --live --dry    # live, but store nothing

   --mock is the default on purpose. A run that reaches out to five
   regulators should be something you asked for in as many words.

   Everything the run produces goes to agent/records/<trace_id>.jsonl
   and the trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. Nothing is written to data/, and this agent has no
   code path that could.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { Scout, SCOUT_AGENT } from './scout.mjs';
import { HttpTransport, MockTransport } from './transport.mjs';
import { RecordStore, MemoryRecordStore } from './store.mjs';
import { MOCK_DOCUMENTS, MOCK_ENDPOINTS } from './fixtures.mjs';
import { endpointsByPriority } from './authorities.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const live = has('--live');
const dry = has('--dry');
const out = (s = '') => process.stdout.write(`${s}\n`);

const limitArg = argv.find((a) => a.startsWith('--max-docs='));
const max_documents_per_endpoint = limitArg ? Number(limitArg.split('=')[1]) : undefined;

const transport = live ? new HttpTransport() : new MockTransport(MOCK_DOCUMENTS);
const endpoints = live ? endpointsByPriority() : MOCK_ENDPOINTS;
const store = dry
  ? new MemoryRecordStore({ allowSimulated: !live })
  : new RecordStore({ allowSimulated: !live });

const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: SCOUT_AGENT } });

out();
out(live
  ? '  LIVE — attempting the registered real endpoints. Read-only.'
  : '  MOCK — the fixture corpus. Every host is .invalid and every record is marked simulated.');
out(`  ${endpoints.length} endpoint(s)${dry ? ' · dry run, nothing stored' : ''}`);
out();

const scout = new Scout({
  tracer,
  transport,
  store,
  endpoints,
  limits: max_documents_per_endpoint ? { max_documents_per_endpoint } : {},
});

try {
  const r = await scout.run();

  out('  CANDIDATES');
  if (!r.candidates.length) out('    none');
  for (const c of r.candidates) {
    out(`    ${c.candidate_id}  conf ${c.confidence}  ${c.authority_class ?? 'authority unplaced'}  ${c.tier_estimate ?? 'tier not established'}`);
    out(`      ${c.title ?? '(the document titles itself nothing)'}`);
    out(`      ${c.url}`);
    out(`      published: ${c.publication_date}${c.publication_date === 'unknown' ? '  ← stated by nothing in the document' : ''}`);
    out(`      about: ${c.affected_entities.map((e) => e.id).join(', ')}`);
    if (c.duplicate_candidate_ids.length) out(`      duplicates: ${c.duplicate_candidate_ids.join(', ')}`);
  }
  out();
  out('  GAPS');
  if (!r.gaps.length) out('    none');
  for (const g of r.gaps) out(`    ${g.gap_id}  ${g.gap_kind}  ${g.what_is_missing}`);
  out();
  out(`  ${r.candidates.length} candidate(s) · ${r.gaps.length} gap(s) · ${r.screened_out} screened out · ${r.fetched} retrieval attempt(s)`);
  if (r.blocked) out(`  ${r.blocked} retrieval(s) refused before reaching the origin — reported as gaps, not as nothing.`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);
  out();
  out('  Nothing was published, no canonical fact was changed, and data/ was not written to.');
  out();
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}
