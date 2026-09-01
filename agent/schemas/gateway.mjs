/* ============================================================
   agent/schemas/gateway.mjs — the only sanctioned way to pass a
   contract record to anything else

   "No agent may bypass these contracts" is not a policy sentence
   here; it is this module. `emit` validates and throws, `receive`
   validates and throws, and neither has a flag that skips the
   check. An agent that writes a record straight into a file has not
   defeated anything: the receiving agent calls `receive`, and an
   invalid record dies at the boundary rather than three agents
   later, in a website change nobody can explain.

   WHAT GOES INTO THE TRACE. Only a pointer: the record's id, its
   contract, and a sha256 of its canonical form. The record itself
   lives wherever the agent stores it. Copying the body into the
   trace would make the trace a second home for every fact the
   record carries, and this repository's whole position is that two
   copies of a fact can disagree. The hash is what makes the pointer
   checkable: a record that changed after it was emitted no longer
   matches the trace that says what was handed over.

   The one exception is an ApprovalRequest, which also emits the
   observability layer's own `approval` event — carrying the id and
   the state and nothing else. That is still a pointer, and it is
   what puts a pending approval in front of a human in the viewer.
   A pending approval nobody can see is the failure the whole
   observability layer was built to prevent.
   ============================================================ */

import { createHash } from 'node:crypto';
import { assertValid, validate } from './validate.mjs';
import { getContract } from './registry.mjs';

/** Stable key order, so the same record always hashes the same. */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
}

export const sha256Of = (record) => createHash('sha256').update(canonicalJson(record)).digest('hex');

export const idOf = (record) => record[getContract(record.contract).id_field];

/**
 * Validate a record and register it in the trace as a pointer.
 *
 * @param {import('../observability/tracer.mjs').Span} span
 * @param {object} record
 * @param {{allowSimulated?:boolean, derived_from?:string[]}} [opts]
 * @returns {object} the same record, unchanged
 */
export function emit(span, record, opts = {}) {
  assertValid(record, opts);
  const contract = getContract(record.contract);
  const id = idOf(record);

  span.artifact({
    artifact_id: id,
    artifact_type: `contract:${contract.name}`,
    sha256: sha256Of(record),
    derived_from: opts.derived_from ?? [],
    preview: null,
    simulated: record.simulated === true,
  });

  if (contract.name === 'ApprovalRequest') {
    span.approval({
      approval_id: record.approval_id,
      state: record.state,
      subject: record.why_human_required,
      requested_of: record.requested_of,
      actor: record.decision?.decided_by ?? null,
      note: record.decision?.note ?? null,
      artifact_ids: record.proposal_ids,
      risk: record.risk_if_wrong,
    });
  }

  return record;
}

/**
 * The receiving half. An agent handed a record calls this before
 * acting on it — including a record it believes it produced itself,
 * because "I wrote it" is not a property the receiver can check.
 */
export function receive(record, opts = {}) {
  return assertValid(record, opts);
}

/**
 * Hand a set of records to another agent. Every record is validated
 * first: a handoff is where an invalid record would otherwise
 * become somebody else's problem, and the point of the gate is that
 * it never gets that far.
 */
export function handoff(span, { to_agent, records, reason = null, allowSimulated = false }) {
  const bad = records.flatMap((r) => validate(r, { allowSimulated }).map((e) => `${r?.contract ?? 'record'}: ${e}`));
  if (bad.length) {
    throw new Error(`refusing to hand ${records.length} record(s) to "${to_agent}":\n  · ${bad.join('\n  · ')}`);
  }
  for (const r of records) emit(span, r, { allowSimulated });
  return span.handoff({ to_agent, reason, artifact_ids: records.map(idOf) });
}
