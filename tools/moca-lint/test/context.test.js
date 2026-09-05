import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { lintPackage } from '../lib/lint.js';

test('a CURIE-bearing Level 1 package requires an inline @context prefix map', () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'moca-lint-test-'));
  mkdirSync(join(rootDir, 'content'));
  writeFileSync(
    join(rootDir, 'moca.json'),
    JSON.stringify({
      '@context': 'https://example.org/context.jsonld',
      id: 'urn:moca:test:remote-context',
      version: '1.0.0',
      title: 'Remote Context',
      entryConcepts: ['ex:Introduction'],
    })
  );
  writeFileSync(join(rootDir, 'content', '01-node.md'), '# Node\n');

  try {
    const { findings } = lintPackage({ rootDir });
    assert.ok(findings.some((finding) => finding.code === 'E106_LEVEL1_REMOTE_CONTEXT'));
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});