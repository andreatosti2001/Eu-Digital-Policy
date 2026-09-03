/* ============================================================
   agent/health/metrics.mjs — the registry, and the public subset

   Assembles the three domains plus the security-boundary checks and
   validates the whole set once at import. A registry with two
   metrics sharing an id, or a domain that lost half its metrics in a
   refactor, is caught here rather than by a reader wondering why a
   number stopped moving.

   THE PUBLIC SUBSET IS A WHITELIST, NOT A FILTER.

   SESSION 20: "The public website MUST NOT expose private Control
   Plane health data unless an explicitly defined public-safe subset
   is intentionally published."

   `publicSubset()` returns metrics whose `visibility` is `public`,
   and `model.mjs` refuses a control-plane metric marked public
   unless it also carries a `public_justification` explaining why.
   That is three deliberate acts — set the flag, write the reason,
   pass the definition gate — before anything operational can reach a
   public view.

   The alternative shape, a `redact()` that strips known-sensitive
   fields, was rejected: it protects what somebody remembered to
   name, and the failure mode is a new private metric that nobody
   adds to the deny list and which is therefore public by default.
   The whitelist's failure mode is a public metric accidentally left
   private, which is a report nobody sees rather than a leak.

   `publicReading()` additionally strips `detail` and `evidence` from
   a public reading. A count is a fact about the site; the paths,
   proposal ids, trace ids and file names inside `detail` are
   operational, and the two travel together in the private view for
   convenience rather than because they belong to the same audience.
   ============================================================ */

import { DOMAINS, DOMAIN_LABEL, DOMAIN_STAKE, NOT_A_SCORE_METRICS } from './model.mjs';
import { PUBLIC_METRICS } from './public.mjs';
import { KNOWLEDGE_METRICS } from './knowledge.mjs';
import { CONTROL_METRICS } from './control.mjs';
import { SECURITY_METRICS } from './security.mjs';

export const ALL_METRICS = [
  ...PUBLIC_METRICS,
  ...KNOWLEDGE_METRICS,
  ...CONTROL_METRICS,
  ...SECURITY_METRICS,
];

/* ------------------------------------------------ registry integrity */

const seen = new Map();
for (const m of ALL_METRICS) {
  if (seen.has(m.id)) throw new Error(`two metrics share the id "${m.id}" — a reading filed under a duplicated id is a reading nobody can attribute`);
  seen.set(m.id, m);
}
for (const id of NOT_A_SCORE_METRICS) {
  if (!seen.has(id)) throw new Error(`NOT_A_SCORE_METRICS names "${id}" and no metric has that id. Either the metric was renamed and the list was not, or it was deleted — and a not-a-score metric silently becoming a score is the failure that list exists to prevent.`);
}
for (const d of DOMAINS) {
  if (!ALL_METRICS.some((m) => m.domain === d)) throw new Error(`domain "${d}" has no metrics`);
}

export const BY_ID = seen;
export const byDomain = (d) => ALL_METRICS.filter((m) => m.domain === d);

/* ------------------------------------------------ measuring */

/**
 * Measure every metric against one gathered context.
 *
 * A metric that THROWS becomes an `unmeasurable` reading naming the
 * error, not a crashed run: a health monitor that dies because one
 * of forty probes hit an edge case has stopped monitoring the other
 * thirty-nine, which is a worse outcome than a gap it reports.
 */
export function measureAll(ctx, { metrics = ALL_METRICS } = {}) {
  return metrics.map((metric) => {
    let reading;
    try {
      reading = metric.measure(ctx);
    } catch (err) {
      reading = {
        state: 'unmeasurable',
        value: null, unit: null, of: null, detail: null, evidence: [],
        why: `the metric threw while measuring: ${err.message}`,
        needs: 'a fix in agent/health/. This is a defect in the monitor, not a reading about the repository, and it is reported as unmeasurable rather than as zero so it cannot be mistaken for a clean result.',
        threw: true,
      };
    }
    return { metric, reading };
  });
}

/* ------------------------------------------------ the public subset */

export const publicMetrics = () => ALL_METRICS.filter((m) => m.visibility === 'public');
export const privateMetrics = () => ALL_METRICS.filter((m) => m.visibility === 'private');

/**
 * One reading, reduced to what is safe to publish.
 *
 * `detail` and `evidence` are dropped wholesale rather than filtered.
 * A filter needs a list of sensitive keys, and the next metric to add
 * a sensitive key will not be on it.
 */
export function publicReading({ metric, reading }) {
  return {
    id: metric.id,
    name: metric.name,
    domain: metric.domain,
    definition: metric.definition,
    interpretation: metric.interpretation,
    limitations: metric.limitations,
    direction: metric.direction,
    state: reading.state,
    value: reading.value,
    unit: reading.unit,
    of: reading.of ?? null,
    ...(reading.state !== 'measured' ? { why: reading.why ?? null } : {}),
  };
}

/**
 * The whole public view. Nothing private reaches it, and the fact
 * that private metrics EXIST is stated as a count rather than
 * hidden — a view that pretended the private domain did not exist
 * would be a different kind of dishonesty.
 */
export function publicView(readings, { asOf, commit = null }) {
  const pub = readings.filter((r) => r.metric.visibility === 'public');
  const priv = readings.filter((r) => r.metric.visibility === 'private');
  return {
    as_of: asOf,
    commit,
    generated_at: new Date().toISOString(),
    note: 'The public-safe subset of the health record. Every metric below is marked public in agent/health/, and a control-plane metric can only be marked public with a written justification that agent/health/model.mjs checks. Counts only: the detail and evidence behind each reading stay private.',
    domains: Object.fromEntries(DOMAINS.map((d) => [d, {
      label: DOMAIN_LABEL[d],
      stake: DOMAIN_STAKE[d],
      metrics: pub.filter((r) => r.metric.domain === d).map(publicReading),
    }])),
    withheld: {
      count: priv.length,
      why: 'private control plane health data: agent execution, trace integrity, approval and authorization state, and the security-boundary checks. SESSION 20 forbids publishing it, and naming the count rather than the metrics is the most that can be said without publishing it.',
    },
    no_overall_score: 'There is no overall health score. The three domains answer different questions with different consequences and are never summed — agent/health/model.mjs overallScore() throws, with the reasoning.',
  };
}

export { DOMAINS, DOMAIN_LABEL, DOMAIN_STAKE };
