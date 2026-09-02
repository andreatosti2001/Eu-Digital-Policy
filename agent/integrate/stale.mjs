/* ============================================================
   agent/integrate/stale.mjs — requirement 5: detect stale
   verification

   THE CLOCK IS AN ARGUMENT, NEVER READ. `asOf` is mandatory and this
   module throws without it. Audit F-15: derived output that compares
   against `new Date()` changes with when and where it is computed,
   so a staleness report with no date on it is not reproducible, and
   VERIFICATION-POLICY §4 requires every report to state its as-of
   date. The Verifier's suite asserts nothing in its judging path
   reads a clock; the same rule holds here, and the same test does.

   THE INTERVALS ARE THE VALIDATOR'S OWN. `EXPECTED` is imported from
   tools/freshness.mjs. A second table of intervals in the agent
   layer would be a second home for a fact and the two would
   disagree the first time somebody tightened one. That module was
   changed in this session so importing it defines the constants and
   runs nothing — its output is byte-identical.

   AND THE FINDING THAT QUALIFIES EVERY OTHER ONE. VERIFICATION-
   POLICY §5: every dataset carries one `$last_verified`, and the
   per-record `last_verified` values were written in bulk to that
   same constant. The field is per-record; the practice is not. So
   an "age" computed from `last_verified` is the age of a
   COMPILATION, and this module carries that qualifier onto every
   row rather than reporting a number that reads like independent
   re-checking. An agent must not read `last_verified` as evidence
   that that record was individually checked, and neither does this.

   FOUR KINDS OF STALENESS, WHICH ARE NOT THE SAME THING:

     dataset_interval   the dataset's own date is past the interval
                        it promises to keep up with
     recheck_due        a VerificationRecord said when it should be
                        looked at again, and that date has passed
     superseded         a later VerificationRecord replaced it, so
                        the earlier one is stale by construction
     record_behind      a verification bearing on a canonical record
                        was made after that record's last_verified,
                        so the record has not caught up with the
                        evidence about it
   ============================================================ */

import { EXPECTED } from '../../tools/freshness.mjs';

export const STALENESS_KINDS = ['dataset_interval', 'recheck_due', 'superseded', 'record_behind'];

const DAY = 86400000;

/** Whole days between two ISO dates, at day precision. Both are
 *  truncated to a date first: comparing a timestamp against a date
 *  would make the answer depend on the hour a run happened. */
export function daysBetween(from, to) {
  const a = Date.parse(`${String(from).slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${String(to).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / DAY);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * @param {object} corpus
 * @param {{asOf:string, verifications?:object[], resolutions?:Map<string,string[]>}} opts
 *   `asOf` — an ISO date. Mandatory. There is no default, because a
 *   default would be a clock read.
 */
export function staleVerification(corpus, { asOf, verifications = [], resolutions = new Map() } = {}) {
  if (!asOf || !ISO_DATE.test(String(asOf))) {
    throw new Error('staleVerification needs an explicit asOf date (YYYY-MM-DD). Nothing here reads a clock: a staleness report without its as-of date is not reproducible (docs/AUDIT-2026-09-01.md F-15).');
  }

  const rows = [];

  /* --- 1 · the dataset is past the interval it promises ---------- */

  for (const [name, expected] of Object.entries(EXPECTED)) {
    const dates = corpus.verificationDates[name];
    if (!dates?.file) continue;
    const age = daysBetween(dates.file, asOf);
    if (age === null || age <= expected.days) continue;
    rows.push({
      kind: 'dataset_interval',
      dataset: `data/${name}.json`,
      record_id: null,
      verification_id: null,
      age_days: age,
      interval_days: expected.days,
      as_of: asOf,
      why: `${name} states ${dates.file} and that is ${age} days before ${asOf}, past its ${expected.days}-day interval — ${expected.why}`,
      compilation_date_caveat: caveatFor(dates),
    });
  }

  /* --- 2 · a verification said when to look again ---------------- */

  for (const v of verifications) {
    if (!v.recheck_after) continue;
    const due = String(v.recheck_after).slice(0, 10);
    const over = daysBetween(due, asOf);
    if (over === null || over <= 0) continue;
    rows.push({
      kind: 'recheck_due',
      dataset: null,
      record_id: null,
      verification_id: v.verification_id,
      age_days: over,
      interval_days: null,
      as_of: asOf,
      why: `${v.verification_id} set recheck_after ${due}, which is ${over} day(s) before ${asOf}. The record said the underlying fact could move; nothing has looked since.`,
      compilation_date_caveat: null,
    });
  }

  /* --- 3 · a later verification replaced it ---------------------- */

  const superseded = new Map();
  for (const v of verifications) {
    if (v.supersedes) superseded.set(v.supersedes, v.verification_id);
  }
  for (const v of verifications) {
    const by = superseded.get(v.verification_id);
    if (!by) continue;
    rows.push({
      kind: 'superseded',
      dataset: null,
      record_id: null,
      verification_id: v.verification_id,
      age_days: null,
      interval_days: null,
      as_of: asOf,
      why: `${v.verification_id} was replaced by ${by}. Verifications are never edited; a later one supersedes, and anything still standing on the earlier verdict is standing on a superseded one.`,
      compilation_date_caveat: null,
    });
  }

  /* --- 4 · the canonical record has not caught up ---------------- */

  /* One row per RECORD, not per verification. Several propositions
     from one document routinely match one claim, and a row each
     would report the same fact — this record is behind — five times
     over. The row names the most recent check and counts the
     others, so nothing is dropped. */
  const byId = new Map(verifications.map((v) => [v.verification_id, v]));
  for (const [claim_id, ids] of resolutions) {
    const claim = corpus.claimById.get(claim_id);
    if (!claim?.last_verified) continue;
    const later = ids
      .map((vid) => ({ vid, v: byId.get(vid) }))
      .filter(({ v }) => v?.checked_at && daysBetween(claim.last_verified, String(v.checked_at).slice(0, 10)) > 0)
      .sort((a, b) => String(b.v.checked_at).localeCompare(String(a.v.checked_at)));
    if (!later.length) continue;

    const newest = later[0];
    const behind = daysBetween(claim.last_verified, String(newest.v.checked_at).slice(0, 10));
    rows.push({
      kind: 'record_behind',
      dataset: 'data/claims.json',
      record_id: claim_id,
      verification_id: newest.vid,
      also_checked_by: later.slice(1).map((x) => x.vid),
      age_days: behind,
      interval_days: null,
      as_of: asOf,
      why: `${claim_id} carries last_verified ${claim.last_verified}, and ${newest.vid} checked a proposition matched to it on ${String(newest.v.checked_at).slice(0, 10)} — ${behind} day(s) later${later.length > 1 ? `, as did ${later.length - 1} other check(s) in the same run (${later.slice(1).map((x) => x.vid).join(', ')})` : ''}. The record has not caught up with the evidence about it.`,
      compilation_date_caveat: caveatFor(corpus.verificationDates.claims),
    });
  }

  return rows;
}

function caveatFor(dates) {
  if (!dates?.is_compilation_date) return null;
  const shape = dates.distinct.length <= 1
    ? `Every last_verified in this dataset is ${dates.distinct[0] ?? 'absent'}.`
    : `Its ${dates.per_record_count} records carry only ${dates.distinct.length} distinct last_verified values (${dates.distinct.join(', ')}) — about ${dates.records_per_distinct_date} records per date.`;
  return `${shape} The field is per-record and the practice is not: read this age as the age of a compilation, not as evidence that any one record was individually re-checked (VERIFICATION-POLICY §5, audit F-13).`;
}

/**
 * The one thing a staleness report must never be used for.
 *
 * Exported as a string rather than left in a comment because it
 * travels into the DataGap records this produces, and a caveat that
 * only exists in the source of the module that computed it is a
 * caveat nobody downstream reads.
 */
export const STALENESS_IS_NOT =
  'Stale is not wrong. A dataset past its interval is one nobody has re-read, and the record it holds may be exactly right. '
  + 'Nothing here may be used to lower a confidence, downgrade a grade, or mark a record doubtful — and the fix is re-reading '
  + 'the source, never bulk-stamping last_verified, which AUTONOMY-POLICY §4 prohibits outright.';
