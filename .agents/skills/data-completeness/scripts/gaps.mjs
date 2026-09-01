#!/usr/bin/env node
/* ============================================================
   .agents/skills/data-completeness/scripts/gaps.mjs

     node .agents/skills/data-completeness/scripts/gaps.mjs [--json]

   A completeness census: what the corpus does NOT yet establish,
   broken down in ways no existing tool prints.

   It deliberately does NOT recompute anything tools/ already
   reports. The unverified tally is validate.mjs's; verification-date
   age and source reachability are freshness.mjs's. Recomputing one
   here would create the second home this project exists to prevent.

   The evidence grade is NOT reimplemented either: this script
   imports evidenceGrade from js/format.js — the same function the
   site renders with — so the census cannot disagree with the page.
   js/format.js is a browser ES module in a repository with no
   package.json, so it is loaded through a data: URL rather than by
   path. That is the whole reason for the indirection.

   Zero dependencies, like the four validators in tools/.
   Exit code is always 0: a gap is a finding, not a failure.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
const arr = (x) => (Array.isArray(x) ? x : []);
const JSON_OUT = process.argv.includes('--json');

/* The site's own derivation, imported rather than restated. */
const fmtSrc = readFileSync(join(ROOT, 'js', 'format.js'), 'utf8');
const fmt = await import('data:text/javascript;base64,' + Buffer.from(fmtSrc).toString('base64'));

const claims = arr(read('claims.json').claims);
const sources = arr(read('sources.json').sources);
const enforcement = arr(read('enforcement.json').enforcement);
const instrumentsDoc = read('instruments.json');
const instruments = arr(instrumentsDoc.instruments);
const institutions = read('institutions.json');
const applicability = arr(read('applicability.json').rules);

const ix = { source: new Map(sources.map((s) => [s.id, s])) };
const SELF = 'src-brief-original';

/* ------------------------------------------------ 1. evidence */

const gradeOf = (c) => fmt.evidenceGrade(c, ix).id;
const tally = fmt.gradeTally(claims, ix);

const byTypeGrade = {};
for (const c of claims) {
  const t = String(c.type || '').split(':').pop();
  (byTypeGrade[t] ??= {});
  byTypeGrade[t][gradeOf(c)] = (byTypeGrade[t][gradeOf(c)] ?? 0) + 1;
}

/* ------------------------------------------------ 2. support shape */

const supportShape = { direct_external: 0, direct_self_only: 0, partial_only: 0, context_only: 0, none: 0 };
const noExternalDirect = [];
for (const c of claims) {
  const refs = arr(c.sources);
  const direct = refs.filter((s) => s.supports === 'supports:direct');
  const external = direct.filter((s) => s.source_id !== SELF);
  if (!refs.length) supportShape.none++;
  else if (external.length) supportShape.direct_external++;
  else if (direct.length) supportShape.direct_self_only++;
  else if (refs.some((s) => s.supports === 'supports:partial')) supportShape.partial_only++;
  else supportShape.context_only++;
  if (!external.length) noExternalDirect.push(c.id);
}

const supportsCount = {};
for (const c of claims) for (const s of arr(c.sources)) supportsCount[s.supports] = (supportsCount[s.supports] ?? 0) + 1;

const referenceGaps = claims.filter((c) => c.reference_gap).map((c) => ({ id: c.id, gap: c.gap_note ?? null }));

/* ------------------------------------------------ 3. null vs unknown */

/* The distinction the whole data model turns on: null = not
   researched; 'unknown' = researched and not publicly determinable.
   A census that merged them would be the exact defect it exists to
   detect, so they are counted in separate columns. */
const AXES = {
  action_status: (r) => r.action_status,
  payment_status: (r) => r.payment_status,
  remedy_status: (r) => r.remedy_status,
  'appeal.status': (r) => (r.appeal ? r.appeal.status : undefined),
  behavioural_outcome: (r) => r.behavioural_outcome,
};
const census = {};
for (const [axis, get] of Object.entries(AXES)) {
  const c = { value: 0, unknown: 0, null: 0, absent: 0 };
  for (const r of enforcement) {
    const v = get(r);
    if (v === undefined) c.absent++;
    else if (v === null) c.null++;
    else if (String(v).endsWith(':unknown') || String(v).toLowerCase() === 'unknown') c.unknown++;
    else c.value++;
  }
  census[axis] = c;
}

/* ------------------------------------------------ 4. structural coverage */

const provisionsPer = new Map(instruments.map((i) => [i.id, arr(i.provisions).length]));
const noProvisions = instruments.filter((i) => !arr(i.provisions).length).map((i) => i.id);
const noMilestones = instruments.filter((i) => !arr(i.milestones).length).map((i) => i.id);

/* Competence edges are nested inside each institution, and '*' is a
   wildcard meaning every instrument. A wildcard edge tells you
   nothing about a particular instrument, so the gap worth reporting
   is the absence of an INSTRUMENT-SPECIFIC edge. */
const named = new Set();
for (const inst of arr(institutions.institutions)) {
  for (const c of arr(inst.competences)) if (c.instrument && c.instrument !== '*') named.add(c.instrument);
}
const noCompetence = instruments.filter((i) => !named.has(i.id)).map((i) => i.id);

/* Sources are referenced from claims, enforcement, timeline,
   instruments and institutions. Walk every dataset rather than
   guessing which ones cite. */
const citedSources = new Set();
const walk = (node) => {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'source_id' && typeof v === 'string') citedSources.add(v);
      else if (k === 'sources' && Array.isArray(v)) {
        for (const s of v) {
          if (typeof s === 'string') citedSources.add(s);
          else if (s && typeof s.source_id === 'string') citedSources.add(s.source_id);
        }
      } else walk(v);
    }
  }
};
for (const f of ['claims.json', 'enforcement.json', 'timeline.json', 'instruments.json',
                 'institutions.json', 'glossary.json', 'applicability.json']) walk(read(f));
const uncited = sources.filter((s) => !citedSources.has(s.id)).map((s) => s.id);

const rulesNoObligations = applicability.filter((r) => !arr(r.obligations).length).map((r) => r.id);
const instrumentsWithRules = new Set(applicability.flatMap((r) => (r.instrument ? [r.instrument] : arr(r.instruments))));
const noApplicabilityRule = instruments.filter((i) => !instrumentsWithRules.has(i.id)).map((i) => i.id);

/* ------------------------------------------------ report */

const out = {
  as_of: new Date().toISOString().slice(0, 10),
  claims: claims.length,
  evidence_grade: tally,
  grade_by_claim_type: byTypeGrade,
  support_shape: supportShape,
  supports_qualifiers: supportsCount,
  claims_without_external_direct_source: noExternalDirect.length,
  reference_gaps: referenceGaps,
  enforcement_null_vs_unknown: census,
  structural: {
    instruments: instruments.length,
    instruments_without_provisions: noProvisions,
    instruments_without_milestones: noMilestones,
    instruments_without_instrument_specific_competence: noCompetence,
    instruments_without_applicability_rule: noApplicabilityRule,
    applicability_rules_without_obligations: rulesNoObligations,
    sources_never_cited: uncited,
  },
};

if (JSON_OUT) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const line = (s = '') => console.log(s);
const row = (k, v) => line(`  ${String(k).padEnd(42)}${v}`);
const list = (label, xs) => {
  if (!xs.length) return row(label, '0');
  row(label, `${xs.length}   ${xs.slice(0, 8).join(', ')}${xs.length > 8 ? ' …' : ''}`);
};

line(`\ncompleteness census · as at ${out.as_of} · ${claims.length} claims, ${instruments.length} instruments`);
line(`(the unverified tally is tools/validate.mjs; verification age and link health are tools/freshness.mjs)`);

line('\nEVIDENCE GRADE  — derived by js/format.js, not recomputed here');
for (const [k, v] of Object.entries(tally)) row(k, v);

line('\nGRADE BY CLAIM TYPE');
for (const [t, g] of Object.entries(byTypeGrade)) {
  row(t, Object.entries(g).map(([k, v]) => `${k} ${v}`).join('  ·  '));
}

line('\nWHAT EACH CLAIM RESTS ON');
row('an external direct source', supportShape.direct_external);
row('direct, but only the brief itself', supportShape.direct_self_only);
row('partial support only', supportShape.partial_only);
row('context only — not a citation', supportShape.context_only);
row('no source reference at all', supportShape.none);
row('→ no external direct source (unresolved)', noExternalDirect.length);

line('\nSUPPORTS QUALIFIERS ACROSS ALL REFERENCES');
for (const [k, v] of Object.entries(supportsCount)) row(k, v);

line(`\nREFERENCE GAPS  — an asterisk in the prose, closed only by finding the publication`);
if (!referenceGaps.length) row('none', 0);
for (const g of referenceGaps) row(g.id, g.gap ?? '');

line('\nNULL vs UNKNOWN  — never merge these columns');
row('axis'.padEnd(0) + ' ', 'value   unknown   null   absent');
for (const [axis, c] of Object.entries(census)) {
  row(axis, `${String(c.value).padEnd(8)}${String(c.unknown).padEnd(10)}${String(c.null).padEnd(7)}${c.absent}`);
}

line('\nSTRUCTURAL COVERAGE  — a gap here is a question, not necessarily a defect');
list('instruments with no provisions', noProvisions);
list('instruments with no milestones', noMilestones);
list('no instrument-specific competence edge', noCompetence);
list('instruments with no applicability rule', noApplicabilityRule);
list('applicability rules with no obligations', rulesNoObligations);
list('sources never cited', uncited);

line('\nNothing here fails. A gap is a finding; closing one is verification work.\n');
