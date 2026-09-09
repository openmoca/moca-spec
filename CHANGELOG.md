# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project is in **Beta `0.1.0-beta.1`** status. The format is not stable yet;
see [Versioning and Release](docs/versioning-and-release.md) for the release
and compatibility policy.

## [Unreleased]

### Changed

- **Relicensed the project from MIT to Apache License 2.0**, covering both the
  specification prose and the reference tooling. The Apache §3 patent grant is
  the reason: MOCA is a format intended for independent implementation, and
  implementers should not have to weigh patent risk before adopting it. Added
  `NOTICE`. Example packages' `license` fields and every tool `package.json`
  now declare `Apache-2.0`.
- Removed the `issue-drafts/` directory. Eight of its ten documents described
  work that had already merged, and keeping proposal drafts in-tree
  contradicted `GOVERNANCE.md`'s "decisions happen in the open" — spec-change
  proposals are developed in GitHub issues, per `CONTRIBUTING.md`. The drafts
  remain in git history.
- Rewrote `ROADMAP.md` (442 → 174 lines). It had accumulated per-item
  completion notes longer than the items themselves, duplicating detail this
  changelog already carries. It is now a Delivered table plus Now/Next/Later,
  and states where each future component will live.
- Rewrote `GOVERNANCE.md`'s "Repository Layout" section, which described a
  structure that no longer existed: it claimed this repository contains "No
  executable harness code" (it contains four CLIs) and listed `sdk-dotnet` and
  `sdk-python` while omitting TypeScript, the language the entire existing
  toolchain is written in. It now documents the single-repository model through
  `1.0.0` and the graduation triggers for splitting components out.
- Reordered this changelog so `[Unreleased]` precedes released versions, per
  Keep a Changelog. It was previously inverted.
- **Moved the three normative specifications into `spec/`** — `moca-core-spec.md`,
  `moca-sidecar-index-spec.md` and `moca-trust-model.md`. Previously the core
  spec sat at the repository root while two equally normative documents sat in
  `docs/` beside non-normative guides, with nothing signalling which was which.
  `docs/` now means exactly "non-normative guides". 90 relative links were
  rebased and verified by `npm run validate:links`. See
  [MIGRATIONS.md](MIGRATIONS.md).
- **Versioned the schema directory and unified schema `$id` hosts.**
  `schemas/core/` became `schemas/v1/core/`, and every `$id` gained a `/v1/`
  segment. The sidecar index schema had been published under a different host
  (`spec.openmoca.org`) from the other three (`openmoca.org`); all four now use
  `openmoca.org`. Done now because
  [docs/versioning-and-release.md](docs/versioning-and-release.md) commits to
  versioned normative schemas at `1.0.0`, and retrofitting the segment later
  would break every published `$schema` reference. The `vocab/core#` namespace
  is deliberately unchanged — altering it would change JSON-LD expansion.
- **Moved non-package material out of `examples/`.** `examples/keys/` became
  `fixtures/signing-keys/` (a directory of test key material is not an example
  package, and its presence under `examples/` invited walkers to treat it as
  one), with the private key renamed to `INSECURE-example-signing-key.pem` so
  the filename itself carries the warning. `examples/indices/` became
  `examples/sidecars/`.
- Replaced `lint:moca`'s hardcoded list of 13 example paths with discovery
  (`scripts/lint-examples.mjs`). The hardcoded list would have silently stopped
  covering any example added after it was written.
- Restructured the documentation around the reader rather than the
  specification. `docs/` gained an index, a "why", use cases, an end-to-end
  walkthrough, and five guides; `docs/quickstart.md` was trimmed from 194 to
  121 lines and its deeper material moved into `docs/guides/authoring.md`.
- Rewrote the README opening to lead with the problem MOCA solves rather than
  a definition of it, and added a concrete "quick look" at a manifest and a
  grounded content node.
- **Renamed the four CLIs to the `@openmoca/` scope and made them actually
  publishable** — `@openmoca/moca-lint`, `-convert`, `-index`, `-sign`. They
  were `private: true` with unscoped names, so the `npx moca-lint` invocations
  throughout the documentation could never have worked. Each now declares
  `files`, `exports`, `repository`, `homepage`, `bugs`, and
  `publishConfig.access`, and has a `lib/index.js` public entry point.
- Moved the `canonicalDigest` implementation from
  `scripts/validate-canonical-digest.mjs` into
  `@openmoca/moca-sign/lib/canonical-digest.js`. A signature signs over
  `canonicalDigest.value`, so that package is where the value most
  fundamentally belongs; the script now imports it rather than owning it. The
  implementation is byte-identical — every existing digest still verifies. It
  deliberately does not reuse `moca-lint`'s file walker, because `moca-lint`
  depends on `moca-sign` and the reverse would be a dependency cycle.

### Added

- `scripts/validate-links.mjs` and `npm run validate:links`: verifies every
  relative Markdown link in a tracked `.md` file resolves on disk, and that
  `#fragment` anchors match a real heading in the target. Added ahead of the
  planned specification-document reorganisation, which rewrites cross-references
  at a scale that cannot be hand-audited. Wired into CI.
- A root `npm test` running every validator and all four tool test suites. The
  release checklist previously required running four separate suites by hand.
- A `moca-sign` CI job. The signing and verification tool — the most
  security-sensitive component in the repository — had no CI coverage at all;
  the other three tools each had a 3-OS matrix job.
- `.editorconfig`, and an expanded `.gitignore` (previously a single line).
- `scripts/refresh-derived.mjs`, `npm run refresh:derived` and
  `npm run validate:derived`. Three artifacts in a package are *derived* and go
  stale on any input change — `canonicalDigest` (which covers the manifest, so
  even a `license` edit invalidates it), `signature` (which signs over that
  digest), and a sidecar's `target_package_hash` — and they cascade, because a
  composed package folds its members' declared digests. Repairing them by hand
  in the right order is error-prone; this script topologically orders packages,
  recomputes digests, re-signs, and re-binds sidecars in one command.
  `--check` is the read-only CI form. The behaviour it automates is now
  documented normatively in
  [spec/moca-trust-model.md §2.1](spec/moca-trust-model.md#21-any-manifest-edit-is-a-re-signing-event).
- `scripts/example-lint-baseline.json`: a recorded baseline of the non-error
  findings the example corpus emits by design (a deliberately dangling evidence
  locator; `ex:` CURIEs with no in-package ontology). CI now fails on a *new*
  warning instead of leaving eight known ones as permanent noise.
- Documentation answering the two questions the repository could not previously
  answer:
  - [docs/why-moca.md](docs/why-moca.md) — the problem, the explicit non-goals,
    and why not to just use a folder of Markdown, a vector database, or a
    fine-tune.
  - [docs/guides/consuming.md](docs/guides/consuming.md) — the harness side, in
    implementation order: resolving a root, rejecting excluded properties,
    deriving the level, node identity and locale fallback, integrity,
    composition with cycle guards, the `skills/` trust decision, and graceful
    degradation. Every guide before this one was authoring-side.
- [docs/use-cases.md](docs/use-cases.md), including how MOCA relates to
  RO-Crate, DITA, SCORM/cmi5, MCP resources, PROV-O, and vector databases, and
  a section on where MOCA is a *poor* fit.
- [docs/walkthrough.md](docs/walkthrough.md) — a verified end-to-end run
  (convert → lint → sign → index → pack → extract → grounded answer), pulling
  roadmap item 10 forward in reduced form. Includes the fail-closed behaviour
  where signing a package makes subsequent lints require `--trust-root`.
- [docs/guides/choosing-a-level.md](docs/guides/choosing-a-level.md),
  [authoring.md](docs/guides/authoring.md),
  [signing-and-trust.md](docs/guides/signing-and-trust.md),
  [search-and-indexes.md](docs/guides/search-and-indexes.md), and a
  [docs index](docs/README.md) whose reference section points at authoritative
  sources rather than restating them.
- Use-case-shaped example packages under
  [examples/use-cases/](examples/use-cases): `support-kb` (epistemic status as
  a retrieval signal — `verified` vs `sourced` vs `disputed`) and
  `policy-corpus` (a versioned policy as two packages linked by `supersedes`,
  so the superseded text stays auditable). Examples were previously named only
  by conformance level, which is a specification author's taxonomy rather than
  a reader's.
- `scripts/lib/find-packages.mjs`: one recursive package-discovery helper,
  now shared by `validate-examples.mjs`, `lint-examples.mjs` and
  `refresh-derived.mjs`.
- [spec/moca-sdk-contract.md](spec/moca-sdk-contract.md): the language-neutral
  behavioural contract every SDK implements — eight capabilities, what an SDK
  must never do (execute package content, perform unrequested network I/O,
  read outside the package root), manifest and content semantics, diagnostics,
  identity and integrity, composition, profiles, index discovery, graceful
  degradation, and level derivation. It specifies *behaviour, not API shape*:
  method names and object models stay idiomatic per language, while what an
  SDK concludes about a package must not vary.
- [`conformance/`](conformance/README.md): 25 declarative cases over 25 fixture
  packages, plus the runner contract SDKs implement. Cases assert diagnostic
  **codes** and outcomes, never message prose, matching contract §6. Expected
  results are *observed from the reference implementation* by
  `scripts/generate-conformance-cases.mjs` rather than hand-written, so they
  cannot drift from it; `npm run conformance:check` runs in CI and fails when
  reference behaviour changes.
- `scripts/check-vendored-schema.mjs` and `npm run validate:vendored-schemas`,
  asserting that schemas vendored into publishable packages stay identical to
  the canonical copies under `schemas/`.
- [docs/releasing.md](docs/releasing.md): the maintainer release runbook —
  one-time npm org and token setup, publish order (`moca-sign` → `moca-lint` →
  `moca-convert`/`moca-index`, since they depend on each other), the
  tarball-install smoke test, dist-tag handling, npm provenance from CI,
  post-publish verification, and what to do instead of unpublishing. The stale
  checklist in `docs/versioning-and-release.md` now points at it, leaving that
  document to cover policy only.
- A `--version` flag on `moca-lint`, `moca-sign` and `moca-index`, which none
  of the CLIs previously had. `moca-convert` exposes it as `--cli-version`,
  because its `--version <semver>` already sets the *generated package's*
  version and redefining that would be a breaking CLI change.
- `moca-sign generate-key` now also emits `<prefix>.trust-root.json` and prints
  the sign/verify commands to run next. A `dsse` signature with no trust root
  is reported as `E406` rather than silently accepted, so a freshly signed
  package was unlintable until its author hand-wrote a trust-root file.

### Fixed

- Three broken relative links in the composition example packages, found by the
  new link checker: `examples/composition-members/module-{1,2}/content/` and
  `examples/composition-relates/document-prior/content/` linked to `../course`
  and `../document-current`, which resolve inside the module directory rather
  than beside it. Correcting the content changed those packages' bytes, so
  `canonicalDigest` was recomputed for both modules and then for the composing
  course package, which folds its members' digests transitively (core §5.5).
- Untracked `.DS_Store`, which had been committed to the repository.
- `tools/moca-index`'s tests hardcoded `examples/level-1-minimal`'s canonical
  digest, so they broke whenever that example changed. They now read the
  digest from the package at test time.
- `scripts/validate-examples.mjs` discovered packages with a single-level
  `readdir` over `examples/` plus a hardcoded tail list of nested paths, so it
  silently skipped any package nested more than one level deep — it missed all
  three new `examples/use-cases/` packages when they were added. It now uses
  recursive discovery, and covers 16 packages instead of 13.
- **The tool packages were unusable once installed.** Three separate places
  read files that a published tarball does not contain: `moca-lint`'s manifest
  pass and `moca-index`'s validator each read a schema from
  `../../schemas/`, and `moca-sign` re-exported `computeCanonicalDigest` from
  `../../../scripts/`. All three resolved correctly inside the workspace and
  threw `ERR_MODULE_NOT_FOUND`/`ENOENT` for anyone who installed the package.
  The schemas are now vendored into the packages that read them (with a CI
  drift check), and the digest implementation moved into `moca-sign`. Verified
  by packing all four tarballs, installing them into an empty project, and
  running convert → lint → keygen → sign → verify → index → pack → extract.
- `@openmoca/moca-index` imported `@openmoca/moca-sign` without declaring it as
  a dependency, resolving only because `@openmoca/moca-lint` happened to pull
  it in. npm's flat `node_modules` hides this; pnpm, Yarn PnP, and other strict
  installers would not. Added the declaration, plus
  `scripts/check-tool-deps.mjs` (`npm run validate:tool-deps`, wired into CI)
  to catch the class.

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

## [0.1.0-beta.1 development history]

The entries below predate the `0.1.0-beta.1` tag and record how that release was
assembled.

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
- `schemas/v1/core/moca.schema.json`: added `composition`, `validFrom`,
  `lastReviewed`, and `supersedes` manifest properties, and
  `compositionMember`/`compositionRelation` `$defs`.
- `schemas/v1/core/context.jsonld`: activated the previously-unused `prov:`
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
    non-production `dsse`-mode example key (`fixtures/signing-keys/`), updating each
    README's disclaimer accordingly; `npm run lint:moca` now passes
    `--trust-root` to verify them.

### Fixed

- `schemas/v1/core/context.jsonld`: fixed a pre-existing bug where `claims[]`'s
  `subject` and `predicate` terms were aliased directly to the `@id`
  keyword, colliding with the sibling `id` field and any other `@id`-aliased
  term on the same node (JSON-LD `colliding keywords` error). They now
  expand to dedicated `moca:claimSubject`/`moca:claimPredicate`/
  `moca:claimObject` predicates with `@type: @id`, discovered by the new
  `validate:jsonld` expansion check.

- `profiles/eu-ai-act/moca-eu-ai-act-profile.md` — MOCA EU AI Act compliance profile (beta), demonstrating how regulatory and compliance standards are modeled as ordinary MOCA profiles.
- `profiles/eu-ai-act/profile.schema.json` — JSON Schema for `profileData.euAiAct` with open-string classification fields.
- Example EU AI Act package under `profiles/eu-ai-act/examples/eu-ai-act-profile/` with profileData, governance ontology (SHACL), and human oversight content node.
- New subsection [core §11.5](spec/moca-core-spec.md#115-compliance--standards-profiles) documenting compliance and standards profiles, their relationship to the ordinary profile mechanism, and a reference table of candidate profiles (EU AI Act, NIST AI RMF, ISO/IEC 42001, etc.).
- Cross-reference updates: README.md Specification list, CONTRIBUTING.md compliance profile guidance, docs/quickstart.md "Going further" table.
