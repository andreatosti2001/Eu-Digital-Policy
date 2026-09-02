/* ============================================================
   agent/verifier/build.mjs — a record whose fields and whose
   epistemic block cannot disagree

   `agent/schemas/validate.mjs` refuses a record whose factual field
   carries a value with no `epistemic.fact` entry naming it, whose
   field is `"unknown"` with no unresolved entry declaring it
   researched-and-not-determinable, or whose unresolved entry says
   "nobody looked" about a field that holds a value. Those are the
   right checks. But an agent that sets the field in one place and
   writes the entry in another WILL eventually set one and forget the
   other, and the failure surfaces as a validation error three
   modules from the mistake.

   So the Verifier never sets one without the other. `fact()` writes
   the value AND the entry; `openUnknown()` writes `"unknown"` AND
   the unresolved entry with `absence_kind: 'unknown_not_determinable'`;
   `openNull()` writes `null` AND `'null_not_researched'`. The two
   states the whole architecture insists on keeping apart cannot be
   confused here, because there is one call for each and neither can
   produce the other's shape.

   This is the same move `js/format.js` makes for evidence grades and
   `js/pipeline.js` for the enforcement stages — derive the pair
   together rather than storing two things that must agree.
   ============================================================ */

const empty = () => ({ fact: [], inference: [], interpretation: [], unresolved: [] });

export class RecordBuilder {
  /**
   * @param {{contract:string, agent:string, now:string, span:object, simulated:boolean}} opts
   */
  constructor({ contract, agent, now, span, simulated }) {
    this.contract = contract;
    this.agent = agent;
    this.now = now;
    this.span = span;
    this.simulated = simulated === true;
    this.fields = {};
    this.evidence = [];
    this.entities = [];
    this.ep = empty();
  }

  /** A structural field — an id, a timestamp, a count. Asserts
   *  nothing about the world, so it carries no evidence burden. */
  set(field, value) { this.fields[field] = value; return this; }

  addEvidence(entry) { this.evidence.push({ ...entry, simulated: this.simulated }); return this; }

  addEntity(entity) { this.entities.push(entity); return this; }

  /** Something READ from a source. The value and the citation land
   *  together or not at all. */
  fact(field, value, statement, evidence_refs) {
    if (value === null || value === undefined) {
      throw new Error(`fact("${field}") called with no value — use openNull or openUnknown, which say which kind of absence it is`);
    }
    if (!evidence_refs?.length) {
      throw new Error(`fact("${field}") cites nothing — a fact in this repository carries the source it was read from`);
    }
    if (field !== null) this.fields[field] = value;
    this.ep.fact.push({ field, statement, evidence_refs: [...evidence_refs] });
    return this;
  }

  /** Something CONCLUDED. `method` is mandatory because "it
   *  follows" is not one. */
  inference(field, value, statement, from, method) {
    if (field !== null && value !== undefined) this.fields[field] = value;
    this.ep.inference.push({ field, statement, from: [...from], method });
    return this;
  }

  /** A reading, attributed. An unattributed interpretation reads as
   *  law. */
  interpretation(field, statement, { held_by = this.agent, basis, contested = false }) {
    this.ep.interpretation.push({ field, statement, held_by, basis, contested });
    return this;
  }

  /** Nobody has looked. The field goes null, and the entry says so. */
  openNull(field, question, missing, { blocks = false } = {}) {
    if (field !== null) this.fields[field] = null;
    this.ep.unresolved.push({ field, question, missing, absence_kind: 'null_not_researched', blocks });
    return this;
  }

  /** Researched, and the answer is not publicly determinable. The
   *  field goes to the sentinel, and the entry says which state it
   *  is — never the same word as "nobody looked". */
  openUnknown(field, question, missing, { blocks = false } = {}) {
    if (field !== null) this.fields[field] = 'unknown';
    this.ep.unresolved.push({ field, question, missing, absence_kind: 'unknown_not_determinable', blocks });
    return this;
  }

  /** No rule fired. NOT DETERMINED — never "probably not". */
  openNoRule(field, question, missing, { blocks = false } = {}) {
    if (field !== null) this.fields[field] = null;
    this.ep.unresolved.push({ field, question, missing, absence_kind: 'no_rule_matched', blocks });
    return this;
  }

  build(over = {}) {
    return {
      contract: this.contract,
      contract_version: 1,
      agent: this.agent,
      created_at: this.now,
      affected_entities: this.entities,
      evidence: this.evidence,
      epistemic: this.ep,
      trace_ref: { trace_id: this.span.trace_id, span_id: this.span.span_id, run_id: this.span.run_id },
      simulated: this.simulated,
      ...this.fields,
      ...over,
    };
  }
}
