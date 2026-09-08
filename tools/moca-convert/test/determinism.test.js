import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { convert as convertDirectory } from '../lib/adapters/directory.js';
import { writeDraft } from '../lib/write.js';
import { walkFiles } from '../lib/walk.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'directory');

test('directory adapter: repeated runs against the same input produce byte-identical output', () => {
  const inputPath = join(fixturesDir, 'basic-nested');
  const options = { id: 'urn:moca:test:determinism', title: 'Determinism' };

  const outDirA = mkdtempSync(join(tmpdir(), 'moca-convert-test-a-'));
  const outDirB = mkdtempSync(join(tmpdir(), 'moca-convert-test-b-'));
  try {
    writeDraft({ draft: convertDirectory({ inputPath, options }), outDir: outDirA });
    writeDraft({ draft: convertDirectory({ inputPath, options }), outDir: outDirB });

    const filesA = walkFiles(outDirA);
    const filesB = walkFiles(outDirB);
    assert.deepEqual(filesA, filesB, 'the same set of relative paths must be produced every run');

    for (const relPath of filesA) {
      assert.equal(
        readFileSync(join(outDirA, relPath), 'utf8'),
        readFileSync(join(outDirB, relPath), 'utf8'),
        `content of ${relPath} must be byte-identical across runs`
      );
    }
  } finally {
    rmSync(outDirA, { recursive: true, force: true });
    rmSync(outDirB, { recursive: true, force: true });
  }
});
