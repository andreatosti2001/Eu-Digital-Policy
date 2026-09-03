/* ============================================================
   agent/ux/auditor.mjs — the UX/UI Audit Agent

   SESSION 16's brief: study the site, its tokens, its navigation,
   its interaction patterns, its responsive behaviour, its evidence,
   comparison, search, glossary, applicability and localisation
   surfaces, and the design QA rules that already exist. Classify
   what is found into seven kinds. Give every finding a problem,
   evidence, an affected journey, a severity, a recommended change
   and a success criterion. Instrument it. Produce a prioritised
   backlog. **The agent observes and proposes. It does not redesign
   the website in this session.**

   IT IS THE EIGHTH AGENT, NOT THE SEVENTH. The brief calls it Agent
   7; Agent 7 is the Editorial Agent, built in SESSION 14. The
   numbering in the brief predates it, the same way SESSION 13's did,
   and the discrepancy is recorded rather than resolved by
   renumbering somebody else.

   WHAT IT PRODUCES. One `UXProposal` per reported finding, kind
   `finding`, each behind an `ApprovalRequest` in the `requested`
   state. No nineteenth contract: `UXProposal` has existed since
   SESSION 03 and had been produced by nothing — exactly where
   `EditorialProposal` stood before SESSION 14 — and it gained five
   fields, each because a rule had to be written against it. The
   reasoning is in the contract's own header.

   WHAT IT REFUSES.

   · IT NEVER DRAFTS A VALUE. Every operation on every finding
     carries a null `proposed`, and the contract refuses a
     `finding` that does not. It names what is wrong and what the
     decision is; choosing the glyph, the label, the breakpoint or
     the wording would be redesigning a production site, which is
     the thing this session's brief says not to do.
   · IT NEVER CLAIMS AN OBSERVATION NOBODY MADE. There is no
     browser here and no screen reader has ever been run against
     this site. Every record carries README limitation 7 as a
     blocking open question, quoted rather than paraphrased, and
     `boundary.unverifiablePhrasing` refuses a finding written as
     though somebody had looked at a rendered page.
   · IT NEVER RE-REPORTS ANOTHER AGENT'S FINDING. A missing record
     is `agent/depth/`'s, a missing shape is `agent/architect/`'s,
     a stale sentence is `agent/proposals/editorial/`'s, and a
     structural defect in the markup is already `tools/design-qa.mjs`'s.
     `boundary.mjs` partitions on that and nothing here may skip it.
   · NOTHING IS APPLIED AND NOTHING IS RESTYLED. There is no write
     path in this directory; the suite scans every module for one,
     and the CLI hashes every page, every stylesheet and the whole
     of `data/` around a full run.

   THE REASONING IS THE DELIVERABLE, and it is on the trace. Every
   lens is a span carrying what it examined, what it found and what
   it set aside with the reason; every severity carries the steps
   that produced it; every proposal is an artifact pointer; every
   approval is an approval event; the ordering is a decision with the
   alternatives it did not take; and the run closes with a census and
   with the claim that nothing was restyled — which the read model
   reports a gap for when it is missing.
   ============================================================ */

import { isoOf } from '../observability/ids.mjs';
import { emit } from '../schemas/gateway.mjs';
import { IdMinter } from '../schemas/identity.mjs';
import { RecordBuilder } from '../verifier/build.mjs';
import { FOUR_VALIDATORS, ROLLBACK, approvalOver } from '../integrate/propose.mjs';
import { readSurface } from './surface.mjs';
import { journeysOf, journeyFor, journeyRecord } from './journeys.mjs';
import { LENSES } from './lenses.mjs';
import { partition, evidenceProblems, NOT_OURS } from './boundary.mjs';
import { severityOf, backlogOf, confidenceOf, isHighPriority } from './severity.mjs';
import { proposalsFor } from './proposals.mjs';

export const UX_AGENT = 'ux-auditor';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** How many evidence extracts become entries on one record. The
 *  COUNT always describes the whole finding; only the itemised
 *  evidence is bounded, because the trace store caps a stored string
 *  and a count describing a truncated preview tells its reader
 *  something false (SESSION 10, and docs/AUDIT-2026-09-01.md F-15). */
export const MAX_EVIDENCE = 8;

/** Who decides a UX proposal. The role, not a name: the repository
 *  has one owner and a record should not carry a second copy of who
 *  that is. */
export const DECIDED_BY = 'the repository owner';

/**
 * The four validators, with this agent's reason for each.
 *
 * The BASELINE each is measured against is imported rather than
 * restated — `agent/integrate/propose.mjs` owns those numbers and a
 * second copy here would be a second home for the §12 baseline. Only
 * `why` differs, because what a validator would catch about an
 * INTERFACE change is not what it would catch about a data one: for
 * a data proposal i18n-audit proves the change touched no prose, and
 * for an interface change it is the check most likely to fail.
 */
export const UX_VALIDATORS = FOUR_VALIDATORS.map((v) => ({
  ...v,
  why: {
    'node tools/validate.mjs': 'An interface change should move nothing in data/. If the unverified count or any referential check moves, the change was not an interface change.',
    'node tools/i18n-audit.mjs': 'THE ONE MOST LIKELY TO FAIL HERE. Any edit to a string carrying a data-i18n key leaves the it/fr/es editions asserting the superseded English unless the key is declared superseded in i18n/locales.json. AGENTS.md lists this among the known hazards because it has already happened once.',
    'node tools/design-qa.mjs': 'It fails on a third-party resource, on a page-local <style> block, on a theme-dependent token declared at :root, and on an undeclared custom property — four of the ways an interface change goes wrong here. The five recorded warnings are the baseline; a sixth is a finding.',
    'node tools/freshness.mjs': 'An interface change should move no freshness figure at all. If one moves, something set a verification date it had no business setting.',
  }[v.command] ?? v.why,
}));

/** An evidence entry for something read out of a file in this
 *  repository. `repository_file` is the kind the schema already
 *  carries for exactly this and nothing had ever produced one. */
export const fileEvidence = (id, { file, line, quote, note, simulated }) => ({
  evidence_id: id,
  kind: 'repository_file',
  source_id: null,
  url: null,
  locator: `${file}:${line}`,
  title: null,
  publisher: null,
  quote: quote ?? null,
  retrieved_at: null,
  checksum: null,
  /* It directly establishes what the FILE says, which is the only
     thing it was read for. It establishes nothing whatever about
     what a reader experiences, and no record here cites it for
     that. */
  supports: 'supports:direct',
  role: 'primary',
  simulated,
});

/** Something this run counted, over a named set of files. Not a
 *  quote, and the locator says what was counted rather than where a
 *  string is. */
export const measurementEvidence = (id, { over, statement, simulated }) => ({
  evidence_id: id,
  kind: 'measurement',
  source_id: null,
  url: null,
  locator: `counted over ${over}`,
  title: null,
  publisher: null,
  quote: statement,
  retrieved_at: null,
  checksum: null,
  supports: 'supports:direct',
  role: 'primary',
  simulated,
});

export class UXAuditor {
  /**
   * @param {{tracer:object, store:object, surface?:object, asOf:string,
   *          simulated?:boolean, propose?:boolean}} opts
   *   `asOf` is mandatory for the reason it is mandatory on every
   *   agent here: "the interface has not changed" and "nobody has
   *   looked" are different findings, and only a stated date
   *   separates them (docs/AUDIT-2026-09-01.md F-15).
   *   `propose` turns on SESSION 17 — a testable proposal for every
   *   high-priority finding, and for nothing else.
   */
  constructor({ tracer, store, surface, asOf, simulated = false, propose = false }) {
    if (!asOf || !ISO_DATE.test(String(asOf))) {
      throw new Error('UXAuditor needs an explicit asOf date (YYYY-MM-DD). "The interface has not changed" and "nobody has looked" are different findings, and only a stated as-of date tells them apart (docs/AUDIT-2026-09-01.md F-15).');
    }
    this.tracer = tracer;
    this.store = store;
    this.asOf = String(asOf).slice(0, 10);
    this.simulated = simulated === true;
    this.propose = propose === true;
    this.surface = surface ?? readSurface();
    this.journeys = journeysOf(this.surface);
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

  /* ------------------------------------------------- the open question
     every record carries */

  /** README limitation 7, quoted, on every record this agent emits.
   *  It BLOCKS, because a finding about an interface that nobody has
   *  opened is exactly as good as its source reading and no better,
   *  and the reviewer needs to be told that before they act on it. */
  #limitation(builder) {
    const lim = this.surface.readme_limitation;
    builder.openNull(null,
      'How does this actually behave for a reader using a screen reader, a phone, or a browser other than Chromium?',
      lim
        ? `Nothing here opened a page. The project states the position itself, at ${lim.path}:${lim.line} — "${lim.quote}" — and this run adds no coverage to it: every finding above is read out of the source files. What would close this is somebody doing the pass in .agents/skills/ux-audit/references/manual-checks.md.`
        : 'Nothing here opened a page: every finding above is read out of the source files, and no screen reader, browser or device was involved.',
      { blocks: true });

    /* AND CONTRAST, SEPARATELY, because it is separately claimable
       and the contract already refuses a record that says contrast
       was not checked without saying so out loud. css/tokens.css
       carries measured ratios in its comments — "gold is 3.47 in day
       mode and cinnabar 3.86" — taken by whoever wrote them. Reading
       one out of a comment and presenting it as this run's
       measurement would be the most persuasive fabrication available
       to this agent, so it computes none and says so. */
    builder.openNull(null,
      'What is the actual contrast ratio of anything this finding touches, in each theme?',
      'Not computed. This agent resolves no custom property, composites no surface and measures no ratio; css/tokens.css records ratios its author measured, and quoting one of those as this run\'s measurement would be a fabricated measurement. What would close it is somebody computing the ratios against the rendered palette.',
      { blocks: false });
    return builder;
  }

  /* ------------------------------------------------------- the evidence */

  #evidenceFor(builder, finding) {
    const shown = (finding.evidence ?? []).slice(0, MAX_EVIDENCE);
    const refs = [];
    shown.forEach((e, i) => {
      const id = `ev-${String(i + 1).padStart(2, '0')}`;
      /* A COUNT IS NOT A QUOTE. "no page links to this one" is not a
         string in any file; it is something this run counted, and
         dressing it as a quoted extract behind a real file:line would
         be a fabricated quote with a checkable-looking locator on it.
         `measurement` is the schema's kind for it and nothing had
         ever produced one. */
      builder.addEvidence(e.measured
        ? measurementEvidence(id, { over: e.locator, statement: e.quote, simulated: this.simulated })
        : fileEvidence(id, { file: e.file, line: e.line, quote: e.quote, note: e.note, simulated: this.simulated }));
      refs.push(id);
    });
    return refs;
  }

  /* ----------------------------------------------------- one finding */

  #finding(span, finding) {
    const b = new RecordBuilder({ contract: 'UXProposal', agent: UX_AGENT, now: this.#now(), span, simulated: this.simulated });
    const refs = this.#evidenceFor(b, finding);

    for (const page of finding.pages ?? []) b.addEntity({ kind: 'page', id: null, path: page, field: null, note: null });
    for (const mod of finding.modules ?? []) b.addEntity({ kind: 'module', id: null, path: mod, field: null, note: null });
    for (const file of uniqueFiles(finding)) {
      if (/\.css$/.test(file)) b.addEntity({ kind: 'stylesheet', id: null, path: file, field: null, note: null });
    }

    const proposal_id = this.ids.mint(`prop-ux-${finding.lens.replace(/_/g, '-')}`, {
      kind: finding.lens,
      entities: [...(finding.pages ?? []), ...(finding.modules ?? []), ...(finding.components ?? [])],
      subject: finding.subject,
    });

    b.set('proposal_id', proposal_id);
    b.set('reason', `${finding.problem} ${finding.why_it_matters}`);

    /* --------------------------------------------- SESSION 16's five */
    b.set('proposal_kind', 'finding');
    b.set('finding_class', finding.finding_class);
    b.set('affected_journey', journeyRecord(finding.journey, finding.journey_why));
    b.set('success_criterion', finding.success_criterion);

    /* --------------------------------------------- SESSION 17's, empty */
    b.set('hypothesis', null);
    b.set('success_metrics', []);
    b.set('regression_risks', []);
    b.set('accessibility_checks', []);
    b.set('browser_tests', []);
    b.set('tokens_used', finding.tokens_used ?? []);

    b.set('pages', finding.pages ?? []);
    b.set('components', finding.components ?? []);
    b.set('tokens_added', []);
    /* A FINDING NEVER PROPOSES A HUE, so it never proposes one alone.
       False is a claim about this record rather than a default: no
       operation below carries a value at all. */
    b.set('status_conveyed_by_hue_alone', false);
    b.set('adds_third_party_asset', false);
    b.set('accessibility', {
      keyboard_reachable: false,
      accessible_name: false,
      /* FOUR FALSE BOOLEANS, and every one of them is the honest
         answer. This agent verified nothing about a rendered page:
         it read files. The contract deliberately refuses a single
         `accessible: true`, and this is why. */
      contrast_checked: false,
      screen_reader_checked: false,
      note: `Nothing was verified about a rendered page. This finding is read out of ${uniqueFiles(finding).join(', ')} and asserts what those files contain, not what a reader meets. No contrast was computed: css/tokens.css carries measured ratios in its comments, taken by whoever wrote them, and reading one out of a comment and presenting it as this run's measurement would be a fabricated measurement.`,
    });
    b.set('motion_note', null);

    b.set('proposed_change', {
      summary: firstSentence(finding.recommendation),
      operations: (finding.operations ?? []).map((op) => ({
        op: op.op,
        target: op.target,
        current: op.current ?? null,
        /* NULL, ALWAYS. SESSION 16: the agent observes and proposes,
           and does not redesign the website. The contract refuses a
           `finding` whose operation carries a value, and the suite
           asserts it over every record a full run produces. */
        proposed: null,
        rationale: op.rationale,
      })),
      scope_note: finding.scope_note,
    });

    b.set('validation_requirements', UX_VALIDATORS);
    b.set('rollback_plan', ROLLBACK(`the change to ${uniqueFiles(finding).join(' and ')}`));

    /* A FINDING ABOUT A PRODUCTION SITE'S INTERFACE IS DECIDED BY A
       PERSON. Every one of these needs a design judgement — which
       glyph, which words, which breakpoint — and this agent
       deliberately supplies none of them. */
    b.set('autonomy_class', 'human_only');
    b.set('risk', riskOf(finding));
    b.set('confidence', confidenceOf(finding));

    /* WHAT WAS READ AND WHAT WAS CONCLUDED, KEPT APART. That the
       files contain what the evidence quotes is a fact. That a
       reader is worse off for it is an inference, and its method
       names the walk that reached it. That the arrangement is a
       defect rather than a deliberate simplification is an
       interpretation, and it is attributed. */
    b.fact(null, true, factStatement(finding), refs.length ? refs : undefined);
    b.inference('reason', undefined, finding.why_it_matters, refs, finding.method);
    b.inference('severity', finding.severity, severityStatement(finding), refs,
      `agent/ux/severity.mjs, from the finding's class, the stake of the journey it sits on and how many surfaces carry it: ${(finding.severity_steps ?? []).map((s) => `${s.step} → ${s.to}`).join(', ')}.`);
    b.interpretation('proposed_change', 'That this is a defect rather than a deliberate decision is this agent\'s reading, and a reading is not a finding.', {
      held_by: UX_AGENT,
      basis: 'The files contain what the evidence quotes, and this repository states the rule the arrangement departs from in its own documents. Whether the departure was intended, and whether it is worth changing on a production site with real readers, is a design judgement and it is the repository owner\'s.',
      contested: false,
    });

    this.#limitation(b);

    const record = b.build();
    const problems = evidenceProblems(record.evidence);
    if (problems.length) {
      this.refused.push({ what: finding.subject, stage: 'evidence', reason: problems.join(' · ') });
      span.observe({ summary: `NO FINDING — ${finding.subject} stands on evidence this agent may not use`, subject: finding.subject, data: { problems }, confidence: 1, risk: 'high' });
      return null;
    }
    return this.#ship(span, record, []);
  }

  /* ---------------------------------------------------- one approval */

  #approvalFor(span, proposal, finding) {
    const b = new RecordBuilder({ contract: 'ApprovalRequest', agent: UX_AGENT, now: this.#now(), span, simulated: this.simulated });
    b.addEvidence({
      evidence_id: 'ev-proposal', kind: 'agent_output',
      source_id: null, url: null, locator: `UXProposal ${proposal.proposal_id}`,
      title: null, publisher: null, quote: null,
      retrieved_at: proposal.created_at, checksum: null,
      supports: 'supports:direct', role: 'secondary', simulated: this.simulated,
    });
    for (const e of proposal.affected_entities) b.addEntity(e);

    const testable = proposal.proposal_kind === 'testable_proposal';
    approvalOver({
      builder: b,
      approval_id: this.ids.mint(`appr-ux${testable ? '-prop' : ''}`, { kind: 'approval', subject: proposal.proposal_id }),
      proposal_ids: [proposal.proposal_id],
      /* Amber where the change is confined to adding a check nobody
         reads; red everywhere a reader would see the difference —
         which is nearly everywhere, because that is what an
         interface is. */
      tier: proposal.autonomy_class === 'review_required' ? 'amber' : 'red',
      requested_of: DECIDED_BY,
      why: testable
        ? `A testable proposal names a concrete change to a production site's interface and the tests that would prove it. It is still a proposal: nothing here has been applied, and the change would be visible to every reader of ${proposal.pages.join(', ')}.`
        : `This is a ${proposal.severity} ${proposal.finding_class.replace(/_/g, ' ')} on the "${proposal.affected_journey.label}" journey. It deliberately drafts nothing: every operation's "proposed" is null, because choosing the glyph, the wording or the width is a design decision about a site people read to find out what EU law requires of them.`,
      what_to_check: [
        `Read the ${proposal.evidence.length} quoted extract(s) and confirm the files say what they are quoted as saying. Every one is a file in this repository at a line; none is a document, because no agent here has retrieved one.`,
        `Confirm this is an INTERFACE finding. If the answer is a missing record it is agent/depth/'s, if it is a missing shape it is agent/architect/'s, and if it is a sentence it is agent/proposals/editorial/'s — and this proposal should be rejected as misfiled.`,
        `NOTHING OPENED A PAGE. The accessibility block on this record is four falses and a note saying so. Before acting on it, do the relevant part of the pass in .agents/skills/ux-audit/references/manual-checks.md — a defect this agent read out of a stylesheet may look different in a browser, and a defect a browser would show may not be in the stylesheet at all.`,
        ...(testable
          ? [
            `Check the ${proposal.browser_tests.length} browser test(s) can actually be run here. This repository has no browser harness and no dependency budget for one; a test whose harness is null is a test somebody performs by hand.`,
            `Check that every token named in tokens_used is one the design system already declares. agent/ux/tokens.mjs refuses a proposal that names one it does not, and SESSION 17's rule is that a proposal uses the existing design system.`,
          ]
          : [`Decide the change. This finding carries none: every operation's "proposed" is null on purpose, and the recommendation names a direction rather than a value.`]),
        `Run the four validators before and after anything you apply and compare against the docs/CURRENT-ARCHITECTURE.md §12 baseline: 0 errors, 106 unverified records, 5 design-qa warnings by file and line. tools/i18n-audit.mjs is the one most likely to move — an edit to a string carrying a data-i18n key leaves three locale editions asserting the superseded English unless the key is declared superseded.`,
      ],
      risk: proposal.risk === 'critical' ? 'high' : proposal.risk,
      consequence: proposal.severity === 'critical'
        ? 'This one is weighed highest because a reader can take an absence of knowledge for a negative finding — the failure this whole project exists to prevent. A wrong fix here would leave that in place while looking resolved, which is worse than the defect.'
        : `A wrongly approved interface change is visible to every reader of ${proposal.pages.join(', ')} the moment it is pushed: this repository has no deploy gate, and a push to main publishes. Nothing renders differently until somebody applies a change, and this record proposes ${testable ? 'one that is deliberately the smallest coherent version of it' : 'no value at all'}.`,
    });

    b.fact(null, true, `UXProposal ${proposal.proposal_id} exists, is autonomy_class "${proposal.autonomy_class}", severity "${proposal.severity}", and has not been applied.`, ['ev-proposal']);
    this.#limitation(b);
    b.openNull(null, `Is this actually worth changing on a production site?`,
      'A judgement by the repository owner. This agent established what the files contain and which rule the arrangement departs from; whether the departure matters more than the risk of touching a page people read to find out what the law requires of them is not something a measurement decides.',
      { blocks: true });

    return this.#ship(span, b.build(), [proposal.proposal_id]);
  }

  /* --------------------------------------------------------- one lens */

  #runLens(parent, lens) {
    const span = parent.startTool({
      name: `ux.${lens.id}`,
      inputs: { question: lens.question, asks: lens.asks, as_of: this.asOf },
    });
    try {
      const { findings, examined, questions } = lens.inspect(this.surface);
      const { reported, aside } = partition(findings, { designQa: this.surface.design_qa });

      /* THE JOURNEY AND THE SEVERITY, DERIVED, before anything is
         built. Both are on the finding by the time a record is
         written, so the record and the backlog cannot disagree about
         which journey a defect sits on. */
      const dressed = reported.map((f) => {
        const { journey, also_reaches } = journeyFor(this.journeys, { pages: f.pages ?? [], modules: f.modules ?? [] });
        const stake = journey?.stake ?? 'navigation';
        const sev = severityOf({ ...f, stake });
        return {
          ...f,
          journey: journey ?? fallbackJourney(this.surface),
          journey_why: journey
            ? `${journey.why ?? `The journey runs through ${journey.pages.join(', ')}, and this finding is in ${uniqueFiles(f).join(', ')}.`}${also_reaches.length ? ` It also reaches ${also_reaches.join(', ')}, filed here because this is the journey where a reader can come away with a belief about what the law requires of them.` : ''}`
            : 'No journey in the nav model runs through the files this finding names; it is filed against the site as a whole.',
          also_reaches,
          stake,
          severity: sev.severity,
          severity_steps: sev.steps,
          severity_gated: sev.gated,
        };
      });

      const proposals = [];
      const approvals = [];
      for (const finding of dressed) {
        const record = this.#finding(span, finding);
        if (!record) continue;
        finding.proposal_id = record.proposal_id;
        proposals.push(record);
        const approval = this.#approvalFor(span, record, finding);
        finding.approval_id = approval.approval_id;
        approvals.push(approval);
      }

      /* WHAT WAS SET ASIDE GOES ON THE TRACE, with the reason and
         the agent it belongs to. Ten lenses over 1,600 CSS rules will
         notice a great deal, and a run that reported eight things and
         silently dropped ninety would have told its reader something
         false about its own coverage. */
      for (const a of aside) {
        span.observe({
          summary: `NOT REPORTED — ${a.subject}`,
          subject: a.subject,
          data: { why: a.why, route: a.route, owner: a.route ? NOT_OURS[a.route] ?? null : null },
          confidence: 1,
          risk: 'low',
        });
      }
      for (const a of aside.filter((x) => x.route)) {
        span.handoff({
          to_agent: routeAgent(a.route),
          reason: `${a.subject}: ${a.why}`,
          artifact_ids: [],
        });
      }

      /* AN OPEN QUESTION IS A DELIVERABLE, and this agent produces
         more of them than findings. Each carries the bytes it read
         and states what would close it, so "could not be settled
         from the source" is checkable rather than a shrug. */
      for (const q of questions) {
        span.observe({
          summary: `OPEN QUESTION — ${q.subject}`,
          subject: q.subject,
          data: {
            lens: lens.id,
            question: q.question,
            missing: q.missing,
            evidence: (q.evidence ?? []).slice(0, 4).map((e) => ({ locator: e.locator, quote: e.quote })),
          },
          confidence: 1,
          risk: 'low',
        });
      }

      span.observe({
        summary: `Q${lens.question} — ${lens.asks} ${dressed.length ? `Yes: ${dressed.length} finding(s).` : 'Not on the evidence in these files.'}`,
        subject: lens.id,
        data: {
          question: lens.question,
          asks: lens.asks,
          answer: dressed.length ? 'yes' : 'no',
          examined: examined.length,
          examined_sample: examined.slice(0, 12),
          found: findings.length,
          reported: dressed.length,
          set_aside: aside.length,
          open_questions: questions.length,
          by_class: countBy(dressed, (f) => f.finding_class),
          by_severity: countBy(dressed, (f) => f.severity),
          subjects: dressed.map((f) => f.subject),
        },
        confidence: 1,
        risk: dressed.some((f) => f.severity === 'critical') ? 'high' : dressed.length ? 'medium' : 'low',
      });

      span.end({
        status: 'ok',
        outputs: { examined: examined.length, found: findings.length, reported: dressed.length, set_aside: aside.length, open_questions: questions.length, findings: proposals.length },
        confidence: 1,
        risk: dressed.some((f) => f.severity === 'critical') ? 'high' : 'low',
      });
      return { lens, examined, questions, reported: dressed, aside, proposals, approvals };
    } catch (err) {
      span.error(err, { fatal: false });
      span.end({ status: 'failed', outputs: null });
      throw err;
    }
  }

  /* ------------------------------------------------------------ the run */

  async run() {
    const run = this.tracer.startRun({
      agent: UX_AGENT,
      task: `What does this interface do to a reader that nothing in tools/ can see? Ten questions, as at ${this.asOf}.`,
    });
    const agent = run.startAgent({ agent: UX_AGENT, task: 'ten lenses over the pages, the stylesheets and the modules, read-only' });

    const results = [];
    for (const lens of LENSES) results.push(this.#runLens(agent, lens));

    const reported = results.flatMap((r) => r.reported);
    const proposals = results.flatMap((r) => r.proposals);
    const approvals = results.flatMap((r) => r.approvals);
    const aside = results.flatMap((r) => r.aside);
    const questions = results.flatMap((r) => r.questions.map((q) => ({ ...q, lens: r.lens.id })));

    /* THE BACKLOG. Derived here and stored on no record —
       `UXProposal.forbidden.priority` says why: a stored position is
       a second home for the ordering, and the day somebody re-runs
       the audit the two disagree. */
    const backlog = backlogOf(reported);

    agent.decide({
      decision: 'The backlog is ordered by severity, then by the stake of the journey the finding sits on, then by how much the finding is standing on, then by subject.',
      rationale: 'Severity is itself derived — from the finding\'s class, the journey\'s stake and how many surfaces carry it, with one gate that outranks all three: an absence of knowledge that a reader can take for a negative finding is critical whatever else it is. The tie-breakers are there so the order is total: two runs over an unchanged site produce the same backlog, and a diff between two runs means something. The rank is not written onto any record.',
      alternatives: [
        'Order by how cheap each fix looks — rejected: this agent drafts no fix, so it has no basis for an estimate, and an invented one would order the backlog by a number nobody measured.',
        'Order by how many surfaces carry it — rejected: a defect on eight pages is not eight times worse than the same defect on one, and it would put every shared-stylesheet finding above every defect on the applicability tool.',
        'Order by the order the lenses ran — rejected: that is the brief\'s order for the questions, which is not a ranking of the answers.',
        'Store the rank on each proposal — rejected: the contract forbids a priority field, because a stored position is a second home for an ordering that is derived, and the two disagree the moment anything is re-run.',
      ],
      risk: 'low',
    });

    /* -------------------------------------------------- SESSION 17 */
    let testable = [];
    let testableApprovals = [];
    let refusedProposals = [];
    let answers = [];
    if (this.propose) {
      const span = agent.startTool({
        name: 'ux.proposals',
        inputs: { as_of: this.asOf, high_priority: backlog.filter(isHighPriority).length, of: backlog.length },
      });
      try {
        const out = proposalsFor({
          span,
          backlog,
          surface: this.surface,
          agent: this,
        });
        testable = out.proposals;
        testableApprovals = out.approvals;
        refusedProposals = out.refused;
        answers = out.answers;
        span.end({ status: 'ok', outputs: { eligible: out.eligible, proposals: testable.length, refused: refusedProposals.length }, confidence: 1, risk: 'medium' });
      } catch (err) {
        span.error(err, { fatal: false });
        span.end({ status: 'failed', outputs: null });
        throw err;
      }
    }

    const byQuestion = {};
    for (const r of results) {
      byQuestion[`q${r.lens.question}`] = {
        asks: r.lens.asks,
        answer: r.reported.length ? 'yes' : 'no',
        examined: r.examined.length,
        reported: r.reported.length,
        set_aside: r.aside.length,
        open_questions: r.questions.length,
      };
    }

    agent.observe({
      summary: `UX CENSUS — ${proposals.length} finding(s) and ${questions.length} open question(s) over ${results.reduce((n, r) => n + r.examined.length, 0)} thing(s) examined, as at ${this.asOf}`,
      subject: 'the interface',
      data: {
        as_of: this.asOf,
        findings: proposals.length,
        open_questions: questions.length,
        set_aside: aside.length,
        by_class: countBy(reported, (f) => f.finding_class),
        by_severity: countBy(reported, (f) => f.severity),
        by_journey: countBy(reported, (f) => f.journey.id),
        by_question: byQuestion,
        questions_answered_no: results.filter((r) => !r.reported.length).map((r) => r.lens.question),
        pages: this.surface.pages.length,
        stylesheets: this.surface.sheets.length,
        modules: this.surface.modules.length,
        css_rules: this.surface.sheets.reduce((n, s) => n + s.rules.length, 0),
        journeys: this.journeys.length,
        testable_proposals: testable.length,
        high_priority: backlog.filter(isHighPriority).length,
      },
      confidence: 1,
      risk: reported.some((f) => f.severity === 'critical') ? 'high' : 'medium',
    });

    /* THE BACKLOG, ON THE TRACE, as the deliverable rather than as a
       CLI table nobody keeps. */
    agent.observe({
      summary: `UX BACKLOG — ${backlog.length} finding(s), ${backlog.filter(isHighPriority).length} at critical or high`,
      subject: 'the backlog',
      data: {
        as_of: this.asOf,
        entries: backlog.map((f) => ({
          rank: f.rank,
          proposal_id: f.proposal_id ?? null,
          severity: f.severity,
          finding_class: f.finding_class,
          journey: f.journey.id,
          stake: f.stake,
          subject: f.subject,
          success_criterion: f.success_criterion,
          high_priority: isHighPriority(f),
          /* The testable proposal this finding became, where SESSION
             17 was asked for and a recipe existed. Null is a real
             answer: it means either that the finding is below the
             line or that no recipe was recorded for its lens, and the
             trace carries a NO PROPOSAL observation saying which. */
          proposal_id_testable: answers.find((a) => a.finding_id === f.proposal_id)?.proposal_id ?? null,
        })),
      },
      confidence: 1,
      risk: 'medium',
    });

    /* NOTHING RESTYLED. The read model reports a gap in the view
       where this observation is missing, and a run claiming to have
       changed a stylesheet is a run that has done the one thing this
       agent exists not to do. */
    agent.observe({
      summary: `NOTHING RESTYLED — ${approvals.length + testableApprovals.length} approval(s) emitted in the "requested" state`,
      subject: 'governance',
      data: {
        applied: 0,
        merged: 0,
        stylesheets_written: 0,
        pages_written: 0,
        data_dir_written: false,
        tokens_invented: 0,
        values_drafted: testable.length ? countDrafted(testable) : 0,
        pages_opened: 0,
        screen_readers_run: 0,
      },
      confidence: 1,
      risk: 'low',
    });

    agent.end({ status: 'ok', outputs: { findings: proposals.length, open_questions: questions.length, testable: testable.length }, confidence: 1, risk: 'medium' });
    run.end({ status: 'ok', outputs: { findings: proposals.length }, confidence: 1, risk: 'medium' });

    return {
      trace_id: run.trace_id,
      run_id: run.span_id,
      as_of: this.asOf,
      proposals,
      approvals,
      reported,
      backlog,
      questions,
      aside,
      refused: [...this.refused, ...refusedProposals],
      testable,
      testable_approvals: testableApprovals,
      answers,
      journeys: this.journeys,
      by_question: byQuestion,
      by_lens: results.map((r) => ({
        id: r.lens.id, question: r.lens.question, label: r.lens.label, asks: r.lens.asks, why: r.lens.why,
        examined: r.examined.length, reported: r.reported.length, set_aside: r.aside.length, open_questions: r.questions.length,
      })),
      questions_answered_no: results.filter((r) => !r.reported.length).map((r) => r.lens.question),
    };
  }

  /* Used by proposals.mjs, which builds records of the same shape
     through the same gate rather than assembling its own. */
  get context() {
    return {
      now: () => this.#now(),
      ship: (span, record, from) => this.#ship(span, record, from),
      limitation: (builder) => this.#limitation(builder),
      evidenceFor: (builder, finding) => this.#evidenceFor(builder, finding),
      approvalFor: (span, proposal, finding) => this.#approvalFor(span, proposal, finding),
      ids: this.ids,
      simulated: this.simulated,
      asOf: this.asOf,
      validators: UX_VALIDATORS,
    };
  }
}

/* ---------------------------------------------------------- helpers */

const uniq = (xs) => [...new Set(xs)];

export function uniqueFiles(finding) {
  return uniq([...(finding.evidence ?? []).map((e) => e.file)]).sort();
}

export function countBy(xs, key) {
  const out = {};
  for (const x of xs) { const k = key(x); out[k] = (out[k] ?? 0) + 1; }
  return out;
}

/** How many operations across a set of records carry a value. Zero
 *  for a finding, by contract; reported for a testable proposal so
 *  the census says what was drafted rather than implying nothing
 *  ever is. */
export function countDrafted(records) {
  return records.reduce((n, r) => n + (r.proposed_change?.operations ?? []).filter((o) => o.proposed !== null).length, 0);
}

/** What it costs if THIS FINDING is wrong — not how bad the defect
 *  is, which is severity. The two are different axes and blending
 *  them produces a number that is neither. */
export function riskOf(finding) {
  if (finding.finding_class === 'enhancement') return 'low';
  /* A wrong finding sends somebody to change a production site for
     no reason. On a journey where a reader decides what applies to
     them, that change is the expensive kind. */
  return finding.stake === 'legal_consequence' ? 'medium' : 'low';
}

export function severityStatement(finding) {
  return `Severity ${finding.severity}: a ${finding.finding_class.replace(/_/g, ' ')} on the "${finding.journey.label}" journey, carried by ${finding.spread ?? 1} surface(s)${finding.severity_gated ? ', and a reader can take an absence of knowledge for a negative finding, which outranks everything else in the model' : ''}.`;
}

export function factStatement(finding) {
  const files = uniqueFiles(finding);
  return `${(finding.evidence ?? []).length} extract(s) read from ${files.join(', ')} on ${finding.as_of ?? 'the stated as-of date'} contain what this finding quotes them as containing. Nothing was rendered, opened or measured in a browser.`;
}

/** The journey a finding falls back to when the nav model has none
 *  that covers its files. Never invented: it is the site itself. */
export function fallbackJourney(surface) {
  return {
    id: 'the_site',
    label: 'Use this site at all.',
    pages: surface.pages.map((p) => p.page),
    stake: 'navigation',
    order: 999,
  };
}

const ROUTE_AGENT = {
  data_depth: 'data-depth',
  architect: 'knowledge-architect',
  editorial: 'editorial',
  design_qa: 'design-qa',
  legal_verifier: 'legal-verifier',
};
export const routeAgent = (route) => ROUTE_AGENT[route] ?? route;

function firstSentence(text) {
  const s = String(text).split(/(?<=\.)\s+/)[0] ?? String(text);
  return s.length > 400 ? `${s.slice(0, 397)}…` : s;
}
