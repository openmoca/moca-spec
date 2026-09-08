// Smoke tests that invoke the actual bin/moca-lint.js entrypoint via a
// subprocess, specifically for the new `extract` command -- a library-level
// test (see extract.test.js) can't catch a bug confined to CLI wiring
// itself (a missing import, an option-name mismatch, an exit-code path
// never reached). Scoped to `extract` since it's the new surface most at
// risk of that class of bug; `lint`/`pack` are exercised indirectly via
// `npm run lint:moca` in CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const binPath = join(packageDir, 'bin', 'moca-lint.js');
const repoRoot = join(packageDir, '..', '..');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');

function runCli(args) {
  return spawnSync(process.execPath, [binPath, ...args], { encoding: 'utf8' });
}

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'moca-lint-cli-test-'));
}

test('CLI: pack -> extract round trip succeeds end-to-end and exits 0', () => {
  const workDir = tempDir();
  try {
    const archivePath = join(workDir, 'pkg.moca');
    const packResult = runCli(['pack', level1MinimalDir, '-o', archivePath]);
    assert.equal(packResult.status, 0, packResult.stderr);

    const destDir = join(workDir, 'extracted');
    const extractResult = runCli(['extract', archivePath, '-o', destDir]);
    assert.equal(extractResult.status, 0, extractResult.stderr);
    assert.ok(existsSync(join(destDir, 'moca.json')));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('CLI: extract --lint reports findings for the extracted package', () => {
  const workDir = tempDir();
  try {
    const archivePath = join(workDir, 'pkg.moca');
    runCli(['pack', level1MinimalDir, '-o', archivePath]);

    const destDir = join(workDir, 'extracted');
    const result = runCli(['extract', archivePath, '-o', destDir, '--lint']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('CLI: extract without -o/--out exits 2', () => {
  const workDir = tempDir();
  try {
    const archivePath = join(workDir, 'pkg.moca');
    runCli(['pack', level1MinimalDir, '-o', archivePath]);

    const result = runCli(['extract', archivePath]);
    assert.equal(result.status, 2);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('CLI: extract into a non-empty destination without --force exits 2', () => {
  const workDir = tempDir();
  try {
    const archivePath = join(workDir, 'pkg.moca');
    runCli(['pack', level1MinimalDir, '-o', archivePath]);

    // workDir already contains pkg.moca, so it's a non-empty destination.
    const result = runCli(['extract', archivePath, '-o', workDir]);
    assert.equal(result.status, 2, result.stderr);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('CLI: extracting a nonexistent archive exits 2', () => {
  const workDir = tempDir();
  try {
    const result = runCli(['extract', join(workDir, 'does-not-exist.moca'), '-o', join(workDir, 'out')]);
    assert.equal(result.status, 2);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
