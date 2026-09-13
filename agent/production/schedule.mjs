/* ============================================================
   agent/production/schedule.mjs — the operating schedule, as data

   WHAT THIS IS. SESSION 29's brief names a daily cycle of eight
   stages, seven weekly reviews and seven monthly reviews. This file
   is that schedule declared as data so that the comparison between
   what is SCHEDULED and what this repository can actually RUN is a
   measurement rather than a sentence in a document. Every stage and
   every review names the command that would run it, and
   `readiness.mjs` resolves each of those against the tree.

   EVERY STAGE STATES WHAT IT CANNOT ESTABLISH, and the loader
   refuses one that does not. That is the whole point of writing the
   schedule down: the daily cycle's first stage — Scout — has a CLI
   and a schedule module, and its network reach was refused by this
   environment on every one of the five registered endpoints in
   SESSION 25. A schedule that hid that behind a stage name would be
   describing a system nobody has. `cannot` is the same discipline
   `agent/improve/observe.mjs` applies with `what_it_cannot_see` and
   `agent/health/` with a metric's `limitations`.

   THE CYCLE ENDS AT A PERSON, AND THE LOADER ENFORCES IT. This is
   the same rule `agent/orchestrator/workflows.mjs` applies to its
   ten workflow types, for the same reason and by the same mechanism:
   a terminal stage whose kind is not `human` is refused at load.
   The eighth stage is "publish or request approval", and in this
   repository BOTH of its outcomes are a person's — there is no
   deploy gate, a push to `main` publishes, and the autonomy runner's
   merge reaches the working branch and stops.

   IT SCHEDULES NOTHING AND RUNS NOTHING. There is no timer here, no
   cron, no daemon and no dispatcher. `agent/scout/schedule/` owns
   the one real scheduling primitive this repository has, and this
   module does not duplicate it: what this file declares is the
   ORDER and the OWNERSHIP, which is the half SESSION 29 asks for
   and the half that did not exist.
   ============================================================ */

/** Stage kinds. `machine` runs without a person; `human` is a person
 *  deciding. There is deliberately no third kind: a stage that is
 *  "mostly automatic" is a machine stage whose refusals nobody
 *  counted. */
export const STAGE_KINDS = Object.freeze(['machine', 'human']);

/** Cadences. Used only to group; nothing here fires on one. */
export const CADENCES = Object.freeze(['daily', 'weekly', 'monthly']);

/* ------------------------------------------------------- daily */

/**
 * The daily cycle, in the order SESSION 29's brief gives it.
 *
 * `runs` is the command a person or a dispatcher would invoke.
 * `produces` is the contract the stage mints, where it mints one.
 * `cannot` is what the stage does NOT establish, and it is not
 * decoration: a cycle that reported "scout: ok" would have said
 * something very different depending on whether the scout reached a
 * single source.
 */
export const DAILY_CYCLE = Object.freeze([
  Object.freeze({
    id: 'scout',
    order: 1,
    name: 'Scout',
    kind: 'machine',
    owner: 'source-scout',
    doc: 'docs/SOURCE-SCOUT.md',
    runs: 'node agent/scout/cli.mjs',
    produces: 'SourceCandidate',
    cannot: 'reach any registered endpoint from a development container. SESSION 25 ran --live against the five real endpoints and that environment\'s network policy refused all five, and SESSION 30 confirmed the same refusal. A scout run THERE reads the registered corpus, not the web. IT IS NOT A PROPERTY OF THE SCOUT: the scheduled workflow runs on a GitHub Actions runner with ordinary egress, and the run of 7 September 2026 fetched 17 documents with 0 refused by egress policy, two endpoints yielding candidates and two answering 202 and 403 themselves. Which environment the stage runs in decides this, and agent/production/readiness.mjs reads the committed digest rather than assuming either answer.',
  }),
  Object.freeze({
    id: 'verify',
    order: 2,
    name: 'Verify',
    kind: 'machine',
    owner: 'legal-verifier',
    doc: 'docs/LEGAL-VERIFIER.md',
    runs: 'node agent/verifier/cli.mjs',
    produces: 'VerificationResult',
    cannot: 'establish that a legal fact is true. It checks what a retrieved document supports; with no retrieval it reports unknown, and unknown is never a pass.',
  }),
  Object.freeze({
    id: 'detect_change',
    order: 3,
    name: 'Detect Change',
    kind: 'machine',
    owner: 'regulatory-change-detector',
    doc: 'docs/CHANGE-DETECTOR.md',
    runs: 'node agent/detector/cli.mjs',
    produces: 'ChangeSignal',
    cannot: 'distinguish a change in the law from a change in how a page describes it, without a retrieved document to compare against.',
  }),
  Object.freeze({
    id: 'assess_depth',
    order: 4,
    name: 'Assess Data Depth',
    kind: 'machine',
    owner: 'data-depth',
    doc: 'docs/DATA-DEPTH.md',
    runs: 'node agent/depth/cli.mjs',
    produces: 'KnowledgeGap',
    cannot: 'close a gap. It names gaps and answers none of them; closing one is retrieval work.',
  }),
  Object.freeze({
    id: 'route_impact',
    order: 5,
    name: 'Route Editorial / Architecture / UX impact',
    kind: 'machine',
    owner: 'master-orchestrator',
    doc: 'docs/ORCHESTRATOR.md',
    runs: 'node agent/orchestrator/cli.mjs workflows',
    produces: 'WorkflowRecord',
    cannot: 'dispatch a specialist. No production dispatcher is wired: a stage with no dispatcher reports not_dispatched and the workflow ends unresolved. The register command above reports what WOULD be routed.',
  }),
  Object.freeze({
    id: 'qa',
    order: 6,
    name: 'QA',
    kind: 'machine',
    owner: 'implementation-qa',
    doc: 'docs/IMPLEMENTATION-QA.md',
    runs: 'node agent/implement/cli.mjs check --as-of YYYY-MM-DD',
    produces: 'QAResult',
    cannot: 'read prose. A false statement in index.html passes every check in this repository, and the browser suite reads a DOM rather than a sentence.',
  }),
  Object.freeze({
    id: 'governance',
    order: 7,
    name: 'Governance',
    kind: 'machine',
    owner: 'autonomy-policy',
    doc: 'docs/AUTONOMY-AUTHORIZATION-POLICY.md',
    runs: 'node agent/policy/cli.mjs governance',
    produces: 'PolicyDecision',
    cannot: 'decide anything. It reports the grants in force and evaluates the twelve mandatory conditions; a grant is written by a person through agent/implement/ledger.mjs recordDecision.',
  }),
  Object.freeze({
    id: 'publish_or_request_approval',
    order: 8,
    name: 'Publish or Request Approval',
    kind: 'human',
    owner: 'repository author',
    doc: 'docs/CONTROL-ROOM.md',
    runs: 'node .control-room/cli.mjs serve',
    produces: 'Decision',
    cannot: 'be reached automatically in either direction. There is no deploy gate — a push to main publishes — and the autonomy runner\'s merge reaches the working branch and stops. Both outcomes of this stage are a person\'s.',
  }),
]);

/* ------------------------------------------------------ weekly */

/**
 * The seven weekly reviews. Each names the command that produces
 * the evidence for it, and what a person still has to do with that
 * evidence — because six of the seven produce a report and none of
 * them produces a decision.
 */
export const WEEKLY_REVIEWS = Object.freeze([
  Object.freeze({
    id: 'data_depth_audit',
    name: 'Data Depth audit',
    cadence: 'weekly',
    runs: 'node agent/depth/cli.mjs --as-of YYYY-MM-DD',
    doc: 'docs/DATA-DEPTH.md',
    human_step: 'decide which gaps are worth retrieval work. A rise in the gap count usually means somebody looked harder.',
  }),
  Object.freeze({
    id: 'ux_audit',
    name: 'UX audit',
    cadence: 'weekly',
    runs: 'node agent/ux/cli.mjs',
    doc: 'docs/UX-AUDIT.md',
    human_step: 'decide the Class C interface proposals. Agent 8 opens no page; every record it writes says so as a blocking open question.',
  }),
  Object.freeze({
    id: 'agent_performance',
    name: 'Agent performance review',
    cadence: 'weekly',
    runs: 'node agent/improve/cli.mjs cycle --as-of YYYY-MM-DD',
    doc: 'docs/CONTINUOUS-IMPROVEMENT.md',
    human_step: 'read the movement per observer. An observer that did not run in both cycles resolves nothing, and the loop reports that as undetermined rather than as progress.',
  }),
  Object.freeze({
    id: 'human_override_analysis',
    name: 'Human override analysis',
    cadence: 'weekly',
    runs: 'node agent/proposals/governance/cli.mjs corpus',
    doc: 'docs/GOVERNANCE-PROPOSALS.md',
    human_step: 'read what the corpus command reports about itself. The approval ledger is ABSENT, not empty, so there are no overrides to analyse and the corpus is the corrections instead.',
  }),
  Object.freeze({
    id: 'website_health',
    name: 'Website health review',
    cadence: 'weekly',
    runs: 'node agent/health/cli.mjs --as-of YYYY-MM-DD',
    doc: 'docs/HEALTH-MONITOR.md',
    human_step: 'read the three domains separately. There is no overall score, five metrics are not_a_score, and a lower number in the first four is usually worse news than a higher one.',
  }),
  Object.freeze({
    id: 'control_room_health',
    name: 'Control Room health review',
    cadence: 'weekly',
    runs: 'node .control-room/cli.mjs routes',
    doc: 'docs/CONTROL-ROOM.md',
    human_step: 'check every route against the permission it needs. Nothing here has ever spoken to a deployed Control Room: control_plane.control_room_availability reports unmeasurable for that reason.',
  }),
  Object.freeze({
    id: 'hidden_entry_review',
    name: 'Hidden-entry accessibility and performance review',
    cadence: 'weekly',
    runs: 'node agent/production/cli.mjs visual',
    doc: 'docs/PRODUCTION-OPERATING-MODE.md',
    human_step: 'read the ten criteria and the two the browser suite settles. No contrast was computed, no screen reader was run and no pixels were compared: README limitation 7 stands over this affordance as it does over the rest of the site.',
  }),
]);

/* ----------------------------------------------------- monthly */

/** The seven monthly reviews. */
export const MONTHLY_REVIEWS = Object.freeze([
  Object.freeze({
    id: 'knowledge_architecture',
    name: 'Knowledge architecture review',
    cadence: 'monthly',
    runs: 'node agent/architect/cli.mjs',
    doc: 'docs/KNOWLEDGE-ARCHITECTURE.md',
    human_step: 'decide the shapes. The architect names shapes and drafts none, and may not propose a taxonomy term.',
  }),
  Object.freeze({
    id: 'autonomy_review',
    name: 'Autonomy review',
    cadence: 'monthly',
    runs: 'node agent/autonomy/cli.mjs status',
    doc: 'docs/LIMITED-AUTONOMY.md',
    human_step: 'read the grant against what it can reach. The grant expires 9 March 2027; six of the eight fields it allowlists exist on none of the 77 records in the file it names.',
  }),
  Object.freeze({
    id: 'source_coverage',
    name: 'Source coverage review',
    cadence: 'monthly',
    runs: 'node tools/freshness.mjs',
    doc: 'docs/SOURCE-POLICY.md',
    human_step: 'read SOURCE REACHABILITY knowing it performs no network I/O. No URL in this repository has ever been fetched (AUDIT F-12).',
  }),
  Object.freeze({
    id: 'regression_review',
    name: 'Regression review',
    cadence: 'monthly',
    runs: 'node agent/browser/cli.mjs',
    doc: 'docs/BROWSER-QA.md',
    human_step: 'decide the three SESSION 19 defects. Each is reader-facing, reproducible and Class C: a measured defect is not an authorisation.',
  }),
  Object.freeze({
    id: 'governance_review',
    name: 'Governance review',
    cadence: 'monthly',
    runs: 'node agent/proposals/governance/cli.mjs list',
    doc: 'docs/GOVERNANCE-PROPOSALS.md',
    human_step: 'decide the seven proposals. None has ever been decided, and the module has no write path, no decision home and no automatic class.',
  }),
  Object.freeze({
    id: 'control_room_security',
    name: 'Control Room security review',
    cadence: 'monthly',
    runs: 'node agent/policy/verify/cli.mjs',
    doc: 'docs/SECURITY-VERIFICATION-2026-09-08.md',
    human_step: 'read every finding, not the count. The gate exits 1 while any attack SUCCEEDED, and an undecidable is a boundary this environment could not test rather than a pass.',
  }),
  Object.freeze({
    id: 'public_private_boundary',
    name: 'Public / private boundary review',
    cadence: 'monthly',
    runs: 'node .control-room/cli.mjs boundary',
    doc: 'docs/IMPLEMENTATION-QA.md',
    human_step: 'read it together with node agent/implement/cli.mjs boundary. Almost the whole repository is inside the published deployment; the dot prefix is the one real exclusion and it is a publication boundary, not a security control.',
  }),
]);

/* ------------------------------------------------- the loader */

export class ScheduleRefused extends Error {
  constructor(message) { super(message); this.name = 'ScheduleRefused'; }
}

/**
 * Refuse a schedule that could not be what it says it is.
 *
 * Called at module load, below, so an edit that breaks one of these
 * fails on import rather than at the moment somebody depends on it.
 */
export function loadSchedule({
  daily = DAILY_CYCLE,
  weekly = WEEKLY_REVIEWS,
  monthly = MONTHLY_REVIEWS,
} = {}) {
  if (!daily.length) throw new ScheduleRefused('the daily cycle has no stages');

  /* The order is the brief's order, and a gap or a repeat in it
     would mean two stages claim the same position. */
  const orders = daily.map((s) => s.order);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      throw new ScheduleRefused(`daily stage ${daily[i].id} declares order ${orders[i]} at position ${i + 1}: the cycle's order must be 1..n with no gap and no repeat`);
    }
  }

  const ids = new Set();
  for (const s of daily) {
    if (ids.has(s.id)) throw new ScheduleRefused(`duplicate daily stage id "${s.id}"`);
    ids.add(s.id);
    if (!STAGE_KINDS.includes(s.kind)) throw new ScheduleRefused(`daily stage "${s.id}" declares kind "${s.kind}", which is not one of ${STAGE_KINDS.join(', ')}`);
    if (!s.runs) throw new ScheduleRefused(`daily stage "${s.id}" names no command. A stage nobody can run is a stage nobody runs.`);
    if (!s.cannot) throw new ScheduleRefused(`daily stage "${s.id}" does not say what it cannot establish. Every stage here states its own limit.`);
    if (!s.doc) throw new ScheduleRefused(`daily stage "${s.id}" names no document`);
  }

  /* The same rule agent/orchestrator/workflows.mjs applies to its
     ten types. A cycle that could finish without a person is a cycle
     that could publish without one. */
  const last = daily[daily.length - 1];
  if (last.kind !== 'human') {
    throw new ScheduleRefused(`the daily cycle's terminal stage "${last.id}" is a ${last.kind} stage. Every cycle here ends at a person; docs/ORCHESTRATOR.md applies the same refusal to the ten workflow types.`);
  }

  for (const r of [...weekly, ...monthly]) {
    if (!CADENCES.includes(r.cadence)) throw new ScheduleRefused(`review "${r.id}" declares cadence "${r.cadence}"`);
    if (!r.runs) throw new ScheduleRefused(`review "${r.id}" names no command`);
    if (!r.human_step) throw new ScheduleRefused(`review "${r.id}" does not say what a person still has to do. None of these reviews produces a decision.`);
  }

  return Object.freeze({ daily, weekly, monthly });
}

/** The loaded schedule. Throws on import if the declarations above
 *  stop satisfying the refusals. */
export const SCHEDULE = loadSchedule();

/** Every command the schedule names, deduplicated, with the cadence
 *  and the stage or review that names it. `readiness.mjs` resolves
 *  these against the tree. */
export function scheduledCommands({ schedule = SCHEDULE } = {}) {
  const rows = [];
  for (const s of schedule.daily) rows.push({ cadence: 'daily', id: s.id, runs: s.runs, owner: s.owner });
  for (const r of schedule.weekly) rows.push({ cadence: 'weekly', id: r.id, runs: r.runs, owner: null });
  for (const r of schedule.monthly) rows.push({ cadence: 'monthly', id: r.id, runs: r.runs, owner: null });
  return rows;
}

/** The script path a command invokes, or null when the command is
 *  not a `node <path>` invocation. Used to check that a scheduled
 *  command names a file that exists. */
export function scriptOf(command) {
  const m = /^node\s+(\S+\.mjs)\b/.exec(String(command ?? ''));
  return m ? m[1] : null;
}
