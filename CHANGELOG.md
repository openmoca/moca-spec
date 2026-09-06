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

### Changed

- Reorganized profile specifications, schemas, and examples into self-contained
  bundles under `profiles/` for independent extraction.
- Narrowed repository validation to MOCA Core conformance and structural checks;
  `moca-lint` no longer validates profile-owned `profileData` against profile
  schemas.
- Revised `ROADMAP.md` to add signature and trust infrastructure, operationalize
  the `1.0.0` stability review, and reflect the completed EU AI Act profile.

### Added

- `profiles/eu-ai-act/moca-eu-ai-act-profile.md` — MOCA EU AI Act compliance profile (beta), demonstrating how regulatory and compliance standards are modeled as ordinary MOCA profiles.
- `profiles/eu-ai-act/profile.schema.json` — JSON Schema for `profileData.euAiAct` with open-string classification fields.
- Example EU AI Act package under `profiles/eu-ai-act/examples/eu-ai-act-profile/` with profileData, governance ontology (SHACL), and human oversight content node.
- New subsection [core §10.5](moca-core-spec.md#105-compliance--standards-profiles) documenting compliance and standards profiles, their relationship to the ordinary profile mechanism, and a reference table of candidate profiles (EU AI Act, NIST AI RMF, ISO/IEC 42001, etc.).
- Cross-reference updates: README.md Specification list, CONTRIBUTING.md compliance profile guidance, docs/quickstart.md "Going further" table.
