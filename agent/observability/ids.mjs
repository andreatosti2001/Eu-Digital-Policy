/* ============================================================
   agent/observability/ids.mjs — identifiers

   W3C Trace Context shapes, so a trace produced here can be
   exported to any OpenTelemetry collector without being rewritten:

     trace_id  16 bytes / 32 lowercase hex
     span_id    8 bytes / 16 lowercase hex

   run_id is not a third identifier. A run IS a span — the span of
   an orchestrator or an agent — so run_id is that span's span_id,
   and parent_run_id is the span_id of the nearest enclosing
   orchestrator/agent span, skipping the tool spans in between.
   One home per fact: an id that existed twice could disagree.

   The deterministic generator exists for the test suite and for
   the demonstrator's golden fixture. It is never the default.
   ============================================================ */

import { randomBytes } from 'node:crypto';

const hex = (n) => randomBytes(n).toString('hex');

export const randomIds = {
  traceId: () => hex(16),
  spanId: () => hex(8),
};

/** Seeded counter. Same seed, same sequence — nothing more. */
export function deterministicIds(seed = 1) {
  let t = seed * 1000;
  let s = seed * 1000;
  const pad = (n, width) => n.toString(16).padStart(width, '0');
  return {
    traceId: () => pad(++t, 32),
    spanId: () => pad(++s, 16),
  };
}

export const systemClock = { now: () => new Date() };

/** Advances a fixed amount per call, so a fixture has stable durations. */
export function deterministicClock(startIso = '2026-01-01T00:00:00.000Z', stepMs = 250) {
  let t = Date.parse(startIso);
  return {
    now: () => { const d = new Date(t); t += stepMs; return d; },
    advance: (ms) => { t += ms; },
  };
}

export const isoOf = (d) => d.toISOString();
export const unixNanoOf = (d) => String(BigInt(d.getTime()) * 1000000n);
