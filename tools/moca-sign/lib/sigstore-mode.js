// "sigstore" signature mode: keyless Fulcio/Rekor signing and verification,
// delegated to the `sigstore` npm package. See spec/moca-trust-model.md §3.1/§4.1.
//
// Signing (attest()) requires a real OIDC identity token — ambient CI
// credentials (GitHub Actions) or an interactively-obtained token — and is
// not exercised by this repo's own deterministic test suite; see
// tools/moca-sign/README.md "Known limitations."
import { attest, verify } from 'sigstore';
import { buildStatement, verifyStatementSubject, DSSE_PAYLOAD_TYPE } from './statement.js';

/**
 * @param {object} params
 * @param {object} params.manifest
 * @param {string} params.canonicalDigestValue
 * @param {object} [params.signOptions] - passed through to sigstore's attest() (fulcioURL, rekorURL, identityToken, ...)
 * @returns {Promise<{ type: 'sigstore', value: string }>}
 */
export async function signSigstore({ manifest, canonicalDigestValue, signOptions = {} }) {
  const statement = buildStatement({ id: manifest.id, version: manifest.version, canonicalDigestValue });
  const bundle = await attest(statement, DSSE_PAYLOAD_TYPE, signOptions);
  return {
    type: 'sigstore',
    value: Buffer.from(JSON.stringify(bundle), 'utf8').toString('base64'),
  };
}

/**
 * @param {string} pattern
 * @returns {'email' | 'uri'}
 */
function classifyIdentityPattern(pattern) {
  return pattern.includes('@') && !pattern.includes('://') ? 'email' : 'uri';
}

/**
 * @param {object} params
 * @param {object} params.signature - manifest.signature (type === 'sigstore')
 * @param {object} params.manifest
 * @param {string} params.canonicalDigestValue - recomputed from disk (core §5.5)
 * @param {{issuer: string, pattern: string}[]} [params.identityConstraints]
 * @param {boolean} [params.onlineVerify]
 * @param {boolean} [params.allowOfflineFallback]
 * @param {string} [params.trustRootCachePath]
 * @returns {Promise<{ ok: true, identity: object } | { ok: false, code: 'malformed'|'invalid'|'indeterminate', reason: string }>}
 */
export async function verifySigstore({
  signature,
  manifest,
  canonicalDigestValue,
  identityConstraints = [],
  onlineVerify = false,
  allowOfflineFallback = false,
  trustRootCachePath,
}) {
  let bundle;
  try {
    bundle = JSON.parse(Buffer.from(signature.value, 'base64').toString('utf8'));
  } catch {
    return { ok: false, code: 'malformed', reason: 'signature.value is not a base64-encoded Sigstore bundle' };
  }

  const baseOptions = {
    ...(trustRootCachePath ? { tufCachePath: trustRootCachePath, tufForceCache: !onlineVerify } : {}),
  };

  const constraintSets = identityConstraints.length > 0
    ? identityConstraints.map(({ issuer, pattern }) => ({
      certificateIssuer: issuer,
      ...(classifyIdentityPattern(pattern) === 'email'
        ? { certificateIdentityEmail: pattern }
        : { certificateIdentityURI: pattern }),
    }))
    : [{}];

  let lastError;
  for (const constraints of constraintSets) {
    try {
      const signer = await verify(bundle, { ...baseOptions, ...constraints });
      const subjectCheck = verifyStatementSubjectFromBundle(bundle, { id: manifest.id, version: manifest.version, canonicalDigestValue });
      if (!subjectCheck.ok) {
        return { ok: false, code: 'invalid', reason: subjectCheck.reason };
      }
      return { ok: true, identity: signer };
    } catch (err) {
      lastError = err;
    }
  }

  const message = lastError?.message ?? 'signature verification failed';
  if (isNetworkError(lastError)) {
    if (allowOfflineFallback) {
      return verifySigstore({
        signature,
        manifest,
        canonicalDigestValue,
        identityConstraints,
        onlineVerify: false,
        allowOfflineFallback: false,
        trustRootCachePath,
      });
    }
    return { ok: false, code: 'indeterminate', reason: `online verification could not complete: ${message}` };
  }

  return { ok: false, code: 'invalid', reason: message };
}

function isNetworkError(err) {
  if (!err) return false;
  const code = err.cause?.code ?? err.code;
  return ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)
    || /network|fetch failed|ENOTFOUND|timeout/i.test(err.message ?? '');
}

// attest()'s bundle embeds the DSSE payload directly (unlike sign(), which
// needs the caller to supply it back). Decode it the same way verify()
// itself does, so we can additionally check the statement subject.
function verifyStatementSubjectFromBundle(bundle, expected) {
  const dsseEnvelope = bundle.dsseEnvelope;
  if (!dsseEnvelope?.payload) {
    return { ok: false, reason: 'bundle has no dsseEnvelope.payload to check subject against' };
  }
  const payload = Buffer.from(dsseEnvelope.payload, 'base64');
  return verifyStatementSubject(payload, expected);
}
