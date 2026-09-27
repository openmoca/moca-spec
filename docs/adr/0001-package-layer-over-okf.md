# 0001 — MOCA is a package layer over the Open Knowledge Format

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

The [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
(OKF), published by Google Cloud, defines knowledge as a directory of Markdown
files with YAML frontmatter and one required field, `type`. Version 0.2 (July
2026) added trust signals: `generated`, `verified` (a list of who checked and
when, with `human:` actors), `status`, `stale_after` and `sources`.

OKF deliberately defines no packaging: no package identity or version, no
integrity, no signing, and no way to compose bundles or relate versions of
them. [MIF](https://github.com/modeled-information-format/MIF) builds a richer
content model on top of OKF and has a container envelope with per-record
hashes, but no whole-package digest or signature.

An earlier MOCA draft defined its own content model: node frontmatter, a
six-value `epistemicStatus` enum, a claims graph, ontology roles and three
conformance levels. Its content model competed with OKF on OKF's own ground,
and its single status enum mixed four independent questions (where content
came from, who checked it, whether it is disputed, whether it is current).

## Options

1. Keep a separate MOCA content model beside OKF.
2. Become an OKF profile only: no package layer.
3. Adopt OKF for content and define only what OKF leaves out: a package layer.

## Decision

Option 3. `content/` is an OKF v0.2 bundle. MOCA reads OKF's trust fields
with OKF's meaning and adds, under a single `moca` frontmatter key, only what
OKF lacks: evidence selectors inside a source, a validity window, a
`contested_by` pointer and an audience label. At package level MOCA adds
identity, content versioning, a transport-independent digest, attestations,
members pinned by digest, typed relations between versions, and a
degradation contract.

The claims graph and RDF machinery move to an optional
[claims profile](../../profiles/claims/moca-claims-profile.md) based on
nanopublications.

## Consequences

- "Why not just OKF?" has a one-line answer: OKF has no packaging, integrity,
  signing or composition.
- Every node needs OKF frontmatter with a `type`. The bar rises from "a folder
  of Markdown" to "a folder of Markdown with a line of frontmatter per file";
  `moca-convert` adds it automatically.
- MOCA follows OKF's versions. A breaking OKF change is a breaking MOCA change.
- A small, clean package layer could later be offered to the OKF project as a
  companion specification.

## What would change this decision

OKF adding its own package manifest, digest and signing. MOCA would then
become a profile of that, or be retired.
