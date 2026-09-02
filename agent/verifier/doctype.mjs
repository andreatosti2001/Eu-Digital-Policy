/* ============================================================
   agent/verifier/doctype.mjs — what kind of document this is, in
   the site's own vocabulary

   `agent/scout/authorities.mjs` estimates an evidence tier from the
   issuing authority AND the document type, and returns null when
   neither settles it — which, for the Commission, is most of the
   time, because the Commission publishes both tier 1 legislative
   documents and tier 2 press releases. The Scout leaves the type
   null by design: it reads what a document states about itself and
   stops, and a document does not usually state its own taxonomy
   term.

   The Verifier needs the type, because the brief requires it to
   record a source tier and the tier is not derivable from the
   publisher alone. So it classifies — from the document's own
   self-description, never from its host or its address — and
   returns null wherever the self-description does not settle it.
   Null is the answer that gets an open question; it is never
   rounded to the nearest plausible type.

   Every term returned is a `source_type` id from
   data/taxonomy.json, read from the taxonomy rather than copied,
   so a renamed term fails at load rather than silently classifying
   nothing.
   ============================================================ */

import { taxonomyIds } from '../schemas/types.mjs';

const SIGNALS = [
  { type: 'source-type:judgment', re: /\b(?:JUDGMENT\s+OF\s+THE\s+COURT|the\s+Court\s+(?:hereby\s+)?(?:rules|declares)|In\s+Case\s+[CT]-\d+)/i, means: 'the document is written as a judgment' },
  { type: 'source-type:regulation', re: /\b(?:THE\s+EUROPEAN\s+PARLIAMENT\s+AND\s+THE\s+COUNCIL\s+OF\s+THE\s+EUROPEAN\s+UNION|HAVE\s+ADOPTED\s+THIS\s+REGULATION)\b/i, means: 'the document carries the enacting formula of a regulation' },
  { type: 'source-type:legislative-document', re: /\bCOM\(\d{4}\)\s*\d+\s*final\b/, means: 'the document carries a COM final reference' },
  { type: 'source-type:decision', re: /\bHAS\s+ADOPTED\s+THIS\s+DECISION\b/i, means: 'the document carries the enacting formula of a decision' },
  { type: 'source-type:guidance', re: /\b(?:these|this)\s+guidelines?\b/i, means: 'the document describes itself as guidelines' },
  { type: 'source-type:opinion', re: /\b(?:this|the\s+present)\s+opinion\b/i, means: 'the document describes itself as an opinion' },
  { type: 'source-type:press-release', re: /\bpress\s+release\b/i, means: 'the document describes itself as a press release' },
  { type: 'source-type:report', re: /\b(?:this|the\s+present)\s+report\b/i, means: 'the document describes itself as a report' },
  { type: 'source-type:commentary', re: /\bthe\s+views\s+expressed\b/i, means: 'the document carries a personal-views disclaimer' },
];

/* A term this module invents is a term nothing downstream can
   resolve. Fail at load. */
{
  const known = taxonomyIds('source_type');
  for (const s of SIGNALS) {
    if (!known.includes(s.type)) throw new Error(`doctype.mjs signals "${s.type}", which data/taxonomy.json's source_type does not have`);
  }
}

/**
 * @returns {{source_type:string|null, matched:string|null, method:string}}
 *   null where the document's own wording does not place it. The
 *   caller records that as an open question, and the tier estimate
 *   falls back to the authority alone or to null.
 */
export function classifyDocument(text) {
  const src = String(text ?? '');
  const hits = [];
  for (const s of SIGNALS) {
    const m = src.match(s.re);
    if (m) hits.push({ ...s, matched: m[0].replace(/\s+/g, ' ').trim() });
  }
  if (hits.length === 0) {
    return { source_type: null, matched: null, method: 'The document does not describe itself as any document type this verifier recognises. Nothing is concluded from its address or its host.' };
  }
  /* SIGNALS is in descending order of how much the wording proves:
     an enacting formula is decisive, "this report" is a phrase that
     can appear inside anything. First hit in that order wins, and
     the method says what it matched. */
  const chosen = hits[0];
  const others = hits.slice(1);
  return {
    source_type: chosen.type,
    matched: chosen.matched,
    method: `Classified as ${chosen.type} because ${chosen.means} — matched "${chosen.matched}".${others.length ? ` The document also carries wording for ${others.map((o) => o.type).join(', ')}; the more decisive form was taken.` : ''}`,
  };
}
