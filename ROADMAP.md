# Roadmap

MOCA is portable grounding for AI: a package (structure, content, evidence,
with trust across them), an open Reader per language, and applications built
on both. The roadmap is ordered by what would prove or disprove that it is
worth having.

This file describes direction. What shipped is in [CHANGELOG.md](CHANGELOG.md).

## Done in 0.4.0-alpha.1

- Three pillars (MOCA Package, Reader, Application) and an admission test for
  what enters the standard ([ADR-0011](docs/adr/0011-three-pillars-and-admission-test.md)).
- A structure core, and structure operations in the Reader
  ([ADR-0012](docs/adr/0012-structure-core.md)); application and organisation
  overlays ([ADR-0013](docs/adr/0013-package-application-organisation-layers.md));
  pluggable ontology-guided retrieval with the gate always last
  ([ADR-0016](docs/adr/0016-pluggable-ontology-guided-retrieval.md)).
- `moca-digest-v2` over a BagIt-style manifest ([ADR-0014](docs/adr/0014-digest-v2-bagit-manifest.md)).
- Defect fixes: versioned node references, `evidence[].matched`, resource
  limits, store search from ingest-time records.
- Normalised evidence matching, WebVTT captions and media time ranges; binary
  sidecar vectors; MCP resources and a structure tool.
- Skills, claims, EU AI Act and OCI parked ([ADR-0015](docs/adr/0015-park-unconsumed-features.md)).
- A 76-case corpus.

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

1. **Two pilots and the outcome evaluation.** One pilot in the first
   application's domain, and one in a different domain with existing
   structure (manuals or SOPs, or a regulation with amendments). Measure
   answer accuracy, scope violations, order errors, citation matching and
   stale answers, with and without MOCA and with and without structure
   ([plan](docs/plans/01-outcome-evaluation.md)), with an outside reviewer.
   Gates decided in advance: structure stays in core only if it reduces scope
   violations or order errors in both pilots.
2. **The .NET Reader**, `openmoca/moca-reader-dotnet`, for a first .NET host,
   built against 0.4: read, search, structure operations and the Agent
   Framework binding, passing the whole corpus through the runner protocol.
3. **Package signing with OpenSSF Model Signing** (0.5), after a spike
   against its specification and tooling
   ([ADR-0014](docs/adr/0014-digest-v2-bagit-manifest.md)).
4. **Front door.** Publish the `@openmoca` packages to npm; register
   `w3id.org/moca`; keep `npm test` green.
5. **First outside adopter.** Find one organisation that exchanges knowledge
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
4. **Talk to the OKF maintainers** about the package layer as a companion
   specification ([GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard)).

## Later

1. Readers for mobile edge platforms (Swift, Kotlin), when an adopter needs one.
2. Manifest overlays (application and organisation additions to `moca.json`),
   once two use cases need them.
3. Importers from structured sources (for example DITA maps), as tooling
   beside the Reader.
4. `1.0.0`: a stability review of everything normative, once the criteria in
   [GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard) are met.

## Principles

- **Borrow before inventing.** OKF for content, SKOS and Dublin Core for
  structure, BagIt for the manifest, Sigstore and DSSE for signing, W3C
  selectors, Media Fragments and WebVTT for evidence, MCP for access.
- **Two use cases or it stays out.** A feature enters the package or the
  Reader only when two use cases need it, one of them real and named
  ([ADR-0011](docs/adr/0011-three-pillars-and-admission-test.md)).
- **Fail closed on identity, degrade gracefully on meaning.** Anything that
  could make the digest ambiguous is an error; anything a Reader does not
  understand is ignored and reported.
- **Evidence over argument.** A field stays in the specification if it
  measurably helps, not because it seems useful.
