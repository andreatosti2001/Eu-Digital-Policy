/* ============================================================
   agent/proposals/data/route.mjs — what becomes of one gap

   SESSION 12 asks that each identified gap can become a structured
   proposal. The honest answer is that most of them cannot become one
   HERE, and the reason is the same one every agent in this repository
   has carried since SESSION 05: **nothing here has ever retrieved a
   document.** A gap says the corpus has no place for a concept; the
   value that would fill it is, for eleven of the thirteen kinds, an
   article number, a date, a competence, a fine or a status — every
   one of them a legal fact an agent may not author (§0.1, §3).

   So this module answers two questions and keeps them apart:

     WHO CAN ACT NEXT      the route
     WHAT CAN BE AUTHORED  a proposal, or a stated refusal

   Conflating them is the mistake that would produce the failure the
   whole project is built against — a proposal carrying a plausible
   value, which is the substitute prohibition (§0.2) arriving through
   a side door.

   THE TABLE IS A TABLE, for the reason `agent/detector/classify.mjs`
   gives for the transition table and `agent/depth/rank.mjs` for the
   autonomy table: a reviewer can read every case the code claims to
   know about, and a kind it does not know about is a blank rather
   than a fall-through to a default. A kind with no row throws at
   module load.

   THE TWO OVERRIDES ARE ONE-WAY, and both move a gap AWAY from being
   proposable here. Nothing in this module can promote a gap into a
   proposal that its kind did not already allow — the same shape as
   `rank.mjs`'s escalation, and for the same reason: this is the field
   that decides whether an agent writes anything at all.
   ============================================================ */

import { DEPTH_GAP_KINDS, GAP_ROUTES, GAP_ROUTE_RECIPIENT } from '../../schemas/types.mjs';

/**
 * The base route for each of the thirteen kinds, with the reason.
 *
 * Eight are `verifier` and that is not a shrug: it is the finding.
 * The corpus's deepest gaps close by somebody reading a document, and
 * no agent here has read one. Saying so thirteen times in a table is
 * more useful than one sentence in a README, because each row names
 * WHICH fact would have to be read.
 */
export const ROUTE_FOR_KIND = {
  missing_instrument: ['verifier', 'An instrument record carries a CELEX number, a kind, a legislative status and a scope class. Every one is read from the act, and §3 names them among the facts an agent may not author.'],
  missing_provision: ['verifier', 'An article number and heading are read from the text of the act. Four provision records already in the corpus carry a note saying they were recorded from general knowledge and must be confirmed before display — which is what writing one from anything but the document produces.'],
  incomplete_timeline: ['verifier', 'The date an obligation begins is the value on this site a reader is most likely to act on, and it is read from the final provisions of the act.'],
  incomplete_applicability: ['verifier', 'An applicability rule states the conditions under which an act binds a reader. Writing one without reading the act is telling a reader what the law requires of them on no authority.'],
  missing_institution: ['verifier', 'Which body took a decision is read from the decision. A wildcard authority id is the corpus saying it does not know, and guessing which national authority it was would be a legal fact invented to fill a field.'],
  missing_competence: ['verifier', 'Competence is read from the article of the act that designates the authority. §3 names it explicitly, and the four competence edges already in the corpus that carry a requires-verification note are why.'],
  incomplete_enforcement: ['data_proposal', 'Two shapes, and the override below separates them. Where the gap sits on an enforcement record that EXISTS, what is missing is the distinction between a researched zero and an absence of looking — and recording that distinction is a statement about this corpus, not about EU law. Where no record exists at all, creating one means authoring a decision, and the override sends it to the Verifier.'],
  unsupported_claim: ['data_proposal', 'Attaching a source needs the source read, and that is the Verifier\'s. But the finding this gap actually carries — that the claim is typed law, rests on the brief citing itself, and OTHER RECORDS ARE BUILT ON IT — is a fact about the corpus that nothing in data/ currently records. A note stating it asserts nothing about EU law and can be authored today.'],
  missing_source_relationship: ['taxonomy_proposal', 'The corpus holds one document as two source records and has no way to say so. Before any record can say it, the vocabulary needs a word for it — and data/taxonomy.json has none. The brief is explicit that a term is proposed and never silently created.'],
  missing_instrument_relationship: ['editorial', 'Both acts are modelled and both are cited; what is missing is the characterisation of HOW they meet — overlap, conflict, carve-out. That is a legal reading, and a reading is the author\'s. docs/AGENT-ROLES.md §6 owns the distinction in the text between what the law says and what the author thinks.'],
  missing_glossary_concept: ['editorial', 'A glossary definition is the site\'s own words explaining a record that already exists. agent/depth/rank.mjs already says so — it is editorial work, which §2 permits an agent to prepare and a human to approve. Writing the definition from model knowledge is the fabrication this project refuses; writing it from the author\'s argument is Editorial\'s.'],
  missing_subordinate_instrument: ['verifier', 'A delegated or implementing act arrives with a CELEX, a parent, a kind and dates — legal facts, every one, and the finding rests on a pattern matched against a recorded title rather than on reading the document.'],
  stale_record: ['owner_decision', 'What last_verified means across ten datasets is a schema decision with the widest reach in the corpus. It is not a taxonomy term, not an interpretation and not a document anybody could read. docs/AGENT-ROLES.md §4: structural change is never Class B.'],
};

/* Fail at load rather than at run time. A kind with no row would get
   an undefined route, and an undefined route on a finding about a
   production site is the one default that must not exist. */
for (const k of DEPTH_GAP_KINDS) {
  if (!ROUTE_FOR_KIND[k]) throw new Error(`route.mjs: no route row for depth gap kind "${k}"`);
  if (!GAP_ROUTES.includes(ROUTE_FOR_KIND[k][0])) throw new Error(`route.mjs: kind "${k}" routes to "${ROUTE_FOR_KIND[k][0]}", which is not a route in GAP_ROUTES`);
}
for (const k of Object.keys(ROUTE_FOR_KIND)) {
  if (!DEPTH_GAP_KINDS.includes(k)) throw new Error(`route.mjs: route row for unknown kind "${k}"`);
}

/**
 * Decide the route for one gap.
 *
 * @param {object} gap        a KnowledgeGap record
 * @param {object} target     what annotate.mjs found at the gap's recommended home
 * @returns {{route:string, why:string, recipient:string|null, overrides:string[]}}
 */
export function routeFor(gap, target) {
  const [base, why] = ROUTE_FOR_KIND[gap.gap_kind];
  let route = base;
  const overrides = [];
  const reasons = [why];

  /* OVERRIDE 1 — THE HOME DOES NOT EXIST.
     `shape_exists: false` is the gap saying the dataset has nowhere
     to put the fact even once somebody knows it. Nothing can be
     annotated into a field that is not there, and asking the Verifier
     to read a document would produce a fact with no home. The one
     route that survives is the one whose whole purpose is to propose
     the missing shape's vocabulary — and where the base route is not
     that, the answer is a decision for the repository owner. */
  if (gap.recommended_data_location?.shape_exists === false && route !== 'taxonomy_proposal') {
    overrides.push('shape_exists is false');
    reasons.push('Overridden: the recommended home does not exist in the schema, so there is no field to write into and nothing an agent may propose. Structural change is never Class B (docs/AGENT-ROLES.md §4).');
    route = 'owner_decision';
  }

  /* OVERRIDE 2 — THERE IS NOTHING TO ANNOTATE.
     A `data_proposal` is only ever the note, and a note needs a
     record that exists and a provenance-note field on it. Where the
     gap is that a record is ABSENT — no enforcement action under an
     act at all — there is nothing to attach a note to, and creating
     the record means authoring a decision. That is the Verifier's. */
  if (route === 'data_proposal' && !target?.annotatable) {
    overrides.push(`no annotatable record: ${target?.why ?? 'the gap names no existing record carrying a provenance note field'}`);
    reasons.push(`Overridden: ${target?.why ?? 'the gap names no existing record carrying a provenance note field'}. Creating the record the gap is about means authoring a legal fact, which is the Verifier\'s work and then a human\'s.`);
    route = 'verifier';
  }

  return { route, why: reasons.join(' '), recipient: GAP_ROUTE_RECIPIENT[route], overrides };
}

/**
 * Group a run's routed gaps for reporting.
 *
 * Every route appears, including the ones nothing took. A route with
 * no gaps is a result — the same distinction `agent/depth/` draws
 * between "looked and found nothing" and "did not look".
 */
export function censusOf(routed) {
  const by_route = {};
  for (const r of GAP_ROUTES) by_route[r] = routed.filter((x) => x.route === r).length;
  return by_route;
}
