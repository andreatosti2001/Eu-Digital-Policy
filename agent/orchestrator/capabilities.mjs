/* ============================================================
   agent/orchestrator/capabilities.mjs — what each specialist may
   do, and the fact that being routed a task does not enlarge it

   SESSION 22, AGENT PERMISSIONS: "Each specialist agent MUST operate
   within an explicit capability boundary. An agent must not gain
   broader permissions merely because another agent requested an
   action; the Orchestrator routed a task; a Control Room user
   clicked a button."

   Those three sentences describe three different ways a permission
   system leaks, and all three have the same shape: authority
   arriving with the REQUEST rather than being held by the ACTOR.
   This module is arranged so that shape is impossible to express.

   THE GRANT IS AN INTERSECTION, NEVER A UNION. `grantFor()` takes
   the capability the agent holds and the need the stage declares,
   and returns what is in BOTH. A stage that declares a need the
   agent does not hold produces an EMPTY grant and a refusal naming
   the difference — it does not produce a grant covering the stage's
   need. A union would mean any workflow author could widen any
   agent by writing a more ambitious stage, which is the second
   sentence of the three above, implemented by accident.

   NOTHING IN THIS MODULE READS AN ARGUMENT ABOUT PERMISSION.
   `grantFor` takes an agent name and a stage; it has no `extra`, no
   `also`, no `permissions` parameter. `checkOutput` takes a grant
   and a record and compares them; it has no `force`. The whole
   point of a capability boundary is that the thing being bounded
   does not get to supply the bound.

   A GRANT IS FOR ONE STAGE OF ONE WORKFLOW AND DIES WITH IT. It
   carries the workflow id and the stage, so a grant cannot be
   replayed onto a later stage. `checkOutput` refuses a record
   presented under a grant issued for a different stage.

   NO AGENT MAY DECIDE, AND THAT IS NOT A FIELD ANYBODY CAN SET.
   `may_decide` is false on every entry below and `MAY_DECIDE` is
   frozen empty: a decision lives in
   `agent/implement/decisions/decisions.jsonl` and reaches it
   through one function which refuses any name that belongs to an
   agent in this system (`agent/implement/ledger.mjs
   recordDecision`). The register says so as well so that a reader
   of THIS file does not have to go and check.

   WHAT THIS IS NOT. It is not a sandbox. Nothing here prevents a
   module from calling `writeFileSync`; this repository has no
   process isolation and this file does not pretend to add any. What
   it does is make every dispatch state, in a record a reviewer can
   read afterwards, exactly what the agent was permitted to produce
   — and refuse the output that exceeds it before the Orchestrator
   passes it on. A boundary at the handoff is the boundary this
   architecture can actually hold, and saying which one it is beats
   implying a stronger one.
   ============================================================ */

import { AUTONOMY_CLASSES, AUTONOMY_RANK } from '../schemas/types.mjs';
import { CONTRACT_NAMES, getContract } from '../schemas/registry.mjs';

/** Nobody. Frozen so that "add yourself to the list" is a source
 *  change in a reviewed file rather than a runtime assignment. */
export const MAY_DECIDE = Object.freeze([]);

/** The one agent that may write to the site at all, and only under
 *  a grant it re-derives itself through its own ten gates. */
export const MAY_IMPLEMENT = Object.freeze(['implementation-qa']);

/**
 * The eleven specialists, plus the two non-agent actors the
 * Orchestrator has to be able to name.
 *
 * `produces` is the exhaustive list of contracts the agent may put
 * on a handoff. It was read off each agent's own module rather than
 * assumed from its role: an agent that emits a contract nobody
 * listed here is refused at the handoff, which is how the register
 * finds out it is wrong rather than being quietly bypassed.
 *
 * `never` quotes `docs/AGENT-ROLES.md`. It is not enforced by this
 * module — most of it is unenforceable by any module, because it is
 * about judgement — and it travels with the grant so that whatever
 * reads a dispatch record reads the refusal alongside the
 * permission.
 */
const SPECIALISTS = [
  {
    agent: 'source-scout',
    role: 'Scout',
    role_ref: 'docs/AGENT-ROLES.md §1',
    doc: 'docs/SOURCE-SCOUT.md',
    what: 'locates candidate sources and the passages they carry. Produces leads.',
    produces: ['SourceCandidate', 'DataGap'],
    consumes: [],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'attaches a source to a claim; edits any file in data/; assigns a final tier; describes a candidate as confirming anything.',
  },
  {
    agent: 'legal-verifier',
    role: 'Verifier',
    role_ref: 'docs/AGENT-ROLES.md §2',
    doc: 'docs/LEGAL-VERIFIER.md',
    what: 'opens the source, reads the passage, and decides whether it carries what the record says — or refuses.',
    produces: ['VerificationRecord'],
    /* A RegulatoryChange as well as a SourceCandidate: LEGAL_CHANGE
       hands the verifier a detected change to read the source for,
       and an agent that could not take one would make that workflow
       unroutable. Added because the suite found the handoff broken,
       which is the register being corrected by the thing that uses
       it rather than the other way round. */
    consumes: ['SourceCandidate', 'RegulatoryChange'],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'verifies a candidate it scouted itself; infers content from a title, abstract or search snippet; upgrades a tier to reach a desired grade.',
  },
  {
    agent: 'verification-integrator',
    role: 'Verifier → Data Depth adapter',
    role_ref: 'docs/AGENT-ROLES.md §2, §4',
    doc: 'docs/VERIFICATION-INTEGRATION.md',
    what: 'turns a verification outcome into a proposal against the real corpus, preserving what the verifier refused to settle.',
    produces: ['DataProposal', 'ClaimEvidence', 'DataGap', 'ApprovalRequest'],
    consumes: ['VerificationRecord', 'SourceCandidate'],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'writes to data/; converts an insufficient verification into a confirmed one; drops a conflict because a proposal is tidier without it.',
  },
  {
    agent: 'regulatory-change-detector',
    role: 'Change Detector',
    role_ref: 'docs/AGENT-ROLES.md §3',
    doc: 'docs/CHANGE-DETECTOR.md · docs/REGULATORY-IMPACT-MAPPING.md',
    what: 'notices when the world has moved past the record, and maps what a confirmed change reaches inside this website.',
    produces: ['RegulatoryChange', 'ImpactAssessment', 'DataGap'],
    consumes: ['SourceCandidate', 'VerificationRecord'],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'updates a record; treats url:live as evidence a link works; treats a freshness.mjs exit code 0 as evidence of currency.',
  },
  {
    agent: 'data-depth',
    role: 'Data Depth',
    role_ref: 'docs/AGENT-ROLES.md §4',
    doc: 'docs/DATA-DEPTH.md',
    what: 'reports where the corpus is thin, and what a reader cannot answer from it.',
    produces: ['KnowledgeGap', 'DataGap'],
    consumes: [],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'changes the value of a fact under cover of a structural change; stores a derived value; adds a second home for a fact.',
  },
  {
    agent: 'proposal-router',
    role: 'Data Depth → proposal',
    role_ref: 'docs/AGENT-ROLES.md §4',
    doc: 'docs/GAP-PROPOSALS.md',
    what: 'routes a gap to the agent that can close it, and drafts a proposal only where the gap is closable from evidence already held.',
    produces: ['DataProposal', 'ApprovalRequest'],
    consumes: ['DataGap', 'KnowledgeGap'],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'drafts a value that would need a source nobody has read; closes a gap by declaring it closed.',
  },
  {
    agent: 'knowledge-architect',
    role: 'Knowledge Architect',
    role_ref: 'docs/AGENT-ROLES.md §5',
    doc: 'docs/KNOWLEDGE-ARCHITECTURE.md',
    what: 'owns the model and the boundary between fact and argument; reports what the model has no place for.',
    produces: ['KnowledgeGap', 'ArchitectureProposal', 'ApprovalRequest'],
    consumes: ['KnowledgeGap', 'DataGap'],
    autonomy_ceiling: 'human_only',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'changes a derivation to alter how specific records come out; introduces a fourth state; permits a stored value to shadow a derived one.',
  },
  {
    agent: 'editorial',
    role: 'Editorial',
    role_ref: 'docs/AGENT-ROLES.md §6',
    doc: 'docs/EDITORIAL-AGENT.md',
    what: 'reads the prose against the data and reports where the two disagree. It drafts nothing it cannot quote.',
    produces: ['EditorialProposal', 'ApprovalRequest'],
    consumes: ['RegulatoryChange', 'ImpactAssessment', 'VerificationRecord', 'DataProposal'],
    autonomy_ceiling: 'human_only',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/', 'agent/proposals/editorial/drafts/'],
    never: 'states as fact something no claim supports; softens a stated limitation; edits a data-i18n string without handling all three locales.',
  },
  {
    agent: 'ux-auditor',
    role: 'UX/UI',
    role_ref: 'docs/AGENT-ROLES.md §7',
    doc: 'docs/UX-AUDIT.md',
    what: 'audits the interface from the markup, the stylesheets and the modules. It has never opened a page.',
    produces: ['UXProposal', 'ApprovalRequest'],
    consumes: ['QAResult'],
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: false,
    writes: ['agent/records/'],
    never: 'redesigns the website; adds a page-local style block; carries status by hue alone; drafts a value for the site to say.',
  },
  {
    agent: 'browser-qa',
    role: 'UX/UI — measurement',
    role_ref: 'docs/AGENT-ROLES.md §7',
    doc: 'docs/BROWSER-QA.md',
    what: 'opens every page in a real browser and reads the rendered DOM. Chromium only; computes no contrast and runs no screen reader.',
    produces: ['QAResult'],
    consumes: [],
    autonomy_ceiling: 'autonomous',
    may_decide: false,
    may_implement: false,
    writes: [],
    never: 'reports a pass when no browser was found — a missing browser is exit 2, not exit 0.',
  },
  {
    agent: 'implementation-qa',
    role: 'Implementation/QA',
    role_ref: 'docs/AGENT-ROLES.md §8',
    doc: 'docs/IMPLEMENTATION-QA.md',
    what: 'writes the change and proves it — behind ten mechanical gates it re-derives itself, and a revert it verifies by re-hashing.',
    produces: ['ImplementationProposal', 'QAResult', 'ChangeRecord', 'WebsiteChange'],
    consumes: CONTRACT_NAMES.filter((n) => getContract(n).kind === 'proposal'),
    autonomy_ceiling: 'review_required',
    may_decide: false,
    may_implement: true,
    writes: ['data/', 'i18n/', 'js/', 'css/', '*.html', 'app.js', 'style.css'],
    never: 'weakens a validator to make a change pass; runs _refsweep.mjs or _review10.mjs; adds a dependency, build step or service worker; writes its own approval ledger.',
  },
  {
    agent: 'health-monitor',
    role: 'Observability',
    role_ref: 'docs/AGENT-ROLES.md §10',
    doc: 'docs/HEALTH-MONITOR.md',
    what: 'measures the three health domains and says what cannot be measured. It never sums them.',
    produces: ['AgentObservation'],
    consumes: [],
    autonomy_ceiling: 'autonomous',
    may_decide: false,
    may_implement: false,
    writes: ['agent/health/history/'],
    never: 'reports an unmeasurable as zero; produces an overall score; presents a metric as measured when it is asserted.',
  },
];

/* The two actors that are not agents. They are in the register
   because the Orchestrator has to be able to route TO them, and a
   destination it cannot name is a destination it would have to
   invent. Neither is dispatchable: `dispatchable` is false, and
   `grantFor` refuses one by name. */
const NON_AGENTS = [
  {
    agent: 'human',
    role: 'the person deciding',
    role_ref: 'docs/AUTONOMY-POLICY.md Class C and Class D',
    doc: 'docs/CONTROL-ROOM.md',
    what: 'the only actor that may approve. Reached through the Control Room, or through node agent/implement/cli.mjs decide.',
    produces: [],
    consumes: [],
    autonomy_ceiling: 'human_only',
    may_decide: true,
    may_implement: false,
    dispatchable: false,
    writes: [],
    never: 'is not an agent, and no agent may stand in for one. agent/implement/ledger.mjs refuses a decision signed with any agent name in this system.',
  },
  {
    agent: 'orchestrator',
    role: 'Orchestrator',
    role_ref: 'docs/AGENT-ROLES.md §9',
    doc: 'docs/ORCHESTRATOR.md',
    what: 'sequences the work and holds the line on autonomy. It reasons about ROUTING and about nothing else.',
    produces: [],
    consumes: CONTRACT_NAMES,
    autonomy_ceiling: 'autonomous',
    may_decide: false,
    may_implement: false,
    dispatchable: false,
    writes: ['agent/orchestrator/state/'],
    never: 'replaces a specialist\'s domain reasoning; lets one agent both scout and verify the same fact; downgrades a change\'s class to avoid an approval; merges on its own authority; presents partial completion as completion.',
  },
];

/* Frozen ALL THE WAY DOWN, not one level. A shallow freeze leaves
   `produces` a mutable array, and `CAPABILITIES['legal-verifier']
   .produces.push('UXProposal')` would then widen an agent at
   runtime — which is the exact thing this file exists to make
   impossible. The suite plants that push and asserts it throws. */
const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};

export const CAPABILITIES = deepFreeze(
  Object.fromEntries([...SPECIALISTS, ...NON_AGENTS].map((c) => [c.agent, { dispatchable: true, ...c }])),
);

export const AGENT_NAMES = Object.freeze(Object.keys(CAPABILITIES));
export const DISPATCHABLE = Object.freeze(AGENT_NAMES.filter((a) => CAPABILITIES[a].dispatchable));

/* Fail at load rather than at dispatch time. Every one of these
   would be a permission defect, and a permission defect that first
   shows up when somebody exercises it is a permission defect that
   shipped. */
for (const c of Object.values(CAPABILITIES)) {
  for (const name of c.produces) {
    if (!CONTRACT_NAMES.includes(name)) throw new Error(`capability register: "${c.agent}" claims to produce "${name}", which is not one of the eighteen contracts`);
  }
  if (!AUTONOMY_CLASSES.includes(c.autonomy_ceiling)) throw new Error(`capability register: "${c.agent}" has autonomy ceiling "${c.autonomy_ceiling}"`);
  if (c.may_decide && c.dispatchable) throw new Error(`capability register: "${c.agent}" is dispatchable AND may decide. No agent may approve; a decision is attributable to a person.`);
  if (c.may_implement && !MAY_IMPLEMENT.includes(c.agent)) throw new Error(`capability register: "${c.agent}" claims may_implement and is not in MAY_IMPLEMENT`);
}
if (MAY_DECIDE.length) throw new Error('MAY_DECIDE is not empty. A decision lives in agent/implement/decisions/ and is written by one function that refuses every agent name in this system.');

export class CapabilityRefused extends Error {
  constructor(message, { code = 'capability_refused', agent = null, detail = null, fix = null } = {}) {
    super(message);
    this.name = 'CapabilityRefused';
    this.code = code;
    this.agent = agent;
    this.detail = detail;
    this.fix = fix;
  }
}

export function capabilityOf(agent) {
  const c = CAPABILITIES[agent];
  if (!c) {
    throw new CapabilityRefused(`"${agent}" is not an actor this system knows. Deny by default: an agent nobody registered has no capability, and inventing one at dispatch time is how a permission boundary stops meaning anything.`, {
      code: 'unknown_agent', agent,
      fix: `register it in agent/orchestrator/capabilities.mjs. The known actors are: ${AGENT_NAMES.join(', ')}.`,
    });
  }
  return c;
}

export const mayProduce = (agent, contract) => capabilityOf(agent).produces.includes(contract);

/**
 * The grant for ONE dispatch.
 *
 * @param {{agent:string, stage:object, workflow_id:string}} req
 * @returns {{grant:object|null, refusals:object[]}}
 *
 * The intersection, and the refusal that names what fell outside
 * it. Both are returned: a caller that only looked at `grant` would
 * see an empty permission set and not know why, and "why" is the
 * part a reviewer needs.
 */
export function grantFor({ agent, stage, workflow_id }) {
  const cap = capabilityOf(agent);
  const refusals = [];

  if (!cap.dispatchable) {
    refusals.push({
      code: 'not_dispatchable',
      why: `"${agent}" is not something the Orchestrator dispatches. ${cap.what}`,
      fix: agent === 'human'
        ? 'route the workflow to human review instead. The Orchestrator can put work in front of a person; it cannot be one.'
        : 'the Orchestrator does not dispatch itself.',
    });
    return { grant: null, refusals };
  }

  const needs = stage?.needs ?? [];
  const permitted = needs.filter((n) => cap.produces.includes(n));
  const outside = needs.filter((n) => !cap.produces.includes(n));

  if (outside.length) {
    refusals.push({
      code: 'stage_exceeds_capability',
      why: `stage "${stage?.stage}" declares a need for ${outside.join(', ')}, and "${agent}" may produce ${cap.produces.join(', ') || 'nothing'}.`,
      /* The sentence this whole module exists for. */
      fix: 'the grant is the INTERSECTION of what the agent holds and what the stage asks for, never the union. A stage cannot widen an agent by asking for more; either the workflow names the wrong specialist, or the capability register is wrong and changing it is a reviewed source change.',
      detail: { outside, agent_produces: cap.produces },
    });
  }

  if (!permitted.length) {
    return { grant: null, refusals: refusals.length ? refusals : [{
      code: 'empty_grant',
      why: `nothing is in both "${agent}"'s capability and stage "${stage?.stage}"'s declared need.`,
      fix: 'a dispatch with an empty grant would be a dispatch with no permission, and it is refused rather than run.',
    }] };
  }

  /* The stage may lower the ceiling, never raise it. H5: a
     downstream agent may escalate a change's class; it may never
     lower one — and the same asymmetry applies to the permission a
     stage carries. */
  const stageCeiling = stage?.autonomy_ceiling ?? cap.autonomy_ceiling;
  const ceiling = AUTONOMY_RANK[stageCeiling] < AUTONOMY_RANK[cap.autonomy_ceiling] ? stageCeiling : cap.autonomy_ceiling;

  return {
    grant: Object.freeze({
      agent,
      role: cap.role,
      workflow_id,
      stage: stage.stage,
      may_produce: Object.freeze(permitted),
      autonomy_ceiling: ceiling,
      may_decide: false,
      may_implement: cap.may_implement === true,
      writes: Object.freeze([...cap.writes]),
      never: cap.never,
      derived_from: 'agent/orchestrator/capabilities.mjs grantFor() — the intersection of the agent\'s registered capability and the stage\'s declared need. Nothing in the request contributed to it.',
      one_stage_only: true,
    }),
    refusals,
  };
}

/**
 * Does this record fall inside the grant it was produced under?
 *
 * Returns the refusals rather than throwing, because a specialist
 * producing one record outside its boundary should not lose the
 * records that were inside it — those are still evidence, and the
 * Orchestrator reports both.
 */
export function checkOutput(grant, record, { workflow_id = null } = {}) {
  const refusals = [];
  const at = record?.contract ?? 'a record with no contract';

  if (!grant) {
    refusals.push({ code: 'no_grant', why: `${at} was produced under no grant at all.`, fix: 'every dispatch carries a grant. A record produced outside one is refused at the handoff.' });
    return refusals;
  }

  if (workflow_id && grant.workflow_id !== workflow_id) {
    refusals.push({
      code: 'grant_replayed',
      why: `the grant was issued for workflow ${grant.workflow_id} stage "${grant.stage}", and this record arrived in workflow ${workflow_id}.`,
      fix: 'a grant is for one stage of one workflow and dies with it. Replaying one is how a narrow permission becomes a standing one.',
    });
  }

  if (!record || typeof record !== 'object' || !record.contract) {
    refusals.push({ code: 'not_a_record', why: 'the output is not a contract record.', fix: 'a specialist hands back records, and agent/schemas/gateway.mjs validates every one at the boundary.' });
    return refusals;
  }

  if (!grant.may_produce.includes(record.contract)) {
    refusals.push({
      code: 'outside_grant',
      why: `${at} is not among the contracts "${grant.agent}" was granted for stage "${grant.stage}": ${grant.may_produce.join(', ')}.`,
      fix: 'the grant is the intersection of the agent\'s capability and the stage\'s need. A record outside it is refused at the handoff rather than passed on and discovered three agents later.',
      detail: { produced: record.contract, granted: grant.may_produce },
    });
  }

  if (record.agent && record.agent !== grant.agent) {
    refusals.push({
      code: 'wrong_author',
      why: `the record says it was produced by "${record.agent}" and the grant was issued to "${grant.agent}".`,
      fix: 'a record signed with another agent\'s name under this agent\'s grant is either a mistake or an attribution somebody wanted. Either way it does not travel.',
    });
  }

  if (record.autonomy_class && AUTONOMY_RANK[record.autonomy_class] < AUTONOMY_RANK[grant.autonomy_ceiling]) {
    /* Below the ceiling is fine — a proposal may be less risky than
       the agent's worst case. Above it is the failure, and it is
       checked the other way round in policy.mjs where the class is
       compared against what the change actually touches. This is
       only the record-versus-grant half. */
  }

  return refusals;
}

/** The register, for `cli.mjs capabilities` and for the Control
 *  Room. Read-only by construction — CAPABILITIES is frozen. */
export function describeCapabilities() {
  return AGENT_NAMES.map((a) => {
    const c = CAPABILITIES[a];
    return {
      agent: a, role: c.role, role_ref: c.role_ref, doc: c.doc, what: c.what,
      dispatchable: c.dispatchable,
      produces: c.produces, consumes: c.consumes,
      autonomy_ceiling: c.autonomy_ceiling,
      may_decide: c.may_decide, may_implement: c.may_implement === true,
      writes: c.writes, never: c.never,
    };
  });
}
