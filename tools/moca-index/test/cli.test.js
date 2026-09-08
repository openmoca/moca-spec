// Smoke tests that invoke the actual bin/moca-index.js entrypoint via a
// subprocess -- library-level tests (build.test.js, write.test.js, etc.)
// can't catch a bug confined to CLI wiring itself (this class of bug was
// found for real in tools/moca-convert's bin script earlier this session).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const binPath = join(packageDir, 'bin', 'moca-index.js');
const repoRoot = join(packageDir, '..', '..');
const level1MinimalDir = join(repoRoot, 'examples', 'level-1-minimal');
const fixturesDir = join(packageDir, 'test', 'fixtures');

function runCli(args) {
  return spawnSync(process.execPath, [binPath, ...args], { encoding: 'utf8' });
}

function tempOutDir() {
  const parent = mkdtempSync(join(tmpdir(), 'moca-index-cli-test-'));
  return join(parent, 'out');
}

function cleanup(outPath) {
  rmSync(dirname(outPath), { recursive: true, force: true });
}

test('CLI: build succeeds end-to-end against a bound target and exits 0', () => {
  const outPath = tempOutDir();
  try {
    const result = runCli(['build', level1MinimalDir, '-o', outPath]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(outPath, 'index.json')));
  } finally {
    cleanup(outPath);
  }
});

test('CLI: build against an unbound target without --allow-unbound exits 2', () => {
  const outPath = tempOutDir();
  try {
    const result = runCli(['build', join(fixturesDir, 'unbound-package'), '-o', outPath]);
    assert.equal(result.status, 2);
  } finally {
    cleanup(outPath);
  }
});

test('CLI: build --allow-unbound against an unbound target exits 0', () => {
  const outPath = tempOutDir();
  try {
    const result = runCli(['build', join(fixturesDir, 'unbound-package'), '-o', outPath, '--allow-unbound']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    cleanup(outPath);
  }
});

test('CLI: build --zip writes a single archive file and exits 0', () => {
  const outPath = tempOutDir().replace(/out$/, 'out.moca.idx');
  try {
    const result = runCli(['build', level1MinimalDir, '-o', outPath, '--zip']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(outPath));
  } finally {
    cleanup(outPath);
  }
});

test('CLI: missing -o/--output exits 2', () => {
  const result = runCli(['build', level1MinimalDir]);
  assert.equal(result.status, 2);
});

test('CLI: an unknown --embedder value exits 2', () => {
  const outPath = tempOutDir();
  try {
    const result = runCli(['build', level1MinimalDir, '-o', outPath, '--embedder', 'gpt-hosted']);
    assert.equal(result.status, 2);
  } finally {
    cleanup(outPath);
  }
});

test('CLI: a nonexistent target directory exits 2', () => {
  const outPath = tempOutDir();
  try {
    const result = runCli(['build', join(fixturesDir, 'does-not-exist'), '-o', outPath]);
    assert.equal(result.status, 2);
  } finally {
    cleanup(outPath);
  }
});
