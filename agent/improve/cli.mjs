#!/usr/bin/env node
/* ============================================================
   agent/improve/cli.mjs — the continuous improvement loop, from a
   terminal

     node agent/improve/cli.mjs cycle --as-of YYYY-MM-DD [--record] [--store]
     node agent/improve/cli.mjs observers        the register, runs nothing
     node agent/improve/cli.mjs reach            what limited autonomy can reach
     node agent/improve/cli.mjs history          every recorded cycle, and the movement between them

   `cycle` WITHOUT `--record` WRITES NOTHING. The cycle ledger is
   git-tracked, so appending to it is a change to the repository, and
   a run that made that change by default would have taken a commit
   decision once for everybody. `--store` is the second opt-in write
   and it goes to `agent/records/`, which is git-ignored run state.
   Neither touches data/, i18n/, js/, css/ or any page, and there is
   no flag here that can.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink, MemorySink } from '../observability/sink.mjs';
import { OBSERVERS } from './observe.mjs';
import { reach } from './reach.mjs';
import { runImprovementCycle, IMPROVE_AGENT } from './cycle.mjs';
import { readCycles, previousCycle, cycleLedgerPath } from './ledger.mjs';
import { movement } from './movement.mjs';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--')) ?? 'cycle';
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const out = (s = '') => process.stdout.write(`${s}\n`);
const wrap = (s, indent = 0) => String(s ?? '').replace(/\s+/g, ' ').trim()
  .replace(new RegExp(`(?![^\\n]{1,${Math.max(20, 94 - indent)}}$)([^\\n]{1,${Math.max(20, 94 - indent)}})\\s`, 'g'), `$1\n${' '.repeat(indent)}`);

const asJson = has('--json');

/* ---------------------------------------------------- observers */
if (command === 'observers') {
  if (asJson) { out(JSON.stringify(OBSERVERS, null, 2)); process.exit(0); }
  out();
  out('  THE OBSERVERS — what one cycle looks at, and what each of them cannot see.');
  out('  Nothing here runs. Every one of these already had a CLI; the loop runs them together.');
  out();
  for (const o of OBSERVERS) {
    out(`  ${o.id.padEnd(16)} ${o.kind.padEnd(9)} ${o.agent}`);
    out(`    READS        ${wrap(o.what_it_reads, 17)}`);
    out(`    CANNOT SEE   ${wrap(o.what_it_cannot_see, 17)}`);
    out(`    DOC          ${o.doc}`);
    out();
  }
  out(`  ${OBSERVERS.length} observer(s): ${OBSERVERS.filter((o) => o.kind === 'findings').length} produce identified findings, ${OBSERVERS.filter((o) => o.kind === 'signals').length} produce counts.`);
  out('  A count has no identity, so movement over one says which number changed and never which item did.');
  out();
  process.exit(0);
}

/* -------------------------------------------------------- reach */
if (command === 'reach') {
  const r = reach({});
  if (asJson) { out(JSON.stringify(r, null, 2)); process.exit(0); }
  out();
  out('  WHAT LIMITED AUTONOMY CAN ACTUALLY REACH — measured against this tree, not inferred.');
  out(`  policy ${r.policy_id}`);
  out(`  ${r.grants.length} grant(s) in force: ${r.grants.map((g) => `${g.grant_id} by ${g.decided_by} until ${String(g.expires_at).slice(0, 10)}`).join('; ') || 'none'}`);
  out();
  out('  PATHS');
  for (const p of r.paths) out(`    ${p.path.padEnd(24)} ${p.exists ? `${p.kind}, ${p.files} file(s)` : 'DOES NOT EXIST in this tree'}`);
  out();
  out('  FIELDS — a granted field naming something no record carries is a permission over nothing.');
  for (const d of r.datasets) {
    out(`    ${d.dataset}  ${d.records} record(s)`);
    for (const row of d.rows) {
      const mark = row.state === 'present' ? '·' : '←';
      out(`      ${mark} ${row.field.padEnd(18)} ${row.state.toUpperCase()}`);
      if (row.state !== 'present') out(`          ${wrap(row.why, 10)}`);
    }
  }
  out();
  out('  CATEGORIES');
  for (const c of r.categories) {
    out(`    ${c.category.padEnd(32)} ${c.state}`);
    out(`        ${wrap(c.why, 8)}`);
    if (c.also_requires) out(`        ALSO  ${wrap(c.also_requires, 14)}`);
  }
  out();
  out(`  ${wrap(r.summary, 2)}`);
  out();
  out('  This does NOT say a change would be permitted. Every one of agent/autonomy/\'s six gates and');
  out('  eight of preflight\'s ten still runs. It says whether there is anything there to write to.');
  out();
  process.exit(0);
}

/* ------------------------------------------------------ history */
if (command === 'history') {
  const { entries, malformed, path, exists } = readCycles({});
  if (asJson) { out(JSON.stringify({ entries, malformed, path, exists }, null, 2)); process.exit(0); }
  out();
  out('  RECORDED CYCLES — the git-tracked half of this loop, and the only part that survives a clone.');
  out(`  ${cycleLedgerPath()}`);
  out();
  if (!exists) {
    out('  The ledger does not exist yet. No cycle has been recorded.');
    out('  That is not the same fact as no cycle having been RUN: a run records only with --record.');
    out();
    process.exit(0);
  }
  if (!entries.length) out('  The ledger exists and holds no readable entry.');
  let prev = null;
  for (const e of entries) {
    const m = movement(e, prev);
    const ran = e.coverage.filter((c) => c.state === 'ran').length;
    out(`  ${e.cycle_id}   as of ${e.as_of}   recorded ${String(e.recorded_at).slice(0, 19)}Z`);
    out(`    ${e.findings.length} finding(s) · ${ran}/${e.coverage.length} observer(s) ran · ${e.signals.length} signal(s) · ${e.signals_withheld.length} withheld`);
    out(`    branch ${e.branch ?? '(unknown)'} · commit ${String(e.commit ?? '').slice(0, 8) || '(unknown)'}${e.session ? ` · ${e.session}` : ''}`);
    if (m.first_cycle) {
      out('    MOVEMENT  first recorded cycle — nothing to compare against, so nothing is new.');
    } else {
      out(`    MOVEMENT  ${m.summary.new} new · ${m.summary.persisting} persisting · ${m.summary.resolved} resolved · ${m.summary.undetermined} undetermined`);
      for (const i of m.summary.incomparable_observers) out(`              ${i.observer}: ${wrap(i.why, 14)}`);
    }
    out();
    prev = e;
  }
  for (const bad of malformed) out(`  MALFORMED line ${bad.line}: ${bad.why}`);
  out(`  ${entries.length} cycle(s) recorded.`);
  out();
  process.exit(0);
}

/* -------------------------------------------------------- cycle */
if (command !== 'cycle') {
  out(`  unknown command "${command}". The four are: cycle · observers · reach · history`);
  process.exit(1);
}

const asOf = valueOf('--as-of');
if (!asOf) {
  out();
  out('  --as-of YYYY-MM-DD is required. "Nothing has changed" and "nobody has looked" are different');
  out('  findings, and only a stated as-of date tells them apart (docs/AUDIT-2026-09-01.md F-15).');
  out();
  process.exit(1);
}

const only = (valueOf('--only') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const record = has('--record');
const store = has('--store');
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: has('--no-trace') ? new MemorySink() : new JsonlSink(),
  attributes: { agent: IMPROVE_AGENT },
});

out();
out('  CONTINUOUS IMPROVEMENT — one pass over the whole system, compared with the last recorded cycle.');
out(`  as of ${asOf}${only.length ? ` · only ${only.join(', ')}` : ''}${has('--no-validators') ? ' · validators skipped' : ''}`);
out(`  ${record ? 'RECORDING — one line will be appended to the git-tracked cycle ledger.' : 'Not recording. --record appends one line to the cycle ledger; without it this run writes nothing.'}`);
if (store) out('  STORING — the observed records will be written to agent/records/ for the autonomy runner.');
out();

try {
  const r = await runImprovementCycle({
    tracer, asOf, only: only.length ? only : null,
    validators: !has('--no-validators'),
    record, store,
    session: valueOf('--session'),
  });

  if (asJson) { out(JSON.stringify(r, null, 2)); process.exit(0); }

  /* ---- coverage first. A count read without it is a count read wrong. */
  out('  COVERAGE — an observer that did not run is not an observer that found nothing.');
  for (const c of r.observation.coverage) {
    out(`    ${c.observer.padEnd(16)} ${c.state.toUpperCase().padEnd(13)} ${c.findings === null ? (c.kind === 'signals' ? 'counts, not identified findings' : '') : `${c.findings} finding(s)`}`);
    if (c.why) out(`        ${wrap(c.why, 8)}`);
  }
  out();

  /* ---- movement */
  out('  MOVEMENT');
  if (r.movement.first_cycle) {
    out('    No previous cycle is recorded. Every finding is UNDETERMINED rather than new: "new" is a claim');
    out('    about a comparison, and there is nothing here to compare against.');
  } else {
    out(`    against ${r.movement.previous_cycle_id} (as of ${r.movement.previous_as_of})`);
    out(`    ${r.movement.summary.new} new · ${r.movement.summary.persisting} persisting · ${r.movement.summary.resolved} resolved · ${r.movement.summary.undetermined} undetermined`);
    out();
    for (const o of r.movement.by_observer) {
      out(`    ${o.observer.padEnd(16)} ${String(o.current).padStart(4)} now  ${String(o.previous).padStart(4)} before   ${o.comparable ? `+${o.new} / -${o.resolved}` : 'NOT COMPARABLE'}`);
      if (!o.comparable) out(`        ${wrap(o.why, 8)}`);
    }
  }
  out();

  out('  SIGNALS — a number with no better direction is marked, and never ranked.');
  for (const s of r.movement.signals) {
    out(`    ${s.signal_id.padEnd(34)} ${s.value === null ? 'NOT MEASURED' : String(s.value)} ${s.unit ?? ''}   [${s.direction}]`);
    out(`        ${wrap(s.reading, 8)}`);
  }
  out();

  /* ---- triage */
  out('  TRIAGE — which desk each record belongs at. This is not the gate ladder.');
  out(`    ${r.triage.eligible.length} referable to the autonomy runner`);
  out(`    ${r.triage.human.length} to a person`);
  out(`    ${r.triage.no_act.length} propose no act — a gap, a question or a finding, which is work and not a decision`);
  out();
  out('  BY DERIVED CATEGORY');
  for (const [cat, n] of Object.entries(r.triage.by_category).sort((a, b) => b[1] - a[1])) {
    out(`    ${cat.padEnd(34)} ${String(n).padStart(4)}`);
  }
  out();
  if (r.triage.eligible.length) {
    out('  REFERABLE TO THE AUTONOMY RUNNER — a referral, not a permission.');
    for (const e of r.triage.eligible.slice(0, 20)) {
      out(`    ${String(e.finding_id).padEnd(34)} ${e.category}`);
      out(`        ${wrap(e.why, 8)}`);
    }
    out();
    out('  Hand them over with:  node agent/improve/cli.mjs cycle --as-of <date> --store');
    out('                        node agent/autonomy/cli.mjs run --as-of <date>');
  } else {
    out('  NOTHING IS REFERABLE TO THE AUTONOMY RUNNER, and the reasons are per item above.');
    out('  node agent/improve/cli.mjs reach says whether the enabled categories have any surface at all.');
  }
  out();

  /* ---- the refusals, grouped, because 200 identical reasons is one reason */
  const reasons = new Map();
  for (const h of r.triage.human) {
    const key = h.category ?? '(no category)';
    if (!reasons.has(key)) reasons.set(key, { n: 0, why: h.why });
    reasons.get(key).n += 1;
  }
  if (reasons.size) {
    out('  WHY EACH GOES TO A PERSON — grouped, because two hundred identical reasons is one reason.');
    for (const [cat, v] of [...reasons].sort((a, b) => b[1].n - a[1].n)) {
      out(`    ${String(v.n).padStart(4)}  ${cat}`);
      out(`          ${wrap(v.why, 10)}`);
    }
    out();
  }

  out(`  trace ${r.trace_id}${r.recorded ? ` · recorded ${r.recorded.cycle_id}` : ''}${r.stored ? ` · ${r.stored.records} record(s) stored` : ''}`);
  if (r.entry.signals_withheld.length) {
    out(`  ${r.entry.signals_withheld.length} signal(s) withheld from the tracked ledger: ${r.entry.signals_withheld.map((w) => w.signal_id).join(', ')}`);
    out('    classified private by agent/health/model.mjs. This ledger is tracked and this tree is published.');
  }
  out();
  out('  WHAT THIS DOES NOT PROVE');
  for (const l of r.what_this_does_not_prove) out(`    · ${wrap(l, 6)}`);
  out();
  out('  Nothing in data/, i18n/, js/, css/ or any page was read for truth, opened in a browser, or changed.');
  out();
  process.exit(0);
} catch (e) {
  out();
  out(`  the cycle failed: ${e?.message ?? e}`);
  out();
  process.exit(1);
}
