#!/usr/bin/env node
/* ============================================================
   agent/production/cli.mjs — production operating mode, from a
   terminal

     node agent/production/cli.mjs readiness [--as-of YYYY-MM-DD] [--quick]
     node agent/production/cli.mjs schedule      the daily cycle and the fourteen reviews
     node agent/production/cli.mjs visual        the ten conditions of the final visual standard
     node agent/production/cli.mjs separations   discovery vs authentication vs authorization
     node agent/production/cli.mjs trace         every way the website can change, and what it leaves

   EVERY VERB WRITES NOTHING. There is no `--record`, no `--execute`,
   no `--force` and no `--activate`. `readiness` reports whether a
   person MAY switch production operation on and never switches it
   on: that is a governance decision, protocol §24 reserves it to a
   person, and the one writer of such a decision is
   `agent/implement/ledger.mjs recordDecision`, which this directory
   neither imports nor mentions as a call.

   `readiness` EXITS 1 WHEN ANY MANDATORY CONDITION IS NOT PASSED,
   including one that could not be measured. SESSION 29's brief says
   to stop if a mandatory condition fails, and an exit code is the
   form of "stop" a pipeline can read.

   `--quick` SKIPS THE EXPENSIVE HALF and says so in the output: the
   suites, the adversarial gate and the browser come back
   `unmeasurable`, which blocks activation exactly as a failure does.
   It is for iterating on the cheap conditions, never for producing
   a readiness report somebody acts on.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';

import { SCHEDULE } from './schedule.mjs';
import { visualStandard, visualSummary } from './visual.mjs';
import { separations, separationSummary, controlPlaneClear } from './separations.mjs';
import { traceability } from './traceability.mjs';
import { CONDITIONS, DOMAINS, gatherFacts, evaluate, assessActivation } from './readiness.mjs';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--')) ?? 'readiness';
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const out = (s = '') => process.stdout.write(`${s}\n`);
const rule = () => out(`  ${'─'.repeat(72)}`);
const wrap = (s, indent = 0) => String(s ?? '').replace(/\s+/g, ' ').trim()
  .replace(new RegExp(`(?![^\\n]{1,${Math.max(20, 92 - indent)}}$)([^\\n]{1,${Math.max(20, 92 - indent)}})\\s`, 'g'), `$1\n${' '.repeat(indent)}`);

const asJson = has('--json');
const asOf = valueOf('--as-of') ?? new Date().toISOString().slice(0, 10);

const MARK = { pass: '·', fail: '✗', unmeasurable: '?' };

/* ------------------------------------------------------ schedule */
if (command === 'schedule') {
  if (asJson) { out(JSON.stringify(SCHEDULE, null, 2)); process.exit(0); }
  out();
  out('  THE OPERATING SCHEDULE. Nothing here fires on a timer: this declares the ORDER and');
  out('  the OWNERSHIP, and every stage states what it cannot establish.');
  out();
  out('  THE DAILY CYCLE');
  for (const s of SCHEDULE.daily) {
    out(`  ${String(s.order)}. ${s.name}   [${s.kind}]   ${s.owner}`);
    out(`     runs      ${s.runs}`);
    out(`     produces  ${s.produces}`);
    out(`     CANNOT    ${wrap(s.cannot, 15)}`);
    out(`     doc       ${s.doc}`);
    out();
  }
  out(`  The cycle's terminal stage is a HUMAN stage, and schedule.mjs refuses to load one that`);
  out('  is not — the same refusal agent/orchestrator/workflows.mjs applies to its ten types.');
  out();
  rule();
  for (const [label, rows] of [['WEEKLY', SCHEDULE.weekly], ['MONTHLY', SCHEDULE.monthly]]) {
    out(`  ${label} — ${rows.length} review(s). None of them produces a decision.`);
    for (const r of rows) {
      out(`    ${r.name}`);
      out(`      runs   ${r.runs}`);
      out(`      then   ${wrap(r.human_step, 14)}`);
    }
    out();
  }
  process.exit(0);
}

/* -------------------------------------------------------- visual */
if (command === 'visual') {
  let browser = null;
  const bp = valueOf('--browser-json');
  if (bp && existsSync(bp)) { try { browser = JSON.parse(readFileSync(bp, 'utf8')); } catch { browser = null; } }
  const rows = visualStandard({ browser });
  const sum = visualSummary(rows);
  if (asJson) { out(JSON.stringify({ rows, summary: sum }, null, 2)); process.exit(sum.fail ? 1 : 0); }
  out();
  out('  THE FINAL VISUAL STANDARD — the ten conditions SESSION 29 sets on the hidden entry,');
  out('  measured against js/threshold.js and style.css. Two are settled only in their');
  out('  mechanical half and say so.');
  out();
  for (const r of rows) {
    out(`  ${MARK[r.state]} ${r.criterion}  ${r.name.toUpperCase()}`);
    out(`      ${wrap(r.evidence, 6)}`);
    if (r.bound) out(`      BOUND: ${wrap(r.bound, 13)}`);
    out();
  }
  rule();
  out(`  ${sum.pass} pass · ${sum.fail} fail · ${sum.unmeasurable} unmeasurable, of ${sum.total}.`);
  if (sum.unmeasurable) out('  Supply --browser-json <file> from node agent/browser/cli.mjs --json to settle the rest.');
  out('  No contrast was computed, no screen reader was run, and no pixels were compared.');
  out();
  process.exit(sum.fail ? 1 : 0);
}

/* --------------------------------------------------- separations */
if (command === 'separations') {
  const s = separations({});
  const sum = separationSummary(s);
  const cp = controlPlaneClear({});
  if (asJson) { out(JSON.stringify({ ...s, control_plane: cp, summary: sum }, null, 2)); process.exit(sum.held && cp.clear ? 0 : 1); }
  out();
  out('  DISCOVERY ≠ AUTHENTICATION ≠ AUTHORIZATION');
  out('  The hidden search combination MAY reveal, transition and route. It must NEVER');
  out('  authenticate, authorize, approve, execute, deploy or expose privileged data.');
  out();
  out('  WHAT IT MAY DO');
  for (const p of s.permissions) {
    out(`    ${p.held ? '·' : '✗'} ${p.name}`);
    out(`        ${wrap(p.evidence, 8)}`);
  }
  out();
  out('  WHAT IT MUST NEVER DO');
  for (const p of s.prohibitions) {
    out(`    ${p.held ? '·' : '✗'} never ${p.name}`);
    out(`        ${wrap(p.evidence, 8)}`);
    if (p.bound) out(`        BOUND: ${wrap(p.bound, 15)}`);
  }
  out();
  rule();
  out('  THE CONTROL PLANE ITSELF');
  out(`    ${cp.clear ? '·' : '✗'} ${wrap(cp.why, 6)}`);
  out();
  out('  THE PHRASE, EVERYWHERE ELSE IN THE TREE');
  out('  Two independent halves: where the occurrence SITS, and whether the file can grant');
  out('  anything at all. agent/policy/verify/ HE-04 reports the first half\'s subject as a');
  out('  CRITICAL and could not check the condition its own finding names. This can.');
  out();
  for (const o of s.occurrences) {
    out(`    [${o.verdict}] ${o.file}`);
    out(`        ${wrap(o.why, 8)}`);
    for (const oc of o.occurrences) out(`        ${String(oc.line).padStart(5)}  ${oc.position.padEnd(17)} ${oc.excerpt.slice(0, 60)}`);
    out();
  }
  rule();
  out(`  ${sum.prohibitions_held}/${sum.prohibitions_total} prohibitions hold · ${sum.permissions_available}/3 permissions available`);
  out(`  ${sum.cleared_files.length} file(s) cleared · ${sum.no_path_found_files.length} with a capability and no path found · ${sum.read_it_files.length} needing a read`);
  out(`  ${sum.password_fields.length} published page(s) carry a password field`);
  out();
  out('  WHAT THIS DOES NOT PROVE');
  out('    · A path not found is not a path proven absent. The classifier is lexical.');
  out('    · This reads the tree. agent/policy/verify/ attacks a running Control Room, and');
  out('      neither can establish what a deployment that DID declare an address would do.');
  out();
  process.exit(sum.held && cp.clear ? 0 : 1);
}

/* --------------------------------------------------------- trace */
if (command === 'trace') {
  const t = traceability({});
  if (asJson) { out(JSON.stringify(t, null, 2)); process.exit(t.untraceable.length ? 1 : 0); }
  out();
  out('  EVERY WAY THE WEBSITE CAN CHANGE, AND WHAT EACH LEAVES BEHIND');
  out('  Traceable means: a durable record — one that survives a fresh clone — names the');
  out('  evidence that justified the change.');
  out();
  for (const p of t.write_paths) {
    out(`  ${p.traceable ? '·' : '✗'} ${p.id}  [${p.automatic ? 'automatic' : 'human'}]`);
    out(`      ${wrap(p.what, 6)}`);
    out(`      RECORD    ${p.durable_record}`);
    out(`      EVIDENCE  ${wrap(p.evidence, 16)}`);
    if (p.bound) out(`      BOUND     ${wrap(p.bound, 16)}`);
    out();
  }
  rule();
  out('  THE RUN STORES — an ignore rule is not a boundary, and an untracked store is not a record.');
  for (const s of t.stores) {
    out(`    ${s.durable ? '·' : '✗'} ${s.store.padEnd(32)} ${wrap(s.why, 8)}`);
  }
  out();
  const i = t.instrumentation;
  if (i.measurable) {
    out(`  INSTRUMENTATION  ${i.instrumented} of ${i.total} agent CLIs open a run on the tracer.`);
    if (i.uninstrumented.length) out(`    not instrumented: ${i.uninstrumented.join(', ')}`);
  }
  out();
  out(`  ${t.website_changing_traceable} of ${t.website_changing_paths} website-changing write paths are traceable.`);
  if (t.untraceable.length) out(`  Not traceable: ${t.untraceable.join(', ')}`);
  out();
  process.exit(t.untraceable.length ? 1 : 0);
}

/* ----------------------------------------------------- readiness */
if (command === 'readiness') {
  const quick = has('--quick');
  let browserResult = null;
  const bp = valueOf('--browser-json');
  if (bp && existsSync(bp)) { try { browserResult = JSON.parse(readFileSync(bp, 'utf8')); } catch { browserResult = null; } }

  const facts = await gatherFacts({
    asOf,
    validators: !quick,
    suites: !quick,
    adversarial: !quick,
    browser: !quick && !browserResult,
    browserResult,
  });
  if (browserResult && !facts.browser) {
    const failures = (browserResult.failed ?? []).map((c) => c.id ?? c.name);
    facts.browser = {
      ran: true,
      exit_code: browserResult.qa_check?.exit_code ?? (browserResult.verdict === 'fail' || failures.length ? 1 : 0),
      failures,
    };
  }

  const rows = evaluate(facts);
  const verdict = assessActivation(rows);

  if (asJson) {
    out(JSON.stringify({ as_of: asOf, quick, conditions: rows, verdict }, null, 2));
    process.exit(verdict.state === 'may_activate' ? 0 : 1);
  }

  out();
  out('  PRODUCTION READINESS CHECKLIST');
  out(`  as of ${asOf}${quick ? '   ·   --quick: the suites, the adversarial gate and the browser did NOT run' : ''}`);
  out('  A mandatory condition that could not be MEASURED blocks activation exactly as a');
  out('  failure does. In production there is nobody reading "skipped".');
  out();

  for (const d of DOMAINS) {
    const inDomain = rows.filter((r) => r.domain === d);
    if (!inDomain.length) continue;
    out(`  ${d.toUpperCase()}`);
    for (const r of inDomain) {
      out(`    ${MARK[r.state]} ${r.id}${r.mandatory ? '' : '   (advisory)'}`);
      out(`        Q: ${wrap(r.question, 11)}`);
      out(`        ${wrap(r.evidence, 8)}`);
      if (r.bound) out(`        BOUND: ${wrap(r.bound, 15)}`);
    }
    out();
  }

  rule();
  out();
  if (verdict.state === 'may_activate') {
    out('  EVERY MANDATORY CONDITION PASSES.');
    out(`  ${verdict.mandatory_passed} of ${verdict.mandatory_total}. A person may now take the decision to activate production operation.`);
    out('  This command has not taken it and cannot: switching a production mode on is a');
    out('  governance decision, protocol §24 reserves it to a person, and the one writer of');
    out('  such a decision is agent/implement/ledger.mjs recordDecision, which this directory');
    out('  neither imports nor calls.');
  } else {
    out('  PRODUCTION OPERATION IS NOT ACTIVATED, AND THIS IS THE STOP.');
    out(`  ${verdict.mandatory_passed} of ${verdict.mandatory_total} mandatory conditions pass. ${verdict.blocking.length} block:`);
    out();
    for (const b of verdict.blocking) {
      out(`    ${MARK[b.state]} ${b.domain} · ${b.id}`);
      out(`        ${wrap(b.evidence, 8)}`);
    }
  }
  out();
  if (verdict.advisory_failing.length) {
    out(`  Advisory, not blocking: ${verdict.advisory_failing.join(', ')}`);
    out();
  }
  out('  BY DOMAIN — never summed. The domains fail differently and a mean says none of it.');
  for (const d of verdict.by_domain) {
    if (!d.pass && !d.fail && !d.unmeasurable) continue;
    out(`    ${d.domain.padEnd(14)} ${String(d.pass).padStart(2)} pass · ${String(d.fail).padStart(2)} fail · ${String(d.unmeasurable).padStart(2)} unmeasurable`);
  }
  out();
  out('  There is no readiness score, and this report does not compute one.');
  out('  Nothing in data/, i18n/, js/, css/ or any page was read for truth or changed.');
  out();
  process.exit(verdict.state === 'may_activate' ? 0 : 1);
}

out();
out(`  unknown command "${command}".`);
out('  readiness · schedule · visual · separations · trace');
out();
process.exit(2);
