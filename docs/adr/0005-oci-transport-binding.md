# 0005 — OCI registries as an optional transport binding

- **Status:** Superseded by [0015](0015-park-unconsumed-features.md)
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

MOCA declined to specify distribution and version resolution, which left
composition without a way to fetch members. OCI registries solve
content-addressed distribution and exist in every cloud. But making packages
registry-only would lose the property that a folder is a complete package that
works offline.

## Decision

A [binding](https://github.com/openmoca/moca-spec/blob/v0.3.0-alpha.1/spec/moca-oci-binding.md) says how to store a `.moca`
archive as an OCI artifact, with the MOCA digest as an annotation and
attestations optionally attached as referrers. The MOCA digest, not the OCI
digest, is what pins, attestations and sidecars rely on, and a Reader always
recomputes it after a pull. Folders and `.moca` files remain first-class.

## Consequences

- Hosts that want a registry use one they already operate, with ORAS or any
  OCI client.
- A registry never needs to be trusted: a pulled member is checked against its
  pin.
- Reference `push`/`pull` tooling is still to be written.

## What would change this decision

A knowledge-specific registry that adopters prefer to OCI, or OKF defining its
own distribution.
