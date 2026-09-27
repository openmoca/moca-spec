// DSSE (Dead Simple Signing Envelope) — https://github.com/secure-systems-lab/dsse
//
// Implements the Pre-Authentication Encoding (PAE) and envelope shape
// directly against Node's built-in crypto (Ed25519) rather than depending on
// a third-party DSSE library, since the encoding is a handful of lines and
// this keeps the "dsse" signature mode's trust chain auditable end to end.
import { createPrivateKey, createPublicKey, sign as cryptoSign, verify as cryptoVerify } from 'node:crypto';

const PAE_PREFIX = 'DSSEv1';

/**
 * Pre-Authentication Encoding: DSSEv1 <len> <type> <len> <body>, space-separated,
 * lengths are the ASCII decimal byte length of the field that follows them.
 *
 * @param {string} payloadType
 * @param {Buffer} payload
 * @returns {Buffer}
 */
export function preAuthEncode(payloadType, payload) {
  const typeBuf = Buffer.from(payloadType, 'utf8');
  return Buffer.concat([
    Buffer.from(`${PAE_PREFIX} ${typeBuf.length} `, 'utf8'),
    typeBuf,
    Buffer.from(` ${payload.length} `, 'utf8'),
    payload,
  ]);
}

/**
 * @param {object} params
 * @param {Buffer} params.payload - raw (not base64) payload bytes.
 * @param {string} params.payloadType
 * @param {string} params.privateKeyPem - Ed25519 private key, PEM-encoded (PKCS8).
 * @param {string} params.keyid
 * @returns {{ payload: string, payloadType: string, signatures: [{ keyid: string, sig: string }] }}
 */
export function createEnvelope({ payload, payloadType, privateKeyPem, keyid }) {
  const pae = preAuthEncode(payloadType, payload);
  const key = createPrivateKey(privateKeyPem);
  const signature = cryptoSign(null, pae, key);
  return {
    payload: payload.toString('base64'),
    payloadType,
    signatures: [{ keyid, sig: signature.toString('base64') }],
  };
}

/**
 * @param {object} params
 * @param {object} params.envelope - a DSSE envelope as produced by createEnvelope.
 * @param {(keyid: string) => string|undefined} params.resolvePublicKey - returns
 *   a PEM (SPKI) public key for the given keyid, or undefined if unknown/untrusted.
 * @returns {{ ok: true, payload: Buffer, payloadType: string, keyid: string } | { ok: false, reason: string }}
 */
export function verifyEnvelope({ envelope, resolvePublicKey }) {
  if (
    !envelope
    || typeof envelope !== 'object'
    || typeof envelope.payload !== 'string'
    || typeof envelope.payloadType !== 'string'
    || !Array.isArray(envelope.signatures)
    || envelope.signatures.length === 0
  ) {
    return { ok: false, reason: 'malformed DSSE envelope' };
  }

  let payload;
  try {
    payload = Buffer.from(envelope.payload, 'base64');
  } catch {
    return { ok: false, reason: 'envelope payload is not valid base64' };
  }
  const pae = preAuthEncode(envelope.payloadType, payload);

  for (const entry of envelope.signatures) {
    if (typeof entry?.keyid !== 'string' || typeof entry?.sig !== 'string') continue;
    const publicKeyPem = resolvePublicKey(entry.keyid);
    if (!publicKeyPem) continue;
    let ok = false;
    try {
      const key = createPublicKey(publicKeyPem);
      ok = cryptoVerify(null, pae, key, Buffer.from(entry.sig, 'base64'));
    } catch {
      ok = false;
    }
    if (ok) {
      return { ok: true, payload, payloadType: envelope.payloadType, keyid: entry.keyid };
    }
  }

  return { ok: false, reason: 'no signature verified against a trusted key' };
}
