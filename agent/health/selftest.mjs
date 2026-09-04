/* ============================================================
   agent/health/selftest.mjs — the monitor's own suite

     node --test agent/health/selftest.mjs

   SESSION 20 asks for regression tests covering BOTH normal
   operation and security-boundary failures. The two halves are
   marked below.

   The security half is the one worth reading. Every check in
   `agent/health/security.mjs` reads source or probes loopback, and
   a check of that kind can be vacuous in a way that is invisible:
   a regex that matches nothing reports a clean tree, and a probe
   that requests the wrong URL reports no exposure. So each of those
   tests plants the failure it is meant to catch — a credential in a
   website asset, a Control Room page in the published surface, an
   unauthenticated route — and asserts the check finds it. A security
   check nobody has watched fail is a security check nobody should
   trust.

   The suite also asserts the two properties SESSION 20 states as
   requirements rather than as metrics: that there is no overall
   score, and that no private metric can reach the public view.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  defineMetric, measured, unmeasurable, notApplicable, summarise, overallScore,
  DOMAINS, DOMAIN_LABEL, DOMAIN_STAKE, REQUIRED_FIELDS, NOT_A_SCORE_METRICS,
  MetricDefinitionError, STATES, DIRECTIONS,
} from './model.mjs';
import {
  ALL_METRICS, BY_ID, byDomain, measureAll, publicMetrics, privateMetrics,
  publicReading, publicView,
} from './metrics.mjs';
import { gather, probePrivilegedRoutes, allSpans, allEvents } from './gather.mjs';
import {
  analyseInterface, analyseAll, PRIVILEGED_INTERFACES, AUTH_SIGNALS, AUTHZ_SIGNALS,
  CONTROL_ROOM_MARKERS, SECURITY_METRICS,
} from './security.mjs';
import { entryFor, movement, read as readHistory, append, historyPath, HISTORY_DIR } from './history.mjs';
import { collectLeaks } from './monitor.mjs';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { scanSecrets, publicSurface, isWebsiteAsset } from '../implement/boundary.mjs';

/* ---------------------------------------------------------- fixtures */

/** A context with just enough in it for a metric to measure. Built
 *  rather than gathered, so a test can bend one field. */
function fakeCtx(over = {}) {
  return {
    as_of: '2026-09-03',
    root: REPO_ROOT,
    commit: 'a'.repeat(40),
    branch: 'test',
    environment: 'node test',
    data: {},
    dataset_errors: [],
    baseline: { unverified: 106, checks: {} },
    validators: null,
    browser_requested: false,
    browser: null,
    browser_error: null,
    surface: { published: [], excluded: [], total: 0, has_config: false, has_nojekyll: false, unresolved: 'not established' },
    secrets: { findings: [], blocking: [], fixtures: [], scanned: 0, patterns: 11, bound: 'shapes only' },
    exposure: { exposed: [], ignored_not_excluded: [], surface: {} },
    records: { byId: new Map(), approvalRequests: [], traces: [] },
    ledger: { decisions: [], malformed: [], path: '(memory)' },
    proposals: [],
    runs: [], traces: [], trace_errors: [],
    probe: null,
    /* Absent by default, which is the ordinary case: the Control
       Room audit trail is git-ignored private state, so a fresh
       clone and a CI runner have none. */
    control_room_audit: { present: false, dir: '(none)', entries: [], malformed: 0, why: 'no Control Room audit trail exists on this machine.' },
    ...over,
  };
}

let CTX = null;
/** One real gathering, shared. Gathering is the expensive part and
 *  every "normal operation" test wants the same snapshot. */
async function realCtx() {
  if (!CTX) CTX = await gather({ asOf: '2026-09-03', browser: false, probe: true });
  return CTX;
}

function tempDir(prefix = 'health-') { return mkdtempSync(join(tmpdir(), prefix)); }

/* ============================================================
   NORMAL OPERATION · the metric model
   ============================================================ */

test('every metric declares all the fields SESSION 20 requires', () => {
  for (const m of ALL_METRICS) {
    for (const f of REQUIRED_FIELDS) {
      assert.ok(m[f] !== undefined && m[f] !== null && m[f] !== '', `${m.id} omits "${f}"`);
    }
    assert.ok(m.limitations.length > 40, `${m.id}'s limitations are too short to be a real answer: "${m.limitations}"`);
    assert.ok(m.interpretation.length > 40, `${m.id}'s interpretation is too short: "${m.interpretation}"`);
  }
});

test('defineMetric refuses a metric missing any required field', () => {
  for (const drop of ['definition', 'source', 'calculation', 'frequency', 'interpretation', 'limitations', 'visibility']) {
    const def = {
      id: 'knowledge.test', name: 'T', domain: 'knowledge', definition: 'd', source: 's',
      calculation: 'c', frequency: 'per_run', interpretation: 'i', limitations: 'l',
      visibility: 'public', direction: 'lower_is_better', measure: () => measured(0),
    };
    delete def[drop];
    assert.throws(() => defineMetric(def), MetricDefinitionError, `dropping "${drop}" must be refused`);
  }
});

test('a metric id must be prefixed with its domain, so a reading cannot be filed under the wrong one', () => {
  assert.throws(() => defineMetric({
    id: 'wrong.thing', name: 'T', domain: 'knowledge', definition: 'd', source: 's', calculation: 'c',
    frequency: 'per_run', interpretation: 'i', limitations: 'l', visibility: 'public',
    direction: 'lower_is_better', measure: () => measured(0),
  }), /prefixed with its domain/);
  for (const m of ALL_METRICS) assert.ok(m.id.startsWith(`${m.domain}.`), `${m.id} is not prefixed with ${m.domain}`);
});

test('the three domains all exist, are populated, and each states what a failure costs', () => {
  assert.deepEqual(DOMAINS, ['public_website', 'knowledge', 'control_plane']);
  for (const d of DOMAINS) {
    assert.ok(byDomain(d).length >= 10, `${d} has only ${byDomain(d).length} metrics`);
    assert.ok(DOMAIN_LABEL[d] && DOMAIN_STAKE[d].length > 40, `${d} has no stated stake`);
  }
});

test('the registry has no duplicate ids', () => {
  assert.equal(BY_ID.size, ALL_METRICS.length);
});

/* ============================================================
   NORMAL OPERATION · the three states, and unmeasurable is not zero
   ============================================================ */

test('unmeasurable carries a null value, never a zero', () => {
  const r = unmeasurable('nothing here can see this', 'a thing that would');
  assert.equal(r.state, 'unmeasurable');
  assert.equal(r.value, null);
  assert.notEqual(r.value, 0);
});

test('an unmeasurable reading must say why AND what would be needed', () => {
  assert.throws(() => unmeasurable('because', null), MetricDefinitionError);
  assert.throws(() => unmeasurable(null, 'a browser'), MetricDefinitionError);
});

test('deployment failures is unmeasurable, and would be a lie as a zero', () => {
  const m = BY_ID.get('public_website.deployment_failures');
  const r = m.measure(fakeCtx());
  assert.equal(r.state, 'unmeasurable');
  assert.equal(r.value, null);
  assert.match(r.why, /network policy|never fetched|no deployment telemetry/i);
  assert.ok(r.needs.length > 40);
});

test('Control Room availability moved from not_applicable to unmeasurable, and 100% would be the worse lie', () => {
  /* SESSION 21 CHANGED THIS METRIC, and the change is the point.
     Before, it was NOT_APPLICABLE: there was no Control Room, so
     there was nothing to be available. There is one now, and nothing
     here measures whether an instance of it is running — so the
     honest state is UNMEASURABLE. Leaving the old reading in place
     would have been a metric asserting the absence of a thing this
     session built. */
  const r = BY_ID.get('control_plane.control_room_availability').measure(fakeCtx());
  assert.equal(r.state, 'unmeasurable');
  assert.equal(r.value, null);
  assert.match(r.why, /SESSION 21|\.control-room/);
  assert.match(r.why, /100% would read as "checked and up"/,
    'the metric must say why the optimistic reading is the dangerous one');
  /* And when something does measure it, bare reachability is the
     wrong definition: a Control Room that is up and answering
     everybody is worse than one that is down. */
  assert.match(r.needs, /FAILURE rather than as availability/);
  assert.ok(r.needs.length > 40);
});

test('authentication failures is measurable now, and is still never zero for want of a trail', () => {
  /* Also changed by SESSION 21. The old reading — "there is no
     login" — was true when it was written and is not any more, so
     the metric now counts refusals from the Control Room audit
     trail. What has NOT changed is the refusal to report an absent
     trail as zero. */
  const absent = BY_ID.get('control_plane.authn_authz_failures').measure(fakeCtx());
  assert.equal(absent.state, 'unmeasurable', 'a machine with no Control Room trail has no reading, not a reading of 0');
  assert.notEqual(absent.value, 0);
  assert.match(absent.why, /different fact from nobody having been refused/);
  assert.match(absent.needs, /git-ignored private state/);

  /* And with a trail, it counts — split by kind, because a denial is
     the authorization layer working and a run of failed logins is
     not the same event. */
  const trail = {
    present: true, malformed: 0, dir: '/tmp/fake', why: null,
    entries: [
      { action: 'session.login', actor_subject: 'a@b' },
      { action: 'session.login_failed', actor_subject: 'a@b' },
      { action: 'session.login_failed', actor_subject: 'a@b' },
      { action: 'authz.denied', actor_subject: 'c@d' },
      { action: 'proposal.approved', actor_subject: 'c@d' },
    ],
  };
  const measured_ = BY_ID.get('control_plane.authn_authz_failures').measure(fakeCtx({ control_room_audit: trail }));
  assert.equal(measured_.state, 'measured');
  assert.equal(measured_.value, 3);
  assert.equal(measured_.of, 5);
  assert.equal(measured_.detail.failed_logins, 2);
  assert.equal(measured_.detail.authorization_denials, 1);
  assert.equal(measured_.detail.distinct_subjects_failing_login, 1);
  assert.match(measured_.detail.chain_note, /does not verify the hash chain/);
});

test('a browser-sourced metric returns unmeasurable rather than 0 when the browser did not run', () => {
  const ctx = fakeCtx({ browser: null });
  for (const id of ['public_website.console_errors', 'public_website.rendering_failures', 'public_website.search_failures', 'public_website.navigation_failures', 'public_website.accessibility_failures']) {
    const r = BY_ID.get(id).measure(ctx);
    assert.equal(r.state, 'unmeasurable', `${id} must not report a number when nothing opened a page`);
    assert.notEqual(r.value, 0);
  }
});

test('a SKIPPED browser run is also unmeasurable, and names the skip reason', () => {
  const ctx = fakeCtx({ browser: { status: 'skipped', skipReason: 'no browser was found', counts: { total: 0, pass: 0, fail: 0, undecidable: 0 }, failed: [], undecided: [] } });
  const r = BY_ID.get('public_website.browser_regressions').measure(ctx);
  assert.equal(r.state, 'unmeasurable');
  assert.match(r.why, /no browser was found/);
});

/* ============================================================
   NORMAL OPERATION · no overall score, ever
   ============================================================ */

test('overallScore() throws, and says why', () => {
  assert.throws(() => overallScore(), MetricDefinitionError);
  try { overallScore(); } catch (e) {
    assert.match(e.message, /no overall health score/i);
    assert.match(e.message, /different consequences/);
  }
});

test('summarise() returns per-domain totals and no score, percentage or grade anywhere', () => {
  const s = summarise([
    { metric: BY_ID.get('knowledge.contradictory_records'), reading: measured(1) },
    { metric: BY_ID.get('knowledge.unresolved_claims'), reading: measured(106) },
  ]);
  const text = JSON.stringify(s);
  for (const forbidden of ['"score"', '"grade"', '"overall"', '"health_score"', '"percentage"']) {
    assert.ok(!text.includes(forbidden), `summarise() must not produce ${forbidden}`);
  }
  assert.ok(DOMAINS.every((d) => d in s));
  /* And a not_a_score metric is never counted as a finding. */
  assert.equal(s.knowledge.findings, 1, 'only the lower_is_better metric contributes to findings');
  assert.equal(s.knowledge.not_a_score, 1);
});

test('no domain summary can be added to another: the three carry different stakes', () => {
  const stakes = new Set(DOMAINS.map((d) => DOMAIN_STAKE[d]));
  assert.equal(stakes.size, 3, 'three domains must state three different costs, or summing them would be defensible');
});

/* ============================================================
   NORMAL OPERATION · a lower number is not automatically healthier
   ============================================================ */

test('the five not-a-score metrics are labelled not_a_score, and the model enforces it', () => {
  for (const id of NOT_A_SCORE_METRICS) {
    const m = BY_ID.get(id);
    assert.ok(m, `NOT_A_SCORE_METRICS names "${id}" and no metric has that id`);
    assert.equal(m.direction, 'not_a_score', `${id} must be not_a_score`);
  }
});

test('re-labelling a not-a-score metric as a score is refused at definition time', () => {
  assert.throws(() => defineMetric({
    id: 'knowledge.unresolved_claims', name: 'T', domain: 'knowledge', definition: 'd', source: 's',
    calculation: 'c', frequency: 'per_run', interpretation: 'i', limitations: 'l',
    visibility: 'public', direction: 'lower_is_better', measure: () => measured(0),
  }), /prohibited action rather than an improvement/);
});

test('the unverified count, the provenance gaps and the blocking questions are all not_a_score', () => {
  /* These are the three numbers an agent would most plausibly try to
     "improve", and every cheap route down is a prohibited action. */
  assert.equal(BY_ID.get('knowledge.unresolved_claims').direction, 'not_a_score');
  assert.equal(BY_ID.get('knowledge.provenance_gaps').direction, 'not_a_score');
  assert.equal(BY_ID.get('control_plane.unresolved_conflicts').direction, 'not_a_score');
  for (const id of ['knowledge.unresolved_claims', 'knowledge.provenance_gaps', 'control_plane.unresolved_conflicts']) {
    assert.match(BY_ID.get(id).interpretation, /NOT (A DEFECT COUNT|TO BE OPTIMISED)|not to be optimised/i,
      `${id}'s interpretation must say plainly that it is not to be optimised`);
  }
});

test('a rejected proposal is not a defect: rejection is the governance system working', () => {
  const m = BY_ID.get('control_plane.rejected_proposals');
  assert.equal(m.direction, 'not_a_score');
  assert.match(m.interpretation, /governance system working|human looked/i);
});

/* ============================================================
   SECURITY BOUNDARY · the public subset is a whitelist
   ============================================================ */

test('every control-plane metric marked public carries a written justification', () => {
  for (const m of ALL_METRICS) {
    if (m.domain === 'control_plane' && m.visibility === 'public') {
      assert.ok(m.public_justification && m.public_justification.length > 60,
        `${m.id} is a control-plane metric marked public and must justify it in writing`);
    }
  }
});

test('a control-plane metric cannot be marked public without one', () => {
  assert.throws(() => defineMetric({
    id: 'control_plane.leaky', name: 'T', domain: 'control_plane', definition: 'd', source: 's',
    calculation: 'c', frequency: 'per_run', interpretation: 'i', limitations: 'l',
    visibility: 'public', direction: 'lower_is_better', measure: () => measured(0),
  }), /public-safe subset is intentionally published/);
});

test('the public view contains no private metric — checked over the SERIALISED view', () => {
  const readings = ALL_METRICS.map((metric) => ({ metric, reading: measured(1, { detail: { secret_path: 'agent/records/x.jsonl' } }) }));
  const view = publicView(readings, { asOf: '2026-09-03' });
  const leaked = collectLeaks(view, privateMetrics());
  assert.deepEqual(leaked, [], `the public view leaked: ${leaked.join(', ')}`);
});

test('a public reading carries no detail, no evidence and no paths', () => {
  const r = publicReading({
    metric: BY_ID.get('control_plane.proposals_awaiting_a_human'),
    reading: measured(35, { detail: { paths: ['agent/records/deadbeef.jsonl'], proposal_id: 'prop-secret' }, evidence: ['agent/records/'] }),
  });
  const text = JSON.stringify(r);
  assert.ok(!('detail' in r), 'detail must be dropped wholesale, not filtered');
  assert.ok(!('evidence' in r));
  assert.ok(!text.includes('agent/records'), text);
  assert.ok(!text.includes('prop-secret'), text);
  assert.equal(r.value, 35, 'the count itself is what is publishable');
});

test('the public view names how many metrics were withheld, without naming them', () => {
  const readings = ALL_METRICS.map((metric) => ({ metric, reading: measured(0) }));
  const view = publicView(readings, { asOf: '2026-09-03' });
  assert.equal(view.withheld.count, privateMetrics().length);
  assert.ok(view.withheld.why.length > 60);
  assert.match(view.no_overall_score, /no overall health score/i);
});

test('the security metrics are all private', () => {
  for (const m of SECURITY_METRICS) {
    assert.equal(m.visibility, 'private', `${m.id} is a security-boundary check and must never be public`);
  }
});

/* ============================================================
   SECURITY BOUNDARY · the checks are not vacuous
   ============================================================ */

test('SECURITY · a credential planted in a website asset IS caught', () => {
  const dir = tempDir('sec-');
  try {
    mkdirSync(join(dir, 'js'), { recursive: true });
    writeFileSync(join(dir, 'js', 'leak.js'), 'const t = "ghp_0123456789abcdefghijklmnopqrstuvwxyz";\n');
    const s = scanSecrets({ root: dir, files: ['js/leak.js'] });
    assert.equal(s.blocking.length, 1, 'a credential in a file a browser loads must be BLOCKING');
    assert.equal(s.blocking[0].class, 'website_asset');
    assert.ok(!JSON.stringify(s.findings).includes('0123456789abcdefghijklmnopqrstuvwxyz'), 'the value must be redacted in the finding');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('SECURITY · the live repository has no blocking credential in any website asset', () => {
  const website = publicSurface().published.filter(isWebsiteAsset);
  assert.ok(website.length > 40, `expected the pages, js/, css/, data/, i18n/ and fonts/; found ${website.length}`);
  assert.deepEqual(scanSecrets({ files: website }).findings, []);
});

test('SECURITY · a Control Room page in the published surface IS caught', () => {
  const m = BY_ID.get('control_plane.control_room_assets_published');
  const planted = fakeCtx({
    surface: { published: ['index.html', 'control-room.html', 'agent/admin/console.js'], excluded: [], total: 3, has_config: false, has_nojekyll: false, unresolved: 'x' },
    exposure: { exposed: [], ignored_not_excluded: [], surface: {} },
  });
  const r = m.measure(planted);
  assert.equal(r.state, 'measured');
  assert.equal(r.value, 2, `expected control-room.html and agent/admin/console.js, got ${JSON.stringify(r.detail.matches)}`);
  assert.ok(r.detail.matches.includes('control-room.html'));
});

test('SECURITY · a clean count is NOT reported as a clearance while no exclusion mechanism exists', () => {
  const m = BY_ID.get('control_plane.control_room_assets_published');
  const r = m.measure(fakeCtx());
  assert.equal(r.value, 0);
  assert.ok(r.detail.standing_finding, 'zero matches with no exclusion mechanism must carry the standing finding');
  assert.match(r.detail.standing_finding, /NO EXCLUSION MECHANISM/);
  assert.equal(r.detail.exclusion_mechanism_exists, false);
});

test('SECURITY · the marker list covers the obvious names a Control Room would use', () => {
  for (const name of ['control-room', 'admin', 'approve', 'console']) {
    assert.ok(CONTROL_ROOM_MARKERS.includes(name), `"${name}" must be a marker`);
  }
});

test('SECURITY · an unauthenticated privileged route IS detected', () => {
  const dir = tempDir('srv-');
  try {
    mkdirSync(join(dir, 'agent', 'observability'), { recursive: true });
    writeFileSync(join(dir, 'agent/observability/server.mjs'),
      `export function serve({ port = 1, host = '127.0.0.1' } = {}) {
         createServer((req, res) => {
           if (p === '/api/secrets') return json(res, everything());
           if (p === '/api/runs') return json(res, runs());
         });
       }\n`);
    const a = analyseInterface(PRIVILEGED_INTERFACES[0], dir);
    assert.equal(a.exists, true);
    assert.equal(a.has_auth, false, 'a server with no auth signal must report has_auth false');
    assert.deepEqual(a.privileged_routes.sort(), ['/api/runs', '/api/secrets']);
    assert.equal(a.host_is_a_parameter, true, 'a bind host that is a parameter is not a control');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('SECURITY · a route that DOES authenticate is not reported as unauthenticated', () => {
  const dir = tempDir('srv-');
  try {
    mkdirSync(join(dir, 'agent', 'observability'), { recursive: true });
    writeFileSync(join(dir, 'agent/observability/server.mjs'),
      `export function serve({ host = '127.0.0.1' } = {}) {
         createServer((req, res) => {
           const t = req.headers['authorization'];
           if (!t) return json(res, { error: 'unauthenticated' }, 401);
           if (!authorize(actor, 'read')) return json(res, { error: 'forbidden' }, 403);
           if (p === '/api/runs') return json(res, runs());
         });
       }\n`);
    const a = analyseInterface(PRIVILEGED_INTERFACES[0], dir);
    assert.equal(a.has_auth, true, 'the check must not be so strict that a real auth mechanism reads as none');
    assert.equal(a.has_authz, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('SECURITY · a bare 403 is NOT counted as authorization', () => {
  /* This is the false positive that shaped AUTHZ_SIGNALS. A 403 for
     a path that resolves outside a directory is a path check; the
     first draft counted it and turned the largest finding in this
     file into a pass. */
  const dir = tempDir('srv-');
  try {
    mkdirSync(join(dir, 'agent', 'observability'), { recursive: true });
    writeFileSync(join(dir, 'agent/observability/server.mjs'),
      `export function serve({ host = '127.0.0.1' } = {}) {
         createServer((req, res) => {
           if (!file.startsWith(VIEWER)) return json(res, { error: 'forbidden' }, 403);
           if (p === '/api/runs') return json(res, runs());
         });
       }\n`);
    const a = analyseInterface(PRIVILEGED_INTERFACES[0], dir);
    assert.equal(a.has_authz, false, 'a path-traversal 403 is not an authorization decision');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('SECURITY · the real observability server has neither authentication nor authorization', () => {
  /* Not a fixture. The actual file, and the actual finding: eleven
     privileged routes over the whole trace store, with the bind
     address as the only control — and a bind address that is a
     parameter is a default, not a control. */
  const a = analyseAll(REPO_ROOT)[0];
  assert.equal(a.exists, true);
  assert.ok(a.privileged_routes.length >= 10, `expected the /api/ routes, found ${a.privileged_routes.length}`);
  assert.equal(a.has_auth, false);
  assert.equal(a.has_authz, false);
  assert.equal(a.binds, '127.0.0.1');
  assert.equal(a.host_is_a_parameter, true);
});

test('SECURITY · the loopback probe finds that privileged routes answer without a credential', async () => {
  const p = await probePrivilegedRoutes();
  assert.equal(p.error, null, `the probe failed: ${p.error}`);
  assert.ok(p.results.length >= 10);
  const answered = p.results.filter((r) => r.status >= 200 && r.status < 300 && r.bytes > 0);
  assert.ok(answered.length > 0,
    'the probe must actually demonstrate the exposure. If this ever passes with 0, either auth was added — in which case delete this assertion deliberately — or the probe is requesting the wrong URLs.');
  assert.equal(p.results.filter((r) => r.status === 401).length, 0, 'nothing returns 401, because nothing asks for a credential');
  assert.match(p.origin, /^http:\/\/127\.0\.0\.1:/, 'the probe must bind loopback only');
});

test('SECURITY · the probe metric reports unmeasurable rather than 0 when the probe did not run', () => {
  const r = BY_ID.get('control_plane.privileged_responses_without_authorization').measure(fakeCtx({ probe: null }));
  assert.equal(r.state, 'unmeasurable');
  assert.notEqual(r.value, 0);
});

test('SECURITY · an approval action exposed over HTTP would be caught', () => {
  const dir = tempDir('srv-');
  try {
    mkdirSync(join(dir, 'agent', 'observability'), { recursive: true });
    writeFileSync(join(dir, 'agent/observability/server.mjs'),
      `export function serve({ host = '127.0.0.1' } = {}) {
         createServer((req, res) => {
           if (p === '/api/approve') return json(res, recordDecision({ proposalId: q.id, outcome: 'granted' }));
         });
       }\n`);
    const ctx = fakeCtx({ root: dir, surface: { published: [], excluded: [], total: 0, has_config: false, has_nojekyll: false, unresolved: 'x' } });
    const r = BY_ID.get('control_plane.approval_actions_publicly_reachable').measure(ctx);
    assert.ok(r.value >= 1, 'an HTTP route calling recordDecision with no authorization must be caught');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('SECURITY · today nothing exposes an approval action, and the reason is recorded', () => {
  const r = BY_ID.get('control_plane.approval_actions_publicly_reachable').measure(fakeCtx());
  assert.equal(r.value, 0);
  assert.match(r.detail.why_zero, /CLI command/);
  assert.match(r.detail.not_covered, /decisions\.jsonl/);
});

test('SECURITY · the history directory is git-ignored, because it holds control-plane data', () => {
  const ignore = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf8');
  assert.match(ignore, /agent\/health\/history\//,
    'the historical health record holds private control-plane data and this repository publishes its whole tree');
  const tracked = execFileSync('git', ['check-ignore', '-q', 'agent/health/history/health.jsonl'], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.equal(tracked, '', 'git check-ignore must confirm it, not just the file text');
});

test('SECURITY · the health RECORD is not published, while the README explaining why is', () => {
  /* The distinction is the point, and the first draft of this test
     missed it: it asserted nothing under agent/health/history/ was
     published, which failed the moment the README was tracked. The
     DATA must not be published. The document explaining why must be
     — a boundary rule nobody can read is a boundary rule nobody
     keeps.

     The ignore rule is not itself a boundary, and this asserts the
     monitor would notice if the record ever landed in the published
     set. */
  const surface = publicSurface();
  const records = surface.published.filter((f) => f.startsWith('agent/health/history/') && f.endsWith('.jsonl'));
  assert.deepEqual(records, [], `the historical health record is in the published surface: ${records.join(', ')}`);
  assert.ok(surface.published.includes('agent/health/history/README.md'),
    'the README explaining why the record is not published belongs in the repository');
});

/* ============================================================
   NORMAL OPERATION · measuring the real repository
   ============================================================ */

test('every metric measures the real repository without throwing', async () => {
  const ctx = await realCtx();
  const readings = measureAll(ctx);
  const threw = readings.filter((r) => r.reading.threw);
  assert.deepEqual(threw.map((r) => `${r.metric.id}: ${r.reading.why}`), []);
  assert.equal(readings.length, ALL_METRICS.length);
  for (const { metric, reading } of readings) {
    assert.ok(STATES.includes(reading.state), `${metric.id} returned state "${reading.state}"`);
    if (reading.state === 'measured') assert.equal(typeof reading.value, 'number', `${metric.id} measured a non-number`);
    else assert.equal(reading.value, null, `${metric.id} is ${reading.state} and must carry a null value`);
  }
});

test('a metric that throws becomes an unmeasurable reading, not a crashed run', () => {
  const exploding = defineMetric({
    id: 'knowledge.exploding', name: 'T', domain: 'knowledge', definition: 'd', source: 's',
    calculation: 'c', frequency: 'per_run', interpretation: 'i', limitations: 'l',
    visibility: 'private', direction: 'lower_is_better',
    measure() { throw new Error('boom'); },
  });
  const [{ reading }] = measureAll(fakeCtx(), { metrics: [exploding] });
  assert.equal(reading.state, 'unmeasurable');
  assert.equal(reading.threw, true);
  assert.match(reading.why, /boom/);
  assert.notEqual(reading.value, 0, 'a monitor defect must never read as a clean result');
});

test('the known contradiction in the corpus is found', async () => {
  const ctx = await realCtx();
  const r = BY_ID.get('knowledge.contradictory_records').measure(ctx);
  assert.equal(r.state, 'measured');
  assert.ok(r.value >= 1, 'handover issue 18 — rel-kind:complement is stored as both symmetric and asymmetric');
  assert.ok(r.detail.relationship_kinds_stored_both_ways.length >= 1);
});

test('the __CONTENT__ duplication is found, and the standfirst drift with it', async () => {
  const ctx = await realCtx();
  const r = BY_ID.get('knowledge.duplicate_facts').measure(ctx);
  assert.equal(r.state, 'measured');
  assert.ok(r.detail.blob_parsed, 'the inlined blob must actually be parsed — the first draft failed to and reported "could not be located", which is a worse answer than the real one');
  assert.ok(r.value > 10, 'fourteen part titles plus the standfirst exist in two places');
  assert.ok(r.detail.already_drifted >= 1, 'AGENTS.md records that meta.standfirst has already drifted');
});

test('the unverified count matches the recorded baseline in §12', async () => {
  const ctx = await realCtx();
  const r = BY_ID.get('knowledge.unresolved_claims').measure(ctx);
  assert.equal(r.state, 'measured');
  assert.equal(r.value, 106, 'the canonical count comes from validate.mjs across all ten datasets');
  assert.ok(r.detail.claims_and_enforcement_only < r.value, 'the narrower direct count must be reported beside it and labelled as narrower');
});

test('no agent has ever applied a change to the legal record, and the metric says so', async () => {
  const ctx = await realCtx();
  const r = BY_ID.get('control_plane.agent_changes_applied_to_the_site').measure(ctx);
  assert.equal(r.state, 'measured');
  assert.equal(r.value, 0);
  assert.match(r.detail.caveat, /human applying a proposal by hand/);
});

/* ============================================================
   NORMAL OPERATION · the historical record
   ============================================================ */

test('a history entry records what the run could and could not see', async () => {
  const ctx = await realCtx();
  const entry = entryFor({ readings: measureAll(ctx), ctx, trace_id: 'abc' });
  assert.ok(entry.coverage, 'without coverage, a 0 taken with no browser is indistinguishable from a 0 taken with one');
  assert.equal(typeof entry.coverage.browser_run, 'boolean');
  assert.equal(entry.readings.length, ALL_METRICS.length);
  /* Detail is deliberately NOT stored: it is tens of kilobytes per
     run and the history holds movement, not evidence. */
  assert.ok(entry.readings.every((r) => !('detail' in r)));
});

test('movement is only computed between readings that BOTH measured', () => {
  const now = { recorded_at: 'b', coverage: {}, readings: [{ id: 'x', domain: 'knowledge', direction: 'lower_is_better', state: 'measured', value: 5 }] };
  const then = { recorded_at: 'a', coverage: {}, readings: [{ id: 'x', domain: 'knowledge', direction: 'lower_is_better', state: 'unmeasurable', value: null }] };
  const m = movement(now, then);
  assert.equal(m.changes.length, 0, 'measured-vs-unmeasurable is not a movement, it is a coverage change');
  assert.equal(m.coverage_changes.length, 1);
  assert.match(m.coverage_changes[0].note, /became measurable/);
});

test('a not-a-score metric moving is reported separately and never as an improvement', () => {
  const now = { recorded_at: 'b', coverage: {}, readings: [{ id: 'knowledge.unresolved_claims', domain: 'knowledge', direction: 'not_a_score', state: 'measured', value: 100 }] };
  const then = { recorded_at: 'a', coverage: {}, readings: [{ id: 'knowledge.unresolved_claims', domain: 'knowledge', direction: 'not_a_score', state: 'measured', value: 106 }] };
  const m = movement(now, then);
  assert.equal(m.changes.length, 0, 'a not-a-score metric must never appear in the ordinary changes list');
  assert.equal(m.not_a_score_changes.length, 1);
  assert.match(m.not_a_score_changes[0].note, /Read the commit/);
});

test('the first entry is a baseline, not a movement', () => {
  const m = movement({ recorded_at: 'a', coverage: {}, readings: [] }, null);
  assert.equal(m.comparable, false);
  assert.match(m.why, /first entry/);
});

test('the history reports a line it cannot parse rather than forgetting it', () => {
  const dir = tempDir('hist-');
  try {
    writeFileSync(join(dir, 'health.jsonl'), `${JSON.stringify({ recorded_at: 'a', readings: [] })}\nnot json\n{"recorded_at":"b"}\n`);
    const h = readHistory({ dir });
    assert.equal(h.entries.length, 1);
    assert.equal(h.malformed.length, 2, 'a store that quietly drops what it cannot read can be made to forget');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('appending and reading back round-trips', () => {
  const dir = tempDir('hist-');
  try {
    append({ history_version: 1, recorded_at: '2026-09-03T00:00:00Z', as_of: '2026-09-03', readings: [{ id: 'x', state: 'measured', value: 1 }], coverage: {} }, { dir });
    const h = readHistory({ dir });
    assert.equal(h.entries.length, 1);
    assert.equal(h.entries[0].readings[0].value, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   NORMAL OPERATION · the gatherer
   ============================================================ */

test('gather() refuses to run without a date', async () => {
  await assert.rejects(() => gather({}), /asOf/);
});

test('gather() reads every dataset the site loads', async () => {
  const ctx = await realCtx();
  assert.deepEqual(ctx.dataset_errors, []);
  assert.ok(Object.keys(ctx.data).length >= 10);
  assert.ok(ctx.commit, 'a health reading with no commit cannot be placed in history');
});

test('the monitor excludes its OWN trace, so it does not report itself as incomplete', async () => {
  /* The sink writes span.start as each domain span opens and
     span.end only when it closes, so a monitor reading its own
     in-flight run finds spans left running. Observed on the first
     full run of this session: 0 incomplete traces before the monitor
     existed, 2 after. */
  const withSelf = await gather({ asOf: '2026-09-03', browser: false, probe: false });
  const anyTrace = withSelf.runs[0]?.trace_id;
  if (!anyTrace) return;
  const excluded = await gather({ asOf: '2026-09-03', browser: false, probe: false, excludeTrace: anyTrace });
  assert.equal(excluded.traces.length, withSelf.traces.length - 1);
  assert.equal(excluded.self_trace_excluded, true);
});
