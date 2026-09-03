import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveProfileName, loadProfileSchema } from '../lib/profiles.js';
import { lintPackage } from '../lib/lint.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('deriveProfileName extracts the short name from a profile URI', () => {
  assert.equal(deriveProfileName('https://openmoca.org/profiles/education/v1'), 'education');
  assert.equal(deriveProfileName('https://example.org/profiles/customprofile/v1'), 'customprofile');
  assert.equal(deriveProfileName('not-a-url'), null);
  assert.equal(deriveProfileName('https://example.org/no-profiles-segment'), null);
});

test('loadProfileSchema discovers a schema by convention under a given schemasRoot', () => {
  const schemasRoot = join(fixturesDir, 'profile-schemas');
  const schema = loadProfileSchema('sampleprofile', schemasRoot);
  assert.equal(schema.title, 'Sample Profile Data (test fixture)');
  assert.equal(loadProfileSchema('no-such-profile', schemasRoot), null);
});

test('unrecognized-profile fixture: unknown epistemicStatus is a warning, not an error', () => {
  const rootDir = join(fixturesDir, 'unrecognized-profile');
  const { findings } = lintPackage({ rootDir });
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes('E210_UNVERIFIABLE_EPISTEMIC_STATUS'));
  assert.equal(findings.some((f) => f.severity === 'error'), false);

  const strictFindings = lintPackage({ rootDir, strict: true }).findings;
  const strictErrors = strictFindings.filter((f) => f.severity === 'error').map((f) => f.code);
  assert.ok(strictErrors.includes('E210_UNVERIFIABLE_EPISTEMIC_STATUS'));
});
