/* ============================================================
   agent/proposals/editorial/register.mjs — FACT · INTERPRETATION ·
   CRITIQUE · UNRESOLVED, for a sentence

   SESSION 14 asks that these four be preserved. They can only be
   preserved by something that can tell them apart, and the site
   already can — in three separate places, none of which is about a
   sentence:

     data/claims.json `type`   law · fact · interpretation ·
                               critique · forecast
     js/format.js              familyOf() groups the last three as
                               "argument"; evidenceGrade() answers
                               "unresolved" where no external source
                               directly carries the claim
     the markup                the brief labels its own boxes
                               CRITIQUE, in the author's own hand

   THIS MODULE DERIVES AND STORES NOTHING. `familyOf` and
   `evidenceGrade` are IMPORTED from `js/format.js` rather than
   reimplemented — the grading rules are red tier
   (AI-SAFE-BOUNDARIES §3) and a second implementation in the agent
   layer would be exactly the copy that drifts. The precedent is
   `agent/integrate/unsupported.mjs`, which imports the same two for
   the same reason.

   WHAT IS NEW HERE IS THE SUBJECT. A claim record describes a
   PROPOSITION. This describes a BLOCK OF PROSE, and no record in
   `data/` describes one. Most sentences on this site carry no claim
   at all — 328 of 387 — and for those the honest answer is the
   fifth state, `not_attributed`: not "probably fact", not
   "unresolved", but *this block carries no provenance and which of
   the four it is cannot be derived*. Guessing would be the failure
   AI-SAFE-BOUNDARIES §0.5 names — an absence of knowledge presented
   as a finding.

   THE ORDER MATTERS, and it is the same order js/format.js grades
   in. Claim type is decided first: an argument stays an argument
   however well sourced it is, because the sourcing supports the
   premises and not the conclusion. Only a claim of law or of fact
   is then downgraded to UNRESOLVED by what carries it.

   WHERE TWO BLOCKS DISAGREE ON ONE CLAIM, and where the markup's
   own CRITIQUE label disagrees with the claim type, the
   disagreement is REPORTED rather than resolved. It is a finding
   about the site — the sort of thing nothing in this repository
   currently checks — and picking a winner would be this agent
   deciding what the brief is saying.
   ============================================================ */

import { familyOf, typeOf, evidenceGrade, GRADE } from '../../../js/format.js';
import { EDITORIAL_STATES } from '../../schemas/types.mjs';

/**
 * What the site's own markup calls each state, where it labels one
 * at all, and which claim families that label is consistent with.
 *
 * The map is the only place the two vocabularies meet. It is used in
 * both directions: the label decides the state of a box carrying no
 * claim record, and it is COMPARED against the claims of a box that
 * carries some. A box the author marked CRITIQUE whose every claim
 * is typed law or fact is a disagreement between the markup and the
 * data about what a passage is, and nothing in this repository
 * currently checks for one.
 */
export const BOX_LABEL_STATE = {
  CRITIQUE: 'critique',
  MECHANICS: 'fact',
};

/** The claim families each label is consistent with. `familyOf`
 *  answers law · fact · argument, and those are its words. */
export const BOX_LABEL_EXPECTS = {
  CRITIQUE: ['argument'],
  MECHANICS: ['law', 'fact'],
};

/**
 * The words this module answers in, and what each means. Carried
 * beside the state so a report never prints a bare enum at a reader
 * who has to guess what it meant.
 */
export const STATE_GLOSS = {
  fact: 'A directly supported legal or institutional proposition. Something a source states.',
  interpretation: 'A reasoned understanding of implications. The author\'s reading, and sources support its premises rather than settle its conclusion.',
  critique: 'An analytical judgement. The author arguing, and marked as such.',
  unresolved: 'Evidence insufficient or conflicting. No external source directly carries the claim behind this sentence, or the only one is the brief itself.',
  not_attributed: 'This block carries no claim record, so which of the four it is cannot be derived here. Not a defect of the site — most sentences are not consequential statements — and not a licence to guess.',
};

for (const s of EDITORIAL_STATES) {
  if (!STATE_GLOSS[s]) throw new Error(`register.mjs: no gloss for editorial state "${s}" — a state nobody documented is a state two readers will take differently`);
}

/** The two that are the author's argument. Named once. */
export const ANALYTICAL_STATES = ['interpretation', 'critique'];

/**
 * Every canonical id a claim record points at.
 *
 * DERIVED FROM THE RECORD, NEVER FROM A TABLE. The same rule
 * `agent/detector/graph.mjs` states for the whole corpus: a string
 * that is the id of a record is an edge to that record, and
 * everything else is a value. A hand-kept list of which claim
 * fields hold references — instruments, provisions, institutions,
 * enforcement, legal_basis, sources — would be the second home this
 * architecture exists to prevent, and it would go stale silently
 * the first time `claims.json` grew a field.
 */
export function claimReferences(claim, isNode) {
  const out = new Set();
  (function walk(v) {
    if (typeof v === 'string') { if (isNode(v)) out.add(v); return; }
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') return Object.values(v).forEach(walk);
  })(claim);
  out.delete(claim.id);
  return [...out];
}

/**
 * The state of ONE claim, as it bears on the sentence attached to
 * it.
 *
 * @param {object} claim   a data/claims.json record
 * @param {object} ix      `{ source: Map }`, for the tier lookup
 * @returns {{state:string, grade:string, claim_type:string, family:string, why:string}}
 */
export function stateOfClaim(claim, ix) {
  const family = familyOf(claim);
  const type = typeOf(claim);
  const grade = evidenceGrade(claim, ix);

  if (family === 'argument') {
    /* An argument is never graded by sourcing, and never reported
       as unresolved for want of a citation: js/format.js answers
       GRADE.interpretation for all three argument types, and the
       distinction that matters editorially is which argument it is. */
    const state = type === 'critique' ? 'critique' : 'interpretation';
    return {
      state, grade: grade.id, claim_type: claim.type, family,
      why: `claims.json types ${claim.id} as ${claim.type}, which js/format.js puts in the "argument" family. Sources can support the premises of a reading; they cannot settle its conclusion, so no amount of evidence moves this to FACT.`,
    };
  }

  if (grade.id === GRADE.unresolved.id) {
    return {
      state: 'unresolved', grade: grade.id, claim_type: claim.type, family,
      why: `claims.json types ${claim.id} as ${claim.type}, but js/format.js grades it "${GRADE.unresolved.label}": no directly supporting source has been located, or the only one is this brief. The proposition is stated; what carries it is not established.`,
    };
  }

  return {
    state: 'fact', grade: grade.id, claim_type: claim.type, family,
    why: `claims.json types ${claim.id} as ${claim.type} and js/format.js grades it "${grade.label}" — an external source directly carries it.`,
  };
}

/**
 * The state of a BLOCK of prose.
 *
 * A block may carry several claims. Where they disagree, the
 * WEAKEST reading wins and the disagreement is reported: a paragraph
 * holding one fact and one critique is not a fact, and rendering it
 * as one is how an argument comes to read as law. That is the same
 * direction `agent/detector/impact.mjs` fails in — when in doubt,
 * the higher class — and it is the direction that costs a reviewer
 * a minute rather than costing a reader the truth.
 *
 * @returns {{state, why, claim_states, grade, conflicts, box_label_disagrees}}
 */
export function stateOfBlock(block, corpus) {
  const ix = { source: corpus.sourceById };
  const claims = (block.claim_ids ?? []).map((id) => corpus.claimById.get(id)).filter(Boolean);
  const missing = (block.claim_ids ?? []).filter((id) => !corpus.claimById.get(id));

  const declared = block.box_label ? BOX_LABEL_STATE[block.box_label] ?? null : null;

  if (!claims.length) {
    /* The markup's own label is still the author speaking, and it is
       read even where no claim record is attached: a box the author
       marked CRITIQUE is the author saying which of the four this
       is, and that is a stronger signal than silence. */
    if (declared) {
      return {
        state: declared, why: `The block carries no claim record, but the markup labels its box "${block.box_label}", which is the author saying which of the four this is.`,
        claim_states: [], claim_refs: {}, grade: null, conflicts: [], box_label_disagrees: false, missing_claims: missing,
      };
    }
    return {
      state: 'not_attributed',
      why: missing.length
        ? `The block names claim(s) ${missing.join(', ')}, and data/claims.json has no such record. A dangling attribution is worse than none: it looks like provenance.`
        : 'The block carries no data-claim attribution and sits in no labelled box, so which of the four it is cannot be derived from anything in this repository.',
      claim_states: [], grade: null, conflicts: [], box_label_disagrees: false, missing_claims: missing,
    };
  }

  const claim_states = claims.map((c) => ({ claim_id: c.id, ...stateOfClaim(c, ix) }));
  /* What each attached claim points at, so a caller asking "does
     this sentence depend on the record that changed?" reads the
     corpus's own answer rather than searching the prose for a name. */
  const isNode = (v) => corpus.allIds.has(v);
  const claim_refs = Object.fromEntries(claims.map((c) => [c.id, claimReferences(c, isNode)]));
  /* Weakest first: unresolved, then the two argument states, then
     fact. A block is only FACT when everything attached to it is. */
  const order = ['unresolved', 'critique', 'interpretation', 'fact'];
  let state = order.find((s) => claim_states.some((c) => c.state === s)) ?? 'not_attributed';
  const distinct = [...new Set(claim_states.map((c) => c.state))];

  /* THE AUTHOR'S OWN LABEL, WHERE THE DATA AGREES WITH IT. A box
     marked CRITIQUE holding argument-family claims is a critique
     whichever of the two argument types those claims happen to
     carry: the label is a statement about the PASSAGE, and the
     claim type is a statement about a proposition inside it. Where
     no attached claim is in a family the label is consistent with,
     nothing is overridden and the disagreement is reported instead —
     that is a finding about the site, and resolving it would be this
     agent deciding what the brief is saying. */
  const expects = declared ? BOX_LABEL_EXPECTS[block.box_label] ?? [] : [];
  const labelAgrees = Boolean(declared) && claim_states.some((c) => expects.includes(c.family));
  if (labelAgrees) state = declared;

  return {
    state,
    why: labelAgrees && distinct.length > 1
      ? `The markup labels this box "${block.box_label}" and ${claim_states.filter((c) => expects.includes(c.family)).length} of its ${claims.length} claim(s) are in a family that label is consistent with, so the author's own label governs.`
      : distinct.length > 1
        ? `The block carries ${claims.length} claims in ${distinct.length} different states (${distinct.join(', ')}). The weakest governs: a paragraph holding one established fact and one argument is not an established fact, and rendering it as one is how an argument comes to read as law.`
        : claim_states[0].why,
    claim_states,
    claim_refs,
    grade: claim_states.length === 1 ? claim_states[0].grade : null,
    conflicts: distinct.length > 1 ? distinct : [],
    /* The markup and the data disagreeing about what a passage is.
       Nothing in this repository checks this today. */
    box_label_disagrees: Boolean(declared) && !labelAgrees,
    declared_by_markup: declared,
    missing_claims: missing,
  };
}

/**
 * Every block, with its state. The census is the deliverable as
 * much as the classification is: "how much of this site's prose
 * carries provenance at all" is a question nothing here has ever
 * answered.
 */
export function registerOf(blocks, corpus) {
  const rows = blocks.map((b) => ({ block: b, ...stateOfBlock(b, corpus) }));
  const by_state = {};
  for (const s of EDITORIAL_STATES) by_state[s] = rows.filter((r) => r.state === s).length;
  return {
    rows,
    by_state,
    attributed: rows.filter((r) => r.claim_states.length).length,
    /* Two findings the site cannot currently see about itself. */
    label_disagreements: rows.filter((r) => r.box_label_disagrees).map((r) => ({
      anchor: r.block.anchor, file: r.block.file, markup_says: r.declared_by_markup, claims_say: r.state,
      claim_ids: r.block.claim_ids,
    })),
    dangling_attributions: rows.filter((r) => r.missing_claims.length).map((r) => ({ anchor: r.block.anchor, file: r.block.file, missing: r.missing_claims })),
  };
}
