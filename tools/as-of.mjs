/* ============================================================
   tools/as-of.mjs — the one reading of a command line's date

   A DATE THE TOOL CANNOT READ IS REFUSED, NOT REINTERPRETED.

   Until 27 Oct 2026 the two tools that audit "as of" a date each read
   it their own way, and each failed silently in a different direction
   (docs/AUDIT-2026-10-24.md §3.1; docs/ROADMAP-v2.md item 0.3, D-10):

     · `node tools/freshness.mjs --as-of 2026-10-24` took the string
       `--as-of` as the date. Every age comparison was against an
       invalid date, and the report ended "Nothing past its stated
       interval" — 0 prompts, exit 0 — where the real date gives 2.
       A false all-clear.
     · `node tools/evidence-audit.mjs --as-of banana` audited as of
       "banana": every record stale, three errors, exit 1. A false
       alarm. And `node tools/evidence-audit.mjs 2026-10-24` ignored
       the date altogether and audited as of today.

   Both now go through `readArgs()` below, and both exit 2 — neither
   0 (nothing wrong) nor 1 (something in the tree is wrong) — with the
   reason, on any date that does not parse and on any argument they do
   not read. Exit 2 is a statement about the COMMAND, which a person
   fixes by retyping it; it says nothing about the tree.

   A DATE PARSES when it is written YYYY-MM-DD and names a day the
   calendar has: 2026-02-30 is refused, not rolled into March. That is
   the same shape every `last_verified` and `as_of` in `data/` uses.
   ============================================================ */

/** Exit code for a command line the tool cannot read. */
export const EXIT_UNREADABLE = 2;

/** Today, in UTC — the default every report has always used. */
export const today = () => new Date().toISOString().slice(0, 10);

/**
 * Why `s` is not a date this repository reads, or null if it is one.
 * @param {unknown} s
 * @returns {string|null}
 */
export function dateProblem(s) {
  if (typeof s !== 'string' || !s.length) return 'no date was given';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `"${s}" is not written YYYY-MM-DD`;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) {
    return `"${s}" is written YYYY-MM-DD but names no day the calendar has`;
  }
  return null;
}

/**
 * Read a tool's command line. Returns either `{ asOf, flags, values }`
 * or `{ error }`; it never guesses.
 *
 * @param {string[]} argv            process.argv.slice(2)
 * @param {{ positionalDate?: boolean, flags?: string[], valued?: string[] }} spec
 *        positionalDate — a bare first argument is the date (freshness.mjs's
 *        historical form, kept for compatibility); flags — boolean switches the
 *        tool reads; valued — options that take a value, besides `--as-of`.
 */
export function readArgs(argv, { positionalDate = false, flags = [], valued = [] } = {}) {
  const out = { asOf: null, flags: new Set(), values: {} };
  let positional = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--as-of' || a.startsWith('--as-of=')) {
      const v = a === '--as-of' ? argv[++i] : a.slice('--as-of='.length);
      if (out.asOf !== null) return { error: '--as-of is given twice. Give the date once.' };
      if (v === undefined) return { error: '--as-of is the last argument and has no date after it.' };
      out.asOf = v;
    } else if (valued.includes(a)) {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value after it.` };
      out.values[a] = v;
    } else if (flags.includes(a)) {
      out.flags.add(a);
    } else if (positionalDate && !a.startsWith('-') && positional === null) {
      positional = a;
    } else {
      const accepted = ['--as-of YYYY-MM-DD', ...valued.map((v) => `${v} <value>`), ...flags];
      if (positionalDate) accepted.unshift('YYYY-MM-DD');
      return { error: `"${a}" is not an argument this tool reads. It accepts: ${accepted.join(', ')}.` };
    }
  }
  if (positional !== null && out.asOf !== null) {
    return { error: `the date is given twice, as "${positional}" and as --as-of ${out.asOf}. Give it once.` };
  }
  if (positional !== null) out.asOf = positional;
  if (out.asOf === null) out.asOf = today();
  const problem = dateProblem(out.asOf);
  if (problem) return { error: `${problem}. The date is the day the report is "as of", written YYYY-MM-DD (for example 2026-10-24).` };
  return out;
}

/** The refusal, as every tool here prints it: stderr, then exit 2. */
export function refusalText(tool, error) {
  return `${tool}: refused — ${error}\nNothing was audited. Exit ${EXIT_UNREADABLE} reports a command line this tool cannot read; it says nothing about the tree.`;
}
