# MOCA Roadmap

MOCA aims to make portable, grounded knowledge easy to create, validate, and
consume. The roadmap prioritises a low-barrier core format first, then adds
compliance, tooling, Knowledge Harness implementations, search, and runtime
integrations as opt-in capabilities.

This file describes **direction**. What actually shipped, and when, is recorded
in [CHANGELOG.md](CHANGELOG.md); this document does not duplicate it.

## Delivered

| # | Item | Where it lives |
|---|---|---|
| 1 | **Core format and Level 1 adoption** — a valid `moca.json` plus CommonMark under `content/` is a useful package; everything else is additive. | [core §3](spec/moca-core-spec.md#3-conformance-levels), [examples/level-1-bare](examples/level-1-bare) |
| 2 | **Core hardening** — lifecycle fields, a concrete PROV-O mapping for `claims[]`, and `composition` (`members`/`relates`). | [core §7.5](spec/moca-core-spec.md#75-content-node-lifecycle-fields), [§7.4](spec/moca-core-spec.md#74-explicit-claims-graph-claims), [§10](spec/moca-core-spec.md#10-package-composition--relationships) |
| 3 | **Canonical package hashing** — a reproducible whole-package digest that folds composed members transitively. | [core §5.5](spec/moca-core-spec.md#55-canonical-package-digest), `scripts/validate-canonical-digest.mjs` |
| 4 | **Sidecar index format** — the optional `.moca.idx` artifact for semantic or hybrid search. | [spec/moca-sidecar-index-spec.md](spec/moca-sidecar-index-spec.md), [schemas/v1/core/sidecar-index.schema.json](schemas/v1/core/sidecar-index.schema.json) |
| 5 | **CLI tooling** — `moca-lint` (lint/pack/extract), `moca-convert` (4 adapters), `moca-index` (build), each independently versioned with its own tests. | [tools/](tools) |
| 6 | **Signature and trust infrastructure** — DSSE/Sigstore signing and verification, integrated into `moca-lint`'s security pass. | [spec/moca-trust-model.md](spec/moca-trust-model.md), [tools/moca-sign](tools/moca-sign/README.md) |

Partially delivered: **compliance and standards profiles** (item 12 below) — the
EU AI Act profile has shipped with its specification, schema, example package,
and SHACL governance shapes under [profiles/eu-ai-act/](profiles/eu-ai-act).

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
- An architecture overview of the three pillars — package, Knowledge Harness,
  AI Harness — so adopters can see where retrieval and product behaviour live.
- Use-case-shaped examples. Examples are currently named by conformance level,
  which is a specification author's taxonomy rather than a reader's.

### OKF conformance and the Core boundary

MOCA is not positioned against the formats it shares ground with. The Open
Knowledge Format v0.2, published by Google, occupies the same Markdown +
frontmatter territory as [core §7](spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators)
with considerably more weight behind it, and the specification does not mention
it. The working conclusion is that MOCA's content model was never its
differentiator — package and container semantics are — and the specification
should say so by conceding the content model rather than competing on it.

This sits ahead of the Knowledge Harness work deliberately. Three
implementations written against a core that is about to lose several §7 fields
is wasted implementation effort, tripled.

- `content/` becomes a **required** conformant OKF v0.2 bundle, enforced in CI,
  and the node frontmatter fields OKF already defines are deprecated in favour
  of OKF's spelling. Breaking; see [docs/plans/01-okf-v0.2-conformance.md](docs/plans/01-okf-v0.2-conformance.md).
- The Agent Skills vocabulary moves out of core into its own profile, while the
  signing obligation that a `skills/` directory carries stays in core. See
  [docs/plans/02-skills-to-agent-skills-profile.md](docs/plans/02-skills-to-agent-skills-profile.md).
- A MIF interoperability profile and a bidirectional converter, per
  [docs/plans/03-mif-interoperability.md](docs/plans/03-mif-interoperability.md).

All of it is gated on [ADR-0001](docs/adr/0001-moca-spec-vs-oci-artifacts.md),
which asks whether MOCA should be a specification at all or an OKF profile
shipped as OCI artifacts. If that answer is the latter, the work above narrows
considerably.

### SDK contract and conformance suite

First versions of both have shipped:
[spec/moca-sdk-contract.md](spec/moca-sdk-contract.md) and a 25-case
[`conformance/`](conformance/README.md) corpus. They are what keeps item 7's
implementations consistent across languages and repositories, so the
remaining work sits ahead of item 7:

- The contract's **Reader / Producer split**
  ([ADR-0003](docs/adr/0003-knowledge-harness-implementations.md)). The Reader
  class is what every Knowledge Harness implements: open, validate, traverse,
  diagnose, verify, resolve composition, discover profiles, bind an index.
  The Producer class adds manifest creation, integrity production, archive
  writing, signing, and index building, which is authoring tooling. A consumer
  that only reads and searches never takes on authoring dependencies.
- The corpus's known gaps: locale-resolution fallback, composition cycle
  detection, archive-extraction hardening, and sidecar binding.

## Next

### 7. Knowledge Harness implementations

The Knowledge Harness is the second of MOCA's
[three pillars](docs/architecture.md): an open-source engine that gives any AI
Harness one interface to MOCA knowledge, wherever that knowledge is stored.
Each implementation is a Reader-class SDK plus retrieval, in its own
repository, in this order:

1. **.NET** — `openmoca/moca-knowledge-harness-dotnet`
2. **Python** — `openmoca/moca-knowledge-harness-python`
3. **TypeScript** — `openmoca/moca-knowledge-harness-typescript`

.NET leads because it is what the first AI Harness hosts use, and an
implementation with a real consumer is the one that tests the specification.
Each implementation offers the same three search modes behind one interface —
lexical search over the package, a `.moca.idx` sidecar, and an enterprise
vector database — with ontology-aware query expansion and result traversal
when a package carries ontologies. See
[search and indexes](docs/guides/search-and-indexes.md#search-modes-in-the-knowledge-harness).

The TypeScript library inside `tools/moca-lint/lib/` stays the reference
Producer implementation and an internal library of the CLIs. It is not
extracted into a published SDK ahead of the TypeScript Knowledge Harness.

Specification findings from each implementation come back to this
repository as issues.

### 8. Reference AI Harness

A minimal, domain-neutral AI Harness built on the .NET Knowledge Harness. It
shows that MOCA can be used without coupling the format to a model provider or
agent framework: loading a Level 1 package with no index, discovering optional
semantic data and skills, attaching an index when search is wanted, grounding
answers in content and evidence locators, applying a policy to `verified`,
`disputed`, and stale content, and degrading gracefully when optional
capabilities are absent.

It also carries a second job. The Knowledge Harness **instruments every
manifest and frontmatter field it reads at runtime** and emits a coverage
report. Any field never touched after a full run against a real package is a
concrete deletion-or-demotion candidate, which turns the core-boundary
question from an argument into a measurement. The report distinguishes "not
read, but the code path ran" from "no code path exercised this capability" —
only the first is evidence.

This runs alongside item 9, which supplies its input.

### 9. Core boundary audit

The reference AI Harness from item 8, run end to end against real, openly
licensed, multi-part content rather than fixtures: a documentation corpus
converted with `moca-convert` and composed with
[`composition.members`](spec/moca-core-spec.md#101-compositionmembers--containment-part-of),
plus a versioned policy set that exercises `composition.relates` and
`supersedes`. It is also the first end-to-end proof MOCA has, and it exercises
the multi-package canonical digest path against generated content for the
first time.

The untouched-field report becomes spec change proposals. Plan:
[docs/plans/04-reference-consumer-core-audit.md](docs/plans/04-reference-consumer-core-audit.md).

## Later

### 10. Framework and enterprise integration

The **MOCA MCP server**, which loads packages through the Knowledge Harness so
developers can search, inspect, and validate them from any MCP client, locally.
LangChain, LlamaIndex, and Microsoft Agent Framework adapters, and enterprise
vector-store backends for the Knowledge Harness. **These live in their own
repositories** (see "Where this work lives" below).

This is also the point at which `moca-lint`'s known single-target-directory
limitation — no cycle or dangling-reference detection across `composition` —
should be closed with at least a minimal multi-package check.

### 11. Full end-to-end reference example

One authoritative demonstration connecting source material → validated package →
optional index → Knowledge Harness retrieval → AI Harness answer, with a
documented path proving the package still works when the index is removed. Its
own repository.

A reduced form of this — a single "load a package, answer a question with
evidence" walkthrough — is pulled forward into the documentation work under
"Now", because it is worth more for adoption than any single implementation.

### 12. Compliance and standards profiles

- A consistent profile registration and versioning model, covering profiles
  in this repository and graduated ones (the education profile now lives in
  `openmoca/moca-profile-education`).
- Candidate profiles for NIST AI RMF, ISO/IEC 42001, ISO/IEC 23894, and OECD AI
  Principles, per [core §11.5](spec/moca-core-spec.md#115-compliance--standards-profiles).
- The `agent-skills` and `mif` profiles, which are not compliance profiles but
  share the same registration and versioning question.

### 13. Website

A public site for the project, specification, profiles, Knowledge Harness
implementations, tools, and examples. The in-repository documentation under
"Now" is the prerequisite and does not wait for this.

### 14. Path to 1.0.0

Operationalises the stability commitments in
[docs/versioning-and-release.md](docs/versioning-and-release.md): an explicit
stability review of the specification, schemas, conformance levels, the SDK
contract's two classes, CLI behaviour, profiles, and trust model; published
versioned normative schemas; and a documented migration policy for breaking
changes, deprecations, and validation changes.

## Where this work lives

The specification, schemas, in-repository profiles, Producer-class CLI tools,
and the conformance corpus share one repository, one review cycle, and one CI
run through `1.0.0`.

Components graduate to their own repositories on the same triggers already
defined for profiles in
[GOVERNANCE.md](GOVERNANCE.md#profile-graduation): an independent maintainer
group, a genuinely independent release cadence, or sheer size making the core
hard to navigate. The education profile has graduated on those terms.

Three categories are **out of this repository from the start**, because they
carry third-party dependency surfaces and release cadences the specification
should not inherit:

- **Knowledge Harness implementations** (item 7), one repository per language.
  They consume the conformance corpus from here and never vendor it.
- **Framework integrations and the MCP server** (item 10).
- **The reference AI Harness and the end-to-end demonstration** (items 8 and
  11). Only the instrumentation report and the spec change proposals it
  produces come back into this repository.

## Cross-cutting principles

- **Low entry bar:** Level 1 should solve a useful problem with minimal tooling.
- **Opt-in complexity:** semantic graphs, compliance profiles, indexes, skills,
  and framework integrations are additive.
- **Core/profile boundary:** profile-specific linting is out of scope for this
  repository's `moca-lint`; profile owners may ship separate tooling.
- **Portable core:** the format stays storage-, model-, and framework-neutral.
- **Retrieval outside the format:** search belongs to the Knowledge Harness;
  the specification defines no retrieval engine.
- **Integrity by design:** derived indexes must identify and bind to their
  source package.
- **Graceful degradation:** consumers retain useful behaviour when optional
  metadata, profiles, indexes, or integrations are unavailable.
- **Open implementation:** specifications, Knowledge Harness implementations,
  tooling, examples, and tests are developed in the open with reproducible
  validation.
- **Cross-language consistency:** Knowledge Harness implementations share
  conformance fixtures and behavioural expectations while remaining idiomatic
  in each language.

## Open decisions

- Whether MOCA should remain a standalone package specification, or become an
  OKF profile shipped as OCI artifacts with cosign signing and image-index
  composition. [ADR-0001](docs/adr/0001-moca-spec-vs-oci-artifacts.md) proposes
  a hybrid and states what would falsify it; it gates the "Now" work above.
- Whether `epistemicStatus` ([core §7.2](spec/moca-core-spec.md#72-core-epistemic-status-vocabulary))
  survives OKF conformance. OKF's `verified` and `status` cover two of its six
  values; `disputed` has no OKF equivalent and is depended on by
  [§10.2](spec/moca-core-spec.md#102-compositionrelates--loose-reference-relates-to).
- Whether MOCA continues to define a content model at all once item 9's
  instrumentation reports which fields a real consumer reads.
- First supported embedding models and storage backends for `.moca.idx`
  payloads and for the Knowledge Harness's enterprise search mode.
- Whether and when the .NET repository adds Producer-class packages alongside
  its Reader.
- Release model and ownership for each Knowledge Harness implementation once
  more than one person maintains them.
- Scope of the first Microsoft Agent Framework integration.
- Which compliance profiles to prioritise after the profile registration model
  is defined.
