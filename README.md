# MOCA

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)](#status)

**A package layer for knowledge that AI systems use.** MOCA wraps an
[Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
(OKF) bundle, a folder of Markdown with YAML frontmatter, so it can be
exchanged, verified, composed and cited, whatever model, vector database or
framework reads it.

**MOCA ships knowledge with its evidence, sealed.** A package carries the
original source files, not just knowledge written about them, and its digest
covers both. A citation can be checked against its original on a device with
no network.

## The problem

- Knowledge that feeds AI is copied between teams, vendors and pipelines, and
  nobody can prove which version an answer came from, who published it, or
  whether anyone checked it.
- "Verified" is usually a label anyone can type. Nothing ties it to a person
  or to the exact text they checked.
- Superseded and expired content keeps being served because nothing tells the
  pipeline it is no longer in force.

OKF already gives knowledge a common file format and trust fields. It
deliberately stops at the file: no package identity, no integrity, no
signatures, no way to compose bundles or relate versions, and no guarantee
that the sources it cites travel with it or arrive unchanged. MOCA is that
missing layer, and nothing more.

## Two purposes

| Purpose | What it needs from MOCA |
| --- | --- |
| **Move knowledge between platforms, securely and verifiably** | Identity, a digest that survives repacking, signatures and reviews, pinned members, and the original sources inside the package. |
| **Read and integrate packages locally**, on edge devices or on infrastructure a client owns | An in-process Reader in the host's language, offline search, one search API whatever the backend, and bindings to the host's framework. |

## What MOCA adds to an OKF bundle

| Adds | So that |
| --- | --- |
| **Identity and content version** (`moca.json`) | A package has one name across its versions, and version numbers say how much the meaning changed. |
| **A digest** computed from the content | The same package has the same identity as a folder, a `.moca` file or a registry artifact, and any change is detectable. |
| **Publisher attestations** | A host can verify who published exactly these bytes (Sigstore or DSSE). |
| **Review attestations** | A reviewer signs that they checked the exact bytes of a node; it stops counting as soon as the node changes. |
| **Members pinned by digest** | A handbook can be composed from chapters without copying them, reproducibly. |
| **Typed relations** (`supersedes`, `amends`, `conflictsWith`) | A newer policy retires an older one, and conflicts are surfaced instead of hidden. |
| **The original sources**, inside the package | `sources/` is covered by the digest, and every quoted passage is checked against it (`self-contained-evidence`). |
| **Evidence, validity and audience** on each node | An answer can cite the exact sentence of a source, out-of-force content is left out by default, and hosts can filter internal content. |
| **A Reader contract and conformance corpus** | Any implementation reaches the same conclusions about a package, down to the digest. |

## Quick look

```text
support-kb/
├── moca.json
├── content/                 an OKF bundle
│   └── refund-window.md
├── sources/refund-policy-2026.txt
└── attestations/            signatures, outside the digest
```

```json
{
  "id": "https://example.com/moca/support-kb",
  "version": "4.2.0",
  "title": "Acme Support Knowledge Base"
}
```

```markdown
---
type: Policy
title: Refund eligibility window
verified:
  - by: human:sam.ortiz
    at: 2026-08-14T00:00:00Z
sources:
  - id: terms-7
    resource: ../sources/refund-policy-2026.txt
moca:
  evidence:
    - source: terms-7
      selector: { type: TextQuoteSelector, exact: "Customers may request a full refund within 30 days of delivery." }
  audience: public
---
# Refund eligibility window

Customers may request a full refund within **30 days of delivery**.
```

A Reader turns every node into a **citation record**: the text, plus package
id, version and digest, who signed it, declared and attested reviews,
freshness, validity, supersession, and evidence marked `verified` when the
quote was found in the source inside the package.

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

## How it fits

```text
Your application   agents, prompts, policy: decides what to do with trust signals
      │
      │  citation records
      ▼
Bindings           LangChain / LlamaIndex retriever, Agent Framework context provider,
      │            Microsoft.Extensions.VectorData, MCP server
      ▼
Search             one search(): lexical · sidecar · dense · your vector store,
      │            with the retrieval policy and audience rules applied once
      ▼
Reader             open · check · digest · verify · resolve members · cite
      │            (in-process, in the host's language)
      ▼
MOCA package       moca.json + OKF content + sources + attestations
```

Each language has its own Reader, built to one
[Reader interface](spec/moca-reader-interface.md) and tested against one
conformance corpus. Vector storage, embedding and ranking stay with the stack
you already use; MOCA adds trust and citation. See
[architecture](docs/architecture.md).

## What MOCA is not

- **Not a content model.** OKF is. MOCA reads OKF's fields as OKF defines them.
- **Not a retrieval engine or vector database.** Search in MOCA is one entry
  point that applies trust rules over backends you already have; the optional
  [sidecar index](spec/moca-sidecar-index-spec.md) is a cache.
- **Not configuration.** Nothing in a package can make a Reader contact
  anything or change a setting.
- **Not a guarantee of truth.** Attestations prove who published and who
  reviewed. Content is still untrusted input to a model.

## Specification

| Document | Covers |
| --- | --- |
| [Package specification](spec/moca-package-spec.md) | Manifest, content, digest, members, relations, skills, profiles, capabilities |
| [Reader contract](spec/moca-reader-contract.md) | What every Reader concludes and must never do; citation records; search; diagnostic codes |
| [Reader interface](spec/moca-reader-interface.md) | The operations every language's Reader offers: Reader, Search, Bindings |
| [Attestations](spec/moca-attestations.md) | Package and review attestations, trust roots, verification outcomes |
| [Sidecar index](spec/moca-sidecar-index-spec.md) | The portable `moca-jsonl-v1` search index |
| [OCI binding](spec/moca-oci-binding.md) | Storing and pulling packages from OCI registries |
| [Profiles](profiles/README.md) | Agent Skills, claims (nanopublications), ontology (SKOS/OWL), EU AI Act data governance |
| [Schemas](schemas/v1) | Manifest, node, citation record, search hit, sidecar, review predicate, trust root |
| [Conformance corpus](conformance/README.md) | 57 cases, with pinned digests, that any implementation must pass, runnable against a Reader in any language |

Identifiers use `https://w3id.org/moca/...`. The w3id.org redirect is being
registered; until then these URIs are stable names, not live links.

## Tools

| Tool | Purpose |
| --- | --- |
| [`moca-core`](tools/moca-core/README.md) | The reference Reader and Search library (TypeScript) |
| [`moca-mcp`](tools/moca-mcp/README.md) | MCP server: search and cite packages from any agent |
| [`moca-convert`](tools/moca-convert/README.md) | Build packages from Markdown folders, Obsidian vaults and OpenAPI documents |
| [`moca-lint`](tools/moca-lint/README.md) | Check, pack, extract; print digests |
| [`moca-sign`](tools/moca-sign/README.md) | Publisher and review attestations (DSSE or Sigstore) |
| [`moca-index`](tools/moca-index/README.md) | Build sidecar indexes |

## Status

**Alpha, `0.3.0-alpha.1`.** The format may change before `1.0.0`. The
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
