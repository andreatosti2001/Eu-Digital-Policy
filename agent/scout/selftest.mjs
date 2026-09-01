/* ============================================================
   agent/scout/selftest.mjs

       node --test agent/scout/selftest.mjs

   node:test, no network, no installation.

   What it holds down, in the order the Scout would do damage:

     · it never writes to data/ — asserted by hashing the directory
       around a full run
     · it never invents a publication date, a publisher or an
       authority
     · "no stated date" comes out as unknown with an open question,
       never as a date taken from the address
     · a refused retrieval becomes a named gap, never silence and
       never a candidate
     · a secondary source is labelled secondary and cannot claim a
       primary tier
     · every record it emits satisfies its contract, and an invalid
       one cannot reach the store
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { deterministicClock, deterministicIds } from '../observability/ids.mjs';
import { validateRecord as validateTraceRecord } from '../observability/schema.mjs';
import { validate } from '../schemas/validate.mjs';
import { AUTHORITY_CLASSES, SECONDARY_AUTHORITY } from '../schemas/types.mjs';

import { Scout, SCOUT_AGENT, loadInstruments } from './scout.mjs';
import { MockTransport, HttpTransport, DEFAULT_LIMITS } from './transport.mjs';
import { MemoryRecordStore } from './store.mjs';
import { MOCK_DOCUMENTS, MOCK_ENDPOINTS } from './fixtures.mjs';
import { ENDPOINTS, authorityForUrl, authorityRank, endpointsByPriority, estimateTier } from './authorities.mjs';
import { extractLinks, extractPublicationDate, extractPublisher, extractTitle, instrumentTerms, matchInstruments, textOf } from './extract.mjs';
import { findDuplicates, normaliseTitle, normaliseUrl } from './dedupe.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function runMock({ endpoints = MOCK_ENDPOINTS, documents = MOCK_DOCUMENTS, limits = {} } = {}) {
  const tracer = new Tracer({
    sink: new MemorySink({ strict: true }),
    ids: deterministicIds(11),
    clock: deterministicClock('2026-09-01T12:00:00.000Z', 100),
  });
  const store = new MemoryRecordStore({ allowSimulated: true });
  const scout = new Scout({ tracer, transport: new MockTransport(documents), store, endpoints, limits });
  const result = await scout.run();
  return { result, store, tracer };
}

const candidateFor = (store, urlPart) =>
  store.written.find((r) => r.contract === 'SourceCandidate' && r.url.includes(urlPart));

/* ---------------------------------------------------------- the boundary */

test('the Scout does not write to data/ — the whole directory is unchanged by a run', async () => {
  const hashDir = () => {
    const dir = join(REPO, 'data');
    return readdirSync(dir).sort().map((f) => `${f}:${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}`).join('\n');
  };
  const before = hashDir();
  await runMock();
  assert.equal(hashDir(), before, 'a file in data/ changed during a Scout run');
});

test('the Scout module contains no write path to data/', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const f of readdirSync(here).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(here, f), 'utf8');
    /* readFileSync of data/instruments.json is expected and read-only;
       nothing may write. */
    for (const forbidden of ['writeFileSync', 'appendFileSync(join(', 'createWriteStream', 'rmSync', 'unlinkSync']) {
      if (f === 'store.mjs' && forbidden === 'appendFileSync(join(') continue;
      assert.ok(!src.includes(forbidden), `${f} contains ${forbidden}`);
    }
  }
});

/* ---------------------------------------------------------- extraction */

test('a title is read from the document, and nothing else', () => {
  assert.equal(extractTitle('<title> Spaced  title </title>').value, 'Spaced title');
  assert.equal(extractTitle('<meta property="og:title" content="OG"><title>T</title>').value, 'OG');
  assert.equal(extractTitle('<html><body>no title</body></html>'), null);
});

test('a publication date is read only from a machine-readable field, never from the URL or from prose', () => {
  assert.equal(extractPublicationDate('<meta property="article:published_time" content="2026-04-15">').value, '2026-04-15');
  assert.equal(extractPublicationDate('<meta name="DC.date" content="2026-05">').value, '2026-05', 'a month-precision date is kept at month precision');
  assert.equal(extractPublicationDate('<time datetime="2026-01-02">2 January</time>').value, '2026-01-02');
  assert.equal(extractPublicationDate('<p>Published on 4 March 2026.</p>'), null, 'a date in prose is not a machine-readable date');
  assert.equal(extractPublicationDate('<a href="/2026/03/04/doc">x</a>'), null, 'a date in a URL is not a publication date');
});

test('a publisher is what the document says, never the host it was served by', () => {
  assert.equal(extractPublisher('<meta property="og:site_name" content="EDPB">').value, 'EDPB');
  assert.equal(extractPublisher('<html><title>served by edpb.europa.eu</title></html>'), null);
});

test('links are same-host, absolute and capped', () => {
  const html = '<a href="/a">a</a><a href="https://other.invalid/b">b</a><a href="mailto:x@y">c</a><a href="/a#frag">a again</a>';
  assert.deepEqual(extractLinks(html, 'https://host.invalid/'), ['https://host.invalid/a']);
  const many = Array.from({ length: 50 }, (_, i) => `<a href="/p${i}">x</a>`).join('');
  assert.equal(extractLinks(many, 'https://host.invalid/', { limit: 5 }).length, 5);
});

test('instrument matching uses the repository\'s own terms and prefers the more specific one', () => {
  const terms = instrumentTerms(loadInstruments(REPO));
  const byCelex = matchInstruments(textOf('<p>See 32022R2065 and the DSA.</p>'), terms);
  assert.equal(byCelex[0].instrument_id, 'dsa');
  assert.equal(byCelex[0].match_kind, 'celex', 'a CELEX number identifies an instrument; three letters could be anything');
  assert.deepEqual(matchInstruments('a notice about municipal parking', terms), []);
});

/* ---------------------------------------------------------- authorities */

test('the priority hierarchy has one home, and rank is derived from it', () => {
  assert.equal(authorityRank('authority:eur-lex'), 1);
  assert.equal(authorityRank(SECONDARY_AUTHORITY), 9);
  assert.equal(authorityRank('authority:not-a-class'), AUTHORITY_CLASSES.length + 1);
  const ranks = endpointsByPriority().map((e) => authorityRank(e.authority_class));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), 'endpoints must come back most authoritative first');
});

test('every registered endpoint declares itself an unverified hypothesis', () => {
  for (const ep of ENDPOINTS) {
    assert.equal(ep.endpoint_verified, false, `${ep.id} claims to be verified, and nothing in this repository has verified it`);
    assert.ok(AUTHORITY_CLASSES.includes(ep.authority_class));
    assert.doesNotThrow(() => new URL(ep.url));
  }
});

test('a tier is estimated only where the taxonomy settles it, and is null otherwise', () => {
  assert.equal(estimateTier({ authority_class: 'authority:eur-lex', source_type: null }).tier, 'tier:1');
  assert.equal(estimateTier({ authority_class: 'authority:edpb', source_type: null }).tier, 'tier:2');
  const commission = estimateTier({ authority_class: 'authority:commission', source_type: null });
  assert.equal(commission.tier, null, 'the Commission spans two tiers and the document type is unknown');
  assert.match(commission.method, /two tiers/);
  assert.equal(estimateTier({ authority_class: SECONDARY_AUTHORITY, source_type: null }).tier, null);
  assert.equal(estimateTier({ authority_class: SECONDARY_AUTHORITY, source_type: 'source-type:research' }).tier, 'tier:3');
});

test('an unregistered host resolves to no authority rather than to "secondary"', () => {
  assert.equal(authorityForUrl('https://www.edpb.europa.eu/news/x')?.authority_class, 'authority:edpb');
  assert.equal(authorityForUrl('https://someone.example.invalid/x'), null);
  assert.equal(authorityForUrl('not a url'), null);
});

/* ---------------------------------------------------------- duplicates */

test('URL normalisation collapses the addresses that mean the same document', () => {
  assert.equal(
    normaliseUrl('https://WWW.Example.invalid/a/?utm_source=x&b=1#frag'),
    normaliseUrl('https://example.invalid/a?b=1'),
  );
  assert.notEqual(normaliseUrl('https://example.invalid/a'), normaliseUrl('https://example.invalid/b'));
  assert.equal(normaliseTitle('Guidelines 01/2026 — On Something'), 'guidelines 01 2026 on something');
});

test('duplicates are graded: identical bytes are proof, identical titles are a suggestion', () => {
  const d = findDuplicates([
    { candidate_id: 'a', url: 'https://x.invalid/1', title: 'T', fingerprint: 'ff' },
    { candidate_id: 'b', url: 'https://x.invalid/2', title: 'T', fingerprint: 'ff' },
    { candidate_id: 'c', url: 'https://x.invalid/3', title: 'T', fingerprint: 'zz' },
    { candidate_id: 'd', url: 'https://x.invalid/4', title: 'Other', fingerprint: 'yy' },
  ]);
  assert.match(d.get('a')[0].basis, /fingerprint/);
  assert.match(d.get('c').find((x) => x.candidate_id === 'a').basis, /suggestion, not proof/);
  assert.deepEqual(d.get('d'), []);
  assert.ok(!d.get('a').some((x) => x.candidate_id === 'a'), 'nothing duplicates itself');
});

/* ---------------------------------------------------------- the run */

test('every record a mock run produces satisfies its contract', async () => {
  const { store } = await runMock();
  assert.ok(store.written.length >= 12);
  for (const r of store.written) {
    assert.deepEqual(validate(r, { allowSimulated: true }), [], `${r.contract} ${JSON.stringify(r).slice(0, 200)}`);
  }
});

test('a document that states no date yields "unknown" and an open question, not a date', async () => {
  const { store } = await runMock();
  const c = candidateFor(store, '/doc/undated');
  assert.equal(c.publication_date, 'unknown');
  assert.ok(!c.epistemic.fact.some((f) => f.field === 'publication_date'), 'an undated document must assert no date as fact');
  const open = c.epistemic.unresolved.find((u) => u.field === 'publication_date');
  assert.equal(open.absence_kind, 'unknown_not_determinable', 'the document was read and states none — that is not "nobody looked"');
  assert.match(open.missing, /does not take a date from a URL/);
});

test('a dated document records the date exactly as printed, at the precision printed', async () => {
  const { store } = await runMock();
  assert.equal(candidateFor(store, '/doc/dated').publication_date, '2026-04-15');
  assert.equal(candidateFor(store, '/opinion/1').publication_date, '2026-05', 'a month-precision date is never widened into a day');
});

test('being served by a host is never recorded as the document naming a publisher', async () => {
  const { store } = await runMock();
  const c = candidateFor(store, '/report/1');
  assert.equal(c.publisher, null, 'the ENISA fixture names no publisher, so none is recorded');
  assert.equal(c.authority_class, 'authority:enisa', 'the host still yields an authority class, as an inference');
  const inf = c.epistemic.inference.find((i) => i.field === 'authority_class');
  assert.match(inf.method, /served by a host registered to this authority/);
  assert.ok(c.epistemic.unresolved.some((u) => u.field === 'publisher'));
});

test('a secondary source is labelled secondary and cannot claim a primary tier', async () => {
  const { store } = await runMock();
  const c = candidateFor(store, 'commentary.example.invalid');
  assert.equal(c.authority_class, SECONDARY_AUTHORITY);
  assert.equal(c.tier_estimate, null, 'research and commentary are different tiers and the type is not established');
  const forced = { ...c, tier_estimate: 'tier:1' };
  assert.ok(validate(forced, { allowSimulated: true }).some((e) => /never presented as equivalent to primary law/.test(e)));
});

test('the same document at two addresses is named in both directions, and no winner is picked', async () => {
  const { store } = await runMock();
  const a = candidateFor(store, '/doc/dated');
  const b = candidateFor(store, '/doc/mirror');
  assert.deepEqual(a.duplicate_candidate_ids, [b.candidate_id]);
  assert.deepEqual(b.duplicate_candidate_ids, [a.candidate_id]);
  assert.equal(a.state, 'proposed');
  assert.equal(b.state, 'proposed');
  assert.ok(a.epistemic.unresolved.some((u) => /does not choose between them/.test(u.missing)));
});

test('a document mentioning nothing this repository tracks becomes no candidate at all', async () => {
  const { store, result } = await runMock();
  assert.equal(candidateFor(store, '/doc/unrelated'), undefined);
  assert.ok(result.screened_out >= 1);
});

test('a refused retrieval becomes a named gap, never silence and never a candidate', async () => {
  const { store, result } = await runMock();
  const gap = store.written.find((r) => r.contract === 'DataGap');
  assert.equal(gap.gap_kind, 'retrieval_blocked');
  assert.equal(gap.absence_kind, 'null_not_researched', 'a document nobody could reach has not been read');
  assert.equal(gap.evidence[0].kind, 'absent');
  assert.deepEqual(gap.candidate_leads, ['https://commission.example.invalid/']);
  assert.match(gap.why_open, /egress policy, not a statement about the document/);
  assert.equal(result.candidates.filter((c) => c.url.includes('commission.example.invalid')).length, 0);
  assert.ok(!gap.epistemic.fact.length, 'nothing was read, so nothing is asserted as fact');
});

test('confidence falls when less was established', async () => {
  const { store } = await runMock();
  const full = candidateFor(store, '/doc/dated');
  const thin = candidateFor(store, '/report/1');
  assert.ok(full.confidence > thin.confidence, 'a document that names itself, its publisher and its date is worth more');
  for (const c of store.written.filter((r) => r.contract === 'SourceCandidate')) {
    assert.ok(c.confidence < 1, 'the Scout has verified nothing and never claims certainty');
  }
});

/* ---------------------------------------------------------- the run record */

test('the AgentRun is the span, and names everything it produced', async () => {
  const { store, result } = await runMock();
  const run = store.written.find((r) => r.contract === 'AgentRun');
  assert.equal(run.run_id, run.trace_ref.span_id);
  assert.equal(run.run_id, result.run_id);
  assert.equal(run.status, 'ok');
  assert.equal(run.agent, SCOUT_AGENT);
  assert.equal(run.autonomy_class, 'autonomous', 'a read-only discovery run changes nothing');
  assert.deepEqual(run.affected_entities, [], 'it affected no entity; what it is about lives on the candidates');
  const producedIds = run.produced.map((p) => p.id).sort();
  const emitted = store.written.filter((r) => ['SourceCandidate', 'DataGap'].includes(r.contract))
    .map((r) => r.candidate_id ?? r.gap_id).sort();
  assert.deepEqual(producedIds, emitted);
  assert.ok(run.epistemic.unresolved.some((u) => /Is the candidate set complete/.test(u.question)),
    'a run with a failed retrieval must not imply its candidate set is complete');
});

test('every record carries a trace_ref into the same trace', async () => {
  const { store, result } = await runMock();
  for (const r of store.written) {
    assert.equal(r.trace_ref.trace_id, result.trace_id);
    assert.equal(r.trace_ref.run_id, result.run_id);
  }
});

/* ---------------------------------------------------------- instrumentation */

test('every meaningful operation reaches the trace, and the trace is valid', async () => {
  const { tracer, store } = await runMock();
  const recs = tracer.sink.records;
  for (const r of recs) assert.deepEqual(validateTraceRecord(r), [], JSON.stringify(r));

  const kinds = (t) => recs.filter((r) => r.type === t);
  const fetches = recs.filter((r) => r.type === 'span.start' && r.name === 'scout.fetch');
  assert.equal(fetches.length, 12, 'one span per retrieval attempt, successes and failures alike');
  assert.ok(kinds('observation').length >= MOCK_ENDPOINTS.length + 1,
    'at least one observation per endpoint, plus the run opening one');
  assert.ok(kinds('observation').some((o) => /Screened out/.test(o.summary)),
    'a document screened out is an observation, not a silent drop');
  assert.ok(kinds('provenance').length >= 4, 'a retrieved listing page is provenance');
  assert.ok(kinds('usage').length >= 12, 'network latency is recorded per fetch');
  assert.equal(kinds('artifact').length, store.written.length, 'every contract record is registered in the trace');
  assert.ok(kinds('artifact').every((a) => a.artifact_type.startsWith('contract:')));
  assert.equal(kinds('error').length, 0);

  const root = recs.find((r) => r.type === 'span.start' && r.kind === 'agent');
  assert.equal(root.agent, SCOUT_AGENT);
  assert.equal(root.run_id, root.span_id);
});

test('the trace holds a pointer to each record, not a copy of it', async () => {
  const { tracer, store } = await runMock();
  const written = JSON.stringify(tracer.sink.records);
  const candidate = store.written.find((r) => r.contract === 'SourceCandidate');
  assert.ok(!written.includes(candidate.relevance), 'the candidate body was copied into the trace');
  const art = tracer.sink.records.find((r) => r.type === 'artifact' && r.artifact_id === candidate.candidate_id);
  assert.match(art.sha256, /^[0-9a-f]{64}$/);
});

/* ---------------------------------------------------------- the store */

test('an invalid record cannot reach the store', () => {
  const store = new MemoryRecordStore({ allowSimulated: true });
  assert.throws(() => store.write({ contract: 'SourceCandidate', contract_version: 1 }), /refusing to store an invalid SourceCandidate/);
  assert.equal(store.written.length, 0);
});

test('a simulated record cannot reach a store that was not asked for fixtures', async () => {
  const strict = new MemoryRecordStore({ allowSimulated: false });
  const { store } = await runMock();
  const rec = store.written.find((r) => r.contract === 'SourceCandidate');
  assert.equal(rec.simulated, true);
  assert.throws(() => strict.write(rec), /marked simulated/);
});

/* ---------------------------------------------------------- live mode wiring */

test('mock mode marks everything simulated; live mode does not, and the flag comes from the transport', async () => {
  const { store } = await runMock();
  assert.ok(store.written.every((r) => r.simulated === true));
  for (const r of store.written) {
    for (const u of JSON.stringify(r).match(/https?:\/\/[^"\\]+/g) ?? []) {
      assert.ok(new URL(u).hostname.endsWith('.invalid'), `a mock record cites ${u}`);
    }
  }
  const liveScout = new Scout({
    tracer: new Tracer({ sink: new MemorySink({ strict: true }) }),
    transport: new HttpTransport(),
    store: new MemoryRecordStore(),
  });
  assert.equal(liveScout.simulated, false, 'a live run must not be able to mark its findings simulated');
});

test('the live transport is polite and identifies itself, and never disables TLS verification', () => {
  assert.ok(DEFAULT_LIMITS.delay_ms >= 500, 'a scout that hammers a regulator gets the repository blocked');
  assert.match(DEFAULT_LIMITS.user_agent, /EuDigitalPolicyScout/);
  assert.ok(DEFAULT_LIMITS.max_bytes > 0 && DEFAULT_LIMITS.timeout_ms > 0);
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'transport.mjs'), 'utf8');
  assert.ok(!src.includes('rejectUnauthorized'), 'TLS verification is never turned off to make a fetch succeed');
  assert.ok(!src.includes('NODE_TLS_REJECT_UNAUTHORIZED'));
});
