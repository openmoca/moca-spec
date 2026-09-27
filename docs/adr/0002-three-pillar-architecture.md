# 0002 — Three pillars: package, Knowledge Harness, AI Harness

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md#current-model))
- **Supersedes:** —

## Context

Until now the specification described a three-layer system
([core §1.1](../../spec/moca-core-spec.md#11-the-three-pillar-architecture)
before this change):

```text
Application / Host   — identity, tenancy, PII policy, authorization
AI Harness           — retrieval, prompt assembly, agent routing, tools, memory
MOCA package         — concepts, content, evidence, provenance  (inert)
```

This model puts two very different jobs in the AI Harness layer:

- **Getting knowledge out of a package.** Opening it, validating it,
  resolving locales and composition, verifying integrity and signatures,
  binding an index, and searching. This work is the same for every
  consumer. The [SDK contract](../../spec/moca-sdk-contract.md) and the
  [consuming guide](../guides/consuming.md) already describe most of it, and
  none of it depends on what the AI is *for*.
- **Deciding what to do with that knowledge.** Agents, prompts, workflow,
  what to do with `disputed` or stale content, and whether to run a skill.
  This work is specific to one use case.

Keeping both in one layer has three costs:

1. **Every consumer rebuilds retrieval.** Nobody owns the shared part, so each
   AI system that reads MOCA writes its own loader, its own degradation
   behaviour and its own search. Divergence in exactly the behaviour the
   conformance suite exists to prevent is left to chance.
2. **"Not a retrieval engine" reads as a gap rather than a boundary.** The
   specification is right to stay retrieval-neutral, but with nothing
   positioned above it, adopters hear "you must build search yourself".
3. **Storage portability is claimed but not delivered.** A package may be
   searched as files, through a `.moca.idx` sidecar, or from an enterprise
   vector database. If each AI system codes against one of these directly,
   moving between them means rewriting it.

## Decision drivers

- **Keep the specification retrieval-neutral.** The package format must not
  gain a query API, a ranking model or an embedding choice.
- **Adoption.** The shortest path from "I have a package" to "my AI answers
  from it with citations" decides whether MOCA is used.
- **One conclusion per package.** Different consumers must reach the same view
  of a package's validity, trust and content.
- **Replaceable layers.** Changing the model, the vector store or the agent
  framework must not force changes to the others.

## Considered options

1. **Keep the three layers.** Retrieval stays inside each AI Harness, and the
   SDK contract remains the only shared piece.
2. **Specify retrieval in the specification.** Add a normative query API and
   search semantics to core.
3. **Three pillars.** Split the old AI Harness layer in two. A shared,
   open-source **Knowledge Harness** gives any AI one interface to MOCA
   knowledge, wherever it is stored. The **AI Harness** above it holds only
   use-case behaviour.

## Decision outcome

**Chosen: option 3.**

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

| Pillar | Owns | Openness |
|---|---|---|
| 1. MOCA Package | Content, identity, provenance, trust metadata | Open standard (this repository) |
| 2. Knowledge Harness | One interface for loading, validating and searching packages | Open source, separate repositories ([ADR-0003](0003-knowledge-harness-implementations.md)) |
| 3. AI Harness | Agents, prompts, workflow and experience for one use case | Built by whoever builds the product |

Option 2 is rejected because it would tie the format to one retrieval design.
Retrieval changes faster than knowledge does. Option 1 is rejected for the
three costs listed under Context.

Where responsibilities fall:

| Concern | Layer |
|---|---|
| Opening, validating, locale and identity resolution | Knowledge Harness |
| Integrity and signature verification; withholding unsigned `skills/` | Knowledge Harness |
| Composition resolution (with a resolver the host supplies) | Knowledge Harness |
| Index binding and search: lexical, sidecar, enterprise vector store | Knowledge Harness |
| Ontology-aware query expansion and result traversal | Knowledge Harness |
| What to do with `disputed`, stale or `conflictsWith` content | AI Harness |
| Running a skill; filtering `allowed-tools` against host policy | AI Harness |
| Identity, tenancy, PII, authorization, resolver supply | Host |

## Consequences

**Positive.** Retrieval gets an owner, and the specification can stay neutral
about it without that neutrality being a gap. A new AI Harness needs no new
content format or retrieval code. The Knowledge Harness is the natural home for
the planned MOCA MCP server and framework adapters. The core-boundary audit in
[plan 04](../plans/04-reference-consumer-core-audit.md) gets a permanent place
to instrument field access.

**Negative.** There is one more component to build and version, in several
languages. The specification's own wording has to change: normative rules that
said "a harness" must now name the layer they bind. That is an editorial change
to [core §1.1](../../spec/moca-core-spec.md#11-the-three-pillar-architecture),
the [trust model](../../spec/moca-trust-model.md) and the
[sidecar index spec](../../spec/moca-sidecar-index-spec.md), with no change to
package validity.

**Neutral.** No package changes. The format, schemas and conformance levels are
unaffected. The search modes the Knowledge Harness offers are described in
non-normative documentation
([architecture](../architecture.md),
[search and indexes](../guides/search-and-indexes.md)), not specified.
