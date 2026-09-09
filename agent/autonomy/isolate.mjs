/* ============================================================
   agent/autonomy/isolate.mjs — the git half of steps 1 and 6

   SESSION 26 step 1 is "create branch / isolated change" and step 6
   is "merge only if all policy conditions pass". Those are the two
   places this system touches git with intent, and they are separated
   into four named functions here for one reason: THEY ARE THE PART
   THAT CAN LEAVE A REPOSITORY IN A STATE NOBODY ASKED FOR.

   Everything else in `agent/autonomy/` can be exercised against
   fixtures and temporary directories. Cutting a branch, committing on
   it, merging it back and abandoning it cannot — a test that mocked
   git would prove that the mock works. So these four are small,
   ordinary, and the suite drives them against a REAL temporary git
   repository created with `git init`.

   FOUR PROPERTIES, EACH OF WHICH IS A REFUSAL RATHER THAN A HABIT.

   1 · IT REFUSES `main`. A push to `main` publishes to the live site
       and there is no deploy gate. `openContext()` refuses it too;
       this refuses one layer earlier, before a branch is cut, so a
       run on `main` never gets as far as having something to undo.

   2 · IT STAGES WHAT CHANGED, NOT THE TREE. `git add -A` would sweep
       up anything else in the working tree into an autonomous
       commit. Every function here names its paths.

   3 · IT NEVER REWRITES HISTORY. No rebase, no amend, no
       force-push, and no push at all. `mergeBack` is `--no-ff`, so
       the merge commit is a visible record that an autonomous change
       happened rather than a fast-forward nobody can see.

   4 · `abandon` IS SAFE TO CALL TWICE, AND FROM ANYWHERE. It returns
       to the branch it was told to return to and deletes the
       isolated branch if it exists. It does not `git checkout -- .`:
       that would discard uncommitted work this run never touched.
       Undoing the EDIT is `agent/implement/apply.mjs rollback()`,
       which restores the permitted paths and re-hashes them.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from '../implement/baseline.mjs';

export class IsolationRefused extends Error {
  constructor(message, detail = {}) { super(message); this.detail = detail; }
}

/** Never a branch an autonomous change may work on. `main` publishes;
 *  a detached HEAD has no branch to merge back into. */
export const FORBIDDEN_BRANCHES = Object.freeze(['main', 'master', 'HEAD']);

export const git = (args, cwd = REPO_ROOT) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

export const currentBranch = (cwd = REPO_ROOT) => git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
export const currentCommit = (cwd = REPO_ROOT) => git(['rev-parse', 'HEAD'], cwd);

export function branchExists(name, cwd = REPO_ROOT) {
  try { git(['rev-parse', '--verify', '--quiet', `refs/heads/${name}`], cwd); return true; }
  catch { return false; }
}

/**
 * Step 1 · cut the isolated branch.
 *
 * @returns {{origin_branch:string, isolated_branch:string, base_commit:string}}
 */
export function cutBranch({ name, cwd = REPO_ROOT } = {}) {
  const origin = currentBranch(cwd);
  if (FORBIDDEN_BRANCHES.includes(origin)) {
    throw new IsolationRefused(
      `the working tree is on "${origin}". A push to main publishes to the live site and there is no deploy gate, and a detached HEAD has no branch to merge back into — docs/AUTONOMY-POLICY.md Class D. No autonomous change is made from here.`,
      { origin_branch: origin },
    );
  }
  if (branchExists(name, cwd)) {
    throw new IsolationRefused(
      `branch "${name}" already exists. An action id is derived from the proposal, the base commit and the moment the run started, so a collision means a previous run of this exact action did not clean up — that is a state to look at rather than to write over.`,
      { isolated_branch: name },
    );
  }
  const base = currentCommit(cwd);
  git(['checkout', '-b', name], cwd);
  return { origin_branch: origin, isolated_branch: name, base_commit: base };
}

/**
 * Step 6a · commit the change on the isolated branch.
 *
 * Returns `null` where nothing was staged. That is not a failure: it
 * is a proposal whose applied content was byte-identical to what was
 * already there, and a commit that changes nothing is not a record of
 * a change.
 */
export function commitChange({ paths, message, cwd = REPO_ROOT } = {}) {
  if (!paths?.length) return null;
  git(['add', '--', ...paths], cwd);
  const staged = git(['diff', '--cached', '--name-only'], cwd).split('\n').filter(Boolean);
  if (!staged.length) return null;
  git(['commit', '-m', message], cwd);
  return { commit: currentCommit(cwd), staged };
}

/**
 * Step 6b · merge back into the branch the run started on.
 *
 * `--no-ff` deliberately: a fast-forward would leave no record that
 * an autonomous change happened as one unit, and the merge commit is
 * what `git revert` takes as its argument.
 *
 * It merges into the ORIGIN branch and nowhere else. There is no
 * `target` parameter, so there is no argument through which a caller
 * could name `main`.
 */
export function mergeBack({ originBranch, isolatedBranch, actionId, proposalId, cwd = REPO_ROOT } = {}) {
  if (FORBIDDEN_BRANCHES.includes(originBranch)) {
    throw new IsolationRefused(`refusing to merge into "${originBranch}".`, { originBranch });
  }
  git(['checkout', originBranch], cwd);
  git(['merge', '--no-ff', '-m', `autonomy: merge ${actionId} (${proposalId})`, isolatedBranch], cwd);
  const merge = currentCommit(cwd);
  git(['branch', '-d', isolatedBranch], cwd);
  return { merge_commit: merge, merged_into: originBranch };
}

/**
 * Abandon the isolated branch and go back.
 *
 * Safe to call twice, and safe to call when the branch was never cut.
 * It does NOT discard working-tree changes: undoing the edit is
 * `rollback()`'s job, and `git checkout -- .` here would throw away
 * uncommitted work this run never touched.
 */
export function abandon({ originBranch, isolatedBranch, cwd = REPO_ROOT } = {}) {
  const out = { returned_to: null, deleted: false, problems: [] };
  try {
    if (currentBranch(cwd) !== originBranch) git(['checkout', originBranch], cwd);
    out.returned_to = currentBranch(cwd);
  } catch (e) { out.problems.push(`could not return to "${originBranch}": ${e.message}`); }
  if (isolatedBranch && branchExists(isolatedBranch, cwd)) {
    try { git(['branch', '-D', isolatedBranch], cwd); out.deleted = true; }
    catch (e) { out.problems.push(`could not delete "${isolatedBranch}": ${e.message}`); }
  }
  return out;
}
