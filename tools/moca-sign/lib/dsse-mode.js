import { buildStatement, verifyStatementSubject, DSSE_PAYLOAD_TYPE } from './statement.js';
import { createEnvelope, verifyEnvelope } from './dsse.js';

/**
 * @param {object} params
 * @param {object} params.manifest - parsed moca.json (id, version)
 * @param {string} params.canonicalDigestValue
 * @param {string} params.privateKeyPem
 * @param {string} params.keyid
 * @returns {{ type: 'dsse', value: string, keyid: string }}
 */
export function signDsse({ manifest, canonicalDigestValue, privateKeyPem, keyid }) {
  const statement = buildStatement({ id: manifest.id, version: manifest.version, canonicalDigestValue });
  const envelope = createEnvelope({ payload: statement, payloadType: DSSE_PAYLOAD_TYPE, privateKeyPem, keyid });
  return {
    type: 'dsse',
    value: Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64'),
    keyid,
  };
}

/**
 * @param {object} params
 * @param {object} params.signature - manifest.signature (type === 'dsse')
 * @param {object} params.manifest
 * @param {string} params.canonicalDigestValue - recomputed from disk, the source of truth (core §5.5)
 * @param {{ resolvePublicKey: (keyid: string) => string|undefined }} params.trustRoot
 * @returns {{ ok: true, keyid: string } | { ok: false, code: 'malformed'|'invalid', reason: string }}
 */
export function verifyDsse({ signature, manifest, canonicalDigestValue, trustRoot }) {
  let envelope;
  try {
    envelope = JSON.parse(Buffer.from(signature.value, 'base64').toString('utf8'));
  } catch {
    return { ok: false, code: 'malformed', reason: 'signature.value is not a base64-encoded JSON DSSE envelope' };
  }

  const verified = verifyEnvelope({ envelope, resolvePublicKey: trustRoot.resolvePublicKey });
  if (!verified.ok) {
    return { ok: false, code: 'invalid', reason: verified.reason };
  }

  const subjectCheck = verifyStatementSubject(verified.payload, {
    id: manifest.id,
    version: manifest.version,
    canonicalDigestValue,
  });
  if (!subjectCheck.ok) {
    return { ok: false, code: 'invalid', reason: subjectCheck.reason };
  }

  return { ok: true, keyid: verified.keyid };
}
