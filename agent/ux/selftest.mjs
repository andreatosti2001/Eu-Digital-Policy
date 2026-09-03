/* ============================================================
   agent/ux/selftest.mjs — Agent 8's suite

   Run:  node --test agent/ux/selftest.mjs

   What it holds this agent to, in the order the risks matter:

     · IT NEVER WRITES AND IT NEVER DRAFTS. No write call in any
       module here; data/, every page and every stylesheet are
       byte-identical before and after a full run against the real
       site; and every operation on every record carries a NULL
       `proposed`, on a finding and on a testable proposal alike.
       SESSION 16's brief is that the agent observes and proposes
       and does not redesign the site, and this is what makes that
       a mechanism rather than an intention.
     · IT NEVER CLAIMS AN OBSERVATION NOBODY MADE. Nothing here has
       a browser and no screen reader has ever been run against this
       site. Every record carries README limitation 7 as a blocking
       open question, quoted whole; every record's accessibility
       block is four falses; and a finding phrased as though
       somebody had looked is refused at the boundary.
     · A FINDING QUOTES BYTES AT A LINE. The easiest thing to
       fabricate in a UX audit is a confident sentence about how a
       page feels. Every finding this agent reports stands on
       `repository_file` evidence with a quote and a file:line
       locator, and one that does not is set aside.
     · IT DOES NOT RE-REPORT ANOTHER AGENT'S FINDING. A record, a
       shape, a sentence and a structural markup defect each belong
       to somebody, and `boundary.mjs` routes them.
     · SEVERITY IS DERIVED AND `critical` MEANS ONE THING. The
       absence gate is the only route to it; three ordinary
       escalations reach `high` and stop.
     · SESSION 17 INVENTS NO TOKEN. Every custom property a
       proposal names is one a stylesheet already declares, no
       proposal adds one, and every browser test says a person runs
       it because there is no harness here.
     · TEN QUESTIONS ARE ALL ASKED, of the real site rather than of
       a fixture — which is what makes the "no" from question 3 a
       result rather than an untested branch.

   The site is the real one throughout, deliberately. A fixture
   would let a lens pass while being wrong about the file it exists
   to read.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../observability/tracer.mjs';
import { MemorySink } from '../observability/sink.mjs';
import { deterministicIds, deterministicClock } from '../observability/ids.mjs';
import { MemoryRecordStore } from '../scout/store.mjs';
import { hashDataDir } from '../integrate/canonical.mjs';
import { validate } from '../schemas/validate.mjs';
import { buildTree, uxState } from '../observability/query.mjs';
import { UX_FINDING_CLASSES, UX_SEVERITIES, UX_SEVERITY_RANK } from '../schemas/types.mjs';

import { readSurface, rulesOf, stateSelectorsOf, moduleGraphOf, absenceFieldsOf, manualChecksOf, REPO_ROOT, SHEETS, NON_COLOUR_CHANNELS } from './surface.mjs';
import { journeysOf, journeyFor, navModelOf, JOURNEY_STAKES } from './journeys.mjs';
import { LENSES, carriesItsWord, elementsWith, isOperable, paintedClassOf, contractRegion } from './lenses.mjs';
import { partition, ownershipOf, standingOf, unverifiablePhrasing, alreadyChecked, evidenceProblems, ALLOWED_EVIDENCE_KINDS, NOT_OURS } from './boundary.mjs';
import { severityOf, backlogOf, CLASS_FLOOR, NON_DEFECT_CEILING, HIGH_PRIORITY, isHighPriority } from './severity.mjs';
import { tokensExist, tokensIn, statusVocabulary } from './tokens.mjs';
import { RECIPES, NO_HARNESS } from './proposals.mjs';
import { UXAuditor, UX_AGENT, UX_VALIDATORS, MAX_EVIDENCE, uniqueFiles, riskOf } from './auditor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const AS_OF = '2026-09-03';

/* One surface read and one full run, shared. */
const SURFACE = readSurface();
const JOURNEYS = journeysOf(SURFACE);

function harness() {
  const sink = new MemorySink({ strict: true });
  const tracer = new Tracer({
    service: 'test',
    sink,
    ids: deterministicIds(23),
    clock: deterministicClock('2026-09-03T09:00:00.000Z', 100),
    attributes: { agent: UX_AGENT },
  });
  const store = new MemoryRecordStore({ allowSimulated: false });
  return { tracer, store, sink };
}

const auditor = (over = {}) => {
  const { tracer, store, sink } = harness();
  return { it: new UXAuditor({ tracer, store, surface: SURFACE, asOf: AS_OF, ...over }), store, sink, tracer };
};

/** The interface's own fingerprint. `data/` is not enough here: this
 *  is the first agent whose SUBJECT is the pages and the sheets. */
function hashInterface() {
  const files = [
    ...readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html')),
    ...SHEETS.filter((f) => existsSync(join(REPO_ROOT, f))),
  ].sort();
  const out = {};
  for (const f of files) out[f] = createHash('sha256').update(readFileSync(join(REPO_ROOT, f))).digest('hex');
  return out;
}

const DATA_BEFORE = hashDataDir();
const UI_BEFORE = hashInterface();
const { it: RUNNER, store: RUN_STORE, sink: RUN_SINK } = auditor({ propose: true });
const RESULT = await RUNNER.run();
const DATA_AFTER = hashDataDir();
const UI_AFTER = hashInterface();

const FINDINGS = RESULT.proposals;
const TESTABLE = RESULT.testable;
const ALL = [...FINDINGS, ...TESTABLE];

/* ============================================================
   Nothing is written, nothing is drafted
   ============================================================ */

test('a full run leaves every file in data/ byte-identical', () => {
  assert.deepEqual(DATA_AFTER, DATA_BEFORE, 'a UX audit changed a canonical dataset. It has no code path that should be able to.');
});

test('a full run leaves every page and every stylesheet byte-identical', () => {
  assert.deepEqual(UI_AFTER, UI_BEFORE, 'a UX audit changed a page or a stylesheet — the files it exists to read.');
  assert.ok(Object.keys(UI_AFTER).length >= 11, 'the fingerprint should cover seven pages and four stylesheets');
});

test('no module in agent/ux/ contains a write call', () => {
  const forbidden = ['writeFileSync', 'appendFileSync', 'createWriteStream', 'rmSync', 'unlinkSync', 'mkdirSync', 'writeFile(', 'rename('];
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(HERE, f), 'utf8');
    /* Comments are stripped so the modules can go on discussing
       writes at length without tripping their own check. */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    for (const call of forbidden) {
      assert.ok(!code.includes(call), `${f} contains ${call} — this agent reads and proposes, and writes nothing`);
    }
  }
});

test('every operation on every record carries a null `proposed` — nothing is drafted', () => {
  /* THE CENTRAL REFUSAL, and it holds for a testable proposal as
     well as for a finding. SESSION 16: the agent does not redesign
     the website. SESSION 17: do not implement proposals in this
     session. A drafted stylesheet in either would be an agent
     deciding what a production site about EU law looks like. */
  assert.ok(ALL.length, 'the run produced no records to check');
  for (const r of ALL) {
    for (const op of r.proposed_change.operations) {
      assert.equal(op.proposed, null, `${r.proposal_id} (${r.proposal_kind}) drafts a value for ${op.target}`);
    }
  }
});

test('no record adds a design token, and every token it names is one a stylesheet declares', () => {
  for (const r of ALL) {
    assert.deepEqual(r.tokens_added, [], `${r.proposal_id} adds a design token; SESSION 17's rule is that a proposal uses the existing design system`);
    const check = tokensExist(r, SURFACE.tokens);
    assert.ok(check.ok, `${r.proposal_id} ${check.why ?? ''}`);
  }
});

test('every record is human_only or review_required, and none is autonomous', () => {
  for (const r of ALL) {
    assert.notEqual(r.autonomy_class, 'autonomous', `${r.proposal_id} is autonomous: nothing an agent proposes about this interface applies itself`);
  }
  for (const r of FINDINGS) {
    assert.equal(r.autonomy_class, 'human_only', `${r.proposal_id} is a finding and is not human_only`);
  }
});

/* ============================================================
   Nothing here opened a page
   ============================================================ */

test('every record carries README limitation 7 as a blocking open question, quoted whole', () => {
  const lim = SURFACE.readme_limitation;
  assert.ok(lim, 'README limitation 7 could not be located; every record depends on quoting it');
  assert.match(lim.quote, /screen reader/i);
  assert.match(lim.quote, /Chromium only/i, 'the limitation was quoted to the line break rather than whole — half of it reads as a smaller admission than the author made');
  for (const r of ALL) {
    const entry = (r.epistemic.unresolved ?? []).find((u) => /screen reader|browser|phone/i.test(`${u.question} ${u.missing}`));
    assert.ok(entry, `${r.proposal_id} does not say that nothing opened a page`);
    assert.equal(entry.blocks, true, `${r.proposal_id}'s limitation does not block: a reviewer must be told before acting on it`);
    assert.ok(entry.missing.includes(lim.quote) || entry.missing.includes('Nothing here opened a page'), `${r.proposal_id} paraphrases the limitation instead of quoting it`);
  }
});

test('every record says contrast was not computed rather than omitting it', () => {
  for (const r of ALL) {
    assert.equal(r.accessibility.contrast_checked, false, `${r.proposal_id} claims contrast was checked; nothing here resolves a custom property`);
    const entry = (r.epistemic.unresolved ?? []).find((u) => /contrast/i.test(`${u.question} ${u.missing}`));
    assert.ok(entry, `${r.proposal_id} did not check contrast and no unresolved entry says so`);
  }
});

test('no record claims a screen reader, a browser or a device was used', () => {
  for (const r of ALL) {
    assert.equal(r.accessibility.screen_reader_checked, false, `${r.proposal_id} claims a screen reader was used; README limitation 7 says none ever has`);
    assert.equal(r.accessibility.keyboard_reachable, false);
    assert.equal(r.accessibility.accessible_name, false);
    assert.ok(r.accessibility.note, `${r.proposal_id} has four falses and no note saying what that means`);
  }
});

test('a finding written as though somebody had looked at a rendered page is refused', () => {
  const bad = { about: 'interface', subject: 'invented', problem: 'Screen readers announce this as an empty group.', evidence: [{ file: 'a', line: 1, quote: 'x', locator: 'a:1' }] };
  const out = partition([bad], { designQa: SURFACE.design_qa });
  assert.equal(out.reported.length, 0);
  assert.match(out.aside[0].why, /README limitation 7/);
  const phrase = unverifiablePhrasing(bad);
  assert.equal(phrase.claims, true);
  assert.match(phrase.phrase, /[Ss]creen reader/);
});

test('every browser test on a testable proposal says a person runs it', () => {
  for (const r of TESTABLE) {
    assert.ok(r.browser_tests.length, `${r.proposal_id} is a testable proposal with no browser test`);
    for (const t of r.browser_tests) {
      if (t.harness !== NO_HARNESS) {
        assert.match(String(t.harness), /^tools\//, `${r.proposal_id} names a harness "${t.harness}" that is not a script in tools/; this repository has no browser runner`);
      }
    }
  }
});

/* ============================================================
   A finding quotes bytes at a line
   ============================================================ */

test('every finding stands on repository_file evidence with a quote and a file:line locator', () => {
  for (const r of ALL) {
    assert.ok(r.evidence.length, `${r.proposal_id} stands on nothing`);
    const files = r.evidence.filter((e) => e.kind === 'repository_file');
    assert.ok(files.length, `${r.proposal_id} carries no repository_file evidence`);
    for (const e of files) {
      assert.ok(e.quote && e.quote.trim().length, `${r.proposal_id} evidence ${e.evidence_id} quotes nothing`);
      assert.match(e.locator, /^[^:]+:\d+$/, `${r.proposal_id} evidence ${e.evidence_id} has locator "${e.locator}", which is not a file at a line`);
    }
  }
});

test('a count is filed as a measurement, never as a quoted extract', () => {
  /* "No page links to this one" is not a string in any file. Filing
     it as a repository_file quote would be a fabricated quote behind
     a checkable-looking locator, and the byte-check below is what
     found the two lenses that were doing it. */
  for (const r of ALL) {
    for (const e of r.evidence.filter((x) => x.kind === 'measurement')) {
      assert.match(e.locator, /^counted over /, `${r.proposal_id} measurement ${e.evidence_id} does not say what it counted over`);
      assert.ok(e.quote && e.quote.length > 10, `${r.proposal_id} measurement ${e.evidence_id} states no result`);
    }
  }
});

test('no record stands on a retrieved document', () => {
  for (const r of ALL) {
    for (const e of r.evidence) {
      assert.notEqual(e.kind, 'retrieved_document', `${r.proposal_id} cites a retrieved document; no agent in this repository has ever retrieved one`);
      assert.ok(ALLOWED_EVIDENCE_KINDS.has(e.kind) || e.kind === 'agent_output', `${r.proposal_id} cites a ${e.kind}`);
    }
    assert.deepEqual(evidenceProblems(r.evidence), []);
  }
});

test('every quoted extract is actually in the file it names, at the line it names', () => {
  /* THE CHECK THAT MAKES A QUOTE A QUOTE. An evidence entry whose
     text is not in the file is a fabrication with a locator on it,
     and it would pass every other test here. */
  let checked = 0;
  for (const r of ALL) {
    for (const e of r.evidence.filter((x) => x.kind === 'repository_file')) {
      const [file] = e.locator.split(':');
      const path = join(REPO_ROOT, file);
      if (!existsSync(path)) { assert.fail(`${r.proposal_id} cites ${file}, which does not exist`); }
      const src = readFileSync(path, 'utf8');
      /* Quotes are normalised for whitespace and clipped, and a
         composed line (a selector plus its declarations) is
         assembled rather than lifted — so the test is that a
         distinctive run of it is present, not that the whole string
         is. Twenty characters is long enough not to match by
         accident in 200 KB of markup. */
      const flat = src.replace(/\s+/g, ' ');
      const needle = e.quote.replace(/\s+/g, ' ').replace(/…$/, '').slice(0, 40);
      if (needle.length < 20) continue;
      checked++;
      const parts = needle.split(/[{};]/).map((x) => x.trim()).filter((x) => x.length >= 20);
      const found = flat.includes(needle) || parts.some((x) => flat.includes(x));
      assert.ok(found, `${r.proposal_id} quotes "${needle}" from ${file}, and it is not there`);
    }
  }
  assert.ok(checked > 10, `only ${checked} quotes were long enough to check; the audit is not standing on much`);
});

test('a finding that quotes nothing, or locates nothing, is set aside with the reason', () => {
  const noQuote = { about: 'interface', subject: 'a feeling', evidence: [{ file: 'style.css', line: 1, quote: '', locator: 'style.css:1' }] };
  const noLine = { about: 'interface', subject: 'somewhere', evidence: [{ file: 'style.css', quote: 'x', locator: 'style.css' }] };
  assert.equal(standingOf(noQuote).standing, false);
  assert.match(standingOf(noQuote).why, /opinion about how a page feels/);
  assert.equal(standingOf(noLine).standing, false);
  assert.match(standingOf(noLine).why, /not a locator a reviewer can check/);
});

/* ============================================================
   It does not re-report another agent's finding
   ============================================================ */

test('a finding about a record, a shape or a sentence is routed to the agent that owns it', () => {
  for (const [about, route] of [['record', 'data_depth'], ['shape', 'architect'], ['sentence', 'editorial'], ['structure', 'design_qa']]) {
    const own = ownershipOf({ about });
    assert.equal(own.ours, false, `a finding about a ${about} was claimed by this agent`);
    assert.equal(own.route, route);
    assert.ok(NOT_OURS[route], `no reason recorded for routing to ${route}`);
  }
  assert.equal(ownershipOf({ about: 'interface' }).ours, true);
});

test('a finding that does not say what it is about is refused rather than guessed at', () => {
  const own = ownershipOf({ subject: 'something' });
  assert.equal(own.ours, false);
  assert.match(own.why, /cannot be placed/);
});

test('a finding naming a design-qa check that exists is set aside; one naming a check that does not is flagged', () => {
  const real = SURFACE.design_qa.checks.find((c) => /alt/.test(c)) ?? SURFACE.design_qa.checks[0];
  assert.ok(real, 'design-qa.mjs states no checks in its header; the overlap test has nothing to read');
  const hit = alreadyChecked({ design_qa_overlap: real.slice(0, 12) }, SURFACE.design_qa);
  assert.equal(hit.overlaps, true);
  const miss = alreadyChecked({ design_qa_overlap: 'a check design-qa does not have' }, SURFACE.design_qa);
  assert.equal(miss.overlaps, false);
  assert.match(miss.why, /the overlap claim is wrong/);
});

test('no reported finding duplicates the architecture or editorial finding about the __CONTENT__ blob', () => {
  /* The duplication between index.html's inline blob and
     data/brief.json has two homes already, both behind pending
     approvals. Question 9 measures what it COSTS and says in its own
     scope note that it re-reports nothing. */
  const q9 = FINDINGS.filter((r) => /front door/.test(r.proposed_change.summary + r.reason));
  for (const r of q9) {
    assert.match(r.proposed_change.scope_note, /does not re-report the duplication|has two homes/, `${r.proposal_id} does not say it is not re-reporting the duplication`);
  }
});

/* ============================================================
   Severity is derived, and `critical` means one thing
   ============================================================ */

test('the absence gate is the only route to critical', () => {
  const gated = severityOf({ finding_class: 'usability_defect', stake: 'comprehension', spread: 1, misreads_absence: true });
  assert.equal(gated.severity, 'critical');
  assert.equal(gated.gated, true);
  /* Everything the model can do at once, without the gate. */
  const stacked = severityOf({ finding_class: 'accessibility_defect', stake: 'legal_consequence', spread: 99, blocks_journey: true });
  assert.equal(stacked.severity, 'high', 'three escalations reached critical; critical is reserved for the gate');
  assert.equal(stacked.gated, false);
  assert.equal(stacked.ceilinged, true);
});

test('an enhancement never outranks a defect', () => {
  const e = severityOf({ finding_class: 'enhancement', stake: 'legal_consequence', spread: 99, blocks_journey: true });
  assert.equal(UX_SEVERITY_RANK[e.severity] >= UX_SEVERITY_RANK[NON_DEFECT_CEILING], true);
  assert.equal(e.capped, true);
  for (const r of ALL) {
    if (r.finding_class !== 'enhancement') continue;
    assert.ok(!['critical', 'high'].includes(r.severity), `${r.proposal_id} is an enhancement at ${r.severity}`);
  }
});

test('every class has a floor and every severity it produces is one of the four', () => {
  for (const c of UX_FINDING_CLASSES) {
    assert.ok(CLASS_FLOOR[c], `no floor recorded for ${c}`);
    const s = severityOf({ finding_class: c, stake: 'comprehension', spread: 1 });
    assert.ok(UX_SEVERITIES.includes(s.severity));
    assert.ok(s.steps.length, `${c} produced a severity with no working`);
  }
});

test('every record carries the steps that produced its severity', () => {
  for (const r of ALL) {
    const inf = (r.epistemic.inference ?? []).find((i) => i.field === 'severity');
    assert.ok(inf, `${r.proposal_id} carries a severity with nothing saying how it was reached`);
    assert.ok(inf.method && inf.method.length > 20, `${r.proposal_id}'s severity method is "it follows"`);
  }
});

test('the backlog is a total order and two runs produce the same one', async () => {
  const { it: second } = auditor({ propose: true });
  const again = await second.run();
  assert.deepEqual(
    again.backlog.map((f) => [f.rank, f.severity, f.subject]),
    RESULT.backlog.map((f) => [f.rank, f.severity, f.subject]),
    'two runs over an unchanged site produced different backlogs; a diff between two runs would then mean nothing',
  );
  const ranks = RESULT.backlog.map((f) => f.rank);
  assert.deepEqual(ranks, ranks.slice().sort((a, b) => a - b));
  assert.equal(new Set(ranks).size, ranks.length, 'two findings share a rank');
});

test('the rank is derived and is stored on no record', () => {
  for (const r of ALL) {
    assert.equal('priority' in r, false, `${r.proposal_id} carries a priority field; the contract forbids one because a stored position is a second home for the ordering`);
    assert.equal('rank' in r, false);
  }
});

/* ============================================================
   The surface reader
   ============================================================ */

test('the CSS parser finds the rules a hand count finds, and keeps media conditions', () => {
  const css = 'a{color:red}@media (max-width:700px){b{display:none}c{color:blue}}d{color:green}';
  const rules = rulesOf('test.css', css);
  assert.equal(rules.length, 4);
  assert.deepEqual(rules.map((r) => r.selector), ['a', 'b', 'c', 'd']);
  assert.deepEqual(rules[1].at, ['@media (max-width:700px)']);
  assert.deepEqual(rules[3].at, [], 'a rule after a media block inherited the block\'s condition');
  assert.deepEqual(rules[0].declarations, [{ prop: 'color', value: 'red' }]);
});

test('a class is matched as a token, never as a substring', () => {
  /* The bug this exists for: `chrome-btn-word` is not
     `chrome-btn`, and a word-boundary match says it is. */
  const chromeBtn = elementsWith(SURFACE, 'chrome-btn');
  for (const e of chromeBtn) {
    const cls = String(e.attrs).match(/class[:=]\s*["']([^"']*)/);
    if (!cls) continue;
    assert.ok(cls[1].split(/\s+/).includes('chrome-btn'), `matched "${cls[1]}" for .chrome-btn`);
  }
  assert.equal(elementsWith(SURFACE, 'chrome-btn-word').every((e) => /chrome-btn-word/.test(e.attrs)), true);
});

test('all three element construction forms are read', () => {
  /* markup, the el() helper, and createElement + className. A lens
     that read one would report the other two as absent, and the
     second draft of question 3 reported the compliance dial's dots
     as unreachable because of exactly this. */
  assert.ok(elementsWith(SURFACE, 'gloss').some((e) => e.tag === 'button'), 'markup form not read');
  assert.ok(elementsWith(SURFACE, 'rota-dot').some((e) => e.tag === 'circle'), 'el() form not read');
  assert.ok(elementsWith(SURFACE, 'fn').some((e) => e.tag === 'button'), 'createElement form not read');
});

test('an element with a control role and a tabindex is operable in either attribute syntax', () => {
  assert.equal(isOperable({ tag: 'div', attrs: 'role="button" tabindex="0"' }).operable, true);
  assert.equal(isOperable({ tag: 'circle', attrs: "role: 'button', tabindex: '0'" }).operable, true, 'the el() helper syntax was not read');
  assert.equal(isOperable({ tag: 'div', attrs: 'class="x"' }).operable, false);
  assert.equal(isOperable({ tag: 'div', attrs: 'role="button"' }).operable, false, 'a role with no tabindex is named as a control and unreachable');
  assert.equal(isOperable({ tag: 'button', attrs: '' }).operable, true);
});

test('the module import graph resolves every import and hides no holes', () => {
  const graph = moduleGraphOf(SURFACE.pages, SURFACE.modules);
  assert.deepEqual(graph.unresolved, [], `an import could not be followed: every answer derived from the graph has a hole in it — ${JSON.stringify(graph.unresolved)}`);
  const front = graph.byPage.get('index.html');
  assert.ok(front.includes('js/evidence.js'), 'index.html runs js/evidence.js through js/main.js, and the graph did not follow it');
  assert.ok(front.length > 10, 'index.html names two scripts and runs many more; the graph stopped at the markup');
});

test('the link graph counts relative links only', () => {
  /* Every page carries its own absolute address as a canonical URL
     and in the og: tags. A graph that counted them would report
     every page as linking to itself and find the site well
     connected. */
  for (const p of SURFACE.pages) {
    for (const l of p.links) {
      assert.ok(!/^https?:/.test(l), `${p.page} counts an absolute URL "${l}" as navigation`);
      assert.ok(!l.includes(p.page) || p.page === 'index.html', `${p.page} counts a link to itself`);
    }
  }
});

test('the dataset absence census separates null, unknown and both', () => {
  const a = absenceFieldsOf();
  assert.ok(a.nullable.size > 10, 'no nullable field found in data/; question 6 has nothing to check against');
  assert.ok(a.unknownable.size >= 1, 'no field carries the "unknown" sentinel; the three states cannot be told apart');
  for (const f of a.both) {
    assert.ok(a.nullable.has(f) && a.unknownable.has(f), `${f} is in "both" and not in both`);
  }
});

test('the manual checklist is read from the skill rather than restated here', () => {
  const m = manualChecksOf();
  assert.ok(m.items.length >= 25, `only ${m.items.length} checklist items were read from ${m.path}`);
  assert.ok(m.sections.length >= 6);
  for (const i of m.items) {
    assert.ok(i.text.length > 10, `a checklist item was read as "${i.text}"`);
    assert.equal(i.path, '.agents/skills/ux-audit/references/manual-checks.md');
  }
  const src = readFileSync(join(HERE, 'lenses.mjs'), 'utf8');
  for (const i of m.items.slice(0, 8)) {
    assert.ok(!src.includes(i.text), `lenses.mjs restates the checklist item "${i.text.slice(0, 40)}"; it should read it`);
  }
});

/* ============================================================
   The journeys
   ============================================================ */

test('the journeys are read out of js/shell.js rather than written here', () => {
  const nav = navModelOf();
  const src = readFileSync(join(REPO_ROOT, 'js/shell.js'), 'utf8');
  const declared = (src.match(/\{\s*id:\s*'[^']+',\s*file:/g) ?? []).length;
  assert.equal(nav.entries.length, declared, 'the parsed nav model and the literal in js/shell.js disagree about how many destinations there are');
  assert.ok(nav.entries.length >= 5);
  for (const e of nav.entries) {
    assert.ok(src.includes(`file: '${e.file}'`), `${e.file} is not in the nav model in js/shell.js`);
  }
});

test('every journey names at least one page that exists, and a stake from the list', () => {
  const pages = new Set(SURFACE.pages.map((p) => p.page));
  for (const j of JOURNEYS) {
    assert.ok(j.pages.length, `${j.id} runs through no page`);
    for (const p of j.pages) assert.ok(pages.has(p), `${j.id} names a page "${p}" that does not exist`);
    assert.ok(JOURNEY_STAKES.includes(j.stake), `${j.id} has stake "${j.stake}"`);
  }
});

test('a finding that reaches every page is filed against the site, not the highest-stake journey', () => {
  /* Without this, every finding in a shared stylesheet is filed
     against the applicability tool — the journey with the most at
     stake and one every finding touches — and the field would say
     "this matters" rather than "this is where the reader meets it". */
  const all = SURFACE.pages.map((p) => p.page);
  const { journey, also_reaches } = journeyFor(JOURNEYS, { pages: all, modules: [] });
  assert.equal(journey.id, 'the_site');
  assert.equal(journey.stake, 'navigation');
  assert.ok(also_reaches.length, 'a site-wide finding reaches no journey at all');
  assert.ok(also_reaches.includes('applies'), 'the journeys it reaches are not recorded');
});

test('a finding confined to one page is filed against that page\'s journey', () => {
  const { journey } = journeyFor(JOURNEYS, { pages: ['applies.html'], modules: [] });
  assert.equal(journey.id, 'applies');
  assert.equal(journey.stake, 'legal_consequence');
});

test('every record names a journey that exists, with a reason for sitting on it', () => {
  const ids = new Set(JOURNEYS.map((j) => j.id));
  for (const r of ALL) {
    assert.ok(r.affected_journey, `${r.proposal_id} sits on no journey`);
    assert.ok(ids.has(r.affected_journey.id), `${r.proposal_id} names journey "${r.affected_journey.id}", which is not one`);
    assert.ok(r.affected_journey.why && r.affected_journey.why.length > 20, `${r.proposal_id} does not say why it sits on that journey`);
    assert.ok(r.affected_journey.pages.length);
  }
});

/* ============================================================
   The ten lenses
   ============================================================ */

test('all ten questions are asked, and each reports what it examined', () => {
  assert.equal(LENSES.length, 10);
  assert.deepEqual(RESULT.by_lens.map((l) => l.question), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const l of RESULT.by_lens) {
    assert.ok(l.examined > 0, `question ${l.question} examined nothing; "looked and found nothing" and "did not look" would be indistinguishable`);
    assert.ok(l.asks && l.why, `question ${l.question} does not say what it asks or why`);
  }
});

test('a question that found nothing is a result, and is recorded as one', () => {
  /* Question 3 finds nothing on this site today: every class the
     stylesheets declare pressable lands on an operable element. That
     zero is information and the suite asserts it is reachable rather
     than asserting the number. */
  const zero = RESULT.by_lens.filter((l) => l.reported === 0);
  assert.ok(zero.length, 'every lens found something, which means none of them can demonstrate a clean zero');
  for (const l of zero) assert.ok(l.examined > 0, `question ${l.question} reported nothing and examined nothing`);
  assert.deepEqual(RESULT.questions_answered_no, zero.map((l) => l.question));
});

test('every finding is one of the seven classes, and every class the run used is one of them', () => {
  for (const r of ALL) {
    assert.ok(UX_FINDING_CLASSES.includes(r.finding_class), `${r.proposal_id} is a "${r.finding_class}"`);
  }
});

test('a colour-only state whose element names its own state is not reported', () => {
  assert.equal(carriesItsWord("class=\"x\" data-v=\"' + slug + '\">' + esc(VERDICT[b].word) + '", ['yes']).answer, 'names_the_state');
  assert.equal(carriesItsWord("class=\"x\" data-g=\"' + k + '\">' + esc(g.label) + '", ['primary']).answer, 'names_the_state');
  assert.equal(carriesItsWord("class=\"x\" data-s=\"a\">' + list.length + '", ['applicable']).answer, 'names_something_else');
  /* MIXED IS UNDECIDABLE, not a finding. A container that renders a
     count and then a label renders both, and a check that stopped at
     the first `.length` reported the status band as carrying its
     meaning in hue. It does not. */
  assert.equal(carriesItsWord("class=\"x\" data-s=\"a\">' + list.length + '</span><span>' + esc(b.short) + '", ['applicable']).answer, 'undecidable');
});

test('a slug is matched against the word a reader sees', () => {
  /* `undet` is the state value and "Not determined" is the text. A
     check that compared only the slug reported the applicability
     badges as carrying their meaning in hue; they carry it in words. */
  assert.equal(carriesItsWord("class=\"ap-badge\" data-v=\"undet\">' + n + ' Not determined", ['undet']).answer, 'undecidable');
  assert.equal(carriesItsWord("class=\"x\" data-s=\"in-force\">In force", ['in-force']).answer, 'names_the_state');
});

test('a contract behaviour is tested inside its own implementation, not across the whole module', () => {
  const src = readFileSync(join(REPO_ROOT, 'app.js'), 'utf8');
  const region = contractRegion(src, ['eupolicy:theme'], 20);
  assert.ok(region.lines > 0 && region.lines < src.split('\n').length, 'the region is the whole module');
  /* app.js sets aria-pressed on the reading-lens buttons, 23 lines
     from the theme control and nothing to do with it. A module-wide
     test reported the theme toggle as exposing a state it does not. */
  assert.ok(src.includes('aria-pressed'), 'app.js no longer sets aria-pressed anywhere; this test is checking nothing');
  assert.ok(!region.text.includes('aria-pressed'), 'the theme control region reached the reading-lens buttons');
});

test('every finding names a page or a component, and names files that exist', () => {
  for (const r of ALL) {
    assert.ok(r.pages.length || r.components.length, `${r.proposal_id} names neither a page nor a component`);
    for (const p of r.pages) assert.ok(existsSync(join(REPO_ROOT, p)), `${r.proposal_id} names a page "${p}" that does not exist`);
    for (const e of r.affected_entities) {
      if (e.path) assert.ok(existsSync(join(REPO_ROOT, e.path)), `${r.proposal_id} names "${e.path}", which does not exist`);
    }
  }
});

test('every finding carries a success criterion that is not a restatement of the change', () => {
  for (const r of ALL) {
    assert.ok(r.success_criterion.length > 30, `${r.proposal_id}'s success criterion is "${r.success_criterion}"`);
    assert.notEqual(r.success_criterion.trim().toLowerCase(), r.proposed_change.summary.trim().toLowerCase());
  }
});

test('evidence is bounded and the count still describes the whole finding', () => {
  for (const r of ALL) {
    const files = r.evidence.filter((e) => e.kind === 'repository_file');
    assert.ok(files.length <= MAX_EVIDENCE, `${r.proposal_id} carries ${files.length} evidence entries, above the ${MAX_EVIDENCE} cap`);
  }
});

/* ============================================================
   The contract
   ============================================================ */

test('every record this run produced satisfies UXProposal or ApprovalRequest', () => {
  const records = RUN_STORE.written;
  assert.ok(records.length >= 20, `only ${records.length} records were stored`);
  for (const r of records) {
    const errs = validate(r, { allowSimulated: false });
    assert.deepEqual(errs, [], `${r.contract} ${r.proposal_id ?? r.approval_id}: ${errs.join('; ')}`);
  }
});

test('a finding never carries the testable half, and a testable proposal always does', () => {
  for (const r of FINDINGS) {
    assert.equal(r.proposal_kind, 'finding');
    assert.equal(r.hypothesis, null, `${r.proposal_id} is a finding with a hypothesis; a finding says what is wrong`);
    assert.deepEqual(r.success_metrics, []);
    assert.deepEqual(r.regression_risks, []);
    assert.deepEqual(r.accessibility_checks, []);
    assert.deepEqual(r.browser_tests, []);
  }
  for (const r of TESTABLE) {
    assert.equal(r.proposal_kind, 'testable_proposal');
    assert.ok(r.hypothesis && r.hypothesis.length > 40, `${r.proposal_id} has no hypothesis`);
    for (const k of ['success_metrics', 'regression_risks', 'accessibility_checks', 'browser_tests']) {
      assert.ok(r[k].length, `${r.proposal_id} has an empty ${k}`);
    }
  }
});

test('every proposal names all four validators, design-qa among them', () => {
  /* SESSION 17: "Every approved implementation must pass node
     tools/design-qa.mjs." */
  for (const r of ALL) {
    const cmds = r.validation_requirements.map((v) => v.command);
    for (const need of ['node tools/validate.mjs', 'node tools/i18n-audit.mjs', 'node tools/design-qa.mjs', 'node tools/freshness.mjs']) {
      assert.ok(cmds.includes(need), `${r.proposal_id} does not name ${need}`);
    }
    const qa = r.validation_requirements.find((v) => v.command === 'node tools/design-qa.mjs');
    assert.match(qa.expected, /5 warnings|five/i, 'the design-qa baseline is not carried on the proposal');
  }
});

test('the four validators carry this agent\'s reasons, not the data agent\'s', () => {
  const i18n = UX_VALIDATORS.find((v) => v.command === 'node tools/i18n-audit.mjs');
  assert.match(i18n.why, /MOST LIKELY TO FAIL/, 'the i18n reason was inherited from a data proposal, where it says the change touches no prose');
});

test('every proposal is behind a pending approval, and the agent approves none of its own', () => {
  const approvals = RUN_STORE.written.filter((r) => r.contract === 'ApprovalRequest');
  assert.equal(approvals.length, ALL.length, `${ALL.length} proposals and ${approvals.length} approvals`);
  for (const a of approvals) {
    assert.equal(a.state, 'requested', `${a.approval_id} is "${a.state}" inside the run that requested it`);
    assert.equal(a.decision, null);
    assert.ok(a.what_to_check.length >= 4, `${a.approval_id} asks a human to do ${a.what_to_check.length} things`);
    assert.ok(a.what_to_check.some((x) => /NOTHING OPENED A PAGE/.test(x)), `${a.approval_id} does not tell the reviewer that nothing was rendered`);
    assert.ok(!a.what_to_check.some((x) => /^please review/i.test(x)));
  }
});

test('the epistemic block keeps what was read apart from what was concluded', () => {
  for (const r of ALL) {
    assert.ok(r.epistemic.fact.length, `${r.proposal_id} states no fact`);
    for (const f of r.epistemic.fact) assert.ok(f.evidence_refs.length, `${r.proposal_id} states a fact citing nothing`);
    assert.ok(r.epistemic.inference.length, `${r.proposal_id} concludes nothing`);
    for (const i of r.epistemic.inference) assert.ok(i.method && i.method.length > 20, `${r.proposal_id} concludes something by "it follows"`);
    assert.ok(r.epistemic.unresolved.length >= 2, `${r.proposal_id} carries fewer than two open questions; the limitation and the contrast note are both mandatory`);
  }
});

test('the reader-experience claim is typed as an interpretation and attributed', () => {
  for (const r of FINDINGS) {
    const i = r.epistemic.interpretation.find((x) => x.field === 'proposed_change');
    assert.ok(i, `${r.proposal_id} presents a design judgement as a finding`);
    assert.equal(i.held_by, UX_AGENT);
    assert.ok(i.basis.length > 40);
  }
});

test('the hypothesis is typed as a contested interpretation, because nothing measured it', () => {
  for (const r of TESTABLE) {
    const i = r.epistemic.interpretation.find((x) => x.field === 'hypothesis');
    assert.ok(i, `${r.proposal_id} states a hypothesis with nothing saying it is one`);
    assert.equal(i.contested, true, `${r.proposal_id}'s hypothesis is not marked contested; there is no research here to settle it`);
    assert.match(i.basis, /no analytics|no telemetry|not measured/i);
  }
});

/* ============================================================
   SESSION 17 — the testable half
   ============================================================ */

test('a testable proposal is written for the high-priority findings and for nothing else', () => {
  const high = RESULT.backlog.filter(isHighPriority);
  const withRecipe = high.filter((f) => RECIPES[f.lens]);
  assert.equal(TESTABLE.length, withRecipe.length, 'a proposal was written for a finding that is not high priority, or one was missed');
  /* Matched through the recorded pairing rather than by guessing at
     an id: two findings can come from one lens — the dialog and the
     theme control both do — and a substring test on the lens name
     would say a proposal for one was a proposal for the other. */
  const answered = new Set(RESULT.answers.map((a) => a.finding_id));
  for (const f of RESULT.backlog.filter((x) => !isHighPriority(x))) {
    assert.ok(!answered.has(f.proposal_id), `a proposal was written for "${f.subject}", which is ${f.severity}`);
  }
  for (const f of withRecipe) {
    assert.ok(answered.has(f.proposal_id), `"${f.subject}" is high priority with a recipe and got no proposal`);
  }
  assert.deepEqual([...HIGH_PRIORITY].sort(), ['critical', 'high']);
});

test('a high-priority finding whose lens has no recipe is refused by name, not improvised', () => {
  /* THE FAILURE THIS FILE IS ARRANGED AGAINST. A hypothesis is a
     belief about a reader and this repository has no research to
     derive one from; an improvised one would be a fabrication
     wearing a proposal's shape. */
  const lenses = new Set(LENSES.map((l) => l.id));
  for (const id of Object.keys(RECIPES)) {
    assert.ok(lenses.has(id), `a recipe is recorded for "${id}", which is not a lens`);
  }
  const missing = RESULT.backlog.filter(isHighPriority).filter((f) => !RECIPES[f.lens]);
  for (const f of missing) {
    assert.ok(RESULT.refused.some((x) => x.what === f.subject && x.stage === 'recipe'), `"${f.subject}" is high priority, has no recipe, and was dropped silently`);
  }
});

test('every metric names how it would be measured, and none needs analytics this project does not have', () => {
  for (const r of TESTABLE) {
    for (const m of r.success_metrics) {
      assert.ok(m.how_measured.length > 10, `${r.proposal_id} has a metric with no method`);
      assert.ok(!/analytics|telemetry|conversion|bounce rate|session/i.test(m.how_measured), `${r.proposal_id} proposes measuring "${m.metric}" with something this project does not have`);
    }
    for (const c of r.accessibility_checks) assert.ok(c.check && c.how, `${r.proposal_id} has an accessibility check with no method`);
    for (const g of r.regression_risks) assert.ok(g.risk && g.watch, `${r.proposal_id} has a regression risk nobody is watching`);
    for (const t of r.browser_tests) {
      assert.ok(t.steps.length, `${r.proposal_id} has a browser test with no steps`);
      assert.ok(t.expected.length > 5);
    }
  }
});

test('a proposal is amber only where no reader would meet the change', () => {
  /* The first draft derived amber from "the operation targets
     tools/", which made a change that regenerates seven published
     pages reviewable rather than the author's. `reader_visible` is
     the recipe's own judgement and is recorded per recipe. */
  for (const [id, recipe] of Object.entries(RECIPES)) {
    assert.equal(typeof recipe({ evidence: [], pages: [], modules: [], problem: 'x', why_it_matters: 'y', success_criterion: 'z', severity: 'high' }, SURFACE).change.reader_visible, 'boolean',
      `the recipe for "${id}" does not say whether a reader would meet the change`);
  }
  for (const r of TESTABLE) {
    if (r.autonomy_class !== 'review_required') continue;
    for (const op of r.proposed_change.operations) {
      assert.match(String(op.target), /^tools\//, `${r.proposal_id} is review_required and touches ${op.target}`);
    }
  }
});

test('a proposal naming a token no stylesheet declares is refused', () => {
  const check = tokensExist({ tokens_used: ['--ink-0', '--invented-by-an-agent'] }, SURFACE.tokens);
  assert.equal(check.ok, false);
  assert.deepEqual(check.unknown, ['--invented-by-an-agent']);
  assert.match(check.why, /existing design system/);
  assert.equal(tokensExist({ tokens_used: ['--ink-0'] }, SURFACE.tokens).ok, true);
});

test('the status vocabulary a proposal may point at is read from the stylesheet', () => {
  const v = statusVocabulary(SURFACE);
  assert.ok(v.glyphs.length >= 6, `only ${v.glyphs.length} status glyphs found; the design system's own answer to "not hue alone" could not be read`);
  assert.ok(v.borders.length >= 2);
  assert.equal(v.home, 'css/tokens.css');
  for (const g of v.glyphs) assert.ok(g.state && g.glyph, 'a glyph rule was read with no state or no glyph');
});

test('the tokens a proposal declares are read off the rules it would change', () => {
  const named = tokensIn('a{color:var(--ink-0);border:1px solid var(--line)}', SURFACE.tokens);
  assert.deepEqual(named, ['--ink-0', '--line']);
  assert.deepEqual(tokensIn('a{color:var(--not-a-real-token)}', SURFACE.tokens), [], 'a token nothing declares was harvested as a dependency');
});

/* ============================================================
   Observability
   ============================================================ */

test('the run is on the trace, and the read model reports no gap', () => {
  const tree = buildTree(RUN_SINK.records).roots[0];
  const state = uxState(tree, RESULT.trace_id);
  assert.ok(state, 'the read model found no UX audit on a trace that is one');
  assert.deepEqual(state.gaps, [], `the view reports gaps: ${state.gaps.join('; ')}`);
  assert.equal(state.findings, FINDINGS.length);
  assert.equal(state.testable_proposals, TESTABLE.length);
  assert.equal(state.applied, 0);
  assert.equal(state.stylesheets_written, 0);
  assert.equal(state.pages_opened, 0);
  assert.equal(state.tokens_invented, 0);
  assert.equal(state.pending_approvals, ALL.length);
  assert.equal(state.lenses.length, LENSES.length);
});

test('the view reports a gap when a run claims to have opened a page or written a stylesheet', () => {
  /* The check exists because it is the one claim that would make
     this agent's whole output untrustworthy, and a view that could
     not see it would let the claim through. */
  const root = buildTree(RUN_SINK.records).roots[0];
  const forged = JSON.parse(JSON.stringify(root));
  (function walk(s) {
    for (const e of s.events ?? []) {
      if (e.type === 'observation' && String(e.summary).startsWith('NOTHING RESTYLED')) {
        e.pages_opened = 3; e.stylesheets_written = 1; e.tokens_invented = 2;
        if (e.data) { e.data.pages_opened = 3; e.data.stylesheets_written = 1; e.data.tokens_invented = 2; }
      }
    }
    for (const c of s.children ?? []) walk(c);
  })(forged);
  const state = uxState(forged, RESULT.trace_id);
  assert.ok(state.gaps.some((g) => /opening 3 page/.test(g)), 'a run claiming to have opened a page passed the view');
  assert.ok(state.gaps.some((g) => /stylesheet/.test(g)));
  assert.ok(state.gaps.some((g) => /design token/.test(g)));
});

test('every open question is on the trace with what would close it', () => {
  const tree = buildTree(RUN_SINK.records).roots[0];
  const state = uxState(tree, RESULT.trace_id);
  assert.equal(state.open_questions, RESULT.questions.length);
  assert.ok(state.open_questions > 0, 'an audit that could settle everything from the source has overstated itself; nothing here opened a page');
  for (const q of state.open_questions_named) {
    assert.ok(q.missing && q.missing.length > 20, `open question "${q.subject}" does not say what would close it`);
  }
});

test('the ordering decision is on the trace with the alternatives it did not take', () => {
  const tree = buildTree(RUN_SINK.records).roots[0];
  const state = uxState(tree, RESULT.trace_id);
  assert.ok(state.ordering, 'the backlog was ranked and the trace does not say how');
  assert.ok(state.ordering.alternatives.length >= 3, 'the ordering decision records no alternative');
  assert.ok(state.ordering.alternatives.some((a) => /priority field|second home/.test(a)));
});

test('the backlog on the trace is the backlog the run produced', () => {
  const tree = buildTree(RUN_SINK.records).roots[0];
  const state = uxState(tree, RESULT.trace_id);
  assert.deepEqual(state.backlog.map((e) => e.rank), RESULT.backlog.map((f) => f.rank));
  assert.deepEqual(state.backlog.map((e) => e.subject), RESULT.backlog.map((f) => f.subject));
  for (const e of state.backlog) assert.ok(e.success_criterion, `backlog entry ${e.rank} carries no success criterion`);
});

/* ============================================================
   The refusals that are not negotiable
   ============================================================ */

test('an as-of date is required', () => {
  const { tracer, store } = harness();
  assert.throws(() => new UXAuditor({ tracer, store, surface: SURFACE }), /asOf/);
  assert.throws(() => new UXAuditor({ tracer, store, surface: SURFACE, asOf: 'yesterday' }), /YYYY-MM-DD/);
});

test('risk and severity are different axes and are not blended', () => {
  /* Severity is how bad it is for a reader; risk is what it costs if
     the FINDING is wrong. A model that blended them would produce a
     number that is neither. */
  const enh = riskOf({ finding_class: 'enhancement', stake: 'legal_consequence' });
  assert.equal(enh, 'low');
  assert.equal(riskOf({ finding_class: 'accessibility_defect', stake: 'legal_consequence' }), 'medium');
  assert.equal(riskOf({ finding_class: 'accessibility_defect', stake: 'navigation' }), 'low');
  const critical = ALL.filter((r) => r.severity === 'critical');
  for (const r of critical) assert.notEqual(r.risk, 'critical', `${r.proposal_id} copied its severity into its risk`);
});

test('this agent does not reimplement the evidence grading rules', () => {
  /* The same refusal agent/proposals/editorial/ is held to.
     TIER_GRADE and familyOf are red tier and live in js/format.js. */
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs') && x !== 'selftest.mjs')) {
    const src = readFileSync(join(HERE, f), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.ok(!code.includes('TIER_GRADE'), `${f} names TIER_GRADE; the grading rules have one home and it is js/format.js`);
  }
});

test('this agent reads no prose and proposes no sentence', () => {
  /* The boundary with agent/proposals/editorial/. A UX finding may
     quote a template; it may not judge what the brief argues. */
  for (const r of ALL) {
    for (const e of r.evidence) {
      assert.ok(!/data\/brief\.json$/.test(String(e.locator).split(':')[0]), `${r.proposal_id} quotes the brief's prose; that is agent/proposals/editorial/'s`);
    }
  }
});

test('the seven finding classes and four severities are the ones the contract declares', () => {
  assert.equal(UX_FINDING_CLASSES.length, 7, 'the session named seven kinds of finding');
  assert.deepEqual(UX_SEVERITIES, ['critical', 'high', 'medium', 'low']);
  assert.deepEqual(Object.keys(UX_SEVERITY_RANK).sort(), [...UX_SEVERITIES].sort());
});
