import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import canonicalize from 'canonicalize';
import { walkFiles } from '../tools/moca-lint/lib/walk.js';

const HEX_DIGEST = /^[a-f0-9]{64}$/;
const PACKAGE_MANIFEST = 'moca.json';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalSha256(value) {
  const serialized = canonicalize(value);
  if (serialized === undefined) {
    throw new Error('value cannot be canonicalized');
  }
  return sha256(Buffer.from(serialized, 'utf8'));
}

function isExcluded(relPath) {
  return relPath === PACKAGE_MANIFEST
    || relPath === '.DS_Store'
    || relPath.endsWith('/.DS_Store')
    || relPath === '.git'
    || relPath.startsWith('.git/')
    || relPath === 'node_modules'
    || relPath.startsWith('node_modules/');
}

function readManifest(rootDir) {
  const manifestPath = join(rootDir, PACKAGE_MANIFEST);
  if (!existsSync(manifestPath)) {
    throw new Error(`missing ${manifestPath}`);
  }
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function validateDeclaredDigest(manifest, rootDir) {
  const digest = manifest.canonicalDigest;
  if (digest === undefined) return;
  if (!digest || typeof digest !== 'object' || Array.isArray(digest)) {
    throw new Error(`${rootDir}: canonicalDigest must be an object`);
  }
  if (typeof digest.algorithm !== 'string' || typeof digest.value !== 'string') {
    throw new Error(`${rootDir}: canonicalDigest requires string algorithm and value`);
  }
  const unexpectedKeys = Object.keys(digest).filter((key) => !['algorithm', 'value'].includes(key));
  if (unexpectedKeys.length) {
    throw new Error(`${rootDir}: canonicalDigest has unexpected properties: ${unexpectedKeys.join(', ')}`);
  }
  if (!HEX_DIGEST.test(digest.value)) {
    throw new Error(`${rootDir}: canonicalDigest.value must be 64 lowercase hexadecimal characters`);
  }
}

/**
 * Compute the canonical package digest from on-disk resource bytes.
 *
 * @param {string} rootDir
 * @param {{ resolveMember?: (member: { id: string, version?: string }) => { version: string, canonicalDigest: { value: string } } }} options
 * @returns {string}
 */
export function computeCanonicalDigest(rootDir, { resolveMember } = {}) {
  const packageRoot = resolve(rootDir);
  const manifest = readManifest(packageRoot);
  const manifestForDigest = { ...manifest };
  delete manifestForDigest.canonicalDigest;
  // `signature` is excluded for the same self-reference reason as
  // `canonicalDigest`: a Level 3 signature signs over canonicalDigest.value
  // (spec/moca-trust-model.md §2), so canonicalDigest cannot itself depend on the
  // signature that will be computed from it.
  delete manifestForDigest.signature;

  const resources = {};
  for (const relPath of walkFiles(packageRoot)) {
    if (isExcluded(relPath)) continue;
    resources[relPath] = sha256(readFileSync(join(packageRoot, relPath)));
  }
  // Composition-only packages, such as the course fixture, legitimately have no resources.

  const assembled = {
    manifest: canonicalSha256(manifestForDigest),
    resources,
  };

  const members = manifest.composition?.members;
  if (members?.length) {
    if (typeof resolveMember !== 'function') {
      throw new Error(`${packageRoot}: composition.members requires a member resolver`);
    }
    assembled.members = {};
    for (const member of members) {
      const resolvedMember = resolveMember({ id: member.id, version: member.version });
      if (!resolvedMember?.version || !resolvedMember.canonicalDigest?.value) {
        throw new Error(`${packageRoot}: member ${member.id}@${member.version ?? '*'} has no resolved canonicalDigest`);
      }
      if (!HEX_DIGEST.test(resolvedMember.canonicalDigest.value)) {
        throw new Error(`${packageRoot}: member ${member.id}@${resolvedMember.version} has an invalid canonicalDigest.value`);
      }
      assembled.members[`${member.id}@${resolvedMember.version}`] = resolvedMember.canonicalDigest.value;
    }
  }

  return canonicalSha256(assembled);
}

function versionMatches(range, version) {
  if (!range || range === version) return true;
  if (range.startsWith('^')) {
    const requested = range.slice(1).split('.')[0];
    return version.split('.')[0] === requested;
  }
  return false;
}

function siblingMemberResolver(packageRoot) {
  const parentDir = dirname(packageRoot);
  return ({ id, version }) => {
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const siblingRoot = join(parentDir, entry.name);
      const manifestPath = join(siblingRoot, PACKAGE_MANIFEST);
      if (!existsSync(manifestPath)) continue;
      const siblingManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (siblingManifest.id === id && versionMatches(version, siblingManifest.version)) {
        return siblingManifest;
      }
    }
    throw new Error(`could not resolve member ${id}@${version ?? '*'}`);
  };
}

function findPackageRoots(rootDir) {
  return walkFiles(rootDir)
    .filter((relPath) => relPath.endsWith(`/${PACKAGE_MANIFEST}`) || relPath === PACKAGE_MANIFEST)
    .map((relPath) => dirname(join(rootDir, relPath)))
    .map((packageRoot) => resolve(packageRoot));
}

function reportFailure(message) {
  console.error(`[FAIL] ${message}`);
}

function reportSuccess(message) {
  console.log(`[OK]   ${message}`);
}

function validateExamples(rootDir) {
  const searchRoots = [join(rootDir, 'examples'), join(rootDir, 'profiles')];
  const packageRoots = searchRoots.flatMap((searchRoot) => (
    existsSync(searchRoot) ? findPackageRoots(searchRoot) : []
  ));
  let failed = false;

  for (const packageRoot of packageRoots) {
    let manifest;
    try {
      manifest = readManifest(packageRoot);
      validateDeclaredDigest(manifest, packageRoot);
    } catch (error) {
      reportFailure(error.message);
      failed = true;
      continue;
    }
    if (!manifest.canonicalDigest) continue;

    try {
      const actual = computeCanonicalDigest(packageRoot, {
        resolveMember: siblingMemberResolver(packageRoot),
      });
      if (actual !== manifest.canonicalDigest.value) {
        reportFailure(`${packageRoot}: canonicalDigest mismatch (declared ${manifest.canonicalDigest.value}, computed ${actual})`);
        failed = true;
      } else {
        reportSuccess(`${packageRoot}: canonicalDigest matches`);
      }
    } catch (error) {
      reportFailure(`${packageRoot}: ${error.message}`);
      failed = true;
    }
  }

  return failed;
}

// Only run the CLI behavior when this file is executed directly (e.g.
// `node scripts/validate-canonical-digest.mjs`) -- not when
// computeCanonicalDigest() is imported as a library function elsewhere
// (tools/moca-lint's and tools/moca-index's own tests and tooling do this),
// which must not have the side effect of scanning examples/profiles,
// printing to the console, or calling process.exit().
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  const printIndex = process.argv.indexOf('--print');
  if (printIndex !== -1) {
    const packageRoot = resolve(process.argv[printIndex + 1] ?? '');
    console.log(computeCanonicalDigest(packageRoot, {
      resolveMember: siblingMemberResolver(packageRoot),
    }));
  } else if (validateExamples(root)) {
    console.error('\nCanonical digest validation failed.');
    process.exit(1);
  } else {
    console.log('\nCanonical digest validation succeeded.');
  }
}
