/* ============================================================
   AgentObservation — a structured claim about the world

   The observability layer already states the position: an
   observation is not a log line. A log line is prose addressed to
   whoever happens to be watching the terminal; an observation has a
   subject, a summary, data, a confidence and a risk, and it can be
   counted, graded, queried and disagreed with later.

   This contract is the handoff-safe form of the same thing. Where
   the tracer's `observe()` writes into the trace, an
   AgentObservation is what one agent passes to another, and it
   carries the epistemic block the trace record does not: the
   receiving agent has to be able to tell which part of what it was
   handed was read, which was concluded, which is a reading, and
   which is still open.

   `trace_ref` is not nullable here. An observation produced outside
   a traced run cannot be placed in the execution tree, and an
   observation nobody can locate is the log line this contract
   exists to refuse.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineContract } from '../define.mjs';
import { RISKS } from '../types.mjs';

export const AgentObservation = defineContract({
  name: 'AgentObservation',
  kind: 'observation',
  id_field: 'observation_id',
  doc: 'One structured claim about the world made by an agent, in a form another agent can act on: subject, summary, data, confidence, risk, and the four epistemic states kept apart.',
  fields: {
    observation_id: F.id('This observation\'s id.'),
    subject: F.string('What it is about, in one phrase. The affected_entities array says which records; this says what the observation is of.'),
    summary: F.string('What was observed. An observation with no summary is a log line.'),
    data: F.data('The structured payload — counts, ids, values. Never the only home for something asserted, because nothing validates the inside of a blob.', { nullable: true }),
    confidence: F.ratio('0..1, in the observing agent\'s own terms.', { nullable: true }),
    risk: F.enum(RISKS, 'What it costs if this observation is wrong.', { nullable: true }),
    refs: F.array(F.string('An id of something else — a record, an entity, another observation.'), 'What this points at.'),
    supersedes: F.id('An earlier observation this replaces. Observations are never edited.', { nullable: true }),
  },
  forbidden: {
    message: 'This is not a log line and has no message field. Use summary, and put what a machine needs into data.',
    level: 'There is no severity ladder here. There is risk, and there is confidence.',
    log: 'Same.',
    timestamp: 'created_at is the envelope\'s field and the only home for when this was produced.',
  },
  rules: [
    (r) => (!r.trace_ref
      ? ['trace_ref is null: an observation that cannot be placed in a trace is the log line this contract exists to replace']
      : []),
    (r) => {
      const e = r.epistemic ?? {};
      const total = (e.fact?.length ?? 0) + (e.inference?.length ?? 0) + (e.interpretation?.length ?? 0) + (e.unresolved?.length ?? 0);
      return total === 0 ? ['the epistemic block is entirely empty: an observation that asserts nothing, concludes nothing and leaves nothing open has observed nothing'] : [];
    },
  ],
});
