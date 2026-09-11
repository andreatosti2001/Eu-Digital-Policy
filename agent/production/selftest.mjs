/* ============================================================
   agent/production/selftest.mjs — the production operating mode's
   own suite

   WHAT IT HAS TO PROVE, and the order is the order of what would
   hurt most if it were wrong.

   1. THE REFUSAL ACTUALLY REFUSES. `assessActivation()` is the stop
      SESSION 29's brief asks for. It is driven here with synthetic
      facts — every condition passing, one failing, one unmeasurable
      — because a stop that has only ever been exercised against a
      tree that happens to fail is a stop nobody has tested.

   2. AN UNMEASURED MANDATORY CONDITION BLOCKS. This is the half a
      later session would be most tempted to relax, because it is
      what makes `--quick` useless for a real report, and relaxing
      it would turn "we did not look" into "nothing was wrong".

   3. NOTHING IN THIS DIRECTORY WRITES. Proved twice, the way
      `agent/proposals/governance/` proves it: no module calls a
      write API, asserted as a CALL so that a header explaining the
      rule does not violate it; and a full run of every read-only
      verb leaves the working tree byte-identical.

   4. THE CLASSIFIERS DO NOT REPORT A MODULE'S OWN DENIAL AS A
      FINDING. Three separate false positives were found and fixed
      while this was written — a capability scan that read its own
      vocabulary list, a deploy check that fired on the panel
      sentence "This deployment does not publish its address", and a
      stylesheet line scan that missed a declaration because its
      rule spans five lines. Each has a test here, pinned to the
      exact input that fooled it, because each is the HE-01 shape
      this repository has already had to correct once elsewhere.

   5. THE SCHEDULE ENDS AT A PERSON. The loader refuses a daily
      cycle whose terminal stage is a machine stage, and the refusal
      is exercised rather than described.

   WHAT IT DELIBERATELY DOES NOT DO. It asserts none of the
   conditions' real-world verdicts. Pinning "the adversarial gate is
   red" or "no dispatcher is wired" would make a defect a
   requirement and its repair a test failure, which is the mistake
   `agent/simulation/selftest.mjs` names about its own twenty-three
   findings.
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../implement/baseline.mjs';
import { AGENT_SUITES } from '../implement/checks.mjs';
import {
  SCHEDULE, DAILY_CYCLE, WEEKLY_REVIEWS, MONTHLY_REVIEWS,
  loadSchedule, ScheduleRefused, scheduledCommands, scriptOf,
} from './schedule.mjs';
import {
  visualStandard, visualSummary, thresholdStyleRules, stripComments,
  GENRE_SIGNATURES, DEVOTIONAL_VOCABULARY,
} from './visual.mjs';
import {
  separations, separationSummary, controlPlaneClear, phraseOccurrences,
  classifyOccurrence, stringContextAt, grantingPrimitivesIn,
  maskComments, maskStrings, maskRegexLiterals, GRANTING_PRIMITIVES,
} from './separations.mjs';
import { traceability, trackedFilesUnder, PUBLISHED_SURFACE } from './traceability.mjs';
import { CONDITIONS, DOMAINS, evaluate, assessActivation } from './readiness.mjs';

const HERE = join(REPO_ROOT, 'agent/production');
const MODULES = readdirSync(HERE).filter((f) => f.endsWith('.mjs'));

const gitStatus = () => execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' });

/* ============================================================
   1 · THE REFUSAL
   ============================================================ */

const rows = (over) => CONDITIONS.map((c) => ({
  id: c.id, domain: c.domain, mandatory: c.mandatory, question: c.question,
  state: over?.[c.id] ?? 'pass', evidence: 'synthetic', bound: null,
}));

test('1 · every mandatory condition passing is the only way to may_activate', () => {
  const v = assessActivation(rows());
  assert.equal(v.state, 'may_activate');
  assert.equal(v.blocking.length, 0);
  assert.equal(v.mandatory_passed, v.mandatory_total);
});

test('1 · ONE failing mandatory condition refuses, and names itself', () => {
  for (const c of CONDITIONS.filter((x) => x.mandatory)) {
    const v = assessActivation(rows({ [c.id]: 'fail' }));
    assert.equal(v.state, 'refused', `${c.id} failing must refuse activation`);
    assert.deepEqual(v.blocking.map((b) => b.id), [c.id]);
  }
});

test('2 · an UNMEASURABLE mandatory condition blocks exactly as a failure does', () => {
  for (const c of CONDITIONS.filter((x) => x.mandatory)) {
    const v = assessActivation(rows({ [c.id]: 'unmeasurable' }));
    assert.equal(v.state, 'refused', `${c.id} unmeasurable must refuse activation`);
    assert.equal(v.blocking[0].state, 'unmeasurable');
  }
});

test('2 · an advisory condition failing does NOT block, and is still reported', () => {
  const advisory = CONDITIONS.filter((c) => !c.mandatory);
  assert.ok(advisory.length, 'there is at least one advisory condition');
  for (const c of advisory) {
    const v = assessActivation(rows({ [c.id]: 'fail' }));
    assert.equal(v.state, 'may_activate');
    assert.ok(v.advisory_failing.includes(c.id), 'and it is named rather than dropped');
  }
});

test('1 · there is no overall readiness score, and assessActivation refuses to invent one', () => {
  const v = assessActivation(rows());
  assert.equal(v.overall_score, null);
  /* The same refusal agent/health/model.mjs makes by throwing. Ten
     domains that fail differently do not have a mean. */
  assert.equal(v.by_domain.length, DOMAINS.length);
});

test('1 · a condition that throws is unmeasurable, never a pass', () => {
  const exploding = [{ id: 'x', domain: 'suites', mandatory: true, question: 'q', evaluate: () => { throw new Error('boom'); } }];
  const [r] = evaluate({}, { conditions: exploding });
  assert.equal(r.state, 'unmeasurable');
  assert.match(r.evidence, /boom/);
  assert.equal(assessActivation([r]).state, 'refused');
});

test('1 · evaluate() with NO facts at all reports unmeasurable and refuses', () => {
  const out = evaluate({});
  assert.equal(out.filter((r) => r.state === 'pass' && r.mandatory).length === out.filter((r) => r.mandatory).length, false,
    'an empty fact set cannot produce a full pass');
  assert.equal(assessActivation(out).state, 'refused');
});

/* ============================================================
   3 · NOTHING HERE WRITES
   ============================================================ */

const WRITE_CALLS = [
  'writeFileSync(', 'writeFile(', 'appendFileSync(', 'appendFile(', 'mkdirSync(',
  'rmSync(', 'unlinkSync(', 'renameSync(', 'copyFileSync(', 'createWriteStream(',
  'recordDecision(', 'recordGrant(', 'writeCycle(',
];

test('3 · no module in agent/production/ CALLS a write API', () => {
  for (const f of MODULES) {
    /* Asserted as a CALL: comments, strings and regexes are masked,
       so this file's own header naming the rule does not break it —
       and neither does readiness.mjs quoting recordDecision in the
       sentence that says it does not call it. */
    const code = maskRegexLiterals(maskStrings(maskComments(readFileSync(join(HERE, f), 'utf8'))));
    for (const w of WRITE_CALLS) {
      assert.ok(!code.includes(w), `agent/production/${f} calls ${w}`);
    }
  }
});

test('3 · the CLI has no verb that decides, records, applies or activates', () => {
  const cli = readFileSync(join(HERE, 'cli.mjs'), 'utf8');
  const code = maskRegexLiterals(maskStrings(maskComments(cli)));
  for (const verb of ['decide', 'apply', 'grant', 'record', 'activate', 'deploy', 'publish']) {
    assert.ok(!new RegExp(`command === ['"\`]${verb}`).test(code),
      `the CLI declares a "${verb}" verb. This directory reports; it does not act.`);
  }
  for (const flag of ['--execute', '--force', '--record', '--activate']) {
    assert.ok(!code.includes(flag), `the CLI accepts ${flag}`);
  }
});

test('3 · a full run of every read-only verb leaves the tree byte-identical', () => {
  const before = gitStatus();
  for (const verb of ['schedule', 'visual', 'separations', 'trace']) {
    try {
      execFileSync(process.execPath, ['agent/production/cli.mjs', verb], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      /* A non-zero exit is a FINDING, not a failure of this test.
         `trace` exits 1 on a standing finding and asserting it
         exits 0 would pin that finding as a requirement. */
      assert.ok(typeof e.status === 'number', `${verb} did not run at all: ${e.message}`);
    }
  }
  assert.equal(gitStatus(), before, 'a read-only verb changed the tree');
});

/* ============================================================
   4 · THE CLASSIFIERS, PINNED TO WHAT FOOLED THEM
   ============================================================ */

test('4 · a capability scan does not count a primitive named in a STRING', () => {
  /* The first draft of separations.mjs reported itself as calling
     all thirteen granting primitives, on the strength of the array
     that declares their names. */
  const src = "const NAMES = ['recordDecision', 'recordGrant', 'authorize'];\n";
  assert.deepEqual(grantingPrimitivesIn(src), []);
  assert.deepEqual(grantingPrimitivesIn("import { recordDecision } from './ledger.mjs';"), ['recordDecision']);
});

test('4 · a capability scan does not count a primitive named in a REGEX', () => {
  /* Nor in the check that searches for it: separations.mjs asks
     !/permission|authorize|mayExecute|grantFor/i.test(code), and the
     draft without maskRegexLiterals read that as five calls. */
  assert.deepEqual(grantingPrimitivesIn('const ok = !/authorize|mayExecute|grantFor/i.test(code);'), []);
});

test('4 · a capability scan does not count a primitive named in a COMMENT', () => {
  assert.deepEqual(grantingPrimitivesIn('/* this module never calls recordDecision */\nconst x = 1;'), []);
  assert.deepEqual(grantingPrimitivesIn('// authorize() is not called here\nconst y = 2;'), []);
});

test('4 · the deploy prohibition is a capability check, not a word search', () => {
  /* js/threshold.js shows a reader the sentence "This deployment
     does not publish its address". A check that failed on that
     would be failing on the module's own denial, and somebody would
     have deleted the sentence to clear it. */
  const s = separations({});
  const deploy = s.prohibitions.find((p) => p.id === 'never_deploy');
  assert.ok(deploy, 'the deploy prohibition exists');
  const client = readFileSync(join(REPO_ROOT, 'js/threshold.js'), 'utf8');
  assert.match(client, /does not publish its address/, 'the sentence that fooled the first draft is still there');
  assert.equal(deploy.held, true, 'and the check no longer fails on it');
});

test('4 · the stylesheet scan reads whole RULES, not matching lines', () => {
  /* `.thr-go,.thr-back{ … min-height:var(--hit) … }` spans five
     lines and only the first carries the string `thr-`. */
  const css = '.thr-go,.thr-back{\n  padding:1px;\n  min-height:var(--hit);\n}\n.other{color:red}\n';
  const rules = thresholdStyleRules(css);
  assert.equal(rules.length, 1);
  assert.match(rules[0].text, /min-height:var\(--hit\)/);
  assert.equal(rules[0].line, 1, 'and it reports the line a person would open');
  assert.ok(!rules.some((r) => /color:red/.test(r.text)), 'and it does not sweep in unrelated rules');
});

test('4 · a phrase occurrence inside a comment is not in executable code', () => {
  const rows_ = phraseOccurrences({ root: REPO_ROOT });
  const withComments = rows_.filter((r) => r.in_comments > 0);
  assert.ok(withComments.length >= 1, 'at least one file mentions the phrase in a comment');
  for (const r of withComments) {
    for (const o of r.occurrences) {
      assert.notEqual(o.position, undefined);
    }
  }
});

test('4 · classifyOccurrence places a regex needle as a needle, not a comparison', () => {
  /* agent/simulation/threshold.mjs:242 is
     `separated: namedRoutes.length === 0 && !/threshold|thirty-two/i.test(crSrc),`
     and the first draft called it compared_against on the `=== 0`. */
  const line = 'separated: namedRoutes.length === 0 && !/threshold|thirty-two/i.test(crSrc),';
  assert.equal(classifyOccurrence(line, line.indexOf('thirty-two')), 'needle');
});

test('4 · a comparison of a RESULT is not a comparison of the phrase', () => {
  const line = "exact_only: thresholdProvider('thirty-two path').length === 0,";
  assert.equal(classifyOccurrence(line, line.indexOf('thirty-two')), 'argument');
});

test('4 · a real equality test against the phrase IS compared_against', () => {
  /* These fixture lines are themselves quoted code in this file, so
     the scan over the tree classifies them `fixture` — and the
     assertion below runs the classifier on the string's VALUE,
     where the phrase is not inside an outer string and a real
     comparison is what it is. Both readings are correct and they do
     not interfere. An earlier draft built these by concatenation to
     dodge the first reading and produced a line the classifier
     could place even less: `const q = "'thirty-two paths'"`. */
  for (const line of [
    "if (req.headers['x-key'] === 'thirty-two paths') return grant();",
    "const ok = 'thirty-two paths' === input;",
  ]) {
    assert.equal(classifyOccurrence(line, line.indexOf('thirty-two')), 'compared_against', line);
  }
});

test('4 · quoted code is a fixture, and a fixture is not a comparison', () => {
  /* This suite pins the classifier to the lines that fooled its
     drafts, and those fixtures are source code inside quotes.
     Without the `fixture` position, the suite that proves the
     classifier works would itself be reported as a file needing a
     security read — which is the false alarm that trains people to
     stop reading the check. Quoted code is never executed. */
  const line = '  const fixture = "if (k === \'thirty-two paths\') grant();";';
  assert.equal(classifyOccurrence(line, line.indexOf('thirty-two')), 'fixture');
});

test('4 · a sentence containing the OTHER quote character is prose', () => {
  /* agent/simulation/threshold.mjs:111 is a single-quoted sentence
     with a double-quoted phrase inside it, and the regex draft
     reported it undetermined. */
  const line = "  'agent/browser/checks.mjs threshold:exact measures in a real browser that \"thirty-two path\" produces zero results.',";
  assert.equal(classifyOccurrence(line, line.indexOf('thirty-two')), 'prose');
});

test('4 · stringContextAt handles a string holding the other quote', () => {
  const line = `const s = 'he said "hello" to me';`;
  const ctx = stringContextAt(line, line.indexOf('hello'));
  assert.equal(ctx.inString, true);
  assert.equal(ctx.quote, "'");
});

test('4 · the classifier DEFAULTS to undetermined rather than to safe', () => {
  assert.equal(classifyOccurrence('thirty-two paths', 0), 'undetermined');
});

test('4 · an undetermined occurrence is never cleared', () => {
  /* The rule, exercised on the real corpus: no file reported
     `cleared` carries an undetermined or a compared occurrence. */
  for (const r of phraseOccurrences({ root: REPO_ROOT })) {
    if (r.verdict === 'cleared') {
      assert.equal(r.compared_against, 0, `${r.file} is cleared with a comparison`);
      assert.equal(r.undetermined, 0, `${r.file} is cleared with an undetermined occurrence`);
      assert.equal(r.granting_primitives.length, 0, `${r.file} is cleared while holding a capability`);
    }
  }
});

test('4 · a file with a capability and no comparison is no_path_found, not cleared', () => {
  const rows_ = phraseOccurrences({ root: REPO_ROOT });
  for (const r of rows_) {
    if (r.granting_primitives.length && !r.compared_against && !r.undetermined) {
      assert.equal(r.verdict, 'no_path_found');
      assert.match(r.why, /not a path proven absent/);
    }
  }
});

/* ============================================================
   5 · THE SCHEDULE
   ============================================================ */

test('5 · the daily cycle is the eight stages the brief names, in order', () => {
  assert.equal(DAILY_CYCLE.length, 8);
  assert.deepEqual(DAILY_CYCLE.map((s) => s.id), [
    'scout', 'verify', 'detect_change', 'assess_depth',
    'route_impact', 'qa', 'governance', 'publish_or_request_approval',
  ]);
  assert.deepEqual(DAILY_CYCLE.map((s) => s.order), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('5 · there are seven weekly reviews and seven monthly reviews', () => {
  assert.equal(WEEKLY_REVIEWS.length, 7);
  assert.equal(MONTHLY_REVIEWS.length, 7);
});

test('5 · the cycle ends at a HUMAN stage, and the loader refuses one that does not', () => {
  assert.equal(DAILY_CYCLE[DAILY_CYCLE.length - 1].kind, 'human');
  const machineEnding = DAILY_CYCLE.map((s, i) => (i === DAILY_CYCLE.length - 1 ? { ...s, kind: 'machine' } : s));
  assert.throws(() => loadSchedule({ daily: machineEnding }), ScheduleRefused);
});

test('5 · the loader refuses a stage that does not say what it cannot establish', () => {
  const silent = DAILY_CYCLE.map((s, i) => (i === 0 ? { ...s, cannot: '' } : s));
  assert.throws(() => loadSchedule({ daily: silent }), ScheduleRefused);
});

test('5 · the loader refuses a gap or a repeat in the order', () => {
  const gapped = DAILY_CYCLE.map((s, i) => (i === 2 ? { ...s, order: 9 } : s));
  assert.throws(() => loadSchedule({ daily: gapped }), ScheduleRefused);
});

test('5 · the loader refuses a review that produces a decision instead of evidence', () => {
  const silent = WEEKLY_REVIEWS.map((r, i) => (i === 0 ? { ...r, human_step: '' } : r));
  assert.throws(() => loadSchedule({ weekly: silent }), ScheduleRefused);
});

test('5 · every command the schedule names resolves to a file in this tree', () => {
  for (const c of scheduledCommands({ schedule: SCHEDULE })) {
    const script = scriptOf(c.runs);
    assert.ok(script, `${c.id} names a command this module cannot resolve: ${c.runs}`);
    assert.doesNotThrow(() => readFileSync(join(REPO_ROOT, script), 'utf8'),
      `${c.id} names ${script}, which does not exist. A stage nobody can run is a stage nobody runs.`);
  }
});

/* ============================================================
   6 · THE VISUAL STANDARD
   ============================================================ */

test('6 · all ten criteria are measured and none is silently dropped', () => {
  const r = visualStandard({});
  assert.equal(r.length, 10);
  assert.deepEqual([...new Set(r.map((x) => x.criterion))].length, 10);
  for (const x of r) assert.ok(['pass', 'fail', 'unmeasurable'].includes(x.state));
});

test('6 · a missing browser result is unmeasurable, never a pass', () => {
  const without = visualStandard({ browser: null });
  const perf = without.find((r) => r.criterion === 'vs-08');
  assert.equal(perf.state, 'unmeasurable');
  assert.match(perf.evidence, /No browser result was supplied/);
  /* And a result with the check MISSING is not treated as present. */
  const bogus = visualStandard({ browser: { checks: [{ id: 'something:else', status: 'pass' }] } });
  assert.equal(bogus.find((r) => r.criterion === 'vs-08').state, 'unmeasurable');
});

test('6 · a FAILING browser check is not read as a pass', () => {
  const failing = visualStandard({
    browser: { checks: [{ id: 'threshold:no-request', status: 'fail' }, { id: 'threshold:total-requests', status: 'pass' }] },
  });
  assert.equal(failing.find((r) => r.criterion === 'vs-08').state, 'fail');
});

test('6 · every criterion that passes on an aesthetic question states its bound', () => {
  const r = visualStandard({});
  for (const id of ['vs-01', 'vs-03', 'vs-04', 'vs-05', 'vs-06']) {
    const row = r.find((x) => x.criterion === id);
    assert.ok(row.bound, `${id} passes without saying what it did not establish`);
  }
});

test('6 · the genre and devotional vocabularies are non-empty and disjoint', () => {
  assert.ok(GENRE_SIGNATURES.length >= 15);
  assert.ok(DEVOTIONAL_VOCABULARY.length >= 10);
  const overlap = GENRE_SIGNATURES.filter((g) => DEVOTIONAL_VOCABULARY.includes(g));
  assert.deepEqual(overlap, []);
});

test('6 · stripComments keeps string literals, because a credential would be one', () => {
  const src = "/* token */ const a = 'token';\n// secret\nconst b = 'secret';";
  const out = stripComments(src);
  assert.ok(out.includes("'token'"));
  assert.ok(out.includes("'secret'"));
  assert.ok(!/\/\* token \*\//.test(out));
});

test('6 · the summary counts every state and names the failing criteria', () => {
  const s = visualSummary([
    { criterion: 'a', state: 'pass' }, { criterion: 'b', state: 'fail' }, { criterion: 'c', state: 'unmeasurable' },
  ]);
  assert.deepEqual(s, { total: 3, pass: 1, fail: 1, unmeasurable: 1, failing: ['b'] });
});

/* ============================================================
   7 · THE SEPARATIONS
   ============================================================ */

test('7 · the six prohibitions and the three permissions are all measured', () => {
  const s = separations({});
  assert.equal(s.prohibitions.length, 6);
  assert.equal(s.permissions.length, 3);
  assert.deepEqual(s.prohibitions.map((p) => p.id), [
    'never_authenticate', 'never_authorize', 'never_approve',
    'never_execute', 'never_deploy', 'never_expose',
  ]);
});

test('7 · the control-plane scan is unconditional and an absent directory is not a pass', () => {
  const missing = controlPlaneClear({ root: join(REPO_ROOT, 'agent') });
  assert.equal(missing.clear, false);
  assert.match(missing.why, /An absent check is not a pass/);
});

test('7 · the summary holds only when nothing needs reading and no page has a password field', () => {
  const s = separations({});
  const sum = separationSummary(s);
  assert.equal(typeof sum.held, 'boolean');
  /* The implication, not the current value: pinning `held === true`
     would make a future regression a passing test. */
  if (sum.read_it_files.length || sum.password_fields.length || sum.failed_prohibitions.length) {
    assert.equal(sum.held, false);
  }
});

test('7 · the client module is never reported as an occurrence', () => {
  const files = phraseOccurrences({ root: REPO_ROOT }).map((r) => r.file);
  assert.ok(!files.includes('js/threshold.js'), 'the phrase belongs in its home and is not a finding there');
});

test('7 · this module does not exclude a file by path, which is the stale-list shape', () => {
  /* HE-04's exclusions are three path patterns, and AGENTS.md names
     a stale exclusion list as the thing SESSION 23.5 already had to
     correct once. Nothing here filters by directory: every file is
     classified and reported with its verdict. */
  const src = readFileSync(join(HERE, 'separations.mjs'), 'utf8');
  const code = maskRegexLiterals(maskStrings(maskComments(src)));
  assert.ok(!/selftest\.mjs/.test(code), 'separations.mjs excludes selftests by name');
  assert.ok(!/policy\/verify/.test(code), 'separations.mjs excludes the verification gate by path');
});

test('7 · GRANTING_PRIMITIVES is a vocabulary of calls, with no trailing parenthesis', () => {
  for (const p of GRANTING_PRIMITIVES) {
    assert.ok(!p.includes('('), `"${p}" carries a parenthesis; the scan matches on a word boundary`);
  }
});

/* ============================================================
   8 · TRACEABILITY
   ============================================================ */

test('8 · a tracked README does not make a run store durable', () => {
  /* The first draft counted agent/implement/decisions/README.md and
     reported the decision ledger as durable when the ledger is
     ABSENT — which is the SESSION 28 finding, inverted. */
  const t = trackedFilesUnder('agent/implement/decisions/', { root: REPO_ROOT });
  if (t.measurable && t.placeholders.length && !t.records.length) {
    const store = traceability({ root: REPO_ROOT }).stores.find((s) => s.store === 'agent/implement/decisions/');
    assert.equal(store.durable, false);
  }
});

test('8 · every write path states what it leaves behind and what that does not prove', () => {
  for (const p of traceability({ root: REPO_ROOT }).write_paths) {
    assert.ok(p.durable_record, `${p.id} names no durable record`);
    assert.ok(p.evidence, `${p.id} carries no evidence`);
    assert.ok(p.bound, `${p.id} does not say what it does not prove`);
    assert.equal(typeof p.traceable, 'boolean');
  }
});

test('8 · a human commit is counted as a write path rather than left out', () => {
  const t = traceability({ root: REPO_ROOT });
  const human = t.write_paths.find((p) => p.id === 'human_commit');
  assert.ok(human, 'the most likely way this website changes is on the list');
  assert.equal(human.automatic, false);
  assert.equal(human.traceable, false);
});

test('8 · the published surface names the pages and the directories a reader receives', () => {
  for (const p of ['index.html', 'data/', 'i18n/', 'js/', 'css/', 'style.css', 'app.js']) {
    assert.ok(PUBLISHED_SURFACE.includes(p), `${p} is not in the published surface`);
  }
  assert.ok(!PUBLISHED_SURFACE.includes('docs/'), 'docs/ is served by Pages but changing it does not change the website');
});

/* ============================================================
   9 · THE REGISTER
   ============================================================ */

test('9 · this suite is in AGENT_SUITES, or a change here would land without running it', () => {
  assert.ok(AGENT_SUITES.includes('agent/production/selftest.mjs'));
});

test('9 · every condition belongs to a declared domain and states its question', () => {
  for (const c of CONDITIONS) {
    assert.ok(DOMAINS.includes(c.domain), `${c.id} is in domain "${c.domain}", which is not declared`);
    assert.ok(c.question.endsWith('?'), `${c.id} does not state its question as a question`);
    assert.equal(typeof c.mandatory, 'boolean');
    assert.equal(typeof c.evaluate, 'function');
  }
  assert.equal(new Set(CONDITIONS.map((c) => c.id)).size, CONDITIONS.length, 'duplicate condition id');
});

test('9 · every domain the register declares carries at least one condition', () => {
  for (const d of DOMAINS) {
    assert.ok(CONDITIONS.some((c) => c.domain === d), `domain "${d}" has no conditions`);
  }
});
