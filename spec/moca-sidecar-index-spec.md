# MOCA Sidecar Index Specification

Specification version: `0.6.0`
Status: Before `1.0.0`. A minor version may still change the format; each change is in [MIGRATIONS.md](../MIGRATIONS.md).
License: [Apache License 2.0](../LICENSE)

## 1. Scope

A sidecar index is an optional, derived search artefact for one package: text
chunks, and optionally vectors, that a Reader can search instead of reading
every node. A package is complete without one. A sidecar can always be
deleted and rebuilt, for example for a new embedding model.

This document defines one portable format, `moca-jsonl-v1`, so that any Reader
can use a sidecar any Producer built. Other payload formats are allowed, but
are not portable: a Reader that does not recognise a format ignores the
sidecar (`S005`).

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, MAY
and OPTIONAL are to be interpreted as described in RFC 2119 and RFC 8174 when,
and only when, they appear in capitals. Terms are as defined in
[package specification §2](moca-package-spec.md#2-conventions).

## 2. Layout

A sidecar is a directory, or a Zip archive of one, kept **outside** the
package it indexes:

```text
support-kb.moca.idx/
├── index.json
└── payload/
    └── items.jsonl
```

## 3. `index.json`

Valid against [`sidecar-index.schema.json`](../schemas/v1/sidecar-index.schema.json):

```json
{
  "indexVersion": 1,
  "target": { "id": "https://example.com/moca/support-kb", "version": "4.2.0",
              "digest": "sha256:4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da" },
  "indexType": "lexical",
  "chunking": { "strategy": "headings-h1-h3" },
  "storage": { "format": "moca-jsonl-v1", "file": "payload/items.jsonl" },
  "createdBy": "moca-index"
}
```

| Field | Meaning |
| --- | --- |
| `indexVersion` | `1`. Required (§3, [package spec §14](moca-package-spec.md#14-versioning-of-this-specification)). |
| `target` | The package the sidecar was built from: `id`, `version` and digest. All three are required. |
| `indexType` | `lexical`, `dense` or `hybrid`. It describes the sidecar; a Reader uses what the sidecar holds (chunks, and vectors when `storage.vectors` is present), not this value. A `dense` or `hybrid` sidecar needs `model`. |
| `model` | The embedding model: `name`, and optionally `version`, `dimensions`, `distance` (`cosine`, the default, `dot` or `euclidean`: how a Reader compares the vectors, [Reader contract §9.3](moca-reader-contract.md#93-dense-backends)), and `queryPrefix` and `documentPrefix`, the text the producer's embedder put before queries and documents. A `dense` or `hybrid` sidecar MUST include it, or the sidecar is invalid (`S001`): vectors are useless without knowing the model that made them. |
| `chunking` | How the text was split. Informative. |
| `createdBy` | The tool that built the sidecar. Informative. |
| `storage` | The payload `format` and its `file`, relative to the sidecar root; and, for a dense or hybrid sidecar, `vectors` (§4.1). |

A sidecar is metadata about search only. A Reader MUST NOT derive a package's
validity, trust, configuration or credentials from it.

## 4. The `moca-jsonl-v1` payload

One JSON object per line:

```json
{"path":"refund-window.md","chunkIndex":0,"chunkCount":1,"start":753,"end":1077,"text":"# Refund eligibility window\n…"}
{"path":"refund-window.md","locale":"fr","chunkIndex":0,"chunkCount":1,"start":214,"end":452,"text":"# Délai de remboursement\n…"}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `path` | Yes | Node path relative to `content/` ([package spec §5.2](moca-package-spec.md#52-node-paths)). |
| `locale` | No | The representation's locale; absent for the default language. |
| `chunkIndex`, `chunkCount` | Yes | Position of this chunk among the representation's chunks: `0 ≤ chunkIndex < chunkCount`, and every index from 0 to `chunkCount - 1` present. |
| `start`, `end` | Yes | UTF-8 byte offsets into the node file, inside its body: body start `≤ start ≤ end ≤` file length. These let a citation point at the exact passage. |
| `text` | No | The chunk's text. When present it MUST be exactly the node file's bytes from `start` to `end`, as UTF-8; otherwise the item is invalid (`S004`). A Reader never searches it: search always reads the package's own bytes. |
| `vector` | No | **Deprecated**: numbers, of length `model.dimensions` when that is given. Readers MUST accept it until 1.0; producers write `storage.vectors` instead (§4.1). |

### 4.1 Vectors

A dense or hybrid sidecar SHOULD store its vectors in a separate binary file,
named in `index.json`:

```json
"storage": { "format": "moca-jsonl-v1", "file": "payload/items.jsonl",
             "vectors": { "file": "payload/vectors.f32", "dtype": "float32", "dimensions": 384 } }
```

The file holds little-endian IEEE 754 float32 values, row-major, one row of
`dimensions` values per payload item, in the order of the items in the payload
file. Its size MUST be exactly `items × dimensions × 4` bytes, and
`dimensions` MUST equal `model.dimensions` when that is given (`S004`).

Binary vectors take roughly a quarter of the space of the same vectors written
as JSON numbers, and need no parsing, which matters on devices. The text and
offsets stay in the JSONL payload, so a Reader that does not search by vector
can ignore the file.

## 5. Binding and staleness

A Reader MUST NOT use a sidecar unless all of these hold:

1. `index.json` is valid (`S001`);
2. `target.id` and `target.version` match the package (`S002`);
3. `target.digest` equals the package's computed digest (`S003`);
4. the payload format is one it supports (`S005`);
5. every item is valid and points at an existing node representation (`S004`).

If any check fails, the Reader ignores the sidecar and searches the package
directly. Any change to a package changes its digest, so a sidecar is stale as
soon as its package changes.

Before a dense or hybrid search, a Reader compares the host's embedder with
`model` as [Reader contract §9.3](moca-reader-contract.md#93-dense-backends)
says; on a difference it reports `S006_MODEL_MISMATCH` and does not search the
vectors, and the chunks can still be searched lexically. `model` is only ever
compared: a Reader MUST NOT load or call a model because a sidecar names it,
and MUST NOT apply a prefix a sidecar gives.

### 5.2 Security considerations

- **A sidecar is not authenticated.** Binding to `target.digest` shows it was
  built for the package, not that it was built honestly. Its text cannot
  differ from the package (above), but its spans and vectors are the
  builder's choice: a hostile sidecar can steer which real passages rank
  first, or cut a span to quote a sentence out of context. A host SHOULD use
  only sidecars it built or trusts, or search the package directly.
- **A sidecar archive is untrusted input.** It follows the same archive rules
  and limits as a package ([Reader contract §3](moca-reader-contract.md#3-opening-a-package)).
- **Chunk text reaches models** like any package text, and follows
  [Reader contract §12](moca-reader-contract.md#12-handing-content-to-a-model).

### 5.1 Embedders the MOCA tools support (informative)

Any model can make a sidecar's vectors. A `model.name` and `model.version`
pair names an exact embedding recipe, so that a host knows how to embed
queries for that sidecar. These four are the ones the MOCA tools support by
name: open models, run locally. A sidecar built with one of them is searchable
by meaning wherever the same model is installed. Each is the 8-bit ONNX file of its model, pinned to a
Hugging Face commit, and recorded in `model` as below.

| Model | `model.name` | `dimensions` | Pooling | Maximum tokens | `queryPrefix` (JSON) | `documentPrefix` (JSON) |
| --- | --- | --- | --- | --- | --- | --- |
| `bge-small-en-v1.5` | `BAAI/bge-small-en-v1.5` | 384 | first token | 512 | `"Represent this sentence for searching relevant passages: "` | (none) |
| `nomic-embed-text-v1.5` | `nomic-ai/nomic-embed-text-v1.5` | 768 | mean | 2,048 | `"search_query: "` | `"search_document: "` |
| `all-MiniLM-L6-v2` | `sentence-transformers/all-MiniLM-L6-v2` | 384 | mean | 256 | (none) | (none) |
| `multilingual-e5-small` | `intfloat/multilingual-e5-small` | 384 | mean | 512 | `"query: "` | `"passage: "` |

`model.version` is `onnx-q8` for all four. Every tool embeds them the same
way:

1. put the role's prefix before the text;
2. tokenise with the model's own tokeniser, and truncate as Hugging Face's
   Python tokeniser does: the start token, the first tokens that fit, the end token;
3. run one text at a time (the 8-bit files quantise activations per run, so a
   batch would change each vector);
4. pool, then normalise to unit length.

The [search and indexes guide](../docs/guides/search-and-indexes.md) lists
the model files, their sources and SHA-256, and the tools that install them
and build sidecars with them.

## 6. Store backends

When a host indexes packages into its own vector database instead of using a
sidecar, the rules are those of a store backend
([Reader contract §9.4](moca-reader-contract.md#94-store-backends)): each
record carries its whole citation record, including the package digest, and
the search recomputes everything that depends on the library or the trust
root from the loaded packages' states.
