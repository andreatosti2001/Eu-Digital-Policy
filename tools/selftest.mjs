/* ============================================================
   tools/selftest.mjs — the validators' own suite

   The four validators in this directory are this project's test suite,
   and until now nothing tested THEM. Two of the findings this session
   repaired were defects in a check rather than in the thing checked:

     · `tools/design-qa.mjs` asserted "no third-party resource" while
       reading `href="…"` and `src="…"` in the HTML and nothing else, so
       the exact path by which a Google Fonts dependency returns — an
       `@import` or an `@font-face src` in a stylesheet — was invisible
       to it. AGENTS.md, docs/CURRENT-ARCHITECTURE.md §12 and README.md
       all stated the broader claim.

     · `tools/freshness.mjs` exited 1 on findings that are true because
       time has passed rather than because anything in the tree is
       wrong, which made its exit code a function of the reader's clock
       (docs/AUDIT-2026-09-01.md F-15) and gave CI a red step that no
       commit could close.

   This suite holds both repairs to their stated contracts, and it does
   it by PLANTING the defect rather than by asserting the current tree
   is clean — a check that passes on a clean tree proves only that it
   did not fire.

   Run: node --test tools/selftest.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALLOWED_RUNTIME_ORIGINS, TRACKER_HINTS, NON_FETCHING_URIS,
  foreignOrigin, scanHtml, scanCss, scanJs, scanRuntimeSurface, runtimeSurface,
} from './thirdparty.mjs';
import { EXPECTED, RECHECK, RULE_INTERVAL } from './freshness.mjs';
import { dateProblem } from './as-of.mjs';
import { RECORD_VERSION, QUESTIONS, CHECKED, LIMITS, readRecords } from './evidence-audit-record.mjs';
import { createHash } from 'node:crypto';
import { readBaseline } from '../agent/implement/baseline.mjs';
import { audit, passages, datesIn, DERIVED_FIELDS, rankingProblems } from './evidence-audit.mjs';
import { registerAudit, structural, SCOPE_DECISION_BACKLOG, STATUS_BASIS_BACKLOG } from './register-audit.mjs';
import { coverage, notCovered } from '../js/routes.js';
import { cspProblems, securityMeta, inlineScripts } from './csp.mjs';
import { openBacklog } from '../js/evidence-model.js';
import { sitePages } from './thirdparty.mjs';
import { build as buildArtifact, refusal } from './pages-artifact.mjs';
import * as EM from '../js/evidence-model.js';
import { procedure, contradictions } from '../js/pipeline.js';
import { statusContradictions, provisionApplication } from '../js/regulatory-model.js';
import { sanctionCeiling } from '../js/dna.js';
import { proseCopies, textBlocks, scriptBodies, codeOf, MIN_WORDS, unescapeJs } from './prose-homes.mjs';
import {
  SOURCE_FIELDS, REQUIRED_FIELDS, OPTIONAL_FIELDS, RESOLUTIONS, ABSENT_BY_DESIGN, violations,
} from './source-contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SELF = new Set(['https://andreatosti2001.github.io']);

/** Run a validator and report its exit code without throwing. */
function runValidator(script, args = [], cwd = ROOT, env = {}) {
  try {
    const stdout = execFileSync(process.execPath, [join(ROOT, 'tools', script), ...args],
      { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GITHUB_ACTIONS: '', ...env } });
    return { exit: 0, out: stdout };
  } catch (e) {
    return { exit: typeof e.status === 'number' ? e.status : 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const scratch = (name) => mkdtempSync(join(tmpdir(), `${name}-`));

/* ============================================================
   TEST A · a third-party runtime resource is caught wherever it
   is written

   docs/AUDIT: the claim "no third-party requests" is made in four
   documents. This is the check that makes it true of the repository
   rather than of the README.
   ============================================================ */

test('A1 · the current tree names no third-party runtime origin at all', () => {
  const found = scanRuntimeSurface(ROOT);
  assert.deepEqual(found, [],
    `the published surface must reach no origin but its own — found ${JSON.stringify(found)}`);
});

test('A2 · the surface scanned is the pages, the stylesheets and the modules', () => {
  const s = runtimeSurface(ROOT);
  assert.ok(s.pages.includes('index.html'));
  assert.ok(s.css.includes('style.css') && s.css.includes('css/tokens.css'));
  assert.ok(s.js.includes('app.js') && s.js.includes('js/shell.js'));
  /* data/ and i18n/ are deliberately OUT. data/sources.json is a
     bibliography of 74 real URLs the page DISPLAYS and fetches none
     of; scanning it would make this check fire on the evidence. */
  assert.ok(!JSON.stringify(s).includes('sources.json'));
});

test('A3 · Google Fonts is caught in an @font-face src — the exact way it would come back', () => {
  const css = `@font-face{font-family:'Bodoni Moda';src:url(https://fonts.gstatic.com/s/bodonimoda/x.woff2) format('woff2')}`;
  const found = scanCss(css, 'style.css', SELF);
  assert.equal(found.length, 1);
  assert.equal(found[0].position, 'url()');
  assert.equal(found[0].tracker, 'fonts.gstatic.com');
});

test('A4 · Google Fonts is caught in an @import, quoted or bare', () => {
  for (const css of [
    `@import url("https://fonts.googleapis.com/css2?family=Bodoni+Moda");`,
    `@import url(https://fonts.googleapis.com/css2?family=Bodoni+Moda);`,
    `@import 'https://fonts.googleapis.com/css2?family=Bodoni+Moda';`,
  ]) {
    const found = scanCss(css, 'style.css', SELF);
    assert.ok(found.length >= 1, `not caught: ${css}`);
    assert.equal(found[0].tracker, 'fonts.googleapis.com');
  }
});

test('A5 · a stylesheet link is caught with single quotes and with none', () => {
  /* The regex design-qa had required a DOUBLE quote, so both of these
     went straight past it. */
  for (const html of [
    `<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=X'>`,
    `<link rel=stylesheet href=https://fonts.googleapis.com/css2?family=X>`,
    `<script src='https://cdn.jsdelivr.net/npm/x.js'></script>`,
  ]) {
    const found = scanHtml(html, 'index.html', SELF);
    assert.ok(found.length >= 1, `not caught: ${html}`);
  }
});

test('A6 · preconnect and dns-prefetch to a foreign origin are caught', () => {
  for (const rel of ['preconnect', 'dns-prefetch', 'preload', 'modulepreload', 'prefetch']) {
    const found = scanHtml(`<link rel="${rel}" href="https://fonts.gstatic.com" crossorigin>`, 'index.html', SELF);
    assert.equal(found.length, 1, `${rel} was not caught`);
  }
});

test('A7 · a remote fetch, dynamic import, worker, socket or beacon in a module is caught', () => {
  const cases = [
    [`fetch('https://api.example.com/x')`, 'fetch()'],
    [`await import('https://esm.sh/x')`, 'import()'],
    [`import x from 'https://cdn.jsdelivr.net/npm/x'`, 'import … from'],
    [`new Worker('https://evil.example/w.js')`, 'new Worker()'],
    [`new WebSocket('wss://x.example/s')`, null],
    [`navigator.sendBeacon('https://www.google-analytics.com/collect', d)`, 'sendBeacon()'],
    [`el.src = 'https://googletagmanager.com/gtag.js'`, '.src ='],
    [`x.setAttribute('src', 'https://connect.facebook.net/en_US/sdk.js')`, 'setAttribute(src|href)'],
    [`navigator.serviceWorker.register('https://x.example/sw.js')`, 'registerServiceWorker'],
    [`r.open('GET', '//cdn.example.com/x.json')`, 'XHR open()'],
  ];
  for (const [src, position] of cases) {
    const found = scanJs(src, 'js/x.js', SELF);
    if (position === null) continue; /* wss: is out of scope and says so in A8 */
    assert.ok(found.length >= 1, `not caught: ${src}`);
    assert.equal(found[0].position, position, src);
  }
});

test('A8 · what the scan does NOT claim to cover is stated rather than implied', () => {
  /* A ws:/wss: endpoint is not matched: nothing here opens one, and a
     check that pretended to cover it would be a claim with no test
     behind it. The browser suite's network:first-party measures every
     request a rendered page actually made, which is where that would
     surface. This assertion exists so the limit is written down. */
  assert.equal(scanJs(`new WebSocket('wss://x.example/s')`, 'js/x.js', SELF).length, 0);
});

test('A9 · a comment cannot be a runtime dependency, and style.css\'s own history survives', () => {
  /* style.css records WHY Bodoni Moda and its Google Fonts request were
     removed. A check that errored on that note would teach the next
     session to delete the history rather than keep it. */
  const css = `/* This used to fetch Bodoni Moda from https://fonts.googleapis.com on every page load. */\nbody{color:red}`;
  assert.deepEqual(scanCss(css, 'style.css', SELF), []);
  assert.deepEqual(scanJs(`// see https://fonts.googleapis.com for what we removed\nconst a = 1;`, 'js/x.js', SELF), []);
  const real = readFileSync(join(ROOT, 'style.css'), 'utf8');
  assert.ok(/Google Fonts/.test(real), 'the note recording the removal must still be in style.css');
});

test('A10 · the page\'s own origin, relative paths and data: URIs are not findings', () => {
  assert.equal(foreignOrigin('https://andreatosti2001.github.io/Eu-Digital-Policy/', SELF), null);
  assert.equal(foreignOrigin('css/tokens.css', SELF), null);
  assert.equal(foreignOrigin('data:image/svg+xml,%3Csvg%3E', SELF), null);
  assert.equal(foreignOrigin('#section', SELF), null);
  assert.equal(foreignOrigin('mailto:x@y.z', SELF), null);
  /* The SVG namespace is a NAME spelled like a URL. app.js and
     js/threshold.js both hold it, and no browser fetches it. */
  for (const ns of NON_FETCHING_URIS) assert.equal(foreignOrigin(ns, SELF), null);
});

test('A11 · a protocol-relative reference is a remote fetch and is resolved, not skipped', () => {
  assert.equal(foreignOrigin('//fonts.googleapis.com/css2', SELF), 'https://fonts.googleapis.com/css2');
});

test('A12 · the allowlist is EMPTY, and adding to it is a visible diff with a reason', () => {
  assert.deepEqual(ALLOWED_RUNTIME_ORIGINS, [],
    'no third-party runtime dependency has been adopted. An entry here is a Class D architectural decision under docs/AUTONOMY-POLICY.md and must name who decided it.');
  assert.ok(Object.isFrozen(ALLOWED_RUNTIME_ORIGINS));
  assert.ok(TRACKER_HINTS.includes('fonts.googleapis.com') && TRACKER_HINTS.includes('fonts.gstatic.com'));
});

test('A13 · design-qa.mjs FAILS on a planted Google Fonts import, and passes once it is removed', () => {
  const dir = scratch('thirdparty');
  try {
    /* A minimal tree with the shape design-qa expects. */
    for (const d of ['css', 'js']) mkdirSync(join(dir, d), { recursive: true });
    cpSync(join(ROOT, 'css'), join(dir, 'css'), { recursive: true });
    cpSync(join(ROOT, 'style.css'), join(dir, 'style.css'));
    cpSync(join(ROOT, 'js'), join(dir, 'js'), { recursive: true });
    cpSync(join(ROOT, 'app.js'), join(dir, 'app.js'));
    for (const p of readdirSync(ROOT).filter((f) => f.endsWith('.html'))) cpSync(join(ROOT, p), join(dir, p));

    const clean = scanRuntimeSurface(dir);
    assert.deepEqual(clean, [], 'the copied tree must start clean');

    const css = readFileSync(join(dir, 'style.css'), 'utf8');
    writeFileSync(join(dir, 'style.css'),
      `@import url("https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..900&display=swap");\n${css}`);

    const dirty = scanRuntimeSurface(dir);
    assert.equal(dirty.length, 1);
    assert.equal(dirty[0].file, 'style.css');
    assert.equal(dirty[0].tracker, 'fonts.googleapis.com');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   FRESHNESS · the exit code answers a question a commit can act on

   The contract is written at the head of tools/freshness.mjs. These
   hold it to it from both sides: the prompts must vanish when only the
   DATE changes, and a defect must not.
   ============================================================ */

/** A scratch tree holding a copy of the real data/, for planting. */
function dataScratch() {
  const dir = scratch('freshness');
  cpSync(join(ROOT, 'data'), join(dir, 'data'), { recursive: true });
  return dir;
}

/** The newest $last_verified anywhere in data/ — the date on which this
 *  tree last claims to have been checked. */
function newestVerified(root = ROOT) {
  const dates = readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8')).$last_verified)
    .filter(Boolean).sort();
  return dates[dates.length - 1];
}

test('F1 · as of its own newest verification date, this tree reports NO prompt and NO defect', () => {
  /* This is what makes the staleness prompts calendar-driven rather
     than a category somebody widened to get a green tick: on the date
     the datasets record, the very same bytes report nothing at all. */
  const r = runValidator('freshness.mjs', [newestVerified()]);
  assert.equal(r.exit, 0);
  assert.match(r.out, /Nothing past its stated interval\./);
  assert.match(r.out, /0 defect\(s\), 0 staleness prompt\(s\)/);
  assert.equal(r.out.split('\n').filter((l) => l.trim().startsWith('! ')).length, 0);
});

test('F2 · as of today the prompts appear, are counted, and do NOT fail the run', () => {
  const today = new Date().toISOString().slice(0, 10);
  const r = runValidator('freshness.mjs', [today]);
  assert.equal(r.exit, 0, 'a finding that is true only because time passed cannot fail a build');
  assert.match(r.out, /0 defect\(s\)/);
  /* And the report must never let exit 0 be read as currency. */
  assert.match(r.out, /NOT evidence of currency/);
});

test('F3 · a DEFECT in the tree exits 1 — on today\'s date AND on the verification date', () => {
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'sources.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    /* A source with no URL and no recorded reason why: a gap in the
       record itself, closed by writing the reason down. */
    d.sources.push({ id: 'src-planted-defect', publisher_name: 'Planted', url: null, url_status: 'url:none' });
    writeFileSync(p, JSON.stringify(d, null, 2));

    for (const asOf of [new Date().toISOString().slice(0, 10), newestVerified()]) {
      const r = runValidator('freshness.mjs', [asOf], dir);
      assert.equal(r.exit, 1, `a tree defect must fail on every date, and did not on ${asOf}`);
      assert.match(r.out, /1 defect\(s\)/);
      assert.match(r.out, /src-planted-defect/);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('F4 · a per-record verification field never used per-record is a DEFECT, not a prompt', () => {
  const dir = dataScratch();
  try {
    /* docs/AUDIT-2026-09-01.md F-13: the schema offers a per-record
       date and the practice is a batch stamp. Collapse every date in
       the scratch tree to one value and the script must say so, on any
       date, and fail. */
    const files = readdirSync(join(dir, 'data')).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const p = join(dir, 'data', f);
      const flat = readFileSync(p, 'utf8').replace(/"(\$?last_verified)":\s*"\d{4}-\d{2}-\d{2}"/g, '"$1": "2026-08-27"');
      writeFileSync(p, flat);
    }
    const r = runValidator('freshness.mjs', ['2026-08-27'], dir);
    assert.equal(r.exit, 1);
    assert.match(r.out, /every verification date in the repository is 2026-08-27/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('F7 · a passed event re-read after its date is not a prompt; one not re-read still is', () => {
  /* The per-record date counts, and only in the direction it proves:
     a record verified on or after its date is current; one verified
     before it is not, whatever the file-level stamp says. */
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'timeline.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const e = d.events.find((x) => x.date > d.$last_verified) ?? d.events[0];
    const asOf = e.date > d.$last_verified ? e.date : d.$last_verified;
    e.date = asOf; e.obligation = 'PLANTED-F7 event';
    e.last_verified = asOf;
    writeFileSync(p, JSON.stringify(d, null, 1));
    let r = runValidator('freshness.mjs', [asOf], dir);
    if (asOf > d.$last_verified) assert.doesNotMatch(r.out, /PLANTED-F7 event/, 're-read on its date: not a prompt');
    e.last_verified = '2000-01-01';
    writeFileSync(p, JSON.stringify(d, null, 1));
    r = runValidator('freshness.mjs', [asOf], dir);
    if (asOf > d.$last_verified) assert.match(r.out, /PLANTED-F7 event/, 'not re-read since: still a prompt');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('F5 · the intervals are not widened — the thresholds are asserted, not trusted', () => {
  /* "Increasing a threshold to hide stale data" is a named prohibition.
     A future change to EXPECTED now has to change this line too, in a
     diff somebody reads. */
  assert.deepEqual(Object.fromEntries(Object.entries(EXPECTED).map(([k, v]) => [k, v.days])), {
    enforcement: 45, timeline: 90, instruments: 90, institutions: 180, claims: 90, sources: 180,
  });
  assert.deepEqual(Object.fromEntries(Object.entries(RECHECK).map(([k, v]) => [k, v.days])), {
    provisional_enforcement: 30,
  });
});

test('F8 · in GitHub Actions every prompt is also a "Content stale" warning, and still exits 0', () => {
  /* docs/CONTENT-FRESHNESS-POLICY.md. One annotation per printed prompt:
     a prompt raised in the log but not on the run is one a reviewer
     does not see. Outside Actions, no annotation syntax leaks into the
     report. */
  const far = '2099-01-01';
  const ci = runValidator('freshness.mjs', [far], ROOT, { GITHUB_ACTIONS: 'true' });
  assert.equal(ci.exit, 0);
  const prompts = ci.out.split('\n').filter((l) => l.trim().startsWith('! ')).length;
  const warnings = ci.out.split('\n').filter((l) => l.startsWith('::warning title=Content stale::')).length;
  assert.ok(prompts > 0);
  assert.equal(warnings, prompts);
  assert.doesNotMatch(runValidator('freshness.mjs', [far]).out, /::warning/);
});

test('F9 · a provisional enforcement record re-read within 30 days is not a prompt; one not re-read is', () => {
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'enforcement.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const r = d.enforcement.find((x) => x.requires_verification);
    r.id = 'enf-planted-f9';
    const asOf = '2099-01-31';
    for (const x of d.enforcement) x.last_verified = asOf;
    d.$last_verified = asOf;
    r.last_verified = '2099-01-01';
    writeFileSync(p, JSON.stringify(d, null, 1));
    /* Only the PROMPT lines ('! …') are the contract here. The id may
       still appear in the risk-based review, which freshness.mjs states is
       a report and not a prompt: a pending-appeal record is critical-risk
       and listed there on its own, shorter, interval. */
    const promptLines = (out) => out.split('\n').filter((l) => l.trim().startsWith('! ')).join('\n');
    assert.doesNotMatch(promptLines(runValidator('freshness.mjs', [asOf], dir).out), /enf-planted-f9/, '30 days is inside the window');
    r.last_verified = '2098-12-31';
    d.$last_verified = '2098-12-31';
    writeFileSync(p, JSON.stringify(d, null, 1));
    assert.match(runValidator('freshness.mjs', [asOf], dir).out, /1 of \d+ provisional enforcement record\(s\) not re-verified in 30 days.*enf-planted-f9/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('F6 · the prompts are still printed in full — nothing was silenced', () => {
  const today = new Date().toISOString().slice(0, 10);
  const r = runValidator('freshness.mjs', [today]);
  const prompts = r.out.split('\n').filter((l) => l.trim().startsWith('! '));
  const counted = Number((r.out.match(/(\d+) staleness prompt\(s\)/) ?? [])[1] ?? 0);
  assert.equal(prompts.length, counted,
    'every prompt counted in the summary must appear in the body: a count without its lines is a silenced finding');
  /* The headings the report is read through are all still there. */
  for (const h of ['VERIFICATION DATES', 'EVENTS THAT HAVE PASSED', 'RECORDS EXPECTED TO CHANGE', 'SOURCE REACHABILITY']) {
    assert.match(r.out, new RegExp(h));
  }
});

test('F10 · 17.3(b): the applicability rules are aged one by one, at 90 days, and a stale rule is a prompt, never a defect', () => {
  /* v2 Session 17 (29 Oct 2026, docs/ROADMAP-v2.md §8, 17.0 questions 8b and 9; named F10 because
     F7 was taken): the file's $last_verified no longer ages the rules */
  assert.equal(RULE_INTERVAL.days, 90);
  const now = runValidator('freshness.mjs', ['2026-10-29']);
  assert.equal(now.exit, 0);
  assert.match(now.out, /^ {2}applicability {3}per rule, 33 rules verified 2026-10-29 … 2026-10-29 \(file date 2026-08-27 not used\)$/m);
  assert.doesNotMatch(now.out, /RULE_STALE/);
  const later = runValidator('freshness.mjs', ['2027-01-28']);
  assert.equal(later.exit, 0);
  assert.equal(later.out.split('\n').filter((l) => l.trim().startsWith('! RULE_STALE ')).length, 33);
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'applicability.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    d.rules.find((r) => r.id === 'ap-cra-01').last_verified = '2026-07-01';
    writeFileSync(p, JSON.stringify(d, null, 2));
    const r = runValidator('freshness.mjs', ['2026-10-29'], dir);
    assert.equal(r.exit, 0, 'a stale rule is a prompt, not a defect');
    assert.deepEqual(r.out.split('\n').filter((l) => /RULE_STALE/.test(l)).map((l) => l.trim()),
      ['! RULE_STALE applicability/ap-cra-01 was last verified 2026-07-01, 120 days ago, past its 90-day interval — a rule reads its Articles, and an amendment, a new tranche or a judgment changes what it should say']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   DATES · a date the tools cannot read is refused, not reinterpreted

   docs/ROADMAP-v2.md item 0.3 (D-10), docs/AUDIT-2026-10-24.md §3.1.
   `freshness.mjs --as-of 2026-10-24` took "--as-of" as the date and
   reported a false all-clear; `evidence-audit.mjs --as-of banana`
   reported every record stale. Both now exit 2 with the reason.
   ============================================================ */

test('D1 · dateProblem() accepts a calendar day written YYYY-MM-DD and nothing else', () => {
  assert.equal(dateProblem('2026-10-24'), null);
  assert.equal(dateProblem('2024-02-29'), null, 'a leap day is a day');
  for (const bad of ['banana', '--as-of', '2026-10-24T00:00:00Z', '24-10-2026', '2026-2-3', '2026-02-30', '2025-02-29', '2026-13-01', '', undefined, null]) {
    assert.notEqual(dateProblem(bad), null, `${JSON.stringify(bad)} was read as a date`);
  }
});

test('D2 · freshness.mjs: the audit\'s own command gives the same report as the positional form', () => {
  /* The exact command of docs/AUDIT-2026-10-24.md §4. Before 0.3 it
     printed "as of --as-of" and "Nothing past its stated interval". */
  const flag = runValidator('freshness.mjs', ['--as-of', '2026-10-24']);
  const positional = runValidator('freshness.mjs', ['2026-10-24']);
  assert.equal(flag.exit, positional.exit);
  assert.equal(flag.out, positional.out, 'the two spellings of one date must produce one report');
  assert.match(flag.out, /FRESHNESS AUDIT {2}as of 2026-10-24\n/);
  assert.doesNotMatch(flag.out, /as of --as-of/);
  assert.equal(runValidator('freshness.mjs', ['--as-of=2026-10-24']).out, positional.out);
});

test('D3 · freshness.mjs exits 2, with the reason, on a date it cannot read — never 0 and never 1', () => {
  for (const args of [['--as-of', 'banana'], ['banana'], ['2026-02-30'], ['--as-of'], ['--as-of', '2026-10-24', '--as-of', '2026-10-25'], ['2026-10-24', '--as-of', '2026-10-24'], ['--json']]) {
    const r = runValidator('freshness.mjs', args);
    assert.equal(r.exit, 2, `freshness.mjs ${args.join(' ')} exited ${r.exit}`);
    assert.match(r.out, /refused — /, 'the refusal must say why');
    assert.match(r.out, /Nothing was audited/);
    assert.doesNotMatch(r.out, /Nothing past its stated interval/, 'a refused run must not print an all-clear');
  }
});

test('D4 · evidence-audit.mjs exits 2, with the reason, on a date it cannot read — and on a date it would have ignored', () => {
  for (const args of [['--as-of', 'banana'], ['--as-of', '2026-02-30'], ['--as-of'], ['--as-of', '--json'], ['2026-10-24']]) {
    const r = runValidator('evidence-audit.mjs', args);
    assert.equal(r.exit, 2, `evidence-audit.mjs ${args.join(' ')} exited ${r.exit}`);
    assert.match(r.out, /refused — /);
    assert.doesNotMatch(r.out, /EVIDENCE AUDIT/, 'a refused run must not print a report');
  }
  const ok = runValidator('evidence-audit.mjs', ['--as-of', '2026-10-24']);
  assert.equal(ok.exit, 0);
  assert.match(ok.out, /^EVIDENCE AUDIT {2}as of 2026-10-24$/m);
  assert.match(runValidator('evidence-audit.mjs', ['--as-of', '2026-10-24', '--markdown']).out, /### Evidence model — as of 2026-10-24/);
});

/* ============================================================
   APPLIES · the notice D-2 requires stays on the page

   docs/ROADMAP-v2.md item 1.5: applies.html stays online only with a
   statement that its rules are not yet verified to the standard of the
   claims, in the words the author approved on 27 Oct 2026. Removing or
   rewording it is the author's decision, so this pins the text.
   ============================================================ */

test('N1 · applies.html carries the approved notice, and its key is declared pending in it, fr and es', () => {
  const html = readFileSync(join(ROOT, 'applies.html'), 'utf8');
  const m = html.match(/<p data-i18n="applies\.notice">([\s\S]*?)<\/p>/);
  assert.ok(m, 'applies.html has lost the notice that its rules are not yet verified to the standard of the claims');
  assert.equal(m[1], "<b>These rules are not yet verified to the standard the site's claims are.</b> Each rule cites its sources by identifier only: unlike a claim, it does not say what each source supports or where in it the rule is found, and the evidence audit that checks every claim does not yet check these rules. Read a result as a pointer to the law, not as a verified reading of it.",
    'the wording is the author\'s (docs/ROADMAP-v2.md §8); change it only on their word');
  assert.ok(html.indexOf('applies.notice') < html.indexOf('id="ap-form"'), 'the notice comes before the questions');
  const reg = JSON.parse(readFileSync(join(ROOT, 'i18n', 'locales.json'), 'utf8'));
  for (const code of ['it', 'fr', 'es']) {
    const l = reg.locales.find((x) => x.code === code);
    const translated = Object.hasOwn(JSON.parse(readFileSync(join(ROOT, l.file), 'utf8')), 'applies.notice');
    assert.ok(translated || (l.pending_translation ?? []).includes('applies.notice'), `${code}: applies.notice is neither translated nor declared pending`);
  }
});

/* ============================================================
   TEST B · every source record against the authoritative contract

   The governance layer allowlists eight fields on data/sources.json and
   six of them exist on none of its 77 records; the validator checked
   that four values RESOLVE and never that a record had the other eight
   at all. tools/source-contract.mjs is the one contract, and these hold
   the data to it and the contract to the data.
   ============================================================ */

test('B1 · all 77 source records satisfy the contract, field by field', () => {
  const db = JSON.parse(readFileSync(join(ROOT, 'data', 'sources.json'), 'utf8'));
  assert.ok(db.sources.length >= 77, 'the record count should not shrink silently');
  const bad = db.sources.flatMap((r) => violations(r).map((v) => `${r.id}: ${v}`));
  assert.deepEqual(bad, []);
});

test('B2 · the contract is derived from the data, not asserted over it', () => {
  /* Every required field must actually be on every record, and every
     optional one on at least one. A "required" field no record has is
     a contract nobody is keeping; an "optional" field no record has is
     a field that does not exist. */
  const db = JSON.parse(readFileSync(join(ROOT, 'data', 'sources.json'), 'utf8'));
  for (const f of REQUIRED_FIELDS) {
    assert.ok(db.sources.every((r) => f in r), `${f} is required but is missing from some record`);
  }
  for (const f of OPTIONAL_FIELDS) {
    assert.ok(db.sources.some((r) => f in r), `${f} is in the contract but on no record — a field that does not exist`);
  }
  /* And nothing is on a record that the contract does not name. */
  const known = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);
  const strays = [...new Set(db.sources.flatMap((r) => Object.keys(r)))].filter((k) => !known.has(k));
  assert.deepEqual(strays, []);
});

test('B3 · the contract names 12 required and 3 optional fields, and says who writes and reads each', () => {
  assert.deepEqual(REQUIRED_FIELDS, ['id', 'tier', 'type', 'publisher', 'publisher_name', 'title',
    'url', 'url_status', 'published', 'accessed', 'language', 'note']);
  assert.deepEqual(OPTIONAL_FIELDS, ['resolution', 'resolution_note', 'reproduces']);
  /* A schema becomes a contract when it answers four questions about
     every field: what shape, why it exists, who writes it, who reads
     it. "a person" is a complete answer to the third; the first two
     are not answerable in three words. */
  for (const [name, spec] of Object.entries(SOURCE_FIELDS)) {
    assert.ok(typeof spec.why === 'string' && spec.why.length > 20,
      `${name}.why must be a reason, and a reason is a sentence`);
    for (const k of ['shape', 'written_by', 'read_by']) {
      assert.ok(typeof spec[k] === 'string' && spec[k].trim().length >= 6,
        `${name}.${k} must be answered`);
    }
  }
});

test('B4 · a missing required field is an error, not a silence', () => {
  const ok = { id: 'src-x', tier: 'tier:1', type: 'source-type:regulation', publisher: 'eu',
    publisher_name: 'EU', title: 'T', url: 'https://e.example/x', url_status: 'url:live',
    published: '2026-01-01', accessed: '2026-01-02', language: 'en', note: null };
  assert.deepEqual(violations(ok), []);
  for (const f of REQUIRED_FIELDS) {
    const rec = { ...ok };
    delete rec[f];
    const v = violations(rec);
    assert.ok(v.some((x) => x.includes(`missing required field \`${f}\``)), `dropping ${f} was not caught`);
  }
});

test('B5 · an invalid value is an error for each rule the contract states', () => {
  const base = { id: 'src-x', tier: 'tier:1', type: 'source-type:regulation', publisher: 'eu',
    publisher_name: 'EU', title: 'T', url: 'https://e.example/x', url_status: 'url:live',
    published: '2026-01-01', accessed: '2026-01-02', language: 'en', note: null };
  const cases = [
    [{ id: 'source-x' }, /not of the form src-/],
    [{ title: '  ' }, /non-empty string/],
    [{ url: 'ftp://e.example/x' }, /not an http\(s\) URL/],
    [{ url: null, url_status: 'url:none' }, /no `resolution`/],
    [{ url: null, url_status: 'url:live' }, /no url but `url_status`/],
    [{ url_status: 'url:none' }, /url:none but a url is present/],
    [{ url: null, url_status: 'url:none', resolution: 'because' }, /not one of url-not-located/],
    [{ accessed: '2026-01' }, /`accessed` is not YYYY-MM-DD/],
    [{ published: '01-2026' }, /`published` is not YYYY/],
    [{ language: 'english' }, /ISO 639-1/],
    [{ publisher_name: null }, /non-empty string/],
  ];
  for (const [patch, re] of cases) {
    const v = violations({ ...base, ...patch });
    assert.ok(v.some((x) => re.test(x)), `${JSON.stringify(patch)} produced ${JSON.stringify(v)}`);
  }
});

test('B6 · a field the contract does not name is refused, and the six phantom grant fields say why', () => {
  const base = { id: 'src-x', tier: 'tier:1', type: 'source-type:regulation', publisher: 'eu',
    publisher_name: 'EU', title: 'T', url: 'https://e.example/x', url_status: 'url:live',
    published: '2026-01-01', accessed: '2026-01-02', language: 'en', note: null };

  assert.ok(violations({ ...base, whatever: 1 }).some((v) => /not in the contract/.test(v)));

  /* The six the grant allowlists and the dataset does not have. Adding
     one is not a schema improvement: every one of them asserts that a
     document was FETCHED, and nothing here has ever fetched one. */
  assert.deepEqual(ABSENT_BY_DESIGN,
    ['last_retrieved', 'retrieved_at', 'checksum', 'content_hash', 'recheck_interval', 'freshness_window']);
  for (const f of ABSENT_BY_DESIGN) {
    const v = violations({ ...base, [f]: 'x' });
    assert.ok(v.some((x) => /retrieval bookkeeping this repository cannot honestly write/.test(x)),
      `${f} must be refused with the reason, not merely as an unknown key`);
  }
});

test('B7 · validate.mjs FAILS on a planted contract violation', () => {
  /* The contract is only a contract if the validator enforces it. */
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'sources.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    delete d.sources[0].accessed;
    d.sources[1].checksum = 'deadbeef';
    writeFileSync(p, JSON.stringify(d, null, 2));
    const r = runValidator('validate.mjs', [], dir);
    assert.equal(r.exit, 1);
    assert.match(r.out, /missing required field `accessed`/);
    assert.match(r.out, /retrieval bookkeeping/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('B9 · a data file that does not parse is REPORTED by name, not a crash', () => {
  /* Until 2026-09-26 the parse-error path called report() before the
     helper it uses was declared, so a malformed file ended in a
     ReferenceError stack trace that never named the file. */
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'claims.json');
    writeFileSync(p, readFileSync(p, 'utf8').replace('"claims": [', '"claims": [ {'));
    const r = runValidator('validate.mjs', [], dir);
    assert.equal(r.exit, 1);
    assert.match(r.out, /PARSE data[\\/]claims\.json/);
    assert.doesNotMatch(r.out, /ReferenceError/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('B10 · tier:1 is refused for anything that is not law or a judgment', () => {
  /* AUDIT-2026-09-25 T-31. The base record is a tier:1 regulation and
     passes; the same record as a press release, a court press release,
     guidance or a report does not. */
  const base = { id: 'src-x', tier: 'tier:1', type: 'source-type:regulation', publisher: 'eu',
    publisher_name: 'EU', title: 'T', url: 'https://e.example/x', url_status: 'url:live',
    published: '2026-01-01', accessed: '2026-01-02', language: 'en', note: null };
  assert.deepEqual(violations(base), []);
  for (const t of ['source-type:press-release', 'source-type:court-press-release', 'source-type:guidance', 'source-type:report']) {
    assert.ok(violations({ ...base, type: t }).some((x) => /is tier:1 but its type/.test(x)), `${t} at tier:1 was not refused`);
    assert.deepEqual(violations({ ...base, type: t, tier: 'tier:2' }), [], `${t} at tier:2 must pass`);
  }
});

test('B8 · the three URL-less records each record WHY, and the reasons are the closed set', () => {
  const db = JSON.parse(readFileSync(join(ROOT, 'data', 'sources.json'), 'utf8'));
  const noUrl = db.sources.filter((r) => r.url == null);
  assert.ok(noUrl.length > 0);
  for (const r of noUrl) {
    assert.ok(RESOLUTIONS.includes(r.resolution),
      `${r.id} has no url and no recorded reason — an admitted gap must say which of the three it is`);
  }
});

/* ============================================================
   The other two validators still gate on what they always did.
   ============================================================ */

test('G1 · validate.mjs and i18n-audit.mjs exit 0 on this tree, and design-qa holds its baseline', () => {
  assert.equal(runValidator('validate.mjs').exit, 0);
  assert.equal(runValidator('i18n-audit.mjs').exit, 0);
  const dq = runValidator('design-qa.mjs');
  assert.equal(dq.exit, 0);
  const recorded = readBaseline().checks['design-qa.mjs'].warnings;
  assert.match(dq.out, new RegExp(`0 errors, ${recorded} warnings`),
    `docs/CURRENT-ARCHITECTURE.md §12 records ${recorded} design-qa warning(s) — five until 27 Sep 2026, none since; a new one is a finding, not noise`);
});


/* ============================================================
   H · the evidence model (27 Sep 2026)

   tools/evidence-audit.mjs is a gate in .github/workflows/pages.yml, so
   each rule it enforces is planted here and must be caught. A copy of the
   real tree is used for the planted defects; the real tree is never
   written.
   ============================================================ */

/* named TREE, not ROOT, in this section: the word pair "root", colon, "ROOT" is the shape of a
   seeded default credential to the boundary scanner (.control-room
   selftest 16b), and the scanner is right to be that literal. */
const TREE = ROOT;

function treeCopy() {
  const dir = scratch('evidence');
  cpSync(join(ROOT, 'data'), join(dir, 'data'), { recursive: true });
  cpSync(join(ROOT, 'index.html'), join(dir, 'index.html'));
  return dir;
}
const editJSON = (dir, f, fn) => {
  const p = join(dir, 'data', f); const d = JSON.parse(readFileSync(p, 'utf8')); fn(d); writeFileSync(p, JSON.stringify(d));
};

/* ============================================================
   RECORD · an editorial audit that is recorded only when asked

   Roadmap v2 item 1.1. `--record` appends one record to the audited
   tree's git-ignored store; without it the tool writes nothing.
   ============================================================ */

const storeFile = (dir) => join(dir, 'tools', 'evidence-audit-runs', 'evidence-audit.jsonl');
const records = (dir) => readFileSync(storeFile(dir), 'utf8').trim().split('\n').map((l) => JSON.parse(l));

test('R1 · without --record the evidence audit writes nothing', () => {
  const dir = treeCopy();
  for (const extra of [[], ['--json'], ['--markdown'], ['--graph']]) {
    assert.equal(runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-24', ...extra]).exit, 0);
  }
  assert.ok(!existsSync(join(dir, 'tools')), 'a run without --record wrote into the audited tree');
});

test('R2 · --record appends one record answering what, on which evidence, as of when, at which commit, with which limits', () => {
  const dir = treeCopy();
  const r = runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-24', '--json', '--record']);
  assert.equal(r.exit, 0);
  assert.equal(JSON.parse(r.out.slice(0, r.out.lastIndexOf('}') + 1)).as_of, '2026-10-24', '--json stays parseable: the record notice goes to stderr');
  let [e] = records(dir);
  assert.equal(e.record_version, RECORD_VERSION);
  for (const q of QUESTIONS) assert.ok(e[q.key] !== null && e[q.key] !== undefined, `the record does not answer "${q.label}"`);
  assert.equal(e.as_of, '2026-10-24');
  assert.ok(Date.parse(e.recorded_at));
  assert.match(e.recorded_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'recorded_at is the instant written, a field apart from the reference date');
  assert.deepEqual(e.checked, CHECKED);
  assert.deepEqual(e.limits, LIMITS);
  assert.equal(e.command, 'node tools/evidence-audit.mjs --root ' + dir + ' --as-of 2026-10-24 --json --record');
  const claims = e.evidence.read.find((f) => f.path === 'data/claims.json');
  assert.equal(claims.sha256, createHash('sha256').update(readFileSync(join(dir, 'data', 'claims.json'))).digest('hex'));
  assert.ok(e.evidence.read.some((f) => f.path === 'index.html'));
  assert.ok(e.evidence.counts.claims > 100);
  /* A scratch copy is not a git checkout: the commit is not named, and
     the record says why rather than naming one it cannot know. */
  assert.equal(e.commit.sha, null);
  assert.equal(e.commit.tree_clean, null);
  assert.match(e.commit.why, /not a git checkout/);
  assert.deepEqual(e.findings.errors, []);

  runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-25', '--record']);
  assert.deepEqual(records(dir).map((x) => x.as_of), ['2026-10-24', '2026-10-25'], 'append-only, one line per run');
  /* The read side agrees with the writer. */
  const back = readRecords({ dir: join(dir, 'tools', 'evidence-audit-runs') });
  assert.equal(back.entries.length, 2);
  assert.deepEqual(back.malformed, []);
  [e] = back.entries;
  assert.equal(e.as_of, '2026-10-24');
});

test('R3 · in a git checkout the record names the commit, and says when the tree did not match it', () => {
  const dir = treeCopy();
  const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=suite', '-c', 'user.email=suite@example.invalid', 'commit', '-qm', 'scratch');
  /* The store itself is git-ignored in a real checkout; here it is
     ignored the same way, so recording does not dirty the tree. */
  writeFileSync(join(dir, '.gitignore'), 'tools/evidence-audit-runs/*\n.gitignore\n');
  const head = git('rev-parse', 'HEAD');
  runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-24', '--record']);
  let e = records(dir).at(-1);
  assert.equal(e.commit.sha, head);
  assert.equal(e.commit.tree_clean, true);
  editJSON(dir, 'glossary.json', (d) => { d.$note = `${d.$note ?? ''} (planted)`; });
  runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-24', '--record']);
  e = records(dir).at(-1);
  assert.equal(e.commit.tree_clean, false);
  assert.deepEqual(e.commit.uncommitted, ['data/glossary.json']);
});

test('H1 · the real tree has no evidence-audit error and every substantive passage is accounted for', () => {
  const r = audit({ root: TREE, asOf: '2026-09-27' });
  assert.deepEqual(r.errors, []);
  assert.equal(r.prose.unclassified, 0);
  assert.equal(r.prose.coverage_pct, 100);
  assert.ok(r.prose.total > 150, 'the passage walker must find the brief, not an empty page');
});

test('H2 · an unclassified passage, an unknown claim id and an unknown prose class are errors', () => {
  const dir = treeCopy();
  try {
    let h = readFileSync(join(dir, 'index.html'), 'utf8');
    h = h.replace(' data-prose="prose:signpost"', '');                 /* strip one classification */
    h = h.replace('data-claim="clm-art-114-shapes-everything"', 'data-claim="clm-does-not-exist"');
    h = h.replace('data-prose="prose:method"', 'data-prose="prose:vibes"');
    writeFileSync(join(dir, 'index.html'), h);
    const r = audit({ root: dir, asOf: '2026-09-27' });
    assert.ok(r.errors.some((e) => /neither registered nor classified/.test(e)));
    assert.ok(r.errors.some((e) => /clm-does-not-exist/.test(e)));
    assert.ok(r.errors.some((e) => /prose:vibes/.test(e)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('H3 · a derivation that does not re-run is an error, and so is a figure that does not read back out of its input', () => {
  const dir = treeCopy();
  try {
    editJSON(dir, 'claims.json', (d) => {
      const c = d.claims.find((x) => x.id === 'clm-dpc-share-of-fines');
      c.derivation.result = 0.61;
      c.derivation.inputs.a.as_stated = 'EUR 5 billion';
    });
    const r = audit({ root: dir, asOf: '2026-09-27' });
    const e = r.errors.filter((x) => x.startsWith('claims/clm-dpc-share-of-fines'));
    assert.ok(e.some((x) => /recorded result is 0.61/.test(x)));
    assert.ok(e.some((x) => /does not appear in clm-dpc-cumulative-fines/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('H4 · a stored derived field, a stored mechanical remediation code and an unnamed attribution are errors', () => {
  const dir = treeCopy();
  try {
    editJSON(dir, 'claims.json', (d) => {
      d.claims[0].evidence_status = 'evidence:direct';
      d.claims[1].remediation = ['remediation:missing-locator'];
      delete d.claims.find((x) => x.type === 'claim-type:attributed').attributed_to;
    });
    const r = audit({ root: dir, asOf: '2026-09-27' });
    assert.ok(r.errors.some((e) => /stores "evidence_status"/.test(e)));
    assert.ok(r.errors.some((e) => /remediation:missing-locator, which is computed/.test(e)));
    assert.ok(r.errors.some((e) => /must name whose view it is/.test(e)));
    assert.ok(DERIVED_FIELDS.includes('finality'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('H5 · a claim of law citing the legal text as direct support needs an article locator', () => {
  const dir = treeCopy();
  try {
    editJSON(dir, 'claims.json', (d) => {
      d.claims.find((x) => x.id === 'clm-one-stop-shop').sources[0].locator = null;
    });
    const r = audit({ root: dir, asOf: '2026-09-27' });
    assert.ok(r.errors.some((e) => /clm-one-stop-shop: a claim of law cites src-eurlex-gdpr/.test(e)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('H6 · a table row linked to a record must print that record\'s date and fine', () => {
  const dir = treeCopy();
  try {
    let h = readFileSync(join(dir, 'index.html'), 'utf8');
    h = h.replace('>28 May 2026<', '>29 May 2026<').replace('Temu fined EUR 200 million', 'Temu fined EUR 250 million');
    writeFileSync(join(dir, 'index.html'), h);
    const r = audit({ root: dir, asOf: '2026-09-27' });
    assert.ok(r.errors.some((e) => /dated 2026-05-29/.test(e)), 'the date column');
    assert.ok(r.errors.some((e) => /EUR 250 million/.test(e)), 'the fine');
    assert.deepEqual(datesIn('Nov 2026 and 2 Aug 2028').map((d) => d.iso), ['2026-11', '2028-08-02']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('H7 · contradictions: an enforcement record and a legislative status that cannot both be true', () => {
  assert.deepEqual(contradictions({ action_status: 'action:final', appeal: { status: 'appeal:unknown' } }).length, 1);
  assert.ok(contradictions({ action_status: 'action:annulled', payment_status: 'payment:paid' }).length >= 1);
  assert.ok(contradictions({ action_status: 'action:announced', fine_eur: 1e6 }).length >= 1);
  assert.equal(procedure({ action_status: 'action:annulled', judicial: { remitted: true } }).finality, 'finality:not-final');
  assert.equal(procedure({ action_status: 'action:imposed', appeal: { status: 'appeal:unknown' } }).finality, 'finality:unknown', 'unknown finality is its own state');
  const ix = { event: new Map([['e1', { id: 'e1', date: '2030-01-01', event_type: 'event:application', provisions: [] }]]) };
  assert.ok(statusContradictions({ legislative_status: 'status:applicable', milestones: ['e1'], kind: 'kind:regulation' }, ix, '2026-09-27').length >= 1);
  assert.equal(provisionApplication('x:art-1', { milestones: ['e1'] }, ix, '2026-09-27').state, 'general-scheduled');
});

test('H8 · the evidence model: status, locators, composite statements, freshness', () => {
  const ix = { source: new Map([['s1', { id: 's1', tier: 'tier:1' }]]), claim: new Map() };
  assert.equal(EM.evidenceStatus({ type: 'claim-type:fact', sources: [{ source_id: 'src-brief-original', supports: 'supports:direct' }] }), 'evidence:unverified');
  assert.equal(EM.evidenceStatus({ type: 'claim-type:fact', sources: [{ source_id: 's1', supports: 'supports:context' }] }), 'evidence:context-only');
  assert.equal(EM.evidenceStatus({ type: 'claim-type:fact', contested: { note: 'x' }, sources: [] }), 'evidence:disputed');
  assert.equal(EM.owesVerification({ type: 'claim-type:critique' }), false, 'an argument does not owe verification — it is not "unverified"');
  assert.equal(EM.locatorQuality('Arts. 56, 60, 65'), 'structural');
  assert.equal(EM.locatorQuality('Part II'), 'generic');
  assert.equal(EM.locatorQuality(null), 'none');
  assert.ok(EM.compositeSignals('The DPC accounts for about EUR 4.04 billion — roughly 57% of the total — and nine of the ten largest fines.').flagged);
  assert.equal(EM.compositeSignals('The VLOP threshold is 45 million users.').flagged, false);
  assert.equal(EM.freshnessState('2026-09-01', 'risk:critical', '2026-09-27'), 'freshness:review-due');
  assert.equal(EM.freshnessState(null, 'risk:low', '2026-09-27'), 'freshness:stale');
  assert.ok(EM.checkDerivation({ type: 'claim-type:derived', derivation: { performed_by: 'site', method: 'm', inputs: {}, formula: 'alert(1)', result: 1, rounding: { to: 1, stated_value: 1 } } }, ix).problems.length > 0,
    'a formula is arithmetic or it is refused — nothing is evaluated');
  assert.equal(EM.parseQuantity('twenty-three'), 23, 'the brief writes counts as words');
  assert.equal(EM.parseQuantity('nineteen'), 19);
  assert.equal(EM.parseQuantity('EUR 4.04 billion'), 4.04e9);
  assert.equal(EM.parseQuantity('twenty-zero'), null, 'a malformed word is not read as a number');
  assert.equal(EM.parseQuantity('several'), null);
});

test('I1 · the CSP hashes every inline script, and an edited script is caught before a browser refuses it', () => {
  for (const f of ['applies.html', 'bibliography.html']) {
    const html = readFileSync(join(ROOT, f), 'utf8');
    assert.deepEqual(cspProblems(html), [], f);
    assert.ok(inlineScripts(html).length >= 1);
  }
  /* The brief carried one inline script, the __CONTENT__ blob, until 30 Sep
     2026. With it gone the page needs no hash at all: script-src 'self'. */
  const brief = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.deepEqual(cspProblems(brief), []);
  assert.equal(inlineScripts(brief).length, 0);
  assert.match(securityMeta(brief), /script-src 'self';/);
  const html = readFileSync(join(ROOT, 'applies.html'), 'utf8');
  assert.ok(cspProblems(html.replace("var K='eupolicy:theme'", "var K='eupolicy:themes'")).some((p) => /not hashed/.test(p)));
  assert.ok(cspProblems(html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")).some((p) => /unsafe-inline/.test(p)));
  assert.ok(!/'unsafe-eval'|script-src[^;]*'unsafe-inline'/.test(securityMeta(html)));
});

test('I1b · no inline styles: the policy refuses them, and a page or module that writes one is caught', () => {
  /* style-src 'self' since 27 Sep 2026. A style attribute the browser
     refuses is a silent visual defect, so the check has to be static. */
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.match(securityMeta(html), /style-src 'self';/);
  assert.doesNotMatch(securityMeta(html), /style-src[^;]*'unsafe-inline'/);
  assert.ok(cspProblems(html.replace('<body', '<body style="color:red"')).some((p) => /style attribute/.test(p)));
  assert.ok(cspProblems(html.replace('</head>', '<style>p{}</style></head>')).some((p) => /<style> element/.test(p)));
  assert.ok(cspProblems(html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")).some((p) => /unsafe-inline/.test(p)));
  for (const f of [...readdirSync(join(ROOT, 'js')).filter((x) => x.endsWith('.js')).map((x) => 'js/' + x), 'app.js']) {
    const code = readFileSync(join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\sstyle\s*=\s*\\?["']/, `${f} writes a style attribute`);
  }
});

test('I1c · the Evidence page and the build count the same backlog', () => {
  /* One home for the rule: js/evidence-model.js openBacklog(). The page
     calls it in the browser; validate.mjs prints it. If either grew its
     own copy, these would drift apart and a reader would see a number
     CI does not. */
  const db = {};
  for (const n of ['claims', 'sources', 'timeline', 'enforcement', 'instruments', 'institutions', 'glossary', 'applicability']) {
    db[n] = JSON.parse(readFileSync(join(ROOT, 'data', n + '.json'), 'utf8'));
  }
  const printed = Number((runValidator('validate.mjs').out.match(/UNVERIFIED \/ REQUIRES VERIFICATION\s+(\d+)/) ?? [])[1]);
  assert.equal(openBacklog(db).length, printed);
  const page = readFileSync(join(ROOT, 'js', 'bibliography.js'), 'utf8');
  assert.match(page, /openBacklog\(db\)/, 'the page counts through the shared function');
  assert.doesNotMatch(readFileSync(join(ROOT, 'tools', 'validate.mjs'), 'utf8'), /function unverifiedReport\(\)\s*\{/, 'validate.mjs keeps no copy of its own');
});

test('I1d · languages: no alternate is advertised for a translation no person has reviewed', () => {
  /* Until 27 Sep 2026 this asserted the opposite: hreflang alternates at
     ?lang=it|fr|es, in the sitemap too. docs/SEO-AUDIT-2026-09-27.md A5
     measured why that was wrong — the raw HTML at every ?lang= address is
     English and names the English page as canonical, so the alternates were
     not self-canonical and contradicted the HTML they pointed at — and the
     translations are unreviewed (README limitation 5). The rule now: no
     alternate until a pre-rendered, reviewed page exists; the address keeps
     working for readers. docs/SEO-OPERATIONS.md §6.
     22 Oct 2026: the pre-rendered pages exist (/it/, /fr/, /es/), so the rule
     is now the review: on this tree no edition is reviewed and no page names
     an alternate; A8 holds the reviewed case. */
  for (const f of sitePages(ROOT)) {
    assert.doesNotMatch(readFileSync(join(ROOT, f), 'utf8'), /<link [^>]*hreflang=/, `${f} advertises an alternate language`);
  }
  assert.doesNotMatch(readFileSync(join(ROOT, 'sitemap.xml'), 'utf8'), /\?lang=/, 'a ?lang= address is in the sitemap');
  const app = readFileSync(join(ROOT, 'app.js'), 'utf8');
  const i18n = app.slice(app.indexOf('/* ================= i18n: one page per language'));
  assert.ok(i18n.length > 1000, 'the language block was found');
  assert.match(i18n, /searchParams\.get\('lang'\)/, 'an old ?lang= address still works: it forwards to the edition');
  assert.match(i18n, /location\.replace\(/, 'by replacing, so Back does not loop');
  assert.doesNotMatch(i18n, /canonical/, 'no head metadata is rewritten after load');
  assert.doesNotMatch(i18n, /\.innerHTML = map\[|el\.innerHTML = v/, 'and no translation is swapped in place: each language is its own page');
});

test('I2 · the Pages artifact is the website and nothing else', () => {
  const out = scratch('site');
  try {
    const r = buildArtifact(out);
    assert.deepEqual(r.problems, []);
    const top = readdirSync(out);
    for (const never of ['.control-room', 'agent', 'docs', 'tools', '.agents', '.github', 'README.md', 'AGENTS.md']) {
      assert.ok(!top.includes(never), `${never} must not be published`);
    }
    for (const must of ['index.html', 'js', 'data', 'css', 'fonts', 'i18n', 'sitemap.xml']) assert.ok(top.includes(must), must);
    assert.ok(refusal('.control-room/server.mjs'));
    assert.ok(refusal('agent/health/model.mjs'));
    assert.ok(refusal('js/.secret'));
    assert.equal(refusal('js/app.js'), null);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

/* ============================================================
   S · the route model, the generator and tools/seo-audit.mjs (27 Sep 2026)

   docs/SEO-AUDIT-2026-09-27.md. The audit reads files the way a crawler
   does; these tests plant each defect it exists to catch in a scratch copy
   of the site and assert it is caught, so a check that silently stopped
   checking would fail here rather than pass forever.
   ============================================================ */

import { audit as seoAudit, auditAll as seoAuditAll } from './seo-audit.mjs';
import { generate as generateSite, stale as staleSite, BASE } from './_footer.mjs';
import * as ROUTES from '../js/routes.js';
import { index as buildIndex } from '../js/data.js';

function siteCopy(name) {
  const dir = scratch(name);
  for (const f of readdirSync(ROOT).filter((x) => x.endsWith('.html'))) cpSync(join(ROOT, f), join(dir, f));
  for (const f of ['sitemap.xml', 'robots.txt', 'app.js', 'style.css']) cpSync(join(ROOT, f), join(dir, f));
  for (const d of ['data', 'i18n', 'js', 'img', 'instruments', 'css']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  /* the language editions (22 Oct 2026) */
  for (const d of readdirSync(ROOT).filter((x) => /^[a-z]{2}$/.test(x))) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  return dir;
}
const edit = (dir, f, fn) => writeFileSync(join(dir, f), fn(readFileSync(join(dir, f), 'utf8')));

test('S1 · this tree: every generated file current, and the SEO audit clean', async () => {
  assert.deepEqual(await staleSite(ROOT), [], 'run node tools/_footer.mjs');
  const r = await seoAuditAll(ROOT);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('S2 · the generator is deterministic and writes nothing that reads the clock', async () => {
  const a = await generateSite(ROOT);
  const b = await generateSite(ROOT);
  assert.deepEqual([...a.files.entries()], [...b.files.entries()]);
  const pages = [...a.files.keys()].filter((f) => f.startsWith('instruments/'));
  assert.ok(pages.length >= 1);
  for (const f of pages) {
    const html = a.files.get(f);
    for (const clockBound of ['days ago', 'review recommended', 'Next date', 'Applies since', 'ip-enf-pipe']) {
      assert.ok(!html.includes(clockBound), `${f} carries "${clockBound}", which depends on the reader's clock`);
    }
  }
});

test('S3 · the gate is derived from the record, and every page it admits meets all seven criteria', () => {
  const db = {};
  for (const n of ['taxonomy', 'instruments', 'institutions', 'sources', 'claims', 'timeline', 'enforcement', 'applicability', 'glossary']) {
    db[n] = JSON.parse(readFileSync(join(ROOT, 'data', n + '.json'), 'utf8'));
  }
  const ix = buildIndex(db);
  for (const inst of ROUTES.entityInstruments(ix)) {
    assert.ok(ROUTES.gateReport(inst, ix).every((g) => g.met), inst.id);
    assert.equal(ROUTES.instrumentHref(inst, ix, '../../'), `../../instruments/${inst.id}/`);
  }
  const thin = ix.instrument.get('eprivacy');
  assert.equal(ROUTES.hasEntityPage(thin, ix), false);
  assert.equal(ROUTES.instrumentHref(thin, ix, ''), 'instrument.html?id=eprivacy');
  /* a record that loses its objective loses its page */
  const gdpr = { ...ix.instrument.get('gdpr'), dna: { ...ix.instrument.get('gdpr').dna, objective: '' } };
  assert.equal(ROUTES.hasEntityPage(gdpr, ix), false);
  /* a common name is used only while an alias backs it */
  assert.equal(ROUTES.knownAs({ id: 'dsa', aliases: ['digital-services-act'] }), 'Digital Services Act');
  assert.equal(ROUTES.knownAs({ id: 'dsa', aliases: [] }), null);
});

test('S4b · the author, the licence, the Article and the FAQ are held to what the page shows', () => {
  const dir = siteCopy('seo-ld');
  try {
    /* an FAQ answer the box no longer says, and a licence link that lost rel="license" */
    edit(dir, 'instruments/dma/index.html', (s) => s.replace('Who it binds:</strong> Gatekeeper', 'Who it binds:</strong> Nobody')
      .replace('<a rel="license" href=', '<a href='));
    /* another licence, a date that is not a date, a headline that is not the <h1> */
    edit(dir, 'instruments/gdpr/index.html', (s) => s.replace('"license":"https://creativecommons.org/licenses/by/4.0/"', '"license":"https://example.org/all-rights-reserved"')
      .replace('"datePublished":"2026-09-27"', '"datePublished":"27 Sep 2026"')
      .replace(/"headline":"[^"]*"/, '"headline":"Something else"'));
    /* an FAQ entry that is not in the route model */
    edit(dir, 'instruments/dsa/index.html', (s) => s.replace('"mainEntity":[', '"mainEntity":[{"@type":"Question","name":"Is it good?","acceptedAnswer":{"@type":"Answer","text":"Yes."}},'));
    /* an author the page does not name */
    edit(dir, 'applies.html', (s) => s.replace(/<body[\s\S]*$/, (b) => b.replaceAll('Andrea Tosti', 'the author')));
    const errs = seoAudit(dir).errors.join('\n');
    assert.match(errs, /instruments\/dma\/index\.html: FAQ answer "Who it binds: Gatekeeper" is not on the page/);
    assert.match(errs, /instruments\/dma\/index\.html: JSON-LD names a licence the page does not link with rel="license"/);
    assert.match(errs, /instruments\/gdpr\/index\.html: JSON-LD license https:\/\/example\.org\/all-rights-reserved is not the declared licence/);
    assert.match(errs, /instruments\/gdpr\/index\.html: JSON-LD datePublished "27 Sep 2026" is not a YYYY-MM-DD date/);
    assert.match(errs, /instruments\/gdpr\/index\.html: Article headline "Something else" is not the page's <h1>/);
    assert.match(errs, /instruments\/dsa\/index\.html: the FAQ in the structured data is not the route model's/);
    assert.match(errs, /applies\.html: JSON-LD names Andrea Tosti as author and the page does not/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('S4c · robots.txt names the sitemap and blocks no indexable route', () => {
  const dir = siteCopy('seo-robots');
  try {
    edit(dir, 'robots.txt', (s) => s.replace(/Sitemap: .*/, 'Sitemap: https://example.org/sitemap.xml').replace('Disallow: /tools/', 'Disallow: /tools/\nDisallow: /instruments/'));
    const errs = seoAudit(dir).errors.join('\n');
    assert.match(errs, /robots\.txt: does not name .*sitemap\.xml/);
    assert.match(errs, /robots\.txt: Disallow: \/instruments\/ blocks the indexable route .*instruments\/gdpr\//);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('S4 · planted defects are caught: title, canonical, hreflang, orphan, structured data, sitemap', () => {
  const dir = siteCopy('seo');
  try {
    edit(dir, 'instruments/dsa/index.html', (s) => s.replace(/<title>[^<]*<\/title>/, '<title>Instrument</title>'));
    edit(dir, 'instruments/dma/index.html', (s) => s.replace('rel="canonical"', 'rel="canonical-x"')
      .replace('<meta charset="utf-8"/>', `<meta charset="utf-8"/>\n<link href="${BASE}instruments/gdpr/" rel="canonical"/>`));
    edit(dir, 'index.html', (s) => s.replace('</head>', `<link href="${BASE}?lang=it" hreflang="it" rel="alternate"/>\n</head>`));
    /* the CER page loses every static link that leads to it */
    for (const f of sitePages(dir)) edit(dir, f, (s) => s.replace(/<a href="[^"]*instruments\/cer\/">[^<]*<\/a>/g, '').replace(/<a href="[^"]*instruments\/cer\/"/g, '<a href="#"'));
    edit(dir, 'instruments/cra/index.html', (s) => s.replace('"@type":"Legislation"', '"@type":"Legislation","author":"someone","publisher":"someone"'));
    edit(dir, 'enforcement.html', (s) => s.replace(/<li id="enf-[^"]+">[\s\S]*?<\/li>\n/, ''));
    edit(dir, 'sitemap.xml', (s) => s.replace('</urlset>', `  <url><loc>${BASE}instrument.html?id=eprivacy</loc></url>\n</urlset>`));
    const errs = seoAudit(dir).errors.join('\n');
    assert.match(errs, /instruments\/dsa\/index\.html: <title> is not the route model's/);
    assert.match(errs, /instruments\/dsa\/index\.html: generic title/);
    assert.match(errs, /claimed by .*instruments\/dma\/index\.html/);
    assert.match(errs, /hreflang it .* not an indexable, self-canonical page/);
    assert.match(errs, /instruments\/cer\/index\.html: not reachable from the home page/);
    assert.match(errs, /JSON-LD asserts "publisher"/);
    assert.match(errs, /instruments\/cra\/index\.html: JSON-LD author is not the declared author/);
    assert.match(errs, /enforcement\.html: the static record index omits 1 record/);
    assert.match(errs, /instrument\.html\?id=eprivacy is not the canonical URL of any indexable route/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('S5 · a data change the pages were not regenerated for is caught as stale', async () => {
  const dir = siteCopy('stale');
  try {
    edit(dir, 'data/instruments.json', (s) => s.replace('"short_name": "DORA"', '"short_name": "DORA Regulation"'));
    const problems = await staleSite(dir);
    assert.ok(problems.some((p) => /instruments\/dora\/index\.html is stale/.test(p)), problems.join('\n'));
    assert.ok(problems.some((p) => /instruments\.html is stale/.test(p)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('S6 · a link the reader follows is not a request the page makes; a preconnect still is', () => {
  const origins = new Set(['https://andreatosti2001.github.io']);
  assert.deepEqual(scanHtml('<p><a class="ext" href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">GDPR</a></p>', 'p.html', origins), []);
  assert.equal(scanHtml('<link rel="preconnect" href="https://fonts.googleapis.com">', 'p.html', origins).length, 1);
  assert.equal(scanHtml('<a href="x.html"><img src="https://tracker.example/p.gif" alt=""></a>', 'p.html', origins).length, 1);
});

/* ============================================================
   C · the text a page shows has one home: its markup

   index.html carried its prose twice until 30 Sep 2026 — the markup, and
   window.__CONTENT__, a 67 KB inline object app.js read its contents,
   pagers and search index from. Nothing generated it and nothing compared
   the two; it lost Annex C and ~9 KB of the current prose, and search
   quoted text the brief no longer said. It was deleted rather than
   synchronised, and tools/prose-homes.mjs keeps it deleted. These plant
   each shape a second copy could come back in, and each shape that is NOT
   one, because a check that passes on a clean tree proves only that it did
   not fire.
   ============================================================ */

/** A paragraph written in index.html's markup — a long one carrying
 *  non-ASCII (a dash, a curly quote), so that an escaped copy is a real
 *  test rather than a vacuous one. */
function sampleBlock(html) {
  const block = textBlocks(html).find((t) => /[^\x00-\x7f]/.test(t) && t.split(' ').length > 20);
  assert.ok(block, 'index.html has a long paragraph with non-ASCII text to copy');
  return block;
}

/** The page with a planted <script> holding a copy of that paragraph. */
function plantedIndex(dir, script) {
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const block = sampleBlock(html);
  writeFileSync(join(dir, 'index.html'), html.replace('<script src="app.js">', `${script(block)}\n<script src="app.js">`));
  return block;
}

test('C1 · this tree: no script holds a page\'s own text, and the brief carries no inline script at all', () => {
  assert.deepEqual(proseCopies(ROOT), []);
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.equal(scriptBodies(html).length, 0, 'index.html needs no inline script: app.js reads the Parts from the markup');
  assert.doesNotMatch(html, /__CONTENT__/);
  assert.ok(textBlocks(html).length > 150, 'the brief\'s own text was read — a check over nothing passes trivially');
  const app = codeOf(readFileSync(join(ROOT, 'app.js'), 'utf8'));
  assert.doesNotMatch(app, /window\.__CONTENT__/, 'app.js reads no content global');
  assert.match(app, /querySelector\('\.part-body'\)/, 'app.js reads the prose out of the page it is loaded into');
});

test('C2 · a second copy is caught whatever it is called and wherever it is put', () => {
  const shapes = {
    'the old blob, by its old name': (t) => `<script>window.__CONTENT__ = ${JSON.stringify({ search: [{ id: 'part-2', text: t }] })};</script>`,
    'the same blob, renamed': (t) => `<script>window.__BRIEF__ = ${JSON.stringify({ parts: [{ text: t }] })};</script>`,
    'a JSON data block nothing executes': (t) => `<script type="application/json" id="brief-data">${JSON.stringify([t])}</script>`,
    'JSON with every non-ASCII character escaped': (t) => `<script>var B=${JSON.stringify(t).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))};</script>`,
  };
  for (const [name, script] of Object.entries(shapes)) {
    const dir = siteCopy('prose-homes');
    try {
      const block = plantedIndex(dir, script);
      const hits = proseCopies(dir);
      assert.ok(hits.some((h) => h.file === 'index.html' && h.text === block), `${name}: not caught`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }

  /* and in a module rather than the page — a string table in js/ */
  const dir = siteCopy('prose-homes');
  try {
    const block = sampleBlock(readFileSync(join(dir, 'index.html'), 'utf8'));
    writeFileSync(join(dir, 'js', 'brief-text.js'), `// the Parts, for search\nexport const PARTS = [${JSON.stringify(block)}];\n`);
    assert.ok(proseCopies(dir).some((h) => h.file === 'js/brief-text.js' && h.text === block), 'a module string table was not caught');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('C3 · what is NOT a second home is not reported: comments, JSON-LD, generated regions, labels', () => {
  const dir = siteCopy('prose-homes');
  try {
    const block = sampleBlock(readFileSync(join(dir, 'index.html'), 'utf8'));
    /* a module comment quoting the prose it works on — js/pyramid.js does */
    writeFileSync(join(dir, 'js', 'quoting.js'), `/* The prose beside it says "${block}" */\nexport const x = 1;\n// ${block}\n`);
    /* a JSON-LD block is a description for a crawler, generated from tools/seo.mjs */
    edit(dir, 'index.html', (s) => s.replace('</head>', `<script type="application/ld+json">${JSON.stringify({ description: block })}</script>\n</head>`));
    /* a region tools/_footer.mjs generates is derived output, not a source */
    edit(dir, 'index.html', (s) => s.replace('<!-- site-index:begin — generated by tools/_footer.mjs, do not edit in place -->',
      `<!-- site-index:begin — generated by tools/_footer.mjs, do not edit in place -->\n<p>${block.split(' ').slice(0, 12).join(' ')} and more generated words here</p>`));
    /* interface vocabulary shorter than MIN_WORDS */
    writeFileSync(join(dir, 'js', 'labels.js'), `export const L = ['Contents', 'Keyboard shortcuts', 'Previous'];\n`);
    assert.deepEqual(proseCopies(dir), []);
    assert.equal(MIN_WORDS, 6, 'the threshold was not quietly raised');
    /* a `//` inside a string is not a comment: stripping from it would hide a one-line blob */
    assert.match(codeOf(`var b = {"u":"https://eur-lex.europa.eu/x","t":"${block}"};`), /eur-lex/);
    assert.ok(codeOf(`var b = {"u":"https://eur-lex.europa.eu/x","t":"${block}"};`).includes(block));
    assert.equal(unescapeJs('a \\u2014 b \\u{2019}'), 'a \u2014 b \u2019', 'an escaped dash is read as the dash');
    assert.equal(unescapeJs('\\u2014abc'), '\u2014abc', 'a bare escape is exactly four hex digits');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('C4 · design-qa.mjs FAILS on a planted copy of the prose, and validate.mjs on a brief.json that regrows its text', () => {
  const dir = siteCopy('prose-homes');
  try {
    cpSync(join(ROOT, 'tools'), join(dir, 'tools'), { recursive: true });
    for (const d of ['fonts']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    const clean = execFileSync(process.execPath, [join(dir, 'tools', 'design-qa.mjs')], { cwd: dir, encoding: 'utf8' });
    assert.match(clean, /0 errors/, 'the copied tree must start clean');
    plantedIndex(dir, (t) => `<script type="application/json">${JSON.stringify({ text: t })}</script>`);
    let out = ''; let exit = 0;
    try { execFileSync(process.execPath, [join(dir, 'tools', 'design-qa.mjs')], { cwd: dir, encoding: 'utf8' }); }
    catch (e) { exit = e.status; out = `${e.stdout ?? ''}`; }
    assert.equal(exit, 1);
    assert.match(out, /index\.html: holds a copy of text written in index\.html/);
  } finally { rmSync(dir, { recursive: true, force: true }); }

  const data = dataScratch();
  try {
    edit(data, 'data/brief.json', (s) => s.replace('"parts": [', '"meta": { "standfirst": "Six regulations, one directive family and a live reform package now govern" },\n "parts": ['));
    const r = runValidator('validate.mjs', [], data);
    assert.equal(r.exit, 1);
    assert.match(r.out, /brief\.json carries "meta"/);
  } finally { rmSync(data, { recursive: true, force: true }); }
});

/* ============================================================
   O · the October 2026 evidence update (audit reference date 14 Oct 2026)

   Each test below holds one correction to what the record now says, read
   that day from the source named in the record. O1 plants the shapes that
   produced the errors, so that the check is shown to fire rather than
   merely to stay quiet on this tree.
   ============================================================ */

const OCT = '2026-10-14';
const readData = (f) => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
const octIndex = () => {
  const events = readData('timeline.json').events;
  const instruments = readData('instruments.json').instruments;
  return { ix: { event: new Map(events.map((e) => [e.id, e])) }, inst: (id) => instruments.find((i) => i.id === id), events };
};

test('O1 · a tranche posing as the general date, and a proposal counted as law, are both caught', () => {
  const ix = { event: new Map([
    ['g1', { id: 'g1', date: '2026-06-11', event_type: 'event:application', provisions: [] }],
    ['g2', { id: 'g2', date: '2027-12-11', event_type: 'event:application', provisions: [] }],
  ]) };
  const cra = { kind: 'kind:regulation', legislative_status: 'status:partly-applicable', milestones: ['g1', 'g2'] };
  assert.ok(statusContradictions(cra, ix, OCT).some((m) => /application dates name no provision/.test(m)), 'two untagged application dates');
  assert.equal(provisionApplication('x:art-13', cra, ix, OCT).date, '2026-06-11', 'and this is the misdating it causes');
  assert.ok(statusContradictions({ kind: 'kind:proposal', legislative_status: 'status:in-force', milestones: [] }, ix, OCT)
    .some((m) => /counts it as law/.test(m)), 'a proposal carrying "in force"');
  // the CRA as it stood before 14 Oct 2026: the audit must fail it
  const dir = treeCopy();
  try {
    editJSON(dir, 'timeline.json', (d) => { d.events.find((e) => e.id === 'tl-cra-2026-06-11-application').provisions = []; });
    const r = audit({ root: dir, asOf: OCT });
    assert.ok(r.errors.some((e) => /instruments\/cra: 2 application dates name no provision/.test(e)), r.errors.join('\n'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('O2 · CRA and Data Act provisions take the date Art. 71(2) and Art. 50 give them', () => {
  const { ix, inst } = octIndex();
  const at = (p, i) => provisionApplication(p, inst(i), ix, OCT);
  assert.deepEqual([at('cra:art-13', 'cra').state, at('cra:art-13', 'cra').date], ['general-scheduled', '2027-12-11'], 'manufacturers: 11 Dec 2027');
  assert.deepEqual([at('cra:art-14', 'cra').state, at('cra:art-14', 'cra').date], ['applies', '2026-09-11'], 'Art. 14 reporting: 11 Sep 2026');
  assert.equal(at('cra:art-24', 'cra').date, '2027-12-11', 'open-source stewards: with the general date, not with Art. 14');
  assert.equal(at('cra:chapter-iv', 'cra').date, '2026-06-11');
  assert.deepEqual([at('data-act:art-8', 'data-act').state, at('data-act:art-8', 'data-act').date], ['applies', '2025-09-12']);
});

test('O3 · AI Act after Regulation (EU) 2026/1744: Article 50 applies now; 2 December 2026 is a transition, not its application', () => {
  const { ix, inst, events } = octIndex();
  const ev = (id) => events.find((e) => e.id === id);
  assert.equal(ev('tl-ai-omnibus-2026-07-27-entry-into-force').date, '2026-07-27');
  assert.equal(ev('tl-ai-act-2026-12-02-application').date, '2026-12-02', 'new Art. 5(1)(ba)-(bb) prohibitions');
  assert.equal(ev('tl-ai-act-2027-12-02-application').date, '2027-12-02', 'Annex III');
  assert.equal(ev('tl-ai-act-2028-08-02-application').date, '2028-08-02', 'Annex I');
  const t = ev('tl-ai-act-2026-12-02-transition-end');
  assert.equal(t.event_type, 'event:compliance-deadline', 'the Art. 50(2) date for legacy systems is a deadline, not an application date');
  const a50 = provisionApplication('ai-act:art-50', inst('ai-act'), ix, OCT);
  assert.deepEqual([a50.state, a50.date], ['applies', '2026-08-02'], 'Article 50 as a whole is not postponed');
  const a6 = provisionApplication('ai-act:art-6', inst('ai-act'), ix, OCT);
  assert.deepEqual([a6.state, a6.date, a6.later.map((e) => e.date)], ['scheduled', '2027-12-02', ['2028-08-02']]);
});

test('O4 · the Data Omnibus is a proposal: no binding date, and the October Coreper outcome graded as the press report it rests on', () => {
  const { inst, events } = octIndex();
  const om = inst('data-omnibus');
  assert.equal(om.kind, 'kind:proposal');
  assert.ok(['status:proposal', 'status:stalled', 'status:council-position', 'status:parliament-position', 'status:trilogue'].includes(om.legislative_status));
  assert.ok(om.status_as_of >= OCT, 'status re-read at the reference date');
  assert.equal(events.filter((e) => e.instrument === 'data-omnibus' && /entry-into-force|application|compliance/.test(e.event_type)).length, 0,
    'no proposed GDPR, ePrivacy or Data Act change is dated as an obligation');
  const claims = readData('claims.json').claims;
  const sources = new Map(readData('sources.json').sources.map((s) => [s.id, s]));
  const c = claims.find((x) => x.id === 'clm-data-omnibus-council-october');
  assert.match(c.statement, /11 October 2026/);
  assert.deepEqual(c.sources.map((s) => sources.get(s.source_id).tier), ['tier:4'], 'a press report, and recorded as one');
  assert.doesNotMatch(claims.find((x) => x.id === 'clm-data-omnibus-stalled').statement, /As of 25 September/, 'the superseded state is not repeated');
  /* the chip said "no Council mandate" until Coreper agreed one on 21 Oct 2026 (AUDIT-2026-10-28 F-1, P1 below) */
  assert.match(readFileSync(join(ROOT, 'index.html'), 'utf8'), /data-i18n="part-8\.span3">Data Omnibus: proposal, Council mandate agreed</);
});

test('O5 · DSA: a preliminary finding carries no fine, and an accepted action plan does not undo an infringement decision', () => {
  const enf = new Map(readData('enforcement.json').enforcement.map((r) => [r.id, r]));
  for (const id of ['enf-meta-ec-2026-addictive', 'enf-tiktok-ec-2026-minors', 'enf-tiktok-ec-2026-addictive']) {
    const r = enf.get(id);
    assert.equal(r.fine_eur, null, id);
    assert.equal(procedure(r).stage, 'procedure:preliminary-finding', id);
  }
  assert.equal(enf.get('enf-tiktok-ec-2026-minors').opened, enf.get('enf-tiktok-ec-2026-addictive').opened, 'one proceeding, two sets of findings');
  const x = enf.get('enf-x-ec-2025');
  assert.equal(x.fine_eur, 120000000);
  assert.equal(x.action_status, 'action:imposed');
  assert.equal(x.appeal.status, 'appeal:pending');
  assert.ok(x.sources.includes('src-ec-x-action-plan-2026'));
  assert.equal(x.behavioural_outcome, 'unknown', 'a plan accepted is not behaviour changed');
  assert.equal(enf.get('enf-aliexpress-ec-2026').fine_eur, 550000000);
});

test('O6 · eIDAS: the wallet date binds Member States; the 2027 acceptance duty is qualified, not universal', () => {
  const { events } = octIndex();
  const w = events.find((e) => e.id === 'tl-eidas2-2026-12-24-compliance-deadline');
  assert.deepEqual([w.date, w.affected_actors], ['2026-12-24', ['actor:member-state']]);
  const p = events.find((e) => e.id === 'tl-eidas2-2027-12-24-compliance-deadline');
  assert.equal(p.date, '2027-12-24');
  assert.match(p.obligation, /strong user authentication/);
  assert.match(p.obligation, /voluntary request/);
  assert.match(p.obligation, /Microenterprises and small enterprises are excluded/);
});

test('O7 · counts and totals say whose count, as at when', () => {
  const claims = new Map(readData('claims.json').claims.map((c) => [c.id, c]));
  assert.match(claims.get('clm-gdpr-total-fines').statement, /DLA Piper.*10 January 2026/, 'the GDPR total names its tracker and cut-off');
  assert.match(claims.get('clm-alliance-risk-contested-share').statement, /CMS Enforcement Tracker/, 'and the 40% names its base');
  assert.match(claims.get('clm-seven-gatekeepers').statement, /^As at 14 October 2026 .*23 core platform services/);
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /data-i18n="part-2\.span2">€7\.1bn reported to Jan 2026 \(DLA Piper\)</);
  assert.doesNotMatch(html, />€7\.1bn total fines</, 'no unattributed headline total');
});

test('O8 · the masthead says when the records were checked, from the records, where a reader can see it', () => {
  const src = codeOf(readFileSync(join(ROOT, 'js', 'masthead.js'), 'utf8'));
  assert.doesNotMatch(src, /\.portal-head/, 'the old line wrote into an element no page has');
  assert.doesNotMatch(src, /\$last_verified/, 'a file-level date is not a per-record check');
  assert.match(src, /checkedLine\(instruments, \[\.\.\.ix\.event\.values\(\)\], records\)/);
});

/* ---------------------------------------------- audit of 21 Oct 2026 */

test('A1 · a "largest to date" claim is recomputed from the records, and fails when a larger one is added', () => {
  const claims = readData('claims.json').claims;
  const enf = readData('enforcement.json').enforcement;
  const ranked = claims.filter((c) => c.ranking);
  assert.ok(ranked.some((c) => c.id === 'clm-google-dma-largest-total') && ranked.some((c) => c.id === 'clm-aliexpress-fine'),
    'both "largest" claims in the brief carry a ranking block');
  for (const c of ranked) assert.deepEqual(rankingProblems(c, enf), [], `${c.id} holds over the records as they stand`);
  const g = ranked.find((c) => c.id === 'clm-google-dma-largest-total');
  const bigger = { id: 'enf-planted', instrument: 'dma', authority: 'ec', fine_eur: 1e9, action_status: 'action:imposed' };
  assert.match(rankingProblems(g, [...enf, bigger]).join(' '), /ranks 2/, 'a planted larger DMA fine breaks the ranking');
  const unknown = { ...bigger, fine_eur: null };
  assert.match(rankingProblems(g, [...enf, unknown]).join(' '), /cannot be settled/, 'an imposed fine of unknown amount is not a small one');
  const prelim = { ...unknown, action_status: 'action:announced' };
  assert.deepEqual(rankingProblems(g, [...enf, prelim]), [], 'preliminary findings carry no fine and do not unsettle it');
});

test('A2 · validate.mjs FAILS when an instrument was verified before its status was assessed (item 10)', () => {
  assert.equal(runValidator('validate.mjs').exit, 0, 'no instrument on this tree has last_verified < status_as_of');
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'instruments.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const i = d.instruments.find((x) => x.id === 'cra');
    i.status_as_of = '2026-10-14'; i.last_verified = '2026-08-27';
    writeFileSync(p, JSON.stringify(d, null, 2));
    const r = runValidator('validate.mjs', [], dir);
    assert.equal(r.exit, 1);
    assert.match(r.out, /instruments\/cra: last_verified 2026-08-27 is earlier than status_as_of 2026-10-14/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('A3 · a recorded inaction is typed, carries nothing an action carries, and is counted nowhere (item 11)', () => {
  const enf = readData('enforcement.json').enforcement;
  const none = enf.filter((r) => r.record_type === 'record-type:inaction');
  assert.ok(none.some((r) => r.id === 'enf-hungary-commission-none'));
  for (const r of enf) if (r.action_status == null) assert.equal(r.record_type, 'record-type:inaction', `${r.id} has no action and must be typed`);
  /* planted: an untyped non-action, and a typed inaction carrying a fine */
  const dir = dataScratch();
  try {
    const p = join(dir, 'data', 'enforcement.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const h = d.enforcement.find((x) => x.id === 'enf-hungary-commission-none');
    delete h.record_type;
    d.enforcement.push({ ...h, id: 'enf-planted-none', record_type: 'record-type:inaction', fine_eur: 1 });
    writeFileSync(p, JSON.stringify(d, null, 2));
    const r = runValidator('validate.mjs', [], dir);
    assert.equal(r.exit, 1);
    assert.match(r.out, /enf-hungary-commission-none" records no action but is not typed record-type:inaction/);
    assert.match(r.out, /enf-planted-none" is a recorded inaction but carries fine_eur 1/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  /* and no counter counts it: the generated AI Act page, whose only record is Hungary's */
  const page = readFileSync(join(ROOT, 'instruments', 'ai-act', 'index.html'), 'utf8');
  assert.match(page, /No enforcement recorded/);
  assert.match(page, /<h3>Recorded inaction<\/h3>/);
  assert.doesNotMatch(page, /enforcement record\b/, 'the description does not call it an enforcement record');
  assert.doesNotMatch(page, /across 1 records/);
  for (const f of ['js/instrument-view.js', 'js/masthead.js', 'js/enforcement-page.js', 'tools/seo.mjs']) {
    assert.match(readFileSync(join(ROOT, f), 'utf8'), /actionsOnly\(/, `${f} counts through actionsOnly()`);
  }
});

test('A4 · every Part counter equals the boxes the Part holds, in all four languages (item 13)', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const parts = [...html.matchAll(/<section class="part"[^>]*id="([^"]+)"/g)];
  assert.ok(parts.length >= 11);
  const loc = Object.fromEntries(['it', 'fr', 'es'].map((c) => [c, JSON.parse(readFileSync(join(ROOT, 'i18n', `${c}.json`), 'utf8'))]));
  for (const m of parts) {
    const seg = html.slice(m.index, html.indexOf('</section>', m.index));
    const eyebrow = (seg.match(/class="part-eyebrow" data-i18n="([^"]+)">([\s\S]*?)<\/span>\s*(?:<|$)/) || [])[0] || '';
    const key = (seg.match(/class="part-eyebrow" data-i18n="([^"]+)"/) || [])[1];
    for (const tone of ['mech', 'crit', 'synth']) {
      const boxes = (seg.match(new RegExp(`class="box [^"]*" data-tone="${tone}"`, 'g')) || []).length;
      const shown = (src) => { const x = src.match(new RegExp(`data-count="${tone}">(\\d+)<`)); return x ? Number(x[1]) : 0; };
      assert.equal(shown(seg), boxes, `${m[1]}: the English ${tone} counter`);
      for (const [c, o] of Object.entries(loc)) assert.equal(shown(o[key] || ''), boxes, `${m[1]}: the ${c} ${tone} counter`);
    }
    assert.doesNotMatch(eyebrow, /· \d+ (mechanics|critique)/, `${m[1]}: no hand-typed counter outside a data-count span`);
  }
  assert.match(html, /<aside class="box box-synth" data-tone="synth"><span class="box-label" data-i18n="part-11\.span6">SYNTHESIS</, 'Part XI\'s synthesis box is labelled as synthesis');
  assert.match(readFileSync(join(ROOT, 'app.js'), 'utf8'), /addEventListener\('i18n:applied', countBoxes\)/, 'and the counters are recomputed after a language swap');
});

test('A5 · the numerals inside the summary and contents trees are hidden from assistive technology (item 25)', () => {
  /* Each node is a labelled role="button"; its <text> numeral was exposed as
     well, so a reader heard "I III II V …" (extracted: "lllllllll"). Measured
     in Chromium's accessibility tree on 21 Oct 2026: 13 numeral StaticText
     nodes before, 0 after. No screen reader was run. */
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  for (const cls of ['portal-tree', 'tree-map', 'system-map']) {
    const s = html.search(new RegExp(`<svg[^>]*class="${cls}"`));
    assert.ok(s >= 0, cls);
    const seg = html.slice(s, html.indexOf('</svg>', s));
    const nodes = seg.match(/<g [^>]*role="button"[^>]*>[\s\S]*?<\/g>/g) || [];
    assert.ok(nodes.length >= 6, `${cls}: its nodes were found`);
    for (const g of nodes) {
      assert.match(g, /aria-label="[^"]+"/, `${cls}: a node is named by its label`);
      for (const tx of g.match(/<text\b[^>]*>/g) || []) assert.match(tx, /aria-hidden="true"/, `${cls}: ${tx}`);
    }
  }
});

test('A6 · 404.html works at any depth, is never indexed, and is published (item 23)', () => {
  const html = readFileSync(join(ROOT, '404.html'), 'utf8');
  assert.match(html, /<meta content="noindex" name="robots"\/>/);
  assert.match(html, /<body [^>]*data-root="\/"/, 'js/shell.js builds the chrome from the root, not from the missed address');
  assert.doesNotMatch(html, /rel="canonical"/);
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|data:|#)/.test(u)) continue;
    assert.match(u, /^\//, `a relative link breaks when the page is served at /a/b/c: ${u}`);
  }
  assert.match(html, /href="\/">brief<\/a>/, 'it links to the brief');
  assert.match(html, /<kbd>\/<\/kbd>/, 'and says how to search');
  assert.ok(buildArtifact ? true : true);
  assert.equal(refusal('404.html'), null, 'the deploy artifact carries it');
  assert.doesNotMatch(readFileSync(join(ROOT, 'sitemap.xml'), 'utf8'), /404\.html/);
});

/* ---------------------------------------------- the editions' review (22 Oct 2026) */

test('A7 · a translation approval names exact text, goes stale by itself, and only a person records it', async () => {
  const E = await import('./editions.mjs');
  const RV = await import('./i18n-review.mjs');
  const dir = scratch('review');
  try {
    cpSync(join(ROOT, 'i18n'), join(dir, 'i18n'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), readFileSync(join(ROOT, 'index.html'), 'utf8'));
    const head = { root: dir, englishTitle: 'T', englishDescription: 'D' };
    const st = E.reviewState('it', head);
    assert.equal(st.counts.reviewed, 0, 'nothing is reviewed until a person records it');
    assert.equal(st.complete, false);
    const k = st.keys.find((x) => x.key === 'part-1.p2');
    /* a sheet with one ticked box, recorded */
    const sheet = RV.renderSheet(st).replace(`- [ ] approve \`part-1.p2\``, `- [x] approve \`part-1.p2\``);
    const ledger = E.readLedger('it', dir);
    assert.throws(() => RV.record(st, RV.parseSheet(sheet), { by: 'Claude', ledger }), /not a person's name/);
    assert.throws(() => RV.record(st, RV.parseSheet(sheet), { by: '', ledger }), /required/);
    const r = RV.record(st, RV.parseSheet(sheet), { by: 'A Reviewer', on: '2026-10-22', ledger });
    assert.deepEqual(r.done, ['part-1.p2']);
    writeFileSync(E.ledgerPath('it', dir), JSON.stringify(ledger));
    assert.equal(E.reviewState('it', head).keys.find((x) => x.key === 'part-1.p2').state, 'reviewed');
    /* change the translation: the approval no longer matches */
    const p = join(dir, 'i18n', 'it.json');
    const it = JSON.parse(readFileSync(p, 'utf8'));
    it['part-1.p2'] += ' ';
    writeFileSync(p, JSON.stringify(it));
    const after = E.reviewState('it', head);
    assert.equal(after.keys.find((x) => x.key === 'part-1.p2').state, 'stale', 'an approval of an earlier text does not count');
    /* and a sheet ticked against the old text is refused */
    const again = RV.record(after, RV.parseSheet(sheet), { by: 'A Reviewer', ledger: { entries: {} } });
    assert.match(again.refused.join(' '), /changed since the sheet was generated/);
    assert.equal(k.fp, E.fingerprint('part-1.p2', k.en, k.tr));
  } finally { rmSync(dir, { recursive: true, force: true }); }
  /* the shipped ledgers record no approval this repository's agents made */
  for (const c of ['it', 'fr', 'es']) {
    const l = JSON.parse(readFileSync(join(ROOT, 'i18n', 'review', `${c}.json`), 'utf8'));
    for (const [key, e] of Object.entries(l.entries)) assert.doesNotMatch(e.reviewed_by, (await import('./i18n-review.mjs')).NOT_A_PERSON, `${c} ${key}`);
  }
});

test('A8 · an edition is offered to search engines exactly when its review is complete, and stops being when its text changes', async () => {
  const E = await import('./editions.mjs');
  const { TOP_PAGES } = await import('./seo.mjs');
  const home = TOP_PAGES.find((p) => p.file === 'index.html');
  /* this tree: nothing reviewed, so every edition is generated, noindex, unlisted */
  for (const c of ['it', 'fr', 'es']) {
    const html = readFileSync(join(ROOT, c, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`<html lang="${c}"`));
    assert.match(html, /<meta content="noindex" name="robots"\/>/);
    assert.doesNotMatch(html, /hreflang=|rel="canonical"/);
    assert.match(html, /<body [^>]*data-root="\.\.\/"/);
  }
  assert.doesNotMatch(readFileSync(join(ROOT, 'sitemap.xml'), 'utf8'), /\/it\//);
  assert.doesNotMatch(readFileSync(join(ROOT, 'index.html'), 'utf8'), /hreflang=/);

  const dir = siteCopy('editions');
  const regenerate = async () => { const { files } = await generateSite(dir); for (const [f, s] of files) { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), s); } };
  try {
    /* a complete Italian review, recorded in the scratch copy as a person would */
    const st = E.reviewState('it', { root: dir, englishTitle: home.title, englishDescription: home.description });
    const ledger = { locale: 'it', entries: Object.fromEntries(st.keys.map((k) => [k.key, { fingerprint: k.fp, reviewed_by: 'A Reviewer', reviewed_on: '2026-10-22' }])) };
    writeFileSync(E.ledgerPath('it', dir), JSON.stringify(ledger));
    await regenerate();
    const it = readFileSync(join(dir, 'it', 'index.html'), 'utf8');
    assert.match(it, new RegExp(`<link href="${BASE}it/" rel="canonical"/>`));
    assert.doesNotMatch(it, /name="robots"/);
    for (const [lang, href] of [['en', BASE], ['it', BASE + 'it/'], ['x-default', BASE]]) assert.ok(it.includes(`<link href="${href}" hreflang="${lang}" rel="alternate"/>`), `it/ names ${lang}`);
    assert.ok(readFileSync(join(dir, 'index.html'), 'utf8').includes(`<link href="${BASE}it/" hreflang="it" rel="alternate"/>`), 'and the English brief names it back');
    assert.match(readFileSync(join(dir, 'sitemap.xml'), 'utf8'), /\/it\/<\/loc>/);
    assert.match(readFileSync(join(dir, 'fr', 'index.html'), 'utf8'), /name="robots"/, 'French, unreviewed, stays out');
    assert.deepEqual(seoAudit(dir).errors, [], 'and the audit accepts the reviewed state');
    /* one Italian string corrected after the review: the edition leaves search again */
    edit(dir, 'i18n/it.json', (s) => { const o = JSON.parse(s); o['part-1.p2'] += ' '; return JSON.stringify(o); });
    await regenerate();
    const after = readFileSync(join(dir, 'it', 'index.html'), 'utf8');
    assert.match(after, /<meta content="noindex" name="robots"\/>/);
    assert.doesNotMatch(after, /hreflang=/);
    assert.doesNotMatch(readFileSync(join(dir, 'index.html'), 'utf8'), /hreflang=/);
    assert.deepEqual(seoAudit(dir).errors, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ============================================================
   J · the dataset explorer's model (js/json-graph.js)

   datasets.html draws the canonical files as a graph. What it may say
   is decided here: nesting is drawn as nesting, a reference is a string
   that is EXACTLY another record's id, an ambiguous id resolves to
   nothing, and a graph that stops early says where. These hold each of
   those against the real tree and against planted inputs.
   ============================================================ */

import * as JG from '../js/json-graph.js';

const allDocs = (root = ROOT) => Object.fromEntries(JG.DATASETS.map(({ name }) =>
  [name, JSON.parse(readFileSync(join(root, 'data', name + '.json'), 'utf8'))]));

test('J1 · the explorer lists every file in data/, and a file added or removed without it is caught', () => {
  const files = readdirSync(join(ROOT, 'data'));
  assert.deepEqual(JG.listDrift(files), { missing: [], extra: [] });
  assert.deepEqual(JG.listDrift([...files, 'jurisdictions.json']).missing, ['jurisdictions']);
  assert.deepEqual(JG.listDrift(files.filter((f) => f !== 'brief.json')).extra, ['brief']);
  assert.deepEqual(JG.listDrift([...files, 'notes.txt']), { missing: [], extra: [] }, 'only .json files are datasets');
});

test('J2 · a file of the wrong shape is reported, not drawn', () => {
  for (const [doc, re] of [[null, /top level is null/], [[], /an array/], [3, /a number/], ['x', /a string/],
    [{ $description: 'only metadata' }, /no collection/]]) {
    const d = JG.describe(doc);
    assert.equal(d.ok, false);
    assert.match(d.problem, re);
  }
  const d = JG.describe({ $note: 'n', rows: [], misc: { a: 1 } });
  assert.equal(d.ok, true, 'an EMPTY collection is a collection: the page says it holds no records');
  assert.deepEqual(d.collections, [{ key: 'rows', records: [] }]);
  assert.deepEqual(d.other.map(([k]) => k), ['misc']);
  assert.equal(JG.countText(d), '0 in rows');
  for (const { name } of JG.DATASETS) assert.equal(JG.describe(allDocs()[name]).ok, true, name);
});

test('J3 · every id in the real tree resolves to exactly one record; a duplicated id resolves to nothing', () => {
  const refs = JG.refIndex(allDocs());
  assert.ok(refs.size > 900);
  assert.deepEqual([...refs].filter(([, v]) => v === null).map(([k]) => k), [], 'no ambiguous id on this tree');
  const prov = allDocs().instruments.instruments.find((x) => x.id === 'gdpr').provisions[0].id;
  assert.equal(refs.get(prov).record, 'gdpr', 'a provision resolves to the instrument it is written inside');
  assert.ok(refs.get(prov).path.length > 0, 'and says where inside it');
  const planted = JG.refIndex({
    claims: { claims: [{ id: 'dup', statement: 'one' }] },
    sources: { sources: [{ id: 'dup', title: 'two' }, { id: 'src-a' }] },
  });
  assert.equal(planted.get('dup'), null, 'ambiguous: neither record is picked');
  assert.equal(JG.resolve(planted, 'source_id', 'dup'), null);
  assert.equal(JG.resolve(planted, 'source_id', 'src-a').dataset, 'sources');
});

test('J4 · a reference is an exact id held by a named field — never the record\'s own id, never a near miss', () => {
  const refs = JG.refIndex({ sources: { sources: [{ id: 'src-a' }] }, taxonomy: { tier: [{ id: 'tier:1', label: 'Tier 1' }] } });
  assert.equal(JG.resolve(refs, 'id', 'src-a'), null, 'the field `id` is identity, not a reference');
  for (const near of ['SRC-A', 'src-a ', 'src-', 'src-ab', 'see src-a']) assert.equal(JG.resolve(refs, 'source_id', near), null, near);
  const out = JG.referencesIn({ id: 'x', sources: ['src-a'], nested: { source_id: 'src-a' }, tier: 'tier:1', n: 3, z: null }, refs);
  assert.deepEqual(out.map((r) => r.path), ['sources[0]', 'nested.source_id', 'tier']);
  assert.equal(out[2].target.vocabulary, true, 'a vocabulary term is resolved, and marked so it is labelled rather than drawn');
});

test('J5 · the structure graph draws nesting as nesting, keeps null and "unknown" apart, and says where it stopped', () => {
  const g = JG.structureGraph({ a: null, b: 'unknown', c: [], d: {}, e: [1, { f: 2 }], g: 'src-a' },
    { title: 'r', refs: JG.refIndex({ sources: { sources: [{ id: 'src-a' }] } }) });
  const root = g.nodes[0];
  const row = (k) => root.rows.find((r) => r.key === k);
  assert.equal(row('a').type, 'null');
  assert.equal(row('a').text, 'null');
  assert.equal(row('b').type, 'string');
  assert.equal(row('b').text, '"unknown"', 'a string is quoted; null is not — the two never render alike');
  assert.equal(row('g').type, 'ref');
  assert.equal(g.edges.length, 4, 'one edge per nested object or array: c, d, e, e[1]');
  assert.ok(g.edges.every((e) => e.kind === 'nest'));
  assert.ok(g.nodes.some((n) => n.rows.some((r) => r.type === 'empty' && r.text === 'empty array')));
  assert.equal(g.truncated, false);

  const deep = { xs: Array.from({ length: 50 }, (_, i) => ({ i })) };
  const cut = JG.structureGraph(deep, { limits: { ...JG.LIMITS, maxNodes: 10 } });
  assert.equal(cut.nodes.length, 10);
  assert.equal(cut.truncated, true);
  assert.ok(cut.nodes.some((n) => n.rows.some((r) => r.type === 'cut')), 'the row where it stopped says so');
  assert.equal(JG.structureGraph('scalar').nodes[0].rows[0].text, '"scalar"');
});

const apart = (p, q) => p.x + p.w <= q.x || q.x + q.w <= p.x || p.y + p.h <= q.y || q.y + q.h <= p.y;

test('J6 · every record in every real file lays out without two cards overlapping, in both directions, and the same way twice', () => {
  const docs = allDocs();
  const refs = JG.refIndex(docs);
  assert.deepEqual(JG.ORIENTATIONS, ['horizontal', 'vertical'], 'horizontal is the default, and the only other is vertical');
  let checked = 0;
  for (const { name } of JG.DATASETS) {
    for (const col of JG.describe(docs[name]).collections) {
      col.records.forEach((rec, i) => {
        const g = JG.structureGraph(rec, { title: JG.recordKey(rec, i), refs });
        for (const o of JG.ORIENTATIONS) {
          const L = JG.layout(g, JG.METRICS, o);
          assert.equal(L.orientation, o);
          for (let a = 0; a < L.nodes.length; a++) {
            for (let b = a + 1; b < L.nodes.length; b++) {
              const p = L.nodes[a], q = L.nodes[b];
              assert.ok(apart(p, q), `${name}/${JG.recordKey(rec, i)} (${o}): ${p.title} overlaps ${q.title}`);
            }
          }
          checked += 1;
        }
      });
    }
  }
  assert.ok(checked > 1800);
  const gdpr = docs.instruments.instruments.find((x) => x.id === 'gdpr');
  for (const o of JG.ORIENTATIONS) {
    assert.deepEqual(JG.layout(JG.structureGraph(gdpr, { refs }), JG.METRICS, o), JG.layout(JG.structureGraph(gdpr, { refs }), JG.METRICS, o));
  }
  assert.deepEqual(JG.layout(JG.structureGraph(gdpr, { refs })), JG.layout(JG.structureGraph(gdpr, { refs }), JG.METRICS, 'horizontal'),
    'no direction given is horizontal');
});

test('J8 · the vertical layout is the horizontal one turned: children below their parent, edges from foot to head', () => {
  const g = JG.structureGraph({ a: { x: 1 }, b: [1, 2], c: 'v' }, { title: 'r' });
  const H = JG.layout(g), V = JG.layout(g, JG.METRICS, 'vertical');
  const at = (L, id) => L.nodes.find((n) => n.id === id);
  for (const e of g.edges) {
    const [hp, hc] = [at(H, e.from), at(H, e.to)];
    const [vp, vc] = [at(V, e.from), at(V, e.to)];
    assert.ok(hc.x >= hp.x + hp.w, 'horizontal: a child sits to the right of its parent');
    assert.ok(vc.y >= vp.y + vp.h, 'vertical: a child sits below its parent');
  }
  for (const e of V.edges) {
    const p = at(V, e.from), c = at(V, e.to);
    assert.equal(e.y1, p.y + p.h, 'a vertical edge leaves from the foot of the parent card');
    assert.equal(e.y2, c.y, 'and arrives at the head of the child');
  }
  assert.match(JG.edgePath(V.edges[0], 'vertical'), /^M[\d.]+ [\d.]+ C/);
  assert.notEqual(JG.edgePath(V.edges[0], 'vertical'), JG.edgePath(V.edges[0], 'horizontal'), 'the curve leaves along the direction of the layout');
});

test('J7 · the reference graph leaves out vocabulary terms, caps each side and counts what it left out', () => {
  const docs = allDocs();
  const refs = JG.refIndex(docs);
  const into = JG.incomingIndex(docs, refs);
  const self = into.get('src-brief-original') || [];
  const RG = JG.referenceGraph({ dataset: 'sources', record: 'src-brief-original' }, [], self, { cap: 5 });
  const distinct = new Set(self.map((r) => r.dataset + '/' + r.record)).size;
  assert.equal(RG.totals.in, distinct);
  assert.equal(RG.cards.length, Math.min(5, distinct));
  assert.equal(RG.omitted.in, Math.max(0, distinct - 5));
  const claim = docs.claims.claims[0];
  const out = JG.referencesIn(claim, refs);
  const drawn = JG.referenceGraph({}, out, []).cards;
  assert.ok(drawn.every((c) => c.dataset !== 'taxonomy'), 'vocabulary terms are labelled in place, not drawn');
  /* a provision naming its own instrument is not an incoming edge into it */
  for (const r of into.get('gdpr') || []) assert.ok(!(r.dataset === 'instruments' && r.record === 'gdpr'));

  /* turned: the records naming it above, the records it names below, no card over another */
  const dma = docs.instruments.instruments.find((x) => x.id === 'dma');
  for (const o of JG.ORIENTATIONS) {
    const G2 = JG.referenceGraph({ dataset: 'instruments', record: 'dma' }, JG.referencesIn(dma, refs), into.get('dma') || [], { orientation: o });
    assert.equal(G2.orientation, o);
    const all = [G2.center, ...G2.cards];
    for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) assert.ok(apart(all[a], all[b]), `${o}: two reference cards overlap`);
    for (const c of G2.cards) {
      if (o === 'vertical') assert.ok(c.side === 'in' ? c.y + c.h <= G2.center.y : c.y >= G2.center.y + G2.center.h, 'vertical: in above, out below');
      else assert.ok(c.side === 'in' ? c.x + c.w <= G2.center.x : c.x >= G2.center.x + G2.center.w, 'horizontal: in left, out right');
      assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= G2.width + 0.01 && c.y + c.h <= G2.height + 0.01, 'every card inside the drawing');
    }
  }
});

/* ============================================================
   W · the exclusion register and the watchlist (item 2.1)

   v2 Session 4, 27 Oct 2026. docs/V2-DATA-DESIGN.md §6.3 ties six checks
   to the register and the watchlist — M-03, M-04, M-05, M-06, M-07 and
   R-01 — and they arrived with the records. Each is shown failing here on
   a planted defect, because a check that cannot be seen to fail checks
   nothing. The fixtures are copies of the real data with one thing wrong.
   ============================================================ */

const loadDb = (root = ROOT) => Object.fromEntries(readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json'))
  .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(root, 'data', f), 'utf8'))]));
const instOf = (db, id) => db.instruments.instruments.find((i) => i.id === id);
const firstOf = (db, disp) => db.instruments.instruments.find((i) => i.scope_decision && i.scope_decision.disposition === disp);
const regErrors = (db, asOf = '2026-10-27') => registerAudit(db, asOf).errors;

test('W1 · this tree: the register and the watchlist are derived, complete and clean, and the backlog is the frozen one', () => {
  /* audited as of the tree's own newest decision, as freshness F1 audits as of
     its newest verification: an earlier date only reports VERIFIED_AFTER_AS_OF,
     a property of the date asked (W4). Was a fixed 2026-10-27 until item 2.4
     wrote a decision dated 28 Oct 2026. */
  const newest = loadDb().instruments.instruments.map((i) => i.scope_decision?.last_verified).filter(Boolean).sort().pop();
  assert.ok(newest >= '2026-10-28', 'the tree holds the decision of item 2.4');
  const r = registerAudit(loadDb(), newest);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.ok(r.register.length >= 1 && r.watchlist.length >= 1, 'item 2.1 put records in both lists');
  for (const id of r.register) assert.equal(instOf(loadDb(), id).scope_class, 'scope:out-of-scope');
  /* the backlog may only shrink: every name in it is on the frozen list */
  for (const id of r.backlog['scope-decision-missing']) assert.ok(SCOPE_DECISION_BACKLOG.includes(id));
  for (const id of r.backlog['status-basis-missing']) assert.ok(STATUS_BASIS_BACKLOG.includes(id));
  assert.equal(SCOPE_DECISION_BACKLOG.length, 11);
  assert.equal(STATUS_BASIS_BACKLOG.length, 23);    /* 24 until eidas2's basis was written (item 2.2) */
});

test('W2 · M-03: a disposition that disagrees with the scope class is an error', () => {
  const db = loadDb();
  firstOf(db, 'excluded').scope_decision.disposition = 'watched';
  assert.ok(regErrors(db).some((e) => /^M-03 .*excluded and out-of-scope go together/.test(e)));
  const db2 = loadDb();
  firstOf(db2, 'watched').scope_class = 'scope:core';
  assert.ok(regErrors(db2).some((e) => /^M-03 .*included and core go together/.test(e)));
});

test('W3 · M-04: an unapproved, draft, unsourced or incomplete decision is an error, and so is a missing one', () => {
  const plant = (fn, re) => { const db = loadDb(); fn(db); assert.ok(regErrors(db).some((e) => re.test(e)), `expected ${re}`); };
  plant((db) => { firstOf(db, 'excluded').scope_decision.approved_on = null; }, /^M-04 .*approved_on is null/);
  plant((db) => { const d = firstOf(db, 'excluded').scope_decision; d.reason = 'DRAFT. ' + d.reason; }, /^M-04 .*still marked DRAFT/);
  plant((db) => { firstOf(db, 'excluded').scope_decision.criterion = ['crit:nonsense']; }, /^M-04 .*crit:nonsense/);
  plant((db) => { firstOf(db, 'watched').scope_decision.watch_for = null; }, /^M-04 .*watched with no watch_for/);
  plant((db) => { firstOf(db, 'excluded').scope_decision.watch_for = { event_type: null, description: 'something happens' }; }, /^M-04 .*watch_for on a decision that is not watched/);
  plant((db) => { for (const s of firstOf(db, 'excluded').scope_decision.sources) s.locator = 'Title'; }, /^M-04 .*no direct reference with a structural locator/);
  plant((db) => { delete firstOf(db, 'excluded').scope_decision; }, /^M-04 .*out of scope with no scope_decision/);
  /* a core record added after 25 Oct 2026 is held to the rule, not backlogged */
  plant((db) => { const i = instOf(db, 'pld'); i.scope_class = 'scope:core'; }, /^M-04 instruments\/pld: a core record added after 25 Oct 2026/);
});

test('W4 · M-04: a decision verified after the audit date is a WARNING, not an error (the author, 27 Oct 2026)', () => {
  const r = registerAudit(loadDb(), '2026-09-27');
  assert.ok(!r.errors.some((e) => /after the audit date/.test(e)));
  assert.ok(r.warnings.some((w) => /^VERIFIED_AFTER_AS_OF /.test(w)));
});

test('W5 · M-05: a covered record without a page, and an excluded record the gate would give one, are errors', () => {
  const db = loadDb();
  instOf(db, 'gdpr').dna = null;
  assert.ok(regErrors(db).some((e) => /^M-05 instruments\/gdpr: covered \(core\) without a page/.test(e)));
  /* the gate's own criteria, met one by one on an excluded record */
  const db2 = loadDb();
  const x = firstOf(db2, 'excluded');
  x.dna = { objective: 'A planted objective, so the explanation criterion passes.' };
  x.brief_part = db2.brief.parts[0].id;
  db2.claims.claims[0].instruments = [...(db2.claims.claims[0].instruments || []), x.id];
  assert.ok(regErrors(db2).some((e) => new RegExp(`^M-05 instruments/${x.id}: excluded, and the page gate gives it a page`).test(e)));
});

test('W6 · M-06: an excluded or watched record that refers nowhere, or to a source with no URL, is an error', () => {
  const db = loadDb();
  firstOf(db, 'excluded').scope_decision.refer_to = [];
  assert.ok(regErrors(db).some((e) => /^M-06 .*the reader is sent nowhere/.test(e)));
  const db2 = loadDb();
  const w = firstOf(db2, 'watched');
  db2.sources.sources.find((s) => s.id === w.scope_decision.refer_to[0]).url = null;
  assert.ok(regErrors(db2).some((e) => /^M-06 .*which has no url/.test(e)));
});

test('W7 · M-07: a new record without a status basis, or with one of the wrong tier, is an error; an old one is backlog', () => {
  const db = loadDb();
  delete firstOf(db, 'excluded').status_basis;
  assert.ok(regErrors(db).some((e) => /^M-07 .*without a direct tier:1 reference/.test(e)));
  /* an in-force act on a tier-2 procedure file alone: the wrong tier */
  const db2 = loadDb();
  const x = firstOf(db2, 'excluded');
  const t2 = db2.sources.sources.find((s) => s.tier === 'tier:2');
  x.status_basis = [{ source_id: t2.id, supports: 'supports:direct', locator: 'Art. 1' }];
  assert.ok(regErrors(db2).some((e) => new RegExp(`^M-07 instruments/${x.id}`).test(e)));
  /* gdpr existed on 25 Oct 2026: backlog, never an error */
  const r = registerAudit(loadDb(), '2026-10-27');
  assert.ok(r.backlog['status-basis-missing'].includes('gdpr'));
});

test('W8 · R-01: a watched record whose event has happened is a WATCH_TRIGGERED warning; a future one is not', () => {
  const db = loadDb();
  const w = db.instruments.instruments.find((i) => i.scope_decision?.disposition === 'watched' && i.scope_decision.watch_for?.event_type);
  assert.ok(w, 'a watched record with a typed trigger exists');
  const ev = { ...db.timeline.events[0], id: 'tl-planted-trigger', instrument: w.id, event_type: w.scope_decision.watch_for.event_type, date: '2026-10-01' };
  db.timeline.events.push(ev);
  w.milestones = [...w.milestones, ev.id];
  assert.ok(registerAudit(db, '2026-10-27').warnings.some((x) => new RegExp(`^WATCH_TRIGGERED instruments/${w.id}`).test(x)));
  assert.ok(!registerAudit(db, '2026-09-30').warnings.some((x) => /^WATCH_TRIGGERED/.test(x)), 'not before the event');
});

test('W9 · evidence-audit.mjs FAILS on a planted register defect, and validate.mjs on a dangling v2 reference', () => {
  const dir = treeCopy();
  try {
    editJSON(dir, 'instruments.json', (d) => {
      d.instruments.find((i) => i.scope_decision?.disposition === 'excluded').scope_decision.approved_on = null;
    });
    const r = runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-27']);
    assert.equal(r.exit, 1);
    assert.match(r.out, /M-04 .*approved_on is null/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const d2 = dataScratch();
  try {
    const p = join(d2, 'data', 'instruments.json');
    const d = JSON.parse(readFileSync(p, 'utf8'));
    d.relationships.find((r) => typeof r.sources[0] === 'object').sources[0].source_id = 'src-not-a-source';
    d.instruments.find((i) => i.scope_decision).scope_decision.criterion.push('crit:not-a-clause');
    d.instruments[0].approved_on = '2026-10-27';            /* admitted under scope_decision only */
    writeFileSync(p, JSON.stringify(d, null, 2));
    const r = runValidator('validate.mjs', [], d2);
    assert.equal(r.exit, 1);
    assert.match(r.out, /DANGLING source ref "src-not-a-source"/);
    assert.match(r.out, /DANGLING taxonomy ref "crit:not-a-clause"/);
    assert.match(r.out, /POSSIBLE DUPLICATE FACT: ISO date in instruments\/gdpr\.approved_on/);
  } finally { rmSync(d2, { recursive: true, force: true }); }
});

test('W10 · coverage() is derived, one home, and the static instrument list leaves the register and the watchlist out', () => {
  const db = loadDb();
  assert.equal(coverage(instOf(db, 'gdpr')), 'covered');
  assert.equal(coverage(instOf(db, 'pld')), 'mapped');
  assert.equal(coverage({ scope_class: 'scope:core', scope_decision: { disposition: 'watched' } }), 'watched');
  for (const i of db.instruments.instruments) assert.ok(!('coverage' in i), `${i.id} stores coverage, which is derived`);
  const html = readFileSync(join(ROOT, 'instruments.html'), 'utf8');
  const thin = html.slice(html.indexOf('class="inst-thin"'), html.indexOf('</p>', html.indexOf('class="inst-thin"')));
  assert.ok(thin.length > 20, 'the list of thinner records is in the page');
  for (const i of db.instruments.instruments.filter((x) => notCovered(x))) {
    assert.ok(!thin.includes(`>${i.short_name}<`), `${i.id} (${coverage(i)}) is listed among the instruments still to be covered`);
  }
  /* the three views and the record page ask the same function */
  for (const f of ['js/search.js', 'js/calendar.js', 'js/instrument-page.js']) {
    assert.match(readFileSync(join(ROOT, f), 'utf8'), /notCovered\(/, `${f} does not ask js/routes.js`);
  }
});

test('W11 · item 2.2: eidas2 is covered and held to M-04, M-05 and M-07 in full — remove any one support and it fails', () => {
  const r = registerAudit(loadDb(), '2026-10-27');
  const db = loadDb();
  assert.equal(coverage(instOf(db, 'eidas2')), 'covered');
  assert.equal(instOf(db, 'eidas2').scope_decision.disposition, 'included');
  assert.ok(!STATUS_BASIS_BACKLOG.includes('eidas2') && !SCOPE_DECISION_BACKLOG.includes('eidas2'), 'no backlog shelters it');
  assert.ok(!r.backlog['status-basis-missing'].includes('eidas2'));
  const plant = (fn, re) => { const d = loadDb(); fn(d); assert.ok(regErrors(d).some((e) => re.test(e)), `expected ${re}`); };
  /* its status basis gone: an error, not backlog */
  plant((d) => { delete instOf(d, 'eidas2').status_basis; }, /^M-07 instruments\/eidas2:/);
  /* its decision gone: a core record added after 25 Oct 2026 */
  plant((d) => { delete instOf(d, 'eidas2').scope_decision; }, /^M-04 instruments\/eidas2: a core record added after 25 Oct 2026/);
  /* every relationship that gives it context gone, or its objective: no page, so M-05.
     Until 28 Oct 2026 rel-eidas2-gdpr-defers was the only one; since then
     rel-eidas2-eidas-amends gives context too (docs/ROADMAP-v2.md §8, item (k)) */
  { const d = loadDb(); d.instruments.relationships = d.instruments.relationships.filter((x) => x.id !== 'rel-eidas2-gdpr-defers');
    assert.ok(!regErrors(d).some((e) => /^M-05 instruments\/eidas2/.test(e)), 'the GDPR edge alone is no longer its only context'); }
  plant((d) => { d.instruments.relationships = d.instruments.relationships.filter((x) => x.from !== 'eidas2' && x.to !== 'eidas2'); },
    /^M-05 instruments\/eidas2: covered \(core\) without a page/);
  plant((d) => { instOf(d, 'eidas2').dna.objective = ''; }, /^M-05 instruments\/eidas2: covered \(core\) without a page/);
});

test('W13 · item 2.3: csa is covered and held to M-04, M-05 and M-07 in full — remove any one support and it fails', () => {
  const r = registerAudit(loadDb(), '2026-10-27');
  const db = loadDb();
  assert.equal(coverage(instOf(db, 'csa')), 'covered');
  assert.equal(instOf(db, 'csa').scope_decision.disposition, 'included');
  assert.ok(!STATUS_BASIS_BACKLOG.includes('csa') && !SCOPE_DECISION_BACKLOG.includes('csa'), 'no backlog shelters it');
  assert.ok(!r.backlog['status-basis-missing'].includes('csa'));
  /* the edge that gives it context is textual, v2, and located in the dependent act (rel-kind:enables) */
  const edge = db.instruments.relationships.find((x) => x.id === 'rel-nis2-csa-enables');
  assert.ok(edge && edge.from === 'nis2' && edge.to === 'csa' && edge.kind === 'rel-kind:enables');
  assert.ok(edge.sources.every((s) => typeof s === 'object' && s.supports === 'supports:direct' && structural(s.locator)));
  assert.ok(edge.sources.every((s) => instOf(db, 'csa').sources.includes(s.source_id)), 'the locator is in the CSA, not in NIS2');
  const plant = (fn, re) => { const d = loadDb(); fn(d); assert.ok(regErrors(d).some((e) => re.test(e)), `expected ${re}`); };
  plant((d) => { delete instOf(d, 'csa').status_basis; }, /^M-07 instruments\/csa:/);
  plant((d) => { delete instOf(d, 'csa').scope_decision; }, /^M-04 instruments\/csa: a core record added after 25 Oct 2026/);
  plant((d) => { d.instruments.relationships = d.instruments.relationships.filter((x) => x.id !== 'rel-nis2-csa-enables'); },
    /^M-05 instruments\/csa: covered \(core\) without a page/);
  plant((d) => { instOf(d, 'csa').dna.objective = ''; }, /^M-05 instruments\/csa: covered \(core\) without a page/);
});

test('W14 · item 2.4: ehds is covered and held to M-04, M-05 and M-07 in full — remove any one support and it fails', () => {
  const r = registerAudit(loadDb(), '2026-10-28');
  const db = loadDb();
  const ehds = instOf(db, 'ehds');
  assert.equal(coverage(ehds), 'covered');
  assert.equal(ehds.scope_decision.disposition, 'included');
  assert.ok(!STATUS_BASIS_BACKLOG.includes('ehds') && !SCOPE_DECISION_BACKLOG.includes('ehds'), 'no backlog shelters it');
  assert.ok(!r.backlog['status-basis-missing'].includes('ehds'));
  /* crit:sector-instance is "shown by an edge" to a covered instrument: the
     criterion itself rests on rel-gdpr-ehds-enables, textual, v2, located in the EHDS */
  assert.deepEqual(ehds.scope_decision.criterion, ['crit:object-data', 'crit:sector-instance']);
  const edge = db.instruments.relationships.find((x) => x.id === 'rel-gdpr-ehds-enables');
  assert.ok(edge && edge.from === 'gdpr' && edge.to === 'ehds' && edge.kind === 'rel-kind:enables');
  assert.equal(coverage(instOf(db, 'gdpr')), 'covered', 'the edge reaches a covered instrument');
  assert.ok(edge.sources.every((s) => typeof s === 'object' && s.supports === 'supports:direct' && structural(s.locator)));
  assert.ok(edge.sources.every((s) => ehds.sources.includes(s.source_id)), 'the locator is in the EHDS, not in the GDPR');
  const plant = (fn, re) => { const d = loadDb(); fn(d); assert.ok(regErrors(d).some((e) => re.test(e)), `expected ${re}`); };
  plant((d) => { delete instOf(d, 'ehds').status_basis; }, /^M-07 instruments\/ehds:/);
  plant((d) => { delete instOf(d, 'ehds').scope_decision; }, /^M-04 instruments\/ehds: a core record added after 25 Oct 2026/);
  /* every edge to a covered instrument gone, the edge to the watched DGA kept:
     the page gate's `context` still passes, and the criterion alone fails */
  const toCovered = (d, x) => (x.from === 'ehds' || x.to === 'ehds')
    && coverage(instOf(d, x.from === 'ehds' ? x.to : x.from)) === 'covered';
  plant((d) => { d.instruments.relationships = d.instruments.relationships.filter((x) => !toCovered(d, x)); },
    /^M-04 instruments\/ehds: crit:sector-instance with no edge to a covered instrument/);
  { const d = loadDb(); d.instruments.relationships = d.instruments.relationships.filter((x) => !toCovered(d, x));
    assert.ok(!regErrors(d).some((e) => /^M-05 instruments\/ehds/.test(e)), 'the gate alone would not have caught it'); }
  /* the edge stays but loses its direct reference: the criterion fails too */
  plant((d) => {
    for (const x of d.instruments.relationships) if (toCovered(d, x)) for (const s of x.sources) s.supports = 'supports:partial';
  }, /^M-04 instruments\/ehds: crit:sector-instance/);
  /* every edge gone: no context, so no page, so M-05 as well */
  plant((d) => { d.instruments.relationships = d.instruments.relationships.filter((x) => x.from !== 'ehds' && x.to !== 'ehds'); },
    /^M-05 instruments\/ehds: covered \(core\) without a page/);
  plant((d) => { instOf(d, 'ehds').dna.objective = ''; }, /^M-05 instruments\/ehds: covered \(core\) without a page/);
});

test('W15 · item 2.5: iea is covered and held to M-04, M-05 and M-07 in full — remove any one support and it fails', () => {
  const r = registerAudit(loadDb(), '2026-10-28');
  const db = loadDb();
  const iea = instOf(db, 'iea');
  assert.equal(coverage(iea), 'covered');
  assert.equal(iea.scope_decision.disposition, 'included');
  assert.deepEqual(iea.scope_decision.criterion, ['crit:object-infrastructure', 'crit:horizontal']);
  assert.ok(!STATUS_BASIS_BACKLOG.includes('iea') && !SCOPE_DECISION_BACKLOG.includes('iea'), 'no backlog shelters it');
  assert.ok(!r.backlog['status-basis-missing'].includes('iea'));
  /* the brief does not name it, so context rests on its edges alone: both
     textual and v2, each located in the Interoperable Europe Act — the
     deferring act for defers-to, the dependent act for enables */
  assert.equal(iea.brief_part, null);
  const defers = db.instruments.relationships.find((x) => x.id === 'rel-iea-gdpr-defers');
  const enables = db.instruments.relationships.find((x) => x.id === 'rel-nis2-iea-enables');
  assert.ok(defers && defers.from === 'iea' && defers.to === 'gdpr' && defers.kind === 'rel-kind:defers-to');
  assert.ok(enables && enables.from === 'nis2' && enables.to === 'iea' && enables.kind === 'rel-kind:enables');
  for (const edge of [defers, enables]) {
    assert.ok(edge.sources.every((s) => typeof s === 'object' && s.supports === 'supports:direct' && structural(s.locator)));
    assert.ok(edge.sources.every((s) => iea.sources.includes(s.source_id)), `${edge.id}: the locator is in the Interoperable Europe Act`);
  }
  /* "applicable" holds only while no application date is still to come, and
     the 2025 tranche is tagged, so it cannot pose as the general date */
  const ix = { event: new Map(db.timeline.events.map((e) => [e.id, e])) };
  assert.equal(iea.legislative_status, 'status:applicable');
  assert.deepEqual(statusContradictions(iea, ix, '2026-10-28'), []);
  assert.equal(provisionApplication('iea:art-3', iea, ix, '2026-10-28').date, '2025-01-12');
  assert.equal(provisionApplication('iea:art-4', iea, ix, '2026-10-28').date, '2024-07-12');
  const plant = (fn, re) => { const d = loadDb(); fn(d); assert.ok(regErrors(d).some((e) => re.test(e)), `expected ${re}`); };
  plant((d) => { delete instOf(d, 'iea').status_basis; }, /^M-07 instruments\/iea:/);
  plant((d) => { delete instOf(d, 'iea').scope_decision; }, /^M-04 instruments\/iea: a core record added after 25 Oct 2026/);
  /* either edge alone carries the page gate's `context`; both gone, no page */
  for (const id of ['rel-iea-gdpr-defers', 'rel-nis2-iea-enables']) {
    const d = loadDb(); d.instruments.relationships = d.instruments.relationships.filter((x) => x.id !== id);
    assert.ok(!regErrors(d).some((e) => /^M-05 instruments\/iea/.test(e)), `${id} removed, the other edge still gives context`);
  }
  plant((d) => { d.instruments.relationships = d.instruments.relationships.filter((x) => x.from !== 'iea' && x.to !== 'iea'); },
    /^M-05 instruments\/iea: covered \(core\) without a page/);
  plant((d) => { instOf(d, 'iea').dna.objective = ''; }, /^M-05 instruments\/iea: covered \(core\) without a page/);
  /* a future application date planted: "applicable" is then a contradiction */
  { const ev = new Map(ix.event); ev.set('tl-iea-planted', { id: 'tl-iea-planted', date: '2027-01-01', event_type: 'event:application', provisions: ['iea:art-4'] });
    assert.ok(statusContradictions({ ...iea, milestones: [...iea.milestones, 'tl-iea-planted'] }, { event: ev }, '2026-10-28')
      .some((m) => /still to come/.test(m))); }
});

test('W16 · the sanction ceiling has one derivation, and the page head and "In short" agree with it on every instrument page', () => {
  assert.equal(sanctionCeiling({ sanction_ceiling: { pct_global_turnover: 4, fixed_eur: null, note: null } }).state, 'amount');
  assert.equal(sanctionCeiling({ sanction_ceiling: { pct_global_turnover: null, fixed_eur: null, note: 'Set by Member States.' } }).state, 'no-amount');
  assert.equal(sanctionCeiling({ sanction_ceiling: { pct_global_turnover: null, fixed_eur: null, note: null } }).state, 'not-established');
  assert.equal(sanctionCeiling({}).state, 'not-established');
  const db = loadDb();
  for (const id of readdirSync(join(ROOT, 'instruments'))) {
    const inst = instOf(db, id);
    if (!inst) continue;
    const html = readFileSync(join(ROOT, 'instruments', id, 'index.html'), 'utf8');
    const head = html.match(/<dt>Sanction ceiling<\/dt><dd[^>]*>(.*?)<\/dd>/);
    const short = html.match(/<strong>Sanction ceiling:<\/strong> (.*?)<\/li>/);
    assert.ok(head && short, `${id}: both places render the ceiling`);
    const c = sanctionCeiling(inst.dna);
    const word = { 'no-amount': 'no amount recorded', 'not-established': 'not established' }[c.state];
    if (word) {
      assert.match(head[1], new RegExp(`>${word}<`), `${id}: the page head says "${word}"`);
      assert.match(short[1], new RegExp(`>${word}<`), `${id}: "In short" says "${word}"`);
    }
    assert.doesNotMatch(head[1] + short[1], />none recorded</, `${id}: the old wording is back`);
  }
});

test('W17 · item 2.6: the Digital Networks Act is covered as a proposal and held to M-04, M-05, M-07 and the pre-adoption rule — remove any one support and it fails', async () => {
  const ID = 'digital-networks-act';
  const r = registerAudit(loadDb(), '2026-10-28');
  const db = loadDb();
  const dna = instOf(db, ID);
  assert.equal(coverage(dna), 'covered');
  assert.equal(dna.scope_decision.disposition, 'included');
  assert.deepEqual(dna.scope_decision.criterion, ['crit:object-infrastructure', 'crit:horizontal', 'crit:readable']);
  assert.ok(!STATUS_BASIS_BACKLOG.includes(ID) && !SCOPE_DECISION_BACKLOG.includes(ID), 'no backlog shelters it');
  assert.ok(!r.backlog['status-basis-missing'].includes(ID));
  assert.ok(!r.errors.some((e) => e.includes(`instruments/${ID}`)), 'the record as written passes');
  /* a proposal, and counted as one: a pre-adoption state, no contradiction */
  const ix = { event: new Map(db.timeline.events.map((e) => [e.id, e])) };
  assert.equal(dna.kind, 'kind:proposal');
  assert.equal(dna.legislative_status, 'status:proposal');
  assert.deepEqual(statusContradictions(dna, ix, '2026-10-28'), []);
  /* no date the proposal itself foresees is an event: its one milestone is the proposal */
  assert.deepEqual(dna.milestones.map((m) => ix.event.get(m).event_type), ['event:proposal']);
  /* the brief does not name it, so context rests on its edges alone: textual,
     v2, each located in the proposal (the amending act; the deferring act) */
  assert.equal(dna.brief_part, null);
  const EDGES = ['rel-digital-networks-act-eprivacy-amends', 'rel-digital-networks-act-gdpr-defers', 'rel-digital-networks-act-nis2-defers'];
  for (const id of EDGES) {
    const edge = db.instruments.relationships.find((x) => x.id === id);
    assert.ok(edge && edge.from === ID, `${id} runs from the proposal`);
    assert.ok(edge.sources.every((s) => typeof s === 'object' && s.supports === 'supports:direct' && structural(s.locator)));
    assert.ok(edge.sources.every((s) => dna.sources.includes(s.source_id)), `${id}: the locator is in the proposal`);
    assert.match(edge.summary, /^Proposed: /, `${id}: the summary says it is proposed`);
  }
  assert.deepEqual(db.instruments.relationships.filter((x) => x.to === ID).map((x) => x.id), [], 'no edge runs into the proposal (the author, 28 Oct 2026)');
  const plant = (fn, re) => { const d = loadDb(); fn(d); assert.ok(regErrors(d, '2026-10-28').some((e) => re.test(e)), `expected ${re}`); };
  plant((d) => { delete instOf(d, ID).status_basis; }, new RegExp(`^M-07 instruments/${ID}:`));
  plant((d) => { delete instOf(d, ID).scope_decision; }, new RegExp(`^M-04 instruments/${ID}: a core record added after 25 Oct 2026`));
  /* any one edge carries the page gate's `context`; all three gone, no page */
  for (const id of EDGES) {
    const d = loadDb(); d.instruments.relationships = d.instruments.relationships.filter((x) => x.id !== id);
    assert.ok(!regErrors(d, '2026-10-28').some((e) => new RegExp(`^M-05 instruments/${ID}`).test(e)), `${id} removed, the others still give context`);
  }
  plant((d) => { d.instruments.relationships = d.instruments.relationships.filter((x) => x.from !== ID && x.to !== ID); },
    new RegExp(`^M-05 instruments/${ID}: covered \\(core\\) without a page`));
  plant((d) => { instOf(d, ID).dna.objective = ''; }, new RegExp(`^M-05 instruments/${ID}: covered \\(core\\) without a page`));
  /* a post-adoption state on a proposal: counted as law by statusContradictions,
     and a status a tier-2 procedure file cannot carry (M-07, S-03) */
  for (const st of ['status:in-force', 'status:applicable', 'status:adopted']) {
    assert.ok(statusContradictions({ ...dna, legislative_status: st }, ix, '2026-10-28').some((m) => /counts it as law/.test(m)), `${st} on a proposal`);
    plant((d) => { instOf(d, ID).legislative_status = st; }, new RegExp(`^M-07 instruments/${ID}: ${st}`));
  }
  /* the page renders the proposal's articles as proposed: they would bind and
     would apply, and no date applies; an adopted act's page keeps "Binds" */
  const page = readFileSync(join(ROOT, 'instruments', ID, 'index.html'), 'utf8');
  assert.match(page, /<th scope="col">Would bind<\/th><th scope="col">Would apply<\/th>/);
  assert.doesNotMatch(page, /<th scope="col">Binds<\/th>|data-label="Binds"|data-label="Applies"/);
  assert.equal((page.match(/no date: a proposal is not law/g) || []).length, dna.provisions.length);
  assert.doesNotMatch(page, /Applies (since|from)|no application date recorded/);
  assert.match(readFileSync(join(ROOT, 'instruments', 'iea', 'index.html'), 'utf8'), /<th scope="col">Binds<\/th><th scope="col">Applies<\/th>/);
  /* search offers no obligation from a proposal's article */
  const { bindingActors } = await import('../js/search.js');
  for (const p of dna.provisions) assert.deepEqual(bindingActors(p, dna), [], `${p.id} offered as an obligation`);
  assert.deepEqual(bindingActors(instOf(db, 'iea').provisions[0], instOf(db, 'iea')), instOf(db, 'iea').provisions[0].obligation_on);
  assert.match(readFileSync(join(ROOT, 'js/search.js'), 'utf8'), /for \(const who of bindingActors\(/, 'buildIndex does not ask bindingActors');
  /* a proposal is identified by its COM number, never by an act its title amends */
  const { actNumber } = await import('./seo.mjs');
  assert.equal(actNumber(dna), 'COM(2026) 16');
  assert.equal(actNumber(instOf(db, 'data-omnibus')), 'COM(2025) 837');
  assert.equal(actNumber(instOf(db, 'iea')), 'Regulation (EU) 2024/903');
  assert.doesNotMatch(page.match(/<meta content="([^"]*)" name="description"/)[1], /2015\/2120/);
  /* a Commission proposal is a tier-1 legislative document, never labelled "primary law" */
  const { tierWord } = await import('../js/format.js');
  const src = new Map(db.sources.sources.map((x) => [x.id, x]));
  for (const id of ['src-eurlex-dna-proposal', 'src-eurlex-data-omnibus-837', 'src-eurlex-psd3-proposal', 'src-eurlex-psr-proposal'])
    assert.equal(tierWord(src.get(id)), 'Tier 1 · legislative proposal', id);
  assert.equal(tierWord(src.get('src-eurlex-iea')), 'Tier 1 · primary law');
  assert.doesNotMatch(page, /primary law/);
});

/* v2 Session 5, B.3. Eight of the seventeen v1 relationships were migrated to
   v2 reference objects on 27 Oct 2026, each source re-read that day; nine stay
   v1 (docs/ROADMAP-v2.md §8). No edge check exists yet (M-08 belongs to D1, and
   the `edge-v1-sources` flip is deferred by the author), so this pins the data:
   the v1 list may only shrink, and a migrated edge cannot drift back. */
const B3_MIGRATED = ['rel-ai-act-gdpr-art-22', 'rel-dma-tfeu-102', 'rel-dma-gdpr-consent', 'rel-ai-act-pld',
  'rel-ai-omnibus-ai-act', 'rel-nis2-dora', 'rel-dsa-ecommerce', 'rel-nis2-nis1'];
const B3_STILL_V1 = ['rel-ai-act-gdpr-impact-assessments', 'rel-dsa-gdpr-transparency-minimisation', 'rel-dsa-dma-scope',
  'rel-data-omnibus-gdpr', 'rel-nis2-cer', 'rel-cra-nis2', 'rel-data-act-cloud-ai-act', 'rel-tfeu-114-acquis', 'rel-ai-act-teu-4-2'];

test('W12 · B.3: the migrated relationships carry v2 references, each direct tier-1 one structurally located, and the v1 list only shrinks', () => {
  const db = loadDb();
  const src = new Map(db.sources.sources.map((s) => [s.id, s]));
  const isV1 = (r) => (r.sources || []).some((s) => typeof s === 'string');
  for (const id of B3_MIGRATED) {
    const r = db.instruments.relationships.find((x) => x.id === id);
    assert.ok(r, `${id} exists`);
    assert.ok(!isV1(r) && r.sources.length, `${id} is back to bare ids`);
    /* a textual edge is stated by the law, so it needs a direct reference;
       an analytical one (rel-ai-act-pld) may rest on partial ones and its claims */
    if (['rel-kind:amends', 'rel-kind:repeals', 'rel-kind:lex-specialis'].includes(r.kind))
      assert.ok(r.sources.some((s) => s.supports === 'supports:direct'), `${id} has no direct reference`);
    for (const s of r.sources) {
      assert.ok(src.has(s.source_id), `${id}: ${s.source_id} resolves`);
      if (s.supports === 'supports:direct' && src.get(s.source_id).tier === 'tier:1')
        assert.ok(structural(s.locator), `${id}: a direct tier-1 reference without a structural locator (${s.locator})`);
    }
    assert.equal(r.last_verified, '2026-10-27');
  }
  const v1 = db.instruments.relationships.filter(isV1).map((r) => r.id);
  for (const id of v1) assert.ok(B3_STILL_V1.includes(id), `${id} is a new v1 relationship — every relationship added after 25 Oct 2026 is v2`);
  /* and the test can fail: a migrated edge put back to bare ids is caught */
  const planted = loadDb();
  planted.instruments.relationships.find((x) => x.id === 'rel-nis2-nis1').sources = ['src-eurlex-nis2'];
  assert.ok(planted.instruments.relationships.filter(isV1).some((r) => !B3_STILL_V1.includes(r.id)));
});

/* ---------------------------------------------------------- W18 · item 10.2

   A note in data/ is where provenance lives; what a reader is shown of it is
   js/format.js readerText(), and the rule it applies is internalRefs()
   (docs/ROADMAP-v2.md §8, item 10.2): no docs/ or code path, no record id in
   prose, no commit, no workflow code, no raw taxonomy id, no field name. */

const W18_FIELDS = (db) => {
  const out = [];
  const add = (where, text) => { if (text) out.push({ where, text }); };
  for (const dim of ['relationship_kind', 'actor', 'sector', 'activity', 'territory'])
    for (const t of db.taxonomy[dim] || []) add(`taxonomy ${t.id}`, t.note);
  for (const i of db.instruments.instruments) add(`status_note ${i.id}`, i.status_note);
  for (const r of db.instruments.relationships) add(`relationship ${r.id}`, r.verification_note);
  for (const s of db.sources.sources) add(`source ${s.id}`, s.note);
  for (const c of db.claims.claims) add(`claim ${c.id}`, c.verification_note);
  for (const e of db.enforcement.enforcement) { add(`enforcement ${e.id}`, e.verification_note); add(`appeal ${e.id}`, e.appeal && e.appeal.note); }
  for (const x of db.institutions.institutions) for (const c of x.competences || []) add(`competence ${x.id} ${c.instrument}`, c.note);
  return out;
};

/* the visible text of a static page: no script, style or comment, entities decoded */
const visibleText = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&[a-z#0-9]+;/gi, ' ');

/* every generated or static page a reader opens; the datasets explorer shows
   the raw records as records, by design, and is outside the rule */
const W18_PAGES = () => [
  ...readdirSync(ROOT).filter((f) => f.endsWith('.html') && f !== 'datasets.html'),
  ...['it', 'fr', 'es'].map((l) => `${l}/index.html`),
  ...readdirSync(join(ROOT, 'instruments')).map((d) => `instruments/${d}/index.html`),
].filter((f) => existsSync(join(ROOT, f)));

test('W18 · item 10.2: no internal reference reaches a reader — every displayed note through readerText(), and every page', async () => {
  const F = await import('../js/format.js');
  const db = loadDb();
  const ix = buildIndex(db);
  const fields = W18_FIELDS(db);
  const leaks = (filter) => fields.flatMap(({ where, text }) =>
    F.internalRefs(filter(text), ix).map((m) => `${where}: ${m}`));
  /* the check holds on every note a renderer prints */
  assert.deepEqual(leaks((t) => F.readerText(t, ix, { html: false })), []);
  /* and it is the filter that holds it: with the control off, the same check fails on this tree,
     on each of the three cases item 10.3 names */
  const raw = leaks((t) => t);
  for (const re of [/docs\/V2-DATA-DESIGN\.md/, /clm-eidas2-wallets/, /commit 282a782/])
    assert.ok(raw.some((l) => re.test(l)), `with no filter, ${re} reaches a reader`);

  /* planted: a docs/ path, a claim id, a commit — each caught raw, each gone through the filter */
  for (const note of ['Re-read (docs/AUDIT-2026-10-14.md §1 F) today.', 'Carried by clm-gdpr-total-fines.', 'Moved on 21 Oct 2026 (commit 1895845).']) {
    assert.ok(F.internalRefs(note, ix).length, `the rule sees ${note}`);
    assert.deepEqual(F.internalRefs(F.readerText(note, ix, { html: false }), ix), [], `the filter cleans ${note}`);
  }
  /* what the rule must NOT see: case numbers, Council documents, a court URL, an agenda item */
  assert.deepEqual(F.internalRefs('Cases T-55/24 and T-58/24; ST 13112/26; Item 1; https://curia.europa.eu/site/upload/docs/application/pdf/2025-09/cp250107en.pdf', ix), []);

  /* the approved texts, word for word (§8, 28 Oct 2026) */
  const { interactionBlock } = await import('../js/interactions.js');
  const kindNote = (kind) => {
    const r = db.instruments.relationships.find((x) => x.kind === kind);
    return interactionBlock(r, ix, r.from, '').match(/<p class="ix-kindnote">([^<]*)<\/p>/)[1].replace(/&#39;|&#x27;/g, "'");
  };
  assert.equal(kindNote('rel-kind:enables'), "The other instrument's provisions operate through definitions, bodies, means or populations this instrument establishes, and say so. Recorded only on an express reference in the DEPENDENT instrument's text; the locator is in that text. Added 27 Oct 2026.");
  assert.equal(kindNote('rel-kind:defers-to'), "This instrument leaves a matter to the other: a without-prejudice clause, a 'shall not affect' clause or an express reference sending the reader there. The locator is in the DEFERRING instrument's text. Added 27 Oct 2026.");
  const say = (id) => F.readerText(instOf(db, id).status_note, ix, { html: false });
  assert.match(say('eidas2'), /by 24 December 2026 \(Art\. 5a\(1\)\), and private relying parties/);
  assert.match(say('data-omnibus'), /\(ST 13112\/26\) and, on 2 October, by a draft negotiating mandate put to Coreper \(ST 13886\/26\);/);
  assert.match(say('data-act'), /The verification date moved from 27 Aug to 27 Sep 2026 on 21 Oct 2026, the date on which the status above was re-read against Arts 29 and 50;/);
  /* the provenance stays in the record: the data is unchanged */
  assert.match(instOf(db, 'eidas2').status_note, /clm-eidas2-wallets/);
  assert.match(instOf(db, 'data-act').status_note, /commit 282a782/);

  /* the pages: generated instrument pages, the static pages and the three editions */
  const pageLeaks = W18_PAGES().flatMap((f) => F.internalRefs(visibleText(readFileSync(join(ROOT, f), 'utf8')), ix).map((m) => `${f}: ${m}`));
  assert.deepEqual(pageLeaks, []);
  /* and the page scan can fail: the kind note as it was printed before item 10.2 */
  assert.ok(F.internalRefs(visibleText('<p class="ix-kindnote">Added 27 Oct 2026 (docs/V2-DATA-DESIGN.md §1.4).</p>'), ix).length);
  /* R8, the bibliography's own copy */
  const bib = visibleText(readFileSync(join(ROOT, 'bibliography.html'), 'utf8')).replace(/\s+/g, ' ').replace(/ ([.,])/g, '$1');
  assert.ok(bib.includes("each computed from the site's datasets when this page loads — none of these numbers is written into the page. The open backlog is the same computation the build runs, in the site's data validator."));
});

/* ---------------------------------------------------------------------------
   AUDIT-2026-10-28 (P0): the Data Omnibus's Council mandate, the bibliography's
   static count, and the institutional-status review interval.
   --------------------------------------------------------------------------- */

/* What every page and edition said until 28 Oct 2026. Each pattern is planted
   below, so a pattern that could no longer fire would fail the test. */
const NO_MANDATE = [
  /no Council (negotiating )?mandate (has been )?reported/,
  /has no Council mandate/,
  /Data Omnibus: proposal, no Council mandate/,
  /no outcome of that meeting had been published/,
  /sin mandato del Consejo|no tiene mandato del Consejo|no consta ning&uacute;n mandato del Consejo/,
  /sans mandat du Conseil|n&rsquo;a pas de mandat du Conseil|aucun mandat du Conseil/,
  /senza mandato del Consiglio|non ha un mandato del Consiglio|non risulta alcun mandato del Consiglio/,
  /* Part IX, part-9.p8, until 29 Oct 2026 (V2C-67): the audit corrected Part
     VIII, and none of the patterns above matched this sentence's wording */
  /has yet to agree a mandate/,
  /non ha ancora concordato un mandato/,
  /n&rsquo;a toujours pas arr&ecirc;t&eacute; de mandat/,
  /a&uacute;n no ha acordado un mandato/,
];
const saysNoMandate = (s) => NO_MANDATE.filter((re) => re.test(s)).map(String);

test('P1 · the Data Omnibus Council mandate rests on the Council register, and no page or edition says there is none', () => {
  /* the patterns fire on the text they replaced */
  for (const old of [
    'with no Council negotiating mandate reported and no Parliament position as at 21 October 2026',
    'Data Omnibus: proposal, no Council mandate',
    'As at 21 October 2026 no Council mandate has been reported',
    'no outcome of that meeting had been published when this was checked on 21 October 2026',
    'Data Omnibus: propuesta, sin mandato del Consejo', 'Data Omnibus&nbsp;: proposition, sans mandat du Conseil',
    'Data Omnibus: proposta, senza mandato del Consiglio',
    "the Council has yet to agree a mandate on the Commission's own GDPR reforms",
    'il Consiglio non ha ancora concordato un mandato sulle riforme del GDPR',
    'le Conseil n&rsquo;a toujours pas arr&ecirc;t&eacute; de mandat sur les r&eacute;formes du GDPR',
    'el Consejo a&uacute;n no ha acordado un mandato sobre las reformas del GDPR']) assert.ok(saysNoMandate(old).length, old);

  /* the record: one claim, carried by the Council's own outcome of proceedings */
  const claims = new Map(readData('claims.json').claims.map((c) => [c.id, c]));
  const sources = new Map(readData('sources.json').sources.map((s) => [s.id, s]));
  const c = claims.get('clm-data-omnibus-council-mandate');
  assert.ok(c, 'the mandate is a claim');
  assert.equal(c.type, 'claim-type:fact');
  assert.match(c.statement, /agreed the Council's mandate for negotiations with the European Parliament .* on 21 October 2026/);
  assert.match(c.statement, /ST 14756\/26/);
  assert.deepEqual(c.sources.map((r) => [r.source_id, r.supports]), [['src-council-st-14756-2026', 'supports:direct']]);
  const s = sources.get('src-council-st-14756-2026');
  assert.equal(s.tier, 'tier:2');
  assert.equal(s.publisher, 'council');
  assert.equal(s.url, 'https://data.consilium.europa.eu/doc/document/ST-14756-2026-INIT/en/pdf');
  assert.equal(s.published, '2026-10-22');

  /* the superseded state is not restated as current anywhere a reader sees it */
  for (const id of ['clm-data-omnibus-coreper-21-october', 'clm-data-omnibus-parliament-stage', 'clm-data-omnibus-council-mandate'])
    assert.deepEqual(saysNoMandate(claims.get(id).statement), [], id);
  const om = readData('instruments.json').instruments.find((i) => i.id === 'data-omnibus');
  const opening = om.status_note.split(' Council: ')[0];
  assert.deepEqual(saysNoMandate(opening), []);
  assert.match(opening, /negotiating mandate, agreed by the Permanent Representatives Committee on 21 October 2026 \(ST 14756\/26, clm-data-omnibus-council-mandate\)/);
  assert.ok(om.claims.includes('clm-data-omnibus-council-mandate') && om.sources.includes('src-council-st-14756-2026'));
  assert.ok(om.status_as_of >= '2026-10-22', 'the status was read after the outcome was published');
  assert.equal(om.kind, 'kind:proposal', 'a negotiating mandate makes nothing law');
  /* the previous state and the reason stay in the record (docs/DATA-GOVERNANCE.md) */
  assert.match(om.status_note, /'with no Council negotiating mandate reported and no Parliament position as at 21 October 2026'/);
  assert.match(claims.get('clm-data-omnibus-coreper-21-october').verification_note, /It read: 'no outcome of that meeting had been published/);

  /* the brief, its three editions, their overlays and the generated instrument page */
  for (const f of ['index.html', 'es/index.html', 'fr/index.html', 'it/index.html', 'i18n/es.json', 'i18n/fr.json', 'i18n/it.json'])
    assert.deepEqual(saysNoMandate(readFileSync(join(ROOT, f), 'utf8')), [], f);
  const page = readFileSync(join(ROOT, 'instruments/data-omnibus/index.html'), 'utf8');
  assert.match(page, /id="clm-data-omnibus-council-mandate"/);
  assert.deepEqual(saysNoMandate(visibleText(page).split('28 Oct 2026 (')[0]), [], 'the page, before the status note\'s own provenance');
  /* and Part VIII cites the record its sentence rests on */
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  for (const key of ['part-8.li2', 'part-8.p4', 'part-9.p8'])
    assert.match(html, new RegExp(`data-i18n="${key.replace('.', '\\.')}" data-claim="[^"]*clm-data-omnibus-council-mandate`), key);
});

test('P2 · the bibliography and the datasets page count what data/ holds, and a source added without regenerating is caught', async () => {
  const n = readData('sources.json').sources.length;
  const bib = readFileSync(join(ROOT, 'bibliography.html'), 'utf8');
  assert.equal(Number(bib.match(/every source, (\d+) in all/)[1]), n, 'the no-script fallback');
  assert.equal(new Set([...bib.matchAll(/<li id="(src-[a-z0-9-]+)">/g)].map((m) => m[1])).size, n, 'one entry per source');
  const ds = readFileSync(join(ROOT, 'datasets.html'), 'utf8');
  assert.equal(Number(ds.match(/<span class="ri-sub">(\d+) in sources<\/span>/)[1]), n);
  assert.equal(Number(ds.match(/<span class="ri-sub">(\d+) in claims<\/span>/)[1]), readData('claims.json').claims.length);

  const dir = siteCopy('bib-count');
  try {
    edit(dir, 'data/sources.json', (s) => s.replace('\n    {\n      "id": "src-council-st-14756-2026",',
      '\n    {\n      "id": "src-planted-p2",\n      "tier": "tier:4",\n      "type": "source-type:commentary",\n      "publisher": null,\n      "publisher_name": "Planted",\n      "title": "Planted",\n      "url": null,\n      "url_status": "url:none",\n      "published": null,\n      "accessed": null,\n      "language": "en",\n      "note": "planted"\n    },\n    {\n      "id": "src-council-st-14756-2026",'));
    const problems = await staleSite(dir);
    assert.ok(problems.includes('bibliography.html is stale'), problems.join('\n'));
    assert.ok(problems.includes('datasets.html is stale'), problems.join('\n'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('P3 · a co-legislator\'s stage on a file still in procedure is reviewed as institutional status (30 days), not as a general fact', () => {
  const insts = new Map(readData('instruments.json').instruments.map((i) => [i.id, i]));
  const claims = new Map(readData('claims.json').claims.map((c) => [c.id, c]));
  const risk = (c, withInst = true) => EM.riskClass('claim', c, { asOf: '2026-10-28', instrumentById: withInst ? insts : undefined });
  for (const id of ['clm-data-omnibus-council-mandate', 'clm-data-omnibus-council-october', 'clm-data-omnibus-parliament-stage', 'clm-data-omnibus-stalled'])
    assert.equal(risk(claims.get(id)), 'risk:high', id);
  assert.equal(EM.RISK_TTL_DAYS['risk:high'], 30, 'docs/EVIDENCE-MODEL.md §8');
  /* what does not move: a law claim about a proposal, a co-legislator's history on an adopted act, a claim naming no co-legislator */
  assert.equal(risk(claims.get('clm-cloud-ai-act-dual-basis')), 'risk:medium');
  assert.equal(risk(claims.get('clm-ai-omnibus-legislative-path')), 'risk:medium');
  assert.equal(risk({ ...claims.get('clm-data-omnibus-council-mandate'), institutions: ['ec'] }), 'risk:medium');
  /* without the instruments the rule cannot fire: the class is the old one */
  assert.equal(risk(claims.get('clm-data-omnibus-council-mandate'), false), 'risk:medium');
  /* the record that read "no outcome published" on 21 Oct would have been fresh under either class on 22 Oct:
     no interval catches a change the next day, which is why the claim is re-read before every publication */
  assert.equal(EM.freshnessState('2026-10-21', 'risk:high', '2026-10-22'), 'freshness:fresh');
  /* and the work list shows the one now due */
  assert.equal(EM.freshnessState(claims.get('clm-data-omnibus-stalled').last_verified, risk(claims.get('clm-data-omnibus-stalled')), '2026-10-28'), 'freshness:review-due');
  const out = execFileSync('node', [join(ROOT, 'tools/freshness.mjs'), '--as-of', '2026-10-28'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /high\s+review-due clm-data-omnibus-stalled/);
});

/* ---------------------------------------------------------------------------
   v2 Session 12, item 12.1 (V2C-01): an edge a proposal states is not read as
   law. Its modality is derived by js/map-model.js from the act whose text
   states it (docs/ROADMAP-v2.md §8, question 1), and its kind is printed
   "Proposed: amends", never "Amends" alone (question 2).
   --------------------------------------------------------------------------- */

const unescHtml = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');

/* Every proposed edge printed with its kind in the present tense, in one
   page's HTML: the interaction card heads and, on an instrument page, the
   "Related" list. Read from the markup, so it judges what a reader sees. */
const presentTenseEdges = async (html, ix, pageId = null) => {
  const { modality } = await import('../js/map-model.js');
  const { label } = await import('../js/data.js');
  const byName = new Map([...new Set(ix.instrument.values())].map((i) => [i.short_name, i.id]));
  const edges = ix.relationship || [];
  const out = [];
  const head = /<p class="ix-head">(?:<a href="[^"]*">|<b class="ix-self">)([^<]*)<\/[ab]> <span class="ix-rel"[^>]*>([^<]*)<\/span> (?:<a href="[^"]*">|<b class="ix-self">)([^<]*)<\/[ab]><\/p>/g;
  for (const [, a, shown, b] of html.matchAll(head)) {
    const from = byName.get(unescHtml(a)); const to = byName.get(unescHtml(b));
    for (const r of edges.filter((x) => x.from === from && x.to === to && modality(x, ix) === 'proposed'))
      if (shown !== 'Proposed: ' + label(ix, r.kind).toLowerCase()) out.push(`card ${r.id}: "${shown}"`);
  }
  const col = pageId && /<div class="rel-col"><h3>Instruments<\/h3><ul>([\s\S]*?)<\/ul>/.exec(html);
  if (col) {
    for (const [, name, shown] of col[1].matchAll(/<li><a href="[^"]*">([^<]*)<span class="n">([^<]*)<\/span><\/a><\/li>/g)) {
      const other = byName.get(unescHtml(name));
      const parts = shown.split(' · ');
      for (const r of edges.filter((x) => ((x.from === pageId && x.to === other) || (x.to === pageId && x.from === other)) && modality(x, ix) === 'proposed')) {
        const l = label(ix, r.kind);
        if (parts.includes(l) || !parts.includes('Proposed: ' + l.toLowerCase())) out.push(`related ${r.id}: "${shown}"`);
      }
    }
  }
  return out;
};

test('V1 · 12.1: no edge whose derived modality is "proposed" is printed with its kind in the present tense, on any page', async () => {
  const MM = await import('../js/map-model.js');
  const { interactionBlock } = await import('../js/interactions.js');
  const { renderInstrument } = await import('../js/instrument-view.js');
  const db = loadDb();
  const ix = buildIndex(db);

  /* the holder table names every kind the taxonomy has, and nothing else: a new kind is decided, not guessed */
  assert.deepEqual(Object.keys(MM.HOLDER).sort(), db.taxonomy.relationship_kind.map((t) => t.id).sort());
  assert.equal(MM.modality({ kind: 'rel-kind:unheard-of', from: 'gdpr', to: 'dsa' }, ix), null);

  /* the rule, measured on this tree: the 8 edges §8 names, and no other */
  const proposed = db.instruments.relationships.filter((r) => MM.modality(r, ix) === 'proposed').map((r) => r.id).sort();
  assert.deepEqual(proposed, ['rel-data-act-cloud-ai-act', 'rel-data-omnibus-data-act-amends', 'rel-data-omnibus-dga-repeals',
    'rel-data-omnibus-gdpr', 'rel-data-omnibus-p2b-repeals', 'rel-digital-networks-act-eprivacy-amends',
    'rel-digital-networks-act-gdpr-defers', 'rel-digital-networks-act-nis2-defers']);
  assert.ok(db.instruments.relationships.every((r) => MM.modality(r, ix) !== null), 'every edge has a modality');

  /* derived, never stored: no edge carries it, and it follows the holder's status */
  assert.ok(db.instruments.relationships.every((r) => !('modality' in r)));
  const adopted = loadDb();
  instOf(adopted, 'data-omnibus').legislative_status = 'status:in-force';
  const ixA = buildIndex(adopted);
  assert.equal(MM.modality(adopted.instruments.relationships.find((r) => r.id === 'rel-data-omnibus-gdpr'), ixA), 'law', 'adopted, its edge is law the same day');
  /* V2C-16: an enables edge INTO a proposal is proposed (the holder is the dependent act), and one out of it to the law is too, the other way */
  assert.equal(MM.modality({ kind: 'rel-kind:enables', from: 'eidas', to: 'digital-networks-act' }, ix), 'proposed');
  assert.equal(MM.modality({ kind: 'rel-kind:enables', from: 'digital-networks-act', to: 'eidas' }, ix), 'law');
  assert.equal(MM.modality({ kind: 'rel-kind:legal-basis', from: 'tfeu', to: 'digital-networks-act' }, ix), 'proposed');
  assert.equal(MM.modality({ kind: 'rel-kind:overlap', from: 'gdpr', to: 'digital-networks-act' }, ix), 'proposed');

  /* every card the site can draw (the instrument pages, instrument.html?id=, the not-covered
     pages and the brief's Part IX overview all draw interactionBlock) */
  const cards = db.instruments.relationships.map((r) => interactionBlock(r, ix, r.from, '')).join('');
  assert.deepEqual(await presentTenseEdges(cards, ix), []);
  assert.equal((cards.match(/data-modality="proposed"/g) || []).length, 8);
  /* every instrument view, generated or rendered on request */
  const views = [];
  for (const inst of new Set(ix.instrument.values())) {
    const html = renderInstrument(inst, { ix, db, overlay: {}, today: null, root: '' });
    views.push(...(await presentTenseEdges(html, ix, inst.id)).map((m) => `${inst.id}: ${m}`));
  }
  assert.deepEqual(views, []);
  /* every static page, the generated instrument pages and the three editions */
  const pages = [];
  for (const f of W18_PAGES()) {
    const html = readFileSync(join(ROOT, f), 'utf8');
    const id = /<body[^>]*data-instrument="([^"]+)"/.exec(html)?.[1] || null;
    pages.push(...(await presentTenseEdges(html, ix, id)).map((m) => `${f}: ${m}`));
  }
  assert.deepEqual(pages, []);
  const dna = readFileSync(join(ROOT, 'instruments/digital-networks-act/index.html'), 'utf8');
  assert.match(dna, /<span class="ix-rel">Proposed: amends<\/span>/);
  assert.match(dna, />ePrivacy<span class="n">Proposed: amends<\/span>/);

  /* and the check can fail: the rule switched off, as the page read before 12.1 */
  const before = dna.replaceAll('Proposed: amends', 'Amends').replaceAll('Proposed: defers to', 'Defers to');
  const caught = await presentTenseEdges(before, ix, 'digital-networks-act');
  assert.ok(caught.some((m) => /^card rel-digital-networks-act-eprivacy-amends/.test(m)), caught.join('\n'));
  assert.ok(caught.some((m) => /^related rel-digital-networks-act-eprivacy-amends/.test(m)), caught.join('\n'));
  assert.equal(caught.length, 6, 'three cards and three Related entries');
});

/* ---------------------------------------------------------------------------
   v2 Session 12, item 12.2: the check reads the applicability rules.
   tools/trigger-audit.mjs, at the severities of docs/ROADMAP-v2.md §8,
   v2 Session 12, question 5. A check that cannot be shown to fire is a check
   on nothing (docs/V2-DATA-DESIGN.md §4.3): every ERROR rule is planted.
   --------------------------------------------------------------------------- */

/* v2 Session 17 (29 Oct 2026, docs/ROADMAP-v2.md §8, 17.0 questions 7 and 9):
   RULES_V1 and BACKLOG_CODES are gone with the backlog they held; every
   T-01…T-05 and T-10 finding is an ERROR for every rule. */
import { triggerAudit } from './trigger-audit.mjs';

/* The 33 rules of 28 Oct 2026, frozen here as a literal list. Until v2
   Session 17 it was the baseline RULES_V1 shrank against (docs/ROADMAP-v2.md
   §8, v2 Session 13, question 5); since the flip it is the list of rules the
   v2 shape holds, all 33. */
const RULES_2026_10_28 = Object.freeze(['ap-gdpr-01', 'ap-gdpr-02', 'ap-gdpr-03', 'ap-gdpr-04', 'ap-dsa-01',
  'ap-dsa-02', 'ap-dsa-03', 'ap-dsa-04', 'ap-dsa-05', 'ap-dma-01', 'ap-dma-02', 'ap-dma-03', 'ap-dma-04',
  'ap-ai-act-01', 'ap-ai-act-02', 'ap-ai-act-03', 'ap-ai-act-04', 'ap-ai-act-05', 'ap-ai-act-06', 'ap-ai-act-07',
  'ap-data-act-01', 'ap-data-act-02', 'ap-data-act-03', 'ap-data-act-04', 'ap-nis2-01', 'ap-nis2-02', 'ap-nis2-03',
  'ap-dora-01', 'ap-dora-02', 'ap-cra-01', 'ap-pld-01', 'ap-eidas2-01', 'ap-cross-01']);
/* the rules brought to the v2 shape, by session: they left RULES_V1. v2 Session 13 (29 Oct 2026):
   the pilot; v2 Session 14 (29 Oct 2026, §8 14.0 question 5): the GDPR's five; v2 Session 15
   (29 Oct 2026, §8 15.0 question 7): the DSA's five and the DMA's four; v2 Session 16 (29 Oct 2026,
   §8 16.0 question 7): the AI Act's seven; v2 Session 17 (29 Oct 2026, §8 17.0 question 9): the
   Data Act's four, NIS2's three, DORA's two and the CRA's one, the last ten */
const RULES_PILOT = Object.freeze(['ap-pld-01', 'ap-eidas2-01']);
const RULES_GDPR = Object.freeze(['ap-gdpr-01', 'ap-gdpr-02', 'ap-gdpr-03', 'ap-gdpr-04', 'ap-cross-01']);
const RULES_DSA_DMA = Object.freeze(['ap-dsa-01', 'ap-dsa-02', 'ap-dsa-03', 'ap-dsa-04', 'ap-dsa-05',
  'ap-dma-01', 'ap-dma-02', 'ap-dma-03', 'ap-dma-04']);
const RULES_AI_ACT = Object.freeze(['ap-ai-act-01', 'ap-ai-act-02', 'ap-ai-act-03', 'ap-ai-act-04', 'ap-ai-act-05',
  'ap-ai-act-06', 'ap-ai-act-07']);
const RULES_DA_NIS2_DORA_CRA = Object.freeze(['ap-data-act-01', 'ap-data-act-02', 'ap-data-act-03', 'ap-data-act-04',
  'ap-nis2-01', 'ap-nis2-02', 'ap-nis2-03', 'ap-dora-01', 'ap-dora-02', 'ap-cra-01']);
const RULES_V2 = Object.freeze([...RULES_PILOT, ...RULES_GDPR, ...RULES_DSA_DMA, ...RULES_AI_ACT, ...RULES_DA_NIS2_DORA_CRA]);

const ruleOf = (db, id) => db.applicability.rules.find((r) => r.id === id);
/* a v2 rule that passes T-01…T-05: the shape docs/v2-design/applicability-rule.schema.json describes */
const v2Rule = (db) => {
  const r = structuredClone(ruleOf(db, 'ap-gdpr-02'));
  r.sources = [{ source_id: 'src-eurlex-gdpr', supports: 'supports:direct', locator: 'Art. 3(2)', for: 'scope' }];
  r.condition_provisions = Object.fromEntries(Object.keys(r.conditions).map((d) => [d, ['gdpr:art-5']]));
  r.exemptions = [];
  return r;
};

test('X1 · 12.2, this tree: the 33 rules read, 0 errors, every rule publishable, and no backlog left', () => {
  const db = loadDb();
  /* as of the tree's newest verification date (§8, v2 Session 13: the pilot rules were read on
     29 Oct 2026), the rule test F1 applies to freshness: nothing date-dependent is reported */
  const t = triggerAudit(db, '2026-10-29');
  assert.equal(t.total, 33);
  assert.deepEqual(t.errors, []);
  assert.deepEqual(t.warnings, []);
  /* the flip (v2 Session 17, 29 Oct 2026, §8 17.0 questions 7 and 9): the backlog was 33/33/33/13/3/10
     on 28 Oct 2026, as the author was shown it (§8, v2 Session 12, question 5), and only shrank —
     10/10/10/2/0/2 after v2 Session 16 — until the last ten rules were read; then it was removed, so
     the audit returns none, and a finding of those checks is an ERROR for every rule */
  assert.equal(t.backlog, undefined, 'no backlog: every rule is held in full');
  assert.deepEqual([...t.publishable].sort(), [...RULES_V2].sort(), 'publishable: exactly the rules brought to v2');
  assert.deepEqual([...RULES_V2].sort(), [...RULES_2026_10_28].sort(), 'all 33 are v2');
  assert.deepEqual([...RULES_2026_10_28].sort(), db.applicability.rules.map((r) => r.id).sort(), 'no rule added since 28 Oct 2026');
  /* the date-dependent halves are WARNINGs: an older date changes the report, never the exit code */
  const sept = triggerAudit(db, '2026-09-27');
  assert.deepEqual(sept.errors, []);
  /* every rule read on 29 Oct 2026 (v2 Sessions 13 to 17), in file order: all 33 since v2 Session 17 */
  assert.deepEqual(sept.warnings, db.applicability.rules.map((r) => r.id)
    .map((id) => `VERIFIED_AFTER_AS_OF applicability/${id}: last_verified 2026-10-29 is after the audit date 2026-09-27`));
  const early = triggerAudit(db, '2024-06-01');
  assert.deepEqual(early.errors, []);
  assert.ok(early.warnings.some((w) => /^APPLIES_BEFORE_DATE applicability\/ap-ai-act-01/.test(w)));
});

test('X2 · 12.2: every ERROR rule fires on a planted defect, and a v2 rule that meets T-01…T-05 is publishable', () => {
  const plant = (fn, asOf = '2026-10-28') => { const db = loadDb(); fn(db); return triggerAudit(db, asOf); };
  const errs = (t, re) => t.errors.filter((e) => re.test(e));

  /* the control: a clean v2 rule is publishable and in no backlog but the dates */
  const clean = plant((db) => { db.applicability.rules[db.applicability.rules.findIndex((r) => r.id === 'ap-gdpr-02')] = v2Rule(db); });
  assert.deepEqual(clean.errors, []);
  assert.ok(clean.publishable.includes('ap-gdpr-02'));

  const swap = (fn) => (db) => { const r = v2Rule(db); fn(r, db); db.applicability.rules[db.applicability.rules.findIndex((x) => x.id === 'ap-gdpr-02')] = r; };
  /* T-02: object references with no scope basis, and one that does not resolve */
  assert.equal(errs(plant(swap((r) => { r.sources[0].for = 'rationale'; })), /^T-02 applicability\/ap-gdpr-02: no for:scope/).length, 1);
  /* a reference that does not resolve is validate.mjs's to report since v2 Session 13 (§8, 13.0
     question 2: one home per check, test Y1); here it reports nothing and only keeps the rule from
     being publishable */
  const dangling = plant(swap((r) => { r.sources.push({ source_id: 'src-not-a-source', supports: 'supports:direct', locator: 'Art. 1' }); }));
  assert.deepEqual(dangling.errors, []);
  assert.ok(!dangling.publishable.includes('ap-gdpr-02'));
  assert.equal(errs(plant(swap((r) => { r.sources[0].locator = 'the Regulation'; })), /^T-02 /).length, 1, 'a locator that is not structural');
  /* T-03: a dimension with no provision, and a provision of an unconnected instrument */
  assert.equal(errs(plant(swap((r) => { delete r.condition_provisions[Object.keys(r.conditions)[0]]; })), /^T-03 .*names no provision/).length, 1);
  assert.equal(errs(plant(swap((r) => { r.condition_provisions[Object.keys(r.conditions)[0]] = ['dora:art-5']; })), /^T-03 .*neither this rule's nor connected/).length, 1);
  /* T-03 does not read thresholds as a dimension: they have their own basis, T-05 (v2 Session 15,
     29 Oct 2026, §8 "T-03 and thresholds"). A planted threshold with its threshold_basis leaves the
     rule with no T-03 finding */
  const thr = plant(swap((r) => {
    r.conditions.thresholds = { planted_count_gte: 1 };
    r.threshold_basis = { planted_count_gte: [{ source_id: 'src-eurlex-gdpr', supports: 'supports:direct', locator: 'Art. 3(2)' }] };
  }));
  assert.equal(errs(thr, /^T-03 /).length, 0);
  /* T-04: an exemption object with no basis */
  assert.equal(errs(plant(swap((r) => { r.exemptions = [{ text: 'Purely personal or household activity.', effect: 'excludes', basis: [] }]; })), /^T-04 /).length, 1);
  /* T-05: a key without its comparator */
  assert.equal(errs(plant((db) => { const r = ruleOf(db, 'ap-ai-act-03'); r.conditions.thresholds = { cumulative_training_flop: 1e25 }; }), /^T-05 .*cumulative_training_flop/).length, 1);
  /* T-06: an uncertain outcome that does not say what it turns on */
  assert.equal(errs(plant((db) => { const r = db.applicability.rules.find((x) => x.outcome === 'outcome:likely'); r.depends_on = []; }), /^T-06 /).length, 1);
  /* T-07: a date that is not one */
  assert.equal(errs(plant((db) => { ruleOf(db, 'ap-gdpr-01').last_verified = '27/08/2026'; }), /^T-07 /).length, 1);
  /* T-08: a proposal binds nobody */
  assert.equal(errs(plant((db) => { ruleOf(db, 'ap-gdpr-01').instrument = 'data-omnibus'; }), /^T-08 applicability\/ap-gdpr-01: applies on data-omnibus/).length, 1);
  /* T-09: a rule on an excluded instrument is an error; on a watched one, a warning */
  const excluded = loadDb().instruments.instruments.find((i) => i.scope_decision?.disposition === 'excluded').id;
  const watched = loadDb().instruments.instruments.find((i) => i.scope_decision?.disposition === 'watched').id;
  assert.equal(errs(plant((db) => { ruleOf(db, 'ap-gdpr-04').instrument = excluded; ruleOf(db, 'ap-gdpr-04').outcome = 'outcome:possible'; }), /^T-09 /).length, 1);
  assert.ok(plant((db) => { ruleOf(db, 'ap-gdpr-04').instrument = watched; ruleOf(db, 'ap-gdpr-04').outcome = 'outcome:possible'; })
    .warnings.some((w) => /^RULE_ON_WATCHED applicability\/ap-gdpr-04/.test(w)));
  /* every rule is held in full (v2 Session 17, 29 Oct 2026, §8 17.0 questions 7 and 9): until the
     flip a rule added after the 33 was, and the 33 carried their gaps as backlog; now a rule given back
     a bare id has the two ERRORs, with no "held to it in full" suffix, and so does a new rule */
  const bare = plant((db) => { ruleOf(db, 'ap-data-act-01').sources = ['src-eurlex-data-act']; }, '2026-10-29');
  assert.deepEqual(bare.errors, ['T-01 applicability/ap-data-act-01: a bare source id', 'T-02 applicability/ap-data-act-01: no scope reference']);
  assert.ok(!bare.publishable.includes('ap-data-act-01'));
  const added = plant((db) => {
    const r = { ...structuredClone(ruleOf(db, 'ap-data-act-01')), id: 'ap-gdpr-99' };
    r.sources = ['src-eurlex-data-act'];
    db.applicability.rules.push(r);
  }, '2026-10-29');
  assert.ok(added.errors.includes('T-01 applicability/ap-gdpr-99: a bare source id'));
  assert.ok(![...bare.errors, ...added.errors].some((e) => /held to it in full/.test(e)));
  assert.equal(added.backlog, undefined);
  /* T-10 is an ERROR: ap-data-act-02 without the date question 2a gave it */
  assert.deepEqual(plant((db) => { ruleOf(db, 'ap-data-act-02').dates = ['tl-data-act-2027-01-12-application']; }, '2026-10-29').errors,
    ['T-10 applicability/ap-data-act-02: dates omit tl-data-act-2025-09-12-application']);

  /* T-12 (v2 Session 17, §8 17.0 question 8a): the law a rule cites moved after it was read. A WARNING */
  const law = (t) => t.warnings.filter((w) => /^LAW_CHANGED_SINCE_VERIFIED /.test(w));
  const real = triggerAudit(loadDb(), '2027-03-26');
  assert.deepEqual(law(real), ['LAW_CHANGED_SINCE_VERIFIED applicability/ap-cra-01: cites cra, amended by ehds (rel-ehds-cra-amends), whose tl-ehds-2027-03-26-application (2027-03-26) is after last_verified 2026-10-29']);
  assert.deepEqual(law(triggerAudit(loadDb(), '2026-10-29')), []);
  const omni = plant((db) => { ruleOf(db, 'ap-ai-act-01').last_verified = '2026-07-01'; }, '2026-10-29');
  assert.deepEqual(law(omni), ['LAW_CHANGED_SINCE_VERIFIED applicability/ap-ai-act-01: cites ai-act, amended by ai-omnibus (rel-ai-omnibus-ai-act), whose tl-ai-omnibus-2026-07-27-entry-into-force (2026-07-27) is after last_verified 2026-07-01']);
  assert.deepEqual(omni.errors, []);
  /* a proposed edge never counts: the Data Omnibus, given an entry into force it does not have */
  const proposed = plant((db) => {
    ruleOf(db, 'ap-data-act-01').last_verified = '2026-10-01';
    db.timeline.events.push({ id: 'tl-planted-omnibus-eif', date: '2026-10-28', date_precision: 'precision:day', event_type: 'event:entry-into-force', instrument: 'data-omnibus', provisions: [] });
  }, '2026-10-29');
  assert.deepEqual(law(proposed), []);
  /* a judicial event of the cited instrument does */
  const judged = plant((db) => {
    db.timeline.events.push({ id: 'tl-planted-cra-judicial', date: '2026-11-02', date_precision: 'precision:day', event_type: 'event:judicial', instrument: 'cra', provisions: [] });
  }, '2026-11-03');
  assert.deepEqual(law(judged), ['LAW_CHANGED_SINCE_VERIFIED applicability/ap-cra-01: cites cra, whose tl-planted-cra-judicial (judicial, 2026-11-02) is after last_verified 2026-10-29']);
});

test('X3 · 12.2: evidence-audit.mjs reports TRIGGERS in text, --json and --markdown, FAILS on a planted rule defect, and refuses a stored derived field on a rule', () => {
  const out = runValidator('evidence-audit.mjs', ['--as-of', '2026-10-28']);
  assert.equal(out.exit, 0, 'the backlog never fails the run');
  assert.match(out.out, /^TRIGGERS {8}33 rules · applies 13 · likely 9 · possible 10 · unlikely 1$/m);
  /* v2 Session 14 (29 Oct 2026, §8 14.0 question 5): 2 → 7, the GDPR's five brought to v2;
     v2 Session 15 (29 Oct 2026, §8 15.0 question 7): 7 → 16, the DSA's five and the DMA's four;
     v2 Session 16 (29 Oct 2026, §8 16.0 question 7): 16 → 23, the AI Act's seven;
     v2 Session 17 (29 Oct 2026, §8 17.0 questions 7 and 9): 23 → 33, the last ten, and the six
     BACKLOG rule-* lines leave the report with the backlog */
  assert.match(out.out, /^ {2}publishable {3}33 of 33: ap-gdpr-01, ap-gdpr-02, ap-gdpr-03, ap-gdpr-04, ap-dsa-01, ap-dsa-02, ap-dsa-03, ap-dsa-04, ap-dsa-05, ap-dma-01, ap-dma-02, ap-dma-03, ap-dma-04, ap-ai-act-01, ap-ai-act-02, ap-ai-act-03, ap-ai-act-04, ap-ai-act-05, ap-ai-act-06, ap-ai-act-07, ap-data-act-01, ap-data-act-02, ap-data-act-03, ap-data-act-04, ap-nis2-01, ap-nis2-02, ap-nis2-03, ap-dora-01, ap-dora-02, ap-cra-01, ap-pld-01, ap-eidas2-01, ap-cross-01$/m);
  assert.doesNotMatch(out.out, /BACKLOG rule-/);
  const json = JSON.parse(runValidator('evidence-audit.mjs', ['--as-of', '2026-10-28', '--json']).out);
  assert.equal(json.triggers.total, 33);
  assert.equal(json.triggers.backlog, undefined);
  const md = runValidator('evidence-audit.mjs', ['--as-of', '2026-10-28', '--markdown']).out;
  assert.match(md, /\| … publishable at the claims' standard \| 33 of 33 \|/);
  assert.doesNotMatch(md, /Backlog — rule-/);
  assert.ok(DERIVED_FIELDS.includes('publishable') && DERIVED_FIELDS.includes('modality'));
  const dir = treeCopy();
  try {
    editJSON(dir, 'applicability.json', (d) => {
      d.rules.find((r) => r.outcome === 'outcome:possible').depends_on = [];
      d.rules[0].publishable = true;
    });
    const r = runValidator('evidence-audit.mjs', ['--root', dir, '--as-of', '2026-10-28']);
    assert.equal(r.exit, 1);
    assert.match(r.out, /T-06 applicability\/.*possible with no depends_on/);
    assert.match(r.out, /applicability\/ap-gdpr-01 stores "publishable"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('X4 · 12.2: the record says what the run now reads, in the words the author approved, and no longer that it reads nothing of the rules', () => {
  assert.ok(!LIMITS.some((l) => /reports nothing about data\/applicability\.json/.test(l)));
  assert.ok(LIMITS.includes("It reads the rules behind applies.html (data/applicability.json) for their structure and evidence: references and locators, the provision behind each condition, exemptions, thresholds and dates. It opens no source and runs no questionnaire, so a rule it reports as publishable meets the claims' standard of evidence; that is not a finding that the rule states the law correctly (docs/ROADMAP-v2.md §4, Phase 3; D-2)."));
  assert.deepEqual(CHECKED.map((c) => c.section), ['claims', 'remediation', 'prose', 'sources', 'freshness', 'enforcement', 'regulatory', 'register', 'triggers']);
});

/* ---------------------------------------------------------------------------
   v2 Session 13, item 13.2: tools/validate.mjs learns the v2 rule shape
   (docs/ROADMAP-v2.md §8, 13.0 question 2). It refused a reference object
   with DANGLING source ref "[object Object]" and accepted an exemption object
   without looking at it. Every new error is planted, each in its own copy.
   --------------------------------------------------------------------------- */

test('Y1 · 13.2: validate.mjs accepts a correct v2 rule, keeps the v1 forms, and names the field of every v2 defect', () => {
  const run = (fn) => {
    const dir = treeCopy();
    try {
      editJSON(dir, 'applicability.json', (d) => fn(d.rules.find((r) => r.id === 'ap-gdpr-02'), d.rules.find((r) => r.id === 'ap-ai-act-03'), d));
      return runValidator('validate.mjs', [], dir);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  };
  /* a v2 rule in the schema's shape, on the rule X2 uses */
  const v2 = (r, t) => {
    r.sources = [{ source_id: 'src-eurlex-gdpr', supports: 'supports:direct', locator: 'Art. 3(2)', for: 'scope' },
      { source_id: 'src-eurlex-gdpr', supports: 'supports:partial', locator: null }];
    r.condition_provisions = Object.fromEntries(Object.keys(r.conditions).map((d) => [d, ['gdpr:art-3']]));
    r.exemptions = ['A v1 string exemption, still accepted.',
      { text: 'A planted exemption object.', effect: 'excludes', basis: [{ source_id: 'src-eurlex-gdpr', supports: 'supports:direct', locator: 'Art. 2(2)' }], outside_dataset: false }];
    /* the key is _gt since v2 Session 16 (29 Oct 2026, §8 16.0 questions 2 and 7) */
    t.threshold_basis = { cumulative_training_flop_gt: [{ source_id: 'src-eurlex-ai-act', supports: 'supports:direct', locator: 'Art. 51(2)' }] };
  };
  const clean = run(v2);
  assert.equal(clean.exit, 0, clean.out);
  assert.match(clean.out, /^ERRORS {3}0$/m);

  const fails = (fn, re) => {
    const r = run((a, b, d) => { v2(a, b); fn(a, b, d); });
    assert.equal(r.exit, 1, `${re} — expected a failing run`);
    assert.match(r.out, re);
  };
  /* (1) sources */
  fails((r) => { r.sources.push(42); }, /RULE "ap-gdpr-02" sources\[2\]: MALFORMED reference 42/);
  fails((r) => { r.sources[1] = { supports: 'supports:direct', locator: 'Art. 1' }; }, /RULE "ap-gdpr-02" sources\[1\]: reference without a source_id/);
  fails((r) => { r.sources[1].source_id = 'src-not-a-source'; }, /RULE "ap-gdpr-02" sources\[1\]: DANGLING source ref "src-not-a-source"/);
  fails((r) => { r.sources[1].supports = 'outcome:applies'; }, /RULE "ap-gdpr-02" sources\[1\]: supports "outcome:applies" is not a supports: term/);
  fails((r) => { r.sources[0].for = 'scope-ish'; }, /RULE "ap-gdpr-02" sources\[0\]: for "scope-ish" is not one of scope, obligation, date, rationale/);
  fails((r) => { r.sources[0].locator = 3; }, /RULE "ap-gdpr-02" sources\[0\]: locator 3 is neither a string nor null/);
  /* the v1 form keeps its message */
  fails((r) => { r.sources.push('src-not-a-source'); }, /DANGLING source ref "src-not-a-source" in applicability\/ap-gdpr-02/);
  /* (2) condition_provisions */
  fails((r) => { r.condition_provisions = ['gdpr:art-3']; }, /RULE "ap-gdpr-02" condition_provisions: not an object/);
  fails((r) => { r.condition_provisions.sector = ['gdpr:art-3']; }, /RULE "ap-gdpr-02" condition_provisions: "sector" is not one of actor, activity, territory/);
  fails((r) => { r.condition_provisions.territory = []; }, /RULE "ap-gdpr-02" condition_provisions\.territory: not a non-empty array/);
  fails((r) => { r.condition_provisions.territory = ['gdpr:art-999']; }, /RULE "ap-gdpr-02" condition_provisions\.territory: DANGLING provision ref "gdpr:art-999"/);
  fails((r) => { r.condition_provisions.territory = ['gdpr:*']; }, /condition_provisions\.territory: DANGLING provision ref "gdpr:\*"/);
  /* (3) threshold_basis */
  fails((r, t) => { t.threshold_basis = []; }, /RULE "ap-ai-act-03" threshold_basis: not an object/);
  fails((r, t) => { t.threshold_basis.flops_gt = t.threshold_basis.cumulative_training_flop_gt; }, /RULE "ap-ai-act-03" threshold_basis: "flops_gt" is not a key of conditions\.thresholds/);
  fails((r, t) => { t.threshold_basis.cumulative_training_flop_gt = []; }, /threshold_basis\.cumulative_training_flop_gt: not a non-empty array of references/);
  fails((r, t) => { t.threshold_basis.cumulative_training_flop_gt[0].source_id = 'src-not-a-source'; }, /RULE "ap-ai-act-03" threshold_basis\.cumulative_training_flop_gt\[0\]: DANGLING source ref/);
  /* (4) exemptions */
  fails((r) => { r.exemptions.push(7); }, /RULE "ap-gdpr-02" exemptions\[2\]: MALFORMED exemption 7/);
  fails((r) => { r.exemptions[1].why = 'x'; }, /RULE "ap-gdpr-02" exemptions\[1\]: "why" is not one of text, effect, basis, outside_dataset/);
  fails((r) => { r.exemptions[1].text = ['x']; }, /RULE "ap-gdpr-02" exemptions\[1\]\.text: not a string/);
  fails((r) => { r.exemptions[1].effect = 'removes'; }, /RULE "ap-gdpr-02" exemptions\[1\]\.effect: "removes" is not one of excludes, narrows, reinstates/);
  fails((r) => { r.exemptions[1].basis = 'Art. 2(2)'; }, /RULE "ap-gdpr-02" exemptions\[1\]\.basis: not an array of references/);
  fails((r) => { r.exemptions[1].basis[0].supports = 'supports:strong'; }, /exemptions\[1\]\.basis\[0\]: supports "supports:strong" is not a supports: term/);
  fails((r) => { r.exemptions[1].outside_dataset = 'no'; }, /RULE "ap-gdpr-02" exemptions\[1\]\.outside_dataset: not a boolean/);
});

/* ---------------------------------------------------------------------------
   v2 Session 13, item 13.3: the pilot. ap-eidas2-01 and ap-pld-01 brought to
   the v2 shape against their Articles (docs/ROADMAP-v2.md §8, questions 3a–3c).
   --------------------------------------------------------------------------- */

test('Y2 · 13.3: the two pilot rules are v2, publishable, resolve to their own instruments\' provisions, and the pages print what was approved', () => {
  const db = loadDb();
  const ix = buildIndex(db);
  const t = triggerAudit(db, '2026-10-29');
  /* the pilot's own two: ap-cross-01's partial EDPB reference (v2 Session 14, §8 14.0 question 1)
     is Y3's to hold, not "every reference direct" (§8 14.0 question 5) */
  for (const id of RULES_PILOT) {
    const r = ruleOf(db, id);
    /* v2 Session 17 (29 Oct 2026, §8): RULES_V1 is gone with the backlog it held */
    assert.equal(t.backlog, undefined, 'no backlog: every rule is held in full');
    assert.ok(t.publishable.includes(id), `${id} is publishable`);
    assert.ok(r.sources.every((s) => typeof s === 'object' && s.supports === 'supports:direct'), `${id}: reference objects, all direct`);
    assert.equal(r.last_verified, '2026-10-29');
    /* every condition names provisions of the rule's own instrument */
    assert.deepEqual(Object.keys(r.condition_provisions).sort(), Object.keys(r.conditions).sort());
    for (const p of Object.values(r.condition_provisions).flat()) assert.equal(ix.provisionOwner.get(p), r.instrument, p);
    /* nothing derived is stored */
    for (const k of ['publishable', 'asks', 'modality', 'verification_state']) assert.ok(!(k in r), `${id} stores ${k}`);
  }
  /* what the author approved, and nothing else, beyond the shape */
  const e = ruleOf(db, 'ap-eidas2-01');
  assert.deepEqual(e.dates, ['tl-eidas2-2026-12-24-compliance-deadline']);
  assert.deepEqual(e.sources.map((s) => [s.source_id, s.for]), [['src-eurlex-eidas2', 'scope'], ['src-eurlex-eidas2', 'obligation'],
    ['src-eurlex-eudi-2024-2977', 'date'], ['src-eurlex-eudi-2024-2981', 'date']]);
  const p = ruleOf(db, 'ap-pld-01');
  assert.deepEqual(p.exemptions.map((x) => [x.effect, x.basis.map((b) => b.locator)]), [['excludes', ['Art. 2(2)']]]);
  assert.deepEqual(p.obligations, [], 'liability is not an obligation: unchanged');
  const provs = (id) => db.instruments.instruments.find((i) => i.id === id).provisions.map((x) => [x.id, x.heading]);
  assert.deepEqual(provs('pld'), [['pld:art-2', 'Scope'], ['pld:art-4', 'Definitions'], ['pld:art-8', 'Economic operators liable for defective products']]);
  assert.deepEqual(provs('eidas2').slice(0, 2), [['eidas2:art-2', 'Scope'], ['eidas2:art-3', 'Definitions']]);

  /* the generated pages: the exemption object prints its text, never "[object Object]" */
  const pld = visibleText(readFileSync(join(ROOT, 'instruments/pld/index.html'), 'utf8'));
  assert.ok(pld.includes('Free and open-source software developed or supplied outside the course of a commercial activity is outside the Directive.'));
  assert.ok(!pld.includes('No provisions recorded'));
  for (const f of readdirSync(join(ROOT, 'instruments')))
    assert.ok(!readFileSync(join(ROOT, 'instruments', f, 'index.html'), 'utf8').includes('[object Object]'), f);
  /* and js/applies.js reads a reference object's source and locator, and an exemption object's text */
  const js = readFileSync(join(ROOT, 'js/applies.js'), 'utf8');
  assert.match(js, /typeof s === 'string' \? s : s && s\.source_id/);
  assert.match(js, /' — at ' \+ esc\(at\)/);
  assert.match(js, /F\.SUPPORTS_WORD\[s\.supports\]/);
  assert.match(js, /typeof x === 'string' \? x : \(x && x\.text\)/);
});

/* ---------------------------------------------------------------------------
   v2 Session 14, item 14.1: the GDPR's five rules in the v2 shape, read against
   Regulation (EU) 2016/679 on 29 Oct 2026 (docs/ROADMAP-v2.md §8, 14.0
   questions 1–5). What the author approved beyond the shape is held here.
   --------------------------------------------------------------------------- */

test('Y3 · 14.1: the GDPR\'s five rules are v2, publishable, resolve to the GDPR\'s own provisions, and the pages print what was approved', () => {
  const db = loadDb();
  const ix = buildIndex(db);
  const t = triggerAudit(db, '2026-10-29');
  for (const id of RULES_GDPR) {
    const r = ruleOf(db, id);
    /* v2 Session 17 (29 Oct 2026, §8): RULES_V1 is gone with the backlog it held */
    assert.equal(t.backlog, undefined, 'no backlog: every rule is held in full');
    assert.ok(t.publishable.includes(id), `${id} is publishable`);
    assert.equal(r.instrument, 'gdpr');
    assert.equal(r.last_verified, '2026-10-29');
    assert.ok(r.sources.every((s) => typeof s === 'object'), `${id}: reference objects`);
    assert.ok(r.sources.some((s) => s.for === 'scope' && s.source_id === 'src-eurlex-gdpr' && s.supports === 'supports:direct'), `${id}: a direct scope reference to the Regulation`);
    /* question 3: the GDPR's own provisions, also for the actors the AI Act and the DSA define */
    assert.deepEqual(Object.keys(r.condition_provisions).sort(), Object.keys(r.conditions).sort());
    for (const p of Object.values(r.condition_provisions).flat()) assert.equal(ix.provisionOwner.get(p), 'gdpr', p);
    for (const k of ['publishable', 'asks', 'modality', 'verification_state']) assert.ok(!(k in r), `${id} stores ${k}`);
  }
  /* question 1: the one reference that is not direct */
  const x = ruleOf(db, 'ap-cross-01');
  assert.deepEqual(x.sources.filter((s) => s.supports !== 'supports:direct').map((s) => [s.source_id, s.supports, s.for]),
    [['src-edpb-guidelines-3-2025', 'supports:partial', 'rationale']]);
  /* questions 2, 4a, 4b: the exemptions, in order, with their effects and bases */
  const ex = (id) => ruleOf(db, id).exemptions.map((e) => [e.effect, e.outside_dataset === true, e.basis.map((b) => b.locator).join(' | ')]);
  assert.deepEqual(ex('ap-gdpr-01'), [['excludes', false, 'Art. 2(2)(c)'], ['narrows', false, 'Art. 30(5)']]);
  assert.deepEqual(ex('ap-gdpr-03'), [['excludes', true, 'Art. 2(2)(d); recital 19 (Directive (EU) 2016/680)'],
    ['excludes', true, 'Art. 2(3)'], ['narrows', false, 'Art. 37(1)(a)']]);
  const art305 = 'Under Article 30(5), an enterprise or organisation employing fewer than 250 persons need not keep records of processing activities, unless its processing is likely to result in a risk to the rights and freedoms of data subjects, is not occasional, or includes special categories of data or personal data relating to criminal convictions and offences.';
  const courts = 'Courts acting in their judicial capacity are excepted from the obligation to designate a data protection officer that Article 37(1)(a) places on public authorities and bodies.';
  const union = 'Processing by the Union\'s own institutions, bodies, offices and agencies is governed by a separate Union regulation rather than the GDPR — an instrument outside this dataset.';
  assert.equal(ruleOf(db, 'ap-gdpr-01').exemptions[1].text, art305);
  assert.deepEqual(ruleOf(db, 'ap-gdpr-03').exemptions.slice(1).map((e) => e.text), [union, courts]);
  /* question 4c: ap-cross-01 reported, not changed; v2 Session 15 (29 Oct 2026, §8 15.0 questions 5
     and 7) added the depends_on for EDPB paragraph 88 and a DSA reference that is direct, so the one
     reference that is not direct is still the EDPB one (asserted above) */
  assert.deepEqual(x.depends_on, ['Whether the recommender system processes personal data (EDPB Guidelines 3/2025, paragraph 88).']);
  assert.equal(x.outcome, 'outcome:applies');
  /* the new provisions, and the Art. 37 summary of question 2 */
  const g = db.instruments.instruments.find((i) => i.id === 'gdpr').provisions;
  assert.deepEqual(g.slice(0, 3).map((p) => [p.id, p.heading]), [['gdpr:art-2', 'Material scope'], ['gdpr:art-3', 'Territorial scope'], ['gdpr:art-4', 'Definitions']]);
  assert.match(g.find((p) => p.id === 'gdpr:art-37').summary, /except for courts acting in their judicial capacity/);

  /* the generated page prints the new texts, and not the old Art. 30(5) sentence */
  const page = visibleText(readFileSync(join(ROOT, 'instruments/gdpr/index.html'), 'utf8'));
  for (const s of [art305, courts, union, 'Material scope', '18 provisions recorded']) assert.ok(page.includes(s), s);
  assert.ok(!page.includes('but does not remove it where processing is not occasional'));
  assert.ok(!page.includes('[object Object]'));
});

test('Y4 · 15.1: the DSA\'s five and the DMA\'s four rules are v2, publishable, resolve to their own instrument\'s provisions, and the pages print what was approved', () => {
  /* v2 Session 15 (29 Oct 2026, docs/ROADMAP-v2.md §8, 15.0 questions 1a-6d and 7) */
  const db = loadDb();
  const ix = buildIndex(db);
  const t = triggerAudit(db, '2026-10-29');
  for (const id of RULES_DSA_DMA) {
    const r = ruleOf(db, id);
    /* v2 Session 17 (29 Oct 2026, §8): RULES_V1 is gone with the backlog it held */
    assert.equal(t.backlog, undefined, 'no backlog: every rule is held in full');
    assert.ok(t.publishable.includes(id), `${id} is publishable`);
    assert.equal(r.last_verified, '2026-10-29');
    assert.ok(r.sources.every((s) => typeof s === 'object'), `${id}: reference objects`);
    const own = r.instrument === 'dsa' ? 'src-eurlex-dsa' : 'src-eurlex-dma';
    assert.ok(r.sources.some((s) => s.for === 'scope' && s.source_id === own && s.supports === 'supports:direct'), `${id}: a direct scope reference to the Regulation`);
    assert.deepEqual(Object.keys(r.condition_provisions).sort(), Object.keys(r.conditions).filter((d) => d !== 'thresholds').sort());
    for (const p of Object.values(r.condition_provisions).flat()) assert.equal(ix.provisionOwner.get(p), r.instrument, p);
    for (const k of ['publishable', 'asks', 'modality', 'verification_state']) assert.ok(!(k in r), `${id} stores ${k}`);
  }
  /* questions 1a and 1b: the threshold bases, one per key */
  assert.deepEqual(Object.keys(ruleOf(db, 'ap-dsa-02').threshold_basis), ['monthly_active_eu_users_gte']);
  assert.deepEqual(Object.keys(ruleOf(db, 'ap-dma-02').threshold_basis).sort(), ['monthly_active_eu_end_users_gte', 'yearly_active_eu_business_users_gte']);
  /* questions 2a and 2b: F-7 and F-6 */
  const f7 = 'Under Article 19, providers of online platforms that are micro or small enterprises — and, for twelve months after losing that status, those that were — are exempt from the Section 3 online-platform obligations, except Article 24(3), unless designated as a very large online platform.';
  const f6 = 'Under Article 29, providers of online platforms allowing consumers to conclude distance contracts with traders that are micro or small enterprises — and, for twelve months after losing that status, those that were — are exempt from the Section 4 marketplace obligations, unless designated as a very large online platform.';
  assert.deepEqual(ruleOf(db, 'ap-dsa-01').exemptions.map((e) => [e.text, e.effect, e.basis.map((b) => b.locator)]), [[f7, 'narrows', ['Art. 19(1) and (2)']]]);
  assert.deepEqual(ruleOf(db, 'ap-dsa-04').exemptions.map((e) => [e.text, e.effect, e.basis.map((b) => b.locator)]), [[f6, 'narrows', ['Art. 29(1) and (2)']]]);
  /* questions 3a-3e: the dates */
  assert.deepEqual(ruleOf(db, 'ap-dsa-02').dates, ['tl-dsa-2023-08-01-application']);
  assert.deepEqual(ruleOf(db, 'ap-dsa-05').dates, ['tl-dsa-2023-08-01-application', 'tl-dsa-2025-10-29-delegated-act']);
  assert.deepEqual(ruleOf(db, 'ap-dma-02').dates, []);
  assert.deepEqual(ruleOf(db, 'ap-dma-03').dates, ['tl-dma-2023-05-01-application']);
  assert.deepEqual(ruleOf(db, 'ap-dma-04').dates, ['tl-dma-2026-11-01-designation', 'tl-dma-2027-05-01-market-investigation']);
  assert.deepEqual(db.timeline.events.find((e) => e.id === 'tl-dsa-2023-08-01-application').provisions,
    ['dsa:art-34', 'dsa:art-35', 'dsa:art-38', 'dsa:art-39', 'dsa:art-40']);
  /* question 6d: the two DMA headings, as the Official Journal prints them */
  const dma = db.instruments.instruments.find((i) => i.id === 'dma').provisions;
  assert.equal(dma.find((p) => p.id === 'dma:art-6').heading, 'Obligations for gatekeepers susceptible of being further specified under Article 8');
  assert.equal(dma.find((p) => p.id === 'dma:art-38').heading, 'Cooperation and coordination with national competent authorities enforcing competition rules');

  /* the generated pages print the new texts, and not the two old exemption sentences */
  const dsaPage = visibleText(readFileSync(join(ROOT, 'instruments/dsa/index.html'), 'utf8'));
  for (const s of [f7, f6, '16 provisions recorded', 'Exclusion for micro and small enterprises']) assert.ok(dsaPage.includes(s), s);
  assert.ok(!dsaPage.includes('Micro and small enterprises are exempt from the Section 3 online-platform obligations unless designated as a VLOP.'));
  assert.ok(!dsaPage.includes('Micro and small enterprises are exempt from the online-platform section unless designated as a VLOP.'));
  const dmaPage = visibleText(readFileSync(join(ROOT, 'instruments/dma/index.html'), 'utf8'));
  assert.ok(dmaPage.includes('Obligations for gatekeepers susceptible of being further specified under Article 8'));
  for (const page of [dsaPage, dmaPage]) assert.ok(!page.includes('[object Object]'));
});

test('Y5 · 16.1: the AI Act\'s seven rules are v2, publishable, read against the text as the AI Omnibus amends it, and the pages print what was approved', () => {
  /* v2 Session 16 (29 Oct 2026, docs/ROADMAP-v2.md §8, 16.0 questions 1-7 and the two corrections) */
  const db = loadDb();
  const ix = buildIndex(db);
  const t = triggerAudit(db, '2026-10-29');
  for (const id of RULES_AI_ACT) {
    const r = ruleOf(db, id);
    /* v2 Session 17 (29 Oct 2026, §8): RULES_V1 is gone with the backlog it held */
    assert.equal(t.backlog, undefined, 'no backlog: every rule is held in full');
    assert.ok(t.publishable.includes(id), `${id} is publishable`);
    assert.equal(r.instrument, 'ai-act');
    assert.equal(r.last_verified, '2026-10-29');
    assert.ok(r.sources.every((s) => typeof s === 'object'), `${id}: reference objects`);
    assert.ok(r.sources.some((s) => s.for === 'scope' && s.source_id === 'src-eurlex-ai-act' && s.supports === 'supports:direct'), `${id}: a direct scope reference to the Regulation`);
    assert.deepEqual(Object.keys(r.condition_provisions).sort(), Object.keys(r.conditions).filter((d) => d !== 'thresholds').sort());
    for (const p of Object.values(r.condition_provisions).flat()) assert.equal(ix.provisionOwner.get(p), 'ai-act', p);
    assert.ok(r.exemptions.every((e) => typeof e === 'object'), `${id}: exemption objects`);
    for (const k of ['publishable', 'asks', 'modality', 'verification_state']) assert.ok(!(k in r), `${id} stores ${k}`);
  }
  /* question 2 (F-4): the comparator is the text's, and the old key is gone */
  const r3 = ruleOf(db, 'ap-ai-act-03');
  assert.deepEqual(r3.conditions.thresholds, { cumulative_training_flop_gt: 1e25 });
  assert.deepEqual(r3.threshold_basis.cumulative_training_flop_gt.map((b) => b.locator), ["Art. 51(2) ('greater than 10^25')"]);
  /* questions 3a-3e (F-8), 3b and 6d: dates and obligations */
  const dates = (id) => ruleOf(db, id).dates;
  assert.deepEqual(dates('ap-ai-act-01'), ['tl-ai-act-2025-02-02-application', 'tl-ai-act-2026-12-02-application']);
  assert.deepEqual(dates('ap-ai-act-02'), ['tl-ai-act-2025-08-02-application', 'tl-ai-act-2025-07-10-guidance']);
  assert.deepEqual(dates('ap-ai-act-05'), ['tl-ai-act-2027-12-02-application', 'tl-ai-act-2028-08-02-application']);
  assert.deepEqual(dates('ap-ai-act-06'), ['tl-ai-act-2025-02-02-application', 'tl-ai-act-2026-12-02-application', 'tl-ai-act-2027-12-02-application']);
  assert.deepEqual(dates('ap-ai-act-07'), ['tl-ai-act-2025-02-02-application', 'tl-ai-act-2025-08-02-application', 'tl-ai-act-2026-12-02-application']);
  assert.deepEqual(ruleOf(db, 'ap-ai-act-01').obligations, ['ai-act:art-5', 'ai-act:art-4']);
  assert.deepEqual(ruleOf(db, 'ap-ai-act-02').obligations, ['ai-act:art-53']);
  const ev = (id) => db.timeline.events.find((e) => e.id === id);
  assert.ok(!ev('tl-ai-act-2028-08-02-application').provisions.includes('ai-act:art-27'), 'question 3d: Art. 27(1) concerns Art. 6(2) systems only');
  for (const p of ['ai-act:art-2-1', 'ai-act:art-3']) assert.ok(ev('tl-ai-act-2025-02-02-application').provisions.includes(p), p);
  /* question 5: the one reference that is not direct */
  assert.deepEqual(RULES_AI_ACT.flatMap((id) => ruleOf(db, id).sources.filter((s) => s.supports !== 'supports:direct').map((s) => [id, s.source_id, s.supports])),
    [['ap-ai-act-04', 'src-ec-ai-omnibus-in-force', 'supports:context']]);
  /* question 6c: the corrected exemption */
  const s63 = 'Under Article 6(3), an Annex III system that does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, and meets one of the four conditions the paragraph lists, is not high-risk — never one that performs profiling of natural persons; the provider must document that assessment before placing the system on the market or putting it into service, and register it (Article 6(4)).';
  assert.deepEqual(ruleOf(db, 'ap-ai-act-04').exemptions.map((e) => [e.text, e.effect, e.basis.map((b) => b.locator)]), [[s63, 'narrows', ['Art. 6(3) and (4)']]]);
  /* questions 1, 6a and 6b: the provisions, the headings, the Omnibus's Official Journal date */
  const prov = new Map(db.instruments.instruments.find((i) => i.id === 'ai-act').provisions.map((p) => [p.id, p]));
  assert.deepEqual([prov.get('ai-act:art-2-1').heading, prov.get('ai-act:art-3').heading], ['Scope', 'Definitions']);
  assert.equal(prov.get('ai-act:art-27').heading, 'Fundamental rights impact assessment for high-risk AI systems');
  assert.equal(prov.get('ai-act:art-51').heading, 'Classification of general-purpose AI models as general-purpose AI models with systemic risk');
  assert.equal(db.sources.sources.find((s) => s.id === 'src-eurlex-ai-omnibus').published, '2026-07-24');

  /* the generated page prints the new texts, and not the old Art. 6(3) sentence */
  const page = visibleText(readFileSync(join(ROOT, 'instruments/ai-act/index.html'), 'utf8'));
  for (const s of [s63, '15 provisions recorded', 'Fundamental rights impact assessment for high-risk AI systems']) assert.ok(page.includes(s), s);
  assert.ok(!page.includes('Article 6(3) filters out an Annex III system'));
  assert.ok(!page.includes('[object Object]'));
});

test('Y6 · 17.1: the Data Act\'s, NIS2\'s, DORA\'s and the CRA\'s ten rules are v2, publishable, and the pages print what was approved', () => {
  /* v2 Session 17 (29 Oct 2026, docs/ROADMAP-v2.md §8, 17.0 questions 1a-1d, 2a, 2b, 3a, 3b, 4, 5a, 5b,
     6a-6g and 9) */
  const db = loadDb();
  const ix = buildIndex(db);
  const t = triggerAudit(db, '2026-10-29');
  assert.equal(t.backlog, undefined, 'no backlog: every rule is held in full');
  for (const id of RULES_DA_NIS2_DORA_CRA) {
    const r = ruleOf(db, id);
    assert.ok(t.publishable.includes(id), `${id} is publishable`);
    assert.equal(r.last_verified, '2026-10-29');
    assert.deepEqual(Object.keys(r.condition_provisions).sort(), Object.keys(r.conditions).filter((d) => d !== 'thresholds').sort());
    for (const p of Object.values(r.condition_provisions).flat()) assert.equal(ix.provisionOwner.get(p), r.instrument, p);
    for (const k of ['publishable', 'asks', 'modality', 'verification_state']) assert.ok(!(k in r), `${id} stores ${k}`);
  }
  /* the four tables (questions 1a-1d, 4, 5a): every reference as [source, supports, for, locator] */
  const refs = (id) => ruleOf(db, id).sources.map((s) => [s.source_id, s.supports.split(':')[1], s.for, s.locator]);
  assert.deepEqual(refs("ap-data-act-01"), [["src-eurlex-data-act", "direct", "scope", "Art. 1(3)(f); Art. 2 points (8) and (30)"], ["src-eurlex-data-act", "direct", "obligation", "Art. 25; Art. 29(1)"]]);
  assert.deepEqual(refs("ap-data-act-02"), [["src-eurlex-data-act", "direct", "scope", "Art. 1(3)(f); Art. 2 points (8) and (30)"], ["src-eurlex-data-act", "direct", "obligation", "Art. 25; Art. 29(1)"]]);
  assert.deepEqual(refs("ap-data-act-03"), [["src-eurlex-data-act", "direct", "scope", "Art. 1(3)(a); Art. 2 points (5) and (6)"], ["src-eurlex-data-act", "direct", "obligation", "Art. 3(1)"]]);
  assert.deepEqual(refs("ap-data-act-04"), [["src-eurlex-data-act", "direct", "scope", "Art. 1(3)(a), (c) and (f); Art. 2 points (5), (6), (8), (24), (25) and (26)"], ["src-eurlex-data-act", "direct", "obligation", "Art. 3(1); Art. 25"]]);
  assert.deepEqual(refs("ap-nis2-01"), [["src-eurlex-nis2", "direct", "scope", "Art. 2(1), (2) and (3); Art. 3(1) and (2); Annexes I and II"], ["src-eurlex-nis2", "direct", "obligation", "Art. 3(4); Art. 20(1) and (2); Art. 21(1) and (2); Art. 23(1) and (4)"], ["src-eurlex-nis2", "direct", "rationale", "Art. 32(6)"], ["src-eurlex-nis2", "direct", "date", "Art. 41(1)"], ["src-ec-nis2-referral-2026", "context", "rationale", "third paragraph"]]);
  assert.deepEqual(refs("ap-nis2-02"), [["src-eurlex-nis2", "direct", "scope", "Art. 2(1) and (2); Art. 3(1) and (2); Art. 6 points (30) and (31); Annex I, point 8"], ["src-eurlex-nis2", "direct", "obligation", "Art. 20(1); Art. 21(1) and (2); Art. 23(1) and (4)"]]);
  assert.deepEqual(refs("ap-nis2-03"), [["src-eurlex-nis2", "direct", "scope", "Art. 2(2)(f) and (5)(a); Art. 6 point (35); Annex I, point 10"], ["src-eurlex-nis2", "direct", "obligation", "Art. 21(1) and (2); Art. 23(1) and (4)"]]);
  assert.deepEqual(refs("ap-dora-01"), [["src-eurlex-dora", "direct", "scope", "Art. 2(1), points (a) to (t), and (2)"], ["src-eurlex-dora", "direct", "obligation", "Art. 5; Art. 6; Art. 17(1); Art. 19(1); Art. 24(1); Art. 28(1)"]]);
  assert.deepEqual(refs("ap-dora-02"), [["src-eurlex-dora", "direct", "scope", "Art. 2(1), point (u); Art. 3 points (19), (21) and (23)"], ["src-eurlex-dora", "direct", "obligation", "Art. 28(1); Art. 31(1)"], ["src-eurlex-dora", "direct", "rationale", "Art. 30(1) and (2); Art. 33(1)"]]);
  assert.deepEqual(refs("ap-cra-01"), [["src-eurlex-cra", "direct", "scope", "Art. 2(1); Art. 3 points (1), (13), (21) and (22)"], ["src-eurlex-cra", "direct", "obligation", "Art. 13(1); Art. 14(1) and (3)"], ["src-eurlex-cra", "direct", "date", "Art. 71(2)"]]);
  /* condition_provisions as tabled */
  assert.deepEqual(ruleOf(db, "ap-data-act-01").condition_provisions, {"actor": ["data-act:art-1", "data-act:art-2"], "activity": ["data-act:art-2"]});
  assert.deepEqual(ruleOf(db, "ap-data-act-02").condition_provisions, {"actor": ["data-act:art-1", "data-act:art-2"], "activity": ["data-act:art-2"], "territory": ["data-act:art-1"]});
  assert.deepEqual(ruleOf(db, "ap-data-act-03").condition_provisions, {"actor": ["data-act:art-1"], "activity": ["data-act:art-2"]});
  assert.deepEqual(ruleOf(db, "ap-data-act-04").condition_provisions, {"actor": ["data-act:art-2"], "activity": ["data-act:art-2"]});
  assert.deepEqual(ruleOf(db, "ap-nis2-01").condition_provisions, {"actor": ["nis2:art-2", "nis2:art-3"], "activity": ["nis2:art-2"]});
  assert.deepEqual(ruleOf(db, "ap-nis2-02").condition_provisions, {"actor": ["nis2:art-2", "nis2:art-6"], "activity": ["nis2:art-2", "nis2:art-6"]});
  assert.deepEqual(ruleOf(db, "ap-nis2-03").condition_provisions, {"actor": ["nis2:art-2", "nis2:art-6"], "activity": ["nis2:art-2"]});
  assert.deepEqual(ruleOf(db, "ap-dora-01").condition_provisions, {"actor": ["dora:art-2"]});
  assert.deepEqual(ruleOf(db, "ap-dora-02").condition_provisions, {"actor": ["dora:art-2", "dora:art-3"], "activity": ["dora:art-3"]});
  assert.deepEqual(ruleOf(db, "ap-cra-01").condition_provisions, {"actor": ["cra:art-3"], "activity": ["cra:art-2", "cra:art-3"]});
  /* the exemptions, word for word, with effect and basis (questions 3a, 3b, 6b, 6c, 6e, 6f, 6g) */
  const ex = (id) => ruleOf(db, id).exemptions.map((e) => [e.text, e.effect, e.basis.map((b) => b.locator)]);
  assert.deepEqual(ex("ap-data-act-01"), [["Under Article 31(2), the obligations of Chapter VI do not apply to data processing services provided as a non-production version for testing and evaluation purposes and for a limited period of time. Under Article 31(1), Article 29 does not apply — nor do Article 23, point (d), and Article 30(1) and (3) — to data processing services the majority of whose main features has been custom-built for an individual customer, or all of whose components have been developed for one, where they are not offered at broad commercial scale via the provider's service catalogue. The provider must inform the prospective customer beforehand of the obligations that do not apply (Article 31(3)).", "narrows", ["Art. 31(1), (2) and (3)"]]]);
  assert.deepEqual(ex("ap-data-act-02"), [["Under Article 31(2), the obligations of Chapter VI do not apply to data processing services provided as a non-production version for testing and evaluation purposes and for a limited period of time. Under Article 31(1), Article 29 does not apply — nor do Article 23, point (d), and Article 30(1) and (3) — to data processing services the majority of whose main features has been custom-built for an individual customer, or all of whose components have been developed for one, where they are not offered at broad commercial scale via the provider's service catalogue. The provider must inform the prospective customer beforehand of the obligations that do not apply (Article 31(3)).", "narrows", ["Art. 31(1), (2) and (3)"]]]);
  assert.deepEqual(ex("ap-data-act-03"), [["Under Article 4(6) to (8), trade secrets are disclosed only where the data holder and the user take the measures necessary to preserve their confidentiality. Where no such measures are agreed, or the user fails to implement them or undermines that confidentiality, the data holder may withhold or suspend the sharing of data identified as trade secrets; in exceptional circumstances, where it can demonstrate that it is highly likely to suffer serious economic damage, it may refuse access case by case. In each case it must notify the competent authority, and the user may lodge a complaint with that authority or, by agreement with the data holder, refer the matter to a dispute settlement body, without prejudice to recourse to a court (Article 4(9)).", "narrows", ["Art. 4(6), (7), (8) and (9)"]], ["Under Article 7(1), the obligations of Chapter II, Article 3(1) among them, do not apply to data generated through the use of connected products manufactured or designed, or related services provided, by a microenterprise or a small enterprise that has no partner or linked enterprise which is not itself micro or small, and that is not subcontracted to manufacture or design the product or provide the service. The same applies to an enterprise that has qualified as medium-sized for less than one year, and to connected products for one year after a medium-sized enterprise placed them on the market.", "narrows", ["Art. 7(1)"]]]);
  assert.deepEqual(ex("ap-data-act-04"), [["Under Article 7(1), the obligations of Chapter II, Article 3(1) among them, do not apply to data generated through the use of connected products manufactured or designed, or related services provided, by a microenterprise or a small enterprise that has no partner or linked enterprise which is not itself micro or small, and that is not subcontracted to manufacture or design the product or provide the service. The same applies to an enterprise that has qualified as medium-sized for less than one year, and to connected products for one year after a medium-sized enterprise placed them on the market.", "narrows", ["Art. 7(1)"]]]);
  assert.deepEqual(ex("ap-nis2-01"), []);
  assert.deepEqual(ex("ap-nis2-02"), [["Under Article 2(1), NIS2 applies to entities of a type referred to in Annex I or II that qualify as medium-sized enterprises or exceed the ceilings for medium-sized enterprises. Regardless of size, it also applies where the entity is the sole provider in a Member State of a service essential for critical societal or economic activities, where disruption of its service could have a significant impact on public safety, public security or public health or induce a significant systemic risk, or where it is critical because of its specific importance at national or regional level (Article 2(2), points (b) to (e)), and to entities identified as critical entities under Directive (EU) 2022/2557 (Article 2(3)).", "narrows", ["Art. 2(1); Art. 2(2), points (b) to (e); Art. 2(3)"]]]);
  assert.deepEqual(ex("ap-nis2-03"), [["Under Article 2(7), NIS2 does not apply to public administration entities that carry out their activities in the areas of national security, public security, defence or law enforcement, including the prevention, investigation, detection and prosecution of criminal offences.", "excludes", ["Art. 2(7)"]]]);
  assert.deepEqual(ex("ap-dora-01"), [["Under Article 2(3), DORA does not apply to managers of alternative investment funds referred to in Article 3(2) of Directive 2011/61/EU; insurance and reinsurance undertakings referred to in Article 4 of Directive 2009/138/EC; institutions for occupational retirement provision which operate pension schemes that together have no more than 15 members in total; persons exempted under Articles 2 and 3 of Directive 2014/65/EU; insurance, reinsurance and ancillary insurance intermediaries which are microenterprises or small or medium-sized enterprises; and post office giro institutions. Under Article 2(4), a Member State may exclude entities referred to in Article 2(5), points (4) to (23), of Directive 2013/36/EU located in its territory.", "excludes", ["Art. 2(3) and (4)"]], ["Under Article 16(1), Articles 5 to 15 do not apply to small and non-interconnected investment firms, payment institutions exempted under Directive (EU) 2015/2366, institutions exempted under Directive 2013/36/EU for which the Member State has not used the option in Article 2(4), electronic money institutions exempted under Directive 2009/110/EC, and small institutions for occupational retirement provision; they must instead maintain a simplified ICT risk management framework. Under Article 24(1), microenterprises are not required to establish a digital operational resilience testing programme.", "narrows", ["Art. 16(1); Art. 24(1)"]]]);
  assert.deepEqual(ex("ap-dora-02"), []);
  assert.deepEqual(ex("ap-cra-01"), [["Under Article 2(2) to (4), (6) and (7), the Regulation does not apply to products with digital elements to which Regulation (EU) 2017/745, (EU) 2017/746 or (EU) 2019/2144 applies, to products certified in accordance with Regulation (EU) 2018/1139, to equipment within the scope of Directive 2014/90/EU, to spare parts made available to replace identical components and manufactured to the same specifications, or to products developed or modified exclusively for national security or defence purposes or specifically designed to process classified information.", "excludes", ["Art. 2(2), (3), (4), (6) and (7)"]], ["Under Article 69(2), products with digital elements placed on the market before 11 December 2027 are subject to the Regulation's requirements only if, from that date, they are substantially modified; under Article 69(3), the reporting obligations of Article 14 nevertheless apply to all of them.", "narrows", ["Art. 69(2) and (3)"]]]);
  /* questions 2a, 2b and 6a: dates and obligations */
  assert.deepEqual(ruleOf(db, 'ap-data-act-02').dates, ['tl-data-act-2025-09-12-application', 'tl-data-act-2027-01-12-application']);
  assert.deepEqual(ruleOf(db, 'ap-data-act-04').dates, ['tl-data-act-2025-09-12-application', 'tl-data-act-2026-09-12-application', 'tl-data-act-2027-09-12-application']);
  for (const id of ['ap-data-act-01', 'ap-data-act-02']) assert.deepEqual(ruleOf(db, id).obligations, ['data-act:art-25', 'data-act:art-29'], id);
  const ev = (id) => db.timeline.events.find((e) => e.id === id);
  assert.deepEqual(ev('tl-data-act-2027-01-12-application').provisions, ['data-act:art-29']);
  assert.deepEqual(ev('tl-data-act-2025-09-12-application').provisions, ['data-act:art-1', 'data-act:art-2', 'data-act:art-25', 'data-act:art-29', 'data-act:art-8']);
  /* the nine new provisions and the two headings (questions 1a-1d, 6a, 6d) */
  const heading = (pid) => db.instruments.instruments.find((i) => i.id === ix.provisionOwner.get(pid)).provisions.find((p) => p.id === pid).heading;
  assert.deepEqual(['data-act:art-1', 'data-act:art-2', 'data-act:art-29', 'nis2:art-2', 'nis2:art-6', 'dora:art-2', 'dora:art-3', 'cra:art-2', 'cra:art-3'].map(heading),
    ['Subject matter and scope', 'Definitions', 'Gradual withdrawal of switching charges', 'Scope', 'Definitions', 'Scope', 'Definitions', 'Scope', 'Definitions']);
  assert.equal(heading('data-act:art-3-1'), 'Obligation to make product data and related service data accessible to the user');
  assert.equal(heading('dora:art-28'), 'General principles');

  /* the generated pages print the counts and the new texts, and none of the old exemption strings */
  const page = (id) => visibleText(readFileSync(join(ROOT, `instruments/${id}/index.html`), 'utf8'));
  const counts = { 'data-act': 7, nis2: 7, dora: 9, cra: 7 };
  for (const [id, n] of Object.entries(counts)) assert.ok(page(id).includes(`${n} provisions recorded`), id);
  for (const id of RULES_DA_NIS2_DORA_CRA) for (const [text] of ex(id)) assert.ok(page(ruleOf(db, id).instrument).includes(text), `${id}: ${text.slice(0, 40)}`);
  const all = Object.keys(counts).map(page).join(' ');
  for (const old of ['Data holders may limit access where data qualifies as a trade secret', 'Micro and small enterprises are generally outside NIS2', 'General principles (ICT third-party risk)', 'Obligation to make connected product data accessible to the user'])
    assert.ok(!all.includes(old), old);
  assert.ok(!all.includes('[object Object]'));
});
