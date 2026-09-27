#!/usr/bin/env node
// tools/moca-core ships copies of schemas/v1/*.schema.json so the published
// package works on its own. The copies must stay byte-identical.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repo, 'schemas/v1');
const vendored = join(repo, 'tools/moca-core/lib/schemas');
const names = new Set([...readdirSync(source), ...readdirSync(vendored)].filter((n) => n.endsWith('.schema.json')));
let failed = 0;
for (const name of [...names].sort()) {
  let a;
  let b;
  try {
    a = readFileSync(join(source, name));
    b = readFileSync(join(vendored, name));
  } catch {
    console.error(`FAIL ${name} exists in only one place`);
    failed++;
    continue;
  }
  if (!a.equals(b)) {
    console.error(`FAIL tools/moca-core/lib/schemas/${name} differs from schemas/v1/${name}`);
    failed++;
  }
}
if (failed > 0) {
  console.error('Copy schemas/v1/*.schema.json into tools/moca-core/lib/schemas/.');
  process.exitCode = 1;
} else {
  console.log(`${names.size} vendored schema(s) in sync.`);
}
