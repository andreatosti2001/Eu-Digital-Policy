/* ============================================================
   agent/orchestrator/orchestrator.mjs — the Master Orchestrator

   SESSION 22. The twelfth thing in `agent/`, and the first whose
   subject is the OTHER ELEVEN: it receives events, identifies the
   workflow, selects the specialists, preserves the state, enforces
   the handoffs and the autonomy boundary, collects the
   observations, detects the conflicts, routes to a person, keeps
   the provenance, and shows the whole of it to the private Control
   Room.

   THE SENTENCE THE WHOLE FILE IS BUILT AROUND, from §14: "The
   Master Orchestrator coordinates specialist agents. It MUST NOT
   replace their domain reasoning."

   So there is no legal reasoning here, no editorial judgement, no
   evidence assessment and no verdict. It never reads a source,
   never grades evidence, never decides whether a claim is
   supported, and never edits a record a specialist handed it. What
   it reasons about is ROUTING — which is why every gate it runs is
   mechanical, and why `checkOutput` refuses a record rather than
   repairing one. A coordinator that repaired its specialists'
   output would be a thirteenth specialist, unaccountable to any of
   the contracts the other twelve are bound by.

   FOUR THINGS IT REFUSES, EACH ONE ARRANGED RATHER THAN PROMISED.

   1 · IT DOES NOT TRUST THE EVENT. `events.mjs` strips every
       approval-shaped field at the door and names what it stripped;
       what arrives here is a pointer and a claim about what
       happened. A Control Room click and an agent message go
       through the same intake and neither carries authority.

   2 · IT RE-DERIVES THE APPROVAL. `approval.mjs` reads the decision
       ledger, not the event, not the record store's
       `ApprovalRequest`, and not a filename. Two independent
       derivations of the same authorization then exist — this one
       refusing to route, and `agent/implement/preflight.mjs`
       refusing to write — and that duplication is the design.

   3 · IT CANNOT WIDEN AN AGENT. A grant is the intersection of the
       agent's registered capability and the stage's declared need
       (`capabilities.mjs`), and a record outside it is refused at
       the handoff.

   4 · IT PUBLISHES NOTHING, AND THERE IS NO FLAG. Every one of the
       ten workflow types ends at a human stage, `workflows.mjs`
       refuses to load a type that does not, and no code path here
       writes to `data/`, `i18n/`, `js/`, `css/` or any page.

   WHAT IT WRITES. One append-only journal per workflow under
   `agent/orchestrator/state/` (git-ignored), and one trace. Nothing
   else. The records a specialist produces are the specialist's to
   store; the Orchestrator carries their ids.

   ON DISPATCHERS, SAID PLAINLY. A dispatcher is a function that
   actually runs a specialist. This session wires NONE by default:
   `new Orchestrator({...})` with no `dispatchers` reaches every
   dispatch stage, refuses it as `not_dispatched`, and ends the
   workflow `unresolved` — which is the true answer to "what did the
   specialists find" when nothing ran them. Protocol §25 puts the
   first end-to-end run in SIMULATION at SESSION 24, and a session
   that wired the eleven agents into automatic execution here would
   be running that simulation early, against the real record store,
   without the observation discipline §25 asks for. The seam is the
   deliverable; filling it is the next session's work.
   ============================================================ */

import { receiveEvent, workflowIdFor, EventRefused } from './events.mjs';
import { classify, getWorkflow, WORKFLOW_TYPES, END_STATE_MEANING } from './workflows.mjs';
import { WorkflowJournal, WorkflowState, TERMINAL } from './state.mjs';
import { grantFor, checkOutput, capabilityOf, CapabilityRefused } from './capabilities.mjs';
import { verifyForImplementation } from './approval.mjs';
import { detectConflicts } from './conflict.mjs';
import { requiresHumanReview, autonomyPermits, provenanceGate, rollbackGate } from './policy.mjs';
import { receive, idOf as recordIdOf } from '../schemas/gateway.mjs';

export const ORCHESTRATOR_AGENT = 'orchestrator';

export class Orchestrator {
  /**
   * @param {{tracer:object, journal?:WorkflowJournal, dispatchers?:object,
   *          records?:object, ledger?:object, root?:string,
   *          now?:function}} opts
   */
  constructor({ tracer, journal = null, dispatchers = {}, records = null, ledger = null, root = undefined, now = () => new Date().toISOString() } = {}) {
    this.tracer = tracer;
    this.journal = journal ?? new WorkflowJournal();
    this.dispatchers = dispatchers;
    this.records = records;
    this.ledger = ledger;
    this.root = root;
    this.now = now;
  }

  /**
   * One event in, one workflow out.
   *
   * @param {object} raw
   * @returns {Promise<object>} the workflow snapshot, with its end state
   */
  async handle(raw) {
    /* ---------------------------------------------- 0 · intake */
    let event;
    try {
      ({ event } = receiveEvent(raw, { now: this.now }));
    } catch (e) {
      if (!(e instanceof EventRefused)) throw e;
      /* Refused at the door. No workflow is opened — there is no
         content to open one about — and the refusal is traced, so
         "nothing happened" and "something was refused" do not look
         alike. */
      const run = this.tracer.startRun({ kind: 'orchestrator', agent: ORCHESTRATOR_AGENT, task: 'intake refused' });
      run.observe({ summary: `an event was refused at intake: ${e.message}`, subject: 'intake', data: { code: e.code, detail: e.detail, fix: e.fix }, risk: 'low' });
      run.end({ status: 'ok', outputs: { refused: true, code: e.code } });
      return { ok: false, workflow: null, refused: { code: e.code, why: e.message, fix: e.fix ?? null, detail: e.detail ?? null }, trace: { trace_id: run.trace_id, run_id: run.run_id } };
    }

    const workflow_id = workflowIdFor(event);
    const run = this.tracer.startRun({
      kind: 'orchestrator', agent: ORCHESTRATOR_AGENT,
      task: `workflow ${workflow_id}: ${event.kind}`,
      inputs: { event_id: event.event_id, source: event.source, kind: event.kind, subject: event.subject, declared_type: event.workflow_type },
    });

    const wf = new WorkflowState({ workflow_id, event, journal: this.journal, now: this.now });
    wf.trace = { trace_id: run.trace_id, run_id: run.run_id };

    if (event.discarded.length) {
      /* Named on the trace as well as on the event, because a
         reviewer looking at the run should not have to open the
         event to find out somebody tried to send an approval. */
      run.observe({
        summary: `${event.discarded.length} field(s) were stripped from the event at intake and were not read`,
        subject: 'intake', risk: 'medium',
        data: { discarded: event.discarded, why: 'authority is derived from the decision ledger, the capability register and the autonomy policy — never from the message that asked.' },
      });
    }

    try {
      const outcome = await this.#route(wf, event, run);
      run.end({ status: 'ok', outputs: { workflow_id, type: wf.type, end_state: outcome.state, published: false } });
      return outcome;
    } catch (err) {
      run.error(err, { fatal: true });
      if (!TERMINAL.has(wf.state)) {
        try { wf.transition('failed', { why: `the Orchestrator itself threw: ${err.message}. A defect in the machinery, not a finding about the world.`, detail: { error: err.message } }); } catch { /* already terminal */ }
      }
      run.end({ status: 'failed', outputs: { workflow_id, end_state: 'failed' } });
      return this.#result(wf, run, { error: err.message });
    }
  }

  /* ---------------------------------------------------------- routing */

  async #route(wf, event, run) {
    /* ------------------------------------------ 1 · classify */
    const classification = classify(event);
    run.decide({
      decision: classification.type ? `workflow type ${classification.type}` : 'unclassified',
      rationale: classification.why,
      alternatives: (classification.candidates ?? []).filter((c) => c !== classification.type).map((c) => ({ option: c, why_not: 'not the type the event and its subject agree on' })),
      inputs_ref: [event.event_id],
    });

    if (!classification.type) {
      wf.addHumanReviewReason({ code: 'unclassified', why: classification.why, closes: 'a person names the workflow type, or the producing agent sends an event whose subject settles it. Picking the nearest type would run the wrong specialists and report a result about the wrong question.' });
      wf.transition('human_review_required', { why: `the event could not be classified: ${classification.why}`, detail: { candidates: classification.candidates } });
      return this.#result(wf, run);
    }

    wf.type = classification.type;
    wf.transition('classified', { why: classification.why, detail: { type: classification.type, corroborated: classification.corroborated ?? false } });

    const workflow = getWorkflow(classification.type);
    wf.transition('planned', {
      why: `${workflow.stages.length} stage(s): ${workflow.stages.map((s) => `${s.stage}(${s.kind})`).join(' → ')}`,
      detail: { stages: workflow.stages.map((s) => ({ stage: s.stage, kind: s.kind, agent: s.agent ?? null, gate: s.gate ?? null, required: s.required !== false })) },
    });

    wf.transition('in_progress', { why: 'the plan is fixed. Stages run in order, and a required stage that refuses stops the workflow rather than being stepped over.' });

    /* ------------------------------------------ 2 · the stages */
    let handoffRecords = [];          // what the previous dispatch produced
    let blocked = false;
    let failed = false;
    let rejected = false;
    /* Which agent actually ran each stage. The H3 pairing rule reads
       it, and it is built from what HAPPENED rather than from the
       table, so a dispatcher wired to an unexpected agent is still
       caught. */
    const ranBy = new Map();

    for (const stage of workflow.stages) {
      if (blocked || failed || rejected) {
        wf.recordStage({ stage: stage.stage, kind: stage.kind, agent: stage.agent ?? null, status: 'not_reached', why: 'an earlier required stage refused. A stage that did not run is recorded as not having run — never as having passed.' });
        continue;
      }

      if (stage.kind === 'human') {
        wf.recordStage({ stage: stage.stage, kind: 'human', status: 'reached', why: stage.why });
        break;
      }

      if (stage.kind === 'gate') {
        const result = this.#gate(stage, { wf, workflow, event, run, records: handoffRecords });
        wf.recordStage({ stage: stage.stage, kind: 'gate', agent: ORCHESTRATOR_AGENT, status: result.ok ? 'passed' : 'refused', why: result.why, refusals: result.refusals ?? [] });
        run.decide({
          decision: `${stage.gate} gate: ${result.ok ? 'pass' : 'refuse'}`,
          rationale: result.why,
          alternatives: result.ok ? [] : [{ option: 'route to implementation anyway', why_not: 'a gate a sufficiently confident caller can talk past is not a gate' }],
          risk: result.ok ? 'low' : 'high',
        });
        if (result.rejected) { rejected = true; continue; }
        if (!result.ok && stage.required !== false) {
          blocked = true;
          for (const r of result.refusals ?? []) wf.addHumanReviewReason(r);
        }
        continue;
      }

      /* -------------------------------------- a dispatch stage */
      const outcome = await this.#dispatch(stage, { wf, workflow, event, run, handoffRecords, ranBy });
      wf.recordStage(outcome);
      if (outcome.status === 'failed') { failed = true; continue; }
      if (outcome.status !== 'ok' && stage.required !== false) {
        blocked = true;
        wf.addHumanReviewReason({ code: 'stage_refused', why: `stage "${stage.stage}" (${stage.agent}) did not run: ${outcome.why}`, closes: outcome.closes ?? 'the stage has to run, or a person has to decide without it.' });
        continue;
      }
      if (outcome.status === 'ok') {
        ranBy.set(stage.stage, stage.agent);
        handoffRecords = outcome.records ?? [];
        wf.records.push(...(outcome.records ?? []).map((r) => ({ id: r.id, contract: r.contract, agent: stage.agent, stage: stage.stage })));
      }
    }

    /* ------------------------------------------ 3 · the whole run */
    const allRecords = wf.stages.flatMap((s) => (s.records ?? []).map((r) => r.record)).filter(Boolean);
    const conflicts = detectConflicts({ workflow, stages: wf.stages });
    wf.conflicts = conflicts.conflicts;

    if (conflicts.conflicts.length) {
      run.observe({ summary: `${conflicts.conflicts.length} conflict(s) between specialists: ${[...new Set(conflicts.conflicts.map((c) => c.kind))].join(', ')}`, subject: 'conflict', risk: 'high', data: { conflicts: conflicts.conflicts, bound: conflicts.bound } });
    }

    const scope = wf.stages.find((s) => s.scope)?.scope ?? null;
    const humanReview = requiresHumanReview({ workflow, records: allRecords, conflicts: conflicts.conflicts, autonomy: null });
    const autonomy = autonomyPermits({
      proposal: allRecords.find((r) => r.proposed_change) ?? null,
      records: allRecords, conflicts: conflicts.conflicts, scope, humanReview,
    });
    const humanFinal = requiresHumanReview({ workflow, records: allRecords, conflicts: conflicts.conflicts, autonomy });
    for (const r of humanFinal.reasons) wf.addHumanReviewReason({ code: r.code, why: r.why, closes: null });

    wf.autonomy = autonomy;
    wf.human_review = humanFinal;

    run.decide({
      decision: `autonomy: ${autonomy.permitted ? 'every mandatory condition satisfied' : 'blocked'}`,
      rationale: autonomy.summary,
      alternatives: [
        { option: 'execute automatically', why_not: autonomy.permitted ? 'no action category is approved for automatic execution, and every workflow type ends at a person regardless' : autonomy.failed.map((c) => c.condition).join(', ') },
      ],
      risk: 'high',
    });

    /* ------------------------------------------ 4 · the end state */
    if (rejected) {
      wf.transition('rejected', { why: 'a person decided against the proposal this workflow is about. Recorded as a decision taken, not as a failure and not as unresolved.' });
      return this.#result(wf, run);
    }
    if (failed) {
      wf.transition('failed', { why: 'a stage broke: a dispatcher threw, or a record would not satisfy its own contract. A defect in the machinery, not a finding about the world.' });
      return this.#result(wf, run);
    }
    if (blocked) {
      wf.transition('blocked', { why: 'a required stage refused. The workflow stops here rather than continuing without it.' });

      /* THE TWO WAYS A STAGE FAILS TO RUN ARE DIFFERENT FACTS, and
         collapsing them would lose the more useful one.

         `not_dispatched` means nothing ran: no dispatcher was
         wired. If nothing was produced either, the workflow is
         UNRESOLVED — the question was not settled, which is a valid
         deliverable (H6) and is never softened into completed. If
         something WAS produced before the chain broke, there is
         evidence a person can act on, so it goes to review with the
         missing stage named.

         `refused` means the system said no — a grant that did not
         cover the stage, a handoff nobody could take, a role
         collision. That is a routing defect and it needs a person
         to look at the workflow itself, not at the world. */
      const undispatched = wf.stages.filter((s) => s.status === 'not_dispatched');
      const refused = wf.stages.filter((s) => s.status === 'refused');

      if (undispatched.length && !refused.length && wf.records.length === 0) {
        wf.transition('unresolved', {
          why: `${undispatched.length} required stage(s) had no dispatcher wired in this run and nothing was produced, so the question this workflow opened was not settled. Unresolved is a result; it is not a softer word for completed and not a harder word for failed.`,
          detail: { stages: undispatched.map((s) => s.stage) },
        });
      } else {
        wf.transition('human_review_required', {
          why: refused.length
            ? `${refused.length} stage(s) were refused by the system — ${refused.map((s) => s.stage).join(', ')} — and a refusal at the routing layer is something a person has to look at rather than something the world can answer.`
            : `${wf.records.length} record(s) were produced before ${undispatched.map((s) => s.stage).join(', ')} could not run. There is evidence to review, and the gap is named.`,
          detail: { reasons: humanFinal.reasons.map((r) => r.code), not_dispatched: undispatched.map((s) => s.stage), refused: refused.map((s) => s.stage) },
        });
      }
      return this.#result(wf, run);
    }

    const producedSomething = wf.records.length > 0;
    if (!producedSomething && workflow.completes_without_human === 'only_if_nothing_proposed') {
      const undispatched = wf.stages.filter((s) => s.status === 'not_dispatched');
      if (undispatched.length) {
        wf.transition('unresolved', { why: `${undispatched.length} stage(s) had no dispatcher wired in this run. Nothing was measured and nothing was proposed, and reporting that as "completed" would be reporting an absence of instrumentation as an absence of findings.`, detail: { stages: undispatched.map((s) => s.stage) } });
      } else {
        wf.transition('completed', { why: `${workflow.id} declares that it completes without a person when nothing was proposed, and nothing was. A measurement that found nothing is finished, and putting an empty page in front of a reviewer teaches them to stop reading the queue.` });
      }
      return this.#result(wf, run);
    }

    wf.transition('human_review_required', {
      why: humanFinal.required
        ? `${humanFinal.reasons.length} reason(s): ${[...new Set(humanFinal.reasons.map((r) => r.code))].join(', ')}`
        : `${workflow.id} never completes without a person. ${(workflow.human_review_when ?? []).join(' · ')}`,
      detail: { reasons: humanFinal.reasons.map((r) => r.code) },
    });
    return this.#result(wf, run);
  }

  /* ---------------------------------------------------------- gates */

  #gate(stage, { wf, workflow, event, run, records }) {
    const subjectId = event.subject?.id ?? null;

    if (stage.gate === 'approval' || stage.gate === 'scope') {
      if (!subjectId) {
        return { ok: false, why: 'the event names no subject, so there is no proposal to derive an approval for.', refusals: [{ code: 'no_subject', why: 'an IMPLEMENTATION_REQUEST is about a specific proposal, and this event names none.', closes: 'name the proposal in the event subject: { contract, id }.' }] };
      }
      const v = wf.verification ?? (wf.verification = verifyForImplementation(subjectId, {
        records: this.records, ledger: this.ledger, root: this.root,
        requestedScope: Array.isArray(event.payload?.scope) ? event.payload.scope : null,
      }));
      const relevant = stage.gate === 'approval'
        ? v.checks.filter((c) => c.check !== 'implementation_scope_matches')
        : v.checks.filter((c) => c.check === 'implementation_scope_matches');
      const bad = relevant.filter((c) => !c.ok);

      if (stage.gate === 'approval' && v.approval.state === 'denied') {
        return { ok: false, rejected: true, why: v.approval.why, refusals: [] };
      }
      /* The scope object travels so the autonomy gate can see
         whether browser QA is required. */
      if (v.scope) wf.scope = v.scope;
      return {
        ok: bad.length === 0,
        why: bad.length === 0 ? relevant.map((c) => `${c.check}: pass`).join(' · ') : `${bad.length} check(s) refuse: ${bad.map((c) => c.check).join(', ')}`,
        refusals: bad.map((c) => ({ code: c.check, why: c.why, closes: c.closes })),
      };
    }

    if (stage.gate === 'provenance') {
      const g = provenanceGate(records.map((r) => r.record).filter(Boolean));
      return { ok: g.ok, why: g.ok ? `provenance is internally complete across ${records.length} record(s). ${g.bound}` : `${g.findings.length} provenance finding(s).`, refusals: g.findings.map((f) => ({ code: 'provenance', why: `${f.record}: ${f.why}`, closes: f.closes })) };
    }

    if (stage.gate === 'rollback') {
      const g = rollbackGate(records.map((r) => r.record).filter(Boolean));
      return { ok: g.ok, why: g.ok ? `${g.plans.length} rollback plan(s), each naming a method, steps and a verification. ${g.bound}` : `${g.findings.length} rollback finding(s).`, refusals: g.findings.map((f) => ({ code: 'rollback', why: `${f.record}: ${f.why}`, closes: f.closes })) };
    }

    if (stage.gate === 'conflict') {
      const c = detectConflicts({ workflow, stages: wf.stages });
      return { ok: c.conflicts.length === 0, why: c.conflicts.length === 0 ? `none of the six conflict shapes fired across ${c.records_examined} record(s). ${c.bound}` : `${c.conflicts.length} conflict(s).`, refusals: c.conflicts.map((x) => ({ code: x.kind, why: x.why, closes: x.what_happens })) };
    }

    if (stage.gate === 'autonomy') {
      const all = wf.stages.flatMap((s) => (s.records ?? []).map((r) => r.record)).filter(Boolean);
      const proposal = wf.verification?.approval?.proposal ?? all.find((r) => r.proposed_change) ?? null;
      const hr = requiresHumanReview({ workflow, records: proposal ? [proposal, ...all] : all, conflicts: wf.conflicts ?? [] });
      const a = autonomyPermits({ proposal, records: all, conflicts: wf.conflicts ?? [], scope: wf.scope ?? null, humanReview: hr });
      /* An autonomy gate that FAILS does not block the workflow —
         it blocks AUTOMATIC EXECUTION, which is a different thing
         and is the only thing §18 is about. The workflow continues
         to a person, which is where a failing autonomy check is
         supposed to send it. */
      return { ok: true, why: `${a.summary} This gate never blocks the workflow; it establishes whether anything could have run without a person, and the answer routes the work rather than stopping it.`, refusals: [], autonomy: a };
    }

    return { ok: false, why: `gate "${stage.gate}" is named by the workflow and implemented nowhere.`, refusals: [{ code: 'gate_missing', why: `no implementation for gate "${stage.gate}"`, closes: 'implement it, or remove it from the workflow. A named gate that does nothing is worse than no gate.' }] };
  }

  /* ---------------------------------------------------------- dispatch */

  async #dispatch(stage, { wf, workflow, event, run, handoffRecords, ranBy = new Map() }) {
    const base = { stage: stage.stage, kind: 'dispatch', agent: stage.agent, records: [], refusals: [] };

    /* -------- H3, first half: two stages one agent may not both hold
       The pairs are STAGE names. This fires when the agent about to
       run one of them ALREADY RAN the other in this workflow — which
       the ten types do not arrange today, because each pair names
       stages the table assigns to different specialists, and which a
       type written later could. */
    for (const pair of workflow.same_agent_forbidden ?? []) {
      if (!pair.includes(stage.stage)) continue;
      const other = pair.find((x) => x !== stage.stage);
      if (ranBy.get(other) === stage.agent) {
        const why = `"${stage.agent}" already ran stage "${other}", and ${workflow.id} forbids one agent holding both "${pair[0]}" and "${pair[1]}". H3: no agent verifies its own output.`;
        return { ...base, status: 'refused', why, closes: 'the two stages are held by different specialists, or the work stops.', refusals: [{ code: 'role_collision', why, closes: 'a different specialist takes the second stage.' }] };
      }
    }

    /* ------------------------------------- the grant, or a refusal */
    let grant = null;
    let grantRefusals = [];
    try { ({ grant, refusals: grantRefusals } = grantFor({ agent: stage.agent, stage, workflow_id: wf.workflow_id })); }
    catch (e) {
      if (!(e instanceof CapabilityRefused)) throw e;
      return { ...base, status: 'refused', why: e.message, closes: e.fix, refusals: [{ code: e.code, why: e.message, closes: e.fix }] };
    }
    if (!grant) {
      return { ...base, status: 'refused', why: grantRefusals.map((r) => r.why).join(' · '), closes: grantRefusals.map((r) => r.fix).join(' · '), refusals: grantRefusals.map((r) => ({ code: r.code, why: r.why, closes: r.fix })) };
    }

    /* ---------------------------------- enforce the handoff in

       An agent that declares NO consumes takes no input — the
       browser suite opens pages and reads nothing from upstream —
       so there is nothing to hand it and nothing to refuse. An
       agent that declares consumes and is handed none of them is a
       broken handoff: the workflow names a specialist that cannot
       read what the previous one produced, and passing it on anyway
       would make H1 ("a handoff carries evidence") decorative. */
    const cap = capabilityOf(stage.agent);
    if (handoffRecords.length && cap.consumes.length) {
      const usable = handoffRecords.filter((r) => cap.consumes.includes(r.contract));
      if (!usable.length) {
        const why = `${handoffRecords.length} record(s) were handed to "${stage.agent}" (${handoffRecords.map((r) => r.contract).join(', ')}) and it consumes ${cap.consumes.join(', ')}. The handoff cannot be made.`;
        return { ...base, status: 'refused', why, closes: 'the workflow names a specialist that cannot take what the previous one produced. Either the order is wrong or the capability register is.', refusals: [{ code: 'handoff_broken', why, closes: 'a handoff carries evidence to somebody who can read it (H1).' }] };
      }

      /* -------- H3, second half, and the one that fires on the real
         case: no agent verifies its own output. A record handed to
         the agent that wrote it is refused whatever the stage table
         says, because this is a rule about agents rather than about
         any particular workflow. */
      const own = usable.filter((r) => r.record?.agent === stage.agent);
      if (own.length) {
        const why = `${own.length} of the ${usable.length} record(s) handed to "${stage.agent}" were produced by "${stage.agent}". H3: no agent verifies its own output, and no workflow may arrange for one to.`;
        return { ...base, status: 'refused', why, closes: 'a different specialist takes this stage, or the upstream stage does.', refusals: [{ code: 'self_verification', why, closes: 'docs/AGENT-ROLES.md H3. Where one agent holds both roles it must state that and hold the second contract to the same standard; here the Orchestrator refuses the dispatch instead.' }] };
      }

      base.handed_in = usable.map((r) => ({ id: r.id, contract: r.contract }));
    }

    /* ---------------------------------------------- the dispatcher */
    const dispatcher = this.dispatchers?.[stage.agent] ?? null;
    if (!dispatcher) {
      const why = `no dispatcher is wired for "${stage.agent}" in this run, so the stage did not run.`;
      return {
        ...base, status: 'not_dispatched', why, grant,
        closes: 'wire a dispatcher, or accept that the workflow is unresolved. A stage that did not run is never recorded as having passed — protocol §25 puts the first end-to-end execution in simulation, and this seam is where it attaches.',
      };
    }

    const span = run.startAgent({ agent: stage.agent, task: stage.why, name: `${wf.workflow_id}:${stage.stage}` });
    let produced;
    try {
      /* THE DISPATCHER RECEIVES THE GRANT AND THE INPUTS IT NEEDS,
         AND NOTHING ELSE. Not the workflow, not the journal, not
         the ledger, not the other stages. Least privilege at the
         call as well as in the register: a specialist handed the
         whole workflow could read another specialist's refusal and
         write around it. */
      produced = await dispatcher({
        grant,
        span,
        event: { event_id: event.event_id, kind: event.kind, subject: event.subject, summary: event.summary, payload: event.payload },
        inputs: (base.handed_in ? handoffRecords.filter((r) => (base.handed_in ?? []).some((h) => h.id === r.id)) : handoffRecords).map((r) => r.record),
      });
    } catch (e) {
      span.error(e, { fatal: true });
      span.end({ status: 'failed' });
      return { ...base, status: 'failed', why: `the dispatcher for "${stage.agent}" threw: ${e.message}`, grant, closes: 'a specialist that throws is a defect in the specialist. The workflow fails rather than continuing without it.' };
    }

    /* -------------------------------- validate, then check the grant */
    const offered = Array.isArray(produced?.records) ? produced.records : Array.isArray(produced) ? produced : [];
    const admitted = [];
    const refusals = [];
    for (const record of offered) {
      try { receive(record, { allowSimulated: true }); }
      catch (e) {
        refusals.push({ code: 'invalid_record', why: `a record from "${stage.agent}" does not satisfy its own contract: ${e.message}`, closes: 'agent/schemas/gateway.mjs validates at the boundary and has no flag that skips it. An invalid record dies here rather than three agents later.' });
        continue;
      }
      const outside = checkOutput(grant, record, { workflow_id: wf.workflow_id });
      if (outside.length) { refusals.push(...outside.map((o) => ({ code: o.code, why: o.why, closes: o.fix }))); continue; }
      admitted.push({ id: recordIdOf(record), contract: record.contract, record });
    }

    for (const a of admitted) {
      span.artifact({ artifact_id: a.id, artifact_type: `contract:${a.contract}`, derived_from: (base.handed_in ?? []).map((h) => h.id) });
    }
    if (refusals.length) {
      span.observe({ summary: `${refusals.length} output(s) refused at the handoff`, subject: 'capability', risk: 'high', data: { refusals, granted: grant.may_produce } });
    }

    /* ------------------------------------------ the handoff out */
    const next = workflow.stages.slice(workflow.stages.indexOf(stage) + 1).find((s) => s.kind === 'dispatch' || s.kind === 'human');
    if (next && admitted.length) {
      span.handoff({
        to_agent: next.kind === 'human' ? 'human' : next.agent,
        reason: next.kind === 'human' ? 'the workflow ends at a person' : next.why,
        artifact_ids: admitted.map((a) => a.id),
      });
    }

    span.end({ status: refusals.length ? 'ok' : 'ok', outputs: { admitted: admitted.length, refused: refusals.length } });

    /* A stage that produced only refused records is a REFUSED
       stage, not an empty one. The distinction matters: empty is a
       result about the world, refused is a result about the
       agent. */
    if (offered.length && !admitted.length) {
      return { ...base, status: 'refused', why: `every one of the ${offered.length} record(s) "${stage.agent}" produced was refused at the handoff.`, grant, records: [], refusals, closes: refusals.map((r) => r.closes).filter(Boolean).join(' · ') };
    }

    return { ...base, status: 'ok', why: `${admitted.length} record(s) admitted${refusals.length ? `, ${refusals.length} refused` : ''}.`, grant, records: admitted, refusals };
  }

  /* ---------------------------------------------------------- result */

  #result(wf, run, extra = {}) {
    const snap = wf.snapshot();
    return {
      ok: !['failed'].includes(wf.state),
      workflow: {
        ...snap,
        autonomy: wf.autonomy ?? null,
        human_review: wf.human_review ?? null,
        verification: wf.verification ? { ok: wf.verification.ok, summary: wf.verification.summary, checks: wf.verification.checks.map((c) => ({ check: c.check, ok: c.ok, why: c.why })) } : null,
        scope: wf.scope ?? null,
      },
      state: wf.state,
      state_meaning: END_STATE_MEANING[wf.state] ?? null,
      trace: { trace_id: run.trace_id, run_id: run.run_id },
      /* Said on every result, because "the workflow completed" is
         the sentence somebody will quote. */
      published: false,
      publication_note: 'Nothing was published. No workflow type in this system can reach the site: every one of the ten ends at a human stage, agent/orchestrator/workflows.mjs refuses to load one that does not, and no code path here writes to data/, i18n/, js/, css/ or any page.',
      ...extra,
    };
  }
}

export { WORKFLOW_TYPES };
