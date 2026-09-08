/* ============================================================
   agent/policy/categories.mjs — what KIND of act this is, and
   whether any policy is allowed to let a machine do it

   SESSION 23 asks for a policy that "MUST define exactly which
   actions can be performed automatically and which require human
   approval". That question cannot be answered about a file path or
   a diff size. It is answered about a CATEGORY of act, because the
   thing that makes a change dangerous here is what it asserts, not
   how many bytes it moves: a two-character edit to a claim's
   `claim_type` changes what the site says an EU regulation
   requires, and a two-thousand-line report under docs/ changes
   nothing a reader relies on.

   THREE LISTS, AND THE DISTANCE BETWEEN THEM IS THE POINT.

   1 · `ACTION_CATEGORIES` — the vocabulary. Every act this system
       can attempt has exactly one category, derived from the
       proposal rather than declared by it (see `categoriseProposal`).

   2 · `AUTOMATABLE_CATEGORIES` — the categories protocol §20 says
       may LATER become candidates for controlled autonomy. Source
       metadata maintenance, non-substantive retrieval metadata,
       verified source URL corrections, machine-derived fields where
       the canonical source data is unchanged. This is a statement
       about what is *eligible*, not about what is *on*.

   3 · `DEFAULT_POLICY.enabled_categories` — what is actually
       switched on. It is **empty**, and SESSION 23's brief is the
       reason in its own words: "Do NOT enable automatic production
       merge in this session. The objective is to establish and
       verify the policy, not to activate unrestricted autonomy."
       Filling it is a governance change, and protocol §24 says the
       system may not make one of those to itself.

   The engine takes the policy as a PARAMETER precisely so that the
   suite can prove the permitting half works — a test that could
   only ever observe a refusal cannot tell "correctly refused" from
   "broken", which is the failure `.control-room/selftest.mjs` was
   arranged against. `agent/policy/selftest.mjs` therefore asserts
   both: that a low-risk act executes under a policy that enables
   its category, and that it does NOT execute under the policy this
   repository ships.

   WHY CATEGORY IS DERIVED AND NEVER DECLARED. `autonomy_class` is a
   field on every proposal contract, and the proposing agent sets
   it. An agent that wanted its change automated would set it to
   `autonomous`, and `agent/implement/implementer.mjs` already
   refuses to read it that way: "autonomy is granted by policy, not
   by a field an agent set on its own proposal." So the category is
   computed here from the operation kinds, the datasets, the fields
   and the epistemic block — and where the derived category and the
   declared class disagree, the STRICTER of the two governs, which
   is `docs/AUTONOMY-POLICY.md`'s own rule for an uncertain
   classification.
   ============================================================ */

import { AUTONOMY_RANK } from '../schemas/types.mjs';

/* ---------------------------------------------------------- the vocabulary */

/**
 * Every category, with what it covers and what its failure costs a
 * reader. `human_review` names the protocol §19 clause that reserves
 * it, where one applies; `null` means no clause reserves the
 * category outright and it is decided on its conditions.
 */
export const ACTION_CATEGORIES = {
  /* ---- the four protocol §20 names as candidates for autonomy ---- */
  source_metadata_maintenance: {
    what: 'a field on a data/sources.json record that describes the SOURCE as an artefact — its url_status, its retrieval date, its checksum — where nothing about what the source is said to support changes.',
    costs: 'a stale or wrong retrieval note. It does not change any proposition the site makes about EU law.',
    human_review: null,
    automatable: true,
  },
  retrieval_metadata: {
    what: 'non-substantive retrieval bookkeeping: when a document was last fetched, whether the fetch succeeded, the recorded content hash.',
    costs: 'a reader is told a document was checked on the wrong day.',
    human_review: null,
    automatable: true,
  },
  source_url_correction: {
    what: 'replacing a source URL with one that has been retrieved and read and found to carry the same document.',
    costs: 'a broken or redirected citation. The claim it supports is unchanged; if the document at the new URL is NOT the same document, this is not this category (see `substantive_data_change`).',
    human_review: null,
    automatable: true,
  },
  machine_derived_field: {
    what: 'a field whose value is computed from canonical data that is itself unchanged — a regenerated index, a recomputed count, a re-emitted derived view.',
    costs: 'a derived view disagreeing with its own inputs, which a validator can normally see.',
    human_review: null,
    automatable: true,
  },

  /* ---- everything protocol §19 reserves to a human ---- */
  legal_interpretation: {
    what: 'reading an instrument and saying what it means, requires, or implies.',
    costs: 'a reader acting on a statement about EU law that nobody qualified checked. This is the harm the whole repository is arranged against.',
    human_review: 'protocol §19 — legal interpretation',
    automatable: false,
  },
  legal_conclusion: {
    what: 'stating that an obligation applies, does not apply, is in force, or has been breached.',
    costs: 'the same, with the hedging removed.',
    human_review: 'protocol §19 — legal conclusions',
    automatable: false,
  },
  critique: {
    what: 'an evaluative statement about an instrument, an institution or a policy.',
    costs: 'the site asserting an opinion in the register it reserves for facts.',
    human_review: 'protocol §19 — critique',
    automatable: false,
  },
  substantive_analytical_change: {
    what: 'changing what an analysis concludes, or the reasoning that reaches it.',
    costs: 'an argument nobody authored appearing under an author\'s name.',
    human_review: 'protocol §19 — substantive analytical changes',
    automatable: false,
  },
  substantive_editorial_change: {
    what: 'changing the brief\'s prose in a way that changes what it says. Includes the inlined __CONTENT__ copy in index.html and every locale that renders the key.',
    costs: 'the it/fr/es editions asserting something the English no longer says (docs/AUTONOMY-POLICY.md prohibition 11).',
    human_review: 'protocol §19 — substantive editorial changes',
    automatable: false,
  },
  schema_change: {
    what: 'a change to an inter-agent contract, to a dataset\'s shape, or to a validator\'s rules.',
    costs: 'every record written afterwards is governed by a gate nobody reviewed. agent/implement/scope.mjs already refuses to write agent/schemas/ at all.',
    human_review: 'protocol §19 — schema changes',
    automatable: false,
  },
  taxonomy_change: {
    what: 'a new, renamed or removed term in data/taxonomy.json — the enum authority every other dataset resolves against.',
    costs: 'IDs are never renamed here. A term added quietly is a vocabulary change nobody reviewed, and agent/schemas/contracts/data-proposal.mjs already forces the class to human_only.',
    human_review: 'protocol §19 — taxonomy changes',
    automatable: false,
  },
  deletion: {
    what: 'removing a record, a source, a claim, a dataset, a locale, or a provenance field.',
    costs: 'evidence that existed and no longer does. AI-SAFE-BOUNDARIES §3 and AUTONOMY-POLICY Class D both reserve it.',
    human_review: 'protocol §19 — deletions',
    automatable: false,
  },
  major_rewrite: {
    what: 'a change large enough that reviewing the diff is not the same as reviewing the change.',
    costs: 'an approval that was given for a summary rather than for a change.',
    human_review: 'protocol §19 — major rewrites',
    automatable: false,
  },
  architecture_change: {
    what: 'the rendering model, the module topology, the deployment, the build, the dependency set.',
    costs: 'AGENTS.md: "do not rebuild it". No build step, no dependencies, no framework — all deliberate, and design-qa.mjs fails the build on a third-party asset.',
    human_review: 'protocol §19 — architecture changes',
    automatable: false,
  },
  ambiguous_legal_status: {
    what: 'a change touching a record whose legal status the evidence does not settle.',
    costs: 'unknown rendered as resolved. AI-SAFE-BOUNDARIES §0.3.',
    human_review: 'protocol §19 — ambiguous legal status',
    automatable: false,
  },
  unresolved_contradiction: {
    what: 'a change made while two sources, or two records, disagree and the schema cannot hold both.',
    costs: 'a disagreement silently decided by whichever agent ran last.',
    human_review: 'protocol §19 — unresolved contradictions',
    automatable: false,
  },

  /* ---- the residue, and it is deliberately not a safe default ---- */
  substantive_data_change: {
    what: 'any new or amended value in data/*.json that is not one of the four maintenance categories above.',
    costs: 'the site stating something false about EU law.',
    human_review: 'protocol §19 — changes outside predefined low-risk scopes',
    automatable: false,
  },
  uncategorised: {
    what: 'an act this policy cannot place. Not a category so much as an admission.',
    costs: 'unknown, which is exactly why it may not execute. docs/AUTONOMY-POLICY.md: "Default when unsure: the higher class."',
    human_review: 'protocol §19 — changes outside predefined low-risk scopes',
    automatable: false,
  },
};

export const CATEGORY_NAMES = Object.keys(ACTION_CATEGORIES);

/** The four §20 names as eligible. Eligible is not enabled. */
export const AUTOMATABLE_CATEGORIES = CATEGORY_NAMES.filter((c) => ACTION_CATEGORIES[c].automatable);

/** Everything §19 reserves to a human, by name. */
export const HUMAN_ONLY_CATEGORIES = CATEGORY_NAMES.filter((c) => !ACTION_CATEGORIES[c].automatable);

/* ---------------------------------------------------------- the policy object */

/**
 * A policy is DATA. It is passed to the engine rather than compiled
 * into it, so that what is switched on is one readable object
 * somebody can diff, and so the suite can exercise the permitting
 * half without switching anything on in the repository.
 */
export const DEFAULT_POLICY = Object.freeze({
  policy_id: 'eu-digital-policy/autonomy/2026-09-08',
  /**
   * EMPTY, DELIBERATELY. SESSION 23: "Do NOT enable automatic
   * production merge in this session." Adding a category here is a
   * governance change and protocol §24 forbids the system making one
   * to itself: it needs a governance proposal and a human decision.
   */
  enabled_categories: Object.freeze([]),
  /** The highest risk an automatic act may carry. `low` is the
   *  ceiling and `none` is the only thing under it; a `medium` act
   *  is not automatable whatever its category. */
  max_automatic_risk: 'low',
  /** Environments an automatic act may touch. `production` is not
   *  among them and adding it is the same governance change. */
  automatic_environments: Object.freeze(['local', 'ci']),
  /** Paths an automatic act may write, as prefixes. Empty for the
   *  same reason `enabled_categories` is. */
  automatic_path_allowlist: Object.freeze([]),
  why_empty: 'SESSION 23 establishes and verifies the policy; it does not activate autonomy. Protocol §20: substantive legal content must remain outside automatic production merge unless a future governance decision explicitly changes the policy, and §24: the system MUST NOT autonomously rewrite its own governance policy.',
});

/**
 * A policy for a hypothetical future in which one low-risk category
 * has been enabled by a human decision. It exists so the suite can
 * prove the permit path works, and it is NOT the repository's
 * policy. Nothing outside the suite and the CLI's `--simulate`
 * flag reads it.
 */
export const SIMULATION_POLICY = Object.freeze({
  ...DEFAULT_POLICY,
  policy_id: 'eu-digital-policy/autonomy/SIMULATED-not-in-force',
  enabled_categories: Object.freeze(['machine_derived_field']),
  /* docs/ deliberately: it is the one directory no reader's browser
     loads and no dataset resolves against, so a fixture policy that
     enables it cannot be misread as a statement that anything in
     data/ is automatable. */
  automatic_path_allowlist: Object.freeze(['docs/']),
  simulated: true,
  why_empty: 'This policy is a fixture. It is not in force and nothing in the repository loads it outside a test.',
});

/* ---------------------------------------------------------- derivation */

const RISK_RANK = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
export const riskRank = (r) => (r in RISK_RANK ? RISK_RANK[r] : RISK_RANK.critical);

const PROSE_PATHS = ['index.html', 'i18n/'];
const DERIVATION_MODULES = ['js/format.js', 'js/pipeline.js', 'js/applies.js'];

/** Paths touched by a proposal, from the same two places
 *  `agent/implement/scope.mjs` reads them. Kept local rather than
 *  imported so a category can be derived from a proposal that is not
 *  being implemented. */
function pathsOf(proposal) {
  const out = new Set();
  for (const e of proposal?.affected_entities ?? []) if (typeof e.path === 'string') out.add(e.path);
  for (const op of proposal?.proposed_change?.operations ?? []) {
    const t = String(op.target ?? '').split(/[\s#]/)[0];
    if (/\.[A-Za-z0-9]+$/.test(t)) out.add(t);
  }
  for (const f of proposal?.files ?? []) out.add(f);
  for (const m of proposal?.modules ?? []) out.add(m);
  return [...out];
}

/**
 * The category of a proposal, derived.
 *
 * Order matters and it runs strictest-first: a proposal that is both
 * a deletion and a metadata edit is a deletion. Every branch returns
 * the reason, because a categorisation nobody can argue with is a
 * categorisation nobody can check.
 *
 * @param {object} proposal
 * @returns {{category:string, why:string, paths:string[], signals:string[]}}
 */
export function categoriseProposal(proposal) {
  const signals = [];
  const paths = pathsOf(proposal);
  const ops = proposal?.proposed_change?.operations ?? [];
  const ep = proposal?.epistemic ?? {};
  const at = (c, why) => ({ category: c, why, paths, signals });

  if (!proposal || typeof proposal !== 'object') {
    return at('uncategorised', 'there is no proposal to categorise. An act with no record behind it has no category and therefore no permission.');
  }

  /* 1 · deletion — any removal at all, including a provenance field. */
  const removals = ops.filter((o) => o.op === 'remove' || o.op === 'delete');
  if (removals.length) {
    signals.push(`${removals.length} remove operation(s)`);
    return at('deletion', `${removals.length} of ${ops.length} operation(s) remove something: ${removals.map((o) => o.target).slice(0, 4).join(', ')}. AI-SAFE-BOUNDARIES §3 reserves deletion to a human whatever else the change does.`);
  }
  const provenanceRemoval = (proposal.provenance_disposition ?? [])
    .filter((d) => d.disposition === 'replaced_human_only' || d.disposition === 'removed');
  if (provenanceRemoval.length) {
    signals.push('provenance disposition writes over an existing note');
    return at('deletion', `${provenanceRemoval.length} provenance field(s) would be written over: ${provenanceRemoval.map((d) => d.field).join(', ')}. Overwriting a verification note is the removal of the record of what was not known.`);
  }

  /* 2 · taxonomy, then schema. Both are vocabulary changes and both
     are refused whatever they are called. */
  if (proposal.operation_kind === 'create_taxonomy_term' || paths.some((p) => p.startsWith('data/taxonomy.json'))) {
    signals.push('touches the enum authority');
    return at('taxonomy_change', 'data/taxonomy.json is the enum authority every other dataset resolves against, and agent/schemas/contracts/data-proposal.mjs already forces this operation kind to human_only.');
  }
  if (paths.some((p) => p.startsWith('agent/schemas/') || p.startsWith('tools/'))) {
    signals.push('touches a contract or a validator');
    return at('schema_change', 'a change to agent/schemas/ or tools/ changes the gate rather than the thing the gate checks. agent/implement/scope.mjs refuses to write agent/schemas/ at all.');
  }

  /* 3 · architecture and deployment. */
  if (paths.some((p) => p.startsWith('.github/') || p === 'package.json' || p.endsWith('_config.yml'))) {
    signals.push('touches the build or the deployment');
    return at('architecture_change', 'the workflow definitions and the deployment configuration decide what runs with a write token and what the public site serves. AGENTS.md: do not rebuild the architecture.');
  }
  if (proposal.contract === 'ArchitectureProposal') {
    signals.push('ArchitectureProposal');
    return at('architecture_change', 'the contract is ArchitectureProposal. It is an architecture change by its own declaration.');
  }

  /* 4 · the epistemic block, read rather than trusted. A proposal
     whose own body records an interpretation is an interpretation,
     whatever its summary says. */
  if ((ep.interpretation ?? []).length) {
    signals.push(`${ep.interpretation.length} interpretation entr(ies) in the proposal's own epistemic block`);
    return at('legal_interpretation', `the proposal records ${ep.interpretation.length} interpretation(s) of its own: "${String(ep.interpretation[0]?.statement ?? '').slice(0, 140)}". §4 of the protocol forbids silently turning one into a factual statement, and automating it would be exactly that.`);
  }
  const blocking = (ep.unresolved ?? []).filter((u) => u.blocks);
  if (blocking.length) {
    signals.push(`${blocking.length} blocking open question(s)`);
    return at('ambiguous_legal_status', `${blocking.length} open question(s) the proposal marks as blocking: "${String(blocking[0]?.question ?? '').slice(0, 140)}".`);
  }
  if ((proposal.conflicts ?? []).length || (proposal.contradictions ?? []).length) {
    signals.push('the proposal carries a conflict of its own');
    return at('unresolved_contradiction', 'the proposal records a conflict it did not resolve. Protocol §19 reserves an unresolved contradiction to a human.');
  }

  /* 5 · the editorial and analytical surfaces. */
  if (proposal.contract === 'EditorialProposal' || paths.some((p) => PROSE_PATHS.some((q) => p === q || p.startsWith(q)))) {
    signals.push('touches the brief\'s prose or a locale');
    return at('substantive_editorial_change', 'index.html carries the brief\'s prose and the inlined __CONTENT__ copy of it, and i18n/ carries what the it/fr/es editions assert. Editing English under a data-i18n key without declaring it superseded in every locale is prohibition 11.');
  }
  if (paths.some((p) => DERIVATION_MODULES.includes(p))) {
    signals.push('touches a derivation');
    return at('substantive_analytical_change', `${DERIVATION_MODULES.filter((d) => paths.includes(d)).join(', ')} computes an evidence grade, an enforcement stage or an applicability outcome at render time. Changing one changes what every record derived from it asserts.`);
  }
  if (proposal.substantive === true) {
    signals.push('the proposal declares itself substantive');
    return at('substantive_data_change', 'the proposal\'s own `substantive` field is true. A proposal that says it is substantive is taken at its word in the strict direction.');
  }

  /* 6 · the four maintenance categories. Reached only by a proposal
     that has passed every refusal above. */
  if (proposal.contract === 'DataProposal' && proposal.dataset === 'data/sources.json') {
    const field = (proposal.proposed_change?.operations ?? []).map((o) => String(o.target ?? '')).join(' ');
    if (/url\b|\burl_status\b/.test(field) && proposal.retrieved_and_read === true) {
      signals.push('a source URL, retrieved and read');
      return at('source_url_correction', 'the operation targets a source URL on data/sources.json and the proposal records that the document at it was retrieved and read.');
    }
    if (/last_retrieved|checksum|retrieval|fetched/.test(field)) {
      signals.push('retrieval bookkeeping');
      return at('retrieval_metadata', 'the operation targets retrieval bookkeeping on data/sources.json: when the document was last fetched, and what it hashed to.');
    }
    if (proposal.operation_kind === 'annotate' || proposal.substantive === false) {
      signals.push('non-substantive source metadata');
      return at('source_metadata_maintenance', 'the operation edits a field describing the source as an artefact, and the proposal records that nothing about what the source supports changes.');
    }
  }
  if (proposal.contract === 'ImplementationProposal' && paths.every((p) => p.startsWith('docs/'))) {
    signals.push('docs/ only');
    return at('machine_derived_field', 'every path is under docs/, which no reader\'s browser loads and no dataset resolves against.');
  }

  /* 7 · anything left touching the legal record. */
  if (paths.some((p) => p.startsWith('data/'))) {
    signals.push('touches data/ and matched no maintenance category');
    return at('substantive_data_change', 'the change writes a canonical dataset and does not match any of the four maintenance categories protocol §20 names. docs/AUTONOMY-POLICY.md Class C: any new or amended value in data/*.json.');
  }

  return at('uncategorised', `nothing in this proposal places it in a category: ${paths.length} path(s), ${ops.length} operation(s), contract ${proposal.contract}. An act this policy cannot place does not execute, because "default when unsure: the higher class".`);
}

/**
 * The declared class and the derived category, reconciled — strictly.
 *
 * `docs/AUTONOMY-POLICY.md`: "Default when unsure: the higher class.
 * An agent that cannot confidently place a change escalates.
 * Misclassifying downward is the failure this document exists to
 * prevent."
 */
export function effectiveClass(proposal, category) {
  const declared = proposal?.autonomy_class ?? null;
  const impliedByCategory = ACTION_CATEGORIES[category]?.automatable ? 'review_required' : 'human_only';
  const declaredRank = declared in AUTONOMY_RANK ? AUTONOMY_RANK[declared] : AUTONOMY_RANK.human_only;
  const impliedRank = AUTONOMY_RANK[impliedByCategory];
  const effective = declaredRank >= impliedRank ? (declared in AUTONOMY_RANK ? declared : 'human_only') : impliedByCategory;
  return {
    declared,
    implied_by_category: impliedByCategory,
    effective,
    escalated: effective !== declared,
    why: effective === declared
      ? `the proposal declares "${declared}" and the derived category "${category}" implies "${impliedByCategory}"; the declaration is not weaker, so it stands.`
      : `the proposal declares "${declared ?? 'nothing'}" and the derived category "${category}" implies "${impliedByCategory}". The stricter of the two governs, so this is treated as "${effective}".`,
  };
}
