/* ============================================================
   agent/integrate/adapter.mjs — the adapter between Verification
   Records and the canonical datasets

   THE DATA MODEL IS NOT REPLACED AND IS NOT TOUCHED. data/*.json is
   read and never written. There is no migration, no shadow copy, no
   parallel schema, no new dataset. What this layer produces are
   contract records — a ClaimEvidence link, a DataProposal, a
   DataGap, an ApprovalRequest — which live in agent/records/,
   git-ignored, regenerable, and not canonical. The Verifier holds
   the same line and its suite hashes data/ around a run; so does
   this one.

   THE EIGHT THINGS THE SESSION ASKED FOR, AND WHERE EACH LIVES:

     1 find an existing claim before creating a new one   claims.mjs
     2 find an existing source before creating a duplicate sources.mjs
     3 attach evidence to the canonical record            evidence.mjs
     4 detect unsupported claims                          unsupported.mjs
     5 detect stale verification                          stale.mjs
     6 detect conflicting evidence                        conflicts.mjs
     7 preserve existing IDs                              preserve.mjs
     8 preserve existing provenance                       preserve.mjs

   The first three are per-verification and run in the loop below.
   The last five are corpus-wide and run after it, because 4, 5 and 6
   need to know what this run resolved before they can say what is
   unsupported, stale or in conflict — and 7 and 8 check every
   proposal the first three produced, against the corpus, before any
   of them is stored.

   TWO GATES, BOTH MANDATORY, NEITHER SKIPPABLE. Every record goes
   through agent/schemas/gateway.mjs `emit`, which validates against
   its contract and throws. Every DataProposal ALSO goes through
   `checkPreservation`, which validates it against the corpus it
   would change — the half the contract cannot do, because the gate
   deliberately never reads data/. A proposal failing either is not
   stored. There is no flag that turns either off.

   NOTHING IS MERGED. Not the non-substantive proposals either. The
   adapter has no code path that writes to data/, and the suite
   fails if a module in this directory acquires one.
   ============================================================ */

import { isoOf } from '../observability/ids.mjs';
import { emit, receive } from '../schemas/gateway.mjs';
import { loadCorpus, HOME_OF, SELF_SOURCE_ID } from './canonical.mjs';
import { resolveClaim } from './claims.mjs';
import { resolveSource, draftSourceRecord } from './sources.mjs';
import { buildLink, attachOperation, supportsFor, ATTACHING_VERDICTS } from './evidence.mjs';
import { unsupportedClaims, tallyUnsupported } from './unsupported.mjs';
import { staleVerification, STALENESS_IS_NOT } from './stale.mjs';
import { findConflicts, unmappableStatuses } from './conflicts.mjs';
import { checkPreservation, untouchedProvenance } from './preserve.mjs';
import { builderFor, approvalOver, FOUR_VALIDATORS, ROLLBACK, INTEGRATOR_AGENT, datasetEvidence, verificationEvidence, carriedDocumentEvidence } from './propose.mjs';
import { outcomeClassOf } from '../verifier/outcome.mjs';

export { INTEGRATOR_AGENT };

export class Integrator {
  /**
   * @param {{tracer:object, store:object, corpus?:object, asOf:string,
   *          requestedOf?:string, simulated?:boolean}} opts
   *   `asOf` is mandatory: staleness is computed against it and
   *   nothing here reads a clock for a judgement.
   */
  constructor({ tracer, store, corpus, asOf, requestedOf = 'the repository owner', simulated = false }) {
    if (!asOf || !/^\d{4}-\d{2}-\d{2}/.test(String(asOf))) {
      throw new Error('Integrator needs an explicit asOf date (YYYY-MM-DD). A staleness report without its as-of date is not reproducible (docs/AUDIT-2026-09-01.md F-15).');
    }
    this.tracer = tracer;
    this.store = store;
    this.corpus = corpus ?? loadCorpus();
    this.asOf = String(asOf).slice(0, 10);
    this.requestedOf = requestedOf;
    this.simulated = simulated === true;
    this.seq = 0;
    /* Refusals, so a run that produced nothing can say why rather
       than looking like a run that found nothing. */
    this.refused = [];
    /* (claim_id|source_id) → the proposal that already covers it. */
    this.proposedPairs = new Map();
  }

  #now() { return isoOf(this.tracer.clock.now()); }
  #id(prefix) { return `${prefix}-${String(++this.seq).padStart(3, '0')}`; }
  #builder(contract, span) { return builderFor(contract, { span, now: this.#now(), simulated: this.simulated }); }

  /** Validate against the contract, register in the trace, store.
   *  One way out, and no second one. */
  #ship(span, record, derived_from = []) {
    emit(span, record, { allowSimulated: this.simulated, derived_from });
    this.store.write(record);
    return record;
  }

  /** A DataProposal goes through the corpus check as well, and is
   *  refused rather than stored if it fails. Requirements 7 and 8
   *  are enforced here, on the way out, for every proposal without
   *  exception. */
  #shipProposal(span, proposal, derived_from = []) {
    const problems = checkPreservation(proposal, this.corpus);
    if (problems.length) {
      this.refused.push({ what: proposal.proposal_id, stage: 'preservation', problems });
      span.observe({
        summary: `Refused a DataProposal: it would not preserve what it must. ${problems.length} problem(s).`,
        subject: proposal.proposal_id,
        data: { problems },
        confidence: 1, risk: 'high', simulated: this.simulated,
      });
      return null;
    }
    return this.#ship(span, proposal, derived_from);
  }

  /* ---------------------------------------------------------- intake */

  /** A verification is checked before it is acted on — including one
   *  this process believes it was handed by a Verifier, because "I
   *  was handed it" is not a property the receiver can check. */
  #intake(parent, verification) {
    const span = parent.startTool({ name: 'integrate.intake', inputs: { verification_id: verification?.verification_id ?? null } });
    try {
      receive(verification, { allowSimulated: this.simulated });
      if (verification.contract !== 'VerificationRecord') {
        throw new Error(`the integrator takes a VerificationRecord; it was handed a ${verification.contract}`);
      }
      if (verification.agent === INTEGRATOR_AGENT) {
        throw new Error(`refusing "${verification.verification_id}": this agent produced it, and AGENT-ROLES H3 is that no agent verifies its own output`);
      }
      span.end({ status: 'ok', outputs: { accepted: true, from_agent: verification.agent, verdict: verification.verdict } });
      return { ok: true };
    } catch (err) {
      span.error(err, { fatal: false });
      span.end({ status: 'failed', outputs: { accepted: false } });
      return { ok: false, reason: err.message };
    }
  }

  /* ----------------------------------------- 1, 2 and 3, per record */

  #resolve(parent, verification) {
    const span = parent.startTool({
      name: 'integrate.resolve',
      inputs: { verification_id: verification.verification_id, verdict: verification.verdict },
    });

    const claim = resolveClaim(verification, this.corpus);
    const source = resolveSource(verification, this.corpus);

    span.decide({
      decision: `claim: ${claim.outcome}${claim.claim_id ? ` (${claim.claim_id})` : ''} · source: ${source.outcome}${source.source_id ? ` (${source.source_id})` : ''}`,
      rationale: [claim.search.why_not_that_one, source.search.why_not_that_one].filter(Boolean).join(' ')
        || 'Both resolutions were decided by a strategy that names what it matched on.',
      alternatives: [
        ...claim.decision.near.map((c) => ({ option: `claim ${c.id}`, why_not: c.why })),
        ...source.decision.near.map((c) => ({ option: `source ${c.id}`, why_not: c.why })),
      ],
      confidence: Math.min(claim.decision.best?.score ?? 0.3, source.decision.best?.score ?? 0.3),
      risk: 'medium',
      inputs_ref: [verification.verification_id],
    });

    span.end({
      status: 'ok',
      outputs: {
        claim: claim.outcome, claim_id: claim.claim_id,
        source: source.outcome, source_id: source.source_id,
        considered: { claims: claim.decision.considered, sources: source.decision.considered },
      },
    });

    return { claim, source, span };
  }

  /** Requirement 3, and the two proposals a miss produces instead. */
  #integrateOne(parent, verification) {
    const { claim, source } = this.#resolve(parent, verification);
    const produced = { links: [], proposals: [], gaps: [], notes: [] };
    const span = parent.startTool({
      name: 'integrate.attach',
      inputs: { verification_id: verification.verification_id, claim: claim.outcome, source: source.outcome },
    });

    /* --- neither side resolved cleanly: say so, propose nothing --- */
    if (claim.outcome === 'ambiguous' || source.outcome === 'ambiguous') {
      produced.gaps.push(this.#ambiguityGap(span, verification, { claim, source }));
      span.end({ status: 'ok', outputs: { attached: false, reason: 'ambiguous resolution' } });
      return produced;
    }

    /* --- a verdict that settled nothing proposes nothing ---------- */
    if (!ATTACHING_VERDICTS.includes(verification.verdict)) {
      /* A contradiction, a conflict, an unsettled check or a
         document that never arrived. None of them may found a
         source record, create a claim, or attach a citation:
         nothing was established, and a proposal drawn from a check
         that established nothing would be a proposal standing on
         nothing. They are handled by the conflict and gap passes
         below, where they belong. */
      produced.notes.push({
        verification_id: verification.verification_id,
        claim_id: claim.claim_id,
        source_id: source.source_id,
        not_attached: `The verdict is "${verification.verdict}" (outcome class: ${outcomeClassOf(verification.verdict)}). No proposal is made from it: ${verification.verdict === 'contradicted' ? 'a source that says otherwise is not a source that supports' : 'nothing was settled'}. The finding is carried by the conflict and gap passes instead.`,
      });
      if (source.outcome === 'no_match' && !source.retrieved_and_read) {
        produced.gaps.push(this.#unreadableSourceGap(span, verification, source));
      }
      span.end({ status: 'ok', outputs: { attached: false, reason: `verdict "${verification.verdict}" attaches nothing` } });
      return produced;
    }

    /* --- a source nothing in the corpus carries -------------------- */
    if (source.outcome === 'no_match') {
      if (source.retrieved_and_read) {
        produced.proposals.push(this.#createSourceProposal(span, verification, source));
      } else {
        produced.gaps.push(this.#unreadableSourceGap(span, verification, source));
      }
      span.end({ status: 'ok', outputs: { attached: false, reason: 'no existing source record' } });
      return produced;
    }

    /* --- a claim nothing in the corpus carries --------------------- */
    if (claim.outcome === 'no_match') {
      produced.proposals.push(this.#createClaimProposal(span, verification, { claim, source }));
      span.end({ status: 'ok', outputs: { attached: false, reason: 'no existing claim' } });
      return produced;
    }

    /* --- both resolved: attach ------------------------------------- */
    const claimRecord = this.corpus.claimById.get(claim.claim_id);

    /* One pair, one proposal. Several propositions from one document
       routinely match one claim, and each would otherwise produce its
       own proposal to add the SAME reference — five identical
       operations, which applied in order would put the source in the
       claim's bibliography five times. The corpus check cannot catch
       this: it compares against data/, and data/ does not yet carry
       any of them. So the run keeps its own set. The later
       verifications are not lost — they are recorded as notes naming
       the proposal that already covers the pair. */
    const pair = `${claim.claim_id}|${source.source_id}`;
    if (this.proposedPairs.has(pair)) {
      const covered = this.proposedPairs.get(pair);
      /* What this check WOULD have proposed, so a second check
         reaching a WEAKER qualifier than the standing proposal is
         visible rather than swallowed. That difference matters:
         only supports:direct raises a grade, and a run where one
         proposition was directly supported and another only partly
         is a run whose standing proposal may be claiming more than
         the evidence as a whole carries. */
      const would = supportsFor(verification, source.document);
      produced.notes.push({
        verification_id: verification.verification_id,
        claim_id: claim.claim_id,
        source_id: source.source_id,
        not_attached: `${covered.proposal_id} already proposes attaching ${source.source_id} to ${claim.claim_id} in this run, as "${covered.supports}". A second proposal for the same pair would add the same reference twice, and a claim never cites one source twice.${
          would.supports && would.supports !== covered.supports
            ? ` NOTE: this check would have qualified it "${would.supports}", which is ${would.supports === 'supports:direct' ? 'stronger' : 'weaker'} than the standing proposal — a reviewer should decide which the reference should carry, since only supports:direct raises the derived grade.`
            : ''
        }`,
      });
      span.end({ status: 'ok', outputs: { attached: false, reason: 'already proposed in this run', would_have_been: would.supports } });
      return produced;
    }
    const built = buildLink({
      verification,
      claim: claimRecord,
      source_id: source.source_id,
      evidenceRef: source.document,
    });

    if (!built.link) {
      produced.notes.push({ verification_id: verification.verification_id, claim_id: claim.claim_id, source_id: source.source_id, not_attached: built.skipped });
      span.observe({
        summary: `Nothing attached: ${built.skipped}`,
        subject: claim.claim_id,
        data: { verification_id: verification.verification_id, source_id: source.source_id, verdict: verification.verdict },
        confidence: 1, risk: 'low', simulated: this.simulated,
      });
      span.end({ status: 'ok', outputs: { attached: false, reason: 'the verdict or the existing reference forbids it' } });
      return produced;
    }

    produced.links.push(this.#linkRecord(span, verification, built, source));
    const attached = this.#attachProposal(span, verification, built, { claim, source, claimRecord });
    if (attached) this.proposedPairs.set(pair, { proposal_id: attached.proposal_id, supports: built.link.supports });
    produced.proposals.push(attached);
    span.end({ status: 'ok', outputs: { attached: true, supports: built.link.supports, downgraded: Boolean(built.downgraded_from) } });
    return produced;
  }

  /* ---------------------------------------------------------- records */

  #linkRecord(span, verification, built, source) {
    const b = this.#builder('ClaimEvidence', span);
    const doc = source.document;
    b.addEvidence(carriedDocumentEvidence('ev-doc', doc, { simulated: this.simulated }));
    b.addEvidence(verificationEvidence('ev-verification', verification, { simulated: this.simulated }));
    b.addEntity({ kind: 'claim', id: built.link.claim_id, path: 'data/claims.json', field: 'sources', note: 'The claim this edge is about.' });
    b.addEntity({ kind: 'source', id: built.link.source_id, path: 'data/sources.json', field: null, note: 'The source record the document resolved to.' });

    b.set('link_id', this.#id('link'));
    b.set('claim_id', built.link.claim_id);
    b.set('source_id', built.link.source_id);
    b.set('role', built.link.role);
    b.set('locator', built.link.locator);
    b.set('quote', built.link.quote);
    b.set('is_citation', built.link.is_citation);
    b.set('established_by', built.link.established_by);

    b.fact(null, true, `data/sources.json carries a record with id "${built.link.source_id}", and the document ${verification.verification_id} read resolved to it by ${source.decision.match.strategy}.`, ['ev-doc']);
    b.inference('supports', built.link.supports,
      `The source ${built.link.supports === 'supports:direct' ? 'states the claim\'s proposition' : built.link.supports === 'supports:partial' ? 'establishes part of the claim\'s proposition, or a narrower case' : 'informs the claim without establishing it, and is not a citation'}.`,
      ['ev-doc', 'ev-verification'],
      `Taken from the verdict "${verification.verdict}" and the evidence entry's own supports qualifier, mapped in agent/integrate/evidence.mjs. The mapping only ever weakens: a partially_confirmed verdict yields supports:partial whatever the evidence entry claimed${built.downgraded_from ? `, and it did so here — ${built.why_downgraded}` : ''}. Only a direct support can raise a claim's grade (SOURCE-POLICY §4), and the grade itself is derived at render time by js/format.js and stored nowhere.`);

    b.openNull(null, 'Does this source carry the whole of the claim, or the part the verification checked?',
      'A reading of the claim against the passage by a human. The verification checked one proposition; a claim in this corpus is a sentence from the brief and may assert more than one.');

    return this.#ship(span, b.build(), [verification.verification_id]);
  }

  #attachProposal(span, verification, built, { claim, source, claimRecord }) {
    const b = this.#builder('DataProposal', span);
    const doc = source.document;
    b.addEvidence(carriedDocumentEvidence('ev-doc', doc, { simulated: this.simulated }));
    b.addEvidence(verificationEvidence('ev-verification', verification, { simulated: this.simulated }));
    b.addEvidence(datasetEvidence('ev-claim', {
      path: 'data/claims.json', locator: claim.claim_id,
      quote: claimRecord.statement, simulated: this.simulated,
    }));
    b.addEntity({ kind: 'claim', id: claim.claim_id, path: 'data/claims.json', field: 'sources', note: 'One entry would be added to this claim\'s sources array. Nothing else on the record changes.' });

    b.set('proposal_id', this.#id('prop-attach'));
    b.set('dataset', 'data/claims.json');
    b.set('record_kind', 'claim');
    b.set('record_id', claim.claim_id);
    b.set('operation_kind', 'attach_evidence');
    b.set('existing_search', null);
    b.set('preserves_record_id', true);
    b.set('provenance_disposition', untouchedProvenance(claimRecord, 'data/claims.json',
      'An attachment adds one entry to sources[]. Every provenance field on this record is left exactly as it is — including last_verified, which is not set by attaching evidence: VERIFICATION-POLICY §5 and AUTONOMY-POLICY §4 both turn on that field not being stamped by something that did not read the source.'));
    b.set('substantive', false);
    b.set('verification_refs', [verification.verification_id]);
    b.set('prose_anchor', null);
    b.set('retrieved_and_read', source.retrieved_and_read);
    b.set('supersedes', null);
    b.set('reason', `${claim.claim_id} ${claimRecord.sources?.every((s) => s.source_id === SELF_SOURCE_ID) ? 'currently rests on nothing but the brief citing itself' : 'has sources but not this one'}. ${verification.verification_id} read ${doc.url ?? 'a document'}${built.link.locator ? ` at ${built.link.locator}` : ''} and returned "${verification.verdict}". The document resolved to the existing source record ${source.source_id} by ${source.decision.match.strategy}, so nothing new is created — one reference is added to one array.`);
    b.set('confidence', Number(Math.min(0.8, (source.decision.match.score + (claim.decision.match?.score ?? 0.5)) / 2).toFixed(2)));
    b.set('risk', 'medium');
    b.set('autonomy_class', 'review_required');
    b.set('proposed_change', {
      summary: `Add one source reference (${source.source_id}, ${built.link.supports}) to ${claim.claim_id} in data/claims.json.`,
      operations: [attachOperation(built.link)],
      scope_note: 'It does not touch the claim\'s statement, its type, its last_verified, its verification_note, its reference_gap, or any source reference already on it. It creates no source record and renames no id.',
    });
    b.set('validation_requirements', FOUR_VALIDATORS);
    b.set('rollback_plan', ROLLBACK(`the source reference on ${claim.claim_id}`));

    b.fact(null, true, `data/claims.json carries "${claim.claim_id}" and its sources array does not contain "${source.source_id}".`, ['ev-claim']);
    b.inference('substantive', false,
      'Adding a source reference does not change what the claim asserts; it changes what the claim can be shown to rest on.',
      ['ev-claim', 'ev-doc'],
      'The operation adds one entry to sources[] and touches no other field: the statement, the type, the verification_note and every existing reference are unchanged, and the evidence grade is derived at render time by js/format.js rather than stored, so no second copy can disagree with it. What it DOES change is the derived grade the page shows — which is the intended effect of attaching evidence, and the reason this is review_required rather than autonomous.');
    b.openNull(null, 'Does the passage support the whole of the claim\'s sentence?',
      'A human reading the claim against the passage. This layer matched a proposition to a claim; it did not read the claim.');

    return this.#shipProposal(span, b.build(), [verification.verification_id]);
  }

  #createSourceProposal(span, verification, source) {
    const b = this.#builder('DataProposal', span);
    const doc = source.document;
    const draft = draftSourceRecord({ verification, document: doc, corpus: this.corpus });
    b.addEvidence(carriedDocumentEvidence('ev-doc', doc, { simulated: this.simulated }));
    b.addEvidence(verificationEvidence('ev-verification', verification, { simulated: this.simulated }));
    b.addEntity({ kind: 'source', id: null, path: 'data/sources.json', field: null, note: 'A source record for a document the bibliography does not carry.' });

    b.set('proposal_id', this.#id('prop-source'));
    b.set('dataset', 'data/sources.json');
    b.set('record_kind', 'source');
    b.set('record_id', null);
    b.set('operation_kind', 'create_source');
    b.set('existing_search', source.search);
    b.set('preserves_record_id', true);
    b.set('provenance_disposition', []);
    b.set('substantive', true);
    b.set('verification_refs', [verification.verification_id]);
    b.set('prose_anchor', null);
    b.set('retrieved_and_read', true);
    b.set('supersedes', null);
    b.set('reason', `${verification.verification_id} read ${doc.url ?? 'a document'} and data/sources.json carries no record for it. ${source.search.why_not_that_one ?? 'No existing record came close enough to consider.'} The bibliography is one record per document and a source is never described twice, so this is proposed rather than assumed.`);
    b.set('confidence', 0.5);
    b.set('risk', 'high');
    b.set('autonomy_class', 'human_only');
    b.set('proposed_change', {
      summary: `Add one record to data/sources.json for ${doc.url ?? 'the retrieved document'}. Seven of its fields are left for a human, each with the reason.`,
      operations: [{
        op: 'add',
        target: 'data/sources.json sources[]',
        current: null,
        proposed: JSON.stringify({ ...draft, _ids_in_use: undefined, not_established: undefined }),
        rationale: `Every value here was read from the document or from the verification that read it. The id, tier, type, publisher, url_status, language and note are null: ${Object.entries(draft.not_established).map(([k, why]) => `${k} — ${why}`).join(' ')}`,
      }],
      scope_note: 'It creates a source record and nothing else. It attaches that source to no claim, changes no existing source, and mints no id — an id is a human\'s to choose in a namespace that is never renamed.',
    });
    b.set('validation_requirements', FOUR_VALIDATORS);
    b.set('rollback_plan', ROLLBACK('the new source record'));

    b.fact(null, true, `The document at ${doc.url ?? 'the retrieved address'} was fetched on ${doc.retrieved_at ?? 'the date the verification records'} and read${doc.checksum ? `; the bytes hash to ${doc.checksum}` : ''}.`, ['ev-doc']);
    b.inference('existing_search', undefined,
      `All ${source.compared} existing source record(s) were compared and none is this document.`,
      ['ev-doc'],
      'Compared in order: the evidence entry\'s own source_id, then CELEX numbers read only where EUR-Lex itself put one in the address, then normalised URLs, then normalised title with publisher. Each is scored on this matcher\'s own scale in agent/integrate/match.mjs; none is a probability that two records are the same document.');
    b.openNull('prose_anchor', 'Is this document already cited elsewhere in the corpus under another id?',
      'A human check of the bibliography. The four strategies above compare an address, an identifier and a title; a document republished at a new address under a new title would pass all four.',
      { blocks: true });
    b.openNull(null, 'What tier does this source carry, and what type of document is it?',
      'A human decision on the record. The verification carries an estimated source_tier, typed as an inference and documented as an estimate; writing it here as the settled tier would turn an estimate into a fact by moving it.',
      { blocks: true });

    return this.#shipProposal(span, b.build(), [verification.verification_id]);
  }

  #createClaimProposal(span, verification, { claim, source }) {
    const b = this.#builder('DataProposal', span);
    const doc = source.document;
    if (doc) b.addEvidence(carriedDocumentEvidence('ev-doc', doc, { simulated: this.simulated }));
    b.addEvidence(verificationEvidence('ev-verification', verification, { simulated: this.simulated }));
    /* The fact this proposal turns on is a fact about THIS
       REPOSITORY — that no claim record carries the proposition —
       and it is cited to the dataset that was read, not to the
       verification. A fact citing only the verification would be
       citing supports:context evidence, which validate.mjs refuses
       and which SOURCE-POLICY §4 refuses for the same reason:
       context informs without establishing. */
    b.addEvidence(datasetEvidence('ev-claims', {
      path: 'data/claims.json', locator: `all ${this.corpus.claims.length} claim records`,
      quote: null, simulated: this.simulated,
    }));
    b.addEntity({ kind: 'claim', id: null, path: 'data/claims.json', field: null, note: 'A claim record for a proposition no existing claim carries.' });

    b.set('proposal_id', this.#id('prop-claim'));
    b.set('dataset', 'data/claims.json');
    b.set('record_kind', 'claim');
    b.set('record_id', null);
    b.set('operation_kind', 'create_claim');
    b.set('existing_search', claim.search);
    b.set('preserves_record_id', true);
    b.set('provenance_disposition', []);
    b.set('substantive', true);
    b.set('verification_refs', [verification.verification_id]);
    b.set('prose_anchor', null);
    b.set('retrieved_and_read', source.retrieved_and_read);
    b.set('supersedes', null);
    b.set('reason', `${verification.verification_id} checked a proposition that no claim in data/claims.json carries. ${claim.search.why_not_that_one ?? 'No existing claim came close enough to consider.'} THIS PROPOSAL IS BLOCKED and is recorded so the finding is not lost: data/claims.json's own $description is that no new claims were written — every record corresponds to a statement already present in the prose — and this layer cannot see the prose. A claim written from a document rather than from the brief would be the site asserting something it does not say.`);
    b.set('confidence', 0.3);
    b.set('risk', 'high');
    b.set('autonomy_class', 'human_only');
    b.set('proposed_change', {
      summary: `Record that ${verification.verification_id} checked a proposition data/claims.json does not carry. No claim is drafted.`,
      operations: [{
        op: 'add',
        target: 'data/claims.json claims[]',
        current: null,
        proposed: null,
        rationale: `No record is drafted here. The proposition the verification checked was: "${String(verification.statement).slice(0, 300)}". Whether the brief makes a corresponding statement, and in which part, is what would have to be established first — and if the brief does not make it, the answer is that there is no claim to write, not that one should be invented.`,
      }],
      scope_note: 'It drafts no claim, mints no id, and attaches no source. It exists so that a proposition nothing in the corpus carries is a recorded finding rather than a silent drop.',
    });
    b.set('validation_requirements', FOUR_VALIDATORS);
    b.set('rollback_plan', ROLLBACK('the new claim record'));

    b.fact(null, true, `All ${claim.compared} claim record(s) in data/claims.json were compared against this proposition and none carries it.`, ['ev-claims']);
    b.inference('existing_search', undefined,
      'No existing claim matched, by declared entity, by exact statement, or by vocabulary overlap with a shared instrument.',
      ['ev-claims'],
      'Compared in order: a claim id the verification itself named; the normalised statements word for word; then token overlap, which is only allowed to reach the accept threshold when the claim and the verification are about at least one instrument in common. Overlap alone is capped below that threshold because two sentences about EU law share a great deal of vocabulary without being about the same act.');
    b.openNull('prose_anchor', 'Which sentence in the brief carries this statement?',
      'The sentence itself, located in index.html. Every claim in this corpus corresponds to a statement already present in the prose, and this layer does not read the prose. If no sentence carries it, there is no claim to write.',
      { blocks: true });

    return this.#shipProposal(span, b.build(), [verification.verification_id]);
  }

  /* ---------------------------------------------------------- gaps */

  #gap(span, { gap_kind, absence_kind, what, why, closes, leads = [], blocking, entities, evidence, unresolved, derived_from = [] }) {
    const b = this.#builder('DataGap', span);
    for (const e of evidence) b.addEvidence(e);
    for (const e of entities) b.addEntity(e);
    b.set('gap_id', this.#id('gap'));
    b.set('gap_kind', gap_kind);
    b.set('absence_kind', absence_kind);
    b.set('what_is_missing', what);
    b.set('why_open', why);
    b.set('closes_with', closes);
    b.set('candidate_leads', leads);
    b.set('blocking', blocking);
    b.set('first_seen_at', this.#now());
    b.set('last_reviewed_at', null);
    b.set('state', 'open');
    b.set('closed_by', null);
    for (const u of unresolved) b.ep.unresolved.push(u);
    return this.#ship(span, b.build(), derived_from);
  }

  #ambiguityGap(span, verification, { claim, source }) {
    const which = claim.outcome === 'ambiguous' ? 'claim' : 'source';
    const decision = which === 'claim' ? claim.decision : source.decision;
    const names = decision.near.map((c) => `${c.id} (${c.score}, ${c.strategy})`).join(', ');
    return this.#gap(span, {
      gap_kind: 'not_publicly_determinable',
      absence_kind: 'unknown_not_determinable',
      what: `Which existing ${which} record ${verification.verification_id} is about. ${decision.near.length} candidates could not be told apart: ${names}.`,
      why: `The matcher reached "ambiguous", which is a result and not a failure. Picking the highest score would attach ${which === 'claim' ? 'evidence to a statement it may not carry' : 'a document to a record it may not be'}, and the two damaging directions are not symmetrical: a wrong attachment puts a citation under a sentence it does not support.`,
      closes: `A human deciding which of the named records this is, or deciding that it is none of them. ${which === 'source' ? 'Where two addresses share a host and a path, that decision includes whether a consolidated text and an original are the same document — they are not.' : ''}`,
      leads: decision.near.map((c) => `${which} ${c.id} — ${c.why}`),
      blocking: true,
      entities: [{ kind: which === 'claim' ? 'claim' : 'source', id: null, path: which === 'claim' ? 'data/claims.json' : 'data/sources.json', field: null, note: `One of ${decision.near.length} candidate records.` }],
      evidence: [{
        evidence_id: 'ev-absent', kind: 'absent',
        source_id: null, url: null, locator: null, title: null, publisher: null,
        quote: null, retrieved_at: null, checksum: null,
        supports: null, role: 'unresolved', simulated: this.simulated,
      }],
      unresolved: [{
        field: null,
        question: `Which ${which} record is ${verification.verification_id} about?`,
        missing: `A human decision between ${names}. Nothing in this layer ranks them, and the higher score is not the right answer.`,
        absence_kind: 'unknown_not_determinable',
        blocks: true,
      }],
      derived_from: [verification.verification_id],
    });
  }

  #unreadableSourceGap(span, verification, source) {
    return this.#gap(span, {
      gap_kind: 'retrieval_blocked',
      absence_kind: 'null_not_researched',
      what: `A source record for whatever ${verification.verification_id} was about. The verification carries no retrieved_document evidence${verification.verdict === 'source_unavailable' ? ' — its verdict is "source_unavailable", so the document never arrived' : ''}.`,
      why: 'Nothing was read, so there is nothing to write a source record from. Creating one from a title, an abstract, a search snippet or model knowledge is red tier under AI-SAFE-BOUNDARIES §3, and this layer has no path that does it.',
      closes: 'Retrieving the document and reading it. The Source Scout and the Legal Verifier are the agents for that; this one only integrates what they established.',
      leads: [],
      blocking: false,
      entities: [{ kind: 'source', id: null, path: 'data/sources.json', field: null, note: 'No record can be founded on a document nobody read.' }],
      evidence: [{
        evidence_id: 'ev-absent', kind: 'absent',
        source_id: null, url: null, locator: null, title: null, publisher: null,
        quote: null, retrieved_at: null, checksum: null,
        supports: null, role: 'unresolved', simulated: this.simulated,
      }],
      unresolved: [{
        field: null,
        question: 'What document does this verification stand on?',
        missing: 'A retrieval that succeeded. Every registered endpoint is refused by this environment\'s egress policy, which is the finding SESSION 05 recorded and nothing since has changed.',
        absence_kind: 'null_not_researched',
        blocks: false,
      }],
      derived_from: [verification.verification_id],
    });
  }

  #unsupportedGap(span, row) {
    const reasons = row.reasons.map((r) => `${r.reason}: ${r.detail}`).join(' ');
    return this.#gap(span, {
      gap_kind: row.reasons.some((r) => r.reason === 'verification_unsettled') ? 'unverified_record' : 'missing_source',
      absence_kind: 'null_not_researched',
      what: `An external source that directly supports ${row.claim_id}. ${reasons}`,
      why: `${row.what_this_is_not} The claim grades "${row.grade}" by the site's own derivation in js/format.js, which is what a reader already sees.`,
      closes: 'Locating the publication the brief was pointing at, opening it, and confirming it says what the brief says it says. It is closed by nothing else: a loosely related substitute is worse than an admitted gap because it looks resolved (AI-SAFE-BOUNDARIES §0.2), and this list getting shorter is not a goal in itself (VERIFICATION-POLICY §6).',
      leads: [],
      blocking: false,
      entities: [{ kind: 'claim', id: row.claim_id, path: 'data/claims.json', field: 'sources', note: `Grades "${row.grade}"; family "${row.family}".` }],
      evidence: [{
        evidence_id: 'ev-absent', kind: 'absent',
        source_id: null, url: null, locator: null, title: null, publisher: null,
        quote: null, retrieved_at: null, checksum: null,
        supports: null, role: 'unresolved', simulated: this.simulated,
      }],
      unresolved: [{
        field: null,
        question: row.is_argument
          ? `What supports the premises of ${row.claim_id}?`
          : `Which publication carries ${row.claim_id}?`,
        missing: row.is_argument
          ? 'Sources for the premises. The conclusion is a reading and no citation settles it; this is not a missing citation and must not be counted as one.'
          : 'The publication itself, read, and confirmed to say what the claim says it says.',
        absence_kind: 'null_not_researched',
        blocks: false,
      }],
    });
  }

  #staleGap(span, row) {
    return this.#gap(span, {
      gap_kind: 'stale_verification',
      absence_kind: 'null_not_researched',
      what: `A re-reading of ${row.record_id ?? row.dataset ?? row.verification_id}. ${row.why}`,
      why: `${STALENESS_IS_NOT}${row.compilation_date_caveat ? ` ${row.compilation_date_caveat}` : ''}`,
      closes: 'Opening the source again and confirming it still says what the record says it says, then writing the date it was actually read with a verification_note saying so. Bulk-stamping last_verified is prohibited outright (AUTONOMY-POLICY §4).',
      leads: [],
      blocking: false,
      entities: [row.record_id
        ? { kind: 'claim', id: row.record_id, path: row.dataset, field: 'last_verified', note: `Computed as of ${row.as_of}.` }
        : { kind: 'dataset', id: null, path: row.dataset ?? 'agent/records', field: '$last_verified', note: `Computed as of ${row.as_of}.` }],
      evidence: [{
        evidence_id: 'ev-dates', kind: 'dataset_record',
        source_id: null, url: null,
        locator: `${row.dataset ?? 'the run\'s verification records'} $last_verified, compared against ${row.as_of}`,
        title: null, publisher: null, quote: null, retrieved_at: null, checksum: null,
        supports: 'supports:direct', role: 'primary', simulated: this.simulated,
      }],
      unresolved: [{
        field: null,
        question: `Has anything moved since ${row.dataset ? this.corpus.verificationDates[row.dataset.replace(/^data\/|\.json$/g, '')]?.file ?? 'the recorded date' : 'the last check'}?`,
        missing: 'Somebody opening the sources again. Nothing in this repository has ever fetched a URL as part of a validator, so a stale record and a broken link are equally invisible until a human looks.',
        absence_kind: 'null_not_researched',
        blocks: false,
      }],
    });
  }

  #conflictGap(span, row) {
    const sides = row.sides.map((s) => `${s.where} → ${s.value === null ? '(see the note)' : `"${String(s.value).slice(0, 200)}"`}${s.note ? ` — ${String(s.note).replace(/\s+/g, ' ').slice(0, 300)}` : ''}`).join('  ·  ');
    return this.#gap(span, {
      gap_kind: 'source_conflict',
      absence_kind: 'unknown_not_determinable',
      what: `Which value governs. ${row.why} Both sides, in their own terms: ${sides}`,
      why: `${row.unreconciled_because} AGENT-ROLES H7: where two roles disagree on a fact, work halts and goes to a human — never resolved by seniority, recency or convenience. Nothing in this layer ranks them, and no proposal is produced, because a proposal would have to name a value and naming one is the decision this refuses to take.`,
      closes: 'A human deciding which source governs, or finding a third that displaces one of them. A difference of precision is not a disagreement and was already excluded; this is a difference of substance.',
      leads: [],
      blocking: true,
      entities: [
        row.instrument_id
          ? { kind: 'instrument', id: row.instrument_id, path: 'data/instruments.json', field: row.attribute, note: 'The act the two sides disagree about.' }
          : { kind: 'claim', id: row.claim_id ?? null, path: 'data/claims.json', field: null, note: 'The claim a retrieved document contradicts.' },
      ],
      evidence: [{
        evidence_id: 'ev-absent', kind: 'absent',
        source_id: null, url: null, locator: null, title: null, publisher: null,
        quote: null, retrieved_at: null, checksum: null,
        supports: null, role: 'unresolved', simulated: this.simulated,
      }],
      unresolved: [{
        field: null,
        question: `Which of the two stated values for ${row.attribute ? row.attribute.replace(/_/g, ' ') : 'the disputed point'} governs?`,
        missing: 'A human decision, or a source that displaces one of the two. Until then nothing downstream may treat either as the answer.',
        absence_kind: 'unknown_not_determinable',
        blocks: true,
      }],
      derived_from: row.verification_ids,
    });
  }

  /* ---------------------------------------------------------- the run */

  async run({ verifications, task = 'Integrate what the Legal Verifier established with the canonical datasets, without changing either.' } = {}) {
    const started_at = this.#now();
    const run = this.tracer.startRun({
      kind: 'agent',
      agent: INTEGRATOR_AGENT,
      task,
      inputs: {
        verifications: (verifications ?? []).map((v) => v?.verification_id ?? null),
        as_of: this.asOf,
        corpus: { claims: this.corpus.claims.length, sources: this.corpus.sources.length },
      },
    });

    const links = [];
    const proposals = [];
    const gaps = [];
    const notes = [];
    const resolutions = new Map();   // claim_id → verification ids matched to it
    const before = { ...this.corpus.verificationDates };

    try {
      run.observe({
        summary: `Integrator starting over ${(verifications ?? []).length} verification(s) against ${this.corpus.claims.length} claims and ${this.corpus.sources.length} sources, as of ${this.asOf}.`,
        subject: 'run',
        data: { as_of: this.asOf, simulated: this.simulated },
        confidence: 1, risk: 'none', simulated: this.simulated,
      });

      /* --- 1, 2, 3 --------------------------------------------- */

      for (const v of verifications ?? []) {
        const intake = this.#intake(run, v);
        if (!intake.ok) {
          this.refused.push({ what: v?.verification_id ?? null, stage: 'intake', problems: [intake.reason] });
          run.observe({
            summary: `Refused at intake: ${intake.reason}`,
            subject: v?.verification_id ?? 'unknown verification',
            data: { reason: intake.reason },
            confidence: 1, risk: 'medium', simulated: this.simulated,
          });
          continue;
        }

        const produced = this.#integrateOne(run, v);
        links.push(...produced.links);
        proposals.push(...produced.proposals.filter(Boolean));
        gaps.push(...produced.gaps);
        notes.push(...produced.notes);

        for (const l of produced.links) {
          if (!resolutions.has(l.claim_id)) resolutions.set(l.claim_id, []);
          resolutions.get(l.claim_id).push(v.verification_id);
        }
        /* A verification matched to a claim counts as resolved even
           where nothing was attached — an unsettled verdict is still
           about that claim, and requirements 4, 5 and 6 need to know. */
        for (const n of produced.notes) {
          if (!n.claim_id) continue;
          if (!resolutions.has(n.claim_id)) resolutions.set(n.claim_id, []);
          if (!resolutions.get(n.claim_id).includes(v.verification_id)) resolutions.get(n.claim_id).push(v.verification_id);
        }
      }

      /* --- 4 · unsupported claims ------------------------------- */

      const unsupportedSpan = run.startTool({ name: 'integrate.unsupported', inputs: { claims: this.corpus.claims.length } });
      const unsupported = unsupportedClaims(this.corpus, { verifications: verifications ?? [], resolutions });
      const unsupportedTally = tallyUnsupported(unsupported);
      unsupportedSpan.end({ status: 'ok', outputs: unsupportedTally });

      /* Only the claims this run actually touched get a gap record.
         Emitting 91 gap records for a corpus whose unverified state
         is already reported by tools/validate.mjs would be a second
         home for that list — and VERIFICATION-POLICY §6 is that the
         report is the honest statement, not a backlog to work
         through from an agent run. The full list is returned for the
         report either way. */
      for (const row of unsupported.filter((r) => resolutions.has(r.claim_id))) {
        gaps.push(this.#unsupportedGap(unsupportedSpan, row));
      }

      /* --- 5 · stale verification ------------------------------- */

      const staleSpan = run.startTool({ name: 'integrate.stale', inputs: { as_of: this.asOf } });
      const stale = staleVerification(this.corpus, { asOf: this.asOf, verifications: verifications ?? [], resolutions });
      staleSpan.end({ status: 'ok', outputs: { rows: stale.length, by_kind: tally(stale.map((r) => r.kind)) } });
      for (const row of stale) gaps.push(this.#staleGap(staleSpan, row));

      /* --- 6 · conflicting evidence ----------------------------- */

      const conflictSpan = run.startTool({ name: 'integrate.conflicts', inputs: { verifications: (verifications ?? []).length } });
      const conflicts = findConflicts(this.corpus, { verifications: verifications ?? [], resolutions, asOf: this.asOf });
      const unmappable = unmappableStatuses(verifications ?? []);
      conflictSpan.end({ status: 'ok', outputs: { conflicts: conflicts.length, by_kind: tally(conflicts.map((c) => c.kind)), unmappable_statuses: unmappable.length } });
      for (const row of conflicts) gaps.push(this.#conflictGap(conflictSpan, row));
      for (const u of unmappable) {
        conflictSpan.observe({
          summary: `Not a conflict: ${u.why}`,
          subject: u.verification_id,
          data: { legal_status: u.legal_status },
          confidence: 1, risk: 'low', simulated: this.simulated,
        });
      }

      /* --- the approval nothing proceeds without ---------------- */

      const approval = proposals.length
        ? this.#approval(run, { proposals, conflicts, unsupported, stale })
        : null;

      /* --- the run record --------------------------------------- */

      const ended_at = this.#now();
      const after = loadCorpus({ dir: this.corpus.dir }).verificationDates;
      const untouched = JSON.stringify(before) === JSON.stringify(after);

      const runRecord = this.#runRecord(run, {
        task, started_at, ended_at,
        verifications: verifications ?? [],
        links, proposals, gaps, conflicts, unsupported, unsupportedTally, stale, untouched,
        approval,
      });

      run.end({ status: 'ok', outputs: { links: links.length, proposals: proposals.length, gaps: gaps.length } });

      return {
        trace_id: run.trace_id,
        as_of: this.asOf,
        links, proposals, gaps, notes, approval,
        resolutions,
        unsupported, unsupported_tally: unsupportedTally,
        stale, conflicts, unmappable_statuses: unmappable,
        refused: this.refused,
        run_record: runRecord,
        data_untouched: untouched,
      };
    } catch (err) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }
  }

  #approval(span, { proposals, conflicts, unsupported, stale }) {
    const b = this.#builder('ApprovalRequest', span);
    const substantive = proposals.filter((p) => p.substantive === true);
    const tier = substantive.length ? 'red' : 'amber';

    b.addEvidence({
      evidence_id: 'ev-proposals', kind: 'agent_output',
      source_id: null, url: null, locator: `${proposals.length} DataProposal record(s) in this run`,
      title: null, publisher: null, quote: null, retrieved_at: this.#now(), checksum: null,
      supports: 'supports:direct', role: 'primary', simulated: this.simulated,
    });
    for (const p of proposals) {
      b.addEntity({ kind: p.record_kind, id: p.record_id, path: p.dataset, field: null, note: p.proposed_change.summary });
    }

    approvalOver({
      builder: b,
      approval_id: this.#id('appr'),
      proposal_ids: proposals.map((p) => p.proposal_id),
      tier,
      requested_of: this.requestedOf,
      why: `${proposals.length} proposal(s) would change data/*.json, which is what the site tells a reader about EU law. ${substantive.length ? `${substantive.length} of them are substantive — a new source record or a new claim — and altering a legal fact is red tier under AI-SAFE-BOUNDARIES §3: an agent may propose it and nothing more. ` : ''}Attaching evidence is amber under §2: an agent may prepare it and a human approves it. Nothing here has been applied, and this layer has no code path that could apply it.`,
      what_to_check: [
        ...proposals.map((p) => `${p.proposal_id}: open ${p.dataset}${p.record_id ? `, find "${p.record_id}"` : ''} and confirm the operation is exactly what the summary says — "${p.proposed_change.summary}"`),
        ...proposals.filter((p) => p.operation_kind === 'attach_evidence').map((p) => `${p.proposal_id}: read the claim's sentence against the quoted passage and confirm the "supports" qualifier. Only supports:direct raises the grade, and the grade is what a reader sees.`),
        ...proposals.filter((p) => p.operation_kind === 'create_source').map((p) => `${p.proposal_id}: decide the tier, the type, the publisher, the url_status and the id. None of the five was set here, and the estimated source_tier on the verification is an estimate and not the settled tier.`),
        ...(conflicts.length ? [`${conflicts.length} conflict(s) were found and NO proposal was made for any of them. Read each gap record: two sources disagree, or a source disagrees with the site, and deciding which governs is reserved to you.`] : []),
        ...(stale.length ? [`${stale.length} staleness finding(s). Stale is not wrong: the fix is re-reading the source, never stamping last_verified.`] : []),
        `Confirm the unverified-record count in "node tools/validate.mjs" is unchanged by anything you apply, or say which record moved and why. It stands at 106 in the docs/CURRENT-ARCHITECTURE.md §12 baseline, and ${unsupported.length} claim(s) in this corpus carry a finding from this run's own check.`,
      ],
      risk: substantive.length ? 'high' : 'medium',
      consequence: substantive.length
        ? 'A wrongly approved source record puts a document in the bibliography that the corpus will cite from then on, at a tier nobody checked; a wrongly approved claim makes the site assert something the brief does not say. Both are read by people who may act on what this site says about EU law.'
        : 'A wrongly approved attachment puts a citation under a sentence the source does not support, and raises the derived evidence grade a reader uses to judge how much to trust it. The grade is computed from the sources, so a wrong source is a wrong grade.',
    });

    b.fact(null, true, `${proposals.length} DataProposal record(s) were produced in this run, ${substantive.length} of them substantive, and none has been applied.`, ['ev-proposals']);
    b.openNull(null, 'Are the matched claims and sources the right ones?',
      'A human reading each matched pair. Every match names the strategy that made it and the score on this matcher\'s own scale; none of those numbers is a probability that two records are the same thing.',
      { blocks: true });

    return this.#ship(span, b.build(), proposals.map((p) => p.proposal_id));
  }

  #runRecord(span, { task, started_at, ended_at, verifications, links, proposals, gaps, conflicts, unsupported, unsupportedTally, stale, untouched, approval }) {
    const b = this.#builder('AgentRun', span);
    b.addEvidence({
      evidence_id: 'ev-run', kind: 'measurement',
      source_id: null, url: null, locator: 'this run', title: null, publisher: null,
      quote: null, retrieved_at: ended_at, checksum: null,
      supports: 'supports:direct', role: 'primary', simulated: this.simulated,
    });

    const blocking = gaps.some((g) => g.blocking === true);

    b.set('run_id', span.span_id);
    b.set('parent_run_id', span.parent_run_id);
    b.set('task', task);
    b.set('started_at', started_at);
    b.set('ended_at', ended_at);
    b.set('status', 'ok');
    b.set('inputs', { verifications: verifications.length, as_of: this.asOf, claims: this.corpus.claims.length, sources: this.corpus.sources.length });
    b.set('outputs', {
      links: links.length,
      proposals: proposals.length,
      substantive_proposals: proposals.filter((p) => p.substantive === true).length,
      gaps: gaps.length,
      conflicts: conflicts.length,
      stale_findings: stale.length,
      unsupported_claims: unsupportedTally,
      refused: this.refused.length,
      applied: 0,
    });
    b.set('produced', [
      ...links.map((r) => ({ contract: 'ClaimEvidence', id: r.link_id })),
      ...proposals.map((r) => ({ contract: 'DataProposal', id: r.proposal_id })),
      ...gaps.map((r) => ({ contract: 'DataGap', id: r.gap_id })),
      ...(approval ? [{ contract: 'ApprovalRequest', id: approval.approval_id }] : []),
    ]);
    /* The run itself touched nothing. What each proposal is ABOUT
       lives on that proposal; claiming the run touched those records
       would be claiming it changed them. */
    b.set('affected_entities', []);
    b.set('autonomy_class', blocking ? 'review_required' : 'autonomous');
    b.set('confidence', proposals.length ? 0.6 : 0.4);
    b.set('risk', 'low');
    b.set('handed_off_to', approval ? [this.requestedOf] : []);

    b.fact(null, untouched,
      `The run began at ${started_at} and finished at ${ended_at}. It read data/ and wrote nothing to it: ${untouched ? 'every dataset\'s verification dates are identical before and after, and no module in agent/integrate/ contains a write call' : 'THE DATASETS CHANGED DURING THIS RUN, which this layer has no code path to do — treat every record it produced as suspect'}.`,
      ['ev-run']);
    b.inference(null, undefined,
      `${proposals.length} proposal(s), ${links.length} evidence link(s), ${gaps.length} gap(s) and ${conflicts.length} conflict(s) came out of ${verifications.length} verification(s).`,
      ['ev-run'],
      'Counted from the records this run produced. Every proposal passed both gates — its contract in agent/schemas/validate.mjs, and agent/integrate/preserve.mjs against the corpus it would change — or it was refused and not stored.');
    b.openNull(null, 'Has any of this been applied?',
      'A human applying it, recorded as a ChangeRecord behind the ApprovalRequest. Nothing here applies anything, and the count of applied changes in this record is zero by construction rather than by outcome.',
      { blocks: blocking });

    if (unsupported.length) {
      b.inference(null, undefined,
        `${unsupported.length} claim(s) in the corpus carry a finding from the unsupported check, of which ${unsupportedTally.of_which_arguments} are argument-family claims that no citation could settle.`,
        ['ev-run'],
        'Computed with js/format.js\'s own familyOf and evidenceGrade rather than a second implementation of either. The two figures are reported apart and never summed: an interpretation short of a source and a fact short of a citation are different states, and DATA-GOVERNANCE §2 prohibits collapsing them.');
    }

    return this.#ship(span, b.build());
  }
}

const tally = (xs) => xs.reduce((acc, x) => ({ ...acc, [x]: (acc[x] ?? 0) + 1 }), {});
