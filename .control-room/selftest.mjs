/* ============================================================
   .control-room/selftest.mjs — the Control Room's security suite

     node --test .control-room/selftest.mjs

   SESSION 21 names sixteen things this must prove. Each is a test
   below with its number in the title, and each is proved AGAINST A
   RUNNING SERVER over real HTTP wherever the claim is about a
   request — because a claim about what a route does, tested by
   calling a function, is a claim about a function.

   TWO THINGS THE SHAPE OF THIS FILE IS TRYING TO AVOID.

   A test that passes for the wrong reason. Several of these could
   pass because a route does not exist, a fixture is malformed, or
   the server refused for some unrelated reason. So the negative
   tests assert the STATUS AND THE REASON, and every one of them is
   paired with a positive test proving the same path works for
   somebody who is allowed — an authorization test that only ever
   sees 403 cannot tell "correctly refused" from "broken".

   And a test weakened to make a change pass. The eight synthetic
   credentials planted below exist to prove the secret scan works;
   `boundary.mjs` names this file as one of its own two exemptions
   for exactly that reason, and deleting them to make a check clean
   would be the failure `docs/AUTONOMY-POLICY.md` prohibition 16
   describes.

   WHAT THIS SUITE DOES NOT PROVE, stated here rather than implied:

     · that the OIDC provider works against a REAL identity provider.
       It is tested against a local stub with a real key pair — the
       signature, issuer, audience, expiry, nonce, PKCE and state
       checks are genuinely exercised, and a forged signature and an
       `alg: none` token are genuinely refused — but nothing here has
       ever spoken to Auth0, Okta, Entra or Keycloak, and this
       environment's network policy means nothing here could.
     · that the deployed site does not serve `.control-room/`. That
       is inferred from GitHub Pages' documented default and from the
       repository's own boundary module; the deployed origin has
       never been fetched.
     · that scrypt parameters, TLS termination or a reverse proxy in
       front of this are configured correctly. None of that is in
       this tree.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createServer } from 'node:http';
import { generateKeyPairSync, sign as cryptoSign, createHash } from 'node:crypto';

import { readConfig, configRefusals, describeConfig, assertConfig, isLoopback, serverOrigin, CONTROL_ROOM_ROOT, REPO_ROOT } from './config.mjs';
import { provisionOperator, setRoles, setDisabled, registryRefusals, listOperators, verifyPassword, hashPassword, passwordRefusal, REFUSED_PASSWORDS, ProvisioningRefused } from './identity.mjs';
import { authorize, permissionsOf, approvalPermissionFor, ROLES, ROLE_PERMISSIONS, PERMISSIONS, visibleActions } from './authz.mjs';
import { workflowsView } from './views.mjs';
import { AuditLog, AUDIT_ACTIONS, REQUIRED_FIELDS } from './audit.mjs';
import { SessionStore, resolveSession, OidcProvider, sanitiseReturnTo, parseCookies, safeEqual, ACCEPTED_JWT_ALGS } from './authn.mjs';
import { serve, ROUTES, PUBLIC_ROUTES, PROHIBITED_ROUTE_WORDS, routeFor, parseStrictJson, MAX_BODY_BYTES } from './server.mjs';
import { decide, reviewQueue, DECIDABLE_STATES, PUBLICATION_NOTE } from './decide.mjs';
import { controlRoomBoundary } from './boundary.mjs';
import { RECORD_COMMAND } from '../tools/evidence-audit-record.mjs';
import { execFileSync } from 'node:child_process';
import { dataProposalFixture, approvalRequestFixture } from '../agent/schemas/fixtures.mjs';
import { validate } from '../agent/schemas/validate.mjs';
import { readLedger, deriveApproval, proposalFingerprint } from '../agent/implement/ledger.mjs';
import { SECRET_PATTERNS, publicSurface } from '../agent/implement/boundary.mjs';
import { MemorySink } from '../agent/observability/sink.mjs';
import { Tracer } from '../agent/observability/tracer.mjs';

/* ============================================================
   Fixtures
   ============================================================ */

const PASSWORD = 'a sufficiently long passphrase';
/** Every section on the fixed list: what a reviewer who examined the
 *  whole chain declares (roadmap v2 item 0.2). */
const ATTEST = Object.freeze({ examined: ['evidence', 'sources', 'operations', 'tests', 'rollback'] });
const temps = [];
const tempDir = (p = 'cr-') => { const d = mkdtempSync(join(tmpdir(), p)); temps.push(d); return d; };
process.on('exit', () => { for (const d of temps) { try { rmSync(d, { recursive: true, force: true }); } catch { /* nothing to do at exit */ } } });

/** A proposal the governance gates accept, so an approval can
 *  actually be exercised. Derived from the repository's own contract
 *  fixture and de-simulated, rather than hand-written: a fixture
 *  that drifted from the contract would make every test below
 *  vacuous. */
function decidableProposal(id = 'prop-cr-test-001', over = {}) {
  const deSim = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === 'simulated' ? false : v));
  const p = deSim(dataProposalFixture());
  p.proposal_id = id;
  p.agent = 'data-proposal-agent';
  Object.assign(p, over);
  return p;
}

function approvalRequestFor(proposalId, approvalId = `appr-${proposalId}`) {
  const deSim = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === 'simulated' ? false : v));
  const a = deSim(approvalRequestFixture());
  a.approval_id = approvalId;
  a.proposal_ids = [proposalId];
  a.agent = 'data-proposal-agent';
  a.state = 'requested';
  a.decision = null;
  return a;
}

/** Writes the records where `readAgentRecords({ dir })` finds them:
 *  one JSONL file per trace. */
function writeRecords(dir, records) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1.jsonl'), `${records.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
}

/**
 * A whole world: a state directory, a record store with one
 * decidable proposal, an empty decision ledger, and operators at
 * every role.
 */
function world({ proposals = null, env = {} } = {}) {
  const state = tempDir('cr-state-');
  const records = tempDir('cr-records-');
  const decisions = tempDir('cr-decisions-');
  const traces = tempDir('cr-traces-');
  const editorial = tempDir('cr-editorial-');
  const cfg = { ...readConfig(env), state_dir: state, records_dir: records, decision_dir: decisions, trace_dir: traces, editorial_audit_dir: editorial, port: 0 };

  const p = proposals ?? [decidableProposal()];
  writeRecords(records, [...p, ...p.map((x) => approvalRequestFor(x.proposal_id))]);

  const operators = {
    admin: provisionOperator(cfg, { subject: 'admin@example.org', roles: ['administrator'], password: PASSWORD, createdBy: 'suite' }),
    approver: provisionOperator(cfg, { subject: 'approver@example.org', roles: ['approver'], password: PASSWORD, createdBy: 'suite' }),
    reviewer: provisionOperator(cfg, { subject: 'reviewer@example.org', roles: ['reviewer'], password: PASSWORD, createdBy: 'suite' }),
    viewer: provisionOperator(cfg, { subject: 'viewer@example.org', roles: ['viewer'], password: PASSWORD, createdBy: 'suite' }),
  };
  return { cfg, operators, proposals: p, dirs: { state, records, decisions, traces } };
}

/** Starts a real server on an ephemeral loopback port. */
async function running(w) {
  const server = serve({ cfg: w.cfg, quiet: true });
  await new Promise((ok, fail) => { server.once('listening', ok); server.once('error', fail); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    server, origin,
    stop: () => new Promise((ok) => server.close(ok)),
    async login(subject, password = PASSWORD) {
      const res = await fetch(`${origin}/auth/local`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, password }) });
      if (!res.ok) return { ok: false, status: res.status, body: await res.json().catch(() => ({})) };
      const cookie = res.headers.getSetCookie()[0].split(';')[0];
      const session = await (await fetch(`${origin}/api/session`, { headers: { cookie } })).json();
      return { ok: true, cookie, csrf: session.csrf, actor: session.actor };
    },
    /* `redirect: 'manual'`, deliberately. Following a redirect would
       turn "refused, go and log in" into a 200 from the login page,
       and every unauthenticated-access test below would pass by
       reading a login form. */
    get: (path, cookie) => fetch(`${origin}${path}`, { headers: cookie ? { cookie } : {}, redirect: 'manual' }),
    post: (path, body, { cookie, csrf } = {}) => fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...(csrf ? { 'x-control-room-csrf': csrf } : {}) },
      body: JSON.stringify(body),
    }),
  };
}

/* ============================================================
   1 · unauthenticated users cannot access private Control Room data
   ============================================================ */

test('1 · every private route refuses an unauthenticated request, and no private route answers one', async () => {
  const w = world();
  const s = await running(w);
  try {
    const priv = ROUTES.filter((r) => !r.public);
    assert.ok(priv.length >= 10, 'the suite must be checking the whole private surface');
    const answered = [];
    for (const r of priv) {
      const res = r.method === 'GET' ? await s.get(r.path) : await s.post(r.path, {});
      const body = await res.text();
      if (r.path.startsWith('/api/') || r.method !== 'GET') {
        assert.equal(res.status, 401, `${r.method} ${r.path} answered ${res.status} without a session`);
        assert.ok(!body.includes('operator_id'), `${r.method} ${r.path} leaked operator data in its refusal`);
      } else {
        /* A page request redirects to the login form rather than
           returning 401, which is the right behaviour for a browser
           and is still not access. */
        assert.equal(res.status, 302, `${r.method} ${r.path} answered ${res.status}`);
        assert.match(res.headers.get('location'), /^\/login/);
      }
      if (res.status >= 200 && res.status < 300) answered.push(`${r.method} ${r.path}`);
    }
    assert.deepEqual(answered, [], 'no private route may answer an unauthenticated request');
  } finally { await s.stop(); }
});

test('1b · the public surface is exactly the login surface, and nothing on it carries system data', async () => {
  const w = world();
  const s = await running(w);
  try {
    /* SESSION 20 measured the observability viewer and found NINE OF
       ELEVEN privileged routes answering an unauthenticated request.
       This is the same question asked of this server, and the answer
       has to be a short, named list rather than a small number. */
    assert.deepEqual(PUBLIC_ROUTES.sort(), [
      'GET /auth/callback', 'GET /auth/login', 'GET /auth/providers',
      'GET /healthz', 'GET /login', 'GET /login.css', 'GET /login.js',
      'POST /auth/local',
    ].sort());

    const providers = await (await s.get('/auth/providers')).json();
    assert.deepEqual(Object.keys(providers), ['provider'], '/auth/providers must return the provider name and nothing else');
    const health = await (await s.get('/healthz')).json();
    assert.deepEqual(health, { status: 'ok' }, '/healthz must carry no system information');
    const login = await (await s.get('/login')).text();
    for (const leak of ['operator', 'admin@example.org', w.cfg.state_dir, 'decisions.jsonl']) {
      assert.ok(!login.includes(leak), `the login page carries "${leak}"`);
    }
  } finally { await s.stop(); }
});

/* ============================================================
   2 · unauthenticated users cannot perform privileged actions
   ============================================================ */

test('2 · an unauthenticated approval is refused, and writes no line to the ledger', async () => {
  const w = world();
  const s = await running(w);
  try {
    const id = w.proposals[0].proposal_id;
    const res = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint: proposalFingerprint(w.proposals[0]) });
    assert.equal(res.status, 401);
    const led = readLedger({ dir: w.cfg.decision_dir });
    assert.equal(led.decisions.length, 0, 'an unauthenticated request wrote a decision');
    assert.equal(deriveApproval(id, { records: undefined, ledger: led }).state !== 'granted', true);
  } finally { await s.stop(); }
});

/* ============================================================
   3 · authenticated users without sufficient permission cannot
       approve
   ============================================================ */

test('3 · a reviewer may request changes and may NOT approve or reject; an approver may do all three', async () => {
  const w = world();
  const s = await running(w);
  try {
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);

    const reviewer = await s.login('reviewer@example.org');
    for (const action of ['approve', 'reject']) {
      const res = await s.post('/api/review', { action, proposal_id: id, fingerprint }, reviewer);
      const body = await res.json();
      assert.equal(res.status, 403, `a reviewer got ${res.status} for ${action}`);
      assert.match(body.reason, /is not among them|not among/, 'the refusal must say which permission was missing');
    }
    /* The paired positive. Without it, a 403 could mean the endpoint
       is simply broken. */
    const changes = await s.post('/api/review', { action: 'request_changes', proposal_id: id, fingerprint, note: 'The second operation needs a source.' }, reviewer);
    const changesBody = await changes.json();
    assert.equal(changes.status, 200, JSON.stringify(changesBody));
    assert.equal(changesBody.outcome, 'changes_requested');
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0, 'a change request is not an approval and writes no ledger line');

    const approver = await s.login('approver@example.org');
    const ok = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint, note: 'Read the passage.', attestation: ATTEST }, approver);
    const okBody = await ok.json();
    assert.equal(ok.status, 200, JSON.stringify(okBody));
    assert.equal(okBody.outcome, 'granted');
  } finally { await s.stop(); }
});

test('3b · a viewer cannot reach the review endpoint at all, and CAN reach the views they hold', async () => {
  const w = world();
  const s = await running(w);
  try {
    const viewer = await s.login('viewer@example.org');
    const denied = await s.post('/api/review', { action: 'request_changes', proposal_id: w.proposals[0].proposal_id, fingerprint: 'x', note: 'n' }, viewer);
    assert.equal(denied.status, 403);
    for (const path of ['/api/live', '/api/queue', '/api/health']) {
      assert.equal((await s.get(path, viewer.cookie)).status, 200, `a viewer must be able to read ${path}`);
    }
    for (const path of ['/api/audit', '/api/operators']) {
      assert.equal((await s.get(path, viewer.cookie)).status, 403, `a viewer must not read ${path}`);
    }
  } finally { await s.stop(); }
});

/* ============================================================
   4 · authorized users can perform only what their role permits
   ============================================================ */

test('4 · a human_only proposal needs the administrator-only permission, and an approver is refused it', async () => {
  const humanOnly = decidableProposal('prop-cr-human-only', { autonomy_class: 'human_only' });
  const w = world({ proposals: [humanOnly] });
  const s = await running(w);
  try {
    const fingerprint = proposalFingerprint(humanOnly);
    assert.equal(approvalPermissionFor(humanOnly), 'proposal:approve:human_only');

    const approver = await s.login('approver@example.org');
    const refused = await s.post('/api/review', { action: 'approve', proposal_id: humanOnly.proposal_id, fingerprint }, approver);
    assert.equal(refused.status, 403);
    assert.match((await refused.json()).fix, /red tier|Class D/, 'the refusal must say why the class matters');

    const admin = await s.login('admin@example.org');
    const allowed = await s.post('/api/review', { action: 'approve', proposal_id: humanOnly.proposal_id, fingerprint, note: 'Author authorised this by name.', attestation: ATTEST }, admin);
    assert.equal(allowed.status, 200, JSON.stringify(await allowed.json()));
  } finally { await s.stop(); }
});

test('4b · a proposal with an unrecognised autonomy class takes the STRICTEST permission', () => {
  /* docs/AUTONOMY-POLICY.md: "Default when unsure: the higher class.
     Misclassifying downward is the failure this document exists to
     prevent." */
  assert.equal(approvalPermissionFor({ autonomy_class: 'something_new' }), 'proposal:approve:human_only');
  assert.equal(approvalPermissionFor({}), 'proposal:approve:human_only');
  assert.equal(approvalPermissionFor(null), 'proposal:approve:human_only');
});

test('4c · a role revoked while a session is open takes effect on the NEXT request', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    assert.equal((await s.get('/api/queue', approver.cookie)).status, 200);
    setRoles(w.cfg, { subject: 'approver@example.org', roles: ['viewer'], changedBy: 'suite' });
    const res = await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]) }, approver);
    assert.equal(res.status, 403, 'the session must not carry the role it had at login');
    /* And a disabled operator loses everything, session or not. */
    setDisabled(w.cfg, { subject: 'approver@example.org', disabled: true, changedBy: 'suite' });
    assert.equal((await s.get('/api/queue', approver.cookie)).status, 401);
  } finally { await s.stop(); }
});

/* ============================================================
   5 · frontend-only authorization cannot bypass server-side
       authorization
   ============================================================ */

test('5 · a client that ignores every hint the interface gave it is still refused', async () => {
  const w = world();
  const s = await running(w);
  try {
    const viewer = await s.login('viewer@example.org');
    /* `visibleActions` is what the interface uses to hide a button.
       The client here does not consult it, sends the request anyway,
       and adds fields claiming a role. */
    assert.equal(visibleActions(viewer.actor).approve, false, 'the interface would have hidden the button');
    const res = await s.post('/api/review', {
      action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]),
    }, viewer);
    assert.equal(res.status, 403);
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0);

    /* And a body that tries to say who it is, is refused as
       malformed before anything reads it. Sent as the APPROVER, who
       gets past the route gate — as the viewer it would stop at the
       403 above and prove nothing about the body check. */
    const approver = await s.login('approver@example.org');
    const claiming = await fetch(`${s.origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: approver.cookie, 'x-control-room-csrf': approver.csrf },
      body: JSON.stringify({ action: 'approve', proposal_id: 'x', fingerprint: 'y', roles: ['administrator'], actor: 'admin@example.org' }),
    });
    assert.equal(claiming.status, 400);
    assert.match((await claiming.json()).reason, /roles, actor/);
  } finally { await s.stop(); }
});

test('5b · authorize() denies by default, including for an action nobody defined', () => {
  const admin = { operator_id: 'op-x', roles: ['administrator'], subject: 'a@b' };
  assert.equal(authorize({ actor: admin, action: 'proposal:approve' }).allow, true);
  for (const action of ['', null, undefined, 'anything', 'proposal:approve:everything', '*', 'admin']) {
    const d = authorize({ actor: admin, action });
    assert.equal(d.allow, false, `"${action}" was allowed for an administrator`);
    assert.ok(d.reason.length > 20, 'a refusal says why');
  }
  /* Even for the strongest role: an unknown action is not a
     permission somebody merely forgot to grant. */
  assert.ok(!permissionsOf(['administrator']).includes('anything'));
});

test('5c · a route that declares no permission fails closed', () => {
  for (const r of ROUTES) {
    const ok = Boolean(r.permission) || r.public === true || r.session_only === true;
    assert.ok(ok, `${r.method} ${r.path} declares neither a permission nor public/session_only`);
  }
  /* And the router refuses one that got through anyway. */
  const original = [...ROUTES];
  ROUTES.push({ method: 'GET', path: '/api/forgotten', permission: null });
  try {
    const r = routeFor('GET', '/api/forgotten');
    assert.equal(r.route, null);
    assert.equal(r.status, 403);
    assert.match(r.reason, /Fail closed/);
  } finally { ROUTES.length = 0; ROUTES.push(...original); }
});

/* ============================================================
   6 · approval endpoints cannot be invoked anonymously
   ============================================================ */

test('6 · every approval is attributable, and the trail refuses an unattributed one', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'checked', attestation: ATTEST }, approver);

    const led = readLedger({ dir: w.cfg.decision_dir });
    assert.equal(led.decisions.length, 1);
    assert.equal(led.decisions[0].decided_by, 'approver@example.org', 'the ledger records the AUTHENTICATED subject');
    assert.ok(led.decisions[0].decided_at);
    assert.ok(led.decisions[0].proposal_sha256);

    const trail = new AuditLog(w.cfg).read().entries.filter((e) => e.action === 'proposal.approved');
    assert.equal(trail.length, 1);
    assert.equal(trail[0].actor_id, w.operators.approver.operator_id);
    assert.ok(trail[0].session_id, 'the entry names the session the decision came from');
  } finally { await s.stop(); }
});

test('6b · the audit log refuses to write an approval with no actor', () => {
  const w = world();
  const log = new AuditLog(w.cfg);
  assert.throws(() => log.record({ action: 'proposal.approved', outcome: 'allowed', proposal_id: 'p' }), /anonymous decision/);
  /* And an action nobody declared cannot be audited, which means it
     cannot be performed. */
  assert.throws(() => log.record({ action: 'proposal.silently_applied', outcome: 'allowed' }), /not an audited action/);
});

/* ============================================================
   7 · proposal IDs cannot be manipulated to approve unrelated
       proposals
   ============================================================ */

test('7 · approving proposal A does not decide proposal B, and an id for something that is not a proposal is refused', async () => {
  const a = decidableProposal('prop-cr-a');
  const b = decidableProposal('prop-cr-b');
  const w = world({ proposals: [a, b] });
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const res = await s.post('/api/review', { action: 'approve', proposal_id: 'prop-cr-a', fingerprint: proposalFingerprint(a), note: 'A only', attestation: ATTEST }, approver);
    assert.equal(res.status, 200, JSON.stringify(await res.json()));

    const led = readLedger({ dir: w.cfg.decision_dir });
    assert.deepEqual(led.decisions.map((d) => d.proposal_id), ['prop-cr-a']);
    const queue = reviewQueue(w.cfg);
    assert.equal(queue.find((i) => i.proposal_id === 'prop-cr-b').approval.state, 'pending', 'deciding A must leave B pending');

    /* An id that names nothing, and an id that names a record which
       is not a proposal. */
    const missing = await s.post('/api/review', { action: 'approve', proposal_id: 'prop-does-not-exist', fingerprint: 'x' }, approver);
    assert.equal(missing.status, 404);
    const notAProposal = await s.post('/api/review', { action: 'approve', proposal_id: `appr-prop-cr-b`, fingerprint: 'x' }, approver);
    assert.equal(notAProposal.status, 409);
    assert.match((await notAProposal.json()).error, /not_a_proposal/);
  } finally { await s.stop(); }
});

/* ============================================================
   8 · proposal scope cannot be expanded through request manipulation
   ============================================================ */

test('8 · scope comes from the stored proposal; a body naming files, operations or a scope is refused', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    for (const extra of [
      { permitted_files: ['data/claims.json', 'index.html', 'i18n/locales.json'] },
      { scope: { permitted: ['/etc/passwd'] } },
      { proposed_change: { operations: [{ op: 'remove', target: 'data/claims.json' }] } },
      { outcome: 'granted' },
      { autonomy_class: 'autonomous' },
    ]) {
      const res = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint: proposalFingerprint(w.proposals[0]), ...extra }, approver);
      assert.equal(res.status, 400, `a body carrying ${Object.keys(extra)[0]} was not refused`);
      assert.match((await res.json()).reason, new RegExp(Object.keys(extra)[0]));
    }
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0, 'none of those may have decided anything');

    /* And the approval that IS accepted records the scope the
       PROPOSAL defines, not anything a caller supplied. */
    const ok = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint: proposalFingerprint(w.proposals[0]), attestation: ATTEST }, approver);
    assert.equal(ok.status, 200);
    const entry = new AuditLog(w.cfg).read().entries.find((e) => e.action === 'proposal.approved');
    assert.deepEqual(entry.approved_scope.permitted_files, ['data/claims.json']);
  } finally { await s.stop(); }
});

test('8b · a decision is bound to the exact version reviewed; editing the proposal voids it', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    const stale = proposalFingerprint(w.proposals[0]);

    /* The proposal is edited after the queue was displayed — the
       "approve something small, then widen it" case. */
    const widened = decidableProposal(id, {
      proposed_change: { ...w.proposals[0].proposed_change, summary: 'Add one source reference AND rewrite the claim.' },
    });
    writeRecords(w.cfg.records_dir, [widened, approvalRequestFor(id)]);

    const res = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint: stale }, approver);
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /scope_changed/);
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0);

    /* A decision with no fingerprint at all is refused too: it could
       not be bound to anything. */
    const noFingerprint = await s.post('/api/review', { action: 'approve', proposal_id: id }, approver);
    assert.equal(noFingerprint.status, 400);
    assert.match((await noFingerprint.json()).error, /no_fingerprint/);
  } finally { await s.stop(); }
});

/* ============================================================
   9 · rejected proposals cannot be approved without entering a valid
       governed state
   ============================================================ */

test('9 · a denied proposal cannot be approved by sending the request again', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);

    const denied = await s.post('/api/review', { action: 'reject', proposal_id: id, fingerprint, note: 'The evidence does not carry it.', attestation: ATTEST }, approver);
    const deniedBody = await denied.json();
    assert.equal(denied.status, 200, JSON.stringify(deniedBody));
    assert.equal(deniedBody.outcome, 'denied');

    const again = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint }, approver);
    assert.equal(again.status, 409, 'approving over a denial would make the denial advisory');
    const body = await again.json();
    assert.match(body.error, /state_denied/);
    assert.match(body.fix, /fresh ApprovalRequest/);

    const led = readLedger({ dir: w.cfg.decision_dir });
    assert.deepEqual(led.decisions.map((d) => d.outcome), ['denied'], 'no second line may have been written');
    assert.equal(deriveApproval(id, { ledger: led, records: { byId: new Map([[id, w.proposals[0]]]), approvalRequests: [approvalRequestFor(id)], traces: [] } }).state, 'denied');
  } finally { await s.stop(); }
});

test('9b · an already-granted proposal is not decided twice, and only "pending" is decidable', async () => {
  const w = world();
  const s = await running(w);
  try {
    assert.deepEqual(DECIDABLE_STATES, ['pending']);
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);
    assert.equal((await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint, attestation: ATTEST }, approver)).status, 200);
    const twice = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint }, approver);
    assert.equal(twice.status, 409);
    assert.match((await twice.json()).error, /state_granted/);
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 1);
  } finally { await s.stop(); }
});

/* ============================================================
   10 · approval cannot directly publish to production
   ============================================================ */

test('10 · an approval changes exactly one file, and it is the decision ledger', async () => {
  const w = world();
  const s = await running(w);

  /* Hash the whole repository before and after. Not a spot check of
     data/ — the whole tree, so a write anywhere is caught. */
  const hashTree = (root) => {
    const out = {};
    (function look(dir, rel = '') {
      for (const name of readdirSync(dir).sort()) {
        if (name === '.git' || name === 'node_modules') continue;
        const abs = join(dir, name);
        const r = rel ? `${rel}/${name}` : name;
        let st; try { st = statSync(abs); } catch { continue; }
        if (st.isDirectory()) look(abs, r);
        else out[r] = createHash('sha256').update(readFileSync(abs)).digest('hex');
      }
    })(root);
    return out;
  };

  try {
    const before = hashTree(REPO_ROOT);
    const approver = await s.login('approver@example.org');
    const res = await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'ok', attestation: ATTEST }, approver);
    assert.equal(res.status, 200);
    const out = await res.json();

    assert.equal(out.published, false);
    assert.equal(out.publication_note, PUBLICATION_NOTE);
    assert.equal(out.audit.git_ref, null, 'a git ref at decision time would mean the approval published something');

    const after = hashTree(REPO_ROOT);
    const changed = Object.keys({ ...before, ...after }).filter((f) => before[f] !== after[f]);
    assert.deepEqual(changed, [], `an approval wrote to the repository: ${changed.join(', ')}`);

    /* The ledger it DID write is the temporary one this test
       configured, which is the point: the decision went to a ledger
       and nowhere else. */
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 1);
  } finally { await s.stop(); }
});

test('10b · there is no route that could deploy, delete, apply, publish or execute anything', () => {
  for (const r of ROUTES) {
    for (const word of PROHIBITED_ROUTE_WORDS) {
      assert.ok(!r.path.toLowerCase().includes(word), `${r.method} ${r.path} names "${word}"`);
    }
  }
  /* And the server does not import the modules that would let it. */
  const src = readFileSync(join(CONTROL_ROOM_ROOT, 'server.mjs'), 'utf8');
  for (const forbidden of ['node:child_process', 'child_process', 'execSync', 'spawn(', 'unlinkSync', 'rmSync', 'writeFileSync']) {
    assert.ok(!src.includes(forbidden), `server.mjs references "${forbidden}", which would let a request change the machine`);
  }
  /* The Implementation Agent's applier is not reachable from here
     either: nothing in this directory imports it. */
  for (const f of readdirSync(CONTROL_ROOM_ROOT).filter((n) => n.endsWith('.mjs'))) {
    const text = readFileSync(join(CONTROL_ROOM_ROOT, f), 'utf8');
    assert.ok(!/from '\.\.\/agent\/implement\/apply\.mjs'/.test(text), `${f} imports the applier`);
  }
});

test('10c · SESSION 22 · the workflow view is a window on the Orchestrator, not a console over it', () => {
  /* The requirement is "expose workflow state to the private
     Control Room", and exposing it is the whole of it. The control
     that keeps it that way is the ABSENCE of a route, not a check
     inside one — a check can be moved. */
  const workflowRoutes = ROUTES.filter((r) => /workflow/.test(r.path));
  assert.equal(workflowRoutes.length, 1);
  assert.equal(workflowRoutes[0].method, 'GET');
  assert.equal(workflowRoutes[0].permission, 'workflows:read');

  /* No route, by any name, could start a run or dispatch an agent. */
  for (const r of ROUTES) {
    for (const word of ['start', 'dispatch', 'retry', 'resume', 'reopen', 'advance']) {
      assert.ok(!r.path.toLowerCase().includes(word), `${r.method} ${r.path} names "${word}"`);
    }
  }

  /* And the Control Room does not import the Orchestrator itself —
     only its read-side modules. A server that could construct one
     could run one. */
  const src = readFileSync(join(CONTROL_ROOM_ROOT, 'views.mjs'), 'utf8') + readFileSync(join(CONTROL_ROOM_ROOT, 'server.mjs'), 'utf8');
  assert.ok(!/orchestrator\/orchestrator\.mjs/.test(src), 'the Control Room imports the Orchestrator class, which would let a request run one');
  assert.ok(!/orchestrator\/events\.mjs/.test(src), 'the Control Room imports the event intake, which would let a request open a workflow');

  const view = workflowsView({});
  assert.ok(view.no_console.includes('do not exist'));
  assert.equal(view.registers.types.length, 10);
  /* An empty store is "no workflow journal exists here", never 0. */
  if (view.state !== 'measured') assert.match(view.why, /not the same as no workflow having run/);
});

test('10d · every role that can see the live system can see the workflow state, and none can change it', () => {
  for (const role of ROLES) {
    const held = permissionsOf([role]);
    if (held.includes('live:read')) assert.ok(held.includes('workflows:read'), `${role} sees runs but not the workflows they belong to`);
  }
  /* There is no write permission to hold. */
  assert.ok(!PERMISSIONS.some((p) => /^workflow.*:(write|run|start|dispatch)$/.test(p)));
});

/* ============================================================
   11 · every approval is attributable to an authenticated actor
   ============================================================ */

test('11 · the trail answers all five questions, and names any it cannot', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'Read the passage against the claim.', attestation: ATTEST }, approver);

    const entry = new AuditLog(w.cfg).read().entries.find((e) => e.action === 'proposal.approved');
    for (const field of REQUIRED_FIELDS) {
      assert.ok(field in entry, `the entry has no "${field}" key at all — a null is a statement, an absent key is not`);
    }
    assert.equal(entry.actor_subject, 'approver@example.org');            // who
    assert.deepEqual(entry.actor_roles, ['approver']);                     // with what authority
    assert.ok(entry.proposal_sha256);                                      // what exactly
    assert.ok(Date.parse(entry.ts));                                       // when
    assert.ok(Array.isArray(entry.provenance) && entry.provenance.length); // which evidence
    assert.ok(entry.agent_run?.trace_id);                                  // which agent run
    assert.equal(entry.previous_state, 'pending');
    assert.equal(entry.resulting_state, 'granted');
    assert.ok(Array.isArray(entry.required_tests) && entry.required_tests.length);
    assert.deepEqual(entry.missing_fields, [], 'this decision could answer every question, so nothing is listed as missing');

    /* And when something IS missing, it is named rather than
       silently absent. */
    const thin = new AuditLog(w.cfg).record({ action: 'proposal.changes_requested', outcome: 'allowed', actor: { operator_id: 'op-x', subject: 'x@y', roles: [] }, proposal_id: 'p' });
    assert.ok(thin.missing_fields.includes('previous_state'));
    assert.ok(thin.missing_fields.includes('agent_run'));
  } finally { await s.stop(); }
});

test('11b · the audit chain detects an edited entry', () => {
  const w = world();
  const log = new AuditLog(w.cfg);
  log.record({ action: 'session.login', outcome: 'allowed', actor: { operator_id: 'op-1', subject: 'a@b', roles: ['viewer'] } });
  log.record({ action: 'proposal.approved', outcome: 'allowed', actor: { operator_id: 'op-1', subject: 'a@b', roles: ['approver'] }, proposal_id: 'p', previous_state: 'pending', resulting_state: 'granted', attestation: { examined: ['evidence'] } });
  assert.equal(log.verifyChain().ok, true);

  const file = log.file();
  const lines = readFileSync(file, 'utf8').trim().split('\n');
  const edited = JSON.parse(lines[1]);
  edited.actor_subject = 'somebody@else';
  lines[1] = JSON.stringify(edited);
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');

  const v = log.verifyChain();
  assert.equal(v.ok, false);
  assert.equal(v.tampered.length, 1);
  assert.match(v.tampered[0].why, /edited since it was written/);
  assert.match(v.bound, /rewritten wholesale/, 'the check must state what it does NOT prove');
});

/* ============================================================
   12 · public assets contain no credentials or secrets
   ============================================================ */

test('12 · nothing in the Control Room tree carries a credential shape, and none of it is published', () => {
  const b = controlRoomBoundary();
  assert.equal(b.errors, 0, b.findings.join('\n'));
  assert.deepEqual(b.detail.published_control_room_files, [],
    'a Control Room file in the published surface means the dot-prefix exclusion no longer holds, and the whole boundary has to be rebuilt rather than patched');
  assert.ok(b.detail.control_room_files_scanned >= 10);
  assert.equal(b.detail.gitignore_rule_present, true);
});

test('12b · the secret scan actually fires — eight planted credentials, and it finds them', () => {
  /* THESE ARE SYNTHETIC AND LOAD-BEARING. A suite that proves a
     credential scan works has to contain something for it to find.
     They are inside a string in this file, this file is one of
     boundary.mjs's two named exemptions, and deleting them to make a
     check clean is the weakening docs/AUTONOMY-POLICY.md prohibition
     16 describes. */
  const planted = [
    'AKIAIOSFODNN7EXAMPLE',
    'ghp_0123456789abcdefghijklmnopqrstuvwxyzAB',
    'sk-0123456789abcdefghijklmno',
    /* Deliberately NOT in the exact digits-digits-alnum24 shape a
       real Slack token has: GitHub's push protection recognises that
       shape and refused the push, which is the scanner above this one
       doing its job. The value still matches SECRET_PATTERNS'
       slack-token pattern, which is what this test is for, and the
       assertion below fails if that ever stops being true. */
    'xoxb-NOT-A-REAL-TOKEN-planted-by-this-suite',
    'AIzaSyA00000000000000000000000000000000',
    'https://user:hunter2hunter2@example.invalid/x',
    'api_key = "0123456789abcdef0123"',
    'Authorization: Bearer 0123456789abcdefghij',
  ];
  const found = new Set();
  for (const p of SECRET_PATTERNS) {
    for (const text of planted) { p.re.lastIndex = 0; if (p.re.test(text)) found.add(text); }
  }
  assert.equal(found.size, planted.length, `the scan missed ${planted.length - found.size} of the planted credentials, so a clean run over the real tree proves less than it appears to`);

  /* And none of them is in a file the deployment publishes. */
  const published = publicSurface({ root: REPO_ROOT }).published;
  assert.ok(!published.some((f) => f.startsWith('.control-room/')));
});

test('12c · no credential, token, password or cookie reaches the audit trail or a trace', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'ok', attestation: ATTEST }, approver);
    await s.get('/api/live', approver.cookie);

    const trail = readdirSync(join(w.cfg.state_dir, 'audit')).map((f) => readFileSync(join(w.cfg.state_dir, 'audit', f), 'utf8')).join('\n');
    const traces = existsSync(w.cfg.trace_dir) ? readdirSync(w.cfg.trace_dir).map((f) => readFileSync(join(w.cfg.trace_dir, f), 'utf8')).join('\n') : '';
    for (const text of [trail, traces]) {
      assert.ok(!text.includes(PASSWORD), 'a password reached a record');
      assert.ok(!text.includes(approver.cookie.split('=')[1]), 'a session token reached a record');
      assert.ok(!text.includes(approver.csrf), 'a CSRF secret reached a record');
      for (const p of SECRET_PATTERNS) { p.re.lastIndex = 0; assert.ok(!p.re.test(text), `a ${p.id} shape reached a record`); }
    }
    /* The operator registry holds a hash and never a password. */
    const registry = readFileSync(join(w.cfg.state_dir, 'operators.json'), 'utf8');
    assert.ok(!registry.includes(PASSWORD));
    assert.ok(registry.includes('scrypt'));
    /* And nothing any route returns carries the hash. */
    const ops = await (await s.get('/api/operators', (await s.login('admin@example.org')).cookie)).text();
    assert.ok(!ops.includes('scrypt') && !ops.includes('"secret"'), 'an operator route returned credential material');
  } finally { await s.stop(); }
});

/* ============================================================
   13 · private traces cannot be retrieved through public endpoints
   ============================================================ */

test('13 · the trace store, the audit trail and the operator registry are reachable only with the right permission', async () => {
  const w = world();
  /* Something to leak: a real trace in the store. */
  const tracer = new Tracer({ service: 'suite', sink: new (await import('../agent/observability/sink.mjs')).JsonlSink({ dir: w.cfg.trace_dir }) });
  const run = tracer.startRun({ kind: 'agent', agent: 'suite', task: 'produce a trace with something private in it' });
  run.observe({ summary: 'a private operational detail: do-not-publish-marker', subject: 'control-plane-internal', data: { internal: 'do-not-publish-marker' } });
  run.end({ status: 'ok' });

  const s = await running(w);
  try {
    for (const path of ['/api/live', '/api/audit', '/api/operators']) {
      const anon = await s.get(path);
      assert.equal(anon.status, 401, `${path} answered an anonymous request`);
      assert.ok(!(await anon.text()).includes('do-not-publish-marker'));
    }
    const viewer = await s.login('viewer@example.org');
    assert.equal((await s.get('/api/audit', viewer.cookie)).status, 403);
    assert.equal((await s.get('/api/operators', viewer.cookie)).status, 403);

    /* The paired positive: an operator who holds live:read does see
       the trace, so the 401s above are a boundary and not a broken
       reader. */
    const live = await (await s.get('/api/live', viewer.cookie)).json();
    assert.equal(live.state, 'measured');
    assert.ok(JSON.stringify(live).includes('do-not-publish-marker'), 'the private view must actually be serving the private trace');
  } finally { await s.stop(); }
});

/* ============================================================
   14 · Control Room routes cannot be accessed merely by discovering
       an unlinked URL
   ============================================================ */

test('14 · knowing the URL is not access — the shell, the client and every view are behind the gate', async () => {
  const w = world();
  const s = await running(w);
  try {
    /* Every path a person could guess, including the ones that are
       "just static files". */
    for (const path of ['/', '/app.js', '/app.css', '/api/session']) {
      const res = await s.get(path);
      assert.notEqual(res.status, 200, `${path} served content to somebody who merely knew the URL`);
    }
    /* Nor by asking for it a different way. */
    for (const path of ['/api/live?format=json', '/API/LIVE', '/api/live/', '//api/live', '/ui/app.js', '/../.control-room/state/operators.json', '/state/operators.json']) {
      const res = await s.get(path);
      assert.ok(res.status === 401 || res.status === 404 || res.status === 302 || res.status === 400,
        `${path} answered ${res.status}`);
      assert.ok(!(await res.text()).includes('scrypt'), `${path} served the operator registry`);
    }
  } finally { await s.stop(); }
});

/* ============================================================
   15 · authentication state cannot be forged through localStorage or
       client-side state
   ============================================================ */

/** The same token with its final character replaced by a DIFFERENT
 *  one. A mutation that might not mutate is not a forgery. */
function mutateLastChar(token) {
  const last = token.slice(-1);
  return token.slice(0, -1) + (last === 'A' ? 'B' : 'A');
}

test('15 · a session is a server-side record; nothing a client can write becomes one', async () => {
  const w = world();
  const s = await running(w);
  try {
    const real = await s.login('approver@example.org');
    /* The cookie carries randomness and nothing else, so there is
       nothing in it to edit into a claim. Each of these is what a
       client-side forgery looks like. */
    const forgeries = [
      'cr_session=administrator',
      'cr_session=' + Buffer.from(JSON.stringify({ subject: 'admin@example.org', roles: ['administrator'] })).toString('base64url'),
      /* ONE CHARACTER CHANGED — and it has to actually change.
         This was `slice(0, -1) + 'A'`, which is a no-op whenever the
         real token already ends in "A". Session tokens are random, so
         the suite failed intermittently — measured at 3 in 40 logins
         — with the message "a forged cookie was accepted", which
         reads exactly like a session-forgery breach and was not one:
         the server was correctly accepting its own valid cookie. The
         replacement character is now chosen to differ from the one it
         replaces, so the assertion is meaningful on every run instead
         of on most of them. */
      `cr_session=${mutateLastChar(real.cookie.split('=')[1])}`,
      'cr_session=' + 'A'.repeat(43),
      'cr_session=; cr_role=administrator',
      'cr_session=x; authenticated=true',
    ];
    for (const cookie of forgeries) {
      const res = await s.get('/api/queue', cookie);
      assert.equal(res.status, 401, `a forged cookie was accepted: ${cookie.slice(0, 40)}`);
    }
    /* Headers claiming an identity are not one either. */
    const spoofed = await fetch(`${s.origin}/api/queue`, { headers: { 'x-actor': 'admin@example.org', 'x-roles': 'administrator', authorization: 'Bearer anything', 'x-forwarded-user': 'admin@example.org' } });
    assert.equal(spoofed.status, 401);
  } finally { await s.stop(); }
});

test('15b · the session cookie is HttpOnly, SameSite and — in production — Secure', async () => {
  const w = world();
  const s = await running(w);
  try {
    const res = await fetch(`${s.origin}/auth/local`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: 'viewer@example.org', password: PASSWORD }) });
    const cookie = res.headers.getSetCookie()[0];
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Path=\//);
    assert.doesNotMatch(cookie, /Secure/, 'a Secure cookie over loopback http would never come back');
  } finally { await s.stop(); }

  /* And the production shape, without starting a production server. */
  const { sessionCookie } = await import('./authn.mjs');
  const prod = sessionCookie('t', { env: 'production', session: { ttl_minutes: 60 } });
  assert.match(prod, /Secure/);
  assert.match(prod, /HttpOnly/);
});

test('15c · a session expires by idle time and by absolute lifetime, server-side', () => {
  const w = world();
  const cfg = { ...w.cfg, session: { ttl_minutes: 60, idle_minutes: 5 } };
  const store = new SessionStore(cfg);
  const { token } = store.create({ operator: w.operators.viewer, authMethod: 'local' });
  assert.ok(resolveSession(cfg, store, token).actor, 'a fresh session resolves');

  const later = (mins) => () => new Date(Date.now() + mins * 60_000).toISOString();
  const idle = store.create({ operator: w.operators.viewer, authMethod: 'local' });
  assert.match(resolveSession(cfg, store, idle.token, { now: later(6) }).reason, /idle/);

  const old = store.create({ operator: w.operators.viewer, authMethod: 'local' });
  assert.match(resolveSession(cfg, store, old.token, { now: later(61) }).reason, /absolute lifetime/);

  /* And an expired session is DESTROYED rather than merely refused,
     so a clock that moves back does not resurrect it. */
  assert.equal(resolveSession(cfg, store, old.token).actor, null);
});

/* ============================================================
   16 · no hard-coded default administrator credentials exist
   ============================================================ */

test('16 · the server refuses to start with an empty registry, and names the provisioning command', () => {
  const state = tempDir('cr-empty-');
  const cfg = { ...readConfig({}), state_dir: state, port: 0 };
  const refusals = registryRefusals(cfg);
  assert.equal(refusals.length, 1);
  assert.match(refusals[0].message, /no operator is provisioned/);
  assert.match(refusals[0].fix, /cli\.mjs provision/);
  assert.match(refusals[0].fix, /no default account/i);

  assert.throws(() => serve({ cfg, quiet: true }), /refuses to start/);
  assert.deepEqual(listOperators(cfg), [], 'refusing to start must not have created anybody');
});

test('16b · no default credential can be created, and none exists in the tree', () => {
  const w = world();
  for (const bad of [...REFUSED_PASSWORDS]) {
    assert.ok(passwordRefusal(bad), `"${bad.slice(0, 3)}…" was accepted as a password`);
  }
  assert.throws(() => provisionOperator(w.cfg, { subject: 'someone@example.org', roles: ['administrator'], password: 'short', createdBy: 'suite' }), ProvisioningRefused);
  assert.ok(passwordRefusal('aaaaaaaaaaaaaaaa'), 'one repeated character is not a password');
  assert.ok(!passwordRefusal(PASSWORD), 'a real passphrase must be accepted, or this check proves nothing');

  /* And nothing in the repository looks like a seeded account. The
     default-credentials pattern is one of the eleven the boundary
     scanner carries; this is the same question asked of the whole
     published tree. */
  const surface = publicSurface({ root: REPO_ROOT });
  const pattern = SECRET_PATTERNS.find((p) => p.id === 'default-credentials');
  const hits = [];
  for (const f of surface.published) {
    if (['agent/implement/boundary.mjs', 'agent/implement/selftest.mjs', 'docs/IMPLEMENTATION-QA.md'].includes(f)) continue;
    let text; try { text = readFileSync(join(REPO_ROOT, f), 'utf8'); } catch { continue; }
    pattern.re.lastIndex = 0;
    if (pattern.re.test(text)) hits.push(f);
  }
  assert.deepEqual(hits, [], `a default credential pair appears in: ${hits.join(', ')}`);
});

test('16c · an operator is created only by the CLI, and the Control Room cannot grant itself a role', () => {
  /* No route writes to the registry. If one ever did, the interface
     that decides who may approve would be able to decide who it
     is. */
  const writers = ROUTES.filter((r) => /operator/.test(r.path) && r.method !== 'GET');
  assert.deepEqual(writers, []);
  const src = readFileSync(join(CONTROL_ROOM_ROOT, 'server.mjs'), 'utf8');
  for (const fn of ['provisionOperator', 'setRoles', 'setDisabled']) {
    assert.ok(!src.includes(fn), `server.mjs calls ${fn}: a privileged interface that can widen its own access has no boundary above it`);
  }
});

/* ============================================================
   Configuration: the refusals that run before the first request
   ============================================================ */

test('CONFIG · the development provider cannot serve production, and cannot leave loopback', () => {
  const prod = readConfig({ CONTROL_ROOM_ENV: 'production', CONTROL_ROOM_AUTH_PROVIDER: 'local', CONTROL_ROOM_PUBLIC_ORIGIN: 'https://cr.example.org' });
  assert.match(configRefusals(prod)[0].message, /development-only/);

  const exposed = readConfig({ CONTROL_ROOM_AUTH_PROVIDER: 'local', CONTROL_ROOM_HOST: '0.0.0.0' });
  const messages = configRefusals(exposed).map((r) => r.message).join(' | ');
  assert.match(messages, /may only bind loopback/);
  /* TWO independent refusals, so changing one variable does not get
     round it. */
  assert.match(messages, /not loopback/);
  assert.ok(configRefusals(exposed).length >= 2);

  assert.throws(() => assertConfig(exposed), /refuses to start/);
});

test('CONFIG · production needs an https origin, and an insecure issuer is refused there', () => {
  const noOrigin = readConfig({ CONTROL_ROOM_ENV: 'production', CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_OIDC_ISSUER: 'https://idp.example.org', CONTROL_ROOM_OIDC_CLIENT_ID: 'c' });
  assert.match(configRefusals(noOrigin)[0].message, /PUBLIC_ORIGIN is not set/);

  const httpOrigin = readConfig({ CONTROL_ROOM_ENV: 'production', CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_PUBLIC_ORIGIN: 'http://cr.example.org', CONTROL_ROOM_OIDC_ISSUER: 'https://idp.example.org', CONTROL_ROOM_OIDC_CLIENT_ID: 'c' });
  assert.match(configRefusals(httpOrigin).map((r) => r.message).join(' '), /not https/);

  const insecure = readConfig({ CONTROL_ROOM_ENV: 'production', CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_PUBLIC_ORIGIN: 'https://cr.example.org', CONTROL_ROOM_OIDC_ISSUER: 'http://idp.example.org', CONTROL_ROOM_OIDC_CLIENT_ID: 'c', CONTROL_ROOM_OIDC_ALLOW_INSECURE: '1' });
  assert.match(configRefusals(insecure).map((r) => r.message).join(' '), /ALLOW_INSECURE is set and the environment is production/);
});

test('CONFIG · nothing that is printed, logged or served carries the client secret', () => {
  const cfg = readConfig({ CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_OIDC_ISSUER: 'https://idp.example.org', CONTROL_ROOM_OIDC_CLIENT_ID: 'c', CONTROL_ROOM_OIDC_CLIENT_SECRET: 'a-real-looking-client-secret-value' });
  const described = JSON.stringify(describeConfig(cfg));
  assert.ok(!described.includes('a-real-looking-client-secret-value'));
  assert.match(described, /\[set, not shown\]/);
});

/* ============================================================
   CSRF, method and body handling
   ============================================================ */

test('CSRF · a state-changing request without the token is refused, and a cross-origin one is too', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);

    const noToken = await fetch(`${s.origin}/api/review`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: approver.cookie }, body: JSON.stringify({ action: 'approve', proposal_id: id, fingerprint }) });
    assert.equal(noToken.status, 403);
    assert.match((await noToken.json()).reason, /x-control-room-csrf/);

    const wrongToken = await fetch(`${s.origin}/api/review`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: approver.cookie, 'x-control-room-csrf': 'not-the-token' }, body: JSON.stringify({ action: 'approve', proposal_id: id, fingerprint }) });
    assert.equal(wrongToken.status, 403);

    const crossOrigin = await fetch(`${s.origin}/api/review`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: approver.cookie, 'x-control-room-csrf': approver.csrf, origin: 'https://evil.example' }, body: JSON.stringify({ action: 'approve', proposal_id: id, fingerprint }) });
    assert.equal(crossOrigin.status, 403);
    assert.match((await crossOrigin.json()).reason, /cross-origin/);

    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0);
  } finally { await s.stop(); }
});

/* v2 Session 4, B.3 (27 Oct 2026). With CONTROL_ROOM_PORT=0 the operating
   system picks the port when the server listens, and the Origin check used
   to compare against an origin built from the CONFIGURED port —
   "http://127.0.0.1:0", which no browser ever sends — so a real browser's
   every POST was refused as cross-origin. Node's fetch sends no Origin
   header, which is why no test here saw it. These two send one: the
   server's own, which must pass, and a foreign one on the same server,
   which must still be refused. The world() fixture binds port 0. */
test('ORIGIN · B.3 · with port 0, a POST carrying the server\'s real Origin passes the Origin and CSRF checks', async () => {
  const w = world();
  assert.equal(w.cfg.port, 0, 'the fixture must bind an ephemeral port, the case this test exists for');
  const s = await running(w);
  try {
    const reviewer = await s.login('reviewer@example.org');
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);
    const res = await fetch(`${s.origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: reviewer.cookie, 'x-control-room-csrf': reviewer.csrf, origin: s.origin },
      body: JSON.stringify({ action: 'request_changes', proposal_id: id, fingerprint, note: 'The second operation needs a source.' }),
    });
    const body = await res.json();
    assert.equal(res.status, 200, `the server's own origin ${s.origin} was refused: ${JSON.stringify(body)}`);
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0, 'a request for changes records no grant');
  } finally { await s.stop(); }
});

test('ORIGIN · B.3 · with port 0, a POST carrying a foreign Origin is still refused, and so is the old ":0" origin', async () => {
  const w = world();
  const s = await running(w);
  try {
    const reviewer = await s.login('reviewer@example.org');
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);
    const port = new URL(s.origin).port;
    for (const origin of ['https://evil.example', 'http://127.0.0.1:0', `http://localhost:${port}`, `http://127.0.0.1:${Number(port) + 1}`]) {
      const res = await fetch(`${s.origin}/api/review`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: reviewer.cookie, 'x-control-room-csrf': reviewer.csrf, origin },
        body: JSON.stringify({ action: 'request_changes', proposal_id: id, fingerprint, note: 'n' }),
      });
      assert.equal(res.status, 403, `${origin} was accepted`);
      assert.match((await res.json()).reason, /cross-origin/);
    }
    /* and the CSRF token is still required with the right Origin */
    const noToken = await fetch(`${s.origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: reviewer.cookie, origin: s.origin },
      body: JSON.stringify({ action: 'request_changes', proposal_id: id, fingerprint, note: 'n' }),
    });
    assert.equal(noToken.status, 403);
    assert.match((await noToken.json()).reason, /x-control-room-csrf/);
  } finally { await s.stop(); }
});

/* v2 Session 5, B.2. B.3 above read the listening port for the Origin
   check; the OIDC redirect URI was still built from cfg.port, and neither
   bracketed an IPv6 host ("http://::1:7802", which no browser sends and
   new URL() refuses). serverOrigin() in config.mjs is now the one home of
   the origin, and these pin it from both sides. */
test('ORIGIN · B.2 · one home: the server origin brackets an IPv6 host, and the configured public origin wins', () => {
  assert.equal(serverOrigin({ host: '::1', port: 7802, public_origin: null }), 'http://[::1]:7802');
  assert.equal(serverOrigin({ host: '127.0.0.1', port: 7802, public_origin: null }), 'http://127.0.0.1:7802');
  assert.equal(serverOrigin({ host: '::1', port: 0, public_origin: null }, 41234), 'http://[::1]:41234', 'the port actually listening, when the caller knows it');
  assert.equal(serverOrigin({ host: '::1', port: 7802, public_origin: 'https://cr.example/' }), 'https://cr.example');
  assert.equal(new URL(serverOrigin({ host: '::1', port: 7802, public_origin: null })).hostname, '[::1]', 'a URL a browser can send');
  const p = new OidcProvider({ host: '::1', port: 7802, public_origin: null, state_dir: tempDir('cr-oidc-') });
  assert.equal(p.redirectUri(), 'http://[::1]:7802/auth/callback');
});

test('OIDC · B.2 · with port 0, the redirect URI sent to the identity provider carries the port actually listening', async () => {
  const idp = await stubIdp();
  const w = world({ env: { CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_OIDC_ISSUER: idp.issuer, CONTROL_ROOM_OIDC_CLIENT_ID: 'cid', CONTROL_ROOM_OIDC_ALLOW_INSECURE: '1' } });
  assert.equal(w.cfg.port, 0, 'the fixture must bind an ephemeral port, the case this test exists for');
  const s = await running(w);
  try {
    const res = await s.get('/auth/login');
    assert.equal(res.status, 302);
    const sent = new URL(res.headers.get('location')).searchParams.get('redirect_uri');
    assert.equal(sent, `${s.origin}/auth/callback`, 'the identity provider is sent back to the server that is listening');
    assert.notEqual(new URL(sent).port, '0');
    /* state and nonce still travel with it */
    const loc = new URL(res.headers.get('location'));
    assert.ok(loc.searchParams.get('state') && loc.searchParams.get('nonce'));
  } finally { await s.stop(); await idp.stop(); }
});

test('ORIGIN · B.2 · bound to ::1, the bracketed origin passes the Origin check and the unbracketed one is refused', async (t) => {
  const w = world({ env: { CONTROL_ROOM_HOST: '::1' } });
  const server = serve({ cfg: w.cfg, quiet: true });
  const up = await new Promise((ok) => { server.once('listening', () => ok(true)); server.once('error', (e) => ok(e)); });
  if (up !== true) {
    /* this container has no IPv6 loopback (EAFNOSUPPORT, measured
       27 Oct 2026); CI does. The pure test above runs everywhere. */
    t.skip(`::1 cannot be bound here: ${up.code ?? up.message}`);
    return;
  }
  const port = server.address().port;
  const origin = `http://[::1]:${port}`;
  try {
    const login = await fetch(`${origin}/auth/local`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: 'reviewer@example.org', password: PASSWORD }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.getSetCookie()[0].split(';')[0];
    const { csrf } = await (await fetch(`${origin}/api/session`, { headers: { cookie } })).json();
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);
    const post = (o) => fetch(`${origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, 'x-control-room-csrf': csrf, origin: o },
      body: JSON.stringify({ action: 'request_changes', proposal_id: id, fingerprint, note: 'n' }),
    });
    assert.equal((await post(origin)).status, 200, `the server's own origin ${origin} was refused`);
    for (const o of [`http://::1:${port}`, `http://127.0.0.1:${port}`, 'https://evil.example']) {
      const res = await post(o);
      assert.equal(res.status, 403, `${o} was accepted`);
    }
  } finally { await new Promise((ok) => server.close(ok)); }
});

test('METHOD · every route inspects the method, and an oversized body is refused', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    for (const method of ['DELETE', 'PUT', 'PATCH']) {
      const res = await fetch(`${s.origin}/api/live`, { method, headers: { cookie: approver.cookie } });
      assert.equal(res.status, 405, `${method} /api/live answered ${res.status}`);
    }
    const big = await fetch(`${s.origin}/api/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: approver.cookie, 'x-control-room-csrf': approver.csrf },
      body: JSON.stringify({ action: 'approve', proposal_id: 'x', fingerprint: 'y', note: 'z'.repeat(MAX_BODY_BYTES + 100) }),
    });
    assert.ok(big.status === 413 || big.status === 400, `an oversized body answered ${big.status}`);
  } finally { await s.stop(); }
});

test('BODY · strict field checking names what it refused, and accepts what it should', () => {
  assert.deepEqual(parseStrictJson('{"action":"approve"}', ['action', 'note']), { action: 'approve' });
  assert.throws(() => parseStrictJson('{"action":"approve","roles":["administrator"]}', ['action']), /roles/);
  assert.throws(() => parseStrictJson('[]', ['action']), /must be a JSON object/);
  assert.throws(() => parseStrictJson('not json', ['action']), /not JSON/);
});

/* ============================================================
   The OIDC provider, against a local identity provider with a real
   key pair
   ============================================================ */

async function stubIdp() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
  let issuer = null;
  let tokenBody = null;
  const server = createServer((req, res) => {
    const u = new URL(req.url, issuer);
    const json = (body) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (u.pathname === '/.well-known/openid-configuration') return json({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks` });
    if (u.pathname === '/jwks') return json({ keys: [jwk] });
    if (u.pathname === '/token') return json(tokenBody);
    res.writeHead(404); res.end();
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  issuer = `http://127.0.0.1:${server.address().port}`;
  const b64 = (b) => Buffer.from(b).toString('base64url');
  return {
    issuer, server,
    setToken: (t) => { tokenBody = t; },
    jwt: (claims, key = privateKey, header = { alg: 'RS256', kid: 'k1', typ: 'JWT' }) => {
      const h = b64(JSON.stringify(header));
      const p = b64(JSON.stringify(claims));
      return `${h}.${p}.${b64(cryptoSign('sha256', Buffer.from(`${h}.${p}`), key))}`;
    },
    stop: () => new Promise((ok) => server.close(ok)),
  };
}

test('OIDC · a real login works: state, PKCE, signature, issuer, audience, expiry and nonce', async () => {
  const idp = await stubIdp();
  try {
    const state = tempDir('cr-oidc-');
    const cfg = { ...readConfig({ CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_OIDC_ISSUER: idp.issuer, CONTROL_ROOM_OIDC_CLIENT_ID: 'cid', CONTROL_ROOM_OIDC_ALLOW_INSECURE: '1' }), state_dir: state, port: 0 };
    provisionOperator(cfg, { provider: 'oidc', subject: 'idp-subject-1', roles: ['approver'], createdBy: 'suite' });

    const p = new OidcProvider(cfg);
    const begin = await p.begin({ returnTo: '/queue' });
    const started = new URL(begin.url);
    assert.equal(started.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(started.searchParams.get('code_challenge'));
    assert.ok(started.searchParams.get('state'));
    assert.ok(started.searchParams.get('nonce'));

    const now = Math.floor(Date.now() / 1000);
    const claims = { iss: idp.issuer, aud: 'cid', sub: 'idp-subject-1', email: 'x@example.org', nonce: started.searchParams.get('nonce'), exp: now + 300, iat: now };
    idp.setToken({ id_token: idp.jwt(claims) });

    const out = await p.complete({ handle: begin.handle, code: 'authcode', state: started.searchParams.get('state') });
    assert.equal(out.operator.subject, 'idp-subject-1');
    assert.deepEqual(out.operator.roles, ['approver']);
    assert.equal(out.returnTo, '/queue');

    /* The handle is single-use. A replayed callback is refused. */
    await assert.rejects(() => p.complete({ handle: begin.handle, code: 'authcode', state: started.searchParams.get('state') }), /no login in progress/);
  } finally { await idp.stop(); }
});

test('OIDC · a forged signature, alg none, a wrong issuer, a wrong audience, an expired token and a wrong nonce are all refused', async () => {
  const idp = await stubIdp();
  try {
    const state = tempDir('cr-oidc-');
    const cfg = { ...readConfig({ CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_OIDC_ISSUER: idp.issuer, CONTROL_ROOM_OIDC_CLIENT_ID: 'cid', CONTROL_ROOM_OIDC_ALLOW_INSECURE: '1' }), state_dir: state, port: 0 };
    provisionOperator(cfg, { provider: 'oidc', subject: 'idp-subject-1', roles: ['approver'], createdBy: 'suite' });
    const p = new OidcProvider(cfg);
    const now = Math.floor(Date.now() / 1000);
    const good = { iss: idp.issuer, aud: 'cid', sub: 'idp-subject-1', nonce: 'N', exp: now + 300, iat: now };

    const otherKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const cases = [
      ['a signature from a key the identity provider does not hold', idp.jwt(good, otherKey), /signature does not verify/],
      ['alg: none', `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify(good)).toString('base64url')}.`, /declares alg "none".*does not accept/s],
      ['HS256, signed with a shared secret', `${Buffer.from(JSON.stringify({ alg: 'HS256', kid: 'k1' })).toString('base64url')}.${Buffer.from(JSON.stringify(good)).toString('base64url')}.x`, /declares alg "HS256"/],
      ['another issuer', idp.jwt({ ...good, iss: 'https://someone.else' }), /issuer is "https:\/\/someone.else"/],
      ['another audience', idp.jwt({ ...good, aud: 'a-different-client' }), /audience does not include this client/],
      ['an expired token', idp.jwt({ ...good, exp: now - 3600 }), /has expired/],
      ['no subject', idp.jwt({ ...good, sub: undefined }), /carries no subject/],
    ];
    for (const [what, token, expected] of cases) {
      await assert.rejects(() => p.verifyIdToken(token, { nonce: 'N' }), expected, `${what} was accepted`);
    }
    await assert.rejects(() => p.verifyIdToken(idp.jwt(good), { nonce: 'a-different-nonce' }), /nonce does not match/);
    /* The paired positive, again: without it every rejection above
       could be a broken verifier. */
    const ok = await p.verifyIdToken(idp.jwt(good), { nonce: 'N' });
    assert.equal(ok.sub, 'idp-subject-1');
    assert.ok(!ACCEPTED_JWT_ALGS.has('none') && !ACCEPTED_JWT_ALGS.has('HS256'));
  } finally { await idp.stop(); }
});

test('OIDC · an identity the registry does not know is a 403, never an account', async () => {
  const idp = await stubIdp();
  try {
    const state = tempDir('cr-oidc-');
    const cfg = { ...readConfig({ CONTROL_ROOM_AUTH_PROVIDER: 'oidc', CONTROL_ROOM_OIDC_ISSUER: idp.issuer, CONTROL_ROOM_OIDC_CLIENT_ID: 'cid', CONTROL_ROOM_OIDC_ALLOW_INSECURE: '1' }), state_dir: state, port: 0 };
    provisionOperator(cfg, { provider: 'oidc', subject: 'known', roles: ['viewer'], createdBy: 'suite' });
    const p = new OidcProvider(cfg);
    const begin = await p.begin({});
    const started = new URL(begin.url);
    const now = Math.floor(Date.now() / 1000);
    idp.setToken({ id_token: idp.jwt({ iss: idp.issuer, aud: 'cid', sub: 'somebody-else-in-the-directory', nonce: started.searchParams.get('nonce'), exp: now + 300, iat: now }) });

    await assert.rejects(() => p.complete({ handle: begin.handle, code: 'c', state: started.searchParams.get('state') }), /no operator is provisioned for that subject/);
    assert.equal(listOperators(cfg).length, 1, 'authentication must never auto-provision: an identity provider says who somebody is, and this repository says what they may do');
  } finally { await idp.stop(); }
});

test('OIDC · the return path may only be a path on this server', () => {
  for (const evil of ['https://evil.example/', '//evil.example/', 'javascript:alert(1)', '/x\r\nSet-Cookie: a=b', null, undefined, '']) {
    assert.equal(sanitiseReturnTo(evil), '/', `an open redirect was permitted: ${String(evil).slice(0, 30)}`);
  }
  assert.equal(sanitiseReturnTo('/queue?id=1'), '/queue?id=1');
});

/* ============================================================
   The views, and what they refuse to report
   ============================================================ */

test('VIEWS · health reports "no run recorded" rather than zeros, and never an overall score', async () => {
  const w = world();
  const s = await running(w);
  try {
    const admin = await s.login('admin@example.org');
    const health = await (await s.get('/api/health', admin.cookie)).json();
    assert.match(health.no_overall_score, /no overall health score/);
    /* SESSION 20's refusal, still standing one layer up. */
    const { overallScore } = await import('../agent/health/model.mjs');
    assert.throws(() => overallScore(), /score|sum|mean/i);

    if (health.state === 'no_run_recorded') {
      assert.match(health.why, /no health run has been recorded/);
      assert.match(health.needs, /agent\/health\/cli\.mjs/);
      assert.deepEqual(health.readings, []);
      assert.ok(!('counts' in health), 'a view with no run must not report counts that would read as zeros');
    } else {
      assert.ok(health.counts.unmeasurable >= 0);
      assert.ok(health.readings.every((r) => r.visibility === 'public' || r.visibility === 'private'));
    }
    assert.ok(health.register.length >= 40, 'the metric register travels with the view, so a number is quotable in context');
    for (const m of health.register) assert.ok(m.limitations && m.limitations.length > 30, `${m.id} does not say what it cannot see`);
  } finally { await s.stop(); }
});

test('VIEWS · the live view distinguishes "no trace store" from "nothing happened"', () => {
  const w = world();
  const empty = { ...w.cfg, trace_dir: join(tempDir('cr-none-'), 'never-created') };
  const view = liveSystemOf(empty);
  assert.equal(view.state, 'no_trace_store');
  assert.notEqual(view.counts, 0);
  assert.match(view.why, /not the same as a system with nothing happening/);
});
const liveSystemOf = (cfg) => { const { liveSystem } = liveModule; return liveSystem(cfg); };
const liveModule = await import('./views.mjs');

test('VIEWS · the queue carries the whole chain, not a summary line', async () => {
  const w = world();
  const s = await running(w);
  try {
    const reviewer = await s.login('reviewer@example.org');
    const queue = await (await s.get('/api/queue', reviewer.cookie)).json();
    const item = queue.items.find((i) => i.proposal_id === w.proposals[0].proposal_id);
    assert.ok(item, 'the fixture proposal must be in the queue');
    for (const key of ['source_to_evidence', 'epistemic', 'affected_entities', 'agent_run', 'operations', 'required_tests', 'rollback', 'permitted_files']) {
      assert.ok(key in item.trace, `the queue does not carry ${key}: approving a summary line is not review`);
    }
    assert.ok(item.fingerprint, 'the item must name the version being shown');
    assert.equal(item.permission_required, 'proposal:approve');
    assert.match(item.approval_effect, /publishes nothing/i);
  } finally { await s.stop(); }
});

test('VIEWS · a gate-blocked proposal is counted apart from one waiting on a reviewer', async () => {
  /* A proposal whose rollback plan is missing cannot be implemented
     however enthusiastically it is approved, and approving it would
     spend the scarcest thing here — somebody having read the
     evidence. */
  const blocked = decidableProposal('prop-cr-blocked', { rollback_plan: { method: 'not_reversible', steps: [], verification: null, irreversible_reason: 'the fixture says so' } });
  const w = world({ proposals: [decidableProposal('prop-cr-clean'), blocked] });
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const queue = await (await s.get('/api/queue', approver.cookie)).json();
    assert.equal(queue.counts.pending, 2);
    assert.equal(queue.counts.decidable, 1, 'a proposal the gates refuse is not waiting on a reviewer');

    const res = await s.post('/api/review', { action: 'approve', proposal_id: 'prop-cr-blocked', fingerprint: proposalFingerprint(blocked) }, approver);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /gates_refuse/);
    assert.ok(body.detail.gates.some((g) => g.gate === 'rollback_available'));
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0);
  } finally { await s.stop(); }
});

/* ============================================================
   Attestation: evidence available is not evidence reviewed
   (roadmap v2 item 0.2; docs/AUDIT-2026-10-24.md finding C; D-9)
   ============================================================ */

test('ATTEST · 0.2 · approving or rejecting without an attestation is refused, naming the field, and decides nothing', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    const fingerprint = proposalFingerprint(w.proposals[0]);
    for (const action of ['approve', 'reject']) {
      const res = await s.post('/api/review', { action, proposal_id: id, fingerprint, note: 'n' }, approver);
      const body = await res.json();
      assert.equal(res.status, 400, `${action} without an attestation answered ${res.status}`);
      assert.equal(body.error, 'no_attestation');
      assert.match(body.reason, /attestation/);
      assert.equal(body.detail.field, 'attestation');
    }
    for (const bad of [[], 'yes', { examined: [] }, { examined: ['evidence', 'banana'] }, { examined: ['evidence', 'evidence'] }, { examined: ['evidence'], panels_opened: 3 }, { examined: 'evidence' }]) {
      const res = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint, attestation: bad }, approver);
      const body = await res.json();
      assert.equal(res.status, 400, `attestation ${JSON.stringify(bad)} answered ${res.status}`);
      assert.equal(body.error, 'bad_attestation', JSON.stringify(body));
      assert.match(body.reason, /attestation/);
    }
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0, 'a refused decision wrote a ledger line');
    const refusals = new AuditLog(w.cfg).read().entries.filter((e) => e.action === 'proposal.decision_refused' && /attestation/.test(e.detail?.code ?? ''));
    assert.equal(refusals.length, 9, 'every refusal is audited with its reason');

    /* A request for changes is not a decision and carries none. */
    const withOne = await s.post('/api/review', { action: 'request_changes', proposal_id: id, fingerprint, note: 'Needs a source.', attestation: ATTEST }, approver);
    assert.equal(withOne.status, 400);
    assert.equal((await withOne.json()).error, 'attestation_not_applicable');
    const without = await s.post('/api/review', { action: 'request_changes', proposal_id: id, fingerprint, note: 'Needs a source.' }, approver);
    assert.equal(without.status, 200);

    /* The paired positive: one section is a declaration, and it decides. */
    const ok = await s.post('/api/review', { action: 'reject', proposal_id: id, fingerprint, note: 'n', attestation: { examined: ['evidence'] } }, approver);
    assert.equal(ok.status, 200, JSON.stringify(await ok.json()));
  } finally { await s.stop(); }
});

test('ATTEST · 0.2 · an unknown field is still refused: attestation was added to the accepted list, the check was not loosened', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const id = w.proposals[0].proposal_id;
    for (const extra of [{ panels_opened: ['evidence'] }, { read: true }, { attested: true }]) {
      const res = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint: proposalFingerprint(w.proposals[0]), attestation: ATTEST, ...extra }, approver);
      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.error, 'unknown_fields');
      assert.match(body.reason, new RegExp(Object.keys(extra)[0]));
    }
    assert.equal(readLedger({ dir: w.cfg.decision_dir }).decisions.length, 0);
    const src = readFileSync(join(CONTROL_ROOM_ROOT, 'server.mjs'), 'utf8');
    assert.match(src, /parseStrictJson\(await readBody\(req\), \['action', 'proposal_id', 'fingerprint', 'note', 'attestation'\]\)/,
      'the review body accepts exactly these five fields');
  } finally { await s.stop(); }
});

test('ATTEST · 0.2 · the attestation is in the decision\'s own trail entry, under the same hash as its fingerprint, actor and time — and not in the ledger', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    const fingerprint = proposalFingerprint(w.proposals[0]);
    const res = await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint, note: 'n', attestation: { examined: ['rollback', 'evidence'] } }, approver);
    assert.equal(res.status, 200);

    const log = new AuditLog(w.cfg);
    const entry = log.read().entries.find((e) => e.action === 'proposal.approved');
    assert.deepEqual(entry.attestation.examined, ['evidence', 'rollback'], 'recorded in the fixed list\'s order');
    assert.match(entry.attestation.statement, /declaration/);
    assert.match(entry.attestation.statement, /not proof/);
    assert.equal(entry.proposal_sha256, fingerprint, 'bound to the fingerprint the decision was bound to');
    assert.equal(entry.actor_id, w.operators.approver.operator_id);
    assert.ok(Date.parse(entry.ts));
    assert.equal(log.verifyChain().ok, true, 'the chain verifies with the attestation in it');

    /* D-9: not in the decision ledger, which is the one home for grants. */
    const ledgerText = readdirSync(w.cfg.decision_dir).map((f) => readFileSync(join(w.cfg.decision_dir, f), 'utf8')).join('');
    assert.doesNotMatch(ledgerText, /attestation|examined/);

    /* Not changeable after the decision: no route edits the trail, and
       an edit made on disk is reported by the chain. */
    assert.ok(!ROUTES.some((r) => r.method !== 'GET' && /audit|attest/.test(r.path)), 'no route writes to the trail or an attestation');
    const file = log.file(entry.ts);
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    const i = lines.findIndex((l) => JSON.parse(l).event_id === entry.event_id);
    const edited = JSON.parse(lines[i]);
    edited.attestation.examined = ['evidence', 'sources', 'operations', 'tests', 'rollback'];
    lines[i] = JSON.stringify(edited);
    writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
    const v = log.verifyChain();
    assert.equal(v.ok, false);
    assert.ok(v.tampered.some((t) => t.event_id === entry.event_id), 'widening the declaration after the fact must break the chain');

    /* And the trail itself refuses a decision entry with none. */
    assert.throws(() => new AuditLog(w.cfg).record({ action: 'proposal.rejected', outcome: 'allowed', actor: { operator_id: 'op-1', subject: 'a@b', roles: ['approver'] }, proposal_id: 'p' }), /no attestation/);
  } finally { await s.stop(); }
});

test('ATTEST · 0.2 · the screen says it is a declaration, not proof of reading, and nothing records which panels were opened', async () => {
  const w = world();
  const s = await running(w);
  try {
    const reviewer = await s.login('reviewer@example.org');
    const queue = await (await s.get('/api/queue', reviewer.cookie)).json();
    assert.deepEqual(queue.attestation.sections.map((x) => x.section), ['evidence', 'sources', 'operations', 'tests', 'rollback']);
    assert.deepEqual(queue.attestation.required_for, ['approve', 'reject']);
    assert.match(queue.attestation.statement, /declaration/);
    assert.match(queue.attestation.statement, /not proof/);
    assert.match(queue.attestation.statement, /does not record which panels were opened/);
    /* The "sources" section has something to examine. */
    const item = queue.items[0];
    assert.ok(Array.isArray(item.trace.sources.cited));
    assert.equal(item.trace.sources.cited.reduce((n, c) => n + c.references, 0) + item.trace.sources.evidence_without_source, item.trace.source_to_evidence.length);
  } finally { await s.stop(); }
  const app = readFileSync(join(UI_DIR, 'app.js'), 'utf8');
  assert.match(app, /a declaration, not proof of reading/);
  assert.match(app, /d\.attestation\.statement/);
  assert.doesNotMatch(app, /'toggle'|ontoggle|panels_opened|panel_opened/, 'the client must not record which panels were opened');
});

/* ============================================================
   The inventory: docs/CONTROL-ROOM.md names every view the interface
   has (roadmap v2 item 1.3; docs/AUDIT-2026-10-24.md finding F)
   ============================================================ */

const DOC = join(REPO_ROOT, 'docs', 'CONTROL-ROOM.md');

/** Every disagreement between the interface and the document's §5
 *  inventory. Empty means aligned. Pure, so it can be fed a planted
 *  tab and shown to fail. */
function inventoryGaps({ html, appJs, doc }) {
  const gaps = [];
  const tabs = [...html.matchAll(/<button data-view="([a-z_]+)" class="tab"[^>]*>([^<]+)<\/button>/g)].map((m) => ({ id: m[1], label: m[2].trim() }));
  const endpoint = Object.fromEntries([...(appJs.match(/const ENDPOINT = \{([^}]*)\}/)?.[1] ?? '').matchAll(/(\w+): '([^']+)'/g)].map((m) => [m[1], m[2]]));
  const start = doc.indexOf('\n## 5 ');
  const section = start < 0 ? '' : doc.slice(start, doc.indexOf('\n## 6 ', start));
  const rows = section.split('\n').filter((l) => /^\| \*\*/.test(l)).map((l) => {
    const cells = l.split(' | ');
    const head = cells[0].match(/\*\*(.+?)\*\* \(`([a-z_]+)`\)/);
    return {
      label: head?.[1] ?? null, id: head?.[2] ?? null,
      routes: [...(cells[1] ?? '').matchAll(/`(GET|POST) (\/[^`?\s]+)[^`]*`(?: · `([a-z_:]+)`)?/g)].map((m) => ({ method: m[1], path: m[2], permission: m[3] ?? null })),
      columns: cells.length,
    };
  });
  if (!rows.length) gaps.push('docs/CONTROL-ROOM.md §5 has no inventory table');
  for (const t of tabs) {
    const row = rows.find((r) => r.id === t.id);
    if (!row) { gaps.push(`ui/app.html has a tab "${t.label}" (data-view="${t.id}") that the inventory does not name`); continue; }
    if (row.label !== t.label) gaps.push(`the inventory calls data-view="${t.id}" "${row.label}", the interface "${t.label}"`);
    if (!endpoint[t.id]) gaps.push(`the tab "${t.label}" reads no endpoint in app.js`);
    else if (!row.routes.some((r) => r.path === endpoint[t.id])) gaps.push(`the tab "${t.label}" reads ${endpoint[t.id]}, which its inventory row does not name`);
  }
  for (const r of rows) {
    if (!tabs.some((t) => t.id === r.id)) gaps.push(`the inventory names "${r.label}" (${r.id}), which ui/app.html has no tab for`);
    if (r.columns < 6) gaps.push(`the inventory row "${r.label}" does not give data, source, operations and limits`);
    for (const route of r.routes) {
      const real = ROUTES.find((x) => x.method === route.method && x.path === route.path);
      if (!real) gaps.push(`the inventory row "${r.label}" names ${route.method} ${route.path}, which server.mjs does not serve`);
      else if (route.permission && route.permission !== real.permission) gaps.push(`the inventory gives ${route.method} ${route.path} the permission ${route.permission}; server.mjs requires ${real.permission}`);
    }
  }
  return gaps;
}

const realInventory = () => ({
  html: readFileSync(join(UI_DIR, 'app.html'), 'utf8'),
  appJs: readFileSync(join(UI_DIR, 'app.js'), 'utf8'),
  doc: readFileSync(DOC, 'utf8'),
});

test('INVENTORY · 1.3 · docs/CONTROL-ROOM.md names every view the interface has, with its route, permission, data, source, operations and limits', () => {
  const inv = realInventory();
  assert.deepEqual(inventoryGaps(inv), []);
  /* And the check is checking something: eight tabs, eight rows. */
  assert.equal([...inv.html.matchAll(/class="tab"/g)].length, 8);
  /* Every GET view route the server has is in some row. */
  for (const r of ROUTES.filter((x) => x.method === 'GET' && x.path.startsWith('/api/') && x.path !== '/api/session')) {
    assert.ok(inv.doc.includes(`\`GET ${r.path}`), `the inventory does not name GET ${r.path}`);
  }
});

test('INVENTORY · 1.3 · the assertion FAILS on a planted tab, a renamed tab and a dropped row', () => {
  const inv = realInventory();
  const planted = { ...inv, html: inv.html.replace('</nav>', '  <button data-view="planted" class="tab">Planted view</button>\n  </nav>') };
  assert.ok(inventoryGaps(planted).some((g) => /tab "Planted view" \(data-view="planted"\) that the inventory does not name/.test(g)));
  const renamed = { ...inv, html: inv.html.replace('>Agent activity<', '>Live system<') };
  assert.ok(inventoryGaps(renamed).some((g) => /calls data-view="live" "Agent activity", the interface "Live system"/.test(g)));
  const dropped = { ...inv, doc: inv.doc.split('\n').filter((l) => !l.startsWith('| **Editorial audit**')).join('\n') };
  assert.ok(inventoryGaps(dropped).some((g) => /data-view="editorial"\) that the inventory does not name/.test(g)));
  const wrongPermission = { ...inv, doc: inv.doc.replace('`GET /api/audit` · `audit:read`', '`GET /api/audit` · `live:read`') };
  assert.ok(inventoryGaps(wrongPermission).some((g) => /GET \/api\/audit the permission live:read; server\.mjs requires audit:read/.test(g)));
});

test('INVENTORY · 1.3 · the roles table in §4 is the matrix authz.mjs enforces', () => {
  const doc = readFileSync(DOC, 'utf8');
  const sec = doc.slice(doc.indexOf('\n## 4 '), doc.indexOf('\n## 5 '));
  const rows = Object.fromEntries(sec.split('\n').filter((l) => /^\| `[a-z]+` \|/.test(l)).map((l) => {
    const [, role, rest] = l.match(/^\| `([a-z]+)` \| (.*) \|$/);
    return [role, { above: /the above/.test(rest), perms: [...rest.matchAll(/`([a-z_:]+)`/g)].map((m) => m[1]) }];
  }));
  let carried = [];
  for (const role of ['viewer', 'reviewer', 'approver', 'administrator']) {
    carried = rows[role].above ? [...carried, ...rows[role].perms] : rows[role].perms;
    assert.deepEqual([...new Set(carried)].sort(), [...ROLE_PERMISSIONS[role]].sort(), `§4 gives ${role} a different set from authz.mjs`);
  }
  assert.deepEqual(rows.operator.perms.sort(), [...ROLE_PERMISSIONS.operator].sort());
});

/* ============================================================
   Metric definitions you can read (roadmap v2 item 1.2;
   docs/AUDIT-2026-10-24.md finding D)
   ============================================================ */

test('METRICS · 1.2 · every reading row carries name and definition beside its ID, and the five details can be opened', async () => {
  const { ALL_METRICS } = await import('../agent/health/metrics.mjs');
  const w = world();
  const dir = tempDir('cr-health-');
  const readings = [...ALL_METRICS.map((m) => ({ id: m.id, domain: m.domain, state: 'measured', value: 1, unit: 'items' })), { id: 'metric.no_longer_defined', state: 'measured', value: 3 }];
  writeFileSync(join(dir, 'health.jsonl'), `${JSON.stringify({ history_version: 1, recorded_at: '2026-10-25T09:00:00.000Z', as_of: '2026-10-24', commit: 'b'.repeat(40), readings })}\n`, 'utf8');
  const h = liveModule.websiteHealth(w.cfg, { root: REPO_ROOT, historyDir: dir });
  assert.deepEqual(h.metric_detail_fields.map((f) => f.field), ['source', 'calculation', 'frequency', 'interpretation', 'limitations']);
  for (const r of h.readings.filter((x) => x.in_register)) {
    assert.ok(r.name && r.name !== r.id, `${r.id} has no name of its own`);
    assert.ok(r.definition && r.definition.length > 20, `${r.id} has no definition`);
    for (const f of h.metric_detail_fields) assert.ok(r[f.field], `${r.id} cannot open its ${f.field}`);
  }
  assert.equal(h.readings.filter((x) => x.in_register).length, ALL_METRICS.length);
  /* A reading whose metric left the register says so; it does not
     borrow its ID as a name. */
  const orphan = h.readings.find((x) => x.id === 'metric.no_longer_defined');
  assert.equal(orphan.in_register, false);
  assert.equal(orphan.name, null);
  /* The empty view carries the definitions too, so they are readable
     before anything has been measured. */
  const empty = liveModule.websiteHealth(w.cfg, { root: REPO_ROOT, historyDir: tempDir('cr-health-none-') });
  assert.equal(empty.state, 'no_run_recorded');
  assert.ok(empty.register.every((m) => m.name && m.definition));
  const app = readFileSync(join(UI_DIR, 'app.js'), 'utf8');
  assert.match(app, /m\.definition/);
  assert.match(app, /metric_detail_fields/);
});

test('METRICS · 1.2 · one display term for the visibility value: "public-safe" on screen, `public` unrenamed in the data', async () => {
  const { ALL_METRICS } = await import('../agent/health/metrics.mjs');
  assert.ok(ALL_METRICS.some((m) => m.visibility === 'public'), 'the data value is still `public`; only the display term changed');
  assert.deepEqual(liveModule.VISIBILITY_LABEL, { public: 'public-safe', private: 'private' });
  const w = world();
  const h = liveModule.websiteHealth(w.cfg, { root: REPO_ROOT, historyDir: tempDir('cr-health-none-') });
  for (const m of h.register) assert.ok(['public-safe', 'private'].includes(m.visibility_label), `${m.id} is shown as "${m.visibility_label}"`);
  /* The interface never prints the raw value: no bare "public" in any
     ui file, only "public-safe". */
  for (const { f, text: raw } of uiFiles().filter((x) => /^app\.(js|html)$/.test(x.f))) {
    /* What reaches the screen: comments ("the public site") are not. */
    const text = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
    const bare = text.match(/\bpublic\b(?!-safe)/g) ?? [];
    assert.deepEqual(bare, [], `${f} shows the visibility value as "public"`);
    assert.doesNotMatch(text, /text: \w+\.visibility\b(?!_label)/, `${f} prints the raw visibility value`);
  }
});

/* ============================================================
   Editorial audit: a recorded run, read — never launched from here
   (roadmap v2 item 1.1; docs/AUDIT-2026-10-24.md finding A)
   ============================================================ */

test('EDITORIAL · 1.1 · on a fresh clone the view says "no recorded run" and gives the command — never zeros', async () => {
  const w = world();
  const s = await running(w);
  try {
    const viewer = await s.login('viewer@example.org');
    const res = await s.get('/api/editorial-audit', viewer.cookie);
    assert.equal(res.status, 200);
    const d = await res.json();
    assert.equal(d.state, 'no_recorded_run');
    assert.match(d.why, /not the same as an audit that found nothing/);
    assert.equal(d.command, RECORD_COMMAND);
    assert.equal(d.command, 'node tools/evidence-audit.mjs --as-of YYYY-MM-DD --record');
    assert.equal(d.latest, null);
    assert.ok(!('counts' in d), 'a view with no run must not report counts that would read as zeros');
    assert.equal(d.checked.length, 7, 'what a run would check is stated even before one exists');
    assert.ok(d.limits.length >= 5);
    assert.match(d.separate_from_health, /Not Website health/);
  } finally { await s.stop(); }
});

test('EDITORIAL · 1.1 · a recorded run renders with every question answered: what, on which evidence, as of when, at which commit, with which limits', async () => {
  const w = world();
  const { audit: runAudit, recordEntry } = await import('../tools/evidence-audit.mjs');
  const entry = recordEntry(runAudit({ root: REPO_ROOT, asOf: '2026-10-24' }), { root: REPO_ROOT, argv: ['--as-of', '2026-10-24', '--record'] });
  writeFileSync(join(w.cfg.editorial_audit_dir, 'evidence-audit.jsonl'), `${JSON.stringify({ ...entry, as_of: '2026-10-23' })}\n${JSON.stringify(entry)}\nnot json\n`, 'utf8');
  const s = await running(w);
  try {
    const viewer = await s.login('viewer@example.org');
    const d = await (await s.get('/api/editorial-audit', viewer.cookie)).json();
    assert.equal(d.state, 'measured');
    assert.equal(d.runs_recorded, 2);
    assert.equal(d.malformed.length, 1, 'an unreadable line is reported, not skipped');
    assert.deepEqual(d.questions.map((q) => q.label), ['What was checked', 'On which evidence', 'As of which date', 'At which commit', 'With which limits']);
    const r = d.latest;
    for (const q of d.questions) assert.ok(r[q.key] !== null && r[q.key] !== undefined, `the record does not answer "${q.label}"`);
    assert.equal(r.as_of, '2026-10-24', 'the LATEST record is shown');
    assert.equal(r.checked.length, 7);
    assert.ok(r.evidence.read.some((f) => f.path === 'index.html' && /^[0-9a-f]{64}$/.test(f.sha256)));
    assert.ok(r.evidence.read.some((f) => f.path === 'data/claims.json'));
    assert.ok(r.evidence.rules.some((f) => f.path === 'js/evidence-model.js'));
    const head = execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    assert.equal(r.commit.sha, head);
    assert.equal(typeof r.commit.tree_clean, 'boolean');
    assert.ok(r.limits.some((l) => /no network I\/O/.test(l)));
    assert.ok(r.limits.some((l) => /applicability\.json/.test(l)));
    assert.equal(d.counts.errors, r.findings.errors.length);
    assert.match(d.bound, /not a run of now/);
  } finally { await s.stop(); }
});

test('EDITORIAL · 1.1 · no route runs the audit, records a run or queues a finding; the view is one GET', () => {
  const routes = ROUTES.filter((r) => /editorial/.test(r.path));
  assert.deepEqual(routes.map((r) => `${r.method} ${r.path} ${r.permission}`), ['GET /api/editorial-audit editorial:read']);
  assert.ok(!PERMISSIONS.some((p) => /^editorial:(?!read$)/.test(p)), 'editorial:read is the only editorial permission');
  for (const r of ROUTES) {
    for (const word of ['run', 'record', 'launch', 'trigger', 'queue-finding']) {
      if (r.path === '/api/queue') continue;
      assert.ok(!r.path.toLowerCase().includes(word), `${r.method} ${r.path} names "${word}"`);
    }
  }
  /* The Control Room imports the READ side only: not the tool, and
     nothing in what it imports can write a record or start a process. */
  const crSource = readdirSync(CONTROL_ROOM_ROOT).filter((n) => n.endsWith('.mjs') && n !== 'selftest.mjs').map((n) => readFileSync(join(CONTROL_ROOM_ROOT, n), 'utf8')).join('\n');
  assert.doesNotMatch(crSource, /tools\/evidence-audit\.mjs'/, 'the Control Room imports the audit tool itself');
  assert.match(crSource, /tools\/evidence-audit-record\.mjs'/);
  const recordModule = readFileSync(join(REPO_ROOT, 'tools', 'evidence-audit-record.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const writer of ['child_process', 'appendFileSync', 'writeFileSync', 'mkdirSync', 'spawn', 'exec']) {
    assert.ok(!recordModule.includes(writer), `the record module the Control Room reads references ${writer}`);
  }
});

/* ============================================================
   Snapshots: what time a view is from, and that it is not live
   (roadmap v2 item 0.1; docs/AUDIT-2026-10-24.md findings B and E)
   ============================================================ */

const UI_DIR = join(CONTROL_ROOM_ROOT, 'ui');
const uiFiles = () => readdirSync(UI_DIR).filter((f) => /\.(html|js|css)$/.test(f)).map((f) => ({ f, text: readFileSync(join(UI_DIR, f), 'utf8') }));

test('SNAPSHOT · 0.1 · every view payload carries the ISO time the server assembled it', async () => {
  const w = world();
  const s = await running(w);
  try {
    const admin = await s.login('admin@example.org');
    /* Every GET under /api/ except the session itself: a route added
       later is covered by default, not by remembering to list it. */
    const viewRoutes = ROUTES.filter((r) => r.method === 'GET' && r.path.startsWith('/api/') && r.path !== '/api/session');
    assert.ok(viewRoutes.length >= 8, 'the suite must be checking every view');
    for (const r of viewRoutes) {
      const path = r.path === '/api/proposal' ? `/api/proposal?id=${w.proposals[0].proposal_id}` : r.path;
      const before = Date.now();
      const res = await s.get(path, admin.cookie);
      assert.equal(res.status, 200, `${path} answered ${res.status}`);
      const body = await res.json();
      assert.match(String(body.assembled_at), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, `${path} carries no ISO assembly time`);
      const t = Date.parse(body.assembled_at);
      assert.ok(t >= before - 1000 && t <= Date.now() + 1000, `${path}'s assembly time is not the time it was assembled`);
    }
  } finally { await s.stop(); }
});

test('SNAPSHOT · 0.1 · Website health shows reference date, run recorded at and commit analysed as three fields', () => {
  const w = world();
  const dir = tempDir('cr-health-');
  const entry = { history_version: 1, recorded_at: '2026-10-25T09:14:03.120Z', as_of: '2026-10-24', commit: 'a'.repeat(40), readings: [] };
  writeFileSync(join(dir, 'health.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  const health = liveModule.websiteHealth(w.cfg, { root: REPO_ROOT, historyDir: dir });
  assert.equal(health.state, 'measured');
  assert.equal(health.as_of, '2026-10-24');
  assert.equal(health.recorded_at, '2026-10-25T09:14:03.120Z');
  assert.equal(health.commit, 'a'.repeat(40));
  assert.equal(new Set([health.as_of, health.recorded_at, health.commit]).size, 3, 'the three fields must be three values, not one shown three times');

  const labels = Object.fromEntries(health.run_fields.map((f) => [f.field, f.label]));
  assert.deepEqual(Object.keys(labels), ['as_of', 'recorded_at', 'commit']);
  assert.equal(labels.as_of, 'Reference date');
  assert.doesNotMatch(labels.as_of, /run|recorded|execut/i, 'the reference date must not be labelled as a run date');
  assert.match(labels.recorded_at, /recorded/i);
  assert.match(labels.commit, /commit/i);
  for (const f of health.run_fields) assert.ok(f.means.length > 40, `${f.field} does not say what it means`);
  assert.match(health.bound, /does not compute a freshness/);

  /* An entry written without recorded_at shows it as absent; it is
     never filled in from the reference date. */
  writeFileSync(join(dir, 'health.jsonl'), `${JSON.stringify({ ...entry, recorded_at: undefined, commit: null })}\n`, 'utf8');
  const thin = liveModule.websiteHealth(w.cfg, { root: REPO_ROOT, historyDir: dir });
  assert.equal(thin.state, 'no_run_recorded', 'an entry without recorded_at is malformed in agent/health/history.mjs and is not a run');

  /* No label in ui/ presents as_of as a run date. The client reads the
     three through the server's labels and never names as_of itself. */
  for (const { f, text } of uiFiles()) {
    assert.doesNotMatch(text, /Last recorded run/i, `${f} still labels a date "Last recorded run"`);
    assert.doesNotMatch(text, /\bd\.as_of\b/, `${f} renders the health run's as_of under a label of its own`);
    /* Wherever a ui file names an as_of at all (the Editorial audit
       record has one too), the same line calls it the reference date. */
    for (const line of text.split('\n').filter((l) => /\bas_of\b/.test(l))) {
      assert.match(line, /reference date/i, `${f} shows an as_of without calling it the reference date: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.match(readFileSync(join(UI_DIR, 'app.js'), 'utf8'), /run_fields/);
});

test('SNAPSHOT · 0.1 · "Live system" is no label, and the one refresh is manual — no timer anywhere in ui/', () => {
  for (const { f, text } of uiFiles()) {
    assert.doesNotMatch(text, /live system/i, `${f} still says "Live system"`);
    assert.doesNotMatch(text, /setInterval|setTimeout|requestAnimationFrame|EventSource|WebSocket/, `${f} refreshes something on its own`);
  }
  const app = readFileSync(join(UI_DIR, 'app.js'), 'utf8');
  assert.match(app, /Snapshot taken at/);
  assert.match(app, /assembled_at/);
  assert.match(app, /Refresh this view/);
  assert.match(app, /Not live/);
  /* On a failed refresh the earlier snapshot is kept, with the error. */
  assert.match(app, /data: held\?\.data \?\? null, error: e\.message/);
  assert.match(app, /The last refresh failed/);
  /* The tab still reads the same route; the label changed, not the ID. */
  assert.match(readFileSync(join(UI_DIR, 'app.html'), 'utf8'), /data-view="live" class="tab"[^>]*>Agent activity</);
});

/* ============================================================
   Observability: every substantive action is traceable
   ============================================================ */

test('OBSERVABILITY · a decision reaches the shared trace store, and the originating agent run', async () => {
  const w = world();
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({ service: 'control-room', sink });
  const audit = new AuditLog(w.cfg);
  const proposal = w.proposals[0];

  const out = decide(w.cfg, {
    actor: { ...w.operators.approver, session_id: 'sess-test' },
    action: 'approve',
    proposalId: proposal.proposal_id,
    fingerprint: proposalFingerprint(proposal),
    note: 'checked against the passage',
    attestation: ATTEST,
    audit, tracer,
  });
  assert.equal(out.outcome, 'granted');

  const approvals = sink.records.filter((r) => r.type === 'approval');
  const decisions = sink.records.filter((r) => r.type === 'decision');
  assert.equal(approvals.length, 1);
  assert.equal(approvals[0].state, 'granted');
  assert.equal(approvals[0].actor, w.operators.approver.operator_id, 'the trace names the authenticated operator, not a display name');
  assert.equal(decisions.length, 1);
  assert.ok(decisions[0].alternatives.length >= 2, 'a decision records what was not chosen');

  /* The edge back to the run that produced the proposal — without
     it, "what happened to the thing agent 5 proposed" is answerable
     only by knowing where else to look. */
  const upstream = sink.records.filter((r) => r.trace_id === proposal.trace_ref.trace_id);
  assert.ok(upstream.length >= 1, 'the originating run carries no record that a human decided its proposal');
  assert.match(upstream[0].summary, /a human decided/);

  /* And no span was opened on the upstream trace: it belongs to the
     agent that wrote it. */
  assert.equal(upstream.filter((r) => r.type === 'span.start').length, 0);
});

test('OBSERVABILITY · a refused decision is audited with its reason, and an authz denial separately', async () => {
  const w = world();
  const s = await running(w);
  try {
    const reviewer = await s.login('reviewer@example.org');
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: 'wrong' }, reviewer);
    const approver = await s.login('approver@example.org');
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: 'wrong' }, approver);

    const trail = new AuditLog(w.cfg).read().entries;
    const denied = trail.filter((e) => e.action === 'authz.denied');
    const refused = trail.filter((e) => e.action === 'proposal.decision_refused');
    assert.ok(denied.length >= 1, 'the reviewer being refused the permission must be on the record');
    assert.ok(refused.length >= 1, 'the approver being refused on the fingerprint must be on the record, and separately');
    assert.match(refused[refused.length - 1].reason, /changed since it was displayed/);
    assert.equal(new AuditLog(w.cfg).verifyChain().ok, true);
  } finally { await s.stop(); }
});

test('OBSERVABILITY · every audited action is one this system declares', () => {
  const src = readFileSync(join(CONTROL_ROOM_ROOT, 'server.mjs'), 'utf8') + readFileSync(join(CONTROL_ROOM_ROOT, 'decide.mjs'), 'utf8') + readFileSync(join(CONTROL_ROOM_ROOT, 'cli.mjs'), 'utf8');
  const used = [...src.matchAll(/action:\s*'([a-z_]+\.[a-z_]+)'/g)].map((m) => m[1]);
  assert.ok(used.length >= 8);
  for (const a of new Set(used)) assert.ok(AUDIT_ACTIONS.includes(a), `"${a}" is audited but not declared in AUDIT_ACTIONS`);
});

/* ============================================================
   The role matrix itself
   ============================================================ */

test('ROLES · every role grants only declared permissions, and no role is a superset by accident', () => {
  for (const role of ROLES) {
    assert.ok(Array.isArray(ROLE_PERMISSIONS[role]), `${role} has no permission list`);
    for (const p of ROLE_PERMISSIONS[role]) assert.ok(PERMISSIONS.includes(p), `${role} grants "${p}", which is not a declared permission`);
  }
  /* The separations that matter, asserted rather than assumed. */
  assert.ok(!ROLE_PERMISSIONS.reviewer.includes('proposal:approve'), 'a reviewer may not approve');
  assert.ok(!ROLE_PERMISSIONS.approver.includes('proposal:approve:human_only'), 'an approver may not approve red-tier work');
  assert.ok(!ROLE_PERMISSIONS.approver.includes('operators:write'), 'an approver may not change who has access');
  assert.ok(!ROLE_PERMISSIONS.operator.includes('proposal:approve'), 'the person who keeps the agents running is not thereby a person who may decide what the site says about EU law');
  assert.ok(!ROLE_PERMISSIONS.viewer.includes('audit:read'));
  assert.equal(permissionsOf(['not-a-role']).length, 0, 'an unknown role must grant nothing, not everything');
});

test('COOKIES · parsing is not fooled by a crafted header', () => {
  assert.deepEqual(parseCookies('a=1; b=2'), { a: '1', b: '2' });
  assert.deepEqual(parseCookies(''), {});
  assert.deepEqual(parseCookies(undefined), {});
  assert.equal(parseCookies('cr_session=x; cr_session=y').cr_session, 'y');
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'ab'), false);
  assert.equal(safeEqual(null, undefined), true, 'two absent values are equal, and both fail the checks that use this');
});

test('PASSWORDS · scrypt hashing is salted per operator and verified in constant time', () => {
  const a = hashPassword(PASSWORD);
  const b = hashPassword(PASSWORD);
  assert.notEqual(a.salt, b.salt, 'two operators with the same password must not share a hash');
  assert.notEqual(a.hash, b.hash);
  assert.equal(verifyPassword(PASSWORD, a), true);
  assert.equal(verifyPassword(`${PASSWORD} `, a), false);
  assert.equal(verifyPassword(PASSWORD, null), false);
  assert.equal(verifyPassword(PASSWORD, { algo: 'md5', hash: 'x', salt: 'y' }), false, 'an unrecognised algorithm is a refusal, not a fallback');
});

test('FIXTURE · the proposal this suite decides really does satisfy its contract', () => {
  const p = decidableProposal();
  assert.deepEqual(validate(p, { allowSimulated: false }), [],
    'if this fixture stopped satisfying its contract, every approval test above would be passing for the wrong reason');
  const a = approvalRequestFor(p.proposal_id);
  assert.deepEqual(validate(a, { allowSimulated: false }), []);
  assert.equal(p.simulated, false, 'a simulated record is refused by the gate, so the fixture must be a real one');
});

test('THE REPOSITORY · the Control Room is not on the website, and its source is still seen in the public repository', () => {
  /* The second half is not decoration. Until 24 Oct 2026 it asserted
     that agent/ was published, because the site was the whole tree.
     Since then the website is the allowlisted artifact and agent/ is
     refused like .control-room/; what keeps the first half from
     proving nothing now is that the surface still SEES both, in the
     repository, which is public on github.com (v2 Session 4, B.2). */
  const surface = publicSurface({ root: REPO_ROOT });
  assert.ok(!surface.published.some((f) => f.startsWith('.control-room/')));
  assert.ok(surface.excluded.some((f) => f.startsWith('.control-room/')), 'the Control Room must be in the EXCLUDED set, not merely absent');
  assert.ok(surface.repository.some((f) => f.startsWith('.control-room/')) && surface.repository.some((f) => f.startsWith('agent/')),
    'the repository surface must still hold the Control Room source and agent/, or the exclusion above proves nothing');
  assert.ok(!surface.published.some((f) => f.startsWith('agent/')), 'agent/ is refused by the website allowlist');
  assert.equal(relative(REPO_ROOT, CONTROL_ROOM_ROOT), '.control-room');
  assert.equal(isLoopback('127.0.0.1'), true);
  assert.equal(isLoopback('0.0.0.0'), false);
});
