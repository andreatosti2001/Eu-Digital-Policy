#!/usr/bin/env node
/* ============================================================
   agent/scout/guard.mjs — the operating mode, enforced

     node agent/scout/guard.mjs

   The Scout's mode is DISCOVER → OBSERVE → REPORT → PR, and
   never DISCOVER → DIRECT PRODUCTION EDIT. That sentence is a
   promise until something checks it. This checks it.

   It reads the working tree after a run and exits non-zero if
   ANY path outside agent/scout/reports/ changed. A scheduled
   agent with a commit token is exactly the thing that should not
   be trusted to stay in its lane because its own code says it
   will: the guard runs between the Scout and the commit, so a
   Scout that started writing data/sources.json — through a bug,
   a bad merge, or an instruction it should not have followed —
   fails the job instead of opening a pull request that looks
   routine.

   It is deliberately a allowlist of paths and not a denylist of
   the dangerous ones. A denylist protects what someone
   remembered to name.
   ============================================================ */

import { execFileSync } from 'node:child_process';

/** The only paths a Scout run may create or modify. */
export const ALLOWED = [/^agent\/scout\/reports\/[^/]+\.(json|md)$/];

/** Paths whose modification is named in the failure message,
 *  because seeing WHICH one moved is the point. */
const NAMED = [
  ['data/', 'a canonical dataset — RED tier, docs/AI-SAFE-BOUNDARIES.md §3'],
  ['index.html', 'the brief itself'],
  ['i18n/', 'the locale register'],
  ['js/', 'site JavaScript'],
  ['css/', 'site styles'],
  ['style.css', 'site styles'],
  ['tools/', 'the validators'],
  ['agent/observability/', 'the observability layer'],
  ['.github/', 'the workflow definitions'],
];

export function changedPaths(cwd = process.cwd()) {
  const out = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd, encoding: 'utf8' });
  const paths = [];
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    /* XY<space>path, and 'R  old -> new' for a rename. */
    let p = line.slice(3).trim();
    const arrow = p.indexOf(' -> ');
    if (arrow !== -1) { paths.push(p.slice(0, arrow).replace(/^"|"$/g, '')); p = p.slice(arrow + 4); }
    paths.push(p.replace(/^"|"$/g, ''));
  }
  return [...new Set(paths)];
}

export function violations(paths) {
  return paths.filter((p) => !ALLOWED.some((re) => re.test(p)));
}

export function explain(path) {
  const hit = NAMED.find(([prefix]) => path === prefix || path.startsWith(prefix));
  return hit ? hit[1] : 'outside agent/scout/reports/';
}

/* Run directly, not on import, so the test suite can use the parts. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const paths = changedPaths();
  const bad = violations(paths);

  if (!bad.length) {
    console.log(`scout guard: ok — ${paths.length} changed path(s), all inside agent/scout/reports/`);
    for (const p of paths) console.log(`  · ${p}`);
    process.exit(0);
  }

  console.error('scout guard: FAILED — the Scout modified a path it is not permitted to touch.\n');
  console.error('The Scout operates DISCOVER → OBSERVE → REPORT → PR. It never edits production directly.\n');
  for (const p of bad) console.error(`  ✗ ${p}  — ${explain(p)}`);
  console.error('\nNothing has been committed. Investigate before re-running: this is either a defect in the');
  console.error('Scout or an instruction it should have refused.');
  process.exit(1);
}
