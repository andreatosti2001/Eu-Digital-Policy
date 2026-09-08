/* ============================================================
   agent/policy/engine.mjs — the policy, executed

   SESSION 23: "The policy MUST be executable and independently
   testable. Do not implement the policy solely as documentation,
   prompts, comments or agent instructions. The implementation layer
   and Orchestrator must enforce it mechanically."

   TWO FUNCTIONS AND THEY ANSWER DIFFERENT QUESTIONS.

   `evaluate()` answers: what ROUTE does this act take — automatic,
   human review, or blocked? It reads the actor's capability, the
   twelve conditions, the derived category and the human-review
   triggers, and it returns all of them, always, whichever way the
   answer goes.

   `mayExecute()` answers: may this act happen RIGHT NOW? It is the
   one an implementation layer calls. It adds the thing `evaluate()`
   deliberately does not model — the approval — and it derives it
   from the ledger itself rather than accepting it as an argument,
   for the reason `agent/implement/preflight.mjs` states: the thing
   being constrained does not get to supply the constraint. There is
   no `approval` parameter. There is no `force`. There is no
   `skip_checks`.

   THREE ROUTES, AND THE THIRD IS NOT A SOFTER SECOND.

     automatic     — every mandatory condition is satisfied, the
                     category is enabled, the actor holds the
                     capability. Nothing in this repository currently
                     reaches it, and that is the intended state.

     human_review  — the act may proceed, through a governed human
                     decision. This is where a legal interpretation,
                     an editorial change, a schema change and a
                     deletion all land: they are not forbidden, they
                     are a person's to authorise.

     blocked       — the act may not proceed, and a human approval
                     would not change that. Protocol §8: approval
                     "does not override provenance requirements;
                     validation requirements; security requirements;
                     scope restrictions; mandatory policy
                     conditions". `NOT_WAIVABLE_BY_APPROVAL` in
                     conditions.mjs is that sentence as a list. A
                     proposal with missing provenance is not waiting
                     for a reviewer; it is waiting for the agent that
                     owns it.

   WHAT THIS MODULE IS NOT, said here rather than discovered later.
   It is not a security boundary between processes. Anything running
   in this process can call `evaluate()` with whatever facts it
   likes, and four of the twelve conditions are supplied facts. What
   the design gives instead is: an absent fact is `unknown` and
   unknown never executes; eight of the twelve cannot be supplied at
   all; the approval is re-derived from the ledger; and the actual
   enforcement point, `agent/implement/`, passes the return values of
   runs that just happened. The gap is the same one
   `agent/implement/ledger.mjs` names about itself, one layer up, and
   it is closed by the Control Room's server-side authorization for
   anything that arrives over HTTP.
   ============================================================ */

import { deriveApproval, IMPLEMENTABLE } from '../implement/ledger.mjs';
import { preflight } from '../implement/preflight.mjs';
import { authorizeActor } from './actors.mjs';
import { DEFAULT_POLICY, categoriseProposal, effectiveClass, ACTION_CATEGORIES } from './categories.mjs';
import { CONDITIONS, NOT_WAIVABLE_BY_APPROVAL, evaluateConditions, humanReviewTriggers } from './conditions.mjs';

export const ROUTES = ['automatic', 'human_review', 'blocked'];

/** Actions that write something. Everything else is a read, and a
 *  read does not go through the twelve conditions — it goes through
 *  the capability matrix and stops. */
export const MUTATING_ACTIONS = ['implement.apply', 'deploy.publish', 'ledger.write', 'governance.change', 'record.write', 'proposal.create'];

/**
 * Evaluate one act against the policy.
 *
 * @param {{actor:object, action:string, proposal?:object|null,
 *          resource?:object|null, environment?:string, path?:string|null,
 *          controlRoomPermission?:string|null,
 *          facts?:object, policy?:object}} req
 */
export function evaluate(req = {}) {
  const {
    actor = null, action = null, proposal = null, resource = null,
    environment = null, path = null, controlRoomPermission = null,
    facts = {}, policy = DEFAULT_POLICY,
  } = req;

  const risk = proposal?.risk ?? req.risk ?? 'critical';
  const authorization = authorizeActor({
    ...req, actor, action, resource, environment, path, risk, controlRoomPermission,
  });

  const category = categoriseProposal(proposal);
  const klass = proposal ? effectiveClass(proposal, category.category) : null;
  const triggers = humanReviewTriggers(proposal);

  /* An unauthorized actor is blocked before anything else is
     considered. Evaluating the conditions for an actor who may not
     perform the act at all would produce a report that reads as
     though the only problem were the conditions. */
  if (!authorization.allow) {
    return assemble({
      route: 'blocked', req, policy, authorization, category, klass, triggers,
      conditions: [],
      why: `${authorization.reason}${authorization.escalation_attempt.length ? ` The request also carried ${authorization.escalation_attempt.length} escalation parameter(s), which are not read: ${authorization.escalation_attempt.map((e) => e.parameter).join(', ')}.` : ''}`,
    });
  }

  if (!MUTATING_ACTIONS.includes(action)) {
    return assemble({
      route: 'automatic', req, policy, authorization, category, klass, triggers,
      conditions: [],
      why: `"${action}" writes nothing. The capability matrix permits it and the twelve conditions govern acts that change something, not acts that read.`,
    });
  }

  const conditions = evaluateConditions({ proposal, facts, policy });
  const unmet = conditions.filter((c) => c.verdict === 'failed' || c.verdict === 'unknown');
  /* A condition on the not-waivable list blocks — UNLESS it marked
     itself `hard: false`, which one of them does: `scope_permitted`
     reports both a boundary violation and "this path is not on the
     automatic allowlist", and only the first is something an
     approval cannot cure. Without the distinction, every proposal in
     this repository would report as blocked-beyond-approval for the
     sole reason that autonomy is switched off, which is both false
     and the exact opposite of what the empty allowlist means. */
  const hard = unmet.filter((c) => NOT_WAIVABLE_BY_APPROVAL.includes(c.condition) && c.hard !== false);

  if (hard.length) {
    return assemble({
      route: 'blocked', req, policy, authorization, category, klass, triggers, conditions,
      why: `${hard.length} condition(s) that a human approval does not override: ${hard.map((c) => `${c.condition} (${c.verdict})`).join(', ')}. Protocol §8: approval does not override provenance, validation, security or scope requirements — these are closed by the agent that owns the proposal, not by approving harder.`,
    });
  }

  if (unmet.length || triggers.length) {
    return assemble({
      route: 'human_review', req, policy, authorization, category, klass, triggers, conditions,
      why: unmet.length
        ? `${unmet.length} condition(s) refuse automatic execution: ${unmet.map((c) => `${c.condition} (${c.verdict})`).join(', ')}. None of them is a hard block, so this is a person's to decide.`
        : `every condition is satisfied and ${triggers.length} mandatory human-review condition(s) apply: ${triggers.map((t) => t.trigger).join(', ')}. Protocol §19 — no amount of model confidence overrides these.`,
    });
  }

  return assemble({
    route: 'automatic', req, policy, authorization, category, klass, triggers, conditions,
    why: `all ${CONDITIONS.length} mandatory conditions are satisfied, the derived category "${category.category}" is on the policy's enabled list, and ${actor.kind} holds "${action}". Policy in force: ${policy.policy_id}.`,
  });
}

function assemble({ route, req, policy, authorization, category, klass, triggers, conditions, why }) {
  const byVerdict = (v) => conditions.filter((c) => c.verdict === v).map((c) => c.condition);
  return {
    route,
    automatic_execution_permitted: route === 'automatic',
    action: req.action ?? null,
    actor: req.actor ? { kind: req.actor.kind, id: req.actor.id ?? null, roles: req.actor.roles ?? [] } : null,
    environment: req.environment ?? null,
    proposal_id: req.proposal?.proposal_id ?? req.proposal?.change_id ?? null,
    policy_id: policy.policy_id,
    policy_enabled_categories: [...(policy.enabled_categories ?? [])],
    authorization,
    category: { ...category, effective_class: klass, meta: ACTION_CATEGORIES[category.category] ? { human_review: ACTION_CATEGORIES[category.category].human_review, automatable: ACTION_CATEGORIES[category.category].automatable } : null },
    human_review_triggers: triggers,
    conditions,
    satisfied: byVerdict('satisfied'),
    failed: byVerdict('failed'),
    unknown: byVerdict('unknown'),
    not_applicable: byVerdict('not_applicable'),
    why,
    /* Said on every result, because the route name is the place
       somebody would assume otherwise. */
    note: route === 'automatic'
      ? 'A route of "automatic" means the policy raises no objection. It is not an instruction to act, and it does not publish: nothing in this repository deploys, and a push to main remains Class D.'
      : route === 'human_review'
        ? 'A route of "human_review" is not a refusal. It is the statement that a person decides, through the Control Room, and that the decision is recorded in agent/implement/decisions/decisions.jsonl bound to this proposal\'s hash.'
        : 'A route of "blocked" means an approval would not help. The condition is closed by the agent that owns the proposal.',
  };
}

/* ---------------------------------------------------------- execution */

/**
 * May this act happen now?
 *
 * The approval is DERIVED, here, from the decision ledger. It is not
 * a parameter, and there is deliberately no way to pass one:
 * SESSION 23 test 13 is that a forged approval cannot authorize
 * execution, and the mechanical answer to it is that no approval
 * arrives from the caller at all.
 *
 * @param {object} req the same shape `evaluate()` takes
 * @param {{records?:object, ledger?:object}} ctx record stores, for tests
 */
export function mayExecute(req = {}, ctx = {}) {
  const decision = evaluate(req);
  const proposalId = decision.proposal_id;

  if (decision.route === 'blocked') {
    return { allow: false, route: decision.route, why: decision.why, decision, approval: null };
  }
  if (decision.route === 'automatic') {
    return { allow: true, route: decision.route, why: decision.why, decision, approval: null };
  }

  /* human_review: an approval is required, and it comes from one
     place. `deriveApproval` already discards every agent-written
     claim by name and reports having done so. */
  if (!proposalId) {
    return { allow: false, route: decision.route, why: 'the act needs a human decision and names no proposal to have decided.', decision, approval: null };
  }
  const approval = deriveApproval(proposalId, ctx);
  if (!IMPLEMENTABLE.includes(approval.state)) {
    return {
      allow: false, route: decision.route, decision, approval,
      why: `approval state is "${approval.state}": ${approval.why}${approval.discarded.length ? ` ${approval.discarded.length} approval claim(s) found in agent/records/ were discarded — a grant lives only in agent/implement/decisions/.` : ''}`,
    };
  }

  /* An approval authorises the exact scope it was given, and the
     Implementation Agent's own ten gates re-derive that. A grant is
     necessary and not sufficient. */
  const pre = preflight(proposalId, ctx);
  if (!pre.ok) {
    return {
      allow: false, route: decision.route, decision, approval,
      why: `a grant exists and ${pre.failed.length} implementation gate(s) still refuse it: ${[...new Set(pre.failed.map((g) => g.gate))].join(', ')}. An approval is an authorization for a scope, not a bypass of the gates.`,
      preflight: pre,
    };
  }

  return {
    allow: true, route: decision.route, decision, approval, preflight: pre,
    why: `${approval.why} Every implementation gate passes, and the policy routes this act to a human decision, which exists and is bound to this proposal's fingerprint.`,
  };
}
