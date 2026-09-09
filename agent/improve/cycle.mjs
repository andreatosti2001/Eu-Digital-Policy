/* ============================================================
   agent/improve/cycle.mjs — the continuous improvement loop

   OBSERVE → COMPARE → TRIAGE → RECORD → STOP AT A PERSON.

   WHAT MAKES THIS A LOOP AND NOT A REPORT. Everything it observes
   already had a CLI, and running all of them on one afternoon
   produces eight reports and no comparison. The loop adds three
   things and nothing else:

     1. one pass, one as-of date, one corpus position, so the eight
        readings are of the same system at the same instant;
     2. a record of that pass that SURVIVES A CLONE, so the next
        session compares against a measurement rather than against
        the previous session's prose (ledger.mjs says why that is the
        whole argument for tracking it);
     3. a triage that says which desk each finding belongs at, using
        the policy modules and deciding nothing itself.

   THE TRIAGE IS NOT THE GATE LADDER, AND THE DIFFERENCE MATTERS.
   `agent/autonomy/cycle.mjs autonomyGates()` runs six gates over a
   proposal that is IN THE RECORD STORE, on top of eight of
   `preflight`'s ten. This module runs none of them. It answers a
   strictly weaker question — is the derived category one a
   governance grant enables, and do the operation targets name only
   permitted fields — and its answer `eligible` means only "this is
   worth handing to the runner." The runner can and does refuse
   further; on the only real run so far it refused all fourteen. A
   loop that reported `eligible` as though it were `permitted` would
   be the second home for a decision that has one.

   THE LOOP CHANGES NOTHING. It writes no dataset, no page, no
   stylesheet, no locale and no module. Two opt-in writes exist and
   neither touches the site: `--record` appends one line to the cycle
   ledger, and `--store` writes the observed records into
   `agent/records/` so the autonomy runner has something to be handed.
   Without either flag the run is read-only, and `--execute` is not a
   flag this module has: executing is `agent/autonomy/`'s, behind its
   own gates, and a second entrance to it would be a second home for
   the most consequential decision here.

   IT ENDS AT A PERSON, ALWAYS. Every finding the triage cannot route
   to the autonomy runner is routed to a human queue with the reason
   named, in the shape `docs/ORCHESTRATOR.md` requires of all ten
   workflow types. There is no third destination and no "handled
   automatically" bucket.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { RecordStore } from '../scout/store.mjs';
import { evaluate as evaluatePolicy } from '../policy/engine.mjs';
import { policyInForce, fieldsPermitted } from '../policy/governance.mjs';
import { categoriseProposal, effectiveClass, ACTION_CATEGORIES } from '../policy/categories.mjs';
import { MEASURED_CONDITIONS } from '../autonomy/cycle.mjs';
import { REPO_ROOT } from '../implement/baseline.mjs';
import { observe } from './observe.mjs';
import { movement } from './movement.mjs';
import { entryFor, writeCycle, previousCycle } from './ledger.mjs';

export const IMPROVE_AGENT = 'improvement-loop';

/** Contracts whose records are a PROPOSAL — something that names a
 *  change. Everything else the observers ship is a finding or a
 *  question, and a question has no category because it proposes no
 *  act. */
export const PROPOSAL_CONTRACTS = Object.freeze([
  'DataProposal', 'EditorialProposal', 'UXProposal', 'ArchitectureProposal', 'ImplementationProposal',
]);

/**
 * The one mandatory condition that no proposal can satisfy before a
 * run, because it reads a fact about a change that has not been made.
 *
 * It is named here as a constant rather than matched inline so that
 * `agent/improve/selftest.mjs` test 17 can assert the case is still
 * real — and so that the day somebody moves the gate, or adds this
 * to `MEASURED_CONDITIONS`, the constant is the one place to delete.
 */
export const PRE_RUN_UNSATISFIABLE = 'rollback_mechanical';

/** The three destinations, and there is no fourth. */
export const DESTINATIONS = Object.freeze({
  autonomy_runner: 'the derived category is one a governance grant enables and the operation targets name only permitted fields. agent/autonomy/ decides; this is a referral, not a permission.',
  human_queue: 'a person decides. This is where everything else goes, and the reason is recorded per item.',
  no_act_proposed: 'the record names a gap, a question or a finding and proposes no change, so there is nothing to route. It is on the human queue as work, not as a decision.',
});

const gitOf = (root) => {
  const g = (args, fallback = null) => {
    try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { return fallback; }
  };
  return { commit: g(['rev-parse', 'HEAD']), branch: g(['rev-parse', '--abbrev-ref', 'HEAD']) };
};

/**
 * TRIAGE ONE RECORD.
 *
 * Reads the policy in force — never `DEFAULT_POLICY`, which is the
 * base case and would report every act refused for a reason that
 * stopped being true when somebody wrote a grant.
 *
 * `facts` is what a run has MEASURED, and the loop passes none:
 * a cycle observes, and nothing has been measured about a change
 * that has not been made. It is a parameter rather than a hard-coded
 * `{}` for one reason — `agent/policy/conditions.mjs` says plainly
 * that within one process a caller can supply a false fact, so the
 * place a fact could enter has to be visible in the signature
 * instead of buried in a call. The only caller that passes one is
 * `agent/improve/selftest.mjs` test 17b, proving the referring path
 * is not dead code.
 */
export function triage(record, policy, facts = {}) {
  const isProposal = PROPOSAL_CONTRACTS.includes(record?.contract);
  if (!isProposal) {
    return {
      destination: 'no_act_proposed',
      category: null,
      effective_class: null,
      why: `${record?.contract ?? 'this record'} names something to look at and proposes no change, so there is no act to place in a category.`,
    };
  }

  const category = categoriseProposal(record);
  const klass = effectiveClass(record, category.category);
  const def = ACTION_CATEGORIES[category.category] ?? null;
  const enabled = (policy.enabled_categories ?? []).includes(category.category);

  if (!def?.automatable) {
    return {
      destination: 'human_queue',
      category: category.category,
      effective_class: klass.effective,
      why: `"${category.category}" is a category no policy may ever automate. ${category.why}`,
    };
  }
  if (!enabled) {
    return {
      destination: 'human_queue',
      category: category.category,
      effective_class: klass.effective,
      why: `"${category.category}" is automatable in principle and no governance grant enables it. In force: ${(policy.enabled_categories ?? []).join(', ') || 'nothing'}.`,
    };
  }

  const fields = fieldsPermitted(record, policy);
  if (!fields.ok) {
    return {
      destination: 'human_queue',
      category: category.category,
      effective_class: klass.effective,
      why: `the category is enabled and the field gate refuses it: ${fields.why}`,
      field_refusals: fields.refusals,
    };
  }

  /* The policy engine's own verdict, asked with the same actor and
     action `agent/autonomy/cycle.mjs` gate 3 uses, and read by the
     SAME rule: no mandatory condition may FAIL, and the only
     `unknown`s permitted are the four that are measurements taken
     later in the runner's own cycle.
     `MEASURED_CONDITIONS` is imported from the runner rather than
     restated, so the triage cannot drift into refusing what the
     runner would accept — or, worse, referring what it would not.
     Reading `route === 'blocked'` instead would be the first of
     those: before a run, every proposal has four unknowns and the
     route is always `blocked`, so the referring path would be dead
     code that no test could tell from a correct refusal. */
  const decision = evaluatePolicy({
    actor: { kind: 'implementation_qa', id: 'autonomy-runner' },
    action: 'implement.apply',
    environment: 'local',
    resource: { kind: 'canonical_data', id: record?.proposal_id ?? record?.id ?? null },
    proposal: record, policy, facts,
  });
  const failed = decision.conditions.filter((c) => c.verdict === 'failed');
  const unexpectedUnknown = decision.conditions.filter((c) => c.verdict === 'unknown' && !MEASURED_CONDITIONS.includes(c.condition));

  if (failed.length || unexpectedUnknown.length) {
    /* THE ONE CASE WORTH SEPARATING, AND SESSION 27 FOUND IT BY
       BUILDING THIS TRIAGE. `rollback_mechanical` reads a CHANGE
       CONTEXT — the branch, the base commit and the per-file
       pre-change hashes `agent/implement/apply.mjs openContext()`
       records. That context is produced in step 2 of the seven, and
       gate 3 runs before step 1. So four of the six rollback
       elements are `unknown` for EVERY proposal at this point, the
       condition fails, and gate 3 refuses. It is not in
       `MEASURED_CONDITIONS`, so the exemption the other four
       measurements have does not cover it.

       This module does NOT work around that. Referring a proposal
       the runner would refuse would make the loop's answer disagree
       with the answer that governs, which is the drift the whole
       arrangement is against. It reports it instead, per item and as
       a signal on every cycle, so a structural blocker is a
       measurement a person can act on rather than a silence.
       `docs/CONTINUOUS-IMPROVEMENT.md` §4 carries it as a finding,
       and it is not fixed here: changing what a gate proves is Class
       C work on the governance layer, and `agent/policy/` is on the
       never-automatic path list on purpose. */
    const onlyPreRun = !unexpectedUnknown.length
      && failed.length === 1
      && failed[0].condition === PRE_RUN_UNSATISFIABLE;

    return {
      destination: 'human_queue',
      category: category.category,
      effective_class: klass.effective,
      blocked_only_by_prerun_condition: onlyPreRun,
      why: onlyPreRun
        ? `everything this triage can check passes, and the single refusal is "${PRE_RUN_UNSATISFIABLE}", which NO proposal can satisfy at this point: it reads the branch, base commit and per-file pre-change hashes that agent/implement/apply.mjs openContext() records in step 2, and agent/autonomy/ evaluates it in gate 3, before step 1. ${failed[0].why ?? ''}`.trim()
        : `${failed.length} mandatory condition(s) fail and ${unexpectedUnknown.length} non-measurement condition(s) are unknown, and an unknown blocks exactly as a failure does: ${[...failed, ...unexpectedUnknown].map((c) => `${c.condition} (${c.verdict})`).join(', ')}. ${decision.route === 'blocked' ? 'Protocol §8: these are closed by the agent that owns the proposal, not by approving harder.' : ''}`.trim(),
      failed_conditions: failed.map((c) => c.condition),
      unknown_conditions: unexpectedUnknown.map((c) => c.condition),
      policy_route: decision.route,
    };
  }

  return {
    destination: 'autonomy_runner',
    category: category.category,
    effective_class: klass.effective,
    why: `"${category.category}" is enabled by ${(policy.granted_by ?? []).map((g) => g.grant_id).join(', ') || 'a grant'}, every operation target is a permitted field, no mandatory condition fails, and the only unknowns are the ${MEASURED_CONDITIONS.length} that are measurements. agent/autonomy/ runs the six gates and eight preflight checks that decide.`,
    policy_route: decision.route,
    unknown_conditions: decision.conditions.filter((c) => c.verdict === 'unknown').map((c) => c.condition),
  };
}

/**
 * ONE CYCLE.
 *
 * @param {{tracer:object, asOf:string, only?:string[], validators?:boolean,
 *          record?:boolean, store?:boolean, root?:string, session?:string,
 *          cycleDir?:string, governanceDir?:string, now?:string}} opts
 */
export async function runImprovementCycle({
  tracer, asOf, only = null, validators = true, record = false, store = false,
  root = REPO_ROOT, session = null, cycleDir = undefined, governanceDir = undefined,
  now = new Date().toISOString(),
} = {}) {
  const run = tracer.startRun({
    kind: 'agent', agent: IMPROVE_AGENT,
    task: 'observe the whole system once, compare it with the last recorded cycle, and route every finding to a desk',
  });

  try {
    /* ---------------------------------------------- 1 · observe */
    const observation = await run.step(
      { kind: 'tool', name: 'improve.observe', inputs: { as_of: asOf, only, validators }, captureOutput: false },
      () => observe({ tracer, asOf, only, validators, root }),
    );

    run.observe({
      summary: `COVERAGE — ${observation.observers_run.length} observer(s) ran, ${observation.observers_failed.length} did not. ${observation.findings.length} finding(s), ${observation.signals.length} signal(s).`,
      subject: 'coverage',
      data: {
        ran: observation.observers_run,
        failed: observation.observers_failed,
        skipped: observation.observers_skipped,
        findings: observation.findings.length,
      },
    });

    /* ---------------------------------------------- 2 · triage */
    const inForce = policyInForce({ dir: governanceDir, now });
    const policy = inForce.policy;

    const routed = [];
    for (const rec of observation.records) {
      const t = triage(rec, policy);
      const idField = rec?.proposal_id ?? rec?.gap_id ?? rec?.finding_id ?? rec?.request_id ?? rec?.id ?? null;
      routed.push({
        finding_id: typeof idField === 'string' ? idField : null,
        contract: rec?.contract ?? null,
        observer: observation.findings.find((f) => f.finding_id === idField)?.observer ?? null,
        ...t,
      });
    }

    const eligible = routed.filter((r) => r.destination === 'autonomy_runner');
    const human = routed.filter((r) => r.destination === 'human_queue');
    const noAct = routed.filter((r) => r.destination === 'no_act_proposed');
    const preRunBlocked = routed.filter((r) => r.blocked_only_by_prerun_condition === true);
    const byCategory = {};
    for (const r of routed) if (r.category) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;

    /* Measured on every cycle rather than written down once. A
       proposal that clears everything the triage can check and is
       refused by a condition no proposal can satisfy at that point
       is the difference between "nothing qualifies" and "nothing
       CAN qualify", and those are very different reports. */
    observation.signals.push({
      signal_id: 'triage.blocked_only_by_prerun_condition',
      value: preRunBlocked.length,
      unit: 'proposals',
      why: `proposals that pass every check this triage can make and are refused solely by "${PRE_RUN_UNSATISFIABLE}", which reads a change context that does not exist until step 2 of a cycle gate 3 runs before step 1. docs/CONTINUOUS-IMPROVEMENT.md §4.`,
      detail: preRunBlocked.map((r) => r.finding_id),
      visibility: 'public',
    });

    run.observe({
      summary: `TRIAGE — ${eligible.length} referable to the autonomy runner · ${human.length} to a person · ${noAct.length} propose no act. Policy ${policy.policy_id}.`,
      subject: 'triage',
      data: { eligible: eligible.map((r) => r.finding_id), by_category: byCategory, policy_id: policy.policy_id },
    });

    /* ---------------------------------------------- 3 · compare */
    const prev = previousCycle({ dir: cycleDir, before: now });
    const entry = entryFor({
      observation,
      routing: { eligible: eligible.length, human: human.length, refused: 0, merged: 0, by_category: byCategory },
      trace_id: run.trace_id,
      commit: gitOf(root).commit,
      branch: gitOf(root).branch,
      recordedAt: now,
      session,
    });
    const moved = movement(entry, prev);

    run.observe({
      summary: moved.first_cycle
        ? 'MOVEMENT — no previous cycle is recorded, so nothing is established about movement. Every finding is undetermined rather than new.'
        : `MOVEMENT — ${moved.summary.new} new · ${moved.summary.persisting} persisting · ${moved.summary.resolved} resolved · ${moved.summary.undetermined} undetermined, against ${prev.cycle_id}.`,
      subject: 'movement',
      data: moved.summary,
    });

    /* ---------------------------------------------- 4 · record */
    let written = null;
    if (record) {
      written = writeCycle(entry, { dir: cycleDir });
      run.observe({
        summary: `RECORDED — ${entry.cycle_id} appended to the git-tracked cycle ledger (${written.bytes} bytes). ${entry.signals_withheld.length} private signal(s) withheld.`,
        subject: 'ledger',
        data: { cycle_id: entry.cycle_id, path: written.path, withheld: entry.signals_withheld },
      });
    }

    let stored = null;
    if (store) {
      const rs = new RecordStore({ allowSimulated: false });
      let n = 0;
      for (const rec of observation.records) { rs.write(rec); n += 1; }
      stored = { records: n, dir: rs.dir };
      run.observe({
        summary: `STORED — ${n} record(s) written to the record store so agent/autonomy/ can be handed them. Nothing in data/, i18n/, js/, css/ or any page was touched.`,
        subject: 'store',
        data: stored,
      });
    }

    run.end({ status: 'ok', outputs: { findings: observation.findings.length, eligible: eligible.length, human: human.length, recorded: Boolean(written) } });

    return {
      trace_id: run.trace_id,
      as_of: observation.as_of,
      policy_id: policy.policy_id,
      observation,
      entry,
      movement: moved,
      previous: prev,
      routed,
      triage: { eligible, human, no_act: noAct, pre_run_blocked: preRunBlocked, by_category: byCategory },
      recorded: written,
      stored,
      /* Said in the return value rather than only in a document,
         because this is the sentence a reader of a green report most
         needs and most easily skips. */
      what_this_does_not_prove: [
        'An `eligible` referral is not a permission. agent/autonomy/ runs six gates plus eight of preflight\'s ten and refuses on any of them; on its only real run it refused all fourteen proposals it was handed.',
        'A finding absent from this cycle is only "resolved" where the observer that owns it ran in BOTH cycles. Where it did not, the finding is undetermined and is never counted as an improvement.',
        'No observer here opens a rendered page, retrieves a document, or reads a sentence for truth. agent/browser/ does the first; nothing in this environment can do the second (SESSION 25 measured the refusal); nothing here does the third.',
        'A rise in most of these counts is usually the system looking harder rather than getting worse. movement.mjs marks which signals have no better direction, and refuses to rank them.',
      ],
    };
  } catch (e) {
    run.end({ status: 'failed', error: `${e?.message ?? e}` });
    throw e;
  }
}
