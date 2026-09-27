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
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALLOWED_RUNTIME_ORIGINS, TRACKER_HINTS, NON_FETCHING_URIS,
  foreignOrigin, scanHtml, scanCss, scanJs, scanRuntimeSurface, runtimeSurface,
} from './thirdparty.mjs';
import { EXPECTED, RECHECK } from './freshness.mjs';
import { readBaseline } from '../agent/implement/baseline.mjs';
import { audit, passages, datesIn, DERIVED_FIELDS } from './evidence-audit.mjs';
import { cspProblems, securityMeta, inlineScripts } from './csp.mjs';
import { openBacklog } from '../js/evidence-model.js';
import { build as buildArtifact, refusal } from './pages-artifact.mjs';
import * as EM from '../js/evidence-model.js';
import { procedure, contradictions } from '../js/pipeline.js';
import { statusContradictions, provisionApplication } from '../js/regulatory-model.js';
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
  for (const f of ['index.html', 'applies.html', 'bibliography.html']) {
    const html = readFileSync(join(ROOT, f), 'utf8');
    assert.deepEqual(cspProblems(html), [], f);
    assert.ok(inlineScripts(html).length >= 1);
  }
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

test('I1d · hreflang: one alternate per shipped language, on the brief only, matching the sitemap', () => {
  const reg = JSON.parse(readFileSync(join(ROOT, 'i18n', 'locales.json'), 'utf8')).locales
    .filter((l) => l.code === 'en' || l.file).map((l) => l.code);
  const index = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const alt = [...index.matchAll(/<link href="([^"]+)" hreflang="([^"]+)" rel="alternate"\/>/g)].map((m) => [m[2], m[1]]);
  assert.deepEqual(alt.map(([c]) => c).sort(), [...reg, 'x-default'].sort());
  for (const [c, href] of alt) {
    if (c === 'en' || c === 'x-default') assert.doesNotMatch(href, /\?lang=/);
    else assert.ok(href.endsWith('?lang=' + c), `${c} -> ${href}`);
  }
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  for (const c of reg.filter((x) => x !== 'en')) assert.match(sitemap, new RegExp('\\?lang=' + c + '</loc>'));
  for (const f of ['applies.html', 'bibliography.html', 'instruments.html']) {
    assert.doesNotMatch(readFileSync(join(ROOT, f), 'utf8'), /hreflang=/, `${f} is not translated and must not advertise alternates`);
  }
  /* the page honours the parameter it advertises */
  assert.match(readFileSync(join(ROOT, 'app.js'), 'utf8'), /searchParams\.get\('lang'\)/);
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
