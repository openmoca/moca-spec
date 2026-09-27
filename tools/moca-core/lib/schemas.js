// Vendored copies of schemas/v1/*.schema.json. scripts/check-vendored-schemas.mjs
// keeps them byte-identical to the normative files at the repository root.
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const load = (name) => JSON.parse(readFileSync(new URL(`./schemas/${name}.schema.json`, import.meta.url), 'utf8'));

export const SCHEMAS = Object.freeze({
  manifest: load('manifest'),
  node: load('node'),
  citationRecord: load('citation-record'),
  sidecarIndex: load('sidecar-index'),
  reviewPredicate: load('review-predicate'),
  trustRoot: load('trust-root'),
  searchHit: load('search-hit'),
});

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const compiled = Object.fromEntries(Object.entries(SCHEMAS).map(([k, s]) => [k, ajv.compile(s)]));

/**
 * @param {keyof typeof SCHEMAS} name
 * @param {unknown} value
 * @returns {string[]} human-readable errors; empty when valid
 */
export function validateAgainst(name, value) {
  const validate = compiled[name];
  if (validate(value)) return [];
  const seen = new Set();
  const out = [];
  for (const err of validate.errors ?? []) {
    // oneOf/anyOf produce one error per branch; report the outer failure once.
    const where = err.instancePath || '(root)';
    const msg = `${where} ${err.message}${err.params?.allowedValues ? ` (${err.params.allowedValues.join(', ')})` : ''}`;
    if (!seen.has(msg)) {
      seen.add(msg);
      out.push(msg);
    }
  }
  return out;
}
