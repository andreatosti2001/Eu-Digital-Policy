#!/usr/bin/env node
/* ============================================================
   .agents/skills/legal-site-qa/scripts/baseline.mjs

     node .agents/skills/legal-site-qa/scripts/baseline.mjs          # run and print
     node .agents/skills/legal-site-qa/scripts/baseline.mjs --save   # run and store the snapshot
     node .agents/skills/legal-site-qa/scripts/baseline.mjs --check  # run and diff against it
     …                                        [--file <path>] [--json]

   Runs the repository's own checks, in one pass, and compares the
   result against a snapshot taken earlier in the session.

   It asserts NOTHING of its own. There is no expected error count
   in this file and no copy of the recorded baseline: the numbers
   come from the tools, and the comparison is against a snapshot the
   agent took. The recorded project baseline has one home —
   docs/CURRENT-ARCHITECTURE.md §12 — and duplicating it into a
   script would be the second copy this project exists to prevent.

   Exit 1 only when --check finds a difference. Zero dependencies.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const argv = process.argv.slice(2);
const has = (f) => argv.includes(`--${f}`);
const opt = (f, d) => { const i = argv.indexOf(`--${f}`); return i === -1 ? d : argv[i + 1]; };
const SNAP = join(ROOT, opt('file', '.agents/.qa-baseline.json'));

/* Each check declares how to read its own output. `digest: false`
   means the text legitimately changes between runs (freshness
   prints day counts against today's date), so only the extracted
   numbers and the exit code are compared. */
const CHECKS = [
  {
    id: 'validate', cmd: ['tools/validate.mjs'], digest: true,
    extract: (o) => ({
      errors: num(o, /^ERRORS\s+(\d+)/m),
      warnings: num(o, /^WARNINGS\s+(\d+)/m),
      unverified: num(o, /^UNVERIFIED \/ REQUIRES VERIFICATION\s+(\d+)/m),
    }),
  },
  {
    id: 'i18n-audit', cmd: ['tools/i18n-audit.mjs'], digest: true,
    extract: (o) => ({ errors: num(o, /ERRORS\s+(\d+)/), warnings: num(o, /WARNINGS\s+(\d+)/) }),
  },
  {
    id: 'design-qa', cmd: ['tools/design-qa.mjs'], digest: true,
    extract: (o) => ({ errors: num(o, /(\d+) errors?,/), warnings: num(o, /,\s*(\d+) warnings?/) }),
  },
  {
    id: 'freshness', cmd: ['tools/freshness.mjs'], digest: false,
    extract: (o) => ({ overdue: (o.match(/^\s{2}! /gm) || []).length }),
  },
  {
    id: 'observability', cmd: ['agent/observability/cli.mjs', 'validate'], digest: false, optional: true,
    extract: (o) => ({
      records: num(o, /(\d+)\s+record/),
      invalid: num(o, /(\d+)\s+invalid/),
      unparseable: num(o, /(\d+)\s+unparseable/),
    }),
  },
];

function num(text, re) { const m = text.match(re); return m ? Number(m[1]) : null; }
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

function run(check) {
  if (check.optional && !existsSync(join(ROOT, check.cmd[0]))) return { id: check.id, skipped: 'not present' };
  let out = '', code = 0;
  try {
    out = execFileSync(process.execPath, check.cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    code = e.status ?? 1;
  }
  const rec = { id: check.id, exit: code, ...check.extract(out) };
  if (check.digest) rec.digest = sha(out.trim());
  return rec;
}

const snapshot = { taken_at: new Date().toISOString(), checks: CHECKS.map(run) };

/* ------------------------------------------------ output */

if (has('json')) console.log(JSON.stringify(snapshot, null, 2));
else {
  console.log(`\nqa baseline · ${snapshot.taken_at}`);
  for (const c of snapshot.checks) {
    if (c.skipped) { console.log(`  – ${c.id.padEnd(14)} skipped (${c.skipped})`); continue; }
    const fields = Object.entries(c).filter(([k]) => !['id', 'digest'].includes(k))
      .map(([k, v]) => `${k} ${v}`).join('  ');
    console.log(`  ${c.exit === 0 ? '·' : '✗'} ${c.id.padEnd(14)}${fields}`);
  }
}

if (has('save')) {
  writeFileSync(SNAP, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`\nsnapshot written to ${SNAP}`);
  console.log('This is a session artifact, not canonical data. It is git-ignored.\n');
}

if (has('check')) {
  if (!existsSync(SNAP)) {
    console.log(`\nno snapshot at ${SNAP} — take one first with --save\n`);
    process.exit(1);
  }
  const before = JSON.parse(readFileSync(SNAP, 'utf8'));
  const diffs = [];
  const byId = new Map(before.checks.map((c) => [c.id, c]));
  for (const now of snapshot.checks) {
    const was = byId.get(now.id);
    if (!was) { diffs.push(`${now.id}: not in the snapshot`); continue; }
    for (const k of new Set([...Object.keys(was), ...Object.keys(now)])) {
      if (k === 'id') continue;
      if (was[k] !== now[k]) diffs.push(`${now.id}.${k}: ${was[k]} → ${now[k]}`);
    }
  }
  console.log(`\ncompared against ${SNAP} (taken ${before.taken_at})`);
  if (!diffs.length) {
    console.log('  no change\n');
    process.exit(0);
  }
  for (const d of diffs) console.log(`  ! ${d}`);
  console.log('\nA change here is a finding. A new warning is not noise; a digest change means');
  console.log('the check reported something different, even where the counts match.\n');
  process.exit(1);
}
