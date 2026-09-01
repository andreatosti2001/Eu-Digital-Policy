/* ============================================================
   agent/schemas/define.mjs — how a contract is declared

   `defineContract` and `defineProposal` do one job: put the
   envelope on every contract, and the twelve proposal fields on
   every proposal, so no contract can quietly omit one. A contract
   author writes only what is specific to that contract.

   Two things a contract may also declare:

   FORBIDDEN   a field that must never appear, with the reason.
               Closed shapes already reject an unknown field, but a
               generic "not declared" is a poor error for a field
               somebody added on purpose. `forbidden` turns it into
               the actual objection — usually that the value is
               derived and storing it creates the second copy the
               whole architecture exists to prevent.

   RULES       cross-field checks that cannot be expressed as a
               field spec: "a confirmed verdict needs direct or
               partial evidence", "a website change that touched a
               legal fact needs an approval". Each returns an array
               of problems.
   ============================================================ */

import { F } from './fields.mjs';
import { ENVELOPE_FIELDS, PROPOSAL_FIELDS } from './common.mjs';
import { CONTRACT_SCHEMA_VERSION } from './types.mjs';

export const CONTRACT_KINDS = [
  'finding',    // something an agent noticed: SourceCandidate, DataGap
  'record',     // something that happened: VerificationRecord, ChangeRecord, WebsiteChange
  'link',       // an edge between two canonical records: ClaimEvidence
  'proposal',   // something an agent wants done: the four *Proposal contracts
  'request',    // something an agent wants from a human: ApprovalRequest
  'result',     // the outcome of running checks: QAResult
  'observation',// a structured claim about the world: AgentObservation
  'run',        // an agent execution: AgentRun
];

/**
 * @param {{name:string, kind:string, id_field:string, doc:string,
 *          fields:object, forbidden?:object, rules?:Function[]}} def
 */
export function defineContract(def) {
  if (!CONTRACT_KINDS.includes(def.kind)) throw new Error(`${def.name}: unknown contract kind "${def.kind}"`);
  const fields = {
    ...ENVELOPE_FIELDS,
    contract: F.literal(def.name, `Always "${def.name}".`),
    contract_version: F.literal(CONTRACT_SCHEMA_VERSION, `Always ${CONTRACT_SCHEMA_VERSION} for this version of the contract.`),
    ...def.fields,
  };
  if (!(def.id_field in fields)) throw new Error(`${def.name}: id_field "${def.id_field}" is not one of its fields`);
  return {
    name: def.name,
    kind: def.kind,
    version: CONTRACT_SCHEMA_VERSION,
    id_field: def.id_field,
    doc: def.doc,
    fields,
    forbidden: def.forbidden ?? {},
    rules: def.rules ?? [],
  };
}

/** A proposal is a contract plus the twelve mandatory fields. */
export function defineProposal(def) {
  return defineContract({ ...def, kind: 'proposal', id_field: 'proposal_id', fields: { ...PROPOSAL_FIELDS, ...def.fields } });
}
