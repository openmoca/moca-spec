// Error/warning code registry for moca-lint findings.
//
// `severity` is the *default* severity. Codes in WARN_BY_DEFAULT become
// `error` when --strict is passed; everything else is fixed regardless of
// --strict. `info` codes never affect the process exit code.

export const SEVERITY = Object.freeze({
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
});

// Codes that are `warning` by default and escalate to `error` under --strict.
export const WARN_BY_DEFAULT = new Set([
  'E203_DANGLING_EVIDENCE_SOURCE',
  'E210_UNVERIFIABLE_EPISTEMIC_STATUS',
  'E303_DUPLICATE_CONCEPT_DECLARATION',
  'E304_UNDEFINED_CONCEPT',
  'E403_ROCRATE_BAGIT_DISCREPANCY',
  'E405_ROCRATE_METADATA_INVALID',
]);

// Codes that are always informational and never affect the exit code.
export const INFO_CODES = new Set([
  'I301_SHACL_NOT_EVALUATED',
  'I404_SIGNATURE_NOT_VERIFIED',
]);

export const CODES = Object.freeze({
  E101_MANIFEST_MISSING: { pass: 1, summary: 'moca.json does not exist at the package root.' },
  E102_SCHEMA_INVALID: { pass: 1, summary: 'moca.json fails JSON Schema validation.' },
  E103_EXCLUDED_PROPERTIES: { pass: 1, summary: 'moca.json contains a forbidden runtime/execution key.' },
  E104_INVALID_CONTEXT_PREFIX: { pass: 1, summary: '@context contains a malformed CURIE prefix.' },
  E106_LEVEL1_REMOTE_CONTEXT: { pass: 1, summary: 'Level 1 packages must use an inline @context object.' },
  E201_FRONTMATTER_SYNTAX: { pass: 2, summary: 'Content file has invalid YAML frontmatter.' },
  E202_UNRESOLVED_NAMESPACE_PREFIX: { pass: 2, summary: 'Concept CURIE uses a prefix not declared in an inline manifest @context.' },
  E203_DANGLING_EVIDENCE_SOURCE: { pass: 2, summary: 'evidence[].source file does not exist under sources/, media/, or content/.' },
  E204_INVALID_EPISTEMIC_STATUS: { pass: 2, summary: 'epistemicStatus is not in the core vocabulary or an active profile vocabulary.' },
  E205_MISSING_LOCALE_FALLBACK: { pass: 2, summary: 'Locale-suffixed content file exists without its unsuffixed default file.' },
  E206_SKILL_FRONTMATTER_INVALID: { pass: 2, summary: 'SKILL.md frontmatter is missing name/description or allowed-tools is not an array.' },
  E207_DUPLICATE_NODE_ID: { pass: 2, summary: 'More than one content file declares the same frontmatter id.' },
  E208_INVALID_EVIDENCE_LOCATOR: { pass: 2, summary: 'evidence[].locator has an unknown type or is missing required sub-fields.' },
  E209_INVALID_CLAIM: { pass: 2, summary: 'claims[] entry is missing a required id, subject, predicate, or object.' },
  E210_UNVERIFIABLE_EPISTEMIC_STATUS: { pass: 2, summary: 'epistemicStatus is unrecognized, but the package declares a profile moca-lint has no vocabulary extension for.' },
  E211_UNSAFE_RESOURCE_PATH: { pass: 2, summary: 'A package resource reference is absolute, traverses outside the package, or escapes through a symlink.' },
  E301_RDF_SYNTAX_ERROR: { pass: 3, summary: 'File in ontologies/ fails JSON-LD or Turtle syntax parsing.' },
  I301_SHACL_NOT_EVALUATED: { pass: 3, summary: 'A shapes ontology is declared but SHACL shape evaluation is not implemented yet.' },
  E303_DUPLICATE_CONCEPT_DECLARATION: { pass: 3, summary: 'Multiple ontology files in this package declare the same concept with a different @type.' },
  E304_UNDEFINED_CONCEPT: { pass: 3, summary: 'Concept CURIE does not resolve to any @id declared in this package\'s ontology graphs.' },
  E401_UNSIGNED_SKILLS: { pass: 4, summary: 'skills/ is present but moca.json has no signature object.' },
  E402_INTEGRITY_MISMATCH: { pass: 4, summary: 'SHA-256 hash of a file on disk does not match moca.json integrity.' },
  E403_ROCRATE_BAGIT_DISCREPANCY: { pass: 4, summary: 'ro-crate-metadata.json or BagIt manifest hash conflicts with moca.json integrity.' },
  E405_ROCRATE_METADATA_INVALID: { pass: 4, summary: 'ro-crate-metadata.json is present but is not minimally valid RO-Crate 1.3 (core §2.1).' },
  I404_SIGNATURE_NOT_VERIFIED: { pass: 4, summary: 'signature object is present but cryptographic verification is not implemented yet.' },
});

export function defaultSeverity(code) {
  if (INFO_CODES.has(code)) return SEVERITY.INFO;
  if (WARN_BY_DEFAULT.has(code)) return SEVERITY.WARNING;
  return SEVERITY.ERROR;
}
