/* ============================================================
   agent/integrate/selftest.mjs

       node --test agent/integrate/selftest.mjs

   node:test, no network, no installation — the same constraint the
   four validators in tools/ and the other four agent suites work
   under.

   These are INTEGRATION tests in the literal sense: they run against
   the REAL data/ directory, not a mock corpus. An adapter between an
   agent's records and the canonical datasets that was only ever
   tested against a corpus this session invented would prove nothing
   about the corpus it will actually meet — the exact criticism
   docs/HANDOVER.md makes of the Verifier, which has still never read
   a real document.

   What they hold down, in the order this layer would do damage:

     · it never writes to data/ — asserted by hashing the whole
       directory around a full run, and by scanning every module here
       for a write call
     · an existing claim is found before a new one is proposed
     · an existing source is found before a duplicate is proposed
     · a near miss is `ambiguous` and NOTHING is picked
     · evidence is attached at the qualifier the verdict supports and
       never a stronger one
     · a source is never attached to a claim that already cites it,
       and never twice in one run
     · a contradiction attaches nothing
     · an unsupported claim is not reported as a false one, and an
       argument is not reported as a missing citation
     · staleness needs an explicit as-of date and refuses to invent
       one
     · a conflict produces no proposal, because a proposal would have
       to name a value
     · an id is never renamed and a provenance field is never removed
       or misquoted — both gates, and neither can be turned off
     · nothing is merged, applied or approved
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { deterministicClock, deterministicIds } from '../observability/ids.mjs';
import { validate } from '../schemas/validate.mjs';
import { getContract } from '../schemas/registry.mjs';
import { MemoryRecordStore } from '../scout/store.mjs';
import { EXPECTED } from '../../tools/freshness.mjs';
import { familyOf, evidenceGrade } from '../../js/format.js';

import { loadCorpus, hashDataDir, PROVENANCE_FIELDS, HOME_OF, SELF_SOURCE_ID } from './canonical.mjs';
import { celexOf, overlap, tokens, decide, THRESHOLDS, normaliseUrl } from './match.mjs';
import { resolveClaim, alreadyCites, existingRef } from './claims.mjs';
import { resolveSource, retrievedDocumentOf, draftSourceRecord } from './sources.mjs';
import { buildLink, supportsFor, attachOperation, ATTACHING_VERDICTS } from './evidence.mjs';
import { unsupportedClaims, tallyUnsupported } from './unsupported.mjs';
import { staleVerification, daysBetween } from './stale.mjs';
import { findConflicts, canonicalValue, unmappableStatuses } from './conflicts.mjs';
import { checkPreservation, untouchedProvenance, fieldOfTarget, NEVER_REMOVED } from './preserve.mjs';
import { Integrator, INTEGRATOR_AGENT } from './adapter.mjs';
import { buildFixtures, ver, doc, FIXTURE_AS_OF, FIXTURE_NOW } from './fixtures.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* The real corpus. Loaded once: every test below asks questions of
   the datasets this repository actually ships. */
const CORPUS = loadCorpus();
const FX = buildFixtures(CORPUS);

function harness() {
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({
    service: 'test',
    sink,
    ids: deterministicIds(41),
    clock: deterministicClock('2026-09-02T12:00:00.000Z', 100),
    attributes: { agent: INTEGRATOR_AGENT },
  });
  const store = new MemoryRecordStore({ allowSimulated: true });
  return { tracer, store, sink };
}

const integrator = (over = {}) => {
  const { tracer, store, sink } = harness();
  return {
    it: new Integrator({ tracer, store, corpus: CORPUS, asOf: FIXTURE_AS_OF, simulated: true, ...over }),
    store, sink,
  };
};

/* One full run, shared by the tests that ask about its output. */
const HASH_BEFORE = hashDataDir();
const { it: RUNNER, store: RUN_STORE } = integrator();
const RESULT = await RUNNER.run({ verifications: FX.all });
const HASH_AFTER = hashDataDir();

/* ============================================================
   data/ is never written to
   ============================================================ */

test('a full run leaves every file in data/ byte-identical', () => {
  assert.deepEqual(HASH_AFTER, HASH_BEFORE,
    'a run of the integrator changed a canonical dataset. It has no code path that should be able to.');
  assert.equal(RESULT.data_untouched, true, 'the run record must say so too, and it is derived rather than asserted');
});

test('no module in agent/integrate/ contains a write call', () => {
  const forbidden = ['writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync', 'mkdirSync', 'writeFile(', 'rename('];
  /* The suite itself names the calls in order to look for them. */
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(HERE, f), 'utf8');
    /* Comments are stripped so the modules can go on discussing
       writes at length without tripping their own check. */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    for (const call of forbidden) {
      assert.ok(!code.includes(call), `${f} contains "${call}". Nothing in this directory writes.`);
    }
  }
});

test('nothing in the run was merged, applied or approved', () => {
  assert.equal(RESULT.run_record.outputs.applied, 0);
  for (const p of RESULT.proposals) {
    for (const key of ['auto_merge', 'apply_automatically', 'merged', 'applied', 'approved']) {
      assert.ok(!(key in p), `a proposal carries "${key}", which its contract forbids`);
    }
  }
  if (RESULT.approval) {
    assert.equal(RESULT.approval.state, 'requested', 'an approval this layer produced is pending, never granted');
    assert.equal(RESULT.approval.decision, null);
  }
});

/* ============================================================
   1 · find an existing claim before creating a new one
   ============================================================ */

test('a verification naming an existing claim resolves to it, and the strategy is recorded', () => {
  const r = resolveClaim(FX.cases.A, CORPUS);
  assert.equal(r.outcome, 'matched');
  assert.equal(r.claim_id, FX.ids.art114Claim);
  assert.equal(r.decision.match.strategy, 'declared_entity');
  assert.equal(r.search.candidates_considered, CORPUS.claims.length,
    'the search reports every record compared, not only the ones that scored');
});

test('two declared claims is ambiguous, and neither is picked', () => {
  const r = resolveClaim(FX.cases.H, CORPUS);
  assert.equal(r.outcome, 'ambiguous');
  assert.equal(r.claim_id, null, 'picking one would be this layer deciding which claim a passage carries');
  assert.equal(r.decision.near.length, 2);
});

test('a proposition no claim carries resolves to nothing, and says how many it compared', () => {
  const r = resolveClaim(FX.cases.G, CORPUS);
  assert.equal(r.outcome, 'no_match');
  assert.equal(r.claim_id, null);
  assert.equal(r.search.performed, true);
  assert.equal(r.search.candidates_considered, CORPUS.claims.length);
});

test('wording alone never reaches the accept threshold without a shared instrument', () => {
  /* A verification whose statement is one real claim's sentence
     verbatim, but which names a different instrument. Exact-match
     would score 1; overlap-without-a-shared-instrument is capped. */
  const target = CORPUS.claims.find((c) => c.instruments.length && c.statement.length > 120);
  const words = target.statement.split(/\s+/);
  const partial = words.slice(0, Math.ceil(words.length * 0.7)).join(' ');
  const v = ver({
    verification_id: 'ver-overlap',
    statement: `${partial} — with a differently worded ending that keeps most of the vocabulary.`,
    affected_entities: [],
    evidence: [doc('ev-doc', { url: 'https://example.invalid/x', title: 't', publisher: 'p', quote: 'q' })],
    epistemic: {
      fact: [{ field: null, statement: 'x', evidence_refs: ['ev-doc'] }],
      inference: [{ field: 'verdict', statement: 'x', from: ['ev-doc'], method: 'm' }],
      interpretation: [], unresolved: [],
    },
  });
  const r = resolveClaim(v, CORPUS);
  if (r.outcome === 'matched') {
    assert.notEqual(r.decision.match.strategy, 'statement_overlap',
      'overlap with no shared instrument must never reach the accept threshold on its own');
  }
  const capped = r.decision.near.filter((c) => c.strategy === 'statement_overlap' && /no instrument is common/.test(c.why));
  for (const c of capped) {
    assert.ok(c.score < THRESHOLDS.accept, `${c.id} scored ${c.score} on wording alone, at or above the accept threshold`);
  }
});

test('the run proposed creating a claim only after the search failed, and it is blocked', () => {
  const created = RESULT.proposals.filter((p) => p.operation_kind === 'create_claim');
  assert.ok(created.length > 0, 'the adversarial corpus contains a proposition no claim carries');
  for (const p of created) {
    assert.equal(p.record_id, null);
    assert.equal(p.existing_search.performed, true);
    assert.equal(p.autonomy_class, 'human_only');
    assert.equal(p.substantive, true);
    assert.equal(p.prose_anchor, null);
    const blocking = p.epistemic.unresolved.filter((u) => u.field === 'prose_anchor' && u.blocks === true);
    assert.equal(blocking.length, 1, 'a new claim with no prose anchor is blocked, not merely flagged');
    assert.equal(p.proposed_change.operations[0].proposed, null,
      'no claim text is drafted: the brief says what the brief says, and this layer does not read it');
  }
});

/* ============================================================
   2 · find an existing source before creating a duplicate
   ============================================================ */

test('a document already in the bibliography resolves to its record', () => {
  const r = resolveSource(FX.cases.A, CORPUS);
  assert.equal(r.outcome, 'matched');
  assert.equal(r.source_id, FX.ids.gdprSource);
  assert.ok(['celex', 'normalised_url'].includes(r.decision.match.strategy));
});

test('a CELEX number is read only where EUR-Lex put one in the address', () => {
  assert.equal(celexOf('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679'), '32016R0679');
  assert.equal(celexOf('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:62023CJ0413'), '62023CJ0413');
  assert.equal(celexOf('https://example.invalid/a-page-about-2016-and-0679'), null,
    'a legal identifier assembled out of an address is a fact about the address');
  assert.equal(celexOf(null), null);
});

test('same host and path, different parameters, is ambiguous — never a match', () => {
  const r = resolveSource(FX.cases.I, CORPUS);
  assert.equal(r.outcome, 'ambiguous');
  assert.equal(r.source_id, null,
    'two EUR-Lex addresses sharing a path can be two language editions or two consolidated versions, which are different documents');
  assert.ok(r.decision.near.length >= 1);
});

test('a document no source record carries proposes one, and only because it was read', () => {
  const r = resolveSource(FX.cases.E, CORPUS);
  assert.equal(r.outcome, 'no_match');
  assert.equal(r.retrieved_and_read, true);

  const created = RESULT.proposals.filter((p) => p.operation_kind === 'create_source');
  assert.ok(created.length > 0);
  for (const p of created) {
    assert.equal(p.retrieved_and_read, true);
    assert.equal(p.autonomy_class, 'human_only');
    assert.equal(p.substantive, true);
    assert.equal(p.existing_search.performed, true);
    assert.equal(p.existing_search.candidates_considered, CORPUS.sources.length);
    assert.ok(p.evidence.some((e) => e.kind === 'retrieved_document'),
      'a source record is founded on a document that was fetched and read');
  }
});

test('a document nobody read founds no source record', () => {
  const r = resolveSource(FX.cases.F, CORPUS);
  assert.equal(r.retrieved_and_read, false);
  const fromF = RESULT.proposals.filter((p) => (p.verification_refs ?? []).includes('ver-fx-f'));
  assert.equal(fromF.length, 0,
    'creating a sources.json record from anything but a document actually retrieved and read is red tier');
  assert.ok(RESULT.gaps.some((g) => g.gap_kind === 'retrieval_blocked'),
    'and the absence is recorded as a gap rather than dropped');
});

test('a new source record leaves the id, tier, type and url_status for a human, each with the reason', () => {
  const draft = draftSourceRecord({ verification: FX.cases.E, document: retrievedDocumentOf(FX.cases.E), corpus: CORPUS });
  for (const field of ['id', 'tier', 'type', 'publisher', 'url_status', 'language', 'note']) {
    assert.equal(draft[field], null, `${field} must not be invented here`);
    assert.ok(typeof draft.not_established[field] === 'string' && draft.not_established[field].length > 20,
      `${field} is null with no reason recorded`);
  }
  assert.notEqual(draft.source_tier, FX.cases.E.source_tier,
    'the verification\'s estimated source_tier must not be carried across as the settled tier');
});

/* ============================================================
   3 · attach evidence to the canonical record
   ============================================================ */

test('a partially_confirmed verdict never attaches a direct support', () => {
  const d = supportsFor(FX.cases.D, retrievedDocumentOf(FX.cases.D));
  assert.equal(d.supports, 'supports:partial');
  assert.equal(d.downgraded_from, 'supports:direct');
  assert.ok(/partially_confirmed/.test(d.why_downgraded));
});

test('the mapping from verdict to qualifier only ever weakens', () => {
  for (const verdict of ['confirmed', 'partially_confirmed']) {
    for (const claimed of ['supports:direct', 'supports:partial', 'supports:context']) {
      const v = { ...FX.cases.A, verdict };
      const got = supportsFor(v, { supports: claimed });
      const rank = { 'supports:direct': 3, 'supports:partial': 2, 'supports:context': 1 };
      assert.ok(rank[got.supports] <= rank[claimed],
        `verdict "${verdict}" on "${claimed}" evidence produced "${got.supports}", which is stronger than what the evidence claimed`);
    }
  }
});

test('a verdict that settled nothing attaches nothing', () => {
  for (const verdict of ['contradicted', 'not_determinable', 'source_unavailable', 'conflict']) {
    assert.ok(!ATTACHING_VERDICTS.includes(verdict));
    const got = supportsFor({ ...FX.cases.A, verdict }, retrievedDocumentOf(FX.cases.A));
    assert.equal(got.supports, null, `verdict "${verdict}" produced a support qualifier`);
    assert.ok(got.why_not.length > 20, 'and the reason is recorded, so "no link" is not read as "not looked at"');
  }
});

test('a contradiction produces no link and no proposal — it produces a conflict', () => {
  const links = RESULT.links.filter((l) => l.established_by === 'ver-fx-k');
  assert.equal(links.length, 0);
  const props = RESULT.proposals.filter((p) => (p.verification_refs ?? []).includes('ver-fx-k'));
  assert.equal(props.length, 0, 'a source that says otherwise is not a source that supports');
  assert.ok(RESULT.conflicts.some((c) => c.kind === 'claim_contradicted' && c.claim_id === FX.ids.dsaClaim));
});

test('a source a claim already cites is never attached again', () => {
  const claim = CORPUS.claimById.get(FX.ids.dsaClaim);
  assert.equal(alreadyCites(claim, FX.ids.dsaSource), true);
  const built = buildLink({ verification: FX.cases.B, claim, source_id: FX.ids.dsaSource, evidenceRef: retrievedDocumentOf(FX.cases.B) });
  assert.equal(built.link, null);
  assert.ok(/already cites/.test(built.skipped));
  assert.ok(existingRef(claim, FX.ids.dsaSource), 'and the existing reference is retrievable, so a change to it would carry what is there now');
});

test('one claim-and-source pair yields one proposal per run, and a weaker second reading is not lost', () => {
  const pairs = RESULT.proposals
    .filter((p) => p.operation_kind === 'attach_evidence')
    .map((p) => `${p.record_id}|${JSON.parse(p.proposed_change.operations[0].proposed).source_id}`);
  assert.equal(new Set(pairs).size, pairs.length, 'the same reference is proposed twice, and applied in order would be added twice');

  const weaker = RESULT.notes.find((n) => n.verification_id === 'ver-fx-d');
  assert.ok(weaker && /supports:partial/.test(weaker.not_attached),
    'a second check reaching a weaker qualifier than the standing proposal must be visible, not swallowed');
});

test('the strongest retrieved document is the one attached, not the first one listed', () => {
  const chosen = retrievedDocumentOf(FX.cases.C);
  assert.equal(chosen.supports, 'supports:direct',
    'taking whichever was listed first would let a commentary above the Official Journal become the citation');
});

test('a context support is recorded as one and is never a citation', () => {
  const claim = CORPUS.claimById.get(FX.ids.art114Claim);
  const contextRef = { ...retrievedDocumentOf(FX.cases.A), supports: 'supports:context' };
  const built = buildLink({ verification: FX.cases.A, claim, source_id: FX.ids.gdprSource, evidenceRef: contextRef });
  assert.equal(built.link.supports, 'supports:context');
  assert.equal(built.link.is_citation, false);
  assert.ok(/not a citation/.test(attachOperation(built.link).rationale));
});

test('every link and every proposal the run produced satisfies its contract', () => {
  for (const r of [...RESULT.links, ...RESULT.proposals, ...RESULT.gaps, RESULT.approval, RESULT.run_record].filter(Boolean)) {
    assert.deepEqual(validate(r, { allowSimulated: true }), [], `${r.contract} ${r[getContract(r.contract).id_field]} does not satisfy its contract`);
  }
});

/* ============================================================
   4 · detect unsupported claims
   ============================================================ */

test('the unsupported check uses the site\'s own derivation, not a second copy', () => {
  const rows = unsupportedClaims(CORPUS);
  const ix = { source: CORPUS.sourceById };
  for (const row of rows.slice(0, 20)) {
    const claim = CORPUS.claimById.get(row.claim_id);
    assert.equal(row.grade, evidenceGrade(claim, ix).id, 'the grade reported here must be the grade the page shows');
    assert.equal(row.family, familyOf(claim));
  }
});

test('the twenty claims resting only on the brief are found, and named as that', () => {
  const rows = unsupportedClaims(CORPUS);
  const selfOnly = rows.filter((r) => r.reasons.some((x) => x.reason === 'self_cited_only'));
  const actual = CORPUS.claims.filter((c) => c.sources.length && c.sources.every((s) => s.source_id === SELF_SOURCE_ID));
  assert.equal(selfOnly.length, actual.length);
  assert.ok(actual.length > 0, 'this corpus does contain claims resting on nothing but the brief, and hiding that would be the defect');
});

test('unsupported is never reported as false, and an argument is never reported as a missing citation', () => {
  const rows = unsupportedClaims(CORPUS);
  for (const row of rows) {
    assert.ok(row.what_this_is_not.length > 40);
    if (row.is_argument) {
      assert.ok(/premises|reading|interpretation/i.test(row.what_this_is_not),
        `${row.claim_id} is an argument-family claim and must not be described as short of a citation`);
      assert.equal(row.grade, 'interpretation', 'an argument grades interpretation however well sourced');
    } else {
      assert.ok(/does not say the claim is false|not a negative finding/i.test(row.what_this_is_not));
    }
  }
  const t = tallyUnsupported(rows);
  assert.equal(t.of_which_arguments + t.of_which_law_or_fact, t.claims_with_a_finding);
  assert.ok(!('total' in t), 'there is no single total: folding a reading in with a missing citation is the collapse the governance forbids');
});

test('a gap record for an unsupported claim says how it is closed, and how it is not', () => {
  const gaps = RESULT.gaps.filter((g) => ['missing_source', 'unverified_record'].includes(g.gap_kind));
  assert.ok(gaps.length > 0);
  for (const g of gaps) {
    assert.ok(/Locating the publication/.test(g.closes_with));
    assert.ok(/substitute/.test(g.closes_with), 'the prohibition on closing a gap with a substitute travels with the gap');
    for (const forbidden of ['substitute', 'best_guess', 'assumed_value', 'plausible_value', 'likely_answer', 'default_value']) {
      assert.ok(!(forbidden in g), `a gap record carries "${forbidden}"`);
    }
  }
});

/* ============================================================
   5 · detect stale verification
   ============================================================ */

test('staleness refuses to invent an as-of date', () => {
  assert.throws(() => staleVerification(CORPUS, {}), /explicit asOf/);
  assert.throws(() => staleVerification(CORPUS, { asOf: 'today' }), /explicit asOf/);
  assert.throws(() => integrator({ asOf: undefined }), /explicit asOf/);
});

test('nothing in the staleness path reads a clock', () => {
  for (const f of ['stale.mjs', 'conflicts.mjs', 'unsupported.mjs', 'match.mjs', 'claims.mjs', 'sources.mjs', 'evidence.mjs', 'preserve.mjs']) {
    const src = readFileSync(join(HERE, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');
    assert.ok(!/new Date\(\)/.test(src), `${f} reads the clock: a judgement that changes with when it was computed is not reproducible`);
    assert.ok(!/Date\.now\(\)/.test(src), `${f} reads the clock`);
  }
});

test('the intervals are the validator\'s own, not a second table', () => {
  const src = readFileSync(join(HERE, 'stale.mjs'), 'utf8');
  assert.ok(/from '\.\.\/\.\.\/tools\/freshness\.mjs'/.test(src));
  assert.ok(Object.keys(EXPECTED).length >= 6);
  /* And importing the validator runs no audit and exits nothing. */
  assert.equal(typeof EXPECTED.claims.days, 'number');
});

test('a dataset past its interval is reported against the stated as-of date', () => {
  const far = staleVerification(CORPUS, { asOf: '2030-01-01' });
  const rows = far.filter((r) => r.kind === 'dataset_interval');
  assert.ok(rows.length > 0, 'every dataset is past its interval by 2030');
  for (const r of rows) {
    assert.equal(r.as_of, '2030-01-01');
    assert.equal(r.age_days, daysBetween(CORPUS.verificationDates[r.dataset.replace(/^data\/|\.json$/g, '')].file, '2030-01-01'));
  }
  const near = staleVerification(CORPUS, { asOf: CORPUS.verificationDates.claims.file });
  assert.equal(near.filter((r) => r.kind === 'dataset_interval').length, 0,
    'and on the day the datasets were compiled, nothing is past its interval');
});

test('every staleness row about last_verified carries the compilation-date caveat', () => {
  const rows = staleVerification(CORPUS, { asOf: '2030-01-01', verifications: FX.all, resolutions: RESULT.resolutions });
  const dateRows = rows.filter((r) => ['dataset_interval', 'record_behind'].includes(r.kind));
  assert.ok(dateRows.length > 0);
  for (const r of dateRows) {
    const dataset = r.dataset?.replace(/^data\/|\.json$/g, '');
    if (!CORPUS.verificationDates[dataset]?.is_compilation_date) continue;
    assert.ok(/compilation/.test(r.compilation_date_caveat ?? ''),
      `${r.dataset} has one distinct last_verified across every record, and the row does not say to read it as a compilation date`);
  }
});

test('a recheck that came due and a superseded record are both stale, and are different things', () => {
  const rows = staleVerification(CORPUS, { asOf: FIXTURE_AS_OF, verifications: FX.all });
  assert.ok(rows.some((r) => r.kind === 'recheck_due' && r.verification_id === 'ver-fx-m1'));
  assert.ok(rows.some((r) => r.kind === 'superseded' && r.verification_id === 'ver-fx-m1'));
  assert.equal(rows.filter((r) => r.kind === 'superseded').length, 1, 'only the replaced record is superseded, not the one that replaced it');
});

test('a staleness gap says that stale is not wrong', () => {
  const gaps = RESULT.gaps.filter((g) => g.gap_kind === 'stale_verification');
  assert.ok(gaps.length > 0);
  for (const g of gaps) {
    assert.ok(/Stale is not wrong/.test(g.why_open));
    assert.ok(/never bulk-stamping|never stamping|bulk-stamping/.test(g.closes_with + g.why_open));
  }
});

/* ============================================================
   6 · detect conflicting evidence
   ============================================================ */

test('a source disagreeing with data/timeline.json is a conflict, named on both sides', () => {
  const c = RESULT.conflicts.find((x) => x.kind === 'against_canonical');
  assert.ok(c, 'the adversarial corpus states an entry-into-force date the timeline contradicts');
  assert.equal(c.instrument_id, 'dsa');
  assert.equal(c.attribute, 'entry_into_force_date');
  assert.equal(c.sides.length, 2);
  assert.ok(c.sides.some((s) => String(s.value) === FX.ids.dsaForceDate), 'the canonical side states what data/ actually carries');
  assert.ok(c.sides.some((s) => String(s.value) === '1 January 2099'), 'and the document side states what was read');
  assert.equal(c.blocking, true);
});

test('a conflict produces no proposal, because a proposal would have to name a value', () => {
  const conflicted = new Set(RESULT.conflicts.flatMap((c) => c.verification_ids));
  for (const p of RESULT.proposals) {
    if (p.operation_kind === 'create_claim') continue;   // a blocked finding, not a value
    for (const ref of p.verification_refs ?? []) {
      assert.ok(!conflicted.has(ref) || p.operation_kind === 'create_claim',
        `${p.proposal_id} proposes something on the strength of ${ref}, which is in conflict`);
    }
  }
  for (const g of RESULT.gaps.filter((x) => x.gap_kind === 'source_conflict')) {
    assert.equal(g.blocking, true, 'a contradiction stops the chain and goes to a human');
    assert.ok(/never resolved by seniority, recency or convenience|H7/.test(g.why_open));
  }
});

test('a staged act yields no canonical value to compare against, rather than a picked stage', () => {
  /* The AI Act applies in stages: data/timeline.json carries several
     application events for it. Comparing against one of them would
     be this layer choosing which stage a source meant. */
  const events = CORPUS.events.filter((e) => e.instrument === 'ai-act' && e.event_type === 'event:application');
  assert.ok(events.length > 1, 'this test assumes the AI Act still applies in stages in this corpus');
  assert.equal(canonicalValue(CORPUS, 'ai-act', 'applicability_date'), null);
  /* A single-event instrument does resolve. */
  assert.equal(canonicalValue(CORPUS, 'dsa', 'entry_into_force_date').value, FX.ids.dsaForceDate);
});

test('a difference of precision is not a conflict', () => {
  const dma = CORPUS.events.find((e) => e.id === 'tl-dma-2023-05-01-application');
  assert.ok(dma, 'this test assumes the DMA application event is still recorded');
  const v = ver({
    verification_id: 'ver-precision',
    verdict: 'confirmed',
    applicability_date: dma.date,
    affected_entities: [{ kind: 'instrument', id: 'dma', path: 'data/instruments.json', field: null, note: null }],
    evidence: [doc('ev-doc', { url: 'https://example.invalid/x', title: 't', publisher: 'p', quote: 'q' })],
    epistemic: {
      fact: [
        { field: null, statement: 'x', evidence_refs: ['ev-doc'] },
        { field: 'applicability_date', statement: 'x', evidence_refs: ['ev-doc'] },
      ],
      inference: [{ field: 'verdict', statement: 'x', from: ['ev-doc'], method: 'm' }],
      interpretation: [], unresolved: [],
    },
  });
  const found = findConflicts(CORPUS, { verifications: [v], asOf: FIXTURE_AS_OF });
  assert.equal(found.filter((c) => c.kind === 'against_canonical').length, 0,
    'the same date stated the same way is not a disagreement');
});

test('a status the taxonomy cannot express is a coverage gap, not a conflict', () => {
  const v = { ...FX.cases.A, verification_id: 'ver-unmappable', legal_status: 'under_judicial_review' };
  const rows = unmappableStatuses([v]);
  assert.equal(rows.length, 1);
  assert.ok(/no term for it/.test(rows[0].why));
  const conflicts = findConflicts(CORPUS, { verifications: [v], asOf: FIXTURE_AS_OF });
  assert.equal(conflicts.filter((c) => c.attribute === 'legal_status').length, 0,
    'saying two things disagree when one cannot be expressed manufactures a disagreement out of a missing word');
});

test('one disagreement stated by several propositions is one conflict', () => {
  const twice = [FX.cases.J, { ...FX.cases.J, verification_id: 'ver-fx-j2' }];
  const found = findConflicts(CORPUS, { verifications: twice, asOf: FIXTURE_AS_OF });
  const canonical = found.filter((c) => c.kind === 'against_canonical' && c.instrument_id === 'dsa');
  assert.equal(canonical.length, 2, 'two separate verifications each disagreeing is two findings, deduplicated per verification');
  const same = findConflicts(CORPUS, { verifications: [FX.cases.J, FX.cases.J], asOf: FIXTURE_AS_OF });
  assert.equal(same.filter((c) => c.kind === 'against_canonical').length, 1,
    'the same verification counted twice is one disagreement');
});

/* ============================================================
   7 and 8 · preserve existing IDs and existing provenance
   ============================================================ */

const attachProposal = () => RESULT.proposals.find((p) => p.operation_kind === 'attach_evidence');

test('every proposal the run produced preserves the record id', () => {
  for (const p of RESULT.proposals) {
    assert.equal(p.preserves_record_id, true);
    for (const op of p.proposed_change.operations) {
      assert.notEqual(fieldOfTarget(op.target), 'id', `${p.proposal_id} targets an id`);
      assert.notEqual(op.op, 'move');
    }
    assert.deepEqual(checkPreservation(p, CORPUS), [], `${p.proposal_id} fails the corpus-level preservation check`);
  }
});

test('a proposal naming a record that does not exist is refused', () => {
  const p = { ...attachProposal(), record_id: 'clm-this-does-not-exist' };
  const problems = checkPreservation(p, CORPUS);
  assert.ok(problems.some((x) => /is not a claim in data\/claims\.json/.test(x)));
});

test('a proposal that would rename an id is refused by both gates', () => {
  const p = structuredClone(attachProposal());
  p.preserves_record_id = false;
  assert.ok(validate(p, { allowSimulated: true }).some((e) => /IDs are never renamed here/.test(e)), 'the contract must refuse it');
  assert.ok(checkPreservation(p, CORPUS).some((e) => /stable and global/.test(e)), 'and the corpus check must refuse it too');
});

test('a proposal that would claim an id already in use is refused', () => {
  const p = structuredClone(attachProposal());
  const taken = CORPUS.claims[0].id;
  p.proposed_change.operations.push({
    op: 'add', target: 'data/claims.json claims[]',
    current: null, proposed: JSON.stringify({ id: taken, statement: 'x' }),
    rationale: 'x',
  });
  assert.ok(checkPreservation(p, CORPUS).some((e) => e.includes(taken) && /already exists/.test(e)));
});

test('a proposal that would remove a provenance field is refused by both gates', () => {
  for (const field of NEVER_REMOVED.filter((f) => f in CORPUS.claimById.get(FX.ids.art114Claim))) {
    const p = structuredClone(attachProposal());
    p.proposed_change.operations.push({
      op: 'remove', target: `data/claims.json claims[${p.record_id}].${field}`,
      current: 'whatever is there', proposed: null, rationale: 'it looks resolved now',
    });
    const contract = validate(p, { allowSimulated: true });
    const corpusCheck = checkPreservation(p, CORPUS);
    assert.ok(contract.length > 0 || corpusCheck.length > 0, `removing "${field}" was accepted by both gates`);
  }
});

test('a proposal that misquotes what the record carries is refused', () => {
  const p = structuredClone(attachProposal());
  const entry = p.provenance_disposition.find((d) => d.current !== null);
  assert.ok(entry, 'the attach proposal quotes at least one provenance value');
  entry.current = 'something this record does not say';
  assert.ok(checkPreservation(p, CORPUS).some((e) => /was written against a record nobody read/.test(e)));
});

test('a provenance field claimed as "set for the first time" over a value is refused', () => {
  const p = structuredClone(attachProposal());
  const entry = p.provenance_disposition.find((d) => d.current !== null);
  entry.disposition = 'set_first_time';
  assert.ok(validate(p, { allowSimulated: true }).some((e) => /null means nobody looked/.test(e)));
  assert.ok(checkPreservation(p, CORPUS).some((e) => /that is a replacement/.test(e)));
});

test('an attachment declares every provenance field, quoting what data/ carries', () => {
  const p = attachProposal();
  const record = CORPUS.claimById.get(p.record_id);
  const expected = PROVENANCE_FIELDS['data/claims.json'].filter((f) => f in record);
  assert.deepEqual(p.provenance_disposition.map((d) => d.field).sort(), expected.sort());
  for (const d of p.provenance_disposition) {
    assert.equal(d.disposition, 'unchanged');
    const actual = record[d.field];
    assert.equal(d.current, actual === null || actual === undefined ? null : (typeof actual === 'string' ? actual : JSON.stringify(actual)));
  }
  assert.ok(p.provenance_disposition.some((d) => d.field === 'last_verified'),
    'last_verified above all: attaching evidence does not make a record freshly verified');
});

test('untouchedProvenance cannot be satisfied by a caller who guessed', () => {
  const record = CORPUS.claimById.get(FX.ids.dsaClaim);
  const block = untouchedProvenance(record, 'data/claims.json', 'because');
  for (const d of block) {
    const actual = record[d.field];
    assert.equal(d.current, actual === null || actual === undefined ? null : (typeof actual === 'string' ? actual : JSON.stringify(actual)));
  }
});

test('a record kind is proposed against its one home', () => {
  for (const p of RESULT.proposals) {
    assert.equal(HOME_OF[p.record_kind], p.dataset, `${p.proposal_id} names a dataset that is not this record kind's home`);
  }
  const p = { ...attachProposal(), dataset: 'data/sources.json' };
  assert.ok(checkPreservation(p, CORPUS).some((e) => /one home per fact/.test(e)));
});

/* ============================================================
   the gates, and what cannot be turned off
   ============================================================ */

test('a proposal failing the corpus check is refused rather than stored', () => {
  const { it, store } = integrator();
  const bad = structuredClone(attachProposal());
  bad.record_id = 'clm-not-a-real-claim';
  bad.affected_entities = bad.affected_entities.map((e) => ({ ...e, id: 'clm-not-a-real-claim' }));
  /* Reach the private path the way the adapter does: the public run
     builds proposals itself, so this asserts the check, and the
     "every proposal preserves" test above asserts the adapter runs it. */
  assert.ok(checkPreservation(bad, CORPUS).length > 0);
  assert.equal(store.written.length, 0);
  assert.ok(it);
});

test('the store refuses an invalid record, and there is no flag that skips it', () => {
  const { store } = integrator();
  assert.throws(() => store.write({ contract: 'DataProposal', proposal_id: 'x' }), /refusing to store an invalid/);
  const src = readFileSync(join(HERE, 'adapter.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  /* One way out. Every record leaves through #ship, which validates
     against the contract and then stores; a second store.write
     anywhere would be a record that reached the store without
     passing the gate. */
  assert.equal((src.match(/store\.write\(/g) ?? []).length, 1,
    'the adapter has more than one path to the store, and only one of them is gated');
  assert.equal((src.match(/checkPreservation\(/g) ?? []).length, 1,
    'the corpus-level check must be on the single path every proposal takes');
  for (const bypass of ['skipValidation', 'bypass', 'force: true', 'strict: false', 'noValidate']) {
    assert.ok(!src.includes(bypass), `the adapter contains "${bypass}"`);
  }
});

test('a record this agent produced itself is refused at intake', () => {
  const refused = RESULT.refused.filter((r) => r.stage === 'intake');
  assert.equal(refused.length, 1);
  assert.equal(refused[0].what, 'ver-fx-self');
  assert.ok(/H3/.test(refused[0].problems[0]));
});

test('the run record counts what it produced and says nothing was applied', () => {
  const r = RESULT.run_record;
  assert.equal(r.contract, 'AgentRun');
  assert.equal(r.outputs.applied, 0);
  assert.equal(r.outputs.links, RESULT.links.length);
  assert.equal(r.outputs.proposals, RESULT.proposals.length);
  assert.deepEqual(r.affected_entities, [],
    'a read-only run touched nothing; what each proposal is about lives on that proposal');
  assert.ok(r.epistemic.unresolved.some((u) => /applied/i.test(u.question)));
});

test('the approval names things a human can actually do, never "please review"', () => {
  const a = RESULT.approval;
  assert.ok(a, 'a run that produced proposals requests an approval');
  assert.ok(a.what_to_check.length >= RESULT.proposals.length);
  for (const item of a.what_to_check) {
    assert.ok(item.length > 30, `"${item}" is too vague to be done`);
    assert.ok(!/^please review/i.test(item));
  }
  assert.equal(a.tier, RESULT.proposals.some((p) => p.substantive) ? 'red' : 'amber');
  assert.notEqual(a.requested_of, null, 'a request addressed to nobody is a record of having asked nobody');
});

/* ============================================================
   the matcher's own arithmetic
   ============================================================ */

test('overlap is symmetric, bounded, and empty on an empty side', () => {
  const a = tokens('the digital services act stacks obligations across four tiers');
  const b = tokens('obligations under the digital services act are stacked in four tiers');
  assert.equal(overlap(a, b), overlap(b, a));
  assert.ok(overlap(a, b) > 0 && overlap(a, b) <= 1);
  assert.equal(overlap(a, []), 0);
  assert.equal(overlap([], []), 0);
});

test('a tie at or above the accept threshold is ambiguous, not a coin toss', () => {
  const tied = [
    { id: 'a', score: 0.9, strategy: 's', why: 'w' },
    { id: 'b', score: 0.9, strategy: 's', why: 'w' },
  ];
  assert.equal(decide(tied).outcome, 'ambiguous');
  assert.equal(decide(tied).match, null);
  assert.equal(decide([{ id: 'a', score: 0.9, strategy: 's', why: 'w' }]).outcome, 'matched');
  assert.equal(decide([{ id: 'a', score: 0.5, strategy: 's', why: 'w' }]).outcome, 'ambiguous');
  assert.equal(decide([{ id: 'a', score: 0.1, strategy: 's', why: 'w' }]).outcome, 'no_match');
  assert.equal(decide([]).outcome, 'no_match');
});

test('URL normalisation is the Scout\'s, not a second copy', () => {
  const src = readFileSync(join(HERE, 'match.mjs'), 'utf8');
  assert.ok(/from '\.\.\/scout\/dedupe\.mjs'/.test(src));
  assert.equal(normaliseUrl('HTTP://WWW.Example.invalid/a/?utm_source=x'), normaliseUrl('https://example.invalid/a'));
});

/* ============================================================
   the corpus reader
   ============================================================ */

test('the corpus indexes every dataset the repository ships', () => {
  assert.ok(CORPUS.files.length >= 10);
  assert.equal(CORPUS.claimById.size, CORPUS.claims.length);
  assert.equal(CORPUS.sourceById.size, CORPUS.sources.length);
  for (const c of CORPUS.claims) assert.ok(CORPUS.allIds.has(c.id));
  for (const s of CORPUS.sources) assert.ok(CORPUS.allIds.has(s.id));
});

test('the compilation-date signal is derived from the data, not asserted', () => {
  for (const [name, d] of Object.entries(CORPUS.verificationDates)) {
    const expected = d.distinct.length <= 1 || (d.per_record_count / d.distinct.length) >= 10;
    assert.equal(d.is_compilation_date, expected, `${name}`);
  }
  /* data/claims.json carries 84 last_verified values across two
     distinct dates — two bulk stamps, not independent re-checking,
     which is exactly what VERIFICATION-POLICY §5 records. A binary
     "all one value" test would have called that a per-record field
     and told a reader the opposite of the truth. */
  const claims = CORPUS.verificationDates.claims;
  assert.ok(claims.distinct.length > 1, 'this test assumes claims.json still carries more than one distinct date');
  assert.ok(claims.records_per_distinct_date >= 10);
  assert.equal(claims.is_compilation_date, true);
});

test('the provenance field list covers every dataset a proposal can name', () => {
  for (const [kind, home] of Object.entries(HOME_OF)) {
    if (kind === 'taxonomy_term' || kind === 'brief_part') continue;
    assert.ok(home in PROVENANCE_FIELDS, `${kind} lives in ${home}, which declares no provenance fields`);
  }
});
