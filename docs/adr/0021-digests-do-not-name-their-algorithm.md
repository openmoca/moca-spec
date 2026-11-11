# 0021 — Digests do not name their algorithm

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A package digest is written `sha256:<hex>`. It does not say whether it was
computed with `moca-digest-v1` or `moca-digest-v2`, so a pin made under one
looks like a pin made under the other.

## Options

1. Prefix every digest with its algorithm: `moca-digest-v2:sha256:…`.
2. Add a `digestAlgorithm` field beside every pin and subject.
3. Keep the digest string as it is: `mocaVersion` says which algorithm
   applies, and a package written for `0.3` or earlier is reported with
   `M008`.

## Decision

Option 3 ([package spec §14](../../spec/moca-package-spec.md#14-versioning-of-this-specification)).
Options 1 and 2 would change every digest, pin and signed subject written so
far, to guard against an algorithm change that has happened once, before 0.4.

## Consequences

- Digests, pins and attestations from 0.4 onwards stay valid.
- A pin does not carry its algorithm. A host that keeps pins from before 0.4
  must know their age; `M008` tells it which packages are affected.

## What would change this decision

A third digest algorithm. It would come with a named form, through a new ADR.
