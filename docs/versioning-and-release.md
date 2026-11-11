# Versioning and release

Three things carry versions, independently.

| What | Version | Where |
| --- | --- | --- |
| The specification | `0.6.0`; packages name it as `mocaVersion` `0.6` | `spec/`, `schemas/v1/`, `conformance/cases.json` (`corpusVersion`) |
| The reference Reader and each tool | Its own semver | Each tool's repository |
| Each package's content | The package's `version` | `moca.json` ([package spec §4.3](../spec/moca-package-spec.md#43-content-versions)) |

## Before 1.0.0

- A minor version of the specification may be breaking. Every breaking change
  is listed in [CHANGELOG.md](../CHANGELOG.md) and explained in
  [MIGRATIONS.md](../MIGRATIONS.md).
- Diagnostic codes are not reused: a changed meaning gets a new code.
- The conformance corpus is released with the specification. Other
  implementations pin a corpus version.

## From 1.0.0

- Breaking changes to the specification, schemas, diagnostic codes or
  conformance expectations require a major version.
- New optional fields, codes and capabilities are minor.
- When `1.0.0` comes is in [GOVERNANCE.md](../GOVERNANCE.md#path-to-a-standard).
