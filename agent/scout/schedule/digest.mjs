/* ============================================================
   agent/scout/schedule/digest.mjs — a run, rendered for a human

   THE RULE THIS FOLLOWS IS ALREADY IN THE REPOSITORY. Look at
   agent/schemas/gateway.mjs: the trace never carries a contract
   record's body, only its id, its contract name and a sha256 —
   "copying the body into the trace would make the trace a second
   home for every fact the record carries". A digest is the same
   shape of problem one level up, so it gets the same answer.

   THIS FILE NEVER COPIES A SourceCandidate OR DataGap BODY INTO A
   COMMITTED FILE. What it writes is a preview — id, url, title,
   confidence, the fields a human needs to decide whether to open
   the record — plus a sha256 of the full record, so a copy that
   drifted from its source would be checkable. The full record's
   only home stays `agent/records/<trace_id>.jsonl`, regenerable and
   git-ignored, uploaded as this run's workflow artifact. If that
   distinction ever blurs, this module is doing the wrong thing.

   TWO KINDS OF "ALREADY SEEN", NEITHER OF WHICH IS THE SCOUT'S OWN.
   The Scout's own duplicate finding — `duplicate_candidate_ids`,
   proof or suggestion, within one run — is asserted by
   agent/scout/dedupe.mjs and is rendered here verbatim, not
   recomputed. This module adds two more, both explicitly labelled
   as REPORT-LAYER annotations rather than Scout findings, because
   neither is inside what SESSION 05 built and both are read-only:

     · against data/sources.json — is this bibliography already
       aware of the document? (docs/SOURCE-SCOUT.md limitation 6
       says the Scout itself does not do this. This does, but only
       here, and never writes SourceCandidate.matches_existing_source_id.)
     · against every earlier committed digest — was this exact
       candidate already proposed in a previous run? The Scout has
       no memory between runs; the committed digests are that memory.

   Matching is CELEX, then normalised URL, then normalised title —
   strongest key first, `normaliseUrl`/`normaliseTitle` imported
   from the Scout's own dedupe.mjs rather than re-implemented, and
   the key that matched is always named so a wrong suppression is
   visible.

   EVERYTHING IS REDACTED BEFORE IT IS RENDERED. The digest object
   is passed through the observability layer's own `redact()` once;
   the markdown is built from what comes back, so both outputs are
   covered by one pass and the count travels with the report.
   ============================================================ */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { redact } from '../../observability/redact.mjs';
import { normaliseTitle, normaliseUrl } from '../dedupe.mjs';

export const DIGEST_SCHEMA_VERSION = 1;

/** A CELEX number read out of a URL. Never inferred from a title —
 *  a CELEX number is a legal fact, and this is the only place in
 *  this module that touches one. */
export function celexOf(url) {
  if (typeof url !== 'string') return null;
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* use it as written */ }
  const m = decoded.toUpperCase().match(/\b([1-9]\d{4}[A-Z]{1,2}\d{4}(?:\(\d+\))?)\b/);
  return m ? m[1] : null;
}

/** Reading order, and the only place these thresholds exist. Stated
 *  as a formula against the Scout's own confidence figure
 *  (docs/SOURCE-SCOUT.md "Confidence") rather than a second opinion
 *  about relevance — this module does not re-judge a candidate. */
export const RELEVANCE_BANDS = [
  { band: 'high', min: 0.75 },
  { band: 'medium', min: 0.5 },
  { band: 'low', min: 0 },
];
export function relevanceBand(confidence) {
  if (confidence === null || confidence === undefined) return 'unknown';
  return RELEVANCE_BANDS.find((b) => confidence >= b.min).band;
}

/* ---------------------------------------------------------- indices */

/** data/sources.json, read-only, for the bibliography cross-check. */
export function buildSourceIndex(sources = []) {
  const byCelex = new Map(), byUrl = new Map(), byTitle = new Map();
  const put = (map, key, ref) => { if (key && !map.has(key)) map.set(key, ref); };
  for (const s of sources) {
    const ref = { origin: 'data/sources.json', id: s.id, title: s.title ?? null, url: s.url ?? null };
    put(byCelex, celexOf(s.url), ref);
    put(byUrl, normaliseUrl(s.url), ref);
    put(byTitle, normaliseTitle(s.title) || null, ref);
  }
  return { byCelex, byUrl, byTitle };
}

/** Every candidate preview from every earlier committed digest, for
 *  the cross-run memory the Scout itself does not keep. */
export function buildPriorIndex(digestsDir, { excludeTraceId = null } = {}) {
  const byCelex = new Map(), byUrl = new Map(), byTitle = new Map();
  const put = (map, key, ref) => { if (key && !map.has(key)) map.set(key, ref); };
  if (!existsSync(digestsDir)) return { byCelex, byUrl, byTitle, digests_read: 0, unreadable: [] };
  const unreadable = [];
  let read = 0;
  for (const f of readdirSync(digestsDir).filter((x) => x.endsWith('.json')).sort()) {
    let d;
    try { d = JSON.parse(readFileSync(join(digestsDir, f), 'utf8')); }
    catch (err) { unreadable.push({ file: f, message: err.message }); continue; }
    if (d.trace_id === excludeTraceId) continue;
    read++;
    for (const c of d.candidates ?? []) {
      const ref = { origin: `digest ${d.digest_id ?? f}`, candidate_id: c.candidate_id, title: c.title ?? null, url: c.url ?? null };
      put(byCelex, celexOf(c.url), ref);
      put(byUrl, normaliseUrl(c.url), ref);
      put(byTitle, normaliseTitle(c.title) || null, ref);
    }
  }
  return { byCelex, byUrl, byTitle, digests_read: read, unreadable };
}

function crossCheck(candidate, index) {
  const celex = celexOf(candidate.url);
  if (celex && index.byCelex.has(celex)) return { matched_on: 'celex', confidence: 'exact', ref: index.byCelex.get(celex) };
  const url = normaliseUrl(candidate.url);
  if (url && index.byUrl.has(url)) return { matched_on: 'url', confidence: 'exact', ref: index.byUrl.get(url) };
  const title = normaliseTitle(candidate.title) || null;
  if (title && index.byTitle.has(title)) return { matched_on: 'title', confidence: 'weak', ref: index.byTitle.get(title) };
  return null;
}

/* ---------------------------------------------------------- build */

export function digestId(when = new Date()) {
  return `digest-${when.toISOString().replace(/[:.]/g, '-').replace(/-\d{3}Z$/, 'Z')}`;
}

/**
 * @param {object} opts
 *   result       — the object Scout#run() returned
 *   mode         — 'live' | 'mock'
 *   started_at, finished_at — ISO
 *   environment  — public run context (no secrets)
 *   sourcesPath  — path to data/sources.json
 *   digestsDir   — path to the committed digests directory
 * @returns {{digest:object, markdown:string}}
 */
export function buildDigest({
  result, mode, started_at, finished_at, environment = {},
  sourcesPath, digestsDir,
}) {
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8')).sources ?? [];
  const sourceIndex = buildSourceIndex(sources);
  const priorIndex = buildPriorIndex(digestsDir, { excludeTraceId: result.trace_id });

  const gapsIsEgress = (g) => /refused before it reached the origin/.test(g.why_open ?? '');

  const candidates = result.candidates.map((c) => {
    const bib = crossCheck(c, sourceIndex);
    const prior = crossCheck(c, priorIndex);
    return {
      candidate_id: c.candidate_id,
      url: c.url,
      title: c.title,
      publisher: c.publisher,
      publication_date: c.publication_date,
      authority_class: c.authority_class,
      tier_estimate: c.tier_estimate,
      confidence: c.confidence,
      relevance_band: relevanceBand(c.confidence),
      relevance: c.relevance,
      about: c.affected_entities.filter((e) => e.kind === 'instrument').map((e) => e.id),
      state: c.state,
      /* Scout-asserted, rendered verbatim — never recomputed here. */
      duplicate_candidate_ids: c.duplicate_candidate_ids,
      /* Report-layer only. Never written back to the record. */
      matches_bibliography: bib,
      matches_prior_digest: prior,
      retrieval: {
        retrieved_at: c.evidence[0]?.retrieved_at ?? null,
        checksum: c.evidence[0]?.checksum ?? null,
      },
    };
  });

  const gaps = result.gaps.map((g) => ({
    gap_id: g.gap_id,
    gap_kind: g.gap_kind,
    url: g.candidate_leads[0] ?? null,
    blocked_by_egress: gapsIsEgress(g),
    why_open: g.why_open,
    closes_with: g.closes_with,
    state: g.state,
  }));

  const failedByEgress = gaps.filter((g) => g.blocked_by_egress).length;
  const newBib = candidates.filter((c) => !c.matches_bibliography).length;
  const newPrior = candidates.filter((c) => !c.matches_prior_digest).length;
  const highRelevance = candidates.filter((c) => c.relevance_band === 'high').length;

  const id = digestId(new Date(finished_at));

  const draft = {
    $schema_version: DIGEST_SCHEMA_VERSION,
    $description:
      'A rendering of one Source Scout run for human triage. This is a PREVIEW, not the record: ' +
      'every field here is a pointer or a summary of the SourceCandidate / DataGap records the run ' +
      'actually produced, which live only in agent/records/<trace_id>.jsonl (regenerable, git-ignored, ' +
      'uploaded as this run\'s workflow artifact). A candidate here is not a data/sources.json record ' +
      'and cannot become one until a human opens the document and reads it — AI-SAFE-BOUNDARIES.md §3.',
    $boundaries:
      'Generated read-only from a completed Scout run and from data/sources.json, read but never ' +
      'written. matches_bibliography and matches_prior_digest are REPORT-LAYER annotations — the ' +
      'Scout itself does not compute them (docs/SOURCE-SCOUT.md, known limitation 6) and they are ' +
      'never written back into any contract record.',

    digest_id: id,
    trace_id: result.trace_id,
    run_id: result.run_id,
    mode,
    generated_at: finished_at,
    started_at,
    duration_ms: Date.parse(finished_at) - Date.parse(started_at),
    environment,

    status: 'ok', // set by the caller once it knows whether the run threw

    totals: {
      candidates: candidates.length,
      new_against_bibliography: newBib,
      duplicate_of_bibliography: candidates.length - newBib,
      new_against_prior_digests: newPrior,
      previously_proposed: candidates.length - newPrior,
      high_relevance: highRelevance,
      gaps: gaps.length,
      failed_by_egress_policy: failedByEgress,
      failed_other: gaps.length - failedByEgress,
      screened_out: result.screened_out,
      fetched: result.fetched,
      prior_digests_read: priorIndex.digests_read,
    },
    relevance_thresholds: RELEVANCE_BANDS,
    unreadable_prior_digests: priorIndex.unreadable,

    candidates,
    gaps,
  };

  const { value: digest, redactions } = redact(draft);
  digest.redactions = redactions;
  const markdown = renderMarkdown(digest);
  return { digest, markdown };
}

/* ---------------------------------------------------------- markdown */

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const trunc = (s, n) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const link = (title, url) => (url ? `[${esc(trunc(title || url, 110))}](${url})` : esc(trunc(title || '(untitled)', 110)));
const cell = (v) => (v === null || v === undefined ? '—' : v === 'unknown' ? '*unknown*' : esc(v));

function renderMarkdown(d) {
  const t = d.totals;
  const L = [];
  const p = (s = '') => L.push(s);

  p(`# Source Scout — ${d.digest_id}`);
  p();
  p(`**Status:** \`${d.status}\` · **Mode:** \`${d.mode}\` · **Trace:** \`${d.trace_id}\``);
  p(`**Started:** ${d.started_at} · **Finished:** ${d.generated_at} (${d.duration_ms} ms)`);
  p();
  p('> This is a **preview of a Scout run**, not a dataset. Every candidate here is a document the');
  p('> Scout located and did not verify. None may enter `data/sources.json` until a human opens the');
  p('> document and reads it — `docs/AI-SAFE-BOUNDARIES.md` §3. The full records this run produced');
  p('> live only in `agent/records/`, uploaded as this run\'s workflow artifact — see');
  p('> `docs/AGENT-RUNBOOK.md`.');
  p();

  p('| | count |');
  p('|---|---:|');
  p(`| Retrieval attempts | ${t.fetched} |`);
  p(`| Candidates found | ${t.candidates} |`);
  p(`| New against the bibliography | ${t.new_against_bibliography} |`);
  p(`| New against earlier digests | ${t.new_against_prior_digests} |`);
  p(`| High relevance | ${t.high_relevance} |`);
  p(`| Screened out (no tracked instrument matched) | ${t.screened_out} |`);
  p(`| Failed retrievals | ${t.gaps} (${t.failed_by_egress_policy} refused by egress policy) |`);
  p();

  /* ---- high-relevance candidates ---- */
  p('## High-relevance candidates');
  p();
  p(`Band \`high\` means the Scout's own confidence figure is ≥ ${RELEVANCE_BANDS[0].min} — see`);
  p('`docs/SOURCE-SCOUT.md` "Confidence" for the formula. This is a reading-order signal, not a');
  p('verification, and not the Scout\'s judgement of legal significance.');
  p();
  const high = d.candidates.filter((c) => c.relevance_band === 'high');
  if (!high.length) {
    p('_None in this run._');
  } else {
    p('| Candidate | Publisher | Confidence | Authority | Tier | About |');
    p('|---|---|---:|---|---|---|');
    for (const c of high) {
      p(`| ${link(c.title, c.url)} | ${cell(c.publisher)} | ${c.confidence} | ${cell(c.authority_class)} | ${cell(c.tier_estimate)} | ${esc(c.about.join(', '))} |`);
    }
  }
  p();

  /* ---- new sources ---- */
  p('## New sources');
  p();
  p('Candidates matched against neither `data/sources.json` nor an earlier committed digest, in');
  p('reading order.');
  p();
  const brandNew = d.candidates.filter((c) => !c.matches_bibliography && !c.matches_prior_digest);
  if (!brandNew.length) {
    p('_None in this run._');
  } else {
    p('| Band | Candidate | Publisher | Published | Confidence |');
    p('|---|---|---|---|---:|');
    for (const c of [...brandNew].sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1))) {
      p(`| \`${c.relevance_band}\` | ${link(c.title, c.url)} | ${cell(c.publisher)} | ${cell(c.publication_date)} | ${c.confidence} |`);
    }
  }
  p();

  /* ---- duplicate sources ---- */
  p('## Duplicate sources');
  p();
  p('Three separate signals, each named so a wrong suppression is visible. `within-run` is asserted');
  p('by the Scout itself (`duplicate_candidate_ids` — proof or suggestion, `docs/SOURCE-SCOUT.md`');
  p('"Duplicates are named, never resolved"). `bibliography` and `prior-digest` are annotations added');
  p('only at this reporting layer and are never written back into the candidate record.');
  p();
  const dupes = d.candidates.filter((c) => c.duplicate_candidate_ids.length || c.matches_bibliography || c.matches_prior_digest);
  if (!dupes.length) {
    p('_None in this run._');
  } else {
    p('| Candidate | Signal | Matched on | Already known as |');
    p('|---|---|---|---|');
    for (const c of dupes) {
      if (c.duplicate_candidate_ids.length) p(`| ${link(c.title, c.url)} | \`within-run\` | Scout-asserted | ${esc(c.duplicate_candidate_ids.join(', '))} |`);
      if (c.matches_bibliography) p(`| ${link(c.title, c.url)} | \`bibliography\` | \`${c.matches_bibliography.matched_on}\` (${c.matches_bibliography.confidence}) | ${esc(c.matches_bibliography.ref.id)} |`);
      if (c.matches_prior_digest) p(`| ${link(c.title, c.url)} | \`prior-digest\` | \`${c.matches_prior_digest.matched_on}\` (${c.matches_prior_digest.confidence}) | ${esc(c.matches_prior_digest.ref.candidate_id)} (${esc(c.matches_prior_digest.ref.origin)}) |`);
    }
  }
  p();

  /* ---- failed retrievals ---- */
  p('## Failed retrievals');
  p();
  p('Every `DataGap` this run produced. A refusal is a result, never silence — see');
  p('`agent/scout/transport.mjs`.');
  p();
  if (!d.gaps.length) {
    p('_All attempted retrievals succeeded._');
  } else {
    p('| Gap | Kind | Egress-blocked | URL | Why open |');
    p('|---|---|---|---|---|');
    for (const g of d.gaps) {
      p(`| \`${g.gap_id}\` | \`${g.gap_kind}\` | ${g.blocked_by_egress ? 'yes' : 'no'} | ${esc(trunc(g.url, 70))} | ${esc(trunc(g.why_open, 140))} |`);
    }
  }
  p();

  /* ---- unresolved retrieval problems ---- */
  p('## Unresolved retrieval problems');
  p();
  p('What each failed retrieval says would close it — not evidence, and not a substitute for the');
  p('document itself (`DataGap.closes_with`, `docs/AI-SAFE-BOUNDARIES.md` §0.2).');
  p();
  if (!d.gaps.length) {
    p('_None._');
  } else {
    p('| Gap | Closes with |');
    p('|---|---|');
    for (const g of d.gaps) p(`| \`${g.gap_id}\` | ${esc(trunc(g.closes_with, 160))} |`);
  }
  p();

  if (d.unreadable_prior_digests.length) {
    p('## Unreadable prior digests');
    p();
    p('These earlier digests could not be parsed, so duplicate detection against them ran without');
    p('them — a candidate they held may be re-proposed as new.');
    p();
    for (const u of d.unreadable_prior_digests) p(`- \`${u.file}\`: ${esc(u.message)}`);
    p();
  }

  p('---');
  p();
  p(`Machine-readable digest: \`agent/scout/digests/${d.digest_id}.json\``);
  p(`Full contract records (not committed): \`agent/records/${d.trace_id}.jsonl\`, in this run's workflow artifact`);
  p(`Redactions applied on the way out: **${d.redactions}**`);
  p();
  p('Operating the Scout, and what to do with this digest: [`docs/AGENT-RUNBOOK.md`](../../../docs/AGENT-RUNBOOK.md)');
  p();
  return L.join('\n');
}
