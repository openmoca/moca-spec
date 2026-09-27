# Changelog

All notable changes to the MOCA specification, schemas, conformance corpus and
reference tools. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [the versioning policy](docs/versioning-and-release.md).

## [0.3.0-alpha.1] - 2026-09-27

Adds what MOCA's second purpose needs: reading and searching packages
in-process, on edge devices and client-owned infrastructure, with the same
trust rules everywhere. Also makes carrying the original sources checkable,
and brings back optional ontology as a profile. A `0.2` package is a valid
`0.3` package; see [MIGRATIONS.md](MIGRATIONS.md).

### Decisions

- [ADR-0007](docs/adr/0007-reader-interface-and-per-language-readers.md)
  supersedes ADR-0003: this repository owns a language-neutral Reader
  interface and the corpus; each language gets its own Reader repository.
- [ADR-0008](docs/adr/0008-search-backend-interface.md): one search entry point
  over pluggable backends, with policy applied in one place.
- [ADR-0009](docs/adr/0009-ontology-profile.md): the ontology profile.
- [ADR-0010](docs/adr/0010-self-contained-evidence.md): carrying the original
  sources is a capability a Reader can check.

### Specification

- [Reader contract](spec/moca-reader-contract.md): a **Search** conformance
  class, and a new §9 on backends, the search entry point, dense model checks,
  store backends and filter pushdown. Later sections move down by one.
- New diagnostics: `C011_EVIDENCE_SELECTOR_UNMATCHED`, `S006_MODEL_MISMATCH`,
  and the `O` family (`O001`-`O003`) for the ontology profile.
- Citation records gain `evidence[].verified` and `concepts`.
- [Package specification](spec/moca-package-spec.md): the
  `self-contained-evidence` capability, and profile-defined capabilities and
  diagnostics.
- New [Reader interface](spec/moca-reader-interface.md): the Reader, Search and
  Bindings operations, named once for every language.
- [Sidecar index](spec/moca-sidecar-index-spec.md): the dense model check;
  enterprise stores are store backends.

### Schemas

- `citation-record.schema.json`: optional `evidence[].verified` and `concepts`.
- New `search-hit.schema.json`.

### Profiles

- New [ontology profile](profiles/ontology/moca-ontology-profile.md): local
  Turtle SKOS/OWL files, profile-owned concept bindings with absolute IRIs, the
  `ontology` capability, and a service-catalogue example.

### Tools

- `moca-core`: `Search` with `LexicalBackend`, `DenseBackend` and
  `MemoryStoreBackend`; evidence checks against in-package text sources; the
  ontology profile (new dependency: `n3`). `Library.search()` now honours the
  requested locale over sidecar chunks.
- `moca-mcp`: search goes through `Search`; new `concepts` argument; an
  experimental `--embedder` flag for dense search.
- `moca-index`: an experimental `--embedder` writes vectors and the model
  (hybrid sidecars).
- `moca-index`, `moca-lint` and `moca-sign` bins are now executable in git.

### Conformance

- 57 cases. A new `search` case kind tests the Search class: policy, audience,
  re-checking every hit, locale, concepts and dense model checks. Ranking is
  never compared.
- Evidence and ontology cases.
- `run-conformance.mjs --reader "<cmd>"` runs the corpus against a Reader in
  another repository through a stdin/stdout adapter.

## [0.2.0-alpha.1] - 2026-09-27

The first release of MOCA as a package layer over the Open Knowledge Format.
It replaces the unreleased `0.1.0-beta.1` draft; [MIGRATIONS.md](MIGRATIONS.md)
explains how to move a draft package.

### Specification

- [Package specification](spec/moca-package-spec.md): `moca.json` with a URI
  `id`, content versioning rules, validity window, members pinned by digest,
  typed relations, profiles keyed by URI; `content/` as an OKF v0.2 bundle with
  a `moca` frontmatter mapping (evidence selectors, validity window,
  `contested_by`, audience); locale representations; derived capabilities; a
  security section on content as untrusted model input.
- Canonical digest `moca-digest-v1`: computed, never declared; symlinks,
  unreadable entries and NFC/case path collisions fail closed; hidden entries
  and `attestations/` excluded.
- [Reader contract](spec/moca-reader-contract.md): Reader and Producer classes,
  what a Reader must never do, citation records, the default retrieval policy,
  39 diagnostic codes, and rules for handing content to models.
- [Attestations](spec/moca-attestations.md): package and review predicates over
  in-toto, DSSE and Sigstore; role-scoped trust roots.
- [Sidecar index](spec/moca-sidecar-index-spec.md): the portable
  `moca-jsonl-v1` payload with byte offsets; `model` required for dense indexes.
- [OCI binding](https://github.com/openmoca/moca-spec/blob/v0.3.0-alpha.1/spec/moca-oci-binding.md).

### Schemas

- `schemas/v1/`: manifest, node, citation record, sidecar index, review
  predicate, trust root.

### Profiles

- Agent Skills (formats match the upstream specification exactly), claims
  (nanopublications), and EU AI Act data governance (no risk classification
  of packages).

### Tools

- New `moca-core`: the reference Reader.
- New `moca-mcp`: an MCP server with `moca_list_packages`, `moca_search` and
  `moca_get_node`.
- `moca-lint`, `moca-sign`, `moca-index` and `moca-convert` rebuilt on
  `moca-core`. `moca-sign` writes detached package and review attestations;
  `moca-index` writes `moca-jsonl-v1` sidecars with heading chunking;
  `moca-convert` emits OKF-conformant nodes.

### Conformance

- 43 cases covering every error and warning family, digest agreement across
  directory, archive and hidden entries, attestation outcomes, members and
  sidecars.
