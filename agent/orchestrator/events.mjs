/* ============================================================
   agent/orchestrator/events.mjs — what enters the Orchestrator, and
   what is taken off it at the door

   SESSION 22, CONTROL ROOM BOUNDARY: "The Control Room is an
   interface to the orchestration system, not an authority above it.
   A UI action must generate a governed event. The Orchestrator
   independently validates whether that event is permitted."

   THE WHOLE OF THAT IS THIS FILE'S JOB. An event is a REPORT THAT
   SOMETHING HAPPENED. It is never an instruction, never a grant and
   never a statement about permission — and because a caller can
   write anything into a JSON object, "never" has to be mechanical
   rather than conventional.

   TWO LISTS DO THE WORK.

   `ACCEPTED_FIELDS` is a whitelist. A field nobody declared is
   REFUSED with its name, in the same shape
   `.control-room/server.mjs parseStrictJson` refuses one: silently
   ignoring an unknown field is safe today and stops being safe the
   first time somebody adds a field with that name.

   `DISCARDED_FIELDS` is the list of things a caller might send that
   would, if believed, be authority arriving with the request:
   `approved`, `authorized`, `decided_by`, `permitted_files`,
   `roles`, `force`, `skip_checks`, and the rest. These are STRIPPED
   AND REPORTED rather than refused. Reported, because
   `agent/implement/ledger.mjs` already establishes the reasoning:
   silently ignoring a forged approval claim "would look identical
   to not having checked". Stripped rather than refused, because a
   real interface will send a field like `actor` in good faith, and
   the answer to that is to record what was ignored — not to reject
   the event and lose the observation it carried.

   `actor` IS KEPT AND IS NEVER AUTHORITY. It travels as
   `claimed_actor`, under a name that makes reading it as an
   identity a deliberate act. The Control Room authenticates its
   operators and the decision ledger binds a grant to a person; an
   event's opinion about who sent it is corroborated by neither.

   THE EVENT ID IS DERIVED FROM THE CONTENT. Two identical events
   have the same id, so a duplicate is detectable rather than
   becoming a second workflow about the same thing. It is not a
   signature and this file does not claim it is: an event store
   anybody can write is an event store anybody can write, and the
   controls that matter — authentication, authorization, the
   decision ledger — sit where the authority is, not here.
   ============================================================ */

import { createHash } from 'node:crypto';
import { canonicalJson } from '../schemas/gateway.mjs';
import { CONTRACT_NAMES } from '../schemas/registry.mjs';
import { WORKFLOW_TYPES } from './workflows.mjs';

/** Where an event can come from. The source is a fact about the
 *  channel, not a level of trust: nothing below is believed more
 *  because of it. */
export const EVENT_SOURCES = Object.freeze(['agent', 'control_room', 'cli', 'schedule', 'system']);

export const ACCEPTED_FIELDS = Object.freeze([
  'source',          // which channel it arrived on
  'kind',            // what happened, in the caller's words
  'workflow_type',   // a DECLARATION, checked against the subject rather than believed
  'subject',         // { contract, id } — a pointer to a record, never the record
  'actor',           // a CLAIM about who; kept as claimed_actor, never used for authority
  'occurred_at',     // when the caller says it happened
  'summary',         // one sentence, for a person reading a queue
  'payload',         // whatever else the caller wants recorded. Data, never instruction.
  'event_id',        // an id the caller already minted, checked against the derived one
]);

/**
 * Fields that would be authority arriving with the request. Every
 * one of them is stripped and named in `discarded`.
 *
 * The list is deliberately longer than the fields anything here
 * currently reads: the failure mode is a field added later whose
 * name nobody thought to guard, and a name on this list is refused
 * before it can acquire a meaning.
 */
export const DISCARDED_FIELDS = Object.freeze([
  'approved', 'approval', 'approval_state', 'approval_id', 'authorized', 'authorization',
  'granted', 'grant', 'decision', 'decided_by', 'decided_at', 'outcome',
  'permitted_files', 'permitted', 'scope', 'permissions', 'roles', 'role', 'capability', 'capabilities',
  'autonomy_class', 'autonomy', 'risk_override', 'override',
  'force', 'skip', 'skip_checks', 'bypass', 'trusted', 'verified', 'validated',
  'implement', 'implemented', 'apply', 'deploy', 'deployed', 'publish', 'published',
  'merge', 'push', 'git_ref', 'commit',
  'may_decide', 'may_implement', 'may_produce',
]);

/** Why each one is refused, so the record a reviewer reads says
 *  more than "ignored". Anything not named here gets the general
 *  reason. */
const DISCARD_REASON = Object.freeze({
  approved: 'an approval is derived from agent/implement/decisions/decisions.jsonl and from nowhere else. A field on an event claiming one is exactly the forgery the ledger exists to refuse.',
  authorized: 'authorization is a decision this system takes; it is not a property a caller can assert about itself.',
  decided_by: 'a decision is attributable to an authenticated actor. A name in a request body is a claim.',
  permitted_files: 'scope is derived from the stored proposal by agent/implement/scope.mjs. A request that named files would be a request that widened its own scope.',
  roles: 'permission comes from the operator registry the Control Room authenticates against, never from the message.',
  autonomy_class: 'the class is a property of the proposal and of what the change touches. An event that set it could lower it, and the class only ever rises (H5).',
  force: 'a function with an override argument is a function whose checks are advisory.',
  skip_checks: 'a check that can be skipped by asking is not a check.',
  deploy: 'nothing in this system deploys. There is no route, no stage and no flag, and an event asking for one is recorded as having asked.',
  git_ref: 'a git reference on an intake event would mean something was published before the workflow ran.',
});

export class EventRefused extends Error {
  constructor(message, { code = 'event_refused', detail = null, fix = null } = {}) {
    super(message);
    this.name = 'EventRefused';
    this.code = code; this.detail = detail; this.fix = fix;
  }
}

const sha = (s) => createHash('sha256').update(s).digest('hex');

/**
 * Take an event in, strip what may not travel, and refuse what
 * cannot be understood.
 *
 * @param {object} raw
 * @param {{now?:function, source?:string}} opts
 * @returns {{event:object, discarded:object[]}}
 */
export function receiveEvent(raw, { now = () => new Date().toISOString() } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new EventRefused('an event must be a JSON object', { code: 'not_an_object', fix: 'the Orchestrator takes events, not commands. An event says what happened.' });
  }

  const discarded = [];
  const unknown = [];
  const governed = {};

  for (const [k, v] of Object.entries(raw)) {
    if (DISCARDED_FIELDS.includes(k)) {
      discarded.push({
        field: k,
        /* The VALUE is kept, truncated, because "somebody sent
           approved: true" and "somebody sent approved: false" are
           different things to find in a journal later. */
        claimed: typeof v === 'object' ? '(object)' : String(v).slice(0, 120),
        why: DISCARD_REASON[k] ?? 'this field would be authority arriving with the request. The Orchestrator derives authority from the ledger, the registry and the policy, never from the message that asked.',
      });
      continue;
    }
    if (!ACCEPTED_FIELDS.includes(k)) { unknown.push(k); continue; }
    governed[k] = v;
  }

  if (unknown.length) {
    throw new EventRefused(`the event carries ${unknown.length} field(s) this system does not accept: ${unknown.join(', ')}`, {
      code: 'unknown_fields',
      detail: { unknown, accepted: ACCEPTED_FIELDS, discarded_on_sight: DISCARDED_FIELDS },
      fix: 'the accepted fields are listed above. An unknown field is refused rather than ignored: ignoring one is safe until somebody gives that name a meaning.',
    });
  }

  if (!governed.source || !EVENT_SOURCES.includes(governed.source)) {
    throw new EventRefused(`"${governed.source ?? 'none'}" is not an event source. The sources are ${EVENT_SOURCES.join(', ')}.`, {
      code: 'unknown_source',
      fix: 'name the channel the event arrived on. It records where it came from; it does not make it more believed — nothing here is trusted more for having said "control_room".',
    });
  }
  if (!governed.kind || typeof governed.kind !== 'string') {
    throw new EventRefused('an event with no kind says nothing happened', { code: 'no_kind', fix: 'say what happened, in one phrase. It is not parsed for authority; it is what a person reads first.' });
  }
  if (governed.workflow_type && !WORKFLOW_TYPES.includes(governed.workflow_type)) {
    throw new EventRefused(`"${governed.workflow_type}" is not one of the ten workflow types`, {
      code: 'unknown_workflow_type',
      detail: { declared: governed.workflow_type, types: WORKFLOW_TYPES },
      fix: 'omit it and let the subject classify the event, or name one of the ten. A type nobody implements would route to nothing.',
    });
  }
  if (governed.subject !== undefined && governed.subject !== null) {
    const s = governed.subject;
    if (typeof s !== 'object' || Array.isArray(s)) throw new EventRefused('subject must be an object naming a contract and an id', { code: 'bad_subject' });
    const extra = Object.keys(s).filter((k) => !['contract', 'id'].includes(k));
    if (extra.length) {
      throw new EventRefused(`subject carries ${extra.join(', ')}; it names a contract and an id and nothing else`, {
        code: 'bad_subject', detail: { extra },
        fix: 'the subject is a POINTER. The record lives in agent/records/ and the Orchestrator reads it there — an event that carried the record would be a second home for it, and a second home is a place the two can disagree.',
      });
    }
    if (s.contract && !CONTRACT_NAMES.includes(s.contract)) {
      throw new EventRefused(`"${s.contract}" is not one of the eighteen contracts`, { code: 'unknown_contract', detail: { contract: s.contract } });
    }
  }

  const received_at = now();
  const body = {
    source: governed.source,
    kind: governed.kind,
    workflow_type: governed.workflow_type ?? null,
    subject: governed.subject ?? null,
    summary: typeof governed.summary === 'string' ? governed.summary.slice(0, 500) : null,
    /* Renamed on the way in. Reading it as an identity is then a
       deliberate act with an obvious name. */
    claimed_actor: typeof governed.actor === 'string' ? governed.actor.slice(0, 200) : null,
    occurred_at: governed.occurred_at ?? null,
    payload: governed.payload ?? null,
  };

  const derived = `evt-${sha(canonicalJson(body)).slice(0, 16)}`;
  const event = {
    event_id: derived,
    received_at,
    ...body,
    discarded,
    /* Said on every event, because the field a caller sent is
       exactly the field a caller will expect to have been read. */
    intake_note: discarded.length
      ? `${discarded.length} field(s) were stripped at intake and are listed in "discarded". They were NOT read, and nothing downstream can see them. Authority is derived from the decision ledger, the capability register and the autonomy policy.`
      : 'nothing was stripped at intake.',
  };

  if (governed.event_id && governed.event_id !== derived) {
    /* Not a refusal: the caller's id is recorded and the derived
       one governs. An id that does not match its content is worth
       knowing about, and it is not worth losing the event over. */
    event.claimed_event_id = String(governed.event_id).slice(0, 120);
    event.id_note = `the caller supplied event_id "${event.claimed_event_id}" and the content derives ${derived}. The derived id governs: an id is a name for the content, and a name that does not match its content names nothing.`;
  }

  return { event, discarded };
}

/** A deterministic workflow id: same event, same intake time, same
 *  id. Deterministic rather than random so a suite can assert one,
 *  and content-derived so two intakes of the same event at the same
 *  instant collide rather than opening two workflows about one
 *  thing. */
export function workflowIdFor(event) {
  return `wf-${sha(`${event.event_id}\n${event.received_at}`).slice(0, 16)}`;
}
