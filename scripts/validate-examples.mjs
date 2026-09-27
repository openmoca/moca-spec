#!/usr/bin/env node
// Every example package must read cleanly: valid, no warnings, and the
// capabilities its README promises. Profile examples are also checked
// against their profile's schema.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readPackage, bindSidecar, directoryResolver, formatText } from '@openmoca/moca-core';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const trustRoot = join(repo, 'fixtures/signing-keys/trust-root.json');

const EXAMPLES = [
  { dir: 'examples/minimal', capabilities: ['core'] },
  { dir: 'examples/support-kb', capabilities: ['core', 'located-evidence', 'localized', 'reviewed', 'self-contained-evidence', 'signed'], sidecar: 'examples/sidecars/support-kb.moca.idx' },
  { dir: 'examples/policy-corpus/retention-2025', capabilities: ['core'] },
  { dir: 'examples/policy-corpus/retention-2026', capabilities: ['core'] },
  { dir: 'examples/handbook/service-ownership', capabilities: ['core'] },
  { dir: 'examples/handbook/incident-response', capabilities: ['core', 'structured'] },
  { dir: 'examples/handbook/handbook', capabilities: ['core', 'composed'], members: ['examples/handbook'] },
  { dir: 'examples/service-catalogue', capabilities: ['core', 'structured'] },
];

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

let failed = 0;
for (const ex of EXAMPLES) {
  const result = await readPackage(join(repo, ex.dir), {
    trustRoot,
    resolveMember: ex.members ? directoryResolver(ex.members.map((m) => join(repo, m))) : undefined,
  });
  const problems = result.diagnostics.filter((d) => d.severity !== 'info');
  const caps = [...result.capabilities].sort().join(',');
  const want = [...ex.capabilities].sort().join(',');
  const messages = [];
  if (!result.valid) messages.push('not valid');
  if (problems.length > 0) messages.push(formatText(problems));
  if (caps !== want) messages.push(`capabilities: expected ${want}, got ${caps}`);
  if (ex.sidecar) {
    const bound = bindSidecar(join(repo, ex.sidecar), result);
    if (!bound.usable) messages.push(`sidecar not usable: ${formatText(bound.diagnostics)}`);
  }
  if (ex.profile) {
    const validate = ajv.compile(JSON.parse(readFileSync(join(repo, ex.profile.schema), 'utf8')));
    if (!validate(result.manifest.profiles?.[ex.profile.uri])) messages.push(`profile data: ${ajv.errorsText(validate.errors)}`);
  }
  if (messages.length > 0) {
    failed++;
    console.error(`FAIL ${ex.dir}\n  ${messages.join('\n  ')}`);
  } else {
    console.log(`ok   ${ex.dir}  ${result.digest}  [${caps}]`);
  }
}
if (failed > 0) process.exitCode = 1;
