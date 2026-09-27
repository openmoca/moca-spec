import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { validateAgainst } from '@openmoca/moca-core';
import { loadLibrary, createServer } from '../lib/index.js';

const repo = fileURLToPath(new URL('../../../', import.meta.url));

async function connect(options = {}) {
  const library = await loadLibrary({
    packages: [
      { package: join(repo, 'examples/support-kb'), sidecar: join(repo, 'examples/sidecars/support-kb.moca.idx') },
      join(repo, 'examples/policy-corpus/retention-2025'),
      join(repo, 'examples/policy-corpus/retention-2026'),
    ],
    trustRoot: join(repo, 'fixtures/signing-keys/trust-root.json'),
  });
  const server = createServer(library, options);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name, args = {}) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
  return { client, call };
}

test('lists loaded packages with digest, signature status and search mode', async () => {
  const { call } = await connect();
  const list = await call('moca_list_packages');
  const kb = list.find((p) => p.id === 'https://example.com/moca/support-kb');
  assert.equal(kb.signed, true);
  assert.equal(kb.searchMode, 'sidecar');
  assert.match(kb.digest, /^sha256:/);
});

test('search returns schema-valid citation records and applies the default policy', async () => {
  const { call } = await connect();
  const { results } = await call('moca_search', { query: 'customer records retention' });
  assert.ok(results.length > 0);
  for (const r of results) assert.deepEqual(validateAgainst('citationRecord', { ...r, score: r.score }), []);
  // 1.0.0 is superseded and out of force, so only 2.0.0 is returned by default.
  assert.deepEqual(results.map((r) => r.package.version), ['2.0.0']);
  const all = await call('moca_search', { query: 'customer records retention', include_all: true });
  assert.ok(all.results.some((r) => r.package.version === '1.0.0' && r.trust.superseded));
});

test('the host audience filter cannot be widened by the caller', async () => {
  const { call } = await connect({ audiences: ['public'] });
  const { results } = await call('moca_search', { query: 'delete account', include_all: true });
  assert.ok(results.every((r) => r.audience !== 'internal'));
});

test('get_node returns the reviewed node with its attested review', async () => {
  const { call } = await connect();
  const node = await call('moca_get_node', { node_id: 'https://example.com/moca/support-kb#refund-window.md' });
  assert.equal(node.trust.attestedReviews[0].reviewer, 'human:sam.ortiz');
  assert.equal(node.evidence[0].source.id, 'terms-7');
  const fr = await call('moca_get_node', { node_id: 'https://example.com/moca/support-kb#refund-window.md', locale: 'fr' });
  assert.equal(fr.node.locale, 'fr');
});

test('search can be limited to content bound to given concepts', async () => {
  const library = await loadLibrary({ packages: [join(repo, 'profiles/ontology/examples/service-catalogue')] });
  const server = createServer(library);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
  const { results } = await call('moca_search', { query: 'service', concepts: ['https://example.org/services#ServiceBoundary'] });
  assert.deepEqual(results.map((r) => r.node.path), ['service-boundaries.md']);
});
