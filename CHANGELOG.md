# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project is a specification in **Draft — pre-adoption** status: there is
no version pinning yet, so entries below are not tied to semver releases.

## [Unreleased]

### Added

- `moca-core-spec.md` — MOCA Core Package Specification (draft).
- `moca-education-profile.md` — MOCA Education Profile (draft).
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
