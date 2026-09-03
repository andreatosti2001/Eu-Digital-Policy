#!/usr/bin/env node
/* ============================================================
   agent/implement/cli.mjs — Agent 9, Implementation and QA

     node agent/implement/cli.mjs queue
     node agent/implement/cli.mjs preflight --proposal <id>
     node agent/implement/cli.mjs boundary
     node agent/implement/cli.mjs check --as-of YYYY-MM-DD
     node agent/implement/cli.mjs decide --proposal <id> --grant --by "<person>" [--note "…"]
     node agent/implement/cli.mjs decide --proposal <id> --deny  --by "<person>" --note "…"
     node agent/implement/cli.mjs run --as-of YYYY-MM-DD [--proposal <id>] [--apply] [--dry]

   THE DEFAULT IS TO WRITE NOTHING. `run` without `--apply` rehearses:
   it verifies the ten gates, computes the edit, runs the checks and
   produces the reports, and does not touch a file. `--apply` is the
   only thing that writes, and it still refuses everything that is not
   approved.

   `decide` IS THE HUMAN'S COMMAND, NOT AN AGENT'S. It is separated
   from `run` for that reason: an agent that can call the same binary
   with different arguments to approve its own work has not been
   constrained by anything. It requires `--by`, refuses any name that
   belongs to an agent in this system, and binds the decision to the
   proposal's fingerprint so that editing the proposal afterwards
   voids the approval rather than inheriting it.

   --as-of IS REQUIRED for `run` and `check`. Derived output here
   depends on the reader's clock (docs/AUDIT-2026-09-01.md F-15), and
   `freshness.mjs` takes a date. A QA report with no date cannot be
   told from a stale one.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { RecordStore, MemoryRecordStore } from '../scout/store.mjs';
import { Implementer, IMPLEMENT_AGENT } from './implementer.mjs';
import { preflight, GATES } from './preflight.mjs';
import {
  surveyProposals, readAgentRecords, readLedger, recordDecision,
  SelfApprovalRefused, UnknownProposal, ledgerPath,
} from './ledger.mjs';
import { boundaryCheck } from './boundary.mjs';
import { runValidators, verdictFor } from './checks.mjs';
import { readBaseline } from './baseline.mjs';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--')) ?? 'queue';
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const out = (s = '') => process.stdout.write(`${s}\n`);
const asOf = valueOf('--as-of');
const proposalId = valueOf('--proposal');

/* ---------------------------------------------------------- queue */

if (command === 'queue') {
  const survey = surveyProposals();
  const ledger = readLedger();
  out();
  out('  THE QUEUE — every proposal in the record store, and whether it may be implemented');
  out();
  if (!survey.length) {
    out('  No proposals. agent/records/ is git-ignored and empty in a fresh checkout: run the');
    out('  producing agents first. The chain is in docs/HANDOVER.md, "Exact next objective".');
    out();
    out(`  The approval ledger at ${ledgerPath()} holds ${ledger.decisions.length} decision(s).`);
    out();
    process.exit(0);
  }

  const byState = {};
  for (const s of survey) (byState[s.approval.state] ??= []).push(s);

  for (const [state, items] of Object.entries(byState).sort()) {
    out(`  ${state.toUpperCase()}  ${items.length}`);
    for (const i of items.slice(0, has('--all') ? 999 : 8)) {
      out(`    ${i.proposal_id.padEnd(28)} ${i.contract.padEnd(24)} ${i.agent}`);
      if (has('--why')) out(`      ${i.approval.why}`);
    }
    if (!has('--all') && items.length > 8) out(`    … +${items.length - 8} more (--all)`);
    out();
  }

  const forged = survey.flatMap((s) => s.approval.discarded);
  if (forged.length) {
    out(`  ${forged.length} APPROVAL CLAIM(S) IN agent/records/ WERE DISCARDED`);
    out('  Agents write that directory. A grant there is an agent\'s claim about a human decision.');
    for (const f of forged.slice(0, 6)) out(`    · ${f.approval_id} claims "${f.claimed_state}" by "${f.claimed_by}", written by ${f.written_by_agent}`);
    out();
  }

  out(`  ${survey.length} proposal(s) · ${ledger.decisions.length} decision(s) in the ledger · ${ledger.malformed.length} unparseable ledger line(s)`);
  out(`  Only "granted" may be implemented. --why prints the reason for each.`);
  out();
  process.exit(0);
}

/* ---------------------------------------------------------- preflight */

if (command === 'preflight') {
  if (!proposalId) { out('  --proposal <id> is required.'); process.exit(1); }
  const p = preflight(proposalId);
  out();
  out(`  PREFLIGHT — ${proposalId}`);
  out();
  for (const g of p.gates) {
    out(`  ${g.ok ? '✓' : '✗'} ${g.gate.padEnd(24)} ${g.why}`);
    if (!g.ok) out(`      WOULD CLOSE IT: ${g.closes}`);
  }
  out();
  out(`  ${p.summary}`);
  if (p.scope) {
    out(`  permitted: ${p.scope.permitted.join(', ') || 'none'}`);
    if (p.scope.touches_legal_record?.length) out(`  TOUCHES THE LEGAL RECORD: ${p.scope.touches_legal_record.join(', ')}`);
    if (p.scope.requires_browser_qa?.length) out(`  requires browser QA: ${p.scope.requires_browser_qa.join(', ')}`);
  }
  out();
  process.exit(p.ok ? 0 : 1);
}

/* ---------------------------------------------------------- boundary */

if (command === 'boundary') {
  const c = boundaryCheck();
  out();
  out('  PUBLIC WEBSITE / PRIVATE CONTROL PLANE');
  out();
  out(`  ${c.output_excerpt.split('\n').join('\n  ')}`);
  out();
  if (c.new_findings.length) {
    out('  FINDINGS');
    for (const f of c.new_findings) out(`    · ${f}`);
    out();
  }
  out(`  ${c.errors} blocking · ${c.warnings} warning(s)`);
  out();
  out('  This matches credential SHAPES. A credential it does not match is a credential it did');
  out('  not find, and a clean run is not proof the tree holds no secret.');
  out();
  process.exit(c.exit_code);
}

/* ---------------------------------------------------------- check */

if (command === 'check') {
  if (!asOf) { out('  --as-of YYYY-MM-DD is required: freshness.mjs takes a date, and a QA report with no date cannot be told from a stale one.'); process.exit(1); }
  const v = runValidators({ asOf });
  const b = boundaryCheck();
  const checks = [...v.checks, b];
  out();
  out(`  THE CHECKS, against ${v.baseline.source}`);
  out();
  for (const c of checks) {
    const cmp = v.comparisons.find((x) => `tools/${x.name}` === c.name);
    out(`  ${c.name.padEnd(34)} exit ${c.exit_code}  ${String(c.errors).padStart(3)} error(s) ${String(c.warnings).padStart(3)} warning(s)   baseline ${c.baseline_errors}/${c.baseline_warnings}${cmp ? `   ${cmp.verdict}` : ''}`);
    for (const f of c.new_findings.slice(0, 5)) out(`      NEW: ${f}`);
  }
  out();
  out(`  verdict: ${verdictFor(checks)}`);
  out(`  ${v.baseline.unverified} unverified record(s) at the recorded baseline; the five design-qa warnings are named in §12 by file and line.`);
  out();
  out('  A passing validator proves the data is well-formed and the markup consistent. It proves');
  out('  nothing about whether a statement is true (docs/VERIFICATION-POLICY.md §3).');
  out();
  process.exit(verdictFor(checks) === 'fail' ? 1 : 0);
}

/* ---------------------------------------------------------- decide */

if (command === 'decide') {
  const by = valueOf('--by');
  const grant = has('--grant');
  const deny = has('--deny');
  const note = valueOf('--note');

  if (!proposalId || !by || (grant === deny)) {
    out();
    out('  node agent/implement/cli.mjs decide --proposal <id> --grant|--deny --by "<person>" [--note "…"]');
    out();
    out('  THIS IS A HUMAN\'S COMMAND. It writes to the approval ledger, which is the only place');
    out('  a grant exists. --by must name a person: any name belonging to an agent in this system');
    out('  is refused, because an approval signed by an agent is docs/AGENT-ROLES.md H3 — "no agent');
    out('  verifies its own output" — with a longer name.');
    out();
    out('  The decision is bound to the proposal\'s fingerprint. Editing the proposal afterwards');
    out('  VOIDS the approval rather than carrying it onto a scope nobody agreed to.');
    out();
    process.exit(1);
  }

  try {
    const entry = recordDecision({ proposalId, outcome: grant ? 'granted' : 'denied', decidedBy: by, note });
    out();
    out(`  RECORDED — ${entry.outcome} by ${entry.decided_by} at ${entry.decided_at}`);
    out(`  proposal   ${entry.proposal_id} (${entry.proposal_contract}, produced by ${entry.proposal_agent})`);
    out(`  approval   ${entry.approval_id}`);
    out(`  bound to   ${entry.proposal_sha256}`);
    out(`  ledger     ${ledgerPath()}`);
    out();
    out('  Commit the ledger. A decision that exists only in a working tree is a decision nobody');
    out('  else can see, and git is the only attribution this repository has.');
    out();
    process.exit(0);
  } catch (err) {
    out();
    out(`  REFUSED — ${err.message}`);
    if (err instanceof SelfApprovalRefused) out('  (agent/implement/ledger.mjs refuses this at write time and again at read time.)');
    if (err instanceof UnknownProposal) out('  (run the producing agent first; an id in a prompt is not a proposal.)');
    out();
    process.exit(1);
  }
}

/* ---------------------------------------------------------- run */

if (command === 'run') {
  if (!asOf) {
    out('  --as-of YYYY-MM-DD is required. Derived output here depends on the reader\'s clock');
    out('  (docs/AUDIT-2026-09-01.md F-15) and freshness.mjs takes a date.');
    process.exit(1);
  }

  const dry = has('--dry');
  const apply = has('--apply');
  const store = dry ? new MemoryRecordStore({ allowSimulated: false }) : new RecordStore({ allowSimulated: false });
  const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: IMPLEMENT_AGENT } });

  const agent = new Implementer({ tracer, store, asOf, apply, quick: has('--quick') });

  out();
  out('  IMPLEMENTATION AND QA — Agent 9');
  out(`  as of ${asOf} · ${apply ? 'APPLY MODE — approved proposals will be written to the working tree' : 'rehearsal — nothing will be written'}${dry ? ' · --dry, no records stored' : ''}`);
  out();

  const r = await agent.run({ proposalIds: proposalId ? [proposalId] : null });

  if (!r.chosen.length) {
    out('  Nothing in the queue.');
    out();
    out('  agent/records/ is git-ignored, so a fresh checkout starts empty. Run the producing');
    out('  agents first — docs/HANDOVER.md, "Exact next objective" — then run this again.');
    out();
    out(`  trace ${r.trace_id}`);
    out();
    process.exit(0);
  }

  const byState = {};
  for (const c of r.chosen) (byState[c.approval.state] ??= []).push(c);

  out(`  ${r.chosen.length} proposal(s) considered`);
  out();
  for (const [state, items] of Object.entries(byState).sort()) out(`    ${state.padEnd(24)} ${items.length}`);
  out();

  for (const res of r.results) {
    if (res.outcome === 'refused') {
      out(`  ✗ REFUSED  ${res.proposal_id}  (${res.contract} · ${res.agent})`);
      for (const g of res.preflight?.failed ?? []) {
        out(`      ${g.gate}: ${g.why}`);
        out(`      → ${g.closes}`);
      }
      if (!res.preflight) out(`      ${res.why}`);
      out();
      continue;
    }
    out(`  ${res.outcome === 'implemented' ? '✓ IMPLEMENTED' : res.outcome === 'rehearsed' ? '· REHEARSED' : `! ${res.outcome.toUpperCase()}`}  ${res.proposal_id}`);
    out(`      files      ${res.change.files.map((f) => `${f.path} (+${f.lines_added}/-${f.lines_removed})`).join(', ')}`);
    out(`      QA         ${res.qa.verdict} · ${res.qa.checks.length} check(s) · browser QA ${res.qa.browser_required ? (res.qa.browser.run?.status ?? 'not run') : 'not required'}`);
    if (res.qa.blocking_findings.length) for (const b of res.qa.blocking_findings.slice(0, 6)) out(`      BLOCKING   ${b}`);
    out(`      risk       ${res.risk.level}${res.risk.reasons.length ? ` — ${res.risk.reasons.join('; ')}` : ''}`);
    out(`      rollback   ${res.risk.rollback_is_mechanical}`);
    if (res.reverted) out(`      REVERTED   ${res.reverted.verified ? 'verified: every permitted path re-hashes to its pre-change state' : `INCOMPLETE — ${res.reverted.mismatches.length} mismatch(es). Do not push.`}`);
    out(`      scope      ${res.scope.ok ? 'inside the approved set' : `LEFT SCOPE: ${res.scope.outside.map((o) => o.path).join(', ')}`}`);
    out();
  }

  if (r.forged.length) {
    out(`  ${r.forged.length} APPROVAL CLAIM(S) IN agent/records/ WERE DISCARDED`);
    for (const f of r.forged.slice(0, 6)) out(`    · ${f.proposal_id}: ${f.approval_id} claims "${f.claimed_state}" by "${f.claimed_by}" (written by ${f.written_by_agent})`);
    out();
  }

  out(`  ${r.implemented.length} implemented · ${r.failed.length} reverted or failed · ${r.refused.length} refused · ${r.results.filter((x) => x.outcome === 'rehearsed').length} rehearsed`);
  out(`  working tree: ${r.dirty.length} changed path(s)`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);
  out();
  out('  NOTHING WAS DEPLOYED. This agent reaches ChangeRecord.state "applied" and stops.');
  out('  Deployment is a separate fact with its own record, and pushing to main is Class D.');
  out();
  process.exit(r.failed.length ? 1 : 0);
}

out(`  unknown command "${command}". Try: queue · preflight · boundary · check · decide · run`);
out(`  the ten gates are: ${GATES.join(', ')}`);
process.exit(1);
