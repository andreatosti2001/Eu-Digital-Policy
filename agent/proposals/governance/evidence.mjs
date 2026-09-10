/* ============================================================
   agent/proposals/governance/evidence.mjs — every anchor, resolved
   against the real repository rather than quoted from memory

   SESSION 28 reads the history of this repository and says what
   keeps happening in it. That is a reading, and a reading is the
   easiest thing here to get wrong: the audit of SESSION 01 reported
   three existing documents as missing because it described a stale
   working tree (`docs/AUDIT-2026-09-01.md` F-01, retracted at
   10a97593), and four artifacts of SESSION 23.5 asserted the
   Orchestrator had never been built while it sat on a sibling
   branch (e6f2715).

   So no statement in `patterns.mjs` stands on its own words. Each
   one carries ANCHORS, and this file is the only thing that decides
   whether an anchor holds. An anchor is one of five kinds:

     commit    a sha, and a substring its subject must contain
     path      a path that must exist — or must NOT, which is a
               different and equally checkable fact
     contains  a file, a string, and how many times it must appear
     line      a file, a line number, and what that line must say
     measure   a named live measurement, recomputed on every run

   THREE STATES, NEVER TWO. `resolved`, `refuted`, and
   `unresolvable_here`. The third is this repository's §0.3 rule
   applied to its own evidence: a commit anchor cannot be checked in
   a shallow clone, and a checker that called that `refuted` would
   report the CI runner's fetch depth as a false claim about
   history. `unresolvable_here` is never counted as support and
   never counted against — it is recorded, with the reason.

   WHAT MAKES `measure` DIFFERENT, and why the strongest patterns
   here use one. A commit anchor establishes that something WAS true
   once. A measure recomputes the fact now, from the tree the reader
   has: if somebody narrows the grant, `grant_fields_absent` drops
   and the pattern that rests on it stops being supported. A
   finding that cannot go away when it is fixed is not a finding.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const GOVERNANCE_ROOT = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(GOVERNANCE_ROOT, '../../..');

/** The three states an anchor can be in. None collapses into another. */
export const ANCHOR_STATES = Object.freeze(['resolved', 'refuted', 'unresolvable_here']);

const held = (anchor, why, detail = {}) => ({ ...anchor, state: 'resolved', why, ...detail });
const broke = (anchor, why, detail = {}) => ({ ...anchor, state: 'refuted', why, ...detail });
const cannot = (anchor, why, detail = {}) => ({ ...anchor, state: 'unresolvable_here', why, ...detail });

/* ---------------------------------------------------------- git */

/** Is there git history here at all, and is it deep enough to be
 *  asked about a commit? Answered once per process, because the
 *  answer cannot change mid-run and asking is a subprocess. */
let gitState = null;
export function gitAvailability({ root = REPO_ROOT } = {}) {
  if (gitState) return gitState;
  try {
    const shallow = existsSync(join(root, '.git', 'shallow'));
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    gitState = { available: true, shallow, why: shallow ? 'the clone is shallow; a commit older than the fetch depth is not present here' : 'full history is present' };
  } catch (e) {
    gitState = { available: false, shallow: false, why: `git is not usable in this environment: ${String(e.message).slice(0, 120)}` };
  }
  return gitState;
}

/** Only for the suite, which needs a clean answer per temporary tree. */
export function resetGitAvailability() { gitState = null; }

function subjectOf(sha, root) {
  return execFileSync('git', ['log', '-1', '--format=%s', sha], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/* ---------------------------------------------------------- measures */

const NUMERALS = Object.freeze({
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10,
  ELEVEN: 11, TWELVE: 12, THIRTEEN: 13, FOURTEEN: 14, FIFTEEN: 15, SIXTEEN: 16,
  SEVENTEEN: 17, EIGHTEEN: 18, NINETEEN: 19, TWENTY: 20,
});

/**
 * The live measurements. Each returns `{ value, detail, why }` and
 * reads only — no measure here writes, forks a browser or opens a
 * socket, because they run inside a suite and inside CI.
 *
 * Each one is registered by name so a pattern anchors to
 * `{ kind: 'measure', measure: 'decisions_recorded', expect: 0 }`
 * and the comparison happens here rather than in prose.
 */
export const MEASURES = Object.freeze({

  /* Does the contracts banner still say what the registry holds? */
  async contracts_banner_vs_registry({ root = REPO_ROOT } = {}) {
    const file = join(root, 'agent/schemas/cli.mjs');
    if (!existsSync(file)) return { value: null, detail: {}, why: 'agent/schemas/cli.mjs is not in this tree' };
    const m = readFileSync(file, 'utf8').match(/([A-Z]+)\s+CONTRACTS/);
    const declared = m ? NUMERALS[m[1]] ?? null : null;
    const { CONTRACT_LIST } = await import(`${join(root, 'agent/schemas/registry.mjs')}`);
    const listed = CONTRACT_LIST.length;
    return {
      value: declared === listed ? 'agrees' : 'drifted',
      detail: { declared, declared_word: m ? m[1] : null, listed },
      why: declared === listed
        ? `the banner says ${declared} and the registry holds ${listed}.`
        : `agent/schemas/cli.mjs prints "${m ? m[1] : '?'} CONTRACTS" and agent/schemas/registry.mjs holds ${listed}. The banner is printed immediately above the list it disagrees with.`,
    };
  },

  /* How many of the eight fields the grant allowlists exist on any
     record in the file the grant names? */
  async grant_fields_absent({ root = REPO_ROOT } = {}) {
    const { GRANTABLE_FIELDS } = await import(`${join(root, 'agent/policy/governance.mjs')}`);
    const dataset = 'data/sources.json';
    const names = GRANTABLE_FIELDS[dataset] ?? [];
    const file = join(root, dataset);
    if (!existsSync(file)) return { value: null, detail: {}, why: `${dataset} is not in this tree` };
    const raw = readFileSync(file, 'utf8');
    const present = names.filter((n) => new RegExp(`"${n}"\\s*:`).test(raw));
    const absent = names.filter((n) => !present.includes(n));
    return {
      value: absent.length,
      detail: { dataset, allowlisted: names.length, present, absent },
      why: `${absent.length} of the ${names.length} field(s) the grant allowlists for ${dataset} appear nowhere in it: ${absent.join(', ') || 'none'}. A permission over a field that does not exist writes nothing, which is the safe direction and not a defect — it is a statement about what the grant actually reaches.`,
    };
  },

  /* How many decisions has a person ever recorded? */
  async decisions_recorded({ root = REPO_ROOT } = {}) {
    const { readLedger, DECISION_DIR } = await import(`${join(root, 'agent/implement/ledger.mjs')}`);
    const dir = root === REPO_ROOT ? DECISION_DIR : join(root, 'agent/implement/decisions');
    const led = readLedger({ dir });
    return {
      value: led.decisions.length,
      detail: { path: led.path, exists: existsSync(led.path), malformed: led.malformed.length },
      why: existsSync(led.path)
        ? `${led.decisions.length} decision(s) in the one place a grant can exist, and ${led.malformed.length} malformed line(s).`
        : `${led.path} does not exist. That is not the same fact as an empty ledger and it is not read as one: nobody has ever run "agent/implement/cli.mjs decide".`,
    };
  },

  /* Would a decision recorded today still be verifiable tomorrow? The
     ledger binds a decision to the sha256 of the proposal, and the
     proposal lives in a git-ignored store. */
  async proposals_reachable_for_decision({ root = REPO_ROOT } = {}) {
    const { readAgentRecords } = await import(`${join(root, 'agent/implement/ledger.mjs')}`);
    const rec = readAgentRecords();
    return {
      value: rec.byId.size,
      detail: { traces: rec.traces.length, approval_requests: rec.approvalRequests.length, store: 'agent/records/ (git-ignored)' },
      why: `${rec.byId.size} proposal(s) are reachable by id in this working tree. deriveApproval() resolves a decision against that store, so on a fresh clone — where it is empty by design — a recorded decision reads "void_unknown_proposal" until the producing agent is re-run over the same corpus.`,
    };
  },

  /* Which of the prose governance documents does the policy in force
     place in a category it has enabled? */
  async policy_docs_in_enabled_category({ root = REPO_ROOT } = {}) {
    const { policyInForce } = await import(`${join(root, 'agent/policy/governance.mjs')}`);
    const { categoriseProposal } = await import(`${join(root, 'agent/policy/categories.mjs')}`);
    const { policy } = policyInForce();
    const reached = [];
    for (const doc of PROSE_POLICY_DOCS) {
      if (!existsSync(join(root, doc))) continue;
      const proposal = {
        contract: 'ImplementationProposal',
        proposal_id: 'governance-probe',
        files: [doc],
        risk: 'low',
        proposed_change: { summary: 'probe', operations: [] },
      };
      const c = categoriseProposal(proposal);
      const enabled = policy.enabled_categories.includes(c.category);
      const pathAllowed = policy.automatic_path_allowlist.some((p) => doc === p || doc.startsWith(p));
      if (enabled && pathAllowed) reached.push({ doc, category: c.category, why: c.why });
    }
    return {
      value: reached.length,
      detail: { reached, enabled_categories: [...policy.enabled_categories], path_allowlist: [...policy.automatic_path_allowlist], policy_id: policy.policy_id },
      why: `${reached.length} of the ${PROSE_POLICY_DOCS.length} prose governance document(s) are placed by categoriseProposal() in a category the policy in force has ENABLED, on a path the grant allows. This says what the category and path gates do, and nothing about whether such a change would merge — six further gates and twelve conditions run after them, and no autonomous change has ever merged anything.`,
    };
  },

  /* Work that exists on a branch and is not in `main`. A correction
     recorded where nobody reads it is not a correction the next
     session inherits. */
  async unmerged_session_branches({ root = REPO_ROOT } = {}) {
    const git = gitAvailability({ root });
    if (!git.available) return { value: null, detail: {}, why: git.why };
    let raw;
    try {
      /* origin/main has to be here for "not in main" to mean
         anything. A CI checkout of a single branch has no such ref,
         and this reports that rather than counting to zero. */
      execFileSync('git', ['rev-parse', '--verify', 'origin/main'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      raw = execFileSync('git', ['branch', '-r', '--no-merged', 'origin/main'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      return { value: null, detail: {}, why: `the branch list could not be read against origin/main here: ${String(e.message).slice(0, 140)}. A checkout with one branch cannot answer what is missing from another.` };
    }
    const branches = raw.split('\n').map((l) => l.trim()).filter((l) => l && !l.includes('->'));
    return {
      value: branches.length,
      detail: { branches },
      why: `${branches.length} remote branch(es) hold commits that are not in origin/main. Each one is work — and, where it corrected something, a lesson — that a session starting from main does not inherit.`,
    };
  },
});

/**
 * The documents `AGENTS.md` names as the operating policies, plus the
 * boundaries document they refine. These are the governance policy in
 * the form a person reads it. They are listed here rather than
 * derived, because deriving them from a directory listing would make
 * the set change silently when a report is added to `docs/`.
 */
export const PROSE_POLICY_DOCS = Object.freeze([
  'docs/AI-SAFE-BOUNDARIES.md',
  'docs/AUTONOMY-POLICY.md',
  'docs/AUTONOMY-AUTHORIZATION-POLICY.md',
  'docs/LIMITED-AUTONOMY.md',
  'docs/AGENT-ROLES.md',
  'docs/DATA-GOVERNANCE.md',
  'docs/SOURCE-POLICY.md',
  'docs/VERIFICATION-POLICY.md',
]);

/* ---------------------------------------------------------- resolving */

/**
 * Resolve one anchor against the tree at `root`.
 *
 * @param {object} anchor
 * @param {{root?:string, measures?:object}} opts
 * @returns {Promise<object>} the anchor with `state` and `why` added
 */
export async function resolveAnchor(anchor, { root = REPO_ROOT, measures = MEASURES } = {}) {
  if (!anchor || typeof anchor !== 'object') {
    return broke({ kind: 'malformed' }, 'an anchor must be an object. Nothing is taken on trust here, including the shape of the evidence.');
  }

  switch (anchor.kind) {
    case 'commit': {
      const git = gitAvailability({ root });
      if (!git.available) return cannot(anchor, git.why);
      let subject;
      try {
        subject = subjectOf(anchor.sha, root);
      } catch {
        return git.shallow
          ? cannot(anchor, `commit ${anchor.sha} is not present in this clone, and the clone is shallow. Absent from a shallow clone is not absent from the history.`)
          : broke(anchor, `commit ${anchor.sha} is not in this repository, and the clone is not shallow.`);
      }
      return subject.includes(anchor.subject)
        ? held(anchor, `${anchor.sha} · "${subject}"`, { subject })
        : broke(anchor, `commit ${anchor.sha} exists but its subject is "${subject}", which does not contain "${anchor.subject}".`, { subject });
    }

    case 'path': {
      const there = existsSync(join(root, anchor.path));
      const want = anchor.exists !== false;
      if (there === want) {
        return held(anchor, want
          ? `${anchor.path} exists.`
          : `${anchor.path} does not exist, which is the fact being anchored. Absent is not empty and is not reported as empty.`);
      }
      return broke(anchor, want
        ? `${anchor.path} is not in this tree, and the anchor asserts it is.`
        : `${anchor.path} exists, and the anchor asserts it does not.`);
    }

    case 'contains': {
      const file = join(root, anchor.path);
      if (!existsSync(file)) return broke(anchor, `${anchor.path} is not in this tree, so the string cannot be found in it.`);
      const raw = readFileSync(file, 'utf8');
      let count = 0;
      let from = 0;
      for (;;) {
        const at = raw.indexOf(anchor.text, from);
        if (at < 0) break;
        count += 1;
        from = at + anchor.text.length;
      }
      /* `max` is how an anchor asserts an ABSENCE — a rule that is
         not in the file it should be in. It is a different claim
         from `min` and it is checked as one, because "the lesson was
         written down somewhere" and "the lesson is in the document a
         session reads" are the two facts pattern P-06 is about. */
      if (anchor.max !== undefined) {
        return count <= anchor.max
          ? held(anchor, `${anchor.path} contains "${clip(anchor.text)}" ${count} time(s); the anchor asserts at most ${anchor.max}.`, { count })
          : broke(anchor, `${anchor.path} contains "${clip(anchor.text)}" ${count} time(s); the anchor asserts at most ${anchor.max}.`, { count });
      }
      const min = anchor.min ?? 1;
      return count >= min
        ? held(anchor, `${anchor.path} contains "${clip(anchor.text)}" ${count} time(s); the anchor needs ${min}.`, { count })
        : broke(anchor, `${anchor.path} contains "${clip(anchor.text)}" ${count} time(s); the anchor needs ${min}.`, { count });
    }

    case 'line': {
      const file = join(root, anchor.path);
      if (!existsSync(file)) return broke(anchor, `${anchor.path} is not in this tree.`);
      const lines = readFileSync(file, 'utf8').split('\n');
      const line = lines[anchor.line - 1];
      if (line === undefined) return broke(anchor, `${anchor.path} has ${lines.length} line(s) and the anchor names line ${anchor.line}.`);
      return line.includes(anchor.text)
        ? held(anchor, `${anchor.path}:${anchor.line} · ${line.trim().slice(0, 120)}`, { line_text: line.trim() })
        : broke(anchor, `${anchor.path}:${anchor.line} reads "${line.trim().slice(0, 120)}", which does not contain "${clip(anchor.text)}". A line number moves when a file is edited; this is the anchor saying so rather than a pattern quietly citing the wrong line.`, { line_text: line.trim() });
    }

    case 'measure': {
      const fn = measures[anchor.measure];
      if (!fn) return broke(anchor, `no measurement named "${anchor.measure}" is registered.`);
      let m;
      try {
        m = await fn({ root });
      } catch (e) {
        return cannot(anchor, `the measurement "${anchor.measure}" could not run here: ${String(e.message).slice(0, 160)}`);
      }
      if (m.value === null) return cannot(anchor, m.why);
      const ok = compare(m.value, anchor.expect);
      return ok
        ? held(anchor, m.why, { measured: m.value, detail: m.detail })
        : broke(anchor, `${anchor.measure} measured ${JSON.stringify(m.value)} and the anchor expects ${JSON.stringify(anchor.expect)}. ${m.why}`, { measured: m.value, detail: m.detail });
    }

    default:
      return broke(anchor, `"${anchor.kind}" is not one of the five anchor kinds: commit, path, contains, line, measure.`);
  }
}

/** `expect` is a value, or `{ at_least: n }`, or `{ not: v }`. */
function compare(value, expect) {
  if (expect === undefined) return true;
  if (expect && typeof expect === 'object') {
    if ('at_least' in expect) return Number(value) >= expect.at_least;
    if ('at_most' in expect) return Number(value) <= expect.at_most;
    if ('not' in expect) return value !== expect.not;
  }
  return value === expect;
}

const clip = (s) => String(s).replace(/\s+/g, ' ').slice(0, 70);

/** Resolve a list, and say what the list amounts to. */
export async function resolveAll(anchors = [], opts = {}) {
  const resolved = [];
  for (const a of anchors) resolved.push(await resolveAnchor(a, opts));
  const counts = { resolved: 0, refuted: 0, unresolvable_here: 0 };
  for (const r of resolved) counts[r.state] += 1;
  return { anchors: resolved, counts, ok: counts.refuted === 0, supporting: counts.resolved };
}
