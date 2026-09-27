# MOCA Reader Interface

Specification version: `0.3.0-alpha.1`
Status: Alpha. Expect changes before `1.0.0`.
License: [Apache License 2.0](../LICENSE)

## 1. Scope

The [Reader contract](moca-reader-contract.md) says what a Reader must
conclude and how it must behave. This document names the operations and
objects every MOCA Reader offers, once for all languages, so that the Readers
for different languages look alike to the people who use them.

Names here are logical. Each language uses its own conventions: `readPackage`
in TypeScript, `ReadPackageAsync` in .NET and `read_package` in Python are the
same operation. Where this document and the Reader contract disagree, the
contract wins.

Each language has its own Reader repository ([ADR-0007](../docs/adr/0007-reader-interface-and-per-language-readers.md)).
The TypeScript reference Reader is [`@openmoca/moca-core`](../tools/moca-core/README.md).

## 2. Layers

| Layer | Does | Must not |
| --- | --- | --- |
| **Reader** | Open, check, digest, verify, resolve members, and build citation records. | Execute package content, or act on a location or setting a package supplies. |
| **Search** | One `search` over a pluggable backend, applying the default retrieval policy and the host's audience set. | Reimplement a vector database or an embedding stack. |
| **Bindings** | Present citation records in a framework's own types. | Change what a citation record says. |

A Reader implementation claims the Reader class of the contract. With the
Search layer it claims the Search class.

## 3. What the host supplies

Everything a Reader touches outside a package's bytes comes from the host
([Reader contract §4](moca-reader-contract.md#4-what-a-reader-must-never-do)).

| Object | Shape | Used for |
| --- | --- | --- |
| Package source | Lists a package's file paths; returns the bytes of a listed path. | Reading packages from memory, blob storage or a database. |
| Member resolver | Given a member's id, version and pinned digest, returns a package target or nothing. | Composition. |
| Trust root | A trust-root document ([schema](../schemas/v1/trust-root.schema.json)). | Verifying attestations. |
| Clock | Returns the current time. | `stale` and `inForce`. |
| Limits | Maximum entries and uncompressed bytes. | Archive and source safety. |
| Search backend | §5.2. | Search. |
| Embedder | §5.3. | Dense search. |
| Audience set | A list of audience labels. | Removing records outside it. |

## 4. Reader operations

| Operation | Takes | Returns |
| --- | --- | --- |
| `readPackage` | A target (directory, archive path, archive bytes or package source) and options: trust root, member resolver, clock, limits, strict. | A package result. Never throws for a malformed package. |
| `bindSidecar` | A sidecar target and a package result. | `{ usable, index, chunks, diagnostics }`. |
| `Library.add` | A valid package result, and optionally its sidecar chunks. | The library, with the package and its resolved members loaded. |
| `Library.citations` | Options: locale, include text. | Every node's citation record. |
| `Library.get` | A node id, and options: locale. | One citation record, or nothing. |

A **package result** has at least: `manifest`, `digest`, `nodes`,
`members`, `profiles`, `diagnostics`, `valid` and `capabilities`, with the
meanings in the contract. A **diagnostic** has `code`, `severity`, `message`,
and optionally `file` and `line`.

## 5. Search

### 5.1 The search entry point

| Operation | Takes | Returns |
| --- | --- | --- |
| `Search.search` | A query and options: `limit`, `includeAll`, `locale`, `concepts`. | Citation records, each with `score`, best first. |

A `Search` is created over a library, one backend, and the host's options:
audience set and clock. It follows
[Reader contract §9.2](moca-reader-contract.md#92-the-search-entry-point) on
every call. `includeAll` is the host's opt-in from contract §8; a host that
lets a caller set it has chosen to.

### 5.2 Backends

A backend has:

- `features`: a set of `lexical`, `dense`, `hybrid`, `filterPushdown`;
- `search(query, { limit, filters })`, returning hits valid against
  [`search-hit.schema.json`](../schemas/v1/search-hit.schema.json);
- `diagnostics`: findings about the backend itself, for example
  `S006_MODEL_MISMATCH`.

`filters` holds the values in
[Reader contract §9.5](moca-reader-contract.md#95-filter-pushdown). A backend
that does not declare `filterPushdown` may ignore them.

Every Reader provides a **lexical backend** over the loaded packages' own
text, so that search works offline with no other software. A Reader that
reads sidecars provides a **sidecar backend**. A **store backend** wraps the
host's own vector store. It is usually part of a binding, because each store
has its own client library.

### 5.3 Embedder

An embedder is supplied by the host:

- `name`, optional `version`, and `dimensions`, compared with an index's
  `model` ([Reader contract §9.3](moca-reader-contract.md#93-dense-backends));
- `embed(texts)`, returning one vector per text.

A Reader never chooses, downloads or configures an embedder.

## 6. Bindings

A binding maps citation records to a framework's own types, and a framework's
query to `Search.search`. It lives in the language Reader's repository or its
own, never in the framework.

| Framework | Type a binding provides | Language |
| --- | --- | --- |
| LangChain / LangGraph | Retriever returning documents | Python, TypeScript |
| LlamaIndex | Retriever returning nodes with scores | Python, TypeScript |
| Microsoft Agent Framework | Context provider | .NET, Python |
| Microsoft.Extensions.VectorData | Store backend over any supported vector store | .NET |
| Model Context Protocol | Server tools (`moca_list_packages`, `moca_search`, `moca_get_node`) | Any; the reference is [`@openmoca/moca-mcp`](../tools/moca-mcp/README.md) |

A binding MUST carry the whole citation record in the framework type's
metadata. When the framework needs flat metadata, it MUST at least use the
fields in the
[consuming guide's metadata table](../docs/guides/consuming.md#feeding-your-own-retrieval-stack),
including the package digest. The text it hands to a model follows
[Reader contract §11](moca-reader-contract.md#11-handing-content-to-a-model).

## 7. Conformance

A Reader in any language shows conformance by running the corpus through the
runner protocol in [conformance/README.md](../conformance/README.md). It ships
only when it passes every case for the classes and features it claims.
