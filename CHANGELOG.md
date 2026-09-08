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

- Lowered the Level 1 floor to a valid `moca.json` plus at least one CommonMark
  file under `content/`; YAML frontmatter is now optional, missing node IDs
  fall back to content-relative paths, and `@context` is required only when a
  CURIE appears (core §3, §4.2, and §7.1).
- Included `examples/level-1-bare` in `moca-lint` CI validation and the
  `tools/moca-lint` test suite, closing the follow-up gap recorded in
  `issue-drafts/ISSUE-DRAFT-level1.md`.
- Reorganized profile specifications, schemas, and examples into self-contained
  bundles under `profiles/` for independent extraction.
- Narrowed repository validation to MOCA Core conformance and structural checks;
  `moca-lint` no longer validates profile-owned `profileData` against profile
  schemas.
- Revised `ROADMAP.md` to add signature and trust infrastructure, operationalize
  the `1.0.0` stability review, and reflect the completed EU AI Act profile.
- Reordered `moca-core-spec.md` so Package Composition & Relationships
  immediately follows Sidecar Augmentation, grouping the two package-relationship
  mechanisms together: Composition is now §10, Profiles moved to §11
  (subsections §11.1-§11.5), and Vendor Extensions moved to §12. Updated every
  cross-reference to the renumbered sections across the repo (spec, profiles,
  CONTRIBUTING.md, GOVERNANCE.md, issue templates, ROADMAP.md, moca-lint, and
  examples).
- Moved spec-change working drafts into `issue-drafts/` and added
  `issue-drafts/ISSUE-DRAFT-lifecycle.md`, `issue-drafts/ISSUE-DRAFT-provenance.md`,
  and `issue-drafts/ISSUE-DRAFT-canonical-hashing.md`, matching the existing
  `ISSUE-DRAFT-composition.md`/`ISSUE-DRAFT-level1.md` format.
- Resequenced `ROADMAP.md` to insert Core Hardening (lifecycle, provenance,
  composition) and Canonical Package Hashing immediately after Level 1
  adoption, since composition must be settled before hashing can account for
  composed-package identity, and before the education profile's `Course`/
  `Module` shape can be redesigned around `composition.members`.

### Added

- Completed `ROADMAP.md` item 4 (MOCA Index and Optional Search): wired
  `validate:sidecar-index` into CI, replaced the synthetic
  `python-312-docs.moca.idx` reference fixture with a real sidecar bound to
  `examples/level-1-minimal` via its `canonicalDigest.value`, and extended
  `scripts/validate-sidecar-index.mjs` to check payload existence, the
  `chunk_index`/`chunk_count` addressing invariant, `content_path` package
  boundaries (reusing `tools/moca-lint/lib/paths.js`'s `resolvePackagePath`),
  and `target_package_hash` against the target's actual computed digest.
- Added the optional `canonicalDigest` whole-package identity mechanism,
  standalone `validate:canonical-digest` verification script, and generated
  digest annotations for `examples/level-1-minimal` and the three
  `examples/composition-members` packages.
- Implemented `ROADMAP.md` item 2 (Core Hardening): optional manifest/
  content-node lifecycle fields (`validFrom`, `lastReviewed`, `supersedes`,
  core §7.5), a concrete PROV-O mapping for `claims[].provenance` (core
  §7.4), and a `composition` mechanism (`members`/`relates`, core §10)
  letting one package reference others as containment or loose reference,
  including a Level 1 floor amendment allowing composition-only packages
  (core §3).
- `schemas/core/moca.schema.json`: added `composition`, `validFrom`,
  `lastReviewed`, and `supersedes` manifest properties, and
  `compositionMember`/`compositionRelation` `$defs`.
- `schemas/core/context.jsonld`: activated the previously-unused `prov:`
  prefix for `claims[].provenance`, and added JSON-LD terms for
  `composition`/`members`/`relates`/`order`/`validFrom`/`lastReviewed`/
  `supersedes`. `composition.relates[].relationship` uses a
  property-scoped `@context` to expand to a distinct `moca:
  compositionRelationship` predicate, separate from
  `augmentation.relationship`'s existing `moca:augmentationRelationship`
  (unchanged) — both containers reuse the same JSON key name without
  colliding at the RDF level.
- `scripts/validate-jsonld-context.mjs` (new `npm run validate:jsonld`,
  wired into CI): expands `context.jsonld` through a real JSON-LD
  processor (`jsonld.js`) and asserts the `augmentation`/`composition.relates`
  predicates stay distinct and `claims[].provenance` resolves to the
  correct `prov:` IRIs — this is a real expansion check, not just a
  JSON-parse sanity check.
- New example packages: `examples/composition-members/` (a composition-only
  course referencing two module packages) and `examples/composition-relates/`
  (two independent documents linked via `crossReferences`/`supersedes`).

### Fixed

- `schemas/core/context.jsonld`: fixed a pre-existing bug where `claims[]`'s
  `subject` and `predicate` terms were aliased directly to the `@id`
  keyword, colliding with the sibling `id` field and any other `@id`-aliased
  term on the same node (JSON-LD `colliding keywords` error). They now
  expand to dedicated `moca:claimSubject`/`moca:claimPredicate`/
  `moca:claimObject` predicates with `@type: @id`, discovered by the new
  `validate:jsonld` expansion check.

- `profiles/eu-ai-act/moca-eu-ai-act-profile.md` — MOCA EU AI Act compliance profile (beta), demonstrating how regulatory and compliance standards are modeled as ordinary MOCA profiles.
- `profiles/eu-ai-act/profile.schema.json` — JSON Schema for `profileData.euAiAct` with open-string classification fields.
- Example EU AI Act package under `profiles/eu-ai-act/examples/eu-ai-act-profile/` with profileData, governance ontology (SHACL), and human oversight content node.
- New subsection [core §11.5](moca-core-spec.md#115-compliance--standards-profiles) documenting compliance and standards profiles, their relationship to the ordinary profile mechanism, and a reference table of candidate profiles (EU AI Act, NIST AI RMF, ISO/IEC 42001, etc.).
- Cross-reference updates: README.md Specification list, CONTRIBUTING.md compliance profile guidance, docs/quickstart.md "Going further" table.
