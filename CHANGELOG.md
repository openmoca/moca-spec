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
  schemas. See [MIGRATIONS.md](MIGRATIONS.md) for what this means for an
  affected package or profile author.
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

- Completed `ROADMAP.md` item 5 (Open Source CLI Application and Developer
  Tooling), closing out its remaining bullets on top of the `moca-convert`
  entry below:
  - Added the `moca-index` CLI (`tools/moca-index`) to build a `.moca.idx`
    sidecar for a target package: `moca-index build <package-dir> -o
    <output>` binds to the target's `canonicalDigest` when present (refusing
    without `--allow-unbound` otherwise, and refusing a composed target
    entirely), chunks `content/` one file per chunk (`chunking.strategy:
    "node_level"`), and self-validates (schema conformance, the
    `chunk_index`/`chunk_count` addressing invariant, and a recomputed
    `target_package_hash` match) before writing — fail-closed, same as
    `moca-convert`. `--zip` writes a single archive instead of a directory.
    Documented in `tools/moca-index/README.md` and `docs/quickstart.md` §7,
    covered by a new CI job, and exercised by 31 tests.
  - Added `moca-lint extract <archive> -o <dest-dir>` (`tools/moca-lint`),
    closing the archive-extraction half of the `moca-pack` roadmap bullet
    (`pack`/creation already existed). Reuses the same hardened
    zip-bomb/entry-count/path-traversal guards `lint`/`pack` already apply
    internally, refuses a non-empty destination without `--force`, and
    supports an opt-in `--lint` pass afterward. `validateArchiveEntries()`'s
    limits are now injectable (defaulting to the real production values) so
    the entry-count/size rejection paths are unit-testable without
    constructing multi-hundred-MB fixtures.
  - Formalized the `moca-lint` Validation Contract (`ROADMAP.md` item 5
    subsection): a new "Validation Contract" section in
    `tools/moca-lint/README.md` states which finding codes are normative
    for this release versus explicitly provisional; `SECURITY.md`'s scope
    now names a `moca-lint` false negative as security-sensitive, not just
    a schema gap; and a new `MIGRATIONS.md` records behavior changes for an
    affected package author, distinct from `CHANGELOG.md` prose, starting
    with the `profileData` validation removal.
  - Converted the `moca-lint`/`moca-convert`/`moca-index` CI jobs in
    `.github/workflows/validate.yml` to a `ubuntu-latest`/`windows-latest`/
    `macos-latest` matrix, and added `"engines": {"node": ">=22"}` to each
    tool's `package.json` — the credible basis for the roadmap's
    "cross-platform installation" bullet, as opposed to an unverified claim.
  - Fixed a real bug this work surfaced: `scripts/validate-canonical-digest.mjs`
    ran its CLI-only logic (scanning `examples/`/`profiles/`, printing to the
    console, calling `process.exit()`) as a side effect of merely being
    *imported* for its `computeCanonicalDigest()` export, since the script
    had no entry-point guard. Both `moca-lint extract`'s round-trip test and
    the new `moca-index` import it directly; added an
    `import.meta.url`-based guard so the exported function is safe to import
    as a library while `node scripts/validate-canonical-digest.mjs` and its
    `--print` mode keep working unchanged.
- Added the `moca-convert` CLI (`tools/moca-convert`, `ROADMAP.md` item 5)
  to create Level 1 packages from existing source material: a `directory`
  of Markdown files, a single Markdown file or glob (`markdown`), an
  Obsidian vault with `[[wikilink]]` rewriting (`obsidian`), and a suitable
  OpenAPI 3.x document rendered one content node per operation or per tag
  (`openapi`). Every adapter emits Level 1 output only — no ontologies,
  claims, profiles, embeddings, or signatures are fabricated — and lints
  its own output via `moca-lint`'s `lintPackage()` before reporting
  success, refusing to leave invalid or partial output on disk. Documented
  in `tools/moca-convert/README.md` and `docs/quickstart.md` §6, covered by
  a new CI job, and exercised by 75 tests including CLI-level subprocess
  smoke tests.
- Fixed `lint:md`'s `!node_modules` exclude pattern, which only matched a
  top-level `node_modules` directory and missed nested workspace installs
  (e.g. `tools/moca-convert/node_modules` after pinning a direct `js-yaml`
  dependency); changed to `!**/node_modules/**`.
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
- Completed `ROADMAP.md` item 6 (Signature & Trust Infrastructure),
  operationalizing core §8.2/§3.1's signature requirement, which previously
  had no implementation path:
  - `docs/trust-model.md` (new): the signer/verifier trust model core §8.2
    references — a signature signs a DSSE-wrapped in-toto v1 Statement over
    `canonicalDigest.value` (not the raw archive), two supported modes
    (`sigstore` keyless Fulcio/Rekor and `dsse` long-lived-key), trust-root
    and identity-constraint configuration for both, offline-by-default /
    opt-in `--online-verify` behavior, and revocation handling per mode.
  - `tools/moca-sign` (new workspace package): reference `sign`/`verify`
    CLI and library (`verifyPackageSignature()`) implementing both modes —
    hand-rolled DSSE (PAE encoding + Ed25519) for `dsse` mode, a thin
    wrapper over the `sigstore` npm package's `attest()`/`verify()` for
    `sigstore` mode.
  - `tools/moca-lint`: Pass 4 now cryptographically verifies a present
    `signature` via `moca-sign` instead of only checking it's structurally
    present. New `--trust-root`, `--identity-constraint`, and
    `--allow-offline-fallback` flags; `--online-verify` (previously accepted
    but documented as not implemented) now does something. `lintPackage()`/
    `packPackage()` are now async, since verification (`sigstore` mode) can
    involve asynchronous work — every caller across `moca-lint`,
    `moca-convert`, and their test suites was updated to `await` it.
  - `moca-core-spec.md` §5.5: `canonicalDigest`'s manifest-hash input now
    also excludes `signature`, for the same self-reference reason it already
    excluded `canonicalDigest` itself — see MIGRATIONS.md.
  - Conformance fixtures under `tools/moca-lint/test/fixtures/` covering
    valid, missing, placeholder, tampered-after-signing, and
    untrusted-signer signatures.
  - Re-signed the three previously-placeholder-signature examples
    (`examples/level-3-extended`,
    `profiles/education/examples/education-profile`,
    `profiles/eu-ai-act/examples/eu-ai-act-profile`) with a real, documented,
    non-production `dsse`-mode example key (`examples/keys/`), updating each
    README's disclaimer accordingly; `npm run lint:moca` now passes
    `--trust-root` to verify them.

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
