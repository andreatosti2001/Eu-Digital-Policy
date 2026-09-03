/* ============================================================
   agent/verifier/verifier.mjs — Agent 2: the Legal Verifier

   Input: SourceCandidate. Output: VerificationRecord.

   Its whole job: open the document a candidate points at, break
   what it says into discrete propositions, and for each material
   one record what the source establishes, what state the act is in,
   which dates it turns on, where in the document that sits, and
   what the check did NOT settle.

   WHAT IT IS NOT ALLOWED TO DO, and does not:

     · update canonical data. It never opens data/*.json for
       writing, and there is no code path that could. The suite
       hashes the whole of data/ around a full run and fails if a
       byte moves.
     · promote a candidate. `state: "accepted"` on a SourceCandidate
       is a change to that record, and this agent emits new
       immutable records only. It writes the VerificationRecord; a
       human decides what to do with it.
     · verify its own scouting. docs/AGENT-ROLES.md §2: a Verifier
       never verifies a candidate it produced. Enforced at intake by
       refusing any candidate whose `agent` is this agent.
     · force a yes/no. Six verdicts, three outcome classes, and the
       unsettled ones are first-class results rather than failures.
     · resolve a disagreement between two authorities by choosing
       one. It reports the conflict and stops.

   HOW THE FOUR EPISTEMIC STATES ARE FILLED:

     fact           the document's own identifier and the three
                    dates, each read from wording the document
                    carries and each citing the retrieval.
     inference      the verdict, the legal status, and the source
                    tier — all three are classifications this agent
                    makes, and each states the phrase it matched and
                    the rule it applied.
     interpretation only where a non-binding source is being read
                    for an obligation, which is a reading and is
                    attributed as one.
     unresolved     everything the check left open, including the
                    dates it refused to compute.

   Every record leaves through agent/schemas/gateway.mjs, which
   validates and throws. There is no second path out of this module.
   ============================================================ */

import { createHash } from 'node:crypto';
import { isoOf } from '../observability/ids.mjs';
import { emit, receive } from '../schemas/gateway.mjs';
import { IdMinter } from '../schemas/identity.mjs';
import { authorityForUrl, estimateTier } from '../scout/authorities.mjs';
import { instrumentTerms, matchInstruments, textOf, extractPublicationDate, extractTitle } from '../scout/extract.mjs';
import { loadInstruments } from '../scout/scout.mjs';
import { RecordBuilder } from './build.mjs';
import { classifyDocument } from './doctype.mjs';
import { decompose } from './decompose.mjs';
import { readDates } from './dates.mjs';
import { locate } from './locate.mjs';
import { resolveStatus, statusSignals, FINALITY_QUALIFIERS } from './statuses.mjs';
import { judge, supportsFor } from './judge.mjs';
import { findConflicts, isAuthoritative } from './conflict.mjs';
import { confidenceOf, outcomeClassOf, provenanceVerdictOf, isNonBinding } from './outcome.mjs';

export const VERIFIER_AGENT = 'legal-verifier';

export const DEFAULT_VERIFIER_LIMITS = {
  max_candidates: 24,
  max_propositions_per_document: 12,
};

/** The document's own identifier, read from wording it carries.
 *  Never constructed from a URL: a CELEX number taken out of an
 *  address is a fact about the address. */
const DOCUMENT_ID_PATTERNS = [
  { re: /\b(3\d{4}[A-Z]\d{4})\b/, kind: 'a CELEX number' },
  { re: /\b(6\d{4}[A-Z]{2}\d{4})\b/, kind: 'a CELEX case number' },
  { re: /\bCase\s+(C-\d+\/\d+(?:\s*P)?|T-\d+\/\d+)\b/i, kind: 'a Court case number' },
  { re: /\b((?:Regulation|Directive|Decision)\s*\((?:EU|EC|EEC)\)\s*(?:No\s*)?\d{1,4}\/\d{2,4})\b/i, kind: 'a formal instrument reference' },
  { re: /\b(COM\(\d{4}\)\s*\d+\s*final)\b/, kind: 'a COM document reference' },
];

function readDocumentId(text) {
  for (const p of DOCUMENT_ID_PATTERNS) {
    const m = String(text).match(p.re);
    if (m) return { value: m[1].replace(/\s+/g, ' ').trim(), kind: p.kind };
  }
  return null;
}

export class Verifier {
  constructor({ tracer, transport, store, instruments, limits = {} }) {
    this.tracer = tracer;
    this.transport = transport;
    this.store = store;
    this.instruments = instruments ?? loadInstruments();
    this.terms = instrumentTerms(this.instruments);
    this.limits = { ...DEFAULT_VERIFIER_LIMITS, ...limits };
    this.simulated = transport.simulated === true;
    /* Ids are derived from what was checked, never from a counter —
       agent/schemas/identity.mjs says why. A verification of the
       same proposition in the same document is one node however
       many times it is re-run. */
    this.ids = new IdMinter();
  }

  #now() { return isoOf(this.tracer.clock.now()); }

  #builder(contract, span) {
    return new RecordBuilder({ contract, agent: VERIFIER_AGENT, now: this.#now(), span, simulated: this.simulated });
  }

  /** Validate, register in the trace, store. One way out. */
  #ship(span, record, derived_from = []) {
    emit(span, record, { allowSimulated: this.simulated, derived_from });
    this.store.write(record);
    return record;
  }

  /* ---------------------------------------------------------- intake */

  /**
   * A candidate is checked before it is acted on — including one
   * this process believes it produced, because "I was handed it" is
   * not a property the receiver can check. The self-verification
   * refusal is here rather than in a policy document because a rule
   * nothing enforces is a rule.
   */
  #intake(parent, candidate) {
    const span = parent.startTool({ name: 'verifier.intake', inputs: { candidate_id: candidate?.candidate_id ?? null } });
    try {
      receive(candidate, { allowSimulated: this.simulated });
      if (candidate.contract !== 'SourceCandidate') {
        throw new Error(`the Legal Verifier takes a SourceCandidate; it was handed a ${candidate.contract}`);
      }
      if (candidate.agent === VERIFIER_AGENT) {
        throw new Error(`refusing to verify candidate "${candidate.candidate_id}": this agent produced it, and docs/AGENT-ROLES.md §2 is that a Verifier never verifies its own scouting`);
      }
      span.end({ status: 'ok', outputs: { accepted: true, from_agent: candidate.agent } });
      return { ok: true };
    } catch (err) {
      span.error(err, { fatal: false });
      span.end({ status: 'failed', outputs: { accepted: false } });
      return { ok: false, reason: err.message };
    }
  }

  /* ---------------------------------------------------------- retrieval */

  async #retrieve(parent, url) {
    const span = parent.startTool({ name: 'verifier.retrieve', inputs: { url } });
    const res = await this.transport.get(url);
    span.usage({ latency_ms: res.elapsed_ms ?? null });
    span.end({
      status: res.ok ? 'ok' : 'failed',
      outputs: { status: res.status, byte_length: res.byte_length ?? 0, sha256: res.sha256 ?? null, blocked_by: res.blocked_by ?? null },
    });
    return res;
  }

  /* ------------------------------------------- the unreachable document */

  #unreachable(span, { candidate, res }) {
    const b = this.#builder('VerificationRecord', span);
    const blocked = res.blocked_by === 'egress_policy';
    const statement = `The document at ${candidate.url} is "${candidate.title ?? 'a document this candidate does not title'}"${candidate.publisher ? `, published by ${candidate.publisher}` : ''}, and bears on ${candidate.affected_entities.map((e) => e.id).filter(Boolean).join(', ') || 'the instruments this repository tracks'}.`;

    b.addEvidence({
      evidence_id: 'ev-absent',
      kind: 'absent',
      source_id: null, url: null, locator: null, title: null, publisher: null,
      quote: null, retrieved_at: null, checksum: null,
      supports: null, role: 'unresolved',
    });
    b.addEntity({
      kind: 'document', id: candidate.candidate_id, path: null, field: null,
      note: 'The candidate under check. It was not retrieved, so nothing it asserts has been verified.',
    });

    b.set('verification_id', this.ids.mint('ver', {
      kind: 'source_unavailable',
      entities: [{ kind: 'document', id: candidate.candidate_id, path: null }],
      subject: candidate.url,
    }));
    b.set('statement', statement);
    b.set('method', `Attempted to retrieve ${candidate.url} and read it. ${blocked ? `The retrieval was refused before it reached the origin: ${res.reason}. That is this environment's egress policy and not a statement about the document.` : `The retrieval failed: ${res.reason}${res.status ? ` (status ${res.status})` : ''}.`} Nothing was read, so nothing is asserted about the contents.`);
    b.inference('verdict', 'source_unavailable', 'The document could not be retrieved, so the proposition was not checked.', ['ev-absent'], 'A GET of the candidate\'s URL did not return a document. This is a statement about the retrieval, not about the proposition, which remains exactly as unverified as it was.');
    b.set('confidence', confidenceOf({ verdict: 'source_unavailable' }));
    b.set('checked_at', this.#now());
    b.set('checked_by_kind', 'agent');
    b.set('checked_by', VERIFIER_AGENT);
    b.set('conflicting_evidence', []);
    b.set('supersedes', null);
    b.set('recheck_after', null);
    b.openNull('supporting_location', 'Where in the document is the proposition carried?',
      'The document. Nothing was retrieved, so no passage was located in it.');
    b.openNull('source_tier', 'Which evidence tier does this source sit in?',
      'A document type read from the document, or an issuing authority established from it. Neither is available for a document that did not arrive, and the candidate\'s own estimate is not a substitute for one.');
    b.openNull('document_id', 'What identifier does the document give itself?', 'The document. Nothing has been read, so nothing is asserted about what it calls itself.');
    b.openNull('legal_status', 'What state is the act this candidate concerns in?', 'The document\'s text. A status taken from a title or an address would be a fact about the address.');
    b.openNull('publication_date', 'When was it published?', 'The document\'s own statement of its publication date.');
    b.openNull('entry_into_force_date', 'When did it enter into force?', 'The document\'s own statement, or the act\'s final provisions.');
    b.openNull('applicability_date', 'From when does it apply?', 'The document\'s own statement of its date of application.');
    b.openNull(null, `What does the document at ${candidate.url} say?`, blocked
      ? `Retrieval from an environment whose egress policy permits ${safeHost(candidate.url)}. Until then this candidate stays unverified.`
      : 'A successful retrieval of the document.', { blocks: true });

    b.set('residual_gap', `Everything. The document was not read, so the candidate's own account of what it is and what it bears on stands unchecked. ${blocked ? 'The refusal came from this environment\'s egress policy, before the request reached the origin.' : ''}`);

    return this.#ship(span, b.build(), [candidate.candidate_id]);
  }

  /* ---------------------------------------------------------- one proposition */

  #verifyProposition(parent, ctx, proposition) {
    const span = parent.startTool({
      name: 'verifier.proposition',
      inputs: { candidate_id: ctx.candidate.candidate_id, at: proposition.index, reasons: proposition.reasons },
    });

    try {
      const { candidate, docText, res, authority_from, tier, tierMethod, docId, dates, docStatus, docSignals } = ctx;

      /* Where the proposition sits, and what it is about. */
      const location = locate(docText, proposition);
      const matches = matchInstruments(proposition.text, this.terms);

      /* Status is read from the PROPOSITION first. The document-wide
         reading is a labelled fallback, and it is refused outright
         where the document discusses more than one instrument —
         attaching one act's repeal to another is the error the
         ordering exists to prevent. */
      const ownSignals = statusSignals(proposition.text);
      /* A finality qualifier is carried down from the document even
         when the proposition has status wording of its own: an
         appeal pending against a judgment qualifies every finding
         that judgment makes, not only the sentence that mentions the
         appeal. Without this, "the decision is annulled" reads as a
         settled annulment in a judgment the next paragraph says is
         under appeal. */
      const qualifiers = ownSignals.length
        ? docSignals.filter((s) => FINALITY_QUALIFIERS.includes(s.status) && !ownSignals.some((o) => o.status === s.status))
        : [];
      const own = resolveStatus([...ownSignals, ...qualifiers]);

      /* WHICH ACT THE PROPOSITION IS ABOUT. Where it names an
         instrument, that one. Where it does not but carries a status
         of its own, NONE — because attaching "is repealed" to
         whatever instrument the document happens to mention
         elsewhere is how a document that repeals a predecessor while
         amending the DSA ends up reporting the DSA repealed. The
         subject is unresolved, and that is recorded rather than
         guessed. Only a proposition making no status claim is
         related to the document's own subject, which is an
         association and not an assertion about that act. */
      const aboutInstruments = matches.length
        ? matches
        : (ownSignals.length ? [] : ctx.docMatches);
      const subjectUnresolved = matches.length === 0 && ownSignals.length > 0;

      const multiInstrument = new Set(ctx.docMatches.map((m) => m.instrument_id)).size > 1;
      let status = own;
      let statusFromSentence = ownSignals.length > 0;
      let statusScope = qualifiers.length
        ? `the proposition itself, qualified by the document's own record of a pending challenge (${qualifiers.map((q) => `"${q.matched}"`).join(', ')})`
        : 'the proposition itself';
      if (!statusFromSentence) {
        if (multiInstrument) {
          status = {
            status: null,
            ambiguous: false,
            signals: [],
            competing: [],
            method: `The proposition carries no status wording of its own, and the document discusses ${ctx.docMatches.length} instruments (${ctx.docMatches.map((m) => m.instrument_id).join(', ')}). A status read from the document at large could belong to any of them, so none is attributed.`,
          };
          statusScope = 'refused — the document covers more than one instrument';
        } else {
          status = docStatus;
          statusScope = 'the document at large, the proposition carrying no status wording of its own';
        }
      }

      const verdictOf = judge({ proposition, status, dates, location, legal_status: status.status });
      const { verdict } = verdictOf;

      const supports = supportsFor(verdict);

      const b = this.#builder('VerificationRecord', span);
      const retrieved_at = this.#now();

      b.addEvidence({
        evidence_id: 'ev-passage',
        kind: 'retrieved_document',
        source_id: null,
        url: candidate.url,
        locator: location ? location.raw : 'the document as served; no structural marker governs the passage',
        title: ctx.docTitle,
        publisher: candidate.publisher,
        quote: proposition.text,
        retrieved_at,
        checksum: res.sha256,
        supports,
        role: ctx.role,
      });

      for (const m of aboutInstruments) {
        b.addEntity({
          kind: 'instrument', id: m.instrument_id, path: 'data/instruments.json', field: null,
          note: `The proposition concerns this instrument — matched ${m.match_kind} "${m.matched_on}".`,
        });
      }
      b.addEntity({
        kind: 'document', id: candidate.candidate_id, path: null, field: null,
        note: 'The candidate whose document this proposition was read from.',
      });

      b.set('verification_id', this.ids.mint('ver', {
        kind: 'proposition',
        entities: [
          { kind: 'document', id: candidate.candidate_id, path: null },
          ...aboutInstruments.map((m) => ({ kind: 'instrument', id: m.instrument_id, path: 'data/instruments.json' })),
        ],
        subject: proposition.text,
      }));
      b.set('statement', proposition.text);
      b.set('method', [
        `Retrieved ${candidate.url} and read it.`,
        `The proposition was taken as one of ${ctx.propositionCount} material propositions decomposed from the document (${proposition.reasons.join('; ')}).`,
        location ? `It sits at ${location.raw}.` : 'No structural marker governs the passage.',
        `Legal status was read from ${statusScope}.`,
        verdictOf.because,
      ].join(' ').slice(0, 3999));

      b.inference('verdict', verdict, verdictOf.because, ['ev-passage'],
        `The verdict follows the ordered test in agent/verifier/judge.mjs: an internal contradiction, then an ambiguous status, then applicability asserted where the text only schedules it, then a register/text disagreement, then a date stated more than once, then an obligation drawn from something non-binding, then an unresolved entry-into-force formula, then an unlocatable passage — and only then confirmed.`);

      b.set('confidence', confidenceOf({
        verdict,
        located: Boolean(location),
        quoted: true,
        statusFromSentence,
        authoritative: isAuthoritative(tier),
        documentIdentified: Boolean(docId),
        ambiguousStatus: status.ambiguous,
      }));
      b.set('checked_at', retrieved_at);
      b.set('checked_by_kind', 'agent');
      b.set('checked_by', VERIFIER_AGENT);
      b.set('conflicting_evidence', []);
      b.set('supersedes', null);
      b.set('recheck_after', null);

      /* --- location ------------------------------------------------ */
      if (location) {
        b.fact('supporting_location', location, `The proposition is carried at ${location.raw}.`, ['ev-passage']);
      } else {
        b.openNull('supporting_location', 'Where in the document is this proposition carried?',
          'A structural marker — an article, a recital, a chapter or a page — governing the passage. The document carries none above this wording.');
      }

      /* --- the document's own identifier --------------------------- */
      if (docId) {
        b.fact('document_id', docId.value, `The document identifies itself by ${docId.kind}: "${docId.value}".`, ['ev-passage']);
      } else {
        b.openNull('document_id', 'What identifier does the document give itself?',
          'A CELEX number, a case number or a formal instrument reference stated in the document. It carries none, and this verifier does not take one from a URL: an identifier read out of an address is a fact about the address.');
      }

      /* --- tier ----------------------------------------------------- */
      if (tier) {
        b.inference('source_tier', tier, `The cited source is being treated as ${tier}.`, ['ev-passage'], `${tierMethod}${authority_from ? ` The issuing authority was taken from ${authority_from}.` : ''}`);
      } else {
        b.openNull('source_tier', 'Which evidence tier does this source sit in?',
          `A settled document type or issuing authority. ${tierMethod} Until one is established the source is not placed, and it is not filed at the tier that would be convenient.`);
      }

      /* --- legal status --------------------------------------------- */
      if (status.status) {
        b.inference('legal_status', status.status, `The act this proposition concerns is in the state "${status.status}".`, ['ev-passage'], status.method);
      } else if (status.ambiguous) {
        b.openNull('legal_status', 'Which of the twelve states is the act in?',
          `A reading of the act's own text. ${status.method}`, { blocks: true });
      } else {
        b.openNull('legal_status', 'Which of the twelve states is the act in?',
          `A phrase in the document placing the act. ${status.method}`);
      }

      /* --- the three dates ------------------------------------------ */
      this.#recordDate(b, 'publication_date', dates.publication, 'published');
      this.#recordDate(b, 'entry_into_force_date', dates.entry_into_force, 'entered into force');
      this.#recordDate(b, 'applicability_date', dates.applicability, 'applies from');

      if (subjectUnresolved) {
        b.openNull(null, 'Which act does this proposition place in that state?',
          `An identification of its subject. The proposition states a legal status but names no instrument this repository tracks, and the document discusses ${ctx.docMatches.map((m) => m.instrument_id).join(', ') || 'none'} — attaching the status to one of those would be attributing it to an act the sentence does not name.`);
      }

      /* --- a reading offered as one --------------------------------- */
      if (verdictOf.aspects.asserts_obligation && isNonBinding(status.status)) {
        b.interpretation(null,
          `Read as what a ${String(status.status).replace(/_/g, ' ')} document states, not as an obligation anybody is under.`,
          {
            basis: `The document is ${String(status.status).replace(/_/g, ' ')} and uses obligation wording. What binds is the instrument it is about, which this check has not read. A source can support the premises of a reading; it cannot settle its conclusion.`,
            contested: true,
          });
      }

      /* --- what was left open --------------------------------------- */
      if (verdictOf.residual_gap) {
        b.set('residual_gap', verdictOf.residual_gap);
        if (!b.ep.unresolved.some((u) => u.field === null)) {
          b.openNull(null, 'What would settle this proposition?',
            `${verdictOf.residual_gap.slice(0, 900)}`, { blocks: false });
        }
      } else {
        b.set('residual_gap', null);
      }

      const record = this.#ship(span, b.build(), [candidate.candidate_id]);

      /* The verdict is a decision, and a decision records what it did
         not choose. An unrecorded alternative is how a decision
         becomes indistinguishable from an accident. */
      span.decide({
        decision: `${record.verification_id}: ${verdict} (${outcomeClassOf(verdict)})`,
        rationale: verdictOf.because,
        alternatives: alternativesFor(verdict, verdictOf, status, location),
        confidence: record.confidence,
        risk: verdict === 'confirmed' ? 'medium' : 'low',
        inputs_ref: [candidate.candidate_id],
      });

      span.provenance({
        source_id: candidate.candidate_id,
        role: ctx.role,
        url: candidate.url,
        title: ctx.docTitle,
        publisher: candidate.publisher,
        locator: location ? location.raw : null,
        retrieved_at,
        content_sha256: res.sha256,
        quote: proposition.text,
        verification: {
          method: 'Read the passage at the stated location and compared its wording against the proposition.',
          verdict: provenanceVerdictOf(verdict),
          checked_by: VERIFIER_AGENT,
          note: verdictOf.residual_gap ?? 'Nothing was left open by this check.',
        },
        instrument_ids: aboutInstruments.map((m) => m.instrument_id),
        simulated: this.simulated,
      });

      span.end({ status: 'ok', outputs: { verdict, outcome: outcomeClassOf(verdict), confidence: record.confidence } });
      return record;
    } catch (err) {
      span.error(err, { fatal: true });
      span.end({ status: 'failed' });
      throw err;
    }
  }

  /** A date is written with its epistemic entry or not at all, and
   *  the three kinds of absence are told apart. */
  #recordDate(b, field, read, phrase) {
    if (read.value) {
      b.fact(field, read.value, `The document states that the act ${phrase} "${read.value}", read from ${read.read_from} — "${read.matched}".`, ['ev-passage']);
      return;
    }
    if (read.alternatives.length > 1) {
      b.openUnknown(field, `Which date does the document mean when it says the act ${phrase}?`,
        `A single date. The document states ${read.alternatives.length} — ${read.alternatives.map((a) => `"${a.value}"`).join(' and ')} — which is how an act that takes effect in stages is written. Taking either would be false about the other stage.`);
      return;
    }
    if (read.formula) {
      b.openUnknown(field, `On what date did the act ${phrase}?`,
        `A stated date. The document gives the rule instead — "${read.formula}" — and computing a date from it needs the Official Journal publication date at day precision, taken from the Journal. This verifier does not perform that arithmetic: a computed date presented as a read one is a fabricated legal fact.`);
      return;
    }
    b.openNull(field, `On what date did the act ${phrase}?`,
      `A statement in the document. It carries none, and no date is taken from the address, the filename or the page's general shape.`);
  }

  /* ---------------------------------------------------------- conflicts */

  #conflictRecord(span, conflict, byCandidate) {
    const [a, b_] = conflict.sides;
    const bd = this.#builder('VerificationRecord', span);
    const at = this.#now();

    const sideEvidence = (side, id) => ({
      evidence_id: id,
      kind: 'retrieved_document',
      source_id: null,
      url: side.url,
      locator: side.locator ?? 'the document as served',
      title: byCandidate.get(side.candidate_id)?.docTitle ?? null,
      publisher: byCandidate.get(side.candidate_id)?.candidate?.publisher ?? null,
      quote: side.quote,
      retrieved_at: at,
      checksum: byCandidate.get(side.candidate_id)?.res?.sha256 ?? null,
      supports: 'supports:direct',
      role: byCandidate.get(side.candidate_id)?.role ?? 'unresolved',
    });

    bd.addEvidence(sideEvidence(a, 'ev-side-a'));
    bd.addEvidence(sideEvidence(b_, 'ev-side-b'));
    bd.addEntity({
      kind: 'instrument', id: conflict.instrument_id, path: 'data/instruments.json', field: null,
      note: `Two authoritative sources state different values for this instrument's ${conflict.attribute.replace(/_/g, ' ')}.`,
    });

    const readable = conflict.attribute.replace(/_/g, ' ');
    bd.set('verification_id', this.ids.mint('ver', {
      kind: 'conflict',
      entities: [{ kind: 'instrument', id: conflict.instrument_id, path: 'data/instruments.json' }],
      subject: conflict.attribute,
      /* The two sides, in a fixed order, so the id is the same
         whichever way round the pair was compared. */
      discriminator: [`${a.url} ${a.value}`, `${b_.url} ${b_.value}`].sort().join(' | '),
    }));
    bd.set('statement', `The ${readable} of ${conflict.instrument_id} is a single settled value.`);
    bd.set('method', `Compared what two separately retrieved documents state for the ${readable} of ${conflict.instrument_id}. ${a.url} states "${a.value}"; ${b_.url} states "${b_.value}". No ranking was applied between them.`);
    bd.inference('verdict', 'conflict', 'Two authoritative sources state different values, and this check does not choose between them.', ['ev-side-a', 'ev-side-b'],
      'Both sources are at tier 1 or tier 2. Recording one and dropping the other is a decision about the law, which docs/AGENT-ROLES.md reserves to a human and .agents/skills/legal-source-verification/SKILL.md names as a refusal condition.');
    bd.inference('conflicting_evidence', undefined, 'The two evidence entries disagree about the same attribute of the same instrument.', ['ev-side-a', 'ev-side-b'],
      `Grouped both statements by instrument and attribute and compared the printed values, treating a difference of precision and an equal date written two ways as agreement rather than conflict (agent/verifier/conflict.mjs).`);

    bd.set('conflicting_evidence', [{
      evidence_refs: ['ev-side-a', 'ev-side-b'],
      disagreement: `${a.url} states the ${readable} as "${a.value}". ${b_.url} states it as "${b_.value}".`,
      unreconciled_because: conflict.unreconciled_because,
    }]);
    bd.set('confidence', confidenceOf({
      verdict: 'conflict', located: Boolean(a.locator), quoted: true,
      statusFromSentence: false, authoritative: true, documentIdentified: false, ambiguousStatus: false,
    }));
    bd.set('checked_at', at);
    bd.set('checked_by_kind', 'agent');
    bd.set('checked_by', VERIFIER_AGENT);
    bd.set('supersedes', null);
    bd.set('recheck_after', null);
    bd.openNull('supporting_location', 'Where is this settled?',
      'A single passage in a single document. This record compares two documents and sits inside neither of them.');
    bd.openNull('source_tier', 'Which tier governs here?',
      'A decision about which of the two sources governs. Both are authoritative, they sit at different tiers, and naming one tier on this record would be picking the winner it deliberately does not pick.');
    bd.openNull('document_id', 'Which document settles this?', 'A single authoritative statement, or a decision about which of the two governs.');
    bd.openNull('legal_status', 'What state is the act in?', 'A resolution of the disagreement below. The status turns on the disputed date.');
    for (const f of ['publication_date', 'entry_into_force_date', 'applicability_date']) {
      if (f === conflict.attribute) {
        bd.openNull(f, `Which ${readable} governs?`, `A source that displaces one of the two, or a human decision recorded as one. Two authoritative sources state different values and neither outranks the other.`, { blocks: true });
      } else {
        bd.openNull(f, `What is the ${f.replace(/_/g, ' ')} of ${conflict.instrument_id}?`, 'Not examined by this check, which compared one attribute across two documents.');
      }
    }

    bd.set('residual_gap', `The ${readable} of ${conflict.instrument_id} is not settled. ${a.url} states "${a.value}"; ${b_.url} states "${b_.value}". ${conflict.unreconciled_because} Nothing downstream may treat either value as the answer until a human decides, and this verifier has deliberately not chosen.`);

    return this.#ship(span, bd.build(), conflict.sides.map((s) => s.candidate_id));
  }

  /* ---------------------------------------------------------- the run */

  async run({ candidates, task = 'Check what the candidate documents actually establish, proposition by proposition.' } = {}) {
    const started_at = this.#now();
    const run = this.tracer.startRun({
      kind: 'agent',
      agent: VERIFIER_AGENT,
      task,
      inputs: {
        candidates: (candidates ?? []).map((c) => c?.candidate_id ?? null),
        mode: this.simulated ? 'mock' : 'live',
        limits: this.limits,
      },
    });

    const records = [];
    const refused = [];
    const findings = [];
    const byCandidate = new Map();
    let propositions_checked = 0;
    let set_aside = 0;

    try {
      run.observe({
        summary: `Legal Verifier starting over ${(candidates ?? []).length} candidate(s) in ${this.simulated ? 'mock' : 'live'} mode.`,
        subject: 'run',
        data: { candidates: (candidates ?? []).length, simulated: this.simulated },
        confidence: 1, risk: 'none', simulated: this.simulated,
      });

      /* A limit that silently drops input is a limit that makes a
         run look complete when it is not. Whatever this run does not
         reach is named, counted, and carried into the run record's
         open questions. */
      const offered = candidates ?? [];
      const taken = offered.slice(0, this.limits.max_candidates);
      const dropped = offered.slice(this.limits.max_candidates);
      if (dropped.length) {
        run.observe({
          summary: `${dropped.length} candidate(s) were not reached: the run limit is ${this.limits.max_candidates}.`,
          subject: 'run',
          data: { dropped: dropped.map((c) => c?.candidate_id ?? null), max_candidates: this.limits.max_candidates },
          confidence: 1, risk: 'medium', simulated: this.simulated,
        });
      }

      for (const candidate of taken) {
        const intake = this.#intake(run, candidate);
        if (!intake.ok) {
          refused.push({ candidate_id: candidate?.candidate_id ?? null, reason: intake.reason });
          run.observe({
            summary: `Refused at intake: ${intake.reason}`,
            subject: candidate?.candidate_id ?? 'unknown candidate',
            data: { reason: intake.reason },
            confidence: 1, risk: 'medium', simulated: this.simulated,
          });
          continue;
        }

        const res = await this.#retrieve(run, candidate.url);
        if (!res.ok) {
          records.push(this.#unreachable(run, { candidate, res }));
          continue;
        }

        const html = res.bytes.toString('utf8');
        /* The <head> is stripped before decomposition. A <title> has
           no full stop, so it runs into the document's first real
           sentence and produces a proposition that is half metadata
           — and the title is already read separately, by
           extractTitle, into the evidence entry where it belongs.
           Instrument matching still runs over the whole text. */
        const docText = textOf(html.replace(/<head[\s\S]*?<\/head>/i, ' '));
        const docTitle = extractTitle(html)?.value ?? null;
        const metaDate = extractPublicationDate(html)?.value ?? null;

        const registered = authorityForUrl(candidate.url);
        const authority_class = registered?.authority_class ?? candidate.authority_class ?? null;
        const authority_from = registered
          ? 'the host, which is on this verifier\'s own authority registry'
          : (candidate.authority_class ? 'the authority class the SourceCandidate carries, which this verifier did not re-derive' : null);

        const doctype = classifyDocument(docText);
        const { tier, method: tierBase } = estimateTier({ authority_class, source_type: doctype.source_type });
        const tierMethod = `${tierBase} ${doctype.method}`;

        const docId = readDocumentId(docText);
        const dates = readDates(docText, { publication_date: metaDate });
        const docStatus = resolveStatus(statusSignals(docText));
        const docMatches = matchInstruments(textOf(html), this.terms);
        const docSignals = statusSignals(docText);

        const parsed = decompose(docText, { instrumentTerms: this.terms });
        set_aside += parsed.set_aside.length;

        const ctx = {
          candidate, docText, docTitle, res, authority_class, authority_from,
          tier, tierMethod, docId, dates, docStatus, docMatches, docSignals,
          role: roleFor(authority_class),
          propositionCount: parsed.propositions.length,
        };
        byCandidate.set(candidate.candidate_id, ctx);

        const decomposeSpan = run.startTool({
          name: 'verifier.decompose',
          inputs: { candidate_id: candidate.candidate_id, bytes: res.byte_length },
        });
        decomposeSpan.end({
          status: 'ok',
          outputs: {
            sentences: parsed.total,
            material: parsed.propositions.length,
            set_aside: parsed.set_aside.length,
            document_status: docStatus.status,
            source_type: doctype.source_type,
            tier,
          },
        });

        for (const proposition of parsed.propositions.slice(0, this.limits.max_propositions_per_document)) {
          const record = this.#verifyProposition(run, ctx, proposition);
          records.push(record);
          propositions_checked++;

          /* Collect what this record states, for the cross-document
             pass. A finding is a pointer to a value, not a second
             copy of the record. */
          const instrument = record.affected_entities.find((e) => e.kind === 'instrument')?.id ?? null;
          for (const attribute of ['legal_status', 'publication_date', 'entry_into_force_date', 'applicability_date']) {
            const value = record[attribute];
            if (value === null || value === 'unknown') continue;
            findings.push({
              finding_id: `${record.verification_id}:${attribute}`,
              instrument_id: instrument,
              attribute,
              value,
              candidate_id: candidate.candidate_id,
              tier,
              quote: proposition.text,
              url: candidate.url,
              locator: record.supporting_location?.raw ?? null,
            });
          }
        }
      }

      /* --- across documents ----------------------------------------- */

      const crossSpan = run.startTool({ name: 'verifier.crosscheck', inputs: { findings: findings.length } });
      const { conflicts, outranked, precision_differences } = findConflicts(findings);
      crossSpan.end({
        status: 'ok',
        outputs: { conflicts: conflicts.length, outranked: outranked.length, precision_differences: precision_differences.length },
      });

      const conflictRecords = conflicts.map((c) => this.#conflictRecord(crossSpan, c, byCandidate));
      records.push(...conflictRecords);

      for (const o of outranked) {
        run.observe({
          summary: `Not a conflict: ${o.note}`,
          subject: o.instrument_id,
          data: { attribute: o.attribute, higher: o.higher.value, higher_tier: o.higher.tier, lower: o.lower.value, lower_tier: o.lower.tier },
          confidence: 0.7, risk: 'low', simulated: this.simulated,
        });
      }
      for (const p of precision_differences) {
        run.observe({
          summary: `Two sources state the same ${p.attribute.replace(/_/g, ' ')} at different precisions — "${p.a.value}" and "${p.b.value}". Not a disagreement, and not equal either.`,
          subject: p.a.instrument_id,
          data: { attribute: p.attribute, a: p.a.value, b: p.b.value },
          confidence: 0.8, risk: 'low', simulated: this.simulated,
        });
      }

      /* --- the run record -------------------------------------------- */

      const byVerdict = tally(records.map((r) => r.verdict));
      const byOutcome = tally(records.map((r) => outcomeClassOf(r.verdict)));
      const ended_at = this.#now();
      const runOpen = unresolvedForRun({ byOutcome, refused, dropped });

      const runRecord = this.#builder('AgentRun', run).build({
        run_id: run.span_id,
        parent_run_id: run.parent_run_id,
        task,
        started_at,
        ended_at,
        status: 'ok',
        inputs: { candidates: (candidates ?? []).length, mode: this.simulated ? 'mock' : 'live' },
        outputs: { verifications: records.length, propositions_checked, set_aside, refused: refused.length, not_reached: dropped.length, by_verdict: byVerdict, by_outcome: byOutcome },
        produced: records.map((r) => ({ contract: 'VerificationRecord', id: r.verification_id })),
        /* A read-only checking run changes nothing and touches no
           entity: what it is ABOUT lives on the verifications it
           produced, and claiming the run touched those instruments
           would be claiming it changed them.

           But a run that ended holding a BLOCKING question is not
           one anything proceeds on unattended, whatever it did or
           did not touch — an unresolved conflict between two
           authorities is exactly the case docs/AUTONOMY-POLICY.md
           reserves for a human. So the class is derived from what
           the run actually found rather than asserted from what
           kind of run it is, and validate.mjs refuses the
           combination that would let it through. */
        autonomy_class: runOpen.some((u) => u.blocks) ? 'review_required' : 'autonomous',
        confidence: records.length ? 0.7 : 0.4,
        risk: 'low',
        handed_off_to: [],
        affected_entities: [],
        evidence: [{
          evidence_id: 'ev-run',
          kind: 'measurement',
          source_id: null, url: null, locator: 'this run', title: null, publisher: null,
          quote: null, retrieved_at: ended_at, checksum: null,
          supports: 'supports:direct', role: 'primary', simulated: this.simulated,
        }],
        epistemic: {
          fact: [{
            field: null,
            statement: `The run began at ${started_at} and finished at ${ended_at}, checking ${propositions_checked} proposition(s) across ${byCandidate.size} retrieved document(s) and setting ${set_aside} sentence(s) aside as immaterial.`,
            evidence_refs: ['ev-run'],
          }],
          inference: [], interpretation: [],
          unresolved: runOpen,
        },
      });
      this.#ship(run, runRecord);

      run.end({
        status: 'ok',
        outputs: { verifications: records.length, by_verdict: byVerdict, by_outcome: byOutcome },
        confidence: 0.7,
        risk: 'low',
      });

      return {
        run_id: run.span_id,
        trace_id: run.trace_id,
        records,
        refused,
        conflicts: conflictRecords,
        outranked,
        precision_differences,
        propositions_checked,
        set_aside,
        not_reached: dropped.map((c) => c?.candidate_id ?? null),
        by_verdict: byVerdict,
        by_outcome: byOutcome,
      };
    } catch (err) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }
  }
}

/* ---------------------------------------------------------- helpers */

const ROLE_BY_AUTHORITY = {
  'authority:eur-lex': 'primary',
  'authority:court': 'primary',
  'authority:commission': 'official',
  'authority:edpb': 'official',
  'authority:edps': 'official',
  'authority:enisa': 'official',
  'authority:eu-agency': 'official',
  'authority:national-authority': 'official',
  'authority:secondary-expert': 'secondary',
};

/** An unregistered publisher gets "unresolved", not "secondary". A
 *  default of secondary would be a claim about a publisher nobody
 *  has identified. */
const roleFor = (authority_class) => ROLE_BY_AUTHORITY[authority_class] ?? 'unresolved';

function tally(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** What the verdict was not, and why. */
function alternativesFor(verdict, verdictOf, status, location) {
  const alts = [];
  if (verdict !== 'confirmed') {
    alts.push(`confirmed — rejected: ${verdictOf.because}`);
  }
  if (verdict !== 'not_determinable' && status.ambiguous === false && verdict !== 'source_unavailable') {
    alts.push('not_determinable — rejected: the document does bear on the proposition, and calling that "not determinable" would file evidence as an absence of evidence');
  }
  if (verdict !== 'contradicted') {
    alts.push('contradicted — rejected: nothing in the document states the opposite of the proposition');
  }
  if (!location && verdict !== 'confirmed') {
    alts.push('a stronger verdict on the strength of the wording alone — rejected: an unlocatable support cannot be re-checked');
  }
  return alts;
}

function unresolvedForRun({ byOutcome, refused, dropped = [] }) {
  const out = [];
  const unresolvedCount = byOutcome.unresolved ?? 0;
  const conflictCount = byOutcome.conflict ?? 0;
  if (unresolvedCount) {
    out.push({
      field: null,
      question: 'What do the unresolved checks actually establish?',
      missing: `${unresolvedCount} check(s) came back unresolved. Each names what would close it in its own residual_gap; none of them is a negative finding about the proposition.`,
      absence_kind: 'null_not_researched',
      blocks: false,
    });
  }
  if (conflictCount) {
    out.push({
      field: null,
      question: 'Which of the conflicting authoritative statements governs?',
      missing: `${conflictCount} conflict(s) between authoritative sources, left unresolved on purpose. A human decides; this run deliberately did not.`,
      absence_kind: 'null_not_researched',
      blocks: true,
    });
  }
  if (dropped.length) {
    out.push({
      field: null,
      question: 'What do the candidates this run did not reach say?',
      missing: `${dropped.length} candidate(s) were offered and not checked, because the run's own limit stopped it: ${dropped.map((c) => c?.candidate_id ?? 'an unnamed candidate').join(', ')}. Nothing is asserted about them, and this run is not a complete pass over what it was given.`,
      absence_kind: 'null_not_researched',
      blocks: false,
    });
  }
  if (refused.length) {
    out.push({
      field: null,
      question: 'What do the refused candidates say?',
      missing: `${refused.length} candidate(s) were refused at intake and not checked: ${refused.map((r) => `${r.candidate_id} (${r.reason})`).join('; ')}.`,
      absence_kind: 'null_not_researched',
      blocks: false,
    });
  }
  return out;
}

function safeHost(url) {
  try { return new URL(url).hostname; } catch { return 'the host'; }
}

export { roleFor, readDocumentId };
