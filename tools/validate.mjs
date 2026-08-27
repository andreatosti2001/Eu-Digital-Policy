#!/usr/bin/env node
/**
 * Data integrity validator for the EU Digital Regulation Intelligence System.
 *
 * Zero dependencies. The site does NOT need this to run — it is a development
 * aid only. Run from the repository root:
 *
 *     node tools/validate.mjs
 *
 * Exits 1 if any ERROR is reported. WARNINGs and the unverified-data report do
 * not fail the run: unverified data is an honest state, not a defect.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA = 'data';
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* ---------- 1. every file parses ---------- */
const files = readdirSync(DATA).filter((f) => f.endsWith('.json')).sort();
const db = {};
for (const f of files) {
  const path = join(DATA, f);
  try {
    db[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(`PARSE ${path}: ${e.message}`);
  }
}
if (errors.length) { report(); process.exit(1); }

/* ---------- helpers ---------- */
const arr = (x) => (Array.isArray(x) ? x : []);
const WILDCARD = /\*$/;

function collectIds() {
  const ids = { instrument: new Set(), provision: new Set(), institution: new Set(), source: new Set(), claim: new Set(), enforcement: new Set(), timeline: new Set(), glossary: new Set(), relationship: new Set(), taxonomy: new Set(), part: new Set() };

  for (const i of arr(db.instruments?.instruments)) {
    ids.instrument.add(i.id);
    for (const a of arr(i.aliases)) ids.instrument.add(a);
    for (const p of arr(i.provisions)) ids.provision.add(p.id);
  }
  for (const r of arr(db.instruments?.relationships)) ids.relationship.add(r.id);
  for (const x of arr(db.institutions?.institutions)) ids.institution.add(x.id);
  for (const x of arr(db.sources?.sources)) ids.source.add(x.id);
  for (const x of arr(db.claims?.claims)) ids.claim.add(x.id);
  for (const x of arr(db.enforcement?.enforcement)) ids.enforcement.add(x.id);
  for (const x of arr(db.timeline?.events)) ids.timeline.add(x.id);
  for (const x of arr(db.glossary?.terms)) ids.glossary.add(x.id);
  for (const x of arr(db.brief?.parts)) ids.part.add(x.id);
  for (const [k, v] of Object.entries(db.taxonomy || {})) {
    if (k.startsWith('$') || !Array.isArray(v)) continue;
    for (const t of v) ids.taxonomy.add(t.id);
  }
  return ids;
}

/* ---------- 2. duplicate IDs ---------- */
function checkDuplicates() {
  const seen = new Map();
  const add = (id, where) => {
    if (id === undefined || id === null) return;
    if (seen.has(id)) err(`DUPLICATE ID "${id}" in ${seen.get(id)} and ${where}`);
    else seen.set(id, where);
  };
  for (const i of arr(db.instruments?.instruments)) {
    add(i.id, 'instruments');
    for (const p of arr(i.provisions)) add(p.id, `instruments/${i.id}/provisions`);
  }
  for (const r of arr(db.instruments?.relationships)) add(r.id, 'relationships');
  for (const x of arr(db.institutions?.institutions)) add(x.id, 'institutions');
  for (const x of arr(db.sources?.sources)) add(x.id, 'sources');
  for (const x of arr(db.claims?.claims)) add(x.id, 'claims');
  for (const x of arr(db.enforcement?.enforcement)) add(x.id, 'enforcement');
  for (const x of arr(db.timeline?.events)) add(x.id, 'timeline');
  for (const x of arr(db.glossary?.terms)) add(x.id, 'glossary');
  for (const x of arr(db.applicability?.rules)) add(x.id, 'applicability');
  for (const [k, v] of Object.entries(db.taxonomy || {})) {
    if (k.startsWith('$') || !Array.isArray(v)) continue;
    for (const t of v) add(t.id, `taxonomy/${k}`);
  }
}

/* ---------- 3. referential integrity ---------- */
function checkRefs(ids) {
  const resolves = (kind, ref) => {
    if (ref === null || ref === undefined) return true;
    if (ref === '*') return true;
    if (WILDCARD.test(ref)) {
      const prefix = ref.slice(0, -1);
      if (ids[kind].has(ref)) return true;
      for (const id of ids[kind]) if (id.startsWith(prefix)) return true;
      return false;
    }
    return ids[kind].has(ref);
  };
  const check = (where, kind, refs) => {
    for (const r of arr(refs)) if (!resolves(kind, r)) err(`DANGLING ${kind} ref "${r}" in ${where}`);
  };
  const checkOne = (where, kind, ref) => {
    if (ref === null || ref === undefined) return;
    if (!resolves(kind, ref)) err(`DANGLING ${kind} ref "${ref}" in ${where}`);
  };

  for (const i of arr(db.instruments?.instruments)) {
    const w = `instruments/${i.id}`;
    check(w, 'timeline', i.milestones);
    check(w, 'instrument', i.amended_by);
    check(w, 'instrument', i.amends);
    check(w, 'instrument', i.repeals);
    check(w, 'instrument', i.proposes_to_amend);
    check(w, 'provision', i.legal_basis);
    check(w, 'claim', i.claims);
    check(w, 'source', i.sources);
    checkOne(w, 'taxonomy', i.kind);
    checkOne(w, 'taxonomy', i.scope_class);
    checkOne(w, 'taxonomy', i.legislative_status);
    checkOne(w, 'part', i.brief_part);
    if (i.transposition) {
      checkOne(`${w}/transposition`, 'timeline', i.transposition.deadline);
      check(`${w}/transposition`, 'source', i.transposition.sources);
      for (const [ms, st] of Object.entries(i.transposition.state || {}))
        checkOne(`${w}/transposition/${ms}`, 'taxonomy', st);
    }
    if (i.dna) {
      check(`${w}/dna`, 'taxonomy', i.dna.regulated_actor);
      check(`${w}/dna`, 'taxonomy', i.dna.protected_party);
      check(`${w}/dna`, 'taxonomy', i.dna.territorial_scope);
      check(`${w}/dna`, 'provision', i.dna.obligation_anchor);
      checkOne(`${w}/dna`, 'provision', i.dna.sanction_ceiling?.basis);
    }
    for (const p of arr(i.provisions)) {
      const pw = `${w}/${p.id}`;
      check(pw, 'taxonomy', p.obligation_on);
      check(pw, 'claim', p.claims);
      check(pw, 'source', p.sources);
      checkOne(pw, 'institution', p.obligation_on_institution);
      if (!p.id.startsWith(i.id + ':')) err(`PROVISION ID "${p.id}" is not namespaced to its instrument "${i.id}"`);
    }
  }
  for (const r of arr(db.instruments?.relationships)) {
    const w = `relationships/${r.id}`;
    checkOne(w, 'instrument', r.from);
    checkOne(w, 'instrument', r.to);
    checkOne(w, 'taxonomy', r.kind);
    check(w, 'provision', r.provisions);
    check(w, 'claim', r.claims);
    check(w, 'source', r.sources);
  }
  for (const x of arr(db.institutions?.institutions)) {
    const w = `institutions/${x.id}`;
    checkOne(w, 'taxonomy', x.type);
    checkOne(w, 'institution', x.parent);
    check(w, 'institution', x.children);
    check(w, 'claim', x.claims);
    check(w, 'source', x.sources);
    for (const c of arr(x.competences)) {
      checkOne(`${w}/competence`, 'instrument', c.instrument);
      checkOne(`${w}/competence`, 'institution', null);
      checkOne(`${w}/competence`, 'taxonomy', c.role);
      check(`${w}/competence`, 'provision', c.basis);
    }
  }
  for (const x of arr(db.sources?.sources)) {
    const w = `sources/${x.id}`;
    checkOne(w, 'taxonomy', x.tier);
    checkOne(w, 'taxonomy', x.type);
    checkOne(w, 'taxonomy', x.url_status);
    checkOne(w, 'institution', x.publisher === 'eu' ? null : x.publisher);
  }
  for (const x of arr(db.claims?.claims)) {
    const w = `claims/${x.id}`;
    checkOne(w, 'taxonomy', x.type);
    check(w, 'instrument', x.instruments);
    check(w, 'provision', x.provisions);
    check(w, 'institution', x.institutions);
    check(w, 'enforcement', x.enforcement);
    check(w, 'provision', x.legal_basis);
    checkOne(w, 'part', x.brief_part);
    for (const s of arr(x.sources)) {
      checkOne(`${w}/sources`, 'source', s.source_id);
      checkOne(`${w}/sources`, 'taxonomy', s.supports);
    }
    if (!arr(x.sources).length) err(`CLAIM "${x.id}" has no sources at all`);
  }
  for (const x of arr(db.enforcement?.enforcement)) {
    const w = `enforcement/${x.id}`;
    checkOne(w, 'instrument', x.instrument);
    checkOne(w, 'institution', x.authority);
    check(w, 'provision', x.legal_basis);
    check(w, 'timeline', x.timeline_events);
    check(w, 'claim', x.claims);
    check(w, 'source', x.sources);
    checkOne(w, 'taxonomy', x.entity_type);
    checkOne(w, 'taxonomy', x.action_status);
    checkOne(w, 'taxonomy', x.payment_status);
    checkOne(w, 'taxonomy', x.remedy_status);
    checkOne(w, 'taxonomy', x.appeal?.status);
    if (!x.appeal) err(`ENFORCEMENT "${x.id}" has no appeal block — the axis must be present even when unknown`);
    // preliminary findings are not decisions and cannot carry a fine or a payment state
    if (x.action_status === 'action:announced') {
      if (x.fine_eur != null) err(`ENFORCEMENT "${x.id}" is preliminary findings but carries a fine amount`);
      if (x.payment_status && x.payment_status !== 'payment:not-applicable')
        err(`ENFORCEMENT "${x.id}" is preliminary findings but carries payment status "${x.payment_status}"`);
    }
    // a collected or paid state without an amount cannot be aggregated honestly
    if ((x.payment_status === 'payment:collected' || x.payment_status === 'payment:paid') && x.fine_eur == null)
      warn(`ENFORCEMENT "${x.id}" is marked ${x.payment_status} but records no amount`);
  }
  for (const x of arr(db.timeline?.events)) {
    const w = `timeline/${x.id}`;
    checkOne(w, 'instrument', x.instrument);
    checkOne(w, 'taxonomy', x.event_type);
    checkOne(w, 'taxonomy', x.date_precision);
    check(w, 'provision', x.provisions);
    check(w, 'taxonomy', x.affected_actors);
    check(w, 'taxonomy', x.sectors);
    check(w, 'institution', x.authority);
    check(w, 'claim', x.claims);
    check(w, 'source', x.sources);
  }
  for (const x of arr(db.glossary?.terms)) {
    const w = `glossary/${x.id}`;
    check(w, 'instrument', x.instruments);
    check(w, 'provision', x.provisions);
    check(w, 'institution', x.institutions);
    check(w, 'enforcement', x.enforcement);
    check(w, 'taxonomy', x.actors);
    check(w, 'glossary', x.related_terms);
    check(w, 'claim', x.claims);
    check(w, 'source', x.sources);
  }
  for (const r of arr(db.applicability?.rules)) {
    const w = `applicability/${r.id}`;
    checkOne(w, 'instrument', r.instrument);
    checkOne(w, 'taxonomy', r.outcome);
    check(w, 'provision', r.obligations);
    check(w, 'institution', r.authority);
    check(w, 'timeline', r.dates);
    check(w, 'claim', r.claims);
    check(w, 'source', r.sources);
    const c = r.conditions || {};
    check(`${w}/conditions`, 'taxonomy', c.actor);
    check(`${w}/conditions`, 'taxonomy', c.activity);
    check(`${w}/conditions`, 'taxonomy', c.territory);
    if (!r.rationale) err(`RULE "${r.id}" has no rationale — a result the reader cannot inspect is worse than no result`);
    if (r.outcome === 'outcome:undetermined')
      err(`RULE "${r.id}" claims outcome:undetermined, which only the engine may emit for an uncovered combination`);
  }
  for (const e of arr(db.brief?.reading_graph)) {
    checkOne('brief/reading_graph', 'part', e.from);
    checkOne('brief/reading_graph', 'part', e.to);
  }
}

/* ---------- 4. duplicate canonical facts ---------- */
function checkCanonicalFacts() {
  // (a) no ISO dates stored on instruments — dates belong in timeline.json
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const DATE_FIELDS_ALLOWED = new Set(['status_as_of', 'last_verified', 'accessed', 'published', 'date', 'decision_date', 'opened']);
  const walk = (node, path, file) => {
    if (node === null || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && ISO.test(v) && !DATE_FIELDS_ALLOWED.has(k)) {
        warn(`POSSIBLE DUPLICATE FACT: ISO date in ${file}${path}.${k} = "${v}" — dates should live in timeline.json and be referenced by ID`);
      }
      if (typeof v === 'object') walk(v, `${path}.${k}`, file);
    }
  };
  for (const i of arr(db.instruments?.instruments)) walk(i, `/${i.id}`, 'instruments');

  // (b) each timeline event unique on (instrument, date, event_type)
  const seen = new Map();
  for (const e of arr(db.timeline?.events)) {
    const key = `${e.instrument}|${e.date}|${e.event_type}`;
    if (seen.has(key)) err(`DUPLICATE CANONICAL EVENT ${key}: "${seen.get(key)}" and "${e.id}"`);
    else seen.set(key, e.id);
  }

  // (c) each enforcement action unique on (entity, authority, decision_date)
  const seenE = new Map();
  for (const x of arr(db.enforcement?.enforcement)) {
    if (!x.decision_date) continue;
    const key = `${x.entity}|${x.authority}|${x.decision_date}`;
    if (seenE.has(key)) err(`DUPLICATE ENFORCEMENT RECORD ${key}: "${seenE.get(key)}" and "${x.id}"`);
    else seenE.set(key, x.id);
  }

  // (d) A repeated fine amount is only suspicious when the surrounding context
  //     also overlaps. Regulators pick round numbers, and two unrelated
  //     decisions landing on EUR 200 000 000 is a coincidence, not a copy-paste.
  //     The rule fired on Temu (28 May 2026, DSA) and Meta (2025, DMA), which
  //     are plainly distinct actions, and a warning that cries wolf every run
  //     trains the reader to ignore the warning list.
  //
  //     It now fires only when the amount repeats AND the records share at
  //     least two of: entity, instrument, authority, decision date — which is
  //     the shape an actual duplicated record would have.
  const byAmount = new Map();
  for (const x of arr(db.enforcement?.enforcement)) {
    if (x.fine_eur == null) continue;
    if (!byAmount.has(x.fine_eur)) byAmount.set(x.fine_eur, []);
    byAmount.get(x.fine_eur).push(x);
  }
  for (const [amount, group] of byAmount) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b2 = group[j];
        const overlap = ['entity', 'instrument', 'authority', 'decision_date']
          .filter((k) => a[k] != null && a[k] === b2[k]);
        if (overlap.length >= 2) {
          warn(`Same fine amount ${amount} on "${a.id}" and "${b2.id}", sharing ${overlap.join(' + ')} — confirm these are not one action recorded twice`);
        }
      }
    }
  }

  // (d2) no two rules with identical instrument + conditions
  const seenR = new Map();
  for (const r of arr(db.applicability?.rules)) {
    const key = r.instrument + '|' + JSON.stringify(r.conditions || {});
    if (seenR.has(key)) err(`DUPLICATE RULE ${key}: "${seenR.get(key)}" and "${r.id}"`);
    else seenR.set(key, r.id);
  }

  // (e) a competence should be declared once per (institution, instrument, role)
  const seenC = new Set();
  for (const x of arr(db.institutions?.institutions))
    for (const c of arr(x.competences)) {
      const key = `${x.id}|${c.instrument}|${c.role}`;
      if (seenC.has(key)) err(`DUPLICATE COMPETENCE ${key}`);
      seenC.add(key);
    }

  // (f) supervisor / date / ceiling must not be duplicated onto instruments
  for (const i of arr(db.instruments?.instruments)) {
    for (const k of ['supervisor', 'authority', 'competent_authority', 'entry_into_force', 'application_date'])
      if (k in i) err(`instruments/${i.id} carries "${k}" — that fact belongs in institutions.json or timeline.json`);
  }
}

/* ---------- 5. status model discipline ---------- */
function checkStatusModel() {
  for (const i of arr(db.instruments?.instruments)) {
    if (i.kind === 'kind:proposal') {
      const bad = ['status:in-force', 'status:applicable', 'status:partly-applicable', 'status:published'];
      if (bad.includes(i.legislative_status))
        err(`instruments/${i.id} is a proposal but has legislative_status "${i.legislative_status}" — proposals must never be presented as binding law`);
    }
    if (i.kind === 'kind:directive' && i.transposition === null && i.scope_class === 'scope:core')
      warn(`instruments/${i.id} is a core directive with no transposition block — transposition is not the same as applicability`);
    if (i.kind === 'kind:regulation' && i.transposition !== null && i.transposition !== undefined)
      warn(`instruments/${i.id} is a regulation but carries a transposition block`);
    // an instrument claiming applicability should have at least one application milestone
    if (['status:applicable', 'status:partly-applicable'].includes(i.legislative_status)) {
      const ms = arr(i.milestones);
      const hasApp = ms.some((m) => m.includes('-application'));
      if (!hasApp) warn(`instruments/${i.id} is marked ${i.legislative_status} but has no application milestone`);
    }
  }
  // entry into force must never share an ID suffix with application for the same date
  for (const e of arr(db.timeline?.events)) {
    if (e.event_type === 'event:entry-into-force' && /application/.test(e.id))
      err(`timeline/${e.id}: entry-into-force event with "application" in its ID`);
  }
}

/* ---------- 6. unverified data report ---------- */
function unverifiedReport() {
  const rows = [];
  const push = (kind, id, note) => rows.push({ kind, id, note: (note || '').replace(/\s+/g, ' ').slice(0, 150) });

  for (const c of arr(db.claims?.claims)) {
    const strongest = arr(c.sources).some((s) => s.supports === 'supports:direct' && s.source_id !== 'src-brief-original');
    if (!c.last_verified) push('claim (unverified)', c.id, c.verification_note);
    else if (!strongest) push('claim (no external direct source)', c.id, c.verification_note);
  }
  for (const e of arr(db.timeline?.events)) if (e.requires_verification) push('timeline', e.id, e.verification_note);
  for (const x of arr(db.enforcement?.enforcement)) if (x.requires_verification) push('enforcement', x.id, x.verification_note);
  for (const i of arr(db.instruments?.instruments)) {
    if (!i.last_verified) push('instrument (never verified)', i.id, i.status_note);
    if (i.transposition?.requires_verification) push('transposition', i.id, i.transposition.state_note);
  }
  for (const r of arr(db.instruments?.relationships)) if (r.requires_verification) push('relationship', r.id, r.verification_note);
  for (const g of arr(db.glossary?.terms)) if (g.requires_verification) push('glossary', g.id, g.verification_note);
  for (const s of arr(db.sources?.sources)) if (s.url_status === 'url:none') push('source (no URL)', s.id, s.note);
  for (const r of arr(db.applicability?.rules)) if (r.requires_verification) push('applicability rule', r.id, r.verification_note);
  for (const i of arr(db.instruments?.instruments))
    for (const p of arr(i.provisions)) if (p.requires_verification) push('provision', p.id, p.verification_note);
  for (const x of arr(db.institutions?.institutions))
    for (const c of arr(x.competences))
      if ((c.note || '').startsWith('requires verification')) push('competence', `${x.id} → ${c.instrument} (${c.role})`, c.note);

  return rows;
}

/* ---------- run ---------- */
const ids = collectIds();
checkDuplicates();
checkRefs(ids);
checkCanonicalFacts();
checkStatusModel();
const unverified = unverifiedReport();

function report() {
  console.log(`\nFILES  ${files.length} parsed: ${files.join(', ')}`);
  const counts = {
    instruments: arr(db.instruments?.instruments).length,
    provisions: arr(db.instruments?.instruments).reduce((n, i) => n + arr(i.provisions).length, 0),
    relationships: arr(db.instruments?.relationships).length,
    institutions: arr(db.institutions?.institutions).length,
    competences: arr(db.institutions?.institutions).reduce((n, i) => n + arr(i.competences).length, 0),
    sources: arr(db.sources?.sources).length,
    claims: arr(db.claims?.claims).length,
    enforcement: arr(db.enforcement?.enforcement).length,
    timeline: arr(db.timeline?.events).length,
    glossary: arr(db.glossary?.terms).length,
    parts: arr(db.brief?.parts).length,
    'applicability rules': arr(db.applicability?.rules).length,
    'taxonomy terms': ids.taxonomy.size,
  };
  console.log('RECORDS ' + Object.entries(counts).map(([k, v]) => `${k}=${v}`).join('  '));

  console.log(`\nERRORS   ${errors.length}`);
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\nWARNINGS ${warnings.length}`);
  for (const w of warnings) console.log('  ! ' + w);

  if (typeof unverified !== 'undefined') {
    console.log(`\nUNVERIFIED / REQUIRES VERIFICATION  ${unverified.length}`);
    for (const r of unverified) console.log(`  · [${r.kind}] ${r.id}\n      ${r.note}`);
  }
  console.log('');
}

report();
process.exit(errors.length ? 1 : 0);
