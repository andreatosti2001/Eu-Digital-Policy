/* ============================================================
   agent/verifier/fixtures.mjs — the adversarial corpus

   SESSION 07's brief: "Build adversarial tests using ambiguous
   legal-status examples." These are those examples, and every one
   of them is a case where the plausible answer is the wrong one.

   Built first, deliberately, for the reason `agent/scout/fixtures.mjs`
   already gives: an agent developed against whatever the live web
   happened to serve on the day handles the awkward cases by
   accident. Here the awkward cases ARE the corpus.

     A  the twentieth-day formula — states the RULE for entry into
        force and no date. The plausible answer computes one.
     B  in force, applying later — the AI Act shape. The plausible
        answer says the act applies.
     C  applying in stages — two application dates. The plausible
        answer picks the earlier, or the later.
     D  one document, two acts — repeals one and amends another. The
        plausible answer attaches "repealed" to the wrong instrument.
     E  annulled, under appeal — the plausible answer says annulled,
        which is a judgment that is not final.
     F  a corrigendum — the plausible answer treats the corrected
        text as the original.
     G  guidance using "shall" — the plausible answer reads an
        obligation out of a document that says it does not bind.
     H  two authorities, two dates — the plausible answer picks the
        more authoritative, or the more recent.
     I  a press release with no status wording — the plausible
        answer infers a status from the publisher.
     J  metadata against the operative text — the plausible answer
        takes the machine-readable field, which is the trap this
        repository has already been caught by once.
     K  a refused retrieval — the plausible answer is silence.

   EVERY HOST IS `.invalid`, which cannot resolve. Every document
   below is fiction: no date, article number, case number, CELEX
   number or quotation here is a real legal fact, and every record
   produced from them is marked `simulated: true` and refused as
   actionable by agent/schemas/validate.mjs. Under
   AI-SAFE-BOUNDARIES §0.1, fixture data that read as research would
   be a worse defect than having no fixtures at all. The instrument
   SHORT NAMES are real, because the corpus has to exercise the
   matcher against data/instruments.json; nothing asserted about
   them is.
   ============================================================ */

const page = (title, meta, body) => `<!doctype html>
<html lang="en"><head>
<title>${title}</title>
${meta}
</head><body>${body}</body></html>`;

const LEX = 'https://eur-lex.example.invalid/';
const CURIA = 'https://curia.example.invalid/';
const EDPB = 'https://edpb.example.invalid/';
const EC = 'https://commission.example.invalid/';

export const DOC = {
  formula: `${LEX}act/formula`,
  inForce: `${LEX}act/in-force-not-applicable`,
  staged: `${LEX}act/staged`,
  repealAmend: `${LEX}act/repeal-and-amend`,
  annulled: `${CURIA}judgment/annulled-on-appeal`,
  corrigendum: `${LEX}act/corrigendum`,
  guidance: `${EDPB}guidelines/1`,
  conflictA: `${LEX}act/conflict-a`,
  conflictB: `${EDPB}statement/conflict-b`,
  pressRelease: `${EC}press/1`,
  metadata: `${LEX}act/metadata-disagreement`,
  blocked: `${EC}blocked/1`,
};

/* ---------------------------------------------------------- documents */

export const MOCK_DOCUMENTS = {
  /* A · the rule, and no date */
  [DOC.formula]: {
    body: page('Simulated Regulation on a simulated matter',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>Simulated Regulation (EU) 2099/0001 concerning the Data Act.</p>
       <p>Article 40</p>
       <p>This Regulation shall enter into force on the twentieth day following that of its
          publication in the Official Journal of the European Union.</p>`),
  },

  /* B · in force is not applicable */
  [DOC.inForce]: {
    body: page('Simulated Regulation with a deferred application date',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>Simulated Regulation concerning the AI Act. HAVE ADOPTED THIS REGULATION:</p>
       <p>Article 113</p>
       <p>This Regulation entered into force on 1 August 2099. It shall apply from 2 August 2101.</p>`),
  },

  /* C · it applies in stages */
  [DOC.staged]: {
    body: page('Simulated Regulation applying in stages',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>Simulated provisions concerning the AI Act.</p>
       <p>Article 113</p>
       <p>Chapters I and II shall apply from 2 February 2100 and the remaining provisions
          shall apply from 2 August 2101.</p>`),
  },

  /* D · one document, two acts, two statuses */
  [DOC.repealAmend]: {
    body: page('Simulated Regulation repealing one act and amending another',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>Article 94</p>
       <p>The simulated predecessor instrument is repealed with effect from 25 May 2099.</p>
       <p>Article 95</p>
       <p>The DSA is amended as set out in the Annex to this simulated Regulation.</p>`),
  },

  /* E · annulled, and under appeal */
  [DOC.annulled]: {
    body: page('Simulated judgment concerning a simulated decision',
      '<meta property="og:site_name" content="Simulated Court">',
      `<p>In Case T-9999/99, JUDGMENT OF THE COURT (Simulated Chamber).</p>
       <p>paragraph 212</p>
       <p>The simulated decision taken under the DMA is annulled.</p>
       <p>An appeal against that simulated judgment is pending before the Court of Justice.</p>`),
  },

  /* F · a corrigendum */
  [DOC.corrigendum]: {
    body: page('Simulated corrigendum',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>Corrigendum to simulated Regulation (EU) 2099/0002 concerning the CRA.</p>
       <p>p. 14</p>
       <p>In the simulated Annex, for "a simulated word" read "a different simulated word".</p>`),
  },

  /* G · guidance that says it does not bind, using obligation wording */
  [DOC.guidance]: {
    body: page('Simulated guidelines on a simulated question',
      '<meta property="og:site_name" content="Simulated EDPB">',
      `<p>These Guidelines are not legally binding.</p>
       <p>paragraph 41</p>
       <p>Controllers must inform data subjects of a simulated matter under the GDPR without
          undue delay.</p>`),
  },

  /* H · two authorities, two application dates for the same act */
  [DOC.conflictA]: {
    body: page('Simulated consolidated text',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>Simulated consolidated provisions of the NIS2 instrument. HAVE ADOPTED THIS REGULATION:</p>
       <p>Article 41</p>
       <p>This simulated instrument shall apply from 18 October 2099.</p>`),
  },
  [DOC.conflictB]: {
    body: page('Simulated statement on the same simulated instrument',
      '<meta property="og:site_name" content="Simulated EDPB">',
      `<p>This Opinion concerns the NIS2 instrument.</p>
       <p>paragraph 6</p>
       <p>The simulated instrument shall apply from 17 January 2100.</p>`),
  },

  /* I · a press release that places nothing */
  [DOC.pressRelease]: {
    body: page('Simulated press release',
      '<meta property="og:site_name" content="Simulated Commission">',
      `<p>Press release. The Commission today discussed a simulated matter concerning the
          Data Act with simulated stakeholders and will report in due course.</p>`),
  },

  /* J · the register against the text */
  [DOC.metadata]: {
    body: page('Simulated act whose metadata disagrees with its text',
      `<meta property="og:site_name" content="Simulated EUR-Lex">
       <meta property="article:published_time" content="2099-07-09">`,
      `<p>Simulated Regulation concerning the DORA instrument.</p>
       <p>Article 64</p>
       <p>It was published in the Official Journal on 12 July 2099 and entered into force on
          1 August 2099.</p>`),
  },

  /* K · refused before it reached the origin */
  [DOC.blocked]: { blocked: true, reason: 'simulated egress refusal', blocked_by: 'egress_policy' },
};

/* ---------------------------------------------------------- candidates

   What Agent 1 hands Agent 2. Each is a valid SourceCandidate — the
   Verifier calls `receive()` on it at intake and an invalid one dies
   at the boundary, so these have to satisfy the contract exactly as
   a real handoff would.                                            */

const TRACE = 'd4'.repeat(16);
const SPAN = 'e5'.repeat(8);
const RUN = 'f6'.repeat(8);
const AT = '2026-09-02T10:00:00.000Z';

/**
 * @param {{id:string, url:string, title:string, publisher:string|null,
 *          authority:string|null, tier:string|null, instruments:string[],
 *          agent?:string}} spec
 */
export function candidate({ id, url, title, publisher, authority, tier, instruments, agent = 'source-scout' }) {
  const fact = [];
  const inference = [];
  const unresolved = [];

  if (title) fact.push({ field: 'title', statement: `The document titles itself "${title}".`, evidence_refs: ['ev-retrieval'] });
  if (publisher) fact.push({ field: 'publisher', statement: `The document names "${publisher}" as its publisher.`, evidence_refs: ['ev-retrieval'] });

  if (authority) {
    inference.push({
      field: 'authority_class',
      statement: `It was issued by ${authority}.`,
      from: ['ev-retrieval'],
      method: 'A simulated host registered to this authority in the fixture corpus. Concluded from where it was served, not from anything the document states.',
    });
  } else {
    unresolved.push({
      field: 'authority_class',
      question: 'Which authority issued this document?',
      missing: 'An identification of the issuing body. The host is on no registered endpoint.',
      absence_kind: 'null_not_researched',
      blocks: false,
    });
  }
  if (tier) {
    inference.push({
      field: 'tier_estimate',
      statement: `It sits in ${tier}.`,
      from: ['ev-retrieval'],
      method: 'The issuing authority is named in the tier definition in data/taxonomy.json.',
    });
  }
  unresolved.push({
    field: 'publication_date',
    question: 'When was this document published?',
    missing: 'A publication date stated by the document in a machine-readable field. This fixture carries none, and no date is taken from a URL.',
    absence_kind: 'unknown_not_determinable',
    blocks: false,
  });

  return {
    contract: 'SourceCandidate',
    contract_version: 1,
    agent,
    created_at: AT,
    affected_entities: instruments.map((i) => ({
      kind: 'instrument', id: i, path: 'data/instruments.json', field: null,
      note: 'Matched in the fixture corpus.',
    })),
    evidence: [{
      evidence_id: 'ev-retrieval',
      kind: 'retrieved_document',
      source_id: null,
      url,
      locator: 'the document as served',
      title,
      publisher,
      quote: null,
      retrieved_at: AT,
      checksum: null,
      supports: 'supports:direct',
      role: authority === 'authority:secondary-expert' ? 'secondary' : (authority ? 'official' : 'unresolved'),
      simulated: true,
    }],
    epistemic: { fact, inference, interpretation: [{ field: 'relevance', statement: `It bears on ${instruments.join(', ')}.`, held_by: agent, basis: 'Matched instrument short names in the fixture text.', contested: false }], unresolved },
    trace_ref: { trace_id: TRACE, span_id: SPAN, run_id: RUN },
    simulated: true,
    candidate_id: id,
    url,
    locator: null,
    title,
    publisher,
    publication_date: 'unknown',
    source_type: null,
    url_status: 'url:live',
    tier_estimate: tier,
    authority_class: authority,
    relevance: `A simulated document that mentions ${instruments.join(', ')}. Whether it is a development in any of them is not established here.`,
    confidence: 0.6,
    duplicate_candidate_ids: [],
    matches_existing_source_id: null,
    verification_ref: null,
    state: 'proposed',
  };
}

const lex = (id, url, title, instruments) => candidate({
  id, url, title, publisher: 'Simulated EUR-Lex', authority: 'authority:eur-lex', tier: 'tier:1', instruments,
});

export const CANDIDATES = {
  formula: lex('cand-formula', DOC.formula, 'Simulated Regulation on a simulated matter', ['data-act']),
  inForce: lex('cand-in-force', DOC.inForce, 'Simulated Regulation with a deferred application date', ['ai-act']),
  staged: lex('cand-staged', DOC.staged, 'Simulated Regulation applying in stages', ['ai-act']),
  repealAmend: lex('cand-repeal-amend', DOC.repealAmend, 'Simulated Regulation repealing one act and amending another', ['dsa']),
  annulled: candidate({
    id: 'cand-annulled', url: DOC.annulled, title: 'Simulated judgment concerning a simulated decision',
    publisher: 'Simulated Court', authority: 'authority:court', tier: 'tier:1', instruments: ['dma'],
  }),
  corrigendum: lex('cand-corrigendum', DOC.corrigendum, 'Simulated corrigendum', ['cra']),
  guidance: candidate({
    id: 'cand-guidance', url: DOC.guidance, title: 'Simulated guidelines on a simulated question',
    publisher: 'Simulated EDPB', authority: 'authority:edpb', tier: 'tier:2', instruments: ['gdpr'],
  }),
  conflictA: lex('cand-conflict-a', DOC.conflictA, 'Simulated consolidated text', ['nis2']),
  conflictB: candidate({
    id: 'cand-conflict-b', url: DOC.conflictB, title: 'Simulated statement on the same simulated instrument',
    publisher: 'Simulated EDPB', authority: 'authority:edpb', tier: 'tier:2', instruments: ['nis2'],
  }),
  pressRelease: candidate({
    id: 'cand-press', url: DOC.pressRelease, title: 'Simulated press release',
    publisher: 'Simulated Commission', authority: 'authority:commission', tier: null, instruments: ['data-act'],
  }),
  metadata: lex('cand-metadata', DOC.metadata, 'Simulated act whose metadata disagrees with its text', ['dora']),
  blocked: candidate({
    id: 'cand-blocked', url: DOC.blocked, title: 'A simulated document nobody could reach',
    publisher: 'Simulated Commission', authority: 'authority:commission', tier: null, instruments: ['nis2'],
  }),
  /* The one the Verifier must refuse: it says this agent produced it. */
  selfScouted: candidate({
    id: 'cand-self-scouted', url: DOC.pressRelease, title: 'Simulated press release',
    publisher: 'Simulated Commission', authority: 'authority:commission', tier: null,
    instruments: ['data-act'], agent: 'legal-verifier',
  }),
};

export const ALL_CANDIDATES = Object.values(CANDIDATES);
