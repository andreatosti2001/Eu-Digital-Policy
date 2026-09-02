#!/usr/bin/env node
/* ============================================================
   agent/scout/schedule/guard.mjs — the write boundary, enforced

     node agent/scout/schedule/guard.mjs

   Everything this scheduling layer is allowed to commit is
   `agent/scout/digests/*.{json,md}`. Nothing else. This is checked
   against the actual working tree after a run, not assumed from the
   code that just ran — the same reasoning as `agent/scout/selftest.mjs`
   hashing the whole of `data/` around a Scout run rather than trusting
   that nothing in `scout.mjs` writes to it.

   It is an ALLOWLIST, not a denylist of the paths this session knows
   are sensitive. A denylist protects what someone remembered to name;
   an allowlist refuses a path nobody imagined by default — including
   `agent/scout/*.mjs` itself, so a scheduled run cannot rewrite the
   contract-backed Scout it wraps, and `agent/records/` and
   `agent/observability/runs/`, so even though both are already
   git-ignored, an accidental `git add -f` is still caught here rather
   than trusted to the ignore file alone.
   ============================================================ */

import { execFileSync } from 'node:child_process';

export const ALLOWED = [/^agent\/scout\/digests\/[^/]+\.(json|md)$/];

const NAMED = [
  ['data/', 'a canonical dataset — RED tier, docs/AI-SAFE-BOUNDARIES.md §3'],
  ['index.html', 'the brief itself'],
  ['i18n/', 'the locale register'],
  ['js/', 'site JavaScript'],
  ['css/', 'site styles'],
  ['style.css', 'site styles'],
  ['tools/', 'the validators'],
  ['agent/observability/', 'the observability layer'],
  ['agent/schemas/', 'the inter-agent contracts — "no agent may bypass these" is this module'],
  ['agent/scout/authorities.mjs', 'the Source Scout core'],
  ['agent/scout/cli.mjs', 'the Source Scout core'],
  ['agent/scout/dedupe.mjs', 'the Source Scout core'],
  ['agent/scout/extract.mjs', 'the Source Scout core'],
  ['agent/scout/fixtures.mjs', 'the Source Scout core'],
  ['agent/scout/scout.mjs', 'the Source Scout core — agent/scout/schedule wraps this, and must never rewrite it'],
  ['agent/scout/selftest.mjs', 'the Source Scout core'],
  ['agent/scout/store.mjs', 'the Source Scout core'],
  ['agent/scout/transport.mjs', 'the Source Scout core'],
  ['agent/records/', 'run artifacts — git-ignored, and must stay that way'],
  ['.github/', 'the workflow definitions'],
];

export function changedPaths(cwd = process.cwd()) {
  const out = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd, encoding: 'utf8' });
  const paths = [];
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
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
  return hit ? hit[1] : 'outside agent/scout/digests/';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const paths = changedPaths();
  const bad = violations(paths);

  if (!bad.length) {
    console.log(`schedule guard: ok — ${paths.length} changed path(s), all inside agent/scout/digests/`);
    for (const p of paths) console.log(`  · ${p}`);
    process.exit(0);
  }

  console.error('schedule guard: FAILED — the scheduled run touched a path it is not permitted to.\n');
  console.error('The scheduling layer operates DISCOVER → OBSERVE → REPORT → PR. It never edits');
  console.error('production or the contract-backed Scout it wraps.\n');
  for (const p of bad) console.error(`  ✗ ${p}  — ${explain(p)}`);
  console.error('\nNothing has been committed. Investigate before re-running.');
  process.exit(1);
}
