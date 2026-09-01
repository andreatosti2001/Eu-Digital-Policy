#!/usr/bin/env node
/* ============================================================
   agent/scout/cli.mjs

     node agent/scout/cli.mjs claims            # claims it can scout
     node agent/scout/cli.mjs run <claim-id>    # scout one claim
     node agent/scout/cli.mjs show <trace-id>   # the records it stored

   Zero dependencies, like everything else here. `run` exits non-zero
   only when the AGENT failed — never because a document could not be
   retrieved. A retrieval that is refused is a finding the run
   records and reports; treating it as a crash would be the same
   category error the DataGap contract exists to prevent.
   ============================================================ */

import { ContractStore } from '../schemas/store.mjs';
import * as corpus from './corpus.mjs';
import { scoutClaim } from './scout.mjs';

const [, , cmd = 'claims', arg] = process.argv;
const out = (s = '') => process.stdout.write(`${s}\n`);

function claims() {
  const ids = corpus.claimIds();
  out();
  out(`  ${ids.length} claims in data/claims.json`);
  out('  ' + '─'.repeat(74));
  for (const id of ids) {
    const c = corpus.claim(id);
    const plan = corpus.retrievalPlan(c);
    const flags = [
      plan.retrievable.length ? `${plan.retrievable.length} retrievable` : '',
      plan.placeholders.length ? `${plan.placeholders.length} placeholder` : '',
      plan.dangling.length ? `${plan.dangling.length} dangling` : '',
    ].filter(Boolean).join(' · ') || 'no sources cited';
    out(`  ${id.padEnd(38)} ${flags}`);
  }
  out();
}

async function run(claimId) {
  if (!claimId) { out('  usage: node agent/scout/cli.mjs run <claim-id>'); process.exit(2); }

  const result = await scoutClaim({ claim_id: claimId });

  out();
  out(`  SCOUT · ${claimId}`);
  out('  ' + '─'.repeat(74));
  out(`  trace   ${result.trace_id}`);
  out(`  run     ${result.run_id}`);
  out(`  store   ${result.store_path}`);
  out();

  if (result.outcomes.length === 0) {
    out('  No retrieval attempted — the corpus records no citable URL for this claim.');
  } else {
    out('  RETRIEVAL');
    for (const o of result.outcomes) {
      out(`    ${o.outcome.padEnd(15)} ${o.source_id}`);
      out(`    ${' '.repeat(15)} ${o.url}`);
      if (o.detail) out(`    ${' '.repeat(15)} ${o.detail.slice(0, 160)}`);
    }
  }
  out();
  out('  RECORDS EMITTED (every one through agent/schemas/gateway.mjs)');
  for (const p of result.produced) out(`    ${p.contract.padEnd(20)} ${p.id}`);
  out();

  const gaps = result.records.filter((r) => r.contract === 'DataGap');
  if (gaps.length) {
    out('  GAPS');
    for (const g of gaps) out(`    ${g.gap_kind} / ${g.absence_kind}${g.blocking ? ' · blocking' : ''}\n      ${g.what_is_missing.slice(0, 200)}`);
    out();
  }
}

function show(traceId) {
  if (!traceId) { out('  usage: node agent/scout/cli.mjs show <trace-id>'); process.exit(2); }
  const store = new ContractStore();
  const { records, broken } = store.read(traceId);
  if (!records.length) { out(`  no records stored for trace ${traceId}`); process.exit(1); }
  for (const r of records) out(JSON.stringify(r, null, 2));
  if (broken.length) out(`  ${broken.length} unparseable line(s)`);
}

const main = { claims, run, show }[cmd];
if (!main) { out(`  unknown command "${cmd}" — try: claims · run · show`); process.exit(2); }
await main(arg);
