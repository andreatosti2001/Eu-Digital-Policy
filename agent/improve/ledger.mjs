/* ============================================================
   agent/improve/ledger.mjs — the cycle record, and the one store
   here that is GIT-TRACKED

   EVERY OTHER RUN STORE IN THIS REPOSITORY IS IGNORED, and each one
   argues for it in `.gitignore` at length: the trace store, the
   record store, the editorial drafts, the health history, the
   Control Room state, the Orchestrator journals, the simulation
   traces, the autonomous-action ledger. The argument is always the
   same and it is a good one — this repository publishes its whole
   tree, so a tracked operational trace is an operational trace on
   the public web.

   THIS FILE IS TRACKED, AND THE REASON IS NOT THAT THE ARGUMENT IS
   WRONG. It is that a loop whose memory does not survive a clone is
   not a loop. Every ignored store above is per-machine: a fresh
   clone and a CI runner have none, which is why
   `agent/orchestrator/cli.mjs survey` reports "no proposal in the
   record store" rather than "0 proposals". Applied to a cycle
   record, that would mean every session re-measures from scratch and
   compares against the previous session's PROSE in
   docs/HANDOVER.md — which is a second home for those facts, which
   is what this project's first principle forbids, and which has
   already drifted: docs/LIMITED-AUTONOMY.md §7c exists because a
   test count was stated two ways.

   The precedent for tracking is therefore not the health history. It
   is `agent/policy/governance/grants.jsonl` and
   `agent/implement/decisions/decisions.jsonl`, both tracked, both
   for the same reason: a fact that a later session has to be able to
   check has to survive the clone.

   WHAT PAYS FOR IT IS A RULE, NOT A PROMISE. The entry carries only
   PUBLIC readings, and the writer enforces that mechanically:

     · every signal declares `visibility` using
       `agent/health/model.mjs`'s two values, and a `private` one is
       WITHHELD from the entry with its id and the reason recorded in
       its place. The boundary check is private for exactly the
       reason `control_plane.secrets_in_public_assets` is.

     · `collectLeaks()` — `agent/health/monitor.mjs`'s own leak
       detector, not a second copy — is run over the SERIALISED entry
       against the real private metric register. A private id
       arriving through a field nobody thought about is the only way
       this leak would actually happen, and a structural check would
       not catch it.

     · a path under `.control-room/` anywhere in the entry is a
       refusal to write, not a redaction. Redacting it would leave a
       record shaped like a complete one.

   `writeCycle()` REFUSES rather than repairs, and the refusal names
   what it found. A ledger that quietly dropped what it could not
   publish would be a ledger whose absences mean nothing.

   NOTHING WRITES A CYCLE BY DEFAULT. `agent/improve/cli.mjs cycle`
   records only with `--record`, the same reasoning
   `agent/health/history.mjs writePublic()` gives about publishing:
   an agent that appended a tracked line on every run would have
   taken a commit decision once, for everybody, without anyone
   deciding.

   THE ENTRY HOLDS IDS AND NOT SUMMARIES, and that is the health
   history's rule for the same reason. 210 findings with their prose
   is about 60 KB a cycle and a ledger that grows by that much per
   run is a ledger nobody keeps. The id is content-derived
   (agent/schemas/identity.mjs), so it carries the finding's kind in
   its prefix and is reproducible from the corpus by re-running the
   observer that minted it. The current view holds the detail; the
   ledger holds the movement.
   ============================================================ */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { privateMetrics } from '../health/metrics.mjs';
import { collectLeaks } from '../health/monitor.mjs';

export const IMPROVE_ROOT = dirname(fileURLToPath(import.meta.url));
export const CYCLE_DIR = join(IMPROVE_ROOT, 'cycles');
export const CYCLE_LEDGER = 'cycles.jsonl';
export const CYCLE_LEDGER_VERSION = 1;

export const cycleLedgerPath = (dir = CYCLE_DIR) => join(dir, CYCLE_LEDGER);

/** Paths that may never appear anywhere in a tracked cycle entry.
 *  Not a redaction list — a refusal list. */
export const FORBIDDEN_IN_ENTRY = Object.freeze([
  Object.freeze(['.control-room/', 'the private control plane. A tracked entry naming one of its files would put the shape of the control plane in the published tree, and .control-room/ is outside that tree precisely so it is not there.']),
  Object.freeze(['.git/', 'the repository\'s own internals.']),
]);

/** A cycle's id. Derived from the cycle's own coordinates rather
 *  than from a counter, for the reason agent/schemas/identity.mjs
 *  gives: a counter is a queue position, and a later session asking
 *  "is this the cycle I read last week" needs an identity. */
export function cycleId({ asOf, recordedAt, traceId = null, commit = null }) {
  const digest = createHash('sha256')
    .update(`cycle ${String(asOf)} ${String(recordedAt)} ${String(traceId ?? '')} ${String(commit ?? '')}`, 'utf8')
    .digest('hex').slice(0, 12);
  return `cycle-${digest}`;
}

/**
 * The entry, built from an observation pass.
 *
 * Everything in it is a reading. Nothing in it is a definition: the
 * baseline lives in docs/CURRENT-ARCHITECTURE.md §12, the metric
 * register in agent/health/metrics.mjs, the policy in
 * agent/policy/, and this file references all three and re-states
 * none of them.
 */
export function entryFor({ observation, routing = null, trace_id = null, commit = null, branch = null, recordedAt = new Date().toISOString(), session = null }) {
  const asOf = observation?.as_of ?? null;
  const withheld = [];
  const signals = [];
  for (const s of observation?.signals ?? []) {
    if (s.visibility === 'private') {
      withheld.push({
        signal_id: s.signal_id,
        why: 'classified private by agent/health/model.mjs\'s own visibility rule. This ledger is git-tracked and this repository publishes its whole tree, so the reading is kept out of it and the fact that there is one is not.',
      });
      continue;
    }
    /* The detail is dropped for the reason the health history drops
       it: a ledger that grows by tens of kilobytes a run is a ledger
       nobody keeps. The value and its unit survive; the list behind
       the value is recoverable by re-running the observer. */
    signals.push({ signal_id: s.signal_id, value: s.value ?? null, unit: s.unit ?? null, why: s.why ?? null });
  }

  return {
    ledger_version: CYCLE_LEDGER_VERSION,
    cycle_id: cycleId({ asOf, recordedAt, traceId: trace_id, commit }),
    as_of: asOf,
    recorded_at: recordedAt,
    session,
    trace_id,
    commit,
    branch,
    coverage: (observation?.coverage ?? []).map((c) => ({ observer: c.observer, agent: c.agent, kind: c.kind, state: c.state, why: c.why, findings: c.findings })),
    findings: (observation?.findings ?? []).map((f) => ({
      finding_id: f.finding_id,
      observer: f.observer,
      contract: f.contract,
      severity: f.severity ?? null,
      autonomy_class: f.autonomy_class ?? null,
    })),
    signals,
    signals_withheld: withheld,
    routing: routing
      ? {
        eligible: routing.eligible ?? 0,
        human: routing.human ?? 0,
        refused: routing.refused ?? 0,
        merged: routing.merged ?? 0,
        by_category: routing.by_category ?? {},
      }
      : null,
  };
}

/** What must not be in a tracked entry, checked over the serialised
 *  form. Returns the reasons; an empty array is the pass. */
export function publicationRefusals(entry) {
  const text = JSON.stringify(entry ?? null);
  const out = [];

  for (const [needle, why] of FORBIDDEN_IN_ENTRY) {
    if (text.includes(needle)) out.push({ rule: 'forbidden_path', found: needle, why });
  }

  /* The health monitor's own leak detector, over the same private
     register. Not re-implemented: if a metric is reclassified there,
     this refusal changes with it. */
  const leaks = collectLeaks(entry, privateMetrics());
  for (const id of leaks) {
    out.push({ rule: 'private_metric_id', found: id, why: `${id} is a private control-plane metric. A tracked cycle entry naming it would publish the existence and shape of a control-plane reading.` });
  }

  const priv = (entry?.signals ?? []).filter((s) => s.visibility === 'private');
  for (const s of priv) out.push({ rule: 'private_signal', found: s.signal_id, why: 'a signal classified private reached the entry body. entryFor() withholds these; a caller building an entry by hand must too.' });

  return out;
}

export class CycleRefused extends Error {
  constructor(refusals) {
    super(`refusing to write a cycle entry into a git-tracked, published file:\n  · ${refusals.map((r) => `${r.rule} (${r.found}): ${r.why}`).join('\n  · ')}`);
    this.name = 'CycleRefused';
    this.refusals = refusals;
  }
}

/**
 * Append one cycle. Throws rather than redacting.
 *
 * @returns {{path:string, cycle_id:string, bytes:number}}
 */
export function writeCycle(entry, { dir = CYCLE_DIR } = {}) {
  const refusals = publicationRefusals(entry);
  if (refusals.length) throw new CycleRefused(refusals);
  mkdirSync(dir, { recursive: true });
  const line = `${JSON.stringify(entry)}\n`;
  appendFileSync(cycleLedgerPath(dir), line, 'utf8');
  return { path: cycleLedgerPath(dir), cycle_id: entry.cycle_id, bytes: Buffer.byteLength(line, 'utf8') };
}

/**
 * Every recorded cycle, oldest first, with malformed lines NAMED
 * rather than dropped. A store that silently skips what it cannot
 * parse reports a shorter history and no reason for it.
 */
export function readCycles({ dir = CYCLE_DIR } = {}) {
  const path = cycleLedgerPath(dir);
  if (!existsSync(path)) return { entries: [], malformed: [], path, exists: false };
  const lines = readFileSync(path, 'utf8').split('\n');
  const entries = [];
  const malformed = [];
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    try {
      const e = JSON.parse(raw);
      if (e?.ledger_version !== CYCLE_LEDGER_VERSION) {
        malformed.push({ line: i + 1, why: `ledger_version ${e?.ledger_version ?? 'absent'} — this reader understands ${CYCLE_LEDGER_VERSION}.` });
        return;
      }
      entries.push(e);
    } catch (err) {
      malformed.push({ line: i + 1, why: `not JSON: ${err.message}` });
    }
  });
  return { entries, malformed, path, exists: true };
}

/** The cycle before this one, or null. Ordered by `recorded_at`,
 *  falling back to file order where two share an instant. */
export function previousCycle({ dir = CYCLE_DIR, before = null } = {}) {
  const { entries } = readCycles({ dir });
  const ordered = [...entries].sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)));
  const candidates = before ? ordered.filter((e) => String(e.recorded_at) < String(before)) : ordered;
  return candidates.length ? candidates[candidates.length - 1] : null;
}
