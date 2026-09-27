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
  const { results } = await call('moca_search', { query: 'customer records retention', detail: 'full' });
  assert.ok(results.length > 0);
  for (const r of results) assert.deepEqual(validateAgainst('citationRecord', { ...r, score: r.score }), []);
  // 1.0.0 is superseded and out of force, so only 2.0.0 is returned by default.
  assert.deepEqual(results.map((r) => r.package.version), ['2.0.0']);
  const all = await call('moca_search', { query: 'customer records retention', include_all: true, detail: 'full' });
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
  const library = await loadLibrary({ packages: [join(repo, 'examples/service-catalogue')] });
  const server = createServer(library);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
  const { results } = await call('moca_search', { query: 'service', concepts: ['https://example.org/services#ServiceBoundary'] });
  assert.deepEqual(results.map((r) => r.ref), ['https://example.com/moca/service-catalogue@2.0.0#service-boundaries.md']);
});

async function connectTo(packages, options = {}) {
  const library = await loadLibrary({ packages: packages.map((p) => join(repo, p)), ...options });
  const server = createServer(library, options);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
  return { client, call };
}

test('search returns compact records by default: reference, text, status and evidence matched', async () => {
  const { call } = await connect();
  const { results } = await call('moca_search', { query: 'refund window' });
  const r = results.find((x) => x.ref.endsWith('#refund-window.md'));
  assert.equal(r.evidenceMatched, true);
  assert.equal(r.signed, true);
  assert.deepEqual(Object.keys(r).sort(), ['evidenceMatched', 'inForce', 'ref', 'score', 'signed', 'stale', 'status', 'superseded', 'text', 'title']);
});

test('moca_structure answers structure questions, with layers from overlays', async () => {
  const IR = 'https://example.org/handbook/incident#';
  const overlay = join(repo, 'conformance/fixtures/overlays/organisation-review.ttl');
  const { call } = await connectTo(['examples/handbook/incident-response'], { overlays: [{ id: 'org', layer: 'organisation', path: overlay }] });
  const seq = await call('moca_structure', { op: 'sequence', iri: `${IR}ResponseSteps` });
  assert.deepEqual(seq.result.map((x) => x.label), ['Assess severity', 'Declare the incident', 'Notify customers', 'Resolve and review']);
  const req = await call('moca_structure', { op: 'requires', iri: `${IR}ResolveAndReview`, transitive: true });
  assert.deepEqual(req.result.map((x) => [x.iri.split('#')[1], x.layer]), [['AssessSeverity', 'package'], ['DeclareIncident', 'organisation']]);
  const nodes = await call('moca_structure', { op: 'nodes', iri: `${IR}IncidentResponse`, include: 'parts' });
  assert.equal(nodes.result.length, 5);
  const scoped = await call('moca_search', { query: 'customers', scope: `${IR}NotifyCustomers` });
  assert.deepEqual(scoped.results.map((r) => r.ref.split('#')[1]), ['steps/notify-customers.md']);
});

test('nodes are MCP resources, listed and read by their versioned reference', async () => {
  const { client } = await connectTo(['examples/service-catalogue']);
  const { resources } = await client.listResources();
  const uris = resources.map((r) => r.uri);
  assert.ok(uris.includes(`moca://node/${encodeURIComponent('https://example.com/moca/service-catalogue@2.0.0#order-service.md')}`));
  const read = await client.readResource({ uri: uris.find((u) => u.includes('order-service')) });
  assert.equal(read.contents[0].mimeType, 'text/markdown');
  assert.match(read.contents[0].text, /# Order service/);
});
