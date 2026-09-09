#!/usr/bin/env node
/* ============================================================
   agent/policy/cli.mjs — read the policy, and ask it about a
   proposal

       node agent/policy/cli.mjs policy            the policy in force
       node agent/policy/cli.mjs governance        the grants it is derived from
       node agent/policy/cli.mjs matrix            who may do what
       node agent/policy/cli.mjs categories        the vocabulary
       node agent/policy/cli.mjs evaluate --proposal <id> [--actor <kind>]
                                                   [--action <a>] [--env <e>]
                                                   [--simulate] [--base]

       node agent/policy/cli.mjs grant  --by "<person>" --authority "<why>"
              --categories a,b --paths p,q --fields data/x.json:f1,f2
              --until YYYY-MM-DD [--rationale "…"] [--session "…"]
       node agent/policy/cli.mjs revoke --grant <grant_id> --by "<person>"
              --authority "<why>" --until YYYY-MM-DD

   `grant` IS THE PERSON'S COMMAND, THE WAY `decide` IS. It is here
   rather than in the autonomy runner for exactly that reason: the
   thing being constrained does not get to write the constraint. It
   refuses a name that belongs to an agent in this system, refuses a
   category no policy may automate, refuses a path outside the
   eligible set, refuses a field on the never-automatic list, refuses
   a risk ceiling above `low`, refuses `production`, and refuses a
   grant with no expiry. Every one of those refusals runs again on
   every READ, so a line written around this command is not honoured
   either.

   `policy` prints what is IN FORCE — the base policy plus every
   active grant. `--base` on `evaluate` asks the base policy instead,
   which is what the answer looks like when nobody has decided
   anything.

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
import {
  policyInForce, describeGovernance, recordGrant, GrantRefused,
  AUTOMATIC_ELIGIBLE_PATHS, NEVER_AUTOMATIC_PATHS, NEVER_AUTOMATIC_FIELDS, GRANTABLE_FIELDS,
} from './governance.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0] ?? 'policy';
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1] ?? true);
};
const has = (name) => argv.includes(`--${name}`);

const rule = (s) => console.log(`\n${s}\n${'─'.repeat(s.length)}`);

const agentNamesFromStore = () => {
  try { return new Set([...readAgentRecords().byId.values()].map((r) => r.agent).filter(Boolean)); }
  catch { return null; }
};

if (cmd === 'policy') {
  const { policy, active } = policyInForce({ agents: agentNamesFromStore() });
  rule('THE POLICY IN FORCE');
  console.log(JSON.stringify(policy, null, 2));
  console.log(`\n${AUTOMATABLE_CATEGORIES.length} categor(ies) are ELIGIBLE for autonomy: ${AUTOMATABLE_CATEGORIES.join(', ')}`);
  console.log(`${policy.enabled_categories.length} categor(ies) are ENABLED by ${active.length} governance grant(s). Eligible is not enabled.`);
  console.log(`${HUMAN_ONLY_CATEGORIES.length} categor(ies) may never be automated by any policy.`);
  console.log(`\nThe BASE policy — what this permits when nobody has decided anything — still enables nothing:`);
  console.log(`  ${DEFAULT_POLICY.policy_id} · enabled_categories ${JSON.stringify([...DEFAULT_POLICY.enabled_categories])}`);
} else if (cmd === 'governance') {
  const g = describeGovernance({ agents: agentNamesFromStore() });
  rule('GOVERNANCE — what is switched on, who switched it on, and until when');
  console.log(`ledger          ${g.ledger_path}`);
  console.log(`self-check      ${g.self_check.ok ? 'ok — no eligible path reaches a never-automatic one, no grantable field is on the never list' : g.self_check.problems.join(' · ')}`);
  console.log(`\nACTIVE GRANTS   ${g.active.length}`);
  for (const a of g.active) {
    console.log(`\n  ${a.grant_id}`);
    console.log(`    decided by  ${a.decided_by} on ${a.decided_at}, expires ${a.expires_at}`);
    console.log(`    authority   ${a.authority}`);
    console.log(`    categories  ${a.categories.join(', ')}`);
    console.log(`    paths       ${a.path_allowlist.join(', ')}`);
    for (const [ds, f] of Object.entries(a.field_allowlist ?? {})) console.log(`    fields      ${ds}: ${f.join(', ')}`);
    console.log(`    risk ≤      ${a.max_automatic_risk} · environments ${a.environments.join(', ')}`);
    if (a.rationale) console.log(`    rationale   ${a.rationale}`);
  }
  if (g.inactive.length) {
    console.log(`\nNOT IN FORCE    ${g.inactive.length}`);
    for (const i of g.inactive) console.log(`  · ${i.grant.grant_id}  ${i.state.toUpperCase()} — ${i.why.slice(0, 200)}`);
  }
  if (g.malformed.length) console.log(`\n${g.malformed.length} UNPARSEABLE LEDGER LINE(S) — reported, never skipped:\n${g.malformed.map((m) => `  line ${m.line}: ${m.why}`).join('\n')}`);
  console.log(`\nELIGIBLE PATHS  a grant may name only these, or something under them`);
  for (const [p, why] of AUTOMATIC_ELIGIBLE_PATHS) console.log(`  ${p}\n    ${why}`);
  console.log(`\nNEVER           ${NEVER_AUTOMATIC_PATHS.length} path(s) and ${NEVER_AUTOMATIC_FIELDS.length} field(s) no grant may reach`);
  console.log(`  paths:  ${NEVER_AUTOMATIC_PATHS.map(([p]) => p).join(', ')}`);
  console.log(`  fields: ${NEVER_AUTOMATIC_FIELDS.map(([f]) => f).join(', ')}`);
  console.log(`\n${g.note}`);
} else if (cmd === 'grant' || cmd === 'revoke') {
  const by = flag('by');
  const authority = flag('authority');
  const until = flag('until');
  if (!by || !authority || !until) {
    console.error('usage: node agent/policy/cli.mjs grant --by "<person>" --authority "<why>" --until <YYYY-MM-DD> --categories a,b --paths p,q --fields data/x.json:f1,f2');
    console.error('       every one of --by, --authority and --until is required. A grant with no author, no stated authority or no end is not a governance decision.');
    process.exit(2);
  }
  const list = (s) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const fields = {};
  for (const spec of list(flag('fields'))) {
    const [ds, names] = spec.split(':');
    if (!ds || !names) continue;
    fields[ds] = [...(fields[ds] ?? []), ...names.split('|').map((x) => x.trim()).filter(Boolean)];
  }
  const body = cmd === 'revoke'
    ? { action: 'revoke', revokes: flag('grant'), decided_by: by, authority, expires_at: `${until}T00:00:00Z` }
    : {
      action: 'enable',
      categories: list(flag('categories')),
      path_allowlist: list(flag('paths')),
      field_allowlist: fields,
      max_automatic_risk: flag('risk', 'low'),
      environments: list(flag('environments', 'local,ci')),
      decided_by: by,
      authority,
      rationale: flag('rationale', null),
      session: flag('session', null),
      expires_at: `${until}T00:00:00Z`,
    };
  try {
    const entry = recordGrant(body, { agents: agentNamesFromStore() });
    rule(cmd === 'revoke' ? 'REVOCATION RECORDED' : 'GOVERNANCE GRANT RECORDED');
    console.log(JSON.stringify(entry, null, 2));
    console.log('\nIt is honoured only while every rule that admitted it still holds: the rules run again on every read.');
  } catch (e) {
    if (!(e instanceof GrantRefused)) throw e;
    rule('REFUSED');
    for (const r of e.refusals) console.log(`  ✗ ${r.rule.padEnd(14)} ${r.why}`);
    console.log(`\nGrantable fields, by dataset:`);
    for (const [ds, f] of Object.entries(GRANTABLE_FIELDS)) console.log(`  ${ds}: ${f.join(', ')}`);
    process.exit(1);
  }
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
  const records = readAgentRecords();
  const agents = new Set([...records.byId.values()].map((r) => r.agent).filter(Boolean));
  const policy = has('simulate') ? SIMULATION_POLICY
    : has('base') ? DEFAULT_POLICY
      : policyInForce({ agents }).policy;
  if (has('simulate')) console.log('\n*** --simulate: evaluating against a FIXTURE policy that is not in force. It is not what this repository runs. ***');
  if (has('base')) console.log('\n*** --base: evaluating against the BASE policy — what this permits when no governance grant exists. ***');

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
  console.error(`unknown command "${cmd}". One of: policy · governance · grant · revoke · matrix · categories · evaluate`);
  process.exit(2);
}
