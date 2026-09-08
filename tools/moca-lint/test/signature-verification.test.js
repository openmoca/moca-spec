// Conformance fixtures for Pass 4 signature verification — see
// spec/moca-trust-model.md §6 for the outcome contract and ROADMAP.md item 6.
// Each fixture is a minimal skill-bearing package demonstrating one
// specific outcome, mirroring the compatibility-corpus pattern the other
// fixtures under test/fixtures/ already establish.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage } from '../lib/lint.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const trustRoot = join(fixturesDir, 'signature.trust-root.json');

async function errorCodes(name, options = {}) {
  const { findings } = await lintPackage({ rootDir: join(fixturesDir, name), trustRoot, ...options });
  return findings.filter((f) => f.severity === 'error').map((f) => f.code);
}

test('signature-valid fixture: zero error-severity findings', async () => {
  assert.deepEqual(await errorCodes('signature-valid'), []);
});

test('signature-missing fixture reports E401 (skills/ present, no signature object)', async () => {
  assert.deepEqual(await errorCodes('signature-missing'), ['E401_UNSIGNED_SKILLS']);
});

test('signature-placeholder fixture reports E404 (literal placeholder value)', async () => {
  assert.deepEqual(await errorCodes('signature-placeholder'), ['E404_SIGNATURE_MALFORMED']);
});

test('signature-tampered fixture reports E406 (content changed after signing)', async () => {
  assert.deepEqual(await errorCodes('signature-tampered'), ['E406_SIGNATURE_INVALID']);
});

test('signature-wrong-signer fixture reports E406 (signer keyid not in the supplied trust root)', async () => {
  assert.deepEqual(await errorCodes('signature-wrong-signer'), ['E406_SIGNATURE_INVALID']);
});

test('a dsse-mode signature without --trust-root reports E406, not a silent pass', async () => {
  assert.deepEqual(await errorCodes('signature-valid', { trustRoot: undefined }), ['E406_SIGNATURE_INVALID']);
});
