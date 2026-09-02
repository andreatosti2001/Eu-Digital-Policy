/* ============================================================
   DataProposal — a proposed factual modification to a canonical
   dataset record

   THE FIFTEENTH CONTRACT, AND WHY THERE HAD TO BE ONE. SESSION 08
   requires that any proposed factual modification first become a
   proposal object. The fourteen had no home for one: an
   `EditorialProposal` is a change to the brief's prose, an
   `ImplementationProposal` is a change to code and would have
   recorded an edit to data/claims.json under `files` and `modules`.
   That validates and it is dishonest — it files a change to what the
   site says about EU law as a change to a script. The reasoning, and
   what was considered and rejected, is in
   docs/VERIFICATION-INTEGRATION.md.

   WHAT THIS CONTRACT IS FOR. A Legal Verifier produces a
   VerificationRecord: this proposition, checked against this
   document, with this verdict. Nothing in that record touches
   data/. Getting from one to the other is a separate act with its
   own burden, and this is the shape of it.

   THREE OF THIS REPOSITORY'S RULES ARE STATED HERE AS CHECKS.

   1. FIND THE EXISTING RECORD FIRST. `existing_search` is required
      before either `create_` kind, and it is not a boolean: it names
      the strategies that were run, the closest record they found,
      and why that one is not this one. A duplicate source record
      does not announce itself later — it just quietly becomes a
      second home for a document that already had one.

   2. THE ID AND THE PROVENANCE SURVIVE. `preserves_record_id` must
      be true wherever a record already exists, and every provenance
      field the proposal touches carries a stated disposition. The
      vocabulary has no word for removing one, because removing an
      asterisk, a reference gap, a `requires_verification` flag or a
      `verification_note` is red tier (AI-SAFE-BOUNDARIES §3).

   3. A SUBSTANTIVE LEGAL CHANGE IS NEVER MERGED AUTOMATICALLY.
      `substantive` forces `human_only`, and `auto_merge`,
      `apply_automatically`, `merged` and `applied` are forbidden
      fields answered with the objection rather than "unknown field".
      A proposal does not record its own landing: that is a
      ChangeRecord, behind an ApprovalRequest.

   SESSION 12 ADDED A FOURTH BURDEN, TO ONE KIND.
   `create_taxonomy_term` proposes a term into data/taxonomy.json —
   the enum authority every other dataset resolves against, whose ids
   are never renamed. Its class is FORCED to human_only rather than
   checked against what the agent claimed, its dimension must be one
   the file actually carries, and the find-it-first search above
   applies to it unchanged: a term added without looking becomes a
   second word for something the vocabulary already says. It was made
   a kind rather than a nineteenth contract because the burden is
   precisely this contract's burden; the reasoning is in
   agent/schemas/types.mjs beside TAXONOMY_OPERATION_KIND.

   WHAT IS NOT HERE. No `new_value` shortcut beside
   `proposed_change.operations` — the operations array is the one
   home for what would change, and a second copy would be a second
   thing to be wrong. No `confidence_that_it_is_true`: the confidence
   field the twelve already require is how much the proposing agent
   is standing on, and a probability that a legal fact is true is not
   an agent's to state. No `grade`, no `tier` — both derived or
   settled elsewhere, on the same reasoning ClaimEvidence gives.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';
import { DATA_OPERATION_KINDS, PROVENANCE_DISPOSITIONS, LEGAL_ENTITY_KINDS, taxonomy } from '../types.mjs';

/* Every kind that brings a record into existence carries the
   find-it-first burden below. `create_taxonomy_term` is in the list
   for exactly the reason the other two are: a term added without
   looking becomes a second word for something the vocabulary already
   says, and data/taxonomy.json is what every other dataset resolves
   against. */
const CREATE_KINDS = ['create_source', 'create_claim', 'create_taxonomy_term'];

/** The dimensions data/taxonomy.json actually has, read from the file
 *  rather than listed here. A proposal naming a dimension the enum
 *  authority does not carry is proposing a term into nothing, and
 *  copying the list of dimensions into this contract would be the
 *  second home the whole architecture exists to prevent. */
const taxonomyDimensions = () => Object.keys(taxonomy()).filter((k) => Array.isArray(taxonomy()[k]));

export const DataProposal = defineProposal({
  name: 'DataProposal',
  doc: 'A proposed change to a record in data/*.json — attaching evidence, creating a source or a claim, amending a field, or annotating one — with the search for the existing record that was done first, what becomes of its provenance, and whether it is substantive enough that only a human may author it.',
  fields: {
    dataset: F.string('The dataset this touches, as a repository path — "data/claims.json". A path rather than an enum of the ten filenames, because which datasets exist is a fact about the data/ directory and copying the list here would give it a second home.'),
    record_kind: F.enum(LEGAL_ENTITY_KINDS, 'What sort of canonical record this is about. Every value here is a legal-record kind, which is why no DataProposal can be autonomous: validate.mjs refuses that class outright for these.'),
    record_id: F.string('The canonical id of the record being changed, exactly as data/ carries it. Null only when proposing to create one — and then the search that failed to find an existing one is mandatory.', { nullable: true }),
    operation_kind: F.enum(DATA_OPERATION_KINDS, 'What this would do. The burden the rules below impose follows from this field rather than from the prose description, which an agent could word its way past.'),

    /* ---- find the existing record before creating a new one ---- */

    existing_search: F.object({
      performed: F.bool('Whether the canonical dataset was actually searched before this proposed to create a record in it.'),
      strategies: F.array(F.string('One match strategy, by name — "source_id", "celex", "normalised_url", "title_and_publisher".'), 'Which strategies were run. Naming them is what lets a reviewer tell a search that could have found the record from one that could not.', { min: 1 }),
      candidates_considered: F.int('How many existing records were compared.', { min: 0 }),
      best_candidate_id: F.string('The closest existing record found, where there was one.', { nullable: true }),
      best_score: F.ratio('How close it was, on the matcher\'s own scale. Never a probability that they are the same document.', { nullable: true }),
      why_not_that_one: F.text('Why the closest existing record is not this one. Required whenever one was found — "it scored below the threshold" is a number, not a reason.', { nullable: true }),
    }, 'The search for an existing record, done before proposing a new one. Null only where nothing would be created.', { nullable: true, epistemic: 'inference' }),

    /* ---- what survives ---- */

    preserves_record_id: F.bool('True when the record keeps the id it already has. IDs are never renamed here — every other dataset resolves against them — so on an existing record this is true or the proposal is refused.'),
    provenance_disposition: F.array(F.object({
      field: F.string('The provenance field — published, accessed, last_verified, verification_note, note, url_status, resolution, reference_gap, gap_note, requires_verification, sources.'),
      disposition: F.enum(PROVENANCE_DISPOSITIONS, 'What becomes of it. There is no "removed": removing an asterisk, a reference gap, a requires_verification flag or a verification_note is red tier.'),
      current: F.text('What the canonical record carries in that field right now, verbatim. Null only where the field is absent or null there.', { nullable: true }),
      why: F.string('Why it is being left alone, added to, set for the first time, or written over.'),
    }, 'One provenance field, and what happens to it.'), 'What becomes of every provenance field on the record this touches. An empty array on a proposal that changes an existing record asserts that none was touched, and that claim is checkable against the diff.'),

    /* ---- what this would assert ---- */

    substantive: F.bool('True if the site would afterwards state something different about EU law — a changed date, status, article number, fine, legal basis, claim type, or what a source is said to support. Red tier: an agent may propose it and nothing more.'),
    verification_refs: F.array(F.id('A VerificationRecord id.'), 'The verifications this rests on. Empty is permitted and is a finding: a factual modification standing on no verification has to say so in its open questions rather than in nothing.'),
    prose_anchor: F.string('Where in the brief the statement a new claim carries already appears — a heading id, a part id, a quoted sentence. data/claims.json\'s own $description is that no new claims were written: every record corresponds to a statement already present in the prose. Null where none was identified, and a new claim with none is blocked.', { nullable: true }),
    retrieved_and_read: F.bool('True only when the document behind this was actually fetched and read in the run that produced the proposal. Creating a sources.json record from anything else — a title, an abstract, a search snippet, model knowledge — is red tier under AI-SAFE-BOUNDARIES §3.'),
    supersedes: F.id('An earlier DataProposal this replaces. Proposals are not edited; a later one supersedes.', { nullable: true }),
  },
  forbidden: {
    auto_merge: 'There is no automatic merge here. A substantive legal change is authored by a human behind an ApprovalRequest; that is the entire point of this contract.',
    apply_automatically: 'Same.',
    merge_on_approval: 'Same. An approval authorises a human to act; it does not act.',
    applied: 'A proposal does not record its own landing. That is a ChangeRecord, which references the approval that authorised it.',
    merged: 'Same.',
    approved: 'A proposal does not record its own approval. That is an ApprovalRequest.',
    new_id: 'IDs are never renamed. There is no field for the id a record would be given instead of the one it has.',
    rename_to: 'Same.',
    grade: 'A claim\'s evidence grade is derived at render time by js/format.js. Storing one anywhere creates the copy that can drift.',
    tier: 'A source\'s tier is settled on its record in data/sources.json. A proposal that would change it says so as an amend_field operation, where the current value is visible in the diff.',
    last_verified: 'A date is not set by declaring it on a proposal. It is an amend_field operation on the record, carrying what is there now, so bulk-stamping is visible as what it is.',
    confidence_that_true: 'The confidence field is how much the proposing agent is standing on this proposal. A probability that a legal fact is true is not an agent\'s to state.',
  },
  rules: [
    /* ---- 1 · the existing record is looked for first ---- */

    (r) => (CREATE_KINDS.includes(r.operation_kind) && !r.existing_search
      ? [`operation_kind is "${r.operation_kind}" with no existing_search: a new record is proposed only after looking for the one that is already there`]
      : []),
    (r) => (CREATE_KINDS.includes(r.operation_kind) && r.existing_search && r.existing_search.performed !== true
      ? [`operation_kind is "${r.operation_kind}" but existing_search.performed is false: the search is the thing that stops a second home for a record that already has one`]
      : []),
    (r) => (r.existing_search?.best_candidate_id && !r.existing_search?.why_not_that_one
      ? [`existing_search found "${r.existing_search.best_candidate_id}" and does not say why it is not this record: a score below a threshold is a number, not a reason`]
      : []),
    (r) => (CREATE_KINDS.includes(r.operation_kind) && r.record_id
      ? [`operation_kind is "${r.operation_kind}" but record_id is "${r.record_id}": a record that already has an id is not being created`]
      : []),
    (r) => (!CREATE_KINDS.includes(r.operation_kind) && !r.record_id
      ? [`operation_kind is "${r.operation_kind}" with a null record_id: name the canonical record this changes`]
      : []),

    /* ---- 1b · a taxonomy term is proposed, never created ----

       SESSION 12's brief, word for word: "If a new taxonomy term
       appears necessary: create a taxonomy proposal; do not silently
       create it." These four rules are that sentence, made
       unbypassable.

       The class is FORCED rather than checked. Everywhere else in
       this contract the proposing agent states a class and a rule
       refuses it if it is too low; here the answer does not depend on
       the proposal at all. data/taxonomy.json is the enum authority
       every other dataset resolves against and every rendered label
       comes from — AGENTS.md states its ids are never renamed — so a
       term arriving in it is structural change, and
       docs/AGENT-ROLES.md §4 is explicit that structural change is
       never Class B. */

    (r) => (r.operation_kind === 'create_taxonomy_term' && r.dataset !== 'data/taxonomy.json'
      ? [`operation_kind is "create_taxonomy_term" but dataset is "${r.dataset}": a taxonomy term has one home, and it is data/taxonomy.json`]
      : []),
    (r) => (r.operation_kind === 'create_taxonomy_term' && r.record_kind !== 'taxonomy_term'
      ? [`operation_kind is "create_taxonomy_term" but record_kind is "${r.record_kind}": say what sort of record this is, and it is a taxonomy term`]
      : []),
    (r) => (r.operation_kind === 'create_taxonomy_term' && r.autonomy_class !== 'human_only'
      ? [`operation_kind is "create_taxonomy_term" with autonomy_class "${r.autonomy_class}": data/taxonomy.json is the enum authority every other dataset resolves against, so adding a term to it is structural change — and structural change is never Class B (docs/AGENT-ROLES.md §4)`]
      : []),
    (r) => {
      if (r.operation_kind !== 'create_taxonomy_term') return [];
      const dims = taxonomyDimensions();
      /* The dimension is read off the operation's own target rather
         than taken from a field beside it: the target is what a
         reviewer opens, and a second copy of the dimension name is a
         second thing to be wrong. */
      const bad = (r.proposed_change?.operations ?? [])
        .map((o) => String(o?.target ?? ''))
        .filter((t) => !dims.some((d) => t.includes(d)));
      return bad.length
        ? [`proposed_change.operations targets ${bad.join(', ')}, and no dimension in data/taxonomy.json is named there: the ${dims.length} dimensions it carries are ${dims.join(', ')}`]
        : [];
    },

    /* ---- 2 · the id and the provenance survive ---- */

    (r) => (r.record_id && r.preserves_record_id !== true
      ? [`record_id is "${r.record_id}" but preserves_record_id is false: IDs are never renamed here — data/taxonomy.json and every other dataset resolve against them`]
      : []),
    (r) => {
      const ops = r.proposed_change?.operations ?? [];
      const renames = ops.filter((o) => o?.op === 'move' || /(^|[.\[])id$/.test(String(o?.target ?? '')));
      return renames.length
        ? [`proposed_change.operations would move or retarget an id (${renames.map((o) => o.target).join(', ')}): an id is stable, and renaming one dangles every reference to it`]
        : [];
    },
    (r) => {
      const ops = r.proposed_change?.operations ?? [];
      const removals = ops.filter((o) => o?.op === 'remove'
        && /verification_note|requires_verification|reference_gap|gap_note|resolution|url_status|last_verified|accessed|published/.test(String(o?.target ?? '')));
      return removals.length
        ? [`proposed_change.operations would remove ${removals.map((o) => o.target).join(', ')}: removing an asterisk, a reference gap, a requires_verification flag or a verification_note is red tier under AI-SAFE-BOUNDARIES §3, and there is no autonomy class that permits it as an operation`]
        : [];
    },
    (r) => (r.provenance_disposition ?? [])
      .filter((d) => d?.disposition === 'replaced_human_only' && (r.autonomy_class !== 'human_only' || r.substantive !== true))
      .map((d) => `provenance_disposition for "${d.field}" is "replaced_human_only" on a proposal that is ${r.substantive === true ? 'substantive' : 'not substantive'} with autonomy_class "${r.autonomy_class}": writing over an existing provenance value is a substantive change a human authors`),
    (r) => (r.provenance_disposition ?? [])
      .filter((d) => d?.disposition === 'set_first_time' && d?.current !== null)
      .map((d) => `provenance_disposition for "${d.field}" says it is being set for the first time, but current carries ${JSON.stringify(d.current)}: null means nobody looked, and a field with a value has been looked at`),

    /* ---- 3 · a substantive legal change is never merged automatically ---- */

    (r) => (r.substantive === true && r.autonomy_class !== 'human_only'
      ? [`substantive is true with autonomy_class "${r.autonomy_class}": altering what the site says about EU law is red tier — an agent may propose it and nothing more`]
      : []),
    (r) => (r.operation_kind === 'amend_field' && r.substantive !== true
      && !(r.epistemic?.inference ?? []).some((e) => e?.field === 'substantive')
      ? ['operation_kind is "amend_field" and substantive is false with no epistemic.inference entry naming it: changing the value a field carries is presumed substantive, and saying it is not is a judgement that states its method']
      : []),
    (r) => (r.substantive === true && (r.verification_refs ?? []).length === 0
      && !(r.epistemic?.unresolved ?? []).some((u) => u?.field === 'verification_refs')
      ? ['substantive is true, verification_refs is empty, and no open question says so: a change to a legal fact standing on no verification names that as the gap rather than leaving it silent']
      : []),

    /* ---- the two red-tier creation burdens ---- */

    (r) => (r.operation_kind === 'create_source' && r.retrieved_and_read !== true
      ? ['operation_kind is "create_source" but retrieved_and_read is false: a sources.json record is created from a document actually fetched and read, never from a title, an abstract, a snippet or model knowledge']
      : []),
    (r) => (r.operation_kind === 'create_source'
      && !(r.evidence ?? []).some((e) => e?.kind === 'retrieved_document')
      ? ['operation_kind is "create_source" with no retrieved_document in evidence: nothing was read, so there is nothing to write a source record from']
      : []),
    (r) => (r.operation_kind === 'create_claim' && !r.prose_anchor
      && !(r.epistemic?.unresolved ?? []).some((u) => u?.field === 'prose_anchor' && u?.blocks === true)
      ? ['operation_kind is "create_claim" with no prose_anchor and no blocking open question naming it: data/claims.json\'s $description is that every record corresponds to a statement already present in the prose, and a claim with no sentence behind it would be the site asserting something it does not say']
      : []),

    /* ---- attaching evidence says what it attaches ---- */

    (r) => (r.operation_kind === 'attach_evidence' && (r.verification_refs ?? []).length === 0
      ? ['operation_kind is "attach_evidence" but verification_refs is empty: name the verification that read the source, or this is an assertion that a document supports a claim with nothing behind it']
      : []),

    /* ---- the dataset is a data/ path, and the record is in it ---- */

    (r) => (typeof r.dataset === 'string' && !/^data\/[a-z-]+\.json$/.test(r.dataset)
      ? [`dataset is "${r.dataset}": a DataProposal changes a canonical dataset, and that is a path under data/ ending in .json`]
      : []),
    (r) => {
      const ents = r.affected_entities ?? [];
      return typeof r.dataset === 'string' && ents.length && !ents.some((e) => e?.path === r.dataset)
        ? [`dataset is "${r.dataset}" but no affected entity names that path: what a record is about and what file it would change are answered in one place or they disagree`]
        : [];
    },
  ],
});
