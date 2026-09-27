# 0003 — Knowledge Harness implementations and the Reader/Producer split

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md#current-model))
- **Supersedes:** the "Core SDKs across languages" direction previously in
  [ROADMAP.md](../../ROADMAP.md) (TypeScript first, then Python, then .NET,
  all inside this repository)

## Context

[ADR-0002](0002-three-pillar-architecture.md) introduces the Knowledge Harness:
an open-source engine that gives any AI one interface to MOCA knowledge. That
raises two questions the previous roadmap answered differently.

**Where do implementations live, and in which order?** The roadmap planned
"core SDKs" inside this repository through `1.0.0`, TypeScript first. The
TypeScript argument was that `tools/moca-lint/lib/` already implements most of
the SDK surface. But the first AI Harness products and their hosts are .NET,
and an implementation nobody consumes cannot test the specification.

**What does a consumer that only reads and searches need?** The
[SDK contract](../../spec/moca-sdk-contract.md) mixed two jobs: reading a
package (open, validate, traverse, verify, resolve, bind an index) and producing
one (manifest creation). The reference tooling adds more producer work on top:
packing archives, linting in full, signing, building indexes and converting
sources. An AI system that searches a package at runtime needs the first set and
none of the second. Making every Knowledge Harness carry authoring dependencies
would work against the lightweight, offline-capable deployments MOCA is for.

## Decision drivers

- **A real consumer first.** The first implementation should be the one a real
  AI Harness uses, so that its findings feed the specification.
- **Lightweight reads.** Read-and-search must work with no authoring
  dependencies, on a device, offline.
- **Cross-language consistency.** Implementations must agree on what a package
  means. That is the job of the shared [conformance corpus](../../conformance/README.md),
  not of shared code.
- **Independent cadence.** Search backends, embedding models and framework
  adapters carry third-party dependency surfaces the specification should not
  inherit.

## Considered options

1. **SDKs in this repository, TypeScript first** (the previous roadmap).
2. **One multi-language Knowledge Harness repository.**
3. **One Knowledge Harness repository per language — .NET, then Python, then
   TypeScript — with the SDK contract split into Reader and Producer
   conformance classes.**

## Decision outcome

**Chosen: option 3.**

**Repositories and order.**

| Order | Repository | Status |
|---|---|---|
| 1 | `openmoca/moca-knowledge-harness-dotnet` | Planned |
| 2 | `openmoca/moca-knowledge-harness-python` | Planned |
| 3 | `openmoca/moca-knowledge-harness-typescript` | Planned |

Each consumes the conformance corpus from this repository and never vendors it
(see [GOVERNANCE.md](../../GOVERNANCE.md#repository-layout-openmoca-org)).

**Two conformance classes in the SDK contract.**

| Class | Covers | Implemented by |
|---|---|---|
| **Reader** | Open a package, validate the manifest, traverse content, report diagnostics, verify integrity and signatures, resolve composition, discover profiles, bind a sidecar index | Every Knowledge Harness |
| **Producer** | Reader, plus manifest creation, archive writing, signing, sidecar building and full linting | Authoring tooling — today the TypeScript CLIs under [`tools/`](../../tools) |

A Knowledge Harness is a Reader-class implementation plus search. Search is not
part of the contract: [ADR-0002](0002-three-pillar-architecture.md) keeps
retrieval out of the specification.

Where a language offers Producer capabilities, it ships them as a separate
package from the Reader, so a read-and-search consumer never takes on
authoring dependencies.

**The TypeScript library stays inside the CLIs.** `tools/moca-lint/lib/`
remains the reference Producer implementation and an internal library of the
four CLIs. It is not extracted into a published SDK ahead of the
`moca-knowledge-harness-typescript` repository.

Option 1 is rejected because it starts with the language no AI Harness host is
using yet. Option 2 is rejected because it couples the release cadence of every
language to the slowest one, and brings all their toolchains into one CI run.

## Consequences

**Positive.** The first implementation is exercised by a real consumer. A
runtime reader stays small. The specification repository keeps one toolchain.
The conformance corpus becomes what binds implementations together, which is
the role it was designed for.

**Negative.** Findings from implementations now cross a repository boundary
before they reach the specification. [GOVERNANCE.md](../../GOVERNANCE.md)
previously argued against exactly this for a solo-maintained project. The
mitigation is to file specification findings as issues in this repository, and
for each implementation to pin a conformance-corpus version. Separating the
Reader class is also a change to the SDK contract, recorded in
[MIGRATIONS.md](../../MIGRATIONS.md).

**Neutral.** No package, schema or conformance-level change. The Producer
class describes what the existing CLIs already do.
