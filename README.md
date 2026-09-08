# MOCA — Modular Ontology & Content Assembly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/status-beta-orange.svg)](#status)

MOCA defines a portable, storage-independent, and runtime-neutral format for
packaging semantic knowledge, grounded content, evidence, and ontologies for
AI consumption. MOCA Core is domain-agnostic — a customer-support knowledge
base, a legal research corpus, an internal engineering wiki, and an
educational course are all equally valid uses of a MOCA package.
Domain-specific vocabulary lives in **profiles** layered on top of core.

## Status

**Beta `0.1.0-beta.1` — pre-`1.0.0`, experimental.** The spec, schemas, and
examples in this repo are subject to change as the SDK proof of concept
exercises the format. There is no stable release or compatibility guarantee
yet. See [Versioning and Release](docs/versioning-and-release.md).

> **Note on `openmoca.org` URIs:** Schema, profile, and vocabulary URIs used
> throughout this spec (e.g. `https://openmoca.org/vocab/core#`) are stable
> identifiers, not necessarily live, resolvable network locations at this
> stage — the domain is in the process of being acquired.

## The 3-Layer System Architecture

MOCA enforces a strict separation of concerns across three layers:

```text
┌──────────────────────────────────────────────────────────┐
│               1. Application / Host Layer                │
│ PII Redaction · Security Policy · Identity · Enterprise  │
└────────────────────────────┬───────────────────────────-─┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│                   2. AI Harness Layer                    │
│ Retrieval (GraphRAG/Vector) · Agent Routing · Tools      │
│ Reasoning · Context Assembly · Memory & Session State    │
└────────────────────────────┬────────────────────────────-┘
                              │
                      consumes / interprets
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│               3. MOCA Knowledge Package                  │
│ Concepts · Ontologies · Grounded Nodes · Claims          │
│ Evidence & Locators · Provenance · Inert Content         │
└────────────────────────────────────────────────────────-─┘
```

MOCA packages are inert data consumed by an AI Harness layer (retrieval,
reasoning, tool execution) that in turn sits underneath an Application/Host
layer (security policy, identity, tenancy). See
[moca-core-spec.md §1](moca-core-spec.md#1-scope-philosophy--architecture-model)
for the full model.

## Conformance Levels

| Level | Name | Requirements |
|---|---|---|
| **1** | MOCA Core | Valid `moca.json` root manifest. Grounded CommonMark knowledge nodes (`content/`) bound to concepts via YAML frontmatter. Parseable with standard JSON + Markdown tooling only. |
| **2** | MOCA Semantic | Adds JSON-LD `@context`, formal ontologies (`ontologies/`), SHACL shape validation. `claims` interpretable as RDF triples. |
| **3** | MOCA Extended | Adds W3C Web Annotation locators. Cryptographic signatures — **mandatory for any package containing `skills/`**. Optional Agent Skills. |

See [moca-core-spec.md §3](moca-core-spec.md#3-conformance-levels) for full
details.

## Specification

- [MOCA Core Package Specification](moca-core-spec.md)
- [MOCA Sidecar Index Specification](docs/sidecar-index-spec.md)
- [MOCA Education Profile](profiles/education/moca-education-profile.md)
- [MOCA EU AI Act Profile](profiles/eu-ai-act/moca-eu-ai-act-profile.md)

## Repository Layout

```text
moca-spec/
├── moca-core-spec.md          # Core specification
├── schemas/                    # JSON Schema + JSON-LD context definitions
│   └── core/
├── profiles/                   # Self-contained, independently extractable profile bundles
│   ├── education/              # Spec, schema, and examples
│   └── eu-ai-act/              # Spec, schema, and examples
├── examples/                   # Runnable core fixture packages at each conformance level
└── docs/                       # Guides (quickstart, etc.)
```

Each directory under [profiles/](profiles/) contains a profile specification,
its schema, and its examples so it can be extracted independently.

## Quickstart

See [docs/quickstart.md](docs/quickstart.md) to build your first MOCA
package, using [examples/level-1-minimal](examples/level-1-minimal) as a
starting point.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose spec changes or
new profiles, and [GOVERNANCE.md](GOVERNANCE.md) for how decisions get made.

## License

[MIT](LICENSE)
