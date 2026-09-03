/* ============================================================
   agent/implement/implementer.mjs — Agent 9, Implementation and QA

   IT IS AGENT 9, NOT AGENT 8. SESSION 18's brief calls it Agent 8;
   Agent 8 is the UX/UI Auditor, built in SESSIONS 16 and 17. The
   brief's numbering predates it, exactly as SESSION 13's and SESSION
   16's did. Recorded rather than resolved by renumbering somebody
   else — docs/HANDOVER.md has made this note twice already and the
   fix is a governance decision, not an implementation detail.

   WHAT IT DOES, in the order SESSION 18 lists it: verify the ten
   gates mechanically; open a controlled change context; read the
   current implementation before touching it; apply the smallest
   coherent change inside the approved scope; run the validators, the
   agent suites, the browser suite where it is required and the
   boundary check; produce a diff summary, a risk report, explicit
   rollback instructions and commit metadata; and emit an
   observability event for every stage.

   THE THING IT DOES MOST OFTEN IS REFUSE, and that is not a
   degraded mode. Seventy-one proposals exist across four agents and
   not one has ever been decided (docs/HANDOVER.md, "Next session").
   Run today, this agent implements nothing and produces
   seventy-one refusals, each naming the gate that refused and what
   would close it. That output is the deliverable. An implementation
   agent whose first run implemented something would have found an
   approval that does not exist.

   IT REVERTS ITSELF. `docs/AUTONOMY-POLICY.md` Class B's condition
   is that the change is fully reverted if any validator fails. This
   agent applies that to every class, not only B: if the checks come
   back worse than the recorded baseline, the change is rolled back
   before this function returns, the rollback is VERIFIED by
   re-hashing, and the QAResult says so. A failed change that stayed
   in the working tree would be a change nobody decided to make.

   IT NEVER DEPLOYS. `ChangeRecord.state` reaches `applied` and stops.
   Deployment is a separate fact with its own record (WebsiteChange),
   and pushing is Class D.
   ============================================================ */

import { hostname } from 'node:os';
import { execFileSync } from 'node:child_process';
import { emit, handoff } from '../schemas/gateway.mjs';
import { IdMinter } from '../schemas/identity.mjs';
import { getContract } from '../schemas/registry.mjs';
import { REPO_ROOT } from './baseline.mjs';
import { preflight, GATES } from './preflight.mjs';
import { readAgentRecords, readLedger, surveyProposals } from './ledger.mjs';
import { changedPaths, enforceScope, touchesLegalRecord, requiresBrowserQA } from './scope.mjs';
import { openContext, applyProposal, rollback, diffSummary, ApplyRefused } from './apply.mjs';
import {
  runValidators, runAgentSuites, runContractCheck, runBrowserCheck, runBoundaryCheck,
  verdictFor, blockingFindings,
} from './checks.mjs';

export const IMPLEMENT_AGENT = 'implementation-qa';

/** The standing control-plane exposure, recorded so a NEW one is a
 *  rise rather than lost in a number that was never zero. Read from
 *  the boundary check on an untouched tree at the start of the run —
 *  derived, not typed, for the reason every other number here is. */
export const CONTROL_PLANE_BASELINE_NOTE =
  'docs/IMPLEMENTATION-QA.md §6: the public/private separation does not exist in this repository. The baseline is what the tree exposes today; a rise is a finding.';

export class Implementer {
  /**
   * @param {{tracer:object, store:object, asOf:string, root?:string,
   *          apply?:boolean, quick?:boolean}} opts
   */
  constructor({ tracer, store, asOf, root = REPO_ROOT, apply = false, quick = false }) {
    this.tracer = tracer;
    this.store = store;
    this.asOf = asOf;
    this.root = root;
    /* Default FALSE. An agent that writes to the repository unless
       told not to is an agent whose safe mode is the one nobody
       selects. */
    this.doApply = apply;
    this.quick = quick;
    this.ids = new IdMinter();
  }

  async run({ proposalIds = null } = {}) {
    const run = this.tracer.startRun({ kind: 'agent', agent: IMPLEMENT_AGENT, task: 'implement approved proposals, or refuse and say why' });
    this.run_ = run;
    const traceRef = (span) => ({ trace_id: span.trace_id, span_id: span.span_id, run_id: run.run_id });
    this.traceRef = traceRef;

    const records = readAgentRecords();
    const ledger = readLedger();

    const survey = surveyProposals({ records, ledger });
    const chosen = proposalIds ? survey.filter((s) => proposalIds.includes(s.proposal_id)) : survey;

    run.observe({
      summary: `CENSUS — ${survey.length} proposal(s) in the agent record store across ${new Set(survey.map((s) => s.agent)).size} agent(s); ${ledger.decisions.length} decision(s) in the approval ledger`,
      subject: 'the queue',
      data: {
        proposals: survey.length,
        by_contract: countBy(survey, (s) => s.contract),
        by_agent: countBy(survey, (s) => s.agent),
        by_approval_state: countBy(survey, (s) => s.approval.state),
        traces: records.traces.length,
        ledger_decisions: ledger.decisions.length,
        ledger_malformed: ledger.malformed.length,
      },
    });

    if (ledger.malformed.length) {
      run.observe({
        summary: `THE APPROVAL LEDGER HAS ${ledger.malformed.length} LINE(S) THAT DO NOT PARSE`,
        subject: 'ledger integrity',
        risk: 'high',
        data: { malformed: ledger.malformed },
      });
    }

    /* Every agent-written approval claim, named. Discarding one
       silently would look identical to not having checked. */
    const forged = chosen.flatMap((s) => s.approval.discarded.map((d) => ({ proposal_id: s.proposal_id, ...d })));
    if (forged.length) {
      run.observe({
        summary: `${forged.length} APPROVAL CLAIM(S) FOUND IN agent/records/ AND DISCARDED`,
        subject: 'approval forgery',
        risk: 'high',
        data: { claims: forged },
      });
    }

    const results = [];
    for (const item of chosen) {
      results.push(await this.#handle(item, { records, ledger }));
    }

    const implemented = results.filter((r) => r.outcome === 'implemented');
    const refused = results.filter((r) => r.outcome === 'refused');
    const failed = results.filter((r) => r.outcome === 'reverted' || r.outcome === 'failed');

    /* The claim this agent must be able to make, and must be able to
       prove. Checked against git, not asserted. */
    const dirty = changedPaths({ cwd: this.root });
    run.observe({
      summary: implemented.length === 0 && !this.doApply
        ? `NOTHING WAS APPLIED. ${refused.length} refusal(s), 0 implementation(s). This agent ran in observe mode (--apply not given) and, separately, ${chosen.filter((c) => c.approval.state !== 'granted').length} of ${chosen.length} proposal(s) are not approved.`
        : `${implemented.length} implemented · ${failed.length} reverted or failed · ${refused.length} refused`,
      subject: 'NOTHING APPLIED',
      data: {
        applied: implemented.length,
        reverted: failed.length,
        refused: refused.length,
        working_tree_dirty_paths: dirty.length,
        dirty_sample: dirty.slice(0, 10),
      },
    });

    run.decide({
      decision: `implement ${implemented.length} of ${chosen.length} proposal(s)`,
      rationale: `approval state is governed system state and is read from agent/implement/decisions/ alone. ${countBy(chosen, (c) => c.approval.state)['granted'] ?? 0} proposal(s) carry a grant bound to their current fingerprint.`,
      alternatives: [
        { option: 'trust ApprovalRequest.state in agent/records/', why_not: 'agents write that directory. A grant there is an agent\'s claim about a human decision, and an agent that wanted one could append it.' },
        { option: 'implement the proposals whose autonomy_class is "autonomous"', why_not: 'autonomy is granted by policy, not by a field an agent set on its own proposal. docs/AUTONOMY-POLICY.md Class B additionally requires a validator that can PROVE the change correct, and GOVERNANCE_PERMITS is empty.' },
        { option: 'ask for approval and wait', why_not: 'that is what the seventy-one pending ApprovalRequests already are. This run adds the reason each one cannot proceed, which is the part that was missing.' },
      ],
      confidence: 1,
      risk: 'low',
    });

    run.end({
      status: 'ok',
      outputs: { proposals: chosen.length, implemented: implemented.length, refused: refused.length, failed: failed.length },
      confidence: 1,
      risk: implemented.length ? 'medium' : 'low',
    });

    return {
      trace_id: run.trace_id,
      run_id: run.run_id,
      as_of: this.asOf,
      survey,
      chosen,
      results,
      implemented,
      refused,
      failed,
      forged,
      ledger,
      dirty,
      apply_mode: this.doApply,
    };
  }

  /* ------------------------------------------------ one proposal */

  async #handle(item, ctx) {
    const span = this.run_.startAgent({ agent: IMPLEMENT_AGENT, task: `proposal ${item.proposal_id}` });
    try {
      const pre = preflight(item.proposal_id, ctx);

      span.observe({
        summary: `PREFLIGHT — ${pre.summary}`,
        subject: item.proposal_id,
        data: {
          gates: pre.gates.map((g) => ({ gate: g.gate, ok: g.ok })),
          failed: pre.failed.map((g) => ({ gate: g.gate, why: g.why, closes: g.closes })),
          approval_state: pre.approval.state,
        },
        confidence: 1,
        risk: pre.ok ? 'medium' : 'low',
      });

      if (!pre.ok) {
        span.decide({
          decision: `REFUSE ${item.proposal_id}`,
          rationale: pre.failed.map((g) => `${g.gate}: ${g.why}`).join(' · '),
          alternatives: [
            { option: 'implement it anyway', why_not: 'SESSION 18: the agent MUST NOT implement unapproved proposals, and the approval state is governed system state rather than a flag.' },
            { option: 'fix the proposal so it passes', why_not: 'a proposal this agent edited is a proposal nobody approved. It goes back to the agent that owns it.' },
          ],
          confidence: 1,
          risk: 'low',
        });
        span.end({ status: 'ok', outputs: { outcome: 'refused', gates_failed: pre.failed.length } });
        return { proposal_id: item.proposal_id, contract: item.contract, agent: item.agent, outcome: 'refused', preflight: pre, why: pre.summary };
      }

      /* --------------------------------------------- the change */
      const context = openContext({ permitted: pre.scope.permitted, root: this.root });
      const dirtyBefore = changedPaths({ cwd: this.root });

      span.observe({
        summary: `CONTEXT — branch ${context.branch} at ${context.commit.slice(0, 8)}; ${context.permitted.length} permitted path(s); rollback is "${context.rollback.method}"`,
        subject: 'change context',
        data: { branch: context.branch, commit: context.commit, permitted: context.permitted, rollback: context.rollback },
      });

      let change;
      try {
        change = applyProposal({ context, proposal: pre.proposal, dry: !this.doApply });
      } catch (err) {
        if (!(err instanceof ApplyRefused)) throw err;
        span.observe({ summary: `REFUSED AT APPLY — ${err.message}`, subject: item.proposal_id, data: err.detail, risk: 'low' });
        span.end({ status: 'ok', outputs: { outcome: 'refused', stage: 'apply' } });
        return { proposal_id: item.proposal_id, contract: item.contract, agent: item.agent, outcome: 'refused', preflight: pre, why: err.message, detail: err.detail };
      }

      /* --------------------------------------------- the checks */
      const qa = await this.#check({ span, context, pre, change });

      /* --------------------------------------- scope, enforced after */
      const scopeResult = enforceScope({
        permitted: pre.scope.permitted,
        before: dirtyBefore,
        cwd: this.root,
      });

      const regressed = qa.verdict === 'fail' || !scopeResult.ok;

      let reverted = null;
      if (this.doApply && regressed) {
        reverted = rollback(context, { root: this.root });
        span.observe({
          summary: reverted.verified
            ? `REVERTED — the checks came back ${qa.verdict}${scopeResult.ok ? '' : ' and the change left its approved scope'}; every permitted path re-hashes to its pre-change state`
            : `REVERT INCOMPLETE — ${reverted.mismatches.length} path(s) do not hash back to their pre-change state. Do not push.`,
          subject: 'rollback',
          risk: reverted.verified ? 'medium' : 'high',
          data: reverted,
        });
      }

      const diff = this.doApply && !reverted ? diffSummary(context, { root: this.root }) : { stat: '', patch: '', bytes: 0 };
      const risk = this.#riskReport({ pre, change, qa, scopeResult, context });

      const outcome = !this.doApply ? 'rehearsed'
        : reverted ? 'reverted'
          : qa.verdict === 'fail' ? 'failed'
            : 'implemented';

      span.observe({
        summary: `${outcome.toUpperCase()} — ${change.files.length} file(s), ${change.operations} operation(s), QA verdict "${qa.verdict}"`,
        subject: item.proposal_id,
        data: { files: change.files.map((f) => f.path), verdict: qa.verdict, blocking: qa.blocking_findings.length },
        risk: risk.level,
      });

      span.end({ status: outcome === 'failed' ? 'failed' : 'ok', outputs: { outcome, files: change.files.length }, risk: risk.level });

      return {
        proposal_id: item.proposal_id,
        contract: item.contract,
        agent: item.agent,
        outcome,
        preflight: pre,
        context,
        change,
        qa,
        scope: scopeResult,
        reverted,
        diff,
        risk,
        commit_metadata: this.#commitMetadata({ pre, change, qa, context }),
      };
    } catch (err) {
      span.error(err, { fatal: true });
      span.end({ status: 'failed' });
      return { proposal_id: item.proposal_id, contract: item.contract, agent: item.agent, outcome: 'failed', why: err.message };
    }
  }

  /* ------------------------------------------------ the checks */

  async #check({ span, context, pre, change }) {
    const paths = change.files.map((f) => f.path);
    const browserRequired = requiresBrowserQA(paths).length > 0;
    const touchesAgent = paths.some((p) => p.startsWith('agent/')) || paths.some((p) => p.startsWith('tools/'));

    const v = runValidators({ root: this.root, asOf: this.asOf });
    const checks = [...v.checks];

    if (touchesAgent) {
      checks.push(runContractCheck({ root: this.root }));
      checks.push(...runAgentSuites({ root: this.root }));
    }

    const browser = await runBrowserCheck({ required: browserRequired, quick: this.quick });
    if (browser.check) checks.push(browser.check);

    checks.push(runBoundaryCheck({ root: this.root }));

    const verdict = verdictFor(checks);
    const blocking = blockingFindings(checks);

    /* SESSION 18 requirement 7, at the one place it can actually be
       enforced: a required browser run that did not happen is a
       BLOCKING finding, whatever the four validators said. */
    if (browserRequired && (!browser.run || browser.run.status === 'skipped')) {
      blocking.push(`browser QA was REQUIRED — the change touches ${requiresBrowserQA(paths).join(', ')}, which the four validators read as files and cannot see rendered — and it did not run: ${browser.run?.skipReason ?? 'no result'}. A skipped required check is not a passed check.`);
    }

    span.observe({
      summary: `QA — ${checks.length} check(s), verdict "${verdict}", ${blocking.length} blocking finding(s); browser QA ${browserRequired ? (browser.run?.status ?? 'not run') : 'not required'}`,
      subject: 'checks',
      data: {
        checks: checks.map((c) => ({ name: c.name, exit: c.exit_code, errors: c.errors, warnings: c.warnings, baseline: `${c.baseline_errors}/${c.baseline_warnings}` })),
        comparisons: v.comparisons.map((c) => ({ name: c.name, verdict: c.verdict })),
        baseline_source: v.baseline.source,
      },
      risk: verdict === 'fail' ? 'high' : 'low',
    });

    return {
      checks,
      verdict: blocking.length && verdict === 'pass' ? 'pass_with_findings' : verdict,
      blocking_findings: blocking,
      browser,
      browser_required: browserRequired,
      baseline: v.baseline,
      comparisons: v.comparisons,
    };
  }

  /* ------------------------------------------------ the reports */

  #riskReport({ pre, change, qa, scopeResult, context }) {
    const paths = change.files.map((f) => f.path);
    const legal = touchesLegalRecord(paths);
    const reasons = [];

    if (legal.length) reasons.push(`touches the legal record (${legal.join(', ')}) — what the site tells a reader about EU law`);
    if (qa.verdict === 'fail') reasons.push('the checks came back worse than the recorded baseline');
    if (!scopeResult.ok) reasons.push(`left the approved scope: ${scopeResult.outside.map((o) => o.path).join(', ')}`);
    if (qa.browser_required && qa.browser.run?.status === 'skipped') reasons.push('browser QA was required and did not run');
    if (pre.proposal.autonomy_class === 'human_only') reasons.push('the proposal is human_only (red tier)');

    const level = legal.length || qa.verdict === 'fail' || !scopeResult.ok ? 'high'
      : reasons.length ? 'medium' : 'low';

    return {
      level,
      reasons,
      what_a_reader_would_see: paths.some((p) => p.endsWith('.html') || p.startsWith('js/') || p.startsWith('css/') || p.startsWith('data/') || p === 'app.js' || p === 'style.css')
        ? `a reader would meet this: ${paths.filter((p) => /\.(html|css|js|json)$/.test(p)).join(', ')}`
        : 'no file a reader\'s browser loads is in this change',
      rollback: context.rollback,
      /* Never a boolean. docs/AUTONOMY-POLICY.md §4 and SESSION 18
         §17 both say "rollback available" must not be a meaningless
         flag. */
      rollback_is_mechanical: `git checkout ${context.commit} -- ${context.permitted.join(' ')}, then re-hash each path against the sha256 recorded when the context opened, then re-run the four validators against docs/CURRENT-ARCHITECTURE.md §12`,
      deployment: 'NOT DEPLOYED. This agent reaches ChangeRecord.state "applied" and stops. Deployment is a separate fact with its own record, and pushing to main is Class D.',
    };
  }

  #commitMetadata({ pre, change, qa, context }) {
    const subject = `${pre.proposal.contract} ${pre.proposal_id}: ${pre.proposal.proposed_change.summary}`.slice(0, 72);
    return {
      branch: context.branch,
      base_commit: context.commit,
      subject,
      body: [
        pre.proposal.reason,
        '',
        `Proposal: ${pre.proposal_id} (${pre.proposal.contract}, produced by ${pre.proposal.agent})`,
        `Approval: ${pre.approval.approval_id} — ${pre.approval.decision.decided_by} on ${pre.approval.decision.decided_at}, bound to proposal fingerprint ${pre.approval.decision.proposal_sha256.slice(0, 12)}`,
        `Files: ${change.files.map((f) => f.path).join(', ')}`,
        `QA: ${qa.verdict}; ${qa.checks.length} check(s) against docs/CURRENT-ARCHITECTURE.md §12`,
        `Rollback: git checkout ${context.commit} -- ${context.permitted.join(' ')}`,
      ].join('\n'),
      /* No model identifier. AGENTS.md, and the session brief. */
      trailers: [],
    };
  }

  /* ------------------------------------------------ the records */

  /**
   * The contract records for one result. Separated from `#handle`
   * because a record is written only where the facts to fill it
   * exist: a QAResult for a rehearsal that ran the checks, and a
   * ChangeRecord only where something was actually applied.
   */
  recordsFor(result, { span }) {
    const out = [];
    const now = new Date().toISOString();
    const ref = this.traceRef(span ?? this.run_);

    if (result.qa) {
      const qaId = this.ids.mint('qa', { kind: 'qa-result', entities: [{ kind: 'contract', id: result.proposal_id }], subject: result.outcome, discriminator: this.asOf });
      out.push({
        contract: 'QAResult',
        contract_version: getContract('QAResult').version,
        agent: IMPLEMENT_AGENT,
        created_at: now,
        affected_entities: (result.change?.files ?? []).map((f) => ({ kind: pathKind(f.path), id: null, path: f.path, field: null, note: `${f.operation}, +${f.lines_added}/-${f.lines_removed}` })),
        evidence: result.qa.checks.map((c, i) => ({
          evidence_id: `ev-check-${i + 1}`,
          kind: 'validator_output',
          source_id: null, url: null,
          locator: c.command,
          title: c.name, publisher: null,
          quote: (c.output_excerpt ?? '').slice(0, 2000),
          retrieved_at: now, checksum: null,
          /* The output of a check directly supports the statement
             "this command exited N with M errors". It supports
             nothing about whether the change is CORRECT, and the
             unresolved block below says so. */
          supports: 'supports:direct',
          role: 'unresolved',
          simulated: false,
        })),
        epistemic: {
          fact: result.qa.checks.map((c, i) => ({
            field: `checks[${i}]`,
            statement: `${c.command} exited ${c.exit_code} with ${c.errors} error(s) and ${c.warnings} warning(s)`,
            evidence_refs: [`ev-check-${i + 1}`],
          })),
          inference: [{
            field: 'verdict',
            statement: `the verdict is "${result.qa.verdict}"`,
            from: result.qa.checks.map((c) => c.name),
            method: 'agent/implement/checks.mjs verdictFor(): any error or non-zero exit is a fail; any warning above its recorded baseline or any named new finding is pass_with_findings; otherwise pass. Each check is measured against docs/CURRENT-ARCHITECTURE.md §12 as parsed by baseline.mjs.',
          }],
          interpretation: [],
          unresolved: [
            ...(result.qa.browser_required && result.qa.browser.run?.status === 'skipped'
              ? [{ field: 'checks', question: 'what does this change look like in a browser?', missing: 'a browser on the machine that ran these checks', absence_kind: 'null_not_researched', blocks: true }]
              : []),
            ...(!result.qa.browser_required
              ? [{ field: 'checks', question: 'was this change ever rendered?', missing: 'nothing — no page, stylesheet, module or locale is in the approved scope, so there is nothing a rendered page could show that the four validators cannot', absence_kind: 'no_rule_matched', blocks: false }]
              : []),
            {
              field: null,
              question: 'do the checks that passed prove the change is CORRECT?',
              missing: 'docs/VERIFICATION-POLICY.md §3: a passing validator proves the data is well-formed and the markup consistent. It proves nothing about whether a statement is true. This record reports what the checks said and nothing beyond it.',
              absence_kind: 'unknown_not_determinable',
              blocks: false,
            },
          ],
        },
        trace_ref: ref,
        simulated: false,
        qa_id: qaId,
        target_kind: 'proposal',
        target_id: result.proposal_id,
        ran_at: now,
        ran_by: IMPLEMENT_AGENT,
        environment: `node ${process.version} · ${process.platform} ${process.arch} · ${hostname()}`,
        checks: result.qa.checks,
        verdict: result.qa.verdict,
        blocking_findings: result.qa.blocking_findings,
      });
    }

    if (result.outcome === 'implemented' && result.change) {
      const paths = result.change.files.map((f) => f.path);
      const legal = touchesLegalRecord(paths);
      const changeId = this.ids.mint('chg', { kind: 'change-record', entities: paths.map((p) => ({ kind: pathKind(p), path: p })), subject: result.proposal_id, discriminator: result.context.commit });
      out.push({
        contract: 'ChangeRecord',
        contract_version: getContract('ChangeRecord').version,
        agent: IMPLEMENT_AGENT,
        created_at: now,
        affected_entities: paths.map((p) => ({ kind: pathKind(p), id: null, path: p, field: null, note: null })),
        evidence: [{
          evidence_id: 'ev-diff',
          kind: 'measurement',
          source_id: null, url: null,
          locator: `git diff ${result.context.commit} -- ${paths.join(' ')}`,
          title: 'the diff', publisher: null,
          quote: null,
          retrieved_at: now, checksum: null, supports: 'supports:direct',
          role: 'unresolved', simulated: false,
        }],
        epistemic: {
          fact: [{ field: 'files', statement: `${paths.length} file(s) changed on branch ${result.context.branch} from ${result.context.commit}`, evidence_refs: ['ev-diff'] }],
          inference: [{ field: 'reversible', statement: 'this change can be undone mechanically', from: [result.context.commit], method: `the pre-change sha256 of every permitted path was recorded before the edit; ${result.context.rollback.steps[0]} restores them and each is re-hashed against the recorded value` }],
          interpretation: [],
          unresolved: [],
        },
        trace_ref: ref,
        simulated: false,
        change_id: changeId,
        proposal_id: result.proposal_id,
        approval_id: result.preflight.approval.approval_id,
        qa_result_id: out[0]?.qa_id ?? null,
        files: result.change.files,
        diff_summary: result.preflight.proposal.proposed_change.summary,
        touched_legal_record: legal.length > 0,
        state: 'applied',
        branch: result.context.branch,
        commit: null,
        applied_at: now,
        applied_by: IMPLEMENT_AGENT,
        reversible: true,
        rollback_method: 'restore_from_commit',
        rollback_ref: null,
      });
    }

    return out;
  }

  /** Write and register everything a result produced. */
  store_(records, span) {
    for (const r of records) { emit(span ?? this.run_, r); this.store.write(r); }
    return records;
  }
}

/* ---------------------------------------------------------- helpers */

function countBy(xs, key) {
  const o = {};
  for (const x of xs) { const k = key(x); o[k] = (o[k] ?? 0) + 1; }
  return o;
}

/** An affected entity's kind, from its path. Deliberately coarse:
 *  getting this wrong is cosmetic, and guessing "instrument" from a
 *  filename would not be. */
export function pathKind(p) {
  if (p.startsWith('data/')) return 'dataset';
  if (p.startsWith('i18n/')) return 'locale';
  if (p.startsWith('css/') || p === 'style.css') return 'stylesheet';
  if (p.startsWith('js/') || p === 'app.js') return 'module';
  if (p.startsWith('tools/')) return 'tool';
  if (p.startsWith('docs/')) return 'document';
  if (p.startsWith('.agents/')) return 'skill';
  if (p.startsWith('agent/')) return 'agent';
  if (p.endsWith('.html')) return 'page';
  return 'document';
}
