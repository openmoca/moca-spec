// Validates every example package's moca.json against the core JSON Schema and
// cross-checks the skills/ + signature rule
// from core §3.1/§8.2 that the schema itself can't express (see CONTRIBUTING.md).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const coreSchema = JSON.parse(
  readFileSync(join(root, 'schemas/core/moca.schema.json'), 'utf8')
);
// Sanity-check the JSON-LD context is at least well-formed JSON.
JSON.parse(readFileSync(join(root, 'schemas/core/context.jsonld'), 'utf8'));

const validateCore = ajv.compile(coreSchema);

const exampleDirs = [
  ...readdirSync(join(root, 'examples'))
    .filter((name) => {
      const examplePath = join(root, 'examples', name);
      return (
        statSync(examplePath).isDirectory() &&
        existsSync(join(examplePath, 'moca.json'))
      );
    })
    .map((name) => join('examples', name)),
  'profiles/education/examples/education-profile',
  'profiles/eu-ai-act/examples/eu-ai-act-profile',
  'examples/composition-members/course',
  'examples/composition-members/module-1',
  'examples/composition-members/module-2',
  'examples/composition-relates/document-current',
  'examples/composition-relates/document-prior',
];

let failed = false;

for (const dir of exampleDirs) {
  const manifestPath = join(root, dir, 'moca.json');
  if (!existsSync(manifestPath)) {
    console.error(`[FAIL] ${dir}: missing moca.json`);
    failed = true;
    continue;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  if (!validateCore(manifest)) {
    failed = true;
    console.error(`[FAIL] ${dir}/moca.json does not conform to schemas/core/moca.schema.json:`);
    for (const err of validateCore.errors) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
  } else {
    console.log(`[OK]   ${dir}/moca.json conforms to core schema`);
  }

  const skillsDirExists = existsSync(join(root, dir, 'skills'));
  const hasSignature = manifest.signature && typeof manifest.signature === 'object';
  if (skillsDirExists && !hasSignature) {
    failed = true;
    console.error(`[FAIL] ${dir}: contains skills/ but moca.json has no signature object (core §3.1/§8.2)`);
  } else if (skillsDirExists) {
    console.log(`[OK]   ${dir}: skills/ present and signature object declared`);
  }
}

if (failed) {
  console.error('\nValidation failed.');
  process.exit(1);
} else {
  console.log('\nAll examples validated successfully.');
}
