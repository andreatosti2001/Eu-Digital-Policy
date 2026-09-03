/* ============================================================
   agent/health/control.mjs — PRIVATE CONTROL PLANE / AGENT SYSTEM
   HEALTH

   The fifteen SESSION 20 names. What a failure here costs is not
   visible to any reader: it is the system losing the ability to say
   what it did and on whose authority. That is what every other
   guarantee in this repository rests on, which is why it is a domain
   and not a footnote to the other two.

   EVERY METRIC HERE IS PRIVATE, WITH TWO NAMED EXCEPTIONS.

   `model.mjs` refuses a control-plane metric marked public unless it
   carries a `public_justification`, so publishing one is a decision
   somebody wrote down rather than a default nobody noticed. Two
   carry it — the count of proposals awaiting a human, and whether
   any change has ever been applied to the site by an agent — because
   both are facts a reader of a site about EU law is entitled to
   know, and neither reveals anything operational. Everything else is
   `private`, and `publicSubset()` in metrics.mjs is a whitelist over
   this flag rather than a filter that removes what somebody
   remembered to name.

   FIVE OF THE FIFTEEN ARE `unmeasurable` OR `not_applicable`, AND
   THAT IS THE HONEST ANSWER RATHER THAN A GAP IN THE WORK.

   There is no Control Room until SESSION 21, so its availability is
   not 100%. There is no authentication anywhere in this repository,
   so "authentication failures" is not 0 — it is a question with no
   mechanism behind it, and reporting a zero would describe a system
   that passes a check it does not have. SESSION 20's own wording,
   "where observable", is the hook these hang on.
   ============================================================ */

import { defineMetric, measured, unmeasurable, notApplicable } from './model.mjs';
import { allSpans, allEvents, allAgentRuns, allRecords } from './gather.mjs';
import { getContract } from '../schemas/registry.mjs';
import { validate } from '../schemas/validate.mjs';
import { AUTONOMY_RANK } from '../schemas/types.mjs';
import { LEGAL_RECORD_PATHS } from '../implement/scope.mjs';

/** Empty is a real answer and a different one from "nobody ran the
 *  agents". Both are stated rather than collapsed. */
function noRuns(ctx) {
  return ctx.traces.length === 0
    ? unmeasurable(
      'the trace store holds no runs. agent/observability/runs/ is git-ignored, so a fresh checkout starts empty — this is an absence of OBSERVATION, not an absence of failures.',
      'run any agent, then re-run the monitor. docs/HANDOVER.md "Exact next objective" lists the chain.',
    )
    : null;
}

export const CONTROL_METRICS = [

  defineMetric({
    id: 'control_plane.agent_failures',
    name: 'Agent failures',
    domain: 'control_plane',
    definition: 'Agent runs in the stored traces that ended with status "failed", plus error events marked fatal.',
    source: 'agent/observability/runs/*.jsonl, via loadTrace()',
    calculation: 'Spans of kind "agent" or "orchestrator" whose status is "failed", plus error events whose fatal flag is true. Counted across every stored trace, not just the newest.',
    frequency: 'per_run',
    interpretation: 'Above 0 means an agent threw and its work is incomplete. It is worth more than its count: an agent that failed halfway has produced a partial record set that later agents may consume as if it were whole, and nothing downstream checks for that.',
    limitations: 'It sees only what was traced. An agent that crashed before opening a span leaves nothing, and the trace store is git-ignored so it holds only what THIS machine has run. A clean number here means no failure was recorded, not that none happened.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const gap = noRuns(ctx); if (gap) return gap;
      const runs = allAgentRuns(ctx).filter((a) => a.status === 'failed');
      const fatal = allEvents(ctx, 'error').filter((e) => e.fatal);
      return measured(runs.length + fatal.length, {
        unit: 'failures',
        of: allAgentRuns(ctx).length,
        detail: {
          failed_runs: runs.map((r) => ({ agent: r.agent, task: r.task, trace_id: r.trace_id })),
          fatal_errors: fatal.map((e) => ({ agent: e.agent, message: `${e.message}`.slice(0, 160), trace_id: e.trace_id })),
          total_agent_runs: allAgentRuns(ctx).length,
        },
        evidence: ['agent/observability/runs/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.failed_handoffs',
    name: 'Failed handoffs',
    domain: 'control_plane',
    definition: 'Handoff events naming a receiving agent that never opened a run in the same trace — work passed to somebody who never took it.',
    source: 'agent/observability/runs/*.jsonl, handoff events',
    calculation: 'For each handoff, whether any agent span in the same trace has the handoff\'s to_agent. A handoff to an agent that never started is an OPEN handoff, which the viewer already shows as a queue entry; this counts them.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a chain stopped. That is not automatically a defect — the chain in docs/HANDOVER.md is deliberately run one agent at a time, and each step hands to the next before the next exists. So a rise means work was queued and not picked up, and the fix is usually to run the next agent rather than to change anything.',
    limitations: 'It cannot distinguish "queued, will be run next" from "dropped". Both look identical in a trace store that holds one run per agent. It also only sees handoffs WITHIN one trace; a cross-trace handoff carried by parent_run_id is not counted here.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const gap = noRuns(ctx); if (gap) return gap;
      const open = [];
      for (const t of ctx.traces) {
        const started = new Set((t.agents ?? []).map((a) => a.agent));
        for (const h of t.handoffs ?? []) if (h.to_agent && !started.has(h.to_agent)) open.push({ from: h.from_agent, to: h.to_agent, trace_id: t.trace_id, reason: h.reason });
      }
      const total = ctx.traces.reduce((n, t) => n + (t.handoffs ?? []).length, 0);
      return measured(open.length, {
        unit: 'open handoffs',
        of: total,
        detail: { open, total_handoffs: total, note: 'an open handoff is a queue entry. Running the receiving agent closes it; nothing here can tell a queued handoff from a dropped one.' },
        evidence: ['agent/observability/runs/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.incomplete_traces',
    name: 'Incomplete traces',
    domain: 'control_plane',
    definition: 'Spans left in status "running" — opened and never closed — plus stored trace files with lines that do not parse, plus trace records that fail the observability schema.',
    source: 'agent/observability/runs/*.jsonl, via loadTrace() and cli.mjs validate',
    calculation: 'Spans whose status is "running" after the file was fully read, plus broken_lines and invalid records reported by loadTrace.',
    frequency: 'per_run',
    interpretation: 'A span left running reads as what it is: an agent that did not close it, usually because the process died. Above 0 means at least one run cannot be reconstructed end to end, which is precisely the property the observability layer exists to provide. A broken line means the file was written to during a crash.',
    limitations: 'It cannot see a trace that was never written. An agent that failed before its first emit leaves no file, and this metric reports 0 for it — a complete absence looks identical to a clean run, and only the census in the run that should have produced it would catch that.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const gap = noRuns(ctx); if (gap) return gap;
      const running = allSpans(ctx).filter((s) => s.status === 'running');
      const broken = ctx.traces.reduce((n, t) => n + (t.broken_lines ?? []).length, 0);
      const invalid = ctx.traces.reduce((n, t) => n + (t.invalid ?? []).length, 0);
      return measured(running.length + broken + invalid, {
        unit: 'incomplete records',
        of: allSpans(ctx).length,
        detail: {
          spans_left_running: running.map((s) => ({ name: s.name, agent: s.agent, span_id: s.span_id })),
          unparseable_lines: broken,
          schema_invalid_records: invalid,
          trace_load_errors: ctx.trace_errors,
          total_spans: allSpans(ctx).length,
        },
        evidence: ['agent/observability/runs/', 'node agent/observability/cli.mjs validate'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.proposal_failures',
    name: 'Proposal failures',
    domain: 'control_plane',
    definition: 'Proposals in the record store that no longer satisfy their own contract when re-validated now.',
    source: 'agent/records/*.jsonl, re-checked through agent/schemas/validate.mjs',
    calculation: 'Every record whose contract kind is "proposal", validated again at read time with allowSimulated false. A record that was valid when written and is not now has either been edited or was written against a contract that has since changed.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a proposal cannot be implemented and, more importantly, that something changed a record after it was emitted — the gateway hashes every record into the trace when it is handed over, so a record that no longer validates is a record that no longer matches what was handed over.',
    limitations: 'It re-validates SHAPE. It cannot tell an edited record from one whose contract was tightened by a later session, and the second is a legitimate reason for this number to rise. The gateway\'s sha256 in the trace would separate them and this metric does not currently compare it.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const props = allRecords(ctx).filter((r) => { try { return getContract(r.contract).kind === 'proposal'; } catch { return false; } });
      if (!props.length) {
        return unmeasurable(
          'the record store holds no proposals. agent/records/ is git-ignored and empty in a fresh checkout — this is an absence of runs, not an absence of failures.',
          'run any producing agent, then re-run the monitor.',
        );
      }
      const bad = props.map((p) => ({ id: p.proposal_id, contract: p.contract, errors: validate(p, { allowSimulated: false }) })).filter((x) => x.errors.length);
      return measured(bad.length, {
        unit: 'invalid proposals',
        of: props.length,
        detail: { total_proposals: props.length, invalid: bad.slice(0, 10) },
        evidence: ['agent/records/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.approval_failures',
    name: 'Approval failures',
    domain: 'control_plane',
    definition: 'Approval records the system cannot act on: lines in the decision ledger that do not parse, decisions naming a proposal nobody can produce, and decisions whose binding no longer matches the proposal.',
    source: 'agent/implement/decisions/decisions.jsonl, and agent/implement/ledger.mjs deriveApproval()',
    calculation: 'Malformed ledger lines, plus proposals whose derived approval state is void_unknown_proposal or void_scope_changed.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a decision exists that authorises nothing. void_scope_changed is the one to read carefully: it means somebody approved a proposal and the proposal changed afterwards, which the ledger deliberately treats as void rather than carrying the approval onto a scope nobody agreed to.',
    limitations: 'The ledger is a file. Anybody who can write to the working tree can write a line in it, and this metric checks that a line is well-formed and its binding holds — not that a human wrote it. docs/IMPLEMENTATION-QA.md §9 open question 1.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const malformed = ctx.ledger.malformed ?? [];
      const voids = ctx.proposals.filter((p) => ['void_unknown_proposal', 'void_scope_changed'].includes(p.approval.state));
      return measured(malformed.length + voids.length, {
        unit: 'unusable approvals',
        detail: {
          malformed_ledger_lines: malformed,
          void_scope_changed: voids.filter((p) => p.approval.state === 'void_scope_changed').map((p) => p.proposal_id),
          void_unknown_proposal: voids.filter((p) => p.approval.state === 'void_unknown_proposal').map((p) => p.proposal_id),
          ledger_decisions: (ctx.ledger.decisions ?? []).length,
        },
        evidence: [ctx.ledger.path],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.authorization_failures',
    name: 'Authorization failures',
    domain: 'control_plane',
    definition: 'Decisions that would have granted authority to somebody not entitled to give it: approvals whose decided_by is an agent in this system.',
    source: 'agent/implement/decisions/decisions.jsonl, checked by deriveApproval() at READ time',
    calculation: 'Proposals whose derived approval state is void_self_approved. The check runs at read time as well as at write time, because a check that runs only on write protects only the file that process wrote.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a grant was recorded by an agent rather than a person. It is a governance failure rather than a bug: docs/AGENT-ROLES.md H3 is that no agent verifies its own output, and an approval signed by an agent is that failure with a longer name. Any value above 0 should stop work until somebody explains how it got there.',
    limitations: 'It recognises an agent by NAME, matched against the agents that appear in the record store. A decision signed with a name that belongs to no agent passes — which is correct, and is also why this cannot substitute for authentication.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const selfApproved = ctx.proposals.filter((p) => p.approval.state === 'void_self_approved');
      return measured(selfApproved.length, {
        unit: 'self-approved decisions',
        detail: {
          self_approved: selfApproved.map((p) => ({ proposal_id: p.proposal_id, decided_by: p.approval.decision?.decided_by ?? null, produced_by: p.agent })),
          note: 'refused at write time by recordDecision() and again at read time by deriveApproval(). A non-zero count means a decision reached the file some other way.',
        },
        evidence: [ctx.ledger.path],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.rejected_proposals',
    name: 'Rejected proposals',
    domain: 'control_plane',
    definition: 'Proposals a human decided against, recorded in the ledger with outcome "denied".',
    source: 'agent/implement/decisions/decisions.jsonl',
    calculation: 'Ledger entries whose outcome is "denied", counted against the total number of decisions.',
    frequency: 'per_run',
    interpretation: 'NOT A DEFECT COUNT AND NOT TO BE OPTIMISED. A rejection is the governance system working: a human looked at a proposal and said no. An agent shown this as a number to reduce would learn to propose less, or to propose only what is easy to approve, and both are worse than a high rejection rate. What IS worth reading is the RATIO to grants over time, and whether the same proposal keeps coming back after being refused.',
    limitations: 'Zero today, and it means nothing has ever been decided at all rather than that nothing has been rejected. Until the ledger holds decisions, this number and a healthy one are indistinguishable.',
    visibility: 'private',
    direction: 'not_a_score',
    measure(ctx) {
      const decisions = ctx.ledger.decisions ?? [];
      const denied = decisions.filter((d) => d.outcome === 'denied');
      return measured(denied.length, {
        unit: 'rejections',
        of: decisions.length,
        detail: {
          total_decisions: decisions.length,
          denied: denied.map((d) => ({ proposal_id: d.proposal_id, by: d.decided_by, at: d.decided_at, note: d.note })),
          granted: decisions.filter((d) => d.outcome === 'granted').length,
          note: decisions.length === 0
            ? 'THE LEDGER IS EMPTY. Zero rejections here means nothing has ever been decided, not that nothing has been rejected. Not one proposal in this repository has been decided in twenty sessions.'
            : null,
        },
        evidence: [ctx.ledger.path],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.reverted_changes',
    name: 'Reverted changes',
    domain: 'control_plane',
    definition: 'ChangeRecords whose state is "reverted" — changes an agent applied and then undid because the checks came back worse than the recorded baseline, or because the change left its approved scope.',
    source: 'agent/records/*.jsonl, ChangeRecord contract',
    calculation: 'ChangeRecords with state "reverted", plus rollback observations on the trace whose verified flag is false.',
    frequency: 'per_run',
    interpretation: 'A revert is the system working, not failing: docs/AUTONOMY-POLICY.md Class B requires a full revert if a validator fails, and agent/implement/ applies that to every class. What is a genuine failure is an UNVERIFIED revert — a rollback that ran and did not restore the recorded pre-change hashes — and that is counted separately and is never zero-by-default.',
    limitations: 'A revert is only recorded if an agent performed it. A human who applied a change by hand and undid it by hand leaves nothing here. Nothing has ever been applied by an agent in this repository, so this metric has never had a non-zero input.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const changes = allRecords(ctx).filter((r) => r.contract === 'ChangeRecord');
      const reverted = changes.filter((c) => c.state === 'reverted');
      const failedRollbacks = allEvents(ctx, 'observation').filter((o) => o.subject === 'rollback' && o.data && o.data.verified === false);
      return measured(reverted.length + failedRollbacks.length, {
        unit: 'reverts',
        of: changes.length,
        detail: {
          change_records: changes.length,
          reverted: reverted.map((c) => c.change_id),
          rollbacks_that_did_not_verify: failedRollbacks.map((o) => ({ mismatches: (o.data.mismatches ?? []).length, summary: o.summary })),
          note: 'a verified revert is the system working. An UNVERIFIED revert — one that ran without restoring the recorded pre-change hashes — is the failure, and it is counted here too.',
        },
        evidence: ['agent/records/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.unresolved_conflicts',
    name: 'Unresolved conflicts',
    domain: 'control_plane',
    definition: 'Blocking open questions across every contract record: epistemic.unresolved entries whose blocks flag is true, meaning nothing downstream may proceed on that record until it is closed.',
    source: 'agent/records/*.jsonl, the epistemic block on every contract',
    calculation: 'Entries in epistemic.unresolved with blocks true, across every record in the store, grouped by the question so the same blocker across many records is visible as one thing.',
    frequency: 'per_run',
    interpretation: 'NOT A DEFECT COUNT AND NOT TO BE OPTIMISED. A blocking open question is an agent saying it could not settle something and refusing to proceed as if it had. Driving this number down by removing the flag is the single most damaging edit available in the agent layer — it converts "could not be established" into "established", silently, across everything downstream. It falls legitimately when somebody ANSWERS the question, and that work happens outside this repository.',
    limitations: 'It counts declared blockers. A record that should have raised one and did not is invisible, and no check here can find it — the boundary modules in each agent decide what blocks, and a lapse there produces a clean number.',
    visibility: 'private',
    direction: 'not_a_score',
    measure(ctx) {
      const recs = allRecords(ctx);
      if (!recs.length) return unmeasurable('the record store is empty', 'run any agent, then re-run the monitor');
      const blockers = [];
      for (const r of recs) {
        for (const u of r.epistemic?.unresolved ?? []) {
          if (u.blocks) blockers.push({ record: r.contract, question: u.question, missing: u.missing, absence_kind: u.absence_kind });
        }
      }
      const byQuestion = {};
      for (const b of blockers) byQuestion[b.question] = (byQuestion[b.question] ?? 0) + 1;
      /* No `of`. The count is blockers, the population is records,
         and one record can raise several — "90 of 70" reads as a
         ratio it is not. The record count is in the detail. */
      return measured(blockers.length, {
        unit: 'blocking open questions',
        detail: {
          across_records: recs.length,
          distinct_questions: Object.keys(byQuestion).length,
          by_question: Object.entries(byQuestion).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([q, n]) => ({ question: `${q}`.slice(0, 140), records: n })),
          note: 'a blocking question falls legitimately only when somebody ANSWERS it. Removing the flag converts "could not be established" into "established" across everything downstream.',
        },
        evidence: ['agent/records/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.policy_violations',
    name: 'Policy violations',
    domain: 'control_plane',
    definition: 'Recorded attempts to act outside what the governance policy permits: approval claims written into the agent record store and discarded, and implementation runs that wrote outside their approved scope.',
    source: 'agent/observability/runs/*.jsonl (the implement view), agent/implement/ledger.mjs',
    calculation: 'Discarded approval claims found by deriveApproval, plus scope violations reported on any implementation trace.',
    frequency: 'per_run',
    interpretation: 'Above 0 means something tried to take authority it did not have. A discarded approval claim is the sharpest case: an ApprovalRequest in agent/records/ with state "granted" is an agent asserting a human decision. The agent layer refuses it and REPORTS it, and this is where the report surfaces.',
    limitations: 'It counts violations the system caught. A violation nothing checks for is not here — and the list of things checked is the list in agent/implement/, which is finite and was written by the same author as the agents it constrains.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const discarded = ctx.proposals.flatMap((p) => (p.approval.discarded ?? []).map((d) => ({ proposal_id: p.proposal_id, ...d })));
      const scopeViolations = [];
      for (const t of ctx.traces) {
        for (const o of t.observations ?? []) {
          if (o.subject === 'change context' || !o.data) continue;
          if (Array.isArray(o.data.outside) && o.data.outside.length) scopeViolations.push({ trace_id: t.trace_id, outside: o.data.outside });
        }
      }
      return measured(discarded.length + scopeViolations.length, {
        unit: 'violations',
        detail: {
          discarded_approval_claims: discarded,
          scope_violations: scopeViolations,
          note: 'a discarded approval claim is an agent asserting a human decision. It is refused and reported; a rise means something tried.',
        },
        evidence: ['agent/records/', 'agent/observability/runs/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.unauthorized_action_attempts',
    name: 'Unauthorized action attempts',
    domain: 'control_plane',
    definition: 'Attempts to implement a proposal that was not in an implementable state — every refusal by the "approved" gate, plus every refusal by the paths-no-approval-can-reach list.',
    source: 'agent/observability/runs/*.jsonl, the implement view\'s refusals_by_gate',
    calculation: 'Refusals attributed to the "approved" or "permitted_files_defined" gates across every implementation trace.',
    frequency: 'per_run',
    interpretation: 'READ THIS ONE CAREFULLY, BECAUSE A HIGH NUMBER IS NOT AN ATTACK. Today every one of these is an agent asking whether a pending proposal may be implemented and being told no — the system enumerating its queue, not something trying to get past it. What WOULD be alarming is a refusal by permitted_files_defined, which means a proposal named a path no approval can authorise; those are reported separately below.',
    limitations: 'It counts what an agent asked and was refused. It cannot see an action taken outside the agent layer — a person editing data/*.json by hand is not an unauthorized attempt here, it is a commit, and only git records it.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const byGate = {};
      const neverWritable = [];
      for (const t of ctx.traces) {
        const i = t.implement;
        if (!i) continue;
        for (const [g, n] of Object.entries(i.refusals_by_gate ?? {})) byGate[g] = (byGate[g] ?? 0) + n;
        for (const r of i.refusals ?? []) {
          if (r.gates.includes('permitted_files_defined')) neverWritable.push({ proposal_id: r.proposal_id, why: r.why[r.gates.indexOf('permitted_files_defined')] });
        }
      }
      if (!Object.keys(byGate).length) {
        return unmeasurable(
          'no implementation run is in the trace store, so nothing has asked to act and nothing has been refused.',
          'node agent/implement/cli.mjs run --as-of <date>, then re-run the monitor.',
        );
      }
      return measured((byGate.approved ?? 0) + (byGate.permitted_files_defined ?? 0), {
        unit: 'refused attempts',
        detail: {
          refused_by_gate: byGate,
          refused_for_naming_an_unwritable_path: neverWritable,
          note: 'today these are an agent enumerating its queue and being told no, which is the system working. A refusal by permitted_files_defined is the one that means a proposal named a path no approval can authorise.',
        },
        evidence: ['agent/observability/runs/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.missing_provenance',
    name: 'Missing provenance',
    domain: 'control_plane',
    definition: 'Contract records that stand on nothing: an empty evidence array, or evidence consisting only of entries of kind "absent", without an unresolved entry saying so.',
    source: 'agent/records/*.jsonl, the envelope every contract carries',
    calculation: 'Records whose evidence[] is empty AND whose epistemic.unresolved is also empty — a record asserting something with no evidence and no admission that it has none.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a record exists that cannot be traced to anything. "absent" is a first-class evidence kind here precisely so a record with nothing can SAY so; a record with neither evidence nor an admission is the failure that kind exists to prevent.',
    limitations: 'It checks that evidence is PRESENT, not that it supports the record. A record citing a file that does not say what it claims passes. agent/ux/ found two lenses doing exactly that and only a byte-check against the named file caught them; nothing here re-reads the quoted bytes.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const recs = allRecords(ctx);
      if (!recs.length) return unmeasurable('the record store is empty', 'run any agent, then re-run the monitor');
      const bare = recs.filter((r) => !(r.evidence ?? []).length && !(r.epistemic?.unresolved ?? []).length);
      const absentOnly = recs.filter((r) => (r.evidence ?? []).length && (r.evidence ?? []).every((e) => e.kind === 'absent'));
      return measured(bare.length, {
        unit: 'records with no provenance and no admission',
        of: recs.length,
        detail: {
          bare: bare.map((r) => r.contract).slice(0, 12),
          standing_only_on_absence: absentOnly.length,
          standing_only_on_absence_note: 'these are NOT counted as failures: a record whose evidence is entirely "absent" is a record correctly saying it has none.',
          total_records: recs.length,
        },
        evidence: ['agent/records/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.autonomy_policy_violations',
    name: 'Autonomy-policy violations',
    domain: 'control_plane',
    definition: 'Proposals whose declared autonomy_class is lower than what they actually touch: anything claiming "autonomous" that would write to the legal record, and anything claiming less than human_only that adds a dependency or a build step.',
    source: 'agent/records/*.jsonl, checked against docs/AUTONOMY-POLICY.md via agent/implement/scope.mjs',
    calculation: 'For each proposal, the paths it would touch are derived and compared against LEGAL_RECORD_PATHS. A proposal touching one while declaring autonomous is a violation. ImplementationProposals adding a dependency or a build step while declaring anything but human_only are also counted.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a proposal understated what it would do. docs/AUTONOMY-POLICY.md says the default when unsure is the HIGHER class, and that misclassifying downward is the failure the document exists to prevent. Any value above 0 should be read as a defect in the producing agent, not in the proposal.',
    limitations: 'It compares a declared class against the PATHS a proposal touches. It cannot judge whether a change to a path is substantive — a whitespace fix in data/claims.json and a changed fine amount are the same path, and the policy treats them very differently.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const props = ctx.proposals;
      if (!props.length) return unmeasurable('the record store holds no proposals', 'run any producing agent, then re-run the monitor');
      const violations = [];
      for (const { proposal: p, proposal_id: id } of props) {
        const paths = [
          ...(p.affected_entities ?? []).map((e) => e.path),
          ...(p.proposed_change?.operations ?? []).map((o) => o.target),
          ...(p.files ?? []),
        ].filter(Boolean).map((x) => String(x).replace(/^\.?\//, ''));
        const legal = paths.filter((x) => LEGAL_RECORD_PATHS.some((l) => x === l || x.startsWith(l)));
        if (legal.length && AUTONOMY_RANK[p.autonomy_class] < AUTONOMY_RANK.review_required) {
          violations.push({ proposal_id: id, autonomy_class: p.autonomy_class, touches: [...new Set(legal)], why: 'touches the legal record while declaring a class below review_required' });
        }
        if ((p.new_dependencies ?? []).length && p.autonomy_class !== 'human_only') {
          violations.push({ proposal_id: id, autonomy_class: p.autonomy_class, why: `adds ${p.new_dependencies.join(', ')} — zero dependencies is a red-tier prohibition` });
        }
        if (p.adds_build_step === true && p.autonomy_class !== 'human_only') {
          violations.push({ proposal_id: id, autonomy_class: p.autonomy_class, why: 'adds a build step, which is red tier' });
        }
      }
      return measured(violations.length, {
        unit: 'misclassified proposals',
        of: props.length,
        detail: { violations, total_proposals: props.length, note: 'AUTONOMY-POLICY.md: the default when unsure is the HIGHER class. Misclassifying downward is the failure that document exists to prevent.' },
        evidence: ['agent/records/', 'docs/AUTONOMY-POLICY.md'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.control_room_availability',
    name: 'Control Room availability',
    domain: 'control_plane',
    definition: 'Whether the private administrative interface is reachable and serving.',
    source: 'nothing. There is no Control Room in this repository.',
    calculation: 'None is possible. SESSION 21 builds the Control Room; nothing here is one. agent/observability/server.mjs is a LOCAL DEVELOPMENT VIEWER — it is not an administrative interface, it exposes no approval action, and calling it a Control Room would misdescribe both.',
    frequency: 'continuous',
    interpretation: 'NOT_APPLICABLE, and reporting it as 0% available or 100% available would both be wrong. There is nothing to be available. This metric is declared rather than omitted because SESSION 20 asks for it and because SESSION 21 will need somewhere for the answer to land.',
    limitations: 'Everything. When a Control Room exists, this metric will also need an availability definition that distinguishes "reachable" from "reachable and correctly refusing unauthenticated callers" — the second is the one that matters, and the first on its own would be a worse answer than none.',
    visibility: 'private',
    direction: 'higher_is_better',
    measure() {
      return notApplicable(
        'there is no Control Room. SESSION 21 builds it. agent/observability/server.mjs is a local development viewer bound to 127.0.0.1, not an administrative interface — it exposes no approval action and no privileged mutation, and describing it as a Control Room would overstate both what exists and what is protected.',
      );
    },
  }),

  defineMetric({
    id: 'control_plane.authn_authz_failures',
    name: 'Authentication and authorization failures',
    domain: 'control_plane',
    definition: 'Failed authentication attempts and denied authorization decisions on privileged interfaces, where observable.',
    source: 'nothing. There is no authentication anywhere in this repository, and no privileged interface that performs an authorization check.',
    calculation: 'None is possible. agent/observability/server.mjs serves eleven /api/ endpoints over the trace store and performs NO authentication and NO authorization on any of them; its only control is the default bind address. There is therefore no auth event to count.',
    frequency: 'continuous',
    interpretation: 'UNMEASURABLE, and a 0 here would be actively misleading: it would read as "no failed logins" when the truth is "there is no login". SESSION 20 says "where observable", and the honest answer is that nothing is. The ABSENCE of the mechanism is not silence here — it is reported by control_plane.privileged_routes_without_auth in agent/health/security.mjs, which is where a missing control belongs.',
    limitations: 'When authentication exists, this metric will need a log to count from, and that log is itself privileged data — it records who tried to get in. It must never become part of any public subset.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure() {
      return unmeasurable(
        'there is no authentication anywhere in this repository and no privileged interface performs an authorization check, so there is no auth event to count. Reporting 0 would read as "no failed logins" when the truth is "there is no login".',
        'an authentication mechanism on the privileged interface, and a log of its decisions. SESSION 21. Until then the finding is the MISSING CONTROL, reported by control_plane.privileged_routes_without_auth, not a count of failures against a control that does not exist.',
      );
    },
  }),

  /* ---------------------------------------------------- the two public ones */

  defineMetric({
    id: 'control_plane.proposals_awaiting_a_human',
    name: 'Proposals awaiting a human decision',
    domain: 'control_plane',
    definition: 'Proposals in the record store whose derived approval state is "pending": an agent has asked, and nobody has decided.',
    source: 'agent/records/*.jsonl and agent/implement/decisions/decisions.jsonl, via surveyProposals()',
    calculation: 'Proposals whose deriveApproval state is "pending", counted against the total number of proposals.',
    frequency: 'per_run',
    interpretation: 'This is the size of the queue between the agent layer and the site. It is NOT a backlog to be cleared: five sessions have now reported that not one proposal has ever been decided, and several of them cannot be implemented even if granted, because their operations deliberately draft no value. A rise means the agents found more; a fall means somebody decided something.',
    limitations: 'It counts proposals in THIS machine\'s record store, which is git-ignored. It is a count of what has been produced here, not of everything ever proposed.',
    visibility: 'public',
    public_justification: 'It reveals nothing operational — no path, no trace, no actor, no evidence — and a reader of a site about EU law is entitled to know how much proposed change is sitting in front of a human rather than in the site. It is the count alone; the proposals themselves stay private.',
    direction: 'not_a_score',
    measure(ctx) {
      const props = ctx.proposals;
      if (!props.length) {
        return unmeasurable(
          'the record store holds no proposals. agent/records/ is git-ignored and empty in a fresh checkout.',
          'run any producing agent, then re-run the monitor.',
        );
      }
      const pending = props.filter((p) => p.approval.state === 'pending');
      return measured(pending.length, {
        unit: 'proposals',
        of: props.length,
        detail: {
          total_proposals: props.length,
          by_state: props.reduce((o, p) => { o[p.approval.state] = (o[p.approval.state] ?? 0) + 1; return o; }, {}),
          decided_ever: (ctx.ledger.decisions ?? []).length,
        },
        evidence: ['agent/records/', 'agent/implement/decisions/'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.agent_changes_applied_to_the_site',
    name: 'Changes an agent has applied to the site',
    domain: 'control_plane',
    definition: 'ChangeRecords in state "applied" whose files touch the legal record — data/*.json, the brief\'s prose, the locale register, or the derivation rules.',
    source: 'agent/records/*.jsonl, ChangeRecord contract, checked against LEGAL_RECORD_PATHS',
    calculation: 'ChangeRecords with state "applied" and touched_legal_record true.',
    frequency: 'per_run',
    interpretation: 'This is 0, and a reader is entitled to know it. Nothing an agent produced has ever been written into what this site tells anybody about EU law: every agent here observes and proposes, and the one that can write refuses everything that is not approved by a named human. A rise above 0 would mean that changed, and it should be read alongside which human approved it.',
    limitations: 'It counts changes made BY AN AGENT and recorded as such. A human who applied an agent\'s proposal by hand leaves no ChangeRecord — docs/HANDOVER.md objective C has flagged that missing record for six sessions — so a 0 here does NOT mean no agent-originated text is on the site.',
    visibility: 'public',
    public_justification: 'It is the single most consequential fact about this system from a reader\'s point of view: whether an AI has written anything into what the site says about the law. Publishing the count is the honest answer to that question, and it exposes no path, no actor and no operational detail.',
    direction: 'lower_is_better',
    measure(ctx) {
      const applied = allRecords(ctx).filter((r) => r.contract === 'ChangeRecord' && r.state === 'applied');
      const legal = applied.filter((c) => c.touched_legal_record === true);
      return measured(legal.length, {
        unit: 'applied changes touching the legal record',
        of: applied.length,
        detail: {
          applied_total: applied.length,
          touching_legal_record: legal.map((c) => ({ change_id: c.change_id, approval_id: c.approval_id, files: (c.files ?? []).map((f) => f.path) })),
          caveat: 'this counts changes an AGENT made and recorded. A human applying a proposal by hand leaves no ChangeRecord — handover objective C.',
        },
        evidence: ['agent/records/'],
      });
    },
  }),

];
