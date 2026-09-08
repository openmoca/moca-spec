// Ed25519 keypair generation and dsse-mode trust-root loading.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

/**
 * @returns {{ privateKeyPem: string, publicKeyPem: string }}
 */
export function generateKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
  };
}

/**
 * Loads a dsse-mode trust-root file: `{ "keys": [{ keyid, publicKey, identity?, expires? }] }`.
 * See docs/trust-model.md §4.2.
 *
 * @param {string} path
 * @returns {{ resolvePublicKey: (keyid: string, now?: Date) => string|undefined, entries: object[] }}
 */
export function loadTrustRoot(path) {
  if (!existsSync(path)) {
    throw new Error(`trust root not found: ${path}`);
  }
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  if (!doc || !Array.isArray(doc.keys)) {
    throw new Error(`${path}: trust root must have a "keys" array`);
  }
  const byKeyid = new Map(doc.keys.map((entry) => [entry.keyid, entry]));

  return {
    entries: doc.keys,
    resolvePublicKey(keyid, now = new Date()) {
      const entry = byKeyid.get(keyid);
      if (!entry) return undefined;
      if (entry.expires && new Date(entry.expires).getTime() < now.getTime()) return undefined;
      return entry.publicKey;
    },
  };
}
