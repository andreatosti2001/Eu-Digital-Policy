/* ============================================================
   agent/schemas/export.mjs — JSON Schema, derived on demand

   The contracts are written as data in this repository's own terms,
   not as JSON Schema, for two reasons. Validating JSON Schema needs
   a validator, and a dependency is a red-tier prohibition. And JSON
   Schema cannot express most of what these contracts are actually
   for: that a factual field must cite evidence, that "unknown" is
   not null, that an autonomy class has to match what the record
   touches.

   So JSON Schema is an EXPORT, for a consumer outside this
   repository, and it is derived on demand rather than committed. A
   checked-in copy would be a second home for every field
   definition, and the first time somebody edited one and not the
   other, the two would disagree about what a contract is.

   The export carries the structure and the documentation. It does
   not carry the cross-field rules, and it says so in its own
   description rather than letting a consumer believe a schema
   validator is the whole gate.
   ============================================================ */

import { getContract, CONTRACT_LIST } from './registry.mjs';

const NOT_THE_WHOLE_GATE = 'Structure only. The epistemic, evidence and governance rules of this contract are enforced by agent/schemas/validate.mjs and cannot be expressed in JSON Schema — passing this schema is necessary and not sufficient.';

function specToSchema(sp) {
  const base = { description: sp.doc };
  let node;
  switch (sp.kind) {
    case 'string': node = { type: 'string', minLength: sp.minLength, maxLength: sp.maxLength, pattern: sp.pattern }; break;
    case 'enum': node = { enum: [...sp.values] }; break;
    case 'literal': node = { const: sp.value }; break;
    case 'boolean': node = { type: 'boolean' }; break;
    case 'integer': node = { type: 'integer', minimum: sp.min }; break;
    case 'number': node = { type: 'number', minimum: sp.min, maximum: sp.max }; break;
    case 'iso8601': node = { type: 'string', format: 'date-time' }; break;
    case 'hex': node = { type: 'string', pattern: `^[0-9a-f]{${sp.length}}$` }; break;
    case 'url': node = { type: 'string', format: 'uri' }; break;
    case 'array': node = { type: 'array', minItems: sp.min || undefined, items: specToSchema(sp.of) }; break;
    case 'object': node = shapeToSchema(sp.shape); break;
    case 'any': node = {}; break;
    default: node = {};
  }
  for (const k of Object.keys(node)) if (node[k] === undefined) delete node[k];

  const alternatives = [];
  if (sp.nullable) alternatives.push({ type: 'null' });
  if (sp.unknownable) alternatives.push({ const: 'unknown', description: 'Researched and not publicly determinable. Not the same state as null, which means nobody looked.' });
  const value = alternatives.length ? { anyOf: [node, ...alternatives] } : node;

  return {
    ...base,
    ...value,
    'x-epistemic': sp.epistemic,
  };
}

function shapeToSchema(shape) {
  const properties = {};
  const required = [];
  for (const [key, sp] of Object.entries(shape)) {
    properties[key] = specToSchema(sp);
    if (sp.required) required.push(key);
  }
  return { type: 'object', additionalProperties: false, properties, required };
}

/** One contract as JSON Schema 2020-12. */
export function toJsonSchema(name) {
  const c = getContract(name);
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://andreatosti2001.github.io/Eu-Digital-Policy/agent/schemas/${c.name}.schema.json`,
    title: c.name,
    description: `${c.doc}\n\n${NOT_THE_WHOLE_GATE}`,
    'x-contract-kind': c.kind,
    'x-contract-version': c.version,
    'x-id-field': c.id_field,
    'x-forbidden-fields': c.forbidden,
    'x-rule-count': c.rules.length,
    ...shapeToSchema(c.fields),
  };
}

/** All eighteen, keyed by name. */
export function allJsonSchemas() {
  return Object.fromEntries(CONTRACT_LIST.map((c) => [c.name, toJsonSchema(c.name)]));
}
