#!/usr/bin/env node
/* ============================================================
   agent/scout/cli.mjs — how the workflow runs the Scout

     node agent/scout/cli.mjs run [--dry-run] [--limit 60]
                                  [--timeout-ms 20000]
                                  [--fail-on ok|degraded|failed|never]
                                  [--dir <reports dir>]

   Exit codes are the workflow's failure signal, so they are
   deliberate:

     0   the run produced a report — including a degraded one
     1   the run produced nothing usable (every retrieval failed,
         or the Scout threw)
     2   --fail-on degraded was set and the run was degraded

   'degraded' exiting 0 by default is the important one. A dead
   feed must not turn the schedule red every week until someone
   disables the workflow to stop the noise — but it must not
   vanish either, so it lands in the report, in the job summary,
   and in the pull request. Escalation is a policy an operator
   sets, not a default that trains people to ignore a red run.

   NOTHING SECRET IS READ OR PRINTED. The Scout takes no
   credential: the only environment variables consulted are the
   public GitHub run identifiers recorded in the report so a run
   can be traced back to its workflow.
   ============================================================ */

import { appendFileSync } from 'node:fs';
import { runScout, REPORTS_DIR } from './scout.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'run';
const has = (n) => argv.includes(`--${n}`);
const flag = (n, fallback = null) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

if (cmd !== 'run') {
  console.error(`unknown command "${cmd}"\n  usage: node agent/scout/cli.mjs run [--dry-run] [--limit n] [--timeout-ms n] [--fail-on ok|degraded|failed|never] [--dir path]`);
  process.exit(1);
}

/* Public run identifiers only. No token, no secret, no full env. */
const environment = {
  env: process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local',
  node: process.version,
  runner_os: process.env.RUNNER_OS ?? null,
  workflow: process.env.GITHUB_WORKFLOW ?? null,
  run_id: process.env.GITHUB_RUN_ID ?? null,
  run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  event_name: process.env.GITHUB_EVENT_NAME ?? null,
  ref_name: process.env.GITHUB_REF_NAME ?? null,
  sha: process.env.GITHUB_SHA ?? null,
};

const failOn = String(flag('fail-on', 'failed'));
const dryRun = has('dry-run');

/** GitHub Actions step output — consumed by the workflow's PR step. */
function setOutput(key, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  const v = String(value ?? '');
  appendFileSync(file, v.includes('\n') ? `${key}<<__EOF__\n${v}\n__EOF__\n` : `${key}=${v}\n`, 'utf8');
}

function writeJobSummary(text) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  appendFileSync(file, `${text}\n`, 'utf8');
}

try {
  const { report, summary, reportPath, summaryPath, trace_id, wrote } = await runScout({
    write: !dryRun,
    dir: String(flag('dir', REPORTS_DIR)),
    limit: Number(flag('limit', 60)),
    timeoutMs: Number(flag('timeout-ms', 20000)),
    environment,
  });

  const t = report.totals;

  /* The human-readable summary is a RENDERING of the report, not
     the record of the run. The record is the trace. */
  console.log(summary);
  writeJobSummary(summary);

  setOutput('report_id', report.report_id);
  setOutput('status', report.status);
  setOutput('trace_id', trace_id);
  setOutput('new_candidates', t.new_candidates);
  setOutput('high_relevance', t.high_relevance);
  setOutput('duplicates', t.duplicates);
  setOutput('failed_retrievals', t.retrievals_failed);
  setOutput('unresolved_problems', t.unresolved_problems);
  setOutput('report_path', reportPath);
  setOutput('summary_path', summaryPath);
  /* A pull request is worth opening when there is something in it. */
  setOutput('has_report', wrote ? 'true' : 'false');

  if (report.status === 'failed' || failOn === 'ok') {
    console.error(`\nsource-scout: status ${report.status} — ${t.retrievals_failed}/${t.retrievals_attempted} retrievals failed`);
    process.exit(1);
  }
  if (report.status === 'degraded' && failOn === 'degraded') {
    console.error(`\nsource-scout: degraded and --fail-on degraded is set — ${t.unresolved_problems} unresolved problem(s)`);
    process.exit(2);
  }
  process.exit(0);
} catch (err) {
  /* A thrown Scout is a broken Scout, not a quiet zero. */
  const message = err?.stack ?? err?.message ?? String(err);
  console.error(`source-scout: the run threw and produced no report\n${message}`);
  writeJobSummary(`## Source Scout — run failed\n\nThe Scout threw before it could write a report.\n\n\`\`\`\n${String(err?.message ?? err).slice(0, 2000)}\n\`\`\`\n`);
  setOutput('status', 'failed');
  setOutput('has_report', 'false');
  process.exit(1);
}
