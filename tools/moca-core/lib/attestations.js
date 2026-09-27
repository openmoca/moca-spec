// Detached attestations: spec/moca-attestations.md.
//
// A package carries its attestations under attestations/, which the canonical
// digest excludes. Each file is either a DSSE envelope (*.dsse.json) or a
// Sigstore bundle (*.sigstore.json) wrapping an in-toto v1 Statement with one
// of two MOCA predicate types:
//
//   package/v1  "this exact package was published by this signer"
//   review/v1   "this reviewer checked these exact node files"
import { readFileSync } from 'node:fs';
import { verifyEnvelope } from './dsse.js';
import { validateAgainst } from './schemas.js';

export const STATEMENT_TYPE = 'https://in-toto.io/Statement/v1';
export const PAYLOAD_TYPE = 'application/vnd.in-toto+json';
export const PREDICATE_PACKAGE = 'https://w3id.org/moca/attestation/package/v1';
export const PREDICATE_REVIEW = 'https://w3id.org/moca/attestation/review/v1';

const hexOf = (digest) => digest.replace(/^sha256:/, '');

/** @returns {object} in-toto Statement for a package attestation */
export function packageStatement({ id, version, digest }) {
  return {
    _type: STATEMENT_TYPE,
    subject: [{ name: `${id}@${version}`, digest: { sha256: hexOf(digest) } }],
    predicateType: PREDICATE_PACKAGE,
    predicate: {},
  };
}

/**
 * @param {{ packageId: string, files: Array<{ path: string, sha256: string }>, reviewer: string, reviewedAt: string, outcome: string, scope?: string, note?: string }} p
 * @returns {object} in-toto Statement for a review attestation
 */
export function reviewStatement({ packageId, files, reviewer, reviewedAt, outcome, scope, note }) {
  const predicate = { package: packageId, reviewer, reviewedAt, outcome };
  if (scope) predicate.scope = scope;
  if (note) predicate.note = note;
  return {
    _type: STATEMENT_TYPE,
    subject: files.map((f) => ({ name: f.path, digest: { sha256: f.sha256 } })),
    predicateType: PREDICATE_REVIEW,
    predicate,
  };
}

/**
 * Loads a host trust root (spec/moca-attestations.md §6) from a path or object.
 *
 * @param {string|object} input
 */
export function loadTrustRoot(input) {
  const doc = typeof input === 'string' ? JSON.parse(readFileSync(input, 'utf8')) : input;
  const errors = validateAgainst('trustRoot', doc);
  if (errors.length > 0) throw new Error(`invalid trust root: ${errors.join('; ')}`);
  const keys = new Map((doc.keys ?? []).map((k) => [k.keyid, k]));
  const allows = (entry, role) => !entry.roles || entry.roles.includes(role);
  return {
    doc,
    /** @returns {{ publicKey: string, identity: string } | undefined} */
    key(keyid, role, now = new Date()) {
      const entry = keys.get(keyid);
      if (!entry || !allows(entry, role)) return undefined;
      if (entry.expires && Date.parse(entry.expires) < now.getTime()) return undefined;
      return { publicKey: entry.publicKey, identity: entry.identity ?? keyid };
    },
    sigstoreIdentities(role) {
      return (doc.sigstore?.identities ?? []).filter((i) => allows(i, role));
    },
  };
}

/**
 * Parses an attestation file into its envelope and statement.
 *
 * @param {string} path
 * @param {Buffer} bytes
 * @returns {{ ok: true, format: 'dsse'|'sigstore', container: object, statement: object } | { ok: false, reason: string }}
 */
export function parseAttestation(path, bytes) {
  const format = path.endsWith('.sigstore.json') ? 'sigstore' : path.endsWith('.dsse.json') ? 'dsse' : null;
  if (!format) return { ok: false, reason: 'attestation files must end in .dsse.json or .sigstore.json' };
  let container;
  try {
    container = JSON.parse(bytes.toString('utf8'));
  } catch {
    return { ok: false, reason: 'not valid JSON' };
  }
  const envelope = format === 'dsse' ? container : container?.dsseEnvelope;
  if (!envelope || typeof envelope.payload !== 'string' || typeof envelope.payloadType !== 'string') {
    return { ok: false, reason: format === 'dsse' ? 'not a DSSE envelope' : 'Sigstore bundle has no dsseEnvelope' };
  }
  if (envelope.payloadType !== PAYLOAD_TYPE) return { ok: false, reason: `unexpected payloadType ${envelope.payloadType}` };
  let statement;
  try {
    statement = JSON.parse(Buffer.from(envelope.payload, 'base64').toString('utf8'));
  } catch {
    return { ok: false, reason: 'payload is not a JSON in-toto statement' };
  }
  if (statement?._type !== STATEMENT_TYPE || !Array.isArray(statement.subject) || typeof statement.predicateType !== 'string') {
    return { ok: false, reason: 'payload is not an in-toto v1 Statement' };
  }
  return { ok: true, format, container, statement };
}

/**
 * Verifies the signature on a parsed attestation against the host trust root.
 * It does not check what the statement says; see checkPackageStatement and
 * checkReviewStatement for that.
 *
 * @param {{ format: string, container: object }} parsed
 * @param {ReturnType<typeof loadTrustRoot>|undefined} trustRoot
 * @param {'package'|'review'} role
 * @param {{ now?: Date, online?: boolean, allowOfflineFallback?: boolean, tufCachePath?: string }} [options]
 * @returns {Promise<{ outcome: 'valid'|'invalid'|'unverifiable'|'indeterminate', signer?: string, reason?: string }>}
 */
export async function verifySignature(parsed, trustRoot, role, options = {}) {
  if (!trustRoot) return { outcome: 'unverifiable', reason: 'no trust root was supplied' };
  const now = options.now ?? new Date();

  if (parsed.format === 'dsse') {
    let signer;
    const result = verifyEnvelope({
      envelope: parsed.container,
      resolvePublicKey: (keyid) => {
        const k = trustRoot.key(keyid, role, now);
        if (k) signer = k.identity;
        return k?.publicKey;
      },
    });
    if (!result.ok) return { outcome: 'invalid', reason: result.reason };
    return { outcome: 'valid', signer: trustRoot.key(result.keyid, role, now)?.identity ?? signer ?? result.keyid };
  }

  const identities = trustRoot.sigstoreIdentities(role);
  if (identities.length === 0) {
    return { outcome: 'unverifiable', reason: `the trust root lists no Sigstore identities for the ${role} role` };
  }
  const { verify } = await import('sigstore');
  const base = options.tufCachePath ? { tufCachePath: options.tufCachePath, tufForceCache: !options.online } : {};
  let lastError;
  for (const { issuer, subject } of identities) {
    const constraint = subject.includes('@') && !subject.includes('://')
      ? { certificateIdentityEmail: subject }
      : { certificateIdentityURI: subject };
    try {
      await verify(parsed.container, { ...base, certificateIssuer: issuer, ...constraint });
      return { outcome: 'valid', signer: `${issuer} ${subject}` };
    } catch (err) {
      lastError = err;
    }
  }
  const message = lastError?.message ?? 'verification failed';
  if (options.online && /network|fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|timeout/i.test(message)) {
    if (options.allowOfflineFallback) return verifySignature(parsed, trustRoot, role, { ...options, online: false, allowOfflineFallback: false });
    return { outcome: 'indeterminate', reason: `online verification could not complete: ${message}` };
  }
  return { outcome: 'invalid', reason: message };
}

/** @returns {string|null} reason the statement does not attest this package, or null */
export function checkPackageStatement(statement, { id, version, digest }) {
  if (statement.predicateType !== PREDICATE_PACKAGE) return 'not a package attestation';
  const subject = statement.subject[0];
  if (statement.subject.length !== 1 || subject?.name !== `${id}@${version}`) {
    return `subject "${subject?.name}" does not name ${id}@${version}`;
  }
  if (subject.digest?.sha256 !== hexOf(digest)) return 'subject digest does not match the package digest';
  return null;
}

/**
 * @param {object} statement
 * @param {string} packageId
 * @param {Map<string, string>} fileDigests  NFC path -> hex
 * @returns {{ error?: string, current: string[], outdated: string[], predicate?: object }}
 */
export function checkReviewStatement(statement, packageId, fileDigests) {
  const errors = validateAgainst('reviewPredicate', statement.predicate);
  if (errors.length > 0) return { error: `review predicate is invalid: ${errors.join('; ')}`, current: [], outdated: [] };
  if (statement.predicate.package !== packageId) {
    return { error: `review names package ${statement.predicate.package}, not ${packageId}`, current: [], outdated: [] };
  }
  const current = [];
  const outdated = [];
  for (const s of statement.subject) {
    if (typeof s?.name !== 'string' || typeof s?.digest?.sha256 !== 'string') {
      return { error: 'review subject entries need a name and a sha256 digest', current: [], outdated: [] };
    }
    if (fileDigests.get(s.name.normalize('NFC')) === s.digest.sha256) current.push(s.name);
    else outdated.push(s.name);
  }
  return { current, outdated, predicate: statement.predicate };
}
