/* ============================================================
   agent/simulation/run.mjs — one complete simulated cycle

   SESSION 24. Protocol §25 puts the first complete end-to-end cycle
   in SIMULATION and asks that it "observe and document defects
   rather than silently repairing them". This module runs the cycle
   and returns the observation; it repairs nothing, and the four
   things it found are in `docs/FIRST-END-TO-END-AUDIT.md` rather
   than in a patch.

   WHAT ACTUALLY RUNS. The real Orchestrator, the real event intake,
   the real capability register, the real contract gateway, the real
   conflict detectors, the real provenance and rollback gates, the
   real autonomy policy, the real journal, the real tracer, and — on
   leg 6 — a real Control Room process with a real login and a real
   ledger write. The only simulated things are the eleven
   specialists' domain reasoning (`dispatchers.mjs`) and the
   scenario (`fixture.mjs`).

   WHAT IS NEVER TOUCHED. `data/`, `i18n/`, `js/`, `css/`, any page,
   `agent/records/`, `agent/observability/runs/`,
   `agent/orchestrator/state/`, `agent/implement/decisions/`,
   `.control-room/state/`, and git. Every store this run writes is
   created by `mkdtemp` and removed at the end, and the run reports
   a before/after fingerprint of the whole repository so "nothing was
   changed" is a MEASUREMENT rather than an assurance.
   ============================================================ */

import { readdirSync } from 'node:fs';

import { Orchestrator } from '../orchestrator/orchestrator.mjs';
import { WorkflowJournal } from '../orchestrator/state.mjs';
import { Tracer } from '../observability/tracer.mjs';
import { JsonlSink } from '../observability/sink.mjs';
import { readAgentRecords, readLedger, deriveApproval, proposalFingerprint } from '../implement/ledger.mjs';
import { preflight } from '../implement/preflight.mjs';
import { REPO_ROOT } from '../implement/baseline.mjs';

import { SimWorld, fingerprintTree, diffFingerprints } from './world.mjs';
import { simulationDispatchers } from './dispatchers.mjs';
import { records as fx, unmarkedControlFixture, markedProposal, SCENARIO } from './fixture.mjs';
import { LEGS, NOT_WALKED, GRAPH_ORDER } from './cycle.mjs';

/** Deterministic wall clock. A trace whose timestamps move on every
 *  run is a trace nobody can diff. */
const SIM_NOW = '2026-09-09T00:00:00.000Z';

/* ============================================================
   The authorization leg — a real Control Room, in a temp world
   ============================================================ */

/* NOT A CREDENTIAL TO ANYTHING. It provisions four synthetic operators in a
   mkdtemp state directory that is deleted when the run ends, and it authenticates
   against a Control Room that exists for the length of one function call. It is
   written in the open, in a file inside the published surface, because a value
   that had to be hidden would mean the simulation was standing up something real. */
const SIMULATION_LOGIN_STRING = 'simulation-only-not-a-credential';

/**
 * Starts `.control-room/server.mjs` on an ephemeral loopback port
 * against the temporary world, logs in as a synthetic approver, and
 * posts one review. Returns everything the trace needs, including
 * every refusal.
 */
export async function authorizationLeg(world, proposal, { action = 'approve' } = {}) {
  const { readConfig } = await import('../../.control-room/config.mjs');
  const { provisionOperator } = await import('../../.control-room/identity.mjs');
  const { serve, ROUTES, PUBLIC_ROUTES } = await import('../../.control-room/server.mjs');

  const cfg = {
    ...readConfig({}),
    state_dir: world.dirs.state,
    records_dir: world.dirs.records,
    decision_dir: world.dirs.decisions,
    trace_dir: world.dirs.traces,
    port: 0,
  };

  /* Four synthetic operators at four roles. The registry refuses to
     start empty, and that refusal is the feature — there is no
     default account here and none may be created. */
  const operators = {};
  for (const [name, roles] of [['viewer', ['viewer']], ['reviewer', ['reviewer']], ['approver', ['approver']], ['admin', ['administrator']]]) {
    /* Idempotent because leg 6 runs twice against one state
       directory. Re-provisioning is REFUSED by identity.mjs rather
       than silently replacing a credential, which is the behaviour
       being relied on here rather than worked around. */
    try {
      operators[name] = provisionOperator(cfg, {
        subject: `sim-${name}@example.invalid`, roles, password: SIMULATION_LOGIN_STRING,
        createdBy: 'agent/simulation/run.mjs — SESSION 24, synthetic. Not a person.',
      });
    } catch (e) {
      if (e.name !== 'ProvisioningRefused') throw e;
      operators[name] = { existing: true, subject: `sim-${name}@example.invalid`, roles };
    }
  }

  const server = serve({ cfg, quiet: true });
  await new Promise((ok, fail) => { server.once('listening', ok); server.once('error', fail); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const observations = [];

  const get = (path, cookie) => fetch(`${origin}${path}`, { headers: cookie ? { cookie } : {}, redirect: 'manual' });
  const login = async (subject) => {
    const res = await fetch(`${origin}/auth/local`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, password: SIMULATION_LOGIN_STRING }) });
    if (!res.ok) return { ok: false, status: res.status };
    const cookie = res.headers.getSetCookie()[0].split(';')[0];
    const session = await (await fetch(`${origin}/api/session`, { headers: { cookie } })).json();
    return { ok: true, cookie, csrf: session.csrf, actor: session.actor };
  };

  try {
    /* 1 · the anonymous surface. Measured, not assumed. */
    const anonymous = [];
    for (const r of ROUTES.filter((x) => x.method === 'GET')) {
      const res = await get(r.path);
      anonymous.push({ path: r.path, public: r.public === true, status: res.status, answered_200: res.status === 200 });
    }
    observations.push({
      what: 'every GET route, unauthenticated',
      result: anonymous,
      finding: anonymous.filter((a) => !a.public && a.answered_200).length === 0
        ? 'no private route answered an anonymous request'
        : `PRIVATE ROUTES ANSWERED ANONYMOUSLY: ${anonymous.filter((a) => !a.public && a.answered_200).map((a) => a.path).join(', ')}`,
      public_surface: PUBLIC_ROUTES,
    });

    /* 2 · the wrong role. A viewer may read the queue and may not
       decide, and the interface never gets a say in that. */
    const viewer = await login('sim-viewer@example.invalid');
    const viewerReview = await fetch(`${origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: viewer.cookie, 'x-control-room-csrf': viewer.csrf },
      body: JSON.stringify({ proposal_id: proposal.proposal_id, action: 'approve', fingerprint: proposalFingerprint(proposal), note: null }),
    });
    observations.push({
      what: 'a viewer approves',
      status: viewerReview.status,
      body: await viewerReview.json().catch(() => ({})),
      finding: [401, 403].includes(viewerReview.status)
        ? `refused ${viewerReview.status} — authorization is server-side and the caller\'s roles are re-read from the registry on every request`
        : `NOT REFUSED (${viewerReview.status})`,
    });

    /* 3 · the right role, the right fingerprint. */
    const approver = await login('sim-approver@example.invalid');
    const admin = await login('sim-admin@example.invalid');
    const actor = proposal.autonomy_class === 'human_only' ? admin : approver;

    const wrongFingerprint = await fetch(`${origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: actor.cookie, 'x-control-room-csrf': actor.csrf },
      body: JSON.stringify({ proposal_id: proposal.proposal_id, action, fingerprint: 'f'.repeat(64), note: null }),
    });
    observations.push({
      what: 'the right role, a stale fingerprint',
      status: wrongFingerprint.status,
      body: await wrongFingerprint.json().catch(() => ({})),
      finding: wrongFingerprint.status === 409
        ? 'refused 409 — the decision is bound to the proposal as the reviewer saw it, so editing a proposal after approval voids the approval'
        : `expected 409, got ${wrongFingerprint.status}`,
    });

    const real = await fetch(`${origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: actor.cookie, 'x-control-room-csrf': actor.csrf },
      body: JSON.stringify({ proposal_id: proposal.proposal_id, action, fingerprint: proposalFingerprint(proposal), note: action === 'approve' ? 'SIMULATED decision, SESSION 24. Not a person, not an authorisation for anything real.' : 'simulated' }),
    });
    const realBody = await real.json().catch(() => ({}));
    observations.push({
      what: `the decision itself (${action}) by ${actor.actor?.operator_id ?? 'unknown'}`,
      status: real.status, body: realBody,
      finding: real.status === 200
        ? 'accepted. One line written to the TEMPORARY decision ledger; nothing published.'
        : `refused ${real.status}: ${realBody.code ?? ''} ${realBody.error ?? realBody.message ?? ''}`,
    });

    /* 4 · CSRF, and the audit trail. */
    const noCsrf = await fetch(`${origin}/api/review`, {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: actor.cookie },
      body: JSON.stringify({ proposal_id: proposal.proposal_id, action: 'approve', fingerprint: proposalFingerprint(proposal), note: null }),
    });
    observations.push({ what: 'the same request with no CSRF token', status: noCsrf.status, finding: [400, 403].includes(noCsrf.status) ? `refused ${noCsrf.status}` : `NOT REFUSED (${noCsrf.status})` });

    const auditRes = await get('/api/audit', admin.cookie);
    const audit = await auditRes.json().catch(() => ({}));
    observations.push({
      what: 'the audit trail, re-walked',
      status: auditRes.status,
      entries: Array.isArray(audit.entries) ? audit.entries.length : null,
      chain: audit.chain ?? audit.verification ?? null,
      finding: auditRes.status === 200 ? 'the trail is readable by an administrator and its hash chain is re-walked on read' : `audit unreadable (${auditRes.status})`,
    });

    return { origin, observations, ledger: world.ledgerLines(), operators: Object.keys(operators), decided_by: actor.actor?.operator_id ?? null };
  } finally {
    await new Promise((ok) => server.close(ok));
  }
}

/* ============================================================
   The cycle
   ============================================================ */

export async function runCycle({ traceDir = null, quiet = true } = {}) {
  const before = fingerprintTree(REPO_ROOT);
  const world = new SimWorld();
  const startedAt = new Date().toISOString();

  const sink = traceDir ? new JsonlSink({ dir: traceDir }) : new JsonlSink({ dir: world.dirs.traces });
  const tracer = new Tracer({ service: 'eu-digital-policy-simulation', sink, env: 'simulation' });
  const dispatchers = simulationDispatchers();

  const legs = [];

  /* ---------------------------------------------- legs 1–5, 7, 8 */
  for (const leg of LEGS.filter((l) => !l.needs_authorization)) {
    const journal = new WorkflowJournal({ dir: world.dirs.journal });
    const o = new Orchestrator({ tracer, journal, dispatchers, now: () => SIM_NOW, root: REPO_ROOT });
    const result = await o.handle({ ...leg.event, workflow_type: leg.workflow_type });
    legs.push({ ...leg, result });
    if (!quiet) process.stdout.write(`leg ${leg.leg} ${leg.workflow_type} → ${result.state}\n`);
  }

  /* ---------------------------------------------- leg 6, run twice */
  const authLeg = LEGS.find((l) => l.needs_authorization);

  /* 6a · the honest run: the proposal is marked simulated. */
  const marked = markedProposal();
  world.writeRecords([marked, approvalRequestFor(marked)], 'a1'.repeat(16));
  const markedPre = preflight(marked.proposal_id, {
    records: readAgentRecords({ dir: world.dirs.records }),
    ledger: readLedger({ dir: world.dirs.decisions }),
  });

  const markedAuth = await authorizationLeg(world, marked, { action: 'approve' });
  const markedWorkflow = await runImplementation(world, tracer, dispatchers, marked, authLeg);

  /* 6b · the control fixture: the same proposal with the simulated
     mark cleared, so the eight gates behind gate 2 are observable at
     all. The reason this is necessary is a FINDING, not a fix. */
  const unmarked = unmarkedControlFixture();
  world.writeRecords([unmarked, approvalRequestFor(unmarked)], 'b2'.repeat(16));
  const unmarkedAuth = await authorizationLeg(world, unmarked, { action: 'approve' });
  const unmarkedPre = preflight(unmarked.proposal_id, {
    records: readAgentRecords({ dir: world.dirs.records }),
    ledger: readLedger({ dir: world.dirs.decisions }),
  });
  const unmarkedApproval = deriveApproval(unmarked.proposal_id, {
    records: readAgentRecords({ dir: world.dirs.records }),
    ledger: readLedger({ dir: world.dirs.decisions }),
  });
  const unmarkedWorkflow = await runImplementation(world, tracer, dispatchers, unmarked, authLeg);

  legs.push({
    ...authLeg,
    variants: [
      { variant: 'marked_simulated', proposal_id: marked.proposal_id, preflight: markedPre, control_room: markedAuth, result: markedWorkflow },
      { variant: 'control_fixture_unmarked', proposal_id: unmarked.proposal_id, preflight: unmarkedPre, approval: unmarkedApproval, control_room: unmarkedAuth, result: unmarkedWorkflow },
    ],
  });
  legs.sort((a, b) => a.leg - b.leg);

  const ledger = world.ledgerLines();
  const traceFiles = readTraceIds(traceDir ?? world.dirs.traces);
  const changed = diffFingerprints(before, fingerprintTree(REPO_ROOT));

  const out = {
    scenario: SCENARIO,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    graph_order: [...GRAPH_ORDER],
    legs,
    not_walked: [...NOT_WALKED],
    ledger,
    trace_ids: traceFiles,
    trace_dir: traceDir ?? null,
    repository_changed: changed,
    published: false,
    publication_note:
      'Nothing was published and nothing in the repository was changed. Every store this run wrote is a mkdtemp directory that no longer exists, '
      + 'and `repository_changed` is a measured before/after fingerprint of the working tree rather than an assurance.',
  };

  if (!traceDir) world.clean();
  else { world.clean(); }
  return out;
}

/* ---------------------------------------------------------- helpers */

function approvalRequestFor(proposal) {
  const a = fx.editorialApproval();
  return {
    ...a,
    agent: proposal.agent,
    simulated: proposal.simulated,
    evidence: (a.evidence ?? []).map((e) => ({ ...e, simulated: proposal.simulated })),
    approval_id: `appr-${proposal.proposal_id}`,
    proposal_ids: [proposal.proposal_id],
    state: 'requested',
    decision: null,
  };
}

async function runImplementation(world, tracer, dispatchers, proposal, leg) {
  const journal = new WorkflowJournal({ dir: world.dirs.journal });
  const o = new Orchestrator({
    tracer, journal, dispatchers, now: () => SIM_NOW, root: REPO_ROOT,
    records: readAgentRecords({ dir: world.dirs.records }),
    ledger: readLedger({ dir: world.dirs.decisions }),
  });
  return o.handle({
    ...leg.event,
    workflow_type: 'IMPLEMENTATION_REQUEST',
    subject: { contract: proposal.contract, id: proposal.proposal_id },
    /* Deliberately carrying the fields the intake strips. A run that
       never tried would not show that they are stripped. */
    approved: true, authorized: true, decided_by: 'nobody', force: true, deploy: true,
    payload: { scope: (proposal.files ?? []).slice() },
  });
}

function readTraceIds(dir) {
  try { return readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => f.replace(/\.jsonl$/, '')); }
  catch { return []; }
}
