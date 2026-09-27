# MOCA — Modular Ontology & Content Assembly

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/status-beta-orange.svg)](#status)

**Portable, trustworthy knowledge for AI.** An open file format for the
knowledge your AI uses, one that keeps its sources, versions, and trust status
and survives a change of model, vendor, vector database, or framework.

## The problem

- **Knowledge in formats built for people** (wikis, PDFs, shared drives) has
  no stable IDs, sources, or review dates a machine can rely on. That context
  is lost at ingestion.
- **Knowledge in one runtime's store** (a vector index, a bespoke RAG
  pipeline) is tied to one model and one chunking strategy. Switching means
  rebuilding from scratch.
- So nobody can say where an answer came from, whether a human checked it, or
  whether it is still current.

## The solution: three pillars

MOCA makes the knowledge itself the durable asset, and splits the rest into
layers you can replace independently:

| Pillar | What it is | Openness |
|---|---|---|
| **1. MOCA Package** | A folder of Markdown plus a `moca.json` manifest, carrying identity, versions, sources, and trust status. Inert data. | Open standard — **this repository** |
| **2. Knowledge Harness** | One library interface for any AI to load, verify, and search packages, whether they sit in files, a local index, or an enterprise vector database. | Open source — .NET first, then Python, then TypeScript |
| **3. AI Harness** | Your product: agents, prompts, and workflow for one use case, built on the two open layers. | Yours |

```text
AI Harness  →  Knowledge Harness  →  MOCA package
(your app)     (finds, verifies,     (files, local index,
                cites knowledge)      or vector database)
```

Change the model and the package is untouched. Change the storage and your AI
Harness is untouched. → [Architecture](docs/architecture.md)

## Quick look

A complete, valid package is one manifest and one Markdown file:

```jsonc
// moca.json
{
  "id": "urn:moca:example:support-kb",
  "version": "4.2.0",
  "title": "Acme Support Knowledge Base"
}
```

```markdown
<!-- content/01-refund-window.md -->
---
id: urn:node:refund-window
epistemicStatus: verified
lastReviewed: "2026-08-14T00:00:00Z"
---
# Refund eligibility window

Customers may request a full refund within 30 days of delivery.
```

Every answer grounded in this node can say that it was human-verified, when it
was last checked, and which package version it came from.

## Get started

```sh
# Turn an existing folder of Markdown into a package
npx @openmoca/moca-convert ./docs -o my-package --id urn:moca:example:my-docs --title "My Docs"

# Validate it
npx @openmoca/moca-lint lint my-package
```

Then follow the [quickstart](docs/quickstart.md) (five minutes) or the
[end-to-end walkthrough](docs/walkthrough.md) (convert → sign → index → grounded
answer).

## Status

**Beta `0.1.0-beta.1`, experimental.** The format may change before `1.0.0`
as the Knowledge Harness implementations exercise it. See
[versioning and release](docs/versioning-and-release.md).

---

## In more detail

### What a package gives you

| Capability | What it means |
|---|---|
| Identity and versions | Package and node IDs that survive moves and re-indexing; `supersedes` retires older versions |
| Freshness | `validFrom` and `lastReviewed` on packages and nodes |
| Trust status | Per-node `epistemicStatus`: `verified`, `sourced`, `inferred`, `generated`, `disputed`, `deprecated` |
| Evidence | Claims point to their source, down to a page or timestamp (W3C PROV-O) |
| Integrity | Per-file SHA-256 digests and a reproducible `canonicalDigest` |
| Signing | Cryptographic signatures, mandatory for any package that ships `skills/` |
| Composition | Packages assembled from other packages without copying content |
| Profiles | Domain vocabulary (e.g. the EU AI Act) layered on without changing core |

All of it is optional except `id`, `version`, `title`, and some content. MOCA
Core is domain-agnostic: a support knowledge base, a legal corpus, an
engineering wiki, and a set of field-service manuals are all equally valid
uses. See [use cases](docs/use-cases.md).

### What MOCA is not

- **Not a retrieval engine.** The spec defines no search; that is the
  Knowledge Harness's job.
- **Not configuration.** `endpoints`, `settings`, `credentials`, and `apiKeys`
  are forbidden in a manifest. A package can never make your system call
  anything.
- **Not a database or an agent framework.** It is files, and it feeds whatever
  framework you already use.

→ [Why MOCA?](docs/why-moca.md) covers why not just use a folder of Markdown,
a vector database, or a fine-tune.

### The full stack

```text
┌──────────────────────────────────────────────────────────┐
│  Host application                                        │
│  identity · tenancy · PII redaction · access control     │
└────────────────────────────┬─────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────┐
│  3. AI Harness — the product, one per use case           │
│  agents · prompts · workflow · trust-signal policy       │
└────────────────────────────┬─────────────────────────────┘
                             │  asks for knowledge
                             ▼
┌──────────────────────────────────────────────────────────┐
│  2. Knowledge Harness — open source, shared              │
│  open · validate · verify · resolve · search · cite      │
└────────────────────────────┬─────────────────────────────┘
                             │  reads
                             ▼
┌──────────────────────────────────────────────────────────┐
│  1. MOCA Package — open standard, inert data             │
│  manifest · content · evidence · provenance · trust      │
└──────────────────────────────────────────────────────────┘
```

The host application above all three owns identity, tenancy, PII, and access
control. For the normative layer definitions see
[core §1.1](spec/moca-core-spec.md#11-the-three-pillar-architecture), and for
the reasoning see [ADR-0002](docs/adr/0002-three-pillar-architecture.md).

### Conformance levels

| Level | Name | Adds |
|---|---|---|
| **1** | Core | A `moca.json` manifest and CommonMark content. Readable with JSON and Markdown tooling only. **Most packages stop here.** |
| **2** | Semantic | JSON-LD `@context`, ontologies (`ontologies/`), SHACL validation; `claims` as RDF triples. |
| **3** | Extended | W3C Web Annotation locators and cryptographic signatures, **mandatory for any package with `skills/`**. |

The level is derived from what a package contains, never declared. See
[core §3](spec/moca-core-spec.md#3-conformance-levels) and
[choosing a level](docs/guides/choosing-a-level.md).

### Specification

The normative documents live under [spec/](spec):

- [MOCA Core Package Specification](spec/moca-core-spec.md)
- [MOCA SDK Contract](spec/moca-sdk-contract.md) — the Reader class every
  Knowledge Harness implements, and the Producer class for authoring tooling
- [MOCA Sidecar Index Specification](spec/moca-sidecar-index-spec.md)
- [MOCA Trust Model](spec/moca-trust-model.md)
- [MOCA EU AI Act Profile](profiles/eu-ai-act/moca-eu-ai-act-profile.md) —
  other profiles live in their own repositories; see [profiles/](profiles/README.md)

> **Note on `openmoca.org` URIs:** schema, profile, and vocabulary URIs (e.g.
> `https://openmoca.org/vocab/core#`) are stable identifiers, not necessarily
> live, resolvable locations yet — the domain is being acquired.

### Tooling

Four reference CLIs on npm under `@openmoca`. They are the Producer-class
authoring tooling, and each is versioned independently:

| Tool | Purpose |
|---|---|
| [`moca-convert`](tools/moca-convert/README.md) | Build Level 1 packages from Markdown, Obsidian, or OpenAPI |
| [`moca-lint`](tools/moca-lint/README.md) | Validate, pack, and extract packages |
| [`moca-index`](tools/moca-index/README.md) | Build optional `.moca.idx` search sidecars |
| [`moca-sign`](tools/moca-sign/README.md) | Sign and verify packages (Sigstore / DSSE) |

### Related projects

Built on this specification, each in its own repository
([ADR-0003](docs/adr/0003-knowledge-harness-implementations.md)):

| Project | Repository | Status |
|---|---|---|
| Knowledge Harness for .NET | `openmoca/moca-knowledge-harness-dotnet` | Planned — first |
| Knowledge Harness for Python | `openmoca/moca-knowledge-harness-python` | Planned — second |
| Knowledge Harness for TypeScript | `openmoca/moca-knowledge-harness-typescript` | Planned — third |
| MOCA MCP server | `openmoca/moca-integrations-mcp` | Planned — search and inspect packages from any MCP client |
| Education profile | `openmoca/moca-profile-education` | Graduated from this repository |

### Documentation

Full index: [docs/](docs/README.md).

| | |
|---|---|
| [Why MOCA?](docs/why-moca.md) | The problem, the non-goals, and the alternatives |
| [Architecture](docs/architecture.md) | The three pillars in full |
| [Use cases](docs/use-cases.md) | Concrete shapes, and how MOCA relates to RO-Crate, DITA, MCP |
| [Quickstart](docs/quickstart.md) | A valid package in five minutes |
| [End-to-end walkthrough](docs/walkthrough.md) | convert → sign → index → pack → grounded answer |
| [Choosing a level](docs/guides/choosing-a-level.md) | Which conformance level you actually need |
| [Authoring](docs/guides/authoring.md) | Grounding, lifecycle, integrity, composition |
| [Consuming a package](docs/guides/consuming.md) | What a Knowledge Harness does when it reads a package |
| [Signing and trust](docs/guides/signing-and-trust.md) | Signing, verification, the `skills/` boundary |
| [Search and indexes](docs/guides/search-and-indexes.md) | Knowledge Harness search modes and `.moca.idx` sidecars |

### Repository layout

```text
moca-spec/
├── spec/          # Normative specifications
├── schemas/       # JSON Schema + JSON-LD context definitions
├── profiles/      # Self-contained profile bundles (spec, schema, examples)
├── examples/      # Example packages, plus example .moca.idx sidecars
├── conformance/   # Language-neutral test corpus for SDKs and Knowledge Harnesses
├── fixtures/      # Test material that is not a package (e.g. example signing key)
├── tools/         # Reference CLIs: moca-lint, -convert, -index, -sign
├── scripts/       # Repository validation and maintenance scripts
└── docs/          # Non-normative guides
```

To work on this repository:

```sh
npm install
npm test        # all validators + all four tool suites
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose spec changes or new
profiles, and [GOVERNANCE.md](GOVERNANCE.md) for how decisions get made.

## License

[Apache License 2.0](LICENSE) for the specification prose and the reference
tooling alike. The §3 patent grant is deliberate: MOCA is meant to be
implemented independently, and implementers should not have to weigh patent
risk before adopting it. See [NOTICE](NOTICE).
