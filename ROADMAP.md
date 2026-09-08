# MOCA Roadmap

MOCA aims to make portable, grounded knowledge easy to create, validate, and
consume. The roadmap prioritises a low-barrier core format first, then adds
compliance, tooling, SDKs, search, and runtime integrations as opt-in
capabilities.

This file describes **direction**. What actually shipped, and when, is recorded
in [CHANGELOG.md](CHANGELOG.md); this document does not duplicate it.

## Delivered

| # | Item | Where it lives |
|---|---|---|
| 1 | **Core format and Level 1 adoption** — a valid `moca.json` plus CommonMark under `content/` is a useful package; everything else is additive. | [core §3](moca-core-spec.md#3-conformance-levels), [examples/level-1-bare](examples/level-1-bare) |
| 2 | **Core hardening** — lifecycle fields, a concrete PROV-O mapping for `claims[]`, and `composition` (`members`/`relates`). | [core §7.5](moca-core-spec.md#75-content-node-lifecycle-fields), [§7.4](moca-core-spec.md#74-explicit-claims-graph-claims), [§10](moca-core-spec.md#10-package-composition--relationships) |
| 3 | **Canonical package hashing** — a reproducible whole-package digest that folds composed members transitively. | [core §5.5](moca-core-spec.md#55-canonical-package-digest), `scripts/validate-canonical-digest.mjs` |
| 4 | **Sidecar index format** — the optional `.moca.idx` artifact for semantic or hybrid search. | [docs/sidecar-index-spec.md](docs/sidecar-index-spec.md), [schemas/core/sidecar-index.schema.json](schemas/core/sidecar-index.schema.json) |
| 5 | **CLI tooling** — `moca-lint` (lint/pack/extract), `moca-convert` (4 adapters), `moca-index` (build), each independently versioned with its own tests. | [tools/](tools/) |
| 6 | **Signature and trust infrastructure** — DSSE/Sigstore signing and verification, integrated into `moca-lint`'s security pass. | [docs/trust-model.md](docs/trust-model.md), [tools/moca-sign](tools/moca-sign/README.md) |

Partially delivered: **compliance and standards profiles** (item 11 below) — the
EU AI Act profile has shipped with its specification, schema, example package,
and SHACL governance shapes under [profiles/eu-ai-act/](profiles/eu-ai-act/).

## Now

### Documentation foundations

The specification is complete enough to implement against; the documentation is
not yet good enough to adopt from. This is the current bottleneck and it blocks
adoption more than any missing feature does.

- A "why MOCA" document: the problem, the non-goals, and what MOCA is *not* —
  the repository currently answers "what is this?" but not "why would I use it
  instead of a folder of Markdown, a vector database, or ad hoc RAG?"
- Consumer-side documentation. Every guide today is authoring-side (create,
  convert, lint, sign, index); nothing describes *reading* a package —
  resolving content and locales, following `composition.members`, deciding
  whether to trust `skills/`. This is the half developers need to build with
  MOCA, and it is the direct input to the SDK contract below.
- Use-case-shaped examples. Examples are currently named by conformance level,
  which is a specification author's taxonomy rather than a reader's.

### SDK contract and conformance suite

Both are prerequisites for item 7, not part of it. Three SDKs written against
an 888-line prose specification with no shared contract and no shared test
corpus will diverge, and the divergence will not surface until late.

- A language-neutral SDK contract document covering manifest parsing and
  creation, package reading/writing and archive handling, content traversal,
  profile and extension discovery, validation and structured diagnostics,
  identity and integrity, and optional index discovery.
- A declarative `conformance/` corpus — fixture packages paired with expected
  results and diagnostics, plus a documented runner contract — so each SDK's
  test suite is a thin adapter rather than a reimplementation.

## Next

### 7. Core SDKs across languages

TypeScript first, then Python, then .NET. TypeScript leads because the existing
toolchain is already JavaScript: `tools/moca-lint/lib/` already implements most
of the SDK surface (manifest parsing, package walking, path-boundary safety,
integrity and signature verification, structured diagnostics), and the other
CLIs already consume it. Extracting a real core library and refactoring the four
CLIs onto it validates the contract against four real consumers immediately.

Additional languages should be prioritised by adopter demand and ecosystem fit.

### 8. Generic AI harness

A reference consumer demonstrating that MOCA can be used without coupling the
format to a model provider or agent framework: loading a Level 1 package with no
index, discovering optional semantic data and skills, attaching an index when
search is wanted, grounding responses in content and evidence locators, and
degrading gracefully when optional capabilities are absent.

## Later

### 9. Framework and enterprise integration

LangChain and LlamaIndex adapters, an MCP server, Microsoft Agent Framework
support, and search-provider abstractions. **These live in their own
repositories** (see "Where this work lives" below).

This is also the point at which `moca-lint`'s known single-target-directory
limitation — no cycle or dangling-reference detection across `composition` —
should be closed with at least a minimal multi-package check.

### 10. Full end-to-end reference example

One authoritative demonstration connecting source material → validated package →
optional index → harness retrieval → framework-integrated consumption, with a
documented path proving the package still works when the index is removed. Its
own repository.

A reduced form of this — a single "load a package, answer a question with
evidence" walkthrough — is pulled forward into the documentation work under
"Now", because it is worth more for adoption than the third SDK.

### 11. Compliance and standards profiles

- A consistent profile registration and versioning model.
- Candidate profiles for NIST AI RMF, ISO/IEC 42001, ISO/IEC 23894, and OECD AI
  Principles, per [core §11.5](moca-core-spec.md#115-compliance--standards-profiles).
- Redesign the education profile's `Course`/`Module` shape around
  `composition.members`, replacing the flat `prerequisites` URN-array approach
  in [moca-education-profile.md §4](profiles/education/moca-education-profile.md).
- Generic courseware import tooling (SCORM/cmi5 → one package per module plus a
  composing package), superseding the per-module sidecar-augmentation workaround
  in [moca-education-profile.md §5](profiles/education/moca-education-profile.md).

### 12. Website

A public site for the project, specification, profiles, SDKs, tools, and
examples. The in-repository documentation under "Now" is the prerequisite and
does not wait for this.

### 13. Path to 1.0.0

Operationalises the stability commitments in
[docs/versioning-and-release.md](docs/versioning-and-release.md): an explicit
stability review of the specification, schemas, conformance levels, SDK
contracts, CLI behaviour, profiles, and trust model; published versioned
normative schemas; and a documented migration policy for breaking changes,
deprecations, and validation changes.

## Where this work lives

MOCA is developed as a single repository through `1.0.0`. The specification,
schemas, profiles, CLI tools, conformance corpus, and SDKs share one review
cycle and one CI run, because the SDKs are expected to *change the
specification* — [docs/versioning-and-release.md](docs/versioning-and-release.md)
says so explicitly — and splitting early turns each such finding into a
multi-repository coordination problem.

Components graduate to their own repositories on the same triggers already
defined for profiles in
[GOVERNANCE.md](GOVERNANCE.md#profile-graduation): an independent maintainer
group, a genuinely independent release cadence, or sheer size making the core
hard to navigate.

Two categories are **out of this repository from the start**, because they carry
third-party dependency surfaces and release cadences the specification should
not inherit: framework integrations (item 9) and the end-to-end demonstration
(item 10).

## Cross-cutting principles

- **Low entry bar:** Level 1 should solve a useful problem with minimal tooling.
- **Opt-in complexity:** semantic graphs, compliance profiles, indexes, skills,
  and framework integrations are additive.
- **Core/profile boundary:** profile-specific linting is out of scope for this
  repository's `moca-lint`; profile owners may ship separate tooling.
- **Portable core:** the format stays storage-, model-, and framework-neutral.
- **Integrity by design:** derived indexes must identify and bind to their
  source package.
- **Graceful degradation:** consumers retain useful behaviour when optional
  metadata, profiles, indexes, or integrations are unavailable.
- **Open implementation:** specifications, SDKs, tooling, examples, and tests
  are developed in the open with reproducible validation.
- **Cross-language consistency:** SDKs share conformance fixtures and
  behavioural expectations while remaining idiomatic in each language.

## Open decisions

- First supported embedding and storage backends for `.moca.idx` payloads.
- Release model and ownership for each SDK once more than one person maintains
  them.
- Scope of the first Microsoft Agent Framework integration.
- Which compliance profiles to prioritise after the profile registration model
  is defined.
