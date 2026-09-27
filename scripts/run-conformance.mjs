#!/usr/bin/env node
// Runs conformance/cases.json against the reference Reader in
// @openmoca/moca-core. Another implementation passes the corpus when it
// reaches the same conclusions: see conformance/README.md.
//
//   node scripts/run-conformance.mjs            check every case
//   node scripts/run-conformance.mjs --actual   print what the reference Reader
//                                               concludes, to help review a new case
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackage, bindSidecar, directoryResolver } from '@openmoca/moca-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'conformance');
const corpus = JSON.parse(readFileSync(join(root, 'cases.json'), 'utf8'));
const showActual = process.argv.includes('--actual');
const byId = new Map(corpus.cases.map((c) => [c.id, c]));

const uniqueSorted = (xs) => [...new Set(xs)].sort();
const same = (a, b) => JSON.stringify(uniqueSorted(a)) === JSON.stringify(uniqueSorted(b));

let failures = 0;
for (const c of corpus.cases) {
  const o = c.options ?? {};
  const result = await readPackage(join(root, c.target), {
    trustRoot: o.trustRoot ? join(root, o.trustRoot) : undefined,
    resolveMember: o.members ? directoryResolver(o.members.map((m) => join(root, m))) : undefined,
  });
  const codes = result.diagnostics.map((d) => d.code);
  let sidecarUsable;
  if (o.sidecar) {
    const bound = bindSidecar(join(root, o.sidecar), result);
    codes.push(...bound.diagnostics.map((d) => d.code));
    sidecarUsable = bound.usable;
  }
  const actual = { valid: result.valid, codes: uniqueSorted(codes), capabilities: uniqueSorted(result.capabilities), digest: result.digest, sidecarUsable };
  if (showActual) {
    console.log(`${c.id}: ${JSON.stringify(actual)}`);
    continue;
  }

  const e = c.expect;
  const problems = [];
  if (e.valid !== actual.valid) problems.push(`valid: expected ${e.valid}, got ${actual.valid}`);
  if (!same(e.codes, actual.codes)) problems.push(`codes: expected [${uniqueSorted(e.codes)}], got [${actual.codes}]`);
  if (!same(e.capabilities, actual.capabilities)) problems.push(`capabilities: expected [${uniqueSorted(e.capabilities)}], got [${actual.capabilities}]`);
  if (e.digest) {
    const want = e.digest.startsWith('SAME:') ? byId.get(e.digest.slice(5))?.expect.digest : e.digest;
    if (want !== actual.digest) problems.push(`digest: expected ${want}, got ${actual.digest}`);
  }
  if (e.sidecarUsable !== undefined && e.sidecarUsable !== actual.sidecarUsable) {
    problems.push(`sidecarUsable: expected ${e.sidecarUsable}, got ${actual.sidecarUsable}`);
  }
  if (problems.length > 0) {
    failures++;
    console.error(`FAIL ${c.id}\n  ${problems.join('\n  ')}`);
  }
}

if (!showActual) {
  if (failures > 0) {
    console.error(`\n${failures} of ${corpus.cases.length} case(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${corpus.cases.length} conformance case(s) pass.`);
  }
}
