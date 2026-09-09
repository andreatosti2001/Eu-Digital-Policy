/* ============================================================
   agent/improve/selftest.mjs — the suite for the continuous
   improvement loop

     node --test agent/improve/selftest.mjs

   THE ONE PROPERTY THIS SUITE EXISTS FOR. A loop that reports
   progress is a loop somebody will believe, and the cheapest way for
   it to be wrong is for an observer to stop running: every finding
   that observer owns then disappears from the current list and reads
   as fixed. Tests 5 to 8 are that case, from four directions. It is
   the same defect docs/HANDOVER.md records twice already under a
   different name — a check that passed for the wrong reason — and it
   is the one this module could most plausibly ship with.

   TWO SHAPES THIS SUITE IS ARRANGED TO AVOID.

   A TEST THAT PASSES BECAUSE NOTHING HAPPENED. The loop currently
   refers nothing to the autonomy runner, so a suite written from the
   real corpus alone would be a wall of refusals that could not tell
   "correctly refused" from "broken". Every refusal here is therefore
   paired with a positive: a FIXTURE PROPOSAL under a FIXTURE POLICY
   that does reach `autonomy_runner`, proving the referring path
   works before the refusals are asserted against it.

   A TEST THAT WRITES TO THE REPOSITORY. Every ledger in this file is
   a mkdtemp. Nothing writes `agent/improve/cycles/cycles.jsonl`,
   nothing writes the record store, and test 20 checks `git status`
   from outside to prove the two real cycles the suite runs left the
   tree alone.

   NOTHING HERE ASSERTS ANYTHING ABOUT EU LAW. Every fixture is about
   `data/sources.json`'s bookkeeping or a file under `docs/` that the
   fixture invents; no fixture carries a citation, an article number,
   a date or a CELEX id.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { DEFAULT_POLICY, ACTION_CATEGORIES, categoriseProposal } from '../policy/categories.mjs';
import { policyInForce, GRANTABLE_FIELDS, NEVER_AUTOMATIC_FIELD_NAMES } from '../policy/governance.mjs';
import { privateMetrics } from '../health/metrics.mjs';
import { FIXTURES } from '../schemas/fixtures.mjs';
import { MEASURED_CONDITIONS } from '../autonomy/cycle.mjs';

import { OBSERVERS, OBSERVER_IDS, normalise, pathsOf, findingIdOf, coverageOf, observe } from './observe.mjs';
import { reach, fieldReach, fieldsPresent, pathReach, CATEGORY_SURFACE } from './reach.mjs';
import { movement, signalMovement, ranIn, SIGNAL_DIRECTION, SIGNAL_INTERPRETATION, FINDING_STATES } from './movement.mjs';
import {
  entryFor, writeCycle, readCycles, previousCycle, publicationRefusals, cycleId,
  CycleRefused, CYCLE_LEDGER_VERSION, CYCLE_DIR, cycleLedgerPath, FORBIDDEN_IN_ENTRY,
} from './ledger.mjs';
import { triage, runImprovementCycle, PROPOSAL_CONTRACTS, DESTINATIONS, IMPROVE_AGENT, PRE_RUN_UNSATISFIABLE } from './cycle.mjs';

const REPO = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const tracer = () => new Tracer({ sink: new MemorySink(), attributes: { agent: IMPROVE_AGENT } });
const tmp = () => mkdtempSync(join(tmpdir(), 'improve-suite-'));

/* ---------------------------------------------------------------
   FIXTURES. A cycle entry is a plain object, so a fixture cycle is
   built rather than run wherever the test is about movement — a
   test about the comparison should not depend on eight agents.
   --------------------------------------------------------------- */

const finding = (id, observer, extra = {}) => ({
  finding_id: id, observer, contract: 'KnowledgeGap', severity: null, autonomy_class: 'human_only', ...extra,
});

const cycle = ({ id = 'cycle-aaaaaaaaaaaa', asOf = '2026-09-01', recordedAt = '2026-09-01T00:00:00.000Z', ran = [], findings = [], signals = [] }) => ({
  ledger_version: CYCLE_LEDGER_VERSION,
  cycle_id: id,
  as_of: asOf,
  recorded_at: recordedAt,
  session: null, trace_id: null, commit: null, branch: null,
  coverage: OBSERVERS.map((o) => ({
    observer: o.id, agent: o.agent, kind: o.kind,
    state: ran.includes(o.id) ? 'ran' : 'not_run',
    why: ran.includes(o.id) ? null : 'the fixture says this observer did not run.',
    findings: o.kind === 'signals' ? null : findings.filter((f) => f.observer === o.id).length,
  })),
  findings,
  signals,
  signals_withheld: [],
  routing: null,
});

const deSim = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === 'simulated' ? false : v));

/**
 * A proposal that clears everything this triage can check.
 *
 * It is built from `agent/schemas/fixtures.mjs` rather than by hand,
 * which is SESSION 22's lesson: three hand-built fixtures there did
 * not satisfy their own contracts, so the gate refused them as
 * INVALID and every test using them read that as the refusal it was
 * looking for.
 *
 * Its evidence is a file in this repository, cited as a primary
 * source for the only thing it is offered as evidence of — that the
 * file exists. Nothing in it is a citation, a date, an article
 * number or a claim about EU law. The same shape
 * `agent/policy/selftest.mjs` uses, and for the same reason: a
 * proposal that stands on an admitted absence of evidence can never
 * reach the automatic route, so a positive test needs evidence that
 * is real and about nothing.
 */
const cleanDocsProposal = (over = {}) => {
  const p = deSim(FIXTURES.ImplementationProposal());
  p.proposal_id = 'prop-improve-selftest-note';
  p.agent = 'improvement-loop';
  p.risk = 'low';
  p.autonomy_class = 'autonomous';
  p.reason = 'A suite fixture. It proposes writing one note under docs/ and asserts nothing about EU law.';
  p.files = ['docs/IMPROVE-SELFTEST-NOTE.md'];
  p.modules = [];
  p.affected_entities = [{ kind: 'tool', id: null, path: 'docs/IMPROVE-SELFTEST-NOTE.md', field: null, note: null }];
  p.proposed_change = {
    summary: 'Write one note under docs/.',
    operations: [{ op: 'add', target: 'docs/IMPROVE-SELFTEST-NOTE.md', current: null, proposed: 'a note', rationale: 'A fixture for the improvement-loop suite.' }],
    scope_note: 'docs/ only. No dataset, no page, no stylesheet, no locale.',
  };
  p.evidence = [{
    evidence_id: 'ev-1', kind: 'repository_file', source_id: null, url: null,
    locator: 'agent/improve/selftest.mjs', title: null, publisher: null,
    quote: 'This file exists in this repository.', retrieved_at: null, checksum: null,
    supports: 'supports:direct', role: 'primary', simulated: false,
  }];
  p.epistemic = {
    fact: [{ field: null, statement: 'agent/improve/selftest.mjs is a file in this repository.', evidence_refs: ['ev-1'] }],
    inference: [], interpretation: [], unresolved: [],
  };
  Object.assign(p, over);
  return p;
};

/** The same proposal, re-aimed at the source register's bookkeeping
 *  so the field gate has something to read. */
const sourcesProposal = (field, over = {}) => cleanDocsProposal({
  contract: 'DataProposal',
  proposal_id: `prop-improve-selftest-${field.replace(/_/g, '-')}`,
  dataset: 'data/sources.json',
  operation_kind: 'annotate',
  substantive: false,
  retrieved_and_read: false,
  files: ['data/sources.json'],
  affected_entities: [{ kind: 'source', id: 'src-example', path: 'data/sources.json', field, note: null }],
  proposed_change: {
    summary: 'Record one bookkeeping field on one source record.',
    operations: [{ op: 'modify', target: `data/sources.json#src-example.${field}`, current: 'a', proposed: 'b', rationale: 'A fixture for the improvement-loop suite.' }],
    scope_note: 'data/sources.json only.',
  },
  ...over,
});

/** A policy object that enables the fixture's category, built from
 *  the real base rather than invented, and marked simulated so it
 *  can never be mistaken for the policy in force. */
const fixturePolicy = () => ({
  ...DEFAULT_POLICY,
  simulated: true,
  policy_id: 'fixture/improve-selftest',
  enabled_categories: ['source_metadata_maintenance'],
  automatic_path_allowlist: ['data/sources.json'],
  automatic_field_allowlist: { 'data/sources.json': ['url_status', 'url'] },
});

/* ===============================================================
   1–4 · THE REGISTER AND THE REACH REPORT
   =============================================================== */

test('1 · every observer declares what it cannot see, and no two share an id', () => {
  assert.ok(OBSERVERS.length >= 5, 'a loop with fewer than five observers is not a loop over this system');
  const ids = OBSERVERS.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length, 'two observers share an id, so their findings would merge');
  for (const o of OBSERVERS) {
    assert.ok(o.what_it_cannot_see && o.what_it_cannot_see.length > 20,
      `${o.id} does not say what it cannot see. A count read without that is a count read wrong.`);
    assert.ok(['findings', 'signals'].includes(o.kind), `${o.id} has an unknown kind`);
    assert.ok(o.doc && o.doc.startsWith('docs/'), `${o.id} names no reference document`);
  }
  assert.deepEqual([...OBSERVER_IDS].sort(), [...ids].sort());
});

test('2 · a finding id is the record\'s own, never minted here', () => {
  /* If this module ever minted an id, the same finding would have
     two identities and movement would be noise. The check is that
     an unidentifiable record is DROPPED rather than given one. */
  assert.equal(findingIdOf({ contract: 'KnowledgeGap', gap_id: 'kg-x-000000000000' }), 'kg-x-000000000000');
  assert.equal(findingIdOf({ contract: 'KnowledgeGap' }), null, 'a record with no id must not be given one');
  assert.equal(findingIdOf({ contract: 'NotAContract', id: 'x' }), null, 'an unknown contract has no id field to read');

  const src = readFileSync(new URL('./observe.mjs', import.meta.url), 'utf8');
  assert.ok(!/contentId\(|new IdMinter\(/.test(src),
    'observe.mjs mints an id. Every finding id must be the one the specialist agent derived from the finding\'s own content.');
});

test('3 · normalise reads severity off the record and never defaults one', () => {
  const bare = normalise({ contract: 'KnowledgeGap', gap_id: 'kg-a-000000000000' }, 'depth');
  assert.equal(bare.severity, null, 'a record carrying no severity must normalise to null, not to a level this module chose');
  assert.equal(bare.autonomy_class, null);
  assert.equal(bare.substantive, null, 'substantive is a tri-state here: true, false, or not stated');
  const graded = normalise({ contract: 'KnowledgeGap', gap_id: 'kg-b-000000000000', impact: 'reader_finds_nothing', substantive: false }, 'depth');
  assert.equal(graded.severity, 'reader_finds_nothing');
  assert.equal(graded.substantive, false);
  assert.deepEqual(pathsOf({ affected_paths: ['b.json', 'a.json'] }), ['a.json', 'b.json'], 'paths are sorted so two runs compare');
  assert.deepEqual(pathsOf({}), [], 'a record naming no path yields none rather than a guess');
});

test('4 · CATEGORY_SURFACE still agrees with the real categoriser', () => {
  /* The surface table names which fields reach which category. The
     categoriser is the authority; this asserts the table has not
     drifted from it, by running the real function over a probe for
     each field-based entry. A drift here would make the reach report
     confidently wrong. */
  for (const s of CATEGORY_SURFACE) {
    if (!s.dataset || !s.fields) continue;
    for (const field of s.fields) {
      const probe = {
        contract: 'DataProposal',
        dataset: s.dataset,
        operation_kind: 'annotate',
        substantive: false,
        retrieved_and_read: s.category === 'source_url_correction' ? true : undefined,
        proposed_change: { operations: [{ op: 'replace', target: `sources[id=x].${field}`, path: s.dataset }] },
        epistemic: { interpretation: [], unresolved: [] },
      };
      const got = categoriseProposal(probe).category;
      assert.equal(got, s.category,
        `CATEGORY_SURFACE says "${field}" on ${s.dataset} reaches ${s.category}; agent/policy/categories.mjs routes it to ${got}. One of the two has moved.`);
    }
  }
});

test('4b · the reach report measures the real tree, and six granted fields are not in it', () => {
  const r = reach({});
  const ds = r.datasets.find((d) => d.dataset === 'data/sources.json');
  assert.ok(ds && ds.exists, 'data/sources.json is in the grant\'s path allowlist and must be readable');

  /* This asserts the world as it is on the day it was written, and
     it is meant to fail when the world changes: adding one of these
     fields to data/sources.json is a schema decision about the legal
     record, and it should not pass silently. The names are asserted
     rather than the count, so a swap of one for another is caught. */
  const absent = ds.rows.filter((x) => x.state === 'absent').map((x) => x.field).sort();
  assert.deepEqual(absent, ['checksum', 'content_hash', 'freshness_window', 'last_retrieved', 'recheck_interval', 'retrieved_at'],
    'the set of granted-but-absent fields in data/sources.json has changed. If a field was added, that was a schema decision about the legal record and docs/CONTINUOUS-IMPROVEMENT.md §3 needs updating with it.');

  const present = ds.rows.filter((x) => x.state === 'present').map((x) => x.field).sort();
  assert.deepEqual(present, ['url', 'url_status']);

  const noSurface = r.categories_without_surface.map((c) => c.category);
  assert.ok(noSurface.includes('retrieval_metadata'),
    'retrieval_metadata is reached only through last_retrieved and checksum, and neither is in data/sources.json');
});

test('4c · reach reports absence and never repairs it', () => {
  const src = readFileSync(new URL('./reach.mjs', import.meta.url), 'utf8');
  assert.ok(!/writeFileSync|appendFileSync|rmSync|renameSync/.test(src),
    'reach.mjs writes. Adding a missing field to data/sources.json would be a schema decision about the legal record taken to make an autonomy demonstration possible.');
  /* And the same for the loop's own observation pass. */
  const obs = readFileSync(new URL('./observe.mjs', import.meta.url), 'utf8');
  assert.ok(!/writeFileSync|appendFileSync|rmSync|renameSync/.test(obs), 'observe.mjs writes to the filesystem');
});

/* ===============================================================
   5–8 · THE ONE PROPERTY THIS SUITE EXISTS FOR
   =============================================================== */

test('5 · an observer that did not run this cycle resolves nothing', () => {
  const before = cycle({
    id: 'cycle-000000000001', recordedAt: '2026-09-01T00:00:00.000Z',
    ran: ['depth', 'ux'],
    findings: [finding('kg-a-000000000001', 'depth'), finding('kg-b-000000000002', 'depth'), finding('ux-c-000000000003', 'ux')],
  });
  /* depth does not run. Its two findings vanish from the list — and
     that must NOT read as two fixed. */
  const after = cycle({
    id: 'cycle-000000000002', recordedAt: '2026-09-02T00:00:00.000Z',
    ran: ['ux'],
    findings: [finding('ux-c-000000000003', 'ux')],
  });

  const m = movement(after, before);
  assert.equal(m.summary.resolved, 0, 'two depth findings disappeared because depth did not run, and the loop called them resolved');
  const depthRows = m.findings.filter((f) => f.observer === 'depth');
  assert.equal(depthRows.length, 2);
  for (const row of depthRows) {
    assert.equal(row.state, 'undetermined');
    assert.match(row.why, /did not run/);
  }
  const depth = m.by_observer.find((o) => o.observer === 'depth');
  assert.equal(depth.comparable, false);
  assert.ok(m.summary.incomparable_observers.some((i) => i.observer === 'depth'));

  /* And the observer that DID run in both is still compared, so this
     is not a test that passes by refusing everything. */
  const ux = m.by_observer.find((o) => o.observer === 'ux');
  assert.equal(ux.comparable, true);
  assert.equal(ux.persisting, 1);
});

test('6 · an observer that did not run LAST cycle makes nothing new', () => {
  const before = cycle({ id: 'cycle-000000000003', recordedAt: '2026-09-01T00:00:00.000Z', ran: ['ux'], findings: [finding('ux-c-000000000003', 'ux')] });
  const after = cycle({
    id: 'cycle-000000000004', recordedAt: '2026-09-02T00:00:00.000Z', ran: ['depth', 'ux'],
    findings: [finding('kg-a-000000000001', 'depth'), finding('ux-c-000000000003', 'ux')],
  });
  const m = movement(after, before);
  assert.equal(m.summary.new, 0, 'a depth finding was called new when depth simply had not run before');
  assert.equal(m.findings.find((f) => f.finding_id === 'kg-a-000000000001').state, 'undetermined');
});

test('7 · when the observer ran in both cycles, movement is a plain set difference', () => {
  const before = cycle({
    id: 'cycle-000000000005', recordedAt: '2026-09-01T00:00:00.000Z', ran: ['depth'],
    findings: [finding('kg-a-000000000001', 'depth'), finding('kg-b-000000000002', 'depth')],
  });
  const after = cycle({
    id: 'cycle-000000000006', recordedAt: '2026-09-02T00:00:00.000Z', ran: ['depth'],
    findings: [finding('kg-b-000000000002', 'depth'), finding('kg-c-000000000003', 'depth')],
  });
  const m = movement(after, before);
  assert.equal(m.summary.new, 1);
  assert.equal(m.summary.persisting, 1);
  assert.equal(m.summary.resolved, 1);
  assert.equal(m.summary.undetermined, 0);
  assert.equal(m.findings.find((f) => f.finding_id === 'kg-a-000000000001').state, 'resolved');
  assert.equal(m.findings.find((f) => f.finding_id === 'kg-c-000000000003').state, 'new');
  for (const f of m.findings) assert.ok(FINDING_STATES.includes(f.state));
});

test('8 · the first cycle reports nothing new and nothing resolved', () => {
  const only = cycle({ id: 'cycle-000000000007', ran: ['depth'], findings: [finding('kg-a-000000000001', 'depth')] });
  const m = movement(only, null);
  assert.equal(m.first_cycle, true);
  assert.equal(m.summary.new, 0, '"new" is a claim about a comparison and the first cycle has nothing to compare against');
  assert.equal(m.summary.resolved, 0);
  assert.equal(m.summary.undetermined, 1);
  assert.equal(m.previous_cycle_id, null);
});

test('8b · ranIn reads coverage, not the finding count', () => {
  /* An observer that ran and found nothing is a result. Inferring
     "ran" from a non-empty finding list would confuse it with
     silence, which is the same mistake in a different place. */
  const c = cycle({ ran: ['depth', 'boundary'], findings: [] });
  const s = ranIn(c);
  assert.ok(s.has('depth'), 'depth ran and found nothing, and that is not the same as not running');
  assert.ok(s.has('boundary'));
  assert.ok(!s.has('ux'));
  assert.equal(ranIn(null).size, 0);
});

/* ===============================================================
   9–11 · SIGNALS
   =============================================================== */

test('9 · a signal with no better direction is never called progress', () => {
  const notAScore = Object.entries(SIGNAL_DIRECTION).filter(([, d]) => d === 'not_a_score').map(([id]) => id);
  assert.ok(notAScore.length, 'every signal claims a better direction, which is the shape agent/health/model.mjs refuses');
  for (const id of notAScore) {
    const m = signalMovement([{ signal_id: id, value: 1, unit: 'x' }], [{ signal_id: id, value: 9, unit: 'x' }])[0];
    assert.equal(m.moved, true);
    assert.doesNotMatch(m.reading, /is the (better|worse) direction/,
      `${id} has no better direction and the reading claims one`);
    assert.match(m.reading, /no better direction/,
      `${id} moved and the reading does not warn that neither direction is progress`);
    assert.ok(m.interpretation, `${id} moved and carries no interpretation, so a reader has nothing to read it against`);
  }
});

test('10 · a signal not measured this cycle is null, and is not a pass', () => {
  const m = signalMovement([{ signal_id: 'validators.errors', value: null, unit: 'errors' }], [{ signal_id: 'validators.errors', value: 0, unit: 'errors' }])[0];
  assert.equal(m.value, null);
  assert.equal(m.moved, null, 'an unmeasured signal must not report movement');
  assert.match(m.reading, /not a zero and not a pass/);
});

test('11 · every signal the loop emits has a direction and an interpretation', async () => {
  const r = await observe({ tracer: tracer(), asOf: '2026-09-09', only: ['reach'], validators: false });
  assert.ok(r.signals.length, 'the reach observer emitted no signal');
  for (const s of r.signals) {
    assert.ok(Object.hasOwn(SIGNAL_DIRECTION, s.signal_id), `${s.signal_id} has no declared direction`);
    assert.ok(SIGNAL_INTERPRETATION[s.signal_id], `${s.signal_id} has no interpretation`);
    assert.ok(['public', 'private'].includes(s.visibility), `${s.signal_id} declares no visibility, and the ledger is git-tracked`);
  }
});

/* ===============================================================
   12–16 · THE TRACKED LEDGER AND ITS PUBLICATION RULE
   =============================================================== */

test('12 · a private signal is withheld from the entry, and the fact that there is one is not', async () => {
  const r = await observe({ tracer: tracer(), asOf: '2026-09-09', only: ['boundary'], validators: false });
  const priv = r.signals.filter((s) => s.visibility === 'private');
  assert.ok(priv.length, 'the boundary check emitted no private signal, so this test proves nothing');

  const e = entryFor({ observation: r });
  const ids = e.signals.map((s) => s.signal_id);
  for (const p of priv) assert.ok(!ids.includes(p.signal_id), `${p.signal_id} is private and reached the entry body`);
  assert.equal(e.signals_withheld.length, priv.length);
  assert.ok(e.signals_withheld.every((w) => w.why.length > 20));
  assert.deepEqual(publicationRefusals(e), [], 'an entry built by entryFor must be publishable');
});

test('13 · the ledger refuses an entry naming the private control plane', () => {
  const e = entryFor({ observation: { as_of: '2026-09-09', coverage: [], findings: [], signals: [] } });
  e.findings.push({ finding_id: 'x-000000000001', observer: 'ux', contract: 'UXProposal', severity: null, autonomy_class: null, paths: ['.control-room/server.mjs'] });
  const refusals = publicationRefusals(e);
  assert.ok(refusals.some((r) => r.rule === 'forbidden_path' && r.found === '.control-room/'));
  const dir = tmp();
  try {
    assert.throws(() => writeCycle(e, { dir }), CycleRefused, 'the entry was written into a tracked, published file');
    assert.equal(existsSync(cycleLedgerPath(dir)), false, 'a refused write must leave no file');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('14 · the ledger refuses an entry carrying a private health metric id', () => {
  /* Checked over the SERIALISED entry with the health monitor's own
     leak detector, so a private id arriving through a field nobody
     thought about is caught. A structural check would verify the
     shape somebody wrote. */
  const priv = privateMetrics();
  assert.ok(priv.length, 'the health register reports no private metric, so this test proves nothing');
  const e = entryFor({ observation: { as_of: '2026-09-09', coverage: [], findings: [], signals: [] } });
  e.session = `carried in a field nobody thought about: ${priv[0].id}`;
  const refusals = publicationRefusals(e);
  assert.ok(refusals.some((r) => r.rule === 'private_metric_id' && r.found === priv[0].id));
});

test('15 · a clean entry writes, reads back identical, and is versioned', () => {
  const dir = tmp();
  try {
    const e = entryFor({
      observation: { as_of: '2026-09-09', coverage: [{ observer: 'depth', agent: 'data-depth', kind: 'findings', state: 'ran', why: null, findings: 1 }], findings: [normalise({ contract: 'KnowledgeGap', gap_id: 'kg-a-000000000001' }, 'depth')], signals: [] },
      recordedAt: '2026-09-09T00:00:00.000Z',
    });
    const w = writeCycle(e, { dir });
    assert.equal(w.cycle_id, e.cycle_id);
    const back = readCycles({ dir });
    assert.equal(back.entries.length, 1);
    assert.deepEqual(back.entries[0], e, 'the entry did not round-trip');
    assert.equal(back.entries[0].ledger_version, CYCLE_LEDGER_VERSION);

    /* Ids are derived from the cycle's coordinates, so the same
       coordinates reproduce the id and different ones do not. */
    assert.equal(cycleId({ asOf: '2026-09-09', recordedAt: '2026-09-09T00:00:00.000Z' }), cycleId({ asOf: '2026-09-09', recordedAt: '2026-09-09T00:00:00.000Z' }));
    assert.notEqual(cycleId({ asOf: '2026-09-09', recordedAt: '2026-09-09T00:00:00.000Z' }), cycleId({ asOf: '2026-09-10', recordedAt: '2026-09-09T00:00:00.000Z' }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('16 · a malformed line is named, never silently dropped', () => {
  const dir = tmp();
  try {
    const e = entryFor({ observation: { as_of: '2026-09-09', coverage: [], findings: [], signals: [] }, recordedAt: '2026-09-09T00:00:00.000Z' });
    writeCycle(e, { dir });
    writeFileSync(cycleLedgerPath(dir), `${readFileSync(cycleLedgerPath(dir), 'utf8')}{not json\n{"ledger_version":99}\n`, 'utf8');
    const back = readCycles({ dir });
    assert.equal(back.entries.length, 1, 'a store that skips what it cannot parse reports a shorter history and no reason for it');
    assert.equal(back.malformed.length, 2);
    assert.match(back.malformed[0].why, /not JSON/);
    assert.match(back.malformed[1].why, /ledger_version/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('16b · previousCycle orders by recorded_at, and an empty ledger is null not zero', () => {
  const dir = tmp();
  try {
    assert.equal(previousCycle({ dir }), null);
    const a = entryFor({ observation: { as_of: '2026-09-01', coverage: [], findings: [], signals: [] }, recordedAt: '2026-09-01T00:00:00.000Z' });
    const b = entryFor({ observation: { as_of: '2026-09-05', coverage: [], findings: [], signals: [] }, recordedAt: '2026-09-05T00:00:00.000Z' });
    writeCycle(b, { dir }); writeCycle(a, { dir });   // written out of order on purpose
    assert.equal(previousCycle({ dir }).cycle_id, b.cycle_id, 'ordering must not depend on the order lines were appended');
    assert.equal(previousCycle({ dir, before: '2026-09-03T00:00:00.000Z' }).cycle_id, a.cycle_id);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('16c · the cycle ledger is the one store here that is NOT git-ignored', () => {
  /* Every other run store in this repository is ignored and argues
     for it. This one is tracked and ledger.mjs argues for that. The
     assertion is that the deliberate exception is still true, because
     a .gitignore entry added later would silently turn the loop's
     memory back into per-machine state and nothing else would
     notice. */
  let ignored = false;
  try {
    execFileSync('git', ['check-ignore', '-q', 'agent/improve/cycles/cycles.jsonl'], { cwd: REPO, stdio: 'ignore' });
    ignored = true;
  } catch { ignored = false; }
  assert.equal(ignored, false,
    'agent/improve/cycles/ is git-ignored. A loop whose memory does not survive a clone is not a loop — see the header of agent/improve/ledger.mjs.');
  assert.ok(existsSync(join(CYCLE_DIR, 'README.md')), 'the cycles directory carries no README explaining why it is tracked');
  assert.ok(FORBIDDEN_IN_ENTRY.length >= 2 && FORBIDDEN_IN_ENTRY.every(([, why]) => why.length > 20));
});

/* ===============================================================
   17–19 · THE TRIAGE
   =============================================================== */

test('17 · SESSION 27\'s finding: a flawless proposal is refused by a condition no proposal can satisfy', () => {
  /* THE POSITIVE THIS SUITE NEEDS, AND WHAT IT ACTUALLY FOUND.
     `machine_derived_field` over docs/ is enabled by the real grant
     in agent/policy/governance/grants.jsonl. The fixture is a
     well-formed ImplementationProposal writing one file under docs/,
     with real evidence, no interpretation and nothing blocking — and
     it is STILL refused, under the policy actually in force, by
     exactly one condition.

     That condition is `rollback_mechanical`. It reads the branch, the
     base commit and the per-file pre-change hashes that
     agent/implement/apply.mjs openContext() records in step 2 of the
     seven; agent/autonomy/cycle.mjs evaluates it in gate 3, which
     runs before step 1. Four of its six elements are therefore
     `unknown` for every proposal at that point, and it is not one of
     the four MEASURED_CONDITIONS that are allowed to be.

     So the permitting half of limited autonomy is not merely
     unexercised, as docs/LIMITED-AUTONOMY.md §7.1 says — on this
     evidence it is unreachable. This test pins the finding so that
     the day somebody changes the gate, it fails and says why.
     It is NOT fixed here: changing what a gate proves is Class C
     work on the governance layer, and agent/policy/ is on the
     never-automatic path list on purpose. */
  const inForce = policyInForce({}).policy;
  const t = triage(cleanDocsProposal(), inForce);

  assert.equal(t.category, 'machine_derived_field');
  assert.ok(inForce.enabled_categories.includes('machine_derived_field'),
    'the real grant no longer enables machine_derived_field, so this test is about a category nobody switched on');
  assert.equal(t.destination, 'human_queue');
  assert.equal(t.blocked_only_by_prerun_condition, true,
    `the refusal is no longer the single pre-run condition, so SESSION 27's finding has moved: ${t.why}`);
  assert.deepEqual(t.failed_conditions, [PRE_RUN_UNSATISFIABLE]);
  assert.ok(!MEASURED_CONDITIONS.includes(PRE_RUN_UNSATISFIABLE),
    `${PRE_RUN_UNSATISFIABLE} is now one of the measured conditions, which would close this finding. Delete it from cycle.mjs and from docs/CONTINUOUS-IMPROVEMENT.md §4 rather than leaving both.`);
  assert.match(t.why, /step 2|openContext/);
});

test('17b · the referring path is not dead code', () => {
  /* A suite that could only ever see a refusal cannot tell
     "correctly refused" from "broken" — the reason
     agent/policy/selftest.mjs test 1 exists. The pre-run condition
     above is supplied here as a measured fact, which is what a real
     run does at step 6, and the SAME proposal then refers. */
  const withContext = triage(cleanDocsProposal(), policyInForce({}).policy);
  assert.equal(withContext.destination, 'human_queue');

  const t = triage(cleanDocsProposal(), policyInForce({}).policy, {
    context: {
      branch: 'improve-selftest-branch',
      commit: 'f'.repeat(40),
      permitted: ['docs/IMPROVE-SELFTEST-NOTE.md'],
      before: { 'docs/IMPROVE-SELFTEST-NOTE.md': { exists: false, sha256: null, bytes: 0 } },
      rollback: { method: 'git checkout <commit> -- <permitted paths>', command: 'git checkout' },
    },
  });
  assert.equal(t.destination, 'autonomy_runner', `the referring path is broken: ${t.why}`);
  assert.ok(t.why.includes('agent/autonomy/'), 'a referral must name what actually decides');
  assert.ok(t.unknown_conditions.every((c) => MEASURED_CONDITIONS.includes(c)),
    'a referral was made with an unknown that is not one of the four measurements');
});

test('18 · the same proposal is refused where no grant enables its category', () => {
  /* The negative half of 17b, under a policy that enables a
     different category. The proposal is unchanged, so the only thing
     that moved is what somebody granted. */
  const narrow = { ...fixturePolicy(), enabled_categories: ['retrieval_metadata'] };
  const t = triage(cleanDocsProposal(), narrow);
  assert.equal(t.destination, 'human_queue');
  assert.equal(t.category, 'machine_derived_field');
  assert.match(t.why, /no governance grant enables it/);
  assert.notEqual(t.blocked_only_by_prerun_condition, true,
    'a category refusal must not be reported as the pre-run condition, which is a different and much narrower finding');
});

test('19 · a never-automatic field is refused however the proposal describes itself', () => {
  const p = sourcesProposal('verification_note');
  assert.equal(p.substantive, false, 'the fixture must describe itself as non-substantive, or it proves nothing');
  assert.equal(categoriseProposal(p).category, 'source_metadata_maintenance',
    'the fixture must reach an ENABLED category, or the field gate is never the thing that refuses it');
  const t = triage(p, fixturePolicy());
  assert.equal(t.destination, 'human_queue');
  assert.ok(NEVER_AUTOMATIC_FIELD_NAMES.includes('verification_note'));
  assert.match(t.why, /verification_note/);
  assert.ok((t.field_refusals ?? []).length, 'the field gate refused and named nothing');

  /* And the positive it must be measured against: the same fixture
     aimed at a field the grant does cover is NOT refused by the
     field gate. */
  const ok = triage(sourcesProposal('url_status'), fixturePolicy());
  assert.equal(ok.field_refusals, undefined, `the field gate refused a permitted field: ${ok.why}`);
});

test('19b · a record that proposes no act has no category and is never referred', () => {
  const t = triage({ contract: 'KnowledgeGap', gap_id: 'kg-a-000000000001' }, fixturePolicy());
  assert.equal(t.destination, 'no_act_proposed');
  assert.equal(t.category, null, 'a gap has no category because it proposes no act');
});

test('19c · there are three destinations, and none of them is "approved"', () => {
  const keys = Object.keys(DESTINATIONS);
  assert.deepEqual(keys.sort(), ['autonomy_runner', 'human_queue', 'no_act_proposed']);
  /* The loop must not be a second entrance to execution. If it ever
     grows one, the decision that has one home would have two.
     Comments are stripped first and string literals kept, which is
     the correction docs/SECURITY-VERIFICATION-2026-09-08.md §7
     records about HE-01: this module's own header explains at length
     that it does NOT call these, and a naive substring scan would
     read that explanation as the thing it forbids. */
  const src = readFileSync(new URL('./cycle.mjs', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  for (const forbidden of ['runCycle(', 'mergeBack(', 'cutBranch(', 'recordDecision(', 'commitChange(']) {
    assert.ok(!src.includes(forbidden),
      `cycle.mjs calls ${forbidden} — it reaches the executing path. Executing is agent/autonomy/, behind its own gates, and a second entrance would be a second home for the most consequential decision here.`);
  }
  assert.ok(PROPOSAL_CONTRACTS.length >= 4);
});

/* ===============================================================
   20–22 · TWO REAL CYCLES, AGAINST THE REAL CORPUS
   =============================================================== */

test('20 · two real cycles run, record, and compare — and the working tree is untouched', async () => {
  const dirty = () => execFileSync('git', ['status', '--porcelain'], { cwd: REPO, encoding: 'utf8' })
    .split('\n').map((l) => l.slice(3)).filter(Boolean)
    .filter((p) => /^(data\/|i18n\/|js\/|css\/|style\.css|app\.js|[^/]+\.html)/.test(p));

  const before = dirty();
  const dir = tmp();
  try {
    const one = await runImprovementCycle({
      tracer: tracer(), asOf: '2026-09-09', validators: false, record: true,
      cycleDir: dir, now: '2026-09-09T00:00:00.000Z', session: 'suite',
    });
    assert.equal(one.movement.first_cycle, true);
    assert.ok(one.observation.findings.length > 0, 'a real cycle over the real corpus found nothing, which would mean the observers are not running');
    assert.ok(one.recorded, 'the cycle was asked to record and did not');

    const two = await runImprovementCycle({
      tracer: tracer(), asOf: '2026-09-09', validators: false, record: false,
      cycleDir: dir, now: '2026-09-09T01:00:00.000Z', session: 'suite',
    });
    assert.equal(two.movement.first_cycle, false);
    assert.equal(two.movement.previous_cycle_id, one.entry.cycle_id);

    /* Two passes over an unchanged corpus. Every observer that ran in
       both is comparable, and every finding persists: this is the
       reproducibility the content-derived ids buy, and without it
       every number the loop reports is noise. */
    const comparable = two.movement.by_observer.filter((o) => o.comparable);
    assert.ok(comparable.length >= 5, `only ${comparable.length} observer(s) were comparable across two identical passes`);
    for (const o of comparable) {
      assert.equal(o.new, 0, `${o.observer} reported ${o.new} new finding(s) over an unchanged corpus — its ids are not content-derived`);
      assert.equal(o.resolved, 0, `${o.observer} reported ${o.resolved} resolved over an unchanged corpus`);
      assert.equal(o.persisting, o.current);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }

  assert.deepEqual(dirty(), before,
    'a cycle changed the site or its data. The loop reads; the only writes it has are the cycle ledger and the record store, both opt-in.');
});

test('21 · a cycle without --record writes nothing at all', async () => {
  const dir = tmp();
  try {
    const r = await runImprovementCycle({
      tracer: tracer(), asOf: '2026-09-09', validators: false, only: ['reach'],
      cycleDir: dir, now: '2026-09-09T00:00:00.000Z',
    });
    assert.equal(r.recorded, null);
    assert.equal(r.stored, null);
    assert.equal(existsSync(cycleLedgerPath(dir)), false,
      'the default run appended to a git-tracked file. A run that records by default takes a commit decision once, for everybody.');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('22 · the cycle report says what it does not prove, and the coverage comes first', async () => {
  const r = await runImprovementCycle({
    tracer: tracer(), asOf: '2026-09-09', validators: false, only: ['reach'],
    cycleDir: tmp(), now: '2026-09-09T00:00:00.000Z',
  });
  assert.ok(r.what_this_does_not_prove.length >= 4);
  assert.ok(r.what_this_does_not_prove.some((l) => /not a permission/i.test(l)),
    'the report does not say that a referral is not a permission, which is the sentence a reader of a green report most needs');
  assert.ok(r.what_this_does_not_prove.some((l) => /resolved/i.test(l)));

  /* Coverage exists for every observer, including the ones this run
     did not select — an absence has to be visible. */
  const cov = coverageOf([], ['depth']);
  assert.equal(cov.length, OBSERVERS.length);
  assert.equal(cov.find((c) => c.observer === 'depth').state, 'skipped');
  assert.equal(cov.find((c) => c.observer === 'ux').state, 'not_selected');
});

test('22b · the loop is registered as an agent and names one trace per cycle', async () => {
  const t = tracer();
  const r = await runImprovementCycle({
    tracer: t, asOf: '2026-09-09', validators: false, only: ['reach'],
    cycleDir: tmp(), now: '2026-09-09T00:00:00.000Z',
  });
  assert.match(r.trace_id, /^[0-9a-f]{16,}$/);
  const events = t.sink.records ?? [];
  assert.ok(events.length > 0, 'a cycle emitted no trace event');
  assert.ok(events.some((e) => JSON.stringify(e).includes('improve.observe')), 'the observation step is not on the trace');
});
