import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage } from '../lib/lint.js';

const repoRoot = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), '..');
const examplesDir = join(repoRoot, 'examples');

const CLEAN_EXAMPLES = [
  ['level-1-minimal', join(examplesDir, 'level-1-minimal')],
  ['level-2-semantic', join(examplesDir, 'level-2-semantic')],
  ['level-3-extended', join(examplesDir, 'level-3-extended')],
  ['education-profile', join(repoRoot, 'profiles/education/examples/education-profile')],
  ['augmentation-generic', join(examplesDir, 'augmentation-generic')],
  ['augmentation-scorm2004', join(examplesDir, 'augmentation-scorm2004')],
  ['eu-ai-act-profile', join(repoRoot, 'profiles/eu-ai-act/examples/eu-ai-act-profile')],
];

for (const [name, rootDir] of CLEAN_EXAMPLES) {
  test(`${name}: zero error-severity findings (non-strict)`, () => {
    const { findings } = lintPackage({ rootDir });
    const errors = findings.filter((f) => f.severity === 'error');
    assert.deepEqual(errors, [], `expected no errors, got: ${JSON.stringify(errors, null, 2)}`);
  });
}

test('level-3-extended: --strict escalates the known dangling evidence source to an error', () => {
  const { findings } = lintPackage({ rootDir: join(examplesDir, 'level-3-extended'), strict: true });
  const codes = findings.filter((f) => f.severity === 'error').map((f) => f.code);
  assert.ok(codes.includes('E203_DANGLING_EVIDENCE_SOURCE'));
});

test('education-profile: --strict escalates the known undefined-concept gap to an error', () => {
  const { findings } = lintPackage({
    rootDir: join(repoRoot, 'profiles/education/examples/education-profile'),
    strict: true,
  });
  const codes = findings.filter((f) => f.severity === 'error').map((f) => f.code);
  assert.ok(codes.includes('E304_UNDEFINED_CONCEPT'));
});

test('missing moca.json reports E101 and stops further passes', () => {
  const { findings, manifest } = lintPackage({ rootDir: examplesDir });
  assert.equal(manifest, null);
  assert.deepEqual(
    findings.map((f) => f.code),
    ['E101_MANIFEST_MISSING']
  );
});
