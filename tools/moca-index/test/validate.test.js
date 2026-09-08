import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSidecar } from '../lib/validate.js';
import { buildIndexManifest } from '../lib/manifest.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');

const VALID_ITEMS = [{ content_path: '01-introduction.md', chunk_index: 0, chunk_count: 1, text: 'hello' }];

test('a well-formed manifest and payload against a real target is valid', () => {
  const manifest = buildIndexManifest({
    targetId: 'urn:moca:example:level-1-minimal',
    targetHash: 'sha256:c424a0f83d146271c200d73b2576f0153abf4c1de7f380ba3528f70ae2260388',
  });
  const { valid, errors } = validateSidecar({
    indexManifest: manifest,
    payloadItems: VALID_ITEMS,
    targetDir: level1MinimalDir,
  });
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('a schema-invalid manifest (missing required field) is rejected', () => {
  const manifest = buildIndexManifest({ targetId: 'urn:x' });
  delete manifest.storage;
  const { valid, errors } = validateSidecar({ indexManifest: manifest, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('a payload item violating 0 <= chunk_index < chunk_count is rejected', () => {
  const manifest = buildIndexManifest({ targetId: 'urn:moca:example:level-1-minimal' });
  const badItems = [{ content_path: '01-introduction.md', chunk_index: 2, chunk_count: 1, text: 'x' }];
  const { valid, errors } = validateSidecar({ indexManifest: manifest, payloadItems: badItems, targetDir: level1MinimalDir });
  assert.equal(valid, false);
  assert.match(errors[0], /chunk_index < chunk_count/);
});

test('a content_path that does not resolve under the target\'s content/ is rejected', () => {
  const manifest = buildIndexManifest({ targetId: 'urn:moca:example:level-1-minimal' });
  const badItems = [{ content_path: 'does-not-exist.md', chunk_index: 0, chunk_count: 1, text: 'x' }];
  const { valid, errors } = validateSidecar({ indexManifest: manifest, payloadItems: badItems, targetDir: level1MinimalDir });
  assert.equal(valid, false);
  assert.match(errors[0], /does not resolve/);
});

test('a path-traversal content_path is rejected', () => {
  const manifest = buildIndexManifest({ targetId: 'urn:moca:example:level-1-minimal' });
  const badItems = [{ content_path: '../../../../etc/passwd', chunk_index: 0, chunk_count: 1, text: 'x' }];
  const { valid, errors } = validateSidecar({ indexManifest: manifest, payloadItems: badItems, targetDir: level1MinimalDir });
  assert.equal(valid, false);
  assert.match(errors[0], /does not resolve/);
});

test('a declared target_package_hash that does not match the recomputed digest is rejected', () => {
  const manifest = buildIndexManifest({
    targetId: 'urn:moca:example:level-1-minimal',
    targetHash: `sha256:${'0'.repeat(64)}`,
  });
  const { valid, errors } = validateSidecar({ indexManifest: manifest, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir });
  assert.equal(valid, false);
  assert.match(errors[0], /target_package_hash mismatch/);
});
