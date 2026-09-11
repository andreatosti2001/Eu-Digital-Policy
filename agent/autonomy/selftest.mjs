/* ============================================================
   agent/autonomy/selftest.mjs — the suite for the first thing here
   that can write a file without a person

     node --test agent/autonomy/selftest.mjs

   TWO SHAPES THIS SUITE IS ARRANGED TO AVOID, both of which this
   repository has been caught by before.

   A TEST THAT PASSES BECAUSE NOTHING HAPPENED. Every refusal is
   paired with a positive proving the same path works when it should.
   That is not decoration here: autonomy is switched off by default,
   so a suite written carelessly would consist entirely of refusals
   and could not tell "correctly refused" from "broken". So there is a
   FIXTURE GRANT — written to a temporary directory, never to the
   repository's own ledger — under which an eligible proposal reaches
   `automatic`, and every refusal is checked against it.

   A TEST THAT WRITES TO THE REPOSITORY. Nothing here touches
   `agent/policy/governance/grants.jsonl`, `agent/autonomy/actions/`,
   the working tree or git. Every grant ledger is a mkdtemp, every
   action ledger is a mkdtemp, and the last test checks `git status`
   from outside to prove it.

   THE FIXTURE IS ABOUT `docs/` AND A FILE THAT DOES NOT EXIST.
   Nothing in this file asserts anything about EU law, no fixture
   carries a citation, and no test applies an operation to a real
   dataset.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync, appendFileSync as fsAppend, mkdirSync as fsMkdir } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  recordGrant, readGrantLedger, activeGrants, policyInForce, validateGrant,
  governanceSelfCheck, describeGovernance, fieldsPermitted, fieldOf, datasetOf,
  GrantRefused, AUTOMATIC_ELIGIBLE_PATHS, NEVER_AUTOMATIC_PATHS, NEVER_AUTOMATIC_FIELDS,
  GRANTABLE_FIELDS, GRANTABLE_ENVIRONMENTS, GRANT_RISK_CEILING, grantId,
} from '../policy/governance.mjs';
import { DEFAULT_POLICY, AUTOMATABLE_CATEGORIES, HUMAN_ONLY_CATEGORIES, ACTION_CATEGORIES } from '../policy/categories.mjs';
import { evaluate } from '../policy/engine.mjs';
import { autonomyGates, runCycle, surveyAutonomy, commitMessage, CYCLE_STEPS, GATES_REPLACED_BY_GRANT, MEASURED_CONDITIONS, AUTONOMY_ACTOR } from './cycle.mjs';
import {
  cutBranch, commitChange, mergeBack, abandon, branchExists, currentBranch, currentCommit,
  FORBIDDEN_BRANCHES, IsolationRefused,
} from './isolate.mjs';
import { ACTION_OUTCOMES, recordAction, readActions, summariseActions, rollbackInformation, actionId } from './ledger.mjs';
import { verificationFact, conflictFact, deriveFacts, CONFIRMING_VERDICTS } from './facts.mjs';
import { AGENT_SUITES } from '../implement/checks.mjs';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { GATES } from '../implement/preflight.mjs';
import { FIXTURES } from '../schemas/fixtures.mjs';

/* ============================================================
   Fixtures
   ============================================================ */

const NOW = '2026-09-09T12:00:00Z';
const LATER = '2027-03-09T00:00:00Z';
const PERSON = 'a-named-person-who-is-not-an-agent';

const tmp = () => mkdtempSync(join(tmpdir(), 'autonomy-suite-'));

/** A grant that would be honoured: five §20 categories, two eligible
 *  paths, a field allowlist, `low`, no production, and an expiry. */
const goodGrant = (over = {}) => ({
  action: 'enable',
  categories: ['machine_derived_field', 'source_metadata_maintenance'],
  path_allowlist: ['docs/', 'data/sources.json'],
  field_allowlist: { 'data/sources.json': ['url_status', 'last_retrieved'] },
  max_automatic_risk: 'low',
  environments: ['local', 'ci'],
  decided_by: PERSON,
  decided_at: NOW,
  expires_at: LATER,
  authority: 'a fixture grant, written to a temporary directory by this suite. It is not in force anywhere.',
  ...over,
});

/** A proposal about a docs/ file that does not exist. Derived
 *  category: machine_derived_field. */
function docsProposal(over = {}) {
  return {
    ...FIXTURES.ImplementationProposal(),
    agent: 'implementation-qa',
    proposal_id: 'prop-autonomy-suite-0001',
    simulated: false,
    risk: 'low',
    autonomy_class: 'review_required',
    affected_entities: [{ kind: 'document', id: null, path: 'docs/EXAMPLE-DOES-NOT-EXIST.md', field: null, note: null }],
    files: ['docs/EXAMPLE-DOES-NOT-EXIST.md'],
    modules: [],
    proposed_change: {
      summary: 'a fixture change to a docs/ file that does not exist',
      operations: [{ op: 'add', target: 'docs/EXAMPLE-DOES-NOT-EXIST.md', current: null, proposed: '# fixture\n', rationale: 'the fixture edit' }],
      scope_note: 'nothing else',
    },
    ...over,
  };
}

/**
 * The same docs/ proposal with REAL evidence and a complete epistemic
 * block — the one this suite lacked until SESSION 27.
 *
 * `docsProposal()` above carries the fixture envelope's simulated
 * evidence, which `authoritative_evidence` and `schema_validation`
 * refuse by design. That is right for the refusal tests, and it means
 * no proposal in this suite could reach the far end of the gate
 * ladder, so "correctly refused" and "structurally unreachable" were
 * indistinguishable here. SESSION 27 found the second was true.
 *
 * The evidence is a file in this repository cited as a primary source
 * for the only thing it is offered as evidence of — that the file
 * exists. Nothing in it is a citation, a date, an article number or a
 * claim about EU law. Same shape as `agent/policy/selftest.mjs`.
 */
function cleanDocsProposal(over = {}) {
  const p = JSON.parse(JSON.stringify(docsProposal()), (k, v) => (k === 'simulated' ? false : v));
  p.autonomy_class = 'autonomous';
  p.reason = 'A suite fixture. It proposes writing one note under docs/ and asserts nothing about EU law.';
  p.evidence = [{
    evidence_id: 'ev-1', kind: 'repository_file', source_id: null, url: null,
    locator: 'agent/autonomy/selftest.mjs', title: null, publisher: null,
    quote: 'This file exists in this repository.', retrieved_at: null, checksum: null,
    supports: 'supports:direct', role: 'primary', simulated: false,
  }];
  p.epistemic = {
    fact: [{ field: null, statement: 'agent/autonomy/selftest.mjs is a file in this repository.', evidence_refs: ['ev-1'] }],
    inference: [], interpretation: [], unresolved: [],
  };
  return { ...p, ...over };
}

/** A proposal that edits `tier` on the source register — bookkeeping
 *  by its own description, and a re-tiering in fact. */
function tierProposal(over = {}) {
  return docsProposal({
    proposal_id: 'prop-autonomy-suite-0002',
    dataset: 'data/sources.json',
    substantive: false,
    operation_kind: 'annotate',
    contract: 'DataProposal',
    affected_entities: [{ kind: 'source', id: 'src-example', path: 'data/sources.json', field: 'tier', note: null }],
    files: ['data/sources.json'],
    proposed_change: {
      summary: 'update the source record',
      operations: [{ op: 'modify', target: 'data/sources.json#src-example.tier', current: 'tier:2', proposed: 'tier:1', rationale: 'a fixture' }],
      scope_note: 'nothing else',
    },
    ...over,
  });
}

const emptyStore = () => ({ byId: new Map(), approvalRequests: [], traces: [] });
const emptyLedger = () => ({ decisions: [], malformed: [], path: '/dev/null' });

function storeWith(...records) {
  const byId = new Map();
  for (const r of records) byId.set(r.proposal_id ?? r.verification_id ?? r.gap_id ?? r.change_id, r);
  return { byId, approvalRequests: [], traces: [] };
}

/* ============================================================
   1 · THE GRANT LEDGER — what a governance decision may say
   ============================================================ */

test('1 · the base policy still enables nothing, and it is empty in one place', () => {
  assert.deepEqual([...DEFAULT_POLICY.enabled_categories], [],
    'DEFAULT_POLICY is the BASE — what the policy permits when nobody has decided anything. SESSION 26 did not fill it, and filling it would make it a second home for what is switched on.');
  assert.deepEqual([...DEFAULT_POLICY.automatic_path_allowlist], []);
  const src = readFileSync(join(REPO_ROOT, 'agent', 'policy', 'categories.mjs'), 'utf8');
  assert.ok(/enabled_categories: Object\.freeze\(\[\]\)/.test(src),
    'the literal in categories.mjs must stay an empty frozen array: an agent that appended to it would be taking the decision protocol §24 reserves to a person');
});

test('1b · a grant with no ledger means the policy in force IS the base', () => {
  const dir = tmp();
  try {
    const { policy, active } = policyInForce({ dir, now: NOW });
    assert.equal(active.length, 0);
    assert.deepEqual([...policy.enabled_categories], []);
    assert.equal(policy.policy_id, DEFAULT_POLICY.policy_id);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('2 · a valid grant is honoured, and the policy in force is derived from it', () => {
  const dir = tmp();
  try {
    const entry = recordGrant(goodGrant(), { dir, now: () => NOW });
    assert.ok(entry.grant_id.startsWith('gov-'));

    const { policy, active } = policyInForce({ dir, now: NOW });
    assert.equal(active.length, 1);
    assert.deepEqual([...policy.enabled_categories].sort(), ['machine_derived_field', 'source_metadata_maintenance']);
    assert.deepEqual([...policy.automatic_path_allowlist].sort(), ['data/sources.json', 'docs/']);
    /* The in-force id EXTENDS the base id. A grant adds to the base;
       it never substitutes a policy of its own. */
    assert.ok(policy.policy_id.startsWith(DEFAULT_POLICY.policy_id));
    assert.ok(policy.policy_id.includes(entry.grant_id));
    /* And the fact of what is switched on has ONE home: the base
       object is unchanged by any of this. */
    assert.deepEqual([...DEFAULT_POLICY.enabled_categories], []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('3 · no grant may enable a category no policy may automate', () => {
  const dir = tmp();
  try {
    for (const c of HUMAN_ONLY_CATEGORIES) {
      assert.throws(() => recordGrant(goodGrant({ categories: [c] }), { dir, now: () => NOW }), (e) => {
        assert.ok(e instanceof GrantRefused);
        assert.ok(e.refusals.some((r) => r.rule === 'categories'), `${c} must be refused as a category`);
        return true;
      }, `"${c}" is reserved to a person and no grant may enable it`);
    }
    assert.equal(readGrantLedger({ dir }).entries.length, 0, 'a refused grant writes nothing');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('4 · no grant may name a path outside the eligible set, or one that reaches a never-automatic path', () => {
  const dir = tmp();
  try {
    for (const p of ['data/claims.json', 'index.html', 'i18n/', 'js/format.js', 'tools/validate.mjs',
      'agent/schemas/', 'agent/policy/', '.github/workflows/', 'data/', '.control-room/']) {
      assert.throws(() => recordGrant(goodGrant({ path_allowlist: [p] }), { dir, now: () => NOW }), (e) => {
        assert.ok(e.refusals.some((r) => r.rule === 'paths'), `${p} must be refused as a path`);
        return true;
      }, `"${p}" must not be grantable`);
    }
    /* And the positive: the two eligible paths ARE grantable, or the
       refusals above would be proving nothing. */
    const ok = recordGrant(goodGrant({ path_allowlist: ['docs/'], field_allowlist: {} }), { dir, now: () => NOW });
    assert.deepEqual(ok.path_allowlist, ['docs/']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('5 · no grant may name a field that changes what a source is said to support', () => {
  const dir = tmp();
  try {
    for (const [f] of NEVER_AUTOMATIC_FIELDS) {
      assert.throws(() => recordGrant(goodGrant({ field_allowlist: { 'data/sources.json': [f] } }), { dir, now: () => NOW }), (e) => {
        assert.ok(e.refusals.some((r) => r.rule === 'fields'), `${f} must be refused as a field`);
        return true;
      });
    }
    /* A dataset in the path allowlist with NO fields named is refused
       too: silence there would read as "all of them", and all of them
       includes tier. */
    assert.throws(() => recordGrant(goodGrant({ field_allowlist: {} }), { dir, now: () => NOW }), (e) => {
      assert.ok(e.refusals.some((r) => r.rule === 'fields' && /would read as all of them/.test(r.why)));
      return true;
    });
    /* And the positive. */
    const ok = recordGrant(goodGrant(), { dir, now: () => NOW });
    assert.deepEqual(ok.field_allowlist['data/sources.json'], ['url_status', 'last_retrieved']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('6 · no grant may raise the risk ceiling, name production, omit an expiry, or be signed by an agent', () => {
  const dir = tmp();
  const agents = new Set(['implementation-qa', 'source-scout']);
  try {
    for (const risk of ['medium', 'high', 'critical']) {
      assert.throws(() => recordGrant(goodGrant({ max_automatic_risk: risk }), { dir, now: () => NOW }),
        (e) => e.refusals.some((r) => r.rule === 'risk'));
    }
    assert.throws(() => recordGrant(goodGrant({ environments: ['local', 'production'] }), { dir, now: () => NOW }),
      (e) => e.refusals.some((r) => r.rule === 'environments'));
    assert.throws(() => recordGrant(goodGrant({ expires_at: null }), { dir, now: () => NOW }),
      (e) => e.refusals.some((r) => r.rule === 'expiry'));
    assert.throws(() => recordGrant(goodGrant({ decided_by: 'implementation-qa' }), { dir, agents, now: () => NOW }),
      (e) => e.refusals.some((r) => r.rule === 'attribution' && /is an agent in this system/.test(r.why)));
    assert.throws(() => recordGrant(goodGrant({ authority: 'x' }), { dir, now: () => NOW }),
      (e) => e.refusals.some((r) => r.rule === 'authority'));
    assert.equal(readGrantLedger({ dir }).entries.length, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('7 · the refusals run again on READ, so a line written around recordGrant is not honoured', () => {
  const dir = tmp();
  try {
    /* Write a grant that recordGrant would refuse, by hand, exactly
       as somebody with write access to the tree could. This is the
       reasoning agent/implement/ledger.mjs states about self-approval:
       a check that runs only at write time protects only the file
       that process wrote. */
    const forged = {
      ledger_version: 1, action: 'enable',
      categories: ['legal_interpretation', 'deletion'],
      path_allowlist: ['data/claims.json', 'index.html'],
      field_allowlist: { 'data/sources.json': ['tier'] },
      max_automatic_risk: 'critical',
      environments: ['production'],
      decided_by: PERSON, decided_at: NOW, expires_at: LATER,
      authority: 'a forged line, written straight into the ledger file by this test',
      grant_id: 'gov-forged',
    };
    fsMkdir(dir, { recursive: true });
    fsAppend(join(dir, 'grants.jsonl'), `${JSON.stringify(forged)}\n`, 'utf8');

    const { policy, active, inactive } = policyInForce({ dir, now: NOW });
    assert.equal(active.length, 0, 'a forged grant is not honoured');
    assert.equal(inactive.length, 1);
    assert.equal(inactive[0].state, 'invalid');
    assert.deepEqual([...policy.enabled_categories], [], 'and nothing it named is switched on');
    assert.equal(policy.max_automatic_risk, DEFAULT_POLICY.max_automatic_risk, 'nor is the risk ceiling raised');
    assert.ok(!policy.automatic_environments.includes('production'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('8 · a revoked grant stops being honoured, and an expired one is not a weaker grant', () => {
  const dir = tmp();
  try {
    const g = recordGrant(goodGrant(), { dir, now: () => NOW });
    assert.equal(policyInForce({ dir, now: NOW }).active.length, 1);

    /* Expiry: the same grant, read at a moment after it ends. */
    const after = policyInForce({ dir, now: '2027-06-01T00:00:00Z' });
    assert.equal(after.active.length, 0);
    assert.equal(after.inactive[0].state, 'expired');
    assert.deepEqual([...after.policy.enabled_categories], [],
      'an expired grant enables nothing; it does not decay into a narrower grant');

    /* Revocation: a later line. */
    recordGrant({
      action: 'revoke', revokes: g.grant_id, decided_by: PERSON, decided_at: NOW, expires_at: LATER,
      authority: 'a fixture revocation written by this suite',
    }, { dir, now: () => NOW });
    const revoked = policyInForce({ dir, now: NOW });
    assert.equal(revoked.active.length, 0);
    assert.equal(revoked.inactive[0].state, 'revoked');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('9 · the eligible and never-automatic lists cannot be made to disagree quietly', () => {
  const self = governanceSelfCheck();
  assert.equal(self.ok, true, self.problems.join(' · '));
  /* Said as an assertion rather than left to the function, because
     the function is the thing under test. */
  for (const [e] of AUTOMATIC_ELIGIBLE_PATHS) {
    for (const [n] of NEVER_AUTOMATIC_PATHS) {
      assert.ok(!(e === n || e.startsWith(n) || n.startsWith(e)), `eligible path "${e}" must not reach never-automatic path "${n}"`);
    }
  }
  for (const [dataset, fields] of Object.entries(GRANTABLE_FIELDS)) {
    for (const f of fields) {
      assert.ok(!NEVER_AUTOMATIC_FIELDS.some(([n]) => n === f), `"${dataset}.${f}" must not be on both lists`);
    }
  }
  assert.equal(GRANT_RISK_CEILING, 'low');
  assert.ok(!GRANTABLE_ENVIRONMENTS.includes('production'));
});

/* ============================================================
   2 · THE FIELD GATE — the one that keeps substantive content out
   ============================================================ */

test('10 · a target naming a never-automatic field is refused however the proposal describes itself', () => {
  const dir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const { policy } = policyInForce({ dir, now: NOW });

    const tiered = tierProposal();
    /* The proposal says it is non-substantive annotation of the
       source register, and `categoriseProposal` believes it —
       docs/AUTONOMY-AUTHORIZATION-POLICY.md §10.4 says it reads
       records, not prose. The field gate reads the TARGET. */
    const f = fieldsPermitted(tiered, policy);
    assert.equal(f.ok, false);
    assert.ok(f.refusals.some((r) => r.field === 'tier'));
    assert.match(f.refusals[0].why, /prohibition 5|never be written automatically/);

    /* The positive: the same shape of proposal against an allowed
       field passes. Without this the refusal above would prove only
       that the gate refuses everything. */
    const bookkeeping = tierProposal({
      proposal_id: 'prop-autonomy-suite-0003',
      affected_entities: [{ kind: 'source', id: 'src-example', path: 'data/sources.json', field: 'url_status', note: null }],
      proposed_change: {
        summary: 'record what the last fetch found',
        operations: [{ op: 'modify', target: 'data/sources.json#src-example.url_status', current: 'reachable', proposed: 'redirected', rationale: 'a fixture' }],
        scope_note: 'nothing else',
      },
    });
    assert.equal(fieldsPermitted(bookkeeping, policy).ok, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('11 · a target that names no field is refused, not read as narrow', () => {
  const dir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const { policy } = policyInForce({ dir, now: NOW });
    const whole = tierProposal({
      proposed_change: {
        summary: 'rewrite the file',
        operations: [{ op: 'modify', target: 'data/sources.json', current: 'a', proposed: 'b', rationale: 'a fixture' }],
        scope_note: 'nothing else',
      },
    });
    const f = fieldsPermitted(whole, policy);
    assert.equal(f.ok, false);
    assert.match(f.refusals[0].why, /names no field|refused, not assumed narrow/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12 · fieldOf never answers "json" for a bare dataset path', () => {
  assert.equal(fieldOf('data/sources.json'), null);
  assert.equal(datasetOf('data/sources.json'), 'data/sources.json');
  assert.equal(fieldOf('data/sources.json#src-x.url_status'), 'url_status');
  assert.equal(fieldOf('sources[3].tier'), 'tier');
  assert.equal(fieldOf(''), null);
  assert.equal(fieldOf(null), null);
});

/* ============================================================
   3 · THE GATES — six, all evaluated, and two replaced by a grant
   ============================================================ */

test('13 · a grant stands in for exactly two preflight gates, and no more', () => {
  assert.deepEqual([...GATES_REPLACED_BY_GRANT], ['approved', 'approval_attributable']);
  for (const g of GATES_REPLACED_BY_GRANT) assert.ok(GATES.includes(g), `${g} must be a real preflight gate`);
  /* The eight that a grant does NOT replace. Written out so that
     adding a ninth to the replaced list fails here rather than
     quietly widening what autonomy buys. */
  const notReplaced = GATES.filter((g) => !GATES_REPLACED_BY_GRANT.includes(g));
  assert.equal(notReplaced.length, 8);
  assert.deepEqual(notReplaced, [
    'proposal_exists', 'proposal_valid', 'scope_defined', 'permitted_files_defined',
    'provenance_complete', 'required_tests_defined', 'risk_defined', 'rollback_available',
  ]);
});

test('14 · with no grant in force, every gate ladder stops at governance_grant', () => {
  const dir = tmp();
  try {
    const gov = policyInForce({ dir, now: NOW });
    const g = autonomyGates({
      proposalId: 'prop-autonomy-suite-0001',
      policy: gov.policy, governance: gov,
      records: storeWith(docsProposal()), ledger: emptyLedger(),
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.some((x) => x.gate === 'governance_grant'));
    assert.match(g.failed.find((x) => x.gate === 'governance_grant').closes, /agent\/policy\/cli\.mjs grant/);
    /* ALL SIX ran. Stopping at the first is cheaper and produces a
       worse report, the same reasoning preflight records about its
       ten. */
    assert.equal(g.gates.length, 6);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('15 · a re-tiering dressed as bookkeeping is refused by the field gate even under a grant', () => {
  const dir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const gov = policyInForce({ dir, now: NOW });
    const p = tierProposal();
    const g = autonomyGates({
      proposalId: p.proposal_id, policy: gov.policy, governance: gov,
      records: storeWith(p), ledger: emptyLedger(),
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.some((x) => x.gate === 'fields_permitted'),
      'the field gate must refuse it, whatever the derived category says');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('16 · a legal-record path reached by a prefix rather than named exactly is refused', () => {
  const dir = tmp();
  try {
    /* A grant may not name `data/` at all — test 4 proves that — so
       the only way this gate can fire is a policy object handed in
       directly. Which is the point: the gate is a SECOND look, so
       that a widened allowlist and a mis-derived category would both
       have to be wrong together. */
    const gov = policyInForce({ dir, now: NOW });
    const policy = { ...gov.policy, enabled_categories: ['source_metadata_maintenance'], automatic_path_allowlist: ['data/'], automatic_field_allowlist: { 'data/sources.json': ['url_status'] } };
    const p = tierProposal({
      affected_entities: [{ kind: 'source', id: 'src-example', path: 'data/sources.json', field: 'url_status', note: null }],
      proposed_change: {
        summary: 'record what the last fetch found',
        operations: [{ op: 'modify', target: 'data/sources.json#src-example.url_status', current: 'a', proposed: 'b', rationale: 'a fixture' }],
        scope_note: 'nothing else',
      },
    });
    const g = autonomyGates({
      proposalId: p.proposal_id, policy, governance: { ...gov, active: [{ grant_id: 'gov-fixture', decided_by: PERSON, expires_at: LATER }] },
      records: storeWith(p), ledger: emptyLedger(),
    });
    const gate = g.gates.find((x) => x.gate === 'legal_record_named');
    assert.equal(gate.ok, false);
    assert.match(gate.why, /not named exactly by any grant/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('17 · the five measured conditions may be unknown before the run; nothing else may', () => {
  /* SESSION 27 ADDED THE FIFTH, under an explicit warrant from the
     repository author quoted in docs/CONTINUOUS-IMPROVEMENT.md §4a.
     `rollback_mechanical` reads a change context that
     agent/implement/apply.mjs openContext() produces in STEP 2, and
     this gate runs before STEP 1 — so it was `unknown` for every
     proposal ever written, read as `failed`, and gate 3 refused all
     of them. Its absence from this list was not a stricter policy; it
     was a gate asking a question that could not be answered yet.

     A SIXTH APPEARING HERE WOULD STILL BE A CONDITION SWITCHED OFF
     WHILE APPEARING TO BE SATISFIED. The list is asserted exactly,
     and 17b below is the half that stops this being a loosening. */
  assert.deepEqual([...MEASURED_CONDITIONS],
    ['verification_succeeded', 'no_unresolved_conflict', 'validators_pass', 'browser_qa', 'rollback_mechanical']);
  const dir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const { policy } = policyInForce({ dir, now: NOW });
    const d = evaluate({
      actor: { kind: 'implementation_qa', id: AUTONOMY_ACTOR },
      action: 'implement.apply', environment: 'local',
      proposal: docsProposal(), policy, facts: {},
    });
    for (const u of d.unknown) assert.ok(MEASURED_CONDITIONS.includes(u), `"${u}" is unknown with no facts supplied and is not a measurement`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('17b · gate 3 tolerates an unmeasured rollback; the MEASURED evaluation still refuses a bad one', () => {
  /* THE HALF THAT STOPS SESSION 27's CHANGE BEING A LOOSENING.
     Making `rollback_mechanical` a measurement only means gate 3 no
     longer pre-empts it. The binding check is step 6, which
     evaluates the same condition with `facts.context` supplied by
     the real run, and `mayMerge` requires route `automatic`, which
     requires every mandatory condition SATISFIED — an unknown there
     refuses exactly as a failure does.

     So: with a context supplied, a GOOD plan is satisfied and a plan
     that is genuinely not mechanical still fails. If the second of
     these ever passes, a change could merge with no way back. */
  const dir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const { policy } = policyInForce({ dir, now: NOW });
    const req = (proposal, facts) => ({
      actor: { kind: 'implementation_qa', id: AUTONOMY_ACTOR },
      action: 'implement.apply', environment: 'local', proposal, policy, facts,
    });
    const context = {
      branch: 'autonomy/suite-branch', commit: 'f'.repeat(40),
      permitted: ['docs/EXAMPLE-DOES-NOT-EXIST.md'],
      before: { 'docs/EXAMPLE-DOES-NOT-EXIST.md': { exists: false, sha256: null, bytes: 0 } },
      rollback: { method: 'git checkout <commit> -- <permitted paths>', command: 'git checkout' },
    };
    const verdict = (d) => d.conditions.find((c) => c.condition === 'rollback_mechanical').verdict;

    /* before the run: unknown, and tolerated by gate 3 */
    assert.equal(verdict(evaluate(req(docsProposal(), {}))), 'unknown');

    /* at step 6 with the real context: satisfied */
    assert.equal(verdict(evaluate(req(docsProposal(), { context }))), 'satisfied');

    /* at step 6 with the real context and a plan that cannot be
       executed: STILL FAILED. This is the assertion that matters. */
    const irreversible = docsProposal({
      rollback_plan: { method: 'not_reversible', steps: [], verification: null, irreversible_reason: 'a fixture' },
    });
    assert.equal(verdict(evaluate(req(irreversible, { context }))), 'failed',
      'a rollback that cannot be executed was accepted once a context existed — a change could merge with no way back');

    /* and on main, which openContext() refuses anyway, the element is
       ESTABLISHED missing rather than merely unanswered */
    const onMain = evaluate(req(docsProposal(), { context: { ...context, branch: 'main' } }));
    assert.equal(verdict(onMain), 'failed');
    assert.ok(onMain.conditions.find((c) => c.condition === 'rollback_mechanical').absent.includes('branch_or_commit'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   4 · THE SUPPLIED FACTS — derived, and absent rather than false
   ============================================================ */

test('17c · gate 3 still refuses an actor the capability matrix does not authorize', () => {
  /* THE PROPERTY SESSION 27's SECOND FIX MUST NOT LOSE.

     Gate 3's third clause used to read `route !== 'blocked'`. That
     was unsatisfiable before a run — every measured condition is on
     NOT_WAIVABLE_BY_APPROVAL, so an unmeasured proposal always routes
     `blocked` — but it WAS the only thing in this gate catching an
     unauthorized actor, because agent/policy/engine.mjs returns
     `conditions: []` in that case and clauses 1 and 2 then both count
     zero and pass. The clause was replaced by an explicit
     authorization check; this plants the case to prove it holds. */
  const unauthorized = evaluate({
    actor: { kind: 'source_scout', id: 'source-scout' },
    action: 'implement.apply', environment: 'local',
    proposal: docsProposal(), policy: DEFAULT_POLICY, facts: {},
  });
  assert.equal(unauthorized.authorization.allow, false,
    'the fixture actor is authorized, so this test cannot prove what it names');
  assert.deepEqual(unauthorized.conditions, [],
    'the engine no longer returns an empty condition list for an unauthorized actor — the hole this test guards has moved, and the gate needs re-reading');

  /* Clauses 1 and 2 see nothing to refuse: that is the hole. */
  const hardFailures = unauthorized.conditions.filter((c) => c.verdict === 'failed');
  const unexpectedUnknown = unauthorized.conditions.filter((c) => c.verdict === 'unknown' && !MEASURED_CONDITIONS.includes(c.condition));
  assert.equal(hardFailures.length, 0);
  assert.equal(unexpectedUnknown.length, 0);

  /* And the gate refuses anyway, on the authorization. */
  const dir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const governance = policyInForce({ dir, now: NOW });
    const p = cleanDocsProposal();
    const r = autonomyGates({
      proposalId: p.proposal_id, policy: governance.policy, governance,
      records: storeWith(p), ledger: emptyLedger(),
    });
    const gate = r.gates.find((g) => g.gate === 'policy_route_pre');
    assert.equal(gate.ok, true, `the authorized runner is refused by gate 3: ${gate.why}`);
    assert.equal(gate.route, 'blocked',
      'gate 3 must PASS while the route still reads blocked — that is the whole of the fix: the route stays blocked until the measurements exist, and step 6 is where it is re-asked');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('18 · an unverified proposal supplies no verification fact, and unknown does not execute', () => {
  const p = docsProposal();
  assert.equal(verificationFact(p, new Map()), undefined,
    'nobody has verified this, which is not the same fact as the verification having failed');
  const facts = deriveFacts(p, new Map());
  assert.equal(facts.verification, undefined);
  assert.match(facts.derivation.verification, /absent rather than false/);
});

test('19 · a real VerificationRecord over the same entity IS read, and its verdict travels', () => {
  const p = docsProposal();
  const v = {
    ...FIXTURES.VerificationRecord(),
    agent: 'legal-verifier', simulated: false, verdict: 'confirmed',
    affected_entities: [{ kind: 'document', id: null, path: 'docs/EXAMPLE-DOES-NOT-EXIST.md', field: null, note: null }],
  };
  const fact = verificationFact(p, storeWith(p, v).byId);
  assert.ok(fact, 'a verification over the same path must be found');
  assert.equal(fact.verdicts.length, 1);
  assert.equal(fact.verdicts[0].verdict, 'confirmed');
  assert.ok(CONFIRMING_VERDICTS.includes(fact.verdicts[0].verdict));
});

test('20 · a contradicting verification is reported as a conflict, not swallowed', () => {
  const p = docsProposal();
  const v = {
    ...FIXTURES.VerificationRecord(),
    agent: 'legal-verifier', simulated: false, verdict: 'contradicted',
    affected_entities: [{ kind: 'document', id: null, path: 'docs/EXAMPLE-DOES-NOT-EXIST.md', field: null, note: null }],
  };
  const c = conflictFact(p, storeWith(p, v).byId);
  assert.ok(c.found > 0);
  assert.ok(c.items.some((i) => i.kind === 'verification_disagrees'));
  /* And the positive: with nothing disagreeing, the scan reports
     zero AND says what it looked at. "No conflicts" with nothing
     behind it is a claim. */
  const clean = conflictFact(p, storeWith(p).byId);
  assert.equal(clean.found, 0);
  assert.match(clean.why, /scanned/);
});

test('21 · a simulated record is never read as evidence of anything', () => {
  const p = docsProposal();
  const v = {
    ...FIXTURES.VerificationRecord(),
    agent: 'legal-verifier', simulated: true, verdict: 'confirmed',
    affected_entities: [{ kind: 'document', id: null, path: 'docs/EXAMPLE-DOES-NOT-EXIST.md', field: null, note: null }],
  };
  assert.equal(verificationFact(p, storeWith(p, v).byId), undefined,
    'a simulated verification is not a verification. AI-SAFE-BOUNDARIES §0.1.');
});

/* ============================================================
   5 · THE ACTION LEDGER AND THE ROLLBACK INFORMATION
   ============================================================ */

test('22 · every outcome is a distinct fact, and an unknown one is refused', () => {
  assert.deepEqual([...ACTION_OUTCOMES], ['refused', 'rehearsed', 'merged', 'reverted', 'revert_failed', 'failed']);
  const dir = tmp();
  try {
    assert.throws(() => recordAction({ action_id: 'a', proposal_id: 'p', outcome: 'probably_fine' }, { dir }),
      /not one of/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('23 · a refusal is a line in the ledger, because "what did it try" is the operator\'s question', () => {
  const dir = tmp();
  try {
    recordAction({ action_id: 'act-1', proposal_id: 'p1', outcome: 'refused', refused_by: ['fields_permitted'], why: 'a fixture' }, { dir });
    recordAction({ action_id: 'act-2', proposal_id: 'p2', outcome: 'merged', wrote_files: true, permitted: ['docs/x.md'], base_commit: 'c0ffee', origin_branch: 'b', merge_commit: 'deadbeef' }, { dir });
    const s = summariseActions({ dir });
    assert.equal(s.counts.total, 2);
    assert.equal(s.counts.refused, 1);
    assert.equal(s.counts.merged, 1);
    assert.equal(s.counts.touched_a_file, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('24 · rollback information is six elements and executable commands, never a boolean', () => {
  const r = rollbackInformation({
    action_id: 'act-2', proposal_id: 'p2', outcome: 'merged',
    permitted: ['docs/x.md'], before: { 'docs/x.md': { exists: false, sha256: null } },
    base_commit: 'c0ffee', origin_branch: 'b', merge_commit: 'deadbeef', isolated_branch: 'autonomy/act-2',
  });
  for (const k of ['previous_known_good_state', 'change_identifier', 'branch_or_commit', 'procedure', 'execution_mechanism', 'post_rollback_validation']) {
    assert.ok(r[k], `${k} must be present: SESSION 23 names six elements and a boolean is not one of them`);
  }
  assert.ok(Array.isArray(r.procedure) && r.procedure.length > 0);
  assert.ok(r.procedure.some((s) => s.includes('git revert')));
  assert.ok(r.procedure.some((s) => s.includes('c0ffee')));
  assert.ok(r.procedure.some((s) => s.includes('tools/validate.mjs')));
  assert.match(r.note, /commit is the durable record/);
});

test('25 · an empty action ledger says "none on this machine", never "0 actions"', () => {
  const dir = join(tmp(), 'never-created');
  const s = summariseActions({ dir });
  assert.equal(s.exists, false);
  assert.equal(s.counts.total, 0);
  assert.match(s.why, /git-ignored run state/);
  assert.match(s.why, /not the same as no autonomous action having been taken/);
});

/* ============================================================
   6 · THE CYCLE
   ============================================================ */

test('26 · the seven steps are declared as data, in order', () => {
  assert.equal(CYCLE_STEPS.length, 7);
  assert.deepEqual(CYCLE_STEPS.map((s) => s.id), ['isolate', 'implement', 'validators', 'browser', 'trace', 'merge', 'rollback']);
  assert.deepEqual(CYCLE_STEPS.map((s) => s.step), [1, 2, 3, 4, 5, 6, 7]);
});

test('27 · the commit message carries the grant, the person, the base commit and the restore command', () => {
  const p = docsProposal();
  const m = commitMessage({
    proposal: p, proposalId: p.proposal_id,
    change: { files: [{ path: 'docs/EXAMPLE-DOES-NOT-EXIST.md' }] },
    qaVerdict: 'pass', checks: [1, 2, 3],
    context: { commit: 'c0ffeebabe', permitted: ['docs/EXAMPLE-DOES-NOT-EXIST.md'] },
    grants: [{ grant_id: 'gov-fixture', decided_by: PERSON, decided_at: NOW, expires_at: LATER }],
    policy: { policy_id: 'fixture-policy' },
    category: 'machine_derived_field',
    originBranch: 'a-branch',
  });
  assert.match(m, /gov-fixture/);
  assert.match(m, new RegExp(PERSON));
  assert.match(m, /c0ffeebabe/);
  assert.match(m, /git checkout c0ffeebabe --/);
  assert.match(m, /ROLLBACK/);
  assert.match(m, /NOT DEPLOYED/);
  assert.match(m, /No human\ndecided this individual change/);
  /* AGENTS.md: no model identifier in any commit message or pushed
     artifact. */
  assert.ok(!/claude|gpt|opus|sonnet|anthropic|openai/i.test(m), 'no model identifier may appear in a commit this system writes');
});

test('28 · a rehearsal writes nothing, cuts no branch, and says whether it would have merged', async (t) => {
  const dir = tmp();
  const actionDir = tmp();
  try {
    recordGrant(goodGrant(), { dir, now: () => NOW });
    const before = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: REPO_ROOT, encoding: 'utf8' });
    const branchBefore = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    if (branchBefore === 'main') { t.skip('the working tree is on main; the cycle refuses to run there and this test would prove nothing'); return; }

    /* SESSION 27 CHANGED THE FIXTURE HERE, AND THAT IS THE POINT.
       This used to run `docsProposal()`, whose simulated evidence is
       refused at gate 2 — so the test accepted `refused` OR
       `rehearsed` and could never tell "correctly refused" from "the
       ladder cannot be passed". It could not be passed: gate 3 asked
       two questions before a run that only a run can answer.
       docs/CONTINUOUS-IMPROVEMENT.md §4.

       With a proposal that has nothing wrong with it, all six gates
       pass and the cycle reaches the MEASURED evaluation. It still
       does not merge, and the reasons are now real measurements
       rather than a structural impossibility — which is exactly what
       this layer is supposed to do. */
    const p = cleanDocsProposal();
    const run = fakeRun();
    const r = await runCycle({
      proposalId: p.proposal_id, run, asOf: '2026-09-09', execute: false,
      governanceDir: dir, actionDir, now: NOW,
      records: storeWith(p), ledger: emptyLedger(),
    });

    assert.equal(r.outcome, 'rehearsed',
      `a flawless proposal in an enabled category over a granted path did not reach the rehearsal: ${r.why}`);
    for (const g of r.gates ?? []) assert.equal(g.ok, true, `gate ${g.gate} refused a flawless proposal: ${g.why}`);
    assert.equal(typeof r.would_merge, 'boolean',
      'the cycle must reach the measured evaluation and answer the merge question either way');
    assert.equal(r.wrote_files, false);
    const after = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: REPO_ROOT, encoding: 'utf8' });
    assert.equal(after, before, 'a rehearsal must leave the working tree byte-identical');
    const branchAfter = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    assert.equal(branchAfter, branchBefore, 'and on the same branch');
    /* And the attempt is on the ledger either way. */
    assert.equal(readActions({ dir: actionDir }).actions.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); rmSync(actionDir, { recursive: true, force: true }); }
});

test('29 · surveyAutonomy reports what could run and writes nothing', () => {
  const dir = tmp();
  try {
    const s = surveyAutonomy({ records: emptyStore(), ledger: emptyLedger(), governanceDir: dir, now: NOW });
    assert.equal(s.total, 0);
    assert.deepEqual(s.eligible, []);
    assert.equal(existsSync(join(dir, 'grants.jsonl')), false, 'a survey writes nothing');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   7 · THE SUITE'S OWN INTEGRITY
   ============================================================ */

test('30 · this suite is registered, or a change under agent/ would land without running it', () => {
  assert.ok(AGENT_SUITES.includes('agent/autonomy/selftest.mjs'),
    'the autonomy runner is the first thing here that can write a file without a person. A suite nothing runs is a gate on nothing.');
  const ci = readFileSync(join(REPO_ROOT, '.github', 'workflows', 'qa.yml'), 'utf8');
  assert.ok(ci.includes('agent/autonomy/selftest.mjs'), 'and it runs in CI');
});

test('31 · the repository ledger this suite never touched is still where it was', () => {
  /* Read the real grant ledger and assert this suite added nothing to
     it. Every test above writes to a mkdtemp; this is the check from
     outside that none of them slipped. */
  const real = readGrantLedger();
  for (const e of real.entries) {
    assert.notEqual(e.decided_by, PERSON, 'the suite\'s fixture person must never appear in the repository\'s own ledger');
    assert.ok(!String(e.authority ?? '').includes('this suite'), 'nor a fixture authority');
  }
  const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: REPO_ROOT, encoding: 'utf8' });
  for (const line of status.split('\n')) {
    assert.ok(!line.includes('agent/autonomy/actions/actions.jsonl'), 'the suite must not have written the repository\'s action ledger');
  }
});

test('32 · describeGovernance names the boundaries, not just the grants', () => {
  const dir = tmp();
  try {
    const g = describeGovernance({ dir, now: NOW });
    assert.ok(g.eligible_paths.length >= 1);
    assert.ok(g.never_paths.length >= 10);
    assert.ok(g.never_fields.length >= 8);
    for (const x of [...g.eligible_paths, ...g.never_paths, ...g.never_fields]) {
      assert.ok(x.why && x.why.length > 20, 'every boundary states its reason; a list nobody can argue with is a list nobody can check');
    }
    assert.deepEqual(g.automatable_categories, [...AUTOMATABLE_CATEGORIES]);
    assert.equal(g.automatable_categories.length, 5, 'protocol §20 names five');
    for (const c of g.automatable_categories) assert.equal(ACTION_CATEGORIES[c].automatable, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   8 · THE GIT HALF — driven against a REAL temporary repository

   Every other test here runs against fixtures and mkdtemp
   directories. These cannot: cutting a branch, committing on it,
   merging it back and abandoning it are the part of this system that
   can leave a repository in a state nobody asked for, and a test that
   mocked git would prove that the mock works.

   So each of these does `git init` in a temporary directory, drives
   the real functions against it, and asserts what git itself then
   says. Nothing here touches this repository.
   ============================================================ */

function tempRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'autonomy-git-'));
  const g = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  g('init', '--quiet', '--initial-branch', 'main');
  g('config', 'user.name', 'suite');
  g('config', 'user.email', 'suite@example.invalid');
  fsAppend(join(dir, 'a.txt'), 'one\n', 'utf8');
  g('add', '-A');
  g('commit', '--quiet', '-m', 'base');
  return { dir, g };
}

test('34 · cutBranch refuses main, and refuses a name that already exists', () => {
  const { dir, g } = tempRepo();
  try {
    assert.equal(currentBranch(dir), 'main');
    assert.throws(() => cutBranch({ name: 'autonomy/x', cwd: dir }), (e) => {
      assert.ok(e instanceof IsolationRefused);
      assert.match(e.message, /publishes to the live site/);
      return true;
    }, 'no autonomous change is cut from main');
    assert.equal(currentBranch(dir), 'main', 'and the refusal left the tree where it was');
    assert.equal(branchExists('autonomy/x', dir), false, 'and cut no branch');

    /* The positive: off main, it cuts one. */
    g('checkout', '--quiet', '-b', 'session-branch');
    const cut = cutBranch({ name: 'autonomy/x', cwd: dir });
    assert.equal(cut.origin_branch, 'session-branch');
    assert.equal(cut.isolated_branch, 'autonomy/x');
    assert.equal(currentBranch(dir), 'autonomy/x');

    /* And a second cut of the same name is refused rather than
       written over: a collision means a previous run did not clean
       up, which is a state to look at. */
    g('checkout', '--quiet', 'session-branch');
    assert.throws(() => cutBranch({ name: 'autonomy/x', cwd: dir }), (e) => {
      assert.match(e.message, /already exists/);
      return true;
    });
    for (const b of FORBIDDEN_BRANCHES) assert.ok(typeof b === 'string');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('35 · commitChange stages the named paths and nothing else', () => {
  const { dir, g } = tempRepo();
  try {
    g('checkout', '--quiet', '-b', 'session-branch');
    cutBranch({ name: 'autonomy/y', cwd: dir });

    /* Two edits: one the change made, one that was already in the
       working tree and has nothing to do with it. `git add -A` would
       sweep the second into an autonomous commit. */
    fsAppend(join(dir, 'a.txt'), 'two\n', 'utf8');
    fsAppend(join(dir, 'unrelated.txt'), 'somebody else\n', 'utf8');

    const c = commitChange({ paths: ['a.txt'], message: 'the autonomous change', cwd: dir });
    assert.ok(c.commit);
    assert.deepEqual(c.staged, ['a.txt']);
    const inCommit = g('show', '--name-only', '--format=', 'HEAD').split('\n').filter(Boolean);
    assert.deepEqual(inCommit, ['a.txt'], 'the unrelated file must not be in the autonomous commit');
    assert.match(g('status', '--porcelain=v1', '--untracked-files=all'), /unrelated\.txt/, 'and it is still sitting there, untouched');

    /* And a change that staged nothing returns null rather than
       committing: a commit that changes nothing is not a record of a
       change. */
    assert.equal(commitChange({ paths: ['a.txt'], message: 'again', cwd: dir }), null);
    assert.equal(commitChange({ paths: [], message: 'nothing', cwd: dir }), null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('36 · mergeBack merges into the origin branch with --no-ff and deletes the isolated one', () => {
  const { dir, g } = tempRepo();
  try {
    g('checkout', '--quiet', '-b', 'session-branch');
    const before = currentCommit(dir);
    cutBranch({ name: 'autonomy/z', cwd: dir });
    fsAppend(join(dir, 'a.txt'), 'two\n', 'utf8');
    commitChange({ paths: ['a.txt'], message: 'the autonomous change', cwd: dir });

    const m = mergeBack({ originBranch: 'session-branch', isolatedBranch: 'autonomy/z', actionId: 'act-1', proposalId: 'p1', cwd: dir });
    assert.equal(m.merged_into, 'session-branch');
    assert.equal(currentBranch(dir), 'session-branch');
    assert.equal(branchExists('autonomy/z', dir), false, 'the isolated branch is gone once it is merged');

    /* --no-ff, so the merge is a visible commit with two parents
       rather than a fast-forward nobody can see — and it is what
       `git revert` takes as its argument. */
    const parents = g('rev-list', '--parents', '-n', '1', m.merge_commit).split(' ');
    assert.equal(parents.length, 3, 'a --no-ff merge commit has two parents');
    assert.equal(parents[1], before, 'and the first is where the session branch was');
    assert.match(g('log', '-1', '--format=%s', m.merge_commit), /autonomy: merge act-1 \(p1\)/);
    assert.equal(readFileSync(join(dir, 'a.txt'), 'utf8'), 'one\ntwo\n', 'and the change is actually in the tree');

    /* main is untouched. Nothing here merges into it and there is no
       parameter through which a caller could name it. */
    assert.equal(g('rev-parse', 'main'), before, 'main is exactly where it was before any of this');
    assert.notEqual(g('rev-parse', 'main'), m.merge_commit);
    assert.throws(() => mergeBack({ originBranch: 'main', isolatedBranch: 'x', actionId: 'a', proposalId: 'p', cwd: dir }), IsolationRefused);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('37 · abandon returns to the origin branch, deletes the isolated one, and is safe to call twice', () => {
  const { dir, g } = tempRepo();
  try {
    g('checkout', '--quiet', '-b', 'session-branch');
    const before = currentCommit(dir);
    cutBranch({ name: 'autonomy/w', cwd: dir });
    fsAppend(join(dir, 'a.txt'), 'two\n', 'utf8');
    commitChange({ paths: ['a.txt'], message: 'a change that will be abandoned', cwd: dir });
    fsAppend(join(dir, 'unrelated.txt'), 'somebody else\n', 'utf8');

    const first = abandon({ originBranch: 'session-branch', isolatedBranch: 'autonomy/w', cwd: dir });
    assert.equal(first.returned_to, 'session-branch');
    assert.equal(first.deleted, true);
    assert.deepEqual(first.problems, []);
    assert.equal(currentCommit(dir), before, 'the session branch never saw the abandoned commit');
    assert.equal(branchExists('autonomy/w', dir), false);

    /* It did NOT discard the uncommitted file it never touched. That
       is the difference between abandoning a branch and running
       `git checkout -- .`, and it is deliberate. */
    assert.ok(existsSync(join(dir, 'unrelated.txt')), 'abandon must not throw away work this run never touched');

    /* Safe to call again: an idempotent cleanup is one a failure path
       can call without checking what already happened. */
    const second = abandon({ originBranch: 'session-branch', isolatedBranch: 'autonomy/w', cwd: dir });
    assert.equal(second.returned_to, 'session-branch');
    assert.equal(second.deleted, false);
    assert.deepEqual(second.problems, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ---------------------------------------------------------- helpers */

/** A trace span that records rather than writes. The cycle needs
 *  `startAgent`, `observe`, `decide` and `end`; nothing here asserts
 *  on the trace store, and using the real one would write run
 *  artifacts from a test. */
function fakeRun() {
  const events = [];
  const span = {
    trace_id: 'trace-fixture', run_id: 'run-fixture', events,
    observe: (e) => events.push({ kind: 'observe', ...e }),
    decide: (e) => events.push({ kind: 'decide', ...e }),
    end: (e) => events.push({ kind: 'end', ...e }),
    error: (e) => events.push({ kind: 'error', message: String(e?.message ?? e) }),
  };
  return { ...span, startAgent: () => span };
}

/** Kept so `grantId` is exercised: two identical grants collide and
 *  an edited one is a different grant. */
test('33 · a grant id is derived from what it grants', () => {
  const a = grantId(goodGrant());
  const b = grantId(goodGrant());
  const c = grantId(goodGrant({ categories: ['machine_derived_field'] }));
  assert.equal(a, b, 'two identical grants collide rather than accumulating');
  assert.notEqual(a, c, 'and an edited grant is a different grant');
  assert.deepEqual(validateGrant(goodGrant(), { now: NOW }), [], 'the fixture grant is one recordGrant would accept');
  assert.ok(activeGrants);
});
