#!/usr/bin/env node
// Checks the Sigstore smoke-test package against the public Sigstore instance (attestations §6).
//
// The corpus's sigstore-* cases use a self-made test Sigstore and run offline. This checks one real bundle,
// signed keyless by the openmoca/moca-spec workflow (.github/workflows/sigstore-smoke.yml), against the
// public-good trust material. It is not part of `npm run validate`: it may need the network to refresh that
// trust material, and real certificates and trust roots change over time.
//
//   node scripts/sigstore-smoke.mjs            offline, with the trust material sigstore-js already has
//   node scripts/sigstore-smoke.mjs --online   refresh the trust material first
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackage } from '@openmoca/moca-core';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sigstore-smoke');
const bundle = join(dir, 'package', 'attestations', 'package.sigstore.json');
if (!existsSync(bundle)) {
  console.log('No smoke-test bundle yet: run the sigstore-smoke workflow in openmoca/moca-spec and commit its output.');
  process.exit(0);
}
const result = await readPackage(join(dir, 'package'), { trustRoot: join(dir, 'trust-root.json'), online: process.argv.includes('--online') });
const problems = result.diagnostics.filter((d) => d.code.startsWith('A'));
if (!result.capabilities.includes('signed') || problems.length > 0) {
  for (const d of problems) console.error(`${d.code}: ${d.message}`);
  console.error('The Sigstore smoke-test package is not signed.');
  process.exit(1);
}
console.log(`Sigstore smoke test: signed by ${result.signers.join(', ')}.`);
