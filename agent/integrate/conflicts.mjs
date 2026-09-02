/* ============================================================
   agent/integrate/conflicts.mjs — requirement 6: detect conflicting
   evidence

   THE VERIFIER ALREADY FINDS DISAGREEMENTS BETWEEN TWO DOCUMENTS.
   What it cannot see is the third party to the argument: the
   canonical record. data/timeline.json states when an act applies;
   data/instruments.json states what legislative status it is in;
   data/claims.json states what the brief asserts. A verification
   that read a document and came back with a different date is not
   a disagreement between two sources — it is a disagreement between
   a source and the site.

   That is the conflict this layer exists to find, and it is the one
   with a reader on the end of it.

   FOUR KINDS, KEPT APART.

     verification_internal  a `conflict` verdict the Verifier already
                            reached between two documents, carried
                            through onto the canonical entity it is
                            about so it does not stop at the agent
                            layer
     against_canonical      a verification's stated value differs
                            from what data/ stores for the same
                            attribute of the same instrument
     between_verifications  two verifications in this run state
                            different values for one attribute
     claim_contradicted     a verification matched to a claim came
                            back `contradicted` — the source says
                            otherwise than the brief does

   NOTHING HERE IS RESOLVED, AND NOTHING HERE PROPOSES A VALUE.
   AGENT-ROLES H7: where two roles disagree on a fact, work halts and
   goes to a human; it is never resolved by seniority, recency or
   convenience. agent/verifier/conflict.mjs holds the same line and
   was built with no ranking function, no tie-break and no "most
   recent wins" for exactly this reason. This module produces
   blocking gaps and an approval request. It produces NO
   DataProposal, because it does not know which value is right and a
   proposal that named one would be this layer deciding.

   PRECISION IS NOT DISAGREEMENT. "July 2024" and "12 July 2024" are
   not in conflict; the second is narrower. `compareValues` from the
   Verifier is imported rather than reimplemented — a second
   comparison rule would manufacture conflicts out of a month and a
   day the first time the two drifted.
   ============================================================ */

import { compareValues, COMPARABLE_ATTRIBUTES } from '../verifier/conflict.mjs';
import { LEGAL_STATUS_TAXONOMY } from '../schemas/types.mjs';

export const CONFLICT_KINDS = [
  'verification_internal', 'against_canonical', 'between_verifications', 'claim_contradicted',
];

/** Which timeline event_type carries which of the Verifier's date
 *  attributes. The mapping is here because it is a statement about
 *  two vocabularies meeting, and it is deliberately partial:
 *  `publication_date` has no timeline event_type of its own in this
 *  corpus, and a null says so rather than borrowing the nearest. */
const EVENT_TYPE_FOR = {
  entry_into_force_date: 'event:entry-into-force',
  applicability_date: 'event:application',
  publication_date: null,
};

/**
 * What data/ stores for one attribute of one instrument, with where
 * it stores it. Returns null where the corpus has nothing — which is
 * an absence, not a disagreement, and the caller must not read it as
 * one.
 */
export function canonicalValue(corpus, instrument_id, attribute) {
  if (attribute === 'legal_status') {
    const ins = corpus.instrumentById.get(instrument_id);
    if (!ins?.legislative_status) return null;
    return { value: ins.legislative_status, home: 'data/instruments.json', locator: `${instrument_id}.legislative_status`, taxonomy: true };
  }
  const eventType = EVENT_TYPE_FOR[attribute];
  if (!eventType) return null;
  const events = corpus.events.filter((e) => e.instrument === instrument_id && e.event_type === eventType);
  if (events.length !== 1) {
    /* Zero is nothing to compare against. More than one is a
       staged act — the AI Act applies in stages — and picking one
       of them to compare would be this module choosing which stage
       the source meant. */
    return null;
  }
  return {
    value: events[0].date,
    home: 'data/timeline.json',
    locator: events[0].id,
    precision: events[0].date_precision ?? null,
    taxonomy: false,
  };
}

/** The Verifier's bare status word against the site's taxonomy id.
 *  Five of the twelve statuses map to nothing — `corrected`,
 *  `annulled`, `under_judicial_review`, `guidance` and
 *  `non_binding_commentary` are distinctions the Verifier draws and
 *  the site's vocabulary does not carry. A null there is a coverage
 *  gap and is NEVER a licence to file the status under a taxonomy
 *  term that means something else. */
const taxonomyStatus = (legal_status) => LEGAL_STATUS_TAXONOMY[legal_status] ?? null;

/**
 * @param {object} corpus
 * @param {{verifications:object[], resolutions?:Map<string,string[]>, asOf:string}} opts
 * @returns {Array} conflicts, unresolved, each naming both sides
 */
export function findConflicts(corpus, { verifications = [], resolutions = new Map(), asOf } = {}) {
  const out = [];
  const byId = new Map(verifications.map((v) => [v.verification_id, v]));

  /* --- 1 · what the Verifier already found ---------------------- */

  for (const v of verifications) {
    for (const c of v.conflicting_evidence ?? []) {
      const entity = (v.affected_entities ?? []).find((e) => e?.kind === 'instrument') ?? null;
      out.push({
        kind: 'verification_internal',
        instrument_id: entity?.id ?? null,
        attribute: null,
        sides: [
          { where: 'a retrieved document', value: null, note: c.disagreement },
        ],
        verification_ids: [v.verification_id],
        evidence_refs: c.evidence_refs ?? [],
        unreconciled_because: c.unreconciled_because,
        why: `${v.verification_id} returned the verdict "conflict": ${String(c.disagreement).replace(/\s+/g, ' ')}`,
        blocking: true,
        as_of: asOf ?? null,
      });
    }
  }

  /* --- 2 · a source against the canonical record ---------------- */

  for (const v of verifications) {
    if (v.verdict === 'source_unavailable') continue;
    const instruments = (v.affected_entities ?? []).filter((e) => e?.kind === 'instrument' && e.id).map((e) => e.id);
    /* Exactly one instrument, or nothing is compared. A proposition
       the Verifier could not attribute to a single act cannot be
       compared against one act's stored date without this module
       making the attribution the Verifier deliberately refused. */
    if (instruments.length !== 1) continue;
    const instrument_id = instruments[0];

    for (const attribute of COMPARABLE_ATTRIBUTES) {
      const stated = v[attribute];
      if (stated === null || stated === undefined || stated === 'unknown') continue;

      const canonical = canonicalValue(corpus, instrument_id, attribute);
      if (!canonical) continue;

      const a = attribute === 'legal_status' ? taxonomyStatus(stated) : stated;
      if (attribute === 'legal_status' && a === null) {
        /* The Verifier drew a distinction the taxonomy does not
           carry. That is a coverage gap in the vocabulary and it is
           reported as one by the caller, not as a conflict — saying
           two things disagree when one of them cannot be expressed
           would be manufacturing a disagreement out of a missing
           word. */
        continue;
      }

      const verdict = compareValues(attribute, String(a), String(canonical.value));
      if (verdict !== 'disagree') continue;

      out.push({
        kind: 'against_canonical',
        instrument_id,
        attribute,
        sides: [
          { where: `${v.verification_id} (a retrieved document)`, value: stated, note: methodFor(v, attribute) },
          { where: `${canonical.home} ${canonical.locator}`, value: canonical.value, note: canonical.precision ? `stated at ${canonical.precision} precision` : null },
        ],
        verification_ids: [v.verification_id],
        evidence_refs: [],
        unreconciled_because: 'One side is a document this run read; the other is what the site currently tells a reader. Neither displaces the other from here: the document could be superseded, and the record could be out of date, and deciding which is a decision about the law.',
        why: `${v.verification_id} read "${stated}" for the ${attribute.replace(/_/g, ' ')} of ${instrument_id}; ${canonical.home} carries "${canonical.value}" at ${canonical.locator}.`,
        blocking: true,
        as_of: asOf ?? null,
      });
    }
  }

  /* --- 3 · two verifications against each other ------------------ */

  const byInstrumentAttribute = new Map();
  for (const v of verifications) {
    const instruments = (v.affected_entities ?? []).filter((e) => e?.kind === 'instrument' && e.id).map((e) => e.id);
    if (instruments.length !== 1) continue;
    for (const attribute of COMPARABLE_ATTRIBUTES) {
      const value = v[attribute];
      if (value === null || value === undefined || value === 'unknown') continue;
      const key = `${instruments[0]}|${attribute}`;
      if (!byInstrumentAttribute.has(key)) byInstrumentAttribute.set(key, []);
      byInstrumentAttribute.get(key).push({ verification_id: v.verification_id, value });
    }
  }
  for (const [key, entries] of byInstrumentAttribute) {
    const [instrument_id, attribute] = key.split('|');
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (compareValues(attribute, String(entries[i].value), String(entries[j].value)) !== 'disagree') continue;
        out.push({
          kind: 'between_verifications',
          instrument_id,
          attribute,
          sides: [
            { where: entries[i].verification_id, value: entries[i].value, note: null },
            { where: entries[j].verification_id, value: entries[j].value, note: null },
          ],
          verification_ids: [entries[i].verification_id, entries[j].verification_id],
          evidence_refs: [],
          unreconciled_because: 'Two checks in one run state different values for one attribute of one act. Nothing in this layer ranks them, and the more recent check is not the more correct one.',
          why: `${entries[i].verification_id} states "${entries[i].value}" and ${entries[j].verification_id} states "${entries[j].value}" for the ${attribute.replace(/_/g, ' ')} of ${instrument_id}.`,
          blocking: true,
          as_of: asOf ?? null,
        });
      }
    }
  }

  /* --- 4 · a source against a claim ------------------------------ */

  for (const [claim_id, ids] of resolutions) {
    const claim = corpus.claimById.get(claim_id);
    if (!claim) continue;
    for (const vid of ids) {
      const v = byId.get(vid);
      if (v?.verdict !== 'contradicted') continue;
      out.push({
        kind: 'claim_contradicted',
        instrument_id: null,
        claim_id,
        attribute: null,
        sides: [
          { where: `${vid} (a retrieved document)`, value: v.statement, note: v.method },
          { where: `data/claims.json ${claim_id}`, value: claim.statement, note: claim.verification_note ?? null },
        ],
        verification_ids: [vid],
        evidence_refs: [],
        unreconciled_because: 'A document this run read says otherwise than the brief does. Whether the brief is wrong, the document is superseded, or the two are about different things is a reading, and this layer does not make it.',
        why: `${vid} returned "contradicted" against a proposition matched to ${claim_id}.`,
        blocking: true,
        as_of: asOf ?? null,
      });
    }
  }

  return dedupe(out);
}

/** The same disagreement stated by several propositions of one
 *  document is one disagreement. Deduplicated on what it is ABOUT —
 *  the kind, the entity and the attribute — and never on the values,
 *  which is the Verifier's own rule and the reason it found four
 *  identical conflict records in SESSION 07. */
function dedupe(rows) {
  const seen = new Map();
  for (const r of rows) {
    const key = [r.kind, r.instrument_id ?? r.claim_id ?? '', r.attribute ?? '', [...r.verification_ids].sort().join('+')].join('|');
    if (!seen.has(key)) seen.set(key, r);
  }
  return [...seen.values()];
}

function methodFor(v, attribute) {
  const entry = (v.epistemic?.fact ?? []).find((f) => f?.field === attribute)
    ?? (v.epistemic?.inference ?? []).find((f) => f?.field === attribute);
  return entry ? String(entry.statement).replace(/\s+/g, ' ') : null;
}

/**
 * Statuses the Verifier can draw and the site's vocabulary cannot
 * express. Not a conflict — a coverage gap, and reported separately
 * so the two never get counted together.
 */
export function unmappableStatuses(verifications) {
  const out = [];
  for (const v of verifications) {
    const s = v.legal_status;
    if (!s || s === 'unknown') continue;
    if (taxonomyStatus(s) !== null) continue;
    out.push({
      verification_id: v.verification_id,
      legal_status: s,
      why: `The Verifier placed this act in "${s}". data/taxonomy.json's status dimension has no term for it, and filing it under the nearest one would say something the source did not. Whether the term belongs in the taxonomy is a data decision (docs/HANDOVER.md, SESSION 07 next-session candidate B), not something to retrofit from here.`,
    });
  }
  return out;
}
