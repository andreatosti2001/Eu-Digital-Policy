/* ============================================================
   agent/health/monitor.mjs — Agent 10, the Website Health Monitor

   SESSION 20. The tenth agent, and the first whose subject is the
   SYSTEM rather than any part of it: the site a reader loads, the
   corpus that site is arguing from, and the machinery that produced
   both.

   IT IS AGENT 10, NOT THE BRIEF'S ANYTHING. SESSION 18's brief called
   its agent 8 when 8 was taken; this session's brief numbers nothing,
   which is easier. Agent 9 is Implementation and QA; this is 10.

   THREE DOMAINS, NEVER SUMMED, and the run is instrumented so that
   the separation is visible in the trace and not only in the report:
   one span per domain, one observation per metric, and a census that
   reports the three sets of totals side by side. A single overall
   figure appears nowhere, and `model.mjs overallScore()` throws if
   anybody reaches for one.

   IT WRITES NOTHING EXCEPT ITS OWN HISTORY. No dataset, no page, no
   stylesheet, no proposal, no approval. It reads, measures, and
   appends one line to a git-ignored history file. The repository is
   hashed around the run and the result says whether it changed —
   the same discipline every agent here follows, and it matters more
   for this one than most, because a monitor that altered what it
   measures would be the least trustworthy thing in the system.

   AN UNMEASURABLE IS A DELIVERABLE. Five of the forty-four metrics
   cannot be measured in this repository today: deployment failures,
   authentication failures, Control Room availability, and two that
   depend on runs nobody has made. Each reports WHY and WHAT WOULD BE
   NEEDED. Deleting one to shorten the report would turn "nothing here
   can see this" into "nothing here is wrong", which is the single
   substitution this whole project is arranged against.
   ============================================================ */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { gather } from './gather.mjs';
import { ALL_METRICS, byDomain, measureAll, publicView, privateMetrics } from './metrics.mjs';
import { DOMAINS, DOMAIN_LABEL, DOMAIN_STAKE, summarise, NOT_A_SCORE_METRICS } from './model.mjs';
import { entryFor, append, previousEntry, movement } from './history.mjs';

export const HEALTH_AGENT = 'health-monitor';

/** Directories whose contents change every run by design. Hashing
 *  them would report every run as having modified the repository. */
const VOLATILE = new Set(['.git', 'node_modules', 'runs', 'records', 'drafts', 'history']);

function hashTree(root = REPO_ROOT) {
  const out = {};
  (function walk(dir, rel = '') {
    for (const name of readdirSync(dir).sort()) {
      if (VOLATILE.has(name)) continue;
      const abs = join(dir, name);
      const r = rel ? `${rel}/${name}` : name;
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) walk(abs, r);
      else out[r] = createHash('sha256').update(readFileSync(abs)).digest('hex');
    }
  })(root);
  return out;
}

export class HealthMonitor {
  /**
   * @param {{tracer:object, asOf:string, root?:string, browser?:boolean,
   *          quick?:boolean, validators?:boolean, probe?:boolean,
   *          record?:boolean}} opts
   */
  constructor({ tracer, asOf, root = REPO_ROOT, browser = true, quick = false, validators = true, probe = true, record = true }) {
    this.tracer = tracer;
    this.asOf = asOf;
    this.root = root;
    this.opts = { browser, quick, validators, probe };
    this.record = record;
  }

  async run() {
    const run = this.tracer.startRun({ kind: 'agent', agent: HEALTH_AGENT, task: 'measure the three health domains, and say what cannot be measured' });
    const before = hashTree(this.root);

    try {
      /* ------------------------------------------ gather, once */
      const ctx = await run.step({ kind: 'tool', name: 'health.gather', inputs: { as_of: this.asOf, ...this.opts }, captureOutput: false },
        () => gather({ asOf: this.asOf, root: this.root, ...this.opts, excludeTrace: run.trace_id }));

      run.observe({
        summary: `COVERAGE — what this run could see: validators ${ctx.validators ? 'ran' : 'did not run'}, browser ${ctx.browser ? ctx.browser.status : 'did not run'}, loopback probe ${ctx.probe && !ctx.probe.error ? 'ran' : 'did not run'}`,
        subject: 'coverage',
        data: {
          validators_run: Boolean(ctx.validators),
          browser_status: ctx.browser?.status ?? 'not run',
          browser_error: ctx.browser_error,
          probe_ran: Boolean(ctx.probe && !ctx.probe.error),
          datasets_parsed: Object.keys(ctx.data).length,
          dataset_errors: ctx.dataset_errors,
          traces_in_store: ctx.traces.length,
          own_trace_excluded: ctx.self_trace_excluded,
          records_in_store: ctx.records.byId.size,
          commit: ctx.commit,
          branch: ctx.branch,
        },
      });

      /* ------------------------------ one span per domain, never one */
      const readings = [];
      for (const domain of DOMAINS) {
        const metrics = byDomain(domain);
        const span = run.startAgent({ agent: HEALTH_AGENT, task: DOMAIN_LABEL[domain], name: `health.${domain}` });
        const domainReadings = measureAll(ctx, { metrics });

        for (const { metric, reading } of domainReadings) {
          span.observe({
            summary: `${metric.id} — ${reading.state === 'measured' ? `${reading.value} ${reading.unit}${reading.of !== null && reading.of !== undefined ? ` of ${reading.of}` : ''}` : reading.state.toUpperCase()}`,
            subject: metric.id,
            data: {
              name: metric.name,
              state: reading.state,
              value: reading.value,
              unit: reading.unit,
              of: reading.of ?? null,
              direction: metric.direction,
              visibility: metric.visibility,
              /* The eight declared fields travel with the reading.
                 A number without its definition and its limitations
                 is a number somebody will quote out of context. */
              definition: metric.definition,
              source: metric.source,
              calculation: metric.calculation,
              frequency: metric.frequency,
              interpretation: metric.interpretation,
              limitations: metric.limitations,
              why: reading.why ?? null,
              needs: reading.needs ?? null,
              threw: reading.threw ?? false,
              detail: reading.detail ?? null,
            },
            risk: reading.state === 'measured' && metric.direction === 'lower_is_better' && reading.value > 0 ? 'medium' : 'low',
          });
        }

        readings.push(...domainReadings);
        const s = summarise(domainReadings)[domain];
        span.end({
          status: 'ok',
          outputs: { metrics: s.metrics, measured: s.measured, unmeasurable: s.unmeasurable, not_applicable: s.not_applicable, metrics_with_findings: s.metrics_with_findings },
        });
      }

      const summary = summarise(readings);

      /* ------------------------------------------ the census */
      run.observe({
        summary: `HEALTH CENSUS — ${DOMAINS.map((d) => `${d} ${summary[d].metrics_with_findings}/${summary[d].measured}`).join(' · ')} (metrics with findings / measured, per domain — NOT summed)`,
        subject: 'census',
        data: {
          as_of: this.asOf,
          total_metrics: readings.length,
          by_domain: summary,
          unmeasurable: readings.filter((r) => r.reading.state === 'unmeasurable').map((r) => ({ id: r.metric.id, why: r.reading.why, needs: r.reading.needs })),
          not_applicable: readings.filter((r) => r.reading.state === 'not_applicable').map((r) => ({ id: r.metric.id, why: r.reading.why })),
          not_a_score: NOT_A_SCORE_METRICS,
          threw: readings.filter((r) => r.reading.threw).map((r) => r.metric.id),
        },
      });

      /* THE REFUSAL, ON THE TRACE. A later reader of this run should
         find the decision not to produce a score, with what was not
         chosen — the same discipline every decision here follows. */
      run.decide({
        decision: 'report three domains separately and produce no overall score',
        rationale: 'the three answer different questions with different consequences: a broken link costs a reader a click, a false legal statement costs them a decision they cannot take back, and an unaudited approval costs the system its provenance and is invisible to every reader. A mean says none of that.',
        alternatives: [
          { option: 'a single 0–100 health score', why_not: 'SESSION 20 forbids it explicitly, and it would invite raising the number by improving the cheapest domain. agent/health/model.mjs overallScore() throws rather than returning one.' },
          { option: 'a weighted score with the knowledge domain weighted highest', why_not: 'a weighting is a judgement about how many broken links equal one false legal statement. Nothing in this repository can support that exchange rate, and inventing one would be an interpretation rendered as arithmetic.' },
          { option: 'count only the metrics that are measurable today', why_not: 'that would report the five unmeasurable metrics as absent rather than as unmeasured, which is the substitution AI-SAFE-BOUNDARIES §0.4 prohibits.' },
        ],
        confidence: 1,
        risk: 'low',
      });

      /* ------------------------------------------ the boundary claim */
      const priv = privateMetrics();
      const pub = publicView(readings, { asOf: this.asOf, commit: ctx.commit });
      const leaked = collectLeaks(pub, priv);
      run.observe({
        summary: leaked.length
          ? `PUBLIC SUBSET LEAKS ${leaked.length} PRIVATE METRIC(S)`
          : `PUBLIC SUBSET — ${Object.values(pub.domains).reduce((n, d) => n + d.metrics.length, 0)} metric(s) publishable, ${priv.length} withheld, 0 leaked`,
        subject: 'public subset',
        risk: leaked.length ? 'high' : 'low',
        data: {
          publishable: Object.fromEntries(DOMAINS.map((d) => [d, pub.domains[d].metrics.map((m) => m.id)])),
          withheld: priv.length,
          leaked,
          rule: 'visibility is a whitelist. A control-plane metric can only be marked public with a written justification that model.mjs checks, and publicReading() drops detail and evidence wholesale rather than filtering named keys.',
        },
      });

      /* ------------------------------------------ history */
      const previous = previousEntry();
      const entry = entryFor({ readings, ctx, trace_id: run.trace_id });
      const moved = movement(entry, previous);
      if (this.record) append(entry);

      run.observe({
        summary: moved.comparable
          ? `MOVEMENT since ${moved.since} — ${moved.changes.length} metric(s) moved, ${moved.not_a_score_changes.length} not-a-score metric(s) moved, ${moved.coverage_changes.length} coverage change(s)`
          : 'MOVEMENT — none: this is the first entry in the history, and a first reading is a baseline rather than a movement',
        subject: 'movement',
        data: moved,
      });

      /* ------------------------------------------ the honest closing claim */
      const after = hashTree(this.root);
      const unchanged = JSON.stringify(before) === JSON.stringify(after);
      run.observe({
        summary: unchanged
          ? 'NOTHING MEASURED WAS CHANGED — the repository is byte-identical to before this run, excluding the git-ignored run stores'
          : 'THE REPOSITORY CHANGED DURING THIS RUN — a monitor that alters what it measures is the least trustworthy thing in the system',
        subject: 'NOTHING CHANGED',
        risk: unchanged ? 'low' : 'high',
        data: {
          unchanged,
          changed: unchanged ? [] : Object.keys(after).filter((k) => before[k] !== after[k]).concat(Object.keys(before).filter((k) => !(k in after))),
          datasets_written: 0,
          pages_written: 0,
          proposals_written: 0,
          approvals_written: 0,
          history_appended: this.record ? 1 : 0,
        },
      });

      run.end({
        status: 'ok',
        outputs: {
          metrics: readings.length,
          measured: readings.filter((r) => r.reading.state === 'measured').length,
          unmeasurable: readings.filter((r) => r.reading.state === 'unmeasurable').length,
          not_applicable: readings.filter((r) => r.reading.state === 'not_applicable').length,
        },
        confidence: 1,
        risk: 'low',
      });

      return {
        trace_id: run.trace_id,
        run_id: run.run_id,
        as_of: this.asOf,
        ctx,
        readings,
        summary,
        public_view: pub,
        leaked,
        entry,
        movement: moved,
        tree_unchanged: unchanged,
        changed_paths: unchanged ? [] : Object.keys(after).filter((k) => before[k] !== after[k]),
      };
    } catch (err) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }
  }
}

/**
 * Does the public view contain anything belonging to a private
 * metric?
 *
 * Checked by searching the SERIALISED view for each private metric's
 * id, rather than by inspecting the structure. A structural check
 * verifies the shape somebody wrote; this catches a private id that
 * arrived through a field nobody thought about — which is the only
 * way this leak would ever actually happen.
 */
export function collectLeaks(publicViewObject, privateMetricList) {
  const text = JSON.stringify(publicViewObject);
  return privateMetricList.filter((m) => text.includes(m.id)).map((m) => m.id);
}
