/* ============================================================
   agent/policy/actors.mjs — who may do what, to which resource, in
   which environment, on which path, at which risk

   SESSION 23: "Define permissions separately for human reviewers,
   specialist agents, Orchestrator, Implementation/QA, deployment
   system", scoped by "actor, action, resource, environment,
   proposal, file/path, risk category", and: "No component may
   escalate its privileges through another component."

   THIS IS A SECOND AUTHORIZATION LAYER AND IT IS NOT A COPY OF THE
   FIRST. `.control-room/authz.mjs` answers a question about a
   PERSON at an HTTP request: may this operator approve this
   proposal. This module answers a question about a COMPONENT inside
   the pipeline: may the Editorial agent write data/, may the
   Orchestrator implement, may Implementation/QA deploy. The two
   never overlap — the only actor kind common to both is `human`,
   and for a human this module defers to the Control Room's matrix
   by importing it rather than restating it. One home per fact holds
   across a security boundary as well as across a dataset.

   FOUR PROPERTIES.

   1 · DENY BY DEFAULT, twice. An actor kind nobody has written a
       rule for holds nothing; an action nobody has written a rule
       for is refused. The suite plants both.

   2 · CAPABILITY IS A PROPERTY OF THE ACTOR, NEVER OF THE REQUEST.
       `authorizeActor()` reads the actor's own identity and the
       matrix below. It has no `on_behalf_of`, no `delegated_by`, no
       `as`. If one is supplied it is not honoured; it is REPORTED,
       as an attempted escalation, because a request that carries one
       is a request that expected it to work. This is the mechanical
       answer to "no component may escalate its privileges through
       another component": there is no parameter through which a
       privilege could travel.

   3 · SCOPE IS CONJUNCTIVE. Every one of actor, action, resource,
       environment, path and risk must be satisfied. A rule that
       permits `implement.apply` on `canonical_data` in `local` does
       not permit it in `production`, and the refusal names which
       clause failed rather than saying "forbidden".

   4 · THE PUBLIC CLIENT IS AN ACTOR. `public_client` is in the
       matrix with an empty capability list, so "a public client
       cannot invoke a privileged operation" is a row somebody can
       read rather than an absence somebody has to notice. Protocol
       §10: the public website is an untrusted environment.
   ============================================================ */

import { permissionsOf as controlRoomPermissionsOf } from '../../.control-room/authz.mjs';
import { riskRank } from './categories.mjs';

/* ---------------------------------------------------------- vocabulary */

export const ACTOR_KINDS = [
  'human',                // a person at the Control Room, or at a terminal
  'specialist_agent',     // agents 1–8, 10, 11: they observe, verify, analyse and propose
  'orchestrator',         // routes and enforces; does not reason in a specialist's place
  'implementation_qa',    // agent 9: the only actor that may write a permitted file
  'deployment_system',    // whatever publishes. Nothing in this repository is one.
  'public_client',        // a browser on the public website
];

export const ENVIRONMENTS = ['public_site', 'local', 'ci', 'control_plane', 'production'];

export const RESOURCE_KINDS = [
  'canonical_data',       // data/*.json — the legal record
  'public_page',          // *.html, style.css, css/, js/, app.js
  'locale',               // i18n/
  'derivation',           // js/format.js, js/pipeline.js, js/applies.js
  'schema',               // agent/schemas/, tools/
  'taxonomy',             // data/taxonomy.json
  'agent_record',         // agent/records/ — where proposals live
  'decision_ledger',      // agent/implement/decisions/
  'trace_store',          // agent/observability/runs/
  'control_room',         // .control-room/
  'deployment',           // the published site
  'governance',           // docs/AUTONOMY-POLICY.md and the rest of the constitution
  'report',               // docs/ output, chat output
];

export const ACTIONS = [
  'observe.read',
  'record.write',          // write a contract record into agent/records/
  'proposal.create',
  'proposal.approve',
  'proposal.reject',
  'proposal.request_changes',
  'workflow.route',        // hand a record from one agent to the next
  'policy.enforce',        // evaluate this policy and act on the result
  'implement.apply',       // write a file inside an approved scope
  'implement.rollback',
  'validate.run',
  'deploy.publish',
  'governance.change',
  'ledger.write',
];

/* ---------------------------------------------------------- the matrix */

const ALL_ENV = ENVIRONMENTS;
const NON_PROD = ['local', 'ci', 'control_plane'];

/**
 * One row per actor kind. `capabilities` is an allowlist: an action
 * absent from it is refused, and every entry may narrow itself by
 * resource, environment, path prefix and risk ceiling.
 *
 * `never` is not redundant with the absence of a capability. It is
 * the list of things that would be a CATEGORY ERROR for this actor
 * — the reasons are what a refusal quotes, and a reader deserves
 * "Scout observes; it does not decide what is true" rather than
 * "not permitted".
 */
export const CAPABILITIES = {
  human: {
    what: 'a person. Their permissions at the Control Room are .control-room/authz.mjs\'s matrix and are not restated here; what this row adds is what a person may do that no component may.',
    capabilities: [
      { action: 'observe.read', resources: RESOURCE_KINDS, environments: ALL_ENV, paths: ['*'], max_risk: 'critical' },
      { action: 'proposal.approve', resources: ['agent_record'], environments: ['control_plane', 'local'], paths: ['*'], max_risk: 'critical', requires_control_room_permission: true },
      { action: 'proposal.reject', resources: ['agent_record'], environments: ['control_plane', 'local'], paths: ['*'], max_risk: 'critical', requires_control_room_permission: true },
      { action: 'proposal.request_changes', resources: ['agent_record'], environments: ['control_plane', 'local'], paths: ['*'], max_risk: 'critical', requires_control_room_permission: true },
      { action: 'governance.change', resources: ['governance'], environments: ['local'], paths: ['docs/', 'AGENTS.md'], max_risk: 'critical' },
      { action: 'deploy.publish', resources: ['deployment'], environments: ALL_ENV, paths: ['*'], max_risk: 'critical' },
      { action: 'ledger.write', resources: ['decision_ledger'], environments: ['control_plane', 'local'], paths: ['agent/implement/decisions/'], max_risk: 'critical', requires_control_room_permission: true },
      { action: 'implement.rollback', resources: RESOURCE_KINDS, environments: ALL_ENV, paths: ['*'], max_risk: 'critical' },
      { action: 'validate.run', resources: RESOURCE_KINDS, environments: ALL_ENV, paths: ['*'], max_risk: 'critical' },
    ],
    never: [],
  },

  specialist_agent: {
    what: 'agents 1–8, 10 and 11. They observe, verify, analyse, and produce records. Every one of them is a proposer.',
    capabilities: [
      { action: 'observe.read', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
      { action: 'record.write', resources: ['agent_record'], environments: NON_PROD, paths: ['agent/records/'], max_risk: 'critical' },
      { action: 'proposal.create', resources: ['agent_record'], environments: NON_PROD, paths: ['agent/records/'], max_risk: 'critical' },
      { action: 'validate.run', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
    ],
    never: [
      ['implement.apply', 'a specialist agent proposes. docs/AGENT-ROLES.md: the agent that finds a thing is not the agent that writes it, and the agent that writes it is not the agent that decides it may be written.'],
      ['proposal.approve', 'agent/implement/ledger.mjs refuses a decision whose decided_by is any agent name, at write time and again at read time. An approval signed by an agent is "no agent verifies its own output" with a longer name.'],
      ['ledger.write', 'the decision ledger is the one home for the fact of an approval. An agent that can write its own approvals is not governed by them.'],
      ['deploy.publish', 'nothing in the agent layer publishes. A push to main publishes and there is no deploy gate.'],
      ['governance.change', 'protocol §24: the system MUST NOT autonomously rewrite its own governance policy. An agent may PROPOSE a governance change.'],
      ['workflow.route', 'routing is the Orchestrator\'s. An agent that routes its own output to the next stage has chosen its own reviewer.'],
    ],
  },

  orchestrator: {
    what: 'the Master Orchestrator. Protocol §14: it coordinates and enforces; it MUST NOT replace specialist domain reasoning, and it MUST NOT treat a Control Room action as unconditional authority.',
    capabilities: [
      { action: 'observe.read', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
      { action: 'workflow.route', resources: ['agent_record'], environments: NON_PROD, paths: ['agent/records/'], max_risk: 'critical' },
      { action: 'policy.enforce', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
      { action: 'record.write', resources: ['agent_record'], environments: NON_PROD, paths: ['agent/records/'], max_risk: 'critical' },
      { action: 'validate.run', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
    ],
    never: [
      ['proposal.create', 'a proposal produced by the router is a proposal whose reasoning nobody specialised in it did. §14: the Orchestrator must not replace their domain reasoning.'],
      ['proposal.approve', 'a Control Room action creates a governed EVENT. The Orchestrator re-derives whether it is valid; it does not itself decide.'],
      ['ledger.write', 'same. deriveApproval() reads the ledger; the Orchestrator does not write it.'],
      ['implement.apply', 'the Orchestrator routes to Implementation/QA. An orchestrator that can also implement is an orchestrator that can route around every gate it was built to enforce.'],
      ['deploy.publish', '§14: the Orchestrator MUST NOT bypass validation, autonomy policy or security controls, and publishing is all three at once.'],
      ['governance.change', 'protocol §24.'],
    ],
  },

  implementation_qa: {
    what: 'agent 9. The only actor in this system that may write a file the site is built from, and only inside a scope somebody else approved.',
    capabilities: [
      { action: 'observe.read', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
      { action: 'validate.run', resources: RESOURCE_KINDS, environments: NON_PROD, paths: ['*'], max_risk: 'critical' },
      { action: 'record.write', resources: ['agent_record'], environments: NON_PROD, paths: ['agent/records/'], max_risk: 'critical' },
      {
        action: 'implement.apply',
        resources: ['canonical_data', 'public_page', 'locale', 'derivation', 'report'],
        environments: ['local', 'ci'],
        /* `*` here means "whatever the approved scope permits", and
           the approved scope is derived from the proposal by
           agent/implement/scope.mjs, which keeps its own
           NEVER_WRITABLE list. This row is the outer bound; that
           list is the inner one, and both apply. */
        paths: ['*'],
        max_risk: 'high',
        requires_grant: true,
      },
      { action: 'implement.rollback', resources: RESOURCE_KINDS, environments: ['local', 'ci'], paths: ['*'], max_risk: 'critical' },
    ],
    never: [
      ['proposal.approve', 'agent/implement/preflight.mjs re-derives the approval from the ledger. An implementer that could also approve would be re-deriving its own claim.'],
      ['ledger.write', 'the same, one layer down: agent/implement/scope.mjs already lists agent/implement/decisions/ as never writable.'],
      ['proposal.create', 'a proposal written by the implementer is a proposal nobody approved. preflight gate 2 says a failing proposal goes back to the agent that owns it, and never that the implementer repairs it.'],
      ['deploy.publish', 'SESSION 18: implementation ends at a validated change on a branch. Publishing is Class D and belongs to the repository author.'],
      ['governance.change', 'protocol §24.'],
      ['workflow.route', 'agent 9 is routed to; it does not route.'],
    ],
  },

  deployment_system: {
    what: 'whatever publishes to the live site. THERE IS NO SUCH COMPONENT IN THIS REPOSITORY: GitHub Pages serves main, a push to main publishes, and .github/workflows/qa.yml is not a deploy gate. This row exists so that the permission is defined and refused rather than undefined and available.',
    capabilities: [
      { action: 'observe.read', resources: ['deployment'], environments: ['ci', 'production'], paths: ['*'], max_risk: 'critical' },
      { action: 'validate.run', resources: RESOURCE_KINDS, environments: ['ci'], paths: ['*'], max_risk: 'critical' },
    ],
    never: [
      ['deploy.publish', 'publishing is docs/AUTONOMY-POLICY.md Class D: authorization must name the action and come from the repository author. No automated actor holds it, and this session does not grant one — SESSION 23: "Do NOT enable automatic production merge in this session."'],
      ['implement.apply', 'a deployment system that can also edit is a deployment system that can publish something nobody wrote.'],
      ['proposal.approve', 'nothing about being able to publish makes an actor able to decide.'],
      ['ledger.write', 'the same.'],
      ['governance.change', 'protocol §24.'],
    ],
  },

  public_client: {
    what: 'a browser on the public website. Protocol §10: the public website is an untrusted, public environment.',
    capabilities: [],
    never: [
      ['observe.read', 'the public client reads the PUBLIC SITE, which is files served over HTTP. It does not read this system: no trace, no proposal, no decision, no health reading and no operator record is reachable from it. The hidden Control Room discovery of SESSION 23 does not change this — it is a UX event and carries no privileged state.'],
      ['proposal.approve', 'protocol §13: approval is a governed server-side action attributable to an authenticated actor. A browser is not one.'],
      ['implement.apply', 'nothing served to a public client can write anything here.'],
      ['policy.enforce', 'the policy is enforced where the act happens, which is never in a reader\'s browser. Protocol §12: the UI is never the authority for permission.'],
      ['deploy.publish', 'no.'],
      ['ledger.write', 'no.'],
      ['governance.change', 'no.'],
      ['record.write', 'no.'],
      ['workflow.route', 'no.'],
      ['validate.run', 'no.'],
      ['implement.rollback', 'no.'],
      ['proposal.create', 'no.'],
      ['proposal.reject', 'no.'],
      ['proposal.request_changes', 'no.'],
    ],
  },
};

/** Parameters that would carry a privilege from one component to
 *  another. None of them is honoured; every one of them is
 *  reported. */
export const ESCALATION_PARAMETERS = ['on_behalf_of', 'delegated_by', 'as', 'assume_role', 'impersonate', 'inherit_from', 'granted_by_agent'];

const pathAllowed = (allow, path) => {
  if (!path) return true;
  return allow.some((a) => a === '*' || path === a || path.startsWith(a));
};

/**
 * THE component authorization decision.
 *
 * @param {{actor:object, action:string, resource?:object|null,
 *          environment?:string, path?:string|null, risk?:string,
 *          controlRoomPermission?:string|null}} req
 * @returns {{allow:boolean, reason:string, clause:string|null,
 *            escalation_attempt:object[], actor_kind:string|null}}
 */
export function authorizeActor(req = {}) {
  const { actor = null, action = null, resource = null, environment = null, path = null, risk = 'critical', controlRoomPermission = null } = req;

  /* Reported before anything else, so an attempt is on the record
     even when the request would have been refused anyway. */
  const escalation = ESCALATION_PARAMETERS
    .filter((k) => req[k] !== undefined && req[k] !== null)
    .map((k) => ({
      parameter: k,
      value: String(req[k]).slice(0, 120),
      why_ignored: `capability here is a property of the actor, read from CAPABILITIES. "${k}" is not read by anything in this module, so a privilege cannot travel through it. The attempt is recorded because a request carrying one expected it to work.`,
    }));

  const base = {
    allow: false,
    action, actor_kind: actor?.kind ?? null, actor_id: actor?.id ?? null,
    resource: resource ? { kind: resource.kind ?? null, id: resource.id ?? null } : null,
    environment, path, risk,
    clause: null,
    escalation_attempt: escalation,
  };

  if (!actor || !ACTOR_KINDS.includes(actor.kind)) {
    return { ...base, clause: 'actor', reason: `"${actor?.kind ?? 'nothing'}" is not an actor kind this policy defines. Deny by default: an actor nobody wrote a rule for holds nothing.` };
  }
  if (!ACTIONS.includes(action)) {
    return { ...base, clause: 'action', reason: `"${action}" is not an action this policy defines. An action nobody wrote a rule for is refused, because the alternative makes every action added later permitted until somebody remembers.` };
  }

  const row = CAPABILITIES[actor.kind];
  const never = (row.never ?? []).find(([a]) => a === action);
  if (never) {
    return { ...base, clause: 'never', reason: `${actor.kind} may never "${action}": ${never[1]}` };
  }

  const cap = (row.capabilities ?? []).find((c) => c.action === action);
  if (!cap) {
    return { ...base, clause: 'capability', reason: `${actor.kind} holds ${(row.capabilities ?? []).length} capabilit(ies) and "${action}" is not among them. Deny by default.` };
  }
  if (resource?.kind && !cap.resources.includes(resource.kind)) {
    return { ...base, clause: 'resource', reason: `${actor.kind} may "${action}" on ${cap.resources.join(', ')}. The resource here is "${resource.kind}".` };
  }
  if (environment && !cap.environments.includes(environment)) {
    return { ...base, clause: 'environment', reason: `${actor.kind} may "${action}" in ${cap.environments.join(', ')}. This request is in "${environment}".` };
  }
  if (path && !pathAllowed(cap.paths, path)) {
    return { ...base, clause: 'path', reason: `${actor.kind} may "${action}" under ${cap.paths.join(', ')}. This request names "${path}".` };
  }
  if (riskRank(risk) > riskRank(cap.max_risk)) {
    return { ...base, clause: 'risk', reason: `${actor.kind} may "${action}" up to risk "${cap.max_risk}". This request carries "${risk}".` };
  }

  /* A human acting through the Control Room is authorized by the
     Control Room's matrix, not by this one. Restating its rules here
     would be a second home for them, and the two would drift. */
  if (cap.requires_control_room_permission) {
    if (!controlRoomPermission) {
      return { ...base, clause: 'control_room_permission', reason: `"${action}" by a person is authorized by .control-room/authz.mjs, and this request names no permission from it. This module does not restate that matrix and will not substitute for it.` };
    }
    const held = controlRoomPermissionsOf(actor.roles ?? []);
    if (!held.includes(controlRoomPermission)) {
      return { ...base, clause: 'control_room_permission', reason: `${actor.id ?? 'this operator'} holds ${held.length ? held.join(', ') : 'no Control Room permission at all'}; "${controlRoomPermission}" is not among them.` };
    }
  }

  return {
    ...base,
    allow: true,
    clause: null,
    reason: `${actor.kind} holds "${action}"${resource?.kind ? ` on ${resource.kind}` : ''}${environment ? ` in ${environment}` : ''} at risk up to "${cap.max_risk}"${cap.requires_grant ? ', and this capability additionally requires a grant in the decision ledger, which is checked separately' : ''}.`,
    requires_grant: Boolean(cap.requires_grant),
  };
}

/** The whole matrix as rows, for the CLI and for a reader. */
export function matrix() {
  const rows = [];
  for (const kind of ACTOR_KINDS) {
    const row = CAPABILITIES[kind];
    for (const c of row.capabilities) {
      rows.push({ actor: kind, action: c.action, resources: c.resources.length === RESOURCE_KINDS.length ? ['(all)'] : c.resources, environments: c.environments, paths: c.paths, max_risk: c.max_risk, grant: Boolean(c.requires_grant), verdict: 'permitted' });
    }
    for (const [action, why] of row.never) rows.push({ actor: kind, action, resources: [], environments: [], paths: [], max_risk: null, grant: false, verdict: 'never', why });
    for (const action of ACTIONS) {
      if (row.capabilities.some((c) => c.action === action)) continue;
      if (row.never.some(([a]) => a === action)) continue;
      rows.push({ actor: kind, action, resources: [], environments: [], paths: [], max_risk: null, grant: false, verdict: 'denied_by_default', why: 'no rule names it' });
    }
  }
  return rows;
}
