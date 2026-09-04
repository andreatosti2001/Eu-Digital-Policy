/* ============================================================
   .control-room/views.mjs — the three views, assembled server-side

   LIVE SYSTEM · REVIEW QUEUE · WEBSITE HEALTH.

   Each is built here, on the server, from the same modules the CLIs
   read. The browser receives JSON it may render; it computes no
   state, derives no status and decides no permission. That is not a
   stylistic preference — protocol §12 says the UI is never the
   source of truth, and a view assembled in the client is a view
   somebody can assemble differently.

   WHAT EACH VIEW REFUSES.

   The Live System view shows FAILED and RUNNING runs, open handoffs
   and pending approvals, not just the ones that finished. A
   dashboard that showed only completed work would report a stuck
   pipeline as an idle one.

   The Review Queue carries the whole chain — source, evidence,
   claim, verification, operations, affected entities, agent run,
   required tests, permitted files, rollback — and the gates that
   currently REFUSE the proposal. Approving a summary line is not
   review.

   The Website Health view reports what the health monitor last
   MEASURED, and says plainly when nothing has been measured. It does
   not run the monitor inside a request: the monitor shells out to
   four validators and can open a browser, and a view that quietly
   ran all of that would either time out or start reporting numbers
   from a run nobody asked for. Where there is no recorded run, the
   answer is "no run has been recorded" and the command that would
   produce one — never a zero. `agent/health/model.mjs` spent SESSION
   20 refusing to let an absence of instrumentation read as an
   absence of problems, and a view that undid that in its rendering
   would be the same mistake one layer up.

   PUBLIC-SAFE AND PRIVATE ARE MARKED, PER METRIC. Every reading
   carries the `visibility` its metric declares, and the health view
   reports the two counts separately, so somebody deciding what to
   publish is not left to guess which half of the screen is safe.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { overview, listRuns, loadTrace } from '../agent/observability/query.mjs';
import { ALL_METRICS, BY_ID } from '../agent/health/metrics.mjs';
import { DOMAINS, DOMAIN_LABEL, DOMAIN_STAKE } from '../agent/health/model.mjs';
import { read as readHistory, previousEntry, movement } from '../agent/health/history.mjs';
import { analyseAll } from '../agent/health/security.mjs';
import { reviewQueue } from './decide.mjs';
import { listOperators } from './identity.mjs';
import { describeConfig, isLoopback } from './config.mjs';

/* ============================================================
   1 · LIVE SYSTEM
   ============================================================ */

export function liveSystem(cfg, { limit = 60 } = {}) {
  const dir = cfg.trace_dir;
  if (!existsSync(dir)) {
    return {
      view: 'live_system',
      store: dir,
      store_exists: false,
      /* Not "0 runs". Nothing has run, and those are different
         facts. */
      state: 'no_trace_store',
      why: 'the shared observability store does not exist on this machine. No agent has run here, or its runs went to a different directory. That is not the same as a system with nothing happening in it, and it is not reported as one.',
      runs: [], events: [], open_handoffs: [], pending_approvals: [], failures: [], workflow: null,
    };
  }

  const ov = overview(dir);
  const runs = listRuns(dir, { limit });

  /* The most recent runs, opened, so the view carries what actually
     happened rather than only that something did. */
  const events = [];
  const failures = [];
  const discoveries = [];
  const verifications = [];
  for (const r of runs.slice(0, 12)) {
    const t = loadTrace(r.trace_id, dir);
    if (!t) continue;
    for (const d of t.decisions ?? []) events.push({ kind: 'decision', trace_id: r.trace_id, agent: d.agent ?? r.agent, ts: d.ts, summary: d.decision, rationale: d.rationale, alternatives: d.alternatives ?? [] });
    for (const o of t.observations ?? []) {
      events.push({ kind: 'observation', trace_id: r.trace_id, agent: o.agent ?? r.agent, ts: o.ts, summary: o.summary, subject: o.subject ?? null, confidence: o.confidence ?? null, risk: o.risk ?? null });
      if (o.subject === 'discovery' || /discover/i.test(o.summary ?? '')) discoveries.push({ trace_id: r.trace_id, ts: o.ts, summary: o.summary });
      if (/verif/i.test(o.summary ?? '') || o.subject === 'verification') verifications.push({ trace_id: r.trace_id, ts: o.ts, summary: o.summary });
    }
    for (const e of t.errors ?? []) failures.push({ trace_id: r.trace_id, agent: e.agent ?? r.agent, ts: e.ts, message: e.message, fatal: e.fatal, error_type: e.error_type ?? null });
    for (const h of t.handoffs ?? []) events.push({ kind: 'handoff', trace_id: r.trace_id, ts: h.ts, summary: `${h.from_agent ?? '?'} → ${h.to_agent}`, accepted: Boolean(h.accepted), reason: h.reason ?? null });
  }
  events.sort((a, b) => String(b.ts ?? '').localeCompare(String(a.ts ?? '')));

  const running = runs.filter((r) => r.status === 'running');
  const failed = runs.filter((r) => r.status === 'failed');

  return {
    view: 'live_system',
    store: dir,
    store_exists: true,
    state: 'measured',
    counts: {
      runs: runs.length,
      running: running.length,
      failed: failed.length,
      open_handoffs: (ov.open_handoffs ?? []).length,
      pending_approvals: (ov.pending_approvals ?? []).length,
      website_changes: (ov.website_changes ?? []).length,
    },
    runs,
    /* Running and failed are lifted out rather than left to be found
       in a list: a pipeline that is stuck looks exactly like an idle
       one until somebody notices a run that never ended. */
    running, failed,
    events: events.slice(0, 200),
    discoveries: discoveries.slice(0, 40),
    verification_decisions: verifications.slice(0, 40),
    open_handoffs: ov.open_handoffs ?? [],
    pending_approvals: ov.pending_approvals ?? [],
    downstream_effects: ov.website_changes ?? [],
    failures: failures.slice(0, 60),
    bound: 'This is what the trace store on THIS machine holds. Agent runs on another machine, or written to another directory, are not here — and an empty view means nothing has run where this server can see, not that nothing has run.',
  };
}

/* ============================================================
   2 · REVIEW QUEUE
   ============================================================ */

export function reviewQueueView(cfg, ctx = {}) {
  const items = reviewQueue(cfg, ctx);
  const byState = {};
  for (const i of items) byState[i.approval.state] = (byState[i.approval.state] ?? 0) + 1;
  return {
    view: 'review_queue',
    state: 'measured',
    counts: {
      total: items.length,
      pending: items.filter((i) => i.approval.state === 'pending').length,
      decidable: items.filter((i) => i.approval.state === 'pending' && !i.blocking_gates.length).length,
      by_state: byState,
      human_only: items.filter((i) => i.autonomy_class === 'human_only').length,
    },
    items,
    /* A proposal that is pending AND has blocking gates is not
       waiting on a reviewer; it is waiting on the agent that
       produced it. Counting the two together would report the queue
       as longer than the work a person can actually do. */
    note: 'A pending proposal with blocking gates is waiting on the agent that produced it, not on a reviewer. The two are counted apart.',
    approval_effect: 'Approval records an authorization in agent/implement/decisions/decisions.jsonl. It publishes nothing.',
  };
}

/* ============================================================
   3 · WEBSITE HEALTH
   ============================================================ */

export function websiteHealth(cfg, { root } = {}) {
  const hist = readHistory();
  const last = hist.entries?.length ? hist.entries[hist.entries.length - 1] : null;
  const prev = hist.entries?.length > 1 ? hist.entries[hist.entries.length - 2] : null;

  /* The register always exists: it is definitions, not measurements,
     and it is what makes a number quotable in context. */
  const register = ALL_METRICS.map((m) => ({
    id: m.id, name: m.name, domain: m.domain, definition: m.definition, source: m.source,
    calculation: m.calculation, frequency: m.frequency, interpretation: m.interpretation,
    limitations: m.limitations, visibility: m.visibility, direction: m.direction,
  }));

  const domains = DOMAINS.map((d) => ({
    domain: d,
    label: DOMAIN_LABEL[d],
    stake: DOMAIN_STAKE[d],
    metrics: register.filter((m) => m.domain === d).length,
  }));

  if (!last) {
    return {
      view: 'website_health',
      state: 'no_run_recorded',
      /* Not zeros. SESSION 20's whole design is that an absence of
         instrumentation is never reported as an absence of
         problems, and a view that rendered nulls as 0 would undo it
         in the last ten centimetres. */
      why: 'no health run has been recorded on this machine. agent/health/history/ is git-ignored private control-plane data and does not travel with a checkout, so a fresh clone has none.',
      needs: 'run: node agent/health/cli.mjs --as-of YYYY-MM-DD',
      domains, register,
      readings: [], movement: null,
      no_overall_score: NO_OVERALL_SCORE,
      security: securitySnapshot(cfg, root),
    };
  }

  const readings = (last.readings ?? []).map((r) => {
    const m = BY_ID.get(r.id);
    return {
      ...r,
      name: m?.name ?? r.id,
      domain: m?.domain ?? null,
      visibility: m?.visibility ?? 'private',
      direction: m?.direction ?? null,
      interpretation: m?.interpretation ?? null,
      limitations: m?.limitations ?? null,
    };
  });

  return {
    view: 'website_health',
    state: 'measured',
    as_of: last.as_of,
    recorded_at: last.recorded_at ?? null,
    commit: last.commit ?? null,
    domains,
    readings,
    counts: {
      measured: readings.filter((r) => r.state === 'measured').length,
      unmeasurable: readings.filter((r) => r.state === 'unmeasurable').length,
      not_applicable: readings.filter((r) => r.state === 'not_applicable').length,
      public_safe: readings.filter((r) => r.visibility === 'public').length,
      private: readings.filter((r) => r.visibility === 'private').length,
      not_a_score: readings.filter((r) => r.direction === 'not_a_score').length,
    },
    movement: prev ? movement(last, prev) : null,
    register,
    no_overall_score: NO_OVERALL_SCORE,
    security: securitySnapshot(cfg, root),
    bound: 'These are the numbers from the last recorded run, not from now. The as_of date is on the reading; a stale one is stale and says so rather than being refreshed by being looked at.',
  };
}

export const NO_OVERALL_SCORE = 'There is no overall health score and this view will not compute one. agent/health/model.mjs overallScore() throws, with the reasoning: a broken link costs a reader a click, a false statement about EU law costs them a decision they cannot take back, and an unaudited approval costs the system its provenance and is invisible to every reader. A mean says none of that and invites raising the number by improving the cheapest domain.';

/**
 * The control-plane half a Control Room ought to be able to answer
 * about ITSELF: which privileged interfaces exist, and what each one
 * checks. Read from source by the health monitor's own analyser, so
 * this view cannot flatter the server it is running inside — it is
 * the same function that reported nine of eleven observability
 * routes answering an unauthenticated request.
 */
export function securitySnapshot(cfg, root) {
  let interfaces = [];
  try { interfaces = analyseAll(root ?? cfg.root); } catch { interfaces = []; }
  return {
    interfaces: interfaces.map((i) => ({
      path: i.path, exists: i.exists, serves: i.what ?? null,
      privileged_routes: i.privileged_routes?.length ?? 0,
      has_auth: i.has_auth, has_authz: i.has_authz,
      binds_by_default: i.binds, host_is_a_parameter: i.host_is_a_parameter,
    })),
    this_server: {
      env: cfg.env,
      provider: cfg.provider,
      bind: `${cfg.host}:${cfg.port}`,
      bind_is_loopback: isLoopback(cfg.host),
      secure_cookies: cfg.env === 'production',
    },
    bound: 'Read from the source of each interface, not from a running process. It reports what the code PERMITS anyone to start, which is the question a default cannot answer.',
  };
}

/* ============================================================
   The system view an administrator gets: who has access
   ============================================================ */

export function operatorsView(cfg) {
  const ops = listOperators(cfg);
  return {
    view: 'operators',
    operators: ops,
    counts: {
      total: ops.length,
      active: ops.filter((o) => !o.disabled).length,
      administrators: ops.filter((o) => o.roles.includes('administrator') && !o.disabled).length,
    },
    config: describeConfig(cfg),
    note: 'Roles are re-read from this registry on every request. A role revoked here is gone from a session already open, not when that session happens to expire.',
  };
}

/** Read-only helper for the UI: the repository's own statement of
 *  what a green check does not prove. Quoted from the file rather
 *  than restated, so it cannot drift from it. */
export function repositoryCaveats(root) {
  const file = join(root, 'AGENTS.md');
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  const start = text.indexOf('## Known hazards');
  if (start < 0) return [];
  const section = text.slice(start, text.indexOf('\n## ', start + 5) === -1 ? undefined : text.indexOf('\n## ', start + 5));
  return section.split('\n- ').slice(1).map((s) => s.replace(/\s+/g, ' ').trim().slice(0, 400));
}
