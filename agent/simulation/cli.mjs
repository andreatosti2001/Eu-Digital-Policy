#!/usr/bin/env node
/* ============================================================
   agent/simulation/cli.mjs — SESSION 24's simulation, on demand

     node agent/simulation/cli.mjs run          one complete cycle
     node agent/simulation/cli.mjs threshold    the discovery path
     node agent/simulation/cli.mjs graph        the agent graph, no run
     node agent/simulation/cli.mjs all          both, in order

   Flags
     --json           the whole trace as JSON, for a machine
     --verbose        every stage's reasoning, not only its status
     --trace <dir>    keep the observability trace in <dir>
                      (default: a temp directory, deleted at the end)

   IT RUNS NOTHING AGAINST PRODUCTION. Every store is a mkdtemp
   directory; `run` reports a before/after fingerprint of the working
   tree and prints what changed, which on a correct run is nothing.
   ============================================================ */

import { runCycle, authorizationLeg } from './run.mjs';
import { discoverySimulation } from './threshold.mjs';
import { renderRun, renderThreshold } from './report.mjs';
import { GRAPH_ORDER, LEGS, NOT_WALKED } from './cycle.mjs';

const argv = process.argv.slice(2);
const cmd = argv.find((a) => !a.startsWith('--')) ?? 'run';
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const json = has('--json');
const verbose = has('--verbose');
const traceDir = valueOf('--trace');

function graph() {
  const L = ['', '  THE AGENT GRAPH — what SESSION 24 walks, as declared', ''];
  for (const leg of LEGS) {
    L.push(`  leg ${leg.leg}  ${leg.lifecycle}`);
    L.push(`         ${leg.workflow_type}${leg.needs_authorization ? '   (runs twice: marked, then the control fixture)' : ''}`);
    L.push(`         agents: ${leg.agents.join(' → ')}`);
    L.push('');
  }
  L.push('  not walked:');
  for (const n of NOT_WALKED) L.push(`    ${n.workflow_type} — ${n.why}`);
  L.push('');
  L.push(`  actors: ${GRAPH_ORDER.join(', ')}`);
  L.push('');
  return L.join('\n');
}

const out = (s) => process.stdout.write(`${s}\n`);

try {
  if (cmd === 'graph') {
    out(json ? JSON.stringify({ legs: LEGS, not_walked: NOT_WALKED, graph_order: GRAPH_ORDER }, null, 2) : graph());
  } else if (cmd === 'threshold') {
    const d = await discoverySimulation();
    out(json ? JSON.stringify(d, null, 2) : renderThreshold(d));
  } else if (cmd === 'run' || cmd === 'all') {
    const run = await runCycle({ traceDir, quiet: true });
    out(json ? JSON.stringify(run, null, 2) : renderRun(run, { verbose }));
    if (cmd === 'all') {
      const d = await discoverySimulation();
      out(json ? JSON.stringify(d, null, 2) : renderThreshold(d));
    }
  } else {
    process.stderr.write(`unknown command "${cmd}". Try: run · threshold · graph · all\n`);
    process.exit(2);
  }
} catch (err) {
  process.stderr.write(`${err.stack ?? err.message}\n`);
  process.exit(1);
}
