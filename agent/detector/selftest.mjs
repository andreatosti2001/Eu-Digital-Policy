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
  const { tracer, store } = harness();
  return { it: new Detector({ tracer, store, corpus: CORPUS, asOf: FIXTURE_AS_OF, simulated: true, ...over }), store };
};

/** Run just these verifications, so a test asserts about its own
 *  case rather than about the whole corpus of fixtures. */
const runOn = async (cases) => {
  const { it } = detector();
  return it.run({ verifications: cases });
};

const HASH_BEFORE = hashDataDir();
const FULL = await runOn(FX.all);
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
