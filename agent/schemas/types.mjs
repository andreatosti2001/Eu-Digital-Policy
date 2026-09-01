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
 *
 * `retrieval_failed` is the fourth, added in SESSION 05 by the first
 * real agent to run against these contracts. It is a statement about
 * THIS AGENT'S REACH, not about the world: the document is published
 * and citable, and the agent could not get to it. The other three
 * cannot hold that. Recording it as `null_not_researched` would say
 * nobody looked, when somebody did; recording it as
 * `unknown_not_determinable` is worse still, because that asserts the
 * answer is not publicly determinable — a claim about the world, and
 * a false one, made on the strength of a network failure. A blocked
 * fetch is evidence about the fetcher and never about the law.
 */
export const ABSENCE_KINDS = [
  'null_not_researched',        // nobody has looked
  'unknown_not_determinable',   // researched, not publicly determinable
  'no_rule_matched',            // NOT DETERMINED — never "probably not"
  'retrieval_failed',           // published and citable; this agent could not reach it
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
];

export const QA_VERDICTS = ['pass', 'pass_with_findings', 'fail'];

export const GAP_KINDS = [
  'missing_source',            // the statement points at a publication nobody has located
  'unverified_record',         // recorded from general knowledge, not yet checked
  'source_conflict',           // two sources disagree and the model cannot hold it
  'not_publicly_determinable', // researched; the answer is not published
  'no_rule_matched',           // no applicability rule fires — NOT DETERMINED
  'coverage_gap',              // an area the corpus does not reach at all
  'stale_verification',        // checked once, past its stated interval
  'retrieval_blocked',         // located, attempted, refused — the gap is in this agent's reach
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
