// Regenerates conformance/cases/*.json by running the reference implementation
// against each fixture in conformance/fixtures/.
//
// Expectations are OBSERVED from the reference implementation rather than
// hand-written, so they cannot drift from it. What each case asserts is the
// set of diagnostic CODES and the derived outcome -- never message prose,
// which the SDK contract explicitly declares unstable (§6).
//
//   node scripts/generate-conformance-cases.mjs            # write cases
//   node scripts/generate-conformance-cases.mjs --check    # verify, write nothing
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { lintPackage } from '@openmoca/moca-lint/lib/lint.js';

const root = process.cwd();
const check = process.argv.includes('--check');
const FIXTURES = join(root, 'conformance/fixtures');
const CASES = join(root, 'conformance/cases');

// Fixtures whose signatures verify against a bundled trust root.
const TRUST_ROOTS = {
  'signature-valid': 'signature.trust-root.json',
  'signature-tampered': 'signature.trust-root.json',
  'signature-wrong-signer': 'signature.trust-root.json',
  'signature-placeholder': 'signature.trust-root.json',
  'signature-missing': 'signature.trust-root.json',
  'skill-frontmatter-invalid': 'skill-frontmatter-invalid.trust-root.json',
  'valid-level-3-extended': null,
  'valid-use-cases-support-kb': null,
};
const EXAMPLE_TRUST_ROOT = join(root, 'fixtures/signing-keys/example-signing-trust-root.json');

// Which contract capabilities each case exercises, so an SDK can declare
// partial support and still demonstrate conformance (contract §14).
function capabilitiesFor(name, manifest, findings) {
  const caps = new Set(['manifest', 'content', 'diagnostics']);
  if (manifest?.composition) caps.add('composition');
  if (manifest?.canonicalDigest) caps.add('integrity');
  if (manifest?.signature) caps.add('signatures');
  if (manifest?.profile?.length) caps.add('profiles');
  if (manifest?.integrity) caps.add('integrity');
  if (findings.some((f) => f.code.startsWith('E3'))) caps.add('semantic');
  return [...caps].sort();
}

function packageRootsIn(dir) {
  const roots = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const abs = join(dir, entry.name);
    if (existsSync(join(abs, 'moca.json'))) roots.push(abs);
    else roots.push(...packageRootsIn(abs));
  }
  return roots;
}

mkdirSync(CASES, { recursive: true });

const generated = [];
for (const packageRoot of packageRootsIn(FIXTURES).sort()) {
  const fixture = relative(FIXTURES, packageRoot).split('\\').join('/');
  const top = fixture.split('/')[0];

  let trustRoot;
  if (Object.prototype.hasOwnProperty.call(TRUST_ROOTS, top)) {
    const named = TRUST_ROOTS[top];
    trustRoot = named ? join(FIXTURES, named) : EXAMPLE_TRUST_ROOT;
  } else if (fixture.startsWith('valid-level-3') || fixture.startsWith('valid-use-cases')) {
    trustRoot = EXAMPLE_TRUST_ROOT;
  } else if (existsSync(join(packageRoot, 'skills'))) {
    trustRoot = EXAMPLE_TRUST_ROOT;
  }

  const { findings, manifest } = await lintPackage({ rootDir: packageRoot, trustRoot });

  const codes = findings.map((f) => f.code).sort();
  const errors = findings.filter((f) => f.severity === 'error').map((f) => f.code).sort();
  const warnings = findings.filter((f) => f.severity === 'warning').map((f) => f.code).sort();
  const infos = findings.filter((f) => f.severity === 'info').map((f) => f.code).sort();

  const caseDoc = {
    name: fixture,
    fixture: `fixtures/${fixture}`,
    description: null,
    trustRoot: trustRoot ? relative(root, trustRoot).split('\\').join('/') : null,
    capabilities: capabilitiesFor(fixture, manifest, findings),
    expect: {
      manifestParsed: manifest !== null,
      valid: errors.length === 0,
      codes,
      bySeverity: { error: errors, warning: warnings, info: infos },
    },
  };

  const outPath = join(CASES, `${fixture.split('/').join('__')}.json`);
  const serialized = `${JSON.stringify(caseDoc, null, 2)}\n`;

  if (check) {
    if (!existsSync(outPath)) {
      console.error(`[FAIL] missing case file for ${fixture}`);
      process.exitCode = 1;
      continue;
    }
    const existing = JSON.parse(readFileSync(outPath, 'utf8'));
    // Descriptions are hand-written; compare everything else.
    const { description: _d, ...restExisting } = existing;
    const { description: _n, ...restNew } = caseDoc;
    if (JSON.stringify(restExisting) !== JSON.stringify(restNew)) {
      console.error(`[FAIL] ${fixture}: case file no longer matches reference behaviour`);
      process.exitCode = 1;
    }
  } else {
    // Preserve a hand-written description across regeneration.
    if (existsSync(outPath)) {
      const existing = JSON.parse(readFileSync(outPath, 'utf8'));
      if (existing.description) caseDoc.description = existing.description;
    }
    writeFileSync(outPath, `${JSON.stringify(caseDoc, null, 2)}\n`, 'utf8');
  }
  generated.push({ fixture, codes: codes.length, valid: errors.length === 0 });
}

if (check) {
  if (process.exitCode) {
    console.error('\nConformance cases are out of date. Run: npm run conformance:generate');
  } else {
    console.log(`All ${generated.length} conformance case(s) match reference behaviour.`);
  }
} else {
  console.log(`Wrote ${generated.length} conformance case(s) to conformance/cases/.`);
  for (const g of generated) {
    console.log(`  ${g.valid ? 'valid  ' : 'INVALID'} ${g.fixture} (${g.codes} finding code(s))`);
  }
}
