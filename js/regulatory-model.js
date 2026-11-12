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

import { riskClass, freshnessState } from './evidence-model.js';

const APPLIES = new Set(['event:application', 'event:compliance-deadline', 'event:transposition']);
export const PRE_ADOPTION = new Set(['status:proposal', 'status:parliament-position', 'status:council-position',
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
  /* A proposal is counted as a proposal and never as law: the masthead bands
     an instrument by this scalar alone, so a proposal carrying "in force" would
     be counted twice over, as a proposal by its kind and as law by its status. */
  if (inst.kind === 'kind:proposal' && s && !PRE_ADOPTION.has(s))
    out.push(`a proposal carries status "${s.split(':').pop()}", which counts it as law`);
  /* provisionApplication() reads an application event that names no provision
     as the instrument's GENERAL date, and every untagged provision inherits it.
     Two such events means a tranche is posing as the general date: until
     14 Oct 2026 the CRA's Chapter IV date (11 June 2026) dated every CRA article,
     and the Data Act's Chapter IV tranche (12 September 2027) dated Art. 8. */
  const general = evs.filter((e) => e.event_type === 'event:application' && !(e.provisions || []).length);
  if (general.length > 1)
    out.push(`${general.length} application dates name no provision (${general.map((e) => e.date).join(', ')}) — only the general date may; tag each tranche with the provision it governs`);
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

/* ============================================================
   Instruments by legislative status — the ONE computing function.

   F-A7 → MC-2 (docs/DATA-READINESS.md §7 item 6, §8.1). Until 11 Nov 2026
   js/masthead.js counted instruments by status twice itself (statusLedger()
   and ticker()), over the 16 core instruments only, and knew 7 of the 16
   status terms: an instrument at any other term would have been printed as
   "with no status recorded". The card approved on 9 Nov 2026 counts the core
   AND adjacent instruments (docs/ROADMAP-v2.md §8, "instruments card
   question 2": the masthead follows); this is its function, held to the
   contract by tools/metric-contract.mjs INSTRUMENTS_CARD.

   WHAT IS COUNTED: the instruments whose scope_class is core or adjacent,
   each in exactly one part, the part being its legislative_status. Every
   status term of data/taxonomy.json is a part, in STATUS_ORDER, empty or
   not, so a term an instrument moves to is counted under its own name and
   never as "no status". A value outside the vocabulary is `unmapped`, in no
   part — the contract (MC-5, MC-8) and tools/validate.mjs refuse it.
   WHAT IS NOT: the referenced and out-of-scope instruments, named as
   `excluded`, not dropped. No denominator, no share, no score.
   PURE: `asOf` is passed in; without it the interval notice is not
   computed (MC-9, MC-10). It reads the scalar, which instruments.json's
   $note says is not sufficient on its own; the card says so (MC-15).
   ============================================================ */

/** The scopes the figure covers (the author's decision of 9 Nov 2026). */
export const COVERED_SCOPES = Object.freeze(['scope:core', 'scope:adjacent']);
export const coveredInstruments = (list) => (list || []).filter((i) => i && COVERED_SCOPES.includes(i.scope_class));

/** Every `status:` term of data/taxonomy.json, in the order the obligations
 *  bite — the masthead's order for the seven it printed, then the rest of
 *  the procedure. The contract fails when the taxonomy gains a term this
 *  list does not hold (MC-5 through STATUS_STATES), so it cannot fall behind
 *  the vocabulary silently. */
export const STATUS_ORDER = Object.freeze([
  'status:applicable', 'status:partly-applicable', 'status:in-force',
  'status:transposition-pending', 'status:transposition-overdue',
  'status:published', 'status:adopted', 'status:political-agreement', 'status:trilogue',
  'status:council-position', 'status:parliament-position',
  'status:stalled', 'status:proposal',
  'status:amended', 'status:repealed', 'status:withdrawn',
]);
/** Each term is a recorded status (`known`); a missing one was never
 *  researched. One home; derived from STATUS_ORDER, never a second list. */
export const STATUS_STATES = Object.freeze(Object.fromEntries([
  ...STATUS_ORDER.map((t) => [t, 'known']), ['null', 'not_researched'],
]));

/** The part an instrument belongs to, or null when its status is outside the vocabulary. */
export const statusPart = (inst) => (inst && STATUS_ORDER.includes(inst.legislative_status) ? inst.legislative_status : null);

/** Whose status rests on nothing the record links: no status_basis and no milestone. */
export const statusUnsupported = (inst) => !inst.status_basis && !(inst.milestones || []).length;

/**
 * @param {object[]} instruments  every instrument; the covered ones are selected here
 * @param {{asOf?: string}} [opts]  an explicit ISO day for the interval notice; never the reader's clock
 */
export function instrumentsByStatus(instruments, { asOf = null } = {}) {
  const all = instruments || [];
  const inputs = coveredInstruments(all);
  const parts = {};
  for (const t of STATUS_ORDER) parts[t] = { records: [] };
  const unmapped = [];
  for (const i of inputs) {
    const p = statusPart(i);
    if (p) parts[p].records.push(i.id); else unmapped.push({ id: i.id, value: i.legislative_status ?? null });
  }
  const by_scope = Object.fromEntries(COVERED_SCOPES.map((s) => [s, inputs.filter((i) => i.scope_class === s).map((i) => i.id)]));
  const excluded = {};
  for (const i of all) if (!COVERED_SCOPES.includes(i.scope_class)) (excluded[i.scope_class ?? 'null'] ??= []).push(i.id);

  const dated = inputs.filter((i) => i.status_as_of).map((i) => i.status_as_of).sort();
  const as_of = { field: 'status_as_of', oldest: dated[0] ?? null, newest: dated[dated.length - 1] ?? null,
    undated: inputs.filter((i) => !i.status_as_of).map((i) => i.id) };

  const past_interval = asOf
    ? inputs.map((i) => ({ id: i.id, state: freshnessState(i.last_verified, riskClass('instrument', i, { asOf }), asOf) }))
      .filter((x) => x.state === 'freshness:review-due' || x.state === 'freshness:stale')
    : null;

  const weak = inputs.filter(statusUnsupported)
    .map((i) => ({ id: i.id, name: i.short_name, status: i.legislative_status, why: ['no status_basis and no milestone'] }));

  return { population: inputs.length, by_scope, parts, unmapped, excluded, as_of, interval_as_of: asOf, past_interval, weak };
}
