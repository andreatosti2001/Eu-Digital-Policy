/* ============================================================
   agent/verifier/selftest.mjs

       node --test agent/verifier/selftest.mjs

   node:test, no network, no installation — the same constraint the
   four validators in tools/ and the other three agent suites work
   under.

   These are ADVERSARIAL tests, as SESSION 07's brief requires: each
   one is a legal-status case where the plausible answer is the
   wrong one, and each asserts the Verifier gives the awkward answer
   rather than the tidy one.

   What it holds down, in the order the Verifier would do damage:

     · it never writes to data/ — asserted by hashing the directory
       around a full run, and by scanning the module for a write call
     · an act in force is never reported as applicable
     · a date is never computed from the twentieth-day formula
     · an act applying in stages yields no single application date
     · a repeal is never attached to the act the document amends
     · an annulment under appeal is never reported as settled
     · guidance using "must" never yields an obligation
     · two authorities disagreeing yields a conflict, unresolved,
       with both sides named and no winner picked
     · a lower tier disagreeing with a higher one is NOT a conflict
     · an unreachable document yields a record saying so, never
       silence and never a verdict about the proposition
     · it refuses to verify a candidate it produced itself
     · every record it emits satisfies its contract, and an invalid
       one cannot reach the store
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { deterministicClock, deterministicIds } from '../observability/ids.mjs';
import { validateRecord as validateTraceRecord } from '../observability/schema.mjs';
import { validate } from '../schemas/validate.mjs';
import { MemoryRecordStore } from '../scout/store.mjs';
import { MockTransport } from '../scout/transport.mjs';
import {
  LEGAL_STATUSES, LEGAL_STATUS_TAXONOMY, LEGAL_STATUS_KIND,
  VERIFICATION_VERDICTS, VERIFICATION_OUTCOME_CLASSES, taxonomyIds,
} from '../schemas/types.mjs';

import { Verifier, VERIFIER_AGENT, roleFor, readDocumentId } from './verifier.mjs';
import { MOCK_DOCUMENTS, CANDIDATES, ALL_CANDIDATES, DOC } from './fixtures.mjs';
import { statusSignals, resolveStatus, PROGRESSION, FINALITY_QUALIFIERS } from './statuses.mjs';
import { readDates, sameDate } from './dates.mjs';
import { locate } from './locate.mjs';
import { decompose, sentences, materiality } from './decompose.mjs';
import { findConflicts, compareValues, isAuthoritative } from './conflict.mjs';
import { outcomeClassOf, provenanceVerdictOf, confidenceOf, isNonBinding } from './outcome.mjs';
import { classifyDocument } from './doctype.mjs';
import { judge, supportsFor } from './judge.mjs';
import { RecordBuilder } from './build.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HERE = dirname(fileURLToPath(import.meta.url));

async function runMock(candidates = ALL_CANDIDATES, limits = {}) {
  const tracer = new Tracer({
    sink: new MemorySink({ strict: true }),
    ids: deterministicIds(23),
    clock: deterministicClock('2026-09-02T12:00:00.000Z', 100),
  });
  const store = new MemoryRecordStore({ allowSimulated: true });
  const verifier = new Verifier({ tracer, transport: new MockTransport(MOCK_DOCUMENTS), store, limits });
  const result = await verifier.run({ candidates });
  return { result, store, tracer };
}

/** Every verification produced from one fixture candidate. */
const forCandidate = (result, candidate_id) =>
  result.records.filter((r) => r.affected_entities.some((e) => e.kind === 'document' && e.id === candidate_id));

/** The verification whose statement contains a phrase. */
const stating = (result, fragment) =>
  result.records.find((r) => r.statement.includes(fragment));

let RUN = null;
const theRun = async () => (RUN ??= await runMock());

/* ---------------------------------------------------------- the prohibitions */

test('a full run does not change one byte of data/', async () => {
  const hashDir = () => {
    const dir = join(REPO, 'data');
    return readdirSync(dir).sort().map((f) => `${f}:${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}`).join('\n');
  };
  const before = hashDir();
  await runMock();
  assert.equal(hashDir(), before, 'a file in data/ changed during a Verifier run');
});

test('the Verifier module contains no write path at all', () => {
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(HERE, f), 'utf8');
    for (const forbidden of ['writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync', 'mkdirSync']) {
      assert.ok(!src.includes(forbidden), `${f} contains ${forbidden}: this agent stores through agent/scout/store.mjs and writes nothing itself`);
    }
  }
});

test('it refuses to verify a candidate it produced itself', async () => {
  const { result } = await theRun();
  const refusal = result.refused.find((r) => r.candidate_id === 'cand-self-scouted');
  assert.ok(refusal, 'a candidate whose agent is the Verifier was accepted');
  assert.match(refusal.reason, /never verifies its own scouting/);
  assert.equal(forCandidate(result, 'cand-self-scouted').length, 0, 'a refused candidate still produced records');
});

test('it refuses a record that is not a SourceCandidate', async () => {
  const notACandidate = { ...CANDIDATES.formula, contract: 'DataGap' };
  const { result } = await runMock([notACandidate]);
  assert.equal(result.records.length, 0);
  assert.equal(result.refused.length, 1);
});

/* ---------------------------------------------------------- A · the formula */

test('adversarial · the twentieth-day formula yields a rule, never a computed date', async () => {
  const { result } = await theRun();
  const r = stating(result, 'twentieth day following');
  assert.ok(r, 'the formula proposition was not checked');

  assert.equal(r.entry_into_force_date, 'unknown',
    'a date was produced from "the twentieth day following publication" — computing one is a fabricated legal fact');
  const open = r.epistemic.unresolved.find((u) => u.field === 'entry_into_force_date');
  assert.ok(open, 'the refusal to compute was not recorded as an open question');
  assert.equal(open.absence_kind, 'unknown_not_determinable',
    'the formula case is researched-and-not-determinable, not "nobody looked"');
  assert.match(open.missing, /does not perform that arithmetic/);
  assert.equal(r.verdict, 'partially_confirmed');

  /* And the module refuses it in isolation, not only in the run. */
  const d = readDates('This Regulation shall enter into force on the twentieth day following that of its publication in the Official Journal.');
  assert.equal(d.entry_into_force.value, null);
  assert.match(d.entry_into_force.formula, /twentieth day following/);
});

/* ---------------------------------------------------------- B · in force ≠ applicable */

test('adversarial · an act in force with a later application date is never reported as applicable', async () => {
  const { result } = await theRun();
  for (const r of forCandidate(result, 'cand-in-force')) {
    assert.notEqual(r.legal_status, 'applicable',
      `${r.verification_id} reported an act as applicable when its own text only schedules application`);
  }
  const inForce = forCandidate(result, 'cand-in-force').find((r) => r.legal_status === 'entered_into_force');
  assert.ok(inForce, 'the act was not placed in force at all');
  assert.equal(inForce.entry_into_force_date, '1 August 2099');
  assert.equal(inForce.applicability_date, '2 August 2101');
  assert.notEqual(inForce.entry_into_force_date, inForce.applicability_date);
});

test('adversarial · a proposition ASSERTING applicability over a text that only schedules it is downgraded', () => {
  const doc = 'This Regulation entered into force on 1 August 2099. It shall apply from 2 August 2101. The Regulation is applicable.';
  const dates = readDates(doc);
  const verdict = judge({
    proposition: { text: 'The Regulation is applicable.', index: 0 },
    status: resolveStatus(statusSignals(doc)),
    dates,
    location: { raw: 'Article 113' },
    legal_status: 'entered_into_force',
  });
  assert.equal(verdict.verdict, 'partially_confirmed');
  assert.match(verdict.residual_gap, /An act in force is not thereby an act that applies/);
});

test('the judging path reads no clock: whether a stated date has arrived is never decided', () => {
  /* AUDIT-2026-09-01 F-15 — derived output that depends on the
     reader's clock changes with when and where a page is opened. A
     legal status must not. */
  /* Comments are stripped first: these files DISCUSS clocks at
     length, and the question is whether they call one. */
  const codeOf = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  for (const f of ['judge.mjs', 'statuses.mjs', 'dates.mjs', 'conflict.mjs', 'locate.mjs', 'decompose.mjs']) {
    const src = codeOf(readFileSync(join(HERE, f), 'utf8'));
    for (const clock of ['Date.now', 'new Date(', 'Date.parse', 'toISOString']) {
      assert.ok(!src.includes(clock), `${f} reads a clock (${clock}): a verdict that changes with when it is asked is not a verdict`);
    }
  }
});

test('the tense rule: "shall apply from" is not an applicability signal, "has applied since" is', () => {
  assert.equal(statusSignals('It shall apply from 2 August 2101.').filter((s) => s.status === 'applicable').length, 0);
  assert.equal(statusSignals('It has applied since 25 May 2018.').filter((s) => s.status === 'applicable').length, 1);
});

/* ---------------------------------------------------------- C · stages */

test('adversarial · an act applying in stages yields no single application date', async () => {
  const { result } = await theRun();
  const records = forCandidate(result, 'cand-staged');
  assert.ok(records.length, 'the staged document produced nothing');
  for (const r of records) {
    assert.notEqual(r.applicability_date, '2 February 2100', 'the earlier of two staged dates was taken as the answer');
    assert.notEqual(r.applicability_date, '2 August 2101', 'the later of two staged dates was taken as the answer');
    assert.equal(r.applicability_date, 'unknown');
  }
  const staged = records.find((r) => r.verdict === 'not_determinable');
  assert.ok(staged, 'a document giving two application dates settled on one');
  assert.match(staged.residual_gap, /applies in stages/);
});

/* ---------------------------------------------------------- D · two acts */

test('adversarial · a repeal is never attached to the act the same document amends', async () => {
  const { result } = await theRun();
  const repeal = stating(result, 'is repealed with effect from');
  const amend = stating(result, 'is amended as set out');
  assert.ok(repeal && amend, 'the two-act document did not produce both propositions');
  assert.equal(repeal.legal_status, 'repealed');
  assert.equal(amend.legal_status, 'amended');
  /* The DSA is the act being AMENDED. Nothing may report it repealed. */
  const aboutDsa = result.records.filter((r) => r.affected_entities.some((e) => e.kind === 'instrument' && e.id === 'dsa'));
  for (const r of aboutDsa) {
    assert.notEqual(r.legal_status, 'repealed', `${r.verification_id} reports the DSA repealed; the document amends it`);
  }
});

test('a status is never read from the document at large when it discusses several instruments', () => {
  const multi = 'The predecessor instrument is repealed with effect from 25 May 2099. The DSA is amended as set out in the Annex.';
  const s = resolveStatus(statusSignals(multi));
  assert.equal(s.status, null, 'a document repealing one act and amending another was given a single status');
  assert.equal(s.ambiguous, true);
});

/* ---------------------------------------------------------- E · annulled on appeal */

test('adversarial · an annulment under appeal is under judicial review, not annulled', async () => {
  const { result } = await theRun();
  const annulment = stating(result, 'is annulled');
  assert.ok(annulment, 'the annulment proposition was not checked');
  assert.equal(annulment.legal_status, 'under_judicial_review',
    'an annulment was reported as settled while the same judgment records a pending appeal against it');

  const method = annulment.epistemic.inference.find((e) => e.field === 'legal_status').method;
  assert.match(method, /not final/);

  /* Nothing produced from that judgment may say "annulled" flatly. */
  for (const r of forCandidate(result, 'cand-annulled')) {
    assert.notEqual(r.legal_status, 'annulled');
  }
});

test('the qualifier is document-scoped, and a bare annulment with no appeal stays annulled', () => {
  assert.equal(resolveStatus(statusSignals('The decision is annulled.')).status, 'annulled');
  assert.equal(resolveStatus(statusSignals('The decision is annulled. An appeal is pending before the Court of Justice.')).status, 'under_judicial_review');
  assert.deepEqual(FINALITY_QUALIFIERS, ['under_judicial_review']);
});

/* ---------------------------------------------------------- F · corrigendum */

test('adversarial · a corrigendum is "corrected", a status the site has no word for', async () => {
  const { result } = await theRun();
  const r = stating(result, 'Corrigendum to simulated Regulation');
  assert.ok(r);
  assert.equal(r.legal_status, 'corrected');
  /* And the honest part: the site's taxonomy carries no term for it,
     so the agent layer holds one and says the mapping is empty. */
  assert.equal(LEGAL_STATUS_TAXONOMY.corrected, null);
});

/* ---------------------------------------------------------- G · guidance */

test('adversarial · guidance using "must" never yields an obligation', async () => {
  const { result } = await theRun();
  const r = stating(result, 'Controllers must inform data subjects');
  assert.ok(r, 'the guidance obligation proposition was not checked');
  assert.equal(r.legal_status, 'guidance');
  assert.equal(r.verdict, 'partially_confirmed',
    'an obligation was confirmed out of a document that states it is not legally binding');
  assert.match(r.residual_gap, /What binds is the instrument the guidance is about/);

  const reading = r.epistemic.interpretation.find((i) => /not as an obligation/.test(i.statement));
  assert.ok(reading, 'the non-binding reading was not attributed as an interpretation');
  assert.equal(reading.held_by, VERIFIER_AGENT);
  assert.equal(reading.contested, true);
  assert.ok(isNonBinding('guidance') && isNonBinding('non_binding_commentary'));
});

/* ---------------------------------------------------------- H · conflict */

test('adversarial · two authorities disagreeing yields one conflict, unresolved, with no winner', async () => {
  const { result } = await theRun();
  assert.equal(result.conflicts.length, 1, 'the same disagreement was reported more than once, or not at all');

  const c = result.conflicts[0];
  assert.equal(c.verdict, 'conflict');
  assert.equal(outcomeClassOf(c.verdict), 'conflict');
  assert.equal(c.conflicting_evidence.length, 1);
  assert.equal(c.conflicting_evidence[0].evidence_refs.length, 2, 'a conflict was recorded with fewer than two sides');

  /* Both dates appear; neither is promoted to an answer. */
  assert.match(c.conflicting_evidence[0].disagreement, /18 October 2099/);
  assert.match(c.conflicting_evidence[0].disagreement, /17 January 2100/);
  assert.equal(c.applicability_date, null, 'the conflict record chose one of the two disputed dates');
  assert.ok(c.residual_gap);

  const open = c.epistemic.unresolved.find((u) => u.field === 'applicability_date');
  assert.ok(open?.blocks, 'an unresolved conflict did not block anything downstream');

  /* And the judgement that they conflict states its method. */
  assert.ok(c.epistemic.inference.some((e) => e.field === 'conflicting_evidence'));
});

test('a lower tier disagreeing with a higher one is not a conflict', () => {
  const f = (id, cid, value, tier) => ({
    finding_id: id, candidate_id: cid, instrument_id: 'nis2', attribute: 'applicability_date',
    value, tier, quote: 'q', url: `https://x.invalid/${cid}`,
  });
  const primary = findConflicts([f('a', 'c1', '18 October 2099', 'tier:1'), f('b', 'c2', '1 January 2100', 'tier:4')]);
  assert.equal(primary.conflicts.length, 0, 'commentary contradicting the Official Journal was reported as a conflict between authorities');
  assert.equal(primary.outranked.length, 1);

  const both = findConflicts([f('a', 'c1', '18 October 2099', 'tier:1'), f('b', 'c2', '1 January 2100', 'tier:2')]);
  assert.equal(both.conflicts.length, 1);
  assert.ok(isAuthoritative('tier:1') && isAuthoritative('tier:2'));
  assert.ok(!isAuthoritative('tier:3') && !isAuthoritative('tier:4'));
});

test('the same date written two ways is agreement; two precisions are neither agreement nor conflict', () => {
  assert.equal(compareValues('applicability_date', '2026-08-02', '2 August 2026'), 'agree');
  assert.equal(compareValues('publication_date', '12 July 2024', 'July 2024'), 'precision');
  assert.equal(compareValues('applicability_date', '2 August 2026', '3 August 2026'), 'disagree');
  assert.ok(sameDate('2026-08-02', '2 August 2026'));
  assert.ok(!sameDate('July 2024', '12 July 2024'), 'unequal precision was treated as equality, which widens what the source said');
});

/* ---------------------------------------------------------- I · nothing stated */

test('adversarial · a press release that places nothing gets no status from its publisher', async () => {
  const { result } = await theRun();
  const records = forCandidate(result, 'cand-press');
  assert.ok(records.length);
  for (const r of records) {
    assert.equal(r.legal_status, null, 'a status was inferred from who published the document');
    const open = r.epistemic.unresolved.find((u) => u.field === 'legal_status');
    assert.ok(open, 'a null status was left undeclared');
    assert.equal(open.absence_kind, 'null_not_researched');
  }
});

/* ---------------------------------------------------------- J · register vs text */

test('adversarial · where metadata and the operative text disagree, the text governs and the disagreement is reported', async () => {
  const { result } = await theRun();
  const r = stating(result, 'published in the Official Journal on 12 July 2099');
  assert.ok(r, 'the metadata-disagreement proposition was not checked');
  assert.equal(r.publication_date, '12 July 2099', 'the machine-readable field was preferred over the operative text');
  assert.notEqual(r.publication_date, '2099-07-09');
  assert.equal(r.verdict, 'partially_confirmed');
  assert.match(r.residual_gap, /2099-07-09/);
  assert.match(r.residual_gap, /operative text governs/);
});

/* ---------------------------------------------------------- K · unreachable */

test('adversarial · an unreachable document yields a record saying so, never a verdict about the proposition', async () => {
  const { result } = await theRun();
  const r = forCandidate(result, 'cand-blocked')[0];
  assert.ok(r, 'a refused retrieval produced silence');
  assert.equal(r.verdict, 'source_unavailable');
  assert.equal(outcomeClassOf(r.verdict), 'unresolved');
  assert.equal(r.evidence[0].kind, 'absent');
  assert.equal(r.evidence[0].supports, null);
  assert.equal(r.evidence[0].role, 'unresolved');

  /* Nothing is asserted about the act. */
  for (const field of ['legal_status', 'publication_date', 'entry_into_force_date', 'applicability_date', 'document_id']) {
    assert.equal(r[field], null, `${field} was filled in for a document nobody read`);
  }
  assert.ok(r.epistemic.unresolved.some((u) => u.blocks));
  assert.match(r.residual_gap, /egress policy/);
});

/* ---------------------------------------------------------- decomposition */

test('a conjunction is split before it is checked, and immaterial sentences are counted rather than dropped', () => {
  const text = 'Article 5 The Regulation entered into force on 1 August 2099. Skip to content. Controllers must inform data subjects. This page was last updated.';
  const d = decompose(text);
  assert.equal(d.total, d.propositions.length + d.set_aside.length, 'a sentence went missing between decomposition and its two buckets');
  assert.ok(d.set_aside.length >= 1, 'nothing was set aside from a document containing navigation text');
  for (const s of d.set_aside) assert.ok(s.reasons.length, 'a sentence was set aside with no reason recorded');
});

test('an abbreviation does not end a sentence', () => {
  const s = sentences('Art. 5 applies to controllers. It does not apply to processors.');
  assert.equal(s.length, 2, `"Art." was treated as a sentence end: ${JSON.stringify(s.map((x) => x.text))}`);
});

test('materiality is a stated rule, and a heading is not a proposition', () => {
  assert.equal(materiality({ text: 'Skip to content.' }).material, false);
  assert.equal(materiality({ text: 'The Regulation entered into force on 1 August 2099.' }).material, true);
  assert.deepEqual(materiality({ text: 'A simulated notice about municipal parking arrangements here.' }).reasons,
    ['no legal-status signal, date, obligation, penalty or instrument reference']);
});

/* ---------------------------------------------------------- location */

test('a proposition is located, or the absence of a locator is recorded as a finding', async () => {
  const { result } = await theRun();
  for (const r of result.records) {
    if (r.supporting_location === null) {
      assert.ok(
        r.epistemic.unresolved.some((u) => u.field === 'supporting_location'),
        `${r.verification_id} has no location and no open question naming one`,
      );
    } else {
      assert.ok(r.supporting_location.raw, `${r.verification_id} carries an empty locator`);
      assert.ok(
        r.epistemic.fact.some((f) => f.field === 'supporting_location'),
        `${r.verification_id} states a location with no fact entry citing where it was read`,
      );
    }
  }
});

test('an article carries its own bracketed paragraph', () => {
  const text = 'Article 99(2) This Regulation shall apply from 25 May 2018.';
  const loc = locate(text, { text, index: 0 });
  assert.equal(loc.article, '99');
  assert.equal(loc.paragraph, '2');
  assert.equal(loc.raw, 'Article 99(2)');
});

/* ---------------------------------------------------------- identity and tier */

test('a document identifier is read from the document, never taken from its URL', () => {
  assert.equal(readDocumentId('concerning 32016R0679 and other matters').value, '32016R0679');
  assert.equal(readDocumentId('Regulation (EU) 2016/679 applies').value, 'Regulation (EU) 2016/679');
  assert.equal(readDocumentId('a page with no identifier'), null);
  /* The URL carries a CELEX-looking string; the text does not. */
  assert.equal(readDocumentId('nothing here'), null);
});

test('an unplaced tier is an open question, and an unregistered publisher is not called secondary', async () => {
  const { result } = await theRun();
  for (const r of result.records) {
    if (r.source_tier === null) {
      assert.ok(
        r.epistemic.unresolved.some((u) => u.field === 'source_tier'),
        `${r.verification_id} leaves source_tier null with no open question`,
      );
    } else {
      assert.ok(taxonomyIds('source_tier').includes(r.source_tier));
      assert.ok(r.epistemic.inference.some((e) => e.field === 'source_tier'));
    }
  }
  assert.equal(roleFor(null), 'unresolved', 'an unregistered publisher was defaulted to secondary');
  assert.equal(roleFor('authority:eur-lex'), 'primary');
});

test('a document type is read from the document\'s own wording, or left null', () => {
  assert.equal(classifyDocument('HAVE ADOPTED THIS REGULATION:').source_type, 'source-type:regulation');
  assert.equal(classifyDocument('These Guidelines are not legally binding.').source_type, 'source-type:guidance');
  assert.equal(classifyDocument('A simulated page about parking.').source_type, null);
});

/* ---------------------------------------------------------- the vocabularies */

test('the outcome class is total over the verdicts, and derived rather than stored', async () => {
  for (const v of VERIFICATION_VERDICTS) {
    assert.ok(VERIFICATION_OUTCOME_CLASSES.includes(outcomeClassOf(v)));
    assert.ok(provenanceVerdictOf(v));
  }
  const { result } = await theRun();
  for (const r of result.records) {
    assert.ok(!('outcome_class' in r), 'a record stored the outcome class the contract forbids');
  }
});

test('the lifecycle is cumulative and everything off it is not', () => {
  assert.deepEqual(PROGRESSION, ['proposed', 'adopted', 'published', 'entered_into_force', 'applicable']);
  for (const s of PROGRESSION) assert.ok(LEGAL_STATUSES.includes(s));
  /* published then in force is one act at two points in its life. */
  assert.equal(resolveStatus(statusSignals('Published in the Official Journal on 1 May 2099. It entered into force on 20 May 2099.')).status, 'entered_into_force');
  /* repealed and amended are two things about two acts. */
  assert.equal(resolveStatus(statusSignals('It is repealed. The other act is amended.')).ambiguous, true);
});

test('every legal status has a kind, and the non-binding ones are the two that cannot bind', () => {
  for (const s of LEGAL_STATUSES) assert.ok(LEGAL_STATUS_KIND[s], `${s} has no kind`);
  assert.deepEqual(LEGAL_STATUSES.filter((s) => LEGAL_STATUS_KIND[s] === 'non_binding'), ['guidance', 'non_binding_commentary']);
});

test('confidence never reaches 1, and an ambiguous status lowers it', () => {
  const base = { verdict: 'confirmed', located: true, quoted: true, statusFromSentence: true, authoritative: true, documentIdentified: true, ambiguousStatus: false };
  assert.ok(confidenceOf(base) <= 0.9, 'a rule-based verifier claimed certainty');
  assert.ok(confidenceOf({ ...base, ambiguousStatus: true }) < confidenceOf(base));
  assert.ok(confidenceOf({ ...base, located: false }) < confidenceOf(base));
});

test('supports follows the verdict, and context never appears', () => {
  assert.equal(supportsFor('confirmed'), 'supports:direct');
  assert.equal(supportsFor('partially_confirmed'), 'supports:partial');
  assert.equal(supportsFor('not_determinable'), 'supports:partial');
  assert.equal(supportsFor('source_unavailable'), null);
  for (const v of VERIFICATION_VERDICTS) {
    assert.notEqual(supportsFor(v), 'supports:context');
  }
});

/* ---------------------------------------------------------- the builder */

test('the builder cannot produce a value without its epistemic entry', () => {
  const span = { trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16), run_id: 'c'.repeat(16) };
  const b = new RecordBuilder({ contract: 'VerificationRecord', agent: 'x', now: '2026-09-02T00:00:00.000Z', span, simulated: true });

  assert.throws(() => b.fact('publication_date', null, 's', ['ev']), /use openNull or openUnknown/);
  assert.throws(() => b.fact('publication_date', '1 May 2099', 's', []), /cites nothing/);

  b.openUnknown('applicability_date', 'When?', 'A stated date.');
  assert.equal(b.fields.applicability_date, 'unknown');
  assert.equal(b.ep.unresolved[0].absence_kind, 'unknown_not_determinable');

  b.openNull('publication_date', 'When?', 'A stated date.');
  assert.equal(b.fields.publication_date, null);
  assert.equal(b.ep.unresolved[1].absence_kind, 'null_not_researched');
});

/* ---------------------------------------------------------- the gate */

test('every record the Verifier emits satisfies its contract', async () => {
  const { result, store } = await theRun();
  assert.ok(store.written.length >= result.records.length);
  for (const r of store.written) {
    const errs = validate(r, { allowSimulated: true });
    assert.deepEqual(errs, [], `${r.contract} ${r.verification_id ?? r.run_id} is invalid:\n  · ${errs.join('\n  · ')}`);
  }
});

test('an invalid record cannot reach the store', () => {
  const store = new MemoryRecordStore({ allowSimulated: true });
  assert.throws(() => store.write({ contract: 'VerificationRecord', contract_version: 1 }), /refusing to store an invalid/);
});

test('every record is marked simulated, and none is actionable', async () => {
  const { store } = await theRun();
  for (const r of store.written) {
    assert.equal(r.simulated, true, 'a fixture-derived record is not marked simulated');
    assert.ok(validate(r).some((e) => /marked simulated/.test(e)), 'a simulated record validated as actionable');
  }
});

/* ---------------------------------------------------------- the trace */

test('every step is instrumented, and the trace is a pointer rather than a second copy', async () => {
  const { result, tracer } = await theRun();
  const records = tracer.sink.records;

  for (const r of records) {
    assert.deepEqual(validateTraceRecord(r), [], `invalid trace record: ${JSON.stringify(r).slice(0, 200)}`);
  }

  const names = new Set(records.filter((r) => r.type === 'span.start').map((r) => r.name));
  for (const step of ['verifier.intake', 'verifier.retrieve', 'verifier.decompose', 'verifier.proposition', 'verifier.crosscheck']) {
    assert.ok(names.has(step), `${step} is not instrumented`);
  }

  /* One artifact per emitted record, carrying an id and a hash and
     not the record body. */
  const artifacts = records.filter((r) => r.type === 'artifact');
  assert.ok(artifacts.length >= result.records.length);
  for (const a of artifacts) {
    assert.match(a.sha256, /^[0-9a-f]{64}$/);
    assert.equal(a.preview, null, 'the trace carries a copy of the record body');
    assert.ok(!('statement' in a), 'the trace carries the record\'s own fields');
  }

  /* Every verdict is a decision with alternatives, and every read
     document leaves a provenance record. */
  const decisions = records.filter((r) => r.type === 'decision');
  assert.ok(decisions.length >= result.propositions_checked);
  for (const d of decisions) assert.ok(d.alternatives.length, 'a verdict was recorded with no alternatives considered');

  const provenance = records.filter((r) => r.type === 'provenance');
  assert.ok(provenance.length >= result.propositions_checked);
  for (const p of provenance) {
    assert.ok(p.verification, 'a provenance record carries no verification block');
    assert.ok(p.verification.verdict, 'a provenance record carries no verdict');
    assert.equal(p.verification.checked_by, VERIFIER_AGENT);
  }

  /* The trace id survives from the run down to the provenance. */
  const traceIds = new Set(records.map((r) => r.trace_id));
  assert.equal(traceIds.size, 1, 'a run produced more than one trace');
});

/* ---------------------------------------------------------- the run record */

test('the run says what it did not reach, and does not call itself autonomous while blocked', async () => {
  const { store } = await theRun();
  const run = store.written.find((r) => r.contract === 'AgentRun');
  assert.ok(run);
  assert.equal(run.affected_entities.length, 0, 'a read-only run claimed to have touched an entity');

  const blocking = run.epistemic.unresolved.filter((u) => u.blocks);
  assert.ok(blocking.length, 'a run holding an unresolved conflict recorded no blocking question');
  assert.equal(run.autonomy_class, 'review_required',
    'a run holding a blocking question called itself autonomous');

  assert.ok(run.epistemic.unresolved.some((u) => /refused at intake/.test(u.missing)));
});

test('a run limit that drops candidates says so rather than looking complete', async () => {
  const { result, store } = await runMock(ALL_CANDIDATES, { max_candidates: 2 });
  const run = store.written.find((r) => r.contract === 'AgentRun');
  assert.equal(run.outputs.not_reached, ALL_CANDIDATES.length - 2);
  assert.ok(run.epistemic.unresolved.some((u) => /did not reach/.test(u.question)));
  assert.ok(result.records.length < 23);
});

/* --------------------------------- node identity (SESSION 13) */

test('a verification id is derived from what was checked, not from a counter', async () => {
  /* Two runs over the same candidates and the same documents are
     the same verifications, and carry the same ids. Under the
     per-run counter this was true only by accident of ordering:
     verify a subset and every id shifted. */
  const a = await runMock();
  const b = await runMock();
  assert.deepEqual(
    a.result.records.map((r) => r.verification_id).sort(),
    b.result.records.map((r) => r.verification_id).sort(),
  );
});

test('verifying a subset does not renumber the verifications it shares with the whole', async () => {
  const whole = await runMock();
  const some = ALL_CANDIDATES.slice(2);
  const part = await runMock(some);

  const key = (r) => `${r.statement}|${r.affected_entities.map((e) => e.id ?? '').sort().join(',')}`;
  const first = new Map(whole.result.records.map((r) => [key(r), r.verification_id]));
  let compared = 0;
  for (const r of part.result.records) {
    if (!first.has(key(r))) continue;
    compared++;
    assert.equal(r.verification_id, first.get(key(r)), `${key(r).slice(0, 60)} was renumbered by verifying fewer candidates`);
  }
  assert.ok(compared > 0, 'the subset shared no verification with the whole, so this proved nothing');
});

test('every verification id in a run is distinct', async () => {
  const { result } = await runMock();
  const ids = result.records.map((r) => r.verification_id);
  assert.equal(new Set(ids).size, ids.length, 'two verifications share an id');
});
