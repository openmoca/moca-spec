// Asserts that schema files vendored into publishable packages stay identical
// to the canonical copies under schemas/.
//
// A published npm package contains only what its "files" field lists, so a
// tool cannot read ../../../schemas/ at runtime -- that works in the workspace
// and breaks for everyone who installs it. Vendoring is the fix; this check is
// what stops the copy silently drifting.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const VENDORED = [
  {
    canonical: 'schemas/v1/core/moca.schema.json',
    vendored: 'tools/moca-lint/lib/moca.schema.json',
  },
  {
    canonical: 'schemas/v1/core/sidecar-index.schema.json',
    vendored: 'tools/moca-index/lib/sidecar-index.schema.json',
  },
];

let failed = false;
for (const { canonical, vendored } of VENDORED) {
  const a = readFileSync(join(root, canonical), 'utf8');
  const b = readFileSync(join(root, vendored), 'utf8');
  if (a === b) {
    console.log(`[OK]   ${vendored} matches ${canonical}`);
  } else {
    console.error(`[FAIL] ${vendored} has drifted from ${canonical}`);
    console.error(`       fix: cp ${canonical} ${vendored}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nVendored schema check failed.');
  process.exit(1);
}
console.log('\nVendored schemas are in sync.');
