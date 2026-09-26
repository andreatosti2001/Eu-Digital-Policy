/* ============================================================
   agent/proposals/governance/proposals.mjs — a pattern turned into
   a request, and never into a change

   SESSION 28's brief: "Do not automatically rewrite policies.
   Instead create agent/proposals/governance/ with proposals such as
   a new rule, a new validation, a new skill, a new evaluation,
   reduced autonomy, increased autonomy. Every governance proposal
   requires human approval."

   THE ONE THING TO UNDERSTAND ABOUT THIS FILE. It has no write
   path. Not a guarded one, not one behind a flag — none. Nothing
   here imports `writeFileSync`, `appendFileSync`, `mkdirSync` or
   `execFile`, and `selftest.mjs` scans every module in this
   directory for one and hashes the whole working tree around a full
   run. Protocol §24 reserves a change to this system's own
   governance to a person; a module that proposes governance changes
   and can also apply one is that reservation on the honour system.

   NOR IS THERE A DECISION HOME HERE, AND THAT IS DELIBERATE. A
   grant lives in `agent/implement/decisions/decisions.jsonl` and
   nowhere else, written by exactly one command that requires a named
   human. AGENTS.md says not to add a third writer, so this directory
   does not: `decision` on every record below is `null`, there is no
   code path that sets it, and the CLI has no verb that would.

   WHICH LEAVES A REAL GAP, AND IT IS NAMED RATHER THAN PAPERED
   OVER. `deriveApproval()` resolves a decision against the
   git-ignored agent record store, so a decision recorded against one
   of these proposals would read `void_unknown_proposal` on any other
   machine until this module is re-run. GP-04 is the proposal that
   asks a person to decide what to do about that; this file does not
   decide it by quietly writing a fourth store.

   DERIVED, NOT STORED. The proposals are computed from
   `patterns.mjs` on every run, with content-derived ids, so
   re-running mints the same ids from the same evidence and no JSON
   copy of them exists to drift from the reasoning that produced it.
   That is this project's fourth principle applied to its own
   governance paperwork.
   ============================================================ */

import { contentId } from '../../schemas/identity.mjs';
import { NEVER_AUTOMATIC_PATHS } from '../../policy/governance.mjs';
import { PROSE_POLICY_DOCS } from './evidence.mjs';
import { PATTERNS, patternsWithEvidence } from './patterns.mjs';

export const PROPOSER = 'governance-proposals';

/** The six kinds the brief names, in its own words. */
export const PROPOSAL_KINDS = Object.freeze([
  'new_rule',
  'new_validation',
  'new_skill',
  'new_evaluation',
  'reduced_autonomy',
  'increased_autonomy',
]);

/** No governance proposal is ever automatic. The value exists so the
 *  suite can assert its absence rather than trusting the prose. */
export const FORBIDDEN_CLASS = 'automatic';

/**
 * The proposals. Each is a request with an argument, its evidence by
 * pattern id, what it would cost, and the case against it.
 *
 * `against` is not a formality. Every one of these makes the system
 * stricter or looser, and a proposal that cannot state the reason a
 * reasonable person would refuse it has not been thought through.
 */
export const DRAFTS = Object.freeze([

  Object.freeze({
    ref: 'GP-01',
    kind: 'new_validation',
    title: 'Check every declared count against the thing it counts',
    ask: 'Add a check that reads the counts this repository states about itself — the contracts banner against the registry, the suite list against the suite files on disk, the figures AGENTS.md and docs/CURRENT-ARCHITECTURE.md §12 state about suites and validators — and fails when a count and its subject disagree.',
    from_patterns: Object.freeze(['P-04', 'P-02']),
    changes: Object.freeze(['tools/', 'agent/implement/checks.mjs']),
    what_it_would_do:
      'Turn the one assertion that already guards one list into a check that guards all of them. One count is wrong right now and the check would fail on it today, which is the right way for a new check to arrive: with a live example rather than a green tick.',
    what_it_would_not_do:
      'It cannot check a count stated in prose about something it cannot enumerate — "106 unverified records" is only checkable because a validator prints it, and "the eleven agents" is not checkable at all without a register of agents that does not exist. The proposal is for the mechanical subset, named, not for every number in every document.',
    against:
      'A check in `tools/` is the gate rather than the thing the gate checks, and this repository is careful about that: `agent/implement/scope.mjs` refuses to write `tools/` at all. It also adds a way for a session to be blocked by bookkeeping while doing legal work, which is the failure mode that makes people weaken checks.',
    cost: 'one new zero-dependency script, one CI step, and one more thing that must be kept true.',
  }),

  Object.freeze({
    ref: 'GP-02',
    kind: 'new_rule',
    title: 'State what was measured, where it was measured, and whose conclusion it is',
    ask: 'Add one rule to AGENTS.md and to docs/VERIFICATION-POLICY.md: a reported result names the branch and commit it was measured on, and a claim that a check passed cites that check\'s own conclusion rather than a local exit code. Where CI has run on the pushed commit, its conclusion is the one that is reported.',
    from_patterns: Object.freeze(['P-02', 'P-01']),
    changes: Object.freeze(['AGENTS.md', 'docs/VERIFICATION-POLICY.md']),
    what_it_would_do:
      'Close the three corrections of P-02 with one sentence rather than three. Each of those reports was true and read stronger than what had been established; all three would have been written differently under this rule.',
    what_it_would_not_do:
      'A rule does not measure anything, and P-01 is the standing proof that a rule alone does not stop this: the fetch rule was at the top of AGENTS.md while the trap caught two more sessions. This is why it is proposed alongside GP-01 and GP-07 rather than instead of them.',
    against:
      'AGENTS.md is already 30 KB and its power comes from being read. Every rule added to it makes the next one less likely to be. The honest alternative a reviewer should weigh is deleting something from it rather than appending.',
    cost: 'two paragraphs, in two files, in the one place each belongs.',
  }),

  Object.freeze({
    ref: 'GP-03',
    kind: 'new_skill',
    title: 'A skill for reporting a session honestly',
    ask: 'Add `.agents/skills/session-reporting/` — the procedure for stating a result: what was run, on which commit and branch, whose conclusion it is, what is absent versus unknown versus zero, and how to record a correction rather than editing it away.',
    from_patterns: Object.freeze(['P-02', 'P-03']),
    changes: Object.freeze(['.agents/skills/', 'docs/SKILL-MAP.md']),
    what_it_would_do:
      'Put the reporting discipline where a session loads it, next to the fifteen other skills, instead of leaving it distributed across the closing paragraph of AGENTS.md and the commit messages of four corrections. The corrections themselves are the content: 4fe1952, 542dfa8, c3b613f and 6e2f9da each state a rule in the course of applying it.',
    what_it_would_not_do:
      'It does not make a report true. `docs/SKILL-MAP.md` §4 already records that a skill is loaded when somebody loads it, and nothing here enforces that.',
    against:
      'Sixteen skills already exist and the map says to load the one the task needs, not all of them. A skill that every task needs is arguably a rule, and belongs in AGENTS.md — which is GP-02. A reviewer may reasonably take one of the two and refuse the other.',
    cost: 'one skill file, one row in the skill map.',
  }),

  Object.freeze({
    ref: 'GP-04',
    kind: 'new_evaluation',
    title: 'Measure the decision backlog, and whether a decision would survive a clone',
    ask: 'Add a standing evaluation that reports, on every push: how many proposals exist, how many have ever been decided, how old the oldest undecided one is, and how many of them a recorded decision could still be bound to on a fresh clone. Report it beside the autonomy register that already runs there.',
    from_patterns: Object.freeze(['P-07', 'P-08', 'P-10']),
    changes: Object.freeze(['agent/', '.github/workflows/qa.yml']),
    what_it_would_do:
      'Make the central fact of this repository\'s governance visible on every push instead of once a session in prose. Nothing has ever been decided; the number is currently only discoverable by reading a document that says so. It would also surface the mechanical half — that a decision binds to a proposal in a git-ignored store — which no document currently states.',
    what_it_would_not_do:
      'It decides nothing and it does not make deciding easier. H-1 in docs/FIRST-END-TO-END-AUDIT.md is the harder half of that problem: a reviewer is not shown the conditions their approval stands over, and an evaluation that counts the queue does not fix the queue\'s reading surface.',
    against:
      'A backlog metric is the shape of thing `agent/health/model.mjs` marks `not_a_score` for good reasons — the cheap way to move it down is to decide things quickly, and quick decisions on legal records is the harm this whole system is arranged against. If it is added it should be marked `not_a_score` on arrival.',
    cost: 'one module, one CI step, and a metric somebody will eventually want to see go down.',
  }),

  Object.freeze({
    ref: 'GP-05',
    kind: 'reduced_autonomy',
    title: 'Take the prose governance documents out of the automatic path',
    ask: 'Narrow what the grant reaches so that the eight documents AGENTS.md names as the operating policies are not inside an enabled category: add them to NEVER_AUTOMATIC_PATHS, and make the docs-only rule in categoriseProposal() decline to place a policy document in machine_derived_field.',
    from_patterns: Object.freeze(['P-12']),
    changes: Object.freeze(['agent/policy/governance.mjs', 'agent/policy/categories.mjs']),
    what_it_would_do:
      'Make the three lists that protect the executable policy protect the readable one too. Today NEVER_AUTOMATIC_PATHS names `agent/policy/` with the reason "protocol §24: the system must not autonomously rewrite its own governance policy — including by granting itself the right to", and docs/AUTONOMY-POLICY.md, which is that policy in the form a person reads, is on the grant\'s allowlist.',
    what_it_would_not_do:
      'It does not establish that such a change would ever have merged. Six gates and twelve mandatory conditions run after the category and path gates, no autonomous change has ever merged anything, and this is a claim about which gates would not stop it — not a claim that nothing would.',
    against:
      'The grant\'s reason for naming `docs/` is good: Class A already permits reports and proposals there with no approval at all, and the grant narrows that rather than widening it. Excluding eight files by name adds a list that must be kept in step with the documents it names — a second home for the fact of which documents are the policy, which is what this project\'s first principle forbids. A reviewer should ask whether the list belongs in AGENTS.md\'s own table instead, derived rather than retyped.',
    cost: 'a list of eight paths, and the drift risk that comes with it.',
  }),

  Object.freeze({
    ref: 'GP-06',
    kind: 'increased_autonomy',
    title: 'Let a measured count be written back by the run that measured it',
    ask: 'Permit one narrow automatic change: where a tool run in the same cycle emits a count that a tracked file states, and the only difference is that numeral, allow the runner to update it — refusing if any other character on the line changes, if the file is a dataset, or if the count is one of the five `not_a_score` figures.',
    from_patterns: Object.freeze(['P-04']),
    changes: Object.freeze(['agent/policy/governance/grants.jsonl', 'agent/policy/categories.mjs']),
    what_it_would_do:
      'Remove the hand-written step that has drifted six times in the suite list alone, and once in the contracts banner where it is drifting now. Unlike everything else on this list it makes the system looser, and it is proposed because the evidence for the pattern it answers is the strongest of the twelve.',
    what_it_would_not_do:
      'It must never touch the 106 unverified records, the provenance gaps, the verification gaps, the blocking open questions or the rejected-proposal count. Those five are marked `not_a_score` precisely because the cheap route down is a prohibited action, and a mechanism that edits numerals must be blind to them by name.',
    against:
      'This is the riskiest of the seven and the case against it should be read first. It would let an agent edit AGENTS.md — the file that tells the next agent what it may not do — without a person, and the guard is a character-level diff, which is exactly the kind of guard that looks airtight until somebody finds the input that widens it. A reviewer who refuses everything else here should still consider refusing this one hardest, and GP-01 gets most of the benefit by making the drift VISIBLE rather than by making it self-correcting.',
    cost: 'a widened grant, and a new class of change that happens without anybody reading it.',
  }),

  Object.freeze({
    ref: 'GP-07',
    kind: 'new_validation',
    title: 'Report the work that is on a branch and not in main',
    ask: 'Add a check that lists remote branches holding commits `main` does not, flags a session number claimed twice, and prints it on every push. It reports; it does not fail.',
    from_patterns: Object.freeze(['P-06', 'P-05', 'P-01']),
    changes: Object.freeze(['agent/', '.github/workflows/qa.yml']),
    what_it_would_do:
      'Answer audit F-17 — nothing makes concurrent sessions aware of each other — with the cheapest thing that would have caught three of its instances. It would have shown SESSION 23.5 that the Orchestrator existed, shown the audit that its session number was taken, and it shows right now that the end-of-session re-fetch rule was written, pushed, and never merged.',
    what_it_would_not_do:
      'It cannot see a branch nobody pushed, and it says nothing about which of two duplicate implementations should survive — e6f2715 is explicit that a session which wrote one of them is the worst possible judge of that.',
    against:
      'It reports a number that will usually be non-zero and that nobody is obliged to act on, and a check whose output is routinely ignored trains people to ignore checks. It is proposed as a report rather than a failure for that reason, which also makes it easy to argue it changes nothing.',
    cost: 'one small module, one CI step, no new failure mode.',
  }),
]);

/* ---------------------------------------------------------- deriving */

const neverAutomatic = (path) => NEVER_AUTOMATIC_PATHS.some(([p]) => path === p || path.startsWith(p) || p.startsWith(path));

/**
 * The class a proposal is treated as, derived from what it would
 * touch rather than declared. Anything reaching the policy — the
 * executable one or the eight documents that are the readable one —
 * is `human_only`. Nothing here is ever automatic, and
 * `buildProposals` throws rather than emit one that says it is.
 */
export function classOf(changes = []) {
  const governance = changes.filter((c) => neverAutomatic(c) || PROSE_POLICY_DOCS.some((d) => d === c || d.startsWith(c)));
  return governance.length
    ? { autonomy_class: 'human_only', why: `${governance.join(', ')} — a change here is a change to what this system may do, and protocol §24 reserves that to a person.`, governance_paths: governance }
    : { autonomy_class: 'review_required', why: 'nothing this proposal would touch is the governance layer itself, so it is a normal Class C change: a person decides, and the decision is not a governance decision.', governance_paths: [] };
}

/**
 * Build every governance proposal, with its evidence resolved.
 *
 * A draft whose patterns are not all supported is REFUSED and
 * reported, not emitted: a proposal resting on a pattern this tree
 * does not support is a recommendation with nothing behind it.
 *
 * @returns {Promise<{proposals:object[], refused:object[], patterns:object,
 *                    summary:string}>}
 */
export async function buildProposals({ resolveAll, root, now = null, drafts = DRAFTS, classify = classOf } = {}) {
  const evidence = await patternsWithEvidence({ resolveAll, root });
  const supported = new Map(evidence.patterns.map((p) => [p.id, p]));

  const proposals = [];
  const refused = [];

  for (const d of drafts) {
    if (!PROPOSAL_KINDS.includes(d.kind)) {
      throw new Error(`"${d.kind}" is not one of the six kinds this session was asked for: ${PROPOSAL_KINDS.join(', ')}`);
    }
    const missing = d.from_patterns.filter((id) => !supported.has(id));
    const cls = classify(d.changes);
    /* `classify` is injectable so this refusal can be REACHED by
       the suite. A guard that cannot fire is the shape
       docs/AUDIT-2026-09-01.md F-11 records inside validate.mjs, and
       it is worth less than no guard because it reads as one. */
    if (cls.autonomy_class === FORBIDDEN_CLASS) {
      throw new Error(`${d.ref} derived class "${FORBIDDEN_CLASS}". No governance proposal is ever automatic.`);
    }
    const record = Object.freeze({
      contract: null,           // deliberately not on the inter-agent bus; see README §3
      proposal_id: contentId('prop-gov', { kind: d.kind, entities: d.changes, subject: d.title, discriminator: d.ref }),
      ref: d.ref,
      kind: d.kind,
      title: d.title,
      ask: d.ask,
      from_patterns: d.from_patterns,
      evidence: d.from_patterns.map((id) => {
        const p = supported.get(id) ?? evidence.refused.find((r) => r.id === id) ?? null;
        return p
          ? { pattern_id: id, title: p.title, supported: Boolean(p.supported), instances_holding: p.instances_holding, instances_total: p.instances_total }
          : { pattern_id: id, title: null, supported: false, instances_holding: 0, instances_total: 0 };
      }),
      changes: d.changes,
      autonomy_class: cls.autonomy_class,
      autonomy_why: cls.why,
      governance_paths: cls.governance_paths,
      what_it_would_do: d.what_it_would_do,
      what_it_would_not_do: d.what_it_would_not_do,
      against: d.against,
      cost: d.cost,
      requires_human_approval: true,
      decided_by: null,
      decision: null,
      decision_home: 'agent/implement/decisions/decisions.jsonl — the only place a grant exists, written by "node agent/implement/cli.mjs decide". This module has no writer and adds no second home.',
      proposed_by: PROPOSER,
      proposed_in: 'SESSION 28',
      as_of: now,
    });

    if (missing.length) {
      refused.push({ ...record, refused_why: `${missing.length} pattern(s) this proposal rests on are not supported by this tree: ${missing.join(', ')}. A proposal whose evidence has stopped holding is withdrawn rather than argued for.` });
    } else {
      proposals.push(record);
    }
  }

  const byKind = Object.fromEntries(PROPOSAL_KINDS.map((k) => [k, proposals.filter((p) => p.kind === k).length]));
  const unmet = PROPOSAL_KINDS.filter((k) => byKind[k] === 0);

  return {
    proposals,
    refused,
    patterns: evidence,
    by_kind: byKind,
    kinds_with_no_proposal: unmet,
    summary: `${proposals.length} governance proposal(s) across ${PROPOSAL_KINDS.length - unmet.length} of the six kinds · ${evidence.patterns.length} supported pattern(s) · ${evidence.refused.length} refused · every proposal requires human approval and none is decided`,
  };
}
