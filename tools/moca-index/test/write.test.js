import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { writeSidecar, BuildFailedError } from '../lib/write.js';
import { UsageError } from '../lib/target.js';
import { buildIndexManifest } from '../lib/manifest.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');

const VALID_MANIFEST = buildIndexManifest({
  targetId: 'urn:moca:example:level-1-minimal',
  targetHash: 'sha256:2c9d1a433be0d3a491038195e5a624507b1e1fb45b412eb51644d221711db9ef',
});
const VALID_ITEMS = [{ content_path: '01-introduction.md', chunk_index: 0, chunk_count: 1, text: 'hello' }];

// Schema-invalid: missing required "storage".
const INVALID_MANIFEST = (() => {
  const m = buildIndexManifest({ targetId: 'urn:moca:example:level-1-minimal' });
  delete m.storage;
  return m;
})();

function tempDir() {
  return join(mkdtempSync(join(tmpdir(), 'moca-index-test-')), 'out');
}

test('writes a valid sidecar into a fresh directory', () => {
  const outPath = tempDir();
  try {
    writeSidecar({ indexManifest: VALID_MANIFEST, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir, outPath });
    assert.ok(existsSync(join(outPath, 'index.json')));
    assert.ok(existsSync(join(outPath, 'payload', 'index.jsonl')));
    const written = JSON.parse(readFileSync(join(outPath, 'index.json'), 'utf8'));
    assert.equal(written.target_package_id, 'urn:moca:example:level-1-minimal');
  } finally {
    rmSync(dirname(outPath), { recursive: true, force: true });
  }
});

test('an invalid sidecar is rejected and leaves no output on disk (fresh directory case)', () => {
  const outPath = tempDir();
  try {
    assert.throws(
      () => writeSidecar({ indexManifest: INVALID_MANIFEST, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir, outPath }),
      BuildFailedError
    );
    assert.equal(existsSync(outPath), false);
  } finally {
    rmSync(dirname(outPath), { recursive: true, force: true });
  }
});

test('refuses to write into a non-empty output directory without --force', () => {
  const nonEmptyDir = dirname(tempDir());
  writeFileSync(join(nonEmptyDir, 'existing.txt'), 'placeholder');
  try {
    assert.throws(
      () => writeSidecar({ indexManifest: VALID_MANIFEST, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir, outPath: nonEmptyDir }),
      UsageError
    );
  } finally {
    rmSync(nonEmptyDir, { recursive: true, force: true });
  }
});

test('a valid sidecar with force replaces a pre-existing non-empty output directory', () => {
  const nonEmptyDir = dirname(tempDir());
  writeFileSync(join(nonEmptyDir, 'existing.txt'), 'placeholder');
  try {
    writeSidecar({ indexManifest: VALID_MANIFEST, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir, outPath: nonEmptyDir, force: true });
    assert.equal(existsSync(join(nonEmptyDir, 'existing.txt')), false);
    assert.ok(existsSync(join(nonEmptyDir, 'index.json')));
  } finally {
    rmSync(nonEmptyDir, { recursive: true, force: true });
  }
});

test('--zip writes a single archive file instead of a directory', () => {
  const parent = mkdtempSync(join(tmpdir(), 'moca-index-test-'));
  const outPath = join(parent, 'my-package.moca.idx');
  try {
    writeSidecar({ indexManifest: VALID_MANIFEST, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir, outPath, zip: true });
    assert.ok(existsSync(outPath));
    assert.equal(statIsFile(outPath), true);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('--zip refuses to overwrite an existing output file without --force', () => {
  const parent = mkdtempSync(join(tmpdir(), 'moca-index-test-'));
  const outPath = join(parent, 'my-package.moca.idx');
  writeFileSync(outPath, 'placeholder');
  try {
    assert.throws(
      () => writeSidecar({ indexManifest: VALID_MANIFEST, payloadItems: VALID_ITEMS, targetDir: level1MinimalDir, outPath, zip: true }),
      UsageError
    );
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

function statIsFile(path) {
  return existsSync(path) && !statSync(path).isDirectory();
}
