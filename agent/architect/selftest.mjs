/* ============================================================
   agent/architect/selftest.mjs — Agent 6's suite

   Run:  node --test agent/architect/selftest.mjs

   What it holds this agent to, in the order the risks matter:

     · IT NEVER WRITES, AND IT NEVER DRAFTS. No write call in any
       module here; data/ is byte-identical before and after a full
       run against the real corpus; no schema is changed; and every
       operation on every proposal carries a NULL `proposed`. That
       last one is this agent's version of "do not fabricate": a
       drafted schema is an agent deciding what a production site
       about EU law may say.
     · IT IS NOT A SECOND DATA DEPTH AGENT. Every finding declares
       whether a RECORD or a SHAPE would close it, and one a record
       would close is set aside and handed to agent/depth/.
       `boundary.mjs` is the mechanism and this suite is what proves
       it is one.
     · IT KNOWS NOTHING ABOUT EU LAW. Every finding stands on
       dataset_record evidence read from this repository; not one
       stands on a retrieved document, because no agent here has ever
       retrieved one.
     · NOTHING IS MERGED. Every proposal is behind a pending
       ApprovalRequest, no proposal is autonomous, and the run says
       so on its own trace in a form the read model can check.
     · THE EIGHT QUESTIONS ARE ALL ASKED, of the real corpus rather
       than of a fixture — which is what makes a "no" from one of
       them a result rather than an untested branch.

   The corpus is the real one throughout, deliberately. A fixture
   model would let a lens pass while being wrong about the dataset it
   exists to read.
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
import { buildTree, architectureState } from '../observability/query.mjs';
import { ARCHITECTURE_INVARIANTS } from '../schemas/contracts/architecture-proposal.mjs';

import { readModel, containersOf, nestedFieldCensusOf, arrayLiteralsOf, vocabulariesOf, keyedVocabularyUse, PROSE_FIELDS } from './model.mjs';
import { LENSES, LENS_IDS, fetchedDatasets, DATE_NAMED } from './lenses.mjs';
import { partition, ownershipOf, demandOf, evidenceProblems, ALLOWED_EVIDENCE_KINDS, NOT_OURS } from './boundary.mjs';
import { KnowledgeArchitect, ARCHITECT_AGENT, MAX_EVIDENCE, confidenceFor, migrationFor, dependencyImpact } from './architect.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const AS_OF = '2026-09-03';

/* One model read and one full run, shared. */
const MODEL = readModel();

function harness() {
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({
    service: 'test',
    sink,
    ids: deterministicIds(19),
    clock: deterministicClock('2026-09-03T09:00:00.000Z', 100),
    attributes: { agent: ARCHITECT_AGENT },
  });
  const store = new MemoryRecordStore({ allowSimulated: false });
  return { tracer, store, sink };
}

const architect = (over = {}) => {
  const { tracer, store, sink } = harness();
  return { it: new KnowledgeArchitect({ tracer, store, model: MODEL, asOf: AS_OF, ...over }), store, sink, tracer };
};

const HASH_BEFORE = hashDataDir();
const { it: RUNNER, store: RUN_STORE, sink: RUN_SINK } = architect();
const RESULT = await RUNNER.run();
const HASH_AFTER = hashDataDir();

/* ============================================================
   Nothing is written, nothing is drafted
   ============================================================ */

test('a full run leaves every file in data/ byte-identical', () => {
  assert.deepEqual(HASH_AFTER, HASH_BEFORE,
    'a run of the architect changed a canonical dataset. It has no code path that should be able to.');
});

test('no module in agent/architect/ contains a write call', () => {
  const forbidden = ['writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync', 'mkdirSync', 'writeFile(', 'rename('];
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(HERE, f), 'utf8');
    /* Comments are stripped so the modules can go on discussing
       writes at length without tripping their own check. */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    for (const call of forbidden) {
      assert.ok(!code.includes(call), `${f} contains ${call} — this agent reads and proposes, and writes nothing`);
    }
  }
});

test('every proposed operation carries a null `proposed` — no shape is drafted', () => {
  /* THE CENTRAL REFUSAL. This agent says a shape cannot hold what
     the corpus is saying, and stops. Drafting the replacement would
     be an agent deciding what a production site about EU law is able
     to express. */
  assert.ok(RESULT.proposals.length, 'the run produced no proposals, so this proves nothing');
  for (const p of RESULT.proposals) {
    for (const op of p.proposed_change.operations) {
      assert.equal(op.proposed, null, `${p.proposal_id} drafts a shape in operation "${op.target}"`);
    }
  }
});

test('no proposal introduces a dependency, a build step or a third-party request', () => {
  for (const p of RESULT.proposals) {
    assert.equal(p.introduces_dependency, false, `${p.proposal_id} adds a dependency`);
    assert.equal(p.introduces_build_step, false, `${p.proposal_id} adds a build step`);
    assert.equal(p.introduces_third_party_request, false, `${p.proposal_id} adds a third-party request`);
  }
});

test('every proposal is human_only — structural change is never Class B', () => {
  for (const p of RESULT.proposals) {
    assert.equal(p.autonomy_class, 'human_only',
      `${p.proposal_id} is "${p.autonomy_class}": docs/AGENT-ROLES.md §4 is that structural change is never Class B, and boundary.mjs only reports what no record can close`);
  }
});

test('every invariant a proposal names is one the contract declares', () => {
  for (const p of RESULT.proposals) {
    for (const inv of p.invariants_touched) {
      assert.ok(ARCHITECTURE_INVARIANTS.includes(inv), `${p.proposal_id} names "${inv}", which is not one of the declared invariants`);
    }
  }
});

/* ============================================================
   It is not a second Data Depth Agent
   ============================================================ */

test('a finding a record would close is set aside and handed to the agent that owns it', () => {
  const closable = { subject: 'x', closes_by: 'record', demand: [{ dataset: 'data/x.json' }] };
  const own = ownershipOf(closable);
  assert.equal(own.ours, false);
  assert.equal(own.route, 'data_depth');
  assert.match(own.why, /agent\/depth\//);
});

test('a finding that does not say what would close it is refused rather than guessed at', () => {
  for (const closes of [undefined, null, 'maybe', 'both']) {
    const own = ownershipOf({ subject: 'x', closes_by: closes });
    assert.equal(own.ours, false, `closes_by ${JSON.stringify(closes)} was accepted`);
    assert.match(own.why, /cannot be placed/);
  }
});

test('the real run actually exercises the boundary — something was set aside for it', () => {
  /* A mechanism nothing ever triggers is a mechanism nobody can
     trust. Against the real corpus, at least one finding must be
     one a record would close. */
  const routed = RESULT.aside.filter((a) => a.route);
  assert.ok(routed.length, 'no finding was routed to another agent, so the boundary was never exercised');
  for (const a of routed) assert.ok(NOT_OURS[a.route], `${a.subject} was routed to "${a.route}", which is not an agent this boundary knows`);
});

test('a finding no record in the corpus leans on is a design opinion, and is set aside as one', () => {
  const d = demandOf({ subject: 'x', closes_by: 'shape', demand: [] });
  assert.equal(d.standing, false);
  assert.match(d.why, /design opinion/);
});

test('the demand floor is per lens, and the count describes the whole demand', () => {
  /* The itemised demand is a bounded preview; demand_total is the
     whole of it. A floor applied to the preview would set aside a
     finding for being long. */
  assert.equal(demandOf({ closes_by: 'shape', demand: [1], demand_total: 9, demand_floor: 2 }).standing, true);
  assert.equal(demandOf({ closes_by: 'shape', demand: [1, 2, 3], demand_total: 1, demand_floor: 2 }).standing, false);
});

test('every finding either became a proposal or was set aside with a reason', () => {
  /* The SESSION 11 rule: a finding that vanished is a finding
     nobody can check. */
  const accounted = RESULT.reported.length + RESULT.aside.length;
  const found = RESULT.by_lens.reduce((n, l) => n + l.reported + l.set_aside, 0);
  assert.equal(accounted, found, 'a finding is unaccounted for between what was reported and what was set aside');
  for (const a of RESULT.aside) {
    assert.ok(a.why && a.why.length > 40, `${a.subject} was set aside with no usable reason`);
  }
  assert.equal(RESULT.proposals.length, RESULT.reported.length, 'a reported finding did not become a proposal, and no refusal was recorded');
});

/* ============================================================
   It knows nothing about EU law
   ============================================================ */

test('every proposal stands on dataset_record evidence, and none on a retrieved document', () => {
  for (const p of RESULT.proposals) {
    assert.ok(p.evidence.length, `${p.proposal_id} stands on nothing`);
    for (const e of p.evidence) {
      assert.ok(ALLOWED_EVIDENCE_KINDS.has(e.kind), `${p.proposal_id} cites a ${e.kind}`);
      assert.notEqual(e.kind, 'retrieved_document', `${p.proposal_id} claims a document was read, and no agent in this repository has retrieved one`);
      assert.equal(e.url, null, `${p.proposal_id} cites a URL, which would be a source and not a record in this repository`);
    }
  }
});

test('the evidence check refuses a retrieved document rather than trusting the lens', () => {
  const problems = evidenceProblems([{ evidence_id: 'ev-1', kind: 'retrieved_document' }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /has ever retrieved/);
});

test('every evidence locator names a real file in this repository', () => {
  const paths = new Set([...MODEL.containers.map((c) => c.dataset), ...MODEL.pages.map((p) => p.page), ...MODEL.vocabularies.flatMap((v) => (v.copies ?? []).map((c) => c.module))]);
  for (const p of RESULT.proposals) {
    for (const e of p.evidence) {
      if (e.kind !== 'dataset_record') continue;
      const named = String(e.locator).split(' ')[0];
      assert.ok([...paths].some((x) => named.startsWith(x) || x.startsWith(named)) || named.startsWith('data/') || named.startsWith('js/') || named.startsWith('agent/'),
        `${p.proposal_id} cites "${named}", which is not a file this model read`);
    }
  }
});

test('no proposal claims a fact about EU law — every epistemic fact is about this repository', () => {
  for (const p of RESULT.proposals) {
    for (const f of p.epistemic.fact) {
      assert.match(f.statement, /record\(s\)|data\/|js\/|\.html|this repository|the files/,
        `${p.proposal_id} states "${f.statement}" as a fact, and it is not a statement about this repository`);
    }
    assert.ok(p.epistemic.unresolved.length, `${p.proposal_id} carries no open question, and this agent has established nothing about what the replacement shape should be`);
  }
});

/* ============================================================
   Nothing is merged
   ============================================================ */

test('every proposal is behind a pending approval, and nothing grants its own', () => {
  assert.equal(RESULT.approvals.length, RESULT.proposals.length, 'a proposal has no approval request');
  for (const a of RESULT.approvals) {
    assert.equal(a.state, 'requested', `${a.approval_id} is not pending: nothing here may grant its own approval`);
    assert.equal(a.decision, null, `${a.approval_id} carries a decision`);
    assert.equal(a.tier, 'red');
  }
  const proposalIds = new Set(RESULT.proposals.map((p) => p.proposal_id));
  for (const a of RESULT.approvals) {
    for (const id of a.proposal_ids) assert.ok(proposalIds.has(id), `${a.approval_id} approves ${id}, which this run did not produce`);
  }
});

test('no record this run produced carries a merge or apply field', () => {
  const forbidden = ['auto_merge', 'apply_automatically', 'merge_on_approval', 'merged', 'applied', 'approved'];
  for (const r of RUN_STORE.written) {
    for (const f of forbidden) assert.ok(!(f in r), `${r.contract} carries "${f}"`);
  }
});

test('the run says on its own trace that nothing was merged, and that no schema changed', () => {
  const obs = RUN_SINK.records.filter((x) => x.type === 'observation' && String(x.summary).startsWith('NOTHING MERGED'));
  assert.equal(obs.length, 1);
  assert.equal(obs[0].data.applied, 0);
  assert.equal(obs[0].data.merged, 0);
  assert.equal(obs[0].data.schemas_changed, 0);
  assert.equal(obs[0].data.values_proposed, 0);
  assert.equal(obs[0].data.data_dir_written, false);
});

/* ============================================================
   The eight questions
   ============================================================ */

test('there are eight lenses, one per question the brief asks, in the brief\'s order', () => {
  assert.equal(LENSES.length, 8);
  assert.deepEqual(LENSES.map((l) => l.question), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(LENS_IDS).size, 8, 'two lenses share an id');
  for (const l of LENSES) {
    assert.ok(l.asks.endsWith('?'), `${l.id} does not state its question`);
    assert.ok(typeof l.inspect === 'function');
  }
});

test('every lens ran against the real corpus and recorded what it examined', () => {
  assert.equal(RESULT.by_lens.length, 8);
  for (const l of RESULT.by_lens) {
    assert.ok(l.examined > 0, `${l.id} examined nothing, so its answer is untested rather than negative`);
  }
});

test('a lens that found nothing is a result, and the run says which questions those were', () => {
  /* The distinction this whole project keeps: "looked and found
     nothing" is not "did not look". The run must be able to say
     which is which even when — as today — every question found
     something. */
  assert.ok(Array.isArray(RESULT.questions_answered_no));
  const yes = RESULT.by_lens.filter((l) => l.reported).map((l) => l.question);
  const no = RESULT.by_lens.filter((l) => !l.reported).map((l) => l.question);
  assert.deepEqual(RESULT.questions_answered_no, no);
  assert.equal(yes.length + no.length, 8);
});

test('each of the eight answers is on the trace as an observation, not only in a total', () => {
  const answers = RUN_SINK.records.filter((x) => x.type === 'observation' && /^Q\d+ — /.test(String(x.summary)));
  assert.equal(answers.length, 8, 'a question was asked and its answer is not on the trace');
  for (const a of answers) {
    assert.ok(['yes', 'no'].includes(a.data.answer), `Q${a.data.question} recorded no answer`);
    assert.ok(a.data.examined > 0);
  }
});

/* ============================================================
   The findings themselves, against the real corpus
   ============================================================ */

test('the corpus has an object with its own date and no id, and question 1 finds it', () => {
  const q1 = RESULT.reported.filter((f) => f.question === 1);
  assert.ok(q1.length, 'question 1 found nothing against a corpus that carries enforcement[].appeal');
  const appeal = q1.find((f) => f.subject.includes('appeal'));
  assert.ok(appeal, 'enforcement[].appeal has 6 sub-fields, a taxonomy status and a lodged_date, and was not found');
  assert.equal(appeal.closes_by, 'shape');
});

test('a comparison slot is not an entity, and `dna` is not reported as one', () => {
  /* The rule that keeps question 1 from firing on every object: a
     thing that happened has a date, and a comparison slot does
     not. If this ever fails, the rule has been loosened. */
  const q1 = RESULT.reported.filter((f) => f.question === 1);
  assert.ok(!q1.some((f) => f.subject.endsWith('.dna')), 'instruments[].dna was reported as an entity type; it has nine sub-fields and no date, and it is a comparison slot');
});

test('question 3 finds the vocabulary js/dna.js holds a second copy of', () => {
  const q3 = RESULT.reported.filter((f) => f.question === 3);
  const copy = q3.find((f) => f.subject.startsWith('js/dna.js'));
  assert.ok(copy, 'js/dna.js DIMENSIONS lists all eleven dna_dimension terms and was not found');
  assert.ok(copy.invariants.includes('taxonomy_enum_authority'));
});

test('a dispatch is not a copy — js/format.js is not reported for date_precision', () => {
  /* js/format.js branches on three of the four precision terms and
     falls through on the fourth. A renderer has to handle each value
     of an enum individually whatever the vocabulary lives in; only a
     LIST that decides what is enumerated is a second home. */
  const q3 = RESULT.reported.filter((f) => f.question === 3);
  assert.ok(!q3.some((f) => f.subject.startsWith('js/format.js')), 'a dispatch was reported as a vocabulary copy');
});

test('question 5 does not report a name the same record already references', () => {
  /* The exclusion that took this lens from 32 findings to 10. A
     glossary definition naming the AI Act, on a term whose
     `instruments` array already holds `ai-act`, is not a fact forced
     into prose: the reference exists and the sentence explains it. */
  const q5 = RESULT.reported.filter((f) => f.question === 5);
  for (const f of q5) {
    for (const d of f.demand) {
      const dataset = d.dataset.replace(/^data\//, '').replace(/\.json$/, '');
      const container = MODEL.containers.find((c) => c.dataset === d.dataset && Boolean(MODEL.corpus.db[dataset]?.[c.container]?.some((r) => r.id === d.record_id)));
      if (!container) continue;
      const record = MODEL.corpus.db[dataset][container.container].find((r) => r.id === d.record_id);
      const named = String(d.saying).match(/^names ([^ ]+)/)?.[1];
      if (!named || !record) continue;
      const flat = JSON.stringify(Object.fromEntries(Object.entries(record).filter(([k]) => !PROSE_FIELDS.has(k))));
      assert.ok(!flat.includes(`"${named}"`), `${d.record_id} already references ${named} outside prose, and was still reported`);
    }
  }
});

test('question 7 finds the property stored per edge that has already diverged', () => {
  const q7 = RESULT.reported.filter((f) => f.question === 7);
  assert.equal(q7.length, 1);
  assert.ok(q7[0].subject.endsWith('.symmetric'));
  assert.equal(q7[0].risk, 'high', 'a fact whose copies have already diverged, and which a renderer reads, is not medium risk');
  assert.match(q7[0].missing_shape, /already carry both values/);
});

test('a per-record annotation is not a property of the kind', () => {
  /* `requires_verification` sits on 1 of the 17 edges and is a
     per-record provenance flag; `symmetric` sits on all 17 and is
     the shape. The count decides, and if this fails the rule has
     been loosened into reporting annotations. */
  const q7 = RESULT.reported.filter((f) => f.question === 7);
  assert.ok(!q7.some((f) => f.subject.includes('requires_verification')));
});

test('question 8 measures what the corpus can say about its own past', () => {
  const q8 = RESULT.reported.filter((f) => f.question === 8);
  assert.equal(q8.length, 1);
  assert.ok(q8[0].demand_total > 100, 'the finding does not carry how many records it is about');
  assert.equal(q8[0].risk, 'high');
});

/* ============================================================
   The model reader
   ============================================================ */

test('the containers are read from the files, not declared', () => {
  const names = MODEL.containers.map((c) => `${c.dataset}#${c.container}`);
  for (const want of ['data/instruments.json#instruments', 'data/instruments.json#relationships', 'data/timeline.json#events', 'data/claims.json#claims']) {
    assert.ok(names.includes(want), `${want} was not found`);
  }
  /* A container whose records carry no id is a list of values, and
     the model says so rather than treating it as a set of entities. */
  const graph = MODEL.containers.find((c) => c.container === 'reading_graph');
  assert.equal(graph.identified, false);
});

test('the nested census sees a field inside an object', () => {
  const instruments = MODEL.containers.find((c) => c.dataset === 'data/instruments.json' && c.container === 'instruments');
  const paths = instruments.nested.map((f) => f.path);
  assert.ok(paths.includes('dna.sanction_ceiling'), 'a nested field is invisible, and question 4 compares nested fields');
  assert.ok(!instruments.fields.map((f) => f.field).includes('sanction_ceiling'), 'the flat census should not see it — that is why the nested one exists');
});

test('an array literal is a vocabulary copy and a bare regex match is not', () => {
  const lits = arrayLiteralsOf("const A = ['one', 'two', 'three'];\nif (p === 'one') {}\nconst B = [x, 'two', 'three', 'four'];");
  assert.equal(lits.length, 1, 'an array mixing literals with expressions is not a vocabulary copy');
  assert.equal(lits[0].name, 'A');
  assert.deepEqual(lits[0].members, ['one', 'two', 'three']);
});

test('only what js/data.js is actually asked to load counts as fetched', () => {
  /* js/shell.js carries `id: 'brief'` as a NAV id. Counting it would
     have reported data/brief.json as loaded when nothing loads it,
     which is the finding this lens exists to make. */
  const fetched = fetchedDatasets(MODEL);
  assert.ok(fetched.has('instruments'));
  assert.ok(!fetched.has('brief'), 'data/brief.json is named by js/shell.js as a nav id and was counted as a fetch');
});

test('the comparison vocabulary and the comparison data are compared, and disagree', () => {
  const c = keyedVocabularyUse(MODEL.corpus.db, { dimension: 'dna_dimension', container: 'instruments.instruments', field: 'dna' });
  assert.ok(c.declared_unused.length, 'the taxonomy declares a dna dimension nothing stores, and the check did not see it');
  assert.ok(c.used_undeclared.length, 'a dna key is stored that the taxonomy does not declare, and the check did not see it');
});

test('the pages are read as markup and never as prose', () => {
  const index = MODEL.pages.find((p) => p.page === 'index.html');
  assert.ok(index.inline_content_bytes > 0, 'the inlined content blob was not measured');
  assert.ok(index.modules.length, 'the page\'s modules were not read');
  /* What the blob SAYS is never read. The model carries its size and
     nothing of its content. */
  assert.equal(typeof index.inline_content_bytes, 'number');
  assert.ok(!('inline_content' in index), 'the model carried the brief\'s prose, which is the author\'s argument and not this agent\'s to read');
});

/* ============================================================
   Determinism, identity and the record shape
   ============================================================ */

test('two runs over an unchanged model produce the same proposal ids', async () => {
  const second = await architect().it.run();
  assert.deepEqual(
    second.proposals.map((p) => p.proposal_id).sort(),
    RESULT.proposals.map((p) => p.proposal_id).sort(),
  );
  assert.deepEqual(
    second.approvals.map((a) => a.approval_id).sort(),
    RESULT.approvals.map((a) => a.approval_id).sort(),
  );
});

test('every record this run produced satisfies its contract', () => {
  for (const r of RUN_STORE.written) {
    const errs = validate(r, { allowSimulated: false });
    assert.deepEqual(errs, [], `${r.contract} ${r.proposal_id ?? r.approval_id ?? ''} is invalid: ${errs.join('; ')}`);
  }
  assert.ok(RUN_STORE.written.length >= RESULT.proposals.length + RESULT.approvals.length);
});

test('the itemised evidence is bounded and the count still describes the whole demand', () => {
  const heavy = RESULT.reported.filter((f) => f.demand_count > MAX_EVIDENCE);
  assert.ok(heavy.length, 'no finding is heavy enough to test the bound');
  for (const f of heavy) {
    const p = RESULT.proposals.find((x) => x.proposal_id === f.proposal_id);
    assert.ok(p.evidence.length <= MAX_EVIDENCE, `${p.proposal_id} itemised ${p.evidence.length} evidence entries`);
    assert.match(p.epistemic.fact[0].statement, new RegExp(`^${f.demand_count} record`), `${p.proposal_id}'s count describes the preview rather than the whole demand`);
  }
});

test('confidence is what the finding stands on, and is never 1', () => {
  for (const p of RESULT.proposals) {
    assert.ok(p.confidence > 0 && p.confidence < 1, `${p.proposal_id} has confidence ${p.confidence}`);
  }
  assert.ok(confidenceFor({ demand_total: 40, demand: [] }) > confidenceFor({ demand_total: 2, demand: [] }));
});

test('a migration names the order it would have to run in, or says there is none', () => {
  for (const p of RESULT.proposals) {
    if (p.migration === null) {
      assert.ok(!p.modules_affected.some((m) => m.startsWith('data/')), `${p.proposal_id} touches data/ and states no migration order`);
      continue;
    }
    assert.match(p.migration, /1 ·/, `${p.proposal_id}'s migration does not state an order, and the intermediate state is where this breaks`);
  }
});

test('the dependency impact says "nothing new" rather than leaving it to be assumed', () => {
  for (const p of RESULT.proposals) {
    assert.match(p.dependency_impact, /No package, no build step and no origin is added/, `${p.proposal_id} does not state its dependency impact`);
  }
});

/* ============================================================
   Observability
   ============================================================ */

test('the read model derives the run from the trace, and finds no gap in it', () => {
  const root = buildTree(RUN_SINK.records).roots[0];
  const view = architectureState(root, 'trace-under-test');
  assert.ok(view, 'the architecture view was not derived from a real run\'s trace');
  assert.deepEqual(view.gaps, [], `the view reports gaps in the run: ${view.gaps.join('; ')}`);
  assert.equal(view.questions, 8);
  assert.equal(view.proposed, RESULT.proposals.length);
  assert.equal(view.reported, RESULT.reported.length);
  assert.equal(view.set_aside, RESULT.aside.length);
  assert.equal(view.pending_approvals, RESULT.approvals.length);
  assert.equal(view.merged, 0);
  assert.equal(view.schemas_changed, 0);
  assert.equal(view.values_proposed, 0);
});

test('the view carries the questions answered NO, not only the ones answered yes', () => {
  const root = buildTree(RUN_SINK.records).roots[0];
  const view = architectureState(root, 'trace-under-test');
  assert.equal(view.answered_yes.length + view.answered_no.length, 8);
  for (const l of view.lenses) assert.ok(['yes', 'no'].includes(l.answer), `${l.lens} carries no answer in the view`);
});

test('a run that set findings aside and recorded no reasons is reported as a gap in the view', () => {
  const root = buildTree(RUN_SINK.records).roots[0];
  /* Remove the NOT REPORTED observations and confirm the view
     notices. A check that only ever passes proves nothing. */
  const stripped = RUN_SINK.records.filter((r) => !(r.type === 'observation' && String(r.summary).startsWith('NOT REPORTED')));
  const view = architectureState(buildTree(stripped).roots[0], 'trace-under-test');
  assert.ok(view.gaps.some((g) => /set .* aside and recorded no reasons/.test(g)),
    'the view accepted a run that dropped findings without saying why');
  assert.deepEqual(architectureState(root, 'x').gaps, [], 'the unstripped run should have no gaps');
});

test('a run whose proposals outnumber its approvals is reported as a gap', () => {
  const stripped = RUN_SINK.records.filter((r) => !(r.type === 'artifact' && r.artifact_type === 'contract:ApprovalRequest'));
  const view = architectureState(buildTree(stripped).roots[0], 'trace-under-test');
  assert.ok(view.gaps.some((g) => /approval request/.test(g)));
});

test('the ordering is a decision on the trace, with what it did not choose', () => {
  const root = buildTree(RUN_SINK.records).roots[0];
  const view = architectureState(root, 'trace-under-test');
  assert.ok(view.ordering, 'the run ranked its findings and did not record why');
  assert.ok(view.ordering.alternatives.length >= 3, 'an unrecorded alternative is how a decision becomes indistinguishable from an accident');
});

test('a finding this agent cannot act on is handed to the agent that can', () => {
  const handoffs = RUN_SINK.records.filter((r) => r.type === 'handoff');
  const routed = RESULT.aside.filter((a) => a.route);
  assert.equal(handoffs.length, routed.length, 'a routed finding was not handed on, so it is a sentence in a log rather than a queue entry');
  for (const h of handoffs) assert.ok(h.reason && h.reason.length > 40, `${h.handoff_id} was handed on with no usable reason`);
});

test('a knowledge gap from an upstream run is recorded, and never creates a finding', () => {
  /* A missing record is not a missing shape. Chaining a depth run in
     may annotate a proposal and may not produce one. */
  const gaps = [{
    contract: 'KnowledgeGap', gap_id: 'kg-test-0001',
    affected_entities: [{ kind: 'instrument', id: 'ai-act', path: 'data/instruments.json', field: null, note: 'x' }],
  }];
  const withGaps = architect({ gaps });
  return withGaps.it.run().then((r) => {
    assert.equal(r.proposals.length, RESULT.proposals.length, 'a knowledge gap changed how many findings there are');
    assert.deepEqual(r.reported.map((f) => f.subject).sort(), RESULT.reported.map((f) => f.subject).sort());
    const annotated = r.proposals.filter((p) => p.epistemic.inference.some((i) => String(i.statement).includes('kg-test-0001')));
    assert.ok(annotated.length, 'the gap touched data/instruments.json and no proposal recorded it');
  });
});

/* ============================================================
   The date, and the refusals it makes possible
   ============================================================ */

test('a run without an as-of date is refused', () => {
  const { tracer, store } = harness();
  assert.throws(() => new KnowledgeArchitect({ tracer, store, model: MODEL }), /asOf/);
  assert.throws(() => new KnowledgeArchitect({ tracer, store, model: MODEL, asOf: 'soon' }), /asOf/);
});

test('every proposal carries the date the model was read as true at', () => {
  assert.equal(RESULT.as_of, AS_OF);
  const root = buildTree(RUN_SINK.records).roots[0];
  assert.equal(architectureState(root, 'x').as_of, AS_OF);
});
