/* ============================================================
   agent/implement/scope.mjs — an approval authorises the exact
   scope it was given, and nothing beside it

   SESSION 18's APPROVAL BOUNDARY, as code: "An approved proposal
   authorises only the exact scope defined by the proposal. Approval
   MUST NOT authorise unrelated file modifications, broader
   architectural changes, legal interpretation, analytical rewriting,
   schema changes not included in the proposal, or production
   deployment."

   TWO SEPARATE JOBS, and keeping them apart is the point.

   1 · DERIVE the permitted set. It is read off the proposal — from
       the operations' targets and from the affected entities' paths —
       and never supplied to this agent as an argument. A permitted
       set the caller can pass in is a permitted set the caller can
       widen, and the caller is the thing being constrained.

   2 · ENFORCE it against the working tree, afterwards, the way
       `agent/scout/schedule/guard.mjs` does: by asking git what
       actually changed rather than by trusting the code that just
       ran. An allowlist, not a denylist — a denylist protects what
       somebody remembered to name.

   THE FILES THAT ARE NEVER IN SCOPE, whatever a proposal says.
   `docs/AUTONOMY-POLICY.md` lists actions that are Class D under
   every circumstance, and a proposal cannot promote itself past them
   by naming a file. The two one-shot patch scripts are the sharpest
   case: `_refsweep.mjs` re-dates 106 records to August 2026 on any
   run, and an agent that executed it because a proposal's operations
   named it would silently revert every verification since.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from './baseline.mjs';

/**
 * Never writable by this agent, with the reason. Matched as a prefix
 * against a repository-relative path.
 *
 * This is not a restatement of the red tier — red-tier work can be
 * PROPOSED and then approved by a human, and a human-approved
 * red-tier change is exactly what `docs/AI-SAFE-BOUNDARIES.md` §3
 * contemplates. This list is narrower and stronger: things an
 * approval cannot authorise this agent to do, because doing them
 * mechanically is the harm.
 */
export const NEVER_WRITABLE = [
  ['tools/_refsweep.mjs', 'Class D and destructive on execution: it hardcodes SWEEP = 2026-08-28 and overwrites last_verified and verification_note across data/sources.json and data/claims.json, deleting reference_gap where its patch entry has no gap. Editing it is how it gets run. docs/AUTONOMY-POLICY.md §3, AUDIT F-03.'],
  ['tools/_review10.mjs', 'Class D: unguarded split/join replacement across the whole of index.html including the inlined __CONTENT__ index, with NOT FOUND logged rather than raised. docs/AUTONOMY-POLICY.md §3.'],
  ['agent/implement/decisions/', 'the approval ledger. An implementation agent that can write its own approvals is not governed by them.'],
  ['agent/schemas/', 'the inter-agent contracts. "No agent may bypass these contracts" is agent/schemas/gateway.mjs; an agent that can edit the gate has bypassed it.'],
  ['.git/', 'the repository\'s own history.'],
  ['.github/workflows/', 'the workflow definitions decide what runs with a write token. Changing one is a permission change, and a permission change is not an implementation detail.'],
];

/** Paths whose modification means the LEGAL RECORD moved, and which
 *  therefore require an approval on the ChangeRecord whatever the
 *  proposal says (agent/schemas/contracts/change-record.mjs enforces
 *  the same thing from the other side). */
export const LEGAL_RECORD_PATHS = [
  'data/',
  'index.html',       // the brief's prose, and the inlined __CONTENT__ copy of it
  'i18n/',            // what the it/fr/es editions assert
  'js/format.js',     // TIER_GRADE — the evidence grading rules
  'js/pipeline.js',   // the enforcement pipeline derivation
  'js/applies.js',    // the applicability outcome ladder
];

/** Paths a change to which requires the browser suite, because the
 *  four validators read files and cannot see a rendered page.
 *  SESSION 18 requirement 7 hangs off this list. */
export const BROWSER_QA_REQUIRED_PATHS = [
  'js/', 'css/', 'style.css', 'app.js', 'i18n/', '.html',
];

/**
 * The permitted set, derived from the proposal alone.
 *
 * @param {object} proposal
 * @returns {{permitted:string[], sources:object[], refusals:object[]}}
 */
export function permittedFiles(proposal) {
  const sources = [];
  const add = (path, from) => {
    if (!path || typeof path !== 'string') return;
    const p = path.replace(/^\.?\//, '').split('#')[0].trim();
    if (!p || p.includes('://')) return;
    /* An operation target may be a path, an id, or a dotted field —
       `proposed_change.operations[].target` is documented as all
       three. Only something that looks like a repository path is
       taken as a file. */
    if (!/^[A-Za-z0-9_.@/-]+\.[A-Za-z0-9]+$/.test(p) && !p.endsWith('/')) return;
    sources.push({ path: p, from });
  };

  for (const e of proposal.affected_entities ?? []) add(e.path, `affected_entities (${e.kind}${e.id ? ` ${e.id}` : ''})`);
  for (const op of proposal.proposed_change?.operations ?? []) add(op.target, `operation ${op.op}`);
  /* ImplementationProposal names them outright. */
  for (const f of proposal.files ?? []) add(f, 'files');
  for (const m of proposal.modules ?? []) add(m, 'modules');

  const permitted = [...new Set(sources.map((s) => s.path))].sort();
  const refusals = [];
  for (const p of permitted) {
    const hit = NEVER_WRITABLE.find(([prefix]) => p === prefix || p.startsWith(prefix));
    if (hit) refusals.push({ path: p, why: hit[1] });
  }
  return { permitted, sources, refusals };
}

/** True where a change to any permitted path moves the legal record. */
export function touchesLegalRecord(paths) {
  return paths.filter((p) => LEGAL_RECORD_PATHS.some((l) => p === l || p.startsWith(l)));
}

/** True where the four validators cannot see what changed. */
export function requiresBrowserQA(paths) {
  return paths.filter((p) => BROWSER_QA_REQUIRED_PATHS.some((b) => p.startsWith(b) || p.endsWith(b)));
}

/* ---------------------------------------------------------- enforcement */

/** What git says actually changed, including untracked files. The
 *  same shape as agent/scout/schedule/guard.mjs, and for the same
 *  reason: an allowlist checked against the tree, not against the
 *  code that just ran. */
export function changedPaths({ cwd = REPO_ROOT } = {}) {
  const out = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd, encoding: 'utf8' });
  const paths = [];
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    let p = line.slice(3).trim();
    const arrow = p.indexOf(' -> ');
    if (arrow !== -1) { paths.push(p.slice(0, arrow).replace(/^"|"$/g, '')); p = p.slice(arrow + 4); }
    paths.push(p.replace(/^"|"$/g, ''));
  }
  return [...new Set(paths)];
}

/**
 * Did this change stay inside what was approved?
 *
 * `baseline` is the set of paths that were already dirty before the
 * agent touched anything — a pre-existing edit must not be reported
 * as scope creep, and an agent must not be able to hide inside one.
 * Both halves matter, which is why they are separated in the result
 * rather than subtracted.
 */
export function enforceScope({ permitted, before = [], after = null, cwd = REPO_ROOT } = {}) {
  const now = after ?? changedPaths({ cwd });
  const allowed = new Set(permitted);
  const preexisting = new Set(before);

  const isAllowed = (p) => allowed.has(p) || [...allowed].some((a) => a.endsWith('/') && p.startsWith(a));

  const outside = now.filter((p) => !isAllowed(p) && !preexisting.has(p));
  const inheritedDirt = now.filter((p) => !isAllowed(p) && preexisting.has(p));
  const touched = now.filter((p) => isAllowed(p));

  return {
    ok: outside.length === 0,
    touched,
    outside: outside.map((p) => ({ path: p, why: explainOutside(p) })),
    inherited_dirt: inheritedDirt,
    permitted: [...allowed],
  };
}

export function explainOutside(path) {
  const never = NEVER_WRITABLE.find(([prefix]) => path === prefix || path.startsWith(prefix));
  if (never) return never[1];
  const legal = LEGAL_RECORD_PATHS.find((l) => path === l || path.startsWith(l));
  if (legal) return `${legal} is the legal record — what the site tells a reader about EU law. It is not in the approved scope, and an approval for something else does not reach it.`;
  return 'outside the approved scope. An approval authorises the exact scope defined by the proposal and nothing beside it.';
}
