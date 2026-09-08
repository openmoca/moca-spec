// Re-derives every derived artifact in this repository's example corpus, in
// dependency order, after example content or manifest metadata changes.
//
// Three artifacts in a MOCA package are *derived* and go stale the moment any
// input byte changes:
//
//   1. `canonicalDigest`  -- covers resource bytes AND the manifest itself
//                            (core §5.5), so editing metadata as innocuous as
//                            `license` invalidates it.
//   2. `signature`        -- signs over `canonicalDigest.value` (trust model
//                            §2), so it is invalidated by anything that
//                            invalidates the digest. A manifest edit is
//                            therefore a re-signing event.
//   3. A sidecar's `target_package_hash` -- binds a `.moca.idx` to its target's
//                            canonical digest (sidecar index spec §4).
//
// They also cascade: a composed package folds its members' *declared* digests
// (core §5.5), so members must be refreshed before the package composing them.
// Doing this by hand is error-prone, which is why this script exists.
//
// Usage:
//   node scripts/refresh-derived.mjs            # rewrite anything stale
//   node scripts/refresh-derived.mjs --check    # report drift, write nothing
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { computeCanonicalDigest } from './validate-canonical-digest.mjs';
import { signPackage } from '../tools/moca-sign/lib/sign.js';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');

// The repository's own non-production example signing key. See its README --
// this key has no trust value and exists only so the example packages carry
// real, verifiable signatures.
const EXAMPLE_KEY = join(root, 'fixtures/signing-keys/INSECURE-example-signing-key.pem');
const EXAMPLE_KEYID = 'moca-spec-example-signing-key-2026';

const SEARCH_ROOTS = ['examples', 'profiles'];
const SIDECAR_ROOT = join(root, 'examples/sidecars');

let changed = 0;
let stale = 0;

function note(message) {
  console.log(`  ${message}`);
}

function findPackages(dir, found = []) {
  if (!existsSync(dir)) return found;
  if (existsSync(join(dir, 'moca.json'))) {
    found.push(dir);
    return found;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      findPackages(join(dir, entry.name), found);
    }
  }
  return found;
}

function readManifest(packageRoot) {
  return JSON.parse(readFileSync(join(packageRoot, 'moca.json'), 'utf8'));
}

// Replaces only canonicalDigest.value, leaving the rest of the file's
// hand-authored formatting (compact arrays, key order) untouched. Several
// example manifests are not JSON.stringify-canonical, so a parse/serialize
// round-trip would produce unrelated diff noise.
function writeDigestInPlace(packageRoot, newValue) {
  const manifestPath = join(packageRoot, 'moca.json');
  const raw = readFileSync(manifestPath, 'utf8');
  const pattern = /("canonicalDigest"\s*:\s*\{[^}]*?"value"\s*:\s*")([a-f0-9]{64})(")/;
  if (!pattern.test(raw)) {
    throw new Error(`${relative(root, manifestPath)}: could not locate canonicalDigest.value to rewrite`);
  }
  writeFileSync(manifestPath, raw.replace(pattern, `$1${newValue}$3`), 'utf8');
}

/** Orders packages so that composition members are refreshed before composers. */
function inDependencyOrder(packageRoots) {
  const byId = new Map();
  for (const packageRoot of packageRoots) {
    byId.set(readManifest(packageRoot).id, packageRoot);
  }

  const ordered = [];
  const state = new Map();

  function visit(packageRoot, trail) {
    const status = state.get(packageRoot);
    if (status === 'done') return;
    if (status === 'visiting') {
      throw new Error(`composition cycle: ${[...trail, packageRoot].map((p) => relative(root, p)).join(' -> ')}`);
    }
    state.set(packageRoot, 'visiting');
    for (const member of readManifest(packageRoot).composition?.members ?? []) {
      const memberRoot = byId.get(member.id);
      if (memberRoot) visit(memberRoot, [...trail, packageRoot]);
    }
    state.set(packageRoot, 'done');
    ordered.push(packageRoot);
  }

  for (const packageRoot of packageRoots) visit(packageRoot, []);
  return ordered;
}

// Digests computed during this run, keyed by package id. A composed package
// folds its members' declared digests, so in --check mode (which writes
// nothing) resolving a member from disk would return its *stale* declared
// value and hide the cascade -- the composer would be reported as current
// even though refreshing its members is about to invalidate it. Preferring
// the freshly computed value makes --check agree with what a real refresh
// would produce.
const freshDigests = new Map();

function memberResolver(packageRoot) {
  const parentDir = dirname(packageRoot);
  return ({ id, version }) => {
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = join(parentDir, entry.name, 'moca.json');
      if (!existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const majorMatches = !version
        || version === manifest.version
        || (version.startsWith('^') && version.slice(1).split('.')[0] === manifest.version.split('.')[0]);
      if (manifest.id !== id || !majorMatches) continue;
      const fresh = freshDigests.get(manifest.id);
      return fresh
        ? { ...manifest, canonicalDigest: { algorithm: 'sha256', value: fresh } }
        : manifest;
    }
    throw new Error(`could not resolve member ${id}@${version ?? '*'}`);
  };
}

async function refreshPackages() {
  const packageRoots = SEARCH_ROOTS.flatMap((searchRoot) => findPackages(join(root, searchRoot)));

  for (const packageRoot of inDependencyOrder(packageRoots)) {
    const manifest = readManifest(packageRoot);
    if (!manifest.canonicalDigest) continue;

    const label = relative(root, packageRoot);
    const signed = Boolean(manifest.signature);

    if (signed && manifest.composition?.members?.length) {
      throw new Error(`${label}: signing a composed package is not supported (see tools/moca-sign/README.md)`);
    }

    const actual = computeCanonicalDigest(packageRoot, { resolveMember: memberResolver(packageRoot) });
    freshDigests.set(manifest.id, actual);
    if (actual === manifest.canonicalDigest.value) continue;

    stale += 1;
    if (checkOnly) {
      note(`STALE  ${label} (declared ${manifest.canonicalDigest.value.slice(0, 12)}…, computed ${actual.slice(0, 12)}…)${signed ? ' + signature' : ''}`);
      continue;
    }

    if (signed) {
      await signPackage({
        rootDir: packageRoot,
        mode: 'dsse',
        privateKeyPath: EXAMPLE_KEY,
        keyid: EXAMPLE_KEYID,
      });
      note(`re-signed  ${label} -> ${actual.slice(0, 12)}…`);
    } else {
      writeDigestInPlace(packageRoot, actual);
      note(`digest     ${label} -> ${actual.slice(0, 12)}…`);
    }
    changed += 1;
  }
}

function refreshSidecars() {
  if (!existsSync(SIDECAR_ROOT)) return;

  const packageRoots = SEARCH_ROOTS.flatMap((searchRoot) => findPackages(join(root, searchRoot)));
  const byId = new Map(packageRoots.map((packageRoot) => [readManifest(packageRoot).id, packageRoot]));

  for (const entry of readdirSync(SIDECAR_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.endsWith('.moca.idx')) continue;

    const indexPath = join(SIDECAR_ROOT, entry.name, 'index.json');
    if (!existsSync(indexPath)) continue;

    const raw = readFileSync(indexPath, 'utf8');
    const index = JSON.parse(raw);
    if (!index.target_package_hash) continue;

    const targetRoot = byId.get(index.target_package_id);
    if (!targetRoot) {
      throw new Error(`${entry.name}: target_package_id ${index.target_package_id} resolves to no package`);
    }

    const targetDigest = readManifest(targetRoot).canonicalDigest?.value;
    if (!targetDigest) continue;

    const expected = `sha256:${targetDigest}`;
    if (index.target_package_hash === expected) continue;

    stale += 1;
    if (checkOnly) {
      note(`STALE  ${entry.name} target_package_hash`);
      continue;
    }

    writeFileSync(indexPath, raw.replace(index.target_package_hash, expected), 'utf8');
    note(`sidecar    ${entry.name} -> ${targetDigest.slice(0, 12)}…`);
    changed += 1;
  }
}

console.log(checkOnly ? 'Checking derived artifacts…' : 'Refreshing derived artifacts…');
await refreshPackages();
refreshSidecars();

if (checkOnly) {
  if (stale > 0) {
    console.error(`\n${stale} derived artifact(s) are stale. Run: npm run refresh:derived`);
    process.exit(1);
  }
  console.log('\nAll derived artifacts are current.');
} else if (changed === 0) {
  console.log('\nNothing to do — all derived artifacts were already current.');
} else {
  console.log(`\nRefreshed ${changed} derived artifact(s).`);
}
