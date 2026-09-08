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

   THE ANSWER TODAY IS ALWAYS NO, AND SAYING SO PLAINLY IS THE
   POINT. §20 restricts autonomous production action to "explicitly
   approved low-risk categories", and no governance decision in this
   repository has approved any: `APPROVED_AUTONOMOUS_CATEGORIES` is
   empty, and §24 says the system may not rewrite its own governance
   policy — so nothing here can add to it, and a session that did
   would be making the change §24 reserves to a person.

   That could have been implemented as a single early `return
   false`, and it deliberately is not. The eleven other conditions
   are evaluated and reported, because the interesting fact is not
   "autonomy is off" — it is WHICH conditions a given piece of work
   would have failed if it were on. A system that only ever prints
   "not permitted" teaches nobody anything, and the first session
   that turns a category on would be turning it on blind.

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

/** The twelve, in the protocol's own order. */
export const MANDATORY_AUTONOMY_CONDITIONS = Object.freeze([
  'authoritative_evidence',
  'successful_verification',
  'no_unresolved_conflict',
  'complete_provenance',
  'schema_validation',
  'project_validators',
  'browser_qa_where_required',
  'acceptable_risk',
  'valid_rollback',
  'permitted_scope',
  'allowed_action_category',
  'no_mandatory_human_review',
]);

/**
 * §20's low-risk categories, and the empty list beside them.
 *
 * The categories are written down because the protocol names them
 * and because a future governance decision would enable one of
 * THESE rather than something invented at the time. The approved
 * list is empty because no such decision exists in this repository,
 * and §24 forbids the system from adding one: "The system MUST NOT
 * autonomously rewrite its own governance policy."
 */
export const LOW_RISK_CATEGORIES = Object.freeze([
  'source_metadata_maintenance',
  'non_substantive_retrieval_metadata',
  'verified_source_url_correction',
  'machine_derived_field_no_source_change',
  'governed_metadata_maintenance',
]);

export const APPROVED_AUTONOMOUS_CATEGORIES = Object.freeze([]);

export const AUTONOMY_NOTE = 'No action category is approved for automatic execution in this repository. docs/AUTONOMY-POLICY.md Class B is the nearest thing that exists and it still requires a validator to PROVE the change correct and a revert if any validator fails; §20 of the governance protocol requires an explicit governance decision to enable a category, and §24 reserves that decision to a person. An agent adding one to APPROVED_AUTONOMOUS_CATEGORIES would be taking the decision the protocol reserves.';

const cond = (condition, satisfied, why, needs = null) => ({ condition, satisfied, why, needs });

/**
 * Every mandatory condition, evaluated and reported.
 *
 * @param {{proposal?:object, records?:object[], conflicts?:object[],
 *          validators?:object|null, browser?:object|null,
 *          scope?:object|null, humanReview?:object|null,
 *          category?:string|null}} ctx
 */
export function autonomyPermits({ proposal = null, records = [], conflicts = [], validators = null, browser = null, scope = null, humanReview = null, category = null } = {}) {
  const conditions = [];
  const all = [proposal, ...records].filter(Boolean);

  const realEvidence = all.flatMap((r) => (r.evidence ?? []).filter((e) => ['retrieved_document', 'repository_file', 'dataset_record', 'validator_output', 'measurement'].includes(e.kind)));
  conditions.push(cond('authoritative_evidence', realEvidence.length > 0,
    realEvidence.length ? `${realEvidence.length} evidence reference(s) of an authoritative kind across ${all.length} record(s).` : 'no record carries evidence of a kind that could be authoritative. "absent" is a first-class kind and it is not authority.',
    realEvidence.length ? null : 'a retrieved document, a repository file, a dataset record, validator output or a measurement.'));

  const verifications = all.filter((r) => r.contract === 'VerificationRecord');
  const confirmed = verifications.filter((r) => ['confirmed', 'partially_confirmed'].includes(r.verdict ?? r.outcome?.verdict));
  conditions.push(cond('successful_verification', verifications.length > 0 && confirmed.length === verifications.length,
    verifications.length === 0
      ? 'no verification record is in this workflow at all. An unverified change is not a low-risk change; it is an unchecked one.'
      : confirmed.length === verifications.length ? `${confirmed.length} of ${verifications.length} verification(s) confirmed.` : `${verifications.length - confirmed.length} verification(s) did not confirm.`,
    'a VerificationRecord whose verdict is confirmed or partially_confirmed, from an agent that did not scout the candidate.'));

  conditions.push(cond('no_unresolved_conflict', conflicts.length === 0,
    conflicts.length ? `${conflicts.length} conflict(s): ${[...new Set(conflicts.map((c) => c.kind))].join(', ')}` : 'none of the six conflict shapes fired. That is not the same as two specialists agreeing — agent/orchestrator/conflict.mjs says what it cannot see.',
    conflicts.length ? 'a person resolves it. H7 is explicit that the chain stops.' : null));

  const blocking = all.flatMap((r) => (r.epistemic?.unresolved ?? []).filter((u) => u.blocks));
  const provenanceOk = all.length > 0 && all.every((r) => (r.evidence ?? []).length > 0) && blocking.length === 0;
  conditions.push(cond('complete_provenance', provenanceOk,
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
  conditions.push(cond('project_validators', validatorsOk,
    validators ? (validators.ok ? `the four validators returned to the recorded baseline: ${validators.summary ?? 'compared against docs/CURRENT-ARCHITECTURE.md §12'}` : `the validators did not return to baseline: ${validators.summary ?? 'see the comparison'}`)
      : 'the four validators have not been run in this workflow. A validator that did not run is not a validator that passed.',
    validatorsOk ? null : `run ${REQUIRED_VALIDATORS.join(', ')} and compare against the baseline in docs/CURRENT-ARCHITECTURE.md §12.`));

  const needsBrowser = scope?.requires_browser_qa === true;
  const browserOk = !needsBrowser || Boolean(browser && browser.status === 'pass');
  conditions.push(cond('browser_qa_where_required', browserOk,
    !needsBrowser ? 'the change does not touch anything the four validators cannot see, so browser QA is not required for it.'
      : browser ? `browser QA: ${browser.status}` : 'the change touches something the four validators cannot see and no browser run is attached. A missing browser is exit 2, and exit 2 is not a pass.',
    browserOk ? null : 'node agent/browser/cli.mjs --require-browser'));

  const risk = proposal?.risk ?? null;
  const riskOk = ['none', 'low'].includes(risk);
  conditions.push(cond('acceptable_risk', riskOk,
    risk ? `the proposal states risk "${risk}".${riskOk ? '' : ' Automatic execution is reserved to none and low.'}` : 'the proposal does not state a risk. A proposal that cannot say what it costs if it is wrong has not been thought about.',
    riskOk ? null : 'a proposal at medium risk or above is decided by a person.'));

  const rb = proposal?.rollback_plan ?? null;
  const rollbackOk = Boolean(rb && rb.method && rb.method !== 'not_reversible' && (rb.steps ?? []).length && rb.verification);
  conditions.push(cond('valid_rollback', rollbackOk,
    rb ? (rollbackOk ? `${rb.method}, ${rb.steps.length} step(s), verified by: ${rb.verification}` : `the rollback plan is ${rb.method === 'not_reversible' ? 'not_reversible' : 'incomplete'}`) : 'no rollback plan.',
    rollbackOk ? null : 'protocol §17: a previous known-good state, a change identifier, a procedure, an execution mechanism and a post-rollback validation. "Rollback available" as a boolean is not one.'));

  const scopeOk = Boolean(scope && (scope.permitted ?? []).length && !(scope.refusals ?? []).length);
  conditions.push(cond('permitted_scope', scopeOk,
    scope ? (scopeOk ? `${scope.permitted.length} permitted path(s), derived from the proposal rather than taken as an argument.` : `${(scope.refusals ?? []).length} refused path(s), or none derivable.`) : 'no scope was derived.',
    scopeOk ? null : 'the proposal names the files it touches, and none of them is a path no agent may write.'));

  const categoryOk = category !== null && APPROVED_AUTONOMOUS_CATEGORIES.includes(category);
  conditions.push(cond('allowed_action_category', categoryOk,
    `${category ? `the action names category "${category}", and ` : 'the action names no category, and '}APPROVED_AUTONOMOUS_CATEGORIES is empty. ${AUTONOMY_NOTE}`,
    `a governance decision, taken by a person, enabling one of: ${LOW_RISK_CATEGORIES.join(', ')}. Protocol §24 reserves that decision; nothing in this system may take it.`));

  const humanOk = Boolean(humanReview) && humanReview.required === false;
  conditions.push(cond('no_mandatory_human_review', humanOk,
    humanReview ? (humanReview.required ? `${humanReview.reasons.length} trigger(s): ${[...new Set(humanReview.reasons.map((r) => r.code))].join(', ')}` : 'none of the ten triggers fired.') : 'human review was not evaluated, which is not the same as it not being required.',
    humanOk ? null : 'each trigger is closed by the producing agent or decided by a person. No amount of model confidence overrides one — protocol §19.'));

  const failed = conditions.filter((c) => !c.satisfied);
  return {
    permitted: failed.length === 0,
    conditions,
    failed,
    checked: [...MANDATORY_AUTONOMY_CONDITIONS],
    note: AUTONOMY_NOTE,
    summary: failed.length === 0
      ? 'every mandatory condition is satisfied. This does NOT mean anything executes: no workflow in this system publishes, and the last stage of every one of the ten is a person.'
      : `${failed.length} of ${MANDATORY_AUTONOMY_CONDITIONS.length} mandatory condition(s) fail: ${failed.map((c) => c.condition).join(', ')}. Failure of one blocks automatic execution.`,
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
