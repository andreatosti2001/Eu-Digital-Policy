/* ============================================================
   agent/detector/fixtures.mjs — the seven cases the session named,
   plus the ones that break the classifier

   THE SEVEN THE BRIEF REQUIRES TESTS FOR:

     unchanged source        two readings, identical bytes, identical
                             values — and a stated finding, not silence
     metadata-only update    the bytes moved and nothing they say did
     substantive date change an application date the corpus does not
                             carry
     amendment               an amending act reaching an act in force
     correction              a corrigendum
     contradictory source    two authorities disagreeing, which is NOT
                             a change and must not be reported as one
     court reversal          an act under judicial review, annulled

   Plus four that exist to break things: a transition the table has
   no kind for; a court being SEISED rather than deciding; a date
   that moved earlier rather than later; and a staged act, where
   comparing against one of several application events would be this
   detector choosing which stage a document meant.

   THE REAL IDS AND THE REAL VALUES ARE READ OUT OF data/, NOT TYPED
   IN. A fixture that typed an EU instrument's status or a timeline
   date by hand would be a legal fact authored from model knowledge,
   which is prohibited outright whatever it is for. Everything the
   corpus side of a comparison needs is looked up, so a renamed
   record or a changed status fails the fixtures loudly instead of
   quietly testing nothing.

   The document side is unmistakably simulated — every value on it is
   a year far enough in the future that it could not be mistaken for
   a real one, every quote says it is simulated, and every record
   carries `simulated: true`.
   ============================================================ */

import { loadCorpus } from '../integrate/canonical.mjs';

const TRACE = 'ba'.repeat(16);
const SPAN = 'dc'.repeat(8);
const RUN = 'fe'.repeat(8);

export const FIXTURE_AS_OF = '2026-09-02';
const T0 = '2026-06-01T09:00:00.000Z';   // the earlier reading
const T1 = '2026-09-02T09:00:00.000Z';   // this one

const empty = () => ({ fact: [], inference: [], interpretation: [], unresolved: [] });

const SIM = 'This quote is simulated. It stands in for a passage and states nothing about EU law.';

function must(map, id, what) {
  const v = map.get(id);
  if (!v) throw new Error(`agent/detector/fixtures.mjs expects ${what} "${id}" to exist in data/. It does not — either it was renamed, which this repository says never happens, or the fixture is out of date. Fix the fixture; do not add the record.`);
  return v;
}

export const doc = (id, { url, checksum, title, publisher = 'Simulated publisher', role = 'primary', supports = 'supports:direct', at = T1 }) => ({
  evidence_id: id,
  kind: 'retrieved_document',
  source_id: null,
  url,
  locator: 'Article 1',
  title,
  publisher,
  quote: SIM,
  retrieved_at: at,
  checksum,
  supports,
  role,
  simulated: true,
});

/** A VerificationRecord with every field the contract requires. The
 *  epistemic entries are written per fixture rather than generated:
 *  a block that was generated would not exercise the rules that hold
 *  the block to the fields. */
export function ver(over = {}) {
  return {
    contract: 'VerificationRecord',
    contract_version: 1,
    agent: 'legal-verifier',
    created_at: over.checked_at ?? T1,
    affected_entities: [],
    evidence: [],
    epistemic: empty(),
    trace_ref: { trace_id: TRACE, span_id: SPAN, run_id: RUN },
    simulated: true,

    verification_id: 'ver-det-000',
    statement: 'A simulated proposition.',
    method: 'Read a simulated document. Nothing here was retrieved from the network.',
    verdict: 'confirmed',
    confidence: 0.7,
    checked_at: T1,
    checked_by_kind: 'agent',
    checked_by: 'legal-verifier',
    document_id: null,
    source_tier: 'tier:1',
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

/** The epistemic block for a straightforward confirmed reading, with
 *  an entry for each factual field the fixture actually sets. */
function block({ evidenceId = 'ev-doc', status = null, dates = {} } = {}) {
  const ep = empty();
  ep.fact.push({ field: null, statement: 'The simulated passage carries the proposition.', evidence_refs: [evidenceId] });
  for (const [field, value] of Object.entries(dates)) {
    if (value === null || value === undefined) continue;
    ep.fact.push({ field, statement: `The simulated document states ${value} for ${field.replace(/_/g, ' ')}.`, evidence_refs: [evidenceId] });
  }
  ep.inference.push({ field: 'verdict', statement: 'The simulated document states the proposition.', from: [evidenceId], method: 'The ordered verdict test in agent/verifier/judge.mjs, run against a simulated passage.' });
  ep.inference.push({ field: 'source_tier', statement: 'Treated as tier:1.', from: [evidenceId], method: 'A fixture. Nothing was classified, because nothing was read.' });
  if (status) {
    ep.inference.push({ field: 'legal_status', statement: `The act is placed in "${status}".`, from: [evidenceId], method: 'A fixture: the status is stated by the fixture rather than read from signal phrases.' });
  }
  return ep;
}

export function buildFixtures(corpus = loadCorpus()) {
  /* --- the corpus side, read rather than typed ------------------- */
  const dsa = must(corpus.instrumentById, 'dsa', 'the instrument');
  const gdpr = must(corpus.instrumentById, 'gdpr', 'the instrument');
  const aiAct = must(corpus.instrumentById, 'ai-act', 'the instrument');
  const dsaForce = must(corpus.eventById, 'tl-dsa-2022-11-16-entry-into-force', 'the timeline event');
  const gdprApply = must(corpus.eventById, 'tl-gdpr-2018-05-25-application', 'the timeline event');

  const aiActApplications = corpus.events.filter((e) => e.instrument === 'ai-act' && e.event_type === 'event:application');
  if (aiActApplications.length < 2) {
    throw new Error('agent/detector/fixtures.mjs assumes the AI Act still applies in stages in data/timeline.json — several event:application events. It no longer does, and the staged-act fixture would test nothing.');
  }

  const instrumentEntity = (id) => ({ kind: 'instrument', id, path: 'data/instruments.json', field: null, note: 'The act the simulated document concerns.' });

  const URL_A = 'https://eur-lex.example.invalid/simulated-act-a';
  const URL_B = 'https://eur-lex.example.invalid/simulated-act-b';
  const HASH_1 = '1'.repeat(64);
  const HASH_2 = '2'.repeat(64);

  /* ============================================================
     1 · UNCHANGED SOURCE
     Two readings of one document, identical bytes, identical values.
     ============================================================ */
  const unchangedBefore = ver({
    verification_id: 'ver-det-unchanged-0',
    checked_at: T0,
    statement: 'A simulated proposition about an act already in the corpus, read in June.',
    legal_status: 'entered_into_force',
    affected_entities: [instrumentEntity('dsa')],
    evidence: [doc('ev-doc', { url: URL_A, checksum: HASH_1, title: 'A simulated act, first reading', at: T0 })],
    epistemic: block({ status: 'entered_into_force' }),
  });
  const unchangedAfter = ver({
    ...unchangedBefore,
    verification_id: 'ver-det-unchanged-1',
    checked_at: T1,
    created_at: T1,
    statement: 'The same simulated proposition, read again in September.',
    evidence: [doc('ev-doc', { url: URL_A, checksum: HASH_1, title: 'A simulated act, second reading', at: T1 })],
  });

  /* ============================================================
     2 · METADATA-ONLY UPDATE
     The bytes moved; every value the document states did not.
     ============================================================ */
  const metadataBefore = ver({
    ...unchangedBefore,
    verification_id: 'ver-det-metadata-0',
    evidence: [doc('ev-doc', { url: URL_B, checksum: HASH_1, title: 'A simulated act, first reading', at: T0 })],
  });
  const metadataAfter = ver({
    ...unchangedBefore,
    verification_id: 'ver-det-metadata-1',
    checked_at: T1,
    created_at: T1,
    statement: 'The same act, re-published with a new footer and nothing else.',
    evidence: [doc('ev-doc', { url: URL_B, checksum: HASH_2, title: 'A simulated act, re-published', at: T1 })],
  });

  /* ============================================================
     3 · SUBSTANTIVE DATE CHANGE
     A document stating an application date the corpus does not
     carry. Compared against a GDPR application event, of which
     data/timeline.json carries exactly one.
     ============================================================ */
  const dateChange = ver({
    verification_id: 'ver-det-date',
    statement: 'A simulated proposition stating an application date the corpus does not carry.',
    legal_status: 'applicable',
    applicability_date: '9 September 2099',
    affected_entities: [instrumentEntity('gdpr')],
    evidence: [doc('ev-doc', { url: 'https://eur-lex.example.invalid/simulated-postponement', checksum: HASH_2, title: 'A simulated act stating a different application date' })],
    epistemic: block({ status: 'applicable', dates: { applicability_date: '9 September 2099' } }),
  });

  /* ============================================================
     4 · AMENDMENT — an amending act reaching an act in force
     ============================================================ */
  const amendment = ver({
    verification_id: 'ver-det-amended',
    statement: 'A simulated amending act, reaching an act the corpus records as in force.',
    legal_status: 'amended',
    affected_entities: [instrumentEntity('dsa')],
    evidence: [doc('ev-doc', { url: 'https://eur-lex.example.invalid/simulated-amending-act', checksum: HASH_2, title: 'A simulated amending act' })],
    epistemic: block({ status: 'amended' }),
  });

  /* ============================================================
     5 · CORRECTION — a corrigendum
     ============================================================ */
  const correction = ver({
    verification_id: 'ver-det-corrected',
    statement: 'A simulated corrigendum.',
    legal_status: 'corrected',
    affected_entities: [instrumentEntity('dsa')],
    evidence: [doc('ev-doc', { url: 'https://eur-lex.example.invalid/simulated-corrigendum', checksum: HASH_2, title: 'A simulated corrigendum' })],
    epistemic: block({ status: 'corrected' }),
  });

  /* ============================================================
     6 · CONTRADICTORY SOURCE
     Two authorities disagreeing. NOT a change — reporting it as one
     would pick a winner between two regulators.
     ============================================================ */
  const contradictory = ver({
    verification_id: 'ver-det-conflict',
    statement: 'A simulated proposition two simulated authorities state differently.',
    verdict: 'conflict',
    confidence: 0.5,
    legal_status: null,
    residual_gap: 'Two simulated authorities state different values and neither displaces the other. Nothing downstream may treat either as the answer.',
    affected_entities: [instrumentEntity('dsa')],
    conflicting_evidence: [{
      evidence_refs: ['ev-side-a', 'ev-side-b'],
      disagreement: 'One simulated document states one date; the other states a different one. Both are recorded in their own words.',
      unreconciled_because: 'Both simulated sources sit at the same tier and neither outranks the other.',
    }],
    evidence: [
      doc('ev-side-a', { url: 'https://side-a.example.invalid/simulated', checksum: HASH_1, title: 'Simulated side A', publisher: 'Simulated authority A' }),
      doc('ev-side-b', { url: 'https://side-b.example.invalid/simulated', checksum: HASH_2, title: 'Simulated side B', publisher: 'Simulated authority B' }),
    ],
    epistemic: {
      fact: [],
      inference: [
        { field: 'verdict', statement: 'Two simulated authorities disagree and neither displaces the other.', from: ['ev-side-a', 'ev-side-b'], method: 'Compared the two stated values; a difference of precision would not have been a conflict.' },
        { field: 'conflicting_evidence', statement: 'The two evidence entries disagree about the same attribute.', from: ['ev-side-a', 'ev-side-b'], method: 'Grouped by instrument and attribute and compared the printed values, never ranking the sources.' },
        { field: 'source_tier', statement: 'Treated as tier:1.', from: ['ev-side-a'], method: 'A fixture.' },
      ],
      interpretation: [],
      unresolved: [{ field: null, question: 'Which value governs?', missing: 'A human decision, or a source that displaces one of the two.', absence_kind: 'unknown_not_determinable', blocks: true }],
    },
  });

  /* ============================================================
     7 · COURT REVERSAL
     An act the corpus records as under judicial review, annulled.
     The corpus records no instrument in that state, so the fixture
     supplies the previous position through an earlier verification —
     which is what a "previous source snapshot" is here.
     ============================================================ */
  const courtBefore = ver({
    verification_id: 'ver-det-court-0',
    checked_at: T0,
    created_at: T0,
    statement: 'A simulated act, recorded as under challenge in June.',
    legal_status: 'under_judicial_review',
    affected_entities: [instrumentEntity('ai-act')],
    evidence: [doc('ev-doc', { url: 'https://curia.example.invalid/simulated-case', checksum: HASH_1, title: 'A simulated case record', publisher: 'Simulated court', at: T0 })],
    epistemic: block({ status: 'under_judicial_review' }),
  });
  const courtAfter = ver({
    ...courtBefore,
    verification_id: 'ver-det-court-1',
    checked_at: T1,
    created_at: T1,
    statement: 'The same simulated act, annulled by the simulated court in September.',
    legal_status: 'annulled',
    evidence: [doc('ev-doc', { url: 'https://curia.example.invalid/simulated-case', checksum: HASH_2, title: 'A simulated judgment', publisher: 'Simulated court', role: 'official', at: T1 })],
    epistemic: block({ status: 'annulled' }),
  });

  /* ============================================================
     THE FOUR THAT BREAK THINGS
     ============================================================ */

  /* A court being SEISED rather than deciding. There is no kind
     among the fourteen for "a challenge was lodged", and filing it
     as COURT_OUTCOME would tell a reader a court had ruled when it
     had only been asked. */
  const seised = ver({
    verification_id: 'ver-det-seised',
    statement: 'A simulated act, newly under challenge.',
    legal_status: 'under_judicial_review',
    affected_entities: [instrumentEntity('dsa')],
    evidence: [doc('ev-doc', { url: 'https://curia.example.invalid/simulated-lodged', checksum: HASH_2, title: 'A simulated notice of action', publisher: 'Simulated court' })],
    epistemic: block({ status: 'under_judicial_review' }),
  });

  /* A date that moved EARLIER. Equally a change, equally material,
     and deliberately not DELAYED — the word would be false. */
  const brought_forward = ver({
    verification_id: 'ver-det-earlier',
    statement: 'A simulated proposition stating an application date earlier than the corpus carries.',
    legal_status: 'applicable',
    applicability_date: '1 January 1999',
    affected_entities: [instrumentEntity('gdpr')],
    evidence: [doc('ev-doc', { url: 'https://eur-lex.example.invalid/simulated-earlier', checksum: HASH_2, title: 'A simulated act stating an earlier date' })],
    epistemic: block({ status: 'applicable', dates: { applicability_date: '1 January 1999' } }),
  });

  /* A staged act. data/timeline.json carries several application
     events for the AI Act, and comparing against one would be this
     detector choosing which stage the document meant. */
  const staged = ver({
    verification_id: 'ver-det-staged',
    statement: 'A simulated proposition about an act that applies in stages.',
    legal_status: 'applicable',
    applicability_date: '2 February 2100',
    affected_entities: [instrumentEntity('ai-act')],
    evidence: [doc('ev-doc', { url: 'https://eur-lex.example.invalid/simulated-staged', checksum: HASH_2, title: 'A simulated staged act' })],
    epistemic: block({ status: 'applicable', dates: { applicability_date: '2 February 2100' } }),
  });

  /* A document nobody could read. It establishes no value, so there
     is nothing for the corpus to have diverged from. */
  const unreachable = ver({
    verification_id: 'ver-det-unreachable',
    statement: 'A simulated proposition about a document that never arrived.',
    verdict: 'source_unavailable',
    confidence: 0.9,
    /* Nothing was read, so nothing was placed at a tier. A default
       carried over from the fixture helper would be an estimate
       about a document that never arrived. */
    source_tier: null,
    residual_gap: 'The document could not be retrieved, so nothing about the proposition was established.',
    affected_entities: [instrumentEntity('dsa')],
    evidence: [{
      evidence_id: 'ev-absent', kind: 'absent',
      source_id: null, url: null, locator: null, title: null, publisher: null,
      quote: null, retrieved_at: null, checksum: null,
      supports: null, role: 'unresolved', simulated: true,
    }],
    epistemic: {
      fact: [],
      inference: [{ field: 'verdict', statement: 'The document did not arrive.', from: ['ev-absent'], method: 'The retrieval failed and nothing was read.' }],
      interpretation: [],
      unresolved: [{ field: null, question: 'What does the document say?', missing: 'A retrieval that succeeded.', absence_kind: 'null_not_researched', blocks: false }],
    },
  });

  /* A record this agent claims to have produced itself. */
  const self = ver({
    ...amendment,
    verification_id: 'ver-det-self',
    agent: 'regulatory-change-detector',
    checked_by: 'regulatory-change-detector',
  });

  const cases = {
    unchangedBefore, unchangedAfter,
    metadataBefore, metadataAfter,
    dateChange, amendment, correction, contradictory,
    courtBefore, courtAfter,
    seised, brought_forward, staged, unreachable, self,
  };

  return {
    corpus,
    ids: {
      dsaStatus: dsa.legislative_status,
      gdprStatus: gdpr.legislative_status,
      aiActStatus: aiAct.legislative_status,
      dsaForceEvent: dsaForce.id,
      dsaForceDate: dsaForce.date,
      gdprApplyEvent: gdprApply.id,
      gdprApplyDate: gdprApply.date,
      aiActApplicationCount: aiActApplications.length,
    },
    cases,
    all: Object.values(cases),
  };
}
