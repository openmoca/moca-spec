// Re-exports the repo's single canonicalDigest implementation so moca-sign
// and moca-lint compute/verify the exact same value — see core §5.5 and
// scripts/validate-canonical-digest.mjs. Cross-workspace relative import,
// matching the existing tools/moca-index/lib/validate.js pattern.
export { computeCanonicalDigest } from '../../../scripts/validate-canonical-digest.mjs';
