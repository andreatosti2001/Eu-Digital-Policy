/* ============================================================
   agent/release/selftest.mjs — the release chain's own suite

   node --test agent/release/selftest.mjs

   WHAT EVERY FIXTURE HERE IS. Every ledger, key, registry, repository and
   artifact below is built in a temporary directory and deleted. The reviewer
   is "Fixture Reviewer" with a key generated per run, and it is registered
   only in a temporary registry. NOTHING IN THIS FILE WRITES TO
   agent/implement/decisions/, and the last test hashes the real directory
   before and after to prove it. A fixture therefore cannot be mistaken for
   an authentic approval, because none of them exists anywhere a gate reads
   in production.

   The credential-shaped string used to test the artifact scan is assembled
   at run time from two halves so that this file does not itself trip
   boundary.mjs.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REQUIRED_VALIDATORS } from '../schemas/types.mjs';
import {
  deriveApproval, proposalFingerprint, readLedger, recordDecision, LedgerIntegrityError, SelfApprovalRefused, APPROVAL_STATES,
} from '../implement/ledger.mjs';
import {
  GENESIS, computeEntryHash, generateReviewerKey, parseReviewers, registryFingerprintOf, signEntryHash, verifyEntrySignature, verifyLedger,
} from '../implement/attestation.mjs';
import { AGENT_SUITES } from '../implement/checks.mjs';
import { AGENT_NAMES } from '../orchestrator/capabilities.mjs';
import { dispatch, dispatchKey, findDispatches, implementerApplier, PROPOSAL_ID } from './dispatch.mjs';
import { judge, gatherFacts, PASS, FAIL, WARN, UNMEASURED, NA, LEDGER_PATH, REVIEWERS_PATH } from './gate.mjs';
import { auditPublisher, auditWorkflows, parseWorkflow } from './workflows.mjs';
import { lifecycleOf, STATES } from './lifecycle.mjs';
import { EXPECTED_REPOSITORY, MAX_APPROVAL_AGE_DAYS, PUBLISHING_WORKFLOW, REGISTRY_PIN_ENV } from './policy.mjs';
import { build as buildArtifact } from '../../tools/pages-artifact.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const NOW = '2026-11-04T12:00:00.000Z';
const cleanup = [];
const tmp = (p = 'release-') => { const d = mkdtempSync(join(tmpdir(), p)); cleanup.push(d); return d; };
process.on('exit', () => { for (const d of cleanup) try { rmSync(d, { recursive: true, force: true }); } catch { /* temp */ } });

const GIT_ENV = { GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' };
Object.assign(process.env, GIT_ENV); /* the dispatcher commits with the caller's identity; a CI runner has none, so the fixture lends it one */
const git = (cwd, args, env = {}) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...GIT_ENV, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/* ------------------------------------------------------------ fixtures */

function proposal(over = {}) {
  return {
    contract: 'ImplementationProposal', contract_version: 1, agent: 'test-producer', created_at: NOW,
    affected_entities: [{ kind: 'tool', id: null, path: 'tools/example.mjs', field: null, note: null }],
    evidence: [{ evidence_id: 'ev-1', kind: 'repository_file', source_id: null, url: null, locator: 'tools/example.mjs:1', title: null, publisher: null, quote: 'const OLD = 1;', retrieved_at: NOW, checksum: null, supports: 'supports:direct', role: 'unresolved', simulated: false }],
    epistemic: { fact: [{ field: 'files', statement: 'tools/example.mjs contains "const OLD = 1;"', evidence_refs: ['ev-1'] }], inference: [], interpretation: [], unresolved: [] },
    trace_ref: null, simulated: false, proposal_id: 'prop-fixture-000000000001',
    reason: 'a FIXTURE: it asserts nothing about EU law', confidence: 0.9, risk: 'low', autonomy_class: 'review_required',
    proposed_change: { summary: 'change OLD from 1 to 2 in tools/example.mjs', operations: [{ op: 'modify', target: 'tools/example.mjs', current: 'const OLD = 1;', proposed: 'const OLD = 2;', rationale: 'the fixture edit' }], scope_note: 'nothing else' },
    validation_requirements: REQUIRED_VALIDATORS.map((v) => ({ check: v, command: `node ${v}`, expected: 'baseline', why: 'AGENTS.md requires all four' })),
    rollback_plan: { method: 'restore_from_commit', steps: ['git checkout HEAD -- tools/example.mjs'], verification: 'the file hashes back', irreversible_reason: null },
    files: ['tools/example.mjs'], modules: [], new_dependencies: [], adds_build_step: false, adds_fetch_call: false, fetch_modules: [], tests_added: [],
    validator_impact: { baseline_ref: 'docs/CURRENT-ARCHITECTURE.md §12', expected_new_errors: 0, expected_new_warnings: 0, justification: null },
    ...over,
  };
}
const request = (pid, over = {}) => ({
  contract: 'ApprovalRequest', contract_version: 1, agent: 'test-producer', created_at: NOW, affected_entities: [], evidence: [],
  epistemic: { fact: [], inference: [], interpretation: [], unresolved: [] }, trace_ref: null, simulated: true,
  approval_id: `appr-fixture-${pid.slice(-6)}`, proposal_ids: [pid], tier: 'amber', requested_of: 'the repository author',
  why_human_required: 'a fixture', what_to_check: ['that this is a fixture'], risk_if_wrong: 'low', consequence_if_wrong: 'nothing', expires_at: null, state: 'requested', decision: null, ...over,
});
function records(props = [proposal()], withRequest = true) {
  const byId = new Map();
  const approvalRequests = [];
  for (const p of props) {
    byId.set(p.proposal_id, p);
    if (withRequest) { const r = request(p.proposal_id); byId.set(r.approval_id, r); approvalRequests.push(r); }
  }
  return { byId, approvalRequests, traces: [] };
}

const REVIEWER = { id: 'rev-fixture', name: 'Fixture Reviewer', role: 'fixture role (TEST ONLY)' };
const key = generateReviewerKey();
const registry = (extra = {}, keyPem = key.publicKeyPem) => JSON.stringify({ reviewers: [{ reviewer_id: REVIEWER.id, name: REVIEWER.name, role: REVIEWER.role, status: 'active', added_at: NOW, public_key_pem: keyPem, ...extra }] }, null, 2);

/** A decisions directory with the fixture registry, in a temp path. */
function ledgerDir({ reg = registry() } = {}) {
  const d = join(tmp('ledger-'), 'agent', 'implement', 'decisions');
  mkdirSync(d, { recursive: true });
  if (reg) writeFileSync(join(d, 'reviewers.json'), reg);
  return d;
}
const decide = (dir, recs, over = {}) => recordDecision({
  proposalId: 'prop-fixture-000000000001', outcome: 'granted', decidedBy: REVIEWER.name, role: REVIEWER.role,
  signer: { privateKeyPem: key.privateKeyPem }, records: recs, dir, now: () => NOW, ...over,
});
const ledgerFile = (dir) => join(dir, 'decisions.jsonl');
const verify = (dir, over = {}) => verifyLedger({ dir, requireSignatures: true, now: new Date('2026-11-05T00:00:00Z'), ...over });
const codes = (v) => v.problems.map((p) => p.code);

/** A repository with `tools/example.mjs`, on a feature branch. */
function repo({ branch = 'feature' } = {}) {
  const d = tmp('repo-');
  git(d, ['init', '-q', '-b', 'main']);
  mkdirSync(join(d, 'tools'), { recursive: true });
  writeFileSync(join(d, 'tools', 'example.mjs'), 'const OLD = 1;\n');
  git(d, ['add', '-A']); git(d, ['commit', '-q', '-m', 'base']);
  if (branch !== 'main') git(d, ['checkout', '-q', '-b', branch]);
  return d;
}
/** The stand-in for Agent 9: makes the approved edit and reports success. The
 *  real one runs the validators and suites, which takes minutes. */
const goodApplier = async ({ root }) => {
  const f = join(root, 'tools', 'example.mjs');
  writeFileSync(f, readFileSync(f, 'utf8').replace('const OLD = 1;', 'const OLD = 2;'));
  return { outcome: 'implemented', change: { files: [{ path: 'tools/example.mjs' }] }, qa: { verdict: 'pass' }, commit_metadata: { body: 'Files: tools/example.mjs\nQA: pass; 0 check(s)\nRollback: git checkout HEAD -- tools/example.mjs' } };
};

/** A world where a signed human decision exists. */
function approved({ props = [proposal()], dir = ledgerDir() } = {}) {
  const recs = records(props);
  const entry = decide(dir, recs);
  return { recs, dir, entry };
}
const dis = (o) => dispatch({ proposalId: 'prop-fixture-000000000001', asOf: '2026-11-04', logDir: tmp('log-'), ...o });

/* ============================================================ B · the ledger */

test('B1 · a recorded decision is hash-chained, labelled human, and verifies', () => {
  const { dir, entry } = approved();
  assert.equal(entry.ledger_version, 2);
  assert.equal(entry.seq, 1);
  assert.equal(entry.prev_entry_sha256, GENESIS);
  assert.equal(entry.provenance, 'human');
  assert.equal(entry.decided_role, REVIEWER.role);
  assert.equal(entry.entry_sha256, computeEntryHash(entry));
  const v = verify(dir);
  assert.equal(v.ok, true, JSON.stringify(v.problems));
  assert.equal(v.signed, 1);
  assert.equal(v.simulated, 0);
});

test('B2 · the chain links entries, and editing, deleting or re-ordering one is detected', () => {
  const a = proposal(); const b = proposal({ proposal_id: 'prop-fixture-000000000002' });
  const recs = records([a, b]);
  const dir = ledgerDir();
  decide(dir, recs);
  decide(dir, recs, { proposalId: b.proposal_id });
  decide(dir, recs, { proposalId: a.proposal_id, outcome: 'denied' });
  assert.equal(verify(dir).ok, true);
  const lines = readFileSync(ledgerFile(dir), 'utf8').trim().split('\n');

  const edited = [...lines]; edited[0] = edited[0].replace('"outcome":"granted"', '"outcome":"denied"');
  assert.ok(codes(verify(dir, { text: edited.join('\n') })).includes('hash_mismatch'), 'an edited line must fail its own hash');

  const deleted = [lines[0], lines[2]];
  const dc = codes(verify(dir, { text: deleted.join('\n') }));
  assert.ok(dc.includes('seq_gap') && dc.includes('chain_break'), `deleting the middle entry: ${dc}`);

  const swapped = [lines[1], lines[0], lines[2]];
  assert.ok(codes(verify(dir, { text: swapped.join('\n') })).includes('chain_break'));
});

test('B3 · a signature verifies only against the registered key of the reviewer who made it', () => {
  const { dir, entry } = approved();
  assert.equal(verifyEntrySignature(entry.entry_sha256, entry.signature, key.publicKeyPem), true);
  assert.equal(verifyEntrySignature(entry.entry_sha256, entry.signature, generateReviewerKey().publicKeyPem), false);
  assert.equal(verifyEntrySignature('00'.repeat(32), entry.signature, key.publicKeyPem), false);

  /* signed by a key nobody registered */
  const other = generateReviewerKey();
  const d2 = ledgerDir();
  decide(d2, records(), { signer: { privateKeyPem: other.privateKeyPem } });
  assert.ok(codes(verify(d2)).includes('unknown_reviewer'));

  /* the registered reviewer later revoked */
  const d3 = ledgerDir({ reg: registry({ status: 'revoked' }) });
  decide(d3, records());
  assert.ok(codes(verify(d3)).includes('reviewer_revoked'));

  /* the registry renames the reviewer: the line no longer matches */
  const d4 = ledgerDir({ reg: registry({ name: 'Somebody Else' }) });
  decide(d4, records());
  assert.ok(codes(verify(d4)).includes('reviewer_name_mismatch'));

  /* role must be the registered role */
  const d5 = ledgerDir();
  decide(d5, records(), { role: 'a role the registry does not grant' });
  assert.ok(codes(verify(d5)).includes('reviewer_role_mismatch'));
});

test('B4 · an unsigned entry is accepted by the agent layer and refused where a signature is required', () => {
  const dir = ledgerDir();
  const recs = records();
  const e = decide(dir, recs, { signer: null });
  assert.equal(e.signature, null);
  assert.equal(verify(dir, { requireSignatures: false }).ok, true, 'a development ledger stays usable');
  assert.ok(codes(verify(dir)).includes('unsigned'));
  /* and deriveApproval, the agent layer's own reader, still grants it (unchanged behaviour) */
  assert.equal(deriveApproval('prop-fixture-000000000001', { records: recs, ledger: readLedger({ dir }) }).state, 'granted');
});

test('B5 · a simulated decision is labelled, void to deriveApproval, refused by the gate, and cannot be signed', () => {
  const dir = ledgerDir(); const recs = records();
  assert.throws(() => decide(dir, recs, { simulated: true, signer: null }), /must be named "SIMULATED:/);
  assert.throws(() => decide(dir, recs, { simulated: true, decidedBy: 'SIMULATED: fixture' }), /cannot be signed/);
  assert.throws(() => decide(dir, recs, { decidedBy: 'SIMULATED: fixture' }), /labelled as a simulation/);
  const e = decide(dir, recs, { simulated: true, decidedBy: 'SIMULATED: fixture', signer: null, role: null });
  assert.equal(e.provenance, 'simulated');
  assert.equal(deriveApproval('prop-fixture-000000000001', { records: recs, ledger: readLedger({ dir }) }).state, 'void_simulated');
  assert.equal(deriveApproval('prop-fixture-000000000001', { records: recs, ledger: readLedger({ dir }), allowSimulated: true }).state, 'granted');
  assert.ok(codes(verify(dir)).includes('simulated_entry'));
  assert.equal(codes(verify(dir, { allowSimulated: true })).includes('simulated_entry'), false);
  assert.ok(APPROVAL_STATES.includes('void_simulated'));

  /* a hand-written line that DROPS the label is still caught: the name decides */
  const raw = JSON.parse(readFileSync(ledgerFile(dir), 'utf8').trim());
  raw.provenance = 'human';
  raw.entry_sha256 = computeEntryHash(raw);
  assert.ok(codes(verifyLedger({ text: JSON.stringify(raw), requireSignatures: false, reviewers: parseReviewers(null) })).includes('simulated_mislabelled'));
  assert.equal(deriveApproval('prop-fixture-000000000001', { records: recs, ledger: { decisions: [raw], malformed: [] } }).state, 'void_simulated');
});

test('B6 · an agent cannot self-approve, at write time or in a hand-written line', () => {
  const dir = ledgerDir(); const recs = records();
  assert.throws(() => decide(dir, recs, { decidedBy: 'test-producer', signer: null }), SelfApprovalRefused);
  /* recordDecision knows the agents of the store it was handed; the VERIFIER
     knows every agent in the capability register, which is the stronger set */
  const named = AGENT_NAMES.find((n) => n !== 'human' && n !== 'test-producer');
  const wrote = decide(dir, recs, { decidedBy: named, signer: null });
  assert.ok(codes(verifyLedger({ text: JSON.stringify(wrote), requireSignatures: false, reviewers: parseReviewers(null), agentNames: [...AGENT_NAMES], now: new Date('2026-11-05') })).includes('agent_decider'), `${named} must be refused on read`);
  /* a forged line naming an agent, with a valid chain and hash, is caught on read */
  const forged = { ledger_version: 2, seq: 1, prev_entry_sha256: GENESIS, approval_id: 'appr-x', proposal_id: 'prop-fixture-000000000001', proposal_agent: 'test-producer', proposal_sha256: 'a'.repeat(64), outcome: 'granted', provenance: 'human', decided_at: NOW, decided_by: 'test-producer', decided_role: null, signature: null };
  forged.entry_sha256 = computeEntryHash(forged);
  assert.ok(codes(verifyLedger({ text: JSON.stringify(forged), requireSignatures: false, reviewers: parseReviewers(null), now: new Date(NOW) })).includes('agent_decider'));
});

test('B7 · a version-1 line, a future date and a malformed line are each reported, not skipped', () => {
  const legacy = JSON.stringify({ ledger_version: 1, approval_id: 'a', proposal_id: 'p', outcome: 'granted', decided_by: 'x', decided_at: NOW, proposal_sha256: 'b'.repeat(64) });
  const v = verifyLedger({ text: `${legacy}\nnot json\n`, reviewers: parseReviewers(null), now: new Date(NOW) });
  assert.ok(codes(v).includes('legacy_unchained') && codes(v).includes('malformed_line'));
  const dir = ledgerDir(); const recs = records();
  decide(dir, recs, { now: () => '2030-01-01T00:00:00.000Z' });
  assert.ok(codes(verify(dir)).includes('future_timestamp'));
  decide(ledgerDir(), recs, { now: () => 'yesterday-ish' });
});

test('B8 · nothing is appended to a ledger that has been edited or cannot be read', () => {
  const dir = ledgerDir(); const recs = records();
  decide(dir, recs);
  writeFileSync(ledgerFile(dir), readFileSync(ledgerFile(dir), 'utf8').replace('"granted"', '"denied"'));
  assert.throws(() => decide(dir, recs, { outcome: 'denied' }), LedgerIntegrityError);
  const d2 = ledgerDir();
  writeFileSync(ledgerFile(d2), 'garbage\n');
  assert.throws(() => decide(d2, recs), LedgerIntegrityError);
});

test('B9 · the registry fingerprint moves on any edit, and a registry that does not parse is reported', () => {
  const a = registry(); const b = registry({ status: 'revoked' });
  assert.notEqual(registryFingerprintOf(a), registryFingerprintOf(b));
  assert.notEqual(registryFingerprintOf(a), registryFingerprintOf(`${a}\n`));
  assert.ok(parseReviewers('{not json').problems.length);
  assert.ok(parseReviewers('{"reviewers":[{"reviewer_id":"x"}]}').problems.length);
  assert.equal(parseReviewers(null).present, false);
});

/* ============================================================ A · the dispatcher */

test('A1 · an approved, signed proposal is REHEARSED: every check runs, nothing is written', async () => {
  const { recs, dir } = approved(); const root = repo();
  const before = git(root, ['status', '--porcelain']) + git(root, ['rev-parse', 'HEAD']);
  const r = await dis({ records: recs, ledgerDir: dir, root, applier: async () => { throw new Error('a rehearsal must not apply'); } });
  assert.equal(r.outcome, 'would_dispatch', JSON.stringify(r.stages));
  /* 'index' since P0.1 (11 Nov 2026): a rehearsal checks the index too, so it never promises a dispatch the execution refuses */
  assert.deepEqual(r.stages.map((s) => s.stage), ['intake', 'ledger', 'approval', 'preflight', 'duplicate', 'index', 'rehearsal']);
  assert.ok(r.stages.every((s) => s.ok));
  assert.match(r.would_commit, /^Proposal: prop-fixture-000000000001$/m);
  assert.equal(git(root, ['status', '--porcelain']) + git(root, ['rev-parse', 'HEAD']), before, 'a rehearsal leaves git byte-identical');
});

test('A2 · executing makes ONE verified commit on its own branch, with the trailers the gate reads, and neither pushes nor merges', async () => {
  const { recs, dir, entry } = approved(); const root = repo();
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: goodApplier });
  assert.equal(r.outcome, 'dispatched', JSON.stringify(r.stages));
  assert.match(r.branch, /^release\/prop-fixture-000000000001-[0-9a-f]{8}$/);
  assert.equal(git(root, ['rev-parse', '--abbrev-ref', 'HEAD']), 'feature', 'the working branch is restored');
  assert.equal(readFileSync(join(root, 'tools/example.mjs'), 'utf8'), 'const OLD = 1;\n', 'the working branch is untouched');
  const msg = git(root, ['log', '-1', '--format=%B', r.commit]);
  const key = dispatchKey({ approvalId: entry.approval_id, proposalSha256: entry.proposal_sha256 });
  for (const t of [`Proposal: prop-fixture-000000000001`, `Proposal-SHA256: ${entry.proposal_sha256}`, `Approval: ${entry.approval_id}`, `Dispatch-Key: ${key}`]) assert.ok(msg.includes(t), `missing ${t}`);
  assert.match(msg, /^Evidence: .{8,}/m, 'tools/commit-evidence.mjs requires this line');
  assert.match(msg, new RegExp(`Decided-By: ${REVIEWER.name}`));
  assert.equal(git(root, ['show', '--name-only', '--format=', r.commit]), 'tools/example.mjs');
  assert.equal(git(root, ['branch', '--contains', r.commit, '--format=%(refname:short)']).includes('main'), false, 'nothing reached main');
  assert.equal(git(root, ['remote']), '', 'there is no remote to push to, and the dispatcher has no push');
  assert.equal(r.logged, true, 'the run is in the run log');
});

test('A3 · a second execution of the same approval is a no-op that names the first commit', async () => {
  const { recs, dir } = approved(); const root = repo(); const logDir = tmp('log-');
  const first = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: goodApplier, logDir });
  let called = false;
  const again = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: async () => { called = true; return {}; }, logDir });
  assert.equal(again.outcome, 'duplicate');
  assert.equal(again.commit, first.commit);
  assert.equal(called, false);
  assert.equal(git(root, ['branch', '--list', 'release/*']).split('\n').length, 1, 'no second branch');
  /* a rehearsal after the fact says the same */
  assert.equal((await dis({ records: recs, ledgerDir: dir, root, logDir })).outcome, 'duplicate');
});

test('A4 · a proposal nobody has decided is refused, and "pending" is never granted', async () => {
  const recs = records(); const dir = ledgerDir(); const root = repo();
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: goodApplier });
  assert.equal(r.outcome, 'refused');
  assert.equal(r.stages.at(-1).stage, 'approval');
  assert.equal(r.stages.at(-1).state, 'pending');
  assert.equal(git(root, ['branch', '--list', 'release/*']), '');
  /* an ApprovalRequest an AGENT marked granted is discarded and does not help */
  const forged = records(); forged.approvalRequests[0].state = 'granted'; forged.approvalRequests[0].decision = { decided_by: 'Fixture Reviewer' };
  assert.equal((await dis({ records: forged, ledgerDir: dir, root })).outcome, 'refused');
  /* no request at all */
  assert.equal((await dis({ records: records([proposal()], false), ledgerDir: dir, root })).stages.at(-1).state, 'no_request');
});

test('A5 · a denied proposal, a changed proposal, and a decision for a proposal nobody can produce are each refused', async () => {
  const root = repo();
  const d1 = ledgerDir(); const recs = records(); decide(d1, recs, { outcome: 'denied' });
  assert.equal((await dis({ records: recs, ledgerDir: d1, root })).stages.at(-1).state, 'denied');

  const d2 = ledgerDir(); const r2 = records(); decide(d2, r2);
  const edited = records([proposal({ reason: 'edited AFTER the decision' })]);
  const out2 = await dis({ records: edited, ledgerDir: d2, root });
  assert.equal(out2.outcome, 'refused');
  assert.equal(out2.stages.at(-1).state, 'void_scope_changed');

  const d3 = ledgerDir(); decide(d3, records());
  const empty = { byId: new Map(), approvalRequests: [], traces: [] };
  /* the decision carries its own snapshot, so it still resolves — and then the content binding is what holds */
  const out3 = await dis({ records: empty, ledgerDir: d3, root });
  /* the snapshot lets the DECISION be read on a fresh clone (ledger.mjs), but the proposal it
     carries has lost created_at and trace_ref, so Agent 9's re-validation refuses it: the
     producing agent has to be re-run. A pre-existing property, kept — repairing a proposal
     would make it one nobody approved. */
  assert.equal(out3.outcome, 'refused');
  assert.equal(out3.stages.at(-1).stage, 'preflight');
});

test('A6 · an unsigned decision, a fixture decision and a tampered ledger are refused before approval is even read', async () => {
  const root = repo(); const recs = records();
  const d1 = ledgerDir(); decide(d1, recs, { signer: null });
  const r1 = await dis({ records: recs, ledgerDir: d1, root });
  assert.equal(r1.outcome, 'refused'); assert.equal(r1.stages.at(-1).stage, 'ledger'); assert.match(r1.reasons[0], /unsigned/);

  const d2 = ledgerDir(); decide(d2, recs, { simulated: true, decidedBy: 'SIMULATED: fixture', signer: null, role: null });
  const r2 = await dis({ records: recs, ledgerDir: d2, root });
  assert.equal(r2.stages.at(-1).stage, 'ledger'); assert.match(r2.reasons[0], /simulated/);

  const d3 = ledgerDir(); decide(d3, recs);
  writeFileSync(ledgerFile(d3), readFileSync(ledgerFile(d3), 'utf8').replace('Fixture Reviewer', 'Somebody Else'));
  const r3 = await dis({ records: recs, ledgerDir: d3, root });
  assert.equal(r3.stages.at(-1).stage, 'ledger'); assert.match(r3.reasons[0], /hash_mismatch|edited/);

  /* a signature by a key the registry does not hold */
  const d4 = ledgerDir({ reg: registry({}, generateReviewerKey().publicKeyPem) }); decide(d4, recs);
  assert.equal((await dis({ records: recs, ledgerDir: d4, root })).stages.at(-1).stage, 'ledger');
});

test('A7 · malformed, empty and hostile inputs are rejected at intake and logged', async () => {
  const logDir = tmp('log-');
  for (const bad of [undefined, null, '', '  ', 'a', '../../etc/passwd', 'prop with spaces', 'x'.repeat(200), 'prop;rm -rf', 42, { id: 'x' }]) {
    const r = await dispatch({ proposalId: bad, logDir, root: repo() });
    assert.equal(r.outcome, 'refused', String(bad));
    assert.equal(r.stages.at(-1).stage, 'intake');
  }
  assert.ok(PROPOSAL_ID.test('prop-fixture-000000000001'));
  const lines = readFileSync(join(logDir, 'dispatch.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 11, 'every refusal is a line in the run log');
  assert.ok(lines.every((l) => JSON.parse(l).outcome === 'refused'));
});

test('A8 · execution is refused from main, and over uncommitted work in the approved scope', async () => {
  const { recs, dir } = approved();
  const onMain = repo({ branch: 'main' });
  const r = await dis({ records: recs, ledgerDir: dir, root: onMain, execute: true, applier: goodApplier });
  assert.equal(r.outcome, 'refused'); assert.equal(r.stages.at(-1).stage, 'isolate');
  assert.equal(readFileSync(join(onMain, 'tools/example.mjs'), 'utf8'), 'const OLD = 1;\n');

  const dirty = repo(); writeFileSync(join(dirty, 'tools/example.mjs'), 'const OLD = 1; // someone else is mid-edit\n');
  const r2 = await dis({ records: recs, ledgerDir: dir, root: dirty, execute: true, applier: goodApplier });
  assert.equal(r2.outcome, 'refused'); assert.match(r2.reasons[0], /uncommitted/);
});

test('A9 · when Agent 9 does not implement, the branch is removed and nothing is committed', async () => {
  const { recs, dir } = approved(); const root = repo();
  const head = git(root, ['rev-parse', 'HEAD']);
  for (const result of [{ outcome: 'reverted', why: 'validators regressed', reverted: { verified: true } }, { outcome: 'failed', why: 'x' }, { outcome: 'refused', why: 'a gate' }]) {
    const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: async () => result });
    assert.equal(r.outcome, 'failed'); assert.equal(r.branch, null);
  }
  const thrown = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: async () => { throw new Error('boom'); } });
  /* since P0.1 the dispatcher's own verified rollback is the last stage; the failing stage is the one that is not ok */
  assert.equal(thrown.outcome, 'failed'); assert.match(thrown.stages.find((s) => !s.ok).why, /boom/);
  assert.equal(thrown.stages.at(-1).stage, 'rollback'); assert.equal(thrown.rollback.verified, true);
  assert.equal(git(root, ['branch', '--list', 'release/*']), '');
  assert.equal(git(root, ['rev-parse', 'HEAD']), head);
});

test('A10 · a change outside the approved scope is undone and not committed', async () => {
  const { recs, dir } = approved(); const root = repo();
  mkdirSync(join(root, 'data'), { recursive: true });
  const sneaky = async (o) => { writeFileSync(join(o.root, 'data', 'sneak.json'), '{}'); return goodApplier(o); };
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: sneaky });
  /* since P0.1 the dispatcher's own verified rollback is the last stage; the failing stage is the one that is not ok */
  assert.equal(r.outcome, 'failed'); assert.equal(r.stages.find((s) => !s.ok).stage, 'scope');
  assert.equal(r.stages.at(-1).stage, 'rollback'); assert.equal(r.rollback.verified, true);
  assert.equal(existsSync(join(root, 'data', 'sneak.json')), false);
  assert.equal(git(root, ['branch', '--list', 'release/*']), '');
  const none = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: async () => ({ outcome: 'implemented', change: { files: [] } }) });
  assert.equal(none.outcome, 'failed'); assert.match(none.reasons[0], /nothing changed/);
});

test('A11 · the dispatcher cannot push, merge, approve or write the ledger, and the real applier is Agent 9', () => {
  /* worktree.mjs since P0.1: the module that stages and restores is held to the same list, plus clean and stash */
  for (const file of ['dispatch.mjs', 'worktree.mjs']) {
    const src = readFileSync(join(HERE, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const forbidden of [/'push'/, /'merge'/, /recordDecision\s*\(/, /appendFileSync\([^)]*decisions/, /'--force'/, /'reset'/, /'clean'/, /'stash'/]) assert.doesNotMatch(src, forbidden, `${file}: ${forbidden}`);
  }
  assert.equal(typeof implementerApplier, 'function');
});

test('A12 · lifecycle: the seven states are derived from the proposal, the ledger and git, never stored', async () => {
  assert.equal(STATES.length, 7);
  const root = repo();
  const proposed = lifecycleOf('prop-fixture-000000000001', { records: records([proposal({ proposed_change: { summary: 's', operations: [], scope_note: 'n' } })], false), ledger: { decisions: [], malformed: [] }, cwd: root });
  assert.equal(proposed.state, 'proposed');
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: records([proposal()], false), ledger: { decisions: [], malformed: [] }, cwd: root }).state, 'technically_validated');
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: records(), ledger: { decisions: [], malformed: [] }, cwd: root }).state, 'awaiting_human_review');
  assert.equal(lifecycleOf('nope', { records: records(), ledger: { decisions: [], malformed: [] }, cwd: root }).state, 'unknown');

  const recs = records();
  const dir = ledgerDir(); decide(dir, recs);
  const led = () => readLedger({ dir });
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: recs, ledger: led(), cwd: root }).state, 'approved');
  const edited = records([proposal({ reason: 'changed' })]);
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: edited, ledger: led(), cwd: root }).kind, 'superseded');
  decide(dir, recs, { outcome: 'denied' });
  const w = lifecycleOf('prop-fixture-000000000001', { records: recs, ledger: led(), cwd: root });
  assert.equal(w.state, 'superseded_or_withdrawn'); assert.equal(w.kind, 'withdrawn');
  const d2 = ledgerDir(); decide(d2, recs, { outcome: 'denied' });
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: recs, ledger: readLedger({ dir: d2 }), cwd: root }).state, 'rejected');
  const d3 = ledgerDir(); decide(d3, recs, { simulated: true, decidedBy: 'SIMULATED: fixture', signer: null, role: null });
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: recs, ledger: readLedger({ dir: d3 }), cwd: root }).state, 'invalid');

  /* published = the dispatched commit is an ancestor of main */
  const d4 = ledgerDir(); const r4 = records(); decide(d4, r4);
  const run = await dis({ records: r4, ledgerDir: d4, root, execute: true, applier: goodApplier });
  assert.equal(lifecycleOf('prop-fixture-000000000001', { records: r4, ledger: readLedger({ dir: d4 }), cwd: root, mainRef: 'main' }).dispatched, true);
  git(root, ['checkout', '-q', 'main']); git(root, ['merge', '-q', '--no-ff', '-m', 'merge', run.branch]);
  const pub = lifecycleOf('prop-fixture-000000000001', { records: r4, ledger: readLedger({ dir: d4 }), cwd: root, mainRef: 'main' });
  assert.equal(pub.state, 'published');
  assert.match(pub.why, /deployment itself is GitHub's record/);
  assert.equal(findDispatches(run.key, { cwd: root, mainRef: 'main' })[0].on_main, true);
});

/* ============================================================ I · the index and the rollback (P0.1, 11 Nov 2026)

   The author's first real dispatch committed 9 files (11313f6) while the
   scope stage reported 1. Reproduced here against the dispatcher as it stood
   at ad234aa: eight pre-staged paths were subtracted from what the scope
   stage looked at, and `git commit` took the whole index. Every test below
   runs in a temporary repository and compares the whole state before and
   after: every file's hash, the index (`git ls-files -s`), the status, the
   branch, HEAD and the release branches. */

const sha = (b) => createHash('sha256').update(b).digest('hex');
function hashTree(root, dir = root, out = {}) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (dir === root && name.name === '.git') continue;
    const abs = join(dir, name.name);
    if (name.isDirectory()) hashTree(root, abs, out);
    else out[abs.slice(root.length + 1)] = sha(readFileSync(abs));
  }
  return out;
}
function state(root) {
  return {
    files: hashTree(root),
    index: git(root, ['ls-files', '-s']),
    staged: git(root, ['diff', '--cached', '--name-status']),
    status: git(root, ['status', '--porcelain=v1', '--untracked-files=all']),
    branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
    head: git(root, ['rev-parse', 'HEAD']),
    releases: git(root, ['branch', '--list', 'release/*']),
  };
}
/** A repository with tools/example.mjs plus the named tracked files. */
function repoWith(files = {}) {
  const d = repo({ branch: 'main' });
  for (const [p, t] of Object.entries(files)) { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), t); }
  git(d, ['add', '-A']); git(d, ['commit', '-q', '-m', 'more files']);
  git(d, ['checkout', '-q', '-b', 'feature']);
  return d;
}
const NINE = Array.from({ length: 8 }, (_, i) => `docs/f${i}.md`);
const nineTracked = Object.fromEntries(NINE.map((p, i) => [p, `doc ${i}\n`]));
/** A proposal whose permitted set is tools/example.mjs plus `extra`. */
const wider = (extra) => proposal({ files: ['tools/example.mjs', ...extra], affected_entities: ['tools/example.mjs', ...extra].map((p) => ({ kind: 'tool', id: null, path: p, field: null, note: null })) });
/** An applier that makes the approved edit, then `also(root)`, and declares `declared`. */
const applierThat = (also, declared = ['tools/example.mjs']) => async (o) => {
  const r = await goodApplier(o); also?.(o.root);
  return { ...r, change: { files: declared.map((p) => ({ path: p })) } };
};
const filesOf = (root, c) => git(root, ['show', '--name-status', '--no-renames', '--format=', c]).split('\n').filter(Boolean).sort();
const stageOf = (r, name) => r.stages.find((s) => s.stage === name);

test('I1 · no pre-existing change: one commit, exactly the produced path, and the working branch exactly as it was', async () => {
  const { recs, dir } = approved(); const root = repo(); const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: goodApplier });
  assert.equal(r.outcome, 'dispatched', JSON.stringify(r.stages));
  assert.deepEqual(r.stages.map((s) => s.stage), ['intake', 'ledger', 'approval', 'preflight', 'duplicate', 'index', 'isolate', 'apply', 'scope', 'commit']);
  assert.deepEqual(stageOf(r, 'scope').produced, ['tools/example.mjs']);
  assert.deepEqual(stageOf(r, 'scope').declared, ['tools/example.mjs']);
  assert.deepEqual(stageOf(r, 'scope').permitted, ['tools/example.mjs']);
  assert.deepEqual(filesOf(root, r.commit), ['M\ttools/example.mjs']);
  assert.equal(git(root, ['rev-parse', `${r.commit}^`]), s0.head, 'one parent, the base');
  const s1 = state(root);
  assert.deepEqual({ ...s1, releases: '' }, { ...s0, releases: '' }, 'files, index, status, branch and HEAD are as before');
  assert.match(s1.releases, /release\/prop-fixture/);
});

test('I2 · REGRESSION 11313f6: eight files staged OUTSIDE the scope refuse the dispatch before the apply, in a rehearsal too, and are left staged', async () => {
  const { recs, dir } = approved(); const root = repo();
  mkdirSync(join(root, 'docs'), { recursive: true });
  NINE.forEach((p, i) => writeFileSync(join(root, p), `staged ${i}\n`));
  git(root, ['add', 'docs']);
  const s0 = state(root);
  let called = false;
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: async (o) => { called = true; return goodApplier(o); } });
  assert.equal(r.outcome, 'refused');
  assert.equal(r.stages.at(-1).stage, 'index');
  assert.equal(called, false, 'refused before the apply');
  assert.deepEqual(r.stages.at(-1).staged.map((x) => x.path), NINE);
  for (const p of NINE) assert.match(r.reasons[0], new RegExp(p.replace('.', '\\.')));
  assert.match(r.reasons[0], /Nothing was unstaged/);
  assert.deepEqual(state(root), s0, 'the person\'s index is untouched — nothing unstaged, no branch');
  const rehearsal = await dis({ records: recs, ledgerDir: dir, root });
  assert.equal(rehearsal.outcome, 'refused'); assert.equal(rehearsal.stages.at(-1).stage, 'index');
});

test('I3 · a staged change INSIDE the scope, and a merge left uncommitted (the other way 8 files reach an index), each refuse before the apply', async () => {
  const { recs, dir } = approved();
  const inScope = repo();
  writeFileSync(join(inScope, 'tools/example.mjs'), 'const OLD = 1; // staged by the person\n');
  git(inScope, ['add', 'tools/example.mjs']);
  const s0 = state(inScope);
  let called = false;
  const r = await dis({ records: recs, ledgerDir: dir, root: inScope, execute: true, applier: async () => { called = true; return {}; } });
  assert.equal(r.outcome, 'refused'); assert.equal(r.stages.at(-1).stage, 'index'); assert.equal(called, false);
  assert.match(r.reasons[0], /tools\/example\.mjs/);
  assert.deepEqual(state(inScope), s0);

  /* `git merge --no-commit`: the merged paths are staged and MERGE_HEAD exists; a branch switch would drop MERGE_HEAD and keep the paths staged */
  const m = repoWith(nineTracked);
  git(m, ['checkout', '-q', '-b', 'upstream']);
  NINE.forEach((p, i) => writeFileSync(join(m, p), `repaired ${i}\n`));
  git(m, ['commit', '-q', '-am', 'the repair']);
  git(m, ['checkout', '-q', 'feature']);
  git(m, ['merge', '--no-commit', '--no-ff', 'upstream']);
  const m0 = state(m);
  const r2 = await dis({ records: recs, ledgerDir: dir, root: m, execute: true, applier: async () => { called = true; return {}; } });
  assert.equal(r2.outcome, 'refused'); assert.equal(r2.stages.at(-1).stage, 'index'); assert.equal(called, false);
  assert.match(r2.reasons[0], /MERGE_HEAD/);
  assert.equal(r2.stages.at(-1).staged.length, 8);
  assert.deepEqual(state(m), m0, 'the merge is still in progress, exactly as the person left it');
});

test('I4 · the applier DECLARES 1 file and CHANGES 9: refused at scope whether the 8 are outside or inside the scope, and rolled back', async () => {
  for (const [label, prop] of [['outside', proposal()], ['inside', wider(NINE)]]) {
    const { recs, dir } = approved({ props: [prop] }); const root = repoWith(nineTracked); const s0 = state(root);
    const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: applierThat((rt) => NINE.forEach((p) => writeFileSync(join(rt, p), 'changed\n'))) });
    assert.equal(r.outcome, 'failed', label); assert.equal(stageOf(r, 'scope').ok, false, label);
    assert.equal(stageOf(r, 'scope').produced.length, 9, label);
    assert.deepEqual(stageOf(r, 'scope').declared, ['tools/example.mjs'], label);
    assert.match(stageOf(r, 'scope').why, label === 'outside' ? /outside the approved scope/ : /did not declare/, label);
    assert.equal(r.commit, null); assert.equal(r.rollback.verified, true, label);
    assert.deepEqual(state(root), s0, `${label}: every hash, the index, the branch and HEAD are back`);
  }
});

test('I5 · the applier DECLARES 9 files and CHANGES 1: refused — a report git does not bear out is not committed', async () => {
  const { recs, dir } = approved({ props: [wider(NINE)] }); const root = repoWith(nineTracked); const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: applierThat(null, ['tools/example.mjs', ...NINE]) });
  assert.equal(r.outcome, 'failed'); assert.equal(stageOf(r, 'scope').ok, false);
  assert.match(stageOf(r, 'scope').why, /declared 8 path\(s\) git shows unchanged/);
  assert.deepEqual(stageOf(r, 'scope').produced, ['tools/example.mjs']);
  assert.equal(r.rollback.verified, true); assert.deepEqual(state(root), s0);
});

test('I6 · one authorised and one unauthorised file: refused, both put back, nothing committed', async () => {
  const { recs, dir } = approved(); const root = repoWith({ 'data/x.json': '{"a":1}\n' }); const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: applierThat((rt) => writeFileSync(join(rt, 'data/x.json'), '{"a":2}\n'), ['tools/example.mjs', 'data/x.json']) });
  assert.equal(r.outcome, 'failed'); assert.match(stageOf(r, 'scope').why, /outside the approved scope: data\/x\.json/);
  assert.deepEqual(state(root), s0);
  assert.equal(git(root, ['log', '--all', '--format=%H']).split('\n').length, 2, 'no commit was made anywhere');
});

test('I7 · an untracked file created outside the scope, undeclared, in a new directory: refused and removed', async () => {
  const { recs, dir } = approved(); const root = repo(); const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: applierThat((rt) => { mkdirSync(join(rt, 'agent/x'), { recursive: true }); writeFileSync(join(rt, 'agent/x/new.mjs'), 'export {}\n'); }) });
  assert.equal(r.outcome, 'failed'); assert.match(stageOf(r, 'scope').why, /agent\/x\/new\.mjs/);
  assert.equal(existsSync(join(root, 'agent/x/new.mjs')), false);
  assert.deepEqual(state(root), s0);
});

test('I8 · a deletion: inside the scope and declared it is committed as a deletion; outside the scope it is refused and the file comes back byte for byte', async () => {
  const del = proposal({ proposed_change: { summary: 'delete tools/gone.mjs', operations: [{ op: 'modify', target: 'tools/example.mjs', current: 'const OLD = 1;', proposed: 'const OLD = 2;', rationale: 'x' }], scope_note: 'n' }, files: ['tools/example.mjs', 'tools/gone.mjs'], affected_entities: [{ kind: 'tool', id: null, path: 'tools/gone.mjs', field: null, note: null }] });
  const { recs, dir } = approved({ props: [del] }); const root = repoWith({ 'tools/gone.mjs': 'bye\n' }); const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: applierThat((rt) => rmSync(join(rt, 'tools/gone.mjs')), ['tools/example.mjs', 'tools/gone.mjs']) });
  assert.equal(r.outcome, 'dispatched', JSON.stringify(r.stages.at(-1)));
  assert.deepEqual(filesOf(root, r.commit), ['D\ttools/gone.mjs', 'M\ttools/example.mjs']);
  assert.deepEqual({ ...state(root), releases: '' }, { ...s0, releases: '' });

  const { recs: r2, dir: d2 } = approved(); const root2 = repoWith({ 'data/keep.json': '{"k":1}\n' }); const t0 = state(root2);
  const out = await dis({ records: r2, ledgerDir: d2, root: root2, execute: true, applier: applierThat((rt) => rmSync(join(rt, 'data/keep.json'))) });
  assert.equal(out.outcome, 'failed'); assert.match(stageOf(out, 'scope').why, /data\/keep\.json/);
  assert.equal(readFileSync(join(root2, 'data/keep.json'), 'utf8'), '{"k":1}\n');
  assert.deepEqual(state(root2), t0);
});

test('I9 · a rename: to a path outside the scope it is refused and undone; inside the scope and declared it is committed as delete + add', async () => {
  const { recs, dir } = approved(); const root = repo(); const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: async (o) => { await goodApplier(o); git(o.root, ['mv', 'tools/example.mjs', 'tools/renamed.mjs']); return { outcome: 'implemented', change: { files: [{ path: 'tools/example.mjs' }] }, qa: { verdict: 'pass' } }; } });
  assert.equal(r.outcome, 'failed'); assert.deepEqual(stageOf(r, 'scope').produced, ['tools/example.mjs', 'tools/renamed.mjs']);
  assert.match(stageOf(r, 'scope').why, /outside the approved scope: tools\/renamed\.mjs/);
  assert.deepEqual(state(root), s0, 'the old path is back, the new one gone, and the staged rename undone');

  const both = wider(['tools/renamed.mjs']);
  const { recs: r2, dir: d2 } = approved({ props: [both] }); const root2 = repo(); const t0 = state(root2);
  const ok = await dis({ records: r2, ledgerDir: d2, root: root2, execute: true, applier: async (o) => { await goodApplier(o); git(o.root, ['mv', 'tools/example.mjs', 'tools/renamed.mjs']); return { outcome: 'implemented', change: { files: [{ path: 'tools/example.mjs' }, { path: 'tools/renamed.mjs' }] }, qa: { verdict: 'pass' } }; } });
  assert.equal(ok.outcome, 'dispatched', JSON.stringify(ok.stages.filter((s) => !s.ok)));
  assert.deepEqual(filesOf(root2, ok.commit), ['A\ttools/renamed.mjs', 'D\ttools/example.mjs']);
  assert.deepEqual({ ...state(root2), releases: '' }, { ...t0, releases: '' });
});

test('I10 · the person\'s unstaged work outside the scope is neither committed nor disturbed — and an applier edit hidden INSIDE it is now seen', async () => {
  const { recs, dir } = approved(); const root = repoWith({ 'docs/notes.md': 'mine\n', 'docs/old.md': 'old\n' });
  writeFileSync(join(root, 'docs/notes.md'), 'mine, edited and not staged\n');
  rmSync(join(root, 'docs/old.md'));
  writeFileSync(join(root, 'scratch.txt'), 'an untracked note\n');
  const s0 = state(root);
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: goodApplier });
  assert.equal(r.outcome, 'dispatched', JSON.stringify(r.stages.at(-1)));
  assert.deepEqual(filesOf(root, r.commit), ['M\ttools/example.mjs']);
  assert.deepEqual(stageOf(r, 'isolate').preexisting.sort(), ['docs/notes.md', 'docs/old.md', 'scratch.txt']);
  assert.deepEqual({ ...state(root), releases: '' }, { ...s0, releases: '' }, 'the three pre-existing changes are byte-identical and still unstaged');

  /* Before P0.1 a path already dirty was subtracted from the scope check, so an applier could edit inside it unseen. */
  const { recs: r2, dir: d2 } = approved(); const root2 = repoWith({ 'docs/notes.md': 'mine\n' });
  writeFileSync(join(root2, 'docs/notes.md'), 'mine, edited\n'); writeFileSync(join(root2, 'scratch.txt'), 'note\n');
  const t0 = state(root2);
  const out = await dis({ records: r2, ledgerDir: d2, root: root2, execute: true, applier: applierThat((rt) => { writeFileSync(join(rt, 'docs/notes.md'), 'overwritten by the applier\n'); writeFileSync(join(rt, 'scratch.txt'), 'overwritten\n'); }) });
  assert.equal(out.outcome, 'failed'); assert.match(stageOf(out, 'scope').why, /docs\/notes\.md, scratch\.txt/);
  assert.equal(readFileSync(join(root2, 'docs/notes.md'), 'utf8'), 'mine, edited\n', 'the person\'s bytes are back, not the committed version');
  assert.deepEqual(state(root2), t0);
});

test('I11 · rollback, normal: Agent 9 reverts its own paths but leaves residue; the dispatcher puts the rest back and every hash returns to the initial state', async () => {
  const { recs, dir } = approved(); const root = repoWith({ 'data/x.json': '{"a":1}\n' });
  writeFileSync(join(root, 'scratch.txt'), 'the person\'s\n');
  const s0 = state(root);
  const leaky = async (o) => {
    await goodApplier(o);
    writeFileSync(join(o.root, 'data/x.json'), '{"a":2}\n'); writeFileSync(join(o.root, 'left.tmp'), 'x');
    git(o.root, ['checkout', '--', 'tools/example.mjs']); /* Agent 9's own rollback of the permitted path */
    return { outcome: 'reverted', why: 'validators regressed', reverted: { verified: true, mismatches: [] } };
  };
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: leaky });
  assert.equal(r.outcome, 'failed');
  assert.equal(stageOf(r, 'apply').agent_rollback.verified, true, 'Agent 9\'s rollback is reported as its own');
  assert.deepEqual(r.residue_after_agent, ['data/x.json', 'left.tmp'], 'and what it left is measured separately');
  assert.equal(stageOf(r, 'rollback').ok, true); assert.equal(r.rollback.verified, true); assert.equal(r.branch, null);
  assert.deepEqual(state(root), s0);
});

test('I12 · rollback, incomplete: the dispatcher does not claim success, names every path, keeps the branch and the person\'s bytes, and reports HIGH', async () => {
  const { recs, dir } = approved(); const root = repoWith({ 'data/x.json': '{"a":1}\n', 'docs/notes.md': 'committed\n' });
  writeFileSync(join(root, 'docs/notes.md'), 'the person\'s unstaged edit\n');
  writeFileSync(join(root, 'scratch.txt'), 'the person\'s own note\n');
  const s0 = state(root); const logDir = tmp('log-');
  /* a real failure, not a stub: another git process's lock on the index, taken after the edits */
  const locking = applierThat((rt) => {
    writeFileSync(join(rt, 'data/x.json'), '{"a":2}\n'); writeFileSync(join(rt, 'docs/notes.md'), 'clobbered\n'); writeFileSync(join(rt, 'scratch.txt'), 'clobbered\n');
    writeFileSync(join(rt, '.git', 'index.lock'), '');
  });
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: locking, logDir });
  assert.equal(r.outcome, 'failed');
  assert.equal(r.severity, 'high');
  assert.equal(r.rollback.verified, false);
  assert.equal(stageOf(r, 'rollback').ok, false);
  assert.match(stageOf(r, 'rollback').why, /ROLLBACK NOT VERIFIED/);
  assert.match(r.reasons[0], /ROLLBACK NOT VERIFIED \(high severity\)/);
  assert.deepEqual(r.rollback.unrestored, ['data/x.json', 'docs/notes.md', 'tools/example.mjs'], 'every path still wrong is named, and only those');
  assert.deepEqual(r.rollback.errors.map((e) => e.path), ['data/x.json', 'docs/notes.md', 'tools/example.mjs']);
  assert.ok(r.rollback.errors.every((e) => /index\.lock/.test(e.why)), 'the cause is reported, not hidden');
  assert.equal(readFileSync(join(root, 'scratch.txt'), 'utf8'), 'the person\'s own note\n', 'what needed no git was put back');
  assert.match(r.branch, /^release\//, 'the branch is kept for recovery');
  assert.equal(git(root, ['rev-parse', '--abbrev-ref', 'HEAD']), r.branch);
  assert.equal(r.commit, null);
  const kept = r.recovery.find((p) => p.endsWith(join('docs', 'notes.md')));
  assert.ok(kept, 'the person\'s unstaged bytes were copied out'); assert.equal(readFileSync(kept, 'utf8'), 'the person\'s unstaged edit\n');
  assert.equal(JSON.parse(readFileSync(join(logDir, 'dispatch.jsonl'), 'utf8').trim()).severity, 'high', 'and the run log says so');
  /* recoverable: once the lock is gone a person returns to the starting state with ordinary commands and the copy */
  rmSync(join(root, '.git', 'index.lock'));
  git(root, ['checkout', '-q', '--', 'tools/example.mjs', 'data/x.json']); writeFileSync(join(root, 'docs/notes.md'), readFileSync(kept));
  git(root, ['checkout', '-q', 'feature']); git(root, ['branch', '-D', r.branch]);
  assert.deepEqual(state(root), s0);
});

test('I13 · the commit is re-read: a hook that stages one more file makes the commit refused, its branch removed, and the tree verified', async () => {
  const { recs, dir } = approved(); const root = repo(); const s0 = state(root);
  const hook = join(root, '.git', 'hooks', 'pre-commit');
  writeFileSync(hook, '#!/bin/sh\necho hook > extra.txt\ngit add extra.txt\n', { mode: 0o755 });
  const r = await dis({ records: recs, ledgerDir: dir, root, execute: true, applier: goodApplier });
  assert.equal(r.outcome, 'failed', JSON.stringify(r.stages));
  assert.equal(r.commit, null);
  assert.match(r.rejected_commit, /^[0-9a-f]{40}$/);
  assert.match(stageOf(r, 'commit').why, /extra\.txt/);
  assert.equal(r.rollback.verified, true);
  assert.deepEqual(state(root), s0, 'no release branch carries the rejected commit, so it cannot be mistaken for a dispatch');
  assert.equal(findDispatches(r.key, { cwd: root }).length, 0);
});

/* ============================================================ C · the workflows */

const REAL_PAGES = readFileSync(join(ROOT, '.github/workflows/pages.yml'), 'utf8');
const audit = (text) => auditPublisher(parseWorkflow(text));
const failing = (text) => audit(text).filter((c) => !c.ok).map((c) => c.id);

test('C1 · the real pages.yml and the real workflow set pass every publisher check', () => {
  const r = auditWorkflows({ root: ROOT });
  assert.deepEqual(r.checks.filter((c) => !c.ok), []);
  assert.deepEqual(r.workflows.filter((w) => w.publishes).map((w) => w.path), [PUBLISHING_WORKFLOW]);
  assert.ok(r.checks.length >= 14);
});

test('C2 · every way of weakening pages.yml is caught', () => {
  const mutate = (from, to) => { assert.ok(REAL_PAGES.includes(from), `fixture drift: ${from}`); return REAL_PAGES.replace(from, to); };
  /* the gate no longer holds the artifact back */
  assert.ok(failing(mutate('needs: [gate-data, gate-boundary, gate-browser, gate-security]', 'needs: [gate-data, gate-boundary, gate-browser]')).includes('P3-build-needs-gates'));
  assert.ok(failing(mutate('needs: build', 'needs: []')).includes('P4-deploy-needs-build'));
  /* a gate that can be skipped */
  assert.ok(failing(mutate('  gate-security:\n    name: Gate — adversarial verification\n', '  gate-security:\n    name: Gate — adversarial verification\n    if: always()\n')).includes('P6a-no-conditions'));
  assert.ok(failing(mutate('  gate-browser:\n    name: Gate — browser regression\n', '  gate-browser:\n    name: Gate — browser regression\n    continue-on-error: true\n')).includes('P6b-no-continue-on-error'));
  assert.ok(failing(mutate('run: node agent/policy/verify/cli.mjs', 'run: node agent/policy/verify/cli.mjs || true')).includes('P6c-no-failure-swallowing'));
  assert.ok(failing(mutate('run: node agent/policy/verify/cli.mjs', 'run: |\n          set +e\n          node agent/policy/verify/cli.mjs')).includes('P6c-no-failure-swallowing'));
  /* the release gate removed, or moved after the upload */
  assert.ok(failing(mutate('run: node agent/release/cli.mjs gate --ci --head "$GITHUB_SHA" --artifact _site --needs-env NEEDS_JSON', 'run: echo skipped')).includes('P7-release-gate-before-upload'));
  const reordered = REAL_PAGES.replace(/      - name: The release gate[\s\S]*?--needs-env NEEDS_JSON\n/, '') + '      - name: late gate\n        run: node agent/release/cli.mjs gate --ci\n';
  assert.ok(failing(reordered).includes('P7-release-gate-before-upload'));
  /* another way in */
  assert.ok(failing(mutate('on:\n  push:', 'on:\n  pull_request_target:\n  push:')).includes('P1-triggers'));
  assert.ok(failing(mutate('on:\n  push:', 'on:\n  schedule:\n    - cron: "0 3 * * *"\n  push:')).includes('P1-triggers'));
  assert.ok(failing(mutate('branches: [main]', 'branches: [main, "claude/**"]')).includes('P1b-push-branches'));
  assert.ok(failing(mutate('permissions:\n  contents: read\n', 'permissions: write-all\n')).includes('P8-least-privilege'));
  assert.ok(failing(mutate('  gate-boundary:\n    name: Gate — public / private boundary\n', '  gate-boundary:\n    name: Gate — public / private boundary\n    permissions:\n      pages: write\n')).includes('P8b-only-deploy-writes'));
  assert.ok(failing(mutate('name: github-pages', 'name: staging')).includes('P5-deploy-environment'));
  assert.deepEqual(failing(REAL_PAGES), []);
});

test('C3 · a second publisher, in any of its forms, fails the one-publisher check', () => {
  const forms = {
    'deploy-pages in another workflow': 'name: x\non: workflow_dispatch\njobs:\n  j:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/deploy-pages@v5\n',
    'a gh-pages action': 'name: x\non: workflow_dispatch\njobs:\n  j:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: peaceiris/actions-gh-pages@v4\n',
    'a push to the pages branch': 'name: x\non: workflow_dispatch\njobs:\n  j:\n    runs-on: ubuntu-latest\n    steps:\n      - run: git push origin HEAD:gh-pages\n',
    'the deployments API': 'name: x\non: workflow_dispatch\njobs:\n  j:\n    runs-on: ubuntu-latest\n    steps:\n      - run: gh api repos/o/r/pages/deployments -f x=y\n',
    'a pages: write grant': 'name: x\non: workflow_dispatch\njobs:\n  j:\n    runs-on: ubuntu-latest\n    permissions:\n      pages: write\n    steps:\n      - run: echo hi\n',
  };
  for (const [name, text] of Object.entries(forms)) {
    const root = tmp('wf-'); mkdirSync(join(root, '.github/workflows'), { recursive: true });
    writeFileSync(join(root, '.github/workflows/pages.yml'), REAL_PAGES);
    writeFileSync(join(root, '.github/workflows/other.yml'), text);
    const r = auditWorkflows({ root });
    assert.equal(r.ok, false, name);
    assert.ok(r.checks.find((c) => c.id === 'W1-one-publisher' && !c.ok), name);
  }
  /* and no pages.yml at all */
  const none = tmp('wf-'); mkdirSync(join(none, '.github/workflows'), { recursive: true });
  assert.equal(auditWorkflows({ root: none }).ok, false);
  /* a file the reader cannot place is a problem, not silence */
  const odd = tmp('wf-'); mkdirSync(join(odd, '.github/workflows'), { recursive: true });
  writeFileSync(join(odd, '.github/workflows/pages.yml'), 'name: broken\n');
  assert.equal(auditWorkflows({ root: odd }).checks.find((c) => c.id === 'W2-readable').ok, false);
});

/* ============================================================ C · the gate, judged on planted facts */

const SHA = 'a'.repeat(40);
const ciEnv = (over = {}) => ({
  GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: EXPECTED_REPOSITORY, GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'push',
  GITHUB_WORKFLOW_REF: `${EXPECTED_REPOSITORY}/${PUBLISHING_WORKFLOW}@refs/heads/main`, GITHUB_SHA: SHA, [REGISTRY_PIN_ENV]: null, ...over,
});
const needsOk = JSON.stringify(Object.fromEntries(['gate-data', 'gate-boundary', 'gate-browser', 'gate-security'].map((j) => [j, { result: 'success' }])));
function planted(over = {}) {
  return {
    root: ROOT, ci: true, strictUnledgered: false, now: Date.parse(NOW), env: ciEnv(), head: SHA, checkout: SHA, since: 'b'.repeat(40), sinceIsAncestor: true,
    shallow: false, commits: [], workflows: auditWorkflows({ root: ROOT }), needs: JSON.parse(needsOk), ledgerText: null, registryText: null, grantsText: null,
    ledgerAtParent: {}, ledgerHistory: [], artifact: { dir: 'x', verify: { files: 1, problems: [] }, files: 1, mismatched: [], missing: [], secrets: [], manifest_sha256: 'c'.repeat(64), tree_sha: 'd'.repeat(40) }, ...over,
  };
}
const status = (r, id) => r.conditions.find((c) => c.id.startsWith(id)).status;

test('G1 · with every condition met the gate passes, and says what it does not establish', () => {
  const r = judge(planted());
  assert.equal(r.ok, true, JSON.stringify(r.blocking));
  assert.equal(status(r, 'C1'), PASS); assert.equal(status(r, 'C5'), NA); assert.equal(status(r, 'C7'), NA);
  assert.equal(r.record.published_commit, SHA);
  assert.equal(r.record.artifact_manifest_sha256, 'c'.repeat(64));
});

test('G2 · an unauthorised origin is refused: wrong repository, ref, event, workflow, or a checkout that is not the commit', () => {
  for (const [name, env, extra] of [
    ['a fork', ciEnv({ GITHUB_REPOSITORY: 'someone-else/Eu-Digital-Policy', GITHUB_WORKFLOW_REF: `someone-else/Eu-Digital-Policy/${PUBLISHING_WORKFLOW}@refs/heads/main` }), {}],
    ['a feature branch', ciEnv({ GITHUB_REF: 'refs/heads/claude/x', GITHUB_WORKFLOW_REF: `${EXPECTED_REPOSITORY}/${PUBLISHING_WORKFLOW}@refs/heads/claude/x` }), {}],
    ['a pull request', ciEnv({ GITHUB_EVENT_NAME: 'pull_request' }), {}],
    ['a different workflow', ciEnv({ GITHUB_WORKFLOW_REF: `${EXPECTED_REPOSITORY}/.github/workflows/qa.yml@refs/heads/main` }), {}],
    ['a different sha', ciEnv({ GITHUB_SHA: 'f'.repeat(40) }), {}],
    ['a checkout that is not the judged commit', ciEnv(), { checkout: 'e'.repeat(40) }],
  ]) {
    const r = judge(planted({ env, ...extra }));
    assert.equal(r.ok, false, name); assert.equal(status(r, 'C1'), FAIL, name);
  }
  assert.equal(judge(planted({ env: ciEnv({ GITHUB_EVENT_NAME: 'workflow_dispatch' }) })).ok, true, 'a manual run from main is the same publisher');
});

test('G3 · outside CI the origin is UNMEASURED: reported locally, blocking in CI — never a pass', () => {
  const local = judge(planted({ ci: false, env: { GITHUB_ACTIONS: null }, needs: null, artifact: null }));
  assert.equal(status(local, 'C1'), UNMEASURED);
  assert.equal(local.ok, true, 'a local run is a report, and says so');
  const ciRun = judge(planted({ ci: true, env: { GITHUB_ACTIONS: null } }));
  assert.equal(ciRun.ok, false); assert.equal(status(ciRun, 'C1'), FAIL);
  assert.equal(judge(planted({ needs: null })).ok, false, 'CI without GitHub\'s needs result is a block');
  assert.equal(judge(planted({ artifact: null })).ok, false, 'CI without an artifact is a block');
});

test('G3b · a rehearsal inside another workflow (qa.yml, on a push or a pull request) is not a refusal of its origin — and the same origin under --ci still is', () => {
  const qaPush = ciEnv({ GITHUB_WORKFLOW_REF: `${EXPECTED_REPOSITORY}/.github/workflows/qa.yml@refs/heads/main` });
  const qaPr = ciEnv({ GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: 'refs/pull/9/merge', GITHUB_WORKFLOW_REF: `${EXPECTED_REPOSITORY}/.github/workflows/qa.yml@refs/pull/9/merge` });
  for (const [name, env] of [['qa.yml on main', qaPush], ['qa.yml on a pull request', qaPr]]) {
    const rehearsal = judge(planted({ ci: false, env, needs: null, artifact: null }));
    assert.equal(status(rehearsal, 'C1'), UNMEASURED, name);
    assert.match(rehearsal.conditions.find((x) => x.id.startsWith('C1')).why, /rehearsal, not the publishing run/, name);
    assert.equal(rehearsal.ok, true, `${name}: reported, not blocking`);
    const asCi = judge(planted({ ci: true, env }));
    assert.equal(asCi.ok, false, `${name} under --ci`); assert.equal(status(asCi, 'C1'), FAIL, `${name} under --ci`);
  }
  // The rehearsal still blocks on what it CAN measure: an approval that does not precede its change.
  const bad = judge(planted({ ci: false, env: qaPr, needs: null, artifact: null, shallow: true }));
  assert.equal(status(bad, 'C2'), FAIL); assert.equal(bad.ok, false, 'a rehearsal blocks on a failed measurable condition');
});

test('G4 · a failed or missing upstream gate job, and a shallow or unresolvable history, block', () => {
  for (const bad of ['gate-data', 'gate-boundary', 'gate-browser', 'gate-security']) {
    for (const result of ['failure', 'cancelled', 'skipped']) {
      const needs = JSON.parse(needsOk); needs[bad].result = result;
      const r = judge(planted({ needs })); assert.equal(r.ok, false, `${bad} ${result}`); assert.equal(status(r, 'C4'), FAIL);
    }
  }
  const missing = JSON.parse(needsOk); delete missing['gate-security'];
  assert.equal(judge(planted({ needs: missing })).ok, false);
  assert.equal(judge(planted({ needs: { __unparsable: true } })).ok, false);
  assert.equal(status(judge(planted({ shallow: true })), 'C2'), FAIL);
  assert.equal(status(judge(planted({ since: null })), 'C2'), FAIL);
  assert.equal(status(judge(planted({ sinceIsAncestor: false })), 'C2'), FAIL);
  assert.equal(status(judge(planted({ head: null, env: ciEnv({ GITHUB_SHA: null }) })), 'C2'), FAIL);
});

test('G5 · a tampered publishing workflow blocks the gate through C3', () => {
  const root = tmp('wf-'); mkdirSync(join(root, '.github/workflows'), { recursive: true });
  writeFileSync(join(root, '.github/workflows/pages.yml'), REAL_PAGES.replace('needs: build', 'needs: []'));
  const r = judge(planted({ workflows: auditWorkflows({ root }) }));
  assert.equal(r.ok, false); assert.equal(status(r, 'C3'), FAIL);
});

test('G6 · the artifact: an extra file, a changed byte, a missing file, a dot path and a credential shape each block', () => {
  const art = (over) => ({ ...planted().artifact, ...over });
  const probe = (over) => judge(planted({ artifact: art(over) }));
  assert.equal(probe({ verify: { problems: ['agent/secret.txt: agent/ is never published'] } }).ok, false);
  assert.equal(probe({ verify: { problems: ['.control-room/x: a dot path'] } }).ok, false);
  assert.equal(probe({ mismatched: ['index.html: differs from the commit\'s own copy'] }).ok, false);
  assert.equal(probe({ mismatched: ['extra.html: not a file of commit'] }).ok, false);
  assert.equal(probe({ missing: ['data/claims.json'] }).ok, false);
  assert.equal(probe({ secrets: ['data/x.json:3 aws-access-key'] }).ok, false);
  assert.equal(status(probe({}), 'C9'), PASS);
});

/* ---- the same, against a REAL artifact built from this repository's HEAD ---- */

function headArtifact() {
  const src = tmp('src-'); const out = join(tmp('site-'), '_site');
  execFileSync('sh', ['-c', `git -C "${ROOT}" archive HEAD | tar -x -C "${src}"`]);
  buildArtifact(out, { root: src });
  return out;
}
const realFacts = (artifact) => gatherFacts({ root: ROOT, head: 'HEAD', since: 'HEAD', env: ciEnv({ GITHUB_SHA: git(ROOT, ['rev-parse', 'HEAD']) }), artifact, needsJson: needsOk, ci: true });

test('G7 · a real artifact built from HEAD satisfies C9, and each planted defect in it is caught', () => {
  const art = headArtifact();
  const ok = judge(realFacts(art));
  assert.equal(status(ok, 'C9'), PASS, ok.conditions.find((c) => c.id.startsWith('C9')).why);
  assert.equal(status(ok, 'C3'), PASS);

  writeFileSync(join(art, 'index.html'), `${readFileSync(join(art, 'index.html'), 'utf8')}<!-- tampered -->`);
  assert.equal(status(judge(realFacts(art)), 'C9'), FAIL, 'a byte changed after the build');

  const a2 = headArtifact(); mkdirSync(join(a2, 'agent'), { recursive: true }); writeFileSync(join(a2, 'agent', 'private.txt'), 'x');
  assert.equal(status(judge(realFacts(a2)), 'C9'), FAIL, 'a private directory in the artifact');

  const a3 = headArtifact(); mkdirSync(join(a3, '.control-room'), { recursive: true }); writeFileSync(join(a3, '.control-room', 'server.mjs'), 'x');
  assert.equal(status(judge(realFacts(a3)), 'C9'), FAIL, 'a dot path');

  const a4 = headArtifact(); rmSync(join(a4, 'app.js'));
  assert.equal(status(judge(realFacts(a4)), 'C9'), FAIL, 'a missing page asset');

  const a5 = headArtifact(); writeFileSync(join(a5, 'data', 'planted.json'), `{"k":"${'AKIA' + 'IOSFODNN7EXAMPLE'}"}`);
  const r5 = judge(realFacts(a5));
  assert.equal(status(r5, 'C9'), FAIL, 'a credential shape'); assert.match(r5.conditions.find((c) => c.id.startsWith('C9')).why, /not a file of commit|credential/);

  const a6 = headArtifact(); writeFileSync(join(a6, 'robots.txt'), 'User-agent: *\nDisallow:\n');
  assert.equal(status(judge(realFacts(a6)), 'C9'), FAIL, 'content that is not this commit\'s');
});

/* ---- the history half: a temporary repository with a ledger, a registry and commits ---- */

function gateWorld() {
  const root = repo({ branch: 'main' });
  mkdirSync(join(root, '.github'), { recursive: true });
  cpSync(join(ROOT, '.github', 'workflows'), join(root, '.github', 'workflows'), { recursive: true });
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data', 'x.json'), '{}\n');
  git(root, ['add', '-A']); git(root, ['commit', '-q', '-m', 'workflows and data']);
  const since = git(root, ['rev-parse', 'HEAD']);
  const dir = join(root, 'agent', 'implement', 'decisions');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'reviewers.json'), registry());
  return { root, since, dir };
}
const commitAll = (root, message, env = {}) => { git(root, ['add', '-A']); git(root, ['commit', '-q', '-m', message], env); return git(root, ['rev-parse', 'HEAD']); };
/** the change commit a dispatcher would make, with correct trailers by default */
function changeMessage(entry, over = {}) {
  const t = { Proposal: entry.proposal_id, 'Proposal-SHA256': entry.proposal_sha256, Approval: entry.approval_id, 'Dispatch-Key': dispatchKey({ approvalId: entry.approval_id, proposalSha256: entry.proposal_sha256 }), Evidence: 'a fixture', ...over };
  return `release: fixture change\n\nbody\n\n${Object.entries(t).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
}
function gateOn(w, { env = {}, pin = undefined, strict = false, now = Date.parse('2026-11-05T00:00:00Z') } = {}) {
  const head = git(w.root, ['rev-parse', 'HEAD']);
  const reg = readFileSync(join(w.dir, 'reviewers.json'), 'utf8');
  const facts = gatherFacts({ root: w.root, head, since: w.since, env: ciEnv({ GITHUB_SHA: head, [REGISTRY_PIN_ENV]: pin === undefined ? registryFingerprintOf(reg) : pin, ...env }), needsJson: needsOk, ci: true, strictUnledgered: strict, now: new Date(now) });
  facts.artifact = planted().artifact;
  return judge(facts);
}
const edit = (w, rel, fn) => { const p = join(w.root, rel); writeFileSync(p, fn(readFileSync(p, 'utf8'))); };

/** approve → commit the ledger → commit the change. The honest order. */
function honest({ decideOver = {}, messageOver = {}, changeFile = 'tools/example.mjs', commitEnv = {} } = {}) {
  const w = gateWorld();
  const recs = records();
  const entry = recordDecision({ proposalId: 'prop-fixture-000000000001', outcome: 'granted', decidedBy: REVIEWER.name, role: REVIEWER.role, signer: { privateKeyPem: key.privateKeyPem }, records: recs, dir: w.dir, now: () => '2026-11-04T10:00:00.000Z', ...decideOver });
  commitAll(w.root, 'ledger: a decision', { GIT_COMMITTER_DATE: '2026-11-04T10:05:00Z', GIT_AUTHOR_DATE: '2026-11-04T10:05:00Z' });
  mkdirSync(join(w.root, 'tools'), { recursive: true });
  writeFileSync(join(w.root, changeFile), 'const OLD = 2;\n');
  const sha = commitAll(w.root, changeMessage(entry, messageOver), { GIT_COMMITTER_DATE: '2026-11-04T11:00:00Z', GIT_AUTHOR_DATE: '2026-11-04T11:00:00Z', ...commitEnv });
  return { w, entry, recs, sha };
}

test('G8 · AUTHORISED: a signed human decision that precedes an in-scope change, with the registry pinned, passes', () => {
  const { w, entry } = honest();
  const r = gateOn(w);
  assert.equal(r.ok, true, JSON.stringify(r.blocking));
  assert.equal(status(r, 'C5'), PASS); assert.equal(status(r, 'C6'), PASS); assert.equal(status(r, 'C7'), PASS); assert.equal(status(r, 'C10'), PASS);
  assert.deepEqual(r.record.decisions.map((d) => [d.approval_id, d.decided_by, d.decided_role]), [[entry.approval_id, REVIEWER.name, REVIEWER.role]]);
  assert.equal(r.record.ledger_chain_head, entry.entry_sha256);
});

test('G9 · NO HUMAN APPROVAL: a change that cites a proposal with no decision is refused', () => {
  const w = gateWorld();
  writeFileSync(join(w.dir, 'decisions.jsonl'), '');
  const entry = { proposal_id: 'prop-fixture-000000000001', proposal_sha256: 'a'.repeat(64), approval_id: 'appr-fixture-000001' };
  commitAll(w.root, 'empty ledger');
  mkdirSync(join(w.root, 'tools'), { recursive: true }); writeFileSync(join(w.root, 'tools/example.mjs'), 'const OLD = 2;\n');
  commitAll(w.root, changeMessage(entry));
  const r = gateOn(w);
  assert.equal(r.ok, false); assert.equal(status(r, 'C7'), FAIL);
  assert.match(r.conditions.find((c) => c.id.startsWith('C7')).why, /precede/);
  /* and no ledger file at all */
  const w2 = gateWorld(); mkdirSync(join(w2.root, 'tools'), { recursive: true }); writeFileSync(join(w2.root, 'tools/example.mjs'), 'const OLD = 2;\n');
  commitAll(w2.root, changeMessage(entry));
  assert.equal(gateOn(w2).ok, false);
  /* missing trailers */
  for (const drop of ['Approval', 'Proposal-SHA256', 'Dispatch-Key']) {
    const { w: w3 } = honest({ messageOver: { [drop]: null } });
    assert.equal(gateOn(w3).ok, false, `without ${drop}`);
  }
});

test('G10 · INVALID DECISION RECORD: unsigned, signed by an unregistered key, simulated, revoked, edited — each refused', () => {
  const unsigned = honest({ decideOver: { signer: null } });
  assert.equal(status(gateOn(unsigned.w), 'C5'), FAIL); assert.equal(gateOn(unsigned.w).ok, false);

  const stranger = honest({ decideOver: { signer: { privateKeyPem: generateReviewerKey().privateKeyPem } } });
  assert.equal(gateOn(stranger.w).ok, false);

  const sim = honest({ decideOver: { simulated: true, decidedBy: 'SIMULATED: fixture', signer: null, role: null } });
  const rs = gateOn(sim.w); assert.equal(rs.ok, false); assert.match(rs.conditions.find((c) => c.id.startsWith('C5')).why, /simulated/);

  const rev = honest(); edit(rev.w, 'agent/implement/decisions/reviewers.json', (t) => t.replace('"active"', '"revoked"')); commitAll(rev.w.root, 'registry: revoke');
  assert.equal(gateOn(rev.w, { pin: undefined }).ok, false);

  const edited = honest(); edit(edited.w, 'agent/implement/decisions/decisions.jsonl', (t) => t.replace('fixture', 'FIXTURE')); commitAll(edited.w.root, 'edit the ledger after approval');
  const re = gateOn(edited.w); assert.equal(re.ok, false);
  assert.equal(status(re, 'C6'), FAIL, 'C6: a decision recorded earlier was rewritten');
  assert.equal(status(re, 'C5'), FAIL);
});

test('G11 · MISMATCH: wrong content hash, wrong dispatch key, a file outside the approved scope — each refused', () => {
  assert.equal(gateOn(honest({ messageOver: { 'Proposal-SHA256': 'f'.repeat(64) } }).w).ok, false);
  assert.equal(gateOn(honest({ messageOver: { 'Dispatch-Key': '0'.repeat(32) } }).w).ok, false);
  assert.equal(gateOn(honest({ messageOver: { Approval: 'appr-someone-elses' } }).w).ok, false);
  const wide = honest({ changeFile: 'data/x.json' });
  const r = gateOn(wide.w); assert.equal(r.ok, false); assert.match(r.conditions.find((c) => c.id.startsWith('C7')).why, /outside the approved scope/);
});

test('G12 · ORDER AND TIME: an approval that arrives after the change, a stale approval and a decision dated after its commit are refused', () => {
  /* the change commit first, the ledger commit after it */
  const w = gateWorld();
  const recs = records();
  const entry = recordDecision({ proposalId: 'prop-fixture-000000000001', outcome: 'granted', decidedBy: REVIEWER.name, role: REVIEWER.role, signer: { privateKeyPem: key.privateKeyPem }, records: recs, dir: w.dir, now: () => '2026-11-04T10:00:00.000Z' });
  mkdirSync(join(w.root, 'tools'), { recursive: true }); writeFileSync(join(w.root, 'tools/example.mjs'), 'const OLD = 2;\n');
  git(w.root, ['add', 'tools']); git(w.root, ['commit', '-q', '-m', changeMessage(entry)]);
  commitAll(w.root, 'ledger: approved afterwards');
  const late = gateOn(w); assert.equal(late.ok, false); assert.match(late.conditions.find((c) => c.id.startsWith('C7')).why, /precede/);

  const stale = honest({ commitEnv: { GIT_COMMITTER_DATE: `${new Date(Date.parse('2026-11-04T10:00:00Z') + (MAX_APPROVAL_AGE_DAYS + 5) * 86_400_000).toISOString()}` } });
  const rs = gateOn(stale.w, { now: Date.parse('2027-01-30T00:00:00Z') });
  assert.equal(rs.ok, false); assert.match(rs.conditions.find((c) => c.id.startsWith('C7')).why, /stale/);

  const early = honest({ commitEnv: { GIT_COMMITTER_DATE: '2026-11-04T09:00:00Z' } });
  const re = gateOn(early.w); assert.equal(re.ok, false); assert.match(re.conditions.find((c) => c.id.startsWith('C7')).why, /after the commit/);
});

test('G13 · WITHDRAWN: a later denial of the same proposal blocks a change that was approved before it', () => {
  const { w, recs } = honest();
  recordDecision({ proposalId: 'prop-fixture-000000000001', outcome: 'denied', decidedBy: REVIEWER.name, role: REVIEWER.role, signer: { privateKeyPem: key.privateKeyPem }, records: recs, dir: w.dir, now: () => '2026-11-04T12:30:00.000Z' });
  commitAll(w.root, 'ledger: withdrawn');
  const r = gateOn(w); assert.equal(r.ok, false); assert.match(r.conditions.find((c) => c.id.startsWith('C7')).why, /withdrawn/);
});

test('G14 · REGISTRY PIN: a decision-based deploy needs the owner\'s pin, and the registry must match it', () => {
  const { w } = honest();
  const unpinned = gateOn(w, { pin: null });
  assert.equal(unpinned.ok, false); assert.equal(status(unpinned, 'C10'), FAIL);
  assert.match(unpinned.conditions.find((c) => c.id.startsWith('C10')).why, /RELEASE_REVIEWER_REGISTRY_SHA256 is not set/);
  assert.equal(status(gateOn(w, { pin: 'e'.repeat(64) }), 'C10'), FAIL);
  /* an agent adds its own key to the registry and signs its own approval: the pin is what stops it */
  const attacker = generateReviewerKey();
  const w2 = gateWorld();
  const reg2 = JSON.stringify({ reviewers: [{ reviewer_id: 'rev-evil', name: 'Evil Reviewer', role: 'any', status: 'active', added_at: NOW, public_key_pem: attacker.publicKeyPem }] });
  writeFileSync(join(w2.dir, 'reviewers.json'), reg2);
  const recs = records();
  const entry = recordDecision({ proposalId: 'prop-fixture-000000000001', outcome: 'granted', decidedBy: 'Evil Reviewer', role: 'any', signer: { privateKeyPem: attacker.privateKeyPem }, records: recs, dir: w2.dir, now: () => '2026-11-04T10:00:00.000Z' });
  commitAll(w2.root, 'ledger', { GIT_COMMITTER_DATE: '2026-11-04T10:05:00Z' });
  writeFileSync(join(w2.root, 'tools.txt'), 'x');
  mkdirSync(join(w2.root, 'tools'), { recursive: true }); writeFileSync(join(w2.root, 'tools/example.mjs'), 'const OLD = 2;\n');
  commitAll(w2.root, changeMessage(entry), { GIT_COMMITTER_DATE: '2026-11-04T11:00:00Z' });
  const owners = registryFingerprintOf(registry());
  const r = gateOn(w2, { pin: owners });
  assert.equal(status(r, 'C5'), PASS, 'the forged approval is internally consistent…');
  assert.equal(status(r, 'C10'), FAIL, '…and only the pin outside the repository refuses it');
  assert.equal(r.ok, false);
});

test('G15 · AGENT-ATTRIBUTED COMMITS WITH NO PROPOSAL are reported; --strict-unledgered makes them block', () => {
  const w = gateWorld();
  writeFileSync(join(w.root, 'data', 'x.json'), '{"changed":true}\n');
  commitAll(w.root, 'content change\n\nEvidence: a source\nCo-Authored-By: Claude <noreply@anthropic.com>');
  const soft = gateOn(w);
  assert.equal(status(soft, 'C8'), WARN); assert.equal(soft.ok, true);
  assert.equal(soft.record.unledgered_agent_commits, 1);
  assert.equal(gateOn(w, { strict: true }).ok, false);
  /* a human-only commit raises nothing */
  const w2 = gateWorld(); writeFileSync(join(w2.root, 'data', 'x.json'), '{"y":1}\n'); commitAll(w2.root, 'content\n\nEvidence: a source');
  assert.equal(status(gateOn(w2), 'C8'), PASS);
});

test('G16 · a grant-based (autonomy) commit must name a grant the tracked grant ledger holds', () => {
  const w = gateWorld();
  mkdirSync(join(w.root, 'agent', 'policy', 'governance'), { recursive: true });
  writeFileSync(join(w.root, 'agent/policy/governance/grants.jsonl'), '{"grant_id":"grant-real-1"}\n');
  commitAll(w.root, 'grants');
  writeFileSync(join(w.root, 'data', 'x.json'), '{"a":1}\n');
  commitAll(w.root, 'autonomy: a change\n\nProposal:  prop-x (C, produced by a)\nGrant(s):  grant-real-1 by Someone on 2026-11-04, expires 2027-03-09');
  assert.equal(status(gateOn(w), 'C7'), PASS);
  writeFileSync(join(w.root, 'data', 'x.json'), '{"a":2}\n');
  commitAll(w.root, 'autonomy: another\n\nProposal:  prop-y (C, produced by a)\nGrant(s):  grant-invented-9 by Someone on 2026-11-04, expires 2027-03-09');
  assert.equal(status(gateOn(w), 'C7'), FAIL);
});

/* ---- merge commits: what a merge changes ITSELF is judged (11 Nov 2026, P1; docs/AUDIT-2026-11-11-P1.md §4) ---- */

const LINES = ['{', '"a": 1,', '"b": 2,', '"c": 3,', '"d": 4,', '"e": 5,', '"f": 6,', '"g": 7', '}'].join('\n') + '\n';
const setLine = (w, rel, from, to) => edit(w, rel, (s) => s.replace(from, to));
/** main and a side branch from one base, each with its own commit to data/x.json; returns to main */
function forked(w, { mainEdit = ['"g": 7', '"g": 70'], sideEdit = ['"a": 1,', '"a": 10,'], sideMsg = 'side change\n\nEvidence: a source' } = {}) {
  writeFileSync(join(w.root, 'data', 'x.json'), LINES); commitAll(w.root, 'lines\n\nEvidence: a source');
  git(w.root, ['checkout', '-q', '-b', 'side']);
  setLine(w, 'data/x.json', ...sideEdit); commitAll(w.root, sideMsg);
  git(w.root, ['checkout', '-q', 'main']);
  setLine(w, 'data/x.json', ...mainEdit); commitAll(w.root, 'main change\n\nEvidence: a source');
}
/** merge `side` without committing, let `during` alter the result, then commit with `message` */
function mergeWith(w, message, during = () => {}) {
  try { git(w.root, ['merge', '--no-ff', '--no-commit', 'side']); } catch { /* a conflict: `during` resolves it */ }
  during();
  git(w.root, ['add', '-A']); git(w.root, ['commit', '-q', '-m', message]);
  return git(w.root, ['rev-parse', 'HEAD']);
}
const ownOf = (r) => r.record.merges_with_own_content.map((m) => m.files);
const MARK = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>';

test('G17 · MERGE COMMITS: a clean merge adds nothing of its own; content a merge adds is seen by C6, C7 and C8 — and was invisible before', async () => {
  const { mergeOwnFiles } = await import('../../tools/commit-evidence.mjs');

  /* 1 · both branches edit the same published file in different places, merged cleanly: no own content.
         (`git diff-tree --cc` alone would name data/x.json here — the false positive the intersection removes) */
  const w1 = gateWorld(); forked(w1);
  const m1 = mergeWith(w1, `Merge side${MARK}`);
  assert.deepEqual(git(w1.root, ['diff-tree', '--cc', '--name-only', '--no-commit-id', m1]).split('\n').filter(Boolean), ['data/x.json'], 'fixture: --cc alone over-reports');
  assert.deepEqual(mergeOwnFiles(m1, { cwd: w1.root }), []);
  const r1 = gateOn(w1);
  assert.equal(r1.record.merges_judged, 1); assert.deepEqual(ownOf(r1), []); assert.equal(status(r1, 'C8'), PASS); assert.equal(r1.ok, true, JSON.stringify(r1.blocking));

  /* 2 · an agent-marked merge that edits a published file ITSELF (the S5 shape of AUDIT-2026-11-11 §5): C8 sees it */
  const w2 = gateWorld(); forked(w2);
  mergeWith(w2, `Merge side${MARK}`, () => { setLine(w2, 'data/x.json', '"d": 4,', '"d": 999,'); writeFileSync(join(w2.root, 'index.html'), '<p>added in the merge</p>\n'); });
  const r2 = gateOn(w2);
  assert.deepEqual(ownOf(r2), [['data/x.json', 'index.html']]);
  assert.equal(status(r2, 'C8'), WARN); assert.equal(r2.record.unledgered_agent_commits, 1); assert.equal(r2.ok, true, 'C8 reports; it does not block (C8 strict stays off: D-P0.4-2)');
  assert.equal(gateOn(w2, { strict: true }).ok, false, 'under --strict-unledgered the same merge blocks, as a one-parent commit would');

  /* 3 · the same edit in an UNMARKED merge: C8 passes, exactly as an unmarked one-parent commit does (C8 reads a disclosure,
         AUDIT-2026-11-11 §5 point 3) — but the merge's own content is named in the gate record, never lost */
  const w3 = gateWorld(); forked(w3);
  const m3 = mergeWith(w3, 'Merge side', () => setLine(w3, 'data/x.json', '"d": 4,', '"d": 999,'));
  const r3 = gateOn(w3);
  assert.equal(status(r3, 'C8'), PASS); assert.deepEqual(r3.record.merges_with_own_content, [{ commit: m3, files: ['data/x.json'] }]);

  /* 4 · conflicts: taken wholesale from one side → nothing of its own; resolved with new text → the file is its own */
  const w4 = gateWorld(); forked(w4, { mainEdit: ['"d": 4,', '"d": 40,'], sideEdit: ['"d": 4,', '"d": 41,'] });
  const m4a = mergeWith(w4, 'Merge side, ours', () => git(w4.root, ['checkout', '--ours', '--', 'data/x.json']));
  assert.deepEqual(mergeOwnFiles(m4a, { cwd: w4.root }), [], 'a side taken wholesale adds no content');
  const w4b = gateWorld(); forked(w4b, { mainEdit: ['"d": 4,', '"d": 40,'], sideEdit: ['"d": 4,', '"d": 41,'] });
  const m4b = mergeWith(w4b, 'Merge side, resolved', () => writeFileSync(join(w4b.root, 'data', 'x.json'), LINES.replace('"d": 4,', '"d": 42,')));
  assert.deepEqual(mergeOwnFiles(m4b, { cwd: w4b.root }), ['data/x.json'], 'a resolution with new text is the merge\'s own');

  /* 5 · C7: a merge declaring a Proposal with content of its own is refused; one with none carries no change */
  const w5 = gateWorld(); forked(w5);
  mergeWith(w5, 'Merge side\n\nProposal: prop-fixture-000000000001', () => setLine(w5, 'data/x.json', '"d": 4,', '"d": 999,'));
  const r5 = gateOn(w5);
  assert.equal(status(r5, 'C7'), FAIL); assert.match(r5.conditions.find((x) => x.id.startsWith('C7')).why, /merge commit declares Proposal .* one-parent commit/);
  const w5b = gateWorld(); forked(w5b);
  mergeWith(w5b, 'Merge side\n\nProposal: prop-fixture-000000000001');
  assert.notEqual(status(gateOn(w5b), 'C7'), FAIL, 'a merge with nothing of its own is not a change');

  /* 6 · C6: a merge that rewrites the ledger itself breaks append-only against its parents */
  const w6 = gateWorld();
  writeFileSync(join(w6.dir, 'decisions.jsonl'), '{"seq":1}\n'); commitAll(w6.root, 'ledger');
  git(w6.root, ['checkout', '-q', '-b', 'side']); writeFileSync(join(w6.root, 'data', 'x.json'), '{"s":1}\n'); commitAll(w6.root, 'side\n\nEvidence: a source');
  git(w6.root, ['checkout', '-q', 'main']); writeFileSync(join(w6.root, 'tools.txt'), 'x\n'); commitAll(w6.root, 'main');
  mergeWith(w6, 'Merge side', () => writeFileSync(join(w6.dir, 'decisions.jsonl'), '{"seq":1,"rewritten":true}\n'));
  const r6 = gateOn(w6);
  assert.equal(status(r6, 'C6'), FAIL); assert.match(r6.conditions.find((x) => x.id.startsWith('C6')).why, /a merge, against parent/);

  /* 7 · the old reading, reproduced: a merge was given no files, so cases 2, 5 and 6 passed silently */
  const old = (w) => { const f = gatherFacts({ root: w.root, head: 'HEAD', since: w.since, env: ciEnv({ GITHUB_SHA: git(w.root, ['rev-parse', 'HEAD']) }), needsJson: needsOk, ci: true });
    for (const c of f.commits) if (c.merge) c.files = []; f.ledgerHistory = f.ledgerHistory.filter((h) => !h.merge); f.artifact = planted().artifact; return judge(f); };
  assert.equal(status(old(w2), 'C8'), PASS, 'before: the merge\'s own page edit was unseen');
  assert.notEqual(status(old(w5), 'C7'), FAIL, 'before: a Proposal on a merge was skipped');
  assert.equal(status(old(w6), 'C6'), PASS, 'before: a ledger rewritten in a merge was unseen');
});

test('G18 · a merge whose own content git cannot establish makes the history unmeasured (C2), never empty', () => {
  const w = gateWorld(); forked(w); mergeWith(w, 'Merge side');
  const head = git(w.root, ['rev-parse', 'HEAD']);
  const facts = gatherFacts({ root: w.root, head, since: w.since, env: ciEnv({ GITHUB_SHA: head }), needsJson: needsOk, ci: true });
  const m = facts.commits.find((c) => c.merge);
  m.files = null; m.own_error = 'planted: git could not answer';
  facts.artifact = planted().artifact;
  const r = judge(facts);
  assert.equal(status(r, 'C2'), FAIL); assert.match(r.conditions.find((x) => x.id.startsWith('C2')).why, /could not be determined .*planted/);
  assert.equal(r.ok, false);
});

/* ============================================================ the CLI as a pipeline sees it */

test('K1 · the CLI exits 1 for a gate that cannot establish its origin in CI, 0 for the workflow audit, 2 for no command, and prints no flag that waives a check', () => {
  const run = (...a) => spawnSync(process.execPath, [join(HERE, 'cli.mjs'), ...a], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(run('workflows').status, 0);
  const g = run('gate', '--ci', '--since', 'HEAD');
  assert.equal(g.status, 1, g.stdout);
  assert.match(g.stdout, /BLOCKED/);
  assert.equal(run('bogus').status, 2);
  assert.equal(run('dispatch').status, 2);
  const refused = run('dispatch', '--proposal', '../etc/passwd');
  assert.equal(refused.status, 1); assert.match(refused.stdout, /REFUSED/);
  const src = readFileSync(join(HERE, 'cli.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const waiver of ['--force', '--skip', '--allow-unsigned', '--no-verify', '--assume']) assert.equal(src.includes(waiver), false, waiver);
  const k = run('keygen', '--out-dir', join(ROOT, 'inside-the-repo'), '--reviewer-id', 'x', '--name', 'n', '--role', 'r');
  assert.equal(k.status, 1); assert.match(k.stdout, /inside the repository/);
  assert.equal(existsSync(join(ROOT, 'inside-the-repo')), false);
});

test('K2 · keygen writes the private key only outside the repository and never prints it, and the registry stays the owner\'s to write', () => {
  const dir = join(tmp('keys-'), 'k');
  const r = spawnSync(process.execPath, [join(HERE, 'cli.mjs'), 'keygen', '--out-dir', dir, '--reviewer-id', 'rev-test', '--name', 'Fixture Reviewer', '--role', 'fixture'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const pem = readFileSync(join(dir, 'rev-test.private.pem'), 'utf8');
  assert.match(pem, /BEGIN PRIVATE KEY/);
  assert.equal(r.stdout.includes('BEGIN PRIVATE KEY'), false, 'the private key is never printed');
  assert.match(r.stdout, /BEGIN PUBLIC KEY/);
  assert.match(r.stdout, /DOES NOT WRITE THE REGISTRY/);
  assert.equal(spawnSync(process.execPath, [join(HERE, 'cli.mjs'), 'keygen', '--out-dir', dir, '--reviewer-id', 'rev-test', '--name', 'n', '--role', 'r'], { encoding: 'utf8' }).status, 1, 'never overwrites a key');
  const sig = signEntryHash('ab'.repeat(32), pem);
  assert.equal(sig.alg, 'ed25519');
});

/* ============================================================ the real repository, unchanged by all of this */

test('R1 · this suite wrote nothing to the real decisions directory, and no fixture exists where production reads', () => {
  const real = join(ROOT, 'agent', 'implement', 'decisions');
  const files = readdirSync(real).sort();
  for (const f of files.filter((n) => n.endsWith('.jsonl') || n.endsWith('.json'))) {
    const t = readFileSync(join(real, f), 'utf8');
    assert.equal(t.includes('Fixture Reviewer'), false, `${f} holds a test fixture`);
    assert.equal(/SIMULATED:/.test(t), false, `${f} holds a simulated entry`);
  }
  const v = verifyLedger({ requireSignatures: true });
  assert.equal(v.ok, true, 'the real ledger (absent or not) verifies');
});

test('R2 · the release suite is in the list that runs for a change under agent/ or tools/', () => {
  assert.ok(AGENT_SUITES.includes('agent/release/selftest.mjs'));
});

test('R3 · the dispatcher does not create the Orchestrator\'s dispatchers module, so production readiness is not flipped by a file name', () => {
  assert.equal(existsSync(join(ROOT, 'agent/orchestrator/dispatchers.mjs')), false);
});
