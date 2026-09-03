/* ============================================================
   agent/proposals/editorial/editorial.mjs — Agent 7, the Editorial
   Agent

   SESSION 14: build the Editorial Agent. It may receive only
   verified inputs. It produces three kinds of proposal — factual
   update, analytical update, editorial recommendation — of which
   only the first may be drafted automatically. Every material
   factual sentence must retain its provenance. It must never
   fabricate a citation. It drafts into `agent/proposals/editorial/`
   and does not touch production HTML.

   SESSION 15: where a verified change affects an existing entity,
   search the affected pages, find the statements that depend on it,
   distinguish CERTAIN CONTRADICTION from POSSIBLE STALENESS, propose
   a correction only where one is justified, flag the analytical
   passages for a human, preserve the caveats, and explain the cases
   that need no change at all.

   IT IS THE SEVENTH AGENT. Scout, Verifier, Integrator, Detector,
   Data Depth, the gap router and the Knowledge Architect came
   before it; `docs/AGENT-ROLES.md` §6 has described the role since
   SESSION 01 and nothing has filled it until now.

   ------------------------------------------------------------
   THE FOUR THINGS IT REFUSES, AND EACH IS A MECHANISM RATHER THAN
   A PROMISE.

   1 IT WRITES NO SENTENCE. The only text it composes is a
     substitution of one verified value for another inside a
     sentence that already exists, and `drafts.mjs` proves the
     arithmetic. Everything else carries a null `proposed`, and the
     contract refuses a record that does otherwise.

   2 IT NEVER REWRITES AN ARGUMENT. An analytical passage whose
     factual premise moved is flagged, with what moved and where.
     `staleness.mjs`'s table throws at module load if any row ever
     routes an argument to a correction.

   3 IT FABRICATES NO CITATION. Every evidence entry it mints is a
     `repository_file`, a `dataset_record` or an `agent_output` —
     the page, the claim record, the verified input. A
     `retrieved_document` entry may only be CARRIED ACROSS from the
     verification that read the document, byte for byte, and
     `evidenceProblems()` refuses a run that minted one.

   4 IT WRITES NOTHING TO THE SITE. There is no write call to any
     page, any dataset or any locale file in this directory; the
     suite scans for one and a full run hashes `data/` and every
     `*.html` before and after.

   ------------------------------------------------------------
   WHAT IS ON THE TRACE, because the reasoning is the deliverable:

     span editorial.intake     what was admitted, what was refused
                               and why — one observation per refusal
     span editorial.prose      how much prose was read, in how many
                               homes, and how much of it carries
                               provenance at all
     span editorial.site       the findings that need no input: the
                               two homes disagreeing, the markup and
                               the data disagreeing about what a
                               passage is, and prose reading as
                               settled law over evidence that cannot
                               carry it
     span editorial.change.*   one per verified change: what it
                               reached, at what strength, and what
                               became of each block
     a decision                the triage, with the alternatives it
                               did not take
     observations              one per no-change explanation, and one
                               per open question
     a census, and NOTHING APPLIED
   ============================================================ */

import { isoOf } from '../../observability/ids.mjs';
import { emit, handoff } from '../../schemas/gateway.mjs';
import { IdMinter } from '../../schemas/identity.mjs';
import { RecordBuilder } from '../../verifier/build.mjs';
import { FOUR_VALIDATORS, ROLLBACK, datasetEvidence, approvalOver } from '../../integrate/propose.mjs';
import { graph as sharedGraph } from '../../detector/graph.mjs';
import { readProse } from './prose.mjs';
import { registerOf, STATE_GLOSS, ANALYTICAL_STATES } from './register.mjs';
import { intake, correctable, ADMISSIBLE } from './intake.mjs';
import { needlesFor, reachOf, triage, TRIAGE, change_entity, monthNames } from './staleness.mjs';
import { substitute, caveatsIn, i18nDispositionsFor, keysOf } from './drafts.mjs';

export const EDITORIAL_AGENT = 'editorial';

/** Who decides an editorial proposal. The role, not a name: the
 *  repository has one owner and a record should not carry a second
 *  copy of who that is. */
export const DECIDED_BY = 'the repository owner';

/** How many evidence entries one record itemises. The COUNT always
 *  describes the whole finding; only the itemised evidence is
 *  bounded, because the trace store caps a stored string and a
 *  count describing a truncated preview tells its reader something
 *  false (SESSION 10; docs/AUDIT-2026-09-01.md F-15). */
export const MAX_EVIDENCE = 8;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Evidence kinds this agent is allowed to MINT.
 *
 * `retrieved_document` is absent on purpose and its absence is the
 * central refusal of this module: no agent in this repository has
 * ever fetched a document, and an editorial agent minting a
 * citation would be the fabrication prohibition (§0.1) arriving
 * through the one door nothing else guards — a sentence a reader
 * reads.
 */
export const MINTABLE_EVIDENCE = ['repository_file', 'dataset_record', 'agent_output', 'measurement', 'absent'];

/**
 * Refuse a record whose evidence this agent had no business
 * minting. Called on every record before it ships, and a failure is
 * a refusal rather than an exception: the finding is reported and
 * the record is not.
 */
export function evidenceProblems(evidence, carried = new Set()) {
  const out = [];
  for (const e of evidence ?? []) {
    if (MINTABLE_EVIDENCE.includes(e.kind)) continue;
    if (e.kind === 'retrieved_document' && carried.has(e.evidence_id)) continue;
    out.push(`evidence "${e.evidence_id}" is kind "${e.kind}", which this agent may not mint. A citation reaches a record here only by being carried across from the verification that actually read the document.`);
  }
  return out;
}

/** The page or dataset a block lives in, as evidence. */
const proseEvidence = (id, block, { simulated }) => ({
  evidence_id: id,
  kind: 'repository_file',
  source_id: null,
  url: null,
  locator: `${block.file}:${block.line} ${block.anchor}`,
  title: null,
  publisher: null,
  quote: String(block.text).slice(0, 900),
  retrieved_at: null,
  checksum: null,
  /* It directly establishes what the sentence currently says, which
     is the only thing it was read for. It establishes nothing
     whatever about EU law and no fact here cites it for that. */
  supports: 'supports:direct',
  role: 'primary',
  simulated,
});

/** A verified input, cited as another agent's output rather than as
 *  the document behind it. `supports:context` is deliberate: the
 *  record establishes what the upstream agent concluded, never what
 *  the document says. */
const inputEvidence = (id, record, { simulated }) => ({
  evidence_id: id,
  kind: 'agent_output',
  source_id: null,
  url: null,
  locator: `${record.contract} ${record.change_id ?? record.verification_id ?? record.assessment_id}`,
  title: null,
  publisher: null,
  quote: null,
  retrieved_at: record.detected_at ?? record.checked_at ?? record.assessed_at ?? null,
  checksum: null,
  supports: 'supports:context',
  role: 'secondary',
  simulated,
});

export class EditorialAgent {
  /**
   * @param {{tracer:object, store:object, corpus:object, asOf:string,
   *          inputs?:object[], simulated?:boolean, root?:string}} opts
   *   `asOf` is mandatory, for the reason it is mandatory on every
   *   agent here: "the prose has not gone stale" and "nobody has
   *   looked" are different findings, and only a stated date tells
   *   them apart (docs/AUDIT-2026-09-01.md F-15).
   */
  constructor({ tracer, store, corpus, asOf, inputs = [], simulated = false, root = undefined }) {
    if (!asOf || !ISO_DATE.test(String(asOf))) {
      throw new Error('EditorialAgent needs an explicit asOf date (YYYY-MM-DD). "The prose has not gone stale" and "nobody has looked" are different findings, and only a stated as-of date separates them (docs/AUDIT-2026-09-01.md F-15).');
    }
    this.tracer = tracer;
    this.store = store;
    this.corpus = corpus;
    this.asOf = String(asOf).slice(0, 10);
    this.simulated = simulated === true;
    this.root = root;
    this.inputs = Array.isArray(inputs) ? inputs : [];
    this.ids = new IdMinter();
    this.refused = [];
  }

  #now() { return isoOf(this.tracer.clock.now()); }

  #builder(contract, span) {
    return new RecordBuilder({ contract, agent: EDITORIAL_AGENT, now: this.#now(), span, simulated: this.simulated });
  }

  /** Validate against the contract, register in the trace, store.
   *  One way out, and no second one. */
  #ship(span, record, derived_from = []) {
    const problems = evidenceProblems(record.evidence);
    if (problems.length) {
      this.refused.push({ what: record.proposal_id ?? record.observation_id ?? record.approval_id, stage: 'evidence', why: problems.join(' · ') });
      span.observe({ summary: 'NOT PROPOSED — the record stands on evidence this agent may not mint', subject: record.proposal_id ?? null, data: { problems }, confidence: 1, risk: 'high' });
      return null;
    }
    emit(span, record, { allowSimulated: this.simulated, derived_from });
    this.store.write(record);
    return record;
  }

  /* ------------------------------------------------ one proposal */

  /**
   * One EditorialProposal, of whichever of the three kinds the
   * triage decided.
   *
   * @param {object} f  a finding: { block, state, why, kind, staleness,
   *                    operations, reason, risk, confidence, scope_note,
   *                    input, subject }
   */
  #proposal(span, f) {
    const b = this.#builder('EditorialProposal', span);
    const drafting = f.kind === 'factual_update';

    const refs = [];
    b.addEvidence(proseEvidence('ev-prose', f.block, { simulated: this.simulated }));
    refs.push('ev-prose');
    for (const [i, cid] of (f.block.claim_ids ?? []).slice(0, MAX_EVIDENCE).entries()) {
      const claim = this.corpus.claimById.get(cid);
      if (!claim) continue;
      const id = `ev-claim-${String(i + 1).padStart(2, '0')}`;
      b.addEvidence(datasetEvidence(id, {
        path: 'data/claims.json', locator: claim.id,
        quote: `${claim.type} — ${String(claim.statement).slice(0, 500)}`,
        simulated: this.simulated,
      }));
      refs.push(id);
    }
    if (f.input) {
      b.addEvidence(inputEvidence('ev-input', f.input, { simulated: this.simulated }));
      refs.push('ev-input');
    }

    /* THE ANCHOR IS THE ID, not the field. `identity.mjs` derives a
       record's id from `kind:id:path` and deliberately excludes
       `field`, because rewording a description must not mint a new
       node — but for a block of prose the anchor IS the thing, not a
       description of it. Two blocks of the __CONTENT__ blob with the
       anchor in `field` minted one id and two findings became one
       node; measured, not imagined. */
    b.addEntity({
      kind: 'prose', id: f.block.anchor, path: f.block.file,
      field: f.block.i18n_key ? 'data-i18n' : null,
      note: `${f.block.tag ? `<${f.block.tag}>` : f.block.home} at line ${f.block.line} · ${f.block.words} words · editorial state ${f.state}`,
    });
    for (const cid of f.block.claim_ids ?? []) {
      b.addEntity({ kind: 'claim', id: cid, path: 'data/claims.json', field: null, note: 'The claim record this sentence is a view of.' });
    }
    if (f.block.i18n_key) {
      b.addEntity({ kind: 'i18n_key', id: f.block.i18n_key, path: 'i18n/locales.json', field: null, note: 'Three locale editions translate this key.' });
    }

    const proposal_id = this.ids.mint(`prop-ed-${f.kind.replace(/_/g, '-')}`, {
      kind: f.kind,
      entities: b.entities,
      subject: f.subject,
      /* THE DISCRIMINATOR NAMES WHAT ACTUALLY DIFFERS. Two changes
         to the same attribute of the same record — a status
         corrected and the same status amended — reach the same
         sentence and are not the same finding: they carry different
         values and a reviewer decides them separately. Without the
         values in the key both minted one id and two proposals
         became one node, which is exactly the silent merge
         identity.mjs's IdMinter exists to make loud. */
      discriminator: f.discriminator ?? f.staleness?.kind ?? null,
    });

    b.set('proposal_id', proposal_id);
    b.set('proposal_kind', f.kind);
    b.set('reason', f.reason);
    b.set('confidence', f.confidence);
    b.set('risk', f.risk);

    /* AUTONOMY. A factual update over a sentence a claim record is
       attached to is amber — an agent may prepare it and a human
       approves it (AI-SAFE-BOUNDARIES §2, and the contract refuses
       "autonomous" outright). Everything else here is red: an
       analytical passage and an editorial recommendation are the
       author's argument, and an agent may only propose. */
    b.set('autonomy_class', drafting ? 'review_required' : 'human_only');

    /* The red-tier flag. FALSE, and it is a claim rather than a
       default: a substitution of one verified value for another
       leaves the claim asserting the same proposition about the
       same records, and nothing else this agent produces changes a
       sentence at all. Where that is not true the finding is not
       drafted, so the flag and the drafting cannot come apart. */
    b.set('changes_what_a_claim_asserts', false);

    /* BOTH HOMES OF THE PROSE. Checked rather than promised — and
       what differs is reported and never reconciled, because the
       drift is the author's decision. */
    b.set('content_blob_checked', true);
    b.set('content_blob_divergence', f.divergence ?? null);

    b.set('prose_locations', [{
      file: f.block.file,
      anchor: `${f.block.anchor} (line ${f.block.line})`,
      part_id: f.block.part_id ?? null,
      home: f.block.home,
    }]);
    b.set('claim_ids_affected', [...(f.block.claim_ids ?? [])]);
    b.set('i18n_dispositions', keysOf(f.block).flatMap((k) => i18nDispositionsFor(k, this.root ? { root: this.root } : {})));
    b.set('caveats_preserved', caveatsIn(f.block.text));

    b.set('proposed_change', {
      summary: f.summary,
      operations: f.operations,
      scope_note: f.scope_note,
    });
    b.set('validation_requirements', PROSE_VALIDATORS);
    b.set('rollback_plan', ROLLBACK(`the edit to ${f.block.file} at ${f.block.anchor}`));

    b.set('staleness', f.staleness);

    /* THE REGISTER NOTE IS COMPOSED, NOT WRITTEN. Fixed English
       plus what the record already knows — the same discipline
       `agent/proposals/data/annotate.mjs` holds itself to, and for
       the same reason: there is no path by which a sentence an
       agent composed freely reaches a page. */
    b.set('register_note', drafting
      ? `The brief's register is declarative, unhedged where the evidence is solid and explicitly hedged where it is not. This operation substitutes one value for another and leaves every other word, including ${caveatsIn(f.block.text).length} caveat marker(s), exactly as the author wrote them. It does not soften, sharpen or restructure anything.`
      : `Nothing is drafted, so nothing is written in any register. The brief's register is the author's, and the contract has no field for adjusting it.`);

    /* WHAT WAS READ AND WHAT WAS CONCLUDED, KEPT APART. The sentence
       and the claim record are facts, read from files and quoted.
       Which of the four states the sentence is in is an INFERENCE,
       and its method is the derivation js/format.js already
       performs. That the sentence should change at all is an
       INTERPRETATION, attributed. */
    b.fact(null, true, `${f.block.file} at ${f.block.anchor} currently reads as quoted in ev-prose.`, ['ev-prose']);
    b.inference('editorial_state', f.state, `The block is ${f.state.toUpperCase()}. ${STATE_GLOSS[f.state]}`, refs, f.why);
    if (f.staleness) {
      b.inference('staleness', undefined, f.staleness.why, refs, f.staleness.how);
    } else {
      b.inference('staleness', undefined,
        'No verified change reaches this block: the finding is about the site disagreeing with itself, not about something that moved outside it.',
        refs, 'Read from the site\'s own files — the two homes of a string, the box label against the claim type, the absence of a hedge over an unresolved grade.');
    }
    b.interpretation('proposed_change', f.interpretation.statement, {
      held_by: EDITORIAL_AGENT, basis: f.interpretation.basis, contested: f.interpretation.contested === true,
    });
    b.interpretation('register_note', drafting
      ? 'That a substitution leaves the sentence in the register the author wrote it in is this agent\'s reading.'
      : 'That nothing here is written in any register is this agent\'s reading, and it is the whole of what the note claims.', {
      held_by: EDITORIAL_AGENT,
      basis: 'Read from .agents/skills/legal-editorial/references/house-register.md, which describes how the brief already writes and is explicit that it is not a licence to rewrite anything into it.',
      contested: false,
    });
    for (const q of f.open_questions ?? []) {
      b.openNull(null, q.question, q.missing, { blocks: false });
    }
    if (!(f.open_questions ?? []).length) {
      b.openNull(null, f.standing_question.question, f.standing_question.missing, { blocks: f.standing_question.blocks === true });
    }

    return this.#ship(span, b.build(), f.derived_from ?? []);
  }

  /* ------------------------------------------------ one approval */

  #approvalFor(span, proposal, f) {
    const b = this.#builder('ApprovalRequest', span);
    b.addEvidence({
      evidence_id: 'ev-proposal', kind: 'agent_output',
      source_id: null, url: null, locator: `EditorialProposal ${proposal.proposal_id}`,
      title: null, publisher: null, quote: null,
      retrieved_at: proposal.created_at, checksum: null,
      supports: 'supports:direct', role: 'secondary', simulated: this.simulated,
    });
    for (const e of proposal.affected_entities) b.addEntity(e);

    const drafting = proposal.proposal_kind === 'factual_update';
    approvalOver({
      builder: b,
      approval_id: this.ids.mint('appr-ed', { kind: 'approval', subject: proposal.proposal_id }),
      proposal_ids: [proposal.proposal_id],
      tier: drafting ? 'amber' : 'red',
      requested_of: DECIDED_BY,
      why: drafting
        ? `A change to the brief's prose is Class C under docs/AUTONOMY-POLICY.md — pull request and human approval — and this one alters a sentence a claim record is attached to. The replacement is a substitution of one verified value for another and no sentence was written, which is what makes it preparable at all; it is not what makes it applicable.`
        : `proposal_kind is "${proposal.proposal_kind}": ${proposal.editorial_state === 'not_attributed' ? 'the sentence carries no claim record, so nothing in this repository says what it is meant to assert' : 'the passage is the author\'s argument'}. An agent may propose here and may not author. Every operation carries a null replacement on purpose.`,
      what_to_check: [
        `Read the quoted sentence at ${proposal.prose_locations[0].file} ${proposal.prose_locations[0].anchor} and confirm it still reads as the proposal says. The quote is the finding; if it does not match, the proposal is stale and nothing else in it matters.`,
        ...(drafting
          ? [
            `Confirm the substitution is the whole of the edit: exactly one occurrence of "${proposal.staleness?.changed_value?.old}" becomes "${proposal.staleness?.changed_value?.new}" and no other byte moves. The proposal carries the before and after in full.`,
            `Confirm the new value is what the document actually prints. This agent has read no document — it carried the value across from ${proposal.evidence.find((e) => e.kind === 'agent_output')?.locator ?? 'the verified input'}, and the chain behind that is where the fact was established or was not.`,
            `Sweep the other two homes of this string: the inline __CONTENT__ blob in index.html and data/brief.json. ${proposal.content_blob_divergence ? `They already diverge here — ${proposal.content_blob_divergence}` : 'The proposal reports no divergence at this point, which is not the same as their agreeing everywhere.'}`,
            `Declare every i18n key in i18n/locales.json as the proposal's i18n_dispositions state. An undeclared key leaves three locale editions asserting the value you just corrected — this has already happened once.`,
          ]
          : [
            'Decide what, if anything, the passage should now say. The proposal deliberately drafts nothing: an agent rewriting an argument because a factual input moved is the thing SESSION 15 exists to prevent.',
            'Confirm the dependency the proposal claims — that this passage rests on the record that changed — and, where it does not, reject it as a false positive rather than editing around it.',
          ]),
        ...(proposal.claim_ids_affected.length
          ? [`Confirm the claim record(s) ${proposal.claim_ids_affected.join(', ')} still describe what the sentence asserts after the change. The sentence and the claim are two views of one assertion; changing one and not the other orphans it.`]
          : ['This sentence carries no claim record. Decide whether it should: every material factual sentence on this site retains its provenance, and an unattributed one is invisible to every check in the repository.']),
        `Run the four validators and compare against the docs/CURRENT-ARCHITECTURE.md §12 baseline: 0 errors, 106 unverified records, 5 design-qa warnings by file and line. tools/i18n-audit.mjs is the one that matters most here.`,
      ],
      risk: proposal.risk === 'high' ? 'high' : 'medium',
      consequence: drafting
        ? 'A wrongly approved correction puts a wrong date, figure or status into a sentence on a production site about EU law, in the one place no validator in this repository reads. A reader may act on it.'
        : 'Nothing renders differently until somebody writes something, and nothing is written here. The cost of getting this wrong is a reviewer\'s time; the cost of not looking is a paragraph that quietly stopped being true.',
    });

    b.fact(null, true, `EditorialProposal ${proposal.proposal_id} exists, is proposal_kind "${proposal.proposal_kind}", autonomy_class "${proposal.autonomy_class}", and has not been applied.`, ['ev-proposal']);
    b.openNull(null,
      drafting ? 'Is the new value what the document says?' : 'What should this passage now say?',
      drafting
        ? 'A read of the document behind the verified input. No agent in this repository has retrieved one, and this proposal carries the value across rather than establishing it.'
        : 'A decision by the repository owner. This agent established that a passage depends on something that moved; what the argument should now be is not something a measurement decides.',
      { blocks: true });

    return this.#ship(span, b.build(), [proposal.proposal_id]);
  }

  /* ---------------------------------------- one no-change finding */

  /**
   * The third deliverable SESSION 15 asks for, and it is not a
   * proposal.
   *
   * A proposal with no operations is a suggestion — the contract
   * requires at least one — and "this sentence needs no change" has
   * no operation by definition. It is an `AgentObservation`: a
   * structured claim about the world, with a subject, a confidence
   * and a risk, that another agent can act on and a human can
   * disagree with.
   *
   * IT IS A DELIVERABLE AND NOT A SILENCE. "Looked and found
   * nothing" and "did not look" are different findings everywhere
   * else in this repository, and they are different here.
   */
  #noChange(span, f) {
    const b = this.#builder('AgentObservation', span);
    b.addEvidence(proseEvidence('ev-prose', f.block, { simulated: this.simulated }));
    if (f.input) b.addEvidence(inputEvidence('ev-input', f.input, { simulated: this.simulated }));
    b.addEntity({
      kind: 'prose', id: f.block.anchor, path: f.block.file,
      field: f.block.i18n_key ? 'data-i18n' : null,
      note: `examined against ${f.subject} and needs no correction`,
    });

    const observation_id = this.ids.mint('obs-ed-nochange', {
      kind: 'no_change', entities: b.entities, subject: f.subject,
      discriminator: f.discriminator ?? null,
    });
    b.set('observation_id', observation_id);
    b.set('subject', `${f.block.file} ${f.block.anchor} against ${f.subject}`);
    b.set('summary', `NO CHANGE NEEDED — ${f.why}`);
    b.set('data', {
      as_of: this.asOf,
      editorial_state: f.state,
      how_reached: f.how,
      claim_ids: f.block.claim_ids,
      part_id: f.block.part_id,
      /* The sentence, and the value it does NOT contain. That pair
         is the whole finding: a reviewer can check both halves. */
      value_not_present: f.old_value ?? null,
      quote: String(f.block.text).slice(0, 400),
    });
    b.set('confidence', f.confidence ?? 0.8);
    b.set('risk', 'low');
    b.set('refs', [f.subject, ...(f.block.claim_ids ?? [])].filter(Boolean));
    b.set('supersedes', null);

    b.fact(null, true, `${f.block.file} at ${f.block.anchor} does not contain ${f.old_value ? `"${f.old_value}"` : 'the value named by the change'}, at any rendering this repository can read.`, ['ev-prose']);
    b.inference(null, undefined, f.why, ['ev-prose'], f.method);
    b.openNull(null,
      'Does this sentence depend on the change in a way no string match can see?',
      'A read of the sentence. A paraphrase of a value, rather than the value, is invisible to every check here — this observation says the value is not present, and never that the sentence is unaffected.',
      { blocks: false });

    return this.#ship(span, b.build(), f.derived_from ?? []);
  }

  /* ------------------------------------------------------- the run */

  async run({ task = 'Find the prose that a verified change has made wrong, correct only what can be shown to be wrong, and flag the rest.' } = {}) {
    const run = this.tracer.startRun({ kind: 'agent', agent: EDITORIAL_AGENT, task, inputs: { as_of: this.asOf, inputs: this.inputs.length, simulated: this.simulated } });

    try {
      /* --- 1 · the gate ------------------------------------------ */
      const gate = run.startTool({ name: 'editorial.intake', inputs: { records: this.inputs.length, admissible: ADMISSIBLE } });
      const admitted = intake(this.inputs, { allowSimulated: this.simulated });
      for (const r of admitted.refused) {
        gate.observe({ summary: `REFUSED AT INTAKE — ${r.contract}`, subject: r.record_id, data: { why: r.why }, confidence: 1, risk: 'medium' });
      }
      gate.observe({
        summary: `INTAKE — ${admitted.accepted.length} verified input(s) admitted, ${admitted.refused.length} refused`,
        subject: 'intake', data: { by_contract: admitted.by_contract, refused: admitted.refused.length, simulated: admitted.simulated },
        confidence: 1, risk: admitted.accepted.length ? 'low' : 'medium',
      });
      gate.end({ status: 'ok', outputs: { admitted: admitted.accepted.length, refused: admitted.refused.length } });

      /* --- 2 · the prose ----------------------------------------- */
      const proseSpan = run.startTool({ name: 'editorial.prose', inputs: { as_of: this.asOf } });
      const prose = readProse(this.root ? { root: this.root } : {});
      const register = registerOf(prose.blocks, this.corpus);
      proseSpan.observe({
        summary: `PROSE READ — ${prose.blocks.length} authored block(s) across ${prose.pages.length} page(s) and ${Object.keys(prose.by_home).length} home(s)`,
        subject: 'prose', confidence: 1, risk: 'low',
        data: {
          by_home: prose.by_home, by_state: register.by_state,
          attributed: register.attributed, unattributed: prose.blocks.length - register.attributed,
          dropped_tags: prose.dropped, divergences: prose.divergences.length,
        },
      });
      proseSpan.end({ status: 'ok', outputs: { blocks: prose.blocks.length, attributed: register.attributed, by_state: register.by_state } });

      /* --- 3 · what needs no input ------------------------------- */
      const site = this.#siteFindings(run, { prose, register });

      /* --- 4 · one span per verified change ---------------------- */
      const perChange = [];
      for (const change of admitted.changes) {
        perChange.push(this.#runChange(run, { change, prose, register, assessments: admitted.assessments }));
      }
      for (const v of admitted.verifications) {
        perChange.push(this.#runVerification(run, { verification: v, register }));
      }

      /* --- 5 · the decision, and what it did not choose ---------- */
      run.decide({
        decision: 'Each reached block was triaged by what the sentence IS and by whether the value that moved is in it.',
        rationale: 'A correction is composed only where the sentence quotes the old value and the sentence is a statement of fact. Everything else is flagged, and a sentence the change does not state is reported as needing no change rather than left in a review list.',
        alternatives: [
          'Correct every sentence whose claim references the changed record — rejected: a claim link establishes a dependency and nothing about whether the sentence states the value, so most of those edits would be a machine rewriting prose it cannot show to be wrong.',
          'Report every reached block as possibly stale — rejected: "this paragraph might be wrong" is true of most of the corpus, and a review list nobody finishes is a review list that hides its real entries.',
          'Say nothing about the blocks that need no change — rejected: "looked and found nothing" and "did not look" are different findings, and this repository keeps them apart everywhere else.',
          'Draft a replacement for an analytical passage whose premise moved — refused outright: the argument is the author\'s, and staleness.mjs throws at module load if the table ever routes one here.',
        ],
        confidence: 0.9,
        risk: 'medium',
      });

      const proposals = this.store.written.filter((r) => r.contract === 'EditorialProposal');
      const approvals = this.store.written.filter((r) => r.contract === 'ApprovalRequest');
      const noChanges = this.store.written.filter((r) => r.contract === 'AgentObservation');
      const byKind = {};
      for (const p of proposals) byKind[p.proposal_kind] = (byKind[p.proposal_kind] ?? 0) + 1;

      run.observe({
        summary: `EDITORIAL CENSUS — ${proposals.length} proposal(s), ${noChanges.length} no-change explanation(s), ${this.refused.length} refused`,
        subject: 'census', confidence: 1, risk: 'low',
        data: {
          as_of: this.asOf,
          by_kind: byKind,
          inputs_admitted: admitted.accepted.length,
          inputs_refused: admitted.refused.length,
          blocks_examined: prose.blocks.length,
          blocks_reached: perChange.reduce((n, c) => n + c.reached, 0),
          by_state: register.by_state,
          site_findings: site.length,
          open_questions: perChange.reduce((n, c) => n + c.open_questions.length, 0),
        },
      });

      run.observe({
        summary: 'NOTHING APPLIED — no page, dataset or locale file was written, and no proposal was merged',
        subject: 'nothing applied', confidence: 1, risk: 'low',
        data: {
          merged: 0, applied: 0, pages_written: 0, sentences_authored: 0,
          /* The number that matters most on this agent. Every
             drafted replacement is a substitution; none of them is a
             sentence somebody wrote. */
          substitutions_drafted: proposals.filter((p) => p.proposal_kind === 'factual_update').length,
        },
      });

      run.end({
        status: 'ok',
        outputs: {
          proposals: proposals.length, approvals: approvals.length, no_change: noChanges.length,
          by_kind: byKind, refused: this.refused.length,
        },
        confidence: 0.85,
        risk: proposals.some((p) => p.risk === 'high') ? 'high' : 'medium',
      });

      return {
        trace_id: run.trace_id,
        as_of: this.asOf,
        intake: admitted,
        prose,
        register,
        site,
        changes: perChange,
        proposals,
        approvals,
        no_change: noChanges,
        by_kind: byKind,
        refused: this.refused,
      };
    } catch (err) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }
  }

  /* --------------------------------------------- the site findings */

  /**
   * The three editorial findings that need no verified input at
   * all, because they are about the site disagreeing with itself.
   *
   * All three are `editorial_recommendation`s: nothing is drafted,
   * every one is `human_only`, and each says what it establishes and
   * what it explicitly does not.
   */
  #siteFindings(run, { prose, register }) {
    const span = run.startTool({ name: 'editorial.site', inputs: { as_of: this.asOf } });
    const out = [];

    try {
      /* 1 · The two homes of one English string disagreeing. */
      for (const d of prose.divergences) {
        if (!d.field) continue;
        const block = prose.blocks.find((b) => b.home === 'content_blob' && b.anchor === d.field)
          ?? prose.blocks.find((b) => b.home === 'brief_json' && b.anchor === d.field);
        if (!block) continue;
        const p = this.#proposal(span, {
          block, state: 'not_attributed', kind: 'editorial_recommendation',
          subject: `two homes of ${d.field}`,
          why: 'The string carries no claim record in either home, so which of the four states it is cannot be derived. That is not what this finding is about.',
          reason: `index.html's inline __CONTENT__ blob and data/brief.json hold different text at ${d.field}, and nothing in this repository compares them. The blob is what a reader's contents overlay and search index actually read; data/brief.json is canonical and is fetched by nothing.`,
          summary: `${d.field} reads differently in the two homes of the brief's prose.`,
          divergence: `${d.why}. __CONTENT__: "${String(d.blob).slice(0, 300)}" — data/brief.json: "${String(d.brief_json).slice(0, 300)}"`,
          operations: [{
            op: 'modify', target: `${d.field} — in index.html's __CONTENT__ blob and in data/brief.json`,
            current: `__CONTENT__: ${String(d.blob).slice(0, 900)}\n\ndata/brief.json: ${String(d.brief_json).slice(0, 900)}`,
            proposed: null,
            rationale: 'Which of the two is right is a decision about what the brief says, and it is the author\'s. This proposal establishes that they differ and drafts nothing.',
          }],
          scope_note: 'This does NOT reconcile the two homes and does not decide which is right. It also does not touch the question of why data/brief.json is fetched by nothing — that is a shape question and agent/architect/ has already raised it.',
          staleness: null,
          risk: 'medium', confidence: 0.95,
          interpretation: {
            statement: 'That the drift matters editorially rather than only structurally is this agent\'s reading.',
            basis: 'The two strings are read by different parts of the same page, so a reader can be shown one sentence in the running text and a different one in the contents overlay. Whether the difference changes what the brief asserts is a judgement about the words, and that is the author\'s.',
            contested: false,
          },
          standing_question: {
            question: `Which of the two texts at ${d.field} is the one the brief means?`,
            missing: 'A decision by the repository owner. This agent compared two strings; it has no way to know which was the correction and which was left behind.',
            blocks: true,
          },
          open_questions: [],
        });
        if (p) { out.push(p); this.#approvalFor(span, p, {}); }
      }

      /* 2 · The markup and the data disagreeing about what a passage
             is. Nothing in this repository checks for one. */
      for (const d of register.label_disagreements) {
        const row = register.rows.find((r) => r.block.anchor === d.anchor && r.block.file === d.file);
        if (!row) continue;
        const p = this.#proposal(span, {
          block: row.block, state: row.state, kind: 'editorial_recommendation',
          subject: `box label vs claim type at ${d.anchor}`,
          why: row.why,
          reason: `The markup labels this box "${d.markup_says === 'critique' ? 'CRITIQUE' : String(d.markup_says).toUpperCase()}" — the author saying the passage is an argument — while every claim attached to it (${d.claim_ids.join(', ')}) is typed law or fact in data/claims.json and reads as ${d.claims_say}. One of the two is wrong about what this passage is, and claim_type is the highest-leverage field in the repository.`,
          summary: `The markup and data/claims.json disagree about whether ${d.anchor} is an argument or a statement.`,
          divergence: null,
          operations: [{
            op: 'modify', target: `${d.file} ${d.anchor} — the box label, or data/claims.json ${d.claim_ids.join(', ')} — the claim type`,
            current: `markup: box label "${row.block.box_label}" · claims: ${d.claim_ids.map((c) => this.corpus.claimById.get(c)?.type ?? '(missing)').join(', ')}`,
            proposed: null,
            rationale: 'Changing a claim_type is RED tier (AI-SAFE-BOUNDARIES §3) — it changes what the site claims it can support — and changing the box label changes how the passage is presented. Either is the author\'s.',
          }],
          scope_note: 'This does NOT decide which side is wrong, and it explicitly does not propose a claim_type. It reports that two homes for "what this passage is" disagree.',
          staleness: null,
          risk: 'high', confidence: 0.9,
          interpretation: {
            statement: 'That this is a disagreement rather than a deliberate arrangement is this agent\'s reading.',
            basis: 'An author may well put a statement of fact inside a critique box to argue from it. What the comparison establishes is that the markup and the data give different answers to "what is this passage"; whether that is a defect is a judgement about the writing.',
            contested: true,
          },
          standing_question: {
            question: `Is ${d.anchor} an argument the author is making, or a statement its claims can carry?`,
            missing: 'A decision by the repository owner. Reclassifying a claim is red tier and an agent may not take it.',
            blocks: true,
          },
          open_questions: [],
        });
        if (p) { out.push(p); this.#approvalFor(span, p, {}); }
      }

      /* 3 · Prose reading as settled law over evidence that cannot
             carry it. The one rule `.agents/skills/legal-editorial/`
             says outranks style. */
      const unhedged = register.rows.filter((r) => r.state === 'unresolved' && !caveatsIn(r.block.text).length);
      for (const row of unhedged) {
        const p = this.#proposal(span, {
          block: row.block, state: 'unresolved', kind: 'editorial_recommendation',
          subject: `unhedged prose over unresolved evidence at ${row.block.anchor}`,
          why: row.why,
          reason: `The claim(s) behind this sentence (${row.claim_states.filter((c) => c.state === 'unresolved').map((c) => c.claim_id).join(', ')}) are graded Unresolved — no external source directly carries them, or the only one is this brief — and the sentence carries no hedge. .agents/skills/legal-editorial/SKILL.md: confidence in the prose must match the grade of the claim behind it, and where the prose must be more confident than the evidence the fix is verification, not adverbs.`,
          summary: `${row.block.anchor} reads as settled over a claim nothing external carries.`,
          divergence: null,
          operations: [{
            op: 'modify', target: `${row.block.file} ${row.block.anchor}`,
            current: String(row.block.text).slice(0, 900),
            proposed: null,
            rationale: 'The two available fixes are verification (find the source) and hedging (say what is unestablished). The first is the Legal Verifier\'s and the second is the author\'s. An agent adding a hedge would be softening the brief\'s register on its own initiative, and an agent removing the finding would be softening a stated limitation.',
          }],
          scope_note: 'This does NOT add a hedge, does NOT propose wording, and does NOT touch the claim record or its verification_note. It reports a mismatch between how a sentence reads and what carries it.',
          staleness: null,
          risk: 'medium', confidence: 0.75,
          interpretation: {
            statement: 'That this sentence reads as settled is this agent\'s reading, arrived at by the absence of a hedge rather than by understanding the sentence.',
            basis: 'The caveat markers are read off the brief\'s own house register. A sentence can be appropriately confident with none of them in it, and this finding is contested for exactly that reason — it is a prompt to look, not a verdict on the writing.',
            contested: true,
          },
          standing_question: {
            question: 'Should this sentence be hedged, or should the claim behind it be verified?',
            missing: 'Either a source that carries the claim — the Legal Verifier\'s work — or a decision by the author about the wording. Neither is an agent\'s.',
            blocks: true,
          },
          open_questions: [],
        });
        if (p) { out.push(p); this.#approvalFor(span, p, {}); }
      }

      span.observe({
        summary: `SITE FINDINGS — ${out.length} recommendation(s) that need no verified input`,
        subject: 'site', confidence: 1, risk: out.length ? 'medium' : 'low',
        data: {
          blob_divergences: prose.divergences.filter((d) => d.field).length,
          label_disagreements: register.label_disagreements.length,
          dangling_attributions: register.dangling_attributions.length,
          unhedged_over_unresolved: unhedged.length,
        },
      });
      if (!register.dangling_attributions.length) {
        span.observe({
          summary: 'LOOKED AND FOUND NOTHING — every data-claim attribution in the markup resolves to a record in data/claims.json',
          subject: 'dangling attributions', data: { checked: register.attributed, dangling: 0 }, confidence: 1, risk: 'none',
        });
      }
      span.end({ status: 'ok', outputs: { recommendations: out.length } });
      return out;
    } catch (err) {
      span.error(err, { fatal: true });
      span.end({ status: 'failed' });
      throw err;
    }
  }

  /* ------------------------------------------- one verified change */

  #runChange(run, { change, prose, register, assessments }) {
    const subject = change_entity(change) ?? change.change_id;
    const span = run.startTool({
      name: `editorial.change.${change.change_id}`,
      inputs: { change_id: change.change_id, change_kind: change.change_kind, entity: subject, attribute: change.attribute, materiality: change.materiality, as_of: this.asOf },
    });

    const may = correctable(change);
    const months = monthNames(this.root ? { root: this.root } : {});
    const g = safeGraph(this.corpus, this.root);
    const labels = labelsFor(change, g);
    const needles = subject ? needlesFor(subject, { corpus: this.corpus, graph: g, register }) : [];
    /* The assessment for this change, where one was handed in. It
       carries the caveats SESSION 10 already worked out and this
       agent inherits rather than restates. */
    const assessment = (assessments ?? []).find((a) => a.change_id === change.change_id) ?? null;

    const results = [];
    const open_questions = [];
    let reached = 0;

    for (const row of register.rows) {
      const r = reachOf(row, { change, corpus: this.corpus, needles, months, labels });
      open_questions.push(...r.open_questions);
      if (!r.reached) continue;
      reached++;
      const t = triage(row.state, r.kind);
      results.push({ row, reach: r, triage: t });
    }

    for (const q of open_questions) {
      span.observe({
        summary: `OPEN QUESTION — a sentence containing the word, and a reading this agent does not make`,
        subject: q.anchor, data: q, confidence: 0.5, risk: 'medium',
      });
    }

    let proposed = 0;
    let noChange = 0;
    for (const { row, reach, triage: t } of results) {
      if (t.outcome === 'no_change') {
        const rec = this.#noChange(span, {
          block: row.block, state: row.state, subject: subjectOf(change, subject), input: change,
          discriminator: discriminatorOf(change, reach.kind),
          old_value: change.old_value ?? null,
          how: reach.how,
          why: t.why,
          method: `The block was matched against the value that moved using agent/detector/impact.mjs's prose reader — every rendering of a date, the label of a taxonomy term, the literal on a token boundary — and the value is not in it. The dependency itself is ${reach.how}.`,
          confidence: 0.8,
          derived_from: [change.change_id],
        });
        if (rec) noChange++;
        continue;
      }

      const f = this.#findingFor({ row, reach, triage: t, change, may, subject: subjectOf(change, subject), assessment, prose });
      if (!f) continue;
      const p = this.#proposal(span, f);
      if (p) { proposed++; this.#approvalFor(span, p, f); }
    }

    span.observe({
      summary: `CHANGE ${change.change_id} — ${reached} block(s) reached, ${proposed} proposal(s), ${noChange} needing no change`,
      subject: change.change_id, confidence: 0.9, risk: proposed ? 'high' : 'low',
      data: {
        entity: subject, attribute: change.attribute,
        old_value: change.old_value ?? null, new_value: change.new_value ?? null,
        correctable: may.ok, why_not_correctable: may.ok ? null : may.why,
        examined: register.rows.length, reached, proposed, no_change: noChange,
        open_questions: open_questions.length,
        by_outcome: tally(results.map((r) => r.triage.outcome)),
        by_staleness: tally(results.map((r) => r.reach.kind)),
        needles: needles.map((n) => ({ text: n.text, ambiguous: n.ambiguous })),
        assessment: assessment?.assessment_id ?? null,
      },
    });
    if (!may.ok) {
      span.observe({
        summary: 'NO CORRECTION COULD BE COMPOSED FROM THIS CHANGE',
        subject: change.change_id, data: { why: may.why }, confidence: 1, risk: 'medium',
      });
    }
    span.end({ status: 'ok', outputs: { examined: register.rows.length, reached, proposed, no_change: noChange, open_questions: open_questions.length } });

    return { change_id: change.change_id, subject, reached, proposed, no_change: noChange, open_questions, results, correctable: may };
  }

  /**
   * One verified check, where no change was detected.
   *
   * A `confirmed` verdict cannot produce a correction — nothing
   * moved — and it is not nothing: it establishes that a
   * proposition still stands, which is what a NO-CHANGE explanation
   * is made of. A `contradicted` verdict establishes that the corpus
   * is wrong and NOT what is right, so it produces a recommendation
   * and never a correction.
   */
  #runVerification(run, { verification, register }) {
    const span = run.startTool({
      name: `editorial.verification.${verification.verification_id}`,
      inputs: { verdict: verification.verdict, as_of: this.asOf },
    });
    const subject = verification.verification_id;
    let produced = 0;

    /* The statement checked, looked for in the prose. Only an exact
       appearance counts: this agent does not decide that two
       differently worded sentences say the same thing. */
    const needle = String(verification.statement ?? '').trim();
    const rows = needle.length > 20 ? register.rows.filter((r) => r.block.text.includes(needle)) : [];

    for (const row of rows) {
      if (verification.verdict === 'contradicted') {
        const p = this.#proposal(span, {
          block: row.block, state: row.state, kind: 'editorial_recommendation',
          subject: `${subject} contradicts ${row.block.anchor}`,
          why: row.why,
          reason: `A verified check found this proposition contradicted by the document it was checked against. The verification establishes that the sentence is wrong; it does not establish what is right, and composing a replacement from it would be authoring the legal fact the check did not carry.`,
          summary: `${row.block.anchor} states a proposition a verified check found contradicted.`,
          divergence: null,
          operations: [{
            op: 'modify', target: `${row.block.file} ${row.block.anchor}`,
            current: String(row.block.text).slice(0, 900),
            proposed: null,
            rationale: `The verification's residual gap is: ${verification.residual_gap ?? 'not stated'}. Until a value is established, the honest edits are to hedge or to remove — both the author's.`,
          }],
          scope_note: 'This does NOT propose a replacement value. A "contradicted" verdict is not a source for the correct value.',
          staleness: null,
          risk: 'high', confidence: 0.85,
          input: verification,
          interpretation: {
            statement: 'That the sentence is the same proposition the verification checked is this agent\'s reading, made by exact string containment and nothing more.',
            basis: 'The verification\'s statement appears verbatim in the block. Two differently worded sentences saying the same thing are invisible here, and this agent does not decide that they do.',
            contested: false,
          },
          standing_question: {
            question: 'What should this sentence say instead?',
            missing: 'A value established from a document. The check that found the sentence wrong did not carry one.',
            blocks: true,
          },
          open_questions: [],
          derived_from: [verification.verification_id],
        });
        if (p) { produced++; this.#approvalFor(span, p, {}); }
      } else {
        const rec = this.#noChange(span, {
          block: row.block, state: row.state, subject, input: verification,
          old_value: null,
          how: `the verified check's statement appears verbatim in this block`,
          why: `A verified check returned "${verification.verdict}" on the proposition this sentence states. The sentence stands, and saying so is a different finding from not having looked.`,
          method: 'Exact string containment of the verification\'s own statement in the block\'s text. No paraphrase was matched and none was attempted.',
          confidence: 0.9,
          derived_from: [verification.verification_id],
        });
        if (rec) produced++;
      }
    }

    span.observe({
      summary: `VERIFICATION ${subject} — verdict "${verification.verdict}", ${rows.length} block(s) state it verbatim`,
      subject, confidence: 0.9, risk: verification.verdict === 'contradicted' ? 'high' : 'low',
      data: { verdict: verification.verdict, blocks: rows.length, produced, statement: needle.slice(0, 300) },
    });
    span.end({ status: 'ok', outputs: { reached: rows.length, produced } });
    return { change_id: subject, subject, reached: rows.length, proposed: produced, no_change: 0, open_questions: [], results: [], correctable: { ok: false, why: 'a verification is not a change' } };
  }

  /* -------------------------------- one finding, ready to propose */

  #findingFor({ row, reach, triage: t, change, may, subject, assessment, prose }) {
    const block = row.block;
    const drafting = t.outcome === 'factual_update';
    const divergence = prose.divergences.find((d) => d.field && block.anchor.startsWith(String(d.field).split('.')[0])) ?? null;

    let operations;
    let summary;
    let scope_note;

    if (drafting) {
      if (!may.ok) {
        /* The triage said a correction was available and the input
           cannot supply one. Downgraded rather than forced — and the
           downgrade is reported, not silent. */
        return this.#recommendationFor({ row, reach, change, subject, why: `A correction is available in shape and not in substance: ${may.why}` });
      }
      const sub = substitute(block, reach.matched, change.new_value);
      if (!sub.ok) {
        return this.#recommendationFor({ row, reach, change, subject, why: `A substitution could not be composed safely: ${sub.why}` });
      }
      operations = [{
        op: 'modify',
        target: `${block.file} ${block.anchor} (line ${block.line}) — the element's content, not its attributes`,
        current: sub.current,
        proposed: sub.proposed,
        rationale: sub.why,
      }];
      summary = `Replace "${reach.matched}" with "${change.new_value}" in ${block.anchor}, and change nothing else.`;
      scope_note = `This does NOT reword the sentence, does NOT touch its attributes, does NOT edit the claim record ${block.claim_ids.join(', ') || '(none)'} in data/claims.json, and does NOT touch the other two homes of this string — the __CONTENT__ blob and the locale overlays — which the approval requires a human to sweep.`;
    } else {
      operations = [{
        op: 'modify',
        target: `${block.file} ${block.anchor} (line ${block.line})`,
        current: String(block.text).slice(0, 900),
        proposed: null,
        rationale: reach.kind === 'contradicted'
          ? 'The passage states the value that moved AND makes an argument from it. Substituting inside an argument can invert it, and which way this one goes is the author\'s to decide.'
          : 'The passage rests on a premise that moved and does not restate it. Nothing here establishes that the argument is now wrong, and an edit would assert that it is.',
      }];
      summary = reach.kind === 'contradicted'
        ? `${block.anchor} is ${row.state.toUpperCase()} and states a value that has moved.`
        : `${block.anchor} is ${row.state.toUpperCase()} and rests on a record that has changed.`;
      scope_note = 'This drafts NOTHING. The system must never silently rewrite an analytical argument because a factual input changed, and the null replacement is that rule in the record rather than in a README.';
    }

    return {
      block, state: row.state, kind: t.outcome, subject, why: row.why,
      discriminator: discriminatorOf(change, reach.kind),
      input: change,
      reason: `${t.why} ${change.attribute ? `The change is to ${change.attribute} on ${subject}` : `The change is to ${subject}`}: "${String(change.old_value ?? 'nothing').slice(0, 120)}" → "${String(change.new_value ?? 'nothing').slice(0, 120)}", detected as ${change.change_kind} at materiality ${change.materiality}.`,
      summary,
      divergence: divergence ? `${divergence.why} at ${divergence.field}` : null,
      operations,
      scope_note,
      staleness: {
        kind: reach.kind,
        quoted: reach.kind === 'contradicted' ? reach.quote : null,
        changed_entity: subject,
        changed_value: { old: change.old_value ?? null, new: change.new_value ?? null },
        how: reach.how,
        why: reach.why,
      },
      risk: drafting ? 'high' : (ANALYTICAL_STATES.includes(row.state) ? 'medium' : 'medium'),
      confidence: reach.kind === 'contradicted' ? 0.9 : 0.55,
      interpretation: drafting
        ? {
          statement: 'That this substitution leaves the sentence saying what it was meant to say is this agent\'s reading.',
          basis: 'The substitution is mechanical and the arithmetic is checkable; that the surrounding sentence still parses and still means what the author intended is a judgement about the writing, and it is why this is amber rather than green.',
          contested: false,
        }
        : {
          statement: 'That this passage depends on the record that changed is this agent\'s reading.',
          basis: reach.kind === 'contradicted'
            ? 'The sentence contains the value, quoted. What the argument does once the value is corrected is not something a string match can answer.'
            : 'The dependency is derived from the claim record\'s own references or from the sentence naming the record. Neither establishes that the passage is now wrong, and this proposal does not claim it is.',
          contested: true,
        },
      standing_question: drafting
        ? { question: 'Do the other two homes of this string need the same edit?', missing: 'A sweep of index.html\'s __CONTENT__ blob and of i18n/it.json, fr.json and es.json. The proposal names the keys; it does not edit them.', blocks: false }
        : { question: 'Does the argument survive the change?', missing: 'A reading by the author. This agent established a dependency, not a defect.', blocks: true },
      open_questions: [],
      derived_from: [change.change_id, ...(assessment ? [assessment.assessment_id] : [])],
    };
  }

  /** The fallback when a correction looked available and was not.
   *  Reported as a recommendation with the reason, never silently
   *  dropped and never forced through. */
  #recommendationFor({ row, reach, change, subject, why }) {
    const block = row.block;
    return {
      block, state: row.state, kind: 'editorial_recommendation', subject,
      why: row.why,
      discriminator: discriminatorOf(change, reach.kind),
      input: change,
      reason: `The sentence states the value that moved and this agent could not compose a safe correction. ${why}`,
      summary: `${block.anchor} states a value that has moved, and the correction has to be made by hand.`,
      divergence: null,
      operations: [{
        op: 'modify', target: `${block.file} ${block.anchor} (line ${block.line})`,
        current: String(block.html).slice(0, 900), proposed: null,
        rationale: why,
      }],
      scope_note: 'This drafts nothing. It is the case where a substitution looked available and turned out not to be, and it is reported rather than forced.',
      staleness: {
        kind: reach.kind,
        quoted: reach.kind === 'contradicted' ? reach.quote : null,
        changed_entity: subject,
        changed_value: { old: change.old_value ?? null, new: change.new_value ?? null },
        how: reach.how,
        why: reach.why,
      },
      risk: 'high', confidence: 0.8,
      interpretation: {
        statement: 'That a hand edit is the right answer here is this agent\'s reading.',
        basis: why,
        contested: false,
      },
      standing_question: { question: 'What should the sentence say?', missing: 'A hand edit by the author, because the mechanical one could not be shown to be safe.', blocks: true },
      open_questions: [],
      derived_from: [change.change_id],
    };
  }
}

/* ------------------------------------------------------- helpers */

/**
 * The four validators, plus the one this agent's work turns on.
 *
 * `tools/i18n-audit.mjs` is already in the four; what is added here
 * is what PASSING it means for an editorial change, which is not
 * what it means for a data change.
 */
const PROSE_VALIDATORS = [
  ...FOUR_VALIDATORS.map((v) => (v.command.includes('i18n-audit')
    ? { ...v, expected: '0 errors, 0 warnings — AND every key this proposal names declared in i18n/locales.json as its i18n_dispositions say. The audit compares the register against the live DOM; it cannot tell you that a translation still describes the English, which is why the dispositions are part of the proposal rather than a follow-up.' }
    : v)),
  {
    check: 'the sentence still reads as the proposal quoted it',
    command: 'git diff -- <the page> | head -40',
    expected: 'The diff contains the substitution and nothing else. In prose, a diff larger than the correction is the finding (.agents/skills/legal-editorial/SKILL.md).',
    why: 'Nothing in this repository reads a sentence. The diff is the only check there is on an editorial change, and it is a human one.',
  },
];

/** What a finding is ABOUT: the record and the field of it that
 *  moved. Two changes to different fields of one instrument are two
 *  findings on the same sentence, and an id that named only the
 *  record would merge them. */
const subjectOf = (change, entity) => `${entity ?? change.change_id}${change.attribute ? `.${change.attribute}` : ''}`;

/** What distinguishes two findings about the same field of the same
 *  record: the values, and the strength of the finding. Content, so
 *  re-detecting the same change re-mints the same id and a reviewer
 *  can tell a re-proposal from a new one. */
const discriminatorOf = (change, kind) => `${kind}|${change.old_value ?? 'null'}→${change.new_value ?? 'null'}`;

const tally = (xs) => xs.reduce((acc, x) => { if (x) acc[x] = (acc[x] ?? 0) + 1; return acc; }, {});

/** Taxonomy labels for the value that moved, so prose can be
 *  searched for what a reader would actually have read. Same shape
 *  `agent/detector/impact.mjs` builds, and it defers to
 *  `labelAmbiguity` there. */
function labelsFor(change, g) {
  const v = change.old_value ?? null;
  if (!v || !g?.nodes?.has(String(v))) return [];
  const t = g.nodes.get(String(v));
  if (t.kind !== 'taxonomy_term' || !t.record?.label) return [];
  return [{ text: t.record.label, ambiguous: false }];
}

/** The dependency graph, where one can be built. A suite corpus may
 *  not support one, and a missing graph costs the needle test its
 *  taxonomy half rather than costing the run. */
function safeGraph(corpus, root) {
  try { return sharedGraph(root ? { corpus, root } : { corpus }); } catch { return null; }
}
