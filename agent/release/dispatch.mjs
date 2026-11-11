/* ============================================================
   agent/release/dispatch.mjs — the release dispatcher

   WHAT IT IS. The one component that takes a proposal an agent made and a
   decision a person recorded, re-derives that the two belong together, and —
   only if every check holds — has Agent 9 make the change on an isolated
   branch and commits it with the trailers the deploy gate later reads. It is
   the missing middle of the chain:

     agent proposal → deterministic validation → human decision (ledger)
       → [ THIS: re-verify, de-duplicate, apply, commit ] → pull request
       → deploy gate (gate.mjs) → authorised artifact

   WHAT IT IS NOT. It is not the Orchestrator's `dispatchers` seam
   (agent/orchestrator/: which specialist runs a stage). That seam is what
   `agent/production/readiness.mjs production_dispatcher_wired` measures, by
   the existence of agent/orchestrator/dispatchers.mjs, and this module does
   not create that file and does not satisfy that condition. Whether it
   should is the author's decision (docs/PRODUCTION-OPERATING-MODE.md §3).

   WHAT IT NEVER DOES. It never pushes, never merges, never touches `main`,
   never writes the ledger, never approves anything. Getting a change onto
   `main` is a pull request a person merges; getting it published is
   pages.yml, behind the gate. "Dispatched" therefore means: a verified commit
   exists on a branch named for the proposal. Nothing more.

   FAIL CLOSED, IN THIS ORDER, AND ALL OF IT RECORDED:
     1 intake        the input is one proposal id of a recognised shape
     2 ledger        the whole ledger verifies — chain, signatures, no fixtures
     3 approval      a granted, signed, non-simulated decision is bound to the
                     proposal as it stands NOW (content hash), by a reviewer
                     who is not an agent
     4 preflight     Agent 9's ten gates, run again here, not trusted from
                     whenever the proposal was written
     5 duplicate     no commit anywhere carries this approval+proposal key
     5a index        nothing staged, nothing unmerged, no merge/rebase/
                     cherry-pick in progress (P0.1, 11 Nov 2026) — run in a
                     rehearsal too, so that a rehearsal never promises a
                     dispatch the execution would refuse
     6 isolate       a new branch from a non-main branch with a clean scope;
                     the tree is snapshotted (status + bytes) before it
     7 apply         Agent 9, handed the very snapshot checked above
     8 scope         what git shows the apply PRODUCED (against the
                     snapshot, not against "dirty before") is inside the
                     approved scope AND is exactly what the applier
                     DECLARED; otherwise the dispatcher's own rollback runs
                     and is verified against the snapshot
     9 commit        only the produced paths are staged, the index is
                     re-read before `git commit`, and the commit is re-read
                     after it; trailers: Proposal, Proposal-SHA256,
                     Approval, Dispatch-Key
   Every stage is logged whether it passed or not, to a run log (git-ignored,
   like every agent's) and to the returned report.

   THE DEFAULT IS A REHEARSAL (stages 1–5, no git write, no QA run). `execute`
   is the only thing that writes, and it still refuses everything above.
   ============================================================ */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { DECISION_DIR, deriveApproval, readAgentRecords, readLedger } from '../implement/ledger.mjs';
import { readReviewers, verifyLedger, describeLedger } from '../implement/attestation.mjs';
import { preflight } from '../implement/preflight.mjs';
import { commitContents, diffSnapshots, inspectIndex, keepForRecovery, restorePaths, snapshot, stagedAgainst, verifyRestored } from './worktree.mjs';
import { AGENT_NAMES } from '../orchestrator/capabilities.mjs';
import { RUN_LOG_DIR, TRAILERS } from './policy.mjs';

export const PROPOSAL_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{3,119}$/;
export const FORBIDDEN_BRANCHES = ['main', 'master', 'HEAD'];
export const OUTCOMES = ['dispatched', 'would_dispatch', 'duplicate', 'refused', 'failed'];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** The idempotency key. The same approval of the same proposal content always
 *  yields the same key; a changed proposal, or a fresh approval, a new one. */
export const dispatchKey = ({ approvalId, proposalSha256 }) => sha256(`dispatch:${approvalId}:${proposalSha256}`).slice(0, 32);

/** Every commit, on any branch, that carries this key. Derived from git, not
 *  stored: a second store would be a second home for the fact "this was done",
 *  and one that a fresh clone would not have. */
export function findDispatches(key, { cwd = REPO_ROOT, mainRef = null } = {}) {
  let shas = [];
  try { shas = git(['log', '--all', '-F', `--grep=${TRAILERS.dispatchKey}: ${key}`, '--format=%H'], cwd).split('\n').filter(Boolean); } catch { shas = []; }
  const main = mainRef ?? ['origin/main', 'main'].find((r) => { try { git(['rev-parse', '--verify', '--quiet', r], cwd); return true; } catch { return false; } });
  return shas.map((sha) => {
    let onMain = false;
    if (main) { try { git(['merge-base', '--is-ancestor', sha, main], cwd); onMain = true; } catch { onMain = false; } }
    return { sha, on_main: onMain, main_ref: main ?? null };
  });
}

/** The message of a dispatched change. Trailers last, one per line, in the
 *  form `git interpret-trailers` and tools/commit-evidence.mjs read. */
export function buildCommitMessage({ proposal, proposalId, approval, key, result, evidenceLine }) {
  const d = approval.decision;
  const summary = String(proposal.proposed_change?.summary ?? proposalId).replace(/\s+/g, ' ').slice(0, 60);
  return [
    `release: ${summary}`,
    '',
    String(proposal.reason ?? '').trim(),
    '',
    `Dispatched from an approved proposal. No push and no merge was made; this commit`,
    `waits on a branch for a person to open and merge a pull request.`,
    '',
    result?.commit_metadata?.body ? result.commit_metadata.body.split('\n').filter((l) => /^(Files|QA|Rollback):/.test(l)).join('\n') : '',
    '',
    `${TRAILERS.proposal}: ${proposalId}`,
    `${TRAILERS.proposalSha}: ${d.proposal_sha256}`,
    `${TRAILERS.approval}: ${d.approval_id}`,
    `${TRAILERS.dispatchKey}: ${key}`,
    `Decided-By: ${d.decided_by}${d.decided_role ? ` (${d.decided_role})` : ''} at ${d.decided_at}`,
    `Evidence: ${evidenceLine}`,
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

/** The applier's own account of what it changed, as repository paths. */
export const declaredPaths = (result) => [...new Set((result?.change?.files ?? []).map((f) => String(f?.path ?? '').replace(/^\.?\//, '').trim()).filter(Boolean))].sort();

const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* ------------------------------------------------------------ the run log */

export function logRun(report, { logDir } = {}) {
  try {
    mkdirSync(logDir, { recursive: true });
    appendFileSync(join(logDir, 'dispatch.jsonl'), `${JSON.stringify(report)}\n`, 'utf8');
    return true;
  } catch { return false; }
}

/* ------------------------------------------------------------ the applier */

/** Agent 9 in apply mode, handed the verified snapshot. Swapped for a stub in
 *  the suite; the real one runs the four validators and the suites, which is
 *  minutes, not seconds. */
export async function implementerApplier({ proposalId, asOf, root, records, ledger }) {
  const { Tracer } = await import('../observability/tracer.mjs');
  const { JsonlSink } = await import('../observability/sink.mjs');
  const { RecordStore } = await import('../scout/store.mjs');
  const { Implementer, IMPLEMENT_AGENT } = await import('../implement/implementer.mjs');
  const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: IMPLEMENT_AGENT } });
  const store = new RecordStore({ allowSimulated: false });
  const agent = new Implementer({ tracer, store, asOf, root, apply: true, records, ledger });
  const run = await agent.run({ proposalIds: [proposalId] });
  return run.results[0] ?? { outcome: 'failed', why: 'the implementation agent returned no result for this proposal' };
}

/* ------------------------------------------------------------ the dispatcher */

/**
 * @returns {Promise<{outcome:string, proposal_id:string, stages:object[], reasons:string[], commit:string|null,
 *                    branch:string|null, key:string|null, rehearsal:boolean, at:string}>}
 */
export async function dispatch({
  proposalId, asOf = null, execute = false, root = REPO_ROOT,
  records = null, ledgerDir = DECISION_DIR, reviewers = null,
  requireSignatures = true, allowSimulated = false,
  applier = implementerApplier, logDir = join(root, RUN_LOG_DIR), mainRef = null,
  now = () => new Date(),
} = {}) {
  const stages = [];
  const report = { outcome: 'refused', proposal_id: proposalId ?? null, stages, reasons: [], commit: null, branch: null, key: null, rehearsal: !execute, at: now().toISOString() };
  const stage = (name, ok, why, extra = {}) => { stages.push({ stage: name, ok, why, ...extra }); return ok; };
  const finish = (outcome, reason = null) => {
    report.outcome = outcome;
    if (reason) report.reasons.push(reason);
    report.logged = logRun(report, { logDir });
    return report;
  };
  const refuse = (name, why, extra) => { stage(name, false, why, extra); return finish('refused', `${name}: ${why}`); };

  /* 1 ------------------------------------------------------------- intake */
  if (typeof proposalId !== 'string' || !PROPOSAL_ID.test(proposalId)) {
    return refuse('intake', `"${String(proposalId).slice(0, 60)}" is not a proposal id (letters, digits, "." "_" "-", 4–120 characters). Free text, a path or an empty input is not an input.`);
  }
  stage('intake', true, `proposal id "${proposalId}" has a recognised shape`);

  const rec = records ?? readAgentRecords();
  const agentNames = [...new Set([...AGENT_NAMES, ...[...rec.byId.values()].map((r) => r.agent).filter(Boolean)])];

  /* 2 ------------------------------------------------------------- ledger */
  const reg = reviewers ?? readReviewers({ dir: ledgerDir });
  const verified = verifyLedger({ dir: ledgerDir, reviewers: reg, requireSignatures, allowSimulated, agentNames, now: now() });
  if (!verified.ok) {
    return refuse('ledger', `the decision ledger does not verify: ${describeLedger(verified)}. ${verified.problems.slice(0, 3).map((p) => `line ${p.line ?? '–'}: ${p.why}`).join(' · ')}`, { problems: verified.problems.slice(0, 20) });
  }
  stage('ledger', true, describeLedger(verified), { entries: verified.count, chain_head: verified.chain_head });

  /* 3 ----------------------------------------------------------- approval */
  const ledger = readLedger({ dir: ledgerDir });
  const approval = deriveApproval(proposalId, { records: rec, ledger, allowSimulated });
  if (approval.state !== 'granted') {
    return refuse('approval', `approval state is "${approval.state}": ${approval.why}`, { state: approval.state });
  }
  const entryInfo = verified.entries.filter((e) => e.entry.proposal_id === proposalId && e.entry.approval_id === approval.decision.approval_id).pop();
  if (!entryInfo) return refuse('approval', 'the granting decision is not among the verified ledger entries');
  if (requireSignatures && !(entryInfo.signed && entryInfo.signature_ok)) {
    return refuse('approval', 'the decision is not signed by a registered reviewer. An unsigned line shows that somebody wrote a name; it does not show that the person decided.');
  }
  if (requireSignatures && !approval.decision.decided_role) return refuse('approval', 'the decision records no reviewer role');
  stage('approval', true, approval.why, { approval_id: approval.approval_id, decided_by: approval.decision.decided_by, decided_role: approval.decision.decided_role ?? null, signed: entryInfo.signed });

  /* 4 ------------------------------------------------------------ preflight */
  const pre = preflight(proposalId, { records: rec, ledger });
  if (!pre.ok) {
    return refuse('preflight', pre.summary, { failed: pre.failed.map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })) });
  }
  stage('preflight', true, pre.summary, { permitted: pre.scope.permitted });

  /* 5 ------------------------------------------------------------ duplicate */
  const key = dispatchKey({ approvalId: approval.decision.approval_id, proposalSha256: approval.decision.proposal_sha256 });
  report.key = key;
  const prior = findDispatches(key, { cwd: root, mainRef });
  if (prior.length) {
    stage('duplicate', true, `this approval of this proposal content was already dispatched: ${prior.map((p) => `${p.sha.slice(0, 12)}${p.on_main ? ' (on ' + p.main_ref + ')' : ''}`).join(', ')}. Nothing is done twice.`, { prior });
    report.commit = prior[0].sha;
    return finish('duplicate');
  }
  stage('duplicate', true, `no commit on any branch carries Dispatch-Key ${key.slice(0, 12)}…`);

  /* 5a ---------------------------------------------------------------- index */
  /* Before anything is applied, and in a rehearsal too: `git commit` takes
     the whole index, so anything already staged would ride along with the
     approved change. Refused by name; never unstaged here. */
  let idx;
  try { idx = inspectIndex(root); } catch (e) { return refuse('index', `git could not report the index: ${e.message.split('\n')[0]}`); }
  if (!idx.ok) return refuse('index', idx.why, { staged: idx.staged, unmerged: idx.unmerged, in_progress: idx.in_progress });
  stage('index', true, 'nothing staged, nothing unmerged, no merge, rebase, cherry-pick or revert in progress');

  const proposal = pre.proposal;
  const evidenceLine = `proposal ${proposalId} (${(proposal.evidence ?? []).length} evidence reference(s)), decision ${approval.decision.approval_id} by ${approval.decision.decided_by}`;

  if (!execute) {
    stage('rehearsal', true, 'stages 6–9 were not run: a rehearsal writes nothing and runs no QA. The commit it would make is in `would_commit`.');
    report.would_commit = buildCommitMessage({ proposal, proposalId, approval, key, result: null, evidenceLine });
    return finish('would_dispatch');
  }

  /* 6 --------------------------------------------------------------- isolate */
  let origin;
  try { origin = git(['rev-parse', '--abbrev-ref', 'HEAD'], root); } catch (e) { return refuse('isolate', `git could not answer: ${e.message}`); }
  if (FORBIDDEN_BRANCHES.includes(origin)) {
    return refuse('isolate', `the working tree is on "${origin}". A push to main publishes; no change is dispatched from there. Work from a feature branch.`);
  }
  /* The snapshot the rollback is verified against: every path git reports,
     its status column and its bytes. The person's uncommitted bytes are
     held so that they can be put back; past the cap, no dispatch. */
  let before;
  try { before = snapshot(root, { keepBytes: true }); } catch (e) { return refuse('isolate', `git could not report the working tree: ${e.message.split('\n')[0]}`); }
  const clash = [...before.entries.keys()].filter((p) => pre.scope.permitted.includes(p));
  if (clash.length) return refuse('isolate', `${clash.join(', ')} already has uncommitted changes, so there is no clean pre-change state to roll back to.`);
  if (before.over_cap) return refuse('isolate', `the working tree holds ${before.held_bytes} bytes of uncommitted work, more than the snapshot holds in memory; a rollback over it could not be verified byte for byte. Commit or move that work, then dispatch again.`);
  const base = before.head;
  const branch = `release/${proposalId.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 60)}-${key.slice(0, 8)}`;
  try { git(['checkout', '-b', branch], root); } catch (e) { return refuse('isolate', `could not cut ${branch}: ${e.message.split('\n')[0]}`); }
  report.branch = branch;
  report.base = base;
  stage('isolate', true, `branch ${branch} cut from ${origin} at ${base.slice(0, 12)}; snapshot of ${before.entries.size} pre-existing uncommitted path(s) taken`, { preexisting: [...before.entries.keys()] });

  /* The dispatcher's own rollback (distinct from Agent 9's, which restores
     the PERMITTED paths after a failed QA): every path whose state differs
     from the snapshot is put back, the result is measured, and only a
     verified tree lets the branch go. An unverified one keeps the branch,
     names each path and is reported HIGH. */
  const rollBack = (why) => {
    const attempt = diffSnapshots(before, snapshot(root));
    const restored = restorePaths(root, { before, base, paths: attempt });
    let check = verifyRestored(root, { before, base });
    let leftBranch = false;
    if (check.verified) {
      try { git(['checkout', '-q', origin], root); git(['branch', '-D', branch], root); leftBranch = true; } catch (e) { check = { ...check, verified: false, problems: [...check.problems, `could not leave ${branch}: ${e.message.split('\n')[0]}`] }; }
      if (leftBranch) {
        const after = verifyRestored(root, { before, base });
        const onOrigin = git(['rev-parse', '--abbrev-ref', 'HEAD'], root) === origin;
        check = { ...after, verified: after.verified && onOrigin, problems: [...after.problems, ...(onOrigin ? [] : [`HEAD is not back on ${origin}`])] };
      }
    }
    report.rollback = {
      by: 'dispatcher', why, verified: check.verified, attempted: attempt, errors: restored.errors,
      unrestored: check.differing, staged_after: check.staged, problems: check.problems,
      how_verified: `every path re-read with \`git status\` and re-hashed against the snapshot taken before ${branch} was cut; HEAD compared with ${base.slice(0, 12)}; the index compared with it`,
    };
    if (check.verified) {
      report.branch = null;
      stage('rollback', true, `the tree is back to the pre-dispatch snapshot: ${attempt.length} path(s) restored and re-hashed, nothing staged, HEAD ${base.slice(0, 12)}, on ${origin}; ${branch} removed`);
      return true;
    }
    report.severity = 'high';
    report.recovery = keepForRecovery(join(logDir, `recovery-${Date.now()}`), { before, paths: check.differing });
    stage('rollback', false, `ROLLBACK NOT VERIFIED — ${check.problems.join(' · ')}${restored.errors.length ? ` · errors: ${restored.errors.map((e) => `${e.path}: ${e.why}`).join('; ')}` : ''}. ${branch} was KEPT for recovery; the person's own bytes for the paths above ${report.recovery.length ? `are copied under ${join(logDir, 'recovery-…')}` : 'were not held (they were clean, or over the cap)'}. Do not dispatch again until a person has looked.`);
    return false;
  };
  const failWith = (why) => {
    const ok = rollBack(why);
    return finish('failed', ok ? why : `${why}; ROLLBACK NOT VERIFIED (high severity): ${report.rollback.problems.join(' · ')}`);
  };

  /* 7 ----------------------------------------------------------------- apply */
  let result;
  try { result = await applier({ proposalId, asOf, root, records: rec, ledger }); } catch (e) { result = { outcome: 'failed', why: `the applier threw: ${e.message}` }; }
  if (result?.outcome !== 'implemented') {
    const agentRollback = result?.reverted ? { verified: result.reverted.verified === true, mismatches: result.reverted.mismatches ?? [] } : null;
    stage('apply', false, `Agent 9 ended "${result?.outcome ?? 'no result'}": ${result?.why ?? result?.preflight?.summary ?? 'see its trace'}${agentRollback ? `; Agent 9's own rollback of the permitted paths ${agentRollback.verified ? 'reports verified' : 'reports NOT verified'}` : ''}`, { agent_outcome: result?.outcome ?? null, agent_rollback: agentRollback });
    /* Agent 9's rollback covers the permitted paths only. Whatever else
       differs from the snapshot is the dispatcher's to put back, and it
       is measured either way. */
    report.residue_after_agent = diffSnapshots(before, snapshot(root));
    return failWith(`apply: Agent 9 did not implement the proposal (${result?.outcome ?? 'no result'})`);
  }
  const declared = declaredPaths(result);
  stage('apply', true, `Agent 9 reports ${declared.length} file(s) changed (${declared.join(', ') || 'none'}); QA verdict ${result.qa?.verdict ?? 'not reported'}`, { declared });

  /* 8 ------------------------------------------------------------------ scope */
  /* PRODUCED = what git shows changed against the snapshot, including a
     path that was already dirty and whose bytes or status moved. Before
     P0.1 this was "dirty now minus dirty before", which hid any change
     made inside a path the person had already touched or staged. */
  const produced = diffSnapshots(before, snapshot(root));
  const permitted = pre.scope.permitted;
  const outside = produced.filter((p) => !permitted.includes(p));
  const undeclared = produced.filter((p) => !declared.includes(p));
  const unobserved = declared.filter((p) => !produced.includes(p));
  const lists = { permitted, declared, produced };
  if (!produced.length || outside.length || undeclared.length || unobserved.length) {
    const why = [
      !produced.length ? 'the applier reported success and git shows no file changed' : null,
      outside.length ? `the working tree changed outside the approved scope: ${outside.join(', ')}` : null,
      undeclared.length ? `git shows ${undeclared.length} changed path(s) the applier did not declare: ${undeclared.join(', ')}` : null,
      unobserved.length ? `the applier declared ${unobserved.length} path(s) git shows unchanged: ${unobserved.join(', ')}` : null,
    ].filter(Boolean).join(' · ');
    stage('scope', false, `${why}. Declared ${declared.length}, produced ${produced.length}, permitted ${permitted.length}: the report and the tree disagree, and the tree is what a commit would carry.`, lists);
    return failWith(outside.length ? 'scope: a file outside the approved scope changed' : !produced.length ? 'scope: nothing changed' : 'scope: what the applier declared is not what git shows it produced');
  }
  stage('scope', true, `${produced.length} produced file(s), each permitted and each declared by the applier (${produced.join(', ')})`, lists);

  /* 9 ----------------------------------------------------------------- commit */
  const message = buildCommitMessage({ proposal, proposalId, approval, key, result, evidenceLine });
  try {
    /* one path at a time: a path the applier deleted may already be gone
       from the index (a `git mv`), and `git add` refuses a pathspec that
       matches nothing */
    for (const p of produced) {
      if (existsSync(join(root, p))) git(['add', '--', p], root);
      else git(['rm', '--cached', '-q', '--ignore-unmatch', '--', p], root);
    }
  } catch (e) {
    stage('commit', false, `git could not stage the produced paths: ${e.message.split('\n')[0]}`);
    return failWith('commit: git refused to stage');
  }
  const staged = stagedAgainst(root, base);
  if (!sameSet(staged, produced)) {
    stage('commit', false, `the index is not the produced set — staged ${staged.length} (${staged.join(', ')}), produced ${produced.length} (${produced.join(', ')}). Not committed.`, { staged, produced });
    return failWith('commit: the index holds something the dispatch did not produce');
  }
  try {
    git(['commit', '-q', '-m', message], root);
    report.commit = git(['rev-parse', 'HEAD'], root);
  } catch (e) {
    stage('commit', false, `git refused the commit: ${e.message.split('\n')[0]}`);
    return failWith('commit: git refused');
  }
  /* Re-read what was committed. A hook can stage more; a commit can have
     two parents. Either is a commit the decision did not authorise. */
  const made = commitContents(root, report.commit);
  if (made.parents.length !== 1 || made.parents[0] !== base || !sameSet(made.files ?? [], produced)) {
    const bad = report.commit;
    report.commit = null;
    stage('commit', false, `the commit ${bad.slice(0, 12)} is not the produced change: parents ${made.parents.map((p) => p.slice(0, 12)).join(', ') || 'none'} (expected ${base.slice(0, 12)}), files ${(made.files ?? ['(not a one-parent commit)']).join(', ')} (expected ${produced.join(', ')}). It stays readable as ${bad} in the reflog until git expires it.`, { rejected_commit: bad, committed: made.files, produced });
    report.rejected_commit = bad;
    /* Back to the base without `reset`: detaching there takes the committed
       paths back to it, and the ordinary rollback then measures the rest. */
    try { git(['checkout', '-q', '--detach', base], root); } catch { /* measured by the rollback */ }
    return failWith('commit: the commit did not contain exactly the produced change');
  }
  stage('commit', true, `committed ${report.commit.slice(0, 12)} on ${branch}: one parent (${base.slice(0, 12)}), ${made.files.length} file(s), exactly the produced set; NOT pushed, NOT merged. Open a pull request to publish.`, { files: made.files });
  try { git(['checkout', '-q', origin], root); } catch { /* the branch holds the commit either way */ }
  return finish('dispatched');
}
