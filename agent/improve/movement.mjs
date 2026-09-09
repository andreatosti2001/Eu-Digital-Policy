/* ============================================================
   agent/improve/movement.mjs — what changed between two cycles, and
   what this refuses to call a change

   THE ONE RULE THIS MODULE EXISTS TO ENFORCE. A finding present last
   cycle and absent this cycle has TWO possible explanations, and only
   one of them is progress:

     · somebody fixed it, or
     · the observer that reports it did not run.

   They are not distinguishable from the finding lists alone, and a
   loop that assumed the first would report improvement on the days
   it was broken — the exact failure mode a health metric marked
   `not_a_score` is arranged against, and the exact shape of the
   defect docs/HANDOVER.md records twice already: a check that passed
   for the wrong reason. So movement is computed PER OBSERVER, and an
   observer that did not run in both cycles yields `undetermined` for
   every finding it owns. Never `resolved`, and never counted as an
   improvement.

   That is this repository's own §0.3 rule — `null` is not `unknown`
   and unknown is never zero — applied to the one place where getting
   it wrong would let a machine tell a person the system got better.

   MOVEMENT OVER FINDINGS IS A SET DIFFERENCE, AND IT IS ONLY SOUND
   BECAUSE THE IDS ARE CONTENT-DERIVED. agent/schemas/identity.mjs
   made a finding's id a function of its own content precisely so that
   "this is the finding I saw last week" is answerable. Before
   SESSION 13 the ids were queue positions and removing one unrelated
   instrument renumbered 37 of 55 depth findings; this module would
   have reported 37 resolved and 37 new. It relies on that fix and
   says so, because if ids ever stop being content-derived, every
   number here becomes noise and nothing else would notice.

   WHAT THIS MODULE IS NOT. It is not `agent/health/history.mjs`.
   That module owns movement over the 44 METRIC READINGS and has done
   since SESSION 20; this one owns movement over INDIVIDUAL FINDINGS,
   which nothing tracked. Signals are compared here only for the
   handful the loop itself routes on, and a signal comparison says
   which number moved and never which item did — a count has no
   identity to follow.

   A RISE IS NOT A REGRESSION. `agent/health/model.mjs` marks five
   metrics `not_a_score` because every cheap route down is a
   prohibited action, and the same is true of most of what this loop
   counts: more gaps found is usually the system looking harder. So
   this module reports DIRECTION and never a verdict, and
   `interpretation` on every signal says which way is which — or that
   neither way is.
   ============================================================ */

/** A signal's direction, where one is meaningful. `not_a_score` is
 *  the third answer and it is the honest one for most of these:
 *  moving the number is not the same as improving the system, and a
 *  loop that ranked them would teach a reader to game them. */
export const SIGNAL_DIRECTION = Object.freeze({
  'validators.errors': 'lower_is_better',
  'validators.at_baseline': 'higher_is_better',
  'boundary.blocking': 'lower_is_better',
  'boundary.warnings': 'not_a_score',
  'reach.absent_granted_fields': 'not_a_score',
  'reach.categories_without_surface': 'not_a_score',
});

export const SIGNAL_INTERPRETATION = Object.freeze({
  'validators.errors': 'any value above 0 means a dataset references something that does not exist or breaks a shape a renderer assumes. This is the one signal here where 0 is a genuine pass.',
  'validators.at_baseline': 'false means at least one validator moved off the state docs/CURRENT-ARCHITECTURE.md §12 records. It does not say whether the move was an improvement.',
  'boundary.blocking': 'above 0 means something that must not be published is in the published surface.',
  'boundary.warnings': 'these are standing findings about a repository whose deployment unit is the whole tree. The count rises when a session adds files and that is not a regression.',
  'reach.absent_granted_fields': 'a governance grant naming a field no record carries. Falling to 0 could mean the schema grew or the grant narrowed, and those are opposite events.',
  'reach.categories_without_surface': 'an enabled category with nothing to write to. The same ambiguity as above applies.',
});

export const FINDING_STATES = Object.freeze(['new', 'persisting', 'resolved', 'undetermined']);

/** Findings grouped by the observer that produced them. */
function byObserver(findings = []) {
  const m = new Map();
  for (const f of findings) {
    if (!m.has(f.observer)) m.set(f.observer, new Map());
    m.get(f.observer).set(f.finding_id, f);
  }
  return m;
}

/** Which observers a cycle entry says actually ran. Read from the
 *  entry's coverage rather than inferred from whether it has any
 *  findings: an observer that ran and found nothing is a result, and
 *  inferring from the count would confuse it with silence. */
export function ranIn(entry) {
  const cov = entry?.coverage ?? [];
  return new Set(cov.filter((c) => c.state === 'ran').map((c) => c.observer));
}

/**
 * MOVEMENT BETWEEN TWO CYCLES.
 *
 * @param {object} current  a cycle entry (see ledger.mjs `entryFor`)
 * @param {object|null} previous  the entry before it, or null
 * @returns {{first_cycle:boolean, findings:object[], by_observer:object[],
 *            signals:object[], summary:object}}
 *
 * With no previous cycle every finding is `undetermined`, not `new`.
 * "New" is a claim about a comparison, and the first cycle has
 * nothing to compare against — reporting 210 new findings on a first
 * run would be a number a reader takes as an event.
 */
export function movement(current, previous = null) {
  const first = !previous;
  const curBy = byObserver(current?.findings ?? []);
  const prevBy = byObserver(previous?.findings ?? []);
  const curRan = ranIn(current);
  const prevRan = ranIn(previous);

  const rows = [];
  const perObserver = [];

  const observers = new Set([...curBy.keys(), ...prevBy.keys(), ...curRan, ...prevRan]);
  for (const observer of [...observers].sort()) {
    const cur = curBy.get(observer) ?? new Map();
    const prev = prevBy.get(observer) ?? new Map();
    const comparable = !first && curRan.has(observer) && prevRan.has(observer);

    const why = first
      ? 'this is the first recorded cycle, so there is nothing to compare against. Every finding is undetermined rather than new.'
      : !curRan.has(observer)
        ? `${observer} did not run in this cycle, so nothing it owns can be called resolved. An observer that did not run is not an observer that found nothing.`
        : !prevRan.has(observer)
          ? `${observer} did not run in the previous cycle, so nothing it owns can be called new.`
          : null;

    let nw = 0; let persisting = 0; let resolved = 0; let undetermined = 0;

    for (const [id, f] of cur) {
      const state = comparable ? (prev.has(id) ? 'persisting' : 'new') : 'undetermined';
      rows.push({ finding_id: id, observer, state, why: comparable ? null : why, severity: f.severity, contract: f.contract, summary: f.summary });
      if (state === 'new') nw += 1; else if (state === 'persisting') persisting += 1; else undetermined += 1;
    }
    if (comparable) {
      for (const [id, f] of prev) {
        if (cur.has(id)) continue;
        rows.push({ finding_id: id, observer, state: 'resolved', why: null, severity: f.severity, contract: f.contract, summary: f.summary });
        resolved += 1;
      }
    } else {
      for (const [id, f] of prev) {
        if (cur.has(id)) continue;
        rows.push({ finding_id: id, observer, state: 'undetermined', why, severity: f.severity, contract: f.contract, summary: f.summary });
        undetermined += 1;
      }
    }

    perObserver.push({
      observer,
      comparable,
      why,
      current: cur.size,
      previous: prev.size,
      new: nw,
      persisting,
      resolved,
      undetermined,
    });
  }

  return {
    first_cycle: first,
    previous_cycle_id: previous?.cycle_id ?? null,
    previous_as_of: previous?.as_of ?? null,
    findings: rows,
    by_observer: perObserver,
    signals: signalMovement(current?.signals ?? [], previous?.signals ?? [], first),
    summary: {
      new: rows.filter((r) => r.state === 'new').length,
      persisting: rows.filter((r) => r.state === 'persisting').length,
      resolved: rows.filter((r) => r.state === 'resolved').length,
      undetermined: rows.filter((r) => r.state === 'undetermined').length,
      comparable_observers: perObserver.filter((o) => o.comparable).map((o) => o.observer),
      incomparable_observers: perObserver.filter((o) => !o.comparable).map((o) => ({ observer: o.observer, why: o.why })),
    },
  };
}

/**
 * Signal movement. `direction` says which way is better where that
 * is a meaningful question and `not_a_score` where it is not, and
 * `moved` is null — not false — where either reading is missing.
 */
export function signalMovement(current = [], previous = [], first = false) {
  const prev = new Map(previous.map((s) => [s.signal_id, s]));
  return current.map((s) => {
    const p = prev.get(s.signal_id) ?? null;
    const a = p?.value ?? null;
    const b = s.value ?? null;
    const numeric = typeof a === 'number' && typeof b === 'number';
    const bool = typeof a === 'boolean' && typeof b === 'boolean';
    const direction = SIGNAL_DIRECTION[s.signal_id] ?? 'not_a_score';

    let moved = null;
    let reading = 'no comparable reading in the previous cycle, so nothing is established about movement.';
    if (first) {
      reading = 'this is the first recorded cycle. A single reading is a position, not a movement.';
    } else if (numeric || bool) {
      const delta = numeric ? b - a : (b === a ? 0 : (b ? 1 : -1));
      moved = delta !== 0;
      reading = delta === 0
        ? 'unchanged.'
        : direction === 'not_a_score'
          ? `moved from ${a} to ${b}. This signal has no better direction — see its interpretation before reading the move as progress or regression.`
          : `moved from ${a} to ${b}, which is ${((direction === 'lower_is_better') === (delta < 0)) ? 'the better direction' : 'the worse direction'} for this signal.`;
    } else if (b === null) {
      reading = 'not measured in this cycle. That is not a zero and not a pass.';
    }

    return {
      signal_id: s.signal_id,
      value: b,
      previous_value: a,
      unit: s.unit,
      direction,
      moved,
      reading,
      interpretation: SIGNAL_INTERPRETATION[s.signal_id] ?? null,
    };
  });
}
