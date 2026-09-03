/* ============================================================
   agent/schemas/fixtures.mjs — one valid record per contract

   These exist so the suite can assert that each contract is
   satisfiable, and so an agent author has a worked example of what
   the epistemic block looks like when it is filled in honestly
   rather than mechanically.

   EVERY FIXTURE IS MARKED SIMULATED, every URL is on
   `example.invalid`, and `validate()` refuses a simulated record
   unless the caller explicitly asks for one. The observability
   layer took the same position for the same reason: under
   AI-SAFE-BOUNDARIES §0.1, fixture data that reads as research
   would be a worse defect than having no fixtures at all. Nothing
   here is a legal fact, a real source, or a real verification.
   ============================================================ */

const TRACE = 'a1'.repeat(16);
const SPAN = 'b2'.repeat(8);
const RUN = 'c3'.repeat(8);

const AT = '2026-09-01T09:00:00.000Z';

const empty = () => ({ fact: [], inference: [], interpretation: [], unresolved: [] });

const envelope = (contract, over = {}) => ({
  contract,
  contract_version: 1,
  agent: 'fixture-agent',
  created_at: AT,
  affected_entities: [],
  evidence: [],
  epistemic: empty(),
  trace_ref: { trace_id: TRACE, span_id: SPAN, run_id: RUN },
  simulated: true,
  ...over,
});

/** A retrieved-document evidence entry that is unmistakably fake. */
export const simEvidence = (id, over = {}) => ({
  evidence_id: id,
  kind: 'retrieved_document',
  source_id: null,
  url: 'https://example.invalid/simulated-document',
  locator: 'section 1',
  title: 'Simulated document — not a real publication',
  publisher: 'Simulated publisher',
  quote: 'This fixture quotes nothing, because it cites nothing that exists.',
  retrieved_at: AT,
  checksum: null,
  supports: 'supports:direct',
  role: 'official',
  simulated: true,
  ...over,
});

const fourValidators = [
  { check: 'data integrity', command: 'node tools/validate.mjs', expected: '0 errors, and the same 106 unverified records as the baseline', why: 'Referential integrity, duplicate canonical facts, status-model discipline.' },
  { check: 'locale register', command: 'node tools/i18n-audit.mjs', expected: '0 errors, 0 warnings', why: 'A key added or removed without a declared disposition leaves three locale editions asserting the superseded English.' },
  { check: 'markup and stylesheets', command: 'node tools/design-qa.mjs', expected: '0 errors, the same 5 warnings recorded in docs/CURRENT-ARCHITECTURE.md §12', why: 'A sixth warning is a finding, not noise.' },
  { check: 'freshness', command: 'node tools/freshness.mjs', expected: 'nothing past its stated interval', why: 'Verification dates age; the report says by how much.' },
];

const rollback = (over = {}) => ({
  method: 'git_revert',
  steps: ['git revert the commit on the working branch', 're-run the four validators against the §12 baseline'],
  verification: 'The four validators return to their baseline output and the affected page renders as before.',
  irreversible_reason: null,
  ...over,
});

/* ---------------------------------------------------------- fixtures */

export const sourceCandidateFixture = () => envelope('SourceCandidate', {
  candidate_id: 'cand-simulated-001',
  url: 'https://example.invalid/simulated-document',
  locator: 'section 1',
  title: 'Simulated document — not a real publication',
  publisher: 'Simulated publisher',
  publication_date: '2026-01-01',
  source_type: 'source-type:report',
  url_status: 'url:live',
  tier_estimate: 'tier:3',
  authority_class: 'authority:secondary-expert',
  relevance: 'A fixture. It bears on nothing, and is here only to show what a filled-in candidate looks like.',
  confidence: 0.3,
  duplicate_candidate_ids: [],
  matches_existing_source_id: null,
  verification_ref: null,
  state: 'proposed',
  affected_entities: [{ kind: 'instrument', id: 'simulated:instrument', path: null, field: null, note: 'A fixture entity. No such instrument record exists.' }],
  evidence: [simEvidence('ev-1', { supports: 'supports:partial' })],
  epistemic: {
    fact: [
      { field: 'title', statement: 'The document is titled as recorded.', evidence_refs: ['ev-1'] },
      { field: 'publisher', statement: 'The publisher is as recorded on the document.', evidence_refs: ['ev-1'] },
      { field: 'publication_date', statement: 'The document carries the recorded publication date.', evidence_refs: ['ev-1'] },
      { field: 'source_type', statement: 'The document is of the recorded type.', evidence_refs: ['ev-1'] },
    ],
    inference: [
      { field: 'tier_estimate', statement: 'It belongs in tier 3.', from: ['ev-1'], method: 'Publisher class and document type compared against the tier definitions in data/taxonomy.json.' },
      { field: 'authority_class', statement: 'It was issued by no registered authority, so it is secondary.', from: ['ev-1'], method: 'The host is on no registered authority endpoint, and the document is a fixture.' },
    ],
    interpretation: [
      { field: 'relevance', statement: 'It bears on nothing, being a fixture.', held_by: 'fixture-agent', basis: 'The document does not exist.', contested: false },
    ],
    unresolved: [
      { field: null, question: 'Has anybody verified this candidate?', missing: 'A VerificationRecord checking the document against the statement it is offered for.', absence_kind: 'null_not_researched', blocks: true },
    ],
  },
});

export const verificationRecordFixture = () => envelope('VerificationRecord', {
  verification_id: 'ver-simulated-001',
  statement: 'A simulated statement, checked against a simulated document.',
  method: 'Read the named section of the retrieved document and compared its wording against the statement.',
  verdict: 'confirmed',
  confidence: 0.8,
  checked_at: AT,
  checked_by_kind: 'agent',
  checked_by: 'fixture-agent',
  document_id: 'SIMULATED-0000-000',
  source_tier: 'tier:1',
  supporting_location: { raw: 'section 1', article: null, paragraph: null, page: null },
  legal_status: 'entered_into_force',
  publication_date: '2026-01-02',
  entry_into_force_date: '2026-01-22',
  applicability_date: 'unknown',
  conflicting_evidence: [],
  residual_gap: null,
  supersedes: null,
  recheck_after: null,
  affected_entities: [{ kind: 'claim', id: 'simulated:claim', path: 'data/claims.json', field: null, note: null }],
  evidence: [simEvidence('ev-1')],
  epistemic: {
    fact: [
      { field: null, statement: 'The document states the proposition in the words quoted.', evidence_refs: ['ev-1'] },
      { field: 'document_id', statement: 'The document identifies itself as SIMULATED-0000-000.', evidence_refs: ['ev-1'] },
      { field: 'supporting_location', statement: 'The proposition is carried at section 1.', evidence_refs: ['ev-1'] },
      { field: 'publication_date', statement: 'The document states it was published on 2026-01-02.', evidence_refs: ['ev-1'] },
      { field: 'entry_into_force_date', statement: 'The document states it entered into force on 2026-01-22.', evidence_refs: ['ev-1'] },
    ],
    inference: [
      { field: 'verdict', statement: 'The statement is confirmed.', from: ['ev-1'], method: 'The quoted wording states the proposition without qualification.' },
      { field: 'legal_status', statement: 'The act is in force.', from: ['ev-1'], method: 'The simulated document uses entry-into-force wording and no applicability, repeal or annulment wording. Whether the stated date has arrived is not decided here: that answer would change with when the fixture is read.' },
      { field: 'source_tier', statement: 'The cited source is being treated as tier 1.', from: ['ev-1'], method: 'A fixture. Nothing was classified, because nothing exists to classify.' },
    ],
    interpretation: [],
    unresolved: [
      { field: 'applicability_date', question: 'From when does the simulated act apply?', missing: 'A stated application date. The simulated document gives none, and this fixture will not compute one.', absence_kind: 'unknown_not_determinable', blocks: false },
    ],
  },
});

export const claimEvidenceFixture = () => envelope('ClaimEvidence', {
  link_id: 'link-simulated-001',
  claim_id: 'simulated:claim',
  source_id: 'simulated:source',
  supports: 'supports:direct',
  role: 'official',
  locator: 'section 1',
  quote: 'This fixture quotes nothing, because it cites nothing that exists.',
  is_citation: true,
  established_by: 'ver-simulated-001',
  affected_entities: [{ kind: 'claim', id: 'simulated:claim', path: 'data/claims.json', field: null, note: null }],
  evidence: [simEvidence('ev-1')],
  epistemic: {
    fact: [{ field: null, statement: 'The source contains the quoted words at the stated locator.', evidence_refs: ['ev-1'] }],
    inference: [{ field: 'supports', statement: 'The source directly supports the claim.', from: ['ev-1'], method: 'The quoted wording states the claim\'s proposition rather than a narrower or adjacent one.' }],
    interpretation: [],
    unresolved: [],
  },
});

export const dataGapFixture = () => envelope('DataGap', {
  gap_id: 'gap-simulated-001',
  gap_kind: 'missing_source',
  absence_kind: 'null_not_researched',
  what_is_missing: 'The publication a simulated statement points at has not been located.',
  why_open: 'Nobody has looked for it yet.',
  closes_with: 'Locating the publication and confirming it says what the statement says it says.',
  candidate_leads: ['A fixture lead. Not evidence, and it has established nothing.'],
  blocking: true,
  first_seen_at: AT,
  last_reviewed_at: null,
  state: 'open',
  closed_by: null,
  affected_entities: [{ kind: 'claim', id: 'simulated:claim', path: 'data/claims.json', field: null, note: null }],
  evidence: [{
    evidence_id: 'ev-absent',
    kind: 'absent',
    source_id: null, url: null, locator: null, title: null, publisher: null,
    quote: null, retrieved_at: null, checksum: null,
    supports: null, role: 'unresolved', simulated: true,
  }],
  epistemic: {
    fact: [],
    inference: [],
    interpretation: [],
    unresolved: [{ field: null, question: 'Which publication does the statement point at?', missing: 'The publication itself, and a check that it says what the statement says it says.', absence_kind: 'null_not_researched', blocks: true }],
  },
});

export const architectureProposalFixture = () => envelope('ArchitectureProposal', {
  proposal_id: 'prop-arch-simulated-001',
  reason: 'A fixture. It proposes nothing that would be done.',
  confidence: 0.5,
  risk: 'low',
  autonomy_class: 'review_required',
  proposed_change: {
    summary: 'A simulated change to a simulated module.',
    operations: [{ op: 'modify', target: 'js/data.js', current: 'a simulated current state', proposed: 'a simulated proposed state', rationale: 'To have an operation in the fixture.' }],
    scope_note: 'Nothing. This is a fixture.',
  },
  validation_requirements: fourValidators,
  rollback_plan: rollback(),
  modules_affected: ['js/data.js'],
  invariants_touched: ['single_data_gateway'],
  dependency_impact: 'None. The dependency map in docs/CURRENT-ARCHITECTURE.md §9 is unchanged.',
  introduces_dependency: false,
  introduces_build_step: false,
  introduces_third_party_request: false,
  migration: null,
  performance_note: null,
  affected_entities: [{ kind: 'module', id: null, path: 'js/data.js', field: null, note: 'The single data gateway.' }],
  evidence: [simEvidence('ev-1', { kind: 'repository_file', url: null, locator: 'js/data.js', supports: 'supports:direct', role: 'primary', quote: null, retrieved_at: AT })],
  epistemic: {
    fact: [{ field: null, statement: 'js/data.js is the only module that fetches a dataset.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [{ field: null, question: 'Would this change anything a reader sees?', missing: 'A rendered comparison of the affected pages before and after.', absence_kind: 'null_not_researched', blocks: false }],
  },
});

export const editorialProposalFixture = () => envelope('EditorialProposal', {
  proposal_id: 'prop-ed-simulated-001',
  reason: 'A fixture. No prose would change.',
  confidence: 0.4,
  risk: 'medium',
  autonomy_class: 'review_required',
  proposal_kind: 'factual_update',
  editorial_state: 'fact',
  staleness: {
    kind: 'contradicted',
    quoted: 'a simulated sentence',
    changed_entity: 'simulated:record',
    changed_value: { old: 'simulated', new: 'simulated corrected' },
    how: 'the sentence contains the value that moved, verbatim',
    why: 'A fixture. Nothing was compared and nothing moved.',
  },
  proposed_change: {
    summary: 'A simulated correction to a simulated sentence.',
    operations: [{ op: 'modify', target: 'index.html#simulated-anchor', current: 'a simulated sentence', proposed: 'a simulated corrected sentence', rationale: 'To have an operation in the fixture.' }],
    scope_note: 'Does not touch any claim record.',
  },
  validation_requirements: fourValidators,
  rollback_plan: rollback(),
  prose_locations: [{ file: 'index.html', anchor: 'simulated-anchor', part_id: null, home: 'markup' }],
  claim_ids_affected: ['simulated:claim'],
  caveats_preserved: [],
  changes_what_a_claim_asserts: false,
  content_blob_checked: true,
  content_blob_divergence: 'Not examined for this fixture; a real proposal would say what differs, or that nothing does.',
  i18n_dispositions: [{ key: 'simulated.key', disposition: 'superseded', note: 'The three locale editions would otherwise assert the previous wording.' }],
  register_note: 'A fixture, in no register at all.',
  affected_entities: [{ kind: 'prose', id: null, path: 'index.html', field: 'simulated-anchor', note: null }],
  evidence: [simEvidence('ev-1', { supports: 'supports:partial' })],
  epistemic: {
    fact: [{ field: null, statement: 'The sentence currently reads as quoted.', evidence_refs: ['ev-1'] }],
    inference: [{ field: 'editorial_state', statement: 'The block is a simulated statement of fact.', from: ['simulated:claim'], method: 'A fixture. Nothing was read and nothing was derived.' }],
    interpretation: [{ field: 'register_note', statement: 'The proposed wording sits in the brief\'s register.', held_by: 'fixture-agent', basis: 'Comparison with the surrounding paragraphs.', contested: false }],
    unresolved: [{ field: null, question: 'Do the it/fr/es overlays carry a translation of the current wording?', missing: 'A read of i18n/locales.json for the affected key.', absence_kind: 'null_not_researched', blocks: false }],
  },
});

export const uxProposalFixture = () => envelope('UXProposal', {
  proposal_id: 'prop-ux-simulated-001',
  reason: 'A fixture. Nothing would be restyled.',
  confidence: 0.6,
  risk: 'low',
  autonomy_class: 'review_required',
  proposed_change: {
    summary: 'A simulated token, in both themes, declared on body.',
    operations: [{ op: 'add', target: 'css/tokens.css', current: null, proposed: '--simulated-token', rationale: 'To have an operation in the fixture.' }],
    scope_note: 'No component uses it.',
  },
  validation_requirements: fourValidators,
  rollback_plan: rollback(),
  /* A testable_proposal rather than a finding, because it is the
     heavier of the two shapes: the finding rules are refusals, and a
     fixture that took the lighter branch would leave four of them
     unexercised by `agent/schemas/cli.mjs check`. */
  proposal_kind: 'testable_proposal',
  finding_class: 'visual',
  severity: 'low',
  affected_journey: {
    id: 'simulated_journey',
    label: 'A simulated reader doing a simulated thing.',
    pages: ['index.html'],
    why: 'A fixture. No reader is affected by it, because nothing renders it.',
  },
  success_criterion: 'The simulated token resolves to a value in both themes, checked by node tools/design-qa.mjs reporting no undeclared custom property.',
  hypothesis: 'A fixture holds no belief about a reader. This string exists so the contract rule that a testable proposal states one is exercised rather than assumed.',
  success_metrics: [{ metric: 'Undeclared custom properties reported by design-qa.mjs', how_measured: 'node tools/design-qa.mjs', baseline: '0 errors, 5 warnings — docs/CURRENT-ARCHITECTURE.md §12.' }],
  regression_risks: [{ risk: 'A token declared in one theme only renders against the wrong palette in the other.', watch: 'node tools/design-qa.mjs, which errors on a theme-dependent token declared at :root.', mitigation: 'Both themes, on body, which is what declared_on already forces.' }],
  accessibility_checks: [{ check: 'Nothing about this fixture is conveyed by hue alone.', how: 'Nothing renders it, so there is nothing to convey.', tool: null }],
  browser_tests: [{ name: 'simulated', page: 'index.html', steps: ['Nothing is driven. This is a fixture.'], expected: 'Nothing.', harness: null }],
  tokens_used: ['--ink-0'],
  pages: ['index.html'],
  components: ['simulated-component'],
  tokens_added: [{ token: '--simulated-token', light: 'a simulated light value', dark: 'a simulated dark value', declared_on: 'body' }],
  status_conveyed_by_hue_alone: false,
  adds_third_party_asset: false,
  accessibility: {
    keyboard_reachable: true,
    accessible_name: true,
    contrast_checked: true,
    screen_reader_checked: false,
    note: 'No screen reader was used. The project has never been able to say otherwise, and this fixture does not pretend to.',
  },
  motion_note: null,
  affected_entities: [{ kind: 'stylesheet', id: null, path: 'css/tokens.css', field: null, note: null }],
  evidence: [simEvidence('ev-1', { kind: 'repository_file', url: null, locator: 'css/tokens.css', quote: null, supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'Theme-dependent tokens in this repository are declared on body.', evidence_refs: ['ev-1'] }],
    inference: [{ field: 'severity', statement: 'A fixture that renders nowhere reaches no reader, so it takes the lowest severity available.', from: ['ev-1'], method: 'The severity model in agent/ux/severity.mjs, run over a finding whose class is visual and whose journey touches nothing a reader can open.' }],
    interpretation: [{ field: 'hypothesis', statement: 'A fixture holds no belief about a reader; the string is there so the rule requiring one is exercised.', held_by: 'the fixture', basis: 'Nothing renders this proposal, so there is no reader to hold a belief about.', contested: false }],
    unresolved: [
      { field: null, question: 'How does the new token read to a screen-reader user?', missing: 'A screen-reader pass, which this project has never run.', absence_kind: 'null_not_researched', blocks: false },
      { field: null, question: 'What could the existing design system not hold, that this new token is needed for?', missing: 'Nothing: this is a fixture, and it adds a token so that the rule requiring a new token to be explained is exercised rather than assumed.', absence_kind: 'null_not_researched', blocks: false },
    ],
  },
});

export const implementationProposalFixture = () => envelope('ImplementationProposal', {
  proposal_id: 'prop-impl-simulated-001',
  reason: 'A fixture. No code would be written.',
  confidence: 0.7,
  risk: 'low',
  autonomy_class: 'autonomous',
  proposed_change: {
    summary: 'A simulated new validator in tools/.',
    operations: [{ op: 'add', target: 'tools/simulated-check.mjs', current: null, proposed: 'a simulated check', rationale: 'Adding a check is always safe; a check that fails is a finding.' }],
    scope_note: 'Adds a check. Changes no existing behaviour.',
  },
  validation_requirements: fourValidators,
  rollback_plan: rollback(),
  files: ['tools/simulated-check.mjs'],
  modules: [],
  new_dependencies: [],
  adds_build_step: false,
  adds_fetch_call: false,
  fetch_modules: [],
  tests_added: [{ file: 'agent/schemas/selftest.mjs', covers: 'That the simulated check reports what it says it reports.', command: 'node --test agent/schemas/selftest.mjs' }],
  validator_impact: {
    baseline_ref: 'docs/CURRENT-ARCHITECTURE.md §12',
    expected_new_errors: 0,
    expected_new_warnings: 0,
    justification: null,
  },
  affected_entities: [{ kind: 'tool', id: null, path: 'tools/simulated-check.mjs', field: null, note: null }],
  evidence: [simEvidence('ev-1', { kind: 'validator_output', url: null, locator: 'node tools/validate.mjs', quote: '0 errors', supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'tools/validate.mjs currently reports 0 errors.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [],
  },
});

export const qaResultFixture = () => envelope('QAResult', {
  qa_id: 'qa-simulated-001',
  target_kind: 'proposal',
  target_id: 'prop-impl-simulated-001',
  ran_at: AT,
  ran_by: 'fixture-agent',
  environment: 'a simulated environment',
  checks: [
    { name: 'data integrity', command: 'node tools/validate.mjs', exit_code: 0, errors: 0, warnings: 0, baseline_errors: 0, baseline_warnings: 0, new_findings: [], output_excerpt: 'ERRORS 0' },
    { name: 'markup and stylesheets', command: 'node tools/design-qa.mjs', exit_code: 0, errors: 0, warnings: 5, baseline_errors: 0, baseline_warnings: 5, new_findings: [], output_excerpt: '0 errors, 5 warnings' },
  ],
  verdict: 'pass',
  blocking_findings: [],
  affected_entities: [{ kind: 'contract', id: 'prop-impl-simulated-001', path: null, field: null, note: null }],
  evidence: [simEvidence('ev-1', { kind: 'validator_output', url: null, locator: 'node tools/design-qa.mjs', quote: '0 errors, 5 warnings', supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'design-qa reported 0 errors and the same 5 warnings as the baseline.', evidence_refs: ['ev-1'] }],
    inference: [{ field: 'verdict', statement: 'The checks pass.', from: ['ev-1'], method: 'Every check returned 0 errors and no warning count above its baseline.' }],
    interpretation: [],
    unresolved: [{ field: null, question: 'Do the validators read the prose?', missing: 'Nothing — they do not, and a false statement in index.html passes every check in this repository.', absence_kind: 'unknown_not_determinable', blocks: false }],
  },
});

export const approvalRequestFixture = () => envelope('ApprovalRequest', {
  approval_id: 'appr-simulated-001',
  proposal_ids: ['prop-ed-simulated-001'],
  tier: 'amber',
  requested_of: 'the author',
  why_human_required: 'It changes prose a claim record is attached to, which is amber under docs/AI-SAFE-BOUNDARIES.md §2.',
  what_to_check: [
    'That the proposed sentence says what the cited source says.',
    'That the inline __CONTENT__ blob and data/brief.json are both accounted for.',
    'That the affected locale key is declared superseded rather than silently dropped.',
  ],
  risk_if_wrong: 'high',
  consequence_if_wrong: 'A reader would act on a sentence that its source does not support.',
  expires_at: null,
  state: 'requested',
  decision: null,
  affected_entities: [{ kind: 'prose', id: null, path: 'index.html', field: 'simulated-anchor', note: null }],
  evidence: [simEvidence('ev-1', { kind: 'agent_output', url: null, locator: 'prop-ed-simulated-001', quote: null, supports: 'supports:partial', role: 'secondary' })],
  epistemic: {
    fact: [{ field: null, statement: 'The proposal named exists and is in this state.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [{ field: null, question: 'Will the author agree the wording is a correction rather than an edit to the argument?', missing: 'Their answer.', absence_kind: 'null_not_researched', blocks: true }],
  },
});

export const agentObservationFixture = () => envelope('AgentObservation', {
  observation_id: 'obs-simulated-001',
  subject: 'the simulated corpus',
  summary: 'A fixture observation about nothing.',
  data: { simulated: true, counted: 0 },
  confidence: 0.9,
  risk: 'none',
  refs: ['cand-simulated-001'],
  supersedes: null,
  affected_entities: [{ kind: 'dataset', id: null, path: 'data/claims.json', field: null, note: null }],
  evidence: [simEvidence('ev-1', { kind: 'measurement', url: null, locator: 'a simulated count', quote: null, supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'Nothing was counted, because nothing was read.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [],
  },
});

export const agentRunFixture = () => envelope('AgentRun', {
  run_id: RUN,
  parent_run_id: null,
  task: 'A simulated run that did nothing.',
  started_at: AT,
  ended_at: '2026-09-01T09:00:05.000Z',
  status: 'ok',
  inputs: { simulated: true },
  outputs: { simulated: true },
  produced: [{ contract: 'AgentObservation', id: 'obs-simulated-001' }],
  autonomy_class: 'autonomous',
  confidence: 0.8,
  risk: 'none',
  handed_off_to: [],
  trace_ref: { trace_id: TRACE, span_id: RUN, run_id: RUN },
  affected_entities: [],
  evidence: [simEvidence('ev-1', { kind: 'measurement', url: null, locator: 'the simulated run', quote: null, supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'The run started and ended at the times recorded.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [],
  },
});

export const changeRecordFixture = () => envelope('ChangeRecord', {
  change_id: 'chg-simulated-001',
  proposal_id: 'prop-impl-simulated-001',
  approval_id: null,
  qa_result_id: 'qa-simulated-001',
  files: [{ path: 'tools/simulated-check.mjs', operation: 'add', lines_added: 1, lines_removed: 0, sha256_before: null, sha256_after: null }],
  diff_summary: 'Adds a simulated check that exists nowhere.',
  touched_legal_record: false,
  state: 'applied',
  branch: 'claude/simulated-branch',
  commit: null,
  applied_at: AT,
  applied_by: 'fixture-agent',
  reversible: true,
  rollback_method: 'git_revert',
  rollback_ref: null,
  affected_entities: [{ kind: 'tool', id: null, path: 'tools/simulated-check.mjs', field: null, note: null }],
  evidence: [simEvidence('ev-1', { kind: 'agent_output', url: null, locator: 'qa-simulated-001', quote: null, supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'The QA result for this change reports a pass.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [],
  },
});

export const websiteChangeFixture = () => envelope('WebsiteChange', {
  website_change_id: 'wc-simulated-001',
  change_record_id: 'chg-simulated-001',
  pages: ['index.html'],
  reader_visible: true,
  legal_fact_touched: true,
  summary: 'A simulated correction a reader would supposedly see, on a page nothing changed.',
  source_candidate_ids: [],
  verification_ids: ['ver-simulated-001'],
  proposal_ids: ['prop-ed-simulated-001'],
  approval_ids: ['appr-simulated-001'],
  qa_result_ids: ['qa-simulated-001'],
  chain_gaps: [{ link: 'source', why_missing: 'No source candidate was recorded for this fixture. The gap is named rather than left as an empty array nobody notices.' }],
  deployment: 'pushed',
  commit: '0000000000000000000000000000000000000000',
  deployed_at: null,
  affected_entities: [{ kind: 'prose', id: null, path: 'index.html', field: 'simulated-anchor', note: null }],
  evidence: [simEvidence('ev-1', { kind: 'agent_output', url: null, locator: 'chg-simulated-001', quote: null, supports: 'supports:direct', role: 'primary' })],
  epistemic: {
    fact: [{ field: null, statement: 'The change record named holds the file list for this change.', evidence_refs: ['ev-1'] }],
    inference: [],
    interpretation: [],
    unresolved: [{ field: null, question: 'Has the push actually reached the public site?', missing: 'A read of the deployed page, which this environment cannot reach.', absence_kind: 'unknown_not_determinable', blocks: false }],
  },
});

/** Every fixture, keyed by contract name. */
export const dataProposalFixture = () => envelope('DataProposal', {
  proposal_id: 'prop-data-simulated-001',
  reason: 'A simulated verification read a simulated document and the claim it bears on cites nothing external. This fixture proposes attaching the one to the other, and nothing else.',
  confidence: 0.6,
  risk: 'medium',
  autonomy_class: 'review_required',
  proposed_change: {
    summary: 'Add one source reference to one claim in data/claims.json.',
    operations: [{
      op: 'add',
      target: 'data/claims.json claims[simulated:claim].sources[]',
      current: null,
      proposed: '{ "source_id": "simulated:source", "supports": "supports:direct", "locator": "section 1" }',
      rationale: 'The verification read the passage at the stated locator and it states the claim\'s proposition.',
    }],
    scope_note: 'It does not touch the claim\'s statement, its type, its verification_note or any existing source reference.',
  },
  validation_requirements: fourValidators,
  rollback_plan: rollback(),
  dataset: 'data/claims.json',
  record_kind: 'claim',
  record_id: 'simulated:claim',
  operation_kind: 'attach_evidence',
  existing_search: null,
  preserves_record_id: true,
  provenance_disposition: [
    { field: 'last_verified', disposition: 'unchanged', current: '2026-08-27', why: 'This fixture attaches evidence; it does not assert that the record was re-read on a new date.' },
    { field: 'verification_note', disposition: 'unchanged', current: 'A simulated note.', why: 'The note describes what is still open, and attaching one source does not close it.' },
  ],
  substantive: false,
  verification_refs: ['ver-simulated-001'],
  prose_anchor: null,
  retrieved_and_read: true,
  supersedes: null,
  affected_entities: [{ kind: 'claim', id: 'simulated:claim', path: 'data/claims.json', field: 'sources', note: 'The claim the evidence would be attached to.' }],
  evidence: [simEvidence('ev-1')],
  epistemic: {
    fact: [{ field: null, statement: 'data/claims.json carries a record with this id, and its sources array does not already contain this source_id.', evidence_refs: ['ev-1'] }],
    inference: [{ field: 'substantive', statement: 'Adding a source reference does not change what the claim asserts; it changes what the claim can be shown to rest on.', from: ['ev-1'], method: 'The operation adds an entry to sources[] and touches no other field. The claim\'s statement, type and verification_note are unchanged, and the evidence grade is derived at render time rather than stored, so nothing is written that could disagree with it.' }],
    interpretation: [],
    unresolved: [{ field: null, question: 'Does the source support the whole of the claim or only part of it?', missing: 'A reading of the claim against the passage by a human. This fixture asserts nothing about a real document.', absence_kind: 'null_not_researched', blocks: false }],
  },
});

export const regulatoryChangeFixture = () => envelope('RegulatoryChange', {
  change_id: 'chg-simulated-001',
  change_kind: 'APPLICABLE',
  attribute: 'legislative_status',
  old_value: 'status:in-force',
  new_value: 'shall apply from 2 August 2101',
  source_snapshot: {
    previous_verification_id: 'ver-simulated-000',
    previous_checksum: 'a'.repeat(64),
    current_checksum: 'b'.repeat(64),
    bytes_changed: true,
    note: 'The two retrievals hash differently, so the document changed. This repository stores no document bodies, so that says THAT it changed and never where.',
  },
  materiality: 'reader_acts_on_it',
  confidence: 0.6,
  affected_datasets: ['data/instruments.json', 'data/timeline.json'],
  affected_pages: ['instrument.html', 'instruments.html'],
  autonomy_class: 'review_required',
  detected_at: AT,
  as_of: '2026-09-01',
  supersedes: null,
  affected_entities: [{ kind: 'instrument', id: 'simulated:instrument', path: 'data/instruments.json', field: 'legislative_status', note: 'The act whose state the simulated document places differently.' }],
  evidence: [simEvidence('ev-1')],
  epistemic: {
    fact: [
      { field: 'new_value', statement: 'The simulated document states that the act shall apply from a stated date.', evidence_refs: ['ev-1'] },
      { field: 'old_value', statement: 'The simulated instrument record carries status:in-force.', evidence_refs: ['ev-1'] },
      { field: 'source_snapshot', statement: 'The two retrievals of the simulated document hash differently.', evidence_refs: ['ev-1'] },
    ],
    inference: [
      { field: 'change_kind', statement: 'An act recorded as in force is stated by the document to apply.', from: ['ev-1'], method: 'The transition table in agent/detector/classify.mjs: entered_into_force to applicable is APPLICABLE. A fixture; nothing was classified because nothing was read.' },
      { field: 'materiality', statement: 'A reader who believes an act does not yet apply to them may act two years late.', from: ['ev-1'], method: 'The attribute is one a reader changes their behaviour because of — whether an act binds them — so the level is reader_acts_on_it rather than substantive. Stated in agent/detector/materiality.mjs as a rule about which attributes those are, not as a lookup on the change kind.' },
      { field: 'affected_pages', statement: 'Two pages render an instrument\'s legislative status.', from: ['ev-1'], method: 'Derived from the datasets each page\'s modules load, read out of the loadAll call sites rather than from a list kept by hand.' },
    ],
    interpretation: [],
    unresolved: [{ field: null, question: 'From which date does the simulated act apply?', missing: 'A stated application date read from the document. This fixture asserts nothing about a real act.', absence_kind: 'null_not_researched', blocks: false }],
  },
});

export const impactAssessmentFixture = () => envelope('ImpactAssessment', {
  assessment_id: 'imp-simulated-001',
  change_id: 'chg-simulated-001',
  depth: 2,
  roots: ['simulated:event'],
  unresolved_roots: [],
  datasets_reached: ['data/timeline.json', 'data/applicability.json', 'data/claims.json'],
  surfaces: [
    {
      surface: 'timeline',
      label: null,
      records: ['simulated:event'],
      modules: [],
      pages: [],
      note: 'The changed record itself. A simulated event; nothing here is about a real act.',
    },
    {
      surface: 'compliance_calendar',
      label: null,
      records: ['simulated:event'],
      modules: ['js/calendar.js'],
      pages: ['index.html'],
      note: 'The calendar renders the same events through a horizon filter compared against the reader\'s own clock, so which of them a reader is shown is not a property of this assessment.',
    },
    {
      surface: 'applicability',
      label: null,
      records: ['simulated:rule'],
      modules: ['js/applies.js'],
      pages: ['applies.html'],
      note: 'A simulated rule cites the simulated event as one of its dates.',
    },
  ],
  factual: [
    {
      node_id: 'simulated:rule',
      kind: 'applicability_rule',
      dataset: 'data/applicability.json',
      field: 'dates',
      field_class: 'reference',
      depth: 1,
      route: 'propagates_by_derivation',
      automatically_actionable: true,
      why: 'The rule points at the event rather than restating its date, and this site derives at render time — so once the event is corrected there is nothing to edit here. A fixture; no rule was read.',
      quote: null,
      governance_permit: null,
    },
  ],
  editorial: [
    {
      node_id: 'simulated:event',
      kind: 'timeline_event',
      dataset: 'data/timeline.json',
      field: 'supersedes',
      field_class: 'prose',
      depth: 0,
      route: 'review_proposal',
      automatically_actionable: false,
      why: 'Editorial: nothing in this repository reads the sentence, and GOVERNANCE_PERMITS is empty. A fixture, and it asserts nothing about any act.',
      quote: 'Originally a simulated date; deferred in this fixture.',
      governance_permit: null,
    },
  ],
  open_questions: [
    {
      node_id: 'simulated:rule',
      field: 'rationale',
      question: 'Does the simulated rule\'s rationale still read true after this simulated change?',
      missing: 'The old value does not appear in the sentence, so nothing establishes that it is stale — and nothing here reads prose, so nothing clears it either.',
    },
  ],
  counts: {
    reached_records: 2,
    factual_impacts: 1,
    editorial_impacts: 1,
    open_questions: 1,
    automatically_actionable: 1,
    review_proposals_required: 1,
  },
  autonomy_class: 'review_required',
  assessed_at: AT,
  caveats: [
    'Walked to depth 2. Anything further from the change than that is outside this map by construction.',
    'index.html renders part of its content from the inlined window.__CONTENT__ blob rather than from data/brief.json, so which of the two homes a stale sentence lives in is not answered here.',
    'A fixture. Every record is marked simulated and none of it is a legal fact.',
  ],
  affected_entities: [
    { kind: 'timeline_event', id: 'simulated:event', path: 'data/timeline.json', field: 'date', note: 'The simulated record the change is about.' },
    { kind: 'applicability_rule', id: 'simulated:rule', path: 'data/applicability.json', field: 'dates', note: 'A simulated record that depends on it.' },
  ],
  evidence: [simEvidence('ev-1')],
  epistemic: {
    fact: [],
    inference: [
      { field: 'datasets_reached', statement: 'Three simulated datasets carry a record depending on the simulated change.', from: ['ev-1'], method: 'Walked inbound through the corpus dependency graph in agent/detector/graph.mjs, whose edges are derived from the ids the records hold rather than from a table of which field references what. A fixture: nothing was walked.' },
      { field: 'surfaces', statement: 'Three surfaces of the site are reached.', from: ['ev-1'], method: 'Which module renders which entity kind is read from the js/data.js index keys and the db reads in each module, and which page runs which module from the <script src> entry points and their static imports. A fixture.' },
    ],
    interpretation: [],
    unresolved: [{ field: null, question: 'Does the simulated rule\'s rationale still read true?', missing: 'A human reading the sentence. Nothing in this repository reads prose.', absence_kind: 'unknown_not_determinable', blocks: false }],
  },
});

/* ------------------------------------------------------------------
   KnowledgeGap — SESSION 11.

   The fixture is deliberately a gap the corpus LEANS on: a simulated
   instrument whose simulated applicability rule says it applies, and
   which no simulated institution supervises. A fixture that named a
   record nothing depends on would demonstrate the wrong thing —
   the load-bearing rule is the whole contract.                     */

export const knowledgeGapFixture = () => envelope('KnowledgeGap', {
  gap_id: 'kg-simulated-001',
  gap_kind: 'missing_competence',
  absence_kind: 'null_not_researched',
  missing_concept: 'No institution in the simulated corpus holds a supervisory or enforcement role for the simulated instrument, so the question "who enforces this" has no answer in the model.',
  why_it_matters: 'A simulated applicability rule tells a simulated reader that the instrument applies to them. The corpus can say that and cannot say who would enforce it, which is the half a reader acts on. Argued from what the corpus does with the missing thing, not from how many records share the finding.',
  candidate_evidence: [{
    kind: 'corpus_record',
    where: 'simulated:rule',
    what_it_would_establish: 'Which authority the simulated rule already names, if any — a place to look, and nothing more.',
    retrieved: false,
  }],
  confidence: 0.6,
  recommended_data_location: {
    dataset: 'data/institutions.json',
    container: 'institutions[].competences',
    field: 'instrument',
    shape_exists: true,
    why_here: 'Competence is an edge from an institution to an instrument and has exactly one home. Recording a supervisor field on the instrument would be the second copy the architecture exists to prevent.',
  },
  impact: 'reader_finds_nothing',
  autonomy_class: 'human_only',
  as_of: '2026-09-01',
  affected_entities: [
    { kind: 'instrument', id: 'simulated:instrument', path: 'data/instruments.json', field: null, note: 'A fixture instrument. Not an act.' },
  ],
  evidence: [{
    evidence_id: 'ev-demand',
    kind: 'dataset_record',
    source_id: null, url: null,
    locator: 'data/applicability.json#simulated:rule',
    title: null, publisher: null,
    quote: null, retrieved_at: null, checksum: null,
    /* What a dataset_record entry supports is a proposition about
       THE CORPUS — "this rule exists and names no authority" — and
       never a proposition about EU law. The record states that
       directly, so the qualifier is direct; it establishes nothing
       whatever about what the law requires. */
    supports: 'supports:direct', role: 'unresolved', simulated: true,
  }],
  epistemic: {
    fact: [],
    inference: [
      { field: 'missing_concept', statement: 'No competence edge in the simulated corpus names the simulated instrument.', from: ['ev-demand'], method: 'Indexed every competence entry by the instrument it names and looked the instrument up. A fixture: nothing was indexed.' },
    ],
    interpretation: [],
    unresolved: [{ field: null, question: 'Which authority actually supervises it?', missing: 'The article of the act that designates a competent authority, read from the act itself.', absence_kind: 'null_not_researched', blocks: false }],
  },
});

export const FIXTURES = {
  SourceCandidate: sourceCandidateFixture,
  VerificationRecord: verificationRecordFixture,
  ClaimEvidence: claimEvidenceFixture,
  ChangeRecord: changeRecordFixture,
  DataGap: dataGapFixture,
  ArchitectureProposal: architectureProposalFixture,
  EditorialProposal: editorialProposalFixture,
  UXProposal: uxProposalFixture,
  ImplementationProposal: implementationProposalFixture,
  QAResult: qaResultFixture,
  ApprovalRequest: approvalRequestFixture,
  AgentObservation: agentObservationFixture,
  AgentRun: agentRunFixture,
  WebsiteChange: websiteChangeFixture,
  DataProposal: dataProposalFixture,
  RegulatoryChange: regulatoryChangeFixture,
  ImpactAssessment: impactAssessmentFixture,
  KnowledgeGap: knowledgeGapFixture,
};
