/* ============================================================
   agent/production/traceability.mjs — every website modification
   traceable to its evidence and its execution trace, measured

   WHAT SESSION 29 REQUIRES. "The system must remain observable
   end-to-end. No agent may become invisible simply because it is
   automated. Every website modification must remain traceable to its
   originating evidence and execution trace."

   THE QUESTION THIS FILE ANSWERS, precisely. Not "is the system
   observable" — that is a mood. It enumerates every path by which a
   file inside the PUBLISHED SURFACE can change, and asks of each
   one: does it leave a record a person could follow back to the
   evidence that justified it, and does that record survive a fresh
   clone?

   THE LAST CLAUSE IS THE LOAD-BEARING ONE. Almost every run store
   here is git-ignored, which is right — they are per-machine run
   state — but it means a trace is not durable evidence. Two things
   ARE durable: a git commit, and the two ledgers this repository
   tracks on purpose (`agent/policy/governance/grants.jsonl` and
   `agent/improve/cycles/cycles.jsonl`). So a write path is fully
   traceable only when its durable record carries the evidence, and
   the only write path that does is the autonomy runner's commit
   message — which is why that message is constructed the way it is.

   A HUMAN COMMIT IS A WRITE PATH TOO, and pretending otherwise
   would make this report useless. A person editing `index.html` and
   pushing is by far the most likely way this website changes, there
   is no deploy gate between that push and the live site, and the
   only trace it leaves is whatever the commit message says. That is
   reported here as what it is: the widest untraced path in the
   system, and not a defect an agent may close.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../implement/baseline.mjs';

/** What a reader actually receives. A change to any of these changes
 *  the website; a change to `docs/` or `agent/` does not, even
 *  though GitHub Pages serves both. */
export const PUBLISHED_SURFACE = Object.freeze([
  'index.html', 'applies.html', 'bibliography.html', 'enforcement.html',
  'institutions.html', 'instrument.html', 'instruments.html',
  'app.js', 'style.css', 'data/', 'i18n/', 'js/', 'css/', 'fonts/',
]);

/** The stores a run can write to, and whether each survives a clone.
 *  Measured against `.gitignore` and the index rather than asserted,
 *  because an ignore rule is the whole difference between a record
 *  and a local file. */
export const RUN_STORES = Object.freeze([
  'agent/records/',
  'agent/observability/runs/',
  'agent/health/history/',
  'agent/orchestrator/state/',
  '.control-room/state/',
  'agent/autonomy/actions/',
  'agent/improve/cycles/',
  'agent/policy/governance/',
  'agent/implement/decisions/',
]);

const git = (args, cwd = REPO_ROOT) => {
  try {
    return { ok: true, out: execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    return { ok: false, out: '', why: String(e?.stderr || e?.message || e).trim() };
  }
};

/** A tracked file that is only there to explain the directory. It
 *  makes the DIRECTORY survive a clone and no record in it, and the
 *  distinction is load-bearing: the first draft of this file counted
 *  `agent/implement/decisions/README.md` and reported the decision
 *  ledger as durable when the ledger is ABSENT. These same
 *  placeholders are what `agent/policy/verify/` PP-08 reports at
 *  HIGH, for a different reason: they show that those directories
 *  sit inside the published surface. */
const isPlaceholder = (f) => /(^|\/)(README\.md|\.gitkeep)$/.test(f);

/** Is a path tracked in the git index? `git ls-files` answers for the
 *  tree rather than for the ignore rules, which is the question that
 *  matters: an untracked store is one a clone does not get.
 *
 *  Placeholders are separated from records rather than dropped,
 *  because "one tracked file, and it explains that the store is
 *  empty" is a different fact from "nothing is tracked here". */
export function trackedFilesUnder(prefix, { root = REPO_ROOT } = {}) {
  const r = git(['ls-files', '--', prefix], root);
  if (!r.ok) return { measurable: false, files: [], records: [], placeholders: [], why: r.why };
  const files = r.out.split('\n').map((s) => s.trim()).filter(Boolean);
  return {
    measurable: true,
    files,
    records: files.filter((f) => !isPlaceholder(f)),
    placeholders: files.filter(isPlaceholder),
    why: null,
  };
}

/**
 * Every path by which a file in the published surface can change,
 * with what each leaves behind.
 *
 * `durable` means: survives `git clone`. `evidence` means: the
 * durable record names what justified the change. Both, or the path
 * is not traceable in the sense SESSION 29 asks for.
 */
export function writePaths({ root = REPO_ROOT } = {}) {
  const autonomyCycle = join(root, 'agent/autonomy/cycle.mjs');
  const hasCommitMessage = existsSync(autonomyCycle) && /export function commitMessage/.test(readFileSync(autonomyCycle, 'utf8'));
  const commitSrc = hasCommitMessage ? readFileSync(autonomyCycle, 'utf8') : '';
  const namesGrant = /Grant\(s\):/.test(commitSrc);
  const namesProposal = /Proposal:/.test(commitSrc);
  const namesBase = /Base commit/.test(commitSrc);
  const namesRollback = /ROLLBACK/.test(commitSrc);

  const decisions = trackedFilesUnder('agent/implement/decisions/', { root });
  const grants = trackedFilesUnder('agent/policy/governance/', { root });
  const cycles = trackedFilesUnder('agent/improve/cycles/', { root });

  return [
    {
      id: 'autonomy_runner',
      what: 'the limited-autonomy runner applies an approved-category proposal and merges it into the working branch',
      automatic: true,
      durable_record: 'the git commit it makes',
      carries_evidence: hasCommitMessage && namesGrant && namesProposal && namesBase && namesRollback,
      traceable: hasCommitMessage && namesGrant && namesProposal && namesBase && namesRollback,
      evidence: hasCommitMessage
        ? `agent/autonomy/cycle.mjs commitMessage() names the proposal and the agent that produced it, the derived category, the policy, every grant with who wrote it and when it expires, the files, the check verdict against the recorded baseline, the base commit and an executable restore command. Its own header says why: the action ledger is git-ignored run state, so the commit has to be the durable record.`
        : 'agent/autonomy/cycle.mjs does not export commitMessage(): the only automatic write path here has no durable record.',
      bound: 'It has never been exercised. No autonomous change has merged anything, so this is a property of the message builder and of the suite that tests it, not of any commit in this history.',
    },
    {
      id: 'human_commit',
      what: 'a person edits a published file and pushes',
      automatic: false,
      durable_record: 'the git commit',
      carries_evidence: false,
      traceable: false,
      evidence: 'nothing requires a commit message here to name evidence, and nothing checks one. A push to main publishes: .github/workflows/qa.yml runs the checks on every push and is NOT a deploy gate, and making it one needs a branch protection rule, which is repository configuration outside this tree.',
      bound: 'This is the widest untraced path in the system and it is the one most likely to be used. It is not an agent defect and an agent may not close it: requiring evidence in a human commit message is a governance decision about how the repository author works.',
    },
    {
      id: 'control_room_decision',
      what: 'a person approves a proposal through the Control Room, which records a decision',
      automatic: false,
      durable_record: 'agent/implement/decisions/decisions.jsonl, which is git-tracked',
      carries_evidence: decisions.measurable && decisions.records.length > 0,
      traceable: decisions.measurable && decisions.records.length > 0,
      evidence: decisions.measurable
        ? (decisions.records.length
          ? `${decisions.records.length} tracked record file(s) under agent/implement/decisions/: ${decisions.records.join(', ')}`
          : `the decision ledger is ABSENT, not empty \u2014 ${decisions.placeholders.length} tracked placeholder(s) (${decisions.placeholders.join(', ')}) and no record. It is git-tracked, so absence there is the one absence in this repository\'s decision stores that proves something: no proposal has ever been decided, through the Control Room or otherwise. A decision recorded today would also read void_unknown_proposal on any other machine, because deriveApproval() binds it to a proposal held in the git-ignored record store.`)
        : `could not be measured: ${decisions.why}`,
      bound: 'The route exists, authenticates, authorizes and audits. Nothing has ever travelled it.',
    },
    {
      id: 'improvement_cycle',
      what: 'the improvement loop records a cycle',
      automatic: false,
      durable_record: 'agent/improve/cycles/cycles.jsonl, git-tracked on purpose',
      carries_evidence: cycles.measurable && cycles.records.some((f) => f.endsWith('cycles.jsonl')),
      traceable: cycles.measurable && cycles.records.some((f) => f.endsWith('cycles.jsonl')),
      evidence: cycles.measurable
        ? `${cycles.records.length} tracked record file(s): ${cycles.records.join(', ')}. It carries only public readings, enforced by a refusal to write rather than by a convention, and nothing records without --record.`
        : `could not be measured: ${cycles.why}`,
      bound: 'It records observations, not modifications. No flag in agent/improve/ can touch data/, i18n/, js/, css/ or a page, so this path never changes the website at all — it is here because it is the one run store whose memory survives a clone.',
    },
    {
      id: 'governance_grant',
      what: 'a person records a governance grant, widening what may happen automatically',
      automatic: false,
      durable_record: 'agent/policy/governance/grants.jsonl, git-tracked',
      carries_evidence: grants.measurable && grants.records.some((f) => f.endsWith('grants.jsonl')),
      traceable: grants.measurable && grants.records.some((f) => f.endsWith('grants.jsonl')),
      evidence: grants.measurable
        ? `${grants.records.length} tracked record file(s): ${grants.records.join(', ')}. An authorization has to be attributable, so this ledger is the opposite of the action ledger and is tracked.`
        : `could not be measured: ${grants.why}`,
      bound: 'agent/policy/ is itself on the never-automatic path list, so no grant can widen the rules that admitted it. Every refusal runs again on every READ, so a line written around recordGrant is not honoured either.',
    },
  ];
}

/** Which run stores survive a clone. An ignore rule is not a
 *  boundary, and an untracked store is not a record. */
export function storeDurability({ root = REPO_ROOT } = {}) {
  return RUN_STORES.map((prefix) => {
    const t = trackedFilesUnder(prefix, { root });
    return {
      store: prefix,
      measurable: t.measurable,
      tracked_records: t.measurable ? t.records.length : null,
      tracked_placeholders: t.measurable ? t.placeholders.length : null,
      durable: t.measurable ? t.records.length > 0 : null,
      why: t.measurable
        ? (t.records.length
          ? `${t.records.length} tracked record file(s): ${t.records.join(', ')}`
          : `no record is tracked here${t.placeholders.length ? `; ${t.placeholders.length} placeholder(s) explain the directory` : ''}. A fresh clone and a CI runner have none of this, which is not the same fact as nothing having happened.`)
        : t.why,
    };
  });
}

/** Whether every agent that can produce a record is instrumented.
 *  "No agent may become invisible simply because it is automated"
 *  is measured as: does the module tree import the tracer at all,
 *  and does every CLI that runs an agent open a run on it. */
export function instrumentation({ root = REPO_ROOT } = {}) {
  const r = git(['ls-files', '--', 'agent/*/cli.mjs', 'agent/*/*/cli.mjs'], root);
  if (!r.ok) return { measurable: false, why: r.why, clis: [] };
  const clis = r.out.split('\n').map((s) => s.trim()).filter(Boolean);
  const rows = clis.map((rel) => {
    const src = readFileSync(join(root, rel), 'utf8');
    return {
      cli: rel,
      imports_tracer: /from '.*observability\/tracer\.mjs'/.test(src),
      opens_a_run: /\.run\(|run\.end\(/.test(src),
    };
  });
  return {
    measurable: true,
    why: null,
    clis: rows,
    instrumented: rows.filter((x) => x.imports_tracer).length,
    total: rows.length,
    uninstrumented: rows.filter((x) => !x.imports_tracer).map((x) => x.cli),
  };
}

/** The whole picture, and the one number worth having: how many of
 *  the write paths that can change the WEBSITE are traceable. */
export function traceability({ root = REPO_ROOT } = {}) {
  const paths = writePaths({ root });
  const stores = storeDurability({ root });
  const inst = instrumentation({ root });
  const changing = paths.filter((p) => ['autonomy_runner', 'human_commit', 'control_room_decision'].includes(p.id));
  return {
    write_paths: paths,
    stores,
    instrumentation: inst,
    website_changing_paths: changing.length,
    website_changing_traceable: changing.filter((p) => p.traceable).length,
    untraceable: changing.filter((p) => !p.traceable).map((p) => p.id),
    published_surface: PUBLISHED_SURFACE,
  };
}
