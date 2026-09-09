/* ============================================================
   .control-room/views.mjs — the three views, assembled server-side

   LIVE SYSTEM · WORKFLOWS · AUTONOMY · REVIEW QUEUE · WEBSITE HEALTH.

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

   THE AUTONOMY VIEW IS A WINDOW TOO, AND IT REPORTS THE REFUSALS.
   SESSION 26 requires every autonomous action to be reported here.
   It shows what is switched on, who switched it on and until when,
   and every action attempted — merged, reverted and refused alike,
   each with the rollback information it retained. There is no route
   that records a grant, revokes one, triggers a run or rolls one
   back, and the absence is the control.

   THE WORKFLOWS VIEW IS A WINDOW, NOT A CONSOLE. SESSION 22
   requires the Orchestrator to expose workflow state here, and
   exposing it is the whole of the requirement. There is no route
   that starts a workflow, retries a stage, dispatches an agent or
   resumes a terminal one — §14 says a Control Room action must not
   become direct agent execution, and the way that is honoured is by
   the route not existing rather than by a check somebody could
   move. The view reads the journal and adds nothing to it.

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
import { survey as surveyWorkflows, DEFAULT_STATE_DIR } from '../agent/orchestrator/state.mjs';
import { describeWorkflows, END_STATE_MEANING, WORKFLOW_TYPES } from '../agent/orchestrator/workflows.mjs';
import { describeCapabilities } from '../agent/orchestrator/capabilities.mjs';
import { HUMAN_REVIEW_TRIGGERS, MANDATORY_AUTONOMY_CONDITIONS, APPROVED_AUTONOMOUS_CATEGORIES, approvedCategories, autonomyNote } from '../agent/orchestrator/policy.mjs';
import { describeGovernance } from '../agent/policy/governance.mjs';
import { summariseActions, rollbackInformation } from '../agent/autonomy/ledger.mjs';
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
   2b · WORKFLOWS — the Orchestrator's state
   ============================================================ */

export function workflowsView(cfg, { dir = DEFAULT_STATE_DIR } = {}) {
  const registers = {
    types: describeWorkflows(),
    end_states: END_STATE_MEANING,
    capabilities: describeCapabilities(),
    policy: {
      human_review_triggers: HUMAN_REVIEW_TRIGGERS,
      mandatory_autonomy_conditions: MANDATORY_AUTONOMY_CONDITIONS,
      /* The BASE list, which is empty, and the list actually in
         force, which is derived from the governance grant ledger.
         Both, because a reader who saw only one of them would be
         reading either a false reassurance or a number with no
         statement of what it would be without a grant. */
      approved_autonomous_categories_base: [...APPROVED_AUTONOMOUS_CATEGORIES],
      approved_autonomous_categories: approvedCategories(),
      note: autonomyNote(),
    },
  };

  let workflows = [];
  let readError = null;
  try { workflows = surveyWorkflows({ dir }); }
  catch (e) { readError = e.message; }

  if (readError || !workflows.length) {
    return {
      view: 'workflows',
      store: dir,
      /* Not "0 workflows". Nothing has run where this server can
         see, and those are different facts — the same distinction
         the live view draws about the trace store, for the same
         reason. */
      state: readError ? 'unreadable' : 'no_workflows',
      why: readError
        ? `the workflow journal directory could not be read: ${readError}`
        : 'no workflow journal exists on this machine. The directory is git-ignored per-machine run state, so a fresh clone and a CI runner have none — which is not the same as no workflow having run.',
      needs: 'run: node agent/orchestrator/cli.mjs run --type <TYPE> --subject <Contract>:<id>',
      counts: null,
      workflows: [],
      registers,
      no_console: NO_CONSOLE,
    };
  }

  const byState = {};
  for (const w of workflows) byState[w.state] = (byState[w.state] ?? 0) + 1;

  return {
    view: 'workflows',
    store: dir,
    state: 'measured',
    counts: {
      total: workflows.length,
      by_state: byState,
      open: workflows.filter((w) => !w.terminal).length,
      awaiting_human: workflows.filter((w) => w.state === 'human_review_required').length,
      unresolved: workflows.filter((w) => w.state === 'unresolved').length,
      failed: workflows.filter((w) => w.state === 'failed').length,
      journals_with_gaps: workflows.filter((w) => w.gaps?.length).length,
      journals_with_malformed_lines: workflows.filter((w) => w.malformed?.length).length,
    },
    workflows: workflows.slice(-80).reverse(),
    registers,
    /* A workflow that is still open is not the same as one nobody
       finished. `blocked` and `in_progress` are non-terminal and a
       run that died leaves one behind — which reads as what it is,
       because the state is replayed from an append-only journal
       rather than stored. */
    note: 'A non-terminal workflow is either running or was interrupted. The state is replayed from the journal, so a run that died mid-stage reads as what happened up to the moment it died rather than as a status nobody updated.',
    no_console: NO_CONSOLE,
  };
}

export const NO_CONSOLE = 'This view reads the Orchestrator\'s journal and adds nothing to it. There is no route here that starts a workflow, retries a stage, dispatches an agent or reopens a terminal one, and that is not a check somebody could move — the routes do not exist. Protocol §14: a Control Room action creates a governed event, and the Orchestrator independently decides whether it is permitted.';

/* ============================================================
   2c · LIMITED AUTONOMY — what is switched on, and everything it did

   SESSION 26: "Report every autonomous action in the control room."
   This is that, and it is the whole of it: a READ.

   THERE IS NO ROUTE THAT GRANTS, REVOKES, TRIGGERS OR ROLLS BACK,
   and the absence is the control rather than a check inside a route,
   because a check can be moved. A governance grant is written by a
   person at a command line; an interface that could switch autonomy
   on is an interface a bug in this server could switch autonomy on
   through, and protocol §24 reserves that decision to a person.

   IT REPORTS THE REFUSALS TOO. An autonomy view showing only what
   was changed answers "what did the machine do" and not "what did
   the machine try", and the second is the question an operator
   reading a control plane actually has.
   ============================================================ */

export const AUTONOMY_NO_CONSOLE = 'This view reads the governance grant ledger and the autonomous-action ledger and adds nothing to either. There is no route here that records a grant, revokes one, starts an autonomous run or rolls one back — not a check somebody could move, but a route that does not exist. A grant is written by a person at a command line, because protocol §24 reserves that decision to a person rather than to a button.';

export function autonomyView(cfg, { dir = undefined, actionDir = undefined, now = new Date().toISOString() } = {}) {
  let governance = null;
  let readError = null;
  try { governance = describeGovernance({ dir, now }); }
  catch (e) { readError = e.message; }

  const actions = summariseActions(actionDir ? { dir: actionDir } : {});

  if (readError) {
    return {
      view: 'autonomy',
      state: 'unreadable',
      why: `the governance grant ledger could not be read: ${readError}`,
      no_console: AUTONOMY_NO_CONSOLE,
    };
  }

  const active = governance.active;
  return {
    view: 'autonomy',
    state: 'measured',
    now,
    /* The two facts an operator needs first, and they are different:
       whether anything is switched on, and whether anything has
       happened. Either can be true without the other. */
    enabled: active.length > 0,
    policy: {
      policy_id: governance.policy.policy_id,
      enabled_categories: [...governance.policy.enabled_categories],
      automatic_path_allowlist: [...governance.policy.automatic_path_allowlist],
      automatic_field_allowlist: governance.policy.automatic_field_allowlist ?? {},
      max_automatic_risk: governance.policy.max_automatic_risk,
      automatic_environments: [...governance.policy.automatic_environments],
    },
    base_policy: {
      policy_id: governance.base_policy_id,
      enabled_categories: governance.base_enabled_categories,
      note: governance.note,
    },
    grants: active.map((g) => ({
      grant_id: g.grant_id,
      decided_by: g.decided_by,
      decided_at: g.decided_at,
      expires_at: g.expires_at,
      authority: g.authority,
      rationale: g.rationale,
      categories: g.categories,
      path_allowlist: g.path_allowlist,
      field_allowlist: g.field_allowlist,
      max_automatic_risk: g.max_automatic_risk,
      environments: g.environments,
    })),
    /* Revoked, expired and invalid are three different facts and
       none of them is "there is no grant". */
    inactive_grants: governance.inactive.map((i) => ({ grant_id: i.grant.grant_id, state: i.state, why: i.why, decided_by: i.grant.decided_by })),
    ledger_malformed: governance.malformed,
    self_check: governance.self_check,
    boundaries: {
      eligible_paths: governance.eligible_paths,
      never_paths: governance.never_paths,
      never_fields: governance.never_fields,
      automatable_categories: governance.automatable_categories,
    },
    actions: {
      store: actions.path,
      store_exists: actions.exists,
      /* Not "0 actions". The ledger is git-ignored per-machine run
         state, so a fresh clone and a CI runner have none — which is
         not the same fact as an autonomy layer that never acted, and
         the two are not reported alike. */
      why: actions.why,
      counts: actions.counts,
      malformed: actions.malformed,
      recent: actions.actions.slice(-60).reverse().map((a) => ({
        action_id: a.action_id,
        proposal_id: a.proposal_id,
        outcome: a.outcome,
        category: a.category ?? null,
        started_at: a.started_at,
        ended_at: a.ended_at ?? null,
        wrote_files: a.wrote_files === true,
        files: a.files ?? [],
        origin_branch: a.origin_branch ?? null,
        merge_commit: a.merge_commit ?? null,
        qa_verdict: a.qa_verdict ?? null,
        refused_by: a.refused_by ?? [],
        why: a.why ?? null,
        rollback: rollbackInformation(a),
      })),
    },
    bound: 'This is what the ledgers on THIS machine hold. The grant ledger is git-tracked and travels with the repository; the action ledger is per-machine run state, and the durable record of an autonomous change is the commit it made.',
    no_console: AUTONOMY_NO_CONSOLE,
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
