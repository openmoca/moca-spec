import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage } from '../lib/lint.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('profileData is opaque to core-only validation', async () => {
  const rootDir = join(fixturesDir, 'opaque-profile-data');
  const { findings } = await lintPackage({ rootDir });
  assert.equal(findings.some((finding) => finding.code === 'E102_SCHEMA_INVALID'), false);
  assert.equal(findings.some((finding) => finding.severity === 'error'), false);
});

test('unrecognized-profile fixture: unknown epistemicStatus is a warning, not an error', async () => {
  const rootDir = join(fixturesDir, 'unrecognized-profile');
  const { findings } = await lintPackage({ rootDir });
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes('E210_UNVERIFIABLE_EPISTEMIC_STATUS'));
  assert.equal(findings.some((f) => f.severity === 'error'), false);

  const strictFindings = (await lintPackage({ rootDir, strict: true })).findings;
  const strictErrors = strictFindings.filter((f) => f.severity === 'error').map((f) => f.code);
  assert.ok(strictErrors.includes('E210_UNVERIFIABLE_EPISTEMIC_STATUS'));
});
