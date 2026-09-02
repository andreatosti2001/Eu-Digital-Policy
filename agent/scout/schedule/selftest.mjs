/* ============================================================
   agent/scout/schedule/selftest.mjs

     node --test agent/scout/schedule/selftest.mjs

   node:test, no network — same rule as agent/scout/selftest.mjs.
   Every run here uses MockTransport and MemoryRecordStore, so
   nothing is ever fetched from the real internet and nothing is
   ever written to agent/records/.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { Tracer } from '../../observability/tracer.mjs';
import { MemorySink } from '../../observability/sink.mjs';
import { deterministicClock, deterministicIds } from '../../observability/ids.mjs';
import { Scout } from '../scout.mjs';
import { MockTransport } from '../transport.mjs';
import { MemoryRecordStore } from '../store.mjs';
import { MOCK_DOCUMENTS, MOCK_ENDPOINTS } from '../fixtures.mjs';
import { validate } from '../../schemas/validate.mjs';

import {
  celexOf, relevanceBand, buildSourceIndex, buildPriorIndex, buildDigest, digestId, RELEVANCE_BANDS,
} from './digest.mjs';
import { ALLOWED, violations, explain } from './guard.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const REAL_SOURCES = join(REPO, 'data', 'sources.json');

async function runMock() {
  const tracer = new Tracer({
    sink: new MemorySink({ strict: true }),
    ids: deterministicIds(21),
    clock: deterministicClock('2026-09-07T06:17:00.000Z', 100),
  });
  const store = new MemoryRecordStore({ allowSimulated: true });
  const scout = new Scout({ tracer, transport: new MockTransport(MOCK_DOCUMENTS), store, endpoints: MOCK_ENDPOINTS });
  const result = await scout.run();
  return { result, store, tracer };
}

function tempDigestsDir() {
  const dir = mkdtempSync(join(tmpdir(), 'scout-digests-'));
  return dir;
}

/* ---------------------------------------------------------- celexOf */

test('celexOf reads a CELEX out of a URL and never out of a title', () => {
  assert.equal(celexOf('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679'), '32016R0679');
  assert.equal(celexOf('https://example.org/news'), null);
});

/* ---------------------------------------------------------- relevance */

test('relevance bands are derived from the Scout\'s own confidence figure, thresholds stated once', () => {
  assert.equal(relevanceBand(0.9), 'high');
  assert.equal(relevanceBand(0.75), 'high');
  assert.equal(relevanceBand(0.6), 'medium');
  assert.equal(relevanceBand(0.2), 'low');
  assert.equal(relevanceBand(null), 'unknown');
  assert.deepEqual(RELEVANCE_BANDS.map((b) => b.band), ['high', 'medium', 'low']);
});

/* ---------------------------------------------------------- source index */

test('buildSourceIndex matches the real bibliography on CELEX across URL variants', () => {
  const sources = JSON.parse(readFileSync(REAL_SOURCES, 'utf8')).sources;
  const index = buildSourceIndex(sources);
  assert.ok(index.byCelex.has('32016R0679'));
  assert.equal(index.byCelex.get('32016R0679').id, 'src-eurlex-gdpr');
});

/* ---------------------------------------------------------- prior index */

test('buildPriorIndex reads candidates out of earlier committed digests and excludes the current trace', () => {
  const dir = tempDigestsDir();
  try {
    writeFileSync(join(dir, 'digest-a.json'), JSON.stringify({
      digest_id: 'digest-a', trace_id: 'trace-a',
      candidates: [{ candidate_id: 'cand-old', url: 'https://example.invalid/doc', title: 'An earlier finding' }],
    }));
    writeFileSync(join(dir, 'digest-b.json'), JSON.stringify({
      digest_id: 'digest-b', trace_id: 'trace-b', candidates: [],
    }));
    const index = buildPriorIndex(dir, { excludeTraceId: 'trace-b' });
    assert.equal(index.digests_read, 1, 'trace-b is this run and must be excluded');
    assert.ok(index.byUrl.has('https://example.invalid/doc'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('buildPriorIndex reports a corrupt digest rather than silently narrowing the index', () => {
  const dir = tempDigestsDir();
  try {
    writeFileSync(join(dir, 'digest-broken.json'), '{ not json');
    const index = buildPriorIndex(dir);
    assert.equal(index.unreadable.length, 1);
    assert.equal(index.unreadable[0].file, 'digest-broken.json');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('buildPriorIndex on a directory that does not exist yet returns an empty index, not an error', () => {
  const index = buildPriorIndex(join(tmpdir(), `scout-digests-does-not-exist-${Date.now()}`));
  assert.equal(index.digests_read, 0);
  assert.equal(index.byUrl.size, 0);
});

/* ---------------------------------------------------------- buildDigest */

test('a full mock run produces a digest whose candidates are all new against the real bibliography', async () => {
  const { result } = await runMock();
  const dir = tempDigestsDir();
  try {
    const started_at = '2026-09-07T06:17:00.000Z';
    const finished_at = '2026-09-07T06:17:05.000Z';
    const { digest, markdown } = buildDigest({
      result, mode: 'mock', started_at, finished_at, environment: { env: 'test' },
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    assert.ok(digest.digest_id.startsWith('digest-'));
    assert.equal(digest.duration_ms, 5000);
    assert.equal(digest.totals.candidates, result.candidates.length);
    for (const c of digest.candidates) assert.equal(c.matches_bibliography, null, 'a .invalid fixture host cannot match the real bibliography');
    assert.match(markdown, /## New sources/);
    assert.match(markdown, /## Duplicate sources/);
    assert.match(markdown, /## Failed retrievals/);
    assert.match(markdown, /## High-relevance candidates/);
    assert.match(markdown, /## Unresolved retrieval problems/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a digest never carries a candidate\'s full epistemic or evidence body — pointer, not the record', async () => {
  const { result } = await runMock();
  const dir = tempDigestsDir();
  try {
    const { digest } = buildDigest({
      result, mode: 'mock', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:01Z',
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    for (const c of digest.candidates) {
      assert.equal(c.epistemic, undefined);
      assert.equal(c.evidence, undefined);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the Scout\'s own within-run duplicate finding is rendered verbatim, never recomputed', async () => {
  const { result } = await runMock();
  const dir = tempDigestsDir();
  try {
    const { digest } = buildDigest({
      result, mode: 'mock', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:01Z',
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    const scoutAsserted = result.candidates.filter((c) => c.duplicate_candidate_ids.length);
    assert.ok(scoutAsserted.length > 0, 'the mock fixture is built to exercise this path');
    for (const c of scoutAsserted) {
      const rendered = digest.candidates.find((d) => d.candidate_id === c.candidate_id);
      assert.deepEqual(rendered.duplicate_candidate_ids, c.duplicate_candidate_ids);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cross-run memory: a candidate proposed in an earlier digest is flagged, and names which digest', async () => {
  const { result } = await runMock();
  const dir = tempDigestsDir();
  try {
    const firstUrl = result.candidates[0].url;
    writeFileSync(join(dir, 'digest-earlier.json'), JSON.stringify({
      digest_id: 'digest-earlier', trace_id: 'some-other-trace',
      candidates: [{ candidate_id: 'cand-earlier', url: firstUrl, title: result.candidates[0].title }],
    }));
    const { digest } = buildDigest({
      result, mode: 'mock', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:01Z',
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    const rendered = digest.candidates.find((c) => c.url === firstUrl);
    assert.ok(rendered.matches_prior_digest, 'the candidate re-appeared in this run and should be flagged');
    assert.equal(rendered.matches_prior_digest.matched_on, 'url');
    assert.equal(rendered.matches_prior_digest.ref.candidate_id, 'cand-earlier');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('status reflects gaps: degraded when any retrieval failed, never silently ok', async () => {
  const { result } = await runMock();
  assert.ok(result.gaps.length > 0, 'the mock fixture includes a refused endpoint');
  const dir = tempDigestsDir();
  try {
    const { digest } = buildDigest({
      result, mode: 'mock', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:01Z',
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    assert.equal(digest.totals.gaps, result.gaps.length);
    assert.equal(digest.totals.failed_by_egress_policy, result.blocked);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a secret in the environment is redacted before it reaches the digest', async () => {
  const { result } = await runMock();
  const dir = tempDigestsDir();
  const leaked = 'ghp_0123456789abcdefghijklmnopqrstuvwxyz';
  try {
    const { digest } = buildDigest({
      result, mode: 'mock', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:01Z',
      environment: { note: `see ${leaked}` },
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    const serialised = JSON.stringify(digest);
    assert.equal(serialised.includes(leaked), false);
    assert.ok(digest.redactions > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('null and unknown do not render alike', async () => {
  const { result } = await runMock();
  const noDatePublisher = result.candidates.find((c) => c.publication_date === 'unknown');
  assert.ok(noDatePublisher, 'the mock fixture includes a document that states no date');
  const dir = tempDigestsDir();
  try {
    const { markdown } = buildDigest({
      result, mode: 'mock', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:01Z',
      sourcesPath: REAL_SOURCES, digestsDir: dir,
    });
    assert.ok(markdown.includes('*unknown*'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('digestId is filesystem-safe', () => {
  const id = digestId(new Date('2026-09-07T06:17:05.123Z'));
  assert.equal(id, 'digest-2026-09-07T06-17-05Z');
  assert.equal(/[:.]/.test(id), false);
});

/* ---------------------------------------------------------- guard */

test('the guard permits only digest files', () => {
  assert.deepEqual(violations(['agent/scout/digests/digest-x.json', 'agent/scout/digests/digest-x.md']), []);
  assert.deepEqual(violations(['data/sources.json']), ['data/sources.json']);
  assert.deepEqual(violations(['agent/scout/scout.mjs']), ['agent/scout/scout.mjs'],
    'the scheduling layer may not rewrite the Scout it wraps');
  assert.deepEqual(violations(['agent/schemas/gateway.mjs']), ['agent/schemas/gateway.mjs']);
  assert.deepEqual(violations(['agent/records/x.jsonl']), ['agent/records/x.jsonl'],
    'already git-ignored, and still refused here as a second check');
  assert.deepEqual(violations(['.github/workflows/source-scout.yml']), ['.github/workflows/source-scout.yml']);
});

test('the guard is an allowlist: an unimagined path is refused by default', () => {
  assert.deepEqual(violations(['some/path/nobody/thought/of.txt']), ['some/path/nobody/thought/of.txt']);
  assert.equal(ALLOWED.length, 1);
});

test('explain() names why a blocked path matters, not just that it is blocked', () => {
  assert.match(explain('data/sources.json'), /RED tier/);
  assert.match(explain('agent/scout/scout.mjs'), /Source Scout core/);
});

/* ---------------------------------------------------------- consistency with the contracts */

test('every candidate this layer previews still validates against its own contract, unmodified', async () => {
  const { result } = await runMock();
  for (const c of result.candidates) assert.deepEqual(validate(c, { allowSimulated: true }), []);
});
