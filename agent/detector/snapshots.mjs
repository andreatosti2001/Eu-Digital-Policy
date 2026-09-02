/* ============================================================
   agent/detector/snapshots.mjs — what "a previous source snapshot"
   actually is in this repository

   The brief lists "previous source snapshots where available" as an
   input, and the honest answer to what is available is narrower than
   the phrase suggests. **Nothing in this repository stores a
   document's bytes.** The Scout fetches and hashes; the digests are
   previews and say so; `agent/records/` holds contract records, and
   the gateway deliberately puts only a pointer into the trace
   because "copying the body into the trace would make the trace a
   second home for every fact the record carries".

   So a snapshot here is: **the sha256 an earlier retrieval recorded,
   plus the values that retrieval read.** That supports exactly two
   questions and no more —

     did the document change?        the checksums differ
     did what it says change?        the values differ

   — and it does NOT support "what changed in it", because there is
   no earlier text to diff against. Every record this detector emits
   carries that limit in its `source_snapshot.note` rather than
   leaving a reader of the report to assume a diff was possible.

   AND THE ABSENCE IS NEVER AGREEMENT. Where there is no earlier
   checksum, `bytes_changed` is **null**, not `false`. Nothing was
   compared, and an absence of comparison is not a finding of no
   change — the contract has a rule refusing the combination, and
   this is the module that must not produce it. It is the same
   distinction the datasets keep between `null` and `unknown`, and
   the same one the regulatory-change-detection skill states in
   words: no visible change is not evidence that nothing changed.
   ============================================================ */

import { STATUS_FROM_TAXONOMY } from './classify.mjs';

/** The attributes a VerificationRecord states about an act, and the
 *  name each goes by on the record. One list, so a caller cannot
 *  compare an attribute the snapshot layer does not carry. */
export const VERIFIED_ATTRIBUTES = [
  'legal_status', 'publication_date', 'entry_into_force_date', 'applicability_date', 'document_id',
];

/** The retrieved document a verification stands on, chosen the same
 *  way `agent/integrate/sources.mjs` chooses it — strongest support
 *  first, never whichever came first in the array. Imported rather
 *  than reimplemented would be better still, and it is: see below. */
export { retrievedDocumentOf } from '../integrate/sources.mjs';

/**
 * Index verifications by the document they read, so an earlier
 * reading of the same document can be found.
 *
 * Keyed on the URL rather than on the source id: a verification of a
 * document the bibliography does not carry has no source id, and
 * those are exactly the ones a change detector most wants to watch.
 *
 * @param {object[]} verifications
 * @param {(v:object)=>object|null} docOf
 * @returns {Map<string, object[]>} url → verifications, oldest first
 */
export function byDocument(verifications, docOf) {
  const out = new Map();
  for (const v of verifications ?? []) {
    const doc = docOf(v);
    const url = doc?.url;
    if (!url) continue;
    if (!out.has(url)) out.set(url, []);
    out.get(url).push(v);
  }
  for (const [, list] of out) {
    list.sort((a, b) => String(a.checked_at ?? '').localeCompare(String(b.checked_at ?? '')));
  }
  return out;
}

/**
 * The snapshot block for one verification: what an earlier reading
 * of the same document recorded, and whether the bytes moved.
 *
 * @returns {{block:object|null, previous:object|null}}
 *   `block` is the contract's `source_snapshot` shape, or null where
 *   this detection compares a document against the corpus rather
 *   than against an earlier reading of itself.
 */
export function snapshotFor(verification, { history = [], docOf }) {
  const doc = docOf(verification);
  const current = doc?.checksum ?? null;

  /* Everything read before this one, most recent first. A
     verification that supersedes another is still just an earlier
     reading here: which verdict stands is the Verifier's question,
     not this module's. */
  const earlier = history
    .filter((v) => v.verification_id !== verification.verification_id)
    .filter((v) => String(v.checked_at ?? '') <= String(verification.checked_at ?? ''))
    .slice()
    .reverse();

  const previous = earlier[0] ?? null;
  if (!previous) {
    return {
      previous: null,
      block: current === null ? null : {
        previous_verification_id: null,
        previous_checksum: null,
        current_checksum: current,
        /* NOT false. Nothing was compared. */
        bytes_changed: null,
        note: 'No earlier retrieval of this document is on record, so whether it changed is not something this run established. The current checksum is carried so a later run can answer the question this one could not.',
      },
    };
  }

  const previousChecksum = docOf(previous)?.checksum ?? null;
  const comparable = Boolean(previousChecksum && current);

  return {
    previous,
    block: {
      previous_verification_id: previous.verification_id,
      previous_checksum: previousChecksum,
      current_checksum: current,
      bytes_changed: comparable ? previousChecksum !== current : null,
      note: comparable
        ? `Compared against ${previous.verification_id}, which read the same address on ${String(previous.checked_at ?? '').slice(0, 10)}. The two retrievals ${previousChecksum === current ? 'hash identically, so the bytes did not change' : 'hash differently, so the document changed'}. This repository stores no document bodies: that says ${previousChecksum === current ? 'the bytes are the same' : 'THAT it changed'} and never where.`
        : `An earlier reading exists (${previous.verification_id}) but ${previousChecksum ? 'this run' : 'it'} recorded no checksum, so the bytes were not compared. That is an absence, not a finding of no change.`,
    },
  };
}

/**
 * What the corpus currently asserts about one instrument, in the
 * agent layer's own status vocabulary.
 *
 * Returns null where the corpus carries no record — which the
 * classifier reads as the `NEW` case, and which is deliberately
 * distinct from a record carrying a status this module cannot map.
 */
export function corpusStatusOf(corpus, instrument_id) {
  const ins = corpus.instrumentById.get(instrument_id);
  if (!ins) return { present: false, taxonomy: null, status: null, why: `data/instruments.json carries no record with id "${instrument_id}".` };
  const taxonomy = ins.legislative_status ?? null;
  if (!taxonomy) {
    return { present: true, taxonomy: null, status: null, why: `${instrument_id} carries no legislative_status.` };
  }
  const status = STATUS_FROM_TAXONOMY[taxonomy] ?? null;
  return {
    present: true,
    taxonomy,
    status,
    why: status
      ? `${instrument_id} carries legislative_status "${taxonomy}", which is "${status}" in the agent layer's vocabulary.`
      : `${instrument_id} carries legislative_status "${taxonomy}", which maps to no status in LEGAL_STATUS_TAXONOMY. Five of the twelve agent-layer statuses have no taxonomy term and this is the reverse case: a taxonomy term the agent layer cannot name. Reported rather than approximated.`,
  };
}

/**
 * Every timeline event for an instrument of a given event type.
 *
 * Returns the list rather than one value: an act that applies in
 * stages has several application events, and picking one to compare
 * against would be choosing which stage a document meant. The caller
 * decides what to do with more than one, and
 * `agent/integrate/conflicts.mjs` already refuses that choice for
 * the same reason.
 */
export function eventsOf(corpus, instrument_id, event_type) {
  return corpus.events.filter((e) => e.instrument === instrument_id && e.event_type === event_type);
}

/** The timeline event_type each verified date attribute corresponds
 *  to. Partial on purpose: `publication_date` has no event type of
 *  its own in this corpus, and a null says so rather than borrowing
 *  the nearest. The same partial map the integrator carries, and for
 *  the same reason. */
export const EVENT_TYPE_FOR = {
  entry_into_force_date: 'event:entry-into-force',
  applicability_date: 'event:application',
  publication_date: null,
};
