// Public entry point for @openmoca/moca-sign.
export { signPackage } from './sign.js';
export { verifyPackageSignature } from './verify.js';
export { generateKeyPair, buildTrustRoot, loadTrustRoot } from './keys.js';
export { computeCanonicalDigest } from './canonical-digest.js';
export { buildStatement, verifyStatementSubject, STATEMENT_TYPE, PREDICATE_TYPE, DSSE_PAYLOAD_TYPE } from './statement.js';
export { createEnvelope, verifyEnvelope, preAuthEncode } from './dsse.js';
