/* ============================================================
   The dataset explorer's model: a record as a graph, without a DOM.

   datasets.html shows the canonical files as they are written, the
   way a JSON viewer would — one card per object, a line from each
   card to the objects nested in it. A generic viewer stops there, and
   on this site that would mislead in two ways:

   1. NESTING IS NOT A RELATIONSHIP BETWEEN RECORDS. The links that
      matter here are not nesting at all: a claim does not contain its
      source, it holds the source's id as a string. A viewer that only
      draws nesting shows that string as text and hides the edge; one
      that guessed edges from field names would invent them. Here a
      string is a reference only when it is EXACTLY the id of a record
      in one of the loaded files, the field that holds it is named,
      and nothing is said about what the link means — the file states
      the id, not the nature of the connection.

   2. WHAT IS NOT IN THE FILE IS NOT IN THE FILE. A claim's evidence
      grade is derived on every load and never stored; a raw view of
      claims.json shows a sourced claim and an unsupported one alike.
      This module draws only what the file holds. The page adds the
      derived grade beside it, labelled as derived, from the one
      function that computes it (js/format.js via js/evidence-view.js).

   Pure: same input, same output, no fetch and no DOM, so the node
   suite in tools/selftest.mjs can hold it to what it says.
   ============================================================ */

/** The canonical files, in the order the picker offers them. One entry
 *  per file in data/: tools/design-qa.mjs fails the build when a file is
 *  added to or removed from data/ without this list following. */
export const DATASETS = Object.freeze([
  { name: 'instruments', title: 'Instruments' },
  { name: 'institutions', title: 'Institutions' },
  { name: 'enforcement', title: 'Enforcement' },
  { name: 'claims', title: 'Claims' },
  { name: 'sources', title: 'Sources' },
  { name: 'timeline', title: 'Timeline' },
  { name: 'applicability', title: 'Applicability rules' },
  { name: 'glossary', title: 'Glossary' },
  { name: 'taxonomy', title: 'Taxonomy' },
  { name: 'brief', title: 'Brief structure' },
]);

/** Where DATASETS and the files in data/ disagree. `files` is the
 *  directory listing; design-qa supplies it, so this stays fs-free.
 *  @returns {{ missing: string[], extra: string[] }} files with no entry,
 *  and entries with no file */
export function listDrift(files) {
  const have = new Set(files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
  const listed = new Set(DATASETS.map((d) => d.name));
  return {
    missing: [...have].filter((n) => !listed.has(n)).sort(),
    extra: [...listed].filter((n) => !have.has(n)).sort(),
  };
}

/* The dataset whose records are controlled-vocabulary terms. A reference
   to one is labelled where it stands rather than drawn as an edge: every
   record holds several, and as edges they would bury the rest. */
export const VOCABULARY = 'taxonomy';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/* ---------------------------------------------------------- a file

   A file's top level is metadata (`$description`, `$note`, …) and one
   or more collections of records. Read generically, so the same code
   reads taxonomy.json's 36 vocabularies and claims.json's one array. */

/**
 * @returns {{ ok: boolean, problem: string|null, meta: Array<[string, *]>,
 *   collections: Array<{ key: string, records: Array<*> }>, other: Array<[string, *]> }}
 */
export function describe(doc) {
  const out = { ok: false, problem: null, meta: [], collections: [], other: [] };
  if (!isObj(doc)) {
    out.problem = 'The file parsed, but its top level is ' +
      (doc === null ? 'null' : Array.isArray(doc) ? 'an array' : 'a ' + typeof doc) +
      ', not the object every canonical file is.';
    return out;
  }
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('$')) out.meta.push([k, v]);
    else if (Array.isArray(v)) out.collections.push({ key: k, records: v });
    else out.other.push([k, v]);
  }
  if (!out.collections.length) out.problem = 'The file holds no collection of records.';
  else out.ok = true;
  return out;
}

/** How many records a described file holds, in words: per collection when
 *  there are a few, as one total when there are many (taxonomy.json). */
export function countText(d) {
  const cs = d.collections;
  if (!cs.length) return 'no collection of records';
  if (cs.length > 3) return cs.reduce((s, c) => s + c.records.length, 0) + ' records in ' + cs.length + ' collections';
  return cs.map((c) => c.records.length + ' in ' + c.key).join(', ');
}

/** The key a record is addressed by: its id, or its position when it has none. */
export const recordKey = (rec, i) => (isObj(rec) && typeof rec.id === 'string' && rec.id) ? rec.id : '#' + i;

const LABEL_FIELDS = ['short_name', 'name', 'title', 'label', 'term', 'entity', 'full_name', 'statement', 'summary'];

/** A human label for a record, from the first naming field it carries. */
export function recordLabel(rec) {
  if (!isObj(rec)) return null;
  for (const f of LABEL_FIELDS) if (typeof rec[f] === 'string' && rec[f].trim()) return clip(rec[f].trim(), 90);
  return null;
}

export function clip(s, n) {
  const t = String(s);
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

/** Find a record in a described file by its key. */
export function findRecord(d, collection, key) {
  const col = d.collections.find((c) => c.key === collection);
  if (!col) return null;
  const i = col.records.findIndex((r, j) => recordKey(r, j) === key);
  return i < 0 ? null : { record: col.records[i], index: i };
}

/* ---------------------------------------------------------- references

   Every object carrying a string `id`, anywhere in any loaded file, is
   addressable: top-level records, and the entities nested in them
   (provisions inside an instrument, terms inside a vocabulary). An id
   held by two objects is AMBIGUOUS and resolves to nothing — the
   explorer will not pick one. tools/validate.mjs keeps ids unique, so
   this is a refusal that should never fire, not a case expected. */

/**
 * @param {Record<string, object>} docs  dataset name → parsed file (absent when it failed to load)
 * @returns {Map<string, {dataset, collection, record, path, label, vocabulary}|null>}
 */
export function refIndex(docs) {
  const map = new Map();
  const put = (id, at) => {
    if (map.has(id)) { map.set(id, null); return; }
    map.set(id, at);
  };
  for (const { name } of DATASETS) {
    const d = docs[name] ? describe(docs[name]) : null;
    if (!d || !d.ok) continue;
    for (const col of d.collections) {
      col.records.forEach((rec, i) => {
        const key = recordKey(rec, i);
        const walk = (v, path) => {
          if (Array.isArray(v)) { v.forEach((x, j) => walk(x, path.concat(j))); return; }
          if (!isObj(v)) return;
          if (typeof v.id === 'string' && v.id) {
            put(v.id, {
              dataset: name, collection: col.key, record: key, path,
              label: recordLabel(v), vocabulary: name === VOCABULARY,
            });
          }
          for (const [k, x] of Object.entries(v)) if (k !== 'id') walk(x, path.concat(k));
        };
        walk(rec, []);
      });
    }
  }
  return map;
}

/** Resolve a string to the record it names, or null. The field `id`
 *  is the record's own identity, never a reference. */
export function resolve(refs, key, value) {
  if (key === 'id' || typeof value !== 'string' || !value) return null;
  return refs.get(value) || null;
}

/** "sources[0].source_id" from ['sources', 0, 'source_id']. */
export function pathText(path) {
  return path.map((p, i) => typeof p === 'number' ? '[' + p + ']' : (i ? '.' : '') + p).join('');
}

/**
 * Every reference a value makes, with the field path that holds it.
 * @returns {Array<{ path: string, key: string, id: string, target: object }>}
 */
export function referencesIn(value, refs) {
  const out = [];
  const walk = (v, path, key) => {
    if (Array.isArray(v)) { v.forEach((x, j) => walk(x, path.concat(j), key)); return; }
    if (isObj(v)) { for (const [k, x] of Object.entries(v)) walk(x, path.concat(k), k); return; }
    const t = resolve(refs, key, v);
    if (t) out.push({ path: pathText(path), key, id: v, target: t });
  };
  walk(value, [], null);
  return out;
}

/**
 * Who points at whom, across every loaded file: target id → the records
 * holding it. Built once per load.
 * @returns {Map<string, Array<{ dataset, collection, record, label, path }>>}
 */
export function incomingIndex(docs, refs) {
  const into = new Map();
  for (const { name } of DATASETS) {
    const d = docs[name] ? describe(docs[name]) : null;
    if (!d || !d.ok) continue;
    for (const col of d.collections) {
      col.records.forEach((rec, i) => {
        const record = recordKey(rec, i);
        for (const r of referencesIn(rec, refs)) {
          /* a nested entity naming its own owner is not an incoming edge */
          if (r.target.dataset === name && r.target.record === record) continue;
          if (!into.has(r.id)) into.set(r.id, []);
          into.get(r.id).push({ dataset: name, collection: col.key, record, label: recordLabel(rec), path: r.path });
        }
      });
    }
  }
  return into;
}

/* ---------------------------------------------------------- the structure graph

   One node per object or array, as a JSON viewer draws it: a card whose
   rows are the scalar fields, and a child card for every nested object
   or array, joined to the row that holds it. Above `maxNodes` the graph
   stops growing and says so on the row where it stopped — the tree view
   holds the rest. A silent cut would look like a complete record. */

export const LIMITS = Object.freeze({ maxNodes: 240, maxText: 40, maxKey: 22 });

const typeOf = (v) => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;

/**
 * @param {*} value      the record (or any JSON value)
 * @param {object} opts  { title, refs, limits }
 * @returns {{ nodes: Array, edges: Array, truncated: boolean }}
 */
export function structureGraph(value, { title = 'record', refs = new Map(), limits = LIMITS } = {}) {
  const nodes = [];
  const edges = [];
  let truncated = false;

  const scalarRow = (key, v, path) => {
    const type = typeOf(v);
    const row = { key: String(key), full: v === null ? 'null' : String(v), type, path: pathText(path) };
    if (type === 'string') {
      const t = resolve(refs, typeof key === 'string' ? key : null, v);
      if (t) { row.type = t.vocabulary ? 'vocab' : 'ref'; row.target = t; row.id = v; }
    }
    row.text = row.type === 'string' ? '"' + clip(v, limits.maxText) + '"' : clip(row.full, limits.maxText);
    return row;
  };

  /* an array element inherits its array's field name for resolution:
     `sources: ["src-x"]` is a reference held by `sources` */
  const make = (v, nodeTitle, path, depth, fieldKey) => {
    const node = { id: 'n' + nodes.length, title: nodeTitle, path: pathText(path), depth, rows: [], kind: typeOf(v) };
    nodes.push(node);
    const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v);
    if (!entries.length) node.rows.push({ key: '', text: Array.isArray(v) ? 'empty array' : 'empty object', full: '', type: 'empty', path: node.path });
    for (const [k, x] of entries) {
      const p = path.concat(k);
      const label = typeof k === 'number' ? '[' + k + ']' : k;
      if (x !== null && typeof x === 'object') {
        if (nodes.length >= limits.maxNodes) {
          truncated = true;
          node.rows.push({ key: label, text: 'not drawn — node limit; see Tree', full: '', type: 'cut', path: pathText(p) });
          continue;
        }
        const n = Array.isArray(x) ? x.length : Object.keys(x).length;
        const sub = Array.isArray(x) ? n + (n === 1 ? ' item' : ' items') : n + (n === 1 ? ' field' : ' fields');
        const childTitle = typeof k === 'number'
          ? (fieldKey || '') + '[' + k + ']' + (isObj(x) && typeof x.id === 'string' ? ' ' + x.id : '')
          : k;
        const child = make(x, childTitle, p, depth + 1, typeof k === 'number' ? fieldKey : k);
        node.rows.push({ key: label, text: sub, full: '', type: 'child', child: child.id, path: pathText(p) });
        edges.push({ from: node.id, to: child.id, row: node.rows.length - 1, kind: 'nest' });
      } else {
        node.rows.push(scalarRow(typeof k === 'number' ? (fieldKey || label) : k, x, p));
        if (typeof k === 'number') node.rows[node.rows.length - 1].key = label;
      }
    }
    return node;
  };

  if (value !== null && typeof value === 'object') make(value, title, [], 0, null);
  else nodes.push({ id: 'n0', title, path: '', depth: 0, kind: typeOf(value), rows: [scalarRow('value', value, [])] });
  return { nodes, edges, truncated };
}

/* ---------------------------------------------------------- layout

   Left to right, one column per depth. Each subtree owns a vertical
   band at least as tall as its card and as its children stacked, and
   the card sits centred in its band — so no two cards can overlap and
   the same record always lays out the same way. Sizes come from a
   monospace metric rather than from measuring rendered text, which
   keeps this pure; the stylesheet sets the same face and size. */

export const METRICS = Object.freeze({ char: 6.6, row: 18, head: 26, padX: 12, gapX: 64, gapY: 18, minW: 140, maxW: 420 });

const rowChars = (r, m) => (r.key ? clip(r.key, LIMITS.maxKey).length + 2 : 0) + String(r.text).length + (r.type === 'ref' || r.type === 'vocab' ? 2 : 0);

export function nodeSize(node, m = METRICS) {
  const chars = Math.max(String(node.title).length, ...node.rows.map((r) => rowChars(r, m)));
  const w = Math.min(m.maxW, Math.max(m.minW, Math.ceil(chars * m.char + m.padX * 2)));
  const h = m.head + node.rows.length * m.row + 8;
  return { w, h };
}

/**
 * @returns {{ nodes: Array, edges: Array, width: number, height: number }}
 *   nodes gain x, y, w, h; edges gain x1, y1, x2, y2.
 */
export function layout(graph, m = METRICS) {
  const by = new Map(graph.nodes.map((n) => [n.id, { ...n, ...nodeSize(n, m) }]));
  const kids = new Map();
  for (const e of graph.edges) {
    if (!kids.has(e.from)) kids.set(e.from, []);
    kids.get(e.from).push(e.to);
  }
  const colW = [];
  for (const n of by.values()) colW[n.depth] = Math.max(colW[n.depth] || 0, n.w);
  const colX = [];
  colW.forEach((w, d) => { colX[d] = d === 0 ? 0 : colX[d - 1] + colW[d - 1] + m.gapX; });

  const band = new Map();
  const measure = (id) => {
    const ks = kids.get(id) || [];
    const stacked = ks.reduce((s, k, i) => s + measure(k) + (i ? m.gapY : 0), 0);
    const b = Math.max(by.get(id).h, stacked);
    band.set(id, b);
    return b;
  };
  const place = (id, top) => {
    const n = by.get(id);
    const b = band.get(id);
    n.x = colX[n.depth];
    n.y = top + (b - n.h) / 2;
    const ks = kids.get(id) || [];
    const stacked = ks.reduce((s, k, i) => s + band.get(k) + (i ? m.gapY : 0), 0);
    let y = top + (b - stacked) / 2;
    for (const k of ks) { place(k, y); y += band.get(k) + m.gapY; }
  };
  const roots = graph.nodes.filter((n) => !graph.edges.some((e) => e.to === n.id));
  let top = 0;
  for (const r of roots) { measure(r.id); place(r.id, top); top += band.get(r.id) + m.gapY; }

  const nodes = graph.nodes.map((n) => by.get(n.id));
  const edges = graph.edges.map((e) => {
    const a = by.get(e.from), b = by.get(e.to);
    return { ...e, x1: a.x + a.w, y1: a.y + m.head + e.row * m.row + m.row / 2, x2: b.x, y2: b.y + m.head / 2 };
  });
  const width = nodes.reduce((w, n) => Math.max(w, n.x + n.w), 0);
  const height = nodes.reduce((h, n) => Math.max(h, n.y + n.h), 0);
  return { nodes, edges, width, height };
}

/* ---------------------------------------------------------- the reference graph

   The record in the middle, the records it names on the right, the
   records that name it on the left; one card per record, and each edge
   labelled with the field that holds the id. Vocabulary terms are not
   drawn (see VOCABULARY). Each side stops at `cap` and reports how many
   it left out; the panel beside the canvas lists all of them. */

export function referenceGraph(center, outgoing, incoming, { cap = 24, m = METRICS } = {}) {
  const group = (list, keyOf) => {
    const g = new Map();
    for (const x of list) {
      const k = keyOf(x);
      if (!g.has(k)) g.set(k, { ...x, fields: [] });
      if (!g.get(k).fields.includes(x.path)) g.get(k).fields.push(x.path);
    }
    return [...g.values()];
  };
  const right = group(outgoing.filter((r) => !r.target.vocabulary),
    (r) => r.target.dataset + '/' + r.target.record)
    .map((r) => ({ dataset: r.target.dataset, collection: r.target.collection, record: r.target.record,
      label: r.target.label, fields: r.fields, via: r.target.path.length ? r.id : null }));
  const left = group(incoming, (r) => r.dataset + '/' + r.record)
    .map((r) => ({ dataset: r.dataset, collection: r.collection, record: r.record, label: r.label, fields: r.fields }));

  const W = 260, H = 46, GAP = 10, COL = 200;
  const card = (x, side, i) => ({ ...x, side, w: W, h: H, i });
  const L = left.slice(0, cap).map((x, i) => card(x, 'in', i));
  const R = right.slice(0, cap).map((x, i) => card(x, 'out', i));
  const tallest = Math.max(L.length, R.length, 1) * (H + GAP) - GAP;
  L.forEach((c) => { c.x = 0; c.y = c.i * (H + GAP) + (tallest - (L.length * (H + GAP) - GAP)) / 2; });
  const cx = (L.length ? W + COL : 0);
  const C = { ...center, side: 'center', w: W, h: 64, x: cx, y: (tallest - 64) / 2 };
  R.forEach((c) => { c.x = cx + W + COL; c.y = c.i * (H + GAP) + (tallest - (R.length * (H + GAP) - GAP)) / 2; });
  const edges = [
    ...L.map((c) => ({ x1: c.x + W, y1: c.y + H / 2, x2: C.x, y2: C.y + C.h / 2, label: c.fields.join(', '), side: 'in' })),
    ...R.map((c) => ({ x1: C.x + W, y1: C.y + C.h / 2, x2: c.x, y2: c.y + H / 2, label: c.fields.join(', '), side: 'out' })),
  ];
  return {
    center: C, cards: [...L, ...R], edges,
    omitted: { in: Math.max(0, left.length - cap), out: Math.max(0, right.length - cap) },
    totals: { in: left.length, out: right.length },
    cap,
    width: R.length ? C.x + W + COL + W : C.x + W, height: Math.max(tallest, C.h),
  };
}

/* ---------------------------------------------------------- search */

/** Ids of the nodes whose title, field names or full values contain `q`. */
export function matchNodes(graph, q) {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return [];
  return graph.nodes.filter((n) => String(n.title).toLowerCase().includes(s) ||
    n.rows.some((r) => String(r.key).toLowerCase().includes(s) || String(r.full).toLowerCase().includes(s)))
    .map((n) => n.id);
}

/** Does a record contain `q` anywhere, in a key or a value? */
export function recordMatches(rec, q) {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return true;
  const walk = (v) => {
    if (Array.isArray(v)) return v.some(walk);
    if (isObj(v)) return Object.entries(v).some(([k, x]) => k.toLowerCase().includes(s) || walk(x));
    return String(v).toLowerCase().includes(s);
  };
  return walk(rec);
}
