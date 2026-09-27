# Changelog

All notable changes to the MOCA specification, schemas, conformance corpus and
reference tools. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [the versioning policy](docs/versioning-and-release.md).

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
- [OCI binding](spec/moca-oci-binding.md).

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
