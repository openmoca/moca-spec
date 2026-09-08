// Proves schemas/v1/core/context.jsonld's scoped @context terms actually expand
// to distinct predicates via a real JSON-LD processor (jsonld.js), not just
// JSON.parse. See core §10.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import jsonld from 'jsonld';

const root = process.cwd();
const context = JSON.parse(
  readFileSync(join(root, 'schemas/v1/core/context.jsonld'), 'utf8')
);

let failed = false;

function fail(message) {
  failed = true;
  console.error(`[FAIL] ${message}`);
}

function ok(message) {
  console.log(`[OK]   ${message}`);
}

// 1. augmentation.relationship vs composition.relates[].relationship must
// expand to two distinct predicate IRIs, not collide on a shared term.
{
  const doc = {
    '@context': context['@context'],
    '@id': 'urn:moca:example:relationship-collision-check',
    augmentation: {
      target: './raw/external.zip',
      targetType: 'generic-archive',
      relationship: 'augments',
    },
    composition: {
      relates: [{ id: 'urn:moca:example:other-package', relationship: 'crossReferences' }],
    },
  };

  const expanded = await jsonld.expand(doc);
  const root_ = expanded[0];

  const augNode = root_['https://openmoca.org/vocab/core#augmentation']?.[0];
  const augRelationship =
    augNode?.['https://openmoca.org/vocab/core#augmentationRelationship']?.[0]?.['@value'];
  const augLeaked = augNode?.['https://openmoca.org/vocab/core#compositionRelationship'];

  if (augRelationship === 'augments' && !augLeaked) {
    ok('augmentation.relationship expands to moca:augmentationRelationship only');
  } else {
    fail(
      `augmentation.relationship expansion mismatch (got augmentationRelationship=${augRelationship}, compositionRelationship leaked=${!!augLeaked})`
    );
  }

  const compNode = root_['https://openmoca.org/vocab/core#composition']?.[0];
  const relatesNode = compNode?.['https://openmoca.org/vocab/core#compositionRelates']?.[0];
  const compRelationship =
    relatesNode?.['https://openmoca.org/vocab/core#compositionRelationship']?.[0]?.['@value'];
  const compLeaked = relatesNode?.['https://openmoca.org/vocab/core#augmentationRelationship'];

  if (compRelationship === 'crossReferences' && !compLeaked) {
    ok('composition.relates[].relationship expands to moca:compositionRelationship only');
  } else {
    fail(
      `composition.relates[].relationship expansion mismatch (got compositionRelationship=${compRelationship}, augmentationRelationship leaked=${!!compLeaked})`
    );
  }
}

// 2. claims[].provenance must expand to the correct prov: predicates.
{
  const doc = {
    '@context': context['@context'],
    '@id': 'urn:node:service-boundaries',
    claims: [
      {
        id: 'urn:claim:001',
        subject: 'urn:concept:ex:OrderService',
        predicate: 'urn:concept:ex:dependsOn',
        object: 'urn:concept:ex:OrderDatabase',
        provenance: {
          wasDerivedFrom: 'urn:source:architecture-spec',
          wasGeneratedBy: 'urn:activity:manual-extraction-2026-01',
          generatedAtTime: '2026-01-15T00:00:00Z',
          wasAttributedTo: 'urn:person:jsmith',
        },
      },
    ],
  };

  const expanded = await jsonld.expand(doc);
  const claimNode = expanded[0]['https://openmoca.org/vocab/core#claims']?.[0];
  const provNode = claimNode?.['https://openmoca.org/vocab/core#provenance']?.[0];

  const checks = [
    ['http://www.w3.org/ns/prov#wasDerivedFrom', 'urn:source:architecture-spec'],
    ['http://www.w3.org/ns/prov#wasGeneratedBy', 'urn:activity:manual-extraction-2026-01'],
    ['http://www.w3.org/ns/prov#generatedAtTime', '2026-01-15T00:00:00Z'],
    ['http://www.w3.org/ns/prov#wasAttributedTo', 'urn:person:jsmith'],
  ];

  for (const [predicate, expected] of checks) {
    const match = provNode?.[predicate]?.find((v) => (v['@value'] ?? v['@id']) === expected);
    if (match) {
      ok(`claims[].provenance.* expands ${predicate} -> ${expected}`);
    } else {
      fail(`claims[].provenance.* did not expand ${predicate} -> ${expected} as expected`);
    }
  }
}

if (failed) {
  console.error('\nJSON-LD context expansion validation failed.');
  process.exit(1);
} else {
  console.log('\nAll JSON-LD context expansion checks passed.');
}
