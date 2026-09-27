# 0003 — One Reader, an MCP server and framework adapters, not a harness per language

- **Status:** Superseded by [0007](0007-reader-interface-and-per-language-readers.md)
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

An earlier plan proposed a "Knowledge Harness": a retrieval library with three
search modes, built separately in .NET, Python and TypeScript. Most of that
already exists. LlamaIndex, LangChain and Haystack, and in .NET
Microsoft.Extensions.VectorData and Microsoft.Extensions.DataIngestion, already
load, chunk, embed, store and filter content across many vector stores. MCP has
become the common way to give any agent, in any language, access to knowledge.

What those frameworks lack is MOCA-specific: verifying digests and
attestations, withholding unsigned skills, resolving pinned members, and
turning trust signals into metadata an application can filter and cite.

## Options

1. A full retrieval harness per language.
2. One reference Reader, an MCP server on top of it, and thin adapters that
   feed each framework's own ingestion pipeline.

## Decision

Option 2.

- **[`@openmoca/moca-core`](../../tools/moca-core/README.md)** is the reference
  Reader: open, check, digest, verify, resolve, cite. It includes a small
  lexical search so that offline and sidecar use work without any framework.
- **[`@openmoca/moca-mcp`](../../tools/moca-mcp/README.md)** serves packages to
  any MCP client. It is the main cross-language interface.
- **Adapters** for LlamaIndex, LangChain and Microsoft.Extensions.DataIngestion
  map citation records to each framework's metadata. They are small and live
  in their own repositories.
- A native Reader in another language is built only when an adopter needs to
  load packages in-process in that language. The conformance corpus keeps
  implementations consistent.
- The **citation record** is the one normative contract between a Reader and
  an application ([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)).

## Consequences

- One Reader to maintain instead of three harnesses.
- Retrieval quality is whatever the adopter's framework provides. MOCA does not
  compete on it.
- The layers are simply "the package" and "a Reader". The application is not a
  MOCA layer; it is the adopter's product.

## What would change this decision

An adopter who cannot use MCP or an existing framework and needs a native
Reader in another language. That is a reason to build one, with the corpus as
its test suite.
