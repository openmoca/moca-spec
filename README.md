# MOCA

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)](#status)

**Portable grounding for AI.** A MOCA package holds the knowledge an AI system
uses, how that knowledge is organised, and the original sources it came from.
Any system can read it the same way, on a server or on a device with no
network, whatever model, vector database or agent framework it runs.

A MOCA package wraps an
[Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
(OKF) bundle, a folder of Markdown with YAML frontmatter, in three layers:

| Layer | Holds | Built on |
| --- | --- | --- |
| **Structure** (optional) | Concepts and how they relate: hierarchy, parts, order, what requires what, what replaces what | W3C SKOS and DCMI terms, in `structure.ttl` |
| **Content** | The knowledge, one Markdown node per topic | OKF |
| **Evidence** | The original sources, and selectors that point into them | W3C Web Annotation, Media Fragments, WebVTT |

**Trust runs across all three.** The package's digest covers every file, so
the originals travel with the knowledge and arrive unchanged. A signed package
proves who published it, and signed reviews prove who checked which node.
MOCA ships knowledge with its evidence, sealed when signed.

## The problem

- Knowledge that feeds AI is rebuilt for every model, vendor and pipeline, and
  loses its structure and sources on the way.
- Nobody can prove which version an answer came from, who published it, or
  whether anyone checked it. "Verified" is usually a label anyone can type.
- Superseded and expired content keeps being served, because nothing tells the
  pipeline it is no longer in force.
- Retrieval ignores how a domain is organised. An assistant answers an
  advanced question before a prerequisite, or pulls in material from the
  wrong system.

## Three pillars

| Pillar | What it is | Openness |
| --- | --- | --- |
| **MOCA Package** | The format: structure, content, evidence, and the identity and trust that cover them | Open standard |
| **MOCA Reader** | The standard way to get anything out of a package, whether for RAG or any other search, structure navigation or citation. It is in-process, one per language, and each Reader passes one conformance corpus | Open source |
| **MOCA Application** | The product for one use case, built on a Reader and the agent harness of your choice | Yours |

See [ADR-0011](docs/adr/0011-three-pillars-and-admission-test.md) and the
[architecture](docs/architecture.md).

## Quick look

```text
incident-response/
├── moca.json
├── structure.ttl            optional: concepts, parts, order, requires
├── content/                 an OKF bundle
│   ├── incident-response.md
│   └── steps/notify-customers.md
├── sources/                 the originals the nodes cite
└── attestations/            signatures, outside the digest
```

```turtle
ir:NotifyCustomers a skos:Concept ;
  skos:prefLabel "Notify customers"@en ;
  dcterms:requires ir:AssessSeverity .
```

```markdown
---
type: Procedure
title: Notify customers
moca:
  concepts:
    - iri: https://example.org/handbook/incident#NotifyCustomers
      role: primary
---
# Notify customers
```

A Reader turns every node into a **citation record**. It carries:

- the text;
- the package id, version and digest, and a versioned node reference;
- who signed it, and its declared and attested reviews;
- its freshness, validity and supersession;
- its evidence, marked `matched` when the quote was found in the original.

A Reader answers structure questions too: what "notify customers" requires,
the steps of a procedure in order, and everything under a topic. Its search
can be limited to a topic, and an application can plug in
**ontology-guided retrieval**: for example, following `requires` to bring in
the step that must come first.

## Get started

The tools are not published to npm yet. Run them from a clone:

```sh
git clone https://github.com/openmoca/moca-spec && cd moca-spec
npm install

# Turn a folder of Markdown into a package
node tools/moca-convert/bin/moca-convert.js ./my-docs -o my-package \
  --id https://example.com/kb/my-docs --title "My docs"

# Check it, and see its digest and capabilities
node tools/moca-lint/bin/moca-lint.js lint my-package

# Serve it to any MCP client (Claude, IDEs, agent frameworks)
node tools/moca-mcp/bin/moca-mcp.js my-package
```

Then read the [quickstart](docs/quickstart.md) or the
[walkthrough](docs/walkthrough.md) (convert, sign, review, index, serve).

## What MOCA is not

- **Not a content model.** OKF is. MOCA reads OKF's fields as OKF defines them.
- **Not a retrieval engine or vector database.** The Reader's search is one
  entry point that applies trust rules over backends you already have; the
  optional [sidecar index](spec/moca-sidecar-index-spec.md) is a cache.
- **Not configuration.** Nothing in a package can make a Reader contact
  anything or change a setting. Application and organisation rules are
  overlays the host loads, never package content.
- **Not a guarantee of truth.** Attestations prove who published and who
  reviewed; `matched` proves a quote is in its source. Content is still
  untrusted input to a model, and structure narrows what is retrieved, not
  what a model says.

## Specification

| Document | Covers |
| --- | --- |
| [Package specification](spec/moca-package-spec.md) | Manifest, content, structure, evidence, digest, members, relations, profiles, capabilities |
| [Reader contract](spec/moca-reader-contract.md) | What every Reader concludes and must never do; citation records; search; structure operations; diagnostic codes |
| [Reader interface](spec/moca-reader-interface.md) | The operations every language's Reader offers, and how applications extend them |
| [Attestations](spec/moca-attestations.md) | Package and review attestations, trust roots, verification outcomes |
| [Sidecar index](spec/moca-sidecar-index-spec.md) | The portable `moca-jsonl-v1` search index, with binary vectors |
| [Profiles](profiles/README.md) | Optional extensions; today the ontology profile (extra vocabulary files) |
| [Schemas](schemas/v1) | Manifest, node, structure, citation record, search hit, sidecar, review predicate, trust root |
| [Conformance corpus](conformance/README.md) | 76 cases, with pinned digests, that any Reader must pass, in any language |

Identifiers use `https://w3id.org/moca/...`. The w3id.org redirect is being
registered; until then these URIs are stable names, not live links.

## Tools

| Tool | Purpose |
| --- | --- |
| [`moca-core`](tools/moca-core/README.md) | The reference MOCA Reader (TypeScript) |
| [`moca-mcp`](tools/moca-mcp/README.md) | MCP server: search, navigate and cite packages from any agent |
| [`moca-convert`](tools/moca-convert/README.md) | Build packages from Markdown folders, Obsidian vaults and OpenAPI documents |
| [`moca-lint`](tools/moca-lint/README.md) | Check, pack, extract; print digests, manifests and structure views |
| [`moca-sign`](tools/moca-sign/README.md) | Publisher and review attestations (DSSE or Sigstore) |
| [`moca-index`](tools/moca-index/README.md) | Build sidecar indexes |

## Status

**Alpha, `0.4.0-alpha.1`.** The format may change before `1.0.0`. The
specification, schemas, examples, conformance corpus and tools are complete
and tested together (`npm test`). What is not proven yet is value in use: the
[outcome evaluation](docs/plans/01-outcome-evaluation.md) is the next
milestone. See the [roadmap](ROADMAP.md).

## Documentation

Start at [docs/](docs/README.md): [why MOCA](docs/why-moca.md),
[use cases](docs/use-cases.md), [architecture](docs/architecture.md), the
guides, and the [decision records](docs/adr/README.md).

## Contributing and licence

See [CONTRIBUTING.md](CONTRIBUTING.md) and [GOVERNANCE.md](GOVERNANCE.md).
Specification and tools are under the [Apache License 2.0](LICENSE), including
its patent grant, so MOCA can be implemented independently without patent
risk. See [NOTICE](NOTICE).
