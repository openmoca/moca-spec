# Roadmap

MOCA's job is narrow: a package layer that makes OKF knowledge exchangeable,
verifiable, composable and citable. The roadmap is ordered by what would prove
or disprove that it is worth having.

This file describes direction. What shipped is in [CHANGELOG.md](CHANGELOG.md).

## Done in 0.2.0-alpha.1

- Package layer over OKF v0.2 ([ADR-0001](docs/adr/0001-package-layer-over-okf.md)).
- Computed digest with fail-closed entry rules; members pinned by digest;
  detached package and review attestations ([ADR-0002](docs/adr/0002-computed-digest-and-detached-attestations.md)).
- Reference Reader, citation records, default retrieval policy, MCP server
  ([ADR-0003](docs/adr/0003-reader-mcp-server-and-adapters.md)).
- Named capabilities ([ADR-0004](docs/adr/0004-capabilities-not-levels.md)).
- OCI binding, specification only ([ADR-0005](docs/adr/0005-oci-transport-binding.md)).
- 43-case conformance corpus with pinned digests.

## Now: prove it is useful

1. **Outcome evaluation.** Does MOCA metadata make answers better? Measure
   citation accuracy, stale-answer rate and handling of contested content, with
   and without it ([plan](docs/plans/01-outcome-evaluation.md)). If it does not
   help, the fields that do not help are removed.
2. **Front door.** Publish the `@openmoca` packages to npm; register
   `w3id.org/moca`; keep `npm test` green.
3. **First outside adopter.** Find one organisation that exchanges knowledge
   across a boundary (a vendor shipping documentation to customers, a regulator
   publishing guidance, a platform team serving many product teams) and support
   them to production.

## Next: meet adopters where they are

1. **Framework adapters**, each in its own repository: a LlamaIndex reader, a
   LangChain loader, a Microsoft.Extensions.DataIngestion reader. Each maps
   citation records to the framework's metadata and stores the package digest
   on every record for incremental re-ingest.
2. **OCI tooling**: `moca-lint push` and `pull`, following the
   [binding](spec/moca-oci-binding.md).
3. **A second Reader** in the language of the first adopter who needs one
   in-process, tested against the corpus.
4. **Talk to the OKF maintainers** about the package layer as a companion
   specification ([GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard)).

## Later

1. Dense sidecar indexes: an embedding back end for `moca-index`.
2. Data-governance profiles for NIST AI RMF and ISO/IEC 42001, following the
   [EU AI Act profile](profiles/eu-ai-act/moca-eu-ai-act-profile.md).
3. `1.0.0`: a stability review of everything normative, once the criteria in
   [GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard) are met.

## Principles

- **Borrow before inventing.** OKF for content, Sigstore and DSSE for
  signing, W3C selectors for evidence, OCI for registries, MCP for access.
- **Fail closed on identity, degrade gracefully on meaning.** Anything that
  could make the digest ambiguous is an error; anything a Reader does not
  understand is ignored and reported.
- **Evidence over argument.** A field stays in the specification if it
  measurably helps, not because it seems useful.
