/* ============================================================
   agent/orchestrator/workflows.mjs — the ten workflow types, and
   what each one is allowed to be

   SESSION 22 names ten: NEW_SOURCE, VERIFICATION_REQUIRED,
   LEGAL_CHANGE, DATA_GAP, ARCHITECTURE_GAP, EDITORIAL_IMPACT,
   UX_FINDING, IMPLEMENTATION_REQUEST, QA_FAILURE,
   POST_DEPLOYMENT_EVENT. They are declared here as DATA, for the
   same reason `.control-room/server.mjs` declares its route table as
   data: a table can be asserted against, and a workflow implemented
   as a function is a workflow whose shape nobody can check.

   A STAGE IS ONE OF THREE KINDS, AND THE DISTINCTION IS THE POINT.

     dispatch  a specialist is asked to do its own reasoning. The
               Orchestrator hands it a grant and takes back records.
               It does not do the work and it does not second-guess
               the result — §14: "The Master Orchestrator coordinates
               specialist agents. It MUST NOT replace their domain
               reasoning."

     gate      the Orchestrator's OWN work: approval, autonomy,
               conflict, provenance, scope. This is the only
               reasoning it is entitled to do, and every gate is
               mechanical.

     human     the work stops and a person decides. Not a
               notification — a stage, with a state, that the
               workflow cannot pass through on its own.

   WHY THE LAST STAGE OF EVERY TYPE IS `human`. Protocol §26: the
   first real-world operating cycle is OBSERVE + PROPOSE ONLY, and
   §20 restricts autonomous production action to explicitly approved
   low-risk categories — of which this session approves none. So no
   workflow here can reach `completed` by publishing something. Two
   types can reach it by having proposed nothing at all
   (`completes_without_human: 'only_if_nothing_proposed'`), because
   a measurement that found nothing is finished, and calling it
   `human_review_required` would put an empty page in front of a
   person and teach them to stop reading the queue.

   HANDOFF ORDER IS NOT DECORATION. `docs/AGENT-ROLES.md` H3 — no
   agent verifies its own output — is why NEW_SOURCE has a verifier
   stage that is a different agent from the scout, and why
   LEGAL_CHANGE has the detector assess the site's exposure only
   AFTER a verifier has taken the change itself.

   `same_agent_forbidden` NAMES PAIRS OF STAGES, NOT PAIRS OF
   AGENTS, and the distinction cost this session a test. Written as
   agent names, the rule fires exactly when the design is HONOURED —
   "the detector ran, and now the verifier is running" is the
   intended sequence, not a collision. Written as stage names it
   says the thing H3 actually says: whoever runs `detect` may not
   also run `verify`. The table assigns different agents to both
   today, so the rule guards a table somebody writes later, and the
   Orchestrator carries a second check that fires on the real case —
   an agent handed a record it produced itself.

   ON POST_DEPLOYMENT_EVENT, SAID BEFORE ANYBODY BUILDS ON IT.
   Nothing in this repository has ever fetched the deployed origin
   (`docs/AUDIT-2026-09-01.md` F-12, and `docs/CONTROL-ROOM.md` §11
   one layer down). A POST_DEPLOYMENT_EVENT here is therefore an
   event observed about the REPOSITORY and about a locally served
   render — never about what a reader actually loaded. The type
   exists because the protocol names it and because the observation
   is worth routing; its declaration says what it cannot see, so
   that a future session wiring real telemetry adds a capability
   rather than discovering the type was lying.
   ============================================================ */

import { CONTRACT_NAMES } from '../schemas/registry.mjs';
import { AGENT_NAMES, CAPABILITIES } from './capabilities.mjs';

/** SESSION 22's five end states, and nothing else may terminate a
 *  workflow. */
export const END_STATES = Object.freeze(['completed', 'rejected', 'unresolved', 'human_review_required', 'failed']);

/** What each end state MEANS, written down because four of the five
 *  are easy to substitute for one another and every substitution
 *  loses a fact. */
export const END_STATE_MEANING = Object.freeze({
  completed: 'the workflow did everything it was for, and there is nothing left. It does NOT mean anything was published: no workflow here publishes.',
  rejected: 'a person decided against it. Not a failure, and not unresolved — somebody looked and said no.',
  unresolved: 'the work ran and could not settle the question. An empty result, a contradiction the schema cannot hold, an absence that was established rather than assumed. A valid deliverable (H6), and never softened into "completed".',
  human_review_required: 'the workflow reached the point where a person has to decide, and stopped there. It is waiting, not finished.',
  failed: 'the machinery broke: a dispatch threw, a record would not validate, a handoff could not be made. A defect in the system, not a finding about the world.',
});

export const STAGE_KINDS = Object.freeze(['dispatch', 'gate', 'human']);

/** The gates the Orchestrator itself performs. Each is implemented
 *  in one named module, and a gate named here with no
 *  implementation fails the load check at the foot of this file. */
export const GATES = Object.freeze([
  'approval',      // approval.mjs — governed approval state, re-derived
  'autonomy',      // policy.mjs   — protocol §18's mandatory conditions
  'conflict',      // conflict.mjs — two roles disagreeing stops the chain
  'provenance',    // policy.mjs   — every material proposition traceable
  'scope',         // approval.mjs — implementation scope matches approved scope
  'rollback',      // policy.mjs   — §17, a mechanically meaningful path
]);

const dispatch = (stage, agent, needs, why, extra = {}) => ({ stage, kind: 'dispatch', agent, needs, required: true, why, ...extra });
const gate = (stage, name, why) => ({ stage, kind: 'gate', gate: name, required: true, why });
const human = (why) => ({ stage: 'human_review', kind: 'human', required: true, why });

export const WORKFLOWS = Object.freeze({

  NEW_SOURCE: {
    id: 'NEW_SOURCE',
    what: 'a candidate source has been found and nobody has read it against the record it bears on.',
    entry_contracts: ['SourceCandidate'],
    stages: [
      dispatch('verify', 'legal-verifier', ['VerificationRecord'],
        'open the source, read the passage, and decide whether it carries what the record says — or refuse. A Scout\'s output is a lead, not a finding.'),
      dispatch('integrate', 'verification-integrator', ['DataProposal', 'ClaimEvidence', 'DataGap', 'ApprovalRequest'],
        'turn the outcome into a proposal against the real corpus, preserving whatever the verifier refused to settle.'),
      gate('provenance_gate', 'provenance', 'a proposal whose factual propositions are not traceable to the evidence does not reach a person.'),
      gate('conflict_gate', 'conflict', 'where the verifier and the corpus disagree, the chain stops here (H7).'),
      human('attaching a source to a claim is Class C: the agent prepares it, a human approves it.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['always — a source attached to a claim changes what the site says it can prove.'],
    completes_without_human: 'never',
    never: 'the agent that scouted the candidate may not be the agent that verifies it (H3).',
  },

  VERIFICATION_REQUIRED: {
    id: 'VERIFICATION_REQUIRED',
    what: 'a record in the corpus asserts something no source has been read for. 106 of them carry an unverified note.',
    entry_contracts: ['DataGap', 'ClaimEvidence'],
    stages: [
      dispatch('scout', 'source-scout', ['SourceCandidate', 'DataGap'],
        'find something that bears on the record. An empty result is a correct result, and so is an established absence.'),
      dispatch('verify', 'legal-verifier', ['VerificationRecord'],
        'read it. The Verifier is the only role that may move a record from uncertain to certain, and only through Class C.'),
      dispatch('integrate', 'verification-integrator', ['DataProposal', 'ClaimEvidence', 'DataGap', 'ApprovalRequest'],
        'write the proposal, or record that the gap is still open.'),
      gate('provenance_gate', 'provenance', 'clearing requires_verification without having read the source is a prohibited action under every autonomy class.'),
      human('moving a record from uncertainty toward certainty is Class C, and the unverified count is not a number to be reduced by any other means.'),
    ],
    same_agent_forbidden: [['scout', 'verify']],
    human_review_when: ['always — this is the one transition docs/SOURCE-POLICY.md §2 guards most closely.'],
    completes_without_human: 'only_if_nothing_proposed',
    never: 'a scout finding nothing is a result. It is never rewritten as "no source exists", and never closed with a loosely related substitute.',
  },

  LEGAL_CHANGE: {
    id: 'LEGAL_CHANGE',
    what: 'the world moved past the record — an instrument adopted, a decision taken, a deadline passed, a status changed.',
    entry_contracts: ['RegulatoryChange', 'SourceCandidate'],
    stages: [
      dispatch('detect', 'regulatory-change-detector', ['RegulatoryChange'],
        'establish what changed, with the evidence that it changed.'),
      dispatch('verify', 'legal-verifier', ['VerificationRecord'],
        'a change detected is not a change confirmed. A different agent reads the source.'),
      dispatch('assess_impact', 'regulatory-change-detector', ['ImpactAssessment'],
        'what a confirmed change reaches inside this website. A different question from what changed in the world, which is why it is a separate stage and a separate contract.'),
      dispatch('editorial_impact', 'editorial', ['EditorialProposal', 'ApprovalRequest'],
        'whether the prose now misdescribes the data. The validators do not read prose; this is the only thing here that does.'),
      gate('conflict_gate', 'conflict', 'a detection the verifier contradicts stops here rather than reaching a proposal.'),
      human('a legal conclusion, and every change to the brief\'s prose, is Class C at least.'),
    ],
    same_agent_forbidden: [['detect', 'verify']],
    human_review_when: ['always — legal interpretation and legal conclusions are reserved to a person under protocol §8 and §19.'],
    completes_without_human: 'never',
    never: 'the detector may not verify its own detection, and an ImpactAssessment may not restate the change it references — the four fields that would be a second copy are named in its contract\'s forbidden block.',
  },

  DATA_GAP: {
    id: 'DATA_GAP',
    what: 'a value exists and is unsupported, or a value a reader would look for is missing.',
    entry_contracts: ['DataGap', 'KnowledgeGap'],
    stages: [
      dispatch('assess', 'data-depth', ['DataGap', 'KnowledgeGap'],
        'how thin, where, and what a reader cannot answer because of it.'),
      dispatch('route', 'proposal-router', ['DataProposal', 'ApprovalRequest'],
        'route the gap to whoever can close it, and draft only where the evidence is already held.'),
      gate('provenance_gate', 'provenance', 'a gap closed with a plausible substitute is worse than an admitted gap, because it looks resolved.'),
      human('any new or amended value in data/ is Class C.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['always for a drafted value; a gap that can only be routed and not drafted still goes to a person, because deciding it is unclosable is a judgement.'],
    completes_without_human: 'only_if_nothing_proposed',
    never: 'a gap is never closed by declaring it closed, and unknown never becomes zero.',
  },

  ARCHITECTURE_GAP: {
    id: 'ARCHITECTURE_GAP',
    what: 'the model has no place for a concept the corpus needs. Representation, not evidence.',
    entry_contracts: ['KnowledgeGap'],
    stages: [
      dispatch('model', 'knowledge-architect', ['KnowledgeGap', 'ArchitectureProposal', 'ApprovalRequest'],
        'what the model cannot hold, and what holding it would cost across the whole corpus.'),
      gate('conflict_gate', 'conflict', 'a proposed schema change that contradicts a live derivation stops here.'),
      human('schema and taxonomy changes are reserved to a person under protocol §8 and §19, with the corpus-wide tally diff.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['always — a derivation change touches every record, and this role\'s changes have the widest reach in the project.'],
    completes_without_human: 'never',
    never: 'IDs are never renamed, a fourth state is never introduced, and a derivation is never changed to alter how specific records come out.',
  },

  EDITORIAL_IMPACT: {
    id: 'EDITORIAL_IMPACT',
    what: 'the prose may now say something the data no longer supports.',
    entry_contracts: ['ImpactAssessment', 'RegulatoryChange', 'DataProposal', 'VerificationRecord'],
    stages: [
      dispatch('read', 'editorial', ['EditorialProposal', 'ApprovalRequest'],
        'read the sentence against the record and quote what disagrees. It can only find what it can quote.'),
      gate('provenance_gate', 'provenance', 'a proposed sentence with no claim behind it is the exact substitution this project is arranged against.'),
      human('prose in index.html is Class C, and it carries the superseded declaration for every locale holding a translation.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['always — what the site should say is not an agent\'s decision, which is why the editorial agent drafts a value for one kind of finding only.'],
    completes_without_human: 'only_if_nothing_proposed',
    never: 'editing an English string carrying a data-i18n key without declaring it superseded in every locale — this has already shipped once.',
  },

  UX_FINDING: {
    id: 'UX_FINDING',
    what: 'the interface fails somebody, or a browser run found something the four validators cannot see.',
    entry_contracts: ['UXProposal', 'QAResult'],
    stages: [
      dispatch('audit', 'ux-auditor', ['UXProposal', 'ApprovalRequest'],
        'audit the markup, the stylesheets and the modules. Every record it writes carries README limitation 7 as a blocking open question, because it has never opened a page.'),
      dispatch('measure', 'browser-qa', ['QAResult'],
        'open the pages and read the rendered DOM, which is the only thing here that can close some of those questions by measurement.',
        { required: false, why_optional: 'a machine with no browser gets exit 2, and a UX finding is still a finding. The workflow records that the measurement did not run rather than reporting a pass.' }),
      human('interface work is Class C; it is prepared and a person approves it.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['always — the UX agent drafts no value and adds no token, so every one of its proposals needs somebody to decide what the interface should do instead.'],
    completes_without_human: 'only_if_nothing_proposed',
    never: 'redesigning the website. It is out of scope for the role and it is Class D.',
  },

  IMPLEMENTATION_REQUEST: {
    id: 'IMPLEMENTATION_REQUEST',
    what: 'a proposal is to be implemented. The one workflow that can reach the site at all, and the one with the most gates in front of it.',
    entry_contracts: CONTRACT_NAMES.filter((n) => n.endsWith('Proposal')),
    stages: [
      gate('approval_gate', 'approval', 'the eight checks SESSION 22 requires before an approved proposal reaches implementation. Approval is re-derived from the ledger; nothing the request says about it is read.'),
      gate('scope_gate', 'scope', 'the implementation scope must match the approved scope. A request naming a file the proposal does not is refused, not intersected.'),
      gate('autonomy_gate', 'autonomy', 'protocol §18: every mandatory condition, and one failure blocks.'),
      gate('rollback_gate', 'rollback', 'protocol §17: a mechanically meaningful path, not a boolean.'),
      dispatch('implement', 'implementation-qa', ['ChangeRecord', 'QAResult'],
        'the Implementation Agent runs its own ten gates again. Two independent derivations of the same authorization is the design, not a duplication: this one is the Orchestrator refusing to route, and that one is the implementer refusing to write.'),
      dispatch('browser_qa', 'browser-qa', ['QAResult'],
        'where the change touches something the four validators cannot see.',
        { required: false, why_optional: 'required by scope rather than by type — agent/implement/scope.mjs requiresBrowserQA() decides, and where it says yes a missing browser is a blocking failure rather than a skip.' }),
      human('no automatic production publishing. Nothing here merges, pushes or deploys, under any outcome.'),
    ],
    same_agent_forbidden: [],
    human_review_when: [
      'the proposal is not granted in the decision ledger',
      'the grant does not bind to the proposal as it now stands',
      'the requested scope exceeds the approved scope',
      'any mandatory autonomy condition fails',
      'always before anything is published — publication is not in this workflow at all',
    ],
    completes_without_human: 'never',
    never: 'treating an ApprovalRequest in agent/records/ as a grant. Agents write that directory; a grant lives in agent/implement/decisions/ and nowhere else.',
  },

  QA_FAILURE: {
    id: 'QA_FAILURE',
    what: 'a check came back worse than the recorded baseline, or a browser run found a regression.',
    entry_contracts: ['QAResult'],
    stages: [
      dispatch('assess', 'implementation-qa', ['QAResult'],
        'what failed, verbatim, against the baseline in docs/CURRENT-ARCHITECTURE.md §12. A new warning is a finding, not noise.'),
      gate('rollback_gate', 'rollback', 'if something was applied under this workflow\'s parent, the path back is named before anything else is considered.'),
      human('a failing check is never made to pass by weakening the check. That is prohibited under every autonomy class, so the only route forward is a person.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['always — every cheap way out of a failing validator is on the prohibited list, so the decision is a person\'s.'],
    completes_without_human: 'never',
    never: 'deleting a check, widening an exemption, or downgrading an error to a warning to obtain a passing result.',
  },

  POST_DEPLOYMENT_EVENT: {
    id: 'POST_DEPLOYMENT_EVENT',
    what: 'something was observed after a change reached the tree. Measurement, not telemetry.',
    entry_contracts: ['AgentObservation', 'WebsiteChange', 'QAResult'],
    stages: [
      dispatch('measure', 'health-monitor', ['AgentObservation'],
        'the three domains, never summed, with every unmeasurable saying why.'),
      dispatch('browser_check', 'browser-qa', ['QAResult'],
        'open the pages that changed.',
        { required: false, why_optional: 'no browser on the machine is exit 2 and the run says so. Six public-website metrics report unmeasurable in that case rather than reporting zero.' }),
      human('a finding about the deployed site is a finding somebody has to act on, and nothing here can act on the deployed site.'),
    ],
    same_agent_forbidden: [],
    human_review_when: ['whenever the measurement produced a finding. A run that found nothing completes.'],
    completes_without_human: 'only_if_nothing_proposed',
    /* The honest bound on the whole type. */
    cannot_see: 'THE DEPLOYED ORIGIN HAS NEVER BEEN FETCHED. Nothing in this repository performs network I/O against the live site: freshness.mjs prints a SOURCE REACHABILITY heading and makes no request (AUDIT F-12), and no Control Room instance has ever been reached (docs/CONTROL-ROOM.md §11). A POST_DEPLOYMENT_EVENT here is an observation about the repository and about a locally served render. It is not evidence about what a reader loaded, and this workflow may not be described as if it were.',
    never: 'reporting an absence of instrumentation as an absence of problems.',
  },
});

export const WORKFLOW_TYPES = Object.freeze(Object.keys(WORKFLOWS));

export function getWorkflow(type) {
  const w = WORKFLOWS[type];
  if (!w) throw new Error(`unknown workflow type "${type}". The ten are: ${WORKFLOW_TYPES.join(', ')}`);
  return w;
}

export const stagesOf = (type) => getWorkflow(type).stages;
export const dispatchStages = (type) => stagesOf(type).filter((s) => s.kind === 'dispatch');
export const agentsFor = (type) => [...new Set(dispatchStages(type).map((s) => s.agent))];

/* ============================================================
   Classification
   ============================================================ */

/**
 * Which workflow an event opens.
 *
 * IT DOES NOT GUESS. An event that matches nothing comes back
 * `unclassified` with what was looked at, and the Orchestrator
 * routes it to a person. The alternative — picking the nearest type
 * — produces a workflow that runs the wrong specialists and reports
 * a result about the wrong question, and it does it silently.
 *
 * Matching is on the two things an event actually carries: an
 * explicit `workflow_type`, and the contract of the record it is
 * about. An explicit type is CHECKED against the record rather than
 * believed: an event that says LEGAL_CHANGE and carries a UXProposal
 * is a contradiction, and a contradiction is not resolved by
 * preferring whichever field is easier to read.
 */
export function classify(event) {
  const looked_at = { declared_type: event?.workflow_type ?? null, contract: event?.subject?.contract ?? null, kind: event?.kind ?? null };

  const declared = event?.workflow_type ?? null;
  const contract = event?.subject?.contract ?? null;

  if (declared && !WORKFLOW_TYPES.includes(declared)) {
    return { type: null, state: 'unclassified', why: `the event declares workflow type "${declared}", which is not one of the ten.`, looked_at, candidates: [] };
  }

  const byContract = contract
    ? WORKFLOW_TYPES.filter((t) => WORKFLOWS[t].entry_contracts.includes(contract))
    : [];

  if (declared) {
    if (!contract) {
      return { type: declared, state: 'classified', why: `the event declares ${declared} and carries no record to check it against. The declaration is taken, and the workflow records that nothing corroborated it.`, looked_at, candidates: [declared], corroborated: false };
    }
    if (byContract.includes(declared)) {
      return { type: declared, state: 'classified', why: `the event declares ${declared} and carries a ${contract}, which is one of that type's entry contracts.`, looked_at, candidates: byContract, corroborated: true };
    }
    return {
      type: null, state: 'unclassified',
      why: `the event declares ${declared} but carries a ${contract}, which is not one of that type's entry contracts (${WORKFLOWS[declared].entry_contracts.join(', ')}). A declaration and a record that disagree is a contradiction, and it is not resolved by preferring one of them.`,
      looked_at, candidates: byContract,
    };
  }

  if (byContract.length === 1) {
    return { type: byContract[0], state: 'classified', why: `a ${contract} is an entry contract for exactly one workflow type.`, looked_at, candidates: byContract, corroborated: true };
  }
  if (byContract.length > 1) {
    return {
      type: null, state: 'unclassified',
      why: `a ${contract} is an entry contract for ${byContract.length} workflow types (${byContract.join(', ')}), and nothing in the event says which. Picking one would decide by convenience what a person can decide by knowing.`,
      looked_at, candidates: byContract,
    };
  }
  return {
    type: null, state: 'unclassified',
    why: contract
      ? `nothing routes a ${contract}: it is not an entry contract for any of the ten workflow types.`
      : 'the event names no workflow type and carries no record. There is nothing to classify from.',
    looked_at, candidates: [],
  };
}

/* ---------------------------------------------------------- load checks

   Every one of these would be a routing defect, and a routing
   defect that first shows up when somebody runs the workflow is a
   routing defect that shipped.                                    */

for (const [type, w] of Object.entries(WORKFLOWS)) {
  if (w.id !== type) throw new Error(`workflow ${type} carries id "${w.id}"`);
  if (!w.stages.length) throw new Error(`workflow ${type} has no stages`);
  for (const c of w.entry_contracts) {
    if (!CONTRACT_NAMES.includes(c)) throw new Error(`workflow ${type} names entry contract "${c}", which is not one of the eighteen`);
  }
  for (const s of w.stages) {
    if (!STAGE_KINDS.includes(s.kind)) throw new Error(`workflow ${type} stage "${s.stage}" has kind "${s.kind}"`);
    if (s.kind === 'dispatch') {
      if (!AGENT_NAMES.includes(s.agent)) throw new Error(`workflow ${type} stage "${s.stage}" dispatches to "${s.agent}", which is not in the capability register`);
      if (!CAPABILITIES[s.agent].dispatchable) throw new Error(`workflow ${type} stage "${s.stage}" dispatches to "${s.agent}", which is not dispatchable`);
      const outside = s.needs.filter((n) => !CAPABILITIES[s.agent].produces.includes(n));
      if (outside.length) throw new Error(`workflow ${type} stage "${s.stage}" asks "${s.agent}" for ${outside.join(', ')}, which it may not produce. A stage cannot widen an agent.`);
    }
    if (s.kind === 'gate' && !GATES.includes(s.gate)) throw new Error(`workflow ${type} stage "${s.stage}" names gate "${s.gate}", which is not implemented`);
  }
  for (const pair of w.same_agent_forbidden ?? []) {
    for (const name of pair) {
      if (!w.stages.some((s) => s.stage === name)) throw new Error(`workflow ${type} forbids pairing stage "${name}", which it does not have. The pairs are STAGE names — written as agent names the rule fires when the design is honoured.`);
    }
  }
  const last = w.stages[w.stages.length - 1];
  if (last.kind !== 'human') throw new Error(`workflow ${type} does not end at a human stage. No workflow in this system may terminate by acting.`);
  if (!['never', 'only_if_nothing_proposed'].includes(w.completes_without_human)) {
    throw new Error(`workflow ${type} declares completes_without_human "${w.completes_without_human}"`);
  }
}

/** The table, for `cli.mjs workflows` and for the Control Room. */
export function describeWorkflows() {
  return WORKFLOW_TYPES.map((t) => {
    const w = WORKFLOWS[t];
    return {
      type: t, what: w.what,
      entry_contracts: w.entry_contracts,
      stages: w.stages.map((s) => ({ stage: s.stage, kind: s.kind, agent: s.agent ?? null, gate: s.gate ?? null, needs: s.needs ?? [], required: s.required !== false, why: s.why, why_optional: s.why_optional ?? null })),
      same_agent_forbidden: w.same_agent_forbidden,
      human_review_when: w.human_review_when,
      completes_without_human: w.completes_without_human,
      cannot_see: w.cannot_see ?? null,
      never: w.never,
    };
  });
}
