/* ============================================================
   agent/schemas/identity.mjs — a record's id, derived from what
   the record IS

   Until SESSION 13 every agent minted ids from a per-run counter
   (`#id(prefix) → prefix-NNN`). Two runs over an unchanged corpus
   did reproduce the same ids, so the defect was easy to miss — but
   the number is a QUEUE POSITION, not an identity. Measured against
   the real corpus: removing one unrelated instrument from data/
   renumbered 37 of the 55 depth findings that were otherwise
   untouched. Nothing downstream could tell "this finding is the one
   I saw last week" from "this is the finding that happens to be
   fourteenth this time".

   A knowledge graph is a structure of stable nodes. This module is
   the node identity: the id is a function of the finding's own
   content — its kind, the full sorted set of entities it is about,
   its subject, and where those three are genuinely not enough, an
   explicit discriminator.

   THERE IS NO ID STORE, AND THERE MUST NEVER BE ONE. A table
   mapping an old id to a new one would be the second home this
   architecture exists to prevent: two copies of a record's identity
   that can disagree. The id is recomputed from the content every
   time, by anyone, in any process, with nothing to load. That is
   the same rule the site's own data follows — derivation over
   storage.

   `IdMinter` is NOT that store. It never supplies an id and is
   never consulted before minting one; it only remembers, for the
   length of one run, which content produced which id, so that two
   DIFFERENT findings landing on the same id fail loudly instead of
   quietly becoming one node. A run-scoped contradiction check is
   not a lookup table: delete it and every id is unchanged.

   Ids must satisfy F.id's pattern — ^[a-z0-9][a-z0-9._:/-]{2,119}$
   — because they travel through filenames, URLs and log lines.
   ============================================================ */

import { createHash } from 'node:crypto';

/** Hex characters of SHA-256 kept. 12 is 48 bits: at the corpus
 *  scale this repository works at (tens of records per run, low
 *  thousands across its history) the chance of two distinct
 *  findings colliding is negligible, and `IdMinter` turns the
 *  negligible case into a thrown error rather than a silent merge.
 *  Longer would push a prefixed id past what a terminal column
 *  shows; shorter would be arithmetic nobody should be doing. */
export const ID_DIGEST_HEX = 12;

const norm = (v) => (v === null || v === undefined ? null : String(v));

/** A prefix in the shape ids are allowed to take. */
export function idPrefix(prefix) {
  const p = String(prefix ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (p.length < 2) throw new Error(`id prefix "${prefix}" is empty or too short once normalised — an id with no prefix says nothing about what it identifies`);
  return p;
}

/**
 * The affected-entity set, as identity rather than as annotation.
 *
 * `kind`, `id` and `path` say WHICH record the finding is about.
 * `field` and `note` are the finding's description of it and are
 * deliberately excluded: rewording a note must not mint a new node.
 *
 * @param {Array<object|string>} entities
 * @returns {string[]} sorted, de-duplicated
 */
export function entityKeys(entities = []) {
  const keys = (Array.isArray(entities) ? entities : [entities])
    .filter((e) => e !== null && e !== undefined)
    .map((e) => (typeof e === 'object'
      ? `${norm(e.kind) ?? ''}:${norm(e.id) ?? ''}:${norm(e.path) ?? ''}`
      : `:${String(e)}:`))
    .filter((k) => k !== '::');
  return [...new Set(keys)].sort();
}

/**
 * The canonical form of what a record is about. JSON rather than a
 * delimiter-joined string, so no value can impersonate a separator:
 * a subject containing "|" would otherwise be able to produce the
 * key of a different finding.
 *
 * @param {{kind:string, entities?:Array, subject?:*, discriminator?:*}} parts
 */
export function contentKey({ kind, entities = [], subject = null, discriminator = null }) {
  if (kind === null || kind === undefined || String(kind) === '') {
    throw new Error('contentKey needs a kind: an id derived from no kind is derived from nothing');
  }
  return JSON.stringify([String(kind), entityKeys(entities), norm(subject), norm(discriminator)]);
}

/**
 * `prefix-<12 hex>`, reproducible from the content alone.
 *
 * The prefix is hashed along with the content, so two record kinds
 * that happen to share a kind/entity/subject triple do not differ
 * only in the human-readable half of their id.
 */
export function contentId(prefix, parts) {
  const p = idPrefix(prefix);
  const digest = createHash('sha256').update(`${p} ${contentKey(parts)}`, 'utf8').digest('hex').slice(0, ID_DIGEST_HEX);
  const id = `${p}-${digest}`;
  if (id.length > 120) throw new Error(`id "${id}" is longer than F.id permits — shorten the prefix`);
  return id;
}

/**
 * A run-scoped contradiction check around `contentId`.
 *
 * Minting the same id twice from the same content is correct and
 * silent: it is the same finding, and that is the whole point of a
 * content-derived id. Minting the same id from DIFFERENT content is
 * a collision, and it throws — because the alternative is two
 * findings quietly becoming one node in a graph.
 *
 * It holds nothing across runs and is never read before minting.
 */
export class IdMinter {
  constructor() {
    /** id → the content key that produced it, this run only. */
    this.seen = new Map();
  }

  mint(prefix, parts) {
    const key = contentKey(parts);
    const id = contentId(prefix, parts);
    const prior = this.seen.get(id);
    if (prior !== undefined && prior !== key) {
      throw new Error(`id collision on "${id}": two different findings derive the same id. First: ${prior} — second: ${key}. The fix is a discriminator that names what actually differs, never a counter.`);
    }
    this.seen.set(id, key);
    return id;
  }

  /** How many distinct ids this run has minted. */
  get size() { return this.seen.size; }
}
