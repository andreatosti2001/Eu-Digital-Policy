/* ============================================================
   agent/integrate/fixtures.mjs — the adversarial cases this adapter
   was built against

   THE ADDRESSES AND IDS ARE READ OUT OF data/, NOT TYPED IN HERE.
   A matcher fixture has to present something that actually
   corresponds to a canonical record or it tests nothing — and a
   fixture that typed a EUR-Lex URL by hand would be a legal address
   authored from model knowledge, which is prohibited outright
   whatever it is for. So every real id and every real URL below is
   looked up from the corpus at load. The fixtures cannot invent one,
   and if a record is renamed the fixtures fail loudly instead of
   quietly testing nothing.

   EVERYTHING ELSE IS UNMISTAKABLY SIMULATED. Every record carries
   `simulated: true`, every quote says so in its own words, and
   `validate()` refuses a simulated record unless the caller asks for
   one. Nothing here is a legal fact or a real verification. What the
   fixtures assert is only ever "this address is already in
   data/sources.json", which is a fact about this repository rather
   than about EU law.

   THIRTEEN CASES, chosen because each one breaks a different thing:

     A  a claim and a source that both resolve — the ordinary path
     B  a source the claim already cites — nothing may be attached twice
     C  a confirmed verdict on context evidence — a citation is not created
     D  partially_confirmed on direct evidence — the qualifier weakens
     E  a document no source record carries, read — create_source
     F  a document nothing read — no source record may be founded
     G  a proposition no claim carries — create_claim, blocked
     H  two claims declared — ambiguous, and nothing is picked
     I  same host and path, different query — ambiguous, not a match
     J  a date that disagrees with data/timeline.json
     K  a contradicted verdict against a claim the brief makes
     L  a conflict verdict the Verifier already reached
     M  a recheck date that has passed, and a superseded record
   ============================================================ */

import { loadCorpus } from './canonical.mjs';

const TRACE = 'ab'.repeat(16);
const SPAN = 'cd'.repeat(8);
const RUN = 'ef'.repeat(8);

export const FIXTURE_NOW = '2026-09-02T11:00:00.000Z';
export const FIXTURE_AS_OF = '2026-09-02';

const empty = () => ({ fact: [], inference: [], interpretation: [], unresolved: [] });

/** Look a real record up, and throw rather than silently degrade if
 *  it is not there. A fixture quietly testing nothing is worse than
 *  a fixture that fails. */
function must(map, id, what) {
  const v = map.get(id);
  if (!v) throw new Error(`agent/integrate/fixtures.mjs expects ${what} "${id}" to exist in data/. It does not — either it was renamed, which this repository says never happens, or the fixture is out of date. Fix the fixture; do not add the record.`);
  return v;
}

/** A retrieved-document evidence entry. `url` is supplied by the
 *  caller from a corpus lookup or is deliberately `.invalid`. */
export const doc = (id, { url, locator = null, title, publisher, quote, supports = 'supports:direct', role = 'primary', checksum = null }) => ({
  evidence_id: id,
  kind: 'retrieved_document',
  source_id: null,
  url,
  locator,
  title,
  publisher,
  quote,
  retrieved_at: FIXTURE_NOW,
  checksum,
  supports,
  role,
  simulated: true,
});

/**
 * A VerificationRecord with the envelope filled in and every field
 * the contract requires present. Overrides go on top; the epistemic
 * entries are the caller's, because a fixture whose block was
 * generated would not exercise the rules that hold the block to the
 * fields.
 */
export function ver(over = {}) {
  return {
    contract: 'VerificationRecord',
    contract_version: 1,
    agent: 'legal-verifier',
    created_at: FIXTURE_NOW,
    affected_entities: [],
    evidence: [],
    epistemic: empty(),
    trace_ref: { trace_id: TRACE, span_id: SPAN, run_id: RUN },
    simulated: true,

    verification_id: 'ver-fixture-000',
    statement: 'A simulated proposition.',
    method: 'Read a simulated document and compared its wording against the proposition. Nothing here was retrieved from the network.',
    verdict: 'confirmed',
    confidence: 0.7,
    checked_at: FIXTURE_NOW,
    checked_by_kind: 'agent',
    checked_by: 'legal-verifier',
    document_id: null,
    source_tier: null,
    supporting_location: null,
    legal_status: null,
    publication_date: null,
    entry_into_force_date: null,
    applicability_date: null,
    conflicting_evidence: [],
    residual_gap: null,
    supersedes: null,
    recheck_after: null,
    ...over,
  };
}

const SIM = 'This quote is simulated. It stands in for a passage and states nothing about EU law.';

/**
 * Build the corpus-dependent fixtures. Takes a corpus so the suite
 * can run them against the real data/ and against nothing else.
 */
export function buildFixtures(corpus = loadCorpus()) {
  const dsaClaim = must(corpus.claimById, 'clm-dsa-four-tiers', 'the claim');
  const charterClaim = must(corpus.claimById, 'clm-charter-binds-member-states', 'the claim');
  const art114Claim = must(corpus.claimById, 'clm-art-114-shapes-everything', 'the claim');
  const dsaSource = must(corpus.sourceById, 'src-eurlex-dsa', 'the source');
  const gdprSource = must(corpus.sourceById, 'src-eurlex-gdpr', 'the source');

  /* The DSA claim already cites src-eurlex-dsa. The GDPR source is
     one it does not cite. Both facts are read from the corpus rather
     than assumed, so a data change that broke either assumption
     breaks the fixture instead of the test's meaning. */
  if (!dsaClaim.sources.some((s) => s.source_id === dsaSource.id)) {
    throw new Error('fixture B assumes clm-dsa-four-tiers already cites src-eurlex-dsa, and it no longer does');
  }
  if (dsaClaim.sources.some((s) => s.source_id === gdprSource.id)) {
    throw new Error('fixture A assumes clm-dsa-four-tiers does NOT cite src-eurlex-gdpr, and it now does');
  }

  const claimEntity = (id) => ({ kind: 'claim', id, path: 'data/claims.json', field: null, note: 'The claim this proposition was matched to by the Verifier.' });
  const instrumentEntity = (id) => ({ kind: 'instrument', id, path: 'data/instruments.json', field: null, note: 'The instrument the proposition concerns.' });

  /* --- A · both sides resolve ---------------------------------- */
  const A = ver({
    verification_id: 'ver-fx-a',
    statement: 'A simulated proposition about tiered obligations, matched to an existing claim.',
    verdict: 'confirmed',
    supporting_location: { raw: 'Chapter III', article: null, paragraph: null, page: null },
    source_tier: 'tier:1',
    affected_entities: [claimEntity(art114Claim.id)],
    evidence: [doc('ev-doc', {
      url: gdprSource.url,
      locator: 'Chapter III',
      title: 'A simulated reading of a document already in this bibliography',
      publisher: gdprSource.publisher_name,
      quote: SIM,
    })],
    epistemic: {
      fact: [
        { field: null, statement: 'The simulated passage carries the proposition in the words quoted.', evidence_refs: ['ev-doc'] },
        { field: 'supporting_location', statement: 'The proposition sits at Chapter III of the simulated document.', evidence_refs: ['ev-doc'] },
      ],
      inference: [
        { field: 'verdict', statement: 'The simulated document states the proposition without qualification.', from: ['ev-doc'], method: 'The ordered verdict test in agent/verifier/judge.mjs, run against a simulated passage.' },
        { field: 'source_tier', statement: 'The cited source is being treated as tier:1.', from: ['ev-doc'], method: 'A fixture. Nothing was classified, because nothing was read.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- B · already cited --------------------------------------- */
  const B = ver({
    ...A,
    verification_id: 'ver-fx-b',
    statement: 'A simulated proposition matched to a claim that already cites this exact source.',
    affected_entities: [claimEntity(dsaClaim.id)],
    evidence: [doc('ev-doc', {
      url: dsaSource.url,
      locator: 'Chapter III',
      title: 'A simulated reading of the document this claim already cites',
      publisher: dsaSource.publisher_name,
      quote: SIM,
    })],
  });

  /* --- C · confirmed on context evidence ------------------------ */
  const C = ver({
    verification_id: 'ver-fx-c',
    statement: 'A simulated proposition supported only by context.',
    verdict: 'confirmed',
    source_tier: 'tier:1',
    affected_entities: [claimEntity(art114Claim.id)],
    evidence: [
      doc('ev-direct', { url: gdprSource.url, locator: 'recital 1', title: 'A simulated direct passage', publisher: gdprSource.publisher_name, quote: SIM }),
      doc('ev-context', { url: 'https://commentary.example.invalid/simulated', locator: 'p. 4', title: 'A simulated commentary', publisher: 'A simulated publisher', quote: SIM, supports: 'supports:context', role: 'secondary' }),
    ],
    epistemic: {
      fact: [{ field: null, statement: 'The simulated passage carries the proposition.', evidence_refs: ['ev-direct'] }],
      inference: [
        { field: 'verdict', statement: 'Confirmed against the direct passage.', from: ['ev-direct'], method: 'The ordered verdict test, run against a simulated passage.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-direct'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- D · partially_confirmed on direct evidence --------------- */
  const D = ver({
    verification_id: 'ver-fx-d',
    statement: 'A simulated proposition the passage establishes only in part.',
    verdict: 'partially_confirmed',
    confidence: 0.6,
    source_tier: 'tier:1',
    supporting_location: { raw: 'Article 1', article: '1', paragraph: null, page: null },
    affected_entities: [claimEntity(art114Claim.id)],
    evidence: [doc('ev-doc', {
      url: gdprSource.url, locator: 'Article 1',
      title: 'A simulated passage establishing a narrower case',
      publisher: gdprSource.publisher_name, quote: SIM,
    })],
    epistemic: {
      fact: [{ field: 'supporting_location', statement: 'The proposition sits at Article 1 of the simulated document.', evidence_refs: ['ev-doc'] }],
      inference: [
        { field: 'verdict', statement: 'The passage establishes a narrower case than the proposition states.', from: ['ev-doc'], method: 'The ordered verdict test, run against a simulated passage.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-doc'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- E · a document nothing in the bibliography carries -------- */
  const E = ver({
    verification_id: 'ver-fx-e',
    statement: 'A simulated proposition read from a document this bibliography does not carry.',
    verdict: 'confirmed',
    source_tier: 'tier:2',
    document_id: null,
    supporting_location: { raw: 'section 2', article: null, paragraph: null, page: null },
    affected_entities: [claimEntity(art114Claim.id)],
    evidence: [doc('ev-doc', {
      url: 'https://regulator.example.invalid/simulated-guidance',
      locator: 'section 2',
      title: 'A simulated guidance document, in no bibliography',
      publisher: 'A simulated regulator',
      quote: SIM,
      checksum: 'f'.repeat(64),
    })],
    epistemic: {
      fact: [
        { field: null, statement: 'The simulated document carries the proposition.', evidence_refs: ['ev-doc'] },
        { field: 'supporting_location', statement: 'It sits at section 2.', evidence_refs: ['ev-doc'] },
      ],
      inference: [
        { field: 'verdict', statement: 'Confirmed against the simulated passage.', from: ['ev-doc'], method: 'The ordered verdict test.' },
        { field: 'source_tier', statement: 'Treated as tier:2.', from: ['ev-doc'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- F · nothing was read ------------------------------------- */
  const F = ver({
    verification_id: 'ver-fx-f',
    statement: 'A simulated proposition about a document that never arrived.',
    verdict: 'source_unavailable',
    confidence: 0.9,
    residual_gap: 'The document could not be retrieved, so nothing about the proposition was established. This is not a negative finding about the proposition.',
    affected_entities: [claimEntity(art114Claim.id)],
    evidence: [{
      evidence_id: 'ev-absent', kind: 'absent',
      source_id: null, url: null, locator: null, title: null, publisher: null,
      quote: null, retrieved_at: null, checksum: null,
      supports: null, role: 'unresolved', simulated: true,
    }],
    epistemic: {
      fact: [],
      inference: [{ field: 'verdict', statement: 'The document did not arrive.', from: ['ev-absent'], method: 'The retrieval failed and nothing was read; the verdict follows from the absence rather than from the content.' }],
      interpretation: [],
      unresolved: [{ field: null, question: 'What does the document say?', missing: 'A retrieval that succeeded.', absence_kind: 'null_not_researched', blocks: false }],
    },
  });

  /* --- G · a proposition no claim carries ----------------------- */
  const G = ver({
    verification_id: 'ver-fx-g',
    statement: 'A wholly simulated proposition about the notification cadence of an imaginary supervisory register, which no sentence in this brief makes.',
    verdict: 'confirmed',
    source_tier: 'tier:1',
    supporting_location: { raw: 'Article 9', article: '9', paragraph: null, page: null },
    affected_entities: [],
    evidence: [doc('ev-doc', {
      url: gdprSource.url, locator: 'Article 9',
      title: 'A simulated passage about something the brief does not discuss',
      publisher: gdprSource.publisher_name, quote: SIM,
    })],
    epistemic: {
      fact: [
        { field: null, statement: 'The simulated passage carries the proposition.', evidence_refs: ['ev-doc'] },
        { field: 'supporting_location', statement: 'It sits at Article 9.', evidence_refs: ['ev-doc'] },
      ],
      inference: [
        { field: 'verdict', statement: 'Confirmed against the simulated passage.', from: ['ev-doc'], method: 'The ordered verdict test.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-doc'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- H · two claims declared ---------------------------------- */
  const H = ver({
    ...A,
    verification_id: 'ver-fx-h',
    statement: 'A simulated proposition the Verifier attached to two claims at once.',
    affected_entities: [claimEntity(dsaClaim.id), claimEntity(charterClaim.id)],
  });

  /* --- I · same path, different query --------------------------- */
  const I = ver({
    ...A,
    verification_id: 'ver-fx-i',
    statement: 'A simulated proposition read at an address that shares a path with a recorded source and differs in its parameters.',
    evidence: [doc('ev-doc', {
      url: `${gdprSource.url.split('?')[0]}?uri=CELEX%3A32016R0679-SIMULATED-VARIANT`,
      locator: 'Chapter I',
      title: 'A simulated variant address',
      publisher: gdprSource.publisher_name,
      quote: SIM,
    })],
    epistemic: {
      fact: [{ field: null, statement: 'The simulated passage carries the proposition.', evidence_refs: ['ev-doc'] }],
      inference: [
        { field: 'verdict', statement: 'Confirmed against the simulated passage.', from: ['ev-doc'], method: 'The ordered verdict test.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-doc'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
    supporting_location: null,
  });

  /* --- J · a date that disagrees with the timeline --------------- */
  const dsaForce = must(corpus.eventById, 'tl-dsa-2022-11-16-entry-into-force', 'the timeline event');
  const J = ver({
    verification_id: 'ver-fx-j',
    statement: 'A simulated proposition stating an entry-into-force date that is not the one this repository records.',
    verdict: 'confirmed',
    source_tier: 'tier:1',
    entry_into_force_date: '1 January 2099',
    supporting_location: { raw: 'Article 93', article: '93', paragraph: null, page: null },
    affected_entities: [instrumentEntity('dsa')],
    evidence: [doc('ev-doc', {
      url: dsaSource.url, locator: 'Article 93',
      title: 'A simulated passage stating an impossible date',
      publisher: dsaSource.publisher_name,
      quote: `A simulated sentence. It states 1 January 2099, which data/timeline.json records as ${dsaForce.date}, and both cannot be right.`,
    })],
    epistemic: {
      fact: [
        { field: null, statement: 'The simulated passage carries the proposition.', evidence_refs: ['ev-doc'] },
        { field: 'entry_into_force_date', statement: 'The simulated document states 1 January 2099.', evidence_refs: ['ev-doc'] },
        { field: 'supporting_location', statement: 'It sits at Article 93.', evidence_refs: ['ev-doc'] },
      ],
      inference: [
        { field: 'verdict', statement: 'The simulated passage states the proposition.', from: ['ev-doc'], method: 'The ordered verdict test.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-doc'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- K · contradicted against a claim -------------------------- */
  const K = ver({
    verification_id: 'ver-fx-k',
    statement: 'A simulated proposition the document says otherwise about.',
    verdict: 'contradicted',
    confidence: 0.7,
    source_tier: 'tier:1',
    supporting_location: { raw: 'Article 2', article: '2', paragraph: null, page: null },
    affected_entities: [claimEntity(dsaClaim.id)],
    evidence: [doc('ev-doc', {
      url: dsaSource.url, locator: 'Article 2',
      title: 'A simulated passage stating the opposite',
      publisher: dsaSource.publisher_name, quote: SIM,
    })],
    epistemic: {
      fact: [
        { field: null, statement: 'The simulated passage states the opposite of the proposition.', evidence_refs: ['ev-doc'] },
        { field: 'supporting_location', statement: 'It sits at Article 2.', evidence_refs: ['ev-doc'] },
      ],
      inference: [
        { field: 'verdict', statement: 'The document says otherwise.', from: ['ev-doc'], method: 'The ordered verdict test: a direct contradiction is checked before anything weaker.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-doc'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [],
    },
  });

  /* --- L · a conflict the Verifier already reached --------------- */
  const L = ver({
    verification_id: 'ver-fx-l',
    statement: 'A simulated proposition two simulated authorities state differently.',
    verdict: 'conflict',
    confidence: 0.5,
    residual_gap: 'Two simulated authorities state different values and neither displaces the other. Nothing downstream may treat either as the answer.',
    affected_entities: [instrumentEntity('dma')],
    conflicting_evidence: [{
      evidence_refs: ['ev-side-a', 'ev-side-b'],
      disagreement: 'One simulated document states one value; the other states a different one. Both are recorded in their own words and neither is summarised into the other.',
      unreconciled_because: 'Both simulated sources sit at the same tier and neither outranks the other. Choosing between two regulators is a decision about the law.',
    }],
    evidence: [
      doc('ev-side-a', { url: 'https://side-a.example.invalid/simulated', locator: 'Article 1', title: 'Simulated side A', publisher: 'Simulated authority A', quote: SIM }),
      doc('ev-side-b', { url: 'https://side-b.example.invalid/simulated', locator: 'Article 1', title: 'Simulated side B', publisher: 'Simulated authority B', quote: SIM }),
    ],
    epistemic: {
      fact: [],
      inference: [
        { field: 'verdict', statement: 'Two simulated authorities disagree and neither displaces the other.', from: ['ev-side-a', 'ev-side-b'], method: 'Compared the two stated values; a difference of precision would not have been a conflict, and this is a difference of substance.' },
        { field: 'conflicting_evidence', statement: 'The two evidence entries disagree about the same attribute.', from: ['ev-side-a', 'ev-side-b'], method: 'Grouped by instrument and attribute and compared the printed values, never ranking the sources.' },
      ],
      interpretation: [],
      unresolved: [{ field: null, question: 'Which value governs?', missing: 'A human decision, or a source that displaces one of the two.', absence_kind: 'unknown_not_determinable', blocks: true }],
    },
  });

  /* --- M · a recheck that came due, and a superseded record ------ */
  const M1 = ver({
    ...A,
    verification_id: 'ver-fx-m1',
    statement: 'A simulated proposition whose recheck date has passed.',
    recheck_after: '2026-01-01T00:00:00.000Z',
  });
  const M2 = ver({
    ...A,
    verification_id: 'ver-fx-m2',
    statement: 'A simulated proposition that replaces an earlier check of the same thing.',
    supersedes: 'ver-fx-m1',
  });

  /* --- a record this agent produced itself, refused at intake ---- */
  const SELF = ver({
    ...A,
    verification_id: 'ver-fx-self',
    agent: 'verification-integrator',
    checked_by: 'verification-integrator',
    statement: 'A simulated proposition this integrator claims to have verified itself.',
  });

  return {
    corpus,
    ids: {
      dsaClaim: dsaClaim.id,
      charterClaim: charterClaim.id,
      art114Claim: art114Claim.id,
      dsaSource: dsaSource.id,
      gdprSource: gdprSource.id,
      dsaForceEvent: dsaForce.id,
      dsaForceDate: dsaForce.date,
    },
    cases: { A, B, C, D, E, F, G, H, I, J, K, L, M1, M2, SELF },
    all: [A, B, C, D, E, F, G, H, I, J, K, L, M1, M2, SELF],
  };
}
