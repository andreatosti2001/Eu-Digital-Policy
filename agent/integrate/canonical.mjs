/* ============================================================
   agent/integrate/canonical.mjs — the canonical corpus, read

   The datasets in data/ are the legal record: what the site tells a
   reader about EU law. This module is the ONLY way the adapter sees
   them, and it does exactly one thing — read them and index them.

   IT IS READ-ONLY, AND THAT IS ENFORCED RATHER THAN PROMISED. There
   is no write path in this directory: no `writeFileSync`, no
   `appendFileSync`, no `createWriteStream`, no `rmSync`, no
   `unlinkSync`, no `mkdirSync` outside the record store the agent
   layer already owns. `selftest.mjs` scans every module here for
   those calls and hashes the whole of data/ around a full run. The
   Legal Verifier holds itself to the same rule, for the same reason:
   a proposed change to the legal record does not land because an
   agent was confident.

   IT MIRRORS `js/data.js`, IT DOES NOT REPLACE IT. That module is
   the site's single data gateway and nothing here is loaded by a
   page. This is the agent layer's reader, on the same principle
   applied twice: one module fetches, everything else asks it.

   NOTHING IS DERIVED HERE. No evidence grade, no pipeline stage, no
   competent authority. Those are computed at render time by
   js/format.js, js/pipeline.js and js/dna.js, and computing them a
   second time in the agent layer would be the second copy the whole
   architecture exists to prevent. What this module builds is
   INDEXES — a Map from an id to the record that already exists —
   which is not a derived fact but a way of finding one.
   ============================================================ */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { REPO_ROOT } from '../schemas/types.mjs';

export const DATA_DIR = join(REPO_ROOT, 'data');

/** The self-citation placeholder. It is not a source, and every
 *  part of this repository already treats it as one: evidenceGrade()
 *  filters it before grading, freshness.mjs calls it
 *  "self-reference — not a source at all", and validate.mjs's
 *  unverified report excludes it when looking for a strongest
 *  direct source. This module names it once so nothing here has to
 *  re-derive the rule. */
export const SELF_SOURCE_ID = 'src-brief-original';

/** Which fields on a canonical record carry its provenance — where
 *  the fact came from, when somebody looked, and what is still
 *  open. These are the fields a proposal must leave standing:
 *  removing an asterisk, a reference gap, a `requires_verification`
 *  flag or a `verification_note` is red tier under
 *  AI-SAFE-BOUNDARIES §3, and `published` / `accessed` /
 *  `last_verified` are the only evidence the record was ever
 *  checked at all.
 *
 *  Keyed by dataset path, because a claim and a source do not carry
 *  the same provenance and a single flat list would let a check
 *  pass by looking for a field that dataset never had. */
export const PROVENANCE_FIELDS = {
  'data/claims.json': ['published', 'last_verified', 'verification_note', 'sources', 'reference_gap', 'gap_note', 'requires_verification'],
  'data/sources.json': ['published', 'accessed', 'note', 'url', 'url_status', 'resolution', 'resolution_note', 'tier', 'publisher', 'publisher_name'],
  'data/timeline.json': ['sources', 'requires_verification', 'verification_note', 'date_precision'],
  'data/enforcement.json': ['sources', 'requires_verification', 'verification_note', 'decision_date'],
  'data/instruments.json': ['sources', 'last_verified', 'status_note', 'milestones'],
  'data/institutions.json': ['sources', 'claims'],
  'data/glossary.json': ['sources', 'requires_verification', 'verification_note'],
  'data/applicability.json': ['sources', 'requires_verification', 'verification_note', 'rationale'],
};

/** Where a record of a given kind lives. One home per fact, stated
 *  once so no caller has to guess the filename from the kind. */
export const HOME_OF = {
  claim: 'data/claims.json',
  source: 'data/sources.json',
  timeline_event: 'data/timeline.json',
  enforcement_action: 'data/enforcement.json',
  instrument: 'data/instruments.json',
  provision: 'data/instruments.json',
  relationship: 'data/instruments.json',
  institution: 'data/institutions.json',
  competence: 'data/institutions.json',
  glossary_term: 'data/glossary.json',
  applicability_rule: 'data/applicability.json',
  taxonomy_term: 'data/taxonomy.json',
  brief_part: 'data/brief.json',
};

const readJson = (name) => JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'));

/**
 * Read data/ once and index it.
 *
 * @param {{dir?:string}} [opts] — a directory, for the suite's
 *   fixture corpus. It defaults to the real one and the suite is the
 *   only caller that passes anything else.
 */
export function loadCorpus({ dir = DATA_DIR } = {}) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const db = {};
  for (const f of files) db[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, f), 'utf8'));

  const arr = (x) => (Array.isArray(x) ? x : []);
  const claims = arr(db.claims?.claims);
  const sources = arr(db.sources?.sources);
  const instruments = arr(db.instruments?.instruments);
  const events = arr(db.timeline?.events);

  return {
    dir,
    files,
    db,
    claims,
    sources,
    instruments,
    events,
    /* Indexes, not derivations: a way of finding the record that is
       already there, never a second copy of what it says. */
    claimById: new Map(claims.map((c) => [c.id, c])),
    sourceById: new Map(sources.map((s) => [s.id, s])),
    instrumentById: new Map(instruments.map((i) => [i.id, i])),
    eventById: new Map(events.map((e) => [e.id, e])),
    /* Every id in the corpus, across every dataset. What "an id
       already exists" means here — validate.mjs errors on a
       duplicate across all datasets, so the namespace is global and
       a check that only looked in one file would miss a collision. */
    allIds: collectAllIds(db),
    /* `$last_verified` per dataset, and how much spread the
       per-record dates below it actually show. VERIFICATION-POLICY
       §5: the field is per-record and the practice is not, so a
       date clustered onto a handful of values is a COMPILATION date
       and must not be read as evidence that any one record was
       individually checked. The rule is in verificationDatesOf. */
    verificationDates: verificationDatesOf(db),
  };
}

function collectAllIds(db) {
  const ids = new Set();
  const arr = (x) => (Array.isArray(x) ? x : []);
  const add = (x) => { if (typeof x === 'string') ids.add(x); };
  for (const i of arr(db.instruments?.instruments)) {
    add(i.id);
    for (const p of arr(i.provisions)) add(p.id);
  }
  for (const r of arr(db.instruments?.relationships)) add(r.id);
  for (const key of ['institutions', 'sources', 'claims', 'enforcement', 'glossary', 'timeline', 'applicability', 'brief']) {
    const holder = db[key];
    if (!holder) continue;
    for (const v of Object.values(holder)) {
      if (!Array.isArray(v)) continue;
      for (const x of v) add(x?.id);
    }
  }
  for (const [k, v] of Object.entries(db.taxonomy ?? {})) {
    if (k.startsWith('$') || !Array.isArray(v)) continue;
    for (const t of v) add(t.id);
  }
  return ids;
}

function verificationDatesOf(db) {
  const out = {};
  for (const [name, d] of Object.entries(db)) {
    const per = [];
    (function walk(o) {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) {
          if (k === 'last_verified' && typeof v === 'string') per.push(v);
          else walk(v);
        }
      }
    })(d);
    const distinct = [...new Set(per)].sort();
    /* A `last_verified` used per-record shows a spread: records get
       re-read on the days somebody read them. A dataset whose 84
       records carry two distinct dates was stamped in bulk twice,
       which is what VERIFICATION-POLICY §5 records — the field is
       per-record and the practice is not.
       THE THRESHOLD IS STATED RATHER THAN TUNED: fewer than one
       distinct date per ten records. It is a signal and it is named
       as one; it does not prove a stamp, and a dataset above the
       line is not thereby proved to have been individually checked.
       This is a DIFFERENT question from the one tools/freshness.mjs
       asks — that script flags only when every date in the whole
       repository is identical — so the two are not two homes for
       one fact. */
    out[name] = {
      file: d.$last_verified ?? null,
      per_record_count: per.length,
      distinct,
      records_per_distinct_date: distinct.length ? Number((per.length / distinct.length).toFixed(1)) : null,
      is_compilation_date: distinct.length <= 1 || (per.length / distinct.length) >= 10,
    };
  }
  return out;
}

/** Every claim reference to a source, flattened, so a caller does
 *  not walk the same nesting five times. */
export function claimSourceRefs(corpus) {
  const out = [];
  for (const c of corpus.claims) {
    for (const s of c.sources ?? []) out.push({ claim_id: c.id, ...s });
  }
  return out;
}

/**
 * sha256 of every file in data/, so a test can assert a full run
 * left the legal record byte-identical. The Verifier's suite does
 * the same thing; this is the same guarantee for the layer that
 * actually proposes changes to it, where it matters more.
 */
export function hashDataDir(dir = DATA_DIR) {
  const out = {};
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (!statSync(p).isFile()) continue;
    out[f] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
}

export { readJson };
