# MOCA Roadmap

Status: Proposed

MOCA is intended to make portable, grounded knowledge easy to create, validate,
and consume. The roadmap prioritizes a low-barrier core format first, then adds
compliance, tooling, SDKs, search, and runtime integrations as opt-in
capabilities.

## Delivery Order

### 1. Core Format and Level 1 Adoption

Make Level 1 the primary use case for MOCA and keep its entry bar deliberately
low.

- Update the core specification so a valid `moca.json` and CommonMark content
  under `content/` are sufficient for a useful Level 1 package.
- Keep frontmatter, ontologies, claims, profiles, signatures, embeddings, and
  indexes as optional extensions unless a higher conformance level requires
  them.
- Preserve MOCA's runtime independence: packages must not require a model,
  vector database, hosted service, credentials, or agent framework.
- Provide a clear upgrade path from Level 1 to semantic and extended features.
- Align the schema, examples, validator behavior, quickstart, and contribution
  guidance with the revised Level 1 boundary.

**Outcome:** A developer can create and consume a useful MOCA package with
ordinary JSON and Markdown tooling.

**Outcome — Status: Complete.** The Level 1 specification, schema, bare and
grounded examples, quickstart, and CI validation are in place.

### 2. Core Hardening: Lifecycle, Provenance & Composition

Close three open, generic gaps in the core manifest and content-node model
before building higher-level capabilities on top of them. All three are
additive vocabulary or mechanisms with no domain-specific content, and are
intended to land in one review cycle since they touch overlapping manifest
sections:

- Optional lifecycle fields (`validFrom`, `lastReviewed`, `supersedes`) for
  manifests and content nodes — see
  [issue-drafts/ISSUE-DRAFT-lifecycle.md](issue-drafts/ISSUE-DRAFT-lifecycle.md).
- A concrete PROV-O mapping for `claims[]`, closing the gap between the
  standards-alignment table (core §2) and the Level 2 requirement that
  evidence resolves against PROV-O records — see
  [issue-drafts/ISSUE-DRAFT-provenance.md](issue-drafts/ISSUE-DRAFT-provenance.md).
- A `composition` mechanism (`members`/`relates`) letting one package
  reference others, either as containment ("part-of") or loose,
  non-hierarchical reference — see
  [issue-drafts/ISSUE-DRAFT-composition.md](issue-drafts/ISSUE-DRAFT-composition.md).

Lifecycle fields and the PROV-O mapping are low-risk additive vocabulary and
can merge independently of composition if reviewers want more time on
composition's larger surface area (it also amends the Level 1 floor to allow
composition-only packages).

**Outcome:** Any package, regardless of domain, can express freshness,
lineage, claim provenance, and cross-package structure using one shared,
domain-agnostic vocabulary instead of ad hoc `profileData` conventions.

**Outcome — Status: Complete.** All three issue-drafts are merged: lifecycle
fields, the PROV-O claims mapping, and `composition` (`members`/`relates`)
are specified in core §7.5/§7.4/§10, implemented in the manifest schema and
JSON-LD context, demonstrated across five new example packages, and covered
by CI (including a `validate:jsonld` expansion check proving the JSON-LD
context resolves correctly, not just parses as valid JSON).

### 3. Canonical Package Hashing

Define a canonical whole-package digest scheme, gated on item 2's
`composition` shape being merged and stable, not merely proposed — a
composed package's identity plausibly depends on its members' digests
transitively, and designing the digest scheme before that shape settles
risks retrofitting it later. See
[issue-drafts/ISSUE-DRAFT-canonical-hashing.md](issue-drafts/ISSUE-DRAFT-canonical-hashing.md).

- Define a `canonicalDigest` recomputed from resource file bytes on disk,
  independently of declared `integrity` entries, using RFC 8785 canonicalization
  for the manifest and assembled digest inputs.
- Define how a composed package's digest folds in its `composition.members`
  digests transitively, using resolved concrete member versions and excluding
  `composition.relates` and member ordering. Reproducibility depends on
  implementations performing identical member resolution; different registries
  or resolution strategies MAY produce different digests for the same manifest.
- Update the [MOCA Sidecar Index Specification](docs/sidecar-index-spec.md)'s
  optional target binding to allow binding against the new canonical digest
  in addition to per-file hashes.

**Outcome — Status: Complete.** `canonicalDigest` is specified in core §5.5,
implemented in the core schema and JSON-LD context, validated by
`scripts/validate-canonical-digest.mjs` in CI, demonstrated by the annotated
Level 1 and composition-members examples, and supported by sidecar target
binding in [docs/sidecar-index-spec.md](docs/sidecar-index-spec.md) §4.

### 4. MOCA Index and Optional Search

Define an optional `.moca.idx` artifact for consumers that want semantic or
hybrid search.

The index should contain the versioned `index.json` manifest and associated
embedding or search payload. The adopted
[MOCA Sidecar Index Specification](docs/sidecar-index-spec.md) defines the
portable manifest, optional SHA-256 target binding, and required per-item
content-path and chunk addressing while keeping payload storage open-ended.

Design principles:

- A `.moca` package remains complete, usable, and queryable without a sidecar
  index.
- Embeddings are optional derived data and are not required in the base package.
- Index storage must remain separable from the core package and its manifest.
- Consumers SHOULD verify a declared target hash before selecting an index.
- The format should allow local files, packaged sidecars, and external index
  providers without prescribing one vector database.

**Outcome:** Search can be added when useful without raising the entry bar or
polluting the portable core format with runtime retrieval configuration.

### 5. Open Source CLI Application and Developer Tooling

Develop an open-source CLI application that supports the complete package
lifecycle while keeping individual commands composable.

Planned capabilities include:

- `moca-convert` to create Level 1 packages from directories, Markdown sources,
  Obsidian vaults, and suitable OpenAPI inputs.
- `moca-pack` or equivalent archive creation and extraction workflows.
- `moca-index` to generate optional search indexes and associated embeddings.
- Machine-readable output for CI, JSON, SARIF, and human-readable reports.
- Deterministic behavior where practical, clear error messages, and fail-closed
  behavior for invalid packages.
- Cross-platform installation, versioned command behavior, and documented exit
  codes.

#### moca-lint Validation Contract

Treat `moca-lint` as an independently versioned validation contract within the
CLI ecosystem.

- Define which schema, package-boundary, integrity, profile, and conformance
  checks are normative for each release.
- Treat schema or lint errors that allow invalid manifests to pass as
  security-sensitive issues, consistent with [SECURITY.md](SECURITY.md).
- Track contract changes explicitly in [CHANGELOG.md](CHANGELOG.md), including
  the existing change that removed profile-owned `profileData` validation and
  added path-boundary checks.
- Keep profile-specific linting out of this repository's core linter; profile
  owners may provide separate validation tooling as documented in
  [profiles/README.md](profiles/README.md).
- Publish compatibility fixtures and migration notes when validation behavior
  changes.

**Outcome:** Developers can create, inspect, validate, package, and prepare
MOCA assets from a documented open-source command line.

### 6. Signature & Trust Infrastructure

Establish the signing and verification path required for packages containing
`skills/`.

- Provide reference Sigstore/DSSE signing and verification tooling.
- Document the key, certificate, identity, and signer trust model for package
  authors and consumers.
- Integrate signature verification into `moca-lint` and expose actionable
  diagnostics for unsigned, malformed, or unverifiable skill-bearing packages.
- Define offline and online verification behavior, including how trust roots,
  identity constraints, and revocation information are handled.
- Add conformance fixtures for valid, invalid, missing, and placeholder
  signatures.

This work operationalizes [core §8.2](moca-core-spec.md#82-security--trust-boundary-rule)
and [core §3.1](moca-core-spec.md#31-level-requirement-clarification), which
make signatures mandatory for any package containing `skills/`. The current
skill-bearing examples (`examples/level-3-extended`,
`profiles/education/examples/education-profile`, and
`profiles/eu-ai-act/examples/eu-ai-act-profile`) ship only placeholder
signatures, as explained in their README disclaimers. This is currently a
specification requirement without an implementation path.

**Outcome:** Hosts can make a defensible trust decision before loading or
executing skill content.

### 7. Core SDKs Across Languages

Define and implement a language-neutral core SDK contract so applications do not
need to manipulate package files directly.

Initial SDK targets:

- JavaScript/TypeScript.
- Python.
- .NET/C#.

The SDK contract should cover:

- Manifest parsing and creation.
- Package reading, writing, and archive handling.
- CommonMark content traversal.
- Profile and extension discovery.
- Core validation and structured diagnostics.
- Package identity and integrity handling.
- Optional index discovery without making indexes mandatory.
- Consistent behavior and conformance tests across languages.

Additional languages should be prioritized by adopter demand and ecosystem fit.

**Outcome:** Applications can integrate MOCA through stable, idiomatic libraries
while sharing one format contract and cross-language test suite.

### 8. Generic AI Harness

Provide a reference generic AI harness that demonstrates how MOCA can be
consumed without coupling the package format to a single model provider or agent
framework.

The harness should demonstrate:

- Loading a Level 1 package with no index attached.
- Discovering optional semantic data, profiles, and skills.
- Attaching an optional MOCA Index when search is desired.
- Combining lexical, semantic, and graph-aware retrieval where available.
- Grounding generated responses in package content and evidence locators.
- Enforcing package, profile, skill, and integrity policies.
- Clear behavior when optional capabilities are absent or unsupported.

**Outcome:** MOCA has a neutral reference consumer that illustrates graceful
degradation from simple content access to richer retrieval and reasoning.

### 9. Framework and Enterprise Integration

Connect MOCA to commonly used agent frameworks and enterprise hosting patterns.

Priority integrations include:

- Microsoft Agent Framework, with first-class .NET support through the .NET SDK.
- LangChain adapters.
- LlamaIndex adapters.
- MCP integration through `moca-mcp` or an equivalent server package,
  including a reference demonstration of a harness resolving a composed
  package's `composition.members` through MCP resource listing. This is the
  point at which `moca-lint`'s known single-target-directory limitation
  (no cycle or dangling-reference detection across `composition`) should be
  closed with at least a minimal multi-package check, not left as a
  documented gap indefinitely.
- External vector and search providers through an abstraction such as
  `ISearchIndexProvider`.
- Enterprise identity, policy, observability, tenancy, and storage boundaries
  at the host layer rather than in the MOCA package itself.

Each integration should preserve the same package semantics and clearly separate
MOCA data, harness behavior, and host security policy.

**Outcome:** MOCA can participate in existing AI application ecosystems without
making any one framework part of the core specification.

### 10. Full End-to-End Reference Example

Deliver a complete, runnable example that connects all major roadmap outputs.
The example should include:

- A Level 1 MOCA package created from source content.
- An optional compliance or standards profile.
- Validation and packaging through the CLI application.
- Consumption through at least one core SDK.
- A generated `.moca.idx` with associated embeddings.
- Retrieval through the generic AI harness.
- An adapter for one framework, with Microsoft Agent Framework and .NET as a
  priority path.
- Evidence-grounded response generation.
- A documented path showing that the same package still works when the index is
  removed.
- Automated tests and instructions that work from a clean checkout.

**Outcome:** Users and contributors have one authoritative demonstration of how
MOCA moves from source material to validated package, optional search, and
framework-integrated AI consumption.

### 11. Compliance and Standards Profiles

Partially delivered: the EU AI Act profile has shipped with its specification,
schema, example package, and SHACL governance shapes under
[profiles/eu-ai-act/](profiles/eu-ai-act/). The remaining roadmap work is to
extend the profile ecosystem without burdening Level 1 packages.

- Define a consistent profile registration and versioning model.
- Document how profiles add vocabulary, validation rules, provenance, evidence,
  governance, and conformance requirements.
- Add candidate profiles for NIST AI RMF, ISO/IEC 42001, ISO/IEC 23894, and
  OECD AI Principles, as listed in [core §11.5](moca-core-spec.md#115-compliance--standards-profiles).
- Add standards alignment for relevant areas including JSON-LD, RDF, SHACL,
  W3C Web Annotation, PROV-O, RO-Crate, and Agent Skills.
- Make profile requirements explicit, testable, and independently distributable.
- Define how unknown profiles degrade gracefully while preserving core package
  usability.
- Once item 2's `composition` mechanism ships, redesign the education
  profile's `Course`/`Module` shape as ordinary MOCA packages linked via
  `composition.members`, replacing the current flat `prerequisites`
  URN-array approach in
  [moca-education-profile.md §4](profiles/education/moca-education-profile.md).
- Add generic courseware/legacy-format import tooling that converts existing
  SCORM/cmi5 packages into MOCA packages, emitting one package per module
  plus a composing package using item 2's `composition` primitive — this
  supersedes the current per-module sidecar-augmentation workaround noted in
  [moca-education-profile.md §5](profiles/education/moca-education-profile.md).
  Framed generically: this is import tooling for any structured
  multi-part courseware standard, not a single-vendor integration.

**Outcome:** Compliance and standards support is composable, auditable, and
separate from the minimum MOCA package contract.

### 12. Website and Documentation

Create a public-facing information and learning experience that makes MOCA
understandable before developers need to inspect the specification.

- Foundational documentation should track the timeline of item 1; it should
  not wait for a complete public website. The existing
  [docs/quickstart.md](docs/quickstart.md) is the starting point.
- Build a website for the project, specification, profiles, SDKs, tools, and
  examples.
- Publish a short Level 1 quickstart and progressively deeper guides.
- Provide reference documentation for manifests, package structure, profiles,
  indexes, SDK APIs, and CLI commands.
- Publish compatibility matrices, conformance guidance, security boundaries,
  and standards mappings.
- Include runnable examples and a clear path from first package to production
  integration.
- Document project governance, contribution, release, and compatibility policy.

**Outcome:** New users can understand MOCA, create a package, and find the
correct implementation guidance without needing private project context.

### 13. Path to 1.0.0

Operationalize the stability commitments already described in
[docs/versioning-and-release.md](docs/versioning-and-release.md).

- Conduct an explicit stability review of the core specification, schemas,
  conformance levels, SDK contracts, CLI behavior, profiles, and trust model.
- Publish versioned normative schemas and identify which schemas are
  compatibility commitments.
- Define and document the migration policy for breaking changes, deprecated
  fields, validation changes, profile versions, and index versions.
- Record the review outcome, unresolved compatibility risks, and required
  migration tooling before declaring `1.0.0`.

**Outcome:** MOCA reaches `1.0.0` with explicit compatibility expectations,
versioned normative artifacts, and a documented path for existing packages and
implementations to migrate.

## Cross-Cutting Principles

- **Low entry bar:** Level 1 should solve a useful problem with minimal tooling.
- **Opt-in complexity:** Semantic graphs, compliance profiles, indexes, skills,
  and framework integrations should be additive.
- **Core/profile boundary:** Profile-specific linting is intentionally out of
  scope for this repository's `moca-lint`; profile owners may ship separate
  validation tooling.
- **Portable core:** The package format must remain storage-, model-, and
  framework-neutral.
- **Integrity by design:** Derived indexes must identify and bind to their source
  package.
- **Graceful degradation:** Consumers should retain useful behavior when
  optional metadata, profiles, indexes, or integrations are unavailable.
- **Open implementation:** Specifications, SDKs, tooling, examples, and tests
  should be developed in the open with reproducible validation.
- **Cross-language consistency:** SDKs should share conformance fixtures and
  behavioral expectations while remaining idiomatic in each language.

## Initial Open Decisions

- Exact Level 1 content and frontmatter requirements.
- Distribution format for `.moca.idx` sidecars.
- First supported embedding and storage backends.
- Initial ownership and release model for each SDK and CLI.
- Scope of the first Microsoft Agent Framework integration.
- Compliance profiles to prioritize after the core profile contract.
