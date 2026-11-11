/* ============================================================
   tools/fine-basis.mjs — what establishes an enforcement record's amount

   P0.3, 11 Nov 2026 (docs/DATA-READINESS.md F-A3, §7 item 3). Before this,
   an enforcement record's `sources` were bare ids and its `claims` were
   linked for every purpose at once — context, argument, the amount — so
   which source states `fine_eur`, and where, was not recorded anywhere a
   check could read. A claim linked to the record did not show the amount:
   on 11 Nov 2026 five of the thirteen fined records had no FACT claim that
   states it (two linked only a derived share, one two interpretations, one
   a fact that does not state it, one a claim of law).

   WHY A FIELD, AND NOT THE EXISTING MODEL. The existing model can say that
   a claim is about a record (`claims[].enforcement`) and where a source
   supports the claim's whole proposition (`claims[].sources[].locator`). It
   cannot say WHICH of a record's claims carries the amount, nor where the
   amount itself is stated: a claim's locator quotes the passage for the
   claim's proposition, which for clm-temu-fine is the ground of the breach,
   not the €200 million. The only way to recover the link from the existing
   fields was a string search in claim statements — PV2-01's F-A3, which
   that document itself calls a limit. So one field, on the record, with
   the field's own provenance and nothing else:

     "fine_eur_basis": {
       "evidence": [ {
         "claim":     a claim of type claim-type:fact that states the amount,
                      linked both ways (record.claims ∋ it, it.enforcement ∋ record)
         "source":    a tier-1 or tier-2 source in the record's or the claim's
                      sources: an authority, a court or an official text — a
                      secondary source is not presented as primary
         "locator":   where in that source the amount is stated, quoting the
                      passage verbatim — the trace of having read it
         "as_stated": the amount exactly as the passage writes it; it must
                      occur in the locator and parse to fine_eur, in euros
         "read_on":   the day the passage was read (YYYY-MM-DD)
       } ],
       "gap": null
     }
   or, where no retrieved source has been read to state the amount:
     "fine_eur_basis": { "evidence": [], "gap": "<why it is not established>" }

   SEMANTICS AND CARDINALITY. Present exactly when fine_eur is not null; a
   record with no fine carries none (a basis for a fine that does not exist
   is refused). `evidence` 0..n; exactly one of "≥ 1 evidence" and "a gap" holds.
   A gap is not an error: it is the record saying its amount is NOT
   ADEQUATELY DOCUMENTED, and every figure that sums the amount names it
   (tools/metric-contract.mjs, MC-11). An absent basis IS an error.

   WHAT THIS CANNOT CHECK. That the locator is truthful — that the passage is
   in the source as quoted. That is a person's reading, attested by
   `read_on`; a regex cannot read a PDF. It checks only what is
   deterministic: the references resolve, the types are the right ones, the
   quoted amount is in the quote and equals the record's.

   No URL, title or publisher is repeated here: those have one home,
   data/sources.json. Nothing here is a second home for the amount either:
   `as_stated` is a quotation, checked against fine_eur, never read as one.
   ============================================================ */

export const BASIS_FIELD = 'fine_eur_basis';
export const FACT_TYPE = 'claim-type:fact';
export const ADMISSIBLE_TIERS = Object.freeze(['tier:1', 'tier:2']);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/* ---------------------------------------------------------- amounts */

const MULTIPLIERS = [
  [/^(?:billions?|bn|miliardi|miliardo|milliards?|miljard)\b/i, 1e9],
  [/^(?:millions?|mln|milioni|milione|miljoen|m)\b/i, 1e6],
];
const CURRENCY_BEFORE = /(?:€|\bEUR)\s?$/i;
const CURRENCY_AFTER = /^\s?(?:€|EUR\b|euros?\b|di euro\b|d['’]euros?\b|d['’]euro\b)/i;

/** The number a run of digits and separators writes, given whether a
 *  multiplier word follows (then a separator may be a decimal point:
 *  "1.2 billion", "2,95 milliards"; otherwise separators group thousands:
 *  "824,990,000", "746.000.000"). null when the run is ambiguous. */
function readNumber(raw, scaled) {
  const s = raw.replace(/[\s  ]/g, '');
  if (/^\d+$/.test(s)) return Number(s);
  const grouped = /^\d{1,3}([.,'])\d{3}(?:\1\d{3})*$/;
  if (!scaled && grouped.test(s)) return Number(s.replace(/[.,']/g, ''));
  if (scaled) {
    const m = /^(\d+)[.,](\d+)$/.exec(s);
    if (m) return Number(`${m[1]}.${m[2]}`);
    if (grouped.test(s)) return Number(s.replace(/[.,']/g, ''));
  }
  return null;
}

/**
 * Every amount in euros a text writes in figures, with what it was read
 * from. A currency marker is required, before or after; a number with no
 * currency is not an amount. Spelled-out numbers ("quindici milioni") are
 * not read: the passage must also carry the figure, or the check fails
 * closed.
 * @returns {{value:number, text:string}[]}
 */
export function amountsIn(text) {
  const out = [];
  const t = String(text ?? '');
  const re = /\d[\d.,'\s  ]*\d|\d/g;
  let m;
  while ((m = re.exec(t))) {
    let raw = m[0].replace(/[\s  .,']+$/, '');
    const start = m.index;
    let end = start + raw.length;
    let rest = t.slice(end);
    let scale = 1;
    const sp = /^[\s  ]*/.exec(rest)[0];
    for (const [w, f] of MULTIPLIERS) {
      const hit = w.exec(rest.slice(sp.length));
      if (hit) { scale = f; end += sp.length + hit[0].length; rest = t.slice(end); break; }
    }
    const before = CURRENCY_BEFORE.test(t.slice(Math.max(0, start - 5), start));
    const after = CURRENCY_AFTER.test(rest);
    if (!before && !after) continue;
    const n = readNumber(raw, scale !== 1);
    if (n === null) continue;
    const value = Math.round(n * scale);
    const afterText = after ? CURRENCY_AFTER.exec(rest)[0] : '';
    out.push({ value, text: (before ? t.slice(Math.max(0, start - 4), start).replace(/^.*?(€|EUR)/i, '$1') : '') + t.slice(start, end) + afterText });
  }
  return out;
}

/** The euro value `as_stated` writes, or null when it writes none or more than one. */
export function parseAmount(asStated) {
  const found = amountsIn(asStated);
  const values = [...new Set(found.map((f) => f.value))];
  return values.length === 1 ? values[0] : null;
}

/* ---------------------------------------------------------- the check */

/**
 * @param {object} rec        an enforcement record
 * @param {{claims: Map<string,object>, sources: Map<string,object>}} ix
 * @returns {{state:'none'|'established'|'gap'|'absent'|'invalid', problems:string[], evidence:object[], gap:string|null}}
 *   none         no fine, no basis (nothing to establish)
 *   established  every evidence entry checks
 *   gap          the record declares its amount not adequately documented
 *   absent       a fine with no basis at all — an error
 *   invalid      a basis that does not check — an error, with the reasons
 */
export function checkFineBasis(rec, ix) {
  const problems = [];
  const has = Object.prototype.hasOwnProperty.call(rec, BASIS_FIELD) && rec[BASIS_FIELD] !== null;
  const basis = rec[BASIS_FIELD];
  if (rec.fine_eur === null || rec.fine_eur === undefined) {
    if (has) return { state: 'invalid', problems: ['carries fine_eur_basis but no fine_eur: a basis for an amount the record does not state'], evidence: [], gap: null };
    return { state: 'none', problems: [], evidence: [], gap: null };
  }
  if (!has) return { state: 'absent', problems: [`fine_eur ${rec.fine_eur} has no fine_eur_basis: nothing on the record says which claim and which source state the amount, or that none has been read`], evidence: [], gap: null };
  if (typeof basis !== 'object' || Array.isArray(basis)) return { state: 'invalid', problems: ['fine_eur_basis is not an object {evidence, gap}'], evidence: [], gap: null };

  const evidence = Array.isArray(basis.evidence) ? basis.evidence : null;
  const gap = typeof basis.gap === 'string' && basis.gap.trim().length >= 20 ? basis.gap.trim() : null;
  if (evidence === null) problems.push('fine_eur_basis.evidence is not an array');
  if (basis.gap !== null && basis.gap !== undefined && gap === null) problems.push('fine_eur_basis.gap must be null or a sentence (at least 20 characters) saying why the amount is not established');
  const n = evidence?.length ?? 0;
  if (n && gap) problems.push('fine_eur_basis has both evidence and a gap: the amount is either established or it is not');
  if (!n && !gap && evidence !== null) problems.push('fine_eur_basis has neither evidence nor a gap');

  const recClaims = new Set(rec.claims ?? []);
  const recSources = new Set(rec.sources ?? []);
  (evidence ?? []).forEach((e, i) => {
    const at = `fine_eur_basis.evidence[${i}]`;
    if (!e || typeof e !== 'object') { problems.push(`${at} is not an object`); return; }
    /* the claim */
    const c = typeof e.claim === 'string' ? ix.claims.get(e.claim) : null;
    if (!c) problems.push(`${at}.claim "${e.claim}" is not a claim in data/claims.json`);
    else {
      if (c.type !== FACT_TYPE) {
        const kind = String(c.type ?? 'untyped').split(':').pop();
        const why = kind === 'derived' ? 'a derived claim is computed from other values and cannot be the direct proof of an amount'
          : ['interpretation', 'critique', 'forecast'].includes(kind) ? 'an argument is not a statement of fact'
            : kind === 'law' ? 'a claim of law states what an instrument provides, not what an authority imposed'
              : kind === 'attributed' ? 'an attributed view reports what someone says, not what was imposed' : 'only claim-type:fact is admissible';
        problems.push(`${at}.claim ${e.claim} is ${c.type}: ${why}`);
      }
      if (!recClaims.has(e.claim)) problems.push(`${at}.claim ${e.claim} is not among the record's claims`);
      if (!(c.enforcement ?? []).includes(rec.id)) problems.push(`${at}.claim ${e.claim} does not name ${rec.id} in its enforcement list`);
      if (!amountsIn(c.statement).some((a) => a.value === rec.fine_eur)) problems.push(`${at}.claim ${e.claim} does not state the amount ${rec.fine_eur} EUR in its statement`);
    }
    /* the source */
    const s = typeof e.source === 'string' ? ix.sources.get(e.source) : null;
    if (!s) problems.push(`${at}.source "${e.source}" is not a source in data/sources.json`);
    else {
      if (!recSources.has(e.source) && !(c?.sources ?? []).some((x) => x.source_id === e.source)) problems.push(`${at}.source ${e.source} is in neither the record's nor the claim's sources`);
      if (!ADMISSIBLE_TIERS.includes(s.tier)) problems.push(`${at}.source ${e.source} is ${s.tier}: a secondary source is not the proof of an amount an authority or a court states`);
    }
    /* the passage */
    const loc = typeof e.locator === 'string' ? e.locator.trim() : '';
    if (!loc) problems.push(`${at}.locator is missing or empty: where in the source the amount is stated is the trace of having read it`);
    else if (loc.length < 15 || !/[A-Za-z]/.test(loc)) problems.push(`${at}.locator "${loc}" is malformed: it must name the place and quote the passage`);
    const as = typeof e.as_stated === 'string' ? e.as_stated.trim() : '';
    if (!as) problems.push(`${at}.as_stated is missing`);
    else {
      const v = parseAmount(as);
      if (v === null) problems.push(`${at}.as_stated "${as}" does not write one amount in euros`);
      else if (v !== rec.fine_eur) problems.push(`${at}.as_stated "${as}" is ${v} EUR, not fine_eur ${rec.fine_eur}`);
      if (loc && !loc.includes(as)) problems.push(`${at}.as_stated "${as}" does not occur in the locator's quotation`);
    }
    if (typeof e.read_on !== 'string' || !ISO_DAY.test(e.read_on)) problems.push(`${at}.read_on "${e.read_on ?? ''}" is not a day (YYYY-MM-DD): nothing attests that the passage was read`);
    for (const k of Object.keys(e)) if (!['claim', 'source', 'locator', 'as_stated', 'read_on'].includes(k)) problems.push(`${at} carries "${k}", which is not part of the basis (a URL, title or publisher has its home in data/sources.json)`);
  });
  for (const k of Object.keys(basis)) if (!['evidence', 'gap'].includes(k)) problems.push(`fine_eur_basis carries "${k}"`);

  if (problems.length) return { state: 'invalid', problems, evidence: evidence ?? [], gap };
  return { state: n ? 'established' : 'gap', problems: [], evidence, gap };
}

/** Index helper: Maps by id, from the parsed datasets. */
export const basisIndex = ({ claims, sources }) => ({
  claims: new Map((claims?.claims ?? []).map((c) => [c.id, c])),
  sources: new Map((sources?.sources ?? []).map((s) => [s.id, s])),
});
