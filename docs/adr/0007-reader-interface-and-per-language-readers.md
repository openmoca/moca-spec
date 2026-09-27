# 0007 — A language-neutral Reader interface here, one Reader repository per language

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes:** [0003](0003-reader-mcp-server-and-adapters.md)

## Context

MOCA has two purposes:

1. Moving knowledge between platforms securely and verifiably.
2. Reading and integrating packages locally, on edge devices or on
   infrastructure a client owns.

[ADR-0003](0003-reader-mcp-server-and-adapters.md) chose one reference Reader
in TypeScript, with an MCP server as the main cross-language interface. It
allowed a native Reader in another language only "when an adopter needs to
load packages in-process in that language".

That trigger has now been met, and purpose 2 makes it the normal case rather
than the exception:

- An MCP server is a separate process. That works on a desktop or a server, but
  not inside a mobile app, an embedded device, or a locked-down client network
  that will not run Node.
- Framework integration happens in the framework's own types. LangGraph wants
  a retriever and the Microsoft Agent Framework wants a context provider. An
  out-of-process MCP server cannot be either.
- A first .NET host application needs to load packages in-process.

ADR-0003's concern was scale: one maintainer carrying a retrieval harness in
three languages. That concern still holds, and the guardrails below exist to
contain it.

## Options

1. Keep ADR-0003. Other languages talk to the TypeScript Reader through MCP.
2. Build a full retrieval harness per language, including embedding and vector
   storage.
3. Define a language-neutral Reader interface in this repository, and build a
   thin Reader per language in its own repository, tested against the shared
   conformance corpus.

## Decision

Option 3.

- **This repository owns the interface.** The
  [Reader interface](../../spec/moca-reader-interface.md) names the operations
  and data shapes every Reader offers. It has three layers:
  - **Reader:** open, check, verify, resolve members, and produce citation
    records.
  - **Search:** one `search()` over pluggable backends, with the default
    retrieval policy applied in one place ([ADR-0008](0008-search-backend-interface.md)).
  - **Bindings:** map citation records to a framework's own types.

  The schemas and the conformance corpus stay here too.
- **Each language gets its own Reader repository**, for example
  `openmoca/moca-reader-dotnet` and `openmoca/moca-reader-python`. A Reader
  consumes a released corpus and never vendors it.
- **Languages are added one at a time, each tied to a real consumer.**
  TypeScript comes first, because `@openmoca/moca-core` already exists here as
  the reference Reader. .NET comes next, for the first host. Python is built on
  demand.
- **A Reader ships only when it passes the whole corpus.** That includes the
  Search class cases in [Reader contract §2](../../spec/moca-reader-contract.md#2-conformance-classes).
- **Bindings wrap framework abstractions and never duplicate them.** Vector
  storage, embedding and ranking stay with the framework. A binding never
  changes what a citation record says.
- **The MCP server is one host of a Reader,** not a replacement for one.
- **The word "harness" is retired** for MOCA's own components.

## Consequences

- Hosts in other languages can read and search packages in-process, offline,
  and inside their framework's own types.
- There are several Readers to keep consistent. The conformance corpus becomes
  the main safeguard, so it has to cover search policy as well as package
  checks, and other repositories must be able to run it (see the runner
  protocol in [conformance/README.md](../../conformance/README.md)).
- Maintainer load grows with each language. The one-language-at-a-time rule and
  the named-consumer rule keep that growth tied to real adoption.
- The TypeScript Reader, the command-line tools and the MCP server stay in this
  repository for now. Once a second Reader passes the corpus through the
  external runner, they can move to their own repositories, leaving this one to
  hold the specification, schemas, profiles and corpus.

## What would change this decision

- Several language Readers that drift apart despite the corpus. That would be a
  reason to generate them from one core, for example through WebAssembly.
- No consumer appearing for a language within a release or two of its Reader
  shipping. That would be a reason to archive the Reader.
