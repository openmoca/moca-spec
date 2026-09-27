# Architecture: the three pillars

MOCA (Modular Ontology & Content Assembly) is lightweight, portable grounding
for AI, for local or online use. It is an open file format for the knowledge
an AI system uses. That knowledge keeps its sources, versions, and trust
status, and it stays useful when you change model, vendor, vector database, or
agent framework.

MOCA rests on three pillars:

1. **The MOCA package**: an open standard. It is inert data: a `moca.json`
   manifest plus Markdown content.
2. **The Knowledge Harness**: an open-source engine. It gives any AI one
   interface to MOCA knowledge, wherever that knowledge is stored.
3. **The AI Harness**: the product. It is built for one use case on top of the
   two open layers.

This page is non-normative. The normative layer definitions are in
[core §1.1](../spec/moca-core-spec.md#11-the-three-pillar-architecture), and
the reasoning is in [ADR-0002](adr/0002-three-pillar-architecture.md) and
[ADR-0003](adr/0003-knowledge-harness-implementations.md).

## The problem

AI grounding today is usually locked into heavy vector databases and bespoke
pipelines. It is expensive to move, it can't run offline, and it loses its
sources along the way.

Knowledge for AI usually lives in one of two places, and both lose
information:

- **Formats built for people:** wikis, PDFs, shared drives. They keep the text
  but not what a machine needs to trust it: stable IDs, sources, review dates,
  or which version is current. That context is thrown away at ingestion.
- **One runtime's own store:** a monolithic vector database, a fine-tune, or a
  bespoke RAG pipeline. Here the structure belongs to the tool. Embeddings are
  tied to one model and chunking to one strategy. Moving means rebuilding from
  the original documents, and the store is often too large to run on a device.

So each new model, vendor, or pipeline means rebuilding the same knowledge,
and nobody can say for sure where an answer came from or whether a human
checked it.

MOCA makes the knowledge itself the durable asset: a small set of files that
can ground an AI on a laptop with no connection or in a cloud platform.
Indexes and pipelines become caches you can rebuild from it.

## The stack

```text
┌──────────────────────────────────────────────────────────┐
│  Host application                                        │
│  identity · tenancy · PII redaction · access control     │
└────────────────────────────┬─────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────┐
│  3. AI Harness — the product, one per use case           │
│  agents · prompts · workflow · trust-signal policy       │
└────────────────────────────┬─────────────────────────────┘
                             │  asks for knowledge
                             ▼
┌──────────────────────────────────────────────────────────┐
│  2. Knowledge Harness — open source, shared              │
│  open · validate · verify · resolve · search · cite      │
└────────────────────────────┬─────────────────────────────┘
                             │  reads
                             ▼
┌──────────────────────────────────────────────────────────┐
│  1. MOCA Package — open standard, inert data             │
│  manifest · content · evidence · provenance · trust      │
└──────────────────────────────────────────────────────────┘
```

Content lives in the package, retrieval in the Knowledge Harness, and
behaviour in the AI Harness. You can replace any layer without touching the
others. The two lower layers are open and shared; the top layer is where
products are built.

| Pillar | What it owns | Openness |
|---|---|---|
| 1. MOCA Package | Content, identity, provenance, trust metadata | Open standard — this repository |
| 2. Knowledge Harness | One interface for loading, validating, and searching packages | Open source, shared by every AI Harness |
| 3. AI Harness | Agents, prompts, workflow, and experience for one use case | Your product |

A host application sits above all three. It owns identity, tenancy, PII
redaction, and access control, which MOCA deliberately leaves out.

## Pillar 1: the MOCA package

A MOCA package is a folder of Markdown that keeps its context: a directory, or
a `.moca` Zip of one, with a `moca.json` manifest and CommonMark files under
`content/`. The minimum is a manifest with `id`, `version`, and `title`, plus
one Markdown file.

```text
knowledge.moca
├── moca.json
├── content/
│   ├── refund-policy.md
│   └── refund-policy.fr-FR.md
├── ontologies/        optional
└── skills/            signed only
```

| Capability | What it gives a Knowledge Harness and an AI Harness |
|---|---|
| Identity and versions | Package and node IDs that survive moves and re-indexing; `supersedes` retires older versions |
| Freshness | `validFrom` and `lastReviewed` dates on nodes and packages |
| Status | Per-node epistemic status: `verified`, `sourced`, `inferred`, `generated`, `disputed`, `deprecated` |
| Evidence | Claims point to their source, down to a page or a timestamp (mapped to W3C PROV-O) |
| Integrity and trust | Per-file SHA-256 digests, a reproducible `canonicalDigest`, and mandatory signing for skills |
| Composition | Packages assembled from other packages without copying content |
| Profiles | Domain vocabulary (for example the EU AI Act) layered on without changing core |

A manifest never contains endpoints, settings, credentials, or API keys
([core §5.3](../spec/moca-core-spec.md#53-excluded-properties)). `moca-lint`
fails a package that has them, but that is a check, not a guarantee, so a host
should treat package contents as untrusted. A package is inert data, not
configuration for the system that reads it.

Every package meets one of three
[conformance levels](../spec/moca-core-spec.md#3-conformance-levels): Core
(manifest plus Markdown), Semantic (ontologies and SHACL validation), or
Extended (Web Annotation locators, signing, skills). The level is derived from
what the package contains and what validates; it is never declared. Most
packages should be Level 1 — see [choosing a level](guides/choosing-a-level.md).

## Pillar 2: the Knowledge Harness

The Knowledge Harness gives any AI one interface to MOCA knowledge, wherever
it is stored. The AI asks for knowledge and the Knowledge Harness finds it. The
AI never needs to know whether the knowledge lives in package files, a local
sidecar index, or an enterprise vector database.

```text
AI Harness  →  Knowledge Harness  →  MOCA package files
(asks)         (finds, checks,       Local sidecar index (.moca.idx)
                returns cited        Enterprise vector database
                knowledge)
```

It is a separate open-source project built on the specification. The
specification deliberately defines no retrieval engine, which keeps the format
neutral; the Knowledge Harness is where retrieval lives. Its interface is a
programming interface in each language's library, not a REST web API.

### Design principles

- **Storage-agnostic:** package files, a sidecar index, or a vector database,
  all behind the same interface.
- **Model-agnostic:** works with any LLM and any agent framework.
- **Graceful fallback:** with no index, or a stale one, it still searches the
  package itself.
- **Grounded and safe:** every result keeps its source, status, and
  freshness. It never runs code found in a package, and it withholds `skills/`
  from any package whose signature does not verify.

### Built on the SDK contract

Every Knowledge Harness implements the **Reader class** of the
[SDK contract](../spec/moca-sdk-contract.md): open a package, validate it,
list its nodes, report diagnostics, verify integrity and signatures, resolve
composition, discover profiles, and bind an index. The shared
[conformance suite](../conformance/README.md) means implementations in
different languages reach the same conclusions about a package. What the
guide to [consuming a package](guides/consuming.md) describes is exactly this
behaviour.

The contract's **Producer class** — manifest creation, integrity production,
archive writing, signing, index building — is authoring tooling. A
Knowledge Harness that only reads and searches never takes on those
dependencies.

### Three ways to search, behind one interface

| Mode | How it works |
|---|---|
| **Lexical** | Keyword search over the package's Markdown and node metadata. No model or index needed. |
| **Sidecar index** | An optional `.moca.idx` file next to the package, bound to it by digest. Supports vector and keyword (hybrid) search. |
| **Enterprise** | Existing vector databases (pgvector, Qdrant, Elasticsearch). Supports many tenants and packages and keeps node IDs, sources, and trust data. |

When a package has ontologies, each mode gains an **ingress** step (map the
query onto the concept graph before searching) and an **egress** step
(traverse the results through it afterwards). See
[search and indexes](guides/search-and-indexes.md#search-modes-in-the-knowledge-harness).

The index is disposable: rebuild it for a new embedding model, or delete it,
and the package still works.

### Implementations

Each language has its own repository, released on its own cadence and pinned
to a conformance-suite version:

| Order | Repository | Status |
|---|---|---|
| 1 | `openmoca/moca-knowledge-harness-dotnet` | Planned |
| 2 | `openmoca/moca-knowledge-harness-python` | Planned |
| 3 | `openmoca/moca-knowledge-harness-typescript` | Planned |

## MOCA tooling

| Tool | Status | What it does |
|---|---|---|
| **Command line** (`@openmoca` on npm) | Available | [`moca-convert`](../tools/moca-convert/README.md) builds packages from Markdown, Obsidian, and OpenAPI; [`moca-lint`](../tools/moca-lint/README.md) validates, packs, and extracts; [`moca-index`](../tools/moca-index/README.md) builds sidecar indexes; [`moca-sign`](../tools/moca-sign/README.md) signs and verifies. All run in CI. These are the Producer-class tooling. |
| **MOCA MCP server** | Planned | Loads packages through the Knowledge Harness, so developers can search, inspect, and validate them from any MCP client. Runs locally, so private packages stay private. |
| **Libraries and adapters** | Planned | The Knowledge Harness libraries above, and adapters for agent frameworks (LangChain, LlamaIndex, Microsoft Agent Framework). |

The MCP server will also be the quickest way to try MOCA: point it at a
package and start asking questions.

## Pillar 3: the AI Harness

The AI Harness is the product, and each one is built for a single use case.
The package and the Knowledge Harness are open and shared; the AI Harness is
where value is built.

What makes an AI Harness worth building:

- **Domain expertise:** methods, rules, and workflows for the job.
- **The experience:** agents, prompts, and user experience.
- **Outcomes:** reporting and integrations with the customer's systems.

| Example AI Harness | What it does with MOCA |
|---|---|
| Support assistant | Prefers `verified` answers, flags `disputed` ones, and refuses content past its review date |
| Compliance assistant | Answers only from the policy version in force, cites the clause, and records the `canonicalDigest` it read |
| Field service assistant | Gives technicians the current repair procedure from manuals and service bulletins, offline on site, and flags anything superseded |

The AI Harness decides how to use MOCA's trust signals, such as what to do
with disputed, stale, or conflicting content, and whether to execute a skill
the Knowledge Harness has verified. It is built on any agent framework
(Microsoft Agent Framework, LangGraph, CrewAI, or plain code); MOCA feeds these
frameworks rather than replacing them. Because the layers below are shared, a
new AI Harness doesn't need new content formats or retrieval code.

The same package and AI Harness run everywhere, from a device offline to a
cloud platform; only the Knowledge Harness search mode and the host around it
change.

## Common questions

**Why not just a vector database?** A vector index is derived data: one
model's embeddings under one chunking scheme. MOCA treats it as a disposable
sidecar bound to the package by digest, and the Knowledge Harness can still
search an existing enterprise store. The package is the source of truth; the
index is a cache.

**Why not a folder of Markdown?** A Level 1 package *is* a folder of Markdown
with a small manifest, so nothing is lost. The difference shows when content
moves between teams or organisations, when someone asks where a claim came
from, or when you need proof that the bytes served are the bytes published.

**Why not fine-tune?** A fine-tune bakes knowledge into weights, where it
can't be audited, corrected, dated, or attributed.

**Why is the Knowledge Harness separate from the specification?** So the
format can stay neutral about retrieval, which changes much faster than
knowledge does, while adopters still get a working, shared search engine
instead of writing their own.

**How does it relate to MCP?** MCP is a transport for handing context to a
model; MOCA is the artifact being handed over. The planned MOCA MCP server
connects the two through the Knowledge Harness.

**Where is MOCA a poor fit?** Fast-changing operational data (tickets,
metrics, inventory), and content one team uses in one pipeline with no reuse
or provenance needs. See [use cases](use-cases.md#where-moca-is-a-poor-fit).

## Where next

- [Why MOCA?](why-moca.md) — the longer argument and the non-goals.
- [Quickstart](quickstart.md) — a valid package in five minutes.
- [Consuming a package](guides/consuming.md) — what a Knowledge Harness does.
- [Roadmap](../ROADMAP.md) — what is delivered and what comes next.
