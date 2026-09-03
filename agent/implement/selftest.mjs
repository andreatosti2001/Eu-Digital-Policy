/* ============================================================
   agent/implement/selftest.mjs — Agent 9's suite

     node --test agent/implement/selftest.mjs

   SESSION 18 names eight regression tests. They are the eight
   sections below, in its order, each labelled with the requirement
   it discharges. Everything else here supports one of them.

   THE SANDBOX. The tests that actually apply an edit do it in a
   throwaway git repository under the OS temp directory, never in
   this one. That is not squeamishness: `apply.mjs` refuses to open a
   change context on a dirty path, and a suite that wrote to the real
   tree would make its own second run fail. The sandbox is a real git
   repo with a real commit, so `openContext` and `rollback` are
   exercised against real git rather than a mock of it — a rollback
   verified against a fake `git` is a rollback nobody has tested.

   EVERY FIXTURE IS `simulated: true`, and the record store used here
   refuses to treat a simulated record as actionable. No proposal in
   this file asserts anything about EU law.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  deriveApproval, recordDecision, readLedger, readAgentRecords, proposalFingerprint,
  SelfApprovalRefused, UnknownProposal, IMPLEMENTABLE, APPROVAL_STATES,
} from './ledger.mjs';
import { preflight, GATES } from './preflight.mjs';
import {
  permittedFiles, enforceScope, NEVER_WRITABLE, LEGAL_RECORD_PATHS,
  requiresBrowserQA, touchesLegalRecord,
} from './scope.mjs';
import {
  boundaryCheck, scanSecrets, controlPlaneExposure, publicSurface,
  isWebsiteAsset, classifyHit, CONTROL_PLANE_DIRS,
} from './boundary.mjs';
import { readBaseline, compare, VALIDATORS } from './baseline.mjs';
import { verdictFor, blockingFindings, parseValidator, runBrowserCheck, AGENT_SUITES } from './checks.mjs';
import { openContext, applyOperation, applyProposal, rollback, ApplyRefused, countOccurrences } from './apply.mjs';
import { validate } from '../schemas/validate.mjs';
import { REQUIRED_VALIDATORS } from '../schemas/types.mjs';

/* ---------------------------------------------------------- fixtures */

const NOW = '2026-09-03T12:00:00Z';

/** A minimal, VALID ImplementationProposal. Built rather than
 *  imported so a test can bend one field at a time and see which
 *  gate objects. */
function implementationProposal(over = {}) {
  const base = {
    contract: 'ImplementationProposal',
    contract_version: 1,
    agent: 'test-producer',
    created_at: NOW,
    affected_entities: [{ kind: 'tool', id: null, path: 'tools/example.mjs', field: null, note: null }],
    evidence: [{
      evidence_id: 'ev-1', kind: 'repository_file', source_id: null, url: null,
      locator: 'tools/example.mjs:1', title: null, publisher: null,
      quote: 'const OLD = 1;', retrieved_at: NOW, checksum: null, supports: 'supports:direct',
      /* Matches the record: the contract refuses simulated evidence
         on a record that is not itself marked simulated, so a
         fixture can never read as research. */
      role: 'unresolved', simulated: false,
    }],
    epistemic: {
      fact: [{ field: 'files', statement: 'tools/example.mjs contains "const OLD = 1;"', evidence_refs: ['ev-1'] }],
      inference: [], interpretation: [], unresolved: [],
    },
    trace_ref: null,
    /* NOT simulated, and the reason is a property worth stating.
       `preflight` validates with { allowSimulated: false }, because a
       simulated record is never actionable — the test below asserts
       that directly. So a fixture used to exercise the gates has to
       be a real record. It is safe to make one here because it
       asserts NOTHING about EU law: its subject is a file called
       tools/example.mjs that exists only inside a temp directory. */
    simulated: false,
    proposal_id: 'prop-test-000000000001',
    reason: 'a fixture, so the gates can be exercised against a proposal that is otherwise complete',
    confidence: 0.9,
    risk: 'low',
    autonomy_class: 'review_required',
    proposed_change: {
      summary: 'change OLD from 1 to 2 in tools/example.mjs',
      operations: [{ op: 'modify', target: 'tools/example.mjs', current: 'const OLD = 1;', proposed: 'const OLD = 2;', rationale: 'the fixture edit' }],
      scope_note: 'nothing else',
    },
    validation_requirements: REQUIRED_VALIDATORS.map((v) => ({
      check: v, command: `node ${v}`, expected: 'the recorded baseline in docs/CURRENT-ARCHITECTURE.md §12', why: 'AGENTS.md requires all four',
    })),
    rollback_plan: {
      method: 'restore_from_commit', steps: ['git checkout HEAD -- tools/example.mjs'],
      verification: 'the file hashes back to its pre-change sha256', irreversible_reason: null,
    },
    files: ['tools/example.mjs'], modules: [], new_dependencies: [],
    adds_build_step: false, adds_fetch_call: false, fetch_modules: [],
    tests_added: [],
    validator_impact: { baseline_ref: 'docs/CURRENT-ARCHITECTURE.md §12', expected_new_errors: 0, expected_new_warnings: 0, justification: null },
  };
  return { ...base, ...over };
}

function approvalRequest(proposalId, over = {}) {
  return {
    contract: 'ApprovalRequest', contract_version: 1,
    agent: 'test-producer', created_at: NOW,
    affected_entities: [], evidence: [],
    epistemic: { fact: [], inference: [], interpretation: [], unresolved: [] },
    trace_ref: null, simulated: true,
    approval_id: `appr-test-${proposalId.slice(-6)}`,
    proposal_ids: [proposalId],
    tier: 'amber',
    requested_of: 'the repository author',
    why_human_required: 'a fixture',
    what_to_check: ['that this is a fixture'],
    risk_if_wrong: 'low',
    consequence_if_wrong: 'nothing; it is a fixture',
    expires_at: null,
    state: 'requested',
    decision: null,
    ...over,
  };
}

/** A record set and a ledger, both in memory. `deriveApproval` and
 *  `preflight` both take them, which is what lets every gate be
 *  tested without writing a file. */
function world({ proposals = [], approvals = [], decisions = [] } = {}) {
  const byId = new Map();
  for (const p of proposals) byId.set(p.proposal_id, p);
  for (const a of approvals) byId.set(a.approval_id, a);
  return {
    records: { byId, approvalRequests: approvals, traces: ['test'] },
    ledger: { decisions, malformed: [], path: '(memory)' },
  };
}

function grantFor(proposal, by = 'a named person') {
  return {
    ledger_version: 1,
    approval_id: `appr-test-${proposal.proposal_id.slice(-6)}`,
    proposal_id: proposal.proposal_id,
    proposal_contract: proposal.contract,
    proposal_agent: proposal.agent,
    proposal_sha256: proposalFingerprint(proposal),
    outcome: 'granted',
    decided_at: NOW,
    decided_by: by,
    note: null,
    what_was_asked: ['that this is a fixture'],
    risk_if_wrong: 'low',
  };
}

/** A throwaway git repository with one committed file. */
function sandbox(files = { 'tools/example.mjs': 'const OLD = 1;\n' }) {
  const dir = mkdtempSync(join(tmpdir(), 'implement-qa-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-q', '-b', 'feature');
  git('config', 'user.email', 'suite@example.invalid');
  git('config', 'user.name', 'suite');
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(join(dir, p.split('/').slice(0, -1).join('/') || '.'), { recursive: true });
    writeFileSync(join(dir, p), body, 'utf8');
  }
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  return { dir, git, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/* ============================================================
   REQUIREMENT 1 · unapproved proposals cannot be implemented
   ============================================================ */

test('R1 · a proposal with no decision is "pending", and pending is never implementable', () => {
  const p = implementationProposal();
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)] });
  const a = deriveApproval(p.proposal_id, w);
  assert.equal(a.state, 'pending');
  assert.ok(!IMPLEMENTABLE.includes('pending'));
  const pre = preflight(p.proposal_id, w);
  assert.equal(pre.ok, false);
  assert.ok(pre.failed.some((g) => g.gate === 'approved'));
});

test('R1 · a proposal nobody ever asked about is "no_request"', () => {
  const p = implementationProposal();
  const a = deriveApproval(p.proposal_id, world({ proposals: [p] }));
  assert.equal(a.state, 'no_request');
  assert.ok(!IMPLEMENTABLE.includes(a.state));
});

test('R1 · a denied proposal is not implementable, and says who denied it', () => {
  const p = implementationProposal();
  const w = world({
    proposals: [p], approvals: [approvalRequest(p.proposal_id)],
    decisions: [{ ...grantFor(p), outcome: 'denied', note: 'not this quarter' }],
  });
  const a = deriveApproval(p.proposal_id, w);
  assert.equal(a.state, 'denied');
  assert.match(a.why, /a named person/);
  assert.match(a.why, /not this quarter/);
});

test('R1 · only "granted" is implementable, of all seven states', () => {
  assert.deepEqual(IMPLEMENTABLE, ['granted']);
  for (const s of APPROVAL_STATES) {
    if (s !== 'granted') assert.ok(!IMPLEMENTABLE.includes(s), `"${s}" must not be implementable`);
  }
});

test('R1 · the live repository refuses every proposal in it today', () => {
  /* Not a fixture. The real record store, whatever is in it. If this
     ever passes something, a human granted it and committed the
     ledger — which is the only way it should ever change. */
  const records = readAgentRecords();
  const ledger = readLedger();
  for (const [id, rec] of records.byId) {
    if (!rec.proposal_id) continue;
    const a = deriveApproval(id, { records, ledger });
    if (a.state === 'granted') {
      assert.ok(a.decision && a.decision.decided_by,
        `${id} is granted and the grant must name who decided it`);
      assert.notEqual(a.decision.decided_by, rec.agent, `${id} is self-approved`);
    }
  }
});

/* ============================================================
   REQUIREMENT 2 · approval state cannot be forged through frontend
   state — or through anything else an agent can write
   ============================================================ */

test('R2 · an ApprovalRequest in agent/records/ claiming "granted" is DISCARDED', () => {
  const p = implementationProposal();
  const forged = approvalRequest(p.proposal_id, {
    state: 'granted',
    decision: { decided_at: NOW, decided_by: 'the repository author', outcome: 'granted', note: 'looks fine' },
  });
  const w = world({ proposals: [p], approvals: [forged] });
  const a = deriveApproval(p.proposal_id, w);

  assert.equal(a.state, 'pending', 'a grant written into the agent record store is not a grant');
  assert.equal(a.discarded.length, 1, 'and the discard is REPORTED, not silent');
  assert.equal(a.discarded[0].claimed_state, 'granted');
  assert.equal(a.discarded[0].claimed_by, 'the repository author');
  assert.match(a.discarded[0].why, /agents write/);
});

test('R2 · a decision naming the proposing agent is void at READ time, not only at write time', () => {
  const p = implementationProposal({ agent: 'ux-auditor' });
  const w = world({
    proposals: [p], approvals: [approvalRequest(p.proposal_id)],
    decisions: [grantFor(p, 'ux-auditor')],
  });
  const a = deriveApproval(p.proposal_id, w);
  assert.equal(a.state, 'void_self_approved');
  assert.ok(!IMPLEMENTABLE.includes(a.state));
});

test('R2 · recordDecision refuses a decision signed by any agent in the system', () => {
  const p = implementationProposal({ agent: 'test-producer' });
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)] });
  assert.throws(
    () => recordDecision({ proposalId: p.proposal_id, outcome: 'granted', decidedBy: 'test-producer', records: w.records }),
    SelfApprovalRefused,
  );
  /* Not only the PROPOSING agent — any agent. A grant signed by a
     different agent defeats the rule just as thoroughly. */
  const other = implementationProposal({ proposal_id: 'prop-test-000000000002', agent: 'ux-auditor' });
  const w2 = world({ proposals: [p, other], approvals: [approvalRequest(p.proposal_id)] });
  assert.throws(
    () => recordDecision({ proposalId: p.proposal_id, outcome: 'granted', decidedBy: 'ux-auditor', records: w2.records }),
    SelfApprovalRefused,
  );
});

test('R2 · a decision for a proposal that does not exist is refused, and void if forced in', () => {
  const w = world({ proposals: [], approvals: [] });
  assert.throws(
    () => recordDecision({ proposalId: 'prop-nothing', outcome: 'granted', decidedBy: 'a person', records: w.records }),
    UnknownProposal,
  );
  const forced = deriveApproval('prop-nothing', {
    records: w.records,
    ledger: { decisions: [{ ledger_version: 1, approval_id: 'a', proposal_id: 'prop-nothing', outcome: 'granted', decided_at: NOW, decided_by: 'a person' }], malformed: [], path: '(memory)' },
  });
  assert.equal(forced.state, 'void_unknown_proposal');
});

test('R2 · editing the proposal after the grant VOIDS it — approval does not follow a widened scope', () => {
  const p = implementationProposal();
  const grant = grantFor(p);
  const widened = implementationProposal({
    proposed_change: {
      ...p.proposed_change,
      operations: [
        ...p.proposed_change.operations,
        { op: 'modify', target: 'data/claims.json', current: 'x', proposed: 'y', rationale: 'the widening' },
      ],
    },
  });
  const w = world({ proposals: [widened], approvals: [approvalRequest(p.proposal_id)], decisions: [grant] });
  const a = deriveApproval(p.proposal_id, w);
  assert.equal(a.state, 'void_scope_changed');
  assert.match(a.why, /exact scope/);
});

test('R2 · regenerating the SAME proposal in a new run does not void the grant', () => {
  /* The fingerprint deliberately excludes trace_ref and created_at:
     ids here are content-derived, so re-running the producing agent
     over an unchanged corpus mints the same proposal with a fresh
     trace. An approval that went void for that would be an approval
     nobody could ever keep. */
  const p = implementationProposal();
  const rerun = implementationProposal({ created_at: '2026-10-01T00:00:00Z', trace_ref: { trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16), run_id: 'c'.repeat(16) } });
  assert.equal(proposalFingerprint(p), proposalFingerprint(rerun));
  const w = world({ proposals: [rerun], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  assert.equal(deriveApproval(p.proposal_id, w).state, 'granted');
});

/* ============================================================
   REQUIREMENT 3 · implementation cannot exceed approved scope
   ============================================================ */

test('R3 · the permitted set is derived from the proposal, and is not an argument', () => {
  const p = implementationProposal();
  const scope = permittedFiles(p);
  assert.deepEqual(scope.permitted, ['tools/example.mjs']);
  /* preflight takes an id and a context of stores. It has no
     permittedFiles parameter, no skip and no assumeApproved — checked
     by reading the source, because a permitted set the caller can
     pass in is a permitted set the caller can widen, and the caller
     is the thing being constrained. */
  const src = readFileSync(new URL('./preflight.mjs', import.meta.url), 'utf8');
  const sig = src.slice(src.indexOf('export function preflight'), src.indexOf(')', src.indexOf('export function preflight')) + 1);
  assert.equal(sig, 'export function preflight(proposalId, { records, ledger } = {})');
  for (const bad of ['permitted', 'skip', 'assume', 'force', 'override']) {
    assert.ok(!sig.includes(bad), `preflight must not accept "${bad}"`);
  }
});

test('R3 · an operation targeting a path outside the permitted set is refused at apply time', () => {
  const s = sandbox();
  try {
    const p = implementationProposal();
    const ctx = openContext({ permitted: ['tools/example.mjs'], root: s.dir });
    const sneaky = implementationProposal({
      proposed_change: {
        ...p.proposed_change,
        operations: [{ op: 'modify', target: 'data/claims.json', current: 'a', proposed: 'b', rationale: 'out of scope' }],
      },
    });
    assert.throws(() => applyProposal({ context: ctx, proposal: sneaky, dry: true }), ApplyRefused);
  } finally { s.cleanup(); }
});

test('R3 · enforceScope reports a write outside the approved set, from git rather than from trust', () => {
  const s = sandbox();
  try {
    writeFileSync(join(s.dir, 'tools/example.mjs'), 'const OLD = 2;\n');
    writeFileSync(join(s.dir, 'unrelated.txt'), 'written by something\n');
    const r = enforceScope({ permitted: ['tools/example.mjs'], before: [], cwd: s.dir });
    assert.equal(r.ok, false);
    assert.deepEqual(r.outside.map((o) => o.path), ['unrelated.txt']);
    assert.deepEqual(r.touched, ['tools/example.mjs']);
  } finally { s.cleanup(); }
});

test('R3 · a path that was already dirty is reported as inherited, not as scope creep', () => {
  const s = sandbox();
  try {
    writeFileSync(join(s.dir, 'pre-existing.txt'), 'not the agent\n');
    const before = ['pre-existing.txt'];
    writeFileSync(join(s.dir, 'tools/example.mjs'), 'const OLD = 2;\n');
    const r = enforceScope({ permitted: ['tools/example.mjs'], before, cwd: s.dir });
    assert.equal(r.ok, true);
    assert.deepEqual(r.inherited_dirt, ['pre-existing.txt']);
  } finally { s.cleanup(); }
});

test('R3 · the two one-shot patch scripts can never be in scope, whatever a proposal says', () => {
  for (const script of ['tools/_refsweep.mjs', 'tools/_review10.mjs']) {
    const p = implementationProposal({
      affected_entities: [{ kind: 'tool', id: null, path: script, field: null, note: null }],
      files: [script],
      proposed_change: { summary: 'x', operations: [{ op: 'modify', target: script, current: 'a', proposed: 'b', rationale: 'r' }], scope_note: null },
    });
    const scope = permittedFiles(p);
    assert.equal(scope.refusals.length, 1, `${script} must be refused`);
    assert.match(scope.refusals[0].why, /Class D/);
  }
});

test('R3 · the approval ledger and the contracts are never writable by this agent', () => {
  const never = NEVER_WRITABLE.map(([p]) => p);
  assert.ok(never.includes('agent/implement/decisions/'), 'an agent that can write its own approvals is not governed by them');
  assert.ok(never.includes('agent/schemas/'), 'an agent that can edit the gate has bypassed it');
});

test('R3 · a change context refuses to open on main', () => {
  const s = sandbox();
  try {
    s.git('branch', '-m', 'main');
    assert.throws(() => openContext({ permitted: ['tools/example.mjs'], root: s.dir }), /main/);
  } finally { s.cleanup(); }
});

test('R3 · a change context refuses to open over an already-dirty permitted path', () => {
  const s = sandbox();
  try {
    writeFileSync(join(s.dir, 'tools/example.mjs'), 'someone else was here\n');
    assert.throws(() => openContext({ permitted: ['tools/example.mjs'], root: s.dir }), /rollback/);
  } finally { s.cleanup(); }
});

/* ============================================================
   REQUIREMENT 4 · public assets contain no privileged credentials
   ============================================================ */

test('R4 · no credential shape appears in any file the website itself loads', () => {
  const surface = publicSurface();
  const website = surface.published.filter(isWebsiteAsset);
  assert.ok(website.length > 40, `expected the seven pages plus js/, css/, data/, i18n/ and fonts/; found ${website.length}`);
  const hits = scanSecrets({ files: website });
  assert.deepEqual(hits.findings, [],
    `a credential in a file a reader's browser loads reaches the reader: ${JSON.stringify(hits.findings)}`);
});

test('R4 · the whole published tree carries no BLOCKING credential', () => {
  const s = scanSecrets();
  assert.deepEqual(s.blocking, [],
    `${s.blocking.length} credential(s) outside a declared test fixture: ${JSON.stringify(s.blocking)}`);
});

test('R4 · a credential planted in a website asset IS caught — the scanner is not vacuous', () => {
  const dir = mkdtempSync(join(tmpdir(), 'secret-'));
  try {
    mkdirSync(join(dir, 'js'), { recursive: true });
    writeFileSync(join(dir, 'js', 'leak.js'), 'const t = "ghp_0123456789abcdefghijklmnopqrstuvwxyz";\n');
    const s = scanSecrets({ root: dir, files: ['js/leak.js'] });
    assert.equal(s.findings.length, 1);
    assert.equal(s.findings[0].pattern, 'github-token');
    assert.equal(s.findings[0].class, 'website_asset');
    assert.equal(s.findings[0].severity, 'error');
    /* And the value never appears in the finding. A boundary check
       that printed what it found has published it into the log. */
    assert.ok(!JSON.stringify(s.findings).includes('0123456789abcdefghijklmnopqrstuvwxyz'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('R4 · "admin / admin" is a pattern, because protocol §11 forbids it existing at all', () => {
  const dir = mkdtempSync(join(tmpdir(), 'secret-'));
  try {
    writeFileSync(join(dir, 'x.html'), '<p>login admin/admin</p>');
    const s = scanSecrets({ root: dir, files: ['x.html'] });
    assert.ok(s.findings.some((f) => f.pattern === 'default-credentials'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('R4 · the synthetic credentials in the redaction fixtures are classified, not suppressed', () => {
  const s = scanSecrets();
  assert.ok(s.fixtures.length > 0, 'the suites that prove redaction works must contain something to redact');
  for (const f of s.fixtures) {
    assert.equal(f.severity, 'warning');
    assert.match(f.class, /test_fixture/);
  }
  /* They are still counted and still named in the check output —
     deleting them to make the scan clean would be weakening a test
     to make a check pass. */
  const c = boundaryCheck();
  assert.ok(c.new_findings.some((n) => n.includes('test_fixture')));
});

/* ============================================================
   REQUIREMENT 5 · Control Room functionality cannot become publicly
   accessible through accidental static publication
   ============================================================ */

test('R5 · the check REPORTS that this repository has no public/private separation', () => {
  const e = controlPlaneExposure();
  assert.ok(e.exposed.length > 0,
    'deployment is GitHub Pages serving main at the repository root, with no _config.yml, no .nojekyll and no exclude list. A boundary check on a repository with no boundary reports a full list; an empty one would mean the check stopped working.');
  assert.ok(e.exposed.some((x) => x.prefix === 'agent/'));
});

test('R5 · the surface separates what is READ from the tree from what is INFERRED about the live site', () => {
  const s = publicSurface();
  assert.ok(Array.isArray(s.established) && s.established.length >= 3);
  assert.match(s.inferred, /inferred/);
  assert.match(s.unresolved, /not established here/);
  /* Nothing in this repository has ever fetched the deployed site.
     A claim about what it serves would be a fabrication with a
     checkable-looking shape. */
  assert.match(s.unresolved, /network policy|403/);
});

test('R5 · a git-ignored control-plane directory is reported as ignored, NOT as excluded', () => {
  /* SESSION 20 sharpened this. publicSurface() now models what `main`
     carries — git ls-files — rather than what is on the developer's
     disk, because publication is GitHub Pages serving main and a
     git-ignored run artifact has never been in a commit. The two
     reasons a directory can be absent from the published set are
     therefore very different, and collapsing them would overstate the
     protection: a dotfile directory is excluded by the DEPLOYMENT,
     which is a real boundary; a git-ignored one is absent because
     nobody committed it, which one `git add -f` undoes. */
  const e = controlPlaneExposure();
  const ignored = e.ignored_not_excluded;
  assert.ok(ignored.length > 0, 'some control-plane directory must be outside the published set');

  for (const entry of ignored) {
    assert.ok(entry.reason && entry.reason.length > 40, `${entry.prefix} must say WHY it is not published`);
    assert.equal(typeof entry.present_on_disk, 'boolean');
  }

  for (const p of ['agent/records/', 'agent/observability/runs/']) {
    const entry = ignored.find((x) => x.prefix === p);
    if (!entry) continue;
    assert.match(entry.reason, /IGNORE RULE, not a publication boundary/,
      `${p} is absent only because git does not track it, and that must not read as a boundary`);
    assert.match(entry.reason, /git add -f/);
  }
});

test('R5 · the published surface is what git tracks, not what is on this machine', () => {
  const s = publicSurface();
  assert.equal(s.git_consulted, true, 'publication is GitHub Pages serving main, and main carries tracked files only');
  assert.ok(s.files_on_disk >= s.total, 'the working tree holds at least as many files as git tracks');
  assert.match(s.source_of_truth, /git ls-files/);
  /* Run artifacts hold control-plane data and exist locally the
     moment anything runs. Reporting them as published is a false
     alarm, and a security check that cries wolf is one people learn
     to ignore. */
  for (const prefix of ['agent/records/', 'agent/observability/runs/']) {
    assert.deepEqual(s.published.filter((f) => f.startsWith(prefix)), [],
      `${prefix} is git-ignored and has never been in a commit, so it is not published`);
  }
  /* agent/health/history/ carries a tracked README explaining why its
     CONTENTS are not tracked. The data is what must not be published;
     the document saying so must be. */
  assert.deepEqual(s.published.filter((f) => f.startsWith('agent/health/history/') && f.endsWith('.jsonl')), []);
});

test('R5 · a Control Room page dropped into the tree would be inside the public surface', () => {
  /* SESSION 21 builds the Control Room. This asserts, now, what
     would happen if it were added as a static page — which is the
     failure protocol §10 names by name. */
  const s = publicSurface();
  const wouldPublish = (p) => !s.excluded.includes(p);
  assert.ok(wouldPublish('control-room.html'),
    'nothing in this repository would stop a control-room page at the root from being published');
  assert.ok(wouldPublish('agent/control-room/index.html'),
    'nor one under agent/. Hidden routes and unlisted pages are not security mechanisms.');
});

/* ============================================================
   REQUIREMENT 6 · required validators cannot be bypassed
   ============================================================ */

test('R6 · the baseline is READ from docs/CURRENT-ARCHITECTURE.md §12, not retyped', () => {
  const b = readBaseline();
  assert.equal(b.commit.length > 0, true);
  for (const v of VALIDATORS) assert.ok(v.name in b.checks, `${v.name} must have a recorded baseline`);
  assert.equal(b.checks['design-qa.mjs'].warnings, 5, 'the five pre-existing design-qa warnings');
  assert.equal(b.unverified, 106);
  assert.ok(b.named_warnings.length >= 3, 'the warnings are named by file, because a count cannot tell a new one from a moved one');
});

test('R6 · readBaseline throws rather than guessing if §12 stops being parseable', () => {
  const dir = mkdtempSync(join(tmpdir(), 'baseline-'));
  try {
    mkdirSync(join(dir, 'docs'), { recursive: true });
    writeFileSync(join(dir, 'docs/CURRENT-ARCHITECTURE.md'), '# no baseline here\n');
    assert.throws(() => readBaseline({ root: dir }), /Refusing to guess/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('R6 · a proposal that does not name all four validators fails the gate', () => {
  const p = implementationProposal({
    affected_entities: [{ kind: 'page', id: null, path: 'index.html', field: null, note: null }],
    files: ['index.html'],
    proposed_change: { summary: 'x', operations: [{ op: 'modify', target: 'index.html', current: 'a', proposed: 'b', rationale: 'r' }], scope_note: null },
    validation_requirements: [{ check: 'validate', command: 'node tools/validate.mjs', expected: 'baseline', why: 'only one' }],
  });
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  const pre = preflight(p.proposal_id, w);
  const gate = pre.gates.find((g) => g.gate === 'required_tests_defined');
  assert.equal(gate.ok, false);
  assert.ok(gate.missing.includes('tools/design-qa.mjs'));
  assert.ok(gate.missing.includes('tools/i18n-audit.mjs'));
});

test('R6 · a warning above the recorded baseline is a fail, not noise', () => {
  const b = readBaseline();
  assert.equal(compare({ errors: 0, warnings: 6 }, b.checks['design-qa.mjs']).verdict, 'regression');
  assert.equal(compare({ errors: 0, warnings: 5 }, b.checks['design-qa.mjs']).verdict, 'at_baseline');
  /* And BELOW the baseline is not a clean pass either: a check that
     stopped firing looks exactly like a fix. */
  assert.equal(compare({ errors: 0, warnings: 4 }, b.checks['design-qa.mjs']).verdict, 'below_baseline');
});

test('R6 · verdictFor cannot return a pass over a check that errored, exited non-zero, or rose', () => {
  assert.equal(verdictFor([{ name: 'a', exit_code: 0, errors: 0, warnings: 0, baseline_errors: 0, baseline_warnings: 0, new_findings: [] }]), 'pass');
  assert.equal(verdictFor([{ name: 'a', exit_code: 0, errors: 1, warnings: 0, baseline_errors: 0, baseline_warnings: 0, new_findings: [] }]), 'fail');
  assert.equal(verdictFor([{ name: 'a', exit_code: 2, errors: 0, warnings: 0, baseline_errors: 0, baseline_warnings: 0, new_findings: [] }]), 'fail');
  assert.equal(verdictFor([{ name: 'a', exit_code: 0, errors: 0, warnings: 6, baseline_errors: 0, baseline_warnings: 5, new_findings: ['x'] }]), 'pass_with_findings');
  assert.equal(blockingFindings([{ name: 'a', exit_code: 1, errors: 1, warnings: 0, baseline_errors: 0, baseline_warnings: 0, new_findings: ['it broke'] }]).length, 1);
});

test('R6 · a validator that could not be executed is exit 127, never a pass', () => {
  const parsed = parseValidator('validate.mjs', { stdout: '', stderr: 'node is not on this machine', exit_code: 127 });
  assert.ok(parsed.errors > 0, 'no output plus a non-zero exit is not zero errors');
});

test('R6 · this suite is in the list the agent runs for a change under agent/ or tools/', () => {
  for (const s of ['agent/implement/selftest.mjs', 'agent/browser/selftest.mjs', 'agent/health/selftest.mjs']) {
    assert.ok(AGENT_SUITES.includes(s), `${s} must be in AGENT_SUITES, or a change under agent/ would land without running it`);
  }
  /* The count is asserted, not just the membership. A suite silently
     dropped from this list is a suite that stops gating changes, and
     nothing else would notice — this assertion has already caught
     the list growing once, in SESSION 20. */
  assert.equal(AGENT_SUITES.length, 15,
    'twelve suites before SESSION 18, plus browser, implement (18/19) and health (20)');
});

/* ============================================================
   REQUIREMENT 7 · browser QA cannot be silently skipped when required
   ============================================================ */

test('R7 · a change to a page, module, stylesheet or locale requires browser QA', () => {
  for (const p of ['index.html', 'js/shell.js', 'css/tokens.css', 'style.css', 'app.js', 'i18n/it.json']) {
    assert.deepEqual(requiresBrowserQA([p]), [p], `${p} must require browser QA`);
  }
  /* And a change that touches none of them does not. Requiring a
     browser for a documentation edit would make the requirement
     something people route around. */
  assert.deepEqual(requiresBrowserQA(['docs/HANDOVER.md', 'tools/validate.mjs']), []);
});

test('R7 · runBrowserCheck says plainly when it was not required, and produces no check', async () => {
  const r = await runBrowserCheck({ required: false });
  assert.equal(r.required, false);
  assert.equal(r.check, null);
  assert.match(r.note, /not required/);
});

test('R7 · a required browser run that did not happen produces a non-zero check', async () => {
  /* Exercised through asQACheck on a skipped run rather than by
     uninstalling the browser: the property under test is that a
     `skipped` status never becomes exit 0, and that is decided in
     agent/browser/runner.mjs. */
  const { asQACheck } = await import('../browser/runner.mjs');
  const c = asQACheck({ status: 'skipped', skipReason: 'no browser', lookedIn: [], counts: { total: 0, pass: 0, fail: 0, undecidable: 0 }, failed: [], undecided: [] });
  assert.notEqual(c.exit_code, 0);
  assert.ok(c.new_findings.some((f) => /did not run/.test(f)));
  /* And verdictFor over that check is a fail, so a QAResult carrying
     it cannot claim a pass. */
  assert.equal(verdictFor([c]), 'fail');
});

/* ============================================================
   REQUIREMENT 8 · provenance cannot be removed during implementation
   ============================================================ */

test('R8 · a proposal whose evidence has been emptied fails the provenance gate', () => {
  const p = implementationProposal({ evidence: [], epistemic: { fact: [], inference: [], interpretation: [], unresolved: [] } });
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  const pre = preflight(p.proposal_id, w);
  const gate = pre.gates.find((g) => g.gate === 'provenance_complete');
  assert.equal(gate.ok, false);
  assert.match(gate.closes, /"absent" is a first-class kind/);
});

test('R8 · a blocking open question blocks, which is what blocks=true means', () => {
  const p = implementationProposal({
    epistemic: {
      fact: [{ field: 'files', statement: 'x', evidence_refs: ['ev-1'] }],
      inference: [], interpretation: [],
      unresolved: [{ field: null, question: 'has anyone opened this in a browser?', missing: 'a browser', absence_kind: 'null_not_researched', blocks: true }],
    },
  });
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  const pre = preflight(p.proposal_id, w);
  assert.equal(pre.gates.find((g) => g.gate === 'provenance_complete').ok, false);
});

test('R8 · the proposal is re-validated against its own contract at implementation time', () => {
  /* Not trusted from when it was written. A record can be edited in
     agent/records/ between the proposal and the run. */
  const p = implementationProposal();
  delete p.reason;
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  const pre = preflight(p.proposal_id, w);
  assert.equal(pre.gates.find((g) => g.gate === 'proposal_valid').ok, false);
  assert.match(pre.gates.find((g) => g.gate === 'proposal_valid').closes, /does not repair a proposal/);
});

test('R8 · the QAResult the agent produces carries the evidence and the method, and the gate checks it', () => {
  const record = {
    contract: 'QAResult', contract_version: 1, agent: 'implementation-qa', created_at: NOW,
    affected_entities: [], evidence: [{
      evidence_id: 'ev-check-1', kind: 'validator_output', source_id: null, url: null,
      locator: 'node tools/validate.mjs', title: 'tools/validate.mjs', publisher: null,
      quote: 'ERRORS   0', retrieved_at: NOW, checksum: null, supports: 'supports:direct', role: 'unresolved', simulated: true,
    }],
    epistemic: {
      fact: [{ field: 'checks[0]', statement: 'node tools/validate.mjs exited 0 with 0 error(s)', evidence_refs: ['ev-check-1'] }],
      inference: [{ field: 'verdict', statement: 'the verdict is "pass"', from: ['tools/validate.mjs'], method: 'verdictFor()' }],
      interpretation: [], unresolved: [],
    },
    trace_ref: null, simulated: true,
    qa_id: 'qa-test-1', target_kind: 'proposal', target_id: 'prop-test-000000000001',
    ran_at: NOW, ran_by: 'implementation-qa', environment: 'node',
    checks: [{ name: 'tools/validate.mjs', command: 'node tools/validate.mjs', exit_code: 0, errors: 0, warnings: 0, baseline_errors: 0, baseline_warnings: 0, new_findings: [], output_excerpt: 'ERRORS   0' }],
    verdict: 'pass', blocking_findings: [],
  };
  assert.deepEqual(validate(record, { allowSimulated: true }), []);

  /* Strip the inference that says HOW the verdict was reached, and
     the gate refuses the record. */
  const stripped = { ...record, epistemic: { ...record.epistemic, inference: [] } };
  assert.ok(validate(stripped, { allowSimulated: true }).length > 0);
});

/* ============================================================
   The rest: the gates, the edit, and the way back
   ============================================================ */

test('all ten gates run, and a fully-formed approved proposal passes every one', () => {
  const p = implementationProposal();
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  const pre = preflight(p.proposal_id, w);
  assert.equal(pre.ok, true, pre.failed.map((g) => `${g.gate}: ${g.why}`).join(' | '));
  for (const g of GATES) assert.ok(pre.gates.some((x) => x.gate === g), `gate "${g}" did not run`);
});

test('a simulated proposal is refused: a fixture is never actionable', () => {
  const p = implementationProposal({ simulated: true });
  const w = world({ proposals: [p], approvals: [approvalRequest(p.proposal_id)], decisions: [grantFor(p)] });
  const pre = preflight(p.proposal_id, w);
  const gate = pre.gates.find((g) => g.gate === 'proposal_valid');
  assert.equal(gate.ok, false);
  assert.match(gate.why, /simulated/);
});

test('every gate failure names what would close it', () => {
  const p = implementationProposal();
  const pre = preflight(p.proposal_id, world({ proposals: [p] }));
  for (const g of pre.failed) {
    assert.ok(g.closes && g.closes.length > 20, `${g.gate} failed with no route out`);
  }
});

test('an edit is applied only where the quoted text occurs exactly once', () => {
  assert.equal(applyOperation('const OLD = 1;', { op: 'modify', target: 't', current: 'OLD = 1', proposed: 'OLD = 2' }), 'const OLD = 2;');
  assert.throws(() => applyOperation('nothing like it', { op: 'modify', target: 't', current: 'OLD = 1', proposed: 'x' }), /no longer exists/);
  assert.throws(() => applyOperation('a\na\n', { op: 'modify', target: 't', current: 'a', proposed: 'b' }), /occurs 2 times/);
  assert.equal(countOccurrences('aaa', 'a'), 3);
});

test('an operation with a null "proposed" is a finding, and says so', () => {
  assert.throws(
    () => applyOperation('const OLD = 1;', { op: 'modify', target: 't', current: 'const OLD = 1;', proposed: null }),
    /FINDING, not an edit/,
  );
});

test('the whole cycle in a sandbox: open, apply, diff, roll back, and VERIFY the rollback', () => {
  const s = sandbox();
  try {
    const p = implementationProposal();
    const before = readFileSync(join(s.dir, 'tools/example.mjs'), 'utf8');
    const ctx = openContext({ permitted: ['tools/example.mjs'], root: s.dir });
    assert.equal(ctx.branch, 'feature');
    assert.equal(ctx.rollback.method, 'restore_from_commit');
    assert.ok(ctx.rollback.steps.length >= 2 && ctx.rollback.verification.length > 20,
      'rollback_available must not be a meaningless boolean — SESSION 18 §17');

    const change = applyProposal({ context: ctx, proposal: p, dry: false });
    assert.equal(change.files.length, 1);
    assert.equal(change.files[0].sha256_before !== change.files[0].sha256_after, true);
    assert.equal(readFileSync(join(s.dir, 'tools/example.mjs'), 'utf8'), 'const OLD = 2;\n');

    const back = rollback(ctx, { root: s.dir });
    assert.equal(back.verified, true, JSON.stringify(back.mismatches));
    assert.equal(readFileSync(join(s.dir, 'tools/example.mjs'), 'utf8'), before);
    assert.match(back.how_verified, /re-hashed/);
  } finally { s.cleanup(); }
});

test('rollback removes a file the change created, and verifies it is gone', () => {
  const s = sandbox();
  try {
    const p = implementationProposal({
      affected_entities: [{ kind: 'tool', id: null, path: 'tools/new.mjs', field: null, note: null }],
      files: ['tools/new.mjs'],
      proposed_change: { summary: 'add', operations: [{ op: 'add', target: 'tools/new.mjs', current: null, proposed: 'export const x = 1;\n', rationale: 'r' }], scope_note: null },
    });
    const ctx = openContext({ permitted: ['tools/new.mjs'], root: s.dir });
    applyProposal({ context: ctx, proposal: p, dry: false });
    assert.ok(existsSync(join(s.dir, 'tools/new.mjs')));
    const back = rollback(ctx, { root: s.dir });
    assert.equal(back.verified, true);
    assert.equal(existsSync(join(s.dir, 'tools/new.mjs')), false);
  } finally { s.cleanup(); }
});

test('a dry apply computes the same files and writes none of them', () => {
  const s = sandbox();
  try {
    const p = implementationProposal();
    const ctx = openContext({ permitted: ['tools/example.mjs'], root: s.dir });
    const dry = applyProposal({ context: ctx, proposal: p, dry: true });
    assert.equal(dry.files.length, 1);
    assert.equal(readFileSync(join(s.dir, 'tools/example.mjs'), 'utf8'), 'const OLD = 1;\n', 'a rehearsal must not write');
    assert.equal(enforceScope({ permitted: ['tools/example.mjs'], cwd: s.dir }).touched.length, 0);
  } finally { s.cleanup(); }
});

test('a change to the legal record is identified as one', () => {
  assert.deepEqual(touchesLegalRecord(['data/claims.json']), ['data/claims.json']);
  assert.deepEqual(touchesLegalRecord(['index.html']), ['index.html']);
  assert.deepEqual(touchesLegalRecord(['js/format.js']), ['js/format.js'], 'TIER_GRADE decides every evidence grade on the site');
  assert.deepEqual(touchesLegalRecord(['docs/HANDOVER.md']), []);
  for (const p of LEGAL_RECORD_PATHS) assert.ok(touchesLegalRecord([p]).length === 1, `${p} must be recognised`);
});

test('the ledger reports a line it cannot parse rather than forgetting it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
  try {
    writeFileSync(join(dir, 'decisions.jsonl'), '{"approval_id":"a","proposal_id":"p","outcome":"granted","decided_by":"x","decided_at":"2026-01-01T00:00:00Z"}\nnot json\n{"approval_id":"b"}\n');
    const l = readLedger({ dir });
    assert.equal(l.decisions.length, 1);
    assert.equal(l.malformed.length, 2, 'a ledger that quietly drops what it cannot parse is a ledger that can be made to forget');
    assert.equal(l.malformed[0].line, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('recordDecision has no override argument', () => {
  /* A function with a `force` or `skip` parameter is a function
     whose checks are advisory. Checked by reading the source, because
     the property is about what the signature does not contain. */
  const src = readFileSync(new URL('./ledger.mjs', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('export function recordDecision'), src.indexOf('export function surveyProposals'));
  for (const bad of ['force', 'skipChecks', 'skip_checks', 'assumeApproved', 'override']) {
    assert.ok(!fn.includes(bad), `recordDecision must not accept "${bad}"`);
  }
});

test('the four required validators are the four AGENTS.md names', () => {
  assert.deepEqual(REQUIRED_VALIDATORS, ['tools/validate.mjs', 'tools/i18n-audit.mjs', 'tools/design-qa.mjs', 'tools/freshness.mjs']);
  assert.deepEqual(VALIDATORS.map((v) => `tools/${v.name}`), REQUIRED_VALIDATORS);
});
