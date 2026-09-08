import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSidecar } from '../lib/build.js';
import { UsageError } from '../lib/target.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');
const composedCourseDir = join(repoRoot, 'examples', 'composition-members', 'course');
const unboundPackageDir = join(fixturesDir, 'unbound-package');

test('a target with a canonicalDigest produces a matching sha256:-prefixed target_package_hash', () => {
  const { indexManifest } = buildSidecar({ targetDir: level1MinimalDir, options: {} });
  const declaredDigest = JSON.parse(readFileSync(join(level1MinimalDir, 'moca.json'), 'utf8')).canonicalDigest.value;
  assert.equal(indexManifest.target_package_hash, `sha256:${declaredDigest}`);
});

test('a target with no canonicalDigest refuses without --allow-unbound', () => {
  assert.throws(
    () => buildSidecar({ targetDir: unboundPackageDir, options: {} }),
    UsageError
  );
});

test('a target with no canonicalDigest proceeds, unbound, with --allow-unbound', () => {
  const { indexManifest } = buildSidecar({ targetDir: unboundPackageDir, options: { allowUnbound: true } });
  assert.equal(indexManifest.target_package_hash, undefined);
});

test('a composed target (composition.members present) is refused, even with --allow-unbound', () => {
  assert.throws(
    () => buildSidecar({ targetDir: composedCourseDir, options: { allowUnbound: true } }),
    UsageError
  );
});
