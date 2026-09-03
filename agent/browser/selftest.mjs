/* ============================================================
   agent/browser/selftest.mjs — the browser suite's own suite

     node --test agent/browser/selftest.mjs

   Two halves, and the split matters.

   The FIRST half runs everywhere, including on a machine with no
   browser: the static server, the honest refusal in `find.mjs`, and
   — the part SESSION 18 requirement 7 turns on — the proof that a
   run which could not open a browser NEVER reports a pass, in any of
   the three places that verdict is derived (`verdictOf`,
   `asQACheck`, and the CLI's exit code).

   The SECOND half needs a browser and says so out loud when there is
   none. It does not silently pass. `node --test` has no "skipped
   because the environment lacks something" that is distinguishable
   from a pass at a glance, so each of these asserts the honest-skip
   path instead and prints why.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findBrowser, CANDIDATE_PATHS, BROWSER_ENV_VARS } from './find.mjs';
import { serveSite, REPO_ROOT, MIME } from './serve.mjs';
import { runBrowserQA, asQACheck, verdictOf, BASELINE, BROWSER_QA_COMMAND } from './runner.mjs';
import { PAGES, NAV_FILES, VIEWPORTS } from './checks.mjs';
import { CHROME_FLAGS } from './cdp.mjs';
import { validate } from '../schemas/validate.mjs';
import { QAResult } from '../schemas/contracts/qa-result.mjs';

/* ============================================================
   1 · the honest refusal
   ============================================================ */

test('findBrowser refuses rather than guessing when nothing is installed', () => {
  /* An environment with every variable pointing nowhere. The
     candidate paths may still hit on this machine, so the assertion
     is on the SHAPE of a refusal, taken from a forced one. */
  const forced = findBrowser({ env: { BROWSER_QA_CHROME: '/nonexistent/definitely/not/a/browser' } });
  assert.ok(forced.looked.length > 0, 'a refusal names where it looked');
  if (!forced.found) {
    assert.equal(forced.path, null);
    assert.match(forced.reason, /installs nothing|not found/i);
    assert.ok(forced.looked.includes('$BROWSER_QA_CHROME=/nonexistent/definitely/not/a/browser'));
  }
});

test('the search list names environment variables before install locations', () => {
  assert.ok(BROWSER_ENV_VARS.includes('BROWSER_QA_CHROME'));
  assert.ok(CANDIDATE_PATHS.length > 3, 'more than one platform is covered');
});

test('no launch flag disables web security, and the profile is disposable', () => {
  /* A suite that turns off the same-origin policy to make a check
     pass is measuring a browser no reader has. */
  for (const forbidden of ['--disable-web-security', '--allow-running-insecure-content', '--ignore-certificate-errors']) {
    assert.ok(!CHROME_FLAGS.includes(forbidden), `${forbidden} would make this suite measure a browser nobody uses`);
  }
  assert.ok(CHROME_FLAGS.some((f) => f.startsWith('--remote-debugging-port=0')), 'an ephemeral port, so two runs never collide');
});

/* ============================================================
   2 · a skipped run is never a pass — the three places it is derived
   ============================================================ */

const SKIPPED_RUN = {
  status: 'skipped',
  skipReason: 'No Chromium or Chrome executable was found.',
  lookedIn: ['/usr/bin/chromium'],
  counts: { total: 0, pass: 0, fail: 0, undecidable: 0 },
  failed: [],
  undecided: [],
};

test('verdictOf never returns a pass for a skipped run', () => {
  assert.equal(verdictOf('skipped', []), 'skipped');
  assert.equal(verdictOf('skipped', [{ status: 'pass' }, { status: 'pass' }]), 'skipped',
    'even with results attached — a skip is a skip');
});

test('verdictOf never returns a pass for an empty result set', () => {
  assert.equal(verdictOf('ok', []), 'skipped',
    'a run that produced no checks did not find nothing wrong; it checked nothing');
});

test('verdictOf reports undecidables rather than folding them into a pass', () => {
  assert.equal(verdictOf('ok', [{ status: 'pass' }, { status: 'undecidable' }]), 'pass_with_findings');
  assert.equal(verdictOf('ok', [{ status: 'pass' }]), 'pass');
  assert.equal(verdictOf('ok', [{ status: 'pass' }, { status: 'fail' }]), 'fail');
  assert.equal(verdictOf('failed', [{ status: 'pass' }]), 'fail', 'a run that threw is a failure whatever it managed first');
});

test('asQACheck reports a skipped run with a non-zero exit and names the reason', () => {
  const c = asQACheck(SKIPPED_RUN);
  assert.notEqual(c.exit_code, 0, 'a skipped browser run must not read as exit 0 to a pipeline');
  assert.ok(c.new_findings.some((f) => /did not run/.test(f)));
  assert.match(c.output_excerpt, /^SKIPPED/);
});

test('asQACheck produces a check the QAResult contract accepts', () => {
  const check = asQACheck({
    status: 'ok',
    verdict: 'pass',
    counts: { total: 3, pass: 3, fail: 0, undecidable: 0 },
    failed: [], undecided: [],
    browser: { version: 'Chromium 141', path: '/x/chrome' },
  });
  for (const k of ['name', 'command', 'exit_code', 'errors', 'warnings', 'baseline_errors', 'baseline_warnings', 'new_findings']) {
    assert.ok(k in check, `asQACheck must produce ${k} — QAResult's Check requires it`);
  }
  assert.equal(check.command, BROWSER_QA_COMMAND);
  assert.equal(check.baseline_errors, BASELINE.errors);

  /* And the whole thing, through the real contract, so the shape is
     checked by the gate rather than by this file's opinion of it. */
  const record = qaResultAround(check);
  assert.deepEqual(validate(record, { allowSimulated: true }), []);
});

test('a QAResult carrying a failing browser check cannot claim a pass', () => {
  const check = asQACheck({
    status: 'ok', verdict: 'fail',
    counts: { total: 3, pass: 2, fail: 1, undecidable: 0 },
    failed: [{ id: 'nav:noscript', summary: 'no navigation with scripting off' }],
    undecided: [],
    browser: { version: 'Chromium 141', path: '/x/chrome' },
  });
  const record = { ...qaResultAround(check), verdict: 'pass' };
  const errs = validate(record, { allowSimulated: true });
  assert.ok(errs.length > 0, 'the contract must refuse verdict "pass" over a check that reported errors');
  assert.ok(errs.join(' ').includes('pass'), errs.join(' '));
});

test('a QAResult carrying a SKIPPED browser check cannot claim a pass either', () => {
  const record = { ...qaResultAround(asQACheck(SKIPPED_RUN)), verdict: 'pass' };
  const errs = validate(record, { allowSimulated: true });
  assert.ok(errs.length > 0,
    'this is SESSION 18 requirement 7: browser QA cannot be silently skipped when it was required');
});

/* ============================================================
   3 · the server
   ============================================================ */

test('the fixture server serves the site with the right content types', async () => {
  const site = await serveSite();
  try {
    const html = await fetch(`${site.origin}/index.html`);
    assert.equal(html.status, 200);
    assert.match(html.headers.get('content-type'), /text\/html/);

    const js = await fetch(`${site.origin}/js/data.js`);
    assert.match(js.headers.get('content-type'), /javascript/,
      'an ES module served as text/plain does not execute, and every page here is modules');

    const json = await fetch(`${site.origin}/data/claims.json`);
    assert.equal(json.status, 200);
    assert.match(json.headers.get('content-type'), /application\/json/);
  } finally { await site.close(); }
});

test('the fixture server is read-only and refuses to leave the repository', async () => {
  const site = await serveSite();
  try {
    const post = await fetch(`${site.origin}/index.html`, { method: 'POST' });
    assert.equal(post.status, 405, 'a test fixture that accepts a write is a test fixture that can damage the repository');

    /* fetch() normalises "..", so the guard is exercised through a
       raw request line that a normalising client would never send. */
    const raw = await rawGet(site.port, '/../../../etc/passwd');
    assert.ok(/ 40[34] /.test(raw.split('\n')[0]), `expected a refusal, got: ${raw.split('\n')[0]}`);
  } finally { await site.close(); }
});

test('the server logs every request, which is how the no-third-party check is a measurement', async () => {
  const site = await serveSite();
  try {
    await fetch(`${site.origin}/index.html`);
    await fetch(`${site.origin}/style.css`);
    assert.equal(site.requests.length, 2);
    assert.ok(site.requests.every((r) => r.status === 200));
  } finally { await site.close(); }
});

test('every MIME type the site actually ships is declared', () => {
  for (const ext of ['.html', '.js', '.css', '.json', '.woff2', '.svg']) {
    assert.ok(MIME[ext], `${ext} is served by this repository and needs a content type`);
  }
});

/* ============================================================
   4 · the checks describe the real site

   Not a mock. Every page named in PAGES must exist, and NAV_FILES
   must agree with the nav model in js/shell.js — a suite whose page
   list has drifted from the site tests a site that is not this one.
   ============================================================ */

test('every page the suite loads exists in the repository', () => {
  for (const spec of PAGES) {
    const file = spec.file.split('?')[0];
    assert.ok(readFileSync(join(REPO_ROOT, file), 'utf8').length > 0, `${file} is in PAGES but not in the repository`);
  }
});

test('NAV_FILES matches the nav model in js/shell.js', () => {
  const shell = readFileSync(join(REPO_ROOT, 'js/shell.js'), 'utf8');
  const files = [...shell.matchAll(/file:\s*'([^']+\.html)'/g)].map((m) => m[1]);
  const model = [...new Set(files)];
  for (const f of NAV_FILES) {
    assert.ok(model.includes(f), `${f} is in NAV_FILES but js/shell.js's NAV does not list it`);
  }
  for (const f of model) {
    assert.ok(NAV_FILES.includes(f), `js/shell.js's NAV lists ${f} and the suite does not check it`);
  }
});

test('the viewport list covers a phone, and the phone is narrower than the tablet', () => {
  const phone = VIEWPORTS.find((v) => v.name === 'phone');
  const tablet = VIEWPORTS.find((v) => v.name === 'tablet');
  assert.ok(phone && tablet && phone.width < tablet.width);
  assert.ok(phone.width <= 400, 'a "mobile layout" check at 700px is not a mobile layout check');
});

/* ============================================================
   5 · the real run, when a browser exists
   ============================================================ */

test('a full run leaves the repository byte-identical', async (t) => {
  const found = findBrowser();
  if (!found.found) {
    t.diagnostic(`NO BROWSER ON THIS MACHINE — this test asserted the honest-skip path instead. ${found.reason}`);
    const run = await runBrowserQA();
    assert.equal(run.status, 'skipped');
    assert.equal(run.verdict, 'skipped');
    assert.notEqual(run.verdict, 'pass');
    return;
  }

  const run = await runBrowserQA({ quick: true });
  assert.ok(run.treeUnchanged, `the suite wrote to the repository: ${(run.changedPaths ?? []).join(', ')}`);
  assert.ok(run.counts.total > 20, 'a quick run still asks more than twenty questions');
  assert.equal(run.browser.version && run.browser.version.length > 0, true, 'the browser version is recorded — a result nobody can reproduce is an assertion');
  assert.ok(['pass', 'pass_with_findings', 'fail'].includes(run.verdict));
});

test('the suite makes no request that leaves the local origin', async (t) => {
  const found = findBrowser();
  if (!found.found) { t.diagnostic('no browser; nothing to measure'); return; }
  const run = await runBrowserQA({ only: ['pages', 'network'], quick: true });
  const net = run.results?.find?.((r) => r.id === 'network:first-party')
    ?? [...(run.failed ?? []), ...(run.undecided ?? [])].find((r) => r.id === 'network:first-party');
  /* Either it passed (and is not in failed/undecided), or it is here
     with the foreign origins named. */
  assert.ok(!net || net.status !== 'fail', `the site made a third-party request: ${JSON.stringify(net?.data)}`);
});

/* ---------------------------------------------------------- helpers */

function qaResultAround(check) {
  const verdict = check.errors > 0 || check.exit_code !== 0
    ? 'fail'
    : (check.warnings > check.baseline_warnings ? 'pass_with_findings' : 'pass');
  return {
    contract: 'QAResult',
    contract_version: 1,
    agent: 'browser-qa',
    created_at: new Date().toISOString(),
    affected_entities: [],
    evidence: [],
    /* The contract types `verdict` as an inference and refuses one
       that does not say how it was reached. That refusal is the
       reason this helper exists in its current shape: the first
       draft asserted a shape of its own and the gate caught it. */
    epistemic: {
      fact: [],
      inference: [{
        field: 'verdict',
        statement: `the browser suite's verdict is "${verdict}"`,
        from: [check.name],
        method: 'derived in runner.mjs verdictOf(): a skip is never a pass, an empty result set is a skip, any fail is a fail, and an undecidable is pass_with_findings',
      }],
      interpretation: [],
      unresolved: [],
    },
    trace_ref: null,
    simulated: true,
    qa_id: 'qa-selftest-browser',
    target_kind: 'repository',
    target_id: 'HEAD',
    ran_at: new Date().toISOString(),
    ran_by: 'agent/browser/selftest.mjs',
    environment: `node ${process.version} ${process.platform}`,
    checks: [check],
    verdict,
    blocking_findings: [],
  };
}

/** A GET that does not normalise the path, so the traversal guard is
 *  actually exercised. */
function rawGet(port, path) {
  return new Promise((ok, fail) => {
    import('node:net').then(({ connect }) => {
      const sock = connect(port, '127.0.0.1', () => sock.write(`GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`));
      let buf = '';
      sock.on('data', (d) => { buf += d; });
      sock.on('end', () => ok(buf));
      sock.on('error', fail);
    });
  });
}

/* Referenced so the import is not dead: the contract object is what
   `validate` resolves through the registry, and importing it here is
   what proves this suite is checking the real one. */
assert.equal(QAResult.name, 'QAResult');
