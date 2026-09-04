/* ============================================================
   .control-room/authz.mjs — authentication says who; this says what

   Protocol §12: "Authentication establishes identity. Authorization
   establishes permission. They are separate controls." They are
   separate files here for the same reason. A session proves somebody
   logged in; it proves nothing about whether they may decide a
   proposal about EU law.

   THREE PROPERTIES THIS MODULE IS BUILT AROUND.

   1 · DENY BY DEFAULT. `authorize()` starts from a refusal and can
       only be talked out of it by a rule that names the action. An
       action nobody has written a rule for is denied, and the suite
       plants an unknown action to prove it. The alternative — allow
       unless denied — means every route added later is public until
       somebody remembers.

   2 · THE UI IS NEVER THE AUTHORITY. `visibleActions()` exists so the
       interface can hide a button, and it is derived from the SAME
       matrix the server enforces. Hiding is a courtesy to the person
       reading the screen. The server calls `authorize()` on every
       privileged request whether the button was there or not, and
       §12 says exactly this: a visible APPROVE button does not grant
       approval rights, and a hidden one does not prevent anything.

   3 · RISK CATEGORY IS PART OF THE DECISION, not a label on it.
       `docs/AUTONOMY-POLICY.md` Class D — deleting a record,
       declaring a licence, adding a dependency, publishing — requires
       authorization "named and recorded" from the repository author.
       So `proposal:approve` covers autonomy classes up to
       review_required, and a human_only proposal needs
       `proposal:approve:human_only`, which only an administrator
       holds. A reviewer who may approve a metadata correction may
       not approve a deletion, and that is a permission difference
       rather than a warning in the interface.

   WHAT THIS FILE DOES NOT DO. It does not decide whether a proposal
   is well-formed, whether its approval is still bound to its scope,
   or whether approving it would publish anything. Those are
   `decide.mjs`'s gates, and they run AFTER this one — a caller who
   is permitted to approve still has to get past every governance
   check that would refuse the proposal itself.
   ============================================================ */

/** The four roles protocol §12 names, plus the operator role it
 *  allows for "system/operator where required". */
export const ROLES = ['viewer', 'reviewer', 'approver', 'administrator', 'operator'];

/**
 * Every permission in the system. A permission that is not on this
 * list cannot be granted, and a route that requires one that is not
 * on this list fails closed — `PERMISSIONS` is the vocabulary, and
 * an unknown word is not a request, it is a mistake.
 */
export const PERMISSIONS = [
  'live:read',                    // the Live System view: runs, events, handoffs, failures
  'queue:read',                   // the Review Queue: proposals and their full trace
  'health:read',                  // the Website Health view, private metrics included
  'audit:read',                   // the approval audit trail
  'operators:read',               // who has access, and with what role
  'operators:write',              // grant and revoke a role
  'proposal:request_changes',     // a review annotation; changes no approval state
  'proposal:reject',              // record a denial in the ledger
  'proposal:approve',             // record a grant, for autonomy class up to review_required
  'proposal:approve:human_only',  // and for a human_only (red-tier) proposal
];

/**
 * Role → permissions. Written out per role rather than by
 * inheritance: an inheritance chain reads as though a change to one
 * role cannot affect another, and it can.
 */
export const ROLE_PERMISSIONS = {
  viewer: ['live:read', 'queue:read', 'health:read'],

  reviewer: ['live:read', 'queue:read', 'health:read', 'proposal:request_changes'],

  /* An approver may grant and deny, but not for a human_only
     proposal, and may not change who has access. */
  approver: ['live:read', 'queue:read', 'health:read', 'audit:read', 'proposal:request_changes', 'proposal:reject', 'proposal:approve'],

  administrator: [
    'live:read', 'queue:read', 'health:read', 'audit:read',
    'operators:read', 'operators:write',
    'proposal:request_changes', 'proposal:reject', 'proposal:approve', 'proposal:approve:human_only',
  ],

  /* System/operator: watches the machinery, decides nothing. The
     separation is the point — the person who keeps the agents
     running is not thereby a person who may decide what the site
     says about EU law. */
  operator: ['live:read', 'health:read', 'audit:read'],
};

/** The autonomy classes a proposal can carry, from
 *  `agent/schemas/types.mjs`, and the permission each one needs to
 *  be approved. */
export const APPROVAL_PERMISSION_BY_CLASS = {
  autonomous: 'proposal:approve',
  review_required: 'proposal:approve',
  human_only: 'proposal:approve:human_only',
};

export const isRole = (r) => ROLES.includes(r);
export const isPermission = (p) => PERMISSIONS.includes(p);

/** Every permission a set of roles carries. An unknown role
 *  contributes nothing rather than everything. */
export function permissionsOf(roles = []) {
  const out = new Set();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) out.add(p);
  return [...out].sort();
}

/**
 * THE authorization decision. Everything privileged goes through it.
 *
 * @param {{actor:object|null, action:string, resource?:object|null}} req
 * @returns {{allow:boolean, action:string, reason:string, actor_id:string|null,
 *            roles:string[], required:string|null, resource:object|null}}
 */
export function authorize({ actor = null, action, resource = null } = {}) {
  const base = {
    allow: false,
    action: action ?? null,
    actor_id: actor?.operator_id ?? null,
    roles: actor?.roles ?? [],
    required: null,
    resource: resource ? { kind: resource.kind ?? null, id: resource.id ?? null } : null,
  };

  if (!action || typeof action !== 'string') {
    return { ...base, reason: 'no action was named. Authorization is a decision about a specific act; a request that does not name one is refused rather than interpreted.' };
  }

  /* Deny by default: the action has to be one this system knows.
     A route that asks for a permission nobody defined gets a
     refusal, not a pass. */
  if (!isPermission(action)) {
    return { ...base, reason: `"${action}" is not a permission this system defines. Deny by default: an action nobody wrote a rule for is refused, because the alternative makes every route added later public until somebody remembers.` };
  }

  base.required = action;

  if (!actor) {
    return { ...base, reason: `"${action}" requires an authenticated actor and this request carries none.` };
  }
  if (actor.disabled) {
    return { ...base, reason: `operator ${actor.operator_id} is disabled. A disabled operator keeps their identity and loses every permission.` };
  }

  const held = permissionsOf(actor.roles ?? []);
  if (!held.includes(action)) {
    return {
      ...base,
      reason: `operator ${actor.operator_id} holds ${actor.roles?.length ? actor.roles.join(', ') : 'no role'}, which carries ${held.length ? held.join(', ') : 'no permission at all'}. "${action}" is not among them.`,
    };
  }

  return { ...base, allow: true, reason: `operator ${actor.operator_id} holds "${action}" through ${actor.roles.filter((r) => (ROLE_PERMISSIONS[r] ?? []).includes(action)).join(', ')}.` };
}

/**
 * Which permission approving THIS proposal needs.
 *
 * A proposal whose autonomy class is missing or unrecognised takes
 * the strictest one. `docs/AUTONOMY-POLICY.md`: "Default when
 * unsure: the higher class. Misclassifying downward is the failure
 * this document exists to prevent."
 */
export function approvalPermissionFor(proposal) {
  const cls = proposal?.autonomy_class;
  return APPROVAL_PERMISSION_BY_CLASS[cls] ?? 'proposal:approve:human_only';
}

/**
 * What the interface may show this actor. Derived from the matrix
 * the server enforces, so the two cannot drift apart — and, to say
 * it once more where somebody editing the UI will read it: this is
 * cosmetic. The server does not consult it.
 */
export function visibleActions(actor) {
  const held = permissionsOf(actor?.roles ?? []);
  return {
    live: held.includes('live:read'),
    queue: held.includes('queue:read'),
    health: held.includes('health:read'),
    audit: held.includes('audit:read'),
    operators: held.includes('operators:read'),
    approve: held.includes('proposal:approve'),
    approve_human_only: held.includes('proposal:approve:human_only'),
    reject: held.includes('proposal:reject'),
    request_changes: held.includes('proposal:request_changes'),
    note: 'Cosmetic only. Every privileged request is authorized server-side by .control-room/authz.mjs authorize(), whether or not the interface offered the action.',
  };
}
