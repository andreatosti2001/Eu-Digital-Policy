/* ============================================================
   QAResult — what the checks actually said

   The four validators in tools/ are this project's test suite, and
   their recorded output at docs/CURRENT-ARCHITECTURE.md §12 is the
   baseline every later run is measured against. That is why every
   check here carries its baseline alongside its result: "0 errors,
   5 warnings" is a pass against this repository and a regression
   against one that had four.

   A new warning is a finding, not noise. So a check whose warning
   count rose must name what rose, and a verdict of `pass` is
   refused whenever anything did.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { QA_VERDICTS } from '../types.mjs';

const Check = F.object({
  name: F.string('The check\'s name.'),
  command: F.string('Exactly how it was run.'),
  exit_code: F.int('What it exited with.', { min: 0 }),
  errors: F.int('Errors reported.', { min: 0 }),
  warnings: F.int('Warnings reported.', { min: 0 }),
  baseline_errors: F.int('Errors in the recorded baseline this is measured against.', { min: 0 }),
  baseline_warnings: F.int('Warnings in the recorded baseline.', { min: 0 }),
  new_findings: F.array(F.string('One finding, named — file, line, what it says.'), 'What is new since the baseline. A count is not a finding.'),
  output_excerpt: F.text('The part of the output that matters, verbatim. Never a summary of what it probably said.', { nullable: true }),
}, 'One check and its result against its baseline.');

export const QAResult = defineContract({
  name: 'QAResult',
  kind: 'result',
  id_field: 'qa_id',
  doc: 'The result of running checks against a proposal, a change, or the repository, each measured against its recorded baseline.',
  fields: {
    qa_id: F.id('This result\'s id.'),
    target_kind: F.enum(['proposal', 'change_record', 'repository', 'trace'], 'What was checked.'),
    target_id: F.string('Which one. For a repository-wide run, the commit or branch.'),
    ran_at: F.iso('When the checks were run.'),
    ran_by: F.string('Which agent or person ran them.'),
    environment: F.string('Where they ran — node version, platform. A result nobody can reproduce is an assertion.', { nullable: true }),
    checks: F.array(Check, 'Every check run. Never empty: a QAResult with no checks is a claim that nothing was checked.', { min: 1 }),
    verdict: F.enum(QA_VERDICTS, 'pass · pass_with_findings · fail. Derived from the checks and cross-checked against them here.', { epistemic: 'inference' }),
    blocking_findings: F.array(F.string('A finding that must be resolved before this may land.'), 'Findings that block.'),
  },
  forbidden: {
    passed: 'A boolean cannot hold "passed, but a new warning appeared". Use verdict.',
    score: 'There is no score. There are errors, warnings, and a baseline.',
    ignored_warnings: 'A warning is not ignored here. It is named in new_findings and explained, or it is not new.',
  },
  rules: [
    (r) => {
      const bad = (r.checks ?? []).filter((c) => c.errors > 0 || c.exit_code !== 0);
      return r.verdict === 'pass' && bad.length
        ? [`verdict is "pass" but ${bad.map((c) => c.name).join(', ')} reported errors or a non-zero exit`]
        : [];
    },
    (r) => {
      const risen = (r.checks ?? []).filter((c) => c.warnings > c.baseline_warnings);
      return r.verdict === 'pass' && risen.length
        ? [`verdict is "pass" but ${risen.map((c) => c.name).join(', ')} reported more warnings than the baseline: a new warning is a finding, not noise`]
        : [];
    },
    (r) => {
      const risen = (r.checks ?? []).filter((c) => c.warnings > c.baseline_warnings && c.new_findings.length === 0);
      return risen.length
        ? [`${risen.map((c) => c.name).join(', ')} rose above the baseline warning count but named no new finding: say what the new warning is`]
        : [];
    },
    (r) => {
      const failed = (r.checks ?? []).some((c) => c.errors > 0 || c.exit_code !== 0);
      return r.verdict === 'fail' && !failed
        ? ['verdict is "fail" but no check reported an error or a non-zero exit']
        : [];
    },
    (r) => (r.verdict === 'pass_with_findings' && !(r.checks ?? []).some((c) => c.new_findings.length > 0)
      ? ['verdict is "pass_with_findings" but no check named a finding']
      : []),
  ],
});
