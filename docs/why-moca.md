# Why MOCA?

MOCA is a file format for knowledge you want an AI system to use — one that
stays useful after you change model, vendor, vector database, or framework.

This page explains the problem it solves, and is deliberately explicit about
what it does *not* do. If you are already convinced, go to the
[quickstart](quickstart.md).

## The problem

Knowledge that AI systems consume today usually lives in one of two places,
and both are lossy.

**In formats built for people.** A Confluence space, a folder of PDFs, a
Notion database, an Obsidian vault, a SharePoint drive. These carry the text
but nothing a machine can rely on: no stable identifier for a passage, no
record of where a claim came from, no statement of whether anyone has checked
it recently, no way to tell a superseded policy from the current one. When you
point a retrieval pipeline at them, that context is discarded at ingestion —
and the answers your system produces inherit the gap.

**In a runtime's own store.** A vector index, a fine-tune, a bespoke RAG
pipeline's database. This carries structure, but the structure belongs to the
tool. Embeddings are tied to one model. Chunking is tied to one strategy.
Migrating means re-deriving everything, and there is no portable artifact to
migrate *from* — the source material is back in the first category.

The result is that the knowledge itself is never the durable asset. The
pipeline is, and pipelines get replaced.

## What MOCA is

MOCA is a directory (or a Zip of one) with a `moca.json` manifest and
CommonMark files under `content/`. That is the whole of Level 1, and it is
readable with `JSON.parse` and any Markdown library.

What the manifest adds on top of "a folder of Markdown":

| Capability | What it gives you |
|---|---|
| **Stable identity** | The package and each node have identifiers that survive being moved, copied, or re-indexed. |
| **Content versioning** | A semantic `version`, plus `supersedes` to say which package this replaces. |
| **Freshness** | `validFrom` and `lastReviewed` — so a consumer can tell "reviewed last month" from "written in 2019 and never checked". |
| **Provenance and evidence** | A claim can point at the source that supports it, down to a page or a timestamp, mapped to PROV-O. |
| **Epistemic status** | Per-node: is this `verified`, merely `sourced`, `inferred`, `generated`, or `disputed`? |
| **Integrity** | Per-file SHA-256 digests plus a reproducible whole-package `canonicalDigest`. |
| **Composition** | One package can be assembled from others, or relate to them, without copying content. |
| **A trust boundary** | Executable content (`skills/`) must be cryptographically signed, and a harness must refuse it otherwise. |

None of that is required to start. A valid Level 1 package needs three
manifest fields and one Markdown file.

## Why not just…?

**…a folder of Markdown?** For a single project maintained by one team, that
may genuinely be enough — and a MOCA Level 1 package *is* a folder of Markdown
with a small manifest, so you have lost nothing by using one. The difference
shows up when content is exchanged between teams or organisations, when
someone asks "where did this claim come from and who checked it?", or when you
need to prove the bytes you are serving are the bytes that were published.

**…a vector database?** A vector index is *derived* data: one model's
embeddings under one chunking strategy. When the model improves, you rebuild
it. MOCA treats the index as exactly that — an optional
[sidecar](guides/search-and-indexes.md) that binds to the package by digest
and can be thrown away and regenerated. The package is the source of truth;
the index is a cache.

**…RAG over PDFs?** That is a pipeline, not a format. It answers "how do I
retrieve" but leaves "what am I retrieving from, and can I trust it" unowned.
MOCA is the artifact such a pipeline consumes.

**…just fine-tune the model?** A fine-tune bakes knowledge into weights, where
it cannot be audited, corrected, dated, or attributed. MOCA keeps knowledge as
inspectable data outside the model.

## What MOCA is not

Being explicit here, because a format that claims everything is useless:

- **Not a retrieval engine.** MOCA does not specify how to search. It defines
  an optional sidecar index format and stops there — no query API, no
  ranking, no embedding model.
- **Not a runtime or an agent framework.** A package contains no endpoints, no
  model selection, no temperature, no credentials. These are *forbidden* in a
  manifest ([core §5.3](../spec/moca-core-spec.md#53-excluded-properties)) —
  a MOCA package cannot make your system call anything.
- **Not a database.** It is files. Put them in object storage, a git repo, or
  shred them into a database — the format does not care.
- **Not an authorization system.** Who may read a package is the host
  application's decision. MOCA carries no ACLs and no identity.
- **Not a replacement for your CMS.** It is an interchange and consumption
  format. Authoring can continue wherever it happens today;
  [`moca-convert`](../tools/moca-convert/README.md) exists to bridge from
  Markdown directories, Obsidian vaults, and OpenAPI documents.
- **Not a semantic-web project in disguise.** JSON-LD, ontologies, and SHACL
  are Level 2 features you opt into. Level 1 has no RDF in it at all.

## The layering that makes this work

MOCA packages are inert data. Everything that *acts* sits above them:

```text
Application / Host   — identity, tenancy, PII policy, authorization
        ▲
AI Harness           — retrieval, prompt assembly, tool execution, memory
        ▲
MOCA package         — concepts, content, evidence, provenance  (inert)
```

The rule that makes the boundary real: **loading a package must never execute
anything.** The one category of package content that is executable-adjacent —
`skills/` — must be signed, and a harness must refuse to load it from an
unsigned or signature-invalid package
([core §8.2](../spec/moca-core-spec.md#82-security--trust-boundary-rule)).

## Where this is honest about maturity

MOCA is at `0.1.0-beta.1`. The format is not stable, there is no `1.0.0`
compatibility promise yet, and the SDKs that will exercise it in anger are not
built. The specification, schemas, examples, and four reference CLIs are real
and tested; treat everything as subject to change until `1.0.0`. See
[versioning and release](versioning-and-release.md).

## Next

- [Use cases](use-cases.md) — what people actually build with this, and how
  MOCA compares to adjacent standards.
- [Quickstart](quickstart.md) — a package in five minutes.
- [Choosing a conformance level](guides/choosing-a-level.md) — how far up the
  stack you actually need to go.
- [Consuming a package](guides/consuming.md) — the harness side.
