/* ============================================================
   agent/production/readiness.mjs — the production readiness
   checklist, measured, and the refusal to arm

   WHAT SESSION 29 ASKS FOR. "Before activating production, output a
   final readiness checklist and stop if any mandatory condition
   fails." This file is that checklist as executable conditions
   rather than as a list in a document, and `assessActivation()` is
   the stop.

   FACTS FIRST, VERDICTS SECOND, and they are separate functions for
   a reason. `gatherFacts()` does the expensive work — the suites,
   the validators, the boundary scans, the adversarial gate, the
   browser — and every fact it returns carries whether it actually
   RAN. `evaluate()` is pure: it turns facts into states and it can
   be driven with synthetic facts by the suite. A checklist whose
   only way to be tested is to run the real system for twenty
   minutes is a checklist nobody tests.

   AN UNMEASURED CONDITION IS NOT A PASS, and it is not a fail
   either. A condition whose evidence could not be gathered is
   `unmeasurable`, and a MANDATORY condition that is `unmeasurable`
   blocks activation exactly as a failure does. That is deliberate
   and it is the rule this repository already applies to a skipped
   browser run: exit 2 is not exit 0, because in production there is
   nobody reading "skipped".

   IT ARMS NOTHING AND IT WRITES NOTHING. There is no `--force`, no
   override flag, and no way to record an activation from here. The
   only output is a verdict. If every mandatory condition passed,
   what this module would say is that a person MAY activate — not
   that it has been activated, because switching a production mode
   on is a governance decision and protocol §24 reserves those to a
   person. `agent/policy/cli.mjs governance` is where such a
   decision would be recorded, by a named human, through the one
   writer that exists.
   ============================================================ */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT, readBaseline } from '../implement/baseline.mjs';
import { runValidators, runAgentSuites, run, verdictFor, AGENT_SUITES } from '../implement/checks.mjs';
import { SCHEDULE, scheduledCommands, scriptOf } from './schedule.mjs';
import { visualStandard, visualSummary } from './visual.mjs';
import { separations, separationSummary, controlPlaneClear } from './separations.mjs';
import { traceability } from './traceability.mjs';

/** The domains a condition belongs to. Never summed — the same rule
 *  `agent/health/` applies to its three. A checklist with one number
 *  on it invites somebody to move the number. */
export const DOMAINS = Object.freeze([
  'validators', 'suites', 'boundary', 'adversarial', 'control_room',
  'visual', 'observability', 'traceability', 'dispatch', 'governance',
]);

const C = (id, domain, mandatory, question, evaluate) => Object.freeze({ id, domain, mandatory, question, evaluate });
const verdict = (state, evidence, bound = null) => ({ state, evidence, bound });
const pass = (e, b) => verdict('pass', e, b);
const fail = (e, b) => verdict('fail', e, b);
const unmeasurable = (e, b) => verdict('unmeasurable', e, b);

/**
 * The conditions.
 *
 * Every one names the question it answers in the words a person
 * would ask it, because "readiness: 14/19" tells a reader nothing
 * and "no production dispatcher is wired" tells them everything.
 */
export const CONDITIONS = Object.freeze([

  /* ---------------------------------------------- validators */
  C('validators_at_baseline', 'validators', true,
    'do the four validators return to the recorded baseline in docs/CURRENT-ARCHITECTURE.md §12?',
    (f) => {
      if (!f.validators?.ran) return unmeasurable(`the validators did not run: ${f.validators?.why ?? 'no result'}`);
      const v = f.validators.verdict;
      const off = f.validators.checks.filter((c) => c.exit_code !== 0 || c.errors > 0);
      return v === 'pass' || v === 'pass_with_findings'
        ? pass(`${f.validators.checks.length} validator(s) at the recorded baseline: ${f.validators.checks.map((c) => `${c.name} ${c.errors}e/${c.warnings}w`).join(', ')}.`,
          'A passing validator proves less than it looks: design-qa.mjs harvests CSS token declarations out of JavaScript by regex, freshness.mjs performs no network I/O, and none of the four reads a sentence. AUDIT F-10, F-11, F-12.')
        : fail(`node agent/implement/cli.mjs check reports verdict ${v} against docs/CURRENT-ARCHITECTURE.md \u00a712. ${off.map((c) => `${c.name} exit ${c.exit_code}, ${c.errors} error(s) against a baseline of ${c.baseline_errors}`).join('; ')}. Read the named check's own output before treating this as a tooling defect: the four validators fail on different kinds of thing, and only one of them is ever content work. THE FRESHNESS DISAGREEMENT THAT STOOD HERE FROM SESSION 24 TO SESSION 29 IS RESOLVED and is not this. It was: either freshness.mjs should not exit 1 on "1 item(s) need attention", or \u00a712's baseline of 0 for it is wrong. SESSION 30 settled it the first way, on the ground that the exit code was a function of the reader's clock \u2014 the same tree audited as of its own newest verification date reported nothing \u2014 and a result that flips with the calendar on unchanged bytes cannot gate a build. Its exit code now reports DEFECTS in the tree; the staleness prompts are still printed and counted, and are still closed only by verification work.`);
    }),

  /* -------------------------------------------------- suites */
  C('agent_suites_pass', 'suites', true,
    'does every agent suite pass?',
    (f) => {
      if (!f.suites?.ran) return unmeasurable(`the suites did not run: ${f.suites?.why ?? 'no result'}`);
      const failed = f.suites.results.filter((r) => r.exit_code !== 0);
      return failed.length === 0
        ? pass(`${f.suites.results.length} suite(s), ${f.suites.tests ?? 'an unreported number of'} test(s), all passing.`)
        : fail(`${failed.length} suite(s) failed: ${failed.map((r) => `${r.suite} exit ${r.exit_code}`).join(', ')}`);
    }),

  C('suite_list_complete', 'suites', true,
    'does AGENT_SUITES name every selftest in the tree, so a change under agent/ runs all of them?',
    (f) => {
      if (!f.suiteFiles) return unmeasurable('the suite files could not be listed');
      const missing = f.suiteFiles.filter((s) => !AGENT_SUITES.includes(s) && !s.startsWith('.control-room'));
      return missing.length === 0
        ? pass(`AGENT_SUITES names all ${AGENT_SUITES.length} suites under agent/. agent/implement/selftest.mjs R6 asserts the count, and it has caught this list growing eight times.`)
        : fail(`${missing.length} selftest(s) exist and are not in AGENT_SUITES: ${missing.join(', ')}. A suite nothing runs is a gate on nothing.`);
    }),

  C('contracts_satisfiable', 'suites', true,
    'is every inter-agent contract satisfiable by its fixture?',
    (f) => (f.contracts?.ran
      ? (f.contracts.exit_code === 0
        ? pass('node agent/schemas/cli.mjs check exits 0: every contract in the registry is satisfiable by its own fixture.')
        : fail(`node agent/schemas/cli.mjs check exits ${f.contracts.exit_code}`))
      : unmeasurable(`the contract check did not run: ${f.contracts?.why ?? 'no result'}`))),

  /* ------------------------------------------------ boundary */
  C('published_surface_clean', 'boundary', true,
    'is there a credential in anything the website serves?',
    (f) => {
      if (!f.boundary?.ran) return unmeasurable(`the boundary scan did not run: ${f.boundary?.why ?? 'no result'}`);
      return f.boundary.exit_code === 0
        ? pass('node agent/implement/cli.mjs boundary exits 0: no credential in a file the website loads, and none in a published file that is not a declared test fixture.',
          'Almost the whole repository is inside the published deployment. GitHub Pages serves main at the root with no _config.yml and no exclude list, so agent/ and docs/ are published alongside index.html. That is a standing architectural fact this check reports as a warning on every run.')
        : fail(`node agent/implement/cli.mjs boundary exits ${f.boundary.exit_code}`);
    }),

  C('control_room_boundary', 'boundary', true,
    'is the Control Room still behind the one publication boundary this repository has?',
    (f) => (f.crBoundary?.ran
      ? (f.crBoundary.exit_code === 0
        ? pass('node .control-room/cli.mjs boundary exits 0: the dot prefix still holds on the actual tree, no credential is in the Control Room\'s own files, no private state has become git-tracked, and no route could deploy, delete or publish.',
          'Protocol §10 and docs/CONTROL-ROOM.md §1 both say the dot prefix is a PUBLICATION boundary and not a security control. Every privileged request there is authenticated and authorized regardless, and this check says nothing about that.')
        : fail(`node .control-room/cli.mjs boundary exits ${f.crBoundary.exit_code}`))
      : unmeasurable(`the Control Room boundary check did not run: ${f.crBoundary?.why ?? 'no result'}`))),

  /* --------------------------------------------- adversarial */
  C('adversarial_gate_clean', 'adversarial', true,
    'did every attack in the verification gate fail safely?',
    (f) => {
      if (!f.adversarial?.ran) return unmeasurable(`the adversarial gate did not run: ${f.adversarial?.why ?? 'no result'}`);
      const line = /(\d+) failed safely · (\d+) SUCCEEDED · (\d+) partial · (\d+) undecidable/.exec(f.adversarial.stdout ?? '');
      const succeeded = line ? Number(line[2]) : null;
      if (succeeded === null) return unmeasurable('the gate ran and its summary line could not be parsed, so the number of successful attacks is unknown. Unknown is not zero.');
      return succeeded === 0
        ? pass(`${line[1]} attack(s) failed safely, 0 SUCCEEDED, ${line[3]} partial, ${line[4]} undecidable.`,
          'An undecidable is not a pass; it is a boundary this environment could not test. The gate proves the door held against the attacks it knows, not that there is no other door.')
        : fail(`${succeeded} attack(s) SUCCEEDED. The gate exits ${f.adversarial.exit_code}. ${(f.adversarial.stdout ?? '').split('\n').filter((l) => /\[CRITICAL\]|\[HIGH\]/.test(l)).map((l) => l.trim()).join(' · ')}`);
    }),

  C('adversarial_gate_in_ci', 'adversarial', true,
    'does the verification gate run on every push?',
    (f) => (f.ciWorkflow === null
      ? unmeasurable('.github/workflows/qa.yml could not be read')
      : (/agent\/policy\/verify\/cli\.mjs/.test(f.ciWorkflow)
        ? pass('.github/workflows/qa.yml runs node agent/policy/verify/cli.mjs, so a CRITICAL finding is visible on the push that introduces it.')
        : fail('.github/workflows/qa.yml runs agent/policy/verify/selftest.mjs — the gate\'s own suite — and never the gate. The suite proves the gate is reproducible; it does not report what the gate FOUND. That is how a CRITICAL stayed red across SESSIONS 24, 25, 26, 27 and 28 with three documents saying otherwise.')))),

  /* --------------------------------------------- control room */
  C('separations_hold', 'control_room', true,
    'is discovery separate from authentication, authorization, approval, execution, deployment and privileged data?',
    (f) => {
      if (!f.separations) return unmeasurable('the separations were not measured');
      const s = f.separations.summary;
      return s.held
        ? pass(`all ${s.prohibitions_total} prohibitions hold and all ${s.permissions_available} permissions are available. The phrase appears in ${s.occurrence_files} file(s) outside js/threshold.js; ${s.cleared_files.length} are cleared on both halves and ${s.no_path_found_files.length} can grant something but never compare the phrase.`,
          'A path not found is not a path proven absent. The two no_path_found files are the policy suite and the adversarial gate, which drive real authorization code because that is their job; a person should read each once.')
        : fail(`${s.failed_prohibitions.join(', ') || ''}${s.read_it_files.length ? ` · ${s.read_it_files.length} file(s) need reading: ${s.read_it_files.join(', ')}` : ''}${s.password_fields.length ? ` · password field(s) on ${s.password_fields.join(', ')}` : ''}`);
    }),

  C('control_plane_clear_of_phrase', 'control_room', true,
    'is the trigger phrase absent from every Control Room source file?',
    (f) => (f.controlPlane
      ? (f.controlPlane.clear ? pass(f.controlPlane.why) : fail(f.controlPlane.why))
      : unmeasurable('the Control Room was not scanned'))),

  C('no_credential_prompt_published', 'control_room', true,
    'does any published page carry a password field?',
    (f) => {
      if (!f.separations) return unmeasurable('the pages were not scanned');
      const p = f.separations.raw.pages_with_a_password_field;
      return p.length === 0
        ? pass('no .html file in the published tree carries a type="password" field. The brief\'s phase 6 — "reveal CONTROL ROOM followed by the normal authentication interface" — must never become a login form on a published page, and agent/simulation/selftest.mjs test 6 asserts the same thing independently.')
        : fail(`${p.join(', ')} carr(ies) a password field. A credential prompt in the public tree is a phishing surface and a second home for a login .control-room/ already serves behind its own origin.`);
    }),

  /* ---------------------------------------------------- visual */
  C('visual_standard', 'visual', true,
    'does the hidden-entry animation meet all ten conditions of the final visual standard?',
    (f) => {
      if (!f.visual) return unmeasurable('the visual standard was not measured');
      const s = f.visual.summary;
      if (s.fail) return fail(`${s.fail} of ${s.total} criteria fail: ${s.failing.join(', ')}`);
      if (s.unmeasurable) {
        const ids = f.visual.rows.filter((r) => r.state === 'unmeasurable').map((r) => r.criterion);
        return unmeasurable(`${s.pass} of ${s.total} criteria pass and ${s.unmeasurable} could not be measured: ${ids.join(', ')}. Run node agent/browser/cli.mjs --json and supply it.`);
      }
      return pass(`all ${s.total} criteria pass: the identity, the geometry, the source tradition, the absence of arbitrary symbols, the absence of a genre aesthetic, accessibility, reduced motion, performance, ordinary search, and the security boundary.`,
        'Two of the ten are settled only in their mechanical half. Whether the drawing LOOKS like the rest of the site, and whether a practitioner of the source tradition would accept the construction, are judgements by people and no measurement here is one. No contrast was computed, no screen reader was run and no pixels were compared.');
    }),

  /* --------------------------------------------- observability */
  C('registers_run', 'observability', true,
    'does every command the operating schedule names exist and load?',
    (f) => {
      if (!f.scripts) return unmeasurable('the scheduled commands were not resolved');
      const missing = f.scripts.filter((s) => !s.exists);
      return missing.length === 0
        ? pass(`all ${f.scripts.length} script(s) the daily cycle and the fourteen reviews name exist in this tree.`)
        : fail(`${missing.length} scheduled command(s) name a script that does not exist: ${missing.map((s) => `${s.id} → ${s.script}`).join(', ')}`);
    }),

  C('registers_exit_clean', 'observability', true,
    'do the register commands that run on every push exit 0?',
    (f) => {
      if (!f.registers?.length) return unmeasurable('the registers were not run');
      const bad = f.registers.filter((r) => r.exit_code !== 0);
      return bad.length === 0
        ? pass(`${f.registers.length} register command(s) exit 0: ${f.registers.map((r) => r.command).join(', ')}. Each runs nothing and writes nothing.`)
        : fail(`${bad.length} register(s) exit non-zero: ${bad.map((r) => `${r.command} exit ${r.exit_code} — ${String(r.stderr ?? '').split('\n').find((l) => l.trim()) ?? ''}`).join(' · ')}. A failing step skips every step after it in the same CI job, so a broken register hides every check registered behind it.`);
    }),

  C('agents_instrumented', 'observability', false,
    'is every agent CLI instrumented through the tracer, so no agent is invisible?',
    (f) => {
      if (!f.traceability?.instrumentation?.measurable) return unmeasurable('the CLIs could not be listed');
      const i = f.traceability.instrumentation;
      return i.uninstrumented.length === 0
        ? pass(`all ${i.total} agent CLIs open a run on the tracer.`)
        : verdict('fail', `${i.instrumented} of ${i.total} agent CLIs import the tracer. ${i.uninstrumented.length} do not: ${i.uninstrumented.join(', ')}. Each of those is a register or a checker that runs nothing and writes nothing, so an untraced run of one changes no state — but "no agent may become invisible simply because it is automated" is a weaker claim here than it reads.`,
          'Advisory rather than mandatory: none of the seven can write, and instrumenting a command that reports a static table would add a trace with nothing in it. Recorded so that the day one of them gains a write path, this line is already here.');
    }),

  /* ---------------------------------------------- traceability */
  C('website_paths_traceable', 'traceability', true,
    'is every path that can change the website traceable to its evidence and its execution trace?',
    (f) => {
      if (!f.traceability) return unmeasurable('the write paths were not enumerated');
      const t = f.traceability;
      return t.untraceable.length === 0
        ? pass(`${t.website_changing_traceable} of ${t.website_changing_paths} website-changing write paths leave a durable record naming the evidence.`)
        : fail(`${t.website_changing_traceable} of ${t.website_changing_paths} website-changing write paths are traceable. Not traceable: ${t.untraceable.join(', ')}. ${t.write_paths.filter((p) => t.untraceable.includes(p.id)).map((p) => `${p.id} — ${p.evidence}`).join(' · ')}`);
    }),

  /* --------------------------------------------------- dispatch */
  C('production_dispatcher_wired', 'dispatch', true,
    'can the Orchestrator actually dispatch a specialist outside the simulation?',
    (f) => (f.dispatcher === null
      ? unmeasurable('the orchestrator directory could not be read')
      : (f.dispatcher.wired
        ? pass(`a production dispatcher is registered at ${f.dispatcher.where}.`)
        : fail('no production dispatcher is wired. agent/orchestrator/ has no dispatchers module; the only one in this repository is agent/simulation/dispatchers.mjs, whose own suite refuses it eight primitives by name so that it cannot write, spawn or fetch. A run outside the simulation reports not_dispatched at every dispatch stage and the workflow ends unresolved. The daily cycle\'s Route stage therefore reports what WOULD be routed and routes nothing.')))),

  C('scout_can_reach_a_source', 'dispatch', true,
    'can the Scout reach any registered source endpoint from this environment?',
    (f) => (f.network === null
      ? unmeasurable('source reachability was not measured')
      : (f.network.reachable > 0
        ? pass(`${f.network.reachable} of ${f.network.registered} registered endpoint(s) are reachable.`)
        : fail(`0 of ${f.network.registered} registered endpoint(s) are reachable. SESSION 25 ran --live against the five real endpoints and this environment's network policy refused all five. freshness.mjs prints a SOURCE REACHABILITY heading and performs no network I/O at all: no URL in this repository has ever been fetched (AUDIT F-12). A daily Scout stage that cannot retrieve a document cannot detect a change in the law.`)))),

  /* ------------------------------------------------- governance */
  C('decision_ledger_present', 'governance', true,
    'has any proposal in this repository ever been decided?',
    (f) => (f.decisionsLedger === null
      ? unmeasurable('the decision ledger path could not be checked')
      : (f.decisionsLedger.exists
        ? pass(`agent/implement/decisions/decisions.jsonl exists with ${f.decisionsLedger.lines} decision(s).`)
        : fail('agent/implement/decisions/decisions.jsonl is ABSENT, not empty. It is git-tracked, so absence there is the one absence in this repository\'s six decision stores that proves something. Of the seventy-one proposals across four agents, and the seven governance proposals, not one has ever been decided. The eighth stage of the daily cycle — publish or request approval — has a queue and no history of anything leaving it.')))),

  C('browser_suite_pass', 'governance', true,
    'does the browser regression suite pass against the real pages?',
    (f) => {
      if (!f.browser?.ran) return unmeasurable(`the browser suite did not run: ${f.browser?.why ?? 'no result'}. A skipped browser run is never a pass — agent/browser/cli.mjs exits 2 when it found no browser, and that is not exit 0.`);
      return f.browser.exit_code === 0
        ? pass('node agent/browser/cli.mjs exits 0 against the real pages.')
        : fail(`node agent/browser/cli.mjs exits ${f.browser.exit_code} with ${f.browser.failures?.length ?? 'some'} failure(s): ${(f.browser.failures ?? []).join(', ')}. Each is reader-facing, reproducible, and Class C interface work needing a proposal and a human decision. A measured defect is not an authorisation, and the handover says explicitly not to fix these on an agent's own initiative.`);
    }),

  C('deploy_gate_exists', 'governance', true,
    'is there anything between a commit and the live website?',
    (f) => (f.ciWorkflow === null
      ? unmeasurable('.github/workflows/qa.yml could not be read')
      : fail('nothing sits between a push and the live site. Deployment is GitHub Pages serving main at the repository root; .github/workflows/qa.yml runs the checks on every push and says in its own header that it is NOT a deploy gate. Making it blocking needs a branch protection rule, which is repository configuration outside this tree and a Class D change. An agent must not edit the workflow to claim otherwise: a workflow that CLAIMED to gate deployment would be worse than one that says plainly it does not.',
        'This condition can only be satisfied by the repository author, in repository settings. It is mandatory because "publish" is the eighth stage of the daily cycle and there is currently no gate on it.'))),
]);

/* ---------------------------------------------------- the facts */

/**
 * Gather what the conditions need. Expensive, and every part of it
 * is optional so a caller can measure one domain without the rest.
 *
 * Every fact records whether it RAN. Nothing here infers a result it
 * did not obtain.
 */
export async function gatherFacts({
  root = REPO_ROOT,
  asOf = new Date().toISOString().slice(0, 10),
  validators: doValidators = true,
  suites: doSuites = true,
  adversarial: doAdversarial = true,
  browser: doBrowser = true,
  registers: doRegisters = true,
  browserResult = null,
} = {}) {
  const facts = { asOf, root };

  /* --- cheap, always --- */
  const ciPath = join(root, '.github/workflows/qa.yml');
  facts.ciWorkflow = existsSync(ciPath) ? readFileSync(ciPath, 'utf8') : null;

  const sep = separations({ root });
  facts.separations = { raw: sep, summary: separationSummary(sep) };
  facts.controlPlane = controlPlaneClear({ root });

  /* THE BROWSER RUNS BEFORE THE VISUAL STANDARD, because two of the
     ten criteria are settled by it and an unsupplied browser result
     leaves them `unmeasurable` \u2014 which blocks activation. One run,
     read twice. */
  let browserJson = browserResult ?? null;
  if (doBrowser && !browserJson) {
    const b = safeRun(root, ['agent/browser/cli.mjs', '--json'], 900_000);
    if (b.ran) { try { browserJson = JSON.parse(b.stdout); } catch { browserJson = null; } }
    if (browserJson) {
      /* READ FROM THE SUITE'S OWN VERDICT, not from a field name
         guessed at. The first draft read `browserJson.checks`, which
         does not exist — the array is `results` — so every run came
         back with zero failures and this MANDATORY condition passed
         while the suite was exiting 1 on three real reader-facing
         defects. A checklist that reports a green because it read
         the wrong key is worse than no checklist. */
      const failures = (browserJson.failed ?? []).map((c) => c.id ?? c.name);
      const exit = browserJson.qa_check?.exit_code
        ?? (browserJson.verdict === 'fail' || failures.length ? 1 : 0);
      facts.browser = { ran: true, exit_code: exit, failures, stdout: '' };
    } else {
      facts.browser = { ran: false, why: b.why ?? 'the browser suite produced no parseable JSON', failures: [] };
    }
  }
  const visualRows = visualStandard({ root, browser: browserJson });
  facts.visual = { rows: visualRows, summary: visualSummary(visualRows) };

  facts.traceability = traceability({ root });

  facts.scripts = scheduledCommands({ schedule: SCHEDULE }).map((c) => {
    const script = scriptOf(c.runs);
    return { ...c, script, exists: script ? existsSync(join(root, script)) : false };
  });

  facts.suiteFiles = listSuiteFiles(root);

  facts.dispatcher = {
    wired: existsSync(join(root, 'agent/orchestrator/dispatchers.mjs')),
    where: 'agent/orchestrator/dispatchers.mjs',
  };

  const ledger = join(root, 'agent/implement/decisions/decisions.jsonl');
  facts.decisionsLedger = {
    exists: existsSync(ledger),
    lines: existsSync(ledger) ? readFileSync(ledger, 'utf8').split('\n').filter((l) => l.trim()).length : 0,
  };

  /* Source reachability. `freshness.mjs` prints a heading and
     performs no network I/O, so there is nothing to read a count
     out of — and SESSION 25's --live run is the only measurement
     this repository has ever taken. Reported as the measured zero it
     is, with the registered count read from the scout's own
     register where one exists. */
  facts.network = { registered: 5, reachable: 0, source: 'docs/SESSION-25-FIRST-REAL-WORLD-RUN.md, the only live run ever attempted here' };

  /* --- expensive --- */
  if (doValidators) {
    try {
      const { checks, comparisons } = runValidators({ root, asOf });
      facts.validators = { ran: true, checks, comparisons, verdict: verdictFor(checks) };
    } catch (e) { facts.validators = { ran: false, why: String(e?.message ?? e) }; }
  }

  if (doSuites) {
    try {
      const checks = runAgentSuites({ root });
      facts.suites = {
        ran: true,
        results: checks.map((c) => ({ suite: c.name, exit_code: c.exit_code, errors: c.errors })),
        tests: checks.reduce((n, c) => n + (Number(/# pass (\d+)/.exec(c.output_excerpt ?? '')?.[1]) || 0), 0),
      };
    } catch (e) { facts.suites = { ran: false, why: String(e?.message ?? e) }; }
    const c = run(process.execPath, ['agent/schemas/cli.mjs', 'check'], { cwd: root });
    facts.contracts = { ran: c.ran, exit_code: c.exit_code, why: c.stderr };
  }

  facts.boundary = safeRun(root, ['agent/implement/cli.mjs', 'boundary']);
  facts.crBoundary = safeRun(root, ['.control-room/cli.mjs', 'boundary']);

  if (doAdversarial) facts.adversarial = safeRun(root, ['agent/policy/verify/cli.mjs'], 900_000);

  if (doRegisters) {
    const cmds = [
      ['agent/orchestrator/cli.mjs', 'workflows'],
      ['agent/orchestrator/cli.mjs', 'capabilities'],
      ['agent/orchestrator/cli.mjs', 'policy'],
      ['agent/policy/cli.mjs', 'governance'],
      ['agent/autonomy/cli.mjs', 'status'],
      ['agent/improve/cli.mjs', 'reach'],
      ['agent/proposals/governance/cli.mjs', 'check'],
      ['.control-room/cli.mjs', 'routes'],
    ];
    facts.registers = cmds.map((args) => ({ command: `node ${args.join(' ')}`, ...safeRun(root, args) }));
  }

  return facts;
}

function safeRun(root, args, timeout = 600_000) {
  const r = run(process.execPath, args, { cwd: root, timeout });
  return { ran: r.ran, exit_code: r.exit_code, stdout: r.stdout, stderr: r.stderr, why: r.ran ? null : r.stderr };
}

function listSuiteFiles(root) {
  const r = run('git', ['ls-files', '--', 'agent/**/selftest.mjs', '.control-room/selftest.mjs'], { cwd: root });
  if (!r.ran || r.exit_code !== 0) return null;
  return r.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
}

/* ------------------------------------------------- the verdicts */

/** Pure: facts in, states out. Drivable with synthetic facts. */
export function evaluate(facts, { conditions = CONDITIONS } = {}) {
  return conditions.map((c) => {
    let v;
    try { v = c.evaluate(facts ?? {}); } catch (e) { v = unmeasurable(`the condition threw: ${String(e?.message ?? e)}`); }
    return { id: c.id, domain: c.domain, mandatory: c.mandatory, question: c.question, ...v };
  });
}

/**
 * The stop.
 *
 * A mandatory condition that is `fail` OR `unmeasurable` blocks.
 * That second half is the one worth stating: this repository already
 * treats a skipped required check as a blocking finding, because in
 * production there is nobody reading "skipped".
 */
export function assessActivation(rows) {
  const mandatory = rows.filter((r) => r.mandatory);
  const blocking = mandatory.filter((r) => r.state !== 'pass');
  return {
    state: blocking.length === 0 ? 'may_activate' : 'refused',
    mandatory_total: mandatory.length,
    mandatory_passed: mandatory.filter((r) => r.state === 'pass').length,
    blocking: blocking.map((r) => ({ id: r.id, domain: r.domain, state: r.state, evidence: r.evidence })),
    advisory_failing: rows.filter((r) => !r.mandatory && r.state !== 'pass').map((r) => r.id),
    by_domain: DOMAINS.map((d) => {
      const inDomain = rows.filter((r) => r.domain === d);
      return {
        domain: d,
        pass: inDomain.filter((r) => r.state === 'pass').length,
        fail: inDomain.filter((r) => r.state === 'fail').length,
        unmeasurable: inDomain.filter((r) => r.state === 'unmeasurable').length,
      };
    }),
    /* There is no score. The domains fail differently and a mean
       says none of it — the same refusal agent/health/model.mjs
       makes by throwing. */
    overall_score: null,
  };
}
