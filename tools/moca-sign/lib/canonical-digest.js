// The canonical package digest defined by core §5.5.
//
// This lives in moca-sign because a signature signs over canonicalDigest.value
// (trust model §2), so signing cannot exist without it. Every other consumer
// -- moca-lint's security pass, moca-index's target binding, and the
// repository's own validation scripts -- imports it from here, so there is
// exactly one implementation of a value that must agree across tools and
// across languages.
//
// It deliberately has no dependency on moca-lint: moca-lint depends on
// moca-sign for verification, and the reverse would be a cycle. The small
// file walker below is duplicated rather than shared for that reason.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import canonicalize from 'canonicalize';

const PACKAGE_MANIFEST = 'moca.json';
const HEX_DIGEST = /^[a-f0-9]{64}$/;

function walkFiles(dir, rootDir = dir) {
  let entries;
  try {
    if (!statSync(dir).isDirectory()) return [];
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(full, rootDir));
    else if (entry.isFile()) results.push(relative(rootDir, full).split('\\').join('/'));
  }
  return results;
}

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

/**
 * Computes the canonical package digest from on-disk resource bytes.
 *
 * Declared `integrity` values are never trusted as input -- the digest is
 * derived from what is actually on disk. The manifest participates with
 * `canonicalDigest` and `signature` removed: a signature signs over
 * canonicalDigest.value, so the digest cannot depend on the signature
 * computed from it.
 *
 * @param {string} rootDir
 * @param {{ resolveMember?: (member: { id: string, version?: string }) => { version: string, canonicalDigest: { value: string } } }} [options]
 * @returns {string} lowercase hex SHA-256
 */
export function computeCanonicalDigest(rootDir, { resolveMember } = {}) {
  const packageRoot = resolve(rootDir);
  const manifestPath = join(packageRoot, PACKAGE_MANIFEST);
  if (!existsSync(manifestPath)) {
    throw new Error(`missing ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const manifestForDigest = { ...manifest };
  delete manifestForDigest.canonicalDigest;
  delete manifestForDigest.signature;

  const resources = {};
  for (const relPath of walkFiles(packageRoot)) {
    if (isExcluded(relPath)) continue;
    resources[relPath] = sha256(readFileSync(join(packageRoot, relPath)));
  }
  // Composition-only packages legitimately have no resources.

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
      const resolved = resolveMember({ id: member.id, version: member.version });
      if (!resolved?.version || !resolved.canonicalDigest?.value) {
        throw new Error(`${packageRoot}: member ${member.id}@${member.version ?? '*'} has no resolved canonicalDigest`);
      }
      if (!HEX_DIGEST.test(resolved.canonicalDigest.value)) {
        throw new Error(`${packageRoot}: member ${member.id}@${resolved.version} has an invalid canonicalDigest.value`);
      }
      assembled.members[`${member.id}@${resolved.version}`] = resolved.canonicalDigest.value;
    }
  }

  return canonicalSha256(assembled);
}
