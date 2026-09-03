/* ============================================================
   agent/schemas/selftest.mjs

       node --test agent/schemas/selftest.mjs

   node:test, so this needs nothing installed — the same constraint
   the four validators in tools/ and the observability suite work
   under.

   What it holds down, in the order the contract layer would fail:

     · the eighteen contracts exist, are documented, and carry the
       envelope the session specified
     · every substantive proposal carries all twelve required fields
     · the vocabularies are the site's and the observability
       layer's, not copies of them
     · every contract can express all four epistemic states, and
       the validator makes it
     · a fact must cite evidence that can bear it
     · "unknown" and null are never interchangeable
     · autonomy class is checked against what a record actually
       touches
     · the gate cannot be bypassed, and what reaches the trace is a
       pointer rather than a second copy
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONTRACT_LIST, CONTRACTS, CONTRACT_NAMES, PROPOSAL_CONTRACTS, getContract } from './registry.mjs';
import { validate, assertValid, validateBatch } from './validate.mjs';
import { FIXTURES, simEvidence } from './fixtures.mjs';
import { toJsonSchema } from './export.mjs';
import { emit, handoff, receive, sha256Of, canonicalJson } from './gateway.mjs';
import { contentId, contentKey, entityKeys, IdMinter } from './identity.mjs';
import { ENVELOPE_FIELDS, PROPOSAL_FIELDS } from './common.mjs';
import { EPISTEMIC_STATUS, FIELD_EPISTEMICS, taxonomyIds, RISKS, APPROVAL_STATES, PROVENANCE_ROLES, LEGAL_STATUSES, LEGAL_STATUS_TAXONOMY, LEGAL_ENTITY_KINDS, REGULATORY_CHANGE_KINDS, DEPTH_GAP_KINDS, DEPTH_IMPACT_LEVELS, DATA_OPERATION_KINDS, GAP_ROUTES, GAP_ROUTE_RECIPIENT, PROPOSING_ROUTES } from './types.mjs';
import * as obsSchema from '../observability/schema.mjs';
import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { deterministicIds, deterministicClock } from '../observability/ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const fx = (name) => FIXTURES[name]();
const V = (r) => validate(r, { allowSimulated: true });

/** Assert a record is refused, and refused for the stated reason. A
 *  test that only asserts "some error" passes when the record is
 *  rejected for an unrelated typo. */
function refuses(record, fragment) {
  const errs = V(record);
  assert.ok(errs.length > 0, 'expected the record to be refused, and it was accepted');
  assert.ok(
    errs.some((e) => e.includes(fragment)),
    `expected an error containing "${fragment}", got:\n  · ${errs.join('\n  · ')}`,
  );
}

/* -------------------------------------------------------- the eighteen */

test('the eighteen contracts the sessions named all exist', () => {
  const required = [
    'SourceCandidate', 'VerificationRecord', 'ClaimEvidence', 'ChangeRecord', 'DataGap',
    'ArchitectureProposal', 'EditorialProposal', 'UXProposal', 'ImplementationProposal',
    'QAResult', 'ApprovalRequest', 'AgentObservation', 'AgentRun', 'WebsiteChange',
    /* SESSION 08 and SESSION 09. Appended rather than slotted in
       beside their nearest relatives: the order is the order they
       were named, and reordering it would change what
       CONTRACT_LIST[n] means. */
    'DataProposal', 'RegulatoryChange',
    /* SESSION 10. ImpactAssessment is about the SITE where
       RegulatoryChange is about the WORLD; it references the
       detection by change_id and restates none of it. */
    'ImpactAssessment',
    /* SESSION 11. KnowledgeGap is about REPRESENTATION where DataGap
       is about EVIDENCE: a concept the model has no place for, not a
       value that exists and is unsupported. */
    'KnowledgeGap',
  ];
  assert.deepEqual(CONTRACT_NAMES, required);
  assert.equal(CONTRACT_LIST.length, 18);
});

test('every field of every contract is documented and epistemically typed', () => {
  for (const c of CONTRACT_LIST) {
    for (const [key, sp] of Object.entries(c.fields)) {
      assert.ok(typeof sp.doc === 'string' && sp.doc.length > 10, `${c.name}.${key} has no documentation — two agents would read it differently`);
      assert.ok(FIELD_EPISTEMICS.includes(sp.epistemic), `${c.name}.${key} declares epistemic "${sp.epistemic}"`);
      assert.ok(typeof sp.kind === 'string', `${c.name}.${key} has no kind`);
    }
    assert.ok(c.id_field in c.fields, `${c.name}: id_field is not a declared field`);
    assert.ok(c.doc.length > 20, `${c.name} has no contract-level documentation`);
  }
});

test('every contract carries the envelope, including the epistemic block', () => {
  for (const c of CONTRACT_LIST) {
    for (const key of Object.keys(ENVELOPE_FIELDS)) {
      assert.ok(key in c.fields, `${c.name} is missing envelope field "${key}"`);
    }
    const ep = c.fields.epistemic;
    assert.equal(ep.kind, 'object');
    assert.deepEqual(Object.keys(ep.shape).sort(), [...EPISTEMIC_STATUS].sort(),
      `${c.name}: the epistemic block must distinguish exactly fact, inference, interpretation and unresolved`);
  }
});

test('every substantive proposal carries all twelve required fields', () => {
  const twelve = [
    'proposal_id', 'agent', 'created_at', 'affected_entities', 'reason', 'evidence',
    'confidence', 'risk', 'autonomy_class', 'proposed_change', 'validation_requirements', 'rollback_plan',
  ];
  assert.equal(PROPOSAL_CONTRACTS.length, 5);
  for (const c of PROPOSAL_CONTRACTS) {
    for (const key of twelve) {
      assert.ok(key in c.fields, `${c.name} is missing the required proposal field "${key}"`);
      assert.equal(c.fields[key].required, true, `${c.name}.${key} must be required`);
    }
  }
  for (const key of Object.keys(PROPOSAL_FIELDS)) {
    assert.ok(twelve.includes(key), `PROPOSAL_FIELDS declares "${key}", which is not one of the twelve`);
  }
});

test('a contract name is unique and every contract has a fixture', () => {
  assert.equal(new Set(CONTRACT_NAMES).size, 18);
  for (const name of CONTRACT_NAMES) assert.ok(typeof FIXTURES[name] === 'function', `${name} has no fixture`);
  assert.deepEqual(Object.keys(FIXTURES).sort(), [...CONTRACT_NAMES].sort());
});

/* ---------------------------------------------------------- one home per fact */

test('the trace vocabularies are the observability layer\'s own, not copies', () => {
  assert.equal(RISKS, obsSchema.RISKS);
  assert.equal(APPROVAL_STATES, obsSchema.APPROVAL_STATES);
  assert.equal(PROVENANCE_ROLES, obsSchema.PROVENANCE_ROLES);
});

test('taxonomy-valued enums resolve against data/taxonomy.json', () => {
  const supports = taxonomyIds('supports');
  assert.deepEqual(supports, ['supports:direct', 'supports:partial', 'supports:context']);
  const claimEvidence = getContract('ClaimEvidence');
  assert.deepEqual(claimEvidence.fields.supports.values, supports);
  const candidate = getContract('SourceCandidate');
  assert.deepEqual(candidate.fields.source_type.values, taxonomyIds('source_type'));
  assert.deepEqual(candidate.fields.url_status.values, taxonomyIds('url_status'));
  assert.deepEqual(candidate.fields.tier_estimate.values, taxonomyIds('source_tier'));
});

test('no JSON Schema copy is committed — the export is derived on demand', () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [d.name]));
  const files = walk(HERE);
  assert.equal(files.filter((f) => f.endsWith('.schema.json')).length, 0,
    'a committed JSON Schema would be a second home for every field definition');
});

/* ---------------------------------------------------------- fixtures */

test('every contract is satisfiable: its fixture validates', () => {
  for (const name of CONTRACT_NAMES) {
    assert.deepEqual(V(fx(name)), [], `${name} fixture:\n${V(fx(name)).join('\n')}`);
  }
});

test('every fixture is unmistakably simulated and cites nothing real', () => {
  for (const name of CONTRACT_NAMES) {
    const r = fx(name);
    assert.equal(r.simulated, true, `${name} fixture is not marked simulated`);
    const text = JSON.stringify(r);
    const urls = text.match(/https?:\/\/[^"\\]+/g) ?? [];
    for (const u of urls) {
      assert.ok(new URL(u).hostname.endsWith('.invalid'), `${name} fixture cites ${u}, which is not on an unresolvable host`);
    }
    for (const ev of r.evidence) assert.equal(ev.simulated, true, `${name} fixture has non-simulated evidence`);
  }
});

test('a simulated record is not actionable unless asked for explicitly', () => {
  const errs = validate(fx('QAResult'));
  assert.ok(errs.some((e) => e.includes('marked simulated')), 'a fixture was accepted as actionable');
  assert.deepEqual(validate(fx('QAResult'), { allowSimulated: true }), []);
});

/* ---------------------------------------------------------- identity */

test('a record that names no contract, or an unknown one, is refused', () => {
  assert.ok(validate({}).length);
  assert.ok(validate(null).length);
  assert.ok(validate([]).length);
  const errs = validate({ contract: 'SomethingElse' });
  assert.ok(errs[0].includes('unknown contract'));
});

test('a record written against another contract version is refused', () => {
  refuses({ ...fx('DataGap'), contract_version: 2 }, 'contract_version 2 is not 1');
});

test('assertValid throws with every problem at once', () => {
  const bad = { ...fx('DataGap'), gap_kind: 'not_a_kind', state: 'not_a_state' };
  assert.throws(() => assertValid(bad, { allowSimulated: true }), (err) => {
    assert.ok(err.message.includes('not_a_kind'));
    assert.ok(err.message.includes('not_a_state'));
    return true;
  });
});

/* ---------------------------------------------------------- shape */

test('shapes are closed: an undeclared field is refused', () => {
  refuses({ ...fx('DataGap'), improvised_field: 'x' }, 'not declared by this contract');
});

test('a forbidden field is refused with the actual objection, not "unknown field"', () => {
  refuses({ ...fx('DataGap'), substitute: 'something plausible' }, 'A gap is closed by finding the source');
  refuses({ ...fx('AgentRun'), duration_ms: 5000 }, 'Derived from start_time and end_time');
  refuses({ ...fx('WebsiteChange'), files: ['index.html'] }, 'The file list lives on the ChangeRecord');
  refuses({ ...fx('ClaimEvidence'), claim_type: 'claim-type:law' }, 'lives in data/claims.json');
  refuses({ ...fx('AgentObservation'), level: 'info' }, 'There is no severity ladder');
});

test('a missing required field and a value outside its vocabulary are refused', () => {
  const r = fx('DataGap');
  delete r.what_is_missing;
  refuses(r, 'required field is missing');
  refuses({ ...fx('DataGap'), absence_kind: 'probably_not' }, 'is not one of');
});

/* ---------------------------------------------------------- the four states */

test('every contract can express all four epistemic states', () => {
  for (const name of CONTRACT_NAMES) {
    const r = fx(name);
    for (const k of EPISTEMIC_STATUS) {
      assert.ok(Array.isArray(r.epistemic[k]), `${name}: epistemic.${k} is not an array`);
    }
  }
});

test('a factual field with nothing in epistemic.fact is refused', () => {
  const r = fx('SourceCandidate');
  r.epistemic.fact = r.epistemic.fact.filter((f) => f.field !== 'publisher');
  refuses(r, '"publisher" holds a factual value with no entry naming it');
});

test('an inference and an interpretation must say what they rest on', () => {
  const a = fx('SourceCandidate');
  a.epistemic.inference = [];
  refuses(a, '"tier_estimate" holds a concluded value with no entry naming it');

  const b = fx('SourceCandidate');
  b.epistemic.interpretation = [];
  refuses(b, '"relevance" holds a reading with no entry naming it');
});

test('a fact must cite evidence that exists', () => {
  const r = fx('VerificationRecord');
  r.epistemic.fact[0].evidence_refs = ['ev-does-not-exist'];
  refuses(r, 'resolves to nothing in this record\'s evidence array');
});

test('context is not a citation: a fact resting only on context is refused', () => {
  const r = fx('VerificationRecord');
  r.evidence[0].supports = 'supports:context';
  refuses(r, 'is not a citation');
});

test('an absence cannot establish a fact', () => {
  const r = fx('DataGap');
  r.epistemic.fact = [{ field: null, statement: 'Something, apparently.', evidence_refs: ['ev-absent'] }];
  refuses(r, 'whose kind is "absent" — an absence cannot establish a fact');
});

test('a statement cannot be filed under two states at once', () => {
  const r = fx('SourceCandidate');
  r.epistemic.interpretation.push({ field: 'publisher', statement: 'x', held_by: 'a', basis: 'b', contested: false });
  refuses(r, 'is filed as both fact and interpretation');
});

test('"unknown" is a finding and must be recorded as one', () => {
  const r = fx('SourceCandidate');
  r.publication_date = 'unknown';
  r.epistemic.fact = r.epistemic.fact.filter((f) => f.field !== 'publication_date');
  refuses(r, 'is "unknown" with no epistemic.unresolved entry');
});

test('null and unknown are never interchangeable', () => {
  const a = fx('SourceCandidate');
  a.publication_date = 'unknown';
  a.epistemic.fact = a.epistemic.fact.filter((f) => f.field !== 'publication_date');
  a.epistemic.unresolved.push({ field: 'publication_date', question: 'When was it published?', missing: 'The date printed on the document.', absence_kind: 'null_not_researched', blocks: false });
  refuses(a, 'those are different states');

  const b = fx('SourceCandidate');
  b.epistemic.unresolved.push({ field: 'publisher', question: 'Who published it?', missing: 'The imprint.', absence_kind: 'null_not_researched', blocks: false });
  refuses(b, 'but the field carries a value: null means nobody looked');

  const c = fx('SourceCandidate');
  c.epistemic.unresolved.push({ field: 'locator', question: 'Where in the document?', missing: 'A section reference.', absence_kind: 'unknown_not_determinable', blocks: false });
  refuses(c, 'rather than "unknown"');
});

test('a field that cannot express "unknown" refuses it', () => {
  refuses({ ...fx('DataGap'), what_is_missing: 'unknown' }, 'this field cannot express');
});

test('an unresolved entry must say what would close it, not restate the question', () => {
  const r = fx('DataGap');
  r.epistemic.unresolved[0].missing = r.epistemic.unresolved[0].question;
  refuses(r, 'say what would close it');
});

/* ---------------------------------------------------------- evidence */

test('a retrieved document needs somewhere to look and a date it was looked at', () => {
  const a = fx('VerificationRecord');
  a.evidence[0].url = null; a.evidence[0].locator = null;
  refuses(a, 'needs a url or a locator');

  const b = fx('VerificationRecord');
  b.evidence[0].retrieved_at = null;
  refuses(b, 'needs a retrieved_at');
});

test('an "absent" evidence entry cannot support anything and must be accompanied by the gap', () => {
  const a = fx('DataGap');
  a.evidence[0].supports = 'supports:direct';
  refuses(a, 'nothing cannot support anything');

  const b = fx('DataGap');
  b.evidence[0].role = 'official';
  refuses(b, 'an absence has the role "unresolved"');

  const c = fx('DataGap');
  c.epistemic.unresolved = [];
  refuses(c, 'a gap with no open question is not a gap');
});

test('simulated evidence cannot ride on a record that is not marked simulated', () => {
  const r = { ...fx('AgentObservation'), simulated: false };
  refuses(r, 'a fixture must never read as research');
});

/* ---------------------------------------------------------- governance */

test('a proposal touching the legal record cannot be autonomous', () => {
  const r = fx('EditorialProposal');
  r.autonomy_class = 'autonomous';
  refuses(r, 'touches the legal record');
});

test('a proposal touching a red-tier target must be human_only', () => {
  const r = fx('ImplementationProposal');
  r.affected_entities = [{ kind: 'module', id: null, path: 'js/format.js', field: 'TIER_GRADE', note: null }];
  refuses(r, 'red tier under docs/AI-SAFE-BOUNDARIES.md §3');
});

test('a blocking open question forbids autonomous action', () => {
  const r = fx('ImplementationProposal');
  r.epistemic.unresolved.push({ field: null, question: 'Is this safe?', missing: 'A check nobody has run.', absence_kind: 'null_not_researched', blocks: true });
  refuses(r, 'blocking unresolved question');
});

test('a proposal touching data, markup, styles or scripts must name all four validators', () => {
  const r = fx('UXProposal');
  r.validation_requirements = r.validation_requirements.filter((v) => !v.command.includes('i18n-audit'));
  refuses(r, 'omits tools/i18n-audit.mjs');
});

test('an irreversible change is never autonomous and must say what cannot be put back', () => {
  const r = fx('ImplementationProposal');
  r.rollback_plan = { ...r.rollback_plan, method: 'not_reversible', irreversible_reason: null };
  refuses(r, 'say what cannot be put back');
  refuses(r, 'not one an agent makes unattended');
});

test('a proposal must say what it is standing on and what it is about', () => {
  refuses({ ...fx('UXProposal'), evidence: [] }, 'a proposal with no evidence');
  refuses({ ...fx('UXProposal'), affected_entities: [] }, 'a proposal with no affected_entities');
});

/* ---------------------------------------------------------- per contract */

test('SourceCandidate: a candidate cannot verify itself', () => {
  refuses({ ...fx('SourceCandidate'), state: 'accepted' }, 'a candidate cannot verify itself');
  refuses({ ...fx('SourceCandidate'), state: 'duplicate' }, 'name the record it duplicates');
  refuses({ ...fx('SourceCandidate'), url_status: 'url:live', evidence: [{ ...fx('SourceCandidate').evidence[0], retrieved_at: null }] }, '"live" means fetched or seen on a stated date');
});

test('VerificationRecord: a verdict is gated on what the evidence can carry', () => {
  const a = fx('VerificationRecord');
  a.evidence[0].supports = 'supports:context';
  refuses(a, 'no evidence directly supports the statement');

  const b = fx('VerificationRecord');
  b.verdict = 'not_determinable';
  b.epistemic.inference[0].statement = 'The statement could not be settled.';
  refuses(b, 'residual_gap is null');

  const c = fx('VerificationRecord');
  c.verdict = 'not_determinable';
  c.residual_gap = 'The document does not address it.';
  /* The fixture carries an open question of its own, so it is cleared
     here: what this case exercises is an unsettled verdict with NO
     open question, which is the state the rule refuses. */
  c.epistemic.unresolved = [];
  c.applicability_date = null;
  refuses(c, 'an unsettled check has an open question by definition');
});

test('the twelve legal statuses exist, and each says whether the site has a word for it', () => {
  const required = [
    'proposed', 'adopted', 'published', 'entered_into_force', 'applicable', 'amended',
    'corrected', 'repealed', 'annulled', 'under_judicial_review', 'guidance', 'non_binding_commentary',
  ];
  assert.deepEqual(LEGAL_STATUSES, required);

  /* Where the site already has the term, the agent layer points at
     it rather than keeping a second copy that could drift. */
  const siteStatuses = taxonomyIds('status');
  for (const [status, id] of Object.entries(LEGAL_STATUS_TAXONOMY)) {
    if (id === null) continue;
    assert.ok(siteStatuses.includes(id), `LEGAL_STATUS_TAXONOMY maps "${status}" to "${id}", which data/taxonomy.json does not have`);
  }

  /* And where it does not, the null is the finding. These five are
     distinctions the Verifier must draw and the site's vocabulary
     does not carry; filing one under a taxonomy term that means
     something else is the failure this asserts against. */
  const unmapped = LEGAL_STATUSES.filter((s) => LEGAL_STATUS_TAXONOMY[s] === null);
  assert.deepEqual(unmapped, ['corrected', 'annulled', 'under_judicial_review', 'guidance', 'non_binding_commentary']);
});

test('entering into force and applying are different fields, and neither can be "unknown" undeclared', () => {
  const f = CONTRACTS.VerificationRecord.fields;
  for (const name of ['entry_into_force_date', 'applicability_date', 'publication_date']) {
    assert.ok(f[name], `VerificationRecord has no ${name}`);
    assert.equal(f[name].epistemic, 'factual', `${name} must carry an evidence burden`);
    assert.ok(f[name].unknownable, `${name} must be able to say "researched and not determinable"`);
  }
  /* The one that gets collapsed in practice. */
  assert.notEqual(f.entry_into_force_date.doc, f.applicability_date.doc);
});

test('VerificationRecord: the outcome class is derived, and refused as a stored field', () => {
  refuses({ ...fx('VerificationRecord'), outcome_class: 'resolved' }, 'derived from the verdict');
  refuses({ ...fx('VerificationRecord'), tier: 'tier:1' }, 'settled in data/sources.json');
  refuses({ ...fx('VerificationRecord'), binding: true }, 'does not become law because a field said true');
});

test('VerificationRecord: a conflict names both sides, and never resolves itself', () => {
  const conflicted = () => {
    const r = fx('VerificationRecord');
    r.evidence = [simEvidence('ev-1'), simEvidence('ev-2')];
    r.verdict = 'conflict';
    r.residual_gap = 'Two simulated sources give different simulated dates, and neither displaces the other.';
    r.conflicting_evidence = [{
      evidence_refs: ['ev-1', 'ev-2'],
      disagreement: 'One says one simulated thing; the other says a different simulated thing.',
      unreconciled_because: 'Both are simulated, and the fixture does not rank simulations.',
    }];
    r.epistemic.inference.push({
      field: 'conflicting_evidence',
      statement: 'The two entries disagree about the same question.',
      from: ['ev-1', 'ev-2'],
      method: 'Compared the value each states for the same attribute of the same act.',
    });
    r.epistemic.unresolved.push({
      field: null, question: 'Which of the two is right?', missing: 'A source that displaces one of them.',
      absence_kind: 'null_not_researched', blocks: true,
    });
    return r;
  };

  assert.deepEqual(V(conflicted()), []);

  const a = conflicted(); a.conflicting_evidence = [];
  refuses(a, 'name the entries that disagree');

  const b = conflicted(); b.conflicting_evidence[0].evidence_refs = ['ev-1', 'ev-nowhere'];
  refuses(b, 'resolves to nothing in this record');

  const c = conflicted();
  c.epistemic.inference = c.epistemic.inference.filter((e) => e.field !== 'conflicting_evidence');
  refuses(c, 'concluding that two sources disagree is a judgement');

  /* The whole point of the verdict: it cannot be quietly upgraded. */
  const d = conflicted(); d.verdict = 'confirmed'; d.residual_gap = null;
  refuses(d, 'a proposition sitting on unreconciled authority is not confirmed');
});

test('VerificationRecord: nothing is located inside a document nobody fetched', () => {
  const r = fx('VerificationRecord');
  r.evidence = [{ ...simEvidence('ev-1'), kind: 'dataset_record', url: null, locator: 'data/claims.json#simulated' }];
  refuses(r, 'no evidence entry is a retrieved_document');
});

test('VerificationRecord: "applicable" without a date must at least say the date is open', () => {
  const r = fx('VerificationRecord');
  r.legal_status = 'applicable';
  r.applicability_date = null;
  r.epistemic.unresolved = [];
  r.epistemic.inference.find((e) => e.field === 'legal_status').statement = 'The act applies.';
  refuses(r, 'saying an act applies without saying from when');

  /* Declaring it open is the honest form, and it passes. */
  const ok = fx('VerificationRecord');
  ok.legal_status = 'applicable';
  ok.applicability_date = null;
  ok.epistemic.unresolved = [{
    field: 'applicability_date', question: 'From when does it apply?',
    missing: 'A stated application date. The simulated document gives none.',
    absence_kind: 'null_not_researched', blocks: false,
  }];
  ok.epistemic.inference.find((e) => e.field === 'legal_status').statement = 'The act applies.';
  assert.deepEqual(V(ok), []);
});

test('ClaimEvidence: context is never a citation, and a direct support must be locatable', () => {
  refuses({ ...fx('ClaimEvidence'), supports: 'supports:context' }, 'context informs a claim without establishing it');
  const r = fx('ClaimEvidence');
  r.quote = null; r.locator = null;
  refuses(r, 'a direct support nobody can look up');
  refuses({ ...fx('ClaimEvidence'), established_by: null }, 'an unverified link has an open question');
});

test('DataGap: the three kinds of absence are kept apart', () => {
  refuses({ ...fx('DataGap'), gap_kind: 'no_rule_matched' }, 'the answer is NOT DETERMINED, never a negative finding');
  refuses({ ...fx('DataGap'), gap_kind: 'not_publicly_determinable' }, 'researched-and-unavailable is not the same as not researched');
  refuses({ ...fx('DataGap'), state: 'closed_by_verification', blocking: false }, 'name the verification that closed it');
});

test('ArchitectureProposal: architectural replacement is red tier', () => {
  refuses({ ...fx('ArchitectureProposal'), introduces_dependency: true }, 'architectural replacement is red tier');
  refuses({ ...fx('ArchitectureProposal'), autonomy_class: 'autonomous' }, 'is not a green-tier change');
});

test('EditorialProposal: index.html has two homes for its prose', () => {
  refuses({ ...fx('EditorialProposal'), content_blob_checked: false }, 'the prose has two homes there');
  refuses({ ...fx('EditorialProposal'), changes_what_a_claim_asserts: true }, 'altering what a claim is said to prove is red tier');
});

test('UXProposal: the two rules that already shipped as bugs', () => {
  refuses({ ...fx('UXProposal'), status_conveyed_by_hue_alone: true }, 'status is never carried by hue alone');
  const r = fx('UXProposal');
  r.tokens_added[0].declared_on = ':root';
  refuses(r, 'is not one of');
  refuses({ ...fx('UXProposal'), adds_third_party_asset: true }, 'a third-party request is red tier');
});

test('ImplementationProposal: zero dependencies, and one data gateway', () => {
  refuses({ ...fx('ImplementationProposal'), new_dependencies: ['some-lib@1.0.0'] }, 'zero dependencies is a red-tier prohibition');
  refuses({ ...fx('ImplementationProposal'), adds_build_step: true }, 'introducing a build step is red tier');
  refuses({ ...fx('ImplementationProposal'), adds_fetch_call: true, fetch_modules: ['js/instruments-page.js'] }, 'js/data.js is the only module that fetches a dataset');
  const r = fx('ImplementationProposal');
  r.validator_impact = { ...r.validator_impact, expected_new_warnings: 1 };
  refuses(r, 'a new warning is a finding');
});

test('QAResult: a new warning is a finding, not a pass', () => {
  const r = fx('QAResult');
  r.checks[1].warnings = 6;
  refuses(r, 'more warnings than the baseline');
  refuses(r, 'named no new finding');

  const f = fx('QAResult');
  f.verdict = 'fail';
  refuses(f, 'no check reported an error or a non-zero exit');
});

test('ApprovalRequest: an agent may not approve its own proposal, and pending is never granted', () => {
  const r = fx('ApprovalRequest');
  r.state = 'granted';
  r.decision = { decided_at: '2026-09-01T10:00:00.000Z', decided_by: 'fixture-agent', outcome: 'granted', note: null };
  refuses(r, 'an agent may not approve its own proposal');
  refuses({ ...fx('ApprovalRequest'), state: 'granted' }, 'there is no decision record');
  refuses({ ...fx('ApprovalRequest'), state: 'expired' }, 'nothing can expire without a stated expiry');
});

test('AgentObservation: an observation is not a log line', () => {
  refuses({ ...fx('AgentObservation'), trace_ref: null }, 'the log line this contract exists to replace');
  const r = fx('AgentObservation');
  r.epistemic = { fact: [], inference: [], interpretation: [], unresolved: [] };
  refuses(r, 'has observed nothing');
});

test('AgentRun: a run IS a span, and nothing derived is stored on it', () => {
  const r = fx('AgentRun');
  r.run_id = 'f'.repeat(16);
  refuses(r, 'a run IS a span');
  refuses({ ...fx('AgentRun'), total_tokens: 100 }, 'Derived by rolling up the usage records');
  refuses({ ...fx('AgentRun'), degraded: true }, 'Derived per trace');
  refuses({ ...fx('AgentRun'), status: 'running' }, 'status is "running" but ended_at is set');
  refuses({ ...fx('AgentRun'), status: 'failed' }, 'a failed run leaves something open by definition');
});

test('ChangeRecord: a change lands after the checks, and never on main by default', () => {
  refuses({ ...fx('ChangeRecord'), qa_result_id: null }, 'the four validators are this project\'s test suite');
  refuses({ ...fx('ChangeRecord'), touched_legal_record: true }, 'does not land on an agent\'s own authority');
  refuses({ ...fx('ChangeRecord'), branch: 'main' }, 'a push to main publishes to the live site');
  refuses({ ...fx('ChangeRecord'), state: 'reverted' }, 'name what undid it');
});

test('WebsiteChange: a missing link in the chain is reported, never omitted', () => {
  const r = fx('WebsiteChange');
  r.chain_gaps = [];
  refuses(r, 'a missing link is reported, never omitted');
  refuses({ ...fx('WebsiteChange'), verification_ids: [] }, 'a legal fact reaches a reader only after something checked it');
  refuses({ ...fx('WebsiteChange'), approval_ids: [] }, 'authoring or altering a legal fact is red tier');
  refuses({ ...fx('WebsiteChange'), commit: null }, 'no commit is named');
});

/* ---------------------------------------------------------- the gate */

const tracer = () => new Tracer({
  sink: new MemorySink({ strict: true }),
  ids: deterministicIds(7),
  clock: deterministicClock('2026-09-01T09:00:00.000Z', 50),
});

test('the gate refuses an invalid record rather than passing it on', () => {
  const tr = tracer();
  const run = tr.startRun({ agent: 'orchestrator', task: 'contract gate' });
  const bad = { ...fx('DataGap'), state: 'not_a_state' };
  assert.throws(() => emit(run, bad, { allowSimulated: true }), /does not satisfy its contract/);
  assert.equal(tr.sink.records.filter((x) => x.type === 'artifact').length, 0, 'an invalid record reached the trace');
});

test('what reaches the trace is a pointer and a hash, not a second copy of the record', () => {
  const tr = tracer();
  const run = tr.startRun({ agent: 'scout', task: 'contract gate' });
  const rec = fx('SourceCandidate');
  emit(run, rec, { allowSimulated: true });

  const art = tr.sink.records.find((x) => x.type === 'artifact');
  assert.equal(art.artifact_id, rec.candidate_id);
  assert.equal(art.artifact_type, 'contract:SourceCandidate');
  assert.equal(art.sha256, sha256Of(rec));

  const written = JSON.stringify(tr.sink.records);
  assert.ok(!written.includes(rec.relevance), 'the record body was copied into the trace');
  assert.ok(!written.includes(rec.epistemic.fact[0].statement), 'the epistemic block was copied into the trace');
});

test('the hash changes when the record does, so a pointer cannot go stale unnoticed', () => {
  const a = fx('DataGap');
  const b = { ...a, what_is_missing: 'something else entirely' };
  assert.notEqual(sha256Of(a), sha256Of(b));
  assert.equal(sha256Of(a), sha256Of(fx('DataGap')));
  assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
});

test('an approval request also reaches the trace as a pending approval a human can see', () => {
  const tr = tracer();
  const run = tr.startRun({ agent: 'orchestrator', task: 'contract gate' });
  emit(run, fx('ApprovalRequest'), { allowSimulated: true });
  const ap = tr.sink.records.find((x) => x.type === 'approval');
  assert.equal(ap.approval_id, 'appr-simulated-001');
  assert.equal(ap.state, 'requested');
  assert.deepEqual(ap.artifact_ids, ['prop-ed-simulated-001']);
});

test('a handoff validates every record before it becomes somebody else\'s problem', () => {
  const tr = tracer();
  const run = tr.startRun({ agent: 'scout', task: 'contract gate' });
  assert.throws(
    () => handoff(run, { to_agent: 'verifier', records: [fx('SourceCandidate'), { ...fx('DataGap'), state: 'nope' }], allowSimulated: true }),
    /refusing to hand 2 record\(s\) to "verifier"/,
  );
  assert.equal(tr.sink.records.filter((x) => x.type === 'handoff').length, 0);

  const ho = handoff(run, { to_agent: 'verifier', records: [fx('SourceCandidate'), fx('DataGap')], reason: 'for checking', allowSimulated: true });
  assert.equal(ho.to_agent, 'verifier');
  assert.deepEqual(ho.artifact_ids, ['cand-simulated-001', 'gap-simulated-001']);
});

test('the receiving agent validates what it was handed, because "I wrote it" is not checkable', () => {
  assert.throws(() => receive({ ...fx('DataGap'), state: 'nope' }, { allowSimulated: true }));
  assert.doesNotThrow(() => receive(fx('DataGap'), { allowSimulated: true }));
});

test('every record the tracer emits through the gate satisfies the observability schema', () => {
  const tr = tracer();
  const run = tr.startRun({ agent: 'orchestrator', task: 'contract gate' });
  for (const name of CONTRACT_NAMES) emit(run, fx(name), { allowSimulated: true });
  run.end({ status: 'ok' });
  for (const rec of tr.sink.records) assert.deepEqual(obsSchema.validateRecord(rec), [], JSON.stringify(rec));
});

/* ---------------------------------------------------------- batch + export */

test('a batch reports references it cannot resolve as gaps, not as invalidity', () => {
  const records = [fx('WebsiteChange'), fx('ChangeRecord')];
  const { valid, invalid, unresolved_refs } = validateBatch(records, { allowSimulated: true });
  assert.equal(invalid, 0);
  assert.equal(valid, 2);
  const refs = unresolved_refs.map((u) => u.ref);
  assert.ok(refs.includes('ver-simulated-001'), 'an unresolvable reference was silently dropped');
  assert.ok(refs.includes('qa-simulated-001'));
});

test('the JSON Schema export is faithful and says it is not the whole gate', () => {
  for (const name of CONTRACT_NAMES) {
    const s = toJsonSchema(name);
    assert.equal(s.type, 'object');
    assert.equal(s.additionalProperties, false, `${name}: the export must stay closed`);
    assert.ok(s.description.includes('necessary and not sufficient'));
    assert.equal(s['x-id-field'], CONTRACTS[name].id_field);
    for (const key of Object.keys(CONTRACTS[name].fields)) {
      assert.ok(key in s.properties, `${name}: ${key} is missing from the export`);
      assert.ok(s.properties[key].description, `${name}: ${key} exports with no description`);
    }
    assert.ok(s.required.includes('epistemic'), `${name}: the epistemic block must export as required`);
  }
});

test('an unknownable field exports as itself, null, or the word unknown — never as a plain optional', () => {
  const s = toJsonSchema('SourceCandidate');
  const variants = s.properties.publication_date.anyOf.map((v) => v.const ?? v.type);
  assert.deepEqual(variants, ['string', 'null', 'unknown']);
});

/* ---------------------------------------------------------- SESSION 05
   Added when the first real agent — the Source Scout — met these
   contracts and found three fields missing and one gap kind absent.
   The contract changed; these hold the new behaviour down.        */

test('the authority hierarchy is ordered, and the order is the priority order', async () => {
  const { AUTHORITY_CLASSES, SECONDARY_AUTHORITY } = await import('./types.mjs');
  assert.equal(AUTHORITY_CLASSES.length, 9, 'the brief names nine levels');
  assert.equal(AUTHORITY_CLASSES[0], 'authority:eur-lex', 'EUR-Lex and the Official Journal come first');
  assert.equal(AUTHORITY_CLASSES.at(-1), SECONDARY_AUTHORITY, 'secondary expert sources come last');
  assert.equal(new Set(AUTHORITY_CLASSES).size, 9);
});

test('SourceCandidate: a secondary source is never presented as primary law or a regulator', () => {
  for (const tier of ['tier:1', 'tier:2']) {
    const r = fx('SourceCandidate');
    r.tier_estimate = tier;
    r.authority_class = 'authority:secondary-expert';
    refuses(r, 'never presented as equivalent to primary law or a regulator');
  }
  const ok = fx('SourceCandidate');
  ok.tier_estimate = 'tier:4';
  ok.authority_class = 'authority:secondary-expert';
  assert.deepEqual(V(ok), []);
});

test('SourceCandidate: an unplaceable authority is a finding, never a quiet "secondary"', () => {
  const r = fx('SourceCandidate');
  r.authority_class = null;
  r.epistemic.inference = r.epistemic.inference.filter((i) => i.field !== 'authority_class');
  refuses(r, 'an unplaceable source is a finding');

  r.epistemic.unresolved.push({
    field: 'authority_class', question: 'Who issued this?', missing: 'An identifiable issuing body on the document.',
    absence_kind: 'null_not_researched', blocks: false,
  });
  assert.deepEqual(V(r), []);
});

test('SourceCandidate: a duplicate list cannot name the candidate itself', () => {
  const r = fx('SourceCandidate');
  r.duplicate_candidate_ids = [r.candidate_id];
  refuses(r, 'names this candidate itself');
});

test('SourceCandidate: the retrieval date and the fingerprint have one home, on the evidence', () => {
  const c = getContract('SourceCandidate');
  assert.ok(!('retrieval_date' in c.fields), 'the retrieval date belongs to the retrieval, not to the document');
  assert.ok(!('retrieved_at' in c.fields));
  assert.ok(!('content_fingerprint' in c.fields), 'the fingerprint belongs to the bytes that were fetched');
  const ev = c.fields.evidence.of.shape;
  assert.ok('retrieved_at' in ev && 'checksum' in ev, 'both must exist on the evidence reference');
  refuses({ ...fx('SourceCandidate'), content_fingerprint: 'abc' }, 'not declared by this contract');
});

test('DataGap: a document nobody could reach has not been read', () => {
  const r = fx('DataGap');
  r.gap_kind = 'retrieval_blocked';
  r.absence_kind = 'unknown_not_determinable';
  r.state = 'open';
  refuses(r, 'has not been read, which is not the same as one that was read and found wanting');

  const ok = fx('DataGap');
  ok.gap_kind = 'retrieval_blocked';
  assert.deepEqual(V(ok), [], 'retrieval_blocked with absence_kind null_not_researched must be valid');
});

/* ---------------------------------------------------------- DataProposal

   SESSION 08. The contract exists so that a proposed factual
   modification is a record before it is an edit, and these are the
   three burdens it was added to carry.                             */

test('DataProposal: a new record is proposed only after looking for the one already there', () => {
  const r = fx('DataProposal');
  r.operation_kind = 'create_source';
  r.record_id = null;
  r.dataset = 'data/sources.json';
  r.record_kind = 'source';
  r.affected_entities = [{ kind: 'source', id: null, path: 'data/sources.json', field: null, note: 'A source record that does not exist yet.' }];
  refuses(r, 'a new record is proposed only after looking for the one that is already there');

  r.existing_search = {
    performed: false, strategies: ['normalised_url'], candidates_considered: 0,
    best_candidate_id: null, best_score: null, why_not_that_one: null,
  };
  r.epistemic.inference.push({ field: 'existing_search', statement: 'Nothing matched.', from: ['ev-1'], method: 'Compared the normalised URL against every source record.' });
  refuses(r, 'the search is the thing that stops a second home');
});

test('DataProposal: the closest existing record is answered, not scored past', () => {
  const r = fx('DataProposal');
  r.operation_kind = 'create_source';
  r.record_id = null;
  r.dataset = 'data/sources.json';
  r.record_kind = 'source';
  r.affected_entities = [{ kind: 'source', id: null, path: 'data/sources.json', field: null, note: null }];
  r.existing_search = {
    performed: true, strategies: ['normalised_url', 'title_and_publisher'], candidates_considered: 77,
    best_candidate_id: 'simulated:source', best_score: 0.71, why_not_that_one: null,
  };
  r.epistemic.inference.push({ field: 'existing_search', statement: 'The closest record is a different document.', from: ['ev-1'], method: 'Compared normalised URLs and then normalised titles against every source record.' });
  refuses(r, 'does not say why it is not this record');
});

test('DataProposal: an existing record keeps the id it has', () => {
  const r = fx('DataProposal');
  r.preserves_record_id = false;
  refuses(r, 'IDs are never renamed here');

  const moved = fx('DataProposal');
  moved.proposed_change.operations[0].target = 'data/claims.json claims[simulated:claim].id';
  refuses(moved, 'an id is stable, and renaming one dangles every reference to it');
});

test('DataProposal: provenance is not removed, and there is no word for removing it', () => {
  const spec = getContract('DataProposal').fields.provenance_disposition.of.shape.disposition;
  assert.ok(!spec.values.includes('removed'), 'a vocabulary that offered the word would be an invitation to use it');
  assert.ok(!spec.values.includes('replaced'), 'a bare "replaced" would let a note be written over on an agent\'s own authority');

  const r = fx('DataProposal');
  r.proposed_change.operations.push({
    op: 'remove', target: 'data/claims.json claims[simulated:claim].verification_note',
    current: 'A simulated note.', proposed: null, rationale: 'It looks resolved now.',
  });
  refuses(r, 'is red tier under AI-SAFE-BOUNDARIES §3');
});

test('DataProposal: writing over a provenance value is a substantive change a human authors', () => {
  const r = fx('DataProposal');
  r.provenance_disposition[1].disposition = 'replaced_human_only';
  refuses(r, 'writing over an existing provenance value is a substantive change a human authors');
});

test('DataProposal: "set for the first time" is refused where somebody had already looked', () => {
  const r = fx('DataProposal');
  r.provenance_disposition[0].disposition = 'set_first_time';
  refuses(r, 'null means nobody looked, and a field with a value has been looked at');
});

test('DataProposal: a substantive legal change is red tier and cannot be merged automatically', () => {
  const r = fx('DataProposal');
  r.substantive = true;
  r.autonomy_class = 'review_required';
  refuses(r, 'an agent may propose it and nothing more');

  const c = getContract('DataProposal');
  for (const key of ['auto_merge', 'apply_automatically', 'merge_on_approval', 'merged', 'applied']) {
    assert.ok(key in c.forbidden, `DataProposal must refuse "${key}" with the objection, not with "unknown field"`);
    refuses({ ...fx('DataProposal'), [key]: true }, c.forbidden[key]);
  }
});

/* ---------------------------------------------------------- SESSION 12
   create_taxonomy_term — a term is proposed, never created

   The brief's instruction is one sentence and these tests are it:
   "If a new taxonomy term appears necessary: create a taxonomy
   proposal; do not silently create it." What makes that checkable
   rather than aspirational is that the class is FORCED rather than
   stated, the dimension is checked against the file, and the
   find-it-first search applies unchanged.                          */

/** A DataProposal shaped as a taxonomy-term proposal, from the
 *  fixture, so these tests exercise the rules rather than a
 *  hand-built record that might satisfy them by accident. */
function taxonomyProposalFixture() {
  const r = fx('DataProposal');
  r.operation_kind = 'create_taxonomy_term';
  r.dataset = 'data/taxonomy.json';
  r.record_kind = 'taxonomy_term';
  r.record_id = null;
  r.autonomy_class = 'human_only';
  r.substantive = false;
  r.retrieved_and_read = false;
  r.verification_refs = [];
  r.provenance_disposition = [];
  r.existing_search = {
    performed: true,
    strategies: ['dimension_scan', 'decisive_word_test'],
    candidates_considered: 10,
    best_candidate_id: 'rel-kind:overlap',
    best_score: 0.17,
    why_not_that_one: 'Every term in this dimension characterises how two acts relate; the concept here is that two source records are one document, which is a statement about the bibliography rather than about EU law.',
  };
  r.proposed_change = {
    summary: 'Add one term to data/taxonomy.json relationship_kind[].',
    operations: [{
      op: 'add',
      target: 'data/taxonomy.json relationship_kind[]',
      current: null,
      proposed: '{"id":"rel-kind:same-document","label":"Is the same document as","definition_ref":null,"note":null}',
      rationale: 'The id follows the dimension\'s own prefix convention. The definition is left for the author.',
    }],
    scope_note: 'It proposes a word and nothing else.',
  };
  r.affected_entities = [{ kind: 'taxonomy_term', id: 'rel-kind:same-document', path: 'data/taxonomy.json', field: 'relationship_kind', note: 'The term proposed. It does not exist.' }];
  r.epistemic.inference = r.epistemic.inference.filter((i) => i.field !== 'substantive');
  r.epistemic.inference.push({
    field: 'existing_search',
    statement: 'All ten existing terms were compared and none expresses the concept.',
    from: ['ev-1'],
    method: 'Token overlap against each term\'s id, label and note, then a decisive-word test.',
  });
  return r;
}

test('DataProposal: a taxonomy term proposal is accepted when it has done the work', () => {
  assert.deepEqual(V(taxonomyProposalFixture()), []);
});

test('DataProposal: a taxonomy term is human_only, whatever the agent claimed', () => {
  const r = taxonomyProposalFixture();
  r.autonomy_class = 'review_required';
  refuses(r, 'structural change is never Class B');
  const auto = taxonomyProposalFixture();
  auto.autonomy_class = 'autonomous';
  refuses(auto, 'structural change is never Class B');
});

test('DataProposal: a taxonomy term has one home, and it is data/taxonomy.json', () => {
  const r = taxonomyProposalFixture();
  r.dataset = 'data/instruments.json';
  r.affected_entities = [{ kind: 'taxonomy_term', id: 'rel-kind:same-document', path: 'data/instruments.json', field: null, note: null }];
  refuses(r, 'a taxonomy term has one home');
});

test('DataProposal: a taxonomy term says it is one', () => {
  const r = taxonomyProposalFixture();
  r.record_kind = 'claim';
  refuses(r, 'say what sort of record this is, and it is a taxonomy term');
});

test('DataProposal: a term proposed into a dimension the file does not have is refused', () => {
  const r = taxonomyProposalFixture();
  r.proposed_change.operations[0].target = 'data/taxonomy.json rel_kinds[]';
  refuses(r, 'no dimension in data/taxonomy.json is named there');
});

test('DataProposal: a taxonomy term is not created without looking for the one already there', () => {
  const r = taxonomyProposalFixture();
  r.existing_search = null;
  refuses(r, 'a new record is proposed only after looking for the one that is already there');

  const unperformed = taxonomyProposalFixture();
  unperformed.existing_search.performed = false;
  refuses(unperformed, 'the search is the thing that stops a second home');

  const unanswered = taxonomyProposalFixture();
  unanswered.existing_search.why_not_that_one = null;
  refuses(unanswered, 'does not say why it is not this record');
});

test('DataProposal: a taxonomy term proposal carries no record id, because nothing exists yet', () => {
  const r = taxonomyProposalFixture();
  r.record_id = 'rel-kind:same-document';
  refuses(r, 'a record that already has an id is not being created');
});

test('create_taxonomy_term is in the operation vocabulary and nothing else was disturbed', () => {
  for (const k of ['attach_evidence', 'create_source', 'create_claim', 'amend_field', 'annotate', 'create_taxonomy_term']) {
    assert.ok(DATA_OPERATION_KINDS.includes(k), `the operation vocabulary lost "${k}"`);
  }
  assert.equal(DATA_OPERATION_KINDS.length, 6);
});

test('the five gap routes exist, and every one names who it hands to or why nobody', () => {
  assert.deepEqual(GAP_ROUTES, ['data_proposal', 'taxonomy_proposal', 'editorial', 'verifier', 'owner_decision']);
  for (const r of GAP_ROUTES) {
    assert.ok(r in GAP_ROUTE_RECIPIENT, `route "${r}" hands to nobody and does not say so`);
  }
  /* The owner route is the one with no agent, deliberately: a schema
     decision is not an agent's to take, which is exactly why that
     route authors nothing. */
  assert.equal(GAP_ROUTE_RECIPIENT.owner_decision, null);
  for (const r of PROPOSING_ROUTES) assert.ok(GAP_ROUTES.includes(r));
});

test('DataProposal: changing a value is presumed substantive until a method says otherwise', () => {
  const r = fx('DataProposal');
  r.operation_kind = 'amend_field';
  r.epistemic.inference = r.epistemic.inference.filter((i) => i.field !== 'substantive');
  refuses(r, 'changing the value a field carries is presumed substantive');

  r.epistemic.inference.push({
    field: 'substantive', statement: 'The field is a formatting normalisation and asserts nothing new.',
    from: ['ev-1'], method: 'Compared the rendered output before and after; the claim asserts the same proposition.',
  });
  assert.deepEqual(V(r), []);
});

test('DataProposal: a source record comes from a document actually read', () => {
  const base = () => {
    const r = fx('DataProposal');
    r.operation_kind = 'create_source';
    r.record_id = null;
    r.dataset = 'data/sources.json';
    r.record_kind = 'source';
    r.affected_entities = [{ kind: 'source', id: null, path: 'data/sources.json', field: null, note: null }];
    r.existing_search = {
      performed: true, strategies: ['normalised_url'], candidates_considered: 77,
      best_candidate_id: null, best_score: null, why_not_that_one: null,
    };
    r.epistemic.inference.push({ field: 'existing_search', statement: 'No existing record matched.', from: ['ev-1'], method: 'Compared the normalised URL against every source record.' });
    return r;
  };

  const unread = base();
  unread.retrieved_and_read = false;
  refuses(unread, 'never from a title, an abstract, a snippet or model knowledge');

  const noDoc = base();
  noDoc.evidence = [{
    evidence_id: 'ev-1', kind: 'agent_output', source_id: null, url: null, locator: 'a prior record',
    title: null, publisher: null, quote: null, retrieved_at: null, checksum: null,
    supports: 'supports:context', role: 'secondary', simulated: true,
  }];
  refuses(noDoc, 'nothing was read, so there is nothing to write a source record from');
});

test('DataProposal: a new claim with no sentence behind it is blocked', () => {
  const r = fx('DataProposal');
  r.operation_kind = 'create_claim';
  r.record_id = null;
  r.record_kind = 'claim';
  r.prose_anchor = null;
  r.existing_search = {
    performed: true, strategies: ['statement_exact', 'statement_overlap'], candidates_considered: 91,
    best_candidate_id: null, best_score: null, why_not_that_one: null,
  };
  r.epistemic.inference.push({ field: 'existing_search', statement: 'No existing claim carries this proposition.', from: ['ev-1'], method: 'Compared the normalised statement against every claim, then compared token overlap.' });
  refuses(r, 'a claim with no sentence behind it would be the site asserting something it does not say');

  r.epistemic.unresolved.push({
    field: 'prose_anchor', question: 'Which sentence in the brief carries this statement?',
    missing: 'The sentence itself, located in index.html. No new claims were written for this corpus and none is written here.',
    absence_kind: 'null_not_researched', blocks: true,
  });
  r.autonomy_class = 'human_only';
  assert.deepEqual(V(r), []);
});

test('DataProposal: attaching evidence names the verification that read the source', () => {
  const r = fx('DataProposal');
  r.verification_refs = [];
  refuses(r, 'name the verification that read the source');
});

test('DataProposal: it changes a dataset, and says which file that entity lives in', () => {
  const r = fx('DataProposal');
  r.dataset = 'agent/records/whatever.jsonl';
  refuses(r, 'that is a path under data/ ending in .json');

  const mismatched = fx('DataProposal');
  mismatched.dataset = 'data/sources.json';
  refuses(mismatched, 'no affected entity names that path');
});

test('DataProposal: it cannot be autonomous, because every record kind it touches is a legal one', () => {
  const c = getContract('DataProposal');
  for (const v of c.fields.record_kind.values) {
    assert.ok(LEGAL_ENTITY_KINDS.includes(v), `record_kind offers "${v}", which is not a legal-record kind`);
  }
  const r = fx('DataProposal');
  r.autonomy_class = 'autonomous';
  refuses(r, 'which is amber at best');
});

/* ---------------------------------------------------------- RegulatoryChange

   SESSION 09. The contract exists because the brief's word for its
   output — "ChangeRecord" — was already taken by a contract meaning
   something else. These tests hold the two apart, and hold this one
   to the three things a detection must not quietly become: an edit,
   an agreement it never established, and a substantive change filed
   as a cosmetic one.                                                */

test('RegulatoryChange and ChangeRecord cannot be mistaken for one another', () => {
  const rc = getContract('RegulatoryChange');
  const cr = getContract('ChangeRecord');

  /* Each refuses the other's distinguishing fields, with the reason. */
  for (const key of ['files', 'diff_summary', 'branch', 'commit', 'applied_at']) {
    assert.ok(key in rc.forbidden, `RegulatoryChange must refuse ChangeRecord's "${key}"`);
    assert.ok(/ChangeRecord|Same/.test(rc.forbidden[key]), `and say which contract wanted it`);
    refuses({ ...fx('RegulatoryChange'), [key]: 'x' }, rc.forbidden[key]);
  }
  for (const key of ['change_kind', 'materiality', 'old_value', 'new_value']) {
    assert.ok(key in cr.forbidden, `ChangeRecord must refuse RegulatoryChange's "${key}"`);
    refuses({ ...fx('ChangeRecord'), [key]: 'x' }, cr.forbidden[key]);
  }

  /* And they share no field beyond the envelope and their id. */
  const envelope = new Set([...Object.keys(ENVELOPE_FIELDS), 'contract', 'contract_version', 'change_id', 'supersedes']);
  const shared = Object.keys(rc.fields).filter((k) => k in cr.fields && !envelope.has(k));
  assert.deepEqual(shared, [], `the two contracts share ${shared.join(', ')} outside the envelope`);
});

test('RegulatoryChange: a detection carries no edit', () => {
  const c = getContract('RegulatoryChange');
  for (const key of ['proposed_change', 'operations', 'proposed']) {
    assert.ok(key in c.forbidden);
    refuses({ ...fx('RegulatoryChange'), [key]: {} }, 'A detection carries no edit');
  }
  assert.ok(!('autonomy_class' in c.forbidden), 'it does carry an autonomy class — the brief requires one and validate.mjs checks it');
});

test('RegulatoryChange: a change with no side to it is not a change', () => {
  const r = fx('RegulatoryChange');
  r.old_value = null;
  r.new_value = null;
  r.epistemic.fact = r.epistemic.fact.filter((f) => !['old_value', 'new_value'].includes(f.field));
  refuses(r, 'a change with no side to it is not a change');
});

test('RegulatoryChange: NEW has nothing on the old side', () => {
  const r = fx('RegulatoryChange');
  r.change_kind = 'NEW';
  refuses(r, 'a record the corpus does not have has nothing on the old side');
});

test('RegulatoryChange: two identical values is UPDATED or it is nothing', () => {
  const r = fx('RegulatoryChange');
  r.new_value = r.old_value;
  refuses(r, 'if nothing the corpus asserts moved, the kind is UPDATED');
});

test('RegulatoryChange: UPDATED cannot swallow a substantive change', () => {
  const r = fx('RegulatoryChange');
  r.change_kind = 'UPDATED';
  r.old_value = 'the same string';
  r.new_value = 'the same string';
  refuses(r, 'filing it here is how a substantive change becomes invisible');

  /* And UPDATED must have established that the document moved. */
  const q = fx('RegulatoryChange');
  q.change_kind = 'UPDATED';
  q.old_value = 'x';
  q.new_value = 'x';
  q.materiality = 'metadata_only';
  q.source_snapshot = { ...q.source_snapshot, bytes_changed: null, previous_checksum: null };
  refuses(q, 'is not something this detection established');
});

test('RegulatoryChange: an absent comparison is never reported as agreement', () => {
  const r = fx('RegulatoryChange');
  r.change_kind = 'UPDATED';
  r.old_value = 'x';
  r.new_value = 'x';
  r.materiality = 'metadata_only';
  r.source_snapshot = { previous_verification_id: null, previous_checksum: null, current_checksum: 'c'.repeat(64), bytes_changed: false, note: 'nothing to compare' };
  refuses(r, 'an absence of comparison is not a finding of no change');
});

test('RegulatoryChange: materiality states the method it was reached by', () => {
  const r = fx('RegulatoryChange');
  r.epistemic.inference = r.epistemic.inference.filter((i) => i.field !== 'materiality');
  refuses(r, 'no epistemic.inference entry states the method it was reached by');
});

test('RegulatoryChange: a substantive change is not acted on unattended', () => {
  const r = fx('RegulatoryChange');
  r.autonomy_class = 'autonomous';
  refuses(r, 'is not something an agent acts on unattended');
});

test('RegulatoryChange: a substantive change names the file a correction would touch', () => {
  const r = fx('RegulatoryChange');
  r.affected_datasets = [];
  r.affected_pages = [];
  refuses(r, 'name the file a correction would touch');
});

test('RegulatoryChange: a dataset is a data/ path and a page is an .html file', () => {
  refuses({ ...fx('RegulatoryChange'), affected_datasets: ['agent/records/x.jsonl'] }, 'a canonical dataset is a path under data/');
  refuses({ ...fx('RegulatoryChange'), affected_pages: ['js/main.js'] }, 'a page is an .html file at the repository root');

  const orphan = fx('RegulatoryChange');
  orphan.affected_datasets = [];
  orphan.materiality = 'metadata_only';
  orphan.change_kind = 'UPDATED';
  orphan.old_value = 'x';
  orphan.new_value = 'x';
  refuses(orphan, 'a page renders a dataset');
});

test('RegulatoryChange: "the world has probably moved by now" is not a detection', () => {
  /* The legitimate shape of a candidate nobody has retrieved a
     document for: the corpus side is established from the corpus,
     the document side is empty, and the record says nobody looked.
     Without that open question it is a claim the detection never
     made — which is the refusal condition the
     regulatory-change-detection skill states in words. */
  const r = fx('RegulatoryChange');
  r.new_value = null;
  r.source_snapshot = null;
  r.evidence = [
    { ...simEvidence('ev-corpus'), kind: 'dataset_record', url: null, locator: 'data/instruments.json simulated:instrument', quote: null, retrieved_at: null },
    {
      evidence_id: 'ev-absent', kind: 'absent',
      source_id: null, url: null, locator: null, title: null, publisher: null,
      quote: null, retrieved_at: null, checksum: null,
      supports: null, role: 'unresolved', simulated: true,
    },
  ];
  r.epistemic.fact = [{ field: 'old_value', statement: 'The simulated instrument record carries status:in-force.', evidence_refs: ['ev-corpus'] }];
  r.epistemic.unresolved = [];
  refuses(r, 'the candidate is that nobody has looked since a stated date');

  /* With the open question, the same record is a legitimate candidate. */
  r.epistemic.unresolved = [{
    field: null, question: 'Has the act become applicable since the corpus was last checked?',
    missing: 'A retrieval of the act\'s own record. Nobody has looked since the stated as-of date.',
    absence_kind: 'null_not_researched', blocks: false,
  }];
  assert.deepEqual(V(r), []);
});

test('RegulatoryChange: a court\'s own record settles what a court decided', () => {
  const r = fx('RegulatoryChange');
  r.change_kind = 'COURT_OUTCOME';
  r.evidence = [simEvidence('ev-1', { role: 'secondary', supports: 'supports:partial' })];
  r.epistemic.unresolved = [];
  refuses(r, 'a report of one is not the one');
});

test('RegulatoryChange: it is about the legal record, not about a module', () => {
  const r = fx('RegulatoryChange');
  r.affected_entities = [{ kind: 'module', id: null, path: 'js/dna.js', field: null, note: null }];
  refuses(r, 'a regulatory change is about the legal record');

  const empty = fx('RegulatoryChange');
  empty.affected_entities = [];
  refuses(empty, 'a detection that is about nothing has detected nothing');
});

test('RegulatoryChange: the fourteen kinds the session named all exist', () => {
  const required = [
    'NEW', 'UPDATED', 'AMENDED', 'CORRECTED', 'DELAYED', 'ENTERED_INTO_FORCE', 'APPLICABLE',
    'REPEALED', 'ANNULLED', 'GUIDANCE_UPDATED', 'ENFORCEMENT_UPDATED', 'COURT_OUTCOME',
    'RELATIONSHIP_CHANGED', 'SOURCE_REPLACED',
  ];
  assert.deepEqual(REGULATORY_CHANGE_KINDS, required);
  assert.equal(getContract('RegulatoryChange').fields.change_kind.values.length, 14);
});

/* ------------------------------------------- ImpactAssessment (SESSION 10) */

test('ImpactAssessment: an editorial impact may not be automatically actionable without a named permit', () => {
  const r = fx('ImpactAssessment');
  r.editorial[0].automatically_actionable = true;
  r.counts.automatically_actionable = 2;
  refuses(r, 'no governance_permit');

  /* And the permit is what makes it legal, so the mechanism the
     brief's "unless governance explicitly permits otherwise"
     requires actually exists rather than being a refusal wearing a
     clause. */
  const ok = fx('ImpactAssessment');
  ok.editorial[0].automatically_actionable = true;
  ok.editorial[0].governance_permit = 'a hypothetical policy, for the scope it names';
  ok.counts.automatically_actionable = 2;
  assert.deepEqual(validate(ok, { allowSimulated: true }), []);
});

test('ImpactAssessment: prose never sits in factual, and a reference never in editorial', () => {
  const a = fx('ImpactAssessment');
  a.factual[0].field_class = 'prose';
  refuses(a, 'nothing here reads prose');

  const b = fx('ImpactAssessment');
  b.editorial[0].field_class = 'reference';
  refuses(b, 'editorial means prose');
});

test('ImpactAssessment: an editorial finding without a quote belongs in open_questions', () => {
  const r = fx('ImpactAssessment');
  r.editorial[0].quote = null;
  refuses(r, 'carries no quote');
});

test('ImpactAssessment: prose is never routed as something the site recomputes', () => {
  const r = fx('ImpactAssessment');
  r.editorial[0].route = 'propagates_by_derivation';
  refuses(r, 'a sentence is not recomputed when a page is opened');
});

test('ImpactAssessment: the count of what an agent may do unattended cannot drift', () => {
  const r = fx('ImpactAssessment');
  r.counts.automatically_actionable = 99;
  refuses(r, 'this is the number that says what an agent may do unattended');
});

test('ImpactAssessment: a map that omits its blind spots is refused', () => {
  const r = fx('ImpactAssessment');
  r.caveats = [];
  refuses(r, 'reads as coverage');

  const u = fx('ImpactAssessment');
  u.unresolved_roots = ['some:record-not-in-the-corpus'];
  refuses(u, 'a silence in this map, not an absence of impact');
});

test('ImpactAssessment: it references the detection rather than restating it', () => {
  const c = getContract('ImpactAssessment');
  for (const f of ['change_kind', 'old_value', 'new_value', 'materiality', 'affected_pages']) {
    assert.ok(f in c.forbidden, `${f} must be forbidden by name, with the reason`);
    assert.ok(c.forbidden[f].length > 40, `${f}'s objection must say why, not just no`);
  }
  for (const f of ['proposed_change', 'operations', 'applied_at', 'resolved']) {
    assert.ok(f in c.forbidden, `${f} would make an assessment into a proposal or an edit`);
  }
  assert.ok('change_id' in c.fields, 'the reference to the detection is the whole mechanism');
});

/* ---------------------------------------------------------- KnowledgeGap
   (SESSION 11)

   The rules worth a test here are the ones that carry the brief's
   two hardest instructions: "do not reward quantity" and "do not
   directly modify canonical data". Both are enforced on the record
   rather than trusted to the agent that writes it.               */

test('KnowledgeGap: a gap nothing in the corpus leans on is a wish, not a finding', () => {
  const r = fx('KnowledgeGap');
  r.evidence = [simEvidence('ev-1')];   // a retrieved document, not a corpus record
  refuses(r, 'no corpus record leaning on the missing concept');
});

test('KnowledgeGap: closing one is never something an agent may do unattended', () => {
  const r = fx('KnowledgeGap');
  r.autonomy_class = 'autonomous';
  refuses(r, 'closing a knowledge gap means writing a legal fact');
});

test('KnowledgeGap: a gap needing a schema change is structural work, never Class B', () => {
  const r = fx('KnowledgeGap');
  r.recommended_data_location = { ...r.recommended_data_location, shape_exists: false };
  r.autonomy_class = 'review_required';
  refuses(r, 'structural change is never Class B');

  r.autonomy_class = 'human_only';
  assert.deepEqual(V(r), []);
});

test('KnowledgeGap: no rule matched is never rendered as a negative finding', () => {
  const r = fx('KnowledgeGap');
  r.absence_kind = 'no_rule_matched';
  r.impact = 'analysis_incomplete';
  refuses(r, 'NOT DETERMINED');
});

test('KnowledgeGap: a lead that was actually read is a verification, not a gap', () => {
  const r = fx('KnowledgeGap');
  r.candidate_evidence = [{ ...r.candidate_evidence[0], retrieved: true }];
  refuses(r, 'produces a VerificationRecord');
});

test('KnowledgeGap: an empty pointer reads as coverage and is refused', () => {
  const r = fx('KnowledgeGap');
  r.candidate_evidence = [{ kind: 'corpus_record', where: null, what_it_would_establish: 'Something.', retrieved: false }];
  refuses(r, 'Use "none_identified" rather than an empty pointer');
});

test('KnowledgeGap: "nowhere to look" and "somewhere to look" are not said together', () => {
  const r = fx('KnowledgeGap');
  r.candidate_evidence = [
    r.candidate_evidence[0],
    { kind: 'none_identified', where: null, what_it_would_establish: 'Nothing — there is nowhere to look.', retrieved: false },
  ];
  refuses(r, 'either there is somewhere to look or there is not');
});

test('KnowledgeGap: there is no field for the missing value, under any name', () => {
  const c = getContract('KnowledgeGap');
  for (const f of ['missing_value', 'substitute', 'best_guess', 'assumed_value', 'plausible_value', 'likely_answer', 'default_value']) {
    assert.ok(f in c.forbidden, `${f} must be forbidden by name, with the reason`);
  }
  for (const f of ['missing_value', 'substitute']) {
    assert.ok(c.forbidden[f].length > 40, `${f}'s objection must say why, not just no`);
  }
  const r = fx('KnowledgeGap');
  r.missing_value = 'Article 83';
  refuses(r, 'fabricates a legal fact');
});

test('KnowledgeGap: it is a question, and carries no edit and no count', () => {
  const c = getContract('KnowledgeGap');
  for (const f of ['proposed_change', 'occurrences', 'severity_score']) {
    assert.ok(f in c.forbidden, `${f} must be forbidden by name`);
  }
  const r = fx('KnowledgeGap');
  r.occurrences = 15;
  refuses(r, 'quantity this contract refuses to reward');
});

test('KnowledgeGap is not DataGap, and each points at the other\'s ground', () => {
  const kg = getContract('KnowledgeGap');
  const dg = getContract('DataGap');
  assert.ok('what_is_missing' in kg.forbidden, 'DataGap\'s word must be refused by name');
  assert.ok(kg.forbidden.what_is_missing.includes('DataGap'), 'and the objection must name the contract that was wanted');
  assert.ok('recommended_data_location' in kg.fields, 'naming the home is what makes this a representation gap');
  assert.ok(!('recommended_data_location' in dg.fields), 'and DataGap does not carry it — that is the difference');
});

test('KnowledgeGap: the thirteen kinds the session named all exist, in the brief\'s order', () => {
  assert.deepEqual(DEPTH_GAP_KINDS, [
    'missing_instrument', 'missing_provision', 'incomplete_timeline',
    'incomplete_applicability', 'missing_institution', 'missing_competence',
    'incomplete_enforcement', 'unsupported_claim', 'missing_source_relationship',
    'missing_instrument_relationship', 'missing_glossary_concept',
    'missing_subordinate_instrument', 'stale_record',
  ]);
  assert.equal(DEPTH_GAP_KINDS.length, 13);
  assert.equal(new Set(DEPTH_GAP_KINDS).size, 13);
  assert.deepEqual(getContract('KnowledgeGap').fields.gap_kind.values, DEPTH_GAP_KINDS);
});

test('KnowledgeGap: the impact ladder is about absence, not about a change', () => {
  /* MATERIALITY_LEVELS weighs how far a value moved. An absence has
     no before and no after, so the ladders are deliberately
     different vocabularies and neither may be substituted for the
     other. */
  assert.equal(DEPTH_IMPACT_LEVELS.length, 4);
  for (const level of DEPTH_IMPACT_LEVELS) {
    assert.ok(!['none', 'metadata_only', 'substantive', 'reader_acts_on_it'].includes(level),
      `"${level}" is a materiality level: an absence is not weighed on the ladder for a change`);
  }
  assert.equal(DEPTH_IMPACT_LEVELS[3], 'reader_could_be_misled', 'the worst level is the §0.5 failure');
});

test('KnowledgeGap: a home is inside data/, and nowhere else', () => {
  const values = getContract('KnowledgeGap').fields.recommended_data_location.shape.dataset.values;
  for (const v of values) assert.ok(v.startsWith('data/') && v.endsWith('.json'), `${v} is not a canonical home`);
  const r = fx('KnowledgeGap');
  r.recommended_data_location = { ...r.recommended_data_location, dataset: 'index.html' };
  refuses(r, 'is not one of');
});

/* ------------------------------------- record identity (SESSION 13) */

/** An id derived from a finding's own content, not from where the
 *  finding happened to sit in a queue. The defect these hold down:
 *  every agent minted ids from a per-run counter, so removing one
 *  unrelated instrument from data/ renumbered 37 of the 55 depth
 *  findings that were otherwise untouched. */

test('identity: the same content mints the same id, in any process, with nothing to load', () => {
  const parts = { kind: 'missing_competence', entities: [{ kind: 'instrument', id: 'dora', path: 'data/instruments.json' }], subject: 'dora' };
  assert.equal(contentId('kg-missing-competence', parts), contentId('kg-missing-competence', { ...parts }));
});

test('identity: the id satisfies F.id, because ids travel through filenames and URLs', () => {
  const pattern = new RegExp(getContract('KnowledgeGap').fields.gap_id.pattern);
  for (const prefix of ['kg-missing-competence', 'cand', 'ver', 'rchg', 'imp', 'prop-annotate', 'dg-from-depth', 'appr', 'link', 'gap']) {
    const id = contentId(prefix, { kind: 'k', subject: 's' });
    assert.match(id, pattern, `${id} is not a shape this repository's ids may take`);
  }
});

test('identity: the WHOLE entity set is the key, not the first entity', () => {
  /* The audit measured 57 KnowledgeGap records against only 56
     distinct (gap_kind, first entity) keys — missing_instrument_
     relationship about ai-act appears twice, once paired with one
     instrument and once with another. Keying on the first entity
     alone would merge two findings into one node. */
  const a = contentId('kg', { kind: 'missing_instrument_relationship', entities: [{ kind: 'instrument', id: 'ai-act' }, { kind: 'instrument', id: 'gdpr' }] });
  const b = contentId('kg', { kind: 'missing_instrument_relationship', entities: [{ kind: 'instrument', id: 'ai-act' }, { kind: 'instrument', id: 'dsa' }] });
  assert.notEqual(a, b, 'two findings sharing a first entity collapsed into one id');
});

test('identity: the entity set is a SET — order and repetition are not identity', () => {
  const a = contentId('kg', { kind: 'k', entities: [{ id: 'a' }, { id: 'b' }] });
  const b = contentId('kg', { kind: 'k', entities: [{ id: 'b' }, { id: 'a' }, { id: 'b' }] });
  assert.equal(a, b);
});

test('identity: rewording a note does not mint a new node', () => {
  /* `field` and `note` are the finding's description of an entity,
     not which record it is. A knowledge graph whose node ids move
     when prose is edited is not a graph of stable nodes. */
  const a = contentId('kg', { kind: 'k', entities: [{ kind: 'claim', id: 'clm-x', path: 'data/claims.json', field: 'sources', note: 'one wording' }] });
  const b = contentId('kg', { kind: 'k', entities: [{ kind: 'claim', id: 'clm-x', path: 'data/claims.json', field: 'note', note: 'another wording entirely' }] });
  assert.equal(a, b);
});

test('identity: a subject cannot impersonate a separator', () => {
  /* The key is canonical JSON rather than a delimiter-joined
     string, so a value containing the delimiter cannot forge the
     key of a different finding. */
  const a = contentId('kg', { kind: 'k', subject: 'a', discriminator: 'b' });
  const b = contentId('kg', { kind: 'k', subject: 'a","b', discriminator: null });
  assert.notEqual(a, b);
});

test('identity: an id derived from no kind is derived from nothing, and is refused', () => {
  assert.throws(() => contentKey({ kind: null, subject: 's' }), /needs a kind/);
  assert.throws(() => contentId('', { kind: 'k' }), /prefix/);
});

test('identity: the minter refuses a collision instead of merging two findings', () => {
  const m = new IdMinter();
  const parts = { kind: 'k', subject: 's' };
  assert.equal(m.mint('gap', parts), m.mint('gap', { ...parts }), 'the same finding twice is one node, not two');
  assert.equal(m.size, 1);
  /* Force the contradiction the guard exists for. */
  const forced = new IdMinter();
  forced.seen.set(contentId('gap', parts), 'a different content key entirely');
  assert.throws(() => forced.mint('gap', parts), /id collision/);
});

test('identity: the minter is not an id store — deleting it changes no id', () => {
  /* The rule the audit was emphatic about: an id must be
     reproducible from content, never looked up. `contentId` takes
     no state and is what every mint call returns. */
  const parts = { kind: 'k', entities: [{ id: 'x' }], subject: 's' };
  assert.equal(new IdMinter().mint('gap', parts), contentId('gap', parts));
});
