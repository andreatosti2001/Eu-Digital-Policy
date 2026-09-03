#!/usr/bin/env node
/* ============================================================
   agent/browser/cli.mjs — SESSION 19's browser regression suite

     node agent/browser/cli.mjs
     node agent/browser/cli.mjs --quick
     node agent/browser/cli.mjs --only search,dialogs
     node agent/browser/cli.mjs --json
     node agent/browser/cli.mjs --require-browser
     node agent/browser/cli.mjs --propose --as-of YYYY-MM-DD [--dry]

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

   --propose IS NOT PART OF THE SUITE, and it is a separate flag for
   that reason. The suite MEASURES; `agent/browser/proposals.mjs`
   turns a measured FAILURE into an `ImplementationProposal` and the
   `ApprovalRequest` that asks a human to decide it. Nothing is
   applied and nothing is approved: the records go to
   `agent/records/`, which is agent-written and git-ignored, and
   `docs/IMPLEMENTATION-QA.md` §3 is explicit that an ApprovalRequest
   found there is a REQUEST whatever its state says. A grant exists
   only in `agent/implement/decisions/decisions.jsonl` and only a
   person writes one.

   THIS SUITE OPENS PAGES. It is the first thing in this repository
   that does. It starts a local server on an ephemeral port, opens a
   headless browser against 127.0.0.1, reads the rendered DOM, and
   closes both. It writes nothing: the repository is hashed before and
   after and the run reports whether it changed.
   ============================================================ */

import { runBrowserQA, asQACheck } from './runner.mjs';
import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { RecordStore, MemoryRecordStore } from '../scout/store.mjs';
import { IdMinter } from '../schemas/identity.mjs';
import { emit } from '../schemas/gateway.mjs';
import { isoOf } from '../observability/ids.mjs';
import { proposalsForRun, BROWSER_QA_AGENT } from './proposals.mjs';

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
const propose = has('--propose');
const dry = has('--dry');
const asOf = valueOf('--as-of');
const only = (valueOf('--only') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

if (propose && !asOf) {
  out('  --propose needs --as-of YYYY-MM-DD. A proposal about a rendered page carries no date of its');
  out('  own — derived output here depends on the reader\'s clock (docs/AUDIT-2026-09-01.md F-15) — and');
  out('  a report with no date cannot be told from a stale one.');
  process.exit(1);
}

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

/* ---------------------------------------------------------- --propose

   Only failures become proposals, and only failures with a recipe.
   A passing check mints nothing, so a proposal for a defect that is
   no longer measured cannot exist; a failure with no recipe is
   refused BY NAME rather than dropped. Nothing here approves
   anything. */

if (propose) {
  const store = dry ? new MemoryRecordStore({ allowSimulated: false }) : new RecordStore({ allowSimulated: false });
  const tracer = new Tracer({
    service: 'eu-digital-policy',
    sink: new JsonlSink(),
    attributes: { agent: BROWSER_QA_AGENT },
  });
  const ids = new IdMinter();
  const traceRun = tracer.startRun({
    kind: 'agent',
    agent: BROWSER_QA_AGENT,
    task: 'turn the browser suite\'s measured failures into proposals a human can decide',
  });
  const span = traceRun.startAgent({ agent: BROWSER_QA_AGENT, task: `propose for the failures measured as of ${asOf}` });
  const ctx = {
    now: () => isoOf(tracer.clock.now()),
    ids,
    simulated: false,
    ship: (sp, record, derived_from = []) => {
      emit(sp, record, { allowSimulated: false, derived_from });
      store.write(record);
      return record;
    },
  };

  const r = proposalsForRun({ run, ctx, span });

  span.end({ status: 'ok', outputs: { proposals: r.proposals.length, refused: r.refused.length } });
  traceRun.end({
    status: 'ok',
    outputs: { considered: r.considered, proposals: r.proposals.length, refused: r.refused.length },
    confidence: 1,
    risk: 'low',
  });

  if (!json) {
    out(`  PROPOSALS — as of ${asOf}${dry ? ' · dry run, nothing stored' : ''}`);
    out();
    out(`  ${r.considered} measured failure(s) considered · ${r.proposals.length} proposal(s) · ${r.refused.length} refusal(s)`);
    out();
    for (const p of r.proposals) {
      out(`  ${p.proposal_id}`);
      out(`      CHANGE     ${p.proposed_change.summary}`);
      out(`      FILES      ${p.files.join(', ')}`);
      out(`      OPS        ${p.proposed_change.operations.length} · ${p.autonomy_class} · risk ${p.risk} · confidence ${p.confidence}`);
      out(`      BLOCKING   ${p.epistemic.unresolved.filter((u) => u.blocks).length} open question(s) that block`);
      out();
    }
    for (const f of r.refused) {
      out(`  NO PROPOSAL — ${f.what}  [${f.stage}]`);
      out(`      ${f.reason}`);
      out();
    }
    out('  Nothing here is an approval. These records are in agent/records/, which agents write and git');
    out('  ignores. A grant lives only in agent/implement/decisions/decisions.jsonl, is written by');
    out('  `node agent/implement/cli.mjs decide --proposal <id> --grant --by "<person>"`, requires a');
    out('  named human who is not an agent, and is bound to the sha256 of the proposal it decided.');
    out();
    out('  Next:  node agent/implement/cli.mjs queue --why');
    out('         node agent/implement/cli.mjs preflight --proposal <id>');
    out();
  }
}

process.exitCode = run.status === 'skipped'
  ? (has('--require-browser') ? 1 : 2)
  : (run.verdict === 'fail' || !run.treeUnchanged ? 1 : 0);
