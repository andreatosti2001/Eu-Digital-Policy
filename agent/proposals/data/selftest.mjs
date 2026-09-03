/* ============================================================
   agent/proposals/data/selftest.mjs — Agent 5's suite

   Run:  node --test agent/proposals/data/selftest.mjs

   What it holds this agent to, in the order the risks matter:

     · IT NEVER WRITES AND IT NEVER MERGES. No write call in any
       module here; data/ is byte-identical before and after a full
       run against the real corpus; every approval is in the
       "requested" state; and no record carries a field that would
       let a proposal record its own landing.
     · IT FABRICATES NOTHING. The one sentence this agent can put in
       front of a reader is COMPOSED by a pure function, and every
       note a run produced is recomputed here and asserted identical.
       No proposal carries a value the corpus does not already hold.
     · A TAXONOMY TERM IS PROPOSED, NEVER CREATED. The search runs,
       the term is human_only, the dimension exists, and the search
       can come back empty-handed — a search that could never fail is
       not a search.
     · THE ROUTING IS COMPLETE AND ONE-WAY. Every gap kind has a
       route, every route is in the vocabulary, and neither override
       can promote a gap into a proposal its kind did not allow.
     · THE REFUSALS ARE VISIBLE. Every gap that produced nothing is
       counted, reasoned, on the trace and in the read model.

   The corpus is the real one and the gaps are a real depth run's,
   deliberately: a fixture would let a route pass while being wrong
   about the records it exists to read.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../../observability/tracer.mjs';
import { MemorySink } from '../../observability/sink.mjs';
import { deterministicIds, deterministicClock } from '../../observability/ids.mjs';
import { MemoryRecordStore } from '../../scout/store.mjs';
import { loadCorpus, hashDataDir } from '../../integrate/canonical.mjs';
import { validate } from '../../schemas/validate.mjs';
import { getContract } from '../../schemas/registry.mjs';
import {
  GAP_ROUTES, PROPOSING_ROUTES, DEPTH_GAP_KINDS, DATA_OPERATION_KINDS,
  AUTONOMY_RANK, AUTONOMY_TIER, REQUIRED_VALIDATORS, taxonomy,
} from '../../schemas/types.mjs';
import { buildTree, proposalState } from '../../observability/query.mjs';
import { DepthAgent } from '../../depth/depth.mjs';

import { ROUTE_FOR_KIND, routeFor, censusOf } from './route.mjs';
import { targetOf, noteFor, appendedTo, dispositionFor, canAnnotate, containerUses, leaningIds, NOTE_FIELD } from './annotate.mjs';
import { termNeededFor, searchDimension, scoreTerm, DIMENSION_FOR_KIND } from './taxonomy.mjs';
import { ProposalRouter, PROPOSER_AGENT, VERIFIER_GAP_KIND, MAX_CARRIED_EVIDENCE } from './proposals.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const AS_OF = '2026-09-02';

const corpus = loadCorpus();

function newTracer() {
  return new Tracer({
    sink: new MemorySink(),
    ids: deterministicIds(),
    clock: deterministicClock('2026-09-02T09:00:00.000Z'),
  });
}

/** One depth run, one routing run, shared. Both are deterministic
 *  over an unchanged corpus and a test below asserts exactly that. */
async function routeOnce() {
  const tracer = newTracer();
  const store = new MemoryRecordStore({ allowSimulated: false });
  const gaps = (await new DepthAgent({ tracer, store, corpus, asOf: AS_OF }).run()).gaps;
  const router = new ProposalRouter({ tracer, store, corpus, gaps, asOf: AS_OF });
  const result = await router.run();
  return { tracer, store, gaps, result };
}

const before = hashDataDir();
const { tracer, store, gaps, result } = await routeOnce();
const after = hashDataDir();

/* ============================================================
   it never writes, and it never merges
   ============================================================ */

test('a full run against the real corpus leaves data/ byte-identical', () => {
  assert.deepEqual(after, before, 'data/ changed during a routing run. This agent has no code path that writes there.');
});

test('no module in agent/proposals/data/ contains a write call', () => {
  const forbidden = [
    'writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync',
    'mkdirSync', 'renameSync', 'copyFileSync', 'truncateSync', 'writeFile(',
  ];
  const files = readdirSync(HERE).filter((f) => f.endsWith('.mjs') && f !== 'selftest.mjs');
  assert.ok(files.length >= 5, 'expected the agent\'s modules to be here');
  for (const f of files) {
    const src = readFileSync(join(HERE, f), 'utf8');
    for (const call of forbidden) {
      assert.ok(!src.includes(call), `${f} contains "${call}" — nothing in this directory writes anything`);
    }
  }
});

test('every approval is pending, and none was decided by the agent that asked', () => {
  assert.ok(result.approvals.length > 0, 'expected at least one approval request');
  for (const a of result.approvals) {
    assert.equal(a.state, 'requested', `${a.approval_id} is not pending: nothing here may grant its own approval`);
    assert.equal(a.decision, null, `${a.approval_id} carries a decision`);
  }
});

test('an approval exists for every proposal, and names it', () => {
  const asked = new Set(result.approvals.flatMap((a) => a.proposal_ids));
  for (const p of result.proposals) {
    assert.ok(asked.has(p.proposal_id), `${p.proposal_id} has no ApprovalRequest: a proposal nobody has to look at is an unapproved change that looks approved`);
  }
});

test('no proposal carries a field that would record its own landing', () => {
  const forbidden = ['auto_merge', 'apply_automatically', 'merge_on_approval', 'applied', 'merged', 'approved'];
  for (const p of result.proposals) {
    for (const f of forbidden) assert.ok(!(f in p), `${p.proposal_id} carries "${f}"`);
  }
});

test('the run reports that nothing was merged and nothing applied', () => {
  const obs = tracer.sink.records.filter((r) => r.type === 'observation');
  const merged = obs.find((o) => String(o.summary).startsWith('NOTHING MERGED'));
  assert.ok(merged, 'the run does not state on its trace that nothing was merged');
  assert.equal(merged.data.applied, 0);
  assert.equal(merged.data.data_dir_written, false);
});

/* ============================================================
   every record satisfies its contract
   ============================================================ */

test('every record the run produced validates', () => {
  for (const r of [...result.proposals, ...result.approvals, ...result.data_gaps]) {
    assert.deepEqual(validate(r), [], `${r.contract} ${r[getContract(r.contract).id_field]} does not satisfy its contract`);
  }
});

test('every proposal names all four validators, with a baseline', () => {
  for (const p of result.proposals) {
    const cmds = p.validation_requirements.map((v) => v.command).join(' ');
    for (const v of REQUIRED_VALIDATORS) assert.ok(cmds.includes(v), `${p.proposal_id} omits ${v}`);
    for (const v of p.validation_requirements) assert.ok(v.expected && v.why, `${p.proposal_id}: a validation requirement with no expectation cannot be held to`);
  }
});

test('every proposal is reversible, and says how', () => {
  for (const p of result.proposals) {
    assert.notEqual(p.rollback_plan.method, 'not_reversible', `${p.proposal_id} is irreversible`);
    assert.ok(p.rollback_plan.steps.length >= 1);
  }
});

test('every proposal touching a legal record is at least review_required', () => {
  for (const p of result.proposals) {
    assert.ok(AUTONOMY_RANK[p.autonomy_class] >= AUTONOMY_RANK.review_required, `${p.proposal_id} is ${p.autonomy_class}`);
  }
});

test('no proposal claims a document was retrieved and read', () => {
  for (const p of result.proposals) {
    assert.equal(p.retrieved_and_read, false, `${p.proposal_id} claims a document was read, and no agent here has retrieved one`);
    assert.ok(!p.evidence.some((e) => e.kind === 'retrieved_document'), `${p.proposal_id} cites a retrieved document`);
  }
});

/* ============================================================
   the routing table is complete, and one-way
   ============================================================ */

test('every depth gap kind has a route, and every route is in the vocabulary', () => {
  for (const k of DEPTH_GAP_KINDS) {
    assert.ok(ROUTE_FOR_KIND[k], `no route for "${k}"`);
    assert.ok(GAP_ROUTES.includes(ROUTE_FOR_KIND[k][0]), `"${k}" routes outside the vocabulary`);
    assert.ok(ROUTE_FOR_KIND[k][1].length > 40, `"${k}"'s route carries no reason worth reading`);
  }
  for (const k of Object.keys(ROUTE_FOR_KIND)) assert.ok(DEPTH_GAP_KINDS.includes(k), `route row for unknown kind "${k}"`);
});

test('every gap the run was handed got exactly one route', () => {
  assert.equal(result.routed.length, gaps.length);
  for (const r of result.routed) assert.ok(GAP_ROUTES.includes(r.route));
  assert.equal(Object.values(result.by_route).reduce((a, b) => a + b, 0), gaps.length);
});

test('a shape that does not exist can never become a data proposal', () => {
  for (const r of result.routed) {
    if (r.gap.recommended_data_location.shape_exists === false) {
      assert.notEqual(r.route, 'data_proposal', `${r.gap.gap_id} routes to a proposal into a home that does not exist`);
    }
  }
});

test('both overrides are one-way — neither promotes a gap into a proposal', () => {
  for (const r of result.routed) {
    if (!r.overrides.length) continue;
    const base = ROUTE_FOR_KIND[r.gap.gap_kind][0];
    assert.ok(!(PROPOSING_ROUTES.includes(r.route) && !PROPOSING_ROUTES.includes(base)),
      `${r.gap.gap_id} was promoted from "${base}" to "${r.route}" by an override`);
  }
});

test('a gap routed to a proposal names a record the corpus actually holds', () => {
  for (const r of result.routed.filter((x) => x.route === 'data_proposal')) {
    assert.equal(r.target.annotatable, true, `${r.gap.gap_id} routes to a proposal with nothing to annotate`);
    assert.ok(r.target.record, `${r.gap.gap_id}'s target record was not found in ${r.target.dataset}`);
  }
});

test('an interpretive gap authors nothing, and is handed to Editorial', () => {
  const editorial = result.routed.filter((x) => x.route === 'editorial');
  assert.ok(editorial.length > 0, 'expected the real corpus to produce interpretive gaps');
  for (const r of editorial) {
    assert.equal(r.authored, undefined, `${r.gap.gap_id} authored a record on the editorial route: an EditorialProposal\'s operations would have to carry the sentence, and the sentence is the argument`);
    assert.ok(r.refused, `${r.gap.gap_id} was routed to Editorial with no stated reason`);
  }
  const to = tracer.sink.records.filter((x) => x.type === 'handoff' && x.to_agent === 'editorial');
  assert.equal(to.length, editorial.length, 'every interpretive gap is handed on, one handoff each');
});

test('a gap whose evidence is inadequate becomes a DataGap for the Verifier', () => {
  const verifier = result.routed.filter((x) => x.route === 'verifier');
  assert.ok(verifier.length > 0);
  assert.equal(result.data_gaps.length, verifier.length);
  const to = tracer.sink.records.filter((x) => x.type === 'handoff' && x.to_agent === 'legal-verifier');
  assert.equal(to.length, verifier.length);
});

test('the DataGap kind follows a stated table, with no fall-through', () => {
  for (const [, [kind, why]] of Object.entries(VERIFIER_GAP_KIND)) {
    assert.ok(kind && why.length > 40, 'a row in VERIFIER_GAP_KIND with no reason');
  }
  for (const dg of result.data_gaps) {
    assert.ok(Object.values(VERIFIER_GAP_KIND).some(([k]) => k === dg.gap_kind), `${dg.gap_id} carries a kind no table row produces`);
  }
});

test('a DataGap with no lead says so rather than inventing one', () => {
  const empty = result.data_gaps.filter((g) => g.candidate_leads.length === 0);
  assert.ok(empty.length > 0, 'on this corpus some gaps genuinely have nowhere to look; a run in which every one had a lead has probably invented one');
  for (const g of empty) {
    assert.equal(g.gap_kind, 'missing_source');
    assert.ok(/nowhere to look|nothing this repository can name/i.test(g.closes_with));
  }
});

test('uncertainty survives the handoff at full strength', () => {
  const byId = new Map(gaps.map((g) => [g.gap_id, g]));
  for (const r of result.routed.filter((x) => x.route === 'verifier')) {
    const dg = result.data_gaps.find((g) => (r.authored ?? []).includes(g.gap_id));
    const source = byId.get(r.gap.gap_id);
    assert.ok(dg.epistemic.unresolved.length > source.epistemic.unresolved.length,
      `${dg.gap_id} carries fewer open questions than the gap it came from — certainty is never created by transfer (docs/AGENT-ROLES.md H2)`);
  }
});

/* ============================================================
   the note is composed, never written
   ============================================================ */

test('every note a run emitted is reproduced exactly by the pure composer', () => {
  const annotated = result.routed.filter((x) => x.route === 'data_proposal');
  assert.ok(annotated.length > 0);
  for (const r of annotated) {
    const p = result.proposals.find((x) => (r.authored ?? []).includes(x.proposal_id));
    const expected = appendedTo(r.target.current, noteFor(r.gap, r.target));
    assert.equal(p.proposed_change.operations[0].proposed, expected,
      `${p.proposal_id}'s note is not the one annotate.mjs composes — a sentence an agent wrote freely has reached a proposal`);
  }
});

test('an existing note is kept in full and only added to', () => {
  for (const p of result.proposals.filter((x) => x.operation_kind === 'annotate')) {
    const op = p.proposed_change.operations[0];
    if (op.current === null) continue;
    assert.ok(op.proposed.startsWith(op.current), `${p.proposal_id} rewrites an existing verification note — removing or replacing one is red tier`);
    assert.ok(op.proposed.length > op.current.length);
  }
});

test('the disposition matches what the field actually holds', () => {
  for (const p of result.proposals.filter((x) => x.operation_kind === 'annotate')) {
    const d = p.provenance_disposition[0];
    assert.equal(d.field, NOTE_FIELD);
    assert.equal(d.disposition, dispositionFor(d.current));
    if (d.disposition === 'set_first_time') assert.equal(d.current, null, 'set_first_time on a field that already carries something');
  }
});

test('no annotate proposal touches any field but the note', () => {
  for (const p of result.proposals.filter((x) => x.operation_kind === 'annotate')) {
    assert.equal(p.proposed_change.operations.length, 1);
    assert.ok(p.proposed_change.operations[0].target.endsWith(`.${NOTE_FIELD}`), `${p.proposal_id} targets ${p.proposed_change.operations[0].target}`);
    assert.equal(p.substantive, false);
    assert.equal(p.preserves_record_id, true);
  }
});

test('every id a note names is a record the corpus holds', () => {
  const ids = new Set(corpus.allIds);
  for (const r of result.routed.filter((x) => x.route === 'data_proposal')) {
    for (const id of leaningIds(r.gap)) {
      assert.ok(ids.has(id), `a note would name "${id}", and no record in data/ carries that id`);
    }
  }
});

test('a kind with no composer is never annotatable', () => {
  for (const k of DEPTH_GAP_KINDS) {
    if (canAnnotate(k)) continue;
    const t = targetOf({ gap_kind: k, recommended_data_location: { dataset: 'data/claims.json', shape_exists: true }, affected_entities: [] }, corpus);
    assert.equal(t.annotatable, false, `"${k}" has no note composer and was reported annotatable`);
  }
});

test('the note field is only offered where the container already uses it', () => {
  assert.equal(containerUses([{ verification_note: 'x' }]), true);
  assert.equal(containerUses([{ id: 'a' }, { id: 'b' }]), false);
  assert.equal(containerUses([]), false);
  /* An instrument carries no verification_note and a relationship in
     the same file does. A table of datasets would get this wrong; the
     lookup does not. */
  assert.equal(containerUses(corpus.db.instruments.instruments), false);
});

/* ============================================================
   a taxonomy term is proposed, never created
   ============================================================ */

test('the taxonomy proposal is human_only and targets a dimension the file has', () => {
  const tax = result.proposals.filter((p) => p.operation_kind === 'create_taxonomy_term');
  assert.ok(tax.length > 0, 'expected the real corpus to need a term it does not have');
  const dims = Object.keys(taxonomy()).filter((k) => Array.isArray(taxonomy()[k]));
  for (const p of tax) {
    assert.equal(p.autonomy_class, 'human_only');
    assert.equal(p.dataset, 'data/taxonomy.json');
    assert.equal(p.record_kind, 'taxonomy_term');
    assert.equal(p.record_id, null);
    assert.ok(dims.some((d) => p.proposed_change.operations[0].target.includes(d)));
  }
});

test('the taxonomy proposal searched the dimension first, and says why none fits', () => {
  for (const p of result.proposals.filter((x) => x.operation_kind === 'create_taxonomy_term')) {
    assert.equal(p.existing_search.performed, true);
    assert.ok(p.existing_search.candidates_considered >= 10);
    assert.ok(p.existing_search.best_candidate_id, 'no closest term was named');
    assert.ok(p.existing_search.why_not_that_one.length > 80, 'a score below a threshold is a number, not a reason');
  }
});

test('the taxonomy proposal defines nothing', () => {
  for (const p of result.proposals.filter((x) => x.operation_kind === 'create_taxonomy_term')) {
    const term = JSON.parse(p.proposed_change.operations[0].proposed);
    assert.equal(term.definition_ref, null, 'a definition is the site\'s own words about a concept, and is Editorial\'s');
    assert.equal(term.note, null);
    assert.ok(term.id && term.label);
  }
});

test('the search can come back empty-handed — a search that never fails is not a search', () => {
  /* Asked of a concept the dimension DOES carry. If this returned
     "necessary", the decisive test would be doing nothing. */
  const r = searchDimension('relationship_kind', { wanted: 'one act repeals another act', decisive: ['repeals'] });
  assert.ok(r.found, 'the decisive test failed to find a term that is plainly there');
  assert.equal(r.found.id, 'rel-kind:repeals');
});

test('a gap kind with no stated dimension is never given one', () => {
  for (const k of DEPTH_GAP_KINDS) {
    if (DIMENSION_FOR_KIND[k]) continue;
    assert.equal(termNeededFor({ gap_kind: k }).necessary, false, `"${k}" was given a taxonomy dimension nobody stated`);
  }
});

test('the overlap score is bounded and stable', () => {
  /* 'overlap' hits; 'overlaps' is a different token and does not.
     The matcher is deliberately literal — a stemmer would make the
     score look cleverer than the evidence behind it. */
  assert.equal(scoreTerm({ id: 'rel-kind:overlap', label: 'Overlaps with' }, 'overlap between two acts'), 0.25);
  assert.equal(scoreTerm({ id: 'x', label: '', note: '' }, ''), 0);
  for (const t of taxonomy().relationship_kind) {
    const s = scoreTerm(t, 'two source records that are the same published document');
    assert.ok(s >= 0 && s <= 1, `${t.id} scored ${s}`);
  }
});

/* ============================================================
   the refusals are visible
   ============================================================ */

test('every gap that produced nothing is counted with a reason', () => {
  const authored = result.routed.filter((r) => r.authored).length;
  assert.equal(authored + result.refusals.length, gaps.length,
    'a gap neither authored a record nor was recorded as a refusal — it vanished');
  for (const x of result.refusals) assert.ok(x.why && x.why.length > 40, `${x.gap_id} was refused with no reason worth reading`);
});

test('every route appears in the census, including the ones nothing took', () => {
  for (const r of GAP_ROUTES) assert.ok(r in result.by_route, `route "${r}" is missing from the census`);
  assert.deepEqual(result.routes_with_no_gap, GAP_ROUTES.filter((r) => result.by_route[r] === 0));
  assert.deepEqual(censusOf(result.routed), result.by_route);
});

test('the counts add up across routes', () => {
  const d = result.by_route_detail;
  assert.equal(d.reduce((n, x) => n + x.gaps, 0), gaps.length);
  assert.equal(d.reduce((n, x) => n + x.proposals, 0), result.proposals.length);
  assert.equal(d.reduce((n, x) => n + x.data_gaps, 0), result.data_gaps.length);
  assert.equal(d.reduce((n, x) => n + x.refused, 0), result.refusals.length);
});

/* ============================================================
   the analysis is instrumented
   ============================================================ */

test('the read model derives the routing from the trace alone', () => {
  const { roots } = buildTree(tracer.sink.records.filter((r) => r.trace_id === result.trace_id));
  const view = proposalState(roots[0], 'trace');
  assert.ok(view, 'proposalState found no routing on a trace that ran one');
  assert.equal(view.routed, gaps.length);
  assert.equal(view.proposed, result.proposals.length);
  assert.equal(view.evidence_questions, result.data_gaps.length);
  assert.equal(view.refused, result.refusals.length);
  assert.equal(view.pending_approvals, result.approvals.length);
  assert.equal(view.merged, 0);
  assert.equal(view.applied, 0);
  assert.deepEqual(view.gaps, [], `the view reports gaps in its own instrumentation: ${view.gaps.join('; ')}`);
});

test('every refusal reaches the read model with its reason', () => {
  const { roots } = buildTree(tracer.sink.records.filter((r) => r.trace_id === result.trace_id));
  const view = proposalState(roots[0], 'trace');
  const named = view.routes.flatMap((r) => r.refused_detail);
  /* The editorial route refuses through a handoff rather than an
     observation — the gap itself is the record handed on — so its
     refusals are counted there and named on the handoff. */
  const editorial = view.routes.find((r) => r.route === 'editorial');
  assert.ok(editorial.handoffs.length === editorial.refused);
  const others = view.routes.filter((r) => r.route !== 'editorial').reduce((n, r) => n + r.refused, 0);
  assert.equal(named.length, others);
});

test('the routing decision is on the trace, with what it refused to do', () => {
  const { roots } = buildTree(tracer.sink.records.filter((r) => r.trace_id === result.trace_id));
  const view = proposalState(roots[0], 'trace');
  assert.ok(view.routing, 'no routing decision on the trace');
  assert.ok(view.routing.alternatives.length >= 3, 'a decision with no alternatives is indistinguishable from an accident');
  assert.ok(view.routing.alternatives.some((a) => /blank|fabricat/i.test(a)), 'the alternative this agent most needs to be seen refusing is not named');
});

test('every proposal, approval and data gap is an artifact pointer on the trace', () => {
  const art = new Set(tracer.sink.records.filter((r) => r.type === 'artifact').map((r) => r.artifact_id));
  for (const p of result.proposals) assert.ok(art.has(p.proposal_id), `${p.proposal_id} is not on the trace`);
  for (const a of result.approvals) assert.ok(art.has(a.approval_id));
  for (const g of result.data_gaps) assert.ok(art.has(g.gap_id));
});

/* ============================================================
   the agent refuses what it should
   ============================================================ */

test('it refuses a run with no as-of date', () => {
  assert.throws(() => new ProposalRouter({ tracer: newTracer(), store: new MemoryRecordStore(), gaps: [], corpus }),
    /asOf/, 'a proposal quotes a record verbatim; only an as-of date says which version');
});

test('it refuses records of another contract', () => {
  assert.throws(() => new ProposalRouter({
    tracer: newTracer(), store: new MemoryRecordStore(), corpus, asOf: AS_OF,
    gaps: [{ contract: 'DataGap', gap_id: 'dg-1' }],
  }), /KnowledgeGap/, 'a DataGap is about evidence and a KnowledgeGap about representation');
});

test('the same corpus and the same gaps produce the same routing twice', async () => {
  const second = await routeOnce();
  assert.deepEqual(second.result.by_route, result.by_route);
  assert.deepEqual(
    second.result.proposals.map((p) => [p.proposal_id, p.operation_kind, p.record_id, p.proposed_change.operations[0].proposed]),
    result.proposals.map((p) => [p.proposal_id, p.operation_kind, p.record_id, p.proposed_change.operations[0].proposed]),
    'a report whose content moves for no reason cannot be diffed against the previous session\'s',
  );
});

test('the carried-evidence cap is exported, so changing it is a visible decision', () => {
  assert.equal(typeof MAX_CARRIED_EVIDENCE, 'number');
  for (const p of result.proposals) {
    const carried = p.evidence.filter((e) => e.evidence_id.startsWith('ev-lean-'));
    assert.ok(carried.length <= MAX_CARRIED_EVIDENCE, `${p.proposal_id} carries ${carried.length} demand entries`);
  }
});

test('the agent name and the tier map are the ones the rest of the layer uses', () => {
  assert.equal(PROPOSER_AGENT, 'proposal-router');
  for (const p of result.proposals) {
    assert.equal(p.agent, PROPOSER_AGENT);
    const a = result.approvals.find((x) => x.proposal_ids.includes(p.proposal_id));
    assert.equal(a.tier, AUTONOMY_TIER[p.autonomy_class]);
  }
});

test('create_taxonomy_term is in the operation vocabulary exactly once', () => {
  assert.equal(DATA_OPERATION_KINDS.filter((k) => k === 'create_taxonomy_term').length, 1);
});

/* --------------------------------- node identity (SESSION 13) */

test('a proposal id is derived from the gap it answers, not from a counter', async () => {
  /* This agent was built after the audit that found the counter and
     inherited the same defect. It matters here more than anywhere:
     a proposal whose id moves cannot be the thing a human decided
     about last week, and issue 15 — fourteen proposals nobody has
     decided — grows on every re-run precisely because nothing can
     match a new proposal to an old decision. A stable id is the
     first half of that; the ChangeRecord saying a human applied one
     is still the missing half. */
  const second = await routeOnce();
  assert.deepEqual(
    second.result.proposals.map((p) => p.proposal_id).sort(),
    result.proposals.map((p) => p.proposal_id).sort(),
  );
  assert.deepEqual(
    second.result.approvals.map((a) => a.approval_id).sort(),
    result.approvals.map((a) => a.approval_id).sort(),
  );
  assert.deepEqual(
    second.result.data_gaps.map((g) => g.gap_id).sort(),
    result.data_gaps.map((g) => g.gap_id).sort(),
  );
});

test('routing a subset of the gaps does not renumber the proposals it shares with the whole', async () => {
  const tracer2 = newTracer();
  const store2 = new MemoryRecordStore({ allowSimulated: false });
  const part = await new ProposalRouter({ tracer: tracer2, store: store2, corpus, gaps: gaps.slice(5), asOf: AS_OF }).run();
  const whole = new Map(result.proposals.map((p) => [`${p.operation_kind}|${p.dataset}|${p.record_id}`, p.proposal_id]));
  let compared = 0;
  for (const p of part.proposals) {
    const k = `${p.operation_kind}|${p.dataset}|${p.record_id}`;
    if (!whole.has(k)) continue;
    compared++;
    assert.equal(p.proposal_id, whole.get(k), `${k} was renumbered by routing fewer gaps`);
  }
  assert.ok(compared > 0, 'the subset shared no proposal with the whole, so this proved nothing');
});

test('every proposal, approval and data gap id in a run is distinct', () => {
  for (const [what, ids] of [
    ['proposal', result.proposals.map((p) => p.proposal_id)],
    ['approval', result.approvals.map((a) => a.approval_id)],
    ['data gap', result.data_gaps.map((g) => g.gap_id)],
  ]) {
    assert.equal(new Set(ids).size, ids.length, `two ${what} records share an id`);
  }
});
