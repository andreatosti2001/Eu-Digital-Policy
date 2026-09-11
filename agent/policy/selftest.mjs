/* ============================================================
   agent/policy/selftest.mjs — the twenty proofs SESSION 23 asks for,
   and nine more

       node --test agent/policy/selftest.mjs

   THE SHAPE EVERY TEST HERE IS ARRANGED AGAINST is a negative that
   passes for the wrong reason. A policy suite that only ever
   observes a refusal cannot tell "correctly refused" from
   "the evaluator threw and everything is refused" — three tests in
   `.control-room/selftest.mjs` failed in draft for exactly that
   reason. So almost every refusal below is PAIRED with a positive
   proving the same path permits somebody who is allowed, and test 1
   exists specifically to prove the permitting half works at all.

   TEST 1 IS RUN AGAINST A FIXTURE POLICY THAT IS NOT IN FORCE, and
   the same test then asserts the repository's own policy refuses the
   identical act. SESSION 23: "Do NOT enable automatic production
   merge in this session." `DEFAULT_POLICY.enabled_categories` is
   empty and this suite proves it stays empty.

   THE PROPOSALS HERE ARE NOT SIMULATED, and that needs saying.
   `agent/schemas/validate.mjs` refuses a simulated record on any
   actionable path, and so does the `schema_validation` condition, so
   a fixture marked `simulated: true` could never reach the automatic
   route and test 1 would be vacuous. The proposals below are
   therefore de-simulated — and every one of them is about THIS
   REPOSITORY: a file under docs/, a stylesheet, a module. Not one
   asserts anything about EU law, cites a legal source, or names a
   real instrument. AI-SAFE-BOUNDARIES §0.1 is about fixture data
   that reads as research; a proposal to write a note in docs/ does
   not.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { evaluate, mayExecute, ROUTES as POLICY_ROUTES, MUTATING_ACTIONS } from './engine.mjs';
import { authorizeActor, matrix, CAPABILITIES, ACTOR_KINDS, ACTIONS, ESCALATION_PARAMETERS } from './actors.mjs';
import {
  DEFAULT_POLICY, SIMULATION_POLICY, ACTION_CATEGORIES, AUTOMATABLE_CATEGORIES,
  HUMAN_ONLY_CATEGORIES, categoriseProposal, effectiveClass,
} from './categories.mjs';
import { CONDITIONS, NOT_WAIVABLE_BY_APPROVAL, VERDICTS, evaluateConditions, humanReviewTriggers } from './conditions.mjs';
import { assessRollback, ROLLBACK_ELEMENT_NAMES } from './rollback.mjs';
import { policyInForce } from './governance.mjs';

import { validate } from '../schemas/validate.mjs';
import { implementationProposalFixture, editorialProposalFixture, approvalRequestFixture } from '../schemas/fixtures.mjs';
import { proposalFingerprint } from '../implement/ledger.mjs';
import { PUBLIC_ROUTES, ROUTES as CR_ROUTES, serve } from '../../.control-room/server.mjs';
import { readConfig } from '../../.control-room/config.mjs';
import { provisionOperator } from '../../.control-room/identity.mjs';
import { permissionsOf } from '../../.control-room/authz.mjs';
import { isThreshold, thresholdProvider, controlRoomHref, THRESHOLD_TRIGGERS, passage } from '../../js/threshold.js';

const REPO = join(import.meta.dirname, '..', '..');
/* The local provider's test passphrase, the same one
   .control-room/selftest.mjs uses. Naming it PASSWORD is deliberate,
   and it costs a warning: agent/implement/boundary.mjs matches
   `password = "<12+ chars>"` and reports it as a test fixture, which
   takes the boundary check from 11 warnings to 12. It is left as it
   is rather than renamed, because renaming it would hide a
   password-shaped literal from the scanner that is meant to find
   password-shaped literals — and the value really is a passphrase in
   a published file. The rise is recorded in docs/HANDOVER.md rather
   than engineered away. */
const PASSWORD = 'a sufficiently long passphrase';
const temps = [];
const tempDir = (p = 'pol-') => { const d = mkdtempSync(join(tmpdir(), p)); temps.push(d); return d; };
process.on('exit', () => { for (const d of temps) { try { rmSync(d, { recursive: true, force: true }); } catch { /* nothing to do at exit */ } } });

const deSim = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === 'simulated' ? false : v));

/* ---------------------------------------------------------- fixtures */

/** A proposal that can reach the automatic route: one file under
 *  docs/, evidence that is a file in this repository, no
 *  interpretation, nothing blocking. */
function cleanProposal(over = {}) {
  const p = deSim(implementationProposalFixture());
  p.proposal_id = 'prop-policy-selftest-clean';
  p.agent = 'policy-selftest';
  p.risk = 'low';
  p.autonomy_class = 'autonomous';
  p.reason = 'A test fixture. It proposes writing one note under docs/, and asserts nothing about EU law.';
  p.files = ['docs/POLICY-SELFTEST-NOTE.md'];
  p.modules = [];
  p.proposed_change = {
    summary: 'Write one note under docs/.',
    operations: [{ op: 'add', target: 'docs/POLICY-SELFTEST-NOTE.md', current: null, proposed: 'a note', rationale: 'A fixture for the policy suite.' }],
    scope_note: 'docs/ only. No dataset, no page, no stylesheet, no locale.',
  };
  p.affected_entities = [{ kind: 'tool', id: null, path: 'docs/POLICY-SELFTEST-NOTE.md', field: null, note: null }];
  p.evidence = [{
    evidence_id: 'ev-1', kind: 'repository_file', source_id: null, url: null,
    locator: 'agent/policy/selftest.mjs', title: null, publisher: null,
    quote: 'This file exists in this repository.', retrieved_at: null, checksum: null,
    supports: 'supports:direct', role: 'primary', simulated: false,
  }];
  p.epistemic = {
    fact: [{ field: null, statement: 'agent/policy/selftest.mjs is a file in this repository.', evidence_refs: ['ev-1'] }],
    inference: [], interpretation: [], unresolved: [],
  };
  Object.assign(p, over);
  return p;
}

/** Facts a real run would have measured. Every one of them is
 *  supplied, and omitting any one of them is what tests 3, 5 and 6
 *  are about. */
function cleanFacts(over = {}) {
  return {
    verification: { succeeded: true, why: 'the suite supplies a successful verification.' },
    conflicts: { found: 0, why: 'the suite supplies a scan that found none.' },
    validators: { verdict: 'pass', checks: [{ name: 'tools/validate.mjs', exit_code: 0 }], blocking_findings: [] },
    context: {
      branch: 'policy-selftest-branch',
      commit: 'f'.repeat(40),
      permitted: ['docs/POLICY-SELFTEST-NOTE.md'],
      before: { 'docs/POLICY-SELFTEST-NOTE.md': { exists: false, sha256: null, bytes: 0 } },
      rollback: { method: 'git checkout <commit> -- <permitted paths>', command: 'git checkout' },
    },
    ...over,
  };
}

const applyReq = (over = {}) => ({
  actor: { kind: 'implementation_qa', id: 'implementation-qa' },
  action: 'implement.apply',
  environment: 'local',
  resource: { kind: 'report', id: 'docs/POLICY-SELFTEST-NOTE.md' },
  proposal: cleanProposal(),
  facts: cleanFacts(),
  policy: SIMULATION_POLICY,
  ...over,
});

const verdictOf = (d, name) => d.conditions.find((c) => c.condition === name)?.verdict ?? null;

/* A record store and ledger in the shape deriveApproval reads. */
const store = (proposals = [], approvals = [], decisions = []) => ({
  records: { byId: new Map(proposals.map((p) => [p.proposal_id, p])), approvalRequests: approvals, traces: ['t'] },
  ledger: { decisions, malformed: [], path: '(in memory)' },
});

/** The Control Room, running on an ephemeral loopback port, for the
 *  three tests whose claim is about an HTTP request. */
async function controlRoom({ operators = { viewer: ['viewer'], admin: ['administrator'] } } = {}) {
  const cfg = { ...readConfig({}), state_dir: tempDir('pol-state-'), records_dir: tempDir('pol-rec-'), decision_dir: tempDir('pol-dec-'), trace_dir: tempDir('pol-tr-'), port: 0 };
  const made = {};
  for (const [name, roles] of Object.entries(operators)) {
    made[name] = provisionOperator(cfg, { subject: `${name}@example.org`, roles, password: PASSWORD, createdBy: 'policy-suite' });
  }
  const server = serve({ cfg, quiet: true });
  await new Promise((ok, fail) => { server.once('listening', ok); server.once('error', fail); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    cfg, origin, operators: made,
    stop: () => new Promise((ok) => server.close(ok)),
    get: (path, cookie) => fetch(`${origin}${path}`, { headers: cookie ? { cookie } : {}, redirect: 'manual' }),
    post: (path, body, { cookie, csrf } = {}) => fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...(csrf ? { 'x-control-room-csrf': csrf } : {}) },
      body: JSON.stringify(body),
      redirect: 'manual',
    }),
    async login(name) {
      const res = await fetch(`${origin}/auth/local`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: `${name}@example.org`, password: PASSWORD }) });
      if (!res.ok) return { ok: false, status: res.status };
      const cookie = res.headers.getSetCookie()[0].split(';')[0];
      const session = await (await fetch(`${origin}/api/session`, { headers: { cookie } })).json();
      return { ok: true, cookie, csrf: session.csrf, actor: session.actor };
    },
  };
}

/* ============================================================
   1 · a permitted low-risk action executes when every condition
       passes — and does NOT under the policy this repository ships
   ============================================================ */

test('1 · every condition satisfied, and the act routes to automatic under a policy that enables its category', () => {
  const d = evaluate(applyReq());
  assert.equal(d.category.category, 'machine_derived_field', d.category.why);
  const notSatisfied = d.conditions.filter((c) => c.verdict !== 'satisfied' && c.verdict !== 'not_applicable');
  assert.deepEqual(notSatisfied.map((c) => `${c.condition}:${c.verdict}:${c.why}`), [],
    'test 1 is the only proof that the permitting half of this policy works. If it fails, every refusal below could be passing for the wrong reason.');
  assert.equal(d.route, 'automatic', d.why);
  assert.equal(d.automatic_execution_permitted, true);
  assert.equal(mayExecute(applyReq(), store()).allow, true);
});

test('1b · the SAME act is refused under the policy in force, because no category is enabled', () => {
  const d = evaluate(applyReq({ policy: DEFAULT_POLICY }));
  assert.equal(d.route, 'human_review', d.why);
  assert.equal(d.automatic_execution_permitted, false);
  assert.equal(verdictOf(d, 'category_allowed'), 'failed');
  assert.match(d.conditions.find((c) => c.condition === 'category_allowed').why, /not enabled/);
  assert.deepEqual([...DEFAULT_POLICY.enabled_categories], [],
    'SESSION 23: do not enable automatic production merge. Enabling a category is a governance change and protocol §24 forbids the system making one to itself.');
  assert.deepEqual([...DEFAULT_POLICY.automatic_path_allowlist], []);
  assert.equal(SIMULATION_POLICY.simulated, true, 'the permitting fixture must be marked as one');
});

/* ============================================================
   2 · missing provenance blocks execution
   ============================================================ */

test('2 · missing provenance blocks, and an approval does not cure it', () => {
  for (const [name, over] of [
    ['no evidence at all', { evidence: [], epistemic: { fact: [], inference: [], interpretation: [], unresolved: [] } }],
    ['a fact citing an evidence_id the record does not carry', { epistemic: { fact: [{ field: null, statement: 'x', evidence_refs: ['ev-nowhere'] }], inference: [], interpretation: [], unresolved: [] } }],
    ['no trace_ref back to the run that produced it', { trace_ref: null }],
  ]) {
    const d = evaluate(applyReq({ proposal: cleanProposal(over) }));
    assert.equal(d.route, 'blocked', `${name}: ${d.why}`);
    assert.ok(NOT_WAIVABLE_BY_APPROVAL.includes('provenance_complete'));
  }
  /* Paired positive: the clean proposal's provenance is complete. */
  assert.equal(verdictOf(evaluate(applyReq()), 'provenance_complete'), 'satisfied');
});

/* ============================================================
   3 · failed verification blocks execution
   ============================================================ */

test('3 · a failed verification blocks, and an ABSENT one blocks in the same way', () => {
  const failed = evaluate(applyReq({ facts: cleanFacts({ verification: { succeeded: false, why: 'the source did not state it' } }) }));
  assert.equal(failed.route, 'blocked');
  assert.equal(verdictOf(failed, 'verification_succeeded'), 'failed');

  const absent = evaluate(applyReq({ facts: cleanFacts({ verification: undefined }) }));
  assert.equal(absent.route, 'blocked', 'an unrun verification must not be a passed one');
  assert.equal(verdictOf(absent, 'verification_succeeded'), 'unknown');

  const contradicted = evaluate(applyReq({ facts: cleanFacts({ verification: { verdicts: [{ verdict: 'contradicted' }] } }) }));
  assert.equal(verdictOf(contradicted, 'verification_succeeded'), 'failed');
  assert.equal(verdictOf(evaluate(applyReq()), 'verification_succeeded'), 'satisfied');
});

/* ============================================================
   4 · an unresolved conflict blocks execution
   ============================================================ */

test('4 · an unresolved conflict blocks, whether it comes from the scan or from the proposal itself', () => {
  const scan = evaluate(applyReq({ facts: cleanFacts({ conflicts: { found: 1, items: [{ what: 'two sources disagree' }] } }) }));
  assert.equal(scan.route, 'blocked');
  assert.equal(verdictOf(scan, 'no_unresolved_conflict'), 'failed');

  const own = evaluate(applyReq({ proposal: cleanProposal({ conflicts: [{ what: 'the record and the source disagree' }] }) }));
  assert.equal(verdictOf(own, 'no_unresolved_conflict'), 'failed');

  const unscanned = evaluate(applyReq({ facts: cleanFacts({ conflicts: undefined }) }));
  assert.equal(verdictOf(unscanned, 'no_unresolved_conflict'), 'unknown', 'an unchecked absence of conflict is not an absence of conflict');
  assert.equal(verdictOf(evaluate(applyReq()), 'no_unresolved_conflict'), 'satisfied');
});

/* ============================================================
   5 · failed validators block execution
   ============================================================ */

test('5 · a failing validator run blocks, and so do findings, and so does a validator that could not run', () => {
  for (const [why, v] of [
    ['fail', { verdict: 'fail', blocking_findings: ['tools/validate.mjs: 1 error'] }],
    ['pass_with_findings', { verdict: 'pass_with_findings', blocking_findings: ['a sixth design-qa warning'] }],
    ['a check that could not be executed', { verdict: 'pass', checks: [{ name: 'tools/design-qa.mjs', exit_code: 127 }] }],
  ]) {
    const d = evaluate(applyReq({ facts: cleanFacts({ validators: v }) }));
    assert.equal(d.route, 'blocked', why);
    assert.equal(verdictOf(d, 'validators_pass'), 'failed', why);
  }
  const norun = evaluate(applyReq({ facts: cleanFacts({ validators: undefined }) }));
  assert.equal(verdictOf(norun, 'validators_pass'), 'unknown');
  assert.equal(norun.route, 'blocked');
  assert.equal(verdictOf(evaluate(applyReq()), 'validators_pass'), 'satisfied');
});

/* ============================================================
   6 · failed browser QA blocks execution WHERE IT IS REQUIRED
   ============================================================ */

test('6 · browser QA is required by the paths, not by the caller, and a skipped run is never a pass', () => {
  const visual = cleanProposal({
    proposal_id: 'prop-policy-selftest-visual',
    files: ['css/tools.css'],
    affected_entities: [{ kind: 'stylesheet', id: null, path: 'css/tools.css', field: null, note: null }],
    proposed_change: { summary: 'One rule in a stylesheet.', operations: [{ op: 'replace', target: 'css/tools.css', current: 'a', proposed: 'b', rationale: 'a fixture' }], scope_note: 'one sheet' },
  });
  const policy = { ...SIMULATION_POLICY, automatic_path_allowlist: ['css/'] };

  /* not supplied */
  const missing = evaluate(applyReq({ proposal: visual, policy, facts: cleanFacts({ context: { branch: 'b', commit: 'a'.repeat(40), permitted: ['css/tools.css'], before: { 'css/tools.css': { exists: true, sha256: 'a'.repeat(64), bytes: 1 } }, rollback: { method: 'git checkout' } } }) }));
  assert.equal(verdictOf(missing, 'browser_qa'), 'unknown', missing.conditions.find((c) => c.condition === 'browser_qa').why);
  assert.equal(missing.route, 'blocked');

  /* skipped is not a pass */
  const skipped = evaluate(applyReq({ proposal: visual, policy, facts: cleanFacts({ browser_qa: { ran: false, skipped: true, why: 'no browser on this machine' } }) }));
  assert.equal(verdictOf(skipped, 'browser_qa'), 'failed');
  assert.equal(skipped.route, 'blocked');

  /* failed is not a pass */
  const failed = evaluate(applyReq({ proposal: visual, policy, facts: cleanFacts({ browser_qa: { ran: true, verdict: 'fail', failures: ['nav:noscript'] } }) }));
  assert.equal(verdictOf(failed, 'browser_qa'), 'failed');

  /* and where nothing renders, it is not applicable rather than passed */
  assert.equal(verdictOf(evaluate(applyReq()), 'browser_qa'), 'not_applicable');
  const passed = evaluate(applyReq({ proposal: visual, policy, facts: cleanFacts({ browser_qa: { ran: true, verdict: 'pass' } }) }));
  assert.equal(verdictOf(passed, 'browser_qa'), 'satisfied');
});

/* ============================================================
   7 · missing rollback blocks execution
   ============================================================ */

test('7 · a rollback that is not mechanically meaningful blocks, and a boolean is not one', () => {
  /* SESSION 27 CHANGED ONE VERDICT HERE, AND ONLY ONE. With no
     change context, four of the six elements are `unknown` — not
     established — and none is `absent`. This asserted `failed`,
     which said "I have looked and it is not there" about something
     nobody had looked at, and it is this repository's §0.3 rule that
     those are different. The consequence was structural: no proposal
     could pass agent/autonomy/ gate 3, ever.
     docs/CONTINUOUS-IMPROVEMENT.md §4.

     THE ASSERTION IS NOT WEAKER. `unknown` blocks exactly as a
     failure does — the route below is still `blocked`, unchanged and
     asserted first — and the three cases that follow, which are the
     ones this test is named for, all still FAIL because each carries
     an element that is established missing. */
  const noContext = evaluate(applyReq({ facts: cleanFacts({ context: undefined }) }));
  assert.equal(noContext.route, 'blocked', 'unknown must block exactly as a failure does');
  assert.equal(verdictOf(noContext, 'rollback_mechanical'), 'unknown');

  /* And the distinction is asserted at the element level, so this
     cannot regress into "everything is unknown". */
  const nc = noContext.conditions.find((c) => c.condition === 'rollback_mechanical');
  assert.deepEqual(nc.absent, [], 'nothing is established missing before a run');
  assert.ok(nc.unknown.length >= 4, 'the elements that read a change context must be reported unknown');

  const notReversible = evaluate(applyReq({ proposal: cleanProposal({ rollback_plan: { method: 'not_reversible', steps: [], verification: null, irreversible_reason: 'it deletes a record' } }) }));
  assert.equal(verdictOf(notReversible, 'rollback_mechanical'), 'failed');
  assert.ok(notReversible.conditions.find((c) => c.condition === 'rollback_mechanical').absent.length,
    'a not_reversible plan must fail on an ESTABLISHED missing element, not merely on an unanswered one');

  const onMain = evaluate(applyReq({ facts: cleanFacts({ context: { branch: 'main', commit: 'a'.repeat(40), permitted: ['docs/x.md'], before: { 'docs/x.md': { exists: false } }, rollback: { method: 'git checkout' } } }) }));
  assert.equal(verdictOf(onMain, 'rollback_mechanical'), 'failed', 'a rollback on main is a rollback of the published site');

  const r = assessRollback({});
  assert.equal(r.mechanical, false);
  assert.deepEqual(r.missing, ROLLBACK_ELEMENT_NAMES, 'with nothing supplied, all six elements must be reported missing rather than defaulted');
  assert.equal(assessRollback({ proposal: cleanProposal(), context: cleanFacts().context }).mechanical, true);
});

/* ============================================================
   8 · out-of-scope file changes block execution
   ============================================================ */

test('8 · a path outside the allowlist is never automatic, and a change git says left its scope is blocked outright', () => {
  /* Two different failures, and the policy must not confuse them.
     A path that is merely off the automatic allowlist is the
     ordinary state of every path here: not automatic, and a person's
     to decide. A change that left the scope somebody APPROVED is a
     boundary violation, and protocol §8 says an approval does not
     cure one. */
  const outside = evaluate(applyReq({ policy: { ...SIMULATION_POLICY, automatic_path_allowlist: ['agent/'] } }));
  assert.equal(outside.route, 'human_review', outside.why);
  assert.equal(outside.automatic_execution_permitted, false);
  assert.equal(verdictOf(outside, 'scope_permitted'), 'failed');

  const neverWritable = evaluate(applyReq({ proposal: cleanProposal({ files: ['tools/_refsweep.mjs'], affected_entities: [{ kind: 'tool', id: null, path: 'tools/_refsweep.mjs', field: null, note: null }] }) }));
  assert.equal(verdictOf(neverWritable, 'scope_permitted'), 'failed');
  assert.match(neverWritable.conditions.find((c) => c.condition === 'scope_permitted').closes, /SWEEP|Class D/);

  const crept = evaluate(applyReq({ facts: cleanFacts({ scope_enforcement: { ok: false, outside: [{ path: 'data/claims.json' }] } }) }));
  assert.equal(verdictOf(crept, 'scope_permitted'), 'failed');
  assert.equal(crept.route, 'blocked');
  assert.equal(verdictOf(evaluate(applyReq()), 'scope_permitted'), 'satisfied');
});

/* ============================================================
   9 · legal interpretation cannot auto-merge
   ============================================================ */

test('9 · a proposal carrying an interpretation can never reach the automatic route, whatever it declares', () => {
  const interp = cleanProposal({
    autonomy_class: 'autonomous',
    risk: 'low',
    epistemic: {
      fact: [{ field: null, statement: 'agent/policy/selftest.mjs is a file in this repository.', evidence_refs: ['ev-1'] }],
      inference: [],
      interpretation: [{ field: null, statement: 'On this reading, the provision requires the operator to act.', held_by: 'policy-selftest', basis: 'A fixture. It rests on nothing and asserts nothing about any act.', contested: true }],
      unresolved: [],
    },
  });
  const d = evaluate(applyReq({ proposal: interp }));
  assert.equal(d.category.category, 'legal_interpretation', d.category.why);
  assert.equal(d.automatic_execution_permitted, false);
  assert.equal(d.route, 'human_review', d.why);
  assert.ok(d.human_review_triggers.some((t) => t.trigger === 'legal_interpretation'));
  assert.equal(ACTION_CATEGORIES.legal_interpretation.automatable, false);
  /* Even a policy that tried to enable it cannot: the category is
     not automatable, and the condition reads that rather than the
     enabled list. */
  const forced = evaluate(applyReq({ proposal: interp, policy: { ...SIMULATION_POLICY, enabled_categories: ['legal_interpretation'] } }));
  assert.equal(forced.automatic_execution_permitted, false);
  assert.match(forced.conditions.find((c) => c.condition === 'category_allowed').why, /no policy may automate/);
});

/* ============================================================
   10 · substantive editorial changes cannot auto-merge
   ============================================================ */

test('10 · an editorial change to the brief cannot auto-merge, and neither can a locale', () => {
  const ed = deSim(editorialProposalFixture());
  ed.agent = 'editorial';
  const d = evaluate(applyReq({ proposal: ed, facts: cleanFacts() }));
  assert.equal(d.automatic_execution_permitted, false);
  /* It categorises as `legal_interpretation` rather than
     `substantive_editorial_change`, because the fixture carries an
     interpretation in its own epistemic block and the categoriser
     reads that before it reads the contract. Both are human-only, so
     the route is the same; the test asserts the property that
     matters and names the one that surprised it. */
  assert.equal(ACTION_CATEGORIES[d.category.category].automatable, false, d.category.why);
  assert.ok(d.human_review_triggers.some((t) => t.trigger === 'substantive_editorial_change'),
    'whatever the category, an EditorialProposal must fire the editorial trigger');

  const locale = cleanProposal({ files: ['i18n/it.json'], affected_entities: [{ kind: 'locale', id: null, path: 'i18n/it.json', field: null, note: null }] });
  const l = evaluate(applyReq({ proposal: locale, policy: { ...SIMULATION_POLICY, automatic_path_allowlist: ['i18n/'] } }));
  assert.equal(l.category.category, 'substantive_editorial_change');
  assert.equal(l.automatic_execution_permitted, false);
});

/* ============================================================
   11 · schema changes cannot auto-merge
   ============================================================ */

test('11 · a change to a contract, a validator or the taxonomy cannot auto-merge', () => {
  const cases = [
    ['agent/schemas/types.mjs', 'schema_change'],
    ['tools/design-qa.mjs', 'schema_change'],
    ['data/taxonomy.json', 'taxonomy_change'],
    ['.github/workflows/qa.yml', 'architecture_change'],
  ];
  for (const [path, expected] of cases) {
    const p = cleanProposal({ files: [path], affected_entities: [{ kind: 'tool', id: null, path, field: null, note: null }] });
    const d = evaluate(applyReq({ proposal: p, policy: { ...SIMULATION_POLICY, automatic_path_allowlist: ['agent/', 'tools/', 'data/', '.github/'] } }));
    assert.equal(d.category.category, expected, `${path}: ${d.category.why}`);
    assert.equal(d.automatic_execution_permitted, false, path);
  }
});

/* ============================================================
   12 · deletion cannot auto-merge
   ============================================================ */

test('12 · any removal is a deletion, and a deletion is never automatic', () => {
  const del = cleanProposal({
    proposed_change: { summary: 'Remove a note.', operations: [{ op: 'remove', target: 'docs/POLICY-SELFTEST-NOTE.md', current: 'a note', proposed: null, rationale: 'a fixture' }], scope_note: 'docs/ only' },
  });
  const d = evaluate(applyReq({ proposal: del }));
  assert.equal(d.category.category, 'deletion', d.category.why);
  assert.equal(d.automatic_execution_permitted, false);
  assert.ok(d.human_review_triggers.some((t) => t.trigger === 'deletion'));

  /* Writing over a verification note is a deletion too: what is lost
     is the record of what was not known. */
  const overwrite = cleanProposal({ provenance_disposition: [{ field: 'verification_note', disposition: 'replaced_human_only', current: 'the old note', why: 'a fixture' }] });
  assert.equal(categoriseProposal(overwrite).category, 'deletion');
});

/* ============================================================
   13 · a forged approval cannot authorize execution
   ============================================================ */

test('13 · an approval written by an agent into agent/records/ authorizes nothing, and is reported', () => {
  const p = cleanProposal();
  const forged = deSim(approvalRequestFixture());
  forged.approval_id = 'appr-forged';
  forged.proposal_ids = [p.proposal_id];
  forged.agent = 'policy-selftest';
  forged.state = 'granted';
  forged.decision = { decided_by: 'a plausible human name', decided_at: '2026-09-08T00:00:00.000Z', note: 'looks official' };

  const ctx = store([p], [forged]);
  const x = mayExecute(applyReq({ policy: DEFAULT_POLICY }), ctx);
  assert.equal(x.allow, false, 'a grant claimed in the agent record store must not authorise anything');
  assert.equal(x.approval.state, 'pending');
  assert.ok(x.approval.discarded.length >= 1, 'the discarded claim must be reported, not silently ignored');
  assert.match(x.approval.discarded[0].why, /agent\/records\//);

  /* And the function offers no way to hand it one. */
  const forcedIn = mayExecute({ ...applyReq({ policy: DEFAULT_POLICY }), approval: { state: 'granted' }, approved: true, force: true }, ctx);
  assert.equal(forcedIn.allow, false, 'there is no parameter through which an approval can be supplied, and adding one to the request must change nothing');
});

/* ============================================================
   14 · frontend / UI state cannot bypass the policy
   ============================================================ */

test('14 · nothing the interface says is read by the policy', () => {
  const uiClaims = {
    ui_approved: true, approved_in_ui: true, button_was_visible: true,
    localStorage: { approved: true }, client_state: { role: 'administrator' },
    visibleActions: { approve: true }, csrf: 'anything',
  };
  const d = evaluate({ ...applyReq({ policy: DEFAULT_POLICY }), ...uiClaims });
  assert.equal(d.automatic_execution_permitted, false);
  assert.equal(d.route, 'human_review');
  assert.equal(mayExecute({ ...applyReq({ policy: DEFAULT_POLICY }), ...uiClaims }, store()).allow, false);

  /* A viewer who claims a role in the request body is still a
     viewer: the roles come from the actor the server resolved. */
  const claimed = authorizeActor({
    actor: { kind: 'human', id: 'viewer@example.org', roles: ['viewer'] },
    action: 'proposal.approve', resource: { kind: 'agent_record' }, environment: 'control_plane',
    controlRoomPermission: 'proposal:approve',
    client_state: { roles: ['administrator'] },
  });
  assert.equal(claimed.allow, false);
  assert.match(claimed.reason, /viewer/);
});

/* ============================================================
   15 · unauthorized actors cannot approve proposals
   ============================================================ */

test('15 · a viewer cannot approve and an administrator can, over real HTTP as well as in the matrix', async () => {
  /* In the matrix. */
  const viewer = authorizeActor({ actor: { kind: 'human', id: 'v', roles: ['viewer'] }, action: 'proposal.approve', resource: { kind: 'agent_record' }, environment: 'control_plane', controlRoomPermission: 'proposal:approve' });
  assert.equal(viewer.allow, false);
  const admin = authorizeActor({ actor: { kind: 'human', id: 'a', roles: ['administrator'] }, action: 'proposal.approve', resource: { kind: 'agent_record' }, environment: 'control_plane', controlRoomPermission: 'proposal:approve' });
  assert.equal(admin.allow, true, 'the paired positive: an authorization test that only ever sees a refusal cannot tell "refused" from "broken"');
  assert.ok(permissionsOf(['viewer']).length > 0, 'a viewer holds read permissions — the refusal above is about approval, not about having no identity');

  /* Over HTTP. */
  const cr = await controlRoom();
  try {
    const anon = await cr.post('/api/review', { action: 'approve', proposal_id: 'anything', fingerprint: 'x' });
    assert.ok([401, 403].includes(anon.status), `anonymous approval must be refused, got ${anon.status}`);
    const v = await cr.login('viewer');
    assert.equal(v.ok, true);
    const asViewer = await cr.post('/api/review', { action: 'approve', proposal_id: 'anything', fingerprint: 'x' }, { cookie: v.cookie, csrf: v.csrf });
    assert.equal(asViewer.status, 403, 'a logged-in viewer is authenticated and not authorized, and those are different controls');
  } finally { await cr.stop(); }
});

/* ============================================================
   16 · public clients cannot invoke privileged operations
   ============================================================ */

test('16 · the public client holds nothing, for every action this policy defines', () => {
  assert.deepEqual(CAPABILITIES.public_client.capabilities, [], 'the public website is an untrusted environment (protocol §10)');
  for (const action of ACTIONS) {
    const d = authorizeActor({ actor: { kind: 'public_client', id: 'browser' }, action, environment: 'public_site' });
    assert.equal(d.allow, false, `public_client must not hold "${action}"`);
  }
  for (const action of MUTATING_ACTIONS) {
    const e = evaluate({ actor: { kind: 'public_client', id: 'browser' }, action, environment: 'public_site', proposal: cleanProposal(), policy: SIMULATION_POLICY, facts: cleanFacts() });
    assert.equal(e.route, 'blocked', `${action} from a public client must be blocked before the conditions are even considered`);
    assert.deepEqual(e.conditions, [], 'an unauthorized actor is refused without evaluating the conditions, so the report cannot read as though the conditions were the only problem');
  }
});

test('16b · no privileged route on the Control Room answers a request with no session', async () => {
  const cr = await controlRoom();
  try {
    const priv = CR_ROUTES.filter((r) => !r.public && r.permission);
    assert.ok(priv.length >= 6);
    for (const r of priv) {
      const res = r.method === 'GET' ? await cr.get(r.path) : await cr.post(r.path, {});
      assert.ok([401, 403, 302].includes(res.status), `${r.method} ${r.path} answered ${res.status} to an anonymous request`);
    }
  } finally { await cr.stop(); }
});

/* ============================================================
   17 · an agent cannot escalate its permissions through another
   ============================================================ */

test('17 · there is no parameter through which a privilege travels, and the attempt is recorded', () => {
  for (const param of ESCALATION_PARAMETERS) {
    const d = authorizeActor({
      actor: { kind: 'specialist_agent', id: 'editorial' },
      action: 'implement.apply', environment: 'local', resource: { kind: 'canonical_data' },
      [param]: 'implementation-qa',
    });
    assert.equal(d.allow, false, `"${param}" must not carry a capability`);
    assert.ok(d.escalation_attempt.some((e) => e.parameter === param), `"${param}" must be reported, not silently dropped`);
  }
  /* The Orchestrator cannot implement by routing to itself, and the
     Implementer cannot approve by being asked to. */
  assert.equal(authorizeActor({ actor: { kind: 'orchestrator', id: 'o' }, action: 'implement.apply', environment: 'local' }).allow, false);
  assert.equal(authorizeActor({ actor: { kind: 'implementation_qa', id: 'a9' }, action: 'proposal.approve', environment: 'local' }).allow, false);
  assert.equal(authorizeActor({ actor: { kind: 'implementation_qa', id: 'a9' }, action: 'ledger.write', environment: 'local' }).allow, false);
  assert.equal(authorizeActor({ actor: { kind: 'deployment_system', id: 'pages' }, action: 'deploy.publish', environment: 'production' }).allow, false);
  /* Paired positive: the same actor's own capability still works. */
  assert.equal(authorizeActor({ actor: { kind: 'specialist_agent', id: 'editorial' }, action: 'proposal.create', resource: { kind: 'agent_record' }, environment: 'local', path: 'agent/records/x.jsonl' }).allow, true);
});

/* ============================================================
   18 · discovering the hidden Control Room entry cannot bypass
        authentication
   ============================================================ */

test('18 · the threshold carries no authentication, and the login route is protected independently of it', async () => {
  const src = readFileSync(join(REPO, 'js', 'threshold.js'), 'utf8');
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie', 'Authorization', 'Bearer', 'password', 'csrf']) {
    assert.ok(!src.includes(forbidden), `js/threshold.js must not contain "${forbidden}" — it is a UX event and nothing else`);
  }
  /* It cannot invent an address, and these pages declare none. */
  assert.equal(controlRoomHref({ querySelector: () => null }), null);
  for (const page of readdirSync(REPO).filter((f) => f.endsWith('.html'))) {
    assert.ok(!readFileSync(join(REPO, page), 'utf8').includes('eu-control-room'),
      `${page} declares a control-plane address. Publishing one is not a vulnerability — protocol §10 says obscurity is not a control — but this deployment has not chosen to.`);
  }
  /* And with no document at all, the passage does nothing rather
     than throwing: no state anywhere depends on it. */
  assert.equal(typeof document, 'undefined');
  assert.equal(passage(), null);

  /* The login boundary holds for somebody who arrived through the
     threshold in exactly the way it holds for somebody who typed the
     URL, because the threshold sends a browser to a URL and nothing
     else travels with it. */
  const cr = await controlRoom();
  try {
    const root = await cr.get('/');
    assert.ok([302, 401, 403].includes(root.status), `GET / answered ${root.status} to an anonymous request`);
    const queue = await cr.get('/api/queue');
    assert.ok([401, 403].includes(queue.status));
    const login = await cr.get('/login');
    assert.equal(login.status, 200, 'the paired positive: the login page itself must answer, or the refusals above prove nothing');
  } finally { await cr.stop(); }
});

/* ============================================================
   19 · the hidden search trigger does not expose privileged state
   ============================================================ */

test('19 · the trigger produces one inert result and nothing else', () => {
  assert.deepEqual(thresholdProvider('gdpr'), [], 'every other query must get nothing from this module');
  assert.deepEqual(thresholdProvider(''), []);
  assert.deepEqual(thresholdProvider('thirty-two path'), [], 'the trigger is the exact phrase, not a prefix');

  const groups = thresholdProvider(THRESHOLD_TRIGGERS[0]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, 1);
  const item = groups[0].items[0];
  assert.deepEqual(Object.keys(item).sort(), ['action', 'kind', 'mark', 'sub', 'title']);
  assert.equal(typeof item.action, 'function');
  assert.ok(!/token|session|approval|operator|proposal|secret/i.test(`${item.title} ${item.sub}`),
    'the one result must carry no privileged word, because it carries no privileged anything');
  for (const t of THRESHOLD_TRIGGERS) assert.equal(isThreshold(t), true);
  assert.equal(isThreshold('THIRTY-TWO PATHS'), true, 'case and spacing are normalised; nothing else is');
  assert.equal(isThreshold('paths'), false);
});

/* ============================================================
   20 · direct access to the Control Room is governed independently
        of the public site's discovery mechanism
   ============================================================ */

test('20 · the Control Room\'s public surface is the login surface, and nothing about the threshold widens it', async () => {
  /* The route table is the claim, and it is data. */
  const publicRoutes = CR_ROUTES.filter((r) => r.public);
  const LOGIN_SURFACE = ['/login', '/login.css', '/login.js', '/auth/providers', '/auth/local', '/auth/login', '/auth/callback', '/healthz'];
  for (const r of publicRoutes) {
    assert.ok(LOGIN_SURFACE.includes(r.path), `"${r.path}" is public and is not on the login surface. /healthz is on it deliberately — it returns {"status":"ok"} and no system information — and anything else appearing here is a widening of the public surface.`);
    assert.equal(r.permission ?? null, null, `a public route must require no permission; "${r.path}" names one`);
  }
  assert.deepEqual(publicRoutes.map((r) => r.path).sort(), [...LOGIN_SURFACE].sort(),
    'the public surface must be exactly this list — a route added to it is a decision, not a detail');
  assert.ok(!PUBLIC_ROUTES.some((r) => r.includes('/api/queue') || r.includes('/api/audit') || r.includes('/api/review')));

  /* No route anywhere mentions the threshold: the discovery
     mechanism has no server-side counterpart, which is what stops it
     becoming an alternate privileged API. */
  for (const r of CR_ROUTES) {
    assert.ok(!/threshold|paths|yetzirah|passage/i.test(r.path), `the Control Room must not carry a route for the discovery mechanism: "${r.path}"`);
  }
  const crSrc = readdirSync(join(REPO, '.control-room')).filter((f) => f.endsWith('.mjs'))
    .map((f) => readFileSync(join(REPO, '.control-room', f), 'utf8')).join('\n');
  assert.ok(!/threshold|thirty-two/i.test(crSrc), 'no server-side code may read the trigger phrase. If it did, the phrase would be a credential.');

  const cr = await controlRoom();
  try {
    /* The phrase, sent to the Control Room in every shape somebody
       might try. None of it is a way in. */
    for (const path of ['/api/queue?q=thirty-two%20paths', '/login?threshold=thirty-two+paths', '/api/session?paths=32']) {
      const res = await cr.get(path);
      assert.ok(res.status !== 200 || path.startsWith('/login'), `${path} answered 200`);
      if (path.startsWith('/api/')) assert.ok([401, 403].includes(res.status), `${path} answered ${res.status}`);
    }
  } finally { await cr.stop(); }
});

/* ============================================================
   21–29 · the policy's own integrity
   ============================================================ */

test('20b · a condition that returned a verdict the engine cannot read fails closed rather than passing silently', () => {
  assert.deepEqual(VERDICTS, ['satisfied', 'failed', 'unknown', 'not_applicable']);
  /* The real proof is the guard in evaluateConditions(): every
     verdict is checked against that list on every evaluation, and an
     unrecognised one throws. This is the defect test 5 found — a
     `data` key named `verdict` overwrote a condition's own — turned
     into something that cannot recur. */
  const d = evaluate(applyReq({ facts: cleanFacts({ validators: { verdict: 'fail', blocking_findings: ['x'] } }) }));
  assert.equal(verdictOf(d, 'validators_pass'), 'failed');
  assert.equal(d.conditions.find((c) => c.condition === 'validators_pass').run_verdict, 'fail',
    'the validator run\'s own verdict is still reported — under a name that cannot collide with the condition\'s');
});

test('21 · the twelve conditions are all evaluated, always, and every one of them has a reason', () => {
  const d = evaluate(applyReq({ policy: DEFAULT_POLICY }));
  assert.deepEqual(d.conditions.map((c) => c.condition), CONDITIONS);
  for (const c of d.conditions) {
    assert.ok(c.why && c.why.length > 20, `${c.condition} must say why`);
    if (c.verdict === 'failed' || c.verdict === 'unknown') assert.ok(c.closes && c.closes.length > 20, `${c.condition} must say what would close it`);
  }
});

test('22 · an absent fact is unknown and unknown never executes', () => {
  const d = evaluate({ actor: { kind: 'implementation_qa', id: 'a9' }, action: 'implement.apply', environment: 'local', proposal: cleanProposal(), policy: SIMULATION_POLICY });
  assert.ok(d.unknown.length >= 3, `supplying no facts must produce unknowns, got ${JSON.stringify(d.unknown)}`);
  assert.equal(d.route, 'blocked');
  assert.equal(d.automatic_execution_permitted, false);
});

test('23 · the effective autonomy class is the stricter of the declared one and the one the category implies', () => {
  const p = cleanProposal({ autonomy_class: 'autonomous' });
  assert.equal(effectiveClass(p, 'machine_derived_field').effective, 'review_required');
  assert.equal(effectiveClass(p, 'deletion').effective, 'human_only');
  assert.equal(effectiveClass({ autonomy_class: 'human_only' }, 'machine_derived_field').effective, 'human_only');
  assert.equal(effectiveClass({}, 'machine_derived_field').effective, 'human_only', 'a proposal that declares nothing takes the strictest class');
});

test('24 · a category nobody wrote a rule for is uncategorised, and uncategorised never executes', () => {
  const odd = cleanProposal({ contract: 'ImplementationProposal', files: ['README.md'], affected_entities: [{ kind: 'tool', id: null, path: 'README.md', field: null, note: null }], proposed_change: { summary: 'x', operations: [{ op: 'replace', target: 'README.md', current: 'a', proposed: 'b', rationale: 'x' }], scope_note: 'x' } });
  const c = categoriseProposal(odd);
  assert.equal(c.category, 'uncategorised', c.why);
  assert.equal(ACTION_CATEGORIES.uncategorised.automatable, false);
});

test('25 · every category declares what it is, what it costs, and whether any policy may automate it', () => {
  for (const [name, meta] of Object.entries(ACTION_CATEGORIES)) {
    assert.ok(meta.what && meta.what.length > 30, `${name}.what`);
    assert.ok(meta.costs && meta.costs.length > 20, `${name}.costs`);
    assert.equal(typeof meta.automatable, 'boolean', `${name}.automatable`);
    if (!meta.automatable) assert.ok(meta.human_review, `${name} must name the clause that reserves it`);
  }
  /* FIVE, not four. The first version of this assertion said four
     and it was wrong: protocol §20 names five, and the fifth —
     governed_metadata_maintenance — was missing from
     ACTION_CATEGORIES until SESSION 22's independent list of the
     same five was merged in and disagreed. A sixth is a governance
     change. */
  assert.equal(AUTOMATABLE_CATEGORIES.length, 5, 'protocol §20 names five, and a sixth is a governance change');
  assert.ok(HUMAN_ONLY_CATEGORIES.length >= 13);
});

test('26 · a read is not put through the twelve conditions, and a write always is', () => {
  const read = evaluate({ actor: { kind: 'specialist_agent', id: 'scout' }, action: 'observe.read', environment: 'local', resource: { kind: 'canonical_data' } });
  assert.equal(read.route, 'automatic');
  assert.deepEqual(read.conditions, []);
  for (const action of MUTATING_ACTIONS) assert.ok(MUTATING_ACTIONS.includes(action));
  const write = evaluate(applyReq({ policy: DEFAULT_POLICY }));
  assert.equal(write.conditions.length, CONDITIONS.length);
});

test('27 · the matrix is complete: every actor has a verdict for every action', () => {
  const rows = matrix();
  for (const kind of ACTOR_KINDS) {
    for (const action of ACTIONS) {
      const r = rows.filter((x) => x.actor === kind && x.action === action);
      assert.equal(r.length, 1, `${kind} × ${action} must have exactly one verdict, has ${r.length}`);
      assert.ok(['permitted', 'never', 'denied_by_default'].includes(r[0].verdict));
    }
  }
  assert.equal(POLICY_ROUTES.length, 3);
});

test('28 · the proposals this suite uses satisfy their own contracts, so the tests are not vacuous', () => {
  for (const p of [cleanProposal(), cleanProposal({ files: ['css/tools.css'] })]) {
    assert.deepEqual(validate(p, { allowSimulated: false }), [], 'a fixture that no longer satisfies its contract would make every assertion about it meaningless');
  }
  assert.equal(typeof proposalFingerprint(cleanProposal()), 'string');
});

test('29 · nothing in this suite wrote to the repository', () => {
  const before = readFileSync(join(REPO, 'agent', 'policy', 'categories.mjs'), 'utf8');
  evaluate(applyReq());
  mayExecute(applyReq(), store());
  assert.equal(readFileSync(join(REPO, 'agent', 'policy', 'categories.mjs'), 'utf8'), before);
  assert.deepEqual([...DEFAULT_POLICY.enabled_categories], [], 'and the policy in force is still empty at the end of the run');
});

/* ============================================================
   30 · the policy is enforced, not merely written down
   ============================================================ */

test('30 · the implementation layer calls the policy, twice, and refuses on a blocked route', () => {
  const impl = readFileSync(join(REPO, 'agent', 'implement', 'implementer.mjs'), 'utf8');
  assert.ok(impl.includes("from '../policy/engine.mjs'"), 'SESSION 23: do not implement the policy solely as documentation. The implementation layer must import it.');
  const calls = (impl.match(/evaluatePolicy\(/g) ?? []).length;
  assert.ok(calls >= 2, `the implementer must evaluate the policy before writing and again on the measured facts; found ${calls} call(s)`);
  assert.ok(/policyBefore\.route === 'blocked'/.test(impl), 'a blocked route before the change must be a refusal');
  assert.ok(/policyAfter\.route === 'blocked'/.test(impl), 'a blocked route on the measured facts must be a reason to revert');

  /* This is a source assertion, and it is weaker than a behavioural
     one. It is here because `Implementer` reads its record store
     from a module-level default with no injection point, so there is
     no way to drive it against a fixture store from this suite
     without changing that — which is a change to Agent 9, not to the
     policy. What CAN be proved behaviourally is the call itself, so
     it is: the exact request shape the implementer builds, against
     the policy in force, on a proposal that carries an
     interpretation. */
  const asImplementer = evaluate({
    actor: { kind: 'implementation_qa', id: 'implementation-qa' },
    action: 'implement.apply',
    environment: 'local',
    resource: { kind: 'canonical_data', id: 'prop-policy-selftest-clean' },
    proposal: cleanProposal({ evidence: [], epistemic: { fact: [], inference: [], interpretation: [], unresolved: [] } }),
    policy: DEFAULT_POLICY,
    facts: {},
  });
  assert.equal(asImplementer.route, 'blocked');
});

test('31 · the policy suite is registered where every other agent suite is, so it runs in CI', () => {
  const checks = readFileSync(join(REPO, 'agent', 'implement', 'checks.mjs'), 'utf8');
  assert.ok(checks.includes('agent/policy/selftest.mjs'), 'a suite Agent 9 does not run is a suite a change to agent/ does not run');
  const workflow = readFileSync(join(REPO, '.github', 'workflows', 'qa.yml'), 'utf8');
  assert.ok(workflow.includes('agent/policy/selftest.mjs'), 'and a suite CI does not run is a suite nobody runs');
  /* SESSION 23.5's gate as well: a verification that only runs when
     somebody remembers is a verification that stops running. */
  assert.ok(checks.includes('agent/policy/verify/selftest.mjs'));
  assert.ok(workflow.includes('agent/policy/verify/selftest.mjs'));
});

/* ============================================================
   32 · ONE HOME — the Orchestrator does not keep a second copy
   ============================================================ */

test('32 · the Orchestrator re-exports the policy vocabulary rather than restating it', async () => {
  const orch = await import('../orchestrator/policy.mjs');

  /* The three facts that were duplicated when SESSIONS 22 and 23 were
     merged. Each is now a view onto agent/policy/, and this test is
     the drift check docs/DATA-GOVERNANCE.md §5 requires of anything
     that looks like a second copy. */
  assert.deepEqual([...orch.MANDATORY_AUTONOMY_CONDITIONS], [...CONDITIONS],
    'the twelve conditions have one home. They were written out twice, in the same order with seven different spellings, and the spellings agent/policy/ returns are the ones the verification gate attacks.');
  assert.deepEqual([...orch.LOW_RISK_CATEGORIES], [...AUTOMATABLE_CATEGORIES],
    'protocol §20\'s categories have one home. The two branches drifted by an entry — this list had five and ACTION_CATEGORIES had four — which is exactly what a second home produces.');
  assert.deepEqual([...orch.APPROVED_AUTONOMOUS_CATEGORIES], [...DEFAULT_POLICY.enabled_categories]);
  assert.deepEqual([...orch.APPROVED_AUTONOMOUS_CATEGORIES], [],
    'and it is still empty on both sides of the view');

  /* The module must not have grown a literal list back. Asserted
     against the source, because a re-export that was quietly turned
     into an array literal again would pass every assertion above on
     the day it was written and drift the week after. */
  const src = readFileSync(join(REPO, 'agent', 'orchestrator', 'policy.mjs'), 'utf8');
  assert.ok(src.includes("from '../policy/conditions.mjs'"), 'it must import the conditions');
  assert.ok(src.includes("from '../policy/categories.mjs'"), 'it must import the categories');
  assert.ok(!/MANDATORY_AUTONOMY_CONDITIONS = Object\.freeze\(\[\s*'/.test(src),
    'MANDATORY_AUTONOMY_CONDITIONS must be a view, not a literal list');
  assert.ok(!/LOW_RISK_CATEGORIES = Object\.freeze\(\[\s*'/.test(src),
    'LOW_RISK_CATEGORIES must be a view, not a literal list');
});

test('33 · the Orchestrator enforces the policy engine, and cannot permit what the engine refuses', async () => {
  const orch = await import('../orchestrator/policy.mjs');
  const src = readFileSync(join(REPO, 'agent', 'orchestrator', 'policy.mjs'), 'utf8');
  assert.ok(src.includes("from '../policy/engine.mjs'"),
    'SESSION 23: "the implementation layer AND Orchestrator must enforce it mechanically". The implementation layer has since SESSION 23; this is the other half.');

  /* Behaviourally: a proposal the engine refuses cannot come back
     permitted, however the workflow conditions read. */
  const refused = orch.autonomyPermits({ proposal: cleanProposal(), records: [], conflicts: [] });
  assert.equal(refused.permitted, false);
  assert.equal(refused.policy_engine.permitted, false);
  /* SESSION 26: the Orchestrator asks the engine about the POLICY IN
     FORCE — the base plus every active governance grant — not the
     base. Asserting the base id here would now assert that the
     Orchestrator enforces a weaker policy than the implementation
     layer, which is the drift this test exists to prevent. What is
     asserted instead is stronger: the id must be the in-force one,
     and it must EXTEND the base rather than replace it, so a grant
     can never substitute a policy of its own. */
  const inForceId = policyInForce().policy.policy_id;
  assert.equal(refused.policy_engine.policy_id, inForceId);
  assert.ok(inForceId.startsWith(DEFAULT_POLICY.policy_id),
    'the policy in force always begins with the base policy id: a grant adds to the base, it does not replace it');
  assert.ok(refused.policy_engine.route, 'the engine\'s route must be reported, not swallowed');

  /* And the twelve stay twelve: the engine's verdict is reported
     beside them, never as a thirteenth protocol §18 condition. */
  assert.deepEqual(refused.conditions.map((c) => c.condition), [...CONDITIONS]);

  /* THE ENGINE MUST HAVE ACTUALLY EVALUATED SOMETHING. The first
     version of this wiring asked the engine about the ORCHESTRATOR's
     act of enforcing the policy — a read — and `evaluate()` routes a
     read straight to "automatic" without touching the twelve. It came
     back permitted having checked nothing, and this assertion is what
     caught it: a refusal with no failed and no unknown condition is a
     refusal that did not look. */
  assert.ok(refused.policy_engine.failed.length + refused.policy_engine.unknown.length > 0,
    'the engine must report which conditions it refused on. A route with an empty verdict means it was asked about the wrong act.');
  assert.notEqual(refused.policy_engine.route, 'automatic');
});
