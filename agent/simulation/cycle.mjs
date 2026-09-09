/* ============================================================
   agent/simulation/cycle.mjs — the agent graph, as data

   THE ORDER IS THE ARGUMENT. Protocol §25 asks for one complete
   cycle, and a cycle in this system is not one workflow: it is the
   lifecycle in `docs/ORCHESTRATOR.md` §2 —

     OBSERVE → DISCOVER → VERIFY → CLASSIFY → PROPOSE → PRIORITIZE
             → HUMAN DECISION → AUTHORIZE → IMPLEMENT → VALIDATE
             → DEPLOY → OBSERVE → LEARN

   — walked once, which takes eight of the ten workflow types plus
   the Control Room's authorization leg between PRIORITIZE and
   AUTHORIZE. Declared as DATA for the same reason
   `workflows.mjs` and `.control-room/server.mjs` declare their
   tables as data: a graph implemented as a function is a graph
   nobody can assert against.

   TWO TYPES ARE NOT WALKED, and saying which is part of the
   deliverable. `NEW_SOURCE` is not, because
   `VERIFICATION_REQUIRED` covers the same scout → verify → integrate
   chain and adds the Scout stage that NEW_SOURCE assumes already
   happened; running both would duplicate the leg without adding an
   observation. `EDITORIAL_IMPACT` is not walked on its own, because
   `LEGAL_CHANGE` reaches the Editorial agent through its
   `editorial_impact` stage, which is the route a real regulatory
   update takes. Both absences are recorded in
   `docs/FIRST-END-TO-END-AUDIT.md` §7 as coverage this run does not
   have rather than coverage it does.
   ============================================================ */

export const LEGS = Object.freeze([
  {
    leg: 1,
    lifecycle: 'DISCOVER → VERIFY',
    workflow_type: 'VERIFICATION_REQUIRED',
    agents: ['source-scout', 'legal-verifier', 'verification-integrator'],
    event: { source: 'agent', kind: 'gap_detected', subject: { contract: 'DataGap', id: 'gap-simulated-001' }, summary: 'A simulated record asserts something no source has been read for.' },
    why: 'The Scout → Verifier → integrator chain, and the H3 pair the workflow forbids one agent holding: scout and verify.',
  },
  {
    leg: 2,
    lifecycle: 'OBSERVE → CLASSIFY → PROPOSE',
    workflow_type: 'LEGAL_CHANGE',
    agents: ['regulatory-change-detector', 'legal-verifier', 'editorial'],
    event: { source: 'agent', kind: 'change_detected', subject: { contract: 'RegulatoryChange', id: 'chg-simulated-001' }, summary: 'A simulated implementing act is said to move a simulated instrument from in force to applicable.' },
    why: 'The scenario\'s spine: what changed in the world, a second agent reading the source, what the change reaches inside the site, and whether the prose still holds.',
  },
  {
    leg: 3,
    lifecycle: 'PROPOSE (evidence)',
    workflow_type: 'DATA_GAP',
    agents: ['data-depth', 'proposal-router'],
    event: { source: 'agent', kind: 'gap_detected', subject: { contract: 'DataGap', id: 'gap-simulated-001' }, summary: 'A simulated value exists and is unsupported.' },
    why: 'Data Depth and the router. The one leg where a value could be drafted, and the gate that stops a gap being closed with a substitute.',
  },
  {
    leg: 4,
    lifecycle: 'PROPOSE (representation)',
    workflow_type: 'ARCHITECTURE_GAP',
    agents: ['knowledge-architect'],
    event: { source: 'agent', kind: 'gap_detected', subject: { contract: 'KnowledgeGap', id: 'kg-simulated-001' }, summary: 'The simulated model has no place for a concept the simulated corpus needs.' },
    why: 'The Knowledge Architect, whose autonomy ceiling is human_only and whose changes have the widest reach in the project.',
  },
  {
    leg: 5,
    lifecycle: 'PROPOSE (interface)',
    workflow_type: 'UX_FINDING',
    agents: ['ux-auditor', 'browser-qa'],
    event: { source: 'agent', kind: 'audit_finding', subject: { contract: 'UXProposal', id: 'prop-ux-simulated-001' }, summary: 'A simulated interface finding, with the optional browser measurement behind it.' },
    why: 'UX/UI and the one optional stage in the ten types. The browser dispatcher here is SIMULATED, which is the single most misleading record in the whole run.',
  },
  {
    leg: 6,
    lifecycle: 'HUMAN DECISION → AUTHORIZE',
    workflow_type: 'IMPLEMENTATION_REQUEST',
    agents: ['implementation-qa', 'browser-qa'],
    event: { source: 'control_room', kind: 'implementation_requested', summary: 'A decided proposal is routed to implementation.' },
    why: 'The one workflow that can reach the site, and the one with the most gates in front of it. Run TWICE: once against the honestly simulated proposal, and once against the control fixture with the mark cleared, because gate 2 of preflight refuses a simulated record and the eight gates behind it would otherwise never be observed.',
    needs_authorization: true,
  },
  {
    leg: 7,
    lifecycle: 'VALIDATE',
    workflow_type: 'QA_FAILURE',
    agents: ['implementation-qa'],
    event: { source: 'agent', kind: 'qa_regression', subject: { contract: 'QAResult', id: 'qa-simulated-001' }, summary: 'A simulated check came back worse than the recorded baseline.' },
    why: 'The rollback gate, and the rule that a failing check is never made to pass by weakening the check.',
  },
  {
    leg: 8,
    lifecycle: 'DEPLOY → OBSERVE → LEARN',
    workflow_type: 'POST_DEPLOYMENT_EVENT',
    agents: ['health-monitor', 'browser-qa'],
    event: { source: 'agent', kind: 'post_deployment', subject: { contract: 'AgentObservation', id: 'obs-simulated-001' }, summary: 'A simulated observation after a change reached the tree.' },
    why: 'Observability. The type carries its own cannot_see: the deployed origin has never been fetched by anything in this repository.',
  },
]);

/** The eleven specialists plus the browser suite, the person and the
 *  Orchestrator: the graph's nodes, in the order the user's brief
 *  names them. */
export const GRAPH_ORDER = Object.freeze([
  'source-scout', 'legal-verifier', 'verification-integrator', 'regulatory-change-detector',
  'data-depth', 'proposal-router', 'knowledge-architect', 'editorial', 'ux-auditor',
  'browser-qa', 'implementation-qa', 'health-monitor', 'human', 'orchestrator',
]);

export const NOT_WALKED = Object.freeze([
  { workflow_type: 'NEW_SOURCE', why: 'VERIFICATION_REQUIRED walks the same verify → integrate chain and adds the scout stage NEW_SOURCE assumes has already happened.' },
  { workflow_type: 'EDITORIAL_IMPACT', why: 'LEGAL_CHANGE reaches the Editorial agent through its editorial_impact stage, which is the route a real regulatory update takes.' },
]);
