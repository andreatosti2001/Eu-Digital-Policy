/* ============================================================
   agent/depth/lens.mjs — the corpus, indexed for the questions a
   depth analysis asks

   Every detector in `detectors.mjs` needs the same handful of
   cross-cutting views: which institution holds which role over which
   instrument, which timeline events an instrument has and of what
   kind, which sources two records share, which claims rest on
   nothing external. Each of those is a walk over the corpus, and
   thirteen detectors each doing its own walk would be thirteen
   places for the same reading to differ.

   SO THIS MODULE IS AN INDEX, NOT A DERIVATION. It answers "where
   is the record that already exists", never "what does the record
   mean". Nothing here computes an evidence grade, a pipeline stage,
   a competent authority or a key date: those are derived at render
   time by `js/format.js`, `js/pipeline.js` and `js/dna.js`, and a
   second computation in the agent layer is the second copy the whole
   architecture exists to prevent. `agent/integrate/canonical.mjs`
   takes exactly this position and this module is built on it.

   THE GRAPH IS BORROWED, NOT REBUILT. `agent/detector/graph.mjs`
   already derives every edge in the corpus from the rule that a
   string equal to a record's id is an edge to that record. That is
   precisely the machinery a load-bearing test needs — "what leans on
   this?" is `graph.inbound.get(id)` — and building a second
   reference table here would go stale the first time a dataset grows
   a field.

   IT IS READ-ONLY, AND THE SUITE ENFORCES IT RATHER THAN TRUSTING
   IT. There is no write call anywhere in `agent/depth/`;
   `selftest.mjs` scans every module here for one and hashes the
   whole of `data/` around a full run.
   ============================================================ */

import { loadCorpus, SELF_SOURCE_ID, HOME_OF } from '../integrate/canonical.mjs';
import { buildGraph } from '../detector/graph.mjs';

/** Statuses on which the corpus is asserting that the act is live —
 *  that somebody, somewhere, is already bound by it. Read from
 *  `data/taxonomy.json`'s own `status` ids rather than invented: the
 *  site's vocabulary is the authority for what it says about EU law.
 *
 *  This is the list that turns most of the detectors below from a
 *  census into a finding. An act nobody is bound by yet may be
 *  modelled thinly on purpose; an act that binds somebody today and
 *  is modelled thinly is a different statement. */
export const LIVE_STATUSES = ['status:applicable', 'status:partly-applicable', 'status:in-force'];

/** The statuses the corpus uses for an act that has not arrived, or
 *  has gone. A thin model of one of these is ordinarily correct. */
export const DORMANT_STATUSES = ['status:proposal', 'status:stalled', 'status:withdrawn', 'status:repealed'];

/** Scope classes on which the corpus has said it is NOT analysing the
 *  act at length.
 *
 *  This is the single most useful discriminator in the whole
 *  analysis, and it is the corpus's own declaration rather than this
 *  agent's taste: data/taxonomy.json defines scope:referenced as
 *  "named and placed, but outside this brief's analytical scope" and
 *  scope:out-of-scope as "explicitly not covered". An act the site
 *  has said it is not analysing, modelled thinly, is the site doing
 *  what it said it would do — not a gap. Reporting those as
 *  findings would be rewarding quantity against the corpus's stated
 *  intent, which is worse than merely rewarding quantity.
 *
 *  It is NOT applied to scope:adjacent: the taxonomy says an adjacent
 *  act is "mapped and profiled here", so a reader is entitled to
 *  find the profile. */
export const UNANALYSED_SCOPES = ['scope:referenced', 'scope:out-of-scope'];

/** Roles that answer a reader's question "who would enforce this
 *  against me". `role:legislates`, `role:advises` and
 *  `role:interprets` deliberately do not: a body that writes the act
 *  or comments on it is not the body that comes after you. */
export const ENFORCEMENT_ROLES = ['role:supervises', 'role:investigates', 'role:fines', 'role:designates'];

/** An outcome on which the site has told a reader the act reaches
 *  them. `outcome:unlikely` and `outcome:undetermined` have not. */
export const POSITIVE_OUTCOMES = ['outcome:applies', 'outcome:likely', 'outcome:possible'];

const arr = (x) => (Array.isArray(x) ? x : []);

/**
 * Build the lens. One corpus read, one graph build, and a set of
 * indexes over them.
 *
 * @param {{corpus?:object, graph?:object}} [opts]
 */
export function buildLens({ corpus, graph } = {}) {
  const c = corpus ?? loadCorpus();
  const g = graph ?? buildGraph({ corpus: c });
  const db = c.db;

  /* ---------------------------------------------------- competences

     Competence is an edge from an institution to an instrument, and
     `data/institutions.json` is its one home — instruments carry no
     supervisor field, by design. Indexing it by instrument is the
     lookup every "who enforces this" question needs and the dataset
     does not offer directly.

     WILDCARDS ARE KEPT APART. `"*"` on a competence means the role
     is held across the acquis (the Commission legislates; the CJEU
     interprets), and counting it as an instrument-specific
     competence would make every act look supervised. The dataset's
     own `$note` says exactly this. So a wildcard entry is recorded
     as `generic` and is never an answer to "who enforces the AI
     Act". */
  const competencesByInstrument = new Map();
  const genericCompetences = [];
  for (const inst of arr(db.institutions?.institutions)) {
    for (const cp of arr(inst.competences)) {
      const entry = { institution: inst.id, institution_type: inst.type, role: cp.role, exclusive: cp.exclusive === true, scope: cp.scope ?? null, basis: arr(cp.basis), note: cp.note ?? null };
      if (cp.instrument === '*') { genericCompetences.push(entry); continue; }
      if (!competencesByInstrument.has(cp.instrument)) competencesByInstrument.set(cp.instrument, []);
      competencesByInstrument.get(cp.instrument).push(entry);
    }
  }

  /* ------------------------------------------------------- timeline */
  const eventsByInstrument = new Map();
  for (const e of c.events) {
    if (!e?.instrument) continue;
    if (!eventsByInstrument.has(e.instrument)) eventsByInstrument.set(e.instrument, []);
    eventsByInstrument.get(e.instrument).push(e);
  }
  const eventTypesOf = (id) => new Set(arr(eventsByInstrument.get(id)).map((e) => e.event_type));

  /* -------------------------------------------------- applicability */
  const rulesByInstrument = new Map();
  for (const r of arr(db.applicability?.rules)) {
    if (!rulesByInstrument.has(r.instrument)) rulesByInstrument.set(r.instrument, []);
    rulesByInstrument.get(r.instrument).push(r);
  }

  /* --------------------------------------------------- enforcement */
  const enforcementByInstrument = new Map();
  for (const e of arr(db.enforcement?.enforcement)) {
    if (!enforcementByInstrument.has(e.instrument)) enforcementByInstrument.set(e.instrument, []);
    enforcementByInstrument.get(e.instrument).push(e);
  }

  /* ------------------------------------------------------ glossary

     What each glossary term already names, flattened. A concept
     "has a glossary term" when some term points at it — the term's
     own id is not the test, because `gl-vlop` explains the VLOP
     threshold by naming `dsa:art-33`, not by being called after
     it. */
  const glossaryCovers = new Set();
  for (const t of arr(db.glossary?.terms)) {
    for (const id of [...arr(t.instruments), ...arr(t.provisions), ...arr(t.institutions), ...arr(t.actors), ...arr(t.enforcement)]) glossaryCovers.add(id);
  }

  /* -------------------------------------------------- relationships */
  const relationshipPairs = new Set();
  for (const r of arr(db.instruments?.relationships)) {
    relationshipPairs.add(`${r.from}|${r.to}`);
    relationshipPairs.add(`${r.to}|${r.from}`);
  }

  /* -------------------------------------------------------- sources

     Two source records for one document is the thing worth finding
     here, and it is found on the TITLE rather than on the URL,
     because the case the corpus actually contains is one act
     published at two addresses — an EUR-Lex page and an ELI
     permalink. Matching on the URL would miss exactly that.

     The comparison is deliberately dull: case-folded, whitespace
     collapsed, punctuation left alone. A fuzzier match would start
     joining documents that are not the same document, and a
     bibliography that silently merges two publications is worse
     than one that lists both. */
  const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const sourcesByTitle = new Map();
  for (const s of c.sources) {
    const k = norm(s.title);
    if (!k) continue;
    if (!sourcesByTitle.has(k)) sourcesByTitle.set(k, []);
    sourcesByTitle.get(k).push(s);
  }

  /* Which instrument, if any, a source record is the primary text
     of. Derived from the instruments' own `sources[]`, never from
     reading the title: a title that looks like an act is not a
     record that one exists. */
  const instrumentOfSource = new Map();
  for (const i of c.instruments) for (const s of arr(i.sources)) if (!instrumentOfSource.has(s)) instrumentOfSource.set(s, i.id);

  /* ---------------------------------------------------------- claims

     Whether a claim rests on anything outside this site. The rule is
     `js/format.js`'s own: the self-citation placeholder is filtered
     before grading, so attaching it never moves anything. This is a
     LOOKUP of that rule's input, not a second implementation of the
     grade — the grade itself stays where it is derived. */
  const externalDirectSources = (claim) => arr(claim.sources).filter((s) => s.source_id !== SELF_SOURCE_ID && s.supports === 'supports:direct');
  const restsOnlyOnItself = (claim) => externalDirectSources(claim).length === 0;

  /* ---------------------------------------------------- verification

     Every dataset's `last_verified` is a compilation date — the
     canonical loader works that out and says so, and it is the
     finding the stale-record detector turns on rather than the
     assumption it works around. Borrowed, not recomputed. */
  const verification = c.verificationDates;
  const everyDateIsCompiled = Object.values(verification).every((v) => v.is_compilation_date === true);

  return {
    corpus: c,
    graph: g,
    db,
    HOME_OF,

    competencesByInstrument,
    genericCompetences,
    competencesOf: (id) => arr(competencesByInstrument.get(id)),
    enforcementRolesOf: (id) => arr(competencesByInstrument.get(id)).filter((x) => ENFORCEMENT_ROLES.includes(x.role)),

    eventsByInstrument,
    eventsOf: (id) => arr(eventsByInstrument.get(id)),
    eventTypesOf,

    rulesByInstrument,
    rulesOf: (id) => arr(rulesByInstrument.get(id)),

    enforcementByInstrument,
    enforcementOf: (id) => arr(enforcementByInstrument.get(id)),

    glossaryCovers,
    relationshipPairs,
    hasRelationship: (a, b) => relationshipPairs.has(`${a}|${b}`),

    sourcesByTitle,
    instrumentOfSource,

    externalDirectSources,
    restsOnlyOnItself,

    verification,
    everyDateIsCompiled,

    /** What leans on a record, as edges. The load-bearing test's
     *  raw material; `demand.mjs` turns it into a finding. */
    inbound: (id) => arr(g.inbound.get(id)),
    outbound: (id) => arr(g.outbound.get(id)),
    node: (id) => g.nodes.get(id) ?? null,

    isLive: (i) => LIVE_STATUSES.includes(i?.legislative_status),
    isDormant: (i) => DORMANT_STATUSES.includes(i?.legislative_status),
    /** True where the corpus has declared it is not analysing the act
     *  at length. Its thin model is intended, not missing. */
    isUnanalysed: (i) => UNANALYSED_SCOPES.includes(i?.scope_class),
  };
}
