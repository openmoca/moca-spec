import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeCanonicalDigest } from './canonical-digest.js';
import { loadTrustRoot } from './keys.js';
import { verifyDsse } from './dsse-mode.js';
import { verifySigstore } from './sigstore-mode.js';

const PLACEHOLDER_VALUE = 'PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST';

/**
 * Verifies a package's moca.json `signature` object against its recomputed
 * canonicalDigest (core §5.5). See spec/moca-trust-model.md §6 for the outcome
 * contract this returns.
 *
 * @param {object} params
 * @param {string} params.rootDir
 * @param {object} [params.manifest] - parsed moca.json; read from rootDir if omitted
 * @param {string} [params.dsseTrustRootPath] - path to a dsse-mode trust-roots.json (spec/moca-trust-model.md §4.2)
 * @param {{issuer: string, pattern: string}[]} [params.identityConstraints] - sigstore-mode only (§4.1)
 * @param {boolean} [params.onlineVerify]
 * @param {boolean} [params.allowOfflineFallback]
 * @param {string} [params.sigstoreTrustRootPath] - pinned TUF cache dir, sigstore mode only (§4.1)
 * @returns {Promise<
 *   { outcome: 'valid', keyid?: string, identity?: object }
 *   | { outcome: 'malformed'|'invalid'|'indeterminate', reason: string }
 * >}
 */
export async function verifyPackageSignature({
  rootDir,
  manifest,
  dsseTrustRootPath,
  identityConstraints = [],
  onlineVerify = false,
  allowOfflineFallback = false,
  sigstoreTrustRootPath,
}) {
  const resolvedManifest = manifest ?? JSON.parse(readFileSync(join(rootDir, 'moca.json'), 'utf8'));
  const signature = resolvedManifest.signature;

  if (!signature || typeof signature !== 'object') {
    return { outcome: 'malformed', reason: 'no signature object present' };
  }
  if (signature.value === PLACEHOLDER_VALUE) {
    return { outcome: 'malformed', reason: 'signature.value is the literal placeholder string, not a real signature' };
  }
  if (!resolvedManifest.canonicalDigest?.value) {
    return {
      outcome: 'malformed',
      reason: 'a signed package MUST also declare canonicalDigest (spec/moca-trust-model.md §2) — none present',
    };
  }
  if (typeof signature.value !== 'string') {
    return { outcome: 'malformed', reason: 'signature.value must be a string' };
  }

  const canonicalDigestValue = computeCanonicalDigest(rootDir);

  if (signature.type === 'dsse') {
    if (!dsseTrustRootPath) {
      return { outcome: 'invalid', reason: 'dsse-mode signature but no trust root supplied (--trust-root)' };
    }
    let trustRoot;
    try {
      trustRoot = loadTrustRoot(dsseTrustRootPath);
    } catch (err) {
      return { outcome: 'invalid', reason: err.message };
    }
    const result = verifyDsse({ signature, manifest: resolvedManifest, canonicalDigestValue, trustRoot });
    return result.ok
      ? { outcome: 'valid', keyid: result.keyid }
      : { outcome: result.code, reason: result.reason };
  }

  if (signature.type === 'sigstore') {
    const result = await verifySigstore({
      signature,
      manifest: resolvedManifest,
      canonicalDigestValue,
      identityConstraints,
      onlineVerify,
      allowOfflineFallback,
      trustRootCachePath: sigstoreTrustRootPath,
    });
    return result.ok
      ? { outcome: 'valid', identity: result.identity }
      : { outcome: result.code, reason: result.reason };
  }

  return { outcome: 'malformed', reason: `unknown signature.type: ${signature.type}` };
}

export { PLACEHOLDER_VALUE };
