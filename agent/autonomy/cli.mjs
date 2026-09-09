#!/usr/bin/env node
/* ============================================================
   agent/autonomy/cli.mjs — the limited-autonomy runner

       node agent/autonomy/cli.mjs status
       node agent/autonomy/cli.mjs survey
       node agent/autonomy/cli.mjs run --as-of YYYY-MM-DD [--proposal <id>] [--execute]
       node agent/autonomy/cli.mjs actions [--json]
       node agent/autonomy/cli.mjs rollback --action <id>

   THE DEFAULT IS TO WRITE NOTHING, the same way `agent/implement/`'s
   is. `run` without `--execute` walks every gate, cuts no branch,
   computes the edit, runs the validators and the browser suite, and
   reports whether it WOULD have merged. `--execute` is the only thing
   that touches a file, and it still refuses everything the gates
   refuse. An autonomy layer whose safe mode is the one nobody selects
   is not a safe mode.

   `rollback` PRINTS, IT DOES NOT RUN. Undoing a change that was
   already merged is a decision, and the six elements plus the exact
   commands are what a person needs to take it. A CLI that reverted on
   request would be a second writer to the tree with no gate in front
   of it.

   --as-of IS REQUIRED for `run`. Derived output here depends on the
   reader's clock (AUDIT F-15) and `freshness.mjs` takes a date.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { readAgentRecords, readLedger } from '../implement/ledger.mjs';
import { policyInForce, describeGovernance } from '../policy/governance.mjs';
import { runCycle, surveyAutonomy, CYCLE_STEPS, GATES_REPLACED_BY_GRANT } from './cycle.mjs';
import { summariseActions, readActions, rollbackInformation } from './ledger.mjs';

const argv = process.argv.slice(2);
const cmd = argv.find((a) => !a.startsWith('--')) ?? 'status';
const has = (f) => argv.includes(`--${f}`);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true);
};
const out = (s = '') => process.stdout.write(`${s}\n`);
const rule = (s) => { out(); out(`  ${s}`); out(`  ${'─'.repeat(s.length)}`); out(); };

const agentsFrom = (rec) => new Set([...rec.byId.values()].map((r) => r.agent).filter(Boolean));

/* ---------------------------------------------------------- status */

if (cmd === 'status') {
  const rec = readAgentRecords();
  const g = describeGovernance({ agents: agentsFrom(rec) });
  const a = summariseActions();

  rule('LIMITED AUTONOMY — what is switched on, and what it has done');
  out(`  policy in force   ${g.policy.policy_id}`);
  out(`  categories        ${g.policy.enabled_categories.join(', ') || 'NONE — nothing can run automatically'}`);
  out(`  paths             ${g.policy.automatic_path_allowlist.join(', ') || 'none'}`);
  for (const [ds, f] of Object.entries(g.policy.automatic_field_allowlist ?? {})) out(`  fields            ${ds}: ${f.join(', ')}`);
  out(`  risk ceiling      ${g.policy.max_automatic_risk} · environments ${g.policy.automatic_environments.join(', ')}`);
  out();
  out(`  grants in force   ${g.active.length}`);
  for (const x of g.active) out(`    ${x.grant_id}  by ${x.decided_by}, expires ${x.expires_at}`);
  if (g.inactive.length) {
    out(`  not in force      ${g.inactive.length}`);
    for (const x of g.inactive) out(`    ${x.grant.grant_id}  ${x.state}`);
  }
  out();
  out(`  actions ledger    ${a.path}`);
  if (!a.exists) out(`                    ${a.why}`);
  else {
    out(`                    ${a.counts.total} action(s): ${Object.entries(a.counts.by_outcome).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}`);
    out(`                    ${a.counts.touched_a_file} of them wrote a file`);
  }
  out();
  out('  THE SEVEN STEPS');
  for (const s of CYCLE_STEPS) out(`    ${s.step} · ${s.id.padEnd(11)} ${s.what}`);
  out();
  out(`  A grant stands in for exactly ${GATES_REPLACED_BY_GRANT.length} preflight gate(s): ${GATES_REPLACED_BY_GRANT.join(', ')}.`);
  out('  Every other gate must pass, and no grant may name a human-only category, a legal-record');
  out('  path it did not name exactly, a never-automatic field, a risk above "low", or production.');
  out();
  process.exit(0);
}

/* ---------------------------------------------------------- survey */

if (cmd === 'survey') {
  const s = surveyAutonomy();
  rule('WHAT COULD RUN AUTOMATICALLY RIGHT NOW');
  if (!s.total) {
    out('  No proposals. agent/records/ is git-ignored and empty in a fresh checkout: run the');
    out('  producing agents first. That is not the same fact as "nothing is eligible".');
    out();
    process.exit(0);
  }
  out(`  ${s.total} proposal(s) · ${s.eligible.length} eligible · ${s.refused.length} refused`);
  out(`  policy ${s.policy.policy_id}`);
  out();
  const byGate = {};
  for (const i of s.refused) for (const g of i.refused_by) (byGate[g] ??= []).push(i.proposal_id);
  out('  REFUSED BY');
  for (const [gate, ids] of Object.entries(byGate).sort((a, b) => b[1].length - a[1].length)) {
    out(`    ${gate.padEnd(26)} ${ids.length}`);
  }
  out();
  if (s.eligible.length) {
    out('  ELIGIBLE');
    for (const i of s.eligible) out(`    ${i.proposal_id.padEnd(30)} ${i.category} (${i.contract}, ${i.agent})`);
    out();
  }
  if (has('all')) {
    out('  EVERY PROPOSAL');
    for (const i of s.items) out(`    ${i.eligible ? '✓' : '✗'} ${i.proposal_id.padEnd(30)} ${String(i.category).padEnd(30)} ${i.refused_by.join(', ')}`);
    out();
  }
  process.exit(0);
}

/* ---------------------------------------------------------- actions */

if (cmd === 'actions') {
  const a = summariseActions();
  if (has('json')) { out(JSON.stringify(a, null, 2)); process.exit(0); }
  rule('EVERY AUTONOMOUS ACTION ATTEMPTED ON THIS MACHINE');
  out(`  ${a.path}`);
  if (!a.exists) { out(`  ${a.why}`); out(); process.exit(0); }
  out(`  ${a.counts.total} action(s): ${Object.entries(a.counts.by_outcome).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  out();
  for (const x of a.actions.slice(-40)) {
    out(`  ${String(x.outcome).toUpperCase().padEnd(14)} ${x.action_id}  ${x.proposal_id}`);
    out(`    ${x.started_at} · ${x.category ?? 'uncategorised'} · policy ${String(x.policy_id).slice(0, 60)}`);
    out(`    ${String(x.why ?? '').slice(0, 220)}`);
    if (x.merge_commit) out(`    merged at ${x.merge_commit.slice(0, 12)} on ${x.origin_branch}`);
    out();
  }
  if (a.malformed.length) {
    out(`  ${a.malformed.length} UNPARSEABLE LINE(S) — reported, never skipped`);
    for (const m of a.malformed) out(`    line ${m.line}: ${m.why}`);
    out();
  }
  process.exit(0);
}

/* ---------------------------------------------------------- rollback */

if (cmd === 'rollback') {
  const id = flag('action');
  if (!id) { out('  --action <id> is required.'); process.exit(2); }
  const { actions } = readActions();
  const a = actions.find((x) => x.action_id === id);
  if (!a) { out(`  no action with id "${id}" on this machine.`); process.exit(1); }
  const r = rollbackInformation(a);
  rule(`ROLLBACK INFORMATION — ${id}`);
  out(JSON.stringify(r, null, 2));
  out();
  out('  This command PRINTS. Undoing a merged change is a decision, and running it is a person\'s.');
  out();
  process.exit(0);
}

/* ---------------------------------------------------------- run */

if (cmd === 'run') {
  const asOf = flag('as-of');
  if (!asOf) {
    out('  --as-of YYYY-MM-DD is required. Derived output here depends on the reader\'s clock');
    out('  (docs/AUDIT-2026-09-01.md F-15) and a report with no date cannot be told from a stale one.');
    process.exit(2);
  }
  const only = flag('proposal');
  const execute = has('execute');

  const rec = readAgentRecords();
  const led = readLedger();
  const inForce = policyInForce({ agents: agentsFrom(rec) });

  const tracer = new Tracer({ sink: new JsonlSink() });
  const run = tracer.startRun({ kind: 'agent', agent: 'autonomy-runner', task: 'run the limited-autonomy cycle over every eligible proposal' });

  const survey = surveyAutonomy({ records: rec, ledger: led });
  const targets = only ? [only] : survey.items.map((i) => i.proposal_id);

  rule(`LIMITED AUTONOMY RUN — ${asOf}${execute ? '  (EXECUTING)' : '  (rehearsal: nothing will be written)'}`);
  out(`  policy   ${inForce.policy.policy_id}`);
  out(`  grants   ${inForce.active.map((g) => `${g.grant_id} by ${g.decided_by}`).join('; ') || 'NONE'}`);
  out(`  targets  ${targets.length} proposal(s)`);
  out();

  if (!inForce.active.length) {
    out('  No governance grant is in force. Nothing can run automatically, and that is the');
    out('  intended state until a person records one:');
    out('    node agent/policy/cli.mjs grant --by "<name>" --authority "<why>" --until <date> …');
    out();
    run.end({ status: 'ok', outputs: { grants: 0, ran: 0 } });
    process.exit(0);
  }

  const results = [];
  for (const id of targets) {
    /* eslint-disable no-await-in-loop */
    const r = await runCycle({ proposalId: id, run, asOf, execute, records: rec, ledger: led });
    results.push(r);
    out(`  ${String(r.outcome).toUpperCase().padEnd(14)} ${id}`);
    out(`    ${String(r.why ?? '').slice(0, 300)}`);
    if (r.refused_by?.length) out(`    refused by: ${r.refused_by.join(', ')}`);
    out();
  }

  const merged = results.filter((r) => r.outcome === 'merged');
  const reverted = results.filter((r) => ['reverted', 'revert_failed'].includes(r.outcome));
  const refused = results.filter((r) => r.outcome === 'refused');
  const rehearsed = results.filter((r) => r.outcome === 'rehearsed');

  run.observe({
    summary: `${merged.length} merged · ${reverted.length} reverted · ${refused.length} refused · ${rehearsed.length} rehearsed`,
    subject: 'the run',
    data: { merged: merged.map((r) => r.action_id), reverted: reverted.map((r) => r.action_id), refused: refused.length },
  });
  run.end({ status: 'ok', outputs: { merged: merged.length, reverted: reverted.length, refused: refused.length, rehearsed: rehearsed.length } });

  out(`  ${merged.length} merged · ${reverted.length} reverted · ${refused.length} refused · ${rehearsed.length} rehearsed`);
  out(`  trace ${run.trace_id}`);
  out();
  process.exit(0);
}

out(`unknown command "${cmd}". One of: status · survey · run · actions · rollback`);
process.exit(2);
