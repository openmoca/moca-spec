// Public entry point for @openmoca/moca-lint.
//
// The subpath export "./lib/*" remains available for the deep imports the
// sibling CLIs already use, but anything re-exported here is the surface this
// package intends to keep stable.
export { lintPackage } from './lint.js';
export { packPackage } from './pack.js';
export { extractArchive, validateArchiveEntries, MAX_ENTRIES, MAX_UNCOMPRESSED_BYTES } from './target.js';
export { resolveTarget, UsageError } from './target.js';
export { formatText, formatJson, formatSarif } from './format.js';
export { FindingCollector } from './findings.js';
export { CODES, SEVERITY, defaultSeverity } from './codes.js';
export { resolvePackagePath } from './paths.js';
export { walkFiles } from './walk.js';
export { CORE_EPISTEMIC_STATUS, allowedEpistemicStatusValues } from './vocab.js';
