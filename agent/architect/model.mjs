/* ============================================================
   agent/architect/model.mjs — the information model, read as a
   structure rather than as data

   Every other agent in this repository reads `data/` for what it
   SAYS. This one reads it for what it CAN say: which containers
   exist, which fields they carry, which fields are references and
   what they resolve against, which vocabularies are the enum
   authority and who else holds a copy of one, and where a value is
   prose that the corpus elsewhere carries as a record.

   Everything here is READ. There is no write path in this
   directory, and the suite scans every module for one and hashes
   the whole of `data/` around a full run, the way
   `agent/depth/` and `agent/integrate/` are held.

   THREE THINGS THIS DELIBERATELY DOES NOT DO.

   It does not know anything about EU law. Every structure below is
   derived from the files in this repository — the containers are
   the arrays that are actually there, the reference edges are the
   ones `tools/validate.mjs` actually resolves, the vocabularies are
   the ones `data/taxonomy.json` actually declares. A finding that
   rested on "the EU regulatory system also has X" would be model
   knowledge asserted about EU law, which is the one thing this
   project refuses outright.

   It does not read the prose of the brief. `index.html` is read as
   MARKUP — which pages exist, which modules they load, how large
   the inlined content blob is — and never as sentences. What the
   brief argues is the author's, and no agent here judges it.

   It does not decide anything. It answers questions; `lenses.mjs`
   asks them and `boundary.mjs` decides which of the answers are
   this agent's to report at all.
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpus, HOME_OF } from '../integrate/canonical.mjs';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** A field whose value is meant to be read by a person, not
 *  resolved by a machine. Named here because the question "is a
 *  fact being forced into prose?" is only answerable against a
 *  stated list of what counts as prose. */
export const PROSE_FIELDS = new Set([
  'summary', 'rationale', 'note', 'definition', 'statement', 'objective',
  'risk_logic', 'enforcement_mechanism', 'implementation_model', 'obligation',
  'required_action', 'behavioural_outcome', 'outcome', 'why', 'dek',
  'verification_note', 'resolution_note', 'supersedes', 'depends_on',
  'exemptions', 'heading', 'scope', 'title', 'full_name', 'short_name',
]);

/** The containers this corpus actually has: an array of records,
 *  each with an id, inside a dataset. Read rather than declared, so
 *  a new one appears here the day it is added. */
export function containersOf(db) {
  const out = [];
  for (const [dataset, holder] of Object.entries(db)) {
    if (!holder || typeof holder !== 'object') continue;
    for (const [key, value] of Object.entries(holder)) {
      if (key.startsWith('$') || !Array.isArray(value) || !value.length) continue;
      const withId = value.filter((r) => r && typeof r === 'object' && typeof r.id === 'string');
      out.push({
        dataset: `data/${dataset}.json`,
        container: key,
        records: value.length,
        /* A container whose records carry no id is a list of values,
           not a set of entities. `brief.reading_graph` is the
           example: it is edges, and it says so by having none. */
        identified: withId.length === value.length && withId.length > 0,
        fields: fieldCensusOf(value),
        nested: nestedFieldCensusOf(value),
      });
    }
  }
  return out.sort((a, b) => a.dataset.localeCompare(b.dataset) || a.container.localeCompare(b.container));
}

/** Which fields appear on a container's records, how often, and
 *  what shape their values take. Counted, never assumed: a field
 *  present on 12 of 23 records is a different fact from one present
 *  on all of them. */
export function fieldCensusOf(records) {
  const census = new Map();
  for (const r of records) {
    if (!r || typeof r !== 'object') continue;
    for (const [k, v] of Object.entries(r)) {
      if (!census.has(k)) census.set(k, { field: k, present: 0, nulls: 0, empty: 0, shapes: new Set(), samples: [] });
      const e = census.get(k);
      e.present++;
      if (v === null) e.nulls++;
      else if (Array.isArray(v) && !v.length) e.empty++;
      e.shapes.add(shapeOf(v));
      if (e.samples.length < 4 && v !== null && !(Array.isArray(v) && !v.length)) e.samples.push(v);
    }
  }
  return [...census.values()].map((e) => ({ ...e, shapes: [...e.shapes].sort(), of: records.length }));
}

/**
 * The same census, by full path, so a field nested inside an object
 * is visible.
 *
 * `sanction_ceiling` lives under `dna` on an instrument and
 * `fine_eur` sits at the top level of an enforcement action. A
 * census that only looked at top-level keys would compare the two
 * and see nothing, which is how "the model stores one concept two
 * ways" stays invisible.
 */
export function nestedFieldCensusOf(records, { maxDepth = 4 } = {}) {
  const census = new Map();
  const visit = (node, path, depth) => {
    if (depth > maxDepth || node === null || node === undefined) return;
    if (Array.isArray(node)) return node.forEach((x) => visit(x, path, depth));
    if (typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      const p = [...path, k];
      const key = p.join('.');
      if (!census.has(key)) census.set(key, { path: key, field: k, present: 0, nulls: 0, shapes: new Set(), samples: [] });
      const e = census.get(key);
      e.present++;
      if (v === null) e.nulls++;
      e.shapes.add(shapeOf(v));
      if (e.samples.length < 4 && v !== null) e.samples.push(v);
      if (v && typeof v === 'object') visit(v, p, depth + 1);
    }
  };
  for (const r of records) visit(r, [], 0);
  return [...census.values()].map((e) => ({ ...e, shapes: [...e.shapes].sort(), of: records.length }));
}

export function shapeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return v.length ? `array<${[...new Set(v.map(shapeOf))].sort().join('|')}>` : 'array<empty>';
  if (typeof v === 'object') return 'object';
  return typeof v;
}

/**
 * The vocabularies, and everyone who holds a copy of one.
 *
 * `data/taxonomy.json` is the enum authority — AGENTS.md says so
 * and every dataset resolves against it. A second copy of a
 * dimension's member list, anywhere, is a second home for one fact,
 * and two copies can disagree. This finds the copies by reading the
 * modules in `js/` for an array literal whose members are the
 * dimension's own terms, stripped of the `dimension:` prefix the
 * taxonomy gives them.
 */
export function vocabulariesOf(db, { jsDir = join(REPO_ROOT, 'js') } = {}) {
  const dims = [];
  for (const [dimension, terms] of Object.entries(db.taxonomy ?? {})) {
    if (dimension.startsWith('$') || !Array.isArray(terms)) continue;
    dims.push({
      dimension,
      terms: terms.map((t) => t.id).filter(Boolean),
      /* The bare word each term id ends with. A module holding a
         copy of the vocabulary holds these, not the prefixed ids. */
      bare: terms.map((t) => String(t.id).split(':').pop()).filter(Boolean),
    });
  }

  const modules = existsSync(jsDir)
    ? readdirSync(jsDir).filter((f) => f.endsWith('.js')).map((f) => ({ path: `js/${f}`, src: readFileSync(join(jsDir, f), 'utf8') }))
    : [];

  for (const d of dims) {
    d.copies = [];
    if (d.bare.length < 3) continue;
    for (const m of modules) {
      for (const literal of arrayLiteralsOf(m.src)) {
        /* Matched on the bare words, because a module holding the
           PREFIXED ids would be resolving against the taxonomy
           rather than copying it. */
        const covered = d.bare.filter((b) => literal.members.includes(b));
        if (covered.length < Math.max(3, Math.ceil(d.bare.length * 0.7))) continue;
        d.copies.push({
          module: m.path,
          name: literal.name,
          covered: covered.length,
          of: d.bare.length,
          complete: covered.length === d.bare.length && literal.members.length === d.bare.length,
          missing: d.bare.filter((b) => !literal.members.includes(b)),
          extra: literal.members.filter((x) => !d.bare.includes(x)),
        });
      }
    }
  }
  return dims;
}

/**
 * Array literals of bare string members, with the name they are
 * bound to.
 *
 * ONLY AN ARRAY LITERAL COUNTS AS A COPY, and the distinction is
 * the whole reason this is not a regex over every string in the
 * file. `js/format.js` branches on three of the four
 * `date_precision` terms and falls through on the fourth — that is
 * a DISPATCH, and a renderer has to handle each value of an enum
 * individually whatever the vocabulary is stored in. `js/dna.js`
 * holds `DIMENSIONS = ['regulated_actor', …]`, which is a LIST, and
 * it decides what rows the comparison table has: adding a term to
 * `data/taxonomy.json` adds no row. Only the second is a second
 * home for the vocabulary, and only the second is reported.
 */
export function arrayLiteralsOf(src) {
  const out = [];
  for (const m of src.matchAll(/(?:(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*)?\[([^[\]{}();]*?)\]/g)) {
    const members = [...m[2].matchAll(/'([a-z][a-z0-9_]{2,40})'/g)].map((x) => x[1]);
    if (members.length < 3) continue;
    /* Every member must be a bare string: an array mixing literals
       with expressions is not a vocabulary copy. */
    const stripped = m[2].replace(/'[^']*'/g, '').replace(/[\s,]/g, '');
    if (stripped.length) continue;
    out.push({ name: m[1] ?? null, members });
  }
  return out;
}

/**
 * Where a vocabulary's terms are actually USED as keys on records,
 * as opposed to as values in a field.
 *
 * `dna_dimension` is the case this exists for: the taxonomy
 * declares the dimensions of the instrument comparison, and the
 * comparison stores them as the KEYS of an object rather than as
 * values anywhere. Nothing in `tools/validate.mjs` compares the
 * two, so a declared dimension nothing stores, and a stored key the
 * taxonomy does not declare, both pass every check in the
 * repository.
 */
export function keyedVocabularyUse(db, { dimension, container, field }) {
  const terms = (db.taxonomy?.[dimension] ?? []).map((t) => String(t.id).split(':').pop());
  const records = container.split('.').reduce((o, k) => o?.[k], db) ?? [];
  const used = new Map();
  for (const r of records) {
    const holder = r?.[field];
    if (!holder || typeof holder !== 'object') continue;
    for (const k of Object.keys(holder)) used.set(k, (used.get(k) ?? 0) + 1);
  }
  return {
    dimension,
    where: `${container}[].${field}`,
    declared: terms,
    used: [...used.keys()].sort(),
    counts: Object.fromEntries(used),
    records: records.length,
    carrying: records.filter((r) => r?.[field] && typeof r[field] === 'object').length,
    declared_unused: terms.filter((t) => !used.has(t)),
    used_undeclared: [...used.keys()].filter((k) => !terms.includes(k)).sort(),
  };
}

/** Every id the corpus carries, and the short names an instrument
 *  also answers to. Both are needed to tell "this prose names a
 *  record" from "this prose is prose". */
export function namesOf(corpus) {
  const byName = new Map();
  const add = (name, id, kind) => {
    const key = String(name ?? '').trim().toLowerCase();
    if (key.length < 4) return;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push({ id, kind, name });
  };
  for (const i of corpus.instruments) {
    add(i.short_name, i.id, 'instrument');
    add(i.full_name, i.id, 'instrument');
    for (const a of i.aliases ?? []) add(a, i.id, 'instrument');
  }
  for (const inst of corpus.db.institutions?.institutions ?? []) {
    add(inst.short_name, inst.id, 'institution');
    add(inst.full_name, inst.id, 'institution');
  }
  return byName;
}

/**
 * Walk every record in the corpus and report each string-valued
 * leaf with where it sits. The lenses ask questions of this rather
 * than each re-walking the tree.
 *
 * Bounded: `max` caps the number of leaves reported, and the count
 * always describes the whole walk. SESSION 10's lesson, applied
 * here — a truncated preview whose count describes the preview
 * tells its reader something false.
 */
export function leavesOf(db, { max = 20000 } = {}) {
  const leaves = [];
  let seen = 0;
  for (const [dataset, holder] of Object.entries(db)) {
    if (!holder || typeof holder !== 'object') continue;
    for (const [container, value] of Object.entries(holder)) {
      if (container.startsWith('$') || !Array.isArray(value)) continue;
      for (const record of value) {
        (function walk(node, path) {
          if (typeof node === 'string') {
            seen++;
            if (leaves.length < max) {
              leaves.push({ dataset: `data/${dataset}.json`, container, record_id: record?.id ?? null, path, field: path[path.length - 1], value: node });
            }
            return;
          }
          if (Array.isArray(node)) return node.forEach((x, i) => walk(x, [...path.slice(0, -1), `${path[path.length - 1]}[${i}]`, path[path.length - 1]].slice(0, path.length + 1)));
          if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, [...path, k]);
        })(record, []);
      }
    }
  }
  return { leaves, total: seen, truncated: seen > leaves.length };
}

/**
 * The page architecture, read as markup.
 *
 * Which pages exist, which modules each loads, and how large the
 * one inlined content blob is. `index.html`'s `window.__CONTENT__`
 * is a known hazard (docs/CURRENT-ARCHITECTURE.md §8): it
 * duplicates `data/brief.json`, nothing loads `brief.json` at
 * runtime, and `meta.standfirst` has already drifted. This measures
 * it rather than restating it.
 */
export function pagesOf({ root = REPO_ROOT } = {}) {
  const files = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  return files.map((file) => {
    const src = readFileSync(join(root, file), 'utf8');
    return {
      page: file,
      bytes: Buffer.byteLength(src, 'utf8'),
      modules: [...src.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]).sort(),
      stylesheets: [...src.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]).sort(),
      /* The inlined blob, measured. Its presence is the fact; what
         it says is data/brief.json's business. */
      inline_content_bytes: inlineContentBytes(src),
    };
  });
}

function inlineContentBytes(src) {
  const at = src.indexOf('window.__CONTENT__');
  if (at === -1) return 0;
  const end = src.indexOf('</script>', at);
  return end === -1 ? 0 : Buffer.byteLength(src.slice(at, end), 'utf8');
}

/**
 * One read of everything the lenses need.
 *
 * @param {{corpus?:object, root?:string}} [opts]
 */
export function readModel({ corpus, root = REPO_ROOT } = {}) {
  const c = corpus ?? loadCorpus();
  return {
    corpus: c,
    root,
    homes: HOME_OF,
    containers: containersOf(c.db),
    vocabularies: vocabulariesOf(c.db, { jsDir: join(root, 'js') }),
    names: namesOf(c),
    pages: pagesOf({ root }),
    /* The comparison model, which is the one vocabulary stored as
       object keys rather than as field values. */
    comparison: keyedVocabularyUse(c.db, { dimension: 'dna_dimension', container: 'instruments.instruments', field: 'dna' }),
  };
}
