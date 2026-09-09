/* ============================================================
   agent/simulation/report.mjs — the end-to-end trace, rendered

   ONE JOB: turn what `run.mjs` and `threshold.mjs` measured into
   something a person can read in a terminal, without adding a
   single fact of its own. Every number here is read off the run
   object; nothing is recomputed, and nothing is summarised in a way
   that would lose a refusal.

   THE RULE THIS FILE FOLLOWS. A stage that did not run, a record
   that was refused, a gate that passed vacuously and a condition
   that failed are all PRINTED. A report that showed only the happy
   path would make an end-to-end simulation look like an end-to-end
   success, which is the specific thing protocol §25 asks this
   session not to do.
   ============================================================ */

const pad = (s, n) => String(s ?? '').padEnd(n);
const rule = (c = '─', n = 78) => c.repeat(n);

const STATUS_MARK = {
  ok: '·', passed: '·', reached: '▸', refused: '✗', not_dispatched: '○', not_reached: ' ', failed: '✗',
};

export function renderRun(run, { verbose = false } = {}) {
  const L = [];
  const say = (s = '') => L.push(s);

  say(rule('═'));
  say('  SESSION 24 — ONE COMPLETE CYCLE, IN SIMULATION');
  say(rule('═'));
  say(`  scenario   ${run.scenario.title}`);
  say(`  ran        ${run.started_at} → ${run.finished_at}`);
  say(`  published  ${run.published === false ? 'NO — and no workflow type in this system can publish' : String(run.published)}`);
  say('');
  say('  NOTHING HERE IS A LEGAL FACT. Every record is simulated, every URL is on');
  say('  example.invalid, and the entity is "simulated:instrument", which does not exist.');
  say('');

  /* ------------------------------------------------ the graph */
  say(rule());
  say('  THE AGENT GRAPH');
  say(rule());
  const seen = new Map();
  for (const leg of run.legs) {
    for (const r of legResults(leg)) {
      for (const s of r.workflow?.stages ?? []) {
        if (!s.agent) continue;
        if (!seen.has(s.agent)) seen.set(s.agent, []);
        seen.get(s.agent).push(`${s.stage}:${s.status}`);
      }
    }
  }
  for (const a of run.graph_order) {
    const ran = seen.get(a);
    say(`  ${pad(a, 28)} ${ran ? ran.join('  ') : a === 'human' ? '(every leg ends here)' : a === 'orchestrator' ? '(ran every gate in every leg)' : 'NOT REACHED IN THIS RUN'}`);
  }
  say('');

  /* ------------------------------------------------ the legs */
  for (const leg of run.legs) {
    say(rule());
    say(`  LEG ${leg.leg} · ${leg.lifecycle}`);
    say(`  ${leg.workflow_type}`);
    say(rule());
    say(`  why  ${wrap(leg.why, 72, '       ')}`);
    say('');
    for (const { label, result, extra } of legVariants(leg)) {
      if (label) say(`  ── ${label}`);
      if (extra) for (const line of extra) say(`     ${line}`);
      renderWorkflow(say, result, { verbose });
      say('');
    }
  }

  /* ------------------------------------------------ the ledger */
  say(rule());
  say('  THE DECISION LEDGER (temporary — deleted with the run)');
  say(rule());
  if (!run.ledger.length) say('  no decision was recorded.');
  for (const d of run.ledger) {
    say(`  ${d.outcome.toUpperCase()}  ${d.proposal_id}`);
    say(`     decided_by   ${d.decided_by}   at ${d.decided_at}`);
    say(`     bound to     sha256 ${String(d.proposal_sha256).slice(0, 16)}…  — editing the proposal voids this`);
    say(`     note         ${d.note ?? '(none)'}`);
  }
  say('');

  /* ------------------------------------------------ what changed */
  say(rule());
  say('  WHAT THIS RUN CHANGED IN THE REPOSITORY');
  say(rule());
  say(run.repository_changed.length === 0
    ? '  Nothing. Measured as a before/after content fingerprint of the working tree,\n  not asserted.'
    : `  ${run.repository_changed.length} path(s) CHANGED — this is a defect in the simulation:\n${run.repository_changed.map((c) => `    ${c.how}  ${c.path}`).join('\n')}`);
  say('');
  say(`  ${wrap(run.publication_note, 74, '  ')}`);
  say('');

  say(rule());
  say('  WHAT THIS RUN DOES NOT COVER');
  say(rule());
  for (const n of run.not_walked) say(`  ${pad(n.workflow_type, 24)} ${wrap(n.why, 50, '                           ')}`);
  say('  Every specialist\'s domain reasoning was simulated. No source was read, no page');
  say('  was opened by a specialist, no dataset was examined, no sentence was judged.');
  say('');

  return L.join('\n');
}

function legResults(leg) {
  return leg.variants ? leg.variants.map((v) => v.result) : [leg.result];
}

function legVariants(leg) {
  if (!leg.variants) return [{ label: null, result: leg.result, extra: null }];
  return leg.variants.map((v) => ({
    label: `${v.variant}  ·  ${v.proposal_id}`,
    result: v.result,
    extra: [
      `preflight: ${v.preflight.ok ? 'all ten gates pass' : `REFUSED at ${v.preflight.gates.filter((g) => !g.ok).map((g) => g.gate).join(', ')}`}`,
      ...v.control_room.observations.map((o) => `control room · ${pad(o.what, 40)} ${o.finding}`),
    ],
  }));
}

function renderWorkflow(say, result, { verbose }) {
  if (!result.workflow) {
    say(`     REFUSED AT INTAKE: ${result.refused?.code} — ${result.refused?.why}`);
    return;
  }
  const w = result.workflow;
  say(`     end state    ${result.state.toUpperCase()}`);
  if (result.state_meaning) say(`                  ${wrap(result.state_meaning, 62, '                  ')}`);
  say('     stages');
  for (const s of w.stages) {
    say(`       ${STATUS_MARK[s.status] ?? '?'} ${pad(s.stage, 18)} ${pad(s.status, 15)} ${pad(s.agent ?? '', 26)}`);
    if (s.refusals?.length) for (const r of s.refusals) say(`           refusal: ${r.code} — ${wrap(r.why, 58, '                    ')}`);
    if (verbose && s.why) say(`           ${wrap(s.why, 62, '           ')}`);
  }
  if (w.records?.length) {
    say(`     artifacts    ${w.records.length}`);
    for (const r of w.records) say(`       ${pad(r.contract, 24)} ${pad(r.id, 32)} ${r.agent}`);
  }
  if (w.conflicts?.length) {
    say(`     conflicts    ${w.conflicts.length}`);
    for (const c of w.conflicts) say(`       ${pad(c.kind, 22)} ${c.severity.padEnd(9)} ${wrap(c.why, 46, '                                  ')}`);
  }
  if (w.autonomy) {
    say(`     autonomy     ${w.autonomy.permitted ? 'PERMITTED' : 'BLOCKED'} — ${w.autonomy.failed?.length ?? 0} of ${(w.autonomy.conditions ?? []).length} mandatory condition(s) fail`);
    if (w.autonomy.failed?.length) say(`                  ${wrap(w.autonomy.failed.map((c) => c.condition).join(', '), 60, '                  ')}`);
  }
  if (w.human_review) {
    say(`     human review ${w.human_review.required ? 'REQUIRED' : 'not triggered'} — ${[...new Set((w.human_review.reasons ?? []).map((r) => r.code))].join(', ') || 'the workflow type never completes without a person'}`);
  }
  say(`     published    ${result.published === false ? 'no' : String(result.published)}`);
}

/* ============================================================
   The discovery path
   ============================================================ */

export function renderThreshold(d) {
  const L = [];
  const say = (s = '') => L.push(s);

  say(rule('═'));
  say('  THE CONTROL ROOM DISCOVERY FLOW — a separate UX/security path');
  say(rule('═'));
  say(`  ${wrap(d.what, 74, '  ')}`);
  say('');
  say(`  triggers     ${d.triggers.join(' · ')}`);
  say(`  ${wrap(d.trigger_is_not_a_credential, 74, '  ')}`);
  say('');

  say(rule());
  say('  1 · RECOGNITION — measured');
  say(rule());
  for (const [k, v] of Object.entries(d.recognition)) say(`  ${pad(k, 24)} ${Array.isArray(v) ? v.join(', ') : v}`);
  say(`  passage() with no document returns ${JSON.stringify(d.with_no_document)}`);
  say(`  controlRoomHref() with no meta tag returns ${JSON.stringify(d.control_room_href_without_meta)}`);
  say('');

  say(rule());
  say('  THE INTENDED VISUAL SEQUENCE, AND WHAT THE CODE ACTUALLY DOES');
  say(rule());
  for (const p of d.visual_sequence) {
    say(`  ${p.phase} · ${p.id.toUpperCase().replace(/_/g, ' ')}   [${p.status}]`);
    say(`      intended   ${wrap(p.intended, 62, '                 ')}`);
    say(`      must not   ${wrap(p.must_not, 62, '                 ')}`);
    say(`      reference  ${wrap(p.reference, 62, '                 ')}`);
    for (const e of p.evidence ?? []) say(`      measured   ${wrap(e, 62, '                 ')}`);
    if (p.mismatch) say(`      MISMATCH   ${wrap(p.mismatch, 62, '                 ')}`);
    say('');
  }

  say(rule());
  say('  THE SIX SEPARATIONS — the animation is a presentation layer only');
  say(rule());
  for (const s of d.separations) {
    say(`  ${s.separated ? 'SEPARATE' : 'NOT SEPARATE'}  ${s.separation.toUpperCase()}`);
    for (const m of s.measured) say(`      · ${wrap(m, 66, '        ')}`);
    if (s.live && s.live !== 'not_measured_here') for (const r of s.live) say(`      live  ${pad(r.path, 42)} ${r.status} ${r.admitted ? 'ADMITTED' : 'refused'}`);
    else if (s.live) say('      live  not measured in this run');
    say(`      bound  ${wrap(s.bound, 64, '             ')}`);
    say('');
  }
  say(`  ${wrap(d.animation_is_presentation_only, 74, '  ')}`);
  say('');
  return L.join('\n');
}

function wrap(text, width, indent) {
  const words = String(text ?? '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > width) { lines.push(line.trimEnd()); line = ''; }
    line += `${w} `;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.join(`\n${indent}`);
}
