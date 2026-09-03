# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project is in **Beta `0.1.0-beta.1`** status. The format is not stable yet;
see [Versioning and Release](docs/versioning-and-release.md) for the release
and compatibility policy.

## [0.1.0-beta.1] - 2026-09-03

### Beta contents

- Initial beta release of the MOCA specification, schemas, examples, and
  offline `moca-lint` reference tooling.
- Versioning and release policy for the beta and the future `1.0.0` release.
- Package-boundary path validation for evidence, integrity, and augmentation
  references.

### Beta changes

- Conformance level is derived from package contents and validation results; it
  is not declared in `moca.json`.
- Documentation now distinguishes beta behavior from deferred SHACL,
  cryptographic signature, and full external-standard validation.

## [Unreleased]

### Added

- `moca-core-spec.md` — MOCA Core Package Specification (beta).
- `moca-education-profile.md` — MOCA Education Profile (beta).
- Repository community files (README, CONTRIBUTING, CODE_OF_CONDUCT,
  GOVERNANCE, SECURITY) for public release under `openmoca/moca-spec`.
- `schemas/core/moca.schema.json` — JSON Schema for the root manifest.
- `schemas/core/context.jsonld` — canonical JSON-LD context for the core
  vocabulary.
- `schemas/education/profile.schema.json` — JSON Schema for
  `profileData.education`.
- Example packages under `examples/` covering Level 1–3 conformance, the
  education profile, and the sidecar augmentation pattern.
- CI validation workflow (`.github/workflows/validate.yml`).
