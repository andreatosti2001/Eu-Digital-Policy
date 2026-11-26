#!/usr/bin/env node
/* ============================================================
   tools/docs-check.mjs — the documentation check (documentation session D3)

   The author's decision (docs/ROADMAP-v2.md §8, 26 Nov 2026, «D1, D.3
   question 4: the documentation check»): a new tool, a CI step. It checks
   that internal links and the paths named in code, workflows, skills and
   prompts resolve; that the sentences code depends on still exist —
   importing agent/proposals/governance/patterns.mjs rather than copying
   it; that a status header citing a §8 row title names a real one; and
   the counts the catalogue derives. Its rules are not its own: the
   vocabulary, the header's form and who carries it are
   docs/DOCUMENTATION-ARCHITECTURE.md's, read from it at run time; each
   document's classification is the catalogue's (docs/README.md §1).

   Seven checks, one family of codes each:

     CAT     (1) the catalogue covers every document of the perimeter and
                 no other, once, in the fixed columns and the vocabulary
     HDR     (2) every document that must carry the standard header carries
                 exactly one, in the fixed form and place, with the
                 catalogue's lifecycle and authority; no other carries one
     CLOSED  (3) a «Closed by» names a §8 row title; an `on \`main\``
                 commit is on main's first-parent line (a shallow clone is
                 said, never guessed); the catalogue's «…» citations too
     LINK / PATH / POINTS
             (4) internal Markdown links, `docs/…` paths named in code,
                 workflows, skills and prompts, and a header's «Points
                 to» / «Superseded by» resolve
     ANCHOR / PIN
             (5) every `contains`/`path` anchor of patterns.mjs holds, and
                 every pin below (a literal or a reader a document's text
                 is read by, confirmed in the code) still exists
     TOTAL   (6) docs/README.md §4's totals equal the table's
     SKILL   (7) the skill project-context reads by level (D4; §8, «D4, D4.1:
                 where the skill's tests live»): it names every item of the
                 «always» level, read from docs/DOCUMENTATION-ARCHITECTURE.md
                 §7; it names docs/README.md §2 and copies no domain's list
                 from it; every path it names exists; CLAUDE.md and
                 docs/SKILL-MAP.md point to it and carry no reading list

   It writes nothing. It reads the tree it is pointed at (--root, default
   the repository), so its selftest (tools/docs-check-selftest.mjs, in
   AGENT_SUITES; .github/workflows/qa.yml runs both) plants each failure
   in a scratch tree and never in the repository. What it does not establish: that a
   document is true, that a classification is right, or that an external
   URL answers — it follows no http(s) link.

   Usage: node tools/docs-check.mjs [--root <dir>] [--json] [--all]
   Exit:  1 if any ERROR, else 0. WARNINGs are findings, printed by name; COUNTs are
          printed as a number (--all lists them). SEVERITY, below, is the author's.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PATTERNS } from '../agent/proposals/governance/patterns.mjs';
import { resolveAnchor } from '../agent/proposals/governance/evidence.mjs';
import { readBaseline } from '../agent/implement/baseline.mjs';
import { readmeLimitation } from '../agent/ux/surface.mjs';
import { roadmapTitles } from './attestation-audit.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const RULES_DOC = 'docs/DOCUMENTATION-ARCHITECTURE.md';
export const CATALOGUE_DOC = 'docs/README.md';
export const ROADMAP_DOC = 'docs/ROADMAP-v2.md';
export const ROOT_DOCS = Object.freeze(['AGENTS.md', 'CLAUDE.md', 'README.md']);
export const SKILL_DOC = '.agents/skills/project-context/SKILL.md';
export const SKILL_MAP_DOC = 'docs/SKILL-MAP.md';

/** The one exception of place (§8, «After D2: the standard header on `docs/BRIEF-v2.md`»): the header sits
 *  on the first line, above the provenance comment, because the brief's title is inside the verbatim text. */
export const HEADER_ABOVE_PROVENANCE = Object.freeze([
  Object.freeze({ path: 'docs/BRIEF-v2.md', decision: 'After D2: the standard header on `docs/BRIEF-v2.md`' }),
]);

/** The kinds that carry no header (docs/DOCUMENTATION-ARCHITECTURE.md §5, «Who carries it»): the generated
 *  files (§4), the archive, and the prompts (§8, «D2, D2.3: whether the prompts under `docs/prompts/` carry
 *  the standard header»). The three root documents are outside docs/ and carry none either. */
export const NO_HEADER_KINDS = Object.freeze(['generated', 'archive', 'prompt']);

/**
 * The pins: text in a document that code reads, confirmed by reading the code on 26 Nov 2026 (D3.1) against
 * docs/DOCS-DEPENDENCY-MAP.md §0 and §B.2. §B.2 is a heuristic, and of its 60 lines only the first four below
 * are pins; the others are fixtures or coincidences (e.g. taxonomy ids that occur in a test and in the roadmap
 * independently). Three pins §B.2 could not see are added (a regex, a function, a section boundary).
 *
 * A `literal` pin is checked in BOTH files — the reader still holds the text and the document still holds it —
 * so this list cannot drift silently: if a reader changes what it looks for, the pin fails here and is updated
 * with it. A `reader` pin calls the reader's own exported function on the tree, so nothing is copied.
 */
export const PINS = Object.freeze([
  Object.freeze({ doc: 'AGENTS.md', reader: '.control-room/views.mjs', literal: '## Known hazards', why: 'repositoryCaveats() reads the section from this heading to the next; without it the Control Room shows no caveat, silently' }),
  Object.freeze({ doc: 'docs/CURRENT-ARCHITECTURE.md', reader: 'agent/detector/selftest.mjs', literal: '## 5. Dataset dependency map', why: 'the page map test compares §5 with the code' }),
  Object.freeze({ doc: 'docs/CURRENT-ARCHITECTURE.md', reader: 'agent/detector/selftest.mjs', literal: '## 6.', why: 'the end of the §5 slice' }),
  Object.freeze({ doc: 'docs/CONTROL-ROOM.md', reader: '.control-room/selftest.mjs', literal: '## 5 ', why: 'INVENTORY 1.3 reads §5\'s table from this heading' }),
  Object.freeze({ doc: 'docs/ROADMAP-v2.md', reader: 'tools/attestation-audit.mjs', literal: '## 8 · Approval record', why: 'roadmapTitles() and roadmapAudit() (A-6) read §8 from this heading' }),
  Object.freeze({ doc: 'docs/ROADMAP-v2.md', reader: 'tools/selftest.mjs', literal: '| 25 Oct 2026 | Two decisions only.', why: 'the A-6 frozen-row test replaces this text' }),
  Object.freeze({ doc: 'docs/ROADMAP-v2.md', reader: 'tools/selftest.mjs', literal: "v2 Session 21, 21.2 F-03: `ap-cra-01`'s rationale", why: 'the A-6 tests resolve a decision by this §8 title' }),
  Object.freeze({ doc: 'docs/CURRENT-ARCHITECTURE.md', reader: 'agent/implement/baseline.mjs', fn: 'readBaseline', why: 'the validator baseline is parsed from §12; readBaseline() throws if it cannot be' }),
  Object.freeze({ doc: 'README.md', reader: 'agent/ux/surface.mjs', fn: 'readmeLimitation', why: 'limitation 7 is quoted verbatim into every record Agent 8 writes; readmeLimitation() returns null if it is gone' }),
]);
const PIN_READERS = { readBaseline, readmeLimitation };

/** Where `docs/…` paths are looked for (check 4): code, workflows, skills and prompts. */
const CODE_EXT = /\.(mjs|cjs|js|ya?ml|sh)$/;
const isScanned = (f) => (CODE_EXT.test(f) && !/^(data|i18n|instruments)\//.test(f))
  || (/^\.agents\/skills\/.+\.md$/.test(f)) || (/^docs\/prompts\/[^/]+\.md$/.test(f));

/** A test file: a path it names may be a fixture planted to be absent (PATH-FIXTURE). */
const IS_TEST = (f) => /(^|[/-])(selftest|attacks)\.mjs$|\.test\.mjs$/.test(f);

/* ---------------------------------------------------------------- reading the tree */

/** The tracked files under root: `git ls-files` where root is a repository, else a walk (a scratch tree). */
export function trackedFiles(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (resolve(top) === resolve(root)) return out.split('\0').filter(Boolean).filter((f) => existsSync(join(root, f))).sort();
  } catch { /* not a repository: walk */ }
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = d ? `${d}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p); else out.push(p);
    }
  };
  walk('');
  return out.sort();
}

/** The perimeter (docs/DOCUMENTATION-ARCHITECTURE.md §0): every tracked .md under docs/, and the three root ones. */
export function perimeter(files) {
  return files.filter((f) => (f.startsWith('docs/') && f.endsWith('.md')) || ROOT_DOCS.includes(f)).sort();
}

const read = (root, f) => { try { return readFileSync(join(root, f), 'utf8'); } catch { return null; } };

/** Lines outside fenced code blocks, with their 1-based numbers. */
function proseLines(text) {
  const out = [];
  let fence = null;
  text.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(```+|~~~+)/);
    if (m) { fence = fence ? (m[1][0] === fence[0] && m[1].length >= fence.length ? null : fence) : m[1]; return; }
    if (!fence) out.push({ n: i + 1, line });
  });
  return out;
}

/** The section of a Markdown text from a heading that starts with `head` to the next heading of the same level. */
function section(text, head) {
  const lines = text.split('\n');
  const at = lines.findIndex((l) => l.startsWith(head));
  if (at < 0) return null;
  const level = head.match(/^#+/)[0];
  let end = lines.findIndex((l, i) => i > at && new RegExp(`^${level} `).test(l));
  if (end < 0) end = lines.length;
  return { start: at + 1, lines: lines.slice(at, end) };
}

/** A Markdown table's rows as cells, split on unescaped pipes outside inline code. */
function cells(line) {
  const out = [];
  let cur = '';
  let code = false;
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '`') code = !code;
    if (c === '|' && !code && s[i - 1] !== '\\') { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

const unquote = (cell) => cell.replace(/^`|`$/g, '');

/* ---------------------------------------------------------------- the rules, read from their home */

/**
 * The vocabulary of docs/DOCUMENTATION-ARCHITECTURE.md, read from its tables: §1 lifecycle, §2 authority,
 * §3 kind, §7 domain; `uncertain` (§6) is admitted for lifecycle and authority. Null where a table is gone.
 */
export function vocabulary(rulesText) {
  if (rulesText == null) return null;
  const firstColumn = (head) => {
    const s = section(rulesText, head);
    if (!s) return null;
    const vals = s.lines.filter((l) => /^\| `[a-z0-9-]+` \|/.test(l)).map((l) => l.match(/^\| `([a-z0-9-]+)`/)[1]);
    return vals.length ? vals : null;
  };
  const lifecycle = firstColumn('## 1 ');
  const authority = firstColumn('## 2 ');
  const kind = firstColumn('## 3 ');
  const domain = firstColumn('## 7 ');
  if (!lifecycle || !authority || !kind || !domain) return null;
  return { lifecycle: [...lifecycle, 'uncertain'], authority: [...authority, 'uncertain'], kind, domain };
}

/**
 * The «always» reading level, read from its home, docs/DOCUMENTATION-ARCHITECTURE.md §7: one item per
 * `;`-separated part of the row's second cell, as { path, sections } — `docs/AI-SAFE-BOUNDARIES.md` §0 and §3
 * gives { path: 'docs/AI-SAFE-BOUNDARIES.md', sections: '§0 and §3' }. Null where the row is gone.
 */
export function alwaysLevel(rulesText) {
  const s = rulesText == null ? null : section(rulesText, '## 7 ');
  const line = s?.lines.find((l) => /^\|\s*\*\*always\*\*\s*\|/.test(l));
  if (!line) return null;
  const items = cells(line)[1].split(';').map((part) => part.match(/`([^`]+)`(?:\s+(§[^;]*))?/))
    .filter(Boolean).map((m) => ({ path: m[1], sections: (m[2] ?? '').trim() }));
  return items.length ? items : null;
}

/** docs/README.md §2: per domain, the documents its «A task here reads» column names. Null where §2 is gone. */
export function domainLists(catText) {
  const s = catText == null ? null : section(catText, '## 2 ');
  if (!s) return null;
  const out = s.lines.filter((l) => /^\| `[a-z0-9-]+` \|/.test(l)).map((l) => {
    const c = cells(l);
    return { domain: unquote(c[0]), reads: [...new Set([...c[1].matchAll(/`([^`]+\.md)`/g)].map((m) => m[1]))] };
  });
  return out.length ? out : null;
}

/** The repository paths a text names in inline code outside fenced blocks: a file with an extension, at the root or under a directory. */
const REPO_PATH = /^(?:\.?[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:md|mjs|js|json|ya?ml)$/;
export function namedPaths(text) {
  const out = [];
  for (const { n, line } of proseLines(text)) {
    for (const m of line.matchAll(/`([^`\s]+)`/g)) if (REPO_PATH.test(m[1])) out.push({ n, path: m[1] });
  }
  return out;
}

/* ---------------------------------------------------------------- the catalogue */

export const CATALOGUE_COLUMNS = Object.freeze(['Document', 'Domain', 'Kind', 'Lifecycle', 'Authority', 'Home of / points to', '§8 or reason']);

/** docs/README.md §1's rows: { path, domain, kind, lifecycle, authority, home, note, line }, or null. */
export function catalogueRows(catText) {
  if (catText == null) return null;
  const s = section(catText, '## 1 ');
  if (!s) return null;
  const rows = [];
  let header = null;
  s.lines.forEach((line, i) => {
    if (!line.startsWith('|')) return;
    const c = cells(line);
    if (!header) { header = c; return; }
    if (/^-+$/.test(c[0].replace(/:/g, ''))) return;
    rows.push({ cells: c, path: unquote(c[0]), domain: c[1], kind: c[2], lifecycle: c[3], authority: c[4], home: c[5], note: c[6] ?? '', line: s.start + i });
  });
  return { header, rows };
}

/* ---------------------------------------------------------------- the header */

const HEADER_START = /^\*\*Lifecycle:\*\* /;
/** A line that is a header, or meant to be one: it opens with the first field, or it is a line of bold fields
 *  that ends with the «Catalogue» field. The second form is how a header with its fields out of order is found
 *  (and failed by its form) rather than missed. */
const IS_HEADER = (line) => HEADER_START.test(line) || /^\*\*[A-Za-z ]+:\*\* .* · \*\*Catalogue:\*\* /.test(line);
const FIELD = /^\*\*([A-Za-z ]+):\*\* ([\s\S]*)$/;

/** A header line parsed into its fields, in order: [{ name, value }], or null if it is not one. */
export function parseHeader(line) {
  if (!IS_HEADER(line)) return null;
  return line.split(' · **').map((part, i) => {
    const m = (i ? `**${part}` : part).match(FIELD);
    return m ? { name: m[1], value: m[2].trim() } : { name: null, value: part };
  });
}

/** The form of docs/DOCUMENTATION-ARCHITECTURE.md §5. Returns the problems, [] if none. */
export function headerFormProblems(fields, vocab) {
  const p = [];
  const names = fields.map((f) => f.name);
  if (names.includes(null)) return ['a field is not of the form **Name:** value'];
  const expect = ['Lifecycle', 'Authority'];
  if (names[0] !== 'Lifecycle' || names[1] !== 'Authority') p.push(`the first two fields are ${names.slice(0, 2).join(', ')}, not ${expect.join(', ')}`);
  const home = names[2];
  if (home !== 'Home of' && home !== 'Points to') p.push(`the third field is ${home ?? 'missing'}, not «Home of» or «Points to»`);
  if (names[names.length - 1] !== 'Catalogue') p.push('the last field is not «Catalogue»');
  else if (fields[fields.length - 1].value !== '`docs/README.md`') p.push(`«Catalogue» is ${fields[fields.length - 1].value}, not \`docs/README.md\``);
  const middle = names.slice(3, -1);
  const allowed = ['Snapshot of', 'Closed by', 'Superseded by'];
  for (const n of middle) if (!allowed.includes(n)) p.push(`«${n}» is not a field of the header`);
  const order = middle.map((n) => allowed.indexOf(n));
  if (order.some((v, i) => i && v <= order[i - 1])) p.push(`the optional fields are out of order or repeated: ${middle.join(', ')}`);
  if (middle.includes('Closed by') && middle.includes('Superseded by')) p.push('«Closed by» and «Superseded by» together');
  const lc = fields[0]?.value;
  if (vocab && lc && !vocab.lifecycle.includes(lc)) p.push(`lifecycle «${lc}» is not in the vocabulary`);
  const au = fields[1]?.value;
  if (vocab && au && !vocab.authority.includes(au)) p.push(`authority «${au}» is not in the vocabulary`);
  if (lc === 'closed' && !middle.includes('Closed by')) p.push('a closed document without «Closed by»');
  if (lc === 'superseded' && !middle.includes('Superseded by')) p.push('a superseded document without «Superseded by»');
  if (middle.includes('Closed by') && lc !== 'closed') p.push(`«Closed by» on a document whose lifecycle is ${lc}`);
  const snap = fields.find((f) => f.name === 'Snapshot of');
  if (snap && !/^`[0-9a-f]{7,40}`$/.test(snap.value)) p.push(`«Snapshot of» is ${snap.value}, not a commit in backticks`);
  return p;
}

/** Where the header must be: the first non-blank line after the title (`# `), or line 1 for the exception. */
function headerPlaceOk(path, text, lineNo) {
  const lines = text.split('\n');
  if (HEADER_ABOVE_PROVENANCE.some((e) => e.path === path)) return lineNo === 1;
  const title = lines.findIndex((l) => /^# /.test(l));
  if (title < 0) return false;
  let k = title + 1;
  while (k < lines.length && !lines[k].trim()) k++;
  return k + 1 === lineNo && !lines[title + 1].trim() && (lines[lineNo] ?? '').trim() === '';
}

/* ---------------------------------------------------------------- git: main's first-parent line */

/** The first-parent commits of main, or { undetermined: why }. */
export function mainFirstParent(root) {
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try { git(['rev-parse', '--git-dir']); } catch { return { undetermined: 'not a git repository' }; }
  let shallow = false;
  try { shallow = git(['rev-parse', '--is-shallow-repository']) === 'true'; } catch { /* old git */ }
  let ref = null;
  for (const r of ['origin/main', 'main']) { try { git(['rev-parse', '--verify', '--quiet', `${r}^{commit}`]); ref = r; break; } catch { /* next */ } }
  if (!ref) return { undetermined: 'no main or origin/main in this clone' };
  const list = git(['rev-list', '--first-parent', ref]).split('\n').filter(Boolean);
  return { ref, shallow, commits: list };
}

/* ---------------------------------------------------------------- links and paths */

const MD_LINK = /(?<!!)\[([^\]\n]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/** Internal Markdown links of a text: [{ n, target }] outside fences and inline code. */
export function markdownLinks(text) {
  const out = [];
  for (const { n, line } of proseLines(text)) {
    const bare = line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
    for (const m of bare.matchAll(MD_LINK)) {
      const t = m[2];
      if (/^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith('#') || t.startsWith('//')) continue;
      out.push({ n, target: t });
    }
  }
  return out;
}

const DOCS_PATH = /(?<![\w./-])docs\/[A-Za-z0-9_][A-Za-z0-9._/*<>{}$-]*/g;

/**
 * `docs/…` paths named in a text: [{ n, path }]. A template (`<code>`, `*`, `${…}`) is not a path; a file
 * name broken across two comment lines at a hyphen is joined with the first word of the next line first.
 */
export function docsPaths(text) {
  const out = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(DOCS_PATH)) {
      let p = m[0];
      if (p.endsWith('-') && !line.slice(m.index + p.length).trim()) {
        const next = (lines[i + 1] ?? '').replace(/^[\s*/#]+/, '').match(/^[A-Za-z0-9._/-]+/);
        if (next) p += next[0];
      }
      if (/[*<>{}$]/.test(p) || /\.\.\.?$|…$/.test(p) || line[m.index + m[0].length] === '…') continue;
      p = p.replace(/[.-]+$/, '');
      out.push({ n: i + 1, path: p });
    }
  });
  return out;
}

const exists = (root, p) => existsSync(join(root, p));

/* ---------------------------------------------------------------- the check */

/**
 * Run every check on the tree at `root`. Pure apart from reading files and git.
 * @returns {{ findings: Array<{code, severity, file, line, message}>, measured: object }}
 */
export async function docsCheck({ root = REPO_ROOT, severity = SEVERITY } = {}) {
  const findings = [];
  const add = (code, file, line, message) => findings.push({ code, severity: severity[code] ?? 'error', file, line, message });
  const files = trackedFiles(root);
  const fileSet = new Set(files);
  const docs = perimeter(files);
  const measured = { perimeter: docs.length };

  /* the rules, the catalogue, §8 */
  const vocab = vocabulary(read(root, RULES_DOC));
  if (!vocab) add('CAT-RULES', RULES_DOC, null, 'the vocabulary tables (§1 lifecycle, §2 authority, §3 kind, §7 domain) could not be read: values were not checked against it');
  const catText = read(root, CATALOGUE_DOC);
  const cat = catalogueRows(catText);
  const roadmap = read(root, ROADMAP_DOC);
  const titles = roadmapTitles(roadmap);
  if (!titles) add('CLOSED-ROADMAP', ROADMAP_DOC, null, '§8 could not be read: no title citation was checked');
  const titleSet = new Set(titles ?? []);
  const isTitle = (t) => titleSet.has(t) || (/…$/.test(t) && (titles ?? []).some((x) => x.startsWith(t.slice(0, -1))));

  /* (1) the catalogue */
  const byPath = new Map();
  if (!cat) add('CAT-PARSE', CATALOGUE_DOC, null, '§1 «The catalogue» table could not be read');
  else {
    if (cat.header.join('|') !== CATALOGUE_COLUMNS.join('|')) add('CAT-COLUMNS', CATALOGUE_DOC, null, `the columns are «${cat.header.join(' | ')}», not the fixed «${CATALOGUE_COLUMNS.join(' | ')}»`);
    for (const r of cat.rows) {
      if (r.cells.length !== CATALOGUE_COLUMNS.length) add('CAT-COLUMNS', CATALOGUE_DOC, r.line, `${r.path}: ${r.cells.length} cells, not ${CATALOGUE_COLUMNS.length}`);
      if (byPath.has(r.path)) add('CAT-DUP', CATALOGUE_DOC, r.line, `${r.path} is catalogued twice (first at line ${byPath.get(r.path).line})`);
      else byPath.set(r.path, r);
      if (!docs.includes(r.path)) add('CAT-EXTRA', CATALOGUE_DOC, r.line, `${r.path} is catalogued and is not a document of the perimeter${fileSet.has(r.path) ? '' : ' (no such tracked file)'}`);
      if (vocab) for (const k of ['domain', 'kind', 'lifecycle', 'authority']) {
        if (!vocab[k].includes(r[k])) add('CAT-VOCAB', CATALOGUE_DOC, r.line, `${r.path}: ${k} «${r[k]}» is not in ${RULES_DOC}'s vocabulary`);
      }
    }
    for (const d of docs) if (!byPath.has(d)) add('CAT-MISSING', d, null, `a document of the perimeter with no row in ${CATALOGUE_DOC} §1`);
    measured.catalogue_rows = cat.rows.length;
  }

  /* (2) the header, (3) its «Closed by», (4) its «Points to» / «Superseded by» */
  const main = mainFirstParent(root);
  const onMain = (sha) => main.commits?.some((c) => c.startsWith(sha));
  let closedChecked = 0;
  const checkCommit = (file, line, sha) => {
    if (main.undetermined) { add('CLOSED-UNDETERMINED', file, line, `\`${sha}\` not checked: ${main.undetermined}`); return; }
    if (onMain(sha)) return;
    if (main.shallow) add('CLOSED-UNDETERMINED', file, line, `\`${sha}\` is not in this clone's first-parent line of ${main.ref}, and the clone is shallow: not determined (run git fetch --unshallow)`);
    else add('CLOSED-COMMIT', file, line, `\`${sha}\` is not a commit on ${main.ref}'s first-parent line`);
  };
  let headers = 0;
  for (const d of docs) {
    const text = read(root, d);
    if (text == null) continue;
    const row = byPath.get(d);
    const mustCarry = d.startsWith('docs/') && !d.startsWith('docs/archive/') && !(row && NO_HEADER_KINDS.includes(row.kind));
    const found = proseLines(text).filter(({ line }) => IS_HEADER(line));
    if (!mustCarry) {
      for (const h of found) add('HDR-FORBIDDEN', d, h.n, `carries a standard header, and ${ROOT_DOCS.includes(d) ? 'a root document' : `a ${row?.kind ?? 'document of its kind'}`} carries none (${RULES_DOC} §5)`);
      continue;
    }
    if (!row) continue; /* CAT-MISSING says it; there is no row to compare with */
    if (!found.length) { add('HDR-MISSING', d, null, `no standard header (${RULES_DOC} §5)`); continue; }
    if (found.length > 1) add('HDR-MANY', d, found[1].n, `${found.length} standard headers, at lines ${found.map((h) => h.n).join(', ')}`);
    const h = found[0];
    headers += 1;
    if (!headerPlaceOk(d, text, h.n)) add('HDR-PLACE', d, h.n, HEADER_ABOVE_PROVENANCE.some((e) => e.path === d) ? 'the header is not on line 1, above the provenance comment' : 'the header is not the line directly under the title, followed by a blank line');
    const fields = parseHeader(h.line);
    for (const p of headerFormProblems(fields, vocab)) add('HDR-FORM', d, h.n, p);
    const get = (n) => fields.find((f) => f.name === n)?.value;
    if (get('Lifecycle') !== row.lifecycle) add('HDR-MISMATCH', d, h.n, `lifecycle «${get('Lifecycle')}» in the header, «${row.lifecycle}» in the catalogue (line ${row.line})`);
    if (get('Authority') !== row.authority) add('HDR-MISMATCH', d, h.n, `authority «${get('Authority')}» in the header, «${row.authority}» in the catalogue (line ${row.line})`);
    const closedBy = get('Closed by');
    if (closedBy) {
      closedChecked += 1;
      const t = closedBy.match(/^«(.+)»$/);
      const c = closedBy.match(/^on `main` `([0-9a-f]{7,40})`$/);
      if (t) { if (!isTitle(t[1])) add('CLOSED-TITLE', d, h.n, `«Closed by» cites «${t[1]}», which is not the title of a row of ${ROADMAP_DOC} §8`); }
      else if (c) checkCommit(d, h.n, c[1]);
      else add('HDR-FORM', d, h.n, `«Closed by» is ${closedBy}: neither «a §8 title» nor on \`main\` \`<commit>\``);
    }
    for (const n of ['Points to', 'Superseded by']) {
      const v = get(n);
      if (!v) continue;
      for (const m of v.matchAll(/`([^`]+)`/g)) {
        const p = m[1].replace(/#.*$/, '');
        if (/^(docs|agent|tools|js|css|data|i18n|\.control-room|\.agents|\.github)\//.test(p) || /\.(md|mjs|js|json)$/.test(p)) {
          if (!exists(root, p)) add('POINTS', d, h.n, `«${n}» names \`${p}\`, which does not exist`);
        }
      }
    }
  }
  measured.headers = headers;
  measured.closed_by = closedChecked;
  measured.main = main.undetermined ? `undetermined: ${main.undetermined}` : `${main.ref}${main.shallow ? ' (shallow)' : ''}, ${main.commits.length} first-parent commits`;

  /* (3) the catalogue's own citations: every «…» in a «§8 or reason» cell, and every `on \`main\`` commit */
  let citations = 0;
  if (cat) for (const r of cat.rows) {
    for (const m of r.note.matchAll(/«([^«»]+)»/g)) {
      citations += 1;
      if (!isTitle(m[1])) add('CLOSED-TITLE', CATALOGUE_DOC, r.line, `${r.path}: cites «${m[1]}», which is not the title of a row of ${ROADMAP_DOC} §8`);
    }
    for (const m of r.note.matchAll(/on `main` `([0-9a-f]{7,40})`/g)) { citations += 1; checkCommit(CATALOGUE_DOC, r.line, m[1]); }
    if (r.lifecycle === 'closed' && !/«[^«»]+»|on `main` `/.test(r.note)) {
      citations += 1;
      if (!isTitle(r.note)) add('CLOSED-TITLE', CATALOGUE_DOC, r.line, `${r.path} is closed, and its «§8 or reason» «${r.note}» is not the title of a row of ${ROADMAP_DOC} §8`);
    }
  }
  measured.catalogue_citations = citations;

  /* (4) internal Markdown links, in the perimeter and the skills */
  let links = 0;
  for (const f of files.filter((x) => docs.includes(x) || /^\.agents\/skills\/.+\.md$/.test(x))) {
    const text = read(root, f);
    if (text == null) continue;
    for (const { n, target } of markdownLinks(text)) {
      links += 1;
      const p = decodeURIComponent(target.replace(/#.*$/, '').replace(/\?.*$/, ''));
      if (!p) continue;
      const to = posix.normalize(posix.join(posix.dirname(f), p));
      if (to.startsWith('..') || !exists(root, to)) add('LINK', f, n, `the link to \`${target}\` resolves to \`${to}\`, which does not exist`);
    }
  }
  measured.links = links;

  /* (4) `docs/…` paths named in code, workflows, skills and prompts */
  let paths = 0;
  for (const f of files.filter(isScanned)) {
    const text = read(root, f);
    if (text == null) continue;
    for (const { n, path } of docsPaths(text)) {
      paths += 1;
      if (!exists(root, path)) add(f.startsWith('docs/prompts/') ? 'PATH-PROMPT' : IS_TEST(f) ? 'PATH-FIXTURE' : 'PATH', f, n, `names \`${path}\`, which does not exist`);
    }
  }
  measured.paths = paths;

  /* (5) the anchors, imported */
  let anchors = 0;
  for (const pat of PATTERNS) for (const inst of pat.instances ?? []) {
    const a = inst.anchor;
    if (!a || (a.kind !== 'contains' && a.kind !== 'path')) continue;
    anchors += 1;
    const r = await resolveAnchor(a, { root });
    if (r.state !== 'resolved') add('ANCHOR', a.path, null, `${pat.id}: ${r.why}`);
  }
  measured.anchors = anchors;

  /* (5) the pins */
  for (const pin of PINS) {
    if (pin.literal) {
      const doc = read(root, pin.doc);
      const reader = read(root, pin.reader);
      if (reader == null) add('PIN', pin.reader, null, `the reader of ${pin.doc} is gone: the pin «${pin.literal}» must be re-confirmed in the code`);
      else if (!reader.includes(pin.literal)) add('PIN', pin.reader, null, `no longer holds «${pin.literal}»: re-confirm what it reads in ${pin.doc} and update the pin with it`);
      if (doc == null) add('PIN', pin.doc, null, `is gone, and ${pin.reader} reads it (${pin.why})`);
      else if (!doc.includes(pin.literal)) add('PIN', pin.doc, null, `no longer holds «${pin.literal}», which ${pin.reader} reads: ${pin.why}`);
    } else {
      let ok = false;
      let why = '';
      try { ok = PIN_READERS[pin.fn]({ root }) != null; } catch (e) { why = `: ${e.message}`; }
      if (!ok) add('PIN', pin.doc, null, `${pin.reader} ${pin.fn}() cannot read it${why} (${pin.why})`);
    }
  }
  measured.pins = PINS.length;

  /* (7) the skill project-context, by level */
  {
    const skill = read(root, SKILL_DOC);
    const always = alwaysLevel(read(root, RULES_DOC));
    const lists = domainLists(catText);
    if (skill == null) add('SKILL-READ', SKILL_DOC, null, 'is gone: no session is told what to read');
    if (!always) add('SKILL-READ', RULES_DOC, null, '§7 has no «always» row the skill can be checked against');
    if (!lists) add('SKILL-READ', CATALOGUE_DOC, null, '§2 «What a task reads, by domain» could not be read');
    if (skill != null) {
      for (const item of always ?? []) {
        const want = item.sections ? `\`${item.path}\` ${item.sections}` : `\`${item.path}\``;
        if (!skill.includes(want)) add('SKILL-ALWAYS', SKILL_DOC, null, `does not name «${want}», which ${RULES_DOC} §7 puts in the «always» level`);
      }
      measured.skill_always = always?.length ?? 0;
      if (!skill.includes(`\`${CATALOGUE_DOC}\` §2`)) add('SKILL-DOMAIN', SKILL_DOC, null, `does not name \`${CATALOGUE_DOC}\` §2, where the «by domain» level is read`);
      const named = new Set(namedPaths(skill).map((x) => x.path));
      for (const { domain, reads } of lists ?? []) {
        const copied = reads.filter((r) => named.has(r));
        if (copied.length >= 2) add('SKILL-COPY', SKILL_DOC, null, `names ${copied.length} of the documents ${CATALOGUE_DOC} §2 lists for «${domain}» (${copied.join(', ')}): a copy of the list, which has one home`);
      }
      for (const { n, path } of namedPaths(skill)) if (!exists(root, path)) add('SKILL-PATH', SKILL_DOC, n, `names \`${path}\`, which does not exist`);
    }
    const claude = read(root, 'CLAUDE.md');
    if (claude == null || !claude.includes('`AGENTS.md`') || !claude.includes('`project-context`')) add('SKILL-ENTRY', 'CLAUDE.md', null, 'does not send a session to `AGENTS.md` and the skill `project-context`');
    else for (const { n, path } of docsPaths(claude)) add('SKILL-ENTRY', 'CLAUDE.md', n, `names \`${path}\`: a reading list here is a second home of what the skill reads`);
    const mapRow = (read(root, SKILL_MAP_DOC) ?? '').split('\n').find((l) => l.startsWith('| `project-context` |'));
    if (!mapRow || !mapRow.includes(`\`${CATALOGUE_DOC}\` §2`)) add('SKILL-ENTRY', SKILL_MAP_DOC, null, `its \`project-context\` row does not name \`${CATALOGUE_DOC}\` §2, where the skill reads the «by domain» level`);
  }

  /* (6) the totals of docs/README.md §4 */
  if (cat && catText != null) {
    const s = section(catText, '## 4 ');
    if (!s) add('TOTAL', CATALOGUE_DOC, null, '§4 «Totals» could not be read');
    else {
      const derive = (k) => {
        const m = new Map();
        for (const r of cat.rows) m.set(r[k], (m.get(r[k]) ?? 0) + 1);
        return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([v, n]) => `${v} ${n}`).join(' · ');
      };
      const want = { documents: String(cat.rows.length), domain: derive('domain'), kind: derive('kind'), lifecycle: derive('lifecycle'), authority: derive('authority') };
      for (const [k, v] of Object.entries(want)) {
        const i = s.lines.findIndex((l) => l.startsWith(`- **${k}:** `));
        if (i < 0) { add('TOTAL', CATALOGUE_DOC, null, `§4 has no «${k}» line`); continue; }
        const got = s.lines[i].slice(`- **${k}:** `.length).trim();
        if (got !== v) add('TOTAL', CATALOGUE_DOC, s.start + i, `§4 says ${k} «${got}»; the table gives «${v}»`);
      }
    }
  }
  return { findings, measured };
}

/**
 * What is an ERROR (the step fails), a WARNING (a finding, printed by name, the step stays green) and a COUNT
 * (printed as a number; listed with --all). The author's decision on the D3.1 measurement (docs/ROADMAP-v2.md
 * §8, «Checkpoint D3.1 of the documentation session D3: the design of the check»): every check that measured 0
 * on `main` is an error; a `docs/…` path not found in code, a workflow or a prompt, and a commit a shallow clone
 * cannot place, are warnings; the paths test files plant to be absent are counted.
 */
export const SEVERITY = Object.freeze({
  'CAT-RULES': 'error', 'CAT-PARSE': 'error', 'CAT-COLUMNS': 'error', 'CAT-DUP': 'error', 'CAT-EXTRA': 'error', 'CAT-MISSING': 'error', 'CAT-VOCAB': 'error',
  'HDR-MISSING': 'error', 'HDR-MANY': 'error', 'HDR-PLACE': 'error', 'HDR-FORM': 'error', 'HDR-MISMATCH': 'error', 'HDR-FORBIDDEN': 'error',
  'CLOSED-ROADMAP': 'error', 'CLOSED-TITLE': 'error', 'CLOSED-COMMIT': 'error', 'CLOSED-UNDETERMINED': 'warning',
  LINK: 'error', POINTS: 'error', PATH: 'warning', 'PATH-PROMPT': 'warning', 'PATH-FIXTURE': 'count',
  ANCHOR: 'error', PIN: 'error', TOTAL: 'error',
  /* (7), the author's decision (§8, «D4, D4.1: where the skill's tests live»): a new check, an error */
  'SKILL-READ': 'error', 'SKILL-ALWAYS': 'error', 'SKILL-DOMAIN': 'error', 'SKILL-COPY': 'error', 'SKILL-PATH': 'error', 'SKILL-ENTRY': 'error',
});

/* ---------------------------------------------------------------- the command */

function format({ findings, measured }, { all = false } = {}) {
  const out = [];
  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');
  const counted = findings.filter((f) => f.severity === 'count');
  out.push('DOCS-CHECK  the documentation check (tools/docs-check.mjs)');
  out.push(`MEASURED   ${Object.entries(measured).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  const byCode = new Map();
  for (const f of findings) byCode.set(f.code, (byCode.get(f.code) ?? 0) + 1);
  out.push(`BY CODE    ${byCode.size ? [...byCode].sort().map(([c, n]) => `${c} ${n}`).join(' · ') : 'none'}`);
  for (const [label, list] of [['ERROR', errors], ['WARNING', warnings], ...(all ? [['COUNTED', counted]] : [])]) {
    for (const f of list) out.push(`${label.padEnd(8)} ${f.code} ${f.file}${f.line ? `:${f.line}` : ''} — ${f.message}`);
  }
  out.push(`ERRORS   ${errors.length}`);
  out.push(`WARNINGS ${warnings.length}`);
  out.push(`COUNTED  ${counted.length}${counted.length && !all ? ' (paths test files plant to be absent; --all lists them)' : ''}`);
  out.push('Not established: that a document is true, that a classification is right, that an external URL answers.');
  return out.join('\n');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--root');
  const root = at >= 0 ? resolve(args[at + 1]) : REPO_ROOT;
  const result = await docsCheck({ root });
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else console.log(format(result, { all: args.includes('--all') }));
  process.exit(result.findings.some((f) => f.severity === 'error') ? 1 : 0);
}
