/* ============================================================
   agent/schemas/fields.mjs — the field vocabulary a contract is
   written in

   A contract here is DATA, not code: a plain object whose values
   describe fields. That is the same choice `data/applicability.json`
   makes — declarative rules read by a deliberately unintelligent
   matcher — and it buys three things a hand-written validator does
   not:

     · the contract can be exported to JSON Schema for a consumer
       outside this repository, derived on demand rather than stored
       (see export.mjs);
     · every field carries its own documentation, so two agents
       cannot read it differently;
     · every field declares what it is CAPABLE of asserting —
       structural, factual, inference or interpretation — which is
       what lets validate.mjs demand evidence for the factual ones
       and refuse to let an interpretation pass as a fact.

   No JSON Schema validator is used, because using one would mean a
   dependency, and a dependency is a RED-tier prohibition in
   docs/AI-SAFE-BOUNDARIES.md §3. The interpreter below is ~150
   lines and does only what these contracts need.
   ============================================================ */

import { FIELD_EPISTEMICS, UNKNOWN } from './types.mjs';

/**
 * Every spec carries:
 *   doc          what the field means. Mandatory — a field nobody
 *                documented is a field two agents will read
 *                differently, and the suite asserts every one has it.
 *   epistemic    structural | factual | inference | interpretation
 *   required     default true
 *   nullable     may be null — "not researched"
 *   unknownable  may be the string "unknown" — "researched, not
 *                publicly determinable". Deliberately separate from
 *                nullable: they are different states (§0.3).
 */
const spec = (base, doc, opts = {}) => ({
  doc,
  epistemic: 'structural',
  required: true,
  nullable: false,
  unknownable: false,
  ...base,
  ...opts,
});

export const F = {
  /** An identifier minted by an agent. Lowercase, no spaces — ids
   *  travel through filenames, URLs and log lines. */
  id: (doc, opts) => spec({ kind: 'string', pattern: '^[a-z0-9][a-z0-9._:/-]{2,119}$' }, doc, opts),

  string: (doc, opts) => spec({ kind: 'string', minLength: 1, maxLength: 4000 }, doc, opts),

  /** Prose meant to be read by a human reviewer. Longer, and the
   *  suite holds the shorter fields to a length no one will skim. */
  text: (doc, opts) => spec({ kind: 'string', minLength: 1, maxLength: 20000 }, doc, opts),

  enum: (values, doc, opts) => spec({ kind: 'enum', values }, doc, opts),

  literal: (value, doc, opts) => spec({ kind: 'literal', value }, doc, opts),

  bool: (doc, opts) => spec({ kind: 'boolean' }, doc, opts),

  int: (doc, opts) => spec({ kind: 'integer' }, doc, opts),

  /** 0..1. Never a percentage, never a five-star rating. */
  ratio: (doc, opts) => spec({ kind: 'number', min: 0, max: 1 }, doc, opts),

  iso: (doc, opts) => spec({ kind: 'iso8601' }, doc, opts),

  hex: (n, doc, opts) => spec({ kind: 'hex', length: n }, doc, opts),

  url: (doc, opts) => spec({ kind: 'url' }, doc, opts),

  array: (of, doc, opts) => spec({ kind: 'array', of, min: 0, unique: false }, doc, opts),

  object: (shape, doc, opts) => spec({ kind: 'object', shape }, doc, opts),

  /** A free-form payload — a tool's inputs, a data blob. It asserts
   *  nothing on its own, which is why it may not be marked factual;
   *  a fact that only exists inside an opaque blob is a fact no
   *  reviewer can check. */
  data: (doc, opts) => spec({ kind: 'any' }, doc, opts),
};

/* ---------------------------------------------------------- checking */

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Check one value against one spec. Pushes human-readable problems
 * onto `errs`; returns nothing. `path` is dotted, so an error names
 * the exact field rather than the record.
 */
export function checkValue(sp, value, path, errs) {
  if (value === undefined) {
    if (sp.required) errs.push(`${path}: required field is missing`);
    return;
  }
  if (value === null) {
    if (!sp.nullable) errs.push(`${path}: null is not allowed here (null means "not researched")`);
    return;
  }
  if (value === UNKNOWN && sp.kind !== 'enum' && sp.kind !== 'literal') {
    if (!sp.unknownable) {
      errs.push(`${path}: "unknown" is not allowed here — this field cannot express "researched and not publicly determinable"`);
    }
    return;
  }

  switch (sp.kind) {
    case 'string': {
      if (typeof value !== 'string') { errs.push(`${path}: expected a string`); return; }
      if (sp.minLength !== undefined && value.length < sp.minLength) errs.push(`${path}: empty string — say what is missing rather than leaving it blank`);
      if (sp.maxLength !== undefined && value.length > sp.maxLength) errs.push(`${path}: longer than ${sp.maxLength} characters`);
      if (sp.pattern && !new RegExp(sp.pattern).test(value)) errs.push(`${path}: "${value}" does not match ${sp.pattern}`);
      return;
    }
    case 'enum': {
      if (value === UNKNOWN && sp.unknownable) return;
      if (!sp.values.includes(value)) errs.push(`${path}: "${value}" is not one of ${sp.values.join(' | ')}`);
      return;
    }
    case 'literal': {
      if (value !== sp.value) errs.push(`${path}: must be ${JSON.stringify(sp.value)}`);
      return;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') errs.push(`${path}: expected true or false`);
      return;
    }
    case 'integer': {
      if (!Number.isInteger(value)) errs.push(`${path}: expected an integer`);
      else if (sp.min !== undefined && value < sp.min) errs.push(`${path}: below ${sp.min}`);
      return;
    }
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) { errs.push(`${path}: expected a number`); return; }
      if (sp.min !== undefined && value < sp.min) errs.push(`${path}: ${value} is below ${sp.min}`);
      if (sp.max !== undefined && value > sp.max) errs.push(`${path}: ${value} is above ${sp.max}`);
      return;
    }
    case 'iso8601': {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) errs.push(`${path}: expected an ISO 8601 timestamp`);
      return;
    }
    case 'hex': {
      if (typeof value !== 'string' || value.length !== sp.length || !/^[0-9a-f]+$/.test(value)) {
        errs.push(`${path}: expected ${sp.length} lowercase hex characters`);
      }
      return;
    }
    case 'url': {
      if (typeof value !== 'string') { errs.push(`${path}: expected a URL string`); return; }
      let u;
      try { u = new URL(value); } catch { errs.push(`${path}: "${value}" is not a URL`); return; }
      if (u.protocol !== 'https:' && u.protocol !== 'http:') errs.push(`${path}: only http(s) URLs are citable here`);
      return;
    }
    case 'array': {
      if (!Array.isArray(value)) { errs.push(`${path}: expected an array`); return; }
      if (sp.min !== undefined && value.length < sp.min) {
        errs.push(`${path}: needs at least ${sp.min} entr${sp.min === 1 ? 'y' : 'ies'}`);
      }
      if (sp.unique) {
        const seen = new Set();
        for (const v of value) {
          const k = typeof v === 'string' ? v : JSON.stringify(v);
          if (seen.has(k)) errs.push(`${path}: duplicate entry ${k}`);
          seen.add(k);
        }
      }
      value.forEach((v, i) => checkValue(sp.of, v, `${path}[${i}]`, errs));
      return;
    }
    case 'object': {
      if (!isPlainObject(value)) { errs.push(`${path}: expected an object`); return; }
      checkShape(sp.shape, value, path, errs);
      return;
    }
    case 'any':
      return;
    default:
      errs.push(`${path}: the contract declares an unknown field kind "${sp.kind}"`);
  }
}

/**
 * Check an object against a shape. Shapes are CLOSED: a field the
 * contract does not declare is an error, not an extension. An agent
 * that can add a field nobody validates has bypassed the contract
 * while appearing to honour it.
 */
export function checkShape(shape, value, path, errs) {
  for (const [key, sp] of Object.entries(shape)) {
    checkValue(sp, value[key], path ? `${path}.${key}` : key, errs);
  }
  for (const key of Object.keys(value)) {
    if (!(key in shape)) {
      errs.push(`${path ? `${path}.` : ''}${key}: not declared by this contract — a field nothing validates is a field nothing can be held to`);
    }
  }
}

/** Walk a shape, yielding [dottedPath, spec] for every leaf and
 *  branch. Used to find the factual fields a record must evidence,
 *  and by the JSON Schema export. */
export function* walkShape(shape, prefix = '') {
  for (const [key, sp] of Object.entries(shape)) {
    const path = prefix ? `${prefix}.${key}` : key;
    yield [path, sp];
    if (sp.kind === 'object') yield* walkShape(sp.shape, path);
    if (sp.kind === 'array' && sp.of?.kind === 'object') yield* walkShape(sp.of.shape, `${path}[]`);
  }
}

/** Read a dotted path out of a record. Returns undefined for a path
 *  that does not exist, which the caller must distinguish from null. */
export function readPath(record, path) {
  return path.split('.').reduce((acc, k) => (acc === null || acc === undefined ? undefined : acc[k]), record);
}

export const FIELD_EPISTEMIC_VALUES = FIELD_EPISTEMICS;
