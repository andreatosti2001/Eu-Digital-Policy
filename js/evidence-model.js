/* ============================================================
   The evidence model — one home for how a claim's support is read.

   The site has always kept two things apart: what KIND of statement a
   claim is (its type) and what its sources can carry (the `supports`
   qualifier on each reference). This module makes a third distinction
   explicit and gives every reader of the data — the brief, the
   bibliography, tools/evidence-audit.mjs — the same answer:

     CLAIM TYPE        what kind of proposition it is
                       law · fact · derived · attributed      owe verification
                       interpretation · critique · forecast   do not
     EVIDENCE STATUS   what the recorded sources establish
                       direct · partial · derived · context-only
                       · unverified · disputed
     REMEDIATION       why a claim is not yet as strong as it could be

   So "unverified" (nobody has found the source) is never confused with
   "not the kind of proposition a source could settle" (an argument).

   EVERYTHING HERE IS DERIVED AND NOTHING IS STORED. Evidence status,
   freshness state and the mechanical remediation codes are computed
   from the records at the moment they are read, exactly as the evidence
   grade in js/format.js always has been, so they cannot drift from the
   evidence they describe (docs/DATA-GOVERNANCE.md, derivation over
   storage). tools/evidence-audit.mjs refuses a dataset that stores one.

   PURE MODULE: no DOM, no fetch, no clock unless one is passed in, and
   no eval — the derivation formulas are read by a small arithmetic
   parser below, because a Content-Security-Policy without
   'unsafe-eval' is part of the site's security boundary.
   ============================================================ */

export const SELF_SOURCE_ID = 'src-brief-original';

/* ---------------------------------------------------------- claim kinds */

/**
 * Every claim type, the visual family it renders in, and whether a
 * claim of that type OWES external verification.
 *
 * An argument does not owe verification: sources can support its
 * premises, never settle its conclusion. That is not a weaker state
 * than "verified" — it is a different kind of statement.
 */
export const CLAIM_KINDS = Object.freeze({
  law:            Object.freeze({ family: 'law',        owesVerification: true }),
  fact:           Object.freeze({ family: 'fact',       owesVerification: true }),
  derived:        Object.freeze({ family: 'derived',    owesVerification: true }),
  attributed:     Object.freeze({ family: 'attributed', owesVerification: true }),
  interpretation: Object.freeze({ family: 'argument',   owesVerification: false }),
  critique:       Object.freeze({ family: 'argument',   owesVerification: false }),
  forecast:       Object.freeze({ family: 'argument',   owesVerification: false }),
});

export const claimKind = (claim) => String(claim?.type || '').split(':').pop() || 'fact';
export const kindInfo = (claim) => CLAIM_KINDS[claimKind(claim)] || CLAIM_KINDS.fact;
export const owesVerification = (claim) => kindInfo(claim).owesVerification;

/* ---------------------------------------------------------- lookups */

/* Accepts the browser's index (Maps under ix.source / ix.claim) or plain
   objects keyed by id, so the validators need not rebuild js/data.js. */
const getter = (m) => (m == null ? () => null
  : typeof m.get === 'function' ? (id) => m.get(id) || null
  : (id) => m[id] || null);

export function lookup(ix) {
  return { source: getter(ix && ix.source), claim: getter(ix && ix.claim) };
}

/* ---------------------------------------------------------- evidence status */

const externalRefs = (claim) =>
  (claim?.sources || []).filter((s) => s && s.source_id !== SELF_SOURCE_ID);

/**
 * The evidence status of one claim, as a taxonomy id under `evidence:`.
 *
 *   disputed      the claim records a disagreement between sources
 *   derived       the claim is computed by this site from other claims
 *   direct        an external source states it
 *   partial       external sources establish part of it
 *   context-only  external sources only inform it
 *   unverified    nothing external — the brief alone
 *
 * Order matters: a recorded dispute is the most important thing a reader
 * can be told, and a derivation is judged by its inputs rather than by a
 * source that states the result.
 */
export function evidenceStatus(claim) {
  if (!claim) return 'evidence:unverified';
  if (claim.contested) return 'evidence:disputed';
  if (claimKind(claim) === 'derived') return 'evidence:derived';
  const ext = externalRefs(claim);
  if (ext.some((s) => s.supports === 'supports:direct')) return 'evidence:direct';
  if (ext.some((s) => s.supports === 'supports:partial')) return 'evidence:partial';
  if (ext.some((s) => s.supports === 'supports:context')) return 'evidence:context-only';
  return 'evidence:unverified';
}

export const EVIDENCE_WORD = Object.freeze({
  'evidence:direct': 'Direct',
  'evidence:partial': 'Partial',
  'evidence:derived': 'Derived',
  'evidence:context-only': 'Context only',
  'evidence:unverified': 'Unverified',
  'evidence:disputed': 'Disputed',
});

/* ---------------------------------------------------------- locators */

/* A locator is what lets somebody else reach the evidence without
   reading the whole document. Four grades:

     structural   an article, recital, annex, paragraph, page, section,
                  table, case number or decision identifier
     descriptive  a specific passage named in words — a figure, a
                  heading, a quoted phrase — findable by searching
     generic      points at a whole part of the brief, or at nothing
     none         absent                                              */
const GENERIC_LOCATOR = /^(?:part\s+[ivxl]+(?:\s*(?:,|and|&)\s*part\s+[ivxl]+)*|passim|throughout|whole document|general|n\/a|-)$/i;
const STRUCTURAL_LOCATOR = /(?:^|[^a-z])(?:arts?\.|articles?\b|recitals?\b|annex(?:es)?\b|chapters?\b|sections?\b|sec\.|§|paras?\.|paragraphs?\b|points?\b|principles?\s+\d|pp?\.\s*\d|pages?\b|tables?\b|figures?\b|fig\.|footnotes?\b|case\b|joined cases|decision\b|no\.?\s*\d|[CT]-\d+\/\d+|AT\.\d+|DMA\.\d+|IP\/\d|C\/\d{4}\/|COM\(\d{4}\)|SWD\(\d{4}\)|ST\s\d+\/\d{4}|OJ\s[LC]\b|ECLI:|CELEX)/i;

export function locatorQuality(locator) {
  const s = String(locator == null ? '' : locator).trim();
  if (!s) return 'none';
  if (GENERIC_LOCATOR.test(s)) return 'generic';
  if (STRUCTURAL_LOCATOR.test(s)) return 'structural';
  return s.length >= 8 ? 'descriptive' : 'generic';
}

/* ---------------------------------------------------------- composite claims */

/* A heuristic, never a verdict. It exists to put the likely cases in
   front of a person, and it is never used to block anything: whether
   "A and B" is one proposition or two is an editorial judgement. */
const FIGURE = /(?:€|EUR|USD|\$)\s?\d[\d.,]*\s*(?:bn|billion|m\b|million)?|\b\d[\d.,]*\s*(?:%|per ?cent|bn\b|billion|million)|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+) of (?:the )?(?:ten|twenty-seven|\d+)\b/gi;

export function compositeSignals(statement) {
  const s = String(statement || '');
  const signals = [];
  const figures = (s.match(FIGURE) || []).length;
  if (figures >= 3) signals.push(`${figures} distinct figures`);
  if (s.length > 320) signals.push(`${s.length} characters`);
  const clauses = (s.match(/;|—|–(?=\s)/g) || []).length;
  if (clauses >= 2) signals.push(`${clauses} clause breaks`);
  const joins = (s.match(/,\s+(?:and|but|while|whereas)\s+/g) || []).length;
  if (joins >= 2) signals.push(`${joins} coordinated clauses`);
  /* three or more figures is enough on its own: each figure is a separate
     thing a source has to state. Otherwise two signals are needed. */
  const flagged = figures >= 3 || signals.length >= 2;
  return { flagged, signals };
}

/* ---------------------------------------------------------- derivations */

/* A tiny arithmetic reader: numbers, single-letter-or-word variables,
   + - * / and parentheses. No eval, no Function, nothing else. */
function evaluate(expr, vars) {
  const toks = String(expr).match(/\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?(?:e[+-]?\d+)?|[-+*/()])\s*/g);
  if (!toks || toks.join('').replace(/\s+/g, '') !== String(expr).replace(/\s+/g, '')) {
    throw new Error(`formula "${expr}" contains something other than numbers, variables and + - * / ( )`);
  }
  const t = toks.map((x) => x.trim());
  let i = 0;
  const peek = () => t[i];
  const take = () => t[i++];
  function primary() {
    const x = take();
    if (x === '(') { const v = sum(); if (take() !== ')') throw new Error('unbalanced parentheses'); return v; }
    if (x === '-') return -primary();
    if (/^\d/.test(x)) return Number(x);
    if (/^[A-Za-z_]/.test(x)) {
      if (!(x in vars)) throw new Error(`formula uses "${x}", which is not an input`);
      return vars[x];
    }
    throw new Error(`unexpected "${x}" in formula`);
  }
  function product() {
    let v = primary();
    while (peek() === '*' || peek() === '/') { const op = take(); const r = primary(); v = op === '*' ? v * r : v / r; }
    return v;
  }
  function sum() {
    let v = product();
    while (peek() === '+' || peek() === '-') { const op = take(); const r = product(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  const v = sum();
  if (i !== t.length) throw new Error(`unexpected "${t[i]}" in formula`);
  return v;
}

const MULT = { billion: 1e9, bn: 1e9, million: 1e6, m: 1e6, thousand: 1e3, k: 1e3 };

const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** "twenty-three" → 23, "nineteen" → 19, "four" → 4; anything else → null.
 *  The brief writes small counts as words, and a derivation's input has to
 *  read back out of the prose it mirrors. Whole numbers below 100 only. */
function numberWord(text) {
  const w = String(text || '').trim().toLowerCase();
  const u = UNITS.indexOf(w);
  if (u >= 0) return u;
  const m = w.match(/^([a-z]+)(?:[- ]([a-z]+))?$/);
  if (!m) return null;
  const t = TENS.indexOf(m[1]);
  if (t < 2) return null;
  if (!m[2]) return t * 10;
  const r = UNITS.indexOf(m[2]);
  return r >= 1 && r <= 9 ? t * 10 + r : null;
}

/** Read "EUR 4.04 billion", "€20m", "7.1bn", "57%" — or a count written as
 *  a word, "twenty-three" — into a number. */
export function parseQuantity(text) {
  const m = String(text || '').replace(/,(?=\d{3}\b)/g, '').match(/(\d+(?:\.\d+)?)\s*(billion|bn|million|m\b|thousand|k\b|%)?/i);
  if (!m) return numberWord(text);
  const n = Number(m[1]);
  const u = (m[2] || '').toLowerCase();
  if (u === '%') return n / 100;
  return n * (MULT[u] || 1);
}

/**
 * Check a claim's derivation block. Returns { ok, computed, problems[] }.
 *
 * The block records the arithmetic so it can be re-run by anyone:
 *   performed_by  'site' (this site computed it) or 'source' (a source
 *                 computed it and the site re-checked it). The two are
 *                 epistemically different, and a derived-type claim must
 *                 be 'site': if a source states the number, the claim is
 *                 a fact with that source, not a derivation.
 *   inputs        { name: { claim, value, as_stated } } — each value must
 *                 read back out of the input claim's own statement, so the
 *                 figure keeps one home in the prose of that claim.
 *   formula       arithmetic over the input names
 *   result        the unrounded result, to the precision given
 *   rounding      { to, stated_value } — what the prose says, and the
 *                 step it was rounded to
 */
export function checkDerivation(claim, ix) {
  const problems = [];
  const d = claim && claim.derivation;
  const kind = claimKind(claim);
  if (!d) {
    if (kind === 'derived') problems.push('a derived claim with no derivation block');
    return { ok: problems.length === 0, computed: null, problems };
  }
  const L = lookup(ix);
  if (d.performed_by !== 'site' && d.performed_by !== 'source') problems.push('performed_by must be "site" or "source"');
  if (kind === 'derived' && d.performed_by !== 'site') problems.push('a derived-type claim must record performed_by "site": if a source states the figure, the claim is a fact supported by that source');
  if (!d.method) problems.push('no method stated');
  const vars = {};
  const inputs = d.inputs && typeof d.inputs === 'object' ? Object.entries(d.inputs) : [];
  if (!inputs.length) problems.push('no inputs');
  for (const [name, inp] of inputs) {
    const c = L.claim(inp && inp.claim);
    if (!c) { problems.push(`input ${name} → ${inp && inp.claim}: no such claim`); continue; }
    if (!kindInfo(c).owesVerification) problems.push(`input ${name} → ${c.id} is an argument (${claimKind(c)}); a derivation can only rest on claims of law, fact or attribution`);
    if (typeof inp.value !== 'number' || !Number.isFinite(inp.value)) { problems.push(`input ${name}: value is not a number`); continue; }
    if (!inp.as_stated || !String(c.statement).includes(inp.as_stated)) {
      problems.push(`input ${name}: "${inp.as_stated}" does not appear in ${c.id}'s statement — the structured value must read back out of the prose it mirrors`);
    } else {
      const q = parseQuantity(inp.as_stated);
      if (q == null || Math.abs(q - inp.value) > Math.abs(inp.value) * 1e-9) problems.push(`input ${name}: value ${inp.value} does not match "${inp.as_stated}" (${q})`);
    }
    vars[name] = inp.value;
  }
  let computed = null;
  try { computed = evaluate(d.formula, vars); } catch (e) { problems.push(e.message); }
  if (computed != null && typeof d.result === 'number') {
    const decimals = (String(d.result).split('.')[1] || '').length;
    const tol = 0.5 * Math.pow(10, -decimals) + 1e-12;
    if (Math.abs(computed - d.result) > tol) problems.push(`the formula gives ${computed}, the recorded result is ${d.result}`);
  } else if (computed != null) problems.push('no numeric result recorded');
  const r = d.rounding;
  if (!r || typeof r.to !== 'number' || typeof r.stated_value !== 'number') problems.push('no rounding block ({ to, stated_value })');
  else if (computed != null) {
    const rounded = Math.round(computed / r.to) * r.to;
    if (Math.abs(rounded - r.stated_value) > r.to * 1e-6) problems.push(`rounded to ${r.to}, the result is ${rounded}, and the prose states ${r.stated_value}`);
  }
  return { ok: problems.length === 0, computed, problems };
}

/* ---------------------------------------------------------- freshness risk */

/** Review interval per risk class, in days. The one home for these numbers. */
export const RISK_TTL_DAYS = Object.freeze({
  'risk:critical': 14,
  'risk:high': 30,
  'risk:medium': 90,
  'risk:low': 365,
});

const DAY = 86400000;
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

/**
 * The risk class of one record. `kind` is the dataset: 'claim',
 * 'enforcement', 'event' or 'instrument'. `asOf` is an ISO date and is
 * required: this module never reads the clock itself (AUDIT F-15).
 */
export function riskClass(kind, rec, { asOf, enforcementById } = {}) {
  if (kind === 'enforcement') {
    const a = rec.action_status;
    const ap = rec.appeal && rec.appeal.status;
    if (a === 'action:announced' || ap === 'appeal:pending') return 'risk:critical';
    if (ap === 'appeal:unknown' || rec.payment_status === 'payment:unknown' || a === 'action:appealed') return 'risk:high';
    return 'risk:medium';
  }
  if (kind === 'event') {
    const d = days(asOf, rec.date);
    if (rec.status === 'scheduled' || d >= 0) return d <= 60 ? 'risk:critical' : 'risk:high';
    return -d <= 365 ? 'risk:medium' : 'risk:low';
  }
  if (kind === 'instrument') {
    const s = rec.legislative_status || '';
    if (/proposal|position|trilogue|agreement|partly|transposition|stalled/.test(s)) return 'risk:high';
    return 'risk:medium';
  }
  /* claims */
  if (!owesVerification(rec)) return 'risk:low';
  const get = getter(enforcementById);
  const linked = (rec.enforcement || []).map(get).filter(Boolean);
  if (linked.some((e) => riskClass('enforcement', e) === 'risk:critical')) return 'risk:high';
  return 'risk:medium';
}

/** fresh · aging · review-due · stale, from the record's own verification date. */
export function freshnessState(lastVerified, risk, asOf) {
  if (!lastVerified) return 'freshness:stale';
  const ttl = RISK_TTL_DAYS[risk] || RISK_TTL_DAYS['risk:medium'];
  const age = days(lastVerified, asOf);
  if (age <= ttl / 2) return 'freshness:fresh';
  if (age <= ttl) return 'freshness:aging';
  if (age <= ttl * 2) return 'freshness:review-due';
  return 'freshness:stale';
}

/* ---------------------------------------------------------- remediation */

const TIER_RANK = { 'tier:1': 1, 'tier:2': 2, 'tier:3': 3, 'tier:4': 4 };

/**
 * The remediation codes that can be computed from the record, plus any a
 * person has recorded in the claim's own `remediation` field. Mechanical
 * codes are never stored: storing one would let it outlive the gap.
 */
export function remediationCodes(claim, ix, { asOf, enforcementById } = {}) {
  const L = lookup(ix);
  const codes = new Set();
  const kind = claimKind(claim);
  const owes = owesVerification(claim);
  const ext = externalRefs(claim).map((r) => ({ ref: r, src: L.source(r.source_id) })).filter((x) => x.src);
  const carrying = ext.filter((x) => x.ref.supports === 'supports:direct' || x.ref.supports === 'supports:partial');

  if (owes && kind !== 'derived') {
    if (!carrying.length) codes.add('remediation:self-source-only');
    else {
      const best = Math.min(...carrying.map((x) => TIER_RANK[x.src.tier] || 4));
      if (best >= 3) codes.add('remediation:secondary-source-only');
      const directPrimary = carrying.some((x) => x.ref.supports === 'supports:direct'
        && (kind === 'law' ? x.src.tier === 'tier:1' : (TIER_RANK[x.src.tier] || 4) <= 2));
      /* an attributed view's primary source is the actor's own text, of
         whatever tier, so the tier test does not apply to it */
      if (!directPrimary && kind !== 'attributed') codes.add('remediation:missing-primary-source');
      if (kind === 'law' && carrying.some((x) => x.src.reproduces)
        && !carrying.some((x) => x.src.tier === 'tier:1' && !x.src.reproduces && x.ref.supports === 'supports:direct')) {
        codes.add('remediation:secondary-reproduction-only');
      }
    }
    for (const x of ext) {
      if (x.ref.supports !== 'supports:direct') continue;
      const q = locatorQuality(x.ref.locator);
      if (q === 'none' || q === 'generic') { codes.add('remediation:missing-locator'); break; }
    }
  }
  if (kind === 'derived' || claim.derivation) {
    if (!checkDerivation(claim, ix).ok) codes.add('remediation:derivation-undocumented');
  }
  if (compositeSignals(claim.statement).flagged) codes.add('remediation:possibly-composite');
  if (claim.reference_gap) codes.add('remediation:reference-gap');
  if (claim.contested) codes.add('remediation:contested');
  if (asOf) {
    const st = freshnessState(claim.last_verified, riskClass('claim', claim, { asOf, enforcementById }), asOf);
    if (st === 'freshness:review-due' || st === 'freshness:stale') codes.add('remediation:outdated');
  }
  for (const c of claim.remediation || []) codes.add(c);
  return [...codes];
}

const arrOf = (x) => (Array.isArray(x) ? x : []);

/**
 * The open backlog: every record that says it has not been established.
 * One home for the rule — tools/validate.mjs prints this list and the
 * Evidence page counts it, so the number a reader sees on the site and
 * the number CI reports are the same computation (moved here from
 * validate.mjs on 27 Sep 2026). A derived claim counts as externally
 * supported only when its derivation re-runs AND every input has an
 * external direct source, so a derivation can never launder a weak input.
 */
export function openBacklog(db) {
  const rows = [];
  const push = (kind, id, note) => rows.push({ kind, id, note: (note || '').replace(/\s+/g, ' ').slice(0, 150) });

  const claimById = new Map(arrOf(db.claims?.claims).map((c) => [c.id, c]));
  const hasExternalDirect = (c) => !!c && arrOf(c.sources).some((s) => s.supports === 'supports:direct' && s.source_id !== 'src-brief-original');
  for (const c of arrOf(db.claims?.claims)) {
    /* A derived claim carries no source of its own: it is carried by its
       inputs and its arithmetic. It counts as externally supported only
       when the derivation re-runs AND every input has an external direct
       source — so a derivation can never launder a weak input. */
    const strongest = claimKind(c) === 'derived'
      ? checkDerivation(c, { claim: claimById }).ok
        && Object.values(c.derivation.inputs).every((i) => hasExternalDirect(claimById.get(i.claim)))
      : hasExternalDirect(c);
    if (!c.last_verified) push('claim (unverified)', c.id, c.verification_note);
    else if (!strongest) push('claim (no external direct source)', c.id, c.verification_note);
  }
  for (const e of arrOf(db.timeline?.events)) if (e.requires_verification) push('timeline', e.id, e.verification_note);
  for (const x of arrOf(db.enforcement?.enforcement)) if (x.requires_verification) push('enforcement', x.id, x.verification_note);
  for (const i of arrOf(db.instruments?.instruments)) {
    if (!i.last_verified) push('instrument (never verified)', i.id, i.status_note);
    if (i.transposition?.requires_verification) push('transposition', i.id, i.transposition.state_note);
  }
  for (const r of arrOf(db.instruments?.relationships)) if (r.requires_verification) push('relationship', r.id, r.verification_note);
  for (const g of arrOf(db.glossary?.terms)) if (g.requires_verification) push('glossary', g.id, g.verification_note);
  for (const s of arrOf(db.sources?.sources)) if (s.url_status === 'url:none') push('source (no URL)', s.id, s.note);
  for (const r of arrOf(db.applicability?.rules)) if (r.requires_verification) push('applicability rule', r.id, r.verification_note);
  for (const i of arrOf(db.instruments?.instruments))
    for (const p of arrOf(i.provisions)) if (p.requires_verification) push('provision', p.id, p.verification_note);
  for (const x of arrOf(db.institutions?.institutions))
    for (const c of arrOf(x.competences))
      if ((c.note || '').startsWith('requires verification')) push('competence', `${x.id} → ${c.instrument} (${c.role})`, c.note);

  return rows;
}
