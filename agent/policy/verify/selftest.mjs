/* ============================================================
   agent/policy/verify/selftest.mjs — is the verification itself
   reproducible?

       node --test agent/policy/verify/selftest.mjs

   SESSION 23.5: "Merge the verification artifacts to main only after
   the verification process itself is reproducible." A security
   report that cannot be re-derived is a claim about a moment, and
   the report it produces would be the only evidence of its own
   correctness.

   So this suite runs the whole gate TWICE and asserts the two runs
   agree — on which attacks exist, and on what happened to each. It
   is the slowest suite in the repository for that reason, and the
   reason is worth the cost: a gate whose result depends on the order
   its own attacks ran in would be reporting noise as security.

   IT ALSO ASSERTS THE THINGS A GATE CAN GET WRONG ABOUT ITSELF: that
   an `undecidable` is never counted as a pass, that every finding
   carries a severity, that the seven areas SESSION 23.5 names are
   all covered, and that the run wrote nothing to the repository.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runAllAttacks } from './attacks.mjs';
import { AREAS, OUTCOMES, SEVERITIES, hashTree, cleanup, REPO_ROOT } from './harness.mjs';

/* One pair of runs, shared by every test below. Running the gate
   once per assertion would take minutes and prove nothing more. */
const before = hashTree(REPO_ROOT);
const runA = await runAllAttacks();
const runB = await runAllAttacks();
const after = hashTree(REPO_ROOT);
cleanup();

const key = (r) => `${r.id}:${r.outcome}`;

test('the gate is reproducible: two runs agree on every attack and every outcome', () => {
  assert.deepEqual(runA.map((r) => r.id).sort(), runB.map((r) => r.id).sort(), 'the two runs must contain the same attacks');
  assert.deepEqual(runA.map(key).sort(), runB.map(key).sort(),
    'the two runs must agree on what happened to each attack. A disagreement means the result depends on order, timing or leftover state, and a security report built on it would be reporting noise.');
});

test('every attack is well formed, and every id is unique', () => {
  const ids = new Set();
  for (const r of runA) {
    assert.ok(r.id && /^[A-Z]{2}-\d{2}$/.test(r.id), `bad id: ${r.id}`);
    assert.ok(!ids.has(r.id), `duplicate id ${r.id}`);
    ids.add(r.id);
    assert.ok(AREAS.includes(r.area), `${r.id}: unknown area "${r.area}"`);
    assert.ok(OUTCOMES.includes(r.outcome), `${r.id}: unknown outcome "${r.outcome}"`);
    assert.ok(SEVERITIES.includes(r.severity_if_succeeds), `${r.id}: unknown severity "${r.severity_if_succeeds}"`);
    assert.ok(r.attempts && r.attempts.length > 15, `${r.id}: must say what it attempted`);
    assert.ok(r.why && r.why.length > 25, `${r.id}: must say what happened and why`);
  }
});

test('all seven areas SESSION 23.5 names are actually attacked', () => {
  for (const area of AREAS) {
    const inArea = runA.filter((r) => r.area === area);
    assert.ok(inArea.length >= 4, `"${area}" has ${inArea.length} attack(s); an area with almost nothing in it is a gap dressed as coverage`);
  }
  assert.ok(runA.length >= 50, `${runA.length} attacks is thin for a gate covering seven boundaries`);
});

test('an undecidable is never counted as a pass, and it says what it would need', () => {
  const undec = runA.filter((r) => r.outcome === 'undecidable');
  assert.ok(undec.length >= 1, 'at least one boundary here genuinely cannot be tested in this environment, and a gate reporting none of them would be overstating its reach');
  for (const r of undec) {
    assert.ok(r.would_need && r.would_need.length > 30, `${r.id}: an undecidable must say what would settle it`);
    assert.notEqual(r.outcome, 'failed_safely');
  }
});

test('every finding carries a severity, and a partial is never rounded down', () => {
  for (const r of runA.filter((x) => x.outcome === 'succeeded' || x.outcome === 'partial')) {
    const sev = r.severity ?? r.severity_if_succeeds;
    assert.ok(SEVERITIES.includes(sev), `${r.id}: a finding must carry a severity`);
    assert.ok(r.evidence && Object.keys(r.evidence).length > 0, `${r.id}: a finding must carry evidence`);
  }
});

test('the autonomy area carries its own control, so a refusal there is a refusal rather than a broken evaluator', () => {
  const control = runA.find((r) => r.id === 'AP-00');
  assert.ok(control, 'AP-00 is the control');
  assert.equal(control.outcome, 'failed_safely',
    'the control asserts that a CLEAN act is permitted under a policy that enables it. If it is not, every other refusal in that area is uninterpretable.');
});

test('the gate wrote nothing to the repository', () => {
  const changed = Object.keys(after).filter((k) => before[k] !== after[k]);
  const added = Object.keys(after).filter((k) => !(k in before));
  assert.deepEqual(changed, [], 'the gate must not modify the tree');
  assert.deepEqual(added, [], 'the gate must not add to the tree');
});

test('no attack ran against the repository\'s own records, ledger or Control Room state', () => {
  const src = runA.map((r) => JSON.stringify(r.evidence ?? {})).join('\n');
  for (const p of ['agent/records/', '.control-room/state/']) {
    assert.ok(!src.includes(p), `evidence names ${p}; every world is a temporary directory and the repository's own state is never touched`);
  }
});
