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
import {
  RECIPES, resolveEdits, redTargetsAmong, entityKindOf, countOccurrences,
  proposalsForRun, ProposalRefused, BROWSER_QA_AGENT,
} from './proposals.mjs';
import { proposalFingerprint } from '../implement/ledger.mjs';
import { permittedFiles } from '../implement/scope.mjs';
import { applyOperation } from '../implement/apply.mjs';
import { RED_TARGETS } from '../schemas/types.mjs';

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

/* ============================================================
   6 · --propose: a measured defect, turned into something a human
       can decide

   These are the properties that make the proposals GOVERNABLE, and
   each one is a way the arrangement could quietly fail:

     · a proposal exists only for a MEASURED failure;
     · every operation's `current` is in the file exactly once, so
       agent/implement/apply.mjs can apply it exactly;
     · the permitted set agent/implement/scope.mjs derives is the set
       the proposal names, and nothing wider;
     · re-running the producer over an unchanged tree mints the SAME
       fingerprint, because agent/records/ is git-ignored and an
       approval that went void every session would be an approval
       nobody could keep;
     · the autonomy class is derived from RED_TARGETS, not chosen;
     · nothing here writes an approval.
   ============================================================ */

/** A failure in the shape runner.mjs produces, so these tests do not
 *  need a browser. The ids and summaries are the real ones. */
const FAKE_FAILURES = {
  'nav:noscript': { id: 'nav:noscript', area: 'navigation', status: 'fail', summary: 'with scripting off, instruments.html links to none of the 6 top-level pages, and its <noscript> notice does not say navigation is among what will not appear', data: {} },
  'keyboard:skip-first': { id: 'keyboard:skip-first', area: 'accessibility', status: 'fail', summary: 'the skip link is the 10th focusable element in the RENDERED page', data: {} },
  'a11y:headings:enforcement.html': { id: 'a11y:headings:enforcement.html', area: 'accessibility', status: 'fail', summary: 'the enforcement register jumps h2 → h5 once rendered', data: {} },
};

function fakeRun(ids) {
  const failed = ids.map((i) => FAKE_FAILURES[i]);
  return { status: 'ok', failed, undecided: [{ id: 'a11y:bound' }, { id: 'keyboard:focus-visible' }], results: failed };
}

/** A context that stores in memory and traces into nothing. The
 *  records are still validated: `emit` is the real gate. */
function memoryCtx() {
  const written = [];
  return {
    written,
    now: () => '2026-09-03T00:00:00.000Z',
    simulated: false,
    ids: { mint: (prefix, parts) => `${prefix}-${Buffer.from(JSON.stringify(parts)).toString('hex').slice(0, 12)}` },
    ship: (_span, record) => {
      const errs = validate(record, { allowSimulated: false });
      assert.equal(errs.length, 0, `the producer wrote an invalid ${record.contract}:\n  · ${errs.join('\n  · ')}`);
      written.push(record);
      return record;
    },
  };
}

/** A span in the shape `RecordBuilder` and `emit` need — the trace
 *  ids are what a record carries to say where it came from, and a
 *  record with none is refused by the gate. */
const nullSpan = () => ({
  trace_id: 'a'.repeat(32),
  span_id: 'b'.repeat(16),
  run_id: 'c'.repeat(16),
  observe() {}, decide() {}, end() {}, artifact() {}, approval() {},
});

test('every recipe anchor is in its file exactly once, right now', () => {
  for (const [id, recipe] of Object.entries(RECIPES)) {
    const edits = resolveEdits(recipe);
    assert.ok(edits.length > 0, `${id} resolves no edit`);
    for (const e of edits) {
      const content = readFileSync(join(REPO_ROOT, e.path), 'utf8');
      assert.equal(countOccurrences(content, e.anchor), 1,
        `${id}: the text it would edit is not in ${e.path} exactly once. agent/implement/apply.mjs applies an edit only where its "current" occurs exactly once, so this recipe would produce a proposal guaranteed to be refused after somebody approved it.`);
    }
  }
});

test('a recipe whose anchor is not in the file produces NO proposal, by name', () => {
  const broken = { ...RECIPES['keyboard:skip-first'], edits: [{ path: 'js/shell.js', anchor: 'this string is not in js/shell.js', proposed: 'x', rationale: 'y' }] };
  assert.throws(() => resolveEdits(broken), ProposalRefused);
});

test('only a MEASURED failure becomes a proposal', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun([]), ctx, span: nullSpan() });
  assert.equal(r.proposals.length, 0, 'a run with no failures proposes nothing');
  assert.equal(ctx.written.length, 0);
});

test('an undecidable is never proposed against', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun(['keyboard:skip-first']), ctx, span: nullSpan() });
  /* The two undecidables are in the run and neither has a recipe.
     A change that made one of them PASS would be manufacturing a
     clearance this suite cannot give (docs/BROWSER-QA.md §5). */
  for (const id of ['a11y:bound', 'keyboard:focus-visible']) {
    assert.equal(RECIPES[id], undefined, `${id} is undecidable and must have no recipe`);
    assert.ok(!r.proposals.some((p) => JSON.stringify(p).includes(`→ ${id}`)), `${id} was proposed against`);
  }
});

test('a failure with no recipe is refused by name rather than dropped', () => {
  const ctx = memoryCtx();
  const run = { status: 'ok', failed: [{ id: 'made:up', area: 'navigation', status: 'fail', summary: 'x', data: {} }], undecided: [] };
  const r = proposalsForRun({ run, ctx, span: nullSpan() });
  assert.equal(r.proposals.length, 0);
  assert.equal(r.refused.length, 1);
  assert.equal(r.refused[0].what, 'made:up');
  assert.match(r.refused[0].reason, /no recipe/);
});

test('a skipped browser run proposes nothing and says why', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: { status: 'skipped', skipReason: 'no browser', failed: [] }, ctx, span: nullSpan() });
  assert.equal(r.proposals.length, 0);
  assert.match(r.refused[0].reason, /nothing was measured/);
});

test('every operation can actually be applied by agent/implement/apply.mjs', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  assert.equal(r.proposals.length, 3);
  for (const p of r.proposals) {
    for (const op of p.proposed_change.operations) {
      const content = readFileSync(join(REPO_ROOT, op.target), 'utf8');
      const next = applyOperation(content, op);
      assert.notEqual(next, content, `${p.proposal_id}: applying ${op.op} on ${op.target} changed nothing`);
      assert.ok(next.includes(op.proposed), 'the proposed text is in the result');
    }
  }
});

test('the permitted set agent/implement/ derives is exactly what the proposal names', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  for (const p of r.proposals) {
    const scope = permittedFiles(p);
    assert.deepEqual(scope.permitted, [...p.files].sort(), `${p.proposal_id}: the derived permitted set is not the file list`);
    assert.equal(scope.refusals.length, 0, `${p.proposal_id} names a path this agent may never write: ${JSON.stringify(scope.refusals)}`);
    for (const op of p.proposed_change.operations) {
      assert.ok(scope.permitted.includes(op.target), `${op.target} is outside the permitted set`);
    }
  }
});

test('the autonomy class is DERIVED from RED_TARGETS, not chosen', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  for (const p of r.proposals) {
    const red = redTargetsAmong(p.files);
    assert.equal(p.autonomy_class, red.length ? 'human_only' : 'review_required',
      `${p.proposal_id} touches ${red.join(', ') || 'no red target'} and is "${p.autonomy_class}"`);
  }
  /* And the one that touches the footer generator IS red, so this
     test is not vacuous. */
  const footer = r.proposals.find((p) => p.files.includes('tools/_footer.mjs'));
  assert.ok(footer, 'the noscript proposal names tools/_footer.mjs');
  assert.ok(RED_TARGETS.includes('tools/_footer.mjs'));
  assert.equal(footer.autonomy_class, 'human_only');
});

test('re-running the producer over an unchanged tree mints the same fingerprint', () => {
  /* agent/records/ is git-ignored, so a session that regenerates the
     proposals must regenerate the SAME ones or every approval in the
     ledger goes void. proposalFingerprint excludes trace_ref and
     created_at for exactly this reason; this asserts the rest of the
     record is stable too. */
  const a = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx: memoryCtx(), span: nullSpan() });
  const b = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx: memoryCtx(), span: nullSpan() });
  assert.deepEqual(a.proposals.map((p) => p.proposal_id), b.proposals.map((p) => p.proposal_id));
  assert.deepEqual(a.proposals.map(proposalFingerprint), b.proposals.map(proposalFingerprint));
});

test('nothing the producer writes is an approval', () => {
  const ctx = memoryCtx();
  proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  const requests = ctx.written.filter((r) => r.contract === 'ApprovalRequest');
  assert.equal(requests.length, 3);
  for (const req of requests) {
    assert.equal(req.state, 'requested', 'a producer that wrote "granted" would be writing its own approval');
    assert.equal(req.decision, null);
    assert.ok(req.what_to_check.length >= 4, '"please review" delegates the thinking back to the reviewer');
    assert.ok(req.what_to_check.some((c) => /undecidable/i.test(c)), 'the reviewer is asked to confirm the undecidables stayed undecidable');
  }
});

test('no proposal adds a dependency, a build step or a second data gateway', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  for (const p of r.proposals) {
    assert.deepEqual(p.new_dependencies, []);
    assert.equal(p.adds_build_step, false);
    assert.equal(p.adds_fetch_call, false);
    assert.deepEqual(p.fetch_modules, []);
    assert.equal(p.validator_impact.expected_new_errors, 0);
    assert.equal(p.validator_impact.expected_new_warnings, 0);
  }
});

test('every proposal names the browser suite as the check that would prove it', () => {
  const ctx = memoryCtx();
  const r = proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  for (const p of r.proposals) {
    const cmds = p.validation_requirements.map((v) => v.command).join(' ');
    assert.ok(cmds.includes(BROWSER_QA_COMMAND), 'the only check that can see the defect is named');
    for (const v of ['tools/validate.mjs', 'tools/i18n-audit.mjs', 'tools/design-qa.mjs', 'tools/freshness.mjs']) {
      assert.ok(cmds.includes(v), `${v} is not named`);
    }
  }
});

test('entityKindOf reads the kind off the path rather than being told it', () => {
  assert.equal(entityKindOf('index.html'), 'page');
  assert.equal(entityKindOf('css/tools.css'), 'stylesheet');
  assert.equal(entityKindOf('tools/_footer.mjs'), 'tool');
  assert.equal(entityKindOf('js/shell.js'), 'module');
});

test('the producer agent is not a name any decision may carry', () => {
  /* agent/implement/ledger.mjs refuses a decision whose decided_by is
     any agent in the system. This asserts the producer has a name at
     all, which is what makes that refusal reachable. */
  assert.equal(BROWSER_QA_AGENT, 'browser-qa');
  const ctx = memoryCtx();
  proposalsForRun({ run: fakeRun(Object.keys(RECIPES)), ctx, span: nullSpan() });
  for (const rec of ctx.written) assert.equal(rec.agent, BROWSER_QA_AGENT);
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
