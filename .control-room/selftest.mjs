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

import { readConfig, configRefusals, describeConfig, assertConfig, isLoopback, CONTROL_ROOM_ROOT, REPO_ROOT } from './config.mjs';
import { provisionOperator, setRoles, setDisabled, registryRefusals, listOperators, verifyPassword, hashPassword, passwordRefusal, REFUSED_PASSWORDS, ProvisioningRefused } from './identity.mjs';
import { authorize, permissionsOf, approvalPermissionFor, ROLES, ROLE_PERMISSIONS, PERMISSIONS, visibleActions } from './authz.mjs';
import { AuditLog, AUDIT_ACTIONS, REQUIRED_FIELDS } from './audit.mjs';
import { SessionStore, resolveSession, OidcProvider, sanitiseReturnTo, parseCookies, safeEqual, ACCEPTED_JWT_ALGS } from './authn.mjs';
import { serve, ROUTES, PUBLIC_ROUTES, PROHIBITED_ROUTE_WORDS, routeFor, parseStrictJson, MAX_BODY_BYTES } from './server.mjs';
import { decide, reviewQueue, DECIDABLE_STATES, PUBLICATION_NOTE } from './decide.mjs';
import { controlRoomBoundary } from './boundary.mjs';
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
  const cfg = { ...readConfig(env), state_dir: state, records_dir: records, decision_dir: decisions, trace_dir: traces, port: 0 };

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
    const ok = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint, note: 'Read the passage.' }, approver);
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
    const allowed = await s.post('/api/review', { action: 'approve', proposal_id: humanOnly.proposal_id, fingerprint, note: 'Author authorised this by name.' }, admin);
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
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'checked' }, approver);

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
    const res = await s.post('/api/review', { action: 'approve', proposal_id: 'prop-cr-a', fingerprint: proposalFingerprint(a), note: 'A only' }, approver);
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
    const ok = await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint: proposalFingerprint(w.proposals[0]) }, approver);
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

    const denied = await s.post('/api/review', { action: 'reject', proposal_id: id, fingerprint, note: 'The evidence does not carry it.' }, approver);
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
    assert.equal((await s.post('/api/review', { action: 'approve', proposal_id: id, fingerprint }, approver)).status, 200);
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
    const res = await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'ok' }, approver);
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

/* ============================================================
   11 · every approval is attributable to an authenticated actor
   ============================================================ */

test('11 · the trail answers all five questions, and names any it cannot', async () => {
  const w = world();
  const s = await running(w);
  try {
    const approver = await s.login('approver@example.org');
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'Read the passage against the claim.' }, approver);

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
  log.record({ action: 'proposal.approved', outcome: 'allowed', actor: { operator_id: 'op-1', subject: 'a@b', roles: ['approver'] }, proposal_id: 'p', previous_state: 'pending', resulting_state: 'granted' });
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
    await s.post('/api/review', { action: 'approve', proposal_id: w.proposals[0].proposal_id, fingerprint: proposalFingerprint(w.proposals[0]), note: 'ok' }, approver);
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
      `cr_session=${real.cookie.split('=')[1].slice(0, -1)}A`,      // one character changed
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

test('THE REPOSITORY · the Control Room is not in the published surface, and agent/ still is', () => {
  /* The second half is not decoration. If `agent/` ever stopped
     appearing here it would mean the surface calculation changed,
     and the first half would be proving nothing. */
  const surface = publicSurface({ root: REPO_ROOT });
  assert.ok(!surface.published.some((f) => f.startsWith('.control-room/')));
  assert.ok(surface.excluded.some((f) => f.startsWith('.control-room/')), 'the Control Room must be in the EXCLUDED set, not merely absent');
  assert.ok(surface.published.some((f) => f.startsWith('agent/')),
    'agent/ is still published — this repository has no exclude list, and the dot prefix is the only boundary there is');
  assert.equal(relative(REPO_ROOT, CONTROL_ROOM_ROOT), '.control-room');
  assert.equal(isLoopback('127.0.0.1'), true);
  assert.equal(isLoopback('0.0.0.0'), false);
});
