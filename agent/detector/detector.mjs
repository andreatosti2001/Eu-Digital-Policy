/* ============================================================
   agent/detector/detector.mjs — Agent 3, the Regulatory Change
   Detector

   Inputs, as the brief names them:

     current canonical data      data/*.json, read through
                                 agent/integrate/canonical.mjs
     Verification Records        what a document was read to say
     previous source snapshots   the checksum and values an EARLIER
                                 verification of the same document
                                 recorded — see snapshots.mjs for
                                 what that does and does not support

   Output: a `RegulatoryChange` per detected divergence. **Not a
   `ChangeRecord`** — the brief's word for it, and a contract in this
   repository that means a change made to THIS REPOSITORY rather than
   one in the world. The conflict is set out at the top of
   `agent/schemas/contracts/regulatory-change.mjs` and in
   `docs/CHANGE-DETECTOR.md`; it is flagged rather than reconciled
   silently, which is what AGENTS.md requires where a brief and the
   code disagree.

   NEVER EDIT PRODUCTION DIRECTLY. `data/` is read and never written.
   There is no write path in this directory, the suite hashes the
   whole of `data/` around a full run and scans every module here for
   a write call, and the contract forbids the fields that would let a
   detection carry an edit. A detection is a question; the answer is
   a `DataProposal` behind an `ApprovalRequest`, and neither is this
   agent's to write.

   THREE COMPARISONS, AND THEY ANSWER DIFFERENT QUESTIONS:

     document vs. document   did the source itself move?
                             (unchanged source · metadata-only)
     document vs. corpus     has the world moved past the record?
                             (dates · statuses · amendments)
     document vs. document,
       different sources     do two authorities disagree?
                             — which is NOT a change, and is handed
                             to the conflict path rather than
                             reported as one

   The third is the trap. Two sources disagreeing looks exactly like
   a change when only one of them is read, and reporting it as one
   would silently pick a winner between two regulators. This detector
   refuses it by name.
   ============================================================ */

import { isoOf } from '../observability/ids.mjs';
import { emit, receive } from '../schemas/gateway.mjs';
import { loadCorpus, HOME_OF } from '../integrate/canonical.mjs';
import { retrievedDocumentOf } from '../integrate/sources.mjs';
import { RecordBuilder } from '../verifier/build.mjs';
import { sameDate } from '../verifier/dates.mjs';
import { classify, compareDates, STATUS_FROM_TAXONOMY } from './classify.mjs';
import { materialityOf, confidenceOf, autonomyFor, MATERIALITY_RANK } from './materiality.mjs';
import {
  byDocument, snapshotFor, corpusStatusOf, eventsOf,
  EVENT_TYPE_FOR, VERIFIED_ATTRIBUTES,
} from './snapshots.mjs';
import { affectedDatasets, affectedPages } from './surfaces.mjs';

export const DETECTOR_AGENT = 'regulatory-change-detector';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export class Detector {
  /**
   * @param {{tracer:object, store:object, corpus?:object, asOf:string,
   *          simulated?:boolean}} opts
   *   `asOf` is mandatory. A change report without the date its
   *   corpus position was read as true at cannot be told from a
   *   stale change report — the regulatory-change-detection skill
   *   states it, and audit F-15 is why.
   */
  constructor({ tracer, store, corpus, asOf, simulated = false }) {
    if (!asOf || !ISO_DATE.test(String(asOf))) {
      throw new Error('Detector needs an explicit asOf date (YYYY-MM-DD). "Nothing has decayed" and "nobody has looked" are different findings, and only a stated as-of date tells them apart (docs/AUDIT-2026-09-01.md F-15).');
    }
    this.tracer = tracer;
    this.store = store;
    this.corpus = corpus ?? loadCorpus();
    this.asOf = String(asOf).slice(0, 10);
    this.simulated = simulated === true;
    this.seq = 0;
    this.refused = [];
  }

  #now() { return isoOf(this.tracer.clock.now()); }
  #id(prefix) { return `${prefix}-${String(++this.seq).padStart(3, '0')}`; }
  #builder(contract, span) {
    return new RecordBuilder({ contract, agent: DETECTOR_AGENT, now: this.#now(), span, simulated: this.simulated });
  }

  /** Validate against the contract, register in the trace, store.
   *  One way out, and no second one. */
  #ship(span, record, derived_from = []) {
    emit(span, record, { allowSimulated: this.simulated, derived_from });
    this.store.write(record);
    return record;
  }

  /* ---------------------------------------------------------- intake */

  #intake(parent, verification) {
    const span = parent.startTool({ name: 'detector.intake', inputs: { verification_id: verification?.verification_id ?? null } });
    try {
      receive(verification, { allowSimulated: this.simulated });
      if (verification.contract !== 'VerificationRecord') {
        throw new Error(`the change detector takes a VerificationRecord; it was handed a ${verification.contract}`);
      }
      if (verification.agent === DETECTOR_AGENT) {
        throw new Error(`refusing "${verification.verification_id}": this agent produced it, and AGENT-ROLES H3 is that no agent verifies its own output`);
      }
      span.end({ status: 'ok', outputs: { accepted: true, verdict: verification.verdict } });
      return { ok: true };
    } catch (err) {
      span.error(err, { fatal: false });
      span.end({ status: 'failed', outputs: { accepted: false } });
      return { ok: false, reason: err.message };
    }
  }

  /* ------------------------------------------------ candidate changes */

  /**
   * Every divergence one verification presents, before
   * classification. A candidate is a question; what it turns out to
   * be is `classify`'s answer.
   */
  #candidatesFrom(verification, snapshot) {
    const out = [];
    const instruments = (verification.affected_entities ?? [])
      .filter((e) => e?.kind === 'instrument' && e.id)
      .map((e) => e.id);

    const bytes_changed = snapshot.block?.bytes_changed ?? null;
    const previous = snapshot.previous;

    /* --- 1 · the document against an earlier reading of itself ---- */

    if (previous) {
      const moved = VERIFIED_ATTRIBUTES.filter((a) => {
        const before = previous[a];
        const now = verification[a];
        if (before === null || before === undefined || now === null || now === undefined) return false;
        if (before === 'unknown' || now === 'unknown') return false;
        return a.endsWith('_date') ? !sameDate(String(before), String(now)) : before !== now;
      });

      for (const attribute of moved) {
        out.push({
          origin: 'document_against_itself',
          attribute,
          old_value: String(previous[attribute]),
          new_value: String(verification[attribute]),
          old_status: attribute === 'legal_status' ? previous.legal_status : null,
          new_status: attribute === 'legal_status' ? verification.legal_status : null,
          entity_kind: attribute.endsWith('_date') ? 'timeline_event' : 'instrument',
          entities: instruments,
          corpus_has_no_record: false,
          values_equal: false,
          bytes_changed,
          previous_verification_id: previous.verification_id,
        });
      }

      /* Nothing it says moved. That is a finding — the unchanged
         source and the metadata-only update, which are different
         answers and must not be collapsed. */
      if (!moved.length) {
        /* Nothing it SAYS moved. What moved, if anything, is the
           document itself — so the two sides are the checksums,
           which is literally the thing that differs. Carrying the
           two verification ids here would put a record id in a
           field the contract documents as "what the corpus
           asserts". */
        const before = snapshot.block?.previous_checksum ?? null;
        const now = snapshot.block?.current_checksum ?? null;
        out.push({
          origin: 'document_against_itself',
          attribute: null,
          old_value: before,
          new_value: bytes_changed === true ? now : before,
          old_status: previous.legal_status ?? null,
          new_status: verification.legal_status ?? null,
          entity_kind: instruments.length ? 'instrument' : null,
          entities: instruments,
          corpus_has_no_record: false,
          values_equal: true,
          bytes_changed,
          previous_verification_id: previous.verification_id,
        });
      }
    }

    /* --- 2 · the document against the corpus ---------------------- */

    /* Exactly one instrument, or nothing is compared. A proposition
       the Verifier could not attribute to a single act cannot be
       compared against one act's stored position without this module
       making the attribution the Verifier deliberately refused. */
    if (instruments.length === 1) {
      const instrument_id = instruments[0];
      const corpusStatus = corpusStatusOf(this.corpus, instrument_id);

      /* status */
      const verified = verification.legal_status;
      if (verified && verified !== 'unknown' && verified !== corpusStatus.status) {
        out.push({
          origin: 'document_against_corpus',
          attribute: 'legislative_status',
          old_value: corpusStatus.taxonomy,
          new_value: verified,
          old_status: corpusStatus.status,
          new_status: verified,
          entity_kind: 'instrument',
          entities: [instrument_id],
          corpus_has_no_record: corpusStatus.present === false,
          /* The corpus says something this vocabulary cannot name —
             `status:partly-applicable` is the live case. Kept apart
             from "no record" because they are different states and
             collapsing them would report an act the corpus describes
             at length as one it has never heard of. */
          corpus_status_unmappable: corpusStatus.present === true
            && corpusStatus.taxonomy !== null && corpusStatus.status === null,
          values_equal: false,
          bytes_changed,
          corpus_note: corpusStatus.why,
        });
      }

      /* dates, against data/timeline.json */
      for (const attribute of ['entry_into_force_date', 'applicability_date']) {
        const stated = verification[attribute];
        if (!stated || stated === 'unknown') continue;
        const eventType = EVENT_TYPE_FOR[attribute];
        if (!eventType) continue;
        const events = eventsOf(this.corpus, instrument_id, eventType);
        if (events.length !== 1) {
          /* Zero is nothing to compare. More than one is a staged
             act, and comparing against one of them would be this
             module choosing which stage the document meant. Neither
             is a change, and neither is silence: both are recorded
             as skipped. */
          out.push({
            origin: 'not_compared',
            attribute,
            reason: events.length === 0
              ? `data/timeline.json carries no ${eventType} event for ${instrument_id}, so there is nothing to compare "${stated}" against. An absence is not a change.`
              : `data/timeline.json carries ${events.length} ${eventType} events for ${instrument_id} — the act applies in stages. Comparing against one of them would be this detector choosing which stage the document meant, and that is a reading of the act.`,
            entities: [instrument_id],
          });
          continue;
        }
        const event = events[0];
        if (sameDate(String(event.date), String(stated))) continue;
        out.push({
          origin: 'document_against_corpus',
          attribute: 'date',
          old_value: event.date,
          new_value: String(stated),
          old_status: corpusStatus.status,
          new_status: verified ?? null,
          entity_kind: 'timeline_event',
          entities: [event.id],
          corpus_has_no_record: false,
          values_equal: false,
          bytes_changed,
          date_precision: event.date_precision ?? null,
          corpus_note: `data/timeline.json ${event.id} carries ${event.date}${event.date_precision ? ` at ${event.date_precision}` : ''}.`,
        });
      }
    } else if (instruments.length > 1) {
      out.push({
        origin: 'not_compared',
        attribute: null,
        reason: `The verification names ${instruments.length} instruments (${instruments.join(', ')}). A proposition the Verifier did not attribute to a single act cannot be compared against one act's stored position without making the attribution it deliberately refused.`,
        entities: instruments,
      });
    }

    return out;
  }

  /* ---------------------------------------------------------- records */

  #changeRecord(span, { verification, candidate, snapshot, classification }) {
    const b = this.#builder('RegulatoryChange', span);
    const doc = retrievedDocumentOf(verification);

    /* --- evidence: the document, the corpus, and the prior reading -- */
    const refs = [];
    if (doc) {
      b.addEvidence({ ...doc, evidence_id: 'ev-doc', simulated: this.simulated });
      refs.push('ev-doc');
    } else {
      b.addEvidence({
        evidence_id: 'ev-absent', kind: 'absent',
        source_id: null, url: null, locator: null, title: null, publisher: null,
        quote: null, retrieved_at: null, checksum: null,
        supports: null, role: 'unresolved', simulated: this.simulated,
      });
    }
    b.addEvidence({
      evidence_id: 'ev-corpus', kind: 'dataset_record',
      source_id: null, url: null,
      locator: `${candidate.entity_kind ? HOME_OF[candidate.entity_kind] ?? 'data/' : 'data/'} ${candidate.entities.join(', ') || 'the corpus'}`,
      title: null, publisher: null,
      quote: candidate.corpus_note ?? null,
      retrieved_at: null, checksum: null,
      supports: 'supports:direct', role: 'primary', simulated: this.simulated,
    });
    if (snapshot.previous) {
      b.addEvidence({
        evidence_id: 'ev-prior', kind: 'agent_output',
        source_id: null, url: null,
        locator: `VerificationRecord ${snapshot.previous.verification_id}`,
        title: null, publisher: null, quote: null,
        retrieved_at: snapshot.previous.checked_at ?? null, checksum: null,
        supports: 'supports:context', role: 'secondary', simulated: this.simulated,
      });
    }

    /* --- entities, and everything they reach ---------------------- */
    const entities = candidate.entities.map((id) => ({
      kind: candidate.entity_kind ?? 'instrument',
      id,
      path: HOME_OF[candidate.entity_kind] ?? null,
      field: candidate.attribute,
      note: `The record whose ${candidate.attribute ?? 'position'} the document places differently.`,
    }));
    for (const e of entities) b.addEntity(e);

    const datasets = affectedDatasets(entities);
    const { pages, caveats } = affectedPages(datasets);

    /* --- materiality, confidence, autonomy ------------------------ */
    const mat = materialityOf({
      change_kind: classification.kind,
      attribute: candidate.attribute,
      old_value: candidate.old_value,
      new_value: candidate.new_value,
      values_equal: candidate.values_equal,
      bytes_changed: candidate.bytes_changed,
      entity_kind: candidate.entity_kind,
    });

    const dateCandidate = candidate.attribute === 'date' || String(candidate.attribute ?? '').endsWith('_date');
    const datesComparable = dateCandidate
      ? compareDates(candidate.old_value, candidate.new_value) !== 'incomparable'
      : null;

    const confidence = confidenceOf({
      via: classification.via,
      hasDocument: Boolean(doc),
      hasSnapshot: Boolean(snapshot.previous),
      bothValuesRead: candidate.old_value !== null && candidate.new_value !== null,
      datesComparable,
      statusFromDocument: Boolean(candidate.new_status),
    });

    const autonomy = autonomyFor(mat.level);

    /* --- the fields ---------------------------------------------- */
    b.set('change_id', this.#id('rchg'));
    b.set('attribute', candidate.attribute);
    b.set('source_snapshot', snapshot.block);
    b.set('confidence', confidence);
    b.set('affected_datasets', datasets);
    b.set('autonomy_class', autonomy);
    b.set('detected_at', this.#now());
    b.set('as_of', this.asOf);
    b.set('supersedes', null);

    /* Values, with their citations, written together so the field
       and the entry that justifies it cannot disagree. */
    if (candidate.old_value !== null && candidate.old_value !== undefined) {
      b.fact('old_value', String(candidate.old_value),
        candidate.corpus_note ?? `The corpus currently asserts "${String(candidate.old_value).slice(0, 120)}" for ${candidate.attribute ?? 'this record'}.`,
        ['ev-corpus']);
    } else {
      b.openNull('old_value', 'What did the corpus previously assert?',
        'A record in data/ carrying this attribute. There is none — which is what makes this NEW rather than a movement.');
    }

    if (candidate.new_value !== null && candidate.new_value !== undefined && doc) {
      b.fact('new_value', String(candidate.new_value),
        `The document states "${String(candidate.new_value).slice(0, 120)}"${candidate.attribute ? ` for ${candidate.attribute}` : ''}, read exactly as it prints it and not normalised to match the corpus side.`,
        ['ev-doc']);
    } else if (candidate.new_value !== null && candidate.new_value !== undefined) {
      b.set('new_value', String(candidate.new_value));
      b.ep.fact.push({ field: 'new_value', statement: `Read from ${snapshot.previous?.verification_id ?? 'an earlier verification'}.`, evidence_refs: ['ev-prior'] });
    } else {
      b.openNull('new_value', 'What does the document state?',
        'A retrieval of the document. Nobody has looked since the stated as-of date, and this record is the candidate rather than the finding.');
    }

    if (snapshot.block) {
      /* The checksums are read from the two evidence entries
         themselves, so the fact cites both. Citing only the prior
         record would be citing supports:context evidence, which
         establishes what the earlier AGENT concluded rather than
         what was retrieved — and validate.mjs refuses a fact whose
         every source is context, for exactly that reason. */
      const snapshotRefs = [];
      if (doc) snapshotRefs.push('ev-doc');
      if (snapshot.previous) snapshotRefs.push('ev-prior');
      b.ep.fact.push({
        field: 'source_snapshot',
        statement: snapshot.block.note,
        evidence_refs: snapshotRefs.length ? snapshotRefs : ['ev-corpus'],
      });
    }

    /* The three inferences the contract requires a method for. */
    b.inference('change_kind', classification.kind, classification.why.split('.')[0],
      refs.length ? refs : ['ev-corpus'], classification.why);
    b.inference('materiality', mat.level,
      `This change is ${mat.level.replace(/_/g, ' ')}.`,
      refs.length ? refs : ['ev-corpus'], mat.why);
    b.inference('affected_pages', pages,
      `${pages.length} page(s) render a value from ${datasets.join(', ') || 'no dataset'}.`,
      ['ev-corpus'],
      `Derived in agent/detector/surfaces.mjs by reading each page's <script src> entry modules, following their static imports, and collecting every loadAll() and load() literal — the same call sites docs/CURRENT-ARCHITECTURE.md §5 says its own table was read from, so neither is a second home for the other and the suite fails if they disagree. The shared chrome is excluded from the count: js/boot.js starts the command palette on every page, and folding its seven datasets in would name all seven pages every time and distinguish nothing.${caveats.length ? ` ${caveats.join(' ')}` : ''}`);

    if (mat.level === 'metadata_only') {
      b.openNull(null, 'Did the document\'s meaning change where its bytes did?',
        'The two documents, read side by side. This repository stores no document bodies, so a checksum establishes that the bytes moved and never where — a substantive change inside a document whose stated values happen to match would look exactly like this.');
    }

    return this.#ship(span, b.build(), [verification.verification_id]);
  }

  /** A change this detector has no word for. Reported as a gap
   *  rather than filed under the nearest kind. */
  #unclassifiedGap(span, { verification, candidate, classification }) {
    const b = this.#builder('DataGap', span);
    b.addEvidence({
      evidence_id: 'ev-absent', kind: 'absent',
      source_id: null, url: null, locator: null, title: null, publisher: null,
      quote: null, retrieved_at: null, checksum: null,
      supports: null, role: 'unresolved', simulated: this.simulated,
    });
    for (const id of candidate.entities) {
      b.addEntity({ kind: candidate.entity_kind ?? 'instrument', id, path: HOME_OF[candidate.entity_kind] ?? null, field: candidate.attribute, note: 'The record the unclassified change is about.' });
    }
    if (!candidate.entities.length) {
      b.addEntity({ kind: 'instrument', id: null, path: 'data/instruments.json', field: candidate.attribute, note: 'The unclassified change names no single record.' });
    }

    b.set('gap_id', this.#id('gap'));
    b.set('gap_kind', 'coverage_gap');
    b.set('absence_kind', 'no_rule_matched');
    b.set('what_is_missing', `A kind for the change "${candidate.old_value ?? 'nothing'}" → "${candidate.new_value ?? 'nothing'}"${candidate.attribute ? ` at ${candidate.attribute}` : ''}, detected from ${verification.verification_id}.`);
    b.set('why_open', `${classification.why} Filing it under the nearest of the fourteen would report a state change nobody established, in a corpus about what EU law requires of people. NOT DETERMINED is the answer, and it is never "probably nothing".`);
    b.set('closes_with', 'A human deciding what this transition is, and either naming it among the fourteen kinds or recording that the corpus does not need to distinguish it. Adding a kind is a change to the agent layer\'s vocabulary with its own review path.');
    b.set('candidate_leads', classification.considered.map((r) => `Tested and did not match: ${r}`));
    b.set('blocking', false);
    b.set('first_seen_at', this.#now());
    b.set('last_reviewed_at', null);
    b.set('state', 'open');
    b.set('closed_by', null);
    b.ep.unresolved.push({
      field: null,
      question: `What kind of change is "${candidate.old_status ?? candidate.old_value}" → "${candidate.new_status ?? candidate.new_value}"?`,
      missing: 'A decision about whether this transition is one of the fourteen or a fifteenth. The transition table is deliberately incomplete and reports its holes.',
      absence_kind: 'no_rule_matched',
      blocks: false,
    });

    return this.#ship(span, b.build(), [verification.verification_id]);
  }

  /* ---------------------------------------------------------- the run */

  async run({ verifications, task = 'Detect where the canonical datasets and the documents behind them have diverged, and classify each divergence.' } = {}) {
    const started_at = this.#now();
    const run = this.tracer.startRun({
      kind: 'agent',
      agent: DETECTOR_AGENT,
      task,
      inputs: {
        verifications: (verifications ?? []).map((v) => v?.verification_id ?? null),
        as_of: this.asOf,
        corpus: { instruments: this.corpus.instruments.length, events: this.corpus.events.length },
      },
    });

    const changes = [];
    const gaps = [];
    const unchanged = [];
    const notCompared = [];
    const conflicts = [];

    try {
      run.observe({
        summary: `Change detector starting over ${(verifications ?? []).length} verification(s) as of ${this.asOf}.`,
        subject: 'run',
        data: { as_of: this.asOf, simulated: this.simulated },
        confidence: 1, risk: 'none', simulated: this.simulated,
      });

      const accepted = [];
      for (const v of verifications ?? []) {
        const intake = this.#intake(run, v);
        if (!intake.ok) {
          this.refused.push({ what: v?.verification_id ?? null, stage: 'intake', reason: intake.reason });
          run.observe({
            summary: `Refused at intake: ${intake.reason}`,
            subject: v?.verification_id ?? 'unknown verification',
            data: { reason: intake.reason },
            confidence: 1, risk: 'medium', simulated: this.simulated,
          });
          continue;
        }
        accepted.push(v);
      }

      /* Two authorities disagreeing is not a change, and the trap is
         that it looks exactly like one. Verifications carrying a
         `conflict` verdict are set aside by name before anything is
         compared: reporting one as a change would silently pick a
         winner between two regulators. */
      const conflicted = accepted.filter((v) => v.verdict === 'conflict' || (v.conflicting_evidence ?? []).length > 0);
      for (const v of conflicted) {
        conflicts.push({ verification_id: v.verification_id, why: v.residual_gap ?? 'The verification records an unreconciled disagreement.' });
        run.observe({
          summary: `Not a change: ${v.verification_id} records two authoritative sources disagreeing. A disagreement between two sources looks exactly like a movement in one, and reporting it as a change would pick a winner between two regulators. Handed to the conflict path (agent/integrate/conflicts.mjs), not classified here.`,
          subject: v.verification_id,
          data: { verdict: v.verdict, conflicting_evidence: (v.conflicting_evidence ?? []).length },
          confidence: 1, risk: 'high', simulated: this.simulated,
        });
      }

      /* A verdict that settled nothing establishes no new value, so
         there is nothing to compare the corpus against. */
      const usable = accepted.filter((v) => !conflicted.includes(v)
        && !['source_unavailable', 'not_determinable'].includes(v.verdict));
      for (const v of accepted.filter((x) => ['source_unavailable', 'not_determinable'].includes(x.verdict))) {
        notCompared.push({
          verification_id: v.verification_id,
          reason: `The verdict is "${v.verdict}": the check established no value, so there is nothing for the corpus to have diverged from. An unsettled check is not evidence that nothing changed.`,
        });
      }

      const history = byDocument(usable, retrievedDocumentOf);

      for (const v of usable) {
        const span = run.startTool({
          name: 'detector.compare',
          inputs: { verification_id: v.verification_id, verdict: v.verdict },
        });

        const doc = retrievedDocumentOf(v);
        const snapshot = snapshotFor(v, {
          history: doc?.url ? (history.get(doc.url) ?? []) : [],
          docOf: retrievedDocumentOf,
        });

        const candidates = this.#candidatesFrom(v, snapshot);
        let produced = 0;

        for (const candidate of candidates) {
          if (candidate.origin === 'not_compared') {
            notCompared.push({ verification_id: v.verification_id, reason: candidate.reason });
            continue;
          }

          const classification = classify({
            corpus_has_no_record: candidate.corpus_has_no_record,
            corpus_status_unmappable: candidate.corpus_status_unmappable === true,
            entity_kind: candidate.entity_kind,
            attribute: candidate.attribute,
            old_value: candidate.old_value,
            new_value: candidate.new_value,
            old_status: candidate.old_status,
            new_status: candidate.new_status,
            bytes_changed: candidate.bytes_changed,
            values_equal: candidate.values_equal,
          });

          span.decide({
            decision: classification.kind ?? 'unclassified',
            rationale: classification.why,
            alternatives: classification.considered.map((r) => ({ option: r, why_not: 'tested first and did not match' })),
            confidence: classification.kind ? 0.7 : 0.4,
            risk: 'medium',
            inputs_ref: [v.verification_id],
          });

          if (!classification.kind) {
            /* A pair the table holds and deliberately does not treat
               as a movement. Somebody decided this; it is not a hole,
               and filing it as one would bury the real holes among
               the settled cases. */
            if (classification.not_a_change === true) {
              notCompared.push({ verification_id: v.verification_id, reason: classification.why });
              continue;
            }
            /* Nothing moved and nothing to classify: an unchanged
               source with identical bytes is not a gap, it is a
               result, and it is reported as one. */
            if (candidate.values_equal === true && candidate.bytes_changed === false) {
              unchanged.push({
                verification_id: v.verification_id,
                previous_verification_id: candidate.previous_verification_id,
                as_of: this.asOf,
                why: `The document hashes identically to the reading ${candidate.previous_verification_id} took, and every value it states is unchanged. Nothing has decayed here as at ${this.asOf} — which is a finding, and is stated rather than left as silence.`,
              });
              continue;
            }
            gaps.push(this.#unclassifiedGap(span, { verification: v, candidate, classification }));
            produced++;
            continue;
          }

          changes.push(this.#changeRecord(span, { verification: v, candidate, snapshot, classification }));
          produced++;
        }

        span.end({ status: 'ok', outputs: { candidates: candidates.length, produced } });
      }

      const ended_at = this.#now();
      const runRecord = this.#runRecord(run, {
        task, started_at, ended_at,
        verifications: verifications ?? [],
        changes, gaps, unchanged, notCompared, conflicts,
      });

      run.end({ status: 'ok', outputs: { changes: changes.length, gaps: gaps.length, unchanged: unchanged.length } });

      return {
        trace_id: run.trace_id,
        as_of: this.asOf,
        changes, gaps, unchanged,
        not_compared: notCompared,
        conflicts,
        refused: this.refused,
        run_record: runRecord,
        by_kind: tally(changes.map((c) => c.change_kind)),
        by_materiality: tally(changes.map((c) => c.materiality)),
      };
    } catch (err) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }
  }

  #runRecord(span, { task, started_at, ended_at, verifications, changes, gaps, unchanged, notCompared, conflicts }) {
    const b = this.#builder('AgentRun', span);
    b.addEvidence({
      evidence_id: 'ev-run', kind: 'measurement',
      source_id: null, url: null, locator: 'this run', title: null, publisher: null,
      quote: null, retrieved_at: ended_at, checksum: null,
      supports: 'supports:direct', role: 'primary', simulated: this.simulated,
    });

    const material = changes.filter((c) => MATERIALITY_RANK[c.materiality] >= MATERIALITY_RANK.substantive);

    b.set('run_id', span.span_id);
    b.set('parent_run_id', span.parent_run_id);
    b.set('task', task);
    b.set('started_at', started_at);
    b.set('ended_at', ended_at);
    b.set('status', 'ok');
    b.set('inputs', { verifications: verifications.length, as_of: this.asOf });
    b.set('outputs', {
      changes: changes.length,
      by_kind: tally(changes.map((c) => c.change_kind)),
      by_materiality: tally(changes.map((c) => c.materiality)),
      unclassified: gaps.length,
      unchanged: unchanged.length,
      not_compared: notCompared.length,
      conflicts_set_aside: conflicts.length,
      refused: this.refused.length,
      edits_made: 0,
    });
    b.set('produced', [
      ...changes.map((c) => ({ contract: 'RegulatoryChange', id: c.change_id })),
      ...gaps.map((g) => ({ contract: 'DataGap', id: g.gap_id })),
    ]);
    b.set('affected_entities', []);
    b.set('autonomy_class', material.length ? 'review_required' : 'autonomous');
    b.set('confidence', changes.length ? 0.6 : 0.4);
    b.set('risk', 'low');
    b.set('handed_off_to', []);

    b.fact(null, true,
      `The run began at ${started_at} and finished at ${ended_at}, comparing ${verifications.length} verification(s) against the corpus as at ${this.asOf}. It read data/ and wrote nothing to it.`,
      ['ev-run']);
    b.inference(null, undefined,
      `${changes.length} change(s), ${gaps.length} unclassified, ${unchanged.length} unchanged, ${notCompared.length} not compared, ${conflicts.length} conflict(s) set aside.`,
      ['ev-run'],
      'Counted from the records this run produced. Every change passed its contract in agent/schemas/validate.mjs or it was not stored, and every transition the classifier had no kind for became a gap rather than the nearest kind.');
    if (unchanged.length) {
      b.inference(null, undefined,
        `${unchanged.length} source(s) were unchanged as at ${this.asOf}.`,
        ['ev-run'],
        'Established by comparing checksums across two retrievals of the same address. "Nothing has decayed" is a finding and is stated with its as-of date, because silence is indistinguishable from not having looked — the regulatory-change-detection skill requires the empty result to be reported.');
    }
    b.openNull(null, 'Has anything been done about these changes?',
      'A DataProposal citing one, behind an ApprovalRequest, and a human applying it. Nothing here proposes or applies anything, and the count of edits made is zero by construction rather than by outcome.');

    return this.#ship(span, b.build());
  }
}

const tally = (xs) => xs.reduce((acc, x) => ({ ...acc, [x]: (acc[x] ?? 0) + 1 }), {});
