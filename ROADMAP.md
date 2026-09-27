# Roadmap

MOCA's job is narrow: a package layer that makes OKF knowledge exchangeable,
verifiable, composable and citable. The roadmap is ordered by what would prove
or disprove that it is worth having.

This file describes direction. What shipped is in [CHANGELOG.md](CHANGELOG.md).

## Done in 0.3.0-alpha.1

- A language-neutral [Reader interface](spec/moca-reader-interface.md), with one
  Reader repository per language
  ([ADR-0007](docs/adr/0007-reader-interface-and-per-language-readers.md),
  superseding ADR-0003).
- One search entry point over lexical, dense-sidecar and store backends, with
  the default retrieval policy applied to every hit, and a Search conformance
  class ([ADR-0008](docs/adr/0008-search-backend-interface.md)).
- The [ontology profile](profiles/ontology/moca-ontology-profile.md)
  ([ADR-0009](docs/adr/0009-ontology-profile.md)).
- `self-contained-evidence`, quote checks against in-package sources, and
  `evidence[].verified` ([ADR-0010](docs/adr/0010-self-contained-evidence.md)).
- A 57-case corpus that a Reader in any language can run through an adapter.

## Done in 0.2.0-alpha.1

- Package layer over OKF v0.2 ([ADR-0001](docs/adr/0001-package-layer-over-okf.md)).
- Computed digest with fail-closed entry rules; members pinned by digest;
  detached package and review attestations ([ADR-0002](docs/adr/0002-computed-digest-and-detached-attestations.md)).
- Reference Reader, citation records, default retrieval policy, MCP server
  (ADR-0003, since superseded).
- Named capabilities ([ADR-0004](docs/adr/0004-capabilities-not-levels.md)).
- OCI binding, specification only ([ADR-0005](docs/adr/0005-oci-transport-binding.md)).
- 43-case conformance corpus with pinned digests.

## Now: prove it is useful

1. **Outcome evaluation.** Does MOCA metadata make answers better? Measure
   citation accuracy, citation-verification rate, stale-answer rate and
   handling of contested content, with and without it, including offline on a
   device and with and without concept binding
   ([plan](docs/plans/01-outcome-evaluation.md)). If it does not help, the
   fields that do not help are removed.
2. **The .NET Reader**, `openmoca/moca-reader-dotnet`, for a first .NET host:
   Reader and Search layers, passing the whole corpus through the runner
   protocol, with an independent check of the host's outcome evaluation.
3. **Front door.** Publish the `@openmoca` packages to npm; register
   `w3id.org/moca`; keep `npm test` green.
4. **First outside adopter.** Find one organisation that exchanges knowledge
   across a boundary (a vendor shipping documentation to customers, a regulator
   publishing guidance, a platform team serving many product teams) and support
   them to production.

## Next: meet adopters where they are

1. **Bindings**, in the language Reader repositories: a
   Microsoft.Extensions.VectorData store backend and a Microsoft Agent
   Framework context provider (.NET), then LangChain/LangGraph and LlamaIndex
   retrievers. Each wraps the framework's own types and never changes a
   citation record.
2. **Extract the reference Reader.** Once the .NET Reader passes the corpus
   through the runner protocol, move `moca-core` to
   `openmoca/moca-reader-typescript`, and `moca-mcp` and the command-line tools
   to their own repository. This repository then holds only the specification,
   schemas, profiles and corpus.
3. **Python Reader**, when an adopter needs one in-process.
4. **OCI tooling**: `moca-lint push` and `pull`, following the
   [binding](spec/moca-oci-binding.md).
5. **Talk to the OKF maintainers** about the package layer as a companion
   specification ([GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard)).

## Later

1. Readers for mobile edge platforms (Swift, Kotlin), when an adopter needs one.
2. Concept expansion over `skos:broader`, `narrower` and `related` in search,
   if the outcome evaluation shows concept binding helps.
3. Data-governance profiles for NIST AI RMF and ISO/IEC 42001, following the
   [EU AI Act profile](profiles/eu-ai-act/moca-eu-ai-act-profile.md).
4. `1.0.0`: a stability review of everything normative, once the criteria in
   [GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard) are met.

## Principles

- **Borrow before inventing.** OKF for content, Sigstore and DSSE for
  signing, W3C selectors for evidence, OCI for registries, MCP for access.
- **Fail closed on identity, degrade gracefully on meaning.** Anything that
  could make the digest ambiguous is an error; anything a Reader does not
  understand is ignored and reported.
- **Evidence over argument.** A field stays in the specification if it
  measurably helps, not because it seems useful.
