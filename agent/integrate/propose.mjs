/* ============================================================
   agent/integrate/propose.mjs — the proposal objects, built so their
   fields and their epistemic block cannot disagree

   SESSION 08: "Any proposed factual modification must first become a
   proposal object." This module is where one does.

   THE BUILDER IS THE VERIFIER'S. `RecordBuilder` sets a value and
   the epistemic entry that justifies it in one call, so a factual
   field cannot be written without its citation and `null` cannot be
   confused with `"unknown"`. It lives in agent/verifier/build.mjs
   and is imported rather than copied: a second builder in this
   directory would be a second set of rules about how a record is
   assembled, and the two would drift.

   FOUR VALIDATORS ON EVERY PROPOSAL. agent/schemas/validate.mjs
   refuses a proposal touching data/, js/, css/, i18n/, tools/ or any
   .html whose validation_requirements omits one of them. Every
   DataProposal touches data/ by definition, so all four are here,
   with the baseline each is measured against — a new warning is a
   finding, not noise, and a proposal that does not say what it
   expects cannot be held to it afterwards.

   AND THE APPROVAL IS NOT A FORMALITY. `ApprovalRequest.what_to_check`
   is an array of things a human is actually being asked to do.
   "Please review" delegates the thinking back to the person least
   able to reconstruct what the agent was standing on, and the
   contract refuses it.
   ============================================================ */

import { RecordBuilder } from '../verifier/build.mjs';
import { REQUIRED_VALIDATORS } from '../schemas/types.mjs';

export const INTEGRATOR_AGENT = 'verification-integrator';

/** The four, with the recorded baseline each is measured against.
   Built from REQUIRED_VALIDATORS so a validator added to that list
   cannot be silently missing here. */
const BASELINE = {
  'tools/validate.mjs': {
    check: 'data integrity',
    expected: '0 errors, and the same 106 unverified records as the docs/CURRENT-ARCHITECTURE.md §12 baseline. A change in that count is the finding, whichever direction it moves.',
    why: 'Referential integrity, duplicate ids across every dataset, duplicate canonical facts, and the status-model rules. It is what catches a source_id that resolves to nothing and an id that collides with one already in use.',
  },
  'tools/i18n-audit.mjs': {
    check: 'locale register against the live DOM',
    expected: '0 errors, 0 warnings.',
    why: 'A data change that alters a string carrying a data-i18n key leaves three locale editions asserting the superseded English. This proposal touches no prose, and this check is what proves that rather than asserts it.',
  },
  'tools/design-qa.mjs': {
    check: 'markup and stylesheets',
    expected: '0 errors and the same 5 warnings recorded in docs/CURRENT-ARCHITECTURE.md §12, by file and line. A sixth is a finding.',
    why: 'It fails on a third-party resource and on footer drift. A data-only change should move nothing here, and a movement would mean the change was not data-only.',
  },
  'tools/freshness.mjs': {
    check: 'freshness, against a stated as-of date',
    expected: 'Run with an explicit date argument, not the default. Nothing past its stated interval, or the same items as before the change.',
    why: 'Attaching evidence does not make a record fresher. If this run changes a freshness figure, something set a verification date it had no business setting.',
  },
};

export const FOUR_VALIDATORS = REQUIRED_VALIDATORS.map((command) => ({
  command: `node ${command}`,
  ...BASELINE[command],
}));

/** A rollback plan for a change that adds or edits one entry in one
 *  JSON file. `git_revert` is honest here: the repository has no
 *  other rollback path, and audit F-06 records that `git blame`
 *  answers nothing before SESSION 00 — these commits are the first
 *  real provenance it has. */
export const ROLLBACK = (what) => ({
  method: 'git_revert',
  steps: [
    `git revert the commit that applied ${what}, on the working branch`,
    'run the four validators and compare against the docs/CURRENT-ARCHITECTURE.md §12 baseline',
    'confirm the affected record renders as it did before, and that no other record moved',
  ],
  verification: 'The four validators return to their recorded baseline output, the record carries exactly the fields it carried before, and the unverified-record count is unchanged.',
  irreversible_reason: null,
});

export function builderFor(contract, { span, now, simulated }) {
  return new RecordBuilder({ contract, agent: INTEGRATOR_AGENT, now, span, simulated });
}

/**
 * The evidence entry every record this layer produces stands on: the
 * canonical record itself, read from data/.
 *
 * Its kind is `dataset_record` and its supports is `supports:direct`
 * — it directly establishes what the corpus currently says, which is
 * the only thing this layer read it for. It does NOT establish
 * anything about EU law, and no record here cites it for that.
 */
export const datasetEvidence = (id, { path, locator, quote = null, simulated }) => ({
  evidence_id: id,
  kind: 'dataset_record',
  source_id: null,
  url: null,
  locator: `${path} ${locator}`,
  title: null,
  publisher: null,
  quote,
  retrieved_at: null,
  checksum: null,
  supports: 'supports:direct',
  role: 'primary',
  simulated,
});

/**
 * The evidence entry for a verification this layer is acting on —
 * another agent's contract record, cited as one.
 *
 * `supports:context` is deliberate and it is not a hedge: the
 * VerificationRecord establishes what the Verifier concluded, not
 * what the document says. What the document says is carried by the
 * retrieved_document entry copied across beside it, which is the
 * entry a fact may cite.
 */
export const verificationEvidence = (id, verification, { simulated }) => ({
  evidence_id: id,
  kind: 'agent_output',
  source_id: null,
  url: null,
  locator: `VerificationRecord ${verification.verification_id}`,
  title: null,
  publisher: null,
  quote: null,
  retrieved_at: verification.checked_at ?? null,
  checksum: null,
  supports: 'supports:context',
  role: 'secondary',
  simulated,
});

/** The retrieved-document entry from a verification, carried across
 *  unchanged so a fact in this record cites the document rather than
 *  the record about the document. Never rewritten: a quote that was
 *  paraphrased on the way across is a quote of nothing. */
export const carriedDocumentEvidence = (id, ref, { simulated }) => ({
  ...ref,
  evidence_id: id,
  simulated,
});

/**
 * An ApprovalRequest over a set of proposals.
 *
 * `what_to_check` is written by the caller, item by item, because
 * what a human must check differs per proposal and a generic list
 * would be the "please review" the contract exists to refuse.
 */
export function approvalOver({ builder, approval_id, proposal_ids, tier, requested_of, why, what_to_check, risk, consequence, expires_at = null }) {
  builder.set('approval_id', approval_id);
  builder.set('proposal_ids', proposal_ids);
  builder.set('tier', tier);
  builder.set('requested_of', requested_of);
  builder.set('why_human_required', why);
  builder.set('what_to_check', what_to_check);
  builder.set('risk_if_wrong', risk);
  builder.set('consequence_if_wrong', consequence);
  builder.set('expires_at', expires_at);
  builder.set('state', 'requested');
  builder.set('decision', null);
  return builder;
}
