/* ============================================================
   agent/integrate/sources.mjs — requirement 2: find an existing
   source before creating a duplicate

   data/sources.json says it in its own $description: "One record per
   document. A source is never described twice." Seventy-seven
   records, referenced by id from claims, enforcement, timeline,
   instruments and institutions. A duplicate here is not untidy — it
   splits a document's provenance in half, so the tier, the accessed
   date and the note recorded against one copy say nothing about the
   other, and a reader following a citation lands on whichever copy
   the reference happened to point at.

   FOUR STRATEGIES, ORDERED BY WHAT THEY PROVE.

     source_id        the evidence already carries a source_id that
                      resolves. Identity, declared.
     celex            the CELEX numbers are equal. A CELEX number
                      identifies a document in the Official Journal;
                      two addresses carrying the same one are one
                      document.
     normalised_url   the addresses normalise to the same thing.
                      Proof of a weaker kind — a redirect could still
                      make two different-looking addresses one
                      document, which is why it is below CELEX.
     title_and_publisher
                      the normalised titles match AND the publisher
                      is the same. A SUGGESTION, and scored as one:
                      two EDPB documents can legitimately share a
                      title, which is the Scout's own finding in
                      agent/scout/dedupe.mjs.

   SAME PATH, DIFFERENT QUERY. Two EUR-Lex URLs that share a host
   and a path but differ in their parameters are very often one
   document seen two ways — and sometimes two language editions or
   two consolidated versions, which are different documents with
   different content. That is reported as `ambiguous`, never
   resolved: picking one would be this layer deciding that a
   consolidated text and an original are interchangeable.

   AND THE THING THIS MODULE WILL NOT DO. Where nothing matches, the
   answer is a proposal to create a source record — and only where
   the document was actually retrieved and read in the run that
   produced the verification. Creating a sources.json record from a
   title, an abstract, a search snippet or model knowledge is red
   tier under AI-SAFE-BOUNDARIES §3. The DataProposal contract
   refuses it; this module refuses to build one.
   ============================================================ */

import { normaliseUrl, normaliseTitle, celexOf, decide, searchBlock, THRESHOLDS } from './match.mjs';

export const SOURCE_STRATEGIES = ['source_id', 'celex', 'normalised_url', 'title_and_publisher'];

/** The evidence entry a verification actually read a document from.
 *  Only a `retrieved_document` can found a source record: the other
 *  evidence kinds are a repository file, a measurement, another
 *  agent's record or an admitted absence, and none of them is a
 *  publication.
 *
 *  WHERE THERE ARE SEVERAL, THE STRONGEST WINS — direct, then
 *  partial, then context. Taking whichever happened to be first in
 *  the array would make which document a claim ends up citing depend
 *  on the order the Verifier wrote its evidence in, and a
 *  commentary listed above the Official Journal would become the
 *  citation. Ordering is not a fact about the documents. */
const SUPPORT_RANK = { 'supports:direct': 3, 'supports:partial': 2, 'supports:context': 1 };

export function retrievedDocumentOf(verification) {
  const docs = (verification.evidence ?? []).filter((e) => e?.kind === 'retrieved_document');
  if (!docs.length) return null;
  return docs.reduce((best, e) =>
    (SUPPORT_RANK[e.supports] ?? 0) > (SUPPORT_RANK[best.supports] ?? 0) ? e : best);
}

/**
 * Resolve the document a verification read to a record in
 * data/sources.json.
 *
 * @param {object} verification
 * @param {object} corpus
 * @returns {{outcome:'matched'|'ambiguous'|'no_match', source_id:string|null,
 *            document:object|null, search:object, decision:object,
 *            retrieved_and_read:boolean}}
 */
export function resolveSource(verification, corpus) {
  const doc = retrievedDocumentOf(verification);
  const retrieved_and_read = Boolean(doc && doc.retrieved_at && (doc.url || doc.locator));

  if (!doc) {
    const decision = { outcome: 'no_match', match: null, considered: 0, near: [], best: null };
    return {
      outcome: 'no_match',
      source_id: null,
      document: null,
      retrieved_and_read: false,
      compared: corpus.sources.length,
      decision,
      search: searchBlock(decision, SOURCE_STRATEGIES, { subject: 'document', compared: corpus.sources.length }),
    };
  }

  /* --- declared identity ---------------------------------------- */
  if (doc.source_id && corpus.sourceById.has(doc.source_id)) {
    const hit = { id: doc.source_id, score: 1, strategy: 'source_id', why: 'The evidence entry already names this source record, and it resolves.' };
    const decision = { outcome: 'matched', match: hit, considered: 1, near: [], best: hit };
    return {
      outcome: 'matched', source_id: doc.source_id, document: doc, retrieved_and_read,
      compared: corpus.sources.length, decision, search: searchBlock(decision, ['source_id'], { subject: 'document', compared: corpus.sources.length }),
    };
  }

  const docCelex = celexOf(doc.url) ?? celexOf(verification.document_id);
  const docUrl = doc.url ? normaliseUrl(doc.url) : null;
  const docTitle = normaliseTitle(doc.title);
  const docPublisher = normaliseTitle(doc.publisher);
  let sameStemDifferentQuery = [];

  const scored = [];
  for (const s of corpus.sources) {
    /* CELEX — identity. */
    const sCelex = celexOf(s.url);
    if (docCelex && sCelex && docCelex === sCelex) {
      scored.push({ id: s.id, score: 1, strategy: 'celex', why: `Both addresses carry CELEX ${docCelex}, which identifies one document in the Official Journal.` });
      continue;
    }

    /* URL — proof of a weaker kind. */
    if (docUrl && s.url) {
      const sUrl = normaliseUrl(s.url);
      if (sUrl === docUrl) {
        scored.push({ id: s.id, score: 0.95, strategy: 'normalised_url', why: 'The two addresses normalise to the same URL. A redirect could still make two addresses one document, which is why this scores below a CELEX match rather than equal to it.' });
        continue;
      }
      if (samePathDifferentQuery(sUrl, docUrl)) {
        sameStemDifferentQuery.push(s.id);
        scored.push({
          id: s.id,
          score: THRESHOLDS.accept,
          strategy: 'normalised_url',
          why: `Same host and path as the retrieved document, different parameters (${s.url} against ${doc.url}). That is often one document seen two ways and sometimes two language editions or two consolidated versions, which are different documents.`,
        });
        continue;
      }
    }

    /* Title and publisher — a suggestion, scored as one. */
    if (docTitle && normaliseTitle(s.title) === docTitle) {
      const samePublisher = docPublisher && (normaliseTitle(s.publisher_name) === docPublisher || normaliseTitle(s.publisher) === docPublisher);
      scored.push({
        id: s.id,
        score: samePublisher ? 0.75 : 0.55,
        strategy: 'title_and_publisher',
        why: samePublisher
          ? 'Identical title and the same publisher. A suggestion rather than proof: two documents from one regulator can share a title.'
          : `Identical title, different publisher (${s.publisher_name ?? s.publisher ?? 'none recorded'} against ${doc.publisher ?? 'none stated'}). Weaker still.`,
      });
    }
  }

  const decision = decide(scored);

  /* A same-path-different-query hit lands exactly on the accept
     threshold, so `decide` would take it. It must not: that is the
     one case where a high score means "look at this", not "this is
     it". Downgraded here rather than by lowering its score, so the
     reason survives into the record. */
  if (decision.outcome === 'matched' && sameStemDifferentQuery.includes(decision.match.id)
    && decision.match.strategy === 'normalised_url' && decision.match.score === THRESHOLDS.accept) {
    const downgraded = { ...decision, outcome: 'ambiguous', match: null, near: [decision.match] };
    return {
      outcome: 'ambiguous', source_id: null, document: doc, retrieved_and_read,
      compared: corpus.sources.length, decision: downgraded, search: searchBlock(downgraded, SOURCE_STRATEGIES, { subject: 'document', compared: corpus.sources.length }),
    };
  }

  return {
    outcome: decision.outcome,
    source_id: decision.match?.id ?? null,
    document: doc,
    retrieved_and_read,
    compared: corpus.sources.length,
    decision,
    search: searchBlock(decision, SOURCE_STRATEGIES, { subject: 'document', compared: corpus.sources.length }),
  };
}

function samePathDifferentQuery(a, b) {
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.hostname === y.hostname && x.pathname === y.pathname && x.search !== y.search;
  } catch { return false; }
}

/**
 * The fields a NEW source record would carry, drawn only from what
 * the document itself gave up.
 *
 * Every value here was read from the retrieved document or from the
 * verification that read it. Nothing is defaulted, nothing is
 * guessed, and the fields this layer cannot establish come back
 * null with the reason — `tier` above all, which is settled by a
 * human on the record and never by an agent's estimate. The
 * Verifier's own `source_tier` is typed as an inference and named as
 * an estimate for exactly this reason; carrying it across into
 * data/sources.json as the settled tier would launder one into the
 * other.
 */
export function draftSourceRecord({ verification, document, corpus }) {
  const celex = celexOf(document?.url) ?? celexOf(verification.document_id);
  return {
    /* The id is left for a human. Every other id in this repository
       was minted by somebody who had read the document and knew what
       to call it, and an auto-generated one would be the first
       machine-named record in a namespace that is never renamed. */
    id: null,
    tier: null,
    type: null,
    publisher: null,
    publisher_name: document?.publisher ?? null,
    title: document?.title ?? null,
    url: document?.url ?? null,
    url_status: null,
    published: verification.publication_date && verification.publication_date !== 'unknown'
      ? verification.publication_date
      : null,
    accessed: document?.retrieved_at ? String(document.retrieved_at).slice(0, 10) : null,
    language: null,
    note: null,
    document_id: celex,
    /* Which of the above this layer could not establish, and why —
       carried alongside rather than filled in. */
    not_established: {
      id: 'Every id in this repository was minted by somebody who had read the document. This layer does not name records in a namespace that is never renamed.',
      tier: 'The evidence tier is settled on the source record by a human. The verification carries a source_tier, and that field is typed as an inference and documented as an estimate — writing it here as the settled tier would turn an estimate into a fact by moving it.',
      type: 'The source type is a taxonomy term describing what kind of document this is. The verification classifies a document type for its own purposes; the canonical type is a data decision.',
      publisher: 'The publisher field resolves to an institution id in data/institutions.json, or the literal "eu". The document states a publisher name, which is not the same thing.',
      url_status: 'url_status is a stored assertion by whoever last edited the record (SOURCE-POLICY §8). Nothing in this repository has ever fetched a URL as part of a validator, and this layer will not assert a status it did not establish.',
      language: 'Not read from the document by this layer.',
      note: 'The note records what was checked, when, and how closely the document matches the characterisation it is being cited for. That is a reading, and it is the reviewer\'s to write.',
    },
    /* Not a field of the record — a pointer for the reviewer. */
    _ids_in_use: corpus.allIds.size,
  };
}
