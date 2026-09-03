#!/usr/bin/env node
/* ============================================================
   agent/health/cli.mjs — Agent 10, the Website Health Monitor

     node agent/health/cli.mjs --as-of YYYY-MM-DD
     node agent/health/cli.mjs --as-of YYYY-MM-DD --domain knowledge
     node agent/health/cli.mjs --as-of YYYY-MM-DD --detail
     node agent/health/cli.mjs --as-of YYYY-MM-DD --metrics       # the register
     node agent/health/cli.mjs --as-of YYYY-MM-DD --public        # the public subset
     node agent/health/cli.mjs --as-of YYYY-MM-DD --publish <path>
     node agent/health/cli.mjs --as-of YYYY-MM-DD --history
     node agent/health/cli.mjs --as-of YYYY-MM-DD --series <metric-id>
     node agent/health/cli.mjs --as-of YYYY-MM-DD --json
     node agent/health/cli.mjs --as-of YYYY-MM-DD --no-browser --no-probe --no-record

   --as-of IS REQUIRED. A health report with no date cannot be told
   from a stale one, and freshness.mjs takes a date
   (docs/AUDIT-2026-09-01.md F-15).

   THREE DOMAINS, PRINTED SEPARATELY, WITH NO TOTAL. There is no
   overall score anywhere in this output. `model.mjs overallScore()`
   throws if anybody reaches for one, and the reasoning is printed at
   the foot of every full report rather than left in a document.

   EXIT CODES:
     0  the run completed. Findings are printed; findings are not
        failures, because most of this is a report on a system whose
        open questions are deliberate.
     1  the run threw, the repository changed during it, or the
        public subset leaked a private metric.

   The last of those is the one worth knowing: a leak is not a
   finding to be read later, it is a failure of the boundary SESSION
   20 exists to enforce, and it stops the run.
   ============================================================ */

import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { HealthMonitor, HEALTH_AGENT } from './monitor.mjs';
import { ALL_METRICS, byDomain, publicMetrics, privateMetrics } from './metrics.mjs';
import { DOMAINS, DOMAIN_LABEL, DOMAIN_STAKE, NOT_A_SCORE_METRICS, REQUIRED_FIELDS } from './model.mjs';
import { read as readHistory, series, writePublic, historyPath } from './history.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const out = (s = '') => process.stdout.write(`${s}\n`);
const asOf = valueOf('--as-of');
const onlyDomain = valueOf('--domain');
const seriesId = valueOf('--series');
const publishTo = valueOf('--publish');

/* ---------------------------------------------------------- the register */

if (has('--metrics')) {
  out();
  out(`  THE METRIC REGISTER — ${ALL_METRICS.length} metrics across ${DOMAINS.length} domains`);
  out();
  out(`  Every metric declares all ${REQUIRED_FIELDS.length} fields below. agent/health/model.mjs refuses one that omits any.`);
  out(`  ${REQUIRED_FIELDS.join(' · ')}`);
  out();
  for (const d of DOMAINS) {
    out(`  ${DOMAIN_LABEL[d]}`);
    out(`  ${DOMAIN_STAKE[d]}`);
    out();
    for (const m of byDomain(d)) {
      out(`    ${m.id}`);
      out(`      ${m.name}   [${m.visibility}] [${m.direction}] [${m.frequency}]`);
      out(`      DEFINITION   ${wrap(m.definition, 6)}`);
      out(`      SOURCE       ${wrap(m.source, 6)}`);
      out(`      CALCULATION  ${wrap(m.calculation, 6)}`);
      out(`      MEANS        ${wrap(m.interpretation, 6)}`);
      out(`      CANNOT SAY   ${wrap(m.limitations, 6)}`);
      if (m.public_justification) out(`      PUBLIC WHY   ${wrap(m.public_justification, 6)}`);
      out();
    }
  }
  out(`  ${NOT_A_SCORE_METRICS.length} metrics are marked not_a_score. Their numbers must NOT be optimised:`);
  for (const id of NOT_A_SCORE_METRICS) out(`    · ${id}`);
  out('  The only legitimate way to move any of them is work this monitor cannot see or do.');
  out();
  process.exit(0);
}

if (!asOf) {
  out('  --as-of YYYY-MM-DD is required. A health report with no date cannot be told from a');
  out('  stale one (docs/AUDIT-2026-09-01.md F-15), and freshness.mjs takes a date.');
  out();
  out('  node agent/health/cli.mjs --metrics   prints the register without running anything.');
  process.exit(1);
}

/* ---------------------------------------------------------- history views */

if (has('--history') && !has('--json')) {
  const h = readHistory();
  out();
  out(`  HISTORICAL HEALTH RECORD — ${h.entries.length} entr(ies)`);
  out(`  ${h.path}`);
  out();
  if (h.malformed.length) {
    out(`  ${h.malformed.length} LINE(S) DO NOT PARSE — reported rather than skipped:`);
    for (const m of h.malformed) out(`    line ${m.line}: ${m.why}`);
    out();
  }
  for (const e of h.entries.slice(-20)) {
    const measured = e.readings.filter((r) => r.state === 'measured').length;
    const findings = e.readings.filter((r) => r.state === 'measured' && r.direction === 'lower_is_better' && r.value > 0).length;
    out(`  ${e.recorded_at}  as of ${e.as_of}  ${String(e.commit ?? '').slice(0, 8)}  ${measured} measured · ${findings} with findings · browser ${e.coverage?.browser_run ? 'ran' : 'did not run'}`);
  }
  if (!h.entries.length) out('  No entries yet. Run the monitor without --no-record.');
  out();
  process.exit(0);
}

if (seriesId) {
  const s = series(seriesId);
  out();
  out(`  SERIES — ${seriesId}`);
  out();
  if (!s.length) { out('  no entries in the history carry this metric.'); out(); process.exit(0); }
  for (const p of s) out(`  ${p.at}  ${String(p.commit ?? '').slice(0, 8)}  ${p.state.padEnd(15)} ${p.value === null ? '—' : p.value} ${p.unit ?? ''}`);
  out();
  out('  A movement is not automatically an improvement. Read the metric\'s interpretation:');
  out(`  node agent/health/cli.mjs --metrics | grep -A6 "${seriesId}"`);
  out();
  process.exit(0);
}

/* ---------------------------------------------------------- the run */

const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: HEALTH_AGENT } });
const monitor = new HealthMonitor({
  tracer,
  asOf,
  browser: !has('--no-browser'),
  quick: has('--quick'),
  validators: !has('--no-validators'),
  probe: !has('--no-probe'),
  record: !has('--no-record'),
});

if (!has('--json')) {
  out();
  out('  WEBSITE HEALTH MONITOR — three domains, measured separately and never summed');
  out(`  as of ${asOf}${has('--no-browser') ? ' · no browser' : ''}${has('--no-probe') ? ' · no loopback probe' : ''}${has('--no-record') ? ' · not recorded to history' : ''}`);
  out();
}

let r;
try {
  r = await monitor.run();
} catch (err) {
  out(`  the run failed: ${err.message}`);
  if (process.env.HEALTH_DEBUG) out(err.stack);
  process.exit(1);
}

if (has('--json')) {
  out(JSON.stringify({
    as_of: r.as_of,
    trace_id: r.trace_id,
    summary: r.summary,
    readings: r.readings.map(({ metric, reading }) => ({ id: metric.id, domain: metric.domain, visibility: metric.visibility, direction: metric.direction, ...reading })),
    public_view: r.public_view,
    movement: r.movement,
    leaked: r.leaked,
    tree_unchanged: r.tree_unchanged,
  }, null, 2));
} else if (has('--public')) {
  out(JSON.stringify(r.public_view, null, 2));
} else {
  for (const d of DOMAINS) {
    if (onlyDomain && d !== onlyDomain) continue;
    const s = r.summary[d];
    out(`  ${DOMAIN_LABEL[d]}`);
    out(`  ${wrap(s.stake, 2)}`);
    out(`  ${s.metrics} metric(s) · ${s.measured} measured · ${s.unmeasurable} unmeasurable · ${s.not_applicable} not applicable · ${s.not_a_score} not a score`);
    out();
    for (const { metric, reading } of r.readings.filter((x) => x.metric.domain === d)) {
      const mark = reading.state !== 'measured' ? '?'
        : metric.direction === 'not_a_score' ? '='
          : (metric.direction === 'lower_is_better' ? reading.value > 0 : reading.value < 100) ? '!' : '·';
      const value = reading.state === 'measured'
        ? `${reading.value}${reading.unit ? ` ${reading.unit}` : ''}${reading.of !== null && reading.of !== undefined ? ` of ${reading.of}` : ''}`
        : reading.state.toUpperCase();
      out(`  ${mark} ${metric.name.padEnd(46)} ${value}`);
      if (metric.visibility === 'private') out(`      ${''.padEnd(46)} (private)`);
      if (reading.state !== 'measured') {
        out(`      WHY    ${wrap(reading.why, 6)}`);
        if (reading.needs) out(`      NEEDS  ${wrap(reading.needs, 6)}`);
      }
      if (has('--detail')) {
        out(`      MEANS  ${wrap(metric.interpretation, 6)}`);
        out(`      CANNOT ${wrap(metric.limitations, 6)}`);
        if (reading.detail) out(`      DETAIL ${wrap(JSON.stringify(reading.detail), 6, 140)}`);
      }
    }
    out();
  }

  out('  LEGEND   !  a finding   ·  nothing found   =  not a score, do not optimise   ?  not measured');
  out();

  if (r.movement.comparable) {
    out(`  MOVEMENT since ${r.movement.since}`);
    for (const c of r.movement.changes) out(`    ${c.id.padEnd(52)} ${c.was} → ${c.now}  (${c.delta > 0 ? '+' : ''}${c.delta} ${c.unit ?? ''})`);
    for (const c of r.movement.not_a_score_changes) out(`  = ${c.id.padEnd(52)} ${c.was} → ${c.now}  — NOT A SCORE. Read the commit, not the direction.`);
    for (const c of r.movement.coverage_changes) out(`  ? ${c.id.padEnd(52)} ${c.kind}${c.was ? ` (was ${c.was}, now ${c.now})` : ''}`);
    for (const n of r.movement.coverage_note ?? []) out(`    NOTE: ${wrap(n, 4)}`);
    if (!r.movement.changes.length && !r.movement.not_a_score_changes.length && !r.movement.coverage_changes.length) out('    nothing moved.');
  } else {
    out(`  MOVEMENT  ${r.movement.why}`);
  }
  out();

  const pubCount = Object.values(r.public_view.domains).reduce((n, x) => n + x.metrics.length, 0);
  out(`  PUBLIC SUBSET  ${pubCount} metric(s) publishable · ${privateMetrics().length} withheld · ${r.leaked.length} leaked`);
  if (r.leaked.length) {
    out('  THE PUBLIC SUBSET LEAKS A PRIVATE METRIC. This is a boundary failure, not a finding.');
    for (const id of r.leaked) out(`    ✗ ${id}`);
  } else {
    out('  Visibility is a whitelist. A control-plane metric can only be public with a written');
    out('  justification, and a public reading carries no detail, no evidence and no paths.');
  }
  out();

  out(`  ${r.readings.length} metrics · trace ${r.trace_id}`);
  out(has('--no-record') ? '  not recorded to history (--no-record)' : `  recorded to ${historyPath()}`);
  out();
  out(r.tree_unchanged
    ? '  The repository is byte-identical to before this run. A monitor that altered what it'
      + '\n  measures would be the least trustworthy thing in the system.'
    : `  THE REPOSITORY CHANGED DURING THIS RUN: ${r.changed_paths.join(', ')}. Treat every reading as suspect.`);
  out();
  out('  THERE IS NO OVERALL SCORE. The three domains answer different questions with different');
  out('  consequences — a broken link costs a reader a click, a false statement about EU law costs');
  out('  them a decision they cannot take back, and an unaudited approval costs the system its');
  out('  provenance and is invisible to every reader. A mean of the three says none of that.');
  out();
}

if (publishTo) {
  const path = writePublic(r.public_view, publishTo);
  if (!has('--json')) {
    out(`  Wrote the public-safe subset to ${path}.`);
    out('  Publishing is a decision: nothing writes this by default, and this file carries counts');
    out('  only — no paths, no proposal ids, no trace ids, no evidence.');
    out();
  }
}

process.exitCode = (!r.tree_unchanged || r.leaked.length) ? 1 : 0;

/** Soft-wrap under a hanging indent. */
function wrap(text, indent, width = 92) {
  const pad = ' '.repeat(indent + 7);
  const words = String(text ?? '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join(`\n${pad}`);
}
