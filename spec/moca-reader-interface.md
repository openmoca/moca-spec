# MOCA Reader Interface

Specification version: `0.4.0-alpha.1`
Status: Alpha. Expect changes before `1.0.0`.
License: [Apache License 2.0](../LICENSE)

## 1. Scope

The [Reader contract](moca-reader-contract.md) says what a Reader must
conclude and how it must behave. This document names the operations and
objects every MOCA Reader offers, once for all languages, so that the Readers
for different languages look alike to the people who use them.

The names here are logical. Each language uses its own conventions: for
example `readPackage` in TypeScript, `ReadPackageAsync` in .NET and
`read_package` in Python are the same operation. Where this document and the
contract disagree, the contract wins.

MOCA has three pillars
([ADR-0011](../docs/adr/0011-three-pillars-and-admission-test.md)):

| Pillar | What it is |
| --- | --- |
| **MOCA Package** | The open standard. |
| **MOCA Reader** | The open-source library that reads packages, one per language. It is the standard way to get anything out of a package, whether for RAG or any other search, for structure navigation or for citation. |
| **MOCA Application** | The product built on a Reader and an agent harness. |

Each language has its own Reader repository. The TypeScript reference Reader
is [`@openmoca/moca-core`](../tools/moca-core/README.md).

## 2. What a Reader does

| Part | Does | Must not |
| --- | --- | --- |
| **Read** | Open, check, digest, verify, resolve members, and build citation records. | Execute package content, or act on a location or setting a package supplies. |
| **Search** | One `search` over a backend the host chooses, with the retrieval policy applied in its gate. | Reimplement a vector database or an embedding stack. |
| **Structure** | Answer structure operations over the packages and the host's overlays. | Enforce what the structure says; that is the application's job. |
| **Bindings** | Present citation records in a framework's own types. | Change what a citation record says. |

## 3. What the host supplies

Everything a Reader touches outside a package's bytes comes from the host
([Reader contract §4](moca-reader-contract.md#4-what-a-reader-must-never-do)).

| Object | Shape | Used for |
| --- | --- | --- |
| Package source | Lists a package's file paths; returns the bytes of a listed path. | Reading packages from memory, blob storage or a database. |
| Member resolver | Given a member's id, version and pinned digest, returns a package target or nothing. | Composition. |
| Trust root | A trust-root document ([schema](../schemas/v1/trust-root.schema.json)). | Verifying attestations. |
| Clock | Returns the current time. | `stale` and `inForce`. |
| Limits | Entry, byte, frontmatter, structure and evidence limits ([contract §3](moca-reader-contract.md#3-opening-a-package)). | Safety with untrusted packages. |
| Overlays | `{ id, layer, source }`, where `layer` is `application` or `organisation` and `source` is Turtle. | Adding the application's and the organisation's structure and vocabulary. |
| Search backend | §5.2. | Search. |
| Embedder | §5.3. | Dense search. |
| Retrieval hooks | `ingress` and `egress` (§5.4). | Ontology-guided retrieval strategies. |
| Audience set | A list of audience labels. | Removing records outside it. |

A package never supplies any of these.

## 4. Reading

| Operation | Takes | Returns |
| --- | --- | --- |
| `readPackage` | A target (a directory, archive path, archive bytes or package source) and options: trust root, member resolver, limits, strict. | A package result. Never throws for a malformed package. |
| `bindSidecar` | A sidecar target and a package result. | `{ usable, index, chunks, diagnostics }`. |
| `Library(options)` | Clock, overlays, limits. | An empty library. |
| `Library.add` | A valid package result, and optionally its sidecar chunks and index. | The library, with the package and its resolved members loaded. |
| `Library.citations` | Options: locale, include text. | Every node's citation record. |
| `Library.get` | A node id or a versioned node reference, and options: locale. | One citation record, or nothing. |

A **package result** has at least these fields, with the meanings in the
contract:

- `manifest`, `digest` and `payloadManifest`;
- `nodes`, `members` and `profiles`;
- `structure`;
- `diagnostics`, `valid` and `capabilities`.

A **diagnostic** has `code`, `severity` and `message`, and optionally `file`
and `line`.

## 5. Search

### 5.1 The search operation

| Operation | Takes | Returns |
| --- | --- | --- |
| `Search(source, options)` | A library, or, for a store backend, the loaded digests and a clock; then a backend, an audience set and optional hooks. | A search. |
| `Search.search` | A query and options: `limit`, `includeAll`, `locale`, `concepts`, `scope`. | Citation records, each with a `score`. Best first, unless an egress hook ordered them. |

Every call follows
[Reader contract §9.2](moca-reader-contract.md#92-the-pipeline-and-the-gate).
`includeAll` is the host's opt-in from contract §8; a host that lets a caller
set it has chosen to.

### 5.2 Backends

A backend has:

- `features`: `lexical` or `dense`, plus `filterPushdown`;
- `search(query, { limit, filters })`, which returns hits valid against
  [`search-hit.schema.json`](../schemas/v1/search-hit.schema.json);
- `diagnostics`: findings about the backend itself, for example
  `S006_MODEL_MISMATCH`.

Every Reader provides a **lexical backend** over the loaded packages' own
text. A Reader that reads sidecars may provide a **dense backend** over their
vectors. A **store backend** wraps the host's own vector store. It is usually
part of a binding. It stores whole citation records at ingest, and returns
each one with its hit.

### 5.3 Embedder

The host supplies the embedder:

- `name`, an optional `version`, and `dimensions`, compared with an index's
  `model` ([Reader contract §9.3](moca-reader-contract.md#93-dense-backends));
- `embed(texts)`, which returns one vector per text.

A Reader never chooses, downloads or configures an embedder.

### 5.4 Retrieval hooks

Ontology-guided retrieval is a strategy, not a fact, so it is pluggable
([ADR-0016](../docs/adr/0016-pluggable-ontology-guided-retrieval.md)):

- `ingress(query, ctx)` may return `{ query, concepts, scope }`, which change
  what the backend searches;
- `egress(candidates, ctx)` returns the candidates, possibly reordered, and
  possibly with records added from structure operations. Each added record is
  tagged `retrieval: { via, from }`.

`ctx` holds the request, the library, its structure operations, the audience
set and the clock, all read-only. The gate runs after both hooks, so no hook
can return what the retrieval policy excludes. Each Reader ships a default
strategy (`ontologyGuided` in the reference Reader).

**Domain extensions.** A domain extension, such as a legal, procedures or
course extension, is a set of hooks plus a vocabulary overlay. It is built on
the standard Reader, never as a separate Reader, and lives in its own
repository with its own tests.

## 6. Structure

`Library.structure` answers the operations in
[Reader contract §10](moca-reader-contract.md#10-structure). They run over the
merged structure of every loaded package and every overlay, and each item
carries its `layer`:

| Operation | Returns |
| --- | --- |
| `concept(iri)` | The concept, or nothing |
| `requires(iri, { transitive })`, `requiredBy(iri)` | Concept items |
| `parts(iri)`, `narrower(iri, { transitive })`, `broader(iri)`, `related(iri)` | Concept items |
| `sequence(iri)` | Ordered concept items, or nothing |
| `nodes(iri, { include })` | Citation records |

## 7. Bindings

A binding maps citation records to a framework's own types, and a framework's
query to `Search.search`. It lives in the language Reader's repository or its
own, never in the framework.

| Framework | Type a binding provides | Language |
| --- | --- | --- |
| LangChain / LangGraph | A retriever returning documents | Python, TypeScript |
| LlamaIndex | A retriever returning nodes with scores | Python, TypeScript |
| Microsoft Agent Framework | A context provider | .NET, Python |
| Microsoft.Extensions.VectorData | A store backend over any supported vector store | .NET |
| Model Context Protocol | Server resources and tools | Any; the reference is [`@openmoca/moca-mcp`](../tools/moca-mcp/README.md) |

A binding MUST carry the whole citation record in the framework type's
metadata, including `node.ref`. When the framework needs flat metadata, the
binding MUST at least use the fields in the
[consuming guide's metadata table](../docs/guides/consuming.md#feeding-your-own-retrieval-stack),
including the package digest. The text it hands to a model follows
[Reader contract §12](moca-reader-contract.md#12-handing-content-to-a-model).

## 8. Conformance

A Reader in any language shows conformance by running the corpus through the
runner protocol in [conformance/README.md](../conformance/README.md). It ships
only when it passes every case.
