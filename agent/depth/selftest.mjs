/* ============================================================
   agent/depth/selftest.mjs — Agent 4's suite

   Run:  node --test agent/depth/selftest.mjs

   What it holds this agent to, in the order the risks matter:

     · IT NEVER WRITES. No write call in any module here, and data/
       is byte-identical before and after a full run against the real
       corpus. This is asserted rather than promised, the way
       agent/integrate and agent/detector are.
     · IT DOES NOT REWARD QUANTITY. A finding with nothing leaning on
       it is set aside; a suppression is always reasoned; the counts
       add up; and the contract independently refuses a record with
       no corpus record behind it.
     · IT FABRICATES NOTHING. No record carries a value for the
       missing fact, no candidate lead is marked retrieved, and every
       gap carries an open question saying what it has not
       established.
     · THE THIRTEEN ARE ALL THERE, and each one is asked of the real
       corpus rather than of a fixture — which is what makes a zero
       from one of them a result rather than an untested branch.

   The corpus is the real one throughout, deliberately. A fixture
   corpus would let a detector pass while being wrong about the
   dataset it exists to read, which is the failure SESSION 08's
   adapter suite was rebuilt to avoid.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { deterministicIds, deterministicClock } from '../observability/ids.mjs';
import { MemoryRecordStore } from '../scout/store.mjs';
import { loadCorpus, hashDataDir } from '../integrate/canonical.mjs';
import { validate } from '../schemas/validate.mjs';
import { getContract } from '../schemas/registry.mjs';
import { DEPTH_GAP_KINDS, DEPTH_IMPACT_LEVELS, DEPTH_IMPACT_RANK, AUTONOMY_RANK } from '../schemas/types.mjs';
import { buildTree, depthState } from '../observability/query.mjs';

import { buildLens, LIVE_STATUSES, UNANALYSED_SCOPES, ENFORCEMENT_ROLES } from './lens.mjs';
import { DETECTORS, DETECTOR_KINDS, CO_CITATION_FLOOR, glossaryFloor } from './detectors.mjs';
import { assess, partition, demand, demandEvidence } from './demand.mjs';
import { AUTONOMY_FOR_KIND, CONFIDENCE_FOR_KIND, autonomyFor, confidenceFor } from './rank.mjs';
import { DepthAgent, DEPTH_AGENT, MAX_EVIDENCE } from './depth.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const AS_OF = '2026-09-02';

/* One corpus read and one full run, shared. The agent is
   deterministic over an unchanged corpus, and a test below asserts
   exactly that. */
const corpus = loadCorpus();
const lens = buildLens({ corpus });

function runAgent(opts = {}) {
  const tracer = new Tracer({
    sink: new MemorySink(),
    ids: deterministicIds(),
    clock: deterministicClock('2026-09-02T09:00:00.000Z'),
  });
  const store = new MemoryRecordStore({ allowSimulated: false });
  const agent = new DepthAgent({ tracer, store, corpus, asOf: AS_OF, ...opts });
  return { tracer, store, agent };
}

const before = hashDataDir();
const { tracer, store, agent } = runAgent();
const result = await agent.run();
const after = hashDataDir();

/* ============================================================
   it never writes
   ============================================================ */

test('a full run against the real corpus leaves data/ byte-identical', () => {
  assert.deepEqual(after, before, 'data/ changed during a depth run. This agent has no code path that writes there.');
});

test('no module in agent/depth/ contains a write call', () => {
  const forbidden = [
    'writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync',
    'mkdirSync', 'renameSync', 'copyFileSync', 'truncateSync', 'writeFile(',
  ];
  const files = readdirSync(HERE).filter((f) => f.endsWith('.mjs') && f !== 'selftest.mjs');
  assert.ok(files.length >= 6, 'expected the agent modules to be found');
  for (const f of files) {
    const src = readFileSync(join(HERE, f), 'utf8');
    for (const call of forbidden) {
      assert.ok(!src.includes(call), `${f} contains ${call}: this directory is read-only, and the guarantee is that there is no write path rather than that nobody took it`);
    }
  }
});

test('the agent writes no proposal, approval or change record', () => {
  assert.ok(store.written.length > 0, 'the run stored something');
  for (const r of store.written) {
    assert.equal(r.contract, 'KnowledgeGap', `the Data Depth Agent emitted a ${r.contract}. A gap is a question; the answer is a DataProposal behind an ApprovalRequest, and neither is this agent's to write.`);
  }
});

/* ============================================================
   the thirteen
   ============================================================ */

test('there is one detector per gap kind, in the brief\'s order', () => {
  assert.deepEqual(DETECTOR_KINDS, DEPTH_GAP_KINDS);
  assert.equal(DETECTORS.length, 13);
});

test('every detector states what it is for, and is asked of the real corpus', () => {
  for (const d of DETECTORS) {
    assert.ok(typeof d.why === 'string' && d.why.length > 20, `${d.kind} does not say what it is for`);
    assert.ok(typeof d.label === 'string' && d.label.length > 3, `${d.kind} has no label`);
    assert.doesNotThrow(() => d.detect(lens), `${d.kind} threw against the real corpus`);
  }
  assert.equal(result.by_detector.length, 13, 'every detector must appear in the run result, including the ones that found nothing');
});

test('a detector that found nothing is reported as a result, not as silence', () => {
  /* Two currently find nothing on this corpus, and that is the right
     answer rather than an untested branch: missing_instrument
     subtracts the documents whose citing claims are about an act the
     corpus does model, and incomplete_timeline's only candidates are
     acts the corpus has declared outside its analytical scope. The
     test asserts the SHAPE — that finding nothing is carried — not
     which two they are, so a corpus that grows does not fail it. */
  for (const k of result.kinds_with_no_finding) {
    assert.equal(result.by_kind[k], 0);
    assert.ok(DEPTH_GAP_KINDS.includes(k));
  }
  const named = new Set(result.by_detector.map((d) => d.kind));
  for (const k of DEPTH_GAP_KINDS) assert.ok(named.has(k), `${k} is missing from the run's own account of itself`);
});

/* ============================================================
   it does not reward quantity
   ============================================================ */

test('a finding nothing in the corpus leans on is set aside, with a reason', () => {
  const a = assess({ gap_kind: 'missing_provision', subject: 'x', demand: [] });
  assert.equal(a.reported, false);
  assert.match(a.why, /nothing in the corpus leans on the missing concept/);
  assert.equal(a.weight, 0);
});

test('an act the corpus has declared outside its analytical scope is set aside first', () => {
  /* Checked BEFORE demand, because such an act accumulates demand
     from claims that merely name it in passing — so an
     out-of-scope finding with demand must still be set aside. */
  const a = assess({ gap_kind: 'missing_provision', subject: 'charter', out_of_scope: 'scope:referenced', demand: [demand({ from: 'clm-x', from_kind: 'claim', dataset: 'data/claims.json', note: 'n' })] });
  assert.equal(a.reported, false);
  assert.match(a.why, /outside this brief's analytical scope/);
});

test('every suppression carries its reason, and nothing is dropped silently', () => {
  assert.ok(result.suppressed.length > 0, 'the real corpus produces suppressions; a run with none has stopped discriminating');
  for (const s of result.suppressed) {
    assert.ok(typeof s.why === 'string' && s.why.length > 40, `${s.gap_kind}:${s.subject} was set aside with no reason`);
    assert.ok(s.subject, 'a suppression with no subject cannot be checked');
    assert.ok(DEPTH_GAP_KINDS.includes(s.gap_kind));
  }
});

test('the counts add up: examined = reported + set aside, per detector and overall', () => {
  let reported = 0;
  let aside = 0;
  let examined = 0;
  for (const d of result.by_detector) {
    assert.equal(d.examined, d.reported + d.set_aside, `${d.kind}: examined does not equal reported plus set aside`);
    reported += d.reported; aside += d.set_aside; examined += d.examined;
  }
  assert.equal(reported, result.gaps.length);
  assert.equal(aside, result.suppressed.length);
  assert.equal(examined, reported + aside);
});

test('partition orders by weight and is stable over an unchanged corpus', () => {
  const findings = [
    { gap_kind: 'missing_provision', subject: 'b', demand: [demand({ from: '1', from_kind: 'claim', dataset: 'd', note: 'n' })] },
    { gap_kind: 'missing_provision', subject: 'a', demand: [demand({ from: '2', from_kind: 'claim', dataset: 'd', note: 'n', weight: 5 })] },
    { gap_kind: 'missing_provision', subject: 'c', demand: [] },
  ];
  const { reported, suppressed } = partition(findings);
  assert.deepEqual(reported.map((r) => r.subject), ['a', 'b']);
  assert.equal(suppressed.length, 1);
  assert.deepEqual(partition(findings).reported.map((r) => r.subject), reported.map((r) => r.subject));
});

test('the one tuned threshold in the detectors is named and has not drifted', () => {
  assert.equal(CO_CITATION_FLOOR, 2, 'changing the co-citation floor changes how many relationship gaps are reported; it is a visible decision, not an edit inside a condition');
});

test('the glossary threshold is the corpus\'s own standard, per kind of record', () => {
  const floors = glossaryFloor(lens);
  assert.ok(Object.keys(floors).length > 0, 'the glossary covers something, so it sets a standard');
  for (const [kind, n] of Object.entries(floors)) {
    assert.ok(Number.isInteger(n) && n >= 0, `${kind} floor is not a count`);
  }
  /* Per kind, not overall: the glossary explains provisions
     referenced a handful of times and instruments referenced dozens
     of times, and one floor across both would report every mid-sized
     instrument against a standard set for articles. */
  if (floors.provision !== undefined && floors.instrument !== undefined) {
    assert.notEqual(floors.provision, floors.instrument, 'a single floor across kinds is the failure this per-kind derivation exists to avoid — if these ever coincide, check the derivation still discriminates');
  }
});

/* ============================================================
   it fabricates nothing
   ============================================================ */

test('every gap satisfies the contract', () => {
  assert.ok(result.gaps.length > 0, 'the real corpus produces gaps');
  for (const g of result.gaps) {
    assert.deepEqual(validate(g), [], `${g.gap_id} does not satisfy KnowledgeGap:\n${validate(g).join('\n')}`);
  }
});

test('no gap carries a value for the missing fact, under any name', () => {
  const forbidden = Object.keys(getContract('KnowledgeGap').forbidden);
  for (const g of result.gaps) {
    for (const f of forbidden) {
      assert.ok(!(f in g), `${g.gap_id} carries the forbidden field ${f}`);
    }
  }
});

test('no candidate lead is marked retrieved, because nothing here has retrieved anything', () => {
  for (const g of result.gaps) {
    assert.ok(g.candidate_evidence.length >= 1, `${g.gap_id} names nowhere to look, not even "nowhere"`);
    for (const c of g.candidate_evidence) {
      assert.equal(c.retrieved, false, `${g.gap_id} claims a lead was retrieved. No agent in this repository has ever retrieved a document.`);
      assert.ok(c.what_it_would_establish.length > 10, `${g.gap_id} has a lead that cannot say what it would establish`);
      if (c.kind !== 'none_identified') assert.ok(c.where, `${g.gap_id} has an empty pointer, which reads as coverage`);
    }
  }
});

test('"nowhere to look" is said plainly where it is true', () => {
  const none = result.gaps.filter((g) => g.candidate_evidence.some((c) => c.kind === 'none_identified'));
  assert.ok(none.length > 0, 'some gaps on this corpus genuinely have nowhere to look; a run where every gap has a lead has probably invented one');
  for (const g of none) {
    assert.equal(g.candidate_evidence.length, 1, `${g.gap_id} says both that there is nowhere to look and that there is somewhere`);
  }
});

test('every gap carries the open question it has not answered', () => {
  for (const g of result.gaps) {
    assert.ok(g.epistemic.unresolved.length >= 1, `${g.gap_id} has no open question, so it is not a gap`);
    const q = g.epistemic.unresolved[0];
    assert.ok(q.missing.length > 20, `${g.gap_id} does not say what would close it`);
  }
});

test('why_it_matters is an inference and says so, never a fact read from a source', () => {
  for (const g of result.gaps) {
    assert.equal(g.epistemic.fact.length, 0, `${g.gap_id} claims to have read something from a source. This agent reads data/, which is not a source.`);
    const inf = g.epistemic.inference.find((i) => i.field === 'why_it_matters');
    assert.ok(inf, `${g.gap_id} does not type why_it_matters as an inference`);
    assert.ok(inf.method.length > 40, `${g.gap_id}'s why_it_matters gives no method — "it follows" is not one`);
  }
});

test('the evidence behind a gap is corpus records, and the count describes all of them', () => {
  for (const g of result.gaps) {
    assert.ok(g.evidence.length >= 1, `${g.gap_id} has no evidence`);
    assert.ok(g.evidence.length <= MAX_EVIDENCE, `${g.gap_id} itemises more than the cap`);
    for (const e of g.evidence) {
      assert.equal(e.kind, 'dataset_record', `${g.gap_id} stands on a ${e.kind}. A depth finding stands on the corpus.`);
      assert.equal(e.role, 'unresolved', 'a JSON file in this repository is not a legal authority');
      assert.equal(e.retrieved_at, null, 'nothing here was retrieved');
    }
    /* Where the demand exceeded the cap the record must say so
       rather than let the shorter list read as the whole. */
    const inf = g.epistemic.inference.find((i) => i.field === 'why_it_matters');
    const stated = Number(String(inf.statement).match(/^(\d+) record/)?.[1] ?? 0);
    assert.ok(stated >= g.evidence.length, `${g.gap_id}: the stated demand count is smaller than the evidence itemised`);
    if (stated > MAX_EVIDENCE) {
      assert.match(inf.statement, /the count describes all of them/, `${g.gap_id} itemises a bounded preview and does not say the count is of the whole`);
    }
  }
});

/* ============================================================
   what may be done about a gap
   ============================================================ */

test('no gap is ever autonomous, and the contract refuses one that claims to be', () => {
  for (const g of result.gaps) {
    assert.notEqual(g.autonomy_class, 'autonomous', `${g.gap_id} claims closing it needs no human`);
    assert.ok(AUTONOMY_RANK[g.autonomy_class] >= AUTONOMY_RANK.review_required);
  }
  const g = { ...result.gaps[0], autonomy_class: 'autonomous' };
  assert.ok(validate(g).some((e) => e.includes('writing a legal fact')));
});

test('a gap whose home does not exist yet is escalated to human_only, one way', () => {
  const a = autonomyFor({ gap_kind: 'missing_glossary_concept', location: { shape_exists: false } });
  assert.equal(a.autonomy_class, 'human_only');
  assert.equal(a.escalated, true);
  assert.match(a.why, /structural change is never Class B/);

  const b = autonomyFor({ gap_kind: 'missing_glossary_concept', location: { shape_exists: true } });
  assert.equal(b.autonomy_class, 'review_required');
  assert.equal(b.escalated, false);

  /* And it holds on the real run, independently of the table. */
  for (const g of result.gaps) {
    if (g.recommended_data_location.shape_exists === false) {
      assert.equal(g.autonomy_class, 'human_only', `${g.gap_id} needs a schema change and is not human_only`);
    }
  }
});

test('every gap kind has an autonomy row and a confidence row, each with a reason', () => {
  for (const k of DEPTH_GAP_KINDS) {
    const [cls, why] = AUTONOMY_FOR_KIND[k];
    assert.ok(['review_required', 'human_only'].includes(cls), `${k} maps to "${cls}"`);
    assert.ok(why.length > 40, `${k}'s autonomy row gives no reason`);
    const [conf, basis] = CONFIDENCE_FOR_KIND[k];
    assert.ok(conf > 0 && conf <= 1, `${k}'s confidence is not a ratio`);
    assert.ok(basis.length > 40, `${k}'s confidence row gives no basis`);
  }
});

test('confidence is lower where a finding rests on matching a string somebody wrote', () => {
  /* A lookup against the corpus cannot be wrong about the corpus. A
     pattern matched against a recorded title can be. */
  const lookup = confidenceFor({ gap_kind: 'missing_provision' }).confidence;
  const pattern = confidenceFor({ gap_kind: 'missing_source_relationship' }).confidence;
  assert.ok(pattern < lookup, 'a title match must be worth less than a lookup, and say so');
  assert.ok(confidenceFor({ gap_kind: 'missing_subordinate_instrument' }).confidence < lookup);
});

test('confidence and impact are separate, and neither is derived from the other', () => {
  const byImpact = new Map();
  for (const g of result.gaps) {
    if (!byImpact.has(g.impact)) byImpact.set(g.impact, new Set());
    byImpact.get(g.impact).add(g.confidence);
  }
  /* If the two were the same quantity under two names, every finding
     at one impact level would carry one confidence. */
  const spread = [...byImpact.values()].some((s) => s.size > 1);
  assert.ok(spread, 'every finding at some impact level carries the same confidence — check the two have not been collapsed into one number');
});

/* ============================================================
   the three states, kept apart
   ============================================================ */

test('where no rule fires the answer is NOT DETERMINED, at the top of the ladder', () => {
  const noRule = result.gaps.filter((g) => g.absence_kind === 'no_rule_matched');
  assert.ok(noRule.length > 0, 'the corpus has live acts the questionnaire cannot reach; a run finding none has stopped asking');
  for (const g of noRule) {
    assert.equal(g.impact, 'reader_could_be_misled', `${g.gap_id}: absence of a rule read as anything less than the top of the ladder is AI-SAFE-BOUNDARIES §0.5`);
    assert.match(g.why_it_matters, /never evidence of non-applicability|NOT DETERMINED/);
  }
});

test('null and unknown are different states on a gap and are never merged', () => {
  const kinds = new Set(result.gaps.map((g) => g.absence_kind));
  assert.ok(kinds.has('null_not_researched'), 'nobody-looked findings exist on this corpus');
  assert.ok(kinds.has('unknown_not_determinable'), 'researched-and-not-determinable findings exist on this corpus');
  for (const g of result.gaps) {
    assert.ok(['null_not_researched', 'unknown_not_determinable', 'no_rule_matched'].includes(g.absence_kind));
  }
  /* A researched-and-not-determinable gap must not claim nobody has
     looked, which is the merge this test exists to catch. */
  for (const g of result.gaps.filter((x) => x.absence_kind === 'unknown_not_determinable')) {
    assert.ok(!/nobody has looked/i.test(g.missing_concept), `${g.gap_id} says both researched and not researched`);
  }
});

test('the impact ladder is about absence and is not the materiality ladder', () => {
  for (const g of result.gaps) assert.ok(DEPTH_IMPACT_LEVELS.includes(g.impact));
  for (const level of DEPTH_IMPACT_LEVELS) {
    assert.ok(!['none', 'metadata_only', 'substantive', 'reader_acts_on_it'].includes(level));
  }
  assert.equal(DEPTH_IMPACT_RANK.reader_could_be_misled, 3);
});

/* ============================================================
   the lens reads the corpus the way the corpus means it
   ============================================================ */

test('a wildcard competence is never an answer to who enforces one act', () => {
  /* data/institutions.json's own $note: a wildcard instrument "*" in
     a competence means the role is held across the acquis. Counting
     it per instrument would make every act look supervised. */
  assert.ok(lens.genericCompetences.length > 0, 'the corpus carries generic competences');
  for (const list of lens.competencesByInstrument.values()) {
    for (const c of list) assert.notEqual(c.instrument, '*');
  }
  const withGeneric = lens.corpus.instruments.filter((i) => lens.enforcementRolesOf(i.id).length === 0);
  assert.ok(withGeneric.length > 0, 'some acts have no instrument-specific enforcement role, and the generic ones did not paper over it');
});

test('the live and unanalysed vocabularies come from the taxonomy, not from memory', () => {
  const statusIds = new Set(corpus.db.taxonomy.status.map((t) => t.id));
  for (const s of LIVE_STATUSES) assert.ok(statusIds.has(s), `${s} is not a taxonomy status term`);
  const scopeIds = new Set(corpus.db.taxonomy.scope_class.map((t) => t.id));
  for (const s of UNANALYSED_SCOPES) assert.ok(scopeIds.has(s), `${s} is not a taxonomy scope term`);
  const roleIds = new Set(corpus.db.taxonomy.competence_role.map((t) => t.id));
  for (const r of ENFORCEMENT_ROLES) assert.ok(roleIds.has(r), `${r} is not a taxonomy competence role`);
});

test('the graph is borrowed rather than rebuilt', () => {
  assert.ok(lens.graph.counts.nodes > 100, 'the lens carries the real corpus graph');
  assert.equal(lens.graph.counts.id_collisions, 0);
  const src = readFileSync(join(HERE, 'lens.mjs'), 'utf8');
  assert.match(src, /from '\.\.\/detector\/graph\.mjs'/, 'the lens must use the graph the detector already derives, not a second reference table');
});

/* ============================================================
   the analysis is instrumented
   ============================================================ */

test('the trace carries a span per detector, the census, and the ordering decision', () => {
  const records = tracer.sink.records ?? tracer.sink.all?.() ?? [];
  const { roots } = buildTree(records);
  const d = depthState(roots[0], result.trace_id);
  assert.ok(d, 'the run left no depth analysis on its trace');
  assert.equal(d.detectors.length, 13, 'every detector must be a span, including the ones that found nothing');
  assert.equal(d.reported, result.gaps.length);
  assert.equal(d.set_aside, result.suppressed.length);
  assert.equal(d.as_of, AS_OF);
  assert.ok(d.ordering, 'the ordering is a decision and is recorded as one');
  assert.equal(d.gap_ids.length, result.gaps.length);
  assert.deepEqual(d.gaps, [], `the depth view reports gaps in the trace itself: ${d.gaps.join('; ')}`);
});

test('a suppression nobody can see is a suppression nobody can check', () => {
  const records = tracer.sink.records ?? tracer.sink.all?.() ?? [];
  const { roots } = buildTree(records);
  const d = depthState(roots[0], result.trace_id);
  for (const det of d.detectors) {
    if (!det.set_aside) continue;
    assert.equal(det.set_aside_detail.length, det.set_aside, `${det.kind} set ${det.set_aside} aside and put ${det.set_aside_detail.length} reasons on the trace`);
    for (const a of det.set_aside_detail) assert.ok(a.why.length > 40);
  }
});

test('the ordering decision names the alternative the brief refuses', () => {
  const records = tracer.sink.records ?? tracer.sink.all?.() ?? [];
  const { roots } = buildTree(records);
  const d = depthState(roots[0], result.trace_id);
  assert.ok(d.ordering.alternatives.some((a) => /number of records|quantity/i.test(a)),
    'ordering by count is the alternative this agent exists to refuse, and refusing it on the trace is what makes it checkable');
});

/* ============================================================
   the run itself
   ============================================================ */

test('an as-of date is mandatory', () => {
  assert.throws(() => new DepthAgent({ tracer, store, corpus, asOf: null }), /asOf/);
  assert.throws(() => new DepthAgent({ tracer, store, corpus, asOf: 'yesterday' }), /asOf/);
});

test('every gap carries the as-of date the corpus was read at', () => {
  for (const g of result.gaps) assert.equal(g.as_of, AS_OF);
});

test('two runs over an unchanged corpus produce the same findings in the same order', async () => {
  const second = await runAgent().agent.run();
  assert.deepEqual(
    second.ranked.map((g) => `${g.gap_kind}:${g.affected_entities.map((e) => e.id ?? e.path).join('+')}`),
    result.ranked.map((g) => `${g.gap_kind}:${g.affected_entities.map((e) => e.id ?? e.path).join('+')}`),
  );
  assert.equal(second.suppressed.length, result.suppressed.length);
});

test('a change record can never create a gap, only annotate one', async () => {
  const withChanges = await runAgent({
    changes: [{ contract: 'RegulatoryChange', change_id: 'chg-x', entity_id: 'ai-act', affected_datasets: ['data/instruments.json'] }],
  }).agent.run();
  assert.equal(withChanges.gaps.length, result.gaps.length, 'a change record changed how many gaps were found. A change is not an absence.');
  const annotated = withChanges.gaps.filter((g) => g.epistemic.inference.some((i) => String(i.statement).includes('chg-x')));
  assert.ok(annotated.length > 0, 'the change should have annotated the gaps sitting on records it touches');
  for (const g of annotated) {
    const twin = result.gaps.find((x) => x.gap_id === g.gap_id);
    assert.equal(g.impact, twin.impact, `${g.gap_id}: a change record raised a gap's impact. It must not.`);
  }
});

test('the agent is named, and every record says which agent produced it', () => {
  assert.equal(DEPTH_AGENT, 'data-depth');
  for (const g of result.gaps) assert.equal(g.agent, DEPTH_AGENT);
});

test('a demand entry becomes evidence about the corpus, never about EU law', () => {
  const e = demandEvidence(demand({ from: 'ap-x', from_kind: 'applicability_rule', dataset: 'data/applicability.json', field: 'obligations', note: 'n' }), 0);
  assert.equal(e.kind, 'dataset_record');
  assert.equal(e.locator, 'data/applicability.json#ap-x.obligations');
  assert.equal(e.role, 'unresolved');
  assert.equal(e.url, null);
  assert.equal(e.checksum, null);
});

/* --------------------------------- node identity (SESSION 13) */

test('a gap id is derived from the finding, not from where it sat in the queue', async () => {
  /* THE MEASUREMENT THAT MADE THIS A PREREQUISITE. Under the old
     per-run counter, removing one unrelated instrument from the
     corpus renumbered 37 of the 55 findings that survived the
     removal untouched — every id after the deleted one shifted by
     the number of findings that disappeared before it. A knowledge
     graph is a structure of stable nodes; an id that moves when a
     different record is edited is not one.

     The perturbation is in memory. data/ is not touched, here or
     anywhere in this directory. */
  const perturbed = loadCorpus();
  perturbed.instruments = perturbed.instruments.filter((i) => i.id !== 'dora');
  perturbed.instrumentById.delete('dora');

  const baseline = await runAgent().agent.run();
  const after = await runAgent({ corpus: perturbed }).agent.run();

  const key = (g) => `${g.gap_kind}|${g.affected_entities.map((e) => e.id ?? e.path).sort().join(',')}`;
  const before = new Map(baseline.gaps.map((g) => [key(g), g.gap_id]));
  const now = new Map(after.gaps.map((g) => [key(g), g.gap_id]));

  const shared = [...before.keys()].filter((k) => now.has(k));
  assert.ok(shared.length > 40, `expected the perturbation to leave most findings standing, ${shared.length} survived`);
  const moved = shared.filter((k) => before.get(k) !== now.get(k));
  assert.deepEqual(moved, [], `${moved.length} finding(s) changed id because a different record was edited`);
});

test('two runs over an unchanged corpus produce the same gap ids', async () => {
  const a = await runAgent().agent.run();
  const b = await runAgent().agent.run();
  assert.deepEqual(a.gaps.map((g) => g.gap_id).sort(), b.gaps.map((g) => g.gap_id).sort());
});

test('every gap id is distinct, and the whole entity set is why', async () => {
  const r = await runAgent().agent.run();
  const ids = r.gaps.map((g) => g.gap_id);
  assert.equal(new Set(ids).size, ids.length, 'two findings share an id');

  /* The first-entity shorthand is NOT sufficient, and the corpus
     proves it: missing_instrument_relationship about ai-act appears
     twice with different partners. Keying on it would have merged
     them. */
  const firstOnly = new Set(r.gaps.map((g) => `${g.gap_kind}|${g.affected_entities[0]?.id ?? ''}`));
  assert.ok(firstOnly.size < ids.length, 'the corpus no longer contains the collision this test exists to prove the key survives');
});
