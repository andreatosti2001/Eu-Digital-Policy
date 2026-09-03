/* ============================================================
   agent/implement/checks.mjs — what the checks actually said

   The four validators in `tools/` are this project's test suite,
   AGENTS.md says to run all four before and after any change, and
   SESSION 18 says the same and adds the agent suites and the browser
   suite. This module runs them and turns their output into the
   checks `agent/schemas/contracts/qa-result.mjs` wants.

   THREE THINGS IT WILL NOT DO, each because the contract already
   refuses it and a second refusal here is cheaper than a defect:

   IT DOES NOT SUMMARISE. `output_excerpt` carries the lines that
   matter verbatim. The contract's own comment is "never a summary of
   what it probably said", and a QA layer that paraphrased a
   validator would be the single easiest place in this system to
   launder a failure.

   IT DOES NOT COMPARE AGAINST ITSELF. Every check carries the
   baseline from `docs/CURRENT-ARCHITECTURE.md` §12, read by
   `baseline.mjs`. "0 errors, 5 warnings" is a pass here and a
   regression in a repository that had four.

   IT DOES NOT TREAT A MISSING RUN AS A PASS. A validator that could
   not be executed is `exit_code: 127` with the reason in the
   excerpt, and the browser suite's `skipped` is carried through as a
   non-zero exit — SESSION 18 requirement 7.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { REPO_ROOT, VALIDATORS, readBaseline, compare } from './baseline.mjs';
import { boundaryCheck } from './boundary.mjs';
import { runBrowserQA, asQACheck as browserQACheck } from '../browser/runner.mjs';

/** The twelve agent suites AGENTS.md lists, plus this session's two.
 *  A change under `agent/` runs these as well. */
export const AGENT_SUITES = [
  'agent/schemas/selftest.mjs',
  'agent/scout/selftest.mjs',
  'agent/scout/schedule/selftest.mjs',
  'agent/verifier/selftest.mjs',
  'agent/integrate/selftest.mjs',
  'agent/detector/selftest.mjs',
  'agent/depth/selftest.mjs',
  'agent/proposals/data/selftest.mjs',
  'agent/architect/selftest.mjs',
  'agent/proposals/editorial/selftest.mjs',
  'agent/ux/selftest.mjs',
  'agent/observability/selftest.mjs',
  'agent/browser/selftest.mjs',
  'agent/implement/selftest.mjs',
  'agent/health/selftest.mjs',
];

/** Run a command, capturing everything, never throwing. A checker
 *  that throws on a failing check has confused "the check failed"
 *  with "the checker failed". */
export function run(command, args, { cwd = REPO_ROOT, timeout = 600_000, env = process.env } = {}) {
  try {
    const stdout = execFileSync(command, args, { cwd, encoding: 'utf8', timeout, env, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
    return { exit_code: 0, stdout, stderr: '', ran: true };
  } catch (e) {
    if (e.code === 'ENOENT') return { exit_code: 127, stdout: '', stderr: `${command} is not on this machine`, ran: false };
    return {
      exit_code: typeof e.status === 'number' ? e.status : 1,
      stdout: e.stdout ? String(e.stdout) : '',
      stderr: e.stderr ? String(e.stderr) : String(e.message),
      ran: true,
    };
  }
}

/** How each validator reports. Parsed rather than assumed: the
 *  formats differ, and reading "0 errors" out of the wrong line is
 *  how a QA layer starts lying. */
export function parseValidator(name, out) {
  const text = `${out.stdout}\n${out.stderr}`;
  let errors = null;
  let warnings = null;

  /* validate.mjs and i18n-audit.mjs: "ERRORS   0" / "WARNINGS 0" */
  const e1 = text.match(/^ERRORS\s+(\d+)/m);
  const w1 = text.match(/^WARNINGS\s+(\d+)/m);
  if (e1) errors = Number(e1[1]);
  if (w1) warnings = Number(w1[1]);

  /* design-qa.mjs: "0 errors, 5 warnings" */
  const both = text.match(/(\d+)\s+errors?,\s*(\d+)\s+warnings?/);
  if (both) { errors = Number(both[1]); warnings = Number(both[2]); }

  /* i18n-audit.mjs also prints "ERRORS 0   WARNINGS 0" on one line. */
  const inline = text.match(/ERRORS\s+(\d+)\s+WARNINGS\s+(\d+)/);
  if (inline) { errors = Number(inline[1]); warnings = Number(inline[2]); }

  if (errors === null) {
    /* freshness.mjs reports and does not count. Its baseline note in
       §12 is "reports only", and inventing a zero here would turn a
       report into a gate it is not. */
    errors = out.exit_code === 0 ? 0 : 1;
    warnings = 0;
  }
  return { errors, warnings: warnings ?? 0, unparsed: e1 === null && both === null && inline === null };
}

/** The lines a reviewer needs, verbatim. Never a paraphrase. */
export function excerptOf(out, { keep = 24 } = {}) {
  const lines = `${out.stdout}\n${out.stderr}`.split('\n').filter((l) => l.trim());
  const interesting = lines.filter((l) => /error|warning|fail|✗|not ok|ERRORS|WARNINGS|unverified/i.test(l));
  const chosen = (interesting.length ? interesting : lines).slice(0, keep);
  return chosen.join('\n').slice(0, 4000);
}

/**
 * The four validators, each against its recorded baseline.
 *
 * @returns {{checks:Array, comparisons:Array, baseline:object}}
 */
export function runValidators({ root = REPO_ROOT, asOf = null } = {}) {
  const baseline = readBaseline({ root });
  const checks = [];
  const comparisons = [];

  for (const v of VALIDATORS) {
    const args = [`tools/${v.name}`];
    if (v.name === 'freshness.mjs' && asOf) args.push(asOf);
    const out = run(process.execPath, args, { cwd: root });
    const parsed = parseValidator(v.name, out);
    const base = baseline.checks[v.name];
    const cmp = compare(parsed, base);
    comparisons.push({ name: v.name, ...cmp, ...parsed, baseline: base });

    checks.push({
      name: `tools/${v.name}`,
      command: `${v.command}${v.name === 'freshness.mjs' && asOf ? ` ${asOf}` : ''}`,
      exit_code: out.ran ? out.exit_code : 127,
      errors: out.ran ? parsed.errors : 1,
      warnings: parsed.warnings,
      baseline_errors: base.errors,
      baseline_warnings: base.warnings,
      new_findings: newFindingsFor(v.name, parsed, base, out, cmp),
      output_excerpt: out.ran ? excerptOf(out) : `NOT RUN — ${out.stderr}. A validator that could not be executed is not a validator that passed.`,
    });
  }

  return { checks, comparisons, baseline };
}

function newFindingsFor(name, parsed, base, out, cmp) {
  const findings = [];
  if (!out.ran) findings.push(`${name} could not be executed: ${out.stderr}`);
  if (parsed.errors > base.errors) {
    findings.push(...`${out.stdout}\n${out.stderr}`.split('\n').filter((l) => /error/i.test(l) && l.trim()).slice(0, 12).map((l) => l.trim()));
    if (!findings.length) findings.push(`${name} reported ${parsed.errors} error(s) against a baseline of ${base.errors} and this parser could not name them — read the excerpt`);
  }
  if (parsed.warnings > base.warnings) {
    findings.push(...`${out.stdout}\n${out.stderr}`.split('\n').filter((l) => /warning/i.test(l) && l.trim()).slice(0, 12).map((l) => l.trim()));
  }
  if (cmp.verdict === 'below_baseline') findings.push(cmp.why);
  return findings;
}

/**
 * The agent suites. Not part of §12's baseline — their baseline is
 * "every test passes", which is a different kind of claim and is
 * recorded as such.
 */
export function runAgentSuites({ root = REPO_ROOT, suites = AGENT_SUITES, only = null } = {}) {
  const chosen = only ? suites.filter((s) => only.some((o) => s.includes(o))) : suites;
  const checks = [];
  for (const s of chosen) {
    const out = run(process.execPath, ['--test', s], { cwd: root });
    const pass = Number((`${out.stdout}`.match(/^# pass (\d+)/m) ?? [])[1] ?? 0);
    const fail = Number((`${out.stdout}`.match(/^# fail (\d+)/m) ?? [])[1] ?? (out.exit_code === 0 ? 0 : 1));
    checks.push({
      name: s,
      command: `node --test ${s}`,
      exit_code: out.ran ? out.exit_code : 127,
      errors: fail,
      warnings: 0,
      baseline_errors: 0,
      baseline_warnings: 0,
      new_findings: fail > 0
        ? `${out.stdout}`.split('\n').filter((l) => l.startsWith('not ok')).slice(0, 12)
        : [],
      output_excerpt: out.ran ? `# pass ${pass} # fail ${fail}\n${excerptOf(out, { keep: 12 })}` : `NOT RUN — ${out.stderr}`,
    });
  }
  return checks;
}

/** The contract satisfiability check. Cheap, and it is the one thing
 *  that proves a contract change did not make a contract
 *  unsatisfiable by its own fixture. */
export function runContractCheck({ root = REPO_ROOT } = {}) {
  const out = run(process.execPath, ['agent/schemas/cli.mjs', 'check'], { cwd: root });
  const m = `${out.stdout}`.match(/(\d+)\s+contracts,\s+(\d+)\s+satisfiable[^,]*,\s+(\d+)\s+not/);
  const notSatisfiable = m ? Number(m[3]) : (out.exit_code === 0 ? 0 : 1);
  return {
    name: 'agent/schemas/cli.mjs check',
    command: 'node agent/schemas/cli.mjs check',
    exit_code: out.ran ? out.exit_code : 127,
    errors: notSatisfiable,
    warnings: 0,
    baseline_errors: 0,
    baseline_warnings: 0,
    new_findings: notSatisfiable ? [`${notSatisfiable} contract(s) are not satisfiable by their own fixture`] : [],
    output_excerpt: out.ran ? excerptOf(out, { keep: 6 }) : `NOT RUN — ${out.stderr}`,
  };
}

/**
 * The browser suite, when the change needs it.
 *
 * `required` is decided by the caller from the changed paths
 * (`scope.requiresBrowserQA`). What this function guarantees is the
 * half that matters: when it IS required and the suite did not run,
 * the check that comes back has a non-zero exit and names the
 * reason. There is no argument that turns that off.
 */
export async function runBrowserCheck({ required, quick = false } = {}) {
  if (!required) {
    return {
      required: false,
      check: null,
      note: 'not required: nothing in the approved scope touches a page, a stylesheet, a module or a locale, so there is nothing a rendered page could show that the four validators cannot.',
    };
  }
  const run_ = await runBrowserQA({ quick });
  return { required: true, run: run_, check: browserQACheck(run_) };
}

/** The public/private boundary check, always run. It costs a tree
 *  walk and it is the only thing standing between a credential and
 *  the deployed site. */
export function runBoundaryCheck({ root = REPO_ROOT, baselineWarnings = null } = {}) {
  const c = boundaryCheck({ root });
  return baselineWarnings === null ? c : { ...c, baseline_warnings: baselineWarnings };
}

/**
 * Assemble a QAResult body from a set of checks.
 *
 * The verdict is DERIVED here and the contract cross-checks it: a
 * `pass` over a check that reported errors, a non-zero exit, or more
 * warnings than its baseline is refused by
 * `agent/schemas/contracts/qa-result.mjs`. Two independent
 * derivations of the same fact, which is normally the thing this
 * repository forbids — and is right here, because one of them is the
 * agent's claim and the other is the gate's check of it.
 */
export function verdictFor(checks) {
  const failed = checks.filter((c) => c.errors > 0 || c.exit_code !== 0);
  if (failed.length) return 'fail';
  const risen = checks.filter((c) => c.warnings > c.baseline_warnings);
  const findings = checks.filter((c) => (c.new_findings ?? []).length > 0);
  if (risen.length || findings.length) return 'pass_with_findings';
  return 'pass';
}

export function blockingFindings(checks) {
  return checks
    .filter((c) => c.errors > 0 || c.exit_code !== 0 || c.warnings > c.baseline_warnings)
    .flatMap((c) => ((c.new_findings ?? []).length
      ? c.new_findings.map((f) => `${c.name}: ${f}`)
      : [`${c.name}: exit ${c.exit_code}, ${c.errors} error(s), ${c.warnings} warning(s) against a baseline of ${c.baseline_errors}/${c.baseline_warnings}`]));
}
