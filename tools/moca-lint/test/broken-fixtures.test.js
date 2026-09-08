import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage } from '../lib/lint.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

async function errorCodes(rootDir, options = {}) {
  const { findings } = await lintPackage({ rootDir, ...options });
  return findings.filter((f) => f.severity === 'error').map((f) => f.code);
}

test('excluded-properties fixture reports E103', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'excluded-properties')), [
    'E103_EXCLUDED_PROPERTIES',
  ]);
});

test('bad-epistemic-status fixture reports E204', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'bad-epistemic-status')), [
    'E204_INVALID_EPISTEMIC_STATUS',
  ]);
});

test('integrity-mismatch fixture reports E402', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'integrity-mismatch')), [
    'E402_INTEGRITY_MISMATCH',
  ]);
});

test('skill-frontmatter-invalid fixture reports E206 (twice: missing description, non-array allowed-tools)', async () => {
  // Signed with a dedicated, checked-in dsse test key (not for production
  // use) so this fixture isolates E206 rather than also tripping the
  // signature-verification checks pass 4 now performs.
  const trustRoot = join(fixturesDir, 'skill-frontmatter-invalid.trust-root.json');
  assert.deepEqual(await errorCodes(join(fixturesDir, 'skill-frontmatter-invalid'), { trustRoot }), [
    'E206_SKILL_FRONTMATTER_INVALID',
    'E206_SKILL_FRONTMATTER_INVALID',
  ]);
});

test('duplicate-node-id fixture reports E207', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'duplicate-node-id')), [
    'E207_DUPLICATE_NODE_ID',
  ]);
});

test('invalid-evidence-locator fixture reports E208', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'invalid-evidence-locator')), [
    'E208_INVALID_EVIDENCE_LOCATOR',
  ]);
});

test('invalid-claim fixture reports E209', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'invalid-claim')), ['E209_INVALID_CLAIM']);
});

test('rocrate-metadata-invalid fixture reports E405 only under --strict', async () => {
  assert.deepEqual(await errorCodes(join(fixturesDir, 'rocrate-metadata-invalid')), []);
  assert.deepEqual(await errorCodes(join(fixturesDir, 'rocrate-metadata-invalid'), { strict: true }), [
    'E405_ROCRATE_METADATA_INVALID',
  ]);
});
