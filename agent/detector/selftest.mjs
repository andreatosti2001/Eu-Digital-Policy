/* ============================================================
   agent/detector/selftest.mjs

       node --test agent/detector/selftest.mjs

   node:test, no network, no installation — the same constraint the
   four validators in tools/ and the other five agent suites work
   under. Run against the REAL data/ directory, like the
   integration suite and for the same reason: a change detector
   tested only against a corpus this session invented would prove
   nothing about the corpus it will actually meet.

   THE SEVEN THE SESSION REQUIRES TESTS FOR are marked ▸ below.
   Around them are the tests that hold the classifier to the things
   it must not quietly do: default a transition it has no word for,
   report an absence of comparison as agreement, call a court being
   asked a court deciding, or call a date that moved earlier
   "DELAYED".

     ▸ unchanged source
     ▸ metadata-only update
     ▸ substantive date change
     ▸ amendment
     ▸ correction
     ▸ contradictory source
     ▸ court reversal
     · a transition the table has no kind for is a gap, not a guess
     · a status the vocabulary cannot name is not "no record"
     · a deliberate non-change is not a hole
     · a staged act is not compared against one of its stages
     · every page named is derived, and agrees with §5
     · data/ is never written to

   SESSION 10 added the impact map, and its tests sit at the end of
   this file under their own heading.
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
import {
  REGULATORY_CHANGE_KINDS, MATERIALITY_LEVELS, LEGAL_STATUSES, LEGAL_STATUS_TAXONOMY,
} from '../schemas/types.mjs';
import { loadCorpus, hashDataDir } from '../integrate/canonical.mjs';

import { Detector, DETECTOR_AGENT } from './detector.mjs';
import { classify, TRANSITIONS, STATUS_FROM_TAXONOMY, compareDates, dayOrdinal, RULE_NAMES } from './classify.mjs';
import { materialityOf, confidenceOf, autonomyFor, READER_ACTS_ON, MATERIALITY_RANK } from './materiality.mjs';
import { snapshotFor, byDocument, corpusStatusOf, eventsOf, EVENT_TYPE_FOR } from './snapshots.mjs';
import { buildPageMap, affectedPages, affectedDatasets, CHROME_MODULES } from './surfaces.mjs';
import { retrievedDocumentOf } from '../integrate/sources.mjs';
import { buildFixtures, ver, doc, FIXTURE_AS_OF } from './fixtures.mjs';
import { buildGraph, referenceFieldsByKind } from './graph.mjs';
import { fieldsOf, PROSE_FIELDS } from './fields.mjs';
import {
  mapImpact, graphPreview, routeOf, labelAmbiguity, proseMentions, datesIn,
  monthNames, indexKeys, MODULE_SURFACE, INDEX_KEY_KIND, SURFACE_KINDS, GOVERNANCE_PERMITS,
} from './impact.mjs';
import { impactState, buildTree } from '../observability/query.mjs';
import { AUTONOMY_RANK } from '../schemas/types.mjs';
import { ENVELOPE_FIELDS } from '../schemas/common.mjs';

const ENVELOPE_KEYS = new Set([...Object.keys(ENVELOPE_FIELDS), 'contract', 'contract_version']);

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');

const CORPUS = loadCorpus();
const FX = buildFixtures(CORPUS);

function harness() {
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({
    service: 'test',
    sink,
    ids: deterministicIds(59),
    clock: deterministicClock('2026-09-02T12:00:00.000Z', 100),
    attributes: { agent: DETECTOR_AGENT },
  });
  return { tracer, store: new MemoryRecordStore({ allowSimulated: true }), sink };
}

const detector = (over = {}) => {
  const { tracer, store, sink } = harness();
  return { it: new Detector({ tracer, store, corpus: CORPUS, asOf: FIXTURE_AS_OF, simulated: true, ...over }), store, sink };
};

/** The sink the last full run wrote to, so the observability tests
 *  can read the trace the run actually emitted rather than a second
 *  one built for them. */
let LAST_SINK = null;

/** Run just these verifications, so a test asserts about its own
 *  case rather than about the whole corpus of fixtures. */
const runOn = async (cases) => {
  const { it, sink } = detector();
  const out = await it.run({ verifications: cases });
  LAST_SINK = sink;
  return out;
};

const HASH_BEFORE = hashDataDir();
const FULL = await runOn(FX.all);
/* The trace the full run emitted, captured here rather than read
   from LAST_SINK inside a test: later runOn calls overwrite it. */
const FULL_SINK = LAST_SINK;
const HASH_AFTER = hashDataDir();

const changeOf = (result, kind) => result.changes.find((c) => c.change_kind === kind);

/* ============================================================
   data/ is never written to
   ============================================================ */

test('a full run leaves every file in data/ byte-identical', () => {
  assert.deepEqual(HASH_AFTER, HASH_BEFORE,
    'a run of the change detector changed a canonical dataset. It has no code path that should be able to.');
  assert.equal(FULL.run_record.outputs.edits_made, 0);
});

test('no module in agent/detector/ contains a write call', () => {
  const forbidden = ['writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync', 'mkdirSync', 'writeFile(', 'rename('];
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const code = readFileSync(join(HERE, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');
    for (const call of forbidden) {
      assert.ok(!code.includes(call), `${f} contains "${call}". Nothing in this directory writes.`);
    }
  }
});

test('a detection carries no edit and proposes nothing', () => {
  for (const c of FULL.changes) {
    for (const key of ['proposed_change', 'operations', 'proposed', 'files', 'diff_summary', 'branch', 'commit', 'applied_at']) {
      assert.ok(!(key in c), `a RegulatoryChange carries "${key}", which its contract forbids`);
    }
  }
});

/* ============================================================
   ▸ 1 · UNCHANGED SOURCE
   ============================================================ */

test('▸ an unchanged source is a stated finding, not silence', async () => {
  const r = await runOn([FX.cases.unchangedBefore, FX.cases.unchangedAfter]);

  assert.equal(r.unchanged.length, 1, 'two readings of one unchanged document produce exactly one "unchanged" finding');
  const u = r.unchanged[0];
  assert.equal(u.verification_id, 'ver-det-unchanged-1');
  assert.equal(u.previous_verification_id, 'ver-det-unchanged-0');
  assert.equal(u.as_of, FIXTURE_AS_OF, 'and it carries the as-of date, without which it cannot be told from a stale report');
  assert.match(u.why, /Nothing has decayed/);

  /* No RegulatoryChange is produced for it: nothing changed. */
  const fromThese = r.changes.filter((c) => (c.epistemic.fact ?? []).length >= 0
    && c.affected_entities.some((e) => e.id === 'dsa') && c.change_kind === 'UPDATED');
  assert.equal(fromThese.length, 0, 'an unchanged document is not an UPDATED');

  /* And the run record says so, so an empty result is legible. */
  assert.equal(r.run_record.outputs.unchanged, 1);
  assert.ok(r.run_record.epistemic.inference.some((i) => /unchanged as at/.test(i.statement)),
    'the run record states the empty result rather than leaving it to be inferred from an absence');
});

test('an absence of comparison is never reported as "unchanged"', () => {
  /* One reading, no earlier one. bytes_changed must be null, not
     false: nothing was compared. */
  const only = FX.cases.dateChange;
  const snap = snapshotFor(only, { history: [], docOf: retrievedDocumentOf });
  assert.equal(snap.previous, null);
  assert.equal(snap.block.bytes_changed, null, 'null, not false — nothing was compared');
  assert.match(snap.block.note, /not something this run established/);

  /* And the contract refuses the combination outright. */
  const bad = { ...FX_CHANGE(), source_snapshot: { previous_verification_id: null, previous_checksum: null, current_checksum: 'a'.repeat(64), bytes_changed: false, note: 'x' } };
  assert.ok(validate(bad, { allowSimulated: true }).some((e) => /an absence of comparison is not a finding of no change/.test(e)));
});

/* A real detection from the full run, to mutate in tests that need
   a valid starting record. */
function FX_CHANGE() {
  const c = FULL.changes[0];
  assert.ok(c, 'the fixture corpus produces at least one change');
  return structuredClone(c);
}

/* ============================================================
   ▸ 2 · METADATA-ONLY UPDATE
   ============================================================ */

test('▸ a document whose bytes moved and whose values did not is UPDATED, metadata_only', async () => {
  const r = await runOn([FX.cases.metadataBefore, FX.cases.metadataAfter]);
  const c = changeOf(r, 'UPDATED');

  assert.ok(c, 'the bytes moved, so there is an UPDATED');
  assert.equal(c.materiality, 'metadata_only');
  assert.equal(c.attribute, null, 'nothing the corpus asserts moved, so no attribute did');
  assert.equal(c.source_snapshot.bytes_changed, true);
  assert.equal(c.source_snapshot.previous_verification_id, 'ver-det-metadata-0');
  assert.notEqual(c.source_snapshot.previous_checksum, c.source_snapshot.current_checksum);

  /* The limit of what a checksum establishes travels with the
     record rather than being left to whoever reads the report. */
  assert.match(c.source_snapshot.note, /never where/);
  assert.ok(c.epistemic.unresolved.some((u) => /meaning change where its bytes did/.test(u.question)),
    'a metadata-only finding carries the open question that a substantive change inside the document would look identical');
});

test('UPDATED can never carry a materiality above metadata_only', () => {
  const c = FX_CHANGE();
  c.change_kind = 'UPDATED';
  c.materiality = 'substantive';
  assert.ok(validate(c, { allowSimulated: true }).some((e) => /how a substantive change becomes invisible/.test(e)));
});

test('UPDATED is tested last, so nothing substantive can fall into it', () => {
  assert.equal(RULE_NAMES[RULE_NAMES.length - 1], 'the document moved and nothing it asserts did',
    'UPDATED asserts that nothing moved, so every rule that could find a real change runs first');
});

/* ============================================================
   ▸ 3 · SUBSTANTIVE DATE CHANGE
   ============================================================ */

test('▸ a date the corpus does not carry is DELAYED, and a reader acts on it', async () => {
  const r = await runOn([FX.cases.dateChange]);
  const c = changeOf(r, 'DELAYED');

  assert.ok(c, 'a stated application date later than the timeline event is DELAYED');
  assert.equal(c.attribute, 'date');
  assert.equal(c.old_value, FX.ids.gdprApplyDate, 'the corpus side is read from data/timeline.json, not typed into the fixture');
  assert.equal(c.new_value, '9 September 2099');
  assert.notEqual(c.old_value, c.new_value);
  assert.equal(c.materiality, 'reader_acts_on_it');
  assert.equal(c.autonomy_class, 'human_only');
  assert.deepEqual(c.affected_datasets, ['data/timeline.json']);
  assert.ok(c.affected_pages.length > 0);

  /* The new value is carried exactly as the document prints it. */
  assert.ok(c.epistemic.fact.some((f) => f.field === 'new_value' && /not normalised/.test(f.statement)),
    'the document side is never normalised to match the corpus side');
});

test('a date that moved EARLIER is not DELAYED — the word would be false', async () => {
  const r = await runOn([FX.cases.brought_forward]);
  assert.equal(changeOf(r, 'DELAYED'), undefined);
  assert.ok(r.gaps.length >= 1, 'it is a change with no word among the fourteen, and it is reported as one');
  assert.ok(r.gaps.some((g) => /1 January 1999/.test(g.what_is_missing)));
});

test('dates are ordered only at day precision, and refuse otherwise', () => {
  assert.equal(compareDates('2018-05-25', '9 September 2099'), 'later');
  assert.equal(compareDates('9 September 2099', '2018-05-25'), 'earlier');
  assert.equal(compareDates('2018-05-25', '25 May 2018'), 'same');
  assert.equal(compareDates('2018-05-25', 'May 2018'), 'incomparable',
    'a month cannot be ordered against a day without widening one of them');
  assert.equal(dayOrdinal('May 2018'), null);
  assert.equal(dayOrdinal('2018-05-25'), 20180525);
});

/* ============================================================
   ▸ 4 · AMENDMENT   ▸ 5 · CORRECTION
   ============================================================ */

test('▸ an amending act reaching an act in the corpus is AMENDED', async () => {
  const r = await runOn([FX.cases.amendment]);
  const c = changeOf(r, 'AMENDED');

  assert.ok(c, 'the corpus records a status and the document states "amended"');
  assert.equal(c.attribute, 'legislative_status');
  assert.equal(c.old_value, FX.ids.dsaStatus, 'the corpus side is read from data/instruments.json');
  assert.equal(c.new_value, 'amended');
  assert.equal(c.materiality, 'reader_acts_on_it');
  assert.equal(c.autonomy_class, 'human_only');

  /* It came from the table, and the record says which transition. */
  const why = c.epistemic.inference.find((i) => i.field === 'change_kind');
  assert.ok(/transition table maps/.test(why.method));
  assert.ok(/applicable/.test(why.method) && /amended/.test(why.method));
});

test('▸ a corrigendum is CORRECTED, and never folded into AMENDED', async () => {
  const r = await runOn([FX.cases.correction]);
  const c = changeOf(r, 'CORRECTED');
  assert.ok(c);
  assert.equal(c.new_value, 'corrected');
  assert.equal(changeOf(r, 'AMENDED'), undefined,
    'a correction and an amendment are different acts and the table keeps them apart');
});

/* ============================================================
   ▸ 6 · CONTRADICTORY SOURCE
   ============================================================ */

test('▸ two authorities disagreeing is NOT a change', async () => {
  const r = await runOn([FX.cases.contradictory]);

  assert.equal(r.changes.length, 0,
    'reporting a disagreement as a change would silently pick a winner between two regulators');
  assert.equal(r.gaps.length, 0, 'and it is not an unclassified transition either — it is a conflict');
  assert.equal(r.conflicts.length, 1);
  assert.equal(r.conflicts[0].verification_id, 'ver-det-conflict');
  assert.equal(r.run_record.outputs.conflicts_set_aside, 1,
    'the run record counts what was set aside, so a conflict is not lost between two agents');
});

test('a verdict that settled nothing gives the corpus nothing to have diverged from', async () => {
  const r = await runOn([FX.cases.unreachable]);
  assert.equal(r.changes.length, 0);
  assert.equal(r.not_compared.length, 1);
  assert.match(r.not_compared[0].reason, /is not evidence that nothing changed/);
});

/* ============================================================
   ▸ 7 · COURT REVERSAL
   ============================================================ */

test('▸ an act under judicial review, annulled, is ANNULLED', async () => {
  const r = await runOn([FX.cases.courtBefore, FX.cases.courtAfter]);
  const c = changeOf(r, 'ANNULLED');

  assert.ok(c, 'the two readings of the same case record show the status moving');
  assert.equal(c.old_value, 'under_judicial_review');
  assert.equal(c.new_value, 'annulled');
  assert.equal(c.materiality, 'reader_acts_on_it',
    'an annulment does not move a value, it removes one — the top of the ladder whatever attribute carried it');
  assert.equal(c.autonomy_class, 'human_only');

  /* ANNULLED, not COURT_OUTCOME: the table takes the more specific
     and truer word where the court annulled. */
  assert.equal(changeOf(r, 'COURT_OUTCOME'), undefined);
  assert.equal(TRANSITIONS.under_judicial_review.annulled, 'ANNULLED');
  assert.equal(TRANSITIONS.under_judicial_review.applicable, 'COURT_OUTCOME',
    'where the act stands instead, the outcome is that the challenge failed');
});

test('a court being SEISED is not a court deciding', async () => {
  const r = await runOn([FX.cases.seised]);
  assert.equal(changeOf(r, 'COURT_OUTCOME'), undefined,
    'a reader told a court had ruled when it had only been asked would have been told something false');
  assert.ok(r.gaps.some((g) => /under_judicial_review/.test(g.what_is_missing)));
  assert.equal(TRANSITIONS.applicable.under_judicial_review, undefined,
    'the transition is deliberately absent from the table: there is no kind among the fourteen for "a challenge was lodged"');
});

/* ============================================================
   the classifier's own discipline
   ============================================================ */

test('the fourteen kinds are exactly the ones the session named', () => {
  assert.equal(REGULATORY_CHANGE_KINDS.length, 14);
  assert.equal(new Set(REGULATORY_CHANGE_KINDS).size, 14);
  /* Every kind the table or the rules can produce is one of them. */
  const produced = new Set(RULE_NAMES.map(() => null));
  produced.delete(null);
  for (const row of Object.values(TRANSITIONS)) {
    for (const kind of Object.values(row)) {
      if (kind === null) continue;
      assert.ok(REGULATORY_CHANGE_KINDS.includes(kind), `the table produces "${kind}", which is not one of the fourteen`);
    }
  }
});

test('a transition the table has no kind for is a gap, never a guess', () => {
  const c = classify({
    corpus_has_no_record: false, entity_kind: 'instrument', attribute: 'legislative_status',
    old_value: 'status:applicable', new_value: 'guidance',
    old_status: 'applicable', new_status: 'guidance',
    bytes_changed: null, values_equal: false,
  });
  assert.equal(c.kind, null);
  assert.equal(c.not_a_change, false, 'a hole is not a decision');
  assert.match(c.why, /not in the table/);
  assert.ok(c.considered.length > 0, 'and it names what was tested first');
});

test('a status this vocabulary cannot name is not "the corpus has no record"', () => {
  /* data/taxonomy.json carries status:partly-applicable and
     LEGAL_STATUS_TAXONOMY maps nothing to it. Several of this
     corpus's most-read acts are in that state. */
  assert.equal(STATUS_FROM_TAXONOMY['status:partly-applicable'], undefined);
  const live = CORPUS.instruments.filter((i) => i.legislative_status === 'status:partly-applicable');
  assert.ok(live.length > 0, 'this test assumes at least one instrument is still partly applicable');

  const s = corpusStatusOf(CORPUS, live[0].id);
  assert.equal(s.present, true);
  assert.equal(s.status, null);
  assert.notEqual(s.taxonomy, null);

  const c = classify({
    corpus_has_no_record: false, corpus_status_unmappable: true,
    entity_kind: 'instrument', attribute: 'legislative_status',
    old_value: s.taxonomy, new_value: 'applicable',
    old_status: null, new_status: 'applicable',
    bytes_changed: null, values_equal: false,
  });
  assert.equal(c.kind, null, 'NEW would assert the corpus had said nothing about an act it says a great deal about');
  assert.match(c.why, /reporting NEW would assert it had said nothing/);
});

test('a deliberate non-change is reported apart from a hole', async () => {
  const c = classify({
    corpus_has_no_record: false, entity_kind: 'instrument', attribute: 'legislative_status',
    old_value: 'status:applicable', new_value: 'entered_into_force',
    old_status: 'applicable', new_status: 'entered_into_force',
    bytes_changed: null, values_equal: false,
  });
  assert.equal(c.kind, null);
  assert.equal(c.not_a_change, true, 'somebody decided this; it is not something nobody has decided');
  assert.match(c.why, /deliberately not a change/);

  /* And the detector files it as "not compared", not as a gap. */
  const r = await runOn([FX.cases.unchangedAfter]);
  assert.ok(r.not_compared.some((n) => /deliberately not a change/.test(n.reason)));
  assert.ok(!r.gaps.some((g) => /entered_into_force/.test(g.what_is_missing)),
    'burying a settled case among the real holes is how the real holes stop being read');
});

test('a staged act is not compared against one of its stages', async () => {
  assert.ok(FX.ids.aiActApplicationCount > 1);
  const r = await runOn([FX.cases.staged]);
  assert.ok(r.not_compared.some((n) => /applies in stages/.test(n.reason)),
    'choosing which stage a document meant is a reading of the act, not a comparison');
  assert.equal(changeOf(r, 'DELAYED'), undefined);
});

test('every "from" and "to" in the table is a real legal status', () => {
  for (const [from, row] of Object.entries(TRANSITIONS)) {
    if (from !== 'null') assert.ok(LEGAL_STATUSES.includes(from), from);
    for (const to of Object.keys(row)) assert.ok(LEGAL_STATUSES.includes(to), to);
  }
  /* The inversion is built from the one mapping, not written twice. */
  for (const [status, id] of Object.entries(LEGAL_STATUS_TAXONOMY)) {
    if (!id) continue;
    assert.equal(STATUS_FROM_TAXONOMY[id], status);
  }
});

/* ============================================================
   materiality, confidence, autonomy
   ============================================================ */

test('materiality is decided by the attribute, not by the change kind', () => {
  /* The same kind, at two attributes, gets two answers. */
  const readerFacing = materialityOf({
    change_kind: 'AMENDED', attribute: 'applicability_date',
    old_value: 'a', new_value: 'b', values_equal: false, bytes_changed: true, entity_kind: 'instrument',
  });
  const not = materialityOf({
    change_kind: 'AMENDED', attribute: 'title',
    old_value: 'a', new_value: 'b', values_equal: false, bytes_changed: true, entity_kind: 'instrument',
  });
  assert.equal(readerFacing.level, 'reader_acts_on_it');
  assert.equal(not.level, 'substantive');
  assert.notEqual(readerFacing.why, not.why);
  assert.match(not.why, /not one of the few a reader schedules their own conduct around/);
});

test('materiality is never lowered by uncertainty — that is what confidence is for', () => {
  const m = materialityOf({
    change_kind: 'REPEALED', attribute: 'anything at all',
    old_value: 'a', new_value: 'b', values_equal: false, bytes_changed: null, entity_kind: 'instrument',
  });
  assert.equal(m.level, 'reader_acts_on_it', 'a repeal removes rather than moves, whatever attribute carried it');

  const unsure = confidenceOf({ via: null, hasDocument: false, hasSnapshot: false, bothValuesRead: false, datesComparable: false, statusFromDocument: false });
  const sure = confidenceOf({ via: 'table', hasDocument: true, hasSnapshot: true, bothValuesRead: true, datesComparable: true, statusFromDocument: true });
  assert.ok(unsure < sure);
  assert.ok(sure <= 0.85, 'the ceiling: this detector compares printed values, it has not read either document the way a lawyer would');
  assert.ok(unsure >= 0.05);
});

test('nothing lower than review_required comes out of this detector', () => {
  for (const level of MATERIALITY_LEVELS) {
    const a = autonomyFor(level);
    assert.notEqual(a, 'autonomous',
      `materiality "${level}" produced "autonomous": a detection is about the legal record, and validate.mjs refuses that class for any legal entity`);
  }
  assert.equal(autonomyFor('reader_acts_on_it'), 'human_only');
  assert.equal(autonomyFor('substantive'), 'review_required');
  for (const c of FULL.changes) {
    assert.notEqual(c.autonomy_class, 'autonomous');
  }
});

test('the attributes a reader acts on are a short, named list', () => {
  const keys = Object.keys(READER_ACTS_ON);
  assert.ok(keys.length <= 12, 'a list this long stops meaning "a reader acts on it"');
  for (const [k, why] of Object.entries(READER_ACTS_ON)) {
    assert.ok(typeof why === 'string' && why.length > 10, `${k} is on the list with no statement of what it answers`);
  }
  assert.ok(keys.includes('legislative_status') && keys.includes('date'));
});

/* ============================================================
   affected datasets and pages
   ============================================================ */

test('the page map is derived from the code, and agrees with CURRENT-ARCHITECTURE §5', () => {
  const { pageToDatasets, unresolved } = buildPageMap();
  assert.deepEqual(unresolved, [], 'every entry module a page loads was read');

  /* Parse §5's own table and compare. Neither is a second home for
     the other: the code is the truth, the document is checked
     against it, and a drift fails here rather than hiding. */
  const md = readFileSync(join(REPO, 'docs', 'CURRENT-ARCHITECTURE.md'), 'utf8');
  const section = md.slice(md.indexOf('## 5. Dataset dependency map'), md.indexOf('## 6.'));
  const documented = new Map();
  let current = null;
  for (const line of section.split('\n')) {
    const row = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/.exec(line);
    if (!row || /^Page →/.test(row[1]) || /^-+$/.test(row[1])) continue;
    const page = /([a-z-]+\.html)/.exec(row[1])?.[1] ?? null;
    if (page) current = page;
    if (!current) continue;
    /* The `↳ js/search.js (via palette)` row is the chrome, which
       the derived map counts apart — see surfaces.mjs. */
    if (/search\.js/.test(row[1])) continue;
    if (!documented.has(current)) documented.set(current, new Set());
    for (const d of row[2].split(',').map((x) => x.trim())) {
      if (/^[a-z]+$/.test(d)) documented.get(current).add(d);
    }
  }

  assert.ok(documented.size >= 7, 'the §5 table was parsed');
  for (const [page, expected] of documented) {
    const derived = pageToDatasets.get(page);
    assert.ok(derived, `§5 documents ${page} and the derived map has no entry for it`);
    assert.deepEqual([...derived].sort(), [...expected].sort(),
      `${page}: the code and docs/CURRENT-ARCHITECTURE.md §5 disagree about which datasets it loads`);
  }
});

test('the chrome is counted apart, or affected_pages would name every page every time', () => {
  const { chromeDatasets, datasetToPages } = buildPageMap();
  assert.ok(chromeDatasets.size >= 5, 'the command palette indexes several datasets on every page');
  assert.ok(CHROME_MODULES.includes('search.js') && CHROME_MODULES.includes('palette.js'));

  /* institutions.html loads four datasets of its own; without the
     split it would render every one of them. */
  assert.ok(!datasetToPages.get('glossary')?.includes('institutions.html'),
    'a page whose own views do not render a dataset must not be listed as rendering it');

  /* And the site-wide discoverability is stated rather than dropped. */
  const { caveats } = affectedPages(['data/glossary.json']);
  assert.ok(caveats.some((c) => /command palette/.test(c)));
});

test('data/brief.json is not claimed to reach a page', () => {
  const { pages, caveats } = affectedPages(['data/brief.json']);
  assert.deepEqual(pages, [], 'nothing fetches brief.json at runtime');
  assert.ok(caveats.some((c) => /__CONTENT__/.test(c)),
    'the reason is the known bypass, and saying index.html renders it would claim the bypass is resolved');
});

test('a dataset follows from the entity kind, not from the change kind', () => {
  assert.deepEqual(affectedDatasets([{ kind: 'timeline_event', id: 'x' }]), ['data/timeline.json']);
  assert.deepEqual(affectedDatasets([{ kind: 'instrument', id: 'x' }, { kind: 'provision', id: 'y' }]), ['data/instruments.json']);
  assert.deepEqual(affectedDatasets([]), []);
});

/* ============================================================
   the gate
   ============================================================ */

test('every record the run produced satisfies its contract', () => {
  for (const r of [...FULL.changes, ...FULL.gaps, FULL.run_record].filter(Boolean)) {
    assert.deepEqual(validate(r, { allowSimulated: true }), [],
      `${r.contract} ${r[getContract(r.contract).id_field]} does not satisfy its contract`);
  }
});

test('the store refuses an invalid record, and the detector has one path to it', () => {
  const { store } = detector();
  assert.throws(() => store.write({ contract: 'RegulatoryChange', change_id: 'x' }), /refusing to store an invalid/);

  const src = readFileSync(join(HERE, 'detector.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  assert.equal((src.match(/store\.write\(/g) ?? []).length, 1,
    'more than one path to the store, and only one of them is gated');
  for (const bypass of ['skipValidation', 'bypass', 'force: true', 'strict: false']) {
    assert.ok(!src.includes(bypass), `the detector contains "${bypass}"`);
  }
});

test('a record this agent produced itself is refused at intake', () => {
  const refused = FULL.refused.filter((x) => x.stage === 'intake');
  assert.equal(refused.length, 1);
  assert.equal(refused[0].what, 'ver-det-self');
  assert.match(refused[0].reason, /H3/);
});

test('the detector refuses to invent an as-of date', () => {
  assert.throws(() => detector({ asOf: undefined }), /explicit asOf/);
  assert.throws(() => detector({ asOf: 'recently' }), /explicit asOf/);
  for (const c of FULL.changes) assert.equal(c.as_of, FIXTURE_AS_OF);
});

test('nothing in the classifying path reads a clock', () => {
  for (const f of ['classify.mjs', 'materiality.mjs', 'snapshots.mjs', 'surfaces.mjs']) {
    const src = readFileSync(join(HERE, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');
    assert.ok(!/new Date\(\)/.test(src), `${f} reads the clock: a judgement that changes with when it was computed is not reproducible`);
    assert.ok(!/Date\.now\(\)/.test(src), `${f} reads the clock`);
  }
});

/* ============================================================
   the whole run
   ============================================================ */

test('the run record counts every outcome, including the ones that produced nothing', () => {
  const o = FULL.run_record.outputs;
  assert.equal(o.changes, FULL.changes.length);
  assert.equal(o.unclassified, FULL.gaps.length);
  assert.equal(o.unchanged, FULL.unchanged.length);
  assert.equal(o.not_compared, FULL.not_compared.length);
  assert.equal(o.conflicts_set_aside, FULL.conflicts.length);
  assert.equal(o.refused, FULL.refused.length);
  assert.equal(o.edits_made, 0);
  assert.deepEqual(FULL.run_record.affected_entities, [],
    'a read-only run touched nothing; what each detection is about lives on that detection');
  assert.ok(FULL.run_record.epistemic.unresolved.some((u) => /done about these changes/.test(u.question)));
});

test('the seven cases the session named all produce their outcome in one run', () => {
  /* Belt and braces over the per-case tests above: the seven must
     survive being run together, where one case's history could
     otherwise be picked up as another's snapshot. */
  assert.ok(changeOf(FULL, 'UPDATED'), 'metadata-only update');
  assert.ok(changeOf(FULL, 'DELAYED'), 'substantive date change');
  assert.ok(changeOf(FULL, 'AMENDED'), 'amendment');
  assert.ok(changeOf(FULL, 'CORRECTED'), 'correction');
  assert.ok(changeOf(FULL, 'ANNULLED'), 'court reversal');
  assert.equal(FULL.unchanged.length, 1, 'unchanged source');
  assert.equal(FULL.conflicts.length, 1, 'contradictory source');
});

/* ============================================================
   SESSION 10 — the impact map

   The brief: for every confirmed change identify the affected
   dataset, instrument, timeline, compliance calendar, comparison
   views, applicability logic, evidence displays, glossary
   relationships and potentially stale analytical pages; separate
   FACTUAL from EDITORIAL impact; a factual impact MAY become
   automatically actionable, an editorial impact MUST become a review
   proposal unless governance explicitly permits otherwise; expose
   the dependency graph through observability.

   The tests below hold that to the things it must not quietly do:
   declare an edge it did not derive, treat prose as a value, mark an
   editorial impact automatically actionable, assert staleness it
   cannot quote, or report a bounded preview as the whole graph.
   ============================================================ */

test('every reference field in the graph is derived, and a nested record is not walked twice', () => {
  const g = buildGraph({ corpus: CORPUS });
  assert.ok(g.counts.nodes > 500, `the corpus should hold hundreds of records; the graph found ${g.counts.nodes}`);
  assert.equal(g.collisions.length, 0, `two records claim one id: ${JSON.stringify(g.collisions)}`);

  /* provisions live inside their instrument and are nodes in their
     own right. If the instrument's walk descended into them, the
     instrument would carry its articles' source edges as well. */
  const gdprSources = g.edges.filter((e) => e.from === 'gdpr' && e.field === 'provisions.sources');
  assert.equal(gdprSources.length, 0, 'the instrument walk descended into its provisions: every provision edge would be counted twice');
  assert.ok(g.edges.some((e) => e.from === 'gdpr' && e.field === 'provisions.id'),
    'the containment edge instrument → provision is missing');
  assert.ok(g.edges.some((e) => e.from_kind === 'provision' && e.field === 'sources'),
    'a provision carries its own source edges');
});

test('a wildcard is expanded and said to be a wildcard, and "*" is never an edge to everything', () => {
  const g = buildGraph({ corpus: CORPUS });
  assert.ok(g.unresolvedWildcards.length > 0, 'data/institutions.json uses "*" for a general competence; it should be reported');
  for (const w of g.unresolvedWildcards) {
    assert.match(w.why, /F-12|wildcard/, 'a wildcard edge nobody has checked must say so');
  }
  assert.equal(g.edges.filter((e) => e.to === '*').length, 0, '"*" is not a record and must never be an edge target');
});

test('the field register classifies every field on every record in the live data', () => {
  const g = buildGraph({ corpus: CORPUS });
  const refs = referenceFieldsByKind(g);
  const unregistered = [];
  for (const node of g.nodes.values()) {
    for (const f of fieldsOf(node.record, {
      kind: node.kind, isNode: (x) => g.nodes.has(x),
      referenceFields: refs.get(node.kind) ?? new Set(), rootId: node.id,
    })) {
      if (!f.registered) unregistered.push(`${node.kind}.${f.field} (e.g. ${node.id})`);
    }
  }
  assert.deepEqual([...new Set(unregistered)], [],
    'a dataset grew a field nothing in agent/detector/fields.mjs classifies. It defaults to editorial, which is the safe half — but an unclassified field is a decision nobody made, and the decision is whether an agent may act on it unattended');
});

test('reference fields are derived per KIND, not per record', () => {
  /* instruments[].brief_part holds an id on most acts and null on at
     least one. Asking whether one RECORD produced an edge would make
     the same field a reference on one act and an unclassified value
     on the next. */
  const g = buildGraph({ corpus: CORPUS });
  const refs = referenceFieldsByKind(g);
  assert.ok(refs.get('instrument').has('brief_part'));
  const nullish = CORPUS.instruments.find((i) => i.brief_part === null || i.brief_part === undefined);
  if (nullish) {
    const f = fieldsOf(nullish, { kind: 'instrument', isNode: (x) => g.nodes.has(x), referenceFields: refs.get('instrument'), rootId: nullish.id })
      .find((x) => x.field === 'brief_part');
    assert.equal(f.class, 'reference', 'a field is a reference because of what the schema does with it, not because one row filled it in');
  }
});

test('an array of prose keeps every one of its sentences', () => {
  const g = buildGraph({ corpus: CORPUS });
  const rule = CORPUS.db.applicability.rules.find((r) => (r.exemptions ?? []).length > 1);
  assert.ok(rule, 'data/applicability.json should carry a rule with more than one exemption');
  const f = fieldsOf(rule, { kind: 'applicability_rule', isNode: (x) => g.nodes.has(x), referenceFields: new Set(), rootId: rule.id })
    .find((x) => x.field === 'exemptions');
  assert.equal(f.class, 'prose');
  assert.equal(f.values.length, rule.exemptions.length,
    'only the first exemption was kept: a stale carve-out in position two would be invisible');
});

test('the two fields whose NAME says reference and whose VALUE is prose are registered as prose', () => {
  /* Both are findings about this corpus rather than about the code.
     timeline.events[].supersedes holds "Originally 2 August 2027;
     deferred by the AI Omnibus." and applicability.rules[].depends_on
     holds a sentence. A register that assumed the name would have
     classified the one field recording that a date MOVED as a
     checkable reference. */
  assert.equal(PROSE_FIELDS.timeline_event.supersedes ? 'prose' : null, 'prose');
  assert.equal(PROSE_FIELDS.applicability_rule.depends_on ? 'prose' : null, 'prose');
  const supersedes = CORPUS.events.filter((e) => typeof e.supersedes === 'string');
  assert.ok(supersedes.length > 0, 'the corpus should still carry at least one superseded date as prose');
  for (const e of supersedes) {
    assert.ok(!CORPUS.eventById.has(e.supersedes), `${e.id}.supersedes now holds an id — reclassify it as a reference`);
  }
});

test('every module in js/ is classified exactly once, and the ones that render nothing are named', () => {
  const onDisk = readdirSync(join(HERE, '..', '..', 'js')).filter((f) => f.endsWith('.js')).sort();
  const registered = Object.keys(MODULE_SURFACE).sort();
  assert.deepEqual(registered, onDisk,
    'a module in js/ is not in MODULE_SURFACE, or MODULE_SURFACE names one that does not exist. A new view must not be able to appear without somebody deciding what surface it is');
  for (const [name, spec] of Object.entries(MODULE_SURFACE)) {
    assert.ok(spec.why && spec.why.length > 20, `${name} is assigned a surface with no reason`);
    if (spec.surface !== null) {
      assert.ok(SURFACE_KINDS.includes(spec.surface), `${name} names surface "${spec.surface}", which is not one of the nine plus other`);
    }
  }
});

test('the index-key register covers exactly the keys js/data.js builds', () => {
  const keys = indexKeys().sort();
  assert.ok(keys.length > 5, `index() should build several maps; found ${keys.length}`);
  const unmapped = keys.filter((k) => !(k in INDEX_KEY_KIND));
  assert.deepEqual(unmapped, [],
    'js/data.js builds an index nothing in INDEX_KEY_KIND maps onto an entity kind, so a view reading it would render records this map cannot see');
  const phantom = Object.keys(INDEX_KEY_KIND).filter((k) => !keys.includes(k));
  assert.deepEqual(phantom, [], 'INDEX_KEY_KIND names an index the gateway does not build');
});

test('the month names come from js/format.js rather than from a second list', () => {
  const months = monthNames();
  assert.equal(months.length, 12);
  const src = readFileSync(join(HERE, '..', '..', 'js', 'format.js'), 'utf8');
  for (const m of months) assert.ok(src.includes(`'${m}'`), `${m} was not read from js/format.js`);
});

test('a date is read out of prose at every ordering a person might have typed', () => {
  const months = monthNames();
  const iso = (t) => datesIn(t, months).map((d) => d.iso);
  assert.ok(iso('applies from 25 May 2018').includes('2018-05-25'));
  assert.ok(iso('applies from May 25, 2018').includes('2018-05-25'));
  assert.ok(iso('applies from 2018-05-25').includes('2018-05-25'));
  assert.ok(iso('applies from May 2018').includes('2018-05'));
  assert.deepEqual(iso('applies from the twenty-fifth'), [],
    'a date nobody wrote as a date is not read as one');
});

test('prose at a coarser precision than the value still refers to it, and the reverse is not assumed', () => {
  const months = monthNames();
  assert.equal(proseMentions('the act applied from May 2018', '2018-05-25', { months }).length, 1,
    '"May 2018" is a sentence about 2018-05-25');
  assert.equal(proseMentions('the act applied from 25 May 2018', '2019-05-25', { months }).length, 0,
    'a different year is not a match');
});

test('a taxonomy label that is also ordinary English cannot establish an editorial finding', () => {
  const g = buildGraph({ corpus: CORPUS });
  const applicable = g.nodes.get('status:applicable');
  assert.ok(applicable, 'data/taxonomy.json should still carry status:applicable');
  const amb = labelAmbiguity(g, applicable.id, applicable.record.label);
  assert.equal(amb.ambiguous, true,
    '"Applicable" occurs in prose on records that do not carry status:applicable — "The DMA becomes applicable." A match for it cannot tell the term from the word');
  assert.match(amb.why, /ordinary English/);

  const map = mapImpact({
    change: {
      change_id: 'test-label', as_of: FIXTURE_AS_OF,
      attribute: 'legislative_status', old_value: 'status:applicable',
      affected_entities: [{ kind: 'instrument', id: 'dsa' }],
    },
    g,
  });
  for (const e of map.editorial) {
    assert.notEqual(String(e.matched).toLowerCase(), 'applicable',
      'an ambiguous label produced an editorial finding: a review list with false entries in it is a review list nobody finishes');
  }
  assert.ok(map.open_questions.some((q) => q.quote), 'the ambiguous matches must survive as open questions carrying their sentence, not be dropped');
});

test('an editorial finding is quotable, and the quote contains the value that moved', () => {
  const deferred = CORPUS.events.find((e) => typeof e.supersedes === 'string' && datesIn(e.supersedes, monthNames()).length);
  assert.ok(deferred, 'the corpus should still record a deferred date in prose');
  const was = datesIn(deferred.supersedes, monthNames())[0].iso;
  const map = mapImpact({
    change: {
      change_id: 'test-editorial', as_of: FIXTURE_AS_OF,
      attribute: 'date', old_value: was, new_value: deferred.date,
      affected_entities: [{ kind: 'timeline_event', id: deferred.id }],
    },
  });
  const hit = map.editorial.find((e) => e.node_id === deferred.id && e.field === 'supersedes');
  assert.ok(hit, 'the sentence on the changed record itself states the date that moved and was not found');
  assert.equal(hit.depth, 0, 'the changed record is depth 0 — its own prose is the likeliest place a stale sentence is');
  assert.ok(hit.quote.includes(hit.matched));
  assert.equal(hit.route, 'review_proposal');
  assert.equal(hit.automatically_actionable, false);
});

test('the nine surfaces the brief names are all reachable, and the site\'s others are not folded into them', () => {
  const map = mapImpact({
    change: {
      change_id: 'test-surfaces', as_of: FIXTURE_AS_OF,
      attribute: 'date', old_value: '2018-05-25',
      affected_entities: [{ kind: 'timeline_event', id: 'tl-gdpr-2018-05-25-application' }],
    },
  });
  for (const k of ['dataset', 'instrument', 'timeline', 'compliance_calendar', 'applicability', 'evidence', 'glossary', 'analytical_page']) {
    assert.ok(map.surfaces[k].entries.length || map.surfaces[k].modules.length, `surface "${k}" was not reached by a GDPR application-date change, which reaches nearly everything`);
  }
  assert.ok(map.surfaces.comparison.modules.some((m) => m.module === 'js/dna.js'));
  assert.ok(map.surfaces.other.modules.some((m) => m.module === 'js/enforcement-page.js'),
    'the enforcement page is not one of the brief\'s nine and must be reported under its own name, not folded into the nearest');
  assert.equal(map.surfaces.compliance_calendar.modules[0].module, 'js/calendar.js');
  assert.ok(/clock/.test(map.surfaces.compliance_calendar.entries[0].why),
    'the calendar filters against the reader\'s own clock and the map must say so rather than assert what a reader is shown');
});

test('a factual impact on a reference needs no edit; a stored copy of the value does', () => {
  const free = routeOf({ field_class: 'reference', dataset: 'data/claims.json', field: 'instruments', restates_old_value: false });
  assert.equal(free.route, 'propagates_by_derivation');
  assert.equal(free.automatically_actionable, true);

  const copy = routeOf({ field_class: 'value', dataset: 'data/instruments.json', field: 'status_as_of', restates_old_value: true });
  assert.equal(copy.route, 'review_proposal');
  assert.equal(copy.automatically_actionable, false);
  assert.match(copy.why, /One home per fact/);
});

test('an editorial impact is a review proposal, and only a named governance permit changes that', () => {
  const e = routeOf({ field_class: 'prose', dataset: 'data/claims.json', field: 'statement', restates_old_value: false });
  assert.equal(e.route, 'review_proposal');
  assert.equal(e.automatically_actionable, false);

  assert.deepEqual(GOVERNANCE_PERMITS, [],
    'nothing in docs/ permits an agent to act on prose unattended: AUTONOMY-POLICY puts it at Class C, and Class B\'s own test is that a change a human would have to check a source to validate is not Class B');

  /* The mechanism has to work if a permit is ever granted, or
     "unless governance explicitly permits otherwise" is not
     implemented, it is just refused. */
  const permitted = routeOf({
    field_class: 'prose', dataset: 'data/claims.json', field: 'statement', restates_old_value: false,
    permits: [{ dataset: 'data/claims.json', field: 'statement', granted_by: 'a hypothetical policy', scope: 'a hypothetical scope' }],
  });
  assert.equal(permitted.automatically_actionable, true);
  assert.equal(permitted.route, 'review_proposal', 'the proposal is still written; the permit is what lets it be applied');
});

test('a provenance field is human_only whatever else is true', () => {
  const r = routeOf({ field_class: 'reference', dataset: 'data/claims.json', field: 'requires_verification', restates_old_value: false });
  assert.equal(r.route, 'human_only');
  assert.equal(r.automatically_actionable, false);
  assert.match(r.why, /AI-SAFE-BOUNDARIES/);
});

test('the graph preview fits the trace store\'s string cap and says what it dropped', () => {
  const map = mapImpact({
    change: {
      change_id: 'test-preview', as_of: FIXTURE_AS_OF,
      attribute: 'legislative_status', old_value: 'status:applicable',
      affected_entities: [{ kind: 'instrument', id: 'gdpr' }],
    },
  });
  const preview = graphPreview(map.graph);
  assert.ok(JSON.stringify(preview).length <= 7000,
    'the preview exceeds the cap agent/observability/redact.mjs applies, and a truncated JSON string parses as nothing at all');
  assert.equal(preview.counts.nodes, map.graph.nodes.length,
    'the counts must describe the WHOLE graph; counting the preview reports a change reaching twenty-nine records when it reached a hundred and seventy-five');
  assert.ok(preview.dropped_nodes + preview.dropped_edges > 0, 'a two-hop walk from the GDPR does not fit in 7000 characters');
  assert.match(preview.note, /ImpactAssessment record/);
  assert.match(preview.sha256, /^[0-9a-f]{64}$/);
  assert.equal(preview.nodes[0].depth, 0, 'nearest first: a cap must never eat the direct dependencies');
});

test('an entity the corpus does not hold is a silence in the map, not an absence of impact', () => {
  const map = mapImpact({
    change: {
      change_id: 'test-new', as_of: FIXTURE_AS_OF,
      attribute: null, old_value: null,
      affected_entities: [{ kind: 'instrument', id: 'not-a-record-in-this-corpus' }],
    },
  });
  assert.deepEqual(map.unresolved_roots, ['not-a-record-in-this-corpus']);
  assert.ok(map.caveats.some((c) => c.includes('not-a-record-in-this-corpus')),
    'an entity that could not be walked must be named in the caveats, or the empty map reads as a clearance');
});

/* ---------- the assessments the full run produced ---------- */

test('every confirmed change carries an ImpactAssessment that satisfies its contract', () => {
  assert.equal(FULL.assessments.length, FULL.changes.length,
    'a confirmed change with no impact assessment is a change nobody mapped onto the site');
  for (const a of FULL.assessments) {
    const errs = validate(a, { allowSimulated: true });
    assert.deepEqual(errs, [], `${a.assessment_id}: ${errs.join('; ')}`);
    assert.equal(a.contract, 'ImpactAssessment');
    assert.ok(FULL.changes.some((c) => c.change_id === a.change_id));
  }
});

test('an assessment never lets a change be handled more freely than the detection', () => {
  for (const a of FULL.assessments) {
    const change = FULL.changes.find((c) => c.change_id === a.change_id);
    assert.ok(AUTONOMY_RANK[a.autonomy_class] >= AUTONOMY_RANK[change.autonomy_class],
      `${a.assessment_id} sits at ${a.autonomy_class} for a change at ${change.autonomy_class}: an assessment that relaxed the class would be a way round the gate`);
    assert.notEqual(a.autonomy_class, 'autonomous',
      'an impact map is about what a production site tells a reader about EU law; it is never green tier');
  }
});

test('the assessment restates none of the detection\'s own fields', () => {
  const contract = getContract('ImpactAssessment');
  for (const f of ['change_kind', 'old_value', 'new_value', 'materiality', 'affected_pages']) {
    assert.ok(f in contract.forbidden, `${f} must be forbidden by name, with the reason, so an agent reaching for it is told which contract it wanted`);
    assert.equal(f in contract.fields, false);
  }
  const change = getContract('RegulatoryChange');
  const shared = Object.keys(contract.fields).filter((k) => k in change.fields && !ENVELOPE_KEYS.has(k));
  assert.deepEqual(shared.sort(), ['autonomy_class', 'change_id'],
    'the two contracts share a field outside the envelope other than change_id — which is the reference, and the whole point — and autonomy_class, which each computes about a different question');
});

test('the run record counts the impact, and an editorial finding anywhere stops the run being autonomous', () => {
  const o = FULL.run_record.outputs;
  assert.equal(o.impact_assessments, FULL.assessments.length);
  assert.equal(o.editorial_impacts, FULL.assessments.reduce((n, a) => n + a.counts.editorial_impacts, 0));
  assert.ok(o.editorial_impacts > 0,
    'the fixture corpus includes a change whose old value is restated in the corpus\'s own prose; if this is zero the editorial half is not being exercised at all');
  assert.equal(FULL.run_record.autonomy_class, 'review_required');
});

test('the impact graph, the routing and the editorial findings are all on the trace', () => {
  /* Read off the trace the full run ACTUALLY emitted. A test that
     built a second trace for itself would prove that impactState can
     read a trace, never that the detector writes one. */
  const root = buildTree(FULL_SINK.records).roots[0];
  assert.ok(root, 'the full run emitted no span tree');
  const impact = impactState(root);
  assert.equal(impact.length, FULL.changes.length, 'a confirmed change with no impact graph on the trace is not exposed through observability at all');
  for (const i of impact) {
    assert.ok(i.graph, `${i.change_id}: the impact graph did not parse off the trace`);
    assert.ok(i.decision.length, `${i.change_id}: no routing decision on the trace`);
    assert.ok(i.routing, `${i.change_id}: no routing summary on the trace`);
    assert.ok(i.decision[0].alternatives.length >= 3,
      'a decision without the alternatives it did not take is a conclusion, not a decision');
  }
  assert.ok(impact.some((i) => i.editorial.length), 'no editorial finding reached the trace');
});

test('nothing in the impact modules writes anything', () => {
  const forbidden = ['writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync', 'mkdirSync'];
  for (const f of ['graph.mjs', 'fields.mjs', 'impact.mjs']) {
    const src = readFileSync(join(HERE, f), 'utf8');
    for (const bad of forbidden) {
      assert.equal(src.includes(bad), false, `agent/detector/${f} contains ${bad}: this directory reads and never writes`);
    }
  }
});

/* --------------------------------- node identity (SESSION 13) */

test('a change id is the transition itself, not the sighting of it', async () => {
  /* The id is derived from the kind, the records, the attribute and
     the two values — deliberately NOT from the verification that
     surfaced it. Two documents reporting the same move are one
     change, which is what makes `supersedes` and a change history
     mean anything rather than being a list of sightings. */
  const a = await runOn(FX.all);
  const b = await runOn(FX.all);
  assert.deepEqual(a.changes.map((c) => c.change_id).sort(), b.changes.map((c) => c.change_id).sort());
  assert.deepEqual(a.assessments.map((x) => x.assessment_id).sort(), b.assessments.map((x) => x.assessment_id).sort());
});

test('detecting over a subset does not renumber the changes it shares with the whole', async () => {
  const some = FX.all.slice(3);
  const part = await runOn(some);
  const key = (c) => `${c.change_kind}|${c.affected_entities.map((e) => e.id ?? '').sort().join(',')}|${c.attribute}|${c.old_value}|${c.new_value}`;
  const whole = new Map(FULL.changes.map((c) => [key(c), c.change_id]));
  let compared = 0;
  for (const c of part.changes) {
    if (!whole.has(key(c))) continue;
    compared++;
    assert.equal(c.change_id, whole.get(key(c)), `${c.change_kind} was renumbered by looking at fewer verifications`);
  }
  assert.ok(compared > 0, 'the subset shared no change with the whole, so this proved nothing');
});

test('every change and assessment id in a run is distinct', () => {
  const ids = FULL.changes.map((c) => c.change_id);
  assert.equal(new Set(ids).size, ids.length, 'two changes share an id');
  const aids = FULL.assessments.map((a) => a.assessment_id);
  assert.equal(new Set(aids).size, aids.length, 'two impact assessments share an id');
});
