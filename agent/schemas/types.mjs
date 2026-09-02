/* ============================================================
   agent/schemas/types.mjs — the vocabularies contracts resolve against

   Three sources of vocabulary, and the split matters:

   1. data/taxonomy.json is the enum authority for anything the
      SITE says about EU law — `supports`, `source_type`,
      `source_tier`, `claim_type`, `url_status`. This module reads
      those terms from the file rather than copying them, because a
      copy is a second home for a fact and two copies can disagree.
      A contract that invented its own word for "directly supports"
      would be unreconcilable with the bibliography.

   2. agent/observability/schema.mjs owns the vocabulary of a TRACE
      — risk, approval state, provenance role. Re-exported here, not
      redefined, for the same reason.

   3. This module owns only what neither of the other two has: the
      words for the AGENT LAYER itself — entity kinds, autonomy
      classes, epistemic status, verdicts, gap kinds. These are
      deliberately NOT added to data/taxonomy.json: that file is the
      site's legal vocabulary, and an agent's own bookkeeping has no
      business in the enum authority a reader's page resolves against.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export { RISKS, APPROVAL_STATES, PROVENANCE_ROLES } from '../observability/schema.mjs';

export const CONTRACT_SCHEMA_VERSION = 1;

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(HERE, '..', '..');

/* ---------------------------------------------------------- taxonomy */

let _taxonomy = null;

/** Read once, lazily. Zero dependencies; the file is the authority. */
export function taxonomy() {
  if (_taxonomy === null) {
    _taxonomy = JSON.parse(readFileSync(join(REPO_ROOT, 'data', 'taxonomy.json'), 'utf8'));
  }
  return _taxonomy;
}

/**
 * The IDs of one taxonomy dimension, e.g. taxonomyIds('supports') →
 * ['supports:direct','supports:partial','supports:context'].
 * Throws on an unknown dimension: a contract referring to a
 * vocabulary that does not exist must fail loudly at load, not
 * silently accept anything at validation time.
 */
export function taxonomyIds(dimension) {
  const t = taxonomy();
  const terms = t[dimension];
  if (!Array.isArray(terms)) throw new Error(`taxonomy has no dimension "${dimension}"`);
  return terms.map((x) => x.id);
}

/* ---------------------------------------------------------- epistemic status

   The four states every contract must be able to tell apart. This
   is the project's own discipline turned into a field: the site
   already refuses to render an interpretation as if it were law,
   and an agent handing another agent a record has to make the same
   distinction or the receiving agent cannot.                      */

export const EPISTEMIC_STATUS = ['fact', 'inference', 'interpretation', 'unresolved'];

/** What a field is CAPABLE of being, declared in the schema. A
 *  `structural` field — an id, a timestamp, a status flag — is
 *  bookkeeping and asserts nothing about the world, so it carries no
 *  evidence burden. Everything else does. */
export const FIELD_EPISTEMICS = ['structural', 'factual', 'inference', 'interpretation'];

/**
 * How an absence arose. `null` and `unknown` are different states
 * and must never be rendered alike (AI-SAFE-BOUNDARIES §0.3); a
 * missing rule is a third state and is never a negative finding
 * (§0.5). Naming them separately is what stops a downstream agent
 * from collapsing them.
 */
export const ABSENCE_KINDS = [
  'null_not_researched',        // nobody has looked
  'unknown_not_determinable',   // researched, not publicly determinable
  'no_rule_matched',            // NOT DETERMINED — never "probably not"
];

/** The sentinel value for researched-and-not-determinable. Same word
 *  the datasets already use (payment:unknown, remedy:unknown). */
export const UNKNOWN = 'unknown';

/* ---------------------------------------------------------- autonomy

   One class per tier of docs/AI-SAFE-BOUNDARIES.md. The names are
   about what the AGENT may do, and the mapping to the tier is
   recorded here so neither can drift from the other.              */

export const AUTONOMY_CLASSES = ['autonomous', 'review_required', 'human_only'];

export const AUTONOMY_TIER = {
  autonomous: 'green',        // §1 — failure mode is a broken build, not a false statement
  review_required: 'amber',   // §2 — an agent may prepare it; a human approves it
  human_only: 'red',          // §3 — an agent may propose only; a human authors the change
};

export const AUTONOMY_RANK = { autonomous: 0, review_required: 1, human_only: 2 };

/* ---------------------------------------------------------- entities

   What a contract record can be ABOUT. The first block is the legal
   record — every one of these is at least amber, because getting one
   wrong makes the site state something false. The second block is
   the machinery around it, where the failure mode is a broken page.  */

export const LEGAL_ENTITY_KINDS = [
  'instrument', 'provision', 'relationship', 'institution', 'competence',
  'source', 'claim', 'enforcement_action', 'timeline_event', 'glossary_term',
  'applicability_rule', 'taxonomy_term', 'brief_part', 'prose',
];

export const SYSTEM_ENTITY_KINDS = [
  'page', 'module', 'stylesheet', 'dataset', 'i18n_key', 'locale',
  'tool', 'document', 'skill', 'agent', 'contract', 'trace',
];

export const ENTITY_KINDS = [...LEGAL_ENTITY_KINDS, ...SYSTEM_ENTITY_KINDS];

/**
 * Targets that are red tier under AI-SAFE-BOUNDARIES §3 wherever
 * they appear. Matched as substrings against an affected entity's
 * `path` or `field`, so `js/format.js` and
 * `js/format.js:TIER_GRADE` both hit. The list is short on purpose:
 * it holds the things whose alteration changes what the whole
 * corpus is said to prove, plus the two statements the project may
 * never restate on the author's behalf.
 */
export const RED_TARGETS = [
  'js/format.js',            // TIER_GRADE — the evidence grading rules
  'js/pipeline.js',          // the enforcement pipeline derivation
  'tools/_footer.mjs',       // the legal footer generator, incl. BASE
  'claim_type',              // reclassifying fact as interpretation, or the reverse
  'licence',
  'license',
  'non-affiliation',
  'no-legal-advice',
  'known limitations',
];

/* ---------------------------------------------------------- authorities

   The issuing-authority hierarchy the Source Scout searches in.
   THE ARRAY ORDER IS THE PRIORITY ORDER — index 0 is searched and
   trusted first — so the ranking has one home rather than living
   both as a list and as a separate table of numbers that could
   disagree with it.

   This is a vocabulary about WHO PUBLISHED something, which is not
   the same question as what evidence tier the document sits in.
   A Commission legislative document and a Commission press release
   come from the same authority and do not carry the same weight, so
   the tier is estimated from the document type as well as the
   authority — see agent/scout/authorities.mjs — and is left null
   when neither settles it.                                        */

export const AUTHORITY_CLASSES = [
  'authority:eur-lex',            // 1 · EUR-Lex and the Official Journal
  'authority:commission',         // 2 · the European Commission
  'authority:edpb',               // 3 · European Data Protection Board
  'authority:edps',               // 4 · European Data Protection Supervisor
  'authority:enisa',              // 5 · EU Agency for Cybersecurity
  'authority:eu-agency',          // 6 · other EU agencies and bodies
  'authority:national-authority', // 7 · national competent authorities
  'authority:court',              // 8 · the CJEU, the General Court, national courts
  'authority:secondary-expert',   // 9 · everything else, and never presented as more
];

/** Anything at this class is secondary and must say so. The brief
 *  permits secondary sources to be discovered; it does not permit
 *  them to arrive unlabelled. */
export const SECONDARY_AUTHORITY = 'authority:secondary-expert';

/* ---------------------------------------------------------- evidence

   What a record is standing on. `absent` is a first-class kind, not
   an omission: a record that cannot support a statement must be able
   to say so in its own body, which is the same discipline as the
   asterisk in the running text.                                    */

export const EVIDENCE_KINDS = [
  'retrieved_document',   // something actually fetched and read
  'repository_file',      // a file in this repository, at a locator
  'dataset_record',       // an existing record in data/*.json
  'validator_output',     // what a tool in tools/ printed
  'measurement',          // something counted or timed in this run
  'agent_output',         // another agent's contract record
  'absent',               // there is nothing — and the record says so
];

/* ---------------------------------------------------------- verdicts */

export const VERIFICATION_VERDICTS = [
  'confirmed',             // the source states what the record says it states
  'partially_confirmed',   // it establishes part of it, or a narrower case
  'contradicted',          // the source says otherwise
  'not_determinable',      // researched; the source cannot settle it
  'source_unavailable',    // the document could not be retrieved
  'conflict',              // two authoritative sources disagree, and neither displaces the other
];

/* ---------------------------------------------------------- legal status

   The twelve states a legal act can be in, as SESSION 07's brief
   requires the Legal Verifier to tell them apart. Collapsing any two
   of these is the failure mode the whole contract exists to prevent:
   an act that has ENTERED INTO FORCE is not yet APPLICABLE, and a
   reader told otherwise may act two years early.

   SEVEN OF THE TWELVE ALREADY HAVE A HOME. data/taxonomy.json's
   `status` dimension is the site's own vocabulary for exactly this,
   and the mapping below points at it rather than copying its ids:
   one home per fact, and a renamed taxonomy term fails the suite
   instead of silently disagreeing with the agent layer.

   THE OTHER FIVE HAVE NONE, and the null says so. `corrected`,
   `annulled`, `under_judicial_review`, `guidance` and
   `non_binding_commentary` are distinctions the Verifier must draw
   and the site's vocabulary does not carry. They are NOT added to
   data/taxonomy.json here: that file is the enum authority a
   reader's page resolves against, changing it is data work, and this
   session is not scoped for it. A null is an honest finding —
   the term is missing — and never a licence to file the status
   under a taxonomy id that means something else.

   The keys are bare snake_case rather than `status:`-prefixed ids,
   deliberately: an agent-layer value that LOOKED like a taxonomy id
   would eventually be written into a dataset by something that did
   not check.                                                       */

export const LEGAL_STATUS_TAXONOMY = {
  proposed: 'status:proposal',
  adopted: 'status:adopted',
  published: 'status:published',
  entered_into_force: 'status:in-force',
  applicable: 'status:applicable',
  amended: 'status:amended',
  corrected: null,
  repealed: 'status:repealed',
  annulled: null,
  under_judicial_review: null,
  guidance: null,
  non_binding_commentary: null,
};

export const LEGAL_STATUSES = Object.keys(LEGAL_STATUS_TAXONOMY);

/**
 * What KIND of state each status is. Two statuses in the same kind
 * are refinements of one another; two in different kinds are
 * different things about the act, and an agent that finds signals
 * for both has found an ambiguity rather than a stronger answer.
 */
export const LEGAL_STATUS_KIND = {
  proposed: 'legislative_progress',
  adopted: 'legislative_progress',
  published: 'legislative_progress',
  entered_into_force: 'in_effect',
  applicable: 'in_effect',
  amended: 'modified',
  corrected: 'modified',
  repealed: 'terminated',
  annulled: 'terminated',
  under_judicial_review: 'contested',
  guidance: 'non_binding',
  non_binding_commentary: 'non_binding',
};

/** Neither of these can establish a binding obligation, however
 *  plainly it is worded. A proposition drawn from one is confirmed
 *  as WHAT THE SOURCE SAYS and never as what the law requires. */
export const NON_BINDING_STATUSES = LEGAL_STATUSES.filter((s) => LEGAL_STATUS_KIND[s] === 'non_binding');

/** The three outcomes SESSION 07's brief names. DERIVED from the
 *  verdict, never stored beside it — a second copy is a second thing
 *  to be wrong, and VerificationRecord forbids the field. */
export const VERIFICATION_OUTCOME_CLASSES = ['resolved', 'unresolved', 'conflict'];

export const QA_VERDICTS = ['pass', 'pass_with_findings', 'fail'];

export const GAP_KINDS = [
  'missing_source',            // the statement points at a publication nobody has located
  'unverified_record',         // recorded from general knowledge, not yet checked
  'source_conflict',           // two sources disagree and the model cannot hold it
  'not_publicly_determinable', // researched; the answer is not published
  'no_rule_matched',           // no applicability rule fires — NOT DETERMINED
  'coverage_gap',              // an area the corpus does not reach at all
  'stale_verification',        // checked once, past its stated interval
  'retrieval_blocked',         // the address is known, retrieval was attempted, and it failed
];

export const GAP_STATES = ['open', 'closed_by_verification', 'declared_unknown', 'withdrawn'];

export const CANDIDATE_STATES = ['proposed', 'accepted', 'rejected', 'duplicate'];

export const CHANGE_STATES = ['proposed', 'applied', 'reverted', 'abandoned'];

export const DEPLOYMENT_STATES = ['undeployed', 'pushed', 'published', 'rolled_back', UNKNOWN];

export const ROLLBACK_METHODS = ['git_revert', 'inverse_edit', 'restore_from_commit', 'not_reversible'];

export const RUN_STATUSES = ['running', 'ok', 'failed', 'skipped', 'cancelled'];

/** The four validators. A proposal that touches data, markup, styles
 *  or scripts must name all four in its validation_requirements —
 *  AGENTS.md states it as a rule for humans; here it is checkable. */
export const REQUIRED_VALIDATORS = [
  'tools/validate.mjs',
  'tools/i18n-audit.mjs',
  'tools/design-qa.mjs',
  'tools/freshness.mjs',
];

/* ---------------------------------------------------------- data proposals

   SESSION 08's brief: "Any proposed factual modification must first
   become a proposal object", and "do not automatically merge
   substantive legal changes."

   None of the four proposal contracts could hold one. An
   EditorialProposal is about the brief's prose; an
   ImplementationProposal is about code and would have recorded a
   change to data/claims.json under `files` and `modules`, which is
   filing a legal change as a code change. So DataProposal was added
   as a fifteenth contract rather than routed around — the course
   SESSION 05 and SESSION 07 both took, and the reasoning is in
   docs/VERIFICATION-INTEGRATION.md.                                */

/**
 * What a proposal would do to a canonical record. Deliberately
 * narrow: each kind carries a different burden, and the contract
 * rules attach to the kind rather than to a free-text description
 * an agent could word its way past.
 */
export const DATA_OPERATION_KINDS = [
  'attach_evidence',  // add a source reference to an existing record's sources[]
  'create_source',    // a new data/sources.json record, for a document actually retrieved and read
  'create_claim',     // a new data/claims.json record, for a statement already present in the prose
  'amend_field',      // change the value a field carries on an existing record
  'annotate',         // add to a verification_note or a gap_note without changing any value
];

/**
 * What becomes of a provenance field on the record a proposal
 * touches. There is deliberately NO `removed` and no bare
 * `replaced`: removing an asterisk, a reference gap, a
 * requires_verification flag or a verification_note is red tier
 * under AI-SAFE-BOUNDARIES §3, and a vocabulary that offered the
 * word would be an invitation to use it.
 *
 * `replaced_human_only` exists because a verification_note written
 * before the source was found does genuinely need rewriting once it
 * has been. It is not the same permission: the rules refuse it on
 * anything but a substantive, human_only proposal, and the operation
 * must carry the current text verbatim so the diff shows what is
 * being written over.
 */
export const PROVENANCE_DISPOSITIONS = [
  'unchanged',
  'extended',            // the existing text is kept and added to
  'set_first_time',      // the field was null and nobody had looked
  'replaced_human_only',
];
