// @openmoca/moca-core: the reference MOCA Reader, plus the primitives the
// Producer tools share. See spec/moca-reader-contract.md.
export { readPackage } from './reader.js';
export { Library, citationFor, passesDefaultPolicy } from './library.js';
export { bindSidecar, PORTABLE_FORMAT, SIDECAR_MANIFEST } from './sidecar.js';
export { directoryResolver } from './resolver.js';
export { openSource, directorySource, archiveSource, hostSource, TargetError, DEFAULT_LIMITS } from './source.js';
export { computeDigest, packageFiles, sha256Hex, canonicalBytes, DIGEST_ALGORITHM, DIGEST_PATTERN, MANIFEST, ATTESTATIONS_DIR } from './digest.js';
export {
  loadTrustRoot, packageStatement, reviewStatement, parseAttestation, verifySignature,
  STATEMENT_TYPE, PAYLOAD_TYPE, PREDICATE_PACKAGE, PREDICATE_REVIEW,
} from './attestations.js';
export { createEnvelope, verifyEnvelope, preAuthEncode } from './dsse.js';
export { splitFrontmatter, joinFrontmatter, prependFrontmatterKeys } from './frontmatter.js';
export { SCHEMAS, validateAgainst } from './schemas.js';
export { CODES, SEVERITY, defaultSeverity } from './codes.js';
export { Diagnostics, countBySeverity } from './diagnostics.js';
export { formatText, formatJson, formatSarif } from './format.js';
export { KNOWN_PROFILES, PROFILE_AGENT_SKILLS, PROFILE_CLAIMS, PROFILE_EU_AI_ACT } from './profiles.js';
