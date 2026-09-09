/* ============================================================
   agent/improve/reach.mjs — what limited autonomy can actually
   reach, measured against the real tree

   SESSION 26 switched five low-risk categories on and reported, as
   its first limitation, that "nothing in this repository currently
   produces a proposal in one of the five enabled categories"
   (docs/LIMITED-AUTONOMY.md §7.1). That sentence is true and it is
   about the PRODUCERS. It leaves the reader to assume the targets
   exist and nobody writes to them.

   THEY MOSTLY DO NOT EXIST, and this module is the measurement that
   says so rather than the inference that assumes it.

   `GRANTABLE_FIELDS['data/sources.json']` names eight fields. The
   file carries fourteen fields across its records and only two of the
   eight are among them — `url` and `url_status`. `last_retrieved`,
   `retrieved_at`, `checksum`, `content_hash`, `recheck_interval` and
   `freshness_window` appear nowhere in the file, not on one record
   and not in its `$description` or `$note`. So a grant that names
   them grants a permission over a surface that has never existed,
   and the two categories those fields are the whole content of —
   retrieval bookkeeping and machine-derived fields on that file —
   have nothing to act on at all.

   WHY THIS IS A MEASUREMENT AND NOT A COMPLAINT. The absence is the
   safe direction and docs/LIMITED-AUTONOMY.md §7.6 already says so
   about the opposite case: "a field added to data/sources.json later
   is refused by absence". What was never established is the case
   this module measures — a field NAMED by the grant that the dataset
   does not have. Nothing is wrong; a permission over nothing is not
   a hazard. It is the mechanical half of §7.1's explanation, and a
   session that reads §7.1 and sets out to build a producer would
   otherwise build a producer for fields that are not there.

   WHAT THIS MODULE MUST NOT DO, and does not. It does not add the
   fields. Adding `checksum` to data/sources.json would be a schema
   decision about the legal record taken to make an autonomy
   demonstration possible, which is a fixture dressed as work and is
   exactly what §7.1 refuses. It reports the surface; the decision is
   a person's.

   It reads `agent/policy/governance.mjs` for what is grantable and
   `policyInForce()` for what is granted, and re-derives neither.
   ============================================================ */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  AUTOMATIC_ELIGIBLE_PATHS,
  GRANTABLE_FIELDS,
  NEVER_AUTOMATIC_FIELD_NAMES,
  policyInForce,
} from '../policy/governance.mjs';
import { ACTION_CATEGORIES } from '../policy/categories.mjs';
import { REPO_ROOT } from '../implement/baseline.mjs';

/**
 * The categories whose reachable surface is a FIELD on a dataset,
 * and which fields each of them can be reached through.
 *
 * This is not a second home for the category definitions — those are
 * `ACTION_CATEGORIES` and this names five of their ids. It is the
 * mapping `categoriseProposal()` performs in code, written down as
 * data so that "which category has no surface" is a question with an
 * answer rather than a reading of a function.
 *
 * The predicates mirror `agent/policy/categories.mjs` §6 branch by
 * branch. `agent/improve/selftest.mjs` test 4 asserts they still
 * agree by running the real categoriser over a probe for each entry,
 * so a change to that branch fails here rather than drifting.
 */
export const CATEGORY_SURFACE = Object.freeze([
  Object.freeze({
    category: 'source_url_correction',
    dataset: 'data/sources.json',
    fields: Object.freeze(['url', 'url_status']),
    also_requires: 'the proposal records `retrieved_and_read: true` — the document at the URL was fetched and read.',
  }),
  Object.freeze({
    category: 'retrieval_metadata',
    dataset: 'data/sources.json',
    fields: Object.freeze(['last_retrieved', 'checksum', 'retrieval', 'fetched']),
    also_requires: null,
  }),
  Object.freeze({
    category: 'source_metadata_maintenance',
    dataset: 'data/sources.json',
    fields: null, // any field the grant allows; reached by operation_kind or substantive:false
    also_requires: 'the proposal is an `annotate` or declares `substantive: false`, and gate 4 still reads every target against the never-automatic list.',
  }),
  Object.freeze({
    category: 'machine_derived_field',
    dataset: null,
    fields: null,
    also_requires: 'an ImplementationProposal whose every path is under docs/.',
  }),
  Object.freeze({
    category: 'governed_metadata_maintenance',
    dataset: null,
    fields: null,
    also_requires: null,
  }),
]);

/** Every field name any record in a dataset carries, plus the
 *  container keys. Absence here is the finding, so it is read from
 *  the file rather than from a schema somebody wrote down. */
export function fieldsPresent(datasetPath, { root = REPO_ROOT } = {}) {
  const file = join(root, datasetPath);
  if (!existsSync(file)) return { exists: false, fields: [], records: 0, text_mentions: [] };
  const text = readFileSync(file, 'utf8');
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { exists: true, parse_error: true, fields: [], records: 0, text_mentions: [] }; }

  /* The records are whichever array the container holds. A dataset
     with several arrays contributes all of them: this is asking
     "does this name occur as a field anywhere in this file", and a
     narrower reading would report absent for a field that is there. */
  const arrays = Object.values(parsed).filter(Array.isArray);
  const fields = new Set();
  let records = 0;
  for (const arr of arrays) {
    for (const rec of arr) {
      if (!rec || typeof rec !== 'object' || Array.isArray(rec)) continue;
      records += 1;
      for (const k of Object.keys(rec)) fields.add(k);
    }
  }
  return { exists: true, parse_error: false, fields: [...fields].sort(), records, text };
}

/**
 * The surface a grant's field allowlist actually lands on.
 *
 * Three outcomes per field, and they are three rather than two on
 * purpose. `present` is a field the dataset has. `absent` is a field
 * no record carries AND whose name occurs nowhere in the file — the
 * grant reaches nothing. `named_but_unused` is the in-between: the
 * name occurs in the file's own `$description` or `$note` but no
 * record carries it, which is a schema somebody has described and
 * not yet populated, and is a different fact from never having
 * existed.
 */
export function fieldReach(datasetPath, granted, { root = REPO_ROOT } = {}) {
  const present = fieldsPresent(datasetPath, { root });
  const have = new Set(present.fields);
  const rows = [];
  for (const f of granted) {
    if (have.has(f)) { rows.push({ field: f, state: 'present', why: `${present.records} record(s) in ${datasetPath} carry it.` }); continue; }
    const mentioned = present.exists && !present.parse_error && new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(present.text ?? '');
    rows.push({
      field: f,
      state: mentioned ? 'named_but_unused' : 'absent',
      why: mentioned
        ? `the name occurs in ${datasetPath} but no record carries it — a shape described and not populated.`
        : `no record in ${datasetPath} carries it and the name occurs nowhere in the file. The grant names a field this dataset has never had.`,
    });
  }
  return { dataset: datasetPath, exists: present.exists, records: present.records, fields_present: present.fields, granted: [...granted], rows };
}

/** Files under an eligible path prefix, so `docs/` reports a real
 *  surface rather than a prefix. Directories only; a prefix naming a
 *  file reports that file. */
export function pathReach(prefix, { root = REPO_ROOT } = {}) {
  const target = join(root, prefix);
  if (!existsSync(target)) return { path: prefix, exists: false, kind: null, files: 0, sample: [] };
  const st = statSync(target);
  if (st.isFile()) return { path: prefix, exists: true, kind: 'file', files: 1, sample: [prefix] };

  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      if (name.startsWith('.')) continue;
      const full = join(dir, name);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else files.push(relative(root, full));
    }
  };
  walk(target);
  return { path: prefix, exists: true, kind: 'directory', files: files.length, sample: files.slice(0, 5) };
}

/**
 * THE REPORT. What is switched on, and what of it lands on anything.
 *
 * `reachable` is never a promise that a change would be permitted —
 * every one of the six gates and eight preflight checks still runs.
 * It is the weaker and more useful statement: whether there is
 * anything there to write to at all.
 */
export function reach({ root = REPO_ROOT, now = new Date().toISOString(), governanceDir = undefined } = {}) {
  const inForce = policyInForce({ dir: governanceDir, now });
  const policy = inForce.policy;

  const paths = (policy.automatic_path_allowlist ?? []).map((p) => pathReach(p, { root }));
  const eligible = AUTOMATIC_ELIGIBLE_PATHS.map(([p, why]) => ({
    path: p,
    why,
    granted: (policy.automatic_path_allowlist ?? []).includes(p),
  }));

  const datasets = [];
  for (const [dataset, names] of Object.entries(policy.automatic_field_allowlist ?? {})) {
    datasets.push(fieldReach(dataset, names, { root }));
  }
  /* A dataset that is grantABLE but not granted is reported too. The
     question "what could a future grant reach" has the same answer
     shape and a session widening the grant needs it. */
  for (const [dataset, names] of Object.entries(GRANTABLE_FIELDS)) {
    if (datasets.some((d) => d.dataset === dataset)) continue;
    datasets.push({ ...fieldReach(dataset, names, { root }), granted_now: false });
  }

  /* Which enabled categories have somewhere to land. A category
     whose surface is a set of fields none of which exist reaches
     nothing; one whose surface is a path reaches whatever that path
     holds. `unknown` where this module cannot tell — never a
     default, and never a zero. */
  const categories = [];
  for (const cat of policy.enabled_categories ?? []) {
    const def = ACTION_CATEGORIES[cat] ?? null;
    const surface = CATEGORY_SURFACE.find((s) => s.category === cat) ?? null;
    let state = 'unknown';
    let why = 'this module has no surface entry for the category, so whether anything can be written under it is not established here.';
    let fields = [];

    if (surface && surface.dataset) {
      const d = datasets.find((x) => x.dataset === surface.dataset);
      const grantedHere = new Set((policy.automatic_field_allowlist ?? {})[surface.dataset] ?? []);
      fields = (surface.fields ?? [...grantedHere]).filter((f) => grantedHere.has(f) || surface.fields === null);
      const landable = fields.filter((f) => (d?.fields_present ?? []).includes(f));
      if (!d?.exists) { state = 'no_surface'; why = `${surface.dataset} does not exist in this tree.`; }
      else if (!fields.length) { state = 'no_surface'; why = `no field this category is reached through is in the grant's allowlist for ${surface.dataset}.`; }
      else if (!landable.length) {
        state = 'no_surface';
        why = `the ${fields.length} field(s) this category is reached through (${fields.join(', ')}) are named by the grant and no record in ${surface.dataset} carries any of them.`;
      } else {
        state = 'has_surface';
        why = `${landable.length} of the ${fields.length} field(s) this category is reached through exist in ${surface.dataset}: ${landable.join(', ')}.`;
      }
    } else if (surface && surface.also_requires && /docs\//.test(surface.also_requires)) {
      const d = paths.find((p) => p.path === 'docs/');
      state = d?.exists ? 'has_surface' : 'no_surface';
      why = d?.exists
        ? `${d.files} file(s) under docs/, which the grant names.`
        : 'docs/ is not in this tree or is not granted.';
    } else if (surface) {
      state = 'unknown';
      why = `${cat} is not reached through a named field or a named path: agent/policy/categories.mjs places a proposal here only by what the proposal itself declares, so whether a producer exists is a question about producers and not about surface.`;
    }

    categories.push({
      category: cat,
      automatable: def?.automatable ?? null,
      state,
      why,
      fields,
      also_requires: surface?.also_requires ?? null,
    });
  }

  const absent = datasets.flatMap((d) => d.rows.filter((r) => r.state === 'absent').map((r) => ({ dataset: d.dataset, ...r })));
  const noSurface = categories.filter((c) => c.state === 'no_surface');

  return {
    now,
    policy_id: policy.policy_id,
    grants: policy.granted_by ?? [],
    enabled_categories: policy.enabled_categories ?? [],
    eligible_paths: eligible,
    paths,
    datasets,
    categories,
    absent_fields: absent,
    categories_without_surface: noSurface,
    never_automatic_fields: [...NEVER_AUTOMATIC_FIELD_NAMES],
    summary: absent.length
      ? `${absent.length} of the granted field(s) name something no record carries, and ${noSurface.length} enabled categor(ies) have no surface to write to. This is the mechanical half of docs/LIMITED-AUTONOMY.md §7.1: not only does no producer write these, there is nothing there to write.`
      : `every granted field exists in its dataset. ${noSurface.length} enabled categor(ies) still have no surface for another reason.`,
  };
}
