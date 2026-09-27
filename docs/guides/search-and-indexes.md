# Search and sidecar indexes

A MOCA package is complete and usable without any index. When you want
semantic or hybrid search, you attach a `.moca.idx` **sidecar** — a separate,
derived artifact that binds to the package by digest.

The normative format is the
[sidecar index specification](../../spec/moca-sidecar-index-spec.md).

## Why the index is separate

Keeping retrieval data out of the package is a deliberate design decision, and
the reasoning is worth understanding because it shapes how you use it:

- **Embeddings are model-specific and perishable.** They belong to one model
  under one chunking strategy. When the model improves you rebuild them; the
  content has not changed.
- **The entry bar stays low.** Level 1 requires no embeddings, no vector
  database, no index. Search is opt-in.
- **The core format stays runtime-neutral.** Baking retrieval configuration
  into the package would break the rule that a package cannot configure your
  runtime.
- **Indexes are disposable.** Delete the sidecar and the package still works.
  That is the test the format is designed to pass.

## Search modes in the Knowledge Harness

The specification defines no retrieval engine. Search is the job of the
[Knowledge Harness](../architecture.md#pillar-2-the-knowledge-harness), which
gives an AI Harness one interface whatever the storage behind it. This section
is non-normative. It describes how Knowledge Harness implementations are
expected to search, not requirements on packages.

| Mode | How it works |
|---|---|
| **Lexical** | Keyword search over the package's Markdown and node metadata. No model and no index needed, so it works offline on any device, and it is the fallback whenever a sidecar is missing or stale. |
| **Sidecar index** | An optional `.moca.idx` next to the package, bound to it by digest (below). Supports vector and keyword (hybrid) search. The payload can be JSONL, SQLite, Parquet, or another format. |
| **Enterprise** | An existing vector database (pgvector, Qdrant, Elasticsearch, …) serving many tenants and packages, while keeping node IDs, sources, and trust data attached to every hit. |

Whatever the mode, every result carries its node identity, package and
version, `epistemicStatus`, evidence, and freshness, so the AI Harness can
cite it and apply its own trust policy.

**When a package has ontologies**, each mode gains two optional steps that
traverse the concept graph:

```text
query → ingress (ontology) → search: lexical | sidecar | enterprise → egress (ontology) → results
```

- **Ingress** maps the query onto the ontology before searching, to find the
  relevant concepts and their related, broader, or prerequisite concepts. This
  widens and focuses what gets searched.
- **Egress** traverses the results through the ontology after searching, to
  pull in connected content and to rank or filter by concept relationships.

Without ontologies both steps are skipped and the search runs directly.

## Building one

```sh
npx @openmoca/moca-index build ./my-package -o my-package.moca.idx --zip
```

`-o` writes a directory by default, or a single archive with `--zip`. The
target needs a `moca.json` with an `id` and at least one Markdown file under
`content/`.

`moca-index` **self-validates before writing** — schema conformance, the chunk
addressing invariant, and (when bound) that `target_package_hash` still
matches the target's actual `canonicalDigest`. It is fail-closed: nothing is
written if that check fails, so a successful run is already a valid sidecar.

## Layout

```text
my-package.moca.idx/
├── index.json          # required manifest
└── payload/
    └── index.jsonl     # storage-native payload
```

`index.json` is the portable contract. The payload can be JSONL, SQLite,
Parquet, Lance, an HNSW index — whatever your retrieval stack wants. A
consumer that doesn't recognise `storage.format` simply ignores that sidecar.

## Binding to the target

This is the part that matters for correctness.

`target_package_id` identifies the target's manifest `id`.
`target_package_hash`, when present, should be the target's
`canonicalDigest.value` prefixed `sha256:`.

The specification also permits binding to the digest of the exact `.moca`
archive bytes, but **prefer the canonical digest**: it survives repackaging,
whereas an archive digest changes when you re-zip the identical content.

Building against a target with no `canonicalDigest` requires
`--allow-unbound`, and produces a sidecar that cannot prove it is
synchronised. Avoid it outside experiments.

### Rebinding after the target changes

The target's digest covers its manifest, so **any** edit to the target —
content or metadata — changes the digest and leaves the sidecar stale. Either
rebuild the sidecar or update its `target_package_hash`. In this repository
`npm run refresh:derived` re-binds sidecars automatically after refreshing
package digests.

## Item addressing

Whatever the payload format, every indexed item must expose three fields:

| Field | Meaning |
|---|---|
| `content_path` | Path relative to the target's `content/` |
| `chunk_index` | Zero-based position within that file |
| `chunk_count` | Total chunks for that file |

with `0 ≤ chunk_index < chunk_count` always holding. Whole-file indexing uses
`chunk_index: 0, chunk_count: 1`. Many chunks may share one `content_path`.

`content_path` must resolve beneath the target's `content/` — never absolute,
never using parent traversal. This is what lets a consumer take a retrieval
hit and safely resolve it back to real content.

Node IDs, headings, offsets, and other metadata are optional. A node ID
supplements `content_path` but never replaces it, because MOCA node IDs are
themselves optional.

## Consuming a sidecar

Before using one:

1. Check `target_package_id` matches the package you loaded.
2. If `target_package_hash` is declared, verify it. On mismatch you MUST
   reject the sidecar or mark it stale under a documented local policy.
3. A sidecar with no declared hash MAY be used per local policy — but package
   identity alone does not prove synchronisation.

**Never infer trust from a sidecar.** A Knowledge Harness MUST NOT take package
integrity, conformance, credentials, model configuration, or execution policy
from an index. It is a retrieval accelerator and nothing else.

## Current tooling limits

`moca-index` v1 is deliberately small: one chunk per content file, and a
single lexical (no embedding vectors) index type. `--embedder` accepts only
`none` today; the flag exists so a real embedding backend can be added without
a CLI redesign. Composed targets are not supported yet.

The *format* has none of these limits — it is open to any chunking strategy
and any payload. Nothing stops you generating a conformant sidecar with your
own tooling, and that is an expected use.

## Example

[examples/sidecars/level-1-minimal.moca.idx](../../examples/sidecars/level-1-minimal.moca.idx)
is a real sidecar bound to [level-1-minimal](../../examples/level-1-minimal)
by canonical digest, verified in CI. Its payload demonstrates the multi-chunk
case where two items share one `content_path`.
