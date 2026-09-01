/* ============================================================
   agent/scout/store.mjs — where a contract record lives

   SESSION 04 left this open: the gate hashes a record into the
   trace as a pointer, and the record itself had no home. This is
   the home.

   `agent/records/<trace_id>.jsonl`, append-only, one JSON object per
   line — deliberately the same shape as the trace store, for the
   same reasons: a run that crashed leaves everything it managed to
   emit, in order; the store is greppable and diffable with no
   tooling; and nothing needs installing to read it.

   IT IS NOT `data/`. That directory is the legal record — what the
   site tells a reader about EU law — and an agent's findings are
   not that until a human has verified them and written them there.
   The directory is git-ignored for the same reason the trace store
   is: these are run artifacts, regenerable, and not canonical.

   Every record is validated on the way in. A store that accepts
   anything is a store nobody can query, and this one would be
   accepting exactly the thing the contracts exist to refuse.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../schemas/validate.mjs';
import { getContract } from '../schemas/registry.mjs';

export const AGENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_RECORD_DIR = join(AGENT_ROOT, 'records');

export class RecordStore {
  /** @param {{dir?:string, allowSimulated?:boolean}} opts */
  constructor({ dir = DEFAULT_RECORD_DIR, allowSimulated = false } = {}) {
    this.dir = dir;
    this.allowSimulated = allowSimulated;
    this.written = [];
    mkdirSync(this.dir, { recursive: true });
  }

  path(traceId) { return join(this.dir, `${traceId}.jsonl`); }

  /** Validates, then appends. Throws on an invalid record: the
   *  point of a contract is that the invalid case does not get
   *  written and quietly read back later as if it were fine. */
  write(record) {
    const errs = validate(record, { allowSimulated: this.allowSimulated });
    if (errs.length) {
      throw new Error(`refusing to store an invalid ${record?.contract ?? 'record'}:\n  · ${errs.join('\n  · ')}`);
    }
    const traceId = record.trace_ref?.trace_id ?? 'untraced';
    appendFileSync(this.path(traceId), `${JSON.stringify(record)}\n`, 'utf8');
    this.written.push(record);
    return record;
  }

  ids(contractName) {
    return this.written
      .filter((r) => r.contract === contractName)
      .map((r) => r[getContract(contractName).id_field]);
  }
}

/** For a dry run and for the suite. Keeps everything, writes nothing. */
export class MemoryRecordStore extends RecordStore {
  constructor(opts = {}) {
    super({ ...opts, dir: opts.dir ?? DEFAULT_RECORD_DIR });
    this.memory = true;
  }
  write(record) {
    const errs = validate(record, { allowSimulated: this.allowSimulated });
    if (errs.length) throw new Error(`refusing to store an invalid ${record?.contract ?? 'record'}:\n  · ${errs.join('\n  · ')}`);
    this.written.push(record);
    return record;
  }
}

export function readRecords(traceId, dir = DEFAULT_RECORD_DIR) {
  const file = join(dir, `${traceId}.jsonl`);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

export function listRecordFiles(dir = DEFAULT_RECORD_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort();
}
