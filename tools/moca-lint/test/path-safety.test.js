import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { lintPackage } from '../lib/lint.js';

function createPackage(manifest, content) {
  const rootDir = mkdtempSync(join(tmpdir(), 'moca-lint-test-'));
  mkdirSync(join(rootDir, 'content'));
  writeFileSync(join(rootDir, 'moca.json'), JSON.stringify(manifest));
  writeFileSync(join(rootDir, 'content', '01-node.md'), content);
  return rootDir;
}

test('evidence sources cannot escape permitted package directories', () => {
  const rootDir = createPackage(
    { id: 'urn:moca:test:path-safety', version: '1.0.0', title: 'Path Safety' },
    '---\nevidence:\n  - source: ../outside.txt\n---\n# Node\n'
  );

  try {
    const { findings } = lintPackage({ rootDir });
    assert.ok(findings.some((finding) => finding.code === 'E211_UNSAFE_RESOURCE_PATH'));
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('malformed integrity entries produce findings instead of throwing', () => {
  const rootDir = createPackage(
    {
      id: 'urn:moca:test:malformed-integrity',
      version: '1.0.0',
      title: 'Malformed Integrity',
      integrity: { 'content/01-node.md': 42 },
    },
    '# Node\n'
  );

  try {
    const { findings } = lintPackage({ rootDir });
    assert.ok(findings.some((finding) => finding.code === 'E102_SCHEMA_INVALID'));
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('augmentation targets cannot escape the package root', () => {
  const rootDir = createPackage(
    {
      id: 'urn:moca:test:unsafe-augmentation',
      version: '1.0.0',
      title: 'Unsafe Augmentation',
      augmentation: {
        target: '../external.zip',
        targetType: 'generic-archive',
        relationship: 'augments',
      },
    },
    '# Node\n'
  );

  try {
    const { findings } = lintPackage({ rootDir });
    assert.ok(findings.some((finding) => finding.code === 'E211_UNSAFE_RESOURCE_PATH'));
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});