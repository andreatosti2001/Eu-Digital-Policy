/* ============================================================
   agent/schemas/validate.mjs — the one gate

   `validate(record)` is the whole enforcement surface. It needs no
   out-of-band knowledge: a record names its own contract, so
   anything handed between two agents can be checked by whoever
   receives it. That is what "no agent may bypass these contracts"
   means in practice — not a policy, a function that returns errors.

   Four layers of check, in this order, because a later one is
   meaningless if an earlier one failed:

   1. IDENTITY    is this a record of a contract that exists, at a
                  version this code knows
   2. SHAPE       closed shapes, declared types, forbidden fields
                  answered with the actual objection rather than
                  "unknown field"
   3. EPISTEMIC   the part that exists because of what this site is:
                  a factual field must cite evidence; an inference
                  must say what it was concluded from; an
                  interpretation must say whose it is; "unknown" and
                  null must be told apart; nothing may be filed
                  under two states at once
   4. GOVERNANCE  autonomy class against what the record actually
                  touches, plus the contract's own cross-field rules

   Everything returns an array of human-readable problems. Empty
   means valid. Nothing throws except `assertValid`, which is the
   form an agent should call.
   ============================================================ */

import { checkShape, readPath } from './fields.mjs';
import { getContract, CONTRACTS } from './registry.mjs';
import {
  CONTRACT_SCHEMA_VERSION, UNKNOWN, LEGAL_ENTITY_KINDS, RED_TARGETS,
  AUTONOMY_RANK, REQUIRED_VALIDATORS,
} from './types.mjs';

/* ---------------------------------------------------------- helpers */

const arr = (v) => (Array.isArray(v) ? v : []);

/** The fields a contract declares at the top level with a given
 *  epistemic class. Deliberately top level only: an epistemic
 *  annotation deeper inside — on an evidence ref's title, say —
 *  describes that evidence, not what this record asserts, and
 *  requiring a block entry for every one would bury the entries
 *  that matter. */
function fieldsWithEpistemic(contract, klass) {
  return Object.entries(contract.fields)
    .filter(([, sp]) => sp.epistemic === klass)
    .map(([name]) => name);
}

const namesIn = (entries) => new Set(entries.map((e) => e?.field).filter((f) => typeof f === 'string'));

/* ---------------------------------------------------------- epistemic */

function checkEpistemic(contract, r, errs) {
  const e = r.epistemic;
  if (!e || typeof e !== 'object') return; // the shape check has already said so

  const fact = arr(e.fact);
  const inference = arr(e.inference);
  const interpretation = arr(e.interpretation);
  const unresolved = arr(e.unresolved);

  const evidenceById = new Map(arr(r.evidence).map((x) => [x?.evidence_id, x]));

  /* a field may be in one state, not two */
  const buckets = { fact: namesIn(fact), inference: namesIn(inference), interpretation: namesIn(interpretation) };
  for (const [a, b] of [['fact', 'inference'], ['fact', 'interpretation'], ['inference', 'interpretation']]) {
    for (const f of buckets[a]) {
      if (buckets[b].has(f)) {
        errs.push(`epistemic: "${f}" is filed as both ${a} and ${b} — a statement is read, concluded or offered, not two of those`);
      }
    }
  }

  /* every declared factual field, present and answered, must cite */
  for (const name of fieldsWithEpistemic(contract, 'factual')) {
    const v = r[name];
    if (v === undefined || v === null || v === UNKNOWN) continue;
    if (!buckets.fact.has(name)) {
      errs.push(`epistemic.fact: "${name}" holds a factual value with no entry naming it — a fact in this repository carries the source it was read from`);
    }
  }
  for (const name of fieldsWithEpistemic(contract, 'inference')) {
    const v = r[name];
    if (v === undefined || v === null || v === UNKNOWN) continue;
    if (!buckets.inference.has(name)) {
      errs.push(`epistemic.inference: "${name}" holds a concluded value with no entry naming it — say what it was concluded from and by what method`);
    }
  }
  for (const name of fieldsWithEpistemic(contract, 'interpretation')) {
    const v = r[name];
    if (v === undefined || v === null || v === UNKNOWN) continue;
    if (!buckets.interpretation.has(name)) {
      errs.push(`epistemic.interpretation: "${name}" holds a reading with no entry naming it — an unattributed interpretation reads as law`);
    }
  }

  /* facts must resolve to real evidence, and the evidence must be
     capable of supporting them */
  fact.forEach((f, i) => {
    for (const ref of arr(f?.evidence_refs)) {
      const ev = evidenceById.get(ref);
      if (!ev) {
        errs.push(`epistemic.fact[${i}]: evidence_ref "${ref}" resolves to nothing in this record's evidence array`);
        continue;
      }
      if (ev.kind === 'absent') {
        errs.push(`epistemic.fact[${i}]: cites evidence "${ref}", whose kind is "absent" — an absence cannot establish a fact`);
      }
    }
    const cited = arr(f?.evidence_refs).map((ref) => evidenceById.get(ref)).filter(Boolean);
    if (cited.length && cited.every((ev) => ev.supports === 'supports:context')) {
      errs.push(`epistemic.fact[${i}] ("${f.statement}"): every cited source is "supports:context" — context informs a claim without establishing it, and is not a citation`);
    }
  });

  /* null and unknown are different states, and the block must say
     which one it is talking about */
  for (const [name, sp] of Object.entries(contract.fields)) {
    const v = r[name];
    const entry = unresolved.find((u) => u?.field === name);
    if (v === UNKNOWN && sp.unknownable) {
      if (!entry) {
        errs.push(`"${name}" is "unknown" with no epistemic.unresolved entry: researched-and-not-publicly-determinable is a finding, and it is recorded as one`);
      } else if (entry.absence_kind !== 'unknown_not_determinable') {
        errs.push(`"${name}" is "unknown" but its unresolved entry says "${entry.absence_kind}": those are different states`);
      }
    }
    if (entry && entry.absence_kind === 'unknown_not_determinable' && v !== UNKNOWN) {
      errs.push(`epistemic.unresolved names "${name}" as researched-and-not-determinable, but the field is ${JSON.stringify(v)} rather than "unknown"`);
    }
    if (entry && entry.absence_kind === 'null_not_researched' && v !== null && v !== undefined) {
      errs.push(`epistemic.unresolved names "${name}" as not researched, but the field carries a value: null means nobody looked`);
    }
  }

  /* an unresolved entry never carries the answer */
  unresolved.forEach((u, i) => {
    if (u && typeof u === 'object' && u.missing && u.missing === u.question) {
      errs.push(`epistemic.unresolved[${i}]: "missing" repeats the question — say what would close it, not that it is open`);
    }
  });
}

/* ---------------------------------------------------------- evidence */

function checkEvidence(r, errs) {
  const seen = new Set();
  arr(r.evidence).forEach((ev, i) => {
    if (!ev || typeof ev !== 'object') return;
    const at = `evidence[${i}]`;
    if (seen.has(ev.evidence_id)) errs.push(`${at}: duplicate evidence_id "${ev.evidence_id}"`);
    seen.add(ev.evidence_id);

    if (ev.kind === 'retrieved_document') {
      if (!ev.url && !ev.locator) errs.push(`${at}: a retrieved document needs a url or a locator — a citation nobody can follow is not one`);
      if (!ev.retrieved_at) errs.push(`${at}: a retrieved document needs a retrieved_at, or it cannot be re-checked`);
    }
    if (ev.kind === 'repository_file' && !ev.locator) {
      errs.push(`${at}: a repository_file needs a locator — which file, and where in it`);
    }
    if (ev.kind === 'absent') {
      if (ev.supports !== null) errs.push(`${at}: kind is "absent" but supports is "${ev.supports}" — nothing cannot support anything`);
      if (ev.role !== 'unresolved') errs.push(`${at}: kind is "absent" but role is "${ev.role}" — an absence has the role "unresolved"`);
      if (arr(r.epistemic?.unresolved).length === 0) {
        errs.push(`${at}: the record cites an absence but epistemic.unresolved is empty — say what is missing`);
      }
    } else if (ev.supports === null) {
      errs.push(`${at}: kind is "${ev.kind}" but supports is null — say how it bears on the record, in data/claims.json's own vocabulary`);
    }
    if (ev.simulated === true && r.simulated !== true) {
      errs.push(`${at}: simulated evidence on a record that is not marked simulated — a fixture must never read as research`);
    }
  });
}

/* ---------------------------------------------------------- governance */

function redTargets(r) {
  const hits = [];
  for (const ent of arr(r.affected_entities)) {
    const hay = `${ent?.path ?? ''} ${ent?.field ?? ''} ${ent?.id ?? ''}`.toLowerCase();
    for (const t of RED_TARGETS) if (hay.includes(t.toLowerCase())) hits.push(`${t} (${ent.path ?? ent.id ?? ent.kind})`);
  }
  return hits;
}

const SITE_SURFACE = /^(data\/|js\/|css\/|i18n\/|tools\/)|\.html$/;

function touchesSiteSurface(r) {
  const paths = [
    ...arr(r.affected_entities).map((e) => e?.path ?? ''),
    ...arr(r.proposed_change?.operations).map((o) => String(o?.target ?? '')),
  ];
  return paths.some((p) => SITE_SURFACE.test(p))
    || arr(r.affected_entities).some((e) => LEGAL_ENTITY_KINDS.includes(e?.kind));
}

function checkGovernance(contract, r, errs) {
  const blocking = arr(r.epistemic?.unresolved).filter((u) => u?.blocks === true);

  if (r.autonomy_class) {
    const rank = AUTONOMY_RANK[r.autonomy_class] ?? 0;

    const legal = arr(r.affected_entities).filter((e) => LEGAL_ENTITY_KINDS.includes(e?.kind));
    if (legal.length && rank < AUTONOMY_RANK.review_required) {
      errs.push(`autonomy_class is "${r.autonomy_class}" but this touches the legal record (${legal.map((e) => e.kind).join(', ')}): getting one of those wrong makes the site state something false, which is amber at best`);
    }

    const red = redTargets(r);
    if (red.length && rank < AUTONOMY_RANK.human_only) {
      errs.push(`autonomy_class is "${r.autonomy_class}" but this touches ${red.join(', ')}: red tier under docs/AI-SAFE-BOUNDARIES.md §3 — an agent may propose it and nothing more`);
    }

    if (blocking.length && r.autonomy_class === 'autonomous') {
      errs.push(`autonomy_class is "autonomous" with ${blocking.length} blocking unresolved question(s): nothing proceeds unattended on a record that says it is blocked`);
    }
  }

  if (contract.kind === 'proposal') {
    if (arr(r.evidence).length === 0) {
      errs.push('a proposal with no evidence: say what it is standing on, or cite an "absent" evidence entry and name the gap');
    }
    if (arr(r.affected_entities).length === 0) {
      errs.push('a proposal with no affected_entities: say what it is about');
    }
    const rb = r.rollback_plan ?? {};
    if (rb.method === 'not_reversible') {
      if (!rb.irreversible_reason) errs.push('rollback_plan.method is "not_reversible" but no reason is given: say what cannot be put back');
      if (r.autonomy_class !== 'human_only') {
        errs.push(`rollback_plan.method is "not_reversible" with autonomy_class "${r.autonomy_class}": a change nobody can undo is not one an agent makes unattended`);
      }
    }
    if (touchesSiteSurface(r)) {
      const cmds = arr(r.validation_requirements).map((v) => String(v?.command ?? '')).join(' ');
      const missing = REQUIRED_VALIDATORS.filter((v) => !cmds.includes(v));
      if (missing.length) {
        errs.push(`this touches data, markup, styles or scripts but validation_requirements omits ${missing.join(', ')}: all four validators run on any such change`);
      }
    }
  }
}

/* ---------------------------------------------------------- the gate */

/**
 * @param {object} record
 * @param {{allowSimulated?:boolean}} [opts]
 *   allowSimulated — off by default. A record marked simulated is a
 *   fixture, and treating a fixture as actionable is the failure the
 *   observability layer's simulation markers already guard against.
 * @returns {string[]} problems; empty means valid
 */
export function validate(record, opts = {}) {
  const errs = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return ['not an object'];

  const name = record.contract;
  if (typeof name !== 'string' || !(name in CONTRACTS)) {
    return [`unknown contract ${JSON.stringify(name)} — a record that does not name a contract in the registry cannot be checked, and is therefore not accepted`];
  }
  const contract = getContract(name);

  if (record.contract_version !== CONTRACT_SCHEMA_VERSION) {
    errs.push(`contract_version ${record.contract_version} is not ${CONTRACT_SCHEMA_VERSION}, which is the version this code knows how to check`);
  }

  /* forbidden fields answered with the objection, not "unknown field" */
  const working = { ...record };
  for (const [key, reason] of Object.entries(contract.forbidden)) {
    if (key in working) {
      errs.push(`${key}: ${reason}`);
      delete working[key];
    }
  }

  checkShape(contract.fields, working, '', errs);
  checkEvidence(record, errs);
  checkEpistemic(contract, record, errs);
  checkGovernance(contract, record, errs);

  for (const rule of contract.rules) {
    try { errs.push(...(rule(record) ?? [])); }
    catch (err) { errs.push(`a contract rule threw: ${err.message}`); }
  }

  if (record.simulated === true && !opts.allowSimulated) {
    errs.push('this record is marked simulated: it is a fixture and is never actionable. Pass { allowSimulated: true } to validate it as one.');
  }

  return errs;
}

/** The form an agent calls. Throws with every problem at once, not
 *  the first — a caller fixing one error at a time is a caller
 *  running the gate five times. */
export function assertValid(record, opts = {}) {
  const errs = validate(record, opts);
  if (errs.length) {
    const name = record?.contract ?? 'record';
    throw new Error(`${name} does not satisfy its contract:\n  · ${errs.join('\n  · ')}`);
  }
  return record;
}

export function isValid(record, opts = {}) { return validate(record, opts).length === 0; }

/**
 * Validate a set of records together and report references that do
 * not resolve inside it. Dangling references are returned
 * separately from errors: a record may legitimately reference
 * something that lives in another batch, and the honest answer is
 * "this batch cannot resolve it", not "this is invalid".
 */
export function validateBatch(records, opts = {}) {
  const results = records.map((r) => ({ record: r, errors: validate(r, opts) }));
  const ids = new Set();
  for (const r of records) {
    const c = CONTRACTS[r?.contract];
    if (c) ids.add(r[c.id_field]);
  }
  const REF_FIELDS = [
    'proposal_id', 'approval_id', 'qa_result_id', 'change_record_id', 'verification_ref',
    'established_by', 'closed_by', 'supersedes',
  ];
  const REF_ARRAYS = ['proposal_ids', 'approval_ids', 'qa_result_ids', 'verification_ids', 'source_candidate_ids'];
  const unresolved_refs = [];
  for (const r of records) {
    const c = CONTRACTS[r?.contract];
    if (!c) continue;
    const from = `${r.contract} ${r[c.id_field]}`;
    for (const f of REF_FIELDS) {
      const v = readPath(r, f);
      if (typeof v === 'string' && !ids.has(v)) unresolved_refs.push({ from, field: f, ref: v });
    }
    for (const f of REF_ARRAYS) {
      for (const v of arr(r[f])) if (!ids.has(v)) unresolved_refs.push({ from, field: f, ref: v });
    }
  }
  return {
    results,
    valid: results.filter((x) => x.errors.length === 0).length,
    invalid: results.filter((x) => x.errors.length > 0).length,
    unresolved_refs,
  };
}
