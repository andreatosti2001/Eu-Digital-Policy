/* ============================================================
   agent/health/history.mjs — the historical health record

   SESSION 20 asks for a current view AND a historical record. The
   second is the one that makes the first mean anything: a single
   reading of "23 provenance gaps" says nothing, and "23, up from 19
   last week, and the four new ones are all in Part VII" says
   something a person can act on.

   WHERE IT LIVES, AND WHY THAT IS NOT AN AFTERTHOUGHT.

   `agent/health/history/` is GIT-IGNORED, deliberately and in the
   same breath as `agent/records/` and `agent/observability/runs/`.
   The reason is specific to this session rather than a convention
   copied over: the history contains PRIVATE CONTROL PLANE HEALTH
   DATA — how many approvals were void, which routes answer
   unauthenticated requests, which gate refused what — and this
   repository has no publication boundary. GitHub Pages serves `main`
   at the repository root with no `_config.yml`, no `.nojekyll` and
   no exclude list, so a git-tracked health record would be a health
   record ON THE PUBLIC WEB, which is precisely what SESSION 20
   forbids.

   A `.gitignore` entry is not a security boundary and this file does
   not pretend otherwise — `control_plane.control_room_assets_published`
   says so directly, and `agent/health/selftest.mjs` asserts both that
   the directory is ignored AND that a health artifact appearing in
   the published surface is a finding. The ignore rule is the
   strongest control available in a repository whose deployment unit
   is the whole tree.

   THE PUBLIC-SAFE SUBSET MAY BE PUBLISHED, and `writePublic()`
   writes it wherever the caller asks. Nothing calls it by default:
   publishing is a decision, and an agent that published on every run
   would have made it once for everybody.

   ONE FILE PER RUN, APPEND-ONLY, JSONL — the same shape as every
   other store here, for the same reasons: a crashed run leaves
   everything it managed to write, in order; it is greppable with no
   tooling; and nothing needs installing to read it.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HEALTH_ROOT = dirname(fileURLToPath(import.meta.url));
export const HISTORY_DIR = join(HEALTH_ROOT, 'history');
export const HISTORY_FILE = 'health.jsonl';
export const HISTORY_VERSION = 1;

export const historyPath = (dir = HISTORY_DIR) => join(dir, HISTORY_FILE);

/**
 * One entry per run. Readings are stored as {id, state, value, unit}
 * and NOT with their `detail` — the detail can be tens of kilobytes
 * per run, and a history that grows by a megabyte a day is a history
 * nobody keeps. The current view holds the detail; the history holds
 * the movement.
 */
export function entryFor({ readings, ctx, trace_id = null }) {
  return {
    history_version: HISTORY_VERSION,
    recorded_at: new Date().toISOString(),
    as_of: ctx.as_of,
    commit: ctx.commit,
    branch: ctx.branch,
    environment: ctx.environment,
    trace_id,
    /* What the run could and could not see. Without this, a reading
       of 0 browser regressions taken with no browser is
       indistinguishable from one taken with a browser, six months
       later, by somebody reading the history. */
    coverage: {
      validators_run: Boolean(ctx.validators),
      browser_run: Boolean(ctx.browser && ctx.browser.status !== 'skipped'),
      browser_status: ctx.browser?.status ?? (ctx.browser_requested ? 'errored' : 'not requested'),
      probe_run: Boolean(ctx.probe && !ctx.probe.error),
      traces_in_store: ctx.traces.length,
      records_in_store: ctx.records.byId.size,
    },
    readings: readings.map(({ metric, reading }) => ({
      id: metric.id,
      domain: metric.domain,
      direction: metric.direction,
      visibility: metric.visibility,
      state: reading.state,
      value: reading.value,
      unit: reading.unit,
      of: reading.of ?? null,
    })),
  };
}

export function append(entry, { dir = HISTORY_DIR } = {}) {
  mkdirSync(dir, { recursive: true });
  appendFileSync(historyPath(dir), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

/** Every entry, oldest first. A malformed line is REPORTED rather
 *  than skipped, for the same reason the approval ledger reports
 *  one: a store that quietly drops what it cannot read is a store
 *  that can be made to forget. */
export function read({ dir = HISTORY_DIR } = {}) {
  const file = historyPath(dir);
  if (!existsSync(file)) return { entries: [], malformed: [], path: file };
  const entries = [];
  const malformed = [];
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const e = JSON.parse(line);
      if (!e.recorded_at || !Array.isArray(e.readings)) { malformed.push({ line: i + 1, why: 'an entry must carry recorded_at and a readings array', raw: line.slice(0, 160) }); return; }
      entries.push(e);
    } catch (err) { malformed.push({ line: i + 1, why: `not JSON: ${err.message}`, raw: line.slice(0, 160) }); }
  });
  return { entries, malformed, path: file };
}

/* ---------------------------------------------------------- movement */

/**
 * What moved since the previous COMPARABLE entry.
 *
 * "Comparable" is the whole difficulty. A run with no browser
 * produces `unmeasurable` for six public-website metrics; comparing
 * that against a run that had one would report six improvements or
 * six regressions depending on which way round they fell, and both
 * would be fabrications. So a metric is compared only where BOTH
 * entries measured it, and everything else is reported as a coverage
 * change rather than as movement.
 *
 * AND NO MOVEMENT IS LABELLED GOOD OR BAD. `direction` is carried so
 * a reader can interpret it; `not_a_score` metrics are separated out
 * entirely, because a fall in unresolved claims is only good news if
 * verification work produced it and nothing here can tell.
 */
export function movement(current, previous) {
  if (!previous) {
    return {
      comparable: false,
      why: 'this is the first entry in the history. There is nothing to compare it against, and a first reading is a baseline rather than a movement.',
      changes: [], coverage_changes: [], not_a_score_changes: [],
    };
  }

  const prev = new Map(previous.readings.map((r) => [r.id, r]));
  const changes = [];
  const coverageChanges = [];
  const notAScore = [];

  for (const r of current.readings) {
    const p = prev.get(r.id);
    if (!p) { coverageChanges.push({ id: r.id, kind: 'new metric', now: r.state }); continue; }
    if (p.state !== r.state) {
      coverageChanges.push({ id: r.id, kind: 'measurement state changed', was: p.state, now: r.state, note: r.state === 'measured' ? 'it became measurable — the previous entry could not see it' : 'it stopped being measurable, so any comparison against the previous value would be against nothing' });
      continue;
    }
    if (r.state !== 'measured' || p.value === r.value) continue;

    const delta = { id: r.id, domain: r.domain, direction: r.direction, was: p.value, now: r.value, delta: r.value - p.value, unit: r.unit };
    if (r.direction === 'not_a_score') notAScore.push({ ...delta, note: 'NOT A SCORE. The only legitimate route for this number is work this monitor cannot see. Read the commit that moved it, not the direction.' });
    else changes.push(delta);
  }

  for (const p of previous.readings) if (!current.readings.some((r) => r.id === p.id)) {
    coverageChanges.push({ id: p.id, kind: 'metric removed', was: p.state });
  }

  return {
    comparable: true,
    since: previous.recorded_at,
    since_commit: previous.commit,
    changes,
    not_a_score_changes: notAScore,
    coverage_changes: coverageChanges,
    coverage_note: coverageDiff(current, previous),
  };
}

function coverageDiff(current, previous) {
  const a = current.coverage ?? {};
  const b = previous.coverage ?? {};
  const notes = [];
  if (a.browser_run !== b.browser_run) notes.push(`the browser ${a.browser_run ? 'ran this time and not last time' : 'ran last time and not this time'} — the six browser-sourced public-website metrics are not comparable across this pair`);
  if (a.validators_run !== b.validators_run) notes.push(`the validators ${a.validators_run ? 'ran this time and not last time' : 'ran last time and not this time'}`);
  if (a.probe_run !== b.probe_run) notes.push(`the loopback probe ${a.probe_run ? 'ran this time and not last time' : 'ran last time and not this time'}`);
  if (a.records_in_store !== b.records_in_store) notes.push(`the record store held ${b.records_in_store} records then and ${a.records_in_store} now — control-plane counts move with what has been run, not only with what is wrong`);
  return notes;
}

/** The last entry recorded before this one, or null. */
export function previousEntry({ dir = HISTORY_DIR } = {}) {
  const { entries } = read({ dir });
  return entries.length ? entries[entries.length - 1] : null;
}

/** A named series for one metric across the whole history. */
export function series(id, { dir = HISTORY_DIR } = {}) {
  const { entries } = read({ dir });
  return entries
    .map((e) => ({ at: e.recorded_at, as_of: e.as_of, commit: e.commit, ...(e.readings.find((r) => r.id === id) ?? { state: 'absent', value: null }) }))
    .filter((p) => p.state !== 'absent');
}

/* ---------------------------------------------------------- publishing */

/**
 * Write the public-safe subset wherever the caller asks.
 *
 * NOTHING CALLS THIS BY DEFAULT. Publishing is a decision, and an
 * agent that published on every run would have taken it once, for
 * everybody, without anyone deciding. `cli.mjs --publish <path>` is
 * the only caller, and it prints what it wrote.
 */
export function writePublic(view, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(view, null, 2)}\n`, 'utf8');
  return path;
}
