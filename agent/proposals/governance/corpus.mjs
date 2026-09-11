/* ============================================================
   agent/proposals/governance/corpus.mjs — every place a human
   decision could be recorded, and what is actually in each one

   SESSION 28's brief asks for the patterns in "approved / rejected /
   edited proposals". The first thing this module had to establish is
   whether that corpus exists, and the answer is measured rather than
   assumed:

     THE APPROVAL LEDGER IS NOT EMPTY. IT IS ABSENT.
     agent/implement/decisions/decisions.jsonl has never been
     written. Not one of the proposals this repository has produced
     has ever been approved, rejected or edited by a person through
     the one command that can record it. AGENTS.md's own count is
     seventy-one across four agents.

   Those are different facts and this file keeps them apart, because
   the project's own §0.3 rule — null is not unknown, and unknown is
   never zero — applies to its own governance as much as to a fine or
   a date. An empty ledger would mean somebody looked and decided
   nothing. An absent one means the mechanism has never been used.

   SO WHERE ARE THE DECISIONS? They are in the history. Four of the
   six stores below hold nothing; the two that hold anything are the
   grant ledger — one line, one authorization, one named person — and
   git, which holds ninety-two commits including the ones a person
   made to correct what a session had already pushed.

   THE CORPUS IS THEREFORE THE CORRECTION RECORD, and this module
   says so in its own output rather than letting a later reader infer
   that seventy-one proposals were weighed. Nothing was weighed. What
   there is instead is a person repeatedly stopping the same thing
   from being asserted, and `patterns.mjs` is what that repetition
   looks like when it is counted.

   READ-ONLY, AND NOT ONLY BY CONVENTION. Nothing in this directory
   imports a write API; `selftest.mjs` scans every module here for
   one and hashes the working tree around a full run.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, gitAvailability } from './evidence.mjs';

/**
 * The three states a store can be in, and the reason the middle one
 * exists at all.
 *
 *   absent   the mechanism has never been used
 *   empty    it exists and holds nothing
 *   holds    it holds n records
 *
 * `absent` and `empty` are reported separately everywhere in this
 * module. Collapsing them is the error `agent/policy/conditions.mjs`
 * had until SESSION 27 found it, and the error `agent/health/model.mjs`
 * refuses by marking five metrics `not_a_score`.
 */
export const STORE_STATES = Object.freeze(['absent', 'empty', 'holds', 'unreadable']);

/** Every place in this repository where a human decision could live. */
export const DECISION_STORES = Object.freeze([
  Object.freeze({
    id: 'approval_ledger',
    path: 'agent/implement/decisions/decisions.jsonl',
    tracked: true,
    what: 'the ONLY place a grant on a proposal can exist. Written by exactly one command, which requires a named human and refuses an agent name.',
    kind: 'jsonl',
  }),
  Object.freeze({
    id: 'grant_ledger',
    path: 'agent/policy/governance/grants.jsonl',
    tracked: true,
    what: 'the governance grants. An authorization has to be attributable, so this one is tracked while every other run store is ignored.',
    kind: 'jsonl',
  }),
  Object.freeze({
    id: 'autonomy_actions',
    path: 'agent/autonomy/actions/actions.jsonl',
    tracked: false,
    what: 'one line per autonomous attempt — merged, reverted and refused alike. Per-machine run state: a fresh clone has none, and that is not the same fact as no action having been taken.',
    kind: 'jsonl',
  }),
  Object.freeze({
    id: 'agent_records',
    path: 'agent/records',
    tracked: false,
    what: 'where every proposal and every ApprovalRequest an agent writes lands. An ApprovalRequest here is a REQUEST whatever its state field says.',
    kind: 'dir',
  }),
  Object.freeze({
    id: 'control_room_state',
    path: '.control-room/state',
    tracked: false,
    what: 'the Control Room audit trail. Behind the dot prefix, and never in a commit.',
    kind: 'dir',
  }),
  Object.freeze({
    id: 'git_history',
    path: '.git',
    tracked: true,
    what: 'the only decision record here that survives a clone in full: what a person merged, and what a person came back and corrected.',
    kind: 'git',
  }),
]);

/** Read one store without ever deciding what its emptiness means. */
export function readStore(store, { root = REPO_ROOT } = {}) {
  const abs = join(root, store.path);
  if (!existsSync(abs)) {
    return {
      ...store, state: 'absent', count: 0,
      why: store.tracked
        ? `${store.path} is not in this tree and it is git-tracked, so it has never been written. Absent is not empty.`
        : `${store.path} is not in this tree and it is git-ignored, so this says nothing about whether it has ever been written on another machine. Absent here is not absent everywhere.`,
    };
  }
  try {
    if (store.kind === 'jsonl') {
      const lines = readFileSync(abs, 'utf8').split('\n').filter((l) => l.trim());
      const parsed = [];
      const malformed = [];
      lines.forEach((l, i) => {
        try { parsed.push(JSON.parse(l)); } catch (e) { malformed.push({ line: i + 1, why: e.message }); }
      });
      return {
        ...store,
        state: parsed.length || malformed.length ? 'holds' : 'empty',
        count: parsed.length,
        malformed,
        entries: parsed,
        why: `${parsed.length} entr(ies)${malformed.length ? `, and ${malformed.length} line(s) that do not parse — reported rather than skipped` : ''}.`,
      };
    }
    if (store.kind === 'dir') {
      const files = execFileSync('find', [abs, '-type', 'f'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
        .split('\n').filter(Boolean);
      return { ...store, state: files.length ? 'holds' : 'empty', count: files.length, why: `${files.length} file(s) under ${store.path}.` };
    }
    if (store.kind === 'git') {
      const git = gitAvailability({ root });
      if (!git.available) return { ...store, state: 'unreadable', count: 0, why: git.why };
      const count = Number(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim());
      return { ...store, state: 'holds', count, shallow: git.shallow, why: `${count} commit(s) reachable from HEAD${git.shallow ? ', in a SHALLOW clone — the number is a fetch depth, not a history length' : ''}.` };
    }
    return { ...store, state: 'unreadable', count: 0, why: `no reader is registered for kind "${store.kind}".` };
  } catch (e) {
    return { ...store, state: 'unreadable', count: 0, why: `${store.path} exists and could not be read: ${String(e.message).slice(0, 140)}` };
  }
}

/**
 * The whole corpus, and the sentence it adds up to.
 *
 * @returns {{stores:object[], decided:number, authorizations:number,
 *            commits:number|null, summary:string, statement:string}}
 */
export function decisionCorpus({ root = REPO_ROOT } = {}) {
  const stores = DECISION_STORES.map((s) => readStore(s, { root }));
  const byId = Object.fromEntries(stores.map((s) => [s.id, s]));
  const decided = byId.approval_ledger.state === 'holds' ? byId.approval_ledger.count : 0;
  const authorizations = byId.grant_ledger.state === 'holds' ? byId.grant_ledger.count : 0;
  const commits = byId.git_history.state === 'holds' ? byId.git_history.count : null;

  const statement = decided === 0
    ? `No proposal in this repository has ever been approved, rejected or edited by a person: ${byId.approval_ledger.why} The decision corpus this session was asked to analyse does not exist, and the analysis below is of what does — ${authorizations} recorded authorization(s) and the correction record in git.`
    : `${decided} decision(s) are recorded in the approval ledger.`;

  return {
    stores,
    decided,
    authorizations,
    commits,
    summary: `${stores.filter((s) => s.state === 'holds').length} of ${stores.length} decision store(s) hold anything · ${decided} decided proposal(s) · ${authorizations} authorization(s)`,
    statement,
  };
}

/**
 * The corrections, read from git rather than from a list somebody
 * maintained. A correction is a commit that says it is one: this
 * repository's convention, stated in 4fe1952's own message, is
 * "corrected rather than edited away", and the subjects follow it.
 *
 * THE CLASSIFIER IS DELIBERATELY CRUDE AND SAYS SO. It matches
 * subject lines, so it cannot see a correction made quietly inside a
 * larger commit, and it will over-count a commit that merely uses the
 * word. Every pattern in `patterns.mjs` therefore anchors to named
 * commits rather than to this count, and this count is reported as
 * what it is: a floor, measured one way.
 */
export const CORRECTION_MARKERS = Object.freeze([
  'correct', 'retract', 'reconcile', 'fix a', 'mis-report', 'misreport', 'was mis',
]);

export function corrections({ root = REPO_ROOT, limit = 500 } = {}) {
  const git = gitAvailability({ root });
  if (!git.available) return { available: false, why: git.why, commits: [], count: 0, shallow: false };
  let log;
  try {
    log = execFileSync('git', ['log', `-${limit}`, '--format=%H%x1f%ad%x1f%s', '--date=short'], { cwd: root, encoding: 'utf8' });
  } catch (e) {
    return { available: false, why: `git log failed here: ${String(e.message).slice(0, 140)}`, commits: [], count: 0, shallow: git.shallow };
  }
  const all = log.split('\n').filter(Boolean).map((l) => {
    const [sha, date, subject] = l.split('\x1f');
    return { sha, date, subject };
  });
  const hits = all.filter((c) => CORRECTION_MARKERS.some((m) => c.subject.toLowerCase().includes(m)));
  return {
    available: true,
    shallow: git.shallow,
    why: git.shallow
      ? 'measured over a SHALLOW clone: this is a count over the commits present here, not over the history.'
      : `measured over ${all.length} commit(s) by subject line. A floor, not a total: a correction made inside a larger commit is invisible to it.`,
    commits: hits,
    count: hits.length,
    scanned: all.length,
  };
}
