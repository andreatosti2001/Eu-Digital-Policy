/* ============================================================
   tools/docs-check-selftest.mjs — the documentation check's own suite (D3.2)

   Every check of tools/docs-check.mjs has a planted case that must fail,
   and each is planted in a scratch tree, never in the repository: a copy
   of exactly the files the check reads (the perimeter, the readers of the
   pins, the anchors' files), checked first to be clean, then broken one
   way at a time. The first-parent and shallow-clone cases run on small
   git repositories made for the test. The repository itself is only READ,
   once, to assert the property CI relies on — 0 errors — and that the
   check wrote nothing.

   The author's decisions this suite holds the tool to: docs/ROADMAP-v2.md
   §8, «D1, D.3 question 4: the documentation check» and «Checkpoint D3.1
   of the documentation session D3: the design of the check» (which codes
   are errors), and «D3, D3.1: where the check's selftest lives» (here, in
   AGENT_SUITES); and, for check (7), «D4, D4.1: where the skill's tests
   live» (a new check of the tool, an error).
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  docsCheck, docsPaths, markdownLinks, mainFirstParent, parseHeader, headerFormProblems, vocabulary, catalogueRows,
  trackedFiles, perimeter, PINS, SEVERITY, REPO_ROOT, RULES_DOC, CATALOGUE_DOC, ROADMAP_DOC, HEADER_ABOVE_PROVENANCE,
  SKILL_DOC, SKILL_MAP_DOC, alwaysLevel, domainLists,
} from './docs-check.mjs';
import { PATTERNS } from '../agent/proposals/governance/patterns.mjs';
import { AGENT_SUITES } from '../agent/implement/checks.mjs';

const REPO = REPO_ROOT;
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=docs-check selftest', '-c', 'user.email=selftest@example.invalid', '-c', 'init.defaultBranch=main', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/* ---------------------------------------------------------------- the scratch tree */

const anchorPaths = [...new Set(PATTERNS.flatMap((p) => (p.instances ?? []).map((i) => i.anchor)).filter((a) => a && (a.kind === 'contains' || a.kind === 'path')).map((a) => a.path))];
const SOURCES = [...new Set([...perimeter(trackedFiles(REPO)), ...PINS.map((p) => p.reader), ...anchorPaths, SKILL_DOC])];

const PRISTINE = mkdtempSync(join(tmpdir(), 'docs-check-pristine-'));
for (const f of SOURCES) { mkdirSync(join(PRISTINE, dirname(f)), { recursive: true }); cpSync(join(REPO, f), join(PRISTINE, f)); }
/* What the copied documents point or link to, outside the copy: a file is copied, a directory is made empty.
   Found by the check itself, so a target a later document adds is followed without editing this suite. */
for (const f of (await docsCheck({ root: PRISTINE })).findings.filter((x) => ['POINTS', 'LINK', 'SKILL-PATH'].includes(x.code))) {
  const target = f.code === 'LINK' ? f.message.match(/resolves to `([^`]+)`/)[1] : f.message.match(/names `([^`]+)`/)[1];
  const from = join(REPO, target);
  if (!existsSync(from)) continue; /* broken in the repository too: DC0 on the repository says so */
  if (statSync(from).isDirectory()) mkdirSync(join(PRISTINE, target), { recursive: true });
  else { mkdirSync(join(PRISTINE, dirname(target)), { recursive: true }); cpSync(from, join(PRISTINE, target)); }
}

/** A fresh copy of the pristine tree, broken by `plant(edit)`; returns the check's findings. */
async function planted(plant) {
  const dir = mkdtempSync(join(tmpdir(), 'docs-check-planted-'));
  try {
    cpSync(PRISTINE, dir, { recursive: true });
    const edit = (f, fn) => { const p = join(dir, f); writeFileSync(p, fn(readFileSync(p, 'utf8'))); };
    const write = (f, text) => { mkdirSync(join(dir, dirname(f)), { recursive: true }); writeFileSync(join(dir, f), text); };
    plant({ edit, write, dir });
    return (await docsCheck({ root: dir })).findings;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const errorsOf = (findings) => findings.filter((f) => f.severity === 'error');
const codes = (findings, sev) => [...new Set(findings.filter((f) => !sev || f.severity === sev).map((f) => f.code))].sort();
/** The planted case fails with `code` as an ERROR, and the message names what was planted. */
function failsWith(findings, code, pattern) {
  const hit = findings.filter((f) => f.code === code);
  assert.ok(hit.length, `expected ${code}; got ${codes(findings).join(', ') || 'nothing'}`);
  assert.ok(hit.every((f) => f.severity === SEVERITY[code]), `${code} is reported as ${hit[0].severity}, not ${SEVERITY[code]}`);
  if (pattern) assert.ok(hit.some((f) => pattern.test(`${f.file} ${f.message}`)), `${code} does not name ${pattern}: ${hit.map((f) => f.message).join(' | ')}`);
}

/* A row of the catalogue, as the table holds it */
const row = (path) => readFileSync(join(PRISTINE, CATALOGUE_DOC), 'utf8').split('\n').find((l) => l.startsWith(`| \`${path}\` |`));
const HEADERED = 'docs/AGENT-RUNBOOK.md';

/* ---------------------------------------------------------------- the base */

test('DC0 · the pristine scratch copy is clean: 0 errors, and its commits are undetermined, not failed (no git there)', async () => {
  const { findings, measured } = await docsCheck({ root: PRISTINE });
  assert.deepEqual(errorsOf(findings), [], errorsOf(findings).map((f) => `${f.code} ${f.file} ${f.message}`).join('\n'));
  assert.equal(measured.perimeter, measured.catalogue_rows);
  assert.match(measured.main, /^undetermined/);
  assert.ok(findings.some((f) => f.code === 'CLOSED-UNDETERMINED' && f.severity === 'warning'), 'a commit that cannot be placed is said, as a warning');
});

test('DC0 · the repository: 0 errors, every check measured something, and the check wrote nothing', async () => {
  const before = git(REPO, 'status', '--porcelain');
  const { findings, measured } = await docsCheck({ root: REPO });
  assert.equal(git(REPO, 'status', '--porcelain'), before, 'docs-check changed the working tree');
  assert.deepEqual(errorsOf(findings), [], errorsOf(findings).map((f) => `${f.code} ${f.file}:${f.line} ${f.message}`).join('\n'));
  for (const k of ['perimeter', 'catalogue_rows', 'headers', 'closed_by', 'catalogue_citations', 'paths', 'anchors', 'pins', 'skill_always']) assert.ok(measured[k] > 0, `${k} measured nothing`);
  assert.equal(measured.perimeter, measured.catalogue_rows);
  assert.equal(measured.anchors, anchorPaths.length ? PATTERNS.flatMap((p) => p.instances ?? []).filter((i) => ['contains', 'path'].includes(i.anchor?.kind)).length : 0);
});

test('DC0 · every code the tool can emit has a severity, and the errors are the author\'s list', () => {
  const src = readFileSync(join(REPO, 'tools/docs-check.mjs'), 'utf8');
  const emitted = [...new Set([...src.matchAll(/add\('([A-Z-]+)'/g)].map((m) => m[1]))];
  const pathCodes = ['PATH', 'PATH-PROMPT', 'PATH-FIXTURE']; /* emitted through one ternary */
  for (const c of [...emitted, ...pathCodes]) assert.ok(SEVERITY[c], `${c} has no severity`);
  assert.deepEqual(Object.keys(SEVERITY).filter((c) => SEVERITY[c] !== 'error').sort(), ['CLOSED-UNDETERMINED', 'PATH', 'PATH-FIXTURE', 'PATH-PROMPT']);
  assert.equal(SEVERITY['PATH-FIXTURE'], 'count');
});

test('DC0 · the anchors are imported, not copied: no anchor text is written in the tool', () => {
  const src = readFileSync(join(REPO, 'tools/docs-check.mjs'), 'utf8');
  assert.match(src, /from '\.\.\/agent\/proposals\/governance\/patterns\.mjs'/);
  for (const p of PATTERNS) for (const i of p.instances ?? []) {
    if (i.anchor?.kind === 'contains' && i.anchor.text.length >= 12) assert.ok(!src.includes(i.anchor.text), `the tool holds a copy of the anchor «${i.anchor.text}»`);
  }
});

test('DC0 · the suite is in AGENT_SUITES, so a change under tools/ runs it; the check and the suite run in CI', () => {
  assert.ok(AGENT_SUITES.includes('tools/docs-check-selftest.mjs'));
  const ci = readFileSync(join(REPO, '.github', 'workflows', 'qa.yml'), 'utf8');
  assert.match(ci, /run: node tools\/docs-check\.mjs\n/, 'the check is a step of its own, which fails on an error');
  assert.match(ci, /run: node --test tools\/docs-check-selftest\.mjs\n/);
});

/* ---------------------------------------------------------------- (1) the catalogue */

test('DC1 · a document of the perimeter with no row fails (CAT-MISSING)', async () => {
  failsWith(await planted(({ write }) => write('docs/PLANTED.md', '# PLANTED\n\n**Lifecycle:** active · **Authority:** reference · **Home of:** nothing · **Catalogue:** `docs/README.md`\n')), 'CAT-MISSING', /docs\/PLANTED\.md/);
});

test('DC1 · a row for no document, a row twice, a value outside the vocabulary, a missing cell (CAT-EXTRA, CAT-DUP, CAT-VOCAB, CAT-COLUMNS)', async () => {
  const r = row(HEADERED);
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(r, `${r}\n${r.replace(HEADERED, 'docs/GONE.md')}`))), 'CAT-EXTRA', /docs\/GONE\.md/);
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(r, `${r}\n${r}`))), 'CAT-DUP', /catalogued twice/);
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(r, r.replace('| agents |', '| law |')))), 'CAT-VOCAB', /domain «law»/);
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(r, r.replace(/ \|[^|]*\|$/, ' |')))), 'CAT-COLUMNS', /6 cells/);
});

test('DC1 · the table or the rules cannot be read (CAT-PARSE, CAT-RULES)', async () => {
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace('## 1 · The catalogue', '## One · The catalogue'))), 'CAT-PARSE');
  failsWith(await planted(({ edit }) => edit(RULES_DOC, (t) => t.replace('## 7 · Domains and reading levels', '## Seven · Domains'))), 'CAT-RULES');
});

test('DC1 · the vocabulary is read from the rules, so a value the rules add is admitted', async () => {
  const v = vocabulary(readFileSync(join(REPO, RULES_DOC), 'utf8'));
  assert.deepEqual(v.lifecycle, ['active', 'closed', 'superseded', 'historical', 'uncertain']);
  assert.ok(v.domain.includes('i18n') && v.domain.length === 9 && v.kind.length === 14, JSON.stringify(v));
  const r = row(HEADERED);
  const f = await planted(({ edit }) => {
    edit(RULES_DOC, (t) => t.replace('| `docs` | the documentation itself', '| `law` | planted |\n| `docs` | the documentation itself'));
    edit(CATALOGUE_DOC, (t) => t.replace(r, r.replace('| agents |', '| law |')).replace(/- \*\*domain:\*\* .*/, (l) => l.replace('i18n 3 · ', 'i18n 3 · law 1 · ').replace(/agents (\d+)/, (_, n) => `agents ${n - 1}`)));
  });
  assert.deepEqual(codes(f, 'error'), []);
});

/* ---------------------------------------------------------------- (2) the header */

test('DC2 · a document that must carry the header and does not, or carries two (HDR-MISSING, HDR-MANY)', async () => {
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => t.replace(/^\*\*Lifecycle:\*\*.*\n\n/m, ''))), 'HDR-MISSING', new RegExp(HEADERED));
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => `${t}\n${t.match(/^\*\*Lifecycle:\*\*.*$/m)[0]}\n`)), 'HDR-MANY', new RegExp(HEADERED));
});

test('DC2 · a header out of place, out of form, or disagreeing with the catalogue (HDR-PLACE, HDR-FORM, HDR-MISMATCH)', async () => {
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => t.replace(/^(# .*\n\n)(\*\*Lifecycle:\*\*.*\n)/m, '$1A sentence first.\n\n$2'))), 'HDR-PLACE');
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => t.replace('· **Catalogue:** `docs/README.md`', '· **Catalogue:** `docs/INDEX.md`'))), 'HDR-FORM', /Catalogue/);
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => t.replace(/^\*\*Lifecycle:\*\* (\w+) · \*\*Authority:\*\* (\w+)/m, '**Authority:** $2 · **Lifecycle:** $1'))), 'HDR-FORM', /first two fields/);
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => t.replace('**Authority:** reference', '**Authority:** canonical'))), 'HDR-MISMATCH', /authority «canonical» in the header, «reference» in the catalogue/);
});

test('DC2 · a header where none is carried: a prompt, a root document (HDR-FORBIDDEN)', async () => {
  const line = readFileSync(join(PRISTINE, HEADERED), 'utf8').match(/^\*\*Lifecycle:\*\*.*$/m)[0];
  failsWith(await planted(({ edit }) => edit('docs/prompts/v2-docs-check.md', (t) => `${t}\n${line}\n`)), 'HDR-FORBIDDEN', /prompt/);
  failsWith(await planted(({ edit }) => edit('CLAUDE.md', (t) => t.replace(/^# CLAUDE\.md\n/, `# CLAUDE.md\n\n${line}\n`))), 'HDR-FORBIDDEN', /root document/);
});

test('DC2 · the one exception of place: the brief\'s header on line 1 passes, and under its title it fails', async () => {
  const [{ path }] = HEADER_ABOVE_PROVENANCE;
  assert.ok(readFileSync(join(PRISTINE, path), 'utf8').startsWith('**Lifecycle:** '));
  failsWith(await planted(({ edit }) => edit(path, (t) => `\n${t}`)), 'HDR-PLACE', /line 1/);
});

test('DC2 · the header parser and the form, as units', () => {
  const f = parseHeader('**Lifecycle:** closed · **Authority:** canonical · **Home of:** x · **Closed by:** «T» · **Catalogue:** `docs/README.md`');
  assert.deepEqual(f.map((x) => x.name), ['Lifecycle', 'Authority', 'Home of', 'Closed by', 'Catalogue']);
  const v = vocabulary(readFileSync(join(REPO, RULES_DOC), 'utf8'));
  assert.deepEqual(headerFormProblems(f, v), []);
  assert.match(headerFormProblems(parseHeader('**Lifecycle:** closed · **Authority:** canonical · **Home of:** x · **Catalogue:** `docs/README.md`'), v).join(), /closed document without «Closed by»/);
  assert.match(headerFormProblems(parseHeader('**Lifecycle:** active · **Authority:** canonical · **Home of:** x · **Closed by:** «T» · **Snapshot of:** `abc1234` · **Catalogue:** `docs/README.md`'), v).join(), /out of order|Closed by» on a document/);
  assert.match(headerFormProblems(parseHeader('**Lifecycle:** dormant · **Authority:** canonical · **Home of:** x · **Catalogue:** `docs/README.md`'), v).join(), /lifecycle «dormant»/);
  assert.equal(parseHeader('**Status:** x'), null);
});

/* ---------------------------------------------------------------- (3) «Closed by» */

test('DC3 · a «Closed by» or a catalogue citation that names no §8 title fails (CLOSED-TITLE)', async () => {
  failsWith(await planted(({ edit }) => edit('docs/F-18-READING.md', (t) => t.replace('**Closed by:** «Final checkpoint of the F-18 session»', '**Closed by:** «Final checkpoint of a session nobody ran»'))), 'CLOSED-TITLE', /nobody ran/);
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace('closed by «Final checkpoint of the F-18 session»', 'closed by «A planted title»'))), 'CLOSED-TITLE', /A planted title/);
  const r = row('docs/F-18-READING.md');
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(r, r.replace('| Final checkpoint of the F-18 session |', '| A planted bare title |')))), 'CLOSED-TITLE', /planted bare title/);
});

test('DC3 · §8 cannot be read: no title is checked, and that is an error (CLOSED-ROADMAP)', async () => {
  failsWith(await planted(({ edit }) => edit(ROADMAP_DOC, (t) => t.replace('## 8 · Approval record', '## 8 · Approvals'))), 'CLOSED-ROADMAP');
});

test('DC3 · a commit on main\'s first-parent line passes; one off it fails (CLOSED-COMMIT); a shallow clone says so (CLOSED-UNDETERMINED)', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'docs-check-git-'));
  const shallow = mkdtempSync(join(tmpdir(), 'docs-check-shallow-'));
  try {
    git(repo, 'init', '-q');
    writeFileSync(join(repo, 'a.txt'), 'one\n'); git(repo, 'add', '.'); git(repo, 'commit', '-q', '-m', 'one');
    const first = git(repo, 'rev-parse', 'HEAD');
    git(repo, 'checkout', '-q', '-b', 'side');
    writeFileSync(join(repo, 'b.txt'), 'side\n'); git(repo, 'add', '.'); git(repo, 'commit', '-q', '-m', 'side');
    const side = git(repo, 'rev-parse', 'HEAD');
    git(repo, 'checkout', '-q', 'main');
    writeFileSync(join(repo, 'c.txt'), 'two\n'); git(repo, 'add', '.'); git(repo, 'commit', '-q', '-m', 'two');
    git(repo, 'merge', '-q', '--no-ff', '-m', 'merge side', 'side');
    const mp = mainFirstParent(repo);
    assert.equal(mp.ref, 'main');
    assert.ok(mp.commits.some((c) => c === first), 'the first commit is on the first-parent line');
    assert.ok(!mp.commits.includes(side), 'a commit reached only through a merge\'s second parent is not');

    /* the whole check, in this repository: a catalogue row citing each commit */
    cpSync(PRISTINE, repo, { recursive: true });
    const cat = join(repo, CATALOGUE_DOC);
    const r = row('docs/AUDIT-2026-09-01.md');
    writeFileSync(cat, readFileSync(cat, 'utf8').replace(r, r.replace(/on `main` `[0-9a-f]+`/, `on \`main\` \`${side.slice(0, 7)}\``)));
    git(repo, 'add', '.'); git(repo, 'commit', '-q', '-m', 'tree');
    const hit = (await docsCheck({ root: repo })).findings.filter((f) => f.code === 'CLOSED-COMMIT');
    assert.ok(hit.some((f) => f.message.includes(side.slice(0, 7)) && f.severity === 'error'), 'the side commit fails');
    assert.ok(hit.every((f) => !f.message.includes(first.slice(0, 7))));

    /* a shallow clone cannot place an old commit, and says so rather than failing it */
    execFileSync('git', ['clone', '-q', '--depth', '1', `file://${repo}`, shallow], { stdio: 'ignore' });
    const s = mainFirstParent(shallow);
    assert.equal(s.shallow, true);
    const sf = (await docsCheck({ root: shallow })).findings;
    assert.ok(sf.some((f) => f.code === 'CLOSED-UNDETERMINED' && /shallow/.test(f.message) && f.severity === 'warning'));
    assert.ok(!sf.some((f) => f.code === 'CLOSED-COMMIT'), 'a shallow clone fails no commit it cannot see');
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(shallow, { recursive: true, force: true });
  }
});

/* ---------------------------------------------------------------- (4) links and paths */

test('DC4 · an internal Markdown link that does not resolve fails (LINK); an external or an anchor link is not followed', async () => {
  failsWith(await planted(({ edit }) => edit(HEADERED, (t) => `${t}\nSee [the plan](PLANTED-PLAN.md).\n`)), 'LINK', /PLANTED-PLAN\.md/);
  assert.deepEqual(markdownLinks('[a](https://x.eu/y) [b](#here) `[c](nope.md)` [d](../AGENTS.md#rules)').map((l) => l.target), ['../AGENTS.md#rules']);
  const f = await planted(({ edit }) => edit(HEADERED, (t) => `${t}\nSee [the rules](../AGENTS.md#rules) and [the site](https://eudigitalpolicy.eu/).\n`));
  assert.ok(!f.some((x) => x.code === 'LINK'));
});

test('DC4 · a «Points to» or «Superseded by» path that does not resolve fails (POINTS)', async () => {
  failsWith(await planted(({ edit }) => edit('docs/BROWSER-QA.md', (t) => t.replace(/(\*\*Points to:\*\* )[^·]*·/, '$1`agent/no-such-dir/` ·'))), 'POINTS', /agent\/no-such-dir/);
});

test('DC4 · a docs/ path not found: in code a WARNING (PATH), in a prompt a WARNING (PATH-PROMPT), in a test a COUNT (PATH-FIXTURE)', async () => {
  const f = await planted(({ write, edit }) => {
    write('tools/planted.mjs', '/* see docs/PLANTED-SPEC.md §2 */\n');
    edit('docs/prompts/v2-docs-check.md', (t) => `${t}\nScrivi \`docs/PLANTED-NEXT.md\`.\n`);
    write('agent/planted/selftest.mjs', "const f = 'docs/planted-fixture.md';\n");
  });
  failsWith(f, 'PATH', /tools\/planted\.mjs.*PLANTED-SPEC/);
  failsWith(f, 'PATH-PROMPT', /PLANTED-NEXT/);
  failsWith(f, 'PATH-FIXTURE', /planted-fixture/);
  failsWith(await planted(({ write }) => write('tools/planted-selftest.mjs', "const f = 'docs/planted-fixture.md';\n")), 'PATH-FIXTURE', /planted-selftest/);
  assert.deepEqual(codes(f, 'error'), [], 'none of the three fails the step');
});

test('DC4 · what is not a path: templates and ellipses; a name broken at a hyphen across comment lines is joined', () => {
  const got = docsPaths([
    'docs/AUDIT-*.md and docs/i18n-review/<code>.md and `docs/${name}` and docs/SESSION-25-… and docs/application/pdf/…',
    ' * the rule (docs/CONTINUOUS-',
    ' * IMPROVEMENT.md §4) and docs/HANDOVER.md.',
  ].join('\n')).map((p) => p.path);
  assert.deepEqual(got, ['docs/CONTINUOUS-IMPROVEMENT.md', 'docs/HANDOVER.md']);
});

/* ---------------------------------------------------------------- (5) anchors and pins */

test('DC5 · an anchored sentence changed fails (ANCHOR), through patterns.mjs and the governance resolver', async () => {
  const a = PATTERNS.flatMap((p) => p.instances ?? []).map((i) => i.anchor).find((x) => x?.kind === 'contains' && x.path === 'AGENTS.md');
  failsWith(await planted(({ edit }) => edit(a.path, (t) => t.split(a.text).join('[planted]'))), 'ANCHOR', /AGENTS\.md/);
});

test('DC5 · a pinned heading gone from the document, or from its reader, fails (PIN)', async () => {
  failsWith(await planted(({ edit }) => edit('AGENTS.md', (t) => t.replace('## Known hazards', '## Hazards'))), 'PIN', /Known hazards/);
  failsWith(await planted(({ edit }) => edit('.control-room/views.mjs', (t) => t.split('## Known hazards').join('## Hazards'))), 'PIN', /re-confirm/);
  failsWith(await planted(({ edit }) => edit('docs/CURRENT-ARCHITECTURE.md', (t) => t.replace('## 5. Dataset dependency map', '## 5. Datasets'))), 'PIN', /Dataset dependency map/);
});

test('DC5 · a pin read by the reader\'s own function: the baseline line, README limitation 7 (PIN)', async () => {
  failsWith(await planted(({ edit }) => edit('docs/CURRENT-ARCHITECTURE.md', (t) => t.replace('**Baseline at commit', '**Baseline as of commit'))), 'PIN', /readBaseline/);
  failsWith(await planted(({ edit }) => edit('README.md', (t) => t.replace(/screen reader/gi, 'assistive technology'))), 'PIN', /readmeLimitation/);
});

/* ---------------------------------------------------------------- (6) the totals */

test('DC6 · a total of docs/README.md §4 that is not the table\'s fails (TOTAL)', async () => {
  const cat = readFileSync(join(PRISTINE, CATALOGUE_DOC), 'utf8');
  const n = catalogueRows(cat).rows.length;
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(`- **documents:** ${n}`, `- **documents:** ${n + 1}`))), 'TOTAL', new RegExp(`documents «${n + 1}»; the table gives «${n}»`));
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(/(- \*\*kind:\*\* .*prompt )(\d+)/, (_, a, k) => `${a}${Number(k) - 1}`))), 'TOTAL', /kind/);
  failsWith(await planted(({ edit }) => edit(CATALOGUE_DOC, (t) => t.replace(/- \*\*authority:\*\*.*\n/, ''))), 'TOTAL', /no «authority» line/);
});

test.after(() => rmSync(PRISTINE, { recursive: true, force: true }));

/* ---------------------------------------------------------------- (7) the skill project-context, by level */

test('DC7 · the levels are read from their homes: «always» from the rules §7, the domain lists from the catalogue §2', () => {
  const always = alwaysLevel(readFileSync(join(PRISTINE, RULES_DOC), 'utf8'));
  assert.deepEqual(always.map((i) => i.path), ['docs/AI-SAFE-BOUNDARIES.md', 'docs/HANDOVER.md', 'AGENTS.md']);
  assert.equal(always[0].sections, '§0 and §3');
  const lists = domainLists(readFileSync(join(PRISTINE, CATALOGUE_DOC), 'utf8'));
  assert.ok(lists.length >= 9 && lists.every((l) => l.reads.length >= 1), 'every domain row lists at least one document');
});

test('DC7 · an item of the «always» level the skill does not name fails (SKILL-ALWAYS), and one the rules add is required', async () => {
  failsWith(await planted(({ edit }) => edit(SKILL_DOC, (t) => t.replaceAll('`docs/AI-SAFE-BOUNDARIES.md` §0 and §3', '`docs/AI-SAFE-BOUNDARIES.md` §0'))), 'SKILL-ALWAYS', /AI-SAFE-BOUNDARIES\.md` §0 and §3/);
  failsWith(await planted(({ edit }) => edit(SKILL_DOC, (t) => t.replaceAll('`docs/HANDOVER.md`', 'the handover'))), 'SKILL-ALWAYS', /HANDOVER/);
  failsWith(await planted(({ edit }) => edit(RULES_DOC, (t) => t.replace('the rules of `AGENTS.md` |', 'the rules of `AGENTS.md`; `docs/SOURCE-POLICY.md` |'))), 'SKILL-ALWAYS', /SOURCE-POLICY/);
});

test('DC7 · a skill that does not read the catalogue §2, or copies a domain\'s list from it, fails (SKILL-DOMAIN, SKILL-COPY)', async () => {
  failsWith(await planted(({ edit }) => edit(SKILL_DOC, (t) => t.replaceAll('`docs/README.md` §2', 'the catalogue'))), 'SKILL-DOMAIN');
  failsWith(await planted(({ edit }) => edit(SKILL_DOC, (t) => `${t}\n- evidence: \`docs/DATA-GOVERNANCE.md\`, \`docs/SOURCE-POLICY.md\`\n`)), 'SKILL-COPY', /«evidence»/);
});

test('DC7 · a path the skill names that does not exist fails (SKILL-PATH); a command in a fenced block is not a path it names', async () => {
  failsWith(await planted(({ edit }) => edit(SKILL_DOC, (t) => `${t}\nRead \`docs/NO-SUCH-LEVEL.md\`.\n`)), 'SKILL-PATH', /NO-SUCH-LEVEL/);
  const fenced = await planted(({ edit }) => edit(SKILL_DOC, (t) => `${t}\n\`\`\`\nnode \`tools/no-such.mjs\`\n\`\`\`\n`));
  assert.ok(!fenced.some((f) => f.code === 'SKILL-PATH'), 'a fenced block is a command, not a reading');
});

test('DC7 · CLAUDE.md with a reading list, or not sending a session to the skill, and a skill map that does not point to §2, fail (SKILL-ENTRY)', async () => {
  failsWith(await planted(({ edit }) => edit('CLAUDE.md', (t) => `${t}\n1. \`docs/PROJECT-CONTEXT.md\`\n`)), 'SKILL-ENTRY', /CLAUDE\.md .*PROJECT-CONTEXT/);
  failsWith(await planted(({ edit }) => edit('CLAUDE.md', (t) => t.replaceAll('`project-context`', 'the skill'))), 'SKILL-ENTRY', /CLAUDE\.md/);
  failsWith(await planted(({ edit }) => edit(SKILL_MAP_DOC, (t) => t.replace(/^(\| `project-context` \|.*)`docs\/README\.md` §2/m, '$1the catalogue'))), 'SKILL-ENTRY', /SKILL-MAP/);
});

test('DC7 · the skill gone, or the «always» row gone from the rules, fails (SKILL-READ)', async () => {
  failsWith(await planted(({ dir }) => rmSync(join(dir, SKILL_DOC))), 'SKILL-READ', /project-context/);
  failsWith(await planted(({ edit }) => edit(RULES_DOC, (t) => t.replace('| **always** |', '| **sometimes** |'))), 'SKILL-READ', /always/);
});
