import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackage, bindSidecar, Library } from '@openmoca/moca-core';
import { buildSidecar, chunkRepresentation } from '../lib/index.js';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const kb = join(repo, 'examples/support-kb');

test('builds a sidecar bound to the package digest that a Reader accepts', async () => {
  const out = join(mkdtempSync(join(tmpdir(), 'moca-index-')), 'kb.moca.idx');
  const built = await buildSidecar({ pkg: kb, out, chunker: 'headings' });
  const pkg = await readPackage(kb);
  assert.equal(built.digest, pkg.digest);
  const bound = bindSidecar(out, pkg);
  assert.equal(bound.usable, true);
  const index = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'));
  assert.equal(index.target.digest, pkg.digest);
  assert.equal(index.storage.format, 'moca-jsonl-v1');
});

test('chunk offsets are byte offsets into the node file', async () => {
  const pkg = await readPackage(kb);
  const rep = pkg.nodes.find((n) => n.path === 'refund-window.md').representations.find((r) => r.locale === 'fr');
  const file = readFileSync(join(kb, rep.file));
  for (const c of chunkRepresentation(rep, 'headings')) {
    assert.equal(file.subarray(c.start, c.end).toString('utf8'), c.text);
  }
});

test('a zipped sidecar works and search uses its chunks', async () => {
  const out = join(mkdtempSync(join(tmpdir(), 'moca-index-')), 'kb.moca.idx.zip');
  await buildSidecar({ pkg: kb, out, zip: true, chunker: 'headings' });
  const pkg = await readPackage(kb);
  const bound = bindSidecar(out, pkg);
  assert.equal(bound.usable, true);
  const hits = new Library().add(pkg, { chunks: bound.chunks }).search('refund window carrier');
  assert.equal(hits[0].node.path, 'refund-window.md');
  assert.ok(hits[0].span.end > hits[0].span.start);
});

test('a sidecar is stale as soon as the package changes', async () => {
  const pkg = await readPackage(kb);
  const out = join(mkdtempSync(join(tmpdir(), 'moca-index-')), 'kb.moca.idx');
  await buildSidecar({ pkg: kb, out });
  const changed = { ...pkg, digest: `sha256:${'f'.repeat(64)}` };
  assert.equal(bindSidecar(out, changed).diagnostics[0].code, 'S003_SIDECAR_STALE');
});
