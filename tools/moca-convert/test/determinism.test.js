import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { convert as convertDirectory } from '../lib/adapters/directory.js';
import { convert as convertMarkdown } from '../lib/adapters/markdown.js';
import { convert as convertObsidian } from '../lib/adapters/obsidian.js';
import { convert as convertOpenapi } from '../lib/adapters/openapi.js';
import { writeDraft } from '../lib/write.js';
import { walkFiles } from '../lib/walk.js';

const fixturesDir = dirname(fileURLToPath(import.meta.url)) + '/fixtures';

function assertDeterministic(convertFn, inputPath, options) {
  const outDirA = mkdtempSync(join(tmpdir(), 'moca-convert-test-a-'));
  const outDirB = mkdtempSync(join(tmpdir(), 'moca-convert-test-b-'));
  try {
    writeDraft({ draft: convertFn({ inputPath, options }), outDir: outDirA });
    writeDraft({ draft: convertFn({ inputPath, options }), outDir: outDirB });

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
}

test('directory adapter: repeated runs against the same input produce byte-identical output', () => {
  assertDeterministic(convertDirectory, join(fixturesDir, 'directory', 'basic-nested'), {
    id: 'urn:moca:test:determinism-directory',
    title: 'Determinism Directory',
  });
});

test('markdown adapter: repeated runs against the same input produce byte-identical output', () => {
  assertDeterministic(convertMarkdown, join(fixturesDir, 'markdown', 'loose-files', '*.md'), {
    id: 'urn:moca:test:determinism-markdown',
    title: 'Determinism Markdown',
  });
});

test('obsidian adapter: repeated runs against the same input produce byte-identical output', () => {
  assertDeterministic(convertObsidian, join(fixturesDir, 'obsidian', 'vault-basic'), {
    id: 'urn:moca:test:determinism-obsidian',
    title: 'Determinism Obsidian',
  });
});

test('openapi adapter: repeated runs against the same input produce byte-identical output', () => {
  assertDeterministic(convertOpenapi, join(fixturesDir, 'openapi', 'suitable.yaml'), {
    id: 'urn:moca:test:determinism-openapi',
  });
});
