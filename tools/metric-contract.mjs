/* ============================================================
   tools/metric-contract.mjs — the metric contract MC-1…MC-15, and the
   declarations held to it

   P0.2, 11 Nov 2026. The contract was written and approved in PV2-01
   (docs/DATA-READINESS.md §6, amended in §8) as a proposal; its home, once
   implemented, was to be a module under tools/ enforced by tools/validate.mjs,
   on the precedent of tools/source-contract.mjs (§8, "A.4 question 1"). This
   is that module. The rules below are §6's rules, not a reinterpretation;
   each check names the property it enforces, and a failing declaration is an
   ERROR whose figure is not publishable. "Not determinable" is not an error:
   it is one of a figure's states.

   WHAT IS DECLARED HERE. Two metrics: the enforcement fines card (§5) and,
   since the P1 checkpoint of 11 Nov 2026, the instruments card (§8.1, F-A7:
   js/regulatory-model.js instrumentsByStatus() is its one computing
   function and js/masthead.js imports it — docs/AUDIT-2026-11-11-P1.md §3).
   The deadlines and evidence cards (§8.2, §8.3) are not declared: neither
   has a computing function under this contract. tools/selftest.mjs declares
   a deadlines-shaped fixture to show MC-14 can express it.

   A COUNT is held to the same fifteen properties as a sum. MC-2 scans for a
   second COUNT by the partition field (countSites) and requires every
   consumer to import the function, for every formula — until 11 Nov 2026
   both halves ran only for a sum, so a count was held to neither.

   WHAT THE CHECKS CANNOT SEE is said per property in PROPERTIES[].cannot_see
   — §6's last column — and is not repeated in prose elsewhere.
   ============================================================ */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { basisIndex, checkFineBasis } from './fine-basis.mjs';
import { STATUS_ORDER } from '../js/regulatory-model.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..');

export const CATEGORIES = Object.freeze(['known', 'known_negative', 'not_applicable', 'unknown', 'not_researched']);
export const FORMULAS = Object.freeze(['sum', 'count', 'share']);

export const PROPERTIES = Object.freeze([
  { id: 'MC-1', name: 'Question', cannot_see: 'whether the question is worth asking' },
  { id: 'MC-2', name: 'One computing function', cannot_see: 'a second implementation that does not name the field (a generic sum helper over a mapped list; for a count, a group-by helper that takes the field as a string, or a count spread over two statements), or one the lexer misreads (a `/` taken for a division or a regex): a static scan can be wrong in both directions, which is why every consumer must also import the one function — for a count and a sum alike' },
  { id: 'MC-3', name: 'Inputs resolve', cannot_see: 'whether the filter selects the right population' },
  { id: 'MC-4', name: 'Value type', cannot_see: 'a well-formed wrong number (200 typed as 2,000)' },
  { id: 'MC-5', name: 'Every state mapped', cannot_see: 'whether a mapping is semantically right' },
  { id: 'MC-6', name: 'Unknown is never zero', cannot_see: 'a view that drops the count the function returned' },
  { id: 'MC-7', name: 'No escape by "not applicable"', cannot_see: 'a term used wrongly in a record beyond what contradictions() detects' },
  { id: 'MC-8', name: 'The partition is total', cannot_see: 'whether the parts are the meaningful ones' },
  { id: 'MC-9', name: '"As of" from the inputs', cannot_see: 'whether a recorded date is truthful' },
  { id: 'MC-10', name: 'Inputs past their interval are named', cannot_see: 'whether the intervals are right (js/evidence-model.js RISK_TTL_DAYS is their one home)' },
  { id: 'MC-11', name: 'Weak evidence counted beside', cannot_see: 'a passage quoted wrongly: tools/fine-basis.mjs checks that the quoted amount equals the record\'s, not that the source says it' },
  { id: 'MC-12', name: 'What it cannot say', cannot_see: 'whether the list is complete' },
  { id: 'MC-13', name: 'No composite score', cannot_see: 'a composite assembled in a view from two compliant figures' },
  { id: 'MC-14', name: 'Precision against the window', cannot_see: 'a precision recorded wrongly in the record' },
  { id: 'MC-15', name: 'The dataset\'s caveats travel with the figure', cannot_see: 'a caveat written somewhere other than the $note, or one the $note states without naming the field — and a field whose name is a plain word (sources, appeal) is recognised only when the $note quotes it as code' },
]);

/* ============================================================ the declaration */

export const FINES_CARD = Object.freeze({
  id: 'fines-announced-collected-unknown',
  question: 'Of the enforcement actions this site records, how much money has been announced in fines, what has become of those decisions, and how much is shown to have been collected?',
  population: { dataset: 'enforcement', collection: 'enforcement', risk_kind: 'enforcement', filter: { module: 'js/pipeline.js', export: 'actionsOnly' } },
  fields: ['fine_eur', 'action_status', 'appeal', 'judicial', 'payment_status', 'requires_verification', 'last_verified', 'claims', 'sources'],
  value: { field: 'fine_eur', type: 'integer', min: 0, unit: 'EUR' },
  formula: 'sum',
  compute: { module: 'js/pipeline.js', export: 'finesFigure' },
  consumers: ['js/masthead.js', 'js/instrument-view.js', 'js/enforcement-page.js'],
  states: [{ field: 'payment_status', vocabulary: 'payment', map: { module: 'js/pipeline.js', export: 'PAYMENT_STATES' } }],
  partition: { parts: ['annulled', 'appeal', 'final', 'standing'], by: { module: 'js/pipeline.js', export: 'posturePart' } },
  window: null,
  weak_evidence: { unverified_field: 'requires_verification', amount_basis: 'tools/fine-basis.mjs' },
  cannot_say: [
    'that any money reached a treasury',
    'what a court will decide on the decisions under appeal, or what an authority will decide on a remittal',
    'whether the standing decisions will become final',
    'anything about enforcement the site does not record: the records are a selection made by the brief\'s argument, not a census of EU enforcement',
    'that a decision is right',
    'that a larger sum means stronger enforcement',
    'a comparison over time or with trackers that count differently (records are added and re-verified, never snapshotted)',
  ],
  caveats: [
    { field: 'last_verified', quote: 'records re-read individually against their sources carry that date in their own last_verified' },
    { field: 'fine_eur', quote: 'fine_eur_basis (11 Nov 2026, P0.3) says which fact claim and which tier-1 or tier-2 source state fine_eur' },
    { field: 'fine_eur', quote: 'fine_eur is the amount the authority announced or imposed, and whether it was upheld, annulled or paid is action_status, appeal and payment_status' },
    { field: 'action_status', quote: 'fine_eur is the amount the authority announced or imposed, and whether it was upheld, annulled or paid is action_status, appeal and payment_status' },
    { field: 'appeal', quote: 'fine_eur is the amount the authority announced or imposed, and whether it was upheld, annulled or paid is action_status, appeal and payment_status' },
    { field: 'payment_status', quote: 'fine_eur is the amount the authority announced or imposed, and whether it was upheld, annulled or paid is action_status, appeal and payment_status' },
  ],
});

/** docs/DATA-READINESS.md §8.1, approved 9 Nov 2026 with the population of
 *  "instruments card question 2" (core and adjacent; the masthead follows). */
export const INSTRUMENTS_CARD = Object.freeze({
  id: 'instruments-by-legislative-status',
  question: 'Of the core and adjacent instruments this site records, how many stand at each legislative status?',
  population: { dataset: 'instruments', collection: 'instruments', risk_kind: 'instrument', filter: { module: 'js/regulatory-model.js', export: 'coveredInstruments' } },
  fields: ['scope_class', 'legislative_status', 'status_as_of', 'milestones', 'last_verified', 'short_name'],
  optional_fields: ['status_basis'],
  formula: 'count',
  compute: { module: 'js/regulatory-model.js', export: 'instrumentsByStatus' },
  consumers: ['js/masthead.js'],
  states: [{ field: 'legislative_status', vocabulary: 'status', map: { module: 'js/regulatory-model.js', export: 'STATUS_STATES' } }],
  partition: { parts: [...STATUS_ORDER], field: 'legislative_status', by: { module: 'js/regulatory-model.js', export: 'statusPart' } },
  as_of_field: 'status_as_of',
  window: null,
  weak_evidence: { rule: { module: 'js/regulatory-model.js', export: 'statusUnsupported' } },
  cannot_say: [
    'what applies on a given date: the status is one scalar, and the milestones decide what applies and when',
    'which tranche of a partly applicable instrument applies',
    'what a national transposition has done, Member State by Member State',
    'anything about the referenced and out-of-scope instruments, which are named as excluded and not counted',
    'that a status still holds after its status_as_of',
    'anything about EU digital law the site does not record: the instruments are those the brief maps, not a census of the acquis',
  ],
  caveats: [
    { field: 'legislative_status', quote: 'legislative_status is a scalar describing position in the legislative process' },
    { field: 'legislative_status', quote: 'It is deliberately NOT sufficient on its own: for staggered instruments the milestones array is authoritative about what actually applies and when' },
    { field: 'last_verified', quote: 'records re-read individually against their sources carry that date in their own last_verified' },
  ],
});

export const METRICS = Object.freeze([FINES_CARD, INSTRUMENTS_CARD]);

/* ============================================================ helpers */

/** Replace comments, string bodies, template text and regex literals with
 *  spaces, keeping line numbers and the code inside a template's `${…}`, so
 *  that a field named inside a string, a comment or a pattern is not code.
 *  A `/` opens a regex where an expression may start (after an operator, a
 *  bracket, a comma or a keyword), and divides otherwise — the usual
 *  heuristic, and a limit of MC-2 (PROPERTIES). */
export function codeOnly(src) {
  const n = src.length;
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  let out = '';
  let i = 0;
  const braces = []; /* for each open `${`, the brace depth at which it closes */
  let depth = 0;
  const regexAllowed = () => {
    const m = /(\S+)\s*$/.exec(out);
    if (!m) return true;
    const t = m[1];
    return /[(,=:[!&|?{};+\-*%<>~^]$/.test(t) || /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/.test(t);
  };
  const template = () => {
    /* at a backtick or at the closing brace of a ${…}: copy text until ` or ${ */
    let j = i;
    while (j < n && src[j] !== '`') {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '$' && src[j + 1] === '{') break;
      j++;
    }
    out += blank(src.slice(i, j));
    if (src[j] === '`') { out += '`'; i = j + 1; return; }
    out += '${'; i = j + 2; braces.push(++depth);
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; out += blank(src.slice(i, e)); i = e; continue; }
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? n : j; out += blank(src.slice(i, e)); i = e; continue; }
    if (c === '\'' || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      out += c + blank(src.slice(i + 1, j)) + (src[j] === c ? c : ''); i = src[j] === c ? j + 1 : j; continue;
    }
    if (c === '`') { out += '`'; i++; template(); continue; }
    if (c === '{') { depth++; out += c; i++; continue; }
    if (c === '}') {
      if (braces.length && braces[braces.length - 1] === depth) { braces.pop(); depth--; out += '}'; i++; template(); continue; }
      depth--; out += c; i++; continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1; let cls = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j++;
      }
      if (src[j] === '/') { j++; while (j < n && /[a-z]/i.test(src[j])) j++; out += blank(src.slice(i, j)); i = j; continue; }
    }
    out += c; i++;
  }
  return out;
}

const lineOf = (s, idx) => s.slice(0, idx).split('\n').length;

/** The text between the parenthesis at `open` and its match. */
function balanced(s, open) {
  let depth = 0;
  for (let k = open; k < s.length; k++) {
    if (s[k] === '(') depth++;
    else if (s[k] === ')') { depth--; if (depth === 0) return s.slice(open + 1, k); }
  }
  return s.slice(open + 1);
}

/**
 * Places in a module's CODE that sum over `field`: a `.reduce(` whose
 * callback adds the field, a `+=` of it, or `+` applied to it beside
 * something that is not a string. Naming the field in a comparison, a
 * filter, a formatter call or a string is not a sum and is not reported.
 * One level of alias is followed (`const v = r.fine_eur; total += v`).
 */
export function sumSites(src, field) {
  const code = codeOnly(src);
  const sites = [];
  const fieldRe = `\\.${field}\\b`;
  const aliases = [...code.matchAll(new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*[^;\\n]*?${fieldRe}`, 'g'))].map((m) => m[1]);
  const ref = new RegExp(`${fieldRe}${aliases.length ? `|\\b(?:${aliases.join('|')})\\b` : ''}`);
  for (const m of code.matchAll(/\.reduce\s*\(/g)) {
    const body = balanced(code, m.index + m[0].length - 1);
    if (ref.test(body) && /\+/.test(body)) sites.push({ line: lineOf(code, m.index), form: 'reduce' });
  }
  for (const m of code.matchAll(/\+=([^;\n]*)/g)) if (ref.test(m[1])) sites.push({ line: lineOf(code, m.index), form: '+=' });
  const plusRef = new RegExp(`(["'\`]\\s*)?\\+\\s*[\\w$.\\[\\]()?]*?(?:${fieldRe})|(?:${fieldRe})\\s*\\+(?![+=])(\\s*["'\`])?`, 'g');
  for (const m of code.matchAll(plusRef)) {
    if (m[1] || m[2]) continue; /* concatenation with a string */
    const ln = lineOf(code, m.index);
    if (!sites.some((x) => x.line === ln)) sites.push({ line: ln, form: '+' });
  }
  return sites.sort((a, b) => a.line - b.line);
}

/**
 * Places in a module's CODE that COUNT records by `field` — MC-2 for a
 * count, the counterpart of sumSites(): a `.filter(` whose callback reads
 * the field and whose result is measured with `.length`; a grouping that
 * pushes into a bucket keyed by the field (`m.get(x.field).push(`,
 * `o[x.field].push(`); a tally keyed by it (`o[x.field]++`, `+= 1`,
 * `= (…) + 1`). Reading the field to label, compare, route or render one
 * record is not a count and is not reported. One level of alias is
 * followed. A heuristic over text: PROPERTIES MC-2 says what it cannot see.
 */
export function countSites(src, field) {
  const code = codeOnly(src);
  const sites = [];
  const fieldRe = `\\.${field}\\b`;
  const aliases = [...code.matchAll(new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*[^;\\n]*?${fieldRe}`, 'g'))].map((m) => m[1]);
  const refSrc = `${fieldRe}${aliases.length ? `|\\b(?:${aliases.join('|')})\\b` : ''}`;
  const ref = new RegExp(refSrc);
  const add = (idx, form) => { const ln = lineOf(code, idx); if (!sites.some((x) => x.line === ln)) sites.push({ line: ln, form }); };
  for (const m of code.matchAll(/\.filter\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const body = balanced(code, open);
    if (!ref.test(body)) continue;
    const after = code.slice(open + body.length + 2, open + body.length + 2 + 12);
    if (/^\s*\.length\b/.test(after)) add(m.index, 'filter…length');
  }
  for (const m of code.matchAll(new RegExp(`(?:\\.get\\s*\\(|\\[)[^)\\]\\n]*(?:${refSrc})[^)\\]\\n]*[)\\]]\\s*\\.push\\s*\\(`, 'g'))) add(m.index, 'group');
  for (const m of code.matchAll(new RegExp(`\\[[^\\]\\n]*(?:${refSrc})[^\\]\\n]*\\]\\s*(?:\\+\\+|\\+=\\s*1\\b|=\\s*\\([^;\\n]*\\)\\s*\\+\\s*1\\b)`, 'g'))) add(m.index, 'tally');
  return sites.sort((a, b) => a.line - b.line);
}

function jsFiles(root) {
  const dir = join(root, 'js');
  return readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`).sort();
}

const sentences = (text) => String(text ?? '').split(/(?<=[.!?])\s+(?=[A-Z'"(])/).map((s) => s.trim()).filter(Boolean);
/* A $note names a field when it writes the identifier: a name with an
   underscore as a token (fine_eur, last_verified), a plain-word name
   (sources, appeal, claims) only when quoted as code — otherwise "against
   their sources" would be read as a statement about the field. */
const names = (text, field) => (field.includes('_')
  ? new RegExp(`(?<![\\w$])${field}(?![\\w$])`).test(text)
  : new RegExp(`[\`'"]${field}[\`'"]`).test(text));

function taxonomyTerms(tax, prefix) {
  const ids = [];
  const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.id === 'string') ids.push(o.id); for (const k in o) walk(o[k]); } };
  walk(tax);
  return [...new Set(ids.filter((i) => i.startsWith(`${prefix}:`)))].sort();
}

/** A Date that refuses to tell the time: MC-9's runtime half. */
function withoutClock(fn) {
  const Real = globalThis.Date;
  class NoClock extends Real {
    constructor(...a) { if (!a.length) throw new Error('read the clock: new Date() with no argument'); super(...a); }
    static now() { throw new Error('read the clock: Date.now()'); }
  }
  globalThis.Date = NoClock;
  try { return { value: fn(), error: null }; } catch (e) { return { value: null, error: e.message }; } finally { globalThis.Date = Real; }
}

async function load(root, ref, ctx = {}) {
  const key = `${ref.module}#${ref.export}`;
  if (ctx.exports && key in ctx.exports) return { value: ctx.exports[key] };
  const path = join(root, ref.module ?? '');
  if (!existsSync(path)) return { error: `${ref.module} does not exist` };
  const mod = await import(pathToFileURL(path).href);
  if (!(ref.export in mod)) return { error: `${ref.module} has no export "${ref.export}"` };
  return { value: mod[ref.export], mod };
}

/** The newest verification date anywhere in data/: the tree's own "as of",
 *  never the reader's clock (the precedent of tools/freshness.mjs F1). */
export function treeAsOf(db) {
  let max = null;
  const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) { if ((k === 'last_verified' || k === '$last_verified') && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && (!max || v > max)) max = v; else walk(v); } } };
  walk(db);
  return max;
}

/* ============================================================ the checks */

/**
 * Evaluate one declaration against the tree.
 * @param {object} decl
 * @param {{root?:string, db:object, compute?:Function, files?:Record<string,string>, asOf?:string}} ctx
 *   `compute` and `files` let a test plant a defective function or module
 *   without touching the repository.
 * @returns {Promise<{id:string, findings:{mc:string, message:string}[], result:object|null, publishable:boolean}>}
 */
export async function evaluate(decl, ctx) {
  const root = ctx.root ?? ROOT;
  const db = ctx.db;
  const findings = [];
  let res = null;
  const f = (mc, message) => findings.push({ mc, message: `${decl.id}: ${message}` });
  const src = (path) => (ctx.files && path in ctx.files ? ctx.files[path] : (existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null));

  /* MC-1 */
  const q = typeof decl.question === 'string' ? decl.question.trim() : '';
  if (q.length < 20) f('MC-1', 'the question is empty or too short to name what is counted');
  else if (!/\b(?:this|the) site\b[^?]*\b(?:records?|holds?)\b/i.test(q)) f('MC-1', `the question "${q}" does not name its population as the records this site holds; it would read as a census of EU enforcement`);

  /* MC-13 (shape first: a composite has no business being evaluated further) */
  if (!FORMULAS.includes(decl.formula)) f('MC-13', `formula "${decl.formula}" is not one of ${FORMULAS.join(', ')}`);
  for (const k of ['weights', 'score', 'combine', 'composite', 'index']) if (k in decl) f('MC-13', `the declaration carries "${k}": no weights, no score, no combination with another metric`);
  if (decl.formula === 'share' && !(decl.numerator && decl.denominator)) f('MC-13', 'a share declares both its numerator and its denominator');

  /* MC-7: no property may be declared not applicable */
  const declText = JSON.stringify(decl);
  if (/"not_applicable"\s*:|:\s*"not_applicable"|"n\/a"/i.test(declText)) f('MC-7', 'a property of the contract is declared not applicable; none may be');

  /* MC-12 */
  if (!Array.isArray(decl.cannot_say) || !decl.cannot_say.length || decl.cannot_say.some((x) => typeof x !== 'string' || !x.trim())) f('MC-12', 'cannot_say must be a non-empty list of statements of what the figure does not establish');

  /* MC-3 */
  const coll = db?.[decl.population?.dataset]?.[decl.population?.collection];
  if (!Array.isArray(coll)) { f('MC-3', `dataset ${decl.population?.dataset}.${decl.population?.collection} does not resolve`); return finish(); }
  const filt = await load(root, decl.population.filter ?? {}, ctx);
  if (filt.error || typeof filt.value !== 'function') { f('MC-3', `the population filter: ${filt.error ?? 'not a function'}`); return finish(); }
  const inputs = filt.value(coll);
  for (const r of inputs) for (const fld of [...decl.fields, decl.value?.field].filter(Boolean)) {
    if (!Object.prototype.hasOwnProperty.call(r, fld)) f('MC-3', `record ${r.id} has no field "${fld}"`);
  }
  /* an optional field (status_basis exists on some instruments only) is read where present; it must be
     declared, so MC-15 still holds its caveats to the figure, and it may not also be a required field */
  for (const fld of decl.optional_fields ?? []) if (decl.fields.includes(fld)) f('MC-3', `"${fld}" is declared both required and optional`);

  /* MC-4 */
  const vf = decl.value?.field;
  if (vf) {
    for (const r of inputs) {
      const v = r[vf];
      if (v === null || v === undefined) continue;
      if (decl.value.type === 'integer' && !(Number.isInteger(v) && v >= (decl.value.min ?? -Infinity))) f('MC-4', `record ${r.id}: ${vf} ${JSON.stringify(v)} is not an integer ≥ ${decl.value.min} in ${decl.value.unit}; never coerced`);
    }
  }

  /* MC-5 */
  const maps = {};
  for (const st of decl.states ?? []) {
    const m = await load(root, st.map ?? {}, ctx);
    if (m.error) { f('MC-5', `the state map for ${st.field}: ${m.error}`); continue; }
    const map = m.value; maps[st.field] = map;
    const terms = taxonomyTerms(db.taxonomy, st.vocabulary);
    for (const t of [...terms, 'null']) if (!Object.prototype.hasOwnProperty.call(map, t)) f('MC-5', `${st.field}: "${t}" has no mapping — a value with no mapping is an error, never a silent default`);
    for (const [k, c] of Object.entries(map)) {
      if (!CATEGORIES.includes(c)) f('MC-5', `${st.field}: "${k}" maps to "${c}", which is not one of ${CATEGORIES.join(', ')}`);
      if (k !== 'null' && !terms.includes(k)) f('MC-5', `${st.field}: the map names "${k}", which is not a term of the ${st.vocabulary} vocabulary`);
    }
    for (const r of inputs) { const v = r[st.field] ?? 'null'; if (!Object.prototype.hasOwnProperty.call(map, v)) f('MC-5', `record ${r.id}: ${st.field} "${v}" is not mapped`); }
    /* MC-7, the state half: not applicable only through a taxonomy term, and only where contradictions() admits it */
    if (map.null === 'not_applicable') f('MC-7', `${st.field}: null is mapped to not_applicable; an unresearched value is not "not applicable"`);
  }
  const pipe = await load(root, { module: 'js/pipeline.js', export: 'contradictions' }, ctx);
  /* MC-5, the record half: an input whose states contradict each other has
     no category a figure could honestly put it in (paid on an annulled
     decision, a fine on preliminary findings) */
  if (!pipe.error && decl.population.dataset === 'enforcement') for (const r of inputs) for (const c of pipe.value(r)) if (!/not applicable/.test(c)) f('MC-5', `record ${r.id}: its states contradict each other (contradictions()): ${c}`);
  if (!pipe.error) for (const st of decl.states ?? []) {
    const map = maps[st.field]; if (!map) continue;
    for (const r of inputs) if (map[r[st.field] ?? 'null'] === 'not_applicable') for (const c of pipe.value(r)) f('MC-7', `record ${r.id} is "not applicable" on ${st.field} while contradictions() says: ${c}`);
  }

  /* MC-2: one computing function, imported by every consumer, and no second sum */
  const comp = ctx.compute ? { value: ctx.compute } : await load(root, decl.compute ?? {}, ctx);
  if (comp.error || typeof comp.value !== 'function') { f('MC-2', `the computing function: ${comp.error ?? 'not a function'}`); return finish(); }
  /* the field a second implementation would compute over: the summed value, or the field a count partitions by */
  const scanField = decl.formula === 'sum' ? vf : decl.formula === 'count' ? decl.partition?.field : null;
  /* a partitioned count names its field; an unpartitioned count has no field to scan for, and is held by the import half alone */
  if (decl.formula === 'count' && decl.partition && !scanField) f('MC-2', 'a partitioned count names the field it partitions by (partition.field), so a second count by it can be found');
  if (scanField) {
    const files = ctx.files ? [...new Set([...jsFiles(root), ...Object.keys(ctx.files).filter((p) => p.startsWith('js/'))])] : jsFiles(root);
    const scan = decl.formula === 'sum' ? sumSites : countSites;
    const verb = decl.formula === 'sum' ? 'sums' : 'counts records by';
    for (const path of files) {
      const s = src(path); if (s == null) continue;
      const sites = scan(s, scanField);
      if (path === decl.compute.module) { if (sites.length > 1) f('MC-2', `${path} ${verb} ${scanField} in ${sites.length} places (lines ${sites.map((x) => x.line).join(', ')}); the module holds one`); }
      else for (const x of sites) f('MC-2', `${path}:${x.line} ${verb} ${scanField} itself (${x.form}) — a second implementation of ${decl.compute.export}()`);
    }
  }
  /* every consumer imports the function, whatever the formula: the half of MC-2 that does not depend on a scan */
  {
    if (!(decl.consumers ?? []).length) f('MC-2', 'no consumer is declared: a figure nobody imports is not the figure a page shows');
    for (const c of decl.consumers ?? []) {
      const s = src(c);
      if (s == null) { f('MC-2', `consumer ${c} does not exist`); continue; }
      const imp = new RegExp(`import\\s*\\{[^}]*\\b${decl.compute.export}\\b[^}]*\\}\\s*from\\s*['"]\\./${decl.compute.module.replace(/^js\//, '')}['"]`);
      if (!imp.test(s)) f('MC-2', `consumer ${c} does not import ${decl.compute.export} from ${decl.compute.module}`);
    }
  }

  /* run it: no clock (MC-9), an explicit date for the interval (MC-10) */
  const asOf = ctx.asOf ?? treeAsOf(db);
  const run = withoutClock(() => comp.value(coll, { asOf }));
  if (run.error) { f('MC-9', `the computing function ${run.error}; it must read no clock`); return finish(); }
  res = run.value;
  const noDate = withoutClock(() => comp.value(coll));
  if (noDate.error) f('MC-9', `without an explicit date the computing function ${noDate.error}`);
  else if (noDate.value?.past_interval != null) f('MC-10', 'without an explicit date the function still returned inputs past their interval: computed against whose day?');

  const valid = vf ? inputs.filter((r) => Number.isInteger(r[vf]) && r[vf] >= 0) : inputs;
  const invalid = vf ? inputs.filter((r) => r[vf] != null && !(Number.isInteger(r[vf]) && r[vf] >= 0)) : [];
  const ids = (xs) => xs.map((x) => (typeof x === 'string' ? x : x.id)).sort();
  const same = (a, b) => JSON.stringify(ids(a)) === JSON.stringify(ids(b));

  /* MC-4, the result half */
  if (invalid.length && res?.announced?.state !== 'not_determinable') f('MC-4', `${invalid.length} input(s) carry a value of the wrong type, and the figure still reports ${JSON.stringify(res?.announced?.eur)} rather than "not determinable"`);
  if (res?.announced?.eur != null && !Number.isInteger(res.announced.eur)) f('MC-4', `the figure is ${JSON.stringify(res.announced.eur)}, not an integer in ${decl.value.unit}`);

  /* MC-6 */
  const map = maps.payment_status;
  if (map) {
    const blocking = valid.filter((r) => { const c = map[r.payment_status ?? 'null']; return c === 'unknown' || c === 'not_researched' || c === undefined; });
    const col = res?.collected ?? {};
    if (blocking.length) {
      if (col.state !== 'not_determinable' || col.eur !== null) f('MC-6', `${blocking.length} input(s) are unknown or not researched on payment_status and "collected" is ${JSON.stringify(col.eur)} (${col.state}), not "not determinable"`);
      const counted = [...(col.unknown ?? []), ...(col.not_researched ?? []), ...(col.unmapped ?? [])];
      if (!same(counted, blocking)) f('MC-6', `the inputs that make "collected" not determinable are not returned with it: ${counted.length} returned, ${blocking.length} measured`);
    }
  }

  /* MC-8 */
  if (decl.partition && (typeof decl.partition !== 'object' || !Array.isArray(decl.partition.parts))) f('MC-8', `the partition is declared as ${JSON.stringify(decl.partition)}, not as ordered parts with the derivation that assigns them`);
  else if (decl.partition) {
    const parts = res?.parts ?? {};
    const names = Object.keys(parts);
    if (JSON.stringify(names) !== JSON.stringify(decl.partition.parts)) f('MC-8', `the parts returned (${names.join(', ')}) are not the declared ones (${decl.partition.parts.join(', ')})`);
    const seen = new Map();
    for (const [k, p] of Object.entries(parts)) for (const id of p.records ?? []) seen.set(id, [...(seen.get(id) ?? []), k]);
    for (const [id, ks] of seen) if (ks.length > 1) f('MC-8', `input ${id} is in ${ks.length} parts (${ks.join(', ')})`);
    for (const r of valid) if (!seen.has(r.id)) f('MC-8', `input ${r.id} is in no part`);
    const sumEur = Object.values(parts).reduce((a, p) => a + (p.eur ?? 0), 0);
    const sumRec = Object.values(parts).reduce((a, p) => a + (p.records?.length ?? 0), 0);
    if (decl.formula === 'sum' && res?.announced?.state === 'determined' && sumEur !== res.announced.eur) f('MC-8', `the parts add to ${sumEur}, the total is ${res.announced.eur}`);
    if (decl.formula === 'count' && res?.population !== valid.length) f('MC-8', `the figure reports a population of ${res?.population}, the inputs are ${valid.length}`);
    if (sumRec !== valid.length) f('MC-8', `the parts hold ${sumRec} records, the inputs are ${valid.length}`);
    const by = await load(root, decl.partition.by ?? {}, ctx);
    if (by.error) f('MC-8', `the ordered derivation: ${by.error}`);
    else for (const r of valid) { const want = by.value(r); if (seen.has(r.id) && !(seen.get(r.id) ?? []).includes(want)) f('MC-8', `input ${r.id} is in ${seen.get(r.id).join(', ')}, the ordered derivation puts it in ${want}`); }
  }

  /* MC-9 */
  const af = decl.as_of_field ?? 'last_verified';
  if (decl.as_of_field && ![...decl.fields, ...(decl.optional_fields ?? [])].includes(af)) f('MC-9', `the "as of" field ${af} is not a declared field`);
  const dated = valid.filter((r) => r[af]).map((r) => r[af]).sort();
  const undated = valid.filter((r) => !r[af]);
  const ao = res?.as_of ?? {};
  if (ao.oldest !== (dated[0] ?? null) || ao.newest !== (dated[dated.length - 1] ?? null)) f('MC-9', `"as of" is ${ao.oldest} … ${ao.newest}; the inputs say ${dated[0]} … ${dated[dated.length - 1]}`);
  if (!same(ao.undated ?? [], undated)) f('MC-9', `${undated.length} undated input(s) (${ids(undated).join(', ') || 'none'}) are not all counted and named beside the figure`);

  /* MC-10 */
  const em = await load(root, { module: 'js/evidence-model.js', export: 'riskClass' }, ctx);
  const fs2 = await load(root, { module: 'js/evidence-model.js', export: 'freshnessState' }, ctx);
  if (!em.error && !fs2.error) {
    const want = valid.filter((r) => ['freshness:review-due', 'freshness:stale'].includes(fs2.value(r.last_verified, em.value(decl.population.risk_kind ?? decl.population.dataset, r, { asOf }), asOf)));
    if (!Array.isArray(res?.past_interval) || !same(res.past_interval, want)) f('MC-10', `as of ${asOf}, riskClass() and freshnessState() put ${want.length} input(s) at review-due or stale (${ids(want).join(', ')}); the figure names ${Array.isArray(res?.past_interval) ? res.past_interval.length : 'none'}`);
  }

  /* MC-11 */
  if (decl.weak_evidence?.rule) {
    const rule = await load(root, decl.weak_evidence.rule, ctx);
    if (rule.error || typeof rule.value !== 'function') f('MC-11', `the weak-evidence rule: ${rule.error ?? 'not a function'}`);
    else {
      const want = valid.filter((r) => rule.value(r));
      const got = res?.weak ?? [];
      if (!same(got, want)) f('MC-11', `${want.length} input(s) rest on weak evidence by ${decl.weak_evidence.rule.export}() (${ids(want).join(', ') || 'none'}); the figure names ${got.length} (${ids(got).join(', ') || 'none'})`);
      for (const w of got) if (!w.name) f('MC-11', `${w.id} is named without its name`);
    }
  } else if (decl.weak_evidence) {
    const bix = basisIndex({ claims: db.claims, sources: db.sources });
    const want = valid.filter((r) => r[decl.weak_evidence.unverified_field] === true || checkFineBasis(r, bix).state !== 'established');
    const got = res?.weak ?? [];
    if (!same(got, want)) f('MC-11', `${want.length} input(s) rest on an unverified record or on no fact claim and official source stating the amount (${ids(want).join(', ') || 'none'}); the figure names ${got.length} (${ids(got).join(', ') || 'none'})`);
    for (const w of got) { const r = valid.find((x) => x.id === w.id); if (r && (w.eur !== r[vf] || !w.entity)) f('MC-11', `${w.id} is named without its entity or its amount`); }
  }

  /* MC-14 */
  if (decl.window) {
    const want = (decl.window.either_side_of ? decl.window.either_side_of(valid) : []);
    if (!same(res?.window?.either_side ?? [], want)) f('MC-14', `${want.length} input(s) whose date is coarser than a day overlap a window edge (${ids(want).join(', ') || 'none'}); the figure names ${(res?.window?.either_side ?? []).length} as "may fall either side"`);
  }

  /* MC-15 */
  const note = db[decl.population.dataset]?.$note ?? '';
  const caveats = decl.caveats ?? [];
  for (const cv of caveats) if (!String(note).includes(cv.quote)) f('MC-15', `the caveat quoted for ${cv.field} is no longer in the dataset's $note: "${cv.quote.slice(0, 80)}…"`);
  for (const fld of [...new Set([...decl.fields, ...(decl.optional_fields ?? []), vf].filter(Boolean))]) {
    for (const sent of sentences(note).filter((x) => names(x, fld))) {
      if (!caveats.some((cv) => cv.field === fld && sent.includes(cv.quote))) f('MC-15', `the $note says of ${fld}: "${sent.slice(0, 100)}…", and the figure does not carry it`);
    }
  }

  return finish();

  function finish() {
    return { id: decl.id, findings, result: res, publishable: findings.length === 0 };
  }
}

/** Every declaration, for tools/validate.mjs. */
export async function contractAudit({ db, root = ROOT, metrics = METRICS } = {}) {
  const out = [];
  for (const m of metrics) out.push(await evaluate(m, { db, root }));
  return { metrics: out, errors: out.flatMap((m) => m.findings.map((x) => `METRIC ${x.mc} ${x.message}`)) };
}
