/* ============================================================
   agent/autonomy/cycle.mjs — limited autonomy, as seven steps that
   either all happen or none of them stays

   SESSION 26 names the sequence and this module is it, in order:

     1 · create branch / isolated change context
     2 · implement
     3 · run validators
     4 · run browser tests where applicable
     5 · record full observation trace
     6 · merge ONLY if all policy conditions pass
     7 · retain rollback information

   WHAT IS NEW HERE, AND WHAT IS NOT. Steps 2, 3, 4, 5 and 7 already
   existed: `agent/implement/` opens a change context, applies exactly,
   runs the four validators and the agent suites, emits a trace and
   reverts itself when the checks come back worse than the baseline.
   What it could not do is reach the automatic route at all, because
   `preflight` gate 3 requires a grant in the decision ledger and no
   grant exists for a change nobody asked a person about. SESSION 18's
   own header anticipated the case — "the approval is attributable to
   an authorized human OR AN EXPLICITLY PERMITTED AUTONOMY POLICY" —
   and left the second half unbuilt because no policy permitted
   anything.

   THE SUBSTITUTION IS EXPLICIT, NARROW, AND IT IS THE ONLY ONE.
   `preflight` is not modified and not weakened. This cycle runs all
   ten gates and accepts exactly two of them failing — `approved` and
   `approval_attributable` — and ONLY when the policy in force
   independently routes the act `automatic` under a governance grant
   that names the category, the paths and the fields. Every other gate
   must pass. A reader who wants to know what autonomy bought can read
   that sentence: two gates, replaced by a grant a person wrote.

   IT IS NOT A SECOND IMPLEMENTATION OF THE IMPLEMENTER. The change
   context, the exact-match edit, the checks, the scope enforcement and
   the rollback are `agent/implement/`'s functions, called. Writing a
   second one would be `docs/DATA-GOVERNANCE.md` §5's forbidden second
   home for the fact of how a change is made — and the second copy is
   the one that would quietly stop reverting.

   ISOLATION IS A REAL BRANCH. Step 1 says "branch / isolated change".
   `--execute` cuts `autonomy/<action-id>` from the working branch,
   applies there, commits there, and merges back with `--no-ff` only
   after step 6. A failure never reaches the working branch at all:
   the branch is deleted and the tree is checked back out. It refuses
   to start on `main` — a push to `main` publishes and there is no
   deploy gate.

   MERGE MEANS INTO THE SESSION BRANCH. It does not mean `main`, it
   does not mean a push, and it does not mean deployment. Nothing in
   this repository deploys; GitHub Pages publishes `main` when
   somebody pushes it, and that is Class D under
   `docs/AUTONOMY-POLICY.md` for a person to do deliberately.
   ============================================================ */

import { REPO_ROOT } from '../implement/baseline.mjs';
import { preflight } from '../implement/preflight.mjs';
import { readAgentRecords, readLedger, surveyProposals } from '../implement/ledger.mjs';
import { openContext, applyProposal, rollback, diffSummary, ApplyRefused } from '../implement/apply.mjs';
import { changedPaths, enforceScope, touchesLegalRecord, requiresBrowserQA, LEGAL_RECORD_PATHS } from '../implement/scope.mjs';
import {
  runValidators, runAgentSuites, runContractCheck, runBrowserCheck, runBoundaryCheck,
  verdictFor, blockingFindings,
} from '../implement/checks.mjs';
import { evaluate as evaluatePolicy } from '../policy/engine.mjs';
import { policyInForce, fieldsPermitted, governanceSelfCheck } from '../policy/governance.mjs';
import { deriveFacts } from './facts.mjs';
import {
  cutBranch, commitChange, mergeBack, abandon, currentBranch, currentCommit,
  FORBIDDEN_BRANCHES, IsolationRefused,
} from './isolate.mjs';
import { ACTION_DIR, actionId, recordAction, rollbackInformation } from './ledger.mjs';

export const AUTONOMY_ACTOR = 'autonomy-runner';

/** The seven steps, as data, so a report can walk them rather than
 *  restate them and so the suite can assert every one ran. */
export const CYCLE_STEPS = Object.freeze([
  Object.freeze({ step: 1, id: 'isolate', what: 'create an isolated change context: a branch cut from the working branch, plus the pre-change commit and a per-file sha256 of every permitted path.' }),
  Object.freeze({ step: 2, id: 'implement', what: 'apply the proposal\'s operations, each only where its quoted "current" occurs exactly once.' }),
  Object.freeze({ step: 3, id: 'validators', what: 'run the four validators against the recorded baseline, plus the agent suites and the contract check where the change touches agent/ or tools/.' }),
  Object.freeze({ step: 4, id: 'browser', what: 'run the browser suite where the change touches a page, a stylesheet, a module or a locale. A required run that did not happen is a blocking finding, never a pass.' }),
  Object.freeze({ step: 5, id: 'trace', what: 'record every stage on the observability trace: the gates, the policy route before and after, the checks, the scope enforcement and the outcome.' }),
  Object.freeze({ step: 6, id: 'merge', what: 'merge into the working branch only if every mandatory condition is satisfied on the MEASURED facts, the scope held, and the checks passed. Otherwise revert and delete the branch.' }),
  Object.freeze({ step: 7, id: 'rollback', what: 'retain the rollback information: the base commit, the branch, the per-file pre-change hashes, the executable procedure and how a revert is confirmed.' }),
]);

/** The two preflight gates a governance grant may stand in for, and
 *  nothing else. Named as a constant so the suite can assert the list
 *  has not grown. */
export const GATES_REPLACED_BY_GRANT = Object.freeze(['approved', 'approval_attributable']);

/** The conditions that are measurements, and are therefore allowed to
 *  be `unknown` in the BEFORE evaluation. Any other unknown, and any
 *  failure at all, refuses the act before a file is touched.
 *
 *  `rollback_mechanical` JOINED THIS LIST IN SESSION 27, under an
 *  explicit warrant from the repository author, quoted with its date
 *  in `docs/CONTINUOUS-IMPROVEMENT.md` §4a. That warrant is NOT
 *  recorded as a governance grant, and the difference is the point: a
 *  grant is read at runtime by `policyInForce()` and so needs a
 *  ledger, while this is a change to code, which `git blame` now
 *  attributes — SESSION 00 onward is the first real provenance this
 *  repository has (AUDIT F-06). A second ledger nothing reads would
 *  be ceremony, not accountability. It belongs here for the
 *  same reason the other four do and always did: four of its six
 *  elements read the change context `agent/implement/apply.mjs
 *  openContext()` records in STEP 2, and this gate runs before STEP
 *  1. Its absence from this list was not a stricter policy — it was
 *  a gate asking a question that could not be answered yet, and
 *  reading the non-answer as a failure. Measured: with it missing,
 *  five of the six gates passed for a flawless proposal in an enabled
 *  category over a granted path and the sixth refused every proposal
 *  that has ever existed. `docs/CONTINUOUS-IMPROVEMENT.md` §4.
 *
 *  THE CHECK DID NOT MOVE, IT STOPPED BEING PRE-EMPTED. Step 6
 *  evaluates the same condition with `facts.context` supplied by the
 *  real run, and `mayMerge` requires route `automatic`, which
 *  requires every mandatory condition SATISFIED. An unknown there
 *  still refuses. `agent/autonomy/selftest.mjs` tests 13b and 13c
 *  hold both halves: the pre-run tolerance, and the step-6 refusal
 *  of a rollback that is genuinely not mechanical. */
export const MEASURED_CONDITIONS = Object.freeze([
  'verification_succeeded', 'no_unresolved_conflict', 'validators_pass', 'browser_qa',
  'rollback_mechanical',
]);


const pass = (gate, why, data = {}) => ({ gate, ok: true, why, ...data });
const fail = (gate, why, closes, data = {}) => ({ gate, ok: false, why, closes, ...data });

/* ============================================================
   THE GATES BEFORE ANYTHING IS WRITTEN
   ============================================================ */

/**
 * Six gates, all evaluated, always. Stopping at the first is cheaper
 * and produces a worse report — the same reasoning
 * `agent/implement/preflight.mjs` records about its ten.
 *
 * @returns {{ok:boolean, gates:object[], failed:object[], pre:object,
 *            policy:object, decision:object, fields:object}}
 */
export function autonomyGates({ proposalId, policy, governance, records, ledger }) {
  const gates = [];
  const pre = preflight(proposalId, { records, ledger });
  const proposal = pre.proposal;

  /* 1 · a governance grant exists, and the module's own two lists
        still agree with each other. */
  const self = governanceSelfCheck();
  gates.push(governance.active.length && self.ok
    ? pass('governance_grant', `${governance.active.length} governance grant(s) in force: ${governance.active.map((g) => `${g.grant_id} by ${g.decided_by} until ${g.expires_at}`).join('; ')}`, { grants: governance.active.map((g) => g.grant_id) })
    : fail('governance_grant',
      !self.ok
        ? `agent/policy/governance.mjs is internally inconsistent: ${self.problems.join(' · ')}`
        : `no governance grant is in force${governance.inactive.length ? `; ${governance.inactive.length} recorded grant(s) are not: ${governance.inactive.map((i) => `${i.grant.grant_id} (${i.state})`).join(', ')}` : ''}.`,
      'a person records one: node agent/policy/cli.mjs grant --by "<name>" --categories … --paths … --fields … --until <date>. Protocol §24 reserves the decision, and an expired grant enables nothing.',
      { inactive: governance.inactive.map((i) => ({ grant_id: i.grant.grant_id, state: i.state, why: i.why })) }));

  if (!proposal) {
    gates.push(fail('preflight_less_approval', pre.summary, 'the proposal has to exist as a record. An id in a prompt is not a proposal.'));
    return assemble(proposalId, gates, pre, null, null, null);
  }

  /* 2 · every preflight gate except the two a grant stands in for. */
  const otherFailures = pre.failed.filter((g) => !GATES_REPLACED_BY_GRANT.includes(g.gate));
  gates.push(otherFailures.length === 0
    ? pass('preflight_less_approval', `${pre.gates.length - pre.failed.length} of ${pre.gates.length} preflight gate(s) pass; the only failures are ${pre.failed.map((g) => g.gate).join(', ') || 'none'}, which a governance grant may stand in for.`, { replaced: pre.failed.map((g) => g.gate) })
    : fail('preflight_less_approval', `${otherFailures.length} preflight gate(s) refuse this and no grant may stand in for any of them: ${otherFailures.map((g) => `${g.gate} (${g.why})`).join(' · ')}`,
      'these are closed by the agent that owns the proposal. A grant replaces the APPROVAL, not the paperwork the approval would have been given against.',
      { failed: otherFailures.map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })) }));

  /* 3 · the policy route, evaluated before anything is measured. The
        measurements are allowed to be unknown here — that is what
        they are before the run. Anything else is a refusal.

        THIS GATE HAD A SECOND LOCK ON THE SAME DOOR, AND SESSION 27
        FOUND IT ONLY AFTER PICKING THE FIRST. Its third clause read
        `decision.route !== 'blocked'`, and there are exactly two ways
        `agent/policy/engine.mjs` returns `blocked`: an unauthorized
        actor, or an unmet condition on `NOT_WAIVABLE_BY_APPROVAL`.
        **Every measured condition is on that list**, and before a run
        every measurement is unknown, so the second way is ALWAYS
        taken and the clause was unsatisfiable for every proposal that
        has ever existed — independently of the rollback condition
        below it. Fixing only that one moved the refusal from clause 1
        to clause 3 and changed nothing a caller could see.

        The clause is replaced by the half of it that carries real
        content and is not a measurement: **was the actor authorized
        at all**. That case is otherwise INVISIBLE here — the engine
        returns `conditions: []` for an unauthorized actor, so clauses
        1 and 2 both count zero and both pass. Test 17c plants exactly
        that and asserts this gate still refuses.

        What is NOT lost: an unmet not-waivable condition is a
        `failed` or an unexpected `unknown`, and clauses 1 and 2
        already refuse on both. The measured ones are re-evaluated at
        step 6 against the real facts, where `mayMerge` requires route
        `automatic` — which requires no hard block at all. The check
        did not move; it stopped being asked before it could be
        answered. docs/CONTINUOUS-IMPROVEMENT.md §4. */
  const decision = evaluatePolicy({
    actor: { kind: 'implementation_qa', id: AUTONOMY_ACTOR },
    action: 'implement.apply',
    environment: 'local',
    resource: { kind: 'canonical_data', id: proposalId },
    proposal, policy, facts: {},
  });
  const hardFailures = decision.conditions.filter((c) => c.verdict === 'failed');
  const unexpectedUnknown = decision.conditions.filter((c) => c.verdict === 'unknown' && !MEASURED_CONDITIONS.includes(c.condition));
  const authorized = decision.authorization?.allow === true;
  gates.push(hardFailures.length === 0 && unexpectedUnknown.length === 0 && authorized
    ? pass('policy_route_pre', `${AUTONOMY_ACTOR} is authorized for this act, no mandatory condition fails, and the only unknowns are the ${MEASURED_CONDITIONS.length} that are measurements taken during the run: ${decision.unknown.join(', ') || 'none'}. Category "${decision.category.category}" under ${decision.policy_id}. The route reads "${decision.route}" and will until those measurements exist; step 6 re-evaluates it on the measured facts and merges only on "automatic".`, { route: decision.route, category: decision.category.category })
    : fail('policy_route_pre',
      !authorized
        ? `${AUTONOMY_ACTOR} is not authorized to perform this act at all: ${decision.authorization?.reason ?? 'the capability matrix refuses it'}`
        : `${hardFailures.length} condition(s) fail and ${unexpectedUnknown.length} non-measurement condition(s) are unknown: ${[...hardFailures, ...unexpectedUnknown].map((c) => `${c.condition} (${c.verdict}) — ${c.why}`).join(' · ')}`,
      'each is closed by the agent that owns the proposal or by a governance decision naming the category and the paths. An unknown blocks exactly as a failure does.',
      { route: decision.route, authorized, failed: decision.failed, unknown: decision.unknown }));

  /* 4 · the field gate. THE ONE THAT KEEPS SUBSTANTIVE LEGAL CONTENT
        OUT even where the derived category says "source metadata". */
  const fields = fieldsPermitted(proposal, policy);
  gates.push(fields.ok
    ? pass('fields_permitted', fields.why, { checked: fields.checked })
    : fail('fields_permitted', fields.why,
      'a grant names the fields it covers, and the never-automatic list names the ones no grant may. A change to what a source is said to support is not bookkeeping, whatever the proposal calls it.',
      { refusals: fields.refusals }));

  /* 5 · no mandatory human-review trigger. Already one of the twelve,
        and checked again here as its own gate because it is the one a
        reader of this ladder will look for by name. */
  const triggers = decision.human_review_triggers;
  gates.push(triggers.length === 0
    ? pass('no_human_review_trigger', 'none of the conditions protocol §19 reserves to a human is present.')
    : fail('no_human_review_trigger', `${triggers.length} mandatory human-review condition(s): ${triggers.map((t) => `${t.trigger} — ${t.why}`).join(' · ')}`,
      'protocol §19: no amount of model confidence overrides these. The act goes to the Control Room, which is not a refusal.',
      { triggers }));

  /* 6 · an independent second look at the legal record. `scope_
        permitted` already checks the policy allowlist; this checks
        the other direction — that every legal-record path in scope is
        one a grant named on purpose — so a widened allowlist and a
        mis-derived category would both have to be wrong together. */
  const permitted = pre.scope?.permitted ?? [];
  const legal = touchesLegalRecord(permitted);
  const allow = policy.automatic_path_allowlist ?? [];
  const unnamed = legal.filter((p) => !allow.includes(p));
  gates.push(unnamed.length === 0
    ? pass('legal_record_named', legal.length
      ? `${legal.length} path(s) in scope are the legal record and every one is named exactly by a grant: ${legal.join(', ')}.`
      : 'no path in scope is the legal record.', { legal })
    : fail('legal_record_named', `${unnamed.length} legal-record path(s) in scope are not named exactly by any grant: ${unnamed.join(', ')}. The allowlist holds ${allow.join(', ') || 'nothing'}.`,
      `${LEGAL_RECORD_PATHS.join(', ')} are what the site tells a reader about EU law. A grant names such a path exactly — never by a prefix that happens to cover it.`,
      { unnamed, legal, allowlist: allow }));

  return assemble(proposalId, gates, pre, decision, fields, policy);
}

function assemble(proposalId, gates, pre, decision, fields, policy) {
  const failed = gates.filter((g) => !g.ok);
  return {
    proposal_id: proposalId,
    ok: failed.length === 0,
    gates,
    failed,
    pre,
    decision,
    fields,
    policy_id: policy?.policy_id ?? null,
    summary: failed.length === 0
      ? `all ${gates.length} autonomy gates pass; "${proposalId}" may run automatically inside ${pre.scope?.permitted?.length ?? 0} permitted path(s)`
      : `${failed.length} autonomy gate(s) refuse "${proposalId}": ${failed.map((f) => f.gate).join(', ')}`,
  };
}

/* ============================================================
   THE CYCLE
   ============================================================ */

/**
 * Run the seven steps for one proposal.
 *
 * @param {{proposalId:string, run:object, asOf:string, root?:string,
 *          execute?:boolean, quick?:boolean, now?:string,
 *          governanceDir?:string, actionDir?:string,
 *          records?:object, ledger?:object}} opts
 */
export async function runCycle({
  proposalId, run, asOf, root = REPO_ROOT, execute = false, quick = false,
  now = new Date().toISOString(), governanceDir = undefined, actionDir = ACTION_DIR,
  records = null, ledger = null,
} = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const agents = new Set([...rec.byId.values()].map((r) => r.agent).filter(Boolean));
  const inForce = policyInForce({ dir: governanceDir, now, agents });
  const policy = inForce.policy;

  const span = run.startAgent({ agent: AUTONOMY_ACTOR, task: `limited-autonomy cycle for ${proposalId}` });

  const startedAt = new Date().toISOString();
  const originBranch = currentBranch(root);
  const baseCommit = currentCommit(root);
  const id = actionId({ proposalId, baseCommit, startedAt });

  const base = {
    action_id: id,
    proposal_id: proposalId,
    actor: AUTONOMY_ACTOR,
    started_at: startedAt,
    as_of: asOf,
    origin_branch: originBranch,
    base_commit: baseCommit,
    policy_id: policy.policy_id,
    grants: inForce.active.map((g) => g.grant_id),
    executed: execute,
    wrote_files: false,
    trace_id: span.trace_id ?? null,
    run_id: span.run_id ?? null,
  };

  const finish = (entry) => {
    const line = recordAction({ ...base, ...entry, ended_at: new Date().toISOString() }, { dir: actionDir });
    return { ...line, rollback_information: rollbackInformation(line), steps: CYCLE_STEPS };
  };

  /* ---------------------------------------------- gates */
  const gates = autonomyGates({ proposalId, policy, governance: inForce, records: rec, ledger: led });

  span.observe({
    summary: `AUTONOMY GATES — ${gates.summary}`,
    subject: proposalId,
    data: {
      gates: gates.gates.map((g) => ({ gate: g.gate, ok: g.ok })),
      failed: gates.failed.map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })),
      policy_id: policy.policy_id,
      enabled_categories: [...policy.enabled_categories],
      path_allowlist: [...policy.automatic_path_allowlist],
      grants: inForce.active.map((g) => g.grant_id),
    },
    confidence: 1,
    risk: gates.ok ? 'medium' : 'low',
  });

  if (!gates.ok) {
    span.decide({
      decision: `REFUSE ${proposalId} — automatic execution is not permitted`,
      rationale: gates.failed.map((g) => `${g.gate}: ${g.why}`).join(' · '),
      alternatives: [
        { option: 'route it to a person instead', why_not: 'that is what happens: a refusal here is not a refusal of the change, it is a statement that this change is not one of the low-risk categories a person switched on. It stays in the Control Room review queue.' },
        { option: 'widen the grant', why_not: 'protocol §24: the system must not autonomously rewrite its own governance policy, and agent/policy/ is on the never-automatic path list precisely so that it cannot grant itself anything.' },
      ],
      confidence: 1,
      risk: 'low',
    });
    span.end({ status: 'ok', outputs: { outcome: 'refused', gates_failed: gates.failed.length } });
    return finish({
      outcome: 'refused',
      refused_by: gates.failed.map((g) => g.gate),
      why: gates.summary,
      gates: gates.gates.map((g) => ({ gate: g.gate, ok: g.ok, why: g.why })),
      permitted: gates.pre?.scope?.permitted ?? [],
      category: gates.decision?.category?.category ?? null,
    });
  }

  const proposal = gates.pre.proposal;
  const permitted = gates.pre.scope.permitted;

  /* ---------------------------------------------- 1 · isolate */
  if (FORBIDDEN_BRANCHES.includes(originBranch)) {
    span.end({ status: 'ok', outputs: { outcome: 'refused', stage: 'isolate' } });
    return finish({
      outcome: 'refused', refused_by: ['isolate'], permitted,
      why: `the working tree is on "${originBranch}". A push to main publishes to the live site and there is no deploy gate, and a detached HEAD has no branch to merge back into — docs/AUTONOMY-POLICY.md Class D.`,
    });
  }

  const isolated = `autonomy/${id}`;
  let onIsolated = false;
  let context = null;
  /* What was already dirty before this cycle touched anything. A
     pre-existing edit must not be reported as scope creep, and an
     autonomous change must not be able to hide inside one — which is
     why `enforceScope` keeps the two apart rather than subtracting. */
  let dirtyBefore = [];

  try {
    dirtyBefore = changedPaths({ cwd: root });
    if (execute) {
      cutBranch({ name: isolated, cwd: root });
      onIsolated = true;
    }
    context = openContext({ permitted, root });
  } catch (err) {
    if (!(err instanceof ApplyRefused) && !(err instanceof IsolationRefused)) throw err;
    if (onIsolated) abandon({ originBranch, isolatedBranch: isolated, cwd: root });
    span.observe({ summary: `REFUSED AT ISOLATE — ${err.message}`, subject: proposalId, risk: 'low', data: err.detail ?? null });
    span.end({ status: 'ok', outputs: { outcome: 'refused', stage: 'isolate' } });
    return finish({ outcome: 'refused', refused_by: ['isolate'], permitted, why: err.message });
  }

  span.observe({
    summary: `ISOLATED — ${execute ? `branch ${isolated}` : 'no branch cut (rehearsal)'} from ${originBranch} at ${baseCommit.slice(0, 8)}; ${permitted.length} permitted path(s); rollback is "${context.rollback.method}"`,
    subject: 'change context',
    data: { isolated_branch: execute ? isolated : null, origin_branch: originBranch, base_commit: baseCommit, permitted, before: context.before, rollback: context.rollback },
  });

  /* Deliberately NOT `git checkout -- .`, which would discard every
     uncommitted change in the tree including work this cycle never
     touched. The only thing that undoes the edit is `rollback()`,
     which restores exactly the permitted paths and re-hashes them. */
  const cleanup = () => (execute && onIsolated ? abandon({ originBranch, isolatedBranch: isolated, cwd: root }) : null);

  /* ---------------------------------------------- 2 · implement */
  let change;
  try {
    change = applyProposal({ context, proposal, dry: !execute });
  } catch (err) {
    if (!(err instanceof ApplyRefused)) { cleanup(); throw err; }
    cleanup();
    span.observe({ summary: `REFUSED AT APPLY — ${err.message}`, subject: proposalId, risk: 'low', data: err.detail });
    span.end({ status: 'ok', outputs: { outcome: 'refused', stage: 'implement' } });
    return finish({ outcome: 'refused', refused_by: ['implement'], permitted, isolated_branch: execute ? isolated : null, before: context.before, why: err.message });
  }

  const changedFiles = change.files.map((f) => f.path);
  span.observe({
    summary: `IMPLEMENTED — ${change.files.length} file(s), ${change.operations} operation(s)${execute ? '' : ' (computed, not written)'}`,
    subject: proposalId,
    data: { files: change.files, dry: change.dry },
  });

  /* ---------------------------------------------- 3 · validators
     and 4 · the browser suite */
  const browserRequired = requiresBrowserQA(changedFiles).length > 0;
  const touchesAgent = changedFiles.some((p) => p.startsWith('agent/') || p.startsWith('tools/'));

  const v = runValidators({ root, asOf });
  const checks = [...v.checks];
  if (touchesAgent) {
    checks.push(runContractCheck({ root }));
    checks.push(...runAgentSuites({ root }));
  }
  const browser = await runBrowserCheck({ required: browserRequired, quick });
  if (browser.check) checks.push(browser.check);
  checks.push(runBoundaryCheck({ root }));

  const verdict = verdictFor(checks);
  const blocking = blockingFindings(checks);
  if (browserRequired && (!browser.run || browser.run.status === 'skipped')) {
    blocking.push(`browser QA was REQUIRED — the change touches ${requiresBrowserQA(changedFiles).join(', ')} — and it did not run: ${browser.run?.skipReason ?? 'no result'}. A skipped required check is not a passed check.`);
  }
  const qaVerdict = blocking.length && verdict === 'pass' ? 'pass_with_findings' : verdict;

  span.observe({
    summary: `CHECKS — ${checks.length} check(s), verdict "${qaVerdict}", ${blocking.length} blocking finding(s); browser QA ${browserRequired ? (browser.run?.status ?? 'not run') : 'not required'}`,
    subject: 'checks',
    data: {
      checks: checks.map((c) => ({ name: c.name, exit: c.exit_code, errors: c.errors, warnings: c.warnings, baseline: `${c.baseline_errors}/${c.baseline_warnings}` })),
      comparisons: v.comparisons.map((c) => ({ name: c.name, verdict: c.verdict })),
      baseline_source: v.baseline.source,
      blocking,
    },
    risk: qaVerdict === 'fail' ? 'high' : 'low',
  });

  /* ---------------------------------------------- scope, enforced after */
  const scopeResult = enforceScope({ permitted, before: dirtyBefore, cwd: root });

  /* ---------------------------------------------- 6 · the measured
     policy evaluation. The two derived facts come from the record
     store; the two measured ones come from runs that just happened. */
  const derived = deriveFacts(proposal, rec.byId);
  const facts = {
    context,
    validators: { verdict: qaVerdict, checks, blocking_findings: blocking },
    scope_enforcement: scopeResult,
    ...(derived.verification ? { verification: derived.verification } : {}),
    ...(derived.conflicts ? { conflicts: derived.conflicts } : {}),
    ...(browserRequired
      ? {
        browser_qa: {
          ran: Boolean(browser.run) && browser.run.status !== 'skipped',
          skipped: browser.run?.status === 'skipped',
          verdict: browser.run?.status === 'ok' ? 'pass' : 'fail',
          why: browser.run?.skipReason ?? null,
          failures: browser.run?.failures ?? [],
        },
      }
      : {}),
  };

  const after = evaluatePolicy({
    actor: { kind: 'implementation_qa', id: AUTONOMY_ACTOR },
    action: 'implement.apply',
    environment: 'local',
    resource: { kind: 'canonical_data', id: proposalId },
    proposal, policy, facts,
  });

  span.observe({
    summary: `POLICY (measured) — route "${after.route}"; ${after.failed.length} failed, ${after.unknown.length} unknown`,
    subject: 'autonomy policy',
    data: {
      route: after.route, failed: after.failed, unknown: after.unknown, why: after.why,
      supplied_facts: derived.derivation,
    },
    risk: after.route === 'automatic' ? 'medium' : 'low',
  });

  const mayMerge = after.route === 'automatic'
    && qaVerdict === 'pass'
    && scopeResult.ok
    && blocking.length === 0;

  const whyNot = [
    after.route !== 'automatic' ? `the policy routes this to "${after.route}" on the measured facts: ${after.why}` : null,
    qaVerdict !== 'pass' ? `the checks came back "${qaVerdict}"` : null,
    !scopeResult.ok ? `the change left its approved scope: ${scopeResult.outside.map((o) => o.path).join(', ')}` : null,
    blocking.length ? `${blocking.length} blocking finding(s): ${blocking.slice(0, 3).join(' · ')}` : null,
  ].filter(Boolean);

  span.decide({
    decision: mayMerge
      ? `MERGE ${proposalId} into ${originBranch}`
      : `DO NOT MERGE ${proposalId}`,
    rationale: mayMerge
      ? `every mandatory condition is satisfied on the measured facts, the checks are at the recorded baseline, and git confirms the change touched only ${scopeResult.touched.join(', ') || 'nothing'}. Grant(s): ${inForce.active.map((g) => `${g.grant_id} by ${g.decided_by}`).join('; ')}.`
      : whyNot.join(' · '),
    alternatives: [
      { option: 'merge anyway and open a finding', why_not: 'docs/AUTONOMY-POLICY.md Class B: the change is fully reverted if any validator fails. A change that stayed in the tree with a finding attached is a change nobody decided to make.' },
      { option: 'weaken the check that refused it', why_not: 'prohibition 16.' },
    ],
    confidence: 1,
    risk: mayMerge ? 'medium' : 'low',
  });

  /* ---------------------------------------------- rehearsal ends here */
  if (!execute) {
    const diff = { stat: '', patch: '', bytes: 0 };
    span.end({ status: 'ok', outputs: { outcome: 'rehearsed', would_merge: mayMerge } });
    return finish({
      outcome: 'rehearsed',
      would_merge: mayMerge,
      why: mayMerge
        ? 'every gate and every measured condition passes. Nothing was written: --execute was not given, and an autonomy layer whose safe mode is the one nobody selects is not a safe mode.'
        : whyNot.join(' · '),
      permitted, files: changedFiles, before: context.before,
      category: after.category.category, route: after.route,
      qa_verdict: qaVerdict, blocking_findings: blocking,
      scope_ok: scopeResult.ok,
      supplied_facts: derived.derivation,
      diff,
    });
  }

  /* ---------------------------------------------- 6 · merge or revert */
  if (!mayMerge) {
    const reverted = rollback(context, { root });
    cleanup();
    span.observe({
      summary: reverted.verified
        ? `REVERTED — ${whyNot.join(' · ')}; every permitted path re-hashes to its pre-change state and the isolated branch is deleted`
        : `REVERT INCOMPLETE — ${reverted.mismatches.length} path(s) do not hash back to their pre-change state. Do not push.`,
      subject: 'rollback',
      risk: reverted.verified ? 'medium' : 'high',
      data: reverted,
    });
    span.end({ status: 'ok', outputs: { outcome: reverted.verified ? 'reverted' : 'revert_failed' } });
    return finish({
      outcome: reverted.verified ? 'reverted' : 'revert_failed',
      wrote_files: true,
      why: whyNot.join(' · '),
      permitted, files: changedFiles, before: context.before,
      isolated_branch: null,
      category: after.category.category, route: after.route,
      qa_verdict: qaVerdict, blocking_findings: blocking,
      scope_ok: scopeResult.ok,
      revert: reverted,
      supplied_facts: derived.derivation,
    });
  }

  const diff = diffSummary(context, { root });
  const message = commitMessage({ proposal, proposalId, change, qaVerdict, checks, context, grants: inForce.active, policy, category: after.category.category, originBranch });

  /* Stage the files that actually changed, not the whole permitted
     set: a permitted path a proposal never wrote does not exist, and
     `git add` on it is an error rather than a no-op. */
  const committed = commitChange({ paths: changedFiles, message, cwd: root });
  if (!committed) {
    /* Every gate passed and the edit produced byte-identical content.
       That is not a merge and it is not a failure — it is a proposal
       whose change was already in the tree, and recording it as
       "merged" would put a commit in the history that changed
       nothing. */
    cleanup();
    span.observe({ summary: 'NO-OP — every gate passed and the applied content is byte-identical to what was already there. Nothing was committed.', subject: proposalId, risk: 'low' });
    span.end({ status: 'ok', outputs: { outcome: 'rehearsed', no_op: true } });
    return finish({
      outcome: 'rehearsed', would_merge: false, no_op: true, permitted, files: changedFiles, before: context.before,
      why: 'the proposal applied cleanly and changed no bytes. There is nothing to merge, and a commit that changes nothing is not a record of a change.',
    });
  }
  const { merge_commit: mergeCommit } = mergeBack({
    originBranch, isolatedBranch: isolated, actionId: id, proposalId, cwd: root,
  });
  const commit = committed.commit;

  span.observe({
    summary: `MERGED — ${isolated} into ${originBranch} at ${mergeCommit.slice(0, 8)}; ${change.files.length} file(s)`,
    subject: proposalId,
    data: { commit, merge_commit: mergeCommit, files: changedFiles, diff_stat: diff.stat },
    risk: 'medium',
  });
  span.end({ status: 'ok', outputs: { outcome: 'merged', files: change.files.length } });

  return finish({
    outcome: 'merged',
    wrote_files: true,
    permitted, files: changedFiles, before: context.before,
    isolated_branch: isolated,
    change_commit: commit,
    merge_commit: mergeCommit,
    category: after.category.category, route: after.route,
    qa_verdict: qaVerdict, blocking_findings: blocking,
    scope_ok: scopeResult.ok,
    supplied_facts: derived.derivation,
    diff_stat: diff.stat,
    why: `every mandatory condition satisfied on the measured facts under ${policy.policy_id}.`,
  });
}

/**
 * The commit message an autonomous change carries.
 *
 * It is the DURABLE record: the action ledger is git-ignored run
 * state, and everything a person needs to understand and undo this
 * change has to survive a fresh clone. So it names the grant, the
 * person who wrote it, the category, the policy, the checks, the base
 * commit and the exact restore command.
 *
 * No model identifier, per AGENTS.md.
 */
export function commitMessage({ proposal, proposalId, change, qaVerdict, checks, context, grants, policy, category, originBranch }) {
  const paths = change.files.map((f) => f.path);
  return [
    `autonomy: ${String(proposal.proposed_change?.summary ?? proposalId).slice(0, 60)}`,
    '',
    'Applied automatically under a limited-autonomy governance grant. No human',
    'decided this individual change; a person decided that this CATEGORY of change',
    'may happen without one, and that decision is named below.',
    '',
    `Proposal:  ${proposalId} (${proposal.contract}, produced by ${proposal.agent})`,
    `Category:  ${category} (derived from the proposal, never declared by it)`,
    `Policy:    ${policy.policy_id}`,
    `Grant(s):  ${grants.map((g) => `${g.grant_id} by ${g.decided_by} on ${g.decided_at}, expires ${g.expires_at}`).join('; ')}`,
    `Files:     ${paths.join(', ')}`,
    `Checks:    ${qaVerdict} across ${checks.length} check(s) against docs/CURRENT-ARCHITECTURE.md §12`,
    '',
    'ROLLBACK',
    `  git revert --no-edit <this merge>        # or, narrower:`,
    `  git checkout ${context.commit} -- ${paths.join(' ')}`,
    `  node tools/validate.mjs && node tools/i18n-audit.mjs && node tools/design-qa.mjs && node tools/freshness.mjs`,
    `  Base commit ${context.commit} on ${originBranch}. Every path above was sha256-hashed`,
    '  before the edit, so a restore is checked rather than asserted.',
    '',
    'NOT DEPLOYED. This reaches the working branch and stops. Nothing here pushes,',
    'and pushing to main is Class D under docs/AUTONOMY-POLICY.md.',
  ].join('\n');
}

/** Every proposal in the store, with what the autonomy gates say
 *  about it. This is the honest answer to "what could run
 *  automatically right now", and it writes nothing. */
export function surveyAutonomy({ records = null, ledger = null, now = new Date().toISOString(), governanceDir = undefined } = {}) {
  const rec = records ?? readAgentRecords();
  const led = ledger ?? readLedger();
  const agents = new Set([...rec.byId.values()].map((r) => r.agent).filter(Boolean));
  const inForce = policyInForce({ dir: governanceDir, now, agents });
  const survey = surveyProposals({ records: rec, ledger: led });

  const items = survey.map((s) => {
    const g = autonomyGates({ proposalId: s.proposal_id, policy: inForce.policy, governance: inForce, records: rec, ledger: led });
    return {
      proposal_id: s.proposal_id,
      contract: s.contract,
      agent: s.agent,
      category: g.decision?.category?.category ?? null,
      route: g.decision?.route ?? null,
      eligible: g.ok,
      refused_by: g.failed.map((f) => f.gate),
      why: g.summary,
    };
  });

  return {
    now,
    policy: inForce.policy,
    grants: inForce.active,
    inactive_grants: inForce.inactive,
    total: items.length,
    eligible: items.filter((i) => i.eligible),
    refused: items.filter((i) => !i.eligible),
    items,
  };
}
