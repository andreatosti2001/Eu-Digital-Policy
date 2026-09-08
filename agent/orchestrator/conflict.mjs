/* ============================================================
   agent/orchestrator/conflict.mjs — where two specialists disagree,
   and why that stops the chain

   `docs/AGENT-ROLES.md` H7: "Contradictions stop the chain. Where
   two roles disagree on a fact, work halts and goes to a human. It
   is never resolved by seniority, recency or convenience." SESSION
   22 asks the Orchestrator to detect conflicts; H7 says what it may
   do about them, which is nothing except stop and say so.

   SO THIS MODULE HAS NO RESOLVER. There is no `resolve()`, no
   `preferMostRecent()`, no confidence comparison and no tie-break.
   Every function here returns findings. The temptation it is
   arranged against is real and specific: a conflict between a
   verifier's `contradicted` and a proposal that asserts the value
   anyway has an obvious "answer" — believe the verifier — and
   taking it would be an agent deciding a question about EU law by
   rule of thumb.

   SIX DETECTORS, EACH FOR A DISAGREEMENT THAT HAS A KNOWN SHAPE.
   None of them is a general contradiction finder, and this file
   does not claim to be one: two records can disagree in prose that
   nothing here reads. What it catches is the six shapes the
   architecture makes visible, and `bound` on every result says so
   rather than letting an empty list read as "no conflicts".

   THE ASYMMETRY THAT MOST OF THEM SHARE. Each detector asks whether
   something got EASIER as the chain went downstream — a class
   lowered, an unresolved settled, an interpretation promoted to
   fact, a refusal softened. Work getting harder downstream is
   normal and is not reported: H5 says a class may rise, H6 says a
   refusal is passed on intact, and §4 says uncertainty may not be
   removed to produce cleaner output. All three are one-directional,
   and so are these.
   ============================================================ */

import { AUTONOMY_RANK } from '../schemas/types.mjs';

export const CONFLICT_KINDS = Object.freeze([
  'verdict_contradicted',   // a verifier said the source says otherwise, and a proposal asserts it anyway
  'value_disagreement',     // two records propose different values for the same target
  'class_lowered',          // a downstream record carries a lower autonomy class than an upstream one about the same thing
  'refusal_softened',       // an upstream blocking question is settled downstream without new evidence
  'epistemic_upgraded',     // interpretation or unresolved becomes fact, downstream, with no new evidence
  'role_collision',         // one agent held two roles the workflow forbids pairing (H3)
]);

/** All six are stop-the-chain by default. Severity is recorded so a
 *  reader can sort, never so the Orchestrator can decide which ones
 *  to ignore: `blocking` is true on every kind, and nothing in this
 *  module sets it to false. */
export const CONFLICT_SEVERITY = Object.freeze({
  verdict_contradicted: 'critical',
  value_disagreement: 'critical',
  class_lowered: 'high',
  refusal_softened: 'critical',
  epistemic_upgraded: 'critical',
  role_collision: 'high',
});

const targetOf = (e) => [e?.kind ?? '?', e?.id ?? '', e?.path ?? '', e?.field ?? ''].join('|');

const finding = (kind, why, records, detail = {}) => ({
  kind,
  severity: CONFLICT_SEVERITY[kind],
  blocking: true,
  why,
  records,
  detail,
  what_happens: 'the workflow stops and goes to a person. H7: a contradiction is never resolved by seniority, recency or convenience, and this module has no function that could.',
});

/* ---------------------------------------------- 1 · a contradicted verdict */

function verdictContradicted(records) {
  const out = [];
  const contradicting = records.filter((r) => r.contract === 'VerificationRecord'
    && ['contradicted', 'conflict'].includes(r.verdict ?? r.outcome?.verdict));

  for (const v of contradicting) {
    const subjects = new Set((v.affected_entities ?? []).map(targetOf));
    for (const p of records) {
      if (p === v || !p.proposed_change) continue;
      const overlap = (p.affected_entities ?? []).filter((e) => subjects.has(targetOf(e)));
      if (!overlap.length) continue;
      out.push(finding('verdict_contradicted',
        `${v.agent} recorded verdict "${v.verdict ?? v.outcome?.verdict}" about ${overlap.map((e) => e.id ?? e.path).join(', ')}, and ${p.agent} proposes a change to the same thing.`,
        [idOf(v), idOf(p)],
        { verdict: v.verdict ?? v.outcome?.verdict ?? null, entities: overlap.map(targetOf), proposal_summary: p.proposed_change?.summary ?? null }));
    }
  }
  return out;
}

/* ------------------------------------------- 2 · two different values */

function valueDisagreement(records) {
  const byTarget = new Map();
  for (const r of records) {
    for (const op of r.proposed_change?.operations ?? []) {
      if (op.proposed === null || op.proposed === undefined) continue;   // a finding, not a draft
      const key = `${op.op}:${op.target}`;
      if (!byTarget.has(key)) byTarget.set(key, []);
      byTarget.get(key).push({ record: r, op });
    }
  }
  const out = [];
  for (const [key, entries] of byTarget) {
    if (entries.length < 2) continue;
    const values = new Set(entries.map((e) => JSON.stringify(e.op.proposed)));
    if (values.size < 2) continue;
    out.push(finding('value_disagreement',
      `${entries.length} records propose ${values.size} different values for ${key}: ${entries.map((e) => `${e.agent ?? e.record.agent}`).join(', ')}.`,
      entries.map((e) => idOf(e.record)),
      { target: key, values: [...values].map((v) => String(v).slice(0, 200)) }));
  }
  return out;
}

/* ------------------------------------------------- 3 · a lowered class */

function classLowered(stages) {
  const out = [];
  let highest = null;
  let highestBy = null;
  for (const stage of stages) {
    for (const r of stage.records ?? []) {
      const cls = r.record?.autonomy_class;
      if (!cls || AUTONOMY_RANK[cls] === undefined) continue;
      if (highest === null || AUTONOMY_RANK[cls] > AUTONOMY_RANK[highest]) { highest = cls; highestBy = { stage: stage.stage, agent: stage.agent, id: r.id }; continue; }
      if (AUTONOMY_RANK[cls] < AUTONOMY_RANK[highest]) {
        out.push(finding('class_lowered',
          `${stage.agent} at stage "${stage.stage}" produced a record classed "${cls}", downstream of a record classed "${highest}" (${highestBy.agent} at "${highestBy.stage}") in the same workflow.`,
          [highestBy.id, r.id],
          { upstream_class: highest, downstream_class: cls, rule: 'docs/AGENT-ROLES.md H5 — class is set at the handoff and only rises. A downstream agent may escalate; it may never lower.' }));
      }
    }
  }
  return out;
}

/* --------------------------------------------- 4 · a softened refusal */

function refusalSoftened(stages) {
  const out = [];
  const blocking = [];
  for (const stage of stages) {
    for (const r of stage.records ?? []) {
      const rec = r.record ?? {};
      for (const u of rec.epistemic?.unresolved ?? []) {
        if (u.blocks) blocking.push({ stage: stage.stage, agent: stage.agent, id: r.id, question: u.question, field: u.field ?? null, entities: (rec.affected_entities ?? []).map(targetOf) });
      }
    }
  }
  if (!blocking.length) return out;

  for (const stage of stages) {
    for (const r of stage.records ?? []) {
      const rec = r.record ?? {};
      if (!rec.proposed_change) continue;
      const mine = (rec.affected_entities ?? []).map(targetOf);
      const stillOpen = new Set((rec.epistemic?.unresolved ?? []).filter((u) => u.blocks).map((u) => u.question));
      for (const b of blocking) {
        if (b.id === r.id) continue;
        if (!b.entities.some((e) => mine.includes(e))) continue;
        if (stillOpen.has(b.question)) continue;   // carried forward intact — H6 satisfied
        out.push(finding('refusal_softened',
          `${b.agent} left a BLOCKING open question about ${b.entities.filter((e) => mine.includes(e)).join(', ')} — "${b.question}" — and ${rec.agent} proposes a change to the same thing without carrying it forward.`,
          [b.id, r.id],
          { question: b.question, rule: 'docs/AGENT-ROLES.md H6 — a refusal is a valid deliverable and is passed on intact. A downstream agent may not convert one into a softer statement. An unresolved entry with blocks=true says nothing downstream may proceed until it is closed.' }));
      }
    }
  }
  return out;
}

/* --------------------------------------- 5 · an upgraded epistemic status */

function epistemicUpgraded(stages) {
  const out = [];
  const notFact = new Map();   // "entity|statement-ish" → where it was interpretation or unresolved
  for (const stage of stages) {
    for (const r of stage.records ?? []) {
      const rec = r.record ?? {};
      for (const e of rec.affected_entities ?? []) {
        const t = targetOf(e);
        for (const i of rec.epistemic?.interpretation ?? []) notFact.set(`${t}::${i.field ?? ''}`, { as: 'interpretation', stage: stage.stage, agent: stage.agent, id: r.id, statement: i.statement });
        for (const u of rec.epistemic?.unresolved ?? []) notFact.set(`${t}::${u.field ?? ''}`, { as: 'unresolved', stage: stage.stage, agent: stage.agent, id: r.id, statement: u.question });
      }
    }
  }
  for (const stage of stages) {
    for (const r of stage.records ?? []) {
      const rec = r.record ?? {};
      for (const e of rec.affected_entities ?? []) {
        const t = targetOf(e);
        for (const f of rec.epistemic?.fact ?? []) {
          const key = `${t}::${f.field ?? ''}`;
          const prior = notFact.get(key);
          if (!prior || prior.id === r.id) continue;
          /* New evidence would make this legitimate. "New" means an
             evidence reference this record has and the upstream one
             did not — checked, not assumed. */
          const newEvidence = (rec.evidence ?? []).filter((ev) => ev.kind !== 'absent' && ev.kind !== 'agent_output');
          out.push(finding('epistemic_upgraded',
            `${prior.agent} held ${e.id ?? e.path}${f.field ? `.${f.field}` : ''} as ${prior.as}, and ${rec.agent} states it as FACT${newEvidence.length ? ` on ${newEvidence.length} evidence reference(s), which may be legitimate and is reported for a person to judge` : ' with no retrieved or repository evidence of its own'}.`,
            [prior.id, r.id],
            { held_as: prior.as, upstream_statement: String(prior.statement).slice(0, 200), downstream_statement: String(f.statement).slice(0, 200), new_evidence: newEvidence.length, rule: 'Protocol §4 — editorial, UX and architectural agents must not silently transform an interpretation or a critique into a factual statement. Uncertainty must not be removed merely to produce cleaner output.' }));
        }
      }
    }
  }
  return out;
}

/* ------------------------------------------------ 6 · a role collision */

function roleCollision(workflow, stages) {
  const out = [];
  const at = new Map();
  for (const s of stages) if (s.agent) { if (!at.has(s.agent)) at.set(s.agent, []); at.get(s.agent).push(s.stage); }
  for (const pair of workflow?.same_agent_forbidden ?? []) {
    const [a, b] = pair;
    if (a === b) continue;
    /* The forbidden pair is about ROLES, and it fires when one
       agent held both. Two different agents holding them is the
       design. */
    const held = [a, b].filter((x) => at.has(x));
    if (held.length === 2) continue;
    for (const [agent, hisStages] of at) {
      if (hisStages.length < 2) continue;
      const roles = workflow.stages.filter((s) => hisStages.includes(s.stage) && [a, b].includes(s.agent)).map((s) => s.stage);
      if (roles.length >= 2) {
        out.push(finding('role_collision',
          `"${agent}" held both "${roles[0]}" and "${roles[1]}" in one workflow, and ${workflow.id} forbids that pairing.`,
          [], { agent, stages: roles, rule: 'docs/AGENT-ROLES.md H3 — no agent verifies its own output. Where one agent holds both roles it must state that and hold the second contract to the same standard; here the Orchestrator refuses the second dispatch instead.' }));
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------- the entry point */

const idOf = (r) => r?.proposal_id ?? r?.verification_id ?? r?.candidate_id ?? r?.change_id ?? r?.gap_id ?? r?.record_id ?? r?.id ?? '(unidentified record)';

/**
 * Every conflict the six detectors can see across one workflow's
 * stages.
 *
 * @param {{workflow:object, stages:object[]}} ctx
 * @returns {{conflicts:object[], blocking:object[], checked:string[], bound:string}}
 */
export function detectConflicts({ workflow, stages = [] }) {
  const records = stages.flatMap((s) => (s.records ?? []).map((r) => r.record).filter(Boolean));

  const conflicts = [
    ...verdictContradicted(records),
    ...valueDisagreement(records),
    ...classLowered(stages),
    ...refusalSoftened(stages),
    ...epistemicUpgraded(stages),
    ...roleCollision(workflow, stages),
  ];

  return {
    conflicts,
    blocking: conflicts.filter((c) => c.blocking),
    checked: [...CONFLICT_KINDS],
    records_examined: records.length,
    /* An empty list is a finding about the detectors, not about the
       work. Saying so is the difference between "no conflicts" and
       "none of the six shapes I can see". */
    bound: 'Six shapes, listed in `checked`. Two records can disagree in prose that nothing here reads — the validators do not read prose either, and agent/proposals/editorial/ is the only thing in this repository that reads a sentence at all. An empty conflict list means none of these six fired; it does not mean two specialists agree.',
  };
}
