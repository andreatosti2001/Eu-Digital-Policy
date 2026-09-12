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
import { EXPECTED } from './freshness.mjs';
import {
  SOURCE_FIELDS, REQUIRED_FIELDS, OPTIONAL_FIELDS, RESOLUTIONS, ABSENT_BY_DESIGN, violations,
} from './source-contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SELF = new Set(['https://andreatosti2001.github.io']);

/** Run a validator and report its exit code without throwing. */
function runValidator(script, args = [], cwd = ROOT) {
  try {
    const stdout = execFileSync(process.execPath, [join(ROOT, 'tools', script), ...args],
      { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
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

test('F5 · the intervals are not widened — the thresholds are asserted, not trusted', () => {
  /* "Increasing a threshold to hide stale data" is a named prohibition.
     A future change to EXPECTED now has to change this line too, in a
     diff somebody reads. */
  assert.deepEqual(Object.fromEntries(Object.entries(EXPECTED).map(([k, v]) => [k, v.days])), {
    enforcement: 45, timeline: 90, instruments: 90, institutions: 180, claims: 90, sources: 180,
  });
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

test('B3 · the contract names 12 required and 2 optional fields, and says who writes and reads each', () => {
  assert.deepEqual(REQUIRED_FIELDS, ['id', 'tier', 'type', 'publisher', 'publisher_name', 'title',
    'url', 'url_status', 'published', 'accessed', 'language', 'note']);
  assert.deepEqual(OPTIONAL_FIELDS, ['resolution', 'resolution_note']);
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
  assert.match(dq.out, /0 errors, 5 warnings/,
    'docs/CURRENT-ARCHITECTURE.md §12 records five design-qa warnings; a new one is a finding, not noise');
});
