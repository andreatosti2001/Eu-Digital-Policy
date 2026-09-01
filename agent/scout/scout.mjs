/* ============================================================
   agent/scout/scout.mjs — the Source Scout

   DISCOVER → OBSERVE → REPORT → PR.  Never DISCOVER → EDIT.

   The Scout reads the watchlist, retrieves each endpoint, records
   what came back, decides which candidates this repository has
   not already seen, ranks them for a human's reading order, and
   writes two files. It then asks for approval it cannot grant
   itself. That is the whole agent.

   WHAT IT CANNOT DO, structurally and not by convention:

     · it never imports anything that writes data/*.json;
     · it never writes outside agent/scout/reports/;
     · it never marks a provenance record 'simulated' — that flag
       belongs to the observability demonstrator alone;
     · it never invents a field. A publisher that stated no date
       leaves `published: null`, and a relevance that could not be
       assessed is 'unknown', not zero.

   OBSERVABILITY. Everything goes through agent/observability's
   tracer: one orchestrator span, one agent span, a tool span per
   retrieval, and observation / decision / artifact / provenance /
   handoff / approval records hanging off them. There is no second
   logging path and no console.log used as one — the human-readable
   line printing at the end of a run is a rendering of the report,
   not the record of it.
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../observability/tracer.mjs';
import { get, retrievalMetadata } from './http.mjs';
import { extractCandidates } from './feed.mjs';
import { buildIndex, classify, dedupeWithinRun, celexOf } from './dedupe.mjs';
import { buildVocabulary, score, byRelevance } from './relevance.mjs';
import { buildReport, renderSummary, reportId } from './report.mjs';

export const SCOUT_ROOT = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(SCOUT_ROOT, '..', '..');
export const REPORTS_DIR = join(SCOUT_ROOT, 'reports');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Every earlier report's candidates, so a candidate proposed last
 *  week is not proposed again this week as though it were new. */
export function loadPriorCandidates(dir = REPORTS_DIR) {
  if (!existsSync(dir)) return { candidates: [], reports: 0, unreadable: [] };
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const candidates = [];
  const unreadable = [];
  for (const f of files) {
    try {
      const r = readJson(join(dir, f));
      for (const c of [...(r.candidates ?? []), ...(r.duplicates ?? [])]) {
        candidates.push({ ...c, report_id: r.report_id ?? f.replace(/\.json$/, '') });
      }
    } catch (err) {
      /* A corrupt earlier report weakens dedupe; it must be visible,
         not swallowed into a smaller index nobody notices. */
      unreadable.push({ file: f, message: err.message });
    }
  }
  return { candidates, reports: files.length, unreadable };
}

/**
 * Run one discovery pass.
 *
 * @param {object} opts
 *   fetch      — injected for the test suite; defaults to global fetch
 *   dir        — report output directory
 *   write      — false for a dry run: everything happens, nothing is saved
 *   limit      — cap candidates carried per watchlist entry
 *   environment— non-secret run context recorded in the report
 */
export async function runScout(opts = {}) {
  const {
    fetch: fetchImpl,
    dir = REPORTS_DIR,
    write = true,
    limit = 60,
    timeoutMs = 20000,
    environment = {},
    tracer: injectedTracer,
    registryPath = join(SCOUT_ROOT, 'registry.json'),
  } = opts;

  const startedAt = new Date().toISOString();
  const tracer = injectedTracer ?? new Tracer({ service: 'eu-digital-policy', env: environment.env ?? 'local' });

  const run = tracer.startRun({
    agent: 'orchestrator',
    task: 'source-scout scheduled discovery pass',
    attributes: { mode: 'DISCOVER → OBSERVE → REPORT → PR', write },
  });
  const scout = run.startAgent({ agent: 'scout', task: 'discover candidate sources for the EU digital acquis brief' });

  const problems = [];
  const retrievals = [];
  const allCandidates = [];
  let report, summary, id, reportPath, summaryPath;

  try {
    /* ---------------------------------------------- 1. load */
    const registry = readJson(registryPath);
    const watch = (registry.watchlist ?? []).filter((w) => w.enabled !== false);
    const sources = readJson(join(REPO_ROOT, 'data', 'sources.json')).sources ?? [];
    const instruments = readJson(join(REPO_ROOT, 'data', 'instruments.json')).instruments ?? [];
    const prior = loadPriorCandidates(dir);

    for (const u of prior.unreadable) {
      problems.push({ watch_id: null, kind: 'unreadable-prior-report',
        message: `${u.file} could not be parsed (${u.message}) — duplicate detection ran without it, so a candidate it held may be re-proposed as new` });
    }

    const index = buildIndex(sources, prior.candidates);
    const vocabulary = buildVocabulary(instruments);

    scout.observe({
      subject: 'known-corpus',
      summary: `Indexed ${sources.length} canonical sources and ${prior.candidates.length} candidates from ${prior.reports} earlier report(s)`,
      data: { index_sizes: index.sizes, vocabulary_terms: vocabulary.size, watchlist_enabled: watch.length, watchlist_total: (registry.watchlist ?? []).length },
      confidence: 1, risk: 'none',
    });

    /* ---------------------------------------------- 2. retrieve */
    for (const w of watch) {
      const tool = scout.startTool({ name: 'http.get', inputs: { watch_id: w.id, url: w.url, kind: w.kind } });
      const r = await get(w.url, { timeoutMs, fetch: fetchImpl });
      const meta = { watch_id: w.id, publisher_name: w.publisher_name, kind: w.kind, ...retrievalMetadata(r) };
      retrievals.push(meta);

      if (!r.ok) {
        problems.push({ watch_id: w.id, kind: `retrieval-${r.error?.kind ?? 'failed'}`,
          message: `${w.publisher_name}: ${r.error?.message ?? 'no response'} (${w.url})` });
        tool.observe({ subject: w.id, summary: `Retrieval failed: ${r.error?.kind ?? 'unknown'}`, data: meta, confidence: 1, risk: 'medium' });
        tool.end({ status: 'failed', outputs: meta });
        continue;
      }

      /* A real retrieval, so a real provenance record: url, the
         instant it was read, and the hash of exactly what came
         back. Role 'unresolved' — nothing here supports anything
         until a human reads it. */
      tool.provenance({
        source_id: `scout:${w.id}`,
        role: 'unresolved',
        url: r.final_url ?? w.url,
        title: `${w.publisher_name} — watchlist endpoint`,
        publisher: w.publisher_name,
        retrieved_at: r.retrieved_at,
        content_sha256: r.sha256,
        verification: { method: 'http-get', status: r.status, content_type: r.content_type, bytes: r.bytes, redirects: r.redirects.length },
      });

      if (r.truncated) {
        problems.push({ watch_id: w.id, kind: 'truncated-body',
          message: `${w.publisher_name}: the response exceeded the size cap and was truncated; candidates from it may be incomplete` });
      }
      const declared = (r.content_type ?? '').toLowerCase();
      if (w.kind === 'feed' && declared && !/(xml|rss|atom)/.test(declared)) {
        problems.push({ watch_id: w.id, kind: 'content-type-mismatch',
          message: `${w.publisher_name}: watchlist expects a feed but the server declared "${r.content_type}"` });
      }

      const parsed = extractCandidates(w.kind, r.body, { baseUrl: r.final_url ?? w.url });
      for (const m of parsed.problems) problems.push({ watch_id: w.id, kind: 'parse', message: `${w.publisher_name}: ${m}` });

      const kept = parsed.entries.slice(0, limit);
      if (parsed.entries.length > kept.length) {
        problems.push({ watch_id: w.id, kind: 'entry-cap',
          message: `${w.publisher_name}: ${parsed.entries.length} entries returned, ${kept.length} carried into the report (per-entry cap ${limit})` });
      }

      for (const e of kept) {
        allCandidates.push({
          candidate_id: `cand-${createHash('sha256').update(`${w.id}|${e.link ?? ''}|${e.title ?? ''}`).digest('hex').slice(0, 12)}`,
          watch_id: w.id,
          publisher: w.publisher ?? null,          /* null = not researched, never invented */
          publisher_name: w.publisher_name ?? null,
          expected_tier: w.tier ?? null,           /* the operator's prior, not a claim about this document */
          expected_type: w.expected_type ?? null,
          title: e.title,
          url: e.link,
          celex: celexOf(e.link),
          published: e.published,                  /* null = the publisher stated none */
          summary: e.summary,
          guid: e.guid,
          first_seen_at: r.retrieved_at,
          retrieval: { status: r.status, final_url: r.final_url, content_sha256: r.sha256, feed_format: parsed.format },
        });
      }

      tool.observe({
        subject: w.id,
        summary: `Retrieved ${r.bytes} bytes from ${w.publisher_name}; ${parsed.entries.length} entr(y/ies) parsed, ${kept.length} carried`,
        data: { ...meta, feed_format: parsed.format, parsed: parsed.entries.length, carried: kept.length, parse_problems: parsed.problems },
        confidence: parsed.problems.length ? 0.6 : 0.95,
        risk: parsed.problems.length ? 'low' : 'none',
      });
      tool.end({ status: 'ok', outputs: { carried: kept.length } });
    }

    /* ---------------------------------------------- 3. dedupe + rank */
    const { unique, collisions } = dedupeWithinRun(allCandidates);
    for (const c of collisions) {
      problems.push({ watch_id: null, kind: 'within-run-duplicate',
        message: `${c.candidate_id} repeats ${c.duplicate_of} (matched on ${c.key}); reported once` });
    }

    const fresh = [];
    const duplicates = [];
    for (const c of unique) {
      const verdict = classify(c, index);
      if (verdict.duplicate) { duplicates.push({ ...c, duplicate: verdict }); continue; }
      fresh.push({ ...c, relevance: score(c, vocabulary) });
    }
    fresh.sort(byRelevance);

    const high = fresh.filter((c) => c.relevance.band === 'high');
    const weakDupes = duplicates.filter((d) => d.duplicate.matched_on === 'title');
    if (weakDupes.length) {
      problems.push({ watch_id: null, kind: 'weak-duplicate-key',
        message: `${weakDupes.length} candidate(s) were suppressed on title alone, which is a weak key — confirm none was a distinct document` });
    }

    scout.decide({
      decision: `Report ${fresh.length} new candidate(s), ${high.length} at band high; suppress ${duplicates.length} already-known`,
      rationale:
        'Duplicates are matched on CELEX, then normalised URL, then normalised title, strongest key first. ' +
        'Relevance is derived from data/instruments.json at run time and decides reading order only. ' +
        'Nothing is promoted to a source record by this run: the Scout has no write access to data/*.json ' +
        'and a candidate becomes a source only after a human opens the document.',
      alternatives: [
        'Write the high-relevance candidates straight into data/sources.json — rejected: RED tier in docs/AI-SAFE-BOUNDARIES.md §3, and a source record requires a document actually read.',
        'Suppress low and none bands entirely — rejected: the band is triage, and a discarded candidate is invisible to the reviewer who might have recognised it.',
        'Drop candidates with no title or summary — rejected: unassessable is not irrelevant, and unknown is never zero.',
      ],
      confidence: 0.9,
      risk: fresh.length ? 'low' : 'none',
    });

    /* ---------------------------------------------- 4. report */
    const finishedAt = new Date().toISOString();
    id = reportId(new Date(finishedAt));
    const built = buildReport({
      reportId: id, startedAt, finishedAt,
      traceId: run.trace_id, runId: run.run_id,
      watchlist: { total: (registry.watchlist ?? []).length, enabled: watch.length },
      retrievals, candidates: fresh, duplicates, problems,
      environment, indexSizes: index.sizes, vocabularySize: vocabulary.size,
    });
    report = built.report;
    summary = renderSummary(report);

    reportPath = join(dir, `${id}.json`);
    summaryPath = join(dir, `${id}.md`);
    const json = `${JSON.stringify(report, null, 2)}\n`;

    if (write) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(reportPath, json, 'utf8');
      writeFileSync(summaryPath, `${summary}\n`, 'utf8');
    }

    scout.artifact({
      artifact_id: id,
      artifact_type: 'discovery-report',
      path: relative(REPO_ROOT, reportPath),
      sha256: createHash('sha256').update(json).digest('hex'),
      bytes: Buffer.byteLength(json),
      preview: `${report.totals.new_candidates} new · ${report.totals.high_relevance} high · ${report.totals.duplicates} duplicate · ${report.totals.retrievals_failed} failed`,
    });

    for (const c of high) {
      scout.provenance({
        source_id: c.candidate_id,
        role: 'unresolved',
        url: c.url,
        title: c.title,
        publisher: c.publisher_name,
        retrieved_at: c.first_seen_at,
        verification: {
          method: 'listed-in-publisher-feed',
          reviewed_by_human: false,
          note: 'Discovered by the Scout in the publisher’s own feed. The document itself has NOT been opened or read. This record establishes that the listing existed at retrieved_at and nothing more.',
        },
        instrument_ids: c.relevance.instrument_ids,
      });
    }

    scout.handoff({
      to_agent: 'human-reviewer',
      reason: 'A candidate becomes a source record only after a person opens the document and reads it.',
      artifact_ids: [id],
      payload: { new_candidates: fresh.length, high_relevance: high.length, failed_retrievals: retrievals.filter((r) => !r.ok).length },
    });
    scout.approval({
      approval_id: `appr-${id}`,
      state: 'requested',
      subject: `Promote any of ${fresh.length} candidate(s) from ${id} into data/sources.json`,
      requested_of: 'repository maintainer',
      artifact_ids: [id],
      risk: 'high',
      note: 'RED tier: creating a sources.json record from anything other than a document actually retrieved and read.',
    });

    scout.observe({
      subject: 'run-outcome',
      summary: `${report.status}: ${report.totals.new_candidates} new, ${report.totals.high_relevance} high, ${report.totals.duplicates} duplicate, ${report.totals.retrievals_failed} failed retrieval(s), ${report.totals.unresolved_problems} unresolved problem(s)`,
      data: report.totals,
      confidence: 1,
      risk: report.status === 'failed' ? 'high' : report.status === 'degraded' ? 'medium' : 'none',
    });

    scout.end({ status: report.status === 'failed' ? 'failed' : 'ok', outputs: report.totals, confidence: 0.9, risk: report.status === 'ok' ? 'low' : 'medium' });
    run.end({ status: report.status === 'failed' ? 'failed' : 'ok', outputs: { report_id: id, status: report.status } });

    return { report, summary, reportPath, summaryPath, trace_id: run.trace_id, wrote: write };
  } catch (err) {
    scout.error(err, { fatal: true });
    if (!scout.ended) scout.end({ status: 'failed' });
    if (!run.ended) run.end({ status: 'failed', error: { message: err.message } });
    throw err;
  }
}
