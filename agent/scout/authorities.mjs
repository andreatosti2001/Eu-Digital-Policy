/* ============================================================
   agent/scout/authorities.mjs — who publishes, and what that is
   worth

   Three things live here, and they are deliberately three things.

   THE HIERARCHY. The nine-level priority order is the array order of
   AUTHORITY_CLASSES in agent/schemas/types.mjs; this module derives
   the rank from the index rather than keeping a second table of
   numbers. A rank stored twice is a rank that can disagree with
   itself.

   THE ENDPOINTS. A small registry of real addresses the Scout will
   attempt. **Every entry is an unverified hypothesis about where a
   thing lives, not a citation.** No entry has been fetched from
   inside this repository; `endpoint_verified` says so on each one,
   and nothing here may become a SourceCandidate without an actual
   retrieval. That distinction is the whole reason this file can
   name a hostname at all without breaking the rule against
   authoring a URL from model knowledge: the Scout is not asserting
   that the address is correct, it is going to find out, and it
   records what happened either way.

   THE TIER ESTIMATE. Which evidence tier a document sits in is NOT
   a property of its publisher. `data/taxonomy.json` puts "official
   Commission decisions and legislative documents" in tier 1 and
   the Commission's other output in tier 2, so the estimate needs
   the document type as well — and where neither the authority nor
   the type settles it, the answer is null and a stated open
   question, never a guess. The mapping below is read out of the
   taxonomy's own notes; it invents no classification.
   ============================================================ */

import { AUTHORITY_CLASSES, SECONDARY_AUTHORITY } from '../schemas/types.mjs';

/** 1-based position in the priority hierarchy. Lower is searched and
 *  trusted first. Derived from the vocabulary's order. */
export const authorityRank = (cls) => {
  const i = AUTHORITY_CLASSES.indexOf(cls);
  return i === -1 ? AUTHORITY_CLASSES.length + 1 : i + 1;
};

/* ---------------------------------------------------------- endpoints */

/**
 * A small number of real authoritative sources, in priority order.
 * Root paths only: a deep link would be a second thing to be wrong
 * about, and the Scout follows links from what it actually receives.
 */
export const ENDPOINTS = [
  {
    id: 'ep-eur-lex',
    authority_class: 'authority:eur-lex',
    authority_name: 'EUR-Lex',
    institution_id: null,
    url: 'https://eur-lex.europa.eu/',
    endpoint_verified: false,
    note: 'The Official Journal and consolidated legislation. Tier 1 by the taxonomy\'s own definition.',
  },
  {
    id: 'ep-commission-digital',
    authority_class: 'authority:commission',
    authority_name: 'European Commission',
    institution_id: 'ec',
    url: 'https://digital-strategy.ec.europa.eu/',
    endpoint_verified: false,
    note: 'Commission digital policy. Tier depends on the document: a decision is tier 1, a policy page is tier 2.',
  },
  {
    id: 'ep-edpb',
    authority_class: 'authority:edpb',
    authority_name: 'European Data Protection Board',
    institution_id: 'edpb',
    url: 'https://www.edpb.europa.eu/',
    endpoint_verified: false,
    note: 'Guidelines, opinions and consistency decisions.',
  },
  {
    id: 'ep-edps',
    authority_class: 'authority:edps',
    authority_name: 'European Data Protection Supervisor',
    institution_id: 'edps',
    url: 'https://www.edps.europa.eu/',
    endpoint_verified: false,
    note: 'Opinions and supervision of the EU institutions themselves.',
  },
  {
    id: 'ep-enisa',
    authority_class: 'authority:enisa',
    authority_name: 'EU Agency for Cybersecurity',
    institution_id: 'enisa',
    url: 'https://www.enisa.europa.eu/',
    endpoint_verified: false,
    note: 'The cyber layer — NIS2, CRA, threat landscape reporting.',
  },
];

/** Registered endpoints, most authoritative first. */
export const endpointsByPriority = () =>
  [...ENDPOINTS].sort((a, b) => authorityRank(a.authority_class) - authorityRank(b.authority_class));

/** Which registered authority served a URL, if any. A host that is
 *  on no registered endpoint is NOT silently called secondary — the
 *  caller gets null and has to say so. */
export function authorityForUrl(url) {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return null; }
  for (const ep of ENDPOINTS) {
    const epHost = new URL(ep.url).hostname.toLowerCase();
    if (host === epHost || host.endsWith(`.${epHost}`) || epHost.endsWith(`.${host}`)) return ep;
  }
  return null;
}

/* ---------------------------------------------------------- tier estimate

   Read out of data/taxonomy.json's own notes:

     tier:1  "EUR-Lex, regulations, directives, CJEU, General Court,
              official Commission decisions and legislative documents"
     tier:2  "EDPB, EDPS, ENISA, national regulators and competent
              authorities, European Parliament, Council"
     tier:3  "Peer-reviewed research and established academic institutions"
     tier:4  "Industry, advocacy and press"                          */

const TIER_BY_AUTHORITY = {
  'authority:eur-lex': 'tier:1',
  'authority:court': 'tier:1',
  'authority:edpb': 'tier:2',
  'authority:edps': 'tier:2',
  'authority:enisa': 'tier:2',
  'authority:eu-agency': 'tier:2',
  'authority:national-authority': 'tier:2',
};

const TIER_BY_TYPE = {
  'source-type:regulation': 'tier:1',
  'source-type:judgment': 'tier:1',
  'source-type:decision': 'tier:1',
  'source-type:legislative-document': 'tier:1',
  'source-type:court-press-release': 'tier:1',
  'source-type:opinion': 'tier:2',
  'source-type:guidance': 'tier:2',
  'source-type:regulator-statement': 'tier:2',
  'source-type:press-release': 'tier:2',
  'source-type:report': 'tier:2',
  'source-type:research': 'tier:3',
  'source-type:commentary': 'tier:4',
  'source-type:journalism': 'tier:4',
};

/**
 * @returns {{tier: string|null, method: string}}
 *   tier null means neither the authority nor the document type
 *   settles it. That is an answer, and the caller must record it as
 *   an open question rather than choosing something plausible.
 */
export function estimateTier({ authority_class, source_type }) {
  if (source_type && TIER_BY_TYPE[source_type]) {
    return {
      tier: TIER_BY_TYPE[source_type],
      method: `Document type "${source_type}" is named in the tier definition in data/taxonomy.json.`,
    };
  }
  if (authority_class && TIER_BY_AUTHORITY[authority_class]) {
    return {
      tier: TIER_BY_AUTHORITY[authority_class],
      method: `The issuing authority is named in the tier definition in data/taxonomy.json, and the tier does not depend on the document type for this authority.`,
    };
  }
  if (authority_class === 'authority:commission') {
    return {
      tier: null,
      method: 'The Commission spans two tiers — decisions and legislative documents are tier 1, everything else tier 2 — and the document type is not established.',
    };
  }
  if (authority_class === SECONDARY_AUTHORITY) {
    return {
      tier: null,
      method: 'A secondary source is tier 3 or tier 4 depending on whether it is research or commentary, and the document type is not established.',
    };
  }
  return { tier: null, method: 'Neither the issuing authority nor the document type is established.' };
}

export { AUTHORITY_CLASSES, SECONDARY_AUTHORITY };
