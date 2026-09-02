/* ============================================================
   agent/schemas/common.mjs — the envelope every contract carries

   Three structures appear in all seventeen contracts, and they are
   defined once here rather than repeated per contract, for the
   reason the datasets already give: one home per fact.

   AFFECTED ENTITY  what a record is about — an instrument, a claim,
                    a page, a module. Named the same way in every
                    contract so a query for "everything that touched
                    gdpr:art-3" is one query, not sixteen.

   EVIDENCE REF     what the record stands on. `absent` is a first-
                    class kind: a record that has nothing must say
                    so in its own body rather than omit the field,
                    which is the asterisk discipline applied to
                    machine records.

   EPISTEMIC BLOCK  the four states, separated. This is the part of
                    the contract that exists because of what this
                    site is: a record that cannot tell a fact from a
                    reading of a fact will eventually be rendered as
                    law, and a reader may act on it.
   ============================================================ */

import { F } from './fields.mjs';
import {
  CONTRACT_SCHEMA_VERSION, ENTITY_KINDS, EVIDENCE_KINDS, ABSENCE_KINDS,
  PROVENANCE_ROLES, RISKS, AUTONOMY_CLASSES, taxonomyIds,
} from './types.mjs';

/* ---------------------------------------------------------- entities */

export const AffectedEntity = F.object({
  kind: F.enum(ENTITY_KINDS, 'What sort of thing this is. Legal-record kinds are at minimum amber tier.'),
  id: F.string('The entity\'s own id where it has one — gdpr:art-3, src-eurlex-gdpr, cl-014 — or null for a file-level target.', { nullable: true }),
  path: F.string('Repository path, where the entity lives in a file: data/claims.json, index.html, js/format.js.', { nullable: true }),
  field: F.string('The specific field or anchor inside the entity, where the record is narrower than the whole record: claim_type, meta.standfirst.', { nullable: true }),
  note: F.string('Why this entity is affected, if it is not obvious from the id alone.', { nullable: true }),
}, 'One thing this record is about.');

/* ---------------------------------------------------------- evidence */

export const EvidenceRef = F.object({
  evidence_id: F.id('Local id, unique within this record. The epistemic block cites these.'),
  kind: F.enum(EVIDENCE_KINDS, 'What sort of evidence this is. "absent" means there is none — and the record is saying so.'),
  source_id: F.string('The data/sources.json id, when this evidence is already a canonical source record.', { nullable: true }),
  url: F.url('Where the document was retrieved from.', { nullable: true }),
  locator: F.string('Where inside it — an article number, a page, a file:line for a repository_file.', { nullable: true }),
  title: F.string('The document\'s title, as published.', { nullable: true, epistemic: 'factual' }),
  publisher: F.string('Who published it.', { nullable: true, epistemic: 'factual' }),
  quote: F.text('The words actually read, where the record turns on them. Never paraphrase into this field.', { nullable: true }),
  retrieved_at: F.iso('When it was fetched. A citation with no retrieval date cannot be re-checked.', { nullable: true }),
  checksum: F.string('sha256 of the retrieved bytes, where it was taken.', { nullable: true }),
  supports: F.enum(taxonomyIds('supports'), 'How it bears on the statement, in data/claims.json\'s own vocabulary. "supports:context" is NOT a citation.', { nullable: true }),
  role: F.enum(PROVENANCE_ROLES, 'Primary, official, secondary, interpretation — or unresolved when there is nothing.'),
  simulated: F.bool('True only for a fixture. A simulated record is never actionable.'),
}, 'One thing this record stands on.');

/* ---------------------------------------------------------- epistemic */

const FactEntry = F.object({
  field: F.string('The dotted field this is about, or null for a statement about the record as a whole.', { nullable: true }),
  statement: F.string('What is asserted, in words a reviewer can check against the evidence.'),
  evidence_refs: F.array(F.id('An evidence_id in this record\'s evidence array.'), 'At least one. A fact with no evidence is not a fact here.', { min: 1 }),
}, 'Something read from a source.');

const InferenceEntry = F.object({
  field: F.string('The dotted field this is about, or null.', { nullable: true }),
  statement: F.string('What was concluded.'),
  from: F.array(F.string('An evidence_id, an entity id, or a prior record id this was concluded from.'), 'What it was concluded from. Never empty.', { min: 1 }),
  method: F.string('How — the rule, the computation, the comparison. "It follows" is not a method.'),
}, 'Something concluded from evidence rather than read from it.');

const InterpretationEntry = F.object({
  field: F.string('The dotted field this is about, or null.', { nullable: true }),
  statement: F.string('The reading being offered.'),
  held_by: F.string('Whose reading it is — an agent name, a named commentator, the author. An unattributed interpretation reads as law.'),
  basis: F.string('What it rests on. Sources can support the premises of a reading; they cannot settle its conclusion.'),
  contested: F.bool('True where another defensible reading exists. Softening this is how an interpretation becomes a fact.'),
}, 'A reading of the material, correctly typed as such.');

const UnresolvedEntry = F.object({
  field: F.string('The dotted field that is open, or null for a question about the record as a whole.', { nullable: true }),
  question: F.string('The open question, stated plainly.'),
  missing: F.string('Exactly what would close it — the publication, the confirmation, the decision.'),
  absence_kind: F.enum(ABSENCE_KINDS, 'Not researched, researched-and-not-determinable, or no rule matched. These are three different states.'),
  blocks: F.bool('True when nothing downstream may proceed on this record until it is closed.'),
}, 'Something this record cannot support — named, not omitted.');

export const EpistemicBlock = F.object({
  fact: F.array(FactEntry, 'Statements read from a source.'),
  inference: F.array(InferenceEntry, 'Statements concluded from evidence.'),
  interpretation: F.array(InterpretationEntry, 'Readings offered by whoever holds them.'),
  unresolved: F.array(UnresolvedEntry, 'Open questions. An empty array asserts there are none.'),
}, 'The four states, kept apart. Required on every contract record; all four arrays are always present, because "no open questions" is itself a claim worth making explicitly.');

/* ---------------------------------------------------------- envelope */

/**
 * On every record, without exception. `contract` and
 * `contract_version` are here so a record is self-describing: any
 * consumer can validate a record it was handed without being told
 * what it is, which is what makes "no agent may bypass these
 * contracts" checkable rather than aspirational.
 */
export const ENVELOPE_FIELDS = {
  contract: F.string('The contract this record claims to satisfy. Checked against the registry.'),
  contract_version: F.int('The contract schema version this record was written against.'),
  agent: F.string('Which agent produced it. An unattributed record is a record nobody owns.'),
  created_at: F.iso('When it was produced.'),
  affected_entities: F.array(AffectedEntity, 'What this record is about.', { min: 0 }),
  evidence: F.array(EvidenceRef, 'What it stands on.', { min: 0 }),
  epistemic: EpistemicBlock,
  trace_ref: F.object({
    trace_id: F.hex(32, 'The observability trace this record was produced inside.'),
    span_id: F.hex(16, 'The span that produced it.'),
    run_id: F.hex(16, 'The run — the span_id of the enclosing agent or orchestrator span.'),
  }, 'Where in the trace this came from. Nullable only for a record written outside a traced run, which should be rare and is worth noticing.', { nullable: true }),
  simulated: F.bool('True only for a fixture or a demonstration. Validation refuses to treat a simulated record as actionable.'),
};

/**
 * The twelve fields the session requires on every substantive
 * proposal. Four of them — agent, created_at, affected_entities,
 * evidence — are already in the envelope and are not restated here;
 * the suite asserts that all twelve are present in the effective
 * field set of every proposal contract, however they got there.
 */
export const PROPOSAL_FIELDS = {
  proposal_id: F.id('This proposal\'s id. Referenced by approvals, QA results and change records.'),
  reason: F.text('Why this is being proposed at all. Not what it does — why it should happen.'),
  confidence: F.ratio('0..1, in the proposing agent\'s own terms. Not a probability of correctness; a statement of how much it is standing on.'),
  risk: F.enum(RISKS, 'What it costs if this is wrong. A wrong legal claim is not the same class of defect as a slow fetch.'),
  autonomy_class: F.enum(AUTONOMY_CLASSES, 'autonomous (green) · review_required (amber) · human_only (red). Checked against what the proposal actually touches.'),
  proposed_change: F.object({
    summary: F.string('One sentence a reviewer can hold the diff to.'),
    operations: F.array(F.object({
      op: F.enum(['add', 'modify', 'remove', 'move'], 'What is done.'),
      target: F.string('Where — a path, an id, a field.'),
      current: F.text('What is there now, verbatim. Null when adding.', { nullable: true }),
      proposed: F.text('What would be there. Null when removing.', { nullable: true }),
      rationale: F.string('Why this particular operation.'),
    }, 'One concrete edit.'), 'The edits, individually. A proposal with no operations is a suggestion.', { min: 1 }),
    scope_note: F.string('What this deliberately does NOT do. The boundary is part of the proposal.', { nullable: true }),
  }, 'What would actually change.'),
  validation_requirements: F.array(F.object({
    check: F.string('The check\'s name.'),
    command: F.string('How to run it, exactly.'),
    expected: F.string('What passing looks like — including the baseline it is measured against.'),
    why: F.string('What this check would catch.'),
  }, 'One check that must pass before this lands.'), 'How anyone would know this is safe. Never empty.', { min: 1 }),
  rollback_plan: F.object({
    method: F.enum(['git_revert', 'inverse_edit', 'restore_from_commit', 'not_reversible'], 'How it would be undone.'),
    steps: F.array(F.string('One step.'), 'The steps, in order.', { min: 1 }),
    verification: F.string('How you would know the rollback worked.'),
    irreversible_reason: F.string('Required when the method is not_reversible. Says what cannot be put back.', { nullable: true }),
  }, 'How this is undone. A change nobody can undo is a change nobody should make unattended.'),
};

export const CURRENT_CONTRACT_VERSION = CONTRACT_SCHEMA_VERSION;
