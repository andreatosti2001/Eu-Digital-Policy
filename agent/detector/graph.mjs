/* ============================================================
   agent/detector/graph.mjs — the dependency graph of the corpus and
   of the pages that render it

   SESSION 10's brief asks the Change Detector to "understand the
   existing website" well enough to say, for a confirmed change, what
   it reaches. That question cannot be answered from the change: it
   is a property of the corpus, and the corpus is a graph. This
   module builds it once.

   THE EDGES ARE DERIVED, NOT DECLARED, AND THAT IS THE WHOLE POINT.
   The obvious implementation is a table — "a claim references
   instruments, provisions, institutions, enforcement, sources" — and
   it is the second home this architecture exists to prevent. It goes
   stale the first time a dataset grows a field, silently, and a
   silently incomplete impact map is worse than none because it reads
   as coverage.

   So the rule here is one sentence: **a string that is the id of a
   record is an edge to that record; everything else is a value.**
   The ids in this corpus are namespaced and mutually
   un-confusable — `clm-…`, `src-…`, `tl-…`, `enf-…`, `gl-…`,
   `ap-…`, `rel-…`, `gdpr`, `gdpr:art-5`, `status:applicable`,
   `part-7` — so whole-string equality against the node index is a
   test, not a guess. A prose sentence never equals an id. A field
   nobody has thought about is followed anyway. A dataset that grows
   a reference field on Tuesday is in the graph on Tuesday.

   WILDCARDS ARE EXPANDED AND SAID TO BE WILDCARDS. `data/` uses
   `"dpa-*"` and `"*"` where a competence or an authority is generic.
   `tools/validate.mjs` treats every wildcard reference as resolving
   (docs/AUDIT-2026-09-01.md F-12), which means a wildcard is exactly
   the kind of edge nobody has ever checked. Here it is expanded to
   the nodes it matches, each expansion marked `via_wildcard: true`,
   and `"*"` — which matches everything — is recorded as an edge to
   the dataset rather than to all of its records, because an edge to
   everything distinguishes nothing.

   WHAT THIS IS NOT. It is not a claim about MEANING. That a claim
   record references a timeline event establishes that the claim
   points at it, never that the claim's sentence still reads true if
   the event moves. That second question is the editorial half of the
   impact map and it is answered — as far as it can be — in
   `impact.mjs`, by reading the prose rather than the references.

   AND IT IS READ-ONLY, like everything else in this directory.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../schemas/types.mjs';
import { loadCorpus, HOME_OF } from '../integrate/canonical.mjs';
import { buildPageMap } from './surfaces.mjs';

/** Where each dataset's records live inside its file, and what kind
 *  of node they are. Read from the datasets' own top-level array
 *  names — the one thing about a dataset's shape that cannot be
 *  derived from its contents, because an empty array and an absent
 *  one look alike.
 *
 *  `kind` uses the vocabulary of `LEGAL_ENTITY_KINDS`, so a node id
 *  and an `affected_entities` entry are the same currency and
 *  neither needs translating into the other. */
export const RECORD_SETS = [
  { dataset: 'data/instruments.json', key: 'instruments', kind: 'instrument' },
  { dataset: 'data/instruments.json', key: 'relationships', kind: 'relationship' },
  { dataset: 'data/claims.json', key: 'claims', kind: 'claim' },
  { dataset: 'data/sources.json', key: 'sources', kind: 'source' },
  { dataset: 'data/timeline.json', key: 'events', kind: 'timeline_event' },
  { dataset: 'data/enforcement.json', key: 'enforcement', kind: 'enforcement_action' },
  { dataset: 'data/glossary.json', key: 'terms', kind: 'glossary_term' },
  { dataset: 'data/applicability.json', key: 'rules', kind: 'applicability_rule' },
  { dataset: 'data/institutions.json', key: 'institutions', kind: 'institution' },
  { dataset: 'data/brief.json', key: 'parts', kind: 'brief_part' },
];

/** Provisions are nested inside their instrument rather than sitting
 *  in a top-level array, and they are the most-referenced ids in the
 *  corpus. Named here because the nesting is a shape fact, not a
 *  content fact. */
const NESTED = { 'data/instruments.json': { under: 'instruments', key: 'provisions', kind: 'provision' } };

/** `data/taxonomy.json` is the enum authority: every one of its
 *  top-level arrays is a term list, and every term is a node. It is
 *  handled apart because its arrays are named by what they enumerate
 *  rather than by a record type, and listing them here would be a
 *  second copy of the taxonomy's own table of contents. */
const TAXONOMY = 'data/taxonomy.json';

/* ---------------------------------------------------------- nodes */

/**
 * Every canonical record, indexed by id.
 *
 * @returns {{nodes: Map<string, object>, collisions: object[]}}
 *   A collision — two records in different datasets claiming one id
 *   — is REPORTED rather than resolved. Silently keeping the first
 *   would make every edge to that id point at whichever dataset this
 *   module happened to read first.
 */
export function buildNodes(corpus) {
  const nodes = new Map();
  const collisions = [];

  const add = (id, node) => {
    if (id === null || id === undefined || id === '') return;
    const key = String(id);
    const existing = nodes.get(key);
    if (existing) {
      if (existing.dataset !== node.dataset || existing.kind !== node.kind) {
        collisions.push({ id: key, first: `${existing.kind} in ${existing.dataset}`, second: `${node.kind} in ${node.dataset}` });
      }
      return;
    }
    nodes.set(key, { id: key, ...node });
  };

  for (const { dataset, key, kind } of RECORD_SETS) {
    const file = dataset.replace(/^data\//, '').replace(/\.json$/, '');
    const rows = corpus.db?.[file]?.[key];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) add(row?.id, { kind, dataset, record: row });
  }

  const nest = NESTED['data/instruments.json'];
  for (const inst of corpus.db?.instruments?.[nest.under] ?? []) {
    for (const p of inst?.[nest.key] ?? []) {
      add(p?.id, { kind: nest.kind, dataset: 'data/instruments.json', record: p, owner: inst.id });
    }
  }

  for (const [key, value] of Object.entries(corpus.db?.taxonomy ?? {})) {
    if (key.startsWith('$') || !Array.isArray(value)) continue;
    for (const t of value) add(t?.id, { kind: 'taxonomy_term', dataset: TAXONOMY, record: t, list: key });
  }

  return { nodes, collisions };
}

/* ---------------------------------------------------------- edges */

/** Every string a record holds, with the dotted path it sits at.
 *  Arrays keep their index so an edge can name the exact position
 *  it came from, which is what makes a finding checkable by hand.
 *
 *  A NESTED RECORD IS NOT WALKED TWICE. `data/instruments.json`
 *  carries provisions inside their instrument, and each provision is
 *  a node in its own right. Walking the instrument's whole subtree
 *  would give the instrument every one of its provisions' edges as
 *  well — `gdpr` would appear to reference the forty sources its
 *  articles cite, and every count in the graph would be inflated by
 *  the same records twice. So the walk stops at any nested object
 *  whose `id` is itself a node, and emits the containment edge
 *  instead: the instrument references the provision, and the
 *  provision's own references belong to the provision. */
function* strings(value, path, isNode, rootId) {
  if (typeof value === 'string') { yield [path, value]; return; }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${path}[${i}]`, isNode, rootId);
    return;
  }
  if (value !== null && typeof value === 'object') {
    if (path && typeof value.id === 'string' && value.id !== rootId && isNode(value.id)) {
      yield [`${path}.id`, value.id];
      return;
    }
    for (const [k, v] of Object.entries(value)) yield* strings(v, path ? `${path}.${k}` : k, isNode, rootId);
  }
}

/** The field a dotted path belongs to — `sources[2]` → `sources`,
 *  `competences[0].instrument` → `competences.instrument`. Indexes
 *  are dropped because "which field carries this reference" is a
 *  question about the schema, not about the row. */
const fieldOf = (path) => path.replace(/\[\d+\]/g, '');

/** A wildcard reference as `data/` writes them: `"dpa-*"`, `"*"`.
 *  Anchored, so `a*b` — which nothing in the corpus uses — is not
 *  silently treated as a pattern. */
const WILDCARD = /^([a-z0-9:_-]*)\*$/;

/**
 * Build every edge in the corpus.
 *
 * @returns {{edges: object[], unresolvedWildcards: object[]}}
 *   Each edge: `{ from, from_kind, to, to_kind, field, path,
 *   via_wildcard }`. A self-edge is dropped — a record referencing
 *   its own id says nothing about dependency.
 */
export function buildEdges(nodes) {
  const edges = [];
  const unresolvedWildcards = [];
  const ids = [...nodes.keys()];

  for (const [id, node] of nodes) {
    for (const [path, value] of strings(node.record ?? {}, '', (x) => nodes.has(x), id)) {
      if (path === 'id' || value === id) continue;

      const target = nodes.get(value);
      if (target) {
        edges.push({
          from: id, from_kind: node.kind, to: value, to_kind: target.kind,
          field: fieldOf(path), path, via_wildcard: false,
        });
        continue;
      }

      const w = WILDCARD.exec(value);
      if (!w) continue;

      /* `"*"` matches every record there is. An edge to everything
         orders nothing and hides the edges that do discriminate, so
         it is recorded once against the whole corpus and named as
         what it is. */
      if (w[1] === '') {
        unresolvedWildcards.push({
          from: id, field: fieldOf(path), path, pattern: value,
          why: 'The pattern "*" matches every record in the corpus. Expanding it would give this record an edge to everything, which orders nothing and buries the edges that do discriminate. It is recorded as a wildcard against the dataset instead. tools/validate.mjs treats every wildcard reference as resolving (docs/AUDIT-2026-09-01.md F-12), so this is an edge nobody has ever checked.',
          matched: null,
        });
        continue;
      }

      const prefix = w[1];
      const matched = ids.filter((x) => x !== id && x.startsWith(prefix));
      if (!matched.length) {
        unresolvedWildcards.push({
          from: id, field: fieldOf(path), path, pattern: value, matched: [],
          why: `The pattern "${value}" matches no record in the corpus. That is either a reference to records that do not exist yet or a typo, and tools/validate.mjs would not report either because it treats a wildcard as resolving (F-12).`,
        });
        continue;
      }
      for (const to of matched) {
        edges.push({
          from: id, from_kind: node.kind, to, to_kind: nodes.get(to).kind,
          field: fieldOf(path), path, via_wildcard: true,
        });
      }
    }
  }

  return { edges, unresolvedWildcards };
}

/* ------------------------------------------------- the render layer */

/**
 * Which view modules a page runs, and which datasets each module
 * reads. Built on `surfaces.mjs`, which reads the same `loadAll` /
 * `load` call sites `docs/CURRENT-ARCHITECTURE.md` §5 says its table
 * was read from — so this is one more consumer of that derivation
 * rather than a second copy of it.
 */
export function renderLayer({ root = REPO_ROOT } = {}) {
  const map = buildPageMap({ root });
  return {
    pageToDatasets: map.pageToDatasets,
    datasetToPages: map.datasetToPages,
    pageToModules: map.pageToModules,
    moduleDatasets: map.moduleDatasets,
    chromeDatasets: map.chromeDatasets,
    unresolved: map.unresolved,
  };
}

/* -------------------------------------------------- markup mentions */

/**
 * Which root pages name an id in their own markup.
 *
 * A page renders a dataset through a module; that is the derived
 * half, and `surfaces.mjs` owns it. This is the OTHER half: prose
 * and markup a person wrote, which names an entity directly and
 * which no validator reads. `index.html` is 210 KB of argument about
 * these acts, and a change to what an act says can leave a sentence
 * in it false while every check in the repository still passes —
 * AGENTS.md says exactly that under "the validators do not read
 * prose".
 *
 * Whole-token matching, so `dsa` does not match `dsa-art-34` and
 * `gdpr` does not match a word that merely contains it. A mention is
 * evidence that the page's author wrote the id down; it is not
 * evidence that the sentence around it is now wrong, and the impact
 * map says so rather than asserting staleness it has not
 * established.
 */
export function markupMentions(ids, { root = REPO_ROOT } = {}) {
  const pages = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  const out = new Map();
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    for (const id of ids) {
      if (!id) continue;
      const esc = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      /* An id boundary is anything that is not an id character. The
         corpus's ids use [a-z0-9:_-], so those are the characters a
         match may not be flanked by. */
      const re = new RegExp(`(^|[^a-z0-9:_-])${esc}([^a-z0-9:_-]|$)`);
      if (re.test(html)) {
        if (!out.has(id)) out.set(id, []);
        out.get(id).push(page);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------- the graph */

/**
 * The whole thing, built once.
 *
 * @param {{corpus?:object, root?:string}} [opts]
 * @returns {{nodes:Map, edges:object[], inbound:Map, outbound:Map,
 *            render:object, collisions:object[],
 *            unresolvedWildcards:object[], counts:object}}
 *
 * `inbound` is the direction the impact map actually travels:
 * "what depends on this record" is `inbound.get(id)`, and the
 * distinction matters — a claim citing a timeline event depends on
 * the event, and the event does not depend on the claim.
 */
export function buildGraph({ corpus, root = REPO_ROOT } = {}) {
  const c = corpus ?? loadCorpus();
  const { nodes, collisions } = buildNodes(c);
  const { edges, unresolvedWildcards } = buildEdges(nodes);

  const inbound = new Map();
  const outbound = new Map();
  for (const e of edges) {
    if (!outbound.has(e.from)) outbound.set(e.from, []);
    outbound.get(e.from).push(e);
    if (!inbound.has(e.to)) inbound.set(e.to, []);
    inbound.get(e.to).push(e);
  }

  const byKind = {};
  for (const n of nodes.values()) byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
  const byField = {};
  for (const e of edges) byField[`${e.from_kind}.${e.field}`] = (byField[`${e.from_kind}.${e.field}`] ?? 0) + 1;

  return {
    nodes, edges, inbound, outbound,
    render: renderLayer({ root }),
    collisions,
    unresolvedWildcards,
    counts: {
      nodes: nodes.size,
      edges: edges.length,
      wildcard_edges: edges.filter((e) => e.via_wildcard).length,
      nodes_by_kind: byKind,
      edges_by_field: byField,
      unresolved_wildcards: unresolvedWildcards.length,
      id_collisions: collisions.length,
    },
  };
}

/**
 * Which fields, PER NODE KIND, carry references.
 *
 * Derived from the edges rather than declared, and derived per KIND
 * rather than per record — which is the difference between a right
 * answer and a subtly wrong one. `instruments[].brief_part` holds an
 * id on twenty-two acts and `null` on the twenty-third; asking
 * whether THAT record produced an edge would classify the same field
 * as a reference on one act and as an unregistered value on the
 * next. A field is a reference because of what the schema does with
 * it, not because of whether one row happens to have filled it in.
 *
 * @returns {Map<string, Set<string>>} kind → field paths
 */
export function referenceFieldsByKind(g) {
  const out = new Map();
  for (const e of g.edges) {
    if (!out.has(e.from_kind)) out.set(e.from_kind, new Set());
    out.get(e.from_kind).add(e.field);
  }
  return out;
}

/* One build per process. The corpus does not change under a running
   detector — the suite hashes data/ around a full run and asserts
   exactly that. */
let _graph = null;
export const graph = (opts) => (_graph ??= buildGraph(opts));
export const forgetGraph = () => { _graph = null; };

/**
 * Everything that depends on these ids, to a stated depth.
 *
 * DEPTH IS AN ARGUMENT AND IT IS SMALL BY DEFAULT. Two hops from a
 * timeline event reaches most of the corpus, and an impact map that
 * names most of the corpus every time distinguishes nothing — the
 * same failure `surfaces.mjs` avoids by counting the command palette
 * apart. Each reached node carries the hop count and the path that
 * reached it, so a reviewer can see which findings are direct and
 * which are two rooms away.
 *
 * @returns {Map<string, {node:object, depth:number, via:object[]}>}
 */
export function dependents(g, ids, { depth = 2 } = {}) {
  const reached = new Map();
  let frontier = [...new Set(ids)].filter((id) => g.nodes.has(id));

  for (let hop = 1; hop <= depth && frontier.length; hop++) {
    const next = [];
    for (const id of frontier) {
      for (const e of g.inbound.get(id) ?? []) {
        if (ids.includes(e.from)) continue;
        const already = reached.get(e.from);
        if (already) { already.via.push({ ...e, hop }); continue; }
        reached.set(e.from, { node: g.nodes.get(e.from), depth: hop, via: [{ ...e, hop }] });
        next.push(e.from);
      }
    }
    frontier = next;
  }
  return reached;
}

/** The subgraph an impact map actually used, as plain JSON — for the
 *  artifact the detector records and for the observability view. The
 *  full graph is thousands of edges; what a reviewer needs is the
 *  part that carried this change. */
export function subgraph(g, rootIds, reached) {
  const keep = new Set([...rootIds, ...reached.keys()]);
  return {
    roots: [...rootIds],
    nodes: [...keep].filter((id) => g.nodes.has(id)).map((id) => {
      const n = g.nodes.get(id);
      return { id: n.id, kind: n.kind, dataset: n.dataset, depth: reached.get(id)?.depth ?? 0 };
    }),
    edges: g.edges
      .filter((e) => keep.has(e.from) && keep.has(e.to))
      .map((e) => ({ from: e.from, to: e.to, field: e.field, via_wildcard: e.via_wildcard })),
  };
}

/* Re-exported so a consumer of the graph asks it where a kind of
   record lives rather than importing the adapter's map separately.
   It is the same object; there is no second copy. */
export { HOME_OF };
