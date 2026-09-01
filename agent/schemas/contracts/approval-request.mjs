/* ============================================================
   ApprovalRequest — an agent asking a human to decide

   Amber-tier work is the work an agent may prepare and a human must
   approve; red-tier work is the work an agent may only propose. The
   request is the boundary, and it has two properties worth naming.

   It says what the human must check, item by item. "Please review"
   delegates the thinking back to the person least able to reconstruct
   what the agent was standing on.

   And it cannot be granted by its own author: the rule below refuses
   a decision whose `decided_by` is the requesting agent. An
   unapproved change that looks approved is precisely the failure the
   observability layer's pending-approval view exists to make
   impossible to miss.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { APPROVAL_STATES, AUTONOMY_TIER, RISKS } from '../types.mjs';

export const ApprovalRequest = defineContract({
  name: 'ApprovalRequest',
  kind: 'request',
  id_field: 'approval_id',
  doc: 'A request for human sign-off on one or more proposals, with what the human is being asked to check and what it costs if they are wrong.',
  fields: {
    approval_id: F.id('This request\'s id. The same id appears on the observability approval record and on the ChangeRecord that lands.'),
    proposal_ids: F.array(F.id('A proposal_id.'), 'What is being approved. Never empty.', { min: 1 }),
    tier: F.enum(Object.values(AUTONOMY_TIER), 'green · amber · red, from docs/AI-SAFE-BOUNDARIES.md. Green rarely needs a request; amber and red always do.'),
    requested_of: F.string('Who is being asked. A request addressed to nobody is a record of having asked nobody.'),
    why_human_required: F.text('Why this cannot be autonomous, in terms of the boundaries document.'),
    what_to_check: F.array(F.string('One thing to check, specific enough to be done.'), 'What the human is being asked to verify. Never "please review".', { min: 1 }),
    risk_if_wrong: F.enum(RISKS, 'What it costs if this is approved and wrong.'),
    consequence_if_wrong: F.text('What a reader would see, or what would break, if this is wrong.'),
    expires_at: F.iso('When the request goes stale. Null where it does not.', { nullable: true }),
    state: F.enum(APPROVAL_STATES, 'requested · granted · denied · expired. "requested" with nothing after it is pending, and pending is never treated as granted.'),
    decision: F.object({
      decided_at: F.iso('When.'),
      decided_by: F.string('Who. Never the requesting agent.'),
      outcome: F.enum(['granted', 'denied'], 'What was decided.'),
      note: F.text('What the decision rested on, or what it was conditional upon.', { nullable: true }),
    }, 'The decision, once there is one. Null while pending.', { nullable: true }),
  },
  forbidden: {
    auto_approve: 'There is no such thing here. An approval is a human act; that is the entire point of the record.',
    self_approved: 'Same.',
    assumed_granted: 'Pending is never granted. A missing decision is a missing decision.',
  },
  rules: [
    (r) => (['granted', 'denied'].includes(r.state) && !r.decision
      ? [`state is "${r.state}" but there is no decision record: say who decided and when`]
      : []),
    (r) => (r.decision && r.state === 'requested'
      ? ['state is "requested" but a decision is attached: a decided request is not pending']
      : []),
    (r) => (r.decision && r.decision.outcome !== r.state && ['granted', 'denied'].includes(r.state)
      ? [`state "${r.state}" disagrees with decision.outcome "${r.decision.outcome}"`]
      : []),
    (r) => (r.decision && r.decision.decided_by === r.agent
      ? [`decision.decided_by is "${r.agent}", the agent that requested it: an agent may not approve its own proposal`]
      : []),
    (r) => (r.state === 'expired' && !r.expires_at
      ? ['state is "expired" but expires_at is null: nothing can expire without a stated expiry']
      : []),
  ],
});
