/* ============================================================
   agent/simulation/selftest.mjs — SESSION 24's own suite

   WHAT IT IS FOR. A simulation whose only claim is "this changed
   nothing" has to prove that, and a report that could quietly turn
   a refusal into a pass would be worse than no report. So this
   suite asserts the DISCIPLINE rather than the findings: the
   findings belong in `docs/FIRST-END-TO-END-AUDIT.md`, where a
   person can argue with them, and an assertion that pinned them
   would turn a defect into a requirement.

   THE ONE ASSERTION EVERYTHING ELSE SERVES: after a complete run,
   the working tree is byte-identical.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../implement/baseline.mjs';
import { runCycle } from './run.mjs';
import { discoverySimulation, separations, measureSequence, VISUAL_SEQUENCE } from './threshold.mjs';
import { simulationDispatchers, brokenDispatcher } from './dispatchers.mjs';
import { records as fx, unmarkedControlFixture, markedProposal, SCENARIO } from './fixture.mjs';
import { LEGS, GRAPH_ORDER, NOT_WALKED } from './cycle.mjs';
import { fingerprintTree, diffFingerprints, SimWorld } from './world.mjs';
import { renderRun, renderThreshold } from './report.mjs';
import { DISPATCHABLE } from '../orchestrator/capabilities.mjs';
import { WORKFLOW_TYPES } from '../orchestrator/workflows.mjs';
import { validate } from '../schemas/validate.mjs';

/* One run, shared. Starting a Control Room four times to assert four
   things about one run would be four runs. */
let RUN = null;
const theRun = async () => (RUN ??= await runCycle({ quiet: true }));

/* ============================================================
   1 · the simulation makes no production change
   ============================================================ */

test('1 · a complete cycle leaves the working tree byte-identical', async () => {
  const before = fingerprintTree(REPO_ROOT);
  const run = await theRun();
  const after = fingerprintTree(REPO_ROOT);
  const changed = diffFingerprints(before, after);
  assert.deepEqual(changed, [], `the simulation changed ${changed.length} path(s): ${changed.map((c) => `${c.how} ${c.path}`).join(', ')}`);
  assert.deepEqual(run.repository_changed, [], 'the run reports its own measurement, and it must agree');
});

/* SESSION 26 CORRECTED THIS TEST, AND IT IS THE SESSION 19 SHAPE: a
   check that passed for the wrong reason. Its own comment said "the
   assertion is that THIS run added nothing", and its code asserted
   the four directories were EMPTY. Those are different claims, and
   the second one is a claim about the machine rather than about the
   simulation: `agent/records/` is git-ignored run state that any
   agent run populates, so the test passed in a fresh clone and in CI
   and failed the moment somebody ran Data Depth first — which is what
   happened in SESSION 26, running the real agents to give the
   autonomy layer something to refuse.

   It now does what its comment always said: snapshot, run, compare.
   That is STRICTER, not weaker — the old form could not have caught a
   simulation writing into a directory that already held a file. */
test('1 · the run writes into none of the repository\'s real stores', async () => {
  const dirs = ['agent/records', 'agent/observability/runs', 'agent/orchestrator/state', '.control-room/state'];
  const contentsOf = (dir) => {
    const p = join(REPO_ROOT, dir);
    return existsSync(p) ? readdirSync(p).filter((f) => f !== 'README.md' && !f.startsWith('.')).sort() : [];
  };
  const before = Object.fromEntries(dirs.map((d) => [d, contentsOf(d)]));
  await theRun();
  for (const dir of dirs) {
    const after = contentsOf(dir);
    const added = after.filter((f) => !before[dir].includes(f));
    const removed = before[dir].filter((f) => !after.includes(f));
    assert.deepEqual(added, [], `the simulation added ${added.length} file(s) to ${dir}: ${added.join(', ')}`);
    assert.deepEqual(removed, [], `the simulation removed ${removed.length} file(s) from ${dir}: ${removed.join(', ')}`);
  }
  const ledger = join(REPO_ROOT, 'agent/implement/decisions/decisions.jsonl');
  const lines = existsSync(ledger) ? readFileSync(ledger, 'utf8').split('\n').filter(Boolean) : [];
  assert.equal(lines.length, 0, 'the real decision ledger must still hold no decision. Not one proposal in this repository has ever been decided, and a simulation is not the thing that changes that.');
});

test('1 · no dispatcher can write, spawn or fetch', () => {
  const src = readFileSync(join(REPO_ROOT, 'agent/simulation/dispatchers.mjs'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const forbidden of ['writeFileSync', 'appendFileSync', 'child_process', 'spawn(', 'exec(', 'fetch(', 'rmSync', 'mkdirSync']) {
    assert.ok(!code.includes(forbidden), `agent/simulation/dispatchers.mjs must not contain "${forbidden}" — a dispatcher that can write is a simulation that can change production`);
  }
  assert.equal(code.includes("from './fixture.mjs'"), true, 'the dispatchers return fixtures and nothing else');
});

/* ============================================================
   2 · the fixture is a fixture, and says so
   ============================================================ */

test('2 · every record a simulated specialist returns is marked simulated', () => {
  for (const [name, make] of Object.entries(fx)) {
    const r = make();
    assert.equal(r.simulated, true, `${name} must be marked simulated`);
    assert.equal(validate(r, { allowSimulated: false }).length > 0, true,
      `${name} must be REFUSED by the gate when a caller has not asked for a simulated record. That refusal is what stops a fixture reading as research.`);
    assert.equal(validate(r, { allowSimulated: true }).length, 0, `${name} must satisfy its own contract`);
  }
});

test('2 · nothing in the fixture names a real instrument, source or authority', () => {
  const text = readFileSync(join(REPO_ROOT, 'agent/simulation/fixture.mjs'), 'utf8');
  assert.ok(!/eur-lex\.europa\.eu|celex|32016R0679|32022R2065|\bGDPR\b|\bDSA\b|\bDMA\b|\bAI Act\b/i.test(text),
    'the scenario must not name a real instrument, register or citation, even in a comment. AI-SAFE-BOUNDARIES §0.1: a fixture that reads as research is worse than no fixture.');
  assert.equal(SCENARIO.not_a_legal_fact.length > 100, true, 'the scenario states in its own record that it is not a legal fact');
});

test('2 · the one unmarked record exists for a stated reason and is a copy of the marked one', () => {
  const marked = markedProposal();
  const unmarked = unmarkedControlFixture();
  assert.equal(marked.simulated, true);
  assert.equal(unmarked.simulated, false);
  assert.equal(unmarked.contract, marked.contract);
  const header = readFileSync(join(REPO_ROOT, 'agent/simulation/fixture.mjs'), 'utf8');
  assert.match(header, /allowSimulated: false/, 'the header must name the gate that makes the unmarked copy necessary');
  assert.match(header, /FIRST-END-TO-END-AUDIT/, 'and must point at the finding rather than presenting it as a convenience');
});

/* ============================================================
   3 · nothing was published, anywhere, under any outcome
   ============================================================ */

test('3 · every leg reports published:false and no leg completed', async () => {
  const run = await theRun();
  const results = run.legs.flatMap((l) => (l.variants ? l.variants.map((v) => v.result) : [l.result]));
  assert.equal(results.length, LEGS.length + 1, 'eight legs, one of them run twice');
  for (const r of results) {
    assert.equal(r.published, false, 'a workflow that reported published:true would be the failure the whole architecture is arranged against');
    assert.ok(r.publication_note.includes('Nothing was published'));
    assert.notEqual(r.state, 'completed', 'every leg of this scenario proposed something, and everything that proposes something goes to a person');
  }
  assert.equal(run.published, false);
});

test('3 · the decision the Control Room accepted is in the TEMPORARY ledger and names a synthetic operator', async () => {
  const run = await theRun();
  assert.equal(run.ledger.length, 1, 'exactly one decision: the marked proposal is refused and the control fixture is granted');
  const d = run.ledger[0];
  assert.equal(d.outcome, 'granted');
  assert.match(d.decided_by, /@example\.invalid$/, 'a simulated decision is attributed to a synthetic operator, never to a person');
  assert.match(d.note, /SIMULATED/);
  assert.equal(typeof d.proposal_sha256, 'string');
});

/* ============================================================
   4 · the graph is walked, and what it misses is named
   ============================================================ */

test('4 · every dispatchable actor ran at least one stage', async () => {
  const run = await theRun();
  const ran = new Set();
  for (const l of run.legs) {
    for (const r of (l.variants ? l.variants.map((v) => v.result) : [l.result])) {
      for (const s of r.workflow?.stages ?? []) if (s.agent && s.status === 'ok') ran.add(s.agent);
    }
  }
  const missing = [...DISPATCHABLE].filter((a) => !ran.has(a));
  assert.deepEqual(missing, [], `these actors never ran: ${missing.join(', ')}`);
});

test('4 · the two workflow types this cycle does not walk are declared, not forgotten', () => {
  const walked = new Set(LEGS.map((l) => l.workflow_type));
  const named = new Set(NOT_WALKED.map((n) => n.workflow_type));
  for (const t of WORKFLOW_TYPES) {
    assert.ok(walked.has(t) || named.has(t), `workflow type ${t} is neither walked nor declared as not walked`);
  }
  for (const n of NOT_WALKED) assert.ok(n.why.length > 40, `${n.workflow_type} must say why it is not walked`);
});

test('4 · a dispatcher that throws fails the workflow rather than being stepped over', async () => {
  const { Orchestrator } = await import('../orchestrator/orchestrator.mjs');
  const { WorkflowJournal } = await import('../orchestrator/state.mjs');
  const { Tracer } = await import('../observability/tracer.mjs');
  class Mem { constructor() { this.rows = []; } write(r) { this.rows.push(r); return r; } }
  const o = new Orchestrator({
    tracer: new Tracer({ service: 'sim-suite', sink: new Mem() }),
    journal: new WorkflowJournal({ memory: true }),
    dispatchers: { ...simulationDispatchers(), 'legal-verifier': brokenDispatcher },
  });
  const r = await o.handle({ source: 'agent', kind: 'gap_detected', workflow_type: 'VERIFICATION_REQUIRED', subject: { contract: 'DataGap', id: 'gap-simulated-001' } });
  assert.equal(r.state, 'failed');
  assert.equal(r.published, false);
  assert.equal(r.workflow.stages.find((s) => s.stage === 'verify').status, 'failed');
  assert.equal(r.workflow.stages.find((s) => s.stage === 'integrate').status, 'not_reached',
    'a stage after a failure is not_reached — never recorded as having passed');
});

/* ============================================================
   5 · the discovery path — the six separations
   ============================================================ */

test('5 · the animation is separate from all six of authentication, authorization, approval, orchestration, execution and deployment', async () => {
  const s = await separations();
  assert.deepEqual(s.map((x) => x.separation),
    ['authentication', 'authorization', 'approval', 'orchestration', 'execution', 'deployment']);
  for (const x of s) {
    assert.equal(x.separated, true, `${x.separation} is NOT separated from the animation: ${x.measured.join(' ')}`);
    assert.ok(x.measured.length >= 3, `${x.separation} must be measured, not asserted`);
    assert.ok(x.bound && x.bound.length > 60, `${x.separation} must say what its measurement cannot see`);
  }
});

test('5 · the trigger phrase is not a credential and nothing server-side reads it', async () => {
  const d = await discoverySimulation();
  assert.equal(d.recognition.exact_only, true, 'a prefix match would make the phrase far easier to hit by accident');
  assert.equal(d.recognition.one_result, true);
  assert.equal(d.recognition.every_other_query, true);
  assert.equal(d.with_no_document, null, 'passage() with no document must do nothing rather than throw');
  assert.equal(d.control_room_href_without_meta, null, 'it may never invent an address');
  assert.match(d.trigger_is_not_a_credential, /§10|obscurity|not security/i);
});

/* ============================================================
   6 · the visual sequence is a specification, and the mismatches
       are REPORTED rather than smoothed
   ============================================================ */

test('6 · the intended sequence has six phases and every one states what it must not do', () => {
  assert.equal(VISUAL_SEQUENCE.length, 6);
  assert.deepEqual(VISUAL_SEQUENCE.map((p) => p.id),
    ['recognition', 'transition', 'geometric_emergence', 'activation', 'passage', 'authentication']);
  for (const p of VISUAL_SEQUENCE) {
    assert.ok(p.intended.length > 40, `phase ${p.phase} must state what is intended`);
    assert.ok(p.must_not.length > 40, `phase ${p.phase} must state what it must not do — a spec with no refusal is a wish`);
  }
});

test('6 · every phase is measured against the code, and a mismatch carries its evidence', () => {
  const measured = measureSequence();
  assert.equal(measured.length, 6);
  for (const p of measured) {
    assert.ok(Array.isArray(p.evidence) && p.evidence.length >= 2, `phase ${p.phase} must cite what was read`);
    assert.equal(typeof p.matches, 'boolean');
    if (!p.matches) assert.ok(p.mismatch && p.mismatch.length > 80, `phase ${p.phase} does not match and must say how`);
  }
  /* The count is asserted so a future session that IMPLEMENTS one of
     them has to come here and say so, rather than the number sliding.
     Three phases do not match today: transition, passage and
     authentication. The third is deliberate — a login form on the
     published page would be a phishing surface — and the audit says
     which is which. */
  assert.equal(measured.filter((p) => !p.matches).length, 3,
    'three phases do not match the intended sequence. If that number changed, either something was implemented or something regressed, and either way it is a decision rather than a detail.');
});

test('6 · phase 6 refuses an authentication interface on the public page', () => {
  const p = VISUAL_SEQUENCE.find((x) => x.id === 'authentication');
  assert.match(p.must_not, /phishing surface/i);
  const pages = readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html'));
  for (const page of pages) {
    const html = readFileSync(join(REPO_ROOT, page), 'utf8');
    assert.ok(!html.includes('eu-control-room'), `${page} declares a control-plane address`);
    assert.ok(!/type=["']password["']/.test(html), `${page} carries a password field — the published site must never collect a credential`);
  }
});

/* ============================================================
   7 · the report loses nothing
   ============================================================ */

test('7 · the rendered report prints every refusal, conflict and unrun stage', async () => {
  const run = await theRun();
  const text = renderRun(run);
  for (const l of run.legs) {
    for (const r of (l.variants ? l.variants.map((v) => v.result) : [l.result])) {
      for (const s of r.workflow?.stages ?? []) {
        assert.ok(text.includes(s.stage), `the report omits stage "${s.stage}"`);
        for (const ref of s.refusals ?? []) assert.ok(text.includes(ref.code), `the report omits refusal "${ref.code}"`);
      }
      for (const c of r.workflow?.conflicts ?? []) assert.ok(text.includes(c.kind), `the report omits conflict "${c.kind}"`);
    }
  }
  assert.ok(text.includes('NOTHING HERE IS A LEGAL FACT'));
  assert.ok(text.includes('published  NO'));
});

test('7 · the discovery report prints every mismatch and every bound', async () => {
  const d = await discoverySimulation();
  const text = renderThreshold(d);
  for (const p of d.visual_sequence) if (p.mismatch) assert.ok(text.includes('MISMATCH'), `the report hides the mismatch in phase ${p.phase}`);
  for (const s of d.separations) assert.ok(text.includes(s.separation.toUpperCase()), `the report omits the ${s.separation} separation`);
  assert.ok(text.includes('presentation layer only'));
});

/* ============================================================
   8 · the temporary world is temporary
   ============================================================ */

test('8 · every store the simulation creates is under the system temp directory and is removed', () => {
  const w = new SimWorld();
  const made = [...w.made];
  for (const d of made) {
    assert.ok(!d.startsWith(REPO_ROOT), `${d} is inside the repository`);
    assert.equal(existsSync(d), true);
  }
  w.clean();
  for (const d of made) assert.equal(existsSync(d), false, `${d} survived clean()`);
});

test('8 · the graph declares an ordering, and the report reads it rather than inventing one', () => {
  assert.equal(GRAPH_ORDER.length, 14, 'twelve dispatchable actors, the person, and the Orchestrator');
  assert.ok(GRAPH_ORDER.includes('human'));
  assert.ok(GRAPH_ORDER.includes('orchestrator'));
  for (const a of DISPATCHABLE) assert.ok(GRAPH_ORDER.includes(a), `${a} is dispatchable and is not in the declared graph order`);
});
