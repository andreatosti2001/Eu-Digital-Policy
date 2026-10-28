/* ============================================================
   Formatting. Chicago-style citations (notes–bibliography), dates,
   and the claim-type vocabulary shared by every view.
   Nothing here invents information: a field that is absent is
   omitted from the citation rather than guessed at.
   ============================================================ */

import { CLAIM_KINDS, checkDerivation, evidenceStatus, EVIDENCE_WORD } from './evidence-model.js';
export { evidenceStatus, EVIDENCE_WORD, checkDerivation };

/* ---------------------------------------------------------- claim types */

/* A private-use codepoint standing in for the URL while the surrounding text
   is escaped, so the link can be re-inserted unescaped afterwards. It was a
   literal NUL, which made this file register as binary to ordinary tooling
   and is the kind of byte a proxy or an editor may silently drop. */
const SENTINEL = '\uE000';

/** Seven types in five visual families. Interpretation, critique and
 *  forecast share the "argument" family and must never be rendered in the
 *  same way as binding law. A derived figure and an attributed view each
 *  have a family of their own, because "the site computed this" and "an
 *  actor says this" are neither a sourced fact nor the author's argument.
 *  The table lives in js/evidence-model.js, which the validators read too. */
export const CLAIM_FAMILY = Object.fromEntries(
  Object.entries(CLAIM_KINDS).map(([k, v]) => [k, v.family]));

export const CLAIM_GLOSS = {
  law: 'What the legal instrument provides.',
  fact: 'What the evidence shows.',
  derived: 'A figure this site computed from other sourced claims. The inputs, the formula and the rounding are shown, so the arithmetic can be checked.',
  attributed: 'What a named actor states or argues. Reported, not adopted: the source shows the view was held, not that it is right.',
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

/**
 * Apply computed geometry that markup cannot carry. The CSP has no
 * 'unsafe-inline' for styles, so a style="…" attribute written into an
 * innerHTML string is refused by the browser. A module that needs a
 * width or a flex share computed at run time writes it as data-w /
 * data-flex instead, and calls this on the container after inserting
 * the markup: setting a property through the CSSOM is not an inline
 * style attribute and the policy allows it.
 */
export function applyGeometry(root) {
  if (!root) return;
  for (const el of root.querySelectorAll('[data-w]')) el.style.width = el.dataset.w;
  for (const el of root.querySelectorAll('[data-flex]')) el.style.flex = el.dataset.flex;
}

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

/* ---------------------------------------------------------- reader text

   The notes in data/ are where provenance lives: which audit item re-read a
   status, which commit moved a date, which claim carries a figure. They are
   written for the people who maintain the records, and until v2 Session 10
   they were printed to readers as they stand, so a status note told a reader
   about "audit item 9" and "commit 282a782".

   readerText() is the one place that turns such a note into what a reader
   sees (docs/ROADMAP-v2.md §8, item 10.2). The data is not changed: the
   reference stays in the record, where the checks and the maintainers need
   it, and stops being printed as editorial text. What it does:
     - a docs/ or code path, a commit, a workflow code (audit item 9, audit
       T-29, item 2.4, v2 Session 5, B.3, D-7, finding F-2) is dropped, with
       the parenthesis or phrase that only carried it;
     - a taxonomy id becomes its label, and a field name words;
     - a claim id becomes a reference the reader can follow (its footnote in
       the brief, or the claim on its instrument's page), or is dropped where
       the same parenthesis already carries a legal citation;
     - a source or enforcement id becomes a link to that record.
   A record's own id shown AS its id (the evidence panel's "Claim ID", the
   enforcement page's record line) is not a note and does not come here.

   opts: html (default true) — return escaped HTML with links; false returns
   plain text. href(path) — how a page builds a site link. claimRef(id) —
   the claim's footnote number where the page has them (the brief), or null.
   tools/selftest.mjs W18 runs every note field in data/ through this and
   fails on any reference left. */

const PH_OPEN = '\uE001', PH_CLOSE = '\uE002', CUT = '\uE003';
const RT = {
  doc: /\bdocs\/[A-Za-z0-9_./-]+\.md(?:\s*§\s*[\d.]+[a-z]?(?:\s+[A-Z](?![\w]))?)?/g,
  code: /\b(?:audits?\s+)?(?:items?\s+\d+\.\d+|T-\d{1,2}(?:\s*,\s*T-\d{1,2})*)\b(?!\/)|\baudits?\s+items?\s+\d+(?:\s*(?:,|and)\s*\d+)*\b|\bv2 Session \d+(?:\.\d+)?\b|\bB\.3\b|\b[DF]-\d{1,2}\b(?!\/)/g,
  hash: /\bcommit [0-9a-f]{7,40}\b/g,
  file: /\b(?:data\/)?[a-z]+\.json\b|\b(?:js|tools|css|agent)\/[A-Za-z0-9_\/.-]+\.(?:m?js|css)\b(?:\s+(?:[a-z]+[A-Z][A-Za-z0-9]*|[A-Z][A-Z0-9_]{2,})(?:\(\))?(?=[\s).,;:]))?/g,
  id: /\b(?:clm|src|enf|rel|tl)-[a-z0-9]+(?:-[a-z0-9]+)+\b/g,
};
const STOP = new Set(['see', 'the', 'a', 'and', 'record', 'records', 'finding', 'findings', 'audit', 'audits',
  'item', 'items', 'evidence', 'for', 'of', 'on', 'in', 'its', 'session', 'commit']);
const CITATION = /\bArts?\.\s*\d|\bST \d|\bRegulation\b|\bDirective\b|\bOJ\b|\bC\/\d{4}\/|\bIP\/\d|\bCELEX\b|\bCOM\(\d/;
const FILE_WORDS = {
  'tools/evidence-audit.mjs': "the site's evidence audit",
  'tools/validate.mjs': "the site's data validator",
  'tools/freshness.mjs': "the site's freshness check",
  'js/regulatory-model.js': "the site's date model",
  'js/evidence-model.js': "the site's evidence model",
};
const FIELD_WORDS = {
  last_verified: 'the verification date', legislative_status: 'the legislative status',
  status_as_of: 'the status date', action_status: 'the action status', amended_by: 'amended by',
  obligation_on: 'the actors bound', proposes_to_amend: 'the acts it would amend',
  requires_verification: 'the verification flag', verification_note: 'this note', status_note: 'the status note',
  url_status: 'the URL status', brief_part: 'the part of the brief', legal_basis: 'the legal basis',
  reference_gap: 'the reference gap', enforcement_mechanism: 'the enforcement mechanism',
  behavioural_outcome: 'the behavioural outcome',
};
const FIELD_RE = new RegExp('\\b(?:' + Object.keys(FIELD_WORDS).join('|') + ')\\b', 'g');

function fileWords(m) {
  const path = m.split(/\s+/)[0];
  if (FILE_WORDS[path]) return FILE_WORDS[path];
  const json = path.match(/([a-z]+)\.json$/);
  if (json) return 'the ' + json[1] + ' dataset';
  return "the site's code";
}

/** True when a parenthesis part held nothing but references and filler. */
function onlyRefs(part) {
  let rest = part;
  let refs = 0;
  for (const re of [RT.doc, RT.code, RT.hash, RT.file, RT.id]) {
    rest = rest.replace(re, () => { refs++; return ' '; });
  }
  if (!refs) return false;
  return rest.split(/[\s,;:'’]+/).filter(Boolean).every((w) => STOP.has(w.toLowerCase()));
}

/** Split a parenthesis body at its top-level ";" and "," — not inside a nested one. */
function splitTop(body) {
  const parts = [];
  let depth = 0, cur = '';
  for (let k = 0; k < body.length; k++) {
    const ch = body[k];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    /* a separator is followed by a space: "7,159,322" is one number */
    if (depth === 0 && (ch === ';' || ch === ',') && /\s/.test(body[k + 1] || '')) {
      parts.push({ text: cur, sep: ch }); cur = ''; continue;
    }
    cur += ch;
  }
  parts.push({ text: cur, sep: '' });
  return parts;
}

/** Each top-level parenthesis: drop the parts that only carried a reference. */
function cleanParens(text) {
  let out = '', i = 0;
  while (i < text.length) {
    if (text[i] !== '(') { out += text[i++]; continue; }
    let depth = 0, j = i;
    for (; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')' && --depth === 0) break;
    }
    if (j >= text.length) { out += text.slice(i); break; }
    const body = text.slice(i + 1, j);
    const parts = splitTop(body);
    const cited = CITATION.test(body);
    const keep = parts.filter((p) => {
      /* a claim id is the evidence: it goes only where the same parenthesis
         already gives the reader a legal citation to check */
      if (/^\s*clm-[a-z0-9-]+\s*$/.test(p.text)) return !cited;
      return !onlyRefs(p.text);
    });
    if (keep.length) {
      out += '(' + keep.map((p, k) => p.text.trim() + (k < keep.length - 1 ? (p.sep || ',') + ' ' : '')).join('') + ')';
    } else {
      out = out.replace(/\s+$/, '');
    }
    i = j + 1;
  }
  return out;
}

export function readerText(text, ix, opts = {}) {
  if (text == null || text === '') return text == null ? '' : '';
  const html = opts.html !== false;
  const href = opts.href || ((p) => p);
  const links = [];
  const link = (label, url) => {
    links.push({ label, url });
    return PH_OPEN + (links.length - 1) + PH_CLOSE;
  };

  let t = String(text);

  /* phrases that exist only to carry a workflow code */
  t = t.replace(/,?\s+for B\.3\b/g, '');
  t = t.replace(/,?\s+for items? \d+\.\d+/g, '');
  t = t.replace(/,?\s*see\s+docs\/[A-Za-z0-9_./-]+\.md(?:\s*§\s*[\d.]+)?(?:,\s*finding [DF]-\d+)?/g, '');

  t = cleanParens(t);

  /* what is left in running text. A removal leaves CUT behind, and only
     the punctuation next to a CUT is tidied: a note that quotes a query or
     an ellipsis keeps its own spacing */
  t = t.replace(RT.doc, CUT).replace(RT.hash, CUT).replace(/\bv2 Session \d+\b/g, CUT);
  t = t.replace(/\(?(?:the )?(?:audits?\s+)?(?:T-\d{1,2}(?:\s*,\s*T-\d{1,2})*)\s+records?\)?/g, CUT);
  t = t.replace(/\b(?:audits?\s+items?\s+\d+(?:\s*(?:,|and)\s*\d+)*|audits?\s+T-\d{1,2}(?:\s*,\s*T-\d{1,2})*)\b/g, 'an audit');
  t = t.replace(/\bfinding [DF]-\d{1,2}\b/g, 'a finding');
  t = t.replace(RT.file, (m) => fileWords(m));

  t = t.replace(/\bthe former ((?:src|enf|clm|rel|tl)-[a-z0-9-]+)/g, (m, id) => {
    const live = (id.startsWith('src-') && ix?.source?.has(id)) || (id.startsWith('clm-') && ix?.claim?.has(id));
    return live ? m : 'a former record';
  });

  t = t.replace(RT.id, (id, at, all) => {
    if (id.startsWith('clm-')) {
      const n = opts.claimRef ? opts.claimRef(id) : null;
      if (n != null) return link('claim ' + n, { claim: id, n });
      const alone = all[at - 1] === '(' && all[at + id.length] === ')';
      const label = alone ? 'see the claim' : 'a separate claim';
      const c = ix?.claim?.get(id);
      const home = c && (c.instruments || []).find((i) => ix.instrument?.has(i));
      if (home && opts.instrumentHref) return link(label, opts.instrumentHref(home) + '#' + id);
      return label;
    }
    if (id.startsWith('src-')) {
      const s = ix?.source?.get(id);
      if (!s) return 'a former record';
      const year = String(s.published || '').slice(0, 4);
      return link((s.publisher_name || s.title || 'a source') + (year ? ', ' + year : ''), href('bibliography.html') + '#' + id);
    }
    if (id.startsWith('enf-')) return link('the enforcement record', href('enforcement.html') + '#' + id);
    if (id.startsWith('tl-')) return 'the dated event';
    return 'the interaction record';
  });

  /* taxonomy ids, and the field names a note mentions */
  t = t.replace(/\b[a-z][a-z-]*:[a-z0-9][a-z0-9-]*\b/g, (m) => {
    const term = ix?.taxonomy?.get(m);
    return term ? '‘' + term.label + '’' : m;
  });
  t = t.replace(/`([a-z0-9_-]+)`/g, '$1');
  t = t.replace(FIELD_RE, (m, at, all) => {
    let w = FIELD_WORDS[m];
    const before = all.slice(0, at).trimEnd();
    /* "no legal_basis link" is "no legal basis link", not "no the legal basis link" */
    if (/\b(?:no|a|an|the|its|this|that|each|every|any)$/i.test(before)) w = w.replace(/^the /, '');
    return before === '' || /[.!?]$/.test(before) ? w[0].toUpperCase() + w.slice(1) : w;
  });

  t = t.replace(new RegExp('\\(\\s*' + CUT + '+\\s*\\)', 'g'), CUT)
    .replace(new RegExp('[ \\t]*' + CUT + '+[ \\t]*(?=[.,;:)])', 'g'), '')
    .replace(new RegExp('[ \\t]*' + CUT + '+[ \\t]*', 'g'), ' ')
    .replace(/^\s+|\s+$/g, '');

  if (!html) return t.replace(new RegExp(PH_OPEN + '(\\d+)' + PH_CLOSE, 'g'), (m, k) => links[k].label);
  return esc(t).replace(new RegExp(PH_OPEN + '(\\d+)' + PH_CLOSE, 'g'), (m, k) => {
    const l = links[k];
    if (l.url && typeof l.url === 'object') {
      return 'claim <button type="button" class="fn fn-ref" data-claim-ref="' + esc(l.url.claim) +
        '" aria-label="Open claim ' + esc(l.url.n) + '">' + esc(l.url.n) + '</button>';
    }
    return '<a href="' + esc(l.url) + '">' + esc(l.label) + '</a>';
  });
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
/** "1 record", "2 records": a count and its noun. The one home for it
    (audit of 21 Oct 2026 item 15: "across 1 records"). */
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

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
/* A Commission proposal is a tier-1 legislative document (taxonomy
   source_tier), not law: its CELEX number, sector 5 type PC, says so, and
   the label follows it (v2 Session 9, docs/ROADMAP-v2.md §8). */
const PROPOSAL_CELEX = /celex[:/]5\d{4}PC\d{4}\b/i;
export function tierWord(src) {
  if (!src) return '';
  if (src.id === SELF_SOURCE) return 'Unverified · the brief itself';
  if (src.tier === 'tier:1' && PROPOSAL_CELEX.test(String(src.url || ''))) return 'Tier 1 · legislative proposal';
  return TIER_WORD[src.tier] || src.tier;
}

/** True when a claim has no external source that states or part-states it.
 *  A derived claim is judged by its derivation instead: it is verified when
 *  the arithmetic re-runs and every input is itself externally supported.
 *  Without the index that cannot be established, so the answer is "yes". */
export function isUnverified(claim, ix) {
  if (!claim) return true;
  if (!claim.last_verified) return true;
  if (typeOf(claim) === 'derived') {
    if (!ix || typeof ix !== 'object' || !ix.claim) return true;
    if (!checkDerivation(claim, ix).ok) return true;
    return Object.values(claim.derivation.inputs).some((inp) => isUnverified(ix.claim.get(inp.claim), ix));
  }
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
  derived: {
    id: 'derived', label: 'Derived by this site',
    gloss: 'Computed here from other claims, each with its own source. As strong as its weakest input and its arithmetic, both of which are shown.',
  },
  attributed: {
    id: 'attributed', label: 'Attributed view',
    gloss: 'The named actor’s position, checked against the actor’s own publication. Reported, not adopted.',
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
  if (fam === 'derived') {
    /* a derivation is only as good as its inputs: one unresolved input,
       or arithmetic that does not re-run, and the result is unresolved */
    if (!ix || !ix.claim || !checkDerivation(claim, ix).ok) return GRADE.unresolved;
    const inputs = Object.values(claim.derivation.inputs).map((i) => ix.claim.get(i.claim));
    return inputs.every((c) => c && evidenceGrade(c, ix).id !== 'unresolved') ? GRADE.derived : GRADE.unresolved;
  }

  const direct = (claim?.sources || []).filter((s) => s.supports === 'supports:direct');
  if (!direct.length) return GRADE.unresolved;

  const external = direct.filter((s) => s.source_id !== SELF_SOURCE_ID);
  if (!external.length) return GRADE.unresolved;
  /* the evidence for "X says Y" is X's own text, whatever its tier */
  if (fam === 'attributed') return GRADE.attributed;

  let best = 'secondary';
  for (const s of external) {
    const src = ix && ix.source ? ix.source.get(s.source_id) : null;
    const g = TIER_GRADE[src && src.tier] || 'secondary';
    if (g === 'primary') { best = 'primary'; break; }
    if (g === 'official') best = 'official';
  }
  return GRADE[best];
}

/** Strongest first. One order, so no two pages list the grades differently. */
export const GRADE_ORDER = ['primary', 'official', 'secondary', 'derived', 'attributed', 'interpretation', 'unresolved'];

/** Counts by grade across a set of claims — used by the bibliography. */
export function gradeTally(claims, ix) {
  const t = {};
  for (const k of Object.keys(GRADE)) t[k] = 0;
  for (const c of claims || []) t[evidenceGrade(c, ix).id]++;
  return t;
}
