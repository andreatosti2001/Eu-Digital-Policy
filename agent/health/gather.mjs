/* ============================================================
   agent/health/gather.mjs — the evidence, collected once

   Every metric is a pure function of this context. That is the whole
   design: a metric that ran its own subprocess would make the run
   quadratic in the number of metrics, and — the part that matters —
   two metrics reading the tree at different moments could disagree
   about it, which is how a health report starts describing a
   repository that never existed.

   SO IT IS COLLECTED ONCE, WITH A DATE AND A COMMIT, and every
   reading below is a statement about that snapshot. `asOf` is
   required for the same reason it is required in every other agent
   here: derived output depends on the reader's clock
   (docs/AUDIT-2026-09-01.md F-15), and "the site has not changed"
   and "nobody has looked" are different findings that only a stated
   date separates.

   THE BROWSER IS OPTIONAL AND ITS ABSENCE IS CARRIED, NOT HIDDEN.
   `gather({ browser: false })` leaves `ctx.browser` null, and every
   metric sourced from it returns `unmeasurable` with the reason —
   never zero. A health report that said "0 console errors" because
   nobody opened a page would be the worst single line this monitor
   could produce.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, readBaseline } from '../implement/baseline.mjs';
import { runValidators } from '../implement/checks.mjs';
import { publicSurface, scanSecrets, controlPlaneExposure } from '../implement/boundary.mjs';
import { readAgentRecords, readLedger, surveyProposals } from '../implement/ledger.mjs';
import { runBrowserQA } from '../browser/runner.mjs';
import { listRuns, loadTrace } from '../observability/query.mjs';
import { serve } from '../observability/server.mjs';
import { analyseAll } from './security.mjs';

export const DATASETS = [
  'applicability', 'brief', 'claims', 'enforcement', 'glossary',
  'institutions', 'instruments', 'sources', 'taxonomy', 'timeline',
];

const readJson = (rel, root) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

function commitOf(root) {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return null; }
}

function branchOf(root) {
  try { return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return null; }
}

/**
 * `excludeTrace` is the monitor's OWN trace id.
 *
 * Without it the monitor observes its own in-flight run: the sink
 * writes span.start as each domain span opens, span.end has not been
 * written yet, and `control_plane.incomplete_traces` reports two
 * spans left running — which is true of the process doing the
 * measuring and false of everything it is measuring. Observed on the
 * first full run of this session, as exactly that: 0 incomplete
 * traces before the monitor existed, 2 after.
 *
 * @param {{asOf:string, root?:string, browser?:boolean, quick?:boolean,
 *          validators?:boolean, probe?:boolean, excludeTrace?:string}} opts
 */
export async function gather({ asOf, root = REPO_ROOT, browser = true, quick = false, validators = true, probe = true, excludeTrace = null } = {}) {
  if (!asOf) throw new Error('gather() needs an asOf date: a health report with no date cannot be told from a stale one (docs/AUDIT-2026-09-01.md F-15)');

  const data = {};
  const datasetErrors = [];
  for (const name of DATASETS) {
    try { data[name] = readJson(`data/${name}.json`, root); }
    catch (e) { datasetErrors.push({ dataset: name, error: e.message }); }
  }

  const baseline = readBaseline({ root });
  const v = validators ? runValidators({ root, asOf }) : null;

  /* The browser run is the expensive part and the only one that
     starts a subprocess with the site in front of it. Its failure is
     a reading, not an exception: a monitor that throws because the
     thing it monitors is broken has stopped monitoring. */
  let browserRun = null;
  let browserError = null;
  if (browser) {
    try { browserRun = await runBrowserQA({ quick }); }
    catch (e) { browserError = e.message; }
  }

  const records = readAgentRecords();
  const ledger = readLedger();
  const proposals = surveyProposals({ records, ledger });

  /* Every stored trace, loaded once. `loadTrace` is what derives the
     per-agent views, so the control-plane metrics read the same
     structure the observability CLI shows rather than re-deriving
     one that could disagree with it. */
  const allRuns = listRuns();
  const runs = allRuns.filter((r) => r.trace_id !== excludeTrace);
  const traces = [];
  const traceErrors = [];
  for (const r of runs) {
    try { const t = loadTrace(r.trace_id); if (t) traces.push(t); }
    catch (e) { traceErrors.push({ trace_id: r.trace_id, error: e.message }); }
  }

  const probeResult = probe ? await probePrivilegedRoutes({ root }) : null;

  return {
    as_of: asOf,
    root,
    gathered_at: new Date().toISOString(),
    commit: commitOf(root),
    branch: branchOf(root),
    environment: `node ${process.version} · ${process.platform} ${process.arch}`,

    data,
    dataset_errors: datasetErrors,

    baseline,
    validators: v,

    browser_requested: browser,
    browser: browserRun,
    browser_error: browserError,

    surface: publicSurface({ root }),
    secrets: scanSecrets({ root }),
    exposure: controlPlaneExposure({ root }),

    records,
    ledger,
    proposals,
    runs,
    traces,
    trace_errors: traceErrors,
    self_trace_id: excludeTrace,
    self_trace_excluded: excludeTrace ? allRuns.some((r) => r.trace_id === excludeTrace) : false,
    probe: probeResult,
  };
}

/**
 * Start the privileged interface on loopback and ask each of its
 * routes a question with no credential attached.
 *
 * THIS IS THE ONE CHECK IN THIS SESSION THAT VERIFIES RATHER THAN
 * READS, and it earns its complexity: every other security check
 * parses source, and source-parsing can be satisfied by code that
 * still answers anyone. A route that looks guarded and answers an
 * unauthenticated request is exactly the case the reading checks
 * cannot catch.
 *
 * It binds 127.0.0.1 on an EPHEMERAL PORT and closes immediately.
 * Nothing is exposed to a network by this measurement, and a fixed
 * port would collide with a developer's own viewer.
 */
export async function probePrivilegedRoutes({ root = REPO_ROOT } = {}) {
  const iface = analyseAll(root).find((i) => i.exists && i.privileged_routes?.length);
  if (!iface) return { results: [], error: null, origin: null, note: 'no privileged interface with routes was found to probe' };

  let server = null;
  try {
    server = serve({ port: 0, host: '127.0.0.1', quiet: true });
    await new Promise((ok, fail) => {
      server.once('listening', ok);
      server.once('error', fail);
      if (server.listening) ok();
    });
    const { port } = server.address();
    const origin = `http://127.0.0.1:${port}`;

    const results = [];
    for (const route of iface.privileged_routes) {
      /* A trailing-slash route is parameterised — /api/runs/<id>.
         Probed with a plainly non-existent id, because the question
         is whether the ROUTE answers without a credential, not
         whether that id exists. */
      const url = `${origin}${route.endsWith('/') ? `${route}health-monitor-probe` : route}`;
      try {
        const res = await fetch(url, { headers: {} });
        const body = await res.text();
        results.push({ route, status: res.status, bytes: body.length, content_type: res.headers.get('content-type') });
      } catch (e) {
        results.push({ route, status: 0, bytes: 0, error: e.message });
      }
    }
    return { results, error: null, origin, interface: iface.path };
  } catch (e) {
    return { results: [], error: e.message, origin: null };
  } finally {
    if (server) await new Promise((ok) => server.close(ok));
  }
}

/* ---------------------------------------------------------- helpers
   Shared by more than one metric. Kept here rather than duplicated,
   for the reason the datasets already give: one home per fact.      */

/** Every claim, or [] if claims.json did not parse. */
export const claimsOf = (ctx) => ctx.data.claims?.claims ?? [];
export const sourcesOf = (ctx) => ctx.data.sources?.sources ?? [];
export const instrumentsOf = (ctx) => ctx.data.instruments?.instruments ?? [];
export const relationshipsOf = (ctx) => ctx.data.instruments?.relationships ?? [];
export const institutionsOf = (ctx) => ctx.data.institutions?.institutions ?? [];
export const enforcementOf = (ctx) => ctx.data.enforcement?.enforcement ?? [];
export const timelineOf = (ctx) => ctx.data.timeline?.events ?? [];
export const glossaryOf = (ctx) => ctx.data.glossary?.terms ?? [];
export const rulesOf = (ctx) => ctx.data.applicability?.rules ?? [];

/** Every record in the store, flat, whatever contract. */
export const allRecords = (ctx) => [...ctx.records.byId.values()];

/** Every span in every stored trace, flat. `loadTrace` returns
 *  `roots` (a forest, because a crashed run can leave more than one)
 *  with `children` beneath each — so this walks rather than
 *  concatenating, and a span nested four deep is not missed. */
export function allSpans(ctx) {
  const out = [];
  for (const t of ctx.traces) {
    for (const r of t.roots ?? []) {
      (function walk(s) { if (!s) return; out.push(s); for (const c of s.children ?? []) walk(c); })(r);
    }
  }
  return out;
}

/**
 * Every event of a type across every stored trace.
 *
 * `loadTrace` has already sorted events into named arrays — handoffs,
 * approvals, observations, errors — so this reads those rather than
 * re-deriving from the raw lines. Reading the same structure the
 * observability CLI shows is what stops the health view and the
 * trace view disagreeing about the same run.
 */
export const EVENT_ARRAYS = {
  observation: 'observations',
  decision: 'decisions',
  artifact: 'artifacts',
  handoff: 'handoffs',
  approval: 'approvals',
  provenance: 'provenance',
  error: 'errors',
  website_change: 'website_changes',
};

export function allEvents(ctx, type) {
  const key = EVENT_ARRAYS[type];
  if (!key) throw new Error(`no event array named for type "${type}"`);
  const out = [];
  for (const t of ctx.traces) for (const e of t[key] ?? []) out.push({ ...e, trace_id: t.trace_id });
  return out;
}

/** Every agent run across every stored trace, with its status. */
export function allAgentRuns(ctx) {
  const out = [];
  for (const t of ctx.traces) for (const a of t.agents ?? []) out.push({ ...a, trace_id: t.trace_id });
  return out;
}

/** A named browser-suite area, or null when the suite did not run. */
export function browserArea(ctx, area) {
  if (!ctx.browser || ctx.browser.status === 'skipped') return null;
  const all = [...(ctx.browser.failed ?? []), ...(ctx.browser.undecided ?? [])];
  return {
    failed: all.filter((r) => r.area === area && r.status === 'fail'),
    undecidable: all.filter((r) => r.area === area && r.status === 'undecidable'),
    total: ctx.browser.areas?.[area] ?? 0,
  };
}

/** The one sentence every browser-sourced metric needs when the
 *  suite did not run. Written once so no metric can word it more
 *  softly than another. */
export const BROWSER_ABSENT = {
  why: 'the browser suite did not run in this gathering, so nothing opened a page. This is not zero failures; it is no observation.',
  needs: 'node agent/health/cli.mjs --as-of <date> (the browser runs by default), on a machine with a Chromium or Chrome executable. agent/browser/find.mjs lists where it looks.',
};
