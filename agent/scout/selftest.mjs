/* ============================================================
   agent/scout/selftest.mjs

     node --test agent/scout/selftest.mjs

   node:test only — no dependency, no build step, the same rule
   the four validators in tools/ keep.

   Nothing here touches the network. Every retrieval is an
   injected fetch, so the suite tests the Scout rather than the
   availability of europa.eu, and a run of this suite can never
   put load on a public regulator's server.
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { get, retrievalMetadata } from './http.mjs';
import { parseFeed, parseLinks, plainText, normaliseDate } from './feed.mjs';
import { celexOf, normaliseUrl, normaliseTitle, buildIndex, classify, dedupeWithinRun } from './dedupe.mjs';
import { buildVocabulary, score, BANDS } from './relevance.mjs';
import { buildReport, renderSummary, reportId } from './report.mjs';
import { runScout, REPO_ROOT } from './scout.mjs';
import { violations, ALLOWED } from './guard.mjs';
import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { validateRecord } from '../observability/schema.mjs';

/* ---------------------------------------------------------- helpers */

const res = (body, { status = 200, headers = {}, } = {}) => ({
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});

const FEED = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Commission opens DSA proceedings against a marketplace</title>
      <link>https://digital-strategy.ec.europa.eu/en/news/dsa-proceedings</link>
      <pubDate>Mon, 24 Aug 2026 09:00:00 GMT</pubDate>
      <description>Proceedings under the Digital Services Act.</description></item>
<item><title>Regulation (EU) 2016/679 consolidated text</title>
      <link>https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679&amp;qid=1</link>
      <pubDate>Tue, 25 Aug 2026 09:00:00 GMT</pubDate></item>
<item><title>Staff appointments and internal reorganisation notice</title>
      <link>https://example.org/staff</link></item>
</channel></rss>`;

const fakeFetch = (map) => async (url) => {
  for (const [pattern, out] of Object.entries(map)) {
    if (url.includes(pattern)) {
      if (out instanceof Error) throw out;
      return out;
    }
  }
  return res('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
};

/* ---------------------------------------------------------- http */

test('get() records retrieval metadata for a successful response', async () => {
  const r = await get('https://example.org/feed', {
    fetch: fakeFetch({ 'example.org': res(FEED, { headers: { 'content-type': 'application/rss+xml', etag: 'W/"abc"' } }) }),
  });
  assert.equal(r.ok, true);
  assert.equal(r.status, 200);
  assert.equal(r.content_type, 'application/rss+xml');
  assert.equal(r.headers.etag, 'W/"abc"');
  assert.equal(r.headers['last-modified'], null, 'a header the server did not send is null, not ""');
  assert.equal(r.bytes, Buffer.byteLength(FEED));
  assert.match(r.sha256, /^[0-9a-f]{64}$/);
  assert.ok(typeof r.elapsed_ms === 'number');
  assert.ok(!Number.isNaN(Date.parse(r.retrieved_at)));
});

test('get() treats a failure as a result, never an exception', async () => {
  const r = await get('https://example.org/gone', {
    fetch: fakeFetch({ 'example.org': res('nope', { status: 503, headers: { 'content-type': 'text/plain' } }) }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.status, 503);
  assert.equal(r.error.kind, 'http-status');
});

test('get() reports a network error with a named kind', async () => {
  const r = await get('https://example.org/x', { fetch: fakeFetch({ 'example.org': new Error('ECONNREFUSED') }) });
  assert.equal(r.ok, false);
  assert.equal(r.error.kind, 'network');
  assert.match(r.error.message, /ECONNREFUSED/);
});

test('get() follows redirects by hand and records the chain', async () => {
  let hop = 0;
  const r = await get('https://example.org/a', {
    fetch: async () => (hop++ === 0
      ? res('', { status: 301, headers: { location: 'https://example.org/b' } })
      : res(FEED, { headers: { 'content-type': 'application/rss+xml' } })),
  });
  assert.equal(r.ok, true);
  assert.equal(r.redirects.length, 1);
  assert.equal(r.redirects[0].to, 'https://example.org/b');
  assert.equal(r.final_url, 'https://example.org/b');
});

test('get() refuses a redirect to a non-http scheme', async () => {
  const r = await get('https://example.org/a', {
    fetch: async () => res('', { status: 302, headers: { location: 'file:///etc/passwd' } }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.error.kind, 'bad-redirect');
});

test('get() refuses a non-http(s) URL outright', async () => {
  const r = await get('file:///etc/passwd', { fetch: async () => { throw new Error('must not be called'); } });
  assert.equal(r.error.kind, 'bad-url');
});

test('retrievalMetadata() drops the body but says whether there was one', async () => {
  const r = await get('https://example.org/feed', {
    fetch: fakeFetch({ 'example.org': res(FEED, { headers: { 'content-type': 'application/rss+xml' } }) }),
  });
  const m = retrievalMetadata(r);
  assert.equal(m.body, undefined);
  assert.equal(m.body_captured, true);
  assert.equal(m.body_chars, FEED.length);
});

/* ---------------------------------------------------------- feed */

test('parseFeed() reads RSS entries and decodes entities', () => {
  const { format, entries, problems } = parseFeed(FEED);
  assert.equal(format, 'rss');
  assert.equal(entries.length, 3);
  assert.equal(problems.length, 0);
  assert.match(entries[1].link, /CELEX:32016R0679&qid=1/);
});

test('parseFeed() never invents a date the publisher did not state', () => {
  const { entries } = parseFeed(FEED);
  assert.equal(entries[2].published, null, 'no pubDate must stay null, not become the run date');
});

test('parseFeed() reports why a body yielded nothing rather than returning a quiet zero', () => {
  const r = parseFeed('<html><body>a page</body></html>');
  assert.equal(r.entries.length, 0);
  assert.ok(r.problems.length > 0);
  assert.match(r.problems[0], /not RSS or Atom/);
});

test('parseFeed() prefers an Atom alternate link over self', () => {
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Judgment in C-000/26</title>
    <link rel="self" href="/self"/><link rel="alternate" href="/judgment"/><updated>2026-07-01T00:00:00Z</updated></entry></feed>`;
  const { entries } = parseFeed(atom, { baseUrl: 'https://curia.europa.eu/x/' });
  assert.equal(entries[0].link, 'https://curia.europa.eu/judgment');
});

test('parseLinks() resolves relative hrefs and skips non-documents', () => {
  const html = `<a href="/a/one">First document</a><a href="#top">skip</a><a href="mailto:x@y">skip</a><a href="/a/one">dup</a>`;
  const { entries } = parseLinks(html, { baseUrl: 'https://curia.europa.eu/p/' });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].link, 'https://curia.europa.eu/a/one');
});

test('plainText and normaliseDate refuse to fabricate', () => {
  assert.equal(plainText('   '), null);
  assert.equal(normaliseDate('not a date'), null);
  assert.equal(normaliseDate(null), null);
});

/* ---------------------------------------------------------- dedupe */

test('celexOf reads a CELEX out of a URL and never out of a title', () => {
  assert.equal(celexOf('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2065'), '32022R2065');
  assert.equal(celexOf('https://example.org/news'), null);
});

test('normaliseUrl drops tracking, case, www, fragment and trailing slash', () => {
  assert.equal(
    normaliseUrl('HTTPS://WWW.Example.org/a/?utm_source=x&b=2&a=1#frag'),
    normaliseUrl('https://example.org/a/?a=1&b=2'),
  );
});

test('normaliseTitle refuses to key on a very short title', () => {
  assert.equal(normaliseTitle('DSA'), null);
  assert.equal(normaliseTitle('Commission opens proceedings'), 'commission opens proceedings');
});

test('classify matches a known source on CELEX across URL variants', () => {
  const sources = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'sources.json'), 'utf8')).sources;
  const index = buildIndex(sources, []);
  const v = classify({ url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679&qid=99', title: 'anything' }, index);
  assert.equal(v.duplicate, true);
  assert.equal(v.matched_on, 'celex');
  assert.equal(v.matched.id, 'src-eurlex-gdpr');
});

test('classify marks a title-only match weak, so a wrong suppression is visible', () => {
  const index = buildIndex([{ id: 'src-x', title: 'A distinctive document title here', url: 'https://a.example/1' }], []);
  const v = classify({ url: 'https://b.example/2', title: 'A distinctive document title here' }, index);
  assert.equal(v.duplicate, true);
  assert.equal(v.matched_on, 'title');
  assert.equal(v.confidence, 'weak');
});

test('a genuinely new candidate is not a duplicate', () => {
  const sources = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'sources.json'), 'utf8')).sources;
  const index = buildIndex(sources, []);
  assert.equal(classify({ url: 'https://example.org/brand-new-thing', title: 'An entirely unseen document' }, index).duplicate, false);
});

test('dedupeWithinRun collapses one document arriving from two watchlist entries', () => {
  const { unique, collisions } = dedupeWithinRun([
    { candidate_id: 'a', watch_id: 'w1', url: 'https://example.org/x', title: 'A shared document title' },
    { candidate_id: 'b', watch_id: 'w2', url: 'https://www.example.org/x/', title: 'A shared document title' },
  ]);
  assert.equal(unique.length, 1);
  assert.equal(collisions.length, 1);
  assert.deepEqual(unique[0].also_seen_in, ['w2']);
});

/* ---------------------------------------------------------- relevance */

test('the relevance vocabulary is derived from the instruments dataset, not stored', () => {
  const instruments = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'instruments.json'), 'utf8')).instruments;
  const v = buildVocabulary(instruments);
  assert.ok(v.size > 50);
  assert.ok(v.terms.has('gdpr') && v.terms.has('dsa') && v.terms.has('32016r0679'));
  assert.equal(v.terms.has('regulation'), false, 'a stopword must not identify an instrument');
});

test('an exact CELEX in a title bands high; an unrelated title bands none', () => {
  const instruments = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'instruments.json'), 'utf8')).instruments;
  const v = buildVocabulary(instruments);
  assert.equal(score({ title: 'CELEX 32016R0679 consolidated text', summary: null }, v).band, 'high');
  assert.equal(score({ title: 'Canteen closed on Friday afternoon', summary: null }, v).band, 'none');
});

test('an unassessable candidate is unknown with a null score — never zero', () => {
  const instruments = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'instruments.json'), 'utf8')).instruments;
  const v = buildVocabulary(instruments);
  const s = score({ title: null, summary: null }, v);
  assert.equal(s.band, 'unknown');
  assert.equal(s.score, null);
  assert.equal(s.assessable, false);
  assert.notEqual(s.score, 0);
});

test('a band is auditable: it ships the terms that produced it', () => {
  const instruments = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'instruments.json'), 'utf8')).instruments;
  const s = score({ title: 'Commission opens DSA proceedings', summary: null }, buildVocabulary(instruments));
  assert.ok(s.matched.some((m) => m.term === 'dsa'));
  assert.deepEqual(s.instrument_ids, ['dsa']);
});

/* ---------------------------------------------------------- end to end */

async function runFixture(overrides = {}) {
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({ service: 'test', sink });
  const out = await runScout({
    write: false,
    tracer,
    fetch: fakeFetch({
      'digital-strategy': res(FEED, { headers: { 'content-type': 'application/rss+xml' } }),
      'edpb': res('<html>a portal page, not a feed</html>', { headers: { 'content-type': 'text/html' } }),
      ...(overrides.map ?? {}),
    }),
    environment: { env: 'test' },
    ...overrides.opts,
  });
  return { ...out, sink };
}

test('a full run produces a report, and every trace record is schema-valid', async () => {
  const { report, sink } = await runFixture();
  assert.ok(report.report_id.startsWith('scout-'));
  assert.equal(sink.invalid.length, 0);
  for (const r of sink.records) assert.deepEqual(validateRecord(r), []);
});

test('a run that reaches some endpoints and not others is degraded, not failed', async () => {
  const { report } = await runFixture();
  assert.equal(report.status, 'degraded');
  assert.ok(report.totals.retrievals_failed > 0);
  assert.ok(report.totals.retrievals_ok > 0);
});

test('a known document arriving in a feed is suppressed as a duplicate', async () => {
  const { report } = await runFixture();
  const dupe = report.duplicates.find((d) => d.celex === '32016R0679');
  assert.ok(dupe, 'the GDPR entry in the fixture feed is already in data/sources.json');
  assert.equal(dupe.duplicate.matched_on, 'celex');
  assert.equal(dupe.duplicate.matched.id, 'src-eurlex-gdpr');
});

test('the run asks for approval it cannot grant itself', async () => {
  const { sink } = await runFixture();
  const approvals = sink.records.filter((r) => r.type === 'approval');
  assert.equal(approvals.length, 1);
  assert.equal(approvals[0].state, 'requested');
  assert.equal(approvals[0].risk, 'high');
  const granted = sink.records.filter((r) => r.type === 'approval' && r.state === 'granted');
  assert.equal(granted.length, 0, 'a Scout that approves itself is not a Scout');
});

test('the run hands off to a human rather than to a writer', async () => {
  const { sink } = await runFixture();
  const handoffs = sink.records.filter((r) => r.type === 'handoff');
  assert.equal(handoffs.length, 1);
  assert.equal(handoffs[0].to_agent, 'human-reviewer');
});

test('nothing the Scout emits is marked simulated', async () => {
  const { sink } = await runFixture();
  assert.equal(sink.records.some((r) => r.simulated === true), false,
    'the simulated flag belongs to the observability demonstrator alone');
});

test('every provenance record carries a real url and a real retrieval instant', async () => {
  const { sink } = await runFixture();
  const prov = sink.records.filter((r) => r.type === 'provenance');
  assert.ok(prov.length > 0);
  for (const p of prov) {
    assert.match(p.url, /^https?:\/\//);
    assert.ok(!Number.isNaN(Date.parse(p.retrieved_at)));
    assert.equal(p.role, 'unresolved', 'nothing is established until a human reads the document');
  }
});

test('the decision records what it rejected', async () => {
  const { sink } = await runFixture();
  const d = sink.records.find((r) => r.type === 'decision');
  assert.ok(d);
  assert.ok(d.alternatives.length >= 3);
  assert.ok(d.alternatives.some((a) => /RED tier/.test(a)));
});

test('a dry run writes nothing to disk', async () => {
  const { wrote, reportPath } = await runFixture();
  assert.equal(wrote, false);
  assert.equal(require_exists(reportPath), false);
});
function require_exists(p) { try { readFileSync(p); return true; } catch { return false; } }

/* ---------------------------------------------------------- report */

test('the summary always carries all five mandatory sections, even when empty', async () => {
  const { summary } = await runFixture();
  for (const heading of [
    '## New sources', '## Duplicate sources', '## Failed retrievals',
    '## High-relevance candidates', '## Unresolved retrieval problems',
  ]) assert.ok(summary.includes(heading), `missing section: ${heading}`);
});

test('the summary states that it is a proposal and not a dataset', async () => {
  const { summary, report } = await runFixture();
  assert.match(summary, /proposal from a read-only agent/);
  assert.match(report.$description, /PROPOSAL/);
  assert.match(report.$boundaries, /never edits data\/\*\.json/);
});

test('a secret arriving in a feed never reaches the report', () => {
  const leaked = 'ghp_0123456789abcdefghijklmnopqrstuvwxyz';
  const { report } = buildReport({
    reportId: reportId(), startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(),
    traceId: 'a'.repeat(32), runId: 'b'.repeat(16),
    watchlist: { total: 1, enabled: 1 },
    retrievals: [{ watch_id: 'w', ok: true, requested_url: `https://example.org/?token=${leaked}` }],
    candidates: [{ candidate_id: 'c', title: `see ${leaked}`, url: 'https://example.org/x', relevance: { band: 'none', score: 0, matched: [], instrument_ids: [] } }],
    duplicates: [], problems: [], environment: {}, indexSizes: {}, vocabularySize: 1,
  });
  const serialised = JSON.stringify(report);
  assert.equal(serialised.includes(leaked), false, 'a credential must not survive into a stored report');
  assert.ok(report.redactions > 0, 'and the redactor must say it did something');
});

test('null and unknown do not render alike in the summary', () => {
  const { report } = buildReport({
    reportId: reportId(), startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(),
    traceId: 'a'.repeat(32), runId: 'b'.repeat(16),
    watchlist: { total: 1, enabled: 1 }, retrievals: [],
    candidates: [
      { candidate_id: 'c1', title: 'No date stated', url: 'https://e.example/1', published: null, publisher_name: null, watch_id: 'w', relevance: { band: 'none', score: 0, matched: [], instrument_ids: [] } },
      { candidate_id: 'c2', title: 'Unassessable', url: 'https://e.example/2', published: 'unknown', publisher_name: 'P', watch_id: 'w', relevance: { band: 'unknown', score: null, matched: [], instrument_ids: [] } },
    ],
    duplicates: [], problems: [], environment: {}, indexSizes: {}, vocabularySize: 1,
  });
  const md = renderSummary(report);
  assert.ok(md.includes('| — |'), 'null renders as an em dash');
  assert.ok(md.includes('*unknown*'), 'unknown renders as unknown');
  assert.equal(report.totals.unassessable, 1);
  assert.notEqual(report.totals.unassessable, 0);
});

test('reportId is filesystem- and branch-safe', () => {
  const id = reportId(new Date('2026-09-01T19:40:05.123Z'));
  assert.equal(id, 'scout-2026-09-01T19-40-05Z');
  assert.equal(/[:.]/.test(id), false);
});

test('the relevance thresholds travel with the report', async () => {
  const { report } = await runFixture();
  assert.deepEqual(report.relevance_thresholds, BANDS);
});

/* ---------------------------------------------------------- guard */

test('the guard permits only report files', () => {
  assert.deepEqual(violations(['agent/scout/reports/scout-x.json', 'agent/scout/reports/scout-x.md']), []);
  assert.deepEqual(violations(['data/sources.json']), ['data/sources.json']);
  assert.deepEqual(violations(['index.html']), ['index.html']);
  assert.deepEqual(violations(['agent/scout/scout.mjs']), ['agent/scout/scout.mjs'],
    'the Scout may not rewrite its own code in a scheduled run either');
  assert.deepEqual(violations(['.github/workflows/source-scout.yml']), ['.github/workflows/source-scout.yml']);
});

test('the guard is an allowlist, so an unimagined path is refused by default', () => {
  assert.deepEqual(violations(['some/path/nobody/thought/of.txt']), ['some/path/nobody/thought/of.txt']);
  assert.equal(ALLOWED.length, 1);
});
