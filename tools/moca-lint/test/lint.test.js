import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPackage, packPackage, extractArchive } from '../lib/index.js';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const bin = join(repo, 'tools/moca-lint/bin/moca-lint.js');
const trustRoot = join(repo, 'fixtures/signing-keys/trust-root.json');

test('the support-kb example lints clean with the example trust root', async () => {
  const r = await lintPackage({ target: join(repo, 'examples/support-kb'), trustRoot, sidecar: join(repo, 'examples/sidecars/support-kb.moca.idx') });
  assert.equal(r.ok, true);
  assert.deepEqual(r.diagnostics.filter((d) => d.severity !== 'info'), []);
});

test('pack writes an archive with the same digest, and refuses an invalid package', async () => {
  const out = join(mkdtempSync(join(tmpdir(), 'moca-lint-')), 'kb.moca');
  const packed = await packPackage({ dir: join(repo, 'examples/support-kb'), out, trustRoot });
  assert.equal(packed.written, true);
  const again = await lintPackage({ target: out, trustRoot });
  assert.equal(again.result.digest, packed.result.digest);
  assert.deepEqual(again.result.capabilities.sort(), packed.result.capabilities.sort());

  const bad = join(mkdtempSync(join(tmpdir(), 'moca-lint-')), 'bad.moca');
  const refused = await packPackage({ dir: join(repo, 'conformance/fixtures/type-missing'), out: bad });
  assert.equal(refused.written, false);
  assert.equal(existsSync(bad), false);

  const dest = mkdtempSync(join(tmpdir(), 'moca-extract-'));
  assert.ok(extractArchive({ archive: out, out: dest }) > 0);
  assert.equal((await lintPackage({ target: dest })).result.digest, packed.result.digest);
});

test('the CLI exits 1 on errors and 0 on a clean package', () => {
  const ok = spawnSync(process.execPath, [bin, 'lint', join(repo, 'examples/minimal')], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  const bad = spawnSync(process.execPath, [bin, 'lint', join(repo, 'conformance/fixtures/type-missing'), '--format', 'json'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).diagnostics[0].code, 'C003_TYPE_MISSING');
});

test('digest prints the canonical digest', () => {
  const r = spawnSync(process.execPath, [bin, 'digest', join(repo, 'examples/minimal')], { encoding: 'utf8' });
  assert.match(r.stdout.trim(), /^sha256:[a-f0-9]{64}$/);
});

test('--strict promotes warnings to errors', async () => {
  const r = await lintPackage({ target: join(repo, 'conformance/fixtures/link-unresolved'), strict: true });
  assert.equal(r.ok, false);
});
