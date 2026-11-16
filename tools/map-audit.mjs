/**
 * tools/map-audit.mjs — the dependency map's edges, checked.
 *
 * V2C-13 (16 Nov 2026), Track R. The relationships of data/instruments.json
 * are the map's edges (decision D-6): not a second graph, and no file of
 * their own. docs/V2-DATA-DESIGN.md §1.5 defines the rules M-08…M-15 that
 * hold them to the standard the claims are held to; §4.1 puts them in a
 * pure module beside register-audit.mjs and trigger-audit.mjs, read by
 * tools/evidence-audit.mjs. M-16 (every relationship_kind term carries
 * `basis`) belongs to tools/validate.mjs, which reads EDGE_BASES from here.
 * The author's decisions of 16 Nov 2026 are in docs/ROADMAP-v2.md §8
 * (V2C-13, decisions 1–4); the measurement is docs/V2C-13-MAP-CHECKS.md.
 *
 *   M-08  every reference is a reference object — a bare source id, the v1
 *         form, is an ERROR (the `edge-v1-sources` backlog was flipped on
 *         16 Nov 2026: 0 bare ids) — with a valid `supports`, and a direct
 *         reference to a tier-1 source carries a structural locator.
 *         Whether a source id RESOLVES is validate.mjs's (M-01); not
 *         duplicated here.
 *   M-09  a summary of at least 20 characters; `last_verified` an ISO date.
 *         A date after the audit date is a property of the date asked, not
 *         of the tree, so a WARNING (VERIFIED_AFTER_AS_OF), as register-audit.mjs
 *         decided on 27 Oct 2026.
 *   M-10  an analytical edge has at least one claim. A frozen, only-shrinks
 *         list names the three that had none on 16 Nov 2026 (BACKLOG
 *         `edge-analytical-no-claim`); any other is an ERROR.
 *   M-11  a textual edge has at least one direct reference with a
 *         structural locator.
 *   M-12  an edge whose stating act is a withdrawn proposal: DEAD_EDGE.
 *   M-13  `enables`: a direct reference whose source is among the TO node's
 *         sources; `defers-to`: among the FROM node's.
 *   M-14  `symmetric: true` only on an analytical kind.
 *   M-15  the instrument arrays (amends, repeals, amended_by,
 *         proposes_to_amend) agree with the relationships: BACKLOG
 *         `edge-second-home`, until the arrays are derived (design §1.4).
 *
 * M-11 and M-13 are ERROR for every edge but the one in
 * TEXTUAL_PARTIAL_BACKLOG, which is BACKLOG `edge-textual-partial` (the
 * author's decision 2): its only reference is supports:partial, because the
 * DSA names a body of law and not the Directive. It is not a defect of that
 * reading and no edge is changed to make a check pass. Closing a backlog is
 * a one-line change to its list, made in the session that does the reading;
 * tools/selftest.mjs W19 holds each list to "still true", so a list only
 * shrinks.
 *
 * An edge whose kind carries no `basis` cannot be classified: M-10, M-11 and
 * M-14 skip it and the report counts it as unclassified — never as passing
 * silently. M-16 (validate.mjs) names the term.
 *
 * Pure: reads the records it is given and the audit date it is given.
 * Nothing here reads the network, the clock or writes anything.
 */

import { index } from '../js/data.js';
import { HOLDER } from '../js/map-model.js';
import { structural } from './register-audit.mjs';

/* one home for the vocabulary of a kind's `basis` (docs/V2-DATA-DESIGN.md
   §1.4): what kind of evidence an edge of that kind needs */
export const EDGE_BASES = Object.freeze(['textual', 'analytical']);

/* BACKLOG, frozen on 16 Nov 2026 (V2C-13, decisions 2 and 3). Only shrinks. */
export const ANALYTICAL_NO_CLAIM_BACKLOG = Object.freeze(['rel-dsa-dma-scope', 'rel-nis2-cer', 'rel-cra-nis2']);
export const TEXTUAL_PARTIAL_BACKLOG = Object.freeze(['rel-dsa-copyright-dsm-defers']);

export const SUPPORTS = Object.freeze(['supports:direct', 'supports:partial', 'supports:context']);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const arr = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

/** `basis` of a kind, read from the taxonomy term; null when the term has none. */
export function edgeBasis(kind, ix) {
  const b = ix.taxonomy.get(kind)?.basis;
  return EDGE_BASES.includes(b) ? b : null;
}

/** The (actor, target, kind) pairs the instrument arrays assert. `proposes_to_amend`
 *  is an amendment and cannot say "repeal": that is part of why the arrays are a second home. */
export function arrayPairs(instruments) {
  const out = [];
  for (const i of instruments) {
    for (const t of arr(i.amends)) out.push({ from: i.id, to: t, kind: 'amends', where: `${i.id}.amends` });
    for (const t of arr(i.repeals)) out.push({ from: i.id, to: t, kind: 'repeals', where: `${i.id}.repeals` });
    for (const t of arr(i.amended_by)) out.push({ from: t, to: i.id, kind: 'amends', where: `${i.id}.amended_by` });
    for (const t of arr(i.proposes_to_amend)) out.push({ from: i.id, to: t, kind: 'amends', where: `${i.id}.proposes_to_amend` });
  }
  return out;
}

/**
 * @param db    the datasets, as js/data.js loadAll() returns them
 * @param asOf  YYYY-MM-DD; M-09's date test reads it, never the clock
 * @returns { errors, warnings, backlog: {code: [ids]}, edges, by_kind, by_basis, unclassified }
 */
export function mapAudit(db, asOf) {
  const errors = [];
  const warnings = [];
  const backlog = { 'edge-analytical-no-claim': [], 'edge-textual-partial': [], 'edge-second-home': [] };
  const ix = index(db);
  const rels = arr(db.instruments?.relationships);
  const instruments = arr(db.instruments?.instruments);
  const byKind = {};
  const byBasis = {};
  const unclassified = [];

  for (const r of rels) {
    const w = `relationships/${r.id}`;
    const basis = edgeBasis(r.kind, ix);
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    byBasis[basis || 'unclassified'] = (byBasis[basis || 'unclassified'] || 0) + 1;
    if (!basis) unclassified.push(r.id);

    /* M-08 · the references */
    const refs = arr(r.sources);
    if (!refs.length) errors.push(`M-08 ${w}: no sources — an edge rests on at least one reference`);
    for (const s of refs) {
      if (typeof s === 'string') { errors.push(`M-08 ${w}: bare source id "${s}" — the v1 form; a reference object {source_id, supports, locator} is required`); continue; }
      if (!isObj(s)) { errors.push(`M-08 ${w}: a reference that is neither an object nor a source id`); continue; }
      if (!SUPPORTS.includes(s.supports)) errors.push(`M-08 ${w}: ${s.source_id} has supports ${JSON.stringify(s.supports)}, none of ${SUPPORTS.join(', ')}`);
      const src = ix.source.get(s.source_id);
      if (s.supports === 'supports:direct' && src && src.tier === 'tier:1' && !structural(s.locator))
        errors.push(`M-08 ${w}: ${s.source_id} is a direct reference to a tier-1 text with no structural locator (${JSON.stringify(s.locator)})`);
    }

    /* M-09 · a summary, and a date */
    if (typeof r.summary !== 'string' || r.summary.trim().length < 20) errors.push(`M-09 ${w}: no summary of at least 20 characters — the edge's note, a sentence a reader can check against the locator`);
    if (!(typeof r.last_verified === 'string' && ISO.test(r.last_verified))) errors.push(`M-09 ${w}: last_verified missing or not a date`);
    else if (asOf && r.last_verified > asOf) warnings.push(`VERIFIED_AFTER_AS_OF ${w}: last_verified ${r.last_verified} is after the audit date ${asOf}`);

    const direct = refs.filter((s) => isObj(s) && s.supports === 'supports:direct');
    const directStructural = direct.filter((s) => structural(s.locator));

    /* M-10 · an analytical edge carries its reading as a claim */
    if (basis === 'analytical' && !arr(r.claims).length) {
      if (ANALYTICAL_NO_CLAIM_BACKLOG.includes(r.id)) backlog['edge-analytical-no-claim'].push(r.id);
      else errors.push(`M-10 ${w}: an analytical edge (${r.kind}) with no claim — the reading is the site's, so it is a claim`);
    }

    /* M-11 and M-13 · a textual edge is stated by the law */
    const problems = [];
    if (basis === 'textual' && !directStructural.length)
      problems.push(`M-11 ${w}: a textual edge (${r.kind}) with no direct reference carrying a structural locator`);
    if (r.kind === 'rel-kind:enables' || r.kind === 'rel-kind:defers-to') {
      /* the act whose text states the edge: the dependent (to) for enables, the deferring (from) for defers-to */
      const holder = r.kind === 'rel-kind:enables' ? r.to : r.from;
      const node = ix.instrument.get(holder);
      if (node && !direct.some((s) => arr(node.sources).includes(s.source_id)))
        problems.push(`M-13 ${w}: ${r.kind.split(':')[1]} with no direct reference among the sources of ${holder}, the act whose text states it`);
    }
    if (problems.length) {
      if (TEXTUAL_PARTIAL_BACKLOG.includes(r.id)) backlog['edge-textual-partial'].push(r.id);
      else errors.push(...problems);
    }

    /* M-12 · an edge stated by a withdrawn proposal */
    const holder = HOLDER[r.kind];
    const stating = holder === 'either' ? [r.from, r.to] : holder ? [r[holder]] : [];
    for (const id of stating) if (ix.instrument.get(id)?.legislative_status === 'status:withdrawn')
      warnings.push(`DEAD_EDGE ${w}: ${id} is withdrawn, and its text is the one that states the edge`);

    /* M-14 · only an analytical kind is symmetric */
    if (r.symmetric === true && basis && basis !== 'analytical') errors.push(`M-14 ${w}: symmetric: true on ${r.kind}, a ${basis} kind — only an analytical edge reads the same from both ends`);
  }

  /* M-15 · the arrays are a second home of the amends and repeals edges */
  const edgePairs = rels.filter((r) => r.kind === 'rel-kind:amends' || r.kind === 'rel-kind:repeals')
    .map((r) => ({ id: r.id, from: r.from, to: r.to, kind: r.kind.split(':')[1] }));
  const arrays = arrayPairs(instruments);
  for (const a of arrays) {
    const same = edgePairs.find((e) => e.from === a.from && e.to === a.to);
    if (!same) backlog['edge-second-home'].push(`${a.where} → ${a.to}: no relationship between ${a.from} and ${a.to}`);
    else if (same.kind !== a.kind) backlog['edge-second-home'].push(`${a.where} → ${a.to}: the array says ${a.kind}, ${same.id} says ${same.kind}`);
  }
  for (const e of edgePairs) {
    if (!arrays.some((a) => a.from === e.from && a.to === e.to && a.kind === e.kind))
      backlog['edge-second-home'].push(`${e.id}: ${e.kind} ${e.to}, and no instrument array says ${e.kind}`);
  }

  return { errors, warnings, backlog, edges: rels.length, by_kind: byKind, by_basis: byBasis, unclassified };
}
