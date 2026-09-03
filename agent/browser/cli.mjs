#!/usr/bin/env node
/* ============================================================
   agent/browser/cli.mjs — SESSION 19's browser regression suite

     node agent/browser/cli.mjs
     node agent/browser/cli.mjs --quick
     node agent/browser/cli.mjs --only search,dialogs
     node agent/browser/cli.mjs --json
     node agent/browser/cli.mjs --require-browser

   EXIT CODES, and the one that matters:

     0  every check passed, or passed with an undecidable named
     1  a check failed, or the run threw
     2  no browser was found — the suite did NOT run

   2 rather than 0 is the whole design. A suite that exits 0 when it
   could not open a browser teaches a CI pipeline that green means
   checked, and this repository has spent four sessions arguing that
   an absence of knowledge must never be rendered as a negative
   finding (docs/AI-SAFE-BOUNDARIES.md §0.5). `--require-browser`
   turns that 2 into a hard 1 for a pipeline that wants no ambiguity
   at all.

   THIS SUITE OPENS PAGES. It is the first thing in this repository
   that does. It starts a local server on an ephemeral port, opens a
   headless browser against 127.0.0.1, reads the rendered DOM, and
   closes both. It writes nothing: the repository is hashed before and
   after and the run reports whether it changed.
   ============================================================ */

import { runBrowserQA, asQACheck } from './runner.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const out = (s = '') => process.stdout.write(`${s}\n`);
const json = has('--json');
const only = (valueOf('--only') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const run = await runBrowserQA({
  only: only.length ? only : null,
  quick: has('--quick'),
});

if (json) {
  out(JSON.stringify({ ...run, failure: run.failure ? String(run.failure.message) : null, qa_check: asQACheck(run) }, null, 2));
} else {
  out();
  out('  BROWSER QA — the first thing in this repository that opens a page');
  if (run.status === 'skipped') {
    out();
    out('  SKIPPED. The suite did not run, and this is not a pass.');
    out();
    out(`  ${run.skipReason}`);
    out();
    out('  Looked in:');
    for (const p of run.lookedIn ?? []) out(`    · ${p}`);
    out();
    out('  agent/implement/ treats a skipped browser run as a BLOCKING finding wherever a');
    out('  proposal required browser QA. It does not treat it as a pass, and neither should you.');
    out();
  } else {
    out(`  ${run.browser.version} · ${run.origin} · ${run.requests} request(s)`);
    out();

    const byArea = {};
    for (const r of [...run.failed, ...run.undecided]) (byArea[r.area] ??= []).push(r);

    out(`  ${run.counts.pass} pass · ${run.counts.fail} fail · ${run.counts.undecidable} undecidable · ${run.counts.total} check(s) across ${Object.keys(run.areas).length} area(s)`);
    out();
    for (const [area, n] of Object.entries(run.areas).sort()) {
      const f = (byArea[area] ?? []).filter((r) => r.status === 'fail').length;
      const u = (byArea[area] ?? []).filter((r) => r.status === 'undecidable').length;
      out(`    ${area.padEnd(16)} ${String(n).padStart(3)} check(s)${f ? `   ${f} FAILED` : ''}${u ? `   ${u} undecidable` : ''}`);
    }
    out();

    if (run.failed.length) {
      out('  FAILURES');
      for (const f of run.failed) {
        out(`    ✗ ${f.id}`);
        out(`      ${f.summary}`);
        if (f.data && Object.keys(f.data).length) out(`      ${JSON.stringify(f.data).slice(0, 240)}`);
      }
      out();
    }

    if (run.undecided.length) {
      out('  UNDECIDABLE — established neither a defect nor its absence, and reported as neither');
      for (const f of run.undecided) {
        out(`    ? ${f.id}   ${f.summary}`);
        out(`      ${f.why}`);
      }
      out();
    }

    if (run.failure) {
      out(`  THE RUN THREW: ${run.failure.message}`);
      out();
    }

    out(run.treeUnchanged
      ? '  The repository is byte-identical to before this run. Nothing was written; no page was changed.'
      : `  THE REPOSITORY CHANGED DURING THIS RUN: ${(run.changedPaths ?? []).join(', ')}. This suite has no code path that writes anywhere — treat the result as suspect.`);
    out('  No contrast was computed, no screen reader was run, and no pixels were compared. README limitation 7 stands.');
    out();
  }
}

process.exitCode = run.status === 'skipped'
  ? (has('--require-browser') ? 1 : 2)
  : (run.verdict === 'fail' || !run.treeUnchanged ? 1 : 0);
