/**
 * tools/attestation-audit.mjs — the structured attestation of a rule's reading, checked offline.
 *
 * v2 Session 22, item 22.2 (4 Nov 2026). The design is docs/ATTESTATION-FORM.md, approved at
 * checkpoint 22.1; every choice in it is the author's, recorded in docs/ROADMAP-v2.md §8, v2 Session
 * 22, questions 1–10. tools/validate.mjs runs this module and reports what it finds (question 9).
 *
 * The form is an optional object on a rule in data/applicability.json:
 *
 *   attestation: { of, read: [{source_id, locator}], queried: [source_id], outcome, decisions: [title] }
 *
 *   A-1  the shape: exactly those five keys; `outcome` "changed" | "unchanged"; `read`
 *        non-empty; every source_id resolves; every `queried` id also in `read`        ERROR
 *   A-2  the seal: `of` equals the rule's last_verified                                ERROR
 *   A-3  the gap: last_verified later than FORM_FROM and no attestation               ERROR
 *   A-4  completeness: every Article, Annex or Recital the rule cites on a tier-1
 *        text — in sources[], in exemptions[].basis[], and as the Article number of
 *        each provision in obligations and condition_provisions — is in `read` under
 *        that text. At ARTICLE level: Art. 13(1) read covers Art. 13(4) cited       ERROR
 *   A-5  every tier-1 text in the rule's sources[] is in `queried`                    ERROR
 *   A-6  each `decisions` title is the bold title of exactly one roadmap §8 row;
 *        "changed" names at least one                                                 ERROR
 *   A-7  the verification_note contains the CELEX of each tier-1 text in `read`,
 *        taken from the source's URL                                                  ERROR
 *   A-8  what the checks cannot resolve, named one by one and never skipped: a locator
 *        segment that is not an Article, Annex or Recital; a provision numbered as an
 *        Article of another act; a tier-2 source the rule cites that `read` does not
 *        name; a tier-1 text in `read` whose URL yields no CELEX                      WARNING
 *
 * WHAT NONE OF THIS PROVES. That the law was read. The form is a declaration, and A-4 shows only
 * that the Articles NAMED cover the Articles CITED; no tool here fetches anything
 * (docs/AUDIT-2026-09-01.md F-12), and this one does not either. Nor what SPARQL returned, nor that
 * the note's Articles match the form's (A-7 compares texts, not Articles), nor what a §8 row says
 * (A-6 matches a title), nor that "unchanged" is true. docs/ATTESTATION-FORM.md §6.
 *
 * Pure: reads the records and the roadmap text it is given. No network, no clock, no write.
 */

/** The last day a rule was read without the form. A rule whose last_verified is LATER must carry one
 *  (§8, v2 Session 22, question 4). None of the 33 rules of 4 Nov 2026 is later, so nothing is
 *  backfilled (docs/PHASE-4-PLAN.md §2). Never moved to excuse a rule. */
export const FORM_FROM = '2026-11-04';

export const ATTESTATION_KEYS = Object.freeze(['of', 'read', 'queried', 'outcome', 'decisions']);
export const OUTCOMES = Object.freeze(['changed', 'unchanged']);

const arr = (x) => (Array.isArray(x) ? x : []);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const TIER_1 = 'tier:1';

/** Split a locator at `;` outside parentheses: "Recital 13 (software; AI)" is one segment. */
export function segments(locator) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(locator ?? '')) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ';' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** The structural units one segment names, or null if it names none the parser can read.
 *  "Art. 3 points (1) and (4)" → ["Art. 3"]; "Annexes I and II" → ["Annex I", "Annex II"];
 *  "Recital 13 (…)" → ["Recital 13"]; "Art. 1 point (7) (Art. 5(1) …, as inserted)" → ["Art. 1"],
 *  the amending act's own Article — the outer one, which is the text the locator points into. */
export function unitsOf(segment) {
  const s = String(segment).trim();
  let m;
  if ((m = s.match(/^Arts?\. (\d+[a-z]?)\b/))) return [`Art. ${m[1]}`];
  if ((m = s.match(/^Annex(?:es)? ([IVXLC]+)(?: and ([IVXLC]+))?\b/))) return [`Annex ${m[1]}`, ...(m[2] ? [`Annex ${m[2]}`] : [])];
  if ((m = s.match(/^Recital (\d+)\b/i))) return [`Recital ${m[1]}`];
  return null;
}

/** A locator parsed: the units it names, and the segments it could not read. */
export function parseLocator(locator) {
  const units = [];
  const unresolved = [];
  for (const seg of segments(locator)) {
    const u = unitsOf(seg);
    if (u) units.push(...u); else unresolved.push(seg);
  }
  return { units, unresolved };
}

/** The Article a provision names, or null when its number is an Article of ANOTHER act
 *  ("5a (of Regulation (EU) No 910/2014, as inserted)"), which this check cannot place. */
export function provisionArticle(number) {
  const n = String(number ?? '');
  if (/\(of /.test(n)) return null;
  const m = n.match(/^(\d+[a-z]?)/);
  return m ? `Art. ${m[1]}` : null;
}

/** A source's CELEX, read from its URL: a CELEX URL directly, an ELI of a Union act converted
 *  deterministically (reg → R, dir → L, dec → D, number padded to four digits), else null. */
export function celexOf(url) {
  const u = String(url ?? '');
  let m;
  if ((m = u.match(/celex[/:=]([0-9A-Z]+(?:%28\d+%29|\(\d+\))?)/i))) return m[1].replace('%28', '(').replace('%29', ')');
  if ((m = u.match(/\/eli\/(reg|dir|dec)(?:_impl|_del)?\/(\d{4})\/(\d+)/))) {
    return `3${m[2]}${{ reg: 'R', dir: 'L', dec: 'D' }[m[1]]}${m[3].padStart(4, '0')}`;
  }
  return null;
}

/** The bold titles of roadmap §8's rows, in order: the text between the first ** pair of the
 *  second column. Read from "## 8 · Approval record" onward, so no other table is mistaken for it. */
export function roadmapTitles(roadmap) {
  const text = String(roadmap ?? '');
  const at = text.indexOf('## 8 · Approval record');
  if (at < 0) return null;
  return [...text.slice(at).matchAll(/^\| [^|\n]*\| \*\*([^*\n]+)\*\*/gm)].map((m) => m[1]);
}

/** Roadmap §8 rows written before the title convention, which have no leading bold title and are never
 *  rewritten (a past record is annotated, not edited). Frozen on 4 Nov 2026 by date and first words
 *  (§8, v2 Session 22, 22.4 (b)); this list may only SHRINK. */
export const SECTION8_UNTITLED = Object.freeze([
  Object.freeze(['25 Oct 2026', 'Two decisions only.']),
  Object.freeze(['27 Oct 2026', '— | **D-1:**']),
  Object.freeze(['29 Oct 2026', '**v2 Session 17, 17.0 question 7: the flip of the `rule-*` BACKLOG']),
]);

/**
 * The §8 title check (22.4 (b)): every dated row of roadmap §8 opens its second column with a bold
 * title, and no title occurs twice — the property A-6 relies on to resolve a decision to one row.
 * It cannot check that the author said what a row says. Returns { errors, warnings }.
 */
export function roadmapAudit(roadmap) {
  const errors = [];
  const warnings = [];
  const text = String(roadmap ?? '');
  const at = text.indexOf('## 8 · Approval record');
  if (roadmap == null || at < 0) {
    warnings.push('ROADMAP_NOT_READ docs/ROADMAP-v2.md §8 could not be read: its titles were not checked');
    return { errors, warnings };
  }
  const rows = text.slice(at).split('\n').filter((l) => /^\| \d{1,2} [A-Z][a-z]{2} \d{4} \|/.test(l));
  const frozen = SECTION8_UNTITLED.map(([date, starts]) => ({ date, starts, seen: false }));
  const seen = new Map();
  for (const row of rows) {
    const m = row.match(/^\| ([^|\n]*) \| \*\*([^*\n]+)\*\*/);
    const date = row.match(/^\| ([^|]+?) \|/)[1];
    const body = row.slice(row.indexOf('|', 2) + 2);
    const f = frozen.find((x) => x.date === date && body.startsWith(x.starts));
    if (f) { f.seen = true; continue; }
    if (!m) { errors.push(`P-10 roadmap §8: the row of ${date} beginning «${body.slice(0, 60)}» has no leading bold title`); continue; }
    if (seen.has(m[2])) errors.push(`P-10 roadmap §8: the title «${m[2]}» occurs twice (${seen.get(m[2])} and ${date}) — a decision cited by it resolves to no single row`);
    else seen.set(m[2], date);
  }
  for (const f of frozen) if (!f.seen)
    errors.push(`P-10 roadmap §8: the frozen untitled row of ${f.date} «${f.starts}» is no longer there as frozen — remove it from SECTION8_UNTITLED (the list only shrinks), or restore the row`);
  return { errors, warnings };
}

/**
 * @param db       the datasets, keyed by file name (applicability, sources, instruments)
 * @param roadmap  the text of docs/ROADMAP-v2.md, or null if it could not be read
 * @returns { errors, warnings, attested: [ids] }
 */
export function attestationAudit(db, roadmap) {
  const errors = [];
  const warnings = [];
  const attested = [];
  const sources = new Map(arr(db.sources?.sources).map((s) => [s.id, s]));
  const provisions = new Map();
  for (const i of arr(db.instruments?.instruments)) for (const p of arr(i.provisions)) provisions.set(p.id, p);
  const tier1 = (id) => sources.get(id)?.tier === TIER_1;
  let titles;

  for (const r of arr(db.applicability?.rules)) {
    const w = `applicability/${r.id}`;
    const a = r.attestation;

    /* A-3 · a reading after the form exists, with no form */
    if (a === undefined || a === null) {
      if (typeof r.last_verified === 'string' && r.last_verified > FORM_FROM)
        errors.push(`A-3 ${w}: last_verified ${r.last_verified} is after ${FORM_FROM} and the rule carries no attestation — a new date with no attestation is a silenced prompt, not a closure (docs/RULE-MAINTENANCE.md §4)`);
      continue;
    }
    attested.push(r.id);

    /* A-1 · the shape */
    if (typeof a !== 'object' || Array.isArray(a)) { errors.push(`A-1 ${w}: attestation is not an object`); continue; }
    const keys = Object.keys(a);
    for (const k of keys) if (!ATTESTATION_KEYS.includes(k)) errors.push(`A-1 ${w}: attestation has an unknown key "${k}" — the form has ${ATTESTATION_KEYS.join(', ')}`);
    for (const k of ATTESTATION_KEYS) if (!keys.includes(k)) errors.push(`A-1 ${w}: attestation has no "${k}"`);
    if (!(typeof a.of === 'string' && ISO.test(a.of))) errors.push(`A-1 ${w}: attestation.of is not YYYY-MM-DD`);
    if (!OUTCOMES.includes(a.outcome)) errors.push(`A-1 ${w}: attestation.outcome ${JSON.stringify(a.outcome)} is not one of ${OUTCOMES.join(', ')}`);
    if (!Array.isArray(a.read) || !a.read.length) errors.push(`A-1 ${w}: attestation.read is not a non-empty list`);
    if (!Array.isArray(a.queried)) errors.push(`A-1 ${w}: attestation.queried is not a list`);
    if (!Array.isArray(a.decisions)) errors.push(`A-1 ${w}: attestation.decisions is not a list`);

    const read = new Map();
    for (const [n, x] of arr(a.read).entries()) {
      if (!x || typeof x !== 'object' || typeof x.source_id !== 'string' || typeof x.locator !== 'string' || !x.locator.trim()
        || Object.keys(x).some((k) => k !== 'source_id' && k !== 'locator')) {
        errors.push(`A-1 ${w}: attestation.read[${n}] is not {source_id, locator}`);
        continue;
      }
      if (!sources.has(x.source_id)) errors.push(`A-1 ${w}: attestation.read[${n}] names "${x.source_id}", which is not a source`);
      const p = parseLocator(x.locator);
      if (tier1(x.source_id)) for (const s of p.unresolved) warnings.push(`ATTESTATION_NOT_CHECKABLE ${w}: read ${x.source_id} «${s}» names no Article, Annex or Recital the check can read`);
      read.set(x.source_id, new Set([...(read.get(x.source_id) ?? []), ...p.units]));
    }
    for (const q of arr(a.queried)) {
      if (typeof q !== 'string' || !sources.has(q)) errors.push(`A-1 ${w}: attestation.queried names ${JSON.stringify(q)}, which is not a source`);
      else if (!read.has(q)) errors.push(`A-1 ${w}: attestation.queried names ${q}, which attestation.read does not — a text queried and not read`);
    }

    /* A-2 · the seal */
    if (a.of !== r.last_verified)
      errors.push(`A-2 ${w}: attestation.of ${a.of} ≠ last_verified ${r.last_verified} — the attestation is of another reading; rewrite it with the reading that moved the date`);

    /* A-4 · every Article cited on a tier-1 text was read */
    const cited = [
      ...arr(r.sources).filter((s) => s && typeof s === 'object').map((s) => [s.source_id, s.locator, 'sources']),
      ...arr(r.exemptions).flatMap((e) => arr(e?.basis).map((b) => [b.source_id, b.locator, 'exemption'])),
    ];
    for (const [sid, loc, where] of cited) {
      if (!tier1(sid)) {
        if (!read.has(sid)) warnings.push(`ATTESTATION_NOT_CHECKABLE ${w}: the rule cites ${sid} (not tier-1) in ${where}, and attestation.read does not name it`);
        continue;
      }
      const p = parseLocator(loc);
      for (const s of p.unresolved) warnings.push(`ATTESTATION_NOT_CHECKABLE ${w}: ${where} ${sid} «${s}» names no Article, Annex or Recital the check can read`);
      for (const u of p.units) if (!read.get(sid)?.has(u))
        errors.push(`A-4 ${w}: ${u} of ${sid}, cited in ${where} («${loc}»), is not in attestation.read — a rule is closed only if every Article it cites was read`);
    }
    const provIds = [...new Set([...arr(r.obligations), ...Object.values(r.condition_provisions ?? {}).flatMap(arr)])];
    for (const id of provIds) {
      const p = provisions.get(id);
      const art = provisionArticle(p?.number);
      const texts = arr(p?.sources).filter(tier1);
      if (!art || !texts.length) { warnings.push(`ATTESTATION_NOT_CHECKABLE ${w}: provision ${id}${p ? ` ("${p.number}")` : ''} cannot be placed in a tier-1 text`); continue; }
      if (!texts.some((t) => read.get(t)?.has(art)))
        errors.push(`A-4 ${w}: provision ${id} (${art} of ${texts.join(' or ')}) is not in attestation.read`);
    }

    /* A-5 · every tier-1 text the rule's sources cite was queried (P-09 is part of P-08) */
    const queried = new Set(arr(a.queried));
    for (const sid of new Set(arr(r.sources).map((s) => s?.source_id).filter(tier1)))
      if (!queried.has(sid)) errors.push(`A-5 ${w}: ${sid}, a tier-1 text in the rule's sources, is not in attestation.queried — its amending acts and corrigenda were not declared asked`);

    /* A-6 · the decisions are roadmap §8 rows */
    if (a.outcome === 'changed' && !arr(a.decisions).length)
      errors.push(`A-6 ${w}: outcome "changed" names no roadmap §8 decision`);
    if (arr(a.decisions).length) {
      if (titles === undefined) titles = roadmapTitles(roadmap);
      if (titles === null) errors.push(`A-6 ${w}: docs/ROADMAP-v2.md §8 could not be read, so no decision title can be checked`);
      else for (const t of arr(a.decisions)) {
        const n = titles.filter((x) => x === t).length;
        if (n !== 1) errors.push(`A-6 ${w}: decision ${JSON.stringify(t)} matches ${n} roadmap §8 rows, not exactly one`);
      }
    }

    /* A-7 · the note names each tier-1 text read, by CELEX */
    const note = String(r.verification_note ?? '');
    for (const sid of read.keys()) {
      if (!tier1(sid)) continue;
      const celex = celexOf(sources.get(sid)?.url);
      if (!celex) warnings.push(`ATTESTATION_NOT_CHECKABLE ${w}: ${sid} was read, and its URL yields no CELEX to look for in the note`);
      else if (!note.includes(celex)) errors.push(`A-7 ${w}: the verification_note does not name ${celex} (${sid}), which attestation.read says was read`);
    }
  }
  return { errors, warnings, attested };
}

/**
 * What the parser resolves on the rules' own locators: the measure docs/ATTESTATION-FORM.md §4
 * reports, taken with this module's parser rather than a scratch one.
 */
export function locatorMeasure(db) {
  const sources = new Map(arr(db.sources?.sources).map((s) => [s.id, s]));
  const provisions = new Map();
  for (const i of arr(db.instruments?.instruments)) for (const p of arr(i.provisions)) provisions.set(p.id, p);
  const out = { rules: 0, rules_resolved: 0, tier1_locators: 0, tier1_segments: 0, resolved_segments: 0, unresolved: [],
    tier2_locators: 0, provision_refs: 0, provisions_placed: 0, provisions_unplaced: [] };
  for (const r of arr(db.applicability?.rules)) {
    out.rules++;
    let all = true;
    const locs = [...arr(r.sources).map((s) => [s.source_id, s.locator]),
      ...arr(r.exemptions).flatMap((e) => arr(e?.basis).map((b) => [b.source_id, b.locator]))];
    for (const [sid, loc] of locs) {
      if (sources.get(sid)?.tier !== TIER_1) { out.tier2_locators++; continue; }
      out.tier1_locators++;
      const p = parseLocator(loc);
      out.tier1_segments += segments(loc).length;
      out.resolved_segments += segments(loc).length - p.unresolved.length;
      for (const s of p.unresolved) { out.unresolved.push(`${r.id} ${sid} «${s}»`); all = false; }
    }
    for (const id of new Set([...arr(r.obligations), ...Object.values(r.condition_provisions ?? {}).flatMap(arr)])) {
      out.provision_refs++;
      const p = provisions.get(id);
      if (provisionArticle(p?.number) && arr(p?.sources).some((s) => sources.get(s)?.tier === TIER_1)) out.provisions_placed++;
      else out.provisions_unplaced.push(`${r.id} ${id}`);
    }
    if (all) out.rules_resolved++;
  }
  return out;
}

/**
 * The reading packet (v2 Session 22, 22.4 (a); docs/ROADMAP-v2.md §8): what a closure of one rule must
 * read, derived from the rule's record — the texts and Articles A-4 will require, the texts A-5 will
 * require queried, the tier-2 sources it cites, and what A-8 cannot check. It prints NO attestation
 * skeleton: a form that arrives pre-filled claims a reading before anyone has made it. It reads the
 * records only; it fetches nothing and writes nothing.
 */
export function readingPacket(db, ruleId) {
  const rule = arr(db.applicability?.rules).find((r) => r.id === ruleId);
  if (!rule) return null;
  const sources = new Map(arr(db.sources?.sources).map((s) => [s.id, s]));
  const provisions = new Map();
  for (const i of arr(db.instruments?.instruments)) for (const p of arr(i.provisions)) provisions.set(p.id, p);
  const tier1 = (id) => sources.get(id)?.tier === TIER_1;
  const texts = new Map();
  const add = (sid, unit) => { if (!texts.has(sid)) texts.set(sid, new Set()); if (unit) texts.get(sid).add(unit); };
  const notCheckable = [];
  const tier2 = new Set();
  for (const [sid, loc] of [...arr(rule.sources).map((s) => [s.source_id, s.locator]),
    ...arr(rule.exemptions).flatMap((e) => arr(e?.basis).map((b) => [b.source_id, b.locator]))]) {
    if (!tier1(sid)) { tier2.add(sid); continue; }
    const p = parseLocator(loc);
    add(sid);
    p.units.forEach((u) => add(sid, u));
    p.unresolved.forEach((s) => notCheckable.push(`${sid} «${s}»`));
  }
  const anyOf = [];
  for (const id of new Set([...arr(rule.obligations), ...Object.values(rule.condition_provisions ?? {}).flatMap(arr)])) {
    const p = provisions.get(id);
    const art = provisionArticle(p?.number);
    const ts = arr(p?.sources).filter(tier1);
    if (!art || !ts.length) { notCheckable.push(`provision ${id}${p ? ` ("${p.number}")` : ''}`); continue; }
    if (ts.length === 1) add(ts[0], art);
    else if (!ts.some((t) => texts.get(t)?.has(art))) anyOf.push({ provision: id, article: art, in_any_of: ts });
  }
  const order = (u) => { const m = u.match(/^(Art|Annex|Recital)\.? (\d+|[IVXLC]+)([a-z]?)/); return m ? [{ Art: 0, Annex: 1, Recital: 2 }[m[1]], /^\d+$/.test(m[2]) ? Number(m[2]) : m[2], m[3]] : [9, u, '']; };
  const sortUnits = (xs) => [...xs].sort((a, b) => { const x = order(a), y = order(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; });
  return {
    rule: rule.id,
    last_verified: rule.last_verified,
    read: [...texts].map(([source_id, units]) => ({ source_id, celex: celexOf(sources.get(source_id)?.url), articles: sortUnits(units) })),
    read_any_of: anyOf,
    query: [...new Set(arr(rule.sources).map((s) => s?.source_id).filter(tier1))],
    tier2: [...tier2],
    not_checkable: notCheckable,
  };
}

/* The command line: `node tools/attestation-audit.mjs packet <rule-id>`. Reads data/, prints, exits. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const [verb, id] = process.argv.slice(2);
  const { readFileSync, readdirSync } = await import('node:fs');
  const db = Object.fromEntries(readdirSync('data').filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(`data/${f}`, 'utf8'))]));
  if (verb !== 'packet' || !id) { console.error('usage: node tools/attestation-audit.mjs packet <rule-id>'); process.exit(2); }
  const p = readingPacket(db, id);
  if (!p) { console.error(`no rule "${id}" in data/applicability.json`); process.exit(2); }
  const L = [`READING PACKET  ${p.rule}  (last_verified ${p.last_verified}; a closure after ${FORM_FROM} must carry an attestation)`, ''];
  L.push('Read, in the Official Journal text retrieved by CELEX — every Article below is required by A-4:');
  for (const r of p.read) L.push(`  ${r.source_id}  ${r.celex ?? '(no CELEX in its URL: A-8)'}  ${r.articles.join('; ') || '(no Article cited)'}`);
  for (const a of p.read_any_of) L.push(`  ${a.article} in any one of ${a.in_any_of.join(', ')}  (provision ${a.provision})`);
  L.push('', 'Query for amending acts and corrigenda — required by A-5:', `  ${p.query.join(', ') || '(none)'}`);
  L.push('', 'Tier-2 sources the rule cites — name them in read if re-read (A-8 warns otherwise):', `  ${p.tier2.join(', ') || '(none)'}`);
  L.push('', 'What the checks cannot resolve (A-8) — read them all the same:', ...(p.not_checkable.length ? p.not_checkable.map((x) => `  ${x}`) : ['  (nothing)']));
  L.push('', 'This lists what the record cites. It is not a reading, it fetches nothing, and it writes nothing (docs/ATTESTATION-FORM.md §6).');
  console.log(L.join('\n'));
}
