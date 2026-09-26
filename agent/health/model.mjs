/* ============================================================
   agent/health/model.mjs — what a metric is, and what it may not be

   SESSION 20 requires that every metric define its name, definition,
   source, calculation, update frequency, interpretation, limitations,
   and whether it is public or private. `defineMetric` refuses one
   that omits any of them, so the requirement is a gate rather than a
   convention somebody keeps.

   Three properties are the reason this file exists separately from
   the metrics themselves.

   ─────────────────────────────────────────────────────────────
   1 · THREE MEASUREMENT STATES, AND `unmeasurable` IS NOT ZERO

   Several things SESSION 20 asks for cannot be measured in this
   repository today. There is no deployment telemetry and the
   network policy refuses the live origin, so "deployment failures"
   is not zero — nobody can see it. There is no Control Room until
   SESSION 21, so its availability is not 100%. There is no
   authentication anywhere, so "authentication failures" is not zero;
   it is a question with no mechanism behind it.

   Reporting any of those as `0` would be the exact substitution
   `docs/AI-SAFE-BOUNDARIES.md` §0.3 and §0.4 prohibit: null is not
   unknown, and unknown is never zero. So a metric returns one of

     measured        a number, with the calculation that produced it
     unmeasurable    nothing here can see this, and `why` says what
                     would be needed
     not_applicable  the thing being measured does not exist yet

   and `summarise()` counts them in three separate buckets. A health
   view that showed "0" for all three would be reporting an absence
   of instrumentation as an absence of problems.

   ─────────────────────────────────────────────────────────────
   2 · `direction`, BECAUSE A LOWER NUMBER IS NOT AUTOMATICALLY
       HEALTHIER

   SESSION 20 states it and this repository has a specific reason to
   mean it. The 106 unverified records are the project's honesty
   (`AI-SAFE-BOUNDARIES` §0.7); driving that count down without doing
   the verification work is a prohibited action, not an improvement.
   The same is true of every open question `agent/ux/` produced and
   every reference gap in the running text.

   So a metric declares one of:

     lower_is_better    a defect count — validator errors, broken links
     higher_is_better   coverage — evidence attached, entities complete
     not_a_score        a number that must NOT be optimised, because
                        the only legitimate way to move it is work
                        this metric cannot see

   `NOT_A_SCORE_METRICS` below names the ones that must carry it, and
   the suite asserts none of them has been quietly re-labelled.

   ─────────────────────────────────────────────────────────────
   3 · THERE IS NO OVERALL SCORE, AND `overallScore` IS A THROW

   "Do not collapse these into a single raw score." The three domains
   answer different questions with different consequences: a broken
   link costs a reader a click, a false legal statement costs them a
   decision, and an unaudited approval costs the whole system its
   provenance. An arithmetic mean of the three says none of that and
   invites exactly the optimisation the paragraph above forbids.

   The function exists so that the refusal is discoverable at the
   place somebody would reach for it, rather than being a sentence in
   a document nobody opens.
   ============================================================ */

export const DOMAINS = ['public_website', 'knowledge', 'control_plane'];

export const DOMAIN_LABEL = {
  public_website: 'PUBLIC WEBSITE HEALTH',
  knowledge: 'KNOWLEDGE / CONTENT HEALTH',
  control_plane: 'PRIVATE CONTROL PLANE / AGENT SYSTEM HEALTH',
};

/** What each domain's failures actually cost. Recorded because it is
 *  the reason they are not summed. */
export const DOMAIN_STAKE = {
  public_website: 'a reader cannot use the site, or is shown something broken. Recoverable by a fix.',
  knowledge: 'a reader is told something false about EU law and may act on it. Not recoverable by a fix; it is a harm that already happened.',
  control_plane: 'the system cannot say what it did or on whose authority. Not visible to a reader at all, and it is what every other guarantee rests on.',
};

export const STATES = ['measured', 'unmeasurable', 'not_applicable'];
export const DIRECTIONS = ['lower_is_better', 'higher_is_better', 'not_a_score'];
export const VISIBILITY = ['public', 'private'];

export const FREQUENCIES = [
  'per_run',        // recomputed every time the monitor runs
  'per_commit',     // meaningful once per change to the tree
  'per_deploy',     // meaningful once per publication — nothing here observes one
  'continuous',     // would need a running process; nothing here has one
];

/**
 * The eight fields SESSION 20 requires, plus the two this repository
 * needs on top. Every one is mandatory; `defineMetric` throws rather
 * than defaulting, because a metric with an invented interpretation
 * is worse than no metric.
 */
export const REQUIRED_FIELDS = [
  'id',              // stable, referenced by the history record
  'name',            // what it is called
  'domain',          // which of the three
  'definition',      // what it counts, precisely enough to argue with
  'source',          // where the number comes from — a file, a tool, a trace
  'calculation',     // how it is derived from that source
  'frequency',       // how often it is meaningful to recompute
  'interpretation',  // what a RISE or FALL actually means
  'limitations',     // what it cannot tell you. Never empty.
  'visibility',      // public or private
  'direction',       // lower_is_better · higher_is_better · not_a_score
  'measure',         // (ctx) => Reading
];

/**
 * Metrics that MUST be `not_a_score`, by id. Each is a number whose
 * only legitimate route downward is work this monitor cannot see, so
 * an agent optimising it would be doing the prohibited thing.
 */
export const NOT_A_SCORE_METRICS = [
  'knowledge.unresolved_claims',
  'knowledge.verification_gaps',
  'knowledge.provenance_gaps',
  'control_plane.unresolved_conflicts',
  'control_plane.rejected_proposals',
];

export class MetricDefinitionError extends Error {}

/** @returns {object} the metric, frozen */
export function defineMetric(def) {
  for (const f of REQUIRED_FIELDS) {
    if (def[f] === undefined || def[f] === null || def[f] === '') {
      throw new MetricDefinitionError(`metric "${def.id ?? '(no id)'}" omits "${f}". SESSION 20 requires every metric to define its name, definition, source, calculation, update frequency, interpretation, limitations and visibility — a metric missing one of those is a number nobody can argue with.`);
    }
  }
  if (!DOMAINS.includes(def.domain)) throw new MetricDefinitionError(`metric "${def.id}" has domain "${def.domain}", which is not one of ${DOMAINS.join(', ')}`);
  if (!DIRECTIONS.includes(def.direction)) throw new MetricDefinitionError(`metric "${def.id}" has direction "${def.direction}"`);
  if (!VISIBILITY.includes(def.visibility)) throw new MetricDefinitionError(`metric "${def.id}" has visibility "${def.visibility}"`);
  if (!FREQUENCIES.includes(def.frequency)) throw new MetricDefinitionError(`metric "${def.id}" has frequency "${def.frequency}"`);
  if (typeof def.measure !== 'function') throw new MetricDefinitionError(`metric "${def.id}" has no measure()`);
  if (!def.id.startsWith(`${def.domain}.`)) throw new MetricDefinitionError(`metric id "${def.id}" must be prefixed with its domain, so a reading can never be filed under the wrong one`);
  if (NOT_A_SCORE_METRICS.includes(def.id) && def.direction !== 'not_a_score') {
    throw new MetricDefinitionError(`metric "${def.id}" is in NOT_A_SCORE_METRICS and declares direction "${def.direction}". The only legitimate way to move this number is work this monitor cannot see; labelling it a score invites an agent to optimise it, which is the prohibited action rather than an improvement.`);
  }
  /* A control-plane metric is private unless somebody has thought
     about it. The default is not "public and nobody noticed". */
  if (def.domain === 'control_plane' && def.visibility === 'public' && !def.public_justification) {
    throw new MetricDefinitionError(`metric "${def.id}" is a control-plane metric marked public with no public_justification. SESSION 20: the public website must not expose private control plane health data unless an explicitly defined public-safe subset is intentionally published.`);
  }
  return Object.freeze({ ...def });
}

/* ---------------------------------------------------------- readings */

/** A number that was actually computed. */
export const measured = (value, { unit = 'count', of = null, detail = null, evidence = [] } = {}) =>
  ({ state: 'measured', value, unit, of, detail, evidence });

/**
 * Nothing in this repository can see this.
 *
 * `why` is mandatory and `needs` says what would change it. An
 * unmeasurable with no route to becoming measurable is a metric that
 * should not have been declared.
 */
export const unmeasurable = (why, needs) => {
  if (!why || !needs) throw new MetricDefinitionError('an unmeasurable reading must say why, and what would be needed to measure it');
  return { state: 'unmeasurable', value: null, unit: null, of: null, why, needs, detail: null, evidence: [] };
};

/** The thing being measured does not exist yet. Distinct from
 *  unmeasurable: there is nothing wrong, there is nothing there. */
export const notApplicable = (why) => ({ state: 'not_applicable', value: null, unit: null, of: null, why, detail: null, evidence: [] });

/* ---------------------------------------------------------- summary */

/**
 * Per-domain totals. Three buckets, never one.
 *
 * There is deliberately no `score`, no `percentage` and no `grade`.
 * `worst` names the metric with the most findings so a reader has
 * somewhere to start, and it is explicitly NOT a ranking of health.
 */
export function summarise(readings) {
  const byDomain = {};
  for (const d of DOMAINS) {
    const rs = readings.filter((r) => r.metric.domain === d);
    const measuredRs = rs.filter((r) => r.reading.state === 'measured');
    const defects = measuredRs.filter((r) => r.metric.direction === 'lower_is_better' && r.reading.value > 0);
    byDomain[d] = {
      label: DOMAIN_LABEL[d],
      stake: DOMAIN_STAKE[d],
      metrics: rs.length,
      measured: measuredRs.length,
      unmeasurable: rs.filter((r) => r.reading.state === 'unmeasurable').length,
      not_applicable: rs.filter((r) => r.reading.state === 'not_applicable').length,
      /* Counted separately from defects. A number that must not be
         optimised is not a defect count. */
      not_a_score: rs.filter((r) => r.metric.direction === 'not_a_score').length,
      metrics_with_findings: defects.length,
      findings: defects.reduce((n, r) => n + r.reading.value, 0),
      worst: defects.length
        ? defects.slice().sort((a, b) => b.reading.value - a.reading.value)[0].metric.id
        : null,
    };
  }
  return byDomain;
}

/**
 * The refusal, at the place somebody would reach for it.
 *
 * @throws {MetricDefinitionError} always
 */
export function overallScore() {
  throw new MetricDefinitionError(
    'There is no overall health score, and this function exists to say so where somebody would look for one.\n\n'
    + 'The three domains answer different questions with different consequences. A broken internal link costs a\n'
    + 'reader a click. A false statement about EU law costs them a decision they cannot take back. An unaudited\n'
    + 'approval costs the whole system its provenance and is invisible to every reader. An arithmetic mean of the\n'
    + 'three says none of that, and it invites optimising the cheapest domain to raise the number — which, for the\n'
    + 'five metrics in NOT_A_SCORE_METRICS, is a prohibited action rather than an improvement.\n\n'
    + 'Read the three domains separately. summarise() returns them separately for that reason.',
  );
}
