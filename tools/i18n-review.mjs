#!/usr/bin/env node
/* ============================================================
   i18n-review.mjs — the translation review of the language editions.

     node tools/i18n-review.mjs status [code]
         Reviewed / stale / unreviewed / untranslated per locale, derived
         from the files as they stand. Writes nothing.

     node tools/i18n-review.mjs sheet <code> [--all]
         Writes docs/i18n-review/<code>.md: every string not yet reviewed
         (every string with --all), beside the English, with a checkbox
         and the fingerprint of exactly what is shown.

     node tools/i18n-review.mjs record <code> --by "<name>" [--sheet <path>] [--on YYYY-MM-DD]
         Reads the ticked boxes of the sheet and records an approval in
         i18n/review/<code>.json for each string whose fingerprint still
         matches what the sheet showed. A string changed since the sheet
         was generated is refused by name: the reviewer read something
         else.

   RUN BY A PERSON. `record` is the attestation that a speaker of the
   language read the text. An agent may run `status` and `sheet`; it
   never runs `record` (docs/AI-SAFE-BOUNDARIES.md §3). The --by name is
   kept in the record and the commit that adds it is the provenance.

   Why per string and fingerprinted: a locale-level "reviewed: true"
   would stay true after the next English correction, which is the
   superseded-translation hazard in AGENTS.md. Here every approval names
   the exact text it approved, and goes stale by itself when either side
   changes. tools/editions.mjs explains the model.
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewState, editionLocales, ledgerPath, readLedger, fingerprint, ROOT } from './editions.mjs';

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', middot: '·', euro: '€', laquo: '«', raquo: '»', rarr: '→', larr: '←', ne: '≠', hellip: '…', deg: '°', bull: '•', times: '×', ge: '≥', le: '≤',
  agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù', aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú', acirc: 'â', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û', ccedil: 'ç', ntilde: 'ñ', iuml: 'ï', euml: 'ë', uuml: 'ü', ouml: 'ö', auml: 'ä', oelig: 'œ', iquest: '¿', iexcl: '¡',
  Agrave: 'À', Egrave: 'È', Eacute: 'É', Aacute: 'Á', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú' };
/** Readable text for the sheet: markup removed, entities decoded. The fingerprint is of the raw strings. */
export const plain = (s) => String(s ?? '')
  .replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]+>/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-zA-Z]+);/g, (m, n) => ENTITIES[n] ?? m)
  .replace(/\s+/g, ' ').trim();

/** The markup a translation must keep: links, glossary buttons, nested keys, counters. */
export function markup(s) {
  const tags = [];
  for (const m of String(s ?? '').matchAll(/<([a-z0-9]+)\b([^>]*)>/gi)) {
    const keep = [...m[2].matchAll(/\b(href|data-term|data-i18n|data-count|class)="([^"]*)"/g)].map((a) => `${a[1]}=${a[2]}`).sort();
    tags.push(`<${m[1].toLowerCase()}${keep.length ? ' ' + keep.join(' ') : ''}>`);
  }
  return tags.sort();
}
export function markupDiff(en, tr) {
  const a = markup(en), b = markup(tr);
  const lost = a.filter((t) => { const i = b.indexOf(t); if (i < 0) return true; b.splice(i, 1); return false; });
  return { lost, added: b };
}

const LABEL = { it: 'Italian', fr: 'French', es: 'Spanish' };
const today = () => new Date().toISOString().slice(0, 10);
const englishHead = async () => {
  const { TOP_PAGES } = await import('./seo.mjs');
  const p = TOP_PAGES.find((x) => x.file === 'index.html');
  return { englishTitle: p.title, englishDescription: p.description };
};
export const sheetPath = (code, root = ROOT) => join(root, 'docs', 'i18n-review', `${code}.md`);
const LINE = /^- \[([ xX])\] approve `([^`]+)` · `fp:([0-9a-f]{12})`/;

export function renderSheet(st, { all = false, when = today() } = {}) {
  const name = LABEL[st.code] || st.code;
  const c = st.counts;
  const rows = st.keys.filter((k) => all || k.state !== 'reviewed');
  const L = [];
  L.push(`# ${name} edition — translation review`, '');
  L.push(`Generated ${when} by \`node tools/i18n-review.mjs sheet ${st.code}${all ? ' --all' : ''}\`. ` +
    `State when generated: **${c.reviewed} reviewed · ${c.stale} stale · ${c.unreviewed} unreviewed · ${c.untranslated} untranslated** of ${st.total} strings. ` +
    `The ${name} edition is offered to search engines only when all ${st.total} are reviewed.`, '');
  L.push('**How to review.** For each string below:', '');
  L.push(`1. Read the ${name} beside the English. The text is shown without its markup; the files hold it.`);
  L.push('2. If it is right, change its `[ ]` to `[x]`.');
  L.push(`3. If it is wrong, leave the box empty and correct the string in \`i18n/${st.code}.json\` (the title and description: \`i18n/locales.json\`, \`edition\`). A corrected string has a new fingerprint, so regenerate this sheet and tick it there.`);
  L.push(`4. When done, run \`node tools/i18n-review.mjs record ${st.code} --by "Your Name"\`. Only ticked strings whose fingerprint still matches are recorded, and the command says which were not.`, '');
  L.push('Stale strings were approved before and have changed since; they come first. ⚠ marks a translation whose links, glossary buttons or nested markup differ from the English.', '');
  const order = { stale: 0, unreviewed: 1, untranslated: 2, reviewed: 3 };
  let group = null;
  for (const k of rows.slice().sort((a, b) => order[a.state] - order[b.state] || st.keys.indexOf(a) - st.keys.indexOf(b))) {
    const g = k.state === 'stale' ? 'Changed since approval' : k.key.split('.')[0];
    if (g !== group) { L.push(`## ${g}`, ''); group = g; }
    L.push(`### \`${k.key}\``, '');
    L.push(`- **EN** ${plain(k.en)}`);
    if (k.state === 'untranslated') { L.push(`- **${st.code.toUpperCase()}** *(no translation: the edition shows the English)*`, ''); continue; }
    L.push(`- **${st.code.toUpperCase()}** ${plain(k.tr)}`);
    const d = markupDiff(k.en, k.tr);
    if (d.lost.length || d.added.length) L.push(`- ⚠ markup differs — missing: ${d.lost.join(' ') || 'none'}; extra: ${d.added.join(' ') || 'none'}`);
    L.push(`- [${k.state === 'reviewed' ? 'x' : ' '}] approve \`${k.key}\` · \`fp:${k.fp.slice(0, 12)}\``, '');
  }
  return L.join('\n') + '\n';
}

export function parseSheet(text) {
  const ticked = [];
  for (const line of text.split('\n')) {
    const m = line.match(LINE);
    if (m && m[1].toLowerCase() === 'x') ticked.push({ key: m[2], fp: m[3] });
  }
  return ticked;
}

/** A name that is plainly not a person's. A guard against a mistake, not a control. */
export const NOT_A_PERSON = /\b(claude|gpt|chatgpt|openai|anthropic|assistant|agent|bot|copilot|llm|ai)\b/i;

export function record(st, ticked, { by, on = today(), ledger }) {
  if (!by || !String(by).trim()) throw new Error('record: --by "<your name>" is required: an approval names the person who gave it');
  if (NOT_A_PERSON.test(by)) throw new Error(`record: "${by}" is not a person's name. Only a person records a review (docs/AI-SAFE-BOUNDARIES.md §3).`);
  const byKey = new Map(st.keys.map((k) => [k.key, k]));
  const done = [], refused = [];
  for (const t of ticked) {
    const k = byKey.get(t.key);
    if (!k) { refused.push(`${t.key}: no such string`); continue; }
    if (k.state === 'untranslated') { refused.push(`${t.key}: has no translation`); continue; }
    if (!k.fp.startsWith(t.fp)) { refused.push(`${t.key}: changed since the sheet was generated (fp:${t.fp} → fp:${k.fp.slice(0, 12)}); regenerate the sheet and read it again`); continue; }
    ledger.entries[t.key] = { fingerprint: k.fp, reviewed_by: String(by).trim(), reviewed_on: on };
    done.push(t.key);
  }
  return { done, refused };
}

async function main(argv) {
  const [cmd, code, ...rest] = argv;
  const flag = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : null; };
  const head = await englishHead();
  if (cmd === 'status') {
    const codes = code ? [code] : editionLocales().map((l) => l.code);
    for (const c of codes) {
      const st = reviewState(c, head);
      const n = st.counts;
      console.log(`${c}  ${n.reviewed}/${st.total} reviewed · ${n.stale} stale · ${n.unreviewed} unreviewed · ${n.untranslated} untranslated  →  ${st.complete ? 'REVIEWED: the edition is indexable' : 'not reviewed: the edition is generated but noindex, with no hreflang'}`);
    }
    return 0;
  }
  if (cmd === 'sheet') {
    if (!code) throw new Error('sheet <code>');
    const st = reviewState(code, head);
    const p = sheetPath(code);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, renderSheet(st, { all: rest.includes('--all') }));
    console.log(`wrote ${relative(ROOT, p)} — ${st.keys.filter((k) => rest.includes('--all') || k.state !== 'reviewed').length} string(s)`);
    return 0;
  }
  if (cmd === 'record') {
    if (!code) throw new Error('record <code> --by "<name>"');
    const st = reviewState(code, head);
    const p = flag('--sheet') || sheetPath(code);
    if (!existsSync(p)) throw new Error(`record: no sheet at ${p}; run: node tools/i18n-review.mjs sheet ${code}`);
    const ledger = readLedger(code);
    const r = record(st, parseSheet(readFileSync(p, 'utf8')), { by: flag('--by'), on: flag('--on') || undefined, ledger });
    writeFileSync(ledgerPath(code), JSON.stringify(ledger, null, 1) + '\n');
    console.log(`recorded ${r.done.length} approval(s) in ${relative(ROOT, ledgerPath(code))}`);
    for (const x of r.refused) console.log(`  not recorded: ${x}`);
    const after = reviewState(code, head);
    console.log(`${code} now ${after.counts.reviewed}/${after.total} reviewed. Run node tools/_footer.mjs, then commit i18n/review/${code}.json with what it regenerates.`);
    return r.refused.length ? 1 : 0;
  }
  console.log('usage: node tools/i18n-review.mjs status [code] | sheet <code> [--all] | record <code> --by "<name>" [--sheet <path>] [--on YYYY-MM-DD]');
  return 2;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.error(e.message); process.exit(2); });
