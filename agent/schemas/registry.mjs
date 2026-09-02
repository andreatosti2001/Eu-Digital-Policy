/* ============================================================
   agent/schemas/registry.mjs — the seventeen contracts

   The single place that knows what contracts exist. A record names
   its own contract in its `contract` field, so validation needs no
   out-of-band knowledge of what it was handed: an agent that
   invents a seventeenth contract is told the name is unknown rather
   than having its record accepted by a validator that skipped it.

   DataProposal is the fifteenth, added in SESSION 08,
   RegulatoryChange the sixteenth, added in SESSION 09, and
   ImpactAssessment the seventeenth, added in SESSION 10. Each is
   appended rather than slotted in beside its nearest relatives: the
   list order is the order the contracts were named, and reordering
   it would silently change what `CONTRACT_LIST[n]` means to anything
   that indexed it.

   ImpactAssessment is about the SITE where RegulatoryChange is about
   the WORLD, and it references the detection by change_id rather
   than restating any of it — the four fields that would have been a
   second copy are named in its `forbidden` block.

   RegulatoryChange is NOT ChangeRecord, and the two are easy to
   confuse: one is a change in the world, the other a change to this
   repository. Each names the other's fields in its `forbidden`
   block with the reason, so an agent that reaches for the wrong one
   is told which it wanted.
   ============================================================ */

import { SourceCandidate } from './contracts/source-candidate.mjs';
import { VerificationRecord } from './contracts/verification-record.mjs';
import { ClaimEvidence } from './contracts/claim-evidence.mjs';
import { ChangeRecord } from './contracts/change-record.mjs';
import { DataGap } from './contracts/data-gap.mjs';
import { ArchitectureProposal } from './contracts/architecture-proposal.mjs';
import { EditorialProposal } from './contracts/editorial-proposal.mjs';
import { UXProposal } from './contracts/ux-proposal.mjs';
import { ImplementationProposal } from './contracts/implementation-proposal.mjs';
import { QAResult } from './contracts/qa-result.mjs';
import { ApprovalRequest } from './contracts/approval-request.mjs';
import { AgentObservation } from './contracts/agent-observation.mjs';
import { AgentRun } from './contracts/agent-run.mjs';
import { WebsiteChange } from './contracts/website-change.mjs';
import { DataProposal } from './contracts/data-proposal.mjs';
import { RegulatoryChange } from './contracts/regulatory-change.mjs';
import { ImpactAssessment } from './contracts/impact-assessment.mjs';

/** In the order the sessions named them. */
export const CONTRACT_LIST = [
  SourceCandidate,
  VerificationRecord,
  ClaimEvidence,
  ChangeRecord,
  DataGap,
  ArchitectureProposal,
  EditorialProposal,
  UXProposal,
  ImplementationProposal,
  QAResult,
  ApprovalRequest,
  AgentObservation,
  AgentRun,
  WebsiteChange,
  DataProposal,
  RegulatoryChange,
  ImpactAssessment,
];

export const CONTRACTS = Object.fromEntries(CONTRACT_LIST.map((c) => [c.name, c]));

export const CONTRACT_NAMES = CONTRACT_LIST.map((c) => c.name);

/** The proposals — the ones that carry the full twelve-field envelope. */
export const PROPOSAL_CONTRACTS = CONTRACT_LIST.filter((c) => c.kind === 'proposal');

export function getContract(name) {
  const c = CONTRACTS[name];
  if (!c) throw new Error(`unknown contract "${name}" — the seventeen are: ${CONTRACT_NAMES.join(', ')}`);
  return c;
}

/* Fail at load rather than at validation time if two contracts ever
   claim the same name: a duplicate would silently shadow. */
if (CONTRACT_NAMES.length !== new Set(CONTRACT_NAMES).size) {
  throw new Error('two contracts share a name');
}
