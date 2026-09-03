/* ============================================================
   agent/architect/architect.mjs — the Knowledge Architecture Agent

   SESSION 13's brief: determine whether the current information
   model can adequately represent the EU digital regulatory system.
   Inspect the taxonomy, the entities, the relationships, the
   canonical datasets, the derivation logic, the comparison
   dimensions, the applicability model, the institutional model, the
   timeline, the enforcement model and the page architecture. Ask
   eight questions of them. **Output only architecture proposals.
   Never silently change schemas.**

   It is the sixth agent, not the fifth: SESSION 12 built
   `agent/proposals/data/`, the gap router, and the brief's numbering
   predates it.

   WHAT IT PRODUCES. One `ArchitectureProposal` per reported finding,
   each behind an `ApprovalRequest` in the `requested` state. No
   nineteenth contract: `ArchitectureProposal` already exists and its
   burden — modules affected, invariants touched, dependency impact,
   the three red-tier booleans, a migration, validation
   requirements, a rollback plan — is exactly the burden a change to
   the information model carries. Adding a contract because a new
   agent exists would be the second home this architecture is built
   to prevent.

   WHAT IT REFUSES.

   · It never proposes a VALUE. Every operation it writes carries a
     null `proposed`: it says a shape is wrong and what the decision
     is, and it does not draft the schema. Drafting one would be
     deciding what the corpus should be able to say about EU law.
   · It never proposes a TAXONOMY TERM. That is a `DataProposal`
     with the search that could have stopped it, and SESSION 12
     already owns it. Where a finding's answer is a word, the
     finding is routed rather than proposed.
   · It never reports what a record would close. `boundary.mjs`
     does that partitioning, and a finding a record would close is
     `agent/depth/`'s.
   · Nothing is merged and nothing is applied. There is no write
     path in this directory; the suite scans every module for one
     and hashes the whole of `data/` around a full run.

   THE REASONING IS THE DELIVERABLE, and it is on the trace. Every
   lens is a span carrying what it examined, what it found and what
   it set aside with the reason; every proposal is an artifact
   pointer; every approval is an approval event; the eight answers
   are eight observations; the ordering is a decision with the
   alternatives it did not take; and the run closes with a census
   and with the claim that nothing was merged — which the read model
   reports a gap for when it is missing.

   CROSS-AGENT LINKAGE IS NOT OPTIONAL HERE. SESSION 13's Phase 0
   existed because no CLI populated `parent_run_id` or called
   `handoff()`. This agent consumes `KnowledgeGap` records where a
   depth trace is given, and its CLI wires both — undoing that in
   the session that depended on it would be the whole point missed.
   ============================================================ */

import { isoOf } from '../observability/ids.mjs';
import { emit, handoff } from '../schemas/gateway.mjs';
import { IdMinter } from '../schemas/identity.mjs';
import { RecordBuilder } from '../verifier/build.mjs';
import { FOUR_VALIDATORS, ROLLBACK, datasetEvidence } from '../integrate/propose.mjs';
import { approvalOver } from '../integrate/propose.mjs';
import { readModel } from './model.mjs';
import { LENSES } from './lenses.mjs';
import { partition, evidenceProblems, NOT_OURS } from './boundary.mjs';

export const ARCHITECT_AGENT = 'knowledge-architect';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** How many demand entries become evidence entries on one record.
 *  The COUNT always describes the whole demand; only the itemised
 *  evidence is bounded — the trace store caps a stored string, and
 *  a count that described a truncated preview would tell its reader
 *  something false (SESSION 10, and docs/AUDIT-2026-09-01.md F-15). */
export const MAX_EVIDENCE = 10;

/** Who decides an architecture proposal. Not a person's name: the
 *  role, because the repository has one owner and the record should
 *  not carry a second copy of who that is. */
export const DECIDED_BY = 'the repository owner';

export class KnowledgeArchitect {
  /**
   * @param {{tracer:object, store:object, model?:object, corpus?:object,
   *          asOf:string, simulated?:boolean, gaps?:object[]}} opts
   *   `asOf` is mandatory, for the reason it is mandatory on every
   *   agent here: "the model has not changed" and "nobody has
   *   looked" are different findings and only a stated date
   *   separates them (docs/AUDIT-2026-09-01.md F-15).
   */
  constructor({ tracer, store, model, corpus, asOf, simulated = false, gaps = [] }) {
    if (!asOf || !ISO_DATE.test(String(asOf))) {
      throw new Error('KnowledgeArchitect needs an explicit asOf date (YYYY-MM-DD). "The model has not changed" and "nobody has looked" are different findings, and only a stated as-of date tells them apart (docs/AUDIT-2026-09-01.md F-15).');
    }
    this.tracer = tracer;
    this.store = store;
    this.asOf = String(asOf).slice(0, 10);
    this.simulated = simulated === true;
    this.model = model ?? readModel(corpus ? { corpus } : {});
    /* KnowledgeGap records from a Depth run, where one is given.
       Used for exactly one thing — saying which architecture
       findings sit on a part of the model a depth gap also names —
       and never to create a finding. A missing record is not a
       missing shape. */
    this.gaps = Array.isArray(gaps) ? gaps : [];
    this.ids = new IdMinter();
    this.refused = [];
  }

  #now() { return isoOf(this.tracer.clock.now()); }

  /** Validate against the contract, register in the trace, store.
   *  One way out, and no second one. */
  #ship(span, record, derived_from = []) {
    emit(span, record, { allowSimulated: this.simulated, derived_from });
    this.store.write(record);
    return record;
  }

  /* ------------------------------------------------ the evidence */

  /**
   * A finding's evidence: the records in the corpus that are
   * already saying something the missing shape would hold.
   *
   * `dataset_record`, every one. This agent reads the repository,
   * and the repository is not a source — `boundary.mjs` says why,
   * and `evidenceProblems` checks it rather than trusting it.
   */
  #evidenceFor(builder, finding) {
    const shown = finding.demand.slice(0, MAX_EVIDENCE);
    const refs = [];
    shown.forEach((d, i) => {
      const id = `ev-demand-${String(i + 1).padStart(2, '0')}`;
      builder.addEvidence(datasetEvidence(id, {
        path: d.dataset,
        locator: d.record_id ? `${d.record_id}${d.field ? `.${d.field}` : ''}` : (d.field ?? 'the container'),
        quote: String(d.saying).slice(0, 600),
        simulated: this.simulated,
      }));
      refs.push(id);
    });
    return refs;
  }

  /* --------------------------------------------- one proposal */

  #proposal(span, finding) {
    const b = new RecordBuilder({ contract: 'ArchitectureProposal', agent: ARCHITECT_AGENT, now: this.#now(), span, simulated: this.simulated });
    const refs = this.#evidenceFor(b, finding);
    for (const e of finding.entities) b.addEntity(e);

    const proposal_id = this.ids.mint(`prop-arch-${finding.lens.replace(/_/g, '-')}`, {
      kind: finding.lens,
      entities: finding.entities,
      subject: finding.subject,
    });

    b.set('proposal_id', proposal_id);
    b.set('reason', `${finding.missing_shape} ${finding.why_it_matters}`);
    b.set('modules_affected', [...new Set(finding.modules)].sort());
    b.set('invariants_touched', [...new Set(finding.invariants ?? [])].sort());

    /* THE THREE RED-TIER BOOLEANS. All false, and that is a claim
       about this proposal rather than a default: every operation
       below moves a fact between files that already exist, and none
       adds a package, a compile step or an origin. The contract
       forces human_only if any were true; the autonomy class below
       is human_only anyway, for a different reason. */
    b.set('introduces_dependency', false);
    b.set('introduces_build_step', false);
    b.set('introduces_third_party_request', false);
    b.set('dependency_impact', dependencyImpact(finding));

    /* STRUCTURAL CHANGE IS NEVER CLASS B (docs/AGENT-ROLES.md §4),
       and every finding here is structural by construction —
       `boundary.mjs` only reports a finding no record can close. */
    b.set('autonomy_class', 'human_only');
    b.set('risk', finding.risk ?? 'medium');
    b.set('confidence', confidenceFor(finding));

    b.set('proposed_change', {
      summary: firstSentence(finding.missing_shape),
      operations: finding.operations.map((op) => ({
        op: op.op,
        target: op.target,
        current: op.current,
        /* NULL, ALWAYS. This agent says a shape is wrong and what
           the decision is; it does not draft the schema, because
           drafting one decides what the corpus may say about EU
           law. The suite asserts every operation carries a null
           `proposed`. */
        proposed: null,
        rationale: op.rationale,
      })),
      scope_note: finding.scope_note,
    });

    b.set('validation_requirements', FOUR_VALIDATORS);
    b.set('rollback_plan', ROLLBACK(`the change to ${[...new Set(finding.modules)].join(' and ')}`));
    b.set('migration', migrationFor(finding));

    /* WHAT WAS READ, AND WHAT WAS CONCLUDED, KEPT APART. The counts
       and the shapes are read off data/ and js/ and are facts; that
       the absence costs the corpus something is an inference, and
       its method names the walk that reached it. */
    b.fact(null, true, factStatement(finding), refs.length ? refs : undefined);
    b.inference('reason', undefined, finding.why_it_matters, refs, finding.method);
    b.inference('risk', undefined, `The absence is weighed as ${finding.risk ?? 'medium'} risk if the proposal is wrong.`, refs, 'Read from what the shape currently costs the corpus — whether a fact has two homes that have already diverged, whether a renderer reads the divergent copy, and whether a reader could be shown one of two answers with nothing saying which.');
    b.interpretation('proposed_change', 'That this is a defect in the information model rather than a deliberate simplification is this agent\'s reading, and a reading is not a finding.', { held_by: ARCHITECT_AGENT, basis: 'The corpus is doing the thing the shape cannot hold, repeatedly and today. That establishes the tension; whether the tension is worth resolving is a design judgement about a production site, and it is the repository owner\'s.', contested: false });

    /* THE OPEN QUESTION EVERY PROPOSAL CARRIES. This agent has
       established that a shape cannot hold what the corpus is
       saying. It has established nothing whatever about which shape
       should replace it — and the contract refuses a record whose
       unresolved array is empty for exactly this reason. */
    b.openNull('performance_note', `What would the proposed shape for ${finding.subject} actually be?`,
      'A design decision by the repository owner. This agent measured what the current shape cannot hold; it drafted no replacement, and a schema drafted here would be an agent deciding what this site may say about EU law. Nothing was measured for performance either: no shape was built to measure.',
      { blocks: true });

    /* A depth gap on the same part of the model, where a depth run
       was given. Recorded so a reviewer knows a shape finding and a
       record finding are sitting on the same ground — never to
       raise the proposal's risk, and never to create one. */
    const touching = this.gaps.filter((g) => (g.affected_entities ?? []).some((e) => finding.modules.includes(e.path)));
    if (touching.length) {
      b.inference(null, undefined,
        `${touching.length} knowledge gap(s) from this run's input name a dataset this proposal touches: ${touching.slice(0, 8).map((g) => g.gap_id).join(', ')}${touching.length > 8 ? `, +${touching.length - 8}` : ''}.`,
        touching.slice(0, 8).map((g) => g.gap_id),
        'Matched the proposal\'s affected modules against the dataset paths the KnowledgeGap records name. A missing record is not a missing shape: this raises no risk, creates no finding, and is recorded so a reviewer can see that the two agents are looking at the same part of the corpus.');
    }

    const record = b.build();
    const problems = evidenceProblems(record.evidence);
    if (problems.length) {
      this.refused.push({ what: finding.subject, stage: 'evidence', reason: problems.join(' · ') });
      span.observe({ summary: `NO PROPOSAL — ${finding.subject} stands on evidence this agent may not use`, subject: finding.subject, data: { problems }, confidence: 1, risk: 'high' });
      return null;
    }
    return this.#ship(span, record, touching.map((g) => g.gap_id));
  }

  /* --------------------------------------------- one approval */

  #approvalFor(span, proposal, finding) {
    const b = new RecordBuilder({ contract: 'ApprovalRequest', agent: ARCHITECT_AGENT, now: this.#now(), span, simulated: this.simulated });
    b.addEvidence({
      evidence_id: 'ev-proposal', kind: 'agent_output',
      source_id: null, url: null, locator: `ArchitectureProposal ${proposal.proposal_id}`,
      title: null, publisher: null, quote: null,
      retrieved_at: proposal.created_at, checksum: null,
      supports: 'supports:direct', role: 'secondary', simulated: this.simulated,
    });
    for (const e of proposal.affected_entities) b.addEntity(e);

    approvalOver({
      builder: b,
      approval_id: this.ids.mint('appr-arch', { kind: 'approval', subject: proposal.proposal_id }),
      proposal_ids: [proposal.proposal_id],
      tier: 'red',
      requested_of: DECIDED_BY,
      why: `A change to the information model is structural, and docs/AGENT-ROLES.md §4 is that structural change is never Class B. This proposal names a shape that cannot hold what ${proposal.modules_affected.join(' and ')} already say, and it deliberately does not draft the replacement: what the corpus should be able to express about EU law is a decision about a production site with real readers.`,
      what_to_check: [
        `Read the ${proposal.evidence.length} evidence entr${proposal.evidence.length === 1 ? 'y' : 'ies'} and confirm the corpus is actually doing what they say it is. Every one is a record in this repository, quoted; none is a document, because no agent here has retrieved one.`,
        `Confirm the finding is a SHAPE and not a RECORD. If writing a value into a field that already exists would close it, it is agent/depth/'s and this proposal should be rejected as misfiled.`,
        `Decide the replacement shape. This proposal carries none — every operation's "proposed" is null on purpose.`,
        ...(proposal.invariants_touched.length ? [`It touches ${proposal.invariants_touched.join(', ')}. docs/CURRENT-ARCHITECTURE.md's closing section lists what must not be rebuilt; confirm this is not that.`] : []),
        `Confirm none of the three red-tier booleans should be true: this proposal claims it adds no dependency, no build step and no third-party request. If a replacement shape would need any of them, it is a different proposal.`,
        `Run the four validators before and after anything you apply and compare against the docs/CURRENT-ARCHITECTURE.md §12 baseline: 0 errors, 106 unverified records, 5 design-qa warnings by file and line.`,
      ],
      risk: finding.risk === 'high' ? 'high' : 'medium',
      consequence: `A wrongly approved model change moves a fact to a home that cannot hold it, or splits one that was whole, on a site that tells people what EU law requires of them. ${finding.risk === 'high' ? 'This one is weighed high because the two homes have already diverged and a renderer reads the divergent copy — a reader is being shown one of two answers today.' : 'Nothing renders differently until somebody applies a shape, and no shape is proposed here.'}`,
    });

    b.fact(null, true, `ArchitectureProposal ${proposal.proposal_id} exists, is autonomy_class "${proposal.autonomy_class}", and has not been applied.`, ['ev-proposal']);
    b.openNull(null, 'Is the shape this names actually wrong, or deliberately simple?',
      'A judgement by the repository owner. This agent established that the corpus is saying something the shape cannot hold; whether that is a defect or an accepted simplification is not something a measurement decides.',
      { blocks: true });

    return this.#ship(span, b.build(), [proposal.proposal_id]);
  }

  /* -------------------------------------------------- one lens */

  #runLens(parent, lens) {
    const span = parent.startTool({
      name: `architect.${lens.id}`,
      inputs: { question: lens.question, asks: lens.asks, as_of: this.asOf },
    });
    try {
      const { findings, examined } = lens.inspect(this.model);
      const { reported, aside } = partition(findings);

      const proposals = [];
      const approvals = [];
      for (const finding of reported) {
        const proposal = this.#proposal(span, finding);
        if (!proposal) continue;
        /* The finding carries the id of the record it became, so a
           reader never has to match one back to the other by
           guessing at its prose. */
        finding.proposal_id = proposal.proposal_id;
        proposals.push(proposal);
        const approval = this.#approvalFor(span, proposal, finding);
        finding.approval_id = approval.approval_id;
        approvals.push(approval);
      }

      /* WHAT WAS SET ASIDE GOES ON THE TRACE, with the reason and
         with the agent it belongs to. A run that reported three
         findings and silently dropped nine would have told its
         reader something false about its own coverage. */
      for (const a of aside) {
        span.observe({
          summary: `NOT REPORTED — ${a.subject}`,
          subject: a.subject,
          data: { why: a.why, route: a.route, owner: a.route ? NOT_OURS[a.route] ?? null : null },
          confidence: 1,
          risk: 'low',
        });
      }
      /* And the ones with an owner are handed to them, so a finding
         this agent cannot act on is a queue entry rather than a
         sentence in a log. */
      const routed = aside.filter((a) => a.route);
      for (const a of routed) {
        span.handoff({
          to_agent: a.route === 'data_depth' ? 'data-depth' : a.route === 'gap_router' ? 'proposal-router' : a.route,
          reason: `${a.subject}: ${a.why}`,
          artifact_ids: [],
        });
      }

      /* THE ANSWER TO THE QUESTION, as an observation. Eight
         questions were asked and eight answers are on the trace,
         whether or not any of them produced a proposal. */
      span.observe({
        summary: `Q${lens.question} — ${lens.asks} ${reported.length ? `Yes: ${reported.length} finding(s).` : 'Not on the evidence in this repository.'}`,
        subject: lens.id,
        data: {
          question: lens.question,
          asks: lens.asks,
          answer: reported.length ? 'yes' : 'no',
          examined: examined.length,
          examined_sample: examined.slice(0, 20),
          found: findings.length,
          reported: reported.length,
          set_aside: aside.length,
          subjects: reported.map((r) => r.subject),
        },
        confidence: 1,
        risk: reported.some((r) => r.risk === 'high') ? 'high' : 'low',
      });

      span.end({
        status: 'ok',
        outputs: { examined: examined.length, found: findings.length, reported: reported.length, set_aside: aside.length, proposals: proposals.length },
        confidence: 1,
        risk: reported.some((r) => r.risk === 'high') ? 'high' : 'low',
      });
      return { lens, examined, findings, reported, aside, proposals, approvals };
    } catch (err) {
      span.error(err, { fatal: false });
      span.end({ status: 'failed', outputs: null });
      throw err;
    }
  }

  /* --------------------------------------------------- the run */

  async run() {
    const run = this.tracer.startRun({
      agent: ARCHITECT_AGENT,
      task: `Can the information model represent what this corpus is already trying to say? Eight questions, as at ${this.asOf}.`,
    });
    const agent = run.startAgent({ agent: ARCHITECT_AGENT, task: 'eight lenses over data/, js/ and the pages, read-only' });

    const results = [];
    for (const lens of LENSES) results.push(this.#runLens(agent, lens));

    const proposals = results.flatMap((r) => r.proposals);
    const approvals = results.flatMap((r) => r.approvals);
    const reported = results.flatMap((r) => r.reported);
    const aside = results.flatMap((r) => r.aside);

    /* THE ORDERING IS A DECISION, recorded with what it did not
       choose. "Most findings first" is the obvious alternative and
       it is the one the brief refuses. */
    agent.decide({
      decision: 'Findings are ordered by how much of the corpus is already leaning on the missing shape, then by subject.',
      rationale: 'A shape twenty-one records are working around is a different problem from one two records are, and a reviewer with time for three proposals should meet the three that cost the most. Ordering is stable across runs so two runs over an unchanged model read the same.',
      alternatives: [
        'Order by question number — rejected: it puts the eight questions in the brief\'s order rather than the corpus\'s, and question 1 is not more important than question 7.',
        'Order by risk — rejected: risk here is what it costs if the PROPOSAL is wrong, which is not the same as what the absence costs, and blending the two produces a number that is neither.',
        'Report every structural observation and let the reviewer rank — rejected: that is the failure agent/depth/ was designed against, and boundary.mjs exists to refuse it.',
      ],
      risk: 'low',
    });

    const byQuestion = {};
    for (const r of results) {
      byQuestion[`q${r.lens.question}`] = {
        asks: r.lens.asks,
        answer: r.reported.length ? 'yes' : 'no',
        examined: r.examined.length,
        reported: r.reported.length,
        set_aside: r.aside.length,
      };
    }

    agent.observe({
      summary: `ARCHITECTURE CENSUS — ${proposals.length} proposal(s) from ${reported.length} finding(s), ${aside.length} set aside, over ${results.reduce((n, r) => n + r.examined.length, 0)} thing(s) examined, as at ${this.asOf}`,
      subject: 'the information model',
      data: {
        as_of: this.asOf,
        proposals: proposals.length,
        reported: reported.length,
        set_aside: aside.length,
        by_question: byQuestion,
        questions_answered_no: results.filter((r) => !r.reported.length).map((r) => r.lens.question),
        containers: this.model.containers.length,
        vocabularies: this.model.vocabularies.length,
        pages: this.model.pages.length,
      },
      confidence: 1,
      risk: reported.some((r) => r.risk === 'high') ? 'high' : 'medium',
    });

    /* NOTHING MERGED, and the read model reports a gap in the view
       where this observation is missing. */
    agent.observe({
      summary: `NOTHING MERGED — ${approvals.length} approval(s) emitted in the "requested" state`,
      subject: 'governance',
      data: { applied: 0, merged: 0, data_dir_written: false, schemas_changed: 0, values_proposed: 0 },
      confidence: 1,
      risk: 'low',
    });

    agent.end({ status: 'ok', outputs: { proposals: proposals.length, reported: reported.length, set_aside: aside.length }, confidence: 1, risk: 'medium' });
    run.end({ status: 'ok', outputs: { proposals: proposals.length }, confidence: 1, risk: 'medium' });

    return {
      trace_id: run.trace_id,
      run_id: run.span_id,
      as_of: this.asOf,
      proposals,
      approvals,
      reported,
      aside,
      refused: this.refused,
      by_question: byQuestion,
      by_lens: results.map((r) => ({
        id: r.lens.id, question: r.lens.question, label: r.lens.label, asks: r.lens.asks, why: r.lens.why,
        examined: r.examined.length, reported: r.reported.length, set_aside: r.aside.length,
      })),
      questions_answered_no: results.filter((r) => !r.reported.length).map((r) => r.lens.question),
    };
  }
}

/* ---------------------------------------------------------- helpers */

/** What this does to the dependency map in §9 — including "nothing",
 *  which is the honest answer for most of these. */
export function dependencyImpact(finding) {
  const js = finding.modules.filter((m) => m.startsWith('js/'));
  const data = finding.modules.filter((m) => m.startsWith('data/'));
  const pages = finding.modules.filter((m) => m.endsWith('.html'));
  const parts = [];
  if (data.length) parts.push(`${data.join(', ')} would change shape, and every module that reads ${data.length === 1 ? 'it' : 'them'} reads through js/data.js, which is the only module that fetches a dataset.`);
  if (js.length) parts.push(`${js.join(', ')} would read the fact from its new home rather than holding a copy; nothing new is imported and no module gains a dependency it did not have.`);
  if (pages.length) parts.push(`${pages.join(', ')} carries part of the fact inline; whether it keeps doing so is part of the decision.`);
  parts.push('No package, no build step and no origin is added: every file named already exists and every read stays inside this repository.');
  return parts.join(' ');
}

/** How the repository gets there without an intermediate state that
 *  is broken. Null where this agent genuinely cannot say. */
export function migrationFor(finding) {
  if (!finding.modules.some((m) => m.startsWith('data/'))) return null;
  return [
    'There is no migration until a replacement shape is decided, and this proposal deliberately proposes none.',
    'What is stateable now is the ORDER a migration would have to run in, because the intermediate state is where this kind of change breaks:',
    `1 · the new shape is added beside the old one in ${finding.modules.filter((m) => m.startsWith('data/')).join(', ')}, and both are populated — nothing reads the new one yet, and the four validators are at the docs/CURRENT-ARCHITECTURE.md §12 baseline throughout;`,
    '2 · the renderers move to the new shape one at a time, each with tools/design-qa.mjs and tools/i18n-audit.mjs green, so a half-migrated page is never published;',
    '3 · the old shape is removed only once nothing reads it, which is checkable by grep and is the step that must not be bundled with either of the first two.',
    'A correcting edit to an English string on the way through needs its i18n key declared superseded in i18n/locales.json, or the it/fr/es editions go on asserting the old shape (AGENTS.md, known hazards).',
  ].join(' ');
}

/** Confidence: how much the finding is standing on, never how much
 *  it matters. Read from the evidence, not from the judgement. */
export function confidenceFor(finding) {
  const n = finding.demand_total ?? finding.demand.length;
  /* Never 1: this agent has established that the corpus is doing
     something the shape cannot hold, and has established nothing
     about whether that is a defect. */
  if (n >= 15) return 0.9;
  if (n >= 8) return 0.85;
  if (n >= 4) return 0.8;
  return 0.7;
}

/** The statement the evidence directly establishes — what was READ,
 *  with no judgement in it. */
export function factStatement(finding) {
  const n = finding.demand_total ?? finding.demand.length;
  return `${n} record(s) in ${[...new Set(finding.modules)].join(', ')} carry what ${finding.subject} describes, read from the files as they stand on ${finding.as_of ?? 'the stated as-of date'}.`;
}

function firstSentence(text) {
  const s = String(text).split(/(?<=\.)\s+/)[0] ?? String(text);
  return s.length > 400 ? `${s.slice(0, 397)}…` : s;
}
