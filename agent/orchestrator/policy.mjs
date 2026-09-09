/* ============================================================
   agent/orchestrator/policy.mjs — the autonomy boundary, and the
   ten reasons work goes to a person

   TWO QUESTIONS, KEPT APART BECAUSE THEY FAIL DIFFERENTLY.

   `requiresHumanReview()` asks: is this the KIND of thing a person
   decides? SESSION 22 lists ten triggers and protocol §19 restates
   most of them as absolute. Any one of them routes the workflow to
   a human, and no amount of model confidence overrides it — §19
   says that in those words, and `confidence` is not read anywhere
   in this file.

   `autonomyPermits()` asks the opposite question: are ALL of
   protocol §18's mandatory conditions satisfied, so that an action
   could execute without one? "Failure of one mandatory condition
   blocks automatic execution", so this returns false as soon as one
   fails and reports every one it checked either way — a caller that
   only saw the first failure would fix it and meet the second.

   THE ANSWER WAS ALWAYS NO UNTIL SESSION 26, AND WHAT CHANGED IS
   NARROW. §20 restricts autonomous production action to "explicitly
   approved low-risk categories". Until SESSION 26 none was approved,
   because §24 says the system may not rewrite its own governance
   policy and nothing here could add one. A person then did: the
   grant lives in `agent/policy/governance/grants.jsonl`, and
   `category_allowed` below reads the POLICY IN FORCE — the base plus
   every active grant — rather than the base constant.

   `APPROVED_AUTONOMOUS_CATEGORIES` is still exported and still
   empty, because it is the BASE and three suites assert it stays so.
   `approvedCategories()` is the derived view; use that one to answer
   "what is switched on".

   THE ELEVEN OTHER CONDITIONS ARE STILL ALL EVALUATED. That was
   right when the answer was always no — the interesting fact was
   which conditions a piece of work would have failed if autonomy
   were on — and it is more obviously right now that it sometimes is:
   a system that stopped at the first failure would report the
   cheapest reason rather than the whole of what stood in the way.

   WHAT `major_rewrite` MEANS HERE, since the protocol names it and
   defines it nowhere. Two mechanical thresholds, declared as
   constants so they can be argued with: an operation that replaces
   more than 400 characters of existing content, or a proposal
   carrying more than ten operations against prose. Both are
   deliberately low. Misclassifying downward is the failure
   `docs/AUTONOMY-POLICY.md` says it exists to prevent, and a
   threshold that catches some ordinary edits costs a review; one
   that misses a rewrite costs the thing the review was for.
   ============================================================ */

import { LEGAL_ENTITY_KINDS, RED_TARGETS, REQUIRED_VALIDATORS } from '../schemas/types.mjs';
import { CONDITIONS } from '../policy/conditions.mjs';
import { ACTION_CATEGORIES, AUTOMATABLE_CATEGORIES, DEFAULT_POLICY, categoriseProposal } from '../policy/categories.mjs';
import { evaluate as evaluatePolicy } from '../policy/engine.mjs';
import { policyInForce } from '../policy/governance.mjs';

/* ============================================================
   1 · Human review
   ============================================================ */

/** SESSION 22's ten, in its own order. Every one of them is a
 *  reason on its own; they are not weighed against each other. */
export const HUMAN_REVIEW_TRIGGERS = Object.freeze([
  'interpretation_required',
  'critique_involved',
  'legal_conclusion',
  'schema_or_taxonomy_change',
  'deletion',
  'major_rewrite',
  'architecture_change',
  'ambiguous_legal_status',
  'unresolved_conflict',
  'autonomy_policy_refuses',
]);

/** Thresholds for `major_rewrite`, named so they can be disagreed
 *  with rather than discovered in a condition. */
export const MAJOR_REWRITE_CHARS = 400;
export const MAJOR_REWRITE_PROSE_OPS = 10;

const PROSE_TARGETS = /(index\.html|\.html$|__CONTENT__|brief\.json|meta\.standfirst|i18n\/)/;
const SCHEMA_TARGETS = /(data\/taxonomy\.json|tools\/validate\.mjs|\$description|\$note)/;
const ARCHITECTURE_TARGETS = /^(js\/|tools\/|css\/|app\.js|style\.css)/;

const trigger = (code, why, evidence = {}) => ({ code, why, ...evidence });

/**
 * Every reason this workflow has to stop in front of a person.
 *
 * @param {{workflow:object, records?:object[], conflicts?:object[],
 *          autonomy?:object}} ctx
 * @returns {{required:boolean, reasons:object[], checked:string[]}}
 */
export function requiresHumanReview({ workflow, records = [], conflicts = [], autonomy = null } = {}) {
  const reasons = [];

  /* The type may declare it outright, and most of them do. A
     declaration is a reason in its own right and is recorded as
     one rather than being left implicit in the stage list. */
  if (workflow?.completes_without_human === 'never') {
    reasons.push(trigger('workflow_type', `${workflow.id} declares that it never completes without a person: ${(workflow.human_review_when ?? []).join(' · ')}`));
  }

  for (const r of records) {
    const label = `${r.contract} ${idOf(r)} (${r.agent})`;

    if ((r.epistemic?.interpretation ?? []).length) {
      reasons.push(trigger('interpretation_required', `${label} carries ${r.epistemic.interpretation.length} interpretation(s): ${r.epistemic.interpretation.map((i) => i.statement).slice(0, 2).join(' · ')}`, { record: idOf(r) }));
    }

    if (r.contract === 'UXProposal' || r.contract === 'EditorialProposal' || r.contract === 'ArchitectureProposal') {
      reasons.push(trigger('critique_involved', `${label} is a critique of the site's own work. Protocol §8 reserves critique to a person, and neither the UX agent nor the editorial agent drafts what the site should say instead.`, { record: idOf(r) }));
    }

    const legalFacts = (r.epistemic?.fact ?? []).length && (r.affected_entities ?? []).some((e) => LEGAL_ENTITY_KINDS.includes(e.kind));
    if (legalFacts) {
      reasons.push(trigger('legal_conclusion', `${label} states ${r.epistemic.fact.length} fact(s) about the legal record. A legal conclusion is a person's, and getting one wrong costs a reader a decision they cannot take back.`, { record: idOf(r) }));
    }

    const ops = r.proposed_change?.operations ?? [];

    if (ops.some((o) => SCHEMA_TARGETS.test(String(o.target ?? ''))) || ops.some((o) => o.op === 'add' && /taxonomy/.test(String(o.target ?? '')))) {
      reasons.push(trigger('schema_or_taxonomy_change', `${label} touches the schema or the taxonomy. data/taxonomy.json is the enum authority for every other dataset and its IDs are never renamed.`, { record: idOf(r) }));
    }

    const removals = ops.filter((o) => o.op === 'remove');
    if (removals.length) {
      reasons.push(trigger('deletion', `${label} removes ${removals.length} thing(s): ${removals.map((o) => o.target).slice(0, 4).join(', ')}. Deleting any record, source, claim or dataset is Class D.`, { record: idOf(r) }));
    }

    const bigEdit = ops.find((o) => typeof o.current === 'string' && typeof o.proposed === 'string' && o.current.length > MAJOR_REWRITE_CHARS);
    const proseOps = ops.filter((o) => PROSE_TARGETS.test(String(o.target ?? '')));
    if (bigEdit || proseOps.length > MAJOR_REWRITE_PROSE_OPS) {
      reasons.push(trigger('major_rewrite',
        bigEdit
          ? `${label} replaces ${bigEdit.current.length} characters at ${bigEdit.target}, over the ${MAJOR_REWRITE_CHARS}-character threshold this file declares.`
          : `${label} carries ${proseOps.length} operations against prose, over the ${MAJOR_REWRITE_PROSE_OPS} this file declares.`,
        { record: idOf(r), threshold_chars: MAJOR_REWRITE_CHARS, threshold_ops: MAJOR_REWRITE_PROSE_OPS }));
    }

    const architectural = ops.filter((o) => ARCHITECTURE_TARGETS.test(String(o.target ?? '')) || RED_TARGETS.some((t) => String(o.target ?? '').includes(t)));
    if (architectural.length) {
      reasons.push(trigger('architecture_change', `${label} touches ${architectural.map((o) => o.target).slice(0, 4).join(', ')} — derivation logic, tooling or the visual system. This role's changes have the widest reach in the project.`, { record: idOf(r) }));
    }

    const verdict = r.verdict ?? r.outcome?.verdict ?? null;
    if (['conflict', 'not_determinable'].includes(verdict)) {
      reasons.push(trigger('ambiguous_legal_status', `${label} came back "${verdict}". Two authoritative sources disagreeing, or a source that cannot settle the question, is not resolved by choosing.`, { record: idOf(r), verdict }));
    }
    if ((r.epistemic?.unresolved ?? []).some((u) => u.blocks)) {
      reasons.push(trigger('ambiguous_legal_status', `${label} carries a BLOCKING open question: ${r.epistemic.unresolved.filter((u) => u.blocks).map((u) => u.question).slice(0, 2).join(' · ')}`, { record: idOf(r) }));
    }
  }

  if (conflicts.length) {
    reasons.push(trigger('unresolved_conflict', `${conflicts.length} conflict(s) between specialists: ${[...new Set(conflicts.map((c) => c.kind))].join(', ')}. H7: work halts and goes to a human; it is never resolved by seniority, recency or convenience.`, { conflicts: conflicts.map((c) => c.kind) }));
  }

  if (autonomy && !autonomy.permitted) {
    reasons.push(trigger('autonomy_policy_refuses', `the autonomy policy does not permit this to execute automatically: ${autonomy.failed.map((c) => c.condition).join(', ')}`, { failed: autonomy.failed.map((c) => c.condition) }));
  }

  /* De-duplicated by code AND reason, so five records carrying an
     interpretation produce five reasons rather than one — which
     record it was is the part a reviewer needs. */
  const seen = new Set();
  const unique = reasons.filter((r) => { const k = `${r.code}::${r.why}`; if (seen.has(k)) return false; seen.add(k); return true; });

  return { required: unique.length > 0, reasons: unique, checked: [...HUMAN_REVIEW_TRIGGERS] };
}

/* ============================================================
   2 · The autonomy boundary — protocol §18
   ============================================================ */

/**
 * The twelve, in the protocol's own order — and NOT a second list of
 * them.
 *
 * SESSION 22 named them here and SESSION 23 named them in
 * `agent/policy/conditions.mjs`, in the same order, with seven of the
 * twelve spelled differently. The spellings in `agent/policy/` are the
 * ones `evaluate()` returns and the ones the verification gate
 * attacks, so those are canonical and this is a view. The conditions
 * `autonomyPermits()` emits below were renamed to match, which is a
 * rename and not a change of what any of them checks.
 */
export const MANDATORY_AUTONOMY_CONDITIONS = Object.freeze([...CONDITIONS]);

/**
 * §20's low-risk categories, and the empty list beside them —
 * RE-EXPORTED, not restated.
 *
 * SESSION 22 wrote these out here and SESSION 23 wrote the same five
 * out in `agent/policy/categories.mjs`, on sibling branches, from the
 * same protocol paragraph. Two independent lists of one fact is what
 * `docs/DATA-GOVERNANCE.md` §5 forbids without a generator and a
 * drift check, and the two DID drift: this list had five entries and
 * that one had four, because the fifth had been missed. The merge
 * resolved it in the direction protocol §14 states — the Orchestrator
 * ENFORCES the autonomy policy, it does not define it — so
 * `agent/policy/` is the home and these names are views onto it.
 *
 * The category ids are `agent/policy/`'s. SESSION 22's longer spellings
 * (non_substantive_retrieval_metadata, verified_source_url_correction,
 * machine_derived_field_no_source_change) named the same four things
 * and are recorded here so a reader searching for one finds where it
 * went.
 */
export const LOW_RISK_CATEGORIES = Object.freeze([...AUTOMATABLE_CATEGORIES]);

/**
 * The BASE policy's enabled list, which is empty and stays empty. It
 * is empty in ONE place: `DEFAULT_POLICY`.
 *
 * SESSION 26 NOTE — READ THIS BEFORE USING IT AS "WHAT IS SWITCHED
 * ON". It is not. It is what is switched on when no governance grant
 * exists, which was the whole story until SESSION 26 and is not any
 * more. What is actually in force is derived from
 * `agent/policy/governance/grants.jsonl` by `policyInForce()`, and
 * `approvedCategories()` below is the view onto it. This constant is
 * kept, at its original name and its original value, because three
 * suites assert the BASE stays empty and that assertion is still
 * exactly the one worth making: a grant is how autonomy is switched
 * on, and an agent editing a literal is not.
 */
export const APPROVED_AUTONOMOUS_CATEGORIES = Object.freeze([...DEFAULT_POLICY.enabled_categories]);

/** What is enabled RIGHT NOW: the base plus every active grant.
 *  A function rather than a constant because it can change without
 *  this module being reloaded — somebody records or revokes a grant —
 *  and a load-time snapshot of a governance fact is a snapshot that
 *  goes quietly stale. */
export function approvedCategories(opts = {}) {
  return [...policyInForce(opts).policy.enabled_categories];
}

/** The base statement, true when nothing is granted. */
export const AUTONOMY_BASE_NOTE = 'No action category is approved for automatic execution by the BASE policy. docs/AUTONOMY-POLICY.md Class B is the nearest thing that exists and it still requires a validator to PROVE the change correct and a revert if any validator fails; §20 of the governance protocol requires an explicit governance decision to enable a category, and §24 reserves that decision to a person. An agent adding one to APPROVED_AUTONOMOUS_CATEGORIES would be taking the decision the protocol reserves.';

/**
 * What to say about autonomy, given what is actually granted.
 *
 * A CONSTANT HERE WOULD NOW BE A FALSE STATEMENT. The previous
 * `AUTONOMY_NOTE` said "No action category is approved for automatic
 * execution in this repository", which was true when it was written
 * and stopped being true the moment a person recorded a grant. This
 * repository's own rule is that a record says what it can support, so
 * the note is derived from the ledger rather than asserted from a
 * literal nobody would think to update.
 */
export function autonomyNote(opts = {}) {
  const { policy, active } = policyInForce(opts);
  if (!active.length) return AUTONOMY_BASE_NOTE;
  return `${policy.enabled_categories.length} action categor(ies) may execute automatically under ${active.length} governance grant(s): ${policy.enabled_categories.join(', ')}, over ${policy.automatic_path_allowlist.join(', ')}, at risk no higher than "${policy.max_automatic_risk}", in ${policy.automatic_environments.join('/')} and never in production. Granted by ${active.map((g) => `${g.decided_by} on ${g.decided_at} until ${g.expires_at}`).join('; ')}. Every one of protocol §18's twelve mandatory conditions is still evaluated on every act, the fourteen §19 categories may never be granted by any policy, and nothing here deploys: a merge reaches the working branch and stops.`;
}

const cond = (condition, satisfied, why, needs = null) => ({ condition, satisfied, why, needs });

/**
 * Every mandatory condition, evaluated and reported.
 *
 * @param {{proposal?:object, records?:object[], conflicts?:object[],
 *          validators?:object|null, browser?:object|null,
 *          scope?:object|null, humanReview?:object|null,
 *          category?:string|null}} ctx
 */
export function autonomyPermits({ proposal = null, records = [], conflicts = [], validators = null, browser = null, scope = null, humanReview = null, category = null, policy = null } = {}) {
  const conditions = [];
  /* THE POLICY IN FORCE, not the base. SESSION 26: what is switched
     on is derived from the governance grant ledger, and an
     Orchestrator that enforced the base policy would refuse acts the
     implementation layer permits — two enforcement points disagreeing
     about one fact, which is the drift `docs/DATA-GOVERNANCE.md` §5
     exists to prevent. It is a PARAMETER so a caller can ask about a
     different policy without the module reaching for a global; it is
     not a way to widen anything, because a policy handed in here is
     still read by the same engine that refuses a never-automatable
     category before it reads any enabled list. */
  const inForce = policy ?? policyInForce().policy;
  const approved = [...(inForce.enabled_categories ?? [])];
  const all = [proposal, ...records].filter(Boolean);

  const realEvidence = all.flatMap((r) => (r.evidence ?? []).filter((e) => ['retrieved_document', 'repository_file', 'dataset_record', 'validator_output', 'measurement'].includes(e.kind)));
  conditions.push(cond('authoritative_evidence', realEvidence.length > 0,
    realEvidence.length ? `${realEvidence.length} evidence reference(s) of an authoritative kind across ${all.length} record(s).` : 'no record carries evidence of a kind that could be authoritative. "absent" is a first-class kind and it is not authority.',
    realEvidence.length ? null : 'a retrieved document, a repository file, a dataset record, validator output or a measurement.'));

  const verifications = all.filter((r) => r.contract === 'VerificationRecord');
  const confirmed = verifications.filter((r) => ['confirmed', 'partially_confirmed'].includes(r.verdict ?? r.outcome?.verdict));
  conditions.push(cond('verification_succeeded', verifications.length > 0 && confirmed.length === verifications.length,
    verifications.length === 0
      ? 'no verification record is in this workflow at all. An unverified change is not a low-risk change; it is an unchecked one.'
      : confirmed.length === verifications.length ? `${confirmed.length} of ${verifications.length} verification(s) confirmed.` : `${verifications.length - confirmed.length} verification(s) did not confirm.`,
    'a VerificationRecord whose verdict is confirmed or partially_confirmed, from an agent that did not scout the candidate.'));

  conditions.push(cond('no_unresolved_conflict', conflicts.length === 0,
    conflicts.length ? `${conflicts.length} conflict(s): ${[...new Set(conflicts.map((c) => c.kind))].join(', ')}` : 'none of the six conflict shapes fired. That is not the same as two specialists agreeing — agent/orchestrator/conflict.mjs says what it cannot see.',
    conflicts.length ? 'a person resolves it. H7 is explicit that the chain stops.' : null));

  const blocking = all.flatMap((r) => (r.epistemic?.unresolved ?? []).filter((u) => u.blocks));
  const provenanceOk = all.length > 0 && all.every((r) => (r.evidence ?? []).length > 0) && blocking.length === 0;
  conditions.push(cond('provenance_complete', provenanceOk,
    blocking.length ? `${blocking.length} blocking open question(s): ${blocking.map((u) => u.question).slice(0, 2).join(' · ')}`
      : all.length === 0 ? 'there are no records to have provenance.'
        : provenanceOk ? `every one of the ${all.length} record(s) carries evidence, and none carries a blocking open question.` : 'a record carries no evidence and does not say that it has none.',
    provenanceOk ? null : 'close the blocking question, or record the absence as an absence.'));

  /* Schema validation is not re-run here: every record reached this
     point through agent/schemas/gateway.mjs, which validates and
     throws. Reporting it as checked is honest only because the gate
     is upstream and unskippable. */
  conditions.push(cond('schema_validation', all.length > 0,
    all.length ? `${all.length} record(s) passed agent/schemas/validate.mjs at the handoff — gateway.mjs validates and throws, and has no flag that skips it.` : 'there is nothing to validate.',
    all.length ? null : 'a record.'));

  const validatorsOk = Boolean(validators && validators.ok);
  conditions.push(cond('validators_pass', validatorsOk,
    validators ? (validators.ok ? `the four validators returned to the recorded baseline: ${validators.summary ?? 'compared against docs/CURRENT-ARCHITECTURE.md §12'}` : `the validators did not return to baseline: ${validators.summary ?? 'see the comparison'}`)
      : 'the four validators have not been run in this workflow. A validator that did not run is not a validator that passed.',
    validatorsOk ? null : `run ${REQUIRED_VALIDATORS.join(', ')} and compare against the baseline in docs/CURRENT-ARCHITECTURE.md §12.`));

  const needsBrowser = scope?.requires_browser_qa === true;
  const browserOk = !needsBrowser || Boolean(browser && browser.status === 'pass');
  conditions.push(cond('browser_qa', browserOk,
    !needsBrowser ? 'the change does not touch anything the four validators cannot see, so browser QA is not required for it.'
      : browser ? `browser QA: ${browser.status}` : 'the change touches something the four validators cannot see and no browser run is attached. A missing browser is exit 2, and exit 2 is not a pass.',
    browserOk ? null : 'node agent/browser/cli.mjs --require-browser'));

  const risk = proposal?.risk ?? null;
  const riskOk = ['none', 'low'].includes(risk);
  conditions.push(cond('risk_within_threshold', riskOk,
    risk ? `the proposal states risk "${risk}".${riskOk ? '' : ' Automatic execution is reserved to none and low.'}` : 'the proposal does not state a risk. A proposal that cannot say what it costs if it is wrong has not been thought about.',
    riskOk ? null : 'a proposal at medium risk or above is decided by a person.'));

  const rb = proposal?.rollback_plan ?? null;
  const rollbackOk = Boolean(rb && rb.method && rb.method !== 'not_reversible' && (rb.steps ?? []).length && rb.verification);
  conditions.push(cond('rollback_mechanical', rollbackOk,
    rb ? (rollbackOk ? `${rb.method}, ${rb.steps.length} step(s), verified by: ${rb.verification}` : `the rollback plan is ${rb.method === 'not_reversible' ? 'not_reversible' : 'incomplete'}`) : 'no rollback plan.',
    rollbackOk ? null : 'protocol §17: a previous known-good state, a change identifier, a procedure, an execution mechanism and a post-rollback validation. "Rollback available" as a boolean is not one.'));

  const scopeOk = Boolean(scope && (scope.permitted ?? []).length && !(scope.refusals ?? []).length);
  conditions.push(cond('scope_permitted', scopeOk,
    scope ? (scopeOk ? `${scope.permitted.length} permitted path(s), derived from the proposal rather than taken as an argument.` : `${(scope.refusals ?? []).length} refused path(s), or none derivable.`) : 'no scope was derived.',
    scopeOk ? null : 'the proposal names the files it touches, and none of them is a path no agent may write.'));

  /* Two questions, and the first one no policy may answer for
     itself: is this category automatable AT ALL, and is it enabled?
     `agent/policy/categories.mjs` reads `automatable` before it reads
     any enabled list, and this reads it in the same order — so a
     hand-made policy object naming `legal_interpretation` in its
     enabled list is refused here as well as by the engine, rather
     than passing this condition and being caught only downstream. */
  const catMeta = category ? ACTION_CATEGORIES[category] : null;
  const categoryAutomatable = catMeta ? catMeta.automatable === true : false;
  const categoryOk = category !== null && categoryAutomatable && approved.includes(category);
  conditions.push(cond('category_allowed', categoryOk,
    category && !categoryAutomatable
      ? `the action names category "${category}", which no policy may automate${catMeta ? `: ${catMeta.human_review}` : ' because it is not a category this system defines'}. An enabled list naming it does not make it automatable.`
      : `${category ? `the action names category "${category}", and ` : 'the action names no category, and '}the policy in force (${inForce.policy_id}) enables ${approved.length ? approved.join(', ') : 'no category at all'}.`,
    categoryOk ? null : `a governance decision, taken by a person, enabling one of: ${LOW_RISK_CATEGORIES.join(', ')}. Protocol §24 reserves that decision; nothing in this system may take it — agent/policy/ is on the never-automatic path list precisely so that no grant can widen itself.`));

  const humanOk = Boolean(humanReview) && humanReview.required === false;
  conditions.push(cond('no_mandatory_human_review', humanOk,
    humanReview ? (humanReview.required ? `${humanReview.reasons.length} trigger(s): ${[...new Set(humanReview.reasons.map((r) => r.code))].join(', ')}` : 'none of the ten triggers fired.') : 'human review was not evaluated, which is not the same as it not being required.',
    humanOk ? null : 'each trigger is closed by the producing agent or decided by a person. No amount of model confidence overrides one — protocol §19.'));

  const failed = conditions.filter((c) => !c.satisfied);

  /* ------------------------------------------------------------
     AND THEN THE POLICY ENGINE, INDEPENDENTLY.

     SESSION 23's brief: "The implementation layer and Orchestrator
     must enforce it mechanically." The implementation layer has
     called `agent/policy/engine.mjs` since SESSION 23;
     `agent/implement/implementer.mjs` evaluates it before a line is
     written and again on the measured facts. This is the other half,
     and it was missing because SESSION 22 and SESSION 23 were
     written on branches that could not see each other.

     The twelve conditions above are WORKFLOW-shaped: they read a set
     of records, the conflicts between specialists, and the validator
     and browser results the workflow gathered. `evaluate()` is
     PROPOSAL-shaped: it derives a category, an effective autonomy
     class and a route from the record itself. They are not the same
     question, and neither subsumes the other — so both run, and
     `permitted` requires both to agree. An Orchestrator that could
     permit what the policy engine refuses would be the bypass §14
     forbids in one line of code. */
  /* THE ACT CONTEMPLATED, NOT THE ACT OF CONTEMPLATING IT. The first
     version of this call passed `action: 'policy.enforce'` with the
     Orchestrator as the actor — which is what the Orchestrator is
     doing, and is a READ. `evaluate()` correctly routes a read to
     `automatic` without evaluating the twelve conditions, so the
     question came back "permitted" having checked nothing. The
     question the Orchestrator has to ask is the one the implementer
     will ask: may `implementation-qa` apply this? Asking it in the
     implementer's own terms is the point — the Orchestrator
     re-derives the same question rather than a weaker one. */
  const engine = proposal
    ? evaluatePolicy({
      actor: { kind: 'implementation_qa', id: 'implementation-qa' },
      action: 'implement.apply',
      environment: 'local',
      resource: { kind: 'canonical_data', id: proposal.proposal_id ?? null },
      proposal,
      policy: inForce,
      facts: {},
    })
    : null;
  const engineRefuses = Boolean(engine && !engine.automatic_execution_permitted);

  return {
    permitted: failed.length === 0 && !engineRefuses,
    conditions,
    failed,
    checked: [...MANDATORY_AUTONOMY_CONDITIONS],
    /* Reported separately rather than folded into `conditions`,
       because `conditions` is the twelve protocol §18 names and a
       thirteenth entry there would be a claim the protocol does not
       make. */
    policy_engine: engine
      ? { route: engine.route, category: engine.category.category, permitted: engine.automatic_execution_permitted, why: engine.why, failed: engine.failed, unknown: engine.unknown, policy_id: engine.policy_id }
      : { route: null, category: null, permitted: false, why: 'no proposal was supplied, so agent/policy/engine.mjs was not asked. A workflow with nothing to execute does not execute.', failed: [], unknown: [], policy_id: inForce.policy_id },
    note: autonomyNote(),
    summary: failed.length === 0 && !engineRefuses
      ? 'every mandatory condition is satisfied and agent/policy/engine.mjs agrees. This does NOT mean anything executes: no workflow in this system publishes, and the last stage of every one of the ten is a person.'
      : failed.length === 0
        ? `every workflow condition is satisfied and agent/policy/engine.mjs refuses independently: ${engine.why}`
        : `${failed.length} of ${MANDATORY_AUTONOMY_CONDITIONS.length} mandatory condition(s) fail: ${failed.map((c) => c.condition).join(', ')}. Failure of one blocks automatic execution.${engineRefuses ? ` agent/policy/engine.mjs refuses as well: route "${engine.route}".` : ''}`,
  };
}

/* ============================================================
   3 · The two remaining gates
   ============================================================ */

/** Protocol §5 — every material factual proposition traceable to
 *  its evidence, and an incomplete trace PRESERVED rather than
 *  filled in. */
export function provenanceGate(records = []) {
  const findings = [];
  for (const r of records) {
    const evidence = new Set((r.evidence ?? []).map((e) => e.evidence_id));
    if (!(r.evidence ?? []).length) {
      findings.push({ record: idOf(r), why: `${r.contract} carries no evidence array at all.`, closes: 'evidence is not optional, and "absent" is a first-class kind. A record that stands on nothing says so in its own body.' });
    }
    for (const f of r.epistemic?.fact ?? []) {
      const dangling = (f.evidence_refs ?? []).filter((id) => !evidence.has(id));
      if (dangling.length) {
        findings.push({ record: idOf(r), why: `a fact cites evidence ids this record does not carry: ${dangling.join(', ')}`, closes: 'a factual statement without provenance is a defect (protocol §4), and a dangling reference is provenance that cannot be reconstructed.' });
      }
      if (!(f.evidence_refs ?? []).length) {
        findings.push({ record: idOf(r), why: `a fact cites no evidence: "${String(f.statement).slice(0, 120)}"`, closes: 'a fact with no evidence is not a fact here.' });
      }
    }
    for (const u of (r.epistemic?.unresolved ?? []).filter((x) => x.blocks)) {
      findings.push({ record: idOf(r), why: `a BLOCKING open question is unclosed: "${u.question}"`, closes: u.missing ?? 'whatever the record says would close it.', blocking: true });
    }
  }
  return {
    ok: findings.length === 0,
    findings,
    bound: 'This checks that provenance is INTERNALLY complete — that a fact cites evidence the record carries, and that a blocking question is not being walked past. It does not check that the evidence says what the record says it says. Nothing in this repository has ever fetched a URL (AUDIT F-12), and the Legal Verifier is the role that reads a source.',
  };
}

/** Protocol §17 — "Rollback available" must not be a meaningless
 *  boolean. */
export function rollbackGate(records = []) {
  const findings = [];
  const plans = [];
  for (const r of records) {
    if (!r.proposed_change) continue;
    const rb = r.rollback_plan ?? null;
    if (!rb) { findings.push({ record: idOf(r), why: 'a proposal with no rollback plan.', closes: 'name what is reverted, by what command, and how the revert is confirmed.' }); continue; }
    const missing = [];
    if (!rb.method) missing.push('method');
    if (!(rb.steps ?? []).length) missing.push('steps');
    if (!rb.verification) missing.push('verification');
    if (rb.method === 'not_reversible' && !rb.irreversible_reason) missing.push('irreversible_reason');
    if (missing.length) findings.push({ record: idOf(r), why: `the rollback plan is missing ${missing.join(', ')}.`, closes: 'docs/AUTONOMY-POLICY.md §4: a change whose rollback path cannot be stated is not made.' });
    else plans.push({ record: idOf(r), method: rb.method, steps: rb.steps.length, verification: rb.verification, reversible: rb.method !== 'not_reversible' });
  }
  return {
    ok: findings.length === 0,
    findings,
    plans,
    bound: 'A stated rollback path is not a demonstrated one. git blame answers nothing in this repository — the pre-SESSION 00 history is 47 bulk uploads with no message that explains a change (AUDIT F-06) — so the only real path back is the agent\'s own branch and its own commits.',
  };
}

const idOf = (r) => r?.proposal_id ?? r?.verification_id ?? r?.candidate_id ?? r?.change_id ?? r?.gap_id ?? r?.record_id ?? r?.id ?? '(unidentified record)';
