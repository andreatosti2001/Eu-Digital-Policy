/* ============================================================
   agent/implement/apply.mjs — the change context, the edit, and the
   way back

   SESSION 18 step 1: "Create an isolated branch or equivalent
   controlled change context." Step 2: "Inspect the current
   implementation before modifying it." Step 3: "Implement the
   smallest coherent change."

   THE CHANGE CONTEXT. Not a new branch per proposal. This
   repository's rollback story is the one `docs/AUTONOMY-POLICY.md`
   §4 states: the pre-SESSION-00 history is 47 bulk uploads with no
   message that explains a change, `git blame` returns "Add files via
   upload", and there is no per-change history to revert to. So the
   controlled context is the session's designated feature branch plus
   a RECORDED PRE-CHANGE COMMIT, and the rollback is
   `git checkout <commit> -- <the permitted paths>` — narrower than
   `git revert`, and it is narrower on purpose: it restores exactly
   the files the approval covered and touches nothing beside them.
   `openContext()` refuses to open one on `main`, because a push to
   `main` publishes and there is no deploy gate.

   THE EDIT IS EXACT, AND AMBIGUITY IS A REFUSAL. Every operation
   carries `current` — what is there now, verbatim — and `proposed`.
   The edit is applied only where `current` occurs EXACTLY ONCE in
   the file. Zero occurrences means the proposal was written against
   a file that has since changed. Two means the proposal does not say
   which one. Both are refusals, and neither is resolved by picking
   the first: an implementation agent that guesses which of two
   identical passages was meant has made an editorial decision it has
   no authority to make.

   THE WAY BACK IS TESTED, NOT ASSERTED. `rollback()` restores the
   files and then re-hashes them against the pre-change state. "The
   revert worked" is a measurement here, in the same way "nothing
   changed" is a measurement in every other agent in this layer.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { REPO_ROOT } from './baseline.mjs';
import { changedPaths } from './scope.mjs';

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

export class ApplyRefused extends Error {
  constructor(message, detail = {}) { super(message); this.detail = detail; }
}

const git = (args, cwd = REPO_ROOT) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

/**
 * Open the controlled change context.
 *
 * @param {{permitted:string[], root?:string}} opts
 */
export function openContext({ permitted, root = REPO_ROOT } = {}) {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root);
  if (branch === 'main') {
    throw new ApplyRefused('the working tree is on "main". A push to main publishes to the live site and there is no deploy gate (docs/AUTONOMY-POLICY.md Class D, AGENTS.md). Work on the session\'s designated branch.', { branch });
  }
  const commit = git(['rev-parse', 'HEAD'], root);

  /* A permitted path that is already dirty has no clean state to
     return to, so the rollback this context promises would restore
     somebody else's uncommitted work rather than the pre-change
     file. That is not a rollback; it is a second, silent change. */
  const dirty = changedPaths({ cwd: root }).filter((p) => permitted.includes(p));
  if (dirty.length) {
    throw new ApplyRefused(`${dirty.join(', ')} already has uncommitted changes. There is no clean pre-change state to restore, so this change would have no rollback path — and docs/AUTONOMY-POLICY.md §4 says a change whose rollback path cannot be stated is not made.`, { dirty });
  }

  const before = {};
  for (const p of permitted) {
    const abs = join(root, p);
    before[p] = existsSync(abs) && statSync(abs).isFile()
      ? { exists: true, sha256: sha256(readFileSync(abs)), bytes: statSync(abs).size }
      : { exists: false, sha256: null, bytes: 0 };
  }

  return {
    root,
    branch,
    commit,
    permitted,
    before,
    opened_at: new Date().toISOString(),
    rollback: {
      method: 'restore_from_commit',
      steps: [
        `git checkout ${commit} -- ${permitted.join(' ')}`,
        `for a path that did not exist at ${commit}: rm -f <path>`,
        'node tools/validate.mjs && node tools/i18n-audit.mjs && node tools/design-qa.mjs && node tools/freshness.mjs',
      ],
      verification: `every permitted path hashes back to its recorded pre-change sha256, and the four validators return to the recorded baseline in docs/CURRENT-ARCHITECTURE.md §12`,
      ref: commit,
    },
  };
}

/**
 * Apply one operation. Returns the file's new content; writes
 * nothing. Separating the computation from the write is what makes
 * a dry run identical to a real one in everything but the write.
 */
export function applyOperation(content, op) {
  const target = op.target;

  if (op.op === 'add' && (op.current === null || op.current === undefined)) {
    if (content !== null) {
      throw new ApplyRefused(`operation "add" on ${target} carries no "current", which means it expects the file not to exist — and it does. Adding to an existing file is a "modify" and has to say what it is adding after.`, { target });
    }
    if (op.proposed === null || op.proposed === undefined) {
      throw new ApplyRefused(`operation "add" on ${target} has a null "proposed": there is nothing to add. Several agents here emit exactly this on purpose — they name a problem and draft no value — and such a proposal is a finding, not something to apply.`, { target });
    }
    return op.proposed;
  }

  if (content === null) {
    throw new ApplyRefused(`operation "${op.op}" on ${target} expects the file to exist and it does not`, { target });
  }

  if (op.current === null || op.current === undefined) {
    throw new ApplyRefused(`operation "${op.op}" on an existing ${target} carries a null "current". An edit that does not say what is there now cannot be applied exactly, and an implementation agent that guesses where to put it has written the proposal itself.`, { target });
  }

  const occurrences = countOccurrences(content, op.current);
  if (occurrences === 0) {
    throw new ApplyRefused(`the text this operation says is currently in ${target} is not in ${target}. The proposal was written against a version of the file that no longer exists; it goes back to the agent that owns it, and back to the human who approved it, rather than being adapted here.`, { target, current_preview: preview(op.current) });
  }
  if (occurrences > 1) {
    throw new ApplyRefused(`the text this operation quotes occurs ${occurrences} times in ${target}. The proposal does not say which one, and choosing is an editorial decision this agent has no authority to make.`, { target, occurrences, current_preview: preview(op.current) });
  }

  if (op.op === 'remove') return content.replace(op.current, '');
  if (op.proposed === null || op.proposed === undefined) {
    throw new ApplyRefused(`operation "${op.op}" on ${target} has a null "proposed" value. This is a FINDING, not an edit — the producing agent named a problem and deliberately drafted nothing, which agent/ux/ and agent/proposals/editorial/ both do on purpose. Somebody has to write the value.`, { target });
  }
  return content.replace(op.current, op.proposed);
}

/**
 * Apply the whole proposal inside an open context.
 *
 * `dry` computes everything and writes nothing, which is how the
 * suite exercises this against the real repository without touching
 * it.
 */
export function applyProposal({ context, proposal, dry = false }) {
  const ops = proposal.proposed_change?.operations ?? [];
  const byFile = new Map();
  const applied = [];

  for (const op of ops) {
    const target = normalise(op.target);
    if (!context.permitted.includes(target)) {
      throw new ApplyRefused(`operation "${op.op}" targets ${target}, which is not in the permitted set (${context.permitted.join(', ')}). An approval authorises the exact scope defined by the proposal.`, { target });
    }
    const abs = join(context.root, target);
    if (!byFile.has(target)) {
      byFile.set(target, existsSync(abs) ? readFileSync(abs, 'utf8') : null);
    }
    const next = applyOperation(byFile.get(target), op);
    byFile.set(target, next);
    applied.push({ op: op.op, target, rationale: op.rationale, bytes_after: next?.length ?? 0 });
  }

  const files = [];
  for (const [target, content] of byFile) {
    const abs = join(context.root, target);
    const beforeState = context.before[target] ?? { exists: existsSync(abs), sha256: existsSync(abs) ? sha256(readFileSync(abs)) : null };
    const beforeText = beforeState.exists ? readFileSync(abs, 'utf8') : null;

    if (!dry) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content, 'utf8');
    }

    files.push({
      path: target,
      operation: beforeState.exists ? 'modify' : 'add',
      lines_added: countLineDelta(beforeText, content).added,
      lines_removed: countLineDelta(beforeText, content).removed,
      sha256_before: beforeState.sha256,
      sha256_after: sha256(Buffer.from(content, 'utf8')),
    });
  }

  return { files, applied, dry, operations: ops.length };
}

/**
 * Put it back, and check that it went back.
 *
 * @returns {{restored:string[], verified:boolean, mismatches:object[]}}
 */
export function rollback(context, { root = REPO_ROOT } = {}) {
  const existed = context.permitted.filter((p) => context.before[p]?.exists);
  const created = context.permitted.filter((p) => !context.before[p]?.exists);

  if (existed.length) git(['checkout', context.commit, '--', ...existed], root);
  for (const p of created) {
    const abs = join(root, p);
    if (existsSync(abs)) rmSync(abs, { force: true });
  }

  const mismatches = [];
  for (const p of context.permitted) {
    const abs = join(root, p);
    const want = context.before[p];
    if (want.exists) {
      const now = existsSync(abs) ? sha256(readFileSync(abs)) : null;
      if (now !== want.sha256) mismatches.push({ path: p, expected: want.sha256, actual: now });
    } else if (existsSync(abs)) {
      mismatches.push({ path: p, expected: 'absent', actual: sha256(readFileSync(abs)) });
    }
  }

  return {
    restored: context.permitted,
    verified: mismatches.length === 0,
    mismatches,
    /* Never "rolled back successfully" on the strength of the
       command not throwing. docs/VERIFICATION-POLICY.md §3: a
       passing command is not evidence of the thing it was meant to
       establish. */
    how_verified: `each permitted path re-hashed against the sha256 recorded when the context was opened at ${context.commit}`,
  };
}

/** The diff, in words a reviewer can hold it to, plus the real one. */
export function diffSummary(context, { root = REPO_ROOT } = {}) {
  let stat = '';
  let patch = '';
  try {
    stat = git(['diff', '--stat', '--', ...context.permitted], root);
    patch = git(['diff', '--', ...context.permitted], root);
  } catch { /* a path that git does not know is covered by the hashes */ }
  return { stat, patch, bytes: patch.length };
}

/* ---------------------------------------------------------- helpers */

const normalise = (p) => String(p ?? '').replace(/^\.?\//, '').trim();
const preview = (s) => String(s ?? '').slice(0, 120).replace(/\n/g, '⏎');

export function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) { n++; i = haystack.indexOf(needle, i + needle.length); }
  return n;
}

export function countLineDelta(before, after) {
  const b = before === null ? [] : before.split('\n');
  const a = after === null ? [] : after.split('\n');
  const bSet = new Map();
  for (const l of b) bSet.set(l, (bSet.get(l) ?? 0) + 1);
  let added = 0;
  for (const l of a) {
    const n = bSet.get(l) ?? 0;
    if (n > 0) bSet.set(l, n - 1); else added++;
  }
  let removed = 0;
  for (const n of bSet.values()) removed += n;
  return { added, removed };
}
