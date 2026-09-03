/* ============================================================
   agent/proposals/data/proposals.mjs — Agent 5, the gap router

   SESSION 12's brief: extend Data Depth so that each identified gap
   can become a structured proposal. Create agent/proposals/data/. Add
   schema validation and tests. **Do not merge any substantive
   additions automatically.** If a new taxonomy term appears
   necessary, create a taxonomy proposal rather than the term. If a
   proposed item is interpretive, route it to Editorial. If evidence is
   inadequate, route it to Verifier.

   WHAT THIS AGENT IS FOR. `agent/depth/` ends at a finding in front of
   a human — docs/DATA-DEPTH.md §12 says so as a known limitation, and
   the SESSION 11 handover names closing that loop as the next
   objective. This is the half that consumes a `KnowledgeGap`.

   WHAT IT REFUSES, AND THIS IS THE DESIGN RATHER THAN A CAVEAT.
   Closing a knowledge gap means writing the value the corpus lacks,
   and for eleven of the thirteen kinds that value is an article
   number, a date, a competence, a fine or a status — read from a
   document, and **no agent in this repository has ever retrieved
   one.** An agent that authored those proposals would be fabricating
   legal facts (§0.1) or attaching plausible substitutes (§0.2), which
   are this project's two absolute prohibitions.

   So the run answers two questions per gap and keeps them apart:

     WHO CAN ACT NEXT      the route, from a stated table
     WHAT CAN BE AUTHORED  a proposal, or a refusal with its reason

   Two routes author a proposal. Two hand the gap to somebody who can
   do what this agent cannot. One is a decision for the repository
   owner. **Nothing is merged, and nothing is applied**: every
   proposal is emitted with an ApprovalRequest in the `requested`
   state, and there is no code path in this directory that writes to
   `data/` — the suite scans every module here for one and hashes the
   whole of `data/` around a full run.

   THE REFUSALS ARE REPORTED BESIDE THE PROPOSALS, at every level: the
   route span, the census observation, the run result, the CLI and the
   viewer. A run that authored ten proposals and said nothing about the
   forty-seven gaps it could not touch would have told its reader
   something false about its own coverage — the same discipline
   `agent/depth/` applies to what it sets aside.
   ============================================================ */

import { isoOf } from '../../observability/ids.mjs';
import { emit, handoff } from '../../schemas/gateway.mjs';
import { loadCorpus } from '../../integrate/canonical.mjs';
import { RecordBuilder } from '../../verifier/build.mjs';
import { FOUR_VALIDATORS, ROLLBACK, datasetEvidence } from '../../integrate/propose.mjs';
import { AUTONOMY_TIER, GAP_ROUTES, PROPOSING_ROUTES } from '../../schemas/types.mjs';
import { routeFor, censusOf, ROUTE_FOR_KIND } from './route.mjs';
import { targetOf, noteFor, appendedTo, dispositionFor, leaningIds, NOTE_FIELD } from './annotate.mjs';
import { termNeededFor } from './taxonomy.mjs';

export const PROPOSER_AGENT = 'proposal-router';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
const arr = (x) => (Array.isArray(x) ? x : []);

/** How many of a gap's demand entries are carried onto a record here.
 *  The COUNT always describes the whole demand; only the itemised
 *  evidence is bounded, for the reason agent/depth/depth.mjs gives —
 *  the trace store caps a stored string, and a truncated payload once
 *  made a viewer show a graph of zero nodes. */
export const MAX_CARRIED_EVIDENCE = 8;

/**
 * Which DataGap kind a routed gap becomes when it reaches the
 * Verifier. A stated table: three cases, each with the reason, and
 * nothing falls through to a default.
 */
export const VERIFIER_GAP_KIND = {
  no_rule_matched: ['no_rule_matched', 'The gap is that no rule fires. DataGap\'s own rule refuses any other absence_kind for it, because where no rule matches the answer is NOT DETERMINED and never "probably not" (AI-SAFE-BOUNDARIES §0.5).'],
  no_lead: ['missing_source', 'The gap points at no document at all: its candidate evidence is "none_identified". That is DataGap\'s missing_source — the statement points at a publication nobody has located — and it is handed on saying so rather than with an invented lead.'],
  has_lead: ['coverage_gap', 'The corpus does not reach the concept at all, and the gap names somewhere to look. Not "unverified_record": that is a value recorded from general knowledge and not yet checked, and here there is no value.'],
};

export class ProposalRouter {
  /**
   * @param {{tracer:object, store:object, gaps:object[], corpus?:object,
   *          asOf:string, simulated?:boolean}} opts
   *   `asOf` is mandatory for the reason it is mandatory on the depth
   *   agent: a routing report without the date its corpus position was
   *   read as true at cannot be told from a stale one, and a proposal
   *   built against a corpus that has moved is a proposal against a
   *   record that may no longer say what it is quoted as saying
   *   (docs/AUDIT-2026-09-01.md F-15).
   */
  constructor({ tracer, store, gaps, corpus, asOf, simulated = false }) {
    if (!asOf || !ISO_DATE.test(String(asOf))) {
      throw new Error('ProposalRouter needs an explicit asOf date (YYYY-MM-DD). A proposal quotes a record verbatim, and only a stated as-of date says which version of that record it quoted (docs/AUDIT-2026-09-01.md F-15).');
    }
    const bad = arr(gaps).filter((g) => g?.contract !== 'KnowledgeGap');
    if (bad.length) {
      throw new Error(`ProposalRouter takes KnowledgeGap records and was handed ${bad.length} record(s) of another contract (${[...new Set(bad.map((g) => g?.contract ?? 'no contract'))].join(', ')}). A DataGap is about evidence and a KnowledgeGap about representation; routing one as the other would file the wrong question.`);
    }
    this.tracer = tracer;
    this.store = store;
    this.gaps = arr(gaps);
    this.corpus = corpus ?? loadCorpus();
    this.asOf = String(asOf).slice(0, 10);
    this.simulated = simulated === true;
    this.seq = { prop: 0, appr: 0, dg: 0 };
  }

  #now() { return isoOf(this.tracer.clock.now()); }
  #id(kind, bucket) { return `${kind}-${String(++this.seq[bucket]).padStart(3, '0')}`; }

  /** Validate against the contract, register in the trace, store.
   *  One way out, and no second one. */
  #ship(span, record, derived_from = []) {
    emit(span, record, { allowSimulated: this.simulated, derived_from });
    this.store.write(record);
    return record;
  }

  #builder(contract, span) {
    return new RecordBuilder({ contract, agent: PROPOSER_AGENT, now: this.#now(), span, simulated: this.simulated });
  }

  /** The gap itself, cited as another agent's output.
   *
   *  `supports:context` is deliberate and it is not a hedge: the
   *  KnowledgeGap establishes what the Data Depth Agent concluded, not
   *  what the corpus holds. What the corpus holds is carried by the
   *  dataset_record entries beside it, which are the entries a fact
   *  may cite — validate.mjs refuses a fact standing only on context,
   *  and SOURCE-POLICY §4 refuses it for the same reason. */
  #gapEvidence(gap) {
    return {
      evidence_id: 'ev-gap',
      kind: 'agent_output',
      source_id: null,
      url: null,
      locator: `KnowledgeGap ${gap.gap_id}`,
      title: null,
      publisher: null,
      quote: null,
      retrieved_at: gap.created_at ?? null,
      checksum: null,
      supports: 'supports:context',
      role: 'secondary',
      simulated: this.simulated,
    };
  }

  /** The gap's own demand evidence, carried across unchanged except
   *  for its local id. Never rewritten: an entry whose locator was
   *  edited on the way across points at something nobody checked. */
  #carriedDemand(b, gap) {
    const carried = arr(gap.evidence).filter((e) => e.kind === 'dataset_record').slice(0, MAX_CARRIED_EVIDENCE);
    carried.forEach((e, i) => b.addEvidence({ ...e, evidence_id: `ev-lean-${String(i + 1).padStart(2, '0')}` }));
    return carried.map((_, i) => `ev-lean-${String(i + 1).padStart(2, '0')}`);
  }

  /* ================================================ the annotate proposal */

  /**
   * The one edit this repository can author with an empty hand: a
   * note, on a record that already exists, stating something about
   * this corpus rather than about EU law.
   */
  #annotateProposal(span, gap, target) {
    const b = this.#builder('DataProposal', span);
    const sentence = noteFor(gap, target);
    const proposed = appendedTo(target.current, sentence);
    const disposition = dispositionFor(target.current);
    const leaning = leaningIds(gap);

    b.addEvidence(this.#gapEvidence(gap));
    b.addEvidence(datasetEvidence('ev-record', {
      path: target.dataset,
      locator: `${target.container}[${target.record_id}].${target.field}`,
      quote: target.current,
      simulated: this.simulated,
    }));
    const leanRefs = this.#carriedDemand(b, gap);

    for (const e of arr(gap.affected_entities)) b.addEntity(e);
    b.addEntity({ kind: target.record_kind, id: target.record_id, path: target.dataset, field: target.field, note: 'The field the note would be added to. No value on the record changes.' });

    const proposal_id = this.#id('prop-annotate', 'prop');
    b.set('proposal_id', proposal_id);
    b.set('dataset', target.dataset);
    b.set('record_kind', target.record_kind);
    b.set('record_id', target.record_id);
    b.set('operation_kind', 'annotate');
    b.set('existing_search', null);
    b.set('preserves_record_id', true);
    b.set('provenance_disposition', [{
      field: target.field,
      disposition,
      current: target.current,
      why: disposition === 'extended'
        ? 'The existing note is kept in full and one sentence is added after it. There is no disposition here for removing a verification note, because removing one is red tier (AI-SAFE-BOUNDARIES §3).'
        : 'The field was null: nobody had recorded anything about what is open on this record, and this sets it for the first time.',
    }]);
    b.set('verification_refs', []);
    b.set('prose_anchor', null);
    b.set('retrieved_and_read', false);
    b.set('supersedes', null);
    b.set('reason', `${gap.gap_id} established that ${gap.missing_concept.split('. ')[0]}. Nothing in data/ records it, and the finding is about this corpus rather than about EU law, so it can be written down without reading a document. Closing the gap itself cannot: that needs the value, and no agent here has retrieved a document.`);
    b.set('confidence', Math.min(gap.confidence ?? 0.9, 0.9));
    b.set('risk', 'medium');
    b.set('autonomy_class', 'review_required');
    b.set('proposed_change', {
      summary: `Add one sentence to ${target.record_id}'s ${target.field} in ${target.dataset}. No value on the record changes.`,
      operations: [{
        op: target.current ? 'modify' : 'add',
        target: `${target.dataset} ${target.container}[${target.record_id}].${target.field}`,
        current: target.current,
        proposed,
        rationale: `Every clause of the added sentence is checkable by opening a file in this repository: ${leaning.length} record(s) (${leaning.join(', ') || 'none itemised'}) reference this record, and that is read off the gap's own evidence. The sentence is composed by agent/proposals/data/annotate.mjs from ids and counts; it is not written, and the suite recomputes it.`,
      }],
      scope_note: `It adds a note and changes no value, no id, no source reference and no status. **It does not close the gap** — closing it means ${gap.candidate_evidence?.[0]?.kind === 'none_identified' ? 'a decision about where the missing fact would live, and then the verification work that fills it' : `reading ${gap.candidate_evidence?.[0]?.where}`}, and nothing in this repository has ever retrieved a document.`,
    });
    b.set('validation_requirements', FOUR_VALIDATORS);
    b.set('rollback_plan', ROLLBACK(`the note added to ${target.record_id}`));

    b.fact(null, true,
      `data/ carries ${target.record_id} in ${target.dataset}, and its ${target.field} currently reads ${JSON.stringify(target.current)}.`,
      ['ev-record']);
    b.inference('substantive', false,
      'Adding a sentence to a verification note does not change what the site states about EU law: no value, no status, no date, no article number and no source reference is touched, and the evidence grade is derived at render time by js/format.js rather than stored.',
      ['ev-record', 'ev-gap'],
      'The single operation targets one field whose purpose is to record what is still open about a record. What it DOES change is what a reader sees on evidence.html — which is why this is review_required and approval-gated rather than green.');
    b.inference(null, undefined,
      `The added sentence states that ${leaning.length} record(s) in the corpus lean on this one.`,
      leanRefs.length ? leanRefs : ['ev-gap'],
      'Composed by agent/proposals/data/annotate.mjs#noteFor from the ids and counts on the gap\'s own evidence array plus fixed English. It is a pure function of those inputs and agent/proposals/data/selftest.mjs recomputes every note a run emits, so no sentence an agent composed freely can reach a production page.');
    b.openNull(null,
      `What would the missing ${gap.gap_kind.replace(/_/g, ' ')} actually contain?`,
      'The value itself, read from a document. This proposal records that the absence exists and is load-bearing; it establishes nothing whatever about what the absent value is, and adding the note does not narrow the gap by one word.',
      { blocks: false });

    return this.#ship(span, b.build(), [gap.gap_id]);
  }

  /* ================================================ the taxonomy proposal */

  /**
   * A term proposed into the enum authority, never created.
   *
   * The class is forced to human_only by the contract itself rather
   * than by this method: data/taxonomy.json is what every other
   * dataset resolves against, its ids are never renamed, and a term
   * arriving in it is structural change.
   */
  #taxonomyProposal(span, gap, need) {
    const b = this.#builder('DataProposal', span);

    b.addEvidence(this.#gapEvidence(gap));
    b.addEvidence(datasetEvidence('ev-taxonomy', {
      path: 'data/taxonomy.json',
      locator: `${need.dimension}[] — ${need.search.candidates_considered} term(s)`,
      quote: need.considered.slice(0, 12).map((t) => `${t.id} · ${t.label ?? ''}`).join(' | '),
      simulated: this.simulated,
    }));
    const leanRefs = this.#carriedDemand(b, gap);

    for (const e of arr(gap.affected_entities)) b.addEntity(e);
    b.addEntity({ kind: 'taxonomy_term', id: need.proposed_term.id, path: 'data/taxonomy.json', field: need.dimension, note: 'The term proposed. It does not exist, and this proposal does not create it.' });

    const proposal_id = this.#id('prop-taxonomy', 'prop');
    b.set('proposal_id', proposal_id);
    b.set('dataset', 'data/taxonomy.json');
    b.set('record_kind', 'taxonomy_term');
    b.set('record_id', null);
    b.set('operation_kind', 'create_taxonomy_term');
    b.set('existing_search', need.search);
    b.set('preserves_record_id', true);
    b.set('provenance_disposition', []);
    b.set('substantive', false);
    b.set('verification_refs', []);
    b.set('prose_anchor', null);
    b.set('retrieved_and_read', false);
    b.set('supersedes', null);
    b.set('reason', `${gap.gap_id} found the corpus holding one document as two source records with no way to say so. Before any record can say it, ${need.dimension} needs a word for it, and all ${need.search.candidates_considered} of its terms characterise how two acts relate rather than whether two records are one document. The brief is explicit that a term is proposed and never silently created.`);
    b.set('confidence', 0.6);
    b.set('risk', 'high');
    b.set('autonomy_class', 'human_only');
    b.set('proposed_change', {
      summary: `Add one term to data/taxonomy.json ${need.dimension}[]: ${need.proposed_term.id}. The definition is left for the author.`,
      operations: [{
        op: 'add',
        target: `data/taxonomy.json ${need.dimension}[]`,
        current: null,
        proposed: JSON.stringify({ ...need.proposed_term, definition_ref: null, note: null }),
        rationale: `The id follows the dimension's own prefix convention, read off the terms already in it. definition_ref and note are null: a taxonomy term's definition is the site's own words about a concept, and writing those is Editorial's under docs/AGENT-ROLES.md §6.`,
      }],
      scope_note: `It proposes a word and nothing else. **It does not create the shape that would use it**: data/sources.json has no relationships[] array — data/instruments.json solves the same problem for acts and sources have no equivalent — and adding one is a separate structural decision for the repository owner. It changes no existing term, renames nothing, and attaches the word to no record.`,
    });
    b.set('validation_requirements', FOUR_VALIDATORS);
    b.set('rollback_plan', ROLLBACK(`the ${need.proposed_term.id} term`));

    b.fact(null, true,
      `data/taxonomy.json's ${need.dimension} dimension carries ${need.search.candidates_considered} term(s), and none of their ids, labels or notes contains any of ${need.decisive.map((w) => `"${w}"`).join(', ')}.`,
      ['ev-taxonomy']);
    b.inference('existing_search', undefined,
      `All ${need.search.candidates_considered} existing term(s) in ${need.dimension} were compared and none expresses the concept.`,
      ['ev-taxonomy', ...(leanRefs.length ? [leanRefs[0]] : [])],
      'Token overlap against each term\'s id, label and note ranks the candidates; a decisive-word test settles whether any of them IS the concept. The overlap score is on agent/proposals/data/taxonomy.mjs\'s own scale and is never a probability that two words mean the same thing — which is why this is human_only and why why_not_that_one is written out rather than left as a number.');
    b.inference('substantive', false,
      'A term added to the enum authority and used by no record does not change what the site states about EU law; nothing renders it until a record resolves against it.',
      ['ev-taxonomy'],
      'The operation adds one entry to one dimension array and touches no dataset that resolves against it. It is human_only regardless — the contract forces that for this operation kind, because data/taxonomy.json is what every other dataset resolves against and its ids are never renamed.');
    b.openNull(null, `What does ${need.proposed_term.id} mean, in the site's own words?`,
      'A definition written by the author. This proposal names a word the vocabulary lacks; it does not define it, and a definition composed by an agent would be the site asserting a distinction nobody wrote.',
      { blocks: true });
    b.openNull(null, 'Where would a record using this term live?',
      'A structural decision on data/sources.json, which has no relationships[] array. The term and the shape are separate decisions and are proposed separately rather than bundled.',
      { blocks: true });

    return this.#ship(span, b.build(), [gap.gap_id]);
  }

  /* ================================================ the approval */

  #approvalFor(span, proposal, gap, { what_to_check, consequence }) {
    const b = this.#builder('ApprovalRequest', span);
    const approval_id = this.#id('appr', 'appr');

    b.addEvidence({
      evidence_id: 'ev-proposal',
      kind: 'agent_output',
      source_id: null, url: null,
      locator: `DataProposal ${proposal.proposal_id}`,
      title: null, publisher: null, quote: null,
      retrieved_at: proposal.created_at, checksum: null,
      supports: 'supports:direct', role: 'secondary',
      simulated: this.simulated,
    });
    for (const e of arr(proposal.affected_entities)) b.addEntity(e);

    b.set('approval_id', approval_id);
    b.set('proposal_ids', [proposal.proposal_id]);
    b.set('tier', AUTONOMY_TIER[proposal.autonomy_class]);
    b.set('requested_of', 'the repository owner');
    b.set('why_human_required', proposal.autonomy_class === 'human_only'
      ? `${proposal.operation_kind} touches data/taxonomy.json, the enum authority every other dataset resolves against. Structural change is never Class B (docs/AGENT-ROLES.md §4), and AI-SAFE-BOUNDARIES §3 leaves an agent able to propose and nothing more.`
      : `The note would appear on a production page a reader may act on. AI-SAFE-BOUNDARIES §2 permits an agent to prepare amber work and requires a human to approve it, and there is no deploy gate here — a push to main publishes.`);
    b.set('what_to_check', what_to_check);
    b.set('risk_if_wrong', proposal.risk);
    b.set('consequence_if_wrong', consequence);
    b.set('expires_at', null);
    b.set('state', 'requested');
    b.set('decision', null);

    b.inference(null, undefined,
      `The tier follows from the proposal's autonomy class (${proposal.autonomy_class} → ${AUTONOMY_TIER[proposal.autonomy_class]}).`,
      ['ev-proposal'],
      'AUTONOMY_TIER in agent/schemas/types.mjs maps each class to its tier in docs/AI-SAFE-BOUNDARIES.md. The mapping has one home so the two cannot drift.');
    b.openNull(null, 'Has anyone decided this?',
      'A human decision. "requested" with nothing after it is pending, and pending is never treated as granted — the observability layer\'s approval view exists to make an unapproved change that looks approved impossible to miss.',
      { blocks: true });

    return this.#ship(span, b.build(), [proposal.proposal_id, gap.gap_id]);
  }

  /* ================================================ the verifier handoff */

  /**
   * The gap, restated as the evidence question it actually is.
   *
   * A KnowledgeGap is about REPRESENTATION and a DataGap about
   * EVIDENCE — the registry says so and the two are the pair most
   * easily confused here. This is not a conversion of one into the
   * other: it is the sub-question the routing established, which is
   * an evidence question, filed on the contract whose whole purpose is
   * "what would close it: the publication to find".
   */
  #verifierGap(span, gap) {
    const b = this.#builder('DataGap', span);
    const lead = gap.candidate_evidence?.[0] ?? null;
    const noLead = !lead || lead.kind === 'none_identified';
    const key = gap.absence_kind === 'no_rule_matched' ? 'no_rule_matched' : (noLead ? 'no_lead' : 'has_lead');
    const [gap_kind, whyKind] = VERIFIER_GAP_KIND[key];

    b.addEvidence(this.#gapEvidence(gap));
    const leanRefs = this.#carriedDemand(b, gap);
    for (const e of arr(gap.affected_entities)) b.addEntity(e);

    const gap_id = this.#id('dg-from-depth', 'dg');
    b.set('gap_id', gap_id);
    b.set('gap_kind', gap_kind);
    b.set('absence_kind', gap.absence_kind);
    b.set('what_is_missing', gap.missing_concept);
    b.set('why_open', `${gap.why_it_matters} It is open here because closing it means writing a value read from a document, and no agent in this repository has ever retrieved one — the blocking dependency every agent here has carried since SESSION 05.`);
    b.set('closes_with', noLead
      ? 'Nothing this repository can name. The corpus offers nowhere to look, and a lead invented to fill this field would be the substitute prohibition (AI-SAFE-BOUNDARIES §0.2) arriving through a side door. What would close it is a decision about where the fact would live, and then the retrieval and reading that fills it.'
      : `Retrieving and reading ${lead.where}. ${lead.what_it_would_establish}`);
    b.set('candidate_leads', arr(gap.candidate_evidence)
      .filter((c) => c.kind !== 'none_identified')
      .map((c) => `${c.kind}: ${c.where} — ${c.what_it_would_establish}`));
    /* Blocking where the absence is available to be read as a
       negative finding. §0.5 names that as the single most damaging
       thing this tool could do, and a gap that could produce it is
       one nothing downstream should build on. */
    b.set('blocking', gap.impact === 'reader_could_be_misled');
    b.set('first_seen_at', gap.as_of);
    b.set('last_reviewed_at', null);
    b.set('state', 'open');
    b.set('closed_by', null);

    b.inference('gap_kind', undefined, whyKind,
      ['ev-gap', ...(leanRefs.length ? [leanRefs[0]] : [])],
      'A stated table in agent/proposals/data/proposals.mjs — VERIFIER_GAP_KIND, three cases each with its reason, and no fall-through to a default.');
    b.openNull(null, `What does the absent ${gap.gap_kind.replace(/_/g, ' ')} for ${arr(gap.affected_entities).map((e) => e.id ?? e.path).filter(Boolean).join(', ') || 'this record'} actually contain?`,
      noLead
        ? 'A document nobody has identified. This record carries no lead rather than an invented one.'
        : `A retrieved reading of ${lead.where}. The routing established that the value cannot be written without it; it established nothing about what the value is.`,
      { blocks: gap.impact === 'reader_could_be_misled' });

    /* Uncertainty survives the handoff at full strength (docs/AGENT-ROLES.md H2).
       The gap's own open questions are carried rather than summarised. */
    for (const u of arr(gap.epistemic?.unresolved)) {
      b.openNull(null, u.question, u.missing, { blocks: false });
    }

    return b.build();
  }

  /* ================================================ the run */

  async run() {
    const run = this.tracer.startRun({ agent: PROPOSER_AGENT, task: `route ${this.gaps.length} knowledge gap(s) as at ${this.asOf}` });
    const agent = run.startAgent({ agent: PROPOSER_AGENT, task: 'one route per gap; author only what asserts nothing about EU law' });

    /* ---- 1 · route every gap. Pure, and decided before anything is
            authored, so the routing cannot be influenced by whether a
            proposal turned out to be convenient to build. */
    const routed = this.gaps.map((gap) => {
      const target = targetOf(gap, this.corpus);
      return { gap, target, ...routeFor(gap, target) };
    });

    agent.decide({
      decision: 'Each gap is routed by its kind, from a stated table, and only two of the five routes author a proposal here.',
      rationale: 'Closing a knowledge gap means writing the value the corpus lacks. For eleven of the thirteen kinds that value is an article number, a date, a competence, a fine or a status, read from a document — and nothing in this repository has ever retrieved one. An agent that authored those proposals would be fabricating a legal fact or attaching a plausible substitute, which are this project\'s two absolute prohibitions.',
      alternatives: [
        'Author a DataProposal for every gap, leaving the value blank for a human to fill — rejected: a proposal whose operation has no proposed value is not a proposal, and one with a value nobody read is a fabrication. There is no third option.',
        'Infer the missing value from the corpus and propose it for review — rejected: review is not a substitute for retrieval, and a plausible value that looks resolved is worse than an admitted gap (AI-SAFE-BOUNDARIES §0.2).',
        'Route everything to the Verifier and author nothing — rejected: it is honest and it throws away the findings that CAN be recorded today, which are facts about this corpus rather than about EU law.',
        'Create the taxonomy term the corpus needs and let the validators catch it — rejected: the brief refuses it by name, and data/taxonomy.json is what every other dataset resolves against.',
      ],
      confidence: 1,
      risk: 'high',
    });

    /* ---- 2 · one span per route. A route nothing took still appears:
            a reader who cannot tell "nothing routed here" from "this
            route was not considered" has been told nothing. */
    const out = { proposals: [], approvals: [], data_gaps: [], refusals: [], handoffs: 0 };
    const byRoute = [];

    for (const route of GAP_ROUTES) {
      const group = routed.filter((r) => r.route === route);
      const span = agent.startTool({ name: `propose.${route}`, inputs: { route, gaps: group.length, as_of: this.asOf } });
      const made = { proposals: 0, approvals: 0, data_gaps: 0, refused: 0 };
      try {
        for (const r of group) {
          if (route === 'data_proposal') {
            const p = this.#annotateProposal(span, r.gap, r.target);
            const a = this.#approvalFor(span, p, r.gap, {
              what_to_check: [
                `Open ${r.target.dataset} at ${r.target.record_id} and confirm its ${r.target.field} still reads exactly what the operation records as "current". The corpus was read as at ${this.asOf}.`,
                `Read the proposed sentence and confirm every clause in it is checkable in this repository: the record ids it names exist, and each of them references ${r.target.record_id}.`,
                'Confirm the sentence states nothing about EU law — no date, no article number, no figure, no status, no legal conclusion.',
                'Decide whether this note belongs on a page a reader acts on, or whether the finding should stay in the agent layer.',
                `Run all four validators and compare against the docs/CURRENT-ARCHITECTURE.md §12 baseline — 0 errors, 106 unverified, the same five design-qa warnings by file and line.`,
              ],
              consequence: `A reader of ${r.target.dataset === 'data/claims.json' ? 'evidence.html' : 'enforcement.html'} would see a sentence about this record that is wrong about this corpus. It asserts nothing about EU law, so the failure is a false statement about the site rather than about the acquis — but it is on a production page and there is no deploy gate.`,
            });
            out.proposals.push(p); out.approvals.push(a);
            made.proposals++; made.approvals++;
            r.authored = [p.proposal_id, a.approval_id];
          } else if (route === 'taxonomy_proposal') {
            const need = termNeededFor(r.gap);
            if (!need.necessary) {
              /* The outcome that matters most: the search found a
                 word, so no term is proposed. A search that could
                 never come back empty-handed is not a search. */
              const why = `no term proposed: ${need.why}`;
              span.observe({ summary: `NO PROPOSAL — ${r.gap.gap_id}`, subject: r.gap.gap_id, data: { route, why }, confidence: 1, risk: 'low' });
              out.refusals.push({ gap_id: r.gap.gap_id, gap_kind: r.gap.gap_kind, route, why });
              made.refused++;
              r.refused = why;
              continue;
            }
            const p = this.#taxonomyProposal(span, r.gap, need);
            const a = this.#approvalFor(span, p, r.gap, {
              what_to_check: [
                `Open data/taxonomy.json at ${need.dimension} and confirm none of its ${need.search.candidates_considered} terms already expresses "${need.wanted}". The search compared ids, labels and notes; it did not compare intent.`,
                `Decide the term's id and label. The proposal offers ${need.proposed_term.id}; ids in data/taxonomy.json are never renamed, so this is the one chance to choose it.`,
                'Write the definition, or decide the term does not need one. No definition is proposed — that is the site\'s own words about a concept.',
                'Decide separately whether data/sources.json should gain a relationships[] array. The term is useless without it and the two are deliberately not bundled.',
                'Run all four validators; a new enum term that no record uses should move nothing.',
              ],
              consequence: 'data/taxonomy.json is the enum authority every other dataset resolves against. A term added here that duplicates an existing distinction gives that distinction a second home, and two homes for a fact can disagree — which is the failure this whole architecture is built against.',
            });
            out.proposals.push(p); out.approvals.push(a);
            made.proposals++; made.approvals++;
            r.authored = [p.proposal_id, a.approval_id];
          } else if (route === 'verifier') {
            const dg = this.#verifierGap(span, r.gap);
            this.store.write(dg);
            handoff(span, {
              to_agent: 'legal-verifier',
              records: [dg],
              reason: `${r.gap.gap_id} cannot become a proposal here: ${r.why} The evidence question is on ${dg.gap_id}, and its open questions are carried at full strength rather than summarised (docs/AGENT-ROLES.md H2).`,
              allowSimulated: this.simulated,
            });
            out.data_gaps.push(dg);
            made.data_gaps++; out.handoffs++;
            r.authored = [dg.gap_id];
          } else if (route === 'editorial') {
            /* NOTHING IS AUTHORED, and that is the finding. An
               EditorialProposal's operations would have to carry the
               prose, and the prose is the argument — which is the
               author's. A refusal is a valid deliverable and is
               passed on intact (docs/AGENT-ROLES.md H6). */
            handoff(span, {
              to_agent: 'editorial',
              records: [r.gap],
              reason: `${r.gap.gap_id} is interpretive: ${r.why} No proposal is authored here — an EditorialProposal's operations would have to carry the sentence, and the sentence is the argument.`,
              allowSimulated: this.simulated,
            });
            out.refusals.push({ gap_id: r.gap.gap_id, gap_kind: r.gap.gap_kind, route, why: r.why });
            made.refused++; out.handoffs++;
            r.refused = r.why;
          } else {
            span.observe({
              summary: `NO PROPOSAL — ${r.gap.gap_id} is a decision for the repository owner`,
              subject: r.gap.gap_id,
              data: { route, why: r.why, overrides: r.overrides },
              confidence: 1,
              risk: 'medium',
            });
            out.refusals.push({ gap_id: r.gap.gap_id, gap_kind: r.gap.gap_kind, route, why: r.why });
            made.refused++;
            r.refused = r.why;
          }
        }
        span.end({
          status: 'ok',
          outputs: { gaps: group.length, ...made },
          confidence: 1,
          risk: route === 'owner_decision' || route === 'taxonomy_proposal' ? 'high' : 'medium',
        });
      } catch (err) {
        span.end({ status: 'failed', errors: [{ message: err.message }] });
        throw err;
      }
      byRoute.push({ route, gaps: group.length, ...made, why_kinds: [...new Set(group.map((r) => r.gap.gap_kind))] });
    }

    const by_route = censusOf(routed);
    const by_kind_route = {};
    for (const r of routed) {
      by_kind_route[r.gap.gap_kind] ??= {};
      by_kind_route[r.gap.gap_kind][r.route] = (by_kind_route[r.gap.gap_kind][r.route] ?? 0) + 1;
    }

    agent.observe({
      summary: `PROPOSAL CENSUS — ${out.proposals.length} proposal(s) authored, ${out.refusals.length} gap(s) not proposable here, ${this.gaps.length} routed, as at ${this.asOf}`,
      subject: 'data/',
      data: {
        as_of: this.asOf,
        routed: this.gaps.length,
        proposals: out.proposals.length,
        approvals: out.approvals.length,
        data_gaps: out.data_gaps.length,
        refusals: out.refusals.length,
        by_route,
        by_kind_route,
        /* Named rather than implied, like agent/depth/'s kinds with no
           finding: a route nothing took is a result. */
        routes_with_no_gap: GAP_ROUTES.filter((r) => by_route[r] === 0),
        proposing_routes: PROPOSING_ROUTES,
        merged: 0,
        applied: 0,
      },
      confidence: 1,
      risk: 'medium',
    });

    /* The sentence the whole session turns on, on the trace rather
       than only in a README: every approval is pending, and pending
       is never granted. */
    agent.observe({
      summary: `NOTHING MERGED — ${out.approvals.length} approval(s) emitted in the "requested" state and no proposal applied`,
      subject: 'governance',
      data: { approvals_pending: out.approvals.length, applied: 0, data_dir_written: false },
      confidence: 1,
      risk: 'low',
    });

    agent.end({ status: 'ok', outputs: { proposals: out.proposals.length, refusals: out.refusals.length, handoffs: out.handoffs }, confidence: 1, risk: 'medium' });
    run.end({ status: 'ok', outputs: { proposals: out.proposals.length }, confidence: 1, risk: 'medium' });

    return {
      trace_id: run.trace_id,
      as_of: this.asOf,
      routed,
      by_route,
      by_kind_route,
      by_route_detail: byRoute,
      routes_with_no_gap: GAP_ROUTES.filter((r) => by_route[r] === 0),
      route_table: ROUTE_FOR_KIND,
      ...out,
    };
  }
}
