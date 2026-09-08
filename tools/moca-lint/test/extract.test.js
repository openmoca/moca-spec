import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import AdmZip from 'adm-zip';
import { extractArchive, validateArchiveEntries, UsageError } from '../lib/target.js';
import { packPackage } from '../lib/pack.js';
import { computeCanonicalDigest } from '../../../scripts/validate-canonical-digest.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');

function tempDir(prefix = 'moca-lint-extract-test-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

test('extractArchive extracts a valid .moca archive to a fresh destination directory', async () => {
  const workDir = tempDir();
  try {
    const archivePath = join(workDir, 'pkg.moca');
    const { success } = await packPackage({ rootDir: level1MinimalDir, outPath: archivePath });
    assert.ok(success);

    const destDir = join(workDir, 'extracted');
    extractArchive(archivePath, destDir);

    assert.ok(existsSync(join(destDir, 'moca.json')));
    assert.ok(existsSync(join(destDir, 'content')));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('pack -> extract round trip reproduces byte-identical content (canonicalDigest matches)', async () => {
  const workDir = tempDir();
  try {
    const archivePath = join(workDir, 'pkg.moca');
    await packPackage({ rootDir: level1MinimalDir, outPath: archivePath });

    const destDir = join(workDir, 'extracted');
    extractArchive(archivePath, destDir);

    const originalDigest = computeCanonicalDigest(level1MinimalDir);
    const extractedDigest = computeCanonicalDigest(destDir);
    assert.equal(extractedDigest, originalDigest);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('validateArchiveEntries rejects an entry name containing ".."', () => {
  // adm-zip's own addFile() sanitizes a leading "../" out of the entry name
  // on write (confirmed: addFile('../evil.txt', ...) is stored as
  // "evil.txt"), so a malicious entry name can't be constructed through its
  // normal write API -- exactly the zip-slip defense target.js's own
  // comment describes. validateArchiveEntries only needs zip.getEntries()
  // to return entry-like objects, so exercise its actual check directly
  // with a duck-typed mock standing in for a zip hand-crafted by some other
  // tool (this is what the entryName.includes('..') check in target.js
  // exists to catch on the read side).
  const maliciousZip = {
    getEntries: () => [{ entryName: '../evil.txt', header: { size: 1 } }],
  };
  assert.throws(() => validateArchiveEntries(maliciousZip), UsageError);
});

test('extractArchive refuses a non-.moca/.zip file', () => {
  const workDir = tempDir();
  try {
    const notAnArchive = join(workDir, 'not-an-archive.txt');
    writeFileSync(notAnArchive, 'plain text');
    assert.throws(() => extractArchive(notAnArchive, join(workDir, 'out')), UsageError);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('validateArchiveEntries rejects an archive exceeding an injected entry-count limit', () => {
  const zip = new AdmZip();
  zip.addFile('a.txt', Buffer.from('a'));
  zip.addFile('b.txt', Buffer.from('b'));
  zip.addFile('c.txt', Buffer.from('c'));
  assert.throws(() => validateArchiveEntries(zip, { maxEntries: 2 }), UsageError);
  // The same archive passes under the real (much larger) default limit.
  assert.doesNotThrow(() => validateArchiveEntries(zip));
});

test('validateArchiveEntries rejects an archive exceeding an injected uncompressed-size limit', () => {
  const zip = new AdmZip();
  zip.addFile('big.txt', Buffer.from('x'.repeat(1000)));
  assert.throws(() => validateArchiveEntries(zip, { maxUncompressedBytes: 10 }), UsageError);
  assert.doesNotThrow(() => validateArchiveEntries(zip));
});

test('validateArchiveEntries accepts a well-formed small archive under default limits', () => {
  const zip = new AdmZip();
  zip.addFile('moca.json', Buffer.from('{}'));
  assert.doesNotThrow(() => validateArchiveEntries(zip));
});
