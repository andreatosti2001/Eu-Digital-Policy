/* ============================================================
   agent/scout/corpus.mjs — reading the corpus, read-only

   The Scout has two retrieval surfaces, and this is the one that
   always works: the repository itself. Reading `data/claims.json` is
   a real retrieval of a real artifact at a real locator, and it is
   what lets the Scout say something true even when the network is
   shut.

   WHAT THIS MODULE IS CAREFUL ABOUT. A source record in
   `data/sources.json` is the corpus's account of a document. It is
   not the document. Everything returned here is therefore labelled
   as `recorded_*` rather than as the thing itself: `recorded_title`
   is what the corpus says the title is, which is a fact about the
   corpus and only a claim about the world. The Scout carries that
   distinction into its records, because collapsing it is exactly how
   an unverified citation starts looking verified.

   Nothing here writes. `data/` is the legal record; an agent that
   opens it for writing has already broken the rule, whatever it
   then does.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../schemas/types.mjs';
import { sha256 } from './retrieve.mjs';

const DATA = join(REPO_ROOT, 'data');

const cache = new Map();

/** Read one dataset, once, with the sha256 of the bytes actually
 *  read — so a record can say which version of the file it saw. */
export function dataset(name) {
  if (!cache.has(name)) {
    const path = join(DATA, `${name}.json`);
    const bytes = readFileSync(path);
    cache.set(name, {
      name,
      path: `data/${name}.json`,
      checksum: sha256(bytes),
      read_at: new Date().toISOString(),
      json: JSON.parse(bytes.toString('utf8')),
    });
  }
  return cache.get(name);
}

/** The locator convention used in every record this agent emits: the
 *  repository path, then the id of the record inside it. A reviewer
 *  can follow it without being told how. */
export const locatorFor = (path, id) => `${path}#${id}`;

/**
 * What a record carries about the file it came from: the path, the
 * checksum and the read time, and deliberately NOT the parsed
 * contents.
 *
 * Attaching the whole dataset here is what a first draft did, and it
 * put a 74 KB copy of `data/claims.json` into a single trace line the
 * moment a tool span captured its own return value. That is the
 * second home this architecture exists to prevent, arriving through
 * the back door of an output capture — so the parsed corpus never
 * leaves this module.
 */
const meta = (ds) => ({ name: ds.name, path: ds.path, checksum: ds.checksum, read_at: ds.read_at });

export function claim(claimId) {
  const ds = dataset('claims');
  const found = (ds.json.claims ?? []).find((c) => c.id === claimId);
  return found ? { ...found, _dataset: meta(ds), _locator: locatorFor(ds.path, found.id) } : null;
}

export function claimIds() {
  return (dataset('claims').json.claims ?? []).map((c) => c.id);
}

export function source(sourceId) {
  const ds = dataset('sources');
  const found = (ds.json.sources ?? []).find((s) => s.id === sourceId);
  if (!found) return null;
  return {
    id: found.id,
    _dataset: meta(ds),
    _locator: locatorFor(ds.path, found.id),
    /* Deliberately renamed on the way out. These are the corpus's
       assertions about a document nobody in this run has opened. */
    recorded_title: found.title ?? null,
    recorded_publisher: found.publisher_name ?? found.publisher ?? null,
    recorded_published: found.published ?? null,
    recorded_type: found.type ?? null,
    recorded_tier: found.tier ?? null,
    recorded_url: found.url ?? null,
    recorded_url_status: found.url_status ?? null,
    recorded_accessed: found.accessed ?? null,
    recorded_note: found.note ?? null,
    /* `resolution: "self-reference"` is how sources.json marks the
       placeholder that stands in where no external source has been
       located. A claim resting only on one of those has no external
       provenance at all, and that is a finding rather than a source. */
    is_placeholder: found.resolution === 'self-reference' || found.url_status === 'url:none',
  };
}

/**
 * What the Scout will go looking for, given a claim: every source the
 * claim cites, resolved against sources.json, split by whether there
 * is anything to retrieve at all.
 */
export function retrievalPlan(claimRecord) {
  const cited = (claimRecord.sources ?? []).map((s) => ({
    supports: s.supports ?? null,
    locator_in_source: s.locator ?? null,
    source: source(s.source_id),
    source_id: s.source_id,
  }));

  return {
    cited,
    /* Resolvable, has a URL, and is not the brief's own placeholder. */
    retrievable: cited.filter((c) => c.source && !c.source.is_placeholder && c.source.recorded_url),
    /* The corpus says outright that no external source was located. */
    placeholders: cited.filter((c) => c.source && c.source.is_placeholder),
    /* Cited but not present in sources.json at all — a broken
       reference, and a different finding from an unreachable one. */
    dangling: cited.filter((c) => !c.source),
    /* Resolvable, real, but carrying no URL to fetch. */
    unfetchable: cited.filter((c) => c.source && !c.source.is_placeholder && !c.source.recorded_url),
  };
}
