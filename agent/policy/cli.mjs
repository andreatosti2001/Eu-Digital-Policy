#!/usr/bin/env node
/* ============================================================
   agent/policy/cli.mjs — read the policy, and ask it about a
   proposal

       node agent/policy/cli.mjs policy            the policy in force
       node agent/policy/cli.mjs matrix            who may do what
       node agent/policy/cli.mjs categories        the vocabulary
       node agent/policy/cli.mjs evaluate --proposal <id> [--actor <kind>]
                                                   [--action <a>] [--env <e>]
                                                   [--simulate]

   `evaluate` reads the proposal out of the agent record store and
   supplies NO measured facts. That is not an oversight: it is what
   the answer looks like when nobody has run the verifier, the
   validators or the browser, and the point of printing it is that
   those conditions come back `unknown` rather than absent. An
   unknown does not execute.

   `--simulate` evaluates against `SIMULATION_POLICY`, which is a
   fixture and is not in force. The flag exists so a reader can see
   the permitting half of the policy work without anything in the
   repository being switched on. It prints a banner saying so.

   Exit codes: 0 the command ran. This CLI reports; it is not a gate.
   ============================================================ */

import { readAgentRecords } from '../implement/ledger.mjs';
import { getContract } from '../schemas/registry.mjs';
import { evaluate, mayExecute } from './engine.mjs';
import { matrix, CAPABILITIES, ACTOR_KINDS } from './actors.mjs';
import { DEFAULT_POLICY, SIMULATION_POLICY, ACTION_CATEGORIES, AUTOMATABLE_CATEGORIES, HUMAN_ONLY_CATEGORIES } from './categories.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0] ?? 'policy';
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1] ?? true);
};
const has = (name) => argv.includes(`--${name}`);

const rule = (s) => console.log(`\n${s}\n${'─'.repeat(s.length)}`);

if (cmd === 'policy') {
  rule('THE POLICY IN FORCE');
  console.log(JSON.stringify(DEFAULT_POLICY, null, 2));
  console.log(`\n${AUTOMATABLE_CATEGORIES.length} categor(ies) are ELIGIBLE for autonomy: ${AUTOMATABLE_CATEGORIES.join(', ')}`);
  console.log(`${DEFAULT_POLICY.enabled_categories.length} categor(ies) are ENABLED. Eligible is not enabled.`);
  console.log(`${HUMAN_ONLY_CATEGORIES.length} categor(ies) may never be automated by any policy.`);
} else if (cmd === 'matrix') {
  rule('THE AUTHORIZATION MATRIX');
  for (const kind of ACTOR_KINDS) {
    console.log(`\n${kind.toUpperCase()} — ${CAPABILITIES[kind].what}`);
    for (const r of matrix().filter((x) => x.actor === kind)) {
      const mark = r.verdict === 'permitted' ? '✓' : r.verdict === 'never' ? '✗' : '·';
      const detail = r.verdict === 'permitted'
        ? `${r.environments.join('/')} · ${r.resources.join(', ')} · ≤${r.max_risk}${r.grant ? ' · needs a grant' : ''}`
        : r.verdict === 'never' ? String(r.why).slice(0, 120) : 'denied by default';
      console.log(`  ${mark} ${r.action.padEnd(26)} ${detail}`);
    }
  }
} else if (cmd === 'categories') {
  rule('ACTION CATEGORIES');
  for (const [name, meta] of Object.entries(ACTION_CATEGORIES)) {
    console.log(`\n${meta.automatable ? '○' : '●'} ${name}${meta.automatable ? '  (eligible for autonomy)' : `  (${meta.human_review})`}`);
    console.log(`    ${meta.what}`);
    console.log(`    costs if wrong: ${meta.costs}`);
  }
} else if (cmd === 'evaluate') {
  const id = flag('proposal');
  if (!id) { console.error('usage: node agent/policy/cli.mjs evaluate --proposal <id>'); process.exit(2); }
  const policy = has('simulate') ? SIMULATION_POLICY : DEFAULT_POLICY;
  if (has('simulate')) console.log('\n*** --simulate: evaluating against a FIXTURE policy that is not in force. Nothing in this repository is switched on. ***');

  const records = readAgentRecords();
  const proposal = records.byId.get(id) ?? null;
  if (!proposal) {
    console.error(`\nno record store holds a proposal with id "${id}". An id on a command line is not a proposal.`);
    process.exit(1);
  }
  let kind = 'proposal';
  try { kind = getContract(proposal.contract).kind; } catch { /* reported by the engine */ }

  const req = {
    actor: { kind: flag('actor', 'implementation_qa'), id: flag('actor', 'implementation_qa') },
    action: flag('action', 'implement.apply'),
    environment: flag('env', 'local'),
    resource: { kind: 'canonical_data', id },
    proposal,
    policy,
  };
  const d = evaluate(req);

  rule(`EVALUATION — ${id}`);
  console.log(`contract        ${proposal.contract} (kind ${kind}), produced by ${proposal.agent}`);
  console.log(`policy          ${d.policy_id}`);
  console.log(`actor           ${d.actor.kind} · action ${d.action} · environment ${d.environment}`);
  console.log(`category        ${d.category.category} — ${d.category.why}`);
  if (d.category.effective_class) console.log(`class           declared "${d.category.effective_class.declared}", effective "${d.category.effective_class.effective}"`);
  console.log(`\nROUTE           ${d.route.toUpperCase()}`);
  console.log(`                ${d.why}`);
  if (d.conditions.length) {
    console.log('\nTHE TWELVE');
    for (const c of d.conditions) {
      const mark = { satisfied: '✓', failed: '✗', unknown: '?', not_applicable: '–' }[c.verdict];
      console.log(`  ${mark} ${c.condition.padEnd(28)} ${c.why.slice(0, 150)}`);
    }
  }
  if (d.human_review_triggers.length) {
    console.log('\nMANDATORY HUMAN REVIEW');
    for (const t of d.human_review_triggers) console.log(`  · ${t.trigger}: ${t.why.slice(0, 150)}`);
  }
  const x = mayExecute(req, { records });
  console.log(`\nMAY EXECUTE NOW ${x.allow ? 'YES' : 'NO'}`);
  console.log(`                ${x.why}`);
  console.log(`\n${d.note}`);
} else {
  console.error(`unknown command "${cmd}". One of: policy · matrix · categories · evaluate`);
  process.exit(2);
}
