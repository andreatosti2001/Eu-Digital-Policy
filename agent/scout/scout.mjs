/* ============================================================
   agent/scout/scout.mjs — the Scout

   The first real agent in this repository. Given a statement already
   present in the brief, it goes looking for the sources that
   statement rests on, and reports what it found and what it did not.

   IT IS READ-ONLY, and that is a design property rather than a
   promise. It opens `data/*.json` for reading and never for writing;
   it emits `SourceCandidate` and `DataGap` and nothing else in the
   finding family; it produces no `VerificationRecord`, because
   verifying is the Verifier's contract and an agent that verifies
   its own findings has verified nothing; and it produces no proposal
   of any kind, because proposing a change to the corpus is not what
   scouting is.

   THE ONE THING IT WILL NOT DO. When it cannot retrieve a document,
   it records a `DataGap` naming what is missing and which kind of
   absence it is. It does not substitute the corpus's own recorded
   metadata for the document and call the question closed, and it
   does not reach for something related that looks resolved. Under
   AI-SAFE-BOUNDARIES §0.2 a plausible substitute is worse than an
   admitted gap, because it looks settled.

   WHAT IT IS CAREFUL TO KEEP APART. Two things it can genuinely
   establish, and they are not the same thing:

     · what `data/sources.json` RECORDS about a document — a fact
       about the corpus, evidenced by the corpus, at a real locator;
     · what the DOCUMENT says — a fact about the world, which
       requires having opened it.

   Only the first is available when retrieval fails. So every
   candidate the Scout emits in that state cites `dataset_record`
   evidence rather than `retrieved_document`, states its facts as
   facts about the corpus in so many words, carries
   `url_status: "url:unchecked"`, and is filed as `duplicate` of the
   source record it came from — it is not a new find, and it must
   never read as one.
   ============================================================ */

import { emit } from '../schemas/gateway.mjs';
import { CURRENT_CONTRACT_VERSION } from '../schemas/common.mjs';
import { ContractStore } from '../schemas/store.mjs';
import { Tracer } from '../observability/tracer.mjs';
import * as corpus from './corpus.mjs';
import { attempt, explain, failed } from './retrieve.mjs';

export const AGENT = 'scout';

/** What this agent is allowed to act under. The Scout touches the
 *  legal record — its records are ABOUT claims and sources — so
 *  `autonomous` is refused by the validator and would be wrong if it
 *  were not: nothing it produces is actionable without review. */
const AUTONOMY = 'review_required';

const nowIso = () => new Date().toISOString();

/* ---------------------------------------------------------- records */

/** The envelope, once. Every record the Scout emits carries it, and
 *  `simulated` is false without exception: nothing outside
 *  fixtures.mjs may be marked simulated, so these records are real or
 *  they are not written. */
function envelope(contract, span, extra) {
  return {
    contract,
    contract_version: CURRENT_CONTRACT_VERSION,
    agent: AGENT,
    created_at: nowIso(),
    affected_entities: [],
    evidence: [],
    epistemic: { fact: [], inference: [], interpretation: [], unresolved: [] },
    trace_ref: { trace_id: span.trace_id, span_id: span.span_id, run_id: span.run_id },
    simulated: false,
    ...extra,
  };
}

const entity = (kind, id, path, note = null, field = null) => ({ kind, id, path, field, note });

/**
 * The corpus record the Scout actually read, as an evidence
 * reference. `dataset_record`, never `retrieved_document`: this is
 * the corpus's account of a document, at a locator a reviewer can
 * open, with the checksum of the file as read.
 */
const corpusEvidence = (evidence_id, src) => ({
  evidence_id,
  kind: 'dataset_record',
  source_id: src.id,
  url: null,
  locator: src._locator,
  title: null,
  publisher: null,
  quote: null,
  retrieved_at: src._dataset.read_at,
  checksum: src._dataset.checksum,
  /* Direct, because every fact citing it is a fact ABOUT THE CORPUS
     — "sources.json records X" — which the corpus record does
     establish outright. It is never cited for a fact about the law. */
  supports: 'supports:direct',
  /* The provenance role of the underlying document is exactly what
     this agent failed to establish. Claiming one here would be the
     inference the whole record exists to avoid making. */
  role: 'unresolved',
  simulated: false,
});

/** The claim record itself, read from the repository. */
const claimEvidence = (evidence_id, cl) => ({
  evidence_id,
  kind: 'repository_file',
  source_id: null,
  url: null,
  locator: cl._locator,
  title: null,
  publisher: null,
  quote: cl.statement.slice(0, 2000),
  retrieved_at: cl._dataset.read_at,
  checksum: cl._dataset.checksum,
  supports: 'supports:direct',
  role: 'unresolved',
  simulated: false,
});

/**
 * The retrieval attempt. Its KIND is the outcome: a document that
 * actually arrived is `retrieved_document`, with the URL, the time
 * and the checksum over the bytes received. An attempt that did not
 * arrive is a `measurement` — something this run timed and counted
 * about its own reach, and nothing whatever about a document.
 *
 * The distinction is not cosmetic. A Verifier selecting the evidence
 * it can actually open will filter on `retrieved_document`, and an
 * attempt that failed must never appear in that set.
 */
const attemptEvidence = (evidence_id, outcome) => {
  const got = outcome.outcome === 'retrieved';
  return {
    evidence_id,
    kind: got ? 'retrieved_document' : 'measurement',
    source_id: null,
    url: got ? outcome.final_url : null,
    locator: got ? null : `retrieval attempt: ${outcome.url}`,
    title: got ? outcome.title : null,
    publisher: null,
    quote: null,
    retrieved_at: outcome.attempted_at,
    checksum: outcome.checksum,
    /* Direct for what it is cited for: what this run retrieved, or
       what it measured about its own reach. */
    supports: 'supports:direct',
    role: 'unresolved',
    simulated: false,
  };
};

/** Nothing was retrieved, and the record says so in its own body. */
const absentEvidence = (evidence_id) => ({
  evidence_id,
  kind: 'absent',
  source_id: null,
  url: null,
  locator: null,
  title: null,
  publisher: null,
  quote: null,
  retrieved_at: null,
  checksum: null,
  supports: null,
  role: 'unresolved',
  simulated: false,
});

/* ---------------------------------------------------------- the agent */

/**
 * Scout one claim.
 *
 * @param {{claim_id:string, tracer?:Tracer, store?:object,
 *          fetchImpl?:Function, timeoutMs?:number}} opts
 * @returns {Promise<object>} the run's own summary, plus every record
 *   it produced — already validated, already stored.
 */
export async function scoutClaim({ claim_id, tracer = new Tracer({ service: 'eu-digital-policy' }), store = new ContractStore(), fetchImpl, timeoutMs } = {}) {
  const started_at = nowIso();
  const task = `Scout the sources for claim ${claim_id}: retrieve what the corpus cites for it, and record what could not be retrieved.`;

  const run = tracer.startRun({ kind: 'agent', agent: AGENT, task, inputs: { claim_id } });
  const produced = [];
  const records = [];
  let n = 0;
  const mint = (prefix) => `${prefix}-${run.span_id.slice(0, 8)}-${++n}`;

  /** Both halves of the gate, and nothing else writes a record. */
  const publish = (span, record) => {
    emit(span, record);
    store.append(run.trace_id, record);
    const contract = record.contract;
    const id = record[contract === 'SourceCandidate' ? 'candidate_id'
      : contract === 'DataGap' ? 'gap_id'
        : contract === 'AgentObservation' ? 'observation_id' : 'run_id'];
    produced.push({ contract, id });
    records.push(record);
    return record;
  };

  try {
    /* ---------------------------------------- 1. read the claim */

    /* Spans below close themselves with an explicit, compact output.
       Letting `step` capture a return value wholesale is how a
       document body or a parsed dataset ends up copied into the
       trace, and the trace is not a second home for either. */
    const cl = await run.step(
      { kind: 'tool', name: 'corpus.claim', inputs: { claim_id }, captureOutput: false },
      async (span) => {
        const found = corpus.claim(claim_id);
        span.end({
          status: found ? 'ok' : 'failed',
          outputs: found
            ? { claim_id: found.id, type: found.type, cites: (found.sources ?? []).map((s) => s.source_id), locator: found._locator }
            : { claim_id, found: false },
        });
        return found;
      },
    );

    if (!cl) {
      /* Not a gap in the corpus — a bad instruction to this agent.
         It is an error, and it is recorded as one rather than as a
         finding about EU law. */
      const err = new Error(`no claim "${claim_id}" in data/claims.json`);
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }

    const plan = corpus.retrievalPlan(cl);

    publish(run, envelope('AgentObservation', run, {
      observation_id: mint('obs'),
      subject: `what data/claims.json cites for ${cl.id}`,
      summary: `Claim ${cl.id} cites ${plan.cited.length} source(s): ${plan.retrievable.length} with a URL to retrieve, ${plan.placeholders.length} resolving to the brief's own placeholder, ${plan.unfetchable.length} with no URL recorded, ${plan.dangling.length} not present in data/sources.json.`,
      data: {
        claim_id: cl.id,
        claim_type: cl.type,
        cited: plan.cited.map((c) => c.source_id),
        retrievable: plan.retrievable.map((c) => c.source_id),
        placeholders: plan.placeholders.map((c) => c.source_id),
        unfetchable: plan.unfetchable.map((c) => c.source_id),
        dangling: plan.dangling.map((c) => c.source_id),
      },
      confidence: 1,
      risk: 'low',
      refs: [cl.id, ...plan.cited.map((c) => c.source_id)],
      supersedes: null,
      affected_entities: [entity('claim', cl.id, cl._dataset.path, 'the statement being scouted')],
      evidence: [claimEvidence('ev-claim', cl)],
      epistemic: {
        fact: [{
          field: null,
          statement: `data/claims.json, at ${cl._locator}, records claim ${cl.id} as citing: ${plan.cited.map((c) => c.source_id).join(', ') || 'no sources at all'}.`,
          evidence_refs: ['ev-claim'],
        }],
        inference: [], interpretation: [], unresolved: [],
      },
    }));

    /* ------------------------- 2. attempt every retrievable source */

    const outcomes = [];

    for (const target of plan.retrievable) {
      const src = target.source;

      const outcome = await run.step(
        { kind: 'retriever', name: 'http.get', inputs: { url: src.recorded_url, source_id: src.id }, captureOutput: false },
        async (span) => {
          const got = await attempt(src.recorded_url, { fetchImpl, timeoutMs });
          /* The body is deliberately not in the span output. What a
             document says belongs in a record that cites it, not in a
             trace line nothing validates. */
          span.end({
            status: 'ok',
            outputs: { outcome: got.outcome, status: got.status, bytes: got.bytes, checksum: got.checksum, final_url: got.final_url, attempted_at: got.attempted_at, detail: got.detail },
          });
          span.usage({ latency_ms: got.elapsed_ms });
          return got;
        },
      );
      outcomes.push({ target, outcome });

      /* Real provenance, in the viewer, with a real locator and a
         real retrieved_at. The url is carried only where the
         document was actually fetched: a provenance record showing a
         URL this agent never opened is exactly the thing that reads
         as research and is not. */
      run.provenance({
        source_id: src.id,
        role: 'unresolved',
        url: outcome.outcome === 'retrieved' ? outcome.final_url : null,
        title: null,
        publisher: null,
        locator: src._locator,
        retrieved_at: outcome.outcome === 'retrieved' ? outcome.attempted_at : src._dataset.read_at,
        content_sha256: outcome.checksum,
        quote: null,
        verification: null,
        claim_ids: [cl.id],
        instrument_ids: cl.instruments ?? [],
        simulated: false,
      });

      if (failed(outcome)) {
        run.decide({
          decision: `Record a DataGap for ${src.id} rather than treat the corpus's recorded metadata as a retrieved document.`,
          rationale: `${explain(outcome)} What data/sources.json records about this document is a fact about the corpus, not about the document. Closing the question with it would be a plausible substitute, which AI-SAFE-BOUNDARIES §0.2 prohibits outright.`,
          alternatives: [
            'Accept the corpus\'s recorded title, publisher and date as verified — rejected: nothing in this run opened the document.',
            'Mark url_status "url:dead" — rejected: the attempt establishes nothing about the URL, only about this agent\'s reach.',
            'Substitute a different, reachable document on the same subject — rejected outright: that is the substitution this project is built against.',
          ],
          confidence: 1,
          risk: 'medium',
          inputs_ref: [src.id, cl.id],
        });
      }

      publish(run, sourceCandidateFor({ run, mint, cl, target, outcome }));
      publish(run, retrievalGapFor({ run, mint, cl, target, outcome }));
    }

    /* --------------- 3. sources the corpus itself says are absent */

    for (const target of plan.placeholders) {
      publish(run, placeholderGapFor({ run, mint, cl, target }));
    }
    for (const target of plan.dangling) {
      publish(run, danglingGapFor({ run, mint, cl, target }));
    }

    /* ---------------------------------------- 4. what the run found */

    const retrieved = outcomes.filter((o) => !failed(o.outcome));
    const byOutcome = outcomes.reduce((acc, o) => ({ ...acc, [o.outcome.outcome]: (acc[o.outcome.outcome] ?? 0) + 1 }), {});

    const attemptEv = outcomes.map((o, i) => attemptEvidence(`ev-attempt-${i + 1}`, o.outcome));

    publish(run, envelope('AgentObservation', run, {
      observation_id: mint('obs'),
      subject: 'what this run could and could not retrieve',
      summary: outcomes.length === 0
        ? `No retrieval was attempted for ${cl.id}: the corpus records no citable URL for any source it cites.`
        : `${retrieved.length} of ${outcomes.length} cited document(s) were retrieved. Outcomes: ${Object.entries(byOutcome).map(([k, v]) => `${k}=${v}`).join(', ')}.`,
      data: { claim_id: cl.id, attempts: outcomes.length, retrieved: retrieved.length, by_outcome: byOutcome, details: outcomes.map((o) => ({ source_id: o.target.source_id, url: o.outcome.url, outcome: o.outcome.outcome, status: o.outcome.status, attempted_at: o.outcome.attempted_at })) },
      confidence: 1,
      risk: outcomes.length && retrieved.length === 0 ? 'medium' : 'low',
      refs: outcomes.map((o) => o.target.source_id),
      supersedes: null,
      affected_entities: [entity('claim', cl.id, cl._dataset.path, 'the statement being scouted')],
      evidence: attemptEv.length ? attemptEv : [absentEvidence('ev-absent')],
      epistemic: {
        fact: attemptEv.length
          ? [{
            field: null,
            statement: `This run attempted ${outcomes.length} HTTP retrieval(s) and completed ${retrieved.length}. Per-attempt outcomes: ${outcomes.map((o) => `${o.target.source_id} → ${o.outcome.outcome}${o.outcome.status ? ` (HTTP ${o.outcome.status})` : ''}`).join('; ')}.`,
            evidence_refs: attemptEv.map((e) => e.evidence_id),
          }]
          : [],
        inference: [],
        interpretation: [],
        unresolved: attemptEv.length && retrieved.length === 0
          ? [{
            field: null,
            question: `Do the documents data/claims.json cites for ${cl.id} say what the claim says they say?`,
            missing: 'The documents themselves, retrieved and read. Every attempt in this run was refused before any document was reached.',
            absence_kind: 'retrieval_failed',
            blocks: true,
          }]
          : [{
            field: null,
            question: `Do the retrieved documents actually support ${cl.id}?`,
            missing: 'A VerificationRecord. Retrieving a document establishes that it exists, not that it says what the claim says it says.',
            absence_kind: 'null_not_researched',
            blocks: false,
          }],
      },
    }));

    /* ---------------------------------------- 5. the run's account */

    const ended_at = nowIso();
    const runRecord = envelope('AgentRun', run, {
      run_id: run.span_id,
      parent_run_id: null,
      task,
      started_at,
      ended_at,
      status: 'ok',
      inputs: { claim_id },
      outputs: {
        candidates: produced.filter((p) => p.contract === 'SourceCandidate').length,
        gaps: produced.filter((p) => p.contract === 'DataGap').length,
        documents_retrieved: retrieved.length,
        attempts: outcomes.length,
      },
      produced: [...produced],
      autonomy_class: AUTONOMY,
      confidence: 1,
      /* Medium, not low: the Scout's output is what a Verifier acts
         on next, and a candidate that read as verified would send it
         to the wrong place. */
      risk: 'medium',
      handed_off_to: [],
      affected_entities: [entity('claim', cl.id, cl._dataset.path, 'the statement scouted in this run')],
      evidence: [claimEvidence('ev-claim', cl), ...attemptEv],
      epistemic: {
        fact: [{
          field: null,
          statement: `This run read ${cl._locator} and attempted ${outcomes.length} retrieval(s), of which ${retrieved.length} completed.`,
          evidence_refs: ['ev-claim', ...attemptEv.map((e) => e.evidence_id)],
        }],
        inference: [],
        interpretation: [],
        unresolved: [{
          field: null,
          question: `Is claim ${cl.id} supported by the sources the corpus cites for it?`,
          missing: 'Verification of each cited source against the document it names. Scouting locates and reports; it does not verify, and no record in this run asserts that any source supports the claim.',
          absence_kind: retrieved.length === 0 && outcomes.length > 0 ? 'retrieval_failed' : 'null_not_researched',
          blocks: false,
        }],
      },
    });
    publish(run, runRecord);

    run.end({
      status: 'ok',
      outputs: runRecord.outputs,
      confidence: 1,
      risk: 'medium',
    });

    return {
      trace_id: run.trace_id,
      run_id: run.span_id,
      claim_id,
      records,
      produced,
      outcomes: outcomes.map((o) => ({ source_id: o.target.source_id, ...o.outcome, body: undefined })),
      store_path: store.path ? store.path(run.trace_id) : null,
    };
  } catch (err) {
    if (!run.ended) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
    }
    throw err;
  }
}

/* ---------------------------------------------------------- builders */

/**
 * A candidate for a source the corpus already cites.
 *
 * Filed as `duplicate` of the existing source record, because that
 * is what it is. `proposed` would say the Scout had found something
 * new, and it has not: it re-derived a citation the corpus already
 * holds and, in this environment, could not open the document behind
 * it.
 */
function sourceCandidateFor({ run, mint, cl, target, outcome }) {
  const src = target.source;
  const got = !failed(outcome);

  const evidence = [corpusEvidence('ev-corpus', src), attemptEvidence('ev-attempt', outcome)];
  const fact = [];
  const unresolved = [];

  /* What the corpus records — a fact about the corpus, stated as
     one, and never as a fact about the document. */
  const recorded = [
    ['title', src.recorded_title],
    ['publisher', src.recorded_publisher],
    ['publication_date', src.recorded_published],
    ['source_type', src.recorded_type],
  ];
  for (const [field, value] of recorded) {
    if (value === null || value === undefined) continue;
    fact.push({
      field,
      statement: got
        ? `At ${src._locator}, the corpus records the ${field.replace('_', ' ')} of ${src.id} as ${JSON.stringify(value)}.`
        : `At ${src._locator}, the corpus records the ${field.replace('_', ' ')} of ${src.id} as ${JSON.stringify(value)}. This agent did not open the document, so this is what the corpus asserts and not what the document shows.`,
      evidence_refs: ['ev-corpus'],
    });
  }

  if (got && outcome.title) {
    fact.push({
      field: null,
      statement: `The document retrieved from ${outcome.final_url} carries the HTML title ${JSON.stringify(outcome.title)}.`,
      evidence_refs: ['ev-attempt'],
    });
  }

  if (!got) {
    unresolved.push({
      field: 'url_status',
      question: `Is ${src.recorded_url} live?`,
      missing: 'A completed request to that URL. This run\'s attempt was stopped before the origin was reached, so nothing about the URL was established either way.',
      absence_kind: 'retrieval_failed',
      blocks: false,
    }, {
      field: 'tier_estimate',
      question: `Which evidence tier does the document at ${src.recorded_url} belong in?`,
      missing: 'The document itself. A tier estimate is a judgment about a document that has been read, and this one has not been.',
      absence_kind: 'retrieval_failed',
      blocks: false,
    });
  }

  return envelope('SourceCandidate', run, {
    candidate_id: mint('sc'),
    url: src.recorded_url,
    locator: target.locator_in_source,
    title: src.recorded_title,
    publisher: src.recorded_publisher,
    publication_date: src.recorded_published,
    source_type: src.recorded_type,
    /* Never "url:live" on an attempt that never reached the origin.
       Never "url:dead" either — that would be a claim about the URL
       made out of a failure of this agent's own network. */
    url_status: got ? 'url:live' : 'url:unchecked',
    tier_estimate: null,
    relevance: got
      ? `data/claims.json cites ${src.id} in support of ${cl.id}, and the document at that URL was retrieved in this run. Whether it in fact supports the claim is a verification question and is untouched here.`
      : `data/claims.json cites ${src.id} in support of ${cl.id}, so it is where a verifier should look first. This candidate records that citation and the corpus's account of the document; it establishes nothing about the document, which this run could not open.`,
    matches_existing_source_id: src.id,
    verification_ref: null,
    /* It duplicates a record the corpus already holds. Saying
       otherwise would present a re-read of sources.json as a find. */
    state: 'duplicate',
    affected_entities: [
      entity('claim', cl.id, cl._dataset.path, 'the statement this source is cited for'),
      entity('source', src.id, src._dataset.path, 'the source record this candidate duplicates'),
    ],
    evidence,
    epistemic: {
      fact,
      inference: [],
      interpretation: [{
        field: 'relevance',
        statement: got
          ? `The document retrieved is worth a verifier's attention for ${cl.id} because the corpus already cites it there.`
          : `The corpus's own citation is the best available lead for ${cl.id}, and it is a lead rather than evidence until the document is opened.`,
        held_by: AGENT,
        basis: `data/claims.json records ${src.id} among the sources for ${cl.id} with supports=${JSON.stringify(target.supports)}. That the corpus cites it is a fact; that it is the right place to look is this agent's reading.`,
        contested: false,
      }],
      unresolved,
    },
  });
}

/** The gap left by a retrieval that did not complete. */
function retrievalGapFor({ run, mint, cl, target, outcome }) {
  const src = target.source;
  const got = !failed(outcome);

  /* A retrieval that succeeded still leaves a gap — the document has
     been fetched, not read against the claim — but it is a different
     gap, and it is not a retrieval failure. */
  const gap_kind = got ? 'unverified_record' : 'retrieval_blocked';
  const absence_kind = got ? 'null_not_researched' : 'retrieval_failed';

  return envelope('DataGap', run, {
    gap_id: mint('gap'),
    gap_kind,
    absence_kind,
    what_is_missing: got
      ? `A check that the document at ${src.recorded_url}, cited for ${cl.id} as ${src.id}, states what ${cl.id} says it states. The document was retrieved in this run; it was not read against the claim.`
      : `The document at ${src.recorded_url}, which data/claims.json cites as ${src.id} in support of ${cl.id}. It was not retrieved in this run, and nothing in this run establishes anything about its contents.`,
    why_open: got
      ? 'Retrieval is not verification. Reading the document against the claim is the Verifier\'s contract, and this agent does not hold it.'
      : explain(outcome),
    closes_with: got
      ? `A VerificationRecord comparing the retrieved document against the wording of ${cl.id}.`
      : `Retrieving ${src.recorded_url} from an environment permitted to reach ${hostOf(src.recorded_url)}, and reading it against ${cl.id}. Nothing else closes it: a different document on the same subject would be a substitute, not a source.`,
    candidate_leads: [
      `${src.recorded_url} — the URL data/sources.json records for ${src.id}. A lead, and not evidence: nothing in this run opened it.`,
      `${src._locator} — the corpus's own record of this source, including its recorded tier and note.`,
    ],
    blocking: !got,
    first_seen_at: outcome.attempted_at,
    last_reviewed_at: outcome.attempted_at,
    state: 'open',
    closed_by: null,
    affected_entities: [
      entity('claim', cl.id, cl._dataset.path, 'the statement whose support is unestablished'),
      entity('source', src.id, src._dataset.path, 'the source that could not be checked'),
    ],
    evidence: got
      ? [corpusEvidence('ev-corpus', src), attemptEvidence('ev-attempt', outcome)]
      : [absentEvidence('ev-absent'), corpusEvidence('ev-corpus', src), attemptEvidence('ev-attempt', outcome)],
    epistemic: {
      fact: [], inference: [], interpretation: [],
      unresolved: [{
        field: null,
        question: got
          ? `Does the document retrieved for ${src.id} support ${cl.id}?`
          : `What does the document at ${src.recorded_url} say, and does it support ${cl.id}?`,
        missing: got
          ? 'A reading of the retrieved document against the claim, recorded as a VerificationRecord.'
          : 'The document itself. It is published at a citable URL; this agent could not reach it.',
        absence_kind,
        blocks: !got,
      }],
    },
  });
}

/**
 * The corpus says outright that no external source was located. That
 * is not a retrieval failure and must not be filed as one — nobody
 * has looked, which is the first kind of absence and the honest one.
 */
function placeholderGapFor({ run, mint, cl, target }) {
  const src = target.source;
  return envelope('DataGap', run, {
    gap_id: mint('gap'),
    gap_kind: 'missing_source',
    absence_kind: 'null_not_researched',
    what_is_missing: `An external source for ${cl.id}. The only source data/claims.json cites for it is ${src.id}, which data/sources.json marks as the brief's own placeholder — its own note says it stands in "where no external source has yet been located".`,
    why_open: `No external publication has been identified for this statement. The claim currently rests on the brief asserting it${cl.verification_note ? `; the corpus's own note reads: ${JSON.stringify(cl.verification_note)}` : ''}.`,
    closes_with: `Locating a published source that states what ${cl.id} states, recording it in data/sources.json by hand, and verifying the claim against it. Creating that source record from anything other than a retrieved document is red tier under AI-SAFE-BOUNDARIES §3.`,
    candidate_leads: [
      `${cl._locator} — the claim, its type (${cl.type}) and the instruments it names: ${(cl.instruments ?? []).join(', ') || 'none'}.`,
      ...(cl.legal_basis ?? []).map((b) => `${b} — a legal basis the claim names; the instrument's own text is where a source would start.`),
    ],
    blocking: false,
    first_seen_at: nowIso(),
    last_reviewed_at: nowIso(),
    state: 'open',
    closed_by: null,
    affected_entities: [
      entity('claim', cl.id, cl._dataset.path, 'the statement with no external source'),
      entity('source', src.id, src._dataset.path, 'the placeholder standing in for one'),
    ],
    evidence: [absentEvidence('ev-absent'), claimEvidence('ev-claim', cl), corpusEvidence('ev-corpus', src)],
    epistemic: {
      fact: [], inference: [], interpretation: [],
      unresolved: [{
        field: null,
        question: `Which published source states what ${cl.id} states?`,
        missing: 'A publication that can be cited for it. None has been identified, and this run did not identify one.',
        absence_kind: 'null_not_researched',
        blocks: false,
      }],
    },
  });
}

/** A citation pointing at a source record that is not there. */
function danglingGapFor({ run, mint, cl, target }) {
  return envelope('DataGap', run, {
    gap_id: mint('gap'),
    gap_kind: 'missing_source',
    absence_kind: 'null_not_researched',
    what_is_missing: `data/claims.json cites source id ${JSON.stringify(target.source_id)} for ${cl.id}, and data/sources.json holds no record with that id.`,
    why_open: 'The citation does not resolve. Whether the source record was renamed, removed, or never written is not established by this run.',
    closes_with: `Either a source record with that id in data/sources.json, or a correction to the citation in ${cl._locator}. Which one is right is the author's call and is not an agent\'s to decide.`,
    candidate_leads: [`${cl._locator} — the citation that does not resolve.`],
    blocking: false,
    first_seen_at: nowIso(),
    last_reviewed_at: nowIso(),
    state: 'open',
    closed_by: null,
    affected_entities: [entity('claim', cl.id, cl._dataset.path, 'the claim carrying an unresolved citation')],
    evidence: [absentEvidence('ev-absent'), claimEvidence('ev-claim', cl)],
    epistemic: {
      fact: [], inference: [], interpretation: [],
      unresolved: [{
        field: null,
        question: `What source is ${JSON.stringify(target.source_id)} meant to name?`,
        missing: 'A source record with that id, or a corrected citation.',
        absence_kind: 'null_not_researched',
        blocks: false,
      }],
    },
  });
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return 'the host it names'; }
}
