# MOCA — Modular Ontology & Content Assembly

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/status-beta-orange.svg)](#status)

**A portable file format for knowledge you want an AI system to use — one
that stays useful after you change model, vendor, vector database, or
framework.**

Knowledge that feeds AI systems usually lives either in formats built for
people (a wiki, a folder of PDFs) that carry no provenance, freshness, or
identity a machine can rely on — or inside one runtime's own store (a vector
index, a bespoke RAG pipeline) where the structure belongs to the tool and
dies with it. Either way the knowledge is never the durable asset; the
pipeline is, and pipelines get replaced.

A MOCA package is a directory with a `moca.json` manifest and CommonMark files
under `content/`. That is the whole of Level 1, readable with `JSON.parse` and
any Markdown library. On top of that it standardises the things a consumer
actually needs and normally has to invent: stable identity, content
versioning, freshness (`lastReviewed`), provenance and evidence, per-node
epistemic status, integrity digests, composition between packages, and a
cryptographic trust boundary around executable content.

MOCA Core is domain-agnostic — a customer-support knowledge base, a legal
research corpus, an internal engineering wiki, and a library of field-service
manuals are all equally valid uses. Domain-specific vocabulary lives in **profiles**
layered on top of core.

The specification is **not** a retrieval engine, a runtime, an agent
framework, or a database. A package cannot configure your system: `endpoints`,
`settings`, `credentials`, and `apiKeys` are forbidden in a manifest, at every
level. Retrieval lives in the **Knowledge Harness**, a separate open-source
project built on this specification (see below).

→ [Why MOCA?](docs/why-moca.md) for the longer argument, including why not to
just use a folder of Markdown or a vector database.

## Quick look

```jsonc
// moca.json — a complete, valid package manifest
{
  "id": "urn:moca:example:support-kb",
  "version": "4.2.0",
  "title": "Acme Support Knowledge Base",
  "lastReviewed": "2026-08-14T00:00:00Z"
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

An AI reading this through a Knowledge Harness knows the answer was
human-verified, when it was last checked, and which package and version it
came from — none of which survives ingestion from an ordinary wiki.

## Status

**Beta `0.1.0-beta.1` — pre-`1.0.0`, experimental.** The specification,
schemas, and examples here are subject to change as the Knowledge Harness
implementations exercise the format. There is no stable release or compatibility guarantee yet. See
[Versioning and Release](docs/versioning-and-release.md).

> **Note on `openmoca.org` URIs:** Schema, profile, and vocabulary URIs used
> throughout (e.g. `https://openmoca.org/vocab/core#`) are stable
> identifiers, not necessarily live, resolvable network locations at this
> stage — the domain is in the process of being acquired.

## The three pillars

MOCA splits an AI knowledge system into three layers, each open in a
different way. Any layer can be replaced without touching the others.

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

| Pillar | What it owns | Openness |
|---|---|---|
| **1. MOCA Package** | Content, identity, provenance, trust metadata | Open standard — this repository |
| **2. Knowledge Harness** | One interface for loading, validating, and searching packages, whether they sit in files, a `.moca.idx` sidecar, or an enterprise vector database | Open source, one repository per language |
| **3. AI Harness** | Agents, prompts, workflow, and experience for one use case | Your product |

This repository defines the package and the contract a Knowledge Harness
implements. See [Architecture](docs/architecture.md) for the full model,
[core §1.1](spec/moca-core-spec.md#11-the-three-pillar-architecture) for the
normative layer definitions, and
[ADR-0002](docs/adr/0002-three-pillar-architecture.md) for why.

## Conformance Levels

| Level | Name | Requirements |
|---|---|---|
| **1** | MOCA Core | Valid `moca.json` root manifest. Grounded CommonMark knowledge nodes (`content/`) bound to concepts via YAML frontmatter. Parseable with standard JSON + Markdown tooling only. |
| **2** | MOCA Semantic | Adds JSON-LD `@context`, formal ontologies (`ontologies/`), SHACL shape validation. `claims` interpretable as RDF triples. |
| **3** | MOCA Extended | Adds W3C Web Annotation locators. Cryptographic signatures — **mandatory for any package containing `skills/`**. Optional Agent Skills. |

See [moca-core-spec.md §3](spec/moca-core-spec.md#3-conformance-levels) for full
details.

## Specification

The normative documents all live under [spec/](spec):

- [MOCA Core Package Specification](spec/moca-core-spec.md)
- [MOCA SDK Contract](spec/moca-sdk-contract.md) — the Reader class every
  Knowledge Harness implements, and the Producer class for authoring tooling
- [MOCA Sidecar Index Specification](spec/moca-sidecar-index-spec.md)
- [MOCA Trust Model](spec/moca-trust-model.md)

Profile specifications live with their schema and examples:

- [MOCA EU AI Act Profile](profiles/eu-ai-act/moca-eu-ai-act-profile.md)

Other profiles live in their own repositories; see [profiles/](profiles/README.md).

## Repository Layout

```text
moca-spec/
├── spec/                   # Normative specifications
│   ├── moca-core-spec.md
│   ├── moca-sdk-contract.md
│   ├── moca-sidecar-index-spec.md
│   └── moca-trust-model.md
├── schemas/                # JSON Schema + JSON-LD context definitions
├── profiles/               # Self-contained, independently extractable profile bundles
│   └── eu-ai-act/          # Spec, schema, and examples
├── examples/               # Runnable fixture packages
├── conformance/            # Language-neutral test corpus for SDKs
│   └── sidecars/           # Example .moca.idx sidecars
├── fixtures/               # Test material that is not an example package
│   └── signing-keys/       # Non-production example signing key
├── tools/                  # Reference CLIs (moca-lint, -convert, -index, -sign)
├── scripts/                # Repository validation and maintenance scripts
└── docs/                   # Non-normative guides (quickstart, etc.)
```

Each directory under [profiles/](profiles) contains a profile specification,
its schema, and its examples so it can be extracted independently.

## Documentation

Full index: [docs/](docs/README.md).

| | |
|---|---|
| [Why MOCA?](docs/why-moca.md) | The problem, the non-goals, and why not to just use a folder of Markdown |
| [Architecture](docs/architecture.md) | The three pillars: package, Knowledge Harness, AI Harness |
| [Use cases](docs/use-cases.md) | Concrete shapes, and how MOCA relates to RO-Crate, DITA, MCP |
| [Quickstart](docs/quickstart.md) | A valid package in five minutes |
| [End-to-end walkthrough](docs/walkthrough.md) | convert → sign → index → pack → grounded answer |
| [Choosing a level](docs/guides/choosing-a-level.md) | Which conformance level you actually need |
| [Authoring](docs/guides/authoring.md) | Grounding, lifecycle, integrity, composition |
| [Consuming a package](docs/guides/consuming.md) | What a Knowledge Harness does when it reads a package |
| [Signing and trust](docs/guides/signing-and-trust.md) | Signing, verification, the `skills/` boundary |
| [Search and indexes](docs/guides/search-and-indexes.md) | Optional `.moca.idx` sidecars |

## Tooling

Four reference CLIs — the Producer-class authoring tooling — each an
independently versioned workspace package:

| Tool | Purpose |
|---|---|
| [`moca-lint`](tools/moca-lint/README.md) | Validate, pack, and extract packages |
| [`moca-convert`](tools/moca-convert/README.md) | Build Level 1 packages from Markdown, Obsidian, or OpenAPI |
| [`moca-index`](tools/moca-index/README.md) | Build optional `.moca.idx` search sidecars |
| [`moca-sign`](tools/moca-sign/README.md) | Sign and verify packages (Sigstore / DSSE) |

```sh
npm install
npm test        # all validators + all four tool suites
```

## Related projects

Built on this specification, each in its own repository
([ADR-0003](docs/adr/0003-knowledge-harness-implementations.md)):

| Project | Repository | Status |
|---|---|---|
| Knowledge Harness for .NET | `openmoca/moca-knowledge-harness-dotnet` | Planned — first |
| Knowledge Harness for Python | `openmoca/moca-knowledge-harness-python` | Planned — second |
| Knowledge Harness for TypeScript | `openmoca/moca-knowledge-harness-typescript` | Planned — third |
| MOCA MCP server | `openmoca/moca-integrations-mcp` | Planned — search and inspect packages from any MCP client, through the Knowledge Harness |
| Education profile | `openmoca/moca-profile-education` | Graduated from this repository |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose spec changes or
new profiles, and [GOVERNANCE.md](GOVERNANCE.md) for how decisions get made.

## License

[Apache License 2.0](LICENSE) — specification prose and reference tooling
alike. The patent grant in §3 is deliberate: MOCA is a format intended for
independent implementation, and implementers should not have to weigh patent
risk before adopting it. See [NOTICE](NOTICE).
