/* ============================================================
   agent/autonomy/ledger.mjs — every autonomous action, and the way
   back from it

   SESSION 26 step 7: "retain rollback information", and step: "report
   every autonomous action in the control room". This is where both
   land.

   ONE LINE PER ATTEMPT, INCLUDING THE REFUSALS. An autonomy ledger
   that recorded only what happened would answer "what did the machine
   change" and not "what did the machine try", and the second question
   is the one an operator reading a control plane actually has. A
   refusal is a line here with the gate that refused it.

   IT IS RUN STATE, AND THE COMMIT IS THE DURABLE RECORD. The file is
   git-ignored, for the same reason `agent/orchestrator/state/` is:
   this repository publishes its whole tree, and an operational trace
   of what an agent did on a machine is control-plane data. Losing it
   loses history and NO AUTHORITY — the durable record of an
   autonomous change is the commit it made, whose message names the
   grant, the proposal, the policy verdict, the base commit and the
   exact command that undoes it. `git` retains the rollback
   information whether or not this file survives, which is the
   project's own rule: derivation over storage.

   WHAT A LINE HOLDS THAT THE COMMIT DOES NOT. The pre-change sha256
   of every permitted path, taken by `openContext()` before the edit.
   That is what turns "it was reverted" from an assertion into a
   measurement, and it is why `rollback()` re-hashes rather than
   trusting a return code.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const AUTONOMY_ROOT = dirname(fileURLToPath(import.meta.url));
export const ACTION_DIR = join(AUTONOMY_ROOT, 'actions');
export const ACTION_LEDGER = 'actions.jsonl';
export const ACTION_LEDGER_VERSION = 1;

/**
 * The outcomes an autonomous action can reach. Each is a different
 * fact and none collapses into another — in particular `refused` and
 * `reverted` are not the same thing: the first never touched a file,
 * the second did and put it back.
 */
export const ACTION_OUTCOMES = [
  'refused',        // a gate said no before anything was written
  'rehearsed',      // every gate passed; --execute was not given, so nothing was written
  'merged',         // written, checked, and merged into the working branch
  'reverted',       // written, a check or the policy refused it on the measured facts, and it was put back
  'revert_failed',  // put back, and at least one path did not hash back to its pre-change state
  'failed',         // the cycle itself errored
];

export const TERMINAL_BAD = ['reverted', 'revert_failed', 'failed'];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

export function actionId({ proposalId, baseCommit, startedAt }) {
  return `act-${sha256(`${proposalId}|${baseCommit}|${startedAt}`).slice(0, 16)}`;
}

export function actionLedgerPath(dir = ACTION_DIR) { return join(dir, ACTION_LEDGER); }

/** Every action ever attempted, oldest first. A malformed line is
 *  reported rather than skipped. */
export function readActions({ dir = ACTION_DIR } = {}) {
  const file = actionLedgerPath(dir);
  if (!existsSync(file)) {
    return {
      actions: [], malformed: [], path: file, exists: false,
      /* Not "0 actions". The directory is git-ignored per-machine run
         state, so a fresh clone and a CI runner have none — which is
         not the same fact as an autonomy layer that has never done
         anything, and the two are not reported alike. */
      why: 'no autonomous-action ledger exists on this machine. The directory is git-ignored run state, so a fresh clone and a CI runner have none; that is not the same as no autonomous action having been taken.',
    };
  }
  const actions = [];
  const malformed = [];
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const a = JSON.parse(line);
      if (!a.action_id || !a.outcome || !a.proposal_id) {
        malformed.push({ line: i + 1, why: 'an action carries action_id, proposal_id and outcome', raw: line.slice(0, 200) });
        return;
      }
      actions.push(a);
    } catch (e) {
      malformed.push({ line: i + 1, why: `not JSON: ${e.message}`, raw: line.slice(0, 200) });
    }
  });
  return { actions, malformed, path: file, exists: true, why: null };
}

/**
 * Record one attempt.
 *
 * There is no `update` and no way to edit a line. An action that was
 * merged and later reverted by hand is a NEW line, the way a
 * superseding VerificationRecord is a new record — a ledger whose
 * lines can be rewritten is a ledger that can be made to agree with
 * whatever happened next.
 */
export function recordAction(entry, { dir = ACTION_DIR } = {}) {
  if (!ACTION_OUTCOMES.includes(entry.outcome)) {
    throw new Error(`outcome "${entry.outcome}" is not one of ${ACTION_OUTCOMES.join(', ')}. An outcome the ledger cannot read is not an outcome.`);
  }
  const line = { ledger_version: ACTION_LEDGER_VERSION, ...entry, recorded_at: new Date().toISOString() };
  mkdirSync(dir, { recursive: true });
  appendFileSync(actionLedgerPath(dir), `${JSON.stringify(line)}\n`, 'utf8');
  return line;
}

/**
 * The rollback information an action retained, as something a person
 * can execute.
 *
 * Never a boolean and never prose: the same six-element shape
 * `agent/policy/rollback.mjs` requires, plus the commands.
 */
export function rollbackInformation(action) {
  if (!action) return null;
  const paths = action.permitted ?? [];
  return {
    action_id: action.action_id,
    proposal_id: action.proposal_id,
    outcome: action.outcome,
    previous_known_good_state: {
      commit: action.base_commit ?? null,
      branch: action.origin_branch ?? null,
      per_file_sha256: action.before ?? null,
    },
    change_identifier: { proposal_id: action.proposal_id, paths },
    branch_or_commit: {
      isolated_branch: action.isolated_branch ?? null,
      merge_commit: action.merge_commit ?? null,
      base_commit: action.base_commit ?? null,
    },
    procedure: action.merge_commit
      ? [
        `git checkout ${action.origin_branch}`,
        `git revert --no-edit ${action.merge_commit}`,
        `# or, narrower: git checkout ${action.base_commit} -- ${paths.join(' ')}`,
        'node tools/validate.mjs && node tools/i18n-audit.mjs && node tools/design-qa.mjs && node tools/freshness.mjs',
      ]
      : [
        `git checkout ${action.base_commit} -- ${paths.join(' ')}`,
        'node tools/validate.mjs && node tools/i18n-audit.mjs && node tools/design-qa.mjs && node tools/freshness.mjs',
      ],
    execution_mechanism: 'agent/implement/apply.mjs rollback(context), which restores the permitted paths from the recorded commit and re-hashes each one against the sha256 taken before the edit; or the git commands above, by hand.',
    post_rollback_validation: 'every restored path hashes back to the per-file sha256 above, and the four validators return to the recorded baseline in docs/CURRENT-ARCHITECTURE.md §12.',
    /* Said on every one of these, because the ledger file is
       git-ignored and somebody reading a fresh clone needs to know
       the rollback does not depend on it. */
    note: 'The commit is the durable record. Every field above except the per-file hashes is derivable from git alone, and the commit message carries the base commit and the restore command.',
  };
}

/** What the Control Room shows, and what the CLI prints. */
export function summariseActions({ dir = ACTION_DIR } = {}) {
  const { actions, malformed, path, exists, why } = readActions({ dir });
  const byOutcome = {};
  for (const a of actions) byOutcome[a.outcome] = (byOutcome[a.outcome] ?? 0) + 1;
  return {
    path, exists, why,
    counts: {
      total: actions.length,
      by_outcome: byOutcome,
      merged: actions.filter((a) => a.outcome === 'merged').length,
      refused: actions.filter((a) => a.outcome === 'refused').length,
      reverted: actions.filter((a) => TERMINAL_BAD.includes(a.outcome)).length,
      touched_a_file: actions.filter((a) => a.wrote_files === true).length,
    },
    malformed,
    actions,
  };
}
