import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { resolvePackagePath } from '../tools/moca-lint/lib/paths.js';

const root = process.cwd();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemaPath = join(root, 'schemas/v1/core/sidecar-index.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

let failed = false;

function ok(message) {
  console.log(`[OK]   ${message}`);
}

function fail(message) {
  console.error(`[FAIL] ${message}`);
  failed = true;
}

function reportSchemaErrors(label) {
  fail(`${label}:`);
  for (const error of validate.errors ?? []) {
    console.error(`  ${error.instancePath || '/'} ${error.message}`);
  }
}

function findSidecarDirs() {
  const indicesDir = join(root, 'examples/sidecars');
  if (!existsSync(indicesDir)) return [];
  return readdirSync(indicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.moca.idx'))
    .map((entry) => join(indicesDir, entry.name));
}

function findPackageRootById(targetId) {
  const searchRoots = [join(root, 'examples'), join(root, 'profiles')];
  const stack = searchRoots.filter(existsSync);
  while (stack.length) {
    const dir = stack.pop();
    const manifestPath = join(dir, 'moca.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.id === targetId) return dir;
      continue;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(join(dir, entry.name));
    }
  }
  return null;
}

function computeTargetDigest(targetRoot) {
  return execFileSync(
    process.execPath,
    ['scripts/validate-canonical-digest.mjs', '--print', targetRoot],
    { cwd: root, encoding: 'utf8' }
  ).trim();
}

function validateSchemaShapes(fixture, label) {
  if (!validate(fixture)) {
    reportSchemaErrors(`${label}: reference sidecar manifest does not conform to the schema`);
  } else {
    ok(`${label}: sidecar manifest conforms to sidecar schema`);
  }

  const withoutHash = { ...fixture };
  delete withoutHash.target_package_hash;
  if (!validate(withoutHash)) {
    reportSchemaErrors(`${label}: sidecar manifest without optional target_package_hash is invalid`);
  } else {
    ok(`${label}: target_package_hash is optional`);
  }

  const invalidHash = { ...fixture, target_package_hash: 'sha256:not-a-digest' };
  if (validate(invalidHash)) {
    fail(`${label}: malformed target_package_hash was accepted`);
  } else {
    ok(`${label}: malformed target_package_hash is rejected`);
  }
}

function validatePayload(manifest, sidecarDir, targetRoot, label) {
  const payloadPath = join(sidecarDir, manifest.storage.file);
  if (!existsSync(payloadPath)) {
    fail(`${label}: storage.file ${manifest.storage.file} does not exist`);
    return;
  }
  ok(`${label}: payload file exists`);

  if (manifest.storage.format !== 'jsonl') {
    ok(`${label}: skipping payload content checks for opaque format ${manifest.storage.format}`);
    return;
  }

  const lines = readFileSync(payloadPath, 'utf8').split('\n').filter((line) => line.trim().length > 0);
  let itemsValid = true;
  for (const [lineIndex, line] of lines.entries()) {
    let item;
    try {
      item = JSON.parse(line);
    } catch {
      fail(`${label}: payload line ${lineIndex} is not valid JSON`);
      itemsValid = false;
      continue;
    }

    const { content_path: contentPath, chunk_index: chunkIndex, chunk_count: chunkCount } = item;
    if (!(Number.isInteger(chunkIndex) && Number.isInteger(chunkCount) && chunkIndex >= 0 && chunkIndex < chunkCount)) {
      fail(`${label}: payload line ${lineIndex} violates 0 <= chunk_index < chunk_count (chunk_index=${chunkIndex}, chunk_count=${chunkCount})`);
      itemsValid = false;
      continue;
    }

    const resolved = resolvePackagePath(targetRoot, join('content', contentPath ?? ''), ['content']);
    if (!resolved || !existsSync(resolved)) {
      fail(`${label}: payload line ${lineIndex} content_path "${contentPath}" does not resolve to a file under the target's content/ directory`);
      itemsValid = false;
    }
  }

  if (itemsValid) {
    ok(`${label}: all ${lines.length} payload item(s) satisfy the addressing invariant and resolve within content/`);
  }
}

function validateTargetBinding(manifest, label) {
  const targetRoot = findPackageRootById(manifest.target_package_id);
  if (!targetRoot) {
    fail(`${label}: target_package_id ${manifest.target_package_id} does not resolve to any package under examples/ or profiles/`);
    return null;
  }
  ok(`${label}: target package resolves on disk (${targetRoot})`);

  if (manifest.target_package_hash) {
    const declared = manifest.target_package_hash.replace(/^sha256:/, '');
    let actual;
    try {
      actual = computeTargetDigest(targetRoot);
    } catch (error) {
      fail(`${label}: could not compute target canonicalDigest: ${error.message}`);
      return targetRoot;
    }
    if (declared !== actual) {
      fail(`${label}: target_package_hash mismatch (declared ${declared}, computed ${actual})`);
    } else {
      ok(`${label}: target_package_hash matches target's canonicalDigest`);
    }
  }

  return targetRoot;
}

const sidecarDirs = findSidecarDirs();
if (sidecarDirs.length === 0) {
  fail('no sidecar fixtures found under examples/sidecars/*.moca.idx');
}

for (const sidecarDir of sidecarDirs) {
  const label = sidecarDir.split('/').pop();
  const manifestPath = join(sidecarDir, 'index.json');
  const fixture = JSON.parse(readFileSync(manifestPath, 'utf8'));

  validateSchemaShapes(fixture, label);

  const targetRoot = validateTargetBinding(fixture, label);
  if (targetRoot) {
    validatePayload(fixture, sidecarDir, targetRoot, label);
  }
}

if (failed) {
  console.error('\nSidecar index validation failed.');
  process.exit(1);
}

console.log('\nSidecar index validation succeeded.');
