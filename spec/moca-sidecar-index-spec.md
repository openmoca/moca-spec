# MOCA Sidecar Index Specification

Specification version: `0.2.0-alpha.1`
Status: Alpha. Expect changes before `1.0.0`.
License: [Apache License 2.0](../LICENSE)

## 1. Scope

A sidecar index is an optional, derived search artifact for one package: text
chunks, and optionally vectors, that a Reader can search instead of reading
every node. A package is complete without one. A sidecar can always be
deleted and rebuilt, for example for a new embedding model.

This document defines one portable format, `moca-jsonl-v1`, so that any Reader
can use a sidecar any Producer built. Other payload formats are allowed, but
are not portable: a Reader that does not recognise a format ignores the
sidecar (`S005`).

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
              "digest": "sha256:6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610" },
  "indexType": "lexical",
  "chunking": { "strategy": "headings-h1-h3" },
  "storage": { "format": "moca-jsonl-v1", "file": "payload/items.jsonl" },
  "createdBy": "moca-index"
}
```

| Field | Meaning |
| --- | --- |
| `target` | The package the sidecar was built from: `id`, `version` and digest. All three are required. |
| `indexType` | `lexical`, `dense`, `sparse` or `hybrid`, or another tag. |
| `model` | The embedding model: `name`, and optionally `version`, `dimensions`, `distance`. **Required** for `dense` and `hybrid` sidecars: vectors are useless without knowing the model that made them. |
| `chunking` | How the text was split. Informative. |
| `storage` | The payload `format` and its `file`, relative to the sidecar root. |

A sidecar is metadata about search only. A Reader MUST NOT derive a package's
validity, trust, configuration or credentials from it.

## 4. The `moca-jsonl-v1` payload

One JSON object per line:

```json
{"path":"refund-window.md","chunkIndex":0,"chunkCount":1,"start":802,"end":1125,"text":"# Refund eligibility window\n…"}
{"path":"refund-window.md","locale":"fr","chunkIndex":0,"chunkCount":1,"start":214,"end":452,"text":"# Délai de remboursement\n…"}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `path` | Yes | Node path relative to `content/` ([package spec §5.2](moca-package-spec.md#52-node-paths)). |
| `locale` | No | The representation's locale; absent for the default language. |
| `chunkIndex`, `chunkCount` | Yes | Position of this chunk among the representation's chunks: `0 ≤ chunkIndex < chunkCount`, and every index from 0 to `chunkCount - 1` present. |
| `start`, `end` | Yes | UTF-8 byte offsets into the node file, `0 ≤ start ≤ end ≤` file length. These let a citation point at the exact passage. |
| `text` | No | The chunk's text. |
| `vector` | No | Numbers; length equal to `model.dimensions` when that is given. |

## 5. Binding and staleness

A Reader MUST use a sidecar only when:

1. `index.json` is valid (`S001`);
2. `target.id` and `target.version` match the package (`S002`);
3. `target.digest` equals the package's computed digest (`S003`);
4. the payload format is one it supports (`S005`);
5. every item is valid and points at an existing node representation (`S004`).

If any check fails, the Reader ignores the sidecar and searches the package
directly. Any change to a package changes its digest, so a sidecar is stale as
soon as its package changes.

## 6. Enterprise vector stores

When a host indexes packages into its own vector database instead of using a
sidecar, the same principles apply: each record SHOULD carry the citation
record fields ([Reader contract §7](moca-reader-contract.md#7-citation-records))
and the package digest, so the host can detect that a package changed and
re-index only the files whose SHA-256 changed.
