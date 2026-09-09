/* ============================================================
   agent/simulation/dispatchers.mjs — twelve simulated specialists

   A DISPATCHER IS THE FUNCTION THAT ACTUALLY RUNS A SPECIALIST, and
   `agent/orchestrator/orchestrator.mjs` deliberately wires none:
   §12 of `docs/ORCHESTRATOR.md` calls the seam the deliverable and
   puts the first end-to-end run in SIMULATION at SESSION 24. This
   file is that simulation, and it is careful about which half it
   simulates.

   WHAT IS REAL IN A RUN THROUGH THESE. Everything except the
   specialists' reasoning: the Orchestrator, the event intake and
   its stripping, the classification, the capability register and
   every grant it issues, the handoff checks, H3, the contract
   gateway, all six conflict detectors, the provenance gate, the
   rollback gate, the autonomy policy's twelve conditions, the
   journal, the tracer, and — on the authorization leg — a real
   Control Room process with a real login and a real ledger write.

   WHAT IS SIMULATED. The eleven specialists' DOMAIN REASONING. No
   source is read, no page is opened, no dataset is examined, no
   sentence is judged. Each function here returns records from
   `fixture.mjs` and nothing else, and every record it returns is
   marked `simulated: true`.

   SO WHAT A RUN PROVES AND DOES NOT. It proves the WIRING: that the
   twelve actors can be routed, granted, handed off, refused,
   conflicted and journalled end to end, and where that machinery
   says no. It proves NOTHING about whether the Scout would have
   found that document, whether the Verifier would have confirmed
   it, or whether the Editorial agent would have quoted that
   sentence. A simulated pass is not evidence about the world, and
   `docs/FIRST-END-TO-END-AUDIT.md` §2 says so in the same words.

   EVERY DISPATCHER IS SYNCHRONOUS, PURE AND WRITES NOTHING. No
   filesystem, no network, no child process, no clock. `selftest.mjs`
   asserts the absence by reading this file, because a dispatcher
   that could write is a simulation that could change production.
   ============================================================ */

import { records } from './fixture.mjs';

/** One simulated specialist. `observe` is what the trace will carry
 *  in the agent's own span — the honest note that nothing was read. */
const sim = (agent, produce, note) => async ({ span, inputs }) => {
  span.observe({
    summary: note,
    subject: 'simulation',
    simulated: true,
    risk: 'medium',
    data: {
      agent,
      handed_in: (inputs ?? []).map((r) => r?.contract).filter(Boolean),
      what_was_not_done: 'no source was retrieved, no page was opened, no dataset was read and no sentence was judged. '
        + 'The records this stage returns are fixtures from agent/schemas/fixtures.mjs, marked simulated.',
    },
  });
  return { records: produce({ inputs: inputs ?? [] }) };
};

/**
 * The twelve dispatchable actors of `agent/orchestrator/capabilities.mjs`.
 *
 * Each returns only contracts the register lets that agent produce;
 * where one deliberately returns something it may NOT produce, the
 * scenario says so and the refusal is the observation being made.
 */
export function simulationDispatchers({ scoutFindsNothing = false } = {}) {
  return {
    'source-scout': sim('source-scout',
      () => (scoutFindsNothing ? [records.scoutGap()] : [records.sourceCandidate(), records.scoutGap()]),
      'SIMULATED Scout: no search was performed and no URL was fetched. A candidate fixture and an open gap are returned so the run carries both shapes a real scout produces — a lead, and an admitted absence.'),

    'legal-verifier': sim('legal-verifier',
      () => [records.verification()],
      'SIMULATED Verifier: no document was opened and no passage was read. The fixture VerificationRecord carries verdict "confirmed" at confidence 0.8 — which is a property of the fixture, not a finding about anything.'),

    'verification-integrator': sim('verification-integrator',
      () => [records.claimEvidence(), records.integratorGap()],
      'SIMULATED integrator: nothing in data/ was read or compared. A link and a still-open gap are returned, because an integrator that only ever produced links would hide the case this project cares most about.'),

    'regulatory-change-detector': sim('regulatory-change-detector',
      ({ inputs }) => (inputs.some((r) => r?.contract === 'RegulatoryChange' || r?.contract === 'VerificationRecord')
        ? [records.impact()]
        : [records.regulatoryChange()]),
      'SIMULATED Change Detector: no snapshot was taken and no checksum was computed. It answers the FIRST question (what changed) on a cold start and the SECOND (what that reaches inside the site) once something upstream has been handed to it, because the workflow gives it both stages and they are different questions.'),

    'data-depth': sim('data-depth',
      () => [records.depthGap(), records.depthKnowledgeGap()],
      'SIMULATED Data Depth: no dataset was profiled. A DataGap (evidence) and a KnowledgeGap (representation) are returned — the pair the registry warns is the most easily confused in this system.'),

    'proposal-router': sim('proposal-router',
      () => [records.dataProposal(), records.routerApproval()],
      'SIMULATED router: nothing was routed and nothing was drafted. The ApprovalRequest it returns is a REQUEST — agents write agent/records/, and a grant lives only in agent/implement/decisions/.'),

    'knowledge-architect': sim('knowledge-architect',
      () => [records.architectureProposal()],
      'SIMULATED Knowledge Architect: no schema was analysed and no corpus-wide tally was computed. Its autonomy ceiling in the register is human_only, and the run should show that reaching a person is the only route this stage has.'),

    editorial: sim('editorial',
      () => [records.editorialProposal(), records.editorialApproval()],
      'SIMULATED Editorial: no sentence in index.html was read and nothing was quoted. This is the one agent in the system that reads prose at all, so simulating it is the largest single hole in what this run can prove.'),

    'ux-auditor': sim('ux-auditor',
      () => [records.uxProposal()],
      'SIMULATED UX/UI: no markup, stylesheet or module was read. The real agent has never opened a page either, and every record it writes carries README limitation 7 as a blocking open question — the fixture carries the same shape.'),

    'browser-qa': sim('browser-qa',
      () => [records.browserQa()],
      'SIMULATED browser suite: NO BROWSER WAS STARTED. This is the dispatcher to distrust most, because the real one is the only thing in this repository that can see what the four validators cannot, and a simulated QAResult looks exactly like a measured one to everything downstream.'),

    'implementation-qa': sim('implementation-qa',
      () => [records.changeRecord(), records.implementationQa()],
      'SIMULATED Implementation/QA: no validator was executed, no file was written, no git operation was performed. The ChangeRecord it returns describes a change that was never applied to anything.'),

    'health-monitor': sim('health-monitor',
      () => [records.observation()],
      'SIMULATED health monitor: no metric was measured. The real monitor reports nine readings as unmeasurable in a typical run; a simulated observation reports none of that, which is itself the finding.'),
  };
}

/** A dispatcher that throws, for the leg that exercises `failed`. */
export const brokenDispatcher = async () => { throw new Error('the simulated specialist broke — this is the failure path being exercised deliberately'); };
