import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage } from '../lib/lint.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function errorCodes(rootDir, options = {}) {
  const { findings } = lintPackage({ rootDir, ...options });
  return findings.filter((f) => f.severity === 'error').map((f) => f.code);
}

test('excluded-properties fixture reports E103', () => {
  assert.deepEqual(errorCodes(join(fixturesDir, 'excluded-properties')), [
    'E103_EXCLUDED_PROPERTIES',
  ]);
});

test('bad-epistemic-status fixture reports E204', () => {
  assert.deepEqual(errorCodes(join(fixturesDir, 'bad-epistemic-status')), [
    'E204_INVALID_EPISTEMIC_STATUS',
  ]);
});

test('integrity-mismatch fixture reports E402', () => {
  assert.deepEqual(errorCodes(join(fixturesDir, 'integrity-mismatch')), [
    'E402_INTEGRITY_MISMATCH',
  ]);
});
