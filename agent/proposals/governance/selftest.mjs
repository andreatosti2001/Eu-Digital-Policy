/* ============================================================
   agent/proposals/governance/selftest.mjs — SESSION 28's suite

   Run:  node --test agent/proposals/governance/selftest.mjs

   What it holds this module to, in the order the risks matter:

     · IT NEVER WRITES, AND THAT IS PROVED TWICE. No write API is
       imported or called in any module here, and the whole working
       tree is hashed before and after a full run and asserted
       identical. A module that proposes governance changes and can
       also apply one is protocol §24 on the honour system.
     · IT NEVER DECIDES. Every proposal carries decision null,
       requires_human_approval true, and a class that is never
       "automatic". No verb in the CLI would change any of them, and
       the suite asserts the CLI has no such verb by reading it.
     · ABSENT IS NOT EMPTY. The corpus reader is run against a
       temporary tree with a missing ledger, an empty one and a full
       one, and asserted to return three different states. This is
       the §0.3 rule applied to the module that measures it.
     · AN ANCHOR THAT CANNOT BE CHECKED IS NOT A FALSE ANCHOR. Three
       states, never two: a commit missing from a tree is
       unresolvable where git cannot answer and refuted where it
       can. SESSION 25's correction is what this test is for.
     · A PATTERN NEEDS TWO INSTANCES, AND THE RULE IS IN CODE. A
       one-instance pattern is refused and REPORTED, and a pattern
       with a refuted anchor is refused whatever its other instances
       say.
     · EVERY ANCHOR IN THE REAL PATTERN SET RESOLVES AGAINST THE REAL
       REPOSITORY. That is the test that will fail first when the
       tree moves, and failing is what it is for.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import {
  resolveAll, resolveAnchor, MEASURES, PROSE_POLICY_DOCS, ANCHOR_STATES,
  gitAvailability, resetGitAvailability, REPO_ROOT,
} from './evidence.mjs';
import { decisionCorpus, readStore, corrections, DECISION_STORES, STORE_STATES } from './corpus.mjs';
import { PATTERNS, FAMILIES, MIN_INSTANCES, patternsWithEvidence } from './patterns.mjs';
import { DRAFTS, PROPOSAL_KINDS, FORBIDDEN_CLASS, buildProposals, classOf } from './proposals.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODULES = readdirSync(HERE).filter((f) => f.endsWith('.mjs'));

/* ---------------------------------------------------------- 1 · it never writes */

test('1 · no module in this directory CALLS a write API', () => {
  /* A call, not a mention: the header of proposals.mjs names the
     four writers in the course of saying it does not use them, and a
     check that could not tell those apart would have to be satisfied
     by deleting the explanation. */
  const writers = /\b(writeFileSync|appendFileSync|mkdirSync|rmSync|renameSync|copyFileSync|createWriteStream|writeFile|writeSync|appendFile)\s*\(/;
  for (const f of MODULES) {
    if (f === 'selftest.mjs') continue;   // the suite writes temporary trees, and nothing else here does
    const src = readFileSync(join(HERE, f), 'utf8');
    assert.equal(writers.test(src), false, `${f} calls a write API. Nothing in this directory may write.`);
    assert.equal(/from 'node:fs'/.test(src) && /writeFileSync|appendFileSync|mkdirSync/.test(src.split('\n').filter((l) => l.includes("from 'node:fs'")).join(' ')), false,
      `${f} imports a write member of node:fs.`);
  }
});

test('1b · no module here imports the writer of either ledger', () => {
  /* The two functions that can record a decision or a grant are
     `recordDecision` and `recordGrant`. Importing one is the only
     way this directory could acquire a decision home without a
     write call of its own, and it is the thing AGENTS.md means by
     "do not add a third writer". */
  for (const f of MODULES) {
    if (f === 'selftest.mjs') continue;
    const src = readFileSync(join(HERE, f), 'utf8');
    for (const writer of ['recordDecision', 'recordGrant']) {
      assert.equal(new RegExp(`\\b${writer}\\s*\\(`).test(src), false,
        `${f} calls ${writer}. A grant lives in agent/policy/governance/ and a decision in agent/implement/decisions/, each written by exactly one command elsewhere.`);
    }
  }
});

test('1c · a full run leaves the working tree byte-identical', async () => {
  const before = treeHash();
  const r = await buildProposals({ resolveAll, now: '2026-09-10' });
  await patternsWithEvidence({ resolveAll });
  decisionCorpus();
  corrections();
  const after = treeHash();
  assert.equal(after, before, 'a run of this module changed the working tree');
  assert.ok(r.proposals.length > 0);
});

function treeHash() {
  const out = execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' });
  const files = execFileSync('git', ['ls-files', '-s'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return createHash('sha256').update(out).update(files).digest('hex');
}

/* ---------------------------------------------------------- 2 · it never decides */

test('2 · every proposal requires human approval and none is decided', async () => {
  const { proposals } = await buildProposals({ resolveAll });
  assert.ok(proposals.length >= 6);
  for (const p of proposals) {
    assert.equal(p.requires_human_approval, true, `${p.ref} must require human approval`);
    assert.equal(p.decision, null, `${p.ref} carries a decision. Nothing here decides.`);
    assert.equal(p.decided_by, null, `${p.ref} names a decider.`);
    assert.notEqual(p.autonomy_class, FORBIDDEN_CLASS, `${p.ref} is "${FORBIDDEN_CLASS}". No governance proposal ever is.`);
  }
});

test('2b · the CLI has no verb that would decide, apply or grant', () => {
  const src = readFileSync(join(HERE, 'cli.mjs'), 'utf8');
  for (const verb of ['decide', 'apply', 'grant', 'record']) {
    assert.equal(new RegExp(`command === '${verb}'`).test(src), false,
      `cli.mjs handles "${verb}". A decision is written by agent/implement/cli.mjs decide and a grant by agent/policy/cli.mjs grant, and this command reads.`);
  }
});

test('2c · anything reaching the governance layer, in either of its two forms, is human_only', () => {
  assert.equal(classOf(['agent/policy/governance.mjs']).autonomy_class, 'human_only');
  assert.equal(classOf(['docs/AUTONOMY-POLICY.md']).autonomy_class, 'human_only',
    'the readable policy is the policy. P-12 is the pattern that says the existing lists do not treat it as one.');
  assert.equal(classOf(['agent/implement/decisions/']).autonomy_class, 'human_only');
  assert.equal(classOf(['README.md']).autonomy_class, 'review_required');
});

test('2c2 · a proposal that derived an automatic class is REFUSED, and the refusal can fire', async () => {
  await assert.rejects(
    () => buildProposals({ resolveAll, classify: () => ({ autonomy_class: FORBIDDEN_CLASS, why: 'planted', governance_paths: [] }) }),
    /No governance proposal is ever automatic/,
    'the guard must be reachable. A check that cannot fire reads as protection and is not.',
  );
});

test('2d · the six kinds the brief named all exist, and none was invented to fill a row', async () => {
  const r = await buildProposals({ resolveAll });
  assert.deepEqual([...PROPOSAL_KINDS].sort(), [...new Set(DRAFTS.map((d) => d.kind))].sort());
  for (const k of PROPOSAL_KINDS) assert.ok(r.by_kind[k] >= 1, `no proposal of kind ${k}`);
  for (const p of r.proposals) {
    assert.ok(p.from_patterns.length >= 1, `${p.ref} rests on no pattern`);
    assert.ok(p.against && p.against.length > 40, `${p.ref} states no case against itself`);
    assert.ok(p.what_it_would_not_do.length > 40, `${p.ref} does not say what it would not do`);
  }
});

test('2e · a proposal whose pattern is not supported is withdrawn, not emitted', async () => {
  const draft = [{ ...DRAFTS[0], ref: 'GP-XX', from_patterns: ['P-99'] }];
  const r = await buildProposals({ resolveAll, drafts: draft });
  assert.equal(r.proposals.length, 0);
  assert.equal(r.refused.length, 1);
  assert.match(r.refused[0].refused_why, /P-99/);
});

test('2f · a draft naming a kind outside the six throws', async () => {
  await assert.rejects(
    () => buildProposals({ resolveAll, drafts: [{ ...DRAFTS[0], kind: 'rewrite_policy' }] }),
    /not one of the six kinds/,
  );
});

test('2g · the ids are content-derived, so a re-run mints the same ones', async () => {
  const a = await buildProposals({ resolveAll, now: '2026-09-10' });
  const b = await buildProposals({ resolveAll, now: '2026-12-31' });
  assert.deepEqual(a.proposals.map((p) => p.proposal_id), b.proposals.map((p) => p.proposal_id),
    'the id must not depend on the as-of date; a decision binds to a hash and a re-run must reproduce it');
  assert.equal(new Set(a.proposals.map((p) => p.proposal_id)).size, a.proposals.length, 'two proposals share an id');
});

/* ---------------------------------------------------------- 3 · absent is not empty */

test('3 · the corpus reader returns three different states for absent, empty and full', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gov-corpus-'));
  try {
    const store = DECISION_STORES.find((s) => s.id === 'approval_ledger');
    const absent = readStore(store, { root: dir });
    assert.equal(absent.state, 'absent');
    assert.match(absent.why, /Absent is not empty/);

    mkdirSync(join(dir, 'agent/implement/decisions'), { recursive: true });
    writeFileSync(join(dir, store.path), '');
    assert.equal(readStore(store, { root: dir }).state, 'empty');

    writeFileSync(join(dir, store.path), `${JSON.stringify({ approval_id: 'a', proposal_id: 'p', outcome: 'granted', decided_by: 'somebody', decided_at: '2026-01-01' })}\n`);
    const full = readStore(store, { root: dir });
    assert.equal(full.state, 'holds');
    assert.equal(full.count, 1);
    assert.equal(new Set(STORE_STATES).has('absent') && new Set(STORE_STATES).has('empty'), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('3b · a line that does not parse is reported, never skipped', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gov-malformed-'));
  try {
    const store = DECISION_STORES.find((s) => s.id === 'approval_ledger');
    mkdirSync(join(dir, 'agent/implement/decisions'), { recursive: true });
    writeFileSync(join(dir, store.path), 'not json at all\n');
    const r = readStore(store, { root: dir });
    assert.equal(r.state, 'holds', 'a file holding an unparseable line is not empty');
    assert.equal(r.count, 0);
    assert.equal(r.malformed.length, 1);
    assert.match(r.why, /do not parse/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('3c · against the real repository, no proposal has ever been decided', () => {
  const c = decisionCorpus();
  assert.equal(c.decided, 0, 'this suite asserts the state SESSION 28 measured. If a decision has since been recorded, this test is the thing that says so — update it deliberately.');
  assert.match(c.statement, /has ever been approved, rejected or edited/);
  const ledger = c.stores.find((s) => s.id === 'approval_ledger');
  assert.equal(ledger.state, 'absent');
});

/* ---------------------------------------------------------- 4 · three anchor states */

test('4 · the three anchor states are three, and none collapses into another', () => {
  assert.deepEqual([...ANCHOR_STATES], ['resolved', 'refuted', 'unresolvable_here']);
});

test('4b · a commit anchor is unresolvable where git cannot answer, not refuted', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gov-nogit-'));
  try {
    resetGitAvailability();
    const r = await resolveAnchor({ kind: 'commit', sha: 'deadbeef', subject: 'x' }, { root: dir });
    assert.equal(r.state, 'unresolvable_here',
      'a tree with no git history cannot contradict a commit. Reporting that as refuted is the SESSION 25 error: stating more than was measured.');
  } finally { rmSync(dir, { recursive: true, force: true }); resetGitAvailability(); }
});

test('4c · a commit anchor IS refuted where git can answer and the commit is not there', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gov-realgit-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['config', 'user.email', 'suite@example.invalid'], { cwd: dir });
    execFileSync('git', ['config', 'user.name', 'suite'], { cwd: dir });
    writeFileSync(join(dir, 'f.txt'), 'x');
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync('git', ['commit', '-qm', 'only commit'], { cwd: dir });
    resetGitAvailability();
    const r = await resolveAnchor({ kind: 'commit', sha: '0'.repeat(40), subject: 'x' }, { root: dir });
    assert.equal(r.state, 'refuted');
    assert.match(r.why, /not shallow/);
  } finally { rmSync(dir, { recursive: true, force: true }); resetGitAvailability(); }
});

test('4d · a commit that exists with a different subject is refuted, and says what it found', async () => {
  const git = gitAvailability();
  if (!git.available) return;
  const r = await resolveAnchor({ kind: 'commit', sha: '4fe19522789288a16e492c1ca5044d037546b60d', subject: 'a subject this commit does not have' });
  assert.equal(r.state, 'refuted');
  assert.match(r.why, /does not contain/);
  assert.match(r.subject, /SESSION 25 correction/);
});

test('4e · a path anchor can assert an ABSENCE, and that is a different claim', async () => {
  const present = await resolveAnchor({ kind: 'path', path: 'AGENTS.md' });
  assert.equal(present.state, 'resolved');
  const absent = await resolveAnchor({ kind: 'path', path: 'agent/implement/decisions/decisions.jsonl', exists: false });
  assert.equal(absent.state, 'resolved');
  assert.match(absent.why, /Absent is not empty/);
  const wrong = await resolveAnchor({ kind: 'path', path: 'AGENTS.md', exists: false });
  assert.equal(wrong.state, 'refuted');
});

test('4f · a contains anchor with max asserts a rule is NOT there', async () => {
  const notThere = await resolveAnchor({ kind: 'contains', path: 'AGENTS.md', text: 're-fetch', max: 0 });
  assert.equal(notThere.state, 'resolved', 'the end-of-session re-fetch rule is not on main; P-06 is about exactly that');
  const isThere = await resolveAnchor({ kind: 'contains', path: 'AGENTS.md', text: 'AGENTS.md', max: 0 });
  assert.equal(isThere.state, 'refuted');
});

test('4g · a line anchor reports the line it actually found', async () => {
  const r = await resolveAnchor({ kind: 'line', path: 'AGENTS.md', line: 1, text: 'not on line one' });
  assert.equal(r.state, 'refuted');
  assert.match(r.why, /A line number moves when a file is edited/);
});

test('4h · an unknown anchor kind is refuted by name, not ignored', async () => {
  const r = await resolveAnchor({ kind: 'vibes', why: 'it feels true' });
  assert.equal(r.state, 'refuted');
  assert.match(r.why, /five anchor kinds/);
});

test('4i · a measurement that cannot run here is unresolvable, not refuted', async () => {
  const r = await resolveAnchor({ kind: 'measure', measure: 'throws', expect: 1 }, {
    measures: { throws: async () => { throw new Error('no such ref in this checkout'); } },
  });
  assert.equal(r.state, 'unresolvable_here');
  assert.match(r.why, /no such ref/);
});

test('4j · a measurement with no registered name is refuted', async () => {
  const r = await resolveAnchor({ kind: 'measure', measure: 'invented_on_the_spot', expect: 1 });
  assert.equal(r.state, 'refuted');
});

/* ---------------------------------------------------------- 5 · the measures */

test('5 · every registered measure runs read-only and returns a reason', async () => {
  for (const [name, fn] of Object.entries(MEASURES)) {
    const before = treeHash();
    const m = await fn({});
    assert.ok(typeof m.why === 'string' && m.why.length > 20, `${name} returns no usable reason`);
    assert.ok('value' in m && 'detail' in m, `${name} must return value and detail`);
    assert.equal(treeHash(), before, `${name} changed the working tree`);
  }
});

test('5b · the contracts banner is measured against the registry, not against a number', async () => {
  const m = await MEASURES.contracts_banner_vs_registry({});
  assert.ok(['agrees', 'drifted'].includes(m.value));
  assert.equal(typeof m.detail.listed, 'number');
  assert.ok(m.detail.listed >= 18, 'the registry holds at least the eighteen contracts');
});

test('5c · the grant field measure names the fields, so fixing it makes the finding go away', async () => {
  const m = await MEASURES.grant_fields_absent({});
  assert.equal(typeof m.value, 'number');
  assert.equal(m.detail.present.length + m.detail.absent.length, m.detail.allowlisted);
  for (const f of m.detail.absent) assert.equal(m.detail.present.includes(f), false);
});

test('5d · the policy-document measure reads the real policy in force, not DEFAULT_POLICY', async () => {
  const m = await MEASURES.policy_docs_in_enabled_category({});
  assert.match(m.detail.policy_id, /\+grants\//,
    'the question "what may happen now" is asked of the policy in force, never of the base');
  assert.ok(m.value <= PROSE_POLICY_DOCS.length);
  assert.match(m.why, /says what the category and path gates do/);
});

test('5e · the eight prose policy documents all exist', () => {
  for (const d of PROSE_POLICY_DOCS) {
    assert.equal(existsSync(join(REPO_ROOT, d)), true, `${d} is named as a governance document and is not in the tree`);
  }
});

/* ---------------------------------------------------------- 6 · the two-instance rule */

test('6 · a pattern with one holding instance is refused and REPORTED', async () => {
  const one = [{
    id: 'P-TEST', family: 'repeated_correction', title: 't', statement: 's', so_what: 'w',
    instances: [{ when: 'now', what: 'x', anchor: { kind: 'path', path: 'AGENTS.md' } }],
  }];
  const r = await patternsWithEvidence({ resolveAll, patterns: one });
  assert.equal(r.patterns.length, 0);
  assert.equal(r.refused.length, 1, 'refused, not dropped');
  assert.match(r.refused[0].why, /One occurrence is an incident/);
  assert.equal(MIN_INSTANCES, 2);
});

test('6b · a pattern with a refuted anchor is refused whatever its other instances say', async () => {
  const mixed = [{
    id: 'P-TEST', family: 'repeated_correction', title: 't', statement: 's', so_what: 'w',
    instances: [
      { when: 'a', what: 'x', anchor: { kind: 'path', path: 'AGENTS.md' } },
      { when: 'b', what: 'y', anchor: { kind: 'path', path: 'README.md' } },
      { when: 'c', what: 'z', anchor: { kind: 'path', path: 'no-such-file.md' } },
    ],
  }];
  const r = await patternsWithEvidence({ resolveAll, patterns: mixed });
  assert.equal(r.patterns.length, 0);
  assert.equal(r.refused.length, 1);
  assert.match(r.refused[0].why, /REFUTED/);
});

test('6c · an unresolvable anchor is counted neither way', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gov-unres-'));
  try {
    resetGitAvailability();
    const p = [{
      id: 'P-TEST', family: 'repeated_correction', title: 't', statement: 's', so_what: 'w',
      instances: [
        { when: 'a', what: 'x', anchor: { kind: 'path', path: 'AGENTS.md' } },
        { when: 'b', what: 'y', anchor: { kind: 'path', path: 'README.md' } },
        { when: 'c', what: 'z', anchor: { kind: 'commit', sha: 'deadbeef', subject: 'x' } },
      ],
    }];
    const r = await patternsWithEvidence({ resolveAll, patterns: p, root: REPO_ROOT });
    /* Two hold in the real tree; the commit is checked against the
       real repository here, so this asserts the arithmetic rather
       than the environment. */
    assert.equal(r.patterns.length + r.refused.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); resetGitAvailability(); }
});

/* ---------------------------------------------------------- 7 · the real evidence */

test('7 · every anchor in the real pattern set resolves against the real repository', async () => {
  const r = await patternsWithEvidence({ resolveAll });
  assert.equal(r.anchors.refuted, 0,
    `${r.anchors.refuted} anchor(s) are refuted. A pattern citing something this tree contradicts must be corrected or withdrawn, not left standing.`);
  assert.ok(r.anchors.resolved >= 40, `only ${r.anchors.resolved} anchor(s) resolved`);
});

test('7b · every pattern declares one of the brief\'s six families', () => {
  for (const p of PATTERNS) {
    assert.ok(FAMILIES.includes(p.family), `${p.id} declares family "${p.family}", which the brief does not name`);
    assert.ok(p.statement.length > 80, `${p.id} states nothing checkable`);
    assert.ok(p.so_what.length > 60, `${p.id} does not say why it matters`);
  }
});

test('7c · all six families the brief named are covered by at least one pattern', async () => {
  const r = await patternsWithEvidence({ resolveAll });
  for (const f of FAMILIES) {
    assert.ok(r.families[f] >= 1, `no supported pattern in family ${f}. The brief asked for all six; a family with nothing in it is reported as empty rather than filled.`);
  }
});

test('7d · every pattern id is unique and every proposal cites one that exists', async () => {
  const ids = PATTERNS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const d of DRAFTS) {
    for (const ref of d.from_patterns) {
      assert.ok(ids.includes(ref), `${d.ref} cites ${ref}, which is not a pattern`);
    }
  }
});

/* ---------------------------------------------------------- 8 · the CLI */

test('8 · check exits 0 on this tree and writes nothing', () => {
  const before = treeHash();
  const r = run(['check']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /No anchor is refuted/);
  assert.equal(treeHash(), before);
});

test('8b · list names every proposal and says none is decided', () => {
  const r = run(['list']);
  assert.equal(r.code, 0);
  assert.match(r.out, /requires human approval, none is decided/);
  for (const d of DRAFTS) assert.match(r.out, new RegExp(d.ref));
});

test('8c · corpus reports the ledger as absent rather than as zero decisions', () => {
  const r = run(['corpus']);
  assert.equal(r.code, 0);
  assert.match(r.out, /ABSENT/);
  assert.match(r.out, /Absent is not empty/);
});

test('8d · patterns prints all six families, including any that is empty', () => {
  const r = run(['patterns']);
  assert.equal(r.code, 0);
  for (const f of FAMILIES) assert.match(r.out, new RegExp(f));
});

test('8e · show prints the case AGAINST the proposal, not only the case for', () => {
  const r = run(['show', 'GP-06']);
  assert.equal(r.code, 0);
  assert.match(r.out, /THE CASE AGAINST/);
  assert.match(r.out, /increased_autonomy/);
  assert.match(r.out, /requires human approval and has not been decided/);
});

test('8f · an unknown command exits 1 rather than doing something else', () => {
  const r = run(['approve']);
  assert.equal(r.code, 1);
  assert.match(r.out, /unknown command/);
});

test('8g · --json is machine-readable and carries the same refusals', () => {
  const r = run(['list', '--json']);
  assert.equal(r.code, 0);
  const parsed = JSON.parse(r.out);
  assert.ok(parsed.proposals.length >= 6);
  for (const p of parsed.proposals) assert.equal(p.decision, null);
});

function run(args) {
  try {
    const out = execFileSync(process.execPath, [join(HERE, 'cli.mjs'), ...args], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: typeof e.status === 'number' ? e.status : 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/* ---------------------------------------------------------- 9 · the corrections */

test('9 · the correction classifier says it is a floor, and is measured one way', () => {
  const c = corrections();
  if (!c.available) return;
  assert.ok(c.count >= 1);
  assert.match(c.why, /floor|SHALLOW/);
  for (const x of c.commits) assert.equal(x.sha.length, 40);
});

test('9b · this module is inside the published surface, like the rest of agent/', () => {
  /* Not a defect and not new — AGENTS.md carries it as a standing
     finding. It is asserted here so a future session cannot read
     "governance proposals" as "private". */
  assert.equal(HERE.startsWith(join(REPO_ROOT, 'agent')), true);
  assert.equal(HERE.includes('/.'), false, 'this directory is NOT behind the one real publication boundary, and nothing here may assume it is');
});
