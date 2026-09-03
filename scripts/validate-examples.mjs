// Validates every examples/*/moca.json against the core (and, if present,
// education) JSON Schemas, and cross-checks the skills/ + signature rule
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
const eduSchema = JSON.parse(
  readFileSync(join(root, 'schemas/education/profile.schema.json'), 'utf8')
);
// Sanity-check the JSON-LD context is at least well-formed JSON.
JSON.parse(readFileSync(join(root, 'schemas/core/context.jsonld'), 'utf8'));

const validateCore = ajv.compile(coreSchema);
const validateEdu = ajv.compile(eduSchema);

const examplesDir = join(root, 'examples');
const exampleDirs = readdirSync(examplesDir).filter((name) =>
  statSync(join(examplesDir, name)).isDirectory()
);

let failed = false;

for (const dir of exampleDirs) {
  const manifestPath = join(examplesDir, dir, 'moca.json');
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

  const eduData = manifest.profileData?.education;
  if (eduData) {
    if (!validateEdu(eduData)) {
      failed = true;
      console.error(`[FAIL] ${dir}/moca.json profileData.education does not conform to schemas/education/profile.schema.json:`);
      for (const err of validateEdu.errors) {
        console.error(`  ${err.instancePath || '/'} ${err.message}`);
      }
    } else {
      console.log(`[OK]   ${dir}/moca.json profileData.education conforms to education schema`);
    }
  }

  const skillsDirExists = existsSync(join(examplesDir, dir, 'skills'));
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
