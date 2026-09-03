#!/usr/bin/env node
/* ============================================================
   agent/proposals/editorial/cli.mjs

     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD
     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD --changes <trace-id>
     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD --mock
     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD --dry
     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD --kind analytical_update
     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD --refusals
     node agent/proposals/editorial/cli.mjs --as-of YYYY-MM-DD --no-change

   --as-of is REQUIRED. A proposal quotes a sentence verbatim, and
   only a stated as-of date says which version of the page it quoted
   (docs/AUDIT-2026-09-01.md F-15).

   WITH NO INPUT it runs the half that needs none: the site's own
   editorial findings — the two homes of a string disagreeing, the
   markup and the data disagreeing about what a passage is, prose
   reading as settled over evidence that cannot carry it.

   --changes reads the RegulatoryChange, ImpactAssessment and
   VerificationRecord records a Detector or Verifier run stored.
   --mock runs the Detector inline over its adversarial fixtures, so
   the whole path can be exercised; every record produced is marked
   simulated and the contract gateway refuses to treat one as
   actionable.

   NOTHING IS WRITTEN TO ANY PAGE, ANY DATASET OR ANY LOCALE FILE,
   and nothing is merged. Drafts go to agent/proposals/editorial/
   drafts/<trace-id>.jsonl. Every proposal is emitted with an
   ApprovalRequest in the "requested" state, and pending is never
   granted. The run hashes data/ and every page before and after and
   says which.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { Tracer } from '../../observability/tracer.mjs';
import { upstreamOf, recordHandoff } from '../../observability/chain.mjs';
import { JsonlSink } from '../../observability/sink.mjs';
import { RecordStore, MemoryRecordStore, readRecords } from '../../scout/store.mjs';
import { loadCorpus, hashDataDir } from '../../integrate/canonical.mjs';
import { REPO_ROOT, EDITORIAL_PROPOSAL_KINDS } from '../../schemas/types.mjs';
import { Detector } from '../../detector/detector.mjs';
import { buildFixtures, FIXTURE_AS_OF } from '../../detector/fixtures.mjs';
import { EditorialAgent, EDITORIAL_AGENT } from './editorial.mjs';
import { DRAFT_DIR } from './drafts-dir.mjs';

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
const mock = has('--mock');
const showRefusals = has('--refusals');
const showNoChange = has('--no-change');
const onlyKind = valueOf('--kind');
const changesTrace = valueOf('--changes');
const asOf = valueOf('--as-of') ?? (mock ? FIXTURE_AS_OF : null);

if (!asOf) {
  out('  --as-of YYYY-MM-DD is required. A proposal quotes a sentence verbatim, and only a stated as-of');
  out('  date says which version of the page it quoted (docs/AUDIT-2026-09-01.md F-15).');
  process.exit(1);
}
if (onlyKind && !EDITORIAL_PROPOSAL_KINDS.includes(onlyKind)) {
  out(`  unknown kind "${onlyKind}". The three are: ${EDITORIAL_PROPOSAL_KINDS.join(', ')}`);
  process.exit(1);
}

const corpus = loadCorpus();

/* The inputs are read BEFORE the tracer is built, because the run
   that produced them is this run's parent and a tracer cannot be
   told that after its first span is open. */
let inputs = [];
let upstreamTrace = null;
if (changesTrace) {
  inputs = readRecords(changesTrace);
  if (!inputs.length) {
    out(`  no records in agent/records/${changesTrace}.jsonl`);
    out('  `node agent/detector/cli.mjs --mock` writes some.');
    process.exit(1);
  }
  upstreamTrace = changesTrace;
}

const simulated = mock || (inputs.length > 0 && inputs.some((r) => r.simulated === true));
const upstream = inputs.length ? upstreamOf(inputs) : null;
const tracer = new Tracer({
  service: 'eu-digital-policy',
  sink: new JsonlSink(),
  attributes: { agent: EDITORIAL_AGENT },
  parent_run_id: upstream && !upstream.ambiguous ? upstream.run_id : null,
});

/* THE DRAFTS GO WHERE THE SESSION SAID THEY GO. The record store is
   pointed at agent/proposals/editorial/drafts/ rather than at
   agent/records/, so a drafted sentence lives in one place and that
   place is the one the brief named. It is git-ignored for the same
   reason agent/records/ is: a draft is a run artifact, and the site
   is not changed because an agent was confident. */
const store = dry
  ? new MemoryRecordStore({ allowSimulated: simulated })
  : new RecordStore({ dir: DRAFT_DIR, allowSimulated: simulated });

const beforeData = hashDataDir();
const beforePages = hashPages();

out();
out('  EDITORIAL — the prose a verified change has made wrong, and the prose it has not. Read-only.');

try {
  if (mock) {
    /* The adversarial corpus, through the Detector, so the inputs
       this agent receives are real RegulatoryChange records that
       passed their own contract rather than hand-built ones. */
    const mockStore = new MemoryRecordStore({ allowSimulated: true });
    const d = await new Detector({ tracer, store: mockStore, corpus, asOf, simulated: true }).run({ verifications: buildFixtures(corpus).all });
    inputs = [...d.changes, ...d.assessments];
    upstreamTrace = d.trace_id;
    out(`  MOCK — ${d.changes.length} change(s) and ${d.assessments.length} assessment(s) from an inline detector run (trace ${d.trace_id}). Every record is marked simulated.`);
  } else if (changesTrace) {
    out(`  LIVE — ${inputs.length} record(s) from trace ${changesTrace}.`);
  } else {
    out('  NO INPUT — running only the half that needs none: what the site says that disagrees with itself.');
  }
  out(`  as of ${asOf}${dry ? ' · dry run, nothing stored' : ''}`);
  out();

  const r = await new EditorialAgent({ tracer, store, corpus, asOf, inputs, simulated }).run();

  /* ---- what was let in, and what was not ---- */
  out(`  INTAKE  ${r.intake.accepted.length} verified input(s) admitted · ${r.intake.refused.length} refused`);
  out(`    by contract: ${Object.entries(r.intake.by_contract).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`);
  for (const x of r.intake.refused) out(`    REFUSED  ${String(x.record_id).padEnd(28)} ${wrap(x.why, 4)}`);
  out();

  /* ---- the prose, and how much of it carries provenance ---- */
  out(`  PROSE   ${r.prose.blocks.length} authored block(s) · ${r.prose.pages.length} page(s) · ${r.prose.dropped} unmatched tag(s)`);
  out(`    homes:  ${Object.entries(r.prose.by_home).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  out(`    states: ${Object.entries(r.register.by_state).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  out(`    ${r.register.attributed} block(s) carry a claim record. The rest carry none, and "not_attributed" is what this agent says about them rather than a guess.`);
  out();

  /* ---- the proposals ---- */
  const shown = onlyKind ? r.proposals.filter((p) => p.proposal_kind === onlyKind) : r.proposals;
  out(`  PROPOSALS  ${r.proposals.length} authored, each behind a pending approval`);
  out(`    by kind:   ${EDITORIAL_PROPOSAL_KINDS.map((k) => `${k} ${r.by_kind[k] ?? 0}`).join(' · ')}`);
  out();
  for (const p of shown) {
    const op = p.proposed_change.operations[0];
    out(`  ${p.proposal_id}   ${p.proposal_kind}   ${p.editorial_state}   ${p.autonomy_class}   confidence ${p.confidence}`);
    out(`    WHERE      ${p.prose_locations[0].file} ${p.prose_locations[0].anchor} · ${p.prose_locations[0].home}`);
    out(`    WHY        ${wrap(p.reason, 4)}`);
    if (p.staleness) {
      out(`    STALENESS  ${p.staleness.kind} — ${wrap(p.staleness.how, 4)}`);
      if (p.staleness.quoted) out(`    QUOTED     "${wrap(p.staleness.quoted, 4)}"`);
    }
    out(`    CURRENT    ${wrap(String(op.current).slice(0, 400), 4)}`);
    out(`    PROPOSED   ${op.proposed === null ? '(null — nothing is drafted here, and that is the point)' : wrap(String(op.proposed).slice(0, 400), 4)}`);
    if (p.caveats_preserved.length) out(`    CAVEATS    kept: ${p.caveats_preserved.map((c) => `"${c.trim()}"`).join(', ')}`);
    if (p.i18n_dispositions.length) out(`    LOCALES    ${p.i18n_dispositions.map((d) => `${d.note.split(':')[0]} ${d.disposition}`).join(' · ')}`);
    if (p.content_blob_divergence) out(`    TWO HOMES  ${wrap(p.content_blob_divergence.slice(0, 300), 4)}`);
    out(`    NOT THIS   ${wrap(p.proposed_change.scope_note, 4)}`);
    out();
  }
  if (!shown.length) out('    none.');

  /* ---- what needed no change ---- */
  out(`  NO CHANGE NEEDED  ${r.no_change.length} sentence(s) examined and found not to need correcting`);
  out('    A finding, not a silence. "Looked and found nothing" and "did not look" are different answers.');
  for (const o of showNoChange ? r.no_change : r.no_change.slice(0, 5)) {
    out(`    ${o.observation_id.padEnd(26)} ${o.subject}`);
    out(`      ${wrap(o.summary, 6)}`);
  }
  if (!showNoChange && r.no_change.length > 5) out(`    --no-change names the other ${r.no_change.length - 5}.`);
  if (!r.no_change.length) out('    none.');
  out();

  /* ---- per change ---- */
  if (r.changes.length) {
    out('  PER CHANGE  — what each reached, and at what strength');
    for (const c of r.changes) {
      out(`    ${c.change_id.padEnd(26)} ${String(c.reached).padStart(3)} reached · ${String(c.proposed).padStart(2)} proposal(s) · ${String(c.no_change).padStart(2)} no change · ${String(c.open_questions.length).padStart(2)} open question(s)`);
      if (!c.correctable.ok) out(`      no correction composable: ${wrap(c.correctable.why, 6)}`);
    }
    out();
  }

  /* ---- refusals ---- */
  out(`  REFUSED  ${r.refused.length} record(s) this agent declined to produce`);
  for (const x of showRefusals ? r.refused : r.refused.slice(0, 5)) out(`    ${String(x.what).padEnd(26)} ${x.stage} — ${wrap(x.why, 4)}`);
  if (!r.refused.length) out('    none.');
  out();

  out(`  ${r.proposals.length} proposal(s) · ${r.approvals.length} approval(s), all pending · ${r.no_change.length} no-change explanation(s)`);
  out(`  trace ${r.trace_id}`);
  out(dry ? '  nothing stored (--dry)' : `  drafts agent/proposals/editorial/drafts/${r.trace_id}.jsonl`);

  if (upstream && upstreamTrace) {
    const edge = recordHandoff({
      upstream,
      to_agent: EDITORIAL_AGENT,
      records: inputs,
      downstream_trace_id: r.trace_id,
      reason: `Finding the prose ${inputs.length} verified record(s) reach, correcting only what can be quoted, and flagging the rest.`,
    });
    out();
    out(edge.emitted
      ? `  CHAIN  ${upstream.trace_id} → ${r.trace_id}. parent_run_id ${upstream.run_id}; handoff ${edge.handoff_id} recorded on the upstream trace.`
      : `  CHAIN  no handoff recorded on the upstream trace — ${edge.why}`);
  }

  const dataUntouched = JSON.stringify(beforeData) === JSON.stringify(hashDataDir());
  const pagesUntouched = JSON.stringify(beforePages) === JSON.stringify(hashPages());
  out();
  out(dataUntouched && pagesUntouched
    ? '  data/ and every page are byte-identical to before this run. No sentence was edited, and nothing was merged or applied.'
    : `  ${dataUntouched ? '' : 'data/ '}${pagesUntouched ? '' : 'a page '}CHANGED DURING THIS RUN. This agent has no code path that writes to either — treat every record it produced as suspect.`);
  out('  Every approval is in the "requested" state. Pending is never granted, and nothing here applies a proposal.');
  out();
  process.exitCode = dataUntouched && pagesUntouched ? 0 : 1;
} catch (err) {
  out(`  the run failed: ${err.message}`);
  process.exitCode = 1;
}

/** sha256 of every page and every locale file — the two things this
 *  agent writes about and must never write to. */
function hashPages() {
  const out2 = {};
  for (const f of readdirSync(REPO_ROOT).filter((x) => x.endsWith('.html')).sort()) {
    out2[f] = createHash('sha256').update(readFileSync(join(REPO_ROOT, f))).digest('hex');
  }
  const i18n = join(REPO_ROOT, 'i18n');
  for (const f of readdirSync(i18n).filter((x) => x.endsWith('.json')).sort()) {
    out2[`i18n/${f}`] = createHash('sha256').update(readFileSync(join(i18n, f))).digest('hex');
  }
  return out2;
}

/** Soft-wrap a paragraph under a hanging indent. */
function wrap(text, indent, width = 92) {
  const pad = ' '.repeat(indent + 11);
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join(`\n${pad}`);
}
