/* ============================================================
   Localization audit. Zero dependencies; run from site/:

       node tools/i18n-audit.mjs

   What it checks, and why each check exists:

   1. Every file the register declares actually exists on disk.
      A language menu built from a register that lies is worse than a
      hard-coded one, because the failure only appears in production.

   2. Declared key counts match the files.

   3. Every locale's positional keys are a subset of the live
      data-i18n keys in the DOM. A key no element carries is dead
      weight that will silently rot.

   4. Any key a locale is missing is declared, and declared for the
      right reason. Two categories, kept apart because they mean
      different things to a translator:
        · `superseded`        — a translation existed and was
                                withdrawn because the English it
                                rendered no longer describes the site.
        · `pending_translation` — the string is new and no translation
                                has been authored yet.
      Anything missing and undeclared is an error. Silent gaps are the
      thing this whole layer exists to prevent.

   5. Every locale's entity overlay uses exactly the same canonical
      entity IDs. This is the guarantee that a translation is attached
      to a fact rather than to a position in a table.

   6. No source file builds an i18n path by string concatenation.
      Paths must come from the register.

   7. Nothing claims offline support unless a service worker exists.
   ============================================================ */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let errors = 0, warnings = 0;
const bad = (m) => { errors++; console.log('  ✗ ' + m); };
const warn = (m) => { warnings++; console.log('  ! ' + m); };
const ok = (m) => console.log('  · ' + m);

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const meta = (k) => k.startsWith('$');

/* ---------------------------------------------------------- the DOM key set */

const PAGES = readdirSync('.').filter((f) => f.endsWith('.html'));
const domKeys = new Set();
for (const p of PAGES) {
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) domKeys.add(m[1]);
}
console.log('\nDOM        ' + domKeys.size + ' data-i18n keys across ' + PAGES.length + ' pages');

/* ---------------------------------------------------------- the register */

console.log('\nREGISTER');
if (!existsSync('i18n/locales.json')) {
  bad('i18n/locales.json is missing — the language menu has no source of truth');
  process.exit(1);
}
const reg = read('i18n/locales.json');
const locales = reg.locales || [];
ok(locales.length + ' locales declared, default "' + reg.default + '"');

const overlays = new Map();

for (const l of locales) {
  console.log('\nLOCALE ' + l.code + '  (' + l.label + ')');

  /* --- 1. declared files exist --- */
  for (const [field, path] of [['file', l.file], ['data', l.data]]) {
    if (path === null || path === undefined) { ok(field + ': none declared'); continue; }
    if (!existsSync(path)) { bad(field + ' declared as ' + path + ' but no such file exists'); continue; }
    ok(field + ': ' + path + ' (' + statSync(path).size + ' bytes)');
  }
  if (l.code === 'en') continue;
  if (!l.file || !existsSync(l.file)) continue;

  /* --- 2 & 3. key counts and DOM membership --- */
  const strings = read(l.file);
  const keys = Object.keys(strings).filter((k) => !meta(k));
  if (l.keys !== undefined && l.keys !== keys.length) {
    bad('register says ' + l.keys + ' keys, file has ' + keys.length);
  } else ok(keys.length + ' string keys, matching the register');

  const orphan = keys.filter((k) => !domKeys.has(k));
  if (orphan.length) bad(orphan.length + ' keys no element carries: ' + orphan.slice(0, 6).join(', '));
  else ok('no orphan keys');

  /* --- 4. gaps are declared, and for the right reason --- */
  const sup = new Set(l.superseded || []);
  const pending = new Set(l.pending_translation || []);
  const missing = [...domKeys].filter((k) => !(k in strings));
  const undeclared = missing.filter((k) => !sup.has(k) && !pending.has(k));
  if (undeclared.length) {
    bad(undeclared.length + ' keys missing and undeclared: ' + undeclared.slice(0, 6).join(', '));
  } else if (missing.length) {
    const s = missing.filter((k) => sup.has(k)).length;
    const p = missing.filter((k) => pending.has(k)).length;
    ok(missing.length + ' keys absent, all declared' +
      (s ? ' — ' + s + ' superseded' : '') +
      (p ? (s ? ',' : ' —') + ' ' + p + ' awaiting translation' : '') +
      '; these fall back to English and are marked in the interface');
  } else ok('complete against the DOM');
  /* a declaration that no longer matches the DOM is itself a defect */
  for (const [name, set] of [['superseded', sup], ['pending_translation', pending]]) {
    const stale = [...set].filter((k) => !domKeys.has(k));
    if (stale.length) warn(name + ' names ' + stale.length + ' key(s) no element carries: ' + stale.join(', '));
    const present = [...set].filter((k) => k in strings);
    if (present.length) bad(name + ' names ' + present.length + ' key(s) the file actually contains: ' + present.join(', '));
  }
  if (l.complete === true && missing.length) bad('register claims complete:true but ' + missing.length + ' keys are absent');
  if (l.complete === false && !missing.length) warn('register claims complete:false but nothing is missing');

  /* --- 5. entity overlay --- */
  if (l.data && existsSync(l.data)) {
    const ovKeys = Object.keys(read(l.data)).filter((k) => !meta(k));
    overlays.set(l.code, new Set(ovKeys));
    if (l.entity_keys !== undefined && l.entity_keys !== ovKeys.length) {
      bad('register says ' + l.entity_keys + ' entity keys, overlay has ' + ovKeys.length);
    } else ok(ovKeys.length + ' entity keys');
  }
}

/* --- 5b. all overlays share one canonical ID set --- */
console.log('\nCANONICAL ENTITY IDS');
const codes = [...overlays.keys()];
if (codes.length < 2) ok('only ' + codes.length + ' overlay(s); nothing to compare');
else {
  const base = overlays.get(codes[0]);
  let aligned = true;
  for (const c of codes.slice(1)) {
    const s = overlays.get(c);
    const extra = [...s].filter((k) => !base.has(k));
    const absent = [...base].filter((k) => !s.has(k));
    if (extra.length || absent.length) {
      aligned = false;
      bad(c + ' diverges from ' + codes[0] + ': ' + absent.length + ' absent, ' + extra.length + ' extra' +
        (absent.length ? ' — e.g. ' + absent.slice(0, 3).join(', ') : ''));
    }
  }
  if (aligned) ok(codes.join(', ') + ' all key on the same ' + base.size + ' canonical entity IDs');
}

/* --- 6. no path built by concatenation --- */
console.log('\nFETCH PATHS');
const sources = ['app.js', ...readdirSync('js').map((f) => join('js', f))].filter((f) => f.endsWith('.js'));
let concat = 0;
for (const f of sources) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/fetch\(\s*['"`]i18n\/['"`]\s*\+/g)) {
    bad(f + ' builds an i18n path by concatenation near "' + m[0] + '" — it must come from the register');
    concat++;
  }
}
if (!concat) ok('no i18n path is assembled by string concatenation');

/* every literal i18n path that is fetched must exist */
let literals = 0;
for (const f of sources) {
  for (const m of readFileSync(f, 'utf8').matchAll(/fetch\(\s*['"`](i18n\/[^'"`]+)['"`]/g)) {
    literals++;
    if (existsSync(m[1])) ok(f + ' → ' + m[1] + ' exists');
    else bad(f + ' fetches ' + m[1] + ' which does not exist');
  }
}
if (!literals) ok('no literal i18n fetch paths outside the register');

/* --- 7. the offline claim --- */
console.log('\nOFFLINE CLAIM');
const hasSW = existsSync('sw.js') || existsSync('service-worker.js');
const claims = [];
for (const f of [...sources, ...PAGES, 'i18n/locales.json']) {
  const src = readFileSync(f, 'utf8');
  for (const line of src.split('\n')) {
    if (/works offline|available offline|fully offline|offline[- ]first/i.test(line)) claims.push(f + ': ' + line.trim().slice(0, 90));
  }
}
if (claims.length && !hasSW) claims.forEach((c) => bad('claims offline support with no service worker — ' + c));
else if (!hasSW) ok('no service worker, and nothing claims offline support');
else ok('service worker present');

console.log('\n' + '─'.repeat(60));
console.log('ERRORS ' + errors + '   WARNINGS ' + warnings);
process.exit(errors ? 1 : 0);
