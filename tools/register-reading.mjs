#!/usr/bin/env node
/* ============================================================
   tools/register-reading.mjs — the reading of a court register by a PERSON:
   a sheet to fill, an answer checked, and the declaration a reading leaves.

   P1 checkpoint, 12 Nov 2026 (docs/AUDIT-2026-11-11-P1.md §8), on the author's
   choice of options 1, 2 and 4 for a less cumbersome human check of F-A4.

   WHY. An enforcement record under appeal is re-verified against the Court's
   register, and this repository's environment cannot read it (InfoCuria answers
   it 403, AUDIT-2026-11-11-P1 §2). A person reads it. What made that heavy was
   composing the reading: finding which cases, copying wording, summarising.
   This tool turns it into "confirm or correct".

     node tools/register-reading.mjs sheet [--as-of YYYY-MM-DD] [--json]
        the records past their review interval (js/evidence-model.js riskClass()
        and freshnessState(), the one home of the rule), the cases each carries,
        what is recorded now, and an answer skeleton.
     node tools/register-reading.mjs check <answers.json> [--as-of YYYY-MM-DD] [--json]
        validates the person's answer, and prints the register source record and
        the `attestation` objects it WOULD become.

   NO VERB HERE WRITES. Not a source, not an attestation, not a `last_verified`:
   the proposal is printed and a reviewed commit makes it, as on 23 Oct 2026. A
   register reading closes a record only together with the re-reading of the
   authority's own pages on the same day, which this tool cannot do — so it
   proposes no `last_verified`, and says so.

   THE DECLARATION (`attestation`, optional on an enforcement record):
     { of, read: [{ source_id, locator }], outcome: "unchanged" | "changed", note? }
   the pattern of docs/ATTESTATION-FORM.md for a rule's reading, in the shape this
   record needs. auditReadings() (run by tools/validate.mjs) checks, where a
   record carries one: the five-key shape (E1); the seal — `of` equals the
   record's last_verified (E2); each source read exists and was accessed on `of`
   (E3); a `changed` outcome carries a note (E4); every case in a locator is one
   the cited source's note states (E5). A record with none is not an error: making
   it mandatory is the author's decision (AUDIT-2026-11-11-P1 §8, D-P1-5).

   WHAT NONE OF THIS PROVES. That anyone read the register. The answer is the
   reader's word, recorded under the reader's name and date, in a source whose
   note says the session did not fetch the register. The checks refuse an answer
   that cannot be true (a status line that is not the register's wording, an
   "unchanged" over a line that does not say pending, a date in the future, a
   case the record does not carry); they cannot refuse one that is false.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { riskClass, freshnessState } from '../js/evidence-model.js';
import { actionsOnly } from '../js/pipeline.js';
import { violations } from './source-contract.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REGISTER_URL = 'https://infocuria.curia.europa.eu/';
export const OUTCOMES = Object.freeze(['unchanged', 'changed', 'not_found']);
export const ATTESTED_OUTCOMES = Object.freeze(['unchanged', 'changed']);
export const ATTESTATION_KEYS = Object.freeze(['of', 'read', 'outcome', 'note']);
const REQUIRED_ATTESTATION_KEYS = Object.freeze(['of', 'read', 'outcome']);

/** Wording that says a case is pending, in the languages the register answers in. */
export const PENDING_RE = /\b(pending|pendante|pendiente|pendente|anh(?:ä|ae)ngig|hängig|in behandeling|aanhangig)\b/i;
/** An answer that names no wording. A status line is the register's own words, not a verdict about them. */
const RUBBER_STAMP = /^(ok|okay|unchanged|same|n\/?a|none|-+|invariato|nessun cambio|nessuna novit[àa]|come prima|uguale|si|sì|yes|no)\.?$/i;

const CASE_RE = /\b([TC])[-‑](\d{1,4})\/(\d{2})(?:\s?(P|R))?(?![\w])/g;
const caseKey = (m) => `${m[1]}-${m[2]}/${m[3]}${m[4] ? ` ${m[4]}` : ''}`;
/** Case numbers in a piece of text, normalised ("T-114/26", "C-744/25 P"), in order of appearance, once each. */
export const casesIn = (text) => [...new Set([...String(text ?? '').matchAll(CASE_RE)].map(caseKey))];
/** One case number written by a person, normalised, or null when it is not exactly one. */
export function normaliseCase(text) {
  const t = String(text ?? '').trim().replace(/‑/g, '-');
  const all = [...t.matchAll(CASE_RE)];
  return all.length === 1 && all[0][0].length === t.length ? caseKey(all[0]) : null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const REGISTER_SOURCE_RE = /^src-curia-register-(\d{4}-\d{2}-\d{2})$/;

export function loadDb(root = ROOT) {
  return Object.fromEntries(readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(root, 'data', f), 'utf8'))]));
}
const sourceList = (db) => db.sources?.sources ?? db.sources ?? [];
const sourceMap = (db) => new Map(sourceList(db).map((s) => [s.id, s]));
const todayUtc = () => new Date().toISOString().slice(0, 10);

/** The court cases a record carries, from where the data keeps them: the appeal's case_ref and note, the Official Journal
 *  notices of the actions (their ids and titles), and a register source named for one case. Not from verification_note: that is
 *  prose about everything the record once read. */
export function casesOf(rec, srcById) {
  const out = new Set([...casesIn(rec.appeal?.case_ref), ...casesIn(rec.appeal?.note)]);
  for (const sid of rec.sources ?? []) {
    if (/^src-oj-/.test(sid)) {
      const s = srcById.get(sid);
      casesIn(`${s?.title ?? ''} ${s?.note ?? ''}`).forEach((c) => out.add(c));
      const m = /^src-oj-([tc])(\d{1,4})-(\d{2})(?:-|$)/.exec(sid);
      if (m) out.add(`${m[1].toUpperCase()}-${m[2]}/${m[3]}`);
    }
    const r = /^src-curia-register-([tc])(\d{1,4})-(\d{2})$/.exec(sid);
    if (r) out.add(`${r[1].toUpperCase()}-${r[2]}/${r[3]}`);
  }
  return [...out].sort();
}

/** The enforcement records past their review interval as of a day: the same rule the figure's notice and freshness.mjs use. */
export function dueRecords(db, asOf) {
  return actionsOnly(db.enforcement?.enforcement ?? []).map((r) => {
    const risk = riskClass('enforcement', r, { asOf });
    return { rec: r, risk, state: freshnessState(r.last_verified, risk, asOf) };
  }).filter((x) => x.state === 'freshness:review-due' || x.state === 'freshness:stale');
}

/** The newest register source the data holds, and the cases its note names that no enforcement record carries. */
export function unattachedCases(db) {
  const srcs = sourceList(db).filter((s) => REGISTER_SOURCE_RE.test(s.id)).sort((a, b) => a.id.localeCompare(b.id));
  const newest = srcs[srcs.length - 1] ?? null;
  const sm = sourceMap(db);
  const carried = new Set(actionsOnly(db.enforcement?.enforcement ?? []).flatMap((r) => casesOf(r, sm)));
  return { source: newest?.id ?? null, cases: newest ? casesIn(newest.note).filter((c) => !carried.has(c.replace(/ [PR]$/, '')) && !carried.has(c)) : [] };
}

export function buildSheet(db, asOf) {
  const sm = sourceMap(db);
  const due = dueRecords(db, asOf);
  const records = due.map(({ rec, risk, state }) => {
    const cases = casesOf(rec, sm);
    return {
      id: rec.id, entity: rec.entity, risk: risk.split(':')[1], state: state.split(':')[1], last_verified: rec.last_verified,
      appeal_status: rec.appeal?.status ?? null, covered_by_this_form: cases.length > 0, cases,
      recorded: (rec.appeal?.note ?? '').slice(0, 220),
    };
  });
  const un = unattachedCases(db);
  const template = {
    read_on: asOf, read_by: '', where: REGISTER_URL,
    records: Object.fromEntries(records.filter((r) => r.covered_by_this_form).map((r) => [r.id, {
      outcome: '', cases: r.cases.map((c) => ({ case: c, status_line: '' })), note: '',
    }])),
    unattached: un.cases.map((c) => ({ case: c, status_line: '', subject: '' })),
  };
  return { as_of: asOf, records, unattached: un, template };
}

export function renderSheet(sheet) {
  const L = [];
  L.push(`REGISTER READING SHEET — records past their review interval as of ${sheet.as_of}`);
  L.push(`Register: ${REGISTER_URL}   (search each case number)`);
  L.push('');
  L.push('For each case: paste the status line EXACTLY as the register writes it (for example "Affaire pendante"). Then, per record:');
  L.push('  unchanged  every case still reads as pending and nothing else has appeared');
  L.push('  changed    a judgment, order, new party, new case or any other change — say what in `note`');
  L.push('  not_found  the register shows nothing for a case — say so in `note`');
  L.push('');
  const covered = sheet.records.filter((r) => r.covered_by_this_form);
  for (const r of covered) {
    L.push(`• ${r.id}   ${r.entity}`);
    L.push(`    ${r.risk} · ${r.state} · last verified ${r.last_verified} · appeal ${r.appeal_status}`);
    L.push(`    cases to read: ${r.cases.join(', ')}`);
    if (r.recorded) L.push(`    recorded: ${r.recorded}${r.recorded.length >= 220 ? '…' : ''}`);
    L.push('');
  }
  const rest = sheet.records.filter((r) => !r.covered_by_this_form);
  if (rest.length) {
    L.push('Past their interval too, with NO court case number recorded on the record, so not attestable by a register reading:');
    L.push('  ' + rest.map((r) => `${r.id} (${r.appeal_status === 'appeal:none' ? 'preliminary finding: not appealable' : 'appeal ' + r.appeal_status})`).join(', '));
    L.push('');
  }
  if (sheet.unattached.cases.length) {
    L.push(`Cases named in ${sheet.unattached.source} that no record carries — read each, and give its SUBJECT (which decision it challenges):`);
    L.push(`    ${sheet.unattached.cases.join(', ')}`);
    L.push('');
  }
  L.push('Fill the JSON skeleton (`sheet --json`, key "template"), save it anywhere outside data/, and run:');
  L.push('    node tools/register-reading.mjs check <answers.json>');
  return L.join('\n');
}

/**
 * Check a person's answer. Pure: reads nothing but its arguments.
 * @returns {{ok:boolean, problems:string[], warnings:string[], proposed:object|null, summary:object}}
 */
export function checkAnswers(db, answers, { asOf = todayUtc() } = {}) {
  const problems = []; const warnings = [];
  const P = (m) => problems.push(m); const W = (m) => warnings.push(m);
  const sm = sourceMap(db);
  const enf = new Map(actionsOnly(db.enforcement?.enforcement ?? []).map((r) => [r.id, r]));
  const summary = { records_answered: 0, attested: [], needs_editorial_work: [], cases_read: 0 };
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) { P('the answer is not a JSON object'); return { ok: false, problems, warnings, proposed: null, summary }; }
  for (const k of Object.keys(answers)) if (!['read_on', 'read_by', 'where', 'records', 'unattached'].includes(k)) P(`unknown key "${k}" (allowed: read_on, read_by, where, records, unattached)`);

  if (!isDay(answers.read_on)) P(`read_on "${answers.read_on}" is not a calendar day (YYYY-MM-DD)`);
  else if (answers.read_on > asOf) P(`read_on ${answers.read_on} is after ${asOf}: a reading cannot be dated in the future`);
  if (typeof answers.read_by !== 'string' || answers.read_by.trim().length < 2) P('read_by names the person who read the register');
  const where = answers.where ?? REGISTER_URL;
  if (typeof where !== 'string' || !/^https:\/\/[^\s]+$/.test(where)) P(`where "${where}" is not an https URL`);

  const statusProblem = (label, line) => {
    if (typeof line !== 'string' || line.trim().length < 3) return `${label}: status_line is empty — copy the register's wording, or write "not shown" in the note and answer not_found`;
    if (RUBBER_STAMP.test(line.trim())) return `${label}: status_line "${line.trim()}" is a verdict, not the register's wording`;
    return null;
  };
  const readCases = []; /* { case, status_line } across the answer, for the source's note */

  const recs = answers.records;
  if (!recs || typeof recs !== 'object' || Array.isArray(recs) || !Object.keys(recs).length) P('records is empty: no record was answered');
  else for (const [id, a] of Object.entries(recs)) {
    const rec = enf.get(id);
    if (!rec) { P(`${id}: not an enforcement action of this site`); continue; }
    const own = casesOf(rec, sm);
    if (!own.length) { P(`${id}: no court case number is recorded, so a register reading cannot attest it — read the national source by hand`); continue; }
    if (!a || typeof a !== 'object') { P(`${id}: the answer is not an object`); continue; }
    for (const k of Object.keys(a)) if (!['outcome', 'cases', 'note'].includes(k)) P(`${id}: unknown key "${k}"`);
    if (!OUTCOMES.includes(a.outcome)) { P(`${id}: outcome "${a.outcome}" is not one of ${OUTCOMES.join(', ')}`); continue; }
    summary.records_answered++;
    const seen = new Map();
    for (const [i, c] of (Array.isArray(a.cases) ? a.cases : []).entries()) {
      const n = normaliseCase(c?.case);
      if (!n) { P(`${id}: cases[${i}].case "${c?.case}" is not exactly one case number (T-114/26, C-744/25 P)`); continue; }
      if (seen.has(n)) { P(`${id}: ${n} is answered twice`); continue; }
      const sp = statusProblem(`${id} ${n}`, c.status_line); if (sp) P(sp);
      seen.set(n, c.status_line?.trim() ?? '');
      if (!own.includes(n)) W(`${id}: ${n} is not a case this record carries; it is kept in the source and attests nothing for this record`);
    }
    for (const need of own) if (!seen.has(need)) P(`${id}: ${need} is carried by the record and was not answered`);
    if (a.outcome !== 'unchanged' && (typeof a.note !== 'string' || a.note.trim().length < 10)) P(`${id}: outcome ${a.outcome} needs a note of what the register shows (at least a sentence)`);
    if (a.outcome === 'unchanged') {
      if (rec.appeal?.status === 'appeal:pending') for (const [n, line] of seen) if (own.includes(n) && !PENDING_RE.test(line)) P(`${id} ${n}: "unchanged" over a status line that does not say pending ("${line}") — a case that is not pending has changed: answer "changed" and say what`);
      if (rec.appeal?.status === 'appeal:unknown') W(`${id}: the record's appeal is "unknown"; a reading of "pending" is a change to it, not "unchanged" — consider "changed"`);
    }
    for (const [n, line] of seen) readCases.push({ case: n, status_line: line });
    (a.outcome === 'unchanged' || a.outcome === 'changed' ? summary.attested : summary.needs_editorial_work).push(id);
    if (a.outcome !== 'unchanged') summary.needs_editorial_work.includes(id) || summary.needs_editorial_work.push(id);
  }

  const unattached = answers.unattached ?? [];
  if (!Array.isArray(unattached)) P('unattached must be a list');
  else for (const [i, u] of unattached.entries()) {
    const n = normaliseCase(u?.case);
    if (!n) { P(`unattached[${i}].case "${u?.case}" is not exactly one case number`); continue; }
    const sp = statusProblem(`unattached ${n}`, u.status_line); if (sp) P(sp);
    if (typeof u.subject !== 'string' || u.subject.trim().length < 5) W(`unattached ${n}: no subject given — the register may not state it, and then the record says so`);
    readCases.push({ case: n, status_line: u.status_line?.trim() ?? '', subject: (u.subject ?? '').trim() || null });
  }
  summary.cases_read = new Set(readCases.map((c) => c.case)).size;
  if (!summary.cases_read && !problems.length) P('no case was read');

  const answered = new Set(Object.keys(recs ?? {}));
  if (isDay(answers.read_on)) for (const { rec } of dueRecords(db, asOf)) if (!answered.has(rec.id)) W(`${rec.id} is past its interval as of ${asOf} and was not answered: it stays past its interval`);

  let proposed = null;
  if (!problems.length) {
    const date = answers.read_on;
    const id = `src-curia-register-${date}`;
    if (sm.has(id)) { P(`${id} already exists: a reading of the same day is one source`); }
    else {
      const states = readCases.map((c) => `${c.case}${c.subject ? ` (${c.subject})` : ''} ‘${c.status_line}’`).join('; ');
      const source = {
        id, tier: 'tier:2', type: 'source-type:court-record', publisher: 'cjeu', publisher_name: 'Court of Justice of the European Union',
        title: `InfoCuria case register — state of ${summary.cases_read} case${summary.cases_read === 1 ? '' : 's'}, read ${longDate(date)}`,
        url: where, url_status: 'url:live', published: null, accessed: date, language: 'en',
        note: `The Court’s own case register, read by ${answers.read_by.trim()} on ${date} and reported to the repository’s session, which transcribed it here: this session did not fetch the register, and the transcription is the reader’s word. Recorded on that day, in the register’s wording: ${states}. The register is a live record: each state is its state on the read date only.`,
      };
      const v = violations(source);
      if (v.length) v.forEach((x) => P(`the proposed source breaks the source contract: ${typeof x === 'string' ? x : JSON.stringify(x)}`));
      else {
        const attestations = {};
        for (const rid of summary.attested) {
          const a = recs[rid];
          const att = { of: date, read: [{ source_id: id, locator: a.cases.map((c) => normaliseCase(c.case)).join('; ') }], outcome: a.outcome };
          if (typeof a.note === 'string' && a.note.trim()) att.note = a.note.trim();
          attestations[rid] = att;
        }
        proposed = { source, attestations,
          reminder: 'Nothing was written. A record’s last_verified moves only after its authority pages are re-read the same day and the reading is committed with an Evidence: trailer; `outcome: changed` and `not_found` need editorial work before any of this is committed.' };
      }
    }
  }
  return { ok: problems.length === 0, problems, warnings, proposed, summary };
}

/**
 * E1–E5, run by tools/validate.mjs over every enforcement record that carries an `attestation`.
 * @returns {string[]} error messages
 */
export function auditReadings(db) {
  const errs = []; const sm = sourceMap(db);
  for (const rec of db.enforcement?.enforcement ?? []) {
    if (!('attestation' in rec)) continue;
    const e = (m) => errs.push(`ENFORCEMENT "${rec.id}" attestation ${m}`);
    const a = rec.attestation;
    if (!a || typeof a !== 'object' || Array.isArray(a)) { e('is not an object'); continue; }
    const extra = Object.keys(a).filter((k) => !ATTESTATION_KEYS.includes(k));
    const lacking = REQUIRED_ATTESTATION_KEYS.filter((k) => !(k in a));
    if (extra.length) e(`has unknown key(s) ${extra.join(', ')} (allowed: ${ATTESTATION_KEYS.join(', ')})`);       /* E1 */
    if (lacking.length) e(`lacks ${lacking.join(', ')}`);
    if (!ATTESTED_OUTCOMES.includes(a.outcome)) e(`outcome ${JSON.stringify(a.outcome)} is not one of ${ATTESTED_OUTCOMES.join(', ')}`);
    if (!Array.isArray(a.read) || !a.read.length) e('read must be a non-empty list of {source_id, locator}');
    if (!isDay(a.of)) e(`of ${JSON.stringify(a.of)} is not a calendar day`);
    else if (a.of !== rec.last_verified) e(`of ${a.of} is not the record's last_verified ${rec.last_verified}: the attestation is the seal of that reading`); /* E2 */
    if (a.outcome === 'changed' && !(typeof a.note === 'string' && a.note.trim())) e('outcome "changed" needs a note');               /* E4 */
    for (const [i, r] of (Array.isArray(a.read) ? a.read : []).entries()) {
      if (!r || typeof r !== 'object' || typeof r.source_id !== 'string' || typeof r.locator !== 'string' || !r.locator.trim()) { e(`read[${i}] needs source_id and locator`); continue; }
      const s = sm.get(r.source_id);
      if (!s) { e(`read[${i}] source ${r.source_id} does not exist`); continue; }                                                       /* E3 */
      if (isDay(a.of) && s.accessed !== a.of) e(`read[${i}] source ${r.source_id} was accessed ${s.accessed}, not on ${a.of}: a reading cites the source it read that day`);
      const stated = new Set(casesIn(s.note));
      for (const c of r.locator.split(';').map((x) => x.trim()).filter(Boolean)) {
        const n = normaliseCase(c);
        if (!n) e(`read[${i}] locator "${c}" is not a case number`);
        else if (!stated.has(n)) e(`read[${i}] locator names ${n}, which the note of ${r.source_id} does not state`);                    /* E5 */
      }
    }
  }
  return errs;
}

/* ============================================================ CLI */

function main(argv) {
  const [verb, ...rest] = argv;
  const flag = (n) => rest.includes(n);
  const opt = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : null; };
  const asOf = opt('--as-of') ?? todayUtc();
  if (!isDay(asOf)) { console.error(`--as-of "${asOf}" is not a calendar day`); return 2; }
  if (verb === 'sheet') {
    const sheet = buildSheet(loadDb(), asOf);
    console.log(flag('--json') ? JSON.stringify(sheet, null, 2) : renderSheet(sheet));
    return 0;
  }
  if (verb === 'check') {
    const file = rest.find((x) => !x.startsWith('--') && x !== opt('--as-of'));
    if (!file) { console.error('usage: node tools/register-reading.mjs check <answers.json> [--as-of D] [--json]'); return 2; }
    let answers;
    try { answers = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`cannot read ${file} as JSON: ${e.message}`); return 2; }
    const r = checkAnswers(loadDb(), answers, { asOf });
    if (flag('--json')) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(r.ok ? `register-reading · ANSWER ACCEPTED · ${r.summary.cases_read} case(s) read · attests ${r.summary.attested.length} record(s) · ${r.summary.needs_editorial_work.length} need editorial work` : `register-reading · ANSWER REFUSED · ${r.problems.length} problem(s)`);
      for (const p of r.problems) console.log(`  ✗ ${p}`);
      for (const w of r.warnings) console.log(`  ! ${w}`);
      if (r.proposed) { console.log('\nPROPOSED (nothing written):\n' + JSON.stringify({ source: r.proposed.source, attestations: r.proposed.attestations }, null, 2)); console.log(`\n${r.proposed.reminder}`); }
    }
    return r.ok ? 0 : 1;
  }
  console.error('usage: node tools/register-reading.mjs sheet|check ...   (no verb writes)');
  return 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
