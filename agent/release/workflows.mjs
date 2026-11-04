/* ============================================================
   agent/release/workflows.mjs — every way a workflow could publish the site

   A gate that sits BESIDE the publishing path gates nothing. This module
   reads every file under .github/workflows/ and answers the question the
   deploy gate depends on: is `pages.yml` the ONLY publisher, and is the gate
   IN its path — so that a failing gate leaves no artifact to deploy?

   NO YAML LIBRARY. This repository has no dependencies and a workflow file's
   structure is regular enough to read by indentation. The reader is therefore
   deliberately narrow and FAILS CLOSED: a file it cannot read is a problem,
   never "no findings". It reads the shape GitHub Actions workflows in this
   repository have; a construct it does not understand (an anchor, a matrix
   include) is reported by the line it could not place rather than skipped.

   WHAT IT CANNOT SEE, stated before the checks rather than after:
     · a workflow on a branch that is not main, which GitHub runs from that
       branch's copy — the gate's own ref check (gate.mjs) and the
       `github-pages` environment's branch rule are the controls for that;
     · a reusable workflow or a composite action that publishes from inside
       another repository: `uses:` of anything but the listed actions and
       `actions/` is reported, not followed;
     · a setting. Which workflows are enabled, who may approve a deployment
       and whether Pages' source is "GitHub Actions" are not in the tree.
   ============================================================ */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  BUILD_JOB, DEPLOY_ENVIRONMENT, DEPLOY_JOB, GATE_COMMAND, PUBLISHING_WORKFLOW, PUBLISH_EVENTS, REQUIRED_GATE_JOBS,
} from './policy.mjs';

/** Actions and commands that publish a site. A workflow using one is a
 *  publisher whatever it is called. */
export const PUBLISHING_USES = Object.freeze([
  /^actions\/deploy-pages@/, /^actions\/upload-pages-artifact@/, /^peaceiris\/actions-gh-pages@/,
  /^JamesIves\/github-pages-deploy-action@/, /^crazy-max\/ghaction-github-pages@/, /^rayluo\/github-pages-deploy@/,
]);
export const PUBLISHING_RUN = Object.freeze([
  /git\s+push\b[^\n]*\b(?:gh-pages|pages)\b/, /pages\/deployments/, /gh\s+api\b[^\n]*\bpages\b/,
]);
/** Patterns in a gate job that turn a failing CHECK into a pass. They are
 *  anchored on `node`, the interpreter every check here is run with, because a
 *  bare `|| true` also appears in `$(git merge-base … || true)` — a fallback
 *  for a lookup, not a swallowed gate — and a rule that cries wolf on pages.yml
 *  would be switched off. `set +e` is flagged wherever it appears. */
export const BYPASS_RUN = Object.freeze([
  /\bnode\b[^\n$]*\|\|\s*(?:true\b|:|exit\s+0\b)/, /\bnode\b[^\n]*;\s*(?:true|exit\s+0)\s*$/m, /\bset\s+\+e\b/,
]);

const TRUTHY = /^(?:true|1|yes|\$\{\{.*\}\})$/i;

/** Lines with comments removed. A `#` starts a comment at the start of a line
 *  or after whitespace; the narrow reader would rather lose a comment than
 *  keep a bypass hidden inside one. */
function cleanLines(text) {
  return text.split('\n').map((l) => l.replace(/\r$/, '')).map((l) => (/^\s*#/.test(l) ? '' : l.replace(/\s+#\s.*$/, '')));
}
const indentOf = (l) => l.match(/^ */)[0].length;
const list = (v) => v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

/** Parse one workflow. Never throws; unplaceable content goes in `problems`. */
export function parseWorkflow(text) {
  const lines = cleanLines(text);
  const problems = [];
  const wf = { triggers: {}, jobs: {}, permissions: null, problems };

  if (!/^jobs:\s*$/m.test(lines.join('\n'))) problems.push('no top-level "jobs:" block');

  /* triggers */
  const onIdx = lines.findIndex((l) => /^(?:on|"on"|'on'):/.test(l));
  if (onIdx < 0) problems.push('no top-level "on:" block');
  else {
    const rest = lines[onIdx].replace(/^[^:]+:\s*/, '');
    if (rest) for (const t of list(rest)) wf.triggers[t] = { raw: '' };
    else {
      let cur = null;
      for (let i = onIdx + 1; i < lines.length && (indentOf(lines[i]) > 0 || !lines[i].trim()); i++) {
        const m = /^( {2})([A-Za-z_]+):\s*(.*)$/.exec(lines[i]);
        if (m) { cur = m[2]; wf.triggers[cur] = { raw: m[3] }; continue; }
        if (cur && lines[i].trim()) wf.triggers[cur].raw += `\n${lines[i].trim()}`;
      }
    }
  }

  /* top-level permissions */
  const pIdx = lines.findIndex((l) => /^permissions:/.test(l));
  if (pIdx >= 0) {
    const rest = lines[pIdx].replace(/^permissions:\s*/, '');
    wf.permissions = {};
    if (rest) wf.permissions['*'] = rest;
    for (let i = pIdx + 1; i < lines.length && (indentOf(lines[i]) > 0 || !lines[i].trim()); i++) {
      const m = /^\s+([a-z-]+):\s*(\S+)/.exec(lines[i]);
      if (m) wf.permissions[m[1]] = m[2];
    }
  }

  /* jobs */
  const jIdx = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (jIdx >= 0) {
    let id = null;
    for (let i = jIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() && indentOf(l) === 0) break;
      const m = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(l);
      if (m) { id = m[1]; wf.jobs[id] = { id, lines: [], line: i + 1 }; continue; }
      if (id) wf.jobs[id].lines.push(l);
      else if (l.trim()) problems.push(`line ${i + 1}: content under "jobs:" before any job: ${l.trim().slice(0, 60)}`);
    }
  }

  for (const job of Object.values(wf.jobs)) {
    const body = job.lines.join('\n');
    job.text = body;
    job.needs = [];
    job.ifs = [];
    job.continueOnError = [];
    job.uses = [];
    job.permissions = {};
    job.environment = null;
    job.steps = [];

    let inSteps = false;
    let step = null;
    let inRun = false;
    let runIndent = 0;
    for (let k = 0; k < job.lines.length; k++) {
      const l = job.lines[k];
      if (!l.trim()) continue;
      const ind = indentOf(l);
      if (inRun && ind > runIndent) { step.run += `${l.trim()}\n`; continue; }
      inRun = false;

      if (ind === 4) {
        inSteps = /^ {4}steps:\s*$/.test(l);
        let m;
        if ((m = /^ {4}needs:\s*(.*)$/.exec(l))) {
          if (m[1]) job.needs = list(m[1]);
          else for (let j = k + 1; j < job.lines.length && /^ {6}- /.test(job.lines[j]); j++) job.needs.push(job.lines[j].replace(/^ *- */, '').trim());
        } else if ((m = /^ {4}if:\s*(.*)$/.exec(l))) job.ifs.push({ where: 'job', expr: m[1] });
        else if ((m = /^ {4}continue-on-error:\s*(.*)$/.exec(l))) job.continueOnError.push({ where: 'job', value: m[1].trim() });
        else if ((m = /^ {4}environment:\s*(\S+)?\s*$/.exec(l))) {
          job.environment = m[1] ?? null;
          if (!m[1]) { const n = /^ {6}name:\s*(\S+)/.exec(job.lines[k + 1] ?? ''); if (n) job.environment = n[1]; }
        } else if (/^ {4}permissions:/.test(l)) {
          for (let j = k + 1; j < job.lines.length && /^ {6}/.test(job.lines[j]); j++) {
            const p = /^\s+([a-z-]+):\s*(\S+)/.exec(job.lines[j]);
            if (p) job.permissions[p[1]] = p[2];
          }
        }
        continue;
      }
      if (inSteps && /^ {6}- /.test(l)) {
        step = { line: l, uses: null, run: '', ifExpr: null, continueOnError: null, name: null };
        job.steps.push(step);
      }
      if (inSteps && step) {
        let m;
        if ((m = /(?:^|\s|-\s)uses:\s*(\S+)/.exec(l))) { step.uses = m[1]; job.uses.push(m[1]); }
        if ((m = /(?:^|\s|-\s)name:\s*(.+)$/.exec(l)) && !step.name) step.name = m[1];
        if ((m = /^\s+(?:- )?if:\s*(.*)$/.exec(l))) { step.ifExpr = m[1]; job.ifs.push({ where: 'step', expr: m[1] }); }
        if ((m = /^\s+(?:- )?continue-on-error:\s*(.*)$/.exec(l))) { step.continueOnError = m[1].trim(); job.continueOnError.push({ where: 'step', value: m[1].trim() }); }
        if ((m = /^(\s+)(?:- )?run:\s*(.*)$/.exec(l))) {
          const isBlock = /^[|>][+-]?$/.test(m[2].trim());
          step.run += isBlock ? '' : `${m[2]}\n`;
          if (isBlock) { inRun = true; runIndent = indentOf(l); }
        }
      }
    }
  }
  return wf;
}

const check = (id, ok, why, extra = {}) => ({ id, ok: Boolean(ok), why, ...extra });

/** The checks on the publishing workflow itself. */
export function auditPublisher(wf) {
  const out = [];
  const trig = Object.keys(wf.triggers);
  const badTriggers = trig.filter((t) => !PUBLISH_EVENTS.includes(t));
  out.push(check('P1-triggers', trig.length > 0 && badTriggers.length === 0,
    badTriggers.length ? `triggers outside ${PUBLISH_EVENTS.join(' / ')}: ${badTriggers.join(', ')}. A publish that can be started by a pull request, a schedule, a dispatch from another workflow or a repository event is a publish nobody merged.` : `triggers are ${trig.join(', ')} only`));
  const pushRaw = wf.triggers.push?.raw ?? '';
  out.push(check('P1b-push-branches', !('push' in wf.triggers) || /branches:\s*\[?\s*main\s*\]?\s*($|\n)/.test(pushRaw) && !/branches-ignore|tags|paths-ignore/.test(pushRaw),
    "push is not restricted to exactly the main branch"));

  const missing = REQUIRED_GATE_JOBS.filter((j) => !wf.jobs[j]);
  out.push(check('P2-gate-jobs-exist', missing.length === 0, missing.length ? `gate job(s) missing: ${missing.join(', ')}` : `${REQUIRED_GATE_JOBS.length} gate jobs present`));

  const build = wf.jobs[BUILD_JOB];
  const deploy = wf.jobs[DEPLOY_JOB];
  const notNeeded = REQUIRED_GATE_JOBS.filter((j) => !(build?.needs ?? []).includes(j));
  out.push(check('P3-build-needs-gates', build && notNeeded.length === 0, !build ? 'no build job' : notNeeded.length ? `build does not need: ${notNeeded.join(', ')}. A gate the artifact does not wait for is a gate that can fail while the site publishes.` : 'build waits for every gate job'));
  out.push(check('P4-deploy-needs-build', deploy && (deploy.needs ?? []).includes(BUILD_JOB), deploy ? ((deploy.needs ?? []).includes(BUILD_JOB) ? 'deploy waits for build' : 'deploy does not need build') : 'no deploy job'));
  out.push(check('P5-deploy-environment', deploy && deploy.environment === DEPLOY_ENVIRONMENT && deploy.uses.some((u) => /^actions\/deploy-pages@/.test(u)),
    deploy ? `deploy uses environment ${deploy.environment ?? 'none'}${deploy.uses.some((u) => /^actions\/deploy-pages@/.test(u)) ? '' : ' and does not use actions/deploy-pages'}` : 'no deploy job'));

  const governed = [...REQUIRED_GATE_JOBS, BUILD_JOB, DEPLOY_JOB].map((j) => wf.jobs[j]).filter(Boolean);
  const skippable = governed.filter((j) => j.ifs.length);
  out.push(check('P6a-no-conditions', skippable.length === 0, skippable.length ? `a condition on ${skippable.map((j) => `${j.id} (${j.ifs.map((i) => `${i.where} if: ${i.expr}`).join('; ')})`).join(', ')}: a gate that can be skipped by an expression is optional` : 'no job or step on the publishing path carries an if:'));
  const soft = governed.filter((j) => j.continueOnError.some((c) => TRUTHY.test(c.value)));
  out.push(check('P6b-no-continue-on-error', soft.length === 0, soft.length ? `continue-on-error on ${soft.map((j) => j.id).join(', ')}` : 'no continue-on-error on the publishing path'));
  const bypass = governed.flatMap((j) => j.steps.flatMap((s) => BYPASS_RUN.filter((re) => re.test(s.run)).map((re) => `${j.id}: ${s.name ?? s.line.trim()} matches ${re}`)));
  out.push(check('P6c-no-failure-swallowing', bypass.length === 0, bypass.length ? `command(s) that turn a failure into a pass: ${bypass.join(' · ')}` : 'no step on the publishing path swallows a failing exit code'));

  /* the release gate is IN the path */
  const steps = build?.steps ?? [];
  const gateIdx = steps.findIndex((s) => s.run.includes(GATE_COMMAND));
  const uploadIdx = steps.findIndex((s) => /^actions\/upload-pages-artifact@/.test(s.uses ?? ''));
  out.push(check('P7-release-gate-before-upload', gateIdx >= 0 && uploadIdx >= 0 && gateIdx < uploadIdx,
    gateIdx < 0 ? `build runs no \`${GATE_COMMAND}\` step` : uploadIdx < 0 ? 'build uploads no artifact' : gateIdx > uploadIdx ? 'the release gate runs AFTER the artifact is uploaded' : 'the release gate runs in build, before the artifact is uploaded'));

  const topWrite = Object.entries(wf.permissions ?? {}).filter(([, v]) => /write/.test(v));
  out.push(check('P8-least-privilege', wf.permissions && topWrite.length === 0, !wf.permissions ? 'no workflow-level permissions block: the token default applies' : topWrite.length ? `workflow-level write permission(s): ${topWrite.map(([k]) => k).join(', ')}` : 'workflow-level permissions are read-only'));
  const writers = Object.values(wf.jobs).filter((j) => Object.values(j.permissions).some((v) => /write/.test(v))).map((j) => j.id);
  out.push(check('P8b-only-deploy-writes', writers.every((j) => j === DEPLOY_JOB), writers.length ? `write permission held by: ${writers.join(', ')}${writers.every((j) => j === DEPLOY_JOB) ? ' (the deploy job only, as it must)' : ''}` : 'no job holds a write permission'));
  return out;
}

/** Read and audit every workflow under `root`. */
export function auditWorkflows({ root, dir = '.github/workflows', files = null } = {}) {
  const folder = join(root, dir);
  const names = files ?? (existsSync(folder) ? readdirSync(folder).filter((n) => /\.ya?ml$/.test(n)).sort() : []);
  const workflows = names.map((name) => {
    const path = `${dir}/${name}`;
    let text = '';
    try { text = readFileSync(join(root, path), 'utf8'); } catch (e) { return { path, readable: false, problems: [e.message], publishes: false }; }
    const wf = parseWorkflow(text);
    const publishing = [];
    for (const job of Object.values(wf.jobs)) {
      for (const u of job.uses) if (PUBLISHING_USES.some((re) => re.test(u))) publishing.push(`${job.id}: uses ${u}`);
      for (const s of job.steps) for (const re of PUBLISHING_RUN) if (re.test(s.run)) publishing.push(`${job.id}: runs ${re}`);
      for (const [k, v] of Object.entries(job.permissions)) if (k === 'pages' && /write/.test(v)) publishing.push(`${job.id}: holds pages: write`);
    }
    for (const [k, v] of Object.entries(wf.permissions ?? {})) if (k === 'pages' && /write/.test(v)) publishing.push(`workflow: holds pages: write`);
    return { path, readable: true, wf, problems: wf.problems, publishes: publishing.length > 0, publishing };
  });

  const checks = [];
  const publishers = workflows.filter((w) => w.publishes).map((w) => w.path);
  checks.push(check('W1-one-publisher', publishers.length === 1 && publishers[0] === PUBLISHING_WORKFLOW,
    publishers.length === 0 ? `no workflow publishes; ${PUBLISHING_WORKFLOW} was expected to` : publishers.length === 1 && publishers[0] === PUBLISHING_WORKFLOW ? `${PUBLISHING_WORKFLOW} is the only workflow that publishes` : `publishing workflows: ${publishers.join(', ')} (only ${PUBLISHING_WORKFLOW} may)`,
    { publishers }));
  const unreadable = workflows.filter((w) => !w.readable || w.problems.length);
  checks.push(check('W2-readable', unreadable.length === 0, unreadable.length ? `could not place: ${unreadable.map((w) => `${w.path} (${w.problems.slice(0, 2).join('; ')})`).join(' · ')}` : `${workflows.length} workflow file(s) read in full`));
  const pub = workflows.find((w) => w.path === PUBLISHING_WORKFLOW && w.readable);
  if (pub) checks.push(...auditPublisher(pub.wf));
  else checks.push(check('P0-publisher-present', false, `${PUBLISHING_WORKFLOW} is absent or unreadable`));
  return { ok: checks.every((c) => c.ok), checks, workflows: workflows.map((w) => ({ path: w.path, publishes: w.publishes, publishing: w.publishing ?? [], jobs: w.wf ? Object.keys(w.wf.jobs) : [] })) };
}
