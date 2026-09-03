#!/usr/bin/env node
/* ============================================================
   agent/ux/cli.mjs — Agent 8, the UX/UI Auditor

     node agent/ux/cli.mjs --as-of YYYY-MM-DD
     node agent/ux/cli.mjs --as-of YYYY-MM-DD --backlog
     node agent/ux/cli.mjs --as-of YYYY-MM-DD --question 6
     node agent/ux/cli.mjs --as-of YYYY-MM-DD --open
     node agent/ux/cli.mjs --as-of YYYY-MM-DD --aside
     node agent/ux/cli.mjs --as-of YYYY-MM-DD --propose
     node agent/ux/cli.mjs --as-of YYYY-MM-DD --dry

   --as-of is REQUIRED. "The interface has not changed" and "nobody
   has looked" are different findings, and only a stated date
   separates them (docs/AUDIT-2026-09-01.md F-15).

   --propose is SESSION 17: a testable proposal for every finding at
   critical or high, and for nothing else.

   --open prints the open questions, which are a deliverable rather
   than a shortfall: this agent produces more of them than findings,
   and each one carries the bytes it read and what would close it.

   NOTHING IS OPENED IN A BROWSER, no screen reader is run, and no
   contrast is computed. Every record says so, in a blocking open
   question quoting README limitation 7. An audit that implied
   otherwise would make this project's own honesty worse than
   whatever it found.

   Everything produced goes to agent/records/<trace_id>.jsonl and the
   trace to agent/observability/runs/<trace_id>.jsonl, both
   git-ignored. NOTHING IS WRITTEN TO data/, TO ANY PAGE OR TO ANY
   STYLESHEET, and every finding's operations carry a null
   `proposed`: this agent observes and proposes, and does not
   redesign the site.
   ============================================================ */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { RecordStore, MemoryRecordStore } from '../scout/store.mjs';
import { hashDataDir } from '../integrate/canonical.mjs';
import { readSurface, REPO_ROOT, SHEETS } from './surface.mjs';
import { LENSES } from './lenses.mjs';
import { UXAuditor, UX_AGENT } from './auditor.mjs';
import { isHighPriority } from './severity.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const out = (s = '') => process.stdout.write(`${s}\n`);
const dry = has('--dry');
const showBacklog = has('--backlog');
const showOpen = has('--open');
const showAside = has('--aside');
const propose = has('--propose');
const onlyQuestion = valueOf('--question');
const asOf = valueOf('--as-of');

if (!asOf) {
  out('  --as-of YYYY-MM-DD is required. A report on an interface without the date it was read as true');
  out('  at cannot be told from a stale one, and "the interface has not changed" and "nobody has looked"');
  out('  are different findings that only a stated date separates (docs/AUDIT-2026-09-01.md F-15).');
  process.exit(1);
}
if (onlyQuestion && !LENSES.some((l) => String(l.question) === String(onlyQuestion))) {
  out(`  unknown question "${onlyQuestion}". The ten are:`);
  for (const l of LENSES) out(`    ${l.question}  ${l.asks}`);
  process.exit(1);
}

/** The interface's own fingerprint, taken before and after. `data/`
 *  is hashed by every agent here; this one additionally hashes every
 *  page and every stylesheet, because it is the first agent whose
 *  SUBJECT is those files and "it changed nothing" is the claim it
 *  most needs to be able to prove. */
function hashInterface() {
  const files = [
    ...readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html')),
    ...SHEETS.filter((f) => existsSync(join(REPO_ROOT, f))),
  ].sort();
  const out_ = {};
  for (const f of files) out_[f] = createHash('sha256').update(readFileSync(join(REPO_ROOT, f))).digest('hex');
  return out_;
}

const store = dry ? new MemoryRecordStore({ allowSimulated: false }) : new RecordStore({ allowSimulated: false });
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: new JsonlSink(),
  attributes: { agent: UX_AGENT },
});

const beforeData = hashDataDir();
const beforeUI = hashInterface();

out();
out('  UX/UI AUDIT — what does this interface do to a reader that nothing in tools/ can see?');
const surface = readSurface();
out(`  as of ${asOf} · ${surface.pages.length} pages · ${surface.sheets.length} stylesheets · ${surface.modules.length} modules · ${surface.sheets.reduce((n, s) => n + s.rules.length, 0)} CSS rules${propose ? ' · proposing for the high-priority half' : ''}${dry ? ' · dry run, nothing stored' : ''}`);
out('  Read-only. Nothing is opened in a browser, no screen reader is run, and no contrast is computed.');
out();

try {
  const agent = new UXAuditor({ tracer, store, surface, asOf, propose });
  const r = await agent.run();

  out('  THE TEN QUESTIONS');
  out();
  for (const l of r.by_lens) {
    const answer = l.reported ? `YES — ${l.reported} finding(s)` : 'NO — not on the evidence in these files';
    out(`  ${String(l.question).padStart(2)}  ${l.asks}`);
    out(`      ${answer}   ${l.examined} examined · ${l.open_questions} open question(s) · ${l.set_aside} set aside`);
    out(`      ${l.why}`);
    out();
  }

  const shown = onlyQuestion
    ? r.backlog.filter((f) => String(f.question) === String(onlyQuestion))
    : r.backlog;

  out(`  THE BACKLOG  ${shown.length} finding(s), ranked${onlyQuestion ? ` — question ${onlyQuestion} only` : ''}`);
  out();
  for (const f of shown) {
    out(`  ${String(f.rank).padStart(2)}. [${f.severity.toUpperCase()}] ${f.finding_class.replace(/_/g, ' ')} — ${f.subject}`);
    out(`      JOURNEY    ${f.journey.label}  (${f.stake.replace(/_/g, ' ')})`);
    if (showBacklog) {
      out(`      PROBLEM    ${wrap(f.problem, 4)}`);
      out(`      MATTERS    ${wrap(f.why_it_matters, 4)}`);
      out(`      EVIDENCE   ${f.evidence.slice(0, 3).map((e) => e.locator).join(' · ')}${f.evidence.length > 3 ? ` · +${f.evidence.length - 3}` : ''}`);
      out(`      CHANGE     ${wrap(f.recommendation, 4)}`);
      out(`      SUCCESS    ${wrap(f.success_criterion, 4)}`);
      out(`      SEVERITY   ${f.severity_steps.map((s) => `${s.step} → ${s.to}`).join('  ·  ')}`);
      out(`      NOT THIS   ${wrap(f.scope_note, 4)}`);
    }
    out(`      ${f.proposal_id ?? 'no record'} · human_only · approval ${f.approval_id ?? '—'} (requested)${isHighPriority(f) ? '  ← high priority' : ''}`);
    out();
  }
  if (!shown.length) out('    none.');
  if (!showBacklog) out('    --backlog prints each finding whole: problem, evidence, recommended change, success criterion.');
  out();

  if (r.testable.length || propose) {
    out(`  TESTABLE PROPOSALS  ${r.testable.length} for the ${r.backlog.filter(isHighPriority).length} finding(s) at critical or high`);
    out();
    for (const p of r.testable) {
      out(`  ${p.proposal_id}  [${p.severity}] ${p.finding_class.replace(/_/g, ' ')}`);
      out(`      CHANGE     ${wrap(p.proposed_change.summary, 4)}`);
      out(`      HYPOTHESIS ${wrap(p.hypothesis, 4)}`);
      out(`      FILES      ${p.affected_entities.map((e) => e.path).filter(Boolean).join(', ') || '—'}`);
      out(`      METRICS    ${p.success_metrics.length} · RISKS ${p.regression_risks.length} · A11Y CHECKS ${p.accessibility_checks.length} · BROWSER TESTS ${p.browser_tests.length}`);
      out(`      TOKENS     ${p.tokens_used.length ? p.tokens_used.join(' ') : 'none named'}   new tokens: ${p.tokens_added.length}`);
      out(`      ${p.autonomy_class} · risk ${p.risk} · confidence ${p.confidence}`);
      out();
    }
    if (!r.testable.length) out('    none — the trace carries a NO PROPOSAL observation for each finding that got none, with the reason.');
    out();
  }

  if (showOpen || r.questions.length) {
    out(`  OPEN QUESTIONS  ${r.questions.length} — what the source could not settle`);
    if (showOpen) {
      for (const q of r.questions) {
        out(`    ${q.subject}   [${q.lens}]`);
        out(`      Q  ${wrap(q.question, 6)}`);
        out(`      ?  ${wrap(q.missing, 6)}`);
        out(`      at ${(q.evidence ?? []).slice(0, 3).map((e) => e.locator).join(' · ') || 'no locator'}`);
        out();
      }
    } else {
      out(`    ${r.questions.map((q) => q.subject).slice(0, 6).join(' · ')}${r.questions.length > 6 ? ` … +${r.questions.length - 6}` : ''}`);
      out('    --open prints each one with what would close it.');
    }
    out();
  }

  if (r.aside.length) {
    out(`  NOT REPORTED  ${r.aside.length} — named rather than dropped, with the agent each belongs to`);
    if (showAside) for (const a of r.aside) { out(`    ${a.subject}`); out(`      ${wrap(a.why, 6)}`); }
    else out('    --aside prints each one with its reason.');
    out();
  }

  if (r.refused.length) {
    out('  REFUSED');
    for (const x of r.refused) out(`    ${x.what} (${x.stage}): ${wrap(x.reason, 4)}`);
    out();
  }

  out(`  ${r.proposals.length} finding(s) · ${r.testable.length} testable proposal(s) · ${r.approvals.length + r.testable_approvals.length} approval(s), all pending · ${r.questions.length} open question(s) · as at ${r.as_of}`);
  out(`  by severity:  ${Object.entries(countBy(r.backlog, (f) => f.severity)).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`);
  out(`  by class:     ${Object.entries(countBy(r.backlog, (f) => f.finding_class)).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`);
  out(`  by journey:   ${Object.entries(countBy(r.backlog, (f) => f.journey.id)).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`);
  out(`  answered no:  ${r.questions_answered_no.map((q) => `q${q}`).join(' · ') || 'every question found something'}`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  records agent/records/${r.trace_id}.jsonl`);

  const afterData = hashDataDir();
  const afterUI = hashInterface();
  const dataSame = JSON.stringify(beforeData) === JSON.stringify(afterData);
  const uiSame = JSON.stringify(beforeUI) === JSON.stringify(afterUI);
  out();
  out(dataSame && uiSame
    ? `  data/, all ${Object.keys(afterUI).length} pages and stylesheets are byte-identical to before this run. Nothing was restyled, nothing was applied, and no page was opened.`
    : `  ${dataSame ? '' : 'data/ '}${dataSame || uiSame ? '' : 'and '}${uiSame ? '' : 'a page or a stylesheet '}CHANGED DURING THIS RUN. This agent has no code path that writes anywhere — treat every record it produced as suspect.`);
  out('  Every finding names a problem and drafts no value. What this site should look like is the repository owner\'s decision.');
  out();
  process.exitCode = dataSame && uiSame ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  if (process.env.UX_DEBUG) out(err.stack);
  process.exitCode = 1;
}

function countBy(xs, key) {
  const o = {};
  for (const x of xs) { const k = key(x); o[k] = (o[k] ?? 0) + 1; }
  return o;
}

/** Soft-wrap a paragraph under a hanging indent. */
function wrap(text, indent, width = 92) {
  const pad = ' '.repeat(indent + 11);
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
