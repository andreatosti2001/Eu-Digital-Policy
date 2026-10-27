/* ============================================================
   tools/evidence-audit-record.mjs — what a recorded editorial audit
   is, where it lives, and how it is read

   Roadmap v2 item 1.1 (docs/AUDIT-2026-10-24.md finding A). The audit
   asked for a way to LAUNCH the editorial check from the Control Room;
   a route that executes is what docs/CONTROL-ROOM.md §12 forbids
   (`PROHIBITED_ROUTE_WORDS`). So the check is launched from the
   machine and RECORDED, and the Control Room READS the record — the
   same arrangement it already has with the health monitor:

       node tools/evidence-audit.mjs --as-of YYYY-MM-DD --record

   Without `--record` the tool writes nothing, as before.

   THIS MODULE ONLY READS. The writer is `tools/evidence-audit.mjs`
   itself; the Control Room imports this file, and nothing it imports
   can write a record or run the tool.

   A RECORD ANSWERS FIVE QUESTIONS, because the BRIEF v2.0's fifth
   principle and the audit's conclusion are the same sentence: what
   was checked, on which evidence, as of which date, at which commit,
   with which limits. `QUESTIONS` names them, `CHECKED` and `LIMITS`
   are the fixed parts of the answer, and the rest is measured on the
   run that writes the record.

   WHERE IT LIVES. `tools/evidence-audit-runs/evidence-audit.jsonl`
   under the audited tree: append-only JSONL, one line per run, GIT-
   IGNORED (the README is negated back in), the same shape as
   agent/health/history/. A recorded run is a fact about one machine
   on one day, not about the repository, and a fresh clone has none.
   ============================================================ */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RECORD_VERSION = 1;
export const STORE_SUBDIR = join('tools', 'evidence-audit-runs');
export const STORE_FILE = 'evidence-audit.jsonl';
export const storeDir = (root) => join(root, STORE_SUBDIR);
export const storePath = (dir) => join(dir, STORE_FILE);

/** The exact command that produces a new record. Shown by the view;
 *  run by a person, on the machine. */
export const RECORD_COMMAND = 'node tools/evidence-audit.mjs --as-of YYYY-MM-DD --record';

/** The five questions, with the record field that answers each. */
export const QUESTIONS = [
  { key: 'checked', label: 'What was checked' },
  { key: 'evidence', label: 'On which evidence' },
  { key: 'as_of', label: 'As of which date' },
  { key: 'commit', label: 'At which commit' },
  { key: 'limits', label: 'With which limits' },
];

/** What the tool checks — its seven sections, as its own header
 *  states them. */
export const CHECKED = [
  { section: 'claims', what: 'type, evidence status and grade of every claim; locators on direct references; possibly composite statements; derivations re-run; attribution; premises' },
  { section: 'remediation', what: 'why each claim is not yet as strong as it could be, as taxonomy codes' },
  { section: 'prose', what: 'every substantive passage of index.html is registered (data-claim, data-record) or classified (data-prose); an unclassified passage is an error' },
  { section: 'sources', what: 'the source hierarchy: primary law, official, secondary, and unofficial reproductions of legal text' },
  { section: 'freshness', what: 'risk class and freshness state of each record, computed against the reference date' },
  { section: 'enforcement', what: 'procedural posture, finality and contradictions of each enforcement record' },
  { section: 'regulatory', what: 'scalar status against the milestones, and provision-level application dates' },
];

/** What a recorded run does not establish. Stated on every record, so
 *  a record read a year from now carries its own caveats. */
export const LIMITS = [
  'It reads data/ and index.html and nothing else. It performs no network I/O and opens no source document: a claim graded as supported is supported by the records, not re-checked against the source (docs/AUDIT-2026-09-01.md F-12).',
  'It does not establish that any sentence is true. It checks structure, classification, locators, coverage, dates and contradictions between records.',
  '"Possibly composite" is a heuristic, and warnings are findings to read, not a score.',
  'Freshness is computed against the reference date (as_of), not against the day the run was recorded. Neither is evidence of currency.',
  'It reports nothing about data/applicability.json, the rules behind applies.html (docs/ROADMAP-v2.md §2, D-2).',
  'The commit names the tree audited only when tree_clean is true. When it is false, the uncommitted changes listed were audited too.',
  'The record is per-machine and git-ignored. A run on another machine is not here, and no recorded run is not the same as no run.',
];

/**
 * Every recorded run, oldest first. A malformed line is REPORTED,
 * not skipped: a store that quietly drops what it cannot read is a
 * store that can be made to forget (the rule of agent/health/history.mjs
 * and of the decision ledger).
 */
export function readRecords({ dir }) {
  const path = storePath(dir);
  if (!existsSync(path)) return { exists: false, path, entries: [], malformed: [] };
  const entries = [];
  const malformed = [];
  readFileSync(path, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const e = JSON.parse(line);
      const missing = ['recorded_at', ...QUESTIONS.map((q) => q.key)].filter((k) => !(k in e));
      if (e.record_version !== RECORD_VERSION || missing.length) {
        malformed.push({ line: i + 1, why: e.record_version !== RECORD_VERSION ? `record_version ${e.record_version} is not ${RECORD_VERSION}` : `missing ${missing.join(', ')}` });
        return;
      }
      entries.push(e);
    } catch (err) { malformed.push({ line: i + 1, why: `not JSON: ${err.message}` }); }
  });
  return { exists: true, path, entries, malformed };
}
