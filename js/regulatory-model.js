/* ============================================================
   The regulatory status model — instrument → provision → date.

   `legislative_status` on an instrument is one scalar, and instruments.json
   has always said it is "deliberately NOT sufficient on its own": for a
   staggered instrument the milestones are authoritative about what applies
   and when. This module reads the milestones at the level a reader needs,
   which is the provision:

     instrument  its lifecycle: adoption → publication → entry into force
     provision   the event(s) that make THIS article apply — its own
                 application date, a transitional deadline for existing
                 products, or, where nothing provision-specific is
                 recorded, the instrument's general application date
     amendment   an event carries `introduced_by` when the rule it applies
                 was inserted by a later act (the AI Omnibus inserting new
                 Article 5 prohibitions into the AI Act)

   DERIVED, NEVER STORED. Nothing here writes a date or a status onto a
   record; the answer is recomputed from timeline.json every time, so it
   cannot disagree with it. `asOf` is always passed in — this module does
   not read the clock (AUDIT F-15).
   ============================================================ */

const APPLIES = new Set(['event:application', 'event:compliance-deadline', 'event:transposition']);
const PRE_ADOPTION = new Set(['status:proposal', 'status:parliament-position', 'status:council-position',
  'status:trilogue', 'status:political-agreement', 'status:stalled', 'status:withdrawn']);

const events = (inst, ix) => (inst.milestones || [])
  .map((id) => (ix.event && ix.event.get ? ix.event.get(id) : null))
  .filter(Boolean)
  .sort((a, b) => String(a.date).localeCompare(String(b.date)));

/**
 * When does one provision apply? Returns
 *   { state, date, event, introducedBy, via }
 *   state  'applies'       a provision-specific application event has passed
 *          'scheduled'     one is recorded and has not yet passed
 *          'general'       nothing provision-specific; the instrument's
 *                          general application date governs, and has passed
 *          'general-scheduled'  … and has not yet passed
 *          'not-established'    no application event is recorded at all
 *   via    'provision' or 'instrument' — whether the date is specific to
 *          the article or inherited from the whole act
 *   later  further tranches of the same provision, in date order
 */
export function provisionApplication(provisionId, inst, ix, asOf) {
  const evs = events(inst, ix).filter((e) => APPLIES.has(e.event_type));
  const own = evs.filter((e) => (e.provisions || []).includes(provisionId) && e.event_type !== 'event:compliance-deadline');
  const pick = (list, via) => {
    const past = list.filter((e) => e.date <= asOf);
    const e = past.length ? past[0] : list[0];
    const base = via === 'provision' ? (past.length ? 'applies' : 'scheduled') : (past.length ? 'general' : 'general-scheduled');
    /* a provision can apply in tranches — the AI Act's Article 5 from 2025,
       its Omnibus additions from 2026, the high-risk tier on two dates — and
       every later tranche is part of the answer, not a footnote to it */
    const later = list.filter((x) => x !== e && x.date > e.date);
    return { state: base, date: e.date, event: e, introducedBy: e.introduced_by || null, via, later };
  };
  if (own.length) return pick(own, 'provision');
  const general = evs.filter((e) => !(e.provisions || []).length && e.event_type !== 'event:compliance-deadline');
  if (general.length) return pick(general, 'instrument');
  return { state: 'not-established', date: null, event: null, introducedBy: null, via: null, later: [] };
}

/** Transitional deadlines and other dated duties attached to one provision. */
export function provisionDeadlines(provisionId, inst, ix) {
  return events(inst, ix).filter((e) => e.event_type === 'event:compliance-deadline'
    && (e.provisions || []).includes(provisionId));
}

/**
 * Where the scalar status and the milestones cannot both be right.
 * Each item is a defect in the RECORD; tools/evidence-audit.mjs fails on it.
 */
export function statusContradictions(inst, ix, asOf) {
  const out = [];
  const s = inst.legislative_status;
  const evs = events(inst, ix);
  const app = evs.filter((e) => e.event_type === 'event:application' || e.event_type === 'event:compliance-deadline');
  const past = app.filter((e) => e.date <= asOf);
  const future = app.filter((e) => e.date > asOf);
  const eif = evs.filter((e) => e.event_type === 'event:entry-into-force');
  const adopt = evs.find((e) => e.event_type === 'event:adoption');
  const pub = evs.find((e) => e.event_type === 'event:publication');

  if (s === 'status:applicable' && future.some((e) => e.event_type === 'event:application'))
    out.push(`status "applicable" while an application date is still to come (${future.find((e) => e.event_type === 'event:application').date}) — that is "partly applicable"`);
  if (s === 'status:applicable' && app.length && !past.length)
    out.push('status "applicable" but no application date has passed');
  if (s === 'status:partly-applicable' && (!past.length || !future.length))
    out.push(`status "partly applicable" needs at least one past and one future application date; the milestones have ${past.length} past and ${future.length} future`);
  if (PRE_ADOPTION.has(s) && eif.some((e) => e.date <= asOf))
    out.push(`status "${s.split(':').pop()}" but an entry-into-force date has passed`);
  if (/transposition/.test(s || '') && inst.kind !== 'kind:directive')
    out.push(`a transposition status on an instrument that is not a directive (${inst.kind})`);
  if (adopt && pub && pub.date < adopt.date) out.push(`published (${pub.date}) before it was adopted (${adopt.date})`);
  for (const e of eif) {
    if (pub && e.date < pub.date) out.push(`in force (${e.date}) before publication in the Official Journal (${pub.date})`);
    for (const a of app) if (a.date < e.date) out.push(`an application date (${a.date}, ${a.id}) precedes entry into force (${e.date})`);
  }
  return out;
}

/** Where the scalar was last set before a milestone that has since passed. */
export function statusAge(inst, ix, asOf) {
  if (!inst.status_as_of) return null;
  const passedSince = events(inst, ix).filter((e) => e.date > inst.status_as_of && e.date <= asOf
    && !['event:adoption', 'event:publication'].includes(e.event_type));
  return passedSince.length ? passedSince : null;
}
