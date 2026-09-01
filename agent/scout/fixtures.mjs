/* ============================================================
   agent/scout/fixtures.mjs — the mocked corpus the Scout was built
   against

   Built first, deliberately. An agent developed straight against
   live regulators is an agent whose behaviour on the awkward cases —
   a page with no date, the same document at two addresses, a
   refusal — is whatever happened to occur on the day. Here those
   cases are all present and stable, so the Scout's handling of each
   is a decision rather than an accident.

   The seven documents exercise, in order: a listing page; a
   fully-described document; a document that states no date; the
   same document at a second address; a document about nothing in
   this corpus; a refused endpoint; and a secondary source that must
   be labelled as one.

   EVERY HOST IS `.invalid`, which cannot resolve, and every record
   the Scout produces from them is marked `simulated: true` and
   refused as actionable by `agent/schemas/validate.mjs`. Under
   AI-SAFE-BOUNDARIES §0.1 a fixture that reads as research would be
   a worse defect than no fixture at all. Nothing below is a legal
   fact, a real publication, or a real date.
   ============================================================ */

const page = (title, meta, body) => `<!doctype html>
<html lang="en"><head>
<title>${title}</title>
${meta}
</head><body>${body}</body></html>`;

const LISTING = 'https://eur-lex.example.invalid/';
const COMMISSION = 'https://commission.example.invalid/';
const EDPB = 'https://edpb.example.invalid/';
const ENISA = 'https://enisa.example.invalid/';
const BLOG = 'https://commentary.example.invalid/';

/** Mock endpoints, mirroring the real registry's authority classes
 *  so the Scout's classification path is exercised, on hosts that
 *  cannot resolve. */
export const MOCK_ENDPOINTS = [
  { id: 'ep-mock-eur-lex', authority_class: 'authority:eur-lex', authority_name: 'Simulated EUR-Lex', institution_id: null, url: LISTING, endpoint_verified: false, note: 'Simulated.' },
  { id: 'ep-mock-commission', authority_class: 'authority:commission', authority_name: 'Simulated Commission', institution_id: 'ec', url: COMMISSION, endpoint_verified: false, note: 'Simulated. Refuses, to exercise the blocked path.' },
  { id: 'ep-mock-edpb', authority_class: 'authority:edpb', authority_name: 'Simulated EDPB', institution_id: 'edpb', url: EDPB, endpoint_verified: false, note: 'Simulated.' },
  { id: 'ep-mock-enisa', authority_class: 'authority:enisa', authority_name: 'Simulated ENISA', institution_id: 'enisa', url: ENISA, endpoint_verified: false, note: 'Simulated.' },
  { id: 'ep-mock-commentary', authority_class: 'authority:secondary-expert', authority_name: 'Simulated commentary', institution_id: null, url: BLOG, endpoint_verified: false, note: 'Simulated. Secondary, and must be labelled so.' },
];

const DSA_DOC_BODY = `
  <h1>Simulated guidance on a simulated matter</h1>
  <p>This simulated document mentions the Digital Services Act and, elsewhere,
     the DSA, together with the identifier 32022R2065. None of it is real and
     none of it says anything about what the law requires.</p>`;

/** url → document. `blocked: true` makes the transport refuse. */
export const MOCK_DOCUMENTS = {
  [LISTING]: {
    body: page('Simulated Official Journal listing',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<ul>
         <li><a href="/doc/dated">A simulated dated document</a></li>
         <li><a href="/doc/undated">A simulated undated document</a></li>
         <li><a href="/doc/mirror">The same simulated document, again</a></li>
         <li><a href="/doc/unrelated">A simulated document about nothing here</a></li>
       </ul>`),
  },

  /* fully described: title, publisher and a machine-readable date */
  [`${LISTING}doc/dated`]: {
    body: page('Simulated guidance on a simulated matter',
      `<meta property="og:site_name" content="Simulated EUR-Lex">
       <meta property="article:published_time" content="2026-04-15">`,
      DSA_DOC_BODY),
  },

  /* states no date anywhere: publication_date must come out "unknown",
     with an open question, never a date taken from the URL */
  [`${LISTING}doc/undated`]: {
    body: page('Simulated notice with no stated date',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      `<p>A simulated notice concerning the Data Act. It carries no publication
          date in any machine-readable field, which is the point of it.</p>`),
  },

  /* byte-identical to /doc/dated: the duplicate path */
  [`${LISTING}doc/mirror`]: {
    body: page('Simulated guidance on a simulated matter',
      `<meta property="og:site_name" content="Simulated EUR-Lex">
       <meta property="article:published_time" content="2026-04-15">`,
      DSA_DOC_BODY),
  },

  /* mentions no instrument in this corpus: must be screened out */
  [`${LISTING}doc/unrelated`]: {
    body: page('Simulated notice about nothing in this corpus',
      '<meta property="og:site_name" content="Simulated EUR-Lex">',
      '<p>A simulated notice about municipal parking arrangements.</p>'),
  },

  /* the refused endpoint */
  [COMMISSION]: { blocked: true, reason: 'simulated egress refusal', blocked_by: 'egress_policy' },

  [EDPB]: {
    body: page('Simulated EDPB listing',
      '<meta property="og:site_name" content="Simulated EDPB">',
      '<ul><li><a href="/opinion/1">A simulated opinion</a></li></ul>'),
  },
  [`${EDPB}opinion/1`]: {
    body: page('Simulated opinion on a simulated question',
      `<meta property="og:site_name" content="Simulated EDPB">
       <meta name="DC.date" content="2026-05">`,
      '<p>A simulated opinion mentioning the GDPR and the AI Act.</p>'),
  },

  /* a host the registry knows, serving a page whose own metadata
     names no publisher: publisher must come out null, not "ENISA" */
  [ENISA]: {
    body: page('Simulated ENISA listing', '',
      '<ul><li><a href="/report/1">A simulated report</a></li></ul>'),
  },
  [`${ENISA}report/1`]: {
    body: page('Simulated threat report', '',
      '<p>A simulated report mentioning NIS2 and the CRA.</p>'),
  },

  [BLOG]: {
    body: page('Simulated commentary index',
      '<meta property="og:site_name" content="Simulated commentary">',
      '<ul><li><a href="/post/1">A simulated post</a></li></ul>'),
  },
  [`${BLOG}post/1`]: {
    body: page('What the simulated DSA might mean',
      `<meta property="og:site_name" content="Simulated commentary">
       <meta property="article:published_time" content="2026-06-01">`,
      '<p>Simulated commentary on the Digital Services Act. Secondary, and it says so.</p>'),
  },
};
