/* ============================================================
   agent/integrate/preserve.mjs — requirements 7 and 8: preserve
   existing IDs, preserve existing provenance

   The DataProposal contract already refuses a proposal that renames
   an id, removes a verification_note, or writes over a provenance
   value outside a substantive human_only change. Those are checks a
   record can be held to on its own, with nothing but the record in
   front of you.

   THIS MODULE IS THE HALF THE CONTRACT CANNOT DO. Whether a
   proposal's `record_id` actually exists, whether the `current`
   value it quotes is what data/ really carries, whether the id it
   would create is already taken somewhere else in a global
   namespace — none of that is answerable from the record. It needs
   the corpus, and agent/schemas/validate.mjs deliberately never
   reads data/: a gate that loaded the legal record to validate a
   record would make every contract check depend on the state of the
   thing it is meant to be protecting.

   So the split is: the contract holds the shape, and this holds the
   shape against the corpus. Both run. A proposal that passes one and
   not the other is refused, and the adapter has no path that skips
   either.

   WHY QUOTING THE CURRENT VALUE MATTERS. An operation that says
   `current: null` about a field that carries text is a proposal
   written against a record its author had not read, and applying it
   would silently overwrite something. The check compares them and
   refuses the mismatch. This is the machine form of the rule
   AGENTS.md states for humans: read the full diff before committing,
   because a one-character null → "unknown" edit changes what a
   record asserts.
   ============================================================ */

import { PROVENANCE_FIELDS, HOME_OF } from './canonical.mjs';

/** Fields whose removal is red tier under AI-SAFE-BOUNDARIES §3,
 *  wherever they appear. The contract matches these by name in an
 *  operation target; this matches them against a real record. */
export const NEVER_REMOVED = [
  'verification_note', 'requires_verification', 'reference_gap', 'gap_note',
  'resolution', 'resolution_note', 'url_status', 'last_verified', 'accessed', 'published', 'sources',
];

const canonicalOf = (corpus, kind, id) => {
  if (id === null || id === undefined) return null;
  if (kind === 'claim') return corpus.claimById.get(id) ?? null;
  if (kind === 'source') return corpus.sourceById.get(id) ?? null;
  if (kind === 'timeline_event') return corpus.eventById.get(id) ?? null;
  if (kind === 'instrument') return corpus.instrumentById.get(id) ?? null;
  return null;
};

/** The field a proposal operation is about, read out of its target.
 *  Targets are written "data/claims.json claims[<id>].<field>" or
 *  "...sources[]", and the field is the last dotted segment with any
 *  array brackets stripped. */
export function fieldOfTarget(target) {
  const tail = String(target ?? '').split(/[\s.]+/).pop() ?? '';
  return tail.replace(/\[[^\]]*\]$/, '').replace(/\[\]$/, '') || null;
}

/**
 * Check one DataProposal against the corpus it would change.
 *
 * @returns {string[]} problems. Empty means the proposal preserves
 *   what it must — never that the proposal is correct, which is a
 *   different question and a human's.
 */
export function checkPreservation(proposal, corpus) {
  const problems = [];
  const kind = proposal.record_kind;
  const dataset = proposal.dataset;
  const record = canonicalOf(corpus, kind, proposal.record_id);

  /* --- 7 · the id ---------------------------------------------- */

  if (proposal.record_id) {
    if (!record) {
      problems.push(`record_id "${proposal.record_id}" is not a ${kind} in ${dataset}: a proposal to change a record that does not exist would create one under a name somebody chose for something else`);
    }
    if (proposal.preserves_record_id !== true) {
      problems.push(`preserves_record_id is not true for "${proposal.record_id}": IDs here are stable and global — validate.mjs errors on a duplicate across every dataset, and every other file resolves against them`);
    }
    for (const op of proposal.proposed_change?.operations ?? []) {
      const field = fieldOfTarget(op.target);
      if (field === 'id') {
        problems.push(`an operation targets the id of "${proposal.record_id}": renaming an id dangles every reference to it, and data/taxonomy.json's own $description is that IDs are never renamed`);
      }
    }
  }

  /* A created record must not claim an id that is already in use
     anywhere. The namespace is global across every dataset. */
  for (const op of proposal.proposed_change?.operations ?? []) {
    if (op.op !== 'add') continue;
    const proposedId = /"id"\s*:\s*"([^"]+)"/.exec(String(op.proposed ?? ''))?.[1] ?? null;
    if (proposedId && corpus.allIds.has(proposedId)) {
      problems.push(`an operation would add a record with id "${proposedId}", which already exists in this corpus: validate.mjs reports a duplicate id across all datasets as an error, and the existing record is the one that owns the name`);
    }
  }

  if (dataset && HOME_OF[kind] && HOME_OF[kind] !== dataset) {
    problems.push(`record_kind "${kind}" lives in ${HOME_OF[kind]}, but dataset says ${dataset}: one home per fact, and this proposal names two`);
  }

  /* --- 8 · the provenance -------------------------------------- */

  if (record) {
    const provenance = PROVENANCE_FIELDS[dataset] ?? [];
    const declared = new Map((proposal.provenance_disposition ?? []).map((d) => [d.field, d]));

    for (const op of proposal.proposed_change?.operations ?? []) {
      const field = fieldOfTarget(op.target);
      if (!field || !provenance.includes(field)) continue;

      if (op.op === 'remove' && NEVER_REMOVED.includes(field)) {
        problems.push(`an operation would remove "${field}" from ${proposal.record_id}: an asterisk, a reference gap, a requires_verification flag and a verification_note are removed by doing the verification work, never by clearing the field (AI-SAFE-BOUNDARIES §3)`);
      }
      if (!declared.has(field)) {
        problems.push(`an operation touches the provenance field "${field}" on ${proposal.record_id} with no provenance_disposition naming it: what becomes of a provenance field is stated, not discovered in review`);
      }
    }

    /* Every declared disposition must quote what is actually there.
       A proposal that quotes the wrong current value was written
       against a record its author had not read. */
    for (const d of proposal.provenance_disposition ?? []) {
      if (!provenance.includes(d.field)) {
        problems.push(`provenance_disposition names "${d.field}", which is not a provenance field of ${dataset}: the fields are ${provenance.join(', ') || 'none recorded for this dataset'}`);
        continue;
      }
      const actual = record[d.field];
      const quoted = d.current;

      if (actual === undefined || actual === null) {
        if (quoted !== null) {
          problems.push(`provenance_disposition for "${d.field}" quotes ${JSON.stringify(quoted)} but ${proposal.record_id} carries ${actual === undefined ? 'no such field' : 'null'}: null means nobody looked, and quoting a value over it hides that`);
        }
      } else if (typeof actual === 'string') {
        if (quoted !== actual) {
          problems.push(`provenance_disposition for "${d.field}" quotes ${JSON.stringify(quoted)} but ${proposal.record_id} carries ${JSON.stringify(actual)}: a proposal that misquotes what is there was written against a record nobody read`);
        }
      } else if (quoted !== null && quoted !== JSON.stringify(actual)) {
        problems.push(`provenance_disposition for "${d.field}" quotes ${JSON.stringify(quoted)} but ${proposal.record_id} carries a non-string value that does not match it`);
      }

      if (d.disposition === 'set_first_time' && actual !== undefined && actual !== null) {
        problems.push(`provenance_disposition says "${d.field}" is being set for the first time, but ${proposal.record_id} already carries a value: that is a replacement, and a replacement of a provenance value is a substantive change a human authors`);
      }
    }

    /* An operation that adds a source reference must not duplicate
       one the record already carries. */
    for (const op of proposal.proposed_change?.operations ?? []) {
      if (fieldOfTarget(op.target) !== 'sources' || op.op !== 'add') continue;
      const sid = /"source_id"\s*:\s*"([^"]+)"/.exec(String(op.proposed ?? ''))?.[1] ?? null;
      if (sid && (record.sources ?? []).some((s) => s?.source_id === sid)) {
        problems.push(`an operation would add source "${sid}" to ${proposal.record_id}, which already cites it: a source is never described twice, and a claim never cites one twice`);
      }
    }
  }

  return problems;
}

/**
 * The provenance disposition block for a record nothing on it is
 * being changed on — every provenance field the dataset has,
 * declared `unchanged`, quoting what is there.
 *
 * Built from the corpus rather than written by a caller, so the
 * quoted values cannot drift from the record and the check above
 * cannot be satisfied by a caller who guessed.
 */
export function untouchedProvenance(record, dataset, why) {
  const fields = PROVENANCE_FIELDS[dataset] ?? [];
  return fields
    .filter((f) => f in (record ?? {}))
    .map((f) => {
      const v = record[f];
      return {
        field: f,
        disposition: 'unchanged',
        current: v === null || v === undefined ? null : (typeof v === 'string' ? v : JSON.stringify(v)),
        why,
      };
    });
}
