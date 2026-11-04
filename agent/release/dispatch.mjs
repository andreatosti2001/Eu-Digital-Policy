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
     6 isolate       a new branch from a non-main branch with a clean scope
     7 apply         Agent 9, handed the very snapshot checked above
     8 scope         the changed files are inside the approved scope
     9 commit        trailers: Proposal, Proposal-SHA256, Approval, Dispatch-Key
   Every stage is logged whether it passed or not, to a run log (git-ignored,
   like every agent's) and to the returned report.

   THE DEFAULT IS A REHEARSAL (stages 1–5, no git write, no QA run). `execute`
   is the only thing that writes, and it still refuses everything above.
   ============================================================ */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { DECISION_DIR, deriveApproval, readAgentRecords, readLedger } from '../implement/ledger.mjs';
import { readReviewers, verifyLedger, describeLedger } from '../implement/attestation.mjs';
import { preflight } from '../implement/preflight.mjs';
import { changedPaths } from '../implement/scope.mjs';
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

/** Put back exactly the paths a refused change touched: tracked ones from the
 *  index, untracked ones removed. One path at a time, so that an untracked
 *  file cannot make git abort the restore of a tracked one. */
function undo(paths, cwd) {
  for (const p of paths) {
    let tracked = true;
    try { git(['ls-files', '--error-unmatch', '--', p], cwd); } catch { tracked = false; }
    try {
      if (tracked) git(['checkout', '--', p], cwd);
      else rmSync(join(cwd, p), { force: true });
    } catch { /* the refusal names the path; a person looks */ }
  }
}

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
  const dirty = changedPaths({ cwd: root });
  const clash = dirty.filter((p) => pre.scope.permitted.includes(p));
  if (clash.length) return refuse('isolate', `${clash.join(', ')} already has uncommitted changes, so there is no clean pre-change state to roll back to.`);
  const branch = `release/${proposalId.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 60)}-${key.slice(0, 8)}`;
  try { git(['checkout', '-b', branch], root); } catch (e) { return refuse('isolate', `could not cut ${branch}: ${e.message.split('\n')[0]}`); }
  report.branch = branch;
  stage('isolate', true, `branch ${branch} cut from ${origin} at ${git(['rev-parse', '--short', 'HEAD'], root)}`);

  const back = (why) => {
    /* the applier rolls its own edit back; this only leaves the branch */
    try { git(['checkout', origin], root); git(['branch', '-D', branch], root); } catch { /* reported by the refusal */ }
    report.branch = null;
    return why;
  };

  /* 7 ----------------------------------------------------------------- apply */
  let result;
  try { result = await applier({ proposalId, asOf, root, records: rec, ledger }); } catch (e) { result = { outcome: 'failed', why: `the applier threw: ${e.message}` }; }
  if (result?.outcome !== 'implemented') {
    stage('apply', false, `Agent 9 ended "${result?.outcome ?? 'no result'}": ${result?.why ?? result?.preflight?.summary ?? 'see its trace'}${result?.reverted ? '; its edit was rolled back and re-hashed' : ''}`, { agent_outcome: result?.outcome ?? null });
    back();
    return finish('failed', `apply: Agent 9 did not implement the proposal (${result?.outcome ?? 'no result'})`);
  }
  stage('apply', true, `Agent 9 implemented ${result.change?.files?.length ?? 0} file(s); QA verdict ${result.qa?.verdict ?? 'not reported'}`);

  /* 8 ------------------------------------------------------------------ scope */
  /* Only what the APPLIER changed counts: paths already dirty before it ran
     are somebody else's work, neither this change's nor a violation of it. */
  const touched = changedPaths({ cwd: root }).filter((p) => !dirty.includes(p));
  const outside = touched.filter((p) => !pre.scope.permitted.includes(p));
  if (outside.length || !touched.length) {
    stage('scope', false, outside.length ? `the working tree changed outside the approved scope: ${outside.join(', ')}` : 'the applier reported success and changed no file');
    undo(touched, root);
    back();
    return finish('failed', outside.length ? 'scope: a file outside the approved scope changed' : 'scope: nothing changed');
  }
  stage('scope', true, `${touched.length} changed file(s), every one inside the ${pre.scope.permitted.length} approved path(s)`, { files: touched });

  /* 9 ----------------------------------------------------------------- commit */
  const message = buildCommitMessage({ proposal, proposalId, approval, key, result, evidenceLine });
  try {
    git(['add', '--', ...touched], root);
    git(['commit', '-m', message], root);
    report.commit = git(['rev-parse', 'HEAD'], root);
  } catch (e) {
    stage('commit', false, `git refused the commit: ${e.message.split('\n')[0]}`);
    back();
    return finish('failed', 'commit: git refused');
  }
  stage('commit', true, `committed ${report.commit.slice(0, 12)} on ${branch}; NOT pushed, NOT merged. Open a pull request to publish.`);
  try { git(['checkout', origin], root); } catch { /* the branch holds the commit either way */ }
  return finish('dispatched');
}
