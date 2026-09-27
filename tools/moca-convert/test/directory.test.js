import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { convert } from '../lib/adapters/directory.js';
import { UsageError } from '../lib/target.js';
import { writeDraft } from '../lib/write.js';
import { readPackage } from '@openmoca/moca-core';

const lintPackage = async ({ rootDir }) => ({ findings: (await readPackage(rootDir)).diagnostics });

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'directory');

test('converts a nested directory of Markdown files into content nodes at matching paths', () => {
  const draft = convert({
    inputPath: join(fixturesDir, 'basic-nested'),
    options: { id: 'https://example.com/test/basic-nested', title: 'Basic Nested' },
  });

  const paths = draft.contentNodes.map((n) => n.path).sort();
  assert.deepEqual(paths, ['content/guides/advanced.md', 'content/guides/setup.md', 'content/intro.md']);
  assert.deepEqual(draft.manifest, {
    $schema: 'https://w3id.org/moca/schemas/v1/manifest.schema.json',
    mocaVersion: '0.2',
    id: 'https://example.com/test/basic-nested',
    version: '1.0.0',
    title: 'Basic Nested',
  });
});

test('a file with no frontmatter gains the OKF type and a title from its heading, and nothing else', () => {
  const draft = convert({
    inputPath: join(fixturesDir, 'basic-nested'),
    options: { id: 'https://example.com/test/basic-nested', title: 'Basic Nested' },
  });
  const intro = draft.contentNodes.find((n) => n.path === 'content/intro.md');
  assert.ok(intro.body.startsWith('---\ntype: Document\ntitle: Introduction\n---\n'));
  assert.ok(intro.body.includes('# Introduction'));
});

test('--type overrides the adapter default type', () => {
  const draft = convert({
    inputPath: join(fixturesDir, 'basic-nested'),
    options: { id: 'https://example.com/test/basic-nested', title: 'Basic Nested', type: 'Runbook' },
  });
  assert.ok(draft.contentNodes.every((n) => n.body.includes('type: Runbook')));
});

test('a package id that is not an absolute URI is refused', () => {
  assert.throws(
    () => convert({ inputPath: join(fixturesDir, 'basic-nested'), options: { id: 'basic-nested', title: 'X' } }),
    UsageError,
  );
});

test('existing frontmatter, including a custom id, is preserved', () => {
  const draft = convert({
    inputPath: join(fixturesDir, 'frontmatter-preserved'),
    options: { id: 'https://example.com/test/frontmatter-preserved', title: 'Frontmatter Preserved' },
  });
  const [node] = draft.contentNodes;
  assert.match(node.body, /^---/);
  // js-yaml quotes values containing ":" on re-serialization, so the id
  // survives but isn't necessarily byte-identical to the source's own
  // (unquoted) frontmatter style.
  assert.match(node.body, /id:\s*['"]?urn:node:custom-id['"]?/);
  assert.match(node.body, /title:\s*Custom Document/);
});

test('--id is required', () => {
  assert.throws(
    () => convert({ inputPath: join(fixturesDir, 'basic-nested'), options: { title: 'X' } }),
    UsageError
  );
});

test('--title is required', () => {
  assert.throws(
    () => convert({ inputPath: join(fixturesDir, 'basic-nested'), options: { id: 'https://example.com/x' } }),
    UsageError
  );
});

test('a directory with no Markdown files is a usage error', () => {
  assert.throws(
    () =>
      convert({
        inputPath: join(fixturesDir, 'no-markdown'),
        options: { id: 'https://example.com/test/no-markdown', title: 'No Markdown' },
      }),
    UsageError
  );
});

test('end-to-end: converted output passes moca-lint with zero error-severity findings', async () => {
  const draft = convert({
    inputPath: join(fixturesDir, 'basic-nested'),
    options: { id: 'https://example.com/test/basic-nested', title: 'Basic Nested' },
  });
  const outDir = mkdtempSync(join(tmpdir(), 'moca-convert-test-'));
  try {
    await writeDraft({ draft, outDir });
    const { findings } = await lintPackage({ rootDir: outDir });
    const errors = findings.filter((f) => f.severity === 'error');
    assert.deepEqual(errors, []);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
