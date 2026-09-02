/* ============================================================
   agent/detector/impact.mjs — what a confirmed change reaches, and
   which half of it a machine may act on

   SESSION 10's brief, in its own terms: for every confirmed change
   identify the affected dataset, instrument, timeline, compliance
   calendar, comparison views, applicability logic, evidence
   displays, glossary relationships and potentially stale analytical
   pages; separate FACTUAL from EDITORIAL impact; a factual impact
   MAY become automatically actionable, an editorial impact MUST
   become a review proposal unless governance explicitly permits
   otherwise.

   THREE THINGS THIS MODULE IS BUILT AROUND.

   1 · THE REACH IS A GRAPH TRAVERSAL, NOT A LOOKUP. `graph.mjs`
       derives every edge in the corpus from the ids the records
       actually hold. This module walks INBOUND from the changed
       records — "what depends on this", never "what does this point
       at" — to a stated depth, and every reached node carries its
       hop count and the field that reached it, so a reviewer can
       tell a direct dependency from one two rooms away.

   2 · THE SPLIT IS ABOUT WHAT CAN BE PROVED WRONG, and it is not a
       judgement made here. `fields.mjs` owns it and states the line:
       factual where something in this repository can prove the field
       wrong, editorial where nothing can. This module applies it.

   3 · THE INTERESTING FACTUAL CASE IS THE ONE WHERE THERE IS NOTHING
       TO DO. This site derives at render time rather than storing:
       evidence grades, the enforcement pipeline, competent authority
       and key dates are computed from the datasets whenever a page
       is opened. So when a timeline date is corrected, the compliance
       calendar, the status strips and the pipeline stages are
       already right — no edit, nowhere. THAT is the impact a machine
       may action automatically, and the action is none. Saying so is
       worth more than a list of files, because the alternative is a
       reviewer hand-checking seven views that cannot be wrong.

       The factual impact that is NOT free is the second home: a
       stored value somewhere else restating the one that moved.
       Those go to review like everything else.

   AND THE EDITORIAL HALF IS EVIDENCED, NOT ASSERTED. A prose field
   is reported as stale only where the OLD VALUE can be found in the
   sentence — quoted, with its offset, so a reviewer can check it in
   one keystroke. Where a record's prose depends on the change but
   says nothing quotable, that is reported as an open question in the
   record's own words rather than as a finding. "This paragraph might
   be wrong" and "this paragraph says 25 May 2018" are different
   claims and this module does not let the second stand in for the
   first.

   NOTHING HERE WRITES. Not to `data/`, not anywhere. The output is a
   finding about the site, and what to do about it is a DataProposal
   behind an ApprovalRequest, which this agent does not write.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { REPO_ROOT } from '../schemas/types.mjs';
import { graph, dependents, subgraph, markupMentions, referenceFieldsByKind, HOME_OF } from './graph.mjs';
import { fieldsOf, isProvenanceField } from './fields.mjs';

const JS_DIR = join(REPO_ROOT, 'js');

/* =========================================================
   1 · THE VIEW REGISTER — which module is which surface
   ========================================================= */

/**
 * The nine surfaces the brief names, plus `other`.
 *
 * `other` is not a wastebasket, it is a refusal to pretend. The site
 * has surfaces the brief's nine do not cover — the enforcement
 * table, the institutional map, the masthead, the status strips —
 * and folding them into the nearest of the nine would report an
 * impact on the compliance calendar that is really an impact on the
 * enforcement page. They are reported under their own name.
 */
export const SURFACE_KINDS = [
  'dataset', 'instrument', 'timeline', 'compliance_calendar', 'comparison',
  'applicability', 'evidence', 'glossary', 'analytical_page', 'other',
];

/**
 * Every module in `js/`, and which surface it is.
 *
 * A JUDGEMENT, IN ONE PLACE, WITH A REASON PER ENTRY — the same
 * shape `classify.mjs`'s transition table takes, and for the same
 * reason: a different assignment gives a different answer on the
 * same corpus, so it has to be readable rather than scattered
 * through conditions. The suite asserts it covers every module in
 * `js/` exactly once, so a new view cannot be added without somebody
 * deciding what it is.
 *
 * `not_a_view` is a separate answer from `other`: the data gateway,
 * the derivation modules and the chrome render nothing of their own,
 * and counting them as surfaces would put `js/format.js` in the
 * impact map of every change ever detected.
 */
export const MODULE_SURFACE = {
  'applies.js': { surface: 'applicability', why: 'The applicability engine. It evaluates data/applicability.json against what a reader tells it and renders the outcome with its rationale.' },
  'calendar.js': { surface: 'compliance_calendar', why: 'The regulatory calendar — data/timeline.json rendered as the dated obligations a reader schedules around. Annex A of the brief.' },
  'dna.js': { surface: 'comparison', why: 'The DNA grid: eleven dimensions across the acts, side by side. The comparison view in its purest form.' },
  'pyramid.js': { surface: 'comparison', why: 'The hierarchy of acts by scope class — a comparison whose axis is rank rather than dimension.' },
  'interactions.js': { surface: 'comparison', why: 'How two acts interact, from data/instruments.json relationships. A comparison of pairs.' },
  'instruments-page.js': { surface: 'comparison', why: 'The instruments table: every act against the same columns. instruments.html is the comparison page.' },
  'evidence.js': { surface: 'evidence', why: 'The in-brief evidence apparatus — the claim records, their sources and the derived grade, in the dialog a reader opens from a sentence.' },
  'evidence-view.js': { surface: 'evidence', why: 'The shared source list, grade chip and freshness line every evidence display is built from.' },
  'bibliography.js': { surface: 'evidence', why: 'The bibliography: data/sources.json as the reader-facing account of what the site stands on.' },
  'glossary-graph.js': { surface: 'glossary', why: 'The glossary and the graph of related_terms between its entries. The one view that renders term-to-term relationships.' },
  'instrument-page.js': { surface: 'instrument', why: 'One act, rendered whole — instrument.html. The instrument surface\'s own view.' },
  'enforcement-page.js': { surface: 'other', label: 'enforcement', why: 'The enforcement table and the eight-stage pipeline. Not one of the brief\'s nine, and reported under its own name rather than folded into the nearest.' },
  'institutions-page.js': { surface: 'other', label: 'institutions', why: 'The institutional map and the competence edges. Not one of the brief\'s nine.' },
  'masthead.js': { surface: 'other', label: 'masthead', why: 'The front-page masthead: the counts and the nearest dates a reader sees first. Not one of the nine, and the first thing a stale date shows up in.' },
  'status.js': { surface: 'other', label: 'status strips', why: 'The per-act status strips inside the brief. Not one of the nine.' },
  'data.js': { surface: null, why: 'The single data gateway. It fetches and indexes; it renders nothing.' },
  'format.js': { surface: null, why: 'Derivation and formatting — evidenceGrade, the tier→grade map, date rendering. Renders nothing of its own, and appears in every view.' },
  'pipeline.js': { surface: null, why: 'The eight-stage enforcement derivation. Computes; renders nothing.' },
  'filters.js': { surface: null, why: 'Shared filter controls. Chrome for a view rather than a view.' },
  'dialog.js': { surface: null, why: 'The dialog primitive. Chrome.' },
  'main.js': { surface: null, why: 'The boot sequence for index.html. Starts views; is not one.' },
  'boot.js': { surface: null, why: 'Starts the shell and the palette on every page. Chrome, and surfaces.mjs already counts what it reaches apart.' },
  'shell.js': { surface: null, why: 'The site chrome, rendered on every page from one nav model.' },
  'palette.js': { surface: null, why: 'The command palette. Chrome — site-wide discoverability, which surfaces.mjs carries as a caveat rather than as a page.' },
  'search.js': { surface: null, why: 'The palette\'s entity index. Reached only through the chrome.' },
};

/**
 * `js/data.js`'s `index()` builds the reverse indexes every view
 * reads, and the key a module touches is the best evidence of what
 * it renders. This maps each key onto the node kind it holds.
 *
 * The KEYS are not listed here — they are read out of `js/data.js`
 * itself by `indexKeys()`, so this register cannot claim a key the
 * gateway does not build, and the suite fails if the gateway grows
 * one nothing here maps.
 */
export const INDEX_KEY_KIND = {
  instrument: 'instrument',
  provision: 'provision',
  provisionOwner: 'provision',
  institution: 'institution',
  source: 'source',
  claim: 'claim',
  claimsByPart: 'claim',
  event: 'timeline_event',
  eventsByInstrument: 'timeline_event',
  term: 'glossary_term',
  taxonomy: 'taxonomy_term',
  relationship: 'relationship',
};

/** The keys `js/data.js` actually builds, read from its own
 *  `index()`. One home for the vocabulary; this module is a
 *  consumer of it, never a second copy. */
export function indexKeys({ root = REPO_ROOT } = {}) {
  const src = readFileSync(join(root, 'js', 'data.js'), 'utf8');
  const body = /export function index\(db\)\s*{\s*const ix = {([\s\S]*?)\n  };/.exec(src);
  if (!body) return [];
  return [...body[1].matchAll(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map((m) => m[1]);
}

/**
 * What each module renders, derived from the code: the index keys it
 * reads and the datasets it takes off `db` directly.
 *
 * Two shapes because the site uses two. Most views are handed the
 * built index (`ix.event`, `IX.instrument`); a few read a dataset
 * straight off the loaded bundle (`db.enforcement`,
 * `db.applicability`) because `index()` builds no map for it. Both
 * are call sites, and reading both is what keeps this from needing a
 * hand-kept table of who renders what.
 */
export function moduleKinds({ root = REPO_ROOT } = {}) {
  const keys = new Set(indexKeys({ root }));
  const out = new Map();
  for (const name of Object.keys(MODULE_SURFACE)) {
    let src;
    try { src = readFileSync(join(JS_DIR, name), 'utf8'); } catch { continue; }
    const kinds = new Set();
    const datasets = new Set();
    for (const m of src.matchAll(/\b(?:IX|ix|index)\.([a-zA-Z][a-zA-Z0-9]*)/g)) {
      if (!keys.has(m[1])) continue;              // a local of the module's own, not a gateway index
      const kind = INDEX_KEY_KIND[m[1]];
      if (kind) kinds.add(kind);
    }
    for (const m of src.matchAll(/\bdb\.([a-z][a-zA-Z0-9]*)/g)) datasets.add(`data/${m[1]}.json`);
    out.set(name, { kinds, datasets });
  }
  return out;
}

/** Does this module render records of this kind? Either it reads the
 *  index map for that kind, or it reads the dataset the kind lives
 *  in off `db` directly. */
function moduleRenders(entry, kind) {
  if (!entry) return false;
  if (entry.kinds.has(kind)) return true;
  const home = HOME_OF[kind];
  return Boolean(home && entry.datasets.has(home));
}

/* =========================================================
   2 · READING THE OLD VALUE OUT OF A SENTENCE
   ========================================================= */

/** The month names `js/format.js` renders dates with, read from that
 *  file rather than restated here. `humanDate` is the site's one home
 *  for turning an ISO date into English and a second copy of its
 *  vocabulary would drift from it. */
export function monthNames({ root = REPO_ROOT } = {}) {
  const src = readFileSync(join(root, 'js', 'format.js'), 'utf8');
  const m = /const MONTHS = \[([\s\S]*?)\];/.exec(src);
  if (!m) return [];
  return [...m[1].matchAll(/'([A-Za-z]+)'/g)].map((x) => x[1]);
}

/**
 * Every date a sentence contains, normalised to ISO.
 *
 * A READER OF PROSE, NOT A SECOND RENDERER. It deliberately does not
 * reimplement `humanDate`: it accepts every ordering a person might
 * have typed — "25 May 2018", "May 25, 2018", "May 2018",
 * "2018-05-25" — which is strictly wider than what the site produces,
 * because the prose in `data/` was written by hand and is not
 * constrained to the site's own formatting.
 *
 * @returns {Array<{iso:string, text:string, index:number}>}
 */
export function datesIn(text, months) {
  if (!text || !months.length) return [];
  const M = months.join('|');
  const num = (name) => String(months.indexOf(name) + 1).padStart(2, '0');
  const out = [];
  const push = (iso, text2, index) => out.push({ iso, text: text2, index });

  for (const m of String(text).matchAll(new RegExp(`\\b(\\d{1,2})\\s+(${M})\\s+(\\d{4})\\b`, 'g'))) {
    push(`${m[3]}-${num(m[2])}-${String(m[1]).padStart(2, '0')}`, m[0], m.index);
  }
  for (const m of String(text).matchAll(new RegExp(`\\b(${M})\\s+(\\d{1,2}),\\s*(\\d{4})\\b`, 'g'))) {
    push(`${m[3]}-${num(m[1])}-${String(m[2]).padStart(2, '0')}`, m[0], m.index);
  }
  for (const m of String(text).matchAll(new RegExp(`\\b(${M})\\s+(\\d{4})\\b`, 'g'))) {
    push(`${m[2]}-${num(m[1])}`, m[0], m.index);
  }
  for (const m of String(text).matchAll(/\b(\d{4}-\d{2}(?:-\d{2})?)\b/g)) {
    push(m[1], m[0], m.index);
  }
  return out;
}

/**
 * Does this sentence say the thing that moved?
 *
 * Three ways a value can appear in prose, and each is checked
 * against what the value IS rather than against what it looks like:
 *
 *   a date        any rendering of the same calendar day. Compared at
 *                 the precision the prose states — prose saying
 *                 "May 2018" matches an ISO "2018-05-25", because the
 *                 sentence is about that month.
 *   a taxonomy id the term's LABEL, from data/taxonomy.json. Prose
 *                 says "Applicable", never "status:applicable".
 *   anything else the literal string, on a token boundary.
 *
 * @returns {Array<{quote:string, matched:string, index:number, how:string}>}
 */
export function proseMentions(text, value, { months = [], labels = [] } = {}) {
  if (!text || value === null || value === undefined) return [];
  const s = String(text);
  const v = String(value);
  const hits = [];
  const quote = (i, len) => s.slice(Math.max(0, i - 60), Math.min(s.length, i + len + 60)).replace(/\s+/g, ' ').trim();

  if (/^\d{4}-\d{2}(-\d{2})?$/.test(v)) {
    for (const d of datesIn(s, months)) {
      /* A prose date less precise than the value still refers to it:
         "May 2018" is about 2018-05-25. The reverse is not assumed. */
      if (d.iso === v || v.startsWith(`${d.iso}-`) || d.iso.startsWith(`${v}-`)) {
        hits.push({ quote: quote(d.index, d.text.length), matched: d.text, index: d.index, ambiguous: false, how: 'a date in the sentence resolves to the value that moved' });
      }
    }
    return hits;
  }

  const needles = [{ text: v, ambiguous: false }, ...labels.map((l) => (typeof l === 'string' ? { text: l, ambiguous: false } : l))]
    .filter((n) => n?.text);
  for (const n of needles) {
    const esc = n.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const m of s.matchAll(new RegExp(`(^|[^A-Za-z0-9])(${esc})([^A-Za-z0-9]|$)`, 'gi'))) {
      const at = m.index + m[1].length;
      hits.push({
        quote: quote(at, n.text.length),
        matched: m[2],
        index: at,
        ambiguous: n.ambiguous === true,
        how: n.text === v
          ? 'the sentence contains the value that moved, verbatim'
          : `the sentence contains "${n.text}", which is how data/taxonomy.json labels the value that moved`,
      });
    }
  }
  return hits;
}

/**
 * Is a taxonomy label distinguishable from ordinary English?
 *
 * THIS IS WHY THE FIRST VERSION OF THIS MODULE WAS WRONG, AND IT IS
 * WORTH THE PARAGRAPH. `status:applicable` is labelled "Applicable"
 * in `data/taxonomy.json`. Searching prose for that label finds "The
 * DMA becomes applicable." and "Directly applicable" — sentences
 * about a different act entirely, in which the word is doing
 * ordinary work. Reported as editorial findings, they are false, and
 * a review list with false entries in it is a review list nobody
 * finishes.
 *
 * The test is derived rather than guessed, and it is the obvious
 * one: **does the label appear in prose on records that do not carry
 * the term?** If it does, a string match cannot tell the term from
 * the word, and this module says so instead of choosing. A
 * distinctive label — "Partly applicable", "In force, not yet
 * applicable" — passes, and its matches stand as findings.
 *
 * An ambiguous label does not silence the finding. It moves it to
 * `open_questions`, with the sentence attached, which is the honest
 * shape: here is a sentence containing the word, and whether it is
 * about the status is a reading this module does not make.
 *
 * @returns {{ambiguous:boolean, why:string, examples:string[]}}
 */
export function labelAmbiguity(G, termId, label) {
  const esc = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^A-Za-z0-9])(${esc})([^A-Za-z0-9]|$)`, 'i');
  const refFields = referenceFieldsByKind(G);
  const examples = [];

  for (const node of G.nodes.values()) {
    if (node.kind === 'taxonomy_term') continue;          // the term's own home
    const carries = (G.outbound.get(node.id) ?? []).some((e) => e.to === termId);
    if (carries) continue;                                 // it may legitimately say so
    for (const f of fieldsOf(node.record, {
      kind: node.kind, isNode: (x) => G.nodes.has(x),
      referenceFields: refFields.get(node.kind) ?? new Set(), rootId: node.id,
    })) {
      if (f.class !== 'prose') continue;
      for (const v of f.values) {
        if (typeof v === 'string' && re.test(v)) {
          examples.push(`${node.id}.${f.field}`);
          break;
        }
      }
      if (examples.length >= 3) break;
    }
    if (examples.length >= 3) break;
  }

  if (!examples.length) {
    return {
      ambiguous: false,
      why: `"${label}" does not appear in prose on any record that does not carry ${termId}, so a match for it in a sentence is evidence about the term rather than about the English language.`,
      examples: [],
    };
  }
  return {
    ambiguous: true,
    why: `"${label}" is how data/taxonomy.json labels ${termId} AND is ordinary English: it appears in prose on records that do not carry the term at all (${examples.join(', ')}${examples.length >= 3 ? ', and others' : ''}). A string match cannot tell the two apart, so matches for it are reported as open questions with the sentence attached rather than as findings.`,
    examples,
  };
}

/* =========================================================
   3 · GOVERNANCE — what may be done without a human
   ========================================================= */

/**
 * The permits under which an editorial impact could be actioned
 * without a review proposal.
 *
 * IT IS EMPTY, AND THAT IS THE FINDING RATHER THAN AN OMISSION.
 * The brief says an editorial impact must become a review proposal
 * "unless governance explicitly permits otherwise", so the mechanism
 * has to exist and has to be read from somewhere. It is read from
 * here, and nothing in `docs/` puts anything in it:
 *
 *   · AUTONOMY-POLICY Class C names "any change to the brief's prose
 *     in index.html, including the matching superseded declarations
 *     in every affected locale" — pull request and human approval.
 *   · Class B's own test is "if a human would need to check a source
 *     to know whether the change is right, it is not Class B", and
 *     every editorial impact here is downstream of a document
 *     somebody has to read.
 *   · AI-SAFE-BOUNDARIES §3 makes a provenance field red tier
 *     whatever else is true.
 *
 * An entry would be `{ dataset, field, granted_by, scope }` naming
 * the document that granted it. The gate reads this list; it does
 * not have a special case for being empty, so a permit added later
 * takes effect without the gate being rewritten — which is the only
 * way "unless governance permits" can be implemented honestly.
 */
export const GOVERNANCE_PERMITS = [];

export const ROUTES = ['propagates_by_derivation', 'review_proposal', 'human_only'];

/**
 * Where one impact goes.
 *
 * @param {{field_class:string, dataset:string, field:string,
 *          restates_old_value:boolean, permits?:Array}} q
 * @returns {{route:string, automatically_actionable:boolean, why:string}}
 */
export function routeOf({ field_class, dataset, field, restates_old_value, permits = GOVERNANCE_PERMITS }) {
  if (isProvenanceField(dataset, field)) {
    return {
      route: 'human_only',
      automatically_actionable: false,
      why: `"${field}" is one of the provenance fields PROVENANCE_FIELDS in agent/integrate/canonical.mjs protects — when a record was checked, by whom, and what is still open about it. Touching one is red tier under AI-SAFE-BOUNDARIES §3 whatever the rest of this assessment says, because an agent that can edit the record of what was verified can make an unverified record look verified.`,
    };
  }

  if (field_class === 'prose') {
    const permit = permits.find((p) => p.dataset === dataset && p.field === field);
    if (permit) {
      return {
        route: 'review_proposal',
        automatically_actionable: true,
        why: `Editorial, and ${permit.granted_by} explicitly permits it to be actioned within ${permit.scope}. The proposal is still written; the permit is what lets it be applied without a further human decision.`,
      };
    }
    return {
      route: 'review_proposal',
      automatically_actionable: false,
      why: 'Editorial. Nothing in this repository can prove the sentence wrong, so nothing can prove a rewrite of it right — and GOVERNANCE_PERMITS is empty, which is the state docs/AUTONOMY-POLICY.md leaves it in: prose is Class C, and Class B\'s own test is that a change a human would have to check a source to validate is not Class B. It becomes a review proposal.',
    };
  }

  if (restates_old_value) {
    return {
      route: 'review_proposal',
      automatically_actionable: false,
      why: `Factual, and NOT free: "${field}" stores the value that moved a second time. One home per fact is the rule this corpus is built on, and where it is broken the second copy has to be edited alongside the first — an edit to a canonical value, which is Class C.`,
    };
  }

  return {
    route: 'propagates_by_derivation',
    automatically_actionable: true,
    why: `Factual, and there is nothing to do. "${field}" points at the changed record rather than restating it, and this site derives at render time rather than storing — so once the changed record is corrected, everything downstream of this reference recomputes when a page is next opened. The automatically actionable answer here is "no edit anywhere", which is worth stating because the alternative is a reviewer hand-checking views that cannot be wrong.`,
  };
}

/**
 * The impact subgraph, cut down to something a trace event may
 * carry.
 *
 * `agent/observability/redact.mjs` caps a stored string at 8000
 * characters, with the comment "a trace field is evidence, not a
 * payload dump". That cap is right, and a two-hop subgraph of this
 * corpus is a payload dump — 175 nodes and several hundred edges.
 * The first version of this module inlined the whole thing and the
 * store truncated it mid-JSON, which parses as nothing at all: the
 * observability view then showed a graph of zero nodes for a change
 * that reached a hundred and seventy-five records. A cap silently
 * producing a confident zero is exactly the failure this repository
 * is built to refuse.
 *
 * So the trace carries the SHAPE and the IDENTITY: the roots, the
 * counts per depth, the direct dependencies in full, and a sha256 of
 * the complete graph. `dropped_edges` and `dropped_nodes` say what
 * is not here. The complete graph is the ImpactAssessment record's
 * `factual` array — every reached node with the field and hop that
 * reached it — which is the edge list in the contract's own terms
 * and needs no second copy.
 *
 * @returns {{roots:string[], counts:object, nodes:object[],
 *            edges:object[], dropped_nodes:number,
 *            dropped_edges:number, sha256:string, note:string}}
 */
export function graphPreview(sub, { maxBytes = 7000 } = {}) {
  const sha256 = createHash('sha256').update(JSON.stringify(sub)).digest('hex');
  const byDepth = {};
  for (const n of sub.nodes) byDepth[n.depth] = (byDepth[n.depth] ?? 0) + 1;

  /* Nearest first: a direct dependency is what a reviewer needs, and
     it is the part a cap must never be allowed to eat. */
  const nodes = [...sub.nodes].sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  const rootSet = new Set(sub.roots);
  const edges = [...sub.edges].sort((a, b) => (rootSet.has(b.to) ? 1 : 0) - (rootSet.has(a.to) ? 1 : 0));

  const build = (nn, ee, droppedN, droppedE) => ({
    roots: sub.roots,
    counts: { nodes: sub.nodes.length, edges: sub.edges.length, by_depth: byDepth },
    nodes: nn, edges: ee,
    dropped_nodes: droppedN, dropped_edges: droppedE,
    sha256,
    note: droppedN || droppedE
      ? `Shape and identity only. ${droppedN} node(s) and ${droppedE} edge(s) are not in this preview because agent/observability/redact.mjs caps a stored string at 8000 characters — a trace field is evidence, not a payload dump. The complete graph is the ImpactAssessment record's factual array, where every reached node carries the field and the hop that reached it; sha256 above is over the whole subgraph, so a preview can be checked against it.`
      : 'The complete subgraph. Nothing was dropped to fit the trace store\'s string cap.',
  });

  let nn = nodes;
  let ee = edges;
  let out = build(nn, ee, 0, 0);
  while (JSON.stringify(out).length > maxBytes && (ee.length || nn.length)) {
    if (ee.length > nn.length) ee = ee.slice(0, Math.max(0, Math.floor(ee.length * 0.7)));
    else nn = nn.slice(0, Math.max(0, Math.floor(nn.length * 0.7)));
    out = build(nn, ee, nodes.length - nn.length, edges.length - ee.length);
  }
  return out;
}

/* =========================================================
   4 · THE IMPACT MAP
   ========================================================= */

const EMPTY_SURFACE = () => ({ entries: [], pages: [], modules: [] });

/**
 * Everything one confirmed change reaches.
 *
 * @param {{change:object, corpus?:object, depth?:number,
 *          root?:string, g?:object}} opts
 *   `change` is a `RegulatoryChange` — or anything carrying
 *   `affected_entities`, `attribute` and `old_value`, which is what
 *   this reads.
 *
 * @returns {object} the assessment, as plain JSON.
 */
export function mapImpact({ change, depth = 2, root = REPO_ROOT, g = null } = {}) {
  const G = g ?? graph({ root });
  const refFields = referenceFieldsByKind(G);
  const months = monthNames({ root });
  const mods = moduleKinds({ root });

  const rootIds = (change.affected_entities ?? []).map((e) => e?.id).filter(Boolean);
  const known = rootIds.filter((id) => G.nodes.has(id));
  const unknown = rootIds.filter((id) => !G.nodes.has(id));

  const reached = dependents(G, known, { depth });
  const caveats = [];

  if (unknown.length) {
    caveats.push(`${unknown.join(', ')} ${unknown.length === 1 ? 'is' : 'are'} named by the change and ${unknown.length === 1 ? 'is' : 'are'} not a record in data/. Nothing downstream of ${unknown.length === 1 ? 'it' : 'them'} could be walked, so this map is silent about ${unknown.length === 1 ? 'that entity' : 'those entities'} rather than empty about it. A NEW instrument is the expected case.`);
  }
  if (!known.length) {
    caveats.push('The change names no entity this graph holds, so its reach could not be computed at all. That is an absence of an answer, not an answer of "nothing".');
  }

  /* --- taxonomy labels for the old value, so prose can be searched
         for what a reader would actually have read ---------------- */
  const oldValue = change.old_value ?? null;
  const labels = [];
  let labelNote = null;
  if (oldValue && G.nodes.has(String(oldValue))) {
    const t = G.nodes.get(String(oldValue));
    if (t.kind === 'taxonomy_term' && t.record?.label) {
      const amb = labelAmbiguity(G, t.id, t.record.label);
      labels.push({ text: t.record.label, ambiguous: amb.ambiguous });
      labelNote = amb.why;
    }
  }

  /* --- every reached record, field by field ------------------------ */
  const factual = [];
  const editorial = [];
  const unquotedProse = [];

  /* THE CHANGED RECORD IS SCANNED TOO, AT DEPTH 0. Its own prose is
     the likeliest place a stale sentence is: `timeline.events[].
     supersedes` holds "Originally 2 August 2027; deferred by the AI
     Omnibus." on the very event whose date moved. A map that walked
     only outwards would report every record that cites the event and
     miss the sentence sitting on it. It carries no factual impact —
     the changed field is the change, not something downstream of
     it. */
  const scan = new Map([...reached]);
  for (const id of known) {
    if (!scan.has(id)) scan.set(id, { node: G.nodes.get(id), depth: 0, via: [] });
  }

  for (const [id, hit] of scan) {
    const node = hit.node;
    const viaFields = [...new Set(hit.via.map((v) => v.field))];
    const fields = fieldsOf(node.record, {
      kind: node.kind,
      isNode: (x) => G.nodes.has(x),
      referenceFields: refFields.get(node.kind) ?? new Set(),
      rootId: node.id,
    });

    /* the factual half: the fields that actually carry the edge */
    for (const field of viaFields) {
      const spec = fields.find((f) => f.field === field || f.field === `${field}.id`) ?? { class: 'reference' };
      /* A second home: a field that both points at the changed
         record AND holds the value that moved would be a stored
         copy. References hold ids, so this is normally false — and
         where it is true it is a data-governance finding. */
      const restates = oldValue !== null && spec.class !== 'reference'
        && (spec.values ?? [spec.value]).some((v) => String(v ?? '') === String(oldValue));
      const route = routeOf({
        field_class: spec.class, dataset: node.dataset, field,
        restates_old_value: restates,
      });
      factual.push({
        node_id: id, kind: node.kind, dataset: node.dataset, field,
        field_class: spec.class, depth: hit.depth,
        via: hit.via.filter((v) => v.field === field).map((v) => ({ from: v.from, to: v.to, path: v.path, via_wildcard: v.via_wildcard })),
        restates_old_value: restates,
        ...route,
      });
    }

    /* the editorial half: prose on the same record */
    for (const f of fields) {
      if (f.class !== 'prose') continue;
      const all = f.values.flatMap((v) => proseMentions(v, oldValue, { months, labels }));
      /* A match through an ambiguous label is a sentence containing
         a word, not a finding. It keeps its quote and becomes an
         open question below. */
      const mentions = all.filter((m) => !m.ambiguous);
      const weak = all.filter((m) => m.ambiguous);
      if (mentions.length) {
        editorial.push({
          node_id: id, kind: node.kind, dataset: node.dataset, field: f.field,
          depth: hit.depth,
          established: true,
          quote: mentions[0].quote,
          matched: mentions[0].matched,
          how: mentions[0].how,
          occurrences: mentions.length,
          what_it_asserts: f.why,
          ...routeOf({ field_class: 'prose', dataset: node.dataset, field: f.field, restates_old_value: false }),
        });
      } else if (weak.length) {
        unquotedProse.push({
          node_id: id, kind: node.kind, dataset: node.dataset, field: f.field,
          depth: hit.depth,
          established: false,
          quote: weak[0].quote,
          question: `Is "${node.id}".${f.field} describing the value that moved, or using the same word?`,
          missing: `${labelNote ?? 'The match is through a taxonomy label that is also ordinary English.'} The sentence is quoted so a human can decide in one reading; this module does not decide it.`,
          what_it_asserts: f.why,
        });
      } else if (hit.depth <= 1 && f.values.some((v) => typeof v === 'string' && v.length > 0)) {
        /* Depth 0 and 1 only. The changed record's own prose, and
           prose on records that reference it directly, are ABOUT it;
           two hops out, "this sentence might depend on it" is true of
           most of the corpus and reporting it would drown the
           findings that are quotable. */
        unquotedProse.push({
          node_id: id, kind: node.kind, dataset: node.dataset, field: f.field,
          depth: hit.depth,
          established: false,
          question: `Does "${node.id}".${f.field} still read true after this change?`,
          missing: `The old value does not appear in the sentence, so nothing here establishes that it is stale. ${hit.depth === 0 ? 'The sentence sits on the record that changed' : 'The record references the changed record directly'}, so it may be — and no check in this repository reads prose, which is why this is an open question rather than either a finding or a clearance.`,
          what_it_asserts: f.why,
        });
      }
    }
  }

  /* --- the nine surfaces ------------------------------------------- */
  const surfaces = Object.fromEntries(SURFACE_KINDS.map((k) => [k, EMPTY_SURFACE()]));
  const reachedKinds = new Set([...reached.values()].map((h) => h.node.kind));
  for (const id of known) reachedKinds.add(G.nodes.get(id).kind);
  const reachedDatasets = new Set([...reachedKinds].map((k) => HOME_OF[k]).filter(Boolean));

  /* the data surfaces: read straight off what was reached */
  surfaces.dataset.entries = [...reachedDatasets].sort().map((d) => ({ id: d, why: 'A record in this file depends on the changed record, or is it.' }));

  const entriesOfKind = (kind) => [
    ...known.filter((id) => G.nodes.get(id).kind === kind).map((id) => ({ id, depth: 0, why: 'The changed record itself.' })),
    ...[...reached.entries()].filter(([, h]) => h.node.kind === kind)
      .map(([id, h]) => ({ id, depth: h.depth, why: `Reaches the change through ${[...new Set(h.via.map((v) => v.field))].join(', ')}.` })),
  ];

  surfaces.instrument.entries = [...entriesOfKind('instrument'), ...entriesOfKind('provision'), ...entriesOfKind('relationship')];
  surfaces.timeline.entries = entriesOfKind('timeline_event');
  /* THE CALENDAR IS THE TIMELINE SEEN THROUGH A CLOCK. It renders the
     same events, filtered to upcoming or past against
     `new Date()` — so which of them a reader is shown depends on when
     and where the page is opened (docs/AUDIT-2026-09-01.md F-15). The
     events are named here; which side of the horizon each falls on is
     not, because this map would be asserting something about the
     reader's clock. */
  surfaces.compliance_calendar.entries = surfaces.timeline.entries.map((e) => ({
    ...e,
    why: `${e.why} js/calendar.js renders it as a dated obligation, with its obligation and required_action prose verbatim. Whether a reader sees it depends on the horizon filter, which compares against their own clock.`,
  }));
  surfaces.applicability.entries = entriesOfKind('applicability_rule');
  surfaces.evidence.entries = [...entriesOfKind('claim'), ...entriesOfKind('source')];
  surfaces.glossary.entries = entriesOfKind('glossary_term');

  /* GLOSSARY RELATIONSHIPS, specifically. The brief asks for the
     relationships, not the terms: a term reached through
     `related_terms` is reached because another term says it is
     related, and that edge is the thing the glossary graph draws. */
  const glossaryEdges = G.edges.filter((e) => e.field === 'related_terms'
    && (surfaces.glossary.entries.some((x) => x.id === e.from) || surfaces.glossary.entries.some((x) => x.id === e.to)));
  surfaces.glossary.relationships = glossaryEdges.map((e) => ({ from: e.from, to: e.to }));

  /* the view surfaces: a module renders a kind that was reached */
  for (const [name, entry] of mods) {
    const spec = MODULE_SURFACE[name];
    if (!spec?.surface) continue;
    const renders = [...reachedKinds].filter((k) => moduleRenders(entry, k));
    if (!renders.length) continue;
    const bucket = surfaces[spec.surface];
    bucket.modules.push({ module: `js/${name}`, renders: renders.sort(), label: spec.label ?? null, why: spec.why });
    for (const [page, list] of G.render.pageToModules ?? []) {
      if (list.has(name) && !bucket.pages.includes(page)) bucket.pages.push(page);
    }
  }
  for (const k of SURFACE_KINDS) surfaces[k].pages.sort();

  /* --- potentially stale analytical pages -------------------------- */
  const parts = new Set();
  for (const [id, h] of reached) {
    if (h.node.kind === 'brief_part') parts.add(id);
    const bp = h.node.record?.brief_part;
    if (bp && G.nodes.has(bp)) parts.add(bp);
  }
  const mentions = markupMentions([...known, ...editorial.map((e) => e.node_id)], { root });
  const stale = new Map();
  for (const [id, pages] of mentions) {
    for (const p of pages) {
      if (!stale.has(p)) stale.set(p, { page: p, named_ids: [], brief_parts: [] });
      stale.get(p).named_ids.push(id);
    }
  }
  if (parts.size) {
    if (!stale.has('index.html')) stale.set('index.html', { page: 'index.html', named_ids: [], brief_parts: [] });
    stale.get('index.html').brief_parts = [...parts].sort();
  }
  surfaces.analytical_page.entries = [...stale.values()].sort((a, b) => a.page.localeCompare(b.page)).map((s) => ({
    id: s.page,
    named_ids: s.named_ids.sort(),
    brief_parts: s.brief_parts,
    why: [
      s.named_ids.length ? `The page's own markup names ${s.named_ids.join(', ')}. That establishes the author wrote the id down, never that the sentence around it is now wrong.` : null,
      s.brief_parts.length ? `A claim reached by this change is attached to ${s.brief_parts.join(', ')}, and the brief's prose in that part is the argument the claim supports.` : null,
      'index.html renders part of its content from the inlined window.__CONTENT__ blob rather than from data/brief.json (CURRENT-ARCHITECTURE §8), so which of the two homes a stale sentence lives in is a question this map does not answer.',
    ].filter(Boolean).join(' '),
  }));
  if (surfaces.analytical_page.entries.length) {
    surfaces.analytical_page.pages = surfaces.analytical_page.entries.map((e) => e.id);
  }

  /* --- caveats the reviewer needs, not the ones that flatter -------- */
  if (unquotedProse.length) {
    const quoted = unquotedProse.filter((q) => q.quote).length;
    caveats.push(`${unquotedProse.length} prose field(s) are carried as open questions rather than as findings${quoted ? `, ${quoted} of them because the only match was through a taxonomy label that is also ordinary English` : ''}. Nothing in this repository reads prose, so "not quotable" is not "checked and clear".`);
    if (labelNote) caveats.push(labelNote);
  }
  if (G.render.unresolved?.length) {
    caveats.push(`${G.render.unresolved.length} page entry module(s) could not be read, so the pages below may be incomplete: ${G.render.unresolved.join('; ')}.`);
  }
  const wildcardVia = factual.filter((f) => f.via.some((v) => v.via_wildcard));
  if (wildcardVia.length) {
    caveats.push(`${wildcardVia.length} impact(s) are reached only through a wildcard reference. tools/validate.mjs treats every wildcard as resolving (docs/AUDIT-2026-09-01.md F-12), so these edges have never been checked by anything.`);
  }
  if (depth < 2) caveats.push(`Walked to depth ${depth}. Anything further from the change than that is outside this map by construction.`);

  return {
    change_id: change.change_id ?? null,
    as_of: change.as_of ?? null,
    roots: known,
    unresolved_roots: unknown,
    depth,
    surfaces,
    factual,
    editorial,
    open_questions: unquotedProse,
    routing: {
      propagates_by_derivation: factual.filter((f) => f.route === 'propagates_by_derivation').length,
      review_proposal: factual.filter((f) => f.route === 'review_proposal').length + editorial.length,
      human_only: [...factual, ...editorial].filter((f) => f.route === 'human_only').length,
      automatically_actionable: [...factual, ...editorial].filter((f) => f.automatically_actionable).length,
    },
    counts: {
      reached_records: reached.size,
      factual_impacts: factual.length,
      editorial_impacts: editorial.length,
      open_questions: unquotedProse.length,
      surfaces_touched: SURFACE_KINDS.filter((k) => surfaces[k].entries.length || surfaces[k].modules.length).length,
    },
    graph: subgraph(G, known, reached),
    caveats,
  };
}
