/* ============================================================
   agent/release/gate.mjs — the release gate: may THIS artifact, built from
   THIS commit, be published?

   It runs inside pages.yml's `build` job, after the artifact is built and
   BEFORE it is uploaded. A failing gate therefore leaves no uploaded artifact
   and `deploy` has nothing to deploy. Two halves, kept apart so that every
   refusal can be tested without a repository:

     gatherFacts()  reads git, the working tree, the artifact and the
                    environment. It judges nothing.
     judge()        a pure function from facts to conditions. It reads
                    nothing, so a test hands it a planted fact and watches it
                    refuse.

   THE CONDITIONS (a failed one blocks; an unmeasured mandatory one blocks
   exactly as a failure does — in CI nobody reads "skipped"):

     C1  origin            the repository, ref, event and workflow are the
                           authorised publisher's, and the checkout IS the
                           commit being published
     C2  history           a full clone; the judged range resolves
     C3  publisher         pages.yml is the only workflow that publishes, and
                           the gate is in its path (workflows.mjs)
     C4  upstream          every gate job GitHub reports in `needs` succeeded
     C5  ledger            the decision ledger verifies: chain, signatures,
                           registered reviewers, no simulated fixtures
     C6  append-only       no commit in range removed or rewrote a decision
     C7  agent changes     every commit declaring a Proposal traces to a
                           granted, signed, in-scope, fresh, unwithdrawn
                           decision that PRECEDES it in history
     C8  unledgered        agent-attributed commits with no Proposal; reported,
                           and blocking only under --strict-unledgered
     C9  artifact          only allowlisted files, byte-identical to the
                           commit's own blobs, no credential shape in them
     C10 registry pin      the reviewer registry is the one the owner pinned,
                           outside the repository

   WHAT NONE OF THIS PROVES. The gate is code in the repository it guards:
   whoever can change this file and pages.yml in one merge can change what the
   gate asks. The settings that close that — protected `main`, protected
   `.github/` and `agent/release/`, the `github-pages` environment's branch
   rule, the pinned registry — are outside the tree and are listed in
   docs/DEPLOYMENT.md §3a. The gate does not say they are set. It also cannot
   say a change is TRUE: C7 shows a person decided, not that they were right.
   ============================================================ */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { scanSecrets } from '../implement/boundary.mjs';
import { permittedFiles } from '../implement/scope.mjs';
import { parseReviewers, registryFingerprintOf, verifyLedger } from '../implement/attestation.mjs';
import { AGENT_NAMES } from '../orchestrator/capabilities.mjs';
import { refusal, verify as verifyArtifact } from '../../tools/pages-artifact.mjs';
import { auditWorkflows } from './workflows.mjs';
import { dispatchKey } from './dispatch.mjs';
import {
  AGENT_COMMIT_MARKERS, EXPECTED_REPOSITORY, MAX_APPROVAL_AGE_DAYS, PUBLISHING_WORKFLOW, PUBLISH_EVENTS, PUBLISH_REF,
  REGISTRY_PIN_ENV, REQUIRED_GATE_JOBS, TRAILERS,
} from './policy.mjs';

export const LEDGER_PATH = 'agent/implement/decisions/decisions.jsonl';
export const REVIEWERS_PATH = 'agent/implement/decisions/reviewers.json';
export const GRANTS_PATH = 'agent/policy/governance/grants.jsonl';
export const GATE_FILE = 'agent/release/gate.mjs';

const git = (args, cwd, opts = {}) => execFileSync('git', args, { cwd, encoding: opts.buffer ? 'buffer' : 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
const tryGit = (args, cwd) => { try { return git(args, cwd).trim(); } catch { return null; } };
const blobAt = (rev, path, cwd) => { try { return git(['show', `${rev}:${path}`], cwd); } catch { return null; } };
const gitBlobSha = (buf) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const DAY = 86_400_000;

const trailer = (message, name) => new RegExp(`^${name}:[ \\t]*(\\S+)`, 'mi').exec(message)?.[1] ?? null;

/* ============================================================ gathering */

export function walkFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}

/** The commit that first added this gate. Nothing before it is judged: the
 *  rule is not applied backwards to history written without it, the same
 *  choice tools/commit-evidence.mjs made. Found with git, not typed here. */
export function gateCutoff(cwd) {
  const out = tryGit(['log', '--diff-filter=A', '--format=%H', '--', GATE_FILE], cwd);
  const shas = (out ?? '').split('\n').filter(Boolean);
  return shas.length ? shas[shas.length - 1] : null;
}

export function readCommits({ cwd, since, head }) {
  const out = tryGit(['rev-list', '--reverse', '--topo-order', `${since}..${head}`], cwd);
  if (out === null) return null;
  return out.split('\n').filter(Boolean).map((sha) => {
    const meta = git(['show', '-s', '--format=%P%x1f%ct%x1f%an%x1f%B', sha], cwd).split('\x1f');
    const parents = meta[0].trim().split(' ').filter(Boolean);
    const files = parents.length > 1 ? [] : git(['show', '--name-only', '--no-renames', '--format=', sha], cwd).split('\n').filter(Boolean);
    return { sha, parents, committedAt: Number(meta[1]) * 1000, author: meta[2], message: meta.slice(3).join('\x1f'), files };
  });
}

/**
 * Read everything the judge needs. Never throws on a missing thing: an
 * unanswerable question is recorded as `null` so the judge can call it
 * unmeasured rather than fine.
 */
export function gatherFacts({
  root = REPO_ROOT, head = 'HEAD', since = null, env = process.env, artifact = null, needsJson = null,
  ci = false, strictUnledgered = false, now = new Date(),
} = {}) {
  const facts = { root, ci, strictUnledgered, now: now.getTime(), env: {}, head: null, since: null, shallow: null, commits: null, artifact: null };
  for (const k of ['GITHUB_ACTIONS', 'GITHUB_REPOSITORY', 'GITHUB_REF', 'GITHUB_EVENT_NAME', 'GITHUB_WORKFLOW_REF', 'GITHUB_SHA', REGISTRY_PIN_ENV]) facts.env[k] = env[k] ?? null;

  facts.head = tryGit(['rev-parse', '--verify', `${head}^{commit}`], root);
  facts.checkout = tryGit(['rev-parse', 'HEAD'], root);
  facts.shallow = tryGit(['rev-parse', '--is-shallow-repository'], root) === 'true';
  facts.since = since ? tryGit(['rev-parse', '--verify', `${since}^{commit}`], root) : gateCutoff(root);
  facts.sinceIsAncestor = Boolean(facts.since && facts.head && tryGit(['merge-base', '--is-ancestor', facts.since, facts.head], root) !== null);
  facts.commits = facts.head && facts.since && facts.sinceIsAncestor ? readCommits({ cwd: root, since: facts.since, head: facts.head }) : null;

  facts.workflows = auditWorkflows({ root });
  facts.needs = (() => { if (!needsJson) return null; try { return JSON.parse(needsJson); } catch { return { __unparsable: true }; } })();

  facts.ledgerText = facts.head ? blobAt(facts.head, LEDGER_PATH, root) : null;
  facts.registryText = facts.head ? blobAt(facts.head, REVIEWERS_PATH, root) : null;
  facts.grantsText = facts.head ? blobAt(facts.head, GRANTS_PATH, root) : null;
  facts.ledgerAtParent = {};
  facts.ledgerHistory = [];
  for (const c of facts.commits ?? []) {
    const declares = trailer(c.message, TRAILERS.proposal) !== null;
    const touchesLedger = c.files.includes(LEDGER_PATH);
    if (c.parents.length === 1 && (declares || touchesLedger)) {
      facts.ledgerAtParent[c.sha] = blobAt(c.parents[0], LEDGER_PATH, root);
    }
    if (touchesLedger && c.parents.length === 1) {
      facts.ledgerHistory.push({ sha: c.sha, before: facts.ledgerAtParent[c.sha], after: blobAt(c.sha, LEDGER_PATH, root) });
    }
  }

  if (artifact) {
    const files = walkFiles(artifact).map((p) => relative(artifact, p).split(sep).join('/'));
    const tree = new Map();
    if (facts.head) {
      for (const line of (tryGit(['ls-tree', '-r', '--full-tree', facts.head], root) ?? '').split('\n').filter(Boolean)) {
        const m = /^\d+ blob ([0-9a-f]{40})\t(.+)$/.exec(line);
        if (m) tree.set(m[2], m[1]);
      }
    }
    const mismatched = [];
    const hashes = {};
    for (const f of files) {
      if (f === '.nojekyll') continue;
      const buf = readFileSync(join(artifact, f));
      hashes[f] = createHash('sha256').update(buf).digest('hex');
      const expected = tree.get(f);
      if (!expected) mismatched.push(`${f}: not a file of commit ${facts.head?.slice(0, 12) ?? '?'}`);
      else if (gitBlobSha(buf) !== expected) mismatched.push(`${f}: differs from the commit's own copy`);
    }
    const shouldShip = [...tree.keys()].filter((p) => refusal(p) === null);
    const have = new Set(files);
    const missing = shouldShip.filter((p) => !have.has(p));
    const secrets = scanSecrets({ root: artifact, files: files.filter((f) => f !== '.nojekyll') });
    facts.artifact = {
      dir: artifact,
      verify: verifyArtifact(artifact),
      files: files.length,
      mismatched,
      missing,
      secrets: secrets.blocking.map((s) => `${s.path}:${s.line} ${s.pattern}`),
      manifest_sha256: createHash('sha256').update(JSON.stringify(Object.entries(hashes).sort())).digest('hex'),
      tree_sha: facts.head ? tryGit(['rev-parse', `${facts.head}^{tree}`], root) : null,
    };
  }
  return facts;
}

/* ============================================================ judging */

const c = (id, status, why, extra = {}) => ({ id, status, why, ...extra });
export const PASS = 'pass', FAIL = 'fail', UNMEASURED = 'unmeasured', WARN = 'warn', NA = 'not_applicable';

function agentNamesOf() { return [...AGENT_NAMES]; }

/** Every commit in range that declares a Proposal, judged against the ledger. */
export function judgeAgentChanges(facts, ledgerView) {
  const results = [];
  for (const cm of facts.commits ?? []) {
    if (cm.parents.length !== 1) continue;
    const proposalId = trailer(cm.message, TRAILERS.proposal);
    if (!proposalId) continue;
    const published = cm.files.filter((f) => refusal(f) === null);
    const r = { sha: cm.sha, proposal_id: proposalId, files: cm.files, published, problems: [] };
    results.push(r);
    const bad = (why) => r.problems.push(why);

    if (/^autonomy: /m.test(cm.message) && !trailer(cm.message, TRAILERS.approval)) {
      /* a grant-based change: no per-change decision exists, a CATEGORY was
         decided. It must name a grant that the tracked grant ledger holds. */
      const grants = /^Grant\(s\):[ \t]*(.+)$/m.exec(cm.message)?.[1] ?? '';
      const ids = grants.split(';').map((g) => g.trim().split(/\s+/)[0]).filter(Boolean);
      r.kind = 'grant_based';
      if (!ids.length) bad('an autonomy commit names no grant');
      for (const id of ids) if (!(facts.grantsText ?? '').includes(`"grant_id":"${id}"`) && !(facts.grantsText ?? '').includes(`"grant_id": "${id}"`)) bad(`grant ${id} is not in ${GRANTS_PATH}`);
      continue;
    }
    r.kind = 'decision_based';

    const approvalId = trailer(cm.message, TRAILERS.approval);
    const sha = trailer(cm.message, TRAILERS.proposalSha);
    const key = trailer(cm.message, TRAILERS.dispatchKey);
    if (!approvalId) bad('no Approval trailer');
    if (!sha) bad('no Proposal-SHA256 trailer');
    if (!key) bad('no Dispatch-Key trailer');
    if (r.problems.length) continue;

    /* the decision must already be in the ledger the commit's parent had */
    const parentText = facts.ledgerAtParent[cm.sha];
    const inParent = (parentText ?? '').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const precedes = inParent.filter((e) => e.approval_id === approvalId && e.proposal_id === proposalId && e.proposal_sha256 === sha && e.outcome === 'granted');
    if (!precedes.length) { bad(`no granted decision for approval ${approvalId} exists in the ledger as it stood at this commit's parent: an approval has to precede the change it approves`); continue; }

    /* …and it must be a VERIFIED entry of the head ledger */
    const entryInfo = ledgerView.entries.find((e) => e.entry.approval_id === approvalId && e.entry.proposal_id === proposalId && e.entry.proposal_sha256 === sha && e.entry.outcome === 'granted' && e.entry.entry_sha256 === precedes[precedes.length - 1].entry_sha256);
    if (!entryInfo) { bad('the decision this commit cites is not an entry of the ledger at the head'); continue; }
    const e = entryInfo.entry;
    if (e.provenance !== 'human') bad(`the decision's provenance is "${e.provenance}", not "human"`);
    if (!(entryInfo.signed && entryInfo.signature_ok)) bad('the decision is not signed by a registered reviewer');
    if (agentNamesOf().includes(e.decided_by)) bad(`decided_by "${e.decided_by}" is an agent`);
    if (key !== dispatchKey({ approvalId: e.approval_id, proposalSha256: e.proposal_sha256 })) bad('Dispatch-Key does not match this approval and proposal content');

    /* withdrawn: a later denial of the same proposal */
    const later = ledgerView.entries.filter((x) => x.entry.proposal_id === proposalId && x.entry.seq > e.seq);
    const withdrawn = later.find((x) => x.entry.outcome === 'denied');
    if (withdrawn) bad(`the approval was withdrawn: ${withdrawn.entry.decided_by} denied this proposal on ${withdrawn.entry.decided_at}, after granting it`);

    /* scope: the files this commit changed are inside what was approved */
    const scope = permittedFiles(e.proposal_snapshot ?? {});
    const outside = cm.files.filter((f) => !scope.permitted.includes(f));
    if (outside.length) bad(`changes ${outside.length} file(s) outside the approved scope: ${outside.slice(0, 4).join(', ')}`);

    /* time: decided before it was committed, and not long before */
    const decidedAt = Date.parse(e.decided_at);
    if (decidedAt > cm.committedAt + 60_000) bad(`decided ${e.decided_at}, after the commit was made`);
    else if (cm.committedAt - decidedAt > MAX_APPROVAL_AGE_DAYS * DAY) bad(`the approval is stale: decided ${e.decided_at}, ${Math.floor((cm.committedAt - decidedAt) / DAY)} days before the commit (limit ${MAX_APPROVAL_AGE_DAYS})`);
    r.decided_by = e.decided_by; r.decided_role = e.decided_role ?? null; r.approval_id = approvalId; r.proposal_sha256 = sha;
  }
  return results;
}

/**
 * Judge. Pure: reads only `facts`.
 * @returns {{ok:boolean, conditions:object[], blocking:object[], record:object}}
 */
export function judge(facts) {
  const cs = [];
  const ci = Boolean(facts.ci);
  const ncommits = facts.commits?.length ?? 0;

  /* C1 origin */
  const e = facts.env;
  if (e.GITHUB_ACTIONS !== 'true') {
    cs.push(c('C1-origin', ci ? FAIL : UNMEASURED, ci ? 'the gate was told it is in CI and GITHUB_ACTIONS is not "true"' : 'not running in GitHub Actions: the origin of this run is not established. A local run cannot authorise a deployment.'));
  } else {
    const problems = [];
    if ((e.GITHUB_REPOSITORY ?? '').toLowerCase() !== EXPECTED_REPOSITORY.toLowerCase()) problems.push(`repository is ${e.GITHUB_REPOSITORY}, not ${EXPECTED_REPOSITORY}`);
    if (e.GITHUB_REF !== PUBLISH_REF) problems.push(`ref is ${e.GITHUB_REF}, not ${PUBLISH_REF}`);
    if (!PUBLISH_EVENTS.includes(e.GITHUB_EVENT_NAME)) problems.push(`event is ${e.GITHUB_EVENT_NAME}`);
    if (!(e.GITHUB_WORKFLOW_REF ?? '').startsWith(`${e.GITHUB_REPOSITORY}/${PUBLISHING_WORKFLOW}@${PUBLISH_REF}`)) problems.push(`workflow is ${e.GITHUB_WORKFLOW_REF}, not ${PUBLISHING_WORKFLOW}@${PUBLISH_REF}`);
    if (!facts.head || e.GITHUB_SHA !== facts.head) problems.push(`the commit being published (${e.GITHUB_SHA?.slice(0, 12)}) is not the commit judged (${facts.head?.slice(0, 12) ?? 'unresolved'})`);
    if (facts.checkout && facts.head && facts.checkout !== facts.head) problems.push('the checkout is not the commit judged');
    cs.push(c('C1-origin', problems.length ? FAIL : PASS, problems.length ? problems.join('; ') : `${e.GITHUB_REPOSITORY} · ${e.GITHUB_REF} · ${e.GITHUB_EVENT_NAME} · ${PUBLISHING_WORKFLOW}, at ${(facts.head ?? '?').slice(0, 12)}`));
  }

  /* C2 history */
  const histProblems = [];
  if (!facts.head) histProblems.push('the head commit does not resolve');
  if (facts.shallow) histProblems.push('the clone is shallow: commits in range cannot be read, so they cannot be judged');
  if (!facts.since) histProblems.push('the commit that introduced this gate cannot be found (a shallow clone, or the gate file is untracked)');
  else if (!facts.sinceIsAncestor) histProblems.push('the commit that introduced this gate is not an ancestor of the head');
  if (facts.commits === null && !histProblems.length) histProblems.push('git could not list the commits in range');
  cs.push(c('C2-history', histProblems.length ? FAIL : PASS, histProblems.length ? histProblems.join('; ') : `${ncommits} commit(s) since the gate was introduced (${(facts.since ?? '?').slice(0, 12)}), clone is complete`));

  /* C3 publisher */
  const wfFail = facts.workflows.checks.filter((x) => !x.ok);
  cs.push(c('C3-publisher', wfFail.length ? FAIL : PASS, wfFail.length ? wfFail.map((x) => `${x.id}: ${x.why}`).join(' · ') : `${facts.workflows.checks.length} workflow checks pass: ${PUBLISHING_WORKFLOW} is the only publisher and the gate is in its path`, { checks: facts.workflows.checks.length }));

  /* C4 upstream */
  if (facts.needs == null) cs.push(c('C4-upstream', ci ? FAIL : UNMEASURED, 'GitHub\'s `needs` result was not supplied, so whether the gate jobs succeeded is not established here'));
  else if (facts.needs.__unparsable) cs.push(c('C4-upstream', FAIL, 'the `needs` result did not parse'));
  else {
    const want = REQUIRED_GATE_JOBS;
    const missing = want.filter((j) => !(j in facts.needs));
    const notOk = want.filter((j) => j in facts.needs && facts.needs[j]?.result !== 'success');
    cs.push(c('C4-upstream', missing.length || notOk.length ? FAIL : PASS,
      missing.length || notOk.length ? `${[...missing.map((j) => `${j}: not reported`), ...notOk.map((j) => `${j}: ${facts.needs[j]?.result}`)].join('; ')}` : `${want.join(', ')} all reported success`));
  }

  /* C5 ledger — and C10 the pin it depends on */
  const declared = (facts.commits ?? []).filter((x) => x.parents.length === 1 && trailer(x.message, TRAILERS.proposal));
  const decisionBased = declared.filter((x) => !(/^autonomy: /m.test(x.message) && !trailer(x.message, TRAILERS.approval)));
  const reg = parseReviewers(facts.registryText);
  const ledgerView = verifyLedger({ text: facts.ledgerText ?? '', reviewers: reg, requireSignatures: true, allowSimulated: false, agentNames: agentNamesOf(), now: new Date(facts.now) });
  if (facts.ledgerText == null && decisionBased.length === 0) cs.push(c('C5-ledger', NA, 'no decision ledger exists at this commit and no commit in range cites one'));
  else cs.push(c('C5-ledger', ledgerView.ok ? PASS : FAIL, ledgerView.ok ? `${ledgerView.count} entr${ledgerView.count === 1 ? 'y' : 'ies'}; chain intact; ${ledgerView.signed} signed by a registered reviewer; none simulated` : `${ledgerView.problems.length} problem(s): ${ledgerView.problems.slice(0, 4).map((p) => `${p.code}${p.line ? ` (line ${p.line})` : ''}: ${p.why}`).join(' · ')}`, { problems: ledgerView.problems.slice(0, 20) }));

  /* C6 append-only */
  const rewritten = (facts.ledgerHistory ?? []).filter((h) => h.before != null && !(h.after ?? '').startsWith(h.before));
  cs.push(c('C6-append-only', rewritten.length ? FAIL : PASS, rewritten.length ? `commit(s) ${rewritten.map((h) => h.sha.slice(0, 12)).join(', ')} changed a decision recorded earlier: the ledger at the parent is not a prefix of the ledger at the commit` : `${(facts.ledgerHistory ?? []).length} commit(s) touched the ledger; each only appended`));

  /* C7 agent changes */
  const changes = judgeAgentChanges(facts, ledgerView);
  const badChanges = changes.filter((x) => x.problems.length);
  cs.push(c('C7-agent-changes', badChanges.length ? FAIL : changes.length ? PASS : NA,
    badChanges.length ? badChanges.map((x) => `${x.sha.slice(0, 12)} (${x.proposal_id}): ${x.problems.join('; ')}`).join(' · ')
      : changes.length ? `${changes.length} commit(s) declaring a Proposal each trace to an approval that precedes them: ${changes.map((x) => x.kind === 'grant_based' ? `${x.proposal_id} (grant)` : `${x.proposal_id} by ${x.decided_by}`).join(', ')}` : 'no commit in range declares a Proposal',
    { changes }));

  /* C8 unledgered agent-attributed commits */
  const unledgered = (facts.commits ?? []).filter((x) => x.parents.length === 1
    && !trailer(x.message, TRAILERS.proposal)
    && AGENT_COMMIT_MARKERS.some((re) => re.test(x.message))
    && x.files.some((f) => refusal(f) === null));
  cs.push(c('C8-unledgered', unledgered.length ? (facts.strictUnledgered ? FAIL : WARN) : PASS,
    unledgered.length
      ? `${unledgered.length} commit(s) changing the published site carry an agent marker and cite no Proposal, so no ledger decision covers them (${unledgered.slice(0, 5).map((x) => x.sha.slice(0, 12)).join(', ')}${unledgered.length > 5 ? ', …' : ''}). They arrive as human-directed work merged by a person; the gate cannot tell that merge from an unreviewed one — that is branch protection's job (docs/DEPLOYMENT.md §3a). ${facts.strictUnledgered ? 'BLOCKING: --strict-unledgered.' : 'Reported, not blocking.'}`
      : 'no agent-attributed commit changes the published site without citing a Proposal',
    { commits: unledgered.map((x) => x.sha) }));

  /* C9 artifact */
  if (!facts.artifact) cs.push(c('C9-artifact', ci ? FAIL : UNMEASURED, 'no artifact directory was given, so what would be published is not examined'));
  else {
    const a = facts.artifact;
    const problems = [...a.verify.problems, ...a.mismatched.map((m) => m), ...a.missing.map((m) => `${m}: a published file of the commit is missing from the artifact`), ...a.secrets.map((s) => `credential shape ${s}`)];
    cs.push(c('C9-artifact', problems.length ? FAIL : PASS, problems.length ? `${problems.length} problem(s): ${problems.slice(0, 5).join(' · ')}` : `${a.files} file(s): all on the allowlist, each byte-identical to commit ${(facts.head ?? '?').slice(0, 12)}, none missing, no credential shape (manifest ${a.manifest_sha256.slice(0, 12)}…)`, { manifest_sha256: a.manifest_sha256 }));
  }

  /* C10 registry pin */
  const pin = facts.env[REGISTRY_PIN_ENV];
  const actual = registryFingerprintOf(facts.registryText);
  if (decisionBased.length === 0 && !pin) cs.push(c('C10-registry-pin', NA, 'no commit in range relies on a reviewer signature'));
  else if (!pin) cs.push(c('C10-registry-pin', ci ? FAIL : UNMEASURED, `${REGISTRY_PIN_ENV} is not set. Without a fingerprint pinned outside the repository, whoever can edit reviewers.json can register their own key and sign their own approval. The owner sets it (docs/DEPLOYMENT.md §3a); this gate does not say it is set.`));
  else cs.push(c('C10-registry-pin', pin === actual ? PASS : FAIL, pin === actual ? 'reviewers.json matches the fingerprint pinned outside the repository' : `reviewers.json fingerprints to ${actual.slice(0, 12)}…, not the pinned ${pin.slice(0, 12)}…: the registry changed since the owner pinned it`));

  const blocking = cs.filter((x) => x.status === FAIL || (ci && x.status === UNMEASURED));
  return {
    ok: blocking.length === 0,
    conditions: cs,
    blocking,
    record: {
      published_commit: facts.head,
      judged_from: facts.since,
      commits_judged: ncommits,
      tree: facts.artifact?.tree_sha ?? null,
      artifact_manifest_sha256: facts.artifact?.manifest_sha256 ?? null,
      decisions: changes.filter((x) => !x.problems.length).map((x) => ({ commit: x.sha, proposal_id: x.proposal_id, approval_id: x.approval_id ?? null, decided_by: x.decided_by ?? null, decided_role: x.decided_role ?? null, kind: x.kind })),
      ledger_chain_head: ledgerView.chain_head,
      registry_sha256: facts.registryText == null ? null : actual,
      unledgered_agent_commits: unledgered.length,
    },
  };
}

export function runGate(opts = {}) {
  const facts = gatherFacts(opts);
  return { facts, ...judge(facts) };
}
