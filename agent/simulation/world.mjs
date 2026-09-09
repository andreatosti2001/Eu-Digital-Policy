/* ============================================================
   agent/simulation/world.mjs — a whole system in a temporary
   directory, and the assertion that nothing leaves it

   THE ONE RULE THIS FILE EXISTS FOR. SESSION 24's brief says: do
   not make a real production change. That is not a promise this
   module makes in prose — it is the reason every path it hands out
   is under `mkdtemp` and the reason `clean()` removes them. The
   record store, the decision ledger, the trace store, the workflow
   journals and the Control Room's operator registry are all
   temporary, and `selftest.mjs` asserts that a full run leaves the
   repository byte-identical.

   WHY A REAL CONTROL ROOM RATHER THAN A MOCK. The authorization leg
   is the one part of this system where a mock would prove nothing:
   the question being asked is whether authentication, authorization,
   the seven decision gates and the ledger actually refuse what they
   say they refuse. A stub that returned `{ok:true}` would produce a
   prettier trace and no evidence. So `run.mjs` starts
   `.control-room/server.mjs` on an ephemeral loopback port, logs in
   over HTTP with a password, and posts a real review — into a
   temporary decision directory that is deleted at the end.

   THE OPERATORS ARE SYNTHETIC AND SAY SO. `sim-approver@example.invalid`
   is not a person. A decision this run records is a record of the
   MACHINERY having accepted a decision, and it is never evidence
   that anybody decided anything. `docs/FIRST-END-TO-END-AUDIT.md`
   §6 states that as the limitation it is.
   ============================================================ */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

/** Everything this run created, so `clean()` can be exhaustive. */
export class SimWorld {
  constructor({ prefix = 'sim24-' } = {}) {
    this.dirs = {};
    this.made = [];
    for (const name of ['records', 'decisions', 'traces', 'state', 'journal']) {
      const d = mkdtempSync(join(tmpdir(), `${prefix}${name}-`));
      this.dirs[name] = d;
      this.made.push(d);
    }
  }

  /** Records go where `readAgentRecords({ dir })` finds them: one
   *  JSONL file per trace id. */
  writeRecords(records, traceId = 'f0'.repeat(16)) {
    mkdirSync(this.dirs.records, { recursive: true });
    writeFileSync(join(this.dirs.records, `${traceId}.jsonl`), `${records.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
    return this.dirs.records;
  }

  ledgerLines() {
    const f = join(this.dirs.decisions, 'decisions.jsonl');
    if (!existsSync(f)) return [];
    return readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  }

  clean() {
    for (const d of this.made) rmSync(d, { recursive: true, force: true });
    this.made = [];
  }
}

/* ------------------------------------------------- the safety assertion */

/** Every path a simulation run is allowed to have written to. */
export const WRITABLE_PREFIXES = Object.freeze([tmpdir()]);

/**
 * A content fingerprint of every tracked-ish file under `root`,
 * taken before and after a run. Directories the repository already
 * declares as run artifacts are excluded by NAME rather than by
 * pattern, so a new one is included by default — the same shape
 * `.gitignore` uses for `agent/health/history/`.
 */
const EXCLUDED = new Set(['.git', 'node_modules', 'runs', 'state', 'history', 'drafts']);

export function fingerprintTree(root) {
  const out = new Map();
  const walk = (dir, rel = '') => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDED.has(e.name)) continue;
      const abs = join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { walk(abs, r); continue; }
      if (!e.isFile()) continue;
      const st = statSync(abs);
      out.set(r, `${st.size}:${createHash('sha256').update(readFileSync(abs)).digest('hex').slice(0, 16)}`);
    }
  };
  walk(root);
  return out;
}

/** What changed between two fingerprints. An empty result is the
 *  claim "this run changed nothing", stated as a measurement. */
export function diffFingerprints(before, after) {
  const changed = [];
  for (const [k, v] of after) {
    if (!before.has(k)) changed.push({ path: k, how: 'created' });
    else if (before.get(k) !== v) changed.push({ path: k, how: 'modified' });
  }
  for (const k of before.keys()) if (!after.has(k)) changed.push({ path: k, how: 'deleted' });
  return changed;
}
