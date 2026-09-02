/* ============================================================
   agent/depth/depth.mjs — Agent 4, the Data Depth Agent

   The question, as SESSION 11's brief puts it: what important legal
   and regulatory knowledge is missing from the current structured
   representation?

   Inputs, as the brief names them:

     canonical data      data/*.json, read through
                         agent/integrate/canonical.mjs
     verified claims     the claims in the corpus and what each rests
                         on, using the same self-citation exclusion
                         js/format.js applies before grading
     change records      the RegulatoryChange records a Detector run
                         stored, where a trace id is given
     source coverage     data/sources.json, and which records cite what
     existing taxonomy   data/taxonomy.json, the enum authority — and
                         the terms it declares that nothing uses

   Output: a `KnowledgeGap` per surviving finding. **Not a
   `DataGap`** — that contract is about a value on a record that
   exists and is unsupported; this one is about a concept the model
   has no place for. The distinction is set out at the top of
   `agent/schemas/contracts/knowledge-gap.mjs`, and the contract
   forbids the other's word with a pointer, so an agent reaching for
   the wrong one is told which it wanted.

   DO NOT DIRECTLY MODIFY CANONICAL DATA. `data/` is read and never
   written. There is no write path in this directory; the suite scans
   every module here for a write call and hashes the whole of `data/`
   around a full run. A gap is a question, and the answer is a
   DataProposal behind an ApprovalRequest — neither of which this
   agent writes, and the contract forbids the fields that would let a
   gap carry an edit.

   DO NOT REWARD QUANTITY. This is the instruction the design turns
   on, and it is a mechanism rather than an intention: a finding is
   reported only where a record in the corpus LEANS on the missing
   concept (`demand.mjs`), and the contract independently refuses any
   record whose evidence carries no `dataset_record`. What is set
   aside is counted, reasoned and put on the trace — a run that
   reported nine findings and silently dropped thirty-one would have
   told its reader something false about its own coverage.

   THE ANALYSIS IS INSTRUMENTED. Every detector is a span carrying
   what it found, what it set aside and why; every gap is an artifact
   pointer; the ranking is a decision with its alternatives; and the
   run ends with a census observation. `agent/observability/query.mjs`
   derives the depth view from those at read time and stores nothing
   twice.
   ============================================================ */

import { isoOf } from '../observability/ids.mjs';
import { emit } from '../schemas/gateway.mjs';
import { loadCorpus } from '../integrate/canonical.mjs';
import { RecordBuilder } from '../verifier/build.mjs';
import { DEPTH_GAP_KINDS, DEPTH_IMPACT_RANK } from '../schemas/types.mjs';
import { buildLens } from './lens.mjs';
import { DETECTORS } from './detectors.mjs';
import { partition, demandEvidence } from './demand.mjs';
import { autonomyFor, confidenceFor, order } from './rank.mjs';

export const DEPTH_AGENT = 'data-depth';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** How many demand entries become evidence entries on one record.
 *
 *  The COUNT always describes the whole demand; only the itemised
 *  evidence is bounded. SESSION 10 learned this the expensive way —
 *  the trace store caps a stored string at 8000 characters, an
 *  inlined subgraph was truncated mid-JSON, and the viewer showed a
 *  graph of zero nodes for a change that reached 175 records. The
 *  cap is right; the fix is to keep the counts honest about what
 *  they describe. */
export const MAX_EVIDENCE = 12;

export class DepthAgent {
  /**
   * @param {{tracer:object, store:object, corpus?:object, asOf:string,
   *          simulated?:boolean, changes?:object[]}} opts
   *   `asOf` is mandatory. A depth report without the date its corpus
   *   position was read as true at cannot be told from a stale one,
   *   and "the corpus has not grown" and "nobody has looked" are
   *   different findings that only a stated date separates
   *   (docs/AUDIT-2026-09-01.md F-15).
   */
  constructor({ tracer, store, corpus, asOf, simulated = false, changes = [] }) {
    if (!asOf || !ISO_DATE.test(String(asOf))) {
      throw new Error('DepthAgent needs an explicit asOf date (YYYY-MM-DD). "The corpus has not grown" and "nobody has looked" are different findings, and only a stated as-of date tells them apart (docs/AUDIT-2026-09-01.md F-15).');
    }
    this.tracer = tracer;
    this.store = store;
    this.corpus = corpus ?? loadCorpus();
    this.asOf = String(asOf).slice(0, 10);
    this.simulated = simulated === true;
    /* RegulatoryChange records from a Detector run, where one is
       given. They are an INPUT the brief names and they are used for
       exactly one thing — saying which gaps sit on records the world
       has recently moved — and never to invent a gap. A change is
       not an absence. */
    this.changes = Array.isArray(changes) ? changes : [];
    this.lens = buildLens({ corpus: this.corpus });
    this.seq = 0;
  }

  #now() { return isoOf(this.tracer.clock.now()); }
  #id(kind) { return `kg-${kind.replace(/_/g, '-')}-${String(++this.seq).padStart(3, '0')}`; }

  /** Validate against the contract, register in the trace, store.
   *  One way out, and no second one. */
  #ship(span, record) {
    emit(span, record, { allowSimulated: this.simulated });
    this.store.write(record);
    return record;
  }

  /* ------------------------------------------------------ one gap */

  #build(span, finding) {
    const { autonomy_class, why: autonomyWhy, escalated } = autonomyFor(finding);
    const { confidence, basis } = confidenceFor(finding);
    const gap_id = this.#id(finding.gap_kind);

    const b = new RecordBuilder({ contract: 'KnowledgeGap', agent: DEPTH_AGENT, now: this.#now(), span, simulated: this.simulated });

    for (const e of finding.entities) b.addEntity(e);

    const shown = finding.demand.slice(0, MAX_EVIDENCE);
    shown.forEach((d, i) => b.addEvidence(demandEvidence(d, i, { simulated: this.simulated })));
    const refs = shown.map((_, i) => `ev-demand-${String(i + 1).padStart(2, '0')}`);

    b.set('gap_id', gap_id);
    b.set('gap_kind', finding.gap_kind);
    b.set('absence_kind', finding.absence_kind);
    b.set('missing_concept', finding.missing_concept);
    b.set('candidate_evidence', finding.candidate_evidence);
    b.set('confidence', confidence);
    b.set('recommended_data_location', {
      dataset: finding.location.dataset,
      container: finding.location.container,
      field: finding.location.field,
      shape_exists: finding.location.shape_exists,
      why_here: finding.location.why_here,
    });
    b.set('impact', finding.impact);
    b.set('autonomy_class', autonomy_class);
    b.set('as_of', this.asOf);

    /* WHY IT MATTERS IS AN INFERENCE, AND IT SAYS SO. The absence
       itself is read off the corpus; that the absence costs a reader
       something is concluded from what the corpus does with the
       missing thing, and the method names the walk that concluded
       it. Typing this as a fact would be the failure the epistemic
       block exists to prevent. */
    b.set('why_it_matters', finding.why_it_matters);
    b.inference('missing_concept', undefined, finding.missing_concept.split('. ')[0], refs.length ? refs : [], finding.method);
    b.inference('why_it_matters', undefined,
      `${finding.demand.length} record(s) in the corpus lean on the missing concept${finding.demand.length > MAX_EVIDENCE ? `; ${MAX_EVIDENCE} are itemised in the evidence array and the count describes all of them` : ''}.`,
      refs.length ? refs : [], `Walked inbound edges in the corpus dependency graph derived by agent/detector/graph.mjs, kept the record kinds whose dependence bears on this question, and dropped wildcard edges because tools/validate.mjs treats every wildcard reference as resolving and none has ever been checked (docs/AUDIT-2026-09-01.md F-12).`);
    b.inference('impact', undefined, `The absence is weighed as ${finding.impact}.`, refs.length ? refs : [], 'Read from what the corpus itself does with the missing thing — whether a view renders less than the corpus knows, whether a reader meets a hole, or whether the absence is available to be read as a negative finding (AI-SAFE-BOUNDARIES §0.5).');
    /* These two are concluded from the gap's KIND rather than from
       its evidence, and `from` names the exact table row so a
       reviewer can open it. An inference that cited the evidence
       here would be claiming the corpus decided who may close the
       gap, which it did not — a policy document did. */
    b.inference('autonomy_class', undefined, autonomyWhy, [`agent/depth/rank.mjs#AUTONOMY_FOR_KIND.${finding.gap_kind}`], `A stated table, one row per gap kind${escalated ? ', with the one-way escalation applied where the recommended home does not exist in the schema' : ''}. Never green: closing any of these writes a legal fact.`);
    b.inference('confidence', undefined, basis, [`agent/depth/rank.mjs#CONFIDENCE_FOR_KIND.${finding.gap_kind}`], 'A stated table. Confidence is how much the finding is standing on, never how much the gap matters — that is impact, and blending the two would produce a number that is neither.');

    /* THE OPEN QUESTION EVERY GAP CARRIES. The contract refuses a gap
       with an empty unresolved array, and it is right to: this agent
       has established that the corpus does not hold the concept, and
       has established nothing whatever about what the concept's
       value is. Saying so on every record is the asterisk discipline
       applied to a machine record. */
    b.openNull(null,
      `What would the missing ${finding.gap_kind.replace(/_/g, ' ')} actually contain for ${finding.subject}?`,
      finding.candidate_evidence[0]?.kind === 'none_identified'
        ? 'Not a document. This closes with a decision about where the fact would live, and then with the verification work that would fill it. Nothing in this repository has ever retrieved a document.'
        : `A retrieved reading of ${finding.candidate_evidence[0]?.where}. This agent has established that the corpus does not hold the concept and nothing at all about what it would say. No agent in this repository has ever retrieved a document.`,
      { blocks: false });

    /* A CHANGE IS NOT AN ABSENCE, and this is the only thing change
       records are used for: noting that the world has recently moved
       under a record this gap sits on, so a reviewer knows the gap is
       being opened against a moving target. It never creates a gap
       and never raises one's impact. */
    const touching = this.changes.filter((c) => finding.entities.some((e) => e.id && (c.entity_id === e.id || c.affected_datasets?.includes(e.path))));
    if (touching.length) {
      b.inference(null, undefined,
        `${touching.length} regulatory change(s) on this run's input touch a record this gap sits on: ${touching.map((c) => c.change_id).join(', ')}.`,
        touching.map((c) => c.change_id),
        'Matched the gap\'s affected entities against the entity ids and datasets the RegulatoryChange records name. A change is not an absence: this raises no impact and creates no gap, and is recorded so a reviewer knows the gap is being opened against a record the world has recently moved.');
    }

    return this.#ship(span, b.build());
  }

  /* ------------------------------------------------------- one kind */

  #runDetector(parent, detector) {
    const span = parent.startTool({ name: `depth.${detector.kind}`, inputs: { kind: detector.kind, as_of: this.asOf } });
    try {
      const found = detector.detect(this.lens);
      const { reported, suppressed } = partition(found);

      const gaps = reported.map((f) => this.#build(span, f));

      /* WHAT WAS SET ASIDE GOES ON THE TRACE, with the reason. This
         is the observability half of "do not reward quantity": a
         reader of the trace can see that eleven instruments with no
         provisions were set aside because nothing in the corpus asks
         for one, which is a more useful sentence than eleven
         findings — and can see it rather than take it on trust. */
      if (suppressed.length) {
        span.observe({
          summary: `SET ASIDE — ${suppressed.length} ${detector.label} finding(s) not reported`,
          subject: detector.kind,
          data: { suppressed: suppressed.map((s) => ({ subject: s.subject, why: s.why })) },
          confidence: 1,
          risk: 'low',
        });
      }

      span.end({
        status: 'ok',
        outputs: { reported: gaps.length, set_aside: suppressed.length, examined: found.length },
        confidence: gaps.length ? Math.max(...gaps.map((g) => g.confidence)) : 1,
        risk: gaps.some((g) => g.impact === 'reader_could_be_misled') ? 'high' : 'low',
      });
      return { detector, gaps, suppressed, examined: found.length };
    } catch (err) {
      span.end({ status: 'failed', errors: [{ message: err.message }] });
      throw err;
    }
  }

  /* ------------------------------------------------------- the run */

  async run() {
    const run = this.tracer.startRun({ agent: DEPTH_AGENT, task: `depth analysis of the canonical corpus as at ${this.asOf}` });
    const agent = run.startAgent({ agent: DEPTH_AGENT, task: 'thirteen detectors over data/, read-only' });

    const results = [];
    for (const detector of DETECTORS) results.push(this.#runDetector(agent, detector));

    const gaps = results.flatMap((r) => r.gaps);
    const suppressed = results.flatMap((r) => r.suppressed);

    const ranked = order(
      gaps.map((g) => ({ ...g, subject: g.affected_entities[0]?.id ?? g.gap_id, weight: g.evidence.length })),
      (impact) => DEPTH_IMPACT_RANK[impact] ?? 0,
    );

    const by_kind = {};
    for (const k of DEPTH_GAP_KINDS) by_kind[k] = gaps.filter((g) => g.gap_kind === k).length;
    const by_impact = {};
    for (const g of gaps) by_impact[g.impact] = (by_impact[g.impact] ?? 0) + 1;
    const by_autonomy = {};
    for (const g of gaps) by_autonomy[g.autonomy_class] = (by_autonomy[g.autonomy_class] ?? 0) + 1;

    /* THE RANKING IS A DECISION, and it is recorded as one with the
       alternative it did not take. "Ordered by count" is the obvious
       alternative and it is the one the brief refuses; saying so on
       the trace is what makes the refusal checkable rather than a
       claim in a comment. */
    agent.decide({
      decision: 'Findings are ordered by what the absence costs a reader, then by how much of the corpus leans on it.',
      rationale: 'The brief refuses quantity. Ordering by count would put seventeen unexplained glossary concepts above two acts whose stated maximum fine nobody in the model may impose, which is the reading order that trains a reviewer to stop reading.',
      alternatives: [
        'Order by the number of records affected — rejected: that IS the quantity ranking.',
        'Order by dataset — rejected: it groups by where the fix goes rather than by what is wrong, and a reviewer with time for five findings would meet five from one file.',
        'Report every absence and let the reviewer rank — rejected: the census already exists in .agents/skills/data-completeness/scripts/gaps.mjs, and a second unranked copy of it is the second home this architecture exists to prevent.',
      ],
      risk: 'medium',
    });

    agent.observe({
      summary: `DEPTH CENSUS — ${gaps.length} gap(s) reported, ${suppressed.length} set aside, as at ${this.asOf}`,
      subject: 'data/',
      data: {
        as_of: this.asOf,
        reported: gaps.length,
        set_aside: suppressed.length,
        by_kind,
        by_impact,
        by_autonomy,
        /* Named rather than implied. A detector that found nothing is
           a result — and a reader who cannot tell "looked and found
           nothing" from "did not look" has been told nothing. */
        kinds_with_no_finding: DEPTH_GAP_KINDS.filter((k) => by_kind[k] === 0),
        corpus: { records: this.lens.graph.counts.nodes, edges: this.lens.graph.counts.edges },
      },
      confidence: 1,
      risk: (by_impact.reader_could_be_misled ?? 0) > 0 ? 'high' : 'medium',
    });

    agent.end({ status: 'ok', outputs: { gaps: gaps.length, set_aside: suppressed.length }, confidence: 1, risk: 'medium' });
    run.end({ status: 'ok', outputs: { gaps: gaps.length }, confidence: 1, risk: 'medium' });

    return {
      trace_id: run.trace_id,
      as_of: this.asOf,
      gaps,
      ranked,
      suppressed,
      by_detector: results.map((r) => ({ kind: r.detector.kind, label: r.detector.label, why: r.detector.why, reported: r.gaps.length, set_aside: r.suppressed.length, examined: r.examined })),
      by_kind,
      by_impact,
      by_autonomy,
      kinds_with_no_finding: DEPTH_GAP_KINDS.filter((k) => by_kind[k] === 0),
    };
  }
}
