#!/usr/bin/env node
/* ============================================================
   agent/release/cli.mjs — the release dispatcher and the deploy gate

     node agent/release/cli.mjs status                       where the chain stands, measured
     node agent/release/cli.mjs lifecycle [--proposal <id>]  the seven states, derived
     node agent/release/cli.mjs verify-ledger [--require-present]
     node agent/release/cli.mjs workflows                    is pages.yml the only publisher, gate in its path?
     node agent/release/cli.mjs dispatch --proposal <id> [--execute --as-of YYYY-MM-DD]
     node agent/release/cli.mjs gate [--ci] [--head <sha>] [--since <sha>] [--artifact <dir>]
                                     [--needs-env <VAR>] [--strict-unledgered] [--json]
     node agent/release/cli.mjs keygen --out-dir <dir> --reviewer-id <id> --name "<person>" --role "<role>"

   WHAT HAS NO FLAG, ON PURPOSE. `dispatch` has no way to skip the ledger
   check, accept an unsigned decision or accept a simulated one; `gate` has no
   `--force`, `--skip` or `--allow`; neither pushes, merges or writes the
   ledger. A flag that waives a check turns the check into a request.

   EXIT  0 passed / nothing to refuse · 1 refused or blocked · 2 usage error
   ============================================================ */

import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { readLedger, readAgentRecords, surveyProposals, DECISION_DIR } from '../implement/ledger.mjs';
import { describeLedger, generateReviewerKey, readReviewers, registryFingerprint, verifyLedger } from '../implement/attestation.mjs';
import { AGENT_NAMES } from '../orchestrator/capabilities.mjs';
import { dispatch } from './dispatch.mjs';
import { runGate } from './gate.mjs';
import { lifecycleOf } from './lifecycle.mjs';
import { auditWorkflows } from './workflows.mjs';
import { REGISTRY_PIN_ENV } from './policy.mjs';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--')) ?? 'status';
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const out = (s = '') => process.stdout.write(`${s}\n`);
const mark = { pass: '✓', fail: '✗', unmeasured: '?', warn: '!', not_applicable: '–' };

function printChecks(checks, key = (x) => x.ok ? 'pass' : 'fail') {
  for (const x of checks) out(`    ${mark[key(x)] ?? '?'} ${x.id}\n        ${x.why}`);
}

/* ---------------------------------------------------------- workflows */
if (command === 'workflows') {
  const r = auditWorkflows({ root: REPO_ROOT });
  out();
  out('  WORKFLOWS — is pages.yml the only publisher, and is the release gate in its path?');
  out();
  printChecks(r.checks);
  out();
  for (const w of r.workflows) out(`    ${w.publishes ? 'PUBLISHES' : '         '}  ${w.path}  (${w.jobs.length} job(s))`);
  out();
  out('  This reads the files. It cannot read which workflows are enabled, who may approve a');
  out('  deployment, or whether Pages\' source is "GitHub Actions": docs/DEPLOYMENT.md §3a.');
  out();
  process.exit(r.ok ? 0 : 1);
}

/* ---------------------------------------------------------- verify-ledger */
if (command === 'verify-ledger') {
  const rec = readAgentRecords();
  const agentNames = [...new Set([...AGENT_NAMES, ...[...rec.byId.values()].map((r) => r.agent).filter(Boolean)])];
  const v = verifyLedger({ requireSignatures: true, allowSimulated: false, agentNames });
  const reg = readReviewers();
  out();
  out('  THE DECISION LEDGER');
  out(`    ${describeLedger(v)}`);
  out(`    reviewer registry: ${reg.present ? `${reg.reviewers.length} reviewer(s), fingerprint ${registryFingerprint()}` : 'ABSENT — no reviewer is registered, so no signature can verify'}`);
  for (const p of v.problems.slice(0, 20)) out(`    ✗ line ${p.line ?? '–'} ${p.code}: ${p.why}`);
  if (v.count === 0) {
    out();
    out('  NO HUMAN DECISION HAS BEEN RECORDED. That is the true state and it is not a defect of this');
    out('  command: an authentic approval is a person\'s act (docs/DEPLOYMENT.md §3b), and this tool');
    out('  will not simulate one. `agent/production readiness` keeps decision_ledger_present red for it.');
  }
  out();
  process.exit(v.ok && (!has('--require-present') || v.count > 0) ? 0 : 1);
}

/* ---------------------------------------------------------- lifecycle */
if (command === 'lifecycle') {
  const rec = readAgentRecords();
  const led = readLedger();
  const id = valueOf('--proposal');
  const ids = id ? [id] : surveyProposals({ records: rec, ledger: led }).map((s) => s.proposal_id);
  const rows = ids.map((i) => lifecycleOf(i, { records: rec, ledger: led, cwd: REPO_ROOT }));
  out();
  if (!rows.length) {
    out('  No proposal is in the agent record store. agent/records/ is git-ignored and empty in a fresh');
    out('  checkout: run the producing agents first. The ledger holds ' + led.decisions.length + ' decision(s).');
  }
  const by = {};
  for (const r of rows) (by[r.state] ??= []).push(r);
  for (const [state, items] of Object.entries(by)) out(`  ${state.padEnd(26)} ${items.length}`);
  if (id) for (const r of rows) out(`\n  ${r.proposal_id}: ${r.state}\n    ${r.why}\n    derived from: ${r.derived_from.join(', ')}`);
  out();
  process.exit(0);
}

/* ---------------------------------------------------------- dispatch */
if (command === 'dispatch') {
  const proposalId = valueOf('--proposal');
  const execute = has('--execute');
  const asOf = valueOf('--as-of');
  if (!proposalId || (execute && !asOf)) {
    out('  usage: node agent/release/cli.mjs dispatch --proposal <id> [--execute --as-of YYYY-MM-DD]');
    out('  The default is a rehearsal: it checks, it writes nothing. --as-of is required to execute,');
    out('  because the QA it runs depends on the date (docs/AUDIT-2026-09-01.md F-15).');
    process.exit(2);
  }
  const r = await dispatch({ proposalId, execute, asOf, root: REPO_ROOT });
  out();
  out(`  DISPATCH ${proposalId} — ${r.outcome.toUpperCase()}${r.rehearsal ? ' (rehearsal: nothing was written)' : ''}`);
  for (const s of r.stages) out(`    ${s.ok ? '✓' : '✗'} ${s.stage.padEnd(10)} ${s.why}`);
  if (r.commit) out(`\n  commit  ${r.commit}${r.branch ? `  on ${r.branch}` : ''}`);
  if (r.outcome === 'dispatched') {
    out('\n  NOT PUSHED and NOT MERGED. Push the branch and open a pull request; a person merges it, and');
    out('  pages.yml then runs the gate on the merged commit.');
  }
  if (r.would_commit) out(`\n  The commit it would make:\n${r.would_commit.split('\n').map((l) => `    | ${l}`).join('\n')}`);
  out(`\n  run log: ${r.logged ? 'written' : 'NOT WRITTEN'} (agent/release/runs/dispatch.jsonl, git-ignored)`);
  out();
  process.exit(['refused', 'failed'].includes(r.outcome) ? 1 : 0);
}

/* ---------------------------------------------------------- gate */
if (command === 'gate') {
  const ci = has('--ci');
  const needsVar = valueOf('--needs-env');
  const r = runGate({
    root: REPO_ROOT,
    head: valueOf('--head') ?? 'HEAD',
    since: valueOf('--since'),
    artifact: valueOf('--artifact') ? resolve(valueOf('--artifact')) : null,
    needsJson: needsVar ? process.env[needsVar] ?? null : null,
    ci,
    strictUnledgered: has('--strict-unledgered'),
  });
  if (has('--json')) {
    out(JSON.stringify({ ok: r.ok, conditions: r.conditions, record: r.record }, null, 2));
  } else {
    out();
    out(`  RELEASE GATE — ${r.ok ? 'PASSED' : 'BLOCKED'}${ci ? ' (CI: an unmeasured condition blocks)' : ' (local: unmeasured conditions are reported, not blocking)'}`);
    out();
    printChecks(r.conditions, (x) => x.status);
    out();
    out(`  commit ${r.record.published_commit ?? '?'} · judged from ${r.record.judged_from ?? '?'} · ${r.record.commits_judged} commit(s)`);
    if (r.record.artifact_manifest_sha256) out(`  artifact manifest ${r.record.artifact_manifest_sha256}`);
    out();
    out('  This does not say the settings of docs/DEPLOYMENT.md §3a are applied, and it does not say');
    out('  any change is true. A person decided; the gate shows that a person did.');
    out();
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Release gate — ${r.ok ? 'passed' : 'BLOCKED'}\n\n${r.conditions.map((x) => `- ${mark[x.status]} **${x.id}** — ${x.why.replace(/\n/g, ' ')}`).join('\n')}\n\n\`\`\`json\n${JSON.stringify(r.record, null, 2)}\n\`\`\`\n`);
    } catch { /* the summary is a convenience; the exit code is the gate */ }
  }
  process.exit(r.ok ? 0 : 1);
}

/* ---------------------------------------------------------- keygen */
if (command === 'keygen') {
  const outDir = valueOf('--out-dir');
  const id = valueOf('--reviewer-id');
  const name = valueOf('--name');
  const role = valueOf('--role');
  if (!outDir || !id || !name || !role) {
    out('  usage: node agent/release/cli.mjs keygen --out-dir <dir outside the repository> --reviewer-id <id> --name "<person>" --role "<role>"');
    process.exit(2);
  }
  const abs = resolve(outDir);
  if (abs === REPO_ROOT || abs.startsWith(REPO_ROOT + sep)) {
    out(`  REFUSED — ${outDir} is inside the repository. A private key kept in the tree is readable by every agent that reads the tree.`);
    process.exit(1);
  }
  const k = generateReviewerKey();
  mkdirSync(abs, { recursive: true });
  const keyFile = join(abs, `${id}.private.pem`);
  if (existsSync(keyFile)) { out(`  REFUSED — ${keyFile} exists; this will not overwrite a key.`); process.exit(1); }
  writeFileSync(keyFile, k.privateKeyPem, { mode: 0o600 });
  try { chmodSync(keyFile, 0o600); } catch { /* best effort on filesystems without modes */ }
  const entry = { reviewer_id: id, name, role, status: 'active', added_at: new Date().toISOString(), public_key_pem: k.publicKeyPem };
  out();
  out(`  PRIVATE KEY  ${keyFile}   (mode 0600; back it up; it is never printed and never committed)`);
  out(`  FINGERPRINT  ${k.fingerprint}`);
  out();
  out('  Add this to agent/implement/decisions/reviewers.json as {"reviewers":[ … ]} and commit it');
  out('  in a pull request the owner reviews. THIS COMMAND DOES NOT WRITE THE REGISTRY, because a');
  out('  registry an agent can write is a registry an agent can add itself to:');
  out();
  out(JSON.stringify(entry, null, 2).split('\n').map((l) => `    ${l}`).join('\n'));
  out();
  out(`  Then pin the registry OUTSIDE the repository — Settings → Secrets and variables → Actions →`);
  out(`  Variables → ${REGISTRY_PIN_ENV} = the value printed by:`);
  out('    node agent/release/cli.mjs status');
  out();
  process.exit(0);
}

/* ---------------------------------------------------------- status */
if (command === 'status') {
  const rec = readAgentRecords();
  const led = readLedger();
  const agentNames = [...new Set([...AGENT_NAMES, ...[...rec.byId.values()].map((r) => r.agent).filter(Boolean)])];
  const v = verifyLedger({ requireSignatures: true, allowSimulated: false, agentNames });
  const reg = readReviewers();
  const wf = auditWorkflows({ root: REPO_ROOT });
  const items = surveyProposals({ records: rec, ledger: led });
  out();
  out('  THE RELEASE CHAIN — measured, and no verb here writes');
  out();
  out(`  proposals in the record store    ${items.length}${items.length ? '' : '   (git-ignored; empty in a fresh checkout)'}`);
  out(`  decision ledger                  ${describeLedger(v)}`);
  out(`  reviewer registry                ${reg.present ? `${reg.reviewers.length} reviewer(s)` : 'ABSENT'}`);
  out(`  registry fingerprint (to pin)    ${reg.present ? registryFingerprint() : '–'}   → ${REGISTRY_PIN_ENV}`);
  out(`  workflow audit                   ${wf.ok ? `${wf.checks.length} checks pass` : `${wf.checks.filter((c) => !c.ok).length} FAIL — run \`workflows\``}`);
  out();
  out('  Not measured here, because the tree cannot show it: whether Pages\' source is "GitHub Actions",');
  out('  whether main is protected, whether the github-pages environment restricts its branch, and whether');
  out(`  ${REGISTRY_PIN_ENV} is set. docs/DEPLOYMENT.md §3a.`);
  out();
  process.exit(wf.ok ? 0 : 1);
}

out('  commands: status · lifecycle · verify-ledger · workflows · dispatch · gate · keygen');
process.exit(2);
