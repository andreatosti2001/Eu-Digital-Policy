#!/usr/bin/env node
/* ============================================================
   tools/pages-artifact.mjs — what the public site IS, as a list

   Until 27 Sep 2026 the site was published by GitHub Pages serving `main`
   at the repository root through Jekyll. Two facts followed from that,
   and both are recorded in AGENTS.md as hazards:

     · almost the whole repository was public — agent/, docs/, tools/,
       the approval ledger — because nothing listed what the website is;
     · the ONLY exclusion was Jekyll's rule that a path segment beginning
       with "." or "_" is not served, which is what kept .control-room/
       off the public site.

   A deployment through GitHub Actions (.github/workflows/pages.yml) does
   not run Jekyll, so that second protection disappears the moment the
   Pages source is switched to "GitHub Actions". This module is why that is
   safe: the artifact is built from an ALLOWLIST of the website's own
   files, and anything else — every dot path, every private directory — is
   refused by name, not merely left out.

   Usage:
     node tools/pages-artifact.mjs build <out-dir>   build and verify
     node tools/pages-artifact.mjs verify <out-dir>  verify only
     node tools/pages-artifact.mjs list              print the allowlist

   Exit 1 if the artifact is incomplete (a page references a local file the
   artifact does not contain) or contains anything outside the allowlist.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The website. Pages, their one classic script, the stylesheets, the
 *  modules, the data they fetch, the locales, the fonts, and the sitemap.
 *  Nothing else is part of the public site. There is deliberately no
 *  robots.txt: this is a project site under /Eu-Digital-Policy/, and
 *  crawlers read robots.txt only at the root of the host, which this
 *  repository does not control (docs/DEPLOYMENT.md). */
export const PUBLIC_FILES = Object.freeze([
  'index.html', 'instruments.html', 'instrument.html', 'institutions.html',
  'enforcement.html', 'applies.html', 'bibliography.html',
  'app.js', 'style.css', 'sitemap.xml',
]);
export const PUBLIC_DIRS = Object.freeze(['css', 'js', 'data', 'i18n', 'fonts']);

/** Never published, whatever the allowlist says. A name here is a
 *  statement that its contents are private or are working material. */
export const NEVER = Object.freeze(['.control-room', '.agents', '.git', '.github', 'agent', 'docs', 'tools']);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

/** Why one relative path may not be in the artifact, or null if it may. */
export function refusal(rel) {
  const segs = rel.split(/[\\/]/);
  if (segs.some((s) => s.startsWith('.'))) return 'a dot path — private by this repository\'s one publication boundary';
  if (NEVER.includes(segs[0])) return `${segs[0]}/ is never published`;
  const allowed = PUBLIC_FILES.includes(rel) || PUBLIC_DIRS.includes(segs[0]);
  return allowed ? null : 'not on the allowlist of website files';
}

export function build(out, { root = ROOT } = {}) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of PUBLIC_FILES) {
    if (!existsSync(join(root, f))) throw new Error(`${f} is on the allowlist but does not exist`);
    cpSync(join(root, f), join(out, f));
  }
  for (const d of PUBLIC_DIRS) {
    for (const p of walk(join(root, d))) {
      const rel = relative(root, p);
      const why = refusal(rel);
      if (why) continue; /* a dot file inside an allowed dir: left out */
      mkdirSync(dirname(join(out, rel)), { recursive: true });
      cpSync(p, join(out, rel));
    }
  }
  /* Pages would otherwise run Jekyll on an artifact that is already the
     final site. Harmless, and it keeps underscore paths from being
     treated specially should one ever be added. */
  writeFileSync(join(out, '.nojekyll'), '');
  return verify(out);
}

/** Every problem with a built artifact. Empty means it is complete and clean. */
export function verify(out) {
  const problems = [];
  const files = walk(out).map((p) => relative(out, p).split(sep).join('/'));
  const have = new Set(files);
  for (const f of files) {
    if (f === '.nojekyll') continue;
    const why = refusal(f);
    if (why) problems.push(`${f}: ${why}`);
  }
  for (const f of PUBLIC_FILES) if (!have.has(f)) problems.push(`${f} is missing from the artifact`);
  /* completeness: every local reference a page or stylesheet makes */
  const local = (u) => u && !/^(?:[a-z]+:|\/\/|#|data:|mailto:)/i.test(u);
  for (const f of files.filter((x) => x.endsWith('.html'))) {
    const html = readFileSync(join(out, f), 'utf8');
    for (const m of html.matchAll(/\b(?:href|src)="([^"#?]+)/g)) {
      if (local(m[1]) && !have.has(m[1])) problems.push(`${f} references ${m[1]}, which the artifact does not contain`);
    }
  }
  for (const f of files.filter((x) => x.endsWith('.css'))) {
    const css = readFileSync(join(out, f), 'utf8');
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)/g)) {
      if (!local(m[1])) continue;
      const target = join(dirname(f), m[1]).split(sep).join('/');
      if (!have.has(target)) problems.push(`${f} references ${m[1]}, which the artifact does not contain`);
    }
  }
  /* the datasets js/data.js fetches, and the locale files the register names */
  for (const d of readdirSync(join(ROOT, 'data')).filter((n) => n.endsWith('.json'))) {
    if (!have.has(`data/${d}`)) problems.push(`data/${d} is missing`);
  }
  const reg = JSON.parse(readFileSync(join(ROOT, 'i18n', 'locales.json'), 'utf8'));
  for (const l of reg.locales) for (const k of ['file', 'data']) if (l[k] && !have.has(l[k])) problems.push(`${l[k]} (declared in i18n/locales.json) is missing`);
  return { files: files.length, problems };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, dir] = process.argv.slice(2);
  if (cmd === 'list') {
    console.log([...PUBLIC_FILES, ...PUBLIC_DIRS.map((d) => d + '/')].join('\n'));
    process.exit(0);
  }
  if (!dir || !['build', 'verify'].includes(cmd)) {
    console.error('usage: node tools/pages-artifact.mjs build|verify <out-dir> | list');
    process.exit(2);
  }
  const r = cmd === 'build' ? build(resolve(dir)) : verify(resolve(dir));
  console.log(`pages artifact: ${r.files} file(s) in ${dir}`);
  for (const p of r.problems) console.log('  ✗ ' + p);
  console.log(r.problems.length ? `${r.problems.length} problem(s)` : 'complete, and nothing outside the allowlist');
  process.exit(r.problems.length ? 1 : 0);
}
