/* ============================================================
   agent/release/worktree.mjs — what the dispatcher may commit, measured
   against git rather than against what the applier says it did

   WHY THIS EXISTS (P0.1, 11 Nov 2026). The author's first real dispatch
   produced `11313f6` with NINE files while the scope stage reported "1
   changed file(s), every one inside the approved path(s)". Reproduced on a
   temporary repository against the dispatcher as it stood at `ad234aa`:
   the scope stage subtracted every path that was dirty before the apply
   (so eight pre-staged paths were invisible to it), `git add -- <touched>`
   added the one path it did see, and `git commit` then committed the WHOLE
   INDEX. The report and the commit described two different sets, and the
   gate (C7) only sees the commit.

   THE FOUR LISTS THIS MODULE KEEPS APART, each from its own source:
     permitted   read off the proposal (agent/implement/scope.mjs permittedFiles)
     declared    what the applier SAYS it changed (result.change.files)
     produced    what git SHOWS changed between the snapshot taken before
                 the apply and the tree after it — diffSnapshots(), below
     committed   what the commit CONTAINS — `git diff <base> <commit>`
   The dispatcher commits only when produced ⊆ permitted, produced =
   declared, staged = produced, and afterwards committed = produced.
   A disagreement is a refusal that names both sides; it is never
   reconciled by rewriting the report.

   WHAT IT NEVER DOES. No `reset`, no `clean`, no `stash`, no unstaging of
   anything the person staged, no checkout of a path the dispatch did not
   produce. A staged change before the dispatch is a REFUSAL, not something
   to tidy away: the person's index is theirs.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

/** Raw git: no trim, because `-z` records start with a status column that
 *  may begin with a space (" M path"). `--no-optional-locks` so that a
 *  measurement never takes the index lock it is measuring around. */
const gitRaw = (args, cwd) => execFileSync('git', ['--no-optional-locks', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const git = (args, cwd) => gitRaw(args, cwd).trim();
const zsplit = (s) => s.split('\0').filter(Boolean);

/** Uncommitted work the snapshot will hold in memory so that a rollback
 *  can put it back byte for byte. Above this the dispatch is refused
 *  rather than run with a rollback it could not verify. */
export const SNAPSHOT_BYTE_CAP = 32 * 1024 * 1024;

/** States in which `git commit` would not make the one-parent commit the
 *  dispatcher means to make, or in which the index is not the person's
 *  settled state. Located with `git rev-parse --git-path`, so a worktree
 *  or a non-default git dir is measured where it actually is. */
export const IN_PROGRESS_MARKERS = [
  ['MERGE_HEAD', 'a merge is in progress'],
  ['CHERRY_PICK_HEAD', 'a cherry-pick is in progress'],
  ['REVERT_HEAD', 'a revert is in progress'],
  ['rebase-merge', 'a rebase is in progress'],
  ['rebase-apply', 'a rebase or `git am` is in progress'],
];

/**
 * The index and the operation state, before anything is done.
 * @returns {{ok:boolean, staged:{status:string,path:string}[], unmerged:string[], in_progress:string[], why:string}}
 */
export function inspectIndex(root) {
  const inProgress = [];
  for (const [marker, what] of IN_PROGRESS_MARKERS) {
    let p = null;
    try { p = git(['rev-parse', '--git-path', marker], root); } catch { p = null; }
    if (p && existsSync(isAbsolute(p) ? p : join(root, p))) inProgress.push(`${marker}: ${what}`);
  }
  const unmerged = [...new Set(zsplit(gitRaw(['ls-files', '--unmerged', '-z'], root)).map((rec) => rec.split('\t').slice(1).join('\t')))].sort();
  const staged = [];
  const fields = zsplit(gitRaw(['diff', '--cached', '--name-status', '--no-renames', '-z', 'HEAD'], root));
  for (let i = 0; i + 1 < fields.length; i += 2) staged.push({ status: fields[i], path: fields[i + 1] });
  staged.sort((a, b) => a.path.localeCompare(b.path));

  const parts = [];
  if (inProgress.length) parts.push(`${inProgress.join('; ')}. \`git commit\` would complete that operation instead of making the one change that was approved`);
  if (unmerged.length) parts.push(`${unmerged.length} unmerged path(s): ${unmerged.join(', ')}`);
  if (staged.length) parts.push(`${staged.length} path(s) are already staged: ${staged.map((s) => `${s.status} ${s.path}`).join(', ')}. \`git commit\` commits the whole index, so they would enter the release commit beside the approved change — the defect that put 9 files in 11313f6 while the scope stage reported 1. Nothing was unstaged: the index is the person's. Commit, unstage or stash them yourself, then dispatch again`);
  return { ok: parts.length === 0, staged, unmerged, in_progress: inProgress, why: parts.join(' · ') };
}

/**
 * Every path git reports as differing from HEAD (tracked or untracked,
 * not ignored), with its status column and a hash of its bytes in the
 * working tree. `keepBytes` holds the content of each such file in memory:
 * those are the person's uncommitted edits, and they are the one thing a
 * rollback cannot fetch back from git.
 */
export function snapshot(root, { keepBytes = false, cap = SNAPSHOT_BYTE_CAP } = {}) {
  const head = git(['rev-parse', 'HEAD'], root);
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root);
  const entries = new Map();
  let held = 0;
  let overCap = false;
  for (const rec of zsplit(gitRaw(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'], root))) {
    const xy = rec.slice(0, 2);
    const path = rec.slice(3);
    const abs = join(root, path);
    let exists = false; let hash = null; let bytes = null;
    try {
      const st = lstatSync(abs);
      if (st.isFile() || st.isSymbolicLink()) {
        exists = true;
        const buf = st.isSymbolicLink() ? Buffer.from(`symlink:${readlinkSync(abs)}`) : readFileSync(abs);
        hash = sha256(buf);
        if (keepBytes && st.isFile()) { held += buf.length; if (held > cap) overCap = true; else bytes = buf; }
      } else { exists = true; hash = 'not-a-file'; }
    } catch { exists = false; }
    entries.set(path, { xy, exists, sha256: hash, bytes });
  }
  return { head, branch, entries, held_bytes: held, over_cap: overCap };
}

/** Paths whose state differs between two snapshots: newly dirty, newly
 *  clean (a person's edit undone is a change too), or a different status
 *  column or different bytes. Sorted, unique. */
export function diffSnapshots(before, after) {
  const out = new Set();
  for (const [p, a] of after.entries) {
    const b = before.entries.get(p);
    if (!b || b.xy !== a.xy || b.sha256 !== a.sha256 || b.exists !== a.exists) out.add(p);
  }
  for (const p of before.entries.keys()) if (!after.entries.has(p)) out.add(p);
  return [...out].sort();
}

/** What the index holds beyond `base`, by path. */
export function stagedAgainst(root, base) {
  return zsplit(gitRaw(['diff', '--cached', '--name-only', '--no-renames', '-z', base], root)).sort();
}

/** What a commit changed against its first parent, its parents, by path. */
export function commitContents(root, commit) {
  const parents = git(['rev-list', '--parents', '-n', '1', commit], root).split(' ').slice(1);
  const files = parents.length === 1 ? zsplit(gitRaw(['diff', '--name-only', '--no-renames', '-z', parents[0], commit], root)).sort() : null;
  return { parents, files };
}

const inCommit = (root, commit, path) => { try { git(['cat-file', '-e', `${commit}:${path}`], root); return true; } catch { return false; } };

/**
 * Put `paths` back to what they were in `before`, one path at a time, and
 * nothing else. A path that was clean comes back from `base` (index and
 * working tree); a path the person had edited comes back from the bytes
 * the snapshot held; a path that did not exist is removed. Never claims
 * anything: `verifyRestored()` is what says whether it worked.
 *
 * @returns {{attempted:string[], errors:{path:string, why:string}[]}}
 */
export function restorePaths(root, { before, base, paths }) {
  const errors = [];
  for (const p of paths) {
    const abs = join(root, p);
    const was = before.entries.get(p);
    try {
      /* `git restore --staged` from a base that lacks the path removes it
         from the index whatever its worktree state; `git rm --cached`
         refuses a path staged differently from both, and would need -f. */
      if (inCommit(root, base, p)) git(['restore', `--source=${base}`, '--staged', '--worktree', '--', p], root);
      else if (zsplit(gitRaw(['ls-files', '-z', '--', p], root)).length) git(['restore', `--source=${base}`, '--staged', '--', p], root);
      if (was) {
        /* the person's own uncommitted state of this path */
        if (!was.exists) rmSync(abs, { force: true });
        else if (was.bytes) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, was.bytes); }
        else if (was.sha256 !== 'not-a-file') throw new Error('its bytes were not held by the snapshot (over the cap, or not a regular file)');
      } else if (!inCommit(root, base, p)) {
        rmSync(abs, { force: true });
      }
    } catch (e) {
      /* git's own words (stderr) name the cause — a lock, a permission — where the message only names the command */
      errors.push({ path: p, why: String(e.stderr || e.message || e).trim().split('\n')[0] });
    }
  }
  return { attempted: [...paths], errors };
}

/**
 * Is the tree what it was? Measured, never inferred from commands that did
 * not throw: HEAD, the staged set (must be empty — nothing was staged when
 * the dispatch began) and every path's status and bytes.
 */
export function verifyRestored(root, { before, base }) {
  const now = snapshot(root);
  const differing = diffSnapshots(before, now);
  const staged = stagedAgainst(root, base);
  const problems = [];
  if (now.head !== base) problems.push(`HEAD is ${now.head.slice(0, 12)}, not the base ${base.slice(0, 12)}`);
  if (staged.length) problems.push(`the index holds ${staged.length} staged path(s): ${staged.join(', ')}`);
  if (differing.length) problems.push(`${differing.length} path(s) do not match the pre-dispatch snapshot: ${differing.join(', ')}`);
  return { verified: problems.length === 0, differing, staged, head: now.head, branch: now.branch, problems };
}

/** When a rollback cannot be verified, the person's own bytes for every
 *  path still wrong are written where a person can find them. */
export function keepForRecovery(dir, { before, paths }) {
  const kept = [];
  for (const p of paths) {
    const was = before.entries.get(p);
    if (!was?.bytes) continue;
    try { const out = join(dir, p); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, was.bytes); kept.push(out); } catch { /* named in the report */ }
  }
  return kept;
}
