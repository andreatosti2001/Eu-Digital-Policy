#!/usr/bin/env node
/* ============================================================
   agent/schemas/cli.mjs

     node agent/schemas/cli.mjs list
     node agent/schemas/cli.mjs show DataGap
     node agent/schemas/cli.mjs validate path/to/record.json
     node agent/schemas/cli.mjs export ClaimEvidence
     node agent/schemas/cli.mjs fixture QAResult
     node agent/schemas/cli.mjs check

   Zero dependencies, like everything else here. `validate` exits
   non-zero on an invalid record, so it can gate a commit the same
   way the four validators in tools/ do.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { CONTRACT_LIST, getContract, CONTRACT_NAMES } from './registry.mjs';
import { validate, validateBatch } from './validate.mjs';
import { toJsonSchema } from './export.mjs';
import { FIXTURES } from './fixtures.mjs';

const [, , cmd = 'list', arg] = process.argv;
const out = (s = '') => process.stdout.write(`${s}\n`);

function list() {
  out();
  out('  FOURTEEN CONTRACTS');
  out('  ' + '─'.repeat(74));
  for (const c of CONTRACT_LIST) {
    out(`  ${c.name.padEnd(24)} ${c.kind.padEnd(12)} id: ${c.id_field}`);
    out(`  ${' '.repeat(24)} ${Object.keys(c.fields).length} fields · ${Object.keys(c.forbidden).length} forbidden · ${c.rules.length} cross-field rules`);
  }
  out();
  out('  Every record carries the envelope: contract, contract_version, agent,');
  out('  created_at, affected_entities, evidence, epistemic, trace_ref, simulated.');
  out('  Every proposal also carries the twelve: proposal_id, reason, confidence,');
  out('  risk, autonomy_class, proposed_change, validation_requirements, rollback_plan.');
  out();
}

function show(name) {
  const c = getContract(name);
  out();
  out(`  ${c.name}  (${c.kind}, v${c.version})`);
  out('  ' + '─'.repeat(74));
  out(`  ${c.doc}`);
  out();
  for (const [key, sp] of Object.entries(c.fields)) {
    const flags = [
      sp.required ? '' : 'optional',
      sp.nullable ? 'nullable' : '',
      sp.unknownable ? '"unknown" allowed' : '',
      sp.epistemic !== 'structural' ? sp.epistemic.toUpperCase() : '',
    ].filter(Boolean).join(' · ');
    out(`  ${key}`);
    out(`      ${sp.kind}${flags ? `  [${flags}]` : ''}`);
    out(`      ${sp.doc}`);
  }
  if (Object.keys(c.forbidden).length) {
    out();
    out('  FORBIDDEN');
    for (const [key, reason] of Object.entries(c.forbidden)) {
      out(`  ${key}`);
      out(`      ${reason}`);
    }
  }
  out();
  out(`  ${c.rules.length} cross-field rule(s), enforced by agent/schemas/validate.mjs.`);
  out();
}

function validateFile(path) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  const records = Array.isArray(parsed) ? parsed : [parsed];
  const { results, valid, invalid, unresolved_refs } = validateBatch(records);
  out();
  for (const { record, errors } of results) {
    const label = `${record?.contract ?? '?'} ${record?.[getContractIdField(record)] ?? ''}`.trim();
    if (errors.length === 0) out(`  ok    ${label}`);
    else {
      out(`  FAIL  ${label}`);
      for (const e of errors) out(`          · ${e}`);
    }
  }
  if (unresolved_refs.length) {
    out();
    out('  REFERENCES THIS BATCH CANNOT RESOLVE');
    out('  (reported, not treated as invalid — the record may live elsewhere)');
    for (const u of unresolved_refs) out(`  · ${u.from} → ${u.field} = ${u.ref}`);
  }
  out();
  out(`  ${records.length} record(s), ${valid} valid, ${invalid} invalid`);
  out();
  process.exitCode = invalid ? 1 : 0;
}

function getContractIdField(record) {
  try { return getContract(record?.contract).id_field; } catch { return 'id'; }
}

function check() {
  out();
  let bad = 0;
  for (const name of CONTRACT_NAMES) {
    const errs = validate(FIXTURES[name](), { allowSimulated: true });
    if (errs.length) { bad++; out(`  FAIL  ${name}`); for (const e of errs) out(`          · ${e}`); }
    else out(`  ok    ${name}`);
  }
  out();
  out(`  ${CONTRACT_NAMES.length} contracts, ${CONTRACT_NAMES.length - bad} satisfiable by their fixture, ${bad} not`);
  out('  Every fixture is marked simulated. None of it is a legal fact.');
  out();
  process.exitCode = bad ? 1 : 0;
}

switch (cmd) {
  case 'list': list(); break;
  case 'show': if (!arg) { out('usage: show <ContractName>'); process.exitCode = 2; } else show(arg); break;
  case 'validate': if (!arg) { out('usage: validate <file.json>'); process.exitCode = 2; } else validateFile(arg); break;
  case 'export': out(JSON.stringify(arg ? toJsonSchema(arg) : Object.fromEntries(CONTRACT_NAMES.map((n) => [n, toJsonSchema(n)])), null, 2)); break;
  case 'fixture': if (!arg) { out('usage: fixture <ContractName>'); process.exitCode = 2; } else out(JSON.stringify(FIXTURES[getContract(arg).name](), null, 2)); break;
  case 'check': check(); break;
  default:
    out(`unknown command "${cmd}" — try: list · show <Name> · validate <file.json> · export [Name] · fixture <Name> · check`);
    process.exitCode = 2;
}
