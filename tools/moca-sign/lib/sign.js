import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeCanonicalDigest } from './canonical-digest.js';
import { signDsse } from './dsse-mode.js';
import { signSigstore } from './sigstore-mode.js';

/**
 * Signs a package in place: computes (or recomputes) `canonicalDigest`,
 * signs an in-toto statement over it (spec/moca-trust-model.md §2), and writes
 * both `canonicalDigest` and `signature` into moca.json.
 *
 * Does not support composed packages (`composition.members`) — same
 * single-target-directory limitation as moca-lint's own lint pass; see
 * tools/moca-sign/README.md "Known limitations."
 *
 * @param {object} params
 * @param {string} params.rootDir
 * @param {'dsse'|'sigstore'} params.mode
 * @param {string} [params.privateKeyPath] - dsse mode: PEM Ed25519 private key
 * @param {string} [params.keyid] - dsse mode
 * @param {object} [params.signOptions] - sigstore mode: passed to sigstore's attest()
 * @returns {Promise<{ canonicalDigest: object, signature: object }>}
 */
export async function signPackage({ rootDir, mode, privateKeyPath, keyid, signOptions }) {
  const manifestPath = join(rootDir, 'moca.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const canonicalDigestValue = computeCanonicalDigest(rootDir);
  manifest.canonicalDigest = { algorithm: 'sha256', value: canonicalDigestValue };

  let signature;
  if (mode === 'dsse') {
    if (!privateKeyPath || !keyid) {
      throw new Error('dsse mode requires --key and --keyid');
    }
    const privateKeyPem = readFileSync(privateKeyPath, 'utf8');
    signature = signDsse({ manifest, canonicalDigestValue, privateKeyPem, keyid });
  } else if (mode === 'sigstore') {
    signature = await signSigstore({ manifest, canonicalDigestValue, signOptions });
  } else {
    throw new Error(`unknown signing mode: ${mode}`);
  }

  manifest.signature = signature;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { canonicalDigest: manifest.canonicalDigest, signature };
}
