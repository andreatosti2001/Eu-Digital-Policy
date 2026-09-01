/* ============================================================
   agent/scout/report.mjs — the two things a run leaves behind

   A machine-readable report (JSON) and a human-readable summary
   (Markdown). Both describe the same run; neither is derived from
   the other at read time, because they are written together from
   one in-memory result and then never edited.

   WHY TWO. The JSON is what the next run diffs against — it is
   how a candidate reported last week is recognised as already
   seen. The Markdown is what a person reads in a pull request,
   and no one reviews a 200 KB JSON diff honestly.

   THE REPORT IS A PROPOSAL, NOT A DATASET. Nothing here is a
   data/sources.json record and nothing here may be copied into
   one without a human opening the document. Every report says so
   in its own body, in both formats, because a convention in a
   runbook is easier to lose than a sentence in the artefact.

   FIVE SECTIONS ARE MANDATORY, and they are written even when
   empty. A section that disappears when its count is zero
   teaches a reader to skim, and then a section that reappears is
   missed:

     new sources · duplicate sources · failed retrievals ·
     high-relevance candidates · unresolved retrieval problems

   NO SECRET REACHES A REPORT. Every report is passed through the
   observability layer's redactor — the same one, by key and by
   value — on the way out, and the count it removed is printed in
   the report. A redactor whose work is invisible is a redactor
   nobody notices has broken.
   ============================================================ */

import { redact } from '../observability/redact.mjs';
import { BANDS, BAND_ORDER } from './relevance.mjs';

export const REPORT_SCHEMA_VERSION = 1;

/** A filesystem- and branch-safe id derived from the run instant. */
export function reportId(when = new Date()) {
  return `scout-${when.toISOString().replace(/[:.]/g, '-').replace(/-\d{3}Z$/, 'Z')}`;
}

const isHigh = (c) => c.relevance.band === 'high';

/**
 * Assemble the machine-readable report.
 * @returns {{report:object, redactions:number}}
 */
export function buildReport({
  reportId: id, startedAt, finishedAt, traceId, runId,
  watchlist, retrievals, candidates, duplicates, problems,
  environment, indexSizes, vocabularySize,
}) {
  const failedRetrievals = retrievals.filter((r) => !r.ok);
  const unassessable = candidates.filter((c) => c.relevance.band === 'unknown');

  const draft = {
    $schema_version: REPORT_SCHEMA_VERSION,
    $description:
      'A Source Scout discovery report. This is a PROPOSAL produced by a read-only agent, not a dataset. ' +
      'No record here is a data/sources.json source record, and none may become one until a human has opened ' +
      'the document at the URL and read it. Relevance bands are triage for reading order and are not evidence.',
    $boundaries:
      'The Scout never edits data/*.json, never edits site markup, and never opens a pull request that touches ' +
      'anything outside agent/scout/reports/. A candidate is what a publisher’s feed said, recorded verbatim; ' +
      'nothing in this file was authored from model knowledge.',

    report_id: id,
    generated_at: finishedAt,
    started_at: startedAt,
    duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
    trace_id: traceId,
    run_id: runId,
    mode: 'DISCOVER → OBSERVE → REPORT → PR',
    environment,

    status: failedRetrievals.length === retrievals.length && retrievals.length > 0
      ? 'failed'
      : failedRetrievals.length || problems.length ? 'degraded' : 'ok',

    totals: {
      watchlist_entries: watchlist.total,
      watchlist_enabled: watchlist.enabled,
      retrievals_attempted: retrievals.length,
      retrievals_ok: retrievals.length - failedRetrievals.length,
      retrievals_failed: failedRetrievals.length,
      candidates_seen: candidates.length + duplicates.length,
      new_candidates: candidates.length,
      duplicates: duplicates.length,
      high_relevance: candidates.filter(isHigh).length,
      /* Counted separately and never folded into 'none': a candidate
         that could not be assessed is not a candidate judged irrelevant. */
      unassessable: unassessable.length,
      unresolved_problems: problems.length,
    },

    relevance_thresholds: BANDS,
    known_index_sizes: indexSizes,
    vocabulary_terms: vocabularySize,

    retrievals,
    candidates,
    duplicates,
    problems,
  };

  const { value, redactions } = redact(draft);
  value.redactions = redactions;
  return { report: value, redactions };
}

/* ---------------------------------------------------------- markdown */

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const trunc = (s, n) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const link = (title, url) => (url ? `[${esc(trunc(title || url, 110))}](${url})` : esc(trunc(title || '(untitled)', 110)));

/** `null` and `unknown` must not render alike, here as anywhere. */
const cell = (v) => (v === null || v === undefined ? '—' : v === 'unknown' ? '*unknown*' : esc(v));

export function renderSummary(report) {
  const t = report.totals;
  const L = [];
  const p = (s = '') => L.push(s);

  p(`# Source Scout — ${report.report_id}`);
  p();
  p(`**Status:** \`${report.status}\` · **Mode:** ${report.mode} · **Run:** \`${report.trace_id}\``);
  p(`**Started:** ${report.started_at} · **Finished:** ${report.generated_at} (${report.duration_ms} ms)`);
  p();
  p('> This report is a **proposal from a read-only agent**. Nothing in it is a source record.');
  p('> No candidate may be added to `data/sources.json` until a human has opened the document');
  p('> and read it. Relevance bands are reading order, not evidence, and not a legal judgement.');
  p();

  p('| | count |');
  p('|---|---:|');
  p(`| Watchlist entries (enabled) | ${t.watchlist_entries} (${t.watchlist_enabled}) |`);
  p(`| Retrievals attempted | ${t.retrievals_attempted} |`);
  p(`| Retrievals failed | ${t.retrievals_failed} |`);
  p(`| New candidates | ${t.new_candidates} |`);
  p(`| Duplicates suppressed | ${t.duplicates} |`);
  p(`| High relevance | ${t.high_relevance} |`);
  p(`| Not assessable | ${t.unassessable} |`);
  p(`| Unresolved retrieval problems | ${t.unresolved_problems} |`);
  p();

  /* ---- 1. high-relevance candidates ---- */
  p('## High-relevance candidates');
  p();
  p(`Band \`high\` means the title or summary contained an exact instrument identifier, or several`);
  p(`independent signals (score ≥ ${BANDS.find((b) => b.band === 'high').min}). The matched terms are shown so the band can be audited.`);
  p();
  const high = report.candidates.filter(isHigh);
  if (!high.length) {
    p('_None in this run._');
  } else {
    p('| Candidate | Publisher | Published | Score | Matched terms | Instruments |');
    p('|---|---|---|---:|---|---|');
    for (const c of high) {
      p(`| ${link(c.title, c.url)} | ${cell(c.publisher_name)} | ${cell(c.published)} | ${c.relevance.score} | ${esc(c.relevance.matched.map((m) => m.term).join(', '))} | ${esc(c.relevance.instrument_ids.join(', '))} |`);
    }
  }
  p();

  /* ---- 2. new sources ---- */
  p('## New sources');
  p();
  p('Everything not matched against `data/sources.json` or an earlier report, in reading order.');
  p();
  if (!report.candidates.length) {
    p('_No new candidates in this run._');
  } else {
    p('| Band | Candidate | Publisher | Published | From |');
    p('|---|---|---|---|---|');
    for (const c of report.candidates) {
      p(`| \`${c.relevance.band}\` | ${link(c.title, c.url)} | ${cell(c.publisher_name)} | ${cell(c.published)} | \`${esc(c.watch_id)}\` |`);
    }
    const unassessable = report.candidates.filter((c) => c.relevance.band === 'unknown');
    if (unassessable.length) {
      p();
      p(`**${unassessable.length} candidate(s) could not be assessed** — the publisher supplied neither a title nor a summary.`);
      p('They are listed above with band `unknown`. Unknown is not a zero and they are not ranked last as though judged.');
    }
  }
  p();

  /* ---- 3. duplicate sources ---- */
  p('## Duplicate sources');
  p();
  p('Suppressed because this repository has already seen them. The matching key is named so a');
  p('wrong suppression is visible: `celex` and `url` are exact, `title` is a **weak** key and a');
  p('match on it alone is worth a glance.');
  p();
  if (!report.duplicates.length) {
    p('_None in this run._');
  } else {
    p('| Candidate | Matched on | Already known as | Confidence |');
    p('|---|---|---|---|');
    for (const d of report.duplicates) {
      const m = d.duplicate.matched ?? {};
      p(`| ${link(d.title, d.url)} | \`${esc(d.duplicate.matched_on)}\` | ${esc(m.id ?? m.title ?? '?')} — ${esc(m.origin ?? '?')} | ${esc(d.duplicate.confidence)} |`);
    }
  }
  p();

  /* ---- 4. failed retrievals ---- */
  p('## Failed retrievals');
  p();
  p('A watchlist entry the Scout could not read this run. A failure is a result, not an exception:');
  p('the run continues and records it here.');
  p();
  const failed = report.retrievals.filter((r) => !r.ok);
  if (!failed.length) {
    p('_All enabled watchlist entries were retrieved._');
  } else {
    p('| Watch | URL | Kind | Status | Reason |');
    p('|---|---|---|---:|---|');
    for (const r of failed) {
      p(`| \`${esc(r.watch_id)}\` | ${esc(trunc(r.requested_url, 80))} | \`${esc(r.error?.kind ?? '?')}\` | ${cell(r.status)} | ${esc(trunc(r.error?.message, 120))} |`);
    }
  }
  p();

  /* ---- 5. unresolved retrieval problems ---- */
  p('## Unresolved retrieval problems');
  p();
  p('Broader than a failed request: an entry that resolved but produced nothing usable, a feed that');
  p('changed shape, a truncated body, a content type that did not match what the watchlist expected.');
  p('These need an operator, not a re-run — a scheduled agent that quietly returns zero every week is');
  p('indistinguishable from one that is working.');
  p();
  if (!report.problems.length) {
    p('_None._');
  } else {
    p('| Watch | Kind | Problem |');
    p('|---|---|---|');
    for (const pr of report.problems) {
      p(`| \`${esc(pr.watch_id ?? '—')}\` | \`${esc(pr.kind)}\` | ${esc(trunc(pr.message, 200))} |`);
    }
  }
  p();

  p('---');
  p();
  p(`Machine-readable report: \`agent/scout/reports/${report.report_id}.json\``);
  p(`Redactions applied on the way out: **${report.redactions ?? 0}**`);
  p();
  p('Operating the Scout, and what to do with this report: [`docs/AGENT-RUNBOOK.md`](../../docs/AGENT-RUNBOOK.md)');
  p();
  return L.join('\n');
}

export { BAND_ORDER };
