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

### 2. Compliance and Standards Profiles

Establish profiles that extend the core format for regulated, standards-driven,
and domain-specific use cases without burdening Level 1 packages.

- Define a consistent profile registration and versioning model.
- Document how profiles add vocabulary, validation rules, provenance, evidence,
  governance, and conformance requirements.
- Prioritize compliance profiles such as EU AI Act governance and oversight.
- Add standards alignment for relevant areas including JSON-LD, RDF, SHACL,
  W3C Web Annotation, PROV-O, RO-Crate, and Agent Skills.
- Make profile requirements explicit, testable, and independently distributable.
- Define how unknown profiles degrade gracefully while preserving core package
  usability.

**Outcome:** Compliance and standards support is composable, auditable, and
separate from the minimum MOCA package contract.

### 3. Website and Documentation

Create a public-facing information and learning experience that makes MOCA
understandable before developers need to inspect the specification.

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

### 4. Open Source CLI Application and Developer Tooling

Develop an open-source CLI application that supports the complete package
lifecycle while keeping individual commands composable.

Planned capabilities include:

- `moca-convert` to create Level 1 packages from directories, Markdown sources,
  Obsidian vaults, and suitable OpenAPI inputs.
- `moca-lint` to validate manifests, package structure, profiles, references,
  integrity metadata, and supported conformance requirements.
- `moca-pack` or equivalent archive creation and extraction workflows.
- `moca-index` to generate optional search indexes and associated embeddings.
- Machine-readable output for CI, JSON, SARIF, and human-readable reports.
- Deterministic behavior where practical, clear error messages, and fail-closed
  behavior for invalid packages.
- Cross-platform installation, versioned command behavior, and documented exit
  codes.

**Outcome:** Developers can create, inspect, validate, package, and prepare
MOCA assets from a documented open-source command line.

### 5. Core SDKs Across Languages

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

### 6. Generic AI Harness

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

### 7. MOCA Index and Optional Search

Define an optional `.moca.idx` artifact for consumers that want semantic or
hybrid search.

The index should contain a versioned index manifest and associated embedding or
search data. The manifest should define, at minimum:

- Index manifest version.
- Target package identifier.
- Target package hash.
- Index type, such as dense vector, sparse BM25, or hybrid.
- Embedding model and preprocessing metadata.
- Content or node identity for each indexed item.
- Vector dimensions and distance metric where applicable.
- Storage format and compatibility information.
- Reproducibility and regeneration metadata.

Design principles:

- A `.moca` package remains complete, usable, and queryable without a sidecar
  index.
- Embeddings are optional derived data and are not required in the base package.
- Index storage must remain separable from the core package and its manifest.
- Consumers may select an index only when its target identity and hash match.
- The format should allow local files, packaged sidecars, and external index
  providers without prescribing one vector database.

**Outcome:** Search can be added when useful without raising the entry bar or
polluting the portable core format with runtime retrieval configuration.

### 8. Framework and Enterprise Integration

Connect MOCA to commonly used agent frameworks and enterprise hosting patterns.

Priority integrations include:

- Microsoft Agent Framework, with first-class .NET support through the .NET SDK.
- LangChain adapters.
- LlamaIndex adapters.
- MCP integration through `moca-mcp` or an equivalent server package.
- External vector and search providers through an abstraction such as
  `ISearchIndexProvider`.
- Enterprise identity, policy, observability, tenancy, and storage boundaries
  at the host layer rather than in the MOCA package itself.

Each integration should preserve the same package semantics and clearly separate
MOCA data, harness behavior, and host security policy.

**Outcome:** MOCA can participate in existing AI application ecosystems without
making any one framework part of the core specification.

### 9. Full End-to-End Reference Example

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

## Cross-Cutting Principles

- **Low entry bar:** Level 1 should solve a useful problem with minimal tooling.
- **Opt-in complexity:** Semantic graphs, compliance profiles, indexes, skills,
  and framework integrations should be additive.
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
- Canonical package hashing for index binding.
- Distribution format for `.moca.idx` sidecars.
- First supported embedding and storage backends.
- Initial ownership and release model for each SDK and CLI.
- Scope of the first Microsoft Agent Framework integration.
- Compliance profiles to prioritize after the core profile contract.
