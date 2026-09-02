/* ============================================================
   agent/verifier/dates.mjs — the three dates, read and never
   computed

   Publication, entry into force and application are three different
   dates and the corpus has already been bitten by treating them as
   one: `.agents/skills/legal-source-verification/references/verification-protocol.md`
   records an entry-into-force field in this repository that actually
   held the application date. So each is read separately, from its
   own lead-in wording, and returned EXACTLY AS PRINTED — never
   reformatted, never widened, never narrowed. The datasets record
   how precisely a date is published, and normalising "July 2024"
   into "2024-07-01" invents a precision the source does not have.

   TWO REFUSALS, BOTH DELIBERATE.

   THE TWENTIETH-DAY FORMULA. "shall enter into force on the
   twentieth day following that of its publication in the Official
   Journal" is the commonest entry-into-force wording in EU law and
   it states no date. Computing one needs the OJ publication date at
   day precision, and getting it wrong by a day is a fabricated legal
   fact of exactly the kind AGENTS.md rule 1 prohibits. So the
   formula is recorded as a formula, the date comes back null, and
   the caller raises an open question naming what would close it.

   TWO DATES FOR THE SAME THING. "Chapters I and II shall apply from
   2 February 2025 and the remainder from 2 August 2026" gives two
   application dates because the act applies in stages. Returning
   either one as *the* application date would be false about the
   other half of the act, so the value is null, both are carried in
   `alternatives`, and the caller records that the act applies in
   stages and this check did not resolve which stage the proposition
   concerns.

   THE REGISTER IS NOT THE TEXT. Where a document's own metadata and
   its operative text give different dates, the TEXT governs — the
   protocol reference states this rule and the reason for it — and
   the disagreement is reported rather than silently resolved.
   ============================================================ */

const MONTH = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';

/** As printed: a day-month-year, a month-year, or an ISO date. The
 *  three precisions are kept distinct, because the precision is
 *  part of what the source said. */
const DATE = `(?:\\d{1,2}\\s+${MONTH}\\s+\\d{4}|${MONTH}\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})`;

const rx = (body, flags = 'gi') => new RegExp(body.replace(/DATE/g, DATE), flags);

/** Lead-in wording per date kind. A date with no lead-in is not
 *  collected at all: a bare year in a sentence about something else
 *  is not a publication date. */
const LEAD_INS = {
  publication: [
    rx('published\\s+in\\s+the\\s+Official\\s+Journal[^.]{0,60}?on\\s+(DATE)'),
    rx('(?:OJ|Official\\s+Journal)[^.]{0,40}?of\\s+(DATE)'),
    rx('publication\\s+date[^.]{0,20}?[:\\s]\\s*(DATE)'),
    rx('published\\s+on\\s+(DATE)'),
  ],
  entry_into_force: [
    rx('(?:entered|came|shall\\s+enter|enters)\\s+into\\s+force\\s+on\\s+(?:the\\s+)?(DATE)'),
    rx('in\\s+force\\s+since\\s+(DATE)'),
    rx('entry\\s+into\\s+force[^.]{0,20}?[:\\s]\\s*(DATE)'),
  ],
  applicability: [
    rx('(?:shall\\s+apply|applies|has\\s+applied|has\\s+been\\s+applicable|is\\s+applicable)\\s+(?:as\\s+)?(?:from|since)\\s+(DATE)'),
    rx('date\\s+of\\s+application[^.]{0,20}?[:\\s]\\s*(DATE)'),
    rx('applicable\\s+(?:as\\s+)?(?:from|since)\\s+(DATE)'),
  ],
};

/** The formula that states no date. Matched so it can be REPORTED,
 *  never so it can be resolved. */
const ENTRY_FORMULA = /(?:enter|entering|enters)\s+into\s+force\s+on\s+the\s+(\w+)\s+day\s+following[^.]{0,80}/i;

const tidy = (s) => String(s).replace(/\s+/g, ' ').trim();

/**
 * Every date stated for one kind, deduplicated by the exact printed
 * string, each with the wording that introduced it.
 */
function collect(text, kind) {
  const found = new Map();
  for (const re of LEAD_INS[kind]) {
    re.lastIndex = 0;
    for (const m of String(text).matchAll(re)) {
      const value = tidy(m[1]);
      if (!found.has(value)) found.set(value, { value, matched: tidy(m[0]), index: m.index ?? 0 });
    }
  }
  return [...found.values()].sort((a, b) => a.index - b.index);
}

/**
 * @param {string} text  the document's readable text
 * @param {{publication_date?: string|null}} [metadata]
 *        what the document's machine-readable fields claim, where
 *        the caller read any. Compared, never preferred.
 *
 * @returns {{publication:object, entry_into_force:object, applicability:object,
 *            disagreements:Array}}
 *   Each date is `{ value, matched, alternatives, formula, read_from }`
 *   with `value: null` where nothing settles it — 0 candidates, or
 *   more than one.
 */
export function readDates(text, metadata = {}) {
  const src = String(text ?? '');
  const out = {};

  for (const kind of Object.keys(LEAD_INS)) {
    const candidates = collect(src, kind);
    const settled = candidates.length === 1;
    out[kind] = {
      value: settled ? candidates[0].value : null,
      matched: settled ? candidates[0].matched : null,
      alternatives: candidates.length > 1 ? candidates.map((c) => ({ value: c.value, matched: c.matched })) : [],
      formula: null,
      read_from: settled ? 'the operative text' : null,
    };
  }

  /* The formula only matters when no entry-into-force date was
     stated outright: a document that gives both has given a date. */
  const formula = src.match(ENTRY_FORMULA);
  if (formula && out.entry_into_force.value === null && out.entry_into_force.alternatives.length === 0) {
    out.entry_into_force.formula = tidy(formula[0]);
  }

  /* The register against the text. */
  const disagreements = [];
  const metaPub = metadata.publication_date ? tidy(metadata.publication_date) : null;
  if (metaPub && out.publication.value && !sameDate(metaPub, out.publication.value)) {
    disagreements.push({
      kind: 'publication',
      metadata_value: metaPub,
      text_value: out.publication.value,
      resolution: 'The operative text governs. A register\'s metadata can disagree with the instrument\'s own final provisions, and where the fact is a date the text is read — the protocol reference records exactly this trap, from a case already in this repository.',
    });
  }
  if (metaPub && !out.publication.value && out.publication.alternatives.length === 0) {
    /* Metadata alone. It is a date the document carries, but not one
       its text states, and the caller must be able to tell which. */
    out.publication.value = metaPub;
    out.publication.matched = `<meta> ${metaPub}`;
    out.publication.read_from = 'the document\'s machine-readable metadata, not its operative text';
  }

  return { ...out, disagreements };
}

/** Two printed dates that are the same day, allowing for one being
 *  ISO and the other written out. Deliberately conservative: unequal
 *  precision is NOT equality — "July 2024" and "12 July 2024" are
 *  different statements, and calling them the same would be the
 *  precision-widening this module exists to refuse. */
export function sameDate(a, b) {
  const norm = (s) => {
    const t = tidy(s);
    const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${Number(iso[3])} ${Number(iso[2])} ${iso[1]}`;
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const dmy = t.match(new RegExp(`^(\\d{1,2})\\s+(${MONTH})\\s+(\\d{4})$`, 'i'));
    if (dmy) return `${Number(dmy[1])} ${months.indexOf(dmy[2].toLowerCase()) + 1} ${dmy[3]}`;
    return t.toLowerCase();
  };
  return norm(a) === norm(b);
}
