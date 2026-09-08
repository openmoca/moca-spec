// Builds/parses the in-toto v1 Statement signed for a package — see
// docs/trust-model.md §2. The statement's only content-relevant field is the
// subject digest, which MUST equal the package's canonicalDigest.value
// (core §5.5); predicate is intentionally empty (§2).
export const STATEMENT_TYPE = 'https://in-toto.io/Statement/v1';
export const PREDICATE_TYPE = 'https://openmoca.org/attestations/package-signature/v1';
export const DSSE_PAYLOAD_TYPE = 'application/vnd.in-toto+json';

/**
 * @param {object} params
 * @param {string} params.id - manifest id
 * @param {string} params.version - manifest version
 * @param {string} params.canonicalDigestValue - lowercase hex sha256
 * @returns {Buffer} UTF-8 JSON bytes of the in-toto Statement
 */
export function buildStatement({ id, version, canonicalDigestValue }) {
  const statement = {
    _type: STATEMENT_TYPE,
    subject: [
      {
        name: `${id}@${version}`,
        digest: { sha256: canonicalDigestValue },
      },
    ],
    predicateType: PREDICATE_TYPE,
    predicate: {},
  };
  return Buffer.from(JSON.stringify(statement), 'utf8');
}

/**
 * Parses statement bytes and checks its subject against the expected
 * package identity/digest.
 *
 * @param {Buffer} payload
 * @param {{ id: string, version: string, canonicalDigestValue: string }} expected
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function verifyStatementSubject(payload, expected) {
  let statement;
  try {
    statement = JSON.parse(payload.toString('utf8'));
  } catch {
    return { ok: false, reason: 'signed payload is not valid JSON' };
  }
  if (statement._type !== STATEMENT_TYPE) {
    return { ok: false, reason: `unexpected statement _type: ${statement._type}` };
  }
  const subject = Array.isArray(statement.subject) ? statement.subject[0] : undefined;
  const expectedName = `${expected.id}@${expected.version}`;
  if (!subject || subject.name !== expectedName) {
    return { ok: false, reason: `statement subject name "${subject?.name}" does not match package "${expectedName}"` };
  }
  if (subject.digest?.sha256 !== expected.canonicalDigestValue) {
    return { ok: false, reason: 'statement subject digest does not match canonicalDigest.value' };
  }
  return { ok: true };
}
