#!/usr/bin/env node
// Every example package must read cleanly: valid, no warnings, and the
// capabilities its README promises. Profile examples are also checked
// against their profile's schema, and the AG-UI citations example against
// its schema and the Reader's own record for each node it cites.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readPackage, bindSidecar, directoryResolver, formatText, Library } from '@openmoca/moca-core';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const trustRoot = join(repo, 'fixtures/signing-keys/trust-root.json');

const EXAMPLES = [
  { dir: 'examples/minimal', capabilities: ['core'] },
  { dir: 'examples/acme-support', capabilities: ['core', 'localized', 'located-evidence', 'reviewed', 'self-contained-evidence', 'signed', 'structured'] },
  { dir: 'examples/support-kb', capabilities: ['core', 'located-evidence', 'localized', 'reviewed', 'self-contained-evidence', 'signed'], sidecar: 'examples/sidecars/support-kb.moca.idx' },
  { dir: 'examples/policy-corpus/retention-2025', capabilities: ['core'] },
  { dir: 'examples/policy-corpus/retention-2026', capabilities: ['core', 'signed'] },
  { dir: 'examples/handbook/service-ownership', capabilities: ['core'] },
  { dir: 'examples/handbook/incident-response', capabilities: ['core', 'structured'] },
  { dir: 'examples/handbook/handbook', capabilities: ['core', 'composed'], members: ['examples/handbook'] },
  { dir: 'examples/service-catalogue', capabilities: ['core', 'structured'] },
  { dir: 'examples/youtube/video', capabilities: ['core', 'located-evidence', 'self-contained-evidence'] },
  { dir: 'examples/youtube/playlist', capabilities: ['core', 'located-evidence', 'self-contained-evidence', 'structured'] },
  { dir: 'examples/pdf/airplane-flying-handbook', capabilities: ['core', 'located-evidence', 'structured'] },
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

// Citations over AG-UI (spec/moca-ag-ui-citations.md). The example's records
// must be what the Reader gives for support-kb today, read with a fixed clock,
// so the example never drifts from the package. After re-signing support-kb,
// run with --write-ag-ui to regenerate it.
{
  const file = join(repo, 'examples/ag-ui/citations-event.json');
  const kb = await readPackage(join(repo, 'examples/support-kb'), { trustRoot });
  const library = new Library({ clock: () => new Date('2026-09-01T00:00:00Z') });
  library.add(kb);
  const event = JSON.parse(readFileSync(file, 'utf8'));
  if (process.argv.includes('--write-ag-ui')) {
    for (const citation of event.value.citations) citation.record = library.get(citation.record.node.ref);
    writeFileSync(file, `${JSON.stringify(event, null, 2)}\n`);
  }
  for (const name of ['citation-record', 'ag-ui-citations']) {
    if (!ajv.getSchema(`https://w3id.org/moca/schemas/v1/${name}.schema.json`)) {
      ajv.addSchema(JSON.parse(readFileSync(join(repo, `schemas/v1/${name}.schema.json`), 'utf8')));
    }
  }
  const validate = ajv.getSchema('https://w3id.org/moca/schemas/v1/ag-ui-citations.schema.json');
  const messages = [];
  if (!validate(event)) messages.push(ajv.errorsText(validate.errors));
  for (const { record } of event.value.citations ?? []) {
    const fresh = library.get(record.node.ref);
    if (!fresh) messages.push(`${record.node.ref}: no such node in support-kb`);
    else if (JSON.stringify(fresh) !== JSON.stringify(record)) messages.push(`${record.node.ref}: differs from the Reader's record; run with --write-ag-ui`);
  }
  if (messages.length > 0) {
    failed++;
    process.exitCode = 1;
    console.error(`FAIL examples/ag-ui/citations-event.json\n  ${messages.join('\n  ')}`);
  } else {
    console.log('ok   examples/ag-ui/citations-event.json');
  }
}
