import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage } from '../lib/lint.js';

const repoRoot = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), '..');
const examplesDir = join(repoRoot, 'examples');

// Verifies dsse-mode signatures on the skill-bearing examples below, signed
// with the repository's documented, non-production example key — see
// fixtures/signing-keys/README.md and spec/moca-trust-model.md.
const EXAMPLE_TRUST_ROOT = join(repoRoot, 'fixtures/signing-keys/example-signing-trust-root.json');

const CLEAN_EXAMPLES = [
  ['level-1-bare', join(examplesDir, 'level-1-bare')],
  ['level-1-minimal', join(examplesDir, 'level-1-minimal')],
  ['level-2-semantic', join(examplesDir, 'level-2-semantic')],
  ['level-3-extended', join(examplesDir, 'level-3-extended'), EXAMPLE_TRUST_ROOT],
  ['education-profile', join(repoRoot, 'profiles/education/examples/education-profile'), EXAMPLE_TRUST_ROOT],
  ['augmentation-generic', join(examplesDir, 'augmentation-generic')],
  ['augmentation-scorm2004', join(examplesDir, 'augmentation-scorm2004')],
  ['eu-ai-act-profile', join(repoRoot, 'profiles/eu-ai-act/examples/eu-ai-act-profile'), EXAMPLE_TRUST_ROOT],
  ['composition-members/course', join(examplesDir, 'composition-members/course')],
  ['composition-members/module-1', join(examplesDir, 'composition-members/module-1')],
  ['composition-members/module-2', join(examplesDir, 'composition-members/module-2')],
  ['composition-relates/document-current', join(examplesDir, 'composition-relates/document-current')],
  ['composition-relates/document-prior', join(examplesDir, 'composition-relates/document-prior')],
];

for (const [name, rootDir, trustRoot] of CLEAN_EXAMPLES) {
  test(`${name}: zero error-severity findings (non-strict)`, async () => {
    const { findings } = await lintPackage({ rootDir, trustRoot });
    const errors = findings.filter((f) => f.severity === 'error');
    assert.deepEqual(errors, [], `expected no errors, got: ${JSON.stringify(errors, null, 2)}`);
  });
}

test('level-3-extended: --strict escalates the known dangling evidence source to an error', async () => {
  const { findings } = await lintPackage({
    rootDir: join(examplesDir, 'level-3-extended'),
    trustRoot: EXAMPLE_TRUST_ROOT,
    strict: true,
  });
  const codes = findings.filter((f) => f.severity === 'error').map((f) => f.code);
  assert.ok(codes.includes('E203_DANGLING_EVIDENCE_SOURCE'));
});

test('education-profile: --strict escalates the known undefined-concept gap to an error', async () => {
  const { findings } = await lintPackage({
    rootDir: join(repoRoot, 'profiles/education/examples/education-profile'),
    trustRoot: EXAMPLE_TRUST_ROOT,
    strict: true,
  });
  const codes = findings.filter((f) => f.severity === 'error').map((f) => f.code);
  assert.ok(codes.includes('E304_UNDEFINED_CONCEPT'));
});

test('missing moca.json reports E101 and stops further passes', async () => {
  const { findings, manifest } = await lintPackage({ rootDir: examplesDir });
  assert.equal(manifest, null);
  assert.deepEqual(
    findings.map((f) => f.code),
    ['E101_MANIFEST_MISSING']
  );
});
