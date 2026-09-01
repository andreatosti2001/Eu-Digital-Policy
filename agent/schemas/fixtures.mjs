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
const simEvidence = (id, over = {}) => ({
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
  checked_at: AT,
  checked_by_kind: 'agent',
  checked_by: 'fixture-agent',
  residual_gap: null,
  supersedes: null,
  recheck_after: null,
  affected_entities: [{ kind: 'claim', id: 'simulated:claim', path: 'data/claims.json', field: null, note: null }],
  evidence: [simEvidence('ev-1')],
  epistemic: {
    fact: [{ field: null, statement: 'The document states the proposition in the words quoted.', evidence_refs: ['ev-1'] }],
    inference: [{ field: 'verdict', statement: 'The statement is confirmed.', from: ['ev-1'], method: 'The quoted wording states the proposition without qualification.' }],
    interpretation: [],
    unresolved: [],
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
  proposed_change: {
    summary: 'A simulated correction to a simulated sentence.',
    operations: [{ op: 'modify', target: 'index.html#simulated-anchor', current: 'a simulated sentence', proposed: 'a simulated corrected sentence', rationale: 'To have an operation in the fixture.' }],
    scope_note: 'Does not touch any claim record.',
  },
  validation_requirements: fourValidators,
  rollback_plan: rollback(),
  prose_locations: [{ file: 'index.html', anchor: 'simulated-anchor', part_id: null }],
  claim_ids_affected: ['simulated:claim'],
  changes_what_a_claim_asserts: false,
  content_blob_checked: true,
  content_blob_divergence: 'Not examined for this fixture; a real proposal would say what differs, or that nothing does.',
  i18n_dispositions: [{ key: 'simulated.key', disposition: 'superseded', note: 'The three locale editions would otherwise assert the previous wording.' }],
  register_note: 'A fixture, in no register at all.',
  affected_entities: [{ kind: 'prose', id: null, path: 'index.html', field: 'simulated-anchor', note: null }],
  evidence: [simEvidence('ev-1', { supports: 'supports:partial' })],
  epistemic: {
    fact: [{ field: null, statement: 'The sentence currently reads as quoted.', evidence_refs: ['ev-1'] }],
    inference: [],
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
    inference: [],
    interpretation: [],
    unresolved: [{ field: null, question: 'How does the new token read to a screen-reader user?', missing: 'A screen-reader pass, which this project has never run.', absence_kind: 'null_not_researched', blocks: false }],
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
};
