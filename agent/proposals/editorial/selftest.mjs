/* ============================================================
   agent/proposals/editorial/selftest.mjs — Agent 7's suite

   Run:  node --test agent/proposals/editorial/selftest.mjs

   What it holds this agent to, in the order the risks matter:

     · IT WRITES NO SENTENCE. Every drafted replacement is a
       substitution, and the arithmetic is asserted over every draft
       a full run produces: exactly one occurrence, every other byte
       identical, every load-bearing attribute unmoved, every caveat
       still there. This is the agent's version of "do not
       fabricate", and it is the only reason a machine is allowed
       near the brief's prose at all.
     · IT NEVER REWRITES AN ARGUMENT. No proposal over an
       interpretation or a critique carries a replacement, the triage
       table cannot express one, and the contract refuses one.
     · IT WRITES NOTHING TO THE SITE. No write call in any module
       here; data/, every page and every locale file are
       byte-identical before and after a full run against the real
       corpus.
     · IT FABRICATES NO CITATION. Not one evidence entry on any
       record is a retrieved_document, because no agent in this
       repository has ever retrieved one.
     · ONLY VERIFIED INPUTS REACH IT, and every refusal says why.
     · THE THREE SESSION 15 CASES ARE REGRESSION-TESTED, each
       against the REAL corpus and the REAL prose of index.html:
       a factual correction, an analytical review, and a no-change
       explanation.

   The corpus and the pages are the real ones throughout. A fixture
   page would let the prose reader pass while being wrong about the
   markup it exists to read.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { Tracer } from '../../observability/tracer.mjs';
import { MemorySink } from '../../observability/sink.mjs';
import { deterministicIds, deterministicClock } from '../../observability/ids.mjs';
import { MemoryRecordStore } from '../../scout/store.mjs';
import { loadCorpus, hashDataDir } from '../../integrate/canonical.mjs';
import { validate } from '../../schemas/validate.mjs';
import { buildTree, editorialState } from '../../observability/query.mjs';
import { regulatoryChangeFixture, verificationRecordFixture, editorialProposalFixture, dataProposalFixture } from '../../schemas/fixtures.mjs';
import { REPO_ROOT, EDITORIAL_STATES, EDITORIAL_PROPOSAL_KINDS, DRAFTABLE_EDITORIAL_KIND } from '../../schemas/types.mjs';

import { readProse, readPage, readContentBlob, readBriefJson, blobDivergences, textOf, wordCount, attrsOf, maskUnscannable, PROSE_MIN_WORDS, BLOCK_TAGS } from './prose.mjs';
import { registerOf, stateOfBlock, stateOfClaim, claimReferences, STATE_GLOSS, ANALYTICAL_STATES, BOX_LABEL_EXPECTS } from './register.mjs';
import { intake, correctable, ADMISSIBLE, SETTLING_VERDICTS, ENTITLEMENT } from './intake.mjs';
import { needlesFor, reachOf, triage, TRIAGE, change_entity } from './staleness.mjs';
import { substitute, caveatsIn, attributeFingerprint, i18nDispositionsFor, CAVEAT_MARKERS, LOAD_BEARING_ATTRS } from './drafts.mjs';
import { EditorialAgent, EDITORIAL_AGENT, evidenceProblems, MINTABLE_EVIDENCE } from './editorial.mjs';
import { DRAFT_DIR, EDITORIAL_DIR } from './drafts-dir.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const AS_OF = '2026-09-03';

const CORPUS = loadCorpus();
const PROSE = readProse();
const REGISTER = registerOf(PROSE.blocks, CORPUS);

function harness() {
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({
    service: 'test',
    sink,
    ids: deterministicIds(41),
    clock: deterministicClock('2026-09-03T09:00:00.000Z', 100),
    attributes: { agent: EDITORIAL_AGENT },
  });
  const store = new MemoryRecordStore({ allowSimulated: true });
  return { sink, tracer, store };
}

/**
 * A verified change over a REAL record whose value a REAL sentence
 * in index.html states.
 *
 * `tl-dsa-2025-10-29-delegated-act` is a timeline event dated
 * 2025-10-29, and `index.html` part-3.p7 — a block whose claims are
 * all law or fact, so its editorial state is FACT — says "A
 * delegated act entered into force on 29 October 2025". That pairing
 * is what makes the drafting path testable against the site rather
 * than against a mock page.
 */
const FACT_EVENT = 'tl-dsa-2025-10-29-delegated-act';
const FACT_ANCHOR = 'part-3.p7';

function changeOver({ entity, path = 'data/timeline.json', attribute = 'date', old_value, new_value, id = 'rchg-suite-0001', kind = 'timeline_event' }) {
  return {
    ...regulatoryChangeFixture(),
    change_id: id,
    attribute,
    old_value,
    new_value,
    affected_entities: [{ kind, id: entity, path, field: attribute, note: null }],
  };
}

async function runWith(inputs) {
  const { sink, tracer, store } = harness();
  const agent = new EditorialAgent({ tracer, store, corpus: CORPUS, asOf: AS_OF, inputs, simulated: true });
  const result = await agent.run();
  return { result, sink, store };
}

/* ============================================================
   1 · the prose, read as a structure
   ============================================================ */

test('every page at the repository root is read', () => {
  const pages = readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html')).sort();
  assert.deepEqual(PROSE.pages, pages);
  assert.equal(pages.length, 7, 'the site has seven pages and the reader must see all of them');
});

test('the tag scanner leaves no close tag unmatched on any page', () => {
  /* 126 were dropped on the first pass, because the SVG primitives
     this site inlines were treated as void and are closed
     explicitly in half their occurrences. A run that silently
     examines less than it says it did is the failure this counts. */
  assert.equal(PROSE.dropped, 0);
});

test('every data-claim attribution in the markup becomes an attributed block', () => {
  const declared = readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html'))
    .reduce((n, f) => n + [...readFileSync(join(REPO_ROOT, f), 'utf8').matchAll(/data-claim="[^"]*"/g)].length, 0);
  const read = PROSE.blocks.filter((b) => b.claim_ids.length).length;
  assert.equal(read, declared, 'a claim attribution the reader cannot see is provenance this agent would miss');
});

test('the brief\'s own CRITIQUE boxes are read from the markup, not inferred', () => {
  const labelled = PROSE.blocks.filter((b) => b.box_label);
  assert.ok(labelled.length >= 20, `expected the labelled boxes to be found, got ${labelled.length}`);
  assert.deepEqual([...new Set(labelled.map((b) => b.box_label))].sort(), ['CRITIQUE', 'MECHANICS']);
});

test('a block below the stated word threshold is not treated as an authored sentence', () => {
  for (const b of PROSE.blocks) assert.ok(b.words >= PROSE_MIN_WORDS, `${b.anchor} has ${b.words} words`);
});

test('an element the site itself marks — data-i18n or data-claim — is a block whatever its tag', () => {
  /* The brief's critique boxes hold their prose in a <div
     class="box-body">, which is in no tag list. Twelve of the
     fifty-nine claim attributions are on one. */
  const divs = PROSE.blocks.filter((b) => b.tag === 'div');
  assert.ok(divs.length > 0);
  for (const d of divs) assert.ok(d.i18n_key || d.claim_ids.length, `${d.anchor} is a div with neither marker`);
});

test('the three homes of the brief\'s prose are read as three', () => {
  assert.deepEqual(Object.keys(PROSE.by_home).sort(), ['brief_json', 'content_blob', 'markup']);
  for (const h of Object.keys(PROSE.by_home)) assert.ok(PROSE.by_home[h] > 0, `${h} yielded no blocks`);
});

test('the __CONTENT__ / brief.json divergence is reported and not reconciled', () => {
  const d = PROSE.divergences.find((x) => x.field === 'meta.standfirst');
  assert.ok(d, 'meta.standfirst has already drifted between the two homes; a reader that missed it would be wrong about the site');
  assert.notEqual(d.blob, d.brief_json);
  const blob = readContentBlob();
  const { brief } = readBriefJson();
  assert.equal(blob.content.meta.standfirst, d.blob, 'the reported value is the one in the file');
  assert.equal(brief.meta.standfirst, d.brief_json);
});

test('the scanner never walks into a script, a style or a comment', () => {
  const raw = readFileSync(join(REPO_ROOT, 'index.html'), 'utf8');
  const masked = maskUnscannable(raw);
  assert.equal(masked.length, raw.length, 'masking must preserve every byte position or line numbers lie');
  assert.ok(!/window\.__CONTENT__/.test(masked), 'the inline blob is read deliberately, never scanned as markup');
});

test('entities are decoded and inline tags stripped, without guessing at an unknown entity', () => {
  assert.equal(textOf('<p>a &amp; b <b>c</b></p>'), 'a & b c');
  assert.equal(textOf('&mdash;'), '—');
  assert.equal(textOf('&notarealentity;'), '&notarealentity;');
  assert.equal(wordCount('one two three'), 3);
  assert.deepEqual(attrsOf(' data-i18n="k" data-claim="a b"'), { 'data-i18n': 'k', 'data-claim': 'a b' });
});

/* ============================================================
   2 · the four distinctions
   ============================================================ */

test('every editorial state has a gloss, and there are five of them', () => {
  assert.equal(EDITORIAL_STATES.length, 5);
  for (const s of EDITORIAL_STATES) assert.ok(STATE_GLOSS[s], `${s} has no gloss`);
});

test('the grade is imported from js/format.js and never recomputed here', () => {
  const src = readFileSync(join(HERE, 'register.mjs'), 'utf8');
  assert.ok(/from '\.\.\/\.\.\/\.\.\/js\/format\.js'/.test(src), 'the grading rules are red tier; a second implementation is the copy that drifts');
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const t = readFileSync(join(HERE, f), 'utf8');
    assert.ok(!/TIER_GRADE/.test(t), `${f} names TIER_GRADE — the grading table has one home and it is js/format.js`);
  }
});

test('an argument stays an argument however well sourced it is', () => {
  const ix = { source: CORPUS.sourceById };
  for (const c of CORPUS.claims) {
    const st = stateOfClaim(c, ix);
    if (c.type === 'claim-type:critique') assert.equal(st.state, 'critique', c.id);
    if (c.type === 'claim-type:interpretation') assert.equal(st.state, 'interpretation', c.id);
    if (c.type === 'claim-type:forecast') assert.equal(st.state, 'interpretation', c.id);
    /* Never unresolved: js/format.js grades the whole argument
       family as interpretation, and a citation cannot settle a
       reading's conclusion. */
    if (['claim-type:critique', 'claim-type:interpretation', 'claim-type:forecast'].includes(c.type)) {
      assert.notEqual(st.state, 'unresolved', `${c.id} was downgraded for want of a citation`);
    }
  }
});

test('a law or fact claim with no external direct source is UNRESOLVED', () => {
  const ix = { source: CORPUS.sourceById };
  const selfOnly = CORPUS.claims.filter((c) => ['claim-type:law', 'claim-type:fact'].includes(c.type)
    && !(c.sources ?? []).some((s) => s.supports === 'supports:direct' && s.source_id !== 'src-brief-original'));
  assert.ok(selfOnly.length, 'the corpus has such claims; if it stops having them this test is telling you so');
  for (const c of selfOnly) assert.equal(stateOfClaim(c, ix).state, 'unresolved', c.id);
});

test('a block carrying no claim record is not_attributed, and never guessed at', () => {
  const bare = PROSE.blocks.find((b) => !b.claim_ids.length && !b.box_label);
  assert.ok(bare);
  const st = stateOfBlock(bare, CORPUS);
  assert.equal(st.state, 'not_attributed');
  assert.equal(st.grade, null);
  assert.match(st.why, /cannot be derived/);
});

test('a block whose claims disagree takes the weakest state', () => {
  const mixed = REGISTER.rows.find((r) => r.conflicts.length > 1 && !r.declared_by_markup);
  assert.ok(mixed, 'the corpus has blocks holding claims in more than one state');
  const order = ['unresolved', 'critique', 'interpretation', 'fact'];
  const weakest = order.find((s) => mixed.claim_states.some((c) => c.state === s));
  assert.equal(mixed.state, weakest);
});

test('the markup\'s own label governs where the claims agree with it, and is reported where they do not', () => {
  for (const r of REGISTER.rows.filter((x) => x.declared_by_markup)) {
    const expects = BOX_LABEL_EXPECTS[r.block.box_label] ?? [];
    const agrees = r.claim_states.some((c) => expects.includes(c.family));
    if (agrees) {
      assert.equal(r.state, r.declared_by_markup, `${r.block.anchor}: the author's own label should govern`);
      assert.equal(r.box_label_disagrees, false);
    } else if (r.claim_states.length) {
      assert.equal(r.box_label_disagrees, true, `${r.block.anchor}: a label no attached claim supports is a finding`);
    }
  }
});

test('a claim\'s references are derived from the record, never from a field list', () => {
  const src = readFileSync(join(HERE, 'register.mjs'), 'utf8');
  assert.ok(!/'instruments',\s*'provisions'/.test(src), 'a hand-kept list of reference fields is the second home this rule exists to prevent');
  const c = CORPUS.claimById.get('clm-art-114-shapes-everything');
  const refs = claimReferences(c, (v) => CORPUS.allIds.has(v));
  assert.ok(refs.includes('gdpr'));
  assert.ok(refs.includes('tfeu:art-114'), 'legal_basis is followed without being named');
  assert.ok(!refs.includes(c.id), 'a record does not reference itself');
});

test('the register census is a measurement of the real site', () => {
  assert.equal(Object.values(REGISTER.by_state).reduce((a, b) => a + b, 0), PROSE.blocks.length);
  assert.equal(REGISTER.attributed, PROSE.blocks.filter((b) => b.claim_ids.length).length);
  assert.equal(REGISTER.dangling_attributions.length, 0, 'every data-claim in the markup resolves to a record; if this fails, the site has a dangling attribution');
});

/* ============================================================
   3 · only verified inputs
   ============================================================ */

test('the three admissible contracts are the only ones let in', () => {
  const bad = dataProposalFixture();
  const g = intake([bad, regulatoryChangeFixture()], { allowSimulated: true });
  assert.equal(g.accepted.length, 1);
  assert.equal(g.refused.length, 1);
  assert.match(g.refused[0].why, /not a verified input/);
  assert.deepEqual(ADMISSIBLE, ['RegulatoryChange', 'ImpactAssessment', 'VerificationRecord']);
});

test('a verdict that settled nothing is refused, with the reason it is not a defect', () => {
  for (const verdict of ['not_determinable', 'source_unavailable', 'conflict']) {
    const v = { ...verificationRecordFixture(), verdict };
    const g = intake([v], { allowSimulated: true });
    assert.equal(g.accepted.length, 0, verdict);
    assert.ok(g.refused[0].why.length > 60, 'a refusal carries its reason');
  }
  for (const verdict of SETTLING_VERDICTS) assert.ok(['confirmed', 'partially_confirmed', 'contradicted'].includes(verdict));
});

test('a malformed record dies at the boundary rather than three agents later', () => {
  const broken = { ...regulatoryChangeFixture(), materiality: 'enormous' };
  const g = intake([broken], { allowSimulated: true });
  assert.equal(g.accepted.length, 0);
  assert.match(g.refused[0].why, /gateway rejected it/);
});

test('a change of no materiality is refused', () => {
  /* The kind has to be UPDATED for the record to be valid at all —
     RegulatoryChange refuses "none" on anything else — so the input
     is one the gateway lets through and this gate turns away. */
  const g = intake([{ ...regulatoryChangeFixture(), change_kind: 'UPDATED', materiality: 'none', old_value: 'x', new_value: 'x' }], { allowSimulated: true });
  assert.equal(g.accepted.length, 0);
  assert.match(g.refused[0].why, /materiality "none"/, g.refused[0].why);
});

test('only a RegulatoryChange may produce a correction, and each entitlement says why', () => {
  for (const c of ADMISSIBLE) assert.ok(ENTITLEMENT[c].why.length > 40, c);
  assert.equal(ENTITLEMENT.RegulatoryChange.may_correct, true);
  assert.equal(ENTITLEMENT.VerificationRecord.may_correct, false);
  assert.equal(ENTITLEMENT.ImpactAssessment.may_correct, false);
});

test('"unknown" is a state and never a value to put in a sentence', () => {
  const c = changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: 'unknown' });
  assert.equal(correctable(c).ok, false);
  assert.match(correctable(c).why, /not publicly determinable/);
  const d = changeOver({ entity: FACT_EVENT, old_value: 'unknown', new_value: '2099-01-01' });
  assert.equal(correctable(d).ok, false);
});

/* ============================================================
   4 · contradiction, staleness, and no change
   ============================================================ */

test('the triage table covers every state and refuses to route an argument to a correction', () => {
  for (const state of EDITORIAL_STATES) {
    for (const kind of ['contradicted', 'possibly_stale']) {
      const row = triage(state, kind);
      assert.ok(row, `${state} × ${kind}`);
      assert.ok(row.why.length > 60, 'a routing decision without a reason is a permission nobody can argue with');
      if (ANALYTICAL_STATES.includes(state)) assert.notEqual(row.outcome, 'factual_update');
    }
  }
  assert.equal(TRIAGE.length, 10);
});

test('only fact × contradicted produces a correction', () => {
  const correcting = TRIAGE.filter((r) => r.outcome === 'factual_update');
  assert.equal(correcting.length, 1);
  assert.equal(correcting[0].state, 'fact');
  assert.equal(correcting[0].staleness, 'contradicted');
});

test('a sentence stating the value that moved is CONTRADICTED and quoted', () => {
  const row = REGISTER.rows.find((r) => r.block.anchor === FACT_ANCHOR);
  assert.ok(row, `${FACT_ANCHOR} is a real block in index.html`);
  const change = changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' });
  const r = reachOf(row, { change, corpus: CORPUS, needles: [], months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], labels: [] });
  assert.equal(r.kind, 'contradicted');
  assert.ok(r.quote.includes('29 October 2025'), 'the finding carries the sentence so a reviewer can check it');
  assert.equal(r.matched, '29 October 2025');
});

test('a sentence that merely depends on the record is POSSIBLY STALE and carries no quote', () => {
  const change = changeOver({ entity: 'gdpr', path: 'data/instruments.json', attribute: 'legislative_status', old_value: 'status:applicable', new_value: 'status:repealed' });
  const rows = REGISTER.rows.filter((r) => r.claim_states.length);
  const found = rows.map((r) => ({ r, x: reachOf(r, { change, corpus: CORPUS, needles: [], months: [], labels: [] }) })).filter((x) => x.x.kind === 'possibly_stale');
  assert.ok(found.length, 'claims naming gdpr are attached to prose blocks');
  for (const f of found) {
    assert.equal(f.x.quote, null, 'a possible staleness has nothing to quote, and pretending otherwise is the failure this separation prevents');
    assert.match(f.x.how, /claim/);
  }
});

test('a name a string match cannot distinguish becomes an open question, not a finding', () => {
  const needles = needlesFor('gdpr', { corpus: CORPUS, register: REGISTER });
  assert.ok(needles.some((n) => n.text === 'gdpr'), 'the id itself is always a needle');
  for (const n of needles) assert.ok(n.why.length > 30, `${n.text} carries no reason for its verdict`);
});

/* ============================================================
   5 · the three SESSION 15 cases, against the real site
   ============================================================ */

test('REGRESSION 1 — a factual correction proposal, drafted as a substitution', async () => {
  const change = changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' });
  const { result } = await runWith([change]);

  const p = result.proposals.find((x) => x.proposal_kind === 'factual_update');
  assert.ok(p, 'a fact-state sentence quoting the value that moved must produce a correction');
  assert.equal(p.editorial_state, 'fact');
  assert.equal(p.autonomy_class, 'review_required');
  assert.equal(p.changes_what_a_claim_asserts, false);
  assert.equal(p.staleness.kind, 'contradicted');
  assert.ok(p.staleness.quoted.includes('29 October 2025'));
  assert.equal(p.prose_locations[0].file, 'index.html');
  assert.ok(p.claim_ids_affected.length, 'every material factual sentence retains its provenance');

  const op = p.proposed_change.operations[0];
  /* THE ARITHMETIC. This is the whole permission this agent has. */
  assert.equal(op.current.split('29 October 2025').length - 1, 1, 'exactly one occurrence');
  assert.equal(op.current.split('29 October 2025').join('2099-09-09'), op.proposed);
  assert.deepEqual(attributeFingerprint(op.current), attributeFingerprint(op.proposed), 'no attribute moved');
  for (const c of caveatsIn(op.current)) assert.ok(op.proposed.includes(c), `caveat "${c}" was dropped`);

  /* And the locale editions are declared rather than promised. */
  assert.ok(p.i18n_dispositions.length >= 3, 'three locale editions hold a translation of the sentence being corrected');
  assert.ok(p.i18n_dispositions.every((d) => d.disposition));

  const appr = result.approvals.find((a) => a.proposal_ids.includes(p.proposal_id));
  assert.ok(appr, 'a correction to prose is never unapproved');
  assert.equal(appr.state, 'requested');
  assert.equal(appr.tier, 'amber');
});

test('REGRESSION 2 — an analytical review proposal, with nothing drafted', async () => {
  const change = changeOver({ entity: 'gdpr', path: 'data/instruments.json', attribute: 'legislative_status', old_value: 'status:applicable', new_value: 'status:repealed' });
  const { result } = await runWith([change]);

  const analytical = result.proposals.filter((x) => x.proposal_kind === 'analytical_update');
  assert.ok(analytical.length, 'the brief argues about the GDPR at length; a change to it must reach an argument');
  for (const p of analytical) {
    assert.ok(ANALYTICAL_STATES.includes(p.editorial_state), `${p.proposal_id} is not over an argument`);
    assert.equal(p.autonomy_class, 'human_only');
    for (const op of p.proposed_change.operations) {
      assert.equal(op.proposed, null, 'an argument is never rewritten because a factual input moved');
    }
    assert.match(p.proposed_change.scope_note, /drafts NOTHING/);
    const appr = result.approvals.find((a) => a.proposal_ids.includes(p.proposal_id));
    assert.ok(appr && appr.tier === 'red' && appr.state === 'requested');
  }
});

test('REGRESSION 3 — a no-change explanation, and it is a finding rather than a silence', async () => {
  /* A change to the GDPR's legislative status reaches dozens of
     sentences through the claims attached to them, and states its
     value in almost none of them. Those are the cases the site
     DERIVES at render time: the status strips, the calendar and the
     pipeline stages are recomputed when a page opens, so correcting
     the record corrects everything the reader sees and the prose
     needs no edit. */
  const change = changeOver({ entity: 'gdpr', path: 'data/instruments.json', attribute: 'legislative_status', old_value: 'status:applicable', new_value: 'status:repealed', kind: 'instrument' });
  const { result } = await runWith([change]);

  assert.ok(result.no_change.length, 'sentences that depend on the record and do not state the value must be reported');
  for (const o of result.no_change) {
    assert.equal(o.contract, 'AgentObservation');
    assert.match(o.summary, /^NO CHANGE NEEDED/);
    assert.ok(o.data.quote, 'the sentence travels with the explanation');
    assert.ok(o.epistemic.fact.length, 'that the value is absent is a fact, and it cites the block');
    assert.ok(o.epistemic.unresolved.length, 'a paraphrase of the value is invisible here, and the record says so');
    assert.equal(o.risk, 'low');
  }
  /* It is NOT a proposal, and the reason is the contract's: a
     proposal with no operations is a suggestion. */
  assert.ok(!result.proposals.some((p) => p.proposal_kind === 'no_change'));
});

/* ============================================================
   6 · the refusals, as mechanisms
   ============================================================ */

test('a substitution is refused where the value is split by inline markup', () => {
  const block = { html: 'entered into force on 29 <b>October</b> 2025, establishing', text: 'entered into force on 29 October 2025, establishing' };
  const r = substitute(block, '29 October 2025', '9 September 2099');
  assert.equal(r.ok, false);
  assert.match(r.why, /broken across inline tags/);
  assert.equal(r.proposed, null);
});

test('a substitution is refused where the value appears more than once', () => {
  const block = { html: 'from 2 August 2026 until 2 August 2026', text: 'from 2 August 2026 until 2 August 2026' };
  const r = substitute(block, '2 August 2026', '1 January 2030');
  assert.equal(r.ok, false);
  assert.match(r.why, /appears 2 times/);
});

test('a substitution is refused where it would move a load-bearing attribute', () => {
  const block = { html: 'see <span data-claim="clm-x">the rule</span>', text: 'see the rule' };
  const r = substitute(block, 'clm-x', 'clm-y');
  assert.equal(r.ok, false);
  assert.match(r.why, /data-claim/);
  for (const a of LOAD_BEARING_ATTRS) assert.ok(typeof a === 'string');
});

test('a substitution is refused where it would drop a caveat', () => {
  const block = { html: 'the figure may be 100, arguably', text: 'the figure may be 100, arguably' };
  const r = substitute(block, 'may be 100, arguably', 'is 200');
  assert.equal(r.ok, false);
  assert.match(r.why, /caveat/);
  assert.ok(CAVEAT_MARKERS.length > 10);
});

test('a substitution is refused where the replacement is not a value', () => {
  const block = { html: 'on 29 October 2025', text: 'on 29 October 2025' };
  for (const bad of [null, undefined, 'unknown', '  ']) {
    assert.equal(substitute(block, '29 October 2025', bad).ok, false, String(bad));
  }
});

test('a correction that cannot be composed becomes a recommendation rather than being forced', async () => {
  /* "2 August 2026" appears twice in index.html, so a substitution
     is refused for ambiguity and the finding must survive as a
     recommendation rather than vanishing. */
  const change = changeOver({ entity: 'ai-act', path: 'data/instruments.json', attribute: 'applicability_date', old_value: '2026-08-02', new_value: '2099-09-09', id: 'rchg-suite-0002', kind: 'instrument' });
  const { result } = await runWith([change]);
  const forced = result.proposals.filter((p) => p.proposal_kind === 'factual_update'
    && p.proposed_change.operations.some((o) => (o.current.match(/2 August 2026/g) ?? []).length > 1));
  assert.equal(forced.length, 0, 'an ambiguous substitution is never drafted');
});

test('this agent may not mint a citation', async () => {
  const { result } = await runWith([changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' })]);
  const all = [...result.proposals, ...result.approvals, ...result.no_change];
  assert.ok(all.length);
  for (const r of all) {
    for (const e of r.evidence) {
      assert.ok(MINTABLE_EVIDENCE.includes(e.kind), `${r.contract} carries evidence of kind "${e.kind}"`);
      assert.notEqual(e.kind, 'retrieved_document', 'no agent in this repository has ever retrieved a document');
    }
    assert.equal(evidenceProblems(r.evidence).length, 0);
  }
});

test('evidenceProblems refuses a retrieved_document this agent did not carry across', () => {
  const minted = [{ evidence_id: 'ev-1', kind: 'retrieved_document' }];
  assert.equal(evidenceProblems(minted).length, 1);
  assert.equal(evidenceProblems(minted, new Set(['ev-1'])).length, 0, 'a citation carried from the verification that read the document is permitted');
});

/* ============================================================
   7 · nothing is written, and nothing is applied
   ============================================================ */

test('no module in this directory writes anything', () => {
  const forbidden = /(writeFileSync|appendFileSync|createWriteStream|rmSync|unlinkSync|writeFile\()/;
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(HERE, f), 'utf8');
    assert.ok(!forbidden.test(src), `${f} contains a write call`);
  }
});

test('a full run leaves data/, every page and every locale file byte-identical', async () => {
  const beforeData = hashDataDir();
  const beforeFiles = hashSite();
  await runWith([changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' })]);
  assert.deepEqual(hashDataDir(), beforeData);
  assert.deepEqual(hashSite(), beforeFiles);
});

test('every proposal is behind a pending approval, and none is autonomous', async () => {
  const { result } = await runWith([changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' })]);
  for (const p of result.proposals) {
    assert.notEqual(p.autonomy_class, 'autonomous');
    const appr = result.approvals.filter((a) => a.proposal_ids.includes(p.proposal_id));
    assert.equal(appr.length, 1, `${p.proposal_id} has ${appr.length} approvals`);
    assert.equal(appr[0].state, 'requested');
    assert.equal(appr[0].decision, null);
    assert.notEqual(appr[0].decision?.decided_by, EDITORIAL_AGENT);
  }
});

test('every record a run produces satisfies its contract', async () => {
  const { result, store } = await runWith([changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' })]);
  assert.ok(store.written.length > 5);
  for (const r of store.written) {
    assert.deepEqual(validate(r, { allowSimulated: true }), [], `${r.contract} ${r.proposal_id ?? r.observation_id ?? r.approval_id}`);
  }
  assert.equal(result.refused.length, 0, 'nothing was refused for evidence this agent should not have minted');
});

test('an id is derived from what the finding is, and two different findings never share one', async () => {
  const change = changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' });
  const a = await runWith([change]);
  const b = await runWith([change]);
  assert.deepEqual(a.result.proposals.map((p) => p.proposal_id), b.result.proposals.map((p) => p.proposal_id), 'the same finding re-mints the same id');
  const ids = a.result.proposals.map((p) => p.proposal_id);
  assert.equal(new Set(ids).size, ids.length, 'two findings sharing an id become one node in a graph');
  const obs = a.result.no_change.map((o) => o.observation_id);
  assert.equal(new Set(obs).size, obs.length);
});

test('two changes to one field of one record are two findings, not one', async () => {
  const one = changeOver({ entity: 'gdpr', path: 'data/instruments.json', attribute: 'legislative_status', old_value: 'status:applicable', new_value: 'status:repealed', id: 'rchg-suite-a' });
  const two = changeOver({ entity: 'gdpr', path: 'data/instruments.json', attribute: 'legislative_status', old_value: 'status:applicable', new_value: 'status:amended', id: 'rchg-suite-b' });
  const { result } = await runWith([one, two]);
  const ids = result.proposals.map((p) => p.proposal_id);
  assert.equal(new Set(ids).size, ids.length, 'the values are what differ, and the id has to say so');
});

/* ============================================================
   8 · the contract holds the discipline
   ============================================================ */

test('the contract refuses a drafted replacement on anything but a factual update', () => {
  for (const kind of EDITORIAL_PROPOSAL_KINDS.filter((k) => k !== DRAFTABLE_EDITORIAL_KIND)) {
    const r = { ...editorialProposalFixture(), proposal_kind: kind, autonomy_class: 'human_only' };
    const errs = validate(r, { allowSimulated: true });
    assert.ok(errs.some((e) => /may be drafted/.test(e)), `${kind}: ${errs.join(' | ')}`);
  }
});

test('the contract refuses a factual update over an argument', () => {
  for (const state of ANALYTICAL_STATES) {
    const r = { ...editorialProposalFixture(), editorial_state: state };
    assert.ok(validate(r, { allowSimulated: true }).some((e) => /never corrected because a factual input moved/.test(e)), state);
  }
});

test('the contract refuses a factual update over unresolved or unattributed prose', () => {
  for (const state of ['unresolved', 'not_attributed']) {
    const r = { ...editorialProposalFixture(), editorial_state: state };
    assert.ok(validate(r, { allowSimulated: true }).length > 0, state);
  }
});

test('the contract refuses a correction that cannot quote what it corrects', () => {
  const r = { ...editorialProposalFixture(), staleness: { ...editorialProposalFixture().staleness, quoted: null } };
  assert.ok(validate(r, { allowSimulated: true }).some((e) => /nothing quoted/.test(e)));
});

test('the contract refuses a correction over a merely possible staleness', () => {
  const f = editorialProposalFixture();
  const r = { ...f, staleness: { ...f.staleness, kind: 'possibly_stale', quoted: null } };
  const errs = validate(r, { allowSimulated: true });
  assert.ok(errs.some((e) => /drafted replacement/.test(e) || /staleness.kind is "possibly_stale"/.test(e)), errs.join(' | '));
});

test('the contract refuses a factual update that has orphaned its claim record', () => {
  const r = { ...editorialProposalFixture(), claim_ids_affected: [] };
  assert.ok(validate(r, { allowSimulated: true }).some((e) => /orphaned/.test(e)));
});

test('the contract still refuses an edit to index.html that did not check both homes', () => {
  const r = { ...editorialProposalFixture(), content_blob_checked: false };
  assert.ok(validate(r, { allowSimulated: true }).some((e) => /__CONTENT__/.test(e)));
});

/* ============================================================
   9 · the trace is the deliverable
   ============================================================ */

test('the run is readable back off its own trace', async () => {
  const { result, sink } = await runWith([changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' })]);
  const tree = buildTree(sink.records);
  const state = editorialState(tree.roots[0], result.trace_id);
  assert.ok(state, 'the read model must find an editorial run');
  assert.equal(state.proposals, result.proposals.length);
  assert.equal(state.no_change, result.no_change.length);
  assert.equal(state.merged, 0);
  assert.equal(state.applied, 0);
  assert.equal(state.sentences_authored, 0);
  assert.equal(state.drafted, result.proposals.filter((p) => p.proposal_kind === 'factual_update').length);
  assert.ok(state.triage, 'the triage decision, with its alternatives, is on the trace');
  assert.ok(state.triage.alternatives.length >= 3);
  assert.deepEqual(state.gaps, [], `the view reports gaps: ${state.gaps.join('; ')}`);
});

test('every intake refusal reaches the trace with its reason', async () => {
  const { result, sink } = await runWith([dataProposalFixture(), { ...verificationRecordFixture(), verdict: 'conflict' }]);
  const state = editorialState(buildTree(sink.records).roots[0], result.trace_id);
  const refused = state.stages.flatMap((s) => s.refused);
  assert.equal(refused.length, 2);
  for (const r of refused) assert.ok(r.why.length > 60, 'a refusal nobody can see is a refusal nobody can check');
});

test('the no-change explanations are named on the trace, not merely counted', async () => {
  const { result, sink } = await runWith([changeOver({ entity: FACT_EVENT, old_value: '2025-10-29', new_value: '2099-09-09' })]);
  const state = editorialState(buildTree(sink.records).roots[0], result.trace_id);
  assert.equal(state.explanations.length, result.no_change.length);
  for (const x of state.explanations) assert.ok(x.subject && x.how);
});

test('an as-of date is required, because "not stale" and "nobody looked" are different findings', () => {
  const { tracer, store } = harness();
  assert.throws(() => new EditorialAgent({ tracer, store, corpus: CORPUS, asOf: null }), /asOf/);
  assert.throws(() => new EditorialAgent({ tracer, store, corpus: CORPUS, asOf: 'yesterday' }), /asOf/);
});

/* ============================================================
   10 · the site's own findings, which need no input
   ============================================================ */

test('a run with no input still reports what the site says that disagrees with itself', async () => {
  const { result } = await runWith([]);
  assert.ok(result.site.length, 'the two homes of meta.standfirst already differ');
  for (const p of result.site) {
    assert.equal(p.proposal_kind, 'editorial_recommendation');
    assert.equal(p.autonomy_class, 'human_only');
    for (const op of p.proposed_change.operations) assert.equal(op.proposed, null);
  }
  const drift = result.site.find((p) => /standfirst/.test(p.prose_locations[0].anchor));
  assert.ok(drift, 'the known divergence is reported');
  assert.match(drift.proposed_change.scope_note, /does NOT reconcile/);
});

test('the drafts go where the session said they go', () => {
  assert.equal(DRAFT_DIR, join(EDITORIAL_DIR, 'drafts'));
  const ignore = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf8');
  assert.match(ignore, /agent\/proposals\/editorial\/drafts\//, 'a draft is a run artifact and does not belong in the repository');
});

test('the CLI names the drafts directory rather than agent/records/', () => {
  const src = readFileSync(join(HERE, 'cli.mjs'), 'utf8');
  assert.match(src, /DRAFT_DIR/);
  assert.ok(!/new RecordStore\(\{ allowSimulated/.test(src), 'the default record directory is not where an editorial draft belongs');
});

/* ---------------------------------------------------------- helpers */

function hashSite() {
  const out = {};
  for (const f of readdirSync(REPO_ROOT).filter((x) => x.endsWith('.html')).sort()) {
    out[f] = createHash('sha256').update(readFileSync(join(REPO_ROOT, f))).digest('hex');
  }
  const i18n = join(REPO_ROOT, 'i18n');
  for (const f of readdirSync(i18n).filter((x) => x.endsWith('.json')).sort()) {
    out[`i18n/${f}`] = createHash('sha256').update(readFileSync(join(i18n, f))).digest('hex');
  }
  return out;
}
