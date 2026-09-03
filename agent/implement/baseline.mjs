/* ============================================================
   agent/implement/baseline.mjs — the recorded baseline, READ rather
   than retyped

   `docs/CURRENT-ARCHITECTURE.md` §12 records what the four
   validators said at a known commit, and AGENTS.md turns that into
   the rule every later run is measured against: **a new warning is a
   finding, not noise.** Five `design-qa` warnings is a pass here and
   a regression in a repository that had four.

   The obvious implementation is a constant in this file. It is also
   the second home this project's whole architecture exists to
   prevent: two copies of the numbers, one of which drifts silently
   the first time somebody does the verification work and updates the
   document. `docs/DATA-GOVERNANCE.md` calls this derivation over
   storage and applies it to the datasets; there is no reason the
   agent layer should be exempt from a rule the site is arguing for.

   So the baseline is PARSED out of §12. If the document is edited,
   this follows. If the document's fenced block is restructured so
   this can no longer read it, `readBaseline()` throws rather than
   falling back to a plausible default — a wrong baseline is worse
   than no baseline, because every later comparison inherits it and
   nothing downstream can tell.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const BASELINE_DOC = 'docs/CURRENT-ARCHITECTURE.md';

/** The four, in the order AGENTS.md lists them. */
export const VALIDATORS = [
  { name: 'validate.mjs', command: 'node tools/validate.mjs', proves: 'data integrity across data/*.json' },
  { name: 'i18n-audit.mjs', command: 'node tools/i18n-audit.mjs', proves: 'the locale register against the live DOM' },
  { name: 'design-qa.mjs', command: 'node tools/design-qa.mjs', proves: 'markup and stylesheets' },
  { name: 'freshness.mjs', command: 'node tools/freshness.mjs', proves: 'how stale the datasets are — a report, not a gate' },
];

/**
 * @returns {{commit:string, checks:Record<string,{errors:number,warnings:number,note:string}>,
 *            unverified:number, named_warnings:string[], source:string}}
 */
export function readBaseline({ root = REPO_ROOT } = {}) {
  const path = join(root, BASELINE_DOC);
  if (!existsSync(path)) throw new Error(`${BASELINE_DOC} is missing: the recorded baseline has no home, and every comparison below it would be measured against nothing`);
  const doc = readFileSync(path, 'utf8');

  const head = doc.match(/\*\*Baseline at commit `([^`]+)`\*\*/);
  if (!head) throw new Error(`${BASELINE_DOC} no longer carries a "**Baseline at commit \`…\`**" line. Refusing to guess: a wrong baseline is inherited by every later comparison and nothing downstream can tell.`);

  const block = doc.slice(head.index).match(/```\n([\s\S]*?)```/);
  if (!block) throw new Error(`${BASELINE_DOC} §12 has a baseline commit but no fenced block after it`);

  const checks = {};
  for (const line of block[1].split('\n')) {
    const m = line.match(/^(\S+\.mjs)\s+(.*)$/);
    if (!m) continue;
    const [, name, rest] = m;
    const errors = rest.match(/(\d+)\s+errors?/);
    const warnings = rest.match(/(\d+)\s+warnings?/);
    checks[name] = {
      errors: errors ? Number(errors[1]) : 0,
      warnings: warnings ? Number(warnings[1]) : 0,
      /* freshness.mjs says "reports only", and treating an absent
         number as zero would make it look like a gate it is not.
         The note is kept so the difference survives. */
      note: rest.trim(),
      numeric: Boolean(errors || warnings),
    };
  }

  for (const v of VALIDATORS) {
    if (!(v.name in checks)) throw new Error(`${BASELINE_DOC} §12 records no baseline for ${v.name}, and AGENTS.md requires all four to be run`);
  }

  const unverified = block[1].match(/(\d+)\s+unverified/);
  const named = doc.slice(head.index).match(/warnings, recorded so a later session can tell new from pre-existing:\s*([\s\S]*?)\n\n/);

  return {
    commit: head[1],
    checks,
    unverified: unverified ? Number(unverified[1]) : null,
    /* The five, by file and line. A count alone cannot tell a NEW
       warning from a MOVED one, and "a new warning is a finding" is
       the rule this exists to serve. */
    named_warnings: named ? named[1].split(';').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean) : [],
    source: `${BASELINE_DOC} §12, at recorded commit ${head[1]}`,
  };
}

/**
 * What a check's result means against its baseline.
 *
 * Deliberately returns three states rather than a boolean. "Below
 * the baseline" is not a pass to be celebrated either: a design-qa
 * run reporting four warnings where five are recorded means
 * something was fixed OR a check stopped firing, and the second is
 * the failure mode `docs/AUDIT-2026-09-01.md` F-10 already found once.
 */
export function compare({ errors, warnings }, baseline) {
  if (errors > baseline.errors) return { verdict: 'regression', why: `${errors} error(s) against a baseline of ${baseline.errors}` };
  if (warnings > baseline.warnings) return { verdict: 'regression', why: `${warnings} warning(s) against a baseline of ${baseline.warnings} — a new warning is a finding, not noise` };
  if (warnings < baseline.warnings) return { verdict: 'below_baseline', why: `${warnings} warning(s) against a baseline of ${baseline.warnings}: either something was fixed, or a check stopped firing. The second is what AUDIT-2026-09-01 F-10 found once already, and this is not treated as a clean pass until somebody says which.` };
  return { verdict: 'at_baseline', why: `${errors} error(s), ${warnings} warning(s) — exactly the recorded baseline` };
}
