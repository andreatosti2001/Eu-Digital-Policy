/* ============================================================
   agent/schemas/registry.mjs — the fourteen contracts

   The single place that knows what contracts exist. A record names
   its own contract in its `contract` field, so validation needs no
   out-of-band knowledge of what it was handed: an agent that
   invents a fifteenth contract is told the name is unknown rather
   than having its record accepted by a validator that skipped it.
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

/** In the order the session named them. */
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
];

export const CONTRACTS = Object.fromEntries(CONTRACT_LIST.map((c) => [c.name, c]));

export const CONTRACT_NAMES = CONTRACT_LIST.map((c) => c.name);

/** The four the session requires to carry the full proposal envelope. */
export const PROPOSAL_CONTRACTS = CONTRACT_LIST.filter((c) => c.kind === 'proposal');

export function getContract(name) {
  const c = CONTRACTS[name];
  if (!c) throw new Error(`unknown contract "${name}" — the fourteen are: ${CONTRACT_NAMES.join(', ')}`);
  return c;
}

/* Fail at load rather than at validation time if two contracts ever
   claim the same name: a duplicate would silently shadow. */
if (CONTRACT_NAMES.length !== new Set(CONTRACT_NAMES).size) {
  throw new Error('two contracts share a name');
}
