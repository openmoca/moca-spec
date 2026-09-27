import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackage, Library, validateAgainst, PROFILE_ONTOLOGY, KNOWN_PROFILES } from '../lib/index.js';

const repo = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');
const TTL = '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n@prefix x: <https://example.org/x#> .\nx:A a skos:Concept .\n';
const codes = (r) => r.diagnostics.map((d) => d.code);

function makePackage({ ttl = TTL, files = [{ path: 'ontologies/x.ttl', role: 'domain' }], concepts = ['https://example.org/x#A'], entryConcepts } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'moca-ontology-'));
  const data = { files, ...(entryConcepts ? { entryConcepts } : {}) };
  writeFileSync(join(dir, 'moca.json'), JSON.stringify({ id: 'https://example.com/o', version: '1.0.0', title: 'O', profiles: { [PROFILE_ONTOLOGY]: data } }));
  mkdirSync(join(dir, 'ontologies'));
  mkdirSync(join(dir, 'content'));
  if (ttl !== null) writeFileSync(join(dir, 'ontologies/x.ttl'), ttl);
  const bindings = concepts.map((iri) => `        - iri: ${JSON.stringify(iri)}`).join('\n');
  writeFileSync(join(dir, 'content/a.md'), `---\ntype: Note\ntitle: A\nmoca:\n  profiles:\n    ${PROFILE_ONTOLOGY}:\n      concepts:\n${bindings}\n---\n\n# A\n`);
  return dir;
}

test('the example package has the ontology capability and concepts in its citation records', async () => {
  const pkg = await readPackage(join(repo, 'profiles/ontology/examples/service-catalogue'));
  assert.deepEqual(codes(pkg), []);
  assert.deepEqual(pkg.capabilities, ['core', 'ontology']);
  const records = new Library().add(pkg).citations();
  assert.ok(records.every((r) => r.concepts.length === 2));
  for (const r of records) assert.deepEqual(validateAgainst('citationRecord', r), []);
});

test('ontology problems are warnings that withhold only the ontology capability', async () => {
  const cases = [
    [{ ttl: 'this is not turtle' }, 'O001_ONTOLOGY_UNPARSEABLE'],
    [{ ttl: null }, 'O001_ONTOLOGY_UNPARSEABLE'],
    [{ concepts: ['https://example.org/x#B'] }, 'O002_CONCEPT_UNDECLARED'],
    [{ entryConcepts: ['https://example.org/x#Z'] }, 'O002_CONCEPT_UNDECLARED'],
    [{ ttl: `${TTL}<https://example.org/x> <http://www.w3.org/2002/07/owl#imports> <https://example.org/other> .\n` }, 'O003_REMOTE_REFERENCE'],
    [{ ttl: `${TTL}<relative> a <https://example.org/x#Thing> .\n` }, 'O003_REMOTE_REFERENCE'],
    [{ concepts: ['x:A'] }, 'O003_REMOTE_REFERENCE'],
  ];
  for (const [options, code] of cases) {
    const pkg = await readPackage(makePackage(options));
    assert.ok(codes(pkg).includes(code), `${JSON.stringify(options)} -> ${codes(pkg)}`);
    assert.equal(pkg.valid, true);
    assert.deepEqual(pkg.capabilities, ['core']);
  }
});

test('concepts declared only in a shapes file do not count', async () => {
  const pkg = await readPackage(makePackage({ files: [{ path: 'ontologies/x.ttl', role: 'shapes' }] }));
  assert.deepEqual(codes(pkg), ['O002_CONCEPT_UNDECLARED']);
});

test('a Reader that does not implement the profile reads the package as core', async () => {
  const pkg = await readPackage(makePackage({ ttl: 'not turtle' }), { knownProfiles: KNOWN_PROFILES.filter((p) => p !== PROFILE_ONTOLOGY) });
  assert.deepEqual(codes(pkg), ['F001_PROFILE_UNRECOGNISED']);
  assert.deepEqual(pkg.capabilities, ['core']);
  assert.equal(new Library().add(pkg).citations()[0].concepts, undefined);
});
