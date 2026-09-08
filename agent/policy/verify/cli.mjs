#!/usr/bin/env node
/* ============================================================
   agent/policy/verify/cli.mjs — run the verification gate

       node agent/policy/verify/cli.mjs            the report
       node agent/policy/verify/cli.mjs --json     the whole record
       node agent/policy/verify/cli.mjs --area authorization

   Exit codes: 0 the gate ran; 1 an attack SUCCEEDED, which is a
   finding at the severity the catalogue assigned it; 2 the gate
   could not run at all. An `undecidable` never fails the run — it is
   reported as not having been established, which is what it is.

   THE TREE IS HASHED AROUND THE RUN. Every world is a temporary
   directory; the repository's own agent/records/,
   agent/implement/decisions/ and .control-room/state/ are never read
   or written. The report says whether the tree is byte-identical
   afterwards, measured rather than asserted.
   ============================================================ */

import { runAllAttacks } from './attacks.mjs';
import { hashTree, cleanup, AREAS, SEVERITIES, REPO_ROOT } from './harness.mjs';

const argv = process.argv.slice(2);
const wantJson = argv.includes('--json');
const areaFlag = argv.includes('--area') ? argv[argv.indexOf('--area') + 1] : null;

const before = hashTree(REPO_ROOT);
const startedAt = new Date().toISOString();

let results;
try {
  results = await runAllAttacks();
} catch (err) {
  console.error(`\nTHE GATE COULD NOT RUN: ${err.stack ?? err.message}`);
  cleanup();
  process.exit(2);
}
cleanup();

const after = hashTree(REPO_ROOT);
const treeUnchanged = JSON.stringify(before) === JSON.stringify(after);
const changed = treeUnchanged ? [] : Object.keys(after).filter((k) => before[k] !== after[k]);

const shown = areaFlag ? results.filter((r) => r.area === areaFlag) : results;
const byOutcome = (o) => shown.filter((r) => r.outcome === o);
const findings = shown.filter((r) => r.outcome === 'succeeded' || r.outcome === 'partial');
const sev = (r) => r.severity ?? r.severity_if_succeeds;
const rank = (s) => SEVERITIES.indexOf(s);

if (wantJson) {
  console.log(JSON.stringify({
    gate: 'SESSION 23.5 — control plane security and autonomy gate',
    started_at: startedAt, finished_at: new Date().toISOString(),
    tree_unchanged: treeUnchanged, changed_paths: changed,
    attacks: shown, findings,
    counts: Object.fromEntries(['failed_safely', 'succeeded', 'partial', 'undecidable'].map((o) => [o, byOutcome(o).length])),
  }, null, 2));
} else {
  console.log('\n  SESSION 23.5 — CONTROL PLANE SECURITY AND AUTONOMY GATE');
  console.log(`  ${startedAt} · ${shown.length} attack(s) across ${new Set(shown.map((r) => r.area)).size} area(s)\n`);
  console.log(`  ${byOutcome('failed_safely').length} failed safely · ${byOutcome('succeeded').length} SUCCEEDED · ${byOutcome('partial').length} partial · ${byOutcome('undecidable').length} undecidable\n`);

  for (const area of AREAS) {
    const inArea = shown.filter((r) => r.area === area);
    if (!inArea.length) continue;
    console.log(`  ${area.replace(/_/g, ' ').toUpperCase()}`);
    for (const r of inArea) {
      const mark = { failed_safely: '·', succeeded: '✗', partial: '!', undecidable: '?' }[r.outcome];
      console.log(`    ${mark} ${r.id.padEnd(7)} ${r.attempts}`);
      console.log(`              ${r.why.slice(0, 220)}`);
      if (r.would_need) console.log(`              would need: ${r.would_need.slice(0, 200)}`);
    }
    console.log('');
  }

  if (findings.length) {
    console.log('  FINDINGS');
    for (const f of [...findings].sort((a, b) => rank(sev(a)) - rank(sev(b)))) {
      console.log(`    [${String(sev(f)).toUpperCase()}] ${f.id} — ${f.attempts}`);
      console.log(`              ${f.why.slice(0, 300)}`);
    }
    console.log('');
  }

  console.log(`  The repository is ${treeUnchanged ? 'byte-identical to before this run' : `NOT unchanged: ${changed.join(', ')}`}.`);
  console.log('  This gate does not fix anything it finds. SESSION 23.5: findings are recorded with a');
  console.log('  recommended remediation and the remediation is a later session\'s to decide.');
  console.log('  An "undecidable" is not a pass; it is a boundary this environment could not test.\n');
}

process.exit(byOutcome('succeeded').length ? 1 : 0);
