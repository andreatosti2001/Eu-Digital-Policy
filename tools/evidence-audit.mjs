#!/usr/bin/env node
/**
 * tools/evidence-audit.mjs — the evidence model, checked and measured.
 *
 * validate.mjs asks whether the records RESOLVE. This asks what they can
 * CARRY, and whether the prose of the brief is accounted for by them:
 *
 *   1. CLAIMS        type · evidence status · grade · locators · composite
 *                    statements · derivations · attribution · premises
 *   2. REMEDIATION   why each claim is not yet as strong as it could be,
 *                    as taxonomy codes rather than one "unresolved" bucket
 *   3. PROSE         every substantive passage of index.html is either
 *                    registered (data-claim, data-record) or classified
 *                    (data-prose); an unclassified passage is an error
 *   4. SOURCES       the hierarchy: primary law, official, secondary, and
 *                    unofficial reproductions of legal text
 *   5. FRESHNESS     risk class and state per record (fresh · aging ·
 *                    review due · stale)
 *   6. ENFORCEMENT   procedural posture, finality, contradictions
 *   7. REGULATORY    scalar status against the milestones; provision-level
 *                    application dates
 *   8. REGISTER      the exclusion register and the watchlist (item 2.1,
 *                    27 Oct 2026): M-03 … M-07 and R-01, with a BACKLOG for
 *                    the records that predate them (tools/register-audit.mjs)
 *   9. TRIGGERS      the applicability rules behind applies.html, held to
 *                    the claims' standard (v2 Session 12, 28 Oct 2026):
 *                    T-01 … T-11, with a BACKLOG for the 33 rules that
 *                    predate them (tools/trigger-audit.mjs)
 *
 * Every number is DERIVED from the data on each run through the same
 * modules the website uses (js/evidence-model.js, js/format.js,
 * js/pipeline.js, js/regulatory-model.js), so the report and the page
 * cannot disagree. Nothing here writes.
 *
 * Usage:
 *   node tools/evidence-audit.mjs [--as-of YYYY-MM-DD] [--json | --markdown | --graph] [--root DIR] [--record]
 *
 * --record appends one record of the run to tools/evidence-audit-runs/ under
 * the audited tree (git-ignored): what was checked, on which evidence, as of
 * which date, at which commit, with which limits. The Control Room's
 * Editorial audit view reads the latest one. Without --record nothing is
 * written, as before. tools/evidence-audit-record.mjs defines the record;
 * docs/EDITORIAL-AUDIT-PATH.md is the path a person follows.
 *
 * A date that does not parse, or an argument this script does not read
 * (a bare positional date included, which it used to ignore and audit as of
 * today), is refused with exit 2 and the reason (tools/as-of.mjs). Until
 * 27 Oct 2026 `--as-of banana` audited as of "banana" and reported every
 * record stale (docs/AUDIT-2026-10-24.md §3.1).
 *
 * --graph prints the provenance graph as JSON: source -[supports, locator]->
 * claim -[input | premise]-> claim, and passage -[states]-> claim | record.
 * It is derived from the same records on every run and never stored.
 *
 * Exit 1 on an ERROR — a defect in the tree, true on every date. Staleness
 * and the remediation backlog are reported and do not fail the run: they are
 * closed by verification work, never by a commit that edits a check.
 */

import { readFileSync, readdirSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as M from '../js/evidence-model.js';
import { evidenceGrade, GRADE_ORDER } from '../js/format.js';
import { procedure, contradictions as enfContradictions } from '../js/pipeline.js';
import { statusContradictions, statusAge, provisionApplication } from '../js/regulatory-model.js';
import { readArgs, refusalText, today, EXIT_UNREADABLE } from './as-of.mjs';
import { RECORD_VERSION, CHECKED, LIMITS, storeDir, storePath } from './evidence-audit-record.mjs';
import { registerAudit } from './register-audit.mjs';
import { triggerAudit } from './trigger-audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const IS_MAIN = Boolean(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url));
/* The command line is read only when this file is the entry point: an
   importer's arguments are not this script's to judge, and an import gets
   today's date and the repository root, as audit()'s defaults. */
const ARGS = IS_MAIN
  ? (() => {
    const a = readArgs(process.argv.slice(2), { flags: ['--json', '--markdown', '--graph', '--record'], valued: ['--root'] });
    /* --graph prints no audit, so there is nothing to record. */
    return !a.error && a.flags.has('--record') && a.flags.has('--graph') ? { error: '--record records an audit, and --graph prints the provenance graph instead of one. Drop one of the two.' } : a;
  })()
  : { asOf: today(), flags: new Set(), values: {} };
const ROOT = resolve(ARGS.values?.['--root'] || join(HERE, '..'));
const AS_OF = ARGS.asOf ?? null;
const MODE = ARGS.error ? null : ARGS.flags.has('--graph') ? 'graph' : ARGS.flags.has('--json') ? 'json' : ARGS.flags.has('--markdown') ? 'markdown' : 'text';

/* Fields the architecture DERIVES. A record that stores one has created the
   second copy that derivation exists to prevent (docs/DATA-GOVERNANCE.md). */
export const DERIVED_FIELDS = Object.freeze(['evidence_status', 'grade', 'evidence_grade', 'freshness_state',
  'freshness_risk', 'risk', 'finality', 'procedural_stage', 'procedure', 'coverage',
  /* the map and the triggers (docs/V2-DATA-DESIGN.md §1.4, §2; v2 Session 12) */
  'publishable', 'asks', 'modality', 'verification_state']);

/* Remediation codes a person may record, because a machine cannot judge
   them. Every other code is computed and may never be stored. */
export const JUDGED_CODES = Object.freeze(['remediation:claim-too-broad', 'remediation:interpretation-as-fact',
  'remediation:contested', 'remediation:low-value']);

/* ------------------------------------------------------------------ html */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/** A deliberately small HTML walker: elements with their attributes, their
 *  ancestors and their text. Enough for well-formed authored markup, which
 *  is what index.html is; it is not a general HTML parser. */
export function walk(html) {
  const out = [];
  const stack = [];
  const re = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[6] != null) { for (const el of stack) el.text += m[6]; continue; }
    if (!m[3]) continue;
    /* an element boundary is a word boundary: without this, table cells run
       together ("20 Jul 2026AliExpress") and a date stops being a date */
    for (const el of stack) el.text += ' ';
    const tag = m[3].toLowerCase();
    if (m[2] === '/') {
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
      continue;
    }
    const attrs = {};
    for (const a of (m[4] || '').matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
    }
    const el = { tag, attrs, ancestors: stack.slice(), text: '' };
    out.push(el);
    if (!VOID.has(tag) && !m[5]) stack.push(el);
  }
  return out;
}

const PASSAGE_TAGS = new Set(['p', 'li', 'figcaption', 'blockquote', 'dd']);

/**
 * The substantive passages of the brief: the text blocks inside the Parts
 * and Annexes, excluding each Part's own heading block. Tables count by
 * ROW: a row is one statement across its cells.
 */
export function passages(html) {
  const els = walk(html);
  const res = [];
  for (const el of els) {
    const inPart = el.ancestors.find((a) => a.tag === 'section' && /(^|\s)part(\s|$)/.test(a.attrs.class || ''));
    if (!inPart) continue;
    /* a part's own heading block, and any subtree rendered from data at
       runtime ([data-render], [data-mount]): the latter are records, not prose,
       and what they show is checked where the records are */
    if (el.ancestors.some((a) => /(^|\s)(part-head|box-label)(\s|$)/.test(a.attrs.class || '') || a.tag === 'noscript' || a.tag === 'thead' || a.tag === 'svg'
      || 'data-render' in a.attrs || 'data-mount' in a.attrs)) continue;
    const cls = el.attrs.class || '';
    let unit = null;
    if (PASSAGE_TAGS.has(el.tag)) {
      /* a list item inside another counted block is part of that block */
      if (el.ancestors.some((a) => PASSAGE_TAGS.has(a.tag) || /(^|\s)box-body(\s|$)/.test(a.attrs.class || ''))) continue;
      unit = el;
    } else if (el.tag === 'div' && /(^|\s)box-body(\s|$)/.test(cls)) unit = el;
    else if (el.tag === 'tr' && el.ancestors.some((a) => a.tag === 'tbody')) unit = el;
    if (!unit) continue;
    const text = unit.text.replace(/\s+/g, ' ').trim();
    if (text.length < 20) continue;
    const table = unit.tag === 'tr' ? unit.ancestors.slice().reverse().find((a) => a.tag === 'table') : null;
    const from = (k) => unit.attrs[k] || (table && table.attrs[k]) || null;
    res.push({
      part: inPart.attrs.id,
      tag: unit.tag,
      key: unit.attrs['data-i18n'] || (unit.tag === 'tr' ? null : null),
      claim: from('data-claim'),
      record: from('data-record'),
      prose: from('data-prose'),
      text,
    });
  }
  return res;
}

/* ------------------------------------------------------------------ rows vs records */

const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

/** Dates written like "12 Sep 2026" or "Nov 2026", as { iso, precision }. */
export function datesIn(text) {
  const out = [];
  for (const m of String(text).matchAll(/\b(?:(\d{1,2})\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b/g)) {
    const mo = MON[m[2].toLowerCase()];
    out.push(m[1] ? { iso: `${m[3]}-${pad(mo)}-${pad(m[1])}`, precision: 'day' } : { iso: `${m[3]}-${pad(mo)}`, precision: 'month' });
  }
  return out;
}

export function recordMismatches(p, ix, enfById) {
  const out = [];
  const ids = String(p.record).split(/\s+/).filter(Boolean);
  const known = [];
  for (const id of ids) {
    const e = ix.event.get(id);
    if (e) known.push(e.date);
    const r = enfById.get(id);
    if (r) { for (const d of [r.decision_date, r.opened, r.judicial && r.judicial.date]) if (d) known.push(d); }
  }
  if (!known.length) return out;
  /* the row's own date is its leading date — the date column. Later dates in
     the row are about something else ("action plan due by …", "contracts
     concluded before …") and are not the record's. */
  const lead = datesIn(p.text)[0];
  if (lead && !known.some((k) => (lead.precision === 'day' ? k === lead.iso : String(k).startsWith(lead.iso)))) {
    out.push(`the row is dated ${lead.iso}, which none of its linked records (${ids.join(', ')}) carries`);
  }
  const fines = ids.map((id) => enfById.get(id)).filter((r) => r && r.fine_eur != null).map((r) => r.fine_eur);
  if (fines.length) {
    for (const m of p.text.matchAll(/EUR\s?([\d.,]+)\s*(million|billion|m|bn)\b/gi)) {
      const v = Number(m[1].replace(/,/g, '')) * (/^b/i.test(m[2]) ? 1e9 : 1e6);
      if (!fines.some((f) => Math.abs(v - f) <= 0.5e6)) out.push(`the row prints EUR ${m[1]} ${m[2]}, which no linked enforcement record carries (${fines.join(', ')})`);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ rankings */

/**
 * A claim that a record is the largest (or the nth largest) of its kind
 * "to date" is a comparison across records, not a figure any one source
 * states. 21 Oct 2026 (audit item 1): such a claim carries a `ranking`
 * block, and the ranking is RECOMPUTED here from the enforcement records on
 * every run, so it fails the moment a larger record is added rather than
 * going quietly false.
 *
 *   "ranking": { "dataset": "enforcement", "where": { "instrument": "dma" },
 *                "by": "fine_eur", "subject": "enf-…", "rank": 1 }
 *
 * Records whose `by` value is null are not ranked: an unknown amount is not
 * a small one, so a ranking over a set that holds one is reported, not
 * passed. Returns the problems found; an empty list means the claim holds
 * over the records as they stand. Pure.
 */
export function rankingProblems(claim, enforcement) {
  const r = claim && claim.ranking;
  if (!r) return [];
  const out = [];
  if (r.dataset !== 'enforcement') return [`ranking over "${r.dataset}" is not supported (enforcement only)`];
  if (!r.by || !r.subject || !Number.isInteger(r.rank) || r.rank < 1) return ['ranking needs by, subject and a positive integer rank'];
  const where = r.where || {};
  const pool = enforcement.filter((e) => Object.entries(where).every(([k, v]) => e[k] === v));
  const subject = pool.find((e) => e.id === r.subject);
  if (!subject) return [`the subject ${r.subject} is not among the records matching ${JSON.stringify(where)}`];
  /* preliminary findings and commitments carry no fine by their nature;
     only an action that imposes one and records no amount is unknown */
  const unknown = pool.filter((e) => e[r.by] == null && FINE_BEARING.has(e.action_status));
  if (unknown.length) out.push(`${unknown.map((e) => e.id).join(', ')} match but carry no ${r.by}, so the ranking cannot be settled`);
  const sorted = pool.filter((e) => typeof e[r.by] === 'number').sort((a, b) => b[r.by] - a[r.by]);
  const at = sorted.findIndex((e) => e.id === r.subject) + 1;
  if (at !== r.rank) out.push(`${r.subject} ranks ${at || 'nowhere'} by ${r.by} among ${sorted.length} matching records, not ${r.rank} (${sorted.slice(0, 3).map((e) => `${e.id} ${e[r.by]}`).join('; ')})`);
  if (!arr0(claim.enforcement).includes(r.subject)) out.push(`the claim does not list its subject ${r.subject} in its enforcement array`);
  return out;
}
const arr0 = (x) => (Array.isArray(x) ? x : []);
const FINE_BEARING = new Set(['action:imposed', 'action:final', 'action:appealed', 'action:reduced']);

/* ------------------------------------------------------------------ load */

function load(root) {
  const db = {};
  for (const f of readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json'))) {
    db[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
  }
  return db;
}

/* ------------------------------------------------------------------ audit */

export function audit({ root = ROOT, asOf = AS_OF } = {}) {
  const db = load(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const arr = (x) => (Array.isArray(x) ? x : []);

  const tax = db.taxonomy || {};
  const termIds = new Set(Object.values(tax).filter(Array.isArray).flat().map((t) => t.id));
  const claims = arr(db.claims?.claims);
  const sources = arr(db.sources?.sources);
  const enforcement = arr(db.enforcement?.enforcement);
  const events = arr(db.timeline?.events);
  const instruments = arr(db.instruments?.instruments);
  const ix = {
    source: new Map(sources.map((s) => [s.id, s])),
    claim: new Map(claims.map((c) => [c.id, c])),
    event: new Map(events.map((e) => [e.id, e])),
    instrument: new Map(instruments.map((i) => [i.id, i])),
  };
  const enfById = new Map(enforcement.map((e) => [e.id, e]));
  const instById = new Map(instruments.map((i) => [i.id, i]));
  const count = (list, f) => { const m = {}; for (const x of list) for (const v of [].concat(f(x))) m[v] = (m[v] || 0) + 1; return m; };

  /* ---- derived fields must not be stored anywhere ---- */
  const scan = (name, list) => { for (const r of list) for (const k of DERIVED_FIELDS) if (k in r) err(`${name}/${r.id} stores "${k}", which is derived at render time and must never be stored`); };
  scan('claims', claims); scan('enforcement', enforcement); scan('timeline', events); scan('instruments', instruments); scan('sources', sources);
  scan('applicability', arr(db.applicability?.rules));

  /* ---- 1. claims ---- */
  const directRefs = [];
  for (const c of claims) {
    const kind = M.claimKind(c);
    if (!M.CLAIM_KINDS[kind]) err(`claims/${c.id}: type "${c.type}" has no entry in js/evidence-model.js CLAIM_KINDS`);
    for (const s of arr(c.sources)) {
      if (s.supports !== 'supports:direct' || s.source_id === M.SELF_SOURCE_ID) continue;
      const src = ix.source.get(s.source_id);
      const q = M.locatorQuality(s.locator);
      directRefs.push({ claim: c.id, kind, source: s.source_id, tier: src && src.tier, quality: q });
      if (kind === 'law' && src && src.tier === 'tier:1' && !src.reproduces && q !== 'structural'
        && /regulation|legislative-document/.test(src.type)) {
        err(`claims/${c.id}: a claim of law cites ${s.source_id} (the legal text) as direct support without an article, recital or annex locator ("${s.locator ?? ''}")`);
      }
    }
    if (kind === 'derived' || c.derivation) {
      const r = M.checkDerivation(c, ix);
      if (!r.ok) err(`claims/${c.id}: derivation does not check — ${r.problems.join('; ')}`);
    }
    for (const m of rankingProblems(c, enforcement)) err(`claims/${c.id}: ranking does not hold — ${m}`);
    if (kind === 'attributed' && !c.attributed_to) err(`claims/${c.id}: an attributed view must name whose view it is (attributed_to)`);
    if (c.attributed_to && kind !== 'attributed') err(`claims/${c.id}: attributed_to on a claim typed ${kind}`);
    for (const p of arr(c.premises)) {
      const pc = ix.claim.get(p);
      if (!pc) err(`claims/${c.id}: premise ${p} does not exist`);
      else if (!M.owesVerification(pc)) warn(`claims/${c.id}: premise ${p} is itself an argument — an inference built on an inference`);
    }
    if (c.premises && M.owesVerification(c)) err(`claims/${c.id}: premises are recorded for arguments only; a ${kind} claim is carried by its sources`);
    if (c.contested) {
      if (!c.contested.note) err(`claims/${c.id}: contested without a note saying what is disputed`);
      for (const s of arr(c.contested.sources)) if (!ix.source.has(s)) err(`claims/${c.id}: contested source ${s} does not exist`);
    }
    for (const code of arr(c.remediation)) {
      if (!termIds.has(code)) err(`claims/${c.id}: remediation code ${code} is not in taxonomy.json`);
      else if (!JUDGED_CODES.includes(code)) err(`claims/${c.id}: stores ${code}, which is computed — only judged codes (${JUDGED_CODES.join(', ')}) may be recorded`);
    }
  }
  const composite = claims.map((c) => ({ id: c.id, ...M.compositeSignals(c.statement) })).filter((x) => x.flagged);
  for (const x of composite) warn(`POSSIBLY_COMPOSITE_CLAIM ${x.id} — ${x.signals.join('; ')}`);
  const noLocator = directRefs.filter((r) => r.quality === 'none' || r.quality === 'generic');
  for (const r of noLocator) if (!(r.kind === 'law' && r.tier === 'tier:1')) warn(`DIRECT_CLAIM_WITHOUT_LOCATOR ${r.claim} → ${r.source}`);

  const remediation = new Map(claims.map((c) => [c.id, M.remediationCodes(c, ix, { asOf, enforcementById: enfById, instrumentById: instById })]));
  const owing = claims.filter((c) => M.owesVerification(c));
  const noExternalDirect = claims.filter((c) => M.evidenceStatus(c) !== 'evidence:direct' && M.evidenceStatus(c) !== 'evidence:derived');

  /* ---- 2. prose ---- */
  const ps = passages(html);
  const prosePassages = [];
  for (const p of ps) {
    const where = `${p.part}${p.key ? ' ' + p.key : ''}`;
    for (const id of (p.claim || '').split(/\s+/).filter(Boolean)) if (!ix.claim.has(id)) err(`index.html ${where}: data-claim "${id}" is not a claim`);
    for (const id of (p.record || '').split(/\s+/).filter(Boolean)) {
      if (!ix.event.has(id) && !enfById.has(id) && !ix.instrument.has(id)) err(`index.html ${where}: data-record "${id}" is not a timeline, enforcement or instrument record`);
    }
    if (p.prose && !termIds.has(p.prose)) err(`index.html ${where}: data-prose "${p.prose}" is not in taxonomy.json prose_class`);
    /* A table row that restates canonical records is a second home for their
       dates and amounts. Linking it is what lets that home be CHECKED: every
       date the row prints must be a date one of its records carries, and a
       fine it prints must be the fine its enforcement record carries. */
    if (p.record && p.tag === 'tr') for (const m of recordMismatches(p, ix, enfById)) err(`index.html ${where}: ${m}`);
    const cls = p.claim ? 'registered-claim' : p.record ? 'registered-record' : p.prose ? 'classified' : 'unclassified';
    if (cls === 'unclassified') err(`index.html ${where}: substantive passage is neither registered nor classified — "${p.text.slice(0, 90)}…"`);
    const kinds = (p.claim || '').split(/\s+/).filter(Boolean).map((id) => ix.claim.get(id)).filter(Boolean).map((c) => M.kindInfo(c).family);
    const analytical = p.prose ? /synthesis|critique|recommendation/.test(p.prose) : kinds.length > 0 && kinds.every((f) => f === 'argument');
    prosePassages.push({ ...p, cls, analytical });
  }
  const reg = prosePassages.filter((p) => p.cls.startsWith('registered')).length;
  const exempt = prosePassages.filter((p) => p.cls === 'classified').length;
  const uncl = prosePassages.filter((p) => p.cls === 'unclassified');

  /* ---- 3. sources ---- */
  for (const s of sources) {
    if (!s.reproduces) continue;
    const t = ix.source.get(s.reproduces);
    if (!t) err(`sources/${s.id}: reproduces ${s.reproduces}, which does not exist`);
    else if (t.tier !== 'tier:1') err(`sources/${s.id}: reproduces ${s.reproduces}, which is not a tier-1 legal text`);
    if (s.tier === 'tier:1' || s.tier === 'tier:2') err(`sources/${s.id}: an unofficial reproduction cannot carry tier ${s.tier} — the tier belongs to the canonical text it reproduces`);
  }
  const cited = new Set();
  for (const c of claims) for (const s of arr(c.sources)) cited.add(s.source_id);

  /* ---- 4. freshness ---- */
  const fresh = (kind, list, dateOf) => {
    const rows = list.map((r) => {
      const risk = M.riskClass(kind, r, { asOf, enforcementById: enfById, instrumentById: instById });
      return { id: r.id, risk, state: M.freshnessState(dateOf(r), risk, asOf) };
    });
    return { byRisk: count(rows, (r) => r.risk), byState: count(rows, (r) => r.state),
      due: rows.filter((r) => r.state === 'freshness:review-due' || r.state === 'freshness:stale') };
  };
  const freshness = {
    claims: fresh('claim', claims, (r) => r.last_verified),
    enforcement: fresh('enforcement', enforcement, (r) => r.last_verified),
    events: fresh('event', events, (r) => r.last_verified),
    instruments: fresh('instrument', instruments, (r) => r.last_verified),
  };

  /* ---- 5. enforcement ---- */
  const procs = enforcement.map((e) => ({ id: e.id, ...procedure(e), contradictions: enfContradictions(e) }));
  for (const p of procs) for (const c of p.contradictions) err(`enforcement/${p.id}: ${c}`);

  /* ---- 6. regulatory ---- */
  let provTotal = 0; const provState = {};
  for (const i of instruments) {
    for (const c of statusContradictions(i, ix, asOf)) err(`instruments/${i.id}: ${c}`);
    const aged = statusAge(i, ix, asOf);
    if (aged) warn(`STATUS_PREDATES_MILESTONE instruments/${i.id}: status_as_of ${i.status_as_of}, and since then ${aged.map((e) => e.date + ' ' + e.event_type.split(':').pop()).join(', ')} — re-read the status against the milestones`);
    for (const p of arr(i.provisions)) {
      provTotal++;
      const st = provisionApplication(p.id, i, ix, asOf).state;
      provState[st] = (provState[st] || 0) + 1;
    }
  }
  /* ---- 7. register and watchlist ---- */
  const regAudit = registerAudit(db, asOf);
  for (const e of regAudit.errors) err(e);
  for (const w of regAudit.warnings) warn(w);

  /* ---- 8. triggers: the applicability rules ---- */
  const trig = triggerAudit(db, asOf);
  for (const e of trig.errors) err(e);
  for (const w of trig.warnings) warn(w);

  const lifecycle = instruments.filter((i) => {
    const t = new Set(arr(i.milestones).map((m) => ix.event.get(m)).filter(Boolean).map((e) => e.event_type));
    return t.has('event:adoption') && t.has('event:publication') && t.has('event:entry-into-force');
  }).length;

  const report = {
    as_of: asOf,
    root,
    claims: {
      total: claims.length,
      by_type: count(claims, (c) => M.claimKind(c)),
      by_evidence_status: count(claims, (c) => M.evidenceStatus(c)),
      by_grade: Object.fromEntries(GRADE_ORDER.map((g) => [g, claims.filter((c) => evidenceGrade(c, ix).id === g).length])),
      owe_verification: owing.length,
      no_external_direct_source: noExternalDirect.length,
      unverified_owing: owing.filter((c) => M.evidenceStatus(c) === 'evidence:unverified').length,
      direct_refs: directRefs.length,
      direct_refs_without_locator: noLocator.length,
      locator_quality: count(directRefs, (r) => r.quality),
      possibly_composite: composite.map((x) => x.id),
      derived: claims.filter((c) => M.claimKind(c) === 'derived').map((c) => ({ id: c.id, ok: M.checkDerivation(c, ix).ok })),
      attributed: claims.filter((c) => M.claimKind(c) === 'attributed').length,
      with_premises: claims.filter((c) => arr(c.premises).length).length,
      contested: claims.filter((c) => c.contested).length,
    },
    remediation: {
      by_code: count([...remediation.values()], (codes) => codes),
      owing_with_no_code: owing.filter((c) => !remediation.get(c.id).length).length,
      backlog: owing.filter((c) => remediation.get(c.id).length).map((c) => ({ id: c.id, codes: remediation.get(c.id) })),
    },
    prose: {
      total: prosePassages.length,
      registered: reg,
      registered_by_claim: prosePassages.filter((p) => p.cls === 'registered-claim').length,
      registered_by_record: prosePassages.filter((p) => p.cls === 'registered-record').length,
      classified_not_registered: exempt,
      unclassified: uncl.length,
      coverage_pct: prosePassages.length ? Math.round(((reg + exempt) / prosePassages.length) * 1000) / 10 : 100,
      by_prose_class: count(prosePassages.filter((p) => p.prose), (p) => p.prose),
      analytical: prosePassages.filter((p) => p.analytical).length,
      analytical_classified: prosePassages.filter((p) => p.analytical && p.cls !== 'unclassified').length,
      factual: prosePassages.filter((p) => !p.analytical && p.cls !== 'classified').length,
    },
    sources: {
      total: sources.length,
      by_tier: count(sources, (s) => s.tier),
      primary_or_official: sources.filter((s) => s.tier === 'tier:1' || s.tier === 'tier:2').length,
      secondary: sources.filter((s) => s.tier === 'tier:3' || s.tier === 'tier:4').length,
      unofficial_reproductions: sources.filter((s) => s.reproduces).length,
      cited_by_claims: cited.size,
    },
    freshness: Object.fromEntries(Object.entries(freshness).map(([k, v]) => [k, { by_risk: v.byRisk, by_state: v.byState, due: v.due.length }])),
    enforcement: {
      total: enforcement.length,
      by_procedure: count(procs, (p) => p.stage),
      by_finality: count(procs, (p) => p.finality || 'n/a'),
      contradictions: procs.reduce((n, p) => n + p.contradictions.length, 0),
    },
    regulatory: {
      instruments: instruments.length,
      with_full_lifecycle: lifecycle,
      provisions: provTotal,
      provision_application: provState,
    },
    register: {
      by_coverage: regAudit.by_coverage,
      register: regAudit.register,
      watchlist: regAudit.watchlist,
      backlog: regAudit.backlog,
    },
    triggers: {
      total: trig.total,
      by_outcome: trig.by_outcome,
      publishable: trig.publishable,
      backlog: trig.backlog,
    },
    errors,
    warnings,
  };
  return report;
}

/* ------------------------------------------------------------------ graph */

/** The provenance graph, as nodes and edges. Every edge already exists in
 *  the records; this only puts them side by side. */
export function graph({ root = ROOT } = {}) {
  const db = load(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const claims = db.claims?.claims || [];
  const nodes = []; const edges = [];
  for (const s of db.sources?.sources || []) nodes.push({ id: s.id, kind: 'source', tier: s.tier, reproduces: s.reproduces || null });
  for (const c of claims) {
    nodes.push({ id: c.id, kind: 'claim', type: M.claimKind(c), evidence: M.evidenceStatus(c) });
    for (const r of c.sources || []) edges.push({ from: r.source_id, to: c.id, rel: r.supports.split(':')[1], locator: r.locator ?? null });
    for (const [name, inp] of Object.entries((c.derivation && c.derivation.inputs) || {})) edges.push({ from: inp.claim, to: c.id, rel: 'input', as: name });
    for (const p of c.premises || []) edges.push({ from: p, to: c.id, rel: 'premise' });
  }
  passages(html).forEach((p, i) => {
    const id = `passage:${p.part}:${p.key || i}`;
    nodes.push({ id, kind: 'passage', prose: p.prose || null });
    for (const c of (p.claim || '').split(/\s+/).filter(Boolean)) edges.push({ from: id, to: c, rel: 'states' });
    for (const r of (p.record || '').split(/\s+/).filter(Boolean)) edges.push({ from: id, to: r, rel: 'restates' });
  });
  return { nodes, edges };
}

/* ------------------------------------------------------------------ record */

const sha256File = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

/** The commit the audited tree is at, and whether the tree matched it. */
function commitOf(root) {
  try {
    const sha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n').filter(Boolean).map((l) => l.slice(3));
    return { sha, tree_clean: dirty.length === 0, uncommitted: dirty.slice(0, 50), uncommitted_total: dirty.length, why: null };
  } catch {
    return { sha: null, tree_clean: null, uncommitted: [], uncommitted_total: null, why: 'the audited tree is not a git checkout, or git is not available, so no commit can be named' };
  }
}

/**
 * One record of one run (tools/evidence-audit-record.mjs). Everything in
 * it is either fixed text (CHECKED, LIMITS) or measured on this run; none
 * of it is a judgement this tool did not make.
 */
export function recordEntry(r, { root = ROOT, argv = [], now = () => new Date().toISOString() } = {}) {
  const dataFiles = readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json')).sort();
  const rules = ['tools/evidence-audit.mjs', 'tools/register-audit.mjs', 'tools/trigger-audit.mjs', 'js/evidence-model.js', 'js/format.js', 'js/pipeline.js', 'js/regulatory-model.js'];
  return {
    record_version: RECORD_VERSION,
    tool: 'tools/evidence-audit.mjs',
    recorded_at: now(),
    as_of: r.as_of,
    commit: commitOf(root),
    command: ['node', 'tools/evidence-audit.mjs', ...argv].join(' '),
    checked: CHECKED,
    evidence: {
      /* The records and the prose the run read, by content hash, so a
         reader can tell whether a later tree is the same evidence. */
      read: [...dataFiles.map((f) => `data/${f}`), 'index.html'].map((f) => ({ path: f, sha256: sha256File(join(root, f)) })),
      /* The rules it applied, from the tool's own tree. */
      rules: rules.map((f) => ({ path: f, sha256: sha256File(join(HERE, '..', f)) })),
      counts: {
        claims: r.claims.total, sources: r.sources.total, substantive_passages: r.prose.total,
        enforcement_records: r.enforcement.total, instruments: r.regulatory.instruments, provisions: r.regulatory.provisions,
      },
    },
    findings: { errors: r.errors, warnings: r.warnings },
    summary: {
      claims: { by_evidence_status: r.claims.by_evidence_status, by_grade: r.claims.by_grade, unverified_owing: r.claims.unverified_owing, owe_verification: r.claims.owe_verification, direct_refs_without_locator: r.claims.direct_refs_without_locator, direct_refs: r.claims.direct_refs },
      remediation: r.remediation.by_code,
      prose: { registered: r.prose.registered, classified_not_registered: r.prose.classified_not_registered, unclassified: r.prose.unclassified, coverage_pct: r.prose.coverage_pct },
      freshness: r.freshness,
      enforcement: { by_finality: r.enforcement.by_finality, contradictions: r.enforcement.contradictions },
      regulatory: { provision_application: r.regulatory.provision_application },
      triggers: { total: r.triggers.total, publishable: r.triggers.publishable.length, backlog: Object.fromEntries(Object.entries(r.triggers.backlog).map(([c, ids]) => [c, ids.length])) },
    },
    limits: LIMITS,
  };
}

/* ------------------------------------------------------------------ output */

function kv(o) { return Object.entries(o).map(([k, v]) => `${String(k).split(':').pop()} ${v}`).join(' · '); }

function text(r) {
  const L = [];
  L.push(`EVIDENCE AUDIT  as of ${r.as_of}`);
  L.push('='.repeat(64));
  L.push(`CLAIMS          ${r.claims.total}   ${kv(r.claims.by_type)}`);
  L.push(`  evidence      ${kv(r.claims.by_evidence_status)}`);
  L.push(`  grade         ${kv(r.claims.by_grade)}`);
  L.push(`  owe verification ${r.claims.owe_verification}; of those unverified ${r.claims.unverified_owing}`);
  L.push(`  direct refs   ${r.claims.direct_refs}; without a usable locator ${r.claims.direct_refs_without_locator}   (${kv(r.claims.locator_quality)})`);
  L.push(`  derived       ${r.claims.derived.length} (${r.claims.derived.filter((d) => d.ok).length} check)   attributed ${r.claims.attributed}   with premises ${r.claims.with_premises}   contested ${r.claims.contested}`);
  L.push(`  possibly composite ${r.claims.possibly_composite.length}`);
  L.push(`REMEDIATION     ${kv(r.remediation.by_code)}`);
  L.push(`PROSE           ${r.prose.total} substantive passages · registered ${r.prose.registered} (claim ${r.prose.registered_by_claim}, record ${r.prose.registered_by_record}) · classified ${r.prose.classified_not_registered} · UNCLASSIFIED ${r.prose.unclassified} · coverage ${r.prose.coverage_pct}%`);
  L.push(`  classes       ${kv(r.prose.by_prose_class)}`);
  L.push(`SOURCES         ${r.sources.total} · primary/official ${r.sources.primary_or_official} · secondary ${r.sources.secondary} · unofficial reproductions ${r.sources.unofficial_reproductions}`);
  for (const [k, v] of Object.entries(r.freshness)) L.push(`FRESHNESS ${k.padEnd(12)} ${kv(v.by_state)}   (${kv(v.by_risk)})`);
  L.push(`ENFORCEMENT     ${r.enforcement.total} · ${kv(r.enforcement.by_procedure)}`);
  L.push(`  finality      ${kv(r.enforcement.by_finality)} · contradictions ${r.enforcement.contradictions}`);
  L.push(`REGULATORY      ${r.regulatory.instruments} instruments, ${r.regulatory.with_full_lifecycle} with adoption → publication → entry into force · provisions ${r.regulatory.provisions}: ${kv(r.regulatory.provision_application)}`);
  L.push(`REGISTER        coverage ${kv(r.register.by_coverage)}`);
  L.push(`  register      ${r.register.register.length}: ${r.register.register.join(', ') || 'none'}`);
  L.push(`  watchlist     ${r.register.watchlist.length}: ${r.register.watchlist.join(', ') || 'none'}`);
  for (const [code, ids] of Object.entries(r.register.backlog)) L.push(`  BACKLOG ${code} ${ids.length}: ${ids.join(', ') || 'none'}`);
  L.push(`TRIGGERS        ${r.triggers.total} rules · ${kv(r.triggers.by_outcome)}`);
  L.push(`  publishable   ${r.triggers.publishable.length} of ${r.triggers.total}${r.triggers.publishable.length ? ': ' + r.triggers.publishable.join(', ') : ''}`);
  for (const [code, ids] of Object.entries(r.triggers.backlog)) L.push(`  BACKLOG ${code} ${ids.length}: ${ids.join(', ') || 'none'}`);
  L.push('');
  L.push(`WARNINGS ${r.warnings.length}`);
  for (const w of r.warnings) L.push('  ! ' + w);
  L.push(`ERRORS ${r.errors.length}`);
  for (const e of r.errors) L.push('  ✗ ' + e);
  L.push('');
  L.push('Every number above is derived from data/ and index.html on this run. A lower backlog');
  L.push('is closed by verification work against primary sources, never by editing this check.');
  return L.join('\n');
}

function markdown(r) {
  const row = (a, b) => `| ${a} | ${b} |`;
  return [
    `### Evidence model — as of ${r.as_of}`,
    '',
    '| Measure | Value |', '|---|---|',
    row('Claims', r.claims.total),
    row('… by type', kv(r.claims.by_type)),
    row('… by evidence status', kv(r.claims.by_evidence_status)),
    row('… by grade', kv(r.claims.by_grade)),
    row('Claims owing verification, still unverified', `${r.claims.unverified_owing} of ${r.claims.owe_verification}`),
    row('Direct references without a usable locator', `${r.claims.direct_refs_without_locator} of ${r.claims.direct_refs}`),
    row('Derived claims (arithmetic re-checked)', `${r.claims.derived.length} (${r.claims.derived.filter((d) => d.ok).length} check)`),
    row('Possibly composite claims (heuristic)', r.claims.possibly_composite.length),
    row('Remediation backlog', kv(r.remediation.by_code)),
    row('Substantive passages in the brief', r.prose.total),
    row('… registered / classified / unclassified', `${r.prose.registered} / ${r.prose.classified_not_registered} / ${r.prose.unclassified}`),
    row('… coverage', `${r.prose.coverage_pct}%`),
    row('Sources: primary or official / secondary / unofficial reproductions', `${r.sources.primary_or_official} / ${r.sources.secondary} / ${r.sources.unofficial_reproductions}`),
    ...Object.entries(r.freshness).map(([k, v]) => row(`Freshness — ${k}`, kv(v.by_state))),
    row('Enforcement finality', kv(r.enforcement.by_finality)),
    row('Provision application', kv(r.regulatory.provision_application)),
    row('Coverage', kv(r.register.by_coverage)),
    row('Exclusion register / watchlist', `${r.register.register.length} / ${r.register.watchlist.length}`),
    ...Object.entries(r.register.backlog).map(([code, ids]) => row(`Backlog — ${code}`, ids.length)),
    row('Applicability rules', `${r.triggers.total} · ${kv(r.triggers.by_outcome)}`),
    row('… publishable at the claims\' standard', `${r.triggers.publishable.length} of ${r.triggers.total}`),
    ...Object.entries(r.triggers.backlog).map(([code, ids]) => row(`Backlog — ${code}`, ids.length)),
    row('Errors / warnings', `${r.errors.length} / ${r.warnings.length}`),
    '',
    '_Derived on this run from `data/` and `index.html` by the modules the site itself uses. Not a score: the backlog is closed by verification work, not by a passing check._',
  ].join('\n');
}

if (IS_MAIN && ARGS.error) {
  console.error(refusalText('evidence-audit.mjs', ARGS.error));
  process.exitCode = EXIT_UNREADABLE;
} else if (IS_MAIN) {
  /* exitCode, never exit(): exit() discards whatever is still buffered on a
     pipe, which cut --graph off at 64 KB */
  if (MODE === 'graph') { console.log(JSON.stringify(graph(), null, 1)); }
  else {
    const r = audit();
    if (MODE === 'json') console.log(JSON.stringify(r, null, 2));
    else if (MODE === 'markdown') console.log(markdown(r));
    else console.log(text(r));
    if (ARGS.flags.has('--record')) {
      const entry = recordEntry(r, { argv: process.argv.slice(2) });
      const dir = storeDir(ROOT);
      mkdirSync(dir, { recursive: true });
      appendFileSync(storePath(dir), `${JSON.stringify(entry)}\n`, 'utf8');
      /* stderr, so --json and --markdown stay parseable on stdout. */
      console.error(`Recorded to ${relative(process.cwd(), storePath(dir)) || storePath(dir)} — as of ${entry.as_of}, commit ${entry.commit.sha ?? 'unknown'}${entry.commit.tree_clean === false ? ' plus uncommitted changes' : ''}. The Control Room's Editorial audit view reads the latest record.`);
    }
    process.exitCode = r.errors.length ? 1 : 0;
  }
}
