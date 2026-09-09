/* ============================================================
   agent/simulation/fixture.mjs — the controlled fixture SESSION 24
   runs the whole system against

   WHAT THIS IS. One coherent scenario — a plausible-SHAPED
   regulatory update — expressed as the eighteen contracts'
   registry fixtures with the producing agent's name stamped on
   each and the scenario's own ids linking them into a chain. It is
   the input to `run.mjs`, and it is the only thing the simulated
   specialists ever return.

   WHAT IT IS NOT, said first because it is the part that matters.
   NOTHING HERE IS A LEGAL FACT. Every record is `simulated: true`,
   every URL is on `example.invalid`, every entity id begins
   `simulated:`, and the "instrument" the scenario is about does not
   exist in `data/instruments.json` or anywhere else. Under
   AI-SAFE-BOUNDARIES §0.1 a fixture that read as research would be
   a worse defect than having no fixture at all, so this file is
   built ON TOP OF `agent/schemas/fixtures.mjs` rather than beside
   it: the registry fixtures are already marked, already refused by
   `validate()` unless a caller asks for a simulated record, and
   already the one worked example of each contract. A second
   hand-written set would be a second home for "what a valid record
   looks like", and the first time a contract changed the two would
   disagree.

   THE ONE PLACE THE MARK IS DELIBERATELY REMOVED is
   `unmarkedControlFixture()`, and it is removed in the open, in a
   temporary directory, for a reason `docs/FIRST-END-TO-END-AUDIT.md`
   states as a finding rather than as a convenience:
   `agent/implement/preflight.mjs` gate 2 validates a proposal with
   `allowSimulated: false`, so a simulated proposal can never reach
   gates 3 to 10. Either the simulation stops at gate 2 — which is
   the honest run, and is run first — or it clears the mark to see
   what the eight remaining gates would say. Both are run, both are
   reported, and neither record ever leaves `/tmp`.
   ============================================================ */

import { FIXTURES } from '../schemas/fixtures.mjs';

/** Every id this scenario mints carries the session and the word,
 *  so a record found loose on a disk says what it is. */
export const SCENARIO_ID = 'sim24';

export const SCENARIO = Object.freeze({
  id: SCENARIO_ID,
  title: 'A simulated implementing act moves a simulated instrument from in force to applicable',
  what_it_stands_for:
    'The commonest real shape this system exists for: a document is found, somebody reads it, the reading '
    + 'says a record in data/ is now out of date, the prose that describes that record may now be wrong, and '
    + 'somebody has to decide what the site should say. Every stage of that is exercised here against records '
    + 'that assert nothing about any real instrument.',
  not_a_legal_fact:
    'No instrument, act, date, article, authority, fine or status in this scenario exists. The entity is '
    + '"simulated:instrument", the document is on example.invalid, and every record is marked simulated:true. '
    + 'Nothing here may be quoted, cited, or carried into data/.',
});

/** Stamp the producing agent, and keep everything else the registry
 *  fixture already established. `over` is for the scenario's own
 *  links between records — never for inventing a fact. */
const by = (contract, agent, over = {}) => ({ ...FIXTURES[contract](), agent, ...over });

/* The one entity the whole scenario is about. It is not in
   data/instruments.json and the simulation never looks for it
   there. */
export const TARGET_ENTITY = Object.freeze({
  kind: 'instrument', id: 'simulated:instrument',
  path: 'data/instruments.json', field: 'legislative_status',
  note: 'A simulated entity. No such instrument record exists in this repository.',
});

/* ---------------------------------------------------------- the records */

export const records = Object.freeze({
  /* 1 · Source Scout — a lead, not a finding. */
  sourceCandidate: () => by('SourceCandidate', 'source-scout'),

  /* Scout's other legitimate output: it found nothing conclusive and
     says so. Carried so the run shows an agent producing a gap
     rather than only producing good news. */
  scoutGap: () => by('DataGap', 'source-scout'),

  /* 2 · Legal Verifier — the only role that may move a record from
     uncertain toward certain, and only through Class C. */
  verification: () => by('VerificationRecord', 'legal-verifier'),

  /* 3 · the adapter — turns a verification into a proposal against
     the corpus, preserving whatever the verifier refused to settle. */
  claimEvidence: () => by('ClaimEvidence', 'verification-integrator'),
  integratorGap: () => by('DataGap', 'verification-integrator'),

  /* 4 · Change Detector — what changed in the world, then what that
     reaches inside this website. Two questions, two contracts. */
  regulatoryChange: () => by('RegulatoryChange', 'regulatory-change-detector'),
  impact: () => by('ImpactAssessment', 'regulatory-change-detector'),

  /* 5 · Data Depth — how thin, where, and what a reader cannot
     answer because of it. */
  depthGap: () => by('DataGap', 'data-depth'),
  depthKnowledgeGap: () => by('KnowledgeGap', 'data-depth'),

  /* 6 · the router — routes the gap, drafts only where the evidence
     is already held. */
  dataProposal: () => by('DataProposal', 'proposal-router'),
  routerApproval: () => by('ApprovalRequest', 'proposal-router'),

  /* 7 · Knowledge Architect — representation, not evidence. */
  architectureProposal: () => by('ArchitectureProposal', 'knowledge-architect'),

  /* 8 · Editorial — the only thing here that reads a sentence. */
  editorialProposal: () => by('EditorialProposal', 'editorial'),
  editorialApproval: () => by('ApprovalRequest', 'editorial'),

  /* 9 · UX/UI — audits markup, stylesheets and modules, and has
     never opened a page. */
  uxProposal: () => by('UXProposal', 'ux-auditor'),

  /* 10 · the browser suite — the only thing here that opens one. */
  browserQa: () => by('QAResult', 'browser-qa'),

  /* 11 · Implementation/QA. */
  changeRecord: () => by('ChangeRecord', 'implementation-qa'),
  implementationQa: () => by('QAResult', 'implementation-qa'),

  /* 12 · the health monitor — three domains, never summed. */
  observation: () => by('AgentObservation', 'health-monitor'),
});

/**
 * The proposal the authorization leg is about, with the simulated
 * mark cleared so `preflight` gate 2 can be got past and gates 3–10
 * observed at all.
 *
 * READ THE HEADER BEFORE USING THIS. It exists because the
 * simulation boundary and the implementation gate are in tension,
 * which is a finding this session records rather than repairs. It
 * is written only into a temporary record store, it is never
 * offered to `data/`, and `selftest.mjs` asserts that no unmarked
 * record ever appears under the repository root.
 */
export function unmarkedControlFixture() {
  const p = records.editorialProposal();
  return {
    ...p,
    simulated: false,
    evidence: (p.evidence ?? []).map((e) => ({ ...e, simulated: false })),
    proposal_id: `${SCENARIO_ID}-${p.proposal_id}`,
  };
}

/** The same proposal, honestly marked. The first thing the
 *  authorization leg tries. */
export function markedProposal() {
  const p = records.editorialProposal();
  return { ...p, proposal_id: `${SCENARIO_ID}-marked-${p.proposal_id}` };
}
