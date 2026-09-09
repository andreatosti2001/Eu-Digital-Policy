/* ============================================================
   agent/policy/conditions.mjs — the twelve things that must ALL be
   true before anything happens without a person

   SESSION 23 lists them, and protocol §18 adds the sentence that
   makes them a policy rather than a checklist: "Failure of one
   mandatory condition blocks automatic execution."

   THREE VERDICTS, NOT TWO, AND THE THIRD IS THE WHOLE POINT.
   `satisfied` · `failed` · `unknown`. An `unknown` blocks exactly as
   an outright failure does. This is the project's own §0.3 rule —
   null is not unknown, unknown is never zero, and nothing may travel
   from not-looked-at to fine — applied where getting it wrong would
   let a machine write to a website about EU law. A caller that
   simply omits a fact gets `unknown`, and `unknown` does not
   execute.

   EIGHT OF THE TWELVE CANNOT BE SUPPLIED AT ALL. They are read out
   of the proposal record itself, here, on every evaluation:
   provenance, schema validity, risk, category, scope, rollback,
   human-review triggers, and the authoritativeness of the evidence.
   The reasoning is `agent/implement/preflight.mjs`'s and it is worth
   repeating: the thing being constrained does not get to supply the
   constraint. There is no `skip`, no `assume`, and no
   `permittedFiles` parameter.

   FOUR OF THE TWELVE ARE MEASUREMENTS AND MUST BE SUPPLIED —
   verification, conflicts, validators, browser QA. Running the four
   validators takes a minute and a half and opening a browser takes
   longer; an evaluator that ran them itself on every call would be
   an evaluator nobody calls. So the caller passes what it measured,
   and this module says plainly what that means: WITHIN ONE PROCESS,
   A CALLER CAN PASS A FALSE FACT. That is not closed here and
   pretending otherwise would be worse than the gap. What IS closed
   is the default — absent means unknown means blocked — and where
   the enforcement actually happens, `agent/implement/`, the facts
   are the return values of runs that just happened rather than
   arguments from anywhere.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validate } from '../schemas/validate.mjs';
import { getContract } from '../schemas/registry.mjs';
import { REPO_ROOT } from '../schemas/types.mjs';
import { permittedFiles, requiresBrowserQA, NEVER_WRITABLE } from '../implement/scope.mjs';
import { assessRollback } from './rollback.mjs';
import { ACTION_CATEGORIES, categoriseProposal, effectiveClass, riskRank } from './categories.mjs';

/** The twelve, in the order SESSION 23 states them. */
export const CONDITIONS = [
  'authoritative_evidence',
  'verification_succeeded',
  'no_unresolved_conflict',
  'provenance_complete',
  'schema_validation',
  'validators_pass',
  'browser_qa',
  'risk_within_threshold',
  'rollback_mechanical',
  'scope_permitted',
  'category_allowed',
  'no_mandatory_human_review',
];

/**
 * The conditions whose failure a human approval does NOT cure.
 * Protocol §8: human approval "does not override provenance
 * requirements; validation requirements; security requirements;
 * scope restrictions; mandatory policy conditions." A proposal that
 * fails one of these is not waiting for a reviewer — it is waiting
 * for the agent that owns it to close the gap.
 */
export const NOT_WAIVABLE_BY_APPROVAL = [
  'authoritative_evidence',
  'verification_succeeded',
  'no_unresolved_conflict',
  'provenance_complete',
  'schema_validation',
  'validators_pass',
  'browser_qa',
  'rollback_mechanical',
  'scope_permitted',
];

/** Verdict constructors. Every one carries a `why`; every negative
 *  additionally carries what would close it. */
const sat = (condition, why, data = {}) => ({ condition, verdict: 'satisfied', why, ...data });
const bad = (condition, why, closes, data = {}) => ({ condition, verdict: 'failed', why, closes, ...data });
const unk = (condition, why, closes, data = {}) => ({ condition, verdict: 'unknown', why, closes, ...data });
const na = (condition, why, data = {}) => ({ condition, verdict: 'not_applicable', why, ...data });

const AUTHORITATIVE_ROLES = ['primary', 'official'];
const AUTHORITATIVE_TIERS = ['tier:1', 'tier:2'];

let _sources = null;
function sourceTier(id, { root = REPO_ROOT } = {}) {
  if (!id) return null;
  if (_sources === null) {
    try {
      const raw = JSON.parse(readFileSync(join(root, 'data', 'sources.json'), 'utf8'));
      const list = Array.isArray(raw) ? raw : (raw.sources ?? []);
      _sources = new Map(list.filter((s) => s && s.id).map((s) => [s.id, s]));
    } catch { _sources = new Map(); }
  }
  const s = _sources.get(id);
  return s ? (s.tier ?? null) : null;
}

/* ============================================================
   THE TWELVE
   ============================================================ */

/** 1 · authoritative evidence exists. Derived from the record. */
export function authoritativeEvidence(proposal, { root = REPO_ROOT } = {}) {
  const ev = proposal?.evidence ?? [];
  if (!ev.length) {
    return bad('authoritative_evidence', 'the proposal carries no evidence at all, and does not say that it has none.', 'evidence is not optional and "absent" is a first-class kind. A record that stands on nothing says so in its own body.');
  }
  const real = ev.filter((e) => e.kind !== 'absent');
  if (!real.length) {
    return bad('authoritative_evidence', `all ${ev.length} evidence entr(ies) are of kind "absent" — the record is correctly saying it stands on nothing.`, 'an act automated on an admitted absence of evidence is the exact substitution AI-SAFE-BOUNDARIES §0.2 prohibits. It needs a retrieved document.');
  }
  const simulated = real.filter((e) => e.simulated === true);
  if (simulated.length === real.length) {
    return bad('authoritative_evidence', `all ${real.length} evidence entr(ies) are marked simulated.`, 'a simulated record is never actionable. AI-SAFE-BOUNDARIES §0.1: fixture data that reads as research is a worse defect than no fixtures.', { simulated: simulated.length });
  }
  const authoritative = real.filter((e) => {
    if (e.simulated === true) return false;
    if (AUTHORITATIVE_ROLES.includes(e.role)) return true;
    const tier = sourceTier(e.source_id, { root });
    return tier !== null && AUTHORITATIVE_TIERS.includes(tier);
  });
  if (!authoritative.length) {
    const roles = [...new Set(real.map((e) => e.role ?? 'unresolved'))];
    return bad('authoritative_evidence', `${real.length} evidence entr(ies), none of them authoritative: role(s) ${roles.join(', ')}, and no source_id resolves to a tier:1 or tier:2 record in data/sources.json.`,
      'docs/SOURCE-POLICY.md: what may be cited, and what a citation can support. A secondary or interpretive source can support a human decision; it cannot be the thing an automatic act stands on.', { roles });
  }
  return sat('authoritative_evidence', `${authoritative.length} of ${real.length} evidence entr(ies) are authoritative (role primary/official, or a tier:1/tier:2 source record).`, { authoritative: authoritative.length, total: real.length });
}

/** 2 · verification succeeded. SUPPLIED. */
export function verificationSucceeded(facts) {
  const v = facts?.verification;
  if (v === undefined || v === null) {
    return unk('verification_succeeded', 'no verification result was supplied to this evaluation.', 'run agent/verifier/ over the records this proposal turns on and pass the result. An unrun verification is unknown, and unknown does not execute.');
  }
  if (Array.isArray(v.verdicts) && v.verdicts.length) {
    const bad_ = v.verdicts.filter((x) => ['contradicted', 'conflict', 'not_determinable', 'source_unavailable'].includes(x.verdict ?? x));
    if (bad_.length) {
      return bad('verification_succeeded', `${bad_.length} of ${v.verdicts.length} verification verdict(s) are not a confirmation: ${bad_.map((x) => x.verdict ?? x).join(', ')}.`, 'only "confirmed" and "partially_confirmed" are a verification succeeding. The rest are findings and belong in front of a person.', { verdicts: v.verdicts });
    }
    return sat('verification_succeeded', `${v.verdicts.length} verification verdict(s), all confirmations.`, { verdicts: v.verdicts.length });
  }
  if (typeof v.succeeded !== 'boolean') {
    return unk('verification_succeeded', 'the supplied verification result says neither that it succeeded nor that it failed.', 'a verification result with no verdict is not a verification.');
  }
  return v.succeeded
    ? sat('verification_succeeded', v.why ?? 'the supplied verification result reports success.')
    : bad('verification_succeeded', v.why ?? 'the supplied verification result reports failure.', 'the record goes back to the verifier, not forward to an implementer.');
}

/** 3 · no unresolved conflict. SUPPLIED, and also read from the record. */
export function noUnresolvedConflict(proposal, facts) {
  const own = [...(proposal?.conflicts ?? []), ...(proposal?.contradictions ?? [])];
  if (own.length) {
    return bad('no_unresolved_conflict', `the proposal itself records ${own.length} unresolved conflict(s).`, 'protocol §19 reserves an unresolved contradiction to a human. A machine that picks a side has decided a legal question.', { conflicts: own.length });
  }
  const c = facts?.conflicts;
  if (c === undefined || c === null) {
    return unk('no_unresolved_conflict', 'no conflict scan was supplied to this evaluation.', 'run the change detector, or pass { conflicts: { found: 0, why: "…" } } from something that actually looked. An unchecked absence of conflict is not an absence of conflict.');
  }
  const n = typeof c.found === 'number' ? c.found : (Array.isArray(c.items) ? c.items.length : null);
  if (n === null) return unk('no_unresolved_conflict', 'the supplied conflict scan does not say how many it found.', 'report a count, or a list. "No conflicts" with nothing behind it is a claim.');
  return n === 0
    ? sat('no_unresolved_conflict', c.why ?? 'the supplied conflict scan found none.')
    : bad('no_unresolved_conflict', `${n} unresolved conflict(s): ${(c.items ?? []).slice(0, 3).map((i) => i.what ?? i).join(' · ')}`, 'a conflict is closed by evidence or by a human decision, not by proceeding.', { conflicts: n });
}

/** 4 · provenance complete. Derived. The same test preflight gate 7
 *  applies, kept in one place by calling the same shapes. */
export function provenanceComplete(proposal) {
  const ev = proposal?.evidence ?? [];
  const ep = proposal?.epistemic ?? {};
  const blocking = (ep.unresolved ?? []).filter((u) => u.blocks);
  if (blocking.length) {
    return bad('provenance_complete', `${blocking.length} blocking open question(s): ${blocking.map((u) => u.question).slice(0, 2).join(' · ')}`, `an unresolved entry with blocks=true says nothing downstream may proceed until it is closed: ${blocking.map((u) => u.missing).slice(0, 2).join(' · ')}`, { blocking: blocking.length });
  }
  if (!ev.length) {
    return bad('provenance_complete', 'no evidence array at all.', 'every material factual proposition must remain traceable to its evidence (protocol §5).');
  }
  const facts = ep.fact ?? [];
  const dangling = facts.filter((f) => !(f.evidence_refs ?? []).every((r) => ev.some((e) => e.evidence_id === r)));
  if (dangling.length) {
    return bad('provenance_complete', `${dangling.length} fact(s) cite an evidence_id the record does not carry.`, 'the chain source → evidence → claim must be reconstructable. A citation to nothing is a broken link in it (protocol §28).');
  }
  const trace = proposal?.trace_ref ?? null;
  if (!trace?.trace_id || !trace?.run_id) {
    return bad('provenance_complete', 'the proposal carries no trace_ref, so the run that produced it cannot be identified.', 'protocol §28: if any link in the chain is missing, the system must identify the trace as incomplete rather than fabricating it.');
  }
  return sat('provenance_complete', `${ev.length} evidence reference(s), ${facts.length} fact(s) all citing evidence the record carries, ${(ep.unresolved ?? []).length} open question(s) none blocking, and a trace_ref back to run ${String(trace.run_id).slice(0, 8)}.`);
}

/** 5 · schema validation. Derived — re-run now, not trusted from
 *  when the record was written. */
export function schemaValidation(proposal) {
  if (!proposal) return bad('schema_validation', 'there is no record to validate.', 'an act with no proposal behind it has nothing to check.');
  let contract = null;
  try { contract = getContract(proposal.contract); } catch { /* below */ }
  if (!contract) return bad('schema_validation', `"${proposal.contract}" is not a registered contract.`, 'agent/schemas/registry.mjs is the list. A record outside it is outside the gate every other record passes.');
  if (contract.kind !== 'proposal') {
    return bad('schema_validation', `contract kind is "${contract.kind}", not "proposal".`, 'a finding, a record or an observation is not something to execute.');
  }
  if (proposal.simulated === true) {
    return bad('schema_validation', 'the record is marked simulated.', 'a simulated record is never actionable — agent/schemas/validate.mjs refuses one unless a caller explicitly asks for a fixture, and an execution path is not that caller.');
  }
  const errs = validate(proposal, { allowSimulated: false });
  return errs.length === 0
    ? sat('schema_validation', `the record satisfies ${proposal.contract}, re-checked now rather than trusted from when it was written.`)
    : bad('schema_validation', `${errs.length} contract error(s): ${errs.slice(0, 3).join('; ')}`, 'the proposal is regenerated by the agent that owns it. An executor that repaired a proposal would be executing one nobody approved.', { errors: errs });
}

/** 6 · the project's validators. SUPPLIED. */
export function validatorsPass(facts) {
  const v = facts?.validators;
  if (v === undefined || v === null) {
    return unk('validators_pass', 'no validator run was supplied to this evaluation.', 'run the four validators and pass the QAResult checks. AGENTS.md: run all four before and after any change to data, markup, styles or scripts.');
  }
  /* Before the verdict, not after it: a run that reports "pass" over
     a check it could not execute has already contradicted itself,
     and reading its verdict first would let it. */
  const notRun = (v.checks ?? []).filter((c) => c.exit_code === 127);
  if (notRun.length) {
    return bad('validators_pass', `${notRun.length} check(s) could not be executed: ${notRun.map((c) => c.name).join(', ')}`, 'a validator that could not be executed is not a validator that passed. agent/implement/checks.mjs already refuses to treat a missing run as a pass.', { not_run: notRun.map((c) => c.name) });
  }
  if (v.verdict === 'fail') {
    return bad('validators_pass', `the supplied validator run reports "fail": ${(v.blocking_findings ?? []).slice(0, 3).join(' · ') || 'no findings were listed'}`, 'the change is reverted and the finding is fixed. Weakening a validator to obtain a pass is prohibition 16.', { run_verdict: v.verdict });
  }
  if (v.verdict === 'pass_with_findings') {
    return bad('validators_pass', `the supplied validator run reports "pass_with_findings": ${(v.blocking_findings ?? []).slice(0, 3).join(' · ')}`, 'AGENTS.md: a new warning is a finding, not noise. A finding is a human\'s to read; it is not a condition an automatic act satisfies.', { run_verdict: v.verdict });
  }
  if (v.verdict !== 'pass') {
    return unk('validators_pass', `the supplied validator run reports "${v.verdict ?? 'nothing'}", which is not one of pass · pass_with_findings · fail.`, 'a verdict this policy does not recognise is unknown, and unknown does not execute.');
  }
  return sat('validators_pass', `the supplied validator run reports "pass" across ${(v.checks ?? []).length} check(s), each against its recorded baseline.`);
}

/** 7 · browser QA where relevant. Derived requirement, supplied result. */
export function browserQA(proposal, facts, { permitted = null } = {}) {
  const paths = permitted ?? permittedFiles(proposal ?? {}).permitted;
  const needs = requiresBrowserQA(paths);
  if (!needs.length) {
    return na('browser_qa', `nothing in scope touches a page, a stylesheet, a module or a locale (${paths.length} path(s)), so there is nothing a rendered page could show that the four validators cannot.`);
  }
  const b = facts?.browser_qa;
  if (b === undefined || b === null) {
    return unk('browser_qa', `${needs.join(', ')} would change what a browser renders, and no browser run was supplied.`, 'node agent/browser/cli.mjs --require-browser. SESSION 18 requirement 7: a skipped browser suite is carried through as a non-zero exit, never as a pass.', { required_by: needs });
  }
  if (b.skipped || b.ran === false) {
    return bad('browser_qa', `the browser suite did not run: ${b.why ?? b.reason ?? 'no reason given'}`, 'a missing browser is a hard failure where the change needs one. --require-browser makes it one.', { required_by: needs });
  }
  if (b.verdict && b.verdict !== 'pass') {
    return bad('browser_qa', `the browser suite reports "${b.verdict}": ${(b.failures ?? []).slice(0, 3).join(' · ')}`, 'the rendered page is the thing a reader gets. A regression there is not an automatic act\'s to accept.', { required_by: needs });
  }
  return sat('browser_qa', `required by ${needs.join(', ')}, and the supplied browser run reports "pass".`, { required_by: needs });
}

/** 8 · risk below the permitted threshold. Derived, against policy. */
export function riskWithinThreshold(proposal, policy) {
  const risk = proposal?.risk ?? null;
  if (!risk) return bad('risk_within_threshold', 'the proposal declares no risk.', 'risk is a required field on every proposal contract. A proposal that cannot say what it costs if it is wrong has not been thought about.');
  const ceiling = policy?.max_automatic_risk ?? 'none';
  return riskRank(risk) <= riskRank(ceiling)
    ? sat('risk_within_threshold', `declared risk "${risk}" is at or under the policy ceiling "${ceiling}".`, { risk, ceiling })
    : bad('risk_within_threshold', `declared risk "${risk}" is above the policy ceiling "${ceiling}".`, `the ceiling is raised by a governance decision, not by the proposal. Protocol §24: the system must not autonomously rewrite its own governance policy.`, { risk, ceiling });
}

/**
 * 9 · rollback, mechanically. Derived.
 *
 * THREE VERDICTS, NOT TWO, AND SESSION 27 IS WHY.
 *
 * `assessRollback()` reports each of the six elements as `present`,
 * `absent` or `unknown`, and those last two are not the same thing.
 * `absent` is established: the plan says `not_reversible`, or the
 * context is on `main`, or nothing names what is being undone.
 * `unknown` is not established: no change context has been opened
 * yet, so nothing here knows what the tree looked like before.
 *
 * Until SESSION 27 this function collapsed both into `failed`, which
 * is this repository's own §0.3 error — reporting "I have looked and
 * it is not there" about something nobody has looked at. The
 * consequence was structural rather than cosmetic. A change context
 * is produced by `agent/implement/apply.mjs openContext()` in step 2
 * of the autonomy cycle, and `agent/autonomy/cycle.mjs` evaluates
 * this condition in gate 3, which runs before step 1. So four of the
 * six elements were `unknown` for EVERY proposal ever written, this
 * condition read `failed`, gate 3 refused, and **no proposal could
 * pass the autonomy gate ladder however well formed it was.**
 * `docs/CONTINUOUS-IMPROVEMENT.md` §4 has the measurement.
 *
 * NOTHING IS WEAKENED BY THIS, and the order of the checks is what
 * makes that true: **any `absent` element still fails**, whatever
 * else is unknown. The three cases `agent/policy/selftest.mjs` test 7
 * names — `not_reversible`, a context on `main`, and nothing supplied
 * at all — all carry at least one `absent` element and all still
 * fail. Only the pre-run case moves, and it moves from a false
 * statement to a true one.
 *
 * `unknown` is not a pass. `agent/policy/engine.mjs` blocks on it
 * exactly as it blocks on a failure; what changes is that
 * `agent/autonomy/cycle.mjs` may now list this among the conditions
 * that are MEASUREMENTS, allowed to be unknown before a run and
 * re-checked at step 6 on the real context — which is where
 * `facts.context` exists and where `mayMerge` requires every
 * mandatory condition satisfied. The binding check did not move; it
 * simply stopped being pre-empted by a check that could not answer.
 */
export function rollbackMechanical(proposal, facts, { permitted = null } = {}) {
  const r = assessRollback({ proposal, context: facts?.context ?? null, permitted });
  if (r.mechanical) return sat('rollback_mechanical', r.why, { elements: r.elements });

  const absent = r.elements.filter((e) => e.state === 'absent').map((e) => e.element);
  const unknown = r.elements.filter((e) => e.state === 'unknown').map((e) => e.element);

  /* Checked first, and it is the whole of why this is not a
     loosening: an element somebody has established is missing is a
     failure whatever else has not been looked at. */
  if (absent.length) {
    return bad('rollback_mechanical',
      `${r.why} ${absent.length} element(s) are established missing: ${absent.join(', ')}.`,
      `SESSION 23 names six elements and a boolean is not one of them. Established missing: ${absent.join(', ')}${unknown.length ? `; not yet established: ${unknown.join(', ')}` : ''}.`,
      { missing: r.missing, absent, unknown, elements: r.elements });
  }

  return unk('rollback_mechanical',
    `${r.why} No element is established missing; ${unknown.length} of six are NOT YET ESTABLISHED: ${unknown.join(', ')}. These read a change context, and no change context has been opened.`,
    'a change context — the branch, the base commit and the per-file pre-change hashes agent/implement/apply.mjs openContext() records. Before a run there is nothing to read, which is why this is unknown rather than failed. Unknown blocks exactly as a failure does, except where a caller has declared this a measurement it takes later and re-checks.',
    { missing: r.missing, absent, unknown, elements: r.elements });
}

/** 10 · every target file inside an explicitly permitted scope.
 *  Derived from the proposal, checked against the policy allowlist,
 *  and — where the caller has enforced scope against git afterwards
 *  — against what actually changed. */
export function scopePermitted(proposal, policy, facts) {
  const scope = permittedFiles(proposal ?? {});
  if (scope.refusals.length) {
    return bad('scope_permitted', `the proposal names ${scope.refusals.length} path(s) that may never be written: ${scope.refusals.map((r) => r.path).join(', ')}`, scope.refusals.map((r) => r.why).join(' · '), { refusals: scope.refusals });
  }
  if (!scope.permitted.length) {
    return bad('scope_permitted', 'no repository path can be derived from the proposal.', 'a permitted set nobody can derive is a permitted set nobody can enforce.');
  }
  /* CHECKED BEFORE THE ALLOWLIST, because the two failures are not
     the same kind of thing and the engine treats them differently. A
     change that left the scope somebody approved is a boundary
     violation: protocol §8 says an approval does not cure it. A path
     that is merely not on the AUTOMATIC allowlist is not a violation
     at all — it is the ordinary state of every path in this
     repository, and it says only that a person decides rather than a
     machine. Marking the second `hard: false` is what stops the
     engine reporting "blocked, and an approval would not help" about
     a proposal whose only problem is that autonomy is switched
     off. */
  const enforced = facts?.scope_enforcement;
  if (enforced && enforced.ok === false) {
    return bad('scope_permitted', `the change left its approved scope: ${(enforced.outside ?? []).map((o) => o.path).join(', ')}`, 'an approval authorises the exact scope defined by the proposal and nothing beside it. The change is reverted.', { outside: enforced.outside });
  }
  const allow = policy?.automatic_path_allowlist ?? [];
  const outside = scope.permitted.filter((p) => !allow.some((a) => p === a || p.startsWith(a)));
  if (outside.length) {
    return bad('scope_permitted', `${outside.length} of ${scope.permitted.length} path(s) are outside the policy's automatic allowlist: ${outside.join(', ')}. The allowlist holds ${allow.length ? allow.join(', ') : 'nothing at all'}.`,
      allow.length ? 'the allowlist is widened by a governance decision naming the paths.' : 'the allowlist is empty because SESSION 23 establishes the policy rather than activating it. Nothing is automatically writable, which is the intended state.', { outside, allowlist: allow, hard: false });
  }
  return sat('scope_permitted', `${scope.permitted.length} path(s), all inside the policy allowlist, and none of them on agent/implement/scope.mjs's never-writable list${enforced ? '; git confirms the change touched nothing else' : ''}.`, { permitted: scope.permitted });
}

/** 11 · the action category is explicitly allowed. Derived. */
export function categoryAllowed(proposal, policy) {
  const c = categoriseProposal(proposal);
  const meta = ACTION_CATEGORIES[c.category];
  const enabled = policy?.enabled_categories ?? [];
  if (!meta.automatable) {
    return bad('category_allowed', `the derived category is "${c.category}", which no policy may automate: ${meta.human_review}. ${c.why}`, `${meta.what} Costs if wrong: ${meta.costs}`, { category: c.category });
  }
  if (!enabled.includes(c.category)) {
    return bad('category_allowed', `the derived category "${c.category}" is eligible for autonomy but is not enabled: the policy in force enables ${enabled.length ? enabled.join(', ') : 'no category at all'}.`,
      'protocol §20: initial autonomous production actions should be restricted to explicitly approved low-risk categories, and enabling one is a governance decision a human takes. SESSION 23: "Do NOT enable automatic production merge in this session."', { category: c.category, enabled });
  }
  const cls = effectiveClass(proposal, c.category);
  if (cls.effective === 'human_only') {
    return bad('category_allowed', `the category is enabled but the effective autonomy class is "human_only": ${cls.why}`, 'the stricter of the declared class and the class the category implies governs. docs/AUTONOMY-POLICY.md: misclassifying downward is the failure that document exists to prevent.', { category: c.category, class: cls });
  }
  return sat('category_allowed', `the derived category is "${c.category}", it is on the policy's enabled list, and the effective class is "${cls.effective}". ${c.why}`, { category: c.category, class: cls });
}

/** 12 · no mandatory human-review condition applies. Derived. */
export function noMandatoryHumanReview(proposal, { permitted = null } = {}) {
  const triggers = humanReviewTriggers(proposal, { permitted });
  return triggers.length === 0
    ? sat('no_mandatory_human_review', 'none of the thirteen conditions protocol §19 reserves to a human is present in this proposal.')
    : bad('no_mandatory_human_review', `${triggers.length} mandatory human-review condition(s): ${triggers.map((t) => t.trigger).join(', ')}`, triggers.map((t) => `${t.trigger}: ${t.why}`).join(' · '), { triggers });
}

/* ---------------------------------------------------------- triggers */

/**
 * Every §19 condition, each detected from something in the record
 * rather than from a judgement about it. A trigger a sufficiently
 * confident agent can talk its way past is not a trigger.
 */
export function humanReviewTriggers(proposal, { permitted = null } = {}) {
  const out = [];
  const add = (trigger, why) => out.push({ trigger, why });
  if (!proposal) { add('no_proposal', 'there is no record. An act with nothing behind it is reviewed by a person or not done.'); return out; }

  const c = categoriseProposal(proposal);
  const meta = ACTION_CATEGORIES[c.category];
  if (!meta.automatable) add(c.category, `${c.why} (${meta.human_review})`);

  const ep = proposal.epistemic ?? {};
  if ((ep.interpretation ?? []).length) add('legal_interpretation', `the proposal's own epistemic block records ${ep.interpretation.length} interpretation(s).`);
  const blocking = (ep.unresolved ?? []).filter((u) => u.blocks);
  if (blocking.length) add('ambiguous_legal_status', `${blocking.length} open question(s) the proposal marks as blocking.`);
  if ((ep.unresolved ?? []).some((u) => u.absence_kind === 'unknown_not_determinable')) {
    add('ambiguous_legal_status', 'the proposal records something researched and not publicly determinable. Unknown must not be resolved by proceeding.');
  }

  const paths = permitted ?? permittedFiles(proposal).permitted;
  const legal = paths.filter((p) => p.startsWith('data/') || p === 'index.html' || p.startsWith('i18n/'));
  if (legal.length && proposal.substantive !== false) {
    add('substantive_data_change', `${legal.join(', ')} is the legal record, and the proposal does not record itself as non-substantive.`);
  }
  const never = paths.filter((p) => NEVER_WRITABLE.some(([prefix]) => p === prefix || p.startsWith(prefix)));
  if (never.length) add('changes_outside_low_risk_scope', `${never.join(', ')} may never be written by an implementation agent, whatever a proposal says.`);

  if ((proposal.proposed_change?.operations ?? []).length > 20) {
    add('major_rewrite', `${proposal.proposed_change.operations.length} operations in one proposal. A diff large enough that reviewing it is not the same as reviewing the change is a major rewrite.`);
  }
  if (proposal.contract === 'EditorialProposal') add('substantive_editorial_change', 'an EditorialProposal is about what the brief says.');
  if (proposal.contract === 'ArchitectureProposal') add('architecture_change', 'an ArchitectureProposal is about how the site is built.');
  if (proposal.operation_kind === 'create_taxonomy_term') add('taxonomy_change', 'a new term in the enum authority every other dataset resolves against.');

  /* Deduplicated by trigger name, keeping the first reason. */
  const seen = new Set();
  return out.filter((t) => (seen.has(t.trigger) ? false : (seen.add(t.trigger), true)));
}

/* ---------------------------------------------------------- the set */

/**
 * All twelve, always. It would be cheaper to stop at the first
 * failure and it would produce a worse report — the reasoning is
 * `agent/implement/preflight.mjs`'s and it holds here too.
 *
 * @param {{proposal:object|null, facts?:object, policy:object}} args
 * @returns {object[]} one verdict per condition, in CONDITIONS order
 */
export const VERDICTS = ['satisfied', 'failed', 'unknown', 'not_applicable'];

export function evaluateConditions({ proposal, facts = {}, policy }) {
  const permitted = proposal ? permittedFiles(proposal).permitted : [];
  const out = [
    authoritativeEvidence(proposal),
    verificationSucceeded(facts),
    noUnresolvedConflict(proposal, facts),
    provenanceComplete(proposal),
    schemaValidation(proposal),
    validatorsPass(facts),
    browserQA(proposal, facts, { permitted }),
    riskWithinThreshold(proposal, policy),
    rollbackMechanical(proposal, facts, { permitted }),
    scopePermitted(proposal, policy, facts),
    categoryAllowed(proposal, policy),
    noMandatoryHumanReview(proposal, { permitted }),
  ];
  /* A verdict this module does not define would be read by the
     engine as neither satisfied nor unmet, and would therefore pass
     silently. That is not hypothetical: a `data` object carrying a
     `verdict` key once overwrote a condition's own verdict with the
     validator run's, turning "fail" into a word nothing matched, and
     an act that should have been blocked evaluated as automatic. It
     was caught by test 5 and it is refused here so that it cannot
     recur anywhere else. */
  for (const c of out) {
    if (!VERDICTS.includes(c.verdict)) {
      throw new Error(`condition "${c.condition}" returned verdict "${c.verdict}", which is not one of ${VERDICTS.join(', ')}. A verdict the engine cannot read is not a verdict, and failing closed here is the only safe reading.`);
    }
    if (!CONDITIONS.includes(c.condition)) throw new Error(`"${c.condition}" is not one of the twelve`);
  }
  return out;
}
