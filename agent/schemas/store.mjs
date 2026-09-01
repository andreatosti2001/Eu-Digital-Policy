/* ============================================================
   agent/schemas/store.mjs — where a contract record lives

   SESSION 04 left this open deliberately: the gate hashes a record
   into the trace as a pointer, and a pointer needs something to
   point AT. This is that something.

   THE DECISION, and the reasoning behind it:

   · `agent/runs/`, alongside `agent/observability/runs/`, on the
     same reasoning the trace store already gives — one JSONL file
     per run, appended and never rewritten, so a run that crashed
     halfway leaves exactly the records it managed to write rather
     than a truncated summary of what it meant to write.

   · NOT `data/`. That directory is the legal record — what the site
     tells a reader EU law requires — and a contract record is an
     agent's finding about the world, which is a different kind of
     thing with a different standard of proof. A SourceCandidate is
     not a source; putting one where sources live is how the two
     stop being distinguishable.

   · Git-ignored, like the trace store. These are regenerable by
     re-running the agent, they carry run inputs and outputs, and
     committing them would make the repository assert findings that
     have not been verified by anyone.

   THIS IS NOT A SECOND PATH AROUND THE GATE. `append` calls the
   gateway's own `receive`, which validates and throws. A record
   cannot reach the store without satisfying its contract — and
   `receive` is the right half of the gate to use here for the
   reason the gateway already states: "I wrote it" is not a property
   the receiver can check, so the store checks it anyway.
   ============================================================ */

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { receive } from './gateway.mjs';
import { REPO_ROOT } from './types.mjs';

/** One home for the path, so nothing else has to guess it. */
export const RECORD_STORE_DIR = join(REPO_ROOT, 'agent', 'runs');

export class ContractStore {
  /**
   * @param {{dir?:string, allowSimulated?:boolean}} [opts]
   *   allowSimulated — passed straight through to the gate. A
   *   fixture is the only thing it admits, and nothing outside
   *   fixtures.mjs may be marked simulated.
   */
  constructor({ dir = RECORD_STORE_DIR, allowSimulated = false } = {}) {
    this.dir = dir;
    this.allowSimulated = allowSimulated;
    mkdirSync(this.dir, { recursive: true });
  }

  path(traceId) { return join(this.dir, `${traceId}.jsonl`); }

  /**
   * Validate through the gate, then append. Throws on an invalid
   * record rather than storing it: a store that accepts anything is
   * a store nobody can trust, and the whole point of the contracts
   * is that the failure happens at the boundary.
   *
   * @param {string} traceId the trace this record was produced inside
   * @param {object} record
   * @returns {object} the same record, unchanged
   */
  append(traceId, record) {
    receive(record, { allowSimulated: this.allowSimulated });
    appendFileSync(this.path(traceId), `${JSON.stringify(record)}\n`, 'utf8');
    return record;
  }

  /** Read one run's records back. A line that does not parse is
   *  reported rather than dropped — a corrupt tail is information. */
  read(traceId) {
    const file = this.path(traceId);
    if (!existsSync(file)) return { records: [], broken: [] };
    return parseJsonl(readFileSync(file, 'utf8'), `${traceId}.jsonl`);
  }

  list() {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir).filter((f) => f.endsWith('.jsonl')).sort();
  }
}

/** Keeps everything, writes nothing. For the suite and for a dry run. */
export class MemoryContractStore {
  constructor({ allowSimulated = false } = {}) {
    this.records = [];
    this.allowSimulated = allowSimulated;
  }

  append(traceId, record) {
    receive(record, { allowSimulated: this.allowSimulated });
    this.records.push({ trace_id: traceId, record });
    return record;
  }

  read(traceId) {
    return { records: this.records.filter((x) => x.trace_id === traceId).map((x) => x.record), broken: [] };
  }

  list() { return [...new Set(this.records.map((x) => x.trace_id))].map((t) => `${t}.jsonl`).sort(); }
}

export function parseJsonl(text, where = 'run') {
  const records = [];
  const broken = [];
  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try { records.push(JSON.parse(line)); }
    catch (err) { broken.push({ line: i + 1, where, message: err.message }); }
  });
  return { records, broken };
}
