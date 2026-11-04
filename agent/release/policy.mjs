/* ============================================================
   agent/release/policy.mjs — the release policy, as data, in one place

   Every number and name the dispatcher and the deploy gate decide by is here
   and nowhere else, so that "what does the gate require?" has one answer and
   a test can fail when it changes. NONE OF THIS IS A SECRET AND NONE OF IT IS
   TRUSTED MORE THAN THE REPOSITORY IS: whoever can edit this file can edit
   the workflow that runs it. That limit is real and docs/DEPLOYMENT.md §3a
   names the settings outside the tree that close it (branch protection on
   `.github/` and `agent/release/`, the `github-pages` environment's branch
   rule, a pinned reviewer registry). The code enforces; the settings protect
   the code.
   ============================================================ */

/** The repository the publishing workflow must be running in. A fork or a
 *  copy of this workflow run elsewhere is not an authorised publisher. */
export const EXPECTED_REPOSITORY = 'andreatosti2001/Eu-Digital-Policy';

/** The one workflow allowed to publish, and the ref it must run from. */
export const PUBLISHING_WORKFLOW = '.github/workflows/pages.yml';
export const PUBLISH_REF = 'refs/heads/main';
export const PUBLISH_EVENTS = Object.freeze(['push', 'workflow_dispatch']);

/** The jobs that must succeed before `build` may run. `build` asserts the
 *  same list against GitHub's own `needs` context at run time. */
export const REQUIRED_GATE_JOBS = Object.freeze(['gate-data', 'gate-boundary', 'gate-browser', 'gate-security']);
export const BUILD_JOB = 'build';
export const DEPLOY_JOB = 'deploy';
export const DEPLOY_ENVIRONMENT = 'github-pages';

/** The command `build` must run, before it uploads, for the gate to be in the
 *  publishing path rather than beside it. */
export const GATE_COMMAND = 'agent/release/cli.mjs gate';

/** An approval older than this at the moment the change was committed is
 *  stale. A starting policy, not a legal finding: the author may change it,
 *  and the change is one line here plus its test. */
export const MAX_APPROVAL_AGE_DAYS = 30;

/** Where the pinned reviewer-registry fingerprint is read from in CI. It is a
 *  repository VARIABLE (Settings → Secrets and variables → Actions →
 *  Variables), set by the owner and not by this tree. */
export const REGISTRY_PIN_ENV = 'RELEASE_REVIEWER_REGISTRY_SHA256';

/** Trailers a dispatched change commit carries. `Dispatch-Key` is the
 *  idempotency key: the same approved proposal yields the same key, so a
 *  second execution finds the first by `git log --grep`. */
export const TRAILERS = Object.freeze({
  proposal: 'Proposal',
  proposalSha: 'Proposal-SHA256',
  approval: 'Approval',
  dispatchKey: 'Dispatch-Key',
});

/** Strings that mark a commit as authored with an agent's help. A marker, not
 *  an authentication: its absence proves nothing, and the gate says so. */
export const AGENT_COMMIT_MARKERS = Object.freeze([
  /^Co-Authored-By:.*(?:anthropic\.com|Claude)/im,
  /^Claude-Session:/im,
  /^autonomy: /m,
]);

/** Where the release dispatcher keeps its run log. Git-ignored run state,
 *  like every other agent's; the commit it makes is the durable record. */
export const RUN_LOG_DIR = 'agent/release/runs';
