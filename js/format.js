/* ============================================================
   Formatting. Chicago-style citations (notes–bibliography), dates,
   and the claim-type vocabulary shared by every view.
   Nothing here invents information: a field that is absent is
   omitted from the citation rather than guessed at.
   ============================================================ */

/* ---------------------------------------------------------- claim types */

/** Five types, grouped into three visual families. Interpretation, critique
 *  and forecast share the "argument" family and must never be rendered in
 *  the same way as binding law. */
/* A private-use codepoint standing in for the URL while the surrounding text
   is escaped, so the link can be re-inserted unescaped afterwards. It was a
   literal NUL, which made this file register as binary to ordinary tooling
   and is the kind of byte a proxy or an editor may silently drop. */
const SENTINEL = '\uE000';

export const CLAIM_FAMILY = {
  law: 'law',
  fact: 'fact',
  interpretation: 'argument',
  critique: 'argument',
  forecast: 'argument',
};

export const CLAIM_GLOSS = {
  law: 'What the legal instrument provides.',
  fact: 'What the evidence shows.',
  interpretation: 'A reading of what the law or the evidence means. The author’s, not the legislator’s.',
  critique: 'An argument the author is making. Not a statement of law or of fact.',
  forecast: 'A statement about what may happen. Not yet a fact.',
};

export const typeOf = (claim) => String(claim?.type || '').split(':').pop() || 'fact';
export const familyOf = (claim) => CLAIM_FAMILY[typeOf(claim)] || 'fact';

/* ---------------------------------------------------------- dates */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Format an ISO-ish date honestly at whatever precision was published.
 *  "2026-11" renders as "November 2026", never as "1 November 2026". */
export function humanDate(iso, precision) {
  if (!iso) return null;
  const p = String(precision || '').split(':').pop();
  const m = String(iso).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return String(iso);
  const [, y, mo, d] = m;
  if (p === 'year' || !mo) return y;
  if (p === 'month' || !d) return MONTHS[+mo - 1] + ' ' + y;
  if (p === 'quarter') return 'Q' + (Math.floor((+mo - 1) / 3) + 1) + ' ' + y;
  return +d + ' ' + MONTHS[+mo - 1] + ' ' + y;
}

/** Chicago prefers "December 5, 2025" in citations. */
export function citeDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return String(iso);
  const [, y, mo, d] = m;
  if (!mo) return y;
  if (!d) return MONTHS[+mo - 1] + ' ' + y;
  return MONTHS[+mo - 1] + ' ' + +d + ', ' + y;
}

export const isPast = (iso) => !!iso && String(iso).slice(0, 10) < new Date().toISOString().slice(0, 10);

/* ---------------------------------------------------------- citations */

const LEGISLATION = new Set(['source-type:regulation']);
const JUDGMENT = new Set(['source-type:judgment', 'source-type:court-press-release']);

function publisherName(src, ix) {
  if (src.publisher_name) return src.publisher_name;
  if (src.publisher && ix && ix.institution.has(src.publisher)) {
    return ix.institution.get(src.publisher).full_name || ix.institution.get(src.publisher).short_name;
  }
  return null;
}

/**
 * Chicago-style citation.
 *   form 'note'         → "European Commission, “Title,” December 5, 2025, https://…"
 *   form 'bibliography' → "European Commission. “Title.” December 5, 2025. https://…"
 * Legislation and judgments take their conventional forms instead.
 * Returns a plain-text string; `citeHTML` produces the linked version.
 */
export function cite(src, ix, form = 'note') {
  if (!src) return '';
  const sep = form === 'bibliography' ? '. ' : ', ';
  const pub = publisherName(src, ix);
  const date = citeDate(src.published);
  const parts = [];

  if (LEGISLATION.has(src.type)) {
    // "Regulation (EU) 2016/679 (General Data Protection Regulation). Official
    //  Journal of the European Union, May 4, 2016. https://…"
    parts.push(src.title);
    if (pub && pub !== 'EUR-Lex') parts.push(pub);
    else if (pub === 'EUR-Lex') parts.push('EUR-Lex');
    if (date) parts.push(date);
  } else if (JUDGMENT.has(src.type)) {
    // "Court of Justice of the European Union. Judgment in Case C-413/23 P,
    //  EDPS v SRB. September 4, 2025. https://…"
    if (pub) parts.push(pub);
    parts.push(src.title);
    if (date) parts.push(date);
  } else {
    if (pub) parts.push(pub);
    parts.push(form === 'bibliography' ? '“' + src.title + '.”' : '“' + src.title + ',”');
    if (date) parts.push(date);
  }

  let out = parts.filter(Boolean).join(sep);
  if (!LEGISLATION.has(src.type) && !JUDGMENT.has(src.type)) {
    // the quoted title already carries its own terminal punctuation
    out = parts.filter(Boolean).reduce((acc, p, i) => {
      if (i === 0) return p;
      const prev = parts[i - 1];
      const glue = /[.,”]$/.test(prev) ? ' ' : sep;
      return acc + glue + p;
    }, '');
  }
  if (src.url) out += (form === 'bibliography' ? '. ' : ', ') + src.url;
  else out += form === 'bibliography' ? '. No public URL located.' : ', no public URL located';
  if (form === 'bibliography' && !/[.]$/.test(out)) out += '.';
  return out;
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The same citation with the URL as a real link and the title in italics. */
export function citeHTML(src, ix, form = 'note') {
  if (!src) return '';
  const text = cite(src, ix, form);
  if (src.url) {
    const safe = esc(src.url);
    return esc(text.replace(src.url, SENTINEL)).replace(SENTINEL,
      '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + safe + '</a>');
  }
  return esc(text).replace('no public URL located', '<span class="evi-nourl">no public URL located</span>');
}

/** Surname-ish key for alphabetising a bibliography. */
export function sortKey(src, ix) {
  const pub = publisherName(src, ix) || src.title || '';
  return pub.replace(/^(The|A|An)\s+/i, '').toLowerCase();
}

/* ---------------------------------------------------------- misc labels */

export const SUPPORTS_WORD = {
  'supports:direct': 'states this',
  'supports:partial': 'supports in part',
  'supports:context': 'context only',
};

export const SUPPORTS_GLOSS = {
  'supports:direct': 'The source states the proposition.',
  'supports:partial': 'The source establishes part of the proposition, a narrower case, or the components from which it is computed.',
  'supports:context': 'Informs the claim without establishing it. This is not a citation.',
};

/* Money. One definition, shared by the enforcement observatory and the search
   index, so a figure cannot be rounded two different ways on two pages.
   Returns null for null — an absent amount is not zero. */
export const eur = (n) => n == null ? null :
  (n >= 1e9 ? 'EUR ' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'bn'
    : n >= 1e6 ? 'EUR ' + (n / 1e6).toFixed(0) + 'm'
      : 'EUR ' + n.toLocaleString('en'));

export const TIER_WORD = {
  'tier:1': 'Tier 1 · primary law',
  'tier:2': 'Tier 2 · regulator',
  'tier:3': 'Tier 3 · research',
  'tier:4': 'Tier 4 · press / advocacy',
};

/* The brief's own placeholder provenance sits in tier 4 for sorting, but it is
   neither press nor advocacy, and labelling it that way tells the reader the
   opposite of what it is. A note that points back at the document making the
   claim is self-reference, and says so. */
const SELF_SOURCE = 'src-brief-original';
export function tierWord(src) {
  if (!src) return '';
  if (src.id === SELF_SOURCE) return 'Unverified · the brief itself';
  return TIER_WORD[src.tier] || src.tier;
}

/** True when a claim has no external source that states or part-states it. */
export function isUnverified(claim) {
  if (!claim) return true;
  if (!claim.last_verified) return true;
  return !(claim.sources || []).some(
    (s) => (s.supports === 'supports:direct' || s.supports === 'supports:partial')
      && s.source_id !== 'src-brief-original'
  );
}

/* ============================================================
   EVIDENCE GRADE

   "Requires verification" was one flag doing five jobs. 122 records
   carried it, which told a reader that something was unsettled but not
   what kind of unsettled — and lumped an authorial argument, which can
   never be "verified" at all, together with a figure whose source
   simply has not been located yet. Those are different states and a
   research-facing product has to keep them apart.

   Five grades, derived rather than stored, so they cannot drift from
   the sources and the claim type they are computed from:

     primary        the claim is carried by primary law or a court
     official       carried by a regulator or an EU institution
     secondary      carried only by research, press or advocacy
     interpretation the author's reading or argument — not a finding,
                    and not something a citation could settle
     unresolved     no directly supporting source, or the only one is
                    the brief itself

   Order matters. Claim type is decided first: an argument stays an
   argument however well sourced it is, because the sourcing supports
   the premises and not the conclusion. Only claims of law and of fact
   are then graded by what actually carries them.
   ============================================================ */

const SELF_SOURCE_ID = 'src-brief-original';

export const GRADE = {
  primary: {
    id: 'primary', label: 'Primary law',
    gloss: 'Carried by the legal text itself or by a court.',
  },
  official: {
    id: 'official', label: 'Official source',
    gloss: 'Carried by a regulator or an EU institution.',
  },
  secondary: {
    id: 'secondary', label: 'Secondary only',
    gloss: 'Carried only by research, press or advocacy. Not independently confirmed against a primary or official source.',
  },
  interpretation: {
    id: 'interpretation', label: 'Interpretation',
    gloss: 'The author’s reading or argument. Sources may support the premises; they cannot settle the conclusion.',
  },
  unresolved: {
    id: 'unresolved', label: 'Unresolved',
    gloss: 'No directly supporting source has been located, or the only one is this brief. Treat as unverified.',
  },
};

/* tier order, best first — the grade takes the strongest direct source */
const TIER_GRADE = { 'tier:1': 'primary', 'tier:2': 'official', 'tier:3': 'secondary', 'tier:4': 'secondary' };

/**
 * Grade one claim. `ix` supplies ix.source for the tier lookup.
 * Pure: same claim and same index give the same grade.
 */
export function evidenceGrade(claim, ix) {
  const fam = familyOf(claim);
  if (fam === 'argument') return GRADE.interpretation;

  const direct = (claim?.sources || []).filter((s) => s.supports === 'supports:direct');
  if (!direct.length) return GRADE.unresolved;

  const external = direct.filter((s) => s.source_id !== SELF_SOURCE_ID);
  if (!external.length) return GRADE.unresolved;

  let best = 'secondary';
  for (const s of external) {
    const src = ix && ix.source ? ix.source.get(s.source_id) : null;
    const g = TIER_GRADE[src && src.tier] || 'secondary';
    if (g === 'primary') { best = 'primary'; break; }
    if (g === 'official') best = 'official';
  }
  return GRADE[best];
}

/** Counts by grade across a set of claims — used by the bibliography. */
export function gradeTally(claims, ix) {
  const t = {};
  for (const k of Object.keys(GRADE)) t[k] = 0;
  for (const c of claims || []) t[evidenceGrade(c, ix).id]++;
  return t;
}
