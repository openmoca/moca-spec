import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSidecar } from '../lib/build.js';
import { UsageError } from '../lib/target.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');

test('builds one chunk per content file, whole-file addressing', () => {
  const { payloadItems } = buildSidecar({ targetDir: level1MinimalDir, options: {} });
  assert.equal(payloadItems.length, 1);
  const [item] = payloadItems;
  assert.equal(item.content_path, '01-introduction.md');
  assert.equal(item.chunk_index, 0);
  assert.equal(item.chunk_count, 1);
  assert.match(item.text, /minimal grounded knowledge node/);
});

test('the payload text has frontmatter stripped', () => {
  const { payloadItems } = buildSidecar({ targetDir: level1MinimalDir, options: {} });
  assert.ok(!payloadItems[0].text.startsWith('---'));
});

test('the index manifest declares node_level chunking and fixed item_addressing', () => {
  const { indexManifest } = buildSidecar({ targetDir: level1MinimalDir, options: {} });
  assert.equal(indexManifest.manifest_version, '1.0.0');
  assert.equal(indexManifest.chunking.strategy, 'node_level');
  assert.deepEqual(indexManifest.item_addressing, {
    content_path: 'content_path',
    chunk_index: 'chunk_index',
    chunk_count: 'chunk_count',
  });
  assert.deepEqual(indexManifest.storage, { format: 'jsonl', file: 'payload/index.jsonl' });
});

test('target_package_id is the target manifest id', () => {
  const { indexManifest } = buildSidecar({ targetDir: level1MinimalDir, options: {} });
  assert.equal(indexManifest.target_package_id, 'urn:moca:example:level-1-minimal');
});

test('a target with no content files is a usage error', () => {
  assert.throws(
    () => buildSidecar({ targetDir: join(fixturesDir, 'no-content'), options: {} }),
    UsageError
  );
});

test('a nonexistent target directory is a usage error', () => {
  assert.throws(
    () => buildSidecar({ targetDir: join(fixturesDir, 'does-not-exist'), options: {} }),
    UsageError
  );
});

test('an unknown --embedder value is a usage error', () => {
  assert.throws(
    () => buildSidecar({ targetDir: level1MinimalDir, options: { embedder: 'some-hosted-api' } }),
    UsageError
  );
});

test('--embedder none (or omitted) succeeds', () => {
  assert.doesNotThrow(() => buildSidecar({ targetDir: level1MinimalDir, options: { embedder: 'none' } }));
  assert.doesNotThrow(() => buildSidecar({ targetDir: level1MinimalDir, options: {} }));
});
