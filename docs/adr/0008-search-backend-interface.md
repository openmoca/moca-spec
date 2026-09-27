# 0008 — One search entry point over pluggable backends, with policy in one place

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

[Reader contract §8](../../spec/moca-reader-contract.md#8-default-retrieval-policy)
says that any search built on a Reader must, by default, leave out content that
is out of force, superseded or deprecated. It must also apply the host's
audience set. Today that rule is only enforced in one place:

- `Library.search()` in `@openmoca/moca-core` enforces §8, but it is BM25 over
  whole nodes or lexical sidecar chunks. It ignores sidecar vectors.
- `moca-index` builds lexical sidecars only.
- The "enterprise" path, where a host ingests packages into its own vector
  store, is only a recommendation in a guide. Nothing enforces §8 on it.

An application that moves from a local package to a client's vector store
therefore has to change code, and it loses the policy guarantee on the way.

## Options

1. Leave search to each framework and keep §8 as guidance.
2. Put policy inside every backend.
3. Define one `search()` entry point in a Search layer. Backends only find
   candidate hits. The Search layer resolves every hit through the Reader, turns
   it into a citation record and applies §8 and the audience set.

## Decision

Option 3.

- **Backend interface.** A backend takes a query, a limit and optional filters,
  and returns hits. Each hit is a node id, a path, an optional locale, an
  optional byte span and a score
  ([search-hit schema](../../schemas/v1/search-hit.schema.json)). A backend
  declares what it supports: `lexical`, `dense`, `hybrid` and
  `filterPushdown`.
- **Policy lives in Search, not in backends.** Search re-checks every hit
  against §8 and the audience set, whatever the backend claims. Where a backend
  supports `filterPushdown`, Search also passes the filters down, so excluded
  content cannot crowd the top results out.
- **Dense search needs a host embedder whose model matches.** The host supplies
  the embedder. If it does not match the sidecar's `model`, the backend refuses
  dense search with `S006_MODEL_MISMATCH` rather than returning wrong
  neighbours.
- **Store backends drop stale hits.** Every stored record carries its package
  digest. At query time, hits from a digest that is not currently loaded are
  dropped.
- **Configuration comes from the host only.** Backend choice, store connections
  and embedders are host settings, never package content
  ([Reader contract §4](../../spec/moca-reader-contract.md#4-what-a-reader-must-never-do)).
- **Search becomes a conformance class.** The corpus tests what Search must
  never return, and the shape of what it does return. It never tests ranking,
  so lexical and dense implementations can differ.

## Consequences

- §8 is enforceable on every path, from a package on disk to a client's vector
  store, and the corpus can check it.
- An application uses one API from edge to enterprise.
- Vector storage, embedding and ranking stay with Microsoft.Extensions.VectorData,
  LlamaIndex and similar libraries. MOCA adds only trust and citation.
- Because Search over-fetches and then filters, a backend without pushdown can
  return fewer results than asked for when much of its content is excluded.
  Pushdown is the remedy, not weaker policy.

## What would change this decision

A backend whose filtering is proven equivalent to §8 by the corpus, where the
re-check is a measurable cost. Search could then trust that backend's filtering
for the fields it declares.
