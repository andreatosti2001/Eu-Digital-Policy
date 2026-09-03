/* ============================================================
   agent/proposals/editorial/staleness.mjs — certain contradiction,
   possible staleness, and no change at all

   SESSION 15's brief, in one line: *distinguish certain
   contradiction from possible staleness*. This module is that
   distinction, and it is the reason the agent can be allowed near
   the brief's prose at all.

   docs/REGULATORY-IMPACT-MAPPING.md §5 already settled the
   principle for prose inside `data/`:

     "This paragraph might be wrong" and "this paragraph says
      25 May 2018" are different claims, and nothing here lets the
      second stand in for the first.

   The same rule, applied to the sentences a reader reads. Three
   answers, and the third is a deliverable rather than a silence.

   CONTRADICTED   the value that moved is IN the sentence. Quoted, so
                  a reviewer checks the finding instead of taking it,
                  and a substitution is well defined.
   POSSIBLY STALE the sentence depends on the record that changed and
                  does not state the value. Nothing here can show it
                  is wrong. It is flagged and never edited.
   NO CHANGE      the sentence is about the record, does not state
                  the value that moved, and is a statement of fact.
                  Correcting the record corrects everything the
                  reader sees here, because the site derives at
                  render time — and saying so is worth more than a
                  list of files, because the alternative is a
                  reviewer hand-checking paragraphs that cannot be
                  wrong.

   THE READING RULES HAVE ONE HOME, AND IT IS NOT THIS FILE.
   `proseMentions`, `datesIn`, `monthNames` and `labelAmbiguity`
   are imported from `agent/detector/impact.mjs`: SESSION 10 worked
   out how a value can appear in a sentence — any rendering of the
   same calendar day, a taxonomy term's label rather than its id, a
   literal on a token boundary — and reimplementing that here would
   be a second reader that disagrees with the first on some sentence
   nobody has looked at yet.

   HOW A SENTENCE COMES TO DEPEND ON A RECORD, in decreasing
   strength, and every one of them is DERIVED rather than declared:

     1 the sentence contains the value          → contradicted
     2 a claim attached to the block names the  → possibly stale
       changed record in its own reference
       arrays
     3 the sentence names the record, under a   → possibly stale,
       name that is distinctive                   and only where the
                                                  block carries no
                                                  claim of its own

   THE THIRD IS THE DANGEROUS ONE AND IT IS TESTED. `status:
   applicable` is labelled "Applicable", and searching prose for
   that word finds sentences about a different act in which the word
   is doing ordinary work — SESSION 10's false positive, and the
   reason `labelAmbiguity` exists. The same test is applied to a
   record's own names here, against the site's own prose:
   **does this name appear in blocks whose claims are about other
   records?** If it does, a string match cannot tell the record from
   the word, and the mention becomes an open question with its
   sentence attached rather than a finding.
   ============================================================ */

import { proseMentions, monthNames, labelAmbiguity } from '../../detector/impact.mjs';
import { ANALYTICAL_STATES, claimReferences } from './register.mjs';

/** Fields a canonical record may carry a human-readable name in.
 *  Read in this order; every one that exists becomes a needle. */
const NAME_FIELDS = ['short_name', 'full_name', 'label', 'title', 'term', 'name'];

/**
 * A name is only usable as a needle if a string match can tell it
 * from ordinary English.
 *
 * A single word of four characters or fewer is refused outright —
 * "DSA" survives that test and "Act" does not, and the cost of the
 * rule is under-reporting a mention that a claim link would have
 * caught anyway.
 */
const TOO_SHORT = 4;

/**
 * Every name the changed record goes by in prose, each carrying
 * whether a match on it can be trusted.
 *
 * @returns {Array<{text:string, ambiguous:boolean, why:string, from:string}>}
 */
export function needlesFor(entityId, { corpus, graph = null, register = null }) {
  const out = [];
  const node = graph?.nodes?.get(String(entityId)) ?? null;
  const record = node?.record ?? corpus.instrumentById.get(entityId) ?? corpus.claimById.get(entityId) ?? corpus.eventById.get(entityId) ?? null;

  /* The id itself. Namespaced and mutually un-confusable in this
     corpus — `clm-…`, `tl-…`, `gdpr:art-5` — so an id in a sentence
     is the author having written the id down. */
  out.push({ text: String(entityId), ambiguous: false, why: 'The record\'s own id. Ids in this corpus are namespaced and a sentence never equals one by accident.', from: 'id' });

  for (const f of NAME_FIELDS) {
    const v = record?.[f];
    if (typeof v !== 'string' || !v.trim()) continue;
    out.push({ text: v.trim(), ...distinctiveness(v.trim(), entityId, { node, graph, register }), from: f });
  }
  for (const a of Array.isArray(record?.aliases) ? record.aliases : []) {
    if (typeof a === 'string' && a.trim()) out.push({ text: a.trim(), ...distinctiveness(a.trim(), entityId, { node, graph, register }), from: 'aliases' });
  }
  /* De-duplicate on the text, keeping the strictest verdict: the
     same string reached twice must not become trustworthy because
     one of the two paths did not test it. */
  const seen = new Map();
  for (const n of out) {
    const prior = seen.get(n.text);
    if (!prior || (!prior.ambiguous && n.ambiguous)) seen.set(n.text, n);
  }
  return [...seen.values()];
}

/**
 * Can a string match on this name be told from ordinary English?
 *
 * Two tests, both derived. The taxonomy case defers to
 * `labelAmbiguity`, which asks the corpus. Everything else asks the
 * site's own prose: if the name appears, whole-word, in blocks whose
 * claims are about other records, then a match establishes that the
 * word is there and nothing about which record it is about.
 */
function distinctiveness(name, entityId, { node, graph, register }) {
  if (name.length <= TOO_SHORT && !/\d/.test(name)) {
    return { ambiguous: true, why: `"${name}" is ${name.length} characters and carries no digit: too short for a string match to distinguish the record from the word.` };
  }
  if (node?.kind === 'taxonomy_term' && graph) {
    const amb = labelAmbiguity(graph, node.id, name);
    return { ambiguous: amb.ambiguous, why: amb.why };
  }
  if (!register) {
    return { ambiguous: false, why: 'No prose register was supplied, so the name was not tested against the site\'s own sentences. Taken as distinctive, and this is the weaker of the two paths.' };
  }
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^A-Za-z0-9])(${esc})([^A-Za-z0-9]|$)`, 'i');
  const elsewhere = register.rows.filter((r) => r.claim_states.length
    && !r.block.claim_ids.some((cid) => claimNames(r, cid, entityId))
    && re.test(r.block.text));
  return elsewhere.length
    ? {
      ambiguous: true,
      why: `"${name}" appears whole-word in ${elsewhere.length} attributed block(s) whose claims are about other records — for example ${elsewhere[0].block.anchor}. A string match cannot tell the record from the word.`,
    }
    : { ambiguous: false, why: `"${name}" appears in no attributed block whose claims are about a different record, so a whole-word match on it is about this record.` };
}

/** Does the claim behind a row reference this entity? */
function claimNames(row, claimId, entityId) {
  return (row.claim_refs?.[claimId] ?? []).includes(String(entityId));
}

export { claimReferences };

/**
 * How — and whether — one change reaches one block of prose.
 *
 * @returns {{reached:boolean, kind:'contradicted'|'possibly_stale'|null,
 *            how:string, why:string, mentions:object[], open_questions:object[]}}
 */
export function reachOf(row, { change, corpus, needles, months, labels }) {
  const block = row.block;
  const oldValue = change.old_value ?? null;
  const open_questions = [];

  /* 1 · THE VALUE IS IN THE SENTENCE. The strongest answer there
        is, and the only one from which anything may be composed. */
  const all = oldValue ? proseMentions(block.text, oldValue, { months, labels }) : [];
  const solid = all.filter((m) => !m.ambiguous);
  const weak = all.filter((m) => m.ambiguous);
  if (solid.length) {
    return {
      reached: true, kind: 'contradicted',
      how: solid[0].how,
      why: `The sentence states the value that moved, and it is quoted so a reviewer can check the finding rather than take it. ${solid.length > 1 ? `It appears ${solid.length} times in this block.` : ''}`.trim(),
      mentions: solid, open_questions,
      quote: solid[0].quote, matched: solid[0].matched, occurrences: solid.length,
    };
  }
  for (const m of weak) {
    open_questions.push({
      anchor: block.anchor, file: block.file,
      question: `Is "${m.matched}" in this sentence the value that moved, or the same word doing ordinary work?`,
      missing: 'A reading of the sentence. The label this value carries is not distinguishable from ordinary English by a string match, and this agent does not make the reading.',
      quote: m.quote,
    });
  }

  /* 2 · A CLAIM ATTACHED TO THE BLOCK NAMES THE CHANGED RECORD.
        Declared by the corpus, not guessed from the prose: the claim
        record's own reference arrays point at the entity. */
  const viaClaims = (row.claim_states ?? [])
    .filter((c) => (row.claim_refs?.[c.claim_id] ?? []).includes(String(change_entity(change))))
    .map((c) => c.claim_id);
  if (viaClaims.length) {
    return {
      reached: true, kind: 'possibly_stale',
      how: `the claim${viaClaims.length > 1 ? 's' : ''} attached to this block (${viaClaims.join(', ')}) reference${viaClaims.length > 1 ? '' : 's'} the record that changed`,
      why: `The sentence is a view of a claim that points at the changed record, and the sentence does not state the value that moved. That establishes a dependency and nothing about whether the sentence is now wrong.`,
      mentions: [], open_questions, quote: null, matched: null, occurrences: 0,
      via_claims: viaClaims,
    };
  }

  /* 3 · THE SENTENCE NAMES THE RECORD, under a name a string match
        can distinguish — and only where the block carries no claim
        of its own, because a block that does was already answered
        by the stronger test above. */
  if (!block.claim_ids.length) {
    for (const n of needles) {
      const esc = n.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^A-Za-z0-9])(${esc})([^A-Za-z0-9]|$)`);
      const m = re.exec(block.text);
      if (!m) continue;
      if (n.ambiguous) {
        open_questions.push({
          anchor: block.anchor, file: block.file,
          question: `Does "${n.text}" in this sentence refer to ${change_entity(change)}?`,
          missing: n.why,
          quote: block.text.slice(Math.max(0, m.index - 60), m.index + n.text.length + 60).trim(),
        });
        continue;
      }
      return {
        reached: true, kind: 'possibly_stale',
        how: `the sentence names the record, as "${n.text}" (its ${n.from})`,
        why: `The sentence names the record that changed and carries no claim record of its own, so nothing in this repository says what it asserts about it. ${n.why}`,
        mentions: [], open_questions, quote: null, matched: null, occurrences: 0,
        via_name: n.text,
      };
    }
  }

  return { reached: false, kind: null, how: 'nothing connects this block to the change', why: 'The sentence does not state the value that moved, no claim attached to it points at the changed record, and it does not name the record.', mentions: [], open_questions, quote: null, matched: null, occurrences: 0 };
}

/** The entity a change is about, as an id. The detection names it in
 *  its affected entities; the first legal-record entity with an id
 *  is the subject. */
export function change_entity(change) {
  const e = (change.affected_entities ?? []).find((x) => x?.id);
  return e?.id ?? null;
}

/**
 * The triage table, in one place.
 *
 * A reviewer can read every case this agent claims to know about,
 * and a combination it does not know about is a blank rather than a
 * fall-through to a default — the same shape
 * `agent/proposals/data/route.mjs` and `agent/detector/classify.mjs`
 * use, and for the same reason.
 *
 * `outcome` is one of:
 *   factual_update            an EditorialProposal carrying a drafted
 *                             substitution
 *   analytical_update         an EditorialProposal with nothing drafted
 *   editorial_recommendation  an EditorialProposal with nothing drafted
 *   no_change                 an AgentObservation. Not a proposal: a
 *                             proposal with no operations is a
 *                             suggestion, and this is a finding.
 */
export const TRIAGE = [
  {
    state: 'fact', staleness: 'contradicted', outcome: 'factual_update',
    why: 'A statement of fact that contains the value that moved. Both sides of the change were read from a document, the sentence quotes the old one, and the replacement is a substitution rather than a sentence somebody wrote.',
  },
  {
    state: 'fact', staleness: 'possibly_stale', outcome: 'no_change',
    why: 'A statement of fact about the changed record that does not state the value that moved. This site derives at render time — the evidence markers, the status strips, the calendar and the pipeline stages are computed when the page is opened — so correcting the record corrects everything the reader sees here, and the prose needs no edit. Saying so is a finding; leaving it in a review list is not.',
  },
  {
    state: 'interpretation', staleness: 'contradicted', outcome: 'analytical_update',
    why: 'A reading that states the value that moved. The value is wrong and the reading may or may not survive its correction — substituting inside an argument can invert it, and which way this one goes is the author\'s to decide.',
  },
  {
    state: 'interpretation', staleness: 'possibly_stale', outcome: 'analytical_update',
    why: 'A reading resting on a premise that moved, without restating it. Exactly the case SESSION 15 names: the argument is never rewritten because a factual input changed.',
  },
  {
    state: 'critique', staleness: 'contradicted', outcome: 'analytical_update',
    why: 'An analytical judgement that states the value that moved. Same as the reading above, and more so: a critique is the author arguing, and an agent editing one is an agent arguing.',
  },
  {
    state: 'critique', staleness: 'possibly_stale', outcome: 'analytical_update',
    why: 'An analytical judgement resting on a premise that moved. Flagged for a human, with what moved and where; nothing about the judgement is touched.',
  },
  {
    state: 'unresolved', staleness: 'contradicted', outcome: 'editorial_recommendation',
    why: 'A sentence stating the old value, over a claim no external source directly carries. There is nothing to correct it TO with any authority: the evidence behind the sentence was insufficient before the change and still is. The recommendation names both problems rather than fixing the visible one.',
  },
  {
    state: 'unresolved', staleness: 'possibly_stale', outcome: 'no_change',
    why: 'A sentence over an unresolved claim that does not state the value that moved. The change reaches it and changes nothing about it; what the sentence needs is verification, which is the Legal Verifier\'s and not an editorial matter.',
  },
  {
    state: 'not_attributed', staleness: 'contradicted', outcome: 'editorial_recommendation',
    why: 'A sentence stating the old value and carrying no claim record. Every material factual sentence retains its provenance, and this one has none — so the finding is two things at once, and correcting the value silently would fix the smaller half and hide the larger.',
  },
  {
    state: 'not_attributed', staleness: 'possibly_stale', outcome: 'no_change',
    why: 'A sentence that names the changed record, carries no claim, and does not state the value. Nothing here establishes that it says anything about what moved. Reported as examined-and-clear, which is a different answer from not looked at.',
  },
];

const KEY = (state, staleness) => `${state}|${staleness}`;
const TABLE = new Map(TRIAGE.map((r) => [KEY(r.state, r.staleness), r]));

/* Fail at load rather than at run time. A combination with no row
   would get an undefined outcome, and an undefined outcome on a
   finding about a production site is the one default that must not
   exist. */
for (const state of ['fact', 'interpretation', 'critique', 'unresolved', 'not_attributed']) {
  for (const staleness of ['contradicted', 'possibly_stale']) {
    if (!TABLE.has(KEY(state, staleness))) throw new Error(`staleness.mjs: no triage row for "${state}" × "${staleness}"`);
  }
}
for (const r of TRIAGE) {
  if (ANALYTICAL_STATES.includes(r.state) && r.outcome === 'factual_update') {
    throw new Error(`staleness.mjs: the table routes an analytical state (${r.state}) to a factual update. That is the one thing SESSION 15 says must never happen.`);
  }
}

/** What becomes of one reached block. */
export function triage(state, staleness) {
  const row = TABLE.get(KEY(state, staleness));
  if (!row) throw new Error(`staleness.mjs: no triage row for "${state}" × "${staleness}"`);
  return row;
}

/** The month vocabulary, read from js/format.js so it has one home. */
export { monthNames };
