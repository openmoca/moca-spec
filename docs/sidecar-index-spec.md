# MOCA Sidecar Index Specification

## 1. Scope

A MOCA sidecar index (`.moca.idx`) is an optional, derived retrieval artifact
for a MOCA package. It can support dense, sparse, hybrid, or other search
strategies without changing the target package's logical layout, conformance,
or runtime behavior.

This specification defines the portable manifest and source-addressing
contract. It does not define a vector database, query API, embedding model, or
payload serialization.

## 2. Archive Layout

A `.moca.idx` sidecar is a Zip archive or equivalent uncompressed directory
with this root layout:

```text
example.moca.idx/
├── index.json
└── payload/
    └── index.jsonl
```

`index.json` is the required, canonical sidecar manifest and MUST conform to
[`sidecar-index.schema.json`](../schemas/core/sidecar-index.schema.json).
`storage.file` identifies the storage-native payload relative to the sidecar
root. A sidecar MUST NOT use `moca-index.json` as an alternate manifest name.

The payload may be JSON, JSONL, SQLite, Lance, Parquet, an HNSW index, or any
other implementation-defined format. It may contain vectors, sparse search
structures, and format-specific metadata. Consumers that do not recognize
`storage.format` MAY ignore that sidecar.

## 3. Manifest

The manifest MUST contain `manifest_version`, `target_package_id`,
`index_type`, `item_addressing`, and `storage`. `storage.format` is an open
string tag, and `storage.file` is the relative path to its payload.

`model_info` and `chunking` describe generation choices when known. They are
metadata only; they do not configure a host model or execution environment.

The reference manifest is
[examples/indices/level-1-minimal.moca.idx/index.json](../examples/indices/level-1-minimal.moca.idx/index.json),
bound to [examples/level-1-minimal](../examples/level-1-minimal) via its
`canonicalDigest.value` (core §5.5) and verified against that target by
`scripts/validate-sidecar-index.mjs`. Its `payload/index.jsonl` demonstrates
the multi-chunk case from §5, where two items share one `content_path`.

## 4. Target Binding

`target_package_id` MUST identify the target package's `moca.json` `id`.
`target_package_hash`, when present, MUST be the SHA-256 digest of the exact
target `.moca` archive bytes, formatted as `sha256:<64 hexadecimal digits>`.
A producer MAY instead set it to the package's `canonicalDigest.value`, with
the same `sha256:` prefix. This canonical-digest form SHOULD be preferred
going forward because it survives repackaging (re-zipping), unlike a digest of
the archive bytes.

A producer SHOULD include `target_package_hash`. A consumer SHOULD calculate
the target archive digest and compare it before using a sidecar that declares
one. When a declared digest differs, a consumer MUST reject the sidecar or mark
it stale according to a documented local policy. A consumer MAY use a sidecar
without a declared digest according to local policy, but its package identity
alone cannot establish that the sidecar is synchronized with the target.

## 5. Indexed Item Addressing

Regardless of payload format, every indexed item MUST expose these logical
fields in the driver's records, columns, or metadata:

| Field | Requirement |
|---|---|
| `content_path` | Canonical path relative to the target package's `content/` directory. |
| `chunk_index` | Zero-based position of the item within that content path. |
| `chunk_count` | Positive total number of indexed items for that content path. |

The following invariant MUST hold for every item:

$$
0 \leq \text{chunk_index} < \text{chunk_count}
$$

Whole-file or node-level indexing uses `chunk_index: 0` and `chunk_count: 1`.
Many chunks may resolve to the same `content_path`. Node IDs, headings, source
text, token/character offsets, locators, and all other item metadata are
optional. A stable node ID supplements but does not replace `content_path`,
because MOCA node IDs are optional.

`content_path` MUST resolve beneath the target package's `content/` directory
and MUST NOT be absolute or use parent-directory traversal.

## 6. Harness Consumption

Sidecars are optional performance artifacts. A target `.moca` package remains
complete and usable without one. A harness MUST NOT infer package integrity,
trust, conformance, credentials, model configuration, or execution policy from
a sidecar.

Format-specific auxiliary metadata may live in the payload or in
vendor-namespaced extension files. It is not a second portable MOCA manifest
contract.
