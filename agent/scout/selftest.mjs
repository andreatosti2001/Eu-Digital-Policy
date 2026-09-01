/* ============================================================
   agent/scout/selftest.mjs

       node --test agent/scout/selftest.mjs

   node:test, so this needs nothing installed — the same constraint
   the four validators in tools/, the observability suite and the
   contract suite work under.

   What it holds down, in the order the Scout would fail:

     · it emits only the contracts a Scout is allowed to emit, and
       never a verification, a proposal or a change
     · every record it produces satisfies its contract with
       allowSimulated OFF — the Scout's records are real or they are
       not written
     · nothing it produces is marked simulated
     · a retrieval this environment refuses becomes a DataGap with
       the right kind of absence, and never a claim about the URL,
       the publisher or the law
     · a retrieval that succeeds is recorded differently, in every
       place where the difference matters
     · what it says it read, it read: facts about the corpus cite
       the corpus, and facts about a document cite the document

   The success path cannot be exercised against the live network from
   inside this environment, so it is driven with a stub fetch. That
   is a test double for the transport, not simulated evidence: the
   records it produces are checked, not stored, and nothing in
   agent/runs/ comes from here.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { MemoryContractStore } from '../schemas/store.mjs';
import { validate } from '../schemas/validate.mjs';
import { CONTRACT_NAMES } from '../schemas/registry.mjs';
import { scoutClaim, AGENT } from './scout.mjs';
import { attempt, titleFrom, explain, failed, OUTCOMES } from './retrieve.mjs';
import * as corpus from './corpus.mjs';

/* ---------------------------------------------------------- harness */

/** A run that writes nowhere: memory sink, memory store. */
function harness() {
  const sink = new MemorySink();
  const tracer = new Tracer({ service: 'scout-selftest', sink });
  const store = new MemoryContractStore();
  return { sink, tracer, store };
}

/** A fetch that never touches the network. Node's Response does not
 *  let `url` be set through the constructor, so it is defined on the
 *  instance. */
function responseWith({ status = 200, body = '', headers = {}, url }) {
  const res = new Response(body, { status, headers });
  Object.defineProperty(res, 'url', { value: url, configurable: true });
  return res;
}

const okFetch = (body, url = 'https://example.invalid/doc') => async () => responseWith({ status: 200, body, url });
const deniedFetch = async (req) => responseWith({
  status: 403,
  body: `Host not in allowlist: ${new URL(req).host}.`,
  headers: { 'x-deny-reason': 'host_not_allowed' },
  url: req,
});
const originRefusedFetch = async (req) => responseWith({ status: 403, body: 'Forbidden', url: req });
const deadFetch = async () => { throw new TypeError('fetch failed'); };

/** A claim the corpus cites at least one URL for. */
function claimWithUrl() {
  for (const id of corpus.claimIds()) {
    const c = corpus.claim(id);
    if (corpus.retrievalPlan(c).retrievable.length) return id;
  }
  throw new Error('no claim in data/claims.json cites a retrievable source');
}

/** A claim resting only on the brief's own placeholder. */
function claimWithPlaceholderOnly() {
  for (const id of corpus.claimIds()) {
    const c = corpus.claim(id);
    const p = corpus.retrievalPlan(c);
    if (p.placeholders.length && !p.retrievable.length) return id;
  }
  throw new Error('no claim in data/claims.json rests only on a placeholder');
}

/* ---------------------------------------------------------- retrieve */

test('an egress denial is never recorded as the publisher refusing us', async () => {
  const denied = await attempt('https://eur-lex.europa.eu/x', { fetchImpl: deniedFetch });
  assert.equal(denied.outcome, 'policy_denied');
  assert.match(explain(denied), /says nothing about the document/);

  const refused = await attempt('https://eur-lex.europa.eu/x', { fetchImpl: originRefusedFetch });
  assert.equal(refused.outcome, 'http_error', 'a 403 with no egress header is the origin answering, and is reported as that');

  const dead = await attempt('https://eur-lex.europa.eu/x', { fetchImpl: deadFetch });
  assert.equal(dead.outcome, 'network_error');

  for (const o of [denied, refused, dead]) {
    assert.ok(failed(o));
    assert.equal(o.body, null, 'a failed attempt never carries a document body');
    assert.ok(OUTCOMES.includes(o.outcome));
    assert.ok(Date.parse(o.attempted_at) > 0, 'every attempt is dated, or it cannot be re-checked');
  }
});

test('a title is read from the document or not at all', () => {
  assert.equal(titleFrom('<html><head><title> Regulation  (EU)  2016/679 </title>'), 'Regulation (EU) 2016/679');
  assert.equal(titleFrom('<html><head><title>A &amp; B</title>'), 'A & B');
  assert.equal(titleFrom('<html><head></head><body>no title here</body></html>'), null);
  assert.equal(titleFrom('<title></title>'), null, 'an empty title element yields nothing, never a manufactured one');
});

/* ---------------------------------------------------------- the corpus */

test('the corpus reader keeps "what the record says" apart from "what the document says"', () => {
  const c = corpus.claim(claimWithUrl());
  const plan = corpus.retrievalPlan(c);
  const src = plan.retrievable[0].source;

  /* The fields are named for what they are: the corpus's account. */
  assert.ok('recorded_title' in src && 'recorded_url' in src && 'recorded_tier' in src);
  assert.ok(!('title' in src), 'a bare `title` would read as the document\'s own');
  assert.match(src._locator, /^data\/sources\.json#/);
  assert.match(c._locator, /^data\/claims\.json#/);
});

/* ---------------------------------------------------------- the agent */

test('the Scout emits only what a Scout may emit', async () => {
  const { tracer, store } = harness();
  const result = await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: deniedFetch });

  const allowed = new Set(['SourceCandidate', 'DataGap', 'AgentObservation', 'AgentRun']);
  const emitted = new Set(result.records.map((r) => r.contract));

  for (const c of emitted) assert.ok(allowed.has(c), `the Scout emitted ${c}, which is not its to emit`);

  /* Named explicitly, because these are the ones the session brief
     forbids by name and a regression here would be quiet. */
  for (const forbidden of ['VerificationRecord', 'ChangeRecord', 'WebsiteChange', 'ClaimEvidence',
    ...CONTRACT_NAMES.filter((n) => n.endsWith('Proposal'))]) {
    assert.ok(!emitted.has(forbidden), `the Scout must not emit ${forbidden}`);
  }
  assert.ok(emitted.has('AgentRun') && emitted.has('AgentObservation'));
});

test('every record the Scout produces is real, and valid as a real record', async () => {
  const { tracer, store } = harness();
  const result = await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: deniedFetch });

  assert.ok(result.records.length > 0);
  for (const r of result.records) {
    /* allowSimulated OFF. A record that only passes as a fixture is
       not a record this agent may write. */
    assert.deepEqual(validate(r), [], `${r.contract} failed its contract:\n${validate(r).join('\n')}`);
    assert.equal(r.simulated, false, 'nothing outside fixtures.mjs may be marked simulated');
    assert.equal(r.agent, AGENT);
    assert.ok(r.trace_ref && r.trace_ref.trace_id === result.trace_id);
    for (const ev of r.evidence) assert.equal(ev.simulated, false);
  }
});

test('a blocked retrieval becomes a gap, not a finding about the law', async () => {
  const { tracer, store } = harness();
  const result = await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: deniedFetch });

  const gaps = result.records.filter((r) => r.contract === 'DataGap' && r.gap_kind === 'retrieval_blocked');
  assert.ok(gaps.length > 0, 'a refused retrieval must leave a gap behind');

  for (const g of gaps) {
    assert.equal(g.absence_kind, 'retrieval_failed');
    assert.equal(g.state, 'open');
    assert.ok(g.evidence.some((e) => e.kind === 'absent'), 'the record says in its own body that it has nothing');
    assert.ok(g.epistemic.unresolved.length > 0);
    /* The gap must not assert the document is unobtainable in
       general — only that this agent did not obtain it. */
    assert.ok(!/not publicly (available|determinable)/i.test(g.why_open));
    /* And there is nowhere to put a substitute. */
    for (const banned of ['substitute', 'best_guess', 'assumed_value', 'plausible_value', 'likely_answer', 'default_value']) {
      assert.ok(!(banned in g), `a gap record carrying ${banned} would be the substitute this contract refuses`);
    }
  }

  const candidates = result.records.filter((r) => r.contract === 'SourceCandidate');
  for (const c of candidates) {
    assert.equal(c.url_status, 'url:unchecked', 'a refused attempt establishes nothing about the URL');
    assert.notEqual(c.url_status, 'url:dead');
    assert.equal(c.state, 'duplicate', 're-reading sources.json is not a new find');
    assert.ok(c.matches_existing_source_id, 'a duplicate names what it duplicates');
    assert.equal(c.verification_ref, null, 'the Scout verifies nothing');
    assert.equal(c.tier_estimate, null, 'a tier estimate is a judgment about a document that has been read');
    /* Nothing it asserts may cite a document it never opened. */
    assert.ok(!c.evidence.some((e) => e.kind === 'retrieved_document'),
      'a failed attempt must never appear as retrieved_document evidence');
    for (const f of c.epistemic.fact) {
      const kinds = f.evidence_refs.map((id) => c.evidence.find((e) => e.evidence_id === id).kind);
      assert.ok(kinds.every((k) => k === 'dataset_record' || k === 'repository_file'),
        'with nothing retrieved, every fact must rest on the corpus and say so');
      assert.match(f.statement, /the corpus records|data\/claims\.json/,
        'a fact about the corpus is stated as one');
    }
  }
});

test('a successful retrieval is recorded differently everywhere it matters', async () => {
  const { tracer, store } = harness();
  const body = '<html><head><title>Regulation (EU) 2016/679</title></head><body>text</body></html>';
  const result = await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: okFetch(body) });

  for (const r of result.records) assert.deepEqual(validate(r), [], `${r.contract}: ${validate(r).join('; ')}`);

  const candidates = result.records.filter((r) => r.contract === 'SourceCandidate');
  assert.ok(candidates.length > 0);
  for (const c of candidates) {
    assert.equal(c.url_status, 'url:live');
    const doc = c.evidence.find((e) => e.kind === 'retrieved_document');
    assert.ok(doc, 'a retrieved document is cited as one');
    assert.ok(doc.retrieved_at && doc.checksum, 'with a real date and a checksum over the bytes');
    assert.ok(c.epistemic.fact.some((f) => /HTML title/.test(f.statement)),
      'what was read off the document is recorded as read off the document');
  }

  /* Retrieval is still not verification, and the run says so. */
  const gaps = result.records.filter((r) => r.contract === 'DataGap');
  assert.ok(gaps.every((g) => g.gap_kind !== 'retrieval_blocked'));
  assert.ok(gaps.some((g) => g.gap_kind === 'unverified_record'),
    'having fetched a document leaves the verification question open, and it is recorded');
});

test('a claim resting only on the brief is an honest empty result, not a manufactured one', async () => {
  const { tracer, store } = harness();
  const result = await scoutClaim({ claim_id: claimWithPlaceholderOnly(), tracer, store, fetchImpl: deniedFetch });

  assert.equal(result.outcomes.length, 0, 'there was nothing to retrieve, so nothing was attempted');
  assert.equal(result.records.filter((r) => r.contract === 'SourceCandidate').length, 0,
    'no document, no candidate — a Scout that reached nothing proposes nothing');

  const gaps = result.records.filter((r) => r.contract === 'DataGap');
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].gap_kind, 'missing_source');
  assert.equal(gaps[0].absence_kind, 'null_not_researched',
    'nobody has looked is not the same state as looked-and-blocked');
  assert.ok(gaps[0].closes_with.includes('red tier'),
    'the gap says who may create the source record, because it is not this agent');
});

/* ---------------------------------------------------------- the trace */

test('the run is traced, with real provenance and a decision that names what it refused', async () => {
  const { sink, tracer, store } = harness();
  const result = await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: deniedFetch });

  const byType = (t) => sink.records.filter((r) => r.type === t);
  assert.equal(sink.invalid.length, 0, 'every trace record passes the observability schema');

  const runSpan = byType('span.start').find((r) => r.kind === 'agent');
  assert.equal(runSpan.agent, AGENT);
  assert.equal(runSpan.run_id, result.run_id);
  assert.equal(runSpan.run_id, runSpan.span_id, 'a run IS a span');

  /* Real provenance: a real locator and a real retrieved_at, and no
     URL attached to a document that was never opened. */
  const prov = byType('provenance');
  assert.ok(prov.length > 0);
  for (const p of prov) {
    assert.equal(p.simulated, false);
    assert.ok(p.url || p.locator, 'a real provenance record needs a url or a locator');
    assert.ok(Date.parse(p.retrieved_at) > 0);
    assert.equal(p.url, null, 'nothing was retrieved here, so no URL is presented as though it had been');
    assert.match(p.locator, /^data\/sources\.json#/);
  }

  /* The refusal to substitute is itself recorded, with what it
     rejected — an unrecorded alternative is how a decision becomes
     indistinguishable from an accident. */
  const decisions = byType('decision');
  assert.ok(decisions.length > 0);
  assert.ok(decisions.every((d) => d.alternatives.length >= 3));
  assert.ok(decisions.some((d) => d.alternatives.some((a) => /Substitute a different/.test(a))));

  /* The contract records reach the trace as pointers, not copies. */
  const artifacts = byType('artifact');
  assert.equal(artifacts.length, result.records.length);
  for (const a of artifacts) {
    assert.match(a.artifact_type, /^contract:/);
    assert.match(a.sha256, /^[0-9a-f]{64}$/);
    assert.equal(a.preview, null, 'the trace holds a pointer, never a second copy of the record');
  }
});

/* A regression. The first working version let `run.step` capture a
   tool's return value wholesale, and because the corpus reader
   returned the parsed dataset alongside the claim, one span output
   carried a 74 KB copy of data/claims.json into the trace. Nothing
   failed — it was just the second home for the entire corpus,
   arriving through an output capture. */
test('neither the corpus nor a document body is copied into the trace', async () => {
  const { sink, tracer, store } = harness();
  const body = `<html><head><title>T</title></head><body>${'x'.repeat(50000)}</body></html>`;
  await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: okFetch(body) });

  for (const r of sink.records) {
    const line = JSON.stringify(r);
    assert.ok(line.length < 8000, `a ${line.length}-byte trace record (${r.type}) is carrying a payload it should be pointing at`);
    assert.ok(!line.includes('$schema_version'), 'a parsed dataset has been copied into the trace');
    assert.ok(!line.includes('x'.repeat(1000)), 'a document body has been copied into the trace');
  }
});

test('the store is not a way around the gate', async () => {
  const store = new MemoryContractStore();
  assert.throws(
    () => store.append('0'.repeat(32), { contract: 'DataGap', contract_version: 1 }),
    /does not satisfy its contract/,
    'an invalid record must die at the store boundary, not three agents later',
  );
  assert.throws(
    () => store.append('0'.repeat(32), { contract: 'NotAContract' }),
    /unknown contract/,
  );
});

test('the Scout writes nothing into data/', async () => {
  const { tracer, store } = harness();
  const before = corpus.dataset('claims').checksum;
  await scoutClaim({ claim_id: claimWithUrl(), tracer, store, fetchImpl: deniedFetch });
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { REPO_ROOT } = await import('../schemas/types.mjs');
  const { sha256 } = await import('./retrieve.mjs');
  assert.equal(sha256(readFileSync(join(REPO_ROOT, 'data', 'claims.json'))), before,
    'data/ is the legal record and this agent does not touch it');
});
