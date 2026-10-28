/* ============================================================
   The dependency map's derivations.

   docs/V2-DATA-DESIGN.md §4.1 plans this module as the one home of what
   the map derives — read by the pages and by tools/evidence-audit.mjs,
   as js/regulatory-model.js is, so the report and the page cannot
   disagree. It holds only what has been decided so far: an edge's
   modality (v2 Session 12, docs/ROADMAP-v2.md §8, question 1).

   MODALITY. Whether an edge states the law or only a proposal. An edge
   is 'proposed' when the act whose text states it is not yet adopted:
   "Data Omnibus amends GDPR" is true of COM(2025) 837 and of no law in
   force. Which act states it depends on the kind — the locator's holder
   (§1.4): the dependent act for `enables`, the deferring, amending or
   repealing act for `defers-to`, `amends`, `repeals`. An analytical kind
   is stated by no text at all, only by the site's reading, so it is
   proposed when either end is.

   DERIVED, NEVER STORED. An edge changes modality on the day its
   proposal is adopted without anybody editing it. No `modality` field
   may appear in data/ (tools/evidence-audit.mjs DERIVED_FIELDS).
   ============================================================ */

import { PRE_ADOPTION } from './regulatory-model.js';

/* Whose text states the edge, kind by kind: 'from', 'to', or 'either'
   for the analytical kinds, which no text states. A kind missing here
   has no modality (null), and tools/selftest.mjs fails until it is
   given one: a new kind is decided, not guessed. */
export const HOLDER = Object.freeze({
  'rel-kind:enables': 'to',
  'rel-kind:defers-to': 'from',
  'rel-kind:amends': 'from',
  'rel-kind:repeals': 'from',
  'rel-kind:implements': 'from',
  'rel-kind:lex-specialis': 'from',
  'rel-kind:carve-out': 'from',
  'rel-kind:legal-basis': 'to',
  'rel-kind:overlap': 'either',
  'rel-kind:complement': 'either',
  'rel-kind:conflict': 'either',
  'rel-kind:sequence': 'either',
});

const preAdoption = (id, ix) => {
  const i = ix.instrument.get(id);
  return !!i && PRE_ADOPTION.has(i.legislative_status);
};

/**
 * 'law' or 'proposed'; null for a kind with no holder.
 * @param {object} r   the relationship record
 * @param {object} ix  the built index (js/data.js index())
 */
export function modality(r, ix) {
  const holder = HOLDER[r.kind];
  if (!holder) return null;
  const ends = holder === 'either' ? [r.from, r.to] : [r[holder]];
  return ends.some((id) => preAdoption(id, ix)) ? 'proposed' : 'law';
}

/** The kind as a reader sees it: the taxonomy's label, qualified when the
 *  edge is only proposed ("Proposed: amends"), never in the present tense
 *  alone (V2C-01; the wording, docs/ROADMAP-v2.md §8, question 2). */
export function kindText(r, ix, label) {
  return modality(r, ix) === 'proposed' ? 'Proposed: ' + String(label).toLowerCase() : label;
}
