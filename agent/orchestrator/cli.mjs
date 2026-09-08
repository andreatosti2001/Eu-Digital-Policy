#!/usr/bin/env node
/* ============================================================
   agent/orchestrator/cli.mjs — the Master Orchestrator

     node agent/orchestrator/cli.mjs workflows        # the ten types and their stages
     node agent/orchestrator/cli.mjs capabilities     # who may produce what
     node agent/orchestrator/cli.mjs policy           # the ten human-review triggers, the twelve conditions
     node agent/orchestrator/cli.mjs survey           # every proposal in the real store, and what would happen to it
     node agent/orchestrator/cli.mjs state [<id>]     # the workflow journal
     node agent/orchestrator/cli.mjs run --event <file.json>
     node agent/orchestrator/cli.mjs run --type <TYPE> --subject <contract>:<id> --kind "…"

   `workflows`, `capabilities` and `policy` RUN NOTHING. They print
   the tables the rest of the system is checked against, which is
   the point of declaring them as data.

   `survey` reads the REAL record store and the REAL decision ledger
   and answers, for every proposal any agent has produced, the only
   question that matters: would the Orchestrator route this to
   implementation, and if not, which check refuses it. It writes
   nothing.

   `run` opens a workflow. With no dispatcher wired — which is every
   invocation today — every dispatch stage comes back
   `not_dispatched` and the workflow ends `unresolved` or
   `human_review_required`. That is the honest result of running the
   machinery with no specialists attached, and it is printed as such
   rather than as a clean run.

   EXIT CODES
     0  the command ran. A workflow ending in human_review_required
        is a SUCCESSFUL run of the Orchestrator: routing work to a
        person is what it is for.
     1  the command threw, or a workflow ended `failed` — which
        means the machinery broke, not that the world disagreed.
     2  an event was refused at intake.

   NOTHING HERE PUBLISHES. There is no apply, no deploy, no merge
   and no push, and `.control-room/boundary.mjs`'s route-word check
   has a sibling in the suite asserting the same about this file.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { Orchestrator, ORCHESTRATOR_AGENT } from './orchestrator.mjs';
import { WorkflowJournal, survey as surveyWorkflows, replay, DEFAULT_STATE_DIR } from './state.mjs';
import { describeWorkflows, WORKFLOW_TYPES, END_STATE_MEANING } from './workflows.mjs';
import { describeCapabilities } from './capabilities.mjs';
import { HUMAN_REVIEW_TRIGGERS, MANDATORY_AUTONOMY_CONDITIONS, LOW_RISK_CATEGORIES, APPROVED_AUTONOMOUS_CATEGORIES, AUTONOMY_NOTE, MAJOR_REWRITE_CHARS, MAJOR_REWRITE_PROSE_OPS } from './policy.mjs';
import { routableProposals, ROUTING_CHECKS } from './approval.mjs';

const argv = process.argv.slice(2);
const command = argv[0] ?? 'workflows';
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const out = (s = '') => process.stdout.write(`${s}\n`);
const json = has('--json');
const rule = () => out('─'.repeat(74));

function emit(value) { out(JSON.stringify(value, null, 2)); }

/* ---------------------------------------------------------- workflows */

if (command === 'workflows') {
  const table = describeWorkflows();
  if (json) { emit({ types: table, end_states: END_STATE_MEANING }); process.exit(0); }

  out('THE TEN WORKFLOW TYPES');
  out('The Master Orchestrator coordinates specialist agents. It does not replace their');
  out('domain reasoning — every "dispatch" below is a specialist doing its own work, and');
  out('every "gate" is the Orchestrator\'s own, which is the only reasoning it does.');
  out();
  for (const w of table) {
    rule();
    out(`${w.type}`);
    out(`  ${w.what}`);
    out(`  entry: ${w.entry_contracts.join(', ')}`);
    out();
    for (const s of w.stages) {
      const who = s.kind === 'dispatch' ? s.agent : s.kind === 'gate' ? `gate:${s.gate}` : 'a person';
      out(`   ${s.required ? '·' : '○'} ${s.stage.padEnd(18)} ${s.kind.padEnd(9)} ${who}`);
      out(`     ${s.why}`);
      if (s.needs?.length) out(`     may produce: ${s.needs.join(', ')}`);
      if (s.why_optional) out(`     optional: ${s.why_optional}`);
    }
    out();
    out(`  completes without a person: ${w.completes_without_human}`);
    out(`  human review: ${w.human_review_when.join(' · ')}`);
    out(`  never: ${w.never}`);
    if (w.cannot_see) { out(); out(`  CANNOT SEE: ${w.cannot_see}`); }
    out();
  }
  rule();
  out('THE FIVE END STATES');
  for (const [s, m] of Object.entries(END_STATE_MEANING)) out(`  ${s.padEnd(24)} ${m}`);
  out();
  out('Every one of the ten ends at a human stage, and workflows.mjs refuses to load one');
  out('that does not. No workflow in this system publishes anything.');
  process.exit(0);
}

/* ---------------------------------------------------------- capabilities */

if (command === 'capabilities') {
  const caps = describeCapabilities();
  if (json) { emit({ capabilities: caps }); process.exit(0); }

  out('THE CAPABILITY REGISTER');
  out('A grant is the INTERSECTION of what an agent holds and what a stage asks for,');
  out('never the union. A stage cannot widen an agent by asking for more, being routed a');
  out('task grants nothing, and a Control Room click grants nothing.');
  out();
  for (const c of caps) {
    rule();
    out(`${c.agent}${c.dispatchable ? '' : '   (not dispatchable)'}`);
    out(`  ${c.role} · ${c.role_ref} · ${c.doc}`);
    out(`  ${c.what}`);
    out(`  produces:  ${c.produces.join(', ') || '(nothing)'}`);
    out(`  consumes:  ${c.consumes.length > 6 ? `${c.consumes.slice(0, 6).join(', ')} … ${c.consumes.length} in all` : c.consumes.join(', ') || '(nothing)'}`);
    out(`  ceiling:   ${c.autonomy_ceiling}    may decide: ${c.may_decide}    may implement: ${c.may_implement}`);
    out(`  writes:    ${c.writes.join(', ') || '(nothing)'}`);
    out(`  never:     ${c.never}`);
  }
  rule();
  out('No agent may decide. A grant lives in agent/implement/decisions/decisions.jsonl and');
  out('reaches it through one function, which refuses any name belonging to an agent here.');
  process.exit(0);
}

/* ---------------------------------------------------------- policy */

if (command === 'policy') {
  if (json) {
    emit({
      human_review_triggers: HUMAN_REVIEW_TRIGGERS,
      mandatory_autonomy_conditions: MANDATORY_AUTONOMY_CONDITIONS,
      low_risk_categories: LOW_RISK_CATEGORIES,
      approved_autonomous_categories: APPROVED_AUTONOMOUS_CATEGORIES,
      routing_checks: ROUTING_CHECKS,
      note: AUTONOMY_NOTE,
      thresholds: { major_rewrite_chars: MAJOR_REWRITE_CHARS, major_rewrite_prose_ops: MAJOR_REWRITE_PROSE_OPS },
    });
    process.exit(0);
  }
  out('THE TEN HUMAN-REVIEW TRIGGERS');
  out('Any one of them routes the workflow to a person. No amount of model confidence');
  out('overrides one, and `confidence` is not read anywhere in agent/orchestrator/policy.mjs.');
  for (const t of HUMAN_REVIEW_TRIGGERS) out(`  · ${t}`);
  out();
  out(`  major_rewrite thresholds: ${MAJOR_REWRITE_CHARS} characters replaced, or ${MAJOR_REWRITE_PROSE_OPS} operations against prose.`);
  out('  Both deliberately low. Misclassifying downward is the failure the autonomy policy');
  out('  exists to prevent, and a threshold that catches an ordinary edit costs a review.');
  out();
  rule();
  out('THE TWELVE MANDATORY CONDITIONS (protocol §18)');
  out('Failure of one blocks automatic execution. All twelve are evaluated and reported,');
  out('because "which would have failed" is the useful fact, not "autonomy is off".');
  for (const c of MANDATORY_AUTONOMY_CONDITIONS) out(`  · ${c}`);
  out();
  rule();
  out('THE EIGHT ROUTING CHECKS before an approved proposal reaches implementation');
  for (const c of ROUTING_CHECKS) out(`  · ${c}`);
  out();
  rule();
  out('AUTONOMOUS ACTION CATEGORIES');
  out(`  declared by protocol §20:  ${LOW_RISK_CATEGORIES.join(', ')}`);
  out(`  approved in this repository: ${APPROVED_AUTONOMOUS_CATEGORIES.length ? APPROVED_AUTONOMOUS_CATEGORIES.join(', ') : 'NONE'}`);
  out();
  out(`  ${AUTONOMY_NOTE}`);
  process.exit(0);
}

/* ---------------------------------------------------------- survey */

if (command === 'survey') {
  let rows;
  try { rows = routableProposals(); }
  catch (e) { out(`the record store could not be read: ${e.message}`); process.exit(1); }

  if (json) { emit({ proposals: rows, checks: ROUTING_CHECKS }); process.exit(0); }

  out('EVERY PROPOSAL IN THE RECORD STORE, AND WHAT WOULD HAPPEN TO IT');
  out('Read from agent/records/ and agent/implement/decisions/decisions.jsonl. Nothing on');
  out('any event, any filename or any ApprovalRequest state was consulted.');
  out();
  if (!rows.length) {
    out('  No proposal is in the record store on this machine.');
    out('  agent/records/ is git-ignored run state: a fresh clone and a CI runner have none.');
    out('  That is not the same as "no agent has ever proposed anything", and it is not');
    out('  reported as one — run an agent, and the proposals appear here.');
    process.exit(0);
  }
  const routable = rows.filter((r) => r.routable);
  out(`  ${rows.length} proposal(s) · ${routable.length} routable to implementation`);
  out();
  for (const r of rows) {
    out(`  ${r.routable ? 'ROUTABLE ' : 'refused  '} ${r.proposal_id}`);
    out(`     ${r.contract} by ${r.agent} · ${r.autonomy_class} · approval ${r.state}`);
    if (!r.routable) out(`     refused by: ${r.refused_by.join(', ')}`);
  }
  out();
  out('  Routable means the eight checks pass and the Orchestrator would hand it on. It');
  out('  does NOT mean anything would be published: the Implementation Agent re-derives the');
  out('  same authorization through its own ten gates, and IMPLEMENTATION_REQUEST ends at a');
  out('  human stage regardless of its outcome.');
  process.exit(0);
}

/* ---------------------------------------------------------- state */

if (command === 'state') {
  const id = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
  if (id) {
    const r = replay(id);
    if (json) { emit(r); process.exit(0); }
    if (!r.exists) { out(r.why); process.exit(0); }
    out(`WORKFLOW ${r.workflow_id}`);
    out(`  opened ${r.opened_at} from event ${r.event_id} (${r.source})`);
    out(`  state  ${r.state}${r.terminal ? ' (terminal)' : ''}`);
    out();
    for (const t of r.transitions) out(`  ${t.at}  ${String(t.from ?? '—').padEnd(14)} → ${t.to.padEnd(22)} ${t.why}`);
    out();
    for (const s of r.stages) out(`  stage ${s.stage.padEnd(18)} ${String(s.status ?? '').padEnd(16)} ${s.why ?? ''}`);
    if (r.malformed.length) { out(); out(`  ${r.malformed.length} malformed journal line(s), reported and not repaired:`); for (const m of r.malformed) out(`    line ${m.line}: ${m.why}`); }
    if (r.gaps.length) { out(); out(`  ${r.gaps.length} sequence gap(s). A line was removed, reordered, or written by a second process.`); }
    out();
    out(`  ${r.bound}`);
    process.exit(0);
  }
  const all = surveyWorkflows();
  if (json) { emit({ dir: DEFAULT_STATE_DIR, workflows: all }); process.exit(0); }
  out(`WORKFLOWS IN ${DEFAULT_STATE_DIR}`);
  if (!all.length) {
    out('  none. The journal directory is git-ignored per-machine run state, so a fresh');
    out('  clone and a CI runner have none — which is not the same as no workflow having run.');
    process.exit(0);
  }
  for (const w of all) out(`  ${w.workflow_id}  ${String(w.state).padEnd(24)} ${w.declared_type ?? '(classified from the subject)'}  ${w.opened_at}`);
  process.exit(0);
}

/* ---------------------------------------------------------- run */

if (command === 'run') {
  const file = valueOf('--event');
  let raw;
  if (file) {
    if (!existsSync(file)) { out(`no such event file: ${file}`); process.exit(1); }
    try { raw = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { out(`the event file is not JSON: ${e.message}`); process.exit(1); }
  } else {
    const subject = valueOf('--subject');
    const type = valueOf('--type');
    if (!type && !subject) {
      out('name an event: --event <file.json>, or --type <TYPE> --subject <Contract>:<id> --kind "…"');
      out(`the ten types: ${WORKFLOW_TYPES.join(', ')}`);
      process.exit(1);
    }
    const [contract, ...rest] = String(subject ?? '').split(':');
    raw = {
      source: 'cli',
      kind: valueOf('--kind') ?? 'opened from the command line',
      ...(type ? { workflow_type: type } : {}),
      ...(subject ? { subject: { contract, id: rest.join(':') } } : {}),
    };
  }

  const tracer = new Tracer({ service: ORCHESTRATOR_AGENT, sink: new JsonlSink() });
  const orch = new Orchestrator({ tracer, journal: new WorkflowJournal({ memory: has('--dry-run') }) });
  const result = await orch.handle(raw);

  if (json) { emit(result); process.exit(result.refused ? 2 : result.state === 'failed' ? 1 : 0); }

  if (result.refused) {
    out('THE EVENT WAS REFUSED AT INTAKE');
    out(`  ${result.refused.why}`);
    if (result.refused.fix) out(`  ${result.refused.fix}`);
    out(`  trace ${result.trace.trace_id}`);
    process.exit(2);
  }

  const w = result.workflow;
  out(`WORKFLOW ${w.workflow_id}`);
  out(`  type   ${w.type ?? '(unclassified)'}`);
  out(`  state  ${w.state}`);
  out(`  trace  ${w.trace.trace_id}`);
  if (w.event?.discarded?.length) {
    out();
    out(`  ${w.event.discarded.length} FIELD(S) STRIPPED AT INTAKE, and not read:`);
    for (const d of w.event.discarded) out(`    ${d.field} = ${d.claimed}\n      ${d.why}`);
  }
  out();
  out('  STAGES');
  for (const s of w.stages) {
    out(`    ${s.stage.padEnd(18)} ${String(s.status).padEnd(16)} ${s.agent ?? ''}`);
    if (s.why) out(`      ${s.why}`);
    for (const r of s.refusals ?? []) out(`      refused (${r.code}): ${r.why}`);
  }
  if (w.conflicts?.length) {
    out();
    out(`  ${w.conflicts.length} CONFLICT(S)`);
    for (const c of w.conflicts) out(`    ${c.kind} (${c.severity}): ${c.why}`);
  }
  if (w.human_review_reasons?.length) {
    out();
    out('  ROUTED TO A PERSON BECAUSE');
    for (const r of w.human_review_reasons) out(`    ${r.code}: ${r.why}`);
  }
  if (w.autonomy) {
    out();
    out(`  AUTONOMY — ${w.autonomy.summary}`);
    for (const c of w.autonomy.conditions) out(`    ${c.satisfied ? 'ok  ' : 'NO  '} ${c.condition.padEnd(30)} ${c.why}`);
  }
  out();
  out(`  ${result.state_meaning ?? ''}`);
  out(`  ${result.publication_note}`);
  process.exit(result.state === 'failed' ? 1 : 0);
}

out(`unknown command "${command}". The commands are: workflows, capabilities, policy, survey, state, run.`);
process.exit(1);
