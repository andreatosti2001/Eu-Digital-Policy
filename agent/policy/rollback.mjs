/* ============================================================
   agent/policy/rollback.mjs — "rollback available" as something a
   machine could actually execute

   SESSION 23: "'Rollback available' MUST be mechanically
   meaningful. Represent enough information to identify: previous
   known-good state; change identifier; branch/commit/PR; rollback
   procedure; responsible execution mechanism; validation required
   after rollback. A boolean field alone is insufficient."

   WHAT WAS THERE BEFORE. `rollback_plan` on every proposal contract
   carries `method`, `steps[]` and `verification`, and
   `agent/implement/preflight.mjs` gate 10 checks that all three are
   present and that the method is not `not_reversible`. That is a
   real check and it is not the same claim: it proves the proposal
   SAYS how it would be undone. It does not prove there is a state
   to go back to.

   THE DIFFERENCE, CONCRETELY. `docs/AUTONOMY-POLICY.md` §4 records
   why it matters here and nowhere else: this repository's
   pre-SESSION-00 history is 47 bulk uploads and deletions, every
   subject is "Add files via upload", and `git blame` on any value
   returns that. So a rollback plan that says "git revert the commit
   that introduced it" names a commit that, for anything older than
   SESSION 00, does not describe a change. The previous known-good
   state has to be a commit somebody recorded on purpose.

   SO THIS MODULE ASKS FOR SIX THINGS AND ANSWERS `unknown` RATHER
   THAN `false` WHERE IT CANNOT SEE ONE. An unknown is not a
   rollback: `mechanical` is true only when all six are present, and
   the engine treats anything else as a failed condition. That is the
   project's own §0.3 rule — null is not unknown and unknown is never
   satisfied — applied to a security property.

   IT NEVER INSPECTS GIT ON ITS OWN INITIATIVE. The change context
   (`agent/implement/apply.mjs openContext`) already records the
   branch, the pre-change commit and a per-file hash of the previous
   state, and it refuses to open on `main` or over a dirty path.
   `assessRollback` reads that context when it is given one and says
   so when it is not, rather than shelling out to git behind the
   caller's back and reporting a state that belongs to a different
   moment.
   ============================================================ */

import { ROLLBACK_METHODS, REQUIRED_VALIDATORS } from '../schemas/types.mjs';

/** The six things SESSION 23 names, each with what would close it. */
export const ROLLBACK_ELEMENTS = [
  ['previous_known_good_state', 'a commit, or a per-file hash of the state before the change, that somebody can restore to. docs/AUTONOMY-POLICY.md §4: the pre-SESSION-00 history has no per-change history to revert to, so this must be a commit recorded on purpose — normally the one agent/implement/apply.mjs openContext() records.'],
  ['change_identifier', 'what is being undone, named: the proposal id and the set of paths the change covered.'],
  ['branch_or_commit', 'the branch the change was made on and the commit it was made from. A rollback that does not name a branch is a rollback somebody has to guess the location of.'],
  ['procedure', 'the executable steps, in order. Prose describing an intention is not a procedure.'],
  ['execution_mechanism', 'what runs the procedure. A named function or command, not "a human would".'],
  ['post_rollback_validation', 'how anybody knows the revert worked. Normally: the four validators return to their pre-change output, plus a re-hash of every restored path.'],
];

export const ROLLBACK_ELEMENT_NAMES = ROLLBACK_ELEMENTS.map(([n]) => n);

const unknown = (name, why) => ({ element: name, state: 'unknown', why, closes: ROLLBACK_ELEMENTS.find(([n]) => n === name)[1] });
const present = (name, why, value = null) => ({ element: name, state: 'present', why, value });
const absent = (name, why) => ({ element: name, state: 'absent', why, closes: ROLLBACK_ELEMENTS.find(([n]) => n === name)[1] });

/**
 * Is there a rollback, mechanically?
 *
 * @param {{proposal:object|null, context:object|null, permitted?:string[]}} args
 * @returns {{mechanical:boolean, elements:object[], missing:string[], plan:object|null, why:string}}
 */
export function assessRollback({ proposal = null, context = null, permitted = null } = {}) {
  const plan = proposal?.rollback_plan ?? null;
  const paths = permitted ?? context?.permitted ?? null;
  const elements = [];

  /* 1 · the previous known-good state */
  if (context?.commit && context?.before && Object.keys(context.before).length) {
    const hashed = Object.entries(context.before).filter(([, b]) => b.sha256 || b.exists === false).length;
    elements.push(present('previous_known_good_state', `commit ${String(context.commit).slice(0, 12)}, with the pre-change state of ${hashed} path(s) hashed by openContext(). A restore can be checked rather than asserted.`, { commit: context.commit, paths: Object.keys(context.before) }));
  } else if (context?.commit) {
    elements.push(unknown('previous_known_good_state', `the context names commit ${String(context.commit).slice(0, 12)} but carries no per-file pre-change state, so "the revert worked" could only be asserted, not measured.`));
  } else {
    elements.push(unknown('previous_known_good_state', 'no change context was opened, so nothing here knows what the tree looked like before. A rollback plan written in a proposal describes an intention; the state it would return to is a fact about a moment, and no moment has been recorded.'));
  }

  /* 2 · the change identifier */
  const pid = proposal?.proposal_id ?? proposal?.change_id ?? null;
  if (pid && paths?.length) elements.push(present('change_identifier', `proposal "${pid}" over ${paths.length} path(s)`, { proposal_id: pid, paths }));
  else if (pid) elements.push(unknown('change_identifier', `proposal "${pid}" is named but no path set is known, so what would be restored is undetermined.`));
  else elements.push(absent('change_identifier', 'nothing names what is being undone.'));

  /* 3 · branch and commit */
  if (context?.branch && context?.commit) {
    elements.push(context.branch === 'main'
      ? absent('branch_or_commit', 'the context is on "main". openContext() refuses to open one there, and a rollback on main is a rollback of the published site rather than of a change.')
      : present('branch_or_commit', `branch "${context.branch}" at ${String(context.commit).slice(0, 12)}`, { branch: context.branch, commit: context.commit }));
  } else {
    elements.push(unknown('branch_or_commit', 'no branch and commit are known. docs/AUTONOMY-POLICY.md §4: the rollback path for any agent change is the agent\'s own branch and its own commits.'));
  }

  /* 4 · the procedure */
  const steps = plan?.steps ?? [];
  if (plan?.method && ROLLBACK_METHODS.includes(plan.method) && plan.method !== 'not_reversible' && steps.length) {
    elements.push(present('procedure', `${plan.method}, ${steps.length} step(s)`, { method: plan.method, steps }));
  } else if (plan?.method === 'not_reversible') {
    elements.push(absent('procedure', `the proposal's own plan is "not_reversible"${plan.irreversible_reason ? `: ${plan.irreversible_reason}` : ''}. An irreversible act is not automatable at any risk level.`));
  } else {
    elements.push(absent('procedure', `rollback_plan.method=${plan?.method ?? 'null'}, ${steps.length} step(s). A method with no steps is a label.`));
  }

  /* 5 · the execution mechanism. Named rather than inferred: the one
     that exists in this repository is apply.mjs rollback(), and a
     plan that names a different one has to say what it is. */
  if (context?.rollback?.method || context?.rollback?.command) {
    elements.push(present('execution_mechanism', `agent/implement/apply.mjs rollback(context) — "${context.rollback.method ?? context.rollback.command}". It restores the permitted paths from the recorded commit and re-hashes each one against its pre-change state.`, context.rollback));
  } else if (plan?.executor) {
    elements.push(present('execution_mechanism', String(plan.executor).slice(0, 200), { executor: plan.executor }));
  } else {
    elements.push(unknown('execution_mechanism', 'no component is named as the thing that would run the procedure. "Somebody reverts it" is not a mechanism, and an autonomous change whose undo needs a person is not autonomous.'));
  }

  /* 6 · post-rollback validation */
  const v = plan?.verification ?? null;
  const namesValidators = typeof v === 'string' && REQUIRED_VALIDATORS.some((x) => v.includes(x.replace('tools/', '')));
  if (v && (namesValidators || context?.before)) {
    elements.push(present('post_rollback_validation', `${String(v).slice(0, 240)}${context?.before ? ' — and every restored path is re-hashed against the state openContext() recorded, so this is measured rather than claimed.' : ''}`, { verification: v }));
  } else if (v) {
    elements.push(unknown('post_rollback_validation', `the plan states "${String(v).slice(0, 160)}" and names none of the four validators, and no pre-change hashes exist to compare against. VERIFICATION-POLICY §3: a passing validator is not a verification, and an unmeasured revert is not a revert.`));
  } else {
    elements.push(absent('post_rollback_validation', 'the plan says nothing about how anybody would know the revert worked.'));
  }

  const missing = elements.filter((e) => e.state !== 'present').map((e) => e.element);
  return {
    mechanical: missing.length === 0,
    elements,
    missing,
    plan,
    why: missing.length === 0
      ? `all six elements are present: a recorded pre-change state on ${context.branch} at ${String(context.commit).slice(0, 12)}, a named procedure, a named executor, and a post-rollback check that compares hashes rather than trusting a return code.`
      : `${missing.length} of six element(s) are not present: ${missing.join(', ')}. SESSION 23: a boolean field alone is insufficient, and an unknown is not a rollback.`,
  };
}
