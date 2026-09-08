// Pass 4: Security, Integrity & Signatures (E400 series, Level 3) — core §8, §5.4.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { verifyPackageSignature } from 'moca-sign/lib/verify.js';
import { resolvePackagePath } from '../paths.js';

const SIGNATURE_FINDING_CODE = Object.freeze({
  malformed: 'E404_SIGNATURE_MALFORMED',
  invalid: 'E406_SIGNATURE_INVALID',
  indeterminate: 'E407_SIGNATURE_VERIFICATION_INDETERMINATE',
});

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {object} params.manifest
 * @param {import('../findings.js').FindingCollector} params.findings
 * @param {string} [params.trustRoot] - dsse-mode trust-roots.json or sigstore-mode pinned TUF cache dir
 * @param {{issuer: string, pattern: string}[]} [params.identityConstraints] - sigstore mode only
 * @param {boolean} [params.onlineVerify]
 * @param {boolean} [params.allowOfflineFallback]
 */
export async function runSecurityPass({
  rootDir,
  manifest,
  findings,
  trustRoot,
  identityConstraints,
  onlineVerify,
  allowOfflineFallback,
}) {
  const skillsDirExists = existsSync(join(rootDir, 'skills'));
  const hasSignature = manifest.signature && typeof manifest.signature === 'object';

  if (skillsDirExists && !hasSignature) {
    findings.add(
      'E401_UNSIGNED_SKILLS',
      'skills/ is present but moca.json has no signature object (core §3.1/§8.2).',
      { file: 'moca.json' }
    );
  }

  if (hasSignature) {
    const result = await verifyPackageSignature({
      rootDir,
      manifest,
      dsseTrustRootPath: trustRoot,
      sigstoreTrustRootPath: trustRoot,
      identityConstraints,
      onlineVerify,
      allowOfflineFallback,
    });
    if (result.outcome !== 'valid') {
      findings.add(SIGNATURE_FINDING_CODE[result.outcome], result.reason, { file: 'moca.json' });
    }
  }

  const integrity = manifest.integrity;
  checkRoCrateMetadataValidity({ rootDir, findings });
  if (!integrity || typeof integrity !== 'object') return;

  const digests = new Map();
  for (const [relPath, declaredHash] of Object.entries(integrity)) {
    const absPath = resolvePackagePath(rootDir, relPath);
    if (!absPath) {
      findings.add(
        'E211_UNSAFE_RESOURCE_PATH',
        `integrity entry "${relPath}" is not a safe package-relative path.`,
        { file: relPath }
      );
      continue;
    }
    if (!existsSync(absPath)) {
      findings.add(
        'E402_INTEGRITY_MISMATCH',
        `integrity declares "${relPath}" but the file does not exist.`,
        { file: relPath }
      );
      continue;
    }
    const actualHash = createHash('sha256').update(readFileSync(absPath)).digest('hex');
    digests.set(relPath, actualHash);
    if (normalizeHash(declaredHash) !== actualHash) {
      findings.add(
        'E402_INTEGRITY_MISMATCH',
        `SHA-256 of "${relPath}" does not match moca.json integrity.`,
        { file: relPath }
      );
    }
  }

  checkRoCrateBagitDiscrepancy({ rootDir, integrity, digests, findings });
}

function checkRoCrateMetadataValidity({ rootDir, findings }) {
  const roCratePath = join(rootDir, 'ro-crate-metadata.json');
  if (!existsSync(roCratePath)) return;

  // Minimal structural heuristic, not full RO-Crate 1.3 conformance (core §2.1:
  // tooling MUST NOT imply RO-Crate conformance unless the file is actually valid).
  let doc;
  try {
    doc = JSON.parse(readFileSync(roCratePath, 'utf8'));
  } catch (err) {
    findings.add('E405_ROCRATE_METADATA_INVALID', `ro-crate-metadata.json is not valid JSON: ${err.message}`, {
      file: 'ro-crate-metadata.json',
    });
    return;
  }

  const graph = doc['@graph'];
  if (!doc['@context'] || !Array.isArray(graph)) {
    findings.add(
      'E405_ROCRATE_METADATA_INVALID',
      'ro-crate-metadata.json must have a top-level "@context" and "@graph" array.',
      { file: 'ro-crate-metadata.json' }
    );
    return;
  }

  const descriptor = graph.find((n) => n['@id'] === 'ro-crate-metadata.json');
  const rootEntity = graph.find((n) => n['@id'] === './');
  if (!descriptor || !descriptor.conformsTo || !rootEntity) {
    findings.add(
      'E405_ROCRATE_METADATA_INVALID',
      'ro-crate-metadata.json must declare a metadata descriptor entity (@id "ro-crate-metadata.json" with "conformsTo") and a root data entity (@id "./").',
      { file: 'ro-crate-metadata.json' }
    );
  }
}

function normalizeHash(value) {
  return typeof value === 'string' ? value.replace(/^sha256[:-]/i, '').toLowerCase() : '';
}

function checkRoCrateBagitDiscrepancy({ rootDir, integrity, digests, findings }) {
  const external = new Map();

  const roCratePath = join(rootDir, 'ro-crate-metadata.json');
  if (existsSync(roCratePath)) {
    try {
      const doc = JSON.parse(readFileSync(roCratePath, 'utf8'));
      for (const node of doc['@graph'] ?? []) {
        if (node['@id'] && node.sha256) {
          external.set(node['@id'].replace(/^\.\//, ''), normalizeHash(node.sha256));
        }
      }
    } catch {
      // Malformed ro-crate-metadata.json is out of scope for this cross-check.
    }
  }

  const bagitPath = join(rootDir, 'manifest-sha256.txt');
  if (existsSync(bagitPath)) {
    const lines = readFileSync(bagitPath, 'utf8').split('\n');
    for (const line of lines) {
      const [hash, ...pathParts] = line.trim().split(/\s+/);
      if (!hash || pathParts.length === 0) continue;
      const path = pathParts.join(' ').replace(/^data\//, '');
      external.set(path, normalizeHash(hash));
    }
  }

  for (const [relPath, externalHash] of external) {
    const declaredHash = integrity[relPath] ? normalizeHash(integrity[relPath]) : digests.get(relPath);
    if (declaredHash && declaredHash !== externalHash) {
      findings.add(
        'E403_ROCRATE_BAGIT_DISCREPANCY',
        `ro-crate-metadata.json/BagIt hash for "${relPath}" conflicts with moca.json integrity (core §5.4, integrity is authoritative).`,
        { file: relPath }
      );
    }
  }
}
