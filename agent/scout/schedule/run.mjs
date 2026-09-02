#!/usr/bin/env node
/* ============================================================
   agent/scout/schedule/run.mjs — what the workflow invokes

     node agent/scout/schedule/run.mjs [--live] [--dry]
                                       [--fail-on ok|degraded|never]
                                       [--max-docs=N]

   --mock is the default, same as agent/scout/cli.mjs and for the
   same reason: reaching out to five regulators should be something
   you asked for in as many words. The scheduled workflow passes
   --live explicitly — see .github/workflows/source-scout.yml.

   This does not replace agent/scout/cli.mjs. It runs the same
   Scout, the same way, and adds exactly two things cli.mjs does
   not: a digest written to a committed location
   (agent/scout/schedule/digest.mjs), and machine-readable step
   outputs for the workflow that calls it.

   EXIT CODES, matching the retired Scout's design because it was
   sound and is restated in docs/AGENT-RUNBOOK.md:

     0   the run produced a digest — including a degraded one
     1   the run threw before producing one
     2   --fail-on degraded was set and the run was degraded

   'degraded' (gaps.length > 0) exits 0 by default because, at the
   time this was written, every live endpoint is refused by this
   environment's egress policy — see docs/SOURCE-SCOUT.md "FINDING".
   That is a fact about the network, reported every run, and it must
   not turn the schedule red every week on its own. A crash is red.
   Escalating on any gap is `--fail-on degraded`, an operator's
   choice.
   ============================================================ */

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Tracer } from '../../observability/tracer.mjs';
import { JsonlSink } from '../../observability/sink.mjs';
import { Scout, SCOUT_AGENT } from '../scout.mjs';
import { HttpTransport, MockTransport } from '../transport.mjs';
import { RecordStore, MemoryRecordStore } from '../store.mjs';
import { MOCK_DOCUMENTS, MOCK_ENDPOINTS } from '../fixtures.mjs';
import { endpointsByPriority } from '../authorities.mjs';
import { buildDigest, digestId } from './digest.mjs';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const DIGESTS_DIR = join(REPO_ROOT, 'agent', 'scout', 'digests');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) { const m = argv.find((a) => a.startsWith(`--${name}=`)); return m ? m.split('=')[1] : fallback; }
  return argv[i + 1]?.startsWith('--') ? true : (argv[i + 1] ?? true);
};

const live = has('--live');
const dry = has('--dry');
const failOn = String(flag('fail-on', 'ok'));
const maxDocsArg = argv.find((a) => a.startsWith('--max-docs='));
const max_documents_per_endpoint = maxDocsArg ? Number(maxDocsArg.split('=')[1]) : undefined;

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

/* Public run identifiers only — no token, no secret, no full env. */
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

const transport = live ? new HttpTransport() : new MockTransport(MOCK_DOCUMENTS);
const endpoints = live ? endpointsByPriority() : MOCK_ENDPOINTS;
const store = dry ? new MemoryRecordStore({ allowSimulated: !live }) : new RecordStore({ allowSimulated: !live });
const tracer = new Tracer({ service: 'eu-digital-policy', sink: new JsonlSink(), attributes: { agent: SCOUT_AGENT, scheduled: true } });

const scout = new Scout({
  tracer, transport, store, endpoints,
  limits: max_documents_per_endpoint ? { max_documents_per_endpoint } : {},
});

const started_at = new Date().toISOString();

try {
  const result = await scout.run();
  const finished_at = new Date().toISOString();

  const { digest, markdown } = buildDigest({
    result, mode: live ? 'live' : 'mock', started_at, finished_at, environment,
    sourcesPath: join(REPO_ROOT, 'data', 'sources.json'),
    digestsDir: DIGESTS_DIR,
  });
  digest.status = digest.totals.gaps > 0 ? 'degraded' : 'ok';

  let digestPath = null, summaryPath = null;
  if (!dry) {
    mkdirSync(DIGESTS_DIR, { recursive: true });
    digestPath = join(DIGESTS_DIR, `${digest.digest_id}.json`);
    summaryPath = join(DIGESTS_DIR, `${digest.digest_id}.md`);
    writeFileSync(digestPath, `${JSON.stringify(digest, null, 2)}\n`, 'utf8');
    writeFileSync(summaryPath, `${markdown}\n`, 'utf8');
  }

  console.log(markdown);
  writeJobSummary(markdown);

  setOutput('digest_id', digest.digest_id);
  setOutput('status', digest.status);
  setOutput('trace_id', result.trace_id);
  setOutput('candidates', digest.totals.candidates);
  setOutput('new_against_bibliography', digest.totals.new_against_bibliography);
  setOutput('new_against_prior_digests', digest.totals.new_against_prior_digests);
  setOutput('high_relevance', digest.totals.high_relevance);
  setOutput('gaps', digest.totals.gaps);
  setOutput('failed_by_egress_policy', digest.totals.failed_by_egress_policy);
  setOutput('digest_path', digestPath ?? '');
  setOutput('summary_path', summaryPath ?? '');
  setOutput('has_digest', dry ? 'false' : 'true');

  if (digest.status === 'degraded' && failOn === 'degraded') {
    console.error(`\nsource-scout: degraded and --fail-on degraded is set — ${digest.totals.gaps} gap(s)`);
    process.exit(2);
  }
  process.exit(0);
} catch (err) {
  const message = err?.stack ?? err?.message ?? String(err);
  console.error(`source-scout: the run threw and produced no digest\n${message}`);
  writeJobSummary(`## Source Scout — run failed\n\nThe run threw before it could produce a digest.\n\n\`\`\`\n${String(err?.message ?? err).slice(0, 2000)}\n\`\`\`\n`);
  setOutput('status', 'failed');
  setOutput('has_digest', 'false');
  process.exit(1);
}
