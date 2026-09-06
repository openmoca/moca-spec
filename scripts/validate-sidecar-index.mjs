import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemaPath = join(root, 'schemas/core/sidecar-index.schema.json');
const fixturePath = join(
  root,
  'examples/indices/python-312-docs.moca.idx/index.json'
);
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const validate = ajv.compile(schema);

function reportErrors(label) {
  console.error(`[FAIL] ${label}:`);
  for (const error of validate.errors ?? []) {
    console.error(`  ${error.instancePath || '/'} ${error.message}`);
  }
}

let failed = false;

if (!validate(fixture)) {
  reportErrors('reference sidecar manifest does not conform to the schema');
  failed = true;
} else {
  console.log('[OK]   reference sidecar manifest conforms to sidecar schema');
}

const withoutHash = { ...fixture };
delete withoutHash.target_package_hash;
if (!validate(withoutHash)) {
  reportErrors('sidecar manifest without optional target_package_hash is invalid');
  failed = true;
} else {
  console.log('[OK]   target_package_hash is optional');
}

const invalidHash = { ...fixture, target_package_hash: 'sha256:not-a-digest' };
if (validate(invalidHash)) {
  console.error('[FAIL] malformed target_package_hash was accepted');
  failed = true;
} else {
  console.log('[OK]   malformed target_package_hash is rejected');
}

if (failed) {
  console.error('\nSidecar index validation failed.');
  process.exit(1);
}

console.log('\nSidecar index validation succeeded.');