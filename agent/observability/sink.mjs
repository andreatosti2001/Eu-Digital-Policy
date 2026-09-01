/* ============================================================
   agent/observability/sink.mjs — where a record goes

   One file per trace, one JSON object per line, appended
   synchronously. That is a deliberate choice over a database and
   over a buffered writer:

     · a crashed run leaves every record it managed to emit,
       in order, and the file still parses line by line;
     · the store is greppable, diffable and archivable with no
       tooling at all, which is the same reason this project keeps
       its facts in data/*.json;
     · zero dependencies, which is a rule of the repository, not a
       preference.

   Validation happens here rather than in the viewer. A malformed
   record is rejected at the boundary with a named reason, because
   a store that accepts anything is a store nobody can query.
   ============================================================ */

import { appendFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRecord } from './schema.mjs';

export const OBS_ROOT = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_RUN_DIR = join(OBS_ROOT, 'runs');

export class JsonlSink {
  /**
   * @param {{dir?:string, strict?:boolean, onInvalid?:(errs:string[],rec:object)=>void}} opts
   *   strict — throw on an invalid record. Off by default: losing a
   *   whole run because one field is wrong is worse than storing the
   *   record and reporting it, and `cli.mjs validate` reports it.
   */
  constructor({ dir = DEFAULT_RUN_DIR, strict = false, onInvalid } = {}) {
    this.dir = dir;
    this.strict = strict;
    this.onInvalid = onInvalid ?? ((errs) => process.emitWarning(`observability: ${errs.join('; ')}`));
    mkdirSync(this.dir, { recursive: true });
  }

  path(traceId) { return join(this.dir, `${traceId}.jsonl`); }

  write(record) {
    const errs = validateRecord(record);
    if (errs.length) {
      if (this.strict) throw new Error(`invalid trace record: ${errs.join('; ')}`);
      this.onInvalid(errs, record);
      record = { ...record, _invalid: errs };
    }
    appendFileSync(this.path(record.trace_id), JSON.stringify(record) + '\n', 'utf8');
    return record;
  }
}

/** For tests and for a dry run. Keeps everything, writes nothing. */
export class MemorySink {
  constructor({ strict = true } = {}) { this.records = []; this.strict = strict; this.invalid = []; }
  write(record) {
    const errs = validateRecord(record);
    if (errs.length) {
      this.invalid.push({ errs, record });
      if (this.strict) throw new Error(`invalid trace record: ${errs.join('; ')}`);
    }
    this.records.push(record);
    return record;
  }
}

export class MultiSink {
  constructor(sinks) { this.sinks = sinks; }
  write(record) { for (const s of this.sinks) s.write(record); return record; }
}

/* ---------------------------------------------------------- reading */

export function listTraceFiles(dir = DEFAULT_RUN_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort();
}

/**
 * Read one trace. A line that does not parse is reported rather
 * than dropped: a corrupt tail is information about the run.
 */
export function readTrace(traceId, dir = DEFAULT_RUN_DIR) {
  const file = join(dir, `${traceId}.jsonl`);
  if (!existsSync(file)) return null;
  return parseJsonl(readFileSync(file, 'utf8'), `${traceId}.jsonl`);
}

export function parseJsonl(text, where = 'trace') {
  const records = [];
  const broken = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    try { records.push(JSON.parse(line)); }
    catch (err) { broken.push({ line: i + 1, where, message: err.message }); }
  });
  return { records, broken };
}
